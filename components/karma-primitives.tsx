"use client";

import { IconSpark } from "./karma-icons";

// Logo: hourglass SVG + italic "karma" wordmark
export function KarmaLogo({
  size = 28,
  showWord = true,
}: {
  size?: number;
  showWord?: boolean;
}) {
  const gradId = `lg${size}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg
        width={size}
        height={size * 1.35}
        viewBox="0 0 24 32"
        fill="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8bc6a" />
            <stop offset="50%" stopColor="#d4a24a" />
            <stop offset="100%" stopColor="#8b5a2b" />
          </linearGradient>
        </defs>
        <path
          d="M4 2h16M4 30h16"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5 2c0 6 7 8 7 14s-7 8-7 14"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M19 2c0 6-7 8-7 14s7 8 7 14"
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M7 5h10c-0.4 3-5 5-5 7c0-2-4.6-4-5-7Z"
          fill={`url(#${gradId})`}
          opacity="0.85"
        />
        <circle cx="12" cy="16" r="0.6" fill="#d4a24a" />
        <circle cx="12" cy="19" r="0.5" fill="#d4a24a" opacity="0.7" />
        <path
          d="M8 28c1.5-2 3-3 4-3s2.5 1 4 3Z"
          fill={`url(#${gradId})`}
          opacity="0.85"
        />
      </svg>
      {showWord && (
        <span
          className="font-display"
          style={{
            fontSize: size * 0.9,
            letterSpacing: "0.08em",
            fontWeight: 500,
            color: "var(--brass)",
            fontStyle: "italic",
          }}
        >
          karma
        </span>
      )}
    </div>
  );
}

// Avatar — cosmic orb with initials
export function CosmicAvatar({
  name = "?",
  size = 40,
  avatarUrl,
}: {
  name?: string;
  size?: number;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const h =
    ([...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;

  if (avatarUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "1px solid rgba(232,212,168,0.35)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, oklch(0.7 0.15 ${h}), oklch(0.35 0.12 ${h + 40}) 60%, oklch(0.15 0.05 ${h + 80}))`,
        border: "1px solid rgba(232,212,168,0.35)",
        boxShadow: `0 0 ${size * 0.3}px oklch(0.5 0.15 ${h} / 0.4), inset 0 0 ${size * 0.2}px rgba(255,255,255,0.12)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#f4ead6",
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ position: "relative", zIndex: 2 }}>{initials}</span>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          backgroundImage: `
            radial-gradient(1px 1px at 70% 25%, #f4ead6, transparent),
            radial-gradient(0.8px 0.8px at 30% 70%, #f4ead6, transparent),
            radial-gradient(0.6px 0.6px at 55% 55%, #f4ead6, transparent)
          `,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

// Karma balance badge with spark icon
export function KarmaBalance({
  amount,
  size = "md",
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { f: 12, g: 10 },
    md: { f: 18, g: 14 },
    lg: { f: 28, g: 18 },
  };
  const s = sizeMap[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "var(--brass-bright)",
        fontFamily: "'Fraunces', serif",
        fontSize: s.f,
        fontStyle: "italic",
      }}
    >
      <IconSpark size={s.g} />
      {amount.toLocaleString()}
    </span>
  );
}

// Skill tag / chip
export function Chip({
  children,
  active = false,
  small = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: small ? "3px 8px" : "5px 12px",
        borderRadius: "999px",
        border: `1px solid ${active ? "var(--brass)" : "rgba(232,212,168,0.22)"}`,
        background: active
          ? "rgba(212,162,74,0.14)"
          : "rgba(232,212,168,0.04)",
        color: active ? "var(--brass-bright)" : "var(--text-dim)",
        fontSize: small ? 11 : 12,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// Ornamental divider with spark
export function Ornament({ color = "var(--brass)" }: { color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color,
        opacity: 0.7,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color})`,
        }}
      />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1L8 6L13 7L8 8L7 13L6 8L1 7L6 6Z"
          fill={color}
        />
      </svg>
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
    </div>
  );
}

// Falling sand animated loader
export function FallingSandLoader({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 40 60"
      fill="none"
    >
      <defs>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a24a" />
          <stop offset="50%" stopColor="#c97ba8" />
          <stop offset="100%" stopColor="#7fb8b0" />
        </linearGradient>
      </defs>
      <path
        d="M8 2h24M8 58h24M10 2c0 10 12 14 12 20s-12 10-12 20M30 2c0 10-12 14-12 20s12 10 12 20"
        stroke="#d4a24a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M12 5h16c-1 6-7 8-8 14c-1-6-7-8-8-14Z"
        fill="url(#sandGrad)"
        opacity="0.9"
      />
      <g>
        {[0, 0.3, 0.6, 0.9, 1.2, 1.5].map((delay, i) => (
          <circle key={i} cx="20" cy="22" r="0.8" fill="#d4a24a">
            <animate
              attributeName="cy"
              from="22"
              to="40"
              dur="0.9s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="0.9s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
      <path
        d="M11 55c2-4 5-6 9-6s7 2 9 6Z"
        fill="url(#sandGrad)"
        opacity="0.9"
      >
        <animate
          attributeName="opacity"
          values="0.5;0.9"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
