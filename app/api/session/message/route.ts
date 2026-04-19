import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const postSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // RLS ensures user is a participant
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .single();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: messages, error } = await supabase
    .from("session_messages")
    .select("id, sender_id, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // RLS ensures the user is a participant
  const { data: session } = await supabase
    .from("sessions")
    .select("id, helper_id, receiver_id")
    .eq("id", parsed.data.sessionId)
    .single();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: message, error } = await supabase
    .from("session_messages")
    .insert({
      session_id: parsed.data.sessionId,
      sender_id: user.id,
      content: parsed.data.content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message });
}
