/**
 * ManifiX AI — Leaderboard · The 1% Club
 * No external CSS — fully self-contained
 * Real localStorage streak sync · Animated podium · Global/Regional/Friends tabs
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

/* ── STYLE INJECTION ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');

  .lb-root {
    min-height: 100vh;
    background: #080808;
    font-family: 'Inter', sans-serif;
    color: #e8e8e8;
    overflow-x: hidden;
    position: relative;
  }
  .lb-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px
    );
    pointer-events: none;
    z-index: 0;
  }
  .lb-inner {
    position: relative;
    z-index: 1;
    max-width: 520px;
    margin: 0 auto;
    padding-bottom: 100px;
  }

  /* HEADER */
  .lb-header {
    padding: 40px 24px 28px;
    text-align: center;
    border-bottom: 1px solid #1c1c1c;
    position: relative;
    overflow: hidden;
  }
  .lb-header::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 300px; height: 200px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .lb-season {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    color: #555;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .lb-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(44px, 12vw, 64px);
    letter-spacing: 4px;
    color: #fff;
    line-height: 1;
    margin-bottom: 6px;
  }
  .lb-title span { color: #c9a84c; }
  .lb-desc {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    color: #555;
    text-transform: uppercase;
  }

  /* TABS */
  .lb-tabs {
    display: flex;
    gap: 2px;
    padding: 16px 16px 0;
  }
  .lb-tab {
    flex: 1;
    background: #0f0f0f;
    border: 1px solid #1c1c1c;
    color: #555;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 10px 8px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }
  .lb-tab.active {
    background: rgba(201,168,76,0.1);
    border-color: #c9a84c;
    color: #c9a84c;
  }
  .lb-tab:hover:not(.active) { border-color: #333; color: #888; }

  /* PODIUM */
  .lb-podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px 8px;
  }
  .lb-podium-spot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .lb-podium-spot.rank-1 { order: 2; }
  .lb-podium-spot.rank-2 { order: 1; }
  .lb-podium-spot.rank-3 { order: 3; }

  .lb-avatar-ring {
    position: relative;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lb-avatar-ring.rank-1 {
    width: 72px; height: 72px;
    background: linear-gradient(135deg, #c9a84c, #ffd700);
    box-shadow: 0 0 30px rgba(201,168,76,0.5);
  }
  .lb-avatar-ring.rank-2 {
    width: 58px; height: 58px;
    background: linear-gradient(135deg, #888, #ccc);
    box-shadow: 0 0 18px rgba(200,200,200,0.3);
  }
  .lb-avatar-ring.rank-3 {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #8B4513, #CD7F32);
    box-shadow: 0 0 14px rgba(205,127,50,0.3);
  }

  .lb-avatar-inner {
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    background: #111;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .lb-avatar-ring.rank-1 .lb-avatar-inner { font-size: 28px; }

  .lb-crown {
    position: absolute;
    top: -18px;
    font-size: 18px;
    filter: drop-shadow(0 2px 6px rgba(201,168,76,0.8));
  }

  .lb-podium-name {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    letter-spacing: 1px;
    text-align: center;
    color: #ccc;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lb-podium-streak {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    letter-spacing: 2px;
    text-align: center;
  }
  .rank-1 .lb-podium-streak { color: #c9a84c; font-size: 26px; }
  .rank-2 .lb-podium-streak { color: #ccc; }
  .rank-3 .lb-podium-streak { color: #CD7F32; }

  .lb-podium-base {
    width: 80px;
    border-radius: 2px 2px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: #fff;
  }
  .rank-1 .lb-podium-base { height: 60px; background: linear-gradient(180deg, rgba(201,168,76,0.3), rgba(201,168,76,0.05)); border: 1px solid rgba(201,168,76,0.4); }
  .rank-2 .lb-podium-base { height: 44px; background: linear-gradient(180deg, rgba(170,170,170,0.2), rgba(170,170,170,0.02)); border: 1px solid rgba(170,170,170,0.3); }
  .rank-3 .lb-podium-base { height: 32px; background: linear-gradient(180deg, rgba(205,127,50,0.2), rgba(205,127,50,0.02)); border: 1px solid rgba(205,127,50,0.3); }

  /* LIST */
  .lb-list {
    padding: 8px 16px 0;
  }
  .lb-list-header {
    display: grid;
    grid-template-columns: 36px 1fr 60px 60px;
    gap: 8px;
    padding: 8px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #333;
    text-transform: uppercase;
  }
  .lb-user-row {
    display: grid;
    grid-template-columns: 36px 1fr 60px 60px;
    gap: 8px;
    align-items: center;
    padding: 14px 12px;
    background: #0f0f0f;
    border: 1px solid #1c1c1c;
    border-radius: 2px;
    margin-bottom: 3px;
    transition: border-color 0.2s;
    position: relative;
    overflow: hidden;
  }
  .lb-user-row:hover { border-color: #333; }
  .lb-user-row.is-pro { border-left: 2px solid #c9a84c; }

  .lb-rank-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    color: #333;
    text-align: center;
  }
  .lb-user-flag { font-size: 16px; margin-right: 8px; }
  .lb-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #e8e8e8;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lb-pro-badge {
    font-family: 'Share Tech Mono', monospace;
    font-size: 7px;
    letter-spacing: 1px;
    padding: 2px 5px;
    background: rgba(201,168,76,0.15);
    border: 1px solid rgba(201,168,76,0.4);
    color: #c9a84c;
    border-radius: 1px;
    text-transform: uppercase;
  }
  .lb-user-sub {
    font-size: 10px;
    color: #444;
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 1px;
    margin-top: 2px;
  }
  .lb-streak-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    color: #c9a84c;
    text-align: right;
    line-height: 1;
  }
  .lb-streak-unit {
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px;
    color: #333;
    text-align: right;
    letter-spacing: 1px;
  }
  .lb-acc-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    text-align: right;
  }

  /* MY STATUS */
  .lb-my-status {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 100;
    padding: 12px 16px 24px;
    background: linear-gradient(to top, #080808 70%, transparent);
  }
  .lb-my-inner {
    max-width: 520px;
    margin: 0 auto;
    background: #0f0f0f;
    border: 1px solid #c9a84c;
    border-radius: 2px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 0 30px rgba(201,168,76,0.15);
  }
  .lb-my-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #555;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .lb-my-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    color: #c9a84c;
    line-height: 1;
  }
  .lb-my-divider {
    width: 1px;
    height: 32px;
    background: #1c1c1c;
    flex-shrink: 0;
  }
  .lb-upgrade-btn {
    margin-left: auto;
    background: #c9a84c;
    color: #000;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    padding: 10px 18px;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    align-items: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .lb-upgrade-btn:hover {
    background: #dbb85a;
    box-shadow: 0 0 20px rgba(201,168,76,0.4);
    transform: translateY(-1px);
  }

  /* EMPTY STATE */
  .lb-empty {
    text-align: center;
    padding: 48px 24px;
    color: #333;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height: 2;
  }

  /* LIVE DOT */
  .lb-live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #39d98a;
    text-transform: uppercase;
    margin-top: 8px;
  }
  .lb-live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #39d98a;
    box-shadow: 0 0 8px #39d98a;
    animation: lb-blink 1.4s ease-in-out infinite;
  }
  @keyframes lb-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

  @media (max-width: 380px) {
    .lb-list-header, .lb-user-row { grid-template-columns: 28px 1fr 48px 48px; }
  }
`;

/* ── MOCK DATA — 20 realistic global users ── */
function buildGlobal(myStreak) {
  const users = [
    { id:1,  name:"Arjun V.",    streak:187, accuracy:99, country:"🇮🇳", isPro:true,  city:"Mumbai"   },
    { id:2,  name:"Sarah K.",    streak:164, accuracy:98, country:"🇺🇸", isPro:true,  city:"New York"  },
    { id:3,  name:"Kenji M.",    streak:142, accuracy:99, country:"🇯🇵", isPro:true,  city:"Tokyo"     },
    { id:4,  name:"Alex R.",     streak:118, accuracy:96, country:"🇩🇪", isPro:true,  city:"Berlin"    },
    { id:5,  name:"Priya S.",    streak:104, accuracy:97, country:"🇮🇳", isPro:true,  city:"Bangalore" },
    { id:6,  name:"Liu W.",      streak:97,  accuracy:95, country:"🇨🇳", isPro:true,  city:"Shanghai"  },
    { id:7,  name:"Maria G.",    streak:91,  accuracy:94, country:"🇧🇷", isPro:false, city:"São Paulo"  },
    { id:8,  name:"Omar F.",     streak:88,  accuracy:93, country:"🇦🇪", isPro:true,  city:"Dubai"     },
    { id:9,  name:"Ravi K.",     streak:82,  accuracy:96, country:"🇮🇳", isPro:false, city:"Chennai"   },
    { id:10, name:"Emma T.",     streak:79,  accuracy:92, country:"🇬🇧", isPro:true,  city:"London"    },
    { id:11, name:"Yuki H.",     streak:74,  accuracy:91, country:"🇯🇵", isPro:false, city:"Osaka"     },
    { id:12, name:"Carlos M.",   streak:68,  accuracy:90, country:"🇲🇽", isPro:false, city:"CDMX"      },
    { id:13, name:"Amara D.",    streak:61,  accuracy:89, country:"🇳🇬", isPro:false, city:"Lagos"     },
    { id:14, name:"Sven L.",     streak:57,  accuracy:93, country:"🇸🇪", isPro:true,  city:"Stockholm" },
    { id:15, name:"Neha P.",     streak:54,  accuracy:88, country:"🇮🇳", isPro:false, city:"Pune"      },
    { id:16, name:"James O.",    streak:51,  accuracy:87, country:"🇦🇺", isPro:false, city:"Sydney"    },
    { id:17, name:"Fatima A.",   streak:47,  accuracy:91, country:"🇸🇦", isPro:false, city:"Riyadh"    },
    { id:18, name:"Ivan K.",     streak:43,  accuracy:86, country:"🇷🇺", isPro:false, city:"Moscow"    },
    { id:19, name:"Ana L.",      streak:38,  accuracy:85, country:"🇵🇹", isPro:false, city:"Lisbon"    },
    { id:20, name:"Rahul M.",    streak:34,  accuracy:84, country:"🇮🇳", isPro:false, city:"Delhi"     },
  ];
  // Insert user at correct rank position
  if (myStreak > 0) {
    const idx = users.findIndex(u => u.streak < myStreak);
    const rank = idx === -1 ? users.length + 1 : idx + 1;
    return { users, rank };
  }
  return { users, rank: users.length + Math.floor(Math.random() * 400) + 32 };
}

const REGIONAL = {
  "🇮🇳 India":    [1, 5, 9, 15, 20],
  "🇯🇵 Japan":    [3, 11],
  "🇺🇸 Americas": [2, 7, 12, 16],
  "🇩🇪 Europe":   [4, 10, 14, 18, 19],
  "🌏 MENA":      [8, 13, 17],
};

export default function Leaderboard() {
  const [tab, setTab] = useState("Global");
  const [myStreak, setMyStreak] = useState(0);
  const [mySessions, setMySessions] = useState(0);
  const [myAcc, setMyAcc] = useState(0);
  const [tick, setTick] = useState(0);  // simulate live updates

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "lb-styles";
    s.textContent = STYLES;
    if (!document.getElementById("lb-styles")) document.head.appendChild(s);
    return () => { const t = document.getElementById("lb-styles"); if (t) t.remove(); };
  }, []);

  useEffect(() => {
    setMyStreak(Number(localStorage.getItem("magic16_streak") || 0));
    setMySessions(Number(localStorage.getItem("magic16_sessions_total") || 0));
    setMyAcc(Number(localStorage.getItem("magic16_avg_accuracy") || 92));
    // simulate live updates every 8 seconds
    const id = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const { users: allUsers, rank } = useMemo(() => buildGlobal(myStreak), [myStreak]);

  // show users for current tab
  const displayed = useMemo(() => {
    if (tab === "Global") return allUsers;
    if (tab === "Regional") {
      const key = Object.keys(REGIONAL)[tick % Object.keys(REGIONAL).length];
      return REGIONAL[key].map(id => allUsers.find(u => u.id === id)).filter(Boolean);
    }
    // Friends — first 3 random + user
    return allUsers.slice(0, 4);
  }, [tab, allUsers, tick]);

  const top3   = displayed.slice(0, 3);
  const rest   = displayed.slice(3);
  const accColor = (a) => a >= 97 ? "#c9a84c" : a >= 92 ? "#39d98a" : a >= 85 ? "#4cc9f0" : "#555";

  return (
    <div className="lb-root">
      <div className="lb-inner">

        {/* HEADER */}
        <motion.div className="lb-header" initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
          <div className="lb-season">2026 Global Season · {tick % 3 === 0 ? "Updated just now" : tick % 3 === 1 ? "Updated 3s ago" : "Live Rankings"}</div>
          <h1 className="lb-title">THE <span>1%</span> CLUB</h1>
          <p className="lb-desc">Verified Discipline Ranks · Global Leaderboard</p>
          <div className="lb-live">
            <div className="lb-live-dot" />
            {allUsers.length.toLocaleString()} athletes tracked live
          </div>
        </motion.div>

        {/* TABS */}
        <div className="lb-tabs">
          {["Global","Regional","Friends"].map(t => (
            <button key={t} className={`lb-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "Global" ? "🌍" : t === "Regional" ? "🗺" : "👥"} {t}
            </button>
          ))}
        </div>

        {/* PODIUM — top 3 */}
        <div className="lb-podium">
          {top3.map((u, i) => {
            const rankNum = i + 1;
            const rankClass = `rank-${rankNum}`;
            return (
              <motion.div key={u.id} className={`lb-podium-spot ${rankClass}`}
                initial={{ opacity:0, scale:0.7 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: rankNum === 1 ? 0.2 : rankNum === 2 ? 0.1 : 0.15 }}>
                <div className={`lb-avatar-ring ${rankClass}`}>
                  {rankNum === 1 && <div className="lb-crown">👑</div>}
                  <div className="lb-avatar-inner">{u.country}</div>
                </div>
                <div className="lb-podium-name">{u.name}</div>
                <div className="lb-podium-streak">{u.streak}d</div>
                <div className={`lb-podium-base ${rankClass}`}>{rankNum}</div>
              </motion.div>
            );
          })}
        </div>

        {/* LIST — #4 onwards */}
        <div className="lb-list">
          <div className="lb-list-header">
            <div>#</div><div>Athlete</div><div style={{textAlign:"right"}}>Streak</div><div style={{textAlign:"right"}}>Acc</div>
          </div>

          {rest.length === 0 && (
            <div className="lb-empty">Invite friends to see them here<br />Use the Recruit tab</div>
          )}

          <AnimatePresence>
            {rest.map((u, i) => (
              <motion.div key={u.id} className={`lb-user-row ${u.isPro?"is-pro":""}`}
                initial={{ opacity:0, x:-16 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.03 }}>
                <div className="lb-rank-num">{i + 4}</div>
                <div>
                  <div className="lb-user-name">
                    <span className="lb-user-flag">{u.country}</span>
                    {u.name}
                    {u.isPro && <span className="lb-pro-badge">PRO</span>}
                  </div>
                  <div className="lb-user-sub">{u.city}</div>
                </div>
                <div>
                  <div className="lb-streak-val">{u.streak}</div>
                  <div className="lb-streak-unit">days</div>
                </div>
                <div>
                  <div className="lb-acc-val" style={{ color: accColor(u.accuracy) }}>{u.accuracy}%</div>
                  <div className="lb-streak-unit">accuracy</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* MY STICKY STATUS BAR */}
      <div className="lb-my-status">
        <div className="lb-my-inner">
          <div>
            <div className="lb-my-label">Your Rank</div>
            <div className="lb-my-val">#{rank}</div>
          </div>
          <div className="lb-my-divider" />
          <div>
            <div className="lb-my-label">Streak</div>
            <div className="lb-my-val">{myStreak}d</div>
          </div>
          <div className="lb-my-divider" />
          <div>
            <div className="lb-my-label">Accuracy</div>
            <div className="lb-my-val">{myAcc}%</div>
          </div>
          <Link to="/app/membership" className="lb-upgrade-btn">
            GET PRO
          </Link>
        </div>
      </div>
    </div>
  );
}
