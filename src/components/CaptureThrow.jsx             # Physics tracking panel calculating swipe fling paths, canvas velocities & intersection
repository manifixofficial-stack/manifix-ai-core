import React, { useCallback, useEffect, useRef, useState } from 'react';

const GRAVITY = 900; // px/sec^2, arcs the throw downward
const LAUNCH_POWER = 2.2; // multiplies raw swipe velocity into throw velocity
const MAX_LAUNCH_SPEED = 1400; // px/sec, clamp so a hard fling doesn't rocket off-frame
const MIN_LAUNCH_SPEED = 250; // px/sec, below this a "swipe" is just a tap — ignored
const SPIN_DEG_PER_SEC = 480;
const PROJECTILE_RADIUS = 22; // px, trap-cube hit radius
const MAX_FLIGHT_MS = 1500; // give up and call it a miss after this long
const CUBE_SIZE = 36;

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
 *   4. Calls onHit(targetId) on a successful intersection, or onMiss() if
 *      the cube leaves the screen / times out un-caught (an item is spent
 *      either way — the parent decides what "spent" means, e.g. cube stock)
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
  screenW,
  screenH,
  disabled = false,
}) {
  const [projectiles, setProjectiles] = useState([]);
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

  // Physics + collision loop
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
            onHit?.(hitTarget.id);
            continue; // consumed, don't carry forward
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
  }, [projectiles.length > 0, screenW, screenH, onHit, onMiss]);

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
};
