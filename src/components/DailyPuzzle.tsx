import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Lightbulb } from 'lucide-react';
import { ThemeConfig } from '../lib/themes';
import { getTodaysPuzzle, isDailyDone, markDailyDone } from '../lib/daily';
import GameBoard from './GameBoard';

interface Props {
  open: boolean; onClose: () => void;
  theme: ThemeConfig; emojiX: string; emojiO: string;
  onComplete: () => void;
}

export default function DailyPuzzle({ open, onClose, theme, emojiX, emojiO, onComplete }: Props) {
  const puzzle = getTodaysPuzzle();
  const [board, setBoard] = useState<string[]>(puzzle.board);
  const [solved, setSolved] = useState(isDailyDone());
  const [failed, setFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const displayBoard = board.map(v => v === 'X' ? emojiX : v === 'O' ? emojiO : v);

  const handleClick = (i: number) => {
    if (solved || board[i] !== '') return;
    if (i === puzzle.solution) {
      const nb = [...board]; nb[i] = 'X';
      setBoard(nb); setSolved(true);
      markDailyDone(); onComplete();
    } else {
      setFailed(true); setTimeout(() => setFailed(false), 700);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '360px', backdropFilter: 'blur(20px)', boxShadow: theme.shadow }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: theme.accent }} />
                <h2 style={{ color: theme.text, fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Daily Puzzle</h2>
              </div>
              <button onClick={onClose} style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ color: theme.accent, fontWeight: 800, fontSize: '1.1rem' }}>{puzzle.title}</div>
              <div style={{ color: theme.textMuted, fontSize: '0.82rem', marginTop: '4px' }}>X to move — find the winning move!</div>
            </div>

            <motion.div animate={failed ? { x: [-6,6,-6,6,0] } : {}} transition={{ duration: 0.3 }}>
              <GameBoard board={displayBoard} onCellClick={handleClick} disabled={solved} theme={theme} gameOver={solved} />
            </motion.div>

            {solved ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ marginTop: '16px', textAlign: 'center', background: '#22c55e22', border: '1px solid #22c55e44', borderRadius: '14px', padding: '14px' }}
              >
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <div style={{ color: '#22c55e', fontWeight: 800 }}>Puzzle Solved!</div>
                <div style={{ color: theme.textMuted, fontSize: '0.78rem', marginTop: '4px' }}>Come back tomorrow for a new one</div>
              </motion.div>
            ) : (
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <button onClick={() => setShowHint(s => !s)}
                  style={{ background: theme.cellBg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: theme.textMuted, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <Lightbulb size={14} /> {showHint ? puzzle.hint : 'Show Hint'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
