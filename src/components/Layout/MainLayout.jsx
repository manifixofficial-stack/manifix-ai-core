import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css"; // Correct path

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showOptions, setShowOptions] = useState(false);
  const [groupChatOpen, setGroupChatOpen] = useState(false);

  const isChatPage = location.pathname === "/gpt";
  const isBillingPage = location.pathname === "/billing";
  const isMagic16Page = location.pathname === "/magic16";

  return (
    <div className="main-layout">
      {/* Top Header */}
      <header className="main-header">
        <h1 className="logo" onClick={() => navigate("/")}>
          ManifiX
        </h1>

        {/* Contextual right buttons */}
        <div className="header-actions">
          {isChatPage && (
            <button className="add-chat-btn" title="New Chat">
              ➕
            </button>
          )}
          {isBillingPage && (
            <>
              <button className="premium-btn">⭐ Premium</button>
              <div className="more-options">
                <button
                  onClick={() => setShowOptions(prev => !prev)}
                  aria-label="More options"
                >
                  ⋮
                </button>
                {showOptions && (
                  <div className="dropdown">
                    <button onClick={() => alert("Share Chat")}>📤 Share</button>
                    <button onClick={() => alert("Start Group Chat")}>
                      👥 Group Chat
                    </button>
                    <button onClick={() => alert("Delete Chat")}>🗑 Delete</button>
                  </div>
                )}
              </div>
            </>
          )}
          {isMagic16Page && (
            <button className="magic16-btn" title="Magic16">
              ✨ Magic16
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Optional footer */}
      <footer className="main-footer">
        <span>© {new Date().getFullYear()} ManifiX</span>
      </footer>
    </div>
  );
}
