import { MOMENTS } from "@/lib/content";
import { Marquee } from "@/components/ui/Marquee";
import { Bracket } from "@/components/ui/Tag";

/**
 * A band of scrolling "moments" — the contexts Moodify reads. More honest than
 * fake customer logos: it shows the product's actual surface area.
 */
export function MomentsStrip() {
  const half = Math.ceil(MOMENTS.length / 2);
  const rowA = MOMENTS.slice(0, half);
  const rowB = MOMENTS.slice(half);

  const Pill = ({ text }: { text: string }) => (
    <span className="mx-1.5 inline-flex items-center gap-2 rounded-full border border-line bg-ink-700/60 px-4 py-2">
      <span className="size-1.5 rounded-full bg-brand-light" />
      <span className="whitespace-nowrap font-mono text-xs text-paper-dim">
        {text}
      </span>
    </span>
  );

  return (
    <section className="border-y border-line bg-ink-800/40 py-10">
      <div className="container-x mb-6 flex justify-center">
        <Bracket>One engine · infinite moments</Bracket>
      </div>
      <div className="flex flex-col gap-3">
        <Marquee durationSec={46}>
          {rowA.map((m) => (
            <Pill key={m} text={m} />
          ))}
        </Marquee>
        <Marquee durationSec={52} reverse>
          {rowB.map((m) => (
            <Pill key={m} text={m} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
