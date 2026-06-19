import "server-only";
import { query, one, toVec, toTextArray } from "@/server/db";
import { tagTrack } from "@/server/emotion/track";

/**
 * Keyless library import — bring real music in without Spotify Premium.
 *
 * Accepts either pasted lines ("Title - Artist", one per line) or a CSV
 * (Exportify format and generic headers supported). Each track is tagged by the
 * same emotion engine, added to the user's Master Playlists (source 'import'),
 * and — since this is now *their* library — the starter universe is retired.
 */

export interface ImportItem {
  title: string;
  artist?: string;
  album?: string;
  genres?: string[];
  year?: number | null;
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── parsing ──────────────────────────────────────────────────────────── */

/** Minimal RFC-4180-ish CSV parser (handles quoted fields with commas/newlines). */
function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseCsvItems(text: string): ImportItem[] {
  const rows = splitCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const find = (names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };
  const ti = find(["track name", "name", "title", "song", "track"]);
  const ai = find(["artist name(s)", "artist name", "artist", "artists"]);
  const li = find(["album name", "album"]);
  const gi = find(["artist genres", "genres", "genre"]);
  const yi = find(["release date", "year", "date"]);

  const items: ImportItem[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = (ti >= 0 ? row[ti] : row[0] ?? "").trim();
    if (!title) continue;
    const yr = yi >= 0 ? parseInt((row[yi] ?? "").slice(0, 4), 10) : NaN;
    items.push({
      title,
      artist: ai >= 0 ? (row[ai] ?? "").trim() : "",
      album: li >= 0 ? (row[li] ?? "").trim() : "",
      genres:
        gi >= 0
          ? (row[gi] ?? "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
          : [],
      year: Number.isFinite(yr) ? yr : null,
    });
  }
  return items;
}

function parseLineItems(text: string): ImportItem[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^\s*\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "");
      const parts = cleaned.split(/\s+[-–—]\s+|\s+by\s+/i);
      if (parts.length >= 2) {
        return { title: parts[0].trim(), artist: parts.slice(1).join(" - ").trim() };
      }
      return { title: cleaned.trim() };
    })
    .filter((it) => it.title);
}

function looksLikeCsv(text: string): boolean {
  const first = text.split(/\r?\n/)[0] ?? "";
  return first.includes(",") && /name|track|title|artist/i.test(first);
}

export function parseImport(content: string, kind?: "lines" | "csv"): ImportItem[] {
  const mode = kind ?? (looksLikeCsv(content) ? "csv" : "lines");
  const items = mode === "csv" ? parseCsvItems(content) : parseLineItems(content);
  return items.slice(0, 2000);
}

/* ── ingestion ────────────────────────────────────────────────────────── */

export async function importTracks(
  userId: string,
  items: ImportItem[]
): Promise<{ imported: number; universe: number }> {
  let count = 0;
  for (const it of items) {
    const title = it.title.trim();
    if (!title) continue;
    const artist = (it.artist || "").trim() || "Unknown";
    const genres = it.genres ?? [];
    const externalId = slug(`${title}-${artist}`);

    const row = await one<{ id: string }>(
      `insert into tracks (source, external_id, title, artist, album, genres, year)
         values ('import', $1, $2, $3, $4, $5::text[], $6)
       on conflict (source, external_id) do update set title = excluded.title
       returning id`,
      [externalId, title, artist, it.album || null, toTextArray(genres), it.year ?? null]
    );
    if (!row) continue;

    const { emotion, tags, model } = tagTrack({ title, artist, genres, year: it.year });
    await query(
      `insert into track_emotions (track_id, emotion, tags, model)
         values ($1, $2::vector, $3::jsonb, $4)
       on conflict (track_id) do update set emotion = excluded.emotion, updated_at = now()`,
      [row.id, toVec(emotion), JSON.stringify(tags), model]
    );
    await query(
      `insert into master_playlist_tracks (user_id, track_id, source_playlist, liked)
         values ($1, $2, 'import', true)
       on conflict (user_id, track_id) do nothing`,
      [userId, row.id]
    );
    count++;
  }

  // It's their library now — retire the starter universe.
  if (count > 0) {
    await query(
      `delete from master_playlist_tracks where user_id = $1 and source_playlist = 'starter'`,
      [userId]
    );
  }

  const total = await one<{ n: number }>(
    `select count(*)::int as n from master_playlist_tracks where user_id = $1`,
    [userId]
  );
  return { imported: count, universe: total ? Number(total.n) : 0 };
}
