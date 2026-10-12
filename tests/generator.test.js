import { describe, it, expect } from 'vitest';
import { canBuild, generate, isValid, mulberry32 } from '../src/generator.js';

const LETTERS = ['H', 'E', 'A', 'R', 'T'];
const POOL = ['HEART', 'EARTH', 'HATER', 'HEAR', 'HATE', 'HEAT', 'TEAR', 'RATE', 'HAT', 'EAT', 'TEA', 'ART', 'RAT', 'EAR', 'ARE', 'ATE', 'TAR', 'ERA'];

describe('canBuild', () => {
  it('accepts words spelled from the wheel letters', () => {
    expect(canBuild('HEART', LETTERS)).toBe(true);
    expect(canBuild('ART', LETTERS)).toBe(true);
  });

  it('rejects words that need a letter the wheel does not have', () => {
    expect(canBuild('RATS', LETTERS)).toBe(false);
  });

  it('rejects words that reuse a letter more times than the wheel has it', () => {
    expect(canBuild('TEET', LETTERS)).toBe(false);
  });
});

describe('isValid', () => {
  it('accepts a correct hand-built layout', () => {
    const layout = {
      rows: 5,
      cols: 5,
      words: [
        { word: 'HEART', row: 2, col: 0, dir: 'across' },
        { word: 'HAT', row: 2, col: 0, dir: 'down' },
        { word: 'EAT', row: 1, col: 2, dir: 'down' },
        { word: 'TEA', row: 2, col: 4, dir: 'down' },
      ],
    };
    expect(isValid(layout)).toBe(true);
  });

  it('rejects words that touch sideways and form an unintended word', () => {
    const layout = {
      rows: 2,
      cols: 5,
      words: [
        { word: 'HEART', row: 0, col: 0, dir: 'across' },
        { word: 'EAT', row: 1, col: 0, dir: 'across' },
      ],
    };
    expect(isValid(layout)).toBe(false);
  });

  it('rejects crossings where the letters disagree', () => {
    const layout = {
      rows: 3,
      cols: 5,
      words: [
        { word: 'HEART', row: 0, col: 0, dir: 'across' },
        { word: 'EAT', row: 0, col: 0, dir: 'down' }, // E on top of H
      ],
    };
    expect(isValid(layout)).toBe(false);
  });
});

describe('generate', () => {
  it('returns null when there are no usable words', () => {
    expect(generate([])).toBeNull();
    expect(generate(['AB', 'CD'])).toBeNull(); // too short
  });

  it('always produces a valid layout (100 random runs)', () => {
    for (let i = 0; i < 100; i++) {
      const layout = generate(POOL, { attempts: 20 });
      expect(isValid(layout)).toBe(true);
    }
  });

  it('only places words from the pool, each buildable from the letters', () => {
    const layout = generate(POOL, { attempts: 20 });
    for (const { word } of layout.words) {
      expect(POOL).toContain(word);
      expect(canBuild(word, LETTERS)).toBe(true);
    }
  });

  it('respects maxWords', () => {
    const layout = generate(POOL, { attempts: 20, maxWords: 3 });
    expect(layout.words.length).toBeLessThanOrEqual(3);
  });

  it('keeps every word inside the reported grid size', () => {
    const layout = generate(POOL, { attempts: 20 });
    for (const { word, row, col, dir } of layout.words) {
      const endRow = row + (dir === 'down' ? word.length - 1 : 0);
      const endCol = col + (dir === 'across' ? word.length - 1 : 0);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(endRow).toBeLessThan(layout.rows);
      expect(endCol).toBeLessThan(layout.cols);
    }
  });
});

describe('seeded generation', () => {
  it('mulberry32 gives the same sequence for the same seed', () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('the same seed always produces the same layout', () => {
    const first = generate(POOL, { seed: 2026 });
    for (let i = 0; i < 5; i++) {
      expect(generate(POOL, { seed: 2026 })).toEqual(first);
    }
  });

  it('the result does not depend on the order words arrive in', () => {
    const reversed = [...POOL].reverse();
    expect(generate(reversed, { seed: 7 })).toEqual(generate(POOL, { seed: 7 }));
  });

  it('different seeds give a variety of layouts, all valid', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const layout = generate(POOL, { seed, attempts: 20 });
      expect(isValid(layout)).toBe(true);
      seen.add(JSON.stringify(layout));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

