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
        <title>ManifiX AI – The Anti-Quit System</title>
        <meta
          name="description"
          content="A system that forces discipline. Miss one day → restart from zero."
        />
      </Helmet>

      {/* ================= HERO ================= */}
      <section className="hero">

        <div className="hero-content">

          <motion.img
            src={logo}
            alt="ManifiX"
            className="hero-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          />

          {/* 🔥 HARD HOOK */}
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Quit once.
            <br />
            You go back to Day 0.
          </motion.h1>

          {/* ⚠️ POSITIONING */}
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            This is not a habit tracker.
            <br />
            This is a <b>no-escape discipline system.</b>
          </motion.p>

          {/* 📊 SOCIAL PROOF */}
          <motion.p
            className="hero-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            12,481 people started this week — 73% already failed.
          </motion.p>

          {/* 🎯 CTA */}
          <motion.div
            className="hero-buttons"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Link to="/signup" className="btn-primary pulse">
              Start Day 1 →
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ================= LIVE SYSTEM PREVIEW ================= */}
      <section className="system-preview">

        <h2>This is what happens on Day 1</h2>

        <div className="system-box">

          <p className="system-warning">
            ⚠️ Miss today → you restart from zero
          </p>

          <div className="task">
            <span>Task 1</span>
            <p>10 min focus (no phone)</p>
          </div>

          <div className="task">
            <span>Task 2</span>
            <p>20 pushups OR 5 min movement</p>
          </div>

          <div className="task">
            <span>Task 3</span>
            <p>Write 3 things you avoided</p>
          </div>

          <div className="progress">
            Progress: 0 / 3
          </div>

        </div>

      </section>

      {/* ================= GAME MECHANIC ================= */}
      <section className="game">

        <h2>16-Day System</h2>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>Phase 1</h3>
            <p>Days 1–4 → Resistance</p>
          </div>

          <div className="feature-card">
            <h3>Phase 2</h3>
            <p>Days 5–10 → Discipline</p>
          </div>

          <div className="feature-card danger">
            <h3>Day 7</h3>
            <p>⚠️ Boss Level (Most Fail Here)</p>
          </div>

          <div className="feature-card">
            <h3>Phase 3</h3>
            <p>Days 11–16 → Identity Shift</p>
          </div>

        </div>

      </section>

      {/* ================= FAILURE SECTION ================= */}
      <section className="failure">

        <h2>If You Quit</h2>

        <div className="feature-grid">

          <div className="feature-card">
            💀 Your streak resets to 0
          </div>

          <div className="feature-card">
            🔒 You lose all progress
          </div>

          <div className="feature-card">
            ⚠️ You start again from Day 1
          </div>

        </div>

      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="cta">

        <motion.div
          className="cta-box"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >

          <h2>Still think you won’t quit?</h2>

          <p>
            Prove it. Start Day 1.
          </p>

          <Link to="/signup" className="btn-primary big pulse">
            🚀 Enter the System
          </Link>

        </motion.div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        © {new Date().getFullYear()} ManifiX AI
      </footer>

    </div>
  );
}
