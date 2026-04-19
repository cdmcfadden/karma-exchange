import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { embed } from "@/lib/embeddings";
import {
  wheelhouseBuilderSystemPrompt,
  extractSkillTool,
  extractSeekTool,
} from "@/lib/prompts/wheelhouse-builder";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Streams Claude's response to the wheelhouse builder conversation.
 * When Claude emits extract_skill / extract_seek tool calls, we persist them
 * to the DB (which triggers the Supabase Realtime update the client subscribes to).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Save user message to history
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg?.role === "user") {
    await supabase.from("wheelhouse_messages").insert({
      user_id: user.id,
      role: "user",
      content: lastUserMsg.content,
    });
  }

  const encoder = new TextEncoder();
  const service = createServiceClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: wheelhouseBuilderSystemPrompt,
          tools: [extractSkillTool, extractSeekTool],
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        });

        let assistantText = "";
        const pendingToolCalls: Array<{
          id: string;
          name: string;
          inputJson: string;
        }> = [];
        let currentToolIdx: number | null = null;

        for await (const event of response) {
          if (event.type === "content_block_start") {
            if (event.content_block.type === "tool_use") {
              pendingToolCalls.push({
                id: event.content_block.id,
                name: event.content_block.name,
                inputJson: "",
              });
              currentToolIdx = pendingToolCalls.length - 1;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_called",
                    name: event.content_block.name,
                  })}\n\n`,
                ),
              );
              console.log(`[wheelhouse] Claude called tool: ${event.content_block.name}`);
            } else if (event.content_block.type === "text") {
              currentToolIdx = null;
            }
          } else if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              assistantText += event.delta.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", value: event.delta.text })}\n\n`,
                ),
              );
            } else if (event.delta.type === "input_json_delta" && currentToolIdx !== null) {
              pendingToolCalls[currentToolIdx].inputJson += event.delta.partial_json;
            }
          }
        }

        // Process tool calls — persist to DB
        for (const tc of pendingToolCalls) {
          let stage: "parse" | "embed" | "insert" = "parse";
          try {
            const input = JSON.parse(tc.inputJson);
            console.log(`[wheelhouse] tool=${tc.name} input=`, input);
            if (tc.name === "extract_skill") {
              stage = "embed";
              const text = `${input.skill_name} (${input.category}) - ${input.evidence_text}`;
              const embedding = await embed(text);
              stage = "insert";
              const { error: insertErr } = await service
                .from("wheelhouse_skills")
                .insert({
                  user_id: user.id,
                  category: input.category,
                  skill_name: input.skill_name,
                  level: input.level,
                  years_experience: input.years_experience ?? null,
                  evidence_text: input.evidence_text,
                  embedding: embedding as unknown as string,
                });
              if (insertErr) throw insertErr;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "skill_added",
                    skill: {
                      category: input.category,
                      skill_name: input.skill_name,
                      level: input.level,
                    },
                  })}\n\n`,
                ),
              );
            } else if (tc.name === "extract_seek") {
              stage = "embed";
              const embedding = await embed(input.goal_description);
              stage = "insert";
              const { error: insertErr } = await service
                .from("wheelhouse_seeks")
                .insert({
                  user_id: user.id,
                  category: input.category,
                  goal_description: input.goal_description,
                  current_level: input.current_level ?? null,
                  embedding: embedding as unknown as string,
                });
              if (insertErr) throw insertErr;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "seek_added",
                    seek: {
                      category: input.category,
                      goal_description: input.goal_description,
                    },
                  })}\n\n`,
                ),
              );
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
              `[wheelhouse] tool=${tc.name} stage=${stage} failed:`,
              err,
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  stage: `tool_${stage}`,
                  tool: tc.name,
                  value: message,
                })}\n\n`,
              ),
            );
          }
        }

        // Save assistant message
        if (assistantText) {
          await supabase.from("wheelhouse_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: assistantText,
          });
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
