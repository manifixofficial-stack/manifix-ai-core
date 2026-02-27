/* ==========================================================
 * ManifiX — Magic16 Timer
 * ----------------------------------------------------------
 * Responsibilities:
 * - Countdown timer for Magic16
 * - Show Yoga / Meditation phase
 * - Visual progress indicator
 * - Ultra-smooth updates (battery safe)
 * - Mobile + Web friendly
 * ========================================================== */

import React, { useEffect, useState } from "react";

const TOTAL_YOGA = 8 * 60;        // 8 minutes
const TOTAL_MEDITATION = 8 * 60;  // 8 minutes

const Magic16Timer = ({
  phase = "YOGA",           // "YOGA" | "MEDITATION"
  remainingSeconds = 480,   // seconds left in current phase
  isActive = false,
}) => {
  const total =
    phase === "YOGA" ? TOTAL_YOGA : TOTAL_MEDITATION;

  const progress = Math.max(
    0,
    Math.min(100, ((total - remainingSeconds) / total) * 100)
  );

  // ===============================
  // ⏱ FORMAT TIME (MM:SS)
  // ===============================
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="magic16-timer">
      {/* ===============================
          PHASE TITLE
      =============================== */}
      <div className="magic16-title">
        {phase === "YOGA" ? "🧘 Yoga Flow" : "🌿 Deep Meditation"}
      </div>

      {/* ===============================
          TIME DISPLAY
      =============================== */}
      <div className="magic16-time">
        {formatTime(remainingSeconds)}
      </div>

      {/* ===============================
          PROGRESS BAR
      =============================== */}
      <div className="magic16-progress">
        <div
          className="magic16-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ===============================
          STATUS
      =============================== */}
      <div className="magic16-status">
        {isActive ? "Session Active" : "Ready to Begin"}
      </div>
    </div>
  );
};

export default Magic16Timer;
