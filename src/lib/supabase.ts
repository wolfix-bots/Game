import { createClient } from '@supabase/supabase-js';

// ── Real Supabase project ─────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://qyxbwusdzgltysewkyfr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eGJ3dXNkemdsdHlzZXdreWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzM2MTEsImV4cCI6MjA5MTkwOTYxMX0.dvXuH6SH6qchL3F4S_7pg9VFVOfkV3CIf9EQRKtLMkc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const isSupabaseConfigured = true;

// ── SQL to run in Supabase SQL Editor ─────────────────────────────────────────
// Run this once to set up tables:
//
// create table if not exists users (
//   id            text primary key,
//   username      text unique not null,
//   avatar        text not null default '🦊',
//   password_hash text not null,
//   xp            integer not null default 0,
//   level         integer not null default 1,
//   games_played  integer not null default 0,
//   games_won     integer not null default 0,
//   achievements  text[] not null default '{}',
//   joined_at     bigint not null,
//   last_seen     bigint not null
// );
//
// create table if not exists scores (
//   id         uuid primary key default gen_random_uuid(),
//   user_id    text not null references users(id),
//   username   text not null,
//   avatar     text not null,
//   game_id    text not null,
//   score      integer not null,
//   created_at timestamptz not null default now()
// );
//
// alter table users enable row level security;
// alter table scores enable row level security;
// create policy "public read users"  on users  for select using (true);
// create policy "public write users" on users  for all    using (true) with check (true);
// create policy "public read scores" on scores for select using (true);
// create policy "public write scores" on scores for all   using (true) with check (true);

export interface DBUser {
  id:            string;
  username:      string;
  avatar:        string;
  password_hash: string;
  xp:            number;
  level:         number;
  games_played:  number;
  games_won:     number;
  achievements:  string[];
  joined_at:     number;
  last_seen:     number;
}

export interface DBScore {
  id:         string;
  user_id:    string;
  username:   string;
  avatar:     string;
  game_id:    string;
  score:      number;
  created_at: string;
}

// ── XP helpers ────────────────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  return level * 100;
}

export function levelFromXP(xp: number): number {
  let level = 1;
  let needed = 100;
  while (xp >= needed) { xp -= needed; level++; needed = level * 100; }
  return level;
}

export function xpProgressInLevel(totalXP: number): { current: number; needed: number; level: number } {
  let xp = totalXP;
  let level = 1;
  let needed = 100;
  while (xp >= needed) { xp -= needed; level++; needed = level * 100; }
  return { current: xp, needed, level };
}
