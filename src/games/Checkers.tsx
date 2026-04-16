import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Piece = { player: 1|2; king: boolean } | null;
type Board = Piece[][];

function makeBoard(): Board {
  const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={player:2,king:false};
  for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={player:1,king:false};
  return b;
}

function getMoves(board: Board, r: number, c: number): {to:[number,number];cap:[number,number]|null}[] {
  const p = board[r][c]; if(!p) return [];
  const dirs = p.king?[[-1,-1],[-1,1],[1,-1],[1,1]]:p.player===1?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
  const moves: {to:[number,number];cap:[number,number]|null}[] = [];
  for(const [dr,dc] of dirs){
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<8&&nc>=0&&nc<8){
      if(!board[nr][nc]) moves.push({to:[nr,nc],cap:null});
      else if(board[nr][nc]!.player!==p.player){
        const jr=nr+dr,jc=nc+dc;
        if(jr>=0&&jr<8&&jc>=0&&jc<8&&!board[jr][jc]) moves.push({to:[jr,jc],cap:[nr,nc]});
      }
    }
  }
  return moves;
}

function allMoves(board: Board, player: 1|2) {
  const moves: {from:[number,number];to:[number,number];cap:[number,number]|null}[] = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]?.player===player) getMoves(board,r,c).forEach(m=>moves.push({from:[r,c],...m}));
  const caps = moves.filter(m=>m.cap);
  return caps.length ? caps : moves;
}

function applyMove(board: Board, from:[number,number], to:[number,number], cap:[number,number]|null): Board {
  const nb = board.map(row=>row.map(c=>c?{...c}:null));
  const p = nb[from[0]][from[1]]!;
  nb[to[0]][to[1]] = p;
  nb[from[0]][from[1]] = null;
  if(cap) nb[cap[0]][cap[1]] = null;
  if((p.player===1&&to[0]===0)||(p.player===2&&to[0]===7)) nb[to[0]][to[1]]!.king=true;
  return nb;
}

function aiPickMove(board: Board): {from:[number,number];to:[number,number];cap:[number,number]|null}|null {
  const moves = allMoves(board,2);
  if(!moves.length) return null;
  // Prefer captures, then king moves, then random
  const caps = moves.filter(m=>m.cap);
  if(caps.length) return caps[Math.floor(Math.random()*caps.length)];
  return moves[Math.floor(Math.random()*moves.length)];
}

export default function Checkers() {
  const [board,setBoard] = useState<Board>(makeBoard);
  const [selected,setSelected] = useState<[number,number]|null>(null);
  const [turn,setTurn] = useState<1|2>(1);
  const [mode,setMode] = useState<'ai'|'local'>('ai');
  const [winner,setWinner] = useState<1|2|null>(null);
  const [scores,setScores] = useState({p1:0,p2:0});

  const validMoves = selected ? getMoves(board,selected[0],selected[1]) : [];
  const validTargets = new Set(validMoves.map(m=>`${m.to[0]}-${m.to[1]}`));

  const click = useCallback((r:number,c:number) => {
    if(winner) return;
    if(mode==='ai'&&turn===2) return;
    const piece = board[r][c];
    if(selected){
      const move = validMoves.find(m=>m.to[0]===r&&m.to[1]===c);
      if(move){
        const nb = applyMove(board,selected,move.to,move.cap);
        const next:1|2 = turn===1?2:1;
        const nextMoves = allMoves(nb,next);
        if(!nextMoves.length){setBoard(nb);setWinner(turn);setScores(s=>({...s,[turn===1?'p1':'p2']:s[turn===1?'p1':'p2']+1}));return;}
        setBoard(nb); setSelected(null); setTurn(next);
        if(mode==='ai'&&next===2){
          setTimeout(()=>{
            const ai=aiPickMove(nb);
            if(!ai){setWinner(1);return;}
            const ab=applyMove(nb,ai.from,ai.to,ai.cap);
            const p1moves=allMoves(ab,1);
            if(!p1moves.length){setBoard(ab);setWinner(2);setScores(s=>({...s,p2:s.p2+1}));return;}
            setBoard(ab); setTurn(1);
          },500);
        }
        return;
      }
      setSelected(null);
    }
    if(piece?.player===turn) setSelected([r,c]);
  },[board,selected,turn,winner,mode,validMoves]);

  const reset=()=>{setBoard(makeBoard());setSelected(null);setTurn(1);setWinner(null);};

  return (
    <GameShell title="Checkers" emoji="🔵" gameId="checkers" onReset={reset} scores={[
      {label:mode==='ai'?'You':'P1',value:scores.p1,color:'#fb923c'},
      {label:mode==='ai'?'AI':'P2',value:scores.p2,color:'#94a3b8'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}} style={{padding:'6px 16px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.82rem',fontFamily:'Outfit,sans-serif',borderColor:mode===m?'#fb923c':'#334155',background:mode===m?'#fb923c22':'transparent',color:mode===m?'#fb923c':'#94a3b8'}}>{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      <div style={{textAlign:'center',marginBottom:'10px',fontWeight:700,color:winner?'#22c55e':turn===1?'#fb923c':'#94a3b8'}}>
        {winner?(mode==='ai'?winner===1?'🎉 You Win!':'🤖 AI Wins!':winner===1?'🔴 Red Wins!':'⚫ Black Wins!'):turn===1?mode==='ai'?'Your turn (🔴)':'Red\'s turn':mode==='ai'?'AI thinking…':'Black\'s turn'}
      </div>
      <div style={{display:'flex',justifyContent:'center'}}>
        <div style={{border:'3px solid #334155',borderRadius:'10px',overflow:'hidden'}}>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((cell,c)=>{
                const dark=(r+c)%2===1;
                const isSel=selected?.[0]===r&&selected?.[1]===c;
                const isTarget=validTargets.has(`${r}-${c}`);
                return (
                  <div key={c} onClick={()=>click(r,c)}
                    style={{width:48,height:48,background:isSel?'#f59e0b33':isTarget?'#22c55e22':dark?'#1e293b':'#334155',cursor:(dark&&(cell?.player===turn||isTarget))?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',borderWidth:2,borderStyle:'solid',borderColor:isSel?'#f59e0b':isTarget?'#22c55e':'transparent',boxSizing:'border-box'}}
                  >
                    {isTarget&&!cell&&<div style={{width:16,height:16,borderRadius:'50%',background:'#22c55e',opacity:0.5}}/>}
                    {cell&&<motion.div initial={{scale:0}} animate={{scale:1}} style={{width:36,height:36,borderRadius:'50%',background:cell.player===1?'#ef4444':'#1e293b',border:`3px solid ${cell.player===1?'#fca5a5':'#94a3b8'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',boxShadow:isSel?'0 0 12px #f59e0b':'none'}}>
                      {cell.king?'👑':''}
                    </motion.div>}
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
