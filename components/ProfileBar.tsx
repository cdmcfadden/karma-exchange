"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatKarma } from "@/lib/utils";
import { KarmaLogo, CosmicAvatar, KarmaBalance } from "./karma-primitives";
import { IconBell, IconMessage } from "./karma-icons";
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
  green: { label: "Balanced", color: "var(--ok)" },
  amber: { label: "Give back", color: "var(--warn)" },
  red: { label: "Locked", color: "var(--err)" },
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

  const tabs = [
    { id: "pacers", label: "PACERS", href: "/app", active: !isWheelhouse && !isSession },
    { id: "wheelhouse", label: "WHEELHOUSE", href: "/app/wheelhouse", active: isWheelhouse },
  ];

  const r = RECIPROCITY_LABELS[reciprocityStatus];

  return (
    <header
      style={{
        borderBottom: "1px solid rgba(232,212,168,0.1)",
        background: "rgba(5,3,8,0.6)",
        backdropFilter: "blur(8px)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: logo + tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/app" style={{ textDecoration: "none" }}>
          <KarmaLogo size={20} />
        </Link>

        {!isSession && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: 3,
              border: "1px solid rgba(232,212,168,0.12)",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                style={{
                  padding: "6px 16px",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  fontWeight: t.active ? 600 : 400,
                  background: t.active
                    ? "linear-gradient(180deg, var(--brass-bright), var(--brass-deep))"
                    : "transparent",
                  color: t.active ? "var(--void)" : "var(--text-dim)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        )}

        {isSession && (
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "var(--brass)",
            }}
          >
            LIVE SESSION
          </span>
        )}
      </div>

      {/* Right: notifications + karma + rank + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <PendingRequests userId={userId} />
        <KarmaBalance amount={karmaPoints} size="sm" />
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            letterSpacing: "0.1em",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ color: "var(--text-dim)" }}>
            #{formatKarma(karmaRank)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CosmicAvatar
            name={displayName}
            size={32}
            avatarUrl={avatarUrl}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--text)",
                fontWeight: 500,
              }}
            >
              {displayName}
            </span>
            <span
              style={{
                fontSize: 9,
                color: r.color,
                letterSpacing: "0.1em",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {r.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
