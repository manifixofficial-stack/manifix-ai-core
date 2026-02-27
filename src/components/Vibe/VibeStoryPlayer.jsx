/* ==========================================================
 * ManifiX — Vibe Story Player
 * ----------------------------------------------------------
 * Auto-play Vibes like Instagram Stories
 * Timer-based progression
 * Touch / click to skip
 * ========================================================== */

import React, { useEffect, useState } from "react";

const STORY_DURATION = 6000; // 6 seconds per vibe

const VibeStoryPlayer = ({ vibes = [], onClose }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!vibes.length) return;

    const timer = setTimeout(() => {
      if (index < vibes.length - 1) setIndex(index + 1);
      else onClose?.();
    }, STORY_DURATION);

    return () => clearTimeout(timer);
  }, [index, vibes, onClose]);

  if (!vibes[index]) return null;

  const vibe = vibes[index];

  return (
    <div
      className="vibe-story-player"
      onClick={() =>
        index < vibes.length - 1
          ? setIndex(index + 1)
          : onClose?.()
      }
      style={{
        background: vibe.background || "#020617",
        color: vibe.text_color || "#fff",
        fontFamily: vibe.font || "inherit",
      }}
    >
      {/* Progress */}
      <div className="story-progress">
        {vibes.map((_, i) => (
          <span
            key={i}
            className={`bar ${i <= index ? "active" : ""}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="story-content">
        <h2>{vibe.text}</h2>
        {vibe.mood && <p>✨ {vibe.mood}</p>}
      </div>

      <span className="story-close">✕</span>
    </div>
  );
};

export default VibeStoryPlayer;
