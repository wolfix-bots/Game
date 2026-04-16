import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Grid = (number|null)[][];
type Fixed = boolean[][];

const PUZZLES: Record<string, [Grid,Grid]> = {
  easy: [
    [[5,3,null,null,7,null,null,null,null],[6,null,null,1,9,5,null,null,null],[null,9,8,null,null,null,null,6,null],[8,null,null,null,6,null,null,null,3],[4,null,null,8,null,3,null,null,1],[7,null,null,null,2,null,null,null,6],[null,6,null,null,null,null,2,8,null],[null,null,null,4,1,9,null,null,5],[null,null,null,null,8,null,null,7,9]],
    [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]]
  ],
  medium: [
    [[null,null,null,2,6,null,7,null,1],[6,8,null,null,7,null,null,9,null],[1,9,null,null,null,4,5,null,null],[8,2,null,1,null,null,null,4,null],[null,null,4,6,null,2,9,null,null],[null,5,null,null,null,3,null,2,8],[null,null,9,3,null,null,null,7,4],[null,4,null,null,5,null,null,3,6],[7,null,3,null,1,8,null,null,null]],
    [[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],[8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],[5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]]
  ],
};

export default function Sudoku() {
  const [diff, setDiff] = useState<'easy'|'medium'>('easy');
  const [puzzle, solution] = PUZZLES[diff];
  const [grid, setGrid] = useState<Grid>(puzzle.map(r => [...r]));
  const [fixed] = useState<Fixed>(puzzle.map(r => r.map(v => v !== null)));
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);

  const reset = () => { setGrid(PUZZLES[diff][0].map(r=>[...r])); setSelected(null); setErrors(new Set()); setWon(false); };

  const input = useCallback((val: number|null) => {
    if (!selected || won) return;
    const [r,c] = selected;
    if (fixed[r][c]) return;
    const ng = grid.map(row=>[...row]) as Grid;
    ng[r][c] = val;
    setGrid(ng);
    // Check error
    const ne = new Set(errors);
    const key = `${r}-${c}`;
    if (val !== null && val !== solution[r][c]) ne.add(key); else ne.delete(key);
    setErrors(ne);
    // Check win
    if (ng.every((row,ri) => row.every((v,ci) => v === solution[ri][ci]))) setWon(true);
  }, [selected, grid, fixed, solution, errors, won]);

  const sel = selected;
  const selBox = sel ? [Math.floor(sel[0]/3)*3, Math.floor(sel[1]/3)*3] : null;

  return (
    <GameShell title="Sudoku" emoji="🔢" onReset={reset}>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'14px' }}>
        {(['easy','medium'] as const).map(d => (
          <button key={d} onClick={() => { setDiff(d); setTimeout(reset,0); }}
            style={{ padding:'5px 16px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif', textTransform:'capitalize',
              borderColor:diff===d?'#34d399':'#334155', background:diff===d?'#34d39922':'transparent', color:diff===d?'#34d399':'#94a3b8' }}
          >{d}</button>
        ))}
      </div>
      {won && <div style={{ textAlign:'center', color:'#22c55e', fontWeight:800, fontSize:'1.1rem', marginBottom:'12px' }}>🎉 Solved!</div>}
      {/* Board */}
      <div style={{ display:'inline-block', border:'3px solid #e2e8f0', borderRadius:'8px', overflow:'hidden', margin:'0 auto' }}>
        {grid.map((row,r) => (
          <div key={r} style={{ display:'flex', borderBottom: r===2||r===5?'3px solid #e2e8f0':'1px solid #334155' }}>
            {row.map((val,c) => {
              const isFixed = fixed[r][c];
              const isSel = sel && sel[0]===r && sel[1]===c;
              const isSame = sel && val && grid[sel[0]][sel[1]]===val && !isSel;
              const isRelated = sel && (sel[0]===r || sel[1]===c || (selBox && r>=selBox[0]&&r<selBox[0]+3&&c>=selBox[1]&&c<selBox[1]+3));
              const isError = errors.has(`${r}-${c}`);
              return (
                <div key={c} onClick={() => !isFixed && setSelected([r,c])}
                  style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center',
                    borderRight: c===2||c===5?'3px solid #e2e8f0':'1px solid #334155',
                    background: isSel?'#3b82f644':isSame?'#3b82f622':isRelated?'#1e293b':'#0f172a',
                    cursor: isFixed?'default':'pointer', fontWeight: isFixed?800:600,
                    fontSize:'1rem', color: isError?'#ef4444':isFixed?'#e2e8f0':'#60a5fa',
                  }}
                >{val||''}</div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Number pad */}
      <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'14px', flexWrap:'wrap' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => input(n)}
            style={{ width:38, height:38, borderRadius:'8px', border:'1px solid #334155', background:'#1e293b', color:'#60a5fa', fontWeight:800, fontSize:'1rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
          >{n}</button>
        ))}
        <button onClick={() => input(null)}
          style={{ width:38, height:38, borderRadius:'8px', border:'1px solid #334155', background:'#1e293b', color:'#ef4444', fontWeight:800, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
        >⌫</button>
      </div>
    </GameShell>
  );
}
