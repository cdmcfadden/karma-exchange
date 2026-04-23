"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LEVEL_STYLES, cn, formatKarma } from "@/lib/utils";
import type { SkillLevel } from "@/lib/utils";
import {
  MapPin,
  Calendar,
  Trophy,
  Coins,
  Loader2,
} from "lucide-react";

interface ProfileModalProps {
  userId: string | null;
  matchContext?: {
    why_match?: string;
    top_skill_name?: string;
    top_skill_level?: string;
  };
  onClose: () => void;
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  birth_year: number | null;
  bio: string | null;
  availability: string | null;
  karma_points: number;
  karma_rank: number;
  reciprocity_status: string;
}

interface SkillRow {
  skill_name: string;
  category: string;
  level: SkillLevel;
  user_level: SkillLevel | null;
}

const SESSION_TYPES = [
  { type: "express" as const, label: "Express (15 min)", cost: 75 },
  { type: "standard" as const, label: "Standard (45 min)", cost: 200 },
  { type: "deep" as const, label: "Deep (90 min)", cost: 350 },
];

export function ProfileModal({
  userId,
  matchContext,
  onClose,
}: ProfileModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setSkills([]);
    setRequestSent(false);
    setError(null);

    const supabase = createClient();
    setLoading(true);

    void (async () => {
      const [profileRes, skillsRes] = await Promise.all([
        supabase
          .from("users")
          .select(
            "id, display_name, avatar_url, city, birth_year, bio, availability, karma_points, karma_rank, reciprocity_status",
          )
          .eq("id", userId)
          .single(),
        supabase
          .from("wheelhouse_skills")
          .select("skill_name, category, level, user_level")
          .eq("user_id", userId)
          .eq("willing_to_help", true)
          .order("category"),
      ]);
      if (profileRes.data) setProfile(profileRes.data as UserProfile);
      if (skillsRes.data) setSkills(skillsRes.data as SkillRow[]);
      setLoading(false);
    })();
  }, [userId]);

  async function requestMatch(sessionType: "express" | "standard" | "deep") {
    if (!userId) return;
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helperId: userId,
          sessionType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
      } else {
        setRequestSent(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setRequesting(false);
    }
  }

  const age = profile?.birth_year
    ? new Date().getFullYear() - profile.birth_year
    : null;

  // Group skills by category
  const grouped = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <Dialog open={!!userId} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          </div>
        ) : profile ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-violet-700 text-xl">
                      {profile.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {profile.display_name}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {profile.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {profile.city}
                      </span>
                    )}
                    {age && <span>{age} years old</span>}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-slate-700 leading-relaxed mt-2">
                {profile.bio}
              </p>
            )}

            {/* Availability */}
            {profile.availability && (
              <div className="flex items-start gap-2 mt-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {profile.availability}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-violet-700 font-semibold">
                <Coins className="w-4 h-4" />
                {formatKarma(profile.karma_points)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="w-4 h-4" />
                Rank {formatKarma(profile.karma_rank)}
              </span>
            </div>

            {/* Match context */}
            {matchContext?.why_match && (
              <p className="text-sm text-violet-700 italic mt-3 bg-violet-50 rounded-lg px-3 py-2">
                &ldquo;{matchContext.why_match}&rdquo;
              </p>
            )}

            {/* Skills */}
            {Object.keys(grouped).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Can help with:
                </p>
                <div className="space-y-2">
                  {Object.entries(grouped).map(([cat, catSkills]) => (
                    <div key={cat}>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1 capitalize">
                        {cat.replace(/_/g, " ")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {catSkills.map((s) => {
                          const lvl = s.user_level ?? s.level;
                          return (
                            <span
                              key={s.skill_name}
                              className={cn(
                                "text-[11px] px-2 py-0.5 rounded-full font-medium",
                                LEVEL_STYLES[lvl].color,
                              )}
                            >
                              {s.skill_name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request to match */}
            <div className="mt-5 border-t pt-4">
              {requestSent ? (
                <div className="text-center py-2">
                  <p className="text-sm font-medium text-emerald-700">
                    Request sent!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    They'll see it in their notifications.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Request to match:
                  </p>
                  <div className="space-y-1.5">
                    {SESSION_TYPES.map((st) => (
                      <Button
                        key={st.type}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between h-9 text-xs"
                        onClick={() => void requestMatch(st.type)}
                        disabled={requesting}
                      >
                        <span>{st.label}</span>
                        <span className="text-violet-600 font-semibold">
                          {st.cost} karma
                        </span>
                      </Button>
                    ))}
                  </div>
                  {error && (
                    <p className="text-xs text-red-600 mt-2">{error}</p>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Profile not found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
