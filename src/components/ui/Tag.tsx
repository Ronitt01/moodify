import type { ReactNode } from "react";

/** Mono spec-tag, e.g. the "REAL-TIME CONTROLS · 40+ DITHER EFFECTS" pills. */
export function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "ember";
}) {
  const tones = {
    default: "border-line text-paper-mute",
    brand: "border-line-brand text-brand-lighter bg-brand/10",
    ember: "border-ember/30 text-ember-soft bg-ember/5",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.6rem] uppercase leading-none tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Bracketed mono eyebrow, e.g. [ THE EMOTIONAL LAYER FOR SPOTIFY ]. */
export function Bracket({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`eyebrow ${className}`}>
      <span className="text-brand-light">[</span>
      <span className="px-1.5">{children}</span>
      <span className="text-brand-light">]</span>
    </span>
  );
}
