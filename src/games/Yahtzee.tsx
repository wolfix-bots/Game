import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const CATEGORIES = [
  {id:'ones',label:'Ones',desc:'Sum of 1s'},
  {id:'twos',label:'Twos',desc:'Sum of 2s'},
  {id:'threes',label:'Threes',desc:'Sum of 3s'},
  {id:'fours',label:'Fours',desc:'Sum of 4s'},
  {id:'fives',label:'Fives',desc:'Sum of 5s'},
  {id:'sixes',label:'Sixes',desc:'Sum of 6s'},
  {id:'threeofakind',label:'3 of a Kind',desc:'Sum all if 3 match'},
  {id:'fourofakind',label:'4 of a Kind',desc:'Sum all if 4 match'},
  {id:'fullhouse',label:'Full House',desc:'25pts'},
  {id:'smallstraight',label:'Sm. Straight',desc:'30pts'},
  {id:'largestraight',label:'Lg. Straight',desc:'40pts'},
  {id:'yahtzee',label:'YAHTZEE!',desc:'50pts'},
  {id:'chance',label:'Chance',desc:'Sum all dice'},
];

function calcScore(id:string, dice:number[]): number {
  const counts: Record<number,number> = {};
  dice.forEach(d => counts[d]=(counts[d]||0)+1);
  const vals = Object.values(counts);
  const sum = dice.reduce((a,b)=>a+b,0);
  const sorted = [...dice].sort();
  const isSmall = (d:number[]) => { const s=new Set(d); return (s.has(1)&&s.has(2)&&s.has(3)&&s.has(4))||(s.has(2)&&s.has(3)&&s.has(4)&&s.has(5))||(s.has(3)&&s.has(4)&&s.has(5)&&s.has(6)); };
  const isLarge = (d:number[]) => { const s=[...new Set(d)].sort().join(''); return s==='12345'||s==='23456'; };
  switch(id) {
    case 'ones': return dice.filter(d=>d===1).reduce((a,b)=>a+b,0);
    case 'twos': return dice.filter(d=>d===2).reduce((a,b)=>a+b,0);
    case 'threes': return dice.filter(d=>d===3).reduce((a,b)=>a+b,0);
    case 'fours': return dice.filter(d=>d===4).reduce((a,b)=>a+b,0);
    case 'fives': return dice.filter(d=>d===5).reduce((a,b)=>a+b,0);
    case 'sixes': return dice.filter(d=>d===6).reduce((a,b)=>a+b,0);
    case 'threeofakind': return vals.some(v=>v>=3)?sum:0;
    case 'fourofakind': return vals.some(v=>v>=4)?sum:0;
    case 'fullhouse': return (vals.includes(3)&&vals.includes(2))||vals.includes(5)?25:0;
    case 'smallstraight': return isSmall(dice)?30:0;
    case 'largestraight': return isLarge(dice)?40:0;
    case 'yahtzee': return vals.includes(5)?50:0;
    case 'chance': return sum;
    default: return 0;
  }
}

const DICE_FACE = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Yahtzee() {
  const [dice, setDice] = useState([1,1,1,1,1]);
  const [held, setHeld] = useState([false,false,false,false,false]);
  const [rolls, setRolls] = useState(3);
  const [scores, setScores] = useState<Record<string,number|null>>({});
  const [turn, setTurn] = useState(1);
  const [rolling, setRolling] = useState(false);

  const totalScore = Object.values(scores).filter(v=>v!==null).reduce((a,b)=>a!+(b||0),0);
  const done = CATEGORIES.every(c=>scores[c.id]!==undefined&&scores[c.id]!==null);

  const roll = () => {
    if (rolls<=0||rolling) return;
    setRolling(true);
    setTimeout(()=>{
      setDice(d=>d.map((v,i)=>held[i]?v:Math.ceil(Math.random()*6)));
      setRolls(r=>r-1); setRolling(false);
    },300);
  };

  const score = (id:string) => {
    if (scores[id]!==undefined||rolls===3) return;
    const s = calcScore(id,dice);
    setScores(prev=>({...prev,[id]:s}));
    setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(3); setTurn(t=>t+1);
  };

  const reset = () => { setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(3); setScores({}); setTurn(1); };

  return (
    <GameShell title="Yahtzee" emoji="🎲" onReset={reset} scores={[{label:'Score',value:totalScore,color:'#f97316'},{label:'Turn',value:turn,color:'#94a3b8'}]}>
      {done && <div style={{textAlign:'center',marginBottom:'12px',color:'#f97316',fontWeight:800,fontSize:'1.1rem'}}>🎉 Final Score: {totalScore}</div>}
      {/* Dice */}
      <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'14px',flexWrap:'wrap'}}>
        {dice.map((d,i)=>(
          <motion.button key={i} onClick={()=>setHeld(h=>{const nh=[...h];nh[i]=!nh[i];return nh;})}
            animate={{rotate:rolling&&!held[i]?[0,15,-15,0]:0}} transition={{duration:0.3}}
            style={{width:60,height:60,borderRadius:'14px',border:`3px solid ${held[i]?'#f97316':'#334155'}`,background:held[i]?'#f9730622':'#1e293b',cursor:'pointer',fontSize:'2.2rem',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:held[i]?'0 0 12px #f9730644':'none'}}
          >{DICE_FACE[d]}</motion.button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={roll} disabled={rolls<=0||done}
          style={{background:rolls>0&&!done?'#f97316':'#334155',border:'none',borderRadius:'12px',padding:'10px 28px',color:rolls>0&&!done?'#fff':'#64748b',fontWeight:800,cursor:rolls>0&&!done?'pointer':'not-allowed',fontFamily:'Outfit,sans-serif',fontSize:'0.95rem'}}
        >🎲 Roll ({rolls} left)</button>
        <div style={{color:'#64748b',fontSize:'0.8rem'}}>Click dice to hold</div>
      </div>
      {/* Scorecard */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',maxWidth:'380px',margin:'0 auto'}}>
        {CATEGORIES.map(cat=>{
          const val = scores[cat.id];
          const preview = rolls<3&&val===undefined?calcScore(cat.id,dice):null;
          return (
            <button key={cat.id} onClick={()=>score(cat.id)} disabled={val!==undefined||rolls===3}
              style={{padding:'8px 10px',borderRadius:'10px',border:`1px solid ${val!==undefined?'#334155':preview&&preview>0?'#f9730644':'#334155'}`,background:val!==undefined?'#1e293b':preview&&preview>0?'#f9730611':'#0f172a',cursor:val===undefined&&rolls<3?'pointer':'default',textAlign:'left',fontFamily:'Outfit,sans-serif'}}
            >
              <div style={{color:val!==undefined?'#64748b':'#e2e8f0',fontWeight:700,fontSize:'0.75rem'}}>{cat.label}</div>
              <div style={{color:val!==undefined?'#f97316':preview!==null?'#f97316aa':'#475569',fontWeight:800,fontSize:'0.9rem'}}>{val!==undefined?val:preview!==null?`+${preview}`:'-'}</div>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
