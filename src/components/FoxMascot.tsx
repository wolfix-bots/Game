import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Mood = 'idle' | 'thinking' | 'happy' | 'sad' | 'excited';

interface Props { mood: Mood; message?: string | null; accentColor: string; }

export default function FoxMascot({ mood, message, accentColor }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <motion.div
        animate={{
          y: mood === 'excited' ? [0,-8,0] : mood === 'thinking' ? [0,-2,0] : [0,-1,0],
          rotate: mood === 'thinking' ? [-4,4,-4] : 0,
          scale: mood === 'happy' || mood === 'excited' ? [1,1.1,1] : 1,
        }}
        transition={{ repeat: Infinity, duration: mood === 'excited' ? 0.5 : 2.5, ease: 'easeInOut' }}
        style={{ flexShrink: 0, cursor: 'default', userSelect: 'none' }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          {/* Ears */}
          <polygon points="7,24 15,4 22,22" fill="#f97316" />
          <polygon points="34,22 41,4 49,24" fill="#f97316" />
          <polygon points="10,22 15,9 20,22" fill="#fde68a" />
          <polygon points="36,22 41,9 46,22" fill="#fde68a" />
          {/* Head */}
          <ellipse cx="28" cy="33" rx="21" ry="19" fill="#f97316" />
          {/* Face */}
          <ellipse cx="28" cy="36" rx="14" ry="12" fill="#fef3c7" />
          {/* Eyes */}
          <motion.g animate={{ scaleY: (mood==='happy'||mood==='excited') ? 0.25 : 1 }} transition={{ duration: 0.15 }}>
            <circle cx="21" cy="30" r="3.5" fill="#1e293b" />
            <circle cx="35" cy="30" r="3.5" fill="#1e293b" />
            <circle cx="22" cy="29" r="1.2" fill="white" />
            <circle cx="36" cy="29" r="1.2" fill="white" />
          </motion.g>
          {/* Nose */}
          <ellipse cx="28" cy="37" rx="2.5" ry="1.8" fill="#92400e" />
          {/* Mouth */}
          <path d={mood==='sad' ? 'M22 42 Q28 39 34 42' : 'M22 41 Q28 45 34 41'}
            stroke="#92400e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* Blush */}
          {(mood==='happy'||mood==='excited') && (
            <>
              <circle cx="15" cy="37" r="4.5" fill="#fb923c" opacity="0.45" />
              <circle cx="41" cy="37" r="4.5" fill="#fb923c" opacity="0.45" />
            </>
          )}
          {/* Thinking dots */}
          {mood==='thinking' && (
            <>
              <motion.circle animate={{ opacity:[0,1,0] }} transition={{ repeat:Infinity, duration:1, delay:0 }} cx="38" cy="16" r="2" fill={accentColor} />
              <motion.circle animate={{ opacity:[0,1,0] }} transition={{ repeat:Infinity, duration:1, delay:0.3 }} cx="43" cy="12" r="2.5" fill={accentColor} />
              <motion.circle animate={{ opacity:[0,1,0] }} transition={{ repeat:Infinity, duration:1, delay:0.6 }} cx="49" cy="9" r="3" fill={accentColor} />
            </>
          )}
        </svg>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity:0, scale:0.8, x:-10 }}
            animate={{ opacity:1, scale:1, x:0 }}
            exit={{ opacity:0, scale:0.8, x:-10 }}
            transition={{ type:'spring', stiffness:300, damping:22 }}
            style={{
              background: `${accentColor}20`,
              border: `1.5px solid ${accentColor}55`,
              borderRadius: '12px 12px 12px 4px',
              padding: '8px 12px',
              fontSize: '0.82rem', fontWeight: 600,
              color: accentColor, fontStyle: 'italic',
              maxWidth: '200px',
            }}
          >
            "{message}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
