import { createServiceClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/claude";
import { embed } from "@/lib/embeddings";
import { matchRerankSystemPrompt } from "@/lib/prompts/match-rerank";

export interface MatchCandidate {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  karma_rank: number;
  reciprocity_status: "green" | "amber" | "red";
  top_skill_category: string;
  top_skill_name: string;
  top_skill_level: string;
  skill_similarity: number;
  reciprocity_bonus: number;
  rank_boost: number;
  final_score: number;
  why_match?: string; // Populated after Claude re-rank
}

/**
 * Given a raw request text, returns the top N matches.
 * Step 1: embed the request.
 * Step 2: pgvector search via match_candidates stored proc (returns top 10 with scores).
 * Step 3: Claude Haiku re-ranks with a brief "why this match" blurb per candidate.
 */
export async function findMatches(args: {
  requestText: string;
  requesterId: string;
  limit?: number;
}): Promise<MatchCandidate[]> {
  const limit = args.limit ?? 5;
  const supabase = createServiceClient();

  // Step 1: embed the request
  const requestEmbedding = await embed(args.requestText);
  console.log(`[match] embedded request (${args.requestText.length} chars)`);

  // Step 2: pgvector search (top 10)
  const { data: candidates, error } = await supabase.rpc("match_candidates", {
    p_request_embedding: requestEmbedding as unknown as string, // pgvector accepts array
    p_requester_id: args.requesterId,
    p_limit: 10,
  });
  if (error) throw new Error(`match_candidates failed: ${error.message}`);
  console.log(`[match] match_candidates returned ${candidates?.length ?? 0} candidates`);
  if (!candidates || candidates.length === 0) return [];

  const topCandidates = candidates as MatchCandidate[];

  // Step 3: Claude re-rank top candidates
  try {
    const reranked = await rerankWithClaude(args.requestText, topCandidates);
    return reranked.slice(0, limit);
  } catch (err) {
    console.error("Claude re-rank failed, returning embedding-only ranking", err);
    return topCandidates.slice(0, limit);
  }
}

async function rerankWithClaude(
  requestText: string,
  candidates: MatchCandidate[],
): Promise<MatchCandidate[]> {
  const userMsg = JSON.stringify({
    request: requestText,
    candidates: candidates.map((c, i) => ({
      idx: i,
      display_name: c.display_name,
      top_skill: `${c.top_skill_name} (${c.top_skill_level})`,
      category: c.top_skill_category,
      karma_rank: c.karma_rank,
      similarity: c.skill_similarity.toFixed(2),
      reciprocity: c.reciprocity_bonus.toFixed(2),
    })),
  });

  const response = await anthropic.messages.create({
    model: CLAUDE_FAST_MODEL,
    max_tokens: 1024,
    system: matchRerankSystemPrompt,
    messages: [{ role: "user", content: userMsg }],
    tool_choice: { type: "tool", name: "rank_matches" },
    tools: [
      {
        name: "rank_matches",
        description: "Return the reranked candidates with a short match rationale.",
        input_schema: {
          type: "object",
          properties: {
            ranked: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  idx: { type: "number" },
                  why_match: {
                    type: "string",
                    description: "One short sentence explaining why this is a great match.",
                  },
                },
                required: ["idx", "why_match"],
              },
            },
          },
          required: ["ranked"],
        },
      },
    ],
  });

  // Extract tool use result
  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a rank_matches tool call");
  }
  const ranked = (toolUse.input as { ranked: Array<{ idx: number; why_match: string }> })
    .ranked;

  // Reorder candidates per Claude's ranking, attach why_match
  const results: MatchCandidate[] = [];
  for (const r of ranked) {
    const c = candidates[r.idx];
    if (c) results.push({ ...c, why_match: r.why_match });
  }
  return results;
}
