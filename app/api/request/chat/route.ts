import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/claude";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { embed } from "@/lib/embeddings";
import {
  requestCoachSystemPrompt,
  finalizeRequestTool,
} from "@/lib/prompts/request-coach";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const encoder = new TextEncoder();
  const service = createServiceClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Keep last 8 messages to avoid unbounded context growth
        const trimmed = messages.length > 8 ? messages.slice(-8) : messages;
        // Ensure conversation starts with a user message (API requirement)
        const safeMessages =
          trimmed[0]?.role === "assistant" ? trimmed.slice(1) : trimmed;

        const response = await anthropic.messages.create({
          model: CLAUDE_FAST_MODEL,
          max_tokens: 1024,
          system: requestCoachSystemPrompt,
          tools: [finalizeRequestTool],
          messages: safeMessages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        });

        const pendingTools: Array<{ name: string; inputJson: string }> = [];
        let currentIdx: number | null = null;

        for await (const event of response) {
          if (event.type === "content_block_start") {
            if (event.content_block.type === "tool_use") {
              pendingTools.push({ name: event.content_block.name, inputJson: "" });
              currentIdx = pendingTools.length - 1;
            } else {
              currentIdx = null;
            }
          } else if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", value: event.delta.text })}\n\n`,
                ),
              );
            } else if (event.delta.type === "input_json_delta" && currentIdx !== null) {
              pendingTools[currentIdx].inputJson += event.delta.partial_json;
            }
          }
        }

        // Finalize request if Claude called the tool
        for (const tc of pendingTools) {
          if (tc.name !== "finalize_request") continue;
          try {
            const input = JSON.parse(tc.inputJson);
            const embedding = await embed(input.description);
            const { data: inserted } = await service
              .from("requests")
              .insert({
                user_id: user.id,
                description: input.description,
                category: input.category,
                urgency: input.urgency,
                embedding: embedding as unknown as string,
                status: "active",
              })
              .select("id")
              .single();
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "request_finalized",
                  request_id: inserted?.id,
                })}\n\n`,
              ),
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("finalize_request failed:", err);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", value: `Finalize failed: ${msg}` })}\n\n`,
              ),
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", value: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
