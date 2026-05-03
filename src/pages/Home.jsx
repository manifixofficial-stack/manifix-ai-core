// src/pages/Home.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import "../styles/Home.css";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <div className="home">

      {/* ================= SEO ================= */}
      <Helmet>
        <title>ManifiX AI – 16 Day Discipline System</title>
        <meta
          name="description"
          content="Most people quit. This system doesn't let you."
        />
      </Helmet>

      {/* ================= HERO ================= */}
      <section className="hero">

        <motion.div
          className="hero-glow"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 5 }}
        />

        <div className="hero-content">

          <img src={logo} alt="ManifiX" className="hero-logo" />

          {/* 🔥 STRONG HOOK */}
          <h1 className="hero-title">
            You don’t lack motivation. <br />
            <span>You lack a system that forces you.</span>
          </h1>

          {/* 🧠 SUB */}
          <p className="hero-sub">
            ManifiX locks you into a 16-day discipline loop.  
            Miss a day → your progress resets.
          </p>

          {/* ⚠️ LOSS TRIGGER */}
          <p className="hero-warning">
            ⚠️ Break the streak → start again from Day 1
          </p>

          {/* 🎯 CTA */}
          <div className="hero-buttons">
            <Link to="/signup" className="btn-primary pulse">
              Start Day 1 →
            </Link>
            <p className="micro-text">Takes less than 60 seconds</p>
          </div>

        </div>
      </section>

      {/* ================= SOCIAL PROOF ================= */}
      <section className="proof">
        <p>🔥 People are already building discipline with ManifiX</p>
      </section>

      {/* ================= TRANSFORMATION ================= */}
      <section className="phases">
        <h2>What Happens In 16 Days</h2>

        <div className="feature-grid">
          {[
            { title: "Days 1–4", desc: "You struggle. Your brain resists." },
            { title: "Days 5–10", desc: "Discipline starts forming." },
            { title: "Days 11–16", desc: "You stop negotiating with yourself." },
            { title: "After", desc: "You become consistent by default." },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              whileHover={{ scale: 1.05 }}
            >
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= ADDICTION LOOP ================= */}
      <section className="loop">
        <h2>This is not motivation. This is control.</h2>

        <div className="feature-grid">
          {[
            "Daily streak tracking",
            "Zero excuses system",
            "Identity-based habit building",
            "AI pushes you forward",
          ].map((t, i) => (
            <div key={i} className="feature-card glow-card">
              ⚡ {t}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="cta">

        <div className="cta-box">
          <h2>You either start today… or stay the same.</h2>
          <p>No reminders. No chasing. Just results.</p>

          <Link to="/signup" className="btn-primary big pulse">
            🚀 Start Now
          </Link>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        © {new Date().getFullYear()} ManifiX AI
      </footer>

    </div>
  );
}
