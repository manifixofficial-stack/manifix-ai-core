// src/hooks/useVeggieEvasion.js
//
// 3D world-space rewrite of the original 2D screen-pixel evasion hook.
//
// WHY THIS CHANGED:
// The old version worked in screen pixels — wall bounces off screenW/screenH,
// corners meant the 4 screen corners, and fleeing was "away from the
// crosshair's screen X/Y". None of that exists once positions are real
// Three.js world coordinates.
//
// THE KEY SIMPLIFICATION: your camera IS the player, and it's always fixed
// at world origin (0, *, 0) — GameCanvas.jsx places every target relative to
// the player, not the other way around. That means "flee away from the
// crosshair" in 3D is just "move directly away from the origin" on the
// ground (x/z) plane. No separate crosshairX/crosshairZ params are needed —
// removing them entirely instead of faking them is the correct fix, not an
// oversight.
//
// WHAT MAPS OVER AS-IS: distance-gated state thresholds, dash-burst timing,
// zig-zag jitter, hazard trail concept, squash/stretch feel.
//
// WHAT HAD TO BE REDESIGNED FOR 3D:
// - "Wall bounce" -> bouncing off a maximum roam RADIUS (a sphere/circle
//   around the player) instead of 4 screen edges.
// - "Cornered" -> pinned against that single outer radius, instead of
//   being wedged into one of 4 screen corners (a circular boundary only
//   has one kind of edge, so this is a deliberate simplification, not a
//   missing feature).
// - The "hack pull" that nudged the player's on-screen crosshair no longer
//   has anywhere sensible to apply in 3D (the camera's actual orientation
//   is driven by the real device compass, not code) — it's kept ONLY as an
//   optional decorative value (`visualAimGlitch`) a HUD layer could use for
//   a screen-shake/glitch overlay. It still never touches real GPS/compass
//   state, same as the original's documented intent.
//
// WHAT CHANGED IN THIS REVISION:
// - EVASION_TRIGGER_M is now exported. VeggieSprite.jsx was hardcoding a
//   bare `8` for its own dodge-art gating with a comment claiming it
//   "mirrors" this constant — a silent-drift trap if this value ever
//   changes here. It now imports the real constant instead.

import { useCallback, useRef } from 'react';

// --- Distance-gated state thresholds (GPS meters, unchanged mechanic) ---
const GREETING_MIN_M = 12;
const GREETING_MAX_M = 25;
export const EVASION_TRIGGER_M = 8;
const GREETING_BOB_AMPLITUDE_UNITS = 0.05;

// --- Core fleeing vector in 3D scene units: Speed = Base / Distance ---
// Tuned against GameCanvas.jsx's MIN_SCENE_DEPTH (1.6) / MAX_SCENE_DEPTH (11)
// so speeds feel reasonable at the depths targets actually render at.
const FLEE_SPEED_CONSTANT = 14;      // scene-units^2 / sec
const MIN_FLEE_DISTANCE_UNITS = 1.0; // floor so speed doesn't blow up as distance -> 0
const VELOCITY_BLEND_RATE = 0.25;    // how fast actual velocity chases the target vector (0-1)

// --- Roam boundary: a circle of this radius around the player (origin),
// standing in for the old screen edges. ---
const ROAM_MAX_RADIUS_UNITS = 11;    // matches GameCanvas.jsx MAX_SCENE_DEPTH
const BOUNDARY_MARGIN_UNITS = 1.0;   // buffer before the hard edge
const WALL_BOUNCE_MULTIPLIER = 1.2;
const SQUISH_DECAY = 0.82;           // per-frame decay of the post-bounce squash/stretch pulse

// --- Cornered (= pinned against the roam boundary) desperation growth ---
const CORNER_GROWTH_MAX = 2.5;
const CORNER_GROWTH_FRAMES = 30;
const CORNER_GROWTH_STEP = (CORNER_GROWTH_MAX - 1) / CORNER_GROWTH_FRAMES;
const CORNER_BREAK_DRIFT_UNITS_S = 3; // extra drift back toward the player to help break the boundary lock

// --- Perlin-ish zig-zag (cosine jitter standing in for Perlin noise —
// cheap, deterministic per-veggie via its own phase) ---
const ZIGZAG_FREQUENCY = 0.35;
const ZIGZAG_AMPLITUDE_UNITS_S = 2.5;

// --- Slippery hazard trail (world-space now, not screen-space) ---
const HAZARD_DROP_INTERVAL_FRAMES = 6;
const HAZARD_LIFETIME_MS = 4000;
const HAZARD_TRIGGER_RADIUS_UNITS = 0.6;
const HAZARD_TRAIL_MAX_POINTS = 40;

// --- 3-stage hyper-speed dash burst ---
const DASH_TRIGGER_CLOSING_SPEED_UNITS_S = 2.2; // how fast real-world distance must be shrinking to spook a dash
const DASH_SPEED_MULTIPLIER = 3.0;
const DASH_DURATION_FRAMES = 8;
const DASH_COOLDOWN_MS = 2500;
const DASH_STRETCH_DECAY = 0.8;

// --- Decorative-only "hacked" glitch (never touches real GPS/compass) ---
const HACK_GLITCH_STRENGTH_PX = 14;

export function useVeggieEvasion() {
  const stateRef = useRef({}); // veggieId -> physics + timing state

  const ensureVeggieState = (veggieId) => {
    if (!stateRef.current[veggieId]) {
      stateRef.current[veggieId] = {
        phase: Math.random() * 100,
        vx: 0,
        vz: 0,
        squishX: 0,
        squishZ: 0,
        cornerGrowth: 1,
        dashFramesLeft: 0,
        dashCooldownUntil: 0,
        dashStretch: 0,
        prevDistance: null,
        hazardTrail: [],
        frameCount: 0,
      };
    }
    return stateRef.current[veggieId];
  };

  /**
   * @param {string} veggieId
   * @param {Object} params
   * @param {number} params.distanceMeters  real-world GPS distance to player — gates idle/greeting/running
   * @param {number} params.worldX          veggie's current X in 3D scene units (ground plane)
   * @param {number} params.worldZ          veggie's current Z in 3D scene units (ground plane)
   * @param {boolean} [params.isHackedGlobal=false]
   * @param {number} [params.dtSeconds=1/60]
   */
  const processEvasionFrame = useCallback((veggieId, params) => {
    const {
      distanceMeters,
      worldX,
      worldZ,
      isHackedGlobal = false,
      dtSeconds = 1 / 60,
    } = params;

    const s = ensureVeggieState(veggieId);
    s.phase += 0.05;
    s.frameCount += 1;

    let state = 'idle';
    let message = '';
    let dx = 0;
    let dz = 0;
    let scaleX = 1;
    let scaleZ = 1;
    let spinoutTriggered = false;
    let bounced = false;
    let dashActive = false;
    let isCornered = false;
    let visualAimGlitch = null;

    if (distanceMeters <= EVASION_TRIGGER_M) {
      state = 'running';
      message = isHackedGlobal ? 'SOMETHING IS WRONG WITH IT...' : 'RUNNING AWAY!';

      // --- 1. Core fleeing vector: away from the player at the origin ---
      // The player is always at world (0, *, 0), so the vector FROM the
      // origin TO the veggie already points directly away from the player
      // — no inversion or separate crosshair position needed.
      const rawDist = Math.max(0.001, Math.hypot(worldX, worldZ));
      let fleeAngle = Math.atan2(worldZ, worldX);

      // --- Hacked state: chase the player instead of fleeing, and emit a
      // purely decorative glitch value a HUD layer can use for a
      // screen-shake/warp effect. This NEVER moves the real camera/compass. ---
      if (isHackedGlobal) {
        fleeAngle += Math.PI; // chase instead of flee
        const glitchAngle = s.phase * 3.1;
        visualAimGlitch = {
          dx: Math.cos(glitchAngle) * HACK_GLITCH_STRENGTH_PX,
          dy: Math.sin(glitchAngle) * HACK_GLITCH_STRENGTH_PX,
        };
      }

      const distUnits = Math.max(MIN_FLEE_DISTANCE_UNITS, rawDist);
      let speed = FLEE_SPEED_CONSTANT / distUnits; // Speed = Base / Distance

      // --- 9. 3-stage hyper-speed dash burst, triggered by closing speed ---
      const now = performance.now();
      if (s.prevDistance != null && dtSeconds > 0) {
        const closingSpeed = (s.prevDistance - rawDist) / dtSeconds;
        if (
          closingSpeed > DASH_TRIGGER_CLOSING_SPEED_UNITS_S &&
          s.dashFramesLeft <= 0 &&
          now >= s.dashCooldownUntil
        ) {
          s.dashFramesLeft = DASH_DURATION_FRAMES;
          s.dashCooldownUntil = now + DASH_COOLDOWN_MS;
          s.dashStretch = 1;
        }
      }
      s.prevDistance = rawDist;

      if (s.dashFramesLeft > 0) {
        dashActive = true;
        speed *= DASH_SPEED_MULTIPLIER;
        s.dashFramesLeft -= 1;
      }

      let targetVx = Math.cos(fleeAngle) * speed;
      let targetVz = Math.sin(fleeAngle) * speed;

      // --- 4. Perlin-ish zig-zag: lateral jitter perpendicular to flee heading ---
      const perpAngle = fleeAngle + Math.PI / 2;
      const jitter = Math.cos(s.phase * ZIGZAG_FREQUENCY * 10) * ZIGZAG_AMPLITUDE_UNITS_S;
      targetVx += Math.cos(perpAngle) * jitter;
      targetVz += Math.sin(perpAngle) * jitter;

      // --- 7. Desperation drift back toward the player while pinned against
      // the roam boundary, so it can actually break free instead of just
      // vibrating against the edge. ---
      if (s.cornerGrowth > 1.05) {
        const towardPlayerAngle = Math.atan2(-worldZ, -worldX);
        targetVx += Math.cos(towardPlayerAngle) * CORNER_BREAK_DRIFT_UNITS_S;
        targetVz += Math.sin(towardPlayerAngle) * CORNER_BREAK_DRIFT_UNITS_S;
      }

      // Smoothly blend actual velocity toward the target vector so
      // direction changes read as steering, not teleporting.
      s.vx += (targetVx - s.vx) * VELOCITY_BLEND_RATE;
      s.vz += (targetVz - s.vz) * VELOCITY_BLEND_RATE;

      dx = s.vx * dtSeconds;
      dz = s.vz * dtSeconds;

      // --- 2. Kinetic boundary bouncing: a circular roam radius around the
      // player stands in for the old 4 screen edges. ---
      const nextX = worldX + dx;
      const nextZ = worldZ + dz;
      const nextDist = Math.hypot(nextX, nextZ);
      if (nextDist >= ROAM_MAX_RADIUS_UNITS) {
        s.vx = -s.vx * WALL_BOUNCE_MULTIPLIER;
        s.vz = -s.vz * WALL_BOUNCE_MULTIPLIER;
        // Clamp this frame's delta so it doesn't punch through the boundary.
        const clampScale = rawDist > 0 ? (ROAM_MAX_RADIUS_UNITS - 0.05) / nextDist : 0;
        dx = nextX * clampScale - worldX;
        dz = nextZ * clampScale - worldZ;
        s.squishX = 1;
        s.squishZ = 1;
        bounced = true;
      }

      // --- 3. Cornered (pinned against the single circular boundary) growth ---
      const finalDist = Math.hypot(worldX + dx, worldZ + dz);
      isCornered = finalDist >= ROAM_MAX_RADIUS_UNITS - BOUNDARY_MARGIN_UNITS;

      s.cornerGrowth = isCornered
        ? Math.min(CORNER_GROWTH_MAX, s.cornerGrowth + CORNER_GROWTH_STEP)
        : Math.max(1, s.cornerGrowth - CORNER_GROWTH_STEP);

      // --- Squash/stretch composite: boundary-impact pulse + dash stretch + corner growth ---
      s.squishX *= SQUISH_DECAY;
      s.squishZ *= SQUISH_DECAY;
      s.dashStretch *= DASH_STRETCH_DECAY;

      const stretchAlongFlee = dashActive ? 1 + s.dashStretch * 0.6 : 1;
      const squashAlongFlee = dashActive ? 1 - s.dashStretch * 0.25 : 1;
      scaleX = s.cornerGrowth * (1 - s.squishX * 0.3) * (Math.abs(Math.cos(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);
      scaleZ = s.cornerGrowth * (1 - s.squishZ * 0.3) * (Math.abs(Math.sin(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);

      // --- 8. Slippery hazard trail drop, now in world x/z space ---
      if (s.frameCount % HAZARD_DROP_INTERVAL_FRAMES === 0) {
        s.hazardTrail.push({ x: worldX + dx, z: worldZ + dz, createdAt: now });
        if (s.hazardTrail.length > HAZARD_TRAIL_MAX_POINTS) s.hazardTrail.shift();
      }
      s.hazardTrail = s.hazardTrail.filter((p) => now - p.createdAt < HAZARD_LIFETIME_MS);

      // A hazard triggers if the PLAYER (at the origin) steps within range
      // of a dropped point, since the player, not a screen crosshair, is
      // the thing that can "slip" in 3D world space.
      for (const p of s.hazardTrail) {
        if (Math.hypot(p.x, p.z) < HAZARD_TRIGGER_RADIUS_UNITS) {
          spinoutTriggered = true;
          break;
        }
      }
    } else if (distanceMeters > GREETING_MIN_M && distanceMeters <= GREETING_MAX_M) {
      state = 'greeting';
      message = 'SAYING HI!';
      dz = Math.sin(s.phase) * GREETING_BOB_AMPLITUDE_UNITS * dtSeconds * 10;
      // Ambient velocity settles back to rest so it doesn't carry residual
      // panic speed into the next running phase.
      s.vx *= 0.9;
      s.vz *= 0.9;
    } else {
      // Idle — let any residual velocity/squish bleed off.
      s.vx *= 0.85;
      s.vz *= 0.85;
      s.squishX *= SQUISH_DECAY;
      s.squishZ *= SQUISH_DECAY;
    }

    return {
      state,
      message,
      dx,
      dz,
      vx: s.vx,
      vz: s.vz,
      scaleX,
      scaleZ,
      isCornered,
      bounced,
      dashActive,
      hazardTrail: s.hazardTrail,
      spinoutTriggered,
      visualAimGlitch, // decorative only — HUD screen-shake, never real camera/GPS movement
    };
  }, []);

  /** Drop stale per-veggie state (e.g. after a catch or despawn) so it doesn't leak forever. */
  const clearVeggieState = useCallback((veggieId) => {
    delete stateRef.current[veggieId];
  }, []);

  return { processEvasionFrame, clearVeggieState };
}
