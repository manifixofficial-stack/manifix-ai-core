// src/hooks/useVeggieEvasion.js
//
// THIS REVISION ("idle-stand pause state"): adds a 5th AI state,
// idle_stand, alongside the existing idle_spawn / greeting / running /
// aggressive_charge / tactical_dodge / obstacle_hide set.
//
// WHY: real Pokémon-GO-style creatures don't run flat-out the entire
// time they're on screen — they periodically stop, stand still, and
// just exist for a second or two before moving again. Previously the
// only "pause" behavior was obstacle_hide (which relocates the veggie
// to a boundary angle) — there was no true "just stop here and be
// visible" beat. idle_stand fills that gap: it's rolled on the same
// periodic-timer pattern as the existing auto-hide mechanic (separate
// timer, separate interval range), and while active it decays velocity
// to zero exactly like idle_spawn does, so the veggie genuinely stops
// moving — not a cosmetic trick, a real position change (or lack of
// one) that flows through the same dx/dz/state return values GameCanvas
// already consumes. No caller-side changes needed to light this up.
//
// THIS REVISION (config cleanup): AUTO_IDLE_MIN_INTERVAL_MS,
// AUTO_IDLE_MAX_INTERVAL_MS, and IDLE_STAND_DURATION_FRAMES used to be
// hardcoded directly in this file — the only three AI-tuning constants
// that weren't sourced from gameConfig.js, breaking the "one place to
// tune AI behavior" pattern every other constant here follows. They now
// import from gameConfig.js with the same CFG_* / `?? fallback` pattern
// already used for EVASION_TRIGGER_METERS, FLEE_SPEED_CONSTANT,
// AUTO_HIDE_MIN/MAX_INTERVAL_MS, etc. — so a missing/undefined config
// value still falls back to the same numbers as before, and nothing
// about the actual idle-stand behavior changes.
//
// Everything else — the 4 pre-existing AI states, floor-locking,
// dead-reckoning, anti-cheat, hazard trail, dash bursts — is UNCHANGED.

import { useCallback, useRef } from 'react';
import {
  EVASION_TRIGGER_METERS,
  GREETING_MIN_METERS,
  GREETING_MAX_METERS,
  ROAM_MAX_RADIUS_UNITS as CFG_ROAM_MAX_RADIUS_UNITS,
  FLEE_SPEED_CONSTANT as CFG_FLEE_SPEED_CONSTANT,
  CHASE_STOP_DISTANCE_UNITS as CFG_CHASE_STOP_DISTANCE_UNITS,
  CHASE_ORBIT_SPEED_UNITS_S as CFG_CHASE_ORBIT_SPEED_UNITS_S,
  DASH_TRIGGER_CLOSING_SPEED_UNITS_S as CFG_DASH_TRIGGER_CLOSING_SPEED_UNITS_S,
  DASH_SPEED_MULTIPLIER as CFG_DASH_SPEED_MULTIPLIER,
  DASH_COOLDOWN_MS as CFG_DASH_COOLDOWN_MS,
  AGGRESSIVE_CHARGE_SPEED_MULTIPLIER as CFG_AGGRESSIVE_CHARGE_SPEED_MULTIPLIER,
  TACTICAL_DODGE_SPEED_UNITS_S as CFG_TACTICAL_DODGE_SPEED_UNITS_S,
  AUTO_HIDE_MIN_INTERVAL_MS as CFG_AUTO_HIDE_MIN_INTERVAL_MS,
  AUTO_HIDE_MAX_INTERVAL_MS as CFG_AUTO_HIDE_MAX_INTERVAL_MS,
  OBSTACLE_HIDE_DURATION_FRAMES as CFG_OBSTACLE_HIDE_DURATION_FRAMES,
  AUTO_IDLE_MIN_INTERVAL_MS as CFG_AUTO_IDLE_MIN_INTERVAL_MS,
  AUTO_IDLE_MAX_INTERVAL_MS as CFG_AUTO_IDLE_MAX_INTERVAL_MS,
  IDLE_STAND_DURATION_FRAMES as CFG_IDLE_STAND_DURATION_FRAMES,
  BREAKOUT_BASE_CHANCE as CFG_BREAKOUT_BASE_CHANCE,
  BREAKOUT_PLAYER_LEVEL_REDUCTION as CFG_BREAKOUT_PLAYER_LEVEL_REDUCTION,
  BREAKOUT_DIFFICULTY_WEIGHT as CFG_BREAKOUT_DIFFICULTY_WEIGHT,
  DEPTH_SCALE_MAX as CFG_DEPTH_SCALE_MAX,
} from '../config/gameConfig';

// --- Distance-gated state thresholds (GPS meters, unchanged mechanic) ---
const GREETING_MIN_M = GREETING_MIN_METERS ?? 12;
const GREETING_MAX_M = GREETING_MAX_METERS ?? 25;
export const EVASION_TRIGGER_M = EVASION_TRIGGER_METERS ?? 8;
const GREETING_BOB_AMPLITUDE_UNITS = 0.05;

// --- Core fleeing vector in 3D scene units: Speed = Base / Distance ---
const FLEE_SPEED_CONSTANT = CFG_FLEE_SPEED_CONSTANT ?? 14;      // scene-units^2 / sec
const MIN_FLEE_DISTANCE_UNITS = 1.0; // floor so speed doesn't blow up as distance -> 0
const VELOCITY_BLEND_RATE = 0.25;    // how fast actual velocity chases the target vector (0-1)

// --- Roam boundary: a circle of this radius around the player (origin) ---
const ROAM_MAX_RADIUS_UNITS = CFG_ROAM_MAX_RADIUS_UNITS ?? 11; // matches GameCanvas.jsx MAX_SCENE_DEPTH
const BOUNDARY_MARGIN_UNITS = 1.0;   // buffer before the hard edge
const WALL_BOUNCE_MULTIPLIER = 1.2;
const SQUISH_DECAY = 0.82;           // per-frame decay of the post-bounce squash/stretch pulse

// --- Cornered desperation growth ---
const CORNER_GROWTH_MAX = 2.5;
const CORNER_GROWTH_FRAMES = 30;
const CORNER_GROWTH_STEP = (CORNER_GROWTH_MAX - 1) / CORNER_GROWTH_FRAMES;
const CORNER_BREAK_DRIFT_UNITS_S = 3;

// --- Perlin-ish zig-zag ---
const ZIGZAG_FREQUENCY = 0.35;
const ZIGZAG_AMPLITUDE_UNITS_S = 2.5;

// --- Slippery hazard trail ---
const HAZARD_DROP_INTERVAL_FRAMES = 6;
const HAZARD_LIFETIME_MS = 4000;
const HAZARD_TRIGGER_RADIUS_UNITS = 0.6;
const HAZARD_TRAIL_MAX_POINTS = 40;

// --- 3-stage hyper-speed dash burst ---
const DASH_TRIGGER_CLOSING_SPEED_UNITS_S = CFG_DASH_TRIGGER_CLOSING_SPEED_UNITS_S ?? 2.2;
const DASH_SPEED_MULTIPLIER = CFG_DASH_SPEED_MULTIPLIER ?? 3.0;
const DASH_DURATION_FRAMES = 8;
const DASH_COOLDOWN_MS = CFG_DASH_COOLDOWN_MS ?? 2500;
const DASH_STRETCH_DECAY = 0.8;

// --- Decorative-only "hacked" glitch (never touches real GPS/compass) ---
const HACK_GLITCH_STRENGTH_PX = 14;

// =====================================================================
// 1. Floor locking + inverse-depth scale
// =====================================================================
const FLOOR_Y_UNITS = -1.6;          // simulated eye-level-held-phone ground plane
const DEPTH_SCALE_BASE = 1.0;        // scale at MAX_SCENE_DEPTH
const DEPTH_SCALE_MAX = CFG_DEPTH_SCALE_MAX ?? 2.8; // scale cap as the veggie approaches the camera
const DEPTH_SCALE_REFERENCE_UNITS = 11; // matches ROAM_MAX_RADIUS_UNITS / MAX_SCENE_DEPTH
const DEPTH_SCALE_NEAR_UNITS = 1.6;   // matches GameCanvas.jsx MIN_SCENE_DEPTH

// =====================================================================
// 2. 5-state AI selector constants
// =====================================================================
const AGGRESSIVE_CHARGE_DURATION_FRAMES = 40;
const AGGRESSIVE_CHARGE_SPEED_MULTIPLIER = CFG_AGGRESSIVE_CHARGE_SPEED_MULTIPLIER ?? 2.2;
const AGGRESSIVE_CHARGE_SCALE_BOOST = 1.4;

const TACTICAL_DODGE_DURATION_FRAMES = 14;
const TACTICAL_DODGE_SPEED_UNITS_S = CFG_TACTICAL_DODGE_SPEED_UNITS_S ?? 9;

// How close (scene units) a chasing veggie gets before it stops closing
// the distance and settles into an orbit instead of running through the
// camera — this is the "it's right in front of you, go catch it" beat.
const CHASE_STOP_DISTANCE_UNITS = CFG_CHASE_STOP_DISTANCE_UNITS ?? 2.5;
const CHASE_ORBIT_SPEED_UNITS_S = CFG_CHASE_ORBIT_SPEED_UNITS_S ?? 1.8;

const OBSTACLE_HIDE_DURATION_FRAMES = CFG_OBSTACLE_HIDE_DURATION_FRAMES ?? 45;
const OBSTACLE_HIDE_ANGLE_JITTER_RAD = Math.PI * 0.6; // how far off-boundary-normal it can duck

// --- Periodic "hide and seek" (Pokémon-GO style) — independent of being
// cornered: every so often the veggie deliberately ducks out of sight
// and the player has to reacquire it, instead of it only ever hiding
// when pinned against the roam edge. ---
const AUTO_HIDE_MIN_INTERVAL_MS = CFG_AUTO_HIDE_MIN_INTERVAL_MS ?? 7000;
const AUTO_HIDE_MAX_INTERVAL_MS = CFG_AUTO_HIDE_MAX_INTERVAL_MS ?? 14000;

// --- Periodic "just stand still" pause — distinct from hiding. Rolled
// on its own independent timer (deliberately a shorter, tighter range
// than auto-hide so a veggie pauses more often than it ducks out of
// sight), so a chased veggie doesn't run flat-out the entire time it's
// on screen — it genuinely stops, stands, and starts again, matching
// the "creature just standing there" beat real AR-catch games have
// between chase bursts. Now sourced from gameConfig.js (moved here from
// a hardcoded local default) so it lives alongside AUTO_HIDE_* in the
// single tunable AI-config file, same fallback pattern as every other
// CFG_* constant above. ---
const AUTO_IDLE_MIN_INTERVAL_MS = CFG_AUTO_IDLE_MIN_INTERVAL_MS ?? 4000;
const AUTO_IDLE_MAX_INTERVAL_MS = CFG_AUTO_IDLE_MAX_INTERVAL_MS ?? 9000;
const IDLE_STAND_DURATION_FRAMES = CFG_IDLE_STAND_DURATION_FRAMES ?? 70;

// =====================================================================
// 4. Dynamic hitbox scaling
// =====================================================================
const BASE_HITBOX_RADIUS_UNITS = 0.5;

// =====================================================================
// 5. Break-out probability model
// =====================================================================
const BREAKOUT_BASE_CHANCE = CFG_BREAKOUT_BASE_CHANCE ?? 0.35;
const BREAKOUT_PLAYER_LEVEL_REDUCTION = CFG_BREAKOUT_PLAYER_LEVEL_REDUCTION ?? 0.02; // per player level, subtracted from chance
const BREAKOUT_DIFFICULTY_WEIGHT = CFG_BREAKOUT_DIFFICULTY_WEIGHT ?? 0.5;       // catchDifficulty (0-1) added to chance
const BREAKOUT_MIN_CHANCE = 0.05;
const BREAKOUT_MAX_CHANCE = 0.9;

// =====================================================================
// 6. Anti-cheat / anti-teleport guard
// =====================================================================
const MAX_VELOCITY_CEILING_UNITS_S = 40; // well above any legitimate dash speed
const TELEPORT_CORRECTION_MARGIN_UNITS = 0.01;

// =====================================================================
// 7. Dead reckoning (multiplayer sync) constants
// =====================================================================
const DEAD_RECKONING_MAX_EXTRAPOLATION_MS = 400; // don't extrapolate further than this
const DEAD_RECKONING_SNAP_THRESHOLD_UNITS = 3;   // beyond this, snap instead of lerp
const DEAD_RECKONING_BLEND_RATE = 0.3;

// =====================================================================
// 8. Gyro/compass-aware obstacle hiding
// =====================================================================
const HIDE_BEHIND_PLAYER_ANGLE_DEG = 100; // how far off player's facing heading counts as "behind"

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function angleDiffDeg(a, b) {
  let diff = ((a - b + 180) % 360 + 360) % 360 - 180;
  return Math.abs(diff);
}

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
        // AI selector
        aiState: 'idle_spawn',
        aiStateFramesLeft: 0,
        obstacleHideAngle: 0,
        nextAutoHideAt: null, // ms timestamp; rolled the first time it's seen running
        nextAutoIdleAt: null, // ms timestamp; rolled the first time it's seen running
        // anti-cheat tracking
        lastKnownX: null,
        lastKnownZ: null,
        lastKnownAt: null,
        // dead reckoning tracking
        lastRemoteAt: null,
      };
    }
    return stateRef.current[veggieId];
  };

  /**
   * @param {string} veggieId
   * @param {Object} params
   * @param {number} params.distanceMeters  real-world GPS distance to player
   * @param {number} params.worldX          veggie's current X in 3D scene units
   * @param {number} params.worldZ          veggie's current Z in 3D scene units
   * @param {boolean} [params.isHackedGlobal=false]
   * @param {number} [params.dtSeconds=1/60]  frame delta time — see note (3) below
   * @param {boolean} [params.catchAttempted=false]   a throw/lock attempt happened this frame
   * @param {boolean} [params.catchLockSuccess=false] whether that attempt succeeded
   * @param {number} [params.playerLevel=1]           used by the break-out model
   * @param {number} [params.catchDifficulty=0.3]     0-1, this veggie's rarity/difficulty
   * @param {('left'|'right')} [params.swipeDirection] a swipe this frame -> tactical dodge
   * @param {number} [params.deviceHeadingDeg]         player's real compass heading, 0-360
   * @param {boolean} [params.chaseMode=true]  Pokémon-GO-style behavior: the
   *   veggie runs TOWARD the player instead of away. Set false to restore
   *   the original flee-away behavior for a "shy" species/variant.
   * @param {number} [params.floorY]  override the simulated ground-plane Y;
   *   defaults to this hook's own FLOOR_Y_UNITS if not passed, but the
   *   caller can pass a project-specific eye-height constant instead so
   *   there's one source of truth for the floor plane.
   */
  const processEvasionFrame = useCallback((veggieId, params) => {
    const {
      distanceMeters,
      worldX,
      worldZ,
      isHackedGlobal = false,
      dtSeconds = 1 / 60,
      catchAttempted = false,
      catchLockSuccess = false,
      playerLevel = 1,
      catchDifficulty = 0.3,
      swipeDirection = null,
      deviceHeadingDeg = null,
      chaseMode = true,
      floorY = FLOOR_Y_UNITS,
    } = params;

    const s = ensureVeggieState(veggieId);
    s.phase += 0.05;
    s.frameCount += 1;
    const now = performance.now();

    // ---------------------------------------------------------------
    // (3) Delta-time interpolation note: every velocity/position/scale
    // update below is expressed as units-per-second and multiplied by
    // dtSeconds (derived by the caller from performance.now() deltas
    // between frames), so movement stays consistent across 60/90/120Hz
    // devices and doesn't jump on a dropped frame. This was already the
    // mechanic in place; nothing new needed here beyond documenting it.
    // ---------------------------------------------------------------

    let state = 'idle_spawn';
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
    let breakoutTriggered = false;
    let teleportDetected = false;
    let correctedX = worldX;
    let correctedZ = worldZ;

    // =================================================================
    // (6) Anti-cheat: reject/clamp any position jump faster than a
    // veggie could legitimately move (even mid-dash), and report it so
    // the caller can log/flag the client instead of trusting it.
    // =================================================================
    if (s.lastKnownX != null && s.lastKnownAt != null) {
      const elapsedS = Math.max(0.001, (now - s.lastKnownAt) / 1000);
      const impliedSpeed = Math.hypot(worldX - s.lastKnownX, worldZ - s.lastKnownZ) / elapsedS;
      if (impliedSpeed > MAX_VELOCITY_CEILING_UNITS_S) {
        teleportDetected = true;
        const angle = Math.atan2(worldZ - s.lastKnownZ, worldX - s.lastKnownX);
        const maxStep = MAX_VELOCITY_CEILING_UNITS_S * elapsedS - TELEPORT_CORRECTION_MARGIN_UNITS;
        correctedX = s.lastKnownX + Math.cos(angle) * maxStep;
        correctedZ = s.lastKnownZ + Math.sin(angle) * maxStep;
      }
    }
    const effectiveWorldX = teleportDetected ? correctedX : worldX;
    const effectiveWorldZ = teleportDetected ? correctedZ : worldZ;
    s.lastKnownX = effectiveWorldX;
    s.lastKnownZ = effectiveWorldZ;
    s.lastKnownAt = now;

    // =================================================================
    // (5) Break-out probability model — resolved once, on the frame a
    // failed catch attempt comes in. Doesn't run every frame.
    // =================================================================
    if (catchAttempted && !catchLockSuccess) {
      const chance = Math.min(
        BREAKOUT_MAX_CHANCE,
        Math.max(
          BREAKOUT_MIN_CHANCE,
          BREAKOUT_BASE_CHANCE - playerLevel * BREAKOUT_PLAYER_LEVEL_REDUCTION + catchDifficulty * BREAKOUT_DIFFICULTY_WEIGHT
        )
      );
      if (Math.random() < chance) {
        breakoutTriggered = true;
        s.aiState = 'aggressive_charge';
        s.aiStateFramesLeft = AGGRESSIVE_CHARGE_DURATION_FRAMES;
      }
    }

    // =================================================================
    // AI state selection — only relevant once the veggie is within
    // evasion range; greeting/idle_spawn stay as before.
    // =================================================================
    if (distanceMeters <= EVASION_TRIGGER_M) {
      // A swipe this frame interrupts whatever's running with a dodge,
      // unless an aggressive charge (from a break-out) is already active —
      // that one plays out fully so it doesn't feel like it "gave up".
      if (swipeDirection && s.aiState !== 'aggressive_charge') {
        s.aiState = 'tactical_dodge';
        s.aiStateFramesLeft = TACTICAL_DODGE_DURATION_FRAMES;
      }

      if (s.aiStateFramesLeft <= 0 && s.aiState !== 'running') {
        // Default steady-state once no special state is active/expired.
        s.aiState = 'running';
      }

      // Periodic hide/seek: roll the first hide timer the moment a
      // veggie enters evasion range, then re-roll it every time it fires.
      if (s.nextAutoHideAt == null) {
        s.nextAutoHideAt = now + AUTO_HIDE_MIN_INTERVAL_MS + Math.random() * (AUTO_HIDE_MAX_INTERVAL_MS - AUTO_HIDE_MIN_INTERVAL_MS);
      }
      if (
        now >= s.nextAutoHideAt &&
        s.aiState === 'running' &&
        s.aiStateFramesLeft <= 0
      ) {
        s.aiState = 'obstacle_hide';
        s.aiStateFramesLeft = OBSTACLE_HIDE_DURATION_FRAMES;
        s.obstacleHideAngle = Math.atan2(worldZ, worldX) + (Math.random() - 0.5) * 2 * Math.PI;
        s.nextAutoHideAt = now + AUTO_HIDE_MIN_INTERVAL_MS + Math.random() * (AUTO_HIDE_MAX_INTERVAL_MS - AUTO_HIDE_MIN_INTERVAL_MS);
      }

      // Periodic idle-stand pause — own independent timer, only claims
      // the transition if hide didn't already claim it this frame (both
      // gate on aiState === 'running', so they can never fire on the
      // same frame for the same veggie).
      if (s.nextAutoIdleAt == null) {
        s.nextAutoIdleAt = now + AUTO_IDLE_MIN_INTERVAL_MS + Math.random() * (AUTO_IDLE_MAX_INTERVAL_MS - AUTO_IDLE_MIN_INTERVAL_MS);
      }
      if (
        now >= s.nextAutoIdleAt &&
        s.aiState === 'running' &&
        s.aiStateFramesLeft <= 0
      ) {
        s.aiState = 'idle_stand';
        s.aiStateFramesLeft = IDLE_STAND_DURATION_FRAMES;
        s.nextAutoIdleAt = now + AUTO_IDLE_MIN_INTERVAL_MS + Math.random() * (AUTO_IDLE_MAX_INTERVAL_MS - AUTO_IDLE_MIN_INTERVAL_MS);
      }
    } else if (distanceMeters > GREETING_MIN_M && distanceMeters <= GREETING_MAX_M) {
      s.aiState = 'greeting';
      s.aiStateFramesLeft = 0;
    } else {
      s.aiState = 'idle_spawn';
      s.aiStateFramesLeft = 0;
      s.nextAutoHideAt = null; // re-roll fresh next time it's approached
      s.nextAutoIdleAt = null; // re-roll fresh next time it's approached
    }

    if (s.aiStateFramesLeft > 0) {
      s.aiStateFramesLeft -= 1;
    }

    state = s.aiState;

    if (state === 'idle_spawn') {
      message = '';
      s.vx *= 0.85;
      s.vz *= 0.85;
      s.squishX *= SQUISH_DECAY;
      s.squishZ *= SQUISH_DECAY;
    } else if (state === 'greeting') {
      message = 'SAYING HI!';
      dz = Math.sin(s.phase) * GREETING_BOB_AMPLITUDE_UNITS * dtSeconds * 10;
      s.vx *= 0.9;
      s.vz *= 0.9;
    } else if (state === 'idle_stand') {
      // Genuine movement pause between chase bursts. Velocity decays to
      // zero exactly like idle_spawn (so it actually stops, not just
      // "runs slower"), but stays classified separately so the
      // caller/UI can tell "resting mid-encounter" apart from "hasn't
      // noticed the player yet" if it ever wants to.
      message = 'STANDING STILL...';
      s.vx *= 0.85;
      s.vz *= 0.85;
      dx = s.vx * dtSeconds;
      dz = s.vz * dtSeconds;
      s.squishX *= SQUISH_DECAY;
      s.squishZ *= SQUISH_DECAY;
    } else {
      // running / aggressive_charge / tactical_dodge / obstacle_hide all
      // share the same fleeing-vector + boundary + squash pipeline, with
      // per-state modifications layered on top.
      if (isHackedGlobal) {
        message = 'SOMETHING IS WRONG WITH IT...';
      } else if (state === 'running' && chaseMode) {
        message = 'RUNNING AT YOU!';
      } else {
        message = 'RUNNING AWAY!';
      }

      const rawDist = Math.max(0.001, Math.hypot(effectiveWorldX, effectiveWorldZ));
      // fleeAngle always points AWAY from the player (origin -> veggie).
      // Whether a given state moves along it or its inverse is decided
      // per-state below (chaseMode flips 'running' to move along the
      // inverse, i.e. toward the player).
      let fleeAngle = Math.atan2(effectiveWorldZ, effectiveWorldX);

      if (isHackedGlobal) {
        fleeAngle += Math.PI; // hacked state always charges regardless of chaseMode
        const glitchAngle = s.phase * 3.1;
        visualAimGlitch = {
          dx: Math.cos(glitchAngle) * HACK_GLITCH_STRENGTH_PX,
          dy: Math.sin(glitchAngle) * HACK_GLITCH_STRENGTH_PX,
        };
      }

      const distUnits = Math.max(MIN_FLEE_DISTANCE_UNITS, rawDist);
      let speed = FLEE_SPEED_CONSTANT / distUnits;

      // --- Dash burst (unchanged trigger, still available in 'running') ---
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

      let targetVx;
      let targetVz;

      if (state === 'aggressive_charge') {
        // Charge straight at the player instead of fleeing.
        const chargeAngle = fleeAngle + Math.PI;
        const chargeSpeed = speed * AGGRESSIVE_CHARGE_SPEED_MULTIPLIER;
        targetVx = Math.cos(chargeAngle) * chargeSpeed;
        targetVz = Math.sin(chargeAngle) * chargeSpeed;
      } else if (state === 'tactical_dodge') {
        // Lateral boost perpendicular to the player, direction from the
        // swipe (falls back to a fixed perpendicular if none is passed
        // in on a state-continuation frame).
        const dodgeSign = swipeDirection === 'left' ? -1 : 1;
        const perp = fleeAngle + Math.PI / 2;
        targetVx = Math.cos(perp) * TACTICAL_DODGE_SPEED_UNITS_S * dodgeSign;
        targetVz = Math.sin(perp) * TACTICAL_DODGE_SPEED_UNITS_S * dodgeSign;
      } else if (state === 'obstacle_hide') {
        // Slide toward a previously-picked random angle along the
        // boundary rather than straight away from the player, so it
        // reads as "ducking behind cover" rather than just fleeing.
        targetVx = Math.cos(s.obstacleHideAngle) * speed;
        targetVz = Math.sin(s.obstacleHideAngle) * speed;
      } else {
        // 'running' — chases toward the player by default (chaseMode),
        // matching the Pokémon-GO-style "it's running at you" feel;
        // pass chaseMode:false for the original flee-away behavior.
        if (chaseMode && rawDist <= CHASE_STOP_DISTANCE_UNITS) {
          // Close enough — stop closing the gap and orbit instead of
          // clipping through the camera, so it lingers in view ready
          // to be caught.
          const orbitAngle = fleeAngle + Math.PI / 2;
          targetVx = Math.cos(orbitAngle) * CHASE_ORBIT_SPEED_UNITS_S;
          targetVz = Math.sin(orbitAngle) * CHASE_ORBIT_SPEED_UNITS_S;
        } else {
          const runAngle = chaseMode ? fleeAngle + Math.PI : fleeAngle;
          targetVx = Math.cos(runAngle) * speed;
          targetVz = Math.sin(runAngle) * speed;

          // Zig-zag jitter only applies while actually closing/opening
          // distance — charge/dodge/hide/orbit have their own deliberate
          // headings.
          const perpAngle = runAngle + Math.PI / 2;
          const jitter = Math.cos(s.phase * ZIGZAG_FREQUENCY * 10) * ZIGZAG_AMPLITUDE_UNITS_S;
          targetVx += Math.cos(perpAngle) * jitter;
          targetVz += Math.sin(perpAngle) * jitter;
        }
      }

      // Desperation drift back toward the player while pinned against
      // the roam boundary (applies regardless of which sub-state is active).
      if (s.cornerGrowth > 1.05) {
        const towardPlayerAngle = Math.atan2(-effectiveWorldZ, -effectiveWorldX);
        targetVx += Math.cos(towardPlayerAngle) * CORNER_BREAK_DRIFT_UNITS_S;
        targetVz += Math.sin(towardPlayerAngle) * CORNER_BREAK_DRIFT_UNITS_S;
      }

      s.vx += (targetVx - s.vx) * VELOCITY_BLEND_RATE;
      s.vz += (targetVz - s.vz) * VELOCITY_BLEND_RATE;

      dx = s.vx * dtSeconds;
      dz = s.vz * dtSeconds;

      // --- Roam-radius boundary bounce ---
      const nextX = effectiveWorldX + dx;
      const nextZ = effectiveWorldZ + dz;
      const nextDist = Math.hypot(nextX, nextZ);
      if (nextDist >= ROAM_MAX_RADIUS_UNITS) {
        s.vx = -s.vx * WALL_BOUNCE_MULTIPLIER;
        s.vz = -s.vz * WALL_BOUNCE_MULTIPLIER;
        const clampScale = rawDist > 0 ? (ROAM_MAX_RADIUS_UNITS - 0.05) / nextDist : 0;
        dx = nextX * clampScale - effectiveWorldX;
        dz = nextZ * clampScale - effectiveWorldZ;
        s.squishX = 1;
        s.squishZ = 1;
        bounced = true;
      }

      // --- Cornered growth + obstacle-hide entry ---
      const finalDist = Math.hypot(effectiveWorldX + dx, effectiveWorldZ + dz);
      isCornered = finalDist >= ROAM_MAX_RADIUS_UNITS - BOUNDARY_MARGIN_UNITS;

      s.cornerGrowth = isCornered
        ? Math.min(CORNER_GROWTH_MAX, s.cornerGrowth + CORNER_GROWTH_STEP)
        : Math.max(1, s.cornerGrowth - CORNER_GROWTH_STEP);

      // Gyro/compass-aware entry into obstacle_hide: if we're cornered
      // AND (when a device heading is available) currently behind the
      // player's facing direction, duck behind "cover" instead of just
      // vibrating on the boundary — this is what forces a real 180° turn
      // to find it again, since the hide angle is picked independent of
      // where the player is currently looking.
      if (
        isCornered &&
        state !== 'obstacle_hide' &&
        state !== 'aggressive_charge' &&
        s.aiStateFramesLeft <= 0
      ) {
        const bearingToVeggieDeg = (toDeg(Math.atan2(effectiveWorldZ, effectiveWorldX)) + 360) % 360;
        const behindPlayer =
          deviceHeadingDeg == null ||
          angleDiffDeg(bearingToVeggieDeg, deviceHeadingDeg) > HIDE_BEHIND_PLAYER_ANGLE_DEG;
        if (behindPlayer) {
          s.aiState = 'obstacle_hide';
          state = 'obstacle_hide';
          s.aiStateFramesLeft = OBSTACLE_HIDE_DURATION_FRAMES;
          s.obstacleHideAngle =
            Math.atan2(effectiveWorldZ, effectiveWorldX) +
            (Math.random() - 0.5) * 2 * OBSTACLE_HIDE_ANGLE_JITTER_RAD;
        }
      }

      // --- Squash/stretch composite ---
      s.squishX *= SQUISH_DECAY;
      s.squishZ *= SQUISH_DECAY;
      s.dashStretch *= DASH_STRETCH_DECAY;

      const stretchAlongFlee = dashActive ? 1 + s.dashStretch * 0.6 : 1;
      const squashAlongFlee = dashActive ? 1 - s.dashStretch * 0.25 : 1;
      const chargeBoost = state === 'aggressive_charge' ? AGGRESSIVE_CHARGE_SCALE_BOOST : 1;
      scaleX =
        s.cornerGrowth *
        chargeBoost *
        (1 - s.squishX * 0.3) *
        (Math.abs(Math.cos(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);
      scaleZ =
        s.cornerGrowth *
        chargeBoost *
        (1 - s.squishZ * 0.3) *
        (Math.abs(Math.sin(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);

      // --- Hazard trail ---
      if (s.frameCount % HAZARD_DROP_INTERVAL_FRAMES === 0) {
        s.hazardTrail.push({ x: effectiveWorldX + dx, z: effectiveWorldZ + dz, createdAt: now });
        if (s.hazardTrail.length > HAZARD_TRAIL_MAX_POINTS) s.hazardTrail.shift();
      }
      s.hazardTrail = s.hazardTrail.filter((p) => now - p.createdAt < HAZARD_LIFETIME_MS);

      for (const p of s.hazardTrail) {
        if (Math.hypot(p.x, p.z) < HAZARD_TRIGGER_RADIUS_UNITS) {
          spinoutTriggered = true;
          break;
        }
      }
    }

    // =================================================================
    // (1) Floor locking + inverse-depth scale — applied on top of the
    // squash/stretch/corner/charge scale above, uniformly across states.
    // =================================================================
    const worldY = floorY;
    const depthForScale = Math.max(DEPTH_SCALE_NEAR_UNITS, Math.hypot(effectiveWorldX + dx, effectiveWorldZ + dz));
    const depthT = Math.min(
      1,
      Math.max(
        0,
        (DEPTH_SCALE_REFERENCE_UNITS - depthForScale) / (DEPTH_SCALE_REFERENCE_UNITS - DEPTH_SCALE_NEAR_UNITS)
      )
    );
    const depthScaleMultiplier = DEPTH_SCALE_BASE + depthT * (DEPTH_SCALE_MAX - DEPTH_SCALE_BASE);
    scaleX *= depthScaleMultiplier;
    scaleZ *= depthScaleMultiplier;
    const scaleY = (scaleX + scaleZ) / 2; // no independent vertical squash source, so average X/Z

    // =================================================================
    // (4) Dynamic hitbox — grows with the same depth-driven scale so a
    // throw still registers against a visually-enlarged, close veggie.
    // =================================================================
    const fleaRadius = BASE_HITBOX_RADIUS_UNITS * ((scaleX + scaleZ) / 2);

    return {
      state,
      message,
      dx,
      dz,
      worldY,
      vx: s.vx,
      vz: s.vz,
      scaleX,
      scaleY,
      scaleZ,
      fleaRadius,
      isCornered,
      bounced,
      dashActive,
      breakoutTriggered,
      teleportDetected,
      correctedX,
      correctedZ,
      hazardTrail: s.hazardTrail,
      spinoutTriggered,
      visualAimGlitch,
    };
  }, []);

  /**
   * (7) Dead-reckoning reconciliation for multiplayer sync.
   *
   * Call this whenever a server/socket position update arrives for a
   * veggie. It does NOT open or manage a socket itself — the caller's
   * socket layer hands it `{ x, z, vx, vz, serverTimestampMs }`, and this
   * extrapolates for the elapsed network latency, then returns a
   * blended (or snapped, if the gap is large) corrected position for the
   * local render loop to move toward instead of just teleporting to it.
   */
  const reconcileRemoteState = useCallback((veggieId, remote) => {
    const s = ensureVeggieState(veggieId);
    const now = performance.now();
    const { x: remoteX, z: remoteZ, vx: remoteVx = 0, vz: remoteVz = 0, serverTimestampMs } = remote;

    const latencyMs = serverTimestampMs != null ? Math.max(0, now - serverTimestampMs) : 0;
    const extrapolateMs = Math.min(latencyMs, DEAD_RECKONING_MAX_EXTRAPOLATION_MS);
    const extrapolateS = extrapolateMs / 1000;

    const predictedX = remoteX + remoteVx * extrapolateS;
    const predictedZ = remoteZ + remoteVz * extrapolateS;

    const localX = s.lastKnownX != null ? s.lastKnownX : predictedX;
    const localZ = s.lastKnownZ != null ? s.lastKnownZ : predictedZ;
    const gap = Math.hypot(predictedX - localX, predictedZ - localZ);

    let correctedX;
    let correctedZ;
    if (gap > DEAD_RECKONING_SNAP_THRESHOLD_UNITS) {
      // Too far off to smoothly reconcile (e.g. just joined, or a long
      // disconnect) — snap straight to the predicted authoritative spot.
      correctedX = predictedX;
      correctedZ = predictedZ;
    } else {
      correctedX = localX + (predictedX - localX) * DEAD_RECKONING_BLEND_RATE;
      correctedZ = localZ + (predictedZ - localZ) * DEAD_RECKONING_BLEND_RATE;
    }

    s.lastKnownX = correctedX;
    s.lastKnownZ = correctedZ;
    s.lastKnownAt = now;
    s.lastRemoteAt = now;
    s.vx = remoteVx;
    s.vz = remoteVz;

    return { worldX: correctedX, worldZ: correctedZ, snapped: gap > DEAD_RECKONING_SNAP_THRESHOLD_UNITS };
  }, []);

  /** Drop stale per-veggie state (e.g. after a catch or despawn) so it doesn't leak forever. */
  const clearVeggieState = useCallback((veggieId) => {
    delete stateRef.current[veggieId];
  }, []);

  return { processEvasionFrame, reconcileRemoteState, clearVeggieState };
}
