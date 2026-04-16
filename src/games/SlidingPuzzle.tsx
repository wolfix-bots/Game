import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  // Ensure solvable
  const inv = a.filter(v=>v!==0).reduce((cnt,v,i,arr)=>cnt+arr.slice(i+1).filter(u=>u<v&&u!==0).length,0);
  if (inv%2!==0) { const i=a.indexOf(1),j=a.indexOf(2); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

export default function SlidingPuzzle() {
  const [tiles, setTiles] = useState<number[]>(()=>shuffle([...Array(16).keys()]));
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(()=>Number(localStorage.getItem('slide-best')||0));
  const won = tiles.every((v,i)=>v===(i+1)%16);

  const click = useCallback((i: number) => {
    if (won) return;
    const z = tiles.indexOf(0);
    const zr=Math.floor(z/4),zc=z%4,ir=Math.floor(i/4),ic=i%4;
    if (Math.abs(zr-ir)+Math.abs(zc-ic)!==1) return;
    const nt=[...tiles]; [nt[z],nt[i]]=[nt[i],nt[z]];
    setTiles(nt); setMoves(m=>m+1);
    if (nt.every((v,idx)=>v===(idx+1)%16)) {
      const nm=moves+1;
      if (!best||nm<best){setBest(nm);localStorage.setItem('slide-best',String(nm));}
    }
  },[tiles,won,moves,best]);

  const reset = () => { setTiles(shuffle([...Array(16).keys()])); setMoves(0); };

  return (
    <GameShell title="15 Puzzle" emoji="🧩" onReset={reset} scores={[
      {label:'Moves',value:moves,color:'#f472b6'},
      {label:'Best',value:best||'—',color:'#fbbf24'},
    ]}>
      {won&&<div style={{textAlign:'center',marginBottom:'12px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Solved in {moves} moves!</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',maxWidth:'280px',margin:'0 auto'}}>
        {tiles.map((val,i)=>(
          <motion.button key={val} layout onClick={()=>click(i)}
            transition={{type:'spring',stiffness:500,damping:30}}
            style={{height:60,borderRadius:'12px',border:`2px solid ${val===0?'transparent':'#334155'}`,background:val===0?'transparent':val===(i+1)%16&&won?'#22c55e22':'#1e293b',cursor:val===0?'default':'pointer',fontWeight:800,fontSize:'1.2rem',color:'#e2e8f0',fontFamily:'Outfit,sans-serif',boxShadow:val===0?'none':'0 2px 8px rgba(0,0,0,0.3)'}}
          >{val===0?'':val}</motion.button>
        ))}
      </div>
    </GameShell>
  );
}
