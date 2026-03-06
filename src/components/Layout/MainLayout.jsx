// src/components/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/MainLayout.css"; // Make sure your CSS matches this layout
import logo from "../../../assets/logo.png"; // Replace with your actual logo path

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isChatPage = location.pathname === "/gpt";
  const isMagic16Page = location.pathname === "/magic16";

  return (
    <div className={`main-layout ${theme}`}>
      {/* ───────────── TopBar ───────────── */}
      <header className="top-bar">
        <div className="top-left">
          <img
            src={logo}
            alt="ManifiX Logo"
            className="logo"
            onClick={() => navigate("/")}
          />
          <input
            type="text"
            placeholder="Search..."
            className="top-search"
          />
        </div>

        <div className="top-right">
          <button className="voice-ai-btn" title="Voice AI">🎤</button>
          <button className="notifications-btn" title="Notifications">🔔</button>
          <button className="profile-btn" title="Profile">👤</button>
          <button
            className="theme-toggle"
            title="Toggle Theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            🌓
          </button>
        </div>
      </header>

      <div className="layout-body">
        {/* ───────────── Sidebar ───────────── */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
          <button className="new-chat-btn" onClick={() => navigate("/gpt")}>➕ New Chat</button>

          <nav className="sidebar-nav">
            <Link to="/gpt" className={isChatPage ? "active" : ""}>💬 GPT Chat</Link>
            <Link to="/magic16" className={isMagic16Page ? "active" : ""}>🧘 Magic16</Link>
            <Link to="/dashboard">📊 Dashboard</Link>
            <Link to="/settings">⚙️ Settings</Link>
          </nav>
        </aside>

        {/* ───────────── Main Workspace ───────────── */}
        <main className="main-workspace">
          <Outlet />
        </main>
      </div>

      {/* ───────────── Bottom Input Bar (for GPT chat) ───────────── */}
      {isChatPage && (
        <footer className="bottom-input-bar">
          <button className="attach-btn">📎</button>
          <button className="voice-btn">🎤</button>
          <input type="text" placeholder="Type a message..." className="chat-input" />
          <button className="send-btn">➤</button>
        </footer>
      )}
    </div>
  );
}
