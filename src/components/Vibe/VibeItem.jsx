/* ==========================================================
 * ManifiX — Vibe Item
 * ----------------------------------------------------------
 * Responsibilities:
 * - Render a single Vibe (story / note)
 * - Support text, mood, music, font, background
 * - Privacy-aware (public / private)
 * - Mobile-first, ultra-smooth
 * - Used inside VibeFeed & Story Viewer
 * ========================================================== */

import React from "react";
import Button from "../UI/Button.jsx";

const VibeItem = ({
  vibe,
  onOpen,
  onLike,
  onShare,
  isOwner = false,
}) => {
  if (!vibe) return null;

  const {
    text,
    mood,
    background,
    text_color,
    font,
    song,
    privacy,
    likes = 0,
    user_avatar,
    username,
    time_ago,
  } = vibe;

  return (
    <div
      className="vibe-item"
      onClick={() => onOpen?.(vibe)}
      style={{
        background: background || "#020617",
        color: text_color || "#fff",
        fontFamily: font || "inherit",
      }}
    >
      {/* ===============================
          HEADER
      =============================== */}
      <div className="vibe-item-header">
        <img
          src={user_avatar || "/avatar.png"}
          alt={username}
          className="vibe-avatar"
        />

        <div className="vibe-user">
          <strong>{username}</strong>
          <span className="vibe-time">{time_ago}</span>
        </div>

        {privacy === "private" && (
          <span className="vibe-lock">🔒</span>
        )}
      </div>

      {/* ===============================
          CONTENT
      =============================== */}
      <div className="vibe-item-content">
        {text && <p className="vibe-text">{text}</p>}

        {mood && (
          <div className="vibe-mood">
            ✨ {mood}
          </div>
        )}

        {song && (
          <div className="vibe-song">
            🎵 {song.title} — {song.artist}
          </div>
        )}
      </div>

      {/* ===============================
          FOOTER ACTIONS
      =============================== */}
      <div className="vibe-item-footer">
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(vibe.id);
          }}
        >
          ❤️ {likes}
        </Button>

        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(vibe);
          }}
        >
          ✨ Share
        </Button>

        {isOwner && (
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit vibe");
            }}
          >
            ⋮
          </Button>
        )}
      </div>
    </div>
  );
};

export default VibeItem;
