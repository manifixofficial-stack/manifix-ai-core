import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import "../styles/Home.css";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <div className="home-elite">
      <Helmet>
        <title>ManifiX AI | The 16-Day Neural Discipline System</title>
        <meta name="description" content="Most people quit. Our AI ensures you don't." />
      </Helmet>

      {/* --- HERO: THE PSYCHOLOGICAL HOOK --- */}
      <section className="hero-pro">
        <motion.div 
          className="gold-glow-effect"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />

        <div className="hero-content">
          <img src={logo} alt="ManifiX" className="elite-logo" />

          <h1 className="hero-title">
            Stop negotiating with your <span className="gold-text">Weakness</span>. <br />
            <span className="sub-gold">Let AI Engineer your Discipline.</span>
          </h1>

          <p className="hero-sub">
            The world's first **AI-Verified** 16-day loop. <br />
            Miss a day → The system resets your identity to Day 1.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="btn-gold-action pulse">
              ENTER THE 16-DAY LOOP →
            </Link>
            <p className="urgency-text">⚠️ High-performance slots are limited by AI compute.</p>
          </div>
        </div>
      </section>

      {/* --- TECH PROOF: THE AI EYES --- */}
      <section className="ai-verification-section">
        <div className="ai-proof-card">
          <h3>👁️ AI-VISION VERIFICATION</h3>
          <p>We don't take your word for it. Our AI tracks your movement to verify your daily 16-minute commitment. **True discipline requires proof.**</p>
        </div>
      </section>

      {/* --- TRANSFORMATION TIMELINE --- */}
      <section className="timeline-phases">
        <h2 className="gold-text">The 16-Day Evolution</h2>
        <div className="phase-grid">
          {[
            { t: "PHASE I: RESISTANCE", d: "Days 1–4: Your brain fights the new neural path." },
            { t: "PHASE II: ADAPTATION", d: "Days 5–10: Discipline becomes a default setting." },
            { t: "PHASE III: MASTERY", d: "Days 11–16: You enter the Top 1% Global Rank." }
          ].map((f, i) => (
            <motion.div key={i} className="phase-card" whileHover={{ y: -10 }}>
              <h4 className="gold-text">{f.t}</h4>
              <p>{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- STATUS BLOCK --- */}
      <section className="status-cta">
        <div className="cta-glass-box">
          <h2>₹1,999/mo for an Unstoppable Mind.</h2>
          <p>Join Arjun, Priya, and 4,000+ high-performers already in the loop.</p>
          <Link to="/signup" className="btn-gold-big">GET STARTED NOW</Link>
        </div>
      </section>

      <footer className="elite-footer">
        © {new Date().getFullYear()} MANIFIX AI • POWERED BY NEURAL DISCIPLINE
      </footer>
    </div>
  );
}
