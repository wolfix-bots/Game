// ── Local Leaderboard ─────────────────────────────────────────────────────────
// Stores high scores in localStorage per game.

export interface LeaderboardEntry {
  rank:     number;
  userId:   string;
  username: string;
  avatar:   string;
  score:    number;
  date:     string;
}

function key(gameId: string) { return `foxytac-lb-${gameId}`; }

export async function submitScore(
  gameId: string, userId: string, username: string, avatar: string, score: number
): Promise<void> {
  const entries: LeaderboardEntry[] = getTopScores(gameId, 100);
  const existing = entries.findIndex(e => e.userId === userId);
  if (existing !== -1 && entries[existing].score >= score) return;
  if (existing !== -1) entries.splice(existing, 1);
  entries.push({ rank: 0, userId, username, avatar, score, date: new Date().toLocaleDateString() });
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });
  try { localStorage.setItem(key(gameId), JSON.stringify(entries.slice(0, 100))); } catch {}
}

export function getTopScores(gameId: string, limit = 10): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(key(gameId));
    return raw ? JSON.parse(raw).slice(0, limit) : [];
  } catch { return []; }
}

export async function getLeaderboard(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
  return getTopScores(gameId, limit);
}

// Aliases for backward compatibility
export const getGameLeaderboard = getLeaderboard;

export async function getXPLeaderboard(_limit = 10): Promise<{ rank:number; userId:string; username:string; avatar:string; xp:number; level:number; gamesWon:number }[]> {
  return []; // Local-only — no global XP leaderboard without a backend
}
