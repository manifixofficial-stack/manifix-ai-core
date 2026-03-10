import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import "../../styles/magic16.css";

export default function Magic16Complete({
  averageScore = 0,
  streak = 0,
  onRestart,
  onShare
}) {

  useEffect(() => {
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <motion.div
      className="magic16-complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Title */}
      <h1 className="magic16-complete-title">
        🎉 Magic16 Complete!
      </h1>

      {/* Subtitle */}
      <p className="magic16-complete-subtitle">
        You completed your 16-minute wellness ritual.
      </p>

      {/* Stats */}
      <div className="magic16-complete-stats">

        <div className="magic16-stat">
          <span className="magic16-stat-label">Posture Score</span>
          <span className="magic16-stat-value">{averageScore}%</span>
        </div>

        <div className="magic16-stat">
          <span className="magic16-stat-label">Streak</span>
          <span className="magic16-stat-value">{streak} 🔥</span>
        </div>

      </div>

      {/* Motivational message */}
      <p className="magic16-complete-message">
        Great job staying consistent. Your body and mind thank you.
      </p>

      {/* Buttons */}
      <div className="magic16-complete-actions">

        <button
          className="magic16-btn-primary"
          onClick={onRestart}
        >
          Restart Magic16
        </button>

        <button
          className="magic16-btn-secondary"
          onClick={onShare}
        >
          Share Result
        </button>

      </div>
    </motion.div>
  );
}
