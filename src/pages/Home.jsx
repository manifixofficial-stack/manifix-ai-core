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
        <title>ManifiX AI – 16 Day Discipline Transformation</title>
        <meta
          name="description"
          content="A 16-day system that forces discipline, focus, and identity change."
        />
      </Helmet>

      {/* ================= HERO ================= */}
      <section className="hero">

        <motion.div
          className="hero-glow"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ repeat: Infinity, duration: 4 }}
        />

        <div className="hero-content">

          <motion.img
            src={logo}
            alt="ManifiX"
            className="hero-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* 🔥 MAIN HOOK */}
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Most people quit in 3 days.
            <br />
            This AI doesn’t let you.
          </motion.h1>

          {/* 🧠 SUB HOOK */}
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            16-day discipline system that rewires your focus, habits, and identity.
          </motion.p>

          {/* ⚠️ URGENCY */}
          <motion.p
            className="hero-warning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            If you quit → your streak resets to zero
          </motion.p>

          {/* 🎯 CTA */}
          <motion.div
            className="hero-buttons"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="/signup" className="btn-primary pulse">
              Start Day 1 → Change Your Life
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ================= TRANSFORMATION ================= */}
      <section className="phases">

        <h2>16-Day Transformation System</h2>

        <div className="feature-grid">

          {[
            {
              title: "Days 1–4",
              desc: "You fight resistance and laziness",
            },
            {
              title: "Days 5–10",
              desc: "Your brain starts building discipline",
            },
            {
              title: "Days 11–16",
              desc: "Your identity permanently changes",
            },
            {
              title: "Final Result",
              desc: "You become someone who doesn’t quit",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* ================= OUTCOME ================= */}
      <section className="outcomes">

        <h2>What Changes in 16 Days</h2>

        <div className="feature-grid">

          {[
            "You stop delaying tasks",
            "You build daily discipline",
            "You reduce mental noise",
            "You gain control over habits",
          ].map((text, i) => (
            <motion.div
              key={i}
              className="feature-card glow-card"
              whileHover={{ scale: 1.05 }}
            >
              ⚡ {text}
            </motion.div>
          ))}

        </div>

      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="cta">

        <motion.div
          className="cta-box"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >

          <h2>
            Start Your 16-Day Reset
          </h2>

          <p>
            If you don’t start today — nothing changes.
          </p>

          <Link to="/signup" className="btn-primary big pulse">
            🚀 Start Day 1 Now
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
