// ─── User Profile & XP System ─────────────────────────────────────────────────
// Primary:  Supabase (cross-device persistence)
// Fallback: localStorage (zero-config, works everywhere)

import { supabase, isSupabaseConfigured, DBUser, DBScore } from './supabase';
import { User } from './auth';

export interface UserProfile {
  userId:      string;
  username:    string;
  avatar:      string;
  xp:          number;
  level:       number;
  gamesPlayed: number;
  gamesWon:    number;
  gameStats:   Record<string, { played: number; won: number; bestScore: number }>;
  achievements: string[];
  joinedAt:    number;
  lastSeen:    number;
}

export interface LeaderboardEntry {
  userId:      string;
  username:    string;
  avatar:      string;
  xp:          number;
  level:       number;
  gamesWon:    number;
  gamesPlayed: number;
}

// XP rewards
export const XP = {
  win:         50,
  draw:        15,
  loss:         5,
  dailyPuzzle: 30,
  achievement: 100,
  playGame:     2,
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
  const next    = level * level * 100;
  return Math.round(((xp - current) / (next - current)) * 100);
}

// ── Local cache key ───────────────────────────────────────────────────────────
const profileKey = (id: string) => `foxytac-profile-${id}`;
const LS_LB_KEY  = 'foxytac-global-lb';

// ── Convert DB row → UserProfile ──────────────────────────────────────────────
function fromDB(row: DBUser): UserProfile {
  return {
    userId:      row.id,
    username:    row.username,
    avatar:      row.avatar,
    xp:          row.xp,
    level:       row.level,
    gamesPlayed: row.games_played,
    gamesWon:    row.games_won,
    gameStats:   row.game_stats || {},
    achievements: row.achievements || [],
    joinedAt:    row.joined_at,
    lastSeen:    row.last_seen,
  };
}

// ── Get profile (async — fetches from Supabase if configured) ─────────────────
export async function fetchProfile(userId: string, user?: User): Promise<UserProfile> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('foxytac_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      const profile = fromDB(data as DBUser);
      // Sync latest username/avatar
      if (user) { profile.username = user.username; profile.avatar = user.avatar; }
      // Cache locally for offline use
      localStorage.setItem(profileKey(userId), JSON.stringify(profile));
      return profile;
    }
  }
  return getProfile(userId, user);
}

// ── Get profile (sync — from local cache, used for immediate render) ──────────
export function getProfile(userId: string, user?: User): UserProfile {
  try {
    const raw = localStorage.getItem(profileKey(userId));
    if (raw) {
      const p = JSON.parse(raw) as UserProfile;
      if (user) { p.username = user.username; p.avatar = user.avatar; }
      return p;
    }
  } catch {}
  return {
    userId,
    username:    user?.username || 'Unknown',
    avatar:      user?.avatar   || '🦊',
    xp:          0,
    level:       1,
    gamesPlayed: 0,
    gamesWon:    0,
    gameStats:   {},
    achievements: [],
    joinedAt:    Date.now(),
    lastSeen:    Date.now(),
  };
}

// ── Save profile ──────────────────────────────────────────────────────────────
export async function saveProfile(profile: UserProfile): Promise<void> {
  profile.level    = xpToLevel(profile.xp);
  profile.lastSeen = Date.now();

  // Always update local cache immediately
  localStorage.setItem(profileKey(profile.userId), JSON.stringify(profile));

  if (isSupabaseConfigured) {
    await supabase.from('foxytac_users').update({
      xp:           profile.xp,
      level:        profile.level,
      games_played: profile.gamesPlayed,
      games_won:    profile.gamesWon,
      game_stats:   profile.gameStats,
      achievements: profile.achievements,
      last_seen:    profile.lastSeen,
      avatar:       profile.avatar,
      username:     profile.username,
    }).eq('id', profile.userId);
  }

  // Update local leaderboard cache
  updateLocalLB(profile);
}

// ── Add XP + record game result ───────────────────────────────────────────────
export async function addXP(
  userId:  string,
  user:    User,
  amount:  number,
  gameId?: string,
  result?: 'win' | 'loss' | 'draw',
  score?:  number,
): Promise<UserProfile> {
  const p = getProfile(userId, user);
  p.xp += amount;
  p.gamesPlayed++;
  if (result === 'win') p.gamesWon++;

  if (gameId) {
    if (!p.gameStats[gameId]) p.gameStats[gameId] = { played: 0, won: 0, bestScore: 0 };
    p.gameStats[gameId].played++;
    if (result === 'win') p.gameStats[gameId].won++;
    if (score && score > p.gameStats[gameId].bestScore)
      p.gameStats[gameId].bestScore = score;
  }

  await saveProfile(p);

  // Post score to leaderboard table
  if (isSupabaseConfigured && gameId && score !== undefined) {
    await supabase.from('foxytac_scores').insert({
      user_id:  userId,
      username: user.username,
      avatar:   user.avatar,
      game_id:  gameId,
      score,
      result,
    } as unknown as DBScore);
  }

  return p;
}

// ── Unlock achievement ────────────────────────────────────────────────────────
export async function unlockAchievementXP(
  userId:        string,
  user:          User,
  achievementId: string,
): Promise<UserProfile> {
  const p = getProfile(userId, user);
  if (!p.achievements.includes(achievementId)) {
    p.achievements.push(achievementId);
    p.xp += XP.achievement;
    await saveProfile(p);
  }
  return p;
}

// ── Global leaderboard ────────────────────────────────────────────────────────
export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('foxytac_users')
      .select('id,username,avatar,xp,level,games_won,games_played')
      .order('xp', { ascending: false })
      .limit(100);

    if (!error && data) {
      const entries = (data as any[]).map(r => ({
        userId:      r.id,
        username:    r.username,
        avatar:      r.avatar,
        xp:          r.xp,
        level:       r.level,
        gamesWon:    r.games_won,
        gamesPlayed: r.games_played,
      }));
      // Cache locally
      localStorage.setItem(LS_LB_KEY, JSON.stringify(entries));
      return entries;
    }
  }
  return getLocalLB();
}

// ── Per-game leaderboard ──────────────────────────────────────────────────────
export async function fetchGameLeaderboard(
  gameId: string,
): Promise<{ username: string; avatar: string; bestScore: number; won: number }[]> {
  if (isSupabaseConfigured) {
    // Get best score per user for this game
    const { data, error } = await supabase
      .from('foxytac_scores')
      .select('username,avatar,score,result')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(200);

    if (!error && data) {
      // Deduplicate — keep best score per user
      const map = new Map<string, { username: string; avatar: string; bestScore: number; won: number }>();
      for (const row of data as any[]) {
        const existing = map.get(row.username);
        if (!existing || row.score > existing.bestScore) {
          map.set(row.username, {
            username:  row.username,
            avatar:    row.avatar,
            bestScore: row.score,
            won:       existing?.won || (row.result === 'win' ? 1 : 0),
          });
        } else if (row.result === 'win') {
          existing.won++;
        }
      }
      return Array.from(map.values()).sort((a, b) => b.bestScore - a.bestScore).slice(0, 50);
    }
  }
  return getGameLeaderboard(gameId);
}

// ── Local leaderboard helpers ─────────────────────────────────────────────────
function updateLocalLB(profile: UserProfile) {
  try {
    const lb = getLocalLB();
    const idx = lb.findIndex(e => e.userId === profile.userId);
    const entry: LeaderboardEntry = {
      userId: profile.userId, username: profile.username, avatar: profile.avatar,
      xp: profile.xp, level: profile.level,
      gamesWon: profile.gamesWon, gamesPlayed: profile.gamesPlayed,
    };
    if (idx >= 0) lb[idx] = entry; else lb.push(entry);
    lb.sort((a, b) => b.xp - a.xp);
    localStorage.setItem(LS_LB_KEY, JSON.stringify(lb.slice(0, 200)));
  } catch {}
}

export function getLocalLB(): LeaderboardEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_LB_KEY) || '[]'); } catch { return []; }
}

// Sync fallback for components that can't await
export function getGameLeaderboard(gameId: string): { username: string; avatar: string; bestScore: number; won: number }[] {
  try {
    const lb = getLocalLB();
    return lb.map(e => {
      const p = getProfile(e.userId);
      const gs = p.gameStats[gameId] || { bestScore: 0, won: 0 };
      return { username: e.username, avatar: e.avatar, bestScore: gs.bestScore, won: gs.won };
    }).filter(e => e.bestScore > 0).sort((a,b) => b.bestScore - a.bestScore).slice(0,50);
  } catch { return []; }
}
