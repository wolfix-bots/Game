// ─── FoxyTac Auth ────────────────────────────────────────────────────────────
// Lightweight localStorage-based auth. No backend required.
// Passwords are hashed with SHA-256 via Web Crypto API.
// User data lives in localStorage — works on any host (Vercel, Render, etc.)

export interface User {
  id: string;
  username: string;
  avatar: string;   // emoji avatar
  createdAt: number;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY   = 'foxytac-users';
const SESSION_KEY = 'foxytac-session';

// ── Crypto helpers ────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function register(
  username: string,
  password: string,
  avatar: string
): Promise<{ user: User } | { error: string }> {
  const name = username.trim();
  if (name.length < 2)  return { error: 'Username must be at least 2 characters.' };
  if (name.length > 20) return { error: 'Username must be 20 characters or less.' };
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return { error: 'Only letters, numbers and underscores.' };
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' };

  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === name.toLowerCase())) {
    return { error: 'Username already taken.' };
  }

  const passwordHash = await sha256(password);
  const user: StoredUser = {
    id: uid(),
    username: name,
    avatar,
    createdAt: Date.now(),
    passwordHash,
  };
  saveUsers([...users, user]);
  setSession(user);
  return { user: toPublic(user) };
}

export async function login(
  username: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const users = getUsers();
  const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!found) return { error: 'Username not found.' };
  const hash = await sha256(password);
  if (hash !== found.passwordHash) return { error: 'Wrong password.' };
  setSession(found);
  return { user: toPublic(found) };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSession(user: StoredUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublic(user)));
}

function toPublic(u: StoredUser): User {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

export function updateAvatar(userId: string, avatar: string) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].avatar = avatar;
  saveUsers(users);
  const session = getSession();
  if (session?.id === userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, avatar }));
  }
}

export const AVATARS = [
  '🦊','🐺','🐻','🐯','🦁','🐸','🐼','🐨','🦝','🦄',
  '🐲','👾','🤖','👻','💀','🎭','🔥','⚡','🌙','🌈',
];
