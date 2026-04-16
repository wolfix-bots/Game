import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '../lib/achievements';

interface Props { achievement: Achievement | null; accentColor: string; }

export default function AchievementToast({ achievement, accentColor }: Props) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed', bottom: '24px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.96)',
            border: `2px solid ${accentColor}`,
            borderRadius: '18px', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            zIndex: 9999, backdropFilter: 'blur(16px)',
            boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 24px ${accentColor}55`,
            minWidth: '260px', maxWidth: '340px',
          }}
        >
          <motion.span
            animate={{ rotate:[0,-15,15,-10,10,0], scale:[1,1.4,1] }}
            transition={{ duration: 0.7 }}
            style={{ fontSize: '2.2rem', flexShrink: 0 }}
          >{achievement.emoji}</motion.span>
          <div>
            <div style={{ color: accentColor, fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
              Achievement Unlocked!
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{achievement.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>{achievement.desc}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
