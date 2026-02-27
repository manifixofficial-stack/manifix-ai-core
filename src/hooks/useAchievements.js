// src/hooks/useAchievements.js
import { useEffect, useState } from "react";
import { getAchievements } from "../services/achievements.service";

/**
 * Hook to fetch and manage user achievements
 */
export function useAchievements(userId) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadAchievements = async () => {
      try {
        const data = await getAchievements(userId);
        if (active) setAchievements(data || []);
      } catch (err) {
        if (active) setError("Failed to load achievements");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAchievements();

    return () => {
      active = false;
    };
  }, [userId]);

  return { achievements, loading, error };
}
