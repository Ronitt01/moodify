# Moodify — Handoff

> Living doc. **Status as of 2026-06-20:** Landing page ✅ shipped. Backend **moment → queue MVP** ✅ built **and verified end-to-end**. **Supabase (Postgres + pgvector) is now LIVE** — the app auto-connects via the transaction pooler and persists moments/queues there (verified by direct row counts). Keyless **library import** (paste / Exportify CSV) ✅. Spotify OAuth coded (free accounts are Web-API-blocked by Spotify → use import instead). `/app` studio live.

> ⏭ **PICK UP TOMORROW (2026-06-21) — Vercel production isn't serving suggestions.**
> **Local dev is fully working** (`/api/me` → `db: supabase`; moments return queues). The **Vercel deploy renders but `/api/moment` returns no songs** — almost certainly missing env vars (code is pushed; secrets are gitignored, so they don't deploy).
>
> **Fix — Vercel dashboard → Settings → Environment Variables → Production:**
> - `DATABASE_URL` = the **transaction-pooler** string from `.env.local` (`postgres.<ref>@aws-1-ap-southeast-2.pooler.supabase.com:6543`). This is the one that matters for suggestions.
> - `SESSION_SECRET` = any long random string · `APP_URL` = `https://<app>.vercel.app`.
> - Optional: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `SPOTIFY_*`. **Do NOT set `PGLITE_DATA_DIR`** (it's a local path and breaks the serverless fallback).
> - **Redeploy after saving** (Deployments → ⋯ → Redeploy) — Vercel bakes env vars in at build time, so existing deploys won't see them.
>
> **First diagnostic:** open `https://<app>.vercel.app/api/me`.
> - `db: supabase` → env is set; look elsewhere (e.g. Hobby plan's 10s function timeout vs Sydney latency — `vercel.json` already pins `syd1` to mitigate).
> - `db: pglite` or a 500 → `DATABASE_URL` missing or not redeployed → set it + redeploy.

---

## # Changed

### Frontend (done, builds clean, serves 200)
- Full no-auth landing page — Next.js 14 (App Router) + TS + Tailwind + Framer Motion.
- **Three.js cursor-reactive particle galaxy** hero (`src/components/GalaxyField.tsx`): GPU vertex-shader motion, world-space cursor repulsion, reduced-motion fallback, full WebGL disposal.
- Sections: Hero (live console) · MomentsStrip · Manifesto · HowItWorks · Benefits · interactive Demo · Features · Proof · FAQ · FinalCTA · Footer. Copy in `src/lib/content.ts`.
- Landing "Just Start Playing" CTAs route to the real **`/app`** studio.

### Backend MVP (done + verified)
- **Dual-mode DB, one interface** (`src/server/db/index.ts`): no `DATABASE_URL` → PGlite (embedded Postgres + pgvector, migrate-on-boot); `DATABASE_URL` set → **Supabase / Postgres via postgres.js** with a tolerant URL parser, cold-hit retry, orphan-connection cleanup, and graceful fallback to PGlite. **Currently connected to Supabase.**
  - `src/server/db/schema.ts` + `supabase/migrations/0001_init.sql` (9 tables, `vector(16)`) — applied to Supabase.
  - Seed + queue writes are **batched multi-row inserts** (≈3 round-trips, not ~230) — essential against a remote DB.
- **Moodify-owned emotion engine** (deterministic, no key needed; LLM-swappable):
  - 16-dim interpretable space `emotion/space.ts`; lexicons `emotion/lexicon.ts`.
  - Track tagger `emotion/track.ts`; moment parser `emotion/moment.ts` (negation + idiom handling).
  - Provider interface `emotion/provider.ts` + optional OpenRouter brain `emotion/llm.ts`.
- **Starter universe** — ~115 real tracks (`seed/catalog.ts`) ingested + vectorized (`seed/index.ts`).
- **Keyless library import** (`src/server/import/`, `/api/import`, `components/app/ImportModal.tsx`) — paste "Title - Artist" lines or an Exportify CSV; imported songs replace the starter universe. **No Spotify Premium needed.**
- **Recommendation engine** `engine/index.ts` — pgvector retrieval (`emotion <=> target`) → JS re-rank (centered cosine + context + diversity) → explainable "why".
- **Session** `session.ts` (anonymous-first signed cookie) + **Spotify** `spotify/index.ts` (OAuth, refresh, library ingestion; never writes to the account).
- **API**: `/api/me`, `/api/moment` (the spine), `/api/import`, `/api/ingest`, `/api/spotify/connect` + `/callback`.
- **`/app` studio UI** `components/app/Studio.tsx` — type a moment, see signals + the ranked queue; `+ Import` to bring your own library.

### ✅ Verified
Contrasting moments produce genuinely different, on-target queues from real pgvector math:
| Moment | Read | Top of queue |
| --- | --- | --- |
| "late night drive, nostalgic and a little melancholy" | nostalgia 100 · melancholy 93 | A Case of You · Hurt · Holocene · Space Song |
| "hyped pre-workout, need aggressive energy" | energy/aggression high | Stronger · SICKO MODE · Master of Puppets · Strobe |
| "deep focus, do not disturb, studying" | locked in · focus 100 | Marconi Union · Aphex Twin · Hans Zimmer |

> **Supabase verified (2026-06-20):** app reports `db: supabase`; querying Supabase directly confirms writes land there — `tracks=115`, `track_emotions=115`, `moments`/`queue_items` growing with the exact test texts + timestamps. Engine stays discriminative on the remote DB.

---

## # Failed attempts (and the fix)

| What broke | Why | Fix |
| --- | --- | --- |
| `@electric-sql/pglite@0.5.3` had no pgvector | 0.5.x ships only standard contrib modules | **Pinned `0.2.17`** (exports `/vector`). |
| `npm install` → `EBUSY` | running `next dev` locked the package | TaskStop the dev server, reinstall. |
| `Varibleless` import in `Reveal.tsx` | typo'd a non-existent Framer export | Removed it. |
| 3 invalid emotion keys in lexicon | not in the 16-dim space (`as never` doesn't fix keys) | Replaced with valid dims. |
| Hero 3D tilt clobbered by float anim | Framer owns `transform` | Moved tilt into Framer `style={{ rotateX }}`. |
| LLM provider not assignable to `EmotionProvider` | missing `name` field | Added `name` to the returned provider. |
| **Parser:** "winding down" → **sad** | bare `down`/`low`/`blue` are polysemous | Dropped them; use `feeling down`/`feeling blue`. |
| **Parser:** "do not disturb" **negated** "studying" | the idiom's "not" hit the negation window | Neutralize → `dnd` before parsing; added a `focus` term. |
| **Spotify** connects but library fetch 403s | **free Spotify accounts are blocked from the Web API** (Premium required) | Out of our control → built **keyless import** as the path to a real library. |
| **Supabase "Invalid URL"** | password has special chars `new URL` rejects | Tolerant manual `parsePgUrl` (no percent-encoding needed). |
| **Supabase `ENOTFOUND db.<ref>.supabase.co`** | the direct host is **IPv6-only**; no IPv4 route on this network | Use the **transaction pooler** (IPv4): `aws-1-ap-southeast-2.pooler.supabase.com:6543`. |
| Pooler **"Tenant or user not found"** | project is on the newer **`aws-1`** cluster, not `aws-0` | Probe both prefixes; correct host is `aws-1-…`. User is `postgres.<ref>`. |
| **`57014` statement timeout** on connect | a killed dev server left the old ~45s per-row seed running server-side | **Batch the seed**; `initPg` now cleans up its orphan connection + retries the cold hit. |
| `/api/me` showed `db: pglite` after a code edit | module-level `activeMode` resets on hot reload while the client stays cached on `globalThis` | Moved the mode flag to `globalThis` (`__moodifyDBMode`). |

---

## # The stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14.2 (App Router) + TypeScript |
| UI / Motion / 3D | Tailwind 3.4 · Framer Motion 11 · Three.js 0.169 |
| DB (local) | PGlite 0.2.17 (embedded Postgres) + pgvector — zero-config fallback |
| DB (prod) | **Supabase / Postgres + `vector` — LIVE** via postgres.js (transaction pooler) |
| Validation | zod 4 |
| AI (optional) | OpenRouter (engine upgrade); local lexicon model is the default |
| Auth / Streaming | Spotify OAuth (Authorization Code) + Web API |

---

## # How to run + verify

```bash
npm install
npm run dev            # http://localhost:3000  →  /  and  /app
```

```bash
# the spine, no setup required:
curl -X POST http://127.0.0.1:3000/api/moment \
  -H "content-type: application/json" \
  -d '{"text":"heartbroken but hopeful, late night drive"}'
```

- `/api/me` reports `db` (`supabase` | `pglite`), `universe` size, and `engine`.
- `npm run build` type-checks the whole tree.

### Connecting a different Supabase project
1. `DATABASE_URL` in `.env.local` = the **Transaction pooler** string (Dashboard → Connect → Transaction pooler). The **direct** `db.<ref>.supabase.co` host is IPv6-only and will fail on most networks.
2. Apply `supabase/migrations/0001_init.sql` in the SQL editor.
3. Restart `npm run dev` (the DB client is cached at startup). `/api/me` should show `db: supabase`.

---

## # Next steps

**Optional upgrades:**
1. **OpenRouter**: set `OPENROUTER_API_KEY` to upgrade moment-reading from lexicon → LLM (auto-detected, falls back safely).
2. **Spotify** (free dev app): redirect URI `http://127.0.0.1:3000/api/spotify/callback`; open the app at **127.0.0.1**. NB: free accounts can authenticate but the Web API blocks library reads — **import** is the working path to a real library today.
3. ~~**Supabase**~~ ✅ **DONE** — connected via the transaction pooler (`aws-1-ap-southeast-2`), migration applied, app persists there. For Vercel, set `DATABASE_URL` to the same pooler string from `.env.local`.

**Future phases (per brief):**
- Dynamic feedback loop → write to `taste_graph` (the compounding moat). `feedback` table already exists.
- Passive context (time/weather/motion) — wire real signals into `/api/moment` context.
- Freemium gating (RevenueCat) · PostHog + Sentry · Resend for the waitlist.
- LLM batch track-tagging job; add an HNSW index on `track_emotions.emotion` for scale.
- **Latency:** the Supabase project is in Sydney (`ap-southeast-2`). `vercel.json` pins functions to `syd1` so prod queries are in-datacenter. For snappier *local* dev, recreate the project in a nearer region (e.g. `ap-south-1`).

---

## # Keeping it clean for GitHub + Vercel

### Repo
`moodify/` is the git root → GitHub `Ronitt01/moodify`.
`.gitignore` excludes `node_modules/`, `.next/`, `.env*`, `.pglite/`. **Do** commit `.env.example`, `supabase/migrations/`, `vercel.json`, `HANDOFF.md`. **Never** commit `.env.local`. Throwaway `_*.mjs` probes are deleted (don't commit them).

### Hygiene
- Branch per change → PR → Vercel preview → merge `main`.
- Secrets only in env (Vercel/Local), never in code. Provider/DB abstractions keep vendors swappable.
- `npm run build` before pushing.

### Deploy to Vercel
1. Push to GitHub.
2. vercel.com → New Project → import repo → Next.js auto-detected. (If `day 5/` is the root, set **Root Directory = moodify**.)
3. **Env vars**: `DATABASE_URL` (the **pooler** string from `.env.local`), `SESSION_SECRET`, `APP_URL=https://<app>.vercel.app`, `SPOTIFY_CLIENT_ID/SECRET`, `SPOTIFY_REDIRECT_URI=https://<app>.vercel.app/api/spotify/callback`, optional `OPENROUTER_API_KEY`.
4. **Production DB:** ✅ Supabase wired — set `DATABASE_URL` and the app uses it automatically (PGlite is the no-config local fallback). `vercel.json` already pins `regions: ["syd1"]` to co-locate with the Sydney DB.
5. Add the production Spotify redirect URI (`https://…`) in the Spotify dashboard, then redeploy.

> TL;DR: code in `moodify/`, secrets in env, local = PGlite fallback, prod = Supabase (live) — same schema either way.
