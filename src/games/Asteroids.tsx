import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=480,H=480;
type Vec={x:number;y:number};
const wrap=(v:Vec)=>({x:(v.x+W)%W,y:(v.y+H)%H});
const dist=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y);

export default function Asteroids() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const keys=useRef<Record<string,boolean>>({});
  const state=useRef({ship:{pos:{x:W/2,y:H/2},vel:{x:0,y:0},angle:0,alive:true},bullets:[] as {pos:Vec,vel:Vec,life:number}[],rocks:[] as {pos:Vec,vel:Vec,r:number,angle:number}[],score:0,frame:0,started:false});
  const rafRef=useRef(0);
  const [display,setDisplay]=useState({score:0,best:Number(localStorage.getItem('asteroids-best')||0),alive:true});

  const spawnRocks=(n:number,avoid:Vec)=>Array(n).fill(null).map(()=>{
    let pos:Vec;
    do{pos={x:Math.random()*W,y:Math.random()*H};}while(dist(pos,avoid)<100);
    const angle=Math.random()*Math.PI*2;
    return{pos,vel:{x:Math.cos(angle)*(1+Math.random()*1.5),y:Math.sin(angle)*(1+Math.random()*1.5)},r:30+Math.random()*20,angle:0};
  });

  const restart=()=>{
    const ship={pos:{x:W/2,y:H/2},vel:{x:0,y:0},angle:0,alive:true};
    state.current={ship,bullets:[],rocks:spawnRocks(5,ship.pos),score:0,frame:0,started:true};
    setDisplay(d=>({...d,score:0,alive:true}));
  };

  useEffect(()=>{
    state.current.rocks=spawnRocks(5,{x:W/2,y:H/2});
    const canvas=canvasRef.current!;const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current;
      if(s.started&&s.ship.alive){
        s.frame++;
        const sh=s.ship;
        if(keys.current['ArrowLeft']||keys.current['a'])sh.angle-=0.06;
        if(keys.current['ArrowRight']||keys.current['d'])sh.angle+=0.06;
        if(keys.current['ArrowUp']||keys.current['w']){sh.vel.x+=Math.sin(sh.angle)*0.25;sh.vel.y-=Math.cos(sh.angle)*0.25;}
        sh.vel.x*=0.98;sh.vel.y*=0.98;
        sh.pos=wrap({x:sh.pos.x+sh.vel.x,y:sh.pos.y+sh.vel.y});
        if(keys.current[' ']&&s.frame%12===0){s.bullets.push({pos:{...sh.pos},vel:{x:sh.vel.x+Math.sin(sh.angle)*8,y:sh.vel.y-Math.cos(sh.angle)*8},life:60});}
        s.bullets=s.bullets.map(b=>({...b,pos:wrap({x:b.pos.x+b.vel.x,y:b.pos.y+b.vel.y}),life:b.life-1})).filter(b=>b.life>0);
        s.rocks=s.rocks.map(r=>({...r,pos:wrap({x:r.pos.x+r.vel.x,y:r.pos.y+r.vel.y}),angle:r.angle+0.02}));
        // Bullet-rock
        const newRocks:(typeof s.rocks[0])[][]=[...s.rocks.map(r=>[r])];
        let scoreAdd=0;
        s.bullets=s.bullets.filter(b=>{
          for(let i=0;i<newRocks.length;i++){
            if(newRocks[i].length===1&&dist(b.pos,newRocks[i][0].pos)<newRocks[i][0].r){
              const r=newRocks[i][0];
              scoreAdd+=r.r>25?10:20;
              if(r.r>18){const a=Math.random()*Math.PI*2;newRocks[i]=[{...r,r:r.r*0.55,vel:{x:Math.cos(a)*2,y:Math.sin(a)*2}},{...r,r:r.r*0.55,vel:{x:-Math.cos(a)*2,y:-Math.sin(a)*2}}] as (typeof s.rocks[0])[];}
              else newRocks.splice(i,1);
              return false;
            }
          }
          return true;
        });
        s.rocks=newRocks.flat();
        if(scoreAdd){s.score+=scoreAdd;const best=Number(localStorage.getItem('asteroids-best')||0);if(s.score>best)localStorage.setItem('asteroids-best',String(s.score));setDisplay(d=>({...d,score:s.score,best:Math.max(d.best,s.score)}));}
        if(s.rocks.length===0)s.rocks=spawnRocks(6,sh.pos);
        // Ship-rock collision
        for(const r of s.rocks){if(dist(sh.pos,r.pos)<r.r-8){sh.alive=false;setDisplay(d=>({...d,alive:false}));break;}}
      }
      // Draw
      ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
      // Stars
      ctx.fillStyle='#ffffff22';
      for(let i=0;i<50;i++){ctx.fillRect((i*73)%W,(i*47)%H,1,1);}
      // Rocks
      for(const r of s.rocks){
        ctx.strokeStyle='#94a3b8';ctx.lineWidth=2;
        ctx.beginPath();
        for(let i=0;i<8;i++){const a=r.angle+i*Math.PI/4;const rd=r.r*(0.8+Math.sin(i*2.3)*0.2);const x=r.pos.x+Math.cos(a)*rd;const y=r.pos.y+Math.sin(a)*rd;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.closePath();ctx.stroke();
      }
      // Bullets
      ctx.fillStyle='#fbbf24';
      for(const b of s.bullets){ctx.beginPath();ctx.arc(b.pos.x,b.pos.y,3,0,Math.PI*2);ctx.fill();}
      // Ship
      if(s.ship.alive){
        const sh=s.ship;
        ctx.strokeStyle='#818cf8';ctx.lineWidth=2;
        ctx.save();ctx.translate(sh.pos.x,sh.pos.y);ctx.rotate(sh.angle);
        ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,12);ctx.lineTo(-10,12);ctx.closePath();ctx.stroke();
        if(keys.current['ArrowUp']||keys.current['w']){ctx.strokeStyle='#f97316';ctx.beginPath();ctx.moveTo(-6,12);ctx.lineTo(0,22);ctx.lineTo(6,12);ctx.stroke();}
        ctx.restore();
      }
      if(!s.started){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e2e8f0';ctx.font='bold 20px Outfit';ctx.textAlign='center';ctx.fillText('Arrows/WASD to move',W/2,H/2-10);ctx.fillText('Space to shoot',W/2,H/2+20);}
      if(!s.ship.alive){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ef4444';ctx.font='bold 24px Outfit';ctx.textAlign='center';ctx.fillText('Ship Destroyed!',W/2,H/2-10);ctx.fillStyle='#94a3b8';ctx.font='16px Outfit';ctx.fillText('Click to restart',W/2,H/2+20);}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const d=(e:KeyboardEvent)=>{keys.current[e.key]=true;if(e.key===' ')e.preventDefault();};
    const u=(e:KeyboardEvent)=>{keys.current[e.key]=false;};
    window.addEventListener('keydown',d);window.addEventListener('keyup',u);
    return()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u);};
  },[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Asteroids" emoji="🚀" onReset={restart} scores={[
      {label:'Score',value:display.score,color:'#7dd3fc'},
      {label:'Best',value:display.best,color:'#fbbf24'},
    ]}>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} onClick={()=>{if(!state.current.started)restart();else if(!state.current.ship.alive)restart();}}
          style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block',cursor:'crosshair'}} />
      </div>
      {/* Mobile controls */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',maxWidth:300,margin:'12px auto 0'}}>
        {['↶','','','','↷'].map((b,i)=>(
          <button key={i}
            onTouchStart={()=>{if(b==='↶')keys.current['ArrowLeft']=true;if(b==='↷')keys.current['ArrowRight']=true;}}
            onTouchEnd={()=>{keys.current['ArrowLeft']=false;keys.current['ArrowRight']=false;}}
            style={{height:44,background:b?'#1e293b':'transparent',border:b?'1px solid #334155':'none',borderRadius:8,cursor:b?'pointer':'default',fontSize:'1.2rem',color:'#e2e8f0'}}
          >{b}</button>
        ))}
        {['','','','','',' '].map((b,i)=>(
          <button key={i}
            onTouchStart={()=>{if(i===2)keys.current['ArrowUp']=true;if(i===5)keys.current[' ']=true;}}
            onTouchEnd={()=>{keys.current['ArrowUp']=false;keys.current[' ']=false;}}
            style={{height:44,background:i===2||i===5?'#1e293b':'transparent',border:i===2||i===5?'1px solid #334155':'none',borderRadius:8,cursor:i===2||i===5?'pointer':'default',fontSize:i===2?'1.2rem':'0.8rem',color:'#e2e8f0',gridColumn:i===5?'span 5':'auto'}}
          >{i===2?'↑':i===5?'🔫 Fire':''}</button>
        ))}
      </div>
    </GameShell>
  );
}
