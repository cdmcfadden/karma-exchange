import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyKarmaTransaction, KARMA_CONFIG } from "@/lib/karma";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Check if already granted
  const { data: existing } = await supabase
    .from("karma_transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "welcome_grant")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already_granted: true });
  }

  try {
    const balance = await applyKarmaTransaction({
      userId: user.id,
      amount: KARMA_CONFIG.WELCOME_GRANT,
      type: "welcome_grant",
      description: "Welcome to Karma! 500 karma to get started.",
    });
    return NextResponse.json({ ok: true, balance });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
