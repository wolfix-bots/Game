import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const ROWS = 6, COLS = 7;
const empty = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

function checkWin(board: number[][], player: number): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      if (c + 3 < COLS && [1,2,3].every(i => board[r][c+i] === player)) return true;
      if (r + 3 < ROWS && [1,2,3].every(i => board[r+i][c] === player)) return true;
      if (r + 3 < ROWS && c + 3 < COLS && [1,2,3].every(i => board[r+i][c+i] === player)) return true;
      if (r + 3 < ROWS && c - 3 >= 0 && [1,2,3].every(i => board[r+i][c-i] === player)) return true;
    }
  }
  return false;
}

function getRow(board: number[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === 0) return r;
  return -1;
}

function aiMove(board: number[][]): number {
  // Win
  for (let c = 0; c < COLS; c++) { const r = getRow(board, c); if (r < 0) continue; board[r][c] = 2; if (checkWin(board, 2)) { board[r][c] = 0; return c; } board[r][c] = 0; }
  // Block
  for (let c = 0; c < COLS; c++) { const r = getRow(board, c); if (r < 0) continue; board[r][c] = 1; if (checkWin(board, 1)) { board[r][c] = 0; return c; } board[r][c] = 0; }
  // Center preference
  const order = [3,2,4,1,5,0,6];
  for (const c of order) if (getRow(board, c) >= 0) return c;
  return 0;
}

export default function Connect4() {
  const [board, setBoard] = useState(empty());
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(0);
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [hover, setHover] = useState(-1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const drop = useCallback((col: number) => {
    if (winner) return;
    const r = getRow(board, col);
    if (r < 0) return;
    const nb = board.map(row => [...row]);
    nb[r][col] = turn;
    setBoard(nb);
    if (checkWin(nb, turn)) { setWinner(turn); setScores(s => ({ ...s, [turn === 1 ? 'p1' : 'p2']: s[turn === 1 ? 'p1' : 'p2'] + 1 })); return; }
    if (nb[0].every((_, c) => getRow(nb, c) < 0)) { setWinner(-1); return; }
    const next = turn === 1 ? 2 : 1;
    setTurn(next);
    if (mode === 'ai' && next === 2) {
      setTimeout(() => {
        const ac = aiMove(nb);
        const ar = getRow(nb, ac);
        const ab = nb.map(row => [...row]);
        ab[ar][ac] = 2;
        setBoard(ab);
        if (checkWin(ab, 2)) { setWinner(2); setScores(s => ({ ...s, p2: s.p2 + 1 })); return; }
        setTurn(1);
      }, 300);
    }
  }, [board, turn, winner, mode]);

  const reset = () => { setBoard(empty()); setTurn(1); setWinner(0); };

  const colors: Record<number, string> = { 0: 'transparent', 1: '#ef4444', 2: '#fbbf24' };

  return (
    <GameShell title="Connect Four" emoji="🔴" onReset={reset} scores={[
      { label: mode === 'ai' ? 'You' : 'P1', value: scores.p1, color: '#ef4444' },
      { label: mode === 'ai' ? 'AI' : 'P2', value: scores.p2, color: '#fbbf24' },
    ]}>
      {/* Mode */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        {(['ai','local'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            style={{ padding: '6px 16px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif',
              borderColor: mode === m ? '#ef4444' : '#334155', background: mode === m ? '#ef444422' : 'transparent', color: mode === m ? '#ef4444' : '#94a3b8' }}
          >{m === 'ai' ? '🤖 vs AI' : '👥 Local'}</button>
        ))}
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: '12px', fontWeight: 700, fontSize: '1rem', color: winner === 1 ? '#ef4444' : winner === 2 ? '#fbbf24' : winner === -1 ? '#94a3b8' : turn === 1 ? '#ef4444' : '#fbbf24' }}>
        {winner === 1 ? (mode === 'ai' ? '🎉 You Win!' : '🔴 Red Wins!') : winner === 2 ? (mode === 'ai' ? '🤖 AI Wins!' : '🟡 Yellow Wins!') : winner === -1 ? "It's a Draw!" : `${turn === 1 ? '🔴' : '🟡'} ${mode === 'ai' && turn === 2 ? 'AI thinking…' : "Turn"}`}
      </div>

      {/* Board */}
      <div style={{ display: 'inline-block', background: '#1e40af', borderRadius: '16px', padding: '10px', boxShadow: '0 8px 32px rgba(30,64,175,0.4)' }}>
        {/* Drop indicators */}
        <div style={{ display: 'flex', marginBottom: '4px' }}>
          {Array(COLS).fill(0).map((_, c) => (
            <div key={c} onClick={() => drop(c)} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(-1)}
              style={{ width: 52, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hover === c && !winner && <motion.div initial={{ y: -4 }} animate={{ y: 0 }} style={{ width: 16, height: 16, borderRadius: '50%', background: colors[turn], opacity: 0.8 }} />}
            </div>
          ))}
        </div>
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: '4px', marginBottom: r < ROWS - 1 ? '4px' : 0 }}>
            {row.map((cell, c) => (
              <div key={c} onClick={() => drop(c)} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(-1)}
                style={{ width: 52, height: 52, borderRadius: '50%', background: '#1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.1s' }}>
                <AnimatePresence>
                  {cell !== 0 && (
                    <motion.div key={`${r}-${c}`} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ width: 44, height: 44, borderRadius: '50%', background: colors[cell], boxShadow: `0 0 10px ${colors[cell]}88` }} />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ))}
      </div>
    </GameShell>
  );
}
