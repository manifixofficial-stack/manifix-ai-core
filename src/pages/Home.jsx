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
        <title>ManifiX AI – Think Clearly. Execute Faster.</title>
        <meta
          name="description"
          content="ManifiX AI helps you eliminate overthinking, stay focused, and execute faster using AI and the Magic16 system."
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
            Stop Overthinking. <br />
            <span>Start Executing.</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            ManifiX AI helps creators, developers, and teams think clearly,
            act faster, and build without distraction using AI and the Magic16 system.
          </motion.p>

          {/* TRUST LINE */}
          <motion.div
            className="hero-proof"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
            Trusted by creators, developers, and high-performance teams worldwide
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

      {/* ================= FEATURES ================= */}
      <section className="features">

        <div className="features-header">
          <h2>Why ManifiX</h2>
          <p>Everything you need to think clearly and execute without friction.</p>
        </div>

        <div className="feature-grid">

          {[
            {
              title: "Instant Clarity",
              desc: "Get answers and structured thinking in seconds, not minutes.",
            },
            {
              title: "Deep Focus",
              desc: "Remove distractions and stay locked into meaningful work.",
            },
            {
              title: "Magic16 System",
              desc: "A daily framework designed to guide decisions and execution.",
            },
            {
              title: "High Performance",
              desc: "Optimized for speed, reliability, and continuous workflow.",
            },
            {
              title: "Private by Design",
              desc: "Your data stays secure and fully under your control.",
            },
            {
              title: "Built for Builders",
              desc: "Designed for creators, developers, and ambitious teams.",
            },
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
          <h2>
            Your Future Doesn’t Wait.
          </h2>

          <p className="cta-subtext">
            Start using ManifiX today and take control of your thinking,
            focus, and execution.
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
        <p>© {new Date().getFullYear()} ManifiX AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
