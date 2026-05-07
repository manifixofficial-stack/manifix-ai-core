import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState({ streak: 0, xp: 0, level: 1 });
  const [missionDone, setMissionDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [danger, setDanger] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [globalRank, setGlobalRank] = useState(452); // Simulated Billion Dollar Status

  useEffect(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    const xp = Number(localStorage.getItem("magic16_xp") || 0);
    const level = Number(localStorage.getItem("magic16_level") || 1);
    const lastDate = localStorage.getItem("magic16_last_date");
    const today = new Date().toDateString();

    setUser({ streak, xp, level });
    setMissionDone(lastDate === today);

    const prevLevel = Number(localStorage.getItem("prev_level") || level);
    if (level > prevLevel) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 4000);
    }
    localStorage.setItem("prev_level", level);
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setDanger(true);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft(`${h}h ${m}m`);
      if (h <= 3) setDanger(true);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const dayProgress = Math.min(user.streak, 16);
  const progressPercent = Math.floor((dayProgress / 16) * 100);

  return (
    <div className={`dashboard-elite ${danger ? "danger-state" : ""}`}>
      {/* 🏆 LEVEL UP OVERLAY - High-Value Animation */}
      <AnimatePresence>
        {levelUp && (
          <motion.div 
            className="levelup-gold-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glow-circle" />
            <h2>LEVEL {user.level} UNLOCKED</h2>
            <p>Your neural capacity has increased.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMMAND CENTER HEADER */}
      <header className="elite-header">
        <div className="profile-summary">
          <div className="avatar-ring-gold">Y</div>
          <div>
            <h3>Welcome, High Performer</h3>
            <p className="rank-text">GLOBAL RANK: <span className="gold-text">#{globalRank}</span></p>
          </div>
        </div>
        <div className="status-pills">
          <div className="pill streak">🔥 {user.streak}</div>
          <div className="pill xp">⚡ {user.xp}</div>
        </div>
      </header>

      {/* 🧠 THE TRANSFORMATION TRACKER */}
      <motion.section 
        className="transformation-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-top">
          <h4>PROTOCOL: DAY {dayProgress}/16</h4>
          <span className="status-label">
            {dayProgress >= 16 ? "ELITE MASTER" : "IN PROGRESS"}
          </span>
        </div>
        
        <div className="main-progress">
          <div className="bar-bg">
            <motion.div 
              className="bar-fill-gold" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5 }}
            />
          </div>
          <span className="percent-label">{progressPercent}% SYSTEM SYNC</span>
        </div>

        <p className="psych-hook">
          {missionDone 
            ? "Biological objective achieved. You are in the top 1% today." 
            : danger 
            ? "CRITICAL: System shutdown imminent. Perform now or lose status." 
            : "The brain seeks comfort. Deny it."}
        </p>
      </motion.section>

      {/* ⏳ ACTION GRID */}
      <div className="action-grid">
        {!missionDone && (
          <motion.div 
            className={`timer-box ${danger ? "danger-pulse" : ""}`}
            animate={danger ? { borderColor: ["#D4AF37", "#ff0000", "#D4AF37"] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="label">REMAINING WINDOW</span>
            <span className="time">{timeLeft}</span>
          </motion.div>
        )}

        <motion.div className="mission-box-elite">
          <span className="label">ACTIVE MISSION</span>
          <p>{missionDone ? "REST & INTEGRATE" : "EXECUTE MAGIC16"}</p>
        </motion.div>
      </div>

      {/* 🚀 THE COMMAND BUTTON */}
      <div className="cta-dock">
        <Link to="/app/magic16" className={`elite-cta ${missionDone ? "done" : "active"}`}>
          {missionDone ? "REVIEW PERFORMANCE" : "START SESSION →"}
        </Link>
        {!missionDone && <p className="penalty-warning">⚠️ FAILURE RESULTS IN STREAK DELETION</p>}
      </div>
    </div>
  );
}
