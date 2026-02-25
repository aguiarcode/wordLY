import type { GameState, TileResult } from './game';
import {
  WORD_LEN,
  MAX_ROWS,
  createState,
  typeLetter,
  deleteLetter,
  submitGuess,
} from './game';
import { ANSWER } from './words';

/* ── Constants ── */
const FLIP_MS = 300;

const KB_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['↵','z','x','c','v','b','n','m','⌫'],
];

/* ── State ── */
let state: GameState = createState();
let busy = false;

/* ── Tile grid (DOM refs) ── */
interface TileRefs { el: HTMLElement; front: HTMLElement; back: HTMLElement }
let tiles: TileRefs[][] = [];

/* ── Init ── */
export function init() {
  buildBoard();
  buildKeyboard();
  document.addEventListener('keydown', onPhysical);
  document.getElementById('btn-again')!.addEventListener('click', reset);
}

/* ── Board ── */
function buildBoard() {
  const board = document.getElementById('board')!;
  board.innerHTML = '';
  tiles = [];

  for (let r = 0; r < MAX_ROWS; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    rowEl.id = `row-${r}`;
    const rowRefs: TileRefs[] = [];

    for (let c = 0; c < WORD_LEN; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';

      const inner = document.createElement('div');
      inner.className = 'tile-inner';

      const front = document.createElement('div');
      front.className = 'tile-face tile-front';

      const back = document.createElement('div');
      back.className = 'tile-face tile-back';

      inner.append(front, back);
      tile.append(inner);
      rowEl.append(tile);
      rowRefs.push({ el: tile, front, back });
    }

    board.append(rowEl);
    tiles.push(rowRefs);
  }
}

/* ── Keyboard ── */
function buildKeyboard() {
  const kb = document.getElementById('keyboard')!;
  kb.innerHTML = '';

  KB_ROWS.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'key-row';

    row.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key';
      if (k === '↵' || k === '⌫') btn.classList.add('wide');
      btn.textContent = k;
      btn.dataset.k = k;
      btn.addEventListener('click', () => onKey(k));
      rowEl.append(btn);
    });

    kb.append(rowEl);
  });
}

/* ── Input handlers ── */
function onPhysical(e: KeyboardEvent) {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  onKey(e.key);
}

function onKey(k: string) {
  if (busy || state.over) return;
  if (k === '↵' || k === 'Enter') handleSubmit();
  else if (k === '⌫' || k === 'Backspace') handleDelete();
  else if (/^[a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚ]$/.test(k)) handleType(k);
}

function handleType(letter: string) {
  const changed = typeLetter(state, letter);
  if (!changed) return;
  const col = state.currentCol - 1;
  const cell = tiles[state.currentRow][col];
  cell.front.textContent = letter;
  cell.front.classList.add('filled');
}

function handleDelete() {
  const prevCol = state.currentCol;
  const changed = deleteLetter(state);
  if (!changed) return;
  const cell = tiles[state.currentRow][prevCol - 1];
  cell.front.textContent = '';
  cell.front.classList.remove('filled');
}

function handleSubmit() {
  const rowIdx = state.currentRow;
  const result = submitGuess(state);

  if (!result.ok) {
    toast('Palavra incompleta!');
    shakeRow(rowIdx);
    return;
  }

  busy = true;
  revealRow(rowIdx, result.letters, result.results, () => {
    busy = false;
    updateKeys(state.keyStates);

    if (result.won) {
      bounceRow(rowIdx);
      setTimeout(() => showEnd(true), 500);
    } else if (result.lost) {
      setTimeout(() => showEnd(false), 400);
    }
  });
}

/* ── Reveal animation ── */
function revealRow(
  rowIdx: number,
  _letters: string[],
  results: TileResult[],
  onDone: () => void,
) {
  const row = tiles[rowIdx];

  row.forEach((cell, i) => {
    setTimeout(() => {
      cell.back.textContent = cell.front.textContent;
      cell.back.className = `tile-face tile-back ${results[i]}`;
      cell.el.classList.add('revealed');
    }, i * FLIP_MS);
  });

  setTimeout(onDone, WORD_LEN * FLIP_MS + 200);
}

/* ── Key colours ── */
function updateKeys(keyStates: Record<string, TileResult>) {
  document.querySelectorAll<HTMLButtonElement>('.key').forEach(btn => {
    const k = btn.dataset.k!;
    const s = keyStates[k];
    if (!s) return;
    btn.classList.remove('correct', 'present', 'absent');
    btn.classList.add(s);
  });
}

/* ── End state ── */
function showEnd(won: boolean) {
  const banner = document.getElementById('end-banner')!;
  const msg = document.getElementById('end-msg')!;

  if (won) {
    banner.className = 'end-banner win';
    msg.innerHTML = `eu acho que já sabias mas agora tens a certeza.`;
  } else {
    banner.className = 'end-banner lose';
    msg.innerHTML = `A palavra era <strong>${ANSWER.toUpperCase()}</strong> — não desanimes! 💕`;
  }

  banner.classList.add('show');
}

/* ── Row effects ── */
function shakeRow(r: number) {
  const rowEl = document.getElementById(`row-${r}`)!;
  rowEl.classList.add('shake');
  rowEl.addEventListener('animationend', () => rowEl.classList.remove('shake'), { once: true });
}

function bounceRow(r: number) {
  tiles[r].forEach((cell, i) => {
    cell.el.style.setProperty('--d', `${i * 80}ms`);
    cell.el.classList.add('win-bounce');
  });
}

/* ── Toast ── */
let toastTimer = 0;
function toast(msg: string, ms = 1600) {
  const el = document.getElementById('toast')!;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), ms);
}

/* ── Reset ── */
function reset() {
  state = createState();
  busy = false;

  document.getElementById('end-banner')!.className = 'end-banner';

  buildBoard();
  buildKeyboard();
}
