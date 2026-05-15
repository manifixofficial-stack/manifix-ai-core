// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView } from "framer-motion";

/* ─────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("home-styles")) return;
  const s = document.createElement("style");
  s.id = "home-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes hm-pulse-gold {
      0%,100% { box-shadow: 0 0 0 0 rgba(200,168,75,0.45); }
      50%      { box-shadow: 0 0 0 14px rgba(200,168,75,0); }
    }
    @keyframes hm-glow-breathe {
      0%,100% { opacity: 0.25; transform: scale(1); }
      50%      { opacity: 0.55; transform: scale(1.08); }
    }
    @keyframes hm-scan {
      from { top: -60px; }
      to   { top: 110%; }
    }
    @keyframes hm-ticker {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @keyframes hm-blink {
      0%,100% { opacity: 1; } 50% { opacity: 0; }
    }
    @keyframes hm-shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }

    .hm-shimmer {
      background: linear-gradient(90deg,#c8a84b,#f5d06a,#c8a84b,#f5d06a);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: hm-shimmer 2.8s linear infinite;
    }
    .hm-pulse-btn { animation: hm-pulse-gold 2.2s ease-in-out infinite; }
    .hm-blink     { animation: hm-blink 1s step-end infinite; }

    .hm-phase-card:hover { transform: translateY(-8px); }
    .hm-phase-card { transition: transform .3s ease; }

    .hm-ticker-track {
      display: flex;
      width: max-content;
      animation: hm-ticker 28s linear infinite;
    }
    .hm-ticker-track:hover { animation-play-state: paused; }

    .hm-nav-link {
      font-size: 9px;
      letter-spacing: 0.22em;
      color: #2a2a2a;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s;
      font-family: 'DM Mono', monospace;
    }
    .hm-nav-link:hover { color: #c8a84b; }

    @media (max-width: 480px) {
      .hm-hero-title  { font-size: clamp(38px, 11vw, 72px) !important; }
      .hm-phase-grid  { grid-template-columns: 1fr !important; }
      .hm-proof-grid  { grid-template-columns: 1fr 1fr !important; }
      .hm-social-grid { grid-template-columns: 1fr !important; }
      .hm-nav-links   { display: none !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   INLINE SVG LOGO — Gold ManifiX (no image file needed)
───────────────────────────────────────────── */
const ManifixLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="12" fill="url(#hmBg)" />
    <path
      d="M10 50V16L23 16L32 35L41 16L54 16V50H45V29L32 51L19 29V50Z"
      fill="white"
    />
    <circle cx="52" cy="14" r="6" fill="#c8a84b" />
    <defs>
      <linearGradient id="hmBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0a0a14" />
      </linearGradient>
    </defs>
  </svg>
);

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const PHASES = [
  { num: "01", title: "RESISTANCE", days: "Days 1 – 4",   body: "Your brain fights the new neural path. The AI watches. It does not accept excuses." },
  { num: "02", title: "ADAPTATION", days: "Days 5 – 10",  body: "Discipline stops being a decision. It becomes a default state. You notice the change." },
  { num: "03", title: "MASTERY",    days: "Days 11 – 16", body: "You are no longer who you were on Day 1. The system has proof. So do you." },
];

const PROOF_STATS = [
  { val: "16",     unit: "min/day", label: "Daily commitment" },
  { val: "94%",    unit: "",        label: "Completion rate" },
  { val: "4,200+", unit: "",        label: "Active performers" },
  { val: "Day 1",  unit: "reset",   label: "Miss once — restart" },
];

const TESTIMONIALS = [
  { name: "Arjun M.",  city: "Mumbai",    text: "I've tried 12 apps. None held me accountable like this. The AI literally called me out mid-session.", streak: 16 },
  { name: "Priya S.",  city: "Bengaluru", text: "The streak reset terrified me into showing up every single day. That fear is a feature, not a bug.", streak: 14 },
  { name: "Rahul K.",  city: "Delhi",     text: "Day 9 I wanted to quit. The countdown timer said 3 hours left. I did it. Changed everything.", streak: 16 },
];

const TICKER_ITEMS = [
  "AI-VERIFIED DISCIPLINE", "16-DAY NEURAL LOOP", "STREAK OR RESET",
  "TOP 1% GLOBALLY", "POSE DETECTION LIVE", "NO EXCUSES ACCEPTED",
  "AI-VERIFIED DISCIPLINE", "16-DAY NEURAL LOOP", "STREAK OR RESET",
  "TOP 1% GLOBALLY", "POSE DETECTION LIVE", "NO EXCUSES ACCEPTED",
];

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function FadeUp({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function CounterStat({ target, suffix = "", label }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const num = parseInt(target.replace(/\D/g, ""), 10) || 0;

  useEffect(() => {
    if (!inView || !num) return;
    let start = 0;
    const step = Math.ceil(num / 40);
    const id = setInterval(() => {
      start = Math.min(start + step, num);
      setVal(start);
      if (start >= num) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, num]);

  const display = num ? `${val}${target.replace(/[\d]/g, "")}` : target;

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(28px,7vw,44px)",
        letterSpacing: "0.04em",
        color: "#c8a84b",
        lineHeight: 1,
      }}>
        {display}{suffix}
      </div>
      <div style={{
        fontSize: 9, letterSpacing: "0.22em",
        color: "#3a3a3a", textTransform: "uppercase", marginTop: 4,
      }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const root = {
    background: "#080808",
    color: "#e8e4d9",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    minHeight: "100dvh",
    overflowX: "hidden",
  };

  const sec = {
    width: "min(520px, 94vw)",
    margin: "0 auto",
    padding: "72px 0",
  };

  return (
    <div style={root}>
      <Helmet>
        <title>ManifiX AI — The 16-Day Neural Discipline System</title>
        <meta name="description" content="AI-verified daily sessions. Miss once and the system resets your streak to Day 1. No excuses accepted." />
        <meta property="og:title" content="ManifiX AI — Stop negotiating with your weakness." />
        <meta property="og:description" content="The world's first AI-verified 16-day discipline loop." />
        <meta name="theme-color" content="#c8a84b" />
      </Helmet>

      {/* ═══════════════════════════════════════
          NAVBAR — with ManifiX gold logo
      ═══════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "56px",
        background: scrolled ? "rgba(8,8,8,0.95)" : "#080808",
        borderBottom: `1px solid ${scrolled ? "#1e1e1e" : "#111"}`,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
      }}>
        {/* Logo + wordmark */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <ManifixLogo size={30} />
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "18px", letterSpacing: "0.18em",
            color: "#c8a84b", lineHeight: 1,
          }}>
            MANIFIX AI
          </span>
        </Link>

        {/* Nav links */}
        <div className="hm-nav-links" style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link to="/" className="hm-nav-link">Home</Link>
          <a href="#phases" className="hm-nav-link">The Arc</a>
          <a href="#proof" className="hm-nav-link">Proof</a>
        </div>

        {/* CTA */}
        <Link
          to="/signup"
          style={{
            display: "inline-block",
            background: "#c8a84b",
            color: "#080808",
            padding: "8px 20px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'DM Mono', monospace",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Start Now →
        </Link>
      </nav>

      {/* ═══════════════════════════════════════
          TICKER
      ═══════════════════════════════════════ */}
      <div style={{
        marginTop: "56px", /* push below fixed nav */
        borderBottom: "1px solid #161616",
        overflow: "hidden",
        padding: "9px 0",
        background: "#060606",
      }}>
        <div className="hm-ticker-track">
          {TICKER_ITEMS.map((t, i) => (
            <span key={i} style={{
              fontSize: 9, letterSpacing: "0.25em",
              color: i % 2 === 0 ? "#c8a84b" : "#2a2a2a",
              textTransform: "uppercase", padding: "0 32px", whiteSpace: "nowrap",
            }}>
              {t} {i % 2 === 0 ? "✦" : "·"}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 0 60px" }}>
        {/* ambient glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%",
          transform: "translateX(-50%)",
          width: 520, height: 320,
          background: "radial-gradient(ellipse, rgba(200,168,75,0.12) 0%, transparent 70%)",
          animation: "hm-glow-breathe 5s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        {/* scan line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 80,
          background: "linear-gradient(180deg, transparent, rgba(200,168,75,0.04), transparent)",
          animation: "hm-scan 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <div style={{ ...sec, textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid #1e1e1e", padding: "5px 14px", marginBottom: 32,
              fontSize: 9, letterSpacing: "0.25em", color: "#3a3a3a", textTransform: "uppercase",
            }}
          >
            <span className="hm-blink" style={{ color: "#ff3c3c" }}>●</span>
            AI Pose Verification · Live
          </motion.div>

          {/* headline */}
          <motion.h1
            className="hm-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65 }}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(52px, 14vw, 96px)",
              letterSpacing: "0.03em", lineHeight: 0.95,
              marginBottom: 24, color: "#e8e4d9",
            }}
          >
            Stop negotiating<br />
            with your{" "}
            <span className="hm-shimmer">Weakness.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontSize: "clamp(11px, 3vw, 13px)", letterSpacing: "0.12em",
              lineHeight: 1.9, color: "#4a4a4a",
              margin: "0 auto 36px", maxWidth: 360,
            }}
          >
            The world's first AI-verified 16-day discipline loop.<br />
            Miss a day — the system resets your streak to Day 1.<br />
            No exceptions. No negotiations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
          >
            <Link
              to="/signup"
              className="hm-pulse-btn"
              style={{
                display: "inline-block",
                background: "#c8a84b", color: "#080808",
                padding: "16px 36px", fontSize: 12, fontWeight: 700,
                letterSpacing: "0.22em", textTransform: "uppercase",
                textDecoration: "none", fontFamily: "'DM Mono', monospace",
              }}
            >
              Enter the 16-Day Loop →
            </Link>
            <span style={{ fontSize: 9, letterSpacing: "0.18em", color: "#2a2a2a", textTransform: "uppercase" }}>
              ₹1,999/month · Cancel anytime
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PROOF STATS
      ═══════════════════════════════════════ */}
      <FadeUp>
        <div id="proof" style={{
          borderTop: "1px solid #111", borderBottom: "1px solid #111",
          background: "#060606", padding: "40px 20px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20, width: "min(520px, 94vw)", margin: "0 auto",
          }} className="hm-proof-grid">
            {PROOF_STATS.map((s) => (
              <CounterStat key={s.label} target={s.val} suffix={s.unit} label={s.label} />
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════
          AI VERIFICATION
      ═══════════════════════════════════════ */}
      <FadeUp delay={0.05}>
        <div style={sec}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#3a3a3a", textTransform: "uppercase", marginBottom: 20 }}>
            — The Technology
          </div>
          <div style={{
            border: "1px solid #161616", background: "#0b0b0b",
            padding: "28px 24px", position: "relative", overflow: "hidden",
          }}>
            {/* corner marks */}
            {[
              { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
              { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
              { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
              { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", width: 14, height: 14,
                borderColor: "#c8a84b", borderStyle: "solid", borderWidth: 0, ...pos,
              }} />
            ))}
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.06em", marginBottom: 12, color: "#e8e4d9" }}>
              👁 AI-Vision Verification
            </h3>
            <p style={{ fontSize: 12, lineHeight: 1.85, color: "#4a4a4a", letterSpacing: "0.06em", maxWidth: 400 }}>
              We do not take your word for it. ManifiX uses real-time pose detection
              to track your movement during every session. No movement detected?
              The AI notices. True discipline requires proof — not promises.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              {["MoveNet AI", "Real-Time Pose", "Accuracy Score", "Viral Clip Export"].map((tag) => (
                <span key={tag} style={{
                  fontSize: 9, letterSpacing: "0.18em", color: "#c8a84b",
                  border: "1px solid #1e1e1e", padding: "4px 10px", textTransform: "uppercase",
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════
          16-DAY PHASES
      ═══════════════════════════════════════ */}
      <FadeUp delay={0.05}>
        <div id="phases" style={sec}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#3a3a3a", textTransform: "uppercase", marginBottom: 8 }}>
            — The Evolution
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(36px, 9vw, 56px)", letterSpacing: "0.04em",
            lineHeight: 1, marginBottom: 32, color: "#e8e4d9",
          }}>
            The 16-Day<br /><span className="hm-shimmer">Arc</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="hm-phase-grid">
            {PHASES.map((p, i) => (
              <div key={i} className="hm-phase-card" style={{ border: "1px solid #161616", background: "#0b0b0b", padding: "20px 16px" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#161616", lineHeight: 1, marginBottom: 8 }}>{p.num}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.06em", color: "#c8a84b", marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "#2e2e2e", textTransform: "uppercase", marginBottom: 12 }}>{p.days}</div>
                <p style={{ fontSize: 11, lineHeight: 1.75, color: "#3d3d3d", letterSpacing: "0.05em" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════
          SOCIAL PROOF
      ═══════════════════════════════════════ */}
      <FadeUp delay={0.05}>
        <div style={{ ...sec, paddingTop: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#3a3a3a", textTransform: "uppercase", marginBottom: 20 }}>
            — Field Reports
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="hm-social-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ border: "1px solid #161616", background: "#0b0b0b", padding: "18px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#c8a84b" }}>{t.name}</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#2e2e2e", textTransform: "uppercase" }}>{t.city}</div>
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#1e1e1e", border: "1px solid #1a1a1a", padding: "3px 7px", alignSelf: "flex-start", textTransform: "uppercase" }}>
                    Day {t.streak}
                  </div>
                </div>
                <p style={{ fontSize: 11, lineHeight: 1.75, color: "#3d3d3d", letterSpacing: "0.04em", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <FadeUp delay={0.05}>
        <div style={{ ...sec, paddingTop: 0, paddingBottom: 80, textAlign: "center" }}>
          <div style={{ border: "1px solid #1a1a1a", background: "#0b0b0b", padding: "44px 28px", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(200,168,75,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(30px, 8vw, 48px)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 12 }}>
              ₹1,999 / month.<br />
              <span className="hm-shimmer">An unstoppable mind.</span>
            </div>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "#3d3d3d", lineHeight: 1.8, marginBottom: 28 }}>
              Join 4,200+ performers already in the loop.<br />
              Cancel anytime. The streak, however, is yours to lose.
            </p>
            <Link
              to="/signup"
              className="hm-pulse-btn"
              style={{
                display: "inline-block", background: "#c8a84b", color: "#080808",
                padding: "18px 44px", fontSize: 13, fontWeight: 700,
                letterSpacing: "0.22em", textTransform: "uppercase",
                textDecoration: "none", fontFamily: "'DM Mono', monospace",
              }}
            >
              Get Started Now →
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <div style={{ borderTop: "1px solid #111", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ManifixLogo size={24} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.16em", color: "#c8a84b" }}>
            MANIFIX AI
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link to="/privacy" style={{ fontSize: 9, letterSpacing: "0.18em", color: "#2a2a2a", textTransform: "uppercase", textDecoration: "none" }}>Privacy</Link>
          <Link to="/terms"   style={{ fontSize: 9, letterSpacing: "0.18em", color: "#2a2a2a", textTransform: "uppercase", textDecoration: "none" }}>Terms</Link>
          <Link to="/"        style={{ fontSize: 9, letterSpacing: "0.18em", color: "#2a2a2a", textTransform: "uppercase", textDecoration: "none" }}>← Back to Landing</Link>
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.22em", color: "#1e1e1e", textTransform: "uppercase" }}>
          © {new Date().getFullYear()} ManifiX AI · Built in India 🇮🇳
        </div>
      </div>

    </div>
  );
}
