// ====================================================================
// 🧲 CaptureThrow.jsx - CYBERPUNK VACUUM HARPOON LOCK-ON INTERFACE
// v4: rewritten to match GameCanvas.jsx's real prop contract.
//
// UNCHANGED IN THIS PATCH — see GameCanvas.jsx's file-header patch note
// F for the actual fix. This file's own optimistic-miss handling was
// already correct: it shows "AWAITING SERVER CONFIRMATION", waits for a
// captureResolutions entry, and resets the reticle the same way whether
// that entry says success or not. The bug lived entirely in how
// GameCanvas interpreted "an attempt was dispatched" as "start the
// vacuum/catch animation" — this component never claimed a hit itself.
//
// WHAT CHANGED FROM v3:
//   - Props are now { targets, onAttempt, captureResolutions, disabled,
//     screenW, screenH } - matching exactly what GameCanvas.jsx passes.
//     `veggieId` / `currentRound` / `onCaptureDispatched` /
//     `onCameraShake` are gone; this component no longer knows or
//     cares which round it's in or what an attempt is worth in points.
//   - SERVER IS AUTHORITATIVE ON HIT/MISS. GameCanvas.jsx already has
//     a full capture-attempt -> capture-result socket round-trip. This
//     component's job is just: figure out which visible target the
//     throw was aimed at, read a quality/precision signal off the
//     gesture, and call onAttempt(targetId, quality) once per throw.
//     It does NOT declare "SECURED!" or compute score itself anymore -
//     it watches the `captureResolutions` prop (fed by GameCanvas's
//     own socket listener) and reflects whatever the server decided.
//   - GameCanvas.jsx already renders its own scanner-bracket reticle
//     (locked/vacuuming/distance labels) for every target in `targets`.
//     This component's ring/timing UI is a SEPARATE aiming-precision
//     layer (how well-timed was your swipe), not a duplicate of that
//     bracket UI - the two are meant to sit on screen together.
//   - Bounds/floor math now uses the `screenW`/`screenH` props (so it
//     always agrees with GameCanvas's own windowDims-driven layout)
//     instead of reading window.innerWidth/innerHeight independently.
//
// ASSUMPTION (stated, not guessed silently): since a throw isn't
// necessarily aimed at one pre-selected veggie anymore (multiple
// targets can be visible at once), a throw resolves against:
//   1) whichever target the ball's flight path actually intersects
//      (direct physics hit), else
//   2) the target nearest to the ball's final position, IF one exists,
//      so a throw is never silently dropped when at least one veggie
//      is on screen.
// If `targets` is empty when the swipe fires, no attempt is dispatched
// (there's nothing to aim at) - the ball still flies for visual
// feedback, then quietly resets.
//
// SCOPE NOTE (unchanged from v3): this is a screen-space pseudo-3D
// simulation - a fixed HTML overlay, not a mesh inside the R3F canvas.
// Real gravity/drag/bounce/spin numbers drive it; true Three.js
// raycasting would require moving this into a component rendered
// inside <Canvas>. See the integration note at the bottom of the file.
// ====================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MATRIX_GREEN = '#39ff88';
const GLITCH_GOLD = '#ffbe1a';
const LASER_PINK = '#ff3b94';
const MISS_RED = '#ff3f34';
const BG_BLACK = '#030305';

// ---- Physics constants (all in px/s, px/s², screen-space) ----
const GRAVITY_PX_S2 = 1400;
const AIR_RESISTANCE = 0.985;
const BOUNCE_COEFFICIENT = 0.45;
const MAX_BOUNCES = 2;
const FLOOR_Y_RATIO = 0.86;
const AUTO_RESET_MS = 4000;
const AUTO_RESET_OFFSCREEN_MARGIN = 250;
const VELOCITY_SAMPLE_WINDOW_MS = 120;
const MIN_LAUNCH_SPEED = 250;
const SPIN_TO_CURVE_FACTOR = 3.2;
const BASE_BALL_DEPTH_SCALE = 1;

// How long to show "AWAITING SERVER CONFIRMATION" before giving up on
// a matching captureResolutions entry and just resetting for the next
// throw anyway (defensive - a dropped socket message shouldn't soft-lock
// the whole capture UI).
const RESOLUTION_WAIT_TIMEOUT_MS = 3500;

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
  const [lockStatus, setLockStatus] = useState('STANDBY // ALIGN RADAR RETICLE');
  const [ringScale, setRingScale] = useState(1);
  const [isSwiped, setIsSwiped] = useState(false);
  const [ball, setBall] = useState(null); // { x, y, depthScale, curveTag }
  const [isSpinningFast, setIsSpinningFast] = useState(false);

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

  // Keep the "already seen" resolution set from growing forever across a
  // long session - just seed it once with whatever's already in the log
  // on mount so we only react to NEW entries going forward.
  useEffect(() => {
    captureResolutions.forEach((r) => seenResolutionIdsRef.current.add(r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (match.success) {
        setLockStatus(`✅ CONFIRMED: ${match.label || 'SECURED!'}`);
        fireHaptics('heavy');
      } else {
        setLockStatus(`❌ SERVER: ${match.label || 'MISSED'}`);
      }
      // Give the player a moment to read the outcome, then re-arm.
      setTimeout(() => {
        setIsSwiped(false);
        setVacuumPower(0);
        setRingScale(1);
        setLockStatus('STANDBY // ALIGN RADAR RETICLE');
      }, 1100);
    }
  }, [captureResolutions]);

  // Inject keyframes + fonts once.
  useEffect(() => {
    if (!document.getElementById('ct-fonts-node')) {
      const link = document.createElement('link');
      link.id = 'ct-fonts-node';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;900&family=JetBrains+Mono:wght@500&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ct-style-node')) {
      const el = document.createElement('style');
      el.id = 'ct-style-node';
      el.textContent = `
        @keyframes laserScan {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0.2; }
        }
        @keyframes spinSparkle {
          0% { opacity: 0; transform: scale(0.6) rotate(0deg); }
          40% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.6) rotate(180deg); }
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
    setIsCharging(false);
    setVacuumPower(0);
    setBall(null);
    flightStateRef.current = null;
    pendingAttemptRef.current = null;
  }, [disabled]);

  useEffect(() => {
    return () => {
      clearInterval(chargingIntervalRef.current);
      cancelAnimationFrame(flightRafRef.current);
      clearTimeout(resolutionTimeoutRef.current);
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
    setLockStatus('ENERGY CORE INJECTING... HOLD BACKPACK TRIGGER');
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
          setLockStatus('⚠️ MAXIMUM PRESSURE EXCEEDED // RELEASE IMMEDIATELY');
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
  // while at least one veggie is visible (see file-header ASSUMPTION).
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
        // no server round-trip to wait on.
        setLockStatus('NO TARGET IN RANGE // RETICLE RESET');
        setTimeout(() => {
          setIsSwiped(false);
          setVacuumPower(0);
          setRingScale(1);
          setLockStatus('STANDBY // ALIGN RADAR RETICLE');
        }, 900);
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

      setLockStatus('LAUNCH DISPATCHED // AWAITING SERVER CONFIRMATION');
      fireHaptics(direct ? 'medium' : 'light');

      pendingAttemptRef.current = { vegId: target.id, dispatchedAt: nowMs() };
      clearTimeout(resolutionTimeoutRef.current);
      resolutionTimeoutRef.current = setTimeout(() => {
        if (pendingAttemptRef.current?.vegId === target.id) {
          pendingAttemptRef.current = null;
          setLockStatus('⏱️ NO SERVER RESPONSE // RETICLE RESET');
          setTimeout(() => {
            setIsSwiped(false);
            setVacuumPower(0);
            setRingScale(1);
            setLockStatus('STANDBY // ALIGN RADAR RETICLE');
          }, 800);
        }
      }, RESOLUTION_WAIT_TIMEOUT_MS);

      onAttempt(target.id, {
        tier,
        direct,
        ringScaleAtRelease,
        curveball: !!curveTag,
        vacuumPower
      });

      setBall(null);
      flightStateRef.current = null;
    },
    [onAttempt, vacuumPower]
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
        setBall({ x: s.x, y: s.y, depthScale: s.depthScale, curveTag: s.curveTag });
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

    const { vx, vy, speed } = computeReleaseVelocity();
    const launchSpeed = Math.max(speed, MIN_LAUNCH_SPEED * 0.4);

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
      curveAccelPxS2,
      launchSpeed
    };

    setBall({ x: startPoint.x, y: startPoint.y, depthScale: BASE_BALL_DEPTH_SCALE, curveTag });
    setLockStatus(curveTag ? '🌀 CURVEBALL LAUNCHED!' : 'PROJECTILE LAUNCHED // TRACKING...');

    runFlightLoop(ringScale);
  }, [ringScale, isSpinningFast, viewportW]);

  const handleReleaseAborted = () => {
    if (disabled) return;
    clearInterval(chargingIntervalRef.current);
    if (!isSwiped) {
      setIsCharging(false);
      setVacuumPower(0);
      setLockStatus('PRESSURE LOST // RETICLE HANDSHAKE ABORTED');
    }
  };

  const ringInBand = ringScale <= 0.55 && ringScale >= 0.35;
  const statusColor = lockStatus.includes('❌') || lockStatus.includes('⚠️') || lockStatus.includes('⏱️')
    ? MISS_RED
    : lockStatus.includes('✅')
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
      <div style={styles.laserScanline} />
      <div style={styles.cyberHudFrame} />

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
                borderColor: ringInBand ? MATRIX_GREEN : GLITCH_GOLD,
                boxShadow: `0 0 20px ${ringInBand ? MATRIX_GREEN : GLITCH_GOLD}`
              }}
            />
            {isSpinningFast && <div style={styles.spinSparkle} />}
          </motion.div>
        )}
      </AnimatePresence>

      {ball && (
        <div
          style={{
            ...styles.flightBall,
            left: ball.x,
            top: ball.y,
            transform: `translate(-50%, -50%) scale(${ball.depthScale})`,
            boxShadow: ball.curveTag ? `0 0 18px ${LASER_PINK}` : `0 0 12px ${MATRIX_GREEN}`,
            borderColor: ball.curveTag ? LASER_PINK : MATRIX_GREEN
          }}
        />
      )}

      <div style={styles.dashboardDock}>
        <div style={styles.roundTelemetryLabel}>THROW TELEMETRY</div>

        <div
          style={{
            ...styles.terminalConsoleLog,
            borderColor: statusColor,
            color: statusColor === GLITCH_GOLD ? '#ffffff' : statusColor
          }}
        >
          <span style={{ color: MATRIX_GREEN }}>{'> '}</span>
          {lockStatus}
        </div>

        <div style={styles.powerTrackContainer}>
          <motion.div
            style={{ ...styles.powerFillVolume, width: `${vacuumPower}%` }}
            animate={isCharging ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <span style={styles.progressTextPercent}>{Math.round(vacuumPower)}% PRESSURE</span>
        </div>

        <div
          style={{
            ...styles.tacticalChargePad,
            background: isCharging ? 'rgba(255, 190, 26, 0.15)' : 'rgba(57, 255, 136, 0.05)',
            borderColor: isCharging ? GLITCH_GOLD : MATRIX_GREEN,
            cursor: isSwiped || disabled ? 'default' : 'pointer',
            opacity: isSwiped ? 0.5 : 1
          }}
          onTouchStart={handleStartSuctionCharge}
          onMouseDown={handleStartSuctionCharge}
        >
          <motion.div
            style={styles.innerCoreGlowDot}
            animate={isCharging ? { scale: [1, 1.4, 1], backgroundColor: LASER_PINK } : { scale: 1 }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          <div style={styles.touchPadLabelPrompt}>
            {disabled
              ? 'CAMERA NOT READY'
              : isSwiped
              ? 'TARGET RESOLVED'
              : isCharging
              ? isSpinningFast
                ? '🌀 CURVE LOADED - SWIPE UP TO LAUNCH ⬆️'
                : '⬆️ NOW SWIPE UP TO LAUNCH ⬆️'
              : 'HOLD TO CHARGE VACUUM ENGINE'}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  hudContainer: {
    position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none',
    background: 'transparent', touchAction: 'none'
  },
  laserScanline: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
    background: 'linear-gradient(90deg, transparent, #ff3b94, transparent)', opacity: 0.5,
    zIndex: 160, pointerEvents: 'none', animation: 'laserScan 5s linear infinite'
  },
  cyberHudFrame: {
    position: 'absolute', inset: '15px', border: '1px solid rgba(255,202,40,0.15)',
    pointerEvents: 'none', zIndex: 155
  },
  reticleOuterBounds: {
    position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none'
  },
  staticTargetOuterRing: {
    position: 'absolute', width: '130px', height: '130px', border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '50%'
  },
  shrinkingCaptureCircle: {
    position: 'absolute', width: '130px', height: '130px', border: '3px solid', borderRadius: '50%',
    transition: 'border-color 0.1s ease'
  },
  spinSparkle: {
    position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
    border: `2px dashed ${LASER_PINK}`, animation: 'spinSparkle 0.6s ease-out infinite', pointerEvents: 'none'
  },
  flightBall: {
    position: 'fixed', width: '26px', height: '26px', borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #ffffff, #39ff88 60%, #0a3d22 100%)',
    border: '2px solid', zIndex: 165, pointerEvents: 'none'
  },
  dashboardDock: {
    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '92%',
    maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 170
  },
  roundTelemetryLabel: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', color: '#8a8a93', fontWeight: 'bold',
    letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase'
  },
  terminalConsoleLog: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', background: '#000', border: '1px solid',
    padding: '12px', borderRadius: '8px', lineHeight: '1.4', minHeight: '44px', boxSizing: 'border-box',
    fontWeight: 'bold'
  },
  powerTrackContainer: {
    position: 'relative', width: '100%', height: '24px', background: '#000', borderRadius: '6px',
    border: '1px solid #2d2d3f', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  powerFillVolume: {
    position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #ff3b94, #ff006e)'
  },
  progressTextPercent: {
    position: 'relative', fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', fontWeight: 900,
    color: '#ffffff', letterSpacing: '1px', zIndex: 5
  },
  tacticalChargePad: {
    width: '100%', padding: '20px', border: '2px dashed', borderRadius: '14px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '10px', boxSizing: 'border-box',
    transition: 'all 0.15s ease'
  },
  innerCoreGlowDot: {
    width: '12px', height: '12px', backgroundColor: MATRIX_GREEN, borderRadius: '50%',
    boxShadow: '0 0 10px currentColor'
  },
  touchPadLabelPrompt: {
    fontFamily: "'Space Grotesk', sans-serif", color: '#ffffff', fontSize: '12px', fontWeight: 900,
    letterSpacing: '0.5px', textTransform: 'uppercase'
  }
};

// ----------------------------------------------------------------------
// INTEGRATION CHECK against the GameCanvas.jsx you provided:
//
//   <CaptureThrow
//     targets={captureTargets}              // [{id, species, distance, x, y, radius}] ✓ matches
//     onAttempt={handleCaptureAttempt}       // (id, quality) => ... ✓ matches signature
//     captureResolutions={captureResolutions}// [{id, vegId, success, label}] ✓ consumed above
//     disabled={cameraState !== 'ready'}     // ✓ gates all input + shows "CAMERA NOT READY"
//     screenW={windowDims.w}                 // ✓ used for bounds/floor
//     screenH={windowDims.h}                 // ✓ used for bounds/floor
//   />
//
// One background removed: `hudContainer.background` was BG_BLACK in the
// original standalone version, which would have painted a solid black
// layer over GameCanvas's camera feed + 3D scene. Set to transparent
// here since this now sits ON TOP of that camera/AR layer, not in place
// of it.
//
// If your server's 'capture-attempt' handler expects a different shape
// for `quality` than { tier, direct, ringScaleAtRelease, curveball,
// vacuumPower }, tell me the expected schema and I'll conform this to
// match exactly - I don't have server.js to verify against.
// ----------------------------------------------------------------------
