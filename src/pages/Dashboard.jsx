import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";

export default function Dashboard() {

  /* ---------------- STATE ---------------- */
  const [user, setUser] = useState({
    streak: 0,
    xp: 0,
    level: 1,
  });

  const [warning, setWarning] = useState("");
  const [missionDone, setMissionDone] = useState(false);
  const [xpToNext, setXpToNext] = useState(100);
  const [timeLeft, setTimeLeft] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    const xp = Number(localStorage.getItem("magic16_xp") || 0);
    const level = Number(localStorage.getItem("magic16_level") || 1);
    const lastDate = localStorage.getItem("magic16_last_date");

    const today = new Date().toDateString();

    setUser({ streak, xp, level });

    /* ---------------- MISSION STATUS ---------------- */
    if (lastDate !== today) {
      setWarning("⚠️ Skip today = your streak resets to 0.");
      setMissionDone(false);
    } else {
      setWarning("");
      setMissionDone(true);
    }

    /* ---------------- XP ---------------- */
    setXpToNext(100 - (xp % 100));

  }, []);

  /* ---------------- COUNTDOWN TIMER ---------------- */
  useEffect(() => {
    const updateTimer = () => {
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
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const progress = user.xp % 100;

  /* ---------------- PHASE LOGIC ---------------- */
  const getPhase = () => {
    if (user.streak <= 3) return "Phase: Break Resistance";
    if (user.streak <= 10) return "Phase: Build Discipline";
    if (user.streak <= 16) return "Phase: Identity Shift";
    return "Phase: Mastery";
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="dashboard">

      {/* NAVBAR */}
      <header className="topbar">
        <span className="brand">ManifiX</span>
      </header>

      {/* 🔥 STREAK + PHASE */}
      <motion.div
        className="streak-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h1>🔥 Day {user.streak} / 16</h1>
        <p className="phase">{getPhase()}</p>

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

        {/* ⏳ COUNTDOWN */}
        {!missionDone && (
          <p className="timer">⏳ {timeLeft} to save your streak</p>
        )}
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
            ? "✅ Completed — You protected your streak."
            : "Complete today’s session or lose your progress."}
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

      {/* 🧠 IDENTITY MESSAGE */}
      <motion.div
        className="quote"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        💬 {missionDone
          ? "You are becoming disciplined. Keep going."
          : "You are building discipline. Don’t stop now."}
      </motion.div>

      {/* 🚀 MAIN CTA */}
      <motion.div
        className="start-wrapper"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link to="/app/magic16" className="start-btn">
          {missionDone ? "⚡ Do Another Session" : "🚀 Save My Streak"}
        </Link>
      </motion.div>

    </div>
  );
}
