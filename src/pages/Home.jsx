// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <div className="home">

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-content">

          <motion.img
            src={logo}
            alt="ManifiX Logo"
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
            developers, founders, and teams who want to move faster and think
            smarter.
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
            <Link to="/features/gpt" className="btn-secondary">
              Explore Platform Features
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
            ManifiX combines powerful AI, deep focus systems, and a beautifully
            designed workspace to help creators and teams work faster, think
            smarter, and achieve more.
          </motion.p>
        </div>

        <div className="feature-grid">
          {[
            { icon: "⚡", title: "Advanced AI Assistant", text: "Ask questions, generate ideas, write content, solve problems, and explore knowledge instantly using ManifiX AI." },
            { icon: "🧠", title: "Magic16 Focus System", text: "Structured workflows help you achieve deep focus, structured thinking, and high productivity through guided sessions." },
            { icon: "🚀", title: "Lightning Fast Performance", text: "Modern web architecture ensures speed and smooth experiences across devices." },
            { icon: "🎨", title: "Beautiful User Experience", text: "Clean layouts, smooth animations, and intuitive design make using the platform enjoyable every day." },
            { icon: "🔒", title: "Secure & Reliable", text: "Your data is protected using modern authentication systems and secure infrastructure." },
            { icon: "🌍", title: "Built for Global Users", text: "Scalable platform built to support creators, developers, founders, and teams worldwide." },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.div>
          ))}
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
            Unlock powerful AI tools designed to help you think faster, create smarter, and achieve more every day.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              Create Your Free Account
            </Link>
            <Link to="/features/gpt" className="btn-secondary">
              Explore Platform
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="home-footer">
        <div className="footer-left">
          <img src={logo} alt="ManifiX" />
          <span>ManifiX</span>
        </div>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <p className="copyright">
          © {new Date().getFullYear()} ManifiX. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
