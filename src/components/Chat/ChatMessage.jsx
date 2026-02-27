/* ==========================================================
 * ManifiX — ChatMessage Component
 * ----------------------------------------------------------
 * Responsibilities:
 * - Render single chat message
 * - Support user / assistant roles
 * - Multi-language + emoji friendly
 * - Timestamp support
 * - Smooth, elegant UI
 * ========================================================== */

import React from "react";

const ChatMessage = ({ role = "assistant", content = "", timestamp }) => {
  const isUser = role === "user";

  return (
    <div className={`chat-message ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="chat-avatar ai">
          💖
        </div>
      )}

      <div className="chat-bubble">
        <div className="chat-text">
          {content}
        </div>

        {timestamp && (
          <div className="chat-time">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="chat-avatar user">
          👤
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
