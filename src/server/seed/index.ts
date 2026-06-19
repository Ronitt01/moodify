import "server-only";
import { query, one, toVec, toTextArray } from "@/server/db";
import { SEED_CATALOG } from "./catalog";
import { tagTrack } from "@/server/emotion/track";

/**
 * Seed loader. Idempotently ingests the starter catalog into `tracks` +
 * `track_emotions`, and gives a brand-new user a real "universe" so the engine
 * has genuine songs to reason over immediately (no signup, no Spotify required).
 */

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

declare global {
  // eslint-disable-next-line no-var
  var __moodifyCatalog: Promise<void> | undefined;
}

/**
 * Seed in 3 round-trips, not ~230. A per-row loop is fine on in-process PGlite
 * but pathological against a remote Postgres (every insert is a network hop —
 * 115 tracks × 2 ≈ 45s on a cross-region link). So we bulk-insert tracks, read
 * their ids back in one query, then bulk-insert emotions. Still fully idempotent.
 */
async function seedCatalog(): Promise<void> {
  const rows = SEED_CATALOG.map(([title, artist, genresCsv, year]) => ({
    externalId: slug(`${title}-${artist}`),
    title,
    artist,
    genres: genresCsv.split(",").map((g) => g.trim()).filter(Boolean),
    year,
  }));

  // 1) Bulk upsert tracks (one statement, one round-trip).
  const tParams: unknown[] = [];
  const tTuples = rows.map((r) => {
    const b = tParams.length;
    tParams.push(r.externalId, r.title, r.artist, toTextArray(r.genres), r.year);
    return `('seed', $${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}::text[], $${b + 5})`;
  });
  await query(
    `insert into tracks (source, external_id, title, artist, genres, year)
       values ${tTuples.join(",")}
     on conflict (source, external_id) do update set title = excluded.title`,
    tParams
  );

  // 2) Read back the ids in one query and map by external_id.
  const idRows = await query<{ id: string; external_id: string }>(
    `select id, external_id from tracks where source = 'seed'`
  );
  const idByExt = new Map(idRows.map((r) => [r.external_id, r.id]));

  // 3) Bulk upsert emotions (one statement, one round-trip).
  const eParams: unknown[] = [];
  const eTuples: string[] = [];
  for (const r of rows) {
    const id = idByExt.get(r.externalId);
    if (!id) continue;
    const { emotion, tags, model } = tagTrack({
      title: r.title,
      artist: r.artist,
      genres: r.genres,
      year: r.year,
    });
    const b = eParams.length;
    eParams.push(id, toVec(emotion), JSON.stringify(tags), model);
    eTuples.push(`($${b + 1}, $${b + 2}::vector, $${b + 3}::jsonb, $${b + 4})`);
  }
  if (eTuples.length) {
    await query(
      `insert into track_emotions (track_id, emotion, tags, model)
         values ${eTuples.join(",")}
       on conflict (track_id) do nothing`,
      eParams
    );
  }
}

/** Ensure the global catalog exists (runs once per process). */
export function ensureCatalog(): Promise<void> {
  if (!globalThis.__moodifyCatalog) globalThis.__moodifyCatalog = seedCatalog();
  return globalThis.__moodifyCatalog;
}

/** Give a user the starter universe if their Master Playlists are empty. Returns the size. */
export async function ensureStarterUniverse(userId: string): Promise<number> {
  await ensureCatalog();

  const existing = await one<{ n: number }>(
    `select count(*)::int as n from master_playlist_tracks where user_id = $1`,
    [userId]
  );
  if (existing && Number(existing.n) > 0) return Number(existing.n);

  await query(
    `insert into master_playlist_tracks (user_id, track_id, source_playlist, liked)
       select $1, id, 'starter', true from tracks where source = 'seed'
     on conflict (user_id, track_id) do nothing`,
    [userId]
  );

  const after = await one<{ n: number }>(
    `select count(*)::int as n from master_playlist_tracks where user_id = $1`,
    [userId]
  );
  return after ? Number(after.n) : 0;
}
