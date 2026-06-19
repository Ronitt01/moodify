import type { SVGProps } from "react";

/**
 * Lightweight inline icon set (no icon-font dependency, fully offline).
 * All icons inherit `currentColor` and a 1.6 stroke for a consistent line weight.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlaylistIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h11M4 12h11M4 17h7" />
      <circle cx="18.5" cy="16.5" r="2.5" />
      <path d="M21 9v7" />
    </svg>
  );
}

export function CompassIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

export function GraphIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="17" cy="17" r="2" />
      <circle cx="8" cy="16" r="2" />
      <path d="M8 8.5 16 7M7.5 14l8.5 2M16.5 8 16 15M8 14l8-6.5" />
    </svg>
  );
}

export function LoopIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 9a6 6 0 0 1 10-4l2 2M20 15a6 6 0 0 1-10 4l-2-2" />
      <path d="M16 3v4h-4M8 21v-4h4" />
    </svg>
  );
}

export function QuoteIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 8c-2.5 1-4 3-4 6 0 1.5 1 2 2 2s2-.7 2-2-1-2-2-2M19 8c-2.5 1-4 3-4 6 0 1.5 1 2 2 2s2-.7 2-2-1-2-2-2" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M7 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function SpotifyIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.43a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.97a.63.63 0 1 1-.28-1.22c3.81-.87 7.08-.5 9.72 1.12a.62.62 0 0 1 .21.86Zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.37.23.49.71.25 1.07Zm.1-2.83C14.79 9.16 9.4 8.98 6.3 9.92a.94.94 0 1 1-.54-1.8c3.56-1.08 9.51-.87 13.26 1.36a.94.94 0 0 1-.96 1.6Z" />
    </svg>
  );
}

export function ArrowIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m5 12.5 4 4 10-10" />
    </svg>
  );
}

export function PlusMinus(p: IconProps & { open?: boolean }) {
  const { open, ...rest } = p;
  return (
    <svg {...base} {...rest}>
      <path d="M5 12h14" />
      {!open && <path d="M12 5v14" />}
    </svg>
  );
}

export const FEATURE_ICONS = {
  playlist: PlaylistIcon,
  compass: CompassIcon,
  graph: GraphIcon,
  loop: LoopIcon,
  quote: QuoteIcon,
  play: PlayIcon,
} as const;

export type FeatureIconKey = keyof typeof FEATURE_ICONS;
