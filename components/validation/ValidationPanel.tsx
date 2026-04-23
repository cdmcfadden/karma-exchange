"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rankSites } from "@/lib/validation-sites";
import { ShieldCheck } from "lucide-react";
import { SiteCard, type SkillValidation } from "./SiteCard";

interface SkillLite {
  id: string;
  category: string;
  skill_name: string;
}

export function ValidationPanel({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<SkillLite[]>([]);
  const [validations, setValidations] = useState<SkillValidation[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Initial load
    void (async () => {
      const [skillsRes, valsRes] = await Promise.all([
        supabase
          .from("wheelhouse_skills")
          .select("id, category, skill_name")
          .eq("user_id", userId),
        supabase
          .from("skill_validations")
          .select("id, site_id, url, status, results, error_message")
          .eq("user_id", userId),
      ]);
      if (skillsRes.data) setSkills(skillsRes.data as SkillLite[]);
      if (valsRes.data) setValidations(valsRes.data as SkillValidation[]);
    })();

    // Subscribe to new skills
    const skillChannel = supabase
      .channel(`val-skills:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wheelhouse_skills",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as SkillLite;
          setSkills((prev) =>
            prev.some((s) => s.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      )
      .subscribe();

    // Subscribe to validation changes (INSERT + UPDATE for status transitions)
    const valChannel = supabase
      .channel(`val-results:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "skill_validations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as SkillValidation;
          setValidations((prev) =>
            prev.some((v) => v.id === incoming.id)
              ? prev
              : [...prev, incoming],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "skill_validations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as SkillValidation;
          setValidations((prev) =>
            prev.map((v) => (v.id === updated.id ? updated : v)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(skillChannel);
      void supabase.removeChannel(valChannel);
    };
  }, [userId]);

  const validationMap = useMemo(() => {
    const m = new Map<string, SkillValidation>();
    for (const v of validations) m.set(v.site_id, v);
    return m;
  }, [validations]);

  // Rank by relevance, then sort completed to the top
  const ranked = useMemo(() => {
    const byRelevance = rankSites(skills);
    const COMPLETED_STATUSES = new Set(["verified", "partial"]);
    return byRelevance.sort((a, b) => {
      const aCompleted = COMPLETED_STATUSES.has(validationMap.get(a.site.id)?.status ?? "");
      const bCompleted = COMPLETED_STATUSES.has(validationMap.get(b.site.id)?.status ?? "");
      if (aCompleted && !bCompleted) return -1;
      if (!aCompleted && bCompleted) return 1;
      return 0; // preserve relevance order within each group
    });
  }, [skills, validationMap]);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto karma-scroll h-full">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <h3 className="font-semibold text-sm">Validate your skills</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Link your profiles so our agent can verify your claims. Ordered by
        relevance.
      </p>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mt-2">
          Add at least one skill to see validation sources.
        </p>
      ) : ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mt-2">
          No specific sources yet — keep sharing skills.
        </p>
      ) : (
        <div className="space-y-2 mt-1">
          {ranked.map(({ site, matchedSkills }) => (
            <SiteCard
              key={site.id}
              site={site}
              matchedSkills={matchedSkills}
              validation={validationMap.get(site.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
