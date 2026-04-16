import React, { useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession, logout, User } from './lib/auth';
import { THEMES } from './lib/themes';
import { getProfile, UserProfile } from './lib/profile';
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
  refreshProfile: () => void;
  handleLogout: () => void;
  updateUser: (u: User) => void;
}

export const AppContext = createContext<AppCtx | null>(null);
export const useApp = () => useContext(AppContext)!;

const theme = THEMES['night'];

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const s = getSession();
    return s ? getProfile(s.id, s) : null;
  });

  const refreshProfile = () => {
    if (user) setProfile(getProfile(user.id, user));
  };

  const handleLogout = () => { logout(); setUser(null); setProfile(null); };

  const updateUser = (u: User) => {
    setUser(u);
    setProfile(getProfile(u.id, u));
  };

  // ── Not logged in → always show auth ─────────────────────────────────────────
  if (!user || !profile) {
    return (
      <AuthScreen
        theme={theme}
        onAuth={u => { setUser(u); setProfile(getProfile(u.id, u)); }}
      />
    );
  }

  const ctx: AppCtx = { user, profile, refreshProfile, handleLogout, updateUser };

  return (
    <AppContext.Provider value={ctx}>
      <Routes>
        <Route path="/" element={<ArcadeHub />} />
        <Route path="/game/:gameId" element={<GameRouter />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<GlobalLeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  );
}
