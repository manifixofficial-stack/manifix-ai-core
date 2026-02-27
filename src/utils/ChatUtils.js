/* ==========================================================
 * ManifiX — Chat Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Manage chat messages (user & AI)
 * - Format timestamps
 * - Handle message history
 * - Typing indicators
 * - Multi-language / emoji-safe
 * - Integrates with ChatService
 * ========================================================== */

import chatService from "../services/chat.service.js";

/**
 * Format message timestamp to human-readable form
 * @param {number|Date} ts
 * @returns {string} e.g., "10:30 AM"
 */
export function formatTimestamp(ts) {
  const date = ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Add message to chat history safely
 * @param {Array} history - existing chat history
 * @param {Object} message - { role: "user" | "assistant", content: string }
 * @returns {Array} updated history
 */
export function addMessage(history, message) {
  if (!message || !message.content) return history;
  return [...history, message];
}

/**
 * Get latest N messages (context) for AI
 * @param {Array} history
 * @param {number} maxContext
 * @returns {Array}
 */
export function getContextMessages(history, maxContext = 12) {
  if (!history || history.length <= maxContext) return history;
  return history.slice(history.length - maxContext);
}

/**
 * Send user message to AI and update history
 * @param {Array} history - existing chat history
 * @param {string} userMessage - user input
 * @param {string} conversationId - optional
 * @returns {Promise<{updatedHistory: Array, aiReply: string}>}
 */
export async function sendMessage(history, userMessage, conversationId = "default") {
  if (!userMessage || !userMessage.trim()) {
    throw new Error("Empty message");
  }

  // Add user message
  const updatedHistory = addMessage(history, { role: "user", content: userMessage, timestamp: Date.now() });

  // Send to AI via chatService
  const aiReply = await chatService.sendMessage({
    conversationId,
    userMessage,
  });

  // Add AI reply
  const finalHistory = addMessage(updatedHistory, { role: "assistant", content: aiReply, timestamp: Date.now() });

  return { updatedHistory: finalHistory, aiReply };
}

/**
 * Check if AI is currently "typing" based on a promise
 * @param {Function} asyncFn
 * @param {Function} setTyping
 */
export async function handleTyping(asyncFn, setTyping) {
  if (typeof setTyping === "function") setTyping(true);
  try {
    const result = await asyncFn();
    return result;
  } finally {
    if (typeof setTyping === "function") setTyping(false);
  }
}

/* ==========================================================
 * Example Usage:
 * ==========================================================
 * import { sendMessage, getContextMessages, formatTimestamp } from "../utils/ChatUtils.js";
 * 
 * let chatHistory = [];
 * 
 * // Send user message
 * const { updatedHistory, aiReply } = await sendMessage(chatHistory, "Hello AI!");
 * chatHistory = updatedHistory;
 * console.log("AI replied:", aiReply);
 * 
 * // Format message time
 * const time = formatTimestamp(Date.now());
 * console.log("Message time:", time);
 * 
 * // Get latest 12 messages for context
 * const context = getContextMessages(chatHistory, 12);
 * console.log(context);
 * ========================================================== */
