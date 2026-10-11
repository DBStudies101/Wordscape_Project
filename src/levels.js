// MVP: hand-built layouts. v2 replaces this with generator.js.
// Each word: { word, row, col, dir: 'across' | 'down' }
export const LEVELS = [
  {
    letters: ['H', 'E', 'A', 'R', 'T'],
    words: [
      { word: 'HEART', row: 2, col: 0, dir: 'across' },
      { word: 'HAT', row: 2, col: 0, dir: 'down' },
      { word: 'EAT', row: 1, col: 2, dir: 'down' },
      { word: 'TEA', row: 2, col: 4, dir: 'down' },
    ],
    bonus: ['EARTH', 'HATER', 'HEAR', 'HATE', 'HEAT', 'TEAR', 'RATE', 'ART', 'RAT', 'EAR', 'ARE', 'ATE', 'TAR', 'ERA'],
  },
  {
    letters: ['C', 'L', 'O', 'U', 'D'],
    words: [
      { word: 'COULD', row: 2, col: 0, dir: 'across' },
      { word: 'LOUD', row: 0, col: 2, dir: 'down' },
      { word: 'OLD', row: 0, col: 4, dir: 'down' },
      { word: 'COD', row: 2, col: 0, dir: 'down' },
    ],
    bonus: ['CLOUD', 'CLOD', 'COLD', 'DUO'],
  },
];
