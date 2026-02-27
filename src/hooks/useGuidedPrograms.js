import { useEffect, useState } from "react";
import { getAchievements, unlockAchievementForUser } from "../services/achievements.service";

/**
 * Custom hook to manage user achievements.
 * @param {string} userId - ID of the current user
 * @returns {object} achievements data, loading state, error, and unlock function
 */
export default function useAchievements(userId) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadAchievements = async () => {
      try {
        const data = await getAchievements(userId);
        if (isActive) setAchievements(data || []);
      } catch (err) {
        console.error("Error loading achievements:", err);
        if (isActive) setError("Failed to load achievements");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadAchievements();

    return () => {
      isActive = false; // cleanup to prevent memory leaks
    };
  }, [userId]);

  const unlockAchievement = async (key) => {
    try {
      const newAchievement = await unlockAchievementForUser(userId, key);
      setAchievements((prev) => [...prev, newAchievement]);
    } catch (err) {
      console.error("Error unlocking achievement:", err);
      // silent fail to preserve user experience
    }
  };

  return {
    achievements,
    loading,
    error,
    unlockAchievement,
  };
}
