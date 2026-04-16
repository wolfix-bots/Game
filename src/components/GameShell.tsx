import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Star } from 'lucide-react';
import { useApp } from '../App';
import { addXP, xpToLevel, XP } from '../lib/profile';

interface ScorePill { label: string; value: string | number; color: string; }

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  onReset?: () => void;
  scores?: ScorePill[];
  gameId?: string;
}

// Global XP toast setter — set by the mounted GameShell
let _setXPToast: ((v: { amount: number; reason: string } | null) => void) | null = null;

export function awardGameXP(
  gameId: string,
  userId: string,
  user: any,
  result: 'win' | 'loss' | 'draw',
  score?: number
) {
  const amount = result === 'win' ? XP.win : result === 'draw' ? XP.draw : XP.loss;
  addXP(userId, user, amount + XP.playGame, gameId, result, score);
  if (_setXPToast) {
    _setXPToast({
      amount: amount + XP.playGame,
      reason: result === 'win' ? 'Victory!' : result === 'draw' ? 'Draw!' : 'Good effort!',
    });
    setTimeout(() => _setXPToast?.(null), 3000);
  }
}

export default function GameShell({ title, emoji, children, onReset, scores, gameId }: Props) {
  const nav = useNavigate();
  const { profile } = useApp();
  const [xpToast, setXPToast] = useState<{ amount: number; reason: string } | null>(null);
  _setXPToast = setXPToast;

  const level = xpToLevel(profile.xp);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', fontFamily: "'Outfit',sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148,163,184,0.1)',
        padding: '10px clamp(12px,4vw,24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => nav('/')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
          <h1 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 'clamp(0.85rem,3vw,1.1rem)', margin: 0 }}>{title}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Level pill */}
          <div style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '10px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={12} style={{ color: '#818cf8' }} />
            <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.78rem' }}>Lv.{level}</span>
          </div>

          {scores?.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', minWidth: '44px' }}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#475569', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}

          {onReset && (
            <button
              onClick={onReset}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 'clamp(12px,3vw,24px)', overflowY: 'auto' }}>
        {children}
      </div>

      {/* XP Toast */}
      <AnimatePresence>
        {xpToast && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(10,10,10,0.96)', border: '2px solid #818cf8',
              borderRadius: '18px', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: '12px',
              zIndex: 9999, backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 24px rgba(129,140,248,0.4)',
              minWidth: '200px',
            }}
          >
            <motion.span
              animate={{ rotate: [0,-15,15,0], scale: [1,1.4,1] }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: '1.8rem', flexShrink: 0 }}
            >⭐</motion.span>
            <div>
              <div style={{ color: '#818cf8', fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>XP Earned!</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>+{xpToast.amount} XP</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{xpToast.reason}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
