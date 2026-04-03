import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

import "../styles/Home.css";
import logo from "../assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
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
        <title>ManifiX – Think Clearly. Live With Clarity.</title>
        <meta
          name="description"
          content="ManifiX combines AI conversations with a 16-minute daily system to improve thinking, focus, and mental clarity."
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
            Think Clearly. <br />
            <span>Live With Clarity.</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            ManifiX combines AI conversations with a 16-minute daily system
            to improve your thinking, focus, and mental clarity.
          </motion.p>

          <motion.div
            className="hero-proof"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
            Trusted by creators, developers, and focused individuals worldwide
          </motion.div>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
          >
            <Link to="/signup" className="btn-primary">
              Start Free
            </Link>

            <Link to="/features" className="btn-secondary">
              Explore Features
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ================= CORE FEATURES ================= */}
      <section className="features">

        <div className="features-header">
          <h2>Two Systems. One Powerful Mind.</h2>
          <p>ManifiX combines intelligence and clarity into a single workflow.</p>
        </div>

        <div className="feature-grid">

          {/* AI SYSTEM */}
          <motion.div
            className="feature-card big"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
          >
            <h3>AI Conversations</h3>
            <p>
              Ask anything, think clearly, and get structured answers instantly.
              Designed to eliminate confusion and accelerate execution.
            </p>
          </motion.div>

          {/* MAGIC16 SYSTEM */}
          <motion.div
            className="feature-card big"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
          >
            <h3>Magic16 System</h3>
            <p>
              A daily 16-minute reset. Eight minutes of guided yoga and eight minutes
              of meditation that adapts to your moment and tracks your mental clarity score.
            </p>

            {/* DETAILS */}
            <div className="magic-details">
              <div>8 min Yoga — Body Activation</div>
              <div>8 min Meditation — Mind Clarity</div>
              <div>Real-time Detection — Understand your state</div>
              <div>Clarity Score — Track your progress</div>
            </div>

          </motion.div>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-it-works">

        <div className="how-header">
          <h2>How It Works</h2>
          <p>A simple system designed for clarity and execution.</p>
        </div>

        <div className="steps">

          <motion.div className="step" variants={fadeUp} initial="hidden" whileInView="show">
            <h3>01. Define</h3>
            <p>Describe what you want to achieve or solve.</p>
          </motion.div>

          <motion.div className="step" variants={fadeUp} initial="hidden" whileInView="show">
            <h3>02. Think</h3>
            <p>ManifiX structures your thinking with AI and Magic16.</p>
          </motion.div>

          <motion.div className="step" variants={fadeUp} initial="hidden" whileInView="show">
            <h3>03. Execute</h3>
            <p>Take action with clarity, confidence, and speed.</p>
          </motion.div>

        </div>

      </section>

      {/* ================= CTA ================= */}
      <section className="cta">

        <motion.div
          className="cta-container"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Your Mind Is Your Advantage.</h2>

          <p className="cta-subtext">
            Start using ManifiX to think better, stay focused, and perform at your best every day.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              Start Free Now
            </Link>
          </div>
        </motion.div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>

    </div>
  );
}
