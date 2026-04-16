import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { getAchievements, getStats } from '../lib/achievements';

interface Props { open: boolean; onClose: () => void; theme: ThemeConfig; }

export default function AchievementsPanel({ open, onClose, theme }: Props) {
  const achievements = getAchievements();
  const stats = getStats();
  const unlocked = achievements.filter(a => a.unlocked).length;

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
                <Trophy size={20} style={{ color: theme.accent }} />
                <h2 style={{ color: theme.text, fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Achievements</h2>
                <span style={{ background: `${theme.accent}33`, color: theme.accent, borderRadius: '20px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {unlocked}/{achievements.length}
                </span>
              </div>
              <button onClick={onClose} style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {[
                { label: 'Games', value: stats.totalGames, emoji: '🎮' },
                { label: 'Wins', value: stats.totalWins, emoji: '🏆' },
                { label: 'Best Streak', value: stats.bestStreak, emoji: '🔥' },
                { label: 'Draws', value: stats.totalDraws, emoji: '🤝' },
              ].map(s => (
                <div key={s.label} style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem' }}>{s.emoji}</div>
                  <div style={{ color: theme.text, fontWeight: 800, fontSize: '1.1rem' }}>{s.value}</div>
                  <div style={{ color: theme.textMuted, fontSize: '0.62rem', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {achievements.map((a, i) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  style={{
                    background: a.unlocked ? `${theme.accent}18` : theme.cellBg,
                    border: `1px solid ${a.unlocked ? theme.accent + '44' : theme.border}`,
                    borderRadius: '14px', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    opacity: a.unlocked ? 1 : 0.45,
                  }}
                >
                  <span style={{ fontSize: '1.6rem', filter: a.unlocked ? 'none' : 'grayscale(1)' }}>
                    {a.unlocked ? a.emoji : '🔒'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: a.unlocked ? theme.text : theme.textMuted, fontWeight: 700, fontSize: '0.88rem' }}>{a.title}</div>
                    <div style={{ color: theme.textMuted, fontSize: '0.74rem' }}>{a.desc}</div>
                  </div>
                  {a.unlocked && <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
