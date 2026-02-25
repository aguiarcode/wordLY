import { ANSWER, VALID_WORDS } from './words';

export const WORD_LEN = 5;
export const MAX_ROWS = 6;

export type TileResult = 'correct' | 'present' | 'absent';

export type SubmitResult =
  | { ok: true; letters: string[]; results: TileResult[]; won: boolean; lost: boolean }
  | { ok: false; reason: 'incomplete' | 'unknown' };

export interface GameState {
  /** Current letters typed, per row */
  rows: string[][];
  /** Evaluated results, per row (filled after submit) */
  results: (TileResult[] | null)[];
  currentRow: number;
  currentCol: number;
  over: boolean;
  won: boolean;
  /** Best known state per letter key */
  keyStates: Record<string, TileResult>;
}

export function createState(): GameState {
  return {
    rows: Array.from({ length: MAX_ROWS }, () => Array(WORD_LEN).fill('')),
    results: Array(MAX_ROWS).fill(null),
    currentRow: 0,
    currentCol: 0,
    over: false,
    won: false,
    keyStates: {},
  };
}

export function typeLetter(state: GameState, letter: string): boolean {
  if (state.over || state.currentCol >= WORD_LEN) return false;
  state.rows[state.currentRow][state.currentCol] = letter.toLowerCase();
  state.currentCol++;
  return true;
}

export function deleteLetter(state: GameState): boolean {
  if (state.over || state.currentCol <= 0) return false;
  state.currentCol--;
  state.rows[state.currentRow][state.currentCol] = '';
  return true;
}

export function submitGuess(state: GameState): SubmitResult {
  if (state.over) return { ok: false, reason: 'incomplete' };
  if (state.currentCol < WORD_LEN) return { ok: false, reason: 'incomplete' };

  const letters = state.rows[state.currentRow];
  const guess = letters.join('');

  if (!VALID_WORDS.has(guess)) return { ok: false, reason: 'unknown' };

  const results = evaluate(guess);
  state.results[state.currentRow] = results;

  // Update key states
  results.forEach((res, i) => {
    const l = letters[i];
    const cur = state.keyStates[l];
    if (cur === 'correct') return;
    if (res === 'correct') state.keyStates[l] = 'correct';
    else if (res === 'present') state.keyStates[l] = 'present';
    else if (!cur) state.keyStates[l] = 'absent';
  });

  const won = guess === ANSWER;
  const lost = !won && state.currentRow === MAX_ROWS - 1;

  if (won || lost) state.over = true;
  if (won) state.won = true;

  if (!won && !lost) {
    state.currentRow++;
    state.currentCol = 0;
  }

  return { ok: true, letters, results, won, lost };
}

function evaluate(guess: string): TileResult[] {
  const res: TileResult[] = Array(WORD_LEN).fill('absent');
  const ansArr = ANSWER.split('');
  const guessArr = guess.split('');
  const ansUsed = Array(WORD_LEN).fill(false);
  const guessUsed = Array(WORD_LEN).fill(false);

  for (let i = 0; i < WORD_LEN; i++) {
    if (guessArr[i] === ansArr[i]) {
      res[i] = 'correct';
      ansUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < WORD_LEN; j++) {
      if (!ansUsed[j] && guessArr[i] === ansArr[j]) {
        res[i] = 'present';
        ansUsed[j] = true;
        break;
      }
    }
  }

  return res;
}
