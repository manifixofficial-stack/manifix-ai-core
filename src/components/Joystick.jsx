import React, { useRef, useState, useCallback, useEffect } from 'react';

// Emits onMove(dx, dy) where dx/dy are normalized -1..1 relative to the
// joystick's max travel radius. Emits (0, 0) the moment the thumb is released.
function Joystick({ onMove, size = 120 }) {
  const baseRef = useRef(null);
  const draggingRef = useRef(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const maxRadius = size / 2 - 24; // leave room so knob doesn't clip the base edge

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

      setKnobPos({ x: dx, y: dy });

      if (onMove) {
        onMove(dx / maxRadius, dy / maxRadius);
      }
    },
    [maxRadius, onMove]
  );

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    e.target.setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const releaseKnob = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setKnobPos({ x: 0, y: 0 });
    if (onMove) onMove(0, 0);
  };

  // Safety net: if the pointer leaves the browser window entirely mid-drag
  // (e.g. a fast swipe off-screen), still release the knob.
  useEffect(() => {
    window.addEventListener('pointerup', releaseKnob);
    window.addEventListener('pointercancel', releaseKnob);
    return () => {
      window.removeEventListener('pointerup', releaseKnob);
      window.removeEventListener('pointercancel', releaseKnob);
    };
  }, []);

  return (
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
        border: '1px solid rgba(200, 168, 75, 0.4)',
        boxShadow: '0 0 20px rgba(255, 200, 60, 0.08) inset',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #ffc83c, #c8a84b)',
          boxShadow: '0 0 12px rgba(255, 200, 60, 0.5)',
          transform: `translate(-50%, -50%) translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.15s ease-out'
        }}
      />
    </div>
  );
}

export default Joystick;
