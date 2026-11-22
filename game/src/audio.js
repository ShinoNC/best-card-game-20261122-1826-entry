// Synthesised sound for EMBERFALL: short WebAudio bleeps, no audio files.
// The context is created on the first user gesture, so browsers allow it.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (ctx === null) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

// One tone: `freq` Hz, `ms` long, `type` waveform, `gain` volume 0..1.
export function blip(freq, ms, type, gain) {
  if (muted) return;
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(gain ?? 0.12, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + ms / 1000);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(now);
  osc.stop(now + ms / 1000 + 0.02);
}

function chord(freqs, ms, type, gain) {
  for (const f of freqs) blip(f, ms, type, gain);
}

export const sounds = {
  click() { blip(660, 70, 'triangle', 0.08); },
  deal() { blip(520, 90, 'triangle', 0.1); blip(780, 90, 'triangle', 0.07); },
  play() { chord([392, 523], 120, 'triangle', 0.11); },
  strike() { blip(180, 160, 'sawtooth', 0.12); blip(90, 200, 'square', 0.08); },
  guard() { chord([262, 330], 150, 'sine', 0.11); },
  surge() { chord([523, 659, 784], 180, 'sine', 0.09); },
  resonance() { chord([784, 988, 1175], 220, 'triangle', 0.1); },
  win() { chord([523, 659, 784, 1047], 500, 'triangle', 0.12); },
  loss() { chord([392, 330, 262], 500, 'sine', 0.1); },
};
