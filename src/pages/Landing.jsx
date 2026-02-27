// src/pages/Landing.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import authService from "../services/auth.service";

import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  // 🔐 Auto-redirect if already logged in
  useEffect(() => {
    try {
      const user = authService?.getCurrentUser?.();
      if (user) {
        navigate("/app/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Landing auth check failed:", error);
    }
  }, [navigate]);

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay" />

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="landing-top">
        <img src={logo} alt="ManifiX Logo" className="main-logo" />

        <h1 className="brand-name">ManifiX</h1>

        <p className="brand-tagline">
          Master Your Mind. Elevate Your Energy. Transform Your Life.
        </p>
      </section>

      {/* ---------------- CORE VALUE SECTION ---------------- */}
      <section className="landing-hero">
        <h2 className="hero-title">
          16 Minutes. Infinite Power.
        </h2>

        <p className="hero-description">
          Unlock clarity, discipline, and abundance using AI-guided rituals
          designed for high performers and future leaders.
        </p>

        <div className="hero-features">

          <div className="feature">
            <h3>Magic16 Ritual</h3>
            <p>
              8 minutes meditation + 8 minutes reflection.
              Rewire your focus daily.
            </p>
          </div>

          <div className="feature">
            <h3>AI Coach</h3>
            <p>
              Ask deep questions. Get intelligent, contextual guidance.
            </p>
          </div>

          <div className="feature">
            <h3>Vibe Tracking</h3>
            <p>
              Monitor your energy, patterns, and growth trajectory.
            </p>
          </div>

        </div>

        {/* CTA SECTION */}
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

        <p className="landing-quote">
          Built for creators. Designed for leaders. Trusted by visionaries.
        </p>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} ManifiX. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
