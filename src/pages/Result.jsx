// src/pages/Result.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import "../styles/result.css";

export default function Result() {
  const location = useLocation();

  // Data from Magic16
  const data = location.state || {
    score: 120,
    accuracy: 85,
    time: "16:00",
    xpEarned: 50,
    streak: 4,
  };

  const { score, accuracy, time, xpEarned, streak } = data;

  // Confetti on load
  React.useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="result">

      {/* HEADER */}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="title"
      >
        🎉 Session Complete!
      </motion.h1>

      {/* SCORE CARD */}
      <motion.div 
        className="score-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2>{score} XP</h2>
        <p>+{xpEarned} XP earned</p>
      </motion.div>

      {/* STATS */}
      <div className="stats">

        <div className="stat">
          <h3>🎯 Accuracy</h3>
          <p>{accuracy}%</p>
        </div>

        <div className="stat">
          <h3>⏱ Time</h3>
          <p>{time}</p>
        </div>

        <div className="stat">
          <h3>🔥 Streak</h3>
          <p>{streak} days</p>
        </div>

      </div>

      {/* FEEDBACK */}
      <motion.div 
        className="feedback"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {accuracy > 90 && "🔥 Elite performance! You're unstoppable."}
        {accuracy <= 90 && accuracy > 70 && "💪 Great job! Keep improving."}
        {accuracy <= 70 && "⚡ Good effort! Consistency is key."}
      </motion.div>

      {/* SHARE */}
      <button
        className="share-btn"
        onClick={() => {
          navigator.share?.({
            title: "My ManifiX Result",
            text: `I scored ${score} XP in Magic16 🚀`,
          });
        }}
      >
        📤 Share Result
      </button>

      {/* ACTIONS */}
      <div className="actions">

        <Link to="/app/magic16" className="retry">
          🔁 Try Again
        </Link>

        <Link to="/app/dashboard" className="dashboard-btn">
          🏠 Back to Dashboard
        </Link>

      </div>

    </div>
  );
}
