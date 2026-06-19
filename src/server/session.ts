import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { one } from "@/server/db";

/**
 * Lightweight session: a single HMAC-signed cookie holding an app_users id.
 * Anonymous-first — a user is created on first contact with no signup, honoring
 * the "Just Start Playing" rule. Upgraded to a real identity on Spotify connect.
 */

const COOKIE = "moodify_sid";
const secret = () => process.env.SESSION_SECRET || "moodify-dev-secret-change-me";

function sign(id: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(id).digest("base64url");
  return `${id}.${mac}`;
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret()).update(id).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

/** Read the current user id from the cookie (verifying it still exists). */
export async function getUserId(): Promise<string | null> {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const id = verify(raw);
  if (!id) return null;
  const row = await one<{ id: string }>(`select id from app_users where id = $1`, [id]);
  return row ? id : null;
}

/** Read the user id, creating an anonymous user (and setting the cookie) if needed. */
export async function getOrCreateUserId(): Promise<string> {
  const existing = await getUserId();
  if (existing) return existing;

  const row = await one<{ id: string }>(
    `insert into app_users (is_anonymous) values (true) returning id`
  );
  const id = row!.id;
  cookies().set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}
