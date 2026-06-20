"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MOOD_PROMPTS = [
  { mood: "happy", label: "When you're happy, you play…" },
  { mood: "low", label: "When you're low, you reach for…" },
  { mood: "hyped", label: "When you need energy, it's…" },
];

const VIBES = [
  "indie", "pop", "hip hop", "rock", "lo-fi", "r&b",
  "electronic", "classical", "metal", "folk", "jazz", "acoustic",
];

type Reflection = { lean: string[]; artists: string[]; vibes: string[] };

export function QuizModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (t: { interactions: number; lean: string[] }) => void;
}) {
  const [artists, setArtists] = useState<string[]>(["", "", ""]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Reflection | null>(null);

  const toggleVibe = (v: string) =>
    setVibes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artists: artists.map((a) => a.trim()).filter(Boolean), vibes }),
      }).then((r) => r.json());
      try {
        localStorage.setItem("moodify_onboarded", "1");
      } catch {
        /* ignore */
      }
      onComplete({ interactions: res.interactions ?? 0, lean: res.lean ?? [] });
      setResult({ lean: res.lean ?? [], artists: res.artists ?? [], vibes: res.vibes ?? [] });
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function skip() {
    try {
      localStorage.setItem("moodify_onboarded", "1");
    } catch {
      /* ignore */
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-2xl border border-line-strong bg-ink-700 p-6 shadow-2xl"
      >
        {!result ? (
          <>
            <p className="eyebrow">First — a 20-second taste check</p>
            <h2 className="mt-2 text-xl font-bold text-paper">
              So Moodify gets you from the first play
            </h2>
            <p className="mt-1 text-sm text-paper-dim">
              Name a few artists you love and tap your sounds. We&apos;ll tune everything to you.
            </p>

            <div className="mt-5 space-y-2.5">
              {MOOD_PROMPTS.map((m, i) => (
                <div key={m.mood} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 font-mono text-[0.62rem] text-paper-mute">{m.label}</span>
                  <input
                    value={artists[i]}
                    onChange={(e) =>
                      setArtists((p) => p.map((a, j) => (j === i ? e.target.value : a)))
                    }
                    placeholder="artist or song"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-ink-500 px-3 py-2 font-mono text-[0.72rem] text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-brand"
                  />
                </div>
              ))}
            </div>

            <p className="eyebrow mt-5">Your sound</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VIBES.map((v) => {
                const on = vibes.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVibe(v)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[0.6rem] transition-colors ${
                      on
                        ? "border-brand/60 bg-brand/15 text-brand-light"
                        : "border-line text-paper-mute hover:border-line-strong hover:text-paper"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={submit}
                disabled={submitting}
                className="btn btn-primary flex-1 disabled:opacity-60"
              >
                {submitting ? "Tuning…" : "Tune Moodify to me"}
              </button>
              <button
                onClick={skip}
                className="font-mono text-[0.65rem] text-paper-faint transition-colors hover:text-paper"
              >
                skip
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Here&apos;s what I learned</p>
            <h2 className="mt-2 text-xl font-bold text-paper">
              You lean{" "}
              <span className="text-gradient">
                {result.lean.slice(0, 3).join(" · ") || "open-minded"}
              </span>
            </h2>
            {result.artists.length > 0 && (
              <p className="mt-3 text-sm text-paper-dim">
                I&apos;ll weave in <span className="text-paper">{result.artists.join(", ")}</span> and
                artists like them when the mood fits.
              </p>
            )}
            {result.vibes.length > 0 && (
              <p className="mt-1 text-sm text-paper-dim">
                Tuned toward <span className="text-paper">{result.vibes.join(", ")}</span>.
              </p>
            )}
            <button onClick={onClose} className="btn btn-primary mt-6 w-full">
              Start playing
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
