import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession, logout, User } from './lib/auth';
import { THEMES } from './lib/themes';
import { getProfile, fetchProfile, UserProfile } from './lib/profile';
import { isSupabaseConfigured } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import ArcadeHub from './pages/ArcadeHub';
import GameRouter from './pages/GameRouter';
import ProfilePage from './pages/ProfilePage';
import GlobalLeaderboardPage from './pages/GlobalLeaderboardPage';
import './styles.css';
import './index.css';

// ── App-wide context ──────────────────────────────────────────────────────────
export interface AppCtx {
  user: User;
  profile: UserProfile;
  synced: boolean;
  refreshProfile: () => Promise<void>;
  handleLogout: () => void;
  updateUser: (u: User) => void;
}

export const AppContext = createContext<AppCtx | null>(null);
export const useApp = () => useContext(AppContext)!;

const theme = THEMES['night'];

export default function App() {
  const [user, setUser]       = useState<User | null>(() => getSession());
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const s = getSession();
    return s ? getProfile(s.id, s) : null;
  });
  const [synced, setSynced]   = useState(false);

  // ── On login / mount: fetch fresh profile from Supabase ───────────────────
  useEffect(() => {
    if (!user) return;
    setSynced(false);
    fetchProfile(user.id, user).then(p => {
      setProfile(p);
      setSynced(true);
    });
  }, [user?.id]);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id, user);
    setProfile(p);
  };

  const handleLogout = () => { logout(); setUser(null); setProfile(null); setSynced(false); };

  const updateUser = (u: User) => {
    setUser(u);
    fetchProfile(u.id, u).then(setProfile);
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user || !profile) {
    return (
      <AuthScreen
        theme={theme}
        onAuth={u => {
          setUser(u);
          setProfile(getProfile(u.id, u));
          fetchProfile(u.id, u).then(p => { setProfile(p); setSynced(true); });
        }}
      />
    );
  }

  const ctx: AppCtx = { user, profile, synced, refreshProfile, handleLogout, updateUser };

  return (
    <AppContext.Provider value={ctx}>
      {/* ── Cloud sync status banner ── */}
      {!isSupabaseConfigured && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9000,
          background: '#78350f', borderTop: '1px solid #92400e',
          padding: '8px 16px', textAlign: 'center',
          fontSize: '0.78rem', color: '#fde68a', fontFamily: "'Outfit',sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          ⚠️ <strong>Local mode</strong> — scores saved on this device only.
          Add <code style={{ background: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> &amp;
          <code style={{ background: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>VITE_SUPABASE_ANON</code> to enable cloud saves.
        </div>
      )}

      {isSupabaseConfigured && !synced && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
          background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid #334155',
          padding: '6px 16px', textAlign: 'center',
          fontSize: '0.78rem', color: '#94a3b8', fontFamily: "'Outfit',sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          Syncing your profile…
        </div>
      )}

      <Routes>
        <Route path="/"            element={<ArcadeHub />} />
        <Route path="/game/:gameId" element={<GameRouter />} />
        <Route path="/profile"     element={<ProfilePage />} />
        <Route path="/leaderboard" element={<GlobalLeaderboardPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  );
}
