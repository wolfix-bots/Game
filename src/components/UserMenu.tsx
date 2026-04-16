import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown, Star, Zap } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { AVATARS, updateAvatar } from '../lib/auth';
import type { User } from '../lib/auth';
import { levelFromXP } from '../lib/auth';

function xpProgressInLevel(xp: number): { current: number; needed: number } {
  const level = levelFromXP(xp);
  const xpForLevel = (l: number) => l * l * 50;
  const current = xp - xpForLevel(level - 1);
  const needed  = xpForLevel(level) - xpForLevel(level - 1);
  return { current: Math.max(0, current), needed: Math.max(1, needed) };
}

interface Props {
  user: User;
  theme: ThemeConfig;
  onLogout: () => void;
  onAvatarChange: (avatar: string) => void;
}

export default function UserMenu({ user, theme: t, onLogout, onAvatarChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAvatar = (a: string) => {
    updateAvatar(user.id, a);
    onAvatarChange(a);
    setOpen(false);
  };

  const xpInfo = xpProgressInLevel(user.xp || 0);
  const pct = Math.round((xpInfo.current / xpInfo.needed) * 100);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(s => !s)}
        style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '12px', padding: '6px 10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s',
          boxShadow: t.shadow,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{user.avatar}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: t.text, fontWeight: 700, fontSize: '0.82rem', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username}
          </div>
          <div style={{ color: t.accent, fontSize: '0.68rem', fontWeight: 700 }}>
            Lv.{user.level || 1} · {user.xp || 0} XP
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: t.textMuted }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: '20px', padding: '18px',
              width: '240px', zIndex: 200,
              backdropFilter: 'blur(20px)', boxShadow: t.shadow,
            }}
          >
            {/* Profile header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: '2.4rem' }}>{user.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.text, fontWeight: 800, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                <div style={{ color: t.textMuted, fontSize: '0.72rem' }}>Level {user.level || 1} · {user.gamesWon || 0} wins</div>
              </div>
            </div>

            {/* XP bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: t.textMuted, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={11} style={{ color: t.accent }} /> XP Progress
                </span>
                <span style={{ color: t.accent, fontSize: '0.7rem', fontWeight: 700 }}>{xpInfo.current}/{xpInfo.needed}</span>
              </div>
              <div style={{ background: t.cellBg, borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${t.accent}, ${t.accent}cc)`, borderRadius: '8px', boxShadow: `0 0 8px ${t.accent}66` }}
                />
              </div>
              <div style={{ color: t.textMuted, fontSize: '0.65rem', marginTop: '3px', textAlign: 'right' }}>
                {xpInfo.needed - xpInfo.current} XP to Level {(user.level || 1) + 1}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
              {[
                { label: 'Games', value: user.gamesPlayed || 0, emoji: '🎮' },
                { label: 'Wins', value: user.gamesWon || 0, emoji: '🏆' },
              ].map(s => (
                <div key={s.label} style={{ background: t.cellBg, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem' }}>{s.emoji}</div>
                  <div style={{ color: t.text, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: t.textMuted, fontSize: '0.65rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Avatar picker */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ color: t.textMuted, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Change Avatar</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => handleAvatar(a)}
                    style={{
                      background: user.avatar === a ? `${t.accent}33` : t.cellBg,
                      border: `2px solid ${user.avatar === a ? t.accent : 'transparent'}`,
                      borderRadius: '8px', padding: '4px',
                      cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, transition: 'all 0.15s',
                    }}
                  >{a}</button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              style={{
                width: '100%', background: '#ef444418', border: '1px solid #ef444433',
                borderRadius: '10px', padding: '9px', cursor: 'pointer', color: '#ef4444',
                fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ef444430')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ef444418')}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
