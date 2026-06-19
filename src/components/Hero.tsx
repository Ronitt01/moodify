"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { MoodArt } from "@/components/ui/MoodArt";
import { Equalizer } from "@/components/ui/Equalizer";
import { Bracket } from "@/components/ui/Tag";
import { PlayIcon, SpotifyIcon, ArrowIcon } from "@/components/ui/icons";

// WebGL must never run on the server — load the galaxy client-side only.
const GalaxyField = dynamic(
  () => import("@/components/GalaxyField").then((m) => m.GalaxyField),
  { ssr: false }
);

/* A single labelled context slider (visual). */
function Slider({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: "brand" | "ember";
}) {
  const fill = tone === "ember" ? "bg-ember" : "bg-brand";
  const knob = tone === "ember" ? "border-ember" : "border-brand-light";
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-paper-mute">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-ink-500">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${fill}`}
          style={{ width: `${value}%` }}
        />
        <div
          className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full border bg-ink-700 ${knob}`}
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-[0.6rem] text-paper-dim">
        {value}
      </span>
    </div>
  );
}

/* The hero product console: now-playing + a live "context engine". */
function NowPlayingConsole() {
  const reduce = useReducedMotion();
  return (
    <TerminalWindow
      title="moodify — now_playing"
      badge="● LIVE"
      glow
      bodyClassName="grid gap-4 p-4 sm:p-5 md:grid-cols-[1.15fr_1fr]"
    >
      {/* LEFT — now playing */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <MoodArt
            from="#8B7FFF"
            to="#FF5C38"
            className="size-24 shrink-0 sm:size-28"
            label="2AM · RAIN"
          />
          <div className="flex min-w-0 flex-col justify-center">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-mute">
              Now playing
            </span>
            <p className="mt-1 truncate font-display text-xl font-bold text-paper">
              Nightshift
            </p>
            <p className="truncate font-mono text-xs text-paper-dim">
              Lull &amp; The Quiet Hours
            </p>
            <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-brand-lighter">
              fits: late drive · winding down · hopeful
            </p>
          </div>
        </div>

        {/* mood-fit meter */}
        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.12em] text-paper-mute">
            <span>Mood-fit</span>
            <span className="text-brand-light">92%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-500">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-light to-ember"
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: "92%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </div>

        {/* transport + equalizer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-paper-dim">
            <span className="font-mono text-sm">⏮</span>
            <span className="grid size-9 place-items-center rounded-full bg-brand text-white shadow-glow">
              <PlayIcon className="size-4" />
            </span>
            <span className="font-mono text-sm">⏭</span>
          </div>
          <Equalizer bars={16} className="h-7 w-24" />
        </div>
      </div>

      {/* RIGHT — context engine */}
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-ink-800/60 p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-dim">
            Context engine
          </span>
          <span className="font-mono text-[0.6rem] text-paper-faint">⚙ auto</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <Slider label="Energy" value={38} />
          <Slider label="Nostalgia" value={72} tone="ember" />
          <Slider label="Focus" value={55} />
          <Slider label="Valence" value={61} />
          <Slider label="Tempo" value={44} />
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {["rainy", "night", "solo", "reflective"].map((t) => (
            <span
              key={t}
              className="rounded-md border border-line-brand bg-brand/10 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-brand-lighter"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="rounded-md border border-line-strong py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-paper-dim transition-colors hover:border-brand hover:text-paper">
            Reshuffle
          </button>
          <button className="rounded-md bg-brand py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5">
            Save queue
          </button>
        </div>
      </div>
    </TerminalWindow>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pb-20 pt-28 sm:pt-32"
    >
      {/* galaxy backdrop */}
      <div className="absolute inset-0 -z-10">
        <GalaxyField />
        {/* readability vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,transparent_0%,rgba(10,10,15,0.55)_70%,#0a0a0f_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="container-x relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Bracket>The Emotional Layer for Spotify</Bracket>
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl text-display font-extrabold leading-[0.95] text-paper"
        >
          Music that gets{" "}
          <span className="text-gradient text-glow italic">the moment.</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl text-balance text-base leading-relaxed text-paper-dim sm:text-lg"
        >
          Spotify knows <span className="text-paper">what</span> you play. Moodify
          knows <span className="italic text-brand-lighter">why</span> — and serves
          the song that fits where you are, how you feel, and what you need right
          now.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <a href="/app" className="btn btn-primary w-full sm:w-auto">
            <PlayIcon className="size-4" />
            Just Start Playing
          </a>
          <a href="#how" className="btn btn-ghost w-full sm:w-auto">
            See how it works
            <ArrowIcon className="size-4 rotate-90" />
          </a>
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.36 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-paper-mute"
        >
          <span className="inline-flex items-center gap-1.5">
            <SpotifyIcon className="size-3.5 text-brand-light" /> Built on your
            Spotify
          </span>
          <span className="text-paper-faint">·</span>
          <span>No signup to explore</span>
          <span className="text-paper-faint">·</span>
          <span>9,000+ tuning in</span>
        </motion.p>

        {/* trusted bar — reference homage */}
        <div className="mt-14 flex w-full max-w-4xl items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper-faint">
          <span aria-hidden>[×]</span>
          <span className="h-px flex-1 bg-line" />
          <span className="text-paper-mute">Trusted by 9,000+ listeners</span>
          <span className="h-px flex-1 bg-line" />
          <span aria-hidden>[×]</span>
        </div>

        {/* product console */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 w-full max-w-4xl [perspective:1600px]"
        >
          <motion.div
            style={{ rotateX: 6 }}
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <NowPlayingConsole />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
