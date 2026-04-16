import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Piece = { player: 1|2; king: boolean } | null;
type Board = Piece[][];

function makeBoard(): Board {
  const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r+c)%2===1) b[r][c]={player:2,king:false};
  for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r+c)%2===1) b[r][c]={player:1,king:false};
  return b;
}

function getMoves(board: Board, r: number, c: number): {r:number,c:number,capture?:[number,number]}[] {
  const piece = board[r][c]; if (!piece) return [];
  const dirs = piece.player===1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const allDirs = piece.king ? [[-1,-1],[-1,1],[1,-1],[1,1]] : dirs;
  const moves: {r:number,c:number,capture?:[number,number]}[] = [];
  for (const [dr,dc] of allDirs) {
    const nr=r+dr,nc=c+dc;
    if (nr<0||nr>7||nc<0||nc>7) continue;
    if (!board[nr][nc]) { moves.push({r:nr,c:nc}); continue; }
    if (board[nr][nc]!.player!==piece.player) {
      const jr=nr+dr,jc=nc+dc;
      if (jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc]) moves.push({r:jr,c:jc,capture:[nr,nc]});
    }
  }
  return moves;
}

export default function Checkers() {
  const [board, setBoard] = useState<Board>(makeBoard);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [turn, setTurn] = useState<1|2>(1);
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [scores, setScores] = useState({p1:0,p2:0});
  const [winner, setWinner] = useState<1|2|null>(null);

  const validMoves = selected ? getMoves(board, selected[0], selected[1]) : [];
  const moveSet = new Set(validMoves.map(m=>`${m.r}-${m.c}`));

  const doMove = useCallback((board: Board, from: [number,number], to: {r:number,c:number,capture?:[number,number]}): Board => {
    const nb = board.map(row => row.map(p => p ? {...p} : null));
    const piece = nb[from[0]][from[1]]!;
    nb[to.r][to.c] = piece;
    nb[from[0]][from[1]] = null;
    if (to.capture) nb[to.capture[0]][to.capture[1]] = null;
    if ((piece.player===1&&to.r===0)||(piece.player===2&&to.r===7)) piece.king=true;
    return nb;
  }, []);

  const click = useCallback((r: number, c: number) => {
    if (winner || (mode==='ai'&&turn===2)) return;
    const piece = board[r][c];
    if (selected) {
      const move = validMoves.find(m=>m.r===r&&m.c===c);
      if (move) {
        const nb = doMove(board, selected, move);
        const p2count = nb.flat().filter(p=>p?.player===2).length;
        const p1count = nb.flat().filter(p=>p?.player===1).length;
        if (!p2count) { setBoard(nb); setWinner(1); setScores(s=>({...s,p1:s.p1+1})); setSelected(null); return; }
        if (!p1count) { setBoard(nb); setWinner(2); setScores(s=>({...s,p2:s.p2+1})); setSelected(null); return; }
        setBoard(nb); setSelected(null); setTurn(2);
        if (mode==='ai') {
          setTimeout(() => {
            // AI: find best capture or random
            const aiPieces: [number,number][] = [];
            for (let ar=0;ar<8;ar++) for (let ac=0;ac<8;ac++) if (nb[ar][ac]?.player===2) aiPieces.push([ar,ac]);
            const allMoves: {from:[number,number],to:{r:number,c:number,capture?:[number,number]}}[] = [];
            for (const [ar,ac] of aiPieces) for (const m of getMoves(nb,ar,ac)) allMoves.push({from:[ar,ac],to:m});
            if (!allMoves.length) { setWinner(1); return; }
            const captures = allMoves.filter(m=>m.to.capture);
            const chosen = captures.length ? captures[Math.floor(Math.random()*captures.length)] : allMoves[Math.floor(Math.random()*allMoves.length)];
            const ab = doMove(nb, chosen.from, chosen.to);
            const ap1 = ab.flat().filter(p=>p?.player===1).length;
            if (!ap1) { setBoard(ab); setWinner(2); setScores(s=>({...s,p2:s.p2+1})); }
            else { setBoard(ab); setTurn(1); }
          }, 400);
        }
        return;
      }
      setSelected(null);
    }
    if (piece?.player===turn) setSelected([r,c]);
  }, [board, selected, validMoves, turn, mode, winner, doMove]);

  const reset = () => { setBoard(makeBoard()); setSelected(null); setTurn(1); setWinner(null); };

  return (
    <GameShell title="Checkers" emoji="🔵" onReset={reset} scores={[
      { label: mode==='ai'?'You':'P1', value: scores.p1, color: '#fb923c' },
      { label: mode==='ai'?'AI':'P2', value: scores.p2, color: '#94a3b8' },
    ]}>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
        {(['ai','local'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            style={{ padding:'5px 14px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#fb923c':'#334155', background:mode===m?'#fb923c22':'transparent', color:mode===m?'#fb923c':'#94a3b8' }}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {winner ? <div style={{ textAlign:'center', marginBottom:'10px', color:'#22c55e', fontWeight:800 }}>🏆 {mode==='ai'?(winner===1?'You Win!':'AI Wins!'):(winner===1?'P1 Wins!':'P2 Wins!')}</div>
        : <div style={{ textAlign:'center', marginBottom:'10px', color:'#94a3b8', fontWeight:600, fontSize:'0.85rem' }}>{turn===1?'🟠 Your turn':'⚫ '+(mode==='ai'?'AI thinking…':'P2 turn')}</div>}
      <div style={{ display:'flex', border:'2px solid #334155', borderRadius:'10px', overflow:'hidden', margin:'0 auto' }}>
        <div>
          {board.map((row,r) => (
            <div key={r} style={{ display:'flex' }}>
              {row.map((cell,c) => {
                const dark=(r+c)%2===1;
                const isSel=selected?.[0]===r&&selected?.[1]===c;
                const isMove=moveSet.has(`${r}-${c}`);
                return (
                  <div key={c} onClick={()=>click(r,c)}
                    style={{ width:44,height:44,background:isSel?'#f59e0b44':isMove?'#22c55e22':dark?'#374151':'#e2e8f0',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',border:isMove?'2px solid #22c55e44':'2px solid transparent',transition:'all 0.15s' }}
                  >
                    {cell && (
                      <motion.div initial={{scale:0}} animate={{scale:1}}
                        style={{ width:34,height:34,borderRadius:'50%',background:cell.player===1?'#f97316':'#1e293b',border:`3px solid ${cell.player===1?'#fed7aa':'#94a3b8'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem',boxShadow:isSel?'0 0 12px #f59e0b':'none' }}
                      >{cell.king?'👑':''}</motion.div>
                    )}
                    {isMove&&!cell&&<div style={{width:14,height:14,borderRadius:'50%',background:'#22c55e55'}}/>}
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
