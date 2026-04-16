export type Theme = 'day' | 'night' | 'neon' | 'pastel';

export interface ThemeConfig {
  name: string;
  emoji: string;
  bg: string;
  surface: string;
  surfaceGlass: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  cellBg: string;
  cellHover: string;
  xColor: string;
  oColor: string;
  winLine: string;
  shadow: string;
  glowX: string;
  glowO: string;
}

export const THEMES: Record<Theme, ThemeConfig> = {
  day: {
    name: 'Day',
    emoji: '☀️',
    bg: 'linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 50%, #ddd6fe 100%)',
    surface: 'rgba(255,255,255,0.7)',
    surfaceGlass: 'rgba(255,255,255,0.5)',
    border: 'rgba(99,102,241,0.2)',
    text: '#1e293b',
    textMuted: '#64748b',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    cellBg: 'rgba(255,255,255,0.6)',
    cellHover: 'rgba(99,102,241,0.1)',
    xColor: '#6366f1',
    oColor: '#ec4899',
    winLine: '#6366f1',
    shadow: '0 8px 32px rgba(99,102,241,0.15)',
    glowX: '0 0 12px rgba(99,102,241,0.4)',
    glowO: '0 0 12px rgba(236,72,153,0.4)',
  },
  night: {
    name: 'Night',
    emoji: '🌙',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    surface: 'rgba(30,41,59,0.8)',
    surfaceGlass: 'rgba(15,23,42,0.6)',
    border: 'rgba(148,163,184,0.15)',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#818cf8',
    accentHover: '#6366f1',
    cellBg: 'rgba(30,41,59,0.6)',
    cellHover: 'rgba(129,140,248,0.1)',
    xColor: '#818cf8',
    oColor: '#f472b6',
    winLine: '#818cf8',
    shadow: '0 8px 32px rgba(0,0,0,0.4)',
    glowX: '0 0 12px rgba(129,140,248,0.5)',
    glowO: '0 0 12px rgba(244,114,182,0.5)',
  },
  neon: {
    name: 'Neon',
    emoji: '⚡',
    bg: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)',
    surface: 'rgba(10,10,10,0.9)',
    surfaceGlass: 'rgba(0,255,136,0.03)',
    border: 'rgba(0,255,136,0.3)',
    text: '#00ff88',
    textMuted: '#00cc6a',
    accent: '#00ff88',
    accentHover: '#00cc6a',
    cellBg: 'rgba(0,255,136,0.03)',
    cellHover: 'rgba(0,255,136,0.08)',
    xColor: '#00ff88',
    oColor: '#ff006e',
    winLine: '#00ff88',
    shadow: '0 0 40px rgba(0,255,136,0.2)',
    glowX: '0 0 20px rgba(0,255,136,0.8)',
    glowO: '0 0 20px rgba(255,0,110,0.8)',
  },
  pastel: {
    name: 'Pastel',
    emoji: '🌸',
    bg: 'linear-gradient(135deg, #d4f5e9 0%, #e8d5f5 50%, #d5e8f5 100%)',
    surface: 'rgba(255,255,255,0.65)',
    surfaceGlass: 'rgba(255,255,255,0.45)',
    border: 'rgba(167,139,250,0.25)',
    text: '#4a4a6a',
    textMuted: '#7a7a9a',
    accent: '#a78bfa',
    accentHover: '#8b5cf6',
    cellBg: 'rgba(255,255,255,0.5)',
    cellHover: 'rgba(167,139,250,0.12)',
    xColor: '#a78bfa',
    oColor: '#f9a8d4',
    winLine: '#a78bfa',
    shadow: '0 8px 32px rgba(167,139,250,0.2)',
    glowX: '0 0 12px rgba(167,139,250,0.5)',
    glowO: '0 0 12px rgba(249,168,212,0.5)',
  },
};

export const EMOJI_SETS = [
  { label: 'Classic', x: 'X', o: 'O' },
  { label: 'Hearts & Stars', x: '❤️', o: '⭐' },
  { label: 'Fire & Ice', x: '🔥', o: '❄️' },
  { label: 'Sun & Moon', x: '☀️', o: '🌙' },
  { label: 'Cat & Dog', x: '🐱', o: '🐶' },
  { label: 'Sword & Shield', x: '⚔️', o: '🛡️' },
];
