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

async function seedCatalog(): Promise<void> {
  for (const [title, artist, genresCsv, year] of SEED_CATALOG) {
    const genres = genresCsv.split(",").map((g) => g.trim()).filter(Boolean);
    const externalId = slug(`${title}-${artist}`);

    const row = await one<{ id: string }>(
      `insert into tracks (source, external_id, title, artist, genres, year)
         values ('seed', $1, $2, $3, $4::text[], $5)
       on conflict (source, external_id) do update set title = excluded.title
       returning id`,
      [externalId, title, artist, toTextArray(genres), year]
    );
    if (!row) continue;

    const { emotion, tags, model } = tagTrack({ title, artist, genres, year });
    await query(
      `insert into track_emotions (track_id, emotion, tags, model)
         values ($1, $2::vector, $3::jsonb, $4)
       on conflict (track_id) do nothing`,
      [row.id, toVec(emotion), JSON.stringify(tags), model]
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
