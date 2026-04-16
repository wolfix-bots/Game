import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';
import { motion } from 'framer-motion';

type Piece = { player:1|2; king:boolean } | null;
type Board = Piece[][];

function makeBoard(): Board {
  return Array(8).fill(null).map((_, r) =>
    Array(8).fill(null).map((__, c) => {
      if ((r+c)%2===0) return null;
      if (r<3) return { player:2, king:false };
      if (r>4) return { player:1, king:false };
      return null;
    })
  );
}

function getMoves(board:Board, r:number, c:number): {r:number,c:number,capture:[number,number]|null}[] {
  const piece = board[r][c];
  if (!piece) return [];
  const dirs = piece.player===1||piece.king ? [[-1,-1],[-1,1]] : [];
  const dirs2 = piece.player===2||piece.king ? [[1,-1],[1,1]] : [];
  const allDirs = [...dirs,...dirs2];
  const moves: {r:number,c:number,capture:[number,number]|null}[] = [];
  for (const [dr,dc] of allDirs) {
    const nr=r+dr, nc=c+dc;
    if (nr<0||nr>7||nc<0||nc>7) continue;
    if (!board[nr][nc]) { moves.push({r:nr,c:nc,capture:null}); continue; }
    if (board[nr][nc]!.player!==piece.player) {
      const jr=nr+dr, jc=nc+dc;
      if (jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc]) moves.push({r:jr,c:jc,capture:[nr,nc]});
    }
  }
  return moves;
}

function aiPickMove(board:Board): {from:[number,number],to:{r:number,c:number,capture:[number,number]|null}}|null {
  const pieces:[number,number][] = [];
  board.forEach((row,r)=>row.forEach((cell,c)=>{ if(cell?.player===2) pieces.push([r,c]); }));
  const all: {from:[number,number],to:{r:number,c:number,capture:[number,number]|null}}[] = [];
  for (const [r,c] of pieces) for (const m of getMoves(board,r,c)) all.push({from:[r,c],to:m});
  if (!all.length) return null;
  const captures = all.filter(m=>m.to.capture);
  const pool = captures.length ? captures : all;
  return pool[Math.floor(Math.random()*pool.length)];
}

export default function Checkers() {
  const [board, setBoard] = useState<Board>(makeBoard);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [turn, setTurn] = useState<1|2>(1);
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [scores, setScores] = useState({p1:0,p2:0});
  const [over, setOver] = useState<string|null>(null);

  const validMoves = selected ? getMoves(board,selected[0],selected[1]) : [];
  const validSet = new Set(validMoves.map(m=>`${m.r}-${m.c}`));

  const doMove = useCallback((board:Board, from:[number,number], to:{r:number,c:number,capture:[number,number]|null}, player:1|2): Board => {
    const nb = board.map(row=>row.map(cell=>cell?{...cell}:null));
    const piece = nb[from[0]][from[1]]!;
    nb[to.r][to.c] = { ...piece, king: piece.king||(player===1&&to.r===0)||(player===2&&to.r===7) };
    nb[from[0]][from[1]] = null;
    if (to.capture) nb[to.capture[0]][to.capture[1]] = null;
    return nb;
  }, []);

  const click = useCallback((r:number,c:number) => {
    if (over) return;
    const cell = board[r][c];
    if (selected) {
      const move = validMoves.find(m=>m.r===r&&m.c===c);
      if (move) {
        const nb = doMove(board, selected, move, turn);
        const next:1|2 = turn===1?2:1;
        const hasNext = nb.some((row,ri)=>row.some((_,ci)=>nb[ri][ci]?.player===next&&getMoves(nb,ri,ci).length>0));
        if (!hasNext) { setBoard(nb); setOver(turn===1?'Player 1':'Player 2'); setScores(s=>({...s,[turn===1?'p1':'p2']:s[turn===1?'p1':'p2']+1})); setSelected(null); return; }
        setBoard(nb); setTurn(next); setSelected(null);
        if (mode==='ai'&&next===2) {
          setTimeout(()=>{
            const m = aiPickMove(nb);
            if (!m) { setOver('Player 1'); return; }
            const ab = doMove(nb, m.from, m.to, 2);
            const p1Has = ab.some((row,ri)=>row.some((_,ci)=>ab[ri][ci]?.player===1&&getMoves(ab,ri,ci).length>0));
            if (!p1Has) { setBoard(ab); setOver('AI'); setScores(s=>({...s,p2:s.p2+1})); return; }
            setBoard(ab); setTurn(1);
          },500);
        }
      } else if (cell?.player===turn) { setSelected([r,c]); }
      else setSelected(null);
    } else {
      if (cell?.player===turn) setSelected([r,c]);
    }
  }, [board,selected,validMoves,turn,over,mode,doMove]);

  const reset = () => { setBoard(makeBoard()); setSelected(null); setTurn(1); setOver(null); };
  const cellSize = Math.min(52, Math.floor((Math.min(window.innerWidth-48,440))/8));

  return (
    <GameShell title="Checkers" emoji="🔵" onReset={reset} scores={[
      {label:mode==='ai'?'You':'P1', value:scores.p1, color:'#fb923c'},
      {label:mode==='ai'?'AI':'P2', value:scores.p2, color:'#94a3b8'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#fb923c':'#334155',background:mode===m?'#fb923c22':'transparent',color:mode===m?'#fb923c':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {over && <div style={{textAlign:'center',marginBottom:'10px',color:'#fb923c',fontWeight:800}}>🏆 {over} Wins!</div>}
      {!over && <div style={{textAlign:'center',marginBottom:'10px',color:'#94a3b8',fontSize:'0.85rem',fontWeight:600}}>{mode==='ai'&&turn===2?'AI thinking…':`${turn===1?'🟠':'⚫'} Turn`}</div>}
      <div style={{display:'inline-block',border:'3px solid #475569',borderRadius:'8px',overflow:'hidden',margin:'0 auto'}}>
        {board.map((row,r)=>(
          <div key={r} style={{display:'flex'}}>
            {row.map((cell,c)=>{
              const dark=(r+c)%2!==0;
              const isSel=selected?.[0]===r&&selected?.[1]===c;
              const isValid=validSet.has(`${r}-${c}`);
              return (
                <div key={c} onClick={()=>click(r,c)}
                  style={{width:cellSize,height:cellSize,background:isSel?'#fbbf2444':isValid?'#22c55e22':dark?'#1e293b':'#334155',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',border:isValid?'2px solid #22c55e44':'2px solid transparent'}}
                >
                  {cell&&(
                    <motion.div initial={{scale:0}} animate={{scale:1}}
                      style={{width:cellSize*0.72,height:cellSize*0.72,borderRadius:'50%',background:cell.player===1?'#f97316':'#1e293b',border:`3px solid ${cell.player===1?'#fdba74':'#64748b'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:cellSize*0.3,boxShadow:isSel?'0 0 12px #fbbf24':cell.player===1?'0 2px 6px rgba(249,115,22,0.4)':'0 2px 6px rgba(0,0,0,0.4)'}}
                    >{cell.king?'👑':''}</motion.div>
                  )}
                  {isValid&&!cell&&<div style={{width:14,height:14,borderRadius:'50%',background:'#22c55e55'}}/>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </GameShell>
  );
}
