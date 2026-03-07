// src/layouts/MainLayout.jsx
import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css";

// Assets
import logoImg from "../../assets/logo.png";
import uploadIcon from "../../assets/upload.png";
import copyIcon from "../../assets/copy.png";
import micIcon from "../../assets/mic.png";
import shareIcon from "../../assets/share.png";
import binIcon from "../../assets/bin.png"; 

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState(location.pathname);
  const [showTopDropdown, setShowTopDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTopDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync activeMenu when route changes
  useEffect(() => {
    setActiveMenu(location.pathname);
  }, [location.pathname]);

  const menuItems = [
    { name: "New Chat", path: "/app/gpt" },
    { name: "Magic16", path: "/app/magic16" },
    { name: "Landing", path: "/" },
    { name: "Billing", path: "/app/billing" },
    { name: "Feedback", path: "/app/feedback" },
  ];

  return (
    <div className="main-layout">
      {/* ---------- TopBar ---------- */}
      <header className="topbar">
        <div className="topbar-left" onClick={() => navigate("/")}>
          <img src={logoImg} alt="ManifiX Logo" className="logo" />
        </div>
        <div className="topbar-center">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
          />
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="Voice AI">
            <img src={micIcon} alt="Voice AI" />
          </button>
          <div className="profile-dropdown" ref={dropdownRef}>
            <button
              className="icon-btn"
              onClick={() => setShowTopDropdown((prev) => !prev)}
            >
              {/* Removed profile icon, can add text or placeholder */}
              Profile
            </button>
            {showTopDropdown && (
              <div className="dropdown-menu">
                <button onClick={() => navigate("/app/settings")}>
                  Settings
                </button>
                <button onClick={() => alert("Logout")}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------- BODY ---------- */}
      <div className="body-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-btn ${
                activeMenu === item.path ? "active" : ""
              }`}
              onClick={() => {
                navigate(item.path);
                setActiveMenu(item.path);
              }}
            >
              {item.name}
            </button>
          ))}
        </aside>

        {/* Main Workspace */}
        <main className="workspace">
          <Outlet />
        </main>
      </div>

      {/* ---------- Bottom Input Bar ---------- */}
      {activeMenu === "/app/gpt" && (
        <footer className="bottom-bar">
          <button className="icon-btn">
            {/* Removed attach icon, can leave empty or text */}
            📎
          </button>
          <button className="icon-btn">
            <img src={micIcon} alt="Voice" />
          </button>
          <input
            type="text"
            placeholder="Type your message..."
            className="message-input"
          />
          <button className="send-btn">➤</button>
        </footer>
      )}
    </div>
  );
}
