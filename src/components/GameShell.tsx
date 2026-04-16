import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Home } from 'lucide-react';

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
      background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
      fontFamily: "'Outfit',sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid #1e293b',
        backdropFilter: 'blur(12px)', padding: '0 clamp(12px,3vw,24px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => nav('/')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}
            ><Home size={14}/> Arcade</button>
            <div style={{ color: '#475569' }}>/</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 'clamp(0.85rem,3vw,1rem)' }}>{title}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {scores?.map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '4px 10px', textAlign: 'center' }}>
                <div style={{ color: s.color, fontWeight: 800, fontSize: 'clamp(0.85rem,3vw,1rem)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ color: '#475569', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
            {onReset && (
              <button onClick={onReset}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                title="New Game"
              ><RotateCcw size={15}/></button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,3vw,24px) clamp(12px,3vw,24px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: 640, margin: '0 auto' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
