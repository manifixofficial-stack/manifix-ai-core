/* ==========================================================
 * ManifiX — Vibe Utilities
 * ----------------------------------------------------------
 * Responsibilities:
 * - Handle Vibe feed (user posts, stories)
 * - Create / edit / delete vibes
 * - Manage privacy (public/private)
 * - Sort and filter vibes
 * - Format timestamps and user display
 * - Integrates with vibeService
 * ========================================================== */

import vibeService from "../services/vibe.service.js";

/**
 * Format timestamp for Vibe feed
 * @param {number|Date} ts
 * @returns {string} e.g., "Jan 27, 2026 14:35"
 */
export function formatVibeTimestamp(ts) {
  const date = ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Add new vibe
 * @param {Object} vibe - { content: string, userId, privacy: "public" | "private", media? }
 * @returns {Promise<Object>} - saved vibe
 */
export async function createVibe(vibe) {
  if (!vibe || !vibe.content) throw new Error("Vibe content cannot be empty");

  const newVibe = {
    content: vibe.content,
    user_id: vibe.userId,
    privacy: vibe.privacy || "public",
    media: vibe.media || null,
    created_at: new Date().toISOString(),
  };

  const savedVibe = await vibeService.createVibe(newVibe);
  return savedVibe;
}

/**
 * Fetch vibes for feed
 * @param {Object} options - { userId, privacy: "public" | "private" | "all", limit }
 * @returns {Promise<Array>}
 */
export async function fetchVibes(options = {}) {
  const { userId = null, privacy = "public", limit = 50 } = options;
  const vibes = await vibeService.getFeed({ userId, privacy, limit });

  // Sort newest first
  return vibes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Filter vibes by user
 * @param {Array} vibes
 * @param {string} userId
 * @returns {Array}
 */
export function filterVibesByUser(vibes, userId) {
  return vibes.filter((v) => v.user_id === userId);
}

/**
 * Toggle privacy of a vibe
 * @param {string} vibeId
 * @param {"public"|"private"} privacy
 * @returns {Promise<Object>} updated vibe
 */
export async function toggleVibePrivacy(vibeId, privacy) {
  if (!vibeId) throw new Error("Vibe ID is required");
  const updated = await vibeService.updatePrivacy(vibeId, privacy);
  return updated;
}

/**
 * Format vibe for display
 * @param {Object} vibe
 * @returns {Object} formatted vibe with displayTime
 */
export function formatVibeForDisplay(vibe) {
  return {
    ...vibe,
    displayTime: formatVibeTimestamp(vibe.created_at),
  };
}

/* ==========================================================
 * Example Usage:
 * ==========================================================
 * import { createVibe, fetchVibes, toggleVibePrivacy, formatVibeForDisplay } from "../utils/VibeUtils.js";
 * 
 * // Create a vibe
 * const newVibe = await createVibe({ content: "Feeling amazing today!", userId: "user123", privacy: "public" });
 * 
 * // Fetch feed
 * const vibes = await fetchVibes({ privacy: "public", limit: 20 });
 * 
 * // Toggle privacy
 * await toggleVibePrivacy(newVibe.id, "private");
 * 
 * // Format for display
 * const formatted = vibes.map(formatVibeForDisplay);
 * console.log(formatted);
 * ========================================================== */
