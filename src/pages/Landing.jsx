import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Balatro from "../components/Balatro";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  gold:       "#C9A84C",
  goldLight:  "#F2D06B",
  goldPale:   "#FFF0B3",
  goldDim:    "rgba(201,168,76,0.12)",
  goldGlow:   "rgba(201,168,76,0.32)",
  bg:         "#06060D",
  surface:    "#0B0B16",
  surface2:   "#0F0F1E",
  border:     "rgba(201,168,76,0.13)",
  borderHover:"rgba(201,168,76,0.32)",
  text:       "#ECEEF8",
  muted:      "rgba(236,238,248,0.48)",
  dim:        "rgba(236,238,248,0.20)",
  red:        "#FF6B6B",
  green:      "#4ADE80",
  font:       "'Syne', sans-serif",
  body:       "'Outfit', sans-serif",
  mono:       "'JetBrains Mono', monospace",
};

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.body}; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 3px; }

  @keyframes floatY {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-18px) rotate(1deg); }
  }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 ${G.goldGlow}; }
    70%  { box-shadow: 0 0 0 20px rgba(201,168,76,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400% center; }
    100% { background-position: 400% center; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes gridPulse {
    0%,100% { opacity: 0.03; }
    50%      { opacity: 0.06; }
  }
  @keyframes orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(60px,-40px) scale(1.1); }
    66%      { transform: translate(-30px,50px) scale(0.95); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(-80px,30px) scale(1.08); }
    66%      { transform: translate(40px,-60px) scale(0.92); }
  }
  @keyframes counterUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes borderFlow {
    0%,100% { border-color: rgba(201,168,76,0.18); }
    50%      { border-color: rgba(201,168,76,0.42); }
  }

  .gold-shimmer {
    background: linear-gradient(90deg, ${G.gold}, ${G.goldLight}, ${G.goldPale}, ${G.goldLight}, ${G.gold});
    background-size: 400% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }

  .btn-gold {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 17px 38px;
    background: linear-gradient(135deg, ${G.gold} 0%, #A07828 100%);
    color: #06060D;
    font-family: ${G.font}; font-weight: 800; font-size: 13px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border-radius: 10px; text-decoration: none; border: none; cursor: pointer;
    transition: all 0.22s ease;
    box-shadow: 0 8px 32px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18);
    position: relative; overflow: hidden;
  }
  .btn-gold::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.2s;
  }
  .btn-gold:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(201,168,76,0.55); }
  .btn-gold:hover::before { opacity: 1; }

  .btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 16px 34px;
    background: rgba(201,168,76,0.04);
    color: ${G.gold};
    font-family: ${G.font}; font-weight: 700; font-size: 13px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 10px; text-decoration: none;
    border: 1.5px solid rgba(201,168,76,0.35);
    transition: all 0.22s ease; cursor: pointer;
  }
  .btn-outline:hover {
    background: ${G.goldDim}; border-color: ${G.gold};
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.18);
  }

  .feature-card {
    padding: 28px; border-radius: 16px;
    background: ${G.surface};
    border: 1px solid ${G.border};
    transition: all 0.28s ease; cursor: default; position: relative; overflow: hidden;
  }
  .feature-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: radial-gradient(circle at 30% 20%, rgba(201,168,76,0.08) 0%, transparent 70%);
    transition: opacity 0.3s;
  }
  .feature-card:hover {
    border-color: rgba(201,168,76,0.38) !important;
    transform: translateY(-5px);
    box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.14);
  }
  .feature-card:hover::before { opacity: 1; }

  .step-card {
    padding: 30px 26px; border-radius: 16px;
    border: 1px solid ${G.border};
    background: rgba(255,255,255,0.018);
    transition: all 0.26s ease; position: relative; overflow: hidden;
  }
  .step-card:hover {
    border-color: rgba(201,168,76,0.35);
    background: rgba(201,168,76,0.04);
    transform: translateY(-4px);
  }

  .tcard {
    padding: 28px; border-radius: 16px;
    background: ${G.surface}; border: 1px solid ${G.border};
    transition: all 0.25s ease;
  }
  .tcard:hover {
    border-color: rgba(201,168,76,0.32);
    transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.4);
  }

  .nav-link-item {
    font-family: ${G.font}; font-size: 12px; font-weight: 700;
    color: ${G.muted}; letter-spacing: 0.12em; text-decoration: none;
    text-transform: uppercase; transition: color 0.2s; position: relative;
  }
  .nav-link-item::after {
    content: ''; position: absolute; bottom: -3px; left: 0; right: 0; height: 1px;
    background: ${G.gold}; transform: scaleX(0); transition: transform 0.2s; transform-origin: left;
  }
  .nav-link-item:hover { color: ${G.gold}; }
  .nav-link-item:hover::after { transform: scaleX(1); }

  /* Grid background */
  .grid-bg {
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridPulse 6s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    .hero-title { font-size: 36px !important; }
    .nav-links-d { display: none !important; }
    .tech-grid { grid-template-columns: 1fr !important; }
    .steps-grid { grid-template-columns: 1fr !important; }
    .tgrid { grid-template-columns: 1fr !important; }
    .about-grid { grid-template-columns: 1fr !important; }
    .cta-group { flex-direction: column !important; align-items: stretch !important; }
    .cta-group a, .cta-group button { text-align: center; justify-content: center; }
    .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-pad { padding: 110px 20px 70px !important; }
  }
`;

// ─── REAL MANIFIX LOGO ──────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1C1C32"/>
        <stop offset="100%" stopColor="#08080F"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C9A84C"/>
        <stop offset="100%" stopColor="#F2D06B"/>
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    {/* Background */}
    <rect width="40" height="40" rx="10" fill="url(#logoGrad)"/>
    {/* Outer glow border */}
    <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="url(#goldGrad)" strokeOpacity="0.35" strokeWidth="1"/>
    {/* M letterform — bold manifix M */}
    <path
      d="M6 31V11L12.5 11L19 22L25.5 11L32 11V31H27V19.5L19 31.5L11 19.5V31Z"
      fill="white"
      filter="url(#logoGlow)"
    />
    {/* Gold accent dot — top right */}
    <circle cx="33" cy="9" r="4" fill="url(#goldGrad)" filter="url(#logoGlow)"/>
    {/* Thin gold underline */}
    <rect x="6" y="33.5" width="28" height="1.5" rx="0.75" fill="url(#goldGrad)" opacity="0.6"/>
  </svg>
);

// ─── FADE IN ─────────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 28 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

// ─── TICKER ───────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "🏆 AI-Verified Discipline", "⚡ Magic16 Protocol", "🧠 AI Health Intelligence",
  "💤 SleepGold Engine", "🌍 Global Leaderboard", "🤖 24/7 AI Coach",
  "❤️ Women's Wellness AI", "🧒 Children's Health Guard", "💊 Medication Tracker",
  "🧘 Mental Health AI", "🔥 Burnout Shield", "🥗 Nutrition Intelligence",
  "👴 Elderly Care AI", "🛡️ Preventive Health", "💎 Elite Membership",
  "🏆 AI-Verified Discipline", "⚡ Magic16 Protocol", "🧠 AI Health Intelligence",
  "💤 SleepGold Engine", "🌍 Global Leaderboard", "🤖 24/7 AI Coach",
  "❤️ Women's Wellness AI", "🧒 Children's Health Guard", "💊 Medication Tracker",
  "🧘 Mental Health AI", "🔥 Burnout Shield", "🥗 Nutrition Intelligence",
];

function Ticker() {
  return (
    <div style={{
      overflow: "hidden", padding: "13px 0",
      borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`,
      background: "rgba(201,168,76,0.025)",
    }}>
      <div style={{ display: "flex", gap: "52px", width: "max-content", animation: "ticker 45s linear infinite" }}>
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} style={{ fontFamily: G.mono, fontSize: "11px", color: G.muted, letterSpacing: "0.09em", whiteSpace: "nowrap" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── STAT COUNTER ─────────────────────────────────────────────────────────────────
function StatCounter({ value, label, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const target = parseInt(value.toString().replace(/\D/g, ""));

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const totalSteps = 60;
    const stepTime = duration / totalSteps;
    const timer = setInterval(() => {
      start += Math.ceil(target / totalSteps);
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: G.font, fontSize: "clamp(38px, 4vw, 52px)", fontWeight: 800,
        color: G.gold, lineHeight: 1,
        textShadow: `0 0 40px ${G.goldGlow}`,
      }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: "12px", color: G.muted, marginTop: "8px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: G.mono }}>
        {label}
      </div>
    </div>
  );
}

// ─── MODULE TAG ──────────────────────────────────────────────────────────────────
function ModuleTag({ color = G.gold }) {
  return (
    <span style={{
      fontFamily: G.mono, fontSize: "9px", letterSpacing: "0.14em",
      padding: "3px 10px", borderRadius: "20px",
      border: `1px solid ${color}30`,
      color, background: `${color}12`,
    }}>MODULE</span>
  );
}

// ─── MAIN LANDING COMPONENT ──────────────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const id = "manifix-landing-v3";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // All 10 platform modules
  const MODULES = [
    {
      icon: "⚡",
      tag: "CORE",
      title: "Magic16 Protocol",
      headline: "16 Minutes. Elite Performance. Verified.",
      desc: "The world's first AI-verified 16-minute daily protocol. 8 minutes of AI-pose-verified yoga + 8 minutes of guided meditation. Your score is verified, ranked globally, and streak-tracked daily.",
      color: G.gold,
      stats: [["16 min", "Daily Protocol"], ["Real-time", "AI Verification"], ["Global", "Leaderboard"]],
    },
    {
      icon: "🤖",
      tag: "AI",
      title: "AI Conversation Coach",
      headline: "Your 24/7 Intelligent Strategist",
      desc: "A GPT-powered personal coach that adapts to your goals, schedule, and performance data. Ask anything — from mindset rewiring to productivity planning — and get precision responses that evolve with you.",
      color: "#6EE7B7",
      stats: [["24/7", "Always On"], ["Adaptive", "Intelligence"], ["Goal-Synced", "Coaching"]],
    },
    {
      icon: "💤",
      tag: "SLEEP",
      title: "SleepGold Engine",
      headline: "Binaural-Driven Deep Sleep Science",
      desc: "The most advanced sleep module on any wellness platform. Real binaural beat engine, delta-wave entrainment, circadian rhythm optimizer, and AI-analyzed sleep quality scoring. Wake up elite, every morning.",
      color: "#818CF8",
      stats: [["Binaural", "Beat Engine"], ["Delta-Wave", "Entrainment"], ["AI Sleep", "Scoring"]],
    },
    {
      icon: "❤️",
      tag: "WELLNESS",
      title: "Women's Health AI",
      headline: "Intelligent Hormonal & Cycle Wellness",
      desc: "Comprehensive women's health intelligence: cycle tracking, hormonal wellness insights, menopause guidance, fertility awareness, and mood-based AI coaching. Science-grounded, deeply personalized.",
      color: "#F472B6",
      stats: [["Cycle", "Intelligence"], ["Hormonal", "Insights"], ["AI-Guided", "Wellness"]],
    },
    {
      icon: "🧒",
      tag: "FAMILY",
      title: "Children's Health Guard",
      headline: "Age-Calibrated Child Development AI",
      desc: "Complete pediatric wellness module with age-adjusted BMI percentile tracking, developmental milestone monitoring, vaccination schedules, and parent-guided AI health coaching for ages 2–17.",
      color: "#34D399",
      stats: [["Age-Adjusted", "BMI Percentile"], ["Milestone", "Tracking"], ["Vaccination", "Scheduler"]],
    },
    {
      icon: "💊",
      tag: "HEALTH",
      title: "Smart Medication Tracker",
      headline: "Never Miss a Dose. Ever.",
      desc: "Intelligent medication management with precision scheduling, drug interaction alerts, refill reminders, and compliance analytics. Built with clinical-grade timing logic for complex medication regimens.",
      color: "#FCD34D",
      stats: [["Precision", "Scheduling"], ["Interaction", "Alerts"], ["Compliance", "Analytics"]],
    },
    {
      icon: "🧘",
      tag: "MENTAL",
      title: "Mental Health AI",
      headline: "Your Private Mental Wellness Partner",
      desc: "Evidence-based mental health support with CBT-inspired journaling, mood pattern recognition, anxiety tracking, and daily therapeutic check-ins. Fully private. Always available.",
      color: "#A78BFA",
      stats: [["CBT-Inspired", "Journaling"], ["Mood", "Pattern AI"], ["Daily", "Check-ins"]],
    },
    {
      icon: "🔥",
      tag: "PERFORMANCE",
      title: "Stress & Burnout Shield",
      headline: "Detect Burnout Before It Breaks You",
      desc: "Advanced stress biometrics, cortisol-level estimation, workload analysis, and burnout risk scoring. Get proactive interventions, recovery protocols, and resilience-building daily actions before burnout hits.",
      color: "#FB7185",
      stats: [["Burnout", "Risk Score"], ["Cortisol", "Estimation"], ["Recovery", "Protocols"]],
    },
    {
      icon: "🥗",
      tag: "NUTRITION",
      title: "Nutrition Intelligence",
      headline: "AI-Powered Food Science for Your Body",
      desc: "Personalized nutrition tracking with macro optimization, micronutrient gap detection, meal planning AI, and metabolic health scoring. Supports 18 languages with culturally-aware meal recommendations.",
      color: "#86EFAC",
      stats: [["18", "Languages"], ["Macro", "Optimizer"], ["Metabolic", "Scoring"]],
    },
    {
      icon: "👴",
      tag: "CARE",
      title: "Elderly Care AI",
      headline: "Dignity, Safety & Wellness for Every Age",
      desc: "Specialized elderly wellness with fall risk assessment, cognitive health monitoring, mobility tracking, emergency contact integration, and caregiver coordination tools. Care that never sleeps.",
      color: "#67E8F9",
      stats: [["Fall Risk", "Assessment"], ["Cognitive", "Monitoring"], ["Emergency", "Integration"]],
    },
  ];

  const STEPS = [
    { num: "01", icon: "⚡", title: "Create Your Elite Profile", desc: "Sign up in 60 seconds. Answer a 3-minute AI calibration to personalize your coach, health modules, and discipline path." },
    { num: "02", icon: "🎯", title: "Activate Your Modules", desc: "Choose from 10 AI-powered health and wellness modules. Each one activates instantly and begins learning your patterns from day one." },
    { num: "03", icon: "🏆", title: "Complete Magic16 Daily", desc: "Run your verified 16-minute protocol every day. AI tracks your poses, confirms your session, and posts your score to the global leaderboard." },
    { num: "04", icon: "📈", title: "Rise. Track. Dominate.", desc: "Watch your discipline score climb globally. Access deep AI insights, streak analytics, and personalized interventions every single week." },
  ];

  const TESTIMONIALS = [
    { name: "Arjun V.", role: "Software Engineer · Top 50 Global", text: "The SleepGold binaural engine genuinely changed my sleep quality in week one. Combined with Magic16 — I'm operating at a level I didn't know was possible.", stars: 5 },
    { name: "Priya M.", role: "Founder · Streak 94 Days", text: "The Women's Health AI is unlike anything I've used. It understands cycle-based energy planning. ManifiX is the only app that treats women's wellness with real depth.", stars: 5 },
    { name: "Nikhil T.", role: "Athlete · Elite Tier", text: "The AI pose verification is not a gimmick. It caught my form issues that I had for years. The global leaderboard keeps me coming back every single morning. Nothing comes close.", stars: 5 },
    { name: "Sana K.", role: "Mother · Pediatric Module", text: "The Children's Health Guard with age-adjusted BMI percentiles finally gave me actual clinical context for my son's health. This is what parenting apps should be.", stars: 5 },
    { name: "Rohan D.", role: "Executive · Mental Health Module", text: "The Burnout Shield flagged my high-risk week before I even felt it. The CBT journaling + mood pattern AI is genuinely therapeutic. ManifiX saved my Q2.", stars: 5 },
    { name: "Meera S.", role: "Nutritionist · Verified User", text: "As a nutrition professional, I was skeptical. The AI macro optimizer and metabolic scoring are surprisingly accurate. I recommend ManifiX to every client now.", stars: 5 },
  ];

  return (
    <div style={{ background: G.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>ManifiX AI | The World's Most Complete Human Performance Platform</title>
        <meta name="description" content="10 AI-powered health & discipline modules. Magic16 protocol. SleepGold engine. Global leaderboard. The future of human optimization starts here." />
        <meta property="og:title" content="ManifiX AI | 10 AI Modules. One Elite Platform." />
        <meta property="og:description" content="AI-verified discipline. Sleep science. Women's health. Children's care. Mental wellness. Nutrition AI. The most complete human performance platform ever built." />
        <meta name="theme-color" content="#C9A84C" />
      </Helmet>

      {/* ── ANIMATED BACKGROUND ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.5 }}>
        <Balatro />
      </div>
      {/* Grid overlay */}
      <div className="grid-bg" style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />
      {/* Gradient overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2,
        background: `linear-gradient(180deg, ${G.bg}88 0%, ${G.bg}CC 50%, ${G.bg}FF 100%)`,
      }} />
      {/* Ambient orbs */}
      <div style={{
        position: "fixed", width: "700px", height: "700px", borderRadius: "50%",
        top: "-15%", left: "-10%", zIndex: 2, pointerEvents: "none",
        background: `radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 70%)`,
        filter: "blur(60px)", animation: "orb1 18s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
        bottom: "10%", right: "-8%", zIndex: 2, pointerEvents: "none",
        background: `radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)`,
        filter: "blur(60px)", animation: "orb2 22s ease-in-out infinite",
      }} />

      {/* ── CONTENT ── */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── NAV ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: "66px",
          background: scrolled ? "rgba(6,6,13,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${G.border}` : "1px solid transparent",
          transition: "all 0.35s ease",
        }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "11px", textDecoration: "none" }}>
            <ManifixLogo size={36} />
            <div>
              <div style={{ fontFamily: G.font, fontWeight: 800, fontSize: "17px", color: G.gold, letterSpacing: "0.18em", lineHeight: 1.1 }}>
                MANIFIX AI
              </div>
              <div style={{ fontFamily: G.mono, fontSize: "8px", color: G.dim, letterSpacing: "0.22em" }}>
                HUMAN PERFORMANCE OS
              </div>
            </div>
          </Link>

          <div className="nav-links-d" style={{ display: "flex", alignItems: "center", gap: "36px" }}>
            {[["#modules", "Platform"], ["#how", "How It Works"], ["#about", "About"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="nav-link-item">{label}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link to="/login" style={{
              fontFamily: G.font, fontWeight: 700, fontSize: "12px",
              color: G.muted, letterSpacing: "0.1em", textDecoration: "none",
              textTransform: "uppercase", transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = G.gold}
              onMouseLeave={e => e.currentTarget.style.color = G.muted}
            >Login</Link>
            <Link to="/signup" style={{
              fontFamily: G.font, fontWeight: 800, fontSize: "11px",
              color: "#06060D", letterSpacing: "0.1em", textDecoration: "none",
              textTransform: "uppercase",
              padding: "9px 20px",
              background: `linear-gradient(135deg, ${G.gold}, #A07828)`,
              borderRadius: "7px",
              boxShadow: `0 4px 16px rgba(201,168,76,0.3)`,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,168,76,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,168,76,0.3)"; }}
            >Start Free →</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <header className="hero-pad" style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "120px 24px 80px",
          position: "relative",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: "920px" }}
          >
            {/* Founder badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "7px 20px", borderRadius: "24px", marginBottom: "32px",
                background: "rgba(201,168,76,0.08)",
                border: `1px solid rgba(201,168,76,0.32)`,
                fontFamily: G.mono, fontSize: "10px", color: G.gold,
                letterSpacing: "0.12em", fontWeight: 500,
                animation: "pulseRing 3.5s ease-in-out infinite",
              }}
            >
              🏆 &nbsp;WORLD'S MOST COMPLETE HUMAN PERFORMANCE PLATFORM · 2026
            </motion.div>

            {/* Main headline */}
            <h1 className="hero-title" style={{
              fontFamily: G.font, fontWeight: 800,
              fontSize: "clamp(44px, 7.5vw, 90px)",
              lineHeight: 1.04, letterSpacing: "-0.03em",
              color: G.text, marginBottom: "12px",
            }}>
              10 AI Modules.
            </h1>
            <h1 style={{
              fontFamily: G.font, fontWeight: 800,
              fontSize: "clamp(44px, 7.5vw, 90px)",
              lineHeight: 1.04, letterSpacing: "-0.03em",
              marginBottom: "28px",
            }}>
              <span className="gold-shimmer">One Elite Platform.</span>
            </h1>

            {/* Sub headline */}
            <p style={{
              fontFamily: G.body, fontSize: "clamp(16px, 2vw, 20px)",
              color: G.muted, maxWidth: "620px", margin: "0 auto 48px",
              lineHeight: 1.7, fontWeight: 400,
            }}>
              Magic16 Protocol. SleepGold Engine. Women's Health. Children's Care. Mental Wellness. Burnout Shield. Nutrition AI. Medication Tracker. Elderly Care. All verified by AI. All in one place.
            </p>

            {/* CTAs */}
            <div className="cta-group" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
              <Link to="/signup" className="btn-gold" style={{ fontSize: "13px", padding: "18px 42px" }}>
                BEGIN YOUR EVOLUTION →
              </Link>
              <a href="#modules" className="btn-outline">
                Explore 10 Modules
              </a>
            </div>

            {/* Social proof pills */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
              {[
                { icon: "👥", text: "12,000+ Members" },
                { icon: "🌍", text: "4 Countries" },
                { icon: "⭐", text: "4.9 / 5 Rating" },
                { icon: "🏥", text: "10 Health Modules" },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "20px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  fontFamily: G.mono, fontSize: "10px", color: G.dim,
                  letterSpacing: "0.06em",
                }}>
                  {p.icon} {p.text}
                </div>
              ))}
            </div>

            {/* Urgency */}
            <p style={{
              fontFamily: G.mono, fontSize: "11px",
              color: "rgba(255,107,107,0.8)",
              marginTop: "20px", letterSpacing: "0.07em",
            }}>
              ⚠️ &nbsp;Founding member rate ₹1,999/month · Only 12 spots remaining in your region
            </p>
          </motion.div>

          {/* Floating M badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{
              position: "absolute", right: "5%", top: "30%",
              width: "90px", height: "90px", borderRadius: "22px",
              background: G.surface2,
              border: `1px solid rgba(201,168,76,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "floatY 8s ease-in-out infinite",
              boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(201,168,76,0.12)`,
            }}
          >
            <ManifixLogo size={52} />
          </motion.div>
        </header>

        {/* ── TICKER ── */}
        <Ticker />

        {/* ── STATS ── */}
        <section style={{ padding: "80px 24px" }}>
          <FadeIn>
            <div className="stats-row" style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: "40px", maxWidth: "960px", margin: "0 auto",
            }}>
              <StatCounter value="12000" suffix="+" label="Active Members" />
              <StatCounter value="10" label="AI Health Modules" />
              <StatCounter value="16" label="Minute Daily Protocol" />
              <StatCounter value="98" suffix="%" label="Member Satisfaction" />
            </div>
          </FadeIn>
        </section>

        {/* ── 10 MODULES SECTION ── */}
        <section id="modules" style={{ padding: "100px 24px", background: "rgba(201,168,76,0.015)", borderTop: `1px solid ${G.border}` }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.2em" }}>
                THE FULL PLATFORM
              </span>
            </div>
            <h2 style={{
              fontFamily: G.font, fontWeight: 800,
              fontSize: "clamp(30px, 4.5vw, 52px)",
              color: G.text, textAlign: "center", marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}>
              10 Modules. Every Dimension of{" "}
              <span className="gold-shimmer">Human Health.</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: "16px", color: G.muted, maxWidth: "560px", margin: "0 auto 60px", lineHeight: 1.7 }}>
              From peak physical performance to deep sleep science, mental clarity, and family care —
              ManifiX is the only platform that covers it all.
            </p>
          </FadeIn>

          <div className="tech-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px", maxWidth: "1140px", margin: "0 auto",
          }}>
            {MODULES.map((mod, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="feature-card" style={{ cursor: "default" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ fontSize: "30px" }}>{mod.icon}</div>
                    <div style={{
                      fontFamily: G.mono, fontSize: "9px", letterSpacing: "0.16em",
                      padding: "4px 10px", borderRadius: "20px",
                      border: `1px solid ${mod.color}30`,
                      color: mod.color, background: `${mod.color}10`,
                    }}>{mod.tag}</div>
                  </div>
                  <div style={{ fontFamily: G.mono, fontSize: "9px", color: mod.color, letterSpacing: "0.12em", marginBottom: "6px", opacity: 0.7 }}>
                    MANIFIX
                  </div>
                  <h3 style={{ fontFamily: G.font, fontSize: "19px", fontWeight: 800, color: G.text, marginBottom: "6px", letterSpacing: "0.01em" }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: mod.color, fontFamily: G.font, fontWeight: 600, marginBottom: "12px", letterSpacing: "0.02em" }}>
                    {mod.headline}
                  </p>
                  <p style={{ fontSize: "13.5px", color: G.muted, lineHeight: 1.7, marginBottom: "18px" }}>
                    {mod.desc}
                  </p>
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {mod.stats.map(([stat, sublabel], si) => (
                      <div key={si} style={{
                        flex: 1, padding: "10px 8px", borderRadius: "8px",
                        background: `${mod.color}09`,
                        border: `1px solid ${mod.color}18`,
                        textAlign: "center",
                      }}>
                        <div style={{ fontFamily: G.font, fontSize: "13px", fontWeight: 800, color: mod.color, lineHeight: 1.1 }}>{stat}</div>
                        <div style={{ fontFamily: G.mono, fontSize: "8.5px", color: G.dim, marginTop: "2px", letterSpacing: "0.06em" }}>{sublabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ padding: "100px 24px" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.2em" }}>THE PROCESS</span>
              <h2 style={{
                fontFamily: G.font, fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 50px)",
                color: G.text, marginTop: "12px", letterSpacing: "-0.02em",
              }}>
                From Zero to <span className="gold-shimmer">Elite</span> in 4 Steps
              </h2>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px", maxWidth: "1100px", margin: "0 auto",
          }}>
            {STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="step-card">
                  <div style={{
                    fontFamily: G.mono, fontSize: "52px", fontWeight: 800,
                    color: "rgba(201,168,76,0.1)", position: "absolute",
                    top: "10px", right: "18px", lineHeight: 1,
                  }}>{step.num}</div>
                  <div style={{ fontSize: "28px", marginBottom: "14px" }}>{step.icon}</div>
                  <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.12em", marginBottom: "8px" }}>
                    STEP {step.num}
                  </div>
                  <h3 style={{ fontFamily: G.font, fontSize: "18px", fontWeight: 800, color: G.text, marginBottom: "10px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" style={{
          padding: "100px 24px",
          background: "rgba(201,168,76,0.015)",
          borderTop: `1px solid ${G.border}`,
        }}>
          <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: "64px" }}>
                <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.2em" }}>OUR STORY</span>
                <h2 style={{
                  fontFamily: G.font, fontWeight: 800,
                  fontSize: "clamp(28px, 4vw, 50px)",
                  color: G.text, marginTop: "12px", marginBottom: "18px",
                  letterSpacing: "-0.02em",
                }}>
                  About <span className="gold-shimmer">ManifiX AI</span>
                </h2>
                <p style={{ fontSize: "17px", color: G.muted, maxWidth: "640px", margin: "0 auto", lineHeight: 1.7 }}>
                  Built in India. Designed for the world. ManifiX is the first platform to combine
                  AI-verified discipline, comprehensive health intelligence, and a global performance
                  community into one seamless experience.
                </p>
              </div>
            </FadeIn>

            <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {[
                { icon: "🎯", title: "Our Mission", body: "We build technology that amplifies human intelligence rather than replacing it. In a world engineered for distraction, ManifiX gives you the systems, science, and AI to sharpen focus and achieve your absolute highest potential — every single day." },
                { icon: "🔭", title: "Our Vision", body: "A world where every person has access to elite-grade health intelligence. Where AI doesn't just answer questions — it rewires how you think, sleep, train, eat, and care for the people you love." },
                { icon: "🏅", title: "Magic16 System", body: "The Magic16 protocol is a 16-step science-backed daily ritual built on breathing research, postural awareness, and cognitive priming. Clinically designed to improve concentration, reduce mental fatigue, and build elite-level daily consistency." },
                { icon: "🌍", title: "Built in India", body: "ManifiX AI Private Limited is headquartered in Visakhapatnam, Andhra Pradesh. We are proud to build world-class AI health technology from India — for every human on the planet who refuses to be average." },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ padding: "28px", borderRadius: "16px", background: G.surface, border: `1px solid ${G.border}` }}>
                    <div style={{ fontSize: "28px", marginBottom: "14px" }}>{item.icon}</div>
                    <h3 style={{ fontFamily: G.font, fontSize: "19px", fontWeight: 800, color: G.text, marginBottom: "10px" }}>{item.title}</h3>
                    <p style={{ fontSize: "14.5px", color: G.muted, lineHeight: 1.75 }}>{item.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding: "100px 24px" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.2em" }}>VERIFIED RESULTS</span>
              <h2 style={{
                fontFamily: G.font, fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 50px)",
                color: G.text, marginTop: "12px", letterSpacing: "-0.02em",
              }}>
                Trusted by the <span className="gold-shimmer">Elite</span>
              </h2>
            </div>
          </FadeIn>
          <div className="tgrid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px", maxWidth: "1100px", margin: "0 auto",
          }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="tcard">
                  <div style={{ marginBottom: "14px" }}>
                    {"★".repeat(t.stars).split("").map((s, si) => (
                      <span key={si} style={{ color: G.gold, fontSize: "13px" }}>{s}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "14.5px", color: G.text, lineHeight: 1.75, marginBottom: "22px", fontStyle: "italic", opacity: 0.88 }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg, ${G.gold}, #A07828)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: G.font, fontWeight: 800, fontSize: "17px", color: "#06060D",
                    }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontFamily: G.font, fontWeight: 700, fontSize: "14px", color: G.text }}>{t.name}</div>
                      <div style={{ fontSize: "11px", color: G.gold, fontFamily: G.mono, letterSpacing: "0.05em" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{
          padding: "100px 24px",
          background: "rgba(201,168,76,0.015)",
          borderTop: `1px solid ${G.border}`,
        }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.2em" }}>INVESTMENT</span>
              <h2 style={{
                fontFamily: G.font, fontWeight: 800,
                fontSize: "clamp(28px, 4vw, 50px)",
                color: G.text, marginTop: "12px", marginBottom: "14px",
                letterSpacing: "-0.02em",
              }}>
                One Plan. <span className="gold-shimmer">All 10 Modules.</span>
              </h2>
              <p style={{ fontSize: "16px", color: G.muted }}>Everything you need. Nothing you don't. Cancel anytime.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{
              maxWidth: "500px", margin: "0 auto",
              padding: "48px 44px", borderRadius: "22px",
              background: G.surface,
              border: `1.5px solid rgba(201,168,76,0.38)`,
              boxShadow: `0 0 80px rgba(201,168,76,0.09), 0 40px 80px rgba(0,0,0,0.6)`,
              textAlign: "center", position: "relative", overflow: "hidden",
              animation: "borderFlow 4s ease-in-out infinite",
            }}>
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: "30%", right: "30%", height: "1px",
                background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)`,
              }} />

              <div style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "6px 16px", borderRadius: "20px", marginBottom: "26px",
                background: G.goldDim, border: `1px solid ${G.border}`,
                fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.12em",
              }}>
                💎 &nbsp;ELITE MEMBERSHIP — ALL MODULES INCLUDED
              </div>

              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontFamily: G.font, fontSize: "68px", fontWeight: 800, color: G.gold, lineHeight: 1 }}>₹1,999</span>
                <span style={{ fontSize: "16px", color: G.muted }}> / month</span>
              </div>
              <p style={{ fontSize: "12px", color: G.dim, marginBottom: "34px", fontFamily: G.mono, letterSpacing: "0.06em" }}>
                Cancel anytime · No hidden fees · Razorpay secured
              </p>

              <div style={{ textAlign: "left", marginBottom: "28px" }}>
                {[
                  "✦ Magic16 AI-Verified Protocol (Daily)",
                  "✦ SleepGold Binaural Engine",
                  "✦ AI Conversation Coach (Unlimited)",
                  "✦ Women's Health Intelligence",
                  "✦ Children's Health Guard (Age-Calibrated)",
                  "✦ Smart Medication Tracker",
                  "✦ Mental Health AI (CBT + Mood AI)",
                  "✦ Stress & Burnout Shield",
                  "✦ Nutrition Intelligence (18 Languages)",
                  "✦ Elderly Care AI Module",
                  "✦ Global Leaderboard Ranking",
                  "✦ Priority AI Coach Responses",
                ].map((feature, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 0",
                    borderBottom: i < 11 ? `1px solid rgba(255,255,255,0.042)` : "none",
                  }}>
                    <span style={{ color: G.gold, fontSize: "11px", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "13.5px", color: G.muted }}>{feature.replace("✦ ", "")}</span>
                  </div>
                ))}
              </div>

              <Link to="/signup" className="btn-gold" style={{
                width: "100%", justifyContent: "center",
                fontSize: "13px", padding: "18px",
              }}>
                CLAIM ELITE MEMBERSHIP →
              </Link>
              <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, marginTop: "14px", letterSpacing: "0.06em" }}>
                🔒 256-bit encrypted · Razorpay PCI compliant · ManifixAI Pvt Ltd
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: "110px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <FadeIn>
            <div style={{ position: "relative", zIndex: 2 }}>
              <ManifixLogo size={56} />
              <h2 style={{
                fontFamily: G.font, fontWeight: 800,
                fontSize: "clamp(34px, 5.5vw, 64px)",
                color: G.text, marginTop: "24px", marginBottom: "18px",
                lineHeight: 1.06, letterSpacing: "-0.025em",
              }}>
                Your Health. Your Discipline.<br />
                <span className="gold-shimmer">Your Legacy.</span>
              </h2>
              <p style={{ fontSize: "17px", color: G.muted, marginBottom: "44px", maxWidth: "520px", margin: "0 auto 44px", lineHeight: 1.7 }}>
                Join 12,000+ high-performers already using all 10 ManifiX modules to dominate every dimension of their lives.
              </p>
              <div className="cta-group" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/signup" className="btn-gold" style={{ fontSize: "14px", padding: "20px 48px" }}>
                  START YOUR EVOLUTION →
                </Link>
                <Link to="/login" className="btn-outline">
                  Already a Member
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          borderTop: `1px solid ${G.border}`,
          padding: "48px 32px 32px",
          background: G.surface,
        }}>
          <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "32px", marginBottom: "40px" }}>
              {/* Brand */}
              <div style={{ maxWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <ManifixLogo size={34} />
                  <div>
                    <div style={{ fontFamily: G.font, fontWeight: 800, fontSize: "15px", color: G.gold, letterSpacing: "0.16em" }}>MANIFIX AI</div>
                    <div style={{ fontFamily: G.mono, fontSize: "8px", color: G.dim, letterSpacing: "0.18em" }}>HUMAN PERFORMANCE OS</div>
                  </div>
                </div>
                <p style={{ fontSize: "13px", color: G.dim, lineHeight: 1.65 }}>
                  ManifixAI Private Limited<br />
                  Visakhapatnam, Andhra Pradesh 530008, India
                </p>
              </div>

              {/* Links */}
              <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.18em", marginBottom: "14px" }}>PLATFORM</div>
                  {[["#modules", "All 10 Modules"], ["#how", "How It Works"], ["#about", "About Us"], ["#pricing", "Pricing"]].map(([href, label]) => (
                    <a key={href} href={href} style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = G.gold}
                      onMouseLeave={e => e.currentTarget.style.color = G.muted}
                    >{label}</a>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.18em", marginBottom: "14px" }}>LEGAL</div>
                  {[["/privacy", "Privacy Policy"], ["/terms", "Terms & Conditions"]].map(([href, label]) => (
                    <Link key={href} to={href} style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = G.gold}
                      onMouseLeave={e => e.currentTarget.style.color = G.muted}
                    >{label}</Link>
                  ))}
                  <a href="mailto:manifixofficial@gmail.com" style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = G.gold}
                    onMouseLeave={e => e.currentTarget.style.color = G.muted}
                  >Contact Us</a>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${G.border}`,
              paddingTop: "24px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: "12px",
            }}>
              <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.07em" }}>
                © 2025–2026 ManifixAI Private Limited · All rights reserved
              </p>
              <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.07em" }}>
                BUILT IN INDIA 🇮🇳 · BEYOND HUMAN LIMITS
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
