import "server-only";
import { SCHEMA_SQL } from "./schema";

/**
 * Database access layer — dual mode, same interface either way:
 *
 *   • No DATABASE_URL  → PGlite (embedded Postgres + pgvector). Zero setup,
 *     used for local dev. Migrates itself on boot.
 *   • DATABASE_URL set → Supabase / any Postgres ≥ 15 with the `vector`
 *     extension, via postgres.js. No PGlite is loaded in this path (so there is
 *     no WASM / read-only-filesystem problem on serverless). Apply the schema
 *     once with supabase/migrations/0001_init.sql (Supabase SQL editor); the
 *     app only does DML.
 *
 * The client (and any migration) is cached on globalThis so Next.js hot reloads
 * and serverless warm invocations reuse one connection.
 */

const DATA_DIR =
  process.env.PGLITE_DATA_DIR || (process.env.VERCEL ? "/tmp/moodify-pglite" : "./.pglite");

function databaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    null
  );
}

export interface DBClient {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __moodifyDB: Promise<DBClient> | undefined;
  // eslint-disable-next-line no-var
  var __moodifyDBMode: "pglite" | "supabase" | undefined;
}

async function initPglite(): Promise<DBClient> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { vector } = await import("@electric-sql/pglite/vector");
  const db = new PGlite(DATA_DIR, { extensions: { vector } });
  await db.waitReady;
  await db.exec(SCHEMA_SQL); // local migrate-on-boot
  return {
    query: async <T>(sql: string, params: unknown[] = []) =>
      (await db.query<T>(sql, params)).rows,
    exec: async (sql: string) => {
      await db.exec(sql);
    },
  };
}

/**
 * Tolerant connection-string parser. Splits manually (not via `new URL`) so a
 * password containing special characters like / # ? % & still works WITHOUT the
 * user having to percent-encode it. Assumes a single '@' (i.e. no '@' in the
 * password, which postgres.js / new URL also can't handle unencoded).
 */
function parsePgUrl(raw: string) {
  const afterScheme = raw.includes("://") ? raw.slice(raw.indexOf("://") + 3) : raw;
  const at = afterScheme.lastIndexOf("@");
  const auth = at >= 0 ? afterScheme.slice(0, at) : "";
  const rest = at >= 0 ? afterScheme.slice(at + 1) : afterScheme;
  const ci = auth.indexOf(":");
  const user = (ci >= 0 ? auth.slice(0, ci) : auth) || "postgres";
  const password = ci >= 0 ? auth.slice(ci + 1) : "";
  const slash = rest.indexOf("/");
  const hostport = slash >= 0 ? rest.slice(0, slash) : rest;
  const database =
    (slash >= 0 ? rest.slice(slash + 1) : "postgres").split(/[?#]/)[0] || "postgres";
  const colon = hostport.lastIndexOf(":");
  const host = colon >= 0 ? hostport.slice(0, colon) : hostport;
  const port = colon >= 0 ? parseInt(hostport.slice(colon + 1), 10) || 5432 : 5432;
  return { host, port, user, password, database };
}

async function initPg(url: string): Promise<DBClient> {
  const postgres = (await import("postgres")).default;
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const { host, port, user, password, database } = parsePgUrl(url);
  const sql = postgres({
    host,
    port,
    user,
    password,
    database,
    max: 1, // serverless-friendly
    prepare: false, // required for Supabase's transaction pooler (pgbouncer)
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    idle_timeout: 20,
    connect_timeout: 12,
  });
  try {
    // Verify the connection now so a bad URL / password / host surfaces here,
    // letting getDB() fall back to local PGlite instead of breaking every
    // request. A remote pooler can hiccup on the first cold hit, so retry.
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sql.unsafe("select 1");
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
    if (lastErr) throw lastErr;
  } catch (e) {
    // Close the orphaned connection so postgres.js doesn't keep reconnecting and
    // throwing unhandled rejections in the background after we fall back.
    try {
      await sql.end({ timeout: 0 });
    } catch {
      /* ignore */
    }
    throw e;
  }
  // Schema is applied out-of-band (Supabase SQL editor) — we never run DDL
  // through the pooler. Seed data loads on first request via the seed loader.
  return {
    query: async <T>(text: string, params: unknown[] = []) =>
      (await sql.unsafe(text, params as never[])) as unknown as T[],
    exec: async (text: string) => {
      await sql.unsafe(text);
    },
  };
}

/**
 * Which backend is actually serving. Stored on globalThis (not module scope) so
 * it stays correct across Next.js hot reloads — those re-evaluate this module
 * (resetting module-level state) but keep the cached client on globalThis.
 */
export function dbMode(): "pglite" | "supabase" {
  return globalThis.__moodifyDBMode ?? "pglite";
}

async function init(): Promise<DBClient> {
  const url = databaseUrl();
  if (url) {
    try {
      const client = await initPg(url);
      globalThis.__moodifyDBMode = "supabase";
      return client;
    } catch (e) {
      // A malformed URL, wrong password, or unreachable host shouldn't break the
      // app — log clearly and fall back to the local embedded database.
      console.warn(
        "[db] DATABASE_URL set but Postgres connection failed — using local PGlite.\n     Reason:",
        (e as Error).message
      );
    }
  }
  globalThis.__moodifyDBMode = "pglite";
  return initPglite();
}

export function getDB(): Promise<DBClient> {
  if (!globalThis.__moodifyDB) globalThis.__moodifyDB = init();
  return globalThis.__moodifyDB;
}

/** Run a query and return rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return (await getDB()).query<T>(sql, params);
}

/** Run a query and return the first row (or null). */
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

/** Run statements with no result. */
export async function exec(sql: string): Promise<void> {
  await (await getDB()).exec(sql);
}

/* ── pgvector / array helpers ─────────────────────────────────── */

/** Format a JS number[] as a pgvector literal: `[0.1,0.2,...]`. Bind with `$n::vector`. */
export function toVec(arr: number[]): string {
  return "[" + arr.map((n) => (Number.isFinite(n) ? +n.toFixed(6) : 0)).join(",") + "]";
}

/** Parse a pgvector value (returned as text) back into number[]. */
export function parseVec(v: unknown): number[] {
  if (Array.isArray(v)) return v as number[];
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as number[];
    } catch {
      return v.replace(/[[\]]/g, "").split(",").map(Number);
    }
  }
  return [];
}

/** Format a JS string[] as a Postgres text[] literal. Bind with `$n::text[]`. */
export function toTextArray(items: string[]): string {
  return (
    "{" +
    items
      .map((s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"')
      .join(",") +
    "}"
  );
}

/** Parse a Postgres text[] (array or `{a,b}` literal) back into string[]. */
export function parseTextArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") {
    return v
      .replace(/^\{|\}$/g, "")
      .split(",")
      .map((s) => s.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}
