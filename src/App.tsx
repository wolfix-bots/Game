import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import './index.css';

import AuthScreen from './components/AuthScreen';
import ArcadeHub   from './pages/ArcadeHub';
import GamePage    from './pages/GamePage';

import { THEMES } from './lib/themes';
import { getSession, logout, User } from './lib/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [isGuest, setIsGuest] = useState(false);

  const theme = THEMES['night'];

  if (!user && !isGuest) {
    return (
      <AuthScreen
        theme={theme as any}
        onAuth={(u: User) => setUser(u)}
        onGuest={() => setIsGuest(true)}
      />
    );
  }

  const handleLogout = () => { logout(); setUser(null); setIsGuest(false); };
  const handleAvatarChange = (u: User) => setUser(u);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ArcadeHub
            theme={theme as any}
            user={user}
            onLogout={handleLogout}
            onAvatarChange={handleAvatarChange}
          />
        }
      />
      <Route
        path="/game/:id"
        element={
          <GamePage
            user={user}
            onLogout={handleLogout}
            onAvatarChange={handleAvatarChange}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
