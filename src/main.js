import { LEVELS as FALLBACK_LEVELS } from './levels.js';
import { fetchLevels } from './api.js';
import { loadProgress, saveProgress } from './progress.js';
import { Game } from './game.js';
import { Board } from './board.js';
import { Wheel } from './wheel.js';

const $ = (sel) => document.querySelector(sel);
const board = new Board($('#board'));
let game;
let saveTimer;

const MESSAGES = {
  short: 'Words need at least 3 letters.',
  repeat: 'Already found.',
  grid: 'Nice!',
  bonus: 'Bonus word!',
  invalid: 'Not in the word list.',
};

// Save the current puzzle. Debounced so a burst of words becomes one request.
function queueSave({ immediate = false } = {}) {
  clearTimeout(saveTimer);
  const run = () => saveProgress(game.state).catch((err) => console.error('Save failed', err));
  if (immediate) run();
  else saveTimer = setTimeout(run, 300);
}

const wheel = new Wheel($('#wheel'), {
  onChange: (word) => ($('#preview').textContent = word),
  onSubmit: (word) => {
    if (!game) return;
    const result = game.submit(word);
    $('#status').textContent = game.complete ? 'Level complete!' : MESSAGES[result];
    if (result === 'grid' || result === 'bonus') queueSave();
    update();
  },
});

function update() {
  board.render(game.layout, game.found);
  $('#level').textContent = `Level ${game.number}`;
  $('#bonus').textContent = `Bonus ${game.bonus.size}`;
  $('#next').hidden = !game.complete;
}

function showPuzzle() {
  wheel.setLetters(game.level.letters);
  wheel.shuffle(); // so the wheel never starts in the answer's spelling
  $('#status').textContent = '';
  update();
}

$('#shuffle').addEventListener('click', () => wheel.shuffle());

$('#new-puzzle').addEventListener('click', () => {
  const inProgress = game.found.size > 0 && !game.complete;
  if (inProgress && !confirm('Switch to a different puzzle? Progress on this one will be lost.')) return;
  game.newPuzzle();
  showPuzzle();
  queueSave({ immediate: true });
});

$('#next').addEventListener('click', () => {
  game.next();
  showPuzzle();
  queueSave({ immediate: true });
});

async function init() {
  $('#status').textContent = 'Loading levels…';
  let levels = FALLBACK_LEVELS;
  let offline = false;
  try {
    levels = await fetchLevels();
  } catch (err) {
    console.error(err);
    offline = true;
  }
  game = new Game(levels);

  // Rebuild the saved puzzle (same letters, same grid, same found words) or start a fresh one
  let restored = false;
  try {
    const saved = await loadProgress();
    if (saved) {
      restored = game.restore({
        levelId: saved.level_id,
        seed: saved.seed,
        found: saved.found_words,
        bonus: saved.bonus_words,
        number: saved.current_level,
      });
      if (!restored && saved.current_level) game.number = saved.current_level;
    }
  } catch (err) {
    console.error('Could not load progress', err);
  }

  if (!restored) {
    game.newPuzzle();
    queueSave({ immediate: true });
  }

  showPuzzle();
  if (offline) $('#status').textContent = 'Offline: using built-in levels.';
}

init();
