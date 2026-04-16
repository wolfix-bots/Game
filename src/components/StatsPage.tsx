import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { getStats } from '../lib/achievements';
import { getAllScores } from '../lib/storage';

interface Props { open: boolean; onClose: () => void; theme: ThemeConfig; }

export default function StatsPage({ open, onClose, theme }: Props) {
  const stats = getStats();
  const allScores = getAllScores();
  const winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
  const circumference = 2 * Math.PI * 50;

  const modeLabels: Record<string, string> = {
    local: 'Local', 'ai-easy': 'AI Easy', 'ai-medium': 'AI Medium', 'ai-hard': 'AI Hard', online: 'Online',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px',
              backdropFilter: 'blur(20px)', boxShadow: theme.shadow,
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} style={{ color: theme.accent }} />
                <h2 style={{ color: theme.text, fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Stats</h2>
              </div>
              <button onClick={onClose} style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Win rate ring */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg width="130" height="130" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke={theme.border} strokeWidth="10" />
                  <motion.circle cx="60" cy="60" r="50" fill="none"
                    stroke={theme.accent} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - winRate / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ color: theme.text, fontWeight: 900, fontSize: '1.8rem' }}>{winRate}%</div>
                  <div style={{ color: theme.textMuted, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Win Rate</div>
                </div>
              </div>
            </div>

            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {[
                { label: 'Total Games', value: stats.totalGames, emoji: '🎮', color: theme.text },
                { label: 'Best Streak', value: stats.bestStreak, emoji: '🔥', color: '#f97316' },
                { label: 'Cur. Streak', value: stats.currentStreak, emoji: '⚡', color: theme.accent },
              ].map(s => (
                <div key={s.label} style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{s.emoji}</div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                    style={{ color: s.color, fontWeight: 900, fontSize: '1.5rem' }}>{s.value}</motion.div>
                  <div style={{ color: theme.textMuted, fontSize: '0.65rem', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per-mode breakdown */}
            <div style={{ color: theme.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>By Mode</div>
            {Object.entries(allScores).map(([mode, s]) => {
              const total = s.wins + s.losses + s.draws;
              if (!total) return null;
              const pct = Math.round((s.wins / total) * 100);
              return (
                <div key={mode} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: theme.text, fontSize: '0.82rem', fontWeight: 600 }}>{modeLabels[mode]}</span>
                    <span style={{ color: theme.textMuted, fontSize: '0.75rem' }}>{s.wins}W · {s.losses}L · {s.draws}D</span>
                  </div>
                  <div style={{ background: theme.cellBg, borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: theme.accent, borderRadius: '6px' }} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
