import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Users, MessageCircle, Send,
  WifiOff, RefreshCw, Link, Loader2, LogOut, Zap,
} from 'lucide-react';
import PartySocket from 'partysocket';
import { ThemeConfig } from '../lib/themes';
import GameBoard from './GameBoard';
import { sounds } from '../lib/sounds';
import { saveScore } from '../lib/storage';

// ─── Config ──────────────────────────────────────────────────────────────────
// PartyKit host: use env var in prod, default to partykit.dev for dev/demo
const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST || 'tictactoe-pro.USERNAME.partykit.dev';

const IS_DEMO = PARTYKIT_HOST.includes('USERNAME');

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMsg  { text: string; player: string; ts: number; }
interface RoomState {
  board:    string[];
  turn:     string;
  playerX:  string | null;
  playerO:  string | null;
  winner:   string | null;
  isDraw:   boolean;
  chat:     ChatMsg[];
}

type ServerMsg =
  | { type: 'state'; state: RoomState }
  | { type: 'role';  role: 'X' | 'O' | null };

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

// ─── Component ───────────────────────────────────────────────────────────────
export default function Multiplayer({ theme, emojiX, emojiO, soundEnabled }: MultiplayerProps) {
  const [screen, setScreen]     = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [myRole, setMyRole]     = useState<'X' | 'O' | null>(null);
  const [roomId, setRoomId]     = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [serverState, setServerState] = useState<RoomState | null>(null);
  const [chatMsg, setChatMsg]   = useState('');
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected]   = useState(false);
  const [error, setError]       = useState('');

  const socketRef  = useRef<PartySocket | null>(null);
  const myRoleRef  = useRef<'X' | 'O' | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  myRoleRef.current = myRole;

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serverState?.chat]);

  // Cleanup
  useEffect(() => () => { socketRef.current?.close(); }, []);

  // Auto-join from ?room=CODE in URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('room');
    if (code) {
      setJoinInput(code.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Connect to a PartyKit room ──────────────────────────────────────────────
  const connect = useCallback((code: string) => {
    socketRef.current?.close();
    setConnecting(true);
    setConnected(false);
    setError('');
    setServerState(null);

    const socket = new PartySocket({
      host:  PARTYKIT_HOST,
      room:  code,
      party: 'main',
    });
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnecting(false);
      setConnected(true);
      socket.send(JSON.stringify({ type: 'join' }));
    });

    socket.addEventListener('message', (evt) => {
      let msg: ServerMsg;
      try { msg = JSON.parse(evt.data); } catch { return; }

      if (msg.type === 'role') {
        const role = msg.role;
        setMyRole(role);
        myRoleRef.current = role;
        if (role === 'X') setScreen('waiting');
        else if (role === 'O') setScreen('game');
        if (role && soundEnabled) sounds.join();
      }

      if (msg.type === 'state') {
        const prev = serverState;
        setServerState(msg.state);

        // Sound cues on state change
        if (msg.state.winner && !prev?.winner && soundEnabled) sounds.win();
        if (msg.state.isDraw && !prev?.isDraw && soundEnabled) sounds.draw();

        // Transition waiting → game when opponent joins
        const role = myRoleRef.current;
        if (role === 'X' && msg.state.playerO) setScreen('game');

        // Score tracking
        const role2 = myRoleRef.current;
        if (role2) {
          if (msg.state.winner && !prev?.winner) {
            saveScore('online', msg.state.winner === role2 ? 'win' : 'loss');
          } else if (msg.state.isDraw && !prev?.isDraw) {
            saveScore('online', 'draw');
          }
        }
      }
    });

    socket.addEventListener('close', () => {
      setConnected(false);
    });

    socket.addEventListener('error', () => {
      setConnecting(false);
      setConnected(false);
      setError('Connection failed. Check your PartyKit host in .env or README.');
    });
  }, [soundEnabled]);

  // ── Create room ─────────────────────────────────────────────────────────────
  const createRoom = useCallback(() => {
    const code = genCode();
    setRoomId(code);
    connect(code);
  }, [connect]);

  // ── Join room ───────────────────────────────────────────────────────────────
  const joinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase().slice(0, 6);
    if (code.length < 4) { setError('Enter a valid room code.'); return; }
    setRoomId(code);
    connect(code);
  }, [joinInput, connect]);

  // ── Send a move ─────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((i: number) => {
    if (!myRoleRef.current || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type:   'move',
      index:  i,
      player: myRoleRef.current,
    }));
    if (soundEnabled) sounds.click();
  }, [soundEnabled]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    socketRef.current?.send(JSON.stringify({ type: 'reset' }));
  }, []);

  // ── Chat ────────────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    if (!chatMsg.trim() || !myRoleRef.current) return;
    socketRef.current?.send(JSON.stringify({
      type:   'chat',
      text:   chatMsg.trim(),
      player: myRoleRef.current,
    }));
    setChatMsg('');
  }, [chatMsg]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leave = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setScreen('lobby'); setMyRole(null); setRoomId('');
    setServerState(null); setConnected(false); setError('');
  }, []);

  // ── Copy invite link ────────────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [roomId]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const mapEmoji     = (v: string) => v === 'X' ? emojiX : v === 'O' ? emojiO : v;
  const displayBoard = serverState ? serverState.board.map(mapEmoji) : EMPTY_BOARD;
  const myTurn       = serverState?.turn === myRole;
  const winner       = serverState?.winner ?? null;
  const gameDraw     = serverState?.isDraw ?? false;
  const opponentJoined = myRole === 'X' ? !!serverState?.playerO : !!serverState?.playerX;
  const opponentLeft   = screen === 'game' && !opponentJoined && !winner && !gameDraw;

  // ════════════════════════════════════════════════════════════════════════════
  // DEMO BANNER (shown when PartyKit host not configured)
  // ════════════════════════════════════════════════════════════════════════════
  const DemoBanner = () => (
    <div style={{
      background: `${theme.accent}15`,
      border: `1px solid ${theme.accent}44`,
      borderRadius: '14px', padding: '14px 16px',
      fontSize: '0.82rem', lineHeight: 1.7, color: theme.textMuted,
    }}>
      <div style={{ fontWeight: 700, color: theme.text, marginBottom: '8px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={15} style={{ color: theme.accent }} /> PartyKit Setup (3 min, free)
      </div>
      <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <li>Run: <code style={{ background: theme.cellBg, padding: '1px 6px', borderRadius: '4px' }}>npx partykit deploy</code> in project root</li>
        <li>Sign in with GitHub when prompted</li>
        <li>Copy your deployed host URL (e.g. <code style={{ background: theme.cellBg, padding: '1px 6px', borderRadius: '4px' }}>tictactoe-pro.yourname.partykit.dev</code>)</li>
        <li>Add to Vercel env vars:<br />
          <code style={{ background: theme.cellBg, padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
            VITE_PARTYKIT_HOST=tictactoe-pro.yourname.partykit.dev
          </code>
        </li>
        <li>Redeploy on Vercel — online play works! 🎉</li>
      </ol>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'lobby') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {IS_DEMO && <DemoBanner />}

        {error && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef4444',
            borderRadius: '12px', padding: '10px 14px',
            color: '#ef4444', fontSize: '0.85rem',
          }}>{error}</div>
        )}

        <button onClick={createRoom} disabled={connecting}
          style={{
            background: theme.accent, border: 'none', borderRadius: '14px',
            padding: '14px', color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: connecting ? 'not-allowed' : 'pointer',
            opacity: connecting ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'opacity 0.2s',
          }}
        >
          {connecting
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
            : <><Users size={18} /> Create Room (Host)</>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
          <span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>join existing</span>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={joinInput}
            onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="6-char room code…"
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            style={{
              flex: 1, background: theme.cellBg, border: `2px solid ${theme.border}`,
              borderRadius: '12px', padding: '12px 14px', color: theme.text,
              fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.15em',
              outline: 'none', textTransform: 'uppercase',
            }}
          />
          <button onClick={joinRoom} disabled={connecting}
            style={{
              background: theme.cellBg, border: `2px solid ${theme.accent}`,
              borderRadius: '12px', padding: '12px 16px',
              color: theme.accent, fontWeight: 700,
              cursor: connecting ? 'not-allowed' : 'pointer',
            }}
          >
            Join
          </button>
        </div>
      </motion.div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WAITING (host before opponent joins)
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'waiting') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '20px', padding: '24px 20px',
          backdropFilter: 'blur(12px)', textAlign: 'center',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{ fontSize: '2.2rem', marginBottom: '12px', display: 'inline-block' }}
          >⏳</motion.div>

          <div style={{ color: theme.text, fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>
            Waiting for opponent…
          </div>
          <div style={{ color: theme.textMuted, fontSize: '0.82rem', marginBottom: '20px' }}>
            Share the room code or invite link below
          </div>

          {/* Big room code */}
          <div style={{
            fontFamily: 'monospace', fontSize: '2.2rem', fontWeight: 900,
            letterSpacing: '0.35em', color: theme.accent,
            background: theme.cellBg, borderRadius: '16px',
            padding: '16px 20px', marginBottom: '14px',
            border: `2px solid ${theme.accent}55`,
            textShadow: `0 0 24px ${theme.accent}66`,
          }}>
            {roomId}
          </div>

          {/* Copy invite link */}
          <button onClick={copyLink} style={{
            background: copied ? '#22c55e22' : `${theme.accent}22`,
            border: `2px solid ${copied ? '#22c55e' : theme.accent}`,
            borderRadius: '12px', padding: '11px 18px',
            cursor: 'pointer', color: copied ? '#22c55e' : theme.accent,
            fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', width: '100%', transition: 'all 0.2s',
          }}>
            {copied ? <Check size={16} /> : <Link size={16} />}
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>

          {/* Connection status */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connected ? '#22c55e' : '#f59e0b',
              boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
            }} />
            <span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>
              {connected ? 'Connected to server' : 'Connecting…'}
            </span>
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
          <div style={{ color: theme.textMuted, fontSize: '1rem', fontWeight: 700 }}>vs</div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Opponent</div>
            <div style={{ color: theme.textMuted, fontSize: '1.3rem', fontWeight: 800 }}>
              {myRole === 'X' ? emojiO : emojiX} {myRole === 'X' ? 'O' : 'X'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Connection dot */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected ? '#22c55e' : '#ef4444',
            boxShadow: `0 0 6px ${connected ? '#22c55e' : '#ef4444'}`,
          }} title={connected ? 'Connected' : 'Disconnected'} />
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
          }}>
            <LogOut size={16} />
          </button>
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

      {/* Result banner */}
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
          <div style={{
            color: winner === myRole ? '#22c55e' : gameDraw ? '#f59e0b' : '#ef4444',
            fontWeight: 800, fontSize: '1.15rem',
          }}>
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
        Chat {serverState?.chat?.length ? `(${serverState.chat.length})` : ''}
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
                {!serverState?.chat?.length && (
                  <div style={{ color: theme.textMuted, fontSize: '0.8rem', textAlign: 'center', marginTop: '50px' }}>
                    No messages yet
                  </div>
                )}
                {serverState?.chat?.map((msg, i) => (
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
              <div style={{
                borderTop: `1px solid ${theme.border}`, padding: '10px',
                display: 'flex', gap: '8px',
              }}>
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
                }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
