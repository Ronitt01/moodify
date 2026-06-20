# Moodify — Handoff

> Living doc. **Status as of 2026-06-20:** Landing page + `/app` studio ✅. **moment → emotion → queue** engine ✅, persisted to **Supabase** (live, transaction pooler). On top of that, shipped today: **all-of-music discovery via Last.fm** (no Spotify Premium), a **multi-language filter** (English/Hindi/Punjabi/Tamil/…), a **featured-artist** option, the **Emotional Taste Graph** (learns from ♥/✕), and a **first-visit personalization quiz**. Tracks **link out to Spotify** to play. Keyless **library import** still available.

> ⚙️ **Production env (Vercel → Settings → Environment Variables → Production):**
> - `DATABASE_URL` (transaction pooler) — ✅ set & verified live (`/api/me` → `db: supabase`).
> - **`LASTFM_API_KEY`** — **still add this** (same value as `.env.local`). Without it, production silently falls back to the 115-track starter universe — discovery / languages / featured-artist / quiz all need it.
> - `SESSION_SECRET`, `APP_URL=https://<app>.vercel.app`. Optional: `OPENROUTER_API_KEY/MODEL`, `SPOTIFY_*`.
> - **Do NOT set `PGLITE_DATA_DIR`** (local path; code forces `/tmp` on Vercel anyway). **Redeploy** after any change.
> - Diagnostic: `https://<app>.vercel.app/api/me` → `db: supabase` is healthy; `pglite`/500 → `DATABASE_URL` missing or not redeployed.

---

## # Changed

### Frontend (done, builds clean, serves 200)
- Full no-auth landing page — Next.js 14 (App Router) + TS + Tailwind + Framer Motion.
- **Three.js cursor-reactive particle galaxy** hero (`src/components/GalaxyField.tsx`).
- Sections: Hero · MomentsStrip · Manifesto · HowItWorks · Benefits · Demo · Features · Proof · FAQ · FinalCTA · Footer. Copy in `src/lib/content.ts`.
- **`/app` studio** `components/app/Studio.tsx` — moment box, **language chips**, **feature-an-artist** field, ranked queue with **♥/✕** + a live "your taste graph" readout, `+ Import`.

### Discovery + personalization (shipped today)
- **All-of-music discovery** `src/server/discover/` — a moment's top emotions → **Last.fm mood tags** (`src/server/lastfm/`), pull the community's top tracks, tag with the emotion model, cache (catalogue compounds), rank with the shared engine, link out to Spotify. **No Spotify Premium / Web API** (that's Premium-gated for this app). Falls back to the local universe if `LASTFM_API_KEY` is absent.
- **Multi-language filter** — each non-English language maps to Last.fm tags (bollywood, punjabi, k-pop…); single language = all that language, multiple = **round-robin balanced** mix. Persisted in `localStorage`.
- **Featured artist** — name one and the queue leads with 1–2 of theirs (`artist.getTopTracks`, autocorrected) + others.
- **Emotional Taste Graph** `src/server/taste/` — both **explicit** ♥/✕ and **implicit play** signals (`/api/feedback`) EMA-update a 16-dim profile; engine blends it into ranking (weight ramps with #interactions), boosts loved, gently boosts played, demotes skipped. **Learns from behaviour, not just taps** — actually clicking a track to play it (`kind:"play"`, half the weight of a ♥) nudges the profile and shows live in the "your taste graph" readout; played rows get a ✓ and a truthful "you played this" why on the next moment.
- **First-visit quiz** `/api/quiz` + `components/app/QuizModal.tsx` — favourite artists (per mood) + vibe chips → resolves each artist's emotion via Last.fm tags (`src/server/emotion/tags.ts`), **seeds the taste graph**, stores artists w/ vectors. Moments then **auto-feature the user's artist that fits the mood** (verified: romantic→Arijit, hyped→Eminem) and bias the pool toward their vibes. Shown when taste is empty + not `moodify_onboarded`.

### Backend core (done + verified)
- **Dual-mode DB** `src/server/db/index.ts` — no `DATABASE_URL` → PGlite (embedded PG + pgvector); set → **Supabase via postgres.js** (tolerant URL parser, cold-hit retry, orphan cleanup, graceful fallback; `/tmp` on Vercel). 9 tables, `vector(16)`; schema in `db/schema.ts` + `supabase/migrations/0001_init.sql`.
- **Emotion engine** — 16-dim interpretable space (`emotion/space.ts`), lexicon (`emotion/lexicon.ts`), shared tag map (`emotion/tags.ts`), track tagger, moment parser (negation/idiom). LLM-swappable (OpenRouter optional).
- **Engine** `engine/index.ts` — pgvector retrieval → shared **`rankCandidates`** (centered-cosine affinity + taste + context + artist diversity + explainable "why"). Used by both the local universe and discovery. All Last.fm writes go through **batched** multi-row inserts (`persistTracks`, deduped by slug id).
- **Starter universe** ~115 real tracks (`seed/`), **keyless import** (`import/`, `/api/import`), **Spotify OAuth** (`spotify/`, never writes).
- **API**: `/api/me`, `/api/moment` (discover-first, falls back to universe), `/api/feedback`, `/api/quiz`, `/api/import`, `/api/ingest`, `/api/spotify/*`.

---

## # Failed attempts (and the fix)

| What broke | Why | Fix |
| --- | --- | --- |
| `@electric-sql/pglite@0.5.3` no pgvector | 0.5.x ships only standard contrib | Pinned `0.2.17`. |
| **Spotify** library 403 / "Premium required for Web API" | free accounts (and this app) are blocked from the Web API | Don't use Spotify's API at all → **Last.fm** sources tracks; link out to Spotify to play. |
| Spotify client-credentials `invalid_client` | the Client Secret is wrong/regenerated | N/A — pivoted off Spotify API entirely. |
| Supabase "Invalid URL" | special-char password `new URL` rejects | Tolerant manual `parsePgUrl`. |
| Supabase `ENOTFOUND db.<ref>.supabase.co` | direct host is **IPv6-only** | Use **transaction pooler** (`aws-1-ap-southeast-2.pooler.supabase.com:6543`, IPv4). |
| Pooler "Tenant or user not found" | project on newer **`aws-1`** cluster | host `aws-1-…`, user `postgres.<ref>`. |
| `57014` statement timeout | a killed dev server left a long per-row seed running | Batch the seed; `initPg` retries + cleans up. |
| Vercel 500 on every route | a copied `PGLITE_DATA_DIR` pointed PGlite at a read-only path | Force `/tmp` on Vercel; remove the var. |
| Featured-artist silently fell back | `persistTracks` hit "ON CONFLICT cannot affect row a second time" (two titles → same slug) | Dedupe by slug id before the INSERT. |
| Quiz featured the same artist for every mood | artist emotions too flat (genres not in lexicon) | Richer shared `tags.ts` mood/genre/cultural tag→emotion map. |
| `db: pglite` after a hot edit | module-level flag reset on reload | Moved mode flag to `globalThis`. |

---

## # The stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14.2 (App Router) + TypeScript |
| UI / Motion / 3D | Tailwind 3.4 · Framer Motion 11 · Three.js 0.169 |
| DB (local) | PGlite 0.2.17 + pgvector (zero-config fallback) |
| DB (prod) | **Supabase / Postgres + `vector` — LIVE** via postgres.js (transaction pooler, region `syd1`) |
| Track source | **Last.fm API** (mood tags, artist top tracks/tags) — free, no Premium |
| Validation | zod 4 |
| AI (optional) | OpenRouter (engine upgrade); local lexicon is the default |
| Playback | link out to Spotify (search or exact track) |

---

## # How to run + verify

```bash
npm install
npm run dev            # http://localhost:3000  →  /  and  /app
```
- `/api/me` reports `db`, `universe`, `engine`, and `taste`.
- A moment returns `discover:true` when Last.fm sourced it (needs `LASTFM_API_KEY`), else falls back to the local universe.
- **`npm run build` before pushing.** ⚠️ Don't run `npm run build` while `next dev` is running — it corrupts `.next` (chunk errors). Stop dev first.
- See the quiz: open `/app` in an **incognito** window (it only shows for a brand-new user).

### Env keys (`.env.local`, gitignored)
`LASTFM_API_KEY` (discovery/quiz), `DATABASE_URL` (Supabase pooler), `SESSION_SECRET`, `APP_URL`, optional `OPENROUTER_API_KEY/MODEL`, `SPOTIFY_*`. **Not** `PGLITE_DATA_DIR` on Vercel.

---

## # Next steps

- **Set `LASTFM_API_KEY` on Vercel + redeploy** — the one thing left for prod to have discovery/languages/quiz.
- Per-mood taste profiles (store a vector per mood, not just one global) for sharper personalization.
- Passive context (time/weather/motion) into `/api/moment`.
- Album art + inline player; richer "why" per track.
- Freemium gating · PostHog + Sentry · Resend waitlist · HNSW index on `track_emotions.emotion` at scale.
- **Latency:** Supabase is in Sydney; `vercel.json` pins functions to `syd1`. For snappier *local* dev, recreate the project in `ap-south-1`.

---

## # Keeping it clean for GitHub + Vercel

`moodify/` is the git root → GitHub `Ronitt01/moodify`. `.gitignore` excludes `node_modules/`, `.next/`, `.env*`, `.pglite/`. **Do** commit `supabase/migrations/`, `vercel.json`, `HANDOFF.md`. **Never** commit `.env.local`; throwaway `_*.mjs` probes are deleted. Deploy: import repo to Vercel (Root Directory = `moodify` if needed) → set the env vars above → redeploy. `vercel.json` pins `regions: ["syd1"]`.

> TL;DR: code in `moodify/`, secrets in env, local = PGlite fallback, prod = Supabase (live), tracks from Last.fm → play on Spotify.
