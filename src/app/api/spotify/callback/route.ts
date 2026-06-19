import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrCreateUserId } from "@/server/session";
import { exchangeCode, getProfile, saveAccount, ingestLibrary } from "@/server/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OAuth redirect target — exchange the code, link the account, ingest library. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const appUrl = process.env.APP_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code) return NextResponse.redirect(`${appUrl}/app?connect=denied`);

  const savedState = cookies().get("moodify_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/app?connect=badstate`);
  }
  cookies().delete("moodify_oauth_state");

  try {
    const userId = await getOrCreateUserId();
    const token = await exchangeCode(code);
    const profile = await getProfile(token.access_token);
    await saveAccount(userId, token, profile);
    await ingestLibrary(userId).catch(() => 0);
    return NextResponse.redirect(`${appUrl}/app?connect=success`);
  } catch {
    return NextResponse.redirect(`${appUrl}/app?connect=error`);
  }
}
