import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion"; // Added for high-end feel

import logo from "../assets/logo.png";
import Balatro from "../components/Balatro"; 

import authService from "../services/auth.service";
import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const testimonialRef = useRef(null);

  useEffect(() => {
    try {
      const user = authService?.getCurrentUser?.();
      if (user) navigate("/app/magic16", { replace: true });
    } catch (error) { console.error(error); }
  }, [navigate]);

  const testimonials = [
    { name: "Shyam", role: "Product Designer", text: "The UI is pure 2026. The most intuitive AI system I've used." },
    { name: "Priya", role: "Wellness Advocate", text: "Magic16 saved my focus. The AI conversation never stops helping." },
    { name: "Nikil", role: "Founder", text: "A must-have for anyone serious about their daily discipline." }
  ];

  return (
    <div className="landing-container">
      <Helmet>
        <title>ManifiX AI | The Gold Standard of Human Discipline</title>
        {/* ... existing meta tags ... */}
      </Helmet>

      <div className="background-wrapper"><Balatro /></div>
      <div className="overlay" />

      {/* --- ELITE NAVIGATION --- */}
      <nav className="elite-nav">
        <img src={logo} alt="ManifiX" className="nav-logo" />
        <Link to="/login" className="nav-login">MEMBER LOGIN</Link>
      </nav>

      {/* --- HERO SECTION: THE STATUS HOOK --- */}
      <header className="landing-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="founder-badge">🏆 JOIN THE FOUNDER'S CLUB 2026</div>
          <h1 className="hero-main-title">
            Master Your Life in <span className="gold-text">16 Minutes</span>.
          </h1>
          <p className="hero-sub">
            The world's first AI-Verified discipline system. Focus better. Win faster.
          </p>
        </motion.div>

        <div className="cta-group">
          <Link to="/signup" className="btn-gold">START YOUR 16-MIN EVOLUTION →</Link>
          <p className="spots-left">⚠️ 12 spots left in your region at ₹1,999</p>
        </div>
      </header>

      {/* --- THE TECH SECTION: WHY IT'S WORTH BILLIONS --- */}
      <section className="tech-section">
        <div className="tech-card">
          <div className="icon">👁️</div>
          <h3>AI Vision Verification</h3>
          <p>Our neural networks track your yoga & meditation poses in real-time. No cheating. Just results.</p>
        </div>
        <div className="tech-card">
          <div className="icon">🌍</div>
          <h3>The 1% Global Leaderboard</h3>
          <p>Compete with high-performers globally. Earn your spot in the elite tier of human consistency.</p>
        </div>
        <div className="tech-card">
          <div className="icon">🤖</div>
          <h3>Grok-Class AI Coach</h3>
          <p>A 24/7 personal strategist that rewires your mindset using advanced GPT automation.</p>
        </div>
      </section>

      {/* --- SOCIAL PROOF: THE REPUTATION --- */}
      <section className="landing-testimonials" ref={testimonialRef}>
        <h2 className="section-title">Verified by the Elite</h2>
        <div className="testimonial-cards">
          {testimonials.map((t, index) => (
            <div key={index} className="testimonial-card">
              <p className="text">"{t.text}"</p>
              <p className="author">— {t.name}, <span className="gold-text">{t.role}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* --- PRICING REVEAL (The Anchor) --- */}
      <section className="pricing-preview">
        <h2>Premium Access</h2>
        <div className="price-box">
          <span className="amt">₹1,999</span>
          <span className="per">/month</span>
        </div>
        <p>Unlock Unlimited AI, Video Proofing, and Global Ranking.</p>
        <Link to="/signup" className="btn-gold-big">CLAIM YOUR MEMBERSHIP</Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Support</Link>
        </div>
        <span>© {new Date().getFullYear()} MANIFIX AI • BEYOND HUMAN LIMITS.</span>
      </footer>
    </div>
  );
}
