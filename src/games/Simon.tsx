import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

const COLORS = ['#ef4444','#22c55e','#3b82f6','#f59e0b'];
const LABELS = ['🔴','🟢','🔵','🟡'];
const FREQS  = [261,329,392,523];

function beep(freq:number,dur=220){try{const ctx=new(window.AudioContext||(window as any).webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur/1000);o.start();o.stop(ctx.currentTime+dur/1000);}catch{}}

export default function Simon() {
  const [seq,setSeq]=useState<number[]>([]);
  const [playerSeq,setPlayerSeq]=useState<number[]>([]);
  const [phase,setPhase]=useState<'idle'|'showing'|'input'|'over'>('idle');
  const [active,setActive]=useState<number|null>(null);
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(()=>Number(localStorage.getItem('simon-best')||0));
  const [speed,setSpeed]=useState<'normal'|'fast'>('normal');
  const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));

  const show=async(s:number[])=>{
    setPhase('showing'); await delay(400);
    for(const c of s){setActive(c);beep(FREQS[c]);await delay(speed==='fast'?380:650);setActive(null);await delay(180);}
    setPhase('input'); setPlayerSeq([]);
  };

  const start=()=>{const f=Math.floor(Math.random()*4);const s=[f];setSeq(s);setScore(0);show(s);};

  const press=async(i:number)=>{
    if(phase!=='input') return;
    setActive(i); beep(FREQS[i]); setTimeout(()=>setActive(null),180);
    const np=[...playerSeq,i]; setPlayerSeq(np);
    if(np[np.length-1]!==seq[np.length-1]){
      setPhase('over');
      if(score>best){setBest(score);localStorage.setItem('simon-best',String(score));}
      const u=getSession(); if(u) submitScore('simon',u.username,u.avatar,score);
      return;
    }
    if(np.length===seq.length){
      const ns=score+1; setScore(ns);
      const next=[...seq,Math.floor(Math.random()*4)]; setSeq(next);
      await delay(500); show(next);
    }
  };

  return (
    <GameShell title="Simon Says" emoji="🔴" gameId="simon" onReset={()=>{setPhase('idle');setSeq([]);setPlayerSeq([]);setScore(0);setActive(null);}} scores={[{label:'Round',value:score,color:'#f472b6'},{label:'Best',value:best,color:'#fbbf24'}]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
        {(['normal','fast'] as const).map(s=>(
          <button key={s} onClick={()=>setSpeed(s)} style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',textTransform:'capitalize',borderColor:speed===s?'#f472b6':'#334155',background:speed===s?'#f472b622':'transparent',color:speed===s?'#f472b6':'#94a3b8'}}>{s}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',maxWidth:'260px',margin:'0 auto 20px'}}>
        {COLORS.map((color,i)=>(
          <motion.button key={i} animate={{scale:active===i?1.1:1,opacity:active===i?1:phase==='showing'?0.35:1,boxShadow:active===i?`0 0 30px ${color}`:'none'}} transition={{duration:0.1}}
            onClick={()=>press(i)} style={{height:100,borderRadius:'20px',border:`3px solid ${color}44`,background:active===i?color:`${color}33`,cursor:phase==='input'?'pointer':'default',fontSize:'2rem',fontFamily:'Outfit,sans-serif'}}
          >{LABELS[i]}</motion.button>
        ))}
      </div>
      <div style={{textAlign:'center'}}>
        {phase==='idle'&&<button onClick={start} style={{background:'#f472b6',border:'none',borderRadius:'14px',padding:'12px 32px',color:'#fff',fontWeight:800,fontSize:'1rem',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Start</button>}
        {phase==='showing'&&<div style={{color:'#f472b6',fontWeight:700}}>Watch carefully…</div>}
        {phase==='input'&&<div style={{color:'#22c55e',fontWeight:700}}>Your turn! ({playerSeq.length}/{seq.length})</div>}
        {phase==='over'&&<div><div style={{color:'#ef4444',fontWeight:800,fontSize:'1.1rem',marginBottom:'12px'}}>❌ Wrong! Score: {score}</div><button onClick={start} style={{background:'#f472b6',border:'none',borderRadius:'12px',padding:'10px 24px',color:'#fff',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Try Again</button></div>}
      </div>
    </GameShell>
  );
}
