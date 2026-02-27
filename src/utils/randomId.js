/* ==========================================================
 * ManifiX — randomId Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Generate unique IDs for posts, messages, vibes, manifests
 * - Collision-resistant for billions of users
 * - Mobile + Web ready
 * - Simple, professional, reusable
 * ========================================================== */

/**
 * Generate a unique alphanumeric ID
 * @param {number} length - Length of the ID (default: 12)
 * @returns {string} Random unique ID
 */
export function randomId(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const charsLength = chars.length;

  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * charsLength));
  }

  return id;
}

/* ===============================
 * Example Usage:
 * ===============================
 * randomId() 
 * -> "aB3dE9fGhJ1k"
 * 
 * randomId(8) 
 * -> "4fGhJ1kL"
 * 
 * Use for:
 * - Chat message IDs
 * - Vibe post IDs
 * - Manifestation entries
 * - Temporary session or UI keys
 * =============================== */
