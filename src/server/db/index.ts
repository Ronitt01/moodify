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

async function initPg(url: string): Promise<DBClient> {
  const postgres = (await import("postgres")).default;
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, {
    max: 1, // serverless-friendly
    prepare: false, // required for Supabase's transaction pooler (pgbouncer)
    ssl: isLocal ? undefined : "require",
    idle_timeout: 20,
    connect_timeout: 12,
  });
  // Verify the connection now so a bad URL / password / host surfaces here,
  // letting getDB() fall back to local PGlite instead of breaking every request.
  await sql.unsafe("select 1");
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

let activeMode: "pglite" | "supabase" = "pglite";

/** Which backend is actually serving (accurate once getDB has resolved once). */
export function dbMode(): "pglite" | "supabase" {
  return activeMode;
}

async function init(): Promise<DBClient> {
  const url = databaseUrl();
  if (url) {
    try {
      const client = await initPg(url);
      activeMode = "supabase";
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
  activeMode = "pglite";
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
