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
            Think Faster. Build Smarter. <br />
            <span>With ManifiX AI</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            AI + Magic16 system designed for creators, developers,
            and teams who want clarity, speed, and control.
          </motion.p>

          {/* 🔥 TRUST BOOST */}
          <motion.div
            className="hero-proof"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
            Fast • Secure • Built for high performers
          </motion.div>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
          >
            <Link to="/signup" className="btn-primary">
              Start Free →
            </Link>

            <Link to="/features" className="btn-secondary">
              Explore Features
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
            { icon: "⚡", title: "AI Thinking", desc: "Instant answers & execution" },
            { icon: "🧠", title: "Deep Focus", desc: "Distraction-free workflow" },
            { icon: "🔥", title: "Magic16", desc: "Daily clarity system" },
            { icon: "🚀", title: "Speed", desc: "Blazing fast performance" },
            { icon: "🔒", title: "Security", desc: "Safe & private platform" },
            { icon: "🌍", title: "Global", desc: "Built for everyone" },
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
              <div className="feature-icon">{f.icon}</div>
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
            Build Your Future With <span>ManifiX</span>
          </h2>

          <p className="cta-subtext">
            Start free. Upgrade anytime. No limits on your growth.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              Create Free Account
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
