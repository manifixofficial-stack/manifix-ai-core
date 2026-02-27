// src/services/health.service.js

/**
 * Fetch health tips for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getHealthTips = async (userId) => {
  // Mock data for now
  const tips = [
    { id: 1, tip: "Drink 8 glasses of water" },
    { id: 2, tip: "Walk 10,000 steps a day" },
    { id: 3, tip: "Sleep at least 7 hours" },
  ];

  return new Promise((resolve) => {
    setTimeout(() => resolve(tips), 200);
  });
};

/**
 * Optional: Unlock special health tip or reward
 */
export const unlockHealthTip = async (userId, tipId) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ userId, tipId, unlockedAt: new Date().toISOString() }), 200);
  });
};
