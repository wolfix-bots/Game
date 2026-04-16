import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const DIE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

type Category = 'ones'|'twos'|'threes'|'fours'|'fives'|'sixes'|'threeKind'|'fourKind'|'fullHouse'|'smStraight'|'lgStraight'|'yahtzee'|'chance';

const CATS: {id:Category,label:string}[] = [
  {id:'ones',label:'Ones'},{id:'twos',label:'Twos'},{id:'threes',label:'Threes'},
  {id:'fours',label:'Fours'},{id:'fives',label:'Fives'},{id:'sixes',label:'Sixes'},
  {id:'threeKind',label:'3 of a Kind'},{id:'fourKind',label:'4 of a Kind'},
  {id:'fullHouse',label:'Full House'},{id:'smStraight',label:'Sm. Straight'},
  {id:'lgStraight',label:'Lg. Straight'},{id:'yahtzee',label:'YAHTZEE!'},{id:'chance',label:'Chance'},
];

function score(dice: number[], cat: Category): number {
  const counts = [0,0,0,0,0,0,0];
  dice.forEach(d => counts[d]++);
  const sum = dice.reduce((a,b)=>a+b,0);
  const vals = counts.slice(1);
  switch(cat) {
    case 'ones': return counts[1]*1; case 'twos': return counts[2]*2; case 'threes': return counts[3]*3;
    case 'fours': return counts[4]*4; case 'fives': return counts[5]*5; case 'sixes': return counts[6]*6;
    case 'threeKind': return vals.some(v=>v>=3)?sum:0;
    case 'fourKind': return vals.some(v=>v>=4)?sum:0;
    case 'fullHouse': return (vals.some(v=>v===3)&&vals.some(v=>v===2))?25:0;
    case 'smStraight': { const s=new Set(dice); return ([[1,2,3,4],[2,3,4,5],[3,4,5,6]] as number[][]).some(seq=>seq.every((n:number)=>s.has(n)))?30:0; }
    case 'lgStraight': { const s=new Set(dice); return ([[1,2,3,4,5],[2,3,4,5,6]] as number[][]).some(seq=>seq.every(n=>s.has(n)))?40:0; }
    case 'yahtzee': return vals.some(v=>v===5)?50:0;
    case 'chance': return sum;
    default: return 0;
  }
}

export default function Yahtzee() {
  const [dice, setDice] = useState([1,1,1,1,1]);
  const [held, setHeld] = useState([false,false,false,false,false]);
  const [rolls, setRolls] = useState(0);
  const [scores, setScores] = useState<Partial<Record<Category,number>>>({});
  const [total, setTotal] = useState(0);

  const roll = () => {
    if (rolls >= 3) return;
    setDice(d => d.map((v,i) => held[i] ? v : Math.floor(Math.random()*6)+1));
    setRolls(r => r+1);
  };

  const toggleHold = (i: number) => {
    if (rolls===0||rolls>=3) return;
    setHeld(h => h.map((v,j) => j===i?!v:v));
  };

  const pick = (cat: Category) => {
    if (scores[cat]!==undefined || rolls===0) return;
    const s = score(dice, cat);
    setScores(prev => ({...prev,[cat]:s}));
    setTotal(t => t+s);
    setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0);
  };

  const done = Object.keys(scores).length === CATS.length;

  return (
    <GameShell title="Yahtzee" emoji="🎲" onReset={() => { setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0); setScores({}); setTotal(0); }} scores={[{ label:'Score', value:total, color:'#f97316' }]}>
      {/* Dice */}
      <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'16px' }}>
        {dice.map((d,i) => (
          <motion.button key={i} onClick={() => toggleHold(i)}
            whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            animate={{ rotate: rolls>0&&!held[i]?[0,15,-15,0]:0 }}
            style={{ width:56,height:56,borderRadius:'12px',border:`3px solid ${held[i]?'#f97316':'#334155'}`,background:held[i]?'#f97316':'#1e293b',fontSize:'2rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:held[i]?'0 0 12px #f97316':'none' }}
          >{DIE_FACES[d-1]}</motion.button>
        ))}
      </div>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'16px', alignItems:'center' }}>
        <button onClick={roll} disabled={rolls>=3||done}
          style={{ background:rolls>=3||done?'#1e293b':'#f97316',border:'none',borderRadius:'12px',padding:'10px 24px',color:rolls>=3||done?'#475569':'#fff',fontWeight:800,cursor:rolls>=3||done?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.95rem' }}
        >🎲 Roll ({3-rolls} left)</button>
        <div style={{ color:'#475569', fontSize:'0.8rem' }}>Hold dice before rolling</div>
      </div>
      {/* Scorecard */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', maxWidth:'360px', margin:'0 auto' }}>
        {CATS.map(cat => {
          const preview = scores[cat.id]===undefined && rolls>0 ? score(dice,cat.id) : null;
          const val = scores[cat.id];
          return (
            <button key={cat.id} onClick={() => pick(cat.id)} disabled={val!==undefined||rolls===0}
              style={{ padding:'8px 10px',borderRadius:'10px',border:`1px solid ${val!==undefined?'#334155':preview!==null?'#f97316':'#1e293b'}`,background:val!==undefined?'#1e293b':preview!==null?'#f9731611':'transparent',cursor:val!==undefined||rolls===0?'default':'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'Outfit,sans-serif' }}
            >
              <span style={{color:'#94a3b8',fontSize:'0.78rem',fontWeight:600}}>{cat.label}</span>
              <span style={{color:val!==undefined?'#e2e8f0':preview!==null?'#f97316':'#475569',fontWeight:700,fontSize:'0.85rem'}}>{val!==undefined?val:preview!==null?preview:'—'}</span>
            </button>
          );
        })}
      </div>
      {done&&<div style={{textAlign:'center',marginTop:'14px',color:'#f97316',fontWeight:800,fontSize:'1.2rem'}}>🎉 Final Score: {total}</div>}
    </GameShell>
  );
}
