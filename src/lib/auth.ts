// ─── FoxyArcade Auth ──────────────────────────────────────────────────────────
// Primary:  Supabase (persists across ALL devices — set VITE_SUPABASE_URL)
// Fallback: localStorage  (works on any host with zero config)
//
// Passwords are ALWAYS hashed with SHA-256 before leaving the browser.
// We never store or transmit plaintext passwords.

import { supabase, isSupabaseConfigured, DBUser } from './supabase';

export interface User {
  id:        string;
  username:  string;
  avatar:    string;
  createdAt: number;
}

interface LocalUser extends User {
  passwordHash: string;
}

const SESSION_KEY  = 'foxytac-session';
const LS_USERS_KEY = 'foxytac-users';

// ── Crypto ────────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateInput(username: string, password: string): string | null {
  const name = username.trim();
  if (name.length < 2)  return 'Username must be at least 2 characters.';
  if (name.length > 20) return 'Username must be 20 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Only letters, numbers and underscores.';
  if (password.length < 4) return 'Password must be at least 4 characters.';
  return null;
}

// ── Session ───────────────────────────────────────────────────────────────────
export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(
  username: string,
  password: string,
  avatar:   string,
): Promise<{ user: User } | { error: string }> {
  const err = validateInput(username, password);
  if (err) return { error: err };

  const name = username.trim();
  const passwordHash = await sha256(password);

  // ── Supabase path ─────────────────────────────────────────────────────────
  if (isSupabaseConfigured) {
    // Check username taken
    const { data: existing } = await supabase
      .from('foxytac_users')
      .select('id')
      .ilike('username', name)
      .maybeSingle();

    if (existing) return { error: 'Username already taken.' };

    const newUser: Omit<DBUser,'game_stats'|'achievements'> & { game_stats: object; achievements: string[] } = {
      id:            uid(),
      username:      name,
      avatar,
      password_hash: passwordHash,
      xp:            0,
      level:         1,
      games_played:  0,
      games_won:     0,
      game_stats:    {},
      achievements:  [],
      joined_at:     Date.now(),
      last_seen:     Date.now(),
    };

    const { error: insertErr } = await supabase
      .from('foxytac_users')
      .insert(newUser);

    if (insertErr) return { error: insertErr.message };

    const user: User = { id: newUser.id, username: name, avatar, createdAt: newUser.joined_at };
    setSession(user);
    return { user };
  }

  // ── localStorage fallback ─────────────────────────────────────────────────
  const users = getLSUsers();
  if (users.find(u => u.username.toLowerCase() === name.toLowerCase()))
    return { error: 'Username already taken.' };

  const user: LocalUser = {
    id: uid(), username: name, avatar,
    createdAt: Date.now(), passwordHash,
  };
  saveLSUsers([...users, user]);
  const pub = toPublic(user);
  setSession(pub);
  return { user: pub };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(
  username: string,
  password: string,
): Promise<{ user: User } | { error: string }> {
  const name = username.trim();
  if (!name) return { error: 'Enter your username.' };
  if (!password) return { error: 'Enter your password.' };

  const passwordHash = await sha256(password);

  // ── Supabase path ─────────────────────────────────────────────────────────
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('foxytac_users')
      .select('id,username,avatar,password_hash,joined_at')
      .ilike('username', name)
      .maybeSingle();

    if (error || !data) return { error: 'Username not found.' };
    if (data.password_hash !== passwordHash) return { error: 'Wrong password.' };

    // Update last_seen
    await supabase
      .from('foxytac_users')
      .update({ last_seen: Date.now() })
      .eq('id', data.id);

    const user: User = {
      id: data.id, username: data.username,
      avatar: data.avatar, createdAt: data.joined_at,
    };
    setSession(user);
    return { user };
  }

  // ── localStorage fallback ─────────────────────────────────────────────────
  const users = getLSUsers();
  const found = users.find(u => u.username.toLowerCase() === name.toLowerCase());
  if (!found) return { error: 'Username not found.' };
  if (found.passwordHash !== passwordHash) return { error: 'Wrong password.' };
  const pub = toPublic(found);
  setSession(pub);
  return { user: pub };
}

// ── Update avatar ─────────────────────────────────────────────────────────────
export async function updateAvatar(userId: string, avatar: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase
      .from('foxytac_users')
      .update({ avatar })
      .eq('id', userId);
  } else {
    const users = getLSUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) { users[idx].avatar = avatar; saveLSUsers(users); }
  }
  const session = getSession();
  if (session?.id === userId) setSession({ ...session, avatar });
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function getLSUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]'); } catch { return []; }
}
function saveLSUsers(users: LocalUser[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}
function toPublic(u: LocalUser): User {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

export const AVATARS = [
  '🦊','🐺','🐻','🐯','🦁','🐸','🐼','🐨','🦝','🦄',
  '🐲','👾','🤖','👻','💀','🎭','🔥','⚡','🌙','🌈',
  '🎯','🏆','💎','🚀','🌊','🦋','🐉','🦅','🐬','🎪',
];
