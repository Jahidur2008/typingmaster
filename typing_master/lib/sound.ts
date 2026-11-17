/**
 * Synthesized typing sounds via the Web Audio API — no audio assets.
 * Safe no-op when AudioContext is unavailable or the page is SSR'd.
 */

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = Math.floor(c.sampleRate * 0.05);
    noiseBuffer = c.createBuffer(1, length, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** Fast attack + exponential decay envelope. */
function envelope(gain: GainNode, t: number, peak: number, decay: number) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
}

function playOsc(
  c: AudioContext,
  type: OscillatorType,
  from: number,
  to: number | null,
  peak: number,
  decay: number,
  t: number,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + decay);
  }
  envelope(gain, t, peak, decay);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

function playNoise(
  c: AudioContext,
  freq: number,
  peak: number,
  decay: number,
  t: number,
) {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const gain = c.createGain();
  envelope(gain, t, peak, decay);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + decay + 0.05);
}

export type SoundPackId = "click" | "typewriter" | "soft";

/** One keypress sound from the given pack. volume is 0–1. */
export function playClick(pack: SoundPackId, volume: number): void {
  const c = getCtx();
  if (!c || volume <= 0) return;
  const t = c.currentTime;
  switch (pack) {
    case "click":
      playOsc(c, "square", 1500, 850, 0.1 * volume, 0.045, t);
      playNoise(c, 4200, 0.05 * volume, 0.03, t);
      break;
    case "typewriter":
      playNoise(c, 2400, 0.22 * volume, 0.05, t);
      playOsc(c, "triangle", 220, 120, 0.18 * volume, 0.07, t);
      break;
    case "soft":
      playOsc(c, "sine", 880, 660, 0.07 * volume, 0.08, t);
      break;
  }
}

/** Low buzz for a wrong keystroke. volume is 0–1. */
export function playError(volume: number): void {
  const c = getCtx();
  if (!c || volume <= 0) return;
  const t = c.currentTime;
  playOsc(c, "sawtooth", 170, 90, 0.14 * volume, 0.14, t);
}
