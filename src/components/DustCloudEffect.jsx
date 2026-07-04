// components/DustCloudEffect.jsx
//
// "Poof!" dust cloud spawned at a veggie's last-known screen position the
// instant its evasion state flips IDLE -> RUN. Purely cosmetic/local —
// like ScorePopup.jsx, this pairs a layer component (DustCloudLayer) with
// a spawn/lifecycle hook (useDustClouds) so GameCanvas.jsx can wire it up
// the same way it already wires up ScorePopupLayer/useScorePopups:
//
//   const { clouds, spawnCloud, removeCloud } = useDustClouds();
//   ...
//   // inside the veggie IDLE -> RUN transition handler:
//   spawnCloud({ x: v.x, y: v.y, scale: v.scale });
//   ...
//   <DustCloudLayer clouds={clouds} onCloudDone={removeCloud} />
//
// Each cloud is a short burst of CSS-animated particles that expands and
// fades over CLOUD_LIFETIME_MS, then calls back so the caller can drop it
// from state. No canvas, no external animation lib — matches the rest of
// this codebase's preference for plain inline-styled DOM nodes.

import React, { useCallback, useEffect, useRef, useState } from 'react';

const CLOUD_LIFETIME_MS = 480;
const PARTICLES_PER_CLOUD = 7;

// Fixed fan-out angles (degrees) + per-particle timing/size jitter, seeded
// once at module load so every cloud reuses the same base shape instead of
// calling Math.random() per-frame. Cheap and visually indistinguishable
// from true randomness for a burst this short-lived.
const PARTICLE_LAYOUT = Array.from({ length: PARTICLES_PER_CLOUD }, (_, i) => {
  const angle = (360 / PARTICLES_PER_CLOUD) * i + (Math.random() * 20 - 10);
  return {
    angle,
    distance: 18 + Math.random() * 22,
    size: 10 + Math.random() * 14,
    delayMs: Math.random() * 60,
  };
});

let cloudIdCounter = 0;

/**
 * Manages the list of currently-active dust clouds. Mirrors
 * useScorePopups' shape exactly (spawn/remove + array) so it can be
 * dropped into GameCanvas.jsx alongside the existing popups state without
 * introducing a new pattern.
 */
export function useDustClouds() {
  const [clouds, setClouds] = useState([]);

  const spawnCloud = useCallback(({ x, y, scale = 1 }) => {
    const id = ++cloudIdCounter;
    setClouds((prev) => [...prev, { id, x, y, scale }]);
    return id;
  }, []);

  const removeCloud = useCallback((id) => {
    setClouds((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clouds, spawnCloud, removeCloud };
}

function Particle({ angle, distance, size, delayMs, scale }) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * distance * scale;
  const dy = Math.sin(rad) * distance * scale;

  return (
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size * scale,
        height: size * scale,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(230,224,210,0.55) 60%, rgba(230,224,210,0) 100%)',
        transform: 'translate(-50%, -50%)',
        animation: `dustParticlePoof ${CLOUD_LIFETIME_MS}ms ease-out ${delayMs}ms forwards`,
        '--dust-dx': `${dx}px`,
        '--dust-dy': `${dy}px`,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * A single burst at (x, y). Self-removes via onDone once its lifetime
 * elapses — GameCanvas never needs to manually schedule the cleanup
 * timeout itself, same as how ScorePopup's fade-out is self-contained.
 */
function DustCloud({ id, x, y, scale, onDone }) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => onDone(id), CLOUD_LIFETIME_MS + 80);
    return () => clearTimeout(timeoutRef.current);
  }, [id, onDone]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 0,
        height: 0,
        zIndex: 26, // just above VeggieSprite/HackedTargetSprite (zIndex 25)
        pointerEvents: 'none',
      }}
    >
      {PARTICLE_LAYOUT.map((p, i) => (
        <Particle key={i} {...p} scale={scale} />
      ))}
    </div>
  );
}

/**
 * Renders every currently-active cloud. Drop this once near the other
 * overlay layers in GameCanvas.jsx (e.g. right beside ScorePopupLayer) —
 * it deliberately does not blindly cover the whole viewport, since only
 * the veggie's immediate vicinity should be obscured, not the crosshair
 * or CATCH button.
 */
export function DustCloudLayer({ clouds = [], onCloudDone = () => {} }) {
  if (clouds.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes dustParticlePoof {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0.4);
            opacity: 0.9;
          }
          60% {
            opacity: 0.75;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--dust-dx), var(--dust-dy)) scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
      {clouds.map((c) => (
        <DustCloud key={c.id} {...c} onDone={onCloudDone} />
      ))}
    </>
  );
}

export default DustCloudLayer;
