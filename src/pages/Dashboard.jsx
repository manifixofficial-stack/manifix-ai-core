import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/dashboard.css";

const user = {
  name: "Shyam",
  streak: 3,
  xp: 600,
  nextLevel: 1000,
  rank: "Challenger",
};

export default function Dashboard() {
  const progress = (user.xp / user.nextLevel) * 100;

  return (
    <div className="dashboard">

      {/* NAVBAR */}
      <header className="topbar">
        <span className="menu">≡</span>
        <span className="brand">ManifiX</span>
        <span className="notif">🔔</span>
      </header>

      {/* TOP STATS */}
      <div className="top-stats">
        <div>🔥 {user.streak}-Day Streak</div>
        <div>
          🎯 Goal: 80%
          <div className="mini-bar">
            <div style={{ width: "80%" }} />
          </div>
        </div>
      </div>

      {/* LIVE SECTION */}
      <div className="live-card">
        <div className="avatar">🧍‍♂️</div>
        <p className="pose">✨ Half Lift – Lengthen your back ✨</p>
      </div>

      {/* LEADERBOARD */}
      <div className="leaderboard card">
        <h3>🏆 Leaderboard</h3>
        <p>1. @FitnessGuru — 1200 XP</p>
        <p className="you">2. @You — 1050 XP</p>

        <button className="challenge">⚔️ Challenge</button>
      </div>

      {/* BADGES */}
      <div className="badges card">
        🎖️ Early Bird &nbsp; 🏅 Core Pro
      </div>

      {/* XP + LEVEL */}
      <div className="xp card">
        <h3>📈 Level 5: {user.rank}</h3>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <span>{user.xp} / {user.nextLevel}</span>
      </div>

      {/* WEEK TRACKER */}
      <div className="week card">
        <h3>Weekly Progress</h3>
        <div className="days">
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <span key={i} className={i < 3 ? "done" : ""}>{d}</span>
          ))}
        </div>
      </div>

      {/* MOTIVATION */}
      <div className="quote">
        💬 "Keep it up! You're crushing it this week!"
      </div>

      {/* MAIN CTA */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="start-wrapper"
      >
        <Link to="/app/magic16" className="start-btn">
          🚀 START MAGIC16
        </Link>
      </motion.div>

      <div className="reset">🔄 Quick Reset</div>

    </div>
  );
}
