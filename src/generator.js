// Crossword layout generator: greedy placement + random restarts.

const key = (r, c) => `${r},${c}`;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Can `word` be spelled using each wheel letter at most once?
export function canBuild(word, letters) {
  const pool = [...letters];
  for (const ch of word) {
    const i = pool.indexOf(ch);
    if (i === -1) return false;
    pool.splice(i, 1);
  }
  return true;
}

// grid: Map "r,c" -> { ch, across: bool, down: bool }
function canPlace(grid, word, row, col, dir) {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;

  // The cells just before and after the word must be empty, or it would extend another word
  if (grid.has(key(row - dr, col - dc))) return false;
  if (grid.has(key(row + dr * word.length, col + dc * word.length))) return false;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid.get(key(r, c));
    if (cell) {
      if (cell.ch !== word[i]) return false; // letter conflict
      if (cell[dir]) return false; // would overlap a word running the same way
      crossings++;
    } else if (grid.has(key(r + dc, c + dr)) || grid.has(key(r - dc, c - dr))) {
      return false; // empty cell touching a neighbour sideways would form an unintended word
    }
  }
  return crossings > 0; // must connect to the existing layout
}

function put(grid, placed, p) {
  const dr = p.dir === 'down' ? 1 : 0;
  const dc = p.dir === 'across' ? 1 : 0;
  [...p.word].forEach((ch, i) => {
    const k = key(p.row + dr * i, p.col + dc * i);
    const cell = grid.get(k) ?? { ch, across: false, down: false };
    cell[p.dir] = true;
    grid.set(k, cell);
  });
  placed.push(p);
}

// Every legal spot for `word`, found by lining its letters up with letters already on the grid
function candidates(grid, word) {
  const out = [];
  for (const [k, cell] of grid) {
    const [r, c] = k.split(',').map(Number);
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== cell.ch) continue;
      for (const dir of ['across', 'down']) {
        const row = dir === 'down' ? r - i : r;
        const col = dir === 'across' ? c - i : c;
        if (canPlace(grid, word, row, col, dir)) out.push({ word, row, col, dir });
      }
    }
  }
  return out;
}

// Shift so the top-left is (0,0) and report the grid size
function normalize(placed) {
  const ends = placed.map((p) => ({
    r2: p.row + (p.dir === 'down' ? p.word.length - 1 : 0),
    c2: p.col + (p.dir === 'across' ? p.word.length - 1 : 0),
  }));
  const minR = Math.min(...placed.map((p) => p.row));
  const minC = Math.min(...placed.map((p) => p.col));
  return {
    words: placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC })),
    rows: Math.max(...ends.map((e) => e.r2)) - minR + 1,
    cols: Math.max(...ends.map((e) => e.c2)) - minC + 1,
  };
}

// More words is better; among equals, a smaller bounding box wins
const score = (l) => l.words.length * 100 - l.rows * l.cols;

export function generate(words, { attempts = 300, maxWords = 6 } = {}) {
  const usable = [...new Set(words.filter((w) => w.length >= 3))];
  if (usable.length === 0) return null;

  let best = null;
  for (let a = 0; a < attempts; a++) {
    const pool = shuffle(usable).sort((x, y) => y.length - x.length); // longest first, ties random
    const grid = new Map();
    const placed = [];
    put(grid, placed, { word: pool[0], row: 0, col: 0, dir: 'across' });

    for (const w of pool.slice(1)) {
      if (placed.length >= maxWords) break;
      const options = candidates(grid, w);
      if (options.length) put(grid, placed, options[Math.floor(Math.random() * options.length)]);
    }

    const layout = normalize(placed);
    if (!best || score(layout) > score(best)) best = layout;
  }
  return best;
}

// Sanity check: every run of 2+ adjacent letters must be exactly one placed word
export function isValid(layout) {
  const cells = new Map();
  for (const p of layout.words) {
    [...p.word].forEach((ch, i) => {
      const r = p.row + (p.dir === 'down' ? i : 0);
      const c = p.col + (p.dir === 'across' ? i : 0);
      if (cells.has(key(r, c)) && cells.get(key(r, c)) !== ch) return cells.set('bad', 1);
      cells.set(key(r, c), ch);
    });
  }
  if (cells.has('bad')) return false;

  const wordSet = new Set(layout.words.map((p) => `${p.dir}:${p.row},${p.col}:${p.word}`));
  const check = (outer, inner, dir) => {
    for (let o = 0; o < outer; o++) {
      let run = '';
      let start = 0;
      for (let i = 0; i <= inner; i++) {
        const ch = cells.get(dir === 'across' ? key(o, i) : key(i, o));
        if (ch) {
          if (!run) start = i;
          run += ch;
        } else {
          if (run.length >= 2) {
            const k = dir === 'across' ? `across:${o},${start}:${run}` : `down:${start},${o}:${run}`;
            if (!wordSet.has(k)) return false;
          }
          run = '';
        }
      }
    }
    return true;
  };
  return check(layout.rows, layout.cols, 'across') && check(layout.cols, layout.rows, 'down');
}
