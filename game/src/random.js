// Seeded random numbers for EMBERFALL: one small generator (mulberry32) plus the
// few helpers the deck and the AI need, so a fixed seed always deals the same game.

// mulberry32: a tiny fast seeded PRNG. `seed` is any 32-bit integer.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer in [min, max] inclusive, from `rng`.
export function rollInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Fisher-Yates shuffle in place; returns the same array for chaining.
export function shuffle(rng, array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

// Pick one element of `array` at random (undefined when empty).
export function pick(rng, array) {
  if (array.length === 0) return undefined;
  return array[Math.floor(rng() * array.length)];
}
