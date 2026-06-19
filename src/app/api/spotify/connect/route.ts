import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getOrCreateUserId } from "@/server/session";
import { isConfigured, authorizeUrl } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Begin the Spotify OAuth flow (or explain how to configure it). */
export async function GET() {
  await getOrCreateUserId(); // ensure a session cookie exists before we leave

  if (!isConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Spotify isn't configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local, then restart. See HANDOFF.md for the 3-minute setup.",
      },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  cookies().set("moodify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.redirect(authorizeUrl(state));
}
