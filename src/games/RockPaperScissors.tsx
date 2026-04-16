import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../components/GameShell';

const CHOICES = [{ id:'rock',emoji:'🪨',beats:'scissors' },{ id:'paper',emoji:'📄',beats:'rock' },{ id:'scissors',emoji:'✂️',beats:'paper' }];
const AI_CHOICES = CHOICES.map(c => c.id);

export default function RockPaperScissors() {
  const [scores, setScores] = useState({ wins:0, losses:0, draws:0 });
  const [round, setRound] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<string|null>(null);
  const [aiChoice, setAiChoice] = useState<string|null>(null);
  const [result, setResult] = useState<'win'|'loss'|'draw'|null>(null);
  const [mode, setMode] = useState<'ai'|'local'>('ai');
  const [waitingP2, setWaitingP2] = useState(false);
  const [p2Choice, setP2Choice] = useState<string|null>(null);
  const [history, setHistory] = useState<{p:string;a:string;r:string}[]>([]);

  const play = (choice: string) => {
    if (mode === 'ai') {
      const ai = AI_CHOICES[Math.floor(Math.random()*3)];
      const pc = CHOICES.find(c=>c.id===choice)!;
      const r = pc.beats===ai?'win':ai===CHOICES.find(c=>c.id===choice)?.beats?'loss':'draw';
      setPlayerChoice(choice); setAiChoice(ai); setResult(r as any);
      setScores(s=>({...s,[r==='win'?'wins':r==='loss'?'losses':'draws']:s[r==='win'?'wins':r==='loss'?'losses':'draws']+1}));
      setHistory(h=>[{p:choice,a:ai,r},...h.slice(0,9)]);
      setRound(n=>n+1);
    } else {
      if (!waitingP2) { setPlayerChoice(choice); setWaitingP2(true); }
      else {
        const p1 = playerChoice!; const p2 = choice;
        const pc1 = CHOICES.find(c=>c.id===p1)!;
        const r = pc1.beats===p2?'P1 Wins!':CHOICES.find(c=>c.id===p2)?.beats===p1?'P2 Wins!':'Draw!';
        setP2Choice(choice); setResult(r as any); setWaitingP2(false);
        setRound(n=>n+1);
      }
    }
  };

  const reset = () => { setPlayerChoice(null); setAiChoice(null); setResult(null); setWaitingP2(false); setP2Choice(null); };

  const resultColor = result === 'win' ? '#22c55e' : result === 'loss' ? '#ef4444' : result === 'draw' ? '#f59e0b' : '#e2e8f0';
  const resultText = result === 'win' ? '🎉 You Win!' : result === 'loss' ? '😞 You Lose!' : result === 'draw' ? '🤝 Draw!' : result;

  return (
    <GameShell title="Rock Paper Scissors" emoji="✂️" onReset={() => { reset(); setScores({wins:0,losses:0,draws:0}); setHistory([]); setRound(0); }} scores={[
      { label:'Wins', value:scores.wins, color:'#22c55e' },
      { label:'Losses', value:scores.losses, color:'#ef4444' },
      { label:'Draws', value:scores.draws, color:'#f59e0b' },
    ]}>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'20px' }}>
        {(['ai','local'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            style={{ padding:'6px 16px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#34d399':'#334155', background:mode===m?'#34d39922':'transparent', color:mode===m?'#34d399':'#94a3b8' }}
          >{m==='ai'?'🤖 vs AI':'👥 2 Player'}</button>
        ))}
      </div>

      {mode==='local' && waitingP2 && (
        <div style={{ textAlign:'center', marginBottom:'12px', color:'#f59e0b', fontWeight:700 }}>P1 chose — now P2 pick!</div>
      )}
      {mode==='local' && !waitingP2 && !result && (
        <div style={{ textAlign:'center', marginBottom:'12px', color:'#94a3b8', fontWeight:700 }}>Player 1, choose!</div>
      )}

      {/* Choices */}
      <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginBottom:'24px' }}>
        {CHOICES.map(c => (
          <motion.button key={c.id} onClick={() => play(c.id)}
            whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
            style={{ width:80, height:80, borderRadius:'50%', border:`3px solid ${playerChoice===c.id?'#34d399':'#334155'}`, background:playerChoice===c.id?'#34d39922':'#1e293b', cursor:'pointer', fontSize:'2rem', transition:'border-color 0.2s' }}
          >{c.emoji}</motion.button>
        ))}
      </div>

      {/* Battle display */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            style={{ textAlign:'center', marginBottom:'16px' }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', marginBottom:'12px' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'3rem' }}>{CHOICES.find(c=>c.id===playerChoice)?.emoji}</div>
                <div style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:700 }}>{mode==='ai'?'YOU':'P1'}</div>
              </div>
              <div style={{ color:'#475569', fontWeight:800, fontSize:'1.2rem' }}>VS</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'3rem' }}>{CHOICES.find(c=>c.id===(mode==='ai'?aiChoice:p2Choice))?.emoji}</div>
                <div style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:700 }}>{mode==='ai'?'AI':'P2'}</div>
              </div>
            </div>
            <div style={{ color:resultColor, fontWeight:900, fontSize:'1.3rem', marginBottom:'12px' }}>
              {mode==='ai' ? resultText : result}
            </div>
            <button onClick={reset} style={{ background:'#34d39922', border:'2px solid #34d399', borderRadius:'12px', padding:'8px 20px', color:'#34d399', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && mode==='ai' && (
        <div style={{ marginTop:'12px' }}>
          <div style={{ color:'#475569', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', marginBottom:'6px' }}>History</div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {history.map((h,i) => (
              <div key={i} style={{ background:'#1e293b', borderRadius:'8px', padding:'4px 8px', fontSize:'0.75rem', color:h.r==='win'?'#22c55e':h.r==='loss'?'#ef4444':'#f59e0b', fontWeight:700 }}>
                {CHOICES.find(c=>c.id===h.p)?.emoji} vs {CHOICES.find(c=>c.id===h.a)?.emoji}
              </div>
            ))}
          </div>
        </div>
      )}
    </GameShell>
  );
}
