import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { User } from '../lib/auth';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Lazy-load every game for fast initial load
const TicTacToe  = lazy(() => import('./TicTacToePage'));
const Connect4   = lazy(() => import('../games/Connect4'));
const Snake      = lazy(() => import('../games/Snake'));
const Game2048   = lazy(() => import('../games/Game2048'));
const Wordle     = lazy(() => import('../games/Wordle'));
const Minesweeper= lazy(() => import('../games/Minesweeper'));
const Memory     = lazy(() => import('../games/Memory'));
const Blackjack  = lazy(() => import('../games/Blackjack'));
const RPS        = lazy(() => import('../games/RockPaperScissors'));
const Hangman    = lazy(() => import('../games/Hangman'));
const Pong       = lazy(() => import('../games/Pong'));
const WhackAMole = lazy(() => import('../games/WhackAMole'));
const Flappy     = lazy(() => import('../games/Flappy'));
const Reversi    = lazy(() => import('../games/Reversi'));
const Simon      = lazy(() => import('../games/Simon'));
const Sudoku     = lazy(() => import('../games/Sudoku'));
const Checkers   = lazy(() => import('../games/Checkers'));
const Dino       = lazy(() => import('../games/Dino'));

const GAME_MAP: Record<string, React.LazyExoticComponent<any>> = {
  tictactoe:  TicTacToe,
  connect4:   Connect4,
  snake:      Snake,
  '2048':     Game2048,
  wordle:     Wordle,
  minesweeper:Minesweeper,
  memory:     Memory,
  blackjack:  Blackjack,
  rockpaper:  RPS,
  hangman:    Hangman,
  pong:       Pong,
  whackamole: WhackAMole,
  flappy:     Flappy,
  reversi:    Reversi,
  simon:      Simon,
  sudoku:     Sudoku,
  checkers:   Checkers,
  dino:       Dino,
};

function LoadingScreen() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e293b)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', gap:'16px' }}>
      <div style={{ fontSize:'3rem', animation:'spin 1s linear infinite' }}>🦊</div>
      <div style={{ color:'#94a3b8', fontWeight:700 }}>Loading game…</div>
      <button onClick={() => nav('/')} style={{ background:'transparent', border:'1px solid #334155', borderRadius:'10px', padding:'8px 16px', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:'Outfit,sans-serif' }}>
        <ArrowLeft size={14} /> Back to Arcade
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

interface Props { user: User | null; }

export default function GameRouter({ user }: Props) {
  const { gameId } = useParams<{ gameId: string }>();
  if (!gameId) return <Navigate to="/" replace />;

  const GameComponent = GAME_MAP[gameId];
  if (!GameComponent) return <Navigate to="/" replace />;

  const AnyGame = GameComponent as React.ComponentType<any>;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AnyGame user={user} />
    </Suspense>
  );
}
