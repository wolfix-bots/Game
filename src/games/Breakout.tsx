import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=480,H=360,PAD_W=80,PAD_H=12,BALL_R=8,ROWS=5,COLS=10,BRICK_H=18,BRICK_GAP=4;

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    ball:{x:W/2,y:H-60,vx:3,vy:-4},
    pad:W/2-PAD_W/2,
    bricks:[] as {x:number,y:number,alive:boolean,color:string}[],
    score:0, lives:3, alive:true, started:false,
  });
  const rafRef = useRef(0);
  const [display, setDisplay] = useState({score:0,lives:3,over:false,won:false,started:false});

  const COLORS=['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6'];

  const initBricks = () => {
    const bw=(W-BRICK_GAP)/COLS-BRICK_GAP;
    return Array(ROWS).fill(null).flatMap((_,r)=>
      Array(COLS).fill(null).map((_,c)=>({
        x:BRICK_GAP+c*(bw+BRICK_GAP), y:40+r*(BRICK_H+BRICK_GAP),
        alive:true, color:COLORS[r],
      }))
    );
  };

  const restart = () => {
    const s=state.current;
    s.ball={x:W/2,y:H-60,vx:3*(Math.random()>0.5?1:-1),vy:-4};
    s.pad=W/2-PAD_W/2; s.bricks=initBricks(); s.score=0; s.lives=3; s.alive=true; s.started=false;
    setDisplay({score:0,lives:3,over:false,won:false,started:false});
  };

  useEffect(()=>{
    state.current.bricks=initBricks();
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const bw=(W-BRICK_GAP)/COLS-BRICK_GAP;

    const tick=()=>{
      const s=state.current;
      if(s.started&&s.alive){
        // Move ball
        s.ball.x+=s.ball.vx; s.ball.y+=s.ball.vy;
        // Wall
        if(s.ball.x<=BALL_R||s.ball.x>=W-BALL_R) s.ball.vx*=-1;
        if(s.ball.y<=BALL_R) s.ball.vy*=-1;
        // Paddle
        if(s.ball.y>=H-PAD_H-BALL_R*2&&s.ball.x>=s.pad&&s.ball.x<=s.pad+PAD_W){
          s.ball.vy=-Math.abs(s.ball.vy);
          s.ball.vx=((s.ball.x-(s.pad+PAD_W/2))/(PAD_W/2))*5;
        }
        // Bottom
        if(s.ball.y>H){
          s.lives--;
          if(s.lives<=0){s.alive=false;setDisplay(d=>({...d,over:true,lives:0}));}
          else{s.ball={x:W/2,y:H-60,vx:3*(Math.random()>0.5?1:-1),vy:-4};setDisplay(d=>({...d,lives:s.lives}));}
        }
        // Bricks
        for(const b of s.bricks){
          if(!b.alive) continue;
          if(s.ball.x>=b.x&&s.ball.x<=b.x+bw&&s.ball.y>=b.y&&s.ball.y<=b.y+BRICK_H){
            b.alive=false; s.ball.vy*=-1; s.score+=10;
            setDisplay(d=>({...d,score:s.score}));
            if(s.bricks.every(b=>!b.alive)){s.alive=false;setDisplay(d=>({...d,won:true}));}
          }
        }
      }
      // Draw
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
      // Bricks
      for(const b of s.bricks){
        if(!b.alive) continue;
        ctx.fillStyle=b.color; ctx.beginPath();
        ctx.roundRect(b.x,b.y,bw,BRICK_H,4); ctx.fill();
      }
      // Paddle
      ctx.fillStyle='#818cf8'; ctx.beginPath();
      ctx.roundRect(s.pad,H-PAD_H,PAD_W,PAD_H,6); ctx.fill();
      // Ball
      ctx.fillStyle='#e2e8f0'; ctx.beginPath();
      ctx.arc(s.ball.x,s.ball.y,BALL_R,0,Math.PI*2); ctx.fill();
      // Overlay
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 20px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Move mouse / tap to start',W/2,H/2);}
      if(!s.alive&&display.over){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ef4444';ctx.font='bold 24px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Game Over!',W/2,H/2-10);ctx.fillStyle='#94a3b8';ctx.font='16px Outfit,sans-serif';ctx.fillText('Click to restart',W/2,H/2+20);}
      if(!s.alive&&display.won){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#22c55e';ctx.font='bold 24px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('You Win! 🎉',W/2,H/2-10);ctx.fillStyle='#94a3b8';ctx.font='16px Outfit,sans-serif';ctx.fillText('Click to restart',W/2,H/2+20);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  const handleMove=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const s=state.current;
    if(!s.started){s.started=true;setDisplay(d=>({...d,started:true}));}
    const rect=canvasRef.current!.getBoundingClientRect();
    const clientX='touches' in e?e.touches[0].clientX:e.clientX;
    const x=(clientX-rect.left)*(W/rect.width);
    s.pad=Math.max(0,Math.min(W-PAD_W,x-PAD_W/2));
  };

  const handleClick=()=>{ if(!state.current.alive) restart(); };

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Breakout" emoji="🧧" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#f59e0b'},
      {label:'Lives',value:display.lives,color:'#ef4444'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H}
          onMouseMove={handleMove} onTouchMove={handleMove} onClick={handleClick}
          style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block',cursor:'none',touchAction:'none'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.8rem'}}>Move mouse or drag to control paddle</div>
    </GameShell>
  );
}
