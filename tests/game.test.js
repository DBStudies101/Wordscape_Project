import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';

const LEVELS = [
  {
    letters: ['T', 'E', 'A'],
    words: [
      { word: 'EAT', row: 0, col: 0, dir: 'across' },
      { word: 'TEA', row: 0, col: 2, dir: 'down' },
    ],
    bonus: ['ATE'],
  },
  {
    letters: ['O', 'L', 'D'],
    words: [{ word: 'OLD', row: 0, col: 0, dir: 'across' }],
    bonus: [],
  },
];

describe('Game.submit', () => {
  let game;
  beforeEach(() => {
    game = new Game(LEVELS);
  });

  it('rejects words shorter than 3 letters', () => {
    expect(game.submit('EA')).toBe('short');
  });

  it('recognises a grid word and records it', () => {
    expect(game.submit('EAT')).toBe('grid');
    expect(game.found.has('EAT')).toBe(true);
  });

  it('recognises a bonus word and counts it separately', () => {
    expect(game.submit('ATE')).toBe('bonus');
    expect(game.bonus.size).toBe(1);
    expect(game.found.size).toBe(0);
  });

  it('rejects words that are not in the word list', () => {
    expect(game.submit('TTT')).toBe('invalid');
  });

  it('reports repeats for both grid and bonus words', () => {
    game.submit('EAT');
    game.submit('ATE');
    expect(game.submit('EAT')).toBe('repeat');
    expect(game.submit('ATE')).toBe('repeat');
  });
});

describe('Game progression', () => {
  let game;
  beforeEach(() => {
    game = new Game(LEVELS);
  });

  it('is complete only once every grid word is found', () => {
    expect(game.complete).toBe(false);
    game.submit('EAT');
    expect(game.complete).toBe(false);
    game.submit('TEA');
    expect(game.complete).toBe(true);
  });

  it('next() moves to the following level and resets found words', () => {
    game.submit('EAT');
    expect(game.next()).toBe(true);
    expect(game.index).toBe(1);
    expect(game.found.size).toBe(0);
  });

  it('next() returns false on the last level', () => {
    game.next();
    expect(game.next()).toBe(false);
    expect(game.index).toBe(1);
  });

  it('goTo() jumps to a level and clamps out-of-range values', () => {
    game.goTo(1);
    expect(game.index).toBe(1);
    game.goTo(99);
    expect(game.index).toBe(1);
    game.goTo(-5);
    expect(game.index).toBe(0);
  });
});
