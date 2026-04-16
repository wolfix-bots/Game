import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Users, MessageCircle, Send,
  WifiOff, RefreshCw, Link, Loader2, LogOut,
} from 'lucide-react';

import { ably, getRoomChannel } from '../lib/ably';
import { ThemeConfig } from '../lib/themes';
import { checkWinner, isDraw } from '../lib/AI';
import GameBoard from './GameBoard';
import { sounds } from '../lib/sounds';
import { saveScore } from '../lib/storage';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMsg { text: string; player: string; ts: number; }

interface RoomState {
  board:   string[];
  turn:    string;
  playerX: string | null;
  playerO: string | null;
  winner:  string | null;
  isDraw:  boolean;
  chat:    ChatMsg[];
}

type GameMsg =
  | { type: 'state';  state: RoomState }
  | { type: 'role';   role: 'X' | 'O' }
  | { type: 'move';   index: number; player: string }
  | { type: 'reset' }
  | { type: 'chat';   text: string; player: string; ts: number }
  | { type: 'join';   clientId: string };

interface MultiplayerProps {
  theme: ThemeConfig;
  emojiX: string;
  emojiO: string;
  soundEnabled: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

const EMPTY_BOARD = Array(9).fill('');
const EMPTY_STATE = (): RoomState => ({
  board: EMPTY_BOARD,
  turn: 'X',
  playerX: null,
  playerO: null,
  winner: null,
  isDraw: false,
  chat: [],
});

// ─── Component ───────────────────────────────────────────────────────────────
export default function Multiplayer({ theme, emojiX, emojiO, soundEnabled }: MultiplayerProps) {
  const [screen, setScreen]         = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [myRole, setMyRole]         = useState<'X' | 'O' | null>(null);
  const [roomId, setRoomId]         = useState('');
  const [joinInput, setJoinInput]   = useState('');
  const [gameState, setGameState]   = useState<RoomState>(EMPTY_STATE());
  const [chatMsg, setChatMsg]       = useState('');
  const [showChat, setShowChat]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState('');

  const channelRef  = useRef<any>(null);
  const myRoleRef   = useRef<'X' | 'O' | null>(null);
  const myIdRef     = useRef(ably.auth.clientId || Math.random().toString(36).slice(2));
  const gameRef     = useRef<RoomState>(EMPTY_STATE());
  const chatEndRef  = useRef<HTMLDivElement>(null);
  myRoleRef.current = myRole;
  gameRef.current   = gameState;

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chat]);

  // Auto-join from ?room=CODE
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('room');
    if (code) {
      setJoinInput(code.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { detach(); }, []);

  // ── Detach channel ───────────────────────────────────────────────────────────
  function detach() {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current.detach();
      channelRef.current = null;
    }
  }

  // ── Publish helper ───────────────────────────────────────────────────────────
  async function publish(msg: GameMsg) {
    try { await channelRef.current?.publish('game', msg); } catch (e) {}
  }

  // ── Connect to channel ──────────────────────────────────────────────────────
  const joinChannel = useCallback(async (code: string, asHost: boolean) => {
    detach();
    setConnecting(true);
    setError('');

    try {
      const ch = getRoomChannel(code);
      channelRef.current = ch;

      // Listen for all game messages
      await ch.subscribe('game', (msg: any) => {
        const data = msg.data as GameMsg;
        const role = myRoleRef.current;

        if (data.type === 'state') {
          const prev = gameRef.current;
          setGameState(data.state);
          gameRef.current = data.state;

          // Sound cues
          if (data.state.winner && !prev.winner && soundEnabled) sounds.win();
          if (data.state.isDraw && !prev.isDraw && soundEnabled) sounds.draw();

          // Transition waiting → game
          if (role === 'X' && data.state.playerO) setScreen('game');

          // Score tracking
          if (role) {
            if (data.state.winner && !prev.winner)
              saveScore('online', data.state.winner === role ? 'win' : 'loss');
            else if (data.state.isDraw && !prev.isDraw)
              saveScore('online', 'draw');
          }
        }

        if (data.type === 'join' && asHost) {
          const newState: RoomState = {
            ...gameRef.current,
            playerO: data.clientId,
          };
          setGameState(newState);
          gameRef.current = newState;
          setScreen('game');
          publish({ type: 'state', state: newState });
        }
      });

      await ch.attach();
      setConnected(true);
      setConnecting(false);

      if (asHost) {
        // Host: initialise state
        const initState: RoomState = {
          ...EMPTY_STATE(),
          playerX: myIdRef.current,
        };
        setGameState(initState);
        gameRef.current = initState;
        setMyRole('X');
        myRoleRef.current = 'X';
        setScreen('waiting');
      } else {
        setMyRole('O');
        myRoleRef.current = 'O';
        setScreen('game');
        await publish({ type: 'join', clientId: myIdRef.current });
        if (soundEnabled) sounds.join();
      }
    } catch (e: any) {
      setConnecting(false);
      setConnected(false);
      setError('Connection failed. Please try again.');
    }
  }, [soundEnabled]);

  // ── Create room ─────────────────────────────────────────────────────────────
  const createRoom = useCallback(() => {
    const code = genCode();
    setRoomId(code);
    joinChannel(code, true);
  }, [joinChannel]);

  // ── Join room ───────────────────────────────────────────────────────────────
  const joinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase().slice(0, 6);
    if (code.length < 4) { setError('Enter a valid room code.'); return; }
    setRoomId(code);
    joinChannel(code, false);
  }, [joinInput, joinChannel]);

  // ── Make a move ─────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((i: number) => {
    const g = gameRef.current;
    const role = myRoleRef.current;
    if (!role) return;
    if (g.turn !== role) return;
    if (g.board[i] !== '') return;
    if (g.winner || g.isDraw) return;

    const newBoard = [...g.board];
    newBoard[i] = role;
    if (soundEnabled) sounds.click();

    const w = checkWinner(newBoard);
    const d = !w && isDraw(newBoard);
    const next = role === 'X' ? 'O' : 'X';

    const newState: RoomState = {
      ...g,
      board:   newBoard,
      turn:    next,
      winner:  w ?? null,
      isDraw:  d,
    };

    setGameState(newState);
    gameRef.current = newState;
    publish({ type: 'state', state: newState });
  }, [soundEnabled]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    const g = gameRef.current;
    const newState: RoomState = {
      ...EMPTY_STATE(),
      playerX: g.playerX,
      playerO: g.playerO,
    };
    setGameState(newState);
    gameRef.current = newState;
    publish({ type: 'state', state: newState });
  }, []);

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    const role = myRoleRef.current;
    if (!chatMsg.trim() || !role) return;
    const g = gameRef.current;
    const msg: ChatMsg = { text: chatMsg.trim(), player: role, ts: Date.now() };
    setChatMsg('');
    const newState: RoomState = {
      ...g,
      chat: [...(g.chat || []).slice(-49), msg],
    };
    setGameState(newState);
    gameRef.current = newState;
    publish({ type: 'state', state: newState });
  }, [chatMsg]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leave = useCallback(() => {
    detach();
    setScreen('lobby'); setMyRole(null); setRoomId('');
    setGameState(EMPTY_STATE()); setConnected(false); setError('');
  }, []);

  // ── Copy invite link ────────────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [roomId]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const mapEmoji      = (v: string) => v === 'X' ? emojiX : v === 'O' ? emojiO : v;
  const displayBoard  = gameState.board.map(mapEmoji);
  const myTurn        = gameState.turn === myRole;
  const winner        = gameState.winner;
  const gameDraw      = gameState.isDraw;
  const opponentJoined = myRole === 'X' ? !!gameState.playerO : !!gameState.playerX;
  const opponentLeft   = screen === 'game' && !opponentJoined && !winner && !gameDraw;

  // ════════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'lobby') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {/* Info banner */}
        <div style={{
          background: `${theme.accent}15`,
          border: `1px solid ${theme.accent}44`,
          borderRadius: '14px', padding: '12px 16px',
          fontSize: '0.82rem', lineHeight: 1.6, color: theme.textMuted,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🦊</span>
          <span style={{ color: theme.textMuted }}>
            Create a room, share the code with a friend, play instantly.
          </span>
        </div>

        {error && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef4444',
            borderRadius: '12px', padding: '10px 14px',
            color: '#ef4444', fontSize: '0.85rem',
          }}>{error}</div>
        )}

        <button onClick={createRoom} disabled={connecting} style={{
          background: theme.accent, border: 'none', borderRadius: '14px',
          padding: '14px', color: '#fff', fontWeight: 700, fontSize: '1rem',
          cursor: connecting ? 'not-allowed' : 'pointer',
          opacity: connecting ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'opacity 0.2s',
        }}>
          {connecting
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
            : <><Users size={18} /> Create Room</>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
          <span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>or join existing</span>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={joinInput}
            onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Room code…"
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            style={{
              flex: 1, background: theme.cellBg, border: `2px solid ${theme.border}`,
              borderRadius: '12px', padding: '12px 14px', color: theme.text,
              fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.2em',
              outline: 'none', textTransform: 'uppercase',
            }}
          />
          <button onClick={joinRoom} disabled={connecting} style={{
            background: theme.cellBg, border: `2px solid ${theme.accent}`,
            borderRadius: '12px', padding: '12px 18px',
            color: theme.accent, fontWeight: 700, fontSize: '1rem',
            cursor: connecting ? 'not-allowed' : 'pointer',
          }}>Join</button>
        </div>
      </motion.div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WAITING
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'waiting') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '20px', padding: '28px 20px',
          backdropFilter: 'blur(12px)', textAlign: 'center',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{ fontSize: '2.4rem', marginBottom: '14px', display: 'inline-block' }}
          >⏳</motion.div>

          <div style={{ color: theme.text, fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
            Waiting for opponent…
          </div>
          <div style={{ color: theme.textMuted, fontSize: '0.83rem', marginBottom: '22px' }}>
            Share the code or link below
          </div>

          {/* Room code */}
          <div style={{
            fontFamily: 'monospace', fontSize: '2.4rem', fontWeight: 900,
            letterSpacing: '0.35em', color: theme.accent,
            background: theme.cellBg, borderRadius: '16px',
            padding: '16px 20px', marginBottom: '14px',
            border: `2px solid ${theme.accent}55`,
            textShadow: `0 0 24px ${theme.accent}66`,
          }}>{roomId}</div>

          {/* Copy link */}
          <button onClick={copyLink} style={{
            background: copied ? '#22c55e22' : `${theme.accent}22`,
            border: `2px solid ${copied ? '#22c55e' : theme.accent}`,
            borderRadius: '12px', padding: '12px 18px',
            cursor: 'pointer', color: copied ? '#22c55e' : theme.accent,
            fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', width: '100%', transition: 'all 0.2s',
          }}>
            {copied ? <Check size={16} /> : <Link size={16} />}
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>

          {/* Status dot */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
            />
            <span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>Connected — waiting for player 2</span>
          </div>
        </div>

        <button onClick={leave} style={{
          background: 'transparent', border: `1px solid ${theme.border}`,
          borderRadius: '12px', padding: '10px',
          color: theme.textMuted, cursor: 'pointer', fontWeight: 600,
        }}>Cancel</button>
      </motion.div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GAME
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* Header */}
      <div style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: '14px', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>You</div>
            <div style={{ color: theme.accent, fontSize: '1.3rem', fontWeight: 800 }}>
              {myRole === 'X' ? emojiX : emojiO} {myRole}
            </div>
          </div>
          <div style={{ color: theme.textMuted, fontWeight: 700 }}>vs</div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Opponent</div>
            <div style={{ color: theme.textMuted, fontSize: '1.3rem', fontWeight: 800 }}>
              {myRole === 'X' ? emojiO : emojiX} {myRole === 'X' ? 'O' : 'X'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              boxShadow: `0 0 6px ${connected ? '#22c55e' : '#ef4444'}`,
            }}
            title={connected ? 'Connected' : 'Disconnected'}
          />
          <button onClick={copyLink} title="Copy invite link" style={{
            background: theme.cellBg, border: `1px solid ${theme.border}`,
            borderRadius: '10px', padding: '8px', cursor: 'pointer',
            color: copied ? '#22c55e' : theme.textMuted, display: 'flex', transition: 'all 0.2s',
          }}>
            {copied ? <Check size={16} /> : <Link size={16} />}
          </button>
          <button onClick={leave} style={{
            background: '#ef444418', border: '1px solid #ef444440',
            borderRadius: '10px', padding: '8px',
            cursor: 'pointer', color: '#ef4444', display: 'flex',
          }}><LogOut size={16} /></button>
        </div>
      </div>

      {/* Room code pill */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700,
          letterSpacing: '0.15em', color: theme.textMuted,
          background: theme.cellBg, borderRadius: '20px',
          padding: '4px 14px', border: `1px solid ${theme.border}`,
        }}>Room: {roomId}</span>
      </div>

      {/* Opponent left */}
      {opponentLeft && (
        <div style={{
          background: '#f59e0b22', border: '1px solid #f59e0b44',
          borderRadius: '12px', padding: '10px 14px', color: '#f59e0b',
          fontSize: '0.85rem', textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <WifiOff size={14} /> Opponent disconnected — reset or leave
        </div>
      )}

      {/* Turn indicator */}
      {!winner && !gameDraw && !opponentLeft && (
        <motion.div
          key={String(myTurn)}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', padding: '4px',
            color: myTurn ? theme.accent : theme.textMuted,
          }}
        >
          {myTurn
            ? `Your turn — ${myRole === 'X' ? emojiX : emojiO}`
            : `Opponent's turn — ${myRole === 'X' ? emojiO : emojiX}`}
        </motion.div>
      )}

      {/* Result */}
      {(winner || gameDraw) && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{
            background: winner === myRole ? '#22c55e22' : gameDraw ? '#f59e0b22' : '#ef444422',
            border: `1px solid ${winner === myRole ? '#22c55e' : gameDraw ? '#f59e0b' : '#ef4444'}44`,
            borderRadius: '14px', padding: '16px', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>
            {winner === myRole ? '🏆' : gameDraw ? '🤝' : '💔'}
          </div>
          <div style={{ color: winner === myRole ? '#22c55e' : gameDraw ? '#f59e0b' : '#ef4444', fontWeight: 800, fontSize: '1.15rem' }}>
            {winner === myRole ? 'You Win!' : gameDraw ? "It's a Draw!" : 'You Lose!'}
          </div>
          <button onClick={resetGame} style={{
            marginTop: '12px', background: theme.accent, border: 'none',
            borderRadius: '10px', padding: '8px 20px', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            <RefreshCw size={14} /> Play Again
          </button>
        </motion.div>
      )}

      {/* Board */}
      <div style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: '20px', padding: 'clamp(12px,3vw,20px)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: theme.shadow,
      }}>
        <GameBoard
          board={displayBoard}
          onCellClick={handleCellClick}
          disabled={!myTurn || !!winner || gameDraw || opponentLeft || !connected}
          theme={theme}
          gameOver={!!winner || gameDraw}
        />
      </div>

      {/* Chat toggle */}
      <button onClick={() => setShowChat(s => !s)} style={{
        background: theme.cellBg,
        border: `1px solid ${showChat ? theme.accent : theme.border}`,
        borderRadius: '12px', padding: '10px 14px', cursor: 'pointer',
        color: showChat ? theme.accent : theme.textMuted,
        display: 'flex', alignItems: 'center', gap: '8px',
        fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
      }}>
        <MessageCircle size={16} />
        Chat {gameState.chat?.length ? `(${gameState.chat.length})` : ''}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(12px)',
            }}>
              <div style={{
                height: '160px', overflowY: 'auto', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {!gameState.chat?.length && (
                  <div style={{ color: theme.textMuted, fontSize: '0.8rem', textAlign: 'center', marginTop: '50px' }}>
                    No messages yet
                  </div>
                )}
                {gameState.chat?.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.player === myRole ? 'flex-end' : 'flex-start',
                    background: msg.player === myRole ? theme.accent : theme.cellBg,
                    color: msg.player === myRole ? '#fff' : theme.text,
                    borderRadius: '10px', padding: '6px 10px',
                    fontSize: '0.82rem', maxWidth: '80%',
                  }}>
                    <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>
                      {msg.player === myRole ? 'You' : 'Opp'}:{' '}
                    </span>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ borderTop: `1px solid ${theme.border}`, padding: '10px', display: 'flex', gap: '8px' }}>
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Type a message…"
                  maxLength={100}
                  style={{
                    flex: 1, background: theme.cellBg,
                    border: `1px solid ${theme.border}`, borderRadius: '8px',
                    padding: '8px 10px', color: theme.text, fontSize: '0.85rem', outline: 'none',
                  }}
                />
                <button onClick={sendChat} style={{
                  background: theme.accent, border: 'none', borderRadius: '8px',
                  padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex',
                }}><Send size={14} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
