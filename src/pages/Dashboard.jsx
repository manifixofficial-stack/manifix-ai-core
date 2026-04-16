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
  const [warning, setWarning] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

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
      setWarning("");
    } else {
      setMissionDone(false);
      setWarning("⚠️ MISS TODAY = STREAK RESETS TO 0");
    }
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
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${h}h ${m}m left`);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- CORE LOGIC ---------------- */

  const day = Math.min(user.streak, 16);
  const progress = Math.floor((day / 16) * 100);

  const getPhase = () => {
    if (day <= 4) return "🔥 Phase 1: Break Resistance";
    if (day <= 8) return "⚡ Phase 2: Build Control";
    if (day <= 12) return "🧠 Phase 3: Mental Discipline";
    if (day <= 16) return "👑 Phase 4: Identity Shift";
    return "🚀 Mastery";
  };

  const getTransformationMessage = () => {
    if (day <= 4) return "You’re defeating laziness.";
    if (day <= 8) return "Your focus is getting sharper.";
    if (day <= 12) return "Your mind is becoming controlled.";
    if (day <= 16) return "You are becoming unstoppable.";
    return "You are elite.";
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="dashboard">

      {/* TOP */}
      <header className="topbar">
        <span className="brand">ManifiX</span>
      </header>

      {/* 🔥 JOURNEY CARD */}
      <motion.div className="streak-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        <h1>Day {day} / 16</h1>
        <p className="phase">{getPhase()}</p>

        <div className="transform-bar">
          <div
            className="fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="percent">{progress}% Transformation</p>

        <p className="identity">
          💬 {getTransformationMessage()}
        </p>

        <AnimatePresence>
          {warning && (
            <motion.p className="warning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {warning}
            </motion.p>
          )}
        </AnimatePresence>

        {!missionDone && (
          <p className="timer">⏳ {timeLeft} TO SAVE YOUR STREAK</p>
        )}

      </motion.div>

      {/* 🎯 MISSION */}
      <motion.div className={`mission card ${missionDone ? "done" : ""}`}>
        <h3>🎯 Today’s Mission</h3>

        <p>
          {missionDone
            ? "✅ You showed discipline today."
            : "Finish today’s session. No excuses."}
        </p>
      </motion.div>

      {/* 🧠 IDENTITY PUSH */}
      <motion.div className="quote">
        {missionDone
          ? "You don’t skip. You execute."
          : "If you quit today, you restart from zero."}
      </motion.div>

      {/* 🚀 CTA */}
      <motion.div className="start-wrapper"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/app/magic16" className="start-btn">
          {missionDone ? "⚡ Go Again" : "🚀 Save My Streak"}
        </Link>
      </motion.div>

    </div>
  );
}
