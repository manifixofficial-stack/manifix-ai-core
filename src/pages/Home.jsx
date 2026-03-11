import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <div className="home">

     {/* ---------- HERO ---------- */}

<section className="hero">

  <div className="hero-content">

    <img src={logo} alt="ManifiX Logo" className="hero-logo" />

    <h1>
      The Future of AI Productivity <br/>
      Starts With <span>ManifiX</span>
    </h1>

    <p>
      ManifiX is a next-generation AI platform designed for creators,
      developers, founders, and teams who want to move faster and think
      smarter.
    </p>

    <p className="hero-subtext">
      From intelligent conversations with <strong>ManifiX AI</strong> to the
      powerful focus system <strong>Magic16</strong>, the platform helps you
      generate ideas, solve problems, automate workflows, and unlock
      deep productivity — all in one beautiful and intuitive workspace.
    </p>

    <p className="hero-subtext">
      Built with a modern interface, lightning-fast performance, and a
      scalable architecture, ManifiX is designed to support millions
      of users around the world — from individual creators to
      high-performance teams.
    </p>

    <div className="hero-buttons">

      <Link to="/signup" className="btn-primary">
        Start Using ManifiX
      </Link>

      <Link to="/features/gpt" className="btn-secondary">
        Explore Platform Features
      </Link>

    </div>

    <div className="hero-trust">

      <span>⚡ AI-Powered Productivity</span>
      <span>🚀 Built for Creators & Developers</span>
      <span>🧠 Focus System with Magic16</span>
      <span>🌍 Scalable for Global Users</span>

    </div>

  </div>

</section>


  {/* ---------- FEATURES ---------- */}

<section className="features">

  <div className="features-header">
    <h2>Why Teams Choose ManifiX</h2>

    <p>
      ManifiX combines powerful AI, deep focus systems, and a beautifully
      designed workspace to help creators and teams work faster,
      think smarter, and achieve more.
    </p>
  </div>

  <div className="feature-grid">

    <div className="feature-card">
      <div className="feature-icon">⚡</div>
      <h3>Advanced AI Assistant</h3>
      <p>
        Ask questions, generate ideas, write content, solve problems,
        and explore knowledge instantly using the powerful
        ManifiX AI assistant.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🧠</div>
      <h3>Magic16 Focus System</h3>
      <p>
        The unique Magic16 workflow helps you achieve deep focus,
        structured thinking, and high productivity through guided
        mental cycles and flow sessions.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🚀</div>
      <h3>Lightning Fast Performance</h3>
      <p>
        Built with modern web architecture for speed and scalability.
        ManifiX delivers fast responses and smooth experiences
        across devices.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🎨</div>
      <h3>Beautiful User Experience</h3>
      <p>
        Clean layouts, smooth animations, and intuitive design
        make the platform enjoyable to use every day.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🔒</div>
      <h3>Secure & Reliable</h3>
      <p>
        Your data is protected using modern authentication
        systems and secure infrastructure designed
        for reliability.
      </p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">🌍</div>
      <h3>Built for Global Users</h3>
      <p>
        Designed to support creators, developers,
        founders, and teams worldwide with a scalable
        platform built for millions of users.
      </p>
    </div>

  </div>

</section>


{/* ---------- CTA ---------- */}

<section className="cta">

  <div className="cta-container">

    <h2>
      Start Building With <span>ManifiX AI</span> Today
    </h2>

    <p className="cta-subtext">
      Unlock powerful AI tools designed to help you think faster,
      create smarter, and achieve more every day.
    </p>

    <p className="cta-description">
      Whether you're a creator, developer, entrepreneur, or student,
      ManifiX provides intelligent conversations, the Magic16 focus
      system, and a beautifully designed workspace that helps you
      turn ideas into real results.
    </p>

    <div className="cta-buttons">

      <Link to="/signup" className="btn-primary big">
        Create Your Free Account
      </Link>

      <Link to="/features/gpt" className="btn-secondary">
        Explore Platform
      </Link>

    </div>

    <div className="cta-trust">

      <span>⚡ AI Powered Platform</span>
      <span>🧠 Magic16 Focus System</span>
      <span>🚀 Built for Creators & Developers</span>
      <span>🌍 Scalable for Global Users</span>

    </div>

  </div>

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
