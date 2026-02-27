/* ==========================================================
 * ManifiX — Logger & Analytics Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Centralized logging for errors, info, debug, analytics
 * - Tracks AI chat, Magic16, Vibe, Vision, and user actions
 * - Supports mobile & web
 * - Can integrate with external analytics (Supabase, OpenRouter, custom API)
 * ========================================================== */

import storageService from "./storage.js";

class LoggerService {
  constructor() {
    this.logs = []; // local log cache
    this.maxLogs = 500; // prevent memory overload
  }

  /**
   * Log info
   * @param {string} message
   * @param {object} details
   */
  info(message, details = {}) {
    this._log("INFO", message, details);
  }

  /**
   * Log warning
   * @param {string} message
   * @param {object} details
   */
  warn(message, details = {}) {
    this._log("WARN", message, details);
  }

  /**
   * Log error
   * @param {string} message
   * @param {object} details
   */
  error(message, details = {}) {
    this._log("ERROR", message, details);
  }

  /**
   * Internal logging handler
   * @param {string} level
   * @param {string} message
   * @param {object} details
   */
  _log(level, message, details) {
    const timestamp = new Date().toISOString();
    const entry = { level, message, details, timestamp };

    // Console output
    if (level === "ERROR") console.error(`[${level}] ${timestamp} →`, message, details);
    else if (level === "WARN") console.warn(`[${level}] ${timestamp} →`, message, details);
    else console.log(`[${level}] ${timestamp} →`, message, details);

    // Save to local cache
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    // Optional: persist logs to localStorage
    storageService.saveLocal("manifiXLogs", this.logs);
  }

  /**
   * Get all logs
   * @returns {Array} logs
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    storageService.removeLocal("manifiXLogs");
  }

  /**
   * Track custom analytics event
   * @param {string} event
   * @param {object} details
   */
  trackEvent(event, details = {}) {
    this.info(`Analytics Event: ${event}`, details);

    // Optional: push to backend / Supabase / external analytics
    // fetch("/api/analytics", { method: "POST", body: JSON.stringify({ event, details, timestamp: new Date().toISOString() }) });
  }
}

// 🔒 Singleton instance
const logger = new LoggerService();
export default logger;

/* ===============================
 * Example Usage:
 * ===============================
 * import logger from "./logger.js";
 * 
 * // Debug info
 * logger.info("User loaded dashboard", { userId: "1234" });
 * 
 * // Warning
 * logger.warn("Magic16 timer skipped frame", { phase: "meditation" });
 * 
 * // Error
 * logger.error("Chat API failed", { input: "Hello", errorCode: 500 });
 * 
 * // Analytics
 * logger.trackEvent("vibe_created", { userId: "1234", vibeId: "v5678" });
 * 
 * // Get logs
 * const logs = logger.getAllLogs();
 * 
 * // Clear logs
 * logger.clearLogs();
 * =============================== */
