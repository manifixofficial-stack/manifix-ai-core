// src/pages/Landing.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay" />

      <section className="landing-top">
        <img src={logo} alt="ManifiX Logo" className="main-logo" />
        <h1 className="brand-name">ManifiX</h1>
        <p className="brand-tagline">
          Master Your Mind. Elevate Your Energy. Transform Your Life.
        </p>
      </section>

      <section className="landing-hero">
        <h2 className="hero-title">16 Minutes. Infinite Power.</h2>

        <p className="hero-description">
          Unlock clarity, discipline, and abundance using AI-guided rituals
          designed for high performers and future leaders.
        </p>

        <div className="cta-container">
          <button
            className="landing-button primary"
            onClick={() => navigate("/login")}
          >
            Start Free →
          </button>

          <button
            className="landing-button secondary"
            onClick={() => navigate("/login")}
          >
            Already a Member?
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} ManifiX. All rights reserved.
      </footer>
    </div>
  );
}
