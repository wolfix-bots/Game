import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { User } from '../lib/auth';

// Lazy load every game
const TicTacToe  = lazy(() => import('./TicTacToePage'));
const Connect4   = lazy(() => import('../games/Connect4'));
const Snake      = lazy(() => import('../games/Snake'));
const Breakout   = lazy(() => import('../games/Breakout'));
const Pong       = lazy(() => import('../games/Pong'));
const Minesweeper= lazy(() => import('../games/Minesweeper'));
const Checkers   = lazy(() => import('../games/Checkers'));
const Sudoku     = lazy(() => import('../games/Sudoku'));
const Wordle     = lazy(() => import('../games/Wordle'));
const Memory     = lazy(() => import('../games/Memory'));
const Sliding    = lazy(() => import('../games/Sliding'));
const Game2048   = lazy(() => import('../games/Game2048'));
const Hangman    = lazy(() => import('../games/Hangman'));
const Flappy     = lazy(() => import('../games/Flappy'));
const Asteroids  = lazy(() => import('../games/Asteroids'));
const WhackAMole = lazy(() => import('../games/WhackAMole'));
const Dino       = lazy(() => import('../games/Dino'));
const Blackjack  = lazy(() => import('../games/Blackjack'));
const Yahtzee    = lazy(() => import('../games/Yahtzee'));
const Battleship = lazy(() => import('../games/Battleship'));
const Reversi    = lazy(() => import('../games/Reversi'));
const Simon      = lazy(() => import('../games/Simon'));
const RPS        = lazy(() => import('../games/RockPaperScissors'));

const GAME_MAP: Record<string, React.LazyExoticComponent<any>> = {
  tictactoe: TicTacToe,
  connect4: Connect4,
  snake: Snake,
  breakout: Breakout,
  pong: Pong,
  minesweeper: Minesweeper,
  checkers: Checkers,
  sudoku: Sudoku,
  wordle: Wordle,
  memory: Memory,
  sliding: Sliding,
  '2048': Game2048,
  hangman: Hangman,
  flappy: Flappy,
  asteroids: Asteroids,
  whackamole: WhackAMole,
  dino: Dino,
  blackjack: Blackjack,
  yahtzee: Yahtzee,
  battleship: Battleship,
  reversi: Reversi,
  simon: Simon,
  rockpaper: RPS,
};

interface Props {
  user: User | null;
  onLogout: () => void;
  onAvatarChange: (u: User) => void;
}

const Loader = () => (
  <div style={{
    minHeight: '100vh', background: '#0f172a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 16, fontFamily: "'Outfit',sans-serif",
  }}>
    <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🦊</div>
    <div style={{ color: '#475569', fontWeight: 600 }}>Loading game…</div>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function GamePage({ user, onLogout, onAvatarChange }: Props) {
  const { id } = useParams<{ id: string }>();
  const Game = id ? GAME_MAP[id] : null;
  if (!Game) return <Navigate to="/" replace />;

  const AnyGame = Game as React.ComponentType<any>;
  return (
    <Suspense fallback={<Loader />}>
      <AnyGame user={user} onLogout={onLogout} onAvatarChange={onAvatarChange} />
    </Suspense>
  );
}
