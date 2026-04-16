import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, Gamepad2, Loader2 } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { getGameLeaderboard, getXPLeaderboard, LeaderboardEntry } from '../lib/leaderboard';
import { GAMES } from '../lib/arcade';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gameId?: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ open, onClose, theme: t, gameId }: Props) {
  const [tab, setTab] = useState<'game' | 'xp'>(gameId ? 'game' : 'xp');
  const [gameEntries, setGameEntries] = useState<LeaderboardEntry[]>([]);
  const [xpEntries, setXpEntries] = useState<{ rank:number; userId:string; username:string; avatar:string; xp:number; level:number; gamesWon:number }[]>([]);
  const [loading, setLoading] = useState(false);
  const gameTitle = GAMES.find(g => g.id === gameId)?.title || 'Game';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const load = async () => {
      if (tab === 'game' && gameId) {
        const data = await getGameLeaderboard(gameId);
        setGameEntries(data);
      } else {
        const data = await getXPLeaderboard();
        setXpEntries(data);
      }
      setLoading(false);
    };
    load();
  }, [open, tab, gameId]);

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
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '440px', backdropFilter: 'blur(20px)', boxShadow: t.shadow, maxHeight: '85vh', overflowY: 'auto' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: gameId ? '1fr 1fr' : '1fr', background: t.cellBg, borderRadius: '12px', padding: '4px', gap: '4px', marginBottom: '18px' }}>
              {gameId && (
                <button onClick={() => setTab('game')}
                  style={{ background: tab === 'game' ? t.accent : 'transparent', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: tab === 'game' ? '#fff' : t.textMuted, fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Gamepad2 size={14} /> {gameTitle}
                </button>
              )}
              <button onClick={() => setTab('xp')}
                style={{ background: tab === 'xp' ? t.accent : 'transparent', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: tab === 'xp' ? '#fff' : t.textMuted, fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Zap size={14} /> XP Rankings
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                Loading…
              </div>
            ) : tab === 'game' && gameId ? (
              gameEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏆</div>
                  <div style={{ fontWeight: 700 }}>No scores yet</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Be the first to set a record!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {gameEntries.map((entry, i) => (
                    <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ background: i < 3 ? `${['#fbbf24','#94a3b8','#fb923c'][i]}18` : t.cellBg, border: `1px solid ${i < 3 ? ['#fbbf24','#94a3b8','#fb923c'][i] + '44' : t.border}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <span style={{ fontSize: '1.3rem', minWidth: '28px', textAlign: 'center' }}>{MEDAL[i] || `#${i + 1}`}</span>
                      <span style={{ fontSize: '1.5rem' }}>{entry.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t.text, fontWeight: 700, fontSize: '0.9rem' }}>{entry.username}</div>
                        <div style={{ color: t.textMuted, fontSize: '0.72rem' }}>{new Date(entry.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.1rem' }}>{entry.score.toLocaleString()}</div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              xpEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontWeight: 700 }}>No players yet</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Play games to earn XP!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {xpEntries.map((entry, i) => (
                    <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ background: i < 3 ? `${['#fbbf24','#94a3b8','#fb923c'][i]}18` : t.cellBg, border: `1px solid ${i < 3 ? ['#fbbf24','#94a3b8','#fb923c'][i] + '44' : t.border}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <span style={{ fontSize: '1.3rem', minWidth: '28px', textAlign: 'center' }}>{MEDAL[i] || `#${i + 1}`}</span>
                      <span style={{ fontSize: '1.5rem' }}>{entry.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t.text, fontWeight: 700, fontSize: '0.9rem' }}>{entry.username}</div>
                        <div style={{ color: t.textMuted, fontSize: '0.72rem' }}>Level {entry.level} · {entry.gamesWon} wins</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.accent, fontWeight: 900, fontSize: '1rem' }}>
                        <Zap size={14} />{entry.xp.toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
