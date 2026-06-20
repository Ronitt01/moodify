import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/server/session";
import { recordFeedback } from "@/server/taste";
import { named } from "@/server/emotion/space";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  trackId: z.string().uuid().nullable().optional(),
  momentId: z.string().uuid().nullable().optional(),
  kind: z.enum(["fit", "skip", "replay", "too_intense", "nostalgic", "play"]),
});

export async function POST(req: Request) {
  const userId = await getOrCreateUserId();

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body → bad request below */
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const taste = await recordFeedback(userId, parsed.data);

  return NextResponse.json({
    ok: true,
    interactions: taste.interactions,
    lean: taste.lean.map((d) => d.name),
    profile: taste.profile ? named(taste.profile) : null,
  });
}
