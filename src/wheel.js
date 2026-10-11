const SIZE = 280;
const RADIUS = 100;
const TILE = 52;
const SVG_NS = 'http://www.w3.org/2000/svg';

export class Wheel {
  constructor(el, { onChange, onSubmit }) {
    this.el = el;
    this.onChange = onChange;
    this.onSubmit = onSubmit;
    this.letters = [];
    this.path = []; // indices of selected letters, in order
    this.dragging = false;

    el.addEventListener('pointerdown', (e) => this.#start(e));
    el.addEventListener('pointermove', (e) => this.#move(e));
    el.addEventListener('pointerup', () => this.#end());
    el.addEventListener('pointercancel', () => this.#end());
  }

  setLetters(letters) {
    this.letters = [...letters];
    this.#layout();
  }

  shuffle() {
    for (let i = this.letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
    }
    this.#layout();
  }

  #layout() {
    const n = this.letters.length;
    this.centers = this.letters.map((_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return { x: SIZE / 2 + RADIUS * Math.cos(angle), y: SIZE / 2 + RADIUS * Math.sin(angle) };
    });

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    this.line = document.createElementNS(SVG_NS, 'polyline');
    this.svg.append(this.line);

    this.tiles = this.letters.map((letter, i) => {
      const d = document.createElement('div');
      d.className = 'letter';
      d.textContent = letter;
      d.style.left = `${this.centers[i].x - TILE / 2}px`;
      d.style.top = `${this.centers[i].y - TILE / 2}px`;
      return d;
    });

    this.el.replaceChildren(this.svg, ...this.tiles);
    this.#clear();
  }

  #pointerPos(e) {
    const rect = this.el.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * SIZE, y: ((e.clientY - rect.top) / rect.height) * SIZE };
  }

  // Distance-based hit test: more forgiving than elementFromPoint on touch screens.
  #letterAt({ x, y }) {
    return this.centers.findIndex((c) => Math.hypot(c.x - x, c.y - y) < TILE / 2);
  }

  #start(e) {
    const idx = this.#letterAt(this.#pointerPos(e));
    if (idx === -1) return;
    this.dragging = true;
    this.el.setPointerCapture(e.pointerId);
    this.path = [idx];
    this.#render(this.#pointerPos(e));
  }

  #move(e) {
    if (!this.dragging) return;
    const pos = this.#pointerPos(e);
    const idx = this.#letterAt(pos);
    const last = this.path.length - 1;
    if (idx !== -1) {
      if (idx === this.path[last - 1]) this.path.pop(); // dragged back: undo last letter
      else if (!this.path.includes(idx)) this.path.push(idx);
    }
    this.#render(pos);
  }

  #end() {
    if (!this.dragging) return;
    const word = this.#word();
    this.dragging = false;
    this.#clear();
    this.onSubmit(word);
  }

  #word() {
    return this.path.map((i) => this.letters[i]).join('');
  }

  #render(pointer) {
    const pts = this.path.map((i) => this.centers[i]);
    if (pointer) pts.push(pointer);
    this.line.setAttribute('points', pts.map((p) => `${p.x},${p.y}`).join(' '));
    this.tiles.forEach((t, i) => t.classList.toggle('on', this.path.includes(i)));
    this.onChange(this.#word());
  }

  #clear() {
    this.path = [];
    this.line.setAttribute('points', '');
    this.tiles.forEach((t) => t.classList.remove('on'));
    this.onChange('');
  }
}
