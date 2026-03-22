// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

import "../styles/Home.css";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <div className="home">

      {/* ---------- SEO + BRAND ---------- */}
      <Helmet>
        <title>ManifiX AI – Future of AI Productivity</title>

        <meta
          name="description"
          content="ManifiX AI is a powerful productivity platform with GPT and Magic16 to help creators, developers, and teams work faster and smarter."
        />

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ManifiX AI",
            "url": "https://www.manifixai.com",
            "logo": "https://www.manifixai.com/logo.png"
          })}
        </script>

        {/* Website Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ManifiX AI",
            "url": "https://www.manifixai.com"
          })}
        </script>
      </Helmet>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-content">

          <motion.img
            src={logo}
            alt="ManifiX AI Logo"
            className="hero-logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          />

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            The Future of AI Productivity <br />
            Starts With <span>ManifiX</span>
          </motion.h1>

          <motion.p
            className="hero-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            ManifiX is a next-generation AI platform designed for creators,
            developers, founders, and teams who want to move faster and think smarter.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link to="/signup" className="btn-primary">
              Start Using ManifiX
            </Link>

            <Link to="/features" className="btn-secondary">
              Explore Features
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="features">

        <div className="features-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why Teams Choose ManifiX
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Powerful AI tools, structured focus systems, and a beautifully designed
            workspace — everything you need to work faster and smarter.
          </motion.p>
        </div>

        <div className="feature-grid">

          {/* GPT */}
          <Link to="/features/gpt" className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>ManifiX GPT</h3>
            <p>AI assistant for writing, coding, research, and problem solving.</p>
          </Link>

          {/* Magic16 */}
          <Link to="/features/magic16" className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Magic16 Focus System</h3>
            <p>Structured workflow system for deep focus and productivity.</p>
          </Link>

          {/* Extra Features */}
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Lightning Fast</h3>
            <p>Modern architecture ensures speed and smooth performance.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Beautiful UI</h3>
            <p>Clean layouts, smooth animations, and intuitive experience.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure</h3>
            <p>Built with modern authentication and secure infrastructure.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Platform</h3>
            <p>Designed for creators, developers, and teams worldwide.</p>
          </div>

        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta">

        <motion.div
          className="cta-container"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            Start Building With <span>ManifiX AI</span> Today
          </h2>

          <p className="cta-subtext">
            Unlock powerful AI tools to think faster, create smarter, and achieve more.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              Create Free Account
            </Link>

            <Link to="/features/gpt" className="btn-secondary">
              Try GPT
            </Link>
          </div>

        </motion.div>

      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="home-footer">

        <div className="footer-left">
          <img src={logo} alt="ManifiX AI Logo" />
          <span>ManifiX AI</span>
        </div>

        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} ManifiX AI. All rights reserved.
        </p>

      </footer>

    </div>
  );
}
