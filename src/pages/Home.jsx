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
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

export default function Home() {
  return (
    <div className="home">

      {/* ================= SEO ================= */}
      <Helmet>
        <title>ManifiX AI – 16 Day Discipline Reset</title>
        <meta
          name="description"
          content="Rewire your discipline in 16 days. Build focus, reduce stress, and become consistent with ManifiX AI."
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
            Rewire Your Discipline in 16 Days
          </motion.h1>

          <motion.p
            className="hero-text"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
          >
            A structured 16-day system to build discipline, reduce stress, and take control of your life.
            Miss a day, your streak resets. No excuses.
          </motion.p>

          <motion.p
            className="hero-urgency"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
          >
            ⚠️ Most people quit in 3 days. Don’t be one of them.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
          >
            <Link to="/signup" className="btn-primary">
              Start Day 1 → No Excuses
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="phases">
        <div className="features-header">
          <h2>The 16-Day Transformation System</h2>
          <p>This is not random. This is a structured reset.</p>
        </div>

        <div className="feature-grid">
          {[
            {
              title: "Days 1–3: Break Resistance",
              desc: "Push past laziness and prove you can show up",
            },
            {
              title: "Days 4–10: Build Discipline",
              desc: "Create a daily consistency loop",
            },
            {
              title: "Days 11–16: Identity Shift",
              desc: "Become someone who never skips",
            },
            {
              title: "Final Result",
              desc: "You become disciplined, focused, and consistent",
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

      {/* ================= OUTCOMES ================= */}
      <section className="outcomes">
        <div className="features-header">
          <h2>What You Get</h2>
          <p>This is what changes if you complete 16 days.</p>
        </div>

        <div className="feature-grid">
          {[
            { title: "Build Discipline", desc: "Show up daily or lose your streak" },
            { title: "Fix Your Focus", desc: "Train your brain to avoid distractions" },
            { title: "Reduce Stress", desc: "Feel calmer in just 16 minutes" },
            { title: "Gain Confidence", desc: "See real daily progress" },
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

      {/* ================= FINAL CTA ================= */}
      <section className="cta">
        <motion.div
          className="cta-container"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2>
            Start Your 16-Day Reset <span>Today</span>
          </h2>

          <p className="cta-subtext">
            If you skip today, you stay the same.
          </p>

          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary big">
              🚀 Start Day 1 Now
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
