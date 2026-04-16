import { Howl } from 'howler';

// Using Web Audio API synthesized sounds as fallback (no external files needed)
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function beep(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // silently fail
  }
}

export const sounds = {
  click: () => beep(440, 0.1, 'square', 0.2),
  win: () => {
    beep(523, 0.15, 'sine', 0.3);
    setTimeout(() => beep(659, 0.15, 'sine', 0.3), 150);
    setTimeout(() => beep(784, 0.3, 'sine', 0.3), 300);
  },
  draw: () => {
    beep(300, 0.1, 'sawtooth', 0.2);
    setTimeout(() => beep(250, 0.2, 'sawtooth', 0.15), 120);
  },
  join: () => beep(600, 0.2, 'sine', 0.25),
};
