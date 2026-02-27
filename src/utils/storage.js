/* ==========================================================
 * ManifiX — Storage Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Abstracts localStorage and sessionStorage
 * - Handles JSON objects safely
 * - Provides default values and error handling
 * - Mobile + Web ready, professional, high performance
 * ========================================================== */

class StorageService {
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (object, array, string, number)
   */
  saveLocal(key, value) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error(`Storage saveLocal error for key "${key}":`, error);
    }
  }

  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Parsed value or default
   */
  loadLocal(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Storage loadLocal error for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Remove key from localStorage
   * @param {string} key - Storage key
   */
  removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage removeLocal error for key "${key}":`, error);
    }
  }

  /**
   * Save data to sessionStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  saveSession(key, value) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      sessionStorage.setItem(key, data);
    } catch (error) {
      console.error(`Storage saveSession error for key "${key}":`, error);
    }
  }

  /**
   * Load data from sessionStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Parsed value or default
   */
  loadSession(key, defaultValue = null) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Storage loadSession error for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Clear all storage (local + session)
   */
  clearAll() {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error("Storage clearAll error:", error);
    }
  }
}

// 🔒 Singleton instance
const storageService = new StorageService();
export default storageService;

/* ===============================
 * Example Usage:
 * ===============================
 * // Save vibe feed
 * storageService.saveLocal("vibeFeed", vibesArray);
 * 
 * // Load vibe feed
 * const vibes = storageService.loadLocal("vibeFeed", []);
 * 
 * // Save Magic16 session
 * storageService.saveSession("magic16Session", { phase: "meditation", remaining: 480 });
 * 
 * // Remove a key
 * storageService.removeLocal("tempData");
 * 
 * // Clear all
 * storageService.clearAll();
 * =============================== */
