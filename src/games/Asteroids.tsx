import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';
import { getSession } from '../lib/auth';
import { submitScore } from '../lib/leaderboard';

const W=500,H=400;
type V2={x:number;y:number};
type Asteroid={x:number;y:number;vx:number;vy:number;r:number;pts:V2[]};
type Bullet={x:number;y:number;vx:number;vy:number;life:number};

function makePts(r:number,n:number):V2[]{return Array.from({length:n},(_u:unknown,i:number)=>{const ang=i/n*Math.PI*2;const d=r*(0.7+Math.random()*0.6);return{x:Math.cos(ang)*d,y:Math.sin(ang)*d};});}

function randAsteroid(size=1): Asteroid {
  const side=Math.floor(Math.random()*4);
  const x=side===0?0:side===1?W:Math.random()*W;
  const y=side===2?0:side===3?H:Math.random()*H;
  const angle=Math.random()*Math.PI*2;
  const speed=(1+Math.random()*1.5)*(2-size*0.3);
  const r=20+size*15;
  return{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r,pts:makePts(r,8+Math.floor(Math.random()*4))};
}

function splitAsteroid(a:Asteroid):Asteroid[]{
  if(a.r<=15) return [];
  return [0,1].map(()=>({x:a.x,y:a.y,r:a.r*0.55,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,pts:makePts(a.r*0.55,7)}));
}

export default function Asteroids() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({ship:{x:W/2,y:H/2,angle:0,vx:0,vy:0},asteroids:Array.from({length:4},()=>randAsteroid(2)) as Asteroid[],bullets:[] as Bullet[],score:0,lives:3,keys:{} as Record<string,boolean>,alive:true,started:false,invincible:0});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,lives:3,over:false,best:Number(localStorage.getItem('asteroids-best')||0)});

  useEffect(()=>{
    const dn=(e:KeyboardEvent)=>{state.current.keys[e.code]=true;if(['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(!state.current.started)state.current.started=true;}};
    const up=(e:KeyboardEvent)=>{state.current.keys[e.code]=false;};
    window.addEventListener('keydown',dn);window.addEventListener('keyup',up);
    const canvas=canvasRef.current!;const ctx=canvas.getContext('2d')!;
    let lastShot=0;
    const tick=(t:number)=>{
      const s=state.current;
      if(s.started&&s.alive){
        if(s.keys['ArrowLeft']) s.ship.angle-=0.05;
        if(s.keys['ArrowRight']) s.ship.angle+=0.05;
        if(s.keys['ArrowUp']){s.ship.vx+=Math.cos(s.ship.angle)*0.3;s.ship.vy+=Math.sin(s.ship.angle)*0.3;}
        s.ship.vx*=0.98;s.ship.vy*=0.98;
        s.ship.x=(s.ship.x+s.ship.vx+W)%W;s.ship.y=(s.ship.y+s.ship.vy+H)%H;
        if(s.keys['Space']&&t-lastShot>200){lastShot=t;s.bullets.push({x:s.ship.x+Math.cos(s.ship.angle)*20,y:s.ship.y+Math.sin(s.ship.angle)*20,vx:Math.cos(s.ship.angle)*10+s.ship.vx,vy:Math.sin(s.ship.angle)*10+s.ship.vy,life:60});}
        s.bullets=s.bullets.map(b=>({...b,x:(b.x+b.vx+W)%W,y:(b.y+b.vy+H)%H,life:b.life-1})).filter(b=>b.life>0);
        s.asteroids=s.asteroids.map(a=>({...a,x:(a.x+a.vx+W)%W,y:(a.y+a.vy+H)%H}));
        const newAsteroids:Asteroid[]=[]; const deadBullets=new Set<number>();
        s.asteroids.forEach(a=>{
          const hit=s.bullets.findIndex(b=>Math.hypot(b.x-a.x,b.y-a.y)<a.r);
          if(hit>=0){deadBullets.add(hit);s.score+=a.r>30?10:a.r>15?20:50;setDisplay(d=>({...d,score:s.score}));splitAsteroid(a).forEach(na=>newAsteroids.push(na));}
          else newAsteroids.push(a);
        });
        s.bullets=s.bullets.filter((_,i)=>!deadBullets.has(i));
        s.asteroids=newAsteroids;
        if(!s.asteroids.length) s.asteroids=Array.from({length:4+Math.floor(s.score/200)},()=>randAsteroid(2));
        if(s.invincible<=0){for(const a of s.asteroids){if(Math.hypot(s.ship.x-a.x,s.ship.y-a.y)<a.r+12){s.lives--;s.invincible=120;if(s.lives<=0){s.alive=false;const best=Number(localStorage.getItem('asteroids-best')||0);if(s.score>best)localStorage.setItem('asteroids-best',String(s.score));const u=getSession();if(u)submitScore('asteroids',u.username,u.avatar,s.score);setDisplay(d=>({...d,lives:0,over:true,best:Math.max(d.best,s.score)}));}else setDisplay(d=>({...d,lives:s.lives}));break;}}}
        else s.invincible--;
      }
      ctx.fillStyle='#0f172a';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(255,255,255,0.3)';
      for(let i=0;i<50;i++){ctx.fillRect((i*73+17)%W,(i*37+91)%H,1,1);}
      s.asteroids.forEach(a=>{ctx.strokeStyle='#7dd3fc';ctx.lineWidth=2;ctx.beginPath();a.pts.forEach((p,i)=>{if(i===0)ctx.moveTo(a.x+p.x,a.y+p.y);else ctx.lineTo(a.x+p.x,a.y+p.y);});ctx.closePath();ctx.stroke();});
      s.bullets.forEach(b=>{ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();});
      if(s.alive&&(s.invincible===0||Math.floor(s.invincible/5)%2===0)){
        ctx.save();ctx.translate(s.ship.x,s.ship.y);ctx.rotate(s.ship.angle);
        ctx.strokeStyle='#818cf8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-12,10);ctx.lineTo(-6,0);ctx.lineTo(-12,-10);ctx.closePath();ctx.stroke();
        if(s.keys['ArrowUp']){ctx.strokeStyle='#f97316';ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-18+(Math.random()-0.5)*8,0);ctx.stroke();}
        ctx.restore();
      }
      ctx.fillStyle='#e2e8f0';ctx.font='bold 16px Outfit,sans-serif';ctx.textAlign='right';ctx.fillText(`${s.score}`,W-10,25);
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 17px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Arrow keys to fly · Space to shoot',W/2,H/2);}
      if(!s.alive){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ef4444';ctx.font='bold 24px Outfit,sans-serif';ctx.textAlign='center';ctx.fillText('Game Over',W/2,H/2-10);ctx.fillStyle='#e2e8f0';ctx.font='16px Outfit,sans-serif';ctx.fillText('Click to restart',W/2,H/2+20);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(rafRef.current);window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[]);

  const restart=()=>{state.current={ship:{x:W/2,y:H/2,angle:0,vx:0,vy:0},asteroids:Array.from({length:4},()=>randAsteroid(2)),bullets:[],score:0,lives:3,keys:{},alive:true,started:false,invincible:0};setDisplay(d=>({...d,score:0,lives:3,over:false}));};
  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Asteroids" emoji="🚀" gameId="asteroids" onReset={restart} scores={[{label:'Score',value:display.score,color:'#7dd3fc'},{label:'Lives',value:'🚀'.repeat(Math.max(0,display.lives))||'💀',color:'#818cf8'},{label:'Best',value:display.best,color:'#fbbf24'}]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={()=>{if(!state.current.alive)restart();else if(!state.current.started)state.current.started=true;}} style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block',cursor:'crosshair'}} />
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.78rem'}}>← → to rotate · ↑ to thrust · Space to fire</div>
    </GameShell>
  );
}
