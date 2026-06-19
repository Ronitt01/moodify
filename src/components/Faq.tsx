"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FAQS } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PlusMinus } from "@/components/ui/icons";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-28">
      <div className="container-x">
        <SectionHeader
          kicker="Questions"
          title={
            <>
              The things people ask{" "}
              <span className="text-gradient italic">first.</span>
            </>
          }
        />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line overflow-hidden rounded-card border border-line bg-ink-800/40">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.02] sm:px-7"
                  >
                    <span className="text-base font-semibold text-paper sm:text-lg">
                      {f.q}
                    </span>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-md border border-line-strong text-paper-dim transition-colors ${
                        isOpen ? "bg-brand text-white" : ""
                      }`}
                    >
                      <PlusMinus open={isOpen} className="size-4" />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-6 text-sm leading-relaxed text-paper-dim sm:px-7 sm:text-[0.95rem]">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
