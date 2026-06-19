"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bracket } from "@/components/ui/Tag";
import { Equalizer } from "@/components/ui/Equalizer";
import { PlayIcon, SpotifyIcon, CheckIcon } from "@/components/ui/icons";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  // Stub handler — wire to Resend / a Supabase edge function for real capture.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setDone(true);
  };

  return (
    <section id="cta" className="scroll-mt-24 px-4 py-24 sm:py-32">
      <div className="container-x">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-line-brand bg-ink-700 px-6 py-16 text-center sm:px-12 sm:py-24">
          {/* glow field */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
            <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-ember/15 blur-[100px]" />
            <div className="grain absolute inset-0" />
          </div>

          <div className="mx-auto flex justify-center">
            <Equalizer bars={22} className="h-10 w-48 opacity-80" />
          </div>

          <div className="mt-8 flex justify-center">
            <Bracket>Just start playing</Bracket>
          </div>

          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-3xl text-display-sm font-extrabold leading-[0.98] text-paper"
          >
            Stop asking what to play. Start feeling{" "}
            <span className="text-gradient text-glow italic">understood.</span>
          </motion.h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-paper-dim">
            Connect Spotify and get a queue built for your exact moment — free, no
            wall, from music you already love. You're one tap from understood.
          </p>

          {/* primary actions */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/app" className="btn btn-primary w-full sm:w-auto">
              <PlayIcon className="size-4" />
              Just Start Playing
            </a>
            <a href="/api/spotify/connect" className="btn btn-ghost w-full sm:w-auto">
              <SpotifyIcon className="size-4 text-brand-light" />
              Connect Spotify
            </a>
          </div>

          {/* waitlist capture */}
          <div className="mx-auto mt-10 max-w-md border-t border-line pt-8">
            {done ? (
              <p className="inline-flex items-center gap-2 font-mono text-sm text-brand-lighter">
                <CheckIcon className="size-4" /> You're on the list — see you at 2AM.
              </p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-mute">
                  Or get early access news
                </p>
                <form
                  onSubmit={onSubmit}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <label htmlFor="cta-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="cta-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 rounded-lg border border-line-strong bg-ink-500 px-4 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-brand"
                  />
                  <button type="submit" className="btn btn-primary shrink-0">
                    Notify me
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
