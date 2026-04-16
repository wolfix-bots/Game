import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell, { awardGameXP } from '../components/GameShell';
import { useApp } from '../App';
import { OnlineRoom, genRoomCode, RoomPlayer } from '../lib/onlineRoom';
import { Copy, Check, Users, Wifi, WifiOff } from 'lucide-react';

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
  for (let c = 0; c < COLS; c++) { const r = getRow(board, c); if (r < 0) continue; board[r][c] = 2; if (checkWin(board, 2)) { board[r][c] = 0; return c; } board[r][c] = 0; }
  for (let c = 0; c < COLS; c++) { const r = getRow(board, c); if (r < 0) continue; board[r][c] = 1; if (checkWin(board, 1)) { board[r][c] = 0; return c; } board[r][c] = 0; }
  const order = [3,2,4,1,5,0,6];
  for (const c of order) if (getRow(board, c) >= 0) return c;
  return 0;
}

interface OnlineState { board: number[][]; turn: number; winner: number; }

export default function Connect4() {
  const { user } = useApp();
  const [board, setBoard] = useState(empty());
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(0);
  const [mode, setMode] = useState<'ai'|'local'|'online'>('ai');
  const [hover, setHover] = useState(-1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [xpAwarded, setXpAwarded] = useState(false);

  // Online state
  const [onlineScreen, setOnlineScreen] = useState<'lobby'|'waiting'|'game'>('lobby');
  const [myRole, setMyRole] = useState<1|2|null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [opponent, setOpponent] = useState<RoomPlayer|null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const roomRef = useRef<OnlineRoom<OnlineState>|null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => () => { roomRef.current?.leave(); }, []);

  const resetLocal = () => { setBoard(empty()); setTurn(1); setWinner(0); setXpAwarded(false); setHover(-1); };

  const handleWin = useCallback((w: number, isOnline = false, myR: number|null = null) => {
    if (xpAwarded) return;
    setXpAwarded(true);
    if (isOnline) {
      awardGameXP('connect4', user.id, user, w === myR ? 'win' : 'loss');
    } else {
      awardGameXP('connect4', user.id, user, w === 1 ? 'win' : 'loss');
    }
    setScores(s => ({ ...s, [w === 1 ? 'p1' : 'p2']: s[w === 1 ? 'p1' : 'p2'] + 1 }));
  }, [xpAwarded, user]);

  const drop = useCallback((col: number) => {
    if (winner) return;
    if (mode === 'online') {
      if (myRole !== turn) return;
      const r = getRow(board, col);
      if (r < 0) return;
      const nb = board.map(row => [...row]);
      nb[r][col] = turn;
      const w = checkWin(nb, turn) ? turn : 0;
      const nextTurn = turn === 1 ? 2 : 1;
      setBoard(nb); if (w) { setWinner(w); handleWin(w, true, myRole); } else setTurn(nextTurn);
      roomRef.current?.publish({ type: 'state', state: { board: nb, turn: w ? turn : nextTurn, winner: w } });
      return;
    }
    const r = getRow(board, col);
    if (r < 0) return;
    const nb = board.map(row => [...row]);
    nb[r][col] = turn;
    setBoard(nb);
    if (checkWin(nb, turn)) { setWinner(turn); handleWin(turn); return; }
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
        if (checkWin(ab, 2)) { setWinner(2); handleWin(2); return; }
        setTurn(1);
      }, 300);
    }
  }, [board, turn, winner, mode, myRole, handleWin]);

  // Online room handlers
  const createRoom = async () => {
    const code = genRoomCode();
    setRoomCode(code);
    const room = new OnlineRoom<OnlineState>(code);
    roomRef.current = room;
    await room.connect();
    room.subscribe(msg => {
      if (msg.type === 'join') { setOpponent(msg.player); setOnlineScreen('game'); }
      if (msg.type === 'state') { setBoard(msg.state.board); setTurn(msg.state.turn); if (msg.state.winner) { setWinner(msg.state.winner); handleWin(msg.state.winner, true, 1); } }
      if (msg.type === 'leave') { setOpponentLeft(true); }
    });
    setMyRole(1); setOnlineScreen('waiting');
  };

  const joinRoom = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 4) return;
    setRoomCode(code);
    const room = new OnlineRoom<OnlineState>(code);
    roomRef.current = room;
    await room.connect();
    room.subscribe(msg => {
      if (msg.type === 'state') { setBoard(msg.state.board); setTurn(msg.state.turn); if (msg.state.winner) { setWinner(msg.state.winner); handleWin(msg.state.winner, true, 2); } }
      if (msg.type === 'leave') { setOpponentLeft(true); }
    });
    await room.publish({ type: 'join', player: { id: user.id, username: user.username, avatar: user.avatar } });
    setMyRole(2); setOnlineScreen('game');
  };

  const leaveRoom = () => {
    roomRef.current?.publish({ type: 'leave', playerId: user.id });
    roomRef.current?.leave();
    roomRef.current = null;
    setOnlineScreen('lobby'); setMyRole(null); setOpponent(null); setOpponentLeft(false); resetLocal();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${location.origin}/game/connect4?room=${roomCode}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const colors: Record<number, string> = { 0: 'transparent', 1: '#ef4444', 2: '#fbbf24' };

  const OnlineLobby = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '340px', margin: '0 auto', width: '100%' }}>
      <button onClick={createRoom} style={{ background: '#ef4444', border: 'none', borderRadius: '14px', padding: '13px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Outfit',sans-serif" }}>
        <Users size={18} /> Create Room
      </button>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={joinInput} onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0,6))} placeholder="Room code…" onKeyDown={e => e.key === 'Enter' && joinRoom()}
          style={{ flex: 1, background: 'rgba(15,23,42,0.6)', border: '2px solid rgba(148,163,184,0.15)', borderRadius: '12px', padding: '12px', color: '#e2e8f0', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.15em', outline: 'none' }} />
        <button onClick={joinRoom} style={{ background: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', borderRadius: '12px', padding: '12px 16px', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Join</button>
      </div>
    </div>
  );

  const OnlineWaiting = () => (
    <div style={{ textAlign: 'center', maxWidth: '340px', margin: '0 auto' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'inline-block' }}>⏳</motion.div>
      <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '16px' }}>Waiting for opponent…</div>
      <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.3em', color: '#ef4444', background: 'rgba(15,23,42,0.6)', borderRadius: '14px', padding: '14px', marginBottom: '14px', border: '2px solid #ef444455' }}>{roomCode}</div>
      <button onClick={copyLink} style={{ background: copied ? '#22c55e22' : '#ef444422', border: `2px solid ${copied ? '#22c55e' : '#ef4444'}`, borderRadius: '12px', padding: '10px 18px', cursor: 'pointer', color: copied ? '#22c55e' : '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto 12px', fontFamily: "'Outfit',sans-serif" }}>
        {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Invite Link'}
      </button>
      <button onClick={leaveRoom} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', color: '#64748b', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
    </div>
  );

  return (
    <GameShell title="Connect Four" emoji="🔴" gameId="connect4" onReset={mode !== 'online' ? resetLocal : undefined} scores={mode !== 'online' ? [
      { label: mode === 'ai' ? 'You' : 'P1', value: scores.p1, color: '#ef4444' },
      { label: mode === 'ai' ? 'AI' : 'P2', value: scores.p2, color: '#fbbf24' },
    ] : undefined}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
        {(['ai','local','online'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); resetLocal(); if (m !== 'online') { roomRef.current?.leave(); setOnlineScreen('lobby'); } }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: "'Outfit',sans-serif", textTransform: 'capitalize',
              borderColor: mode === m ? '#ef4444' : '#334155', background: mode === m ? '#ef444422' : 'transparent', color: mode === m ? '#ef4444' : '#94a3b8' }}
          >{m === 'ai' ? '🤖 AI' : m === 'local' ? '👥 Local' : '🌐 Online'}</button>
        ))}
      </div>

      {/* Online screens */}
      {mode === 'online' && onlineScreen === 'lobby' && <OnlineLobby />}
      {mode === 'online' && onlineScreen === 'waiting' && <OnlineWaiting />}

      {/* Game board */}
      {(mode !== 'online' || onlineScreen === 'game') && (
        <>
          {mode === 'online' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', maxWidth: '420px', width: '100%', margin: '0 auto 10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>You: {myRole === 1 ? '🔴' : '🟡'} · Room: <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{roomCode}</span></div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {opponentLeft ? <WifiOff size={14} style={{ color: '#f59e0b' }} /> : <Wifi size={14} style={{ color: '#22c55e' }} />}
                <button onClick={leaveRoom} style={{ background: '#ef444418', border: '1px solid #ef444430', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', fontFamily: "'Outfit',sans-serif" }}>Leave</button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 700, fontSize: '0.95rem', color: winner === 1 ? '#ef4444' : winner === 2 ? '#fbbf24' : winner === -1 ? '#94a3b8' : turn === 1 ? '#ef4444' : '#fbbf24' }}>
            {winner === 1 ? (mode === 'ai' ? '🎉 You Win!' : mode === 'online' ? (myRole === 1 ? '🎉 You Win!' : '😞 You Lose!') : '🔴 Red Wins!')
              : winner === 2 ? (mode === 'ai' ? '🤖 AI Wins!' : mode === 'online' ? (myRole === 2 ? '🎉 You Win!' : '😞 You Lose!') : '🟡 Yellow Wins!')
              : winner === -1 ? "It's a Draw!"
              : mode === 'online' ? (turn === myRole ? 'Your turn' : "Opponent's turn…")
              : `${turn === 1 ? '🔴' : '🟡'} ${mode === 'ai' && turn === 2 ? 'AI thinking…' : 'Turn'}`}
          </div>

          <div style={{ display: 'inline-block', background: '#1e40af', borderRadius: '16px', padding: '10px', boxShadow: '0 8px 32px rgba(30,64,175,0.4)' }}>
            <div style={{ display: 'flex', marginBottom: '4px' }}>
              {Array(COLS).fill(0).map((_, c) => (
                <div key={c} onClick={() => drop(c)} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(-1)}
                  style={{ width: 50, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {hover === c && !winner && <motion.div initial={{ y: -4 }} animate={{ y: 0 }} style={{ width: 14, height: 14, borderRadius: '50%', background: colors[turn], opacity: 0.8 }} />}
                </div>
              ))}
            </div>
            {board.map((row, r) => (
              <div key={r} style={{ display: 'flex', gap: '4px', marginBottom: r < ROWS - 1 ? '4px' : 0 }}>
                {row.map((cell, c) => (
                  <div key={c} onClick={() => drop(c)} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(-1)}
                    style={{ width: 50, height: 50, borderRadius: '50%', background: '#1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence>
                      {cell !== 0 && (
                        <motion.div key={`${r}-${c}`} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          style={{ width: 42, height: 42, borderRadius: '50%', background: colors[cell], boxShadow: `0 0 10px ${colors[cell]}88` }} />
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {winner !== 0 && mode !== 'online' && (
            <button onClick={resetLocal} style={{ marginTop: '14px', background: '#ef4444', border: 'none', borderRadius: '12px', padding: '10px 24px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Play Again</button>
          )}
        </>
      )}
    </GameShell>
  );
}
