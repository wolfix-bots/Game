import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 10;
type Cell = 'empty'|'ship'|'hit'|'miss';
const SHIPS = [5,4,3,3,2];

function placeShips(): Cell[][] {
  const grid: Cell[][] = Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty'));
  for (const len of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random()>0.5;
      const r = Math.floor(Math.random()*(horiz?SIZE:SIZE-len+1));
      const c = Math.floor(Math.random()*(horiz?SIZE-len+1:SIZE));
      let ok = true;
      for (let i=0;i<len;i++) { const nr=horiz?r:r+i; const nc=horiz?c+i:c; if(grid[nr][nc]!=='empty'){ok=false;break;} }
      if (ok) { for(let i=0;i<len;i++){const nr=horiz?r:r+i;const nc=horiz?c+i:c;grid[nr][nc]='ship';} placed=true; }
    }
  }
  return grid;
}

export default function Battleship() {
  const [playerGrid, setPlayerGrid] = useState<Cell[][]>(placeShips);
  const [aiGrid, setAiGrid] = useState<Cell[][]>(placeShips);
  const [phase, setPhase] = useState<'play'|'over'>('play');
  const [winner, setWinner] = useState<'player'|'ai'|null>(null);
  const [aiShots, setAiShots] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState({player:0,ai:0});
  const [lastHit, setLastHit] = useState<string|null>(null);

  const countHits = (grid:Cell[][]) => grid.flat().filter(c=>c==='hit').length;
  const totalShip = SHIPS.reduce((a,b)=>a+b,0);

  const shoot = useCallback((r:number,c:number) => {
    if (phase!=='play' || aiGrid[r][c]==='hit' || aiGrid[r][c]==='miss') return;
    const ng = aiGrid.map(row=>[...row] as Cell[]);
    const hit = ng[r][c]==='ship';
    ng[r][c] = hit?'hit':'miss';
    setAiGrid(ng);
    setLastHit(hit?`${r}-${c}`:null);
    if (countHits(ng)===totalShip) { setPhase('over'); setWinner('player'); setScores(s=>({...s,player:s.player+1})); return; }
    // AI turn
    setTimeout(()=>{
      setPlayerGrid(prev=>{
        const pg = prev.map(row=>[...row] as Cell[]);
        const shots = new Set(aiShots);
        let ar:number, ac:number;
        do { ar=Math.floor(Math.random()*SIZE); ac=Math.floor(Math.random()*SIZE); } while(shots.has(`${ar}-${ac}`));
        shots.add(`${ar}-${ac}`);
        const aiHit = pg[ar][ac]==='ship';
        pg[ar][ac] = aiHit?'hit':'miss';
        setAiShots(shots);
        if (pg.flat().filter(c=>c==='hit').length===totalShip) { setPhase('over'); setWinner('ai'); setScores(s=>({...s,ai:s.ai+1})); }
        return pg;
      });
    },600);
  },[aiGrid,phase,aiShots,totalShip]);

  const reset = () => { setPlayerGrid(placeShips()); setAiGrid(placeShips()); setPhase('play'); setWinner(null); setAiShots(new Set()); setLastHit(null); };
  const cellSize = Math.min(32,Math.floor((Math.min(window.innerWidth-48,340))/SIZE));

  const Grid = ({grid,isPlayer,onShoot}:{grid:Cell[][],isPlayer:boolean,onShoot?:(r:number,c:number)=>void}) => (
    <div style={{display:'inline-block'}}>
      <div style={{color:'#64748b',fontSize:'0.72rem',fontWeight:700,marginBottom:'4px',textAlign:'center'}}>{isPlayer?'YOUR FLEET':'ENEMY FLEET'}</div>
      {grid.map((row,r)=>(
        <div key={r} style={{display:'flex'}}>
          {row.map((cell,c)=>{
            const show = isPlayer || cell==='hit' || cell==='miss';
            return (
              <div key={c} onClick={()=>!isPlayer&&onShoot&&onShoot(r,c)}
                style={{width:cellSize,height:cellSize,border:'1px solid #1e293b',cursor:!isPlayer&&cell!=='hit'&&cell!=='miss'?'pointer':'default',
                  background:cell==='hit'?'#ef444444':cell==='miss'?'#1e293b':show&&cell==='ship'?'#334155':'#0f172a',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:cellSize*0.55,
                }}
              >{cell==='hit'?'💥':cell==='miss'?'·':show&&cell==='ship'?'🚢':''}</div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <GameShell title="Battleship" emoji="🚢" onReset={reset} scores={[
      {label:'Wins',value:scores.player,color:'#38bdf8'},
      {label:'AI Wins',value:scores.ai,color:'#ef4444'},
    ]}>
      {winner && <div style={{textAlign:'center',marginBottom:'12px',color:winner==='player'?'#22c55e':'#ef4444',fontWeight:800,fontSize:'1rem'}}>{winner==='player'?'🏆 You sank the fleet!':'💀 AI sank your fleet!'}</div>}
      {!winner && <div style={{textAlign:'center',marginBottom:'12px',color:'#94a3b8',fontSize:'0.85rem',fontWeight:600}}>Click enemy grid to fire!</div>}
      <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
        <Grid grid={playerGrid} isPlayer={true} />
        <Grid grid={aiGrid} isPlayer={false} onShoot={shoot} />
      </div>
    </GameShell>
  );
}
