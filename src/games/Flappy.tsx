import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=320,H=480,GRAVITY=0.5,JUMP=-9,PIPE_W=52,GAP=140,PIPE_SPEED=3;

export default function Flappy() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({bird:{y:H/2,vy:0},pipes:[] as {x:number,top:number}[],score:0,frame:0,alive:true,started:false});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,best:Number(localStorage.getItem('flappy-best')||0),alive:true,started:false});

  const jump=()=>{
    const s=state.current;
    if(!s.alive){restart();return;}
    if(!s.started){s.started=true;setDisplay(d=>({...d,started:true}));}
    s.bird.vy=JUMP;
  };

  const restart=()=>{
    state.current={bird:{y:H/2,vy:0},pipes:[],score:0,frame:0,alive:true,started:false};
    setDisplay(d=>({...d,score:0,alive:true,started:false}));
  };

  useEffect(()=>{
    const canvas=canvasRef.current!;const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;
      if(s.started&&s.alive){
        s.bird.vy+=GRAVITY; s.bird.y+=s.bird.vy;
        s.frame++;
        if(s.frame%90===0) s.pipes.push({x:W,top:60+Math.random()*(H-GAP-120)});
        s.pipes=s.pipes.map(p=>({...p,x:p.x-PIPE_SPEED})).filter(p=>p.x>-PIPE_W);
        // Collision
        const bx=80,by=s.bird.y;
        if(by<0||by>H-20){s.alive=false;setDisplay(d=>({...d,alive:false}));}
        for(const p of s.pipes){
          if(bx+14>p.x&&bx<p.x+PIPE_W&&(by<p.top||by+20>p.top+GAP)){s.alive=false;setDisplay(d=>({...d,alive:false}));break;}
          if(p.x+PIPE_W===bx){
            s.score++;
            const best=Number(localStorage.getItem('flappy-best')||0);
            if(s.score>best){localStorage.setItem('flappy-best',String(s.score));}
            setDisplay(d=>({...d,score:s.score,best:Math.max(d.best,s.score)}));
          }
        }
      }
      // Draw sky
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'#0ea5e9');grad.addColorStop(1,'#7dd3fc');
      ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      // Ground
      ctx.fillStyle='#86efac';ctx.fillRect(0,H-30,W,30);
      ctx.fillStyle='#4ade80';ctx.fillRect(0,H-35,W,8);
      // Pipes
      for(const p of s.pipes){
        ctx.fillStyle='#22c55e';
        ctx.fillRect(p.x,0,PIPE_W,p.top);
        ctx.fillRect(p.x,p.top+GAP,PIPE_W,H-p.top-GAP);
        ctx.fillStyle='#16a34a';
        ctx.fillRect(p.x-4,p.top-20,PIPE_W+8,20);
        ctx.fillRect(p.x-4,p.top+GAP,PIPE_W+8,20);
      }
      // Bird
      ctx.font='24px serif';ctx.fillText('🐦',66,s.bird.y);
      // Score
      ctx.fillStyle='#fff';ctx.font='bold 28px Outfit,sans-serif';ctx.textAlign='center';
      ctx.fillText(String(s.score),W/2,50);
      if(!s.started){
        ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#fff';ctx.font='bold 22px Outfit,sans-serif';
        ctx.fillText('Tap to fly!',W/2,H/2);
      }
      if(!s.alive){
        ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#fff';ctx.font='bold 24px Outfit,sans-serif';
        ctx.fillText('Game Over!',W/2,H/2-20);
        ctx.font='18px Outfit,sans-serif';
        ctx.fillText(`Score: ${s.score}`,W/2,H/2+14);
        ctx.fillText('Tap to restart',W/2,H/2+44);
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{ if(e.code==='Space'){e.preventDefault();jump();} };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Flappy Bird" emoji="🐦" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#86efac'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={jump}
          style={{borderRadius:'16px',border:'2px solid #0ea5e9',display:'block',cursor:'pointer'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#64748b',fontSize:'0.8rem'}}>Click / tap / spacebar to flap</div>
    </GameShell>
  );
}
