import {
  MOMENT_LEXICON,
  NEGATORS,
  type SignalField,
} from "./lexicon";
import { vec, addInto, clampVec, topDims, DIM, type DimName } from "./space";

export interface MomentContext {
  hour?: number; // 0..23, passive
  weather?: "rain" | "clear" | "cloud" | "snow" | string;
  motion?: "driving" | "walking" | "still" | string;
  weekday?: number; // 0..6
}

export type Signals = Record<SignalField, string | null>;

export interface MomentReading {
  text: string;
  target: number[];
  signals: Signals;
  matched: string[];
  context: MomentContext;
  confidence: number;
  model: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Find a needle: word-boundary for single words, substring for phrases. Returns index or -1. */
function findAt(hay: string, needle: string): number {
  if (needle.includes(" ")) return hay.indexOf(needle);
  const m = new RegExp("\\b" + esc(needle) + "\\b").exec(hay);
  return m ? m.index : -1;
}

/** Passive context biases — only energy/serenity/focus-type dims, never the emotion target. */
function applyContext(acc: number[], ctx: MomentContext) {
  if (typeof ctx.hour === "number") {
    const h = ctx.hour;
    if (h >= 22 || h < 5) addInto(acc, vec({ serenity: 0.35, darkness: 0.2 }), 0.4);
    else if (h >= 5 && h < 10) addInto(acc, vec({ hope: 0.3, warmth: 0.25, energy: 0.2 }), 0.3);
  }
  if (ctx.weather === "rain") addInto(acc, vec({ melancholy: 0.3, serenity: 0.25 }), 0.4);
  if (ctx.motion === "driving") addInto(acc, vec({ focus: 0.2, serenity: 0.2 }), 0.3);
  if (ctx.motion === "walking") addInto(acc, vec({ serenity: 0.25, valence: 0.2 }), 0.3);
}

/** Friendly fallback labels for the dominant emotional dimension. */
const DIM_TO_MOOD: Partial<Record<DimName, string>> = {
  valence: "upbeat",
  melancholy: "wistful",
  triumph: "powerful",
  serenity: "calm",
  nostalgia: "nostalgic",
  romance: "romantic",
  aggression: "fierce",
  hope: "hopeful",
  loneliness: "lonely",
  darkness: "moody",
  playfulness: "playful",
  focus: "locked in",
  warmth: "cozy",
};

/**
 * Read a moment sentence into an emotional target + signal chips.
 * Handles negation ("don't want sad music" pushes AWAY from sad) and lets
 * contrasting feelings coexist ("heartbroken but hopeful"). This is the local,
 * no-API-key implementation of semantic anchoring.
 */
export function readMoment(text: string, context: MomentContext = {}): MomentReading {
  const hay =
    (
      " " +
      text
        .toLowerCase()
        .replace(/[^a-z0-9'&\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim() +
      " "
    )
      // Neutralize idioms that contain a negator but aren't negations,
      // so "do not disturb" doesn't wrongly flip the next word.
      .replace(/ do ?n'?o?t? disturb /g, " dnd ")
      .replace(/ dont disturb /g, " dnd ");

  const acc = new Array(DIM).fill(0);
  const signals: Signals = { emotion: null, situation: null, energy: null, social: null };
  const matched: string[] = [];
  let hits = 0;

  for (const term of MOMENT_LEXICON) {
    let idx = -1;
    for (const m of term.match) {
      const j = findAt(hay, m);
      if (j !== -1 && (idx === -1 || j < idx)) idx = j;
    }
    if (idx === -1) continue;

    // Negation: a negator within ~14 chars before the match flips it.
    const pre = hay.slice(Math.max(0, idx - 16), idx);
    const negated = NEGATORS.some(
      (n) => pre.includes(" " + n + " ") || pre.includes(" " + n + "'")
    );
    const weight = (term.weight ?? 1) * (negated ? -0.9 : 1);

    addInto(acc, vec(term.dims), weight);
    hits++;

    if (term.signal) {
      if (negated) {
        matched.push("not " + term.signal.label);
      } else {
        if (!signals[term.signal.field]) signals[term.signal.field] = term.signal.label;
        matched.push(term.signal.label);
      }
    }
  }

  applyContext(acc, context);

  if (hits === 0) {
    // Nothing recognized — an exploratory, gently positive target.
    addInto(
      acc,
      vec({ valence: 0.55, energy: 0.5, warmth: 0.45, serenity: 0.45, playfulness: 0.4 }),
      1
    );
  }

  // Scale toward 0..1 and lift off the floor; clamp.
  const target = clampVec(acc.map((x) => x * 0.6 + 0.18));

  // Ensure the emotion chip always says something.
  if (!signals.emotion) {
    const top = topDims(target, 1)[0]?.name;
    if (top && DIM_TO_MOOD[top]) signals.emotion = DIM_TO_MOOD[top]!;
  }

  return {
    text,
    target,
    signals,
    matched: Array.from(new Set(matched)),
    context,
    confidence: Math.min(1, 0.35 + hits * 0.18),
    model: "local-lexicon-v1",
  };
}
