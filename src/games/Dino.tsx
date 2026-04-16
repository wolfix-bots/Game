import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=600, H=200, GROUND=160, DINO_W=40, DINO_H=50;

export default function Dino() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ y:GROUND-DINO_H, vy:0, jumping:false, cacti:[] as {x:number,w:number,h:number}[], score:0, speed:4, alive:true, started:false, frame:0 });
  const rafRef = useRef(0);
  const [display, setDisplay] = useState({ score:0, best:Number(localStorage.getItem('dino-best')||0), alive:true });

  const jump = () => {
    const s = state.current;
    if (!s.alive) { restart(); return; }
    if (!s.started) s.started = true;
    if (!s.jumping) { s.vy = -14; s.jumping = true; }
  };

  const restart = () => {
    state.current = { y:GROUND-DINO_H, vy:0, jumping:false, cacti:[], score:0, speed:4, alive:true, started:false, frame:0 };
    setDisplay(d => ({ ...d, score:0, alive:true }));
  };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const tick = () => {
      const s = state.current;
      if (s.started && s.alive) {
        s.frame++; s.score++; s.speed = 4 + s.score/500;
        s.vy += 0.8; s.y += s.vy;
        if (s.y >= GROUND-DINO_H) { s.y = GROUND-DINO_H; s.vy = 0; s.jumping = false; }
        if (s.frame % 80 === 0) s.cacti.push({ x:W, w:20+Math.random()*20, h:30+Math.random()*40 });
        s.cacti = s.cacti.map(c=>({...c,x:c.x-s.speed})).filter(c=>c.x>-50);
        for (const c of s.cacti) {
          if (60<c.x+c.w && 60+DINO_W>c.x && s.y+DINO_H>GROUND-c.h) {
            s.alive = false;
            const best = Number(localStorage.getItem('dino-best')||0);
            const sc = Math.floor(s.score/10);
            if (sc>best) localStorage.setItem('dino-best',String(sc));
            setDisplay({ score:sc, best:Math.max(best,sc), alive:false });
          }
        }
      }
      // Draw
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#334155'; ctx.fillRect(0,GROUND,W,H-GROUND);
      ctx.fillStyle = '#475569'; ctx.fillRect(0,GROUND-2,W,2);
      // Stars
      if (!s.started) { ctx.fillStyle='#94a3b8'; for(let i=0;i<20;i++){ctx.fillRect(i*30+10,20+i%4*15,2,2);} }
      // Dino
      ctx.font=`${DINO_H}px serif`; ctx.fillText('🦕',56,s.y+DINO_H);
      // Cacti
      for (const c of s.cacti) {
        ctx.fillStyle='#22c55e'; ctx.fillRect(c.x,GROUND-c.h,c.w,c.h);
        ctx.fillStyle='#16a34a'; ctx.fillRect(c.x+4,GROUND-c.h-10,c.w-8,14);
      }
      // Score
      ctx.fillStyle='#94a3b8'; ctx.font='bold 16px Outfit,sans-serif'; ctx.textAlign='right';
      ctx.fillText(`${Math.floor(s.score/10)}`, W-10, 24);
      if (!s.started) { ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#e2e8f0'; ctx.font='bold 20px Outfit,sans-serif'; ctx.textAlign='center'; ctx.fillText('Tap / Space to start',W/2,H/2); }
      if (!s.alive) { ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#e2e8f0'; ctx.font='bold 20px Outfit,sans-serif'; ctx.textAlign='center'; ctx.fillText('Game Over! Tap to restart',W/2,H/2); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const h = (e:KeyboardEvent) => { if(e.code==='Space'){e.preventDefault();jump();} };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  }, []);

  const scale = Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Dino Run" emoji="🦕" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#86efac'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block',cursor:'pointer'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.8rem'}}>Tap / Spacebar to jump</div>
    </GameShell>
  );
}
