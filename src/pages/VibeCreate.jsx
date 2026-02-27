import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVibe } from "../hooks/useVibe";

export default function VibeCreate() {
  const navigate = useNavigate();
  const { createVibe } = useVibe();

  const [text, setText] = useState("");
  const [mood, setMood] = useState("happy");
  const [musicURL, setMusicURL] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text && !musicURL) {
      alert("Please add text or music for your vibe 🎵");
      return;
    }

    setLoading(true);
    try {
      await createVibe({ text, mood, musicURL });
      alert("Vibe shared successfully ✨");
      navigate("/vibe");
    } catch (err) {
      console.error("Create vibe error:", err);
      alert("Something went wrong 😔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vibe-create-container">
      <h1>Share Your Vibe 🌈</h1>

      <div>
        <label>Your Vibe</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How do you feel today?"
          rows={4}
        />
      </div>

      <div>
        <label>Mood</label>
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="excited">🤩 Excited</option>
          <option value="calm">😌 Calm</option>
          <option value="angry">😡 Angry</option>
        </select>
      </div>

      <div>
        <label>Music URL (optional)</label>
        <input
          type="url"
          value={musicURL}
          onChange={(e) => setMusicURL(e.target.value)}
          placeholder="Spotify / YouTube link"
        />
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Sharing..." : "Share Vibe"}
      </button>

      <button onClick={() => navigate("/vibe")}>Cancel</button>
    </div>
  );
}
