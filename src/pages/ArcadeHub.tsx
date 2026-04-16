import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, TrendingUp, User } from 'lucide-react';
import { GAMES, TAGS, GameDef } from '../lib/arcade';
import { useApp } from '../App';
import { xpToLevel, xpProgress } from '../lib/profile';
import UserMenu from '../components/UserMenu';

export default function ArcadeHub() {
  const { user, profile, handleLogout, updateUser } = useApp();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const nav = useNavigate();

  const filtered = GAMES.filter(g => {
    const matchTag = activeTag === 'all' || g.tags.includes(activeTag) || (activeTag === 'hot' && g.hot);
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const level = xpToLevel(profile.xp);
  const progress = xpProgress(profile.xp);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(148,163,184,0.1)', padding: '0 clamp(16px,4vw,40px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.span animate={{ rotate: [0,8,-8,0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ fontSize: '1.8rem' }}>🦊</motion.span>
            <div>
              <span style={{ color: '#e2e8f0', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Foxy</span>
              <span style={{ color: '#818cf8', fontWeight: 900, fontSize: '1.2rem' }}>Arcade</span>
            </div>
          </div>

          {/* Nav + User */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => nav('/leaderboard')}
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Outfit',sans-serif" }}
            ><Trophy size={15} /> Ranks</button>
            <button onClick={() => nav('/profile')}
              style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Outfit',sans-serif" }}
            >
              <span style={{ fontSize: '1rem' }}>{user.avatar}</span>
              <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</span>
            </button>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Lv.{level}</span>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#818cf8,#a78bfa)', borderRadius: '4px' }}
              />
            </div>
            <span style={{ color: '#475569', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{profile.xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px,4vw,32px) clamp(16px,4vw,40px)' }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ color: '#e2e8f0', fontWeight: 900, fontSize: 'clamp(1.6rem,5vw,2.8rem)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            Welcome back, {user.avatar} <span style={{ color: '#818cf8' }}>{user.username}</span>!
          </h1>
          <p style={{ color: '#64748b', fontSize: 'clamp(0.85rem,2vw,1rem)', margin: 0 }}>
            {GAMES.length} games · Earn XP · Climb the leaderboard
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ position: 'relative', maxWidth: '480px', margin: '0 auto 20px' }}
        >
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games…"
            style={{ width: '100%', background: 'rgba(30,41,59,0.8)', border: '2px solid rgba(148,163,184,0.1)', borderRadius: '14px', padding: '12px 14px 12px 42px', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#818cf8')}
            onBlur={e => (e.target.style.borderColor = 'rgba(148,163,184,0.1)')}
          />
        </motion.div>

        {/* Tags */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}
        >
          {TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              style={{ background: activeTag === tag ? '#818cf8' : 'rgba(30,41,59,0.8)', border: `1px solid ${activeTag === tag ? '#818cf8' : 'rgba(148,163,184,0.1)'}`, borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', color: activeTag === tag ? '#fff' : '#64748b', fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif" }}
            >{tag === 'hot' ? '🔥 Hot' : tag === 'all' ? '🎮 All' : tag}</button>
          ))}
        </motion.div>

        {/* Game grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(clamp(150px,20vw,210px),1fr))', gap: 'clamp(10px,2vw,16px)' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((game, i) => (
              <GameCard key={game.id} game={game} index={i}
                played={profile.gameStats[game.id]?.played || 0}
                won={profile.gameStats[game.id]?.won || 0}
                onClick={() => nav(`/game/${game.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: 700 }}>No games found for "{search}"</div>
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, index, played, won, onClick }: { game: GameDef; index: number; played: number; won: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div layout
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? `${game.color}18` : 'rgba(30,41,59,0.8)', border: `2px solid ${hovered ? game.color : 'rgba(148,163,184,0.1)'}`, borderRadius: '20px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(12px)', boxShadow: hovered ? `0 8px 32px ${game.color}33` : 'none', transform: hovered ? 'translateY(-4px)' : 'none', position: 'relative', overflow: 'hidden' }}
    >
      {/* Badges */}
      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '3px' }}>
        {game.hot && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '6px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 800 }}>🔥HOT</span>}
        {game.isNew && <span style={{ background: game.color, color: '#fff', borderRadius: '6px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 800 }}>NEW</span>}
        {played > 0 && <span style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '6px', padding: '1px 6px', fontSize: '0.55rem', fontWeight: 800 }}>✓{won}W</span>}
      </div>

      <motion.div animate={{ scale: hovered ? 1.15 : 1 }} transition={{ duration: 0.2 }}
        style={{ fontSize: 'clamp(2rem,5vw,2.6rem)', marginBottom: '8px', display: 'block' }}
      >{game.emoji}</motion.div>

      <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 'clamp(0.82rem,2vw,0.95rem)', marginBottom: '4px' }}>{game.title}</div>
      <div style={{ color: '#475569', fontSize: '0.72rem', marginBottom: '10px', lineHeight: 1.4 }}>{game.description}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ background: `${game.color}22`, color: game.color, borderRadius: '6px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 700 }}>👥 {game.players}</span>
        <motion.span animate={{ x: hovered ? 3 : 0 }} style={{ color: game.color, fontSize: '0.9rem' }}>→</motion.span>
      </div>
    </motion.div>
  );
}
