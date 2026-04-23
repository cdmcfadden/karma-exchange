import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKarma(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Level → human label + tailwind color token. */
export const LEVEL_STYLES = {
  beginner: { label: "Beginner", color: "bg-[rgba(232,212,168,0.08)] text-[var(--text-dim)]" },
  intermediate: { label: "Intermediate", color: "bg-[rgba(127,184,176,0.15)] text-[var(--nebula-teal)]" },
  advanced: { label: "Advanced", color: "bg-[rgba(155,123,184,0.15)] text-[var(--nebula-violet)]" },
  expert: { label: "Expert", color: "bg-[rgba(212,162,74,0.18)] text-[var(--brass-bright)]" },
  master: { label: "Master", color: "bg-[rgba(217,122,58,0.18)] text-[var(--nebula-ember)]" },
} as const;

export type SkillLevel = keyof typeof LEVEL_STYLES;
