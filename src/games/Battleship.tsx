import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 10;
const SHIPS = [{name:'Carrier',size:5},{name:'Battleship',size:4},{name:'Cruiser',size:3},{name:'Submarine',size:3},{name:'Destroyer',size:2}];
type Cell = 'empty'|'ship'|'hit'|'miss';

function makeGrid(): Cell[][] { return Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty')); }

function placeShipsRandom(): Cell[][] {
  const grid = makeGrid();
  for(const ship of SHIPS){
    let placed=false;
    while(!placed){
      const horiz=Math.random()>0.5;
      const r=Math.floor(Math.random()*(SIZE-(horiz?0:ship.size)));
      const c=Math.floor(Math.random()*(SIZE-(horiz?ship.size:0)));
      let ok=true;
      for(let i=0;i<ship.size;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);if(grid[nr][nc]!=='empty'){ok=false;break;}}
      if(ok){for(let i=0;i<ship.size;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);grid[nr][nc]='ship';}placed=true;}
    }
  }
  return grid;
}

function checkSunk(grid: Cell[][]): boolean { return !grid.flat().includes('ship'); }

function aiShoot(grid: Cell[][], tried: Set<string>): [number,number] {
  // Hunt: find adjacent to hits
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    if(grid[r][c]==='hit'){
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&!tried.has(`${nr}-${nc}`)&&grid[nr][nc]!=='miss') return [nr,nc];
      }
    }
  }
  // Random
  let r,c;
  do{r=Math.floor(Math.random()*SIZE);c=Math.floor(Math.random()*SIZE);}while(tried.has(`${r}-${c}`));
  return [r,c];
}

type Phase = 'place'|'battle'|'over';

export default function Battleship() {
  const [playerGrid,setPlayerGrid]=useState<Cell[][]>(makeGrid);
  const [aiGrid,setAiGrid]=useState<Cell[][]>(()=>placeShipsRandom());
  const [aiVisible,setAiVisible]=useState<Cell[][]>(makeGrid);
  const [phase,setPhase]=useState<Phase>('place');
  const [placingShip,setPlacingShip]=useState(0);
  const [horiz,setHoriz]=useState(true);
  const [hover,setHover]=useState<[number,number]|null>(null);
  const [aiTried,setAiTried]=useState<Set<string>>(new Set());
  const [playerTried,setPlayerTried]=useState<Set<string>>(new Set());
  const [winner,setWinner]=useState<'player'|'ai'|null>(null);
  const [msg,setMsg]=useState('');
  const [scores,setScores]=useState({p:0,ai:0});
  const [turn,setTurn]=useState<'player'|'ai'>('player');

  const canPlace=(grid:Cell[][],r:number,c:number,size:number,h:boolean)=>{
    for(let i=0;i<size;i++){const nr=r+(h?0:i),nc=c+(h?i:0);if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&grid[nr][nc]==='ship') return false;if(nr<0||nr>=SIZE||nc<0||nc>=SIZE) return false;}
    return true;
  };

  const placeShip=(r:number,c:number)=>{
    if(phase!=='place'||placingShip>=SHIPS.length) return;
    const ship=SHIPS[placingShip];
    if(!canPlace(playerGrid,r,c,ship.size,horiz)) return;
    const ng=playerGrid.map(row=>[...row]);
    for(let i=0;i<ship.size;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);ng[nr][nc]='ship';}
    setPlayerGrid(ng);
    if(placingShip+1>=SHIPS.length){setPhase('battle');setMsg('Your turn! Click the enemy grid.');}
    else setPlacingShip(p=>p+1);
  };

  const shoot=(r:number,c:number)=>{
    if(phase!=='battle'||turn!=='player'||playerTried.has(`${r}-${c}`)) return;
    const ng=[...aiGrid.map(row=>[...row])];
    const nv=[...aiVisible.map(row=>[...row])];
    const hit=ng[r][c]==='ship';
    ng[r][c]=hit?'hit':'miss';
    nv[r][c]=hit?'hit':'miss';
    setAiGrid(ng); setAiVisible(nv);
    const nt=new Set(playerTried); nt.add(`${r}-${c}`); setPlayerTried(nt);
    if(hit&&checkSunk(ng)){setWinner('player');setPhase('over');setScores(s=>({...s,p:s.p+1}));setMsg('🎉 You sank the fleet!');return;}
    setMsg(hit?'💥 Hit!':'💧 Miss!');
    setTurn('ai');
    setTimeout(()=>{
      const nat=new Set(aiTried);
      const [ar,ac]=aiShoot(playerGrid,nat);
      nat.add(`${ar}-${ac}`); setAiTried(nat);
      const apg=playerGrid.map(row=>[...row]);
      const ahit=apg[ar][ac]==='ship';
      apg[ar][ac]=ahit?'hit':'miss';
      setPlayerGrid(apg);
      if(ahit&&checkSunk(apg)){setWinner('ai');setPhase('over');setScores(s=>({...s,ai:s.ai+1}));setMsg('💀 AI sank your fleet!');return;}
      setMsg(ahit?'AI hit your ship! 💥':'AI missed! Your turn.'); setTurn('player');
    },800);
  };

  const reset=()=>{setPlayerGrid(makeGrid());setAiGrid(placeShipsRandom());setAiVisible(makeGrid());setPhase('place');setPlacingShip(0);setHoriz(true);setAiTried(new Set());setPlayerTried(new Set());setWinner(null);setMsg('');setTurn('player');};

  const getHoverCells=()=>{
    if(!hover||phase!=='place') return new Set<string>();
    const ship=SHIPS[placingShip]; const [r,c]=hover; const cells=new Set<string>();
    for(let i=0;i<ship.size;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);cells.add(`${nr}-${nc}`);}
    return cells;
  };
  const hoverCells=getHoverCells();
  const hoverOk=hover&&canPlace(playerGrid,hover[0],hover[1],SHIPS[placingShip]?.size||0,horiz);

  const cellColor=(cell:Cell,isAi=false,r=0,c=0)=>{
    if(cell==='hit') return '#ef4444';
    if(cell==='miss') return '#334155';
    if(!isAi&&cell==='ship') return '#3b82f6';
    return '#1e293b';
  };

  return (
    <GameShell title="Battleship" emoji="🚢" gameId="battleship" onReset={reset} scores={[{label:'You',value:scores.p,color:'#38bdf8'},{label:'AI',value:scores.ai,color:'#ef4444'}]}>
      {phase==='place'&&(
        <div style={{textAlign:'center',marginBottom:'12px'}}>
          <div style={{color:'#38bdf8',fontWeight:700,marginBottom:'8px'}}>Place your {SHIPS[placingShip].name} ({SHIPS[placingShip].size} cells)</div>
          <button onClick={()=>setHoriz(h=>!h)} style={{background:'#1e293b',border:'2px solid #334155',borderRadius:'10px',padding:'6px 16px',color:'#94a3b8',cursor:'pointer',fontWeight:600,fontFamily:'Outfit,sans-serif'}}>
            Rotate: {horiz?'Horizontal →':'Vertical ↓'}
          </button>
        </div>
      )}
      {msg&&<div style={{textAlign:'center',marginBottom:'10px',color:'#e2e8f0',fontWeight:700,background:'#1e293b',borderRadius:'10px',padding:'8px'}}>{msg}</div>}

      <div style={{display:'flex',gap:'24px',justifyContent:'center',flexWrap:'wrap'}}>
        {/* Player grid */}
        <div>
          <div style={{color:'#94a3b8',fontSize:'0.75rem',fontWeight:700,textAlign:'center',marginBottom:'6px'}}>YOUR FLEET</div>
          <div style={{border:'2px solid #334155',borderRadius:'8px',overflow:'hidden'}}>
            {playerGrid.map((row,r)=>(
              <div key={r} style={{display:'flex'}}>
                {row.map((cell,c)=>{
                  const isHover=hoverCells.has(`${r}-${c}`);
                  return (
                    <div key={c}
                      onClick={()=>phase==='place'&&placeShip(r,c)}
                      onMouseEnter={()=>phase==='place'&&setHover([r,c])}
                      onMouseLeave={()=>setHover(null)}
                      style={{width:30,height:30,background:isHover?(hoverOk?'#22c55e44':'#ef444444'):cellColor(cell),border:'1px solid #0f172a',cursor:phase==='place'?'pointer':'default',transition:'background 0.1s'}}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* AI grid */}
        {phase!=='place'&&(
          <div>
            <div style={{color:'#94a3b8',fontSize:'0.75rem',fontWeight:700,textAlign:'center',marginBottom:'6px'}}>ENEMY WATERS</div>
            <div style={{border:'2px solid #334155',borderRadius:'8px',overflow:'hidden'}}>
              {aiVisible.map((row,r)=>(
                <div key={r} style={{display:'flex'}}>
                  {row.map((cell,c)=>(
                    <div key={c} onClick={()=>shoot(r,c)}
                      style={{width:30,height:30,background:cellColor(cell,true,r,c),border:'1px solid #0f172a',cursor:phase==='battle'&&turn==='player'&&!playerTried.has(`${r}-${c}`)?'crosshair':'default',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem'}}
                    >{cell==='hit'?'💥':cell==='miss'?'·':''}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {phase==='over'&&(
        <div style={{textAlign:'center',marginTop:'16px'}}>
          <button onClick={reset} style={{background:'#38bdf8',border:'none',borderRadius:'12px',padding:'10px 24px',color:'#0f172a',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Play Again</button>
        </div>
      )}
    </GameShell>
  );
}
