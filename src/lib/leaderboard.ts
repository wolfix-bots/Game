export interface LeaderboardEntry {
  username: string;
  avatar: string;
  score: number;
  date: number;
}

export interface GameLeaderboard {
  [gameId: string]: LeaderboardEntry[];
}

const KEY = 'foxytac-leaderboard';

export function getLeaderboard(gameId: string): LeaderboardEntry[] {
  try {
    const all: GameLeaderboard = JSON.parse(localStorage.getItem(KEY) || '{}');
    return (all[gameId] || []).sort((a, b) => b.score - a.score);
  } catch { return []; }
}

export function submitScore(gameId: string, username: string, avatar: string, score: number) {
  try {
    const all: GameLeaderboard = JSON.parse(localStorage.getItem(KEY) || '{}');
    const entries = all[gameId] || [];
    // Update or add entry
    const idx = entries.findIndex(e => e.username === username);
    if (idx >= 0) {
      if (score > entries[idx].score) entries[idx] = { username, avatar, score, date: Date.now() };
    } else {
      entries.push({ username, avatar, score, date: Date.now() });
    }
    all[gameId] = entries.sort((a, b) => b.score - a.score).slice(0, 100);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function getGlobalLeaderboard(): { gameId: string; entry: LeaderboardEntry }[] {
  try {
    const all: GameLeaderboard = JSON.parse(localStorage.getItem(KEY) || '{}');
    const results: { gameId: string; entry: LeaderboardEntry }[] = [];
    for (const [gameId, entries] of Object.entries(all)) {
      for (const entry of entries) results.push({ gameId, entry });
    }
    return results.sort((a, b) => b.entry.score - a.entry.score);
  } catch { return []; }
}
