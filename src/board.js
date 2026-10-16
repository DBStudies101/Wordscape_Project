// Tiles light up one after another; the sound effect uses the same spacing to stay in sync
export const TILE_STAGGER_MS = 70;

export class Board {
  constructor(el) {
    this.el = el;
    this.revealed = new Set(); // keys of cells already shown, so only new ones animate
  }

  // Forget what was revealed (call when a different puzzle starts)
  reset() {
    this.revealed = new Set();
  }

  // Rebuilds the grid from a layout ({ words }); a cell is revealed if any word through it was found.
  // With animate: true, cells that just became visible light up in sequence.
  // Returns how many tiles lit up.
  render(layout, found, { animate = false } = {}) {
    const cells = new Map(); // "r,c" -> { letter, words: [] }
    let rows = 0;
    let cols = 0;

    for (const { word, row, col, dir } of layout.words) {
      [...word].forEach((letter, i) => {
        const r = row + (dir === 'down' ? i : 0);
        const c = col + (dir === 'across' ? i : 0);
        const key = `${r},${c}`;
        if (!cells.has(key)) cells.set(key, { letter, words: [] });
        cells.get(key).words.push(word);
        rows = Math.max(rows, r + 1);
        cols = Math.max(cols, c + 1);
      });
    }

    // CSS uses these to size the tiles so the grid always fits the screen
    this.el.style.setProperty('--cols', cols);
    this.el.style.setProperty('--rows', rows);
    this.el.replaceChildren();

    const nowRevealed = new Set();
    let lit = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const cell = cells.get(key);
        const div = document.createElement('div');
        if (!cell) {
          div.className = 'empty';
        } else if (cell.words.some((w) => found.has(w))) {
          nowRevealed.add(key);
          const isNew = animate && !this.revealed.has(key);
          div.className = isNew ? 'cell open lit' : 'cell open';
          if (isNew) div.style.animationDelay = `${lit++ * TILE_STAGGER_MS}ms`;
          div.textContent = cell.letter;
        } else {
          // Hidden cells hold no letter at all, so dragging or selecting can never reveal one
          div.className = 'cell';
        }
        this.el.append(div);
      }
    }
    this.revealed = nowRevealed;
    return lit;
  }
}
