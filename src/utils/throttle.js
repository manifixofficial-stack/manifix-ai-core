/* ==========================================================
 * ManifiX — throttle Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Limit function execution frequency
 * - Ideal for realtime camera updates, Magic16, chat streaming, scroll events
 * - Mobile + Web ready, professional, high performance
 * ========================================================== */

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds (default: 200ms)
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 200) {
  let lastFunc;
  let lastRan;

  return function (...args) {
    const context = this;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/* ===============================
 * Example Usage:
 * ===============================
 * // Vision camera updates (face/posture/emotion)
 * const handleVisionUpdate = throttle((data) => updateVisionUI(data), 100);
 * 
 * // Magic16 timer UI refresh
 * const refreshMagic16 = throttle(() => updateTimerUI(), 200);
 * 
 * // Chat streaming / typing status
 * const sendTypingStatus = throttle(() => apiSendTyping(), 300);
 * 
 * // Window scroll events
 * window.addEventListener("scroll", throttle(() => handleScroll(), 150));
 * =============================== */
