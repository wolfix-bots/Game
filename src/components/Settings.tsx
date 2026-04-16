import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, Volume2, VolumeX } from 'lucide-react';
import { Theme, ThemeConfig, THEMES, EMOJI_SETS } from '../lib/themes';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  themeConfig: ThemeConfig;
  onThemeChange: (t: Theme) => void;
  emojiSet: number;
  onEmojiChange: (i: number) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export default function Settings({
  open, onClose, theme, themeConfig, onThemeChange,
  emojiSet, onEmojiChange, soundEnabled, onSoundToggle
}: SettingsProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
          }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: themeConfig.surface,
              border: `1px solid ${themeConfig.border}`,
              borderRadius: '24px',
              padding: '28px',
              width: '100%',
              maxWidth: '380px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: themeConfig.shadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings2 size={20} style={{ color: themeConfig.accent }} />
                <h2 style={{ color: themeConfig.text, fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>Settings</h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: themeConfig.cellBg,
                  border: `1px solid ${themeConfig.border}`,
                  borderRadius: '10px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: themeConfig.textMuted,
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Theme Switcher */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: themeConfig.textMuted, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Theme</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(Object.keys(THEMES) as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => onThemeChange(t)}
                    style={{
                      background: t === theme ? themeConfig.accent : themeConfig.cellBg,
                      border: `2px solid ${t === theme ? themeConfig.accent : themeConfig.border}`,
                      borderRadius: '12px',
                      padding: '8px 4px',
                      cursor: 'pointer',
                      color: t === theme ? '#fff' : themeConfig.text,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{THEMES[t].emoji}</div>
                    {THEMES[t].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: themeConfig.textMuted, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Marker Style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {EMOJI_SETS.map((set, i) => (
                  <button
                    key={i}
                    onClick={() => onEmojiChange(i)}
                    style={{
                      background: i === emojiSet ? `${themeConfig.accent}22` : themeConfig.cellBg,
                      border: `2px solid ${i === emojiSet ? themeConfig.accent : themeConfig.border}`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: themeConfig.text, fontSize: '0.85rem', fontWeight: 500 }}>{set.label}</span>
                    <span style={{ fontSize: '1.2rem' }}>{set.x} vs {set.o}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onSoundToggle}
              style={{
                width: '100%',
                background: soundEnabled ? `${themeConfig.accent}22` : themeConfig.cellBg,
                border: `2px solid ${soundEnabled ? themeConfig.accent : themeConfig.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: themeConfig.text,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sound Effects</span>
              {soundEnabled ? <Volume2 size={20} style={{ color: themeConfig.accent }} /> : <VolumeX size={20} style={{ color: themeConfig.textMuted }} />}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
