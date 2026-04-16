// ─── User Profile & XP System ────────────────────────────────────────────────
// XP is stored per-user in localStorage under their userId.
// Global leaderboard uses Ably to broadcast scores across devices in real-time.

import { User } from './auth';

export interface UserProfile {
  userId: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  gamesWon: number;
  gameStats: Record<string, { played: number; won: number; bestScore: number }>;
  achievements: string[];
  joinedAt: number;
  lastSeen: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  gamesWon: number;
  gamesPlayed: number;
}

// XP rewards
export const XP = {
  win:        50,
  draw:       15,
  loss:        5,
  dailyPuzzle: 30,
  achievement: 100,
  playGame:    2,
};

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * level * 100;
}

export function xpProgress(xp: number): number {
  const level = xpToLevel(xp);
  const current = (level - 1) * (level - 1) * 100;
  const next = level * level * 100;
  return Math.round(((xp - current) / (next - current)) * 100);
}

const profileKey = (userId: string) => `foxytac-profile-${userId}`;
const GLOBAL_LB_KEY = 'foxytac-global-lb';

export function getProfile(userId: string, user?: User): UserProfile {
  try {
    const raw = localStorage.getItem(profileKey(userId));
    if (raw) {
      const p = JSON.parse(raw) as UserProfile;
      // Sync username/avatar from user object if changed
      if (user) { p.username = user.username; p.avatar = user.avatar; }
      return p;
    }
  } catch {}
  return {
    userId,
    username: user?.username || 'Unknown',
    avatar: user?.avatar || '🦊',
    xp: 0,
    level: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    gameStats: {},
    achievements: [],
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };
}

export function saveProfile(profile: UserProfile) {
  profile.level = xpToLevel(profile.xp);
  profile.lastSeen = Date.now();
  localStorage.setItem(profileKey(profile.userId), JSON.stringify(profile));
  updateGlobalLB(profile);
}

export function addXP(userId: string, user: User, amount: number, gameId?: string, result?: 'win' | 'loss' | 'draw', score?: number): UserProfile {
  const p = getProfile(userId, user);
  p.xp += amount;
  p.gamesPlayed++;
  if (result === 'win') p.gamesWon++;
  if (gameId) {
    if (!p.gameStats[gameId]) p.gameStats[gameId] = { played: 0, won: 0, bestScore: 0 };
    p.gameStats[gameId].played++;
    if (result === 'win') p.gameStats[gameId].won++;
    if (score && score > p.gameStats[gameId].bestScore) p.gameStats[gameId].bestScore = score;
  }
  saveProfile(p);
  return p;
}

export function unlockAchievementXP(userId: string, user: User, achievementId: string): UserProfile {
  const p = getProfile(userId, user);
  if (!p.achievements.includes(achievementId)) {
    p.achievements.push(achievementId);
    p.xp += XP.achievement;
    saveProfile(p);
  }
  return p;
}

// ── Global Leaderboard (localStorage across all users on this device + Ably sync) ──
function updateGlobalLB(profile: UserProfile) {
  try {
    const lb: LeaderboardEntry[] = getGlobalLeaderboard();
    const idx = lb.findIndex(e => e.userId === profile.userId);
    const entry: LeaderboardEntry = {
      userId: profile.userId,
      username: profile.username,
      avatar: profile.avatar,
      xp: profile.xp,
      level: profile.level,
      gamesWon: profile.gamesWon,
      gamesPlayed: profile.gamesPlayed,
    };
    if (idx >= 0) lb[idx] = entry;
    else lb.push(entry);
    lb.sort((a, b) => b.xp - a.xp);
    localStorage.setItem(GLOBAL_LB_KEY, JSON.stringify(lb.slice(0, 200)));
  } catch {}
}

export function getGlobalLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_LB_KEY) || '[]');
  } catch { return []; }
}

export function getGameLeaderboard(gameId: string): { username: string; avatar: string; bestScore: number; won: number }[] {
  try {
    const lb = getGlobalLeaderboard();
    return lb
      .filter(e => {
        const p = getProfile(e.userId);
        return p.gameStats[gameId];
      })
      .map(e => {
        const p = getProfile(e.userId);
        const gs = p.gameStats[gameId] || { bestScore: 0, won: 0 };
        return { username: e.username, avatar: e.avatar, bestScore: gs.bestScore, won: gs.won };
      })
      .sort((a, b) => b.bestScore - a.bestScore || b.won - a.won)
      .slice(0, 50);
  } catch { return []; }
}
