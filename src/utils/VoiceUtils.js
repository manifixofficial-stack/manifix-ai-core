/* ==========================================================
 * ManifiX — Voice Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Voice recording (STT)
 * - Text-to-Speech (TTS)
 * - Multi-language support
 * - Integrates with voiceService
 * ========================================================== */

import voiceService from "../services/voice.service.js";

/**
 * Start voice recording
 * @param {Object} options - { language, onResult }
 */
export function startVoiceRecording({ language = "en-US", onResult } = {}) {
  voiceService.startSTT({ language, onResult });
}

/**
 * Stop voice recording
 */
export function stopVoiceRecording() {
  voiceService.stopSTT();
}

/**
 * Toggle voice recording
 * @param {Object} options - { language, onResult }
 */
export function toggleVoiceRecording(options = {}) {
  voiceService.toggleSTT(options);
}

/**
 * Speak text using TTS
 * @param {string} text
 * @param {Object} options - { language, voice, rate, pitch }
 */
export async function speakText(text, options = {}) {
  if (!text || !text.trim()) return;
  await voiceService.speak(text, options);
}

/**
 * Example Usage:
 * 
 * import { startVoiceRecording, stopVoiceRecording, speakText } from "../utils/VoiceUtils.js";
 * 
 * startVoiceRecording({
 *   language: "en-US",
 *   onResult: (text) => console.log("STT Result:", text)
 * });
 * 
 * stopVoiceRecording();
 * 
 * speakText("Hello, welcome to ManifiX!", { language: "en-US", rate: 1, pitch: 1 });
 */
