import { BENEFITS } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-24 py-24 sm:py-28">
      <div className="container-x">
        <SectionHeader
          kicker="The payoff"
          title={
            <>
              Less scrolling. More{" "}
              <span className="text-gradient italic">feeling</span> understood.
            </>
          }
          intro="Moodify earns one reaction: “this app gets me.” Here is what that feels like, day to day."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 2) * 0.08}>
              <article className="surface group relative h-full overflow-hidden p-6 transition-colors hover:border-line-brand sm:p-8">
                {/* hover glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-brand/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-end gap-3">
                  <span className="font-display text-5xl font-extrabold leading-none text-paper">
                    {b.stat}
                  </span>
                  <span className="mb-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-paper-mute">
                    {b.statLabel}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-paper">{b.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-paper-dim">
                  {b.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-paper-faint">
          * Illustrative figures for this preview — replace with measured results
          before launch.
        </p>
      </div>
    </section>
  );
}
