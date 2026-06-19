import { FEATURES } from "@/lib/content";
import { FEATURE_ICONS } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Tag";

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeader
          kicker="Crowd favorites"
          title={
            <>
              Everything that makes it feel{" "}
              <span className="text-gradient italic">alive.</span>
            </>
          }
          intro="Six systems working as one — each earns its place by improving recommendation quality, retention, or the data moat. Nothing decorative."
          action={
            <a
              href="#cta"
              className="hidden font-mono text-xs uppercase tracking-[0.14em] text-paper-dim transition-colors hover:text-paper md:inline-flex"
            >
              [ Start free → ]
            </a>
          }
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon as keyof typeof FEATURE_ICONS];
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.07}>
                <article className="surface group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-brand">
                  <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-5 grid size-11 place-items-center rounded-lg border border-line-strong bg-ink-600 text-brand-light transition-colors group-hover:border-brand group-hover:text-brand-lighter">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-paper">{f.title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-paper-dim">
                    {f.body}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {f.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
