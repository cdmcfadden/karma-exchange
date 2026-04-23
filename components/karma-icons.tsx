// Karma cosmic icon set — hourglass, sand, stars, glass, compass
// Ported from Claude Design handoff to typed React components.

import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({
  children,
  size = 20,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 1.25,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconHourglass(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3c0 4 5 6 5 9s-5 5-5 9" />
      <path d="M17 3c0 4-5 6-5 9s5 5 5 9" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </Icon>
  );
}

export function IconHourglassHalf(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3c0 4 5 6 5 9s-5 5-5 9" />
      <path d="M17 3c0 4-5 6-5 9s5 5 5 9" />
      <path d="M9 7.5h6c-0.4 2-3 3-3 4.5c0-1.5-2.6-2.5-3-4.5Z" fill="currentColor" stroke="none" />
      <path d="M8.5 19.5c1-2 3.5-3 3.5-3s2.5 1 3.5 3Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.4" fill="currentColor" />
      <circle cx="12" cy="16" r="0.4" fill="currentColor" />
    </Icon>
  );
}

export function IconSpark(p: IconProps) {
  return (
    <Icon {...p} fill="currentColor" stroke="none">
      <path d="M12 3 L13 11 L21 12 L13 13 L12 21 L11 13 L3 12 L11 11 Z" />
    </Icon>
  );
}

export function IconStar(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9Z" />
    </Icon>
  );
}

export function IconConstellation(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="5" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="5" r="1.2" fill="currentColor" />
      <circle cx="17" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="15" r="1.3" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
      <circle cx="20" cy="18" r="0.8" fill="currentColor" />
      <path d="M5 7L11 5L17 9L14 15L7 17" opacity="0.5" />
      <path d="M14 15L20 18" opacity="0.5" />
    </Icon>
  );
}

export function IconVessel(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M7 4h10l-1 5c0 3-1 5-4 5s-4-2-4-5L7 4Z" />
      <path d="M12 14v6" />
      <path d="M8 20h8" />
      <circle cx="12" cy="9" r="0.5" fill="currentColor" />
      <circle cx="10" cy="11" r="0.3" fill="currentColor" />
      <circle cx="14" cy="10" r="0.3" fill="currentColor" />
    </Icon>
  );
}

export function IconTelescope(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 14l11-4 2 5-11 4z" transform="rotate(-15 12 12)" />
      <path d="M12 17l3 5" />
      <path d="M10 18l-2 4" />
      <circle cx="17" cy="7" r="1.5" />
      <path d="M18 5.5 L20 4" />
    </Icon>
  );
}

export function IconScroll(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 4h11a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 1-2Z" />
      <path d="M9 9h7" />
      <path d="M9 13h7" />
      <path d="M9 17h4" />
    </Icon>
  );
}

export function IconCompass(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      <path d="M14 10l-2 6-2-6 2-2z" fill="currentColor" />
    </Icon>
  );
}

export function IconOrbit(p: IconProps) {
  return (
    <Icon {...p}>
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="9" r="1" fill="currentColor" />
    </Icon>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3c0 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4c0 2-1 3-3 3c0-3 2-4 0-9Z" />
    </Icon>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
    </Icon>
  );
}

export function IconMessage(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2Z" />
    </Icon>
  );
}

export function IconBell(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 10a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4v16M4 12h16" />
    </Icon>
  );
}

export function IconArrow(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 13l4 4L19 7" />
    </Icon>
  );
}
