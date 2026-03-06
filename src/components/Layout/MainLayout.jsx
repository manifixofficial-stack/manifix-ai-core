import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const isChatPage = location.pathname === "/gpt";

  return (
    <div className="layout">

      {/* TopBar */}
      <header className="topbar">

        <div className="topbar-left">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <h1 className="logo" onClick={() => navigate("/gpt")}>
            ManifiX
          </h1>
        </div>

        <div className="topbar-right">
          {isChatPage && (
            <button className="new-chat-btn">
              ➕ New Chat
            </button>
          )}

          <div className="more-options">
            <button onClick={() => setShowOptions(!showOptions)}>⋮</button>

            {showOptions && (
              <div className="dropdown">
                <button>📤 Share</button>
                <button>👥 Group Chat</button>
                <button>🗑 Delete</button>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* Body */}
      <div className="layout-body">

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="sidebar">

            <button onClick={() => navigate("/gpt")}>
              💬 GPT Chat
            </button>

            <button onClick={() => navigate("/magic16")}>
              ✨ Magic16
            </button>

            <button onClick={() => navigate("/dashboard")}>
              📊 Dashboard
            </button>

            <button onClick={() => navigate("/billing")}>
              ⭐ Premium
            </button>

          </aside>
        )}

        {/* Workspace */}
        <main className="workspace">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
