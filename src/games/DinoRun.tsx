import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=400,H=200,GROUND=160,DINO_W=40,DINO_H=50,OBS_W=20;

export default function DinoRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({y:GROUND,vy:0,obs:[{x:W,h:40}],score:0,speed:4,alive:true,started:false,frame:0});
  const rafRef = useRef(0);
  const [display, setDisplay] = useState({score:0,best:Number(localStorage.getItem('dino-best')||0),alive:true,started:false});

  const jump = () => {
    const s = state.current;
    if (!s.alive) { restart(); return; }
    if (!s.started) { s.started=true; setDisplay(d=>({...d,started:true})); }
    if (s.y >= GROUND) s.vy = -14;
  };

  const restart = () => {
    state.current = {y:GROUND,vy:0,obs:[{x:W,h:40}],score:0,speed:4,alive:true,started:false,frame:0};
    setDisplay(d=>({...d,score:0,alive:true,started:false}));
  };

  useEffect(()=>{
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;
      if(s.started&&s.alive){
        s.vy+=0.8; s.y+=s.vy;
        if(s.y>GROUND){s.y=GROUND;s.vy=0;}
        s.frame++; s.score=Math.floor(s.frame/6);
        s.speed=4+Math.floor(s.score/100)*0.5;
        s.obs=s.obs.map(o=>({...o,x:o.x-s.speed})).filter(o=>o.x>-OBS_W);
        if(s.obs.length===0||s.obs[s.obs.length-1].x<W-150-Math.random()*200)
          s.obs.push({x:W,h:30+Math.random()*30});
        for(const o of s.obs){
          if(40<o.x+OBS_W&&40+DINO_W>o.x&&s.y+DINO_H>GROUND-o.h){
            s.alive=false;
            const best=Number(localStorage.getItem('dino-best')||0);
            if(s.score>best)localStorage.setItem('dino-best',String(s.score));
            setDisplay(d=>({...d,score:s.score,best:Math.max(d.best,s.score),alive:false}));
          }
        }
        if(s.frame%6===0) setDisplay(d=>({...d,score:s.score}));
      }
      // Draw
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#334155'; ctx.fillRect(0,GROUND+DINO_H,W,4);
      // Stars
      ctx.fillStyle='#475569';
      for(let i=0;i<20;i++){const sx=(i*73+s.frame)%W;ctx.fillRect(sx,10+i%5*12,2,2);}
      // Dino
      ctx.font=`${DINO_H}px serif`; ctx.fillText('🦕',36,s.y+DINO_H);
      // Obstacles
      for(const o of s.obs){
        ctx.fillStyle='#22c55e';
        ctx.fillRect(o.x,GROUND+DINO_H-o.h,OBS_W,o.h);
        ctx.fillStyle='#16a34a';
        ctx.fillRect(o.x-4,GROUND+DINO_H-o.h-10,OBS_W+8,12);
      }
      if(!s.started||!s.alive){
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#fff'; ctx.font='bold 18px Outfit,sans-serif'; ctx.textAlign='center';
        ctx.fillText(s.alive?'Tap / Space to start!':'Game Over! Tap to restart',W/2,H/2);
        if(!s.alive){ctx.font='14px Outfit,sans-serif';ctx.fillText(`Score: ${s.score}`,W/2,H/2+24);}
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();jump();}};
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Dino Run" emoji="🦕" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#86efac'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block',cursor:'pointer'}}/>
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#64748b',fontSize:'0.8rem'}}>Click / tap / spacebar to jump</div>
    </GameShell>
  );
}
