import { describe, it, expect } from 'vitest';
import { Dictionary } from '../src/dictionary.js';

describe('Dictionary', () => {
  const dict = new Dictionary(['heart', 'Earth']);

  it('finds words regardless of the case they were stored in', () => {
    expect(dict.has('HEART')).toBe(true);
    expect(dict.has('EARTH')).toBe(true);
  });

  it('does not find words that were never added', () => {
    expect(dict.has('CLOUD')).toBe(false);
  });
});
