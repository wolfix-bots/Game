import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Piece = { player: 1|2; king: boolean } | null;
type Board = Piece[][];

function makeBoard(): Board {
  return Array(8).fill(null).map((_, r) =>
    Array(8).fill(null).map((__, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 3) return { player: 2, king: false };
        if (r > 4) return { player: 1, king: false };
      }
      return null;
    })
  );
}

function getMoves(board: Board, r: number, c: number): [number,number][] {
  const p = board[r][c]; if (!p) return [];
  const dirs = p.king ? [-1,1] : p.player === 1 ? [-1] : [1];
  const moves: [number,number][] = [];
  for (const dr of dirs) for (const dc of [-1,1]) {
    const nr = r+dr, nc = c+dc;
    if (nr>=0&&nr<8&&nc>=0&&nc<8&&!board[nr][nc]) moves.push([nr,nc]);
  }
  return moves;
}

function getJumps(board: Board, r: number, c: number): [number,number,number,number][] {
  const p = board[r][c]; if (!p) return [];
  const dirs = p.king ? [-1,1] : p.player === 1 ? [-1] : [1];
  const jumps: [number,number,number,number][] = [];
  for (const dr of dirs) for (const dc of [-1,1]) {
    const mr = r+dr, mc = c+dc, nr = r+dr*2, nc = c+dc*2;
    if (nr>=0&&nr<8&&nc>=0&&nc<8&&board[mr]?.[mc]&&board[mr][mc]!.player!==p.player&&!board[nr][nc])
      jumps.push([nr,nc,mr,mc]);
  }
  return jumps;
}

export default function Checkers() {
  const [board, setBoard] = useState<Board>(makeBoard);
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [turn, setTurn] = useState<1|2>(1);
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [scores, setScores] = useState({ p1:0, p2:0 });
  const [winner, setWinner] = useState<1|2|null>(null);

  const validMoves = selected ? [...getJumps(board,selected[0],selected[1]).map(([r,c])=>[r,c] as [number,number]), ...(!getJumps(board,selected[0],selected[1]).length ? getMoves(board,selected[0],selected[1]) : [])] : [];
  const validSet = new Set(validMoves.map(([r,c])=>`${r}-${c}`));

  const aiTurn = useCallback((b: Board) => {
    const pieces: [number,number][] = [];
    b.forEach((row,r) => row.forEach((p,c) => { if (p?.player===2) pieces.push([r,c]); }));
    for (const [r,c] of pieces) {
      const jumps = getJumps(b,r,c);
      if (jumps.length) {
        const [nr,nc,mr,mc] = jumps[0];
        const nb = b.map(row => row.map(p => p ? {...p} : null));
        nb[nr][nc] = {...nb[r][c]!, king: nb[r][c]!.king || nr===7};
        nb[r][c] = null; nb[mr][mc] = null;
        const remaining = nb.flat().filter(p=>p?.player===1).length;
        if (!remaining) { setWinner(2); setScores(s=>({...s,p2:s.p2+1})); }
        setBoard(nb); setTurn(1); return;
      }
    }
    const withMoves = pieces.filter(([r,c]) => getMoves(b,r,c).length);
    if (!withMoves.length) { setWinner(1); setScores(s=>({...s,p1:s.p1+1})); return; }
    const [r,c] = withMoves[Math.floor(Math.random()*withMoves.length)];
    const moves = getMoves(b,r,c);
    const [nr,nc] = moves[Math.floor(Math.random()*moves.length)];
    const nb = b.map(row => row.map(p => p ? {...p} : null));
    nb[nr][nc] = {...nb[r][c]!, king: nb[r][c]!.king || nr===7};
    nb[r][c] = null;
    setBoard(nb); setTurn(1);
  }, []);

  const click = (r: number, c: number) => {
    if (winner) return;
    if (board[r][c]?.player === turn) { setSelected([r,c]); return; }
    if (!selected || !validSet.has(`${r}-${c}`)) { setSelected(null); return; }
    const nb = board.map(row => row.map(p => p ? {...p} : null));
    const jumps = getJumps(board,selected[0],selected[1]);
    const jump = jumps.find(([jr,jc])=>jr===r&&jc===c);
    if (jump) nb[jump[2]][jump[3]] = null;
    nb[r][c] = {...nb[selected[0]][selected[1]]!, king: nb[selected[0]][selected[1]]!.king || (turn===1&&r===0) || (turn===2&&r===7)};
    nb[selected[0]][selected[1]] = null;
    setSelected(null);
    const remaining1 = nb.flat().filter(p=>p?.player===1).length;
    const remaining2 = nb.flat().filter(p=>p?.player===2).length;
    if (!remaining1) { setBoard(nb); setWinner(2); setScores(s=>({...s,p2:s.p2+1})); return; }
    if (!remaining2) { setBoard(nb); setWinner(1); setScores(s=>({...s,p1:s.p1+1})); return; }
    const next: 1|2 = turn===1?2:1;
    setBoard(nb); setTurn(next);
    if (mode==='ai'&&next===2) setTimeout(()=>aiTurn(nb),400);
  };

  const reset = () => { setBoard(makeBoard()); setSelected(null); setTurn(1); setWinner(null); };

  return (
    <GameShell title="Checkers" emoji="🔵" onReset={reset} scores={[
      { label: mode==='ai'?'You':'P1', value: scores.p1, color: '#e2e8f0' },
      { label: mode==='ai'?'AI':'P2', value: scores.p2, color: '#fb923c' },
    ]}>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px' }}>
        {(['ai','local'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            style={{ padding:'5px 14px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#fb923c':'#334155', background:mode===m?'#fb923c22':'transparent', color:mode===m?'#fb923c':'#94a3b8' }}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {winner && <div style={{ textAlign:'center', marginBottom:'10px', color:'#fb923c', fontWeight:800 }}>🏆 {mode==='ai'?(winner===1?'You Win!':'AI Wins!'):`Player ${winner} Wins!`}</div>}
      {!winner && <div style={{ textAlign:'center', marginBottom:'10px', color:'#94a3b8', fontSize:'0.85rem', fontWeight:600 }}>{turn===1?'⚪':'🟠'} {mode==='ai'&&turn===2?'AI thinking…':'Turn'}</div>}
      <div style={{ display:'flex', background:'#1e293b', borderRadius:'12px', padding:'6px', border:'2px solid #334155', margin:'0 auto' }}>
        <div>
          {board.map((row,r) => (
            <div key={r} style={{ display:'flex' }}>
              {row.map((piece,c) => {
                const dark = (r+c)%2===1;
                const isSel = selected?.[0]===r&&selected?.[1]===c;
                const isValid = validSet.has(`${r}-${c}`);
                return (
                  <div key={c} onClick={() => click(r,c)}
                    style={{ width:44, height:44, background: dark?(isSel?'#1d4ed8':isValid?'#065f46':'#374151'):'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' as const, transition:'background 0.15s' }}
                  >
                    {isValid&&dark&&!piece&&<div style={{ width:14, height:14, borderRadius:'50%', background:'rgba(34,197,94,0.5)' }}/>}
                    {piece&&(
                      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400,damping:20}}
                        style={{ width:34, height:34, borderRadius:'50%', background:piece.player===1?'#f1f5f9':'#fb923c', border:`3px solid ${isSel?'#3b82f6':piece.player===1?'#94a3b8':'#c2410c'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', boxShadow:isSel?'0 0 12px #3b82f6':'none' }}
                      >{piece.king?'👑':''}</motion.div>
                    )}
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
