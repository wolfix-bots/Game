import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

// ── Types ────────────────────────────────────────────────────────────────────
type Color = 'w' | 'b';
type PieceType = 'K'|'Q'|'R'|'B'|'N'|'P';
type Piece = { type: PieceType; color: Color };
type Square = Piece | null;
type Board = Square[][];

// ── Initial board ────────────────────────────────────────────────────────────
const INIT: Board = (() => {
  const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const back: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  back.forEach((t,c) => { b[0][c]={type:t,color:'b'}; b[7][c]={type:t,color:'w'}; });
  for(let c=0;c<8;c++){b[1][c]={type:'P',color:'b'};b[6][c]={type:'P',color:'w'};}
  return b;
})();

// ── Piece glyphs ─────────────────────────────────────────────────────────────
const GLYPHS: Record<Color,Record<PieceType,string>> = {
  w:{K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙'},
  b:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'},
};

// ── Move generation (simplified legal moves) ─────────────────────────────────
function inBounds(r:number,c:number){return r>=0&&r<8&&c>=0&&c<8;}

function getMoves(board:Board,r:number,c:number,lastPawnDouble:[number,number]|null):number[][] {
  const p=board[r][c]; if(!p) return [];
  const {type,color}=p; const opp=color==='w'?'b':'w';
  const moves:number[][]=[];
  const add=(nr:number,nc:number)=>{if(inBounds(nr,nc)&&board[nr][nc]?.color!==color)moves.push([nr,nc]);};
  const slide=(drs:number[],dcs:number[])=>{
    for(let i=0;i<drs.length;i++){let nr=r+drs[i],nc=c+dcs[i];while(inBounds(nr,nc)){if(board[nr][nc]){if(board[nr][nc]!.color===opp)moves.push([nr,nc]);break;}moves.push([nr,nc]);nr+=drs[i];nc+=dcs[i];}}
  };
  if(type==='P'){
    const dir=color==='w'?-1:1; const start=color==='w'?6:1;
    if(inBounds(r+dir,c)&&!board[r+dir][c]){moves.push([r+dir,c]);if(r===start&&!board[r+2*dir][c])moves.push([r+2*dir,c]);}
    for(const dc of[-1,1])if(inBounds(r+dir,c+dc)&&board[r+dir][c+dc]?.color===opp)moves.push([r+dir,c+dc]);
    // En passant
    if(lastPawnDouble){const[lr,lc]=lastPawnDouble;if(lr===r&&Math.abs(lc-c)===1)moves.push([r+dir,lc]);}
  }
  if(type==='N'){for(const[dr,dc] of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+dr,c+dc);}
  if(type==='K'){for(const[dr,dc] of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])add(r+dr,c+dc);}
  if(type==='R'||type==='Q')slide([-1,1,0,0],[0,0,-1,1]);
  if(type==='B'||type==='Q')slide([-1,-1,1,1],[-1,1,-1,1]);
  return moves;
}

function findKing(board:Board,color:Color):[number,number]{
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.type==='K'&&board[r][c]?.color===color)return[r,c];
  return[-1,-1];
}

function isInCheck(board:Board,color:Color):boolean{
  const _kpos=findKing(board,color); const kr=_kpos[0],kc=_kpos[1];
  const opp=color==='w'?'b':'w';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c]?.color===opp){const ms=getMoves(board,r,c,null);if(ms.some(([mr,mc])=>mr===kr&&mc===kc))return true;}
  }
  return false;
}

function legalMoves(board:Board,r:number,c:number,lpd:[number,number]|null):number[][]{
  const raw=getMoves(board,r,c,lpd);
  const p=board[r][c]!;
  return raw.filter(([nr,nc])=>{
    const nb=board.map(row=>[...row]);
    nb[nr][nc]=nb[r][c]; nb[r][c]=null;
    return !isInCheck(nb,p.color);
  });
}

function aiPickMove(board:Board,lpd:[number,number]|null):{from:[number,number],to:[number,number]}|null{
  const moves:{from:[number,number],to:[number,number],score:number}[]=[];
  const pieceVal:Record<PieceType,number>={K:0,Q:9,R:5,B:3,N:3,P:1};
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c]?.color!=='b')continue;
    const ms=legalMoves(board,r,c,lpd);
    for(const[nr,nc] of ms){
      const capture=board[nr][nc]?pieceVal[board[nr][nc]!.type]:0;
      const center=Math.max(0,3-Math.abs(nr-3.5)-Math.abs(nc-3.5))*0.1;
      moves.push({from:[r,c],to:[nr,nc],score:capture+center+Math.random()*0.3});
    }
  }
  if(!moves.length)return null;
  moves.sort((a,b)=>b.score-a.score);
  return moves[0];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chess() {
  const [board,setBoard]=useState<Board>(INIT.map(r=>r.map(c=>c?{...c}:null)));
  const [selected,setSelected]=useState<[number,number]|null>(null);
  const [highlights,setHighlights]=useState<number[][]>([]);
  const [turn,setTurn]=useState<Color>('w');
  const [mode,setMode]=useState<'ai'|'local'>('ai');
  const [status,setStatus]=useState('');
  const [lastPawnDouble,setLastPawnDouble]=useState<[number,number]|null>(null);
  const [captured,setCaptured]=useState<{w:Piece[],b:Piece[]}>({w:[],b:[]});
  const [promotion,setPromotion]=useState<{r:number,c:number,color:Color}|null>(null);

  const reset=()=>{setBoard(INIT.map(r=>r.map(c=>c?{...c}:null)));setSelected(null);setHighlights([]);setTurn('w');setStatus('');setLastPawnDouble(null);setCaptured({w:[],b:[]});setPromotion(null);};

  const doMove=useCallback((board:Board,fr:number,fc:number,tr:number,tc:number,lpd:[number,number]|null,currentTurn:Color):{board:Board,lpd:[number,number]|null,captured:Piece|null}=>{
    const nb=board.map(r=>[...r]);
    const piece=nb[fr][fc]!;
    const cap=nb[tr][tc];
    // En passant capture
    if(piece.type==='P'&&fc!==tc&&!nb[tr][tc]){nb[fr][tc]=null;}
    nb[tr][tc]={...piece}; nb[fr][fc]=null;
    const newLpd=piece.type==='P'&&Math.abs(tr-fr)===2?[tr,tc] as [number,number]:null;
    return{board:nb,lpd:newLpd,captured:cap};
  },[]);

  const clickSquare=useCallback((r:number,c:number)=>{
    if(promotion)return;
    const piece=board[r][c];
    if(selected){
      const[sr,sc]=selected;
      if(highlights.some(([hr,hc])=>hr===r&&hc===c)){
        const{board:nb,lpd,captured:cap}=doMove(board,sr,sc,r,c,lastPawnDouble,turn);
        // Pawn promotion
        const movedPiece=nb[r][c]!;
        if(movedPiece.type==='P'&&(r===0||r===7)){setBoard(nb);setPromotion({r,c,color:movedPiece.color});setSelected(null);setHighlights([]);setLastPawnDouble(lpd);if(cap)setCaptured(cv=>({...cv,[turn]:[...cv[turn],cap]}));return;}
        const newCap=cap?{...captured,[turn]:[...captured[turn],cap]}:captured;
        const opp=turn==='w'?'b':'w';
        const oppMoves:number[][]=[];
        for(let or=0;or<8;or++)for(let oc=0;oc<8;oc++){if(nb[or][oc]?.color===opp)oppMoves.push(...legalMoves(nb,or,oc,lpd));}
        const inChk=isInCheck(nb,opp);
        if(!oppMoves.length)setStatus(inChk?`Checkmate! ${turn==='w'?'White':'Black'} wins!`:'Stalemate!');
        else if(inChk)setStatus(`${opp==='w'?'White':'Black'} is in check!`);
        else setStatus('');
        setBoard(nb);setCaptured(newCap);setLastPawnDouble(lpd);setSelected(null);setHighlights([]);
        const next=opp;setTurn(next);
        if(mode==='ai'&&next==='b'&&oppMoves.length){
          setTimeout(()=>{
            const m=aiPickMove(nb,lpd);
            if(!m)return;
            const{board:ab,lpd:alpd,captured:acap}=doMove(nb,m.from[0],m.from[1],m.to[0],m.to[1],lpd,'b');
            const aCap=acap?{...newCap,b:[...newCap.b,acap]}:newCap;
            const wMoves:number[][]=[];
            for(let wr=0;wr<8;wr++)for(let wc=0;wc<8;wc++){if(ab[wr][wc]?.color==='w')wMoves.push(...legalMoves(ab,wr,wc,alpd));}
            const wChk=isInCheck(ab,'w');
            if(!wMoves.length)setStatus(wChk?'Checkmate! Black wins!':'Stalemate!');
            else if(wChk)setStatus('White is in check!');
            else setStatus('');
            setBoard(ab);setCaptured(aCap);setLastPawnDouble(alpd);setTurn('w');
          },400);
        }
        return;
      }
      if(piece?.color===turn){setSelected([r,c]);setHighlights(legalMoves(board,r,c,lastPawnDouble));return;}
      setSelected(null);setHighlights([]);return;
    }
    if(piece?.color===turn){setSelected([r,c]);setHighlights(legalMoves(board,r,c,lastPawnDouble));}
  },[board,selected,highlights,turn,mode,lastPawnDouble,captured,doMove,promotion]);

  const promote=(type:PieceType)=>{
    if(!promotion)return;
    const nb=board.map(r=>[...r]);
    nb[promotion.r][promotion.c]={type,color:promotion.color};
    const opp=promotion.color==='w'?'b':'w';
    setBoard(nb);setPromotion(null);setTurn(opp);
    if(mode==='ai'&&opp==='b'){
      setTimeout(()=>{
        const m=aiPickMove(nb,lastPawnDouble);
        if(!m)return;
        const{board:ab,lpd}=doMove(nb,m.from[0],m.from[1],m.to[0],m.to[1],lastPawnDouble,'b');
        setBoard(ab);setLastPawnDouble(lpd);setTurn('w');
      },400);
    }
  };

  const hlSet=new Set(highlights.map(([r,c])=>`${r}-${c}`));

  return (
    <GameShell title="Chess" emoji="♟️" onReset={reset}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'10px'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#94a3b8':'#334155',background:mode===m?'#94a3b822':'transparent',color:mode===m?'#e2e8f0':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {status&&<div style={{textAlign:'center',marginBottom:'8px',color:status.includes('Checkmate')?'#22c55e':status.includes('check')?'#ef4444':'#f59e0b',fontWeight:800,fontSize:'0.9rem'}}>{status}</div>}
      {!status&&<div style={{textAlign:'center',marginBottom:'8px',color:'#94a3b8',fontSize:'0.82rem',fontWeight:600}}>{turn==='w'?'♔ White':'♚ Black'}'s turn{mode==='ai'&&turn==='b'?' — AI thinking…':''}</div>}

      {/* Captured pieces */}
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px',fontSize:'0.85rem'}}>
        <div style={{color:'#94a3b8'}}>{captured.w.map(p=>GLYPHS.w[p.type]).join('')}</div>
        <div style={{color:'#94a3b8'}}>{captured.b.map(p=>GLYPHS.b[p.type]).join('')}</div>
      </div>

      {/* Board */}
      <div style={{display:'flex',border:'3px solid #334155',borderRadius:'8px',overflow:'hidden',margin:'0 auto'}}>
        <div>
          {board.map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((sq,c)=>{
                const light=(r+c)%2===0;
                const isSel=selected?.[0]===r&&selected?.[1]===c;
                const isHl=hlSet.has(`${r}-${c}`);
                const isCapture=isHl&&!!board[r][c];
                const cellSize=Math.min(52,Math.floor((Math.min(window.innerWidth-48,420))/8));
                return (
                  <div key={c} onClick={()=>clickSquare(r,c)}
                    style={{width:cellSize,height:cellSize,background:isSel?'#f59e0b88':isHl?(light?'#22c55e44':'#22c55e66'):(light?'#f0d9b5':'#b58863'),
                      cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:cellSize*0.62,
                      position:'relative',userSelect:'none',
                      outline:isCapture?'3px solid #ef4444':'none',outlineOffset:'-3px',
                    }}
                  >
                    {sq&&<span style={{filter:sq.color==='w'?'drop-shadow(0 1px 1px rgba(0,0,0,0.5))':'drop-shadow(0 1px 1px rgba(255,255,255,0.3))',lineHeight:1}}>{GLYPHS[sq.color][sq.type]}</span>}
                    {isHl&&!sq&&<div style={{width:cellSize*0.3,height:cellSize*0.3,borderRadius:'50%',background:'rgba(0,0,0,0.25)',position:'absolute'}}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Promotion dialog */}
      {promotion&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div style={{background:'#1e293b',borderRadius:'16px',padding:'20px',textAlign:'center'}}>
            <div style={{color:'#e2e8f0',fontWeight:700,marginBottom:'12px'}}>Promote pawn to:</div>
            <div style={{display:'flex',gap:'12px'}}>
              {(['Q','R','B','N'] as PieceType[]).map(t=>(
                <button key={t} onClick={()=>promote(t)}
                  style={{width:60,height:60,fontSize:'2rem',background:'#334155',border:'2px solid #475569',borderRadius:'12px',cursor:'pointer'}}
                >{GLYPHS[promotion.color][t]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
