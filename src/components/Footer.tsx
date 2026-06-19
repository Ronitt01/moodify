import { FOOTER_GROUPS } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink-800/60">
      <div className="container-x py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-mute">
              The emotional-intelligence layer for Spotify. We don't replace your
              player — we understand why you press play.
            </p>
            <p className="mt-5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper-faint">
              [ internal: delulu fm ]
            </p>
          </div>

          {/* link groups */}
          {FOOTER_GROUPS.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-paper-mute">
                {g.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-paper-dim transition-colors hover:text-paper"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-paper-faint">
            © {2026} Moodify · Delulu FM
          </p>
          <p className="max-w-xl font-mono text-[0.58rem] leading-relaxed tracking-[0.04em] text-paper-faint">
            Spotify is a trademark of Spotify AB. Moodify is an independent
            companion app and is not affiliated with, endorsed by, or sponsored by
            Spotify.
          </p>
        </div>
      </div>
    </footer>
  );
}
