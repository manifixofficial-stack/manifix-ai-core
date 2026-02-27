/* ==========================================================
 * ManifiX — Magic16 Service
 * ----------------------------------------------------------
 * Magic16 = 8 min Yoga + 8 min Meditation
 *
 * Responsibilities:
 * - Session orchestration (Yoga → Meditation)
 * - Timing & flow control
 * - User state awareness (calm, active, distracted)
 * - Step-by-step intelligent guidance
 * - Works with Vision, Voice, Device & AI services
 *
 * Privacy-first • Non-medical • Safe by design
 * ========================================================== */

import deviceService from "./device.service.js";
import voiceService from "./voice.service.js";
import aiService from "./ai.service.js";

const YOGA_DURATION = 8 * 60 * 1000; // 8 minutes
const MEDITATION_DURATION = 8 * 60 * 1000; // 8 minutes

class Magic16Service {
  constructor() {
    this.sessionActive = false;
    this.phase = null; // "yoga" | "meditation"
    this.timer = null;
    this.onUpdate = null;
  }

  // ===============================
  // 🧘 START MAGIC16 SESSION
  // ===============================
  async start({ onUpdate }) {
    if (this.sessionActive) return;

    this.sessionActive = true;
    this.onUpdate = onUpdate;
    this.phase = "yoga";

    this._emit("Magic16 started 🌸 Breathe and prepare");

    await voiceService.speak(
      "Welcome to Magic sixteen. Let us begin with eight minutes of gentle yoga. Breathe deeply and follow my voice."
    );

    this._startYoga();
  }

  // ===============================
  // 🧘‍♀️ YOGA PHASE (8 MIN)
  // ===============================
  async _startYoga() {
    this.phase = "yoga";
    this._emit("Yoga phase started 🧘‍♀️");

    const yogaSteps = await aiService.generateYogaSteps({
      level: "beginner",
      duration: 8,
    });

    for (const step of yogaSteps) {
      if (!this.sessionActive) return;

      this._emit(step.text);
      await voiceService.speak(step.voice);

      // Gentle pause between steps
      await this._sleep(step.duration || 20000);
    }

    this._transitionToMeditation();
  }

  // ===============================
  // 🌙 TRANSITION
  // ===============================
  async _transitionToMeditation() {
    if (!this.sessionActive) return;

    this._emit("Yoga complete ✨ Transitioning to meditation");

    await voiceService.speak(
      "Beautiful. Now slowly sit or lie down. We move into eight minutes of deep meditation."
    );

    this._startMeditation();
  }

  // ===============================
  // 🧘‍♂️ MEDITATION PHASE (8 MIN)
  // ===============================
  async _startMeditation() {
    this.phase = "meditation";
    this._emit("Meditation phase started 🌙");

    const meditationGuide = await aiService.generateMeditationGuide({
      style: "calm",
      duration: 8,
    });

    for (const step of meditationGuide) {
      if (!this.sessionActive) return;

      this._emit(step.text);
      await voiceService.speak(step.voice);

      await this._sleep(step.duration || 30000);
    }

    this._completeSession();
  }

  // ===============================
  // ✅ COMPLETE SESSION
  // ===============================
  async _completeSession() {
    if (!this.sessionActive) return;

    this.sessionActive = false;
    this.phase = null;

    this._emit("Magic16 complete ✨ You are aligned, calm, and powerful");

    await voiceService.speak(
      "Magic sixteen is complete. Carry this calm, clarity, and confidence into your day."
    );
  }

  // ===============================
  // ⛔ STOP SESSION
  // ===============================
  async stop() {
    if (!this.sessionActive) return;

    this.sessionActive = false;
    this.phase = null;
    clearTimeout(this.timer);

    this._emit("Magic16 stopped");

    await voiceService.speak(
      "Magic sixteen session stopped. You can return anytime."
    );
  }

  // ===============================
  // 🔁 STATUS
  // ===============================
  getStatus() {
    return {
      active: this.sessionActive,
      phase: this.phase,
    };
  }

  // ===============================
  // 🔔 UI CALLBACK
  // ===============================
  _emit(message) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({
        phase: this.phase,
        message,
        timestamp: Date.now(),
      });
    }
  }

  // ===============================
  // ⏱️ UTILITY
  // ===============================
  _sleep(ms) {
    return new Promise((resolve) => {
      this.timer = setTimeout(resolve, ms);
    });
  }
}

// 🔒 SINGLETON INSTANCE
const magic16Service = new Magic16Service();
export default magic16Service;
