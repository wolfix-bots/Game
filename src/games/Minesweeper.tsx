import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; count: number };
const CONFIGS = { easy: { rows:9, cols:9, mines:10 }, medium: { rows:16, cols:16, mines:40 }, hard: { rows:16, cols:30, mines:99 } };

function makeBoard(rows: number, cols: number, mines: number, safeR: number, safeC: number): Cell[][] {
  const board: Cell[][] = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, count: 0 })));
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows), c = Math.floor(Math.random() * cols);
    if (board[r][c].mine || (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) continue;
    board[r][c].mine = true; placed++;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (board[r][c].mine) continue;
    let cnt = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const nr = r+dr, nc = c+dc; if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&board[nr][nc].mine) cnt++; }
    board[r][c].count = cnt;
  }
  return board;
}

function reveal(board: Cell[][], r: number, c: number, rows: number, cols: number): Cell[][] {
  const nb = board.map(row => row.map(cell => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
    const cell = nb[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.count === 0 && !cell.mine) for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) stack.push([cr+dr,cc+dc]);
  }
  return nb;
}

const COLORS: Record<number,string> = { 1:'#3b82f6',2:'#22c55e',3:'#ef4444',4:'#7c3aed',5:'#dc2626',6:'#0891b2',7:'#374151',8:'#9ca3af' };

export default function Minesweeper() {
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'>('easy');
  const [board, setBoard] = useState<Cell[][]|null>(null);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);
  const { rows, cols, mines } = CONFIGS[diff];

  const reset = () => { setBoard(null); setDead(false); setWon(false); setFlags(0); };

  const click = useCallback((r: number, c: number) => {
    if (dead || won) return;
    setBoard(prev => {
      const isFirst = !prev;
      const b = prev || makeBoard(rows, cols, mines, r, c);
      if (b[r][c].flagged || b[r][c].revealed) return b;
      if (b[r][c].mine) {
        const nb = b.map(row => row.map(cell => ({ ...cell, revealed: cell.mine ? true : cell.revealed })));
        setDead(true); return nb;
      }
      const nb = reveal(b, r, c, rows, cols);
      const safe = rows * cols - mines;
      const revealed = nb.flat().filter(cell => cell.revealed && !cell.mine).length;
      if (revealed === safe) setWon(true);
      return nb;
    });
  }, [dead, won, rows, cols, mines]);

  const flag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (dead || won || !board) return;
    setBoard(prev => {
      if (!prev) return prev;
      const nb = prev.map(row => row.map(cell => ({ ...cell })));
      nb[r][c].flagged = !nb[r][c].flagged;
      setFlags(f => nb[r][c].flagged ? f+1 : f-1);
      return nb;
    });
  }, [dead, won, board]);

  const cellSize = diff === 'easy' ? 36 : diff === 'medium' ? 26 : 20;

  return (
    <GameShell title="Minesweeper" emoji="💣" onReset={reset}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
        {(['easy','medium','hard'] as const).map(d => (
          <button key={d} onClick={() => { setDiff(d); reset(); }}
            style={{ padding: '5px 14px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Outfit,sans-serif', textTransform: 'capitalize',
              borderColor: diff === d ? '#a78bfa' : '#334155', background: diff === d ? '#a78bfa22' : 'transparent', color: diff === d ? '#a78bfa' : '#94a3b8' }}
          >{d}</button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 700, color: dead ? '#ef4444' : won ? '#22c55e' : '#94a3b8' }}>
        {dead ? '💥 Boom! Game Over' : won ? '🎉 You Win!' : `💣 ${mines - flags} remaining`}
      </div>
      {!board && (
        <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '12px', fontSize: '0.85rem' }}>Click any cell to start</div>
      )}
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <div style={{ display: 'inline-block', background: '#0f172a', borderRadius: '10px', padding: '6px', border: '2px solid #1e293b' }}>
          {(board || Array(rows).fill(null).map(() => Array(cols).fill({ mine:false,revealed:false,flagged:false,count:0 }))).map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => (
                <div key={c}
                  onClick={() => { if (!board) { setBoard(makeBoard(rows,cols,mines,r,c)); } else { click(r,c); } }}
                  onContextMenu={e => flag(e, r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    background: cell.revealed ? (cell.mine ? '#7f1d1d' : '#1e293b') : '#334155',
                    border: '1px solid #0f172a', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize * 0.5, fontWeight: 800,
                    color: cell.revealed && !cell.mine ? COLORS[cell.count] || 'transparent' : '#e2e8f0',
                    userSelect: 'none',
                  }}
                >
                  {cell.revealed && cell.mine ? '💣' : cell.flagged && !cell.revealed ? '🚩' : cell.revealed && cell.count > 0 ? cell.count : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#475569', fontSize: '0.75rem' }}>Right-click to flag</div>
    </GameShell>
  );
}
