import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import './index.css';

import { getSession, logout, User } from './lib/auth';
import AuthScreen from './components/AuthScreen';
import { THEMES } from './lib/themes';
import ArcadeHub from './pages/ArcadeHub';
import GamePage from './pages/GamePage';

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());

  const handleLogout = () => { logout(); setUser(null); };
  const handleAvatarChange = (u: User) => setUser(u);

  // Always require login — no guest mode
  if (!user) {
    return (
      <AuthScreen
        theme={THEMES['night']}
        onAuth={u => setUser(u)}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <ArcadeHub
          theme={THEMES['night']}
          user={user}
          onLogout={handleLogout}
          onAvatarChange={handleAvatarChange}
        />
      } />
      <Route path="/game/:gameId" element={
        <GamePage user={user} />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
