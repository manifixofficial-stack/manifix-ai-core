// src/pages/Result.jsx

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import "../styles/Result.css";

export default function Result() {
  const location = useLocation();
  const cardRef = useRef();

  const data = location.state || {
    score: 120,
    accuracy: 85,
    time: "16:00",
    xpEarned: 50,
  };

  const { score, accuracy, time, xpEarned } = data;

  /* ---------------- STREAK SYSTEM (REAL) ---------------- */
  const [streak, setStreak] = useState(0);
  const [isNewStreak, setIsNewStreak] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("magic16_last_date");
    let prevStreak = Number(localStorage.getItem("magic16_streak") || 0);

    if (lastDate === today) {
      setStreak(prevStreak);
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate === yesterday.toDateString()) {
      prevStreak += 1;
      setIsNewStreak(true);
    } else {
      prevStreak = 1;
      setIsNewStreak(true);
    }

    localStorage.setItem("magic16_streak", prevStreak);
    localStorage.setItem("magic16_last_date", today);

    setStreak(prevStreak);
  }, []);

  /* ---------------- XP + LEVEL SYSTEM ---------------- */
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    let currentXP = Number(localStorage.getItem("magic16_xp") || 0);
    let currentLevel = Number(localStorage.getItem("magic16_level") || 1);

    currentXP += xpEarned;

    let leveledUp = false;

    while (currentXP >= 100) {
      currentXP -= 100;
      currentLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 3000);
    }

    localStorage.setItem("magic16_xp", currentXP);
    localStorage.setItem("magic16_level", currentLevel);

    setXp(currentXP);
    setLevel(currentLevel);
  }, [xpEarned]);

  /* ---------------- CONFETTI ---------------- */
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, []);

  /* ---------------- SHARE ---------------- */
  const shareImage = async () => {
    const canvas = await html2canvas(cardRef.current);
    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/png")
    );

    if (!blob) return alert("Failed to capture image");

    const file = new File([blob], "result.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "My ManifiX Result",
        text: `🔥 ${streak} Day Streak | ${score} XP | ${accuracy}% Accuracy`,
      });
    } else {
      alert("Sharing not supported on this device");
    }
  };

  /* ---------------- FEEDBACK ---------------- */
  const getFeedback = () => {
    if (accuracy > 90) return "🔥 Elite performance!";
    if (accuracy > 75) return "💪 Strong session!";
    if (accuracy > 60) return "👍 Good effort!";
    return "⚡ Keep improving!";
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="result">

      {/* LEVEL UP POPUP */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            className="level-up"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            🆙 LEVEL UP!
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CARD */}
      <motion.div
        ref={cardRef}
        className="result-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >

        <h1 className="title">🎉 Session Complete</h1>

        {/* STREAK */}
        <motion.h2
          className={`streak ${isNewStreak ? "glow" : ""}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          🔥 {streak} Day Streak
        </motion.h2>

        {/* SCORE */}
        <div className="score">
          <h2>{score} XP</h2>
          <p>+{xpEarned} XP gained</p>
        </div>

        {/* XP BAR */}
        <div className="xp-bar">
          <motion.div
            className="xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xp}%` }}
            transition={{ duration: 1 }}
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
            <p>{streak}</p>
          </div>

        </div>

        {/* FEEDBACK */}
        <motion.div
          className="feedback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {getFeedback()}
        </motion.div>

      </motion.div>

      {/* ACTIONS */}
      <div className="actions">

        <button className="share-btn" onClick={shareImage}>
          Share
        </button>

        <Link to="/app/session" className="retry">
          Try Again
        </Link>

        <Link to="/app/dashboard" className="dashboard-btn">
           Dashboard
        </Link>

      </div>

    </div>
  );
}
