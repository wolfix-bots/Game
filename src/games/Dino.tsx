import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=600,H=160,GROUND=130,DINO_W=40,DINO_H=50,GRAVITY=0.8,JUMP=-14;

export default function Dino() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ y:GROUND-DINO_H, vy:0, obstacles:[] as {x:number,w:number,h:number}[], score:0, speed:4, frame:0, alive:true, started:false });
  const rafRef = useRef(0);
  const [display, setDisplay] = useState({ score:0, best:Number(localStorage.getItem('dino-best')||0), alive:true });

  const jump = () => {
    const s = state.current;
    if (!s.alive) { restart(); return; }
    if (!s.started) s.started = true;
    if (s.y >= GROUND - DINO_H) s.vy = JUMP;
  };

  const restart = () => {
    state.current = { y:GROUND-DINO_H, vy:0, obstacles:[], score:0, speed:4, frame:0, alive:true, started:false };
    setDisplay(d => ({ ...d, score:0, alive:true }));
  };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const tick = () => {
      const s = state.current;
      if (s.started && s.alive) {
        s.vy += GRAVITY; s.y = Math.min(s.y + s.vy, GROUND - DINO_H);
        if (s.y >= GROUND - DINO_H) s.vy = 0;
        s.frame++; s.score++; s.speed = 4 + s.score / 500;
        if (s.frame % Math.max(40, 80 - s.score/100) === 0) {
          const h = 30 + Math.random() * 40;
          s.obstacles.push({ x: W, w: 20 + Math.random()*20, h });
        }
        s.obstacles = s.obstacles.map(o => ({ ...o, x: o.x - s.speed })).filter(o => o.x > -50);
        for (const o of s.obstacles) {
          if (40 < o.x + o.w && 40 + DINO_W > o.x && s.y + DINO_H > GROUND - o.h) {
            s.alive = false;
            const best = Number(localStorage.getItem('dino-best')||0);
            if (s.score > best) localStorage.setItem('dino-best', String(s.score));
            setDisplay({ score: s.score, best: Math.max(best, s.score), alive: false });
          }
        }
        if (s.score % 60 === 0) setDisplay(d => ({ ...d, score: s.score }));
      }
      // Draw
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#334155'; ctx.fillRect(0,GROUND,W,4);
      // Dino
      ctx.font = `${DINO_H}px serif`; ctx.fillText('🦕', 40, s.y + DINO_H);
      // Obstacles
      ctx.fillStyle = '#22c55e';
      for (const o of s.obstacles) ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      // Score
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 18px Outfit,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(String(s.score), W-10, 30);
      if (!s.started) { ctx.fillStyle='#e2e8f0'; ctx.textAlign='center'; ctx.font='bold 16px Outfit,sans-serif'; ctx.fillText('Press Space or tap to start',W/2,H/2); }
      if (!s.alive) { ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='bold 20px Outfit,sans-serif'; ctx.fillText('Game Over! Tap to restart',W/2,H/2); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code==='Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const scale = Math.min(1, (window.innerWidth - 32) / W);

  return (
    <GameShell title="Dino Run" emoji="🦕" onReset={restart} scores={[
      { label: 'Score', value: display.score, color: '#86efac' },
      { label: 'Best', value: display.best, color: '#fbbf24' },
    ]}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: W, margin: '0 auto' }}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{ borderRadius: '12px', border: '2px solid #1e293b', display: 'block', cursor: 'pointer' }} />
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#475569', fontSize: '0.8rem' }}>Space / tap to jump</div>
    </GameShell>
  );
}
