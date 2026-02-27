/* ==========================================================
 * ManifiX — ChatInput Component
 * ----------------------------------------------------------
 * Responsibilities:
 * - Text input for chat
 * - Send message action
 * - Voice input (STT) via VoiceService
 * - Mobile & Desktop optimized
 * - Clean, fast, emotional UX
 * ========================================================== */

import React, { useState } from "react";
import voiceService from "../../services/voice.service.js";

const ChatInput = ({ onSend, disabled = false, language = "en-US" }) => {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);

  // ===============================
  // 🚀 SEND MESSAGE
  // ===============================
  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  // ===============================
  // ⌨️ ENTER KEY HANDLER
  // ===============================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===============================
  // 🎤 TOGGLE VOICE INPUT
  // ===============================
  const toggleVoice = () => {
    if (listening) {
      voiceService.stopSTT();
      setListening(false);
    } else {
      voiceService.startSTT({
        language,
        onResult: (spokenText) => {
          setText((prev) => `${prev} ${spokenText}`);
        },
      });
      setListening(true);
    }
  };

  return (
    <div className="chat-input-container">
      <button
        className={`mic-btn ${listening ? "active" : ""}`}
        onClick={toggleVoice}
        aria-label="Voice input"
      >
        🎤
      </button>

      <textarea
        className="chat-input"
        placeholder="Type a message…"
        value={text}
        rows={1}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        className="send-btn"
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        aria-label="Send message"
      >
        ➤
      </button>
    </div>
  );
};

export default ChatInput;
