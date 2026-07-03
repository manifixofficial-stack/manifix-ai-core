import React, { useEffect, useState, useCallback, useRef } from "react";

/**
 * ScorePopup
 * ----------
 * A single transient "+points" flash rendered at a screen-space
 * coordinate. Self-removes via the onDone callback after its animation
 * finishes, so the parent's popup list stays clean.
 */
export function ScorePopup({ x, y, value, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 650);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="absolute z-30 pointer-events-none retro-arcade-flash select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      +{value}
    </div>
  );
}

/**
 * useScorePopups
 * ---------------
 * Small state manager hook for spawning/clearing popups. Drop this into
 * GameCanvas.jsx alongside your capture_veggie RPC handler.
 *
 * Usage:
 *   const { popups, spawnPopup } = useScorePopups();
 *
 *   // after a successful capture_veggie() resolves:
 *   spawnPopup({ x: veggieScreenX, y: veggieScreenY, value: 10000 });
 *
 *   // in render:
 *   <ScorePopupLayer popups={popups} onPopupDone={removePopup} />
 */
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
 * ScorePopupLayer
 * ----------------
 * Renders the full list of active popups. Mount once inside the game
 * canvas's positioned container.
 */
export function ScorePopupLayer({ popups, onPopupDone }) {
  return (
    <>
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

export default ScorePopup;
