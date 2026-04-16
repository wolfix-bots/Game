import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=600,H=200,GROUND=160,DINO_W=40,DINO_H=50,CACTUS_W=20,CACTUS_H=40;

export default function Dino() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ y:GROUND, vy:0, cacti:[] as {x:number,h:number}[], score:0, speed:4, frame:0, alive:true, started:false, jumping:false });
  const rafRef = useRef(0);
  const [display, setDisplay] = useState({ score:0, best:Number(localStorage.getItem('dino-best')||0), alive:true });

  const jump = () => {
    const s = state.current;
    if (!s.started) { s.started = true; }
    if (s.y >= GROUND && s.alive) { s.vy = -14; }
    if (!s.alive) { restart(); }
  };

  const restart = () => {
    state.current = { y:GROUND, vy:0, cacti:[], score:0, speed:4, frame:0, alive:true, started:false, jumping:false };
    setDisplay(d => ({ ...d, score:0, alive:true }));
  };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    const tick = () => {
      const s = state.current;
      if (s.started && s.alive) {
        s.vy += 0.8; s.y = Math.min(GROUND, s.y + s.vy);
        if (s.y >= GROUND) s.vy = 0;
        s.frame++; s.speed = 4 + s.frame * 0.003;
        if (s.frame % Math.floor(80/s.speed*4) === 0) {
          s.cacti.push({ x:W, h: CACTUS_H + Math.floor(Math.random()*20) });
        }
        s.cacti = s.cacti.map(c=>({...c,x:c.x-s.speed})).filter(c=>c.x>-CACTUS_W);
        // Score
        if (s.frame%6===0) { s.score++; setDisplay(d=>({...d,score:s.score})); }
        // Collision
        for (const c of s.cacti) {
          if (c.x<80&&c.x+CACTUS_W>40&&s.y+DINO_H>GROUND+H-c.h-10) {
            s.alive=false;
            const best=Number(localStorage.getItem('dino-best')||0);
            if(s.score>best){localStorage.setItem('dino-best',String(s.score));}
            setDisplay(d=>({...d,alive:false,best:Math.max(d.best,s.score)}));
          }
        }
      }
      // Draw
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#334155'; ctx.fillRect(0,H-35,W,3);
      // Stars
      if(s.frame%3===0||!s.started) for(let i=0;i<3;i++){ctx.fillStyle='#475569';ctx.fillRect(Math.random()*W,Math.random()*(H-60),2,2);}
      // Dino
      ctx.font=`${DINO_H}px serif`; ctx.fillText('🦕',40,s.y+DINO_H-10);
      // Cacti
      for(const c of s.cacti){ctx.fillStyle='#22c55e';ctx.fillRect(c.x,H-35-c.h,CACTUS_W,c.h);ctx.fillStyle='#16a34a';ctx.fillRect(c.x-4,H-35-c.h,6,c.h/2);}
      // Score
      ctx.fillStyle='#94a3b8';ctx.font='bold 18px Outfit,sans-serif';ctx.textAlign='right';
      ctx.fillText(`Score: ${s.score}`,W-10,30);
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 20px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Press Space / Tap to start',W/2,H/2);}
      if(!s.alive){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ef4444';ctx.font='bold 22px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Game Over! Tap to restart',W/2,H/2);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();jump();}};
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[]);

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
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.8rem'}}>Space / tap to jump</div>
    </GameShell>
  );
}
