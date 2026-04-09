// src/pages/Magic16.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/magic16.css";
import logo from "../assets/logo.png";

export default function Magic16() {
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [progress, setProgress] = useState(0);

  /* ---------------- LOAD USER DATA ---------------- */
  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 0);
    setStreak(s);

    if (s > 50) setLevel("Zen Master");
    else if (s > 20) setLevel("Master");
    else if (s > 5) setLevel("Explorer");

    // fake daily progress (you can connect real later)
    const todayProgress = Number(localStorage.getItem("magic16_today") || 0);
    setProgress(todayProgress);
  }, []);

  /* ---------------- START SESSION ---------------- */
  const startSession = () => {
    navigate("/app/session");
  };

  return (
    <div className="magic16-container">

      {/* BACKGROUND EFFECT */}
      <div className="magic-bg-glow" />

      {/* HEADER */}
      <motion.div
        className="magic-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <img src={logo} alt="logo" className="magic-logo" />
        <h1>Magic16</h1>
        <p>AI Focus • Mind • Performance</p>
      </motion.div>

      {/* MAIN CARD */}
      <motion.div
        className="magic-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >

        {/* TIMER RING */}
        <div className="magic-timer">
          <div className="ring">
            <span>16</span>
            <small>MIN</small>
          </div>
        </div>

        {/* STATS */}
        <div className="magic-stats">

          <div className="stat-card">
            <h3>🔥 Streak</h3>
            <p>{streak} Days</p>
          </div>

          <div className="stat-card">
            <h3>🏆 Level</h3>
            <p>{level}</p>
          </div>

        </div>

        {/* DAILY PROGRESS */}
        <div className="magic-progress-section">
          <p>Today Progress</p>
          <div className="magic-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* FEATURES */}
        <div className="magic-features">
          <div>🧠 AI Pose Tracking</div>
          <div>🎯 Real-time Accuracy</div>
          <div>🔥 Gamified Score</div>
          <div>🔊 Voice Coaching</div>
        </div>

        {/* CTA BUTTON */}
        <motion.button
          className="magic-start-btn"
          onClick={startSession}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Magic16
        </motion.button>

      </motion.div>

      {/* FOOTER */}
      <motion.div
        className="magic-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>Consistency builds focus. Focus builds success.</p>
      </motion.div>

    </div>
  );
}
