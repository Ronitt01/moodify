"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { MoodArt } from "@/components/ui/MoodArt";
import { Equalizer } from "@/components/ui/Equalizer";
import { PlayIcon } from "@/components/ui/icons";

type Preset = {
  moment: string;
  signals: { emotion: string; situation: string; energy: string; social: string };
  sliders: { Energy: number; Nostalgia: number; Focus: number; Valence: number };
  art: [string, string];
  queue: { title: string; fit: number }[];
};

const PRESETS: Preset[] = [
  {
    moment: "2AM drive in the rain",
    signals: { emotion: "calm · hopeful", situation: "driving · night", energy: "low", social: "solo" },
    sliders: { Energy: 32, Nostalgia: 64, Focus: 40, Valence: 58 },
    art: ["#8B7FFF", "#FF5C38"],
    queue: [
      { title: "Nightshift", fit: 94 },
      { title: "Slow Exhale", fit: 90 },
      { title: "Afterglow", fit: 87 },
      { title: "Headlights", fit: 85 },
    ],
  },
  {
    moment: "Gym — feel invincible",
    signals: { emotion: "amped · fierce", situation: "workout", energy: "high", social: "in the zone" },
    sliders: { Energy: 92, Nostalgia: 20, Focus: 72, Valence: 80 },
    art: ["#FF5C38", "#6C5CE7"],
    queue: [
      { title: "Ironclad", fit: 96 },
      { title: "No Brakes", fit: 93 },
      { title: "Overdrive", fit: 90 },
      { title: "Detonate", fit: 88 },
    ],
  },
  {
    moment: "Heartbroken but hopeful",
    signals: { emotion: "tender · rising", situation: "home · alone", energy: "low-mid", social: "solo" },
    sliders: { Energy: 40, Nostalgia: 78, Focus: 35, Valence: 52 },
    art: ["#6C5CE7", "#FF9D5C"],
    queue: [
      { title: "Still Here", fit: 95 },
      { title: "Soft Landing", fit: 91 },
      { title: "New Light", fit: 88 },
      { title: "Unsend", fit: 86 },
    ],
  },
  {
    moment: "Deep focus, do not disturb",
    signals: { emotion: "steady · clear", situation: "work session", energy: "mid", social: "DND" },
    sliders: { Energy: 50, Nostalgia: 15, Focus: 95, Valence: 55 },
    art: ["#8B7FFF", "#241433"],
    queue: [
      { title: "Long Form", fit: 93 },
      { title: "Monolith", fit: 90 },
      { title: "Quiet Engine", fit: 88 },
      { title: "Throughput", fit: 85 },
    ],
  },
];

function MiniSlider({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-paper-mute">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-ink-500">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/** The shared inner panel — renders signals, sliders, and the resulting queue. */
function Console({ preset, compact }: { preset: Preset; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-col gap-3 p-3" : "grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_1fr]"}>
      {/* signals */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <MoodArt from={preset.art[0]} to={preset.art[1]} className="size-16 shrink-0" />
          <div className="min-w-0">
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.12em] text-paper-mute">
              Reading your moment
            </span>
            <p className="truncate font-display text-base font-bold text-paper">
              “{preset.moment}”
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(preset.signals).map(([k, v]) => (
            <div key={k} className="rounded-md border border-line bg-ink-800/60 px-2.5 py-1.5">
              <p className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-paper-faint">
                {k}
              </p>
              <p className="truncate font-mono text-[0.66rem] text-brand-lighter">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-ink-800/60 p-2.5">
          {Object.entries(preset.sliders).map(([k, v]) => (
            <MiniSlider key={k} label={k} value={v} />
          ))}
        </div>
      </div>

      {/* resulting queue */}
      <div className="flex flex-col gap-2 rounded-lg border border-line-brand bg-brand/5 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-brand-lighter">
            Queue for this moment
          </span>
          <Equalizer bars={9} className="h-4 w-12" />
        </div>
        <AnimatePresence mode="popLayout">
          {preset.queue.map((q, i) => (
            <motion.div
              key={preset.moment + q.title}
              layout
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex items-center gap-2.5 rounded-md bg-ink-700/70 p-2"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded bg-brand/20 text-brand-light">
                {i === 0 ? <PlayIcon className="size-3.5" /> : <span className="font-mono text-[0.6rem]">{i + 1}</span>}
              </span>
              <MoodArt from={preset.art[0]} to={preset.art[1]} className="size-7 shrink-0" rounded="rounded" />
              <span className="truncate font-mono text-[0.7rem] text-paper">{q.title}</span>
              <span className="ml-auto shrink-0 font-mono text-[0.58rem] text-brand-light">
                {q.fit}% fit
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <p className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.08em] text-paper-faint">
          drawn only from your master playlists
        </p>
      </div>
    </div>
  );
}

export function Demo() {
  const [active, setActive] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const reduce = useReducedMotion();
  const preset = PRESETS[active];

  return (
    <section id="demo" className="scroll-mt-24 py-24 sm:py-28">
      <div className="container-x">
        <SectionHeader
          kicker="See it think"
          title={
            <>
              Tell it a moment. Watch it{" "}
              <span className="text-gradient italic">understand.</span>
            </>
          }
          intro="This is semantic anchoring in motion: one sentence in, an emotional read and a queue out — pulled only from music you already love. Pick a moment."
        />

        {/* moment chips + device toggle */}
        <div className="mt-10 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.moment}
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                className={`relative rounded-full border px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.08em] transition-colors ${
                  active === i
                    ? "border-brand text-paper"
                    : "border-line text-paper-mute hover:border-line-strong hover:text-paper-dim"
                }`}
              >
                {active === i && !reduce && (
                  <motion.span
                    layoutId="moment-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand/15"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {p.moment}
              </button>
            ))}
          </div>

          {/* device toggle */}
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-line-strong bg-ink-700 p-1">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className="relative rounded-full px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em]"
              >
                {device === d && (
                  <motion.span
                    layoutId="device-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={device === d ? "text-white" : "text-paper-mute"}>{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* console */}
        <div className="mt-8">
          {device === "desktop" ? (
            <TerminalWindow
              title="moodify — context_studio"
              badge="● LIVE"
              glow
              bodyClassName=""
            >
              <Console preset={preset} />
            </TerminalWindow>
          ) : (
            <div className="mx-auto w-full max-w-[340px]">
              <div className="win shadow-glow-lg relative rounded-[2rem] p-2">
                <div className="mx-auto mb-1 h-1.5 w-16 rounded-full bg-ink-400" />
                <div className="overflow-hidden rounded-[1.6rem] border border-line">
                  <div className="win-bar">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-mute">
                      moodify
                    </span>
                    <span className="ml-auto font-mono text-[0.55rem] text-brand-light">● live</span>
                  </div>
                  <Console preset={preset} compact />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
