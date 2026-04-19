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
      {/* Preview: left sidebar */}
      <aside className="hidden md:block w-80 bg-slate-50/60 border-r overflow-hidden">
        <WheelhousePreview userId={user.id} />
      </aside>
      {/* Chat: center */}
      <div className="flex-1 flex flex-col min-w-0 border-r overflow-hidden">
        <WheelhouseChat userId={user.id} />
      </div>
      {/* Validation: right sidebar */}
      <aside className="hidden lg:block w-80 bg-emerald-50/40 overflow-hidden">
        <ValidationPanel userId={user.id} />
      </aside>
    </div>
  );
}
