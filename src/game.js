import { Dictionary } from './dictionary.js';

export class Game {
  constructor(levels) {
    this.levels = levels;
    this.index = 0;
    this.load();
  }

  get level() {
    return this.levels[this.index];
  }

  get complete() {
    return this.found.size === this.gridWords.size;
  }

  load() {
    const { words, bonus } = this.level;
    this.gridWords = new Set(words.map((w) => w.word));
    this.dict = new Dictionary([...this.gridWords, ...bonus]);
    this.found = new Set();
    this.bonus = new Set();
  }

  // Returns 'short' | 'repeat' | 'grid' | 'bonus' | 'invalid'
  submit(word) {
    if (word.length < 3) return 'short';
    if (this.found.has(word) || this.bonus.has(word)) return 'repeat';
    if (this.gridWords.has(word)) {
      this.found.add(word);
      return 'grid';
    }
    if (this.dict.has(word)) {
      this.bonus.add(word);
      return 'bonus';
    }
    return 'invalid';
  }
  goTo(index) {
    this.index = Math.min(Math.max(index, 0), this.levels.length - 1);
    this.load();
  }
  next() {
    if (this.index >= this.levels.length - 1) return false;
    this.index++;
    this.load();
    return true;
  }
}
