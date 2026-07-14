// src/components/CaptureThrow.jsx
//
// Touch ballistics system: swipe gesture tracking, parabolic-arc projectile
// physics, shrinking rhythm-ring catch timing, and overheat lockout.
//
// WHAT CHANGED (this revision):
// Previously, the trap animation (snap -> vacuum -> land -> shake ->
// "success") ran on a FIXED timer (TRAP_TOTAL_MS = 900ms) with no
// awareness of the server at all. onHit fired automatically once that
// timer elapsed, regardless of whether the server actually approved the
// catch (dist/round-state/target-still-exists checks in server.js). That
// meant a losing player in a two-player race for the same vegetable would
// ALWAYS see "CAUGHT!" on their own screen, even though they scored zero
// points server-side.
//
// Now: the trap plays through snap -> vacuum -> land as before (this part
// is purely cosmetic and doesn't need to wait), then enters a 'waiting'
// phase and HOLDS there — showing a shaking trap, not a result — until a
// matching entry appears in the new `captureResolutions` prop (fed by
// GameCanvas from the server's real 'capture-result' event). Only then
// does it show 'success' or 'fail'. A 3-second timeout auto-resolves as
// fail if the server never responds (bad connection), so the animation
// can't get stuck forever.
//
// Prop renamed: onHit -> onAttempt, and its timing moved earlier — it now
// fires the MOMENT the projectile physically collides with a target, not
// after the whole animation finishes. This matters because onAttempt is
// what actually emits 'capture-attempt' to the server (see GameCanvas.jsx)
// — the server needs to hear about the attempt immediately, not 900ms
// after the fact.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TARGET_RING_CYCLE_MS,
  TARGET_RING_MAX_RADIUS_PX,
  TARGET_RING_MIN_RADIUS_PX,
  TARGET_RING_PERFECT_THRESHOLD_PX,
} from '../config/gameConfig';

const GRAVITY = 900;
const LAUNCH_POWER = 2.2;
const MAX_LAUNCH_SPEED = 1400;
const MIN_LAUNCH_SPEED = 250;
const SPIN_DEG_PER_SEC = 480;
const BASKET_SIZE = 40;
const MAX_FLIGHT_MS = 1500;

// --- New trap-phase timing: cosmetic phases are short and fixed, but the
// 'waiting' phase has no fixed duration — it holds until the server
// responds, capped by a timeout so a bad connection can't strand it. ---
const TRAP_SNAP_MS = 150;
const TRAP_VACUUM_MS = 220;
const TRAP_LAND_MS = 150;
const TRAP_WAIT_TIMEOUT_MS = 3000;
const TRAP_RESULT_DISPLAY_MS = 450;

const HEAT_MAX = 100;
const HEAT_PER_SWIPE = (vyPxPerSec) => Math.min(25, Math.abs(vyPxPerSec / 1000) * 8);
const HEAT_DECAY_PER_SEC = 35;
const LOCKOUT_MS = 1500;

const BASE_TARGET_HALF_WIDTH_PX = 30;

function targetHitRadiusPx(target) {
  if (target.radius != null) return target.radius;
  const scale = Math.max(0.4, 1 - (target.distance ?? 0) / 15);
  return BASE_TARGET_HALF_WIDTH_PX * scale;
}

const GOLD = '#ffc83c';
const GOLD_DARK = '#c8a84b';

function CaptureDiscIcon({ size = BASKET_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="17" fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.9" />
      <circle cx="20" cy="20" r="10" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.6" />
      <path d="M20 6 A14 14 0 0 1 34 20" fill="none" stroke="#3cd6ff" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <path d="M20 34 A14 14 0 0 1 6 20" fill="none" stroke="#3cd6ff" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <circle cx="20" cy="20" r="3" fill={GOLD} />
    </svg>
  );
}

function SnapSparkIcon({ size = BASKET_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <path d="M21 4 L11 22 H19 L17 36 L30 16 H22 Z" fill="#3cd6ff" stroke="#0d111a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function VacuumSwirlIcon({ size = BASKET_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <path d="M20 4 C29 4 36 11 36 20 C36 27 31 32 25 33" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <path d="M20 36 C11 36 4 29 4 20 C4 13 9 8 15 7" fill="none" stroke="#3cd6ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="20" r="4" fill={GOLD} />
    </svg>
  );
}

function TrapBoxIcon({ size = BASKET_SIZE, shaking }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="7" y="15" width="26" height="18" rx="2" fill="#1a1206" stroke={GOLD} strokeWidth="2.5" />
      <path d="M5 15 L20 6 L35 15" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="20" y1="15" x2="20" y2="33" stroke={GOLD_DARK} strokeWidth="1.5" opacity="0.7" />
      {shaking && (
        <>
          <circle cx="11" cy="11" r="1.6" fill="#3cd6ff" opacity="0.8" />
          <circle cx="29" cy="9" r="1.3" fill="#3cd6ff" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function SteamWispsIcon() {
  return (
    <svg width="72" height="40" viewBox="0 0 72 40">
      {[10, 36, 62].map((cx, i) => (
        <path
          key={cx}
          d={`M${cx} 34 C ${cx - 6} 26, ${cx + 6} 20, ${cx} 12 C ${cx - 6} 6, ${cx + 4} 2, ${cx} -2`}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.9 - i * 0.15}
        />
      ))}
    </svg>
  );
}

export default function CaptureThrow({
  targets = [],
  onAttempt,
  onCaught,
  onMiss,
  captureResolutions = [],
  screenW = window.innerWidth,
  screenH = window.innerHeight,
  disabled = false,
}) {
  const [projectiles, setProjectiles] = useState([]);
  const [traps, setTraps] = useState([]);
  const [heat, setHeat] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [, forceTick] = useState(0);

  const activeSwipesRef = useRef({});
  const targetsRef = useRef(targets);
  const ringPhaseStartRef = useRef({});
  const rafRef = useRef(null);
  const ringRafRef = useRef(null);
  const lastTsRef = useRef(null);
  const lockoutTimerRef = useRef(null);
  const heatRafRef = useRef(null);
  const heatLastTsRef = useRef(null);

  // Latest captureResolutions snapshot, readable inside the rAF loop below
  // without re-subscribing the animation loop every time the prop changes.
  const captureResolutionsRef = useRef(captureResolutions);
  useEffect(() => {
    captureResolutionsRef.current = captureResolutions;
  }, [captureResolutions]);

  // Tracks which resolution ids have already been used to finish a trap,
  // so the same server response can't be applied twice (e.g. if two traps
  // somehow shared a targetId).
  const consumedResolutionIdsRef = useRef(new Set());

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'capture-throw-animation-keyframes';
    styleSheet.innerText = `
      @keyframes veggieCaptureShake {
        0% { transform: translate(-2px, 1px) rotate(0deg); }
        20% { transform: translate(1px, -2px) rotate(-3deg); }
        40% { transform: translate(-3px, -1px) rotate(3deg); }
        60% { transform: translate(2px, 2px) rotate(0deg); }
        80% { transform: translate(-1px, -1px) rotate(-2deg); }
        100% { transform: translate(2px, -2px) rotate(3deg); }
      }
      @keyframes veggieCaptureVacuum {
        0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
        100% { transform: scale(1.6) rotate(360deg); filter: hue-rotate(90deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      const el = document.getElementById('capture-throw-animation-keyframes');
      if (el) document.head.removeChild(el);
    };
  }, []);

  useEffect(() => {
    targetsRef.current = targets;
    const seen = new Set();
    targets.forEach((t) => {
      seen.add(t.id);
      if (!(t.id in ringPhaseStartRef.current)) {
        ringPhaseStartRef.current[t.id] = performance.now();
      }
    });
    Object.keys(ringPhaseStartRef.current).forEach((id) => {
      if (!seen.has(id)) delete ringPhaseStartRef.current[id];
    });
  }, [targets]);

  useEffect(() => {
    if (!targets.length) return undefined;
    const step = () => {
      forceTick((n) => n + 1);
      ringRafRef.current = requestAnimationFrame(step);
    };
    ringRafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ringRafRef.current);
  }, [targets.length]);

  const getRingState = useCallback((targetId, now) => {
    const start = ringPhaseStartRef.current[targetId] ?? now;
    const phase = ((now - start) % TARGET_RING_CYCLE_MS) / TARGET_RING_CYCLE_MS;
    const radius = TARGET_RING_MAX_RADIUS_PX - (TARGET_RING_MAX_RADIUS_PX - TARGET_RING_MIN_RADIUS_PX) * phase;
    const normalized = (radius - TARGET_RING_MIN_RADIUS_PX) / (TARGET_RING_MAX_RADIUS_PX - TARGET_RING_MIN_RADIUS_PX);
    const color = normalized > 0.66 ? 'red' : normalized > 0.33 ? 'yellow' : 'green';
    return { radius, color };
  }, []);

  useEffect(() => {
    if (heat <= 0) {
      heatLastTsRef.current = null;
      return undefined;
    }
    const step = (ts) => {
      if (heatLastTsRef.current == null) heatLastTsRef.current = ts;
      const dt = Math.min((ts - heatLastTsRef.current) / 1000, 0.05);
      heatLastTsRef.current = ts;
      setHeat((h) => Math.max(0, h - HEAT_DECAY_PER_SEC * dt));
      heatRafRef.current = requestAnimationFrame(step);
    };
    heatRafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(heatRafRef.current);
  }, [heat]);

  const triggerLockout = useCallback(() => {
    setLockedOut((already) => {
      if (already) return already;
      activeSwipesRef.current = {};
      clearTimeout(lockoutTimerRef.current);
      lockoutTimerRef.current = setTimeout(() => {
        setLockedOut(false);
        setHeat(0);
      }, LOCKOUT_MS);
      return true;
    });
  }, []);

  const launchFromGesture = useCallback(
    (start, end) => {
      const dt = Math.max((end.t - start.t) / 1000, 0.016);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const rawVy = dy / dt;
      const rawSpeed = Math.hypot(dx, dy) / dt;

      if (rawSpeed < MIN_LAUNCH_SPEED) return;

      setHeat((h) => {
        const next = Math.min(HEAT_MAX, h + HEAT_PER_SWIPE(rawVy));
        if (next >= HEAT_MAX) queueMicrotask(triggerLockout);
        return next;
      });

      const speed = Math.min(rawSpeed * LAUNCH_POWER, MAX_LAUNCH_SPEED);
      const angle = Math.atan2(dy, dx);

      setProjectiles((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          x: start.x,
          y: start.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: 0,
          bornAt: performance.now(),
        },
      ]);
    },
    [triggerLockout]
  );

  const handleStart = useCallback(
    (e) => {
      if (disabled || lockedOut) return;
      if (e.touches && e.cancelable) e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      activeSwipesRef.current.gesture = { x: touch.clientX, y: touch.clientY, t: performance.now() };
    },
    [disabled, lockedOut]
  );

  const handleEnd = useCallback(
    (e) => {
      if (disabled) return;
      const start = activeSwipesRef.current.gesture;
      if (!start) return;
      delete activeSwipesRef.current.gesture;
      if (lockedOut) return;

      if (e.changedTouches && e.cancelable) e.preventDefault();
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      launchFromGesture(start, { x: touch.clientX, y: touch.clientY, t: performance.now() });
    },
    [disabled, lockedOut, launchFromGesture]
  );

  // Projectile physics + collision loop
  useEffect(() => {
    if (!projectiles.length && !traps.length) {
      lastTsRef.current = null;
      return undefined;
    }

    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.033);
      lastTsRef.current = ts;

      setProjectiles((prev) => {
        const next = [];
        for (const p of prev) {
          const age = ts - p.bornAt;
          const nx = p.x + p.vx * dt;
          const ny = p.y + p.vy * dt;
          const nvy = p.vy + GRAVITY * dt;
          const rotation = p.rotation + SPIN_DEG_PER_SEC * dt;

          const hitTarget = targetsRef.current.find(
            (t) => Math.hypot(nx - t.x, ny - t.y) <= BASKET_SIZE / 2 + targetHitRadiusPx(t)
          );

          if (hitTarget) {
            const radiusAtHit =
              TARGET_RING_MAX_RADIUS_PX -
              (TARGET_RING_MAX_RADIUS_PX - TARGET_RING_MIN_RADIUS_PX) *
                (((ts - ringPhaseStartRef.current[hitTarget.id]) % TARGET_RING_CYCLE_MS) / TARGET_RING_CYCLE_MS);
            const quality = radiusAtHit <= TARGET_RING_PERFECT_THRESHOLD_PX ? 'perfect' : 'good';

            // Fire the server request THE MOMENT the collision registers,
            // not after the cosmetic animation finishes. The server is the
            // one that decides whether this actually counts.
            onAttempt?.(hitTarget.id, quality);

            setTraps((prevTraps) => [
              ...prevTraps,
              {
                id: p.id,
                targetId: hitTarget.id,
                x: nx,
                y: ny,
                quality,
                phase: 'snap',
                phaseStartedAt: ts,
              },
            ]);
            continue;
          }

          if (nx < -60 || nx > screenW + 60 || ny < -60 || ny > screenH + 60 || age > MAX_FLIGHT_MS) {
            onMiss?.();
            continue;
          }

          next.push({ ...p, x: nx, y: ny, vy: nvy, rotation });
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [projectiles.length, screenW, screenH, onMiss, onAttempt, traps.length]);

  // Trap-phase loop: snap -> vacuum -> land -> waiting (holds for the
  // server) -> success/fail -> removed. The 'waiting' phase is the whole
  // point of this rewrite — it does NOT advance on a timer, it advances
  // only when a matching entry shows up in captureResolutions, or after
  // TRAP_WAIT_TIMEOUT_MS elapses with no answer (connection issue).
  useEffect(() => {
    if (!traps.length) return undefined;
    let raf;
    const step = (ts) => {
      setTraps((prev) => {
        const next = [];
        for (const trap of prev) {
          const elapsed = ts - trap.phaseStartedAt;

          if (trap.phase === 'snap') {
            next.push(elapsed >= TRAP_SNAP_MS ? { ...trap, phase: 'vacuum', phaseStartedAt: ts } : trap);
            continue;
          }
          if (trap.phase === 'vacuum') {
            next.push(elapsed >= TRAP_VACUUM_MS ? { ...trap, phase: 'land', phaseStartedAt: ts } : trap);
            continue;
          }
          if (trap.phase === 'land') {
            next.push(elapsed >= TRAP_LAND_MS ? { ...trap, phase: 'waiting', phaseStartedAt: ts } : trap);
            continue;
          }
          if (trap.phase === 'waiting') {
            const list = captureResolutionsRef.current;
            let match = null;
            for (let i = 0; i < list.length; i++) {
              const r = list[i];
              if (consumedResolutionIdsRef.current.has(r.id)) continue;
              if (r.vegId === trap.targetId) {
                match = r;
                break;
              }
            }
            if (match) {
              consumedResolutionIdsRef.current.add(match.id);
              next.push({
                ...trap,
                phase: match.success ? 'success' : 'fail',
                phaseStartedAt: ts,
                resultLabel: match.label || null,
              });
              continue;
            }
            // No server answer yet. Give up waiting after
            // TRAP_WAIT_TIMEOUT_MS so a dropped connection can't leave the
            // trap shaking forever with no resolution.
            if (elapsed >= TRAP_WAIT_TIMEOUT_MS) {
              next.push({ ...trap, phase: 'fail', phaseStartedAt: ts, resultLabel: 'CONNECTION LOST' });
              continue;
            }
            next.push(trap);
            continue;
          }
          if (trap.phase === 'success' || trap.phase === 'fail') {
            if (elapsed >= TRAP_RESULT_DISPLAY_MS) {
              if (trap.phase === 'success') onCaught?.(trap.targetId, trap.quality);
              continue;
            }
            next.push(trap);
            continue;
          }
          next.push(trap);
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [traps.length, onCaught]);

  const ringColorHex = { green: '#39ff88', yellow: '#ffd23c', red: '#ff4d4d' };

  return (
    <div
      style={{ ...styles.gestureLayer, pointerEvents: disabled ? 'none' : 'all' }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    >
      {targets.map((t) => {
        const { radius, color } = getRingState(t.id, performance.now());
        const hex = ringColorHex[color];
        return (
          <svg
            key={`ring-${t.id}`}
            width={TARGET_RING_MAX_RADIUS_PX * 2}
            height={TARGET_RING_MAX_RADIUS_PX * 2}
            style={{
              position: 'absolute',
              left: t.x - TARGET_RING_MAX_RADIUS_PX,
              top: t.y - TARGET_RING_MAX_RADIUS_PX,
              pointerEvents: 'none',
            }}
          >
            <circle cx={TARGET_RING_MAX_RADIUS_PX} cy={TARGET_RING_MAX_RADIUS_PX} r={radius} fill="none" stroke={hex} strokeWidth={3} opacity={0.85} />
            <circle
              cx={TARGET_RING_MAX_RADIUS_PX}
              cy={TARGET_RING_MAX_RADIUS_PX}
              r={TARGET_RING_PERFECT_THRESHOLD_PX}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          </svg>
        );
      })}

      {projectiles.map((p) => (
        <div key={p.id} style={{ ...styles.basket, left: p.x - BASKET_SIZE / 2, top: p.y - BASKET_SIZE / 2, transform: `rotate(${p.rotation}deg)` }}>
          <CaptureDiscIcon />
        </div>
      ))}

      {traps.map((trap) => (
        <div key={trap.id} style={{ ...styles.trapWrap, left: trap.x - BASKET_SIZE / 2, top: trap.y - BASKET_SIZE / 2 }}>
          <div
            style={{
              ...styles.basket,
              animation:
                trap.phase === 'waiting'
                  ? 'veggieCaptureShake 90ms linear infinite'
                  : trap.phase === 'vacuum'
                  ? 'veggieCaptureVacuum 220ms ease-in forwards'
                  : undefined,
              opacity: trap.phase === 'success' || trap.phase === 'fail' ? 0 : 1,
            }}
          >
            {trap.phase === 'snap' && <SnapSparkIcon />}
            {trap.phase === 'vacuum' && <VacuumSwirlIcon />}
            {(trap.phase === 'land' || trap.phase === 'waiting') && <TrapBoxIcon shaking={trap.phase === 'waiting'} />}
          </div>

          {trap.phase === 'success' && (
            <div style={styles.successBurst}>
              <span style={styles.successText}>{trap.quality === 'perfect' ? 'PERFECT CATCH!' : 'CAUGHT!'}</span>
            </div>
          )}

          {trap.phase === 'fail' && (
            <div style={styles.failBurst}>
              <span style={styles.failText}>{trap.resultLabel || 'MISSED'}</span>
            </div>
          )}
        </div>
      ))}

      <div style={styles.heatMeterTrack}>
        <div
          style={{
            ...styles.heatMeterFill,
            width: `${heat}%`,
            background: heat >= HEAT_MAX ? '#ff3b3b' : heat > 70 ? '#ff9c3c' : '#3cd6ff',
          }}
        />
      </div>

      {lockedOut && (
        <div style={styles.lockoutOverlay}>
          <SteamWispsIcon />
          <div style={styles.lockoutText}>SYSTEM OVERHEAT: LOCKED OUT</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  gestureLayer: { position: 'absolute', inset: 0, zIndex: 45, width: '100%', height: '100%', touchAction: 'none' },
  basket: {
    position: 'absolute',
    width: `${BASKET_SIZE}px`,
    height: `${BASKET_SIZE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
    filter: 'drop-shadow(0 0 6px rgba(255, 200, 60, 0.5))',
    transition: 'opacity 0.2s ease',
  },
  trapWrap: { position: 'absolute', width: `${BASKET_SIZE}px`, height: `${BASKET_SIZE}px`, pointerEvents: 'none' },
  successBurst: {
    position: 'absolute',
    top: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(5, 5, 5, 0.95)',
    border: '1px solid var(--gold-primary, #d4af37)',
    boxShadow: 'var(--shadow-gold, 0 0 20px rgba(212, 175, 55, 0.25))',
    padding: '6px 14px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  successText: { color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px' },
  // NEW: fail burst — same shape/position as success so it doesn't jump
  // around visually, but red-tinted so it's unmistakably a miss.
  failBurst: {
    position: 'absolute',
    top: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(30, 5, 5, 0.95)',
    border: '1px solid #ff6b5e',
    boxShadow: '0 0 20px rgba(255, 80, 60, 0.25)',
    padding: '6px 14px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  failText: { color: '#ff6b5e', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.5px' },
  heatMeterTrack: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '160px',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.15)',
    overflow: 'hidden',
    pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
  },
  heatMeterFill: { height: '100%', borderRadius: '4px', transition: 'width 0.1s linear, background-color 0.2s ease' },
  lockoutOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: 'rgba(4, 6, 10, 0.75)',
    backdropFilter: 'blur(2px)',
    pointerEvents: 'none',
  },
  lockoutText: { fontSize: '18px', fontWeight: 800, letterSpacing: '1.5px', color: '#ff3b3b', textShadow: '0 2px 6px rgba(0,0,0,0.8)', fontFamily: 'monospace' },
};
