// Synthesized sound effects (Web Audio API): no audio files to download or license.
// Every effect is a few oscillators with a soft envelope, tuned to a pentatonic scale
// so any combination of notes sounds gentle.

const STORE_KEY = 'wordscape:muted';
const ROOT = 261.63; // C4
// C major pentatonic over two octaves, as semitones above the root
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

// Frequency of the nth note of the scale (clamped to the scale's range)
export function noteFrequency(step) {
  const i = Math.min(Math.max(step, 0), SCALE.length - 1);
  return ROOT * 2 ** (SCALE[i] / 12);
}

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false; // storage unavailable (private mode, tests): start with sound on
  }
}

export class Sound {
  // `ctx` can be injected (used by the tests); otherwise one is created on first use
  constructor({ ctx = null } = {}) {
    this.ctx = ctx;
    this.master = null;
    this.muted = readMuted();
  }

  // Browsers only allow audio after a user gesture, so call this from a click or tap
  unlock() {
    if (!this.muted) this.#context();
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      localStorage.setItem(STORE_KEY, muted ? '1' : '0');
    } catch {
      /* not saved; fine */
    }
    if (!muted) this.unlock();
    return this.muted;
  }

  // ---- the effects ----

  // Dragging across letters: each letter in the word plays the next note up the scale
  select(step) {
    this.#tone({ freq: noteFrequency(step), dur: 0.22, type: 'triangle', gain: 0.12 });
  }

  // A grid word was found: one note per tile, timed to the tiles lighting up
  found(count, stagger = 0.07) {
    const n = Math.min(Math.max(count, 1), 8);
    for (let i = 0; i < n; i++) {
      this.#tone({ freq: noteFrequency(i + 3), at: 0.12 + i * stagger, dur: 0.55, gain: 0.14 });
    }
  }

  // A valid word that is not on the grid: two quick high notes
  bonus() {
    this.#tone({ freq: noteFrequency(8), dur: 0.35, type: 'triangle', gain: 0.1 });
    this.#tone({ freq: noteFrequency(9), at: 0.09, dur: 0.45, type: 'triangle', gain: 0.1 });
  }

  // A rejected word: one low note that sags downward
  reject() {
    this.#tone({ freq: 196, glideTo: 138, dur: 0.24, gain: 0.2 });
  }

  // Puzzle finished: a rising four-note phrase, starting after the tiles have lit
  complete(after = 0.4) {
    [3, 5, 7, 9].forEach((step, i) => {
      this.#tone({ freq: noteFrequency(step), at: after + i * 0.13, dur: 0.9, gain: 0.13 });
    });
  }

  // Shuffle / new puzzle: a soft whoosh
  shuffle() {
    this.#noise({ dur: 0.3, from: 450, to: 2200, gain: 0.1 });
  }

  // ---- internals ----

  #context() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (!this.master) this.#wire();
    // Contexts start 'suspended' until a gesture; offline test contexts have startRendering
    if (this.ctx.state === 'suspended' && !this.ctx.startRendering) {
      Promise.resolve(this.ctx.resume()).catch(() => {});
    }
    return this.ctx;
  }

  // master -> speakers, plus a quiet echo so notes feel like they are in a room
  #wire() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;

    const echo = ctx.createDelay();
    echo.delayTime.value = 0.2;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;

    this.master.connect(ctx.destination);
    this.master.connect(echo);
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(wet);
    wet.connect(ctx.destination);
  }

  // One note: quick fade in, long fade out, so it never clicks
  #tone({ freq, at = 0, dur = 0.3, type = 'sine', gain = 0.15, glideTo = null }) {
    if (this.muted) return;
    const ctx = this.#context();
    if (!ctx) return;

    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtered noise that sweeps upward: the whoosh
  #noise({ dur, from, to, gain }) {
    if (this.muted) return;
    const ctx = this.#context();
    if (!ctx) return;

    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(gain, t + dur * 0.35);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter).connect(amp).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }
}
