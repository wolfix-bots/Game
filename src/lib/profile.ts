// ── Local Profile & Stats ─────────────────────────────────────────────────────
// All data stored in localStorage — no backend needed.

import { User, addXP, recordWin, levelFromXP } from './auth';

export interface GameStat {
  played: number;
  won:    number;
  best:   number;
}

function statsKey(userId: string) { return `foxytac-stats-${userId}`; }

export function getGameStats(userId: string): Record<string, GameStat> {
  try { return JSON.parse(localStorage.getItem(statsKey(userId)) || '{}'); } catch { return {}; }
}

export function recordGameResult(
  userId: string, gameId: string, won: boolean, score = 0
): void {
  const stats = getGameStats(userId);
  const g = stats[gameId] || { played: 0, won: 0, best: 0 };
  g.played++;
  if (won) g.won++;
  if (score > g.best) g.best = score;
  stats[gameId] = g;
  try { localStorage.setItem(statsKey(userId), JSON.stringify(stats)); } catch {}

  // XP reward
  const xpGain = won ? 30 : 10;
  addXP(userId, xpGain);
  if (won) recordWin(userId);
}

export function xpProgressInLevel(xp: number): { current: number; needed: number } {
  const level = levelFromXP(xp);
  const xpForLevel = (l: number) => l * l * 50;
  const current = xp - xpForLevel(level - 1);
  const needed  = xpForLevel(level) - xpForLevel(level - 1);
  return { current: Math.max(0, current), needed: Math.max(1, needed) };
}
