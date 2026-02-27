/* ==========================================================
 * ManifiX — Vibe Create
 * ----------------------------------------------------------
 * Create a new Vibe (text, mood, song, font, privacy)
 * Minimal, emotional, mobile-first
 * ========================================================== */

import React, { useState } from "react";
import Button from "../UI/Button.jsx";
import VibePrivacyToggle from "./VibePrivacyToggle.jsx";

const VibeCreate = ({ onSubmit }) => {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [privacy, setPrivacy] = useState("public");

  const handleSubmit = () => {
    if (!text.trim()) return;

    onSubmit?.({
      text,
      mood,
      privacy,
    });

    setText("");
    setMood("");
    setPrivacy("public");
  };

  return (
    <div className="vibe-create">
      <textarea
        placeholder="What’s your vibe right now? ✨"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
      />

      <input
        type="text"
        placeholder="Mood (happy, calm, powerful…) 🌸"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />

      <VibePrivacyToggle value={privacy} onChange={setPrivacy} />

      <Button onClick={handleSubmit} full>
        ✨ Share Vibe
      </Button>
    </div>
  );
};

export default VibeCreate;
