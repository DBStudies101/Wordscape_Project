export class Board {
  constructor(el) {
    this.el = el;
  }

  // Rebuilds the grid from level data; a cell is revealed if any word through it was found.
  render(level, found) {
    const cells = new Map(); // "r,c" -> { letter, words: [] }
    let rows = 0;
    let cols = 0;

    for (const { word, row, col, dir } of level.words) {
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

    this.el.style.setProperty('--cols', cols);
    this.el.replaceChildren();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells.get(`${r},${c}`);
        const div = document.createElement('div');
        if (!cell) {
          div.className = 'empty';
        } else {
          const open = cell.words.some((w) => found.has(w));
          div.className = open ? 'cell open' : 'cell';
          div.textContent = cell.letter;
        }
        this.el.append(div);
      }
    }
  }
}
