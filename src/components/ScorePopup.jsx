import React, { useEffect, useState, useCallback, useRef } from 'react';

/**
 * ScorePopup / useScorePopups / ScorePopupLayer
 * ----------------------------------------------
 * Transient "+points" LED-style flash at a screen-pixel coordinate,
 * fired right after a successful capture_veggie() call.
 *
 * Usage inside GameCanvas.jsx:
 *
 *   const { popups, spawnPopup, removePopup } = useScorePopups();
 *
 *   // in handleCatch, after a successful capture:
 *   spawnPopup({ x: caughtScreenX, y: caughtScreenY, value: points });
 *
 *   // in render, anywhere inside the root wrap div:
 *   <ScorePopupLayer popups={popups} onPopupDone={removePopup} />
 */

const POPUP_LIFETIME_MS = 650;

export function ScorePopup({ x, y, value, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), POPUP_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{
        ...styles.popup,
        left: x,
        top: y,
      }}
    >
      +{value}
    </div>
  );
}

export function useScorePopups() {
  const [popups, setPopups] = useState([]);
  const idRef = useRef(0);

  const spawnPopup = useCallback(({ x, y, value }) => {
    const id = idRef.current++;
    setPopups((prev) => [...prev, { id, x, y, value }]);
  }, []);

  const removePopup = useCallback((id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { popups, spawnPopup, removePopup };
}

/**
 * Renders all active popups plus a one-time <style> tag carrying the
 * keyframe animation (GameCanvas.jsx uses inline style objects throughout,
 * so there's no existing global stylesheet to hook into — this injects
 * its own scoped keyframes rather than requiring a separate CSS import).
 */
export function ScorePopupLayer({ popups, onPopupDone }) {
  return (
    <>
      <style>{keyframes}</style>
      {popups.map((p) => (
        <ScorePopup
          key={p.id}
          x={p.x}
          y={p.y}
          value={p.value}
          onDone={() => onPopupDone(p.id)}
        />
      ))}
    </>
  );
}

const keyframes = `
@keyframes veggieScorePopupBounce {
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  70%  { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -140%) scale(1.0); opacity: 0; }
}
`;

const styles = {
  popup: {
    position: 'absolute',
    zIndex: 46,
    pointerEvents: 'none',
    fontFamily: "'Orbitron', 'Impact', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#ef4444',
    WebkitTextStroke: '1.5px #facc15',
    textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
    animation: `veggieScorePopupBounce ${POPUP_LIFETIME_MS}ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
  },
};

export default ScorePopup;
