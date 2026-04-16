import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../components/GameShell';

type Suit = '♠'|'♥'|'♦'|'♣';
type Rank = 'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K';
type Card = { suit: Suit; rank: Rank; faceUp: boolean };

const SUITS: Suit[] = ['♠','♥','♦','♣'];
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_VAL: Record<Rank,number> = {A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13};
const RED: Set<Suit> = new Set(['♥','♦']);

function makeDeck(): Card[] {
  const d: Card[] = [];
  for(const s of SUITS) for(const r of RANKS) d.push({suit:s,rank:r,faceUp:false});
  return d.sort(()=>Math.random()-0.5);
}

function initGame() {
  const deck = makeDeck();
  const tableau: Card[][] = Array(7).fill(null).map((_,i) => {
    const col = deck.splice(0,i+1);
    col[col.length-1].faceUp = true;
    return col;
  });
  const stock = deck.map(c=>({...c,faceUp:false}));
  const waste: Card[] = [];
  const foundations: Card[][] = [[],[],[],[]];
  return { tableau, stock, waste, foundations };
}

function canStack(card: Card, onto: Card | null): boolean {
  if(!onto) return card.rank === 'K';
  const redCard = RED.has(card.suit);
  const redOnto = RED.has(onto.suit);
  return redCard !== redOnto && RANK_VAL[card.rank] === RANK_VAL[onto.rank] - 1;
}

function canFoundation(card: Card, pile: Card[]): boolean {
  if(pile.length === 0) return card.rank === 'A';
  const top = pile[pile.length-1];
  return card.suit === top.suit && RANK_VAL[card.rank] === RANK_VAL[top.rank] + 1;
}

export default function Solitaire() {
  const [game, setGame] = useState(initGame);
  const [selected, setSelected] = useState<{from:'tableau'|'waste',col?:number,idx?:number}|null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const reset = () => { setGame(initGame()); setSelected(null); setMoves(0); setScore(0); setWon(false); };

  const drawStock = () => {
    setGame(g => {
      if(g.stock.length === 0) {
        const newStock = [...g.waste].reverse().map(c=>({...c,faceUp:false}));
        return {...g, stock:newStock, waste:[]};
      }
      const newStock = [...g.stock];
      const card = {...newStock.pop()!, faceUp:true};
      return {...g, stock:newStock, waste:[...g.waste, card]};
    });
  };

  const clickWaste = () => {
    if(game.waste.length === 0) return;
    setSelected({from:'waste'});
  };

  const clickTableau = (col: number, idx: number) => {
    const card = game.tableau[col][idx];
    if(!card.faceUp) return;

    if(selected) {
      // Try to move
      const target = game.tableau[col][game.tableau[col].length-1];
      const srcCards = selected.from === 'waste'
        ? [game.waste[game.waste.length-1]]
        : game.tableau[selected.col!].slice(selected.idx!);

      if(canStack(srcCards[0], target||null)) {
        setGame(g => {
          const ng = JSON.parse(JSON.stringify(g));
          if(selected.from==='waste') {
            const card = ng.waste.pop();
            ng.tableau[col].push({...card});
          } else {
            const cards = ng.tableau[selected.col!].splice(selected.idx!);
            ng.tableau[col].push(...cards);
            if(ng.tableau[selected.col!].length>0) ng.tableau[selected.col!][ng.tableau[selected.col!].length-1].faceUp=true;
          }
          return ng;
        });
        setSelected(null); setMoves(m=>m+1); setScore(s=>s+5);
        return;
      }
      setSelected(null);
    }
    setSelected({from:'tableau',col,idx});
  };

  const clickFoundation = (fi: number) => {
    if(!selected) return;
    const srcCard = selected.from==='waste' ? game.waste[game.waste.length-1] : game.tableau[selected.col!][selected.idx!];
    if(!srcCard || selected.idx !== undefined && selected.idx !== game.tableau[selected.col!].length-1) { setSelected(null); return; }
    if(canFoundation(srcCard, game.foundations[fi])) {
      setGame(g => {
        const ng = JSON.parse(JSON.stringify(g));
        if(selected.from==='waste') ng.waste.pop();
        else { ng.tableau[selected.col!].pop(); if(ng.tableau[selected.col!].length>0) ng.tableau[selected.col!][ng.tableau[selected.col!].length-1].faceUp=true; }
        ng.foundations[fi].push(srcCard);
        return ng;
      });
      setSelected(null); setMoves(m=>m+1); setScore(s=>s+10);
      if(game.foundations.every((f,i)=>i===fi?f.length===12:f.length===13)) setWon(true);
    } else setSelected(null);
  };

  const isSelected = (col:number,idx:number) => selected?.from==='tableau'&&selected.col===col&&idx>=selected.idx!;

  const CardEl = ({card,small=false,highlighted=false}:{card:Card,small?:boolean,highlighted?:boolean}) => {
    const red = RED.has(card.suit);
    return (
      <div style={{width:small?36:52,height:small?50:72,background:card.faceUp?'#fff':'#1e40af',borderRadius:6,border:`2px solid ${highlighted?'#f59e0b':'#334155'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:small?'0.6rem':'0.82rem',fontWeight:800,color:red?'#ef4444':'#1e293b',flexShrink:0,boxShadow:highlighted?'0 0 8px #f59e0b':'0 2px 4px rgba(0,0,0,0.3)'}}>
        {card.faceUp?<>{card.rank}<br/>{card.suit}</>:'🂠'}
      </div>
    );
  };

  return (
    <GameShell title="Solitaire" emoji="🃏" onReset={reset} scores={[{label:'Score',value:score,color:'#22c55e'},{label:'Moves',value:moves,color:'#94a3b8'}]}>
      {won&&<div style={{textAlign:'center',marginBottom:'10px',color:'#22c55e',fontWeight:800,fontSize:'1.1rem'}}>🎉 You Won! Score: {score}</div>}

      {/* Top row: stock, waste, foundations */}
      <div style={{display:'flex',gap:'6px',marginBottom:'10px',alignItems:'flex-start',overflowX:'auto'}}>
        {/* Stock */}
        <div onClick={drawStock} style={{width:52,height:72,background:'#1e40af',borderRadius:6,border:'2px solid #334155',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{game.stock.length?'🂠':'↺'}</div>
        {/* Waste */}
        <div onClick={clickWaste} style={{width:52,height:72,background:'#1e293b',borderRadius:6,border:`2px solid ${selected?.from==='waste'?'#f59e0b':'#334155'}`,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {game.waste.length>0&&<CardEl card={game.waste[game.waste.length-1]} highlighted={selected?.from==='waste'} />}
        </div>
        <div style={{flex:1}}/>
        {/* Foundations */}
        {game.foundations.map((f,fi)=>(
          <div key={fi} onClick={()=>clickFoundation(fi)} style={{width:52,height:72,background:'#1e293b',borderRadius:6,border:'2px dashed #334155',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {f.length>0?<CardEl card={f[f.length-1]} />:<span style={{color:'#334155',fontSize:'1rem'}}>{SUITS[fi]}</span>}
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{display:'flex',gap:'4px',overflowX:'auto'}}>
        {game.tableau.map((col,ci)=>(
          <div key={ci} style={{flex:1,minWidth:44,position:'relative'}}>
            <div style={{minHeight:72,background:'#1e293b22',borderRadius:6,border:'1px dashed #334155',position:'relative'}}>
              {col.map((card,idx)=>(
                <div key={idx} onClick={()=>clickTableau(ci,idx)}
                  style={{position:idx===0?'relative':'absolute',top:idx===0?0:idx*18,left:0,right:0,cursor:card.faceUp?'pointer':'default',zIndex:idx}}>
                  <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
                    <div style={{width:44,height:62,background:card.faceUp?'#fff':'#1e40af',borderRadius:5,border:`2px solid ${isSelected(ci,idx)?'#f59e0b':'#334155'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:800,color:RED.has(card.suit)?'#ef4444':'#1e293b',boxShadow:isSelected(ci,idx)?'0 0 8px #f59e0b':'0 1px 3px rgba(0,0,0,0.3)'}}>
                      {card.faceUp?<>{card.rank}{card.suit}</>:'🂠'}
                    </div>
                  </div>
                </div>
              ))}
              {col.length===0&&<div style={{height:72}}/>}
            </div>
            <div style={{height:col.length>0?col.length*18+62:72}}/>
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',marginTop:'10px',color:'#475569',fontSize:'0.72rem'}}>Click a card to select, then click destination</div>
    </GameShell>
  );
}
