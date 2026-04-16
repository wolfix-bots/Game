import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, RefreshCw } from 'lucide-react';
import { useApp } from '../App';
import { fetchGlobalLeaderboard, getLocalLB, LeaderboardEntry, xpToLevel } from '../lib/profile';
import { isSupabaseConfigured } from '../lib/supabase';
import { GAMES } from '../lib/arcade';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function GlobalLeaderboardPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<'xp' | 'wins'>('xp');

  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const data = await fetchGlobalLeaderboard();
    setEntries(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sorted = [...entries].sort((a, b) => tab === 'xp' ? b.xp - a.xp : b.gamesWon - a.gamesWon);
  const myRank = sorted.findIndex(e => e.userId === user.id) + 1;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.1)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => nav('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} style={{ color: '#fbbf24' }} />
          <h1 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Global Leaderboard</h1>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Your rank */}
        {myRank > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '16px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <span style={{ fontSize: '1.8rem' }}>{user.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#818cf8', fontWeight: 800 }}>Your Rank: #{myRank}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{entries.find(e => e.userId === user.id)?.xp.toLocaleString() || 0} XP · Level {xpToLevel(entries.find(e => e.userId === user.id)?.xp || 0)}</div>
            </div>
            <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.4rem' }}>#{myRank}</div>
          </motion.div>
        )}

        {/* Sort tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', padding: '4px' }}>
          {([['xp','⭐ By XP'],['wins','🏆 By Wins']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? '#818cf8' : 'transparent', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: tab === id ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s' }}
            >{label}</button>
          ))}
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No players yet!</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Play games to appear on the leaderboard</div>
          </div>
        )}

        {/* Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map((entry, i) => {
            const isMe = entry.userId === user.id;
            const level = xpToLevel(entry.xp);
            return (
              <motion.div key={entry.userId}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                style={{
                  background: isMe ? 'rgba(129,140,248,0.12)' : 'rgba(30,41,59,0.8)',
                  border: `1px solid ${isMe ? 'rgba(129,140,248,0.3)' : 'rgba(148,163,184,0.08)'}`,
                  borderRadius: '14px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                {/* Rank */}
                <div style={{ width: '32px', textAlign: 'center', fontWeight: 900, fontSize: i < 3 ? '1.4rem' : '1rem', color: i < 3 ? '#fbbf24' : '#475569', flexShrink: 0 }}>
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </div>
                {/* Avatar */}
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{entry.avatar}</span>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: isMe ? '#818cf8' : '#e2e8f0', fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username} {isMe ? '(You)' : ''}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.72rem' }}>Level {level} · {entry.gamesPlayed} games played</div>
                </div>
                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: tab === 'xp' ? '#818cf8' : '#22c55e', fontWeight: 800, fontSize: '1rem' }}>
                    {tab === 'xp' ? `${entry.xp.toLocaleString()} XP` : `${entry.gamesWon} W`}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.65rem' }}>{tab === 'xp' ? `Lv.${level}` : `${entry.gamesPlayed} played`}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#334155', fontSize: '0.75rem' }}>
          Leaderboard updates as players earn XP on this device network
        </div>
      </div>
    </div>
  );
}
