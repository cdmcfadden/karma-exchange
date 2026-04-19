import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WheelhouseChat } from "@/components/WheelhouseChat";
import { WheelhousePreview } from "@/components/WheelhousePreview";
import { ValidationPanel } from "@/components/validation/ValidationPanel";

export default async function WheelhouseBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, wheelhouse_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/profile");
  // Completed users go to the /app/wheelhouse (unified nav)
  if (profile.wheelhouse_completed_at) redirect("/app/wheelhouse");

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b bg-white px-4 md:px-8 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-violet-700 truncate">
            Build your Wheelhouse
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            Share what you're good at. We'll extract your skills as you go.
          </p>
        </div>
        <div className="text-sm text-muted-foreground shrink-0">
          Hi, <strong>{profile.display_name}</strong>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview: left sidebar */}
        <aside className="hidden md:block w-80 bg-slate-50/60 border-r overflow-hidden">
          <WheelhousePreview userId={user.id} />
        </aside>
        {/* Chat: center */}
        <div className="flex-1 flex flex-col min-w-0 border-r overflow-hidden">
          <WheelhouseChat userId={user.id} />
        </div>
        {/* Validation suggestions: right sidebar */}
        <aside className="hidden lg:block w-80 bg-emerald-50/40 overflow-hidden">
          <ValidationPanel userId={user.id} />
        </aside>
      </div>
    </div>
  );
}
