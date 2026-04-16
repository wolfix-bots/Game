import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Grid = (number|null)[][];

const BASE: Grid = [
  [5,3,null,null,7,null,null,null,null],
  [6,null,null,1,9,5,null,null,null],
  [null,9,8,null,null,null,null,6,null],
  [8,null,null,null,6,null,null,null,3],
  [4,null,null,8,null,3,null,null,1],
  [7,null,null,null,2,null,null,null,6],
  [null,6,null,null,null,null,2,8,null],
  [null,null,null,4,1,9,null,null,5],
  [null,null,null,null,8,null,null,7,9],
];
const SOLUTION: number[][] = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
];

const PUZZLES: { grid: Grid; solution: number[][] }[] = [
  { grid: BASE, solution: SOLUTION },
  {
    grid: [
      [null,2,null,null,null,null,null,null,null],[null,null,null,6,null,null,null,null,3],[null,7,4,null,8,null,null,null,null],
      [null,null,null,null,null,3,null,null,2],[null,8,null,null,4,null,null,1,null],[6,null,null,5,null,null,null,null,null],
      [null,null,null,null,1,null,7,8,null],[5,null,null,null,null,9,null,null,null],[null,null,null,null,null,null,null,4,null],
    ],
    solution: [
      [1,2,6,4,3,7,9,5,8],[8,9,5,6,2,1,4,7,3],[3,7,4,9,8,5,1,2,6],
      [4,5,7,1,9,3,8,6,2],[9,8,3,2,4,6,5,1,7],[6,1,2,5,7,8,3,9,4],
      [2,6,9,3,1,4,7,8,5],[5,4,8,7,6,9,2,3,1],[7,3,1,8,5,2,6,4,9],
    ],
  },
];

export default function Sudoku() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [grid, setGrid] = useState<Grid>(() => PUZZLES[0].grid.map(r => [...r]));
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const puzzle = PUZZLES[puzzleIdx];

  const isFixed = (r:number,c:number) => puzzle.grid[r][c] !== null;

  const input = useCallback((val: number|null) => {
    if (!selected || won) return;
    const [r,c] = selected;
    if (isFixed(r,c)) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = val;
    const newErrors = new Set<string>();
    ng.forEach((row,ri) => row.forEach((v,ci) => {
      if (!v) return;
      if (v !== puzzle.solution[ri][ci]) newErrors.add(`${ri}-${ci}`);
    }));
    setErrors(newErrors);
    setGrid(ng);
    if (ng.every((row,ri) => row.every((v,ci) => v === puzzle.solution[ri][ci]))) setWon(true);
  }, [selected, grid, won, puzzle]);

  const reset = () => { setGrid(puzzle.grid.map(r=>[...r])); setSelected(null); setErrors(new Set()); setWon(false); };
  const changePuzzle = (i:number) => { setPuzzleIdx(i); setGrid(PUZZLES[i].grid.map(r=>[...r])); setSelected(null); setErrors(new Set()); setWon(false); };

  const cellSize = Math.min(44, Math.floor((Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 420, 420)) / 9));

  return (
    <GameShell title="Sudoku" emoji="🔢" onReset={reset}>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
        {PUZZLES.map((_,i) => (
          <button key={i} onClick={() => changePuzzle(i)}
            style={{ padding:'5px 14px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif',
              borderColor:puzzleIdx===i?'#34d399':'#334155', background:puzzleIdx===i?'#34d39922':'transparent', color:puzzleIdx===i?'#34d399':'#94a3b8' }}
          >Puzzle {i+1}</button>
        ))}
      </div>
      {won && <div style={{ textAlign:'center', marginBottom:'12px', color:'#22c55e', fontWeight:800, fontSize:'1.1rem' }}>🎉 Solved!</div>}
      <div style={{ display:'flex', border:'3px solid #475569', borderRadius:'8px', overflow:'hidden', margin:'0 auto' }}>
        <div>
          {grid.map((row,r) => (
            <div key={r} style={{ display:'flex', borderBottom: r===2||r===5 ? '3px solid #475569' : '1px solid #334155' }}>
              {row.map((val,c) => {
                const sel = selected?.[0]===r && selected?.[1]===c;
                const sameBox = selected && Math.floor(selected[0]/3)===Math.floor(r/3) && Math.floor(selected[1]/3)===Math.floor(c/3);
                const sameRowCol = selected && (selected[0]===r || selected[1]===c);
                const err = errors.has(`${r}-${c}`);
                const fixed = isFixed(r,c);
                return (
                  <div key={c} onClick={() => !fixed && setSelected([r,c])}
                    style={{
                      width:cellSize, height:cellSize,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight: fixed?800:600, fontSize:cellSize*0.45,
                      borderRight: c===2||c===5?'3px solid #475569':'1px solid #334155',
                      background: sel?'#3b82f633':err?'#ef444422':sameBox?'#1e293b':sameRowCol?'#1a2535':'#0f172a',
                      color: err?'#ef4444':fixed?'#e2e8f0':'#60a5fa',
                      cursor: fixed?'default':'pointer',
                    }}
                  >{val||''}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Number pad */}
      <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'14px', flexWrap:'wrap' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => input(n)}
            style={{ width:38, height:38, borderRadius:'10px', border:'2px solid #334155', background:'#1e293b', color:'#60a5fa', fontWeight:800, fontSize:'1rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
          >{n}</button>
        ))}
        <button onClick={() => input(null)}
          style={{ width:38, height:38, borderRadius:'10px', border:'2px solid #334155', background:'#1e293b', color:'#ef4444', fontWeight:800, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
        >✕</button>
      </div>
    </GameShell>
  );
}
