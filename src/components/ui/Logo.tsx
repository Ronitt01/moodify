/** Moodify wordmark — a small orbital mark + mono wordmark with the ✕ motif. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-7 place-items-center rounded-md border border-line-strong bg-ink-600">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <circle cx="12" cy="12" r="2.4" fill="#8B7FFF" />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.6"
            fill="none"
            stroke="#6C5CE7"
            strokeWidth="1.4"
            transform="rotate(-28 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.6"
            fill="none"
            stroke="#FF5C38"
            strokeWidth="1.1"
            opacity="0.6"
            transform="rotate(34 12 12)"
          />
        </svg>
      </span>
      <span className="font-mono text-[0.95rem] font-bold uppercase tracking-[0.18em] text-paper">
        mood<span className="text-brand-light">✕</span>fy
      </span>
    </span>
  );
}
