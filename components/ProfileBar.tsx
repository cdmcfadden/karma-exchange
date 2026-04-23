"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatKarma, cn } from "@/lib/utils";
import { Coins, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { PendingRequests } from "./PendingRequests";

interface ProfileBarProps {
  displayName: string;
  avatarUrl: string | null;
  karmaPoints: number;
  karmaRank: number;
  reciprocityStatus: "green" | "amber" | "red";
  userId: string;
}

const RECIPROCITY_LABELS = {
  green: { label: "Balanced", color: "bg-emerald-100 text-emerald-700" },
  amber: { label: "Give back soon", color: "bg-amber-100 text-amber-700" },
  red: { label: "Give to unlock", color: "bg-rose-100 text-rose-700" },
};

export function ProfileBar({
  displayName,
  avatarUrl,
  karmaPoints,
  karmaRank,
  reciprocityStatus,
  userId,
}: ProfileBarProps) {
  const pathname = usePathname();
  const isWheelhouse = pathname.startsWith("/app/wheelhouse");
  const isSession = pathname.startsWith("/app/session");
  const r = RECIPROCITY_LABELS[reciprocityStatus];

  const pageLabel = isWheelhouse
    ? "Wheelhouse"
    : isSession
    ? "Session"
    : "Suggested Pacers";

  return (
    <header className="border-b bg-white px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-10">
      {/* Left: brand + page label + switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/app" className="shrink-0">
          <span className="text-lg font-bold text-violet-700 tracking-tight">
            Karma Exchange
          </span>
        </Link>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-sm font-medium text-slate-600 hidden sm:inline">
          {pageLabel}
        </span>
        {!isSession && (
          <Link
            href={isWheelhouse ? "/app" : "/app/wheelhouse"}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition shrink-0"
          >
            {isWheelhouse ? (
              <>
                Pacers <ArrowRight className="w-3 h-3" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-3 h-3" /> Wheelhouse
              </>
            )}
          </Link>
        )}
      </div>

      {/* Right: notifications + karma + rank + user */}
      <div className="flex items-center gap-3 shrink-0">
        <PendingRequests userId={userId} />
        <Link
          href="/app/karma"
          className="flex items-center gap-1 text-sm font-semibold text-violet-700"
          title="Karma balance"
        >
          <Coins className="w-4 h-4" />
          <span className="hidden sm:inline">{formatKarma(karmaPoints)}</span>
        </Link>
        <div
          className="flex items-center gap-1 text-sm text-muted-foreground"
          title="Karma rank"
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">{formatKarma(karmaRank)}</span>
        </div>
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-semibold text-violet-700 text-sm">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="font-medium truncate text-xs leading-tight">
              {displayName}
            </p>
            <span
              className={cn(
                "text-[9px] px-1 py-0.5 rounded-full font-medium inline-block leading-tight",
                r.color,
              )}
            >
              {r.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
