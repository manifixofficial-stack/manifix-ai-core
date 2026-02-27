/* ==========================================================
 * ManifiX — Vibe Feed
 * ----------------------------------------------------------
 * Responsibilities:
 * - Display global & personal Vibes (stories / notes)
 * - Auto-play vibes (music, text, emotion)
 * - Like, comment, react
 * - Mobile-first (Instagram-style)
 * - Supabase-powered (via vibe.service.js)
 * ========================================================== */

import React, { useEffect, useState } from "react";
import vibeService from '../../services/vibe.service.js';
import Button from "../UI/Button.jsx";
import Loader from "../UI/Loader.jsx";
import Modal from "../UI/Modal.jsx";

const VibeFeed = () => {
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVibe, setActiveVibe] = useState(null);

  // ===============================
  // 🔄 LOAD VIBES
  // ===============================
  useEffect(() => {
    loadVibes();
  }, []);

  const loadVibes = async () => {
    try {
      setLoading(true);
      const data = await vibeService.getVibes();
      setVibes(data || []);
    } catch (err) {
      console.error("Failed to load vibes", err);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ❤️ LIKE VIBE
  // ===============================
  const handleLike = async (vibeId) => {
    await vibeService.likeVibe(vibeId);
    loadVibes();
  };

  // ===============================
  // 💬 COMMENT VIBE
  // ===============================
  const handleComment = async (vibeId, text) => {
    if (!text) return;
    await vibeService.commentVibe(vibeId, text);
    loadVibes();
  };

  if (loading) return <Loader label="Loading vibes..." />;

  return (
    <div className="vibe-feed">
      {/* ===============================
          VIBE CARDS
      =============================== */}
      {vibes.map((vibe) => (
        <div key={vibe.id} className="vibe-card">
          {/* USER */}
          <div className="vibe-header">
            <img
              src={vibe.user_avatar || "/avatar.png"}
              alt={vibe.username}
              className="avatar"
            />
            <div>
              <strong>{vibe.username}</strong>
              <span className="time">{vibe.time_ago}</span>
            </div>
          </div>

          {/* CONTENT */}
          <div
            className="vibe-content"
            style={{
              background: vibe.background || "#111",
              color: vibe.text_color || "#fff",
              fontFamily: vibe.font || "inherit",
            }}
            onClick={() => setActiveVibe(vibe)}
          >
            {vibe.text && <p>{vibe.text}</p>}

            {vibe.song && (
              <div className="vibe-song">
                🎵 {vibe.song.title} — {vibe.song.artist}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="vibe-actions">
            <button onClick={() => handleLike(vibe.id)}>
              ❤️ {vibe.likes || 0}
            </button>
            <button onClick={() => setActiveVibe(vibe)}>
              💬 {vibe.comments?.length || 0}
            </button>
            <button>✨</button>
          </div>
        </div>
      ))}

      {/* ===============================
          VIBE MODAL (STORY VIEW)
      =============================== */}
      <Modal
        open={!!activeVibe}
        onClose={() => setActiveVibe(null)}
        size="fullscreen"
      >
        {activeVibe && (
          <div
            className="vibe-viewer"
            style={{
              background: activeVibe.background,
              color: activeVibe.text_color,
              fontFamily: activeVibe.font,
            }}
          >
            <h2>{activeVibe.text}</h2>

            {activeVibe.song && (
              <p>
                🎶 {activeVibe.song.title} — {activeVibe.song.artist}
              </p>
            )}

            {/* COMMENTS */}
            <div className="vibe-comments">
              {activeVibe.comments?.map((c) => (
                <div key={c.id}>
                  <strong>{c.user}</strong> {c.text}
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={() => handleLike(activeVibe.id)}
            >
              ❤️ Like
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VibeFeed;
