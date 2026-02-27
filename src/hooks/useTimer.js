// src/hooks/useStreak.ts

import { useEffect, useState } from "react";

const STORAGE_KEY = "manifix_streak_data";

interface StreakData {
  lastDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

export default function useStreak() {
  const [streak, setStreak] = useState<StreakData>({
    lastDate: null,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setStreak(JSON.parse(stored));
    }
  }, []);

  const completeToday = () => {
    const today = new Date().toDateString();

    let { lastDate, currentStreak, longestStreak } = streak;

    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate === yesterday.toDateString()) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    const updated = {
      lastDate: today,
      currentStreak,
      longestStreak,
    };

    setStreak(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completeToday,
  };
}
