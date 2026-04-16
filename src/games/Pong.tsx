import React, { useEffect, useRef, useState } from 'react';
import GameShell from '../components/GameShell';

const W=600,H=400,PAD_H=80,PAD_W=12,BALL=10,SPEED=4;

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ ball:{x:W/2,y:H/2,vx:SPEED,vy:SPEED}, p1:H/2-PAD_H/2, p2:H/2-PAD_H/2, s1:0, s2:0, running:false, keys:{} as Record<string,boolean> });
  const rafRef = useRef(0);
  const [scores, setScores] = useState({s1:0,s2:0});
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [started, setStarted] = useState(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const down = (e: KeyboardEvent) => { state.current.keys[e.key]=true; };
    const up = (e: KeyboardEvent) => { state.current.keys[e.key]=false; };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up);
    return () => { window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); };
  },[]);

  const reset = () => {
    const s = state.current;
    s.ball={x:W/2,y:H/2,vx:SPEED*(Math.random()>0.5?1:-1),vy:SPEED*(Math.random()>0.5?1:-1)};
    s.p1=H/2-PAD_H/2; s.p2=H/2-PAD_H/2; s.s1=0; s.s2=0;
    setScores({s1:0,s2:0}); setStarted(false);
  };

  const start = () => {
    setStarted(true);
    state.current.running=true;
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!;
    const tick=()=>{
      const s=state.current; const k=s.keys;
      // Move paddles
      if(k['w']||k['W']) s.p1=Math.max(0,s.p1-6);
      if(k['s']||k['S']) s.p1=Math.min(H-PAD_H,s.p1+6);
      if(modeRef.current==='local'){
        if(k['ArrowUp']) s.p2=Math.max(0,s.p2-6);
        if(k['ArrowDown']) s.p2=Math.min(H-PAD_H,s.p2+6);
      } else {
        // AI
        const center=s.p2+PAD_H/2;
        if(center<s.ball.y-10) s.p2=Math.min(H-PAD_H,s.p2+4.5);
        else if(center>s.ball.y+10) s.p2=Math.max(0,s.p2-4.5);
      }
      // Move ball
      s.ball.x+=s.ball.vx; s.ball.y+=s.ball.vy;
      // Wall bounce
      if(s.ball.y<=0||s.ball.y>=H-BALL) s.ball.vy*=-1;
      // Paddle bounce
      if(s.ball.x<=PAD_W+20&&s.ball.y>=s.p1&&s.ball.y<=s.p1+PAD_H) { s.ball.vx=Math.abs(s.ball.vx)*1.05; s.ball.vy+=(s.ball.y-(s.p1+PAD_H/2))*0.1; }
      if(s.ball.x>=W-PAD_W-20&&s.ball.y>=s.p2&&s.ball.y<=s.p2+PAD_H) { s.ball.vx=-Math.abs(s.ball.vx)*1.05; s.ball.vy+=(s.ball.y-(s.p2+PAD_H/2))*0.1; }
      // Score
      if(s.ball.x<0){ s.s2++; setScores({s1:s.s1,s2:s.s2}); s.ball={x:W/2,y:H/2,vx:SPEED,vy:SPEED*(Math.random()>0.5?1:-1)}; }
      if(s.ball.x>W){ s.s1++; setScores({s1:s.s1,s2:s.s2}); s.ball={x:W/2,y:H/2,vx:-SPEED,vy:SPEED*(Math.random()>0.5?1:-1)}; }
      // Draw
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
      ctx.setLineDash([10,10]); ctx.strokeStyle='#334155'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='#e2e8f0';
      ctx.fillRect(8,s.p1,PAD_W,PAD_H); ctx.fillRect(W-8-PAD_W,s.p2,PAD_W,PAD_H);
      ctx.beginPath(); ctx.arc(s.ball.x,s.ball.y,BALL/2,0,Math.PI*2); ctx.fill();
      ctx.font='bold 32px Outfit,sans-serif'; ctx.textAlign='center';
      ctx.fillText(String(s.s1),W/4,40); ctx.fillText(String(s.s2),3*W/4,40);
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  };

  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  const scale=Math.min(1,(window.innerWidth-32)/W);

  return (
    <GameShell title="Pong" emoji="🏓" onReset={()=>{cancelAnimationFrame(rafRef.current);reset();}} scores={[
      {label:mode==='ai'?'You':'P1',value:scores.s1,color:'#38bdf8'},
      {label:mode==='ai'?'AI':'P2',value:scores.s2,color:'#f472b6'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);cancelAnimationFrame(rafRef.current);reset();}}
            style={{padding:'6px 16px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.82rem',fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#38bdf8':'#334155',background:mode===m?'#38bdf822':'transparent',color:mode===m?'#38bdf8':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      <div style={{transform:`scale(${scale})`,transformOrigin:'top center',width:W,margin:'0 auto'}}>
        <canvas ref={canvasRef} width={W} height={H} style={{borderRadius:'12px',border:'2px solid #1e293b',display:'block'}} />
      </div>
      {!started?(
        <div style={{textAlign:'center',marginTop:'12px'}}>
          <div style={{color:'#64748b',fontSize:'0.82rem',marginBottom:'8px'}}>{mode==='ai'?'W/S to move':'W/S and ↑/↓ to move'}</div>
          <button onClick={start} style={{background:'#38bdf8',border:'none',borderRadius:'12px',padding:'10px 28px',color:'#0f172a',fontWeight:800,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Start Game</button>
        </div>
      ):(
        <div style={{textAlign:'center',marginTop:'8px',color:'#475569',fontSize:'0.78rem'}}>{mode==='ai'?'W/S to move':'W/S and ↑/↓ to move'}</div>
      )}
    </GameShell>
  );
}
