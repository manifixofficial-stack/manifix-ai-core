import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from "../../../assets/logo.png"; // Make sure logo path is correct
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState("dark");
  const [showOptions, setShowOptions] = useState(false);

  const isChatPage = location.pathname === "/gpt";
  const isMagic16Page = location.pathname === "/magic16";
  const isBillingPage = location.pathname === "/billing";

  return (
    <div className={`main-layout ${theme}`}>
      {/* Top Header */}
      <header className="main-header">
        <div className="logo-container" onClick={() => navigate("/")}>
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1>ManifiX</h1>
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link to="/gpt">💬 Chat</Link>
          <Link to="/magic16">🧘 Magic16</Link>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          {isChatPage && (
            <button className="add-chat-btn" title="New Chat">
              ➕
            </button>
          )}
          {isMagic16Page && (
            <button className="magic16-btn" title="Magic16">
              ✨ Magic16
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

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Theme"
          >
            🌓
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <span>© {new Date().getFullYear()} ManifiX</span>
      </footer>
    </div>
  );
}
