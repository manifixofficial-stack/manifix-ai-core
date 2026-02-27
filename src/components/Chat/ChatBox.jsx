/* ==========================================================
 * ManifiX — ChatBox Component
 * ----------------------------------------------------------
 * Responsibilities:
 * - Render chat messages (user + AI)
 * - Auto-scroll to latest message
 * - Support text, emojis, multi-language
 * - Optimized for high performance (billions of users)
 * - Mobile & Desktop responsive
 * ========================================================== */

import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";

const ChatBox = ({ messages = [], isTyping = false }) => {
  const chatEndRef = useRef(null);

  // ===============================
  // 🔄 AUTO SCROLL TO BOTTOM
  // ===============================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="chatbox-container">
      <div className="chatbox-messages">
        {messages.length === 0 && (
          <div className="chatbox-empty">
            💖 Start a conversation with ManifiX
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            role={msg.role}          // "user" | "assistant"
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isTyping && (
          <div className="chat-typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;
