import type { EmotionInput } from "./space";

/**
 * The lexicons that power the local (no-API-key) emotion model. Hand-tuned but
 * data-driven: genres set the base feeling, title/artist words nuance it, and
 * the moment vocabulary maps a sentence to a target + signal tags.
 *
 * When OPENROUTER_API_KEY is set, src/server/emotion/llm.ts can override the
 * moment read with an LLM — same shape out, so nothing downstream changes.
 */

/* ── Genre → base emotion ─────────────────────────────────────────────── */
export const GENRE_PRIORS: Record<string, EmotionInput> = {
  "lo-fi": { energy: 0.25, serenity: 0.8, focus: 0.85, warmth: 0.6, valence: 0.55, nostalgia: 0.5 },
  lofi: { energy: 0.25, serenity: 0.8, focus: 0.85, warmth: 0.6, valence: 0.55, nostalgia: 0.5 },
  ambient: { energy: 0.15, serenity: 0.85, focus: 0.7, tension: 0.12, darkness: 0.25 },
  classical: { serenity: 0.7, focus: 0.7, warmth: 0.5, nostalgia: 0.5, romance: 0.35 },
  "post-rock": { triumph: 0.6, melancholy: 0.5, energy: 0.55, hope: 0.55, focus: 0.5 },
  orchestral: { triumph: 0.7, focus: 0.6, tension: 0.4, serenity: 0.4 },
  soundtrack: { triumph: 0.6, focus: 0.6, tension: 0.45, nostalgia: 0.4 },
  epic: { triumph: 0.85, energy: 0.7, tension: 0.5 },
  metal: { energy: 0.95, aggression: 0.95, tension: 0.7, darkness: 0.6, triumph: 0.45 },
  punk: { energy: 0.9, aggression: 0.7, playfulness: 0.5, triumph: 0.4 },
  "pop punk": { energy: 0.85, nostalgia: 0.6, playfulness: 0.6, valence: 0.55, triumph: 0.4 },
  rock: { energy: 0.72, triumph: 0.45, aggression: 0.35 },
  "indie rock": { energy: 0.6, melancholy: 0.45, nostalgia: 0.5, warmth: 0.45 },
  indie: { melancholy: 0.5, nostalgia: 0.5, warmth: 0.5, valence: 0.5 },
  "dream pop": { melancholy: 0.6, serenity: 0.55, nostalgia: 0.6, warmth: 0.5, romance: 0.4 },
  shoegaze: { melancholy: 0.6, serenity: 0.45, darkness: 0.4, nostalgia: 0.55 },
  pop: { valence: 0.72, energy: 0.62, playfulness: 0.6, romance: 0.4 },
  "synth-pop": { nostalgia: 0.7, energy: 0.6, playfulness: 0.55, valence: 0.6 },
  synthwave: { nostalgia: 0.85, energy: 0.62, triumph: 0.5, darkness: 0.35 },
  "80s": { nostalgia: 0.85, valence: 0.6, energy: 0.6, playfulness: 0.5 },
  dance: { energy: 0.85, arousal: 0.8, playfulness: 0.6, valence: 0.68 },
  edm: { energy: 0.88, arousal: 0.85, triumph: 0.5, valence: 0.65 },
  house: { energy: 0.8, arousal: 0.78, serenity: 0.3, valence: 0.65, playfulness: 0.5 },
  techno: { energy: 0.85, arousal: 0.82, darkness: 0.45, focus: 0.5 },
  "drum and bass": { energy: 0.92, arousal: 0.88, tension: 0.5 },
  "hip hop": { energy: 0.65, triumph: 0.6, aggression: 0.4, playfulness: 0.4 },
  rap: { energy: 0.68, triumph: 0.62, aggression: 0.45, tension: 0.35 },
  trap: { energy: 0.62, darkness: 0.5, aggression: 0.45, triumph: 0.45 },
  phonk: { energy: 0.82, darkness: 0.62, aggression: 0.6, triumph: 0.4 },
  "r&b": { warmth: 0.72, romance: 0.72, valence: 0.58, serenity: 0.4 },
  rnb: { warmth: 0.72, romance: 0.7, valence: 0.58, serenity: 0.4 },
  soul: { warmth: 0.78, romance: 0.6, valence: 0.62, nostalgia: 0.5, triumph: 0.4 },
  funk: { energy: 0.75, playfulness: 0.75, valence: 0.72, warmth: 0.55 },
  disco: { energy: 0.8, playfulness: 0.8, valence: 0.78, nostalgia: 0.55 },
  jazz: { warmth: 0.62, serenity: 0.55, romance: 0.5, focus: 0.5, nostalgia: 0.45 },
  blues: { melancholy: 0.65, warmth: 0.55, nostalgia: 0.5 },
  folk: { warmth: 0.62, melancholy: 0.5, serenity: 0.62, nostalgia: 0.58 },
  acoustic: { warmth: 0.6, serenity: 0.6, melancholy: 0.4, romance: 0.4 },
  "singer-songwriter": { warmth: 0.58, melancholy: 0.55, nostalgia: 0.5, loneliness: 0.4 },
  country: { nostalgia: 0.6, warmth: 0.55, valence: 0.5, melancholy: 0.4 },
  gospel: { hope: 0.88, triumph: 0.72, warmth: 0.72, valence: 0.7 },
  reggae: { serenity: 0.62, warmth: 0.6, valence: 0.68, playfulness: 0.5 },
  afrobeats: { energy: 0.78, valence: 0.78, playfulness: 0.7, warmth: 0.55 },
  emo: { melancholy: 0.85, loneliness: 0.6, valence: 0.22, tension: 0.45 },
  sad: { melancholy: 0.88, valence: 0.18, loneliness: 0.6 },
  "sad girl": { melancholy: 0.85, loneliness: 0.55, romance: 0.4, nostalgia: 0.5 },
  hyperpop: { energy: 0.85, playfulness: 0.8, tension: 0.4, arousal: 0.75 },
  bedroom: { warmth: 0.6, melancholy: 0.45, serenity: 0.55, nostalgia: 0.5 },
};

/* ── Title / lyric keywords → nuance ──────────────────────────────────── */
export const KEYWORD_PRIORS: Record<string, EmotionInput> = {
  love: { romance: 0.7, warmth: 0.5, valence: 0.4 },
  heart: { romance: 0.5, warmth: 0.45, melancholy: 0.3 },
  cry: { melancholy: 0.7, loneliness: 0.4 },
  tears: { melancholy: 0.7, loneliness: 0.4 },
  alone: { loneliness: 0.75, melancholy: 0.4 },
  lonely: { loneliness: 0.8, melancholy: 0.5 },
  night: { darkness: 0.45, serenity: 0.25, romance: 0.2 },
  midnight: { darkness: 0.5, nostalgia: 0.3, romance: 0.25 },
  dark: { darkness: 0.6 },
  light: { hope: 0.5, valence: 0.4, warmth: 0.3 },
  sun: { valence: 0.55, warmth: 0.45, hope: 0.35 },
  summer: { valence: 0.6, nostalgia: 0.45, playfulness: 0.4 },
  fire: { energy: 0.6, aggression: 0.45, triumph: 0.3 },
  burn: { energy: 0.5, aggression: 0.45, tension: 0.3 },
  home: { warmth: 0.6, nostalgia: 0.55, serenity: 0.35 },
  dream: { serenity: 0.5, nostalgia: 0.45, hope: 0.35 },
  dance: { playfulness: 0.6, energy: 0.55, valence: 0.45 },
  run: { energy: 0.55, triumph: 0.4, tension: 0.25 },
  fight: { aggression: 0.6, triumph: 0.45, energy: 0.5 },
  win: { triumph: 0.7, valence: 0.45 },
  king: { triumph: 0.65, aggression: 0.3 },
  power: { triumph: 0.7, energy: 0.5 },
  rain: { melancholy: 0.5, serenity: 0.4, nostalgia: 0.3 },
  blue: { melancholy: 0.55 },
  gold: { nostalgia: 0.5, warmth: 0.45, triumph: 0.3 },
  golden: { nostalgia: 0.55, warmth: 0.5, valence: 0.4 },
  lost: { loneliness: 0.5, melancholy: 0.5 },
  free: { hope: 0.55, triumph: 0.4, valence: 0.45 },
  fly: { hope: 0.55, triumph: 0.45 },
  god: { hope: 0.6, triumph: 0.5, warmth: 0.4 },
  heaven: { hope: 0.6, serenity: 0.45 },
  hell: { darkness: 0.6, aggression: 0.4 },
  die: { darkness: 0.55, melancholy: 0.5 },
  death: { darkness: 0.6, melancholy: 0.45 },
  baby: { romance: 0.55, warmth: 0.4, playfulness: 0.3 },
  high: { energy: 0.5, playfulness: 0.45, valence: 0.5 },
  ghost: { darkness: 0.45, melancholy: 0.45, loneliness: 0.4 },
  drive: { energy: 0.35, nostalgia: 0.35, serenity: 0.3 },
  young: { nostalgia: 0.55, playfulness: 0.45, valence: 0.4 },
  forever: { romance: 0.45, nostalgia: 0.45, hope: 0.35 },
  paradise: { hope: 0.55, serenity: 0.5, valence: 0.5 },
};

/* ── A handful of iconic artists with strong mood signatures ──────────── */
export const ARTIST_PRIORS: Record<string, EmotionInput> = {
  "bon iver": { melancholy: 0.7, serenity: 0.6, warmth: 0.55, loneliness: 0.5 },
  "lana del rey": { melancholy: 0.7, nostalgia: 0.7, romance: 0.6, darkness: 0.4 },
  "frank ocean": { melancholy: 0.6, warmth: 0.6, romance: 0.55, nostalgia: 0.5 },
  "the weeknd": { darkness: 0.6, romance: 0.55, energy: 0.55, melancholy: 0.4 },
  "billie eilish": { darkness: 0.6, melancholy: 0.55, tension: 0.45 },
  radiohead: { melancholy: 0.65, tension: 0.55, darkness: 0.5, focus: 0.4 },
  sufjan: { melancholy: 0.75, serenity: 0.6, loneliness: 0.55, warmth: 0.45 },
  "sufjan stevens": { melancholy: 0.75, serenity: 0.6, loneliness: 0.55 },
  drake: { melancholy: 0.5, triumph: 0.55, romance: 0.4, nostalgia: 0.4 },
  "kendrick lamar": { triumph: 0.6, tension: 0.55, aggression: 0.45, focus: 0.4 },
  "kanye west": { triumph: 0.65, energy: 0.6, aggression: 0.4 },
  "taylor swift": { nostalgia: 0.6, romance: 0.55, valence: 0.5, melancholy: 0.35 },
  "phoebe bridgers": { melancholy: 0.8, loneliness: 0.6, serenity: 0.4 },
  metallica: { aggression: 0.9, energy: 0.9, triumph: 0.5, darkness: 0.45 },
  "daft punk": { energy: 0.8, playfulness: 0.65, nostalgia: 0.55, triumph: 0.4 },
  odesza: { hope: 0.65, serenity: 0.55, energy: 0.55, triumph: 0.45 },
  "hans zimmer": { triumph: 0.8, tension: 0.55, focus: 0.6 },
  "ludovico einaudi": { melancholy: 0.6, serenity: 0.7, focus: 0.65 },
  fleetwood: { nostalgia: 0.7, warmth: 0.55, melancholy: 0.4 },
  "fleetwood mac": { nostalgia: 0.7, warmth: 0.55, valence: 0.5 },
  "tame impala": { nostalgia: 0.6, serenity: 0.5, playfulness: 0.45, melancholy: 0.4 },
  "arctic monkeys": { energy: 0.65, darkness: 0.4, romance: 0.4, nostalgia: 0.4 },
  "the 1975": { nostalgia: 0.55, romance: 0.5, melancholy: 0.45, playfulness: 0.4 },
  sza: { romance: 0.6, melancholy: 0.5, warmth: 0.55 },
  "tyler the creator": { playfulness: 0.6, warmth: 0.5, energy: 0.55, melancholy: 0.4 },
  "mac miller": { melancholy: 0.6, warmth: 0.55, serenity: 0.45, nostalgia: 0.45 },
  "kid cudi": { melancholy: 0.55, loneliness: 0.55, hope: 0.45, energy: 0.5 },
  "beach house": { melancholy: 0.6, serenity: 0.55, nostalgia: 0.6 },
  "florence the machine": { triumph: 0.6, tension: 0.5, hope: 0.55, romance: 0.45 },
  "florence and the machine": { triumph: 0.6, tension: 0.5, hope: 0.55 },
  abba: { nostalgia: 0.75, valence: 0.75, playfulness: 0.65 },
  queen: { triumph: 0.8, energy: 0.72, playfulness: 0.5, nostalgia: 0.55 },
  adele: { melancholy: 0.7, warmth: 0.55, romance: 0.5, triumph: 0.4 },
};

/* ── Moment vocabulary ────────────────────────────────────────────────── */
export type SignalField = "emotion" | "situation" | "energy" | "social";

export interface MomentTerm {
  /** words / phrases that trigger this term (lowercased, matched as substrings on word boundaries) */
  match: string[];
  /** emotional contribution toward the target vector */
  dims: EmotionInput;
  /** which signal chip this fills, and the label to show */
  signal?: { field: SignalField; label: string };
  /** relative weight (default 1) */
  weight?: number;
}

export const MOMENT_LEXICON: MomentTerm[] = [
  // ── emotions ──
  { match: ["happy", "joy", "joyful", "good mood", "cheerful"], dims: { valence: 0.9, playfulness: 0.6, energy: 0.55 }, signal: { field: "emotion", label: "happy" } },
  { match: ["sad", "depressed", "miserable", "gloomy", "feeling down", "feeling blue"], dims: { valence: 0.12, melancholy: 0.85, loneliness: 0.4 }, signal: { field: "emotion", label: "sad" } },
  { match: ["heartbroken", "heartbreak", "breakup", "broke up", "broken heart", "dumped"], dims: { melancholy: 0.9, valence: 0.18, loneliness: 0.6, romance: 0.3 }, signal: { field: "emotion", label: "heartbroken" }, weight: 1.2 },
  { match: ["angry", "anger", "rage", "furious", "pissed", "mad"], dims: { aggression: 0.9, energy: 0.75, tension: 0.6, valence: 0.25 }, signal: { field: "emotion", label: "angry" } },
  { match: ["anxious", "anxiety", "stressed", "overwhelmed", "nervous", "panic"], dims: { tension: 0.85, energy: 0.5, valence: 0.3, serenity: 0.05 }, signal: { field: "emotion", label: "anxious" } },
  { match: ["calm", "chill", "relaxed", "relax", "peaceful", "unwind", "decompress"], dims: { serenity: 0.85, energy: 0.25, tension: 0.1, warmth: 0.45 }, signal: { field: "emotion", label: "calm" } },
  { match: ["nostalgic", "nostalgia", "memories", "throwback", "remember when", "old times"], dims: { nostalgia: 0.9, warmth: 0.5, melancholy: 0.4 }, signal: { field: "emotion", label: "nostalgic" } },
  { match: ["lonely", "alone", "isolated", "by myself"], dims: { loneliness: 0.85, melancholy: 0.5 }, signal: { field: "emotion", label: "lonely" } },
  { match: ["hopeful", "optimistic", "hope", "better days", "looking up"], dims: { hope: 0.85, valence: 0.55, warmth: 0.4 }, signal: { field: "emotion", label: "hopeful" } },
  { match: ["motivated", "motivation", "driven", "focused", "grind", "lock in", "locked in"], dims: { triumph: 0.6, energy: 0.7, focus: 0.8, tension: 0.3 }, signal: { field: "emotion", label: "motivated" } },
  { match: ["invincible", "unstoppable", "powerful", "on top", "god mode", "untouchable"], dims: { triumph: 0.95, energy: 0.8, valence: 0.6 }, signal: { field: "emotion", label: "invincible" }, weight: 1.2 },
  { match: ["romantic", "in love", "crush", "butterflies", "lovey"], dims: { romance: 0.9, warmth: 0.6, valence: 0.55 }, signal: { field: "emotion", label: "romantic" } },
  { match: ["melancholy", "wistful", "bittersweet", "longing", "yearning"], dims: { melancholy: 0.85, nostalgia: 0.5, warmth: 0.35 }, signal: { field: "emotion", label: "wistful" } },
  { match: ["cozy", "content", "comfortable", "comfy", "warm"], dims: { warmth: 0.75, serenity: 0.6, valence: 0.55 }, signal: { field: "emotion", label: "cozy" } },
  { match: ["euphoric", "ecstatic", "high on life", "blissful"], dims: { valence: 0.9, energy: 0.8, arousal: 0.8, playfulness: 0.6 }, signal: { field: "emotion", label: "euphoric" } },
  { match: ["confident", "bold", "fearless", "self assured"], dims: { triumph: 0.7, valence: 0.55, energy: 0.55 }, signal: { field: "emotion", label: "confident" } },
  { match: ["numb", "empty", "hollow", "nothing"], dims: { melancholy: 0.6, darkness: 0.45, valence: 0.25, serenity: 0.3 }, signal: { field: "emotion", label: "numb" } },

  // ── situations ──
  { match: ["driving", "drive", "road", "highway", "behind the wheel"], dims: { energy: 0.45, serenity: 0.35, focus: 0.4 }, signal: { field: "situation", label: "driving" } },
  { match: ["road trip", "roadtrip"], dims: { valence: 0.6, playfulness: 0.5, nostalgia: 0.45, energy: 0.5 }, signal: { field: "situation", label: "road trip" } },
  { match: ["gym", "workout", "lifting", "lift", "exercise", "training", "pump"], dims: { energy: 0.92, arousal: 0.85, aggression: 0.55, triumph: 0.6 }, signal: { field: "situation", label: "workout" }, weight: 1.2 },
  { match: ["running", "run ", "jog", "cardio"], dims: { energy: 0.85, arousal: 0.8, triumph: 0.45 }, signal: { field: "situation", label: "running" } },
  { match: ["study", "studying", "homework", "exam", "exams", "revise"], dims: { focus: 0.92, serenity: 0.45, energy: 0.35, tension: 0.25 }, signal: { field: "situation", label: "studying" } },
  { match: ["focus", "deep focus", "concentrate", "concentration", "dnd", "in the zone", "flow state"], dims: { focus: 0.92, serenity: 0.45, energy: 0.4, tension: 0.2 }, signal: { field: "situation", label: "deep focus" } },
  { match: ["work", "working", "coding", "deep work", "deadline", "office"], dims: { focus: 0.9, energy: 0.45, serenity: 0.35 }, signal: { field: "situation", label: "work" } },
  { match: ["sleep", "sleeping", "bed", "insomnia", "can't sleep", "cant sleep", "wind down", "winding down"], dims: { serenity: 0.85, energy: 0.12, arousal: 0.1, warmth: 0.45 }, signal: { field: "situation", label: "winding down" } },
  { match: ["party", "club", "rave", "night out", "going out", "pregame", "pre game", "pre-game"], dims: { energy: 0.9, arousal: 0.88, playfulness: 0.75, valence: 0.7 }, signal: { field: "situation", label: "party" } },
  { match: ["commute", "train", "bus", "subway"], dims: { focus: 0.5, serenity: 0.4, energy: 0.4 }, signal: { field: "situation", label: "commute" } },
  { match: ["walk", "walking", "stroll"], dims: { serenity: 0.6, energy: 0.45, valence: 0.5 }, signal: { field: "situation", label: "walking" } },
  { match: ["morning", "sunrise", "wake up", "waking up", "coffee"], dims: { hope: 0.5, warmth: 0.5, energy: 0.45, valence: 0.55 }, signal: { field: "situation", label: "morning" } },
  { match: ["night", "late night", "2am", "3am", "midnight", "after hours"], dims: { darkness: 0.45, serenity: 0.35, energy: 0.3, romance: 0.25 }, signal: { field: "situation", label: "night" } },
  { match: ["rain", "rainy", "storm", "grey", "gray"], dims: { melancholy: 0.5, serenity: 0.45, nostalgia: 0.3 }, signal: { field: "situation", label: "rain" } },
  { match: ["cooking", "kitchen", "cleaning", "chores", "tidy"], dims: { valence: 0.6, playfulness: 0.55, energy: 0.55, warmth: 0.45 }, signal: { field: "situation", label: "at home" } },
  { match: ["sunset", "golden hour", "dusk"], dims: { warmth: 0.6, nostalgia: 0.55, romance: 0.45, serenity: 0.5 }, signal: { field: "situation", label: "golden hour" } },
  { match: ["date", "dinner", "candlelight"], dims: { romance: 0.8, warmth: 0.6, serenity: 0.45 }, signal: { field: "situation", label: "date night" } },
  { match: ["reading", "book", "journaling"], dims: { focus: 0.7, serenity: 0.65, warmth: 0.4 }, signal: { field: "situation", label: "reading" } },

  // ── energy ──
  { match: ["tired", "exhausted", "drained", "sleepy", "burnt out", "burned out", "no energy"], dims: { energy: 0.18, arousal: 0.15, serenity: 0.4 }, signal: { field: "energy", label: "low" } },
  { match: ["hyped", "energetic", "pumped", "amped", "wired", "full of energy"], dims: { energy: 0.92, arousal: 0.9 }, signal: { field: "energy", label: "high" } },
  { match: ["mellow", "laid back", "laid-back", "easy", "slow"], dims: { energy: 0.3, serenity: 0.6 }, signal: { field: "energy", label: "low-mid" } },

  // ── social ──
  { match: ["alone", "solo", "by myself", "on my own"], dims: { loneliness: 0.4 }, signal: { field: "social", label: "solo" } },
  { match: ["friends", "with friends", "squad", "the boys", "the girls", "group"], dims: { valence: 0.6, playfulness: 0.6, warmth: 0.5 }, signal: { field: "social", label: "with friends" } },
  { match: ["partner", "boyfriend", "girlfriend", "lover", "with bae", "with my person"], dims: { romance: 0.7, warmth: 0.6 }, signal: { field: "social", label: "with partner" } },
];

/* Words that flip the meaning of the emotion that follows. */
export const NEGATORS = ["not", "no", "don't", "dont", "without", "anti", "never", "stop"];
/* Words that mark a contrast — let two feelings coexist (e.g., "sad but hopeful"). */
export const CONTRASTS = ["but", "yet", "though", "however", "still", "even though"];
