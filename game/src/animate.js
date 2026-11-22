// Small motion layer for EMBERFALL: eased tweens for cards sliding, flipping and
// snapping into place, floating damage numbers, and rising ember particles.
// Nothing here knows the rules; it only moves pictures over time.

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

// One tween: `from` -> `to` over `durationMs`, with an easing function.
// `onDone` runs once, when the tween finishes.
export function makeTween(from, to, durationMs, ease, onDone) {
  return { from, to, durationMs, ease: ease || easeOutCubic, elapsed: 0, done: false, onDone };
}

export function stepTween(tween, dtMs) {
  if (tween.done) return tween.to;
  tween.elapsed += dtMs;
  const t = clamp01(tween.elapsed / tween.durationMs);
  if (t >= 1) {
    tween.done = true;
    if (tween.onDone) tween.onDone();
    return tween.to;
  }
  const e = tween.ease(t);
  if (typeof tween.from === 'number') return tween.from + (tween.to - tween.from) * e;
  const out = {};
  for (const key of Object.keys(tween.from)) {
    out[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
  }
  return out;
}

// A card sliding from the deck to its hand slot, then flipping face-up.
export function makeDealFlight(fromX, fromY, toX, toY, delayMs) {
  return {
    kind: 'deal', fromX, fromY, toX, toY,
    elapsed: -delayMs, durationMs: 300, flipMs: 180, done: false,
  };
}

export function stepDealFlight(flight, dtMs) {
  flight.elapsed += dtMs;
  if (flight.elapsed < 0) return { x: flight.fromX, y: flight.fromY, faceUp: false, done: false };
  const slide = clamp01(flight.elapsed / flight.durationMs);
  const flip = clamp01((flight.elapsed - flight.durationMs) / flight.flipMs);
  const e = easeOutCubic(slide);
  const done = slide >= 1 && flip >= 1;
  if (done) flight.done = true;
  return {
    x: flight.fromX + (flight.toX - flight.fromX) * e,
    y: flight.fromY + (flight.toY - flight.fromY) * e,
    faceUp: flip >= 0.5,
    flip,
    done,
  };
}

// A damage or heal number that floats up and fades.
export function makeFloater(x, y, text, color) {
  return { x, y, text, color, elapsed: 0, durationMs: 1100, done: false };
}

export function stepFloater(floater, dtMs) {
  floater.elapsed += dtMs;
  if (floater.elapsed >= floater.durationMs) floater.done = true;
  return floater;
}

// Ember particles: sparks that rise and fade, for the win screen and card hits.
export function makeParticle(x, y, vx, vy, size, color, lifeMs) {
  return { x, y, vx, vy, size, color, elapsed: 0, lifeMs, done: false };
}

export function stepParticle(p, dtMs) {
  p.elapsed += dtMs;
  const dt = dtMs / 1000;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vy -= 12 * dt;
  if (p.elapsed >= p.lifeMs) p.done = true;
  return p;
}

// A short burst of sparks from one point (used when a Strike lands).
export function burst(x, y, count, rng) {
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const speed = 40 + rng() * 90;
    parts.push(makeParticle(
      x, y,
      Math.cos(angle) * speed, Math.sin(angle) * speed - 40,
      2 + rng() * 3,
      rng() < 0.5 ? '#f0d060' : '#ff7a1a',
      500 + rng() * 500,
    ));
  }
  return parts;
}
