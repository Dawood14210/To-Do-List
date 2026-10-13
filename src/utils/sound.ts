/**
 * Chunky WebAudio chime — square-wave arpeggio, no audio files, no assets.
 * Best-effort: silently does nothing when audio is unavailable (or blocked).
 */
export type ChimeKind = 'focus-end' | 'break-end';

const NOTES: Record<ChimeKind, number[]> = {
  // Rising major triad when a focus session lands.
  'focus-end': [523.25, 659.25, 783.99],
  // Falling pair when the break is over.
  'break-end': [783.99, 587.33],
};

type AudioContextCtor = new () => AudioContext;

function getAudioContext(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const scope = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

export function playChime(kind: ChimeKind = 'focus-end'): void {
  try {
    const Ctor = getAudioContext();
    if (!Ctor) return;

    const ctx = new Ctor();
    const start = ctx.currentTime;

    NOTES[kind].forEach((frequency, index) => {
      const at = start + index * 0.18;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.36);
    });

    window.setTimeout(() => {
      void ctx.close();
    }, 1600);
  } catch {
    // Audio is a nice-to-have; never let it break a session.
  }
}
