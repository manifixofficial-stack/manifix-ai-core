// src/services/achievements.service.js

// Mock database / API calls
const mockDB = {
  achievements: {},
};

/**
 * Fetch achievements for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getAchievements = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDB.achievements[userId] || []);
    }, 300); // simulate network delay
  });
};

/**
 * Unlock a new achievement for a user
 * @param {string} userId
 * @param {string} key
 * @returns {Promise<Object>} the new achievement
 */
export const unlockAchievementForUser = async (userId, key) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAchievement = { key, date: new Date().toISOString() };
      if (!mockDB.achievements[userId]) mockDB.achievements[userId] = [];
      mockDB.achievements[userId].push(newAchievement);
      resolve(newAchievement);
    }, 200); // simulate network delay
  });
};
