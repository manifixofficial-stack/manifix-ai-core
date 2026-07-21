// ====================================================================
// 🧲 CaptureThrow.jsx - VACUUM HARPOON LOCK-ON INTERFACE
// v6: Gen-Z arcade reskin over the v5 engine.
//
// WHAT CHANGED FROM v5 (v5 → v6, no functional logic touched):
//   - All HUD chrome swapped from boxy bordered terminal panels to
//     floating translucent glass chips (arcadeBadgeChip), anchored to
//     the top of the screen so the AR camera view stays unobstructed —
//     matches the same chip language GameCanvas already uses for its
//     own telemetry row.
//   - Every status string replaced with arcade shorthand / slang.
//     "STANDBY // ALIGN RADAR RETICLE" → "RETICLE STANDBY // AIM ENGINE
//     ON", "✅ CONFIRMED: SECURED!" → "🔥 W, BIG CATCH SECURED!", etc.
//     No corporate/network-y terms left ("SERVER", "CONFIRMATION",
//     "TELEMETRY" all stripped or slang'd).
//   - Reticle now flashes MISS_RED while off-center (was gold) and
//     snaps to MATRIX_GREEN with a glow aura the instant the throw
//     window is centered — dashed circular crosshair kept as-is,
//     colors are the only change.
//   - Pressure bar reads "VORTEX PRESSURE" and flashes
//     "🔥 MAX REQ EXCEEDED // SEND IT!" at 100%, matching the tone of
//     the rest of the HUD instead of a flat percentage bar.
//   - Wobble/shake counter renamed from "CAPTURE SEQUENCE" to
//     "LOCKING IN" — still ties to the same WOBBLE_COUNT_BY_TIER logic.
//
// UNCHANGED: prop contract (targets / onAttempt / captureResolutions /
// disabled / screenW / screenH), all physics constants, the wobble/
// server-race finalize logic, curveball spin detection, auto-reset
// timers, haptics. Nothing here requires any change on the GameCanvas
// side — same drop-in integration as v5.
// ====================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MATRIX_GREEN = '#39ff88';
const GLITCH_GOLD = '#ffbe1a';
const LASER_PINK = '#ff3b94';
const MISS_RED = '#ff3f34';
const BG_BLACK = '#030305';
const INK = '#f5f0e8';

// ---- Physics constants (all in px/s, px/s², screen-space) ----
const GRAVITY_PX_S2 = 1400;
const AIR_RESISTANCE = 0.985;
const BOUNCE_COEFFICIENT = 0.45;
const MAX_BOUNCES = 2;
const FLOOR_Y_RATIO = 0.86;
const AUTO_RESET_MS = 4000;
const AUTO_RESET_OFFSCREEN_MARGIN = 250;
const VELOCITY_SAMPLE_WINDOW_MS = 120;
const SPIN_TO_CURVE_FACTOR = 3.2;
const BASE_BALL_DEPTH_SCALE = 1;

// How long to show a pending state before giving up on a matching
// captureResolutions entry and just resetting for the next throw
// anyway (defensive — a dropped socket message shouldn't soft-lock
// the whole capture UI).
const RESOLUTION_WAIT_TIMEOUT_MS = 3500;

// ---- Capture wobble (shake suspense) ----
// Each "wobble" is one full left-right-center swing. Count is driven by
// throw quality so a clean PERFECT throw resolves fast while a
// GLANCING hit makes the player sweat a little longer.
const WOBBLE_HALF_SWING_MS = 260;
const WOBBLE_ANGLE_DEG = 16;
const WOBBLE_COUNT_BY_TIER = { PERFECT: 1, GOOD: 2, GLANCING: 3 };

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

async function fireHaptics(style = 'medium') {
  try {
    const cap = typeof window !== 'undefined' ? window.Capacitor : null;
    if (cap?.isPluginAvailable?.('Haptics')) {
      const { Haptics, ImpactStyle } = await import(
        /* webpackIgnore: true */ '@capacitor/haptics'
      );
      const impactStyle =
        style === 'heavy' ? ImpactStyle.Heavy : style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
      return;
    }
  } catch {
    // Capacitor not installed in this build - fall through to web vibration.
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(style === 'heavy' ? 60 : style === 'light' ? 15 : 30);
  }
}

export default function CaptureThrow({
  targets = [],
  onAttempt,
  captureResolutions = [],
  disabled = false,
  screenW,
  screenH
}) {
  const viewportW = screenW || (typeof window !== 'undefined' ? window.innerWidth : 375);
  const viewportH = screenH || (typeof window !== 'undefined' ? window.innerHeight : 812);

  const [vacuumPower, setVacuumPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [lockStatus, setLockStatus] = useState('RETICLE STANDBY // AIM ENGINE ON');
  const [ringScale, setRingScale] = useState(1);
  const [isSwiped, setIsSwiped] = useState(false);
  const [ball, setBall] = useState(null); // { x, y, depthScale, curveTag }
  const [isSpinningFast, setIsSpinningFast] = useState(false);

  // --- Capture wobble UI state ---
  const [captureAnimPhase, setCaptureAnimPhase] = useState('idle'); // idle | capturing | bursting | breakout
  const [wobbleAngle, setWobbleAngle] = useState(0);
  const [wobbleShakesTotal, setWobbleShakesTotal] = useState(0);
  const [wobbleShakesDone, setWobbleShakesDone] = useState(0);

  const chargingIntervalRef = useRef(null);
  const touchStartYRef = useRef(0);
  const hudContainerRef = useRef(null);

  const velocitySamplesRef = useRef([]);
  const spinCenterRef = useRef({ x: 0, y: 0 });
  const spinLastAngleRef = useRef(null);
  const spinAccumRef = useRef(0);

  const flightStateRef = useRef(null);
  const flightRafRef = useRef(null);
  const resolvedRef = useRef(false); // guards against double-dispatch of onAttempt

  // Tracks the outstanding attempt we're waiting on a server verdict for,
  // so we can match it against new entries appearing in captureResolutions.
  const pendingAttemptRef = useRef(null); // { vegId, dispatchedAt } | null
  const seenResolutionIdsRef = useRef(new Set());
  const resolutionTimeoutRef = useRef(null);

  // Wobble/reveal coordination: whichever finishes last (animation or
  // server) triggers finalizeResult().
  const wobbleTimeoutRef = useRef(null);
  const wobbleDoneRef = useRef(true); // true = no wobble pending, safe to reveal immediately
  const pendingServerMatchRef = useRef(null); // holds a resolved match until wobble finishes

  // Keep the "already seen" resolution set from growing forever across a
  // long session - just seed it once with whatever's already in the log
  // on mount so we only react to NEW entries going forward.
  useEffect(() => {
    captureResolutions.forEach((r) => seenResolutionIdsRef.current.add(r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForNextThrow = useCallback(() => {
    setIsSwiped(false);
    setVacuumPower(0);
    setRingScale(1);
    setLockStatus('RETICLE STANDBY // AIM ENGINE ON');
    setBall(null);
    setCaptureAnimPhase('idle');
    setWobbleAngle(0);
    setWobbleShakesTotal(0);
    setWobbleShakesDone(0);
    pendingServerMatchRef.current = null;
    wobbleDoneRef.current = true;
  }, []);

  // Reveals the actual server verdict - only ever called once both the
  // wobble animation (if any) and the server response are in.
  const finalizeResult = useCallback((match) => {
    if (match.success) {
      setCaptureAnimPhase('bursting');
      setLockStatus(`🔥 W, BIG CATCH SECURED!${match.label ? ` — ${match.label}` : ''}`);
      fireHaptics('heavy');
    } else {
      setCaptureAnimPhase('breakout');
      setLockStatus(`💀 BROKE OUT! RIP SQUAD POINTS${match.label ? ` — ${match.label}` : ''}`);
      fireHaptics('light');
    }
    setTimeout(resetForNextThrow, 1100);
  }, [resetForNextThrow]);

  const maybeFinalize = useCallback(() => {
    if (wobbleDoneRef.current && pendingServerMatchRef.current) {
      const match = pendingServerMatchRef.current;
      pendingServerMatchRef.current = null;
      finalizeResult(match);
    }
  }, [finalizeResult]);

  const runWobbleSequence = useCallback((shakeCount) => {
    clearTimeout(wobbleTimeoutRef.current);
    wobbleDoneRef.current = false;
    setWobbleShakesTotal(shakeCount);
    setWobbleShakesDone(0);

    let halfStep = 0;
    const totalHalfSteps = shakeCount * 2; // each shake = swing one way, then back

    const tick = () => {
      if (halfStep >= totalHalfSteps) {
        setWobbleAngle(0);
        wobbleDoneRef.current = true;
        maybeFinalize();
        return;
      }
      setWobbleAngle(halfStep % 2 === 0 ? -WOBBLE_ANGLE_DEG : WOBBLE_ANGLE_DEG);
      fireHaptics('medium');
      if (halfStep % 2 === 1) {
        setWobbleShakesDone((prev) => prev + 1);
      }
      halfStep += 1;
      wobbleTimeoutRef.current = setTimeout(tick, WOBBLE_HALF_SWING_MS);
    };
    tick();
  }, [maybeFinalize]);

  // Watch for a new resolution matching our pending attempt.
  useEffect(() => {
    if (!pendingAttemptRef.current) return;
    const fresh = captureResolutions.filter((r) => !seenResolutionIdsRef.current.has(r.id));
    if (fresh.length === 0) return;

    fresh.forEach((r) => seenResolutionIdsRef.current.add(r.id));

    const match =
      fresh.find((r) => r.vegId === pendingAttemptRef.current.vegId) || fresh[fresh.length - 1];

    if (match) {
      clearTimeout(resolutionTimeoutRef.current);
      pendingAttemptRef.current = null;
      pendingServerMatchRef.current = match;
      maybeFinalize(); // reveals now if the wobble already finished, else waits for it
    }
  }, [captureResolutions, maybeFinalize]);

  // Inject keyframes + fonts once.
  useEffect(() => {
    if (!document.getElementById('ct-fonts-node')) {
      const link = document.createElement('link');
      link.id = 'ct-fonts-node';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=Rajdhani:wght@500;600;700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ct-style-node')) {
      const el = document.createElement('style');
      el.id = 'ct-style-node';
      el.textContent = `
        @keyframes ctSpinSparkle {
          0% { opacity: 0; transform: scale(0.6) rotate(0deg); }
          40% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.6) rotate(180deg); }
        }
        @keyframes ctChipPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes ctGlowBreathe {
          0%, 100% { box-shadow: 0 0 16px currentColor; }
          50% { box-shadow: 0 0 30px currentColor; }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  // Full reset if the component gets disabled mid-charge (e.g. camera drops).
  useEffect(() => {
    if (!disabled) return;
    clearInterval(chargingIntervalRef.current);
    cancelAnimationFrame(flightRafRef.current);
    clearTimeout(resolutionTimeoutRef.current);
    clearTimeout(wobbleTimeoutRef.current);
    setIsCharging(false);
    setVacuumPower(0);
    setBall(null);
    flightStateRef.current = null;
    pendingAttemptRef.current = null;
    pendingServerMatchRef.current = null;
    wobbleDoneRef.current = true;
  }, [disabled]);

  useEffect(() => {
    return () => {
      clearInterval(chargingIntervalRef.current);
      cancelAnimationFrame(flightRafRef.current);
      clearTimeout(resolutionTimeoutRef.current);
      clearTimeout(wobbleTimeoutRef.current);
    };
  }, []);

  // 🎯 Closing target ring loop - aiming-precision layer, independent of
  // GameCanvas's own lock-on brackets.
  useEffect(() => {
    if (isSwiped) return;
    const interval = setInterval(() => {
      setRingScale((prev) => (prev <= 0.25 ? 1.0 : prev - 0.015));
    }, 16);
    return () => clearInterval(interval);
  }, [isSwiped]);

  useEffect(() => {
    const node = hudContainerRef.current;
    if (!node) return;
    const blockScroll = (e) => {
      if (isCharging) e.preventDefault();
    };
    node.addEventListener('touchmove', blockScroll, { passive: false });
    return () => node.removeEventListener('touchmove', blockScroll);
  }, [isCharging]);

  const pointFromEvent = (e) => {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const pushVelocitySample = (x, y) => {
    const t = nowMs();
    const buf = velocitySamplesRef.current;
    buf.push({ x, y, t });
    const cutoff = t - VELOCITY_SAMPLE_WINDOW_MS;
    while (buf.length > 1 && buf[0].t < cutoff) buf.shift();
  };

  const computeReleaseVelocity = () => {
    const buf = velocitySamplesRef.current;
    if (buf.length < 2) return { vx: 0, vy: 0, speed: 0 };
    const first = buf[0];
    const last = buf[buf.length - 1];
    const dt = Math.max(1, last.t - first.t) / 1000;
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    return { vx, vy, speed: Math.hypot(vx, vy) };
  };

  const handleStartSuctionCharge = (e) => {
    if (disabled || isSwiped || ball) return;
    setIsCharging(true);
    setLockStatus('🌀 COMPRESSING ENERGY FIELD...');
    const p = pointFromEvent(e);
    touchStartYRef.current = p.y;

    velocitySamplesRef.current = [];
    pushVelocitySample(p.x, p.y);

    spinCenterRef.current = { x: p.x, y: p.y };
    spinLastAngleRef.current = null;
    spinAccumRef.current = 0;
    setIsSpinningFast(false);

    clearInterval(chargingIntervalRef.current);
    chargingIntervalRef.current = setInterval(() => {
      setVacuumPower((prev) => {
        if (prev >= 100) {
          setLockStatus('🔥 MAX REQ EXCEEDED // SEND IT!');
          clearInterval(chargingIntervalRef.current);
          return 100;
        }
        return prev + 2.5;
      });
    }, 25);
  };

  const trackSpin = (x, y) => {
    const c = spinCenterRef.current;
    const angle = Math.atan2(y - c.y, x - c.x);
    if (spinLastAngleRef.current != null) {
      let delta = angle - spinLastAngleRef.current;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      spinAccumRef.current += delta;
    }
    spinLastAngleRef.current = angle;
    setIsSpinningFast(Math.abs(spinAccumRef.current) > Math.PI * 1.2);
  };

  const handleTouchMove = (e) => {
    if (disabled || !isCharging || isSwiped) return;
    const p = pointFromEvent(e);
    pushVelocitySample(p.x, p.y);
    trackSpin(p.x, p.y);

    const deltaY = touchStartYRef.current - p.y;
    if (deltaY > 120) {
      handleExecuteHarpoonLaunch();
    }
  };

  // Direct hit test: ball center inside a target's screen hitbox circle.
  const findDirectHit = (x, y) => {
    for (const t of targets) {
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist <= t.radius) return t;
    }
    return null;
  };

  // Fallback when the flight ends without a direct hit: nearest target
  // to where the ball ended up, so a throw is never silently dropped
  // while at least one veggie is visible.
  const findNearestTarget = (x, y) => {
    if (targets.length === 0) return null;
    let best = null;
    let bestDist = Infinity;
    for (const t of targets) {
      const d = Math.hypot(x - t.x, y - t.y);
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    return best;
  };

  const dispatchAttempt = useCallback(
    (target, direct, ringScaleAtRelease, curveTag) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      cancelAnimationFrame(flightRafRef.current);

      if (!target || typeof onAttempt !== 'function') {
        // Nothing to aim at (or no handler wired) - just reset locally,
        // no server round-trip to wait on, no wobble to run.
        setLockStatus('NO TARGET IN RANGE // RETICLE RESET');
        setTimeout(resetForNextThrow, 900);
        setBall(null);
        flightStateRef.current = null;
        return;
      }

      let tier = 'MISS';
      if (direct) {
        if (ringScaleAtRelease >= 0.35 && ringScaleAtRelease <= 0.55) tier = 'PERFECT';
        else if (ringScaleAtRelease > 0.55 && ringScaleAtRelease <= 0.8) tier = 'GOOD';
        else tier = 'GLANCING';
      }

      fireHaptics(direct ? 'medium' : 'light');

      pendingAttemptRef.current = { vegId: target.id, dispatchedAt: nowMs() };
      clearTimeout(resolutionTimeoutRef.current);
      resolutionTimeoutRef.current = setTimeout(() => {
        if (pendingAttemptRef.current?.vegId === target.id) {
          pendingAttemptRef.current = null;
          clearTimeout(wobbleTimeoutRef.current);
          wobbleDoneRef.current = true;
          setLockStatus('🔺 LOG LINK DROPPED // SHIFT RETICLE');
          setTimeout(resetForNextThrow, 800);
        }
      }, RESOLUTION_WAIT_TIMEOUT_MS);

      onAttempt(target.id, {
        tier,
        direct,
        ringScaleAtRelease,
        curveball: !!curveTag,
        vacuumPower
      });

      if (direct) {
        // Freeze the ball on the target and run the shake suspense —
        // fewer shakes for a cleaner throw.
        setBall({ x: target.x, y: target.y, depthScale: 1, curveTag });
        setCaptureAnimPhase('capturing');
        setLockStatus(`🎯 ${tier} HIT // HOLDING THE LOCK...`);
        runWobbleSequence(WOBBLE_COUNT_BY_TIER[tier] || 2);
      } else {
        // No freeze-frame for an indirect/whiffed throw.
        setLockStatus('⚡ BEAM DEPLOYED! SNATCHING...');
        setBall(null);
      }

      flightStateRef.current = null;
    },
    [onAttempt, vacuumPower, resetForNextThrow, runWobbleSequence]
  );

  const runFlightLoop = (ringScaleAtRelease) => {
    const step = () => {
      const s = flightStateRef.current;
      if (!s || resolvedRef.current) return;

      const t = nowMs();
      const dt = Math.min(0.032, Math.max(0.001, (t - s.lastT) / 1000));
      s.lastT = t;

      s.vy += GRAVITY_PX_S2 * dt;
      s.vx *= AIR_RESISTANCE;
      s.vy *= AIR_RESISTANCE;
      s.vx += s.curveAccelPxS2 * dt;

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const travelRatio = Math.min(1, (t - s.launchedAt) / 900);
      s.depthScale = BASE_BALL_DEPTH_SCALE * (1 - 0.35 * travelRatio) + 0.25 * Math.max(0, s.y / viewportH);

      const floorY = viewportH * FLOOR_Y_RATIO;
      if (s.y >= floorY && s.vy > 0) {
        s.y = floorY;
        s.vy *= -BOUNCE_COEFFICIENT;
        s.vx *= 0.7;
        s.bounces += 1;
      }

      const hit = findDirectHit(s.x, s.y);
      if (hit) {
        dispatchAttempt(hit, true, ringScaleAtRelease, s.curveTag);
        return;
      }

      const offscreen =
        s.x < -AUTO_RESET_OFFSCREEN_MARGIN ||
        s.x > viewportW + AUTO_RESET_OFFSCREEN_MARGIN ||
        s.y > viewportH + AUTO_RESET_OFFSCREEN_MARGIN;
      const stale = t - s.launchedAt > AUTO_RESET_MS;
      const outOfBounces = s.bounces > MAX_BOUNCES && Math.abs(s.vy) < 40;

      if (offscreen || stale || outOfBounces) {
        const nearest = findNearestTarget(s.x, s.y);
        dispatchAttempt(nearest, false, ringScaleAtRelease, s.curveTag);
        return;
      }

      setBall({ x: s.x, y: s.y, depthScale: s.depthScale, curveTag: s.curveTag });
      flightRafRef.current = requestAnimationFrame(step);
    };
    flightRafRef.current = requestAnimationFrame(step);
  };

  const handleExecuteHarpoonLaunch = useCallback(() => {
    clearInterval(chargingIntervalRef.current);
    setIsCharging(false);
    setIsSwiped(true);
    resolvedRef.current = false;

    const { vx, vy } = computeReleaseVelocity();

    const curveTag = isSpinningFast;
    const curveAccelPxS2 = curveTag ? Math.sign(spinAccumRef.current || 1) * SPIN_TO_CURVE_FACTOR * 60 : 0;

    const startPoint = velocitySamplesRef.current[velocitySamplesRef.current.length - 1] || {
      x: viewportW / 2,
      y: touchStartYRef.current
    };

    flightStateRef.current = {
      x: startPoint.x,
      y: startPoint.y,
      vx,
      vy: -Math.abs(vy) - 200,
      lastT: nowMs(),
      launchedAt: nowMs(),
      bounces: 0,
      depthScale: BASE_BALL_DEPTH_SCALE,
      curveTag,
      curveAccelPxS2
    };

    setBall({ x: startPoint.x, y: startPoint.y, depthScale: BASE_BALL_DEPTH_SCALE, curveTag });
    setLockStatus(curveTag ? '🌀 CURVE LOADED — LET IT RIP!' : '⚡ VORTEX BEAM DEPLOYED! SNATCHING...');

    runFlightLoop(ringScale);
  }, [ringScale, isSpinningFast, viewportW]);

  const handleReleaseAborted = () => {
    if (disabled) return;
    clearInterval(chargingIntervalRef.current);
    if (!isSwiped) {
      setIsCharging(false);
      setVacuumPower(0);
      setLockStatus('PRESSURE LOST // RESET THE VIBE');
    }
  };

  const ringInBand = ringScale <= 0.55 && ringScale >= 0.35;
  const statusColor =
    lockStatus.includes('💀') || lockStatus.includes('🔺') || lockStatus.includes('LOST')
      ? MISS_RED
      : lockStatus.includes('🔥 W')
      ? MATRIX_GREEN
      : GLITCH_GOLD;

  return (
    <div
      ref={hudContainerRef}
      style={{ ...styles.hudContainer, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.5 : 1 }}
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
      onTouchEnd={handleReleaseAborted}
      onMouseUp={handleReleaseAborted}
      onMouseLeave={handleReleaseAborted}
    >
      {/* FLOATING GLASS CHIP HUD — anchored top, out of the camera's way */}
      <div style={styles.floatingHudContainer}>
        <div style={styles.arcadeBadgeChip}>
          <span style={styles.hudLabelMini}>LOCK FEED STATUS</span>
          <span
            style={{
              ...styles.hudMetaValue,
              color: statusColor,
              textShadow: captureAnimPhase === 'bursting' ? `0 0 10px ${MATRIX_GREEN}` : 'none'
            }}
          >
            {lockStatus}
          </span>
        </div>

        {isCharging && (
          <motion.div
            style={styles.arcadeBadgeChip}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={styles.hudLabelMini}>VORTEX PRESSURE</span>
            <div style={styles.powerTrackContainer}>
              <motion.div
                style={{
                  ...styles.powerFillVolume,
                  width: `${vacuumPower}%`,
                  background:
                    vacuumPower >= 100
                      ? `linear-gradient(90deg, ${MISS_RED}, ${GLITCH_GOLD})`
                      : `linear-gradient(90deg, ${LASER_PINK}, ${GLITCH_GOLD})`
                }}
                animate={vacuumPower >= 100 ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            </div>
            <span style={{ ...styles.hudMetaValue, color: vacuumPower >= 100 ? MISS_RED : GLITCH_GOLD, marginTop: 2 }}>
              {Math.round(vacuumPower)}% {vacuumPower >= 100 ? '🔥 MAX REQ EXCEEDED // SEND IT!' : '🔋 BEAM CHARGING'}
            </span>
          </motion.div>
        )}

        {captureAnimPhase === 'capturing' && (
          <motion.div
            style={styles.arcadeBadgeChip}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={styles.hudLabelMini}>LOCKING IN</span>
            <span style={{ ...styles.hudMetaValue, color: GLITCH_GOLD }}>
              SHAKE {wobbleShakesDone}/{wobbleShakesTotal} 🔒✨
            </span>
          </motion.div>
        )}
      </div>

      {/* DASHED TRACKING CROSSHAIR — red while off-lock, green + glow aura on-lock */}
      <AnimatePresence>
        {!isSwiped && (
          <motion.div
            key="reticle"
            style={styles.reticleOuterBounds}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.25 }}
          >
            <div style={styles.staticTargetOuterRing} />
            <motion.div
              style={{
                ...styles.shrinkingCaptureCircle,
                transform: `scale(${ringScale})`,
                borderColor: ringInBand ? MATRIX_GREEN : MISS_RED,
                boxShadow: ringInBand
                  ? `0 0 10px ${MATRIX_GREEN}, 0 0 26px ${MATRIX_GREEN}`
                  : `0 0 14px ${MISS_RED}`
              }}
              animate={ringInBand ? { opacity: 1 } : { opacity: [1, 0.55, 1] }}
              transition={{ duration: 0.5, repeat: ringInBand ? 0 : Infinity }}
            />
            {isSpinningFast && <div style={styles.spinSparkle} />}
          </motion.div>
        )}
      </AnimatePresence>

      {ball && (
        <motion.div
          style={{
            ...styles.flightBall,
            left: ball.x,
            top: ball.y,
            boxShadow:
              captureAnimPhase === 'bursting'
                ? `0 0 30px ${MATRIX_GREEN}`
                : captureAnimPhase === 'breakout'
                ? `0 0 24px ${MISS_RED}`
                : ball.curveTag
                ? `0 0 18px ${LASER_PINK}`
                : `0 0 12px ${MATRIX_GREEN}`,
            borderColor:
              captureAnimPhase === 'bursting'
                ? MATRIX_GREEN
                : captureAnimPhase === 'breakout'
                ? MISS_RED
                : ball.curveTag
                ? LASER_PINK
                : MATRIX_GREEN
          }}
          animate={{
            x: '-50%',
            y: '-50%',
            rotate: captureAnimPhase === 'capturing' ? wobbleAngle : 0,
            scale: captureAnimPhase === 'bursting' ? 1.6 : captureAnimPhase === 'breakout' ? 0.7 : ball.depthScale
          }}
          transition={{ type: 'tween', duration: captureAnimPhase === 'capturing' ? WOBBLE_HALF_SWING_MS / 1000 : 0.2 }}
        />
      )}

      {/* LOWER TACTILE CONTROL — one big glass suction trigger, no boxy dashed frame */}
      <div style={styles.lowerControlDeck}>
        <div style={styles.arcadeConsolePad}>
          <div
            style={{
              ...styles.massiveSuctionTriggerBtn,
              background: isCharging
                ? `linear-gradient(135deg, ${MATRIX_GREEN}, #1ba673)`
                : `linear-gradient(135deg, ${GLITCH_GOLD}, #caa24a)`,
              boxShadow: isCharging ? `0 0 25px ${MATRIX_GREEN}` : '0 6px 20px rgba(0,0,0,0.5)',
              cursor: disabled || isSwiped ? 'not-allowed' : 'pointer',
              opacity: disabled || isSwiped ? 0.55 : 1
            }}
            onTouchStart={handleStartSuctionCharge}
            onMouseDown={handleStartSuctionCharge}
          >
            {disabled
              ? '📵 CAMERA NOT READY'
              : isSwiped
              ? captureAnimPhase === 'bursting'
                ? '👑 🎉 SECURED'
                : captureAnimPhase === 'breakout'
                ? '💨 💀 BROKE OUT'
                : 'RESOLVING...'
              : isCharging
              ? isSpinningFast
                ? '🌀 CURVE LOADED — SWIPE UP TO SEND IT ⬆️'
                : '⬆️ SWIPE UP TO LAUNCH ⬆️'
              : '⚡ HOLD TO ENGAGE VACUUM ⚡'}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- FLOATING GLASS-CHIP STYLE DICTIONARY ---
const styles = {
  hudContainer: {
    position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none',
    background: 'transparent', touchAction: 'none'
  },
  floatingHudContainer: {
    width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
    pointerEvents: 'none', zIndex: 140
  },
  arcadeBadgeChip: {
    alignSelf: 'flex-start', background: 'rgba(6, 8, 14, 0.78)', backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 16px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', minWidth: '200px', maxWidth: '86vw'
  },
  hudLabelMini: {
    fontSize: '9px', fontWeight: 'bold', fontFamily: "'Orbitron', sans-serif",
    color: '#8a92a8', letterSpacing: '1.5px'
  },
  hudMetaValue: {
    fontSize: '13px', fontWeight: '900', fontFamily: "'Orbitron', sans-serif",
    color: INK, letterSpacing: '0.4px'
  },
  powerTrackContainer: {
    position: 'relative', width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)',
    borderRadius: '999px', overflow: 'hidden', marginTop: '2px'
  },
  powerFillVolume: {
    position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '999px'
  },
  reticleOuterBounds: {
    position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none'
  },
  staticTargetOuterRing: {
    position: 'absolute', width: '130px', height: '130px', border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '50%'
  },
  shrinkingCaptureCircle: {
    position: 'absolute', width: '130px', height: '130px', border: '3px dashed', borderRadius: '50%',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  },
  spinSparkle: {
    position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
    border: `2px dashed ${LASER_PINK}`, animation: 'ctSpinSparkle 0.6s ease-out infinite', pointerEvents: 'none'
  },
  flightBall: {
    position: 'fixed', width: '26px', height: '26px', borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #ffffff, #39ff88 60%, #0a3d22 100%)',
    border: '2px solid', zIndex: 165, pointerEvents: 'none'
  },
  lowerControlDeck: {
    width: '100%', padding: '24px 16px', display: 'flex', justifyContent: 'center', zIndex: 170
  },
  arcadeConsolePad: {
    width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  massiveSuctionTriggerBtn: {
    width: '100%', height: '58px', border: 'none', borderRadius: '20px', color: '#040508',
    fontWeight: '900', fontSize: '14px', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px',
    textTransform: 'uppercase', transition: 'all 0.12s ease', userSelect: 'none', touchAction: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 12px'
  }
};

// ----------------------------------------------------------------------
// Prop contract unchanged — still matches your GameCanvas.jsx integration
// exactly (targets / onAttempt / captureResolutions / disabled / screenW
// / screenH). No changes needed on the GameCanvas side to pick this up.
// ----------------------------------------------------------------------
