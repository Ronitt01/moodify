import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/server/session";
import { ensureStarterUniverse } from "@/server/seed";
import { isConnected, isConfigured } from "@/server/spotify";
import { getEmotionProvider } from "@/server/emotion/provider";
import { getTaste } from "@/server/taste";
import { one, dbMode } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getOrCreateUserId();
  const universe = await ensureStarterUniverse(userId);
  const connected = await isConnected(userId);
  const user = await one<{ display_name: string | null; is_anonymous: boolean; plan: string }>(
    `select display_name, is_anonymous, plan from app_users where id = $1`,
    [userId]
  );
  const taste = await getTaste(userId);

  return NextResponse.json({
    user: { id: userId, ...(user ?? {}) },
    connected,
    spotifyConfigured: isConfigured(),
    universe,
    engine: getEmotionProvider().name,
    db: dbMode(),
    taste: { interactions: taste.interactions, lean: taste.lean.map((d) => d.name) },
  });
}
