// src/hooks/useDailyStreak.js
//
// NEW FILE — tracks a daily login streak entirely on-device using
// localStorage. No server changes, no database, no account system
// needed — works immediately at zero extra cost, which matters since
// this project has no budget for backend storage right now.
//
// HOW IT WORKS:
// - First time ever opening the game: streak = 1, today marked as played.
// - Opens again the SAME day: streak stays the same, no change.
// - Opens the NEXT calendar day: streak += 1 (they kept the streak alive).
// - Opens after skipping a day or more: streak resets to 1 (streak broken).
//
// LIMITATION TO KNOW: because this is stored in the browser only, the
// streak is per-device/per-browser, not per-account — clearing browser
// data resets it, and it won't follow a player between their phone and
// a friend's phone. That's an acceptable tradeoff for a free, no-backend
// version. If you later add real player accounts, this same streak
// number could be moved to the server/database instead with minimal
// changes to the logic below.
//
// USAGE:
//   import { useDailyStreak } from '../hooks/useDailyStreak';
//   const { streakCount, isNewToday, bonusPoints } = useDailyStreak();

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'veggieGo_dailyStreak';

// Simple, capped bonus curve — grows with streak length but caps out so
// it never becomes a way to trivially inflate scores. Day 1-6 give a
// small ramping bonus; day 7+ (a full week) gives the max bonus and
// stays there, resetting the visible "milestone" feeling every 7 days.
function bonusForStreak(streakCount) {
  const dayInWeek = ((streakCount - 1) % 7) + 1; // 1..7, repeating every 7 days
  return dayInWeek * 2; // 2, 4, 6, 8, 10, 12, 14 points, then repeats
}

function getTodayDateString() {
  // Local calendar date (not UTC), so the streak lines up with the
  // player's actual day, not a server timezone.
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / msPerDay);
}

export function useDailyStreak() {
  const [streakCount, setStreakCount] = useState(1);
  const [isNewToday, setIsNewToday] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);

  useEffect(() => {
    const today = getTodayDateString();
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null; // corrupted/blocked storage — treat as first-ever visit
    }

    if (!saved || !saved.lastPlayedDate) {
      // First time ever opening the game.
      const fresh = { lastPlayedDate: today, streakCount: 1 };
      persist(fresh);
      setStreakCount(1);
      setPreviousStreak(0);
      setIsNewToday(true);
      return;
    }

    if (saved.lastPlayedDate === today) {
      // Already logged in today — no change, just report current state.
      setStreakCount(saved.streakCount);
      setPreviousStreak(saved.streakCount);
      setIsNewToday(false);
      return;
    }

    const gap = daysBetween(saved.lastPlayedDate, today);
    const nextStreak = gap === 1 ? saved.streakCount + 1 : 1;

    persist({ lastPlayedDate: today, streakCount: nextStreak });
    setStreakCount(nextStreak);
    setPreviousStreak(saved.streakCount);
    setIsNewToday(true);
  }, []);

  function persist(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable (private browsing, storage full, etc.)
      // — streak just won't persist across sessions; not fatal to the game.
    }
  }

  return {
    streakCount,
    isNewToday, // true only on the first check of a new calendar day
    previousStreak, // the streak count before today's update, for "streak broken" messaging
    bonusPoints: bonusForStreak(streakCount),
    streakBroken: isNewToday && previousStreak > 0 && streakCount === 1 && previousStreak > 1,
  };
}
