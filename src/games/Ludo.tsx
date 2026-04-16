import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const COLORS=['#ef4444','#22c55e','#3b82f6','#f59e0b'];
const EMOJIS=['🔴','🟢','🔵','🟡'];
const NAMES=['Red','Green','Blue','Yellow'];

// Simplified Ludo — each player has 4 tokens, first to get all home wins
// Track progress 0-57 (0=home, 1-56=track, 57=finished)
function initTokens(n:number):number[][]{return Array.from({length:n},()=>[0,0,0,0]);}

export default function Ludo() {
  const [numPlayers,setNumPlayers]=useState(2);
  const [tokens,setTokens]=useState(initTokens(2));
  const [turn,setTurn]=useState(0);
  const [dice,setDice]=useState<number|null>(null);
  const [rolling,setRolling]=useState(false);
  const [selected,setSelected]=useState<number|null>(null);
  const [winner,setWinner]=useState<number|null>(null);
  const [message,setMessage]=useState('Roll to start!');
  const [scores,setScores]=useState([0,0,0,0]);

  const reset=(n=numPlayers)=>{setTokens(initTokens(n));setTurn(0);setDice(null);setRolling(false);setSelected(null);setWinner(null);setMessage('Roll to start!');};

  const roll=()=>{
    if(rolling||winner!==null||dice!==null)return;
    setRolling(true);
    let count=0;
    const iv=setInterval(()=>{
      setDice(Math.ceil(Math.random()*6));
      if(++count>8){
        clearInterval(iv);
        const d=Math.ceil(Math.random()*6);
        setDice(d);setRolling(false);
        setMessage(`${EMOJIS[turn]} rolled ${d}! Pick a token to move.`);
        // Check if any move possible
        const t=tokens;
        const canMove=t[turn].some(pos=>pos===0?d===6:pos>0&&pos<57&&pos+d<=57);
        if(!canMove){setMessage(`${EMOJIS[turn]} rolled ${d} — no moves! Next turn.`);setTimeout(()=>{setDice(null);setTurn(p=>(p+1)%numPlayers);setMessage('Roll to start!');},1200);}
      }
    },80);
  };

  const moveToken=(ti:number)=>{
    if(dice===null||winner!==null)return;
    const pos=tokens[turn][ti];
    if(pos===0&&dice!==6)return;
    if(pos===57)return;
    const newPos=pos===0?1:pos+dice;
    if(newPos>57)return;
    const nt=tokens.map(p=>[...p]);
    nt[turn][ti]=newPos;
    if(nt[turn].every(p=>p===57)){setWinner(turn);setScores(s=>{const ns=[...s];ns[turn]++;return ns;});}
    setTokens(nt);setDice(null);setSelected(null);
    const next=(turn+1)%numPlayers;
    setTurn(next);setMessage('Roll to start!');
  };

  const progress=(pos:number)=>pos===0?0:pos===57?100:Math.round((pos/56)*100);

  return (
    <GameShell title="Ludo" emoji="🎯" onReset={()=>reset()} scores={Array.from({length:numPlayers},(_,i)=>({label:NAMES[i],value:scores[i],color:COLORS[i]}))}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {[2,3,4].map(n=>(
          <button key={n} onClick={()=>{setNumPlayers(n);reset(n);}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:numPlayers===n?'#f59e0b':'#334155',background:numPlayers===n?'#f59e0b22':'transparent',color:numPlayers===n?'#f59e0b':'#94a3b8'}}
          >{n}P</button>
        ))}
      </div>

      {winner!==null&&<div style={{textAlign:'center',marginBottom:'10px',color:COLORS[winner],fontWeight:800,fontSize:'1.1rem'}}>🏆 {EMOJIS[winner]} {NAMES[winner]} Wins!</div>}
      <div style={{textAlign:'center',marginBottom:'8px',color:'#94a3b8',fontSize:'0.82rem',background:'#1e293b',borderRadius:'8px',padding:'6px 12px'}}>{message}</div>

      {/* Players */}
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
        {Array.from({length:numPlayers},(_,pi)=>(
          <div key={pi} style={{background:turn===pi?`${COLORS[pi]}22`:'#1e293b',border:`2px solid ${turn===pi?COLORS[pi]:'#334155'}`,borderRadius:'14px',padding:'10px 14px',transition:'all 0.2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <span style={{fontSize:'1.1rem'}}>{EMOJIS[pi]}</span>
              <span style={{color:COLORS[pi],fontWeight:700,fontSize:'0.88rem'}}>{NAMES[pi]}</span>
              {turn===pi&&<span style={{background:COLORS[pi],color:'#fff',borderRadius:'8px',padding:'1px 8px',fontSize:'0.65rem',fontWeight:800}}>YOUR TURN</span>}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              {tokens[pi].map((pos,ti)=>(
                <motion.button key={ti}
                  onClick={()=>turn===pi&&dice!==null?moveToken(ti):undefined}
                  whileHover={turn===pi&&dice!==null&&(pos===0?dice===6:pos<57)?{scale:1.1}:{}}
                  style={{flex:1,height:48,borderRadius:'10px',border:`2px solid ${COLORS[pi]}`,
                    background:pos===57?`${COLORS[pi]}88`:pos===0?'#1e293b':`${COLORS[pi]}44`,
                    cursor:turn===pi&&dice!==null?'pointer':'default',
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                  }}
                >
                  <span style={{fontSize:'1rem'}}>{pos===0?'🏠':pos===57?'🏁':'🎯'}</span>
                  <span style={{fontSize:'0.55rem',color:'#94a3b8',fontWeight:600}}>{pos===57?'Done':pos===0?'Home':`${progress(pos)}%`}</span>
                </motion.button>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{marginTop:'6px',background:'#334155',borderRadius:'4px',height:'4px',overflow:'hidden'}}>
              <div style={{width:`${tokens[pi].reduce((s,p)=>s+progress(p),0)/4}%`,height:'100%',background:COLORS[pi],borderRadius:'4px',transition:'width 0.4s'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Dice & Roll */}
      <div style={{textAlign:'center'}}>
        <motion.div animate={rolling?{rotate:360,scale:[1,1.3,1]}:{}} transition={{duration:0.15,repeat:rolling?Infinity:0}}
          style={{fontSize:'3rem',marginBottom:'10px',display:'inline-block'}}
        >{dice?['⚀','⚁','⚂','⚃','⚄','⚅'][dice-1]:'🎲'}</motion.div>
        <br/>
        <button onClick={roll} disabled={rolling||winner!==null||dice!==null}
          style={{background:COLORS[turn],border:'none',borderRadius:'14px',padding:'11px 28px',color:'#fff',fontWeight:800,fontSize:'1rem',cursor:rolling||winner!==null||dice!==null?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:rolling||dice!==null?0.6:1}}
        >{rolling?'Rolling…':dice?'Pick a token':'Roll Dice'}</button>
      </div>
    </GameShell>
  );
}
