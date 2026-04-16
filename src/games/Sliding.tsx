import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 4;
const GOAL = [...Array(SIZE*SIZE-1).keys()].map(i=>i+1).concat([0]);

function shuffle(): number[] {
  let tiles = [...GOAL];
  for (let i=0;i<1000;i++) {
    const zi = tiles.indexOf(0);
    const r=Math.floor(zi/SIZE), c=zi%SIZE;
    const moves:number[]=[];
    if(r>0)moves.push(zi-SIZE);if(r<SIZE-1)moves.push(zi+SIZE);if(c>0)moves.push(zi-1);if(c<SIZE-1)moves.push(zi+1);
    const swap=moves[Math.floor(Math.random()*moves.length)];
    [tiles[zi],tiles[swap]]=[tiles[swap],tiles[zi]];
  }
  return tiles;
}

export default function Sliding() {
  const [tiles, setTiles] = useState<number[]>(shuffle);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(()=>Number(localStorage.getItem('sliding-best')||0));
  const won = tiles.join(',')=== GOAL.join(',');

  const click = useCallback((i:number) => {
    if (won) return;
    const zi = tiles.indexOf(0);
    const r=Math.floor(i/SIZE),c=i%SIZE,zr=Math.floor(zi/SIZE),zc=zi%SIZE;
    if (Math.abs(r-zr)+Math.abs(c-zc)!==1) return;
    const nt=[...tiles]; [nt[i],nt[zi]]=[nt[zi],nt[i]];
    setTiles(nt); setMoves(m=>m+1);
    if (nt.join(',')=== GOAL.join(',')) {
      const nm=moves+1;
      if (best===0||nm<best){setBest(nm);localStorage.setItem('sliding-best',String(nm));}
    }
  },[tiles,won,moves,best]);

  const reset = () => { setTiles(shuffle()); setMoves(0); };
  const cellSize = Math.min(80,Math.floor((Math.min(window.innerWidth-48,360))/SIZE));

  return (
    <GameShell title="15 Puzzle" emoji="🧩" onReset={reset} scores={[
      {label:'Moves',value:moves,color:'#f472b6'},
      {label:'Best',value:best||'-',color:'#fbbf24'},
    ]}>
      {won && <div style={{textAlign:'center',marginBottom:'12px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Solved in {moves} moves!</div>}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${SIZE},1fr)`,gap:'6px',maxWidth:SIZE*cellSize+SIZE*6,margin:'0 auto'}}>
        {tiles.map((val,i)=>(
          <motion.div key={val} layout onClick={()=>click(i)}
            transition={{type:'spring',stiffness:400,damping:30}}
            style={{height:cellSize,borderRadius:'12px',background:val===0?'transparent':won?'#22c55e22':'#1e293b',border:val===0?'2px dashed #334155':`2px solid ${won?'#22c55e':'#475569'}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:cellSize*0.35,color:won?'#22c55e':'#e2e8f0',cursor:val===0?'default':'pointer',boxShadow:val===0?'none':'0 2px 8px rgba(0,0,0,0.3)'}}
          >{val||''}</motion.div>
        ))}
      </div>
    </GameShell>
  );
}
