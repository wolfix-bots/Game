import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import './index.css';

// Auth
import { getSession, logout, User } from './lib/auth';
import AuthScreen from './components/AuthScreen';
import { THEMES } from './lib/themes';

// Pages
import ArcadeHub from './pages/ArcadeHub';
import GamePage from './pages/GamePage';

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [isGuest, setIsGuest] = useState(false);

  const handleLogout = () => { logout(); setUser(null); setIsGuest(false); };
  const handleAvatarChange = (u: User) => setUser(u);

  if (!user && !isGuest) {
    return (
      <AuthScreen
        theme={THEMES['night']}
        onAuth={u => setUser(u)}
        onGuest={() => setIsGuest(true)}
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
