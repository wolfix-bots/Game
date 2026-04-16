import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const COLORS = ['#ef4444','#22c55e','#3b82f6','#f59e0b'];
const LABELS = ['🔴','🟢','🔵','🟡'];
const FREQS  = [261,329,392,523];

function beep(freq: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function Simon() {
  const [seq, setSeq]     = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle'|'showing'|'input'|'over'>('idle');
  const [active, setActive] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest]   = useState(() => Number(localStorage.getItem('simon-best') || 0));
  const [speed, setSpeed] = useState<'normal'|'fast'>('normal');

  const interval = speed === 'fast' ? 350 : 650;

  const showSeq = async (s: number[]) => {
    setPhase('showing'); setInput([]);
    await delay(500);
    for (const idx of s) {
      setActive(idx); beep(FREQS[idx]);
      await delay(interval);
      setActive(null);
      await delay(180);
    }
    setPhase('input');
  };

  const start = () => {
    const first = Math.floor(Math.random() * 4);
    const s = [first]; setSeq(s); setScore(0);
    showSeq(s);
  };

  const press = async (i: number) => {
    if (phase !== 'input') return;
    setActive(i); beep(FREQS[i]);
    setTimeout(() => setActive(null), 200);
    const ni = [...input, i]; setInput(ni);
    const idx = ni.length - 1;
    if (ni[idx] !== seq[idx]) {
      setPhase('over');
      const ns = score;
      if (ns > best) { setBest(ns); localStorage.setItem('simon-best', String(ns)); }
      return;
    }
    if (ni.length === seq.length) {
      const ns = score + 1; setScore(ns);
      const next = [...seq, Math.floor(Math.random() * 4)]; setSeq(next);
      await delay(700);
      showSeq(next);
    }
  };

  const reset = () => { setSeq([]); setInput([]); setPhase('idle'); setScore(0); setActive(null); };

  return (
    <GameShell title="Simon Says" emoji="🔴" onReset={reset} scores={[
      { label: 'Round', value: score, color: '#f472b6' },
      { label: 'Best',  value: best,  color: '#fbbf24' },
    ]}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {(['normal','fast'] as const).map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            style={{ padding: '5px 14px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize', borderColor: speed===s?'#f472b6':'#334155', background: speed===s?'#f472b622':'transparent', color: speed===s?'#f472b6':'#94a3b8' }}
          >{s}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', maxWidth: '260px' }}>
        {COLORS.map((color, i) => (
          <motion.button key={i} onClick={() => press(i)}
            animate={{ scale: active===i ? 1.12 : 1, opacity: active===i ? 1 : phase==='showing' ? 0.35 : 1, boxShadow: active===i ? `0 0 32px ${color}` : 'none' }}
            transition={{ duration: 0.1 }}
            style={{ height: 110, borderRadius: '22px', border: `3px solid ${color}44`, background: active===i ? color : `${color}28`, cursor: phase==='input' ? 'pointer' : 'default', fontSize: '2.2rem', fontFamily: 'Outfit,sans-serif' }}
          >{LABELS[i]}</motion.button>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        {phase === 'idle' && <button onClick={start} style={{ background: '#f472b6', border: 'none', borderRadius: '14px', padding: '12px 32px', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Start</button>}
        {phase === 'showing' && <div style={{ color: '#f472b6', fontWeight: 700 }}>Watch the sequence…</div>}
        {phase === 'input'   && <div style={{ color: '#22c55e', fontWeight: 700 }}>Your turn! ({input.length}/{seq.length})</div>}
        {phase === 'over'    && (
          <div>
            <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.1rem', marginBottom: '12px' }}>❌ Wrong! Score: {score}</div>
            <button onClick={start} style={{ background: '#f472b6', border: 'none', borderRadius: '12px', padding: '10px 24px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>Try Again</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
