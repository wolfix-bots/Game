import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Lock, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { register, login, signInWithOAuth, handleOAuthCallback, AVATARS, OAuthProvider } from '../lib/auth';
import type { User } from '../lib/auth';
import { ThemeConfig } from '../lib/themes';

interface Props {
  theme: ThemeConfig;
  onAuth: (user: User) => void;
}

// ── OAuth provider config ─────────────────────────────────────────────────────
const OAUTH_PROVIDERS: { id: OAuthProvider; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Google',
    color: '#fff',
    bg: '#4285F4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'GitHub',
    color: '#fff',
    bg: '#24292e',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: 'discord',
    label: 'Discord',
    color: '#fff',
    bg: '#5865F2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    color: '#fff',
    bg: '#000000',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function AuthScreen({ theme: t, onAuth }: Props) {
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar]     = useState('🦊');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // ── Handle OAuth redirect callback on page load ───────────────────────────
  useEffect(() => {
    handleOAuthCallback().then(user => {
      if (user) onAuth(user);
    });
  }, []);

  // ── Email/password submit ─────────────────────────────────────────────────
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

  // ── OAuth click ───────────────────────────────────────────────────────────
  const handleOAuth = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError('');
    const result = await signInWithOAuth(provider);
    if (result?.error) {
      setError(result.error);
      setOauthLoading(null);
    }
    // On success the page redirects — no need to clear loading
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
            background: `${t.accent}${['10', '08', '06'][i]}`,
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
        {/* ── OAuth Buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ color: t.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: '2px' }}>
            Sign in instantly with
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {OAUTH_PROVIDERS.map(p => (
              <motion.button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                disabled={!!oauthLoading}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: oauthLoading === p.id ? p.bg + 'cc' : p.bg,
                  border: 'none', borderRadius: '12px',
                  padding: '10px 12px',
                  cursor: oauthLoading ? 'not-allowed' : 'pointer',
                  color: p.color, fontWeight: 700, fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: "'Outfit', sans-serif",
                  opacity: oauthLoading && oauthLoading !== p.id ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  boxShadow: `0 2px 8px ${p.bg}44`,
                }}
              >
                {oauthLoading === p.id
                  ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : p.icon
                }
                {p.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: t.border }} />
          <span style={{ color: t.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>or use email</span>
          <div style={{ flex: 1, height: '1px', background: t.border }} />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: t.cellBg, borderRadius: '14px',
          padding: '4px', gap: '4px', marginBottom: '20px',
        }}>
          {(['login', 'register'] as const).map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setError(''); }}
              style={{
                background: tab === tb ? t.accent : 'transparent',
                border: 'none', borderRadius: '10px', padding: '9px',
                cursor: 'pointer', color: tab === tb ? '#fff' : t.textMuted,
                fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
                fontFamily: "'Outfit', sans-serif",
              }}
            >{tb === 'login' ? '🔑 Sign In' : '✨ Sign Up'}</button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar picker (register only) */}
          <AnimatePresence>
            {tab === 'register' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <label style={{ color: t.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  Pick Your Avatar
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                  {AVATARS.map(a => (
                    <button key={a} type="button" onClick={() => setAvatar(a)}
                      style={{
                        background: avatar === a ? `${t.accent}33` : t.cellBg,
                        border: `2px solid ${avatar === a ? t.accent : 'transparent'}`,
                        borderRadius: '8px', padding: '3px',
                        cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
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
            <label style={{ color: t.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Username</label>
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
            <label style={{ color: t.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Password</label>
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

      {/* Setup note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ color: t.textMuted, fontSize: '0.7rem', marginTop: '16px', textAlign: 'center', maxWidth: '340px', position: 'relative', zIndex: 1, lineHeight: 1.6 }}
      >
        🔐 OAuth requires enabling providers in your Supabase dashboard.<br />
        See <strong style={{ color: t.accent }}>README.md</strong> for setup instructions.
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
