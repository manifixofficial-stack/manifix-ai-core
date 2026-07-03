import React, { useCallback, useEffect, useRef, useState } from 'react';

const GRAVITY = 900; // px/sec^2, arcs the throw downward
const LAUNCH_POWER = 2.2; // multiplies raw swipe velocity into throw velocity
const MAX_LAUNCH_SPEED = 1400; // px/sec, clamp so a hard fling doesn't rocket off-frame
const MIN_LAUNCH_SPEED = 250; // px/sec, below this a "swipe" is just a tap — ignored
const SPIN_DEG_PER_SEC = 480;
const PROJECTILE_RADIUS = 22; // px, trap-cube hit radius
const MAX_FLIGHT_MS = 1500; // give up and call it a miss after this long
const CUBE_SIZE = 36;

// -----------------------------------------------------------------------
// Net-lock tunables
// -----------------------------------------------------------------------
// Once the trap-cube collides with a target, the projectile stops moving
// and becomes a "net" that has to hold over the target for LOCK_DURATION_MS
// before onHit actually fires. If the target's live position (from
// targetsRef, updated every render by the parent) drifts outside
// LOCK_BREAK_RADIUS_PX during that window — e.g. useVeggieEvasion's AI
// escapes — the lock breaks and it counts as a miss instead of a catch.
const LOCK_DURATION_MS = 1800;
const LOCK_BREAK_RADIUS_PX = 70; // generous vs PROJECTILE_RADIUS so it isn't hair-trigger
const NET_SIZE = 64;

/**
 * Physics tracking panel for the swipe-to-throw capture mechanic.
 *
 * Contract: the parent owns what's catchable and passes their *live* screen
 * positions in `targets` (this component doesn't know about GPS/evasion at
 * all — it just needs {id, x, y, radius} updated each render, e.g. lifted
 * out of each VeggieSprite's useVeggieEvasion state). This component:
 *   1. Captures swipe gesture start/end to compute a launch velocity vector
 *   2. Simulates a spinning trap-cube projectile under gravity each frame
 *   3. Tests circle-circle intersection against `targets` every frame
 *   4. On collision, transitions the projectile into a LOCKING state
 *      instead of resolving immediately: the net drops over the target and
 *      must hold position over it for LOCK_DURATION_MS.
 *   5. Calls onHit(targetId) only once the lock completes successfully, or
 *      onMiss() if the cube leaves the screen / times out un-caught / the
 *      target escapes the net mid-lock (an item is spent either way — the
 *      parent decides what "spent" means, e.g. cube stock).
 *
 * Optional onLockStart(targetId) fires the moment a lock begins, before
 * it resolves. This is the seam for future server-side lock contention
 * (e.g. an optimistic-lock RPC so two players' nets can't both claim the
 * same veggie) — currently unused, onHit still fires from a single local
 * timer with no backend call until the very end.
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
  screenW,
  screenH,
  disabled = false,
}) {
  // Two independent lists now: free-flying projectiles (still obeying
  // gravity, still testing for a first collision) and locks (already
  // stuck to a target, running down their hold timer instead of moving).
  const [projectiles, setProjectiles] = useState([]);
  const [locks, setLocks] = useState([]);
  const gestureRef = useRef(null); // { x, y, t } at touchstart
  const targetsRef = useRef(targets);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);

  // Keep a ref so the animation loop always sees current target positions
  // without needing to restart the loop on every parent re-render.
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  const handleStart = useCallback((e) => {
    if (disabled) return;
    const point = e.touches ? e.touches[0] : e;
    gestureRef.current = { x: point.clientX, y: point.clientY, t: performance.now() };
  }, [disabled]);

  const handleEnd = useCallback((e) => {
    if (disabled || !gestureRef.current) return;
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const start = gestureRef.current;
    gestureRef.current = null;

    const dt = Math.max((performance.now() - start.t) / 1000, 0.016);
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    const rawSpeed = Math.hypot(dx, dy) / dt;

    if (rawSpeed < MIN_LAUNCH_SPEED) return; // treat as a tap, not a throw — no cube spent

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
  }, [disabled]);

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
            // FIX: previously called onHit(hitTarget.id) immediately here
            // and dropped the projectile. Now the projectile converts into
            // a lock instead — the net has landed, but the catch isn't
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
  }, [projectiles.length > 0, screenW, screenH, onMiss, onLockStart]);

  // NEW: lock-hold loop — runs independently of the projectile physics
  // loop above. Each active lock re-checks every frame whether its target
  // is still nearby (the target's screen position keeps moving under
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

  return (
    <div
      style={{ ...styles.gestureLayer, pointerEvents: disabled ? 'none' : 'all' }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    >
      {projectiles.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.cube,
            left: p.x - CUBE_SIZE / 2,
            top: p.y - CUBE_SIZE / 2,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          📦
        </div>
      ))}

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
};
