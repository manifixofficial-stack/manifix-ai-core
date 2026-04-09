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
  const [hasSession, setHasSession] = useState(false);
  const [completed, setCompleted] = useState(false);

  /* ---------------- LOAD USER DATA ---------------- */
  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 0);
    setStreak(s);

    if (s > 50) setLevel("Zen Master");
    else if (s > 20) setLevel("Master");
    else if (s > 5) setLevel("Explorer");

    /* -------- DAILY PROGRESS -------- */
    const todayKey = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem("magic16_daily") || "{}");

    const todayProgress = saved[todayKey]?.progress || 0;
    const inProgress = saved[todayKey]?.inProgress || false;
    const done = todayProgress >= 100;

    setProgress(todayProgress);
    setHasSession(inProgress);
    setCompleted(done);
  }, []);

  /* ---------------- START / RESUME ---------------- */
  const startSession = () => {
    const todayKey = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem("magic16_daily") || {});

    saved[todayKey] = {
      progress: progress,
      inProgress: true,
    };

    localStorage.setItem("magic16_daily", JSON.stringify(saved));

    navigate("/app/session");
  };

  /* ---------------- RESET DAY (OPTIONAL DEV) ---------------- */
  // localStorage.clear()

  /* ---------------- UI HELPERS ---------------- */
  const getButtonText = () => {
    if (completed) return "✅ Completed Today";
    if (hasSession) return "▶ Resume Session";
    return "Start Magic16";
  };

  const isDisabled = completed;

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

        {/* DAILY GOAL */}
        <div className="magic-progress-section">
          <div className="progress-header">
            <p>Daily Goal</p>
            <span>{Math.floor(progress)}% / 100%</span>
          </div>

          <div className="magic-progress-bar">
            <div
              className="magic-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="progress-label">
            {completed
              ? "🎉 Goal completed for today!"
              : hasSession
              ? "🔥 Continue your session"
              : "Start your 16-min focus ritual"}
          </p>
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
          className={`magic-start-btn ${completed ? "disabled" : ""}`}
          onClick={startSession}
          whileHover={!completed ? { scale: 1.08 } : {}}
          whileTap={!completed ? { scale: 0.95 } : {}}
          disabled={isDisabled}
        >
          {getButtonText()}
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
