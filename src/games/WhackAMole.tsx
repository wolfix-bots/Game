import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const HOLES = 9;
const MOLE_TIME = 1200;
const GAME_TIME = 30;

export default function WhackAMole() {
  const [active, setActive] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(()=>Number(localStorage.getItem('whack-best')||0));
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [running, setRunning] = useState(false);
  const [missed, setMissed] = useState(0);
  const timers = useRef<Record<number,ReturnType<typeof setTimeout>>>({});

  const spawnMole = () => {
    const hole = Math.floor(Math.random()*HOLES);
    setActive(a => a.includes(hole)?a:[...a,hole]);
    timers.current[hole]=setTimeout(()=>{
      setActive(a=>a.filter(h=>h!==hole));
      setMissed(m=>m+1);
    }, MOLE_TIME);
  };

  const start = () => {
    setScore(0); setTimeLeft(GAME_TIME); setActive([]); setMissed(0); setRunning(true);
  };

  useEffect(()=>{
    if(!running) return;
    const spawn=setInterval(spawnMole,600);
    const tick=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){ setRunning(false); clearInterval(spawn); clearInterval(tick); Object.values(timers.current).forEach(clearTimeout); setActive([]); return 0; }
        return t-1;
      });
    },1000);
    return ()=>{ clearInterval(spawn); clearInterval(tick); };
  },[running]);

  const whack=(hole:number)=>{
    if(!running||!active.includes(hole)) return;
    clearTimeout(timers.current[hole]);
    setActive(a=>a.filter(h=>h!==hole));
    setScore(s=>{ const ns=s+10; if(!running&&ns>best){setBest(ns);localStorage.setItem('whack-best',String(ns));} return ns; });
  };

  useEffect(()=>{ if(!running&&score>best){setBest(score);localStorage.setItem('whack-best',String(score));} },[running]);

  const emojis=['🐹','🐭','🦔','🐿️'];

  return (
    <GameShell title="Whack-a-Mole" emoji="🔨" onReset={()=>{setRunning(false);setScore(0);setTimeLeft(GAME_TIME);setActive([]);setMissed(0);}} scores={[
      {label:'Score',value:score,color:'#a3e635'},
      {label:'Best',value:best,color:'#fbbf24'},
      {label:'Time',value:timeLeft,color:timeLeft<=5?'#ef4444':'#94a3b8'},
    ]}>
      {!running&&timeLeft===GAME_TIME&&(
        <div style={{textAlign:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'3rem',marginBottom:'8px'}}>🔨</div>
          <button onClick={start} style={{background:'#a3e635',border:'none',borderRadius:'14px',padding:'12px 32px',color:'#0f172a',fontWeight:800,fontSize:'1rem',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Start Whacking!</button>
        </div>
      )}
      {!running&&timeLeft===0&&(
        <div style={{textAlign:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'2rem',marginBottom:'4px'}}>⏰</div>
          <div style={{color:'#a3e635',fontWeight:800,fontSize:'1.1rem',marginBottom:'4px'}}>Time's Up! Score: {score}</div>
          <div style={{color:'#64748b',fontSize:'0.82rem',marginBottom:'12px'}}>Missed: {missed} moles</div>
          <button onClick={start} style={{background:'#a3e635',border:'none',borderRadius:'12px',padding:'10px 24px',color:'#0f172a',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Play Again</button>
        </div>
      )}

      {/* Progress bar */}
      {running&&(
        <div style={{background:'#1e293b',borderRadius:'8px',height:'8px',marginBottom:'16px',overflow:'hidden'}}>
          <motion.div animate={{width:`${(timeLeft/GAME_TIME)*100}%`}} transition={{duration:1}} style={{height:'100%',background:timeLeft<=5?'#ef4444':'#a3e635',borderRadius:'8px'}} />
        </div>
      )}

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',maxWidth:'320px',margin:'0 auto'}}>
        {Array(HOLES).fill(0).map((_,i)=>{
          const hasMole=active.includes(i);
          return (
            <motion.div key={i} onClick={()=>whack(i)}
              whileTap={hasMole?{scale:0.85}:{}}
              style={{height:90,background:'#1e293b',borderRadius:'50% 50% 50% 50% / 40% 40% 60% 60%',border:`3px solid ${hasMole?'#a3e635':'#334155'}`,cursor:hasMole?'pointer':'default',display:'flex',alignItems:'flex-end',justifyContent:'center',overflow:'hidden',position:'relative',boxShadow:hasMole?'0 0 16px #a3e63566':'none',transition:'border-color 0.2s,box-shadow 0.2s'}}
            >
              <AnimatePresence>
                {hasMole&&(
                  <motion.div key="mole" initial={{y:60}} animate={{y:10}} exit={{y:60}} transition={{type:'spring',stiffness:400,damping:20}}
                    style={{fontSize:'2.2rem',lineHeight:1,userSelect:'none'}}
                  >{emojis[i%emojis.length]}</motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </GameShell>
  );
}
