import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ sessionId: z.string().uuid() });

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
    .select("id, helper_id, status")
    .eq("id", parsed.data.sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.helper_id !== user.id) {
    return NextResponse.json({ error: "Only the helper can accept" }, { status: 403 });
  }
  if (session.status !== "pending") {
    return NextResponse.json({ error: "Session is not pending" }, { status: 400 });
  }

  const { error } = await service
    .from("sessions")
    .update({ status: "accepted" })
    .eq("id", parsed.data.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
