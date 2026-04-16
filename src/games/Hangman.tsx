import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const WORDS_BY_CAT: Record<string,string[]> = {
  Animals: ['ELEPHANT','GIRAFFE','PENGUIN','DOLPHIN','CROCODILE','BUTTERFLY','CHEETAH','KANGAROO','OCTOPUS','FLAMINGO'],
  Countries: ['AUSTRALIA','BRAZIL','CANADA','DENMARK','ETHIOPIA','FINLAND','GERMANY','HUNGARY','ICELAND','JAMAICA'],
  Food: ['SPAGHETTI','AVOCADO','BROCCOLI','CHOCOLATE','CINNAMON','DUMPLING','ESPRESSO','FOCACCIA','GUACAMOLE','HUMMUS'],
  Tech: ['ALGORITHM','BLOCKCHAIN','DATABASE','ENCRYPTION','FIREWALL','JAVASCRIPT','KUBERNETES','LATENCY','MIDDLEWARE','NETWORK'],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_WRONG = 6;

function HangmanSVG({ wrong }: { wrong: number }) {
  return (
    <svg width="120" height="130" viewBox="0 0 120 130" style={{ margin:'0 auto', display:'block' }}>
      {/* Gallows */}
      <line x1="10" y1="125" x2="110" y2="125" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
      <line x1="30" y1="125" x2="30" y2="10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
      <line x1="30" y1="10" x2="70" y2="10" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
      <line x1="70" y1="10" x2="70" y2="25" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
      {/* Head */}
      {wrong>0&&<circle cx="70" cy="35" r="10" stroke="#ef4444" strokeWidth="2.5" fill="none"/>}
      {/* Body */}
      {wrong>1&&<line x1="70" y1="45" x2="70" y2="80" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* Left arm */}
      {wrong>2&&<line x1="70" y1="55" x2="50" y2="70" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* Right arm */}
      {wrong>3&&<line x1="70" y1="55" x2="90" y2="70" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* Left leg */}
      {wrong>4&&<line x1="70" y1="80" x2="50" y2="100" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* Right leg */}
      {wrong>5&&<line x1="70" y1="80" x2="90" y2="100" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>}
    </svg>
  );
}

export default function Hangman() {
  const [cat, setCat] = useState('Animals');
  const [word, setWord] = useState(() => { const w = WORDS_BY_CAT['Animals']; return w[Math.floor(Math.random()*w.length)]; });
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const wrong = [...guessed].filter(l => !word.includes(l)).length;
  const won = word.split('').every(l => guessed.has(l));
  const lost = wrong >= MAX_WRONG;
  const over = won || lost;

  const guess = (letter: string) => {
    if (over || guessed.has(letter)) return;
    const ng = new Set(guessed); ng.add(letter);
    setGuessed(ng);
    const newWrong = [...ng].filter(l => !word.includes(l)).length;
    const newWon = word.split('').every(l => ng.has(l));
    if (newWon) setWins(w=>w+1);
    else if (newWrong >= MAX_WRONG) setLosses(l=>l+1);
  };

  const reset = () => {
    const w = WORDS_BY_CAT[cat];
    setWord(w[Math.floor(Math.random()*w.length)]);
    setGuessed(new Set());
  };

  return (
    <GameShell title="Hangman" emoji="🪢" onReset={reset} scores={[
      { label:'Wins', value:wins, color:'#22c55e' },
      { label:'Losses', value:losses, color:'#ef4444' },
    ]}>
      {/* Category */}
      <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'14px', flexWrap:'wrap' }}>
        {Object.keys(WORDS_BY_CAT).map(c => (
          <button key={c} onClick={() => { setCat(c); const w=WORDS_BY_CAT[c]; setWord(w[Math.floor(Math.random()*w.length)]); setGuessed(new Set()); }}
            style={{ padding:'4px 12px', borderRadius:'20px', border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.75rem', fontFamily:'Outfit,sans-serif',
              borderColor:cat===c?'#f87171':'#334155', background:cat===c?'#f8717122':'transparent', color:cat===c?'#f87171':'#94a3b8' }}
          >{c}</button>
        ))}
      </div>

      <HangmanSVG wrong={wrong} />

      <div style={{ textAlign:'center', marginBottom:'6px', color:'#94a3b8', fontSize:'0.78rem', fontWeight:600 }}>
        Category: {cat} · {MAX_WRONG - wrong} lives left
      </div>

      {/* Word */}
      <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'16px', flexWrap:'wrap' }}>
        {word.split('').map((l,i) => (
          <div key={i} style={{ width:32, textAlign:'center', borderBottom:`2px solid ${guessed.has(l)?'#22c55e':'#475569'}`, paddingBottom:'4px', fontWeight:800, fontSize:'1.2rem', color:guessed.has(l)?'#22c55e':'transparent' }}>
            {guessed.has(l) ? l : '_'}
          </div>
        ))}
      </div>

      {over && (
        <div style={{ textAlign:'center', marginBottom:'14px', color:won?'#22c55e':'#ef4444', fontWeight:800, fontSize:'1rem' }}>
          {won ? '🎉 Correct!' : `💀 It was: ${word}`}
        </div>
      )}

      {/* Keyboard */}
      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', maxWidth:'340px', margin:'0 auto' }}>
        {ALPHABET.map(l => {
          const isWrong = guessed.has(l) && !word.includes(l);
          const isCorrect = guessed.has(l) && word.includes(l);
          return (
            <button key={l} onClick={() => guess(l)} disabled={guessed.has(l)||over}
              style={{ width:32, height:32, borderRadius:'8px', border:'none', cursor:guessed.has(l)||over?'default':'pointer',
                background:isCorrect?'#22c55e22':isWrong?'#1e293b':'#334155',
                color:isCorrect?'#22c55e':isWrong?'#475569':'#e2e8f0',
                fontWeight:700, fontSize:'0.82rem', fontFamily:'Outfit,sans-serif',
                opacity:isWrong?0.4:1, textDecoration:isWrong?'line-through':'none',
              }}
            >{l}</button>
          );
        })}
      </div>
    </GameShell>
  );
}
