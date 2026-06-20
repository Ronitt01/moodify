import "server-only";
import { query, parseVec, parseTextArray, toVec } from "@/server/db";
import { affinity, named, EMOTION_DIMS, type DimName } from "@/server/emotion/space";
import type { MomentReading } from "@/server/emotion/moment";
import { getTaste, getFeedbackSets } from "@/server/taste";

/**
 * The recommendation engine.
 *
 * Two stages, on purpose:
 *  1. pgvector retrieves the closest candidates from the user's universe
 *     (`emotion <=> target`) — fast, and scales to large Spotify libraries.
 *  2. JS re-ranks those candidates with richer signal: centered cosine
 *     (directional feeling), soft context nudges, and artist diversity — then
 *     explains *why* each track fits. Recommendations only ever come from the
 *     user's Master Playlists.
 */

export interface QueueTrack {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  year: number | null;
  source: string;
  externalId: string | null;
  image: string | null;
  score: number;
  fit: number;
  why: string[];
  emotion: Record<DimName, number>;
}

export interface CandidateRow {
  id: string;
  title: string;
  artist: string;
  genres: unknown;
  year: number | null;
  source: string;
  emotion: unknown;
  external_id?: string | null;
  image_url?: string | null;
}

const WHY_PHRASE: Partial<Record<DimName, string>> = {
  valence: "lifts the mood",
  energy: "matches your energy",
  arousal: "high-octane",
  tension: "keeps an edge",
  melancholy: "sits with the feeling",
  nostalgia: "leans nostalgic",
  warmth: "warm and intimate",
  aggression: "hits hard",
  serenity: "keeps it calm",
  hope: "quietly hopeful",
  loneliness: "for the solitude",
  triumph: "feels powerful",
  romance: "romantic warmth",
  darkness: "moody, after-dark",
  playfulness: "keeps it fun",
  focus: "holds focus",
};

/** Soft context nudges. Intent (the target vector) already dominates the match. */
function contextBoost(track: number[], reading: MomentReading): number {
  const t = named(track);
  const sit = reading.signals.situation;
  const en = reading.signals.energy;
  let b = 0;
  if (sit === "workout" || sit === "running") b += (t.energy - 0.5) * 0.25 + (t.aggression - 0.4) * 0.1;
  if (sit === "studying" || sit === "work") b += (t.focus - 0.5) * 0.3 - t.aggression * 0.12;
  if (sit === "winding down" || sit === "night" || en === "low") b += (0.5 - t.energy) * 0.25;
  if (sit === "party") b += (t.energy - 0.5) * 0.2 + (t.playfulness - 0.5) * 0.15;
  return b;
}

/**
 * Shared taste-aware re-rank over any candidate set (local universe OR live
 * Spotify discovery). pgvector already did coarse retrieval upstream; here we
 * apply centered-cosine affinity, the user's learned taste profile, soft
 * context nudges, reaction memory, and artist diversity — then explain why.
 */
export async function rankCandidates(
  userId: string,
  reading: MomentReading,
  rows: CandidateRow[],
  limit = 12
): Promise<QueueTrack[]> {
  const [taste, fb] = await Promise.all([getTaste(userId), getFeedbackSets(userId)]);

  // Taste influence ramps up with how much we've learned (capped), so a brand
  // new user is driven purely by the moment, not a thin, noisy profile.
  const tasteW = taste.profile ? Math.min(0.22, 0.05 + taste.interactions * 0.015) : 0;

  type Scored = QueueTrack & { _artist: string };
  const scored: Scored[] = rows.map((r) => {
    const emo = parseVec(r.emotion);
    const base = affinity(reading.target, emo); // 0..1, direction-aware
    const tasteFit = taste.profile ? affinity(taste.profile, emo) : 0.5;
    let s = base * (1 - tasteW) + tasteFit * tasteW + contextBoost(emo, reading);
    if (fb.loved.has(r.id)) s += 0.06; // you've loved this one before
    else if (fb.played.has(r.id)) s += 0.03; // you played it — lean in a little
    if (fb.skipped.has(r.id)) s -= 0.5; // you skipped it — push it down
    const score = Math.max(0, Math.min(1, s));

    const why = EMOTION_DIMS.map((d, i) => ({ d, both: Math.min(reading.target[i], emo[i]) }))
      .filter((x) => x.both > 0.45 && WHY_PHRASE[x.d])
      .sort((a, b) => b.both - a.both)
      .slice(0, 2)
      .map((x) => WHY_PHRASE[x.d] as string);
    if (fb.loved.has(r.id)) why.unshift("you loved this");
    else if (fb.played.has(r.id)) why.unshift("you played this");
    else if (tasteW > 0 && tasteFit > 0.62) why.push("fits your taste");

    return {
      id: r.id,
      title: r.title,
      artist: r.artist,
      genres: parseTextArray(r.genres),
      year: r.year,
      source: r.source,
      externalId: r.external_id ?? null,
      image: r.image_url ?? null,
      score,
      fit: 0,
      why,
      emotion: named(emo),
      _artist: r.artist.toLowerCase(),
    };
  });

  // Diversity: damp repeated artists so a queue isn't one artist five times.
  const seen = new Map<string, number>();
  for (const s of scored) {
    const c = seen.get(s._artist) ?? 0;
    s.score -= c * 0.08;
    seen.set(s._artist, c + 1);
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  // Present score as a friendly "fit %", spread by rank so the list reads well.
  top.forEach((s, i) => {
    s.fit = Math.round(Math.max(60, Math.min(97, 70 + s.score * 30 - i * 0.8)));
  });

  return top.map(({ _artist, ...rest }) => rest);
}

/**
 * Recommend from the user's own universe (seed / imported / Spotify library):
 * pgvector candidate retrieval, then the shared taste-aware re-rank.
 */
export async function recommend(
  userId: string,
  reading: MomentReading,
  limit = 12
): Promise<QueueTrack[]> {
  const target = toVec(reading.target);
  const rows = await query<CandidateRow>(
    `select t.id, t.title, t.artist, t.genres, t.year, t.source, t.external_id, t.image_url,
            te.emotion::text as emotion
       from master_playlist_tracks m
       join tracks t          on t.id = m.track_id
       join track_emotions te on te.track_id = t.id
      where m.user_id = $1
      order by te.emotion <=> $2::vector
      limit 80`,
    [userId, target]
  );
  return rankCandidates(userId, reading, rows, limit);
}
