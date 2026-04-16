import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import Leaderboard from './Leaderboard';
import { THEMES } from '../lib/themes';

interface ScorePill { label: string; value: string | number; color: string; }

interface Props {
  title:    string;
  emoji:    string;
  gameId?:  string;
  children: React.ReactNode;
  onReset?: () => void;
  scores?:  ScorePill[];
  xpEarned?: number;
  levelUp?:  boolean;
}

export default function GameShell({ title, emoji, gameId, children, onReset, scores, xpEarned, levelUp }: Props) {
  const nav = useNavigate();
  const [lbOpen, setLbOpen] = useState(false);
  const t = THEMES['night'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid #1e293b',
        backdropFilter: 'blur(12px)', padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px' }}>
          <button onClick={() => nav('/')}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}
          >
            <ArrowLeft size={15} /> Games
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem' }}>{title}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {gameId && (
              <button onClick={() => setLbOpen(true)}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '7px', cursor: 'pointer', color: '#fbbf24', display: 'flex' }}
                title="Leaderboard"
              >
                <Trophy size={16} />
              </button>
            )}
            {onReset && (
              <button onClick={onReset}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '7px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <RotateCcw size={16} />
              </button>
            )}
            {!onReset && !gameId && <div style={{ width: 36 }} />}
          </div>
        </div>
      </div>

      {/* Score pills */}
      {scores && scores.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', padding: '10px 16px 0', flexWrap: 'wrap' }}>
          {scores.map((s, i) => (
            <motion.div key={i} layout
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}44`, borderRadius: '20px', padding: '4px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>{s.label}</span>
              <motion.span key={String(s.value)} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                style={{ color: s.color, fontWeight: 800, fontSize: '1rem' }}
              >{s.value}</motion.span>
            </motion.div>
          ))}
        </div>
      )}

      {/* XP earned toast */}
      <AnimatePresence>
        {xpEarned && xpEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ textAlign: 'center', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Zap size={14} style={{ color: '#fbbf24' }} />
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>+{xpEarned} XP earned!</span>
            {levelUp && <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.85rem' }}>🎉 Level Up!</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game content */}
      <div style={{ flex: 1, padding: '16px', maxWidth: '700px', margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </div>

      {gameId && <Leaderboard open={lbOpen} onClose={() => setLbOpen(false)} theme={t} gameId={gameId} />}
    </div>
  );
}
