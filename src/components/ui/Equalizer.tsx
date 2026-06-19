/**
 * Animated equalizer bars. Deterministic per-bar timing (no random) so it is
 * SSR-safe. Bars freeze automatically under prefers-reduced-motion.
 */
export function Equalizer({
  bars = 28,
  className = "",
  barClassName = "",
}: {
  bars?: number;
  className?: string;
  barClassName?: string;
}) {
  // A repeating organic pattern of heights/delays — looks alive, stays stable.
  const seed = [0.5, 0.85, 0.35, 1, 0.6, 0.25, 0.75, 0.45, 0.95, 0.4];
  return (
    <div
      className={`flex h-full items-end gap-[3px] ${className}`}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const h = seed[i % seed.length];
        const delay = (i % 7) * 110 + (i % 3) * 60;
        const dur = 900 + (i % 5) * 130;
        return (
          <span
            key={i}
            className={`eq-bar w-[3px] ${barClassName}`}
            style={{
              height: `${28 + h * 72}%`,
              animationDelay: `${delay}ms`,
              animationDuration: `${dur}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
