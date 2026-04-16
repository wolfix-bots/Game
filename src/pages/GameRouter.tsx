import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

import TicTacToe from './TicTacToePage';
import Connect4 from '../games/Connect4';
import Snake from '../games/Snake';
import Game2048 from '../games/Game2048';
import Wordle from '../games/Wordle';
import Minesweeper from '../games/Minesweeper';
import Memory from '../games/Memory';
import Blackjack from '../games/Blackjack';
import RockPaperScissors from '../games/RockPaperScissors';
import Hangman from '../games/Hangman';
import Pong from '../games/Pong';
import WhackAMole from '../games/WhackAMole';
import Flappy from '../games/Flappy';
import Reversi from '../games/Reversi';
import Simon from '../games/Simon';
import Checkers from '../games/Checkers';
import Battleship from '../games/Battleship';
import Yahtzee from '../games/Yahtzee';
import Sudoku from '../games/Sudoku';
import Dino from '../games/Dino';
import Breakout from '../games/Breakout';
import Sliding from '../games/Sliding';
import Asteroids from '../games/Asteroids';

const GAME_MAP: Record<string, React.ComponentType<any>> = {
  tictactoe: TicTacToe,
  connect4: Connect4,
  snake: Snake,
  '2048': Game2048,
  wordle: Wordle,
  minesweeper: Minesweeper,
  memory: Memory,
  blackjack: Blackjack,
  rockpaper: RockPaperScissors,
  hangman: Hangman,
  pong: Pong,
  whackamole: WhackAMole,
  flappy: Flappy,
  reversi: Reversi,
  simon: Simon,
  checkers: Checkers,
  battleship: Battleship,
  yahtzee: Yahtzee,
  sudoku: Sudoku,
  dino: Dino,
  breakout: Breakout,
  sliding: Sliding,
  asteroids: Asteroids,
};

export default function GameRouter() {
  const { gameId } = useParams<{ gameId: string }>();
  const Component = gameId ? GAME_MAP[gameId] : null;
  if (!Component) return <Navigate to="/" replace />;
  return <Component />;
}
