import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKarma } from "@/lib/utils";
import { Coins, Trophy, TrendingUp, TrendingDown } from "lucide-react";

export default async function KarmaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("karma_points, karma_rank, total_given, total_received")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("karma_transactions")
    .select("id, amount, type, description, balance_after, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!profile) redirect("/onboarding/profile");

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Your Karma</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Coins className="w-5 h-5 text-violet-600" />}
            label="Balance"
            value={formatKarma(profile.karma_points)}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-amber-600" />}
            label="Rank"
            value={formatKarma(profile.karma_rank)}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Given"
            value={profile.total_given.toString()}
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
            label="Received"
            value={profile.total_received.toString()}
          />
        </div>

        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">Recent transactions</h2>
          </div>
          <div className="divide-y">
            {(transactions ?? []).map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {t.type.replace(/_/g, " ")}
                  </p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatKarma(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">bal: {formatKarma(t.balance_after)}</p>
                </div>
              </div>
            ))}
            {(transactions ?? []).length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
