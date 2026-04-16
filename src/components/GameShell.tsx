import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface ScorePill { label: string; value: string|number; color: string; }

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  onReset?: () => void;
  scores?: ScorePill[];
}

export default function GameShell({ title, emoji, children, onReset, scores }: Props) {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid #1e293b',
        backdropFilter: 'blur(12px)', padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px' }}>
          <button onClick={() => nav('/')}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}
          >
            <ArrowLeft size={15} /> Games
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem' }}>{title}</span>
          </div>

          {onReset ? (
            <button onClick={onReset}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '7px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
            >
              <RotateCcw size={16} />
            </button>
          ) : <div style={{ width: 40 }} />}
        </div>
      </div>

      {/* Score pills */}
      {scores && scores.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', padding: '10px 16px 0', flexWrap: 'wrap' }}>
          {scores.map((s, i) => (
            <motion.div key={i} layout
              style={{
                background: `${s.color}18`, border: `1px solid ${s.color}44`,
                borderRadius: '20px', padding: '4px 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>{s.label}</span>
              <motion.span key={String(s.value)} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                style={{ color: s.color, fontWeight: 800, fontSize: '1rem' }}
              >{s.value}</motion.span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Game content */}
      <div style={{ flex: 1, padding: '16px', maxWidth: '700px', margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
