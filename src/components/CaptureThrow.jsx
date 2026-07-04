import React, { useCallback, useEffect, useRef, useState } from 'react';

const GRAVITY = 900; // px/sec^2, arcs the throw downward
const LAUNCH_POWER = 2.2; // multiplies raw swipe velocity into throw velocity
const MAX_LAUNCH_SPEED = 1400; // px/sec, clamp so a hard fling doesn't rocket off-frame
const MIN_LAUNCH_SPEED = 250; // px/sec, below this a "swipe" is just a tap — ignored
const SPIN_DEG_PER_SEC = 480;
const PROJECTILE_RADIUS = 22; // px, trap-cube hit radius
const MAX_FLIGHT_MS = 1500; // give up and call it a miss after this long
const CUBE_SIZE = 36;
const MAX_TOUCHES = 5; // cap on simultaneous tracked fingers

// -----------------------------------------------------------------------
// Net-lock tunables
// -----------------------------------------------------------------------
const LOCK_DURATION_MS = 1800;
const LOCK_BREAK_RADIUS_PX = 70; // generous vs PROJECTILE_RADIUS so it isn't hair-trigger
const NET_SIZE = 64;

// -----------------------------------------------------------------------
// Ballistic depth-scale tunables
// -----------------------------------------------------------------------
// The cube doesn't just travel in a flat line — it's rendered as if it's
// being pulled back, hurled deep into the screen, and then blooming wide
// as it drops onto the target. Scale is driven purely off flight progress
// (age / MAX_FLIGHT_MS, clamped 0..1) rather than actual distance-to-target,
// so it reads consistently regardless of where the throw lands or misses.
const SCALE_KEYFRAMES = [
  { t: 0, s: 1.0 },
  { t: 0.5, s: 0.4 },
  { t: 1, s: 2.5 },
];

// -----------------------------------------------------------------------
// Thermal / friction lockout tunables
// -----------------------------------------------------------------------
// Every completed swipe dumps heat into the meter proportional to how
// aggressively the finger moved vertically. Spam enough fast flicks and
// the meter overflows, locking out new throws for a beat while a "smoke"
// overlay clears — mirroring the show's gag where mashing the capture
// button fries the tracking rig.
const HEAT_MAX = 100;
const HEAT_PER_SWIPE = (vyPxPerSec) => Math.min(25, Math.abs(vyPxPerSec / 1000) * 8);
const HEAT_DECAY_PER_SEC = 35; // passive cooldown while not overflowing
const LOCKOUT_MS = 1500;

// -----------------------------------------------------------------------
// Recoil tunables
// -----------------------------------------------------------------------
// A whiffed high-speed throw kicks a shake vector back to the parent
// camera view, roughly opposite the throw direction, scaled by how hard
// the miss was thrown.
const RECOIL_MIN_SPEED = 700; // px/sec — misses slower than this don't shake
const RECOIL_SCALE = 0.03; // speed(px/sec) -> shake magnitude(px)
const RECOIL_MAX_MAGNITUDE = 32;

/**
 * Physics tracking panel for the swipe-to-throw capture mechanic.
 *
 * Contract: the parent owns what's catchable and passes their *live* screen
 * positions in `targets` (this component doesn't know about GPS/evasion at
 * all — it just needs {id, x, y, radius} updated each render, e.g. lifted
 * out of each VeggieSprite's useVeggieEvasion state). This component:
 *   1. Tracks up to MAX_TOUCHES independent fingers simultaneously and
 *      launches one projectile per qualifying flick, so multi-finger
 *      barrages throw multiple cubes at once.
 *   2. Simulates a spinning, depth-scaling trap-cube projectile under
 *      gravity each frame.
 *   3. Tests circle-circle intersection against `targets` every frame.
 *   4. On collision, transitions the projectile into a LOCKING state
 *      instead of resolving immediately: the net drops over the target and
 *      must hold position over it for LOCK_DURATION_MS.
 *   5. Calls onHit(targetId) only once the lock completes successfully, or
 *      onMiss() if the cube leaves the screen / times out un-caught / the
 *      target escapes the net mid-lock (an item is spent either way — the
 *      parent decides what "spent" means, e.g. cube stock).
 *   6. Builds a heat meter on every completed swipe; overflowing it forces
 *      a temporary throw lockout (visualized with a smoke overlay).
 *   7. On a fast miss, reports a recoil vector via onRecoil so the parent
 *      can shake the camera view.
 *
 * Optional onLockStart(targetId) fires the moment a lock begins, before
 * it resolves. This is the seam for future server-side lock contention
 * (e.g. an optimistic-lock RPC so two players' nets can't both claim the
 * same veggie) — currently unused, onHit still fires from a single local
 * timer with no backend call until the very end.
 *
 * Optional onRecoil({ vx, vy, magnitude }) fires alongside onMiss when a
 * fast-moving projectile leaves the screen or times out; vx/vy are a unit
 * direction (roughly opposite the throw), magnitude is suggested shake
 * strength in px. Purely advisory — the parent decides how to animate it.
 *
 * Optional onHeatChange(percent) and onLockoutChange(boolean) fire as the
 * thermal meter updates, so the parent HUD can mirror them if desired;
 * this component also renders its own built-in meter/lockout overlay.
 *
 * Renders its own invisible full-screen gesture layer, so it should be
 * mounted above the camera feed but below persistent HUD chrome the player
 * still needs to tap (exit button, scoreboard, etc.) — pointer-events are
 * only active where the cube layer itself needs them.
 */
export default function CaptureThrow({
  targets = [],
  onHit,
  onMiss,
  onLockStart,
  onRecoil,
  onHeatChange,
  onLockoutChange,
  screenW,
  screenH,
  disabled = false,
}) {
  // Two independent lists now: free-flying projectiles (still obeying
  // gravity, still testing for a first collision) and locks (already
  // stuck to a target, running down their hold timer instead of moving).
  const [projectiles, setProjectiles] = useState([]);
  const [locks, setLocks] = useState([]);
  const [heat, setHeat] = useState(0); // 0..HEAT_MAX, drives the meter + overflow
  const [lockedOut, setLockedOut] = useState(false);

  // Multi-touch tracking: one in-flight gesture per touch identifier (or
  // the fixed key 'mouse' for desktop), so several fingers flicking at
  // once each produce their own independent throw.
  const activeSwipesRef = useRef({});
  const targetsRef = useRef(targets);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const lockoutTimerRef = useRef(null);
  const heatRafRef = useRef(null);
  const heatLastTsRef = useRef(null);

  // Keep a ref so the animation loop always sees current target positions
  // without needing to restart the loop on every parent re-render.
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    onHeatChange?.(heat);
  }, [heat, onHeatChange]);

  useEffect(() => {
    onLockoutChange?.(lockedOut);
  }, [lockedOut, onLockoutChange]);

  // Passive heat decay — runs continuously whenever there's heat to shed,
  // independent of whether a lockout is active or projectiles are in
  // flight, so the meter always eventually drains back to zero.
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
  }, [heat > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerLockout = useCallback(() => {
    if (lockedOut) return;
    setLockedOut(true);
    activeSwipesRef.current = {}; // frantic mashing that caused this shouldn't leave a stale swipe armed
    clearTimeout(lockoutTimerRef.current);
    lockoutTimerRef.current = setTimeout(() => {
      setLockedOut(false);
      setHeat(0); // full cooldown once the smoke clears
    }, LOCKOUT_MS);
  }, [lockedOut]);

  useEffect(() => () => clearTimeout(lockoutTimerRef.current), []);

  const launchFromGesture = useCallback((start, end) => {
    const dt = Math.max((end.t - start.t) / 1000, 0.016);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const rawVy = dy / dt;
    const rawSpeed = Math.hypot(dx, dy) / dt;

    if (rawSpeed < MIN_LAUNCH_SPEED) return; // treat as a tap, not a throw — no cube spent

    // Heat goes up for every real swipe attempt, fast or slow, before we
    // even check whether it overflows — mashing weak flicks still counts
    // as friction on the screen.
    setHeat((h) => {
      const nextHeat = Math.min(HEAT_MAX, h + HEAT_PER_SWIPE(rawVy));
      if (nextHeat >= HEAT_MAX) {
        // Defer so we don't call setState-triggering logic mid-updater.
        queueMicrotask(triggerLockout);
      }
      return nextHeat;
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
  }, [triggerLockout]);

  const handleStart = useCallback((e) => {
    if (disabled || lockedOut) return;
    if (e.touches) {
      for (const touch of e.touches) {
        const key = touch.identifier;
        if (activeSwipesRef.current[key]) continue; // already tracking this finger
        if (Object.keys(activeSwipesRef.current).length >= MAX_TOUCHES) break;
        activeSwipesRef.current[key] = { x: touch.clientX, y: touch.clientY, t: performance.now() };
      }
    } else {
      activeSwipesRef.current.mouse = { x: e.clientX, y: e.clientY, t: performance.now() };
    }
  }, [disabled, lockedOut]);

  const handleEnd = useCallback((e) => {
    if (disabled) return;
    if (e.changedTouches) {
      for (const touch of e.changedTouches) {
        const key = touch.identifier;
        const start = activeSwipesRef.current[key];
        if (!start) continue;
        delete activeSwipesRef.current[key];
        if (lockedOut) continue; // finger lifted mid-lockout — swallow the throw
        launchFromGesture(start, { x: touch.clientX, y: touch.clientY, t: performance.now() });
      }
    } else {
      const start = activeSwipesRef.current.mouse;
      if (!start) return;
      delete activeSwipesRef.current.mouse;
      if (lockedOut) return;
      launchFromGesture(start, { x: e.clientX, y: e.clientY, t: performance.now() });
    }
  }, [disabled, lockedOut, launchFromGesture]);

  // Physics + collision loop — handles free-flying projectiles only.
  // On collision, a projectile is removed from `projectiles` and a
  // corresponding entry is added to `locks` (see effect below) rather
  // than resolving on the spot.
  useEffect(() => {
    if (!projectiles.length) {
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

          // Collision test against live target positions
          const hitTarget = targetsRef.current.find(
            (t) => Math.hypot(nx - t.x, ny - t.y) <= PROJECTILE_RADIUS + (t.radius || 0)
          );
          if (hitTarget) {
            // Previously called onHit(hitTarget.id) immediately here and
            // dropped the projectile. Now the projectile converts into a
            // lock instead — the net has landed, but the catch isn't
            // confirmed yet. Queued via a functional update on `locks` in
            // the same tick so we don't mutate state outside its own
            // setter.
            setLocks((prevLocks) => [
              ...prevLocks,
              {
                id: p.id,
                targetId: hitTarget.id,
                x: nx,
                y: ny,
                lockedAt: ts,
                progress: 0,
              },
            ]);
            onLockStart?.(hitTarget.id);
            continue; // consumed from the free-flying list either way
          }

          const offScreen = nx < -60 || nx > screenW + 60 || ny < -60 || ny > screenH + 60;
          const expired = age > MAX_FLIGHT_MS;
          if (offScreen || expired) {
            // Recoil: only a genuinely fast throw punishes a bad-aim miss
            // with camera shake. Speed is taken at the moment of the miss
            // (post-gravity), and the shake direction is roughly opposite
            // the projectile's current travel vector.
            const missSpeed = Math.hypot(p.vx, nvy);
            if (onRecoil && missSpeed >= RECOIL_MIN_SPEED) {
              const magnitude = Math.min(RECOIL_MAX_MAGNITUDE, missSpeed * RECOIL_SCALE);
              onRecoil({
                vx: -(p.vx / missSpeed) * magnitude,
                vy: -(nvy / missSpeed) * magnitude,
                magnitude,
              });
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectiles.length > 0, screenW, screenH, onMiss, onLockStart, onRecoil]);

  // Lock-hold loop — runs independently of the projectile physics loop
  // above. Each active lock re-checks every frame whether its target is
  // still nearby (the target's screen position keeps moving under
  // useVeggieEvasion even while locked, since evasion doesn't know or
  // care that a net has landed on it). If the target drifts outside
  // LOCK_BREAK_RADIUS_PX, the lock breaks and it's a miss. Otherwise the
  // lock's progress ticks up until it crosses LOCK_DURATION_MS, at which
  // point onHit fires exactly once for that target.
  useEffect(() => {
    if (!locks.length) return undefined;

    let raf;
    const step = (ts) => {
      setLocks((prev) => {
        const next = [];
        for (const lock of prev) {
          const liveTarget = targetsRef.current.find((t) => t.id === lock.targetId);

          // Target vanished entirely (e.g. someone else already caught it
          // via a different input path, or it was removed from state) —
          // break the lock as a miss rather than hanging forever.
          if (!liveTarget) {
            onMiss?.();
            continue;
          }

          const drift = Math.hypot(liveTarget.x - lock.x, liveTarget.y - lock.y);
          if (drift > LOCK_BREAK_RADIUS_PX) {
            onMiss?.();
            continue;
          }

          const elapsed = ts - lock.lockedAt;
          if (elapsed >= LOCK_DURATION_MS) {
            onHit?.(lock.targetId);
            continue; // resolved — drop from active locks
          }

          // Net follows the target's drift within the break radius so it
          // visually "clings" rather than staying pinned to the original
          // impact point while the veggie squirms underneath it.
          next.push({ ...lock, x: liveTarget.x, y: liveTarget.y, progress: elapsed / LOCK_DURATION_MS });
        }
        return next;
      });

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locks.length > 0, onHit, onMiss]);

  const cubeScaleFor = (age) => {
    const t = Math.min(1, Math.max(0, age / MAX_FLIGHT_MS));
    for (let i = 0; i < SCALE_KEYFRAMES.length - 1; i += 1) {
      const a = SCALE_KEYFRAMES[i];
      const b = SCALE_KEYFRAMES[i + 1];
      if (t >= a.t && t <= b.t) {
        const localT = (t - a.t) / (b.t - a.t || 1);
        return a.s + (b.s - a.s) * localT;
      }
    }
    return SCALE_KEYFRAMES[SCALE_KEYFRAMES.length - 1].s;
  };

  return (
    <div
      style={{ ...styles.gestureLayer, pointerEvents: disabled ? 'none' : 'all' }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {projectiles.map((p) => {
        const scale = cubeScaleFor(performance.now() - p.bornAt);
        return (
          <div
            key={p.id}
            style={{
              ...styles.cube,
              left: p.x - CUBE_SIZE / 2,
              top: p.y - CUBE_SIZE / 2,
              transform: `scale(${scale}) rotate(${p.rotation}deg)`,
            }}
          >
            📦
          </div>
        );
      })}

      {/* Net-lock visual: a ring that fills clockwise as `progress` climbs
          from 0 to 1, plus a flashing net emoji so it reads clearly as
          "in progress" rather than a static decoration. */}
      {locks.map((lock) => {
        const angle = 360 * lock.progress;
        return (
          <div
            key={lock.id}
            style={{
              ...styles.netWrap,
              left: lock.x - NET_SIZE / 2,
              top: lock.y - NET_SIZE / 2,
            }}
          >
            <svg width={NET_SIZE} height={NET_SIZE} style={styles.netRingSvg}>
              <circle
                cx={NET_SIZE / 2}
                cy={NET_SIZE / 2}
                r={NET_SIZE / 2 - 4}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="4"
              />
              <circle
                cx={NET_SIZE / 2}
                cy={NET_SIZE / 2}
                r={NET_SIZE / 2 - 4}
                fill="none"
                stroke="#ffc83c"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * (NET_SIZE / 2 - 4)}
                strokeDashoffset={
                  2 * Math.PI * (NET_SIZE / 2 - 4) * (1 - lock.progress)
                }
                transform={`rotate(-90 ${NET_SIZE / 2} ${NET_SIZE / 2})`}
              />
            </svg>
            <span style={styles.netEmoji}>🥅</span>
          </div>
        );
      })}

      {/* Thermal meter — always visible so the player can see friction
          building before they hit overflow. */}
      <div style={styles.heatMeterTrack}>
        <div
          style={{
            ...styles.heatMeterFill,
            width: `${heat}%`,
            background: heat >= HEAT_MAX ? '#ff3b3b' : heat > 70 ? '#ff9c3c' : '#3cd6ff',
          }}
        />
      </div>

      {/* Overflow lockout overlay — smoke + warning text, throws disabled
          for LOCKOUT_MS while it's up. */}
      {lockedOut && (
        <div style={styles.lockoutOverlay}>
          <div style={styles.smokeCloud}>💨💨💨</div>
          <div style={styles.lockoutText}>OVERFLOW: LOCKOUT</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  gestureLayer: {
    position: 'absolute', inset: 0, zIndex: 38, touchAction: 'none',
  },
  cube: {
    position: 'absolute', width: CUBE_SIZE, height: CUBE_SIZE, fontSize: CUBE_SIZE,
    lineHeight: `${CUBE_SIZE}px`, textAlign: 'center', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.4))',
    pointerEvents: 'none',
  },
  netWrap: {
    position: 'absolute', width: NET_SIZE, height: NET_SIZE,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  netRingSvg: {
    position: 'absolute', inset: 0,
  },
  netEmoji: {
    fontSize: NET_SIZE * 0.5,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  heatMeterTrack: {
    position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
    width: 160, height: 10, borderRadius: 6, background: 'rgba(0,0,0,0.35)',
    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', pointerEvents: 'none',
  },
  heatMeterFill: {
    height: '100%', transition: 'width 80ms linear, background 150ms linear',
  },
  lockoutOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'rgba(0,0,0,0.25)', pointerEvents: 'none',
  },
  smokeCloud: {
    fontSize: 40, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
  },
  lockoutText: {
    fontSize: 22, fontWeight: 800, letterSpacing: 1.5, color: '#ff3b3b',
    textShadow: '0 2px 6px rgba(0,0,0,0.8)',
  },
};
