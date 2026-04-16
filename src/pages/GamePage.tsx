import React, { Suspense, lazy } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { User } from '../lib/auth';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Lazy-load every game ──────────────────────────────────────────────────────
const TicTacToe   = lazy(() => import('./TicTacToePage'));
const Connect4    = lazy(() => import('../games/Connect4'));
const Snake       = lazy(() => import('../games/Snake'));
const Game2048    = lazy(() => import('../games/Game2048'));
const Wordle      = lazy(() => import('../games/Wordle'));
const Minesweeper = lazy(() => import('../games/Minesweeper'));
const Memory      = lazy(() => import('../games/Memory'));
const Blackjack   = lazy(() => import('../games/Blackjack'));
const RockPaper   = lazy(() => import('../games/RockPaperScissors'));
const Hangman     = lazy(() => import('../games/Hangman'));
const Pong        = lazy(() => import('../games/Pong'));
const WhackAMole  = lazy(() => import('../games/WhackAMole'));
const Flappy      = lazy(() => import('../games/Flappy'));
const Reversi     = lazy(() => import('../games/Reversi'));
const Simon       = lazy(() => import('../games/Simon'));
const Sudoku      = lazy(() => import('../games/Sudoku'));
const Dino        = lazy(() => import('../games/Dino'));
const Battleship  = lazy(() => import('../games/Battleship'));
const Checkers    = lazy(() => import('../games/Checkers'));
const Yahtzee     = lazy(() => import('../games/Yahtzee'));
const Chess       = lazy(() => import('../games/Chess'));
const Asteroids   = lazy(() => import('../games/Asteroids'));
const Sliding     = lazy(() => import('../games/Sliding'));

// ── Game map ──────────────────────────────────────────────────────────────────
const GAME_MAP: Record<string, React.LazyExoticComponent<any>> = {
  tictactoe:   TicTacToe,
  connect4:    Connect4,
  snake:       Snake,
  '2048':      Game2048,
  wordle:      Wordle,
  minesweeper: Minesweeper,
  memory:      Memory,
  blackjack:   Blackjack,
  rockpaper:   RockPaper,
  hangman:     Hangman,
  pong:        Pong,
  whackamole:  WhackAMole,
  flappy:      Flappy,
  reversi:     Reversi,
  simon:       Simon,
  sudoku:      Sudoku,
  dino:        Dino,
  battleship:  Battleship,
  checkers:    Checkers,
  yahtzee:     Yahtzee,
  chess:       Chess,
  asteroids:   Asteroids,
  sliding:     Sliding,
};

function Loader() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🦊</div>
      <div style={{ color: '#94a3b8', fontWeight: 600 }}>Loading game…</div>
      <button onClick={() => nav('/')} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '10px', padding: '8px 16px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit,sans-serif' }}>
        <ArrowLeft size={14} /> Back to Arcade
      </button>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GamePage({ user }: { user: User }) {
  const { gameId } = useParams<{ gameId: string }>();
  const GameComponent = gameId ? GAME_MAP[gameId] : null;
  if (!GameComponent) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<Loader />}>
      {React.createElement(GameComponent as React.ComponentType<any>, { user })}
    </Suspense>
  );
}
