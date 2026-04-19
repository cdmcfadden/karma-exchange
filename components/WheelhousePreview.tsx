"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LEVEL_STYLES, cn } from "@/lib/utils";
import type { SkillLevel } from "@/lib/utils";
import {
  Sparkles,
  Target,
  X,
  ChevronDown,
  ChevronRight,
  HandHelping,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Skill {
  id: string;
  category: string;
  skill_name: string;
  level: SkillLevel;
  user_level: SkillLevel | null;
  willing_to_help: boolean;
  years_experience: number | null;
  evidence_text: string | null;
  created_at: string;
}

interface Seek {
  id: string;
  category: string;
  goal_description: string;
}

const LEVEL_NUMERIC: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5,
};

const NUMERIC_LEVEL: SkillLevel[] = [
  "beginner",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "master",
];

const ALL_LEVELS: SkillLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "master",
];

function effectiveLevel(s: Skill): SkillLevel {
  return s.user_level ?? s.level;
}

function computeCategoryLevel(skills: Skill[]): SkillLevel {
  if (skills.length === 0) return "beginner";
  const avg =
    skills.reduce((sum, s) => sum + (LEVEL_NUMERIC[effectiveLevel(s)] ?? 1), 0) /
    skills.length;
  const rounded = Math.round(avg);
  return NUMERIC_LEVEL[rounded] ?? "intermediate";
}

const CATEGORY_LABELS: Record<string, string> = {
  fitness: "Fitness",
  cooking: "Cooking",
  career: "Career",
  interview_prep: "Interview Prep",
  finance: "Finance",
  mental_health: "Mental Health",
  parenting: "Parenting",
  creative: "Creative",
  language: "Language",
  technology: "Technology",
  learning: "Learning",
  relationships: "Relationships",
  home_skills: "Home Skills",
  spiritual_practice: "Spiritual Practice",
  business: "Business",
  communication: "Communication",
};

export function WheelhousePreview({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [seeks, setSeeks] = useState<Seek[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [levelPickerOpen, setLevelPickerOpen] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const [skillsRes, seeksRes] = await Promise.all([
        supabase
          .from("wheelhouse_skills")
          .select(
            "id, category, skill_name, level, user_level, willing_to_help, years_experience, evidence_text, created_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("wheelhouse_seeks")
          .select("id, category, goal_description")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (skillsRes.data) setSkills(skillsRes.data as Skill[]);
      if (seeksRes.data) setSeeks(seeksRes.data as Seek[]);
    })();

    const channel = supabase
      .channel(`wheelhouse:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wheelhouse_skills",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Skill;
          setSkills((prev) =>
            prev.some((s) => s.id === incoming.id) ? prev : [incoming, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wheelhouse_seeks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Seek;
          setSeeks((prev) =>
            prev.some((s) => s.id === incoming.id) ? prev : [incoming, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  async function deleteSkill(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("wheelhouse_skills")
      .delete()
      .eq("id", id);
    if (!error) setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  async function deleteSeek(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("wheelhouse_seeks")
      .delete()
      .eq("id", id);
    if (!error) setSeeks((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleWilling(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("wheelhouse_skills")
      .update({ willing_to_help: !current })
      .eq("id", id);
    if (!error) {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, willing_to_help: !current } : s,
        ),
      );
    }
  }

  async function setUserLevel(id: string, newLevel: SkillLevel | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("wheelhouse_skills")
      .update({ user_level: newLevel })
      .eq("id", id);
    if (!error) {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, user_level: newLevel } : s,
        ),
      );
    }
    setLevelPickerOpen(null);
  }

  async function resetAll() {
    if (!confirm("Delete all skills and seeks? This cannot be undone.")) return;
    const supabase = createClient();
    await Promise.all([
      supabase.from("wheelhouse_skills").delete().eq("user_id", userId),
      supabase.from("wheelhouse_seeks").delete().eq("user_id", userId),
    ]);
    setSkills([]);
    setSeeks([]);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const s of skills) {
      const cat = s.category.toLowerCase();
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries())
      .map(([cat, catSkills]) => ({
        category: cat,
        label:
          CATEGORY_LABELS[cat] ??
          cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
        skills: catSkills,
        overallLevel: computeCategoryLevel(catSkills),
      }))
      .sort((a, b) => b.skills.length - a.skills.length);
  }, [skills]);

  function toggleCategory(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto karma-scroll h-full">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-sm">Your Wheelhouse</h3>
          <span className="text-xs text-muted-foreground">
            ({skills.length})
          </span>
          {skills.length > 0 && (
            <button
              onClick={resetAll}
              className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-600 transition"
              title="Reset all skills and seeks"
            >
              <Trash2 className="w-3 h-3" />
              Reset all
            </button>
          )}
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Skills will appear as you share them…
          </p>
        ) : (
          <div className="space-y-2">
            {grouped.map(
              ({ category, label, skills: catSkills, overallLevel }) => {
                const isExpanded = expandedCats.has(category);
                const levelStyle = LEVEL_STYLES[overallLevel];
                return (
                  <div
                    key={category}
                    className="rounded-lg border border-border bg-white"
                  >
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 p-3 hover:bg-slate-50/50 transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm capitalize">
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({catSkills.length})
                      </span>
                      <span
                        className={cn(
                          "ml-auto text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                          levelStyle.color,
                        )}
                      >
                        {levelStyle.label}
                      </span>
                    </button>

                    {/* Expanded skill cards */}
                    {isExpanded && (
                      <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5">
                        {catSkills.map((s) => {
                          const displayLevel = effectiveLevel(s);
                          const sLevel = LEVEL_STYLES[displayLevel];
                          const isOverridden = s.user_level !== null;
                          const isPickerOpen = levelPickerOpen === s.id;
                          const tooltip = [
                            s.skill_name,
                            s.evidence_text
                              ? `Evidence: ${s.evidence_text}`
                              : null,
                            s.years_experience
                              ? `${s.years_experience} years experience`
                              : null,
                            isOverridden
                              ? `AI recommended: ${LEVEL_STYLES[s.level].label}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join("\n");

                          return (
                            <div
                              key={s.id}
                              className="rounded-md bg-slate-50 px-2.5 py-2"
                              title={tooltip}
                            >
                              <div className="flex items-start gap-2">
                                {/* Willing toggle */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void toggleWilling(s.id, s.willing_to_help);
                                  }}
                                  className={cn(
                                    "mt-0.5 shrink-0 transition",
                                    s.willing_to_help
                                      ? "text-emerald-600"
                                      : "text-slate-300 hover:text-slate-400",
                                  )}
                                  title={
                                    s.willing_to_help
                                      ? "Willing to help others (click to disable)"
                                      : "Not offering help (click to enable)"
                                  }
                                >
                                  <HandHelping className="w-3.5 h-3.5" />
                                </button>

                                {/* Skill name — wraps instead of truncating */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-snug">
                                    {s.skill_name}
                                  </p>
                                  {s.years_experience && (
                                    <p className="text-[11px] text-muted-foreground">
                                      {s.years_experience} years
                                    </p>
                                  )}
                                </div>

                                {/* Level badge — clickable to override */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLevelPickerOpen(
                                      isPickerOpen ? null : s.id,
                                    );
                                  }}
                                  className={cn(
                                    "text-[11px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-300 transition",
                                    sLevel.color,
                                  )}
                                  title="Click to change level"
                                >
                                  {sLevel.label}
                                  {isOverridden && (
                                    <span className="ml-0.5 text-[9px] opacity-60">
                                      *
                                    </span>
                                  )}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void deleteSkill(s.id);
                                  }}
                                  className="text-muted-foreground hover:text-red-600 transition p-0.5 shrink-0"
                                  title="Remove skill"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Level picker dropdown */}
                              {isPickerOpen && (
                                <div className="mt-2 flex flex-wrap gap-1 items-center">
                                  {ALL_LEVELS.map((lvl) => {
                                    const ls = LEVEL_STYLES[lvl];
                                    const isActive = displayLevel === lvl;
                                    return (
                                      <button
                                        key={lvl}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void setUserLevel(s.id, lvl);
                                        }}
                                        className={cn(
                                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium transition",
                                          isActive
                                            ? cn(ls.color, "ring-2 ring-violet-400")
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                                        )}
                                      >
                                        {ls.label}
                                      </button>
                                    );
                                  })}
                                  {isOverridden && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void setUserLevel(s.id, null);
                                      }}
                                      className="text-[10px] text-violet-600 hover:text-violet-800 flex items-center gap-0.5 ml-1"
                                      title={`Reset to AI recommendation: ${LEVEL_STYLES[s.level].label}`}
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      AI: {LEVEL_STYLES[s.level].label}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {seeks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-rose-600" />
            <h3 className="font-semibold text-sm">You want to learn</h3>
            <span className="text-xs text-muted-foreground">
              ({seeks.length})
            </span>
          </div>
          <div className="space-y-2">
            {seeks.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-rose-100 p-3 bg-rose-50/50 animate-in fade-in slide-in-from-left-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm">{s.goal_description}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {s.category}
                    </p>
                  </div>
                  <button
                    onClick={() => void deleteSeek(s.id)}
                    className="text-muted-foreground hover:text-red-600 transition p-0.5 -mr-1 shrink-0"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
