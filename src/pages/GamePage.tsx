import React, { Suspense, lazy } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { User } from '../lib/auth';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Lazy load all games
const TicTacToe = lazy(() => import('./TicTacToePage'));
const Connect4   = lazy(() => import('../games/Connect4'));
const Snake      = lazy(() => import('../games/Snake'));
const Game2048   = lazy(() => import('../games/Game2048'));
const Wordle     = lazy(() => import('../games/Wordle'));
const Minesweeper = lazy(() => import('../games/Minesweeper'));
const Memory     = lazy(() => import('../games/Memory'));
const Blackjack  = lazy(() => import('../games/Blackjack'));
const RockPaper  = lazy(() => import('../games/RockPaperScissors'));
const Hangman    = lazy(() => import('../games/Hangman'));
const Pong       = lazy(() => import('../games/Pong'));
const WhackAMole = lazy(() => import('../games/WhackAMole'));
const Flappy     = lazy(() => import('../games/Flappy'));
const Reversi    = lazy(() => import('../games/Reversi'));
const Simon      = lazy(() => import('../games/Simon'));
const Sudoku     = lazy(() => import('../games/Sudoku'));
const Dino       = lazy(() => import('../games/Dino'));
const Battleship = lazy(() => import('../games/Battleship'));
const Checkers   = lazy(() => import('../games/Checkers'));
const Yahtzee    = lazy(() => import('../games/Yahtzee'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GAME_MAP: Record<string, React.LazyExoticComponent<any>> = {
  tictactoe: TicTacToe,
  connect4: Connect4,
  snake: Snake,
  '2048': Game2048,
  wordle: Wordle,
  minesweeper: Minesweeper,
  memory: Memory,
  blackjack: Blackjack,
  rockpaper: RockPaper,
  hangman: Hangman,
  pong: Pong,
  whackamole: WhackAMole,
  flappy: Flappy,
  reversi: Reversi,
  simon: Simon,
  sudoku: Sudoku,
  dino: Dino,
  battleship: Battleship,
  checkers: Checkers,
  yahtzee: Yahtzee,
};

function Loader() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🦊</div>
      <div style={{ color: '#94a3b8', fontFamily: 'Outfit,sans-serif', fontWeight: 600 }}>Loading game…</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GamePage({ user }: { user: User | null }) {
  const { gameId } = useParams<{ gameId: string }>();
  const GameComponent = gameId ? GAME_MAP[gameId] : null;

  if (!GameComponent) return <Navigate to="/" replace />;

  return (
    <Suspense fallback={<Loader />}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {React.createElement(GameComponent as any, { user })}
    </Suspense>
  );
}
