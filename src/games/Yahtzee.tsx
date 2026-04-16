import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const CATEGORIES = [
  {id:'ones',label:'Ones',calc:(d:number[])=>d.filter(v=>v===1).reduce((a,b)=>a+b,0)},
  {id:'twos',label:'Twos',calc:(d:number[])=>d.filter(v=>v===2).reduce((a,b)=>a+b,0)},
  {id:'threes',label:'Threes',calc:(d:number[])=>d.filter(v=>v===3).reduce((a,b)=>a+b,0)},
  {id:'fours',label:'Fours',calc:(d:number[])=>d.filter(v=>v===4).reduce((a,b)=>a+b,0)},
  {id:'fives',label:'Fives',calc:(d:number[])=>d.filter(v=>v===5).reduce((a,b)=>a+b,0)},
  {id:'sixes',label:'Sixes',calc:(d:number[])=>d.filter(v=>v===6).reduce((a,b)=>a+b,0)},
  {id:'threeoak',label:'3 of a Kind',calc:(d:number[])=>Object.values(d.reduce((a,v)=>({...a,[v]:(a[v]||0)+1}),{} as Record<number,number>)).some(c=>c>=3)?d.reduce((a,b)=>a+b,0):0},
  {id:'fouroak',label:'4 of a Kind',calc:(d:number[])=>Object.values(d.reduce((a,v)=>({...a,[v]:(a[v]||0)+1}),{} as Record<number,number>)).some(c=>c>=4)?d.reduce((a,b)=>a+b,0):0},
  {id:'fullhouse',label:'Full House',calc:(d:number[])=>{const c=Object.values(d.reduce((a,v)=>({...a,[v]:(a[v]||0)+1}),{} as Record<number,number>)).sort();return (c.length===2&&c[0]===2&&c[1]===3)||(c.length===2&&c[0]===3&&c[1]===2)?25:0;}},
  {id:'smstraight',label:'Sm. Straight',calc:(d:number[])=>{const u=[...new Set(d)].sort();for(let i=0;i<=u.length-4;i++)if(u[i+1]===u[i]+1&&u[i+2]===u[i]+2&&u[i+3]===u[i]+3)return 30;return 0;}},
  {id:'lgstraight',label:'Lg. Straight',calc:(d:number[])=>{const u=[...new Set(d)].sort();return u.length===5&&u[4]-u[0]===4?40:0;}},
  {id:'yahtzee',label:'YAHTZEE!',calc:(d:number[])=>new Set(d).size===1?50:0},
  {id:'chance',label:'Chance',calc:(d:number[])=>d.reduce((a,b)=>a+b,0)},
];

const DICE_FACES = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Yahtzee() {
  const [dice, setDice] = useState([1,1,1,1,1]);
  const [held, setHeld] = useState([false,false,false,false,false]);
  const [rolls, setRolls] = useState(0);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [total, setTotal] = useState(0);
  const [over, setOver] = useState(false);

  const roll = () => {
    if (rolls >= 3) return;
    setDice(d => d.map((v,i) => held[i] ? v : Math.ceil(Math.random()*6)));
    setRolls(r => r+1);
  };

  const score = (cat: typeof CATEGORIES[0]) => {
    if (scores[cat.id] !== undefined || rolls === 0) return;
    const val = cat.calc(dice);
    const ns = {...scores, [cat.id]: val};
    setScores(ns);
    const nt = Object.values(ns).reduce((a,b)=>a+b,0);
    setTotal(nt);
    setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0);
    if (Object.keys(ns).length === CATEGORIES.length) setOver(true);
  };

  const reset = () => { setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0); setScores({}); setTotal(0); setOver(false); };

  return (
    <GameShell title="Yahtzee" emoji="🎲" onReset={reset} scores={[{label:'Total',value:total,color:'#f97316'}]}>
      {over && <div style={{textAlign:'center',marginBottom:'12px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Game Over! Final: {total}</div>}
      {/* Dice */}
      <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'16px'}}>
        {dice.map((d,i)=>(
          <motion.button key={i} onClick={()=>setHeld(h=>{const nh=[...h];nh[i]=!nh[i];return nh;})}
            whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            animate={rolls>0&&!held[i]?{rotate:[0,-10,10,-5,5,0]}:{}}
            transition={{duration:0.3}}
            style={{width:56,height:56,borderRadius:'12px',border:`3px solid ${held[i]?'#f97316':'#334155'}`,background:held[i]?'#f9730622':'#1e293b',cursor:'pointer',fontSize:'2rem',display:'flex',alignItems:'center',justifyContent:'center'}}
          >{DICE_FACES[d]}</motion.button>
        ))}
      </div>
      <div style={{textAlign:'center',marginBottom:'12px'}}>
        <button onClick={roll} disabled={rolls>=3||over}
          style={{background:rolls>=3||over?'#334155':'#f97316',border:'none',borderRadius:'12px',padding:'10px 28px',color:rolls>=3||over?'#64748b':'#fff',fontWeight:800,cursor:rolls>=3||over?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',marginRight:'8px'}}
        >🎲 Roll ({3-rolls} left)</button>
        <span style={{color:'#64748b',fontSize:'0.78rem'}}>Click dice to hold</span>
      </div>
      {/* Scorecard */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',maxWidth:'360px',margin:'0 auto'}}>
        {CATEGORIES.map(cat=>{
          const scored = scores[cat.id]!==undefined;
          const preview = !scored&&rolls>0?cat.calc(dice):null;
          return (
            <button key={cat.id} onClick={()=>score(cat)} disabled={scored||rolls===0}
              style={{padding:'8px 10px',borderRadius:'10px',border:`1px solid ${scored?'#1e293b':'#334155'}`,background:scored?'#0f172a':'#1e293b',cursor:scored||rolls===0?'default':'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s',
                ...(preview!==null&&!scored?{borderColor:'#f97316',background:'#f9730611'}:{})}}
            >
              <span style={{color:'#94a3b8',fontSize:'0.75rem',fontWeight:600}}>{cat.label}</span>
              <span style={{color:scored?'#f97316':preview!==null?'#fb923c':'#475569',fontWeight:800,fontSize:'0.9rem'}}>
                {scored?scores[cat.id]:preview!==null?preview:'—'}
              </span>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
