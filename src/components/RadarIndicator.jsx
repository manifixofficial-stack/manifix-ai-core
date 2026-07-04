import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const LABELS = { carrot: 'Carrot', tomato: 'Tomato', broccoli: 'Broccoli', golden: 'Golden Veggie' };

// -----------------------------------------------------------------------
// Proximity pulse tunables
// -----------------------------------------------------------------------
// The arrow flashes faster and bigger the closer the target gets, capping
// out at a full panic-blink once it's basically on top of the player.
const PANIC_DISTANCE_M = 12; // under this, pulse locks to the fastest rate
const FAR_DISTANCE_M = 70; // at/beyond this, pulse is at its slowest/calmest
const MIN_PULSE_MS = 150; // panic-blink duration
const MAX_PULSE_MS = 1100; // calm flash duration
const MIN_PULSE_SCALE = 1.15;
const MAX_PULSE_SCALE = 1.6;

// -----------------------------------------------------------------------
// Whiplash spring tunables
// -----------------------------------------------------------------------
// Two independent things push the arrow toward "elastic overshoot":
// spinning the phone fast, and the target being close. Either one drops
// damping toward MIN_DAMPING so the spring visibly bounces past the
// target bearing before settling, instead of easing straight to it.
const BASE_DAMPING = 24;
const MIN_DAMPING = 12;
const BASE_STIFFNESS = 260;
const FAST_SPIN_STIFFNESS = 380;
const CLOSE_DAMPING_DISTANCE_M = 20; // distance under which damping starts dropping
const FAST_SPIN_DEG_PER_SEC = 220; // heading change rate that counts as "whipped around"

// -----------------------------------------------------------------------
// Edge-snap tunables
// -----------------------------------------------------------------------
const EDGE_MARGIN_PX = 34;

// -----------------------------------------------------------------------
// Hack tunables
// -----------------------------------------------------------------------
const HACKED_ARROW_COUNT = 4;
const HACKED_REDIRECT_MS = 220; // how often the fake arrows re-scramble

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Normalize to a signed -180..180 delta so the arrow always takes the
// shorter rotation path (and so spin-velocity math doesn't spike at the
// 0/360 wraparound).
function signedDelta(deg) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// Interpolates linearly, clamping t into [0, 1] first.
function lerp(a, b, t) {
  const ct = clamp(t, 0, 1);
  return a + (b - a) * ct;
}

function pulseTimingFor(distance) {
  // t = 0 at FAR_DISTANCE_M (calm), t = 1 at PANIC_DISTANCE_M (panic)
  const t = clamp(1 - (distance - PANIC_DISTANCE_M) / (FAR_DISTANCE_M - PANIC_DISTANCE_M), 0, 1);
  // Exponential easing (t^2) so the ramp-up into panic feels accelerating
  // rather than linear — calm for most of the approach, then a rapid
  // spike in the last few meters.
  const eased = t * t;
  return {
    durationMs: distance <= PANIC_DISTANCE_M ? MIN_PULSE_MS : lerp(MAX_PULSE_MS, MIN_PULSE_MS, eased),
    scale: distance <= PANIC_DISTANCE_M ? MAX_PULSE_SCALE : lerp(MIN_PULSE_SCALE, MAX_PULSE_SCALE, eased),
  };
}

function springFor(distance, spinDegPerSec) {
  const isFastSpin = spinDegPerSec > FAST_SPIN_DEG_PER_SEC;
  const closeT = clamp(1 - distance / CLOSE_DAMPING_DISTANCE_M, 0, 1);
  const distanceDamping = lerp(BASE_DAMPING, MIN_DAMPING, closeT);
  const damping = isFastSpin ? Math.min(MIN_DAMPING, distanceDamping) : distanceDamping;
  const stiffness = isFastSpin ? FAST_SPIN_STIFFNESS : BASE_STIFFNESS;
  return { type: 'spring', stiffness, damping };
}

// Pure trig projection: takes a bearing (relative to the phone's current
// forward direction, 0 = straight ahead) and walks it out to wherever it
// crosses the screen's bounding box, so the marker always rides the
// outermost edge instead of floating in open space or clipping off-frame.
function edgePosition(relBearingDeg, w, h, margin) {
  const rad = (relBearingDeg * Math.PI) / 180;
  const dirX = Math.sin(rad);
  const dirY = -Math.cos(rad);
  const halfW = w / 2 - margin;
  const halfH = h / 2 - margin;
  const scaleX = Math.abs(dirX) > 1e-6 ? halfW / Math.abs(dirX) : Infinity;
  const scaleY = Math.abs(dirY) > 1e-6 ? halfH / Math.abs(dirY) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  const x = clamp(w / 2 + dirX * scale, margin, w - margin);
  const y = clamp(h / 2 + dirY * scale, margin, h - margin);
  return { x, y };
}

/**
 * Compass-style arrow pointing toward the nearest tracked veggie, shown
 * whenever it's too far to have appeared on screen yet.
 *
 * bearingDeg is 0 = north, 90 = east, matching bearingScreenPos's
 * convention in GameCanvas so the arrow and the eventual on-screen spawn
 * agree. deviceHeadingDeg is the phone's own current compass heading in
 * the same convention — the arrow tracks bearingDeg - deviceHeadingDeg
 * (i.e. "how far to turn from where you're facing now"), so it visibly
 * whips around as the player spins their phone rather than staying
 * pinned to true north on screen.
 *
 * When isHacked is true, the real reading is abandoned entirely: the
 * indicator flips to a neon-red glitch state and throws out several
 * jittering fake arrows pointing in random directions instead, so the
 * player can't trust it.
 */
export default function RadarIndicator({
  type,
  distanceMeters,
  bearingDeg,
  deviceHeadingDeg = 0,
  isHacked = false,
  screenW,
  screenH,
}) {
  const w = screenW || (typeof window !== 'undefined' ? window.innerWidth : 375);
  const h = screenH || (typeof window !== 'undefined' ? window.innerHeight : 812);

  const relBearing = useMemo(
    () => (Number.isFinite(bearingDeg) ? signedDelta(bearingDeg - deviceHeadingDeg) : 0),
    [bearingDeg, deviceHeadingDeg]
  );

  // Track how fast the relative bearing is changing so a hard, fast
  // whip-around of the phone can be told apart from a slow, deliberate
  // turn — only the former should trigger the elastic overshoot.
  const prevRef = useRef({ rel: relBearing, ts: performance.now() });
  const [spinDegPerSec, setSpinDegPerSec] = useState(0);

  useEffect(() => {
    const now = performance.now();
    const dt = Math.max((now - prevRef.current.ts) / 1000, 0.001);
    const delta = Math.abs(signedDelta(relBearing - prevRef.current.rel));
    setSpinDegPerSec(delta / dt);
    prevRef.current = { rel: relBearing, ts: now };
  }, [relBearing]);

  // Fake arrows shown while isHacked is true — re-scrambled on an
  // interval so they read as actively glitching rather than just static
  // random noise.
  const [fakeAngles, setFakeAngles] = useState(() =>
    Array.from({ length: HACKED_ARROW_COUNT }, () => Math.random() * 360)
  );

  useEffect(() => {
    if (!isHacked) return undefined;
    const id = setInterval(() => {
      setFakeAngles(Array.from({ length: HACKED_ARROW_COUNT }, () => Math.random() * 360));
    }, HACKED_REDIRECT_MS);
    return () => clearInterval(id);
  }, [isHacked]);

  if (distanceMeters == null || !Number.isFinite(distanceMeters)) return null;

  if (isHacked) {
    return (
      <div style={styles.hackedLayer}>
        {fakeAngles.map((angle, i) => {
          const pos = edgePosition(angle, w, h, EDGE_MARGIN_PX);
          return (
            <motion.div
              key={i}
              style={{ ...styles.hackedArrowWrap, left: pos.x, top: pos.y }}
              animate={{
                x: [0, -3, 3, -2, 2, 0],
                y: [0, 2, -2, 3, -3, 0],
                rotate: [angle, angle + 8, angle - 8, angle],
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 0.35, repeat: Infinity, delay: i * 0.05 }}
            >
              <div style={styles.hackedArrow}>▲</div>
            </motion.div>
          );
        })}
        <div style={styles.hackedLabel}>⚠ SIGNAL CORRUPTED ⚠</div>
      </div>
    );
  }

  const { durationMs, scale } = pulseTimingFor(distanceMeters);
  const spring = springFor(distanceMeters, spinDegPerSec);
  const pos = edgePosition(relBearing, w, h, EDGE_MARGIN_PX);
  const isPanicking = distanceMeters <= PANIC_DISTANCE_M;

  return (
    <div style={styles.layer}>
      <motion.div
        style={{ ...styles.arrowWrap, left: pos.x, top: pos.y }}
        animate={{ rotate: relBearing }}
        transition={spring}
      >
        <motion.div
          style={{ ...styles.arrow, color: isPanicking ? '#ff5a5a' : '#fef08a' }}
          animate={{ scale: [1, scale, 1] }}
          transition={{ duration: durationMs / 1000, repeat: Infinity, ease: 'easeInOut' }}
        >
          ▲
        </motion.div>
      </motion.div>

      <div style={styles.label}>
        {LABELS[type] || type}: {Math.round(distanceMeters)}m away
      </div>
    </div>
  );
}

const styles = {
  layer: {
    position: 'absolute', inset: 0, zIndex: 45, pointerEvents: 'none',
  },
  arrowWrap: {
    position: 'absolute', transform: 'translate(-50%, -50%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  arrow: {
    fontSize: 26, lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.6))',
  },
  label: {
    position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999,
    background: 'rgba(0,0,0,0.55)', color: '#fef08a', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  hackedLayer: {
    position: 'absolute', inset: 0, zIndex: 46, pointerEvents: 'none',
  },
  hackedArrowWrap: {
    position: 'absolute', transform: 'translate(-50%, -50%)',
  },
  hackedArrow: {
    fontSize: 24, lineHeight: 1, color: '#ff003c',
    filter: 'drop-shadow(0 0 8px rgba(255,0,60,0.9))',
  },
  hackedLabel: {
    position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)',
    padding: '7px 14px', borderRadius: 999, background: 'rgba(40,0,0,0.65)',
    color: '#ff003c', fontSize: 12, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap',
    textShadow: '0 0 8px rgba(255,0,60,0.9)',
  },
};
