export class Board {
  constructor(el) {
    this.el = el;
  }

  // Rebuilds the grid from a layout ({ words }); a cell is revealed if any word through it was found.
  render(layout, found) {
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

    this.el.style.setProperty('--cols', cols);
    this.el.replaceChildren();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells.get(`${r},${c}`);
        const div = document.createElement('div');
        if (!cell) {
          div.className = 'empty';
        } else if (cell.words.some((w) => found.has(w))) {
          div.className = 'cell open';
          div.textContent = cell.letter;
        } else {
          // Hidden cells hold no letter at all, so dragging or selecting can never reveal one
          div.className = 'cell';
        }
        this.el.append(div);
      }
    }
  }
}
