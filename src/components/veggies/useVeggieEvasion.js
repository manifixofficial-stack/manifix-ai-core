// hooks/veggies/useVeggieEvasion.js
//
// Per-frame veggie AI: greets the player at mid-range, then — once
// breached at close range — runs for its life with full cartoon panic
// physics: a crosshair-relative fleeing vector, elastic wall bouncing
// with squash/stretch, a "cornered" desperation growth spike, Perlin-ish
// zig-zag jitter, a slippery hazard trail it leaves behind, randomized
// speed-burst dashes, and (when the server is hacked) a full behavior
// inversion that drags the player's own crosshair toward danger instead
// of the veggie fleeing it.
//
// This is screen-space pixel physics (crosshairX/Y, screenW/H, vx/vy),
// NOT the lat/lng geo-offset model the previous version used — wall
// bounce and hazard trails only make sense against actual canvas bounds.
// The GPS-based distanceMeters is still what decides *whether* a veggie
// is idle/greeting/running (that's the real-world catch-range mechanic);
// everything below only kicks in once state === 'running'.
//
// Usage inside GameCanvas.jsx (called once per frame per visible veggie):
//
//   const { processEvasionFrame, clearVeggieState } = useVeggieEvasion();
//
//   const result = processEvasionFrame(veggie.id, {
//     distanceMeters: veggie.distanceMeters,        // real-world GPS distance, gates idle/greeting/running
//     screenX: veggie.screenX, screenY: veggie.screenY,   // veggie's current projected pixel position
//     crosshairX: viewport.centerX, crosshairY: viewport.centerY, // player's aim point
//     screenW: canvasWidth, screenH: canvasHeight,
//     isHackedGlobal,
//     dtSeconds,                                      // frame delta, e.g. from your rAF loop
//     obstacleZones,                                  // optional [{x,y}] danger points for the hack pull
//   });
//
//   // result.dx/dy -> add to veggie.screenX/screenY this frame
//   // result.scaleX/scaleY -> apply to the sprite's transform
//   // result.hazardTrail -> render as slippery trail markers
//   // result.spinoutTriggered -> lock controls / spin the screen if true
//   // result.crosshairPull -> (hacked only) add to the PLAYER's own aim state
//
//   // on catch/despawn:
//   clearVeggieState(veggie.id);

import { useCallback, useRef } from 'react';

// --- Distance-gated state thresholds (GPS meters, unchanged mechanic) ---
const GREETING_MIN_M = 12;
const GREETING_MAX_M = 25;
const EVASION_TRIGGER_M = 8;
const GREETING_BOB_AMPLITUDE_PX = 4;

// --- Core fleeing vector: Speed = Base / Distance ---
const FLEE_SPEED_CONSTANT = 6000;   // tune so speed feels right at typical on-screen distances
const MIN_FLEE_DISTANCE_PX = 40;    // floor so speed doesn't blow up as distance -> 0
const VELOCITY_BLEND_RATE = 0.25;   // how fast actual velocity chases the target vector (0-1)

// --- Elastic wall bounce ---
const WALL_BOUNCE_MULTIPLIER = 1.2;
const WALL_MARGIN_PX = 4;           // sprite half-width-ish buffer so it visibly touches the edge before bouncing
const SQUISH_DECAY = 0.82;          // per-frame decay of the post-bounce squash/stretch pulse

// --- Cornered desperation growth ---
const CORNER_MARGIN_PX = 70;
const CORNER_GROWTH_MAX = 2.5;
const CORNER_GROWTH_FRAMES = 30;
const CORNER_GROWTH_STEP = (CORNER_GROWTH_MAX - 1) / CORNER_GROWTH_FRAMES;
const CORNER_BREAK_DRIFT = 140; // extra forward-drift speed injected toward screen center to help it break the lock

// --- Perlin-ish zig-zag (cosine jitter standing in for Perlin noise —
// cheap, deterministic per-veggie via its own phase, and reads the same
// "frantic unpredictable weave" the real thing would give) ---
const ZIGZAG_FREQUENCY = 0.35;
const ZIGZAG_AMPLITUDE_PX_S = 110;

// --- Slippery hazard trail ---
const HAZARD_DROP_INTERVAL_FRAMES = 6;
const HAZARD_LIFETIME_MS = 4000;
const HAZARD_TRIGGER_RADIUS_PX = 18;
const HAZARD_TRAIL_MAX_POINTS = 40;

// --- 3-stage hyper-speed dash burst ---
const DASH_TRIGGER_CLOSING_SPEED_PX_S = 150; // how fast the crosshair must be closing in to spook a dash
const DASH_SPEED_MULTIPLIER = 3.0;
const DASH_DURATION_FRAMES = 8;
const DASH_COOLDOWN_MS = 2500;
const DASH_STRETCH_DECAY = 0.8;

// --- Cockroach gravity-well hijack (hacked state) ---
const HACK_PULL_STRENGTH_PX = 14; // per-frame nudge applied to the player's own crosshair, toward danger

export function useVeggieEvasion() {
  const stateRef = useRef({}); // veggieId -> physics + timing state

  const ensureVeggieState = (veggieId) => {
    if (!stateRef.current[veggieId]) {
      stateRef.current[veggieId] = {
        phase: Math.random() * 100,
        vx: 0,
        vy: 0,
        squishX: 0,
        squishY: 0,
        cornerGrowth: 1,
        dashFramesLeft: 0,
        dashCooldownUntil: 0,
        dashStretch: 0,
        prevCrosshairDist: null,
        hazardTrail: [],
        frameCount: 0,
      };
    }
    return stateRef.current[veggieId];
  };

  /**
   * @param {string} veggieId
   * @param {Object} params
   * @param {number} params.distanceMeters   real-world GPS distance to player — gates idle/greeting/running
   * @param {number} params.screenX          veggie's current projected pixel X
   * @param {number} params.screenY          veggie's current projected pixel Y
   * @param {number} params.crosshairX       player's current aim/viewport-center pixel X
   * @param {number} params.crosshairY       player's current aim/viewport-center pixel Y
   * @param {number} params.screenW          canvas width in pixels
   * @param {number} params.screenH          canvas height in pixels
   * @param {boolean} [params.isHackedGlobal=false]
   * @param {number} [params.dtSeconds=1/60]
   * @param {Array<{x:number,y:number}>} [params.obstacleZones] optional danger points the hack pull drags toward
   */
  const processEvasionFrame = useCallback((veggieId, params) => {
    const {
      distanceMeters,
      screenX,
      screenY,
      crosshairX,
      crosshairY,
      screenW,
      screenH,
      isHackedGlobal = false,
      dtSeconds = 1 / 60,
      obstacleZones,
    } = params;

    const s = ensureVeggieState(veggieId);
    s.phase += 0.05;
    s.frameCount += 1;

    let state = 'idle';
    let message = '';
    let dx = 0;
    let dy = 0;
    let scaleX = 1;
    let scaleY = 1;
    let spinoutTriggered = false;
    let bounced = false;
    let dashActive = false;
    let isCornered = false;
    let crosshairPull = null;

    if (distanceMeters <= EVASION_TRIGGER_M) {
      state = 'running';
      message = isHackedGlobal ? '🪳 SOMETHING IS WRONG WITH IT...' : '⚡ RUNNING AWAY!';

      // --- 1. Core crosshair fleeing vector ---
      // Angle FROM the crosshair TO the veggie is already the "away from
      // aim point" direction, so no extra inversion is needed once you've
      // anchored the vector at the crosshair rather than the veggie.
      const rawDx = screenX - crosshairX;
      const rawDy = screenY - crosshairY;
      const rawDist = Math.max(1, Math.hypot(rawDx, rawDy));
      let fleeAngle = Math.atan2(rawDy, rawDx);

      // --- Cockroach Gravity Well Hijack ---
      // Hacked veggies invert the whole relationship: instead of fleeing,
      // they chase the crosshair (angle + 180°), AND emit a pull vector
      // the player's own aim should be dragged by, toward whatever danger
      // point is nearest — forcing a crash rather than a clean catch.
      if (isHackedGlobal) {
        fleeAngle += Math.PI; // chase instead of flee

        const dangerPoints =
          obstacleZones && obstacleZones.length
            ? obstacleZones
            : [
                { x: 0, y: 0 },
                { x: screenW, y: 0 },
                { x: 0, y: screenH },
                { x: screenW, y: screenH },
              ]; // fall back to screen corners as stand-in "danger quadrants"

        let nearest = dangerPoints[0];
        let nearestDist = Infinity;
        dangerPoints.forEach((p) => {
          const d = Math.hypot(p.x - crosshairX, p.y - crosshairY);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = p;
          }
        });
        const pullAngle = Math.atan2(nearest.y - crosshairY, nearest.x - crosshairX);
        crosshairPull = {
          dx: Math.cos(pullAngle) * HACK_PULL_STRENGTH_PX,
          dy: Math.sin(pullAngle) * HACK_PULL_STRENGTH_PX,
        };
      }

      const distPx = Math.max(MIN_FLEE_DISTANCE_PX, rawDist);
      let speed = FLEE_SPEED_CONSTANT / distPx; // Speed = Base / Distance

      // --- 9. 3-stage hyper-speed dash burst ---
      // Triggered when the crosshair is closing in fast, i.e. the veggie
      // senses it's about to get caught and panics into a speed spike.
      const now = performance.now();
      if (s.prevCrosshairDist != null && dtSeconds > 0) {
        const closingSpeed = (s.prevCrosshairDist - rawDist) / dtSeconds;
        if (
          closingSpeed > DASH_TRIGGER_CLOSING_SPEED_PX_S &&
          s.dashFramesLeft <= 0 &&
          now >= s.dashCooldownUntil
        ) {
          s.dashFramesLeft = DASH_DURATION_FRAMES;
          s.dashCooldownUntil = now + DASH_COOLDOWN_MS;
          s.dashStretch = 1;
        }
      }
      s.prevCrosshairDist = rawDist;

      if (s.dashFramesLeft > 0) {
        dashActive = true;
        speed *= DASH_SPEED_MULTIPLIER;
        s.dashFramesLeft -= 1;
      }

      let targetVx = Math.cos(fleeAngle) * speed;
      let targetVy = Math.sin(fleeAngle) * speed;

      // --- 4. Perlin-ish zig-zag deviation ---
      // Lateral jitter perpendicular to the current flee heading, so the
      // path weaves instead of running dead straight.
      const perpAngle = fleeAngle + Math.PI / 2;
      const jitter = Math.cos(s.phase * ZIGZAG_FREQUENCY * 10) * ZIGZAG_AMPLITUDE_PX_S;
      targetVx += Math.cos(perpAngle) * jitter;
      targetVy += Math.sin(perpAngle) * jitter;

      // --- 7. Desperation inflation forward drift ---
      // While cornered (computed below from last frame's position, then
      // reapplied this frame), inject extra drift back toward screen
      // center to help the veggie actually break out of the corner lock
      // rather than just vibrating in place.
      if (s.cornerGrowth > 1.05) {
        const centerAngle = Math.atan2(screenH / 2 - screenY, screenW / 2 - screenX);
        targetVx += Math.cos(centerAngle) * CORNER_BREAK_DRIFT;
        targetVy += Math.sin(centerAngle) * CORNER_BREAK_DRIFT;
      }

      // Smoothly blend actual velocity toward the target vector rather
      // than snapping, so direction changes read as steering, not teleport.
      s.vx += (targetVx - s.vx) * VELOCITY_BLEND_RATE;
      s.vy += (targetVy - s.vy) * VELOCITY_BLEND_RATE;

      dx = s.vx * dtSeconds;
      dy = s.vy * dtSeconds;

      // --- 2. Kinetic wall bouncing ---
      const nextX = screenX + dx;
      const nextY = screenY + dy;
      if (nextX <= WALL_MARGIN_PX || nextX >= screenW - WALL_MARGIN_PX) {
        s.vx = -s.vx * WALL_BOUNCE_MULTIPLIER;
        dx = Math.max(WALL_MARGIN_PX - screenX, Math.min(screenW - WALL_MARGIN_PX - screenX, dx));
        s.squishX = 1;
        bounced = true;
      }
      if (nextY <= WALL_MARGIN_PX || nextY >= screenH - WALL_MARGIN_PX) {
        s.vy = -s.vy * WALL_BOUNCE_MULTIPLIER;
        dy = Math.max(WALL_MARGIN_PX - screenY, Math.min(screenH - WALL_MARGIN_PX - screenY, dy));
        s.squishY = 1;
        bounced = true;
      }

      // --- 3. Cornered growth defense ---
      const finalX = screenX + dx;
      const finalY = screenY + dy;
      const nearLeft = finalX < CORNER_MARGIN_PX;
      const nearRight = finalX > screenW - CORNER_MARGIN_PX;
      const nearTop = finalY < CORNER_MARGIN_PX;
      const nearBottom = finalY > screenH - CORNER_MARGIN_PX;
      isCornered = (nearLeft || nearRight) && (nearTop || nearBottom);

      s.cornerGrowth = isCornered
        ? Math.min(CORNER_GROWTH_MAX, s.cornerGrowth + CORNER_GROWTH_STEP)
        : Math.max(1, s.cornerGrowth - CORNER_GROWTH_STEP);

      // --- Squash/stretch composite: wall-impact pulse + dash stretch + corner growth ---
      s.squishX *= SQUISH_DECAY;
      s.squishY *= SQUISH_DECAY;
      s.dashStretch *= DASH_STRETCH_DECAY;

      const stretchAlongFlee = dashActive ? 1 + s.dashStretch * 0.6 : 1;
      const squashAlongFlee = dashActive ? 1 - s.dashStretch * 0.25 : 1;
      scaleX = s.cornerGrowth * (1 - s.squishX * 0.3) * (Math.abs(Math.cos(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);
      scaleY = s.cornerGrowth * (1 - s.squishY * 0.3) * (Math.abs(Math.sin(fleeAngle)) > 0.5 ? stretchAlongFlee : squashAlongFlee);

      // --- 8. Slippery hazard trail drop ---
      if (s.frameCount % HAZARD_DROP_INTERVAL_FRAMES === 0) {
        s.hazardTrail.push({ x: finalX, y: finalY, createdAt: now });
        if (s.hazardTrail.length > HAZARD_TRAIL_MAX_POINTS) s.hazardTrail.shift();
      }
      s.hazardTrail = s.hazardTrail.filter((p) => now - p.createdAt < HAZARD_LIFETIME_MS);

      for (const p of s.hazardTrail) {
        if (Math.hypot(p.x - crosshairX, p.y - crosshairY) < HAZARD_TRIGGER_RADIUS_PX) {
          spinoutTriggered = true;
          break;
        }
      }
    } else if (distanceMeters > GREETING_MIN_M && distanceMeters <= GREETING_MAX_M) {
      state = 'greeting';
      message = '👋 SAYING HI!';
      dy = Math.sin(s.phase) * GREETING_BOB_AMPLITUDE_PX * dtSeconds * 10;
      // Ambient velocity settles back to rest so it doesn't carry residual
      // panic speed into the next running phase.
      s.vx *= 0.9;
      s.vy *= 0.9;
    } else {
      // Idle — let any residual velocity/squish bleed off.
      s.vx *= 0.85;
      s.vy *= 0.85;
      s.squishX *= SQUISH_DECAY;
      s.squishY *= SQUISH_DECAY;
    }

    return {
      state,
      message,
      dx,
      dy,
      vx: s.vx,
      vy: s.vy,
      scaleX,
      scaleY,
      isCornered,
      bounced,
      dashActive,
      hazardTrail: s.hazardTrail,
      spinoutTriggered,
      crosshairPull, // non-null only when isHackedGlobal — apply to the PLAYER's aim state, not the veggie
    };
  }, []);

  /** Drop stale per-veggie state (e.g. after a catch or despawn) so it doesn't leak forever. */
  const clearVeggieState = useCallback((veggieId) => {
    delete stateRef.current[veggieId];
  }, []);

  return { processEvasionFrame, clearVeggieState };
}

export default useVeggieEvasion;
