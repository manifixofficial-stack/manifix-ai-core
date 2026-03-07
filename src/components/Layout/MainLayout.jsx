// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css";
import logoImg from "../../assets/logo.png";
import shareIcon from "../../assets/share.png";
import teamIcon from "../../assets/team.png";
import binIcon from "../../assets/bin.png";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showOptions, setShowOptions] = useState(false);
  const dropdownRef = useRef(null);

  const isChatPage = location.pathname === "/gpt";
  const isBillingPage = location.pathname === "/billing";
  const isMagic16Page = location.pathname === "/magic16";

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="main-layout">
      {/* ---------- Header ---------- */}
      <header className="main-header">
        <div className="header-left" onClick={() => navigate("/")}>
          <img src={logoImg} alt="ManifiX Logo" className="logo" />
          <h1 className="app-title">ManifiX</h1>
        </div>

        <div className="header-right">
          {isChatPage && (
            <button
              className="gradient-btn"
              title="New Chat"
              onClick={() => navigate("/gpt")}
            >
              ➕ New Chat
            </button>
          )}

          {isBillingPage && (
            <div className="billing-actions">
              <button className="gradient-btn premium-btn">⭐ Premium</button>
              <div className="more-options" ref={dropdownRef}>
                <button
                  className="gradient-btn"
                  onClick={() => setShowOptions((prev) => !prev)}
                  aria-label="More options"
                >
                  ⋮
                </button>
                {showOptions && (
                  <div className="dropdown-menu">
                    <button onClick={() => alert("Share Chat")}>
                      <img src={shareIcon} alt="Share" className="dropdown-icon" /> Share
                    </button>
                    <button onClick={() => alert("Start Group Chat")}>
                      <img src={teamIcon} alt="Group" className="dropdown-icon" /> Group Chat
                    </button>
                    <button onClick={() => alert("Delete Chat")}>
                      <img src={binIcon} alt="Delete" className="dropdown-icon" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isMagic16Page && (
            <button className="gradient-btn magic16-btn" title="Magic16">
              ✨ Magic16
            </button>
          )}
        </div>
      </header>

      {/* ---------- Main Content ---------- */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="main-footer">
        <span>© {new Date().getFullYear()} ManifiX</span>
      </footer>
    </div>
  );
}
