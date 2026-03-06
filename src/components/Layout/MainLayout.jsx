// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css"; // Make sure CSS is updated for this layout

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showOptions, setShowOptions] = useState(false);

  // Determine current page
  const currentPath = location.pathname;
  const isChatPage = currentPath === "/gpt";
  const isMagic16Page = currentPath === "/magic16";

  return (
    <div className="main-layout">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo" onClick={() => navigate("/")}>
          ManifiX
        </div>
        <div className="top-actions">
          <input
            type="text"
            placeholder="Search..."
            className="top-search"
          />
          <button title="Voice AI">🎤</button>
          <button title="Notifications">🔔</button>
          <div className="profile">👤</div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <button onClick={() => navigate("/gpt")}>➕ New Chat</button>
          <button onClick={() => navigate("/gpt")}>💬 Chats</button>
          <button onClick={() => navigate("/magic16")}>✨ Magic16</button>
          <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
          <button onClick={() => navigate("/journal")}>📓 Journal</button>
          <button onClick={() => navigate("/settings")}>⚙️ Settings</button>
        </aside>

        {/* Main Workspace */}
        <main className="main-workspace">
          <Outlet />
        </main>
      </div>

      {/* Bottom Input Bar: Only for GPT */}
      {isChatPage && (
        <footer className="bottom-input-bar">
          <button>📎</button>
          <button>🎤</button>
          <input type="text" placeholder="Type a message..." />
          <button>➤</button>
        </footer>
      )}
    </div>
  );
}
