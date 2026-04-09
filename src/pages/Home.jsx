import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";

import "../styles/Home.css";
import logo from "../assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
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

      {/* ================= BACKGROUND PARTICLES ================= */}
      <Particles
        className="particles-bg"
        options={{
          fpsLimit: 60,
          particles: {
            number: { value: 60 },
            size: { value: 3 },
            move: { speed: 1, direction: "none" },
            color: { value: ["#ff6ec4", "#7873f5", "#4ade80", "#facc15"] },
            opacity: { value: 0.6 },
            links: { enable: true, distance: 150, color: "#ffffff", opacity: 0.1, width: 1 },
          },
          interactivity: { events: { onhover: { enable: true, mode: "repulse" } } },
        }}
      />

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
            Transform Your Life in 16 Minutes <br />
            <span>With ManifiX AI</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            A simple daily system to improve your focus, clarity, and discipline.
          </motion.p>

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
          transition={{ duration: 0.6 }}
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
