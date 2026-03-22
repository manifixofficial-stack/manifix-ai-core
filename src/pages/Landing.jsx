// src/pages/Landing.jsx
import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import authService from "../services/auth.service";
import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const testimonialRef = useRef(null);

  // 🔐 Auto-redirect if logged in
  useEffect(() => {
    try {
      const user = authService?.getCurrentUser?.();
      if (user) {
        navigate("/app/gpt", { replace: true });
      }
    } catch (error) {
      console.error("Landing auth check failed:", error);
    }
  }, [navigate]);

  // ---------------- TESTIMONIALS ----------------
  const testimonials = [
    {
      name: "Shyam",
      text: "This app is a masterclass in user experience. The design is absolutely gorgeous—clean, modern, and easy on the eyes. More importantly, it is incredibly intuitive. I found exactly what I needed right away, and navigating through different features is a breeze. It's fast, stable, and a genuine pleasure to use. The developers clearly put a lot of thought into making this the best version possible. Highly, highly recommend!"
    },
    {
      name: "Priya",
      text: "Good, it's useful for daily life and get the answers using this tool. This ManifiX app is so useful, I love it! My health is improving after the Magic16 feature. I love it, the ManifiX conversation never stops. My best friend is ManifiX; any question I ask, it gives the answer. I love ManifiX 🥰✨"
    },
    {
      name: "Nikil",
      text: "I’m honestly loving ManifiX! It’s so easy to use and super helpful for planning my day. The AI assistant answers my questions right away, and the Magic16 wellness routines keep me calm and motivated. I feel more focused and less stressed now. The personalized wellness tips are spot-on and really help me improve. Definitely a must-have app!"
    }
  ];

  // auto scroll (smooth)
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (!testimonialRef.current) return;

      const container = testimonialRef.current;
      const width = container.offsetWidth;

      container.scrollTo({
        left: width * index,
        behavior: "smooth",
      });

      index = (index + 1) % testimonials.length;
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >

    <Helmet>
  <title>
    ManifiX AI – Focus Better, Think Smarter, Build Your Life Faster
  </title>

  <meta
    name="description"
    content="ManifiX AI helps you boost focus, productivity, and mental clarity using GPT AI and the powerful Magic16 system. Build better habits, think smarter, and achieve more every day."
  />

  <meta name="keywords" content="
    ManifiX,
    ManifiX AI,
    AI productivity app,
    focus app,
    Magic16,
    AI assistant,
    productivity tools,
    self improvement app,
    deep focus system
  " />

  <meta name="author" content="ManifiX AI" />

  {/* Open Graph (for social sharing) */}
  <meta property="og:title" content="ManifiX AI – Focus. Build. Win." />
  <meta
    property="og:description"
    content="Transform your focus and productivity with AI-powered tools like GPT and Magic16."
  />
  <meta property="og:url" content="https://www.manifixai.com" />
  <meta property="og:type" content="website" />
    {/* ✅ ADD SCHEMA HERE */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ManifiX AI",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Web",
      "url": "https://www.manifixai.com"
    })}
  </script>
  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
</Helmet>

      <div className="overlay" />

                                                                    

    {/* ---------------- HERO SECTION ---------------- */}
<header className="landing-header">

  <img src={logo} alt="ManifiX Logo" className="landing-logo" />

  <h1 className="brand-name">ManifiX</h1>

  <p className="brand-tagline">
    Build Faster. Think Smarter. Win Bigger.
  </p>

  <h2 className="hero-title">
    Your Life Changes in 16 Minutes a Day.
  </h2>

</header>

      {/* ---------------- CORE VALUE SECTION ---------------- */}
      <section className="landing-hero">
        <h2 className="hero-title">16 Minutes. Infinite Power.</h2>
        <p className="hero-description">
          Unlock clarity, focus, and energy using AI-guided rituals and tools
          designed for high performers and future leaders.
        </p>

        <div className="hero-features">
          <div className="feature">
            <h3>Magic16 Ritual</h3>
            <p>
              8 minutes meditation + 8 minutes reflection.
              Track your posture, energy, and progress daily.
            </p>
          </div>

          <div className="feature">
            <h3>AI Coach</h3>
            <p>
              Ask deep questions and receive contextual guidance powered by GPT.
            </p>
          </div>
          
          <div className="feature">
            <h3>Premium Tools</h3>
            <p>
              Access unlimited Magic16 sessions, advanced analytics, and personalized recommendations.
            </p>
          </div>
        </div>

        {/* ---------------- CALL TO ACTION ---------------- */}
       <div className="cta-container">
  <Link to="/signup" className="landing-button primary">
    Start Free →
  </Link>

  <Link to="/login" className="landing-button secondary">
    Already a Member?
  </Link>
</div>
        <p className="landing-quote">
          Built for creators. Designed for leaders. Trusted by visionaries.
        </p>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="landing-testimonials" ref={testimonialRef}>

        <h2 className="testimonial-title">What Users Say</h2>

        <div className="testimonial-cards">

          {testimonials.map((t, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-text">"{t.text}"</p>
              <p className="testimonial-author">— {t.name}</p>
            </div>
          ))}

        </div>

      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="final-cta">

        <h2>Start Your Transformation Today</h2>

        <Link to="/signup" className="landing-button primary big">
          Join ManifiX Free
        </Link>

      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} ManifiX. All rights reserved.</span>
      </footer>

    </div>
  );
}
