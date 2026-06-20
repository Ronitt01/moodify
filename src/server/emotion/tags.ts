import { vec, clampVec, type EmotionInput } from "./space";
import { tagTrack } from "./track";

/**
 * Emotion profiles for common Last.fm mood + genre + cultural tags (0..1 per
 * named dim). Used to turn an artist's defining tags (or a vibe chip) into a
 * vector so we can match the right favourite to a moment.
 */
export const TAG_EMOTION: Record<string, EmotionInput> = {
  // moods
  "feel good": { valence: 0.85, energy: 0.6, playfulness: 0.55, warmth: 0.5 },
  happy: { valence: 0.85, energy: 0.6, playfulness: 0.55 },
  energetic: { energy: 0.9, arousal: 0.8, valence: 0.6 },
  upbeat: { energy: 0.75, valence: 0.78, playfulness: 0.55, arousal: 0.6 },
  intense: { tension: 0.8, energy: 0.78, arousal: 0.72 },
  melancholy: { melancholy: 0.85, valence: 0.2, warmth: 0.4, serenity: 0.4 },
  melancholic: { melancholy: 0.85, valence: 0.2, warmth: 0.4 },
  sad: { melancholy: 0.82, valence: 0.15, loneliness: 0.6 },
  nostalgia: { nostalgia: 0.85, warmth: 0.55, melancholy: 0.4 },
  nostalgic: { nostalgia: 0.85, warmth: 0.55 },
  mellow: { warmth: 0.7, serenity: 0.72, energy: 0.3 },
  chill: { serenity: 0.8, energy: 0.28, warmth: 0.5 },
  chillout: { serenity: 0.85, energy: 0.22, warmth: 0.5 },
  aggressive: { aggression: 0.9, energy: 0.85, tension: 0.7, darkness: 0.5 },
  uplifting: { hope: 0.85, valence: 0.7, triumph: 0.5 },
  epic: { triumph: 0.85, energy: 0.72, hope: 0.6 },
  romantic: { romance: 0.85, warmth: 0.7, valence: 0.6 },
  love: { romance: 0.78, warmth: 0.7, valence: 0.6 },
  dark: { darkness: 0.85, melancholy: 0.5, tension: 0.5, valence: 0.22 },
  fun: { playfulness: 0.85, valence: 0.75, energy: 0.62 },
  party: { energy: 0.85, playfulness: 0.8, valence: 0.82 },
  // genres
  "hip-hop": { energy: 0.78, aggression: 0.55, triumph: 0.5, playfulness: 0.4 },
  "hip hop": { energy: 0.78, aggression: 0.55, triumph: 0.5, playfulness: 0.4 },
  rap: { energy: 0.78, aggression: 0.6, triumph: 0.55 },
  "hardcore hip-hop": { aggression: 0.85, energy: 0.85, tension: 0.6 },
  trap: { energy: 0.75, aggression: 0.6, darkness: 0.45 },
  pop: { valence: 0.7, energy: 0.62, playfulness: 0.5 },
  rock: { energy: 0.78, aggression: 0.5, tension: 0.45 },
  metal: { aggression: 0.9, energy: 0.85, darkness: 0.6, tension: 0.7 },
  indie: { melancholy: 0.5, warmth: 0.55, nostalgia: 0.45 },
  "indie pop": { valence: 0.6, warmth: 0.55, playfulness: 0.5 },
  "r&b": { romance: 0.6, warmth: 0.7, valence: 0.55 },
  rnb: { romance: 0.6, warmth: 0.7, valence: 0.55 },
  soul: { warmth: 0.75, romance: 0.55, valence: 0.55 },
  funk: { playfulness: 0.7, energy: 0.7, valence: 0.7 },
  electronic: { energy: 0.72, arousal: 0.62 },
  edm: { energy: 0.88, arousal: 0.78, valence: 0.6 },
  house: { energy: 0.72, valence: 0.6 },
  techno: { energy: 0.78, tension: 0.5, darkness: 0.4 },
  "lo-fi": { serenity: 0.78, warmth: 0.55, focus: 0.55, energy: 0.25 },
  lofi: { serenity: 0.78, warmth: 0.55, focus: 0.55, energy: 0.25 },
  ambient: { serenity: 0.85, focus: 0.5, energy: 0.18 },
  classical: { focus: 0.62, serenity: 0.6, warmth: 0.45 },
  jazz: { warmth: 0.7, serenity: 0.55, romance: 0.45 },
  folk: { warmth: 0.65, nostalgia: 0.6, serenity: 0.5 },
  acoustic: { warmth: 0.68, serenity: 0.55, melancholy: 0.35 },
  // cultural
  bollywood: { romance: 0.6, warmth: 0.6, valence: 0.55, playfulness: 0.4 },
  indian: { warmth: 0.55, romance: 0.45 },
  punjabi: { energy: 0.78, playfulness: 0.7, valence: 0.65 },
  bhangra: { energy: 0.85, playfulness: 0.78, valence: 0.72 },
  "k-pop": { energy: 0.75, playfulness: 0.7, valence: 0.72 },
  latin: { energy: 0.72, playfulness: 0.68, romance: 0.5, valence: 0.68 },
};

/** Emotion for a set of tags: union of known mood/genre tags, else lexicon fallback. */
export function tagsEmotion(tags: string[]): number[] {
  const out = new Array(16).fill(0);
  let hits = 0;
  for (const t of tags) {
    const m = TAG_EMOTION[t.toLowerCase().trim()];
    if (m) {
      const v = vec(m);
      for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], v[i]);
      hits++;
    }
  }
  if (hits) return clampVec(out);
  return tagTrack({ title: "", artist: "", genres: tags }).emotion;
}
