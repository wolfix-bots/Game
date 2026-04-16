import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { THEMES } from './lib/themes';
import { getSession, logout, User } from './lib/auth';
import AuthScreen from './components/AuthScreen';
import ArcadeHub from './pages/ArcadeHub';
import GameRouter from './pages/GameRouter';
import './styles.css';
import './index.css';

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [isGuest, setIsGuest] = useState(false);
  const theme = THEMES['night'];

  if (!user && !isGuest) {
    return (
      <AuthScreen
        theme={theme}
        onAuth={u => setUser(u)}
        onGuest={() => setIsGuest(true)}
      />
    );
  }

  const handleLogout = () => { logout(); setUser(null); setIsGuest(false); };
  const handleAvatarChange = (u: User) => setUser(u);

  return (
    <Routes>
      <Route path="/" element={
        <ArcadeHub
          theme={theme}
          user={user}
          onLogout={handleLogout}
          onAvatarChange={handleAvatarChange}
        />
      } />
      <Route path="/game/:gameId" element={
        <GameRouter user={user} />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
