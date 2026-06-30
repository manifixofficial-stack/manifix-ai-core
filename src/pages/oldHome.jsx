// src/pages/Home.jsx
// ManifiX AI — Home Page
// Production-grade · Billion-value aesthetic · Real logo integrated
// Dependencies: react-router-dom, react-helmet-async, framer-motion

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
   REAL MANIFIX LOGO — Geometric gold knot / labyrinthine lattice
   Traced from the uploaded brand asset. Pure SVG, no image dependency.
───────────────────────────────────────────────────────────────────────────── */
export const ManifixLogo = ({ size = 36, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ManifiX logo"
    style={glow ? { filter: "drop-shadow(0 0 8px rgba(212,175,55,0.55))" } : undefined}
  >
    <defs>
      <linearGradient id="mfx-gold-h" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#F5D060" />
        <stop offset="35%"  stopColor="#D4AF37" />
        <stop offset="65%"  stopColor="#C8960C" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="mfx-gold-v" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#F5D060" />
        <stop offset="50%"  stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#9A6F1A" />
      </linearGradient>
    </defs>
    {/* Outer diamond border */}
    <polygon
      points="100,4 196,100 100,196 4,100"
      stroke="url(#mfx-gold-h)"
      strokeWidth="5"
      fill="none"
    />
    {/* Second ring */}
    <polygon
      points="100,22 178,100 100,178 22,100"
      stroke="url(#mfx-gold-h)"
      strokeWidth="4"
      fill="none"
    />
    {/* Corner protrusions - top */}
    <polyline points="84,22 84,40 100,40 100,22" stroke="url(#mfx-gold-v)" strokeWidth="4" fill="none"/>
    <polyline points="116,22 116,40 100,40" stroke="url(#mfx-gold-v)" strokeWidth="4" fill="none"/>
    {/* Corner protrusions - bottom */}
    <polyline points="84,178 84,160 100,160 100,178" stroke="url(#mfx-gold-v)" strokeWidth="4" fill="none"/>
    <polyline points="116,178 116,160 100,160" stroke="url(#mfx-gold-v)" strokeWidth="4" fill="none"/>
    {/* Corner protrusions - left */}
    <polyline points="22,84 40,84 40,100 22,100" stroke="url(#mfx-gold-h)" strokeWidth="4" fill="none"/>
    <polyline points="22,116 40,116 40,100" stroke="url(#mfx-gold-h)" strokeWidth="4" fill="none"/>
    {/* Corner protrusions - right */}
    <polyline points="178,84 160,84 160,100 178,100" stroke="url(#mfx-gold-h)" strokeWidth="4" fill="none"/>
    <polyline points="178,116 160,116 160,100" stroke="url(#mfx-gold-h)" strokeWidth="4" fill="none"/>
    {/* Inner maze ring */}
    <polygon
      points="100,52 148,100 100,148 52,100"
      stroke="url(#mfx-gold-h)"
      strokeWidth="4"
      fill="none"
    />
    {/* Inner maze scrollwork - top-left arm */}
    <polyline points="52,100 52,76 68,76 68,60 84,60 84,76 68,76" stroke="url(#mfx-gold-v)" strokeWidth="3.5" fill="none" strokeLinecap="square"/>
    {/* Inner maze scrollwork - top-right arm */}
    <polyline points="148,100 148,76 132,76 132,60 116,60 116,76 132,76" stroke="url(#mfx-gold-v)" strokeWidth="3.5" fill="none" strokeLinecap="square"/>
    {/* Inner maze scrollwork - bottom-left arm */}
    <polyline points="52,100 52,124 68,124 68,140 84,140 84,124 68,124" stroke="url(#mfx-gold-v)" strokeWidth="3.5" fill="none" strokeLinecap="square"/>
    {/* Inner maze scrollwork - bottom-right arm */}
    <polyline points="148,100 148,124 132,124 132,140 116,140 116,124 132,124" stroke="url(#mfx-gold-v)" strokeWidth="3.5" fill="none" strokeLinecap="square"/>
    {/* Center cross + diamond */}
    <line x1="100" y1="72" x2="100" y2="128" stroke="url(#mfx-gold-v)" strokeWidth="3.5"/>
    <line x1="72"  y1="100" x2="128" y2="100" stroke="url(#mfx-gold-h)" strokeWidth="3.5"/>
    <polygon points="100,86 114,100 100,114 86,100" stroke="url(#mfx-gold-h)" strokeWidth="3" fill="none"/>
    {/* Micro center diamond */}
    <polygon points="100,93 107,100 100,107 93,100" fill="url(#mfx-gold-h)"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────────────────────────────────────── */
const STYLE_ID = "manifix-home-v3";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    :root {
      --gold:        #D4AF37;
      --gold-light:  #F5D060;
      --gold-dim:    rgba(212,175,55,0.12);
      --gold-glow:   rgba(212,175,55,0.35);
      --bg:          #060608;
      --surf:        #0C0C10;
      --surf2:       #101014;
      --border:      rgba(212,175,55,0.12);
      --border-hi:   rgba(212,175,55,0.28);
      --text:        #EEEEF4;
      --muted:       rgba(238,238,244,0.42);
      --faint:       rgba(238,238,244,0.16);
      --display:     'Syne', sans-serif;
      --body:        'DM Sans', sans-serif;
      --mono:        'JetBrains Mono', monospace;
      --radius:      12px;
    }

    @keyframes mfx-breathe {
      0%,100% { opacity:.08; transform:scale(1) translateX(-50%); }
      50%      { opacity:.18; transform:scale(1.1) translateX(-46%); }
    }
    @keyframes mfx-scan {
      from { top:-80px; }
      to   { top:110%; }
    }
    @keyframes mfx-ticker {
      from { transform:translateX(0); }
      to   { transform:translateX(-50%); }
    }
    @keyframes mfx-blink {
      0%,49%,100% { opacity:1; }
      50%,99% { opacity:0; }
    }
    @keyframes mfx-shimmer {
      from { background-position:-200% center; }
      to   { background-position:200% center; }
    }
    @keyframes mfx-pulse {
      0%,100% { box-shadow:0 0 0 0 var(--gold-glow); }
      50%      { box-shadow:0 0 0 14px rgba(212,175,55,0); }
    }
    @keyframes mfx-float {
      0%,100% { transform:translateY(0); }
      50%      { transform:translateY(-14px); }
    }
    @keyframes mfx-rotate-slow {
      from { transform:rotate(0deg); }
      to   { transform:rotate(360deg); }
    }
    @keyframes mfx-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:none; }
    }

    .mfx-shimmer {
      background: linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold), var(--gold-light));
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: mfx-shimmer 3s linear infinite;
    }
    .mfx-pulse-btn { animation: mfx-pulse 2.4s ease-in-out infinite; }
    .mfx-blink     { animation: mfx-blink 1.1s step-end infinite; }
    .mfx-float     { animation: mfx-float 7s ease-in-out infinite; }

    .mfx-card {
      background: var(--surf);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      transition: border-color .25s, transform .25s, box-shadow .25s;
    }
    .mfx-card:hover {
      border-color: var(--border-hi);
      transform: translateY(-5px);
      box-shadow: 0 24px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(212,175,55,.1);
    }

    .mfx-nav-link {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .2em;
      color: var(--muted);
      text-transform: uppercase;
      text-decoration: none;
      transition: color .2s;
    }
    .mfx-nav-link:hover { color: var(--gold); }

    .mfx-btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 36px;
      background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 50%, #9A6F1A 100%);
      color: #050508;
      font-family: var(--mono);
      font-weight: 700;
      font-size: 12px;
      letter-spacing: .2em;
      text-transform: uppercase;
      text-decoration: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity .2s, transform .15s, box-shadow .2s;
      box-shadow: 0 8px 28px rgba(212,175,55,.35);
    }
    .mfx-btn-gold:hover {
      opacity: .88;
      transform: translateY(-2px);
      box-shadow: 0 14px 36px rgba(212,175,55,.55);
    }
    .mfx-btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 15px 32px;
      background: transparent;
      color: var(--gold);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .18em;
      text-transform: uppercase;
      text-decoration: none;
      border: 1px solid rgba(212,175,55,.35);
      border-radius: 8px;
      cursor: pointer;
      transition: all .2s;
    }
    .mfx-btn-outline:hover {
      background: var(--gold-dim);
      border-color: var(--gold);
      transform: translateY(-2px);
    }

    .mfx-ticker-track {
      display: flex;
      width: max-content;
      animation: mfx-ticker 32s linear infinite;
    }
    .mfx-ticker-track:hover { animation-play-state: paused; }

    /* Responsive */
    @media (max-width: 768px) {
      .mfx-nav-links { display: none !important; }
      .mfx-hero-h1 { font-size: 40px !important; }
      .mfx-phase-grid { grid-template-columns: 1fr !important; }
      .mfx-proof-grid { grid-template-columns: 1fr 1fr !important; }
      .mfx-testi-grid { grid-template-columns: 1fr !important; }
      .mfx-cta-group { flex-direction: column !important; align-items: center !important; }
    }
    @media (max-width: 480px) {
      .mfx-proof-grid { grid-template-columns: 1fr 1fr !important; }
      .mfx-footer-row { flex-direction: column !important; gap: 16px !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "AI-VERIFIED DISCIPLINE ✦", "16-DAY NEURAL LOOP ·", "STREAK OR RESET ✦",
  "TOP 1% GLOBALLY ·", "POSE DETECTION LIVE ✦", "NO EXCUSES ACCEPTED ·",
  "BUILT IN INDIA ✦", "₹1,999 / MONTH ·", "MISSION CRITICAL ✦",
  "AI-VERIFIED DISCIPLINE ✦", "16-DAY NEURAL LOOP ·", "STREAK OR RESET ✦",
  "TOP 1% GLOBALLY ·", "POSE DETECTION LIVE ✦", "NO EXCUSES ACCEPTED ·",
];

const PHASES = [
  {
    num: "01",
    title: "RESISTANCE",
    days: "Days 1–4",
    body: "Your brain fights the new neural path. The AI watches every session. It does not accept excuses.",
    icon: "⚔",
  },
  {
    num: "02",
    title: "ADAPTATION",
    days: "Days 5–10",
    body: "Discipline stops being a decision. It becomes default state. You begin to notice the difference.",
    icon: "⚡",
  },
  {
    num: "03",
    title: "MASTERY",
    days: "Days 11–16",
    body: "You are no longer who you were on Day 1. The system holds proof of your transformation.",
    icon: "◈",
  },
];

const PROOF_STATS = [
  { val: "16",     label: "Min / day commitment" },
  { val: "94%",    label: "Completion rate"       },
  { val: "4,200+", label: "Active performers"     },
  { val: "Day 1",  label: "Miss once — restart"   },
];

const TECH_FEATURES = [
  {
    icon: "◉",
    title: "AI Vision Verification",
    desc: "Real-time MoveNet pose detection tracks every movement. No shortcuts. No cheating. Pure verified progress.",
  },
  {
    icon: "◈",
    title: "Streak or Reset",
    desc: "The system does not negotiate. Miss a single day and your streak goes to zero. No recovery windows.",
  },
  {
    icon: "⚡",
    title: "Magic16 Protocol",
    desc: "16 precisely sequenced steps that prime your body and mind for peak performance. Science-backed.",
  },
  {
    icon: "↑",
    title: "Global Rank Engine",
    desc: "Compete with high-performers worldwide. Your verified score earns position in the elite tier.",
  },
  {
    icon: "◎",
    title: "24/7 AI Coach",
    desc: "A GPT-powered strategist that adapts to your schedule, goals, and daily progress in real time.",
  },
  {
    icon: "⚔",
    title: "Neural Discipline Loop",
    desc: "16 days of compounding momentum. The habit becomes identity. The identity becomes unstoppable.",
  },
];

const TESTIMONIALS = [
  {
    name: "Arjun M.",
    city: "Mumbai",
    streak: 16,
    text: "I've tried 12 apps. None held me accountable like this. The AI called me out mid-session. That changed everything.",
  },
  {
    name: "Priya S.",
    city: "Bengaluru",
    streak: 14,
    text: "The streak reset feature terrified me into showing up every single day. That fear is a feature, not a bug.",
  },
  {
    name: "Rahul K.",
    city: "Delhi",
    streak: 16,
    text: "Day 9 I wanted to quit. The countdown said 3 hours left. I did it. That moment changed my entire mindset.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, y = 28 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ val, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || !num) return;
    let c = 0;
    const step = Math.ceil(num / 42);
    const iv = setInterval(() => {
      c = Math.min(c + step, num);
      setCount(c);
      if (c >= num) clearInterval(iv);
    }, 28);
    return () => clearInterval(iv);
  }, [inView, num]);

  const display = num ? `${count.toLocaleString()}${val.replace(/[\d,]/g, "")}` : val;

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "var(--display)",
        fontSize: "clamp(32px,8vw,52px)",
        fontWeight: 800,
        color: "var(--gold)",
        lineHeight: 1,
        letterSpacing: "-.01em",
      }}>
        {display}
      </div>
      <div style={{
        fontFamily: "var(--mono)",
        fontSize: 9,
        letterSpacing: ".22em",
        color: "var(--faint)",
        textTransform: "uppercase",
        marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const SEC = {
    width: "min(560px, 94vw)",
    margin: "0 auto",
    padding: "80px 0",
  };

  return (
    <div style={{
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "var(--body)",
      minHeight: "100dvh",
      overflowX: "hidden",
    }}>
      <Helmet>
        <title>ManifiX AI — The 16-Day Neural Discipline System</title>
        <meta name="description" content="AI-verified daily sessions. Miss once and the system resets your streak to Day 1. No excuses accepted." />
        <meta property="og:title" content="ManifiX AI — Stop negotiating with your weakness." />
        <meta property="og:description" content="The world's first AI-verified 16-day discipline loop. Built in India." />
        <meta name="theme-color" content="#D4AF37" />
      </Helmet>

      {/* ══ AMBIENT BACKGROUND ══ */}
      <div aria-hidden="true" style={{
        position: "fixed",
        top: "18%", left: "50%",
        width: 600, height: 360,
        background: "radial-gradient(ellipse, rgba(212,175,55,.1) 0%, transparent 68%)",
        animation: "mfx-breathe 7s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div aria-hidden="true" style={{
        position: "fixed",
        left: 0, right: 0,
        height: 90,
        background: "linear-gradient(180deg, transparent, rgba(212,175,55,.025), transparent)",
        animation: "mfx-scan 5s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 40px)",
        height: 62,
        background: scrolled ? "rgba(6,6,8,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all .3s ease",
      }}>
        {/* Logo + wordmark */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <ManifixLogo size={34} glow={true} />
          <span style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: "var(--gold)",
          }}>
            MANIFIX AI
          </span>
        </Link>

        {/* Nav links */}
        <div className="mfx-nav-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[["#phases", "The Arc"], ["#proof", "Proof"], ["#tech", "Technology"]].map(([href, label]) => (
            <a key={href} href={href} className="mfx-nav-link">{label}</a>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/signup"
          className="mfx-btn-gold mfx-pulse-btn"
          style={{ padding: "9px 22px", fontSize: 10 }}
        >
          Start Now →
        </Link>
      </nav>

      {/* ══ TICKER ══ */}
      <div style={{
        marginTop: 62,
        overflow: "hidden",
        background: "#050507",
        borderBottom: "1px solid var(--border)",
        padding: "8px 0",
      }}>
        <div className="mfx-ticker-track">
          {TICKER_ITEMS.map((t, i) => (
            <span key={i} style={{
              fontFamily: "var(--mono)",
              fontSize: 8,
              letterSpacing: ".26em",
              color: i % 2 === 0 ? "var(--gold)" : "rgba(238,238,244,.14)",
              padding: "0 28px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "88px 0 72px", zIndex: 1 }}>
        <div style={{ ...SEC, textAlign: "center", position: "relative" }}>

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(212,175,55,.2)",
              padding: "5px 16px",
              borderRadius: 20,
              marginBottom: 36,
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: ".2em",
              color: "rgba(212,175,55,.7)",
              textTransform: "uppercase",
              background: "rgba(212,175,55,.05)",
            }}
          >
            <span className="mfx-blink" style={{ color: "#f25353", fontSize: 8 }}>●</span>
            AI Pose Verification · Live
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mfx-hero-h1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(48px, 13vw, 88px)",
              fontWeight: 800,
              letterSpacing: "-.02em",
              lineHeight: .96,
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            Stop negotiating<br />
            with your{" "}
            <span className="mfx-shimmer">Weakness.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.65 }}
            style={{
              fontFamily: "var(--body)",
              fontSize: "clamp(13px, 3vw, 16px)",
              lineHeight: 1.85,
              color: "var(--muted)",
              maxWidth: 420,
              margin: "0 auto 40px",
              letterSpacing: ".02em",
            }}
          >
            The world's first AI-verified 16-day discipline loop.<br />
            Miss a day — the system resets your streak to Day 1.<br />
            No exceptions. No negotiations.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: .96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.42, duration: 0.5 }}
          >
            <div className="mfx-cta-group" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/signup" className="mfx-btn-gold mfx-pulse-btn" style={{ fontSize: 12, padding: "16px 36px" }}>
                Enter the 16-Day Loop →
              </Link>
              <a href="#tech" className="mfx-btn-outline">
                See how it works
              </a>
            </div>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: ".18em",
              color: "var(--faint)",
              textTransform: "uppercase",
              marginTop: 16,
            }}>
              ₹1,999/month · Cancel anytime · Built in India
            </div>
          </motion.div>

          {/* Floating logo decoration */}
          <motion.div
            initial={{ opacity: 0, scale: .8 }}
            animate={{ opacity: .06, scale: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mfx-float"
            style={{
              position: "absolute",
              top: -20, left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <ManifixLogo size={320} />
          </motion.div>
        </div>
      </section>

      {/* ══ PROOF STATS ══ */}
      <FadeUp>
        <div id="proof" style={{
          borderTop: "1px solid rgba(255,255,255,.04)",
          borderBottom: "1px solid rgba(255,255,255,.04)",
          background: "#050507",
          padding: "44px 20px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            width: "min(560px, 94vw)",
            margin: "0 auto",
          }} className="mfx-proof-grid">
            {PROOF_STATS.map((s) => (
              <StatCard key={s.label} val={s.val} label={s.label} />
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ══ TECHNOLOGY ══ */}
      <FadeUp delay={0.05}>
        <div id="tech" style={{ ...SEC }}>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: ".28em",
            color: "rgba(212,175,55,.55)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            — The Technology
          </div>
          <h2 style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(32px, 8vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-.01em",
            lineHeight: .97,
            marginBottom: 36,
          }}>
            Built different.<br />
            <span className="mfx-shimmer">Proven different.</span>
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            {TECH_FEATURES.map((f, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div className="mfx-card" style={{ padding: "22px 18px" }}>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: 16,
                    color: "var(--gold)",
                    marginBottom: 10,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{
                    fontFamily: "var(--display)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: ".02em",
                    color: "var(--text)",
                    marginBottom: 7,
                  }}>
                    {f.title}
                  </div>
                  <p style={{
                    fontSize: 12,
                    lineHeight: 1.75,
                    color: "var(--muted)",
                    letterSpacing: ".02em",
                  }}>
                    {f.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ══ 16-DAY PHASES ══ */}
      <FadeUp delay={0.05}>
        <div id="phases" style={SEC}>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: ".28em",
            color: "rgba(212,175,55,.55)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            — The Evolution
          </div>
          <h2 style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(32px, 8vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-.01em",
            lineHeight: .97,
            marginBottom: 36,
          }}>
            The 16-Day<br />
            <span className="mfx-shimmer">Arc</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="mfx-phase-grid">
            {PHASES.map((p, i) => (
              <FadeUp key={i} delay={i * 0.09}>
                <div className="mfx-card" style={{ padding: "24px 22px", display: "flex", gap: 20, alignItems: "flex-start" }}>
                  {/* Number */}
                  <div style={{
                    fontFamily: "var(--display)",
                    fontSize: 56,
                    fontWeight: 800,
                    color: "rgba(212,175,55,.08)",
                    lineHeight: 1,
                    minWidth: 52,
                    letterSpacing: "-.02em",
                  }}>
                    {p.num}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "var(--display)",
                        fontSize: 17,
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        color: "var(--gold)",
                      }}>
                        {p.title}
                      </span>
                      <span style={{
                        fontFamily: "var(--mono)",
                        fontSize: 8,
                        letterSpacing: ".2em",
                        color: "var(--faint)",
                        textTransform: "uppercase",
                      }}>
                        {p.days}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--muted)" }}>{p.body}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ══ TESTIMONIALS ══ */}
      <FadeUp delay={0.05}>
        <div style={{ ...SEC, paddingTop: 0 }}>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: ".28em",
            color: "rgba(212,175,55,.55)",
            textTransform: "uppercase",
            marginBottom: 32,
          }}>
            — Field Reports
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="mfx-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="mfx-card" style={{ padding: "20px 18px", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, color: "var(--gold)" }}>
                        {t.name}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: ".18em", color: "var(--faint)", textTransform: "uppercase", marginTop: 2 }}>
                        {t.city}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "var(--mono)",
                      fontSize: 8,
                      letterSpacing: ".14em",
                      color: "var(--gold)",
                      border: "1px solid rgba(212,175,55,.2)",
                      padding: "3px 8px",
                      borderRadius: 4,
                      alignSelf: "flex-start",
                      textTransform: "uppercase",
                    }}>
                      Day {t.streak}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.8, color: "var(--muted)", fontStyle: "italic", letterSpacing: ".03em" }}>
                    "{t.text}"
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ══ FINAL CTA ══ */}
      <FadeUp delay={0.05}>
        <div style={{ ...SEC, paddingTop: 0, paddingBottom: 96 }}>
          <div style={{
            border: "1px solid var(--border)",
            background: "var(--surf)",
            borderRadius: 16,
            padding: "52px 36px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* top accent */}
            <div style={{
              position: "absolute",
              top: 0, left: "15%", right: "15%",
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
            }} />
            {/* ambient glow */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />

            {/* Logo center */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <ManifixLogo size={56} glow={true} />
            </div>

            <div style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(28px, 7vw, 46px)",
              fontWeight: 800,
              letterSpacing: "-.01em",
              lineHeight: 1.05,
              marginBottom: 14,
            }}>
              ₹1,999 / month.<br />
              <span className="mfx-shimmer">An unstoppable mind.</span>
            </div>
            <p style={{
              fontSize: 13,
              letterSpacing: ".06em",
              color: "var(--muted)",
              lineHeight: 1.85,
              marginBottom: 32,
            }}>
              Join 4,200+ performers already in the loop.<br />
              Cancel anytime. The streak, however, is yours to lose.
            </p>
            <div className="mfx-cta-group" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/signup" className="mfx-btn-gold mfx-pulse-btn" style={{ fontSize: 12, padding: "17px 40px" }}>
                Get Started Now →
              </Link>
              <Link to="/login" className="mfx-btn-outline">
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ══ FOOTER ══ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,.05)",
        padding: "28px clamp(16px, 4vw, 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 14,
      }} className="mfx-footer-row">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <ManifixLogo size={26} />
          <span style={{
            fontFamily: "var(--display)",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: "var(--gold)",
          }}>
            MANIFIX AI
          </span>
        </Link>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[["#phases", "The Arc"], ["#proof", "Proof"], ["/privacy", "Privacy"], ["/terms", "Terms"]].map(([href, label]) => (
            <a key={href} href={href} style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: ".2em",
              color: "var(--faint)",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--faint)"}
            >
              {label}
            </a>
          ))}
        </div>
        <div style={{
          fontFamily: "var(--mono)",
          fontSize: 8,
          letterSpacing: ".2em",
          color: "rgba(238,238,244,.1)",
          textTransform: "uppercase",
        }}>
          © {new Date().getFullYear()} ManifiX AI · Built in India 🇮🇳
        </div>
      </div>
    </div>
  );
}
