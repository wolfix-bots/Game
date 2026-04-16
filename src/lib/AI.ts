export type Board = string[];
export type Difficulty = 'easy' | 'medium' | 'hard';

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

export function checkWinner(board: Board): string | null {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function getWinningLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return board.every(cell => cell !== '') && !checkWinner(board);
}

function getEmptyCells(board: Board): number[] {
  return board.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);
}

function minimax(board: Board, isMaximizing: boolean, alpha: number, beta: number, depth: number): number {
  const winner = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (isDraw(board)) return 0;

  const empty = getEmptyCells(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empty) {
      board[i] = 'O';
      const score = minimax(board, false, alpha, beta, depth + 1);
      board[i] = '';
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      board[i] = 'X';
      const score = minimax(board, true, alpha, beta, depth + 1);
      board[i] = '';
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function bestMinimax(board: Board): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  const empty = getEmptyCells(board);
  for (const i of empty) {
    board[i] = 'O';
    const score = minimax(board, false, -Infinity, Infinity, 0);
    board[i] = '';
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function blockingMove(board: Board): number {
  // Try to win
  for (const i of getEmptyCells(board)) {
    board[i] = 'O';
    if (checkWinner(board) === 'O') { board[i] = ''; return i; }
    board[i] = '';
  }
  // Try to block
  for (const i of getEmptyCells(board)) {
    board[i] = 'X';
    if (checkWinner(board) === 'X') { board[i] = ''; return i; }
    board[i] = '';
  }
  return -1;
}

export function getAIMove(board: Board, difficulty: Difficulty): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === 'medium') {
    if (Math.random() < 0.7) {
      const block = blockingMove(board);
      if (block !== -1) return block;
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: unbeatable minimax
  return bestMinimax(board);
}

export const AI_COMMENTARY: Record<string, string[]> = {
  win: ['Too easy! 🤖', 'Unbeatable! 😈', 'Better luck next time!', 'I calculated that!'],
  lose: ['Impossible... 😱', 'You got lucky!', 'I let you win 😏', 'Impressive human!'],
  draw: ['A worthy opponent!', 'Stalemate... 🤝', 'You can\'t beat me!', 'Almost had me!'],
  move: ['Nice try!', 'Interesting move...', 'I see your plan 👀', 'Predictable!', 'Hmm...', 'Bold choice!'],
};

export function getCommentary(type: keyof typeof AI_COMMENTARY): string {
  const arr = AI_COMMENTARY[type];
  return arr[Math.floor(Math.random() * arr.length)];
}
