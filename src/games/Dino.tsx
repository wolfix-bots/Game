import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

const W=600,H=200,GROUND=160,DINO_W=40,DINO_H=50,OBS_W=20,GRAVITY=0.8,JUMP_V=-14;

export default function Dino() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({y:GROUND-DINO_H,vy:0,obs:[{x:W,h:40+Math.random()*30}],score:0,speed:4,frame:0,alive:true,started:false});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,best:Number(localStorage.getItem('dino-best')||0),alive:true,started:false});

  const jump=()=>{
    const s=state.current;
    if(!s.alive){restart();return;}
    if(!s.started){s.started=true;setDisplay(d=>({...d,started:true}));}
    if(s.y>=GROUND-DINO_H-2) s.vy=JUMP_V;
  };

  const restart=()=>{
    state.current={y:GROUND-DINO_H,vy:0,obs:[{x:W,h:40+Math.random()*30}],score:0,speed:4,frame:0,alive:true,started:false};
    setDisplay(d=>({...d,score:0,alive:true,started:false}));
  };

  useEffect(()=>{
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;
      if(s.started&&s.alive){
        s.vy+=GRAVITY; s.y=Math.min(s.y+s.vy,GROUND-DINO_H);
        if(s.y>=GROUND-DINO_H) s.vy=0;
        s.frame++; s.score++;
        if(s.frame%500===0) s.speed=Math.min(s.speed+0.5,12);
        s.obs=s.obs.map(o=>({...o,x:o.x-s.speed})).filter(o=>o.x>-OBS_W);
        if(!s.obs.length||s.obs[s.obs.length-1].x<W-200-Math.random()*200) s.obs.push({x:W,h:30+Math.random()*40});
        // Collision
        for(const o of s.obs){
          if(60<o.x+OBS_W&&60+DINO_W>o.x&&s.y+DINO_H>GROUND-o.h){
            s.alive=false;
            const best=Number(localStorage.getItem('dino-best')||0);
            if(s.score>best){localStorage.setItem('dino-best',String(s.score));}
            const u=getSession(); if(u) submitScore('dino',u.username,u.avatar,s.score);
            setDisplay(d=>({...d,alive:false,best:Math.max(d.best,s.score)}));
            break;
          }
        }
        setDisplay(d=>({...d,score:s.score}));
      }
      // Draw
      ctx.fillStyle='#1e293b'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#334155'; ctx.fillRect(0,GROUND,W,H-GROUND);
      ctx.fillStyle='#475569'; ctx.fillRect(0,GROUND-2,W,3);
      // Dino
      ctx.font=`${DINO_H}px serif`; ctx.fillText('🦕',55,s.y+DINO_H);
      // Obstacles
      for(const o of s.obs){ctx.fillStyle='#22c55e';ctx.fillRect(o.x,GROUND-o.h,OBS_W,o.h);ctx.font='24px serif';ctx.fillText('🌵',o.x-4,GROUND-o.h+4);}
      // Score
      ctx.fillStyle='#e2e8f0';ctx.font='bold 18px Outfit,sans-serif';ctx.textAlign='right';ctx.fillText(`${s.score}`,W-10,30);
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 20px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Press Space or tap to run!',W/2,H/2);}
      if(!s.alive){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 22px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Game Over!',W/2,H/2-15);ctx.font='16px Outfit,sans-serif';ctx.fillText('Tap to restart',W/2,H/2+15);}
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
    <GameShell title="Dino Run" emoji="🦕" gameId="dino" onReset={restart} scores={[{label:'Score',value:display.score,color:'#86efac'},{label:'Best',value:display.best,color:'#fbbf24'}]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump} style={{borderRadius:'12px',border:'2px solid #334155',display:'block',cursor:'pointer'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.8rem'}}>Space / tap to jump · Double tap to duck</div>
    </GameShell>
  );
}
