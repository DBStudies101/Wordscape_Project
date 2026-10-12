import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

const LEVELS = [
  { id: 1, letters: ['T', 'E', 'A'], pool: ['EAT', 'TEA', 'ATE', 'ETA'] },
  { id: 2, letters: ['O', 'L', 'D'], pool: ['OLD', 'DOL', 'LOD'] },
  { id: 3, letters: ['H', 'E', 'A', 'R', 'T'], pool: ['HEART', 'EARTH', 'HATER', 'HEAR', 'HATE', 'HEAT', 'TEAR', 'RATE', 'HAT', 'EAT', 'TEA'] },
];

// Helper: a word that is on the grid, and a valid word that is not
const gridWord = (game) => [...game.gridWords][0];
const bonusWord = (game) => game.level.pool.find((w) => !game.gridWords.has(w));

describe('Game.submit', () => {
  let game;
  beforeEach(() => {
    game = new Game(LEVELS);
    game.restore({ levelId: 3, seed: 42 });
  });

  it('rejects words shorter than 3 letters', () => {
    expect(game.submit('EA')).toBe('short');
  });

  it('recognises a grid word and records it', () => {
    const word = gridWord(game);
    expect(game.submit(word)).toBe('grid');
    expect(game.found.has(word)).toBe(true);
  });

  it('recognises a valid word that is not on the grid as a bonus word', () => {
    const word = bonusWord(game);
    expect(game.submit(word)).toBe('bonus');
    expect(game.bonus.size).toBe(1);
    expect(game.found.size).toBe(0);
  });

  it('rejects words that are not in the word list', () => {
    expect(game.submit('TTT')).toBe('invalid');
  });

  it('reports repeats for both grid and bonus words', () => {
    const g = gridWord(game);
    const b = bonusWord(game);
    game.submit(g);
    game.submit(b);
    expect(game.submit(g)).toBe('repeat');
    expect(game.submit(b)).toBe('repeat');
  });

  it('is complete only once every grid word is found', () => {
    expect(game.complete).toBe(false);
    for (const w of game.gridWords) game.submit(w);
    expect(game.complete).toBe(true);
  });
});

describe('puzzles: same seed, same puzzle', () => {
  it('restore() rebuilds the identical layout from level + seed', () => {
    const a = new Game(LEVELS);
    const b = new Game(LEVELS);
    a.restore({ levelId: 3, seed: 12345 });
    b.restore({ levelId: 3, seed: 12345 });
    expect(b.layout).toEqual(a.layout);
  });

  it('different seeds can produce different layouts', () => {
    const layouts = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const g = new Game(LEVELS);
      g.restore({ levelId: 3, seed });
      layouts.add(JSON.stringify(g.layout));
    }
    expect(layouts.size).toBeGreaterThan(1);
  });

  it('state survives a save/restore round trip, including found words', () => {
    const a = new Game(LEVELS);
    a.restore({ levelId: 3, seed: 777 });
    a.submit(gridWord(a));
    a.submit(bonusWord(a));

    const b = new Game(LEVELS);
    expect(b.restore(a.state)).toBe(true);
    expect(b.layout).toEqual(a.layout);
    expect([...b.found]).toEqual([...a.found]);
    expect([...b.bonus]).toEqual([...a.bonus]);
  });

  it('restore() refuses saves for unknown levels or missing seeds', () => {
    const g = new Game(LEVELS);
    expect(g.restore({ levelId: 999, seed: 1 })).toBe(false);
    expect(g.restore({ levelId: 1 })).toBe(false);
    expect(g.restore(null)).toBe(false);
  });

  it('restore() ignores saved words that are not part of the puzzle', () => {
    const g = new Game(LEVELS);
    g.restore({ levelId: 3, seed: 5, found: ['ZZZ'], bonus: ['QQQ'] });
    expect(g.found.size).toBe(0);
    expect(g.bonus.size).toBe(0);
  });
});

describe('Game progression', () => {
  it('newPuzzle() switches to a different letter set when one exists', () => {
    const g = new Game(LEVELS);
    g.restore({ levelId: 1, seed: 1 });
    for (let i = 0; i < 20; i++) {
      const before = g.level.id;
      g.newPuzzle();
      expect(g.level.id).not.toBe(before);
    }
  });

  it('newPuzzle() works with a single level', () => {
    const g = new Game([LEVELS[2]]);
    g.newPuzzle();
    expect(g.level.id).toBe(3);
  });

  it('next() counts progress and starts a fresh puzzle', () => {
    const g = new Game(LEVELS);
    g.restore({ levelId: 3, seed: 9 });
    g.submit(gridWord(g));
    g.next();
    expect(g.number).toBe(2);
    expect(g.found.size).toBe(0);
  });

  it('prefers gridPool for the grid but still accepts every pool word', () => {
    const level = { id: 7, letters: ['H', 'E', 'A', 'R', 'T'], pool: LEVELS[2].pool, gridPool: ['HEART', 'HAT', 'EAT', 'TEA'] };
    const g = new Game([level]);
    g.restore({ levelId: 7, seed: 3 });
    for (const w of g.gridWords) expect(level.gridPool).toContain(w);
    expect(g.submit('EARTH')).toBe('bonus');
  });

  it('refuses to start with no levels', () => {
    expect(() => new Game([])).toThrow();
  });
});
