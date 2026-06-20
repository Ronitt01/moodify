import "server-only";

/**
 * Last.fm source for discovery — free, no Premium, no user login.
 *
 * We use `tag.getTopTracks`: given a mood/genre tag (e.g. "melancholy",
 * "energetic", "chillout"), Last.fm returns the top real tracks the community
 * has tagged that way. That gives us emotionally-relevant candidates from a
 * catalogue of millions, which we then tag + rank with Moodify's own engine and
 * link out to Spotify for playback. Needs only a free LASTFM_API_KEY.
 */

const API = "https://ws.audioscrobbler.com/2.0/";

export function lastfmConfigured(): boolean {
  return Boolean(process.env.LASTFM_API_KEY);
}

export interface LastfmTrack {
  title: string;
  artist: string;
  mbid: string | null;
  tag: string; // the mood tag it was found under (drives emotion tagging)
}

interface TagTopTracks {
  tracks?: {
    track?: Array<{ name?: string; mbid?: string; artist?: { name?: string } }>;
  };
}

/** Top tracks Last.fm's community tagged with `tag`. Returns [] on any failure. */
export async function topTracksByTag(tag: string, limit = 30): Promise<LastfmTrack[]> {
  const key = process.env.LASTFM_API_KEY;
  if (!key) return [];
  const url =
    `${API}?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}` +
    `&api_key=${key}&format=json&limit=${limit}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as TagTopTracks;
    const arr = data.tracks?.track ?? [];
    return arr
      .map((t) => ({
        title: (t.name ?? "").trim(),
        artist: (t.artist?.name ?? "").trim(),
        mbid: t.mbid || null,
        tag,
      }))
      .filter((t) => t.title && t.artist);
  } catch {
    return [];
  }
}

interface ArtistTopTagsResp {
  toptags?: { tag?: Array<{ name?: string }> };
}

/** An artist's defining tags (genres/moods) — used to derive their emotion. */
export async function artistTopTags(artist: string, limit = 6): Promise<string[]> {
  const key = process.env.LASTFM_API_KEY;
  if (!key || !artist.trim()) return [];
  const url =
    `${API}?method=artist.gettoptags&artist=${encodeURIComponent(artist.trim())}` +
    `&api_key=${key}&format=json&autocorrect=1`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as ArtistTopTagsResp;
    return (data.toptags?.tag ?? [])
      .slice(0, limit)
      .map((t) => (t.name ?? "").trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

interface ArtistTopTracks {
  toptracks?: {
    track?: Array<{ name?: string; mbid?: string; artist?: { name?: string } }>;
  };
}

/** A named artist's top tracks (autocorrected for casing/typos). [] on failure. */
export async function topTracksByArtist(artist: string, limit = 12): Promise<LastfmTrack[]> {
  const key = process.env.LASTFM_API_KEY;
  if (!key || !artist.trim()) return [];
  const url =
    `${API}?method=artist.gettoptracks&artist=${encodeURIComponent(artist.trim())}` +
    `&api_key=${key}&format=json&limit=${limit}&autocorrect=1`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as ArtistTopTracks;
    const arr = data.toptracks?.track ?? [];
    return arr
      .map((t) => ({
        title: (t.name ?? "").trim(),
        artist: (t.artist?.name ?? artist).trim(),
        mbid: t.mbid || null,
        tag: "artist",
      }))
      .filter((t) => t.title && t.artist);
  } catch {
    return [];
  }
}
