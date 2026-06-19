import { SectionHeader } from "@/components/ui/SectionHeader";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { MoodArt } from "@/components/ui/MoodArt";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/ui/icons";

const MEANINGS = [
  { label: "Motivation", ctx: "6AM · gym · go", from: "#FF5C38", to: "#8B7FFF" },
  { label: "Heartbreak", ctx: "1AM · alone · raw", from: "#6C5CE7", to: "#241433" },
  { label: "Nostalgia", ctx: "old friends · golden", from: "#FF9D5C", to: "#6C5CE7" },
  { label: "Survival", ctx: "hold on · keep going", from: "#8B7FFF", to: "#FF5C38" },
];

const SPOTIFY_KNOWS = ["Play count", "Skips & replays", "Genres & artists", "BPM & tempo", "Listening patterns"];
const MOODIFY_KNOWS = ["Emotional meaning", "Situational fit", "Personal memories", "Social context", "Desired outcome"];

export function Manifesto() {
  return (
    <section id="manifesto" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeader
          kicker="The thesis"
          title={
            <>
              The same song is{" "}
              <span className="text-gradient italic">four different</span> songs.
            </>
          }
          intro="Songs aren't static emotional objects. Their meaning shifts with context, memory, people and time. Spotify optimizes behavioral prediction. Moodify models the layer underneath — meaning."
        />

        {/* same song, four meanings */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {MEANINGS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.07}>
              <figure className="surface group h-full overflow-hidden p-3">
                <MoodArt
                  from={m.from}
                  to={m.to}
                  className="aspect-square w-full"
                  rounded="rounded-lg"
                />
                <figcaption className="px-1 pb-1 pt-3">
                  <p className="font-display text-lg font-bold text-paper">
                    {m.label}
                  </p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-paper-mute">
                    {m.ctx}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-faint">
          one track — “Nightshift” — read four ways
        </p>

        {/* spotify vs moodify */}
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <Reveal>
            <TerminalWindow
              title="spotify.knows"
              bodyClassName="p-6"
              className="h-full"
              dots
            >
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-paper-mute">
                What you listen to
              </p>
              <ul className="space-y-3">
                {SPOTIFY_KNOWS.map((s) => (
                  <li key={s} className="flex items-center gap-3 text-paper-dim">
                    <span className="size-1.5 rounded-full bg-paper-faint" />
                    <span className="text-[0.95rem]">{s}</span>
                  </li>
                ))}
              </ul>
            </TerminalWindow>
          </Reveal>

          <Reveal delay={0.08}>
            <TerminalWindow
              title="moodify.knows"
              badge="THE MOAT"
              glow
              bodyClassName="p-6"
              className="h-full"
            >
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-brand-lighter">
                Why you listen to it
              </p>
              <ul className="space-y-3">
                {MOODIFY_KNOWS.map((s) => (
                  <li key={s} className="flex items-center gap-3 text-paper">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand/20 text-brand-light">
                      <CheckIcon className="size-3.5" />
                    </span>
                    <span className="text-[0.95rem] font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </TerminalWindow>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
