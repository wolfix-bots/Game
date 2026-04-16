import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface ScoreStat {
  label: string;
  value: number | string;
  color: string;
}

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  onReset: () => void;
  scores?: ScoreStat[];
}

export default function GameShell({ title, emoji, children, onReset, scores }: Props) {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(12px, 3vw, 24px)',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: '600px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <button onClick={() => nav('/')}
          style={{
            background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
            borderRadius: '12px', padding: '8px 14px', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px',
            fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Outfit,sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ArrowLeft size={16} /> Arcade
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
          <h1 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 'clamp(1rem,4vw,1.3rem)', margin: 0 }}>{title}</h1>
        </div>

        <button onClick={onReset}
          style={{
            background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
            borderRadius: '12px', padding: '8px', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Score bar */}
      {scores && scores.length > 0 && (
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '16px',
          background: 'rgba(15,23,42,0.6)', borderRadius: '14px',
          padding: '10px 20px', border: '1px solid #1e293b',
        }}>
          {scores.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '50px' }}>
              <motion.div key={String(s.value)} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                style={{ color: s.color, fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}
              >{s.value}</motion.div>
              <div style={{ color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Game content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: '600px' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
