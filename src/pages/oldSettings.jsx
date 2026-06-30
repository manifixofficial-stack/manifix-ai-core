// src/pages/Settings.jsx
// ManifiX AI — Habit Command Center
// Billion-value, viral, addictive — matches Magic16 dark discipline aesthetic

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --bg:       #080808;
    --surface:  #0f0f0f;
    --border:   #1c1c1c;
    --gold:     #c9a84c;
    --gold-dim: #7a5f28;
    --ice:      #4cc9f0;
    --ice-dim:  #1a4a5a;
    --danger:   #ff3b3b;
    --green:    #39d98a;
    --text:     #e8e8e8;
    --muted:    #555;
    --font-hd:  'Bebas Neue', sans-serif;
    --font-mono:'Share Tech Mono', monospace;
    --font-body:'Inter', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .sx-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-body);
    color: var(--text);
    overflow-x: hidden;
    position: relative;
  }

  /* scan lines */
  .sx-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.012) 2px,
      rgba(255,255,255,0.012) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  /* noise grain */
  .sx-root::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  .sx-inner {
    position: relative;
    z-index: 1;
    max-width: 480px;
    margin: 0 auto;
    padding: 0 0 100px;
  }

  /* ── HEADER ── */
  .sx-header {
    padding: 40px 24px 24px;
    border-bottom: 1px solid var(--border);
    position: relative;
  }

  .sx-back {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    padding: 0;
    margin-bottom: 20px;
    transition: color 0.2s;
  }
  .sx-back:hover { color: var(--gold); }

  .sx-title {
    font-family: var(--font-hd);
    font-size: clamp(36px, 10vw, 52px);
    letter-spacing: 3px;
    line-height: 1;
    color: #fff;
  }
  .sx-title span { color: var(--gold); }

  .sx-subtitle {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 6px;
  }

  /* ── SECTION LABEL ── */
  .sx-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    padding: 28px 24px 10px;
  }

  /* ── CARD ── */
  .sx-card {
    margin: 0 16px 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
    transition: border-color 0.3s;
  }
  .sx-card.active { border-color: var(--gold); }
  .sx-card.active-ice { border-color: var(--ice); }

  .sx-card-accent {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--gold);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .sx-card.active .sx-card-accent { opacity: 1; }
  .sx-card.active-ice .sx-card-accent { background: var(--ice); opacity: 1; }

  /* ── NOTIFICATION TOGGLE ── */
  .sx-notif-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px;
  }

  .sx-notif-info h3 {
    font-family: var(--font-hd);
    font-size: 22px;
    letter-spacing: 1px;
    color: #fff;
    margin-bottom: 3px;
  }
  .sx-notif-info p {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  /* pill toggle */
  .sx-toggle {
    position: relative;
    width: 56px;
    height: 28px;
    flex-shrink: 0;
  }
  .sx-toggle input { opacity: 0; width: 0; height: 0; }
  .sx-toggle-track {
    position: absolute;
    inset: 0;
    background: #1a1a1a;
    border: 1px solid var(--border);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.3s;
  }
  .sx-toggle-track.on {
    background: var(--gold);
    border-color: var(--gold);
    box-shadow: 0 0 12px rgba(201,168,76,0.4);
  }
  .sx-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #333;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .sx-toggle-track.on .sx-toggle-thumb {
    left: 31px;
    background: #fff;
  }

  /* ── TIME SLOTS ── */
  .sx-time-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    padding: 16px;
    gap: 8px;
  }

  .sx-time-slot {
    position: relative;
    background: #111;
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 14px 12px;
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
  }
  .sx-time-slot:hover { border-color: #333; }
  .sx-time-slot.selected {
    border-color: var(--gold);
    background: rgba(201,168,76,0.06);
  }
  .sx-time-slot.selected::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top left, rgba(201,168,76,0.12) 0%, transparent 70%);
  }

  .sx-time-emoji {
    font-size: 18px;
    margin-bottom: 6px;
    display: block;
  }
  .sx-time-label {
    font-family: var(--font-hd);
    font-size: 16px;
    letter-spacing: 1px;
    color: #fff;
    margin-bottom: 2px;
  }
  .sx-time-sub {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .sx-time-check {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 16px;
    height: 16px;
    border: 1px solid var(--gold-dim);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .sx-time-slot.selected .sx-time-check {
    background: var(--gold);
    border-color: var(--gold);
    box-shadow: 0 0 8px rgba(201,168,76,0.5);
  }
  .sx-time-check svg { display: none; }
  .sx-time-slot.selected .sx-time-check svg { display: block; }

  /* ── FREEZE COUNTER ── */
  .sx-freeze-body {
    padding: 18px 20px;
  }

  .sx-freeze-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .sx-freeze-header h3 {
    font-family: var(--font-hd);
    font-size: 22px;
    letter-spacing: 1px;
    color: var(--ice);
  }
  .sx-freeze-count {
    font-family: var(--font-hd);
    font-size: 40px;
    color: var(--ice);
    line-height: 1;
    text-shadow: 0 0 20px rgba(76,201,240,0.4);
  }

  .sx-freeze-crystals {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .sx-crystal {
    width: 36px;
    height: 36px;
    background: var(--ice-dim);
    border: 1px solid var(--ice);
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .sx-crystal.used {
    background: #111;
    border-color: #222;
    opacity: 0.35;
  }
  .sx-crystal:not(.used):hover {
    background: rgba(76,201,240,0.2);
    box-shadow: 0 0 12px rgba(76,201,240,0.3);
    transform: scale(1.08);
  }

  .sx-freeze-hint {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 1px;
  }
  .sx-freeze-hint span { color: var(--ice); }

  .sx-freeze-add {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sx-freeze-add p {
    font-size: 12px;
    color: var(--muted);
    max-width: 200px;
    line-height: 1.5;
  }
  .sx-freeze-earn-btn {
    background: none;
    border: 1px solid var(--ice-dim);
    color: var(--ice);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 8px 14px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .sx-freeze-earn-btn:hover {
    background: rgba(76,201,240,0.1);
    box-shadow: 0 0 12px rgba(76,201,240,0.2);
  }

  /* ── PSYCHOLOGY CARD ── */
  .sx-psych {
    margin: 0 16px;
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    border-left: 2px solid var(--gold-dim);
    padding: 20px;
    border-radius: 2px;
  }
  .sx-psych-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--gold-dim);
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .sx-psych blockquote {
    font-size: 14px;
    line-height: 1.7;
    color: #888;
    font-style: italic;
  }
  .sx-psych blockquote strong { color: var(--gold); font-style: normal; }

  /* ── STATS ROW ── */
  .sx-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    margin: 0 16px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 2px;
    overflow: hidden;
  }
  .sx-stat {
    background: var(--surface);
    padding: 16px 12px;
    text-align: center;
  }
  .sx-stat-value {
    font-family: var(--font-hd);
    font-size: 28px;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }
  .sx-stat-label {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ── DANGER ZONE ── */
  .sx-danger {
    margin: 0 16px;
    border: 1px solid #1a0000;
    border-radius: 2px;
    overflow: hidden;
  }
  .sx-danger-header {
    background: #100000;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .sx-danger-title {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 3px;
    color: var(--danger);
    text-transform: uppercase;
    opacity: 0.7;
  }
  .sx-danger-body {
    background: var(--surface);
    padding: 16px;
  }
  .sx-danger-btn {
    width: 100%;
    background: none;
    border: 1px solid #300000;
    color: #ff3b3b88;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    margin-bottom: 8px;
  }
  .sx-danger-btn:hover {
    border-color: var(--danger);
    color: var(--danger);
    background: rgba(255,59,59,0.05);
  }
  .sx-danger-btn:last-child { margin-bottom: 0; }

  /* ── SAVE BTN ── */
  .sx-save-wrap {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(to top, #080808 60%, transparent);
    z-index: 100;
  }
  .sx-save-btn {
    width: 100%;
    max-width: 480px;
    display: block;
    margin: 0 auto;
    background: var(--gold);
    color: #000;
    border: none;
    font-family: var(--font-hd);
    font-size: 20px;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 18px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .sx-save-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
  }
  .sx-save-btn:hover {
    background: #dbb85a;
    box-shadow: 0 0 30px rgba(201,168,76,0.4);
    transform: translateY(-1px);
  }
  .sx-save-btn:active { transform: translateY(0); }
  .sx-save-btn.saved {
    background: var(--green);
    box-shadow: 0 0 30px rgba(57,217,138,0.4);
  }

  /* ── TOAST ── */
  .sx-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--green);
    color: #000;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px 24px;
    border-radius: 2px;
    z-index: 1000;
    white-space: nowrap;
    box-shadow: 0 4px 30px rgba(57,217,138,0.4);
  }

  /* ── RESET CONFIRM MODAL ── */
  .sx-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .sx-modal {
    background: var(--surface);
    border: 1px solid var(--danger);
    border-radius: 2px;
    padding: 28px;
    max-width: 340px;
    width: 100%;
  }
  .sx-modal h2 {
    font-family: var(--font-hd);
    font-size: 28px;
    color: var(--danger);
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  .sx-modal p {
    font-size: 13px;
    color: #888;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .sx-modal-btns { display: flex; gap: 10px; }
  .sx-modal-cancel {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #888;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }
  .sx-modal-cancel:hover { color: #fff; border-color: #555; }
  .sx-modal-confirm {
    flex: 1;
    background: var(--danger);
    border: none;
    color: #fff;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }
  .sx-modal-confirm:hover { background: #ff5555; }

  @media (max-width: 380px) {
    .sx-time-grid { grid-template-columns: 1fr; }
  }
`;

/* ─────────────────────────────────────────
   TIME SLOTS DATA
───────────────────────────────────────── */
const TIME_SLOTS = [
  { value: "3-6",   emoji: "🌑", label: "3 – 6 AM",   sub: "Brahma Muhurta · Monks Only",  power: "MAX" },
  { value: "6-7",   emoji: "🔥", label: "6 – 7 AM",   sub: "Peak Cortisol · Best Window",  power: "OPTIMAL" },
  { value: "12-13", emoji: "⚡", label: "12 – 1 PM",  sub: "Midday Reset · Energy Spike",  power: "STRONG" },
  { value: "18-20", emoji: "🌇", label: "6 – 8 PM",   sub: "Evening Rebuild · Stress Out",  power: "GOOD" },
  { value: "21-22", emoji: "🌙", label: "9 – 10 PM",  sub: "Night Wind-Down · Last Chance", power: "LATE" },
  { value: "22-24", emoji: "💀", label: "10 PM+",     sub: "Discipline Override · Hardcore", power: "HARD" },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Settings() {
  const navigate = useNavigate();

  /* ── STATE ── */
  const [notifications, setNotifications] = useState(true);
  const [timeRange, setTimeRange] = useState("6-7");
  const [freeze, setFreeze] = useState(1);
  const [maxFreeze] = useState(3);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [resetModal, setResetModal] = useState(null); // null | "streak" | "all"

  /* ── STATS from localStorage ── */
  const [stats, setStats] = useState({ streak: 0, sessions: 0, xp: 0 });

  /* ── LOAD ── */
  useEffect(() => {
    const savedStart = localStorage.getItem("notif_start");
    const savedEnd   = localStorage.getItem("notif_end");
    if (savedStart && savedEnd) setTimeRange(`${savedStart}-${savedEnd}`);
    const savedNotif = localStorage.getItem("notifications");
    if (savedNotif !== null) setNotifications(savedNotif === "true");
    const savedFreeze = localStorage.getItem("freeze");
    if (savedFreeze !== null) setFreeze(Number(savedFreeze));

    // stats
    const streak   = Number(localStorage.getItem("magic16_streak") || 0);
    const sessions = Number(localStorage.getItem("magic16_sessions_total") || 0);
    const xp       = Number(localStorage.getItem("magic16_xp") || 0);
    setStats({ streak, sessions, xp });
  }, []);

  /* ── SAVE ── */
  const handleSave = () => {
    const [start, end] = timeRange.split("-");
    localStorage.setItem("notif_start", start);
    localStorage.setItem("notif_end", end);
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("freeze", String(freeze));

    setSaved(true);
    setShowToast(true);
    setTimeout(() => { setSaved(false); setShowToast(false); }, 2500);
  };

  /* ── EARN FREEZE (5-day streak reward) ── */
  const earnFreeze = () => {
    if (stats.streak >= 5 && freeze < maxFreeze) {
      const newFreeze = freeze + 1;
      setFreeze(newFreeze);
      localStorage.setItem("freeze", String(newFreeze));
    }
  };

  /* ── RESET ACTIONS ── */
  const confirmReset = () => {
    if (resetModal === "streak") {
      localStorage.setItem("magic16_streak", "0");
      localStorage.setItem("magic16_last_session", "");
      setStats(prev => ({ ...prev, streak: 0 }));
    } else if (resetModal === "all") {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("magic16") || k.startsWith("notif") || k.startsWith("freeze") || k.startsWith("user"));
      keys.forEach(k => localStorage.removeItem(k));
      setStats({ streak: 0, sessions: 0, xp: 0 });
      setFreeze(1);
    }
    setResetModal(null);
    setDangerOpen(false);
  };

  /* ── INJECT STYLES ── */
  useEffect(() => {
    const tag = document.createElement("style");
    tag.id = "sx-styles";
    tag.textContent = STYLES;
    if (!document.getElementById("sx-styles")) document.head.appendChild(tag);
    return () => { const t = document.getElementById("sx-styles"); if (t) t.remove(); };
  }, []);

  /* ── LEVEL CALC ── */
  const level = Math.floor(stats.xp / 500) + 1;

  return (
    <div className="sx-root">
      <div className="sx-inner">

        {/* HEADER */}
        <motion.div
          className="sx-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button className="sx-back" onClick={() => navigate("/app/dashboard")}>
            ← BACK TO COMMAND CENTER
          </button>
          <h1 className="sx-title">HABIT<br /><span>SYSTEM</span></h1>
          <p className="sx-subtitle">Configure · Lock In · Execute</p>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <p className="sx-label">YOUR NUMBERS</p>
          <div className="sx-stats">
            <div className="sx-stat">
              <div className="sx-stat-value">{stats.streak}</div>
              <div className="sx-stat-label">Day Streak</div>
            </div>
            <div className="sx-stat">
              <div className="sx-stat-value">{stats.sessions}</div>
              <div className="sx-stat-label">Sessions</div>
            </div>
            <div className="sx-stat">
              <div className="sx-stat-value">LV{level}</div>
              <div className="sx-stat-label">Rank</div>
            </div>
          </div>
        </motion.div>

        {/* NOTIFICATIONS */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="sx-label">DAILY TRIGGER</p>
          <div className={`sx-card ${notifications ? "active" : ""}`}>
            <div className="sx-card-accent" />
            <div className="sx-notif-row">
              <div className="sx-notif-info">
                <h3>BATTLE ALARM</h3>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "2px", color: "var(--muted)" }}>
                  {notifications ? "ARMED · DAILY LOCK-IN ACTIVE" : "DISARMED · DANGER"}
                </p>
              </div>
              <label className="sx-toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(n => !n)}
                />
                <div
                  className={`sx-toggle-track ${notifications ? "on" : ""}`}
                  onClick={() => setNotifications(n => !n)}
                >
                  <div className="sx-toggle-thumb" />
                </div>
              </label>
            </div>
            {!notifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                style={{
                  borderTop: "1px solid #1a0000",
                  padding: "12px 20px",
                  background: "rgba(255,59,59,0.04)"
                }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#ff3b3b88", letterSpacing: "2px" }}>
                  ⚠ WITHOUT REMINDERS, 67% OF USERS QUIT BY WEEK 2
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* TIME WINDOW */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="sx-label">EXECUTION WINDOW</p>
          <div className="sx-card active" style={{ margin: "0 16px 3px" }}>
            <div className="sx-card-accent" />
            <div className="sx-time-grid">
              {TIME_SLOTS.map((slot) => {
                const isSelected = timeRange === slot.value;
                return (
                  <motion.div
                    key={slot.value}
                    className={`sx-time-slot ${isSelected ? "selected" : ""}`}
                    onClick={() => setTimeRange(slot.value)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="sx-time-emoji">{slot.emoji}</span>
                    <div className="sx-time-label">{slot.label}</div>
                    <div className="sx-time-sub">{slot.sub}</div>
                    <div className="sx-time-check">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="time-sel"
                        style={{
                          position: "absolute",
                          top: 8, right: 8,
                          fontFamily: "var(--font-mono)",
                          fontSize: 8,
                          letterSpacing: "1px",
                          color: "var(--gold)",
                          textTransform: "uppercase"
                        }}
                      >
                        {slot.power}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* STREAK FREEZE */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="sx-label">STREAK PROTECTION</p>
          <div className={`sx-card ${freeze > 0 ? "active-ice" : ""}`}>
            <div className="sx-card-accent" />
            <div className="sx-freeze-body">
              <div className="sx-freeze-header">
                <h3>ICE SHIELDS</h3>
                <div className="sx-freeze-count">{freeze}</div>
              </div>

              {/* Crystal icons */}
              <div className="sx-freeze-crystals">
                {Array.from({ length: maxFreeze }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`sx-crystal ${i >= freeze ? "used" : ""}`}
                    whileTap={i < freeze ? { scale: 0.9 } : {}}
                  >
                    🧊
                  </motion.div>
                ))}
                {Array.from({ length: Math.max(0, 3 - maxFreeze) }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    width: 36, height: 36,
                    border: "1px dashed #222",
                    borderRadius: 2,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ color: "#333", fontSize: 18 }}>+</span>
                  </div>
                ))}
              </div>

              <p className="sx-freeze-hint">
                Miss a day? An 🧊 activates automatically.<br />
                <span>Streak protected. No reset. No shame.</span>
              </p>

              <div className="sx-freeze-add">
                <p>Earn shields by hitting<br />5-day streaks without missing.</p>
                <button
                  className="sx-freeze-earn-btn"
                  onClick={earnFreeze}
                  disabled={stats.streak < 5 || freeze >= maxFreeze}
                  style={{ opacity: (stats.streak >= 5 && freeze < maxFreeze) ? 1 : 0.35 }}
                >
                  {freeze >= maxFreeze ? "MAX SHIELDS" : stats.streak >= 5 ? "CLAIM SHIELD" : `NEED ${5 - stats.streak} MORE DAYS`}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PSYCHOLOGY */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <p className="sx-label">WHY THIS WORKS</p>
          <div className="sx-psych">
            <div className="sx-psych-label">Behavioral Science</div>
            <blockquote>
              The research is clear. <strong>Consistency beats motivation every time.</strong> A habit that fires at the same time daily becomes <strong>automatic within 66 days</strong>. Magic16 is 16 minutes. Not an hour. Not a commitment. Just a trigger. The system does the rest.
            </blockquote>
          </div>
        </motion.div>

        {/* DANGER ZONE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="sx-label" style={{ color: "#300000" }}>DANGER ZONE</p>
          <div className="sx-danger">
            <div
              className="sx-danger-header"
              onClick={() => setDangerOpen(o => !o)}
            >
              <span className="sx-danger-title">⚠ Nuclear Options</span>
              <motion.span
                animate={{ rotate: dangerOpen ? 180 : 0 }}
                style={{ color: "#ff3b3b55", fontSize: 12 }}
              >▼</motion.span>
            </div>
            <AnimatePresence>
              {dangerOpen && (
                <motion.div
                  className="sx-danger-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <button
                    className="sx-danger-btn"
                    onClick={() => setResetModal("streak")}
                  >
                    ☠ Reset Streak to Zero
                  </button>
                  <button
                    className="sx-danger-btn"
                    onClick={() => setResetModal("all")}
                  >
                    💣 Wipe All Progress (Full Reset)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* SPACER for fixed button */}
        <div style={{ height: 100 }} />
      </div>

      {/* FIXED SAVE BUTTON */}
      <div className="sx-save-wrap">
        <motion.button
          className={`sx-save-btn ${saved ? "saved" : ""}`}
          onClick={handleSave}
          whileTap={{ scale: 0.98 }}
        >
          {saved ? "✓ ROUTINE LOCKED IN" : "ACTIVATE MY ROUTINE"}
        </motion.button>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="sx-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            ✓ Habit system armed. No excuses.
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESET CONFIRM MODAL */}
      <AnimatePresence>
        {resetModal && (
          <motion.div
            className="sx-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setResetModal(null)}
          >
            <motion.div
              className="sx-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>ARE YOU SURE?</h2>
              <p>
                {resetModal === "streak"
                  ? "This will destroy your current streak and reset the counter to zero. Your sessions and XP are kept. This cannot be undone."
                  : "This will delete ALL your progress — streak, sessions, XP, level, everything. You start from zero. Completely. Cannot be undone."}
              </p>
              <div className="sx-modal-btns">
                <button className="sx-modal-cancel" onClick={() => setResetModal(null)}>
                  CANCEL
                </button>
                <button className="sx-modal-confirm" onClick={confirmReset}>
                  {resetModal === "streak" ? "RESET STREAK" : "WIPE ALL"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
