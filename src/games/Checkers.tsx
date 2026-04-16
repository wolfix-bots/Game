import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Piece = { color: 'r'|'b'; king: boolean } | null;
type Board = Piece[][];

function makeBoard(): Board {
  return Array(8).fill(null).map((_, r) =>
    Array(8).fill(null).map((__, c) => {
      if ((r+c)%2===0) return null;
      if (r<3) return { color:'b', king:false };
      if (r>4) return { color:'r', king:false };
      return null;
    })
  );
}

function getMoves(board: Board, r: number, c: number): [number,number,number,number][] {
  const piece = board[r][c]; if (!piece) return [];
  const dirs = piece.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : piece.color==='r' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const moves: [number,number,number,number][] = [];
  for (const [dr,dc] of dirs) {
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>7||nc<0||nc>7) continue;
    if (!board[nr][nc]) { moves.push([r,c,nr,nc]); continue; }
    const jr=nr+dr, jc=nc+dc;
    if (jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc]&&board[nr][nc]?.color!==piece.color) moves.push([r,c,jr,jc]);
  }
  return moves;
}

function applyMove(board: Board, from: [number,number], to: [number,number]): Board {
  const nb = board.map(row => row.map(p => p?{...p}:null));
  const [fr,fc]=from, [tr,tc]=to;
  nb[tr][tc] = nb[fr][fc];
  nb[fr][fc] = null;
  if (Math.abs(tr-fr)===2) nb[(fr+tr)/2][(fc+tc)/2]=null;
  if (nb[tr][tc] && (tr===0||tr===7)) nb[tr][tc]!.king=true;
  return nb;
}

function aiPickMove(board: Board): [[number,number],[number,number]]|null {
  const all: [[number,number],[number,number]][] = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c]?.color==='b') {
      for (const [fr,fc,tr,tc] of getMoves(board,r,c)) {
        all.push([[fr,fc],[tr,tc]]);
      }
    }
  }
  if (!all.length) return null;
  const jumps = all.filter(([from,to])=>Math.abs(to[0]-from[0])===2);
  const pool = jumps.length ? jumps : all;
  return pool[Math.floor(Math.random()*pool.length)];
}

export default function Checkers() {
  const [board, setBoard] = useState<Board>(makeBoard);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [turn, setTurn] = useState<'r'|'b'>('r');
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [scores, setScores] = useState({r:0,b:0});
  const [msg, setMsg] = useState('');

  const validMoves = selected ? getMoves(board, selected[0], selected[1]) : [];
  const isTarget = (r:number,c:number) => validMoves.some(([,, tr,tc])=>tr===r&&tc===c);

  const click = (r:number,c:number) => {
    if (msg) return;
    const piece = board[r][c];
    if (selected && isTarget(r,c)) {
      const nb = applyMove(board, selected, [r,c]);
      setBoard(nb); setSelected(null);
      const rCount = nb.flat().filter(p=>p?.color==='r').length;
      const bCount = nb.flat().filter(p=>p?.color==='b').length;
      if (!rCount){setMsg('🔵 Blue Wins!');setScores(s=>({...s,b:s.b+1}));return;}
      if (!bCount){setMsg('🔴 Red Wins!');setScores(s=>({...s,r:s.r+1}));return;}
      const next: 'r'|'b' = turn==='r'?'b':'r';
      setTurn(next);
      if (mode==='ai'&&next==='b') {
        setTimeout(()=>{
          const m = aiPickMove(nb);
          if (!m){setMsg('🔴 Red Wins!');setScores(s=>({...s,r:s.r+1}));return;}
          const ab = applyMove(nb,m[0],m[1]);
          setBoard(ab); setTurn('r');
          const rc=ab.flat().filter(p=>p?.color==='r').length;
          if(!rc){setMsg('🔵 Blue Wins!');setScores(s=>({...s,b:s.b+1}));}
        },500);
      }
    } else if (piece?.color===turn) {
      setSelected([r,c]);
    } else {
      setSelected(null);
    }
  };

  const reset = () => { setBoard(makeBoard()); setSelected(null); setTurn('r'); setMsg(''); };

  return (
    <GameShell title="Checkers" emoji="🔵" onReset={reset} scores={[
      {label:mode==='ai'?'You 🔴':'🔴 Red',value:scores.r,color:'#ef4444'},
      {label:mode==='ai'?'AI 🔵':'🔵 Blue',value:scores.b,color:'#3b82f6'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',borderColor:mode===m?'#fb923c':'#334155',background:mode===m?'#fb923c22':'transparent',color:mode===m?'#fb923c':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {msg ? <div style={{color:'#fbbf24',fontWeight:800,fontSize:'1.1rem',textAlign:'center'}}>{msg}</div>
           : <div style={{color:'#94a3b8',fontWeight:600,textAlign:'center',fontSize:'0.85rem'}}>{turn==='r'?'🔴':'🔵'} {mode==='ai'&&turn==='b'?'AI thinking…':'Turn'}</div>}
      <div style={{display:'inline-block',borderRadius:'12px',overflow:'hidden',border:'3px solid #334155'}}>
        {board.map((row,r)=>(
          <div key={r} style={{display:'flex'}}>
            {row.map((piece,c)=>{
              const dark=(r+c)%2!==0;
              const sel=selected&&selected[0]===r&&selected[1]===c;
              const tgt=isTarget(r,c);
              return (
                <div key={c} onClick={()=>dark&&click(r,c)}
                  style={{width:46,height:46,background:dark?(sel?'#4f46e5':tgt?'#22c55e33':'#292524'):'#e7e5e4',cursor:dark?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',transition:'background 0.1s'}}
                >
                  {tgt&&dark&&<div style={{width:16,height:16,borderRadius:'50%',background:'#22c55e',opacity:0.6}}/>}
                  {piece&&(
                    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:20}}
                      style={{width:34,height:34,borderRadius:'50%',background:piece.color==='r'?'#ef4444':'#3b82f6',border:`3px solid ${piece.color==='r'?'#dc2626':'#2563eb'}`,boxShadow:sel?'0 0 12px #818cf8':'0 2px 6px rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem'}}
                    >{piece.king?'👑':''}</motion.div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </GameShell>
  );
}
