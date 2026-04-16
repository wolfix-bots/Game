import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Cell = 'empty'|'ship'|'hit'|'miss';
const SIZE = 10;
const SHIPS = [5,4,3,3,2];

function placeShipsRandom(): Cell[][] {
  const grid: Cell[][] = Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty'));
  for (const len of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random()>0.5;
      const r = Math.floor(Math.random()*(SIZE-(horiz?0:len)));
      const c = Math.floor(Math.random()*(SIZE-(horiz?len:0)));
      const cells: [number,number][] = Array(len).fill(0).map((_,i)=>horiz?[r,c+i]:[r+i,c]);
      if (cells.every(([cr,cc])=>grid[cr][cc]==='empty')) {
        cells.forEach(([cr,cc])=>grid[cr][cc]='ship');
        placed=true;
      }
    }
  }
  return grid;
}

function aiShot(grid: Cell[][]): [number,number] {
  const hits: [number,number][] = [];
  grid.forEach((row,r)=>row.forEach((c,ci)=>{ if(c==='hit') hits.push([r,ci]); }));
  if (hits.length) {
    const [hr,hc] = hits[hits.length-1];
    const adj: [number,number][] = [[hr-1,hc],[hr+1,hc],[hr,hc-1],[hr,hc+1]];
    const valid = adj.filter(([r,c])=>r>=0&&r<SIZE&&c>=0&&c<SIZE&&grid[r][c]!=='hit'&&grid[r][c]!=='miss');
    if (valid.length) return valid[Math.floor(Math.random()*valid.length)];
  }
  const empty: [number,number][] = [];
  grid.forEach((row,r)=>row.forEach((c,ci)=>{ if(c!=='hit'&&c!=='miss') empty.push([r,ci]); }));
  return empty[Math.floor(Math.random()*empty.length)];
}

export default function Battleship() {
  const [phase, setPhase] = useState<'setup'|'play'|'over'>('setup');
  const [player, setPlayer] = useState<Cell[][]>(()=>placeShipsRandom());
  const [enemy, setEnemy] = useState<Cell[][]>(()=>placeShipsRandom());
  const [playerView, setPlayerView] = useState<Cell[][]>(()=>Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty')));
  const [winner, setWinner] = useState<'player'|'ai'|null>(null);
  const [scores, setScores] = useState({wins:0,losses:0});
  const [aiThinking, setAiThinking] = useState(false);

  const countShips = (g: Cell[][]) => g.flat().filter(c=>c==='ship').length;

  const shoot = useCallback((r: number, c: number) => {
    if (phase!=='play'||aiThinking) return;
    const cell = enemy[r][c];
    if (cell==='hit'||cell==='miss') return;
    const ne = enemy.map(row=>[...row]);
    const npv = playerView.map(row=>[...row]);
    ne[r][c] = cell==='ship'?'hit':'miss';
    npv[r][c] = ne[r][c];
    setEnemy(ne); setPlayerView(npv);
    if (!countShips(ne)) { setWinner('player'); setScores(s=>({...s,wins:s.wins+1})); setPhase('over'); return; }
    setAiThinking(true);
    setTimeout(()=>{
      const [ar,ac] = aiShot(player);
      const np = player.map(row=>[...row]);
      np[ar][ac] = np[ar][ac]==='ship'?'hit':'miss';
      setPlayer(np);
      if (!countShips(np)) { setWinner('ai'); setScores(s=>({...s,losses:s.losses+1})); setPhase('over'); }
      setAiThinking(false);
    },600);
  },[phase,enemy,player,playerView,aiThinking]);

  const reset = () => { setPhase('setup'); setPlayer(placeShipsRandom()); setEnemy(placeShipsRandom()); setPlayerView(Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty'))); setWinner(null); };

  const cellColor = (cell: Cell, isEnemy: boolean) => {
    if (cell==='hit') return '#ef4444';
    if (cell==='miss') return '#1e3a5f';
    if (!isEnemy&&cell==='ship') return '#3b82f6';
    return '#0f172a';
  };

  const cs = 28;

  return (
    <GameShell title="Battleship" emoji="🚢" onReset={reset} scores={[
      {label:'Wins',value:scores.wins,color:'#38bdf8'},
      {label:'Losses',value:scores.losses,color:'#ef4444'},
    ]}>
      {phase==='setup'&&(
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'2rem',marginBottom:'8px'}}>🚢</div>
          <div style={{color:'#94a3b8',marginBottom:'16px',fontSize:'0.9rem'}}>Ships placed randomly. Ready to battle?</div>
          <button onClick={()=>setPhase('play')} style={{background:'#38bdf8',border:'none',borderRadius:'14px',padding:'12px 32px',color:'#0f172a',fontWeight:800,fontSize:'1rem',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Start Battle!</button>
        </div>
      )}
      {phase!=='setup'&&(
        <div>
          {winner&&<div style={{textAlign:'center',marginBottom:'12px',color:winner==='player'?'#22c55e':'#ef4444',fontWeight:800,fontSize:'1.1rem'}}>{winner==='player'?'🏆 You Win!':'💀 AI Wins!'}</div>}
          {!winner&&<div style={{textAlign:'center',marginBottom:'8px',color:'#94a3b8',fontSize:'0.82rem',fontWeight:600}}>{aiThinking?'AI is shooting…':'Click enemy grid to fire!'}</div>}
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
            <div>
              <div style={{color:'#64748b',fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',marginBottom:'6px',textAlign:'center'}}>Your Fleet</div>
              <div style={{display:'inline-block',border:'2px solid #1e293b',borderRadius:'8px',overflow:'hidden'}}>
                {player.map((row,r)=>(
                  <div key={r} style={{display:'flex'}}>
                    {row.map((cell,c)=>(
                      <div key={c} style={{width:cs,height:cs,background:cellColor(cell,false),border:'1px solid #0f172a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem'}}>
                        {cell==='hit'?'💥':cell==='miss'?'•':''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{color:'#64748b',fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',marginBottom:'6px',textAlign:'center'}}>Enemy Waters</div>
              <div style={{display:'inline-block',border:'2px solid #1e293b',borderRadius:'8px',overflow:'hidden'}}>
                {playerView.map((row,r)=>(
                  <div key={r} style={{display:'flex'}}>
                    {row.map((cell,c)=>(
                      <div key={c} onClick={()=>shoot(r,c)}
                        style={{width:cs,height:cs,background:cellColor(cell,true),border:'1px solid #0f172a',cursor:phase==='play'&&cell==='empty'?'crosshair':'default',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',transition:'background 0.15s'}}
                      >{cell==='hit'?'💥':cell==='miss'?'•':''}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {phase==='over'&&<div style={{textAlign:'center',marginTop:'14px'}}><button onClick={reset} style={{background:'#38bdf8',border:'none',borderRadius:'12px',padding:'10px 24px',color:'#0f172a',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Play Again</button></div>}
        </div>
      )}
    </GameShell>
  );
}
