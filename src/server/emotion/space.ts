/**
 * The Moodify emotion space — 16 interpretable dimensions, each ~0..1.
 *
 * This ordered list IS the meaning of `vector(16)` in the database. Never
 * reorder it without a migration. Because the dims are named and explainable,
 * we can always tell the user *why* a song fits — the opposite of a black box.
 */
export const EMOTION_DIMS = [
  "valence", // sad ↔ happy / positive
  "energy", // calm ↔ high-energy / intense
  "arousal", // sleepy ↔ physiologically activated
  "tension", // relaxed ↔ tense / anxious
  "melancholy", // none ↔ wistful, bittersweet
  "nostalgia", // present ↔ memory-laden
  "warmth", // cold ↔ warm, intimate, comforting
  "aggression", // gentle ↔ hard, fierce
  "serenity", // restless ↔ peaceful
  "hope", // bleak ↔ uplifting, hopeful
  "loneliness", // connected ↔ solitary
  "triumph", // small ↔ powerful, invincible
  "romance", // platonic ↔ romantic, sensual
  "darkness", // light ↔ dark, brooding
  "playfulness", // serious ↔ fun, playful
  "focus", // scattered ↔ flow, concentration
] as const;

export type DimName = (typeof EMOTION_DIMS)[number];
export const DIM = EMOTION_DIMS.length; // 16

const INDEX = Object.fromEntries(EMOTION_DIMS.map((d, i) => [d, i])) as Record<
  DimName,
  number
>;

export type EmotionInput = Partial<Record<DimName, number>>;

/** Build a vector from named dimensions: vec({ energy: 0.9, triumph: 0.7 }). */
export function vec(input: EmotionInput = {}): number[] {
  const v = new Array(DIM).fill(0);
  for (const key in input) {
    const i = INDEX[key as DimName];
    if (i !== undefined) v[i] = input[key as DimName] as number;
  }
  return v;
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const clampVec = (v: number[]) => v.map(clamp01);

export function addInto(target: number[], src: number[], w = 1): number[] {
  for (let i = 0; i < DIM; i++) target[i] += (src[i] || 0) * w;
  return target;
}
export const scale = (v: number[], s: number) => v.map((x) => x * s);
export const lerp = (a: number[], b: number[], t: number) =>
  a.map((x, i) => x + (b[i] - x) * t);

export function mean(vs: number[][]): number[] {
  const out = new Array(DIM).fill(0);
  if (!vs.length) return out;
  for (const v of vs) addInto(out, v);
  return out.map((x) => x / vs.length);
}

const l2 = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

export function cosine(a: number[], b: number[]): number {
  const na = l2(a),
    nb = l2(b);
  if (!na || !nb) return 0;
  let d = 0;
  for (let i = 0; i < DIM; i++) d += a[i] * b[i];
  return d / (na * nb);
}

/**
 * Centered cosine — subtract the neutral midpoint (0.5) before comparing so
 * vectors in the all-positive orthant still separate by *direction of feeling*.
 * Returns 0..1 (remapped from -1..1).
 */
export function affinity(a: number[], b: number[]): number {
  const ca = a.map((x) => x - 0.5);
  const cb = b.map((x) => x - 0.5);
  return (cosine(ca, cb) + 1) / 2;
}

export function named(v: number[]): Record<DimName, number> {
  const o = {} as Record<DimName, number>;
  EMOTION_DIMS.forEach((d, i) => (o[d] = +(v[i] ?? 0).toFixed(3)));
  return o;
}

export function topDims(v: number[], k = 3): { name: DimName; value: number }[] {
  return EMOTION_DIMS.map((name, i) => ({ name, value: v[i] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k);
}
