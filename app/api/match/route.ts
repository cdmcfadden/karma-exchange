import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { findMatches } from "@/lib/matching";

export const runtime = "nodejs";
export const maxDuration = 30;

async function gatherDebug(service: ReturnType<typeof createServiceClient>, userId: string) {
  const [usersRes, completedRes, embeddingsRes, skillsRes] = await Promise.all([
    service
      .from("users")
      .select("id", { count: "exact", head: true })
      .neq("id", userId),
    service
      .from("users")
      .select("id", { count: "exact", head: true })
      .neq("id", userId)
      .not("wheelhouse_completed_at", "is", null),
    service
      .from("wheelhouse_skills")
      .select("user_id", { count: "exact", head: true })
      .neq("user_id", userId)
      .not("embedding", "is", null),
    service
      .from("wheelhouse_skills")
      .select("user_id, skill_name, category, level, embedding")
      .neq("user_id", userId)
      .limit(20),
  ]);

  const skills = (skillsRes.data ?? []).map((s) => ({
    user_id: s.user_id,
    skill_name: s.skill_name,
    category: s.category,
    level: s.level,
    has_embedding: s.embedding !== null,
  }));

  return {
    total_users: usersRes.count ?? 0,
    completed_wheelhouse: completedRes.count ?? 0,
    with_embeddings: embeddingsRes.count ?? 0,
    candidate_skills: skills,
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { text } = (await req.json()) as { text?: string };
  if (!text || text.trim().length < 8) {
    return NextResponse.json({ matches: [] });
  }

  const service = createServiceClient();

  try {
    const matches = await findMatches({
      requestText: text,
      requesterId: user.id,
      limit: 5,
    });

    const debug = await gatherDebug(service, user.id);
    debug.candidate_skills; // always included now

    console.log(
      `[match] query="${text.slice(0, 60)}…" matches=${matches.length} users=${debug.total_users} completed=${debug.completed_wheelhouse} embedded=${debug.with_embeddings}`,
    );

    return NextResponse.json({ matches, debug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "match failed";
    console.error("[match] error:", msg);

    const debug = await gatherDebug(service, user.id).catch(() => null);

    return NextResponse.json(
      { error: msg, matches: [], debug },
      { status: 500 },
    );
  }
}
