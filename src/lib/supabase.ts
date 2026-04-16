import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://qyxbwusdzgltysewkyfr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eGJ3dXNkemdsdHlzZXdreWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzM2MTEsImV4cCI6MjA5MTkwOTYxMX0.dvXuH6SH6qchL3F4S_7pg9VFVOfkV3CIf9EQRKtLMkc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const isSupabaseConfigured = true;

// DB row types
export interface DBUser {
  id:            string;
  username:      string;
  avatar:        string;
  password_hash: string;
  xp:            number;
  level:         number;
  games_played:  number;
  games_won:     number;
  game_stats:    Record<string, any>;
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

// Rooms table for online TicTacToe
export interface RoomRow {
  id:        string;
  board:     string[];
  turn:      string;
  player_x:  string | null;
  player_o:  string | null;
  winner:    string | null;
  is_draw:   boolean;
  chat:      { text: string; player: string; ts: number }[];
  updated_at:string;
}
