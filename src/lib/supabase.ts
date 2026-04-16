import { createClient } from '@supabase/supabase-js';

// ─── Supabase config ──────────────────────────────────────────────────────────
// Create a FREE project at https://supabase.com
// Then paste your Project URL and anon key below (or use env vars).
//
// ─── SQL to run in Supabase SQL Editor ───────────────────────────────────────
//
// -- 1. Users table (stores hashed passwords + profile)
// create table if not exists foxytac_users (
//   id           text primary key,
//   username     text unique not null,
//   avatar       text not null default '🦊',
//   password_hash text not null,
//   xp           integer not null default 0,
//   level        integer not null default 1,
//   games_played integer not null default 0,
//   games_won    integer not null default 0,
//   game_stats   jsonb   not null default '{}'::jsonb,
//   achievements text[]  not null default '{}',
//   joined_at    bigint  not null default extract(epoch from now())*1000,
//   last_seen    bigint  not null default extract(epoch from now())*1000
// );
//
// -- 2. Scores table (per-game leaderboard entries)
// create table if not exists foxytac_scores (
//   id         bigserial primary key,
//   user_id    text not null references foxytac_users(id) on delete cascade,
//   username   text not null,
//   avatar     text not null,
//   game_id    text not null,
//   score      integer not null default 0,
//   result     text,
//   created_at timestamptz default now()
// );
// create index if not exists scores_game_id on foxytac_scores(game_id);
// create index if not exists scores_user_id on foxytac_scores(user_id);
//
// -- 3. Open RLS policies (public read/write — fine for a game)
// alter table foxytac_users  enable row level security;
// alter table foxytac_scores enable row level security;
// create policy "public_all_users"  on foxytac_users  for all using (true) with check (true);
// create policy "public_all_scores" on foxytac_scores for all using (true) with check (true);

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON as string | undefined;

export const isSupabaseConfigured =
  !!SUPABASE_URL && !SUPABASE_URL.includes('placeholder');

// Always create a client — it's a no-op if not configured (calls will fail gracefully)
export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-anon-key',
);

// ── Row types ─────────────────────────────────────────────────────────────────
export interface DBUser {
  id:           string;
  username:     string;
  avatar:       string;
  password_hash: string;
  xp:           number;
  level:        number;
  games_played: number;
  games_won:    number;
  game_stats:   Record<string, { played: number; won: number; bestScore: number }>;
  achievements: string[];
  joined_at:    number;
  last_seen:    number;
}

export interface DBScore {
  id?:        number;
  user_id:    string;
  username:   string;
  avatar:     string;
  game_id:    string;
  score:      number;
  result?:    string;
  created_at?: string;
}
