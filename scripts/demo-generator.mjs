import { generate, canBuild, isValid } from '../src/generator.js';

const letters = ['H', 'E', 'A', 'R', 'T'];
const wordList = [
  'HEART', 'EARTH', 'HATER', 'HEAR', 'HATE', 'HEAT', 'TEAR', 'RATE',
  'HAT', 'EAT', 'TEA', 'ART', 'RAT', 'EAR', 'ARE', 'ATE', 'TAR', 'ERA',
  'THE', 'RHEA', 'XYLOPHONE', // the last one can't be built from these letters
];

const pool = wordList.filter((w) => canBuild(w, letters));
const layout = generate(pool, { maxWords: 6 });

// Draw the grid as ASCII
const grid = Array.from({ length: layout.rows }, () => Array(layout.cols).fill('.'));
for (const { word, row, col, dir } of layout.words) {
  [...word].forEach((ch, i) => {
    grid[row + (dir === 'down' ? i : 0)][col + (dir === 'across' ? i : 0)] = ch;
  });
}
console.log(grid.map((r) => r.join(' ')).join('\n'));
console.log('\nWords placed:', layout.words.map((w) => `${w.word} (${w.dir} @ ${w.row},${w.col})`).join(', '));
console.log('Valid layout:', isValid(layout));
