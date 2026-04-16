import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE = 4;
const GOAL = [...Array(SIZE*SIZE-1).keys()].map(i=>i+1).concat([0]);

function shuffle(tiles: number[]): number[] {
  let t = [...tiles];
  for (let i = t.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [t[i],t[j]]=[t[j],t[i]]; }
  // Ensure solvable
  const inv = t.filter(v=>v!==0).reduce((acc,v,i,arr) => acc + arr.slice(i+1).filter(w=>w<v&&w!==0).length, 0);
  const blankRow = Math.floor(t.indexOf(0)/SIZE);
  const parity = (inv + blankRow) % 2;
  if (parity !== 0) { const i=t.indexOf(1); const j=t.indexOf(2); [t[i],t[j]]=[t[j],t[i]]; }
  return t;
}

export default function Sliding() {
  const [tiles, setTiles] = useState(() => shuffle(GOAL));
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('sliding-best')||0));
  const won = tiles.join(',') === GOAL.join(',');

  const click = useCallback((i: number) => {
    if (won) return;
    const blank = tiles.indexOf(0);
    const br = Math.floor(blank/SIZE), bc = blank%SIZE;
    const cr = Math.floor(i/SIZE), cc = i%SIZE;
    if ((Math.abs(br-cr)===1&&bc===cc)||(Math.abs(bc-cc)===1&&br===cr)) {
      const nt=[...tiles]; [nt[blank],nt[i]]=[nt[i],nt[blank]];
      setTiles(nt);
      const nm=moves+1; setMoves(nm);
      if (nt.join(',')===GOAL.join(',')) {
        if (!best||nm<best){setBest(nm);localStorage.setItem('sliding-best',String(nm));}
      }
    }
  }, [tiles, moves, won, best]);

  const reset = () => { setTiles(shuffle(GOAL)); setMoves(0); };

  return (
    <GameShell title="15 Puzzle" emoji="🧩" onReset={reset} scores={[
      { label:'Moves', value:moves, color:'#f472b6' },
      { label:'Best', value:best||'—', color:'#fbbf24' },
    ]}>
      {won && <div style={{ textAlign:'center', color:'#22c55e', fontWeight:800, fontSize:'1.1rem', marginBottom:'12px' }}>🎉 Solved in {moves} moves!</div>}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${SIZE},1fr)`, gap:'6px', maxWidth:'280px', margin:'0 auto' }}>
        {tiles.map((val,i) => (
          <motion.div key={val} layout onClick={()=>click(i)}
            transition={{ type:'spring', stiffness:400, damping:30 }}
            style={{ height:60, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center',
              background: val===0?'#0f172a':'#3b82f6', color:'#fff', fontWeight:900, fontSize:'1.3rem',
              cursor: val===0?'default':'pointer', border: val===0?'2px dashed #1e293b':'none',
              boxShadow: val===0?'none':'0 4px 12px rgba(59,130,246,0.3)',
            }}
          >{val||''}</motion.div>
        ))}
      </div>
    </GameShell>
  );
}
