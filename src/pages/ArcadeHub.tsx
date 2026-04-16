import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Gamepad2, LogOut, Trophy, TrendingUp, User } from 'lucide-react';
import { GAMES, TAGS, GameDef } from '../lib/arcade';
import { ThemeConfig } from '../lib/themes';
import { User as UserType, logout } from '../lib/auth';
import UserMenu from '../components/UserMenu';

interface Props {
  theme: ThemeConfig;
  user: UserType | null;
  onLogout: () => void;
  onAvatarChange: (u: UserType) => void;
}

export default function ArcadeHub({ theme: t, user, onLogout, onAvatarChange }: Props) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const nav = useNavigate();

  const filtered = GAMES.filter(g => {
    const matchTag = activeTag === 'all' || g.tags.includes(activeTag) || (activeTag === 'hot' && g.hot);
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Outfit', sans-serif" }}>
      {/* ── Header ── */}
      <div style={{
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100,
        padding: '0 clamp(16px,4vw,40px)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.span animate={{ rotate: [0,8,-8,0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ fontSize: '1.8rem' }}>🦊</motion.span>
            <div>
              <span style={{ color: t.text, fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Foxy</span>
              <span style={{ color: t.accent, fontWeight: 900, fontSize: '1.2rem' }}>Arcade</span>
            </div>
          </div>
          {/* User */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user ? (
              <UserMenu user={user} theme={t} onLogout={onLogout} onAvatarChange={a => onAvatarChange({ ...user, avatar: a })} />
            ) : (
              <div style={{ background: t.cellBg, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '6px 12px', color: t.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>
                👤 Guest
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px,4vw,32px) clamp(16px,4vw,40px)' }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ color: t.text, fontWeight: 900, fontSize: 'clamp(1.8rem,5vw,3rem)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            {user ? `Welcome back, ${user.avatar} ${user.username}!` : 'Choose Your Game'}
          </h1>
          <p style={{ color: t.textMuted, fontSize: 'clamp(0.9rem,2vw,1.1rem)', margin: 0 }}>
            {GAMES.length} games · Single player, local & online multiplayer
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ position: 'relative', maxWidth: '480px', margin: '0 auto 24px' }}
        >
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search games…"
            style={{
              width: '100%', background: t.surface, border: `2px solid ${t.border}`,
              borderRadius: '14px', padding: '12px 14px 12px 42px',
              color: t.text, fontSize: '0.95rem', outline: 'none',
              transition: 'border-color 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = t.accent)}
            onBlur={e => (e.target.style.borderColor = t.border)}
          />
        </motion.div>

        {/* Tag filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}
        >
          {TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              style={{
                background: activeTag === tag ? t.accent : t.surface,
                border: `1px solid ${activeTag === tag ? t.accent : t.border}`,
                borderRadius: '20px', padding: '6px 16px',
                cursor: 'pointer', color: activeTag === tag ? '#fff' : t.textMuted,
                fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize',
                transition: 'all 0.2s', backdropFilter: 'blur(8px)',
              }}
            >{tag === 'hot' ? '🔥 Hot' : tag === 'all' ? '🎮 All' : tag}</button>
          ))}
        </motion.div>

        {/* Game grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px,22vw,220px), 1fr))',
          gap: 'clamp(10px,2vw,18px)',
        }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((game, i) => (
              <GameCard key={game.id} game={game} theme={t} index={i} onClick={() => nav(`/game/${game.id}`)} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textMuted }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: 700 }}>No games found for "{search}"</div>
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, theme: t, index, onClick }: { game: GameDef; theme: ThemeConfig; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${game.color}18` : t.surface,
        border: `2px solid ${hovered ? game.color : t.border}`,
        borderRadius: '20px', padding: '20px',
        cursor: 'pointer', transition: 'all 0.2s',
        backdropFilter: 'blur(12px)',
        boxShadow: hovered ? `0 8px 32px ${game.color}33` : t.shadow,
        transform: hovered ? 'translateY(-4px)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Badges */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
        {game.hot && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '8px', padding: '2px 7px', fontSize: '0.6rem', fontWeight: 800 }}>🔥 HOT</span>}
        {game.isNew && <span style={{ background: game.color, color: '#fff', borderRadius: '8px', padding: '2px 7px', fontSize: '0.6rem', fontWeight: 800 }}>NEW</span>}
      </div>

      {/* Emoji */}
      <motion.div
        animate={{ scale: hovered ? 1.15 : 1, rotate: hovered ? [0, -5, 5, 0] : 0 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 'clamp(2rem,5vw,2.8rem)', marginBottom: '10px', display: 'block' }}
      >{game.emoji}</motion.div>

      {/* Info */}
      <div style={{ color: t.text, fontWeight: 800, fontSize: 'clamp(0.88rem,2vw,1rem)', marginBottom: '4px' }}>{game.title}</div>
      <div style={{ color: t.textMuted, fontSize: '0.75rem', marginBottom: '10px', lineHeight: 1.4 }}>{game.description}</div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ background: `${game.color}22`, color: game.color, borderRadius: '8px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
          👥 {game.players}
        </span>
        <motion.div animate={{ x: hovered ? 4 : 0 }} style={{ color: game.color, fontSize: '1rem' }}>→</motion.div>
      </div>
    </motion.div>
  );
}
