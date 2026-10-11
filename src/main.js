  import { loadProgress, saveProgress } from './progress.js';
import { LEVELS as FALLBACK_LEVELS } from './levels.js';
import { fetchLevels } from './api.js';
import { Game } from './game.js';
import { Board } from './board.js';
import { Wheel } from './wheel.js';

const $ = (sel) => document.querySelector(sel);
const board = new Board($('#board'));
let game;

const MESSAGES = {
  short: 'Words need at least 3 letters.',
  repeat: 'Already found.',
  grid: 'Nice!',
  bonus: 'Bonus word!',
  invalid: 'Not in the word list.',
};

const wheel = new Wheel($('#wheel'), {
  onChange: (word) => ($('#preview').textContent = word),
  onSubmit: (word) => {
    if (!game) return;
    const result = game.submit(word);
    $('#status').textContent = game.complete ? 'Level complete!' : MESSAGES[result];
    update();
  },
});

function update() {
  board.render(game.level, game.found);
  $('#level').textContent = `Level ${game.index + 1}`;
  $('#bonus').textContent = `Bonus ${game.bonus.size}`;
  $('#next').hidden = !game.complete;
}

function loadLevel() {
  wheel.setLetters(game.level.letters);
  $('#status').textContent = '';
  update();
}

$('#shuffle').addEventListener('click', () => wheel.shuffle());
  $('#next').addEventListener('click', () => {
    if (!game.next()) {
      $('#status').textContent = 'You finished every level!';
    } else {
      loadLevel();
      saveProgress(game.index + 1).catch((err) => console.error('Save failed', err));
    }
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
  try {
    const saved = await loadProgress();
    if (saved) game.goTo(saved.current_level - 1);
  } catch (err) {
    console.error('Could not load progress', err);
  }
  loadLevel();
  if (offline) $('#status').textContent = 'Offline: using built-in levels.';
}
init();
