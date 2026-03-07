// src/components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";
import logo from "../assets/logo.png"; // App logo

export default function Header() {
  const navigate = useNavigate();

  return (
    <>
      {/* ---------- Top Header ---------- */}
      <header className="gpt-header">
        <div className="logo-container" onClick={() => navigate("/")}>
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1 className="header-title">ManifiX</h1>
        </div>

        <div className="header-buttons">
          {/* Upgrade Button */}
          <button
            className="header-text-btn"
            onClick={() => navigate("/app/billing")}
            aria-label="Upgrade"
          >
            Upgrade
          </button>

          {/* Magic16 Circle Button */}
          <button
            className="new-chat-circle"
            onClick={() => navigate("/app/magic16")}
            title="Magic16"
            aria-label="Open Magic16"
          >
            Magic16✨
          </button>
        </div>
      </header>

      {/* ---------- Left Side Fixed Feedback ---------- */}
      <button
        className="fixed-feedback-text"
        onClick={() => navigate("/app/feedback")}
        aria-label="Feedback"
      >
        Feedback
      </button>
    </>
  );
}
