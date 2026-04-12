// src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";

export default function Dashboard() {

  /* ---------------- USER STATE ---------------- */
  const [user, setUser] = useState({
    streak: 0,
    xp: 0,
    level: 1,
  });

  const [warning, setWarning] = useState("");
  const [missionDone, setMissionDone] = useState(false);
  const [xpToNext, setXpToNext] = useState(100);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    const xp = Number(localStorage.getItem("magic16_xp") || 0);
    const level = Number(localStorage.getItem("magic16_level") || 1);
    const lastDate = localStorage.getItem("magic16_last_date");

    const today = new Date().toDateString();

    setUser({ streak, xp, level });

    /* ---------------- STREAK WARNING ---------------- */
    if (lastDate !== today) {
      setWarning("⚠️ Don't break your streak today!");
      setMissionDone(false);
    } else {
      setWarning("");
      setMissionDone(true);
    }

    /* ---------------- XP CALC ---------------- */
    setXpToNext(100 - (xp % 100));

  }, []);

  const progress = (user.xp % 100);

  /* ---------------- UI ---------------- */
  return (
    <div className="dashboard">

      {/* NAVBAR */}
      <header className="topbar">
        <span className="brand">ManifiX</span>
      </header>

      {/* 🔥 STREAK SECTION (MAIN HOOK) */}
      <motion.div
        className="streak-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h1>🔥 {user.streak} Day Streak</h1>

        <AnimatePresence>
          {warning && (
            <motion.p
              className="warning"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {warning}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 🎯 DAILY MISSION */}
      <motion.div
        className={`mission card ${missionDone ? "done" : ""}`}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3>🎯 Today’s Mission</h3>
        <p>
          {missionDone
            ? "✅ Completed — Great job!"
            : "Complete 1 Magic16 session"}
        </p>
      </motion.div>

      {/* 📊 XP + LEVEL */}
      <motion.div
        className="xp card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3>Level {user.level}</h3>

        <div className="progress">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        <p>{xpToNext} XP to next level</p>
      </motion.div>

      {/* 📅 WEEK TRACKER */}
      <motion.div
        className="week card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3>Weekly Progress</h3>
        <div className="days">
          {[...Array(7)].map((_, i) => (
            <span key={i} className={i < user.streak % 7 ? "done" : ""}>
              {["S","M","T","W","T","F","S"][i]}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 🧠 MOTIVATION */}
      <motion.div
        className="quote"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        💬 {warning ? "Don't lose your streak!" : "You're on fire 🔥"}
      </motion.div>

      {/* 🚀 MAIN CTA (MOST IMPORTANT) */}
      <motion.div
        className="start-wrapper"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/app/magic16" className="start-btn">
          {missionDone ? "⚡ Do Another Session" : "🚀 Continue Streak"}
        </Link>
      </motion.div>

    </div>
  );
}
