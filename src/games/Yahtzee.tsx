import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

const CATS = ['Ones','Twos','Threes','Fours','Fives','Sixes','3 of a Kind','4 of a Kind','Full House','Sm Straight','Lg Straight','Yahtzee!','Chance'];

function rollDie(){ return Math.floor(Math.random()*6)+1; }
function rollAll(held:boolean[],dice:number[]){ return dice.map((d,i)=>held[i]?d:rollDie()); }

function calcScore(cat:string,dice:number[]): number {
  const counts=Array(7).fill(0); dice.forEach(d=>counts[d]++);
  const sum=dice.reduce((a,b)=>a+b,0);
  const vals=[1,2,3,4,5,6];
  if(cat==='Ones') return counts[1]*1;
  if(cat==='Twos') return counts[2]*2;
  if(cat==='Threes') return counts[3]*3;
  if(cat==='Fours') return counts[4]*4;
  if(cat==='Fives') return counts[5]*5;
  if(cat==='Sixes') return counts[6]*6;
  if(cat==='3 of a Kind') return counts.some(c=>c>=3)?sum:0;
  if(cat==='4 of a Kind') return counts.some(c=>c>=4)?sum:0;
  if(cat==='Full House') return (counts.some(c=>c===3)&&counts.some(c=>c===2))?25:0;
  if(cat==='Sm Straight'){const s=new Set(dice);const seqs=[[1,2,3,4],[2,3,4,5],[3,4,5,6]];return seqs.some(seq=>seq.every(v=>s.has(v)))?30:0;}
  if(cat==='Lg Straight'){const s=new Set(dice);return([1,2,3,4,5].every(v=>s.has(v))||[2,3,4,5,6].every(v=>s.has(v)))?40:0;}
  if(cat==='Yahtzee!') return counts.some(c=>c===5)?50:0;
  if(cat==='Chance') return sum;
  return 0;
}

const FACES=['','⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Yahtzee() {
  const [dice,setDice]=useState([1,1,1,1,1]);
  const [held,setHeld]=useState([false,false,false,false,false]);
  const [rolls,setRolls]=useState(0);
  const [scores,setScores]=useState<Record<string,number|null>>(Object.fromEntries(CATS.map(c=>[c,null])));
  const [done,setDone]=useState(false);

  const roll=()=>{
    if(rolls>=3||done) return;
    setDice(d=>rollAll(held,d)); setRolls(r=>r+1);
  };

  const score=(cat:string)=>{
    if(scores[cat]!==null||rolls===0) return;
    const s=calcScore(cat,dice);
    const ns={...scores,[cat]:s};
    setScores(ns);
    const allDone=Object.values(ns).every(v=>v!==null);
    if(allDone){
      setDone(true);
      const total=(Object.values(ns).reduce((a,b)=>(a??0)+(b??0),0) as number)||0;
      const u=getSession(); if(u) submitScore('yahtzee',u.username,u.avatar,total);
    }
    setDice([1,1,1,1,1]); setHeld([false,false,false,false,false]); setRolls(0);
  };

  const total=Object.values(scores).reduce((a,b)=>(a??0)+(b??0),0) as number;
  const upper=(['Ones','Twos','Threes','Fours','Fives','Sixes'] as const).reduce((a,c)=>a+(scores[c]??0),0);
  const bonus=upper>=63?35:0;

  const reset=()=>{setDice([1,1,1,1,1]);setHeld([false,false,false,false,false]);setRolls(0);setScores(Object.fromEntries(CATS.map(c=>[c,null])));setDone(false);};

  return (
    <GameShell title="Yahtzee" emoji="🎲" gameId="yahtzee" onReset={reset} scores={[{label:'Score',value:total+(bonus),color:'#f97316'},{label:'Bonus',value:bonus?'+35':'',color:'#22c55e'}]}>
      {/* Dice */}
      <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'16px'}}>
        {dice.map((d,i)=>(
          <motion.button key={i} whileTap={{scale:0.9}} onClick={()=>{if(rolls>0)setHeld(h=>{const n=[...h];n[i]=!n[i];return n;})}}
            animate={{rotate:held[i]?0:[0,-15,15,0],scale:held[i]?1:1}}
            style={{width:56,height:56,background:held[i]?'#22c55e22':'#1e293b',border:`3px solid ${held[i]?'#22c55e':'#334155'}`,borderRadius:'12px',fontSize:'2rem',cursor:rolls>0?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:held[i]?'0 0 12px #22c55e44':'none'}}
          >{FACES[d]}</motion.button>
        ))}
      </div>

      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <button onClick={roll} disabled={rolls>=3||done}
          style={{background:rolls>=3||done?'#334155':'#f97316',border:'none',borderRadius:'14px',padding:'10px 28px',color:'#fff',fontWeight:800,fontSize:'1rem',cursor:rolls>=3||done?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:rolls>=3||done?0.6:1}}
        >🎲 Roll ({3-rolls} left)</button>
        {rolls>0&&<div style={{color:'#64748b',fontSize:'0.75rem',marginTop:'6px'}}>Click dice to hold them</div>}
      </div>

      {/* Scorecard */}
      <div style={{background:'#0f172a',borderRadius:'14px',overflow:'hidden',border:'1px solid #1e293b'}}>
        <div style={{background:'#1e293b',padding:'8px 14px',display:'flex',justifyContent:'space-between'}}>
          <span style={{color:'#94a3b8',fontWeight:700,fontSize:'0.8rem'}}>CATEGORY</span>
          <span style={{color:'#94a3b8',fontWeight:700,fontSize:'0.8rem'}}>SCORE</span>
        </div>
        {CATS.map((cat,i)=>{
          const s=scores[cat];
          const preview=s===null&&rolls>0?calcScore(cat,dice):null;
          return(
            <div key={cat} onClick={()=>score(cat)}
              style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px',borderBottom:'1px solid #1e293b',cursor:s===null&&rolls>0?'pointer':'default',background:s===null&&rolls>0&&preview!==null?'rgba(249,115,22,0.05)':'transparent',transition:'background 0.15s'}}
            >
              <span style={{color:s!==null?'#475569':'#e2e8f0',fontSize:'0.85rem',fontWeight:600}}>{cat}</span>
              <span style={{color:s!==null?'#f97316':preview?'#f97316aa':'#334155',fontWeight:800,fontSize:'0.9rem'}}>
                {s!==null?s:preview!==null?`+${preview}`:'—'}
              </span>
            </div>
          );
        })}
        <div style={{padding:'10px 14px',borderTop:'2px solid #334155',display:'flex',justifyContent:'space-between'}}>
          <span style={{color:'#f97316',fontWeight:800}}>TOTAL {bonus?`(+35 bonus)`:upper>=63?'':` (${upper}/63 for bonus)`}</span>
          <span style={{color:'#f97316',fontWeight:900,fontSize:'1.1rem'}}>{total+bonus}</span>
        </div>
      </div>

      {done&&<div style={{textAlign:'center',marginTop:'14px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Game Over! Final: {(total as number)+bonus}</div>}
    </GameShell>
  );
}
