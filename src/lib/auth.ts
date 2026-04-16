// ── FoxyArcade Auth ───────────────────────────────────────────────────────────
// Pure localStorage — no backend needed. Works on Vercel, Render, Netlify, etc.
// Passwords are SHA-256 hashed via Web Crypto API — never stored plaintext.

export interface User {
  id:           string;
  username:     string;
  avatar:       string;
  xp:           number;
  level:        number;
  gamesPlayed:  number;
  gamesWon:     number;
  achievements: string[];
  createdAt:    number;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY   = 'foxytac-users';
const SESSION_KEY = 'foxytac-session';

// ── Crypto ────────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublic(u: StoredUser): User {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

function validate(username: string, password: string): string | null {
  const name = username.trim();
  if (name.length < 2)  return 'Username must be at least 2 characters.';
  if (name.length > 20) return 'Username must be 20 characters or less.';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Only letters, numbers and underscores.';
  if (password.length < 4) return 'Password must be at least 4 characters.';
  return null;
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(
  username: string, password: string, avatar: string
): Promise<{ user: User } | { error: string }> {
  const err = validate(username, password);
  if (err) return { error: err };

  const name  = username.trim();
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === name.toLowerCase()))
    return { error: 'Username already taken.' };

  const passwordHash = await sha256(password);
  const now = Date.now();
  const user: StoredUser = {
    id: uid(), username: name, avatar, passwordHash,
    xp: 0, level: 1, gamesPlayed: 0, gamesWon: 0,
    achievements: [], createdAt: now,
  };
  saveUsers([...users, user]);
  saveSession(toPublic(user));
  return { user: toPublic(user) };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(
  username: string, password: string
): Promise<{ user: User } | { error: string }> {
  const name = username.trim();
  if (!name)     return { error: 'Enter your username.' };
  if (!password) return { error: 'Enter your password.' };

  const users = getUsers();
  const found = users.find(u => u.username.toLowerCase() === name.toLowerCase());
  if (!found) return { error: 'Username not found.' };

  const hash = await sha256(password);
  if (hash !== found.passwordHash) return { error: 'Wrong password.' };

  saveSession(toPublic(found));
  return { user: toPublic(found) };
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
export function updateAvatar(userId: string, avatar: string): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) { users[idx].avatar = avatar; saveUsers(users); }
  const session = getSession();
  if (session?.id === userId) saveSession({ ...session, avatar });
}

// ── XP / stats ────────────────────────────────────────────────────────────────
export function levelFromXP(xp: number): number {
  return Math.floor(1 + Math.sqrt(xp / 50));
}

export function addXP(userId: string, amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { newXP: 0, newLevel: 1, leveledUp: false };

  const newXP    = (users[idx].xp || 0) + amount;
  const newLevel = levelFromXP(newXP);
  const leveledUp = newLevel > (users[idx].level || 1);
  users[idx].xp = newXP;
  users[idx].level = newLevel;
  users[idx].gamesPlayed = (users[idx].gamesPlayed || 0) + 1;
  saveUsers(users);

  const session = getSession();
  if (session?.id === userId)
    saveSession({ ...session, xp: newXP, level: newLevel, gamesPlayed: users[idx].gamesPlayed });

  return { newXP, newLevel, leveledUp };
}

export function recordWin(userId: string): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].gamesWon = (users[idx].gamesWon || 0) + 1;
  saveUsers(users);
  const session = getSession();
  if (session?.id === userId) saveSession({ ...session, gamesWon: users[idx].gamesWon });
}

export async function refreshSession(userId: string): Promise<User | null> {
  const users = getUsers();
  const found = users.find(u => u.id === userId);
  if (!found) return null;
  const pub = toPublic(found);
  saveSession(pub);
  return pub;
}

export const AVATARS = [
  '🦊','🐺','🐻','🐯','🦁','🐸','🐼','🐨','🦄','🐲',
  '🦋','🌸','⭐','🔥','💎','🎵','🚀','👾','🤖','🎭',
];
