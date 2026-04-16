import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, RotateCcw, Bot, Users, Globe, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import GameBoard from '../components/GameBoard';
import Scoreboard from '../components/Scoreboard';
import SettingsPanel from '../components/Settings';
import Multiplayer from '../components/Multiplayer';
import FoxMascot, { Mood } from '../components/FoxMascot';
import AchievementToast from '../components/AchievementToast';
import AchievementsPanel from '../components/AchievementsPanel';
import StatsPage from '../components/StatsPage';
import DailyPuzzle from '../components/DailyPuzzle';
import WinExplosion from '../components/WinExplosion';
import UserMenu from '../components/UserMenu';

import { Theme, ThemeConfig, THEMES, EMOJI_SETS } from '../lib/themes';
import { checkWinner, isDraw, getAIMove, getCommentary, Difficulty } from '../lib/AI';
import { sounds } from '../lib/sounds';
import { getScores, saveScore, resetScores, ScoreMode, ScoreData } from '../lib/storage';
import { Achievement, getAchievements, unlockAchievement, updateStats, getStats } from '../lib/achievements';
import { isDailyDone } from '../lib/daily';
import { User } from '../lib/auth';

type GameMode = 'local' | 'ai' | 'online';
const EMPTY_BOARD = Array(9).fill('');

interface Props { user: User | null; }

export default function TicTacToePage({ user }: Props) {
  const nav = useNavigate();
  const [theme, setTheme]           = useState<Theme>('night');
  const [emojiSetIndex, setEmojiSetIndex] = useState(0);
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [gameMode, setGameMode]           = useState<GameMode>('local');
  const [aiDifficulty, setAiDifficulty]   = useState<Difficulty>('medium');
  const [board, setBoard]                 = useState<string[]>(EMPTY_BOARD);
  const [currentTurn, setCurrentTurn]     = useState<'X'|'O'>('X');
  const [winner, setWinner]               = useState<string|null>(null);
  const [draw, setDraw]                   = useState(false);
  const [aiThinking, setAiThinking]       = useState(false);
  const [moveCount, setMoveCount]         = useState(0);
  const [foxMood, setFoxMood]             = useState<Mood>('idle');
  const [foxMsg, setFoxMsg]               = useState<string|null>(null);
  const foxTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [toastAchievement, setToastAchievement] = useState<Achievement|null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [statsOpen, setStatsOpen]         = useState(false);
  const [dailyOpen, setDailyOpen]         = useState(false);
  const [dailyDone, setDailyDone]         = useState(isDailyDone());
  const [exploding, setExploding]         = useState(false);
  const [scores, setScores]               = useState<ScoreData>({ wins:0, losses:0, draws:0 });

  const themeConfig: ThemeConfig = THEMES[theme];
  const emojiSet = EMOJI_SETS[emojiSetIndex];
  const isNeon = theme === 'neon';
  const scoreMode: ScoreMode = gameMode==='ai' ? `ai-${aiDifficulty}` as ScoreMode : gameMode==='local' ? 'local' : 'online';

  useEffect(() => { setScores(getScores(scoreMode)); }, [scoreMode]);

  const mapEmoji = (val: string) => val==='X' ? emojiSet.x : val==='O' ? emojiSet.o : val;
  const displayBoard = board.map(mapEmoji);

  const foxSay = useCallback((msg: string, mood: Mood, dur=3000) => {
    if (foxTimer.current) clearTimeout(foxTimer.current);
    setFoxMsg(msg); setFoxMood(mood);
    foxTimer.current = setTimeout(() => { setFoxMsg(null); setFoxMood('idle'); }, dur);
  }, []);

  const tryUnlock = useCallback((id: string) => {
    if (unlockAchievement(id)) {
      const a = getAchievements().find(x => x.id===id);
      if (a) { setToastAchievement(a); setTimeout(() => setToastAchievement(null), 4000); }
    }
  }, []);

  const handleGameOver = useCallback((newBoard: string[], w: string|null, d: boolean, moves: number) => {
    if (w) {
      if (soundEnabled) sounds.win();
      setExploding(true); setTimeout(() => setExploding(false), 3000);
      const playerWon = gameMode==='local' || (gameMode==='ai' && w==='X');
      const result = playerWon ? 'win' : 'loss';
      saveScore(scoreMode, result);
      const stats = updateStats(result);
      if (gameMode==='ai') { if (w==='O') foxSay(getCommentary('win'),'excited'); else foxSay(getCommentary('lose'),'sad'); }
      else foxSay('🏆 Amazing!','excited');
      tryUnlock('first_win');
      if (stats.currentStreak>=3) tryUnlock('streak_3');
      if (stats.currentStreak>=5) tryUnlock('streak_5');
      if (stats.currentStreak>=10) tryUnlock('streak_10');
      if (stats.totalWins>=100) tryUnlock('win_100');
      if (moves<=5) tryUnlock('speed_win');
      if (gameMode==='ai'&&w==='X') { if (aiDifficulty==='easy') tryUnlock('beat_easy'); if (aiDifficulty==='medium') tryUnlock('beat_medium'); if (aiDifficulty==='hard') tryUnlock('beat_hard'); }
      if (gameMode==='online'&&w==='X') tryUnlock('online_win');
    } else if (d) {
      if (soundEnabled) sounds.draw();
      saveScore(scoreMode,'draw'); updateStats('draw');
      if (gameMode==='ai') foxSay(getCommentary('draw'),'thinking');
    }
    if (theme==='night') tryUnlock('night_owl');
    if (theme==='neon') tryUnlock('neon_rider');
    setScores(getScores(scoreMode));
  }, [gameMode, scoreMode, soundEnabled, aiDifficulty, theme, foxSay, tryUnlock]);

  const makeMove = useCallback((index: number, currentBoard: string[], turn: 'X'|'O', moves: number) => {
    if (currentBoard[index]!==''||winner||draw) return null;
    const newBoard=[...currentBoard]; newBoard[index]=turn;
    const w=checkWinner(newBoard); const d=!w&&isDraw(newBoard);
    setBoard(newBoard); setMoveCount(moves+1);
    if (w) setWinner(w); else if (d) setDraw(true); else setCurrentTurn(turn==='X'?'O':'X');
    return { newBoard, w, d };
  }, [winner,draw]);

  const handleCellClick = useCallback((index: number) => {
    if (winner||draw||aiThinking) return;
    if (gameMode==='ai'&&currentTurn==='O') return;
    if (soundEnabled) sounds.click();
    const result=makeMove(index,board,currentTurn,moveCount);
    if (!result) return;
    if (result.w||result.d) { handleGameOver(result.newBoard,result.w,result.d,moveCount+1); return; }
    if (gameMode==='ai') {
      setAiThinking(true); foxSay(getCommentary('move'),'thinking',1500);
      setTimeout(()=>{
        const aiMove=getAIMove(result.newBoard,aiDifficulty);
        if (aiMove===-1){setAiThinking(false);return;}
        const aiBoard=[...result.newBoard]; aiBoard[aiMove]='O';
        if (soundEnabled) sounds.click();
        const aiW=checkWinner(aiBoard); const aiD=!aiW&&isDraw(aiBoard);
        setBoard(aiBoard); setMoveCount(m=>m+1);
        if (aiW) setWinner(aiW); else if (aiD) setDraw(true); else setCurrentTurn('X');
        if (aiW||aiD) handleGameOver(aiBoard,aiW,aiD,moveCount+2);
        setAiThinking(false);
      },500);
    }
  }, [winner,draw,aiThinking,gameMode,currentTurn,board,aiDifficulty,soundEnabled,makeMove,handleGameOver,foxSay,moveCount]);

  const resetGame = useCallback(() => {
    setBoard(EMPTY_BOARD); setCurrentTurn('X'); setWinner(null); setDraw(false);
    setAiThinking(false); setMoveCount(0); setFoxMsg(null); setFoxMood('idle');
  }, []);

  const turnLabel = () => {
    if (winner) return `${mapEmoji(winner)} Wins! 🎉`;
    if (draw) return "It's a Draw! 🤝";
    if (aiThinking) return 'Fox is thinking… 🦊';
    const marker=mapEmoji(currentTurn);
    if (gameMode==='local') return `${marker}'s Turn`;
    return `Your Turn (${marker})`;
  };

  const stats = getStats();

  return (
    <div style={{ minHeight:'100vh', background:themeConfig.bg, display:'flex', flexDirection:'column', alignItems:'center', padding:'clamp(12px,3vw,24px)', fontFamily:"'Outfit',sans-serif" }}>
      <WinExplosion active={exploding} color={themeConfig.accent} />
      <AchievementToast achievement={toastAchievement} accentColor={themeConfig.accent} />

      {/* Header */}
      <motion.header initial={{y:-30,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.5}}
        style={{ width:'100%', maxWidth:'480px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'clamp(12px,3vw,20px)' }}
      >
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <button onClick={()=>nav('/')} style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:themeConfig.textMuted,display:'flex',backdropFilter:'blur(8px)'}}>
            <ArrowLeft size={16}/>
          </button>
          <motion.div animate={{rotate:[0,5,-5,0]}} transition={{repeat:Infinity,duration:4}} style={{fontSize:'1.5rem'}}>🦊</motion.div>
          <h1 style={{color:themeConfig.text,fontWeight:900,fontSize:'clamp(1rem,4vw,1.3rem)',margin:0,letterSpacing:'-0.02em',textShadow:isNeon?`0 0 10px ${themeConfig.text}`:'none'}}>
            Foxy<span style={{color:themeConfig.accent}}>Tac</span>
          </h1>
          {stats.currentStreak>=2&&<motion.div initial={{scale:0}} animate={{scale:1}} style={{fontSize:'0.65rem',color:'#f97316',fontWeight:700}}>🔥{stats.currentStreak}</motion.div>}
        </div>
        <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
          {user&&<UserMenu user={user} theme={themeConfig} onLogout={()=>{}} onAvatarChange={()=>{}}/>}
          <button onClick={()=>setDailyOpen(true)} style={{background:dailyDone?'#22c55e22':`${themeConfig.accent}22`,border:`1px solid ${dailyDone?'#22c55e44':themeConfig.accent+'44'}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:dailyDone?'#22c55e':themeConfig.accent,display:'flex'}} title="Daily Puzzle"><Calendar size={15}/></button>
          <button onClick={()=>setAchievementsOpen(true)} style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:themeConfig.textMuted,display:'flex',backdropFilter:'blur(8px)'}} title="Achievements"><Trophy size={15}/></button>
          <button onClick={()=>setStatsOpen(true)} style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:themeConfig.textMuted,display:'flex',backdropFilter:'blur(8px)'}} title="Stats"><TrendingUp size={15}/></button>
          <button onClick={()=>setSettingsOpen(true)} style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:themeConfig.textMuted,display:'flex',backdropFilter:'blur(8px)'}} title="Settings"><Settings2 size={15}/></button>
        </div>
      </motion.header>

      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{duration:0.4,delay:0.1}}
        style={{width:'100%',maxWidth:'480px',display:'flex',flexDirection:'column',gap:'clamp(10px,2.5vw,16px)'}}
      >
        {/* Mode tabs */}
        <div style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'16px',padding:'6px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px',backdropFilter:'blur(12px)',boxShadow:themeConfig.shadow}}>
          {([{mode:'local' as GameMode,icon:<Users size={14}/>,label:'Local'},{mode:'ai' as GameMode,icon:<Bot size={14}/>,label:'vs AI'},{mode:'online' as GameMode,icon:<Globe size={14}/>,label:'Online'}]).map(({mode,icon,label})=>(
            <button key={mode} onClick={()=>{setGameMode(mode);resetGame();}}
              style={{background:gameMode===mode?themeConfig.accent:'transparent',border:'none',borderRadius:'10px',padding:'8px 6px',cursor:'pointer',color:gameMode===mode?'#fff':themeConfig.textMuted,fontWeight:700,fontSize:'0.82rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',transition:'all 0.2s',fontFamily:'Outfit,sans-serif'}}
            >{icon}{label}</button>
          ))}
        </div>

        {/* AI difficulty */}
        <AnimatePresence>
          {gameMode==='ai'&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} style={{overflow:'hidden'}}>
              <div style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'14px',padding:'10px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',backdropFilter:'blur(12px)'}}>
                {(['easy','medium','hard'] as Difficulty[]).map(d=>(
                  <button key={d} onClick={()=>{setAiDifficulty(d);resetGame();}}
                    style={{background:aiDifficulty===d?`${themeConfig.accent}33`:'transparent',border:`2px solid ${aiDifficulty===d?themeConfig.accent:themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:aiDifficulty===d?themeConfig.accent:themeConfig.textMuted,fontWeight:700,fontSize:'0.8rem',textTransform:'capitalize',transition:'all 0.2s',fontFamily:'Outfit,sans-serif'}}
                  >{d==='easy'?'😊':d==='medium'?'🤔':'🤖'} {d}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gameMode==='online' ? (
          <Multiplayer theme={themeConfig} emojiX={emojiSet.x} emojiO={emojiSet.o} soundEnabled={soundEnabled}/>
        ) : (
          <>
            <AnimatePresence>
              {gameMode==='ai'&&(
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'16px',padding:'12px 16px',backdropFilter:'blur(12px)'}}>
                  <FoxMascot mood={foxMood} message={foxMsg} accentColor={themeConfig.accent}/>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'14px',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',backdropFilter:'blur(12px)',boxShadow:themeConfig.shadow}}>
              <motion.div key={turnLabel()} initial={{x:-10,opacity:0}} animate={{x:0,opacity:1}} style={{color:winner?'#22c55e':draw?'#f59e0b':themeConfig.text,fontWeight:700,fontSize:'clamp(0.9rem,3vw,1.05rem)'}}>
                {turnLabel()}
              </motion.div>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                {moveCount>0&&!winner&&!draw&&<span style={{color:themeConfig.textMuted,fontSize:'0.75rem',fontWeight:600,background:themeConfig.cellBg,borderRadius:'8px',padding:'3px 8px'}}>Move {moveCount}</span>}
                <button onClick={resetGame} style={{background:themeConfig.cellBg,border:`1px solid ${themeConfig.border}`,borderRadius:'10px',padding:'7px',cursor:'pointer',color:themeConfig.textMuted,display:'flex',transition:'all 0.2s'}} title="New Game"><RotateCcw size={16}/></button>
              </div>
            </div>

            <div style={{background:themeConfig.surface,border:`1px solid ${themeConfig.border}`,borderRadius:'20px',padding:'clamp(12px,3vw,20px)',backdropFilter:'blur(16px)',boxShadow:themeConfig.shadow}}>
              <GameBoard board={displayBoard} onCellClick={handleCellClick} disabled={!!winner||draw||aiThinking||(gameMode==='ai'&&currentTurn==='O')} theme={themeConfig} gameOver={!!winner||draw}/>
            </div>

            <AnimatePresence>
              {(winner||draw)&&(
                <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} style={{background:winner?'#22c55e22':'#f59e0b22',border:`1px solid ${winner?'#22c55e':'#f59e0b'}44`,borderRadius:'16px',padding:'16px',textAlign:'center'}}>
                  <motion.div animate={{scale:[1,1.2,1],rotate:[0,10,-10,0]}} transition={{duration:0.6}} style={{fontSize:'2.5rem',marginBottom:'6px'}}>{winner?'🏆':'🤝'}</motion.div>
                  <div style={{color:winner?'#22c55e':'#f59e0b',fontWeight:800,fontSize:'1.2rem',marginBottom:'10px'}}>{winner?`${mapEmoji(winner)} Wins!`:"It's a Draw!"}</div>
                  <button onClick={resetGame} style={{background:themeConfig.accent,border:'none',borderRadius:'10px',padding:'8px 20px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'0.9rem',display:'inline-flex',alignItems:'center',gap:'6px',fontFamily:'Outfit,sans-serif'}}><RotateCcw size={14}/>Play Again</button>
                </motion.div>
              )}
            </AnimatePresence>

            <Scoreboard mode={scoreMode} scores={scores} onReset={()=>{resetScores(scoreMode);setScores(getScores(scoreMode));}} theme={themeConfig}/>
          </>
        )}
      </motion.div>

      <SettingsPanel open={settingsOpen} onClose={()=>setSettingsOpen(false)} theme={theme} themeConfig={themeConfig} onThemeChange={t=>{setTheme(t);if(t==='night')tryUnlock('night_owl');if(t==='neon')tryUnlock('neon_rider');}} emojiSet={emojiSetIndex} onEmojiChange={setEmojiSetIndex} soundEnabled={soundEnabled} onSoundToggle={()=>setSoundEnabled(s=>!s)}/>
      <AchievementsPanel open={achievementsOpen} onClose={()=>setAchievementsOpen(false)} theme={themeConfig}/>
      <StatsPage open={statsOpen} onClose={()=>setStatsOpen(false)} theme={themeConfig}/>
      <DailyPuzzle open={dailyOpen} onClose={()=>setDailyOpen(false)} theme={themeConfig} emojiX={emojiSet.x} emojiO={emojiSet.o} onComplete={()=>{setDailyDone(true);tryUnlock('daily_done');}}/>
    </div>
  );
}
