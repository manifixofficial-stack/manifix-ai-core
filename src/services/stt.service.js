/* ==========================================================
 * ManifiX — STT Service (Speech-to-Text)
 * ----------------------------------------------------------
 * Responsibilities:
 * - Capture user speech
 * - Convert to text in real-time
 * - Multi-language support
 * - Works on mobile, desktop, tablet
 * - Privacy-first: user consent required
 * ========================================================== */

class STTService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.language = "auto";
  }

  // ===============================
  // 🟢 INITIALIZE RECOGNITION
  // ===============================
  init({ language = "auto", onResult }) {
    this.language = language;
    this.onResultCallback = onResult;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error(
        "SpeechRecognition API not supported in this browser."
      );
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = language === "auto" ? navigator.language : language;

    this.recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (this.onResultCallback) {
        this.onResultCallback(transcript, event);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("STT error:", event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  // ===============================
  // 🎙️ START LISTENING
  // ===============================
  start() {
    if (!this.recognition) {
      throw new Error("STTService not initialized. Call init() first.");
    }

    this.recognition.start();
    this.isListening = true;
  }

  // ===============================
  // ⛔ STOP LISTENING
  // ===============================
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // ===============================
  // 🔄 RESTART LISTENING
  // ===============================
  restart() {
    this.stop();
    this.start();
  }

  // ===============================
  // 🌍 SET LANGUAGE
  // ===============================
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // ===============================
  // 🧹 CLEANUP
  // ===============================
  cleanup() {
    this.stop();
    this.recognition = null;
    this.onResultCallback = null;
  }

  // ===============================
  // 🔍 CHECK IF SUPPORTED
  // ===============================
  static isSupported() {
    return (
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );
  }
}

// 🔒 SINGLETON INSTANCE
const sttService = new STTService();
export default sttService;
