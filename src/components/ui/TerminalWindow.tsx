import type { ReactNode } from "react";

/**
 * Windowed "terminal" card — the signature chrome borrowed from the reference,
 * warmed for Moodify. Title bar with traffic dots, a mono title, and an [x].
 */
export function TerminalWindow({
  title = "moodify",
  badge,
  children,
  className = "",
  bodyClassName = "",
  glow = false,
  dots = true,
}: {
  title?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  glow?: boolean;
  dots?: boolean;
}) {
  return (
    <div
      className={`win scanline ${glow ? "shadow-glow-lg" : ""} ${className}`}
    >
      <div className="win-bar">
        {dots && (
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-ember/80" />
            <span className="size-2.5 rounded-full bg-brand-light/70" />
            <span className="size-2.5 rounded-full bg-paper-faint/60" />
          </div>
        )}
        <span className="ml-1 truncate font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper-mute">
          {title}
        </span>
        {badge && (
          <span className="ml-auto rounded-md border border-line px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-dim">
            {badge}
          </span>
        )}
        <span
          className={`font-mono text-xs text-paper-faint ${badge ? "ml-3" : "ml-auto"}`}
          aria-hidden
        >
          [x]
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
