# Moodify — Handoff

> Living doc. **Status as of 2026-06-19:** Landing page ✅ shipped. Backend **moment → queue MVP** ✅ built **and verified end-to-end** (real Postgres + pgvector + emotion engine). Spotify OAuth + ingestion coded and ready (needs a free dev app). `/app` studio live.

---

## # Changed

### Frontend (done, builds clean, serves 200)
- Full no-auth landing page — Next.js 14 (App Router) + TS + Tailwind + Framer Motion.
- **Three.js cursor-reactive particle galaxy** hero (`src/components/GalaxyField.tsx`): GPU vertex-shader motion, world-space cursor repulsion, reduced-motion fallback, full WebGL disposal.
- Sections: Hero (live console) · MomentsStrip · Manifesto · HowItWorks · Benefits · interactive Demo · Features · Proof · FAQ · FinalCTA · Footer. Copy in `src/lib/content.ts`.
- Landing "Just Start Playing" CTAs now route to the real **`/app`** studio.

### Backend MVP (done + verified)
- **Real embedded Postgres + pgvector via PGlite** (zero infra; same SQL ports to Supabase).
  - `src/server/db/schema.ts` + `supabase/migrations/0001_init.sql` (8 tables, `vector(16)`).
  - `src/server/db/index.ts` — singleton, migrate-on-boot, vector/array helpers.
- **Moodify-owned emotion engine** (deterministic, no key needed; LLM-swappable):
  - 16-dim interpretable space `emotion/space.ts`; lexicons `emotion/lexicon.ts`.
  - Track tagger `emotion/track.ts`; moment parser `emotion/moment.ts` (negation + idiom handling).
  - Provider interface `emotion/provider.ts` + optional OpenRouter brain `emotion/llm.ts`.
- **Starter universe** — ~115 real tracks (`seed/catalog.ts`) ingested + vectorized (`seed/index.ts`).
- **Recommendation engine** `engine/index.ts` — pgvector retrieval (`emotion <=> target`) → JS re-rank (centered cosine + context + diversity) → explainable "why".
- **Session** `session.ts` (anonymous-first signed cookie) + **Spotify** `spotify/index.ts` (OAuth, refresh, library ingestion with artist-genre enrichment; never writes to the account).
- **API**: `/api/me`, `/api/moment` (the spine), `/api/ingest`, `/api/spotify/connect` + `/callback`.
- **`/app` studio UI** `components/app/Studio.tsx` — connect, type a moment, see signals + the ranked queue.

### ✅ Verified (live, `npm run dev`)
Three contrasting moments produced three genuinely different, on-target queues from real pgvector math:
| Moment | Read | Top of queue |
| --- | --- | --- |
| "2AM drive in the rain, winding down but hopeful" | hopeful · serenity 100 | Night Owl · Sunset Lover · Brian Eno |
| "Gym, I want to feel invincible" | invincible · energy 100 triumph 100 | Kanye · SICKO MODE · Metallica · Eminem |
| "deep focus, do not disturb, studying" | locked in · focus 100 | Marconi Union · Aphex Twin · Hans Zimmer |

---

## # Failed attempts (and the fix)

| What broke | Why | Fix |
| --- | --- | --- |
| `@electric-sql/pglite@0.5.3` had no pgvector | 0.5.x ships only standard contrib modules | **Pinned `0.2.17`** (exports `/vector`); confirmed `require.resolve` first. |
| `npm install` → `EBUSY` | running `next dev` locked the package | TaskStop the dev server, reinstall. |
| `Varibleless` import in `Reveal.tsx` | typo'd a non-existent Framer export | Removed it. |
| 3 invalid emotion keys in lexicon | not in the 16-dim space (`as never` doesn't fix keys) | Replaced with valid dims. |
| Hero 3D tilt clobbered by float anim | Framer owns `transform` | Moved tilt into Framer `style={{ rotateX }}`. |
| `--marquee-duration` CSS var type error | `CSSProperties` has no string index | Cast `as CSSProperties`. |
| LLM provider not assignable to `EmotionProvider` | missing `name` field | Added `name` to the returned provider. |
| **Parser:** "winding down" tagged **sad** | bare `"down"`/`"low"`/`"blue"` are polysemous | Dropped them; use `"feeling down"`/`"feeling blue"`. |
| **Parser:** "do not disturb" **negated** "studying" | the idiom's "not" hit the negation window | Neutralize "do not disturb" → `dnd` before parsing; added a `focus` term. |

> ⚠️ PGlite persists to local disk (`.pglite/`) — great for dev, **does not work on Vercel serverless** (ephemeral FS). Production must use Supabase (schema already ports). See deploy notes.

---

## # The stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14.2 (App Router) + TypeScript |
| UI / Motion / 3D | Tailwind 3.4 · Framer Motion 11 · Three.js 0.169 |
| DB (local) | PGlite 0.2.17 (embedded Postgres) + pgvector |
| DB (prod) | Supabase / Postgres ≥ 15 + `vector` (same migration) |
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

`npm run build` type-checks the whole tree.

---

## # Next steps

**Go fully live (when ready):**
1. **Spotify** (3 min, free): developer.spotify.com/dashboard → Create app → Redirect URI `http://127.0.0.1:3000/api/spotify/callback` → put Client ID/Secret in `.env.local` → open the app at **127.0.0.1** (not localhost). Connect → your Liked Songs become the universe.
2. **OpenRouter**: set `OPENROUTER_API_KEY` to upgrade moment-reading from lexicon → LLM (auto-detected, falls back safely).
3. **Supabase** (for prod): apply `supabase/migrations/0001_init.sql`, set `SUPABASE_*`, swap `src/server/db/index.ts` to a Postgres driver (same SQL).

**Future phases (per brief):**
- Dynamic feedback loop → write to `taste_graph` (the compounding moat). `feedback` table already exists.
- Passive context (time/weather/motion) — wire real signals into `/api/moment` context.
- Freemium gating (RevenueCat) · PostHog + Sentry · Resend for the waitlist.
- LLM batch track-tagging job for richer embeddings at scale; add an HNSW index on `track_emotions`.

---

## # Keeping it clean for GitHub + Vercel

### Repo layout — make **`moodify/` the git root**
```bash
cd "moodify"
git init -b main
git add .
git commit -m "Moodify: landing page + emotion-engine MVP"
gh repo create moodify --private --source=. --push
```
`.gitignore` already excludes `node_modules/`, `.next/`, `.env*`, and `.pglite/`. **Do** commit `.env.example`, `supabase/migrations/`, `HANDOFF.md`. **Never** commit `.env.local`.

### Hygiene
- Branch per change → PR → Vercel preview → merge `main`.
- Secrets only in env (Vercel/Local), never in code. Provider/DB abstractions keep vendors swappable.
- `npm run build` before pushing.

### Deploy to Vercel
1. Push to GitHub (above).
2. vercel.com → New Project → import repo → Next.js auto-detected. (If `day 5/` stays the root, set **Root Directory = moodify**.)
3. **Env vars**: `SESSION_SECRET`, `APP_URL=https://<app>.vercel.app`, `SPOTIFY_CLIENT_ID/SECRET`, `SPOTIFY_REDIRECT_URI=https://<app>.vercel.app/api/spotify/callback`, optional `OPENROUTER_API_KEY`, `SUPABASE_*`.
4. **Production DB:** PGlite is dev-only (serverless FS is ephemeral). Before launch, point `src/server/db/index.ts` at **Supabase** (apply the migration, set env). Same schema, same `vector(16)`.
5. Add the production Spotify redirect URI (must be `https://`) in the Spotify dashboard, then redeploy.

> TL;DR: code in `moodify/`, secrets in env, local = PGlite, prod = Supabase — same schema either way.
