import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Lock, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { register, login, AVATARS } from '../lib/auth';
import type { User } from '../lib/auth';
import { ThemeConfig } from '../lib/themes';

interface Props {
  theme: ThemeConfig;
  onAuth: (user: User) => void;
}

export default function AuthScreen({ theme: t, onAuth }: Props) {
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar]     = useState('🦊');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = tab === 'register'
      ? await register(username, password, avatar)
      : await login(username, password);
    setLoading(false);
    if ('error' in result) { setError(result.error); return; }
    onAuth(result.user);
  };

  return (
    <div style={{
      minHeight: '100vh', background: t.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Outfit', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated bg blobs */}
      {[...Array(3)].map((_, i) => (
        <motion.div key={i}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ repeat: Infinity, duration: 8 + i * 3, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: `${200 + i * 80}px`, height: `${200 + i * 80}px`,
            borderRadius: '50%',
            background: `${t.accent}${['10','08','06'][i]}`,
            top: `${[10, 50, 70][i]}%`, left: `${[10, 60, 30][i]}%`,
            filter: 'blur(60px)', pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ fontSize: '4rem', marginBottom: '8px', display: 'block' }}
        >🦊</motion.div>
        <h1 style={{ color: t.text, fontWeight: 900, fontSize: '2.2rem', margin: 0, letterSpacing: '-0.03em' }}>
          Foxy<span style={{ color: t.accent }}>Arcade</span>
        </h1>
        <p style={{ color: t.textMuted, fontSize: '0.88rem', margin: '6px 0 0' }}>
          24 games · AI opponents · Online multiplayer · Leaderboards
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: '24px', padding: '28px',
          width: '100%', maxWidth: '400px',
          backdropFilter: 'blur(20px)', boxShadow: t.shadow,
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: t.cellBg, borderRadius: '14px',
          padding: '4px', gap: '4px', marginBottom: '22px',
        }}>
          {(['login', 'register'] as const).map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); }}
              style={{
                background: tab === tb ? t.accent : 'transparent',
                border: 'none', borderRadius: '10px', padding: '10px',
                cursor: 'pointer', color: tab === tb ? '#fff' : t.textMuted,
                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif",
              }}
            >{tb === 'login' ? '🔑 Sign In' : '✨ Sign Up'}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar picker (register only) */}
          <AnimatePresence>
            {tab === 'register' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <label style={{ color: t.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  Pick Your Avatar
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '5px' }}>
                  {AVATARS.map(a => (
                    <button key={a} type="button" onClick={() => setAvatar(a)}
                      style={{
                        background: avatar === a ? `${t.accent}33` : t.cellBg,
                        border: `2px solid ${avatar === a ? t.accent : 'transparent'}`,
                        borderRadius: '10px', padding: '4px',
                        cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
                        transition: 'all 0.15s',
                      }}
                    >{a}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Username */}
          <div>
            <label style={{ color: t.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_username" autoComplete="username" required
                style={{
                  width: '100%', background: t.cellBg, border: `2px solid ${t.border}`,
                  borderRadius: '12px', padding: '11px 12px 11px 36px',
                  color: t.text, fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = t.accent)}
                onBlur={e => (e.target.style.borderColor = t.border)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ color: t.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
                style={{
                  width: '100%', background: t.cellBg, border: `2px solid ${t.border}`,
                  borderRadius: '12px', padding: '11px 40px 11px 36px',
                  color: t.text, fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = t.accent)}
                onBlur={e => (e.target.style.borderColor = t.border)}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex' }}
              >{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: '#ef444420', border: '1px solid #ef444455', borderRadius: '10px', padding: '10px 12px', color: '#ef4444', fontSize: '0.83rem', fontWeight: 500 }}
              >{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              background: t.accent, border: 'none', borderRadius: '14px',
              padding: '13px', color: '#fff', fontWeight: 800,
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: `0 4px 20px ${t.accent}44`,
            }}
          >
            {loading
              ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {tab === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : tab === 'login' ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Create Account</>
            }
          </motion.button>
        </form>
      </motion.div>

      <p style={{ color: t.textMuted, fontSize: '0.72rem', marginTop: '16px', textAlign: 'center', maxWidth: '300px', position: 'relative', zIndex: 1 }}>
        Your account is stored securely in the cloud. Passwords are SHA-256 hashed.
      </p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
