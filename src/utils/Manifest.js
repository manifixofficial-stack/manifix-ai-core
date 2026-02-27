/* ==========================================================
 * ManifiX — Manifest Utility
 * ----------------------------------------------------------
 * Responsibilities:
 * - Store user manifests
 * - Add new manifest items
 * - Retrieve all manifests
 * - Simple in-memory storage for MVP
 * ========================================================== */

const Manifest = {
  list: [],

  /**
   * Add a new manifest item
   * @param {Object} item - { id, title, description, date }
   */
  add(item) {
    if (!item.id) {
      item.id = Date.now().toString(); // generate simple unique ID
    }
    this.list.push(item);
    console.log(`Manifest added ✅: ${item.title}`);
  },

  /**
   * Get all manifest items
   * @returns {Array} list of manifests
   */
  getAll() {
    return this.list;
  },

  /**
   * Get a single manifest by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  getById(id) {
    return this.list.find((item) => item.id === id) || null;
  },

  /**
   * Delete a manifest by ID
   * @param {string} id 
   */
  remove(id) {
    this.list = this.list.filter((item) => item.id !== id);
    console.log(`Manifest removed ❌ ID: ${id}`);
  },

  /**
   * Clear all manifests
   */
  clear() {
    this.list = [];
    console.log("All manifests cleared 🗑️");
  },
};

// 🔒 Export singleton
export default Manifest;
