import React, { useEffect, useRef } from 'react';

interface Props { active: boolean; color: string; }

export default function WinExplosion({ active, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type P = { x:number; y:number; vx:number; vy:number; life:number; size:number; col:string; emoji:string };
    const emojis = ['🦊','⭐','✨','🎉','🏆','🔥','💫'];
    const cols = [color, '#f97316', '#fbbf24', '#22c55e', '#a78bfa'];
    const particles: P[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5 + canvas.height * 0.1,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 4,
      life: 1,
      size: Math.random() * 14 + 8,
      col: cols[Math.floor(Math.random() * cols.length)],
      emoji: Math.random() > 0.45 ? emojis[Math.floor(Math.random() * emojis.length)] : '',
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.016;
        if (p.life <= 0) continue;
        alive = true;
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.emoji) {
          ctx.font = `${p.size * 1.8}px serif`;
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, color]);

  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500 }} />;
}
