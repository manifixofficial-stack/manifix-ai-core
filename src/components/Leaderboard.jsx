// ====================================================================
// 🏆 Leaderboard.jsx - GLASSMORPHIC SQUAD MATCH RANKS DRAWER
// ====================================================================
//
// Single-file version: CSS is embedded directly below via a <style> tag
// instead of a separate Leaderboard.css import, so this component is
// fully self-contained.
//
// Fixes carried over from the previous pass:
//   - `players` now expected as an ARRAY, matching what server.js
//     actually broadcasts on 'players-update' and what gameClient.js's
//     subscribeToRoom() onPlayersUpdate hands through directly. A plain
//     object is still accepted as a defensive fallback.
//   - isMe now compares against p.slot_id / p.slotId, not p.slot — no
//     payload in this codebase (players-update or round-end) has ever
//     had a `slot` field.
//   - name fallback order is name (live shape) then username (Mongo
//     global-leaderboard schema field), in case this ever gets pointed
//     at /api/leaderboard data instead of live in-room state.
//   - Added the @keyframes float that .scanning-icon referenced but
//     never had defined.

import React from 'react';

export default function Leaderboard({ players = [], mySlot = null, onClose }) {
  // Normalize to an array regardless of whether the caller passes the
  // live players-update array (expected) or, defensively, an object
  // keyed by id.
  const playerList = Array.isArray(players)
    ? players
    : Object.entries(players).map(([id, p]) => ({ id, ...p }));

  // Sort real-time player data dynamically by score values
  const ranked = [...playerList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="leaderboard-overlay-container">
      <style>{`
        .leaderboard-overlay-container {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 6, 11, 0.85);
          backdrop-filter: blur(8px);
          padding: 20px;
        }
        .leaderboard-panel-box {
          width: 100%;
          max-width: 380px;
          background: rgba(11, 14, 29, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 28px 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        }
        .leaderboard-header-block {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .pulse-indicator-dot {
          width: 6px;
          height: 6px;
          background: #2ecc71;
          border-radius: 50%;
          box-shadow: 0 0 10px #2ecc71;
          animation: pulse-glow 1.5s infinite alternate;
        }
        @keyframes pulse-glow {
          100% { opacity: 0.3; }
        }
        .leaderboard-header-block h2 {
          color: #ffffff;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .leaderboard-tagline {
          color: rgba(255, 255, 255, 0.3);
          font-size: 11px;
          text-align: center;
          margin-bottom: 24px;
        }
        .leaderboard-rows-scroll-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 45vh;
          overflow-y: auto;
        }
        .leaderboard-row-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .highlight-user-row {
          border-color: #2ecc71;
          background: rgba(46, 204, 113, 0.05);
          box-shadow: 0 0 15px rgba(46, 204, 113, 0.1);
        }
        .leaderboard-rank-badge {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 900;
          color: #2ecc71;
          width: 40px;
        }
        .leaderboard-player-name {
          flex-grow: 1;
          text-align: left;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .leaderboard-player-points {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 900;
          color: #2ecc71;
        }
        .pts-suffix {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.4);
        }
        .leaderboard-empty-state {
          text-align: center;
          padding: 30px 0;
          color: rgba(255, 255, 255, 0.3);
        }
        .scanning-icon {
          display: block;
          font-size: 24px;
          margin-bottom: 8px;
          animation: float 2s infinite alternate ease-in-out;
        }
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-6px); }
        }
        .leaderboard-close-hud-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 10px;
          padding: 14px;
          border-radius: 4px;
          margin-top: 24px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.15s ease;
        }
        .leaderboard-close-hud-btn:active {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="leaderboard-panel-box animate-slide-up">

        {/* Title Block with Cyberpunk Neon-Green Pulse */}
        <div className="leaderboard-header-block">
          <div className="pulse-indicator-dot"></div>
          <h2>GLOBAL STANDINGS</h2>
        </div>

        <p className="leaderboard-tagline">Real-time database sync derived from MongoDB Atlas logs</p>
        <div className="leaderboard-rows-scroll-grid">
          {ranked.map((p, idx) => {
            const slotValue = p.slot_id || p.slotId;
            const isMe = slotValue === mySlot || p.id === mySlot;
            return (
              <div
                key={p.id ?? idx}
                className={`leaderboard-row-row ${isMe ? 'highlight-user-row' : ''}`}
              >
                <span className="leaderboard-rank-badge">
                  {idx === 0 ? '👑' : `#0${idx + 1}`}
                </span>

                <span className="leaderboard-player-name">
                  {p.name || p.username || `CH_0${idx + 1}`}
                </span>

                <span className="leaderboard-player-points">
                  {p.score ?? 0} <span className="pts-suffix">PTS</span>
                </span>
              </div>
            );
          })}
          {ranked.length === 0 && (
            <div className="leaderboard-empty-state">
              <span className="scanning-icon">📡</span>
              <p>AWAITING INCOMING LIVE TELEMETRY DATA...</p>
            </div>
          )}
        </div>
        {/* Tactile Action Control */}
        <button onClick={onClose} className="leaderboard-close-hud-btn">
          ⚡ DISMISS COMPILATION VIEW
        </button>
      </div>
    </div>
  );
}