import { afterGesture } from './gesture';

/** A tiny generated WebAudio set. Off by default; Settings turns it on. */
export type SoundName = 'tick' | 'clear' | 'level' | 'warn' | 'chime';

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Note {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

const SOUNDS: Record<SoundName, Note[]> = {
  tick: [{ freq: 1760, at: 0, dur: 0.035, type: 'square', gain: 0.04 }],
  clear: [
    { freq: 880, at: 0, dur: 0.08, type: 'triangle', gain: 0.08 },
    { freq: 1320, at: 0.07, dur: 0.14, type: 'triangle', gain: 0.07 },
  ],
  level: [
    { freq: 523.25, at: 0, dur: 0.12, type: 'triangle', gain: 0.08 },
    { freq: 659.25, at: 0.1, dur: 0.12, type: 'triangle', gain: 0.08 },
    { freq: 783.99, at: 0.2, dur: 0.12, type: 'triangle', gain: 0.08 },
    { freq: 1046.5, at: 0.3, dur: 0.4, type: 'triangle', gain: 0.09 },
  ],
  warn: [
    { freq: 220, at: 0, dur: 0.14, type: 'sawtooth', gain: 0.05 },
    { freq: 196, at: 0.16, dur: 0.22, type: 'sawtooth', gain: 0.05 },
  ],
  chime: [
    { freq: 1318.5, at: 0, dur: 0.5, type: 'sine', gain: 0.09 },
    { freq: 1975.5, at: 0.02, dur: 0.6, type: 'sine', gain: 0.04 },
  ],
};

export function play(name: SoundName, force = false): void {
  if (!enabled && !force) return;
  afterGesture(() => render(name));
}

function render(name: SoundName): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  for (const n of SOUNDS[name]) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.freq, t0 + n.at);
    const peak = n.gain ?? 0.06;
    g.gain.setValueAtTime(0.0001, t0 + n.at);
    g.gain.exponentialRampToValueAtTime(peak, t0 + n.at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0 + n.at);
    osc.stop(t0 + n.at + n.dur + 0.02);
  }
}
