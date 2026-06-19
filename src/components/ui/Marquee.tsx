import type { ReactNode, CSSProperties } from "react";

/**
 * Seamless CSS marquee. Renders the children twice and slides -50%, so the
 * loop is gapless. Freezes under prefers-reduced-motion (handled globally).
 */
export function Marquee({
  children,
  reverse = false,
  durationSec = 42,
  className = "",
}: {
  children: ReactNode;
  reverse?: boolean;
  durationSec?: number;
  className?: string;
}) {
  return (
    <div className={`mask-fade-x overflow-hidden ${className}`}>
      <div
        className={`flex w-max ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}
        style={{ "--marquee-duration": `${durationSec}s` } as CSSProperties}
      >
        <div className="flex shrink-0 items-center" aria-hidden={false}>
          {children}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
