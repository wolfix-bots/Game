import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

// Minimal puzzle bank (puzzle, solution pairs)
const PUZZLES = [
  { p: '530070000600195000098000060800060003400803001700020006060000280000419005000080079', s: '534678912672195348198342567859761423426853791713924856961537284287419635345286179' },
  { p: '800000000003600000070090200060005030004000800030070060020060001500008400000000068', s: '812753649943682175675491283168945327254367891397128564289674531531289746426531987' },
  { p: '000000000000003085001020000000507000004000100090000000500000073002010000000040009', s: '987654321246173985351928746128537694634892157795461832519286473472319568863745219' },
];

type Grid = (number|null)[][];
type Fixed = boolean[][];

function parseGrid(s: string): Grid {
  return Array(9).fill(null).map((_, r) =>
    Array(9).fill(null).map((__, c) => { const v = Number(s[r*9+c]); return v || null; })
  );
}

function isValid(grid: Grid, r: number, c: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val || grid[i][c] === val) return false;
  }
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) if (grid[br+dr][bc+dc] === val) return false;
  return true;
}

function isSolved(grid: Grid, solution: string): boolean {
  return grid.flat().every((v, i) => v === Number(solution[i]));
}

export default function Sudoku() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [grid, setGrid] = useState<Grid>(() => parseGrid(PUZZLES[0].p));
  const [fixed, setFixed] = useState<Fixed>(() => parseGrid(PUZZLES[0].p).map(row => row.map(v => v !== null)));
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const loadPuzzle = (idx: number) => {
    const { p } = PUZZLES[idx % PUZZLES.length];
    const g = parseGrid(p);
    setGrid(g); setFixed(g.map(row => row.map(v => v !== null)));
    setSelected(null); setErrors(new Set()); setSolved(false); setMistakes(0); setPuzzleIdx(idx);
  };

  const input = useCallback((val: number | null) => {
    if (!selected || solved) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const ng = grid.map(row => [...row]) as Grid;
    ng[r][c] = val;
    const ne = new Set(errors);
    const key = `${r}-${c}`;
    if (val && !isValid(ng.map((row,ri) => row.map((v,ci) => (ri===r&&ci===c)?null:v)), r, c, val)) {
      ne.add(key); setMistakes(m => m + 1);
    } else { ne.delete(key); }
    setErrors(ne); setGrid(ng);
    if (isSolved(ng, PUZZLES[puzzleIdx % PUZZLES.length].s)) setSolved(true);
  }, [selected, fixed, grid, errors, solved, puzzleIdx]);

  const hint = () => {
    if (!selected || solved) return;
    const [r, c] = selected; if (fixed[r][c]) return;
    const correct = Number(PUZZLES[puzzleIdx % PUZZLES.length].s[r*9+c]);
    const ng = grid.map(row => [...row]) as Grid; ng[r][c] = correct;
    const ne = new Set(errors); ne.delete(`${r}-${c}`);
    setErrors(ne); setGrid(ng);
    if (isSolved(ng, PUZZLES[puzzleIdx % PUZZLES.length].s)) setSolved(true);
  };

  const cellColor = (r: number, c: number) => {
    if (selected && selected[0]===r && selected[1]===c) return '#6366f133';
    if (errors.has(`${r}-${c}`)) return '#ef444422';
    if (selected) {
      const [sr,sc]=selected;
      if (sr===r||sc===c||( Math.floor(sr/3)===Math.floor(r/3)&&Math.floor(sc/3)===Math.floor(c/3))) return '#1e293b';
    }
    return '#0f172a';
  };

  return (
    <GameShell title="Sudoku" emoji="🔢" onReset={() => loadPuzzle(Math.floor(Math.random()*PUZZLES.length))} scores={[
      { label: 'Mistakes', value: mistakes, color: '#ef4444' },
      { label: solved ? 'Solved! ✓' : 'In Progress', value: '', color: solved ? '#22c55e' : '#94a3b8' },
    ]}>
      {solved && <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} style={{ color:'#22c55e', fontWeight:800, fontSize:'1.2rem', textAlign:'center' }}>🎉 Puzzle Solved!</motion.div>}

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:0, border:'2px solid #475569', borderRadius:'8px', overflow:'hidden', maxWidth:'360px', width:'100%' }}>
        {grid.map((row, r) => row.map((val, c) => (
          <div key={`${r}-${c}`} onClick={() => setSelected([r,c])}
            style={{
              width:'100%', aspectRatio:'1/1', display:'flex', alignItems:'center', justifyContent:'center',
              background: cellColor(r,c),
              borderRight: c%3===2&&c<8 ? '2px solid #475569' : '1px solid #1e293b',
              borderBottom: r%3===2&&r<8 ? '2px solid #475569' : '1px solid #1e293b',
              cursor:'pointer', fontSize:'clamp(0.7rem,2.5vw,1rem)', fontWeight:700,
              color: errors.has(`${r}-${c}`) ? '#ef4444' : fixed[r][c] ? '#e2e8f0' : '#818cf8',
              transition:'background 0.1s',
            }}
          >{val || ''}</div>
        )))}
      </div>

      {/* Number pad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', maxWidth:'280px', width:'100%' }}>
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button key={n} onClick={() => input(n===0?null:n)}
            style={{ height:44, borderRadius:'10px', border:'1px solid #334155', background:'#1e293b', color:n===0?'#ef4444':'#e2e8f0', fontWeight:700, fontSize:'1rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
          >{n===0?'✕':n}</button>
        ))}
      </div>

      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={hint} style={{ padding:'8px 16px', borderRadius:'10px', border:'1px solid #334155', background:'#1e293b', color:'#fbbf24', fontWeight:600, cursor:'pointer', fontSize:'0.85rem', fontFamily:'Outfit,sans-serif' }}>💡 Hint</button>
        <button onClick={() => loadPuzzle(puzzleIdx+1)} style={{ padding:'8px 16px', borderRadius:'10px', border:'1px solid #334155', background:'#1e293b', color:'#94a3b8', fontWeight:600, cursor:'pointer', fontSize:'0.85rem', fontFamily:'Outfit,sans-serif' }}>Next Puzzle →</button>
      </div>
    </GameShell>
  );
}
