-- ════════════════════════════════════════════════════════════════════════
--  Moodify — initial schema  (mirror of src/server/db/schema.ts)
--  Apply on Supabase:  supabase db push   (or paste into the SQL editor)
--  Requires the `vector` extension (enable under Database → Extensions).
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists vector;

-- Users — anonymous-first (honors "Just Start Playing"); upgraded on Spotify connect.
create table if not exists app_users (
  id            uuid primary key default gen_random_uuid(),
  display_name  text,
  email         text,
  plan          text not null default 'free',        -- free | premium
  is_anonymous  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Linked Spotify account + OAuth tokens. Encrypt tokens via Supabase Vault in prod.
create table if not exists spotify_accounts (
  user_id          uuid primary key references app_users(id) on delete cascade,
  spotify_user_id  text unique,
  access_token     text,
  refresh_token    text,
  scope            text,
  token_type       text,
  expires_at       timestamptz,
  product          text,
  display_name     text,
  email            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Global catalog (seed + ingested from Spotify). De-duped by (source, external_id).
create table if not exists tracks (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,                          -- seed | spotify
  external_id  text not null,
  title        text not null,
  artist       text not null,
  album        text,
  genres       text[] not null default '{}',
  year         int,
  image_url    text,
  popularity   int,
  created_at   timestamptz not null default now(),
  unique (source, external_id)
);

-- Emotional embedding per track — the Taste Graph's atomic unit.
create table if not exists track_emotions (
  track_id    uuid primary key references tracks(id) on delete cascade,
  emotion     vector(16) not null,
  tags        jsonb not null default '{}'::jsonb,
  model       text not null default 'local-lexicon-v1',
  updated_at  timestamptz not null default now()
);

-- A user's "universe": which tracks belong to their Master Playlists.
create table if not exists master_playlist_tracks (
  user_id          uuid not null references app_users(id) on delete cascade,
  track_id         uuid not null references tracks(id) on delete cascade,
  source_playlist  text,                               -- liked | <playlist> | starter
  liked            boolean not null default false,
  added_at         timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- Each "moment" the user expresses (semantic anchoring + passive context).
create table if not exists moments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app_users(id) on delete cascade,
  text        text,
  signals     jsonb not null default '{}'::jsonb,
  target      vector(16) not null,
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- The explainable queue produced for a moment.
create table if not exists queue_items (
  id          uuid primary key default gen_random_uuid(),
  moment_id   uuid not null references moments(id) on delete cascade,
  user_id     uuid not null references app_users(id) on delete cascade,
  track_id    uuid not null references tracks(id) on delete cascade,
  rank        int not null,
  score       real not null,
  why         jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Dynamic feedback loop — drives future learning.
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app_users(id) on delete cascade,
  track_id    uuid references tracks(id) on delete set null,
  moment_id   uuid references moments(id) on delete set null,
  kind        text not null,
  value       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Running emotional profile per user — the compounding moat.
create table if not exists taste_graph (
  user_id       uuid primary key references app_users(id) on delete cascade,
  profile       vector(16),
  interactions  int not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists idx_mpt_user     on master_playlist_tracks(user_id);
create index if not exists idx_tracks_source on tracks(source);
create index if not exists idx_moments_user  on moments(user_id);

-- At Supabase scale, add an approximate-nearest-neighbour index:
--   create index on track_emotions using hnsw (emotion vector_cosine_ops);

-- ── Row-Level Security (enable in Supabase; PGlite ignores) ──────────────
-- alter table app_users              enable row level security;
-- alter table master_playlist_tracks enable row level security;
-- ... add policies keyed on auth.uid() once Supabase Auth is wired.
