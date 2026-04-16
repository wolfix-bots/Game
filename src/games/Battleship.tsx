import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

const SIZE=10;
type Cell='empty'|'ship'|'hit'|'miss';
const SHIPS=[5,4,3,3,2];

function placeShips():Cell[][] {
  const grid:Cell[][]=Array(SIZE).fill(null).map(()=>Array(SIZE).fill('empty'));
  for(const len of SHIPS){
    let placed=false;
    while(!placed){
      const horiz=Math.random()>0.5;
      const r=Math.floor(Math.random()*(horiz?SIZE:SIZE-len));
      const c=Math.floor(Math.random()*(horiz?SIZE-len:SIZE));
      let ok=true;
      for(let i=0;i<len;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);if(grid[nr][nc]==='ship'){ok=false;break;}}
      if(ok){for(let i=0;i<len;i++){const nr=r+(horiz?0:i),nc=c+(horiz?i:0);grid[nr][nc]='ship';}placed=true;}
    }
  }
  return grid;
}

function aiShot(grid:Cell[][],tried:Set<string>):[number,number]{
  // Hunt mode: find adjacent to hits
  const hits:number[][]=[];
  grid.forEach((row,r)=>row.forEach((v,c)=>{if(v==='hit')hits.push([r,c]);}));
  if(hits.length){
    for(const [hr,hc] of hits){
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nr=hr+dr,nc=hc+dc;
        if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&!tried.has(`${nr},${nc}`)&&grid[nr][nc]!=='miss')return[nr,nc];
      }
    }
  }
  let r,c;
  do{r=Math.floor(Math.random()*SIZE);c=Math.floor(Math.random()*SIZE);}while(tried.has(`${r},${c}`));
  return[r,c];
}

export default function Battleship() {
  const [playerGrid,setPlayerGrid]=useState<Cell[][]>(()=>placeShips());
  const [aiGrid,setAiGrid]=useState<Cell[][]>(()=>placeShips());
  const [aiTried,setAiTried]=useState<Set<string>>(new Set());
  const [phase,setPhase]=useState<'play'|'won'|'lost'>('play');
  const [turn,setTurn]=useState<'player'|'ai'>('player');
  const [message,setMessage]=useState('Sink the enemy fleet!');

  const playerShots=aiGrid.flat().filter(v=>v==='hit'||v==='miss').length;
  const playerHits=aiGrid.flat().filter(v=>v==='hit').length;
  const aiHits=playerGrid.flat().filter(v=>v==='hit').length;
  const totalShipCells=SHIPS.reduce((a,b)=>a+b,0);

  const shoot=useCallback((r:number,c:number)=>{
    if(phase!=='play'||turn!=='player') return;
    if(aiGrid[r][c]==='hit'||aiGrid[r][c]==='miss') return;
    const ng=aiGrid.map(row=>[...row]) as Cell[][];
    const hit=ng[r][c]==='ship';
    ng[r][c]=hit?'hit':'miss';
    setAiGrid(ng);
    const newHits=ng.flat().filter(v=>v==='hit').length;
    if(newHits>=totalShipCells){setPhase('won');setMessage('🏆 You sank the fleet!');return;}
    setMessage(hit?'💥 Hit!':'💧 Miss!');
    setTurn('ai');
    setTimeout(()=>{
      setPlayerGrid(prev=>{
        const pg=prev.map(row=>[...row]) as Cell[][];
        const tried=new Set(aiTried);
        const [ar,ac]=aiShot(pg,tried);
        tried.add(`${ar},${ac}`);
        const aiHit=pg[ar][ac]==='ship';
        pg[ar][ac]=aiHit?'hit':'miss';
        setAiTried(tried);
        const newAiHits=pg.flat().filter(v=>v==='hit').length;
        if(newAiHits>=totalShipCells){setPhase('lost');setMessage('💔 Your fleet was sunk!');}
        else setMessage(aiHit?'🤖 AI hit your ship!':'🤖 AI missed!');
        setTurn('player');
        return pg;
      });
    },700);
  },[aiGrid,playerGrid,aiTried,phase,turn,totalShipCells]);

  const reset=()=>{setPlayerGrid(placeShips());setAiGrid(placeShips());setAiTried(new Set());setPhase('play');setTurn('player');setMessage('Sink the enemy fleet!');};

  const cellColor=(v:Cell,isPlayer:boolean)=>{
    if(v==='hit') return '#ef4444';
    if(v==='miss') return '#334155';
    if(v==='ship'&&isPlayer) return '#3b82f6';
    return '#1e293b';
  };

  const cs=Math.min(28,Math.floor((window.innerWidth-80)/(SIZE*2+2)));

  return (
    <GameShell title="Battleship" emoji="🚢" onReset={reset} scores={[
      {label:'Your Hits',value:playerHits,color:'#22c55e'},
      {label:'AI Hits',value:aiHits,color:'#ef4444'},
    ]}>
      <div style={{textAlign:'center',marginBottom:'12px',fontWeight:700,color:phase==='won'?'#22c55e':phase==='lost'?'#ef4444':'#94a3b8'}}>{message}</div>
      <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
        {[{grid:playerGrid,label:'Your Fleet',isPlayer:true},{grid:aiGrid,label:'Enemy Waters',isPlayer:false}].map(({grid,label,isPlayer})=>(
          <div key={label}>
            <div style={{color:'#64748b',fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',marginBottom:'6px',textAlign:'center'}}>{label}</div>
            <div style={{border:'2px solid #1e293b',borderRadius:'8px',overflow:'hidden',display:'inline-block'}}>
              {grid.map((row,r)=>(
                <div key={r} style={{display:'flex'}}>
                  {row.map((cell,c)=>(
                    <div key={c}
                      onClick={()=>!isPlayer&&shoot(r,c)}
                      style={{width:cs,height:cs,background:cellColor(cell,isPlayer),borderRight:'1px solid #0f172a',borderBottom:'1px solid #0f172a',cursor:!isPlayer&&cell==='empty'?'crosshair':'default',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:cs*0.5,
                        transition:'background 0.2s',
                      }}
                    >{cell==='hit'?'💥':cell==='miss'?'•':''}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameShell>
  );
}
