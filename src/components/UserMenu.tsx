import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { AVATARS, updateAvatar } from '../lib/auth';
import type { User as UserType } from '../lib/auth';

interface Props {
  user: UserType;
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(s => !s)}
        style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '12px', padding: '6px 10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s',
          boxShadow: t.shadow,
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>{user.avatar}</span>
        <span style={{ color: t.text, fontWeight: 700, fontSize: '0.82rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.username}
        </span>
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
              borderRadius: '18px', padding: '16px',
              width: '220px', zIndex: 200,
              backdropFilter: 'blur(20px)', boxShadow: t.shadow,
            }}
          >
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: '2rem' }}>{user.avatar}</span>
              <div>
                <div style={{ color: t.text, fontWeight: 800, fontSize: '0.95rem' }}>{user.username}</div>
                <div style={{ color: t.textMuted, fontSize: '0.72rem' }}>Member since {new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
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
                      cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
                      transition: 'all 0.15s',
                    }}
                  >{a}</button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              style={{
                width: '100%', background: '#ef444418',
                border: '1px solid #ef444433', borderRadius: '10px',
                padding: '9px', cursor: 'pointer', color: '#ef4444',
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
