// src/pages/Result.jsx

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import "../styles/result.css";

export default function Result() {
  const location = useLocation();
  const cardRef = useRef();

  const data = location.state || {
    score: 120,
    accuracy: 85,
    time: "16:00",
    xpEarned: 50,
    streak: 4,
  };

  const { score, accuracy, time, xpEarned } = data;

  /* ---------------- STREAK SYSTEM ---------------- */
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const prev = Number(localStorage.getItem("magic16_streak") || 0);
    const newStreak = prev + 1;

    localStorage.setItem("magic16_streak", newStreak);
    setStreak(newStreak);
  }, []);

  /* ---------------- XP + LEVEL SYSTEM ---------------- */
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    let currentXP = Number(localStorage.getItem("magic16_xp") || 0);
    let currentLevel = Number(localStorage.getItem("magic16_level") || 1);

    currentXP += xpEarned;

    if (currentXP >= 100) {
      currentXP = currentXP - 100;
      currentLevel += 1;
      setLevelUp(true);

      setTimeout(() => setLevelUp(false), 3000);
    }

    localStorage.setItem("magic16_xp", currentXP);
    localStorage.setItem("magic16_level", currentLevel);

    setXp(currentXP);
    setLevel(currentLevel);
  }, []);

  /* ---------------- CONFETTI ---------------- */
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
    });
  }, []);

  /* ---------------- SHARE IMAGE ---------------- */
  const shareImage = async () => {
    const canvas = await html2canvas(cardRef.current);
    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/png")
    );

    if (!blob) return alert("Share failed");

    const file = new File([blob], "result.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "My ManifiX Result",
        text: `I scored ${score} XP 🚀`,
      });
    } else {
      alert("Sharing not supported on this device");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="result">

      {/* LEVEL UP EFFECT */}
      {levelUp && (
        <div className="level-up">🆙 LEVEL UP!</div>
      )}

      {/* MAIN CARD */}
      <motion.div
        ref={cardRef}
        className="result-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >

        <h1 className="title">🎉 Session Complete!</h1>

        {/* SCORE */}
        <div className="score">
          <h2>{score} XP</h2>
          <p>+{xpEarned} XP gained</p>
        </div>

        {/* XP BAR */}
        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{ width: `${xp}%` }}
          />
        </div>
        <p className="level">Level {level}</p>

        {/* STATS */}
        <div className="stats">

          <div>
            <h3>🎯 Accuracy</h3>
            <p>{accuracy}%</p>
          </div>

          <div>
            <h3>⏱ Time</h3>
            <p>{time}</p>
          </div>

          <div>
            <h3>🔥 Streak</h3>
            <p>{streak} days</p>
          </div>

        </div>

        {/* FEEDBACK */}
        <div className="feedback">
          {accuracy > 90 && "🔥 Elite performance!"}
          {accuracy > 70 && accuracy <= 90 && "💪 Great job!"}
          {accuracy <= 70 && "⚡ Keep improving!"}
        </div>

      </motion.div>

      {/* ACTIONS */}
      <div className="actions">

        <button className="share-btn" onClick={shareImage}>
          📸 Share Result
        </button>

        <Link to="/app/session" className="retry">
          🔁 Try Again
        </Link>

        <Link to="/app/dashboard" className="dashboard-btn">
          🏠 Dashboard
        </Link>

      </div>

    </div>
  );
}
