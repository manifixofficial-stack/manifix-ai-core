// components/ScreenSplatOverlay.jsx
//
// Full-screen "you got splatted" overlay. Fully self-contained: GameCanvas
// only needs to flip `active` to true (and pick a `variant`) — everything
// about tracking the wipe gesture and clearing itself lives in here.
//
// Usage in GameCanvas.jsx:
//
//   const [splat, setSplat] = useState(null); // null | { variant }
//   ...
//   // TODO (once CaptureThrow.jsx is available): call this from
//   // CaptureThrow's onMiss handler when the miss distance is inside
//   // CATCH_RADIUS_METERS (a "close-range" miss), instead of the default
//   // onMiss behavior of just clearing lockedVeggieIds.
//   setSplat({ variant: v.type === 'broccoli' ? 'broccoli' : 'tomato' });
//   ...
//   <ScreenSplatOverlay
//     active={!!splat}
//     variant={splat?.variant}
//     onCleared={() => setSplat(null)}
//   />

import React, { useCallback, useEffect, useRef, useState } from 'react';

const SPLAT_COVERAGE = 0.8;       // fraction of viewport blocked at full splat
const WIPE_PER_STROKE = 0.22;     // how much a single wipe gesture clears
const AUTO_CLEAR_MS = 6000;       // safety net if the player never wipes

const VARIANT_STYLES = {
  tomato: { color: '#c0122f', dark: '#6e0a1c', label: 'TOMATO JUICE!' },
  broccoli: { color: '#3f7d20', dark: '#234512', label: 'BROCCOLI MULCH!' },
};

/**
 * Renders a dripping splat that covers most of the screen at `active` and
 * clears progressively as the player drags across it. A drag is measured
 * as cumulative pointer travel while pressed, not just a single tap, so
 * "wipe frantically" actually requires wiping rather than one lucky tap.
 */
export function ScreenSplatOverlay({ active, variant = 'tomato', onCleared }) {
  const [coverage, setCoverage] = useState(0);
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0, accum: 0 });
  const autoClearRef = useRef(null);

  useEffect(() => {
    if (active) {
      setCoverage(SPLAT_COVERAGE);
      autoClearRef.current = setTimeout(() => onCleared?.(), AUTO_CLEAR_MS);
    } else {
      setCoverage(0);
    }
    return () => clearTimeout(autoClearRef.current);
  }, [active, onCleared]);

  const handlePointerDown = useCallback((e) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY, accum: 0 };
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.dragging) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      const travel = Math.hypot(dx, dy);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.accum += travel;

      // Every ~120px of cumulative wipe travel clears one "stroke" worth.
      if (d.accum >= 120) {
        d.accum = 0;
        setCoverage((prev) => {
          const next = Math.max(0, prev - WIPE_PER_STROKE);
          if (next <= 0) {
            clearTimeout(autoClearRef.current);
            onCleared?.();
          }
          return next;
        });
      }
    },
    [onCleared]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  if (!active || coverage <= 0) return null;

  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.tomato;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        cursor: 'grab',
        touchAction: 'none',
        opacity: coverage / SPLAT_COVERAGE,
        // Radial drips concentrated toward center + a few off-axis blobs,
        // scaled by remaining coverage so the mess visibly shrinks as the
        // player wipes rather than just fading uniformly.
        background: `
          radial-gradient(circle at 30% 20%, ${style.color} 0%, transparent ${18 * coverage + 8}%),
          radial-gradient(circle at 70% 15%, ${style.dark} 0%, transparent ${14 * coverage + 6}%),
          radial-gradient(circle at 50% 55%, ${style.color} 0%, transparent ${28 * coverage + 10}%),
          radial-gradient(circle at 20% 75%, ${style.dark} 0%, transparent ${16 * coverage + 6}%),
          radial-gradient(circle at 80% 70%, ${style.color} 0%, transparent ${20 * coverage + 8}%)
        `,
        transition: 'opacity 120ms linear',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 1.5,
          color: '#fff',
          textShadow: '2px 2px 0 rgba(0,0,0,0.6)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {style.label}
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, opacity: 0.85 }}>
          SWIPE TO WIPE YOUR SCREEN
        </div>
      </div>
    </div>
  );
}

export default ScreenSplatOverlay;
