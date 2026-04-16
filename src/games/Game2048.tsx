import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

type Grid = number[][];
const SIZE = 4;
const newGrid = (): Grid => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

function addTile(g: Grid): Grid {
  const empties: [number,number][] = [];
  g.forEach((row,r) => row.forEach((v,c) => { if (!v) empties.push([r,c]); }));
  if (!empties.length) return g;
  const [r,c] = empties[Math.floor(Math.random() * empties.length)];
  const ng = g.map(row => [...row]);
  ng[r][c] = Math.random() < 0.9 ? 2 : 4;
  return ng;
}

function slide(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter(v => v);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i+1]) {
      merged.push(filtered[i] * 2); score += filtered[i] * 2; i += 2;
    } else { merged.push(filtered[i]); i++; }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, score };
}

function move(g: Grid, dir: string): { grid: Grid; score: number; moved: boolean } {
  let grid = g.map(r => [...r]);
  let score = 0, moved = false;
  const process = (rows: number[][]): number[][] => rows.map(row => { const { row: nr, score: s } = slide(row); score += s; if (nr.join() !== row.join()) moved = true; return nr; });
  if (dir === 'left')  grid = process(grid);
  if (dir === 'right') grid = process(grid.map(r => [...r].reverse())).map(r => [...r].reverse());
  if (dir === 'up')    { const t = grid[0].map((_,c) => grid.map(r => r[c])); const pt = process(t); grid = pt[0].map((_,c) => pt.map(r => r[c])); }
  if (dir === 'down')  { const t = grid[0].map((_,c) => grid.map(r => r[c]).reverse()); const pt = process(t); grid = pt[0].map((_,c) => pt.map(r => r[c]).reverse()); }
  return { grid, score, moved };
}

const COLORS: Record<number,{bg:string,text:string}> = {
  0:{bg:'#1e293b',text:'transparent'}, 2:{bg:'#fef3c7',text:'#92400e'}, 4:{bg:'#fde68a',text:'#92400e'},
  8:{bg:'#fb923c',text:'#fff'}, 16:{bg:'#f97316',text:'#fff'}, 32:{bg:'#ef4444',text:'#fff'},
  64:{bg:'#dc2626',text:'#fff'}, 128:{bg:'#a78bfa',text:'#fff'}, 256:{bg:'#7c3aed',text:'#fff'},
  512:{bg:'#6d28d9',text:'#fff'}, 1024:{bg:'#f59e0b',text:'#fff'}, 2048:{bg:'#eab308',text:'#fff'},
};

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => addTile(addTile(newGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('2048-best') || 0));
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);

  const doMove = useCallback((dir: string) => {
    setGrid(prev => {
      const { grid: ng, score: s, moved } = move(prev, dir);
      if (!moved) return prev;
      const withTile = addTile(ng);
      setScore(sc => { const ns = sc + s; if (ns > best) { setBest(ns); localStorage.setItem('2048-best', String(ns)); } return ns; });
      if (withTile.some(r => r.some(v => v === 2048))) setWon(true);
      // Check game over
      const { moved: m1 } = move(withTile, 'left');
      const { moved: m2 } = move(withTile, 'right');
      const { moved: m3 } = move(withTile, 'up');
      const { moved: m4 } = move(withTile, 'down');
      if (!m1 && !m2 && !m3 && !m4) setOver(true);
      return withTile;
    });
  }, [best]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string,string> = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doMove]);

  const reset = () => { setGrid(addTile(addTile(newGrid()))); setScore(0); setWon(false); setOver(false); };

  return (
    <GameShell title="2048" emoji="🔲" onReset={reset} scores={[
      { label: 'Score', value: score, color: '#fbbf24' },
      { label: 'Best', value: best, color: '#f97316' },
    ]}>
      {(won || over) && (
        <div style={{ textAlign: 'center', marginBottom: '12px', color: won ? '#22c55e' : '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>
          {won ? '🎉 You reached 2048!' : '💀 Game Over!'}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', background: '#0f172a', padding: '10px', borderRadius: '16px', maxWidth: '320px', margin: '0 auto' }}>
        {grid.flat().map((val, i) => {
          const c = COLORS[val] || { bg: '#f59e0b', text: '#fff' };
          return (
            <motion.div key={i} layout
              style={{ height: 70, background: c.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: val >= 1000 ? '1rem' : val >= 100 ? '1.2rem' : '1.5rem', color: c.text, boxShadow: val >= 2048 ? '0 0 20px #eab308' : 'none' }}
            >{val || ''}</motion.div>
          );
        })}
      </div>
      {/* Mobile swipe buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', maxWidth: '150px', margin: '16px auto 0' }}>
        {[['','⬆️',''],['⬅️','','➡️'],['','⬇️','']].flat().map((btn,i) => (
          <button key={i} onClick={() => { if (btn === '⬆️') doMove('up'); if (btn === '⬇️') doMove('down'); if (btn === '⬅️') doMove('left'); if (btn === '➡️') doMove('right'); }}
            style={{ height: '40px', background: btn ? '#1e293b' : 'transparent', border: btn ? '1px solid #334155' : 'none', borderRadius: '8px', cursor: btn ? 'pointer' : 'default', fontSize: '1.1rem' }}
          >{btn}</button>
        ))}
      </div>
    </GameShell>
  );
}
