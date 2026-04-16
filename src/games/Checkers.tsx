import React, { useState, useCallback } from 'react';
import GameShell from '../components/GameShell';

type Piece={player:1|2,king:boolean}|null;
type Board=Piece[][];

function makeBoard():Board{
  return Array(8).fill(null).map((_,r)=>Array(8).fill(null).map((_,c)=>{
    if((r+c)%2===1){
      if(r<3) return{player:2,king:false};
      if(r>4) return{player:1,king:false};
    }
    return null;
  }));
}

function getMoves(board:Board,r:number,c:number):{r:number,c:number,captures:[number,number][]}[]{
  const p=board[r][c]; if(!p) return [];
  const dirs=p.king?[-1,1]:p.player===1?[-1]:[1];
  const moves:any[]=[];
  for(const dr of dirs) for(const dc of[-1,1]){
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<8&&nc>=0&&nc<8){
      if(!board[nr][nc]) moves.push({r:nr,c:nc,captures:[]});
      else if(board[nr][nc]!.player!==p.player){
        const jr=nr+dr,jc=nc+dc;
        if(jr>=0&&jr<8&&jc>=0&&jc<8&&!board[jr][jc]) moves.push({r:jr,c:jc,captures:[[nr,nc]]});
      }
    }
  }
  return moves;
}

export default function Checkers(){
  const[board,setBoard]=useState<Board>(makeBoard);
  const[selected,setSelected]=useState<[number,number]|null>(null);
  const[turn,setTurn]=useState<1|2>(1);
  const[mode,setMode]=useState<'ai'|'local'>('ai');
  const[scores,setScores]=useState({p1:0,p2:0});

  const count=(p:1|2)=>board.flat().filter(v=>v?.player===p).length;
  const p1=count(1),p2=count(2);
  const won=p1===0?2:p2===0?1:null;

  const allMoves=(player:1|2)=>{
    const res:any[]=[];
    board.forEach((row,r)=>row.forEach((_,c)=>{if(board[r][c]?.player===player) getMoves(board,r,c).forEach(m=>res.push({from:[r,c],...m}));}));
    return res;
  };

  const doMove=(from:[number,number],to:{r:number,c:number,captures:[number,number][]},b:Board):Board=>{
    const nb=b.map(row=>[...row]) as Board;
    const p=nb[from[0]][from[1]]!;
    nb[to.r][to.c]={...p,king:p.king||(p.player===1&&to.r===0)||(p.player===2&&to.r===7)};
    nb[from[0]][from[1]]=null;
    to.captures.forEach(([cr,cc])=>{nb[cr][cc]=null;});
    return nb;
  };

  const click=useCallback((r:number,c:number)=>{
    if(won||turn!==1) return;
    if(selected){
      const moves=getMoves(board,selected[0],selected[1]);
      const mv=moves.find(m=>m.r===r&&m.c===c);
      if(mv){
        const nb=doMove(selected,mv,board);
        setBoard(nb); setSelected(null);
        const np2=nb.flat().filter(v=>v?.player===2).length;
        if(np2===0){setScores(s=>({...s,p1:s.p1+1}));return;}
        setTurn(2);
        if(mode==='ai'){
          setTimeout(()=>{
            const aiMoves=allMoves(2);
            if(!aiMoves.length){setTurn(1);return;}
            // Prefer captures
            const caps=aiMoves.filter(m=>m.captures.length);
            const chosen=caps.length?caps[Math.floor(Math.random()*caps.length)]:aiMoves[Math.floor(Math.random()*aiMoves.length)];
            const ab=doMove(chosen.from,chosen,nb);
            setBoard(ab);
            const np1=ab.flat().filter(v=>v?.player===1).length;
            if(np1===0) setScores(s=>({...s,p2:s.p2+1}));
            setTurn(1);
          },500);
        }
      } else if(board[r][c]?.player===1) setSelected([r,c]);
      else setSelected(null);
    } else {
      if(board[r][c]?.player===turn) setSelected([r,c]);
    }
  },[board,selected,turn,mode,won]);

  const validDests=selected?new Set(getMoves(board,selected[0],selected[1]).map(m=>`${m.r}-${m.c}`)):new Set();
  const reset=()=>{setBoard(makeBoard());setSelected(null);setTurn(1);};

  return(
    <GameShell title="Checkers" emoji="🔵" onReset={reset} scores={[
      {label:mode==='ai'?'You':'P1',value:scores.p1,color:'#fb923c'},
      {label:mode==='ai'?'AI':'P2',value:scores.p2,color:'#94a3b8'},
    ]}>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
        {(['ai','local'] as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{padding:'5px 14px',borderRadius:'20px',border:'2px solid',cursor:'pointer',fontWeight:700,fontSize:'0.78rem',fontFamily:'Outfit,sans-serif',
              borderColor:mode===m?'#fb923c':'#334155',background:mode===m?'#fb923c22':'transparent',color:mode===m?'#fb923c':'#94a3b8'}}
          >{m==='ai'?'🤖 vs AI':'👥 Local'}</button>
        ))}
      </div>
      {won&&<div style={{textAlign:'center',color:'#22c55e',fontWeight:800,fontSize:'1rem',marginBottom:'10px'}}>🏆 {mode==='ai'?(won===1?'You Win!':'AI Wins!'):`Player ${won} Wins!`}</div>}
      {!won&&<div style={{textAlign:'center',color:'#94a3b8',fontSize:'0.82rem',marginBottom:'10px',fontWeight:600}}>{turn===1?'🔴':'⚪'} {mode==='ai'&&turn===2?'AI thinking…':'Turn'} · P1:{p1} P2:{p2}</div>}
      <div style={{display:'inline-block',border:'3px solid #78350f',borderRadius:'8px',overflow:'hidden',margin:'0 auto'}}>
        {board.map((row,r)=>(
          <div key={r} style={{display:'flex'}}>
            {row.map((cell,c)=>{
              const dark=(r+c)%2===1;
              const isSel=selected&&selected[0]===r&&selected[1]===c;
              const isValid=dark&&validDests.has(`${r}-${c}`);
              return(
                <div key={c} onClick={()=>click(r,c)}
                  style={{width:44,height:44,background:dark?(isSel?'#92400e':isValid?'#a16207':'#451a03'):'#fef3c7',
                    display:'flex',alignItems:'center',justifyContent:'center',cursor:dark?'pointer':'default',
                    boxShadow:isValid?'inset 0 0 0 3px #fbbf24':'none',
                  }}
                >
                  {cell&&<div style={{width:34,height:34,borderRadius:'50%',
                    background:cell.player===1?'#dc2626':'#e2e8f0',
                    border:`3px solid ${cell.player===1?'#7f1d1d':'#94a3b8'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',
                    boxShadow:isSel?'0 0 12px #fbbf24':'0 2px 4px rgba(0,0,0,0.4)',
                  }}>{cell.king?'👑':''}</div>}
                  {isValid&&!cell&&<div style={{width:14,height:14,borderRadius:'50%',background:'#fbbf2466'}}/>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </GameShell>
  );
}
