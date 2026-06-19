import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { SCHEMA_SQL } from "./schema";

/**
 * Database access layer.
 *
 * Locally this is a REAL embedded Postgres (PGlite) with the REAL pgvector
 * extension — no Docker, no cloud. The exact same SQL runs on Supabase; to
 * port, point these helpers at `@supabase/supabase-js` / `postgres` instead.
 *
 * The instance (and its migration) is cached on globalThis so Next.js hot
 * reloads don't spin up a new database every change.
 */

const DATA_DIR = process.env.PGLITE_DATA_DIR || "./.pglite";

declare global {
  // eslint-disable-next-line no-var
  var __moodifyDB: Promise<PGlite> | undefined;
}

async function init(): Promise<PGlite> {
  const db = new PGlite(DATA_DIR, { extensions: { vector } });
  await db.waitReady;
  await db.exec(SCHEMA_SQL);
  return db;
}

export function getDB(): Promise<PGlite> {
  if (!globalThis.__moodifyDB) globalThis.__moodifyDB = init();
  return globalThis.__moodifyDB;
}

/** Run a query and return rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDB();
  const res = await db.query<T>(sql, params);
  return res.rows;
}

/** Run a query and return the first row (or null). */
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run statements with no result. */
export async function exec(sql: string): Promise<void> {
  const db = await getDB();
  await db.exec(sql);
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
