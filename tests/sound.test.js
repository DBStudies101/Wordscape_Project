import { describe, it, expect, beforeEach } from 'vitest';
import { Sound, noteFrequency } from '../src/sound.js';

// A stand-in for AudioContext that just counts what gets created
function fakeContext() {
  const made = { oscillators: [], noise: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect: (next) => next });
  return {
    made,
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: node(),
    createGain: () => ({ ...node(), gain: param() }),
    createDelay: () => ({ ...node(), delayTime: param() }),
    createOscillator: () => {
      const osc = { ...node(), frequency: param(), type: '', start() {}, stop() {} };
      made.oscillators.push(osc);
      return osc;
    },
    createBiquadFilter: () => ({ ...node(), Q: param(), frequency: param() }),
    createBuffer: (_channels, length) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => {
      made.noise++;
      return { ...node(), start() {}, stop() {} };
    },
  };
}

describe('noteFrequency', () => {
  it('starts at middle C', () => {
    expect(noteFrequency(0)).toBeCloseTo(261.63, 1);
  });

  it('rises with every step', () => {
    for (let i = 1; i < 10; i++) expect(noteFrequency(i)).toBeGreaterThan(noteFrequency(i - 1));
  });

  it('reaches exactly one octave up at step 5', () => {
    expect(noteFrequency(5)).toBeCloseTo(noteFrequency(0) * 2, 5);
  });

  it('clamps steps outside the scale', () => {
    expect(noteFrequency(-3)).toBe(noteFrequency(0));
    expect(noteFrequency(99)).toBe(noteFrequency(9));
  });
});

describe('Sound effects', () => {
  let ctx;
  let sound;
  beforeEach(() => {
    ctx = fakeContext();
    sound = new Sound({ ctx });
    sound.muted = false;
  });

  it('plays one note per letter picked', () => {
    sound.select(0);
    sound.select(1);
    expect(ctx.made.oscillators).toHaveLength(2);
  });

  it('plays one note per lit tile when a word is found', () => {
    sound.found(4);
    expect(ctx.made.oscillators).toHaveLength(4);
  });

  it('still chimes when a found word lit no new tiles', () => {
    sound.found(0);
    expect(ctx.made.oscillators).toHaveLength(1);
  });

  it('caps very long words at 8 notes', () => {
    sound.found(20);
    expect(ctx.made.oscillators).toHaveLength(8);
  });

  it('bonus is two notes, reject is one, completing is four', () => {
    sound.bonus();
    expect(ctx.made.oscillators).toHaveLength(2);
    sound.reject();
    expect(ctx.made.oscillators).toHaveLength(3);
    sound.complete();
    expect(ctx.made.oscillators).toHaveLength(7);
  });

  it('shuffle makes a noise whoosh, not a note', () => {
    sound.shuffle();
    expect(ctx.made.noise).toBe(1);
    expect(ctx.made.oscillators).toHaveLength(0);
  });

  it('makes no sound at all while muted', () => {
    sound.muted = true;
    sound.select(0);
    sound.found(3);
    sound.bonus();
    sound.reject();
    sound.complete();
    sound.shuffle();
    expect(ctx.made.oscillators).toHaveLength(0);
    expect(ctx.made.noise).toBe(0);
  });

  it('setMuted() turns sound off and back on', () => {
    expect(sound.setMuted(true)).toBe(true);
    sound.select(0);
    expect(ctx.made.oscillators).toHaveLength(0);
    sound.setMuted(false);
    sound.select(0);
    expect(ctx.made.oscillators).toHaveLength(1);
  });
});
