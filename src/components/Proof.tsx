import { STATS, TESTIMONIALS } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { QuoteIcon, SpotifyIcon, CheckIcon } from "@/components/ui/icons";

const SECURITY = [
  "Read-only Spotify access",
  "We never post on your behalf",
  "Your library is never changed",
  "Disconnect anytime",
];

export function Proof() {
  return (
    <section id="proof" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeader
          kicker="Proof"
          title={
            <>
              The metric that matters:{" "}
              <span className="text-gradient italic">“it gets me.”</span>
            </>
          }
          intro="We don't optimize for monthly actives. We optimize for the moment a listener says Moodify understands their taste better than Spotify."
        />

        {/* stats */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-ink-800 p-6 text-center sm:p-8">
              <p className="font-display text-4xl font-extrabold text-paper sm:text-5xl">
                <CountUp
                  to={s.value}
                  decimals={"decimals" in s ? (s.decimals as number) : 0}
                  suffix={s.suffix}
                />
              </p>
              <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-paper-mute">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* testimonials — masonry */}
        <div className="mt-8 [column-gap:1.25rem] sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.handle} delay={(i % 3) * 0.06}>
              <figure className="surface mb-5 break-inside-avoid p-6">
                <QuoteIcon className="size-6 text-brand-light/70" />
                <blockquote className="mt-3 text-[0.95rem] leading-relaxed text-paper-dim">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-light to-brand text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-paper">
                      {t.name}{" "}
                      <span className="font-mono text-[0.62rem] font-normal text-paper-mute">
                        {t.handle}
                      </span>
                    </p>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-paper-faint">
                      {t.meta}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* security / trust strip */}
        <Reveal>
          <div className="mt-6 flex flex-col items-center gap-4 rounded-card border border-line bg-ink-800/60 p-5 sm:flex-row sm:justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim">
              <SpotifyIcon className="size-4 text-brand-light" />
              Secured by design
            </span>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {SECURITY.map((s) => (
                <li
                  key={s}
                  className="inline-flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.08em] text-paper-mute"
                >
                  <CheckIcon className="size-3.5 text-brand-light" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-paper-faint">
          * Figures and quotes are illustrative placeholders for this preview.
        </p>
      </div>
    </section>
  );
}
