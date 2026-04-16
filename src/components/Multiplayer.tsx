import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Users, MessageCircle, Send,
  WifiOff, RefreshCw, Link, Loader2, LogOut,
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface RoomRow {
  id: string; board: string[]; turn: string;
  player_x: string | null; player_o: string | null;
  winner: string | null; is_draw: boolean;
  chat: { text: string; player: string; ts: number }[];
  updated_at: string;
}
import { ThemeConfig } from '../lib/themes';
import { checkWinner, isDraw } from '../lib/AI';
import GameBoard from './GameBoard';
import { sounds } from '../lib/sounds';
import { saveScore } from '../lib/storage';

interface ChatMsg { text: string; player: string; ts: number; }

interface MultiplayerProps {
  theme: ThemeConfig;
  emojiX: string;
  emojiO: string;
  soundEnabled: boolean;
}

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const EMPTY_BOARD = Array(9).fill('');

export default function Multiplayer({ theme, emojiX, emojiO, soundEnabled }: MultiplayerProps) {
  const [screen, setScreen]           = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [myRole, setMyRole]           = useState<'X' | 'O' | null>(null);
  const [roomId, setRoomId]           = useState('');
  const [joinInput, setJoinInput]     = useState('');
  const [room, setRoom]               = useState<RoomRow | null>(null);
  const [chatMsg, setChatMsg]         = useState('');
  const [showChat, setShowChat]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [opponentLeft, setOpponentLeft] = useState(false);

  const channelRef  = useRef<RealtimeChannel | null>(null);
  const myIdRef     = useRef(Math.random().toString(36).slice(2, 10));
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const roomRef     = useRef<RoomRow | null>(null);
  roomRef.current   = room;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [room?.chat]);
  useEffect(() => () => { detach(); }, []);

  // Auto-join from ?room=CODE
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('room');
    if (code) { setJoinInput(code.toUpperCase()); window.history.replaceState({}, '', window.location.pathname); }
  }, []);

  function subscribe(code: string, role: 'X' | 'O') {
    detach();
    const ch = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${code}` }, (payload) => {
        const data = payload.new as RoomRow;
        setRoom(data);
        const opField = role === 'X' ? 'player_o' : 'player_x';
        setOpponentLeft(!data[opField] && !data.winner && !data.is_draw);
      })
      .subscribe();
    channelRef.current = ch;
  }

  function detach() {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }

  const createRoom = async () => {
    setLoading(true); setError('');
    try {
      const code = genCode();
      const { error: err } = await supabase.from('rooms').insert({
        id: code, board: EMPTY_BOARD, turn: 'X',
        player_x: myIdRef.current, player_o: null,
        winner: null, is_draw: false, chat: [],
      });
      if (err) throw err;
      const { data } = await supabase.from('rooms').select('*').eq('id', code).single();
      setRoomId(code); setMyRole('X'); setRoom(data as RoomRow);
      setScreen('waiting'); subscribe(code, 'X');
    } catch (e: any) { setError(e?.message || 'Failed to create room.'); }
    setLoading(false);
  };

  const joinRoom = async () => {
    const code = joinInput.trim().toUpperCase().slice(0, 6);
    if (code.length < 4) { setError('Enter a valid 6-character room code.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase.from('rooms').select('*').eq('id', code).single();
      if (err || !data) { setError('Room not found.'); setLoading(false); return; }
      const row = data as RoomRow;
      if (row.player_o) { setError('Room is full.'); setLoading(false); return; }
      await supabase.from('rooms').update({ player_o: myIdRef.current }).eq('id', code);
      setRoomId(code); setMyRole('O');
      setRoom({ ...row, player_o: myIdRef.current });
      setScreen('game'); subscribe(code, 'O');
      if (soundEnabled) sounds.join();
    } catch (e: any) { setError(e?.message || 'Failed to join room.'); }
    setLoading(false);
  };

  const handleCellClick = async (i: number) => {
    const r = roomRef.current;
    if (!r || !myRole) return;
    if (r.turn !== myRole || r.board[i] !== '' || r.winner || r.is_draw) return;
    const newBoard = [...r.board]; newBoard[i] = myRole;
    if (soundEnabled) sounds.click();
    const w = checkWinner(newBoard);
    const d = !w && isDraw(newBoard);
    if (w) { if (soundEnabled) sounds.win(); saveScore('online', w === myRole ? 'win' : 'loss'); }
    if (d) { if (soundEnabled) sounds.draw(); saveScore('online', 'draw'); }
    await supabase.from('rooms').update({ board: newBoard, turn: myRole === 'X' ? 'O' : 'X', winner: w ?? null, is_draw: d }).eq('id', roomId);
  };

  const resetRoom = async () => {
    await supabase.from('rooms').update({ board: EMPTY_BOARD, turn: 'X', winner: null, is_draw: false }).eq('id', roomId);
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !myRole || !room) return;
    const msg: ChatMsg = { text: chatMsg.trim(), player: myRole, ts: Date.now() };
    setChatMsg('');
    const newChat = [...(room.chat || []).slice(-49), msg];
    await supabase.from('rooms').update({ chat: newChat }).eq('id', roomId);
  };

  const leave = async () => {
    if (myRole && roomId) {
      const field = myRole === 'X' ? 'player_x' : 'player_o';
      await supabase.from('rooms').update({ [field]: null }).eq('id', roomId);
    }
    detach();
    setScreen('lobby'); setMyRole(null); setRoomId('');
    setRoom(null); setOpponentLeft(false); setError('');
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const mapEmoji    = (v: string) => v === 'X' ? emojiX : v === 'O' ? emojiO : v;
  const displayBoard = room ? room.board.map(mapEmoji) : EMPTY_BOARD;
  const myTurn       = room?.turn === myRole;
  const winner       = room?.winner ?? null;
  const gameDraw     = room?.is_draw ?? false;
  const opponentJoined = myRole === 'X' ? !!room?.player_o : !!room?.player_x;

  useEffect(() => {
    if (screen === 'waiting' && opponentJoined) setScreen('game');
  }, [screen, opponentJoined]);

  const t = theme;

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      <div style={{ background: `${t.accent}15`, border: `1px solid ${t.accent}44`, borderRadius: '14px', padding: '12px 16px', fontSize: '0.82rem', color: t.textMuted, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem' }}>🦊</span>
        <span>Create a room, share the code with a friend, and play in real time!</span>
      </div>
      {error && <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: '12px', padding: '10px 14px', color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
      <button onClick={createRoom} disabled={loading}
        style={{ background: t.accent, border: 'none', borderRadius: '14px', padding: '14px', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Outfit,sans-serif' }}
      >
        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={18} />}
        {loading ? 'Creating…' : 'Create Room'}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '1px', background: t.border }} />
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>or join existing</span>
        <div style={{ flex: 1, height: '1px', background: t.border }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={joinInput} onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="Room code…" onKeyDown={e => e.key === 'Enter' && joinRoom()}
          style={{ flex: 1, background: t.cellBg, border: `2px solid ${t.border}`, borderRadius: '12px', padding: '12px 14px', color: t.text, fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.2em', outline: 'none', textTransform: 'uppercase' }}
        />
        <button onClick={joinRoom} disabled={loading}
          style={{ background: t.cellBg, border: `2px solid ${t.accent}`, borderRadius: '12px', padding: '12px 18px', color: t.accent, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}
        >Join</button>
      </div>
    </motion.div>
  );

  // ── WAITING ────────────────────────────────────────────────────────────────
  if (screen === 'waiting') return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '20px', padding: '28px 20px', backdropFilter: 'blur(12px)', textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          style={{ fontSize: '2.4rem', marginBottom: '14px', display: 'inline-block' }}>⏳</motion.div>
        <div style={{ color: t.text, fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Waiting for opponent…</div>
        <div style={{ color: t.textMuted, fontSize: '0.82rem', marginBottom: '22px' }}>Share the code or invite link</div>
        <div style={{ fontFamily: 'monospace', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.35em', color: t.accent, background: t.cellBg, borderRadius: '16px', padding: '16px 20px', marginBottom: '14px', border: `2px solid ${t.accent}55`, textShadow: `0 0 24px ${t.accent}66` }}>{roomId}</div>
        <button onClick={copyLink} style={{ background: copied ? '#22c55e22' : `${t.accent}22`, border: `2px solid ${copied ? '#22c55e' : t.accent}`, borderRadius: '12px', padding: '12px 18px', cursor: 'pointer', color: copied ? '#22c55e' : t.accent, fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif' }}>
          {copied ? <Check size={16} /> : <Link size={16} />}
          {copied ? 'Link Copied!' : 'Copy Invite Link'}
        </button>
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ color: t.textMuted, fontSize: '0.78rem' }}>Connected — waiting for player 2</span>
        </div>
      </div>
      <button onClick={leave} style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '10px', color: t.textMuted, cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit,sans-serif' }}>Cancel</button>
    </motion.div>
  );

  // ── GAME ───────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* Header */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ color: t.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>You</div>
            <div style={{ color: t.accent, fontSize: '1.3rem', fontWeight: 800 }}>{myRole === 'X' ? emojiX : emojiO} {myRole}</div>
          </div>
          <div style={{ color: t.textMuted, fontWeight: 700 }}>vs</div>
          <div>
            <div style={{ color: t.textMuted, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Opponent</div>
            <div style={{ color: t.textMuted, fontSize: '1.3rem', fontWeight: 800 }}>{myRole === 'X' ? emojiO : emojiX} {myRole === 'X' ? 'O' : 'X'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <button onClick={copyLink} title="Copy invite link" style={{ background: t.cellBg, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '8px', cursor: 'pointer', color: copied ? '#22c55e' : t.textMuted, display: 'flex', transition: 'all 0.2s' }}>
            {copied ? <Check size={16} /> : <Link size={16} />}
          </button>
          <button onClick={leave} style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.15em', color: t.textMuted, background: t.cellBg, borderRadius: '20px', padding: '4px 14px', border: `1px solid ${t.border}` }}>Room: {roomId}</span>
      </div>

      {opponentLeft && !winner && !gameDraw && (
        <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: '12px', padding: '10px 14px', color: '#f59e0b', fontSize: '0.85rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <WifiOff size={14} /> Opponent disconnected — reset or leave
        </div>
      )}

      {!winner && !gameDraw && !opponentLeft && (
        <motion.div key={String(myTurn)} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', padding: '4px', color: myTurn ? t.accent : t.textMuted }}
        >
          {myTurn ? `Your turn — ${myRole === 'X' ? emojiX : emojiO}` : `Opponent's turn — ${myRole === 'X' ? emojiO : emojiX}`}
        </motion.div>
      )}

      {(winner || gameDraw) && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ background: winner === myRole ? '#22c55e22' : gameDraw ? '#f59e0b22' : '#ef444422', border: `1px solid ${winner === myRole ? '#22c55e' : gameDraw ? '#f59e0b' : '#ef4444'}44`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{winner === myRole ? '🏆' : gameDraw ? '🤝' : '💔'}</div>
          <div style={{ color: winner === myRole ? '#22c55e' : gameDraw ? '#f59e0b' : '#ef4444', fontWeight: 800, fontSize: '1.15rem' }}>
            {winner === myRole ? 'You Win!' : gameDraw ? "It's a Draw!" : 'You Lose!'}
          </div>
          <button onClick={resetRoom} style={{ marginTop: '12px', background: t.accent, border: 'none', borderRadius: '10px', padding: '8px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit,sans-serif' }}>
            <RefreshCw size={14} /> Play Again
          </button>
        </motion.div>
      )}

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '20px', padding: 'clamp(12px,3vw,20px)', backdropFilter: 'blur(16px)', boxShadow: t.shadow }}>
        <GameBoard board={displayBoard} onCellClick={handleCellClick} disabled={!myTurn || !!winner || gameDraw || opponentLeft} theme={t} gameOver={!!winner || gameDraw} />
      </div>

      <button onClick={() => setShowChat(s => !s)} style={{ background: t.cellBg, border: `1px solid ${showChat ? t.accent : t.border}`, borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', color: showChat ? t.accent : t.textMuted, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif' }}>
        <MessageCircle size={16} /> Chat {room?.chat?.length ? `(${room.chat.length})` : ''}
      </button>

      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
              <div style={{ height: '160px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {!room?.chat?.length && <div style={{ color: t.textMuted, fontSize: '0.8rem', textAlign: 'center', marginTop: '50px' }}>No messages yet</div>}
                {room?.chat?.map((msg: any, i: number) => (
                  <div key={i} style={{ alignSelf: msg.player === myRole ? 'flex-end' : 'flex-start', background: msg.player === myRole ? t.accent : t.cellBg, color: msg.player === myRole ? '#fff' : t.text, borderRadius: '10px', padding: '6px 10px', fontSize: '0.82rem', maxWidth: '80%' }}>
                    <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>{msg.player === myRole ? 'You' : 'Opp'}: </span>{msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ borderTop: `1px solid ${t.border}`, padding: '10px', display: 'flex', gap: '8px' }}>
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Type a message…" maxLength={100}
                  style={{ flex: 1, background: t.cellBg, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '8px 10px', color: t.text, fontSize: '0.85rem', outline: 'none' }} />
                <button onClick={sendChat} style={{ background: t.accent, border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex' }}><Send size={14} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
