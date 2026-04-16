import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 4;

function makeGoal(): number[] {
  return [...Array(SIZE * SIZE - 1).keys()].map(i => i + 1).concat(0);
}

function shuffle(tiles: number[]): number[] {
  const t = [...tiles];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  // Ensure solvable
  const inversions = t.filter(v => v !== 0).reduce((acc, v, i, arr) => {
    return acc + arr.slice(i + 1).filter(u => u !== 0 && u < v).length;
  }, 0);
  const blankRow = Math.floor(t.indexOf(0) / SIZE);
  const solvable = (SIZE % 2 === 1)
    ? inversions % 2 === 0
    : (inversions + blankRow) % 2 === 1;
  if (!solvable) { [t[0], t[1]] = [t[1], t[0]]; }
  return t;
}

const GOAL = makeGoal();

export default function Sliding() {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(GOAL));
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('sliding-best') || 0));
  const [solved, setSolved] = useState(false);

  const reset = () => { setTiles(shuffle(GOAL)); setMoves(0); setSolved(false); };

  const click = useCallback((i: number) => {
    if (solved) return;
    const blank = tiles.indexOf(0);
    const r = Math.floor(i / SIZE), c = i % SIZE;
    const br = Math.floor(blank / SIZE), bc = blank % SIZE;
    if (Math.abs(r - br) + Math.abs(c - bc) !== 1) return;
    const nt = [...tiles];
    [nt[i], nt[blank]] = [nt[blank], nt[i]];
    const nm = moves + 1;
    setTiles(nt); setMoves(nm);
    if (nt.every((v, idx) => v === GOAL[idx])) {
      setSolved(true);
      if (!best || nm < best) { setBest(nm); localStorage.setItem('sliding-best', String(nm)); }
    }
  }, [tiles, moves, solved, best]);

  const blank = tiles.indexOf(0);

  return (
    <GameShell title="15 Puzzle" emoji="🧩" onReset={reset} scores={[
      { label: 'Moves', value: moves, color: '#f472b6' },
      { label: 'Best', value: best || '—', color: '#fbbf24' },
    ]}>
      {solved && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center', marginBottom: '16px', background: '#22c55e22', border: '1px solid #22c55e44', borderRadius: '14px', padding: '14px' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🎉</div>
          <div style={{ color: '#22c55e', fontWeight: 800 }}>Solved in {moves} moves!</div>
          {moves === best && <div style={{ color: '#fbbf24', fontSize: '0.82rem', marginTop: '4px' }}>🏆 New best!</div>}
        </motion.div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
        gap: '6px', maxWidth: '320px', margin: '0 auto',
        background: '#0f172a', padding: '10px', borderRadius: '16px',
        border: '2px solid #1e293b',
      }}>
        {tiles.map((val, i) => {
          const blank = val === 0;
          const r = Math.floor(i / SIZE), c = i % SIZE;
          const br = Math.floor(tiles.indexOf(0) / SIZE), bc = tiles.indexOf(0) % SIZE;
          const canMove = Math.abs(r - br) + Math.abs(c - bc) === 1;
          return (
            <motion.button key={val === 0 ? 'blank' : val}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              onClick={() => click(i)}
              style={{
                height: 70, borderRadius: '12px',
                background: blank ? '#0f172a' : solved ? '#22c55e22' : canMove ? `${val % 2 === 0 ? '#818cf8' : '#f472b6'}22` : '#1e293b',
                border: blank ? '2px dashed #1e293b' : `2px solid ${solved ? '#22c55e44' : canMove ? '#818cf844' : '#334155'}`,
                cursor: blank ? 'default' : canMove ? 'pointer' : 'default',
                color: blank ? 'transparent' : solved ? '#22c55e' : '#e2e8f0',
                fontWeight: 900, fontSize: '1.4rem',
                fontFamily: 'Outfit,sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, border-color 0.2s',
                boxShadow: canMove && !blank ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              }}
            >{blank ? '' : val}</motion.button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '14px', color: '#475569', fontSize: '0.78rem' }}>
        Click tiles adjacent to the blank space to slide them
      </div>
    </GameShell>
  );
}
