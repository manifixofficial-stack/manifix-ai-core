import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

import "../styles/Home.css";
import logo from "../assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

export default function Home() {
  return (
    <div className="home">

      {/* ================= SEO ================= */}
      <Helmet>
        <title>ManifiX AI – Future of AI Productivity</title>
        <meta
          name="description"
          content="ManifiX AI helps creators and teams think faster, build smarter, and stay focused with GPT + Magic16."
        />
      </Helmet>

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">

          <motion.img
            src={logo}
            alt="ManifiX"
            className="hero-logo"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
          />

          <motion.h1
            className="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
          >
            Your Life Changes in 16 Minutes a Day. <br />
            <span>With ManifiX AI</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
             A simple 16-minute daily system to improve your focus, clarity, and discipline.
          </motion.p>

          {/* 🔥 TRUST BOOST */}
          <motion.div
            className="hero-proof"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
           Magic16 • Daily Score • Guided Flow
          </motion.div>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
          >
            <Link to="/signup" className="btn-primary">
             Start Your 16-Min Routine →
            </Link>

            <Link to="/features" className="btn-secondary">
              Start Your 16-Min Routine →
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features">

        <div className="features-header">
          <h2>Why ManifiX Wins</h2>
          <p>Everything you need to think clearly and execute faster.</p>
        </div>

        <div className="feature-grid">

         {[
  { title: "Magic16 Routine", desc: "16-minute daily system to build focus" },
  { title: "Daily Score", desc: "Track your discipline every day" },
  { title: "Guided Flow", desc: "Yoga + meditation with AI support" },
  { title: "AI Coach", desc: "Ask anything and get instant clarity" },
].map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
            >
             
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta">

        <motion.div
          className="cta-container"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>
          Start Your 16-Minute Routine Today <span>ManifiX</span>
          </h2>

          <p className="cta-subtext">
           Experience focus, clarity, and discipline daily.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              Start Your 16-Min Routine →
            </Link>
          </div>
        </motion.div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} ManifiX AI</p>
      </footer>

    </div>
  );
}
