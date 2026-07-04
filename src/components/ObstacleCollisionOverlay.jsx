import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_FLASH_MS = 900; // the first "you just walked into something" beat
const EXIT_HYSTERESIS = 1.15; // must clear radius by a bit before the trap releases, so it doesn't flicker right at the edge
const RETRIGGER_COOLDOWN_MS = 8000; // don't spam the same zone repeatedly once you've fully left it
const SWEEP_PERIOD_MS = 2200; // one full radar rotation
const BATTERY_DRAIN_MULTIPLIER = 3; // tripled drain while trapped, per spec

function metersBetween(a, b) {
  if (!a || !b) return Infinity;
  const dLat = (b.lat - a.lat) * 111320;
  const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

// Depth fraction: 0 = just crossed the boundary, 1 = standing on top of
// the obstacle's center. Drives both the crack severity and how tight
// the "AGGRO EYE" pop feels.
function depthFractionFor(dist, radius) {
  if (!Number.isFinite(dist) || !radius) return 0;
  return Math.max(0, Math.min(1, 1 - dist / radius));
}

// Generates a fresh randomized set of crack-line segments across a 0-100
// viewBox — regenerated any time the player pushes deeper into a zone so
// the shatter pattern doesn't look like a static decal.
function generateCrackLines(level) {
  if (level <= 0) return [];
  const count = level === 1 ? 5 : 9;
  const cx = 50 + (Math.random() - 0.5) * 20;
  const cy = 50 + (Math.random() - 0.5) * 20;
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const len = 30 + Math.random() * 55;
    return {
      x1: cx,
      y1: cy,
      x2: cx + Math.cos(angle) * len,
      y2: cy + Math.sin(angle) * len,
      jitter: Math.random() * 2,
    };
  });
}

/**
 * Hazard-zone lockout overlay: this game has people walking around
 * outdoors staring at their phone, so when the player's real position
 * enters a known obstacle zone (tree, wall, hydrant, curb, "Bob the
 * dog's" yard, a traffic-adjacent curb, etc.) this freezes gameplay input
 * and throws up escalating warning visuals — mirroring the kind of
 * urgent "look up now" interrupt real location-based games use, dressed
 * up in the game's "AGGRO TRAP" flavor.
 *
 * Fully self-contained: watches playerPos against `obstacles` itself.
 * Reports state up via three optional callbacks so the rest of the app
 * can react without this component needing to know about joysticks or
 * battery code directly:
 *   - onLockChange(bool): true for the entire time input should be
 *     frozen (from initial trigger until the player backs out of the
 *     zone). This component has no reference to the joystick, so the
 *     parent/joystick component is responsible for actually zeroing its
 *     tracked coordinates to (0,0) while locked is true — same pattern
 *     as CaptureThrow's `disabled` prop, and likewise responsible for
 *     rendering its own "burning red" control skin off that same flag.
 *   - onBatteryDrainMultiplier(n): called with 3 the moment the trap
 *     engages, and with 1 the moment it releases, so the battery module
 *     can triple its simulated drain rate for exactly the trapped
 *     duration and no longer.
 *   - onEscape(): fired once, the moment the player successfully backs
 *     out of the zone under their own power (as opposed to the lock
 *     merely timing out) — parents that want to reward/acknowledge a
 *     clean escape can hook this without re-deriving it from lock state.
 */
export default function ObstacleCollisionOverlay({
  playerPos,
  obstacles = [],
  onLockChange,
  onBatteryDrainMultiplier,
  onEscape,
}) {
  const [active, setActive] = useState(false);
  const [obstacleLabel, setObstacleLabel] = useState(null);
  const [depthFraction, setDepthFraction] = useState(0);
  const [crackLevel, setCrackLevel] = useState(0);
  const [crackLines, setCrackLines] = useState([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [eyesSnapped, setEyesSnapped] = useState(false);

  const cooldownRef = useRef(new Map()); // obstacleId -> timestamp it's clear to retrigger
  const activeObstacleRef = useRef(null);
  const obstaclesRef = useRef(obstacles);
  const flashTimerRef = useRef(null);
  const sweepRafRef = useRef(null);
  const prevSweepAngleRef = useRef(0);
  const eyeResetTimerRef = useRef(null);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Entry check: only looks for a *new* trap while nothing is currently
  // active. Once triggered, the continuous-tracking effect below takes
  // over for as long as the player stays inside the zone.
  useEffect(() => {
    if (!playerPos || active) return;
    const now = Date.now();
    for (const obstacle of obstaclesRef.current) {
      const readyAt = cooldownRef.current.get(obstacle.id) || 0;
      if (now < readyAt) continue;
      const dist = metersBetween(playerPos, obstacle);
      if (dist <= obstacle.radiusMeters) {
        activeObstacleRef.current = obstacle;
        setObstacleLabel(obstacle.label || 'an obstacle');
        setDepthFraction(depthFractionFor(dist, obstacle.radiusMeters));
        setCrackLevel(0);
        setCrackLines([]);
        setActive(true);
        onLockChange?.(true);
        onBatteryDrainMultiplier?.(BATTERY_DRAIN_MULTIPLIER);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          // Just clears the "AGGRO TRAP!" splash card — lock/visuals stay
          // up via `active` until the continuous-tracking effect below
          // confirms the player has actually left the zone.
        }, INITIAL_FLASH_MS);
        break;
      }
    }
  }, [playerPos, active, onLockChange, onBatteryDrainMultiplier]);

  // Continuous tracking while trapped: re-measures distance to the
  // specific obstacle that triggered the lock on every position update.
  // Getting closer escalates the glass-crack severity; crossing back
  // outside the radius (with a little hysteresis) releases the trap
  // immediately — "run backward out of the boundary" ends it on the
  // spot rather than waiting out a fixed timer.
  useEffect(() => {
    if (!active || !playerPos) return;
    const obstacle = activeObstacleRef.current;
    if (!obstacle) return;

    const dist = metersBetween(playerPos, obstacle);
    const exitRadius = obstacle.radiusMeters * EXIT_HYSTERESIS;

    if (dist > exitRadius) {
      cooldownRef.current.set(obstacle.id, Date.now() + RETRIGGER_COOLDOWN_MS);
      activeObstacleRef.current = null;
      setActive(false);
      setCrackLevel(0);
      setCrackLines([]);
      setEyesSnapped(false);
      onLockChange?.(false);
      onBatteryDrainMultiplier?.(1);
      onEscape?.();
      return;
    }

    const fraction = depthFractionFor(dist, obstacle.radiusMeters);
    setDepthFraction(fraction);
    setCrackLevel((prevLevel) => {
      const nextLevel = fraction > 0.7 ? 2 : fraction > 0.35 ? 1 : 0;
      if (nextLevel > prevLevel) setCrackLines(generateCrackLines(nextLevel));
      if (nextLevel === 0) setCrackLines([]);
      return nextLevel;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPos, active]);

  // Radar sweep + eye-snap loop: runs purely off time while trapped,
  // independent of GPS update cadence, so the "Bob is watching" sweep
  // reads as smooth and alive rather than jumping whenever a new
  // position sample comes in.
  useEffect(() => {
    if (!active) {
      sweepRafRef.current = null;
      return undefined;
    }
    let start = null;
    const step = (ts) => {
      if (start == null) start = ts;
      const progress = ((ts - start) % SWEEP_PERIOD_MS) / SWEEP_PERIOD_MS;
      const angle = progress * 360;

      // Detect the sweep crossing "12 o'clock" (pointing straight at the
      // player) — that's the beat where the eyes should snap open.
      if (prevSweepAngleRef.current > 300 && angle < 60) {
        setEyesSnapped(true);
        clearTimeout(eyeResetTimerRef.current);
        eyeResetTimerRef.current = setTimeout(() => setEyesSnapped(false), 450);
      }
      prevSweepAngleRef.current = angle;
      setSweepAngle(angle);
      sweepRafRef.current = requestAnimationFrame(step);
    };
    sweepRafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(sweepRafRef.current);
  }, [active]);

  useEffect(() => () => {
    clearTimeout(flashTimerRef.current);
    clearTimeout(eyeResetTimerRef.current);
  }, []);

  const showInitialCard = useMemo(() => active, [active]);

  if (!active) return null;

  return (
    <div style={styles.overlay}>
      {/* Initial trigger flash — quick white pop, same beat as before */}
      <div style={styles.flash} key={obstacleLabel} />

      {/* Aggro Eye radar sweep — sweeps the 4:3 field continuously while
          trapped; a big glowing dog-eye pair snaps open every time the
          beam crosses the player's position. */}
      <div style={styles.radarField}>
        <motion.div
          style={{ ...styles.sweepBeam, transform: `rotate(${sweepAngle}deg)` }}
        />
        <AnimatePresence>
          {eyesSnapped && (
            <motion.div
              key="eyes"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={styles.eyesWrap}
            >
              <span style={styles.eye}>👁️</span>
              <span style={styles.eye}>👁️</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glass-crack overlay — escalates from a handful of lines to a
          dense shatter as the player pushes deeper into the zone instead
          of backing out. */}
      {crackLevel > 0 && (
        <motion.svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={styles.crackSvg}
          animate={{ x: [0, -1, 1, -1, 0], y: [0, 1, -1, 1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
        >
          {crackLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={crackLevel === 2 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)'}
              strokeWidth={crackLevel === 2 ? 0.8 : 0.5}
            />
          ))}
        </motion.svg>
      )}

      {showInitialCard && (
        <div style={styles.card}>
          <div style={styles.icon}>🐕‍🦺</div>
          <div style={styles.title}>AGGRO TRAP!</div>
          <div style={styles.subtitle}>
            You're near {obstacleLabel} — this is a real-world hazard. Look up and step back to break free.
          </div>
          <div style={styles.depthBarTrack}>
            <div style={{ ...styles.depthBarFill, width: `${depthFraction * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center',
    justifyContent: 'center', pointerEvents: 'all', overflow: 'hidden',
  },
  flash: {
    position: 'absolute', inset: 0, background: 'rgba(255,60,60,0.55)',
    animation: 'obstacleFlashFade 900ms ease-out forwards',
  },
  radarField: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  sweepBeam: {
    position: 'absolute', width: '140%', height: '140%',
    background: 'conic-gradient(from 0deg, rgba(255,0,60,0.55), rgba(255,0,60,0) 35%)',
    borderRadius: '50%', mixBlendMode: 'screen',
  },
  eyesWrap: {
    position: 'absolute', display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center',
    filter: 'drop-shadow(0 0 14px rgba(255,0,60,0.9))',
  },
  eye: { fontSize: 42 },
  crackSvg: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 3, textAlign: 'center', padding: '20px 28px', borderRadius: 18,
    background: 'rgba(31,6,6,0.9)', border: '1px solid rgba(255,60,60,0.5)', color: '#fff',
    maxWidth: 280, boxShadow: '0 0 30px rgba(255,0,60,0.35)',
  },
  icon: { fontSize: 30, marginBottom: 6 },
  title: {
    fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: 1, color: '#ff3c3c',
    textShadow: '0 0 12px rgba(255,60,60,0.8)',
  },
  subtitle: { fontSize: 13, opacity: 0.9, lineHeight: 1.4, marginBottom: 10 },
  depthBarTrack: {
    width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  depthBarFill: {
    height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #ff3c3c, #ff9c3c)',
    transition: 'width 200ms ease-out',
  },
};

// Inject the flash keyframes once (styles object above can't hold @keyframes).
if (typeof document !== 'undefined' && !document.getElementById('obstacle-flash-keyframes')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'obstacle-flash-keyframes';
  styleTag.textContent = `
    @keyframes obstacleFlashFade {
      0% { opacity: 0.9; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleTag);
}
