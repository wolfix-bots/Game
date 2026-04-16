import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const QUESTIONS = [
  {q:"What is the capital of France?",a:"Paris",opts:["London","Berlin","Paris","Madrid"],cat:"Geography"},
  {q:"How many sides does a hexagon have?",a:"6",opts:["5","6","7","8"],cat:"Math"},
  {q:"Who painted the Mona Lisa?",a:"Leonardo da Vinci",opts:["Picasso","Michelangelo","Leonardo da Vinci","Raphael"],cat:"Art"},
  {q:"What is the largest planet in our solar system?",a:"Jupiter",opts:["Saturn","Jupiter","Neptune","Uranus"],cat:"Science"},
  {q:"In what year did World War II end?",a:"1945",opts:["1943","1944","1945","1946"],cat:"History"},
  {q:"What is the chemical symbol for gold?",a:"Au",opts:["Go","Gd","Au","Ag"],cat:"Science"},
  {q:"Who wrote 'Romeo and Juliet'?",a:"Shakespeare",opts:["Dickens","Shakespeare","Austen","Tolstoy"],cat:"Literature"},
  {q:"What is the fastest land animal?",a:"Cheetah",opts:["Lion","Horse","Cheetah","Leopard"],cat:"Nature"},
  {q:"How many continents are there on Earth?",a:"7",opts:["5","6","7","8"],cat:"Geography"},
  {q:"What is 15 × 15?",a:"225",opts:["200","215","225","250"],cat:"Math"},
  {q:"Which element has the symbol 'O'?",a:"Oxygen",opts:["Osmium","Oxygen","Oganesson","Ozone"],cat:"Science"},
  {q:"What is the longest river in the world?",a:"Nile",opts:["Amazon","Mississippi","Nile","Yangtze"],cat:"Geography"},
  {q:"In which country was pizza invented?",a:"Italy",opts:["Greece","Italy","Spain","France"],cat:"Food"},
  {q:"What is the square root of 144?",a:"12",opts:["11","12","13","14"],cat:"Math"},
  {q:"Who invented the telephone?",a:"Alexander Graham Bell",opts:["Edison","Tesla","Bell","Marconi"].map(n=>n==='Bell'?'Alexander Graham Bell':n),cat:"History"},
  {q:"What is the smallest country in the world?",a:"Vatican City",opts:["Monaco","San Marino","Vatican City","Liechtenstein"],cat:"Geography"},
  {q:"How many bones are in the adult human body?",a:"206",opts:["196","206","216","226"],cat:"Science"},
  {q:"What language has the most native speakers?",a:"Mandarin Chinese",opts:["English","Spanish","Mandarin Chinese","Hindi"],cat:"Language"},
  {q:"What is the hardest natural substance?",a:"Diamond",opts:["Quartz","Topaz","Diamond","Corundum"],cat:"Science"},
  {q:"Who was the first person to walk on the moon?",a:"Neil Armstrong",opts:["Buzz Aldrin","Neil Armstrong","Yuri Gagarin","John Glenn"],cat:"History"},
];

const CAT_COLORS:Record<string,string>={Geography:'#22c55e',Math:'#3b82f6',Art:'#e879f9',Science:'#38bdf8',History:'#f59e0b',Literature:'#a78bfa',Nature:'#86efac',Food:'#fb923c',Language:'#f472b6'};

export default function Trivia() {
  const [questions,setQuestions]=useState(()=>[...QUESTIONS].sort(()=>Math.random()-0.5));
  const [idx,setIdx]=useState(0);
  const [selected,setSelected]=useState<string|null>(null);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(0);
  const [best,setBest]=useState(()=>Number(localStorage.getItem('trivia-best')||0));
  const [timeLeft,setTimeLeft]=useState(15);
  const [done,setDone]=useState(false);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);

  const q=questions[idx];
  const total=questions.length;

  useEffect(()=>{
    if(selected||done)return;
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current!);setSelected('__timeout__');setStreak(0);return 0;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current!);
  },[idx,selected,done]);

  const pick=(opt:string)=>{
    if(selected)return;
    clearInterval(timerRef.current!);
    setSelected(opt);
    if(opt===q.a){
      const bonus=Math.ceil(timeLeft/3);
      const ns=score+10+bonus;
      setScore(ns);setStreak(s=>s+1);
      if(ns>best){setBest(ns);localStorage.setItem('trivia-best',String(ns));}
    } else setStreak(0);
  };

  const next=()=>{
    if(idx+1>=total){setDone(true);return;}
    setIdx(i=>i+1);setSelected(null);setTimeLeft(15);
  };

  const reset=()=>{setQuestions([...QUESTIONS].sort(()=>Math.random()-0.5));setIdx(0);setSelected(null);setScore(0);setStreak(0);setTimeLeft(15);setDone(false);};

  if(done) return (
    <GameShell title="Trivia Quiz" emoji="🧠" onReset={reset}>
      <div style={{textAlign:'center',padding:'20px'}}>
        <div style={{fontSize:'3rem',marginBottom:'12px'}}>🏆</div>
        <div style={{color:'#fbbf24',fontWeight:900,fontSize:'1.5rem',marginBottom:'6px'}}>Quiz Complete!</div>
        <div style={{color:'#e2e8f0',fontWeight:700,fontSize:'1.1rem',marginBottom:'4px'}}>Score: {score}</div>
        <div style={{color:'#94a3b8',fontSize:'0.85rem',marginBottom:'16px'}}>Best: {best}</div>
        <button onClick={reset} style={{background:'#818cf8',border:'none',borderRadius:'14px',padding:'12px 28px',color:'#fff',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Play Again</button>
      </div>
    </GameShell>
  );

  const catColor=CAT_COLORS[q.cat]||'#818cf8';

  return (
    <GameShell title="Trivia Quiz" emoji="🧠" onReset={reset} scores={[
      {label:'Score',value:score,color:'#818cf8'},
      {label:'Streak',value:streak,color:'#f97316'},
    ]}>
      {/* Progress */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <div style={{flex:1,background:'#1e293b',borderRadius:'8px',height:'6px',overflow:'hidden'}}>
          <div style={{width:`${((idx)/total)*100}%`,height:'100%',background:'#818cf8',borderRadius:'8px',transition:'width 0.4s'}}/>
        </div>
        <span style={{color:'#64748b',fontSize:'0.75rem',fontWeight:600}}>{idx+1}/{total}</span>
      </div>

      {/* Timer */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
        <span style={{background:catColor+'22',color:catColor,borderRadius:'8px',padding:'3px 10px',fontSize:'0.72rem',fontWeight:700}}>{q.cat}</span>
        <div style={{flex:1,background:'#1e293b',borderRadius:'8px',height:'8px',overflow:'hidden'}}>
          <motion.div animate={{width:`${(timeLeft/15)*100}%`}} transition={{duration:1}} style={{height:'100%',background:timeLeft<=5?'#ef4444':'#22c55e',borderRadius:'8px'}}/>
        </div>
        <span style={{color:timeLeft<=5?'#ef4444':'#94a3b8',fontWeight:800,fontSize:'0.9rem',minWidth:'24px'}}>{timeLeft}s</span>
      </div>

      {/* Question */}
      <div style={{background:'#0f172a',borderRadius:'16px',padding:'18px',marginBottom:'16px',minHeight:'80px',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'#e2e8f0',fontWeight:700,fontSize:'clamp(0.95rem,2.5vw,1.1rem)',textAlign:'center',lineHeight:1.5}}>{q.q}</div>
      </div>

      {/* Options */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
        {q.opts.map((opt,i)=>{
          const isCorrect=opt===q.a;
          const isSelected=opt===selected;
          const revealed=!!selected;
          let bg='#1e293b',border='#334155',color='#e2e8f0';
          if(revealed){
            if(isCorrect){bg='#22c55e22';border='#22c55e';color='#22c55e';}
            else if(isSelected){bg='#ef444422';border='#ef4444';color='#ef4444';}
          }
          return (
            <motion.button key={i} onClick={()=>pick(opt)} whileHover={!selected?{scale:1.02}:{}} whileTap={!selected?{scale:0.98}:{}}
              style={{padding:'12px',borderRadius:'12px',border:`2px solid ${border}`,background:bg,color,fontWeight:600,fontSize:'0.88rem',cursor:selected?'default':'pointer',fontFamily:'Outfit,sans-serif',textAlign:'left',transition:'all 0.2s',lineHeight:1.3}}
            >
              <span style={{opacity:0.5,marginRight:'6px'}}>{['A','B','C','D'][i]}.</span>{opt}
              {revealed&&isCorrect&&' ✓'}
              {revealed&&isSelected&&!isCorrect&&' ✗'}
            </motion.button>
          );
        })}
      </div>

      {selected&&(
        <div style={{textAlign:'center'}}>
          <div style={{color:selected===q.a?'#22c55e':'#ef4444',fontWeight:700,marginBottom:'10px',fontSize:'0.9rem'}}>
            {selected==='__timeout__'?`⏰ Time's up! Answer: ${q.a}`:selected===q.a?`🎉 Correct! +${10+Math.ceil(timeLeft/3)} pts`:`❌ Wrong! Answer: ${q.a}`}
          </div>
          <button onClick={next} style={{background:'#818cf8',border:'none',borderRadius:'12px',padding:'9px 24px',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
            {idx+1>=total?'See Results':'Next Question →'}
          </button>
        </div>
      )}
    </GameShell>
  );
}
