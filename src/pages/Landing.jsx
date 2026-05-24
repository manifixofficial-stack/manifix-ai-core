import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Balatro from "../components/Balatro";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  gold:      "#C8A84B",
  goldLight: "#F0CC6A",
  goldPale:  "#FEF3C7",
  goldDim:   "rgba(200,168,75,0.11)",
  goldGlow:  "rgba(200,168,75,0.28)",
  bg:        "#050508",
  surface:   "#09090F",
  surface2:  "#0D0D18",
  border:    "rgba(200,168,75,0.14)",
  borderMid: "rgba(200,168,75,0.26)",
  text:      "#EDEEF8",
  muted:     "rgba(237,238,248,0.50)",
  dim:       "rgba(237,238,248,0.22)",
  faint:     "rgba(237,238,248,0.10)",
  red:       "#FF6B6B",
  green:     "#4ADE80",
  font:      "'Bebas Neue', sans-serif",
  display:   "'Playfair Display', serif",
  body:      "'DM Sans', sans-serif",
  mono:      "'IBM Plex Mono', monospace",
};

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.body}; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  @keyframes shimmer {
    0%   { background-position: -600% center; }
    100% { background-position: 600% center; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0) rotate(-1deg); }
    50%      { transform: translateY(-22px) rotate(1deg); }
  }
  @keyframes pulse-gold {
    0%,100% { box-shadow: 0 0 0 0 rgba(200,168,75,0.35); }
    60%      { box-shadow: 0 0 0 18px rgba(200,168,75,0); }
  }
  @keyframes orbit1 {
    0%,100% { transform: translate(0px, 0px) scale(1); }
    40%      { transform: translate(80px,-50px) scale(1.12); }
    70%      { transform: translate(-40px, 60px) scale(0.92); }
  }
  @keyframes orbit2 {
    0%,100% { transform: translate(0px, 0px) scale(1); }
    35%      { transform: translate(-90px, 40px) scale(1.08); }
    70%      { transform: translate(50px,-70px) scale(0.94); }
  }
  @keyframes gridPulse {
    0%,100% { opacity: 0.025; }
    50%      { opacity: 0.055; }
  }
  @keyframes borderGlow {
    0%,100% { border-color: rgba(200,168,75,0.20); box-shadow: 0 0 20px rgba(200,168,75,0.04); }
    50%      { border-color: rgba(200,168,75,0.45); box-shadow: 0 0 40px rgba(200,168,75,0.10); }
  }
  @keyframes lineExpand {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform: translateY(30px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes numberUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  .gold-text {
    background: linear-gradient(90deg, #A07830, ${G.gold}, ${G.goldLight}, ${G.goldPale}, ${G.goldLight}, ${G.gold}, #A07830);
    background-size: 600% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 8s linear infinite;
  }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 18px 44px;
    background: linear-gradient(135deg, ${G.gold} 0%, #A07828 50%, ${G.gold} 100%);
    background-size: 200% auto;
    color: #050508;
    font-family: ${G.body}; font-weight: 700; font-size: 13px;
    letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 4px; text-decoration: none; border: none; cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 30px rgba(200,168,75,0.40);
    position: relative; overflow: hidden;
  }
  .btn-primary::after {
    content: ''; position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transition: left 0.5s ease;
    transform: skewX(-20deg);
  }
  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 50px rgba(200,168,75,0.60);
    background-position: right center;
  }
  .btn-primary:hover::after { left: 140%; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 17px 36px;
    background: transparent; color: ${G.muted};
    font-family: ${G.body}; font-weight: 600; font-size: 13px;
    letter-spacing: 0.06em; text-transform: uppercase;
    border-radius: 4px; text-decoration: none;
    border: 1px solid rgba(237,238,248,0.16);
    transition: all 0.25s ease; cursor: pointer;
  }
  .btn-ghost:hover {
    color: ${G.gold}; border-color: rgba(200,168,75,0.45);
    background: ${G.goldDim}; transform: translateY(-2px);
  }

  .mod-card {
    padding: 26px; border-radius: 8px;
    background: ${G.surface};
    border: 1px solid ${G.border};
    transition: all 0.30s cubic-bezier(0.34,1.56,0.64,1);
    cursor: default; position: relative; overflow: hidden;
  }
  .mod-card::after {
    content: ''; position: absolute;
    bottom: 0; left: 0; right: 0; height: 2px;
    background: var(--card-accent, ${G.gold});
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.35s ease;
  }
  .mod-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 28px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,168,75,0.18);
    border-color: rgba(200,168,75,0.35);
  }
  .mod-card:hover::after { transform: scaleX(1); }

  .step-card {
    padding: 32px 28px; border-radius: 8px;
    border: 1px solid ${G.border};
    background: rgba(255,255,255,0.015);
    transition: all 0.28s ease; position: relative;
  }
  .step-card:hover {
    border-color: rgba(200,168,75,0.38);
    background: rgba(200,168,75,0.035);
    transform: translateY(-5px);
  }

  .t-card {
    padding: 28px; border-radius: 8px;
    background: ${G.surface}; border: 1px solid ${G.border};
    transition: all 0.25s ease;
  }
  .t-card:hover {
    border-color: rgba(200,168,75,0.35);
    transform: translateY(-4px);
    box-shadow: 0 22px 52px rgba(0,0,0,0.42);
  }

  .nav-a {
    font-family: ${G.body}; font-size: 13px; font-weight: 600;
    color: ${G.muted}; letter-spacing: 0.06em;
    text-decoration: none; text-transform: uppercase;
    transition: color 0.2s; position: relative;
  }
  .nav-a::after {
    content: ''; position: absolute;
    bottom: -4px; left: 0; right: 0; height: 1px;
    background: ${G.gold}; transform: scaleX(0);
    transition: transform 0.22s; transform-origin: left;
  }
  .nav-a:hover { color: ${G.gold}; }
  .nav-a:hover::after { transform: scaleX(1); }

  .grid-bg {
    background-image:
      linear-gradient(rgba(200,168,75,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,168,75,0.04) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: gridPulse 7s ease-in-out infinite;
  }

  @media (max-width: 900px) {
    .nav-mid { display: none !important; }
    .hero-h1 { font-size: clamp(52px, 14vw, 80px) !important; }
    .hero-sub { font-size: 16px !important; max-width: 100% !important; }
    .mods-grid { grid-template-columns: 1fr !important; }
    .steps-grid { grid-template-columns: 1fr 1fr !important; }
    .tgrid { grid-template-columns: 1fr !important; }
    .about-grid { grid-template-columns: 1fr !important; }
    .cta-row { flex-direction: column !important; align-items: stretch !important; }
    .cta-row > * { text-align: center; justify-content: center; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-badge-float { display: none !important; }
    .footer-inner { flex-direction: column !important; gap: 32px !important; }
  }
  @media (max-width: 540px) {
    .steps-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── REAL LOGO ────────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 36, className = "" }) => (
  <img
    src="/assets/logo.png"
    alt="ManifiX AI Logo"
    width={size}
    height={size}
    className={className}
    style={{ objectFit: "contain", display: "block" }}
    onError={e => {
      // Fallback to SVG if image fails
      e.currentTarget.style.display = "none";
      e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = "flex");
    }}
  />
);

// Fallback SVG (hidden unless image fails)
const ManifixLogoFallback = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: "none" }}>
    <defs>
      <linearGradient id="fbGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1A1A2E"/>
        <stop offset="100%" stopColor="#050508"/>
      </linearGradient>
      <linearGradient id="fbGold" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C8A84B"/>
        <stop offset="100%" stopColor="#F0CC6A"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="9" fill="url(#fbGrad)"/>
    <rect x="0.5" y="0.5" width="39" height="39" rx="8.5" stroke="url(#fbGold)" strokeOpacity="0.35" strokeWidth="1"/>
    <path d="M6 30V12L12.5 12L20 23L27.5 12L34 12V30H29V20L20 32L11 20V30Z" fill="white"/>
    <circle cx="33" cy="9" r="3.5" fill="url(#fbGold)"/>
  </svg>
);

// Logo wrapper (shows img, falls back to SVG)
const Logo = ({ size = 36 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
    <ManifixLogo size={size} />
    <ManifixLogoFallback size={size} />
  </span>
);

// ─── UTILS ──────────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 30, x = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

function StatCounter({ to, suffix = "", label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const steps = 55; const ms = 1800 / steps;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setN(Math.round(to * (i / steps)));
      if (i >= steps) clearInterval(t);
    }, ms);
    return () => clearInterval(t);
  }, [inView, to]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: G.font, fontSize: "clamp(40px,5vw,58px)", color: G.gold, lineHeight: 1, letterSpacing: "0.02em", textShadow: `0 0 50px ${G.goldGlow}` }}>
        {n.toLocaleString()}{suffix}
      </div>
      <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, marginTop: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ─── TICKER ──────────────────────────────────────────────────────────────────────
const TICKS = [
  "⚡ Magic16 Protocol", "💤 SleepGold Binaural Engine", "🌍 Global Leaderboard",
  "🤖 AI Conversation Coach", "❤️ Women's Health AI", "🧒 Children's Health Guard",
  "💊 Smart Medication Tracker", "🧘 Mental Health AI", "🔥 Burnout Shield",
  "🥗 Nutrition Intelligence", "👴 Elderly Care AI", "🛡️ Preventive Health",
  "💎 Elite Membership", "🏆 AI-Verified Discipline", "🧠 Human Performance OS",
  "⚡ Magic16 Protocol", "💤 SleepGold Binaural Engine", "🌍 Global Leaderboard",
  "🤖 AI Conversation Coach", "❤️ Women's Health AI", "🧒 Children's Health Guard",
  "💊 Smart Medication Tracker", "🧘 Mental Health AI", "🔥 Burnout Shield",
  "🥗 Nutrition Intelligence", "👴 Elderly Care AI", "🛡️ Preventive Health",
];

function Ticker() {
  return (
    <div style={{ overflow: "hidden", padding: "14px 0", borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`, background: "rgba(200,168,75,0.02)" }}>
      <div style={{ display: "flex", gap: "56px", width: "max-content", animation: "ticker 55s linear infinite" }}>
        {TICKS.map((t, i) => (
          <span key={i} style={{ fontFamily: G.mono, fontSize: "11px", color: G.dim, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "0 auto", maxWidth: "200px", padding: "0 0 60px" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${G.gold})` }} />
      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: G.gold, boxShadow: `0 0 8px ${G.goldGlow}` }} />
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${G.gold}, transparent)` }} />
    </div>
  );
}

// ─── SECTION EYEBROW ─────────────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "18px" }}>
      <div style={{ width: "32px", height: "1px", background: G.gold, opacity: 0.5 }} />
      <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.24em", textTransform: "uppercase" }}>{children}</span>
      <div style={{ width: "32px", height: "1px", background: G.gold, opacity: 0.5 }} />
    </div>
  );
}

// ─── MODULES DATA ─────────────────────────────────────────────────────────────────
const MODULES = [
  { icon: "⚡", tag: "CORE", color: "#C8A84B", title: "Magic16 Protocol", headline: "16 Minutes. AI-Verified. Elite.", desc: "The world's only AI-pose-verified 16-minute daily protocol. Real-time neural tracking. Global leaderboard scoring. Streak-enforced discipline with zero shortcuts.", stats: [["16", "Minutes"], ["Real-Time", "AI Pose"], ["Global", "Rank"]] },
  { icon: "🤖", tag: "AI", color: "#6EE7B7", title: "AI Conversation Coach", headline: "Your 24/7 GPT Strategist", desc: "An always-on GPT-powered coach that adapts to your goals, energy, and patterns daily. Ask anything. Get precision. Rewire your mindset systematically.", stats: [["24/7", "On-Demand"], ["Adaptive", "Memory"], ["Goal", "Synced"]] },
  { icon: "💤", tag: "SLEEP", color: "#818CF8", title: "SleepGold Engine", headline: "Binaural Deep Sleep Science", desc: "The most advanced sleep AI on any platform. Real binaural beat engine, delta-wave entrainment, circadian rhythm optimizer, and sleep quality scoring. Wake up transformed.", stats: [["Binaural", "Engine"], ["Delta-Wave", "Sync"], ["Sleep", "Score"]] },
  { icon: "❤️", tag: "WOMEN", color: "#F472B6", title: "Women's Health AI", headline: "Cycle-Intelligent Wellness", desc: "Hormonal health intelligence, menstrual cycle tracking, fertility awareness, menopause guidance, and mood-based AI coaching. Science-grounded. Deeply personal.", stats: [["Cycle", "Tracking"], ["Hormone", "Insights"], ["AI", "Coaching"]] },
  { icon: "🧒", tag: "FAMILY", color: "#34D399", title: "Children's Health Guard", headline: "Age-Calibrated Pediatric AI", desc: "Age-adjusted BMI percentile tracking, developmental milestone monitoring, vaccination schedules, and parent-guided AI health coaching for ages 2–17. Clinically calibrated.", stats: [["Age-Adjusted", "BMI%"], ["Milestone", "AI"], ["Vaccination", "Tracker"]] },
  { icon: "💊", tag: "MED", color: "#FCD34D", title: "Smart Medication Tracker", headline: "Never Miss. Never Double.", desc: "Clinical-grade medication scheduling with drug interaction alerts, refill reminders, and compliance analytics. Precision timing logic for complex multi-drug regimens.", stats: [["Clinical", "Timing"], ["Drug", "Alerts"], ["Compliance", "AI"]] },
  { icon: "🧘", tag: "MENTAL", color: "#A78BFA", title: "Mental Health AI", headline: "CBT-Backed Private Wellness", desc: "Evidence-based support with CBT-inspired journaling, mood pattern recognition, anxiety tracking, and daily therapeutic check-ins. Fully private. Zero judgment.", stats: [["CBT", "Journaling"], ["Mood", "Patterns"], ["Daily", "Check-in"]] },
  { icon: "🔥", tag: "PERF", color: "#FB7185", title: "Stress & Burnout Shield", headline: "Detect Burnout Before It Hits", desc: "Cortisol-level estimation, workload analysis, burnout risk scoring, and proactive recovery protocols. Know your risk days before they become crisis days.", stats: [["Burnout", "Score"], ["Cortisol", "Est."], ["Recovery", "Plan"]] },
  { icon: "🥗", tag: "NUTR", color: "#86EFAC", title: "Nutrition Intelligence", headline: "AI Food Science. 18 Languages.", desc: "Macro optimization, micronutrient gap detection, metabolic health scoring, and culturally-aware meal planning AI. Personalized to your body, your culture, your goals.", stats: [["18", "Languages"], ["Macro", "AI"], ["Metabolic", "Score"]] },
  { icon: "👴", tag: "CARE", color: "#67E8F9", title: "Elderly Care AI", headline: "Dignity. Safety. Intelligence.", desc: "Fall risk assessment, cognitive health monitoring, mobility tracking, emergency contact integration with real escalation flows. Care that protects every generation.", stats: [["Fall", "Prevention"], ["Cognitive", "AI"], ["Emergency", "SOS"]] },
];

const STEPS = [
  { n: "01", icon: "⚡", title: "Create Your Elite Profile", body: "Sign up in under 60 seconds. Complete a 3-minute AI calibration that personalizes every module, your coach, and your discipline path." },
  { n: "02", icon: "🎛️", title: "Activate Your 10 Modules", body: "Unlock all 10 AI health modules instantly. Each one activates, learns your patterns, and begins delivering insights from day one." },
  { n: "03", icon: "🏆", title: "Complete Magic16 Daily", body: "Your AI-verified 16-minute protocol runs every morning. Real-time pose tracking confirms your session and posts your verified score to the global leaderboard." },
  { n: "04", icon: "📈", title: "Rise. Dominate. Own Your Rank.", body: "Watch your global rank climb. Access AI insights, streak analytics, and personalized health intelligence every single week — forever." },
];

const TESTIMONIALS = [
  { name: "Shyam G.", role: "Engineer · Top 50 Global Rank", text: "SleepGold's binaural engine changed my sleep in week one. Magic16 on top? I'm operating at a level I didn't know existed.", stars: 5 },
  { name: "Priya L.", role: "user · 94-Day Streak", text: "The Women's Health AI is the only wellness system that actually understands cycle-based energy. ManifiX is leagues ahead.", stars: 5 },
  { name: "Nikhil T.", role: "Engineer · Elite Tier", text: "The AI pose verification caught form issues I'd had for years. The leaderboard is addictive. I've never missed a day.", stars: 5 },
  { name: "hari K.", role: "user· Pediatric Module", text: "Age-adjusted BMI percentiles gave me actual clinical context for my son's health. This is what parenting apps should be.", stars: 5 },
  { name: "Ram D.", role: "user · Mental Health Module", text: "Burnout Shield flagged my high-risk week before I felt it. The CBT journaling literally saved my Q2. ManifiX is essential.", stars: 5 },
  { name: "Hema R.", role: "Nutritionist · Verified Expert", text: "The macro AI and metabolic scoring are clinically impressive. I now recommend ManifiX to every single client I have.", stars: 5 },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const id = "manifix-v4-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: G.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>ManifiX AI — The World's Most Complete Human Performance Platform</title>
        <meta name="description" content="10 AI-powered health modules. Magic16 Protocol. SleepGold Engine. Women's Health. Mental Wellness. Nutrition AI. Global Leaderboard. Built in India. Designed for the world." />
        <meta property="og:title" content="ManifiX AI — 10 AI Modules. One Elite Platform." />
        <meta property="og:description" content="The first platform to combine AI-verified discipline, sleep science, women's health, children's care, mental wellness, and nutrition intelligence — all in one." />
        <meta name="theme-color" content="#C8A84B" />
        <link rel="preload" as="image" href="/assets/logo.png" />
      </Helmet>

      {/* ── FIXED BACKGROUNDS ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.42 }}>
        <Balatro />
      </div>
      <div className="grid-bg" style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(180deg, ${G.bg}80 0%, ${G.bg}B0 40%, ${G.bg}F5 80%, ${G.bg} 100%)`,
      }} />
      {/* Orbs */}
      <div style={{ position: "fixed", width: "800px", height: "800px", borderRadius: "50%", top: "-20%", left: "-12%", zIndex: 2, pointerEvents: "none", background: `radial-gradient(circle, rgba(200,168,75,0.048) 0%, transparent 70%)`, filter: "blur(80px)", animation: "orbit1 22s ease-in-out infinite" }} />
      <div style={{ position: "fixed", width: "600px", height: "600px", borderRadius: "50%", bottom: "5%", right: "-10%", zIndex: 2, pointerEvents: "none", background: `radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%)`, filter: "blur(80px)", animation: "orbit2 28s ease-in-out infinite" }} />

      {/* ── ALL CONTENT ── */}
      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ════════════════════════════════════════
            NAV
        ════════════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: "64px",
          background: scrolled ? "rgba(5,5,8,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? `1px solid ${G.border}` : "1px solid transparent",
          transition: "all 0.4s ease",
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <Logo size={34} />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: G.font, fontSize: "20px", color: G.gold, letterSpacing: "0.22em", lineHeight: 1 }}>
                MANIFIX AI
              </div>
              <div style={{ fontFamily: G.mono, fontSize: "7.5px", color: G.dim, letterSpacing: "0.28em", marginTop: "2px" }}>
                HUMAN PERFORMANCE OS
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="nav-mid" style={{ display: "flex", alignItems: "center", gap: "34px" }}>
            {[["#modules", "Platform"], ["#how", "How It Works"], ["#about", "About"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="nav-a">{label}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link to="/login" style={{ fontFamily: G.body, fontWeight: 600, fontSize: "12px", color: G.dim, textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = G.gold}
              onMouseLeave={e => e.currentTarget.style.color = G.dim}
            >Login</Link>
            <Link to="/signup" style={{
              fontFamily: G.body, fontWeight: 700, fontSize: "12px",
              color: G.bg, letterSpacing: "0.08em",
              textDecoration: "none", textTransform: "uppercase",
              padding: "10px 22px",
              background: `linear-gradient(135deg, ${G.gold}, #A07828)`,
              borderRadius: "4px",
              boxShadow: `0 4px 18px rgba(200,168,75,0.35)`,
              transition: "all 0.22s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(200,168,75,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(200,168,75,0.35)"; }}
            >Start Free →</Link>
          </div>
        </nav>

        {/* ════════════════════════════════════════
            HERO  — CINEMATIC FIRST IMPRESSION
        ════════════════════════════════════════ */}
        <header style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "130px 24px 80px",
          position: "relative",
        }}>
          {/* Decorative corner lines */}
          <div style={{ position: "absolute", top: "80px", left: "40px", width: "60px", height: "60px", borderTop: `1.5px solid ${G.border}`, borderLeft: `1.5px solid ${G.border}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "80px", right: "40px", width: "60px", height: "60px", borderTop: `1.5px solid ${G.border}`, borderRight: `1.5px solid ${G.border}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", bottom: "40px", left: "40px", width: "60px", height: "60px", borderBottom: `1.5px solid ${G.border}`, borderLeft: `1.5px solid ${G.border}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", bottom: "40px", right: "40px", width: "60px", height: "60px", borderBottom: `1.5px solid ${G.border}`, borderRight: `1.5px solid ${G.border}`, opacity: 0.5 }} />

          {/* Floating logo badge — desktop */}
          <motion.div
            className="hero-badge-float"
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", right: "6%", top: "28%",
              width: "100px", height: "100px", borderRadius: "20px",
              background: G.surface2,
              border: `1.5px solid rgba(200,168,75,0.3)`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
              animation: "float 9s ease-in-out infinite",
              boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,168,75,0.12), 0 0 40px rgba(200,168,75,0.08)`,
            }}
          >
            <Logo size={50} />
          </motion.div>

          {/* Floating pill — left */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{
              position: "absolute", left: "4%", top: "38%",
              padding: "12px 20px", borderRadius: "10px",
              background: G.surface,
              border: `1px solid ${G.border}`,
              display: "flex", flexDirection: "column", gap: "4px",
              animation: "float 12s ease-in-out 2s infinite",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontFamily: G.mono, fontSize: "8px", color: G.gold, letterSpacing: "0.14em" }}>LIVE RANK</div>
            <div style={{ fontFamily: G.font, fontSize: "26px", color: G.text, lineHeight: 1 }}>#4,827</div>
            <div style={{ fontFamily: G.mono, fontSize: "8px", color: G.dim }}>GLOBAL · TODAY</div>
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: "960px", position: "relative", zIndex: 5 }}
          >
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "8px 22px", borderRadius: "2px", marginBottom: "36px",
                background: "rgba(200,168,75,0.07)",
                border: `1px solid rgba(200,168,75,0.28)`,
                fontFamily: G.mono, fontSize: "10px", color: G.gold,
                letterSpacing: "0.16em", fontWeight: 500,
                animation: "pulse-gold 4s ease-in-out infinite",
              }}
            >
              ◈ &nbsp; WORLD'S MOST COMPLETE HUMAN PERFORMANCE PLATFORM &nbsp; ◈
            </motion.div>

            {/* H1 — Bebas Neue display, magazine style */}
            <h1 className="hero-h1" style={{
              fontFamily: G.font,
              fontSize: "clamp(64px, 11vw, 130px)",
              lineHeight: 0.95, letterSpacing: "0.02em",
              color: G.text, marginBottom: "16px",
            }}>
              MASTER YOUR
            </h1>
            <h1 style={{
              fontFamily: G.font,
              fontSize: "clamp(64px, 11vw, 130px)",
              lineHeight: 0.95, letterSpacing: "0.02em",
              marginBottom: "20px",
            }}>
              <span className="gold-text">ENTIRE LIFE.</span>
            </h1>

            {/* Italic serif sub-headline — Playfair Display */}
            <p style={{
              fontFamily: G.display, fontStyle: "italic", fontWeight: 700,
              fontSize: "clamp(16px, 2.2vw, 22px)",
              color: G.muted, marginBottom: "14px",
              letterSpacing: "0.01em",
            }}>
              10 AI Modules. One Elite Platform. Zero Compromise.
            </p>

            {/* Body sub */}
            <p className="hero-sub" style={{
              fontFamily: G.body, fontSize: "clamp(15px,1.8vw,18px)",
              color: G.dim, maxWidth: "580px", margin: "0 auto 50px",
              lineHeight: 1.75, fontWeight: 400,
            }}>
              Magic16 Protocol · SleepGold Engine · Women's Health · Children's Care ·
              Mental Wellness · Burnout Shield · Nutrition AI · Medication Tracker ·
              Elderly Care · AI Coach. All in one platform. All verified by AI.
            </p>

            {/* CTAs */}
            <div className="cta-row" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
              <Link to="/signup" className="btn-primary">
                Begin Your Evolution →
              </Link>
              <a href="#modules" className="btn-ghost">
                Explore 10 Modules
              </a>
            </div>

            {/* Trust pills */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
              {[["👥","12,000+ Members"], ["🌍","4 Countries"], ["⭐","4.9 / 5 Rating"], ["🏥","10 AI Modules"]].map(([icon, label], i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "2px",
                  background: "rgba(237,238,248,0.03)",
                  border: `1px solid rgba(237,238,248,0.07)`,
                  fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.07em",
                }}>
                  {icon} {label}
                </div>
              ))}
            </div>

            {/* Urgency */}
            <p style={{ fontFamily: G.mono, fontSize: "11px", color: "rgba(255,107,107,0.75)", letterSpacing: "0.07em" }}>
              ⚠ &nbsp; Founding member rate ₹1,999/mo · 12 spots remaining in your region
            </p>
          </motion.div>

          {/* Bottom fade */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: `linear-gradient(transparent, ${G.bg})`, pointerEvents: "none" }} />
        </header>

        {/* ── TICKER ── */}
        <Ticker />

        {/* ════════════════════════════════════════
            STATS
        ════════════════════════════════════════ */}
        <section style={{ padding: "90px 24px", borderBottom: `1px solid ${G.border}` }}>
          <FadeIn>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "48px", maxWidth: "920px", margin: "0 auto" }}>
              <StatCounter to={12000} suffix="+" label="Active Members" />
              <StatCounter to={10} label="AI Health Modules" />
              <StatCounter to={16} label="Minute Daily Protocol" />
              <StatCounter to={98} suffix="%" label="Member Satisfaction" />
            </div>
          </FadeIn>
        </section>

        {/* ════════════════════════════════════════
            10 MODULES
        ════════════════════════════════════════ */}
        <section id="modules" style={{ padding: "110px 24px", background: "rgba(200,168,75,0.012)", borderTop: `1px solid ${G.border}` }}>
          <FadeIn>
            <Eyebrow>The Full Platform</Eyebrow>
            <h2 style={{
              fontFamily: G.font,
              fontSize: "clamp(42px,6vw,72px)",
              color: G.text, textAlign: "center", marginBottom: "16px",
              letterSpacing: "0.03em", lineHeight: 1,
            }}>
              10 MODULES.
            </h2>
            <h2 style={{
              fontFamily: G.font,
              fontSize: "clamp(42px,6vw,72px)",
              textAlign: "center", marginBottom: "20px",
              letterSpacing: "0.03em", lineHeight: 1,
            }}>
              <span className="gold-text">EVERY DIMENSION OF HUMAN HEALTH.</span>
            </h2>
            <p style={{ textAlign: "center", fontFamily: G.display, fontStyle: "italic", fontSize: "18px", color: G.muted, maxWidth: "540px", margin: "0 auto 70px", lineHeight: 1.7 }}>
              From peak performance to deep sleep, family care, and mental clarity —
              ManifiX is the only platform that covers it all.
            </p>
          </FadeIn>

          <div className="mods-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "16px", maxWidth: "1160px", margin: "0 auto",
          }}>
            {MODULES.map((mod, i) => (
              <FadeIn key={i} delay={i * 0.055}>
                <div className="mod-card" style={{ "--card-accent": mod.color }}>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                    <span style={{ fontSize: "28px" }}>{mod.icon}</span>
                    <span style={{ fontFamily: G.mono, fontSize: "9px", letterSpacing: "0.18em", padding: "4px 12px", borderRadius: "2px", border: `1px solid ${mod.color}28`, color: mod.color, background: `${mod.color}0E` }}>{mod.tag}</span>
                  </div>
                  {/* Label */}
                  <div style={{ fontFamily: G.mono, fontSize: "8px", color: mod.color, letterSpacing: "0.2em", marginBottom: "6px", opacity: 0.65 }}>MANIFIX MODULE</div>
                  {/* Title */}
                  <h3 style={{ fontFamily: G.font, fontSize: "21px", letterSpacing: "0.05em", color: G.text, marginBottom: "4px" }}>
                    {mod.title.toUpperCase()}
                  </h3>
                  {/* Headline */}
                  <p style={{ fontFamily: G.display, fontStyle: "italic", fontSize: "13px", color: mod.color, marginBottom: "14px", fontWeight: 700 }}>
                    {mod.headline}
                  </p>
                  {/* Desc */}
                  <p style={{ fontSize: "13.5px", color: G.muted, lineHeight: 1.72, marginBottom: "20px" }}>
                    {mod.desc}
                  </p>
                  {/* Stats */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {mod.stats.map(([val, lbl], si) => (
                      <div key={si} style={{ flex: 1, padding: "9px 6px", borderRadius: "4px", background: `${mod.color}09`, border: `1px solid ${mod.color}1A`, textAlign: "center" }}>
                        <div style={{ fontFamily: G.font, fontSize: "14px", letterSpacing: "0.04em", color: mod.color, lineHeight: 1 }}>{val}</div>
                        <div style={{ fontFamily: G.mono, fontSize: "8px", color: G.dim, marginTop: "3px", letterSpacing: "0.08em" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════ */}
        <section id="how" style={{ padding: "110px 24px" }}>
          <FadeIn>
            <Eyebrow>The Process</Eyebrow>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", color: G.text, textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "10px" }}>
              FROM ZERO TO
            </h2>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "60px" }}>
              <span className="gold-text">ELITE. IN 4 STEPS.</span>
            </h2>
          </FadeIn>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", maxWidth: "1160px", margin: "0 auto" }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="step-card">
                  {/* Ghost number */}
                  <div style={{ fontFamily: G.font, fontSize: "72px", letterSpacing: "0.02em", color: "rgba(200,168,75,0.08)", position: "absolute", top: "12px", right: "16px", lineHeight: 1, pointerEvents: "none" }}>{s.n}</div>
                  <div style={{ fontSize: "28px", marginBottom: "16px" }}>{s.icon}</div>
                  <div style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.18em", marginBottom: "10px" }}>STEP {s.n}</div>
                  <h3 style={{ fontFamily: G.font, fontSize: "20px", letterSpacing: "0.04em", color: G.text, marginBottom: "12px", lineHeight: 1.15 }}>{s.title.toUpperCase()}</h3>
                  <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.75 }}>{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            ABOUT
        ════════════════════════════════════════ */}
        <section id="about" style={{ padding: "110px 24px", background: "rgba(200,168,75,0.012)", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
            <FadeIn>
              <Eyebrow>Our Story</Eyebrow>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", color: G.text, textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "10px" }}>
                ABOUT
              </h2>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "20px" }}>
                <span className="gold-text">MANIFIX AI</span>
              </h2>
              <p style={{ fontFamily: G.display, fontStyle: "italic", fontSize: "19px", color: G.muted, maxWidth: "620px", margin: "0 auto 70px", textAlign: "center", lineHeight: 1.7 }}>
                Built in India. Designed for the world. The first platform to unify
                AI-verified discipline, comprehensive health intelligence, and global
                performance community in one seamless experience.
              </p>
            </FadeIn>

            <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { icon: "🎯", title: "OUR MISSION", body: "We build technology that amplifies human intelligence rather than replacing it. In a world engineered for distraction, ManifiX gives you the systems, science, and AI to sharpen focus and achieve your absolute highest potential — every single day." },
                { icon: "🔭", title: "OUR VISION", body: "A world where every person has access to elite-grade health intelligence. Where AI doesn't just answer questions — it rewires how you think, sleep, train, eat, and care for the people you love." },
                { icon: "🏅", title: "MAGIC16 SYSTEM", body: "A 16-step science-backed daily ritual built on breathing research, postural awareness, and cognitive priming. Designed to improve concentration, reduce mental fatigue, and build elite-level daily consistency that compounds over time." },
                { icon: "🌍", title: "BUILT IN INDIA", body: "ManifixAI Private Limited is headquartered in Visakhapatnam, Andhra Pradesh. We are proud to build world-class AI health technology from India — for every human on the planet who refuses to be average." },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{ padding: "30px", borderRadius: "8px", background: G.surface, border: `1px solid ${G.border}` }}>
                    <div style={{ fontSize: "28px", marginBottom: "16px" }}>{item.icon}</div>
                    <h3 style={{ fontFamily: G.font, fontSize: "20px", letterSpacing: "0.06em", color: G.text, marginBottom: "12px" }}>{item.title}</h3>
                    <p style={{ fontSize: "14.5px", color: G.muted, lineHeight: 1.78 }}>{item.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════════════ */}
        <section style={{ padding: "110px 24px" }}>
          <FadeIn>
            <Eyebrow>Verified Results</Eyebrow>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", color: G.text, textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "10px" }}>
              TRUSTED BY
            </h2>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "70px" }}>
              <span className="gold-text">THE ELITE.</span>
            </h2>
          </FadeIn>

          <div className="tgrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", maxWidth: "1100px", margin: "0 auto" }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="t-card">
                  <div style={{ marginBottom: "16px" }}>
                    {"★★★★★".split("").map((s, si) => <span key={si} style={{ color: G.gold, fontSize: "13px" }}>{s}</span>)}
                  </div>
                  <p style={{ fontSize: "15px", color: G.text, lineHeight: 1.78, marginBottom: "24px", fontFamily: G.display, fontStyle: "italic", opacity: 0.9 }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${G.gold}, #8C6020)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font, fontSize: "20px", color: G.bg, letterSpacing: "0.04em" }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontFamily: G.body, fontWeight: 700, fontSize: "14px", color: G.text }}>{t.name}</div>
                      <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.06em" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            PRICING
        ════════════════════════════════════════ */}
        <section id="pricing" style={{ padding: "110px 24px", background: "rgba(200,168,75,0.012)", borderTop: `1px solid ${G.border}` }}>
          <FadeIn>
            <Eyebrow>Investment</Eyebrow>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", color: G.text, textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "10px" }}>
              ONE PLAN.
            </h2>
            <h2 style={{ fontFamily: G.font, fontSize: "clamp(38px,5.5vw,68px)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1, marginBottom: "16px" }}>
              <span className="gold-text">ALL 10 MODULES.</span>
            </h2>
            <p style={{ fontFamily: G.display, fontStyle: "italic", fontSize: "18px", color: G.muted, textAlign: "center", marginBottom: "64px" }}>
              Everything you need. Nothing you don't. Cancel anytime.
            </p>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div style={{
              maxWidth: "520px", margin: "0 auto",
              padding: "52px 46px",
              borderRadius: "8px",
              background: G.surface,
              border: `1.5px solid rgba(200,168,75,0.35)`,
              boxShadow: `0 0 100px rgba(200,168,75,0.08), 0 48px 100px rgba(0,0,0,0.65)`,
              textAlign: "center", position: "relative", overflow: "hidden",
              animation: "borderGlow 5s ease-in-out infinite",
            }}>
              {/* top line */}
              <div style={{ position: "absolute", top: 0, left: "12%", right: "12%", height: "1px", background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)` }} />
              <div style={{ position: "absolute", bottom: 0, left: "30%", right: "30%", height: "1px", background: `linear-gradient(90deg, transparent, rgba(200,168,75,0.35), transparent)` }} />

              {/* Tier badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 18px", borderRadius: "2px", marginBottom: "28px", background: G.goldDim, border: `1px solid ${G.border}`, fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.18em" }}>
                ◈ &nbsp; ELITE MEMBERSHIP — ALL 10 MODULES
              </div>

              {/* Price */}
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontFamily: G.font, fontSize: "76px", letterSpacing: "0.02em", color: G.gold, lineHeight: 1, textShadow: `0 0 60px ${G.goldGlow}` }}>₹1,999</span>
                <span style={{ fontFamily: G.body, fontSize: "17px", color: G.muted }}> / month</span>
              </div>
              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.dim, marginBottom: "36px", letterSpacing: "0.08em" }}>
                Cancel anytime · No hidden fees · Razorpay secured
              </p>

              {/* Features list */}
              <div style={{ textAlign: "left", marginBottom: "30px" }}>
                {[
                  "Magic16 AI-Verified Protocol (Daily)",
                  "SleepGold Binaural Engine",
                  "AI Conversation Coach (Unlimited)",
                  "Women's Health Intelligence",
                  "Children's Health Guard (Age-Calibrated)",
                  "Smart Medication Tracker",
                  "Mental Health AI (CBT + Mood AI)",
                  "Stress & Burnout Shield",
                  "Nutrition Intelligence (18 Languages)",
                  "Elderly Care AI Module",
                  "Global Leaderboard Ranking",
                  "Priority AI Coach Responses",
                ].map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < 11 ? `1px solid rgba(237,238,248,0.04)` : "none" }}>
                    <span style={{ color: G.gold, fontSize: "12px", flexShrink: 0 }}>◆</span>
                    <span style={{ fontFamily: G.body, fontSize: "14px", color: G.muted }}>{feat}</span>
                  </div>
                ))}
              </div>

              <Link to="/signup" className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "13px", padding: "19px", borderRadius: "4px" }}>
                Claim Elite Membership →
              </Link>
              <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, marginTop: "16px", letterSpacing: "0.07em" }}>
                🔒 256-bit encrypted · Razorpay PCI compliant · ManifixAI Pvt Ltd
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════ */}
        <section style={{ padding: "120px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,168,75,0.06) 0%, transparent 70%)`, pointerEvents: "none" }} />
          {/* Decorative corner frames */}
          <div style={{ position: "absolute", top: "30px", left: "60px", width: "80px", height: "80px", borderTop: `1px solid ${G.border}`, borderLeft: `1px solid ${G.border}` }} />
          <div style={{ position: "absolute", top: "30px", right: "60px", width: "80px", height: "80px", borderTop: `1px solid ${G.border}`, borderRight: `1px solid ${G.border}` }} />
          <div style={{ position: "absolute", bottom: "30px", left: "60px", width: "80px", height: "80px", borderBottom: `1px solid ${G.border}`, borderLeft: `1px solid ${G.border}` }} />
          <div style={{ position: "absolute", bottom: "30px", right: "60px", width: "80px", height: "80px", borderBottom: `1px solid ${G.border}`, borderRight: `1px solid ${G.border}` }} />

          <FadeIn>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                <Logo size={60} />
              </div>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(42px,7vw,88px)", color: G.text, lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: "12px" }}>
                YOUR HEALTH.
              </h2>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(42px,7vw,88px)", lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: "30px" }}>
                <span className="gold-text">YOUR LEGACY.</span>
              </h2>
              <p style={{ fontFamily: G.display, fontStyle: "italic", fontSize: "19px", color: G.muted, maxWidth: "500px", margin: "0 auto 48px", lineHeight: 1.7 }}>
                Join 12,000+ high-performers already using all 10 ManifiX modules to dominate every dimension of their lives.
              </p>
              <div className="cta-row" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/signup" className="btn-primary" style={{ fontSize: "14px", padding: "20px 52px" }}>
                  Start Your Evolution →
                </Link>
                <Link to="/login" className="btn-ghost">
                  Already a Member
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer style={{ borderTop: `1px solid ${G.border}`, padding: "52px 40px 32px", background: G.surface }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
            <div className="footer-inner" style={{ display: "flex", justifyContent: "space-between", gap: "40px", marginBottom: "48px", flexWrap: "wrap" }}>

              {/* Brand */}
              <div style={{ maxWidth: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <Logo size={36} />
                  <div>
                    <div style={{ fontFamily: G.font, fontSize: "18px", color: G.gold, letterSpacing: "0.2em" }}>MANIFIX AI</div>
                    <div style={{ fontFamily: G.mono, fontSize: "7.5px", color: G.dim, letterSpacing: "0.26em", marginTop: "2px" }}>HUMAN PERFORMANCE OS</div>
                  </div>
                </div>
                <p style={{ fontSize: "12.5px", color: G.dim, lineHeight: 1.7, fontFamily: G.body }}>
                  ManifixAI Private Limited<br />
                  Kancharapalem, Near Urvasi Junction<br />
                  Visakhapatnam, Andhra Pradesh 530008, India
                </p>
                <a href="mailto:manifixofficial@gmail.com" style={{ display: "block", fontSize: "12px", color: G.gold, marginTop: "12px", fontFamily: G.mono, letterSpacing: "0.05em", textDecoration: "none", opacity: 0.8 }}>
                  manifixofficial@gmail.com
                </a>
              </div>

              {/* Links */}
              <div style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: G.mono, fontSize: "8.5px", color: G.gold, letterSpacing: "0.22em", marginBottom: "16px", textTransform: "uppercase" }}>Platform</div>
                  {[["#modules","All 10 Modules"],["#how","How It Works"],["#about","About Us"],["#pricing","Pricing"]].map(([href, lbl]) => (
                    <a key={href} href={href} style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", fontFamily: G.body, transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = G.gold}
                      onMouseLeave={e => e.currentTarget.style.color = G.muted}
                    >{lbl}</a>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: G.mono, fontSize: "8.5px", color: G.gold, letterSpacing: "0.22em", marginBottom: "16px", textTransform: "uppercase" }}>Legal</div>
                  <Link to="/privacy" style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", fontFamily: G.body, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = G.gold}
                    onMouseLeave={e => e.currentTarget.style.color = G.muted}
                  >Privacy Policy</Link>
                  <Link to="/terms" style={{ display: "block", fontSize: "13px", color: G.muted, textDecoration: "none", marginBottom: "10px", fontFamily: G.body, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = G.gold}
                    onMouseLeave={e => e.currentTarget.style.color = G.muted}
                  >Terms & Conditions</Link>
                  <Link to="/signup" style={{ display: "block", fontSize: "13px", color: G.gold, textDecoration: "none", marginBottom: "10px", fontFamily: G.body }}
                  >Get Started →</Link>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.08em" }}>
                © 2025–2026 ManifixAI Private Limited · All rights reserved
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "18px", height: "1px", background: G.gold, opacity: 0.4 }} />
                <p style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.1em" }}>
                  BUILT IN INDIA 🇮🇳 · BEYOND HUMAN LIMITS
                </p>
                <div style={{ width: "18px", height: "1px", background: G.gold, opacity: 0.4 }} />
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
