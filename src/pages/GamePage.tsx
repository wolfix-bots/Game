import React, { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { User } from '../lib/auth';
import { THEMES } from '../lib/themes';

const TicTacToePage  = lazy(() => import('./TicTacToePage'));
const Chess          = lazy(() => import('../games/Chess'));
const Connect4       = lazy(() => import('../games/Connect4'));
const Checkers       = lazy(() => import('../games/Checkers'));
const Reversi        = lazy(() => import('../games/Reversi'));
const Battleship     = lazy(() => import('../games/Battleship'));
const RPS            = lazy(() => import('../games/RockPaperScissors'));
const Pong           = lazy(() => import('../games/Pong'));
const SnakeLadder    = lazy(() => import('../games/SnakeLadder'));
const Ludo           = lazy(() => import('../games/Ludo'));
const Yahtzee        = lazy(() => import('../games/Yahtzee'));
const Blackjack      = lazy(() => import('../games/Blackjack'));
const Solitaire      = lazy(() => import('../games/Solitaire'));
const Wordle         = lazy(() => import('../games/Wordle'));
const Sudoku         = lazy(() => import('../games/Sudoku'));
const Memory         = lazy(() => import('../games/Memory'));
const Sliding        = lazy(() => import('../games/Sliding'));
const Game2048       = lazy(() => import('../games/Game2048'));
const Hangman        = lazy(() => import('../games/Hangman'));
const Minesweeper    = lazy(() => import('../games/Minesweeper'));
const Trivia         = lazy(() => import('../games/Trivia'));
const TypeRacer      = lazy(() => import('../games/TypeRacer'));
const Snake          = lazy(() => import('../games/Snake'));
const Flappy         = lazy(() => import('../games/Flappy'));
const Dino           = lazy(() => import('../games/Dino'));
const Breakout       = lazy(() => import('../games/Breakout'));
const Asteroids      = lazy(() => import('../games/Asteroids'));
const WhackAMole     = lazy(() => import('../games/WhackAMole'));
const Simon          = lazy(() => import('../games/Simon'));

const GAME_MAP: Record<string, React.LazyExoticComponent<any>> = {
  tictactoe:       TicTacToePage,
  chess:           Chess,
  connect4:        Connect4,
  checkers:        Checkers,
  reversi:         Reversi,
  battleship:      Battleship,
  rockpaper:       RPS,
  pong:            Pong,
  snakeladdergame: SnakeLadder,
  ludo:            Ludo,
  yahtzee:         Yahtzee,
  blackjack:       Blackjack,
  solitaire:       Solitaire,
  wordle:          Wordle,
  sudoku:          Sudoku,
  memory:          Memory,
  sliding:         Sliding,
  '2048':          Game2048,
  hangman:         Hangman,
  minesweeper:     Minesweeper,
  trivia:          Trivia,
  typeracer:       TypeRacer,
  snake:           Snake,
  flappy:          Flappy,
  dino:            Dino,
  breakout:        Breakout,
  asteroids:       Asteroids,
  whackamole:      WhackAMole,
  simon:           Simon,
};

interface Props { user: User | null; onLogout: () => void; onAvatarChange: (u: User) => void; }

export default function GamePage({ user, onLogout, onAvatarChange }: Props) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const theme = THEMES['night'];
  const GameComponent = id ? GAME_MAP[id] : null;

  if (!GameComponent) {
    return (
      <div style={{ minHeight:'100vh', background:theme.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px', fontFamily:'Outfit,sans-serif' }}>
        <div style={{ fontSize:'4rem' }}>🎮</div>
        <div style={{ color:theme.text, fontWeight:800, fontSize:'1.3rem' }}>Game not found</div>
        <button onClick={()=>nav('/')} style={{ background:theme.accent, border:'none', borderRadius:'12px', padding:'10px 24px', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>← Back to Arcade</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:theme.bg, fontFamily:'Outfit,sans-serif' }}>
      <div style={{ padding:'12px 16px', maxWidth:'640px', margin:'0 auto' }}>
        <button onClick={()=>nav('/')}
          style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'8px 14px', cursor:'pointer', color:theme.textMuted, display:'flex', alignItems:'center', gap:'6px', fontWeight:600, fontSize:'0.85rem', fontFamily:'Outfit,sans-serif', backdropFilter:'blur(8px)' }}
        >
          <ArrowLeft size={15} /> Arcade
        </button>
      </div>
      <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'3rem', animation:'spin 1s linear infinite' }}>🦊</div>
          <div style={{ color:theme.textMuted, fontWeight:600 }}>Loading game…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <GameComponent />
      </Suspense>
    </div>
  );
}
