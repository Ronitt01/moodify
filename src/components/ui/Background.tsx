/**
 * Global page atmosphere — sits behind everything (below the hero galaxy).
 * Fixed, non-interactive: dotted grid, two soft periwinkle/ember blooms,
 * and a faint film grain. Pure CSS, zero runtime cost.
 */
export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      {/* dotted grid, fading toward the top */}
      <div
        className="bg-dots absolute inset-0 opacity-[0.5]"
        style={{
          maskImage:
            "radial-gradient(120% 80% at 50% 0%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 50% 0%, #000 0%, transparent 75%)",
        }}
      />
      {/* periwinkle bloom */}
      <div className="absolute -left-40 top-[18%] h-[42rem] w-[42rem] rounded-full bg-brand/20 blur-[140px]" />
      {/* ember whisper */}
      <div className="absolute -right-32 top-[55%] h-[34rem] w-[34rem] rounded-full bg-ember/10 blur-[150px]" />
      {/* deep periwinkle low glow */}
      <div className="absolute bottom-[-10%] left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-brand-deep/20 blur-[160px]" />
      {/* grain */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
