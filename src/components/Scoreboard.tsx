import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { ScoreData, ScoreMode, resetScores } from '../lib/storage';

interface ScoreboardProps {
  mode: ScoreMode;
  scores: ScoreData;
  onReset: () => void;
  theme: ThemeConfig;
  playerX?: string;
  playerO?: string;
}

export default function Scoreboard({ mode, scores, onReset, theme, playerX = 'Player X', playerO = 'Player O' }: ScoreboardProps) {
  const modeLabel: Record<ScoreMode, string> = {
    local: 'Local Multiplayer',
    'ai-easy': 'vs AI (Easy)',
    'ai-medium': 'vs AI (Medium)',
    'ai-hard': 'vs AI (Hard)',
    online: 'Online',
  };

  const stats = [
    { label: 'Wins', value: scores.wins, color: '#22c55e', emoji: '🏆' },
    { label: 'Draws', value: scores.draws, color: '#f59e0b', emoji: '🤝' },
    { label: 'Losses', value: scores.losses, color: '#ef4444', emoji: '💔' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '20px',
        padding: '16px 20px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: theme.shadow,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} style={{ color: theme.accent }} />
          <span style={{ color: theme.textMuted, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {modeLabel[mode]}
          </span>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '4px 8px',
            cursor: 'pointer',
            color: theme.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = theme.border)}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              background: theme.cellBg,
              borderRadius: '12px',
              padding: '10px 6px',
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{stat.emoji}</div>
            <motion.div
              key={stat.value}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}
            >
              {stat.value}
            </motion.div>
            <div style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
