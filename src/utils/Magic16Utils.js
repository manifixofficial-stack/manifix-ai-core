/* ==========================================================
 * ManifiX — Magic16 Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Handle 8-min Yoga + 8-min Meditation logic
 * - Track session phases
 * - Integrate with voiceService / ttsService
 * - Provide helpers for UI updates and timers
 * ========================================================== */

import voiceService from "../services/voice.service.js";

// Default Magic16 session config
export const MAGIC16_DEFAULT = {
  totalMinutes: 16,
  yogaMinutes: 8,
  meditationMinutes: 8,
  updateInterval: 1000, // 1 second updates
};

// Phase identifiers
export const MAGIC16_PHASES = {
  YOGA: "Yoga",
  MEDITATION: "Meditation",
  COMPLETE: "Complete",
};

let magic16Timer = null;
let elapsedSeconds = 0;
let currentPhase = MAGIC16_PHASES.YOGA;
let onUpdateCallback = null;

/**
 * Start Magic16 session
 * @param {Object} options - { onUpdate: function, autoSpeak: boolean }
 */
export function startMagic16({ onUpdate = null, autoSpeak = true } = {}) {
  stopMagic16(); // ensure previous session is stopped
  elapsedSeconds = 0;
  currentPhase = MAGIC16_PHASES.YOGA;
  onUpdateCallback = onUpdate;

  if (autoSpeak) voiceService.speak(`Starting Magic16 session. First ${MAGIC16_DEFAULT.yogaMinutes} minutes: Yoga phase`);

  magic16Timer = setInterval(() => {
    elapsedSeconds++;

    // Switch phase at 8 minutes
    if (elapsedSeconds === MAGIC16_DEFAULT.yogaMinutes * 60) {
      currentPhase = MAGIC16_PHASES.MEDITATION;
      if (autoSpeak) voiceService.speak(`Now ${MAGIC16_DEFAULT.meditationMinutes} minutes: Meditation phase`);
    }

    // Complete session at 16 minutes
    if (elapsedSeconds >= MAGIC16_DEFAULT.totalMinutes * 60) {
      currentPhase = MAGIC16_PHASES.COMPLETE;
      stopMagic16();
      if (autoSpeak) voiceService.speak("Magic16 session complete. Great job!");
    }

    // Callback for UI updates
    if (onUpdateCallback) {
      const remainingSeconds = MAGIC16_DEFAULT.totalMinutes * 60 - elapsedSeconds;
      onUpdateCallback({
        phase: currentPhase,
        elapsedSeconds,
        remainingSeconds,
      });
    }
  }, MAGIC16_DEFAULT.updateInterval);
}

/**
 * Stop Magic16 session
 */
export function stopMagic16() {
  if (magic16Timer) clearInterval(magic16Timer);
  magic16Timer = null;
  elapsedSeconds = 0;
  currentPhase = MAGIC16_PHASES.YOGA;
  if (onUpdateCallback) onUpdateCallback({ phase: MAGIC16_PHASES.COMPLETE, elapsedSeconds: 0, remainingSeconds: 0 });
}

/**
 * Get current Magic16 status
 * @returns {Object} { phase, elapsedSeconds, remainingSeconds }
 */
export function getMagic16Status() {
  const remainingSeconds = MAGIC16_DEFAULT.totalMinutes * 60 - elapsedSeconds;
  return {
    phase: currentPhase,
    elapsedSeconds,
    remainingSeconds: Math.max(0, remainingSeconds),
  };
}

/**
 * Format seconds to MM:SS
 * @param {number} totalSeconds
 * @returns {string} "MM:SS"
 */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Example Usage:
 * 
 * import { startMagic16, stopMagic16, getMagic16Status, formatTime } from "../utils/Magic16Utils.js";
 * 
 * startMagic16({
 *   onUpdate: ({ phase, remainingSeconds }) => {
 *     console.log(phase, formatTime(remainingSeconds));
 *   },
 *   autoSpeak: true
 * });
 * 
 * // Stop session manually
 * stopMagic16();
 */
