import "server-only";
import { query, toVec, toTextArray } from "@/server/db";
import { tagTrack } from "@/server/emotion/track";
import { topDims, vec, clampVec, lerp, EMOTION_DIMS, type DimName, type EmotionInput } from "@/server/emotion/space";
import type { MomentReading } from "@/server/emotion/moment";
import { topTracksByTag, topTracksByArtist, lastfmConfigured, type LastfmTrack } from "@/server/lastfm";
import { rankCandidates, type CandidateRow, type QueueTrack } from "@/server/engine";

/**
 * Discovery — the "all of music" universe, free of Spotify Premium.
 *
 * A moment's top emotions become Last.fm mood tags; we pull the community's top
 * tracks for them, tag with Moodify's emotion model, cache them (so the
 * catalogue compounds), rank with the shared taste-aware engine, and link each
 * out to Spotify. Optional language pools and a featured artist layer on top.
 * Falls back to the local universe when Last.fm isn't set up or returns little.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DIM_TAG: Partial<Record<DimName, string>> = {
  valence: "feel good",
  energy: "energetic",
  arousal: "upbeat",
  tension: "intense",
  melancholy: "melancholy",
  nostalgia: "nostalgia",
  warmth: "mellow",
  aggression: "aggressive",
  serenity: "chillout",
  hope: "uplifting",
  loneliness: "sad",
  triumph: "epic",
  romance: "romantic",
  darkness: "dark",
  playfulness: "fun",
  focus: "instrumental",
};

const SITUATION_TAG: Record<string, string> = {
  workout: "workout",
  gym: "workout",
  running: "running",
  studying: "study",
  work: "instrumental",
  focus: "instrumental",
  party: "party",
  "winding down": "chillout",
  night: "chillout",
  sleep: "sleep",
  drive: "driving",
  commute: "driving",
};

const TAG_EMOTION: Record<string, EmotionInput> = {
  "feel good": { valence: 0.85, energy: 0.6, playfulness: 0.55, warmth: 0.5 },
  energetic: { energy: 0.9, arousal: 0.8, valence: 0.6 },
  upbeat: { energy: 0.75, valence: 0.78, playfulness: 0.55, arousal: 0.6 },
  intense: { tension: 0.8, energy: 0.78, arousal: 0.72 },
  melancholy: { melancholy: 0.85, valence: 0.2, warmth: 0.4, serenity: 0.4 },
  sad: { melancholy: 0.82, valence: 0.15, loneliness: 0.6 },
  nostalgia: { nostalgia: 0.85, warmth: 0.55, melancholy: 0.4 },
  mellow: { warmth: 0.7, serenity: 0.72, energy: 0.3 },
  aggressive: { aggression: 0.9, energy: 0.85, tension: 0.7, darkness: 0.5 },
  chillout: { serenity: 0.85, energy: 0.22, warmth: 0.5 },
  uplifting: { hope: 0.85, valence: 0.7, triumph: 0.5 },
  epic: { triumph: 0.85, energy: 0.72, hope: 0.6 },
  romantic: { romance: 0.85, warmth: 0.7, valence: 0.6 },
  dark: { darkness: 0.85, melancholy: 0.5, tension: 0.5, valence: 0.22 },
  fun: { playfulness: 0.85, valence: 0.75, energy: 0.62 },
  instrumental: { focus: 0.72, serenity: 0.55 },
  workout: { energy: 0.9, aggression: 0.6, triumph: 0.55, arousal: 0.82 },
  running: { energy: 0.88, arousal: 0.8, triumph: 0.5 },
  study: { focus: 0.85, serenity: 0.55, energy: 0.3 },
  party: { energy: 0.85, playfulness: 0.8, valence: 0.82 },
  sleep: { serenity: 0.9, energy: 0.1, warmth: 0.5 },
  driving: { energy: 0.62, nostalgia: 0.45, hope: 0.45 },
};

const LANGUAGE_TAGS: Record<string, string[]> = {
  english: [],
  hindi: ["bollywood"],
  punjabi: ["punjabi"],
  tamil: ["tamil"],
  telugu: ["telugu"],
  korean: ["k-pop"],
  spanish: ["latin"],
  japanese: ["j-pop"],
  arabic: ["arabic"],
};

type Item = { title: string; artist: string; genres: string[]; emotion: number[] };

/** Upsert tracks + emotions (one round-trip each), return them as CandidateRows. */
async function persistTracks(items: Item[]): Promise<CandidateRow[]> {
  // Dedupe by the slug id (the ON CONFLICT key) first — a single INSERT must not
  // target the same row twice, or Postgres errors "cannot affect row a second
  // time" (different titles can normalise to the same slug).
  const byExt = new Map<string, Item>();
  for (const it of items) {
    const ext = slug(`${it.title}-${it.artist}`);
    if (ext && !byExt.has(ext)) byExt.set(ext, it);
  }
  const uniq = Array.from(byExt, ([ext, it]) => ({ ext, it }));
  if (!uniq.length) return [];

  const tParams: unknown[] = [];
  const tTuples = uniq.map(({ ext, it }) => {
    const b = tParams.length;
    tParams.push(ext, it.title, it.artist, toTextArray(it.genres));
    return `('lastfm', $${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}::text[])`;
  });
  const idRows = await query<{ id: string; external_id: string }>(
    `insert into tracks (source, external_id, title, artist, genres)
       values ${tTuples.join(",")}
     on conflict (source, external_id) do update set title = excluded.title, genres = excluded.genres
     returning id, external_id`,
    tParams
  );
  const idByExt = new Map(idRows.map((r) => [r.external_id, r.id]));

  const eParams: unknown[] = [];
  const eTuples: string[] = [];
  const rows: CandidateRow[] = [];
  for (const { ext, it } of uniq) {
    const id = idByExt.get(ext);
    if (!id) continue;
    const vector = toVec(it.emotion);
    const b = eParams.length;
    eParams.push(id, vector, JSON.stringify({ moods: it.genres }), "lastfm+lexicon-v1");
    eTuples.push(`($${b + 1}, $${b + 2}::vector, $${b + 3}::jsonb, $${b + 4})`);
    rows.push({
      id,
      title: it.title,
      artist: it.artist,
      genres: it.genres,
      year: null,
      source: "lastfm",
      emotion: vector,
      external_id: ext,
      image_url: null,
    });
  }
  if (eTuples.length) {
    await query(
      `insert into track_emotions (track_id, emotion, tags, model)
         values ${eTuples.join(",")}
       on conflict (track_id) do update set emotion = excluded.emotion, updated_at = now()`,
      eParams
    );
  }
  return rows;
}

/** Returns a ranked queue sourced live from Last.fm, or null to fall back. */
export async function discover(
  userId: string,
  reading: MomentReading,
  limit = 12,
  languages: string[] = [],
  artist?: string
): Promise<QueueTrack[] | null> {
  if (!lastfmConfigured()) return null;

  const sig = reading.signals as Record<string, string | null | undefined>;
  const sit = sig?.situation ? SITUATION_TAG[String(sig.situation).toLowerCase()] : undefined;
  const moodTags: string[] = [];
  if (sit) moodTags.push(sit);
  for (const d of topDims(reading.target, 3)) {
    if (d.value > 0.45 && DIM_TAG[d.name]) moodTags.push(DIM_TAG[d.name] as string);
  }
  const uniqueMoodTags = Array.from(new Set(moodTags)).slice(0, 4);
  const moodTagSet = new Set(uniqueMoodTags);

  const langs = languages.length ? languages.map((l) => l.toLowerCase()) : ["english"];
  const includeGlobal = langs.includes("english");
  const langTags = Array.from(new Set(langs.flatMap((l) => LANGUAGE_TAGS[l] ?? [])));
  const finalTags = Array.from(
    new Set([...(includeGlobal ? uniqueMoodTags : []), ...langTags])
  ).slice(0, 6);

  // 1. Pull mood/language tracks and (optionally) the featured artist concurrently.
  const [lists, artistTracks] = await Promise.all([
    finalTags.length ? Promise.all(finalTags.map((t) => topTracksByTag(t, 30))) : Promise.resolve<LastfmTrack[][]>([]),
    artist && artist.trim() ? topTracksByArtist(artist.trim(), 12) : Promise.resolve<LastfmTrack[]>([]),
  ]);

  // 2. Dedupe tag tracks, collecting every mood tag each one matched.
  const byKey = new Map<string, { t: LastfmTrack; tags: Set<string> }>();
  for (const list of lists) {
    for (const t of list) {
      const k = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`;
      const e = byKey.get(k);
      if (e) e.tags.add(t.tag);
      else byKey.set(k, { t, tags: new Set([t.tag]) });
    }
  }
  const entries = Array.from(byKey.values());
  if (entries.length < 5 && artistTracks.length === 0) return null;

  // 3. Emotion: union of matched moods (full strength); language-pool tracks
  //    (no mood tag) seeded to the moment's own target so they fit the vibe.
  const moodItems: Item[] = entries.map((e) => {
    const moodMatches = Array.from(e.tags).filter((tg) => moodTagSet.has(tg));
    let moodVec: number[];
    if (moodMatches.length) {
      moodVec = new Array(EMOTION_DIMS.length).fill(0);
      for (const tg of moodMatches) {
        const v = vec(TAG_EMOTION[tg] ?? {});
        for (let i = 0; i < moodVec.length; i++) moodVec[i] = Math.max(moodVec[i], v[i]);
      }
    } else {
      moodVec = reading.target.slice();
    }
    const nuance = tagTrack({ title: e.t.title, artist: e.t.artist, genres: Array.from(e.tags) }).emotion;
    return { title: e.t.title, artist: e.t.artist, genres: Array.from(e.tags), emotion: clampVec(lerp(moodVec, nuance, 0.3)) };
  });
  const rows = await persistTracks(moodItems);

  // 4. Rank, then balance round-robin across multiple active languages.
  const ranked = await rankCandidates(userId, reading, rows, Math.max(limit, rows.length));
  const activeLangs = includeGlobal ? langs : langs.filter((l) => (LANGUAGE_TAGS[l] ?? []).length);
  let base: QueueTrack[];
  if (activeLangs.length <= 1) {
    base = ranked.slice(0, limit);
  } else {
    const langTagSet = new Set(langTags);
    const langOf = (t: QueueTrack) => t.genres.find((g) => langTagSet.has(g)) ?? "english";
    const buckets = new Map<string, QueueTrack[]>();
    for (const t of ranked) {
      const k = langOf(t);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(t);
    }
    const order = Array.from(buckets.keys());
    base = [];
    for (let i = 0; base.length < limit && order.some((k) => buckets.get(k)!.length); i++) {
      const b = buckets.get(order[i % order.length])!;
      if (b.length) base.push(b.shift()!);
    }
  }

  // 5. Featured artist: lead with 1–2 of their tracks (mood-ranked), rest = others.
  if (artistTracks.length) {
    const seen = new Set<string>();
    const aItems: Item[] = [];
    for (const t of artistTracks) {
      const k = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const nuance = tagTrack({ title: t.title, artist: t.artist, genres: [] }).emotion;
      aItems.push({ title: t.title, artist: t.artist, genres: [], emotion: clampVec(lerp(reading.target.slice(), nuance, 0.25)) });
    }
    const artistRows = await persistTracks(aItems);
    const pinned = (await rankCandidates(userId, reading, artistRows, 4)).slice(0, 2);
    if (pinned.length) {
      const ids = new Set(pinned.map((t) => t.id));
      const out = base.filter((t) => !ids.has(t.id));
      out.splice(0, 0, pinned[0]);
      if (pinned[1]) out.splice(Math.min(3, out.length), 0, pinned[1]);
      base = out.slice(0, limit);
    }
  }

  return base.length ? base : null;
}
