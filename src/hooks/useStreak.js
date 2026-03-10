import { useState, useEffect } from "react";

const STORAGE_KEY = "manifix_magic16_streak";

export default function useStreak() {

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Load streak data
  useEffect(() => {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {

      const data = JSON.parse(saved);

      setCurrentStreak(data.currentStreak || 0);
      setLongestStreak(data.longestStreak || 0);
      setLastCompletedDate(data.lastCompletedDate || null);

      const today = new Date().toDateString();

      if (data.lastCompletedDate === today) {
        setTodayCompleted(true);
      }

    }

  }, []);

  // Save streak data
  const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Call when Magic16 session finishes
  const completeToday = () => {

    const today = new Date().toDateString();

    if (todayCompleted) return;

    let newStreak = currentStreak;

    if (lastCompletedDate) {

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayStr = yesterday.toDateString();

      if (lastCompletedDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastCompletedDate !== today) {
        newStreak = 1;
      }

    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, longestStreak);

    const updated = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today
    };

    setCurrentStreak(newStreak);
    setLongestStreak(newLongest);
    setLastCompletedDate(today);
    setTodayCompleted(true);

    saveData(updated);
  };

  // Reset streak manually (optional)
  const resetStreak = () => {

    const reset = {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    };

    setCurrentStreak(0);
    setLongestStreak(0);
    setLastCompletedDate(null);
    setTodayCompleted(false);

    saveData(reset);
  };

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
    todayCompleted,
    completeToday,
    resetStreak
  };
}
