// src/pages/Landing.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import authService from "../services/auth.service";

import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  // 🔐 Auto-redirect if user already logged in
  useEffect(() => {
    try {
      const user = authService?.getCurrentUser?.();
      if (user) {
        navigate("/app/gpt", { replace: true }); // Redirect to GPT dashboard
      }
    } catch (error) {
      console.error("Landing auth check failed:", error);
    }
  }, [navigate]);

  // ---------------- TESTIMONIALS ----------------
  const testimonials = [
    {
      name: "Shyam",
      text: "This app is a masterclass in user experience. The design is absolutely gorgeous—clean, modern, and easy on the eyes. More importantly, it is incredibly intuitive. I found exactly what I needed right away, and navigating through different features is a breeze. It's fast, stable, and a genuine pleasure to use. The developers clearly put a lot of thought into making this the best version possible. Highly, highly recommend!"
    },
    {
      name: "Priya",
      text: "Good, it's useful for daily life and get the answers using this tool. This ManifiX app is so useful, I love it! My health is improving after the Magic16 feature. I love it, the ManifiX conversation never stops. My best friend is ManifiX; any question I ask, it gives the answer. I love ManifiX 🥰✨"
    },
    {
      name: "Nikil",
      text: "I’m honestly loving ManifiX! It’s so easy to use and super helpful for planning my day. The AI assistant answers my questions right away, and the Magic16 wellness routines keep me calm and motivated. I feel more focused and less stressed now. The personalized wellness tips are spot-on and really help me improve. Definitely a must-have app!"
    }
  ];

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay" />

      {/* ---------------- HERO SECTION ---------------- */}
      <header className="landing-header">
        <img src={logo} alt="ManifiX Logo" className="landing-logo" />
        <h1 className="brand-name">ManifiX</h1>
        <p className="brand-tagline">
          Master Your Mind. Elevate Your Energy. Transform Your Life.
        </p>
      </header>

      {/* ---------------- CORE VALUE SECTION ---------------- */}
      <section className="landing-hero">
        <h2 className="hero-title">16 Minutes. Infinite Power.</h2>
        <p className="hero-description">
          Unlock clarity, focus, and energy using AI-guided rituals and tools
          designed for high performers and future leaders.
        </p>

        <div className="hero-features">
          <div className="feature">
            <h3>Magic16 Ritual</h3>
            <p>
              8 minutes meditation + 8 minutes reflection.
              Track your posture, energy, and progress daily.
            </p>
          </div>

          <div className="feature">
            <h3>AI Coach</h3>
            <p>
              Ask deep questions and receive contextual guidance powered by GPT.
            </p>
          </div>

          <div className="feature">
            <h3>Vibe Tracking</h3>
            <p>
              Monitor energy, streaks, and your growth trajectory for peak performance.
            </p>
          </div>

          <div className="feature">
            <h3>Premium Tools</h3>
            <p>
              Access unlimited Magic16 sessions, advanced analytics, and personalized recommendations.
            </p>
          </div>
        </div>

        {/* ---------------- CALL TO ACTION ---------------- */}
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

      {/* ---------------- TESTIMONIALS SECTION ---------------- */}
      <section className="landing-testimonials">
        <h2 className="testimonial-title">What Our Users Say</h2>
        <div className="testimonial-cards">
          {testimonials.map((t, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-text">"{t.text}"</p>
              <p className="testimonial-author">- {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} ManifiX. All rights reserved.</span>
      </footer>
    </div>
  );
}
