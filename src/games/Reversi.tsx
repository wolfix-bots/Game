import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SIZE=8;
type Board=(0|1|2)[][];

function makeBoard():Board {
  const b:Board=Array(SIZE).fill(null).map(()=>Array(SIZE).fill(0));
  b[3][3]=1;b[3][4]=2;b[4][3]=2;b[4][4]=1;
  return b;
}

function getFlips(board:Board,r:number,c:number,player:1|2):number[][] {
  if(board[r][c]!==0) return [];
  const opp=player===1?2:1;
  const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const flips:number[][]=[];
  for(const [dr,dc] of dirs){
    const line:number[][]=[];
    let nr=r+dr,nc=c+dc;
    while(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&board[nr][nc]===opp){line.push([nr,nc]);nr+=dr;nc+=dc;}
    if(line.length&&nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&board[nr][nc]===player) flips.push(...line);
  }
  return flips;
}

function validMoves(board:Board,player:1|2):number[][] {
  const moves:number[][]=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(getFlips(board,r,c,player).length) moves.push([r,c]);
  return moves;
}

function aiMove(board:Board):number[]|null {
  const moves=validMoves(board,2);
  if(!moves.length) return null;
  // Prefer corners
  const corners=moves.filter(([r,c])=>(r===0||r===7)&&(c===0||c===7));
  if(corners.length) return corners[0];
  return moves.reduce((best,m)=>getFlips(board,m[0],m[1],2).length>getFlips(board,best[0],best[1],2).length?m:best,moves[0]);
}

export default function Reversi() {
  const [board,setBoard]=useState<Board>(makeBoard);
  const [turn,setTurn]=useState<1|2>(1);
  const [mode,setMode]=useState<'ai'|'local'>('ai');
  const [gameOver,setGameOver]=useState(false);
  const [hint,setHint]=useState(true);

  const count=(p:1|2)=>board.flat().filter(v=>v===p).length;
  const valid=validMoves(board,turn);

  const place=useCallback((r:number,c:number)=>{
    if(gameOver) return;
    const flips=getFlips(board,r,c,turn);
    if(!flips.length) return;
    const nb=board.map(row=>[...row]) as Board;
    nb[r][c]=turn; flips.forEach(([fr,fc])=>nb[fr][fc]=turn);
    const next:1|2=turn===1?2:1;
    const nextValid=validMoves(nb,next);
    const currentValid=validMoves(nb,turn);
    if(!nextValid.length&&!currentValid.length){setBoard(nb);setGameOver(true);return;}
    if(!nextValid.length){setBoard(nb);return;}
    setBoard(nb); setTurn(next);
    if(mode==='ai'&&next===2){
      setTimeout(()=>{
        const m=aiMove(nb);
        if(!m){setTurn(1);return;}
        const af=getFlips(nb,m[0],m[1],2);
        const ab=nb.map(row=>[...row]) as Board;
        ab[m[0]][m[1]]=2; af.forEach(([fr,fc])=>ab[fr][fc]=2);
        const afterValid=validMoves(ab,1);
        setBoard(ab);
        if(!afterValid.length&&!validMoves(ab,2).length) setGameOver(true);
        else setTurn(1);
      },400);
    }
  },[board,turn,mode,gameOver]);

  const reset=()=>{setBoard(makeBoard());setTurn(1);setGameOver(false);};
  const p1=count(1),p2=count(2);
  const winner=gameOver?(p1>p2?'Black':p2>p1?'White':'Draw'):null;
  const validSet=new Set(valid.map(([r,c])=>`${r}-${c}`));

  return (
    <GameShell title="Reversi" emoji="⚫" onReset={reset} scores={[
      {label:mode==='ai'?'You (⚫)':'⚫',value:p1,color:'#e2e8f0'},
      {label:mode==='ai'?'AI (⚪)':'⚪',value:p2,color:'#94a3b8'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px',flexWrap:'wrap'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#a78bfa':'#334155',background:mode===m?'#a78bfa22':'transparent',color:mode===m?'#a78bfa':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
        <button onClick={()=>setHint(h=>!h)}
          style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
            borderColor:hint?'#a78bfa':'#334155',background:hint?'#a78bfa22':'transparent',color:hint?'#a78bfa':'#94a3b8'}}
        >Hints {hint?'ON':'OFF'}</button>
      </div>
      {gameOver&&<div style={{textAlign:'center',marginBottom:'10px',color:'#a78bfa',fontWeight:800,fontSize:'1rem'}}>🏆 {winner==='Draw'?'Draw!':mode==='ai'?(winner==='Black'?'You Win!':'AI Wins!'):winner+' Wins!'}</div>}
      {!gameOver&&<div style={{textAlign:'center',marginBottom:'10px',color:'#94a3b8',fontSize:'0.85rem',fontWeight:600}}>{turn===1?'⚫':'⚪'} {mode==='ai'&&turn===2?'AI thinking…':'Turn'}</div>}
      <div style={{display:'flex',background:'#166534',borderRadius:'12px',padding:'8px',border:'3px solid #15803d',margin:'0 auto'}}>
        <div>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((cell,c)=>{
                const isValid=validSet.has(`${r}-${c}`);
                return (
                  <div key={c} onClick={()=>place(r,c)}
                    style={{width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',cursor:isValid?'pointer':'default',border:'1px solid #15803d',position:'relative',background:isValid&&hint?'rgba(255,255,255,0.08)':'transparent'}}
                  >
                    {cell!==0&&<motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:20}}
                      style={{width:30,height:30,borderRadius:'50%',background:cell===1?'#1e293b':'#f1f5f9',border:cell===1?'2px solid #475569':'2px solid #cbd5e1',boxShadow:cell===1?'inset 0 2px 4px rgba(255,255,255,0.1)':'inset 0 2px 4px rgba(0,0,0,0.1)'}}
                    />}
                    {isValid&&hint&&cell===0&&<div style={{width:14,height:14,borderRadius:'50%',background:'rgba(255,255,255,0.3)'}}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
