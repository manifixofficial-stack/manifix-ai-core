import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Taunt clips, one per veggie type. Swap paths for whatever's in your
// public/assets folder.
// ---------------------------------------------------------------------------
const TAUNT_SOURCES = {
  carrot: '/sounds/taunts/carrot-taunt.mp3',
  tomato: '/sounds/taunts/tomato-taunt.mp3',
  broccoli: '/sounds/taunts/broccoli-taunt.mp3',
  golden: '/sounds/taunts/golden-taunt.mp3',
};

const MAX_AUDIBLE_DISTANCE_M = 60;   // beyond this a veggie is too far to hear
const MIN_TAUNT_INTERVAL_MS = 3500;  // per-veggie cooldown so it doesn't spam
const MAX_PAN_ANGLE_DEG = 90;        // angles beyond this just hard-pan to a side

/**
 * useVeggieTaunt
 * ---------------------------------------------------------------------
 * Spatializes veggie "taunt" sound effects using the exact same bearing
 * math GameCanvas already computes for AR positioning — no re-derivation,
 * no duplicated trig. Feed it the `relAngle` (degrees, negative = left of
 * where the camera/player is facing, positive = right) and `distance`
 * (meters) that GameCanvas produces per-veggie each frame, and it'll pan
 * the clip across the stereo field and fade volume with distance.
 *
 * Usage inside GameCanvas.jsx:
 *
 *   const { tauntFromFrame } = useVeggieTaunt();
 *
 *   useEffect(() => {
 *     tauntFromFrame([...visibleVeggies, ...edgeVeggies]);
 *   }, [visibleVeggies, edgeVeggies, tauntFromFrame]);
 */
export function useVeggieTaunt({ enabled = true, masterVolume = 0.6 } = {}) {
  const ctxRef = useRef(null);
  const buffersRef = useRef({});
  const lastPlayedRef = useRef({});

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctxRef.current = new Ctx();
    return ctxRef.current;
  }, []);

  // Mobile browsers block audio until a user gesture — resume the context
  // on the first tap/click instead of failing silently forever.
  useEffect(() => {
    if (!enabled) return undefined;
    const unlock = () => {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, [enabled, ensureContext]);

  // Preload + decode every taunt clip once, up front.
  useEffect(() => {
    if (!enabled) return undefined;
    const ctx = ensureContext();
    if (!ctx) return undefined;
    let cancelled = false;

    Object.entries(TAUNT_SOURCES).forEach(([type, url]) => {
      if (buffersRef.current[type]) return;
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          if (!cancelled) buffersRef.current[type] = buffer;
        })
        .catch(() => {
          // Missing/broken asset — that veggie type just stays silent
          // instead of throwing mid-game.
        });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, ensureContext]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  /**
   * Play a single spatialized taunt.
   *
   * @param {string} veggieId       unique id, used for the per-veggie cooldown
   * @param {string} veggieType     one of TAUNT_SOURCES keys
   * @param {number} relAngleDeg    bearing relative to facing direction; the
   *                                same `relAngle` GameCanvas already derives
   *                                as `normalizeRelAngle(bearing - heading)`
   * @param {number} distanceMeters
   */
  const playTaunt = useCallback(
    (veggieId, veggieType, relAngleDeg, distanceMeters) => {
      if (!enabled) return;
      const ctx = ctxRef.current;
      const buffer = buffersRef.current[veggieType];
      if (!ctx || !buffer) return;
      if (distanceMeters > MAX_AUDIBLE_DISTANCE_M) return;

      const now = performance.now();
      const last = lastPlayedRef.current[veggieId] || 0;
      if (now - last < MIN_TAUNT_INTERVAL_MS) return;
      lastPlayedRef.current[veggieId] = now;

      if (ctx.state === 'suspended') ctx.resume();

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      const proximity = 1 - Math.min(1, distanceMeters / MAX_AUDIBLE_DISTANCE_M);
      gain.gain.value = masterVolume * (0.25 + proximity * 0.75);

      const clampedAngle = Math.max(-MAX_PAN_ANGLE_DEG, Math.min(MAX_PAN_ANGLE_DEG, relAngleDeg));
      const pan = clampedAngle / MAX_PAN_ANGLE_DEG; // -1 (hard left) .. 1 (hard right)

      if (typeof ctx.createStereoPanner === 'function') {
        const panNode = ctx.createStereoPanner();
        panNode.pan.value = pan;
        source.connect(gain).connect(panNode).connect(ctx.destination);
      } else {
        // Older Safari has no StereoPannerNode — emulate the same left/right
        // field with an equal-power PannerNode instead.
        const panNode = ctx.createPanner();
        panNode.panningModel = 'equalpower';
        panNode.setPosition(pan, 0, -1);
        source.connect(gain).connect(panNode).connect(ctx.destination);
      }

      source.start(0);
    },
    [enabled, masterVolume]
  );

  /**
   * Convenience: hand it a frame's worth of in-view veggies (objects with
   * `id`, `type`, `relAngle`, `distance` — exactly what GameCanvas's
   * `visibleVeggies`/`edgeVeggies` arrays already carry) and it'll taunt
   * whichever ones are due, respecting each veggie's own cooldown.
   */
  const tauntFromFrame = useCallback(
    (veggiesInView) => {
      if (!enabled || !veggiesInView) return;
      veggiesInView.forEach((v) => {
        if (v.relAngle == null || v.distance == null) return;
        playTaunt(v.id, v.type, v.relAngle, v.distance);
      });
    },
    [enabled, playTaunt]
  );

  return { playTaunt, tauntFromFrame };
}

export default useVeggieTaunt;
