import { HOW_STEPS } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";
import { MoodArt } from "@/components/ui/MoodArt";
import { SpotifyIcon, ArrowIcon } from "@/components/ui/icons";

/* Tiny per-step visual so the flow reads without paragraphs. */
function StepVisual({ no }: { no: string }) {
  if (no === "01") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-ink-800/60 p-3">
        <SpotifyIcon className="size-7 shrink-0 text-brand-light" />
        <ArrowIcon className="size-4 shrink-0 text-paper-faint" />
        <div className="flex -space-x-2">
          {["#8B7FFF", "#FF5C38", "#6C5CE7"].map((c, i) => (
            <MoodArt
              key={i}
              from={c}
              to="#14101f"
              className="size-8 ring-2 ring-ink-700"
              rounded="rounded-md"
            />
          ))}
        </div>
        <span className="ml-auto font-mono text-[0.58rem] uppercase tracking-[0.1em] text-paper-mute">
          2,140 songs
        </span>
      </div>
    );
  }
  if (no === "02") {
    return (
      <div className="rounded-lg border border-line bg-ink-800/60 p-3">
        <p className="font-mono text-[0.66rem] leading-relaxed text-paper-dim">
          <span className="text-paper-faint">&gt;</span> late drives after the
          breakup, staying hopeful<span className="blink-caret" />
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {["sad→hopeful", "driving", "solo", "low energy"].map((s) => (
            <span
              key={s}
              className="rounded border border-line-brand bg-brand/10 px-1.5 py-0.5 font-mono text-[0.55rem] text-brand-lighter"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-ink-800/60 p-2.5">
      {[
        ["Nightshift", "94%"],
        ["Slow Exhale", "89%"],
        ["Afterglow", "86%"],
      ].map(([song, fit]) => (
        <div key={song} className="flex items-center gap-2.5">
          <MoodArt className="size-7" rounded="rounded" />
          <span className="truncate font-mono text-[0.66rem] text-paper-dim">
            {song}
          </span>
          <span className="ml-auto font-mono text-[0.58rem] text-brand-light">
            {fit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeader
          kicker="How it works"
          title={
            <>
              From feeling to song in{" "}
              <span className="text-gradient italic">three</span> taps.
            </>
          }
          intro="No survey, no setup tax. Connect once, say a word (or none at all), and press play. Everything after that just gets sharper."
        />

        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          {/* connecting line on desktop */}
          <div
            className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent md:block"
            aria-hidden
          />
          {HOW_STEPS.map((step, i) => (
            <Reveal key={step.no} delay={i * 0.08}>
              <TerminalWindow
                title={`step_${step.no}`}
                badge={step.kicker}
                bodyClassName="flex h-full flex-col gap-4 p-5"
                className="h-full"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-extrabold text-brand-light">
                    {step.no}
                  </span>
                  <h3 className="text-xl font-bold leading-tight text-paper">
                    {step.title}
                  </h3>
                </div>
                <StepVisual no={step.no} />
                <p className="text-sm leading-relaxed text-paper-dim">
                  {step.body}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {step.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </TerminalWindow>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
