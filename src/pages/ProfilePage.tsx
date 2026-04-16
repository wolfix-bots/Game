import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Gamepad2, Star, Zap, LogOut } from 'lucide-react';
import { useApp } from '../App';
import { xpForNextLevel, xpProgress, xpToLevel, getGameLeaderboard } from '../lib/profile';
import { isSupabaseConfigured } from '../lib/supabase';
import { getAchievements } from '../lib/achievements';
import { GAMES } from '../lib/arcade';
import { AVATARS, updateAvatar } from '../lib/auth';

export default function ProfilePage() {
  const { user, profile, refreshProfile, handleLogout, updateUser } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState<'stats' | 'games' | 'achievements'>('stats');
  const achievements = getAchievements();
  const unlocked = achievements.filter(a => profile.achievements.includes(a.id));
  const level = xpToLevel(profile.xp);
  const progress = xpProgress(profile.xp);
  const nextXP = xpForNextLevel(level);
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  const handleAvatar = (a: string) => {
    updateAvatar(user.id, a);
    updateUser({ ...user, avatar: a });
    refreshProfile();
  };

  const t = { text: '#e2e8f0', textMuted: '#64748b', accent: '#818cf8', border: 'rgba(148,163,184,0.1)', surface: 'rgba(30,41,59,0.8)', cellBg: 'rgba(15,23,42,0.6)' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.1)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => nav('/')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>My Profile</h1>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
            background: isSupabaseConfigured ? '#22c55e22' : '#f59e0b22',
            color: isSupabaseConfigured ? '#22c55e' : '#f59e0b',
            border: `1px solid ${isSupabaseConfigured ? '#22c55e44' : '#f59e0b44'}`,
          }}>
            {isSupabaseConfigured ? '☁️ Cloud' : '💾 Local'}
          </span>
        </div>
        <button onClick={handleLogout} style={{ background: '#ef444418', border: '1px solid #ef444430', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
          <LogOut size={16} />
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '24px', padding: '24px', marginBottom: '20px', backdropFilter: 'blur(12px)' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
            {/* Avatar */}
            <div style={{ fontSize: '3.5rem', flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 900, fontSize: '1.4rem' }}>{user.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ background: '#818cf833', color: '#818cf8', borderRadius: '20px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>⭐ Level {level}</span>
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{profile.xp.toLocaleString()} XP</span>
              </div>
              {/* XP bar */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Level {level}</span>
                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Level {level + 1} · {nextXP.toLocaleString()} XP</span>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#818cf8,#a78bfa)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ color: '#818cf8', fontSize: '0.72rem', marginTop: '4px', textAlign: 'right' }}>{progress}% to next level</div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: 'Games', value: profile.gamesPlayed, emoji: '🎮' },
              { label: 'Wins', value: profile.gamesWon, emoji: '🏆' },
              { label: 'Win Rate', value: `${winRate}%`, emoji: '📊' },
              { label: 'Achievements', value: `${unlocked.length}/${achievements.length}`, emoji: '🎖️' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '14px', padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{s.emoji}</div>
                <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem' }}>{s.value}</div>
                <div style={{ color: '#475569', fontSize: '0.62rem', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Avatar picker */}
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Change Avatar</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: '5px' }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => handleAvatar(a)}
                  style={{ background: user.avatar === a ? '#818cf833' : 'rgba(15,23,42,0.6)', border: `2px solid ${user.avatar === a ? '#818cf8' : 'transparent'}`, borderRadius: '8px', padding: '4px', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, transition: 'all 0.15s' }}
                >{a}</button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '14px', padding: '5px' }}>
          {([['stats','📊 Stats'],['games','🎮 Games'],['achievements','🏅 Awards']] as const).map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? '#818cf8' : 'transparent', border: 'none', borderRadius: '10px', padding: '9px', cursor: 'pointer', color: tab === id ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s' }}
            >{label}</button>
          ))}
        </div>

        {/* Stats tab */}
        {tab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(148,163,184,0.08)' }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>XP Breakdown</div>
              {[
                { label: 'From wins', value: profile.gamesWon * 50, color: '#22c55e' },
                { label: 'From playing', value: profile.gamesPlayed * 2, color: '#818cf8' },
                { label: 'From achievements', value: unlocked.length * 100, color: '#fbbf24' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 700, fontSize: '0.9rem' }}>+{row.value.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(148,163,184,0.08)' }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Member Since</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{new Date(profile.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </motion.div>
        )}

        {/* Games tab */}
        {tab === 'games' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(profile.gameStats).length === 0 && (
              <div style={{ textAlign: 'center', color: '#475569', padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎮</div>
                <div style={{ fontWeight: 700 }}>No games played yet!</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Play any game to see stats here</div>
              </div>
            )}
            {Object.entries(profile.gameStats).map(([gameId, gs]) => {
              const game = GAMES.find(g => g.id === gameId);
              const wr = gs.played > 0 ? Math.round((gs.won / gs.played) * 100) : 0;
              return (
                <div key={gameId} style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{game?.emoji || '🎮'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>{game?.title || gameId}</div>
                    <div style={{ color: '#475569', fontSize: '0.75rem' }}>{gs.played} played · {gs.won} won · {wr}% win rate</div>
                  </div>
                  {gs.bestScore > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.9rem' }}>{gs.bestScore.toLocaleString()}</div>
                      <div style={{ color: '#475569', fontSize: '0.65rem' }}>best</div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Achievements tab */}
        {tab === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {achievements.map((a, i) => {
              const isUnlocked = profile.achievements.includes(a.id);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  style={{ background: isUnlocked ? 'rgba(129,140,248,0.1)' : 'rgba(15,23,42,0.6)', border: `1px solid ${isUnlocked ? '#818cf844' : 'rgba(148,163,184,0.08)'}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', opacity: isUnlocked ? 1 : 0.4 }}
                >
                  <span style={{ fontSize: '1.6rem', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>{isUnlocked ? a.emoji : '🔒'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: isUnlocked ? '#e2e8f0' : '#64748b', fontWeight: 700, fontSize: '0.88rem' }}>{a.title}</div>
                    <div style={{ color: '#475569', fontSize: '0.74rem' }}>{a.desc}</div>
                  </div>
                  {isUnlocked && <span style={{ color: '#22c55e', fontSize: '1rem' }}>✓</span>}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
