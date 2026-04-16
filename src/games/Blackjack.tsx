import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
type Card = { rank: string; suit: string };

function makeDeck(): Card[] {
  return SUITS.flatMap(s => RANKS.map(r => ({ rank:r, suit:s }))).sort(() => Math.random()-0.5);
}

function value(cards: Card[]): number {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11; }
    else if (['J','Q','K'].includes(c.rank)) total += 10;
    else total += Number(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function CardView({ card, hidden }: { card: Card; hidden?: boolean }) {
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <motion.div initial={{ scale:0, rotate:-15 }} animate={{ scale:1, rotate:0 }} transition={{ type:'spring', stiffness:300, damping:20 }}
      style={{ width:56, height:80, background: hidden ? '#1e40af' : '#fff', borderRadius:'8px', border:'2px solid #334155',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontSize: hidden ? '1.5rem' : '1rem', fontWeight:800, color: hidden ? '#fff' : red?'#ef4444':'#1e293b',
        boxShadow:'0 4px 12px rgba(0,0,0,0.3)', flexShrink:0,
      }}
    >{hidden ? '🂠' : <>{card.rank}<br/>{card.suit}</>}</motion.div>
  );
}

export default function Blackjack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'bet'|'play'|'done'>('bet');
  const [chips, setChips] = useState(1000);
  const [bet, setBet] = useState(50);
  const [result, setResult] = useState('');
  const [dealerRevealed, setDealerRevealed] = useState(false);

  const deal = () => {
    if (bet > chips) return;
    const d = makeDeck();
    const p = [d.pop()!, d.pop()!];
    const dl = [d.pop()!, d.pop()!];
    setDeck(d); setPlayer(p); setDealer(dl);
    setPhase('play'); setDealerRevealed(false); setResult('');
    if (value(p) === 21) { finish(p, dl, d, true); }
  };

  const finish = (p: Card[], dl: Card[], d: Card[], natural = false) => {
    setDealerRevealed(true);
    let dCards = [...dl];
    const dDeck = [...d];
    while (value(dCards) < 17) { dCards.push(dDeck.pop()!); }
    setDealer(dCards);
    const pv = value(p), dv = value(dCards);
    let msg = '', win = 0;
    if (pv > 21) { msg = '💥 Bust! You lose.'; win = -bet; }
    else if (dv > 21) { msg = '🎉 Dealer busts! You win!'; win = natural ? bet*1.5 : bet; }
    else if (pv > dv) { msg = `🏆 ${pv} vs ${dv} — You win!`; win = natural ? bet*1.5 : bet; }
    else if (dv > pv) { msg = `😞 ${dv} vs ${pv} — Dealer wins.`; win = -bet; }
    else { msg = `🤝 Push! ${pv} vs ${dv}`; win = 0; }
    setResult(msg); setChips(c => c + win); setPhase('done');
  };

  const hit = () => {
    const d = [...deck]; const np = [...player, d.pop()!];
    setDeck(d); setPlayer(np);
    if (value(np) >= 21) finish(np, dealer, d);
  };

  const stand = () => finish(player, dealer, deck);

  const double = () => {
    if (chips < bet*2) return;
    setBet(b => b*2);
    const d = [...deck]; const np = [...player, d.pop()!];
    setDeck(d); setPlayer(np);
    finish(np, dealer, d);
  };

  const pv = value(player);
  const dv = value(dealer);

  return (
    <GameShell title="Blackjack" emoji="🃏" onReset={() => setPhase('bet')} scores={[{ label:'Chips', value:chips, color:'#fbbf24' }]}>
      {phase === 'bet' && (
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#94a3b8', marginBottom:'16px', fontSize:'0.9rem' }}>Place your bet</div>
          <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginBottom:'16px', flexWrap:'wrap' }}>
            {[10,25,50,100,250].map(b => (
              <button key={b} onClick={() => setBet(b)}
                style={{ padding:'8px 14px', borderRadius:'10px', border:`2px solid ${bet===b?'#fbbf24':'#334155'}`, background:bet===b?'#fbbf2422':'transparent', color:bet===b?'#fbbf24':'#94a3b8', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
              >${b}</button>
            ))}
          </div>
          <div style={{ color:'#fbbf24', fontWeight:800, fontSize:'1.2rem', marginBottom:'16px' }}>Bet: ${bet} | Chips: ${chips}</div>
          <button onClick={deal} style={{ background:'#fbbf24', border:'none', borderRadius:'14px', padding:'12px 32px', color:'#1e293b', fontWeight:800, fontSize:'1rem', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Deal</button>
        </div>
      )}

      {(phase === 'play' || phase === 'done') && (
        <div>
          {/* Dealer */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ color:'#94a3b8', fontSize:'0.8rem', fontWeight:700, marginBottom:'8px' }}>DEALER {dealerRevealed ? `(${dv})` : ''}</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {dealer.map((c,i) => <CardView key={i} card={c} hidden={!dealerRevealed && i===1} />)}
            </div>
          </div>
          {/* Player */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ color:'#94a3b8', fontSize:'0.8rem', fontWeight:700, marginBottom:'8px' }}>YOU ({pv})</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {player.map((c,i) => <CardView key={i} card={c} />)}
            </div>
          </div>
          {result && <div style={{ textAlign:'center', fontWeight:800, fontSize:'1rem', color:'#e2e8f0', marginBottom:'14px', background:'#1e293b', borderRadius:'10px', padding:'10px' }}>{result}</div>}
          {phase === 'play' && (
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
              {[['Hit','#22c55e',hit],['Stand','#ef4444',stand],['Double','#f59e0b',double]].map(([label,color,fn]) => (
                <button key={label as string} onClick={fn as ()=>void}
                  style={{ padding:'10px 20px', borderRadius:'12px', border:`2px solid ${color}44`, background:`${color}22`, color:color as string, fontWeight:800, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Outfit,sans-serif' }}
                >{label as string}</button>
              ))}
            </div>
          )}
          {phase === 'done' && (
            <div style={{ textAlign:'center', marginTop:'12px' }}>
              <button onClick={() => setPhase('bet')} style={{ background:'#fbbf24', border:'none', borderRadius:'12px', padding:'10px 24px', color:'#1e293b', fontWeight:800, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Play Again</button>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
