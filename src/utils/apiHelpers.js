/* ==========================================================
 * ManifiX — API Helpers
 * ----------------------------------------------------------
 * Responsibilities:
 * - Centralized API request handling
 * - Supports GET, POST, PUT, DELETE
 * - Handles JSON, error parsing, timeout, auth headers
 * - Works seamlessly with Supabase, OpenRouter, backend APIs
 * ========================================================== */

import authService from "../services/auth.service.js";
import logger from "./logger.js";

const DEFAULT_TIMEOUT = 15000; // 15 seconds

class APIHelpers {
  /**
   * Make a fetch request
   * @param {string} url - API endpoint
   * @param {object} options - fetch options
   * @param {boolean} withAuth - add Authorization header
   * @returns {Promise<object>} JSON response
   */
  async request(url, options = {}, withAuth = true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Add auth token if available
    if (withAuth) {
      const token = await authService.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`API request failed: ${url}`, { status: response.status, body: errorText });
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json().catch(() => null);
      return data;
    } catch (error) {
      clearTimeout(timeout);
      logger.error(`API request exception: ${url}`, { error: error.message });
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} url
   * @param {boolean} withAuth
   * @returns {Promise<object>}
   */
  async get(url, withAuth = true) {
    return this.request(url, { method: "GET" }, withAuth);
  }

  /**
   * POST request
   * @param {string} url
   * @param {object} body
   * @param {boolean} withAuth
   * @returns {Promise<object>}
   */
  async post(url, body = {}, withAuth = true) {
    return this.request(url, { method: "POST", body: JSON.stringify(body) }, withAuth);
  }

  /**
   * PUT request
   * @param {string} url
   * @param {object} body
   * @param {boolean} withAuth
   * @returns {Promise<object>}
   */
  async put(url, body = {}, withAuth = true) {
    return this.request(url, { method: "PUT", body: JSON.stringify(body) }, withAuth);
  }

  /**
   * DELETE request
   * @param {string} url
   * @param {boolean} withAuth
   * @returns {Promise<object>}
   */
  async delete(url, withAuth = true) {
    return this.request(url, { method: "DELETE" }, withAuth);
  }
}

// 🔒 Singleton instance
const apiHelpers = new APIHelpers();
export default apiHelpers;

/* ===============================
 * Example Usage:
 * ===============================
 * import apiHelpers from "./apiHelpers.js";
 * 
 * // GET request
 * const users = await apiHelpers.get("/api/users");
 * 
 * // POST request
 * const newVibe = await apiHelpers.post("/api/vibes", { content: "Feeling amazing!" });
 * 
 * // PUT request
 * const updatedManifest = await apiHelpers.put("/api/manifest/123", { title: "New Goal" });
 * 
 * // DELETE request
 * await apiHelpers.delete("/api/vibes/456");
 * =============================== */
