import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/claude";
import { hintsGeneratorSystemPrompt, suggestHintsTool } from "@/lib/prompts/hints-generator";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { text } = (await req.json()) as { text?: string };
  if (!text || text.trim().length < 20) {
    return NextResponse.json({ hints: [] });
  }

  // Connected integrations (so we don't suggest ones already set up)
  const { data: integrations } = await supabase
    .from("user_integrations")
    .select("provider")
    .eq("user_id", user.id);
  const connected = (integrations ?? []).map((i) => i.provider);

  // Summarize wheelhouse for context
  const { data: skills } = await supabase
    .from("wheelhouse_skills")
    .select("category, skill_name, level")
    .eq("user_id", user.id)
    .limit(10);

  const userMsg = JSON.stringify({
    request: text,
    connected_integrations: connected,
    wheelhouse: skills ?? [],
  });

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_FAST_MODEL,
      max_tokens: 600,
      system: hintsGeneratorSystemPrompt,
      tools: [suggestHintsTool],
      tool_choice: { type: "tool", name: "suggest_hints" },
      messages: [{ role: "user", content: userMsg }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ hints: [] });
    }
    const { hints } = toolUse.input as {
      hints: Array<{
        type: string;
        action: string;
        title: string;
        description: string;
      }>;
    };
    return NextResponse.json({ hints });
  } catch (err) {
    console.error("Hints error:", err);
    return NextResponse.json({ hints: [] });
  }
}
