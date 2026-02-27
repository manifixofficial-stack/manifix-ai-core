/* ==========================================================
 * ManifiX — TTS Service (Text-to-Speech)
 * ----------------------------------------------------------
 * Responsibilities:
 * - Convert text to natural-sounding speech
 * - Multi-language & multi-voice support
 * - Works on mobile, desktop, tablet
 * - Emotion & tone control (optional)
 * - Fully privacy-first
 * ========================================================== */

class TTSService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.voice = null;
    this.rate = 1;      // speed
    this.pitch = 1;     // tone
    this.volume = 1;    // volume
    this.language = "en-US";
  }

  // ===============================
  // 🔍 INIT & LOAD VOICES
  // ===============================
  init({ language = "en-US", voiceName = null, rate = 1, pitch = 1, volume = 1 } = {}) {
    if (!this.synth) throw new Error("TTS not supported in this browser");

    this.language = language;
    this.rate = rate;
    this.pitch = pitch;
    this.volume = volume;

    this.voices = this.synth.getVoices();

    if (voiceName) {
      const selected = this.voices.find(v => v.name === voiceName && v.lang.startsWith(language));
      if (selected) this.voice = selected;
    }

    if (!this.voice && this.voices.length > 0) {
      // Default to first voice matching language
      this.voice = this.voices.find(v => v.lang.startsWith(language)) || this.voices[0];
    }

    // Some browsers need async load
    if (this.voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        if (!this.voice) this.voice = this.voices[0];
      };
    }
  }

  // ===============================
  // 🎙️ SPEAK TEXT
  // ===============================
  speak(text, { language, voiceName, rate, pitch, volume } = {}) {
    if (!this.synth) return;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = language || this.language;
    utterance.rate = rate || this.rate;
    utterance.pitch = pitch || this.pitch;
    utterance.volume = volume || this.volume;

    if (voiceName) {
      const selectedVoice = this.voices.find(v => v.name === voiceName);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else if (this.voice) {
      utterance.voice = this.voice;
    }

    return new Promise((resolve, reject) => {
      utterance.onend = resolve;
      utterance.onerror = (err) => reject(err);
      this.synth.speak(utterance);
    });
  }

  // ===============================
  // ⏸️ PAUSE
  // ===============================
  pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  // ===============================
  // ▶️ RESUME
  // ===============================
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  // ===============================
  // ⛔ CANCEL
  // ===============================
  cancel() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  // ===============================
  // 🌍 LIST AVAILABLE VOICES
  // ===============================
  getAvailableVoices() {
    return this.voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService,
    }));
  }

  // ===============================
  // ✅ CHECK SUPPORT
  // ===============================
  static isSupported() {
    return "speechSynthesis" in window;
  }
}

// 🔒 SINGLETON INSTANCE
const ttsService = new TTSService();
export default ttsService;
