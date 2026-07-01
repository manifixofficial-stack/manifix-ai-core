import React, { useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Anchored at the bottom center of the active match grid view space.
// Emits onMove(dx, dy) where dx/dy are normalized -1..1 relative to the
// joystick's max travel radius. Emits (0, 0) — the hard-stop coordinate —
// the exact instant the thumb lifts, so the server halts the player's circle.
function Joystick({ onMove, size = 160 }) {
  const baseRef = useRef(null);
  const activePointerId = useRef(null); // isolates this knob to ONE finger even in multi-touch

  const maxRadius = size / 2 - 32; // leave room so knob doesn't clip the glass ring edge

  // Raw position while dragging (instant, no lag under the thumb)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-driven output position — glides while dragging, snaps back on release
  const knobX = useSpring(rawX, { stiffness: 500, damping: 32, mass: 0.6 });
  const knobY = useSpring(rawY, { stiffness: 500, damping: 32, mass: 0.6 });

  const updateFromPointer = useCallback(
    (clientX, clientY) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxRadius) {
        const scale = maxRadius / distance;
        dx *= scale;
        dy *= scale;
      }
      rawX.set(dx);
      rawY.set(dy);
      if (onMove) {
        onMove(dx / maxRadius, dy / maxRadius);
      }
    },
    [maxRadius, onMove, rawX, rawY]
  );

  const handlePointerDown = (e) => {
    if (activePointerId.current !== null) return; // already tracking a finger — ignore extras
    activePointerId.current = e.pointerId;
    e.target.setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (activePointerId.current !== e.pointerId) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const releaseKnob = useCallback(
    (e) => {
      if (e && activePointerId.current !== e.pointerId) return;
      if (activePointerId.current === null) return;
      activePointerId.current = null;
      // Spring snaps the sphere back to dead center...
      rawX.set(0);
      rawY.set(0);
      // ...and this hard-stop message tells the server to stop the circle now,
      // not whenever the spring animation happens to settle.
      if (onMove) onMove(0, 0);
    },
    [onMove, rawX, rawY]
  );

  // Safety net: if the pointer leaves the browser window entirely mid-drag
  // (e.g. a fast swipe off-screen), still release the knob.
  useEffect(() => {
    const handleWindowRelease = (e) => releaseKnob(e);
    window.addEventListener('pointerup', handleWindowRelease);
    window.addEventListener('pointercancel', handleWindowRelease);
    return () => {
      window.removeEventListener('pointerup', handleWindowRelease);
      window.removeEventListener('pointercancel', handleWindowRelease);
    };
  }, [releaseKnob]);

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '28px',
        transform: 'translateX(-50%)',
        zIndex: 150
      }}
    >
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releaseKnob}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'rgba(28, 28, 36, 0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(200, 168, 75, 0.45)',
          boxShadow: '0 0 24px rgba(255, 200, 60, 0.10) inset, 0 4px 20px rgba(0,0,0,0.35)',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'grab'
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #ffd66b, #c8a84b)',
            boxShadow: '0 0 16px rgba(255, 200, 60, 0.55), 0 2px 6px rgba(0,0,0,0.4)',
            x: knobX,
            y: knobY,
            translateX: '-50%',
            translateY: '-50%'
          }}
        />
      </div>
    </div>
  );
}

export default Joystick;
