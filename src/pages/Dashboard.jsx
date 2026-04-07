// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/dashboard.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

export default function Dashboard() {
  return (
    <div className="dashboard-page">

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="nav-left">
          <span className="brand-name">ManifiX</span>
        </div>
        <div className="nav-right">
          <Link to="/app/gpt" className="nav-link">GPT</Link>
          <Link to="/app/magic16" className="nav-link">Magic16</Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
          >
            Build Focus. Track Discipline. <br />
            <span>Improve Daily with Magic16</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
          >
            AI + Magic16 system helps you think clearly, stay focused,
            and build a powerful life — every single day.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            <Link to="/app/gpt" className="btn-primary">
              Start Free →
            </Link>
            <Link to="/app/magic16" className="btn-secondary">
              Try Magic16
            </Link>
          </motion.div>

          <motion.p
            className="hero-trustline"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
            Magic16 • Daily Score • Guided Flow
          </motion.p>
        </div>

        <motion.div
          className="hero-image"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
        >
          <img
            src="/assets/images/magic16-dashboard.png"
            alt="Magic16 Visualization"
          />
        </motion.div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features">
        <motion.h2
          className="section-title"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          custom={0}
        >
          Why ManifiX Wins
        </motion.h2>
        <motion.p
          className="section-subtitle"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          custom={1}
        >
          Everything you need to think clearly and execute faster.
        </motion.p>

        <div className="feature-grid">
          {[
            { title: "Magic16 Routine", desc: "16-minute daily system to build focus", icon: "🔥" },
            { title: "Daily Score", desc: "Track your discipline every day", icon: "📊" },
            { title: "Guided Flow", desc: "Yoga + meditation with AI support", icon: "🧘" },
            { title: "AI Coach", desc: "Ask anything and get instant clarity", icon: "🤖" },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i + 2}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="testimonials">
        <motion.h2
          className="section-title"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          custom={0}
        >
          What Our Users Say
        </motion.h2>

        <div className="testimonial-cards">
          {[
            {
              name: "Shyam",
              text:  `This app is a masterclass in user experience. The design is
              absolutely gorgeous—clean, modern, and easy on the eyes. More
              importantly, it is incredibly intuitive. I found exactly what I
              needed right away, and navigating through different features is a
              breeze. It's fast, stable, and a genuine pleasure to use. The
              developers clearly put a lot of thought into making this the best
              version possible. Highly, highly recommend!`
            },
            {
              name: "Priya",
              text:  `I’m honestly loving ManifiX! It’s so easy to use and super helpful
              for planning my day. The AI assistant answers my questions right
              away, and the Magic16 wellness routines keep me calm and
              motivated. I feel more focused and less stressed now. The
              personalized wellness tips are spot-on and really help me improve.
              Definitely a must-have app!`
            },
            {
              name: "Nikil",
              text:` ManifiX is like having a personal coach and assistant together.
              Magic16 wellness exercises keep me calm, focused, and energized.
              ManifiXGPT answers any question quickly and accurately. It helps me
              improve my health, creativity, and daily habits. The app is
              professional, intuitive, and easy to navigate. I feel more
              confident and organized in my daily life. I truly love using
              ManifiX every single day`
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="testimonial-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i + 2}
            >
              <p className="testimonial-text">"{t.text}"</p>
              <p className="testimonial-author">— {t.name}</p>
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
          <h2>Start Your 16-Minute Routine Today <span>ManifiX</span></h2>
          <p className="cta-subtext">Experience focus, clarity, and discipline daily.</p>
          <Link to="/app/magic16" className="btn-primary big">
            Start Your 16-Min Routine →
          </Link>
        </motion.div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        {[
          { q: "What is ManifiX?", a: "ManifiX is your AI assistant for growth, wellness, and success." },
          { q: "Can I chat for free?", a: "Yes! Unlimited chatting at no cost." },
          { q: "How do I use Magic16?", a: "Magic16 includes daily yoga & meditation to boost your energy." },
        ].map((f, i) => (
          <div className="faq-item" key={i} onClick={(e) => e.currentTarget.classList.toggle("active")}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>

    </div>
  );
}
