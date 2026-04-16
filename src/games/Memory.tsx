import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const EMOJIS = ['🦊','🐺','🐻','🐯','🦁','🐸','🐼','🦄','🐲','🦋','🌸','⭐','🔥','💎','🎵','🍕'];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default function Memory() {
  const [size, setSize] = useState(4);
  const [cards, setCards] = useState<{id:number;emoji:string;matched:boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [mode, setMode] = useState<'1p'|'2p'>('1p');
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0,0]);
  const [locked, setLocked] = useState(false);

  const init = (s: number) => {
    const count = (s * s) / 2;
    const emojis = shuffle(EMOJIS).slice(0, count);
    setCards(shuffle([...emojis,...emojis].map((e,i) => ({ id:i, emoji:e, matched:false }))));
    setFlipped([]); setMoves(0); setMatches(0); setTurn(0); setScores([0,0]); setLocked(false);
  };

  useEffect(() => { init(size); }, [size]);

  const flip = (id: number) => {
    if (locked || flipped.length === 2) return;
    if (flipped.includes(id)) return;
    if (cards[id].matched) return;
    const nf = [...flipped, id];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m+1);
      setLocked(true);
      setTimeout(() => {
        const [a,b] = nf;
        if (cards[a].emoji === cards[b].emoji) {
          setCards(prev => prev.map((c,i) => i===a||i===b ? {...c,matched:true} : c));
          setMatches(m => m+1);
          if (mode === '2p') setScores(s => { const ns=[...s]; ns[turn]++; return ns; });
        } else {
          if (mode === '2p') setTurn(t => 1-t);
        }
        setFlipped([]); setLocked(false);
      }, 800);
    }
  };

  const total = (size*size)/2;
  const won = matches === total;

  return (
    <GameShell title="Memory Match" emoji="🃏" onReset={() => init(size)} scores={
      mode === '2p' ? [{ label:'P1', value:scores[0], color:'#818cf8' },{ label:'P2', value:scores[1], color:'#f472b6' }]
      : [{ label:'Moves', value:moves, color:'#e879f9' },{ label:'Pairs', value:`${matches}/${total}`, color:'#22c55e' }]
    }>
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'12px', flexWrap:'wrap' }}>
        {([['4x4',4],['6x6',6]] as [string,number][]).map(([label,s]) => (
          <button key={s} onClick={() => { setSize(s); }}
            style={{ padding:'5px 12px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif',
              borderColor:size===s?'#e879f9':'#334155', background:size===s?'#e879f922':'transparent', color:size===s?'#e879f9':'#94a3b8' }}
          >{label}</button>
        ))}
        {(['1p','2p'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); init(size); }}
            style={{ padding:'5px 12px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#e879f9':'#334155', background:mode===m?'#e879f922':'transparent', color:mode===m?'#e879f9':'#94a3b8' }}
          >{m==='1p'?'Solo':'2 Player'}</button>
        ))}
      </div>
      {mode==='2p' && !won && <div style={{ textAlign:'center', marginBottom:'10px', color:'#e879f9', fontWeight:700 }}>Player {turn+1}'s turn</div>}
      {won && <div style={{ textAlign:'center', marginBottom:'10px', color:'#22c55e', fontWeight:800, fontSize:'1.1rem' }}>🎉 {mode==='2p' ? `Player ${scores[0]>scores[1]?1:2} Wins!` : `Done in ${moves} moves!`}</div>}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${size},1fr)`, gap:'8px', maxWidth: size===4?'280px':'380px', margin:'0 auto' }}>
        {cards.map((card,i) => {
          const isFlipped = flipped.includes(i) || card.matched;
          return (
            <motion.div key={card.id} onClick={() => flip(i)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ height: size===4?60:44, borderRadius:'10px', cursor:card.matched?'default':'pointer', perspective:600,
                background: isFlipped ? (card.matched?'#22c55e22':'#1e293b') : '#334155',
                border:`2px solid ${card.matched?'#22c55e':isFlipped?'#818cf8':'#475569'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: size===4?'1.6rem':'1.1rem',
                boxShadow: card.matched ? '0 0 10px #22c55e44' : 'none',
              }}
            >{isFlipped ? card.emoji : '?'}</motion.div>
          );
        })}
      </div>
    </GameShell>
  );
}
