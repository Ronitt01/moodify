import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { Bracket } from "./Tag";

/**
 * Editorial section header — mono kicker + big display title,
 * echoing the reference's "CROWD FAVORITES / Beyond The Basics" pattern.
 */
export function SectionHeader({
  kicker,
  title,
  intro,
  align = "left",
  action,
}: {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const isCenter = align === "center";
  return (
    <div
      className={`flex flex-col gap-5 ${
        isCenter ? "items-center text-center" : "items-start"
      } ${action ? "md:flex-row md:items-end md:justify-between md:text-left" : ""}`}
    >
      <div className={`${isCenter ? "max-w-2xl" : "max-w-3xl"}`}>
        <Reveal>
          <Bracket>{kicker}</Bracket>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-4 text-display-sm font-extrabold leading-[0.98] text-paper">
            {title}
          </h2>
        </Reveal>
        {intro && (
          <Reveal delay={0.1}>
            <p
              className={`mt-5 text-base leading-relaxed text-paper-dim ${
                isCenter ? "mx-auto" : ""
              } max-w-prose2`}
            >
              {intro}
            </p>
          </Reveal>
        )}
      </div>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}
