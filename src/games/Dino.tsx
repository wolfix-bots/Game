import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=600,H=200,GROUND=160,DINO_W=40,DINO_H=50,CACTUS_W=24;

export default function Dino() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({y:GROUND,vy:0,jumping:false,cacti:[] as {x:number,h:number}[],score:0,speed:4,frame:0,alive:true,started:false});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,best:Number(localStorage.getItem('dino-best')||0),alive:true});

  const jump=()=>{
    const s=state.current;
    if(!s.alive){restart();return;}
    if(!s.started){s.started=true;}
    if(!s.jumping){s.vy=-14;s.jumping=true;}
  };

  const restart=()=>{
    state.current={y:GROUND,vy:0,jumping:false,cacti:[],score:0,speed:4,frame:0,alive:true,started:false};
    setDisplay(d=>({...d,score:0,alive:true}));
  };

  useEffect(()=>{
    const canvas=canvasRef.current!;const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;
      if(s.started&&s.alive){
        s.vy+=0.8;s.y+=s.vy;
        if(s.y>=GROUND){s.y=GROUND;s.vy=0;s.jumping=false;}
        s.frame++;s.score++;s.speed=4+s.score/500;
        if(s.frame%80===0)s.cacti.push({x:W,h:30+Math.random()*40});
        s.cacti=s.cacti.map(c=>({...c,x:c.x-s.speed})).filter(c=>c.x>-30);
        for(const c of s.cacti){
          if(70<c.x+CACTUS_W&&90>c.x&&s.y+DINO_H>GROUND+H-c.h-10){
            s.alive=false;
            const best=Number(localStorage.getItem('dino-best')||0);
            if(s.score>best)localStorage.setItem('dino-best',String(s.score));
            setDisplay(d=>({...d,alive:false,best:Math.max(d.best,s.score)}));
          }
        }
        setDisplay(d=>({...d,score:Math.floor(s.score/5)}));
      }
      // Sky
      ctx.fillStyle='#e2e8f0';ctx.fillRect(0,0,W,H);
      // Clouds
      ctx.fillStyle='#fff';
      [[100,30],[250,50],[420,25]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.arc(x+20,y-5,25,0,Math.PI*2);ctx.arc(x+40,y,18,0,Math.PI*2);ctx.fill();});
      // Ground
      ctx.fillStyle='#6b7280';ctx.fillRect(0,GROUND+DINO_H,W,4);
      // Dino
      ctx.font='36px serif';ctx.fillText('🦕',60,s.y+DINO_H-4);
      // Cacti
      for(const c of s.cacti){ctx.fillStyle='#166534';ctx.fillRect(c.x,GROUND+DINO_H-c.h,CACTUS_W,c.h);}
      // Score
      ctx.fillStyle='#1e293b';ctx.font='bold 18px Outfit,sans-serif';ctx.textAlign='right';ctx.fillText(`${Math.floor(s.score/5)}`,W-16,24);
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 20px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Press Space or Tap to Start',W/2,H/2);}
      if(!s.alive){ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 22px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Game Over! Tap to restart',W/2,H/2);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();jump();}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Dino Run" emoji="🦕" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#86efac'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{borderRadius:'12px',border:'2px solid #d1d5db',display:'block',cursor:'pointer'}}/>
      </div>
      <div style={{textAlign:'center',color:'#64748b',fontSize:'0.8rem'}}>Space / tap to jump · Double-tap for double jump</div>
    </GameShell>
  );
}
