import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WheelhouseChat } from "@/components/WheelhouseChat";
import { WheelhousePreview } from "@/components/WheelhousePreview";
import { ValidationPanel } from "@/components/validation/ValidationPanel";

export default async function WheelhousePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="h-full flex overflow-hidden">
      <aside
        className="hidden md:block w-80 overflow-hidden"
        style={{ background: "rgba(232,212,168,0.03)", borderRight: "1px solid rgba(232,212,168,0.08)" }}
      >
        <WheelhousePreview userId={user.id} />
      </aside>
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ borderRight: "1px solid rgba(232,212,168,0.08)" }}
      >
        <WheelhouseChat userId={user.id} />
      </div>
      <aside
        className="hidden lg:block w-80 overflow-hidden"
        style={{ background: "rgba(127,184,176,0.03)" }}
      >
        <ValidationPanel userId={user.id} />
      </aside>
    </div>
  );
}
