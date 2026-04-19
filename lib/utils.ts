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
  beginner: { label: "Beginner", color: "bg-slate-100 text-slate-700" },
  intermediate: { label: "Intermediate", color: "bg-blue-100 text-blue-700" },
  advanced: { label: "Advanced", color: "bg-purple-100 text-purple-700" },
  expert: { label: "Expert", color: "bg-amber-100 text-amber-800" },
  master: { label: "Master", color: "bg-gradient-to-r from-rose-100 to-violet-100 text-rose-800" },
} as const;

export type SkillLevel = keyof typeof LEVEL_STYLES;
