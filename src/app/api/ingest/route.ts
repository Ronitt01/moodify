import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/server/session";
import { ingestLibrary, isConnected } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Re-pull the user's Spotify library into their Master Playlists. */
export async function POST() {
  const userId = await getOrCreateUserId();
  if (!(await isConnected(userId))) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }
  try {
    const ingested = await ingestLibrary(userId);
    return NextResponse.json({ ingested });
  } catch (e) {
    return NextResponse.json(
      { error: "ingest_failed", message: (e as Error).message },
      { status: 500 }
    );
  }
}
