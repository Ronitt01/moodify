import { GENRE_PRIORS, KEYWORD_PRIORS, ARTIST_PRIORS } from "./lexicon";
import { vec, addInto, clampVec, topDims, DIM, type DimName } from "./space";

export interface TrackMeta {
  title: string;
  artist: string;
  genres?: string[];
  year?: number | null;
}

export interface TrackEmotion {
  emotion: number[];
  tags: { top: DimName[] };
  model: string;
}

const WORD = /[a-z0-9'&-]+/g;
const wordsOf = (s: string) => new Set((s.toLowerCase().match(WORD) ?? []));

/**
 * Derive a track's 16-dim emotional vector from its metadata.
 * Genres set the base feeling; title words and artist signatures nuance it;
 * era adds nostalgia. Deterministic — same input always yields the same vector.
 */
export function tagTrack(meta: TrackMeta): TrackEmotion {
  const acc = new Array(DIM).fill(0);
  let signals = 0;

  const genreText = (meta.genres ?? []).join(" ").toLowerCase();
  for (const g in GENRE_PRIORS) {
    if (genreText.includes(g)) {
      addInto(acc, vec(GENRE_PRIORS[g]), 1.0);
      signals++;
    }
  }

  const titleWords = wordsOf(meta.title);
  for (const k in KEYWORD_PRIORS) {
    if (titleWords.has(k)) {
      addInto(acc, vec(KEYWORD_PRIORS[k]), 0.6);
      signals++;
    }
  }

  const artist = meta.artist.toLowerCase();
  for (const a in ARTIST_PRIORS) {
    if (artist.includes(a)) {
      addInto(acc, vec(ARTIST_PRIORS[a]), 0.7);
      signals++;
      break;
    }
  }

  if (meta.year) {
    if (meta.year <= 1989) addInto(acc, vec({ nostalgia: 0.7, warmth: 0.3 }), 0.8);
    else if (meta.year <= 2005) addInto(acc, vec({ nostalgia: 0.5 }), 0.6);
    else if (meta.year <= 2014) addInto(acc, vec({ nostalgia: 0.3 }), 0.4);
  }

  if (signals === 0) {
    addInto(acc, vec({ valence: 0.5, energy: 0.5, warmth: 0.45, serenity: 0.4 }), 1);
  }

  // Soft-normalize: scale by contribution count so multi-genre sums don't blow
  // past 1, then add a small floor. Direction matters more than magnitude
  // (scoring uses centered cosine), but we keep values in 0..1 for storage/UX.
  const denom = Math.max(1, 0.5 + signals * 0.55);
  const emotion = clampVec(acc.map((x) => x / denom + 0.06));

  return {
    emotion,
    tags: { top: topDims(emotion, 3).map((d) => d.name) },
    model: "local-lexicon-v1",
  };
}
