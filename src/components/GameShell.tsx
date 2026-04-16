import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import Leaderboard from './Leaderboard';
import { THEMES } from '../lib/themes';

interface ScorePill { label: string; value: string | number; color: string; }

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  onReset?: () => void;
  scores?: ScorePill[];
  gameId?: string;
}

const t = THEMES['night'];

export default function GameShell({ title, emoji, children, onReset, scores, gameId }: Props) {
  const nav = useNavigate();
  const [lbOpen, setLbOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.1)', padding: '12px clamp(12px,4vw,24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => nav('/')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          ><ArrowLeft size={18} /></button>
          <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
          <h1 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 'clamp(0.9rem,3vw,1.15rem)', margin: 0 }}>{title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {scores?.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px 10px', textAlign: 'center', minWidth: '44px' }}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#475569', fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
          {gameId && (
            <button onClick={() => setLbOpen(true)}
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#fbbf24', display: 'flex', transition: 'all 0.2s' }}
              title="Leaderboard"
            ><Trophy size={16} /></button>
          )}
          {onReset && (
            <button onClick={onReset}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              title="Reset"
            ><RotateCcw size={16} /></button>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ flex: 1, padding: 'clamp(16px,4vw,28px) clamp(12px,4vw,24px)', overflowY: 'auto' }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {children}
        </div>
      </motion.div>

      {gameId && <Leaderboard open={lbOpen} onClose={() => setLbOpen(false)} theme={t} gameId={gameId} />}
    </div>
  );
}
