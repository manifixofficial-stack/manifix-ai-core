// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import icons from "../../assets/icons";
import Logo from "../../assets/logo.png";
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const [showMagic, setShowMagic] = useState(false);
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="layout-container">

      {/* Header */}
      <header className="main-header">
        <div className="header-left">
          <img src={Logo} alt="ManifiX Logo" className="header-logo" />
          <h1 className="header-title">ManifiX</h1>
        </div>
      </header>

      {/* Main Body */}
      <div className="main-body">

        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <button className="side-btn" onClick={() => navigate("/app/profile")}>
            <img src={icons.profile} alt="Profile" />
            <span>Profile</span>
          </button>

          <button className="side-btn" onClick={() => navigate("/app/vibe")}>
            <img src={icons.feed} alt="Vibe" />
            <span>Vibe</span>
          </button>

          <button className="side-btn" onClick={() => navigate("/app/gpt")}>
            <img src={icons.chat} alt="GPT" />
            <span>GPT</span>
          </button>
        </aside>

        {/* Center Content */}
        <main className="center-content">
          <div className="star-container">
            <img src={icons.starFilled} alt="Star" className="center-star" />
          </div>

          {/* Render nested routes */}
          <Outlet />

          {/* Chat Bar */}
          <div className="chat-bar">
            <input
              type="text"
              placeholder="Type your message..."
              className="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="send-btn">
              <img src={icons.send} alt="Send" />
            </button>
          </div>
        </main>
      </div>

      {/* Magic16 Button */}
      <button
        className="magic16-btn"
        onClick={() => setShowMagic(true)}
      >
        <img src={icons.magic16} alt="Magic16" />
        Magic16
      </button>

      {/* Magic16 Modal */}
      {showMagic && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Magic16 Ritual</h2>
            <p>8 Minutes Yoga + 8 Minutes Meditation</p>
            <button
              className="close-btn"
              onClick={() => setShowMagic(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
