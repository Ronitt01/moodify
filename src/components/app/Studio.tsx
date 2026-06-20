"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { MoodArt } from "@/components/ui/MoodArt";
import { Equalizer } from "@/components/ui/Equalizer";
import { Bracket } from "@/components/ui/Tag";
import { Logo } from "@/components/ui/Logo";
import { PlayIcon, SpotifyIcon, ArrowIcon, CheckIcon, HeartIcon, CloseIcon } from "@/components/ui/icons";
import { ImportModal } from "./ImportModal";

type Me = {
  user: { id: string; display_name?: string | null; is_anonymous?: boolean };
  connected: boolean;
  spotifyConfigured: boolean;
  universe: number;
  engine: string;
  taste?: { interactions: number; lean: string[] };
};
type QueueTrack = {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  year: number | null;
  source: string;
  externalId?: string | null;
  image?: string | null;
  fit: number;
  why: string[];
  emotion: Record<string, number>;
};
type MomentResult = {
  signals: Record<string, string | null>;
  target: Record<string, number>;
  confidence: number;
  model: string;
  connected: boolean;
  momentId?: string | null;
  discover?: boolean;
  queue: QueueTrack[];
};

const PRESETS = [
  "2AM drive in the rain, winding down but hopeful",
  "Gym — I want to feel invincible",
  "Heartbroken but trying to stay optimistic",
  "Deep focus, do not disturb",
  "Nostalgic night with old friends",
  "Exhausted but I need energy",
];

const LANGS: { id: string; label: string }[] = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "punjabi", label: "Punjabi" },
  { id: "tamil", label: "Tamil" },
  { id: "telugu", label: "Telugu" },
  { id: "korean", label: "Korean" },
  { id: "spanish", label: "Spanish" },
  { id: "japanese", label: "Japanese" },
  { id: "arabic", label: "Arabic" },
];

const DIM_COLOR: Record<string, string> = {
  energy: "#FF5C38",
  valence: "#FFB23E",
  arousal: "#FF7A59",
  melancholy: "#6C5CE7",
  nostalgia: "#FF9D5C",
  romance: "#FF4D9D",
  serenity: "#8B7FFF",
  hope: "#A99CFF",
  triumph: "#FFC24B",
  focus: "#6C5CE7",
  darkness: "#4636B8",
  aggression: "#FF4D4D",
  warmth: "#FF8A5C",
  playfulness: "#FFB23E",
  loneliness: "#5A4BD4",
  tension: "#FF6B4A",
};

const SLIDER_DIMS = ["energy", "valence", "nostalgia", "serenity", "focus", "tension"];

function artColors(emotion: Record<string, number>): [string, string] {
  const sorted = Object.entries(emotion).sort((a, b) => b[1] - a[1]);
  const from = DIM_COLOR[sorted[0]?.[0]] ?? "#8B7FFF";
  const to = DIM_COLOR[sorted[1]?.[0]] ?? "#241433";
  return [from, to];
}

function MiniSlider({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[4.5rem] shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-paper-mute">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-ink-500">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          animate={{ width: `${Math.round((value ?? 0) * 100)}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-[0.6rem] text-paper-dim">
        {Math.round((value ?? 0) * 100)}
      </span>
    </div>
  );
}

export function Studio() {
  const [me, setMe] = useState<Me | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<MomentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [reacted, setReacted] = useState<Record<string, "fit" | "skip">>({});
  const [taste, setTaste] = useState<{ interactions: number; lean: string[] }>({
    interactions: 0,
    lean: [],
  });
  const [languages, setLanguages] = useState<string[]>(["english"]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        if (data?.taste) setTaste(data.taste);
      })
      .catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem("moodify_langs") || "[]");
      if (Array.isArray(saved) && saved.length) setLanguages(saved);
    } catch {
      /* ignore bad localStorage */
    }
    const connect = new URLSearchParams(window.location.search).get("connect");
    if (connect === "success")
      setBanner("Spotify connected — your library is now your universe.");
    else if (connect)
      setBanner(`Couldn't connect Spotify (${connect}). You're still on the real starter universe.`);
  }, []);

  async function run(moment: string) {
    setLoading(true);
    setText(moment);
    try {
      const res = await fetch("/api/moment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: moment, context: { hour: new Date().getHours() }, languages }),
      });
      setResult(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function react(trackId: string, kind: "fit" | "skip") {
    setReacted((m) => ({ ...m, [trackId]: kind }));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, momentId: result?.momentId ?? null, kind }),
      }).then((r) => r.json());
      if (res?.lean) setTaste({ interactions: res.interactions, lean: res.lean });
    } catch {
      /* keep the optimistic UI even if the network blips */
    }
  }

  function toggleLang(id: string) {
    setLanguages((prev) => {
      const next = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id];
      const final = next.length ? next : ["english"];
      try {
        localStorage.setItem("moodify_langs", JSON.stringify(final));
      } catch {
        /* ignore */
      }
      return final;
    });
  }

  function connect() {
    if (me?.spotifyConfigured) window.location.href = "/api/spotify/connect";
    else
      setBanner(
        "Add SPOTIFY_CLIENT_ID/SECRET to .env.local to connect your real library (see HANDOFF.md). Until then you're on the real starter universe."
      );
  }

  return (
    <div className="relative min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/70 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <a href="/" aria-label="Moodify home" className="flex items-center gap-3">
            <Logo />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-ink-600 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-paper-dim transition-colors hover:border-brand hover:text-paper"
            >
              + Import
            </button>
            {me?.connected ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-line-brand bg-brand/10 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-brand-lighter">
                <SpotifyIcon className="size-3.5" />
                {me.user.display_name || "Connected"} · {me.universe} tracks
              </span>
            ) : (
              <button
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-ink-600 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-paper-dim transition-colors hover:border-brand hover:text-paper"
              >
                <SpotifyIcon className="size-3.5 text-brand-light" />
                Connect Spotify
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container-x py-10 sm:py-14">
        {/* banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-line-brand bg-brand/10 px-4 py-3"
            >
              <span className="font-mono text-xs text-brand-lighter">{banner}</span>
              <button
                onClick={() => setBanner(null)}
                className="font-mono text-xs text-paper-faint hover:text-paper"
                aria-label="Dismiss"
              >
                [×]
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Bracket>The studio</Bracket>
        <h1 className="mt-4 max-w-2xl text-display-sm font-extrabold leading-[0.98] text-paper">
          Tell it the moment. Get the{" "}
          <span className="text-gradient italic">queue.</span>
        </h1>
        <p className="mt-4 max-w-xl text-paper-dim">
          {me?.connected
            ? "Recommending from your Spotify library."
            : me
            ? `Recommending from a real starter universe of ${me.universe} tracks. Connect Spotify to use your own.`
            : "Warming up the engine…"}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          {/* INPUT */}
          <TerminalWindow
            title="moodify — moment"
            badge={me ? `engine: ${me.engine}` : undefined}
            bodyClassName="p-5"
          >
            <label htmlFor="moment" className="eyebrow">
              Describe where you are / how you feel
            </label>
            <textarea
              id="moment"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(text);
              }}
              rows={3}
              placeholder="late drives after the breakup, trying to stay hopeful…"
              className="mt-2 w-full resize-none rounded-lg border border-line-strong bg-ink-500 px-4 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-brand"
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => run(p)}
                  className="rounded-full border border-line px-3 py-1.5 font-mono text-[0.6rem] text-paper-mute transition-colors hover:border-brand hover:text-paper"
                >
                  {p.length > 30 ? p.slice(0, 30) + "…" : p}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-paper-faint">
                languages
              </span>
              {LANGS.map((l) => {
                const on = languages.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLang(l.id)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[0.58rem] transition-colors ${
                      on
                        ? "border-brand/60 bg-brand/15 text-brand-light"
                        : "border-line text-paper-mute hover:border-line-strong hover:text-paper"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => run(text)}
                disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-60"
              >
                {loading ? "Reading…" : "Read my moment"}
                {!loading && <ArrowIcon className="size-4" />}
              </button>
              <button
                onClick={() => run("")}
                disabled={loading}
                className="btn btn-ghost shrink-0 disabled:opacity-60"
                title="Skip everything — just play"
              >
                <PlayIcon className="size-4" />
                Just Start Playing
              </button>
            </div>

            {/* signals + target */}
            {result && (
              <div className="mt-5 border-t border-line pt-5">
                <p className="eyebrow mb-3">What it read</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["emotion", "situation", "energy", "social"] as const).map((k) =>
                    result.signals[k] ? (
                      <span
                        key={k}
                        className="rounded-md border border-line-brand bg-brand/10 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-brand-lighter"
                      >
                        {k}: {result.signals[k]}
                      </span>
                    ) : null
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2 rounded-lg border border-line bg-ink-800/60 p-3">
                  {SLIDER_DIMS.map((d) => (
                    <MiniSlider key={d} label={d} value={result.target[d] ?? 0} />
                  ))}
                </div>
                <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-paper-faint">
                  confidence {Math.round(result.confidence * 100)}% · model {result.model}
                </p>
              </div>
            )}
          </TerminalWindow>

          {/* QUEUE */}
          <TerminalWindow
            title="moodify — queue"
            badge={result ? `● ${result.queue.length} tracks` : "idle"}
            glow={!!result}
            bodyClassName="p-5"
          >
            {!result ? (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-4 text-center">
                <Equalizer bars={20} className="h-10 w-40 opacity-50" />
                <p className="max-w-xs font-mono text-xs text-paper-mute">
                  Your queue appears here — built for the moment, pulled only from music
                  you already love.
                </p>
              </div>
            ) : result.queue.length === 0 ? (
              <p className="font-mono text-sm text-paper-mute">
                No tracks in your universe yet. Connect Spotify or reload to seed the
                starter universe.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="eyebrow">Queue for this moment</span>
                  <Equalizer bars={10} className="h-4 w-14" />
                </div>
                {taste.interactions > 0 && (
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-ink-700/40 px-2.5 py-1.5">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-paper-faint">
                      your taste graph
                    </span>
                    {taste.lean.map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-brand/10 px-2 py-0.5 font-mono text-[0.6rem] text-brand-light"
                      >
                        {d}
                      </span>
                    ))}
                    <span className="ml-auto font-mono text-[0.55rem] text-paper-faint">
                      {taste.interactions} signal{taste.interactions === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                <AnimatePresence mode="popLayout">
                  {result.queue.map((q, i) => {
                    const [from, to] = artColors(q.emotion);
                    return (
                      <motion.a
                        key={q.id}
                        href={
                          q.source === "spotify" && q.externalId
                            ? `https://open.spotify.com/track/${q.externalId}`
                            : `https://open.spotify.com/search/${encodeURIComponent(`${q.title} ${q.artist}`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Play "${q.title}" by ${q.artist} on Spotify`}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.32, delay: i * 0.04 }}
                        className={`group flex items-center gap-3 rounded-lg border border-line bg-ink-700/60 p-2.5 transition-colors hover:border-line-strong hover:bg-ink-700 ${
                          reacted[q.id] === "skip" ? "opacity-40" : ""
                        }`}
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-[0.62rem] text-paper-faint">
                          {i === 0 ? <PlayIcon className="mx-auto size-3.5 text-brand-light" /> : i + 1}
                        </span>
                        <MoodArt from={from} to={to} className="size-11 shrink-0" rounded="rounded-md" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-semibold text-paper ${
                              reacted[q.id] === "skip" ? "line-through" : ""
                            }`}
                          >
                            {q.title}
                          </p>
                          <p className="truncate font-mono text-[0.62rem] text-paper-mute">
                            {q.artist}
                            {q.why.length ? ` · ${q.why.join(" · ")}` : ""}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              react(q.id, "fit");
                            }}
                            title="Love this — teach Moodify to find more like it"
                            className={`grid size-7 place-items-center rounded-md border transition-colors ${
                              reacted[q.id] === "fit"
                                ? "border-brand/60 bg-brand/15 text-brand-light"
                                : "border-line text-paper-faint opacity-0 hover:border-line-strong hover:text-paper group-hover:opacity-100"
                            }`}
                          >
                            <HeartIcon className="size-3.5" filled={reacted[q.id] === "fit"} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              react(q.id, "skip");
                            }}
                            title="Not feeling it — fewer like this"
                            className={`grid size-7 place-items-center rounded-md border transition-colors ${
                              reacted[q.id] === "skip"
                                ? "border-line-strong bg-ink-500 text-paper-mute"
                                : "border-line text-paper-faint opacity-0 hover:border-line-strong hover:text-paper group-hover:opacity-100"
                            }`}
                          >
                            <CloseIcon className="size-3" />
                          </button>
                          <span className="ml-1 w-9 text-right font-mono text-[0.62rem] text-brand-light">
                            {q.fit}%
                          </span>
                        </span>
                      </motion.a>
                    );
                  })}
                </AnimatePresence>
                <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-paper-faint">
                  <CheckIcon className="size-3" /> tap to play on spotify · react to teach your taste ·
                  {result.discover
                    ? " sourced across all of music"
                    : result.connected
                      ? " from your spotify library"
                      : " from the starter universe"}
                </p>
              </div>
            )}
          </TerminalWindow>
        </div>
      </main>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(r) => {
          setMe((m) => (m ? { ...m, universe: r.universe } : m));
          setResult(null);
        }}
      />
    </div>
  );
}
