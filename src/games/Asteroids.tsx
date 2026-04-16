import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=400,H=400;
type V={x:number,y:number};
type Rock={x:number,y:number,vx:number,vy:number,r:number,pts:V[]};
type Bullet={x:number,y:number,vx:number,vy:number,life:number};

function makeRock(x:number,y:number,r:number):Rock{
  const pts=Array(8).fill(0).map((_,i)=>{const a=i/8*Math.PI*2;const rr=r*(0.7+Math.random()*0.3);return{x:Math.cos(a)*rr,y:Math.sin(a)*rr};});
  return{x,y,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,r,pts};
}

export default function Asteroids(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const state=useRef({ship:{x:W/2,y:H/2,angle:0,vx:0,vy:0},rocks:[] as Rock[],bullets:[] as Bullet[],score:0,lives:3,alive:true,started:false,keys:{} as Record<string,boolean>,frame:0});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,lives:3,alive:true,best:Number(localStorage.getItem('ast-best')||0)});

  const restart=()=>{
    const rocks=[makeRock(50,50,40),makeRock(350,50,40),makeRock(50,350,40),makeRock(350,350,40)];
    state.current={ship:{x:W/2,y:H/2,angle:0,vx:0,vy:0},rocks,bullets:[],score:0,lives:3,alive:true,started:true,keys:{},frame:0};
    setDisplay(d=>({...d,score:0,lives:3,alive:true}));
  };

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{state.current.keys[e.key]=true;if(!state.current.started)restart();};
    const up=(e:KeyboardEvent)=>{state.current.keys[e.key]=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current!;const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;const k=s.keys;
      if(s.started&&s.alive){
        if(k['ArrowLeft']||k['a'])s.ship.angle-=0.05;
        if(k['ArrowRight']||k['d'])s.ship.angle+=0.05;
        if(k['ArrowUp']||k['w']){s.ship.vx+=Math.cos(s.ship.angle)*0.2;s.ship.vy+=Math.sin(s.ship.angle)*0.2;}
        s.ship.vx*=0.98;s.ship.vy*=0.98;
        s.ship.x=(s.ship.x+s.ship.vx+W)%W;s.ship.y=(s.ship.y+s.ship.vy+H)%H;
        if((k[' ']||k['ArrowUp'])&&s.frame%10===0){
          s.bullets.push({x:s.ship.x+Math.cos(s.ship.angle)*14,y:s.ship.y+Math.sin(s.ship.angle)*14,vx:Math.cos(s.ship.angle)*8,vy:Math.sin(s.ship.angle)*8,life:60});
        }
        s.bullets=s.bullets.map(b=>({...b,x:(b.x+b.vx+W)%W,y:(b.y+b.vy+H)%H,life:b.life-1})).filter(b=>b.life>0);
        s.rocks=s.rocks.map(r=>({...r,x:(r.x+r.vx+W)%W,y:(r.y+r.vy+H)%H}));
        // Bullet-rock collision
        const newRocks:Rock[]=[]; let scored=false;
        for(const rock of s.rocks){
          let hit=false;
          for(let i=s.bullets.length-1;i>=0;i--){
            const b=s.bullets[i];
            if(Math.hypot(b.x-rock.x,b.y-rock.y)<rock.r){hit=true;s.bullets.splice(i,1);s.score+=rock.r>20?10:rock.r>10?20:30;scored=true;break;}
          }
          if(hit&&rock.r>12){newRocks.push(makeRock(rock.x,rock.y,rock.r/2));newRocks.push(makeRock(rock.x,rock.y,rock.r/2));}
          else if(!hit)newRocks.push(rock);
        }
        s.rocks=newRocks;
        if(scored)setDisplay(d=>({...d,score:s.score}));
        if(!s.rocks.length){s.rocks=[makeRock(50,50,40),makeRock(350,50,40),makeRock(50,350,40),makeRock(350,350,40)];}
        // Ship-rock collision
        for(const rock of s.rocks){
          if(Math.hypot(s.ship.x-rock.x,s.ship.y-rock.y)<rock.r+10){
            s.lives--;s.ship={x:W/2,y:H/2,angle:0,vx:0,vy:0};
            if(s.lives<=0){s.alive=false;const best=Number(localStorage.getItem('ast-best')||0);if(s.score>best)localStorage.setItem('ast-best',String(s.score));setDisplay(d=>({...d,lives:0,alive:false,best:Math.max(d.best,s.score)}));}
            else setDisplay(d=>({...d,lives:s.lives}));
            break;
          }
        }
        s.frame++;
      }
      ctx.fillStyle='#0f172a';ctx.fillRect(0,0,W,H);
      // Stars
      ctx.fillStyle='#1e293b';
      for(let i=0;i<50;i++){ctx.fillRect((i*37)%W,(i*53)%H,1,1);}
      // Rocks
      ctx.strokeStyle='#94a3b8';ctx.lineWidth=2;
      for(const rock of s.rocks){
        ctx.beginPath();ctx.moveTo(rock.x+rock.pts[0].x,rock.y+rock.pts[0].y);
        rock.pts.forEach(p=>ctx.lineTo(rock.x+p.x,rock.y+p.y));ctx.closePath();ctx.stroke();
      }
      // Bullets
      ctx.fillStyle='#fbbf24';
      for(const b of s.bullets){ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();}
      // Ship
      if(s.alive){
        ctx.save();ctx.translate(s.ship.x,s.ship.y);ctx.rotate(s.ship.angle);
        ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-10,8);ctx.lineTo(-6,0);ctx.lineTo(-10,-8);ctx.closePath();ctx.stroke();
        ctx.restore();
      }
      if(!s.started){
        ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#fff';ctx.font='bold 18px Outfit,sans-serif';ctx.textAlign='center';
        ctx.fillText('Press any key to start',W/2,H/2);
        ctx.font='13px Outfit,sans-serif';ctx.fillText('Arrow keys / WASD to move, Space to shoot',W/2,H/2+26);
      }
      if(!s.alive){
        ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#ef4444';ctx.font='bold 22px Outfit,sans-serif';ctx.textAlign='center';
        ctx.fillText('Game Over!',W/2,H/2-14);
        ctx.fillStyle='#fff';ctx.font='16px Outfit,sans-serif';
        ctx.fillText(`Score: ${s.score}`,W/2,H/2+14);
        ctx.fillText('Press any key to restart',W/2,H/2+40);
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return(
    <GameShell title="Asteroids" emoji="🚀" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#7dd3fc'},
      {label:'Lives',value:display.lives,color:'#22c55e'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={restart}
          style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block'}}/>
      </div>
      <div style={{textAlign:'center',marginTop:'8px',color:'#64748b',fontSize:'0.78rem'}}>Arrow keys/WASD to move · Space to shoot</div>
    </GameShell>
  );
}
