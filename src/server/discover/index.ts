import "server-only";
import { query, toVec, toTextArray } from "@/server/db";
import { tagTrack } from "@/server/emotion/track";
import { topDims, vec, clampVec, lerp, EMOTION_DIMS, type DimName, type EmotionInput } from "@/server/emotion/space";
import type { MomentReading } from "@/server/emotion/moment";
import { topTracksByTag, lastfmConfigured, type LastfmTrack } from "@/server/lastfm";
import { rankCandidates, type CandidateRow, type QueueTrack } from "@/server/engine";

/**
 * Discovery — the "all of music" universe, free of Spotify Premium.
 *
 * We translate a moment's top emotional dimensions into Last.fm mood/genre tags,
 * pull the community's top tracks for those tags (real songs from a catalogue of
 * millions), tag them with Moodify's emotion model, cache them so the catalogue
 * compounds, rank them with the same taste-aware engine, and link each out to
 * Spotify for playback. Falls back to the local universe if Last.fm isn't set up
 * or returns too little.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Top emotion dimension → the Last.fm tag we search for it.
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

// Situation signal → an activity tag that sharpens discovery.
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

// Each tag's emotional profile — the dominant signal for a discovered track
// (Last.fm already validated the track *is* this mood). 0..1 per named dim.
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

// Language → Last.fm tags that surface that language's music. "english" is the
// global/default pool (the mood tags already return mostly English). Combined
// mood+language tags don't exist on Last.fm, so a language is its own pool that
// we present for the moment's vibe.
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

/** Returns a ranked queue sourced live from Last.fm, or null to fall back. */
export async function discover(
  userId: string,
  reading: MomentReading,
  limit = 12,
  languages: string[] = []
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

  // Language filter: English/default searches the mood tags (precise mood,
  // mostly English/global); other languages add their own pools.
  const langs = languages.length ? languages.map((l) => l.toLowerCase()) : ["english"];
  const includeGlobal = langs.includes("english");
  const langTags = Array.from(new Set(langs.flatMap((l) => LANGUAGE_TAGS[l] ?? [])));
  const tagsToSearch = Array.from(
    new Set([...(includeGlobal ? uniqueMoodTags : []), ...langTags])
  ).slice(0, 6);
  const finalTags = tagsToSearch.length ? tagsToSearch : uniqueMoodTags;
  if (!finalTags.length) return null;

  // 1. Pull top tracks for each tag; collect EVERY tag a track matched
  //    (cross-tag agreement is the signal that it really fits this moment).
  const lists = await Promise.all(finalTags.map((t) => topTracksByTag(t, 30)));
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
  if (entries.length < 5) return null; // Last.fm down / too thin → fall back.

  // 2. Upsert tracks (stable slug id, all matched moods as genres), RETURNING ids.
  const tParams: unknown[] = [];
  const tTuples = entries.map((e) => {
    const ext = slug(`${e.t.title}-${e.t.artist}`);
    const b = tParams.length;
    tParams.push(ext, e.t.title, e.t.artist, toTextArray(Array.from(e.tags)));
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

  // 3. Emotion = the UNION of every matched mood (each at full strength) blended
  //    with light artist/title nuance. A track tagged both "nostalgia" and
  //    "melancholy" therefore points straight at a nostalgic-melancholic moment
  //    and out-ranks a song that only carried one of those moods.
  const eParams: unknown[] = [];
  const eTuples: string[] = [];
  const rows: CandidateRow[] = [];
  for (const e of entries) {
    const ext = slug(`${e.t.title}-${e.t.artist}`);
    const id = idByExt.get(ext);
    if (!id) continue;
    // Mood tracks → union of their matched moods. Language-pool tracks (no mood
    // tag) → seeded to the moment's own target so they fit the requested vibe.
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
    const emotion = clampVec(lerp(moodVec, nuance, 0.3));
    const vector = toVec(emotion);
    const b = eParams.length;
    eParams.push(id, vector, JSON.stringify({ moods: Array.from(e.tags) }), "lastfm+lexicon-v1");
    eTuples.push(`($${b + 1}, $${b + 2}::vector, $${b + 3}::jsonb, $${b + 4})`);
    rows.push({
      id,
      title: e.t.title,
      artist: e.t.artist,
      genres: Array.from(e.tags),
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

  // 4. Rank with the shared taste-aware engine. With multiple languages active,
  //    balance the queue round-robin across them so one can't crowd the others
  //    out (precise-mood English would otherwise dominate a vibe-seeded pool).
  const ranked = await rankCandidates(userId, reading, rows, Math.max(limit, rows.length));
  const activeLangs = includeGlobal ? langs : langs.filter((l) => (LANGUAGE_TAGS[l] ?? []).length);
  if (activeLangs.length <= 1) return ranked.slice(0, limit);

  const langTagSet = new Set(langTags);
  const langOf = (t: QueueTrack) => t.genres.find((g) => langTagSet.has(g)) ?? "english";
  const buckets = new Map<string, QueueTrack[]>();
  for (const t of ranked) {
    const k = langOf(t);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(t);
  }
  const order = Array.from(buckets.keys());
  const out: QueueTrack[] = [];
  for (let i = 0; out.length < limit && order.some((k) => buckets.get(k)!.length); i++) {
    const b = buckets.get(order[i % order.length])!;
    if (b.length) out.push(b.shift()!);
  }
  return out;
}
