import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface ScorePill { label: string; value: number | string; color: string; }

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  onReset: () => void;
  scores?: ScorePill[];
}

export default function GameShell({ title, emoji, children, onReset, scores }: Props) {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', fontFamily: "'Outfit',sans-serif", padding: 'clamp(12px,3vw,24px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '700px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => nav('/')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 14px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <ArrowLeft size={16} /> Arcade
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
          <h1 style={{ color: '#e2e8f0', fontWeight: 900, fontSize: 'clamp(1rem,3vw,1.3rem)', margin: 0 }}>{title}</h1>
        </div>

        <button onClick={onReset}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          title="New Game"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Score pills */}
      {scores && scores.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {scores.map((s, i) => (
            <motion.div key={i} layout
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}44`, borderRadius: '12px', padding: '8px 16px', textAlign: 'center', minWidth: '70px' }}
            >
              <div style={{ color: s.color, fontWeight: 900, fontSize: '1.3rem' }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Game content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
