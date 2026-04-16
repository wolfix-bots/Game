import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 10;
const SHIPS = [5,4,3,3,2];
type Cell = 'empty'|'ship'|'hit'|'miss';

function placeShipsRandom(): Cell[][] {
  const grid: Cell[][] = Array(SIZE).fill(null).map(() => Array(SIZE).fill('empty'));
  for (const len of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - len));
      const c = Math.floor(Math.random() * (horiz ? SIZE - len : SIZE));
      let ok = true;
      for (let i = 0; i < len; i++) { const nr = horiz?r:r+i, nc = horiz?c+i:c; if (grid[nr][nc] !== 'empty') { ok = false; break; } }
      if (ok) { for (let i = 0; i < len; i++) { const nr = horiz?r:r+i, nc = horiz?c+i:c; grid[nr][nc] = 'ship'; } placed = true; }
    }
  }
  return grid;
}

function aiShot(grid: Cell[][]): [number,number] {
  // Hunt mode: find adjacent to hits
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (grid[r][c] !== 'hit') continue;
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr,nc=c+dc;
      if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&(grid[nr][nc]==='empty'||grid[nr][nc]==='ship')) return [nr,nc];
    }
  }
  // Random
  const avail: [number,number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]==='empty'||grid[r][c]==='ship') avail.push([r,c]);
  return avail[Math.floor(Math.random()*avail.length)];
}

type Phase = 'place'|'play'|'over';

export default function Battleship() {
  const [playerGrid, setPlayerGrid] = useState<Cell[][]>(() => placeShipsRandom());
  const [aiGrid, setAiGrid] = useState<Cell[][]>(() => placeShipsRandom());
  const [phase, setPhase] = useState<Phase>('play');
  const [turn, setTurn] = useState<'player'|'ai'>('player');
  const [winner, setWinner] = useState('');
  const [lastShot, setLastShot] = useState<[number,number]|null>(null);

  const countShips = (g: Cell[][]) => g.flat().filter(c => c==='ship').length;

  const playerShoot = useCallback((r: number, c: number) => {
    if (phase!=='play'||turn!=='player') return;
    const cell = aiGrid[r][c];
    if (cell==='hit'||cell==='miss') return;
    const ng = aiGrid.map(row => [...row]) as Cell[][];
    ng[r][c] = cell==='ship' ? 'hit' : 'miss';
    setAiGrid(ng);
    if (countShips(ng)===0) { setWinner('player'); setPhase('over'); return; }
    setTurn('ai');
    // AI turn
    setTimeout(() => {
      const [ar,ac] = aiShot(playerGrid);
      setLastShot([ar,ac]);
      const pg = playerGrid.map(row => [...row]) as Cell[][];
      pg[ar][ac] = pg[ar][ac]==='ship' ? 'hit' : 'miss';
      setPlayerGrid(pg);
      if (countShips(pg)===0) { setWinner('ai'); setPhase('over'); }
      else setTurn('player');
    }, 600);
  }, [phase, turn, aiGrid, playerGrid]);

  const reset = () => { setPlayerGrid(placeShipsRandom()); setAiGrid(placeShipsRandom()); setPhase('play'); setTurn('player'); setWinner(''); setLastShot(null); };

  const cellColor = (cell: Cell, isAi: boolean): string => {
    if (cell==='hit') return '#ef4444';
    if (cell==='miss') return '#334155';
    if (cell==='ship' && !isAi) return '#3b82f688';
    return '#1e293b';
  };

  const Grid = ({ grid, isAi }: { grid: Cell[][], isAi: boolean }) => (
    <div>
      <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>{isAi ? "Enemy Waters" : "Your Fleet"}</div>
      <div style={{ display: 'inline-block', border: '2px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((cell, c) => (
              <div key={c} onClick={() => isAi && playerShoot(r,c)}
                style={{ width: 26, height: 26, background: cellColor(cell, isAi), border: '1px solid #0f172a', cursor: isAi&&phase==='play'&&turn==='player'&&cell!=='hit'&&cell!=='miss'?'crosshair':'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', transition: 'background 0.2s' }}
              >
                {cell==='hit'?'💥':cell==='miss'?'•':''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <GameShell title="Battleship" emoji="🚢" onReset={reset} scores={[
      { label: 'Your hits', value: aiGrid.flat().filter(c=>c==='hit').length, color: '#38bdf8' },
      { label: 'AI hits', value: playerGrid.flat().filter(c=>c==='hit').length, color: '#ef4444' },
    ]}>
      {phase==='over' && <div style={{ textAlign:'center', marginBottom:'12px', color: winner==='player'?'#22c55e':'#ef4444', fontWeight:800, fontSize:'1.1rem' }}>{winner==='player'?'🏆 You Win!':'💀 AI Wins!'}</div>}
      {phase==='play' && <div style={{ textAlign:'center', marginBottom:'10px', color:'#94a3b8', fontWeight:700, fontSize:'0.85rem' }}>{turn==='player'?'🎯 Click enemy waters to shoot':'🤖 AI is shooting…'}</div>}
      <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
        <Grid grid={playerGrid} isAi={false} />
        <Grid grid={aiGrid} isAi={true} />
      </div>
      <div style={{ textAlign:'center', marginTop:'10px', color:'#475569', fontSize:'0.75rem' }}>Blue = your ships · 💥 = hit · • = miss</div>
    </GameShell>
  );
}
