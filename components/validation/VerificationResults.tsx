"use client";

import { CheckCircle2, AlertCircle, MinusCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assessment {
  skill_name: string;
  verdict: "supported" | "partial" | "unsupported";
  confidence: number;
  evidence_quote: string;
  level_assessment: string;
}

interface DiscoveredSkill {
  skill_name: string;
  category: string;
  level: string;
  evidence_text: string;
}

interface Props {
  pageSummary: string;
  assessments: Assessment[];
  discoveredSkills?: DiscoveredSkill[];
}

const VERDICT_CONFIG = {
  supported: {
    icon: CheckCircle2,
    label: "Supported",
    color: "text-[var(--ok)]",
    bg: "bg-[rgba(127,184,176,0.08)]",
  },
  partial: {
    icon: AlertCircle,
    label: "Partial",
    color: "text-[var(--warn)]",
    bg: "bg-[rgba(232,188,106,0.08)]",
  },
  unsupported: {
    icon: MinusCircle,
    label: "Not found",
    color: "text-[var(--text-faint)]",
    bg: "bg-[rgba(232,212,168,0.04)]",
  },
};

export function VerificationResults({
  pageSummary,
  assessments,
  discoveredSkills,
}: Props) {
  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] text-muted-foreground italic leading-snug">
        {pageSummary}
      </p>

      {assessments.length > 0 && (
        <>
          {assessments.map((a) => {
            const vc = VERDICT_CONFIG[a.verdict] ?? VERDICT_CONFIG.unsupported;
            const Icon = vc.icon;
            return (
              <div
                key={a.skill_name}
                className={cn("rounded-md p-2 text-xs", vc.bg)}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", vc.color)} />
                  <span className="font-medium">{a.skill_name}</span>
                  <span className={cn("ml-auto text-[10px]", vc.color)}>
                    {vc.label}
                  </span>
                </div>
                {a.evidence_quote && (
                  <p className="text-muted-foreground leading-snug pl-5 mt-0.5">
                    &ldquo;{a.evidence_quote}&rdquo;
                  </p>
                )}
                {a.level_assessment && a.verdict !== "unsupported" && (
                  <p className="text-muted-foreground pl-5 mt-0.5">
                    Level estimate:{" "}
                    <span className="capitalize">{a.level_assessment}</span>
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {discoveredSkills && discoveredSkills.length > 0 && (
        <>
          <div className="border-t border-border pt-2 mt-2">
            <p className="text-[11px] font-semibold text-[var(--nebula-violet)] mb-1.5 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Skills added to your wheelhouse
            </p>
          </div>
          {discoveredSkills.map((ds) => (
            <div
              key={ds.skill_name}
              className="rounded-md p-2 text-xs bg-[rgba(155,123,184,0.08)]"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Plus className="w-3.5 h-3.5 shrink-0 text-[var(--brass)]" />
                <span className="font-medium">{ds.skill_name}</span>
                <span className="ml-auto text-[10px] text-[var(--brass)] capitalize">
                  {ds.level}
                </span>
              </div>
              <p className="text-muted-foreground leading-snug pl-5 mt-0.5">
                {ds.evidence_text}
              </p>
              <p className="text-muted-foreground pl-5 mt-0.5 capitalize">
                {ds.category}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
