import { createClient } from '@supabase/supabase-js';

// ─── Supabase config ─────────────────────────────────────────────────────────
// Create a free project at https://supabase.com
// Then copy your Project URL and anon/public key here.
//
// In Supabase SQL Editor, run this to create the rooms table:
//
// create table rooms (
//   id text primary key,
//   board text[] not null default array_fill(''::text, array[9]),
//   turn text not null default 'X',
//   player_x text,
//   player_o text,
//   winner text,
//   is_draw boolean not null default false,
//   chat jsonb not null default '[]'::jsonb,
//   updated_at timestamptz default now()
// );
//
// alter table rooms enable row level security;
// create policy "public access" on rooms for all using (true) with check (true);

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://placeholder.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export interface RoomRow {
  id: string;
  board: string[];
  turn: string;
  player_x: string | null;
  player_o: string | null;
  winner: string | null;
  is_draw: boolean;
  chat: { text: string; player: string; ts: number }[];
  updated_at: string;
}
