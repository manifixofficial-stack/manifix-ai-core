/* ==========================================================
 * ManifiX — debounce Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Delay function execution to prevent excessive calls
 * - Ideal for search, input, STT, chat typing, Magic16 updates
 * - Mobile + Web ready, lightweight, professional
 * ========================================================== */

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds (default: 300ms)
 * @param {boolean} immediate - Execute immediately on first call (default: false)
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;

  return function (...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/* ===============================
 * Example Usage:
 * ===============================
 * // Search input
 * const handleSearch = debounce((query) => {
 *   console.log("Searching for:", query);
 * }, 400);
 * 
 * searchInput.addEventListener("input", (e) => handleSearch(e.target.value));
 * 
 * // Chat typing detection
 * const handleTyping = debounce(() => sendTypingStatus(), 200);
 * 
 * // Magic16 UI updates
 * const updateTimerUI = debounce(() => refreshTimerUI(), 100);
 * =============================== */
