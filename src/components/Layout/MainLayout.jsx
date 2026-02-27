// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import icons from "../../assets/icons";
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const [showMagic, setShowMagic] = useState(false);
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="layout-container">

      <header className="main-header">
        <div className="header-left">
          <img src="/logo.png" alt="ManifiX Logo" className="header-logo" />
          <h1 className="header-title">ManifiX</h1>
        </div>
      </header>

      <div className="main-body">

        <aside className="left-sidebar">
          <button className="side-btn">
            <img src={Icons.profile} alt="Profile" />
            <span>Profile</span>
          </button>

          <button className="side-btn">
            <img src={Icons.feed} alt="Vibe" />
            <span>Vibe</span>
          </button>
        </aside>

        <main className="center-content">
          <div className="star-container">
            <img src={Icons.starFilled} alt="Star" className="center-star" />
          </div>

          <Outlet />

          <div className="chat-bar">
            <input
              type="text"
              placeholder="Type your message..."
              className="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="send-btn">
              <img src={Icons.send} alt="Send" />
            </button>
          </div>
        </main>
      </div>

      <button
        className="magic16-btn"
        onClick={() => setShowMagic(true)}
      >
        <img src={Icons.magic16} alt="Magic16" />
        Magic16
      </button>

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
