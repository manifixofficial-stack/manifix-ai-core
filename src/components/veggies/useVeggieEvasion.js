import { useRef, useState, useEffect } from "react";

const EDGE_MARGIN = 40;
const TOP_MARGIN_RATIO = 0.2; // keep veggies below the radar/dashboard UI
const BASE_SPEED = 1.4;
const MAX_SPEED = 5.5;
const CHASE_RADIUS_PX = 220; // beyond this, proximityFactor is ~0 (calm)
const GROWTH_LERP = 0.18;
const MAX_GROWTH = 2.4;
const CORNER_STREAK_TO_TRIGGER = 3;

/**
 * Drives a single veggie's on-screen position once it's within capture
 * range. Before `active` is true, this hook is idle and the sprite should
 * render at the GPS/bearing-derived (anchorX, anchorY) passed down from
 * GameCanvas.jsx as usual.
 *
 * The moment `active` flips true, position is seeded from the current
 * anchor and then simulated locally every frame — GPS updates are
 * intentionally ignored from that point on (the veggie is now a
 * screen-space actor, not a real-world point). If `active` flips back to
 * false (player backs out of range without catching it), the hook resets
 * so the sprite snaps back to being GPS-driven.
 */
export default function useVeggieEvasion({
  active,
  anchorX,
  anchorY,
  screenW,
  screenH,
  crosshairX,
  crosshairY,
}) {
  const posRef = useRef({ x: anchorX, y: anchorY });
  const [pos, setPos] = useState({ x: anchorX, y: anchorY });
  const [growth, setGrowth] = useState(1);
  const [cornered, setCornered] = useState(false);
  const cornerStreakRef = useRef(0);
  const wasActiveRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      cornerStreakRef.current = 0;
      setGrowth(1);
      setCornered(false);
      return;
    }

    // Seed the local sim once, right as catch mode begins. Deliberately
    // NOT re-run on every anchorX/anchorY change — see comment above.
    if (!wasActiveRef.current) {
      posRef.current = { x: anchorX, y: anchorY };
      setPos({ x: anchorX, y: anchorY });
      wasActiveRef.current = true;
    }

    const tick = () => {
      const p = posRef.current;
      const dx = p.x - crosshairX;
      const dy = p.y - crosshairY;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const proximityFactor = Math.max(0, 1 - dist / CHASE_RADIUS_PX);
      const speed = BASE_SPEED + proximityFactor * (MAX_SPEED - BASE_SPEED);

      let nx = p.x + (dx / dist) * speed;
      let ny = p.y + (dy / dist) * speed;

      const minX = EDGE_MARGIN;
      const maxX = screenW - EDGE_MARGIN;
      const minY = screenH * TOP_MARGIN_RATIO;
      const maxY = screenH - EDGE_MARGIN;
      const hitEdge = nx <= minX || nx >= maxX || ny <= minY || ny >= maxY;
      nx = Math.max(minX, Math.min(maxX, nx));
      ny = Math.max(minY, Math.min(maxY, ny));

      // "Cornered" only counts while the player is actually closing in —
      // bumping an edge while the crosshair is far away doesn't count.
      if (hitEdge && proximityFactor > 0.55) {
        cornerStreakRef.current += 1;
      } else if (proximityFactor < 0.3) {
        cornerStreakRef.current = 0;
      }

      const isCornered = cornerStreakRef.current >= CORNER_STREAK_TO_TRIGGER;
      setCornered(isCornered);
      setGrowth((g) => {
        const target = isCornered ? Math.min(MAX_GROWTH, 1 + proximityFactor * 1.6) : 1;
        return g + (target - g) * GROWTH_LERP;
      });

      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // anchorX/anchorY intentionally excluded — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, screenW, screenH, crosshairX, crosshairY]);

  return { x: pos.x, y: pos.y, growth, cornered };
}
