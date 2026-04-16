import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const QUOTES = [
  "The quick brown fox jumps over the lazy dog",
  "To be or not to be that is the question",
  "All that glitters is not gold",
  "The only way to do great work is to love what you do",
  "In the middle of every difficulty lies opportunity",
  "Life is what happens when you are busy making other plans",
  "The future belongs to those who believe in the beauty of their dreams",
  "It does not matter how slowly you go as long as you do not stop",
  "Success is not final failure is not fatal it is the courage to continue that counts",
  "The best time to plant a tree was twenty years ago the second best time is now",
  "You miss one hundred percent of the shots you do not take",
  "Whether you think you can or you think you cannot you are right",
  "Strive not to be a success but rather to be of value",
  "Two roads diverged in a wood and I took the one less traveled by",
  "The journey of a thousand miles begins with one step",
];

export default function TypeRacer() {
  const [text,setText]=useState('');
  const [typed,setTyped]=useState('');
  const [started,setStarted]=useState(false);
  const [finished,setFinished]=useState(false);
  const [startTime,setStartTime]=useState(0);
  const [wpm,setWpm]=useState(0);
  const [accuracy,setAccuracy]=useState(100);
  const [best,setBest]=useState(()=>Number(localStorage.getItem('typeracer-best')||0));
  const [errors,setErrors]=useState(0);
  const [totalTyped,setTotalTyped]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const [elapsed,setElapsed]=useState(0);

  const newRound=useCallback(()=>{
    const q=QUOTES[Math.floor(Math.random()*QUOTES.length)];
    setText(q);setTyped('');setStarted(false);setFinished(false);setWpm(0);setAccuracy(100);setErrors(0);setTotalTyped(0);setElapsed(0);
    clearInterval(timerRef.current!);
    setTimeout(()=>inputRef.current?.focus(),100);
  },[]);

  useEffect(()=>{newRound();},[]);

  const handleInput=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const val=e.target.value;
    if(finished)return;
    if(!started){setStarted(true);setStartTime(Date.now());timerRef.current=setInterval(()=>setElapsed((t:number)=>t+1),1000);}
    const isCorrect=text.startsWith(val);
    if(!isCorrect)setErrors(n=>n+1);
    setTotalTyped(n=>n+1);
    setTyped(val);
    const acc=Math.max(0,Math.round(((totalTyped+1-errors-(isCorrect?0:1))/(totalTyped+1))*100));
    setAccuracy(acc);
    if(val===text){
      setFinished(true);clearInterval(timerRef.current!);
      const mins=(Date.now()-startTime)/60000;
      const words=text.split(' ').length;
      const w=Math.round(words/mins);
      setWpm(w);
      if(w>best){setBest(w);localStorage.setItem('typeracer-best',String(w));}
    }
  };

  const cursorPos=typed.length;
  const correct=text.startsWith(typed);

  return (
    <GameShell title="Type Racer" emoji="⌨️" onReset={newRound} scores={[
      {label:'WPM',value:wpm||0,color:'#38bdf8'},
      {label:'Best',value:best,color:'#fbbf24'},
      {label:'Acc%',value:accuracy,color:'#22c55e'},
    ]}>
      {/* Stats bar */}
      <div style={{display:'flex',gap:'16px',justifyContent:'center',marginBottom:'12px'}}>
        <div style={{textAlign:'center'}}><div style={{color:'#38bdf8',fontWeight:800,fontSize:'1.3rem'}}>{started&&!finished?Math.round((typed.split(' ').filter(Boolean).length)/Math.max(elapsed/60,0.01)):wpm}</div><div style={{color:'#64748b',fontSize:'0.7rem'}}>WPM</div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#f59e0b',fontWeight:800,fontSize:'1.3rem'}}>{elapsed}s</div><div style={{color:'#64748b',fontSize:'0.7rem'}}>Time</div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#ef4444',fontWeight:800,fontSize:'1.3rem'}}>{errors}</div><div style={{color:'#64748b',fontSize:'0.7rem'}}>Errors</div></div>
      </div>

      {/* Progress bar */}
      <div style={{background:'#1e293b',borderRadius:'8px',height:'8px',marginBottom:'16px',overflow:'hidden'}}>
        <motion.div animate={{width:`${text?(typed.length/text.length)*100:0}%`}} style={{height:'100%',background:'#38bdf8',borderRadius:'8px'}} />
      </div>

      {/* Text display */}
      <div style={{background:'#0f172a',borderRadius:'14px',padding:'16px',marginBottom:'14px',fontFamily:'monospace',fontSize:'clamp(0.9rem,2.5vw,1.1rem)',lineHeight:1.8,letterSpacing:'0.02em',minHeight:'80px'}}>
        {text.split('').map((ch,i)=>{
          let color='#475569';
          if(i<typed.length)color=typed[i]===ch?'#22c55e':'#ef4444';
          const isCursor=i===cursorPos;
          return(
            <span key={i} style={{color,position:'relative'}}>
              {isCursor&&<span style={{position:'absolute',left:0,top:0,width:'2px',height:'1.2em',background:'#38bdf8',animation:'blink 1s infinite'}}/>}
              {ch}
            </span>
          );
        })}
      </div>

      {/* Input */}
      <input ref={inputRef} value={typed} onChange={handleInput} disabled={finished}
        placeholder={started?'':'Click here and start typing…'}
        style={{width:'100%',background:!correct&&typed?'#7f1d1d22':'#1e293b',border:`2px solid ${!correct&&typed?'#ef4444':started?'#38bdf8':'#334155'}`,borderRadius:'12px',padding:'12px 16px',color:'#e2e8f0',fontSize:'1rem',outline:'none',fontFamily:'monospace',boxSizing:'border-box',transition:'border-color 0.2s'}}
      />

      {finished&&(
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
          style={{marginTop:'16px',textAlign:'center',background:'#22c55e22',border:'1px solid #22c55e44',borderRadius:'14px',padding:'16px'}}
        >
          <div style={{fontSize:'2rem',marginBottom:'6px'}}>🏁</div>
          <div style={{color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>Finished! {wpm} WPM · {accuracy}% accuracy</div>
          {wpm>=best&&wpm>0&&<div style={{color:'#fbbf24',fontWeight:700,fontSize:'0.85rem',marginTop:'4px'}}>🏆 New personal best!</div>}
          <button onClick={newRound} style={{marginTop:'12px',background:'#38bdf8',border:'none',borderRadius:'10px',padding:'8px 20px',color:'#0f172a',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Next Quote</button>
        </motion.div>
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </GameShell>
  );
}
