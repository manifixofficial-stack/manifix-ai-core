/* ==========================================================
 * ManifiX — AI Service (Brain Layer)
 * ----------------------------------------------------------
 * Responsibilities:
 * - Central AI orchestration
 * - Mode switching (chat, coach, love, focus, healing)
 * - Language awareness
 * - Safety + fallback intelligence
 * - Single source of AI behavior truth
 * ========================================================== */

import ChatService from "./chat.service.js";
import VoiceService from "./voice.service.js";
import VisionService from "./vision.service.js";
import Magic16Service from "./magic16.service.js";

class AIService {
  constructor() {
    this.currentMode = "companion"; // default
    this.language = "auto";
  }

  // ===============================
  // 🎭 AI MODES (PERSONALITY ENGINE)
  // ===============================
  setMode(mode) {
    const allowedModes = [
      "companion",   // loving, emotional
      "coach",       // motivation, success
      "focus",       // productivity
      "healer",      // calm, emotional care
      "ceo",         // sharp, business
      "friend",      // casual
    ];

    if (!allowedModes.includes(mode)) {
      console.warn("Unknown AI mode:", mode);
      return;
    }

    this.currentMode = mode;
  }

  getSystemPrompt() {
    switch (this.currentMode) {
      case "coach":
        return "You are a powerful life coach who motivates users to take action, discipline, and confidence.";

      case "focus":
        return "You are a calm productivity assistant helping users stay focused and clear-minded.";

      case "healer":
        return "You are a deeply empathetic, emotionally healing presence offering comfort and peace.";

      case "ceo":
        return "You are a sharp, visionary CEO advisor giving strategic, bold, and practical guidance.";

      case "friend":
        return "You are a friendly, casual best friend who chats naturally and playfully.";

      case "companion":
      default:
        return "You are ManifiX — a loving, emotionally intelligent AI companion who makes users feel safe, supported, and inspired.";
    }
  }

  // ===============================
  // 🧠 CORE AI CHAT
  // ===============================
  async chat({
    conversationId,
    message,
    language = "auto",
  }) {
    this.language = language;

    return ChatService.sendMessage({
      conversationId,
      userMessage: message,
      systemPrompt: this.getSystemPrompt(),
      language,
    });
  }

  // ===============================
  // 🎙️ VOICE → AI → VOICE
  // ===============================
  async voiceChat(audioBlob, conversationId) {
    const text = await VoiceService.speechToText(audioBlob);

    const aiReply = await this.chat({
      conversationId,
      message: text,
    });

    const audioReply = await VoiceService.textToSpeech(aiReply);

    return {
      text: aiReply,
      audio: audioReply,
    };
  }

  // ===============================
  // 👁️ VISION → AI GUIDANCE
  // ===============================
  async analyzeVision(imageFile) {
    return VisionService.analyze(imageFile);
  }

  // ===============================
  // 🧘 MAGIC16 (YOGA + MEDITATION)
  // ===============================
  async startMagic16(sessionData) {
    return Magic16Service.start(sessionData);
  }

  async stopMagic16() {
    return Magic16Service.stop();
  }

  // ===============================
  // 🌍 LANGUAGE CONTROL
  // ===============================
  setLanguage(language) {
    this.language = language;
  }

  getLanguage() {
    return this.language;
  }

  // ===============================
  // 🧹 RESET AI STATE
  // ===============================
  reset() {
    this.currentMode = "companion";
    this.language = "auto";
  }
}

// 🔒 SINGLETON (IMPORTANT)
const aiService = new AIService();
export default aiService;
