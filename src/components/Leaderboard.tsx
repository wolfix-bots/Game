import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { getLeaderboard, getGlobalLeaderboard } from '../lib/leaderboard';
import { GAMES } from '../lib/arcade';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gameId?: string; // if provided, show game-specific; else global
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ open, onClose, theme: t, gameId }: Props) {
  const [tab, setTab] = useState<'game' | 'global'>(gameId ? 'game' : 'global');

  const gameEntries = gameId ? getLeaderboard(gameId) : [];
  const globalEntries = getGlobalLeaderboard().slice(0, 50);
  const gameTitle = GAMES.find(g => g.id === gameId)?.title || 'Game';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', backdropFilter: 'blur(20px)', boxShadow: t.shadow, maxHeight: '85vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={20} style={{ color: '#fbbf24' }} />
                <h2 style={{ color: t.text, fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Leaderboard</h2>
              </div>
              <button onClick={onClose} style={{ background: t.cellBg, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '6px', cursor: 'pointer', color: t.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            {gameId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: t.cellBg, borderRadius: '12px', padding: '4px', gap: '4px', marginBottom: '16px' }}>
                {([['game', gameTitle], ['global', '🌍 Global']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    style={{ background: tab === key ? t.accent : 'transparent', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: tab === key ? '#fff' : t.textMuted, fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}
                  >{label}</button>
                ))}
              </div>
            )}

            {/* Entries */}
            {(tab === 'game' ? gameEntries : globalEntries).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
                <div style={{ fontWeight: 700 }}>No scores yet!</div>
                <div style={{ fontSize: '0.82rem', marginTop: '6px' }}>Play a game to get on the board</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(tab === 'game' ? gameEntries : globalEntries).map((entry, i) => {
                  const e = tab === 'game' ? entry as any : (entry as any).entry;
                  const gId = tab === 'global' ? (entry as any).gameId : gameId;
                  const game = GAMES.find(g => g.id === gId);
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ background: i === 0 ? `${t.accent}22` : t.cellBg, border: `1px solid ${i === 0 ? t.accent + '44' : t.border}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <div style={{ fontSize: '1.4rem', width: '28px', textAlign: 'center' }}>{MEDAL[i] || `#${i + 1}`}</div>
                      <div style={{ fontSize: '1.4rem' }}>{e.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t.text, fontWeight: 700, fontSize: '0.9rem' }}>{e.username}</div>
                        {tab === 'global' && game && <div style={{ color: t.textMuted, fontSize: '0.72rem' }}>{game.emoji} {game.title}</div>}
                      </div>
                      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.1rem' }}>{e.score.toLocaleString()}</div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
