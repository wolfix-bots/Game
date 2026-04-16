import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AuthScreen from './components/AuthScreen';
import ArcadeHub from './pages/ArcadeHub';

// Games
import TicTacToe from './pages/TicTacToePage';
import Connect4 from './games/Connect4';
import Snake from './games/Snake';
import Game2048 from './games/Game2048';
import Wordle from './games/Wordle';
import Minesweeper from './games/Minesweeper';
import Memory from './games/Memory';
import Blackjack from './games/Blackjack';
import RockPaperScissors from './games/RockPaperScissors';
import Hangman from './games/Hangman';
import Pong from './games/Pong';
import WhackAMole from './games/WhackAMole';
import Flappy from './games/Flappy';
import Reversi from './games/Reversi';
import Simon from './games/Simon';
import Sudoku from './games/Sudoku';
import Checkers from './games/Checkers';
import Battleship from './games/Battleship';
import Yahtzee from './games/Yahtzee';
import DinoRun from './games/DinoRun';
import SlidingPuzzle from './games/SlidingPuzzle';
import Asteroids from './games/Asteroids';

import { THEMES } from './lib/themes';
import { getSession, logout, User } from './lib/auth';
import './styles.css';
import './index.css';

export default function App() {
  const [user, setUser] = useState<User | null>(() => getSession());
  const [isGuest, setIsGuest] = useState(false);

  if (!user && !isGuest) {
    return (
      <AuthScreen
        theme={THEMES['night']}
        onAuth={u => setUser(u)}
        onGuest={() => setIsGuest(true)}
      />
    );
  }

  const handleLogout = () => { logout(); setUser(null); setIsGuest(false); };
  const handleAvatarChange = (u: User) => setUser(u);

  return (
    <Routes>
      <Route path="/" element={
        <ArcadeHub
          theme={THEMES['night']}
          user={user}
          onLogout={handleLogout}
          onAvatarChange={handleAvatarChange}
        />
      } />
      <Route path="/game/tictactoe"   element={<TicTacToe user={user} onLogout={handleLogout} onAvatarChange={handleAvatarChange} />} />
      <Route path="/game/connect4"    element={<Connect4 />} />
      <Route path="/game/snake"       element={<Snake />} />
      <Route path="/game/2048"        element={<Game2048 />} />
      <Route path="/game/wordle"      element={<Wordle />} />
      <Route path="/game/minesweeper" element={<Minesweeper />} />
      <Route path="/game/memory"      element={<Memory />} />
      <Route path="/game/blackjack"   element={<Blackjack />} />
      <Route path="/game/rockpaper"   element={<RockPaperScissors />} />
      <Route path="/game/hangman"     element={<Hangman />} />
      <Route path="/game/pong"        element={<Pong />} />
      <Route path="/game/whackamole"  element={<WhackAMole />} />
      <Route path="/game/flappy"      element={<Flappy />} />
      <Route path="/game/reversi"     element={<Reversi />} />
      <Route path="/game/simon"       element={<Simon />} />
      <Route path="/game/sudoku"      element={<Sudoku />} />
      <Route path="/game/checkers"    element={<Checkers />} />
      <Route path="/game/battleship"  element={<Battleship />} />
      <Route path="/game/yahtzee"     element={<Yahtzee />} />
      <Route path="/game/dino"        element={<DinoRun />} />
      <Route path="/game/sliding"     element={<SlidingPuzzle />} />
      <Route path="/game/asteroids"   element={<Asteroids />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
