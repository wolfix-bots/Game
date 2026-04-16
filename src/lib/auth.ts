// ── FoxyArcade Auth ───────────────────────────────────────────────────────────
// Uses Supabase as primary store (cross-device accounts).
// Passwords are SHA-256 hashed in the browser — never sent plaintext.
// OAuth (Google, GitHub, Discord, Twitter) handled via Supabase Auth.

import { supabase, DBUser, levelFromXP } from './supabase';

export interface User {
  id:          string;
  username:    string;
  avatar:      string;
  xp:          number;
  level:       number;
  gamesPlayed: number;
  gamesWon:    number;
  achievements:string[];
  createdAt:   number;
}

const SESSION_KEY = 'foxytac-session';

// ── Crypto ────────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function validate(username: string, password: string): string | null {
  const name = username.trim();
  if (name.length < 2)  return 'Username must be at least 2 characters.';
  if (name.length > 20) return 'Username must be 20 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Only letters, numbers and underscores.';
  if (password.length < 4) return 'Password must be at least 4 characters.';
  return null;
}

function toUser(row: DBUser): User {
  return {
    id:           row.id,
    username:     row.username,
    avatar:       row.avatar,
    xp:           row.xp,
    level:        row.level,
    gamesPlayed:  row.games_played,
    gamesWon:     row.games_won,
    achievements: row.achievements,
    createdAt:    row.joined_at,
  };
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(
  username: string, password: string, avatar: string
): Promise<{ user: User } | { error: string }> {
  const err = validate(username, password);
  if (err) return { error: err };

  const name = username.trim();
  const hash = await sha256(password);
  const now  = Date.now();
  const id   = uid();

  const { error } = await supabase.from('users').insert({
    id, username: name, avatar, password_hash: hash,
    xp: 0, level: 1, games_played: 0, games_won: 0,
    achievements: [], joined_at: now, last_seen: now,
  });

  if (error) {
    if (error.message?.includes('unique')) return { error: 'Username already taken.' };
    return { error: error.message };
  }

  const user: User = { id, username: name, avatar, xp: 0, level: 1, gamesPlayed: 0, gamesWon: 0, achievements: [], createdAt: now };
  saveSession(user);
  return { user };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(
  username: string, password: string
): Promise<{ user: User } | { error: string }> {
  const name = username.trim();
  if (!name) return { error: 'Enter your username.' };
  if (!password) return { error: 'Enter your password.' };

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', name)
    .single();

  if (error || !data) return { error: 'Username not found.' };

  const hash = await sha256(password);
  if (hash !== data.password_hash) return { error: 'Wrong password.' };

  // Update last_seen
  await supabase.from('users').update({ last_seen: Date.now() }).eq('id', data.id);

  const user = toUser(data as DBUser);
  saveSession(user);
  return { user };
}

// ── Session ───────────────────────────────────────────────────────────────────
export function getSession(): User | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

export function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Update avatar ─────────────────────────────────────────────────────────────
export async function updateAvatar(userId: string, avatar: string): Promise<void> {
  await supabase.from('users').update({ avatar }).eq('id', userId);
  const session = getSession();
  if (session?.id === userId) saveSession({ ...session, avatar });
}

// ── Add XP ────────────────────────────────────────────────────────────────────
export async function addXP(userId: string, amount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const { data } = await supabase.from('users').select('xp,level,games_played').eq('id', userId).single();
  if (!data) return { newXP: 0, newLevel: 1, leveledUp: false };

  const newXP    = (data.xp || 0) + amount;
  const newLevel = levelFromXP(newXP);
  const leveledUp = newLevel > (data.level || 1);

  await supabase.from('users').update({
    xp: newXP, level: newLevel,
    games_played: (data.games_played || 0) + 1,
  }).eq('id', userId);

  const session = getSession();
  if (session?.id === userId) saveSession({ ...session, xp: newXP, level: newLevel, gamesPlayed: (session.gamesPlayed || 0) + 1 });

  return { newXP, newLevel, leveledUp };
}

// ── Submit win ────────────────────────────────────────────────────────────────
export async function recordWin(userId: string): Promise<void> {
  const { data } = await supabase.from('users').select('games_won').eq('id', userId).single();
  if (!data) return;
  const newWins = (data.games_won || 0) + 1;
  await supabase.from('users').update({ games_won: newWins }).eq('id', userId);
  const session = getSession();
  if (session?.id === userId) saveSession({ ...session, gamesWon: newWins });
}

// ── Refresh session from DB ───────────────────────────────────────────────────
export async function refreshSession(userId: string): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!data) return null;
  const user = toUser(data as DBUser);
  saveSession(user);
  return user;
}

// ── OAuth Sign In ─────────────────────────────────────────────────────────────
export type OAuthProvider = 'google' | 'github' | 'discord' | 'twitter';

export async function signInWithOAuth(
  provider: OAuthProvider
): Promise<{ error: string } | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      scopes: provider === 'discord' ? 'identify email' : undefined,
    },
  });
  if (error) return { error: error.message };
  return null; // redirect happens — page reloads
}

// ── Handle OAuth callback & create/load user row ──────────────────────────────
export async function handleOAuthCallback(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const oauthUser = session.user;
  const id        = oauthUser.id;
  const email     = oauthUser.email || '';
  const meta      = oauthUser.user_metadata || {};

  // Build a display name from provider metadata
  const rawName =
    meta.full_name || meta.name || meta.user_name ||
    meta.preferred_username || email.split('@')[0] || 'Player';

  // Sanitise to allowed chars, max 20
  const username = rawName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'Player';

  // Check if user row already exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (existing) {
    await supabase.from('users').update({ last_seen: Date.now() }).eq('id', id);
    const user = toUser(existing as DBUser);
    saveSession(user);
    return user;
  }

  // First OAuth login — create user row
  const avatar = meta.avatar_url ? '🦊' : '🦊'; // always emoji avatar
  const now    = Date.now();

  await supabase.from('users').insert({
    id,
    username,
    avatar,
    password_hash: 'oauth', // not used for OAuth users
    xp: 0, level: 1, games_played: 0, games_won: 0,
    achievements: [], joined_at: now, last_seen: now,
  });

  const user: User = {
    id, username, avatar,
    xp: 0, level: 1, gamesPlayed: 0, gamesWon: 0,
    achievements: [], createdAt: now,
  };
  saveSession(user);
  return user;
}

export const AVATARS = [
  '🦊','🐺','🐻','🐯','🦁','🐸','🐼','🐨','🦄','🐲',
  '🦋','🌸','⭐','🔥','💎','🎵','🚀','👾','🤖','🎭',
];
