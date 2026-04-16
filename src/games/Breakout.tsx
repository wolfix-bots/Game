import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

const W=480,H=400,PAD_W=80,PAD_H=12,BALL_R=8,ROWS=5,COLS=10,BRICK_H=18,BRICK_GAP=4;

export default function Breakout() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({ball:{x:W/2,y:H-80,vx:3,vy:-4},pad:W/2-PAD_W/2,bricks:[] as {x:number,y:number,alive:boolean,color:string}[],score:0,lives:3,started:false,over:false,won:false,mouseX:W/2});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,lives:3,over:false,won:false,best:Number(localStorage.getItem('breakout-best')||0)});

  const COLORS=['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6'];
  const BW=(W-BRICK_GAP*(COLS+1))/COLS;

  const initBricks=()=>{
    const b=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) b.push({x:BRICK_GAP+(BW+BRICK_GAP)*c,y:40+r*(BRICK_H+BRICK_GAP),alive:true,color:COLORS[r]});
    return b;
  };

  useEffect(()=>{
    state.current.bricks=initBricks();
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const onMouse=(e:MouseEvent)=>{const rect=canvas.getBoundingClientRect();state.current.mouseX=(e.clientX-rect.left)*(W/rect.width);};
    const onTouch=(e:TouchEvent)=>{const rect=canvas.getBoundingClientRect();state.current.mouseX=(e.touches[0].clientX-rect.left)*(W/rect.width);};
    canvas.addEventListener('mousemove',onMouse); canvas.addEventListener('touchmove',onTouch,{passive:true});

    const tick=()=>{
      const s=state.current;
      s.pad=Math.max(0,Math.min(W-PAD_W,s.mouseX-PAD_W/2));
      if(s.started&&!s.over&&!s.won){
        s.ball.x+=s.ball.vx; s.ball.y+=s.ball.vy;
        if(s.ball.x<=BALL_R||s.ball.x>=W-BALL_R) s.ball.vx*=-1;
        if(s.ball.y<=BALL_R) s.ball.vy*=-1;
        // Paddle
        if(s.ball.y>=H-40-BALL_R&&s.ball.y<=H-40&&s.ball.x>=s.pad&&s.ball.x<=s.pad+PAD_W){
          s.ball.vy=-Math.abs(s.ball.vy); s.ball.vx+=(s.ball.x-(s.pad+PAD_W/2))*0.08;
        }
        // Bricks
        for(const b of s.bricks){
          if(!b.alive) continue;
          if(s.ball.x>b.x&&s.ball.x<b.x+BW&&s.ball.y>b.y&&s.ball.y<b.y+BRICK_H){
            b.alive=false; s.ball.vy*=-1; s.score+=10;
            setDisplay(d=>({...d,score:s.score}));
          }
        }
        // Lost ball
        if(s.ball.y>H){s.lives--;if(s.lives<=0){s.over=true;const u=getSession();if(u)submitScore('breakout',u.username,u.avatar,s.score);const best=Number(localStorage.getItem('breakout-best')||0);if(s.score>best)localStorage.setItem('breakout-best',String(s.score));setDisplay(d=>({...d,lives:0,over:true,best:Math.max(d.best,s.score)}));}else{s.ball={x:W/2,y:H-80,vx:3,vy:-4};s.started=false;setDisplay(d=>({...d,lives:s.lives}));}}
        if(s.bricks.every(b=>!b.alive)){s.won=true;const u=getSession();if(u)submitScore('breakout',u.username,u.avatar,s.score+s.lives*100);setDisplay(d=>({...d,won:true}));}
      }
      // Draw
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
      s.bricks.forEach(b=>{if(!b.alive) return;ctx.fillStyle=b.color;ctx.beginPath();ctx.roundRect(b.x,b.y,BW,BRICK_H,4);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(b.x+2,b.y+2,BW-4,4);});
      ctx.fillStyle='#818cf8';ctx.beginPath();ctx.roundRect(s.pad,H-40,PAD_W,PAD_H,6);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(s.pad+6,H-38,PAD_W-12,4);
      const grad=ctx.createRadialGradient(s.ball.x,s.ball.y,0,s.ball.x,s.ball.y,BALL_R);
      grad.addColorStop(0,'#fff');grad.addColorStop(1,'#818cf8');
      ctx.fillStyle=grad;ctx.beginPath();ctx.arc(s.ball.x,s.ball.y,BALL_R,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=10;ctx.shadowColor='#818cf8';ctx.fill();ctx.shadowBlur=0;
      if(!s.started&&!s.over&&!s.won){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 20px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Move mouse / tap to aim',W/2,H/2-15);ctx.font='16px Outfit,sans-serif';ctx.fillText('Click to launch!',W/2,H/2+15);}
      if(s.over||s.won){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle=s.won?'#22c55e':'#ef4444';ctx.font='bold 24px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText(s.won?'🎉 You Win!':'💥 Game Over',W/2,H/2-10);ctx.fillStyle='#e2e8f0';ctx.font='16px Outfit,sans-serif';ctx.fillText('Click to restart',W/2,H/2+20);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(rafRef.current);canvas.removeEventListener('mousemove',onMouse);};
  },[]);

  const handleClick=()=>{
    const s=state.current;
    if(s.over||s.won){s.ball={x:W/2,y:H-80,vx:3,vy:-4};s.bricks=initBricks();s.score=0;s.lives=3;s.over=false;s.won=false;s.started=false;setDisplay(d=>({...d,score:0,lives:3,over:false,won:false}));}
    else s.started=true;
  };

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Breakout" emoji="🧱" gameId="breakout" scores={[{label:'Score',value:display.score,color:'#818cf8'},{label:'Lives',value:'❤️'.repeat(display.lives)||'💀',color:'#ef4444'},{label:'Best',value:display.best,color:'#fbbf24'}]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} style={{borderRadius:'12px',border:'2px solid #334155',display:'block',cursor:'none'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.8rem'}}>Move mouse/finger to control paddle · Click to launch</div>
    </GameShell>
  );
}
