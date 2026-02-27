/* ==========================================================
 * ManifiX — Voice Service
 * ----------------------------------------------------------
 * Responsibilities:
 * - Voice recording (STT)
 * - Text-to-Speech (TTS)
 * - Multi-language support
 * - Works with Magic16, Chat, Dashboard
 * - Professional, production-ready, privacy-first
 * ========================================================== */

import sttService from "./stt.service.js";
import ttsService from "./tts.service.js";

class VoiceService {
  constructor() {
    this.sttActive = false;
    this.language = "en-US"; // default language
    this.onResult = null; // callback for STT text
  }

  // ===============================
  // 🎤 START VOICE RECOGNITION
  // ===============================
  startSTT({ language = "en-US", onResult } = {}) {
    this.language = language;
    this.onResult = onResult;
    this.sttActive = true;

    sttService.init({
      language: this.language,
      onResult: (text) => {
        if (this.onResult) this.onResult(text);
      },
    });

    sttService.start();
    console.log("🎤 STT started");
  }

  // ===============================
  // ⏹ STOP VOICE RECOGNITION
  // ===============================
  stopSTT() {
    sttService.stop();
    this.sttActive = false;
    console.log("⏹ STT stopped");
  }

  // ===============================
  // 🗣️ SPEAK (TTS)
  // ===============================
  async speak(text, { language = "en-US", voice = null, rate = 1.0, pitch = 1.0 } = {}) {
    if (!text || !text.trim()) return;
    await ttsService.speak(text, { language, voice, rate, pitch });
  }

  // ===============================
  // 🔄 TOGGLE STT
  // ===============================
  toggleSTT({ language = "en-US", onResult } = {}) {
    if (this.sttActive) this.stopSTT();
    else this.startSTT({ language, onResult });
  }
}

// 🔒 SINGLETON INSTANCE
const voiceService = new VoiceService();
export default voiceService;
