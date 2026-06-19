import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/server/session";
import { ensureStarterUniverse } from "@/server/seed";
import { parseImport, importTracks } from "@/server/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  content: z.string().min(1).max(500_000),
  kind: z.enum(["lines", "csv"]).optional(),
});

/** Import a user's real library from pasted lines or a CSV (no Spotify needed). */
export async function POST(req: Request) {
  const userId = await getOrCreateUserId();
  await ensureStarterUniverse(userId); // make sure the user row/universe exists

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const items = parseImport(parsed.data.content, parsed.data.kind);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "no_tracks", message: "Couldn't find any songs in that. Try 'Title - Artist' per line, or an Exportify CSV." },
      { status: 400 }
    );
  }

  const result = await importTracks(userId, items);
  return NextResponse.json(result);
}
