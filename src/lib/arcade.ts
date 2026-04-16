export interface GameDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
  players: string;
  tags: string[];
  color: string;
  hot?: boolean;
  isNew?: boolean;
}

export const GAMES: GameDef[] = [
  // ── Classic ──────────────────────────────────────────────────────────────────
  { id: 'tictactoe',  emoji: '🦊', title: 'FoxyTac',          description: 'Classic Tic-Tac-Toe — AI, local & online',  players: '1–2', tags: ['classic','ai','online'], color: '#818cf8', hot: true },
  { id: 'connect4',   emoji: '🔴', title: 'Connect Four',     description: 'Drop discs and connect 4 in a row',         players: '1–2', tags: ['classic','ai'],         color: '#ef4444', hot: true },
  { id: 'checkers',   emoji: '🔵', title: 'Checkers',         description: 'Classic draughts — kings, captures & AI',   players: '1–2', tags: ['classic','ai'],         color: '#fb923c' },
  { id: 'reversi',    emoji: '⚫', title: 'Reversi',          description: 'Flip your opponent\'s discs to win',        players: '1–2', tags: ['strategy','ai'],        color: '#a78bfa' },
  { id: 'rockpaper',  emoji: '✂️', title: 'Rock Paper Scissors', description: 'Best of 5 vs AI or a friend',           players: '1–2', tags: ['classic','quick'],      color: '#34d399' },
  { id: 'pong',       emoji: '🏓', title: 'Pong',             description: 'The original paddle battle',                players: '1–2', tags: ['classic','ai'],         color: '#38bdf8' },
  { id: 'battleship', emoji: '🚢', title: 'Battleship',       description: 'Place ships and sink the enemy fleet',      players: '1–2', tags: ['strategy','ai'],        color: '#38bdf8', isNew: true },
  // ── Puzzle ───────────────────────────────────────────────────────────────────
  { id: 'wordle',     emoji: '🟩', title: 'Wordle',           description: 'Guess the 5-letter word in 6 tries',        players: '1',   tags: ['puzzle','word'],        color: '#22c55e', hot: true },
  { id: 'sudoku',     emoji: '🔢', title: 'Sudoku',           description: 'Fill the grid — Easy, Medium, Hard',        players: '1',   tags: ['puzzle','logic'],       color: '#34d399', isNew: true },
  { id: 'memory',     emoji: '🃏', title: 'Memory Match',     description: 'Flip cards and find all pairs',             players: '1–2', tags: ['puzzle','memory'],      color: '#e879f9' },
  { id: 'sliding',    emoji: '🧩', title: '15 Puzzle',        description: 'Slide tiles to solve the number puzzle',    players: '1',   tags: ['puzzle','classic'],     color: '#f472b6' },
  { id: '2048',       emoji: '🔲', title: '2048',             description: 'Merge tiles to reach 2048',                 players: '1',   tags: ['puzzle','strategy'],    color: '#fbbf24', hot: true },
  { id: 'hangman',    emoji: '🪢', title: 'Hangman',          description: 'Guess the word before it\'s too late',      players: '1',   tags: ['puzzle','word'],        color: '#f87171' },
  { id: 'minesweeper',emoji: '💣', title: 'Minesweeper',      description: 'Uncover tiles without hitting mines',       players: '1',   tags: ['classic','puzzle'],     color: '#a78bfa' },
  // ── Arcade ───────────────────────────────────────────────────────────────────
  { id: 'snake',      emoji: '🐍', title: 'Snake',            description: 'Eat apples, grow longer, don\'t crash!',   players: '1',   tags: ['classic','arcade'],     color: '#22c55e', hot: true },
  { id: 'flappy',     emoji: '🐦', title: 'Flappy Bird',      description: 'Tap to fly through the pipes',             players: '1',   tags: ['arcade'],               color: '#86efac', isNew: true },
  { id: 'dino',       emoji: '🦕', title: 'Dino Run',         description: 'Jump over cacti — endless runner',         players: '1',   tags: ['arcade','endless'],     color: '#86efac' },
  { id: 'breakout',   emoji: '🧱', title: 'Breakout',         description: 'Smash all the bricks with your ball',      players: '1',   tags: ['classic','arcade'],     color: '#f59e0b' },
  { id: 'asteroids',  emoji: '🚀', title: 'Asteroids',        description: 'Shoot rocks in space, survive!',           players: '1',   tags: ['arcade','action'],      color: '#7dd3fc' },
  { id: 'whackamole', emoji: '🔨', title: 'Whack-a-Mole',    description: 'Whack the moles as fast as you can',       players: '1',   tags: ['arcade','action'],      color: '#a3e635', isNew: true },
  // ── Card & Dice ──────────────────────────────────────────────────────────────
  { id: 'blackjack',  emoji: '🃏', title: 'Blackjack',        description: 'Beat the dealer — hit, stand or double',   players: '1',   tags: ['card','casino'],        color: '#fcd34d' },
  { id: 'yahtzee',    emoji: '🎲', title: 'Yahtzee',          description: 'Roll dice and fill your scorecard',        players: '1–4', tags: ['dice','strategy'],      color: '#f97316' },
  // ── Memory & Reaction ────────────────────────────────────────────────────────
  { id: 'simon',      emoji: '🔴', title: 'Simon Says',       description: 'Repeat the colour sequence',               players: '1',   tags: ['memory','arcade'],      color: '#f472b6' },
];

export const TAGS = ['all','🔥 hot','classic','arcade','puzzle','strategy','ai','word','card','memory'];
