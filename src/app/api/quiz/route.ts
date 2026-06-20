import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/server/session";
import { tagsEmotion } from "@/server/emotion/tags";
import { artistTopTags } from "@/server/lastfm";
import { seedFromQuiz } from "@/server/taste";
import { named } from "@/server/emotion/space";
import { query } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  artists: z.array(z.string().max(80)).max(8).optional().default([]),
  vibes: z.array(z.string().max(40)).max(20).optional().default([]),
});

export async function POST(req: Request) {
  const userId = await getOrCreateUserId();

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty is fine — treated as a skip */
  }
  const parsed = Body.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const artistNames = Array.from(new Set(parsed.data.artists.map((a) => a.trim()).filter(Boolean)));
  const vibes = Array.from(new Set(parsed.data.vibes.map((v) => v.trim().toLowerCase()).filter(Boolean)));

  // Resolve each favourite artist to an emotion via their defining Last.fm tags;
  // keep the vector so a future moment can feature the artist that fits its mood.
  const artists = await Promise.all(
    artistNames.map(async (name) => {
      const tags = await artistTopTags(name, 6);
      return { name, emotion: tagsEmotion(tags) };
    })
  );

  // Vibes are genre/mood tags → emotion via the shared tag map.
  const vibeVecs = vibes.map((v) => tagsEmotion([v]));

  const taste = await seedFromQuiz(userId, [...artists.map((a) => a.emotion), ...vibeVecs]);

  await query(`insert into feedback (user_id, kind, value) values ($1, 'quiz', $2::jsonb)`, [
    userId,
    JSON.stringify({ artists, vibes }),
  ]);

  return NextResponse.json({
    ok: true,
    interactions: taste.interactions,
    lean: taste.lean.map((d) => d.name),
    artists: artistNames,
    vibes,
    profile: taste.profile ? named(taste.profile) : null,
  });
}
