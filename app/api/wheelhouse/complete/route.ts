import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Require at least 2 skills before marking complete
  const { data: skills } = await supabase
    .from("wheelhouse_skills")
    .select("id")
    .eq("user_id", user.id);

  if (!skills || skills.length < 2) {
    return NextResponse.json(
      { error: "Add at least 2 skills before completing your wheelhouse." },
      { status: 400 },
    );
  }

  await supabase
    .from("users")
    .update({ wheelhouse_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
