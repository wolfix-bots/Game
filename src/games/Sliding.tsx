import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

function makeSolvable(): number[] {
  let tiles=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
  // Shuffle with even number of swaps to keep solvable
  for(let i=0;i<200;i++){
    const z=tiles.indexOf(0);
    const neighbors=[];
    if(z%4>0) neighbors.push(z-1);
    if(z%4<3) neighbors.push(z+1);
    if(z>3) neighbors.push(z-4);
    if(z<12) neighbors.push(z+4);
    const n=neighbors[Math.floor(Math.random()*neighbors.length)];
    [tiles[z],tiles[n]]=[tiles[n],tiles[z]];
  }
  return tiles;
}

export default function Sliding() {
  const [tiles,setTiles]=useState<number[]>(makeSolvable);
  const [moves,setMoves]=useState(0);
  const [won,setWon]=useState(false);
  const [best,setBest]=useState(()=>Number(localStorage.getItem('sliding-best')||0));

  const click=useCallback((i:number)=>{
    if(won) return;
    const z=tiles.indexOf(0);
    const valid=(i===z-1&&z%4>0)||(i===z+1&&z%4<3)||(i===z-4)||(i===z+4);
    if(!valid) return;
    const nt=[...tiles]; [nt[z],nt[i]]=[nt[i],nt[z]];
    setTiles(nt); setMoves(m=>m+1);
    if(nt.every((v,i)=>v===(i===15?0:i+1))){
      setWon(true);
      const nm=moves+1;
      if(!best||nm<best){setBest(nm);localStorage.setItem('sliding-best',String(nm));}
      const score=Math.max(1000-nm*5,100);
      const u=getSession(); if(u) submitScore('sliding',u.username,u.avatar,score);
    }
  },[tiles,won,moves,best]);

  const reset=()=>{setTiles(makeSolvable());setMoves(0);setWon(false);};

  return (
    <GameShell title="15 Puzzle" emoji="🧩" gameId="sliding" onReset={reset} scores={[{label:'Moves',value:moves,color:'#f472b6'},{label:'Best',value:best||'—',color:'#fbbf24'}]}>
      {won&&<div style={{textAlign:'center',marginBottom:'12px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Solved in {moves} moves!</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',maxWidth:'280px',margin:'0 auto'}}>
        {tiles.map((t,i)=>(
          <motion.div key={t} layout onClick={()=>click(i)}
            whileHover={t?{scale:1.05}:{}}
            whileTap={t?{scale:0.95}:{}}
            style={{height:60,background:t?'#1e293b':'transparent',border:t?'2px solid #334155':'none',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.3rem',color:t===0?'transparent':won?'#22c55e':'#e2e8f0',cursor:t?'pointer':'default',boxShadow:t?'0 2px 8px rgba(0,0,0,0.3)':'none',transition:'background 0.15s'}}
          >{t||''}</motion.div>
        ))}
      </div>
      <div style={{textAlign:'center',marginTop:'12px',color:'#475569',fontSize:'0.78rem'}}>Click tiles adjacent to the empty space</div>
    </GameShell>
  );
}
