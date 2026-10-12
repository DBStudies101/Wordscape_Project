import { Dictionary } from './dictionary.js';
import { generate } from './generator.js';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31); // fits a Postgres int

// A level is: { id, letters: ['H','E',...], pool: [every valid word], gridPool?: [words allowed on the grid] }
// A puzzle is a level plus a seed. Same level + same seed = same grid, every time.
export class Game {
  constructor(levels) {
    if (levels.length === 0) throw new Error('Game needs at least one level');
    this.levels = levels;
    this.number = 1; // how many puzzles the player has reached
    this.level = null;
    this.seed = null;
    this.layout = null;
    this.gridWords = new Set();
    this.found = new Set();
    this.bonus = new Set();
  }

  get complete() {
    return this.gridWords.size > 0 && this.found.size === this.gridWords.size;
  }

  // Everything needed to rebuild this exact puzzle later (this is what gets saved)
  get state() {
    return {
      levelId: this.level.id,
      seed: this.seed,
      found: [...this.found],
      bonus: [...this.bonus],
      number: this.number,
    };
  }

  // Rebuild a saved puzzle. Returns false if the save doesn't match any known level.
  restore(saved) {
    const level = this.levels.find((l) => l.id === saved?.levelId);
    if (!level || !Number.isInteger(saved.seed)) return false;

    this.#build(level, saved.seed);
    for (const w of saved.found ?? []) if (this.gridWords.has(w)) this.found.add(w);
    for (const w of saved.bonus ?? []) if (!this.gridWords.has(w) && this.dict.has(w)) this.bonus.add(w);
    if (Number.isInteger(saved.number) && saved.number >= 1) this.number = saved.number;
    return true;
  }

  // Start a brand-new puzzle, preferring a different letter set from the current one
  newPuzzle() {
    const others = this.levels.filter((l) => l.id !== this.level?.id);
    const options = others.length > 0 ? others : this.levels;
    const level = options[Math.floor(Math.random() * options.length)];
    this.#build(level, randomSeed());
  }

  // Called after finishing a puzzle: counts as progress, then starts a new one
  next() {
    this.number++;
    this.newPuzzle();
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

  #build(level, seed) {
    // Only common words go on the grid; every accepted word still counts as a bonus
    const source = level.gridPool?.length >= 3 ? level.gridPool : level.pool;
    const layout = generate(source, { seed }) ?? generate(level.pool, { seed });
    if (!layout) throw new Error(`Could not build a puzzle for level ${level.id}`);

    this.level = level;
    this.seed = seed;
    this.layout = layout;
    this.dict = new Dictionary(level.pool);
    this.gridWords = new Set(layout.words.map((w) => w.word));
    this.found = new Set();
    this.bonus = new Set();
  }
}
