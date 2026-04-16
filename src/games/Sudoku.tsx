import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Grid = (number | null)[][];

const PUZZLES: { easy: [Grid, Grid]; medium: [Grid, Grid]; hard: [Grid, Grid] } = {
  easy: [
    [[5,3,null,null,7,null,null,null,null],[6,null,null,1,9,5,null,null,null],[null,9,8,null,null,null,null,6,null],[8,null,null,null,6,null,null,null,3],[4,null,null,8,null,3,null,null,1],[7,null,null,null,2,null,null,null,6],[null,6,null,null,null,null,2,8,null],[null,null,null,4,1,9,null,null,5],[null,null,null,null,8,null,null,7,9]],
    [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]]
  ],
  medium: [
    [[null,null,null,2,6,null,7,null,1],[6,8,null,null,7,null,null,9,null],[1,9,null,null,null,4,5,null,null],[8,2,null,1,null,null,null,4,null],[null,null,4,6,null,2,9,null,null],[null,5,null,null,null,3,null,2,8],[null,null,9,3,null,null,null,7,4],[null,4,null,null,5,null,null,3,6],[7,null,3,null,1,8,null,null,null]],
    [[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],[8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],[5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]]
  ],
  hard: [
    [[null,2,null,null,null,null,null,null,null],[null,null,null,6,null,null,null,null,3],[null,7,4,null,8,null,null,null,null],[null,null,null,null,null,3,null,null,2],[null,8,null,null,4,null,null,1,null],[6,null,null,5,null,null,null,null,null],[null,null,null,null,1,null,7,8,null],[5,null,null,null,null,9,null,null,null],[null,null,null,null,null,null,null,4,null]],
    [[1,2,6,4,3,7,9,5,8],[8,9,5,6,2,1,4,7,3],[3,7,4,9,8,5,1,2,6],[4,5,7,1,9,3,8,6,2],[9,8,3,2,4,6,5,1,7],[6,1,2,5,7,8,3,9,4],[2,6,9,3,1,4,7,8,5],[5,4,8,7,6,9,2,3,1],[7,3,1,8,5,2,6,4,9]]
  ]
};

export default function Sudoku() {
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [grid, setGrid] = useState<Grid>(PUZZLES.easy[0].map(r => [...r]));
  const [original] = useState<Grid>(PUZZLES.easy[0].map(r => [...r]));
  const [solution] = useState<Grid>(PUZZLES.easy[1]);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const loadPuzzle = (d: 'easy'|'medium'|'hard') => {
    setDiff(d);
    setGrid(PUZZLES[d][0].map(r => [...r]));
    setSelected(null); setErrors(new Set()); setWon(false);
  };

  const input = (n: number) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (PUZZLES[diff][0][r][c] !== null) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = n === 0 ? null : n;
    setGrid(ng);
    const ne = new Set(errors);
    const key = `${r}-${c}`;
    if (n !== 0 && n !== PUZZLES[diff][1][r][c]) ne.add(key); else ne.delete(key);
    setErrors(ne);
    if (ng.every((row, ri) => row.every((v, ci) => v === PUZZLES[diff][1][ri][ci]))) setWon(true);
  };

  const isOriginal = (r: number, c: number) => PUZZLES[diff][0][r][c] !== null;
  const isSelected = (r: number, c: number) => selected?.[0] === r && selected?.[1] === c;
  const isSameNum = (r: number, c: number) => selected && grid[r][c] !== null && grid[r][c] === grid[selected[0]][selected[1]];
  const isRelated = (r: number, c: number) => selected && (r === selected[0] || c === selected[1] || (Math.floor(r/3) === Math.floor(selected[0]/3) && Math.floor(c/3) === Math.floor(selected[1]/3)));

  return (
    <GameShell title="Sudoku" emoji="🔢" onReset={() => loadPuzzle(diff)}>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '14px' }}>
        {(['easy','medium','hard'] as const).map(d => (
          <button key={d} onClick={() => loadPuzzle(d)}
            style={{ padding: '5px 14px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize',
              borderColor: diff === d ? '#34d399' : '#334155', background: diff === d ? '#34d39922' : 'transparent', color: diff === d ? '#34d399' : '#94a3b8' }}
          >{d}</button>
        ))}
      </div>
      {won && <div style={{ textAlign: 'center', marginBottom: '12px', color: '#22c55e', fontWeight: 800, fontSize: '1.1rem' }}>🎉 Solved!</div>}
      <div style={{ display: 'flex', border: '3px solid #475569', borderRadius: '8px', overflow: 'hidden', margin: '0 auto' }}>
        <div>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', borderBottom: (r + 1) % 3 === 0 && r < 8 ? '3px solid #475569' : '1px solid #334155' }}>
              {row.map((val, c) => {
                const err = errors.has(`${r}-${c}`);
                const orig = isOriginal(r, c);
                const sel = isSelected(r, c);
                const same = isSameNum(r, c);
                const rel = isRelated(r, c);
                return (
                  <div key={c} onClick={() => setSelected([r, c])}
                    style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: (c + 1) % 3 === 0 && c < 8 ? '3px solid #475569' : '1px solid #334155',
                      background: sel ? '#3b82f644' : same ? '#3b82f622' : rel ? '#1e293b' : '#0f172a',
                      cursor: 'pointer', fontWeight: orig ? 700 : 500, fontSize: '1rem',
                      color: err ? '#ef4444' : orig ? '#e2e8f0' : '#60a5fa', transition: 'background 0.15s',
                    }}
                  >{val || ''}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button key={n} onClick={() => input(n)}
            style={{ width: 36, height: 36, borderRadius: '8px', border: '2px solid #334155', background: '#1e293b', color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}
          >{n === 0 ? '⌫' : n}</button>
        ))}
      </div>
    </GameShell>
  );
}
