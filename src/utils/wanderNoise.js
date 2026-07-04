// utils/wanderNoise.js
//
// Lightweight, dependency-free 1D value-noise generator used to drive the
// zig-zag heading deviation on fleeing veggies. Deliberately NOT true
// Perlin noise (no gradient/permutation table, no extra deps) — a smoothed
// value-noise curve is visually indistinguishable at the sample rate a
// per-frame evasion tick needs, and this keeps the whole thing to one
// small file with zero imports.
//
// Usage (inside useVeggieEvasion.js or similar):
//
//   import { createWanderNoise } from '../utils/wanderNoise.js';
//
//   const noise = createWanderNoise(veggieId);      // once per veggie
//   ...
//   const headingOffsetDeg = noise(elapsedSeconds) * MAX_ZIGZAG_DEG;
//   const finalHeading = fleeHeadingDeg + headingOffsetDeg;
//
// Each veggie should get its own generator (keyed by id) so multiple
// veggies fleeing at once don't all zig-zag in lockstep.

/**
 * Deterministic string -> 32-bit int hash (FNV-1a variant). Used to turn a
 * veggie id into a stable seed so the same veggie always gets the same
 * noise curve across re-renders, without storing anything beyond the id
 * itself.
 */
function hashSeed(seed) {
  const str = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Simple seeded PRNG (mulberry32). Fast, good enough statistical spread
 * for cosmetic noise, and — unlike Math.random() — fully deterministic
 * given the same seed, so lattice values are stable across calls.
 */
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Builds a smooth 1D noise function over a fixed-seed lattice. Lattice
 * points are generated lazily and cached, so calling the returned
 * function repeatedly with increasing time values (the normal per-frame
 * usage pattern) never re-derives values it has already computed.
 *
 * @param {number} seed - 0..1 seed value (from hashSeed).
 * @param {number} frequency - lattice points per second. Higher = more
 *   rapid direction changes. Defaults tuned for a "frantic but still
 *   readable as fleeing, not teleporting" feel at typical evasion speeds.
 * @returns {(t: number) => number} function mapping elapsed seconds to a
 *   noise value in the range [-1, 1].
 */
function buildNoise1D(seed, frequency = 1.8) {
  const rand = mulberry32(Math.floor(seed * 0xffffffff));
  const lattice = new Map();

  const valueAt = (i) => {
    if (!lattice.has(i)) {
      // Map [0,1) -> [-1,1)
      lattice.set(i, rand() * 2 - 1);
    }
    return lattice.get(i);
  };

  return (tSeconds) => {
    const scaled = Math.max(0, tSeconds) * frequency;
    const i0 = Math.floor(scaled);
    const i1 = i0 + 1;
    const frac = smoothstep(scaled - i0);
    const v0 = valueAt(i0);
    const v1 = valueAt(i1);
    return v0 + (v1 - v0) * frac;
  };
}

/**
 * Public entry point. Creates a self-contained noise generator scoped to
 * one veggie (or any other id you want an independent wander curve for).
 *
 * @param {string|number} id - stable per-entity identifier, e.g. veggie.id
 * @param {{ frequency?: number }} [options]
 * @returns {(tSeconds: number) => number} noise in [-1, 1] for that id
 */
export function createWanderNoise(id, options = {}) {
  const seed = hashSeed(id);
  return buildNoise1D(seed, options.frequency);
}

/**
 * Convenience helper: given a base flee-heading (degrees) and elapsed
 * time, returns the heading with zig-zag deviation already applied.
 * Saves evasion code from having to know the noise's [-1, 1] range or do
 * the degree-scaling itself.
 *
 * @param {(t: number) => number} noiseFn - result of createWanderNoise
 * @param {number} baseHeadingDeg
 * @param {number} tSeconds
 * @param {number} [maxDeviationDeg=35] - how far the noise can swing the
 *   heading in either direction at its extremes.
 */
export function applyWanderDeviation(noiseFn, baseHeadingDeg, tSeconds, maxDeviationDeg = 35) {
  const deviation = noiseFn(tSeconds) * maxDeviationDeg;
  return (baseHeadingDeg + deviation + 360) % 360;
}
