"use client";

import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, ArrowIcon } from "@/components/ui/icons";

type Result = { imported: number; universe: number };

export function ImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (r: Result) => void;
}) {
  const [tab, setTab] = useState<"paste" | "csv">("paste");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(content: string, kind: "lines" | "csv") {
    if (!content.trim()) {
      setMsg("Add some songs first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    setOk(false);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, kind }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || "Import failed.");
      } else {
        setOk(true);
        setMsg(`Added ${data.imported} songs — your universe is now ${data.universe} tracks.`);
        onImported(data as Result);
      }
    } catch {
      setMsg("Import failed — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    submit(content, "csv");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="win w-full max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Import your music"
          >
            <div className="win-bar">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper-mute">
                moodify — import library
              </span>
              <button
                onClick={onClose}
                className="ml-auto font-mono text-xs text-paper-faint hover:text-paper"
                aria-label="Close"
              >
                [×]
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-paper-dim">
                Bring in your real music — no Spotify Premium needed. It becomes your
                universe and the engine recommends from it.
              </p>

              {/* tabs */}
              <div className="mt-4 flex gap-1 rounded-lg border border-line-strong bg-ink-700 p-1">
                {(["paste", "csv"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setMsg(null);
                    }}
                    className={`relative flex-1 rounded-md px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] ${
                      tab === t ? "text-white" : "text-paper-mute"
                    }`}
                  >
                    {tab === t && (
                      <motion.span
                        layoutId="import-tab"
                        className="absolute inset-0 -z-10 rounded-md bg-brand"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    {t === "paste" ? "Paste songs" : "Upload CSV"}
                  </button>
                ))}
              </div>

              {tab === "paste" ? (
                <div className="mt-4">
                  <label htmlFor="import-text" className="eyebrow">
                    One per line · “Title - Artist”
                  </label>
                  <textarea
                    id="import-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={7}
                    placeholder={"Blinding Lights - The Weeknd\nSkinny Love - Bon Iver\nHUMBLE. - Kendrick Lamar\n..."}
                    className="mt-2 w-full resize-none rounded-lg border border-line-strong bg-ink-500 px-4 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-brand"
                  />
                  <button
                    onClick={() => submit(text, "lines")}
                    disabled={busy}
                    className="btn btn-primary mt-3 w-full disabled:opacity-60"
                  >
                    {busy ? "Importing…" : "Import songs"}
                    {!busy && <ArrowIcon className="size-4" />}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="rounded-lg border border-line bg-ink-800/60 p-3 font-mono text-[0.66rem] leading-relaxed text-paper-mute">
                    Tip: export any Spotify playlist to CSV for free at{" "}
                    <a
                      href="https://exportify.net"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-light underline"
                    >
                      exportify.net
                    </a>{" "}
                    (no Premium), then upload it here. Artist genres in the CSV make
                    the emotional read sharper.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-ink-500 px-4 py-6 text-center font-mono text-xs text-paper-dim transition-colors hover:border-brand hover:text-paper">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={onFile}
                      disabled={busy}
                      className="hidden"
                    />
                    {busy ? "Importing…" : "Choose a .csv file"}
                  </label>
                </div>
              )}

              {msg && (
                <p
                  className={`mt-4 inline-flex items-center gap-2 font-mono text-xs ${
                    ok ? "text-brand-lighter" : "text-ember-soft"
                  }`}
                >
                  {ok && <CheckIcon className="size-4" />}
                  {msg}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
