import { useState, useEffect } from "react";
import { getHealthTips, unlockHealthTip } from "../services/health.service"; // <- named import

export default function useHealthTips(userId) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadTips = async () => {
      try {
        const data = await getHealthTips(userId);
        if (active) setTips(data || []);
      } catch {
        if (active) setError("Failed to load health tips");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTips();

    return () => { active = false; };
  }, [userId]);

  const unlockTip = async (tipId) => {
    try {
      const newTip = await unlockHealthTip(userId, tipId);
      setTips(prev => [...prev, newTip]);
    } catch {}
  };

  return { tips, loading, error, unlockTip };
}
