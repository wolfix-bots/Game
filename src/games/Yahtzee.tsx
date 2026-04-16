import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const CATEGORIES=[
  {id:'ones',label:'Ones',calc:(d:number[])=>d.filter(v=>v===1).reduce((a,b)=>a+b,0)},
  {id:'twos',label:'Twos',calc:(d:number[])=>d.filter(v=>v===2).reduce((a,b)=>a+b,0)},
  {id:'threes',label:'Threes',calc:(d:number[])=>d.filter(v=>v===3).reduce((a,b)=>a+b,0)},
  {id:'fours',label:'Fours',calc:(d:number[])=>d.filter(v=>v===4).reduce((a,b)=>a+b,0)},
  {id:'fives',label:'Fives',calc:(d:number[])=>d.filter(v=>v===5).reduce((a,b)=>a+b,0)},
  {id:'sixes',label:'Sixes',calc:(d:number[])=>d.filter(v=>v===6).reduce((a,b)=>a+b,0)},
  {id:'3kind',label:'3 of a Kind',calc:(d:number[])=>[...new Set(d)].some(v=>d.filter(x=>x===v).length>=3)?d.reduce((a,b)=>a+b,0):0},
  {id:'4kind',label:'4 of a Kind',calc:(d:number[])=>[...new Set(d)].some(v=>d.filter(x=>x===v).length>=4)?d.reduce((a,b)=>a+b,0):0},
  {id:'full',label:'Full House',calc:(d:number[])=>{const s=[...new Set(d)];return s.length===2&&(d.filter(v=>v===s[0]).length===3||d.filter(v=>v===s[0]).length===2)?25:0;}},
  {id:'sm',label:'Sm. Straight',calc:(d:number[])=>{const u=[...new Set(d)].sort();for(const seq of[[1,2,3,4],[2,3,4,5],[3,4,5,6]])if(seq.every(v=>u.includes(v)))return 30;return 0;}},
  {id:'lg',label:'Lg. Straight',calc:(d:number[])=>{const u=[...new Set(d)].sort();return(JSON.stringify(u)==='[1,2,3,4,5]'||JSON.stringify(u)==='[2,3,4,5,6]')?40:0;}},
  {id:'yahtzee',label:'Yahtzee!',calc:(d:number[])=>new Set(d).size===1?50:0},
  {id:'chance',label:'Chance',calc:(d:number[])=>d.reduce((a,b)=>a+b,0)},
];

const FACES=['','⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Yahtzee(){
  const[dice,setDice]=useState([1,1,1,1,1]);
  const[held,setHeld]=useState([false,false,false,false,false]);
  const[rolls,setRolls]=useState(0);
  const[scores,setScores]=useState<Record<string,number>>({});
  const[gameOver,setGameOver]=useState(false);

  const roll=()=>{
    if(rolls>=3||gameOver) return;
    setDice(prev=>prev.map((v,i)=>held[i]?v:Math.ceil(Math.random()*6)));
    setRolls(r=>r+1);
  };

  const score=(cat:{id:string,calc:(d:number[])=>number})=>{
    if(rolls===0||scores[cat.id]!==undefined||gameOver) return;
    const val=cat.calc(dice);
    const ns={...scores,[cat.id]:val};
    setScores(ns);
    setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0);
    if(Object.keys(ns).length===CATEGORIES.length) setGameOver(true);
  };

  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const reset=()=>{setDice([1,1,1,1,1]);setHeld([false,false,false,false,false]);setRolls(0);setScores({});setGameOver(false);};

  return(
    <GameShell title="Yahtzee" emoji="🎲" onReset={reset} scores={[{label:'Total',value:total,color:'#f97316'}]}>
      {/* Dice */}
      <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'16px'}}>
        {dice.map((v,i)=>(
          <motion.button key={i} onClick={()=>{if(rolls>0)setHeld(h=>{const nh=[...h];nh[i]=!nh[i];return nh;})}}
            whileTap={{scale:0.9}}
            animate={{rotate:rolls>0&&!held[i]?[0,10,-10,0]:0}}
            style={{width:56,height:56,borderRadius:'12px',border:`3px solid ${held[i]?'#f97316':'#334155'}`,
              background:held[i]?'#f97316':'#1e293b',fontSize:'2rem',cursor:rolls>0?'pointer':'default',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}
          >{FACES[v]}</motion.button>
        ))}
      </div>
      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <button onClick={roll} disabled={rolls>=3||gameOver}
          style={{background:rolls>=3||gameOver?'#1e293b':'#f97316',border:'none',borderRadius:'12px',padding:'10px 28px',color:rolls>=3||gameOver?'#475569':'#fff',fontWeight:800,fontSize:'1rem',cursor:rolls>=3||gameOver?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif'}}
        >{rolls===0?'🎲 Roll Dice':`Roll (${3-rolls} left)`}</button>
        {rolls>0&&<div style={{color:'#64748b',fontSize:'0.75rem',marginTop:'6px'}}>Click dice to hold</div>}
      </div>
      {gameOver&&<div style={{textAlign:'center',color:'#f97316',fontWeight:800,fontSize:'1.1rem',marginBottom:'12px'}}>🎉 Game Over! Total: {total}</div>}
      {/* Scorecard */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',maxWidth:'340px',margin:'0 auto'}}>
        {CATEGORIES.map(cat=>{
          const val=cat.calc(dice);
          const scored=scores[cat.id]!==undefined;
          return(
            <button key={cat.id} onClick={()=>score(cat)} disabled={scored||rolls===0||gameOver}
              style={{padding:'7px 10px',borderRadius:'8px',border:`1px solid ${scored?'#1e293b':'#334155'}`,
                background:scored?'#0f172a':'#1e293b',cursor:scored||rolls===0||gameOver?'default':'pointer',
                display:'flex',justifyContent:'space-between',alignItems:'center',
                fontFamily:'Outfit,sans-serif',
              }}
            >
              <span style={{color:scored?'#475569':'#94a3b8',fontSize:'0.78rem',fontWeight:600}}>{cat.label}</span>
              <span style={{color:scored?'#64748b':rolls>0?'#f97316':'#475569',fontWeight:800,fontSize:'0.9rem'}}>
                {scored?scores[cat.id]:rolls>0?val:'—'}
              </span>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
