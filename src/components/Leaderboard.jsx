// ====================================================================
// 🏆 Leaderboard.jsx - COMPACT CORNER RANKS WIDGET
// ====================================================================
//
// SIZE FIX (this revision): previously rendered as a full-screen
// blocking modal (position:fixed inset:0, dark backdrop over the whole
// game, centered panel, "DISMISS" button) — meaning opening it stopped
// you from seeing/playing the game underneath. That's the "overlay
// playing screen" problem. Now it's a small, non-blocking corner box
// (like GameCanvas.jsx's own inline leaderboard widget) that floats
// over gameplay without covering it. No more backdrop, no more
// full-viewport takeover — just a compact panel you can toggle.
//
// Same props, same data normalization, same sorting — only the layout
// changed. onClose still works exactly the same (closes/hides it).
//
// Everything else carried over unchanged: array/object normalization,
// isMe matching against slot_id/slotId, name fallback order.

import React from 'react';

export default function Leaderboard({ players = [], mySlot = null, onClose }) {
  const playerList = Array.isArray(players)
    ? players
    : Object.entries(players).map(([id, p]) => ({ id, ...p }));

  const ranked = [...playerList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="leaderboard-corner-widget">
      <style>{`
        .leaderboard-corner-widget {
          position: fixed;
          top: 14px;
          right: 14px;
          z-index: 300;
          width: 190px;
          max-width: calc(100vw - 28px);
          background: rgba(11, 14, 29, 0.94);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 10px 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          pointer-events: auto;
        }
        .leaderboard-header-block {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }
        .leaderboard-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pulse-indicator-dot {
          width: 5px;
          height: 5px;
          background: #2ecc71;
          border-radius: 50%;
          box-shadow: 0 0 8px #2ecc71;
          animation: pulse-glow 1.5s infinite alternate;
        }
        @keyframes pulse-glow {
          100% { opacity: 0.3; }
        }
        .leaderboard-header-block h2 {
          color: #ffffff;
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.8px;
          margin: 0;
        }
        .leaderboard-mini-close-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          padding: 2px 4px;
        }
        .leaderboard-mini-close-btn:active {
          color: rgba(255,255,255,0.8);
        }
        .leaderboard-rows-scroll-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 190px;
          overflow-y: auto;
        }
        .leaderboard-row-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
        }
        .highlight-user-row {
          border-color: #2ecc71;
          background: rgba(46, 204, 113, 0.06);
        }
        .leaderboard-rank-badge {
          font-family: 'Orbitron', sans-serif;
          font-size: 9px;
          font-weight: 900;
          color: #2ecc71;
          width: 22px;
          flex-shrink: 0;
        }
        .leaderboard-player-name {
          flex-grow: 1;
          text-align: left;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .leaderboard-player-points {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 900;
          color: #2ecc71;
          flex-shrink: 0;
        }
        .pts-suffix {
          font-size: 7px;
          color: rgba(255, 255, 255, 0.4);
        }
        .leaderboard-empty-state {
          text-align: center;
          padding: 12px 0;
          color: rgba(255, 255, 255, 0.3);
          font-size: 9px;
        }
        .scanning-icon {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
          animation: float 2s infinite alternate ease-in-out;
        }
        @keyframes float {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="leaderboard-header-block">
        <div className="leaderboard-header-left">
          <div className="pulse-indicator-dot"></div>
          <h2>STANDINGS</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="leaderboard-mini-close-btn" aria-label="Close leaderboard">
            ✕
          </button>
        )}
      </div>

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
                {idx === 0 ? '👑' : `#${idx + 1}`}
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
            <p style={{ margin: 0 }}>AWAITING DATA...</p>
          </div>
        )}
      </div>
    </div>
  );
}
