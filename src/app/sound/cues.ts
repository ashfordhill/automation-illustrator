/**
 * Original Web Audio UI cues (SH-03, SH-04). Never copied samples.
 * Fixed low volume. Sound stays independent of prefers-reduced-motion.
 */
export type CueKind = "blip" | "zip" | "pop" | "buzz" | "twoNote" | "tick";

const PEAK = 0.07;

let shared: AudioContext | null = null;

function audioCtor(): (typeof AudioContext) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext;
}

function audioContext(): AudioContext | null {
  const Ctor = audioCtor();
  if (!Ctor) return null;
  try {
    if (!shared) shared = new Ctor();
    if (shared.state === "suspended") void shared.resume();
    return shared;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  opts: {
    type: OscillatorType;
    freq: number;
    start: number;
    dur: number;
    peak?: number;
    freqEnd?: number;
  },
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, opts.start);
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), opts.start + opts.dur);
  }
  const peak = opts.peak ?? PEAK;
  gain.gain.setValueAtTime(0.0001, opts.start);
  gain.gain.exponentialRampToValueAtTime(peak, opts.start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.start + opts.dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(opts.start);
  osc.stop(opts.start + opts.dur + 0.02);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      /* already torn down */
    }
  };
}

/** Fast rising bandpass noise — the “zip” teeth of a Path pull. */
function noiseSweep(
  ac: AudioContext,
  opts: { start: number; dur: number; freq: number; freqEnd: number; peak: number },
) {
  const frames = Math.max(1, Math.floor(ac.sampleRate * opts.dur));
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(opts.freq, opts.start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), opts.start + opts.dur * 0.92);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, opts.start);
  gain.gain.exponentialRampToValueAtTime(opts.peak, opts.start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.start + opts.dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(opts.start);
  src.stop(opts.start + opts.dur + 0.02);
  src.onended = () => {
    try {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    } catch {
      /* already torn down */
    }
  };
}

/** Play one SH-04 cue. No-op when Web Audio is missing. */
export function playCue(kind: CueKind): void {
  const ac = audioContext();
  if (!ac) return;
  const t = ac.currentTime;
  switch (kind) {
    case "tick":
      tone(ac, { type: "triangle", freq: 880, start: t, dur: 0.045, peak: 0.05 });
      break;
    case "blip":
      tone(ac, { type: "sine", freq: 480, start: t, dur: 0.09, freqEnd: 720, peak: 0.06 });
      break;
    case "zip":
      // Path create: taut-string sweep + zip noise. Tile create keeps the round sine blip.
      noiseSweep(ac, { start: t, dur: 0.1, freq: 420, freqEnd: 2400, peak: 0.045 });
      tone(ac, { type: "triangle", freq: 260, start: t, dur: 0.095, freqEnd: 1480, peak: 0.04 });
      break;
    case "pop":
      tone(ac, { type: "sine", freq: 420, start: t, dur: 0.06, freqEnd: 180, peak: 0.09 });
      break;
    case "buzz":
      tone(ac, { type: "sawtooth", freq: 96, start: t, dur: 0.16, peak: 0.045 });
      break;
    case "twoNote":
      tone(ac, { type: "sine", freq: 392, start: t, dur: 0.09, peak: 0.06 });
      tone(ac, { type: "sine", freq: 523.25, start: t + 0.1, dur: 0.1, peak: 0.06 });
      break;
  }
}

export function playCueWhen(enabled: boolean, kind: CueKind): void {
  if (!enabled) return;
  playCue(kind);
}

/** Test helper: drop the cached AudioContext. */
export function resetAudioForTests(): void {
  shared = null;
}
