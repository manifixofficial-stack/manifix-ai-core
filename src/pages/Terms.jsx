// src/pages/Terms.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const G = {
  gold:      "#D4AF37",
  goldLight: "#F0D060",
  goldDim:   "rgba(212,175,55,0.12)",
  goldGlow:  "rgba(212,175,55,0.30)",
  bg:        "#08080F",
  surface:   "#0D0D18",
  border:    "rgba(212,175,55,0.13)",
  text:      "#EEEEF4",
  muted:     "rgba(238,238,244,0.50)",
  dim:       "rgba(238,238,244,0.22)",
  font:      "'Rajdhani', sans-serif",
  body:      "'DM Sans', sans-serif",
  mono:      "'JetBrains Mono', monospace",
};

const SECTIONS = [
  { id: "intro",        label: "Introduction" },
  { id: "account",      label: "Account Rules" },
  { id: "features",     label: "Features" },
  { id: "ownership",    label: "Content Ownership" },
  { id: "billing",      label: "Billing" },
  { id: "prohibited",   label: "Prohibited Use" },
  { id: "privacy",      label: "Privacy & Security" },
  { id: "ai",           label: "AI Disclaimer" },
  { id: "termination",  label: "Termination" },
  { id: "liability",    label: "Liability" },
  { id: "changes",      label: "Changes to Terms" },
  { id: "contact",      label: "Contact" },
];

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.body}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 4px; }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .gold-shimmer {
    background: linear-gradient(90deg, ${G.gold}, ${G.goldLight}, #B8860B, ${G.gold});
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .terms-nav-link {
    display: block;
    padding: 8px 14px;
    font-family: ${G.mono};
    font-size: 11px;
    letter-spacing: 0.08em;
    color: ${G.muted};
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.2s;
    border-radius: 0 4px 4px 0;
  }
  .terms-nav-link:hover, .terms-nav-link.active {
    color: ${G.gold};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
  }
  .terms-section {
    padding: 40px 0;
    border-bottom: 1px solid ${G.border};
  }
  .terms-section:last-child { border-bottom: none; }
  .terms-list li {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    font-size: 15px;
    color: ${G.muted};
    line-height: 1.65;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    list-style: none;
  }
  .terms-list li:last-child { border-bottom: none; }
  @media (max-width: 900px) {
    .terms-layout { flex-direction: column !important; }
    .terms-sidebar { position: static !important; width: 100% !important; display: flex !important; flex-wrap: wrap !important; gap: 4px !important; padding: 16px !important; }
    .terms-sidebar a { border-left: none !important; border: 1px solid ${G.border} !important; border-radius: 6px !important; padding: 6px 12px !important; }
    .features-grid { grid-template-columns: 1fr !important; }
  }
`;

const ManifixLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#tmLG)" />
    <path d="M5 25V9L11.5 9L16 17.5L20.5 9L27 9V25H22.5V15.5L16 25.5L9.5 15.5V25Z" fill="#fff"/>
    <circle cx="26" cy="8" r="3.5" fill={G.gold}/>
    <defs>
      <linearGradient id="tmLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#0f0f18"/>
      </linearGradient>
    </defs>
  </svg>
);

const h2Style = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "24px", fontWeight: 700,
  color: "#EEEEF4", marginBottom: "14px", letterSpacing: "0.01em",
};
const pStyle = { fontSize: "15px", color: "rgba(238,238,244,0.50)", lineHeight: 1.75 };

function SectionLabel({ text }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
      color: "#D4AF37", letterSpacing: "0.16em",
      marginBottom: "10px", textTransform: "uppercase",
    }}>
      {text}
    </div>
  );
}

function InfoCard({ text, type = "gold" }) {
  const colors = {
    gold: { bg: "rgba(212,175,55,0.06)", border: "rgba(212,175,55,0.22)", left: "#D4AF37" },
    red:  { bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.22)", left: "#f87171" },
  };
  const c = colors[type];
  return (
    <div style={{
      marginTop: "16px", padding: "14px 18px",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "10px", borderLeft: `3px solid ${c.left}`,
      fontSize: "13px", color: "rgba(238,238,244,0.65)", lineHeight: 1.65,
    }}>
      {text}
    </div>
  );
}

export default function Terms() {
  const [active, setActive] = useState("intro");

  useEffect(() => {
    const id = "manifix-terms-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: G.bg, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "60px",
        background: "rgba(8,8,15,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${G.border}`,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <ManifixLogo size={28} />
          <span style={{ fontFamily: G.font, fontWeight: 700, fontSize: "16px", color: G.gold, letterSpacing: "0.14em" }}>
            MANIFIX AI
          </span>
        </Link>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/privacy" style={{ fontFamily: G.mono, fontSize: "11px", color: G.muted, textDecoration: "none", letterSpacing: "0.08em" }}>
            Privacy
          </Link>
          <Link to="/login" style={{
            fontFamily: G.mono, fontSize: "11px", color: G.gold,
            textDecoration: "none", letterSpacing: "0.08em",
            padding: "6px 16px", border: `1px solid rgba(212,175,55,0.35)`,
            borderRadius: "6px",
          }}>
            Login
          </Link>
        </div>
      </nav>

      {/* ── HERO HEADER ── */}
      <div style={{
        padding: "60px 32px 40px",
        borderBottom: `1px solid ${G.border}`,
        background: `linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%)`,
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 16px",
          background: G.goldDim, border: `1px solid ${G.border}`,
          borderRadius: "20px", marginBottom: "20px",
          fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.12em",
        }}>
          📋 EFFECTIVE · JANUARY 2025
        </div>
        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 52px)",
          color: G.text, letterSpacing: "-0.01em", marginBottom: "12px",
        }}>
          Terms of <span className="gold-shimmer">Use</span>
        </h1>
        <p style={{ fontSize: "15px", color: G.muted, maxWidth: "500px", margin: "0 auto" }}>
          These terms govern your use of ManifiX AI. Please read them carefully before using our platform.
        </p>
      </div>

      {/* ── LAYOUT ── */}
      <div className="terms-layout" style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Sidebar */}
        <aside className="terms-sidebar" style={{
          width: "220px", flexShrink: 0,
          position: "sticky", top: "60px",
          height: "calc(100vh - 60px)", overflowY: "auto",
          padding: "32px 0",
          borderRight: `1px solid ${G.border}`,
        }}>
          <div style={{ fontFamily: G.mono, fontSize: "9px", color: G.dim, letterSpacing: "0.18em", padding: "0 14px 12px", textTransform: "uppercase" }}>
            Contents
          </div>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className={`terms-nav-link${active === s.id ? " active" : ""}`}>
              {s.label}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "40px 0 80px 48px", maxWidth: "780px" }}>

          {/* Introduction */}
          <section id="intro" className="terms-section">
            <SectionLabel text="01 · Introduction" />
            <h2 style={h2Style}>Welcome to ManifiX</h2>
            <p style={pStyle}>
              ManifiX is a comprehensive AI-powered platform designed to help users build elite discipline,
              manage productivity, and maintain peak mental performance. We combine intelligent AI assistance,
              structured wellness tools, and a global performance community to help you achieve more every day.
            </p>
            <p style={{ ...pStyle, marginTop: "14px" }}>
              These Terms of Use govern your access to all ManifiX services including our web application,
              mobile platform, APIs, integrations, AI coaching tools, and the Magic16 wellness system.
              By using ManifiX, you agree to these Terms and all applicable laws.
            </p>
            <InfoCard text="ManifiX is committed to a secure, trusted environment. We prioritize user privacy, account safety, responsible AI usage, and an inclusive experience for all." />
          </section>

          {/* Account */}
          <section id="account" className="terms-section">
            <SectionLabel text="02 · Account Rules" />
            <h2 style={h2Style}>Account Registration & Responsibilities</h2>
            <ul className="terms-list" style={{ marginTop: "16px" }}>
              {[
                ["Age Requirement", "Only individuals 13 years or older may register, or the minimum age required in your jurisdiction."],
                ["Accurate Info", "All registration information must be accurate, complete, and updated regularly."],
                ["Credentials", "Keep your account credentials confidential and secure at all times."],
                ["Personal Use", "Accounts are personal — sharing with others is not permitted without authorization."],
                ["Minors", "Users under 18 must have permission from a parent or guardian."],
                ["No Impersonation", "Unauthorized use or impersonation of another user is strictly prohibited."],
              ].map(([label, desc]) => (
                <li key={label}>
                  <span style={{ color: G.gold, fontFamily: G.mono, fontSize: "11px", minWidth: "120px", paddingTop: "2px" }}>{label}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Features */}
          <section id="features" className="terms-section">
            <SectionLabel text="03 · Features" />
            <h2 style={h2Style}>ManifiX Platform Features</h2>
            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "20px" }}>
              {[
                { icon: "🤖", title: "AI Conversation Assistant", desc: "Ask questions, generate ideas, and get intelligent responses through natural language interaction." },
                { icon: "⚡", title: "Magic16 Protocol", desc: "16-minute daily system: 8 min yoga + 8 min meditation. AI-verified, streak-tracked." },
                { icon: "🌍", title: "Global Leaderboard", desc: "Compete with performers worldwide. Your verified score ranks you globally every day." },
                { icon: "👁️", title: "AI Pose Verification", desc: "Real-time neural network tracking of your sessions. No shortcuts. Pure verified progress." },
                { icon: "🔥", title: "Streak Engine", desc: "Gamified daily streaks with social proof. Miss a day — the system resets. No exceptions." },
                { icon: "💎", title: "Elite Membership", desc: "Unlimited AI access, video proofing, priority ranking, and advanced analytics." },
              ].map(f => (
                <div key={f.title} style={{
                  padding: "18px", borderRadius: "10px",
                  background: G.surface, border: `1px solid ${G.border}`,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "8px" }}>{f.icon}</div>
                  <div style={{ fontFamily: G.font, fontSize: "15px", fontWeight: 700, color: G.text, marginBottom: "6px" }}>{f.title}</div>
                  <div style={{ fontSize: "13px", color: G.muted, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Content Ownership */}
          <section id="ownership" className="terms-section">
            <SectionLabel text="04 · Content Ownership" />
            <h2 style={h2Style}>Your Content, Your Rights</h2>
            <ul className="terms-list" style={{ marginTop: "16px" }}>
              {[
                "You retain full control and ownership over any content you provide or generate on ManifiX.",
                "Outputs generated by ManifiX AI based on your inputs are yours to use without restriction.",
                "Content must comply with applicable laws and not infringe upon third-party rights.",
                "Anonymized usage data may be analyzed to improve AI performance and platform features.",
                "ManifiX reserves the right to remove content that violates these Terms or is harmful.",
              ].map((item, i) => (
                <li key={i}>
                  <span style={{ color: G.gold }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Billing */}
          <section id="billing" className="terms-section">
            <SectionLabel text="05 · Billing" />
            <h2 style={h2Style}>Paid Services & Subscriptions</h2>
            <div style={{
              padding: "20px 24px", borderRadius: "12px",
              background: "rgba(212,175,55,0.04)",
              border: `1px solid rgba(212,175,55,0.20)`,
              marginBottom: "16px",
            }}>
              <div style={{ fontFamily: G.font, fontSize: "32px", fontWeight: 700, color: G.gold, marginBottom: "4px" }}>₹1,999</div>
              <div style={{ fontFamily: G.mono, fontSize: "11px", color: G.muted, letterSpacing: "0.08em" }}>per month · cancel anytime · Razorpay secured</div>
            </div>
            <ul className="terms-list">
              {[
                "Paid plans require valid billing information and an active payment method.",
                "Subscription fees may change with prior notice to users.",
                "Payments are generally non-refundable, except where required by law.",
                "Accounts may be restricted if payments are not maintained.",
                "Premium features are accessible only during an active subscription period.",
              ].map((item, i) => (
                <li key={i}>
                  <span style={{ color: G.gold }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Prohibited */}
          <section id="prohibited" className="terms-section">
            <SectionLabel text="06 · Prohibited Use" />
            <h2 style={h2Style}>What You Must Not Do</h2>
            <InfoCard text="Violations of these rules may result in immediate account suspension without refund." type="red" />
            <ul className="terms-list" style={{ marginTop: "16px" }}>
              {[
                "Use the platform for illegal activities or to violate any applicable law",
                "Attempt to reverse engineer, hack, or compromise ManifiX systems",
                "Impersonate other users, staff, or ManifiX itself",
                "Upload malicious code, viruses, or harmful content",
                "Abuse, harass, or threaten other users on the platform",
                "Use automated bots to scrape or abuse platform features",
                "Share your account credentials with unauthorized third parties",
              ].map((item, i) => (
                <li key={i}>
                  <span style={{ color: "#f87171" }}>✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Privacy & Security */}
          <section id="privacy" className="terms-section">
            <SectionLabel text="07 · Privacy & Security" />
            <h2 style={h2Style}>Your Data is Protected</h2>
            <p style={pStyle}>
              ManifiX employs industry-standard security measures including encrypted connections, secure
              cloud storage, and role-based access controls. Users are encouraged to protect their own
              credentials and maintain strong account security.
            </p>
            <p style={{ ...pStyle, marginTop: "14px" }}>
              Content moderation, abuse detection, and privacy protections are continuously enforced
              to ensure a safe and respectful experience. See our{" "}
              <Link to="/privacy" style={{ color: G.gold, textDecoration: "none" }}>Privacy Policy</Link>{" "}
              for full details.
            </p>
          </section>

          {/* AI Disclaimer */}
          <section id="ai" className="terms-section">
            <SectionLabel text="08 · AI Disclaimer" />
            <h2 style={h2Style}>AI Accuracy & Limitations</h2>
            <p style={pStyle}>
              AI-generated outputs are provided for informational and assistance purposes only. Content
              may occasionally contain inaccuracies or incomplete information.
            </p>
            <InfoCard text="Always independently verify critical details before acting on AI-generated suggestions. ManifiX AI is not a substitute for professional medical, legal, or financial advice." />
          </section>

          {/* Termination */}
          <section id="termination" className="terms-section">
            <SectionLabel text="09 · Termination" />
            <h2 style={h2Style}>Account Termination</h2>
            <p style={pStyle}>
              ManifiX reserves the right to suspend or terminate accounts that violate these Terms,
              engage in abusive behavior, or pose a security risk to the platform or other users.
              Users may also delete their own accounts at any time through Settings.
            </p>
          </section>

          {/* Liability */}
          <section id="liability" className="terms-section">
            <SectionLabel text="10 · Liability" />
            <h2 style={h2Style}>Limitation of Liability</h2>
            <p style={pStyle}>
              ManifiX provides services on an "as is" basis. While we strive for the highest quality,
              we cannot guarantee uninterrupted or error-free operation at all times. ManifiX is not
              liable for any indirect, incidental, or consequential damages arising from platform use.
            </p>
          </section>

          {/* Changes */}
          <section id="changes" className="terms-section">
            <SectionLabel text="11 · Changes" />
            <h2 style={h2Style}>Updates to These Terms</h2>
            <p style={pStyle}>
              ManifiX may revise these Terms periodically. Continued use of the platform after changes
              constitutes acceptance of the updated Terms. Significant updates will be communicated via
              the platform or email notifications where applicable.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="terms-section">
            <SectionLabel text="12 · Contact" />
            <h2 style={h2Style}>Questions or Concerns?</h2>
            <div style={{
              marginTop: "20px", padding: "28px",
              background: G.surface,
              border: `1px solid rgba(212,175,55,0.25)`,
              borderRadius: "14px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
              }} />
              <div style={{ fontFamily: G.font, fontSize: "18px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
                ManifiX AI · Legal & Support
              </div>
              {[
                ["Email", "manifixofficial@gmail.com"],
                ["Website", "https://manifixai.com"],
                ["© Copyright", `${new Date().getFullYear()} ManifiX AI. All rights reserved.`],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", gap: "16px", padding: "10px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.05)`,
                  fontSize: "14px",
                }}>
                  <span style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, minWidth: "90px", paddingTop: "2px" }}>{label}</span>
                  <span style={{ color: G.muted }}>{val}</span>
                </div>
              ))}
              <Link to="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                marginTop: "20px", padding: "12px 28px",
                background: `linear-gradient(135deg, ${G.gold} 0%, #B8860B 100%)`,
                color: "#000", fontFamily: G.font, fontWeight: 700,
                fontSize: "13px", letterSpacing: "0.1em",
                borderRadius: "8px", textDecoration: "none",
              }}>
                ACCEPT & GET STARTED →
              </Link>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
