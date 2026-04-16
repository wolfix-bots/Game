import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Grid = (number|null)[][];

const PUZZLES: { easy: [Grid,Grid], medium: [Grid,Grid], hard: [Grid,Grid] } = {
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
  ],
};

export default function Sudoku() {
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [grid, setGrid] = useState<Grid>(() => PUZZLES.easy[0].map(r => [...r]));
  const [solution] = useState<Grid[]>([PUZZLES.easy[1]]);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const initial = PUZZLES[diff][0];

  const reset = (d = diff) => {
    setGrid(PUZZLES[d][0].map(r => [...r]));
    setSelected(null); setErrors(new Set()); setSolved(false);
  };

  const input = (val: number|null) => {
    if (!selected) return;
    const [r,c] = selected;
    if (initial[r][c] !== null) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = val;
    setGrid(ng);
    // Check errors
    const ne = new Set<string>();
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      if (ng[i][j] !== null && PUZZLES[d][1][i][j] !== ng[i][j]) ne.add(`${i}-${j}`);
    }
    setErrors(ne);
    if (ne.size === 0 && ng.every(row => row.every(v => v !== null))) setSolved(true);
  };

  const d = diff;

  return (
    <GameShell title="Sudoku" emoji="🔢" onReset={() => reset()} scores={[{ label: 'Errors', value: errors.size, color: errors.size > 0 ? '#ef4444' : '#22c55e' }]}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
        {(['easy','medium','hard'] as const).map(dv => (
          <button key={dv} onClick={() => { setDiff(dv); reset(dv); }}
            style={{ padding: '5px 14px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize',
              borderColor: diff === dv ? '#34d399' : '#334155', background: diff === dv ? '#34d39922' : 'transparent', color: diff === dv ? '#34d399' : '#94a3b8' }}
          >{dv}</button>
        ))}
      </div>
      {solved && <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: 800, fontSize: '1.1rem', marginBottom: '10px' }}>🎉 Solved!</div>}
      <div style={{ display: 'flex', border: '3px solid #475569', borderRadius: '8px', overflow: 'hidden', margin: '0 auto' }}>
        <div>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', borderBottom: (r+1)%3===0&&r<8 ? '3px solid #475569' : '1px solid #1e293b' }}>
              {row.map((cell, c) => {
                const isInit = initial[r][c] !== null;
                const isSel = selected?.[0]===r && selected?.[1]===c;
                const isErr = errors.has(`${r}-${c}`);
                const sameNum = selected && grid[selected[0]][selected[1]] && cell === grid[selected[0]][selected[1]];
                return (
                  <div key={c} onClick={() => !isInit && setSelected([r,c])}
                    style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: (c+1)%3===0&&c<8 ? '3px solid #475569' : '1px solid #1e293b',
                      background: isSel ? '#3b82f622' : isErr ? '#ef444422' : sameNum ? '#3b82f611' : '#1e293b',
                      color: isErr ? '#ef4444' : isInit ? '#e2e8f0' : '#60a5fa',
                      fontWeight: isInit ? 700 : 500, fontSize: '1rem', cursor: isInit ? 'default' : 'pointer',
                      outline: isSel ? '2px solid #3b82f6' : 'none',
                    }}
                  >{cell || ''}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Number pad */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => input(n)}
            style={{ width: 36, height: 36, borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#60a5fa', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}
          >{n}</button>
        ))}
        <button onClick={() => input(null)}
          style={{ width: 36, height: 36, borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#ef4444', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}
        >✕</button>
      </div>
    </GameShell>
  );
}
