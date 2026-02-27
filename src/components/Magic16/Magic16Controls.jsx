/* ==========================================================
 * ManifiX — Magic16 Controls
 * ----------------------------------------------------------
 * Responsibilities:
 * - Start / Pause / Stop Magic16 session
 * - Display current phase (Yoga / Meditation)
 * - Device-safe (mobile, desktop, tablet)
 * - Accessible & calming UX
 * ========================================================== */

import React from "react";

const Magic16Controls = ({
  isActive = false,
  isPaused = false,
  phase = "YOGA", // YOGA | MEDITATION
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  return (
    <div className="magic16-controls">
      {/* ===============================
          PHASE INDICATOR
      =============================== */}
      <div className="magic16-phase">
        {phase === "YOGA" ? "🧘 Yoga (8 min)" : "🧘‍♀️ Meditation (8 min)"}
      </div>

      {/* ===============================
          CONTROLS
      =============================== */}
      <div className="magic16-buttons">
        {!isActive && (
          <button className="btn primary" onClick={onStart}>
            ▶ Start
          </button>
        )}

        {isActive && !isPaused && (
          <button className="btn secondary" onClick={onPause}>
            ⏸ Pause
          </button>
        )}

        {isActive && isPaused && (
          <button className="btn primary" onClick={onResume}>
            ▶ Resume
          </button>
        )}

        {isActive && (
          <button className="btn danger" onClick={onStop}>
            ⏹ Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default Magic16Controls;
