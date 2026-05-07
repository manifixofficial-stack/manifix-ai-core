import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/Leaderboard.css";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [category, setCategory] = useState("Global"); // Global or Friends

  /* ================= 2026 STATUS DATA ================= */
  useEffect(() => {
    // Simulated high-value global data
    const mockTopTen = [
      { id: 1, name: "Arjun V.", streak: 154, accuracy: 99, country: "🇮🇳", isPro: true },
      { id: 2, name: "Sarah K.", streak: 142, accuracy: 98, country: "🇺🇸", isPro: true },
      { id: 3, name: "Kenji M.", streak: 121, accuracy: 99, country: "🇯🇵", isPro: true },
      { id: 4, name: "Alex R.", streak: 89, accuracy: 95, country: "🇩🇪", isPro: true },
      { id: 5, name: "Priya S.", streak: 76, accuracy: 97, country: "🇮🇳", isPro: true },
      // ... more users
    ];
    setUsers(mockTopTen);
    
    // User's own data from localStorage
    const currentStreak = Number(localStorage.getItem("magic16_streak") || 0);
    setMyRank({ name: "You", streak: currentStreak, rank: 452, accuracy: 92 });
  }, []);

  return (
    <div className="leaderboard-pro-container">
      {/* --- HEADER --- */}
      <div className="leaderboard-header">
        <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }}>
          THE 1% CLUB
        </motion.h1>
        <p>Verified Discipline Ranks • 2026 Global Season</p>
        
        <div className="filter-tabs">
          <button className={category === "Global" ? "active" : ""} onClick={() => setCategory("Global")}>Global</button>
          <button className={category === "Regional" ? "active" : ""} onClick={() => setCategory("Regional")}>Regional</button>
        </div>
      </div>

      {/* --- TOP 3 PODIUM (THE ELITE) --- */}
      <div className="podium">
        {users.slice(0, 3).map((user, index) => (
          <motion.div 
            key={user.id} 
            className={`podium-spot rank-${index + 1}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.2 }}
          >
            <div className="avatar-ring">
              <span className="country-flag">{user.country}</span>
            </div>
            <h3>{user.name}</h3>
            <div className="streak-badge">{user.streak} DAYS</div>
          </motion.div>
        ))}
      </div>

      {/* --- THE MAIN LIST --- */}
      <div className="leaderboard-list">
        {users.slice(3).map((user, index) => (
          <motion.div 
            className="user-row" 
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="rank-num">#{index + 4}</span>
            <div className="user-info">
              <span className="user-name">{user.name} {user.isPro && <span className="pro-check">✔</span>}</span>
              <span className="user-stats">{user.accuracy}% AI Accuracy</span>
            </div>
            <span className="user-streak">{user.streak}d</span>
          </motion.div>
        ))}
      </div>

      {/* --- USER'S FIXED STATUS BAR (STICKY) --- */}
      {myRank && (
        <div className="my-status-sticky">
          <div className="inner">
             <div className="my-rank-info">
               <span className="rank-label">YOUR RANK</span>
               <span className="rank-val">#{myRank.rank}</span>
             </div>
             <div className="my-streak-info">
               <span className="rank-label">STREAK</span>
               <span className="rank-val">{myRank.streak} DAYS</span>
             </div>
             <Link to="/app/membership" className="upgrade-prompt">
               GET PRO TIER
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
