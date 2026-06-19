"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";
import { PlayIcon } from "@/components/ui/icons";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "border-b border-line bg-ink/70 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="container-x flex h-16 items-center justify-between gap-4">
          <a href="#top" aria-label="Moodify home" className="shrink-0">
            <Logo />
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-lg px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim transition-colors hover:text-paper"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <a
              href="#faq"
              className="hidden rounded-lg px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-paper-dim transition-colors hover:text-paper sm:inline-flex"
            >
              Get help
            </a>
            <a href="/app" className="btn btn-primary hidden text-xs sm:inline-flex">
              <PlayIcon className="size-4" />
              Just Start Playing
            </a>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-lg border border-line-strong bg-ink-600 lg:hidden"
            >
              <div className="relative h-3.5 w-5">
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded bg-paper transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-paper transition-all duration-300 ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded bg-paper transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="container-x lg:hidden"
          >
            <div className="mt-2 rounded-card border border-line-strong bg-ink-700/95 p-3 backdrop-blur-xl">
              <ul className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-3 font-mono text-sm uppercase tracking-[0.12em] text-paper-dim transition-colors hover:bg-white/5 hover:text-paper"
                    >
                      {l.label}
                      <span className="text-paper-faint">→</span>
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                onClick={() => setOpen(false)}
                className="btn btn-primary mt-2 w-full"
              >
                <PlayIcon className="size-4" />
                Just Start Playing
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
