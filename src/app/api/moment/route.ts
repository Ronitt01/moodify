import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/server/session";
import { ensureStarterUniverse } from "@/server/seed";
import { getEmotionProvider } from "@/server/emotion/provider";
import { recommend } from "@/server/engine";
import { discover } from "@/server/discover";
import { named } from "@/server/emotion/space";
import { isConnected } from "@/server/spotify";
import { query, one, toVec } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().max(400).optional().default(""),
  context: z
    .object({
      hour: z.number().min(0).max(23).optional(),
      weather: z.string().max(24).optional(),
      motion: z.string().max(24).optional(),
    })
    .optional(),
  languages: z.array(z.string().max(20)).max(12).optional(),
});

export async function POST(req: Request) {
  const userId = await getOrCreateUserId();
  await ensureStarterUniverse(userId);

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine — "Just Start Playing" */
  }
  const parsed = Body.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ctx = parsed.data.context ?? { hour: new Date().getHours() };
  const reading = await getEmotionProvider().readMoment(parsed.data.text || "", ctx);

  // Prefer live discovery across all of Spotify; fall back to the user's own
  // universe (seed / imported / library) when Search is unavailable.
  const discovered = await discover(userId, reading, 12, parsed.data.languages ?? []).catch(() => null);
  const queue = discovered && discovered.length > 0 ? discovered : await recommend(userId, reading, 12);
  const usedDiscover = Boolean(discovered && discovered.length > 0);

  // Persist the moment + queue — fuel for the Emotional Taste Graph.
  const moment = await one<{ id: string }>(
    `insert into moments (user_id, text, signals, target, context)
       values ($1, $2, $3::jsonb, $4::vector, $5::jsonb) returning id`,
    [
      userId,
      reading.text,
      JSON.stringify(reading.signals),
      toVec(reading.target),
      JSON.stringify(reading.context),
    ]
  );
  if (moment && queue.length) {
    // One multi-row insert, not one round-trip per item — matters on a remote DB.
    const params: unknown[] = [];
    const tuples = queue.map((q, i) => {
      const b = params.length;
      params.push(moment.id, userId, q.id, i + 1, q.score, JSON.stringify(q.why));
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}::jsonb)`;
    });
    await query(
      `insert into queue_items (moment_id, user_id, track_id, rank, score, why)
         values ${tuples.join(",")}`,
      params
    );
  }

  return NextResponse.json({
    momentId: moment?.id ?? null,
    text: reading.text,
    signals: reading.signals,
    target: named(reading.target),
    confidence: reading.confidence,
    model: reading.model,
    connected: await isConnected(userId),
    discover: usedDiscover,
    queue,
  });
}
