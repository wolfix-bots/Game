import { supabase } from './supabase';

export interface LeaderboardEntry {
  rank:     number;
  userId:   string;
  username: string;
  avatar:   string;
  score:    number;
  date:     string;
}

// ── Submit a score to Supabase ────────────────────────────────────────────────
export async function submitScore(
  gameId: string, userId: string, username: string, avatar: string, score: number
): Promise<void> {
  // Only update if it's a personal best
  const { data: existing } = await supabase
    .from('scores')
    .select('id,score')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .single();

  if (existing && existing.score >= score) return; // not a new best

  // Delete old best, insert new
  if (existing) await supabase.from('scores').delete().eq('id', existing.id);

  await supabase.from('scores').insert({
    user_id: userId, username, avatar,
    game_id: gameId, score,
  });
}

// ── Get top scores for a game ─────────────────────────────────────────────────
export async function getGameLeaderboard(gameId: string, limit = 20): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('scores')
    .select('user_id,username,avatar,score,created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);

  return (data || []).map((row, i) => ({
    rank:     i + 1,
    userId:   row.user_id,
    username: row.username,
    avatar:   row.avatar,
    score:    row.score,
    date:     row.created_at,
  }));
}

// ── Get global leaderboard (best score per user across all games) ─────────────
export async function getGlobalLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('scores')
    .select('user_id,username,avatar,score,created_at')
    .order('score', { ascending: false })
    .limit(limit);

  // Dedupe by user — keep their best
  const seen = new Set<string>();
  const unique: typeof data = [];
  for (const row of (data || [])) {
    if (!seen.has(row.user_id)) { seen.add(row.user_id); unique.push(row); }
  }

  return unique.map((row, i) => ({
    rank:     i + 1,
    userId:   row.user_id,
    username: row.username,
    avatar:   row.avatar,
    score:    row.score,
    date:     row.created_at,
  }));
}

// ── Get all-time top players by XP (from users table) ────────────────────────
export async function getXPLeaderboard(limit = 50): Promise<{ rank: number; userId: string; username: string; avatar: string; xp: number; level: number; gamesWon: number }[]> {
  const { data } = await supabase
    .from('users')
    .select('id,username,avatar,xp,level,games_won')
    .order('xp', { ascending: false })
    .limit(limit);

  return (data || []).map((row, i) => ({
    rank:     i + 1,
    userId:   row.id,
    username: row.username,
    avatar:   row.avatar,
    xp:       row.xp || 0,
    level:    row.level || 1,
    gamesWon: row.games_won || 0,
  }));
}
