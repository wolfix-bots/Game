import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

// Pre-built puzzles for 3 difficulties
const PUZZLES = {
  easy: {
    puzzle: [5,3,0,0,7,0,0,0,0,6,0,0,1,9,5,0,0,0,0,9,8,0,0,0,0,6,0,8,0,0,0,6,0,0,0,3,4,0,0,8,0,3,0,0,1,7,0,0,0,2,0,0,0,6,0,6,0,0,0,0,2,8,0,0,0,0,4,1,9,0,0,5,0,0,0,0,8,0,0,7,9],
    solution:[5,3,4,6,7,8,9,1,2,6,7,2,1,9,5,3,4,8,1,9,8,3,4,2,5,6,7,8,5,9,7,6,1,4,2,3,4,2,6,8,5,3,7,9,1,7,1,3,9,2,4,8,5,6,9,6,1,5,3,7,2,8,4,2,8,7,4,1,9,6,3,5,3,4,5,2,8,6,1,7,9]
  },
  medium: {
    puzzle: [0,0,0,2,6,0,7,0,1,6,8,0,0,7,0,0,9,0,1,9,0,0,0,4,5,0,0,8,2,0,1,0,0,0,4,0,0,0,4,6,0,2,9,0,0,0,5,0,0,0,3,0,2,8,0,0,9,3,0,0,0,7,4,0,4,0,0,5,0,0,3,6,7,0,3,0,1,8,0,0,0],
    solution:[4,3,5,2,6,9,7,8,1,6,8,2,5,7,1,4,9,3,1,9,7,8,3,4,5,6,2,8,2,6,1,9,5,3,4,7,3,7,4,6,8,2,9,1,5,9,5,1,7,4,3,6,2,8,5,1,9,3,2,6,8,7,4,2,4,8,9,5,7,1,3,6,7,6,3,4,1,8,2,5,9]
  },
  hard: {
    puzzle: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,8,5,0,0,1,0,2,0,0,0,0,0,0,0,5,0,7,0,0,0,0,0,4,0,0,0,1,0,0,0,9,0,0,0,0,0,0,0,5,0,0,0,0,0,0,7,3,0,0,2,0,1,0,0,0,0,0,0,0,0,4,0,0,0,9],
    solution:[9,8,7,6,5,4,3,2,1,2,4,6,1,7,3,9,8,5,3,5,1,9,2,8,7,4,6,1,2,8,5,3,7,6,9,4,6,3,4,8,9,2,1,5,7,7,9,5,4,6,1,8,3,2,5,1,9,2,8,6,4,7,3,4,7,2,3,1,9,5,6,8,8,6,3,7,4,5,2,1,9]
  }
};

export default function Sudoku() {
  const [diff,setDiff]=useState<'easy'|'medium'|'hard'>('easy');
  const [board,setBoard]=useState<number[]>([...PUZZLES.easy.puzzle]);
  const [fixed]=useState<boolean[]>(PUZZLES.easy.puzzle.map(v=>v!==0));
  const [fixedBoard,setFixedBoard]=useState<boolean[]>(PUZZLES.easy.puzzle.map(v=>v!==0));
  const [selected,setSelected]=useState<number|null>(null);
  const [errors,setErrors]=useState<Set<number>>(new Set());
  const [won,setWon]=useState(false);
  const [startTime]=useState(Date.now());

  const changeDiff=(d:'easy'|'medium'|'hard')=>{
    setDiff(d); setBoard([...PUZZLES[d].puzzle]); setFixedBoard(PUZZLES[d].puzzle.map(v=>v!==0)); setSelected(null); setErrors(new Set()); setWon(false);
  };

  const input=(n:number)=>{
    if(selected===null||fixedBoard[selected]) return;
    const nb=[...board]; nb[selected]=n;
    setBoard(nb);
    // Check errors
    const errs=new Set<number>();
    nb.forEach((v,i)=>{if(v&&v!==PUZZLES[diff].solution[i]) errs.add(i);});
    setErrors(errs);
    if(nb.every((v,i)=>v===PUZZLES[diff].solution[i])){
      setWon(true);
      const secs=Math.floor((Date.now()-startTime)/1000);
      const score=Math.max(1000-secs*2,100);
      const u=getSession(); if(u) submitScore('sudoku',u.username,u.avatar,score);
    }
  };

  const getBox=(i:number)=>Math.floor(i/27)*3+Math.floor((i%9)/3);
  const sameGroup=(a:number,b:number)=>Math.floor(a/9)===Math.floor(b/9)||a%9===b%9||getBox(a)===getBox(b);

  return (
    <GameShell title="Sudoku" emoji="🔢" gameId="sudoku" onReset={()=>changeDiff(diff)}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'14px'}}>
        {(['easy','medium','hard'] as const).map(d=>(
          <button key={d} onClick={()=>changeDiff(d)} style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',textTransform:'capitalize',borderColor:diff===d?'#34d399':'#334155',background:diff===d?'#34d39922':'transparent',color:diff===d?'#34d399':'#94a3b8'}}>{d}</button>
        ))}
      </div>
      {won&&<div style={{textAlign:'center',marginBottom:'12px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 Solved!</div>}

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:'1px',background:'#334155',borderRadius:'10px',overflow:'hidden',maxWidth:'360px',margin:'0 auto 16px',border:'3px solid #475569'}}>
        {board.map((val,i)=>{
          const isSel=selected===i;
          const isHighlight=selected!==null&&sameGroup(selected,i)&&!isSel;
          const isErr=errors.has(i);
          const isSameNum=selected!==null&&board[selected]&&board[selected]===val&&!isSel;
          const r=Math.floor(i/9),c=i%9;
          const borderRight=(c===2||c===5)?'3px solid #475569':'none';
          const borderBottom=(r===2||r===5)?'3px solid #475569':'none';
          return (
            <div key={i} onClick={()=>!fixedBoard[i]&&setSelected(i)}
              style={{height:36,background:isSel?'#3b82f644':isErr?'#ef444422':isSameNum?'#818cf822':isHighlight?'#1e293b':'#0f172a',display:'flex',alignItems:'center',justifyContent:'center',cursor:fixedBoard[i]?'default':'pointer',borderRight,borderBottom,boxSizing:'border-box'}}
            >
              <span style={{color:fixedBoard[i]?'#e2e8f0':isErr?'#ef4444':'#818cf8',fontWeight:fixedBoard[i]?700:600,fontSize:'1rem'}}>{val||''}</span>
            </div>
          );
        })}
      </div>

      {/* Number pad */}
      <div style={{display:'flex',gap:'6px',justifyContent:'center',flexWrap:'wrap'}}>
        {[1,2,3,4,5,6,7,8,9].map(n=>(
          <button key={n} onClick={()=>input(n)} style={{width:40,height:40,borderRadius:'10px',border:'2px solid #334155',background:'#1e293b',color:'#e2e8f0',fontWeight:800,fontSize:'1.1rem',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>{n}</button>
        ))}
        <button onClick={()=>input(0)} style={{width:40,height:40,borderRadius:'10px',border:'2px solid #334155',background:'#1e293b',color:'#94a3b8',fontWeight:800,fontSize:'1rem',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>✕</button>
      </div>
    </GameShell>
  );
}
