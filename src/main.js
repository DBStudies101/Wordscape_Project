import '@fontsource/young-serif';
import '@fontsource-variable/nunito';
import { LEVELS as FALLBACK_LEVELS } from './levels.js';
import { fetchLevels } from './api.js';
import { loadProgress, saveProgress } from './progress.js';
import { Game } from './game.js';
import { Board, TILE_STAGGER_MS } from './board.js';
import { Sound } from './sound.js';
import { Wheel } from './wheel.js';

const $ = (sel) => document.querySelector(sel);
const board = new Board($('#board'));
const dial = $('#dial');
const sound = new Sound();
let game;
let saveTimer;
let flashTimer;

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

// The centre of the wheel shows the word being spelled
function showWord(word, state = '') {
  const el = $('#preview');
  el.textContent = word;
  el.dataset.state = state;
  dial.classList.toggle('typing', word.length > 0);
}

// After a word is submitted, keep it visible for a moment: warm if accepted, shaking if not
function flash(word, state) {
  clearTimeout(flashTimer);
  showWord(word, state);
  flashTimer = setTimeout(() => showWord(''), state === 'bad' ? 700 : 450);
}

// Restart a one-shot CSS animation on an element
function pulse(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // forces the browser to notice the class was removed
  el.classList.add(className);
}

const wheel = new Wheel($('#wheel'), {
  onChange: (word) => {
    clearTimeout(flashTimer);
    showWord(word);
  },
  onPick: (length) => sound.select(length - 1), // each letter of the word is the next note up
  onSubmit: (word) => {
    if (!game) return;
    if (word.length < 2) return; // a stray tap on one letter is not a guess
    const result = game.submit(word);
    const accepted = result === 'grid' || result === 'bonus';
    $('#status').textContent = game.complete ? 'Level complete!' : MESSAGES[result];
    flash(word, accepted ? 'good' : 'bad');
    if (accepted) queueSave();
    const lit = update({ animate: true });

    // Sound and visuals start in the same moment, with the same tile spacing
    if (result === 'grid') {
      sound.found(lit, TILE_STAGGER_MS / 1000);
      if (game.complete) sound.complete((lit * TILE_STAGGER_MS) / 1000 + 0.5);
    } else if (result === 'bonus') {
      sound.bonus();
      pulse($('#bonus'), 'pop');
    } else {
      sound.reject();
    }
  },
});

// Returns how many tiles lit up
function update({ animate = false } = {}) {
  const lit = board.render(game.layout, game.found, { animate });
  $('#level').textContent = `Level ${game.number}`;
  $('#bonus').textContent = `Bonus ${game.bonus.size}`;
  $('#next').hidden = !game.complete;
  return lit;
}

function showPuzzle() {
  board.reset(); // a new puzzle starts with nothing lit
  wheel.setLetters(game.level.letters);
  wheel.shuffle(); // so the wheel never starts in the answer's spelling
  $('#status').textContent = '';
  update();
}

$('#shuffle').addEventListener('click', () => {
  wheel.shuffle();
  sound.shuffle();
});

$('#new-puzzle').addEventListener('click', () => {
  const inProgress = game.found.size > 0 && !game.complete;
  if (inProgress && !confirm('Switch to a different puzzle? Progress on this one will be lost.')) return;
  game.newPuzzle();
  showPuzzle();
  sound.shuffle();
  queueSave({ immediate: true });
});

$('#next').addEventListener('click', () => {
  game.next();
  showPuzzle();
  sound.shuffle();
  queueSave({ immediate: true });
});

// Sound on/off, remembered between visits
const muteButton = $('#mute');
function showMuted() {
  muteButton.setAttribute('aria-pressed', String(sound.muted));
  muteButton.setAttribute('aria-label', sound.muted ? 'Turn sound on' : 'Turn sound off');
}
muteButton.addEventListener('click', () => {
  sound.setMuted(!sound.muted);
  showMuted();
});
showMuted();

// Browsers only start audio after a gesture, so get ready on the first tap or key press
window.addEventListener('pointerdown', () => sound.unlock(), { once: true });
window.addEventListener('keydown', () => sound.unlock(), { once: true });

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
