import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView } from "framer-motion";
import authService from "../services/auth.service";
import Balatro from "../components/Balatro";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  gold:      "#D4AF37",
  goldLight: "#F0D060",
  goldDim:   "rgba(212,175,55,0.15)",
  goldGlow:  "rgba(212,175,55,0.35)",
  bg:        "#08080F",
  surface:   "#0D0D18",
  border:    "rgba(212,175,55,0.14)",
  text:      "#EEEEF4",
  muted:     "rgba(238,238,244,0.45)",
  dim:       "rgba(238,238,244,0.22)",
  font:      "'Rajdhani', sans-serif",
  body:      "'DM Sans', sans-serif",
  mono:      "'JetBrains Mono', monospace",
};

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.body}; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 4px; }

  @keyframes floatY {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-12px); }
  }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 ${G.goldGlow}; }
    70%  { box-shadow: 0 0 0 16px rgba(212,175,55,0); }
    100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes gradientShift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }

  .gold-shimmer {
    background: linear-gradient(90deg, ${G.gold}, ${G.goldLight}, #B8860B, ${G.gold});
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .btn-gold {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 16px 36px;
    background: linear-gradient(135deg, ${G.gold} 0%, #B8860B 100%);
    color: #000;
    font-family: ${G.font};
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.1em;
    border-radius: 10px;
    text-decoration: none;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 8px 28px rgba(212,175,55,0.4);
    cursor: pointer;
    border: none;
  }
  .btn-gold:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(212,175,55,0.55);
  }
  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 15px 32px;
    background: transparent;
    color: ${G.gold};
    font-family: ${G.font};
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.08em;
    border-radius: 10px;
    text-decoration: none;
    border: 1.5px solid rgba(212,175,55,0.45);
    transition: all 0.2s;
    cursor: pointer;
  }
  .btn-outline:hover {
    background: ${G.goldDim};
    border-color: ${G.gold};
    transform: translateY(-2px);
  }
  .tech-card:hover {
    border-color: rgba(212,175,55,0.35) !important;
    transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.12) !important;
  }
  .testimonial-card:hover {
    border-color: rgba(212,175,55,0.3) !important;
    transform: translateY(-3px);
  }
  .step-card:hover {
    border-color: rgba(212,175,55,0.3) !important;
    background: rgba(212,175,55,0.05) !important;
  }

  @media (max-width: 768px) {
    .hero-title { font-size: 38px !important; }
    .nav-links { display: none !important; }
    .tech-grid { grid-template-columns: 1fr !important; }
    .steps-grid { grid-template-columns: 1fr !important; }
    .testimonial-grid { grid-template-columns: 1fr !important; }
    .about-grid { grid-template-columns: 1fr !important; }
    .footer-links { flex-direction: column; gap: 12px !important; }
    .cta-group { flex-direction: column !important; align-items: center !important; }
    .pricing-cards { flex-direction: column !important; align-items: center !important; }
  }
`;

// ─── INLINE SVG LOGO ────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#lGrad)" />
    <path d="M5 25L5 9L11.5 9L16 17.5L20.5 9L27 9L27 25L22.5 25L22.5 15.5L16 25.5L9.5 15.5L9.5 25Z" fill="#fff"/>
    <circle cx="26" cy="8" r="3.5" fill={G.gold}/>
    <defs>
      <linearGradient id="lGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#0f0f18"/>
      </linearGradient>
    </defs>
  </svg>
);

// ─── FADE IN SECTION ────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── TICKER ─────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "🏆 AI-Verified Discipline", "⚡ 16-Minute Protocol", "🌍 Global Leaderboard",
  "🤖 24/7 AI Coach", "🔥 Streak System", "💎 Elite Membership",
  "🏆 AI-Verified Discipline", "⚡ 16-Minute Protocol", "🌍 Global Leaderboard",
  "🤖 24/7 AI Coach", "🔥 Streak System", "💎 Elite Membership",
];

function Ticker() {
  return (
    <div style={{
      overflow: "hidden", borderTop: `1px solid ${G.border}`,
      borderBottom: `1px solid ${G.border}`,
      background: "rgba(212,175,55,0.03)",
      padding: "12px 0", margin: "0",
    }}>
      <div style={{
        display: "flex", gap: "48px", width: "max-content",
        animation: "ticker 28s linear infinite",
      }}>
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} style={{
            fontFamily: G.mono, fontSize: "12px", fontWeight: 500,
            color: G.muted, letterSpacing: "0.08em", whiteSpace: "nowrap",
          }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

// ─── STAT COUNTER ────────────────────────────────────────────────────────────────
function StatCounter({ value, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/\D/g, ""));

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: G.font, fontSize: "48px", fontWeight: 700,
        color: G.gold, lineHeight: 1,
        textShadow: `0 0 30px ${G.goldGlow}`,
      }}>
        {count.toLocaleString()}{value.replace(/[\d,]/g, "")}
      </div>
      <div style={{ fontSize: "13px", color: G.muted, marginTop: "6px", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Inject global styles
  useEffect(() => {
    const id = "manifix-landing-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  
  // Navbar scroll effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const testimonials = [
    { name: "Shyam R.", role: "Product Designer", text: "The UI is pure 2026. The most intuitive AI discipline system I've ever used. My productivity tripled in 3 weeks.", stars: 5 },
    { name: "Priya M.", role: "Wellness Advocate", text: "Magic16 saved my focus completely. The AI conversation adapts to me every single day. Nothing else comes close.", stars: 5 },
    { name: "Nikhil T.", role: "Startup Founder", text: "A must-have for anyone serious about their daily discipline. The leaderboard alone keeps me coming back every morning.", stars: 5 },
  ];

  const techCards = [
    { icon: "👁️", title: "AI Vision Verification", desc: "Neural networks track your yoga & meditation poses in real-time. No shortcuts. No cheating. Pure verified progress." },
    { icon: "🌍", title: "Global Rank System", desc: "Compete with high-performers worldwide. Earn your position in the elite tier of human consistency and discipline." },
    { icon: "🤖", title: "AI Personal Coach", desc: "A 24/7 strategist that rewires your mindset using advanced GPT automation. Your goals, analyzed and executed." },
    { icon: "🔥", title: "Streak Engine", desc: "Gamified daily streaks with social proof. Every day you show up, your global rank climbs. Miss a day, feel it." },
    { icon: "⚡", title: "Magic16 Protocol", desc: "16 precisely designed steps that prime your body and mind for peak performance. Science-backed. Elite-proven." },
    { icon: "💎", title: "Elite Membership", desc: "Unlimited AI access, video proofing, and priority ranking. Built for people who refuse to be average." },
  ];

  const steps = [
    { num: "01", title: "Sign Up in 60 Seconds", desc: "Create your account and complete a 3-minute onboarding to calibrate your AI coach to your goals." },
    { num: "02", title: "Start Magic16", desc: "Run your first 16-minute protocol. The AI observes, verifies, and scores your session in real-time." },
    { num: "03", title: "Climb the Leaderboard", desc: "Your verified score is posted globally. Compete, earn badges, and rise through elite tiers daily." },
    { num: "04", title: "Unlock Your Potential", desc: "Track your transformation with AI insights, streak analytics, and personalized coaching plans." },
  ];

  return (
    <div style={{ background: G.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>ManifiX AI | The Gold Standard of Human Discipline</title>
        <meta name="description" content="The world's first AI-verified discipline system. Master your life in 16 minutes. Join the global elite." />
        <meta property="og:title" content="ManifiX AI | The Gold Standard of Human Discipline" />
        <meta property="og:description" content="AI-verified discipline. 16-minute protocol. Global leaderboard. Join the elite." />
        <meta name="theme-color" content="#D4AF37" />
      </Helmet>

      {/* Balatro background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.55 }}>
        <Balatro />
      </div>
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: "linear-gradient(180deg, rgba(8,8,15,0.7) 0%, rgba(8,8,15,0.92) 60%, rgba(8,8,15,1) 100%)",
      }} />

      {/* Content wrapper */}
      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: "68px",
          background: scrolled ? "rgba(8,8,15,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${G.border}` : "1px solid transparent",
          transition: "all 0.3s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ManifixLogo size={34} />
            <span style={{
              fontFamily: G.font, fontWeight: 700, fontSize: "20px",
              color: G.gold, letterSpacing: "0.16em",
              textShadow: `0 0 20px ${G.goldGlow}`,
            }}>MANIFIX</span>
          </div>

          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {[["#about", "About"], ["#how", "How It Works"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} style={{
                fontFamily: G.font, fontSize: "13px", fontWeight: 600,
                color: G.muted, letterSpacing: "0.1em", textDecoration: "none",
                textTransform: "uppercase", transition: "color 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = G.gold}
                onMouseLeave={(e) => e.currentTarget.style.color = G.muted}
              >{label}</a>
            ))}
          </div>

          <Link to="/login" style={{
            fontFamily: G.font, fontWeight: 700, fontSize: "13px",
            color: G.gold, letterSpacing: "0.1em", textDecoration: "none",
            padding: "9px 22px", border: `1.5px solid rgba(212,175,55,0.4)`,
            borderRadius: "8px", transition: "all 0.2s",
            textTransform: "uppercase",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = G.goldDim; e.currentTarget.style.borderColor = G.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
          >
            Member Login
          </Link>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <header style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "120px 24px 80px",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "7px 18px",
              background: "rgba(212,175,55,0.08)",
              border: `1px solid rgba(212,175,55,0.3)`,
              borderRadius: "20px", marginBottom: "32px",
              fontFamily: G.mono, fontSize: "11px", color: G.gold,
              letterSpacing: "0.1em", fontWeight: 500,
              animation: "pulseRing 3s ease-in-out infinite",
            }}>
              🏆 JOIN THE FOUNDER'S CLUB 2026
            </div>

            {/* Main heading */}
            <h1 className="hero-title" style={{
              fontFamily: G.font, fontWeight: 700,
              fontSize: "clamp(42px, 7vw, 82px)",
              lineHeight: 1.08, letterSpacing: "-0.02em",
              color: G.text, marginBottom: "24px",
              maxWidth: "900px", margin: "0 auto 24px",
            }}>
              Master Your Life in{" "}
              <span className="gold-shimmer">16 Minutes</span>.
            </h1>

            {/* Sub */}
            <p style={{
              fontFamily: G.body, fontSize: "clamp(16px, 2.2vw, 20px)",
              color: G.muted, maxWidth: "580px", margin: "0 auto 48px",
              lineHeight: 1.65, fontWeight: 400,
            }}>
              The world's first AI-verified discipline system. Focus deeper.
              Rank globally. Win consistently.
            </p>

            {/* CTA group */}
            <div className="cta-group" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/signup" className="btn-gold" style={{ fontSize: "16px", padding: "18px 40px" }}>
                START YOUR 16-MIN EVOLUTION →
              </Link>
              <a href="#how" className="btn-outline">
                See How It Works
              </a>
            </div>

            {/* Urgency */}
            <p style={{
              fontFamily: G.mono, fontSize: "12px", color: "rgba(248,113,113,0.75)",
              marginTop: "20px", letterSpacing: "0.06em",
            }}>
              ⚠️ 12 spots remaining in your region at ₹1,999/month
            </p>
          </motion.div>

          {/* Floating orbs */}
          <div style={{
            position: "absolute", width: "500px", height: "500px",
            borderRadius: "50%", top: "20%", left: "10%",
            background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
            animation: "floatY 8s ease-in-out infinite",
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", width: "400px", height: "400px",
            borderRadius: "50%", bottom: "15%", right: "8%",
            background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
            animation: "floatY 10s ease-in-out infinite reverse",
          }} aria-hidden="true" />
        </header>

        {/* ── TICKER ──────────────────────────────────────────────────────── */}
        <Ticker />

        {/* ── STATS ───────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px" }}>
          <FadeIn>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "48px", maxWidth: "900px", margin: "0 auto",
            }}>
              <StatCounter value="12000+" label="Active Members" />
              <StatCounter value="98" label="% Satisfaction Rate" />
              <StatCounter value="16" label="Minute Daily Protocol" />
              <StatCounter value="4" label="Countries & Growing" />
            </div>
          </FadeIn>
        </section>

        {/* ── TECH / FEATURES ─────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px", background: "rgba(212,175,55,0.02)" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.18em", marginBottom: "12px" }}>
                BUILT DIFFERENT
              </p>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: G.text, letterSpacing: "-0.01em" }}>
                Why ManifiX is <span className="gold-shimmer">Worth It</span>
              </h2>
            </div>
          </FadeIn>
          <div className="tech-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px", maxWidth: "1100px", margin: "0 auto",
          }}>
            {techCards.map((card, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="tech-card" style={{
                  padding: "28px", borderRadius: "14px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  transition: "all 0.25s ease",
                  cursor: "default",
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "14px" }}>{card.icon}</div>
                  <h3 style={{ fontFamily: G.font, fontSize: "18px", fontWeight: 700, color: G.text, marginBottom: "10px", letterSpacing: "0.02em" }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.65 }}>{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section id="how" style={{ padding: "100px 24px" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.18em", marginBottom: "12px" }}>
                THE PROCESS
              </p>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: G.text }}>
                From Zero to <span className="gold-shimmer">Elite</span> in 4 Steps
              </h2>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px", maxWidth: "1100px", margin: "0 auto",
          }}>
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="step-card" style={{
                  padding: "28px 24px", borderRadius: "14px",
                  border: `1px solid ${G.border}`,
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.25s ease", position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    fontFamily: G.mono, fontSize: "42px", fontWeight: 700,
                    color: "rgba(212,175,55,0.12)", position: "absolute",
                    top: "12px", right: "20px", lineHeight: 1,
                  }}>{step.num}</div>
                  <div style={{
                    fontFamily: G.mono, fontSize: "11px", color: G.gold,
                    letterSpacing: "0.1em", marginBottom: "10px",
                  }}>STEP {step.num}</div>
                  <h3 style={{ fontFamily: G.font, fontSize: "18px", fontWeight: 700, color: G.text, marginBottom: "10px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── ABOUT SECTION ───────────────────────────────────────────────── */}
        <section id="about" style={{
          padding: "100px 24px",
          background: "rgba(212,175,55,0.02)",
          borderTop: `1px solid ${G.border}`,
        }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: "64px" }}>
                <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.18em", marginBottom: "12px" }}>
                  OUR STORY
                </p>
                <h2 style={{ fontFamily: G.font, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: G.text, marginBottom: "20px" }}>
                  About <span className="gold-shimmer">ManifiX</span>
                </h2>
                <p style={{ fontSize: "17px", color: G.muted, maxWidth: "640px", margin: "0 auto", lineHeight: 1.7 }}>
                  ManifiX is an intelligent discipline platform designed to help people
                  think clearly, work efficiently, and focus deeply in the modern digital world.
                </p>
              </div>
            </FadeIn>

            <div className="about-grid" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "32px", marginBottom: "64px",
            }}>
              {[
                {
                  icon: "🎯",
                  title: "Our Mission",
                  body: "We build technology that strengthens human intelligence rather than replacing it. In a world of constant distraction, ManifiX gives you systems that sharpen focus and amplify output — every single day.",
                },
                {
                  icon: "🔭",
                  title: "Our Vision",
                  body: "The future of productivity combines AI with human creativity. ManifiX aims to become the global platform where technology empowers people to achieve their absolute highest potential.",
                },
                {
                  icon: "⚡",
                  title: "ManifiX AI Coach",
                  body: "An always-on GPT-powered strategist that adapts to your schedule, goals, and progress. It doesn't just answer questions — it rewires how you approach every challenge.",
                },
                {
                  icon: "🏅",
                  title: "Magic16 System",
                  body: "A 16-step protocol built on breathing science and postural awareness. Proven to improve concentration, reduce mental fatigue, and build elite-level daily consistency.",
                },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div style={{
                    padding: "28px", borderRadius: "14px",
                    background: G.surface, border: `1px solid ${G.border}`,
                  }}>
                    <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
                    <h3 style={{ fontFamily: G.font, fontSize: "18px", fontWeight: 700, color: G.text, marginBottom: "10px" }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.7 }}>{item.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section style={{ padding: "100px 24px" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.18em", marginBottom: "12px" }}>
                SOCIAL PROOF
              </p>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: G.text }}>
                Verified by the <span className="gold-shimmer">Elite</span>
              </h2>
            </div>
          </FadeIn>
          <div className="testimonial-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px", maxWidth: "1000px", margin: "0 auto",
          }}>
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="testimonial-card" style={{
                  padding: "28px", borderRadius: "14px",
                  background: G.surface, border: `1px solid ${G.border}`,
                  transition: "all 0.25s ease",
                }}>
                  <div style={{ marginBottom: "14px" }}>
                    {"★".repeat(t.stars).split("").map((s, si) => (
                      <span key={si} style={{ color: G.gold, fontSize: "14px" }}>{s}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "15px", color: G.text, lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: `linear-gradient(135deg, ${G.gold}, #B8860B)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: G.font, fontWeight: 700, fontSize: "16px", color: "#000",
                    }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontFamily: G.font, fontWeight: 700, fontSize: "14px", color: G.text, letterSpacing: "0.04em" }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: "12px", color: G.gold }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <section id="pricing" style={{
          padding: "100px 24px",
          background: "rgba(212,175,55,0.02)",
          borderTop: `1px solid ${G.border}`,
        }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.18em", marginBottom: "12px" }}>
                INVESTMENT
              </p>
              <h2 style={{ fontFamily: G.font, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: G.text, marginBottom: "14px" }}>
                One Plan. <span className="gold-shimmer">Elite Access.</span>
              </h2>
              <p style={{ fontSize: "16px", color: G.muted }}>Everything you need. Nothing you don't.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{
              maxWidth: "480px", margin: "0 auto",
              padding: "44px 40px", borderRadius: "20px",
              background: G.surface,
              border: `1.5px solid rgba(212,175,55,0.35)`,
              boxShadow: `0 0 60px rgba(212,175,55,0.08), 0 32px 64px rgba(0,0,0,0.5)`,
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              {/* Top glow line */}
              <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
              }} />

              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 14px", borderRadius: "20px",
                background: G.goldDim, border: `1px solid ${G.border}`,
                fontFamily: G.mono, fontSize: "11px", color: G.gold,
                letterSpacing: "0.1em", marginBottom: "24px",
              }}>
                💎 ELITE MEMBERSHIP
              </div>

              <div style={{ marginBottom: "8px" }}>
                <span style={{
                  fontFamily: G.font, fontSize: "60px", fontWeight: 700,
                  color: G.gold, lineHeight: 1,
                }}>₹1,999</span>
                <span style={{ fontSize: "16px", color: G.muted }}>/month</span>
              </div>
              <p style={{ fontSize: "13px", color: G.dim, marginBottom: "32px" }}>
                Cancel anytime · No hidden fees · Razorpay secured
              </p>

              {[
                "Unlimited ManifiX AI access",
                "Real-time AI pose verification",
                "Global leaderboard ranking",
                "Advanced streak analytics",
                "Priority AI coach responses",
                "Magic16 full protocol access",
              ].map((feature, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 0",
                  borderBottom: i < 5 ? `1px solid rgba(255,255,255,0.05)` : "none",
                  textAlign: "left",
                }}>
                  <span style={{ color: G.gold, fontSize: "14px", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "14px", color: G.muted }}>{feature}</span>
                </div>
              ))}

              <Link to="/signup" className="btn-gold" style={{ width: "100%", justifyContent: "center", marginTop: "28px", fontSize: "15px" }}>
                CLAIM YOUR MEMBERSHIP →
              </Link>

              <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.dim, marginTop: "16px", letterSpacing: "0.04em" }}>
                🔒 256-bit encrypted · Razorpay compliant
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
        <section style={{ padding: "100px 24px", textAlign: "center" }}>
          <FadeIn>
            <h2 style={{
              fontFamily: G.font, fontSize: "clamp(32px, 5vw, 58px)",
              fontWeight: 700, color: G.text, marginBottom: "16px", lineHeight: 1.1,
            }}>
              Your Discipline.<br />
              <span className="gold-shimmer">Your Legacy.</span>
            </h2>
            <p style={{ fontSize: "17px", color: G.muted, marginBottom: "40px", maxWidth: "500px", margin: "0 auto 40px" }}>
              Join thousands of high-performers who chose to be elite.
            </p>
            <div className="cta-group" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/signup" className="btn-gold" style={{ fontSize: "16px", padding: "18px 44px" }}>
                BEGIN YOUR EVOLUTION →
              </Link>
              <Link to="/login" className="btn-outline">
                Already a Member
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: `1px solid ${G.border}`,
          padding: "40px 24px",
          background: G.surface,
        }}>
          <div style={{
            maxWidth: "1100px", margin: "0 auto",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ManifixLogo size={28} />
              <span style={{ fontFamily: G.font, fontWeight: 700, fontSize: "16px", color: G.gold, letterSpacing: "0.14em" }}>
                MANIFIX AI
              </span>
            </div>
            <div className="footer-links" style={{ display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center" }}>
              {[
                ["#about", "About"],
                ["#how", "How It Works"],
                ["#pricing", "Pricing"],
                ["/privacy", "Privacy"],
                ["/terms", "Terms"],
              ].map(([href, label]) => (
                href.startsWith("#")
                  ? <a key={href} href={href} style={{ fontSize: "13px", color: G.muted, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = G.gold}
                      onMouseLeave={(e) => e.currentTarget.style.color = G.muted}
                    >{label}</a>
                  : <Link key={href} to={href} style={{ fontSize: "13px", color: G.muted, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = G.gold}
                      onMouseLeave={(e) => e.currentTarget.style.color = G.muted}
                    >{label}</Link>
              ))}
            </div>
            <p style={{ fontFamily: G.mono, fontSize: "11px", color: G.dim, letterSpacing: "0.06em", textAlign: "center" }}>
              © {new Date().getFullYear()} MANIFIX AI · BEYOND HUMAN LIMITS · BUILT IN INDIA 🇮🇳
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
