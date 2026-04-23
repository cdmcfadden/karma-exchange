import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionChat } from "@/components/SessionChat";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Verify user is a participant (RLS enforces this)
  const { data: session } = await supabase
    .from("sessions")
    .select("id, helper_id, receiver_id, status, session_type")
    .eq("id", sessionId)
    .single();

  if (!session) redirect("/app");
  if (!["accepted", "in_progress", "completed"].includes(session.status)) {
    redirect("/app");
  }

  const partnerId =
    session.helper_id === user.id ? session.receiver_id : session.helper_id;

  const { data: partner } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", partnerId)
    .single();

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white px-4 md:px-6 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            Session with {partner?.display_name ?? "Partner"}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {session.session_type} · {session.status}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <SessionChat
          sessionId={sessionId}
          currentUserId={user.id}
          partnerName={partner?.display_name ?? "Partner"}
        />
      </div>
    </div>
  );
}
