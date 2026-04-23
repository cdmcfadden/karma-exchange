import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileBar } from "@/components/ProfileBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "display_name, avatar_url, karma_points, karma_rank, reciprocity_status, wheelhouse_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/profile");
  if (!profile.wheelhouse_completed_at) redirect("/onboarding/wheelhouse");

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--void)" }}>
      <ProfileBar
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        karmaPoints={profile.karma_points}
        karmaRank={profile.karma_rank}
        reciprocityStatus={profile.reciprocity_status}
        userId={user.id}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
