export interface ScoreData {
  wins: number;
  losses: number;
  draws: number;
}

export type ScoreMode = 'local' | 'ai-easy' | 'ai-medium' | 'ai-hard' | 'online';

export function getScores(mode: ScoreMode): ScoreData {
  try {
    const raw = localStorage.getItem(`ttt-scores-${mode}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0, draws: 0 };
}

export function saveScore(mode: ScoreMode, result: 'win' | 'loss' | 'draw') {
  const scores = getScores(mode);
  if (result === 'win') scores.wins++;
  else if (result === 'loss') scores.losses++;
  else scores.draws++;
  localStorage.setItem(`ttt-scores-${mode}`, JSON.stringify(scores));
}

export function resetScores(mode: ScoreMode) {
  localStorage.removeItem(`ttt-scores-${mode}`);
}

export function getAllScores(): Record<ScoreMode, ScoreData> {
  const modes: ScoreMode[] = ['local', 'ai-easy', 'ai-medium', 'ai-hard', 'online'];
  const result = {} as Record<ScoreMode, ScoreData>;
  for (const m of modes) result[m] = getScores(m);
  return result;
}
