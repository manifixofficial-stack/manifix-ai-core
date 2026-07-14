// src/components/DailyStreakBanner.jsx
//
// NEW FILE — shows a one-time-per-day popup when the player opens the
// game, displaying their login streak and a small bonus. Pairs with
// useDailyStreak.js (see that file for how the streak itself is tracked).
//
// INTEGRATION:
// Render this once near the root of your app (wherever App.jsx decides
// what screen to show — I don't have that file, so drop it in there),
// OUTSIDE of MapView/GameCanvas so it shows before the player even gets
// to the radar screen. Example:
//
//   function App() {
//     return (
//       <>
//         <DailyStreakBanner onClaim={(bonus) => {
//           // optional: send bonus to server to add to player's score
//           // once they join a room, e.g. store it in state and apply
//           // it in claim-character's payload.
//         }} />
//         {/* ...rest of your existing app screens... */}
//       </>
//     );
//   }
//
// The banner auto-hides itself if it's not a new day (isNewToday is
// false), so it's safe to always render — it just won't show anything
// visible most of the time.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyStreak } from '../hooks/useDailyStreak';

const GOLD = '#ffbe1a';
const GREEN = '#39ff88';

export default function DailyStreakBanner({ onClaim }) {
  const { streakCount, isNewToday, bonusPoints, streakBroken } = useDailyStreak();
  const [dismissed, setDismissed] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Reset local dismiss state if a genuinely new day's streak comes in
  // (guards against stale dismiss state across a long-lived tab).
  useEffect(() => {
    if (isNewToday) setDismissed(false);
  }, [isNewToday]);

  if (!isNewToday || dismissed) return null;

  function handleClaim() {
    setClaimed(true);
    onClaim?.(bonusPoints);
    setTimeout(() => setDismissed(true), 900);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={styles.card}
        >
          <div style={styles.streakIconRow}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
              const dayInCycle = ((streakCount - 1) % 7) + 1;
              const filled = day <= dayInCycle;
              return (
                <div
                  key={day}
                  style={{
                    ...styles.streakDay,
                    background: filled ? GOLD : 'rgba(255,255,255,0.06)',
                    color: filled ? '#000' : '#555',
                    boxShadow: filled ? `0 0 10px ${GOLD}` : 'none',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <h1 style={styles.title}>
            {streakBroken ? 'STREAK RESET — DAY 1' : `DAY ${streakCount} STREAK!`}
          </h1>

          <p style={styles.subtitle}>
            {streakBroken
              ? "You missed a day, but you're back — let's start a new streak!"
              : streakCount >= 7
              ? "You're on fire! Come back tomorrow to keep it going."
              : 'Come back tomorrow to keep your streak alive.'}
          </p>

          <div style={styles.bonusPill}>
            🎁 +{bonusPoints} BONUS POINTS
          </div>

          <button
            onClick={handleClaim}
            disabled={claimed}
            style={{
              ...styles.claimBtn,
              background: claimed ? '#2ecc71' : `linear-gradient(135deg, ${GOLD}, #d49f00)`,
              color: '#000',
              cursor: claimed ? 'default' : 'pointer',
            }}
          >
            {claimed ? '✓ CLAIMED' : 'CLAIM REWARD'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(4,5,8,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(6px)',
    padding: 20,
  },
  card: {
    width: 'min(92vw, 380px)',
    background: 'rgba(10,14,22,0.97)',
    border: `2px solid ${GOLD}`,
    borderRadius: 24,
    padding: '28px 24px',
    boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,190,26,0.15)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 14,
  },
  streakIconRow: { display: 'flex', gap: 6 },
  streakDay: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 900,
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    fontFamily: 'monospace',
    color: GOLD,
    margin: 0,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'sans-serif',
    margin: 0,
    lineHeight: 1.4,
  },
  bonusPill: {
    background: 'rgba(57,255,136,0.12)',
    border: `1.5px solid ${GREEN}`,
    color: GREEN,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 20,
  },
  claimBtn: {
    width: '100%',
    border: 'none',
    borderRadius: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
    padding: 16,
    marginTop: 6,
    letterSpacing: 0.5,
    transition: 'all 0.2s ease',
  },
};
