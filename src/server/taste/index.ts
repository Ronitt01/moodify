import "server-only";
import { query, one, toVec, parseVec } from "@/server/db";
import { clampVec, lerp, EMOTION_DIMS, type DimName } from "@/server/emotion/space";

/**
 * The Emotional Taste Graph — Moodify's compounding moat.
 *
 * Every reaction nudges a per-user 16-dim `profile` vector toward the emotional
 * signature of tracks they love and away from ones they skip. The engine blends
 * this profile into ranking, so the more you use Moodify the more it knows
 * *which feelings are yours* — not just what this one moment asked for.
 *
 * It's interpretable on purpose: the profile lives in the same named 16-dim
 * space as everything else, so we can always say "you lean nostalgia · warmth".
 */

// Reaction kind → learning sign + strength.
const POSITIVE: Record<string, number> = { fit: 1, replay: 1.2, nostalgic: 0.6 };
const NEGATIVE: Record<string, number> = { skip: 1, too_intense: 0.8 };

export const isPositive = (kind: string) => kind in POSITIVE;
export const isNegative = (kind: string) => kind in NEGATIVE;

const NEUTRAL = () => new Array(EMOTION_DIMS.length).fill(0.5);

export interface TasteProfile {
  profile: number[] | null;
  interactions: number;
  /** Dimensions the user leans toward, strongest first (value − neutral). */
  lean: { name: DimName; value: number }[];
}

function leanDims(profile: number[]): { name: DimName; value: number }[] {
  return EMOTION_DIMS.map((name, i) => ({ name, value: profile[i] ?? 0.5 }))
    .sort((a, b) => b.value - 0.5 - (a.value - 0.5))
    .slice(0, 3);
}

/** The user's current learned profile (null until they've reacted to anything). */
export async function getTaste(userId: string): Promise<TasteProfile> {
  const row = await one<{ profile: string | null; interactions: number }>(
    `select profile::text as profile, interactions from taste_graph where user_id = $1`,
    [userId]
  );
  if (!row || !row.profile) {
    return { profile: null, interactions: row ? Number(row.interactions) : 0, lean: [] };
  }
  const profile = parseVec(row.profile);
  return { profile, interactions: Number(row.interactions), lean: leanDims(profile) };
}

/** Latest reaction per track → the sets the engine uses to boost / demote. */
export async function getFeedbackSets(
  userId: string
): Promise<{ loved: Set<string>; skipped: Set<string> }> {
  const rows = await query<{ track_id: string; kind: string }>(
    `select distinct on (track_id) track_id, kind
       from feedback
      where user_id = $1 and track_id is not null
      order by track_id, created_at desc`,
    [userId]
  );
  const loved = new Set<string>();
  const skipped = new Set<string>();
  for (const r of rows) {
    if (isPositive(r.kind)) loved.add(r.track_id);
    else if (isNegative(r.kind)) skipped.add(r.track_id);
  }
  return { loved, skipped };
}

/** Record one reaction and EMA-update the user's taste profile. Returns the new profile. */
export async function recordFeedback(
  userId: string,
  input: { trackId?: string | null; momentId?: string | null; kind: string }
): Promise<TasteProfile> {
  // 1. Persist the raw event (audit trail + future training data).
  await query(
    `insert into feedback (user_id, track_id, moment_id, kind) values ($1, $2, $3, $4)`,
    [userId, input.trackId ?? null, input.momentId ?? null, input.kind]
  );

  // 2. Pull the reacted track's emotion vector — the signal we learn from.
  let e: number[] | null = null;
  if (input.trackId) {
    const er = await one<{ emotion: string | null }>(
      `select emotion::text as emotion from track_emotions where track_id = $1`,
      [input.trackId]
    );
    if (er?.emotion) e = parseVec(er.emotion);
  }

  // 3. EMA-update the profile toward (loved) / away from (skipped) that signature.
  const cur = await one<{ profile: string | null; interactions: number }>(
    `select profile::text as profile, interactions from taste_graph where user_id = $1`,
    [userId]
  );
  let profile = cur?.profile ? parseVec(cur.profile) : NEUTRAL();
  const interactions = (cur ? Number(cur.interactions) : 0) + 1;

  if (e) {
    const lr = 0.18;
    const pos = POSITIVE[input.kind] ?? 0;
    const neg = NEGATIVE[input.kind] ?? 0;
    if (pos) profile = clampVec(lerp(profile, e, lr * pos));
    else if (neg) profile = clampVec(lerp(profile, e, -lr * 0.7 * neg));
  }

  await query(
    `insert into taste_graph (user_id, profile, interactions, updated_at)
       values ($1, $2::vector, $3, now())
     on conflict (user_id) do update
       set profile = excluded.profile, interactions = excluded.interactions, updated_at = now()`,
    [userId, toVec(profile), interactions]
  );

  return { profile, interactions, lean: leanDims(profile) };
}
