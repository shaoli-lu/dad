import confetti from 'canvas-confetti';

export function fireConfetti() {
  // Create a burst from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
    shapes: ['circle', 'circle', 'square', 'star'],
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      particleCount: Math.floor(count * particleRatio),
      spread: 26 + 60 * particleRatio,
      startVelocity: 55,
      ...opts,
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 0.5, y: 0.7 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.8, y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.5, y: 0.5 } });
  fire(0.1, { spread: 120, startVelocity: 45, origin: { x: 0.3, y: 0.6 } });
}

export function fireSmallConfetti(x, y) {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    zIndex: 9999,
    colors: ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#92400e'],
    ticks: 100,
    gravity: 1.2,
    scalar: 1.2,
    shapes: ['circle', 'circle', 'square', 'star'],
  });
}
