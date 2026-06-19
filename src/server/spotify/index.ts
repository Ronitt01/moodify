import "server-only";
import { query, one, toVec, toTextArray } from "@/server/db";
import { tagTrack } from "@/server/emotion/track";

/**
 * Spotify integration — real Authorization-Code OAuth + Web API client.
 *
 * Works the moment SPOTIFY_CLIENT_ID/SECRET exist (free dev app, see HANDOFF).
 * Reads only: Liked Songs + playlists. Never writes to the user's account.
 *
 * NOTE on Spotify's 2024 deprecations: we deliberately do NOT call
 * /audio-features or /recommendations (gone for new apps). Emotional meaning
 * comes from Moodify's own model over track + artist-genre metadata.
 */

const ACCOUNTS = "https://accounts.spotify.com";
const API = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
].join(" ");

export function isConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

function redirectUri(): string {
  return (
    process.env.SPOTIFY_REDIRECT_URI ||
    `${process.env.APP_URL || "http://127.0.0.1:3000"}/api/spotify/callback`
  );
}

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID as string,
    scope: SCOPES,
    redirect_uri: redirectUri(),
    state,
    show_dialog: "false",
  });
  return `${ACCOUNTS}/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });
}

interface SpotifyProfile {
  id: string;
  display_name?: string;
  email?: string;
  product?: string;
}

async function apiGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status} on ${path}`);
  return res.json();
}

export async function getProfile(token: string): Promise<SpotifyProfile> {
  return apiGet<SpotifyProfile>(token, "/me");
}

/** Upsert tokens + profile, link the Spotify identity to our app user. */
export async function saveAccount(
  userId: string,
  token: TokenResponse,
  profile: SpotifyProfile
): Promise<void> {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  await query(
    `insert into spotify_accounts
       (user_id, spotify_user_id, access_token, refresh_token, scope, token_type, expires_at, product, display_name, email)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (user_id) do update set
       spotify_user_id = excluded.spotify_user_id,
       access_token    = excluded.access_token,
       refresh_token   = coalesce(excluded.refresh_token, spotify_accounts.refresh_token),
       scope           = excluded.scope,
       token_type      = excluded.token_type,
       expires_at      = excluded.expires_at,
       product         = excluded.product,
       updated_at      = now()`,
    [
      userId,
      profile.id,
      token.access_token,
      token.refresh_token ?? null,
      token.scope,
      token.token_type,
      expiresAt,
      profile.product ?? null,
      profile.display_name ?? null,
      profile.email ?? null,
    ]
  );
  await query(
    `update app_users set is_anonymous = false, display_name = $2, email = $3, updated_at = now() where id = $1`,
    [userId, profile.display_name ?? null, profile.email ?? null]
  );
}

export async function isConnected(userId: string): Promise<boolean> {
  const row = await one<{ user_id: string }>(
    `select user_id from spotify_accounts where user_id = $1`,
    [userId]
  );
  return Boolean(row);
}

/** Return a valid access token, refreshing if it is close to expiry. */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const acct = await one<{
    access_token: string;
    refresh_token: string | null;
    expires_at: string | null;
  }>(`select access_token, refresh_token, expires_at from spotify_accounts where user_id = $1`, [
    userId,
  ]);
  if (!acct) return null;

  const expMs = acct.expires_at ? new Date(acct.expires_at).getTime() : 0;
  if (expMs - Date.now() > 30_000) return acct.access_token;

  if (!acct.refresh_token) return acct.access_token;
  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: acct.refresh_token,
  });
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await query(
    `update spotify_accounts set access_token = $2, expires_at = $3, updated_at = now() where user_id = $1`,
    [userId, refreshed.access_token, expiresAt]
  );
  return refreshed.access_token;
}

/* ── Library ingestion ──────────────────────────────────────────────────── */

interface SavedTracksPage {
  items: { track: SpotifyTrack | null }[];
  next: string | null;
}
interface SpotifyTrack {
  id: string;
  name: string;
  popularity?: number;
  artists: { id: string; name: string }[];
  album: { name: string; release_date?: string; images?: { url: string }[] };
}
interface ArtistsResponse {
  artists: { id: string; genres: string[] }[];
}

const yearOf = (d?: string) => (d ? parseInt(d.slice(0, 4), 10) || null : null);

async function fetchArtistGenres(token: string, ids: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await apiGet<ArtistsResponse>(token, `/artists?ids=${batch.join(",")}`);
    for (const a of data.artists) map.set(a.id, a.genres ?? []);
  }
  return map;
}

/**
 * Ingest the user's Liked Songs (paginated) into the catalog + their Master
 * Playlists, enriching each track with its artists' genres so the emotion model
 * has real signal. Returns the number of tracks ingested.
 */
export async function ingestLibrary(userId: string, maxTracks = 150): Promise<number> {
  const token = await getValidAccessToken(userId);
  if (!token) return 0;

  const tracks: SpotifyTrack[] = [];
  let url: string | null = `/me/tracks?limit=50`;
  while (url && tracks.length < maxTracks) {
    const page: SavedTracksPage = await apiGet<SavedTracksPage>(token, url);
    for (const it of page.items) if (it.track) tracks.push(it.track);
    url = page.next ? page.next.replace(API, "") : null;
  }
  if (tracks.length === 0) return 0;

  const artistIds = Array.from(
    new Set(tracks.flatMap((t) => t.artists.map((a) => a.id)).filter(Boolean))
  );
  const genreMap = await fetchArtistGenres(token, artistIds).catch(() => new Map<string, string[]>());

  let count = 0;
  for (const t of tracks) {
    const genres = Array.from(
      new Set(t.artists.flatMap((a) => genreMap.get(a.id) ?? []))
    ).slice(0, 6);
    const artist = t.artists.map((a) => a.name).join(", ");
    const year = yearOf(t.album.release_date);

    const row = await one<{ id: string }>(
      `insert into tracks (source, external_id, title, artist, album, genres, year, image_url, popularity)
         values ('spotify', $1, $2, $3, $4, $5::text[], $6, $7, $8)
       on conflict (source, external_id) do update set title = excluded.title
       returning id`,
      [
        t.id,
        t.name,
        artist,
        t.album.name ?? null,
        toTextArray(genres),
        year,
        t.album.images?.[0]?.url ?? null,
        t.popularity ?? null,
      ]
    );
    if (!row) continue;

    const { emotion, tags, model } = tagTrack({ title: t.name, artist, genres, year });
    await query(
      `insert into track_emotions (track_id, emotion, tags, model)
         values ($1, $2::vector, $3::jsonb, $4)
       on conflict (track_id) do update set emotion = excluded.emotion, updated_at = now()`,
      [row.id, toVec(emotion), JSON.stringify(tags), model]
    );
    await query(
      `insert into master_playlist_tracks (user_id, track_id, source_playlist, liked)
         values ($1, $2, 'liked', true)
       on conflict (user_id, track_id) do nothing`,
      [userId, row.id]
    );
    count++;
  }
  return count;
}
