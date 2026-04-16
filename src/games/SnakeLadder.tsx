import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const SNAKES: Record<number,number> = {99:5,90:12,87:24,62:18,52:30,45:7,35:2,93:68};
const LADDERS: Record<number,number> = {3:38,8:30,15:44,20:60,28:76,40:79,58:95,67:88};

const PLAYER_COLORS=['#ef4444','#3b82f6','#22c55e','#f59e0b'];
const PLAYER_EMOJIS=['🔴','🔵','🟢','🟡'];

function getPos(square:number):{row:number,col:number}{
  if(square<1)return{row:9,col:0};
  const idx=square-1;
  const row=9-Math.floor(idx/10);
  const col=Math.floor(idx/10)%2===0?idx%10:9-idx%10;
  return{row,col};
}

export default function SnakeLadder() {
  const [numPlayers,setNumPlayers]=useState(2);
  const [positions,setPositions]=useState([1,1,1,1]);
  const [turn,setTurn]=useState(0);
  const [dice,setDice]=useState<number|null>(null);
  const [rolling,setRolling]=useState(false);
  const [message,setMessage]=useState('');
  const [winner,setWinner]=useState<number|null>(null);
  const [scores,setScores]=useState([0,0,0,0]);

  const reset=()=>{setPositions([1,1,1,1]);setTurn(0);setDice(null);setMessage('');setWinner(null);};

  const roll=()=>{
    if(rolling||winner!==null)return;
    setRolling(true);
    let count=0;
    const interval=setInterval(()=>{
      setDice(Math.ceil(Math.random()*6));
      count++;
      if(count>8){
        clearInterval(interval);
        const d=Math.ceil(Math.random()*6);
        setDice(d);
        setRolling(false);
        move(d);
      }
    },80);
  };

  const move=(d:number)=>{
    setPositions(prev=>{
      const np=[...prev];
      let pos=np[turn]+d;
      if(pos>100)pos=np[turn];
      let msg=`${PLAYER_EMOJIS[turn]} rolled ${d}`;
      if(SNAKES[pos]){msg+=` 🐍 Snake! ${pos}→${SNAKES[pos]}`;pos=SNAKES[pos];}
      else if(LADDERS[pos]){msg+=` 🪜 Ladder! ${pos}→${LADDERS[pos]}`;pos=LADDERS[pos];}
      np[turn]=pos;
      setMessage(msg);
      if(pos>=100){setWinner(turn);setScores(s=>{const ns=[...s];ns[turn]++;return ns;});}
      else setTurn(t=>(t+1)%numPlayers);
      return np;
    });
  };

  const CELL_SIZE=36;

  return (
    <GameShell title="Snake & Ladder" emoji="🎲" onReset={reset} scores={Array.from({length:numPlayers},(_,i)=>({label:`P${i+1}`,value:scores[i],color:PLAYER_COLORS[i]}))}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {[2,3,4].map(n=>(
          <button key={n} onClick={()=>{setNumPlayers(n);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:numPlayers===n?'#f97316':'#334155',background:numPlayers===n?'#f9731622':'transparent',color:numPlayers===n?'#f97316':'#94a3b8'}}
          >{n} Players</button>
        ))}
      </div>

      {winner!==null&&<div style={{textAlign:'center',marginBottom:'10px',color:PLAYER_COLORS[winner],fontWeight:800,fontSize:'1.1rem'}}>🏆 {PLAYER_EMOJIS[winner]} Player {winner+1} Wins!</div>}
      {winner===null&&<div style={{textAlign:'center',marginBottom:'6px',color:PLAYER_COLORS[turn],fontWeight:700}}>{PLAYER_EMOJIS[turn]} Player {turn+1}'s turn</div>}
      {message&&<div style={{textAlign:'center',marginBottom:'8px',color:'#94a3b8',fontSize:'0.82rem',background:'#1e293b',borderRadius:'8px',padding:'6px 12px'}}>{message}</div>}

      {/* Board */}
      <div style={{overflowX:'auto',marginBottom:'12px'}}>
        <div style={{display:'grid',gridTemplateColumns:`repeat(10,${CELL_SIZE}px)`,gap:2,background:'#1e293b',padding:'6px',borderRadius:'12px',width:'fit-content',margin:'0 auto'}}>
          {Array.from({length:100},(_,i)=>{
            const sq=100-i;
            const row=Math.floor(i/10);
            const col=row%2===0?i%10:9-i%10;
            const actualSq=100-(row*10)+(row%2===0?-(col):col);
            const squareNum=100-i;
            const hasSnake=!!SNAKES[squareNum];
            const hasLadder=!!LADDERS[squareNum];
            const playersHere=positions.slice(0,numPlayers).map((p,pi)=>p===squareNum?pi:-1).filter(x=>x>=0);
            return (
              <div key={i} style={{width:CELL_SIZE,height:CELL_SIZE,background:hasSnake?'#7f1d1d':hasLadder?'#14532d':(row+col)%2===0?'#334155':'#1e293b',borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',fontSize:'0.55rem',color:'#64748b',fontWeight:600}}>
                <span style={{fontSize:'0.5rem',color:'#475569'}}>{squareNum}</span>
                {hasSnake&&<span style={{fontSize:'0.7rem'}}>🐍</span>}
                {hasLadder&&<span style={{fontSize:'0.7rem'}}>🪜</span>}
                <div style={{display:'flex',flexWrap:'wrap',gap:1,justifyContent:'center'}}>
                  {playersHere.map(pi=>(
                    <motion.div key={pi} initial={{scale:0}} animate={{scale:1}} style={{width:10,height:10,borderRadius:'50%',background:PLAYER_COLORS[pi]}} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dice */}
      <div style={{textAlign:'center'}}>
        <motion.div animate={rolling?{rotate:[0,360],scale:[1,1.2,1]}:{}} transition={{duration:0.1,repeat:rolling?Infinity:0}}
          style={{fontSize:'3rem',marginBottom:'10px',display:'inline-block'}}
        >{dice?['⚀','⚁','⚂','⚃','⚄','⚅'][dice-1]:'🎲'}</motion.div>
        <br/>
        <button onClick={roll} disabled={rolling||winner!==null}
          style={{background:PLAYER_COLORS[turn],border:'none',borderRadius:'14px',padding:'11px 28px',color:'#fff',fontWeight:800,fontSize:'1rem',cursor:rolling||winner!==null?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:rolling?0.7:1}}
        >{rolling?'Rolling…':'Roll Dice'}</button>
      </div>
    </GameShell>
  );
}
