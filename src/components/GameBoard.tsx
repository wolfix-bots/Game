import React, { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeConfig } from '../lib/themes';
import { getWinningLine } from '../lib/AI';

interface CellProps {
  value: string;
  index: number;
  onClick: (i: number) => void;
  disabled: boolean;
  theme: ThemeConfig;
  isWinning: boolean;
}

const Cell = memo(({ value, index, onClick, disabled, theme, isWinning }: CellProps) => {
  const isEmpty = value === '';
  const isX = value === 'X' || (!['X','O'].includes(value) && value !== '' && index % 2 === 0);

  return (
    <motion.button
      onClick={() => !disabled && isEmpty && onClick(index)}
      whileHover={!disabled && isEmpty ? { scale: 1.05 } : {}}
      whileTap={!disabled && isEmpty ? { scale: 0.95 } : {}}
      className="cell-btn"
      style={{
        background: isWinning
          ? `${theme.cellHover}`
          : theme.cellBg,
        border: `2px solid ${isWinning ? theme.accent : theme.border}`,
        borderRadius: '16px',
        cursor: disabled || !isEmpty ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
        boxShadow: isWinning
          ? `${theme.glowX}, inset 0 0 20px ${theme.accent}22`
          : `inset 0 2px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)`,
        transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        aspectRatio: '1 / 1',
      }}
    >
      {/* Hover ghost */}
      {isEmpty && !disabled && (
        <span style={{ opacity: 0.12, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', position: 'absolute' }}
          className="cell-ghost" />
      )}
      <AnimatePresence>
        {value && (
          <motion.span
            key={value + index}
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
              filter: isWinning
                ? `drop-shadow(0 0 8px ${isX ? theme.xColor : theme.oColor})`
                : 'none',
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              color: isX ? theme.xColor : theme.oColor,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: isWinning
                ? `0 0 16px ${isX ? theme.xColor : theme.oColor}`
                : 'none',
            }}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

Cell.displayName = 'Cell';

interface GameBoardProps {
  board: string[];
  onCellClick: (i: number) => void;
  disabled: boolean;
  theme: ThemeConfig;
  gameOver: boolean;
}

export default function GameBoard({ board, onCellClick, disabled, theme, gameOver }: GameBoardProps) {
  const winLine = getWinningLine(board);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 2vw, 14px)',
          width: '100%',
        }}
      >
        {board.map((val, i) => (
          <Cell
            key={i}
            value={val}
            index={i}
            onClick={onCellClick}
            disabled={disabled || gameOver}
            theme={theme}
            isWinning={winLine ? winLine.includes(i) : false}
          />
        ))}
      </div>

      {/* Winning line overlay */}
      {winLine && (
        <WinningLine line={winLine} theme={theme} />
      )}
    </div>
  );
}

function WinningLine({ line, theme }: { line: number[]; theme: ThemeConfig }) {
  const getLineCoords = () => {
    const positions: Record<string, { x1: number; y1: number; x2: number; x2f: number; y2: number }> = {};
    // rows
    if (JSON.stringify(line) === JSON.stringify([0,1,2])) return { x1: 5, y1: 16.7, x2: 95, y2: 16.7 };
    if (JSON.stringify(line) === JSON.stringify([3,4,5])) return { x1: 5, y1: 50, x2: 95, y2: 50 };
    if (JSON.stringify(line) === JSON.stringify([6,7,8])) return { x1: 5, y1: 83.3, x2: 95, y2: 83.3 };
    // cols
    if (JSON.stringify(line) === JSON.stringify([0,3,6])) return { x1: 16.7, y1: 5, x2: 16.7, y2: 95 };
    if (JSON.stringify(line) === JSON.stringify([1,4,7])) return { x1: 50, y1: 5, x2: 50, y2: 95 };
    if (JSON.stringify(line) === JSON.stringify([2,5,8])) return { x1: 83.3, y1: 5, x2: 83.3, y2: 95 };
    // diags
    if (JSON.stringify(line) === JSON.stringify([0,4,8])) return { x1: 5, y1: 5, x2: 95, y2: 95 };
    if (JSON.stringify(line) === JSON.stringify([2,4,6])) return { x1: 95, y1: 5, x2: 5, y2: 95 };
    return null;
  };

  const coords = getLineCoords();
  if (!coords) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.line
        x1={coords.x1} y1={coords.y1}
        x2={coords.x1} y2={coords.y1}
        stroke={theme.winLine}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${theme.winLine})` }}
        animate={{ x2: coords.x2, y2: coords.y2 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
}
