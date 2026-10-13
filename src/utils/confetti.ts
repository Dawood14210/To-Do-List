import confetti from 'canvas-confetti';

/** The design-system palette, used for every burst. */
const BRUTAL_COLORS = ['#FFD84D', '#FF6B9D', '#4D9CFF', '#7CFFB2', '#FF9F43', '#FFF4E0'];

/** Small celebratory burst — used for quick wins (theme toggle, welcome, …). */
export function fireConfetti(): void {
  confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 38,
    ticks: 160,
    origin: { y: 0.65 },
    colors: BRUTAL_COLORS,
    disableForReducedMotion: true,
  });
}

/** Bigger two-sided celebration — reserve for finishing big tasks. */
export function fireCelebration(): void {
  const defaults = {
    particleCount: 90,
    spread: 100,
    ticks: 200,
    colors: BRUTAL_COLORS,
    disableForReducedMotion: true,
  } as const;

  confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.7 } });
}
