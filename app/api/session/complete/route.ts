import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyKarmaTransaction, KARMA_CONFIG } from "@/lib/karma";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, rating, feedback } = parsed.data;

  const service = createServiceClient();

  const { data: session } = await service
    .from("sessions")
    .select("id, helper_id, receiver_id, karma_cost, status")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.helper_id !== user.id && session.receiver_id !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }
  if (session.status === "completed") {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const isReceiver = session.receiver_id === user.id;

  const update: Record<string, unknown> = {};
  if (isReceiver) {
    update.receiver_rating = rating;
    update.receiver_feedback = feedback ?? null;
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  } else {
    update.helper_rating = rating;
    update.helper_feedback = feedback ?? null;
  }

  const { error: updateError } = await service.from("sessions").update(update).eq("id", sessionId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Receiver marking complete is the karma-releasing event
  if (isReceiver) {
    // Credit helper with session karma
    await applyKarmaTransaction({
      userId: session.helper_id,
      amount: session.karma_cost,
      type: "session_earn",
      refId: sessionId,
      description: "Session help provided",
    });

    if (rating === 5) {
      await applyKarmaTransaction({
        userId: session.helper_id,
        amount: KARMA_CONFIG.RATING_5_STAR_BONUS,
        type: "rating_bonus",
        refId: sessionId,
        description: "5-star rating bonus",
      });
    }

    // Increment reciprocity counters
    await Promise.all([
      service.rpc("increment", { table_name: "users", id: session.helper_id, column: "total_given" }).throwOnError().then(
        () => {},
        async () => {
          // Fallback: read-modify-write (acceptable for v1 scale)
          const { data: h } = await service
            .from("users")
            .select("total_given")
            .eq("id", session.helper_id)
            .single();
          if (h) {
            await service
              .from("users")
              .update({ total_given: (h.total_given ?? 0) + 1 })
              .eq("id", session.helper_id);
          }
        },
      ),
      service.rpc("increment", { table_name: "users", id: session.receiver_id, column: "total_received" }).throwOnError().then(
        () => {},
        async () => {
          const { data: r } = await service
            .from("users")
            .select("total_received")
            .eq("id", session.receiver_id)
            .single();
          if (r) {
            await service
              .from("users")
              .update({ total_received: (r.total_received ?? 0) + 1 })
              .eq("id", session.receiver_id);
          }
        },
      ),
    ]);
  }

  return NextResponse.json({ ok: true });
}
