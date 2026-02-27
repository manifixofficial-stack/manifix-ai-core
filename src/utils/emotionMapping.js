/* ==========================================================
 * ManifiX — Emotion Mapping
 * ----------------------------------------------------------
 * Responsibilities:
 * - Standardize emotions detected via visionService
 * - Map to emojis for UI display
 * - Include intensity/weight for analytics or Magic16
 * - Supports multi-language friendly representation
 * ========================================================== */

export const EMOTION_MAP = {
  happy: {
    label: "Happy",
    emoji: "😊",
    intensity: 1,
    description: "Joyful, smiling, uplifted",
  },
  sad: {
    label: "Sad",
    emoji: "😢",
    intensity: -1,
    description: "Feeling down, melancholy, or low energy",
  },
  angry: {
    label: "Angry",
    emoji: "😡",
    intensity: -2,
    description: "Frustration, irritation, or upset",
  },
  surprised: {
    label: "Surprised",
    emoji: "😲",
    intensity: 0,
    description: "Unexpected, shocked, or amazed",
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    intensity: 0,
    description: "Calm, composed, balanced",
  },
  disgusted: {
    label: "Disgusted",
    emoji: "🤢",
    intensity: -2,
    description: "Repulsion or dislike",
  },
  fearful: {
    label: "Fearful",
    emoji: "😨",
    intensity: -1,
    description: "Anxiety, nervousness, or apprehension",
  },
  excited: {
    label: "Excited",
    emoji: "🤩",
    intensity: 2,
    description: "Thrilled, motivated, energized",
  },
  relaxed: {
    label: "Relaxed",
    emoji: "😌",
    intensity: 1,
    description: "Calm, peaceful, stress-free",
  },
  love: {
    label: "Love",
    emoji: "❤️",
    intensity: 2,
    description: "Affectionate, caring, warm",
  },
};

/**
 * Map raw vision emotion to emoji
 * @param {string} emotionKey - e.g., "happy", "sad"
 * @returns {string} emoji representation
 */
export function getEmotionEmoji(emotionKey) {
  return EMOTION_MAP[emotionKey]?.emoji || "❓";
}

/**
 * Map raw vision emotion to label
 * @param {string} emotionKey
 * @returns {string} label
 */
export function getEmotionLabel(emotionKey) {
  return EMOTION_MAP[emotionKey]?.label || "Unknown";
}

/**
 * Get intensity score for emotion
 * @param {string} emotionKey
 * @returns {number} intensity
 */
export function getEmotionIntensity(emotionKey) {
  return EMOTION_MAP[emotionKey]?.intensity || 0;
}

/**
 * Example Usage:
 * 
 * import { getEmotionEmoji, getEmotionLabel, getEmotionIntensity } from "../utils/emotionMapping.js";
 * 
 * const currentEmotion = "happy";
 * console.log(getEmotionEmoji(currentEmotion)); // 😊
 * console.log(getEmotionLabel(currentEmotion)); // Happy
 * console.log(getEmotionIntensity(currentEmotion)); // 1
 */
