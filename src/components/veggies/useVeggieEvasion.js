// hooks/useVeggieEvasion.js
//
// Per-frame AI evasion: veggies "say hi" when a player lingers in mid
// range, and actively run away once the player breaches close range.
// Pure lat/lng offset math — no rendering here, GameCanvas.jsx applies
// the returned offsets to a veggie's base coordinates before recomputing
// its on-screen distance/bearing for that frame.
//
// Adapted to this project's field names: takes `distanceMeters` and
// `bearingToPlayerDeg` directly (computed once per frame in GameCanvas
// via the existing metersBetween/bearingDegrees from utils/spatialGeoMath)
// rather than a veggie.dist/coordinates shape, so it drops straight into
// the existing visibleVeggies/edgeVeggies useMemo without changing that
// data model.

import { useCallback, useRef } from 'react';

const GREETING_MIN_M = 12;
const GREETING_MAX_M = 25;
const EVASION_TRIGGER_M = 8;

const GREETING_BOB_AMPLITUDE_DEG = 0.000008; // ~1m of lat wobble at most latitudes
const EVASION_STEP_DEG = 0.00002;            // ~2m of run-away drift per frame

export function useVeggieEvasion() {
  const stateRef = useRef({}); // veggieId -> { phase }

  /**
   * @param {string} veggieId
   * @param {number} distanceMeters - player's current distance to this veggie's BASE (un-offset) coords
   * @param {number} bearingToPlayerDeg - bearing FROM the veggie TO the player (i.e. bearingDegrees(veggiePos, playerPos))
   * @returns {{ latOffset: number, lngOffset: number, state: 'idle'|'greeting'|'running', message: string }}
   */
  const processEvasionFrame = useCallback((veggieId, distanceMeters, bearingToPlayerDeg) => {
    if (!stateRef.current[veggieId]) {
      stateRef.current[veggieId] = { phase: Math.random() * 100 };
    }
    const local = stateRef.current[veggieId];
    local.phase += 0.05;

    let latOffset = 0;
    let lngOffset = 0;
    let state = 'idle';
    let message = '';

    if (distanceMeters <= EVASION_TRIGGER_M) {
      state = 'running';
      message = '⚡ RUNNING AWAY!';
      // Bearing FROM veggie TO player, so fleeing directly away from the
      // player is the same bearing rotated 180°.
      const escapeBearing = (bearingToPlayerDeg + 180) % 360;
      const escapeRad = (escapeBearing * Math.PI) / 180;
      latOffset = Math.cos(escapeRad) * EVASION_STEP_DEG;
      lngOffset = Math.sin(escapeRad) * EVASION_STEP_DEG;
    } else if (distanceMeters > GREETING_MIN_M && distanceMeters <= GREETING_MAX_M) {
      state = 'greeting';
      message = '👋 SAYING HI!';
      // Gentle vertical bob, no net displacement — a wave animation, not
      // a flee response.
      latOffset = Math.sin(local.phase) * GREETING_BOB_AMPLITUDE_DEG;
    }

    return { latOffset, lngOffset, state, message };
  }, []);

  /** Drop stale per-veggie state (e.g. after a catch) so it doesn't leak forever. */
  const clearVeggieState = useCallback((veggieId) => {
    delete stateRef.current[veggieId];
  }, []);

  return { processEvasionFrame, clearVeggieState };
}
