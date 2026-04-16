// src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";

export default function Dashboard() {

  const [user, setUser] = useState({
    streak: 0,
    xp: 0,
    level: 1,
  });

  const [missionDone, setMissionDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [danger, setDanger] = useState(false);
  const [levelUp, setLevelUp] = useState(false);

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    const xp = Number(localStorage.getItem("magic16_xp") || 0);
    const level = Number(localStorage.getItem("magic16_level") || 1);
    const lastDate = localStorage.getItem("magic16_last_date");

    const today = new Date().toDateString();

    setUser({ streak, xp, level });

    if (lastDate === today) {
      setMissionDone(true);
    } else {
      setMissionDone(false);
    }

    // LEVEL UP EFFECT
    const prevLevel = Number(localStorage.getItem("prev_level") || level);
    if (level > prevLevel) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 3000);
    }
    localStorage.setItem("prev_level", level);

  }, []);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Time’s up!");
        setDanger(true);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${h}h ${m}m`);

      // 🚨 DANGER MODE (last 3 hours)
      if (h <= 3) {
        setDanger(true);
      }

    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- CORE ---------------- */

  const day = Math.min(user.streak, 16);
  const progress = Math.floor((day / 16) * 100);

  const getIdentity = () => {
    if (day <= 4) return "Breaking Weakness";
    if (day <= 8) return "Building Discipline";
    if (day <= 12) return "Mental Control";
    if (day <= 16) return "Unstoppable Identity";
    return "Elite Mode";
  };

  const getEmotion = () => {
    if (missionDone) return "You proved discipline today.";
    if (danger) return "You are about to lose everything.";
    return "This is where most people quit.";
  };

  /* ---------------- UI ---------------- */

  return (
    <div className={`dashboard ${danger ? "danger" : ""}`}>

      {/* 🔥 LEVEL UP OVERLAY */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            className="levelup"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            🎉 LEVEL UP! → {user.level}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP */}
      <header className="topbar">
        <span className="brand">ManifiX</span>
        <div className="stats">
          <span>🔥 {user.streak}</span>
          <span>⚡ {user.xp} XP</span>
          <span>🏆 Lv.{user.level}</span>
        </div>
      </header>

      {/* 🧠 IDENTITY CARD */}
      <motion.div
        className="identity-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Day {day} / 16</h1>
        <p className="identity-title">{getIdentity()}</p>

        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        <p className="percent">{progress}% TRANSFORMED</p>

        <p className="emotion">{getEmotion()}</p>
      </motion.div>

      {/* ⏳ TIMER */}
      {!missionDone && (
        <motion.div
          className={`timer-card ${danger ? "danger-glow" : ""}`}
          animate={{ scale: danger ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          ⏳ {timeLeft} LEFT TO SAVE YOUR STREAK
        </motion.div>
      )}

      {/* 🎯 MISSION */}
      <motion.div
        className={`mission ${missionDone ? "done" : ""}`}
        whileHover={{ scale: 1.02 }}
      >
        <h3>🎯 Today’s Mission</h3>

        <p>
          {missionDone
            ? "✅ You don’t skip. You execute."
            : "Finish today’s session. No excuses."}
        </p>
      </motion.div>

      {/* 🧨 PRESSURE CARD */}
      {!missionDone && (
        <motion.div
          className="pressure"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠️ If you fail today → streak resets to 0
        </motion.div>
      )}

      {/* 🚀 CTA */}
      <motion.div
        className="cta-wrapper"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/app/magic16" className="cta-btn">
          {missionDone ? "⚡ Push Further" : "🔥 Save My Streak"}
        </Link>
      </motion.div>

    </div>
  );
}
