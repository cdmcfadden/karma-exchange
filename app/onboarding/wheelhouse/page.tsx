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
    <div className="h-screen flex flex-col" style={{ background: "var(--void)" }}>
      <header style={{ borderBottom: "1px solid rgba(232,212,168,0.1)", background: "rgba(5,3,8,0.6)", backdropFilter: "blur(8px)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, color: "var(--brass-bright)", fontStyle: "italic", margin: 0 }}>
            Build your Wheelhouse
          </h1>
          <p className="font-mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.15em", marginTop: 4 }}>
            SHARE WHAT YOU KNOW · WE&apos;LL EXTRACT YOUR SKILLS
          </p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
          <strong style={{ color: "var(--sand)" }}>{profile.display_name}</strong>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview: left sidebar */}
        <aside className="hidden md:block w-80 overflow-hidden" style={{ background: "rgba(232,212,168,0.03)", borderRight: "1px solid rgba(232,212,168,0.08)" }}>
          <WheelhousePreview userId={user.id} />
        </aside>
        {/* Chat: center */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ borderRight: "1px solid rgba(232,212,168,0.08)" }}>
          <WheelhouseChat userId={user.id} />
        </div>
        {/* Validation suggestions: right sidebar */}
        <aside className="hidden lg:block w-80 overflow-hidden" style={{ background: "rgba(127,184,176,0.03)" }}>
          <ValidationPanel userId={user.id} />
        </aside>
      </div>
    </div>
  );
}
