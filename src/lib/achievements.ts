export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ALL: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_win',    emoji: '🏆', title: 'First Blood',     desc: 'Win your first game' },
  { id: 'beat_easy',   emoji: '😊', title: 'Warm Up',         desc: 'Beat Easy AI' },
  { id: 'beat_medium', emoji: '🤔', title: 'Getting Serious', desc: 'Beat Medium AI' },
  { id: 'beat_hard',   emoji: '🤖', title: 'Unbeatable',      desc: 'Beat Hard AI' },
  { id: 'streak_3',    emoji: '🔥', title: 'On Fire',         desc: 'Win 3 in a row' },
  { id: 'streak_5',    emoji: '⚡', title: 'Unstoppable',     desc: 'Win 5 in a row' },
  { id: 'streak_10',   emoji: '👑', title: 'Fox King',        desc: 'Win 10 in a row' },
  { id: 'total_10',    emoji: '🎯', title: 'Dedicated',       desc: 'Play 10 games total' },
  { id: 'total_50',    emoji: '🦊', title: 'Foxy Veteran',    desc: 'Play 50 games total' },
  { id: 'online_win',  emoji: '🌍', title: 'World Beater',    desc: 'Win an online game' },
  { id: 'draw_5',      emoji: '🤝', title: 'Diplomat',        desc: 'Draw 5 games' },
  { id: 'speed_win',   emoji: '💨', title: 'Speed Fox',       desc: 'Win in 5 moves or less' },
  { id: 'daily_done',  emoji: '📅', title: 'Daily Player',    desc: 'Complete a daily puzzle' },
  { id: 'night_owl',   emoji: '🌙', title: 'Night Owl',       desc: 'Play in Night theme' },
  { id: 'neon_rider',  emoji: '⚡', title: 'Neon Rider',      desc: 'Play in Neon theme' },
  { id: 'win_100',     emoji: '💯', title: 'Century',         desc: 'Win 100 games total' },
];

export function getAchievements(): Achievement[] {
  try {
    const saved = JSON.parse(localStorage.getItem('foxy-achievements') || '{}');
    return ALL.map(a => ({ ...a, unlocked: !!saved[a.id], unlockedAt: saved[a.id] }));
  } catch { return ALL.map(a => ({ ...a, unlocked: false })); }
}

export function unlockAchievement(id: string): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem('foxy-achievements') || '{}');
    if (saved[id]) return false;
    saved[id] = Date.now();
    localStorage.setItem('foxy-achievements', JSON.stringify(saved));
    return true;
  } catch { return false; }
}

export interface Stats {
  totalGames: number; totalWins: number; totalLosses: number; totalDraws: number;
  currentStreak: number; bestStreak: number;
}

export function getStats(): Stats {
  try {
    return JSON.parse(localStorage.getItem('foxy-stats') || 'null') || defaultStats();
  } catch { return defaultStats(); }
}

function defaultStats(): Stats {
  return { totalGames: 0, totalWins: 0, totalLosses: 0, totalDraws: 0, currentStreak: 0, bestStreak: 0 };
}

export function updateStats(result: 'win' | 'loss' | 'draw'): Stats {
  const s = getStats();
  s.totalGames++;
  if (result === 'win') { s.totalWins++; s.currentStreak++; s.bestStreak = Math.max(s.bestStreak, s.currentStreak); }
  else if (result === 'loss') { s.totalLosses++; s.currentStreak = 0; }
  else { s.totalDraws++; s.currentStreak = 0; }
  localStorage.setItem('foxy-stats', JSON.stringify(s));
  return s;
}
