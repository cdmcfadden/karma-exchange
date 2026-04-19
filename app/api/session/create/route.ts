import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyKarmaTransaction, sessionCost } from "@/lib/karma";
import { z } from "zod";

const schema = z.object({
  helperId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  sessionType: z.enum(["express", "standard", "deep"]),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { helperId, requestId, sessionType, scheduledAt } = parsed.data;

  if (helperId === user.id) {
    return NextResponse.json({ error: "Cannot request a session with yourself" }, { status: 400 });
  }

  const cost = sessionCost(sessionType);

  // Verify user has enough karma
  const { data: me } = await supabase
    .from("users")
    .select("karma_points, reciprocity_status")
    .eq("id", user.id)
    .single();

  if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (me.reciprocity_status === "red") {
    return NextResponse.json(
      {
        error:
          "Your reciprocity is locked. Help someone with your skills before requesting another session.",
      },
      { status: 403 },
    );
  }
  if (me.karma_points < cost) {
    return NextResponse.json(
      { error: `Not enough karma. You need ${cost}, you have ${me.karma_points}.` },
      { status: 402 },
    );
  }

  const service = createServiceClient();

  // Create session row (pending — helper must accept)
  const { data: session, error: sessionError } = await service
    .from("sessions")
    .insert({
      request_id: requestId ?? null,
      helper_id: helperId,
      receiver_id: user.id,
      session_type: sessionType,
      karma_cost: cost,
      scheduled_at: scheduledAt ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? "Insert failed" }, { status: 500 });
  }

  // Debit karma from receiver (held in escrow until session completes or is cancelled)
  try {
    await applyKarmaTransaction({
      userId: user.id,
      amount: -cost,
      type: "session_spend",
      refId: session.id,
      description: `Session request (${sessionType})`,
    });
  } catch (err) {
    // Rollback session
    await service.from("sessions").delete().eq("id", session.id);
    const msg = err instanceof Error ? err.message : "karma transaction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, session });
}
