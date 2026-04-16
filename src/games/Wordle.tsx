import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const WORDS = ['CRANE','SLATE','AUDIO','STARE','AROSE','LEAST','TRACE','CRATE','IRATE','SNARE','ADORE','SCORE','STORE','SHORE','SHARE','SPARE','GLARE','FLARE','BLARE','PLACE','GRACE','BRACE','SPACE','PRICE','PRIZE','GRAZE','PHASE','CHASE','SHADE','SHAME','SHAPE','SHAKE','SHALE','SHAVE','BRAVE','CRAVE','GRAVE','PRANK','PLANK','BLANK','CLANK','FRANK','THANK','CLAMP','TRAMP','STAMP','CRAMP','CHAMP','CLANG','SLANG','BLAND','BRAND','GRAND','STAND','PLANT','GRANT','RANT'];
const VALID = new Set(WORDS);

function getTodaysWord() {
  return WORDS[Math.floor(Date.now() / 86400000) % WORDS.length];
}

const COLORS: Record<string, string> = { correct: '#22c55e', present: '#f59e0b', absent: '#334155', empty: '#1e293b' };

export default function Wordle() {
  const [target] = useState(getTodaysWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [usedKeys, setUsedKeys] = useState<Record<string,string>>({});

  const showMsg = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 2000); };

  const submit = () => {
    if (current.length !== 5) { setShake(true); setTimeout(() => setShake(false), 500); showMsg('5 letters!'); return; }
    if (guesses.length >= 6) return;
    const g = current.toUpperCase();
    const newGuesses = [...guesses, g];
    setGuesses(newGuesses);
    setCurrent('');
    // Update used keys
    const newKeys = { ...usedKeys };
    g.split('').forEach((ch, i) => {
      const status = ch === target[i] ? 'correct' : target.includes(ch) ? 'present' : 'absent';
      if (!newKeys[ch] || newKeys[ch] === 'absent' || (newKeys[ch] === 'present' && status === 'correct')) newKeys[ch] = status;
    });
    setUsedKeys(newKeys);
    if (g === target) { setWon(true); setGameOver(true); showMsg('🎉 Brilliant!'); }
    else if (newGuesses.length === 6) { setGameOver(true); showMsg(`The word was ${target}`); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') setCurrent(c => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && current.length < 5) setCurrent(c => c + e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, gameOver, guesses]);

  const getColors = (guess: string): string[] => guess.split('').map((ch: string, i: number) => {
    if (ch === target[i]) return 'correct';
    if (target.includes(ch)) return 'present';
    return 'absent';
  });

  const rows = [...guesses, ...(guesses.length < 6 && !gameOver ? [current.padEnd(5)] : []), ...Array(Math.max(0, 6 - guesses.length - (gameOver ? 0 : 1))).fill('     ')].slice(0,6);

  const keyboard = ['QWERTYUIOP', 'ASDFGHJKL', 'ENTERZ XCVBNM⌫'];

  return (
    <GameShell title="Wordle" emoji="🟩" onReset={() => { setGuesses([]); setCurrent(''); setGameOver(false); setWon(false); setUsedKeys({}); }}>
      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', marginBottom: '12px', background: '#1e293b', borderRadius: '10px', padding: '8px 16px', color: '#e2e8f0', fontWeight: 700 }}
          >{message}</motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
        {rows.map((row, ri) => {
          const isGuessed = ri < guesses.length;
          const colors = isGuessed ? getColors(row) : null;
          const isCurrent = ri === guesses.length && !gameOver;
          return (
            <motion.div key={ri} animate={isCurrent && shake ? { x: [-6,6,-6,6,0] } : {}} transition={{ duration: 0.3 }}
              style={{ display: 'flex', gap: '6px' }}
            >
              {row.split('').map((ch: string, ci: number) => (
                <motion.div key={ci}
                  initial={isGuessed ? { rotateX: 0 } : {}}
                  animate={isGuessed ? { rotateX: [0, -90, 0] } : {}}
                  transition={{ delay: ci * 0.1, duration: 0.4 }}
                  style={{
                    width: 52, height: 52, border: `2px solid ${isGuessed ? COLORS[colors![ci]] : ch.trim() ? '#94a3b8' : '#334155'}`,
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.4rem', color: '#e2e8f0',
                    background: isGuessed ? COLORS[colors![ci]] : '#1e293b',
                  }}
                >{ch.trim()}</motion.div>
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
        {keyboard.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '5px' }}>
            {row.split('').map((key, ki) => {
              if (key === ' ') return <div key={ki} style={{ width: 8 }} />;
              const status = usedKeys[key];
              const isWide = key === 'ENTER' || key === '⌫';
              return (
                <button key={ki}
                  onClick={() => { if (gameOver) return; if (key === '⌫') setCurrent(c => c.slice(0,-1)); else if (key === 'ENTER') submit(); else if (current.length < 5) setCurrent(c => c + key); }}
                  style={{
                    width: isWide ? 56 : 34, height: 42, borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: status ? COLORS[status] : '#334155', color: '#e2e8f0',
                    fontWeight: 700, fontSize: isWide ? '0.65rem' : '0.9rem', fontFamily: 'Outfit,sans-serif',
                  }}
                >{key}</button>
              );
            })}
          </div>
        ))}
      </div>
    </GameShell>
  );
}
