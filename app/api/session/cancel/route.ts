import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyKarmaTransaction } from "@/lib/karma";
import { z } from "zod";

const schema = z.object({ sessionId: z.string().uuid(), reason: z.string().optional() });

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

  const service = createServiceClient();
  const { data: session } = await service
    .from("sessions")
    .select("id, helper_id, receiver_id, karma_cost, status")
    .eq("id", parsed.data.sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.helper_id !== user.id && session.receiver_id !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }
  if (session.status === "completed") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  // Refund the receiver's karma
  await applyKarmaTransaction({
    userId: session.receiver_id,
    amount: session.karma_cost,
    type: "session_refund",
    refId: session.id,
    description: `Session cancelled${parsed.data.reason ? `: ${parsed.data.reason}` : ""}`,
  });

  await service.from("sessions").update({ status: "cancelled" }).eq("id", session.id);
  return NextResponse.json({ ok: true });
}
