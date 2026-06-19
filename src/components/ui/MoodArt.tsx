import type { CSSProperties } from "react";

/**
 * MoodArt — an abstract, dithered "album/mood" visual built purely from CSS
 * (gradient blooms + halftone overlay + scanlines). No image assets, fully
 * offline, and tintable per mood. Echoes the reference's duotone halftone art.
 */
export function MoodArt({
  from = "#8B7FFF",
  to = "#FF5C38",
  className = "",
  label,
  rounded = "rounded-lg",
}: {
  from?: string;
  to?: string;
  className?: string;
  label?: string;
  rounded?: string;
}) {
  const style: CSSProperties = {
    backgroundImage: `radial-gradient(120% 90% at 25% 20%, ${from} 0%, transparent 55%),
       radial-gradient(120% 120% at 80% 85%, ${to} 0%, transparent 50%),
       radial-gradient(80% 80% at 60% 40%, rgba(255,255,255,0.35) 0%, transparent 45%),
       linear-gradient(160deg, #14101f, #0a0a0f)`,
  };
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={style}
      aria-hidden
    >
      {/* halftone dither */}
      <div className="dither absolute inset-0 opacity-70 mix-blend-multiply" />
      {/* fine scanlines */}
      <div className="scanline absolute inset-0" />
      {/* soft inner vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_60px_20px_rgba(10,10,15,0.7)]" />
      {label && (
        <span className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-paper-dim backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}
