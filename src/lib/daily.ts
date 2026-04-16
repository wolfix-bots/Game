export interface DailyPuzzle {
  id: string;
  board: string[];
  solution: number;
  title: string;
  hint: string;
}

const PUZZLES: DailyPuzzle[] = [
  { id: 'p1', board: ['X','O','X','O','X','','','O',''], solution: 6, title: 'Win in 1!', hint: 'X needs the bottom-left corner' },
  { id: 'p2', board: ['O','X','','','X','','','O',''], solution: 8, title: 'Finish It!', hint: 'X is close to the diagonal' },
  { id: 'p3', board: ['X','','O','','X','','O','',''], solution: 8, title: 'Diagonal Strike', hint: 'Follow the main diagonal' },
  { id: 'p4', board: ['','X','O','X','O','','X','',''], solution: 3, title: 'Block & Win', hint: 'X can win on the left column' },
  { id: 'p5', board: ['O','O','','X','X','','','',''], solution: 5, title: 'Double Threat', hint: 'X wins on the right side' },
  { id: 'p6', board: ['X','O','X','','O','','','',''], solution: 7, title: 'Block the O!', hint: 'O is about to win vertically' },
  { id: 'p7', board: ['X','X','','O','O','','','',''], solution: 2, title: 'Race to Win', hint: 'Top row almost complete for X' },
];

export function getTodaysPuzzle(): DailyPuzzle {
  const day = Math.floor(Date.now() / 86400000);
  return PUZZLES[day % PUZZLES.length];
}

export function isDailyDone(): boolean {
  return localStorage.getItem('foxy-daily') === new Date().toDateString();
}

export function markDailyDone() {
  localStorage.setItem('foxy-daily', new Date().toDateString());
}
