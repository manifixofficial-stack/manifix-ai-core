// ====================================================================
// 🧲 CaptureThrow.native.jsx - VACUUM HARPOON LOCK-ON INTERFACE (RN port)
// Ported from CaptureThrow.jsx (web v6) for GameCanvas.native.jsx.
//
// PROP CONTRACT UNCHANGED: targets / onAttempt / captureResolutions /
// disabled / screenW / screenH — same drop-in integration as the web
// version. All physics constants, wobble/server-race finalize logic,
// curveball spin detection, auto-reset timers, and status-string
// copy are unchanged from v6.
//
// WHAT ACTUALLY CHANGED (web → native):
//   - <div> → View, inline mouse/touch handlers → a single PanResponder
//     attached to the trigger button. Once RN's responder system grants
//     the gesture it keeps tracking finger movement across the whole
//     screen regardless of where the finger drifts, so this reproduces
//     the same "mousedown on button, drag anywhere, release anywhere"
//     behavior the web version got from a fixed-position hudContainer
//     capturing document-level move/up events.
//   - Custom velocity-sample ring buffer (performance.now() + a
//     VELOCITY_SAMPLE_WINDOW_MS window) replaced with PanResponder's
//     built-in gestureState.vx/vy, which is a comparable "recent
//     velocity" estimate — no window/webAPI to reimplement.
//   - navigator.vibrate / window.Capacitor haptics branch replaced with
//     React Native's Vibration API. If you want real Taptic/Haptics
//     feedback (not just buzz-vibration) swap fireHaptics() for
//     expo-haptics (Haptics.impactAsync) — left as plain Vibration here
//     to avoid adding a hard dependency the project may not have yet.
//   - document.createElement font/style injection removed. Orbitron and
//     Rajdhani must be linked as native font assets (e.g. via
//     expo-font's useFonts(), or react-native.config.js + `npx
//     react-native-asset` for bare RN) — see FONT NOTE below.
//   - framer-motion (motion.div/AnimatePresence) replaced with RN's
//     Animated API for the reticle scale/opacity and chip fade-in.
//     The ball and wobble-angle are still driven by direct state
//     updates each animation-loop tick (same as the web version's
//     per-frame setBall calls), since the physics loop already owns
//     per-frame position math — Animated wrapping would fight it.
//   - CSS backdrop-filter (glass blur) has no RN equivalent without a
//     native blur view library (e.g. @react-native-community/blur or
//     expo-blur). Chips use a solid translucent background instead;
//     swap in <BlurView> there if/when that dependency is added.
//   - CSS box-shadow / text-shadow replaced with RN shadow* props
//     (iOS) + elevation (Android approximation — Android elevation
//     can't do colored glow, it's a flat gray shadow. Fine for now.)
//   - CSS linear-gradient backgrounds (power bar fill, trigger button)
//     need expo-linear-gradient's <LinearGradient>. Added as a new
//     dependency — if the project isn't using Expo / doesn't have this
//     package, swap for react-native-linear-gradient instead (same API).
//   - window.innerWidth/innerHeight fallback removed; screenW/screenH
//     are required props on native (GameCanvas.native.jsx should pass
//     Dimensions.get('window').width/height).
// ====================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MATRIX_GREEN = '#39ff88';
const GLITCH_GOLD = '#ffbe1a';
const LASER_PINK = '#ff3b94';
const MISS_RED = '#ff3f34';
const BG_BLACK = '#030305';
const INK = '#f5f0e8';

// ---- Physics constants (all in px/s, px/s², screen-space) — unchanged ----
const GRAVITY_PX_S2 = 1400;
const AIR_RESISTANCE = 0.985;
const BOUNCE_COEFFICIENT = 0.45;
const MAX_BOUNCES = 2;
const FLOOR_Y_RATIO = 0.86;
const AUTO_RESET_MS = 4000;
const AUTO_RESET_OFFSCREEN_MARGIN = 250;
const SPIN_TO_CURVE_FACTOR = 3.2;
const BASE_BALL_DEPTH_SCALE = 1;

const RESOLUTION_WAIT_TIMEOUT_MS = 3500;

// ---- Capture wobble (shake suspense) — unchanged ----
const WOBBLE_HALF_SWING_MS = 260;
const WOBBLE_ANGLE_DEG = 16;
const WOBBLE_COUNT_BY_TIER = { PERFECT: 1, GOOD: 2, GLANCING: 3 };

// Swipe-up-to-launch threshold, in native dy px (gestureState.dy is
// negative when the finger has moved up from the grant point).
const SWIPE_UP_THRESHOLD_PX = 120;

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// Plain Vibration.vibrate — see header note re: expo-haptics upgrade.
function fireHaptics(style = 'medium') {
  const ms = style === 'heavy' ? 60 : style === 'light' ? 15 : 30;
  Vibration.vibrate(ms);
}

export default function CaptureThrow({
  targets = [],
  onAttempt,
  captureResolutions = [],
  disabled = false,
  screenW,
  screenH
}) {
  const viewportW = screenW || 375;
  const viewportH = screenH || 812;

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

  // Chip fade-in (replaces framer-motion initial/animate on the chips).
  const chargeChipAnim = useRef(new Animated.Value(0)).current;
  const wobbleChipAnim = useRef(new Animated.Value(0)).current;
  const reticleAnim = useRef(new Animated.Value(0)).current; // opacity+scale in/out

  const chargingIntervalRef = useRef(null);

  const spinCenterRef = useRef({ x: 0, y: 0 });
  const spinLastAngleRef = useRef(null);
  const spinAccumRef = useRef(0);

  const flightStateRef = useRef(null);
  const flightRafRef = useRef(null);
  const resolvedRef = useRef(false); // guards against double-dispatch of onAttempt

  const pendingAttemptRef = useRef(null); // { vegId, dispatchedAt } | null
  const seenResolutionIdsRef = useRef(new Set());
  const resolutionTimeoutRef = useRef(null);

  const wobbleTimeoutRef = useRef(null);
  const wobbleDoneRef = useRef(true);
  const pendingServerMatchRef = useRef(null);

  useEffect(() => {
    captureResolutions.forEach((r) => seenResolutionIdsRef.current.add(r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(reticleAnim, {
      toValue: isSwiped ? 0 : 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [isSwiped, reticleAnim]);

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
    const totalHalfSteps = shakeCount * 2;

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
      maybeFinalize();
    }
  }, [captureResolutions, maybeFinalize]);

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

  // 🎯 Closing target ring loop — unchanged (plain interval + state,
  // no web API involved so it ports as-is).
  useEffect(() => {
    if (isSwiped) return;
    const interval = setInterval(() => {
      setRingScale((prev) => (prev <= 0.25 ? 1.0 : prev - 0.015));
    }, 16);
    return () => clearInterval(interval);
  }, [isSwiped]);

  const pushSpinSample = (x, y) => {
    trackSpin(x, y);
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

  const findDirectHit = (x, y) => {
    for (const t of targets) {
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist <= t.radius) return t;
    }
    return null;
  };

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
        setBall({ x: target.x, y: target.y, depthScale: 1, curveTag });
        setCaptureAnimPhase('capturing');
        setLockStatus(`🎯 ${tier} HIT // HOLDING THE LOCK...`);
        runWobbleSequence(WOBBLE_COUNT_BY_TIER[tier] || 2);
      } else {
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

  const handleExecuteHarpoonLaunch = useCallback((releaseVx, releaseVy, touchStartY) => {
    clearInterval(chargingIntervalRef.current);
    setIsCharging(false);
    setIsSwiped(true);
    resolvedRef.current = false;

    const curveTag = isSpinningFast;
    const curveAccelPxS2 = curveTag ? Math.sign(spinAccumRef.current || 1) * SPIN_TO_CURVE_FACTOR * 60 : 0;

    const startX = viewportW / 2;
    const startY = touchStartY;

    flightStateRef.current = {
      x: startX,
      y: startY,
      vx: releaseVx,
      vy: -Math.abs(releaseVy) - 200,
      lastT: nowMs(),
      launchedAt: nowMs(),
      bounces: 0,
      depthScale: BASE_BALL_DEPTH_SCALE,
      curveTag,
      curveAccelPxS2
    };

    setBall({ x: startX, y: startY, depthScale: BASE_BALL_DEPTH_SCALE, curveTag });
    setLockStatus(curveTag ? '🌀 CURVE LOADED — LET IT RIP!' : '⚡ VORTEX BEAM DEPLOYED! SNATCHING...');

    runFlightLoop(ringScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringScale, isSpinningFast, viewportW]);

  const handleStartSuctionCharge = () => {
    if (disabled || isSwiped || ball) return false;
    setIsCharging(true);
    setLockStatus('🌀 COMPRESSING ENERGY FIELD...');

    Animated.timing(chargeChipAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();

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
    return true;
  };

  const handleReleaseAborted = () => {
    if (disabled) return;
    clearInterval(chargingIntervalRef.current);
    if (!isSwiped) {
      setIsCharging(false);
      setVacuumPower(0);
      setLockStatus('PRESSURE LOST // RESET THE VIBE');
      Animated.timing(chargeChipAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  };

  // --- Gesture: replaces web's onTouchStart/onMouseDown on the button
  // plus onTouchMove/onMouseMove/onTouchEnd/onMouseUp/onMouseLeave on
  // the full-screen hudContainer. One PanResponder does the whole job:
  // grant = charge start, move = spin-track + swipe-up detection,
  // release = either launch (if swiped past threshold) or abort.
  const grantOriginRef = useRef({ x: 0, y: 0 });
  const hasLaunchedThisGestureRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isSwiped && !ball,
      onMoveShouldSetPanResponder: () => !disabled && !isSwiped,
      onPanResponderGrant: (evt) => {
        hasLaunchedThisGestureRef.current = false;
        const { pageX, pageY } = evt.nativeEvent;
        grantOriginRef.current = { x: pageX, y: pageY };
        spinCenterRef.current = { x: pageX, y: pageY };
        handleStartSuctionCharge();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (disabled || isSwiped || hasLaunchedThisGestureRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        pushSpinSample(pageX, pageY);

        if (gestureState.dy < -SWIPE_UP_THRESHOLD_PX) {
          hasLaunchedThisGestureRef.current = true;
          // gestureState.vx/vy are px/ms — scale to px/s to match the
          // physics constants (which are all in px/s, px/s²).
          handleExecuteHarpoonLaunch(
            gestureState.vx * 1000,
            gestureState.vy * 1000,
            grantOriginRef.current.y
          );
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (hasLaunchedThisGestureRef.current) return;
        if (disabled || isSwiped) return;
        // Released without crossing the swipe threshold via move — try
        // the final velocity/delta once more before giving up, same
        // "swipe up" gesture just resolved at release instead of mid-move.
        if (gestureState.dy < -SWIPE_UP_THRESHOLD_PX / 2 && gestureState.vy < -0.15) {
          handleExecuteHarpoonLaunch(
            gestureState.vx * 1000,
            gestureState.vy * 1000,
            grantOriginRef.current.y
          );
          return;
        }
        handleReleaseAborted();
      },
      onPanResponderTerminate: () => {
        if (!hasLaunchedThisGestureRef.current) handleReleaseAborted();
      }
    })
  ).current;

  const ringInBand = ringScale <= 0.55 && ringScale >= 0.35;
  const statusColor =
    lockStatus.includes('💀') || lockStatus.includes('🔺') || lockStatus.includes('LOST')
      ? MISS_RED
      : lockStatus.includes('🔥 W')
      ? MATRIX_GREEN
      : GLITCH_GOLD;

  return (
    <View
      pointerEvents={disabled ? 'none' : 'box-none'}
      style={[styles.hudContainer, { opacity: disabled ? 0.5 : 1 }]}
    >
      {/* FLOATING GLASS CHIP HUD — anchored top, out of the camera's way */}
      <View style={styles.floatingHudContainer} pointerEvents="none">
        <View style={styles.arcadeBadgeChip}>
          <Text style={styles.hudLabelMini}>LOCK FEED STATUS</Text>
          <Text
            style={[
              styles.hudMetaValue,
              { color: statusColor },
              captureAnimPhase === 'bursting' && styles.hudMetaValueGlow
            ]}
          >
            {lockStatus}
          </Text>
        </View>

        {isCharging && (
          <Animated.View
            style={[
              styles.arcadeBadgeChip,
              { opacity: chargeChipAnim, transform: [{ translateY: chargeChipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }
            ]}
          >
            <Text style={styles.hudLabelMini}>VORTEX PRESSURE</Text>
            <View style={styles.powerTrackContainer}>
              <LinearGradient
                colors={vacuumPower >= 100 ? [MISS_RED, GLITCH_GOLD] : [LASER_PINK, GLITCH_GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.powerFillVolume, { width: `${vacuumPower}%` }]}
              />
            </View>
            <Text style={[styles.hudMetaValue, { color: vacuumPower >= 100 ? MISS_RED : GLITCH_GOLD, marginTop: 2 }]}>
              {Math.round(vacuumPower)}% {vacuumPower >= 100 ? '🔥 MAX REQ EXCEEDED // SEND IT!' : '🔋 BEAM CHARGING'}
            </Text>
          </Animated.View>
        )}

        {captureAnimPhase === 'capturing' && (
          <View style={styles.arcadeBadgeChip}>
            <Text style={styles.hudLabelMini}>LOCKING IN</Text>
            <Text style={[styles.hudMetaValue, { color: GLITCH_GOLD }]}>
              SHAKE {wobbleShakesDone}/{wobbleShakesTotal} 🔒✨
            </Text>
          </View>
        )}
      </View>

      {/* DASHED TRACKING CROSSHAIR — red while off-lock, green + glow on-lock */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.reticleOuterBounds,
          {
            opacity: reticleAnim,
            transform: [{ scale: reticleAnim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }]
          }
        ]}
      >
        <View style={styles.staticTargetOuterRing} />
        <View
          style={[
            styles.shrinkingCaptureCircle,
            {
              transform: [{ scale: ringScale }],
              borderColor: ringInBand ? MATRIX_GREEN : MISS_RED
            }
          ]}
        />
        {isSpinningFast && <View style={styles.spinSparkle} />}
      </Animated.View>

      {ball && (
        <View
          pointerEvents="none"
          style={[
            styles.flightBall,
            {
              left: ball.x - 13,
              top: ball.y - 13,
              borderColor:
                captureAnimPhase === 'bursting'
                  ? MATRIX_GREEN
                  : captureAnimPhase === 'breakout'
                  ? MISS_RED
                  : ball.curveTag
                  ? LASER_PINK
                  : MATRIX_GREEN,
              transform: [
                { rotate: `${captureAnimPhase === 'capturing' ? wobbleAngle : 0}deg` },
                {
                  scale:
                    captureAnimPhase === 'bursting'
                      ? 1.6
                      : captureAnimPhase === 'breakout'
                      ? 0.7
                      : ball.depthScale
                }
              ]
            }
          ]}
        />
      )}

      {/* LOWER TACTILE CONTROL — one big glass suction trigger, this View
          owns the PanResponder for the whole charge → spin → swipe-up
          → launch gesture. */}
      <View style={styles.lowerControlDeck} pointerEvents="box-none">
        <View style={styles.arcadeConsolePad}>
          <View
            {...panResponder.panHandlers}
            style={[
              styles.massiveSuctionTriggerBtnWrap,
              { opacity: disabled || isSwiped ? 0.55 : 1 }
            ]}
          >
            <LinearGradient
              colors={isCharging ? [MATRIX_GREEN, '#1ba673'] : [GLITCH_GOLD, '#caa24a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.massiveSuctionTriggerBtn}
            >
              <Text style={styles.triggerBtnText}>
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
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </View>
  );
}

// --- FONT NOTE ---
// hudLabelMini / hudMetaValue / triggerBtnText reference 'Orbitron-Bold'.
// Link the actual font files before shipping, e.g. with expo-font:
//   const [loaded] = useFonts({ 'Orbitron-Bold': require('./assets/fonts/Orbitron-Black.ttf') });
// or drop the fontFamily override entirely to use the system font until
// that's wired up.

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between', backgroundColor: 'transparent'
  },
  floatingHudContainer: {
    width: '100%', padding: 20, flexDirection: 'column', gap: 10
  },
  arcadeBadgeChip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(6, 8, 14, 0.86)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16,
    flexDirection: 'column', gap: 4, maxWidth: '86%', minWidth: 200,
    // Approximated glow — Android elevation can't do color, iOS shadow* can.
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 24,
    elevation: 6
  },
  hudLabelMini: {
    fontSize: 9, fontWeight: 'bold', fontFamily: 'Orbitron-Bold',
    color: '#8a92a8', letterSpacing: 1.5
  },
  hudMetaValue: {
    fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron-Bold',
    color: INK, letterSpacing: 0.4
  },
  hudMetaValueGlow: {
    textShadowColor: MATRIX_GREEN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10
  },
  powerTrackContainer: {
    position: 'relative', width: '100%', height: 10, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999, overflow: 'hidden', marginTop: 2
  },
  powerFillVolume: {
    position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 999
  },
  reticleOuterBounds: {
    position: 'absolute', top: '45%', left: '50%', marginLeft: -70, marginTop: -70,
    width: 140, height: 140, alignItems: 'center', justifyContent: 'center'
  },
  staticTargetOuterRing: {
    position: 'absolute', width: 130, height: 130, borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)', borderRadius: 65
  },
  shrinkingCaptureCircle: {
    position: 'absolute', width: 130, height: 130, borderWidth: 3, borderStyle: 'dashed', borderRadius: 65
  },
  spinSparkle: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderStyle: 'dashed', borderColor: LASER_PINK
    // Note: web version animates this with an infinite scale/rotate
    // keyframe. Port with Animated.loop(Animated.timing(...)) driving
    // rotate + scale if the spin-sparkle motion is needed on native —
    // left static here to keep this pass focused on the gesture port.
  },
  flightBall: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#39ff88', borderWidth: 2,
    shadowColor: MATRIX_GREEN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12,
    elevation: 8
  },
  lowerControlDeck: {
    width: '100%', paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center'
  },
  arcadeConsolePad: {
    width: '100%', maxWidth: 420, alignItems: 'center', justifyContent: 'center'
  },
  massiveSuctionTriggerBtnWrap: {
    width: '100%', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 8
  },
  massiveSuctionTriggerBtn: {
    width: '100%', height: 58, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12
  },
  triggerBtnText: {
    color: '#040508', fontWeight: '900', fontSize: 14, fontFamily: 'Orbitron-Bold',
    letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center'
  }
});

// ----------------------------------------------------------------------
// Prop contract unchanged — still matches GameCanvas's integration
// exactly (targets / onAttempt / captureResolutions / disabled / screenW
// / screenH). GameCanvas.native.jsx should pass screenW/screenH from
// Dimensions.get('window') since there's no window.innerWidth fallback
// on native.
// ----------------------------------------------------------------------