// src/pages/Privacy.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const G = {
  gold:      "#D4AF37",
  goldLight: "#F0D060",
  goldDim:   "rgba(212,175,55,0.12)",
  goldGlow:  "rgba(212,175,55,0.30)",
  bg:        "#08080F",
  surface:   "#0D0D18",
  surface2:  "#111120",
  border:    "rgba(212,175,55,0.13)",
  borderHover:"rgba(212,175,55,0.32)",
  text:      "#EEEEF4",
  muted:     "rgba(238,238,244,0.50)",
  dim:       "rgba(238,238,244,0.22)",
  font:      "'Rajdhani', sans-serif",
  body:      "'DM Sans', sans-serif",
  mono:      "'JetBrains Mono', monospace",
};

const SECTIONS = [
  { id: "overview",    label: "Overview" },
  { id: "scope",       label: "Scope" },
  { id: "definitions", label: "Definitions" },
  { id: "data",        label: "Data Collected" },
  { id: "usage",       label: "How We Use It" },
  { id: "sharing",     label: "Sharing" },
  { id: "security",    label: "Security" },
  { id: "ai",          label: "AI Transparency" },
  { id: "features",    label: "Features" },
  { id: "rights",      label: "Your Rights" },
  { id: "cookies",     label: "Cookies" },
  { id: "payments",    label: "Payments" },
  { id: "children",    label: "Children" },
  { id: "updates",     label: "Policy Updates" },
  { id: "contact",     label: "Contact" },
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
  .priv-nav-link {
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
  .priv-nav-link:hover, .priv-nav-link.active {
    color: ${G.gold};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
  }
  .priv-section {
    padding: 40px 0;
    border-bottom: 1px solid ${G.border};
  }
  .priv-section:last-child { border-bottom: none; }
  .priv-list li {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    font-size: 15px;
    color: ${G.muted};
    line-height: 1.65;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .priv-list li:last-child { border-bottom: none; }
  @media (max-width: 900px) {
    .priv-layout { flex-direction: column !important; }
    .priv-sidebar { position: static !important; width: 100% !important; display: flex !important; flex-wrap: wrap !important; gap: 4px !important; padding: 16px !important; }
    .priv-sidebar a { border-left: none !important; border: 1px solid ${G.border} !important; border-radius: 6px !important; padding: 6px 12px !important; }
  }
`;

// ── Inline SVG Logo ────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#pvLG)" />
    <path d="M5 25V9L11.5 9L16 17.5L20.5 9L27 9V25H22.5V15.5L16 25.5L9.5 15.5V25Z" fill="#fff"/>
    <circle cx="26" cy="8" r="3.5" fill={G.gold}/>
    <defs>
      <linearGradient id="pvLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#0f0f18"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function Privacy() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const id = "manifix-privacy-styles";
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
          <Link to="/terms" style={{ fontFamily: G.mono, fontSize: "11px", color: G.muted, textDecoration: "none", letterSpacing: "0.08em" }}>
            Terms
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
          🔒 LAST UPDATED · JANUARY 2025
        </div>
        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 52px)",
          color: G.text, letterSpacing: "-0.01em", marginBottom: "12px",
        }}>
          Privacy <span className="gold-shimmer">Policy</span>
        </h1>
        <p style={{ fontSize: "15px", color: G.muted, maxWidth: "500px", margin: "0 auto" }}>
          ManifiX AI is committed to transparency. Here's exactly how we handle your data.
        </p>

        {/* highlight pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          marginTop: "24px", padding: "12px 24px",
          background: "rgba(212,175,55,0.06)",
          border: `1px solid rgba(212,175,55,0.25)`,
          borderRadius: "12px",
          fontFamily: G.mono, fontSize: "12px", color: G.gold, letterSpacing: "0.08em",
        }}>
          🛡️ We NEVER sell your personal data · Ever.
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className="priv-layout" style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Sidebar */}
        <aside className="priv-sidebar" style={{
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
            <a key={s.id} href={`#${s.id}`} className={`priv-nav-link${active === s.id ? " active" : ""}`}>
              {s.label}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "40px 0 80px 48px", maxWidth: "780px" }}>

          {/* Overview */}
          <section id="overview" className="priv-section">
            <SectionLabel text="01 · Overview" />
            <h2 style={h2Style}>What is ManifiX?</h2>
            <p style={pStyle}>
              ManifiX is an AI-powered discipline, productivity, and wellness platform designed to help users
              think clearly, work efficiently, and maintain elite-level daily habits. The platform combines
              intelligent conversational AI with structured wellness tools that support daily growth,
              learning, and mental clarity.
            </p>
            <p style={{ ...pStyle, marginTop: "14px" }}>
              This Privacy Policy explains how ManifiX collects, uses, stores, and protects personal
              information when users access our website, applications, and related services. Our goal is
              full transparency — you deserve to know exactly how your information is handled.
            </p>
          </section>

          {/* Scope */}
          <section id="scope" className="priv-section">
            <SectionLabel text="02 · Scope" />
            <h2 style={h2Style}>Who This Applies To</h2>
            <p style={pStyle}>
              This Privacy Policy applies to all ManifiX products and services including our website,
              mobile applications, APIs, and integrations. It covers visitors, registered users,
              subscribers, and any individuals interacting with ManifiX services.
            </p>
            <InfoCard text="By accessing or using ManifiX, you agree to the practices described in this Privacy Policy." />
          </section>

          {/* Definitions */}
          <section id="definitions" className="priv-section">
            <SectionLabel text="03 · Definitions" />
            <h2 style={h2Style}>Key Terms</h2>
            <ul className="priv-list" style={{ listStyle: "none", marginTop: "16px" }}>
              {[
                ["Personal Data", "Information that identifies or can be associated with an individual, such as name or email address."],
                ["Processing", "Any action performed on personal data including collection, storage, modification, analysis, or deletion."],
                ["Controller", "ManifiX determines how and why personal data is processed."],
                ["Processor", "Trusted third-party providers that process data on behalf of ManifiX such as hosting platforms or authentication services."],
              ].map(([term, def]) => (
                <li key={term}>
                  <span style={{ color: G.gold, fontFamily: G.mono, fontSize: "11px", minWidth: "110px", paddingTop: "2px" }}>{term}</span>
                  <span>{def}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Collected */}
          <section id="data" className="priv-section">
            <SectionLabel text="04 · Data Collected" />
            <h2 style={h2Style}>What We Collect</h2>
            <p style={pStyle}>We may collect the following types of information:</p>
            <ul className="priv-list" style={{ listStyle: "none", marginTop: "16px" }}>
              {[
                ["Account Info", "Name, email address, and authentication credentials."],
                ["User Content", "Messages, prompts, or feedback submitted while using ManifiX features."],
                ["Wellness Inputs", "Selected routines or feature usage preferences."],
                ["Technical Data", "Browser type, device info, operating system, and IP address."],
                ["Usage Data", "Interaction patterns, feature statistics, and platform performance metrics."],
                ["Payment Metadata", "Subscription data only. Sensitive card information is never stored by ManifiX."],
              ].map(([label, desc]) => (
                <li key={label}>
                  <span style={{ color: G.gold, fontFamily: G.mono, fontSize: "11px", minWidth: "130px", paddingTop: "2px" }}>{label}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Usage */}
          <section id="usage" className="priv-section">
            <SectionLabel text="05 · Usage" />
            <h2 style={h2Style}>How We Use Your Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "20px" }}>
              {[
                "Provide and maintain ManifiX services",
                "Enable secure authentication",
                "Deliver AI-powered coaching",
                "Improve wellness tools",
                "Respond to user support requests",
                "Detect fraud and security risks",
                "Analyze platform performance",
                "Personalize user experience",
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "12px 14px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: "8px",
                  fontSize: "13px", color: G.muted, lineHeight: 1.5,
                }}>
                  <span style={{ color: G.gold, flexShrink: 0, marginTop: "1px" }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Sharing */}
          <section id="sharing" className="priv-section">
            <SectionLabel text="06 · Sharing" />
            <h2 style={h2Style}>When We Share Information</h2>
            <p style={pStyle}>
              ManifiX does not sell or rent personal data. Information may only be shared with trusted
              service providers when necessary to deliver platform services.
            </p>
            <ul className="priv-list" style={{ listStyle: "none", marginTop: "16px" }}>
              {[
                "Cloud hosting infrastructure providers",
                "Authentication and account management platforms",
                "Analytics tools used to improve service performance",
                "Payment processors handling subscription transactions",
              ].map((item, i) => (
                <li key={i}>
                  <span style={{ color: G.gold }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <InfoCard text="All third-party providers are required to maintain strict data security and confidentiality standards." />
          </section>

          {/* Security */}
          <section id="security" className="priv-section">
            <SectionLabel text="07 · Security" />
            <h2 style={h2Style}>Storage, Security & Retention</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              {[
                ["🔐", "Encrypted HTTPS data transmission"],
                ["☁️", "Secure cloud infrastructure"],
                ["🎛️", "Role-based access control systems"],
                ["👁️", "Security monitoring for suspicious activity"],
                ["⏱️", "Data retention limited to operational necessity"],
              ].map(([icon, text]) => (
                <div key={text} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 18px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: "10px",
                  fontSize: "14px", color: G.muted,
                }}>
                  <span style={{ fontSize: "18px" }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </section>

          {/* AI Transparency */}
          <section id="ai" className="priv-section">
            <SectionLabel text="08 · AI Transparency" />
            <h2 style={h2Style}>About Our AI Systems</h2>
            <p style={pStyle}>
              ManifiX includes AI-powered systems that generate responses based on user prompts and inputs.
              AI responses are generated automatically and may not always be perfectly accurate.
            </p>
            <InfoCard text="AI-generated responses are informational assistance — not professional medical, legal, or financial advice. Always evaluate outputs critically." />
          </section>

          {/* Features */}
          <section id="features" className="priv-section">
            <SectionLabel text="09 · Features" />
            <h2 style={h2Style}>ManifiX Platform Features</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
              {[
                { icon: "🤖", title: "AI Conversation Assistant", desc: "An intelligent assistant that helps users ask questions, generate ideas, explore topics, and receive helpful responses through natural language interaction." },
                { icon: "⚡", title: "Magic16 Wellness System", desc: "A structured 16-minute daily protocol: 8 minutes of guided yoga + 8 minutes of meditation. Proven to improve focus, reduce fatigue, and build elite consistency." },
              ].map(f => (
                <div key={f.title} style={{
                  padding: "20px", borderRadius: "12px",
                  background: G.surface, border: `1px solid ${G.border}`,
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{f.icon}</div>
                  <h3 style={{ fontFamily: G.font, fontSize: "16px", fontWeight: 700, color: G.text, marginBottom: "8px" }}>{f.title}</h3>
                  <p style={{ fontSize: "14px", color: G.muted, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rights */}
          <section id="rights" className="priv-section">
            <SectionLabel text="10 · Your Rights" />
            <h2 style={h2Style}>User Rights & Controls</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px" }}>
              {[
                ["📋", "Access", "Request a copy of your stored personal data"],
                ["✏️", "Correct", "Fix any inaccurate information"],
                ["🗑️", "Delete", "Request deletion of your account data"],
                ["📦", "Portability", "Export your data in a readable format"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{
                  padding: "16px", borderRadius: "10px",
                  background: G.surface, border: `1px solid ${G.border}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                  <div style={{ fontFamily: G.font, fontSize: "14px", fontWeight: 700, color: G.gold, marginBottom: "4px" }}>{title}</div>
                  <div style={{ fontSize: "12px", color: G.muted, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
            <p style={{ ...pStyle, marginTop: "16px" }}>Submit requests via our support contact below.</p>
          </section>

          {/* Cookies */}
          <section id="cookies" className="priv-section">
            <SectionLabel text="11 · Cookies" />
            <h2 style={h2Style}>Cookies & Tracking</h2>
            <p style={pStyle}>
              ManifiX uses cookies and similar technologies to maintain login sessions, improve performance,
              and analyze how users interact with the platform. Users may control cookies through browser settings.
            </p>
          </section>

          {/* Payments */}
          <section id="payments" className="priv-section">
            <SectionLabel text="12 · Payments" />
            <h2 style={h2Style}>Billing & Payments</h2>
            <p style={pStyle}>
              Subscription payments are processed through Razorpay, a trusted third-party payment provider.
              ManifiX does not store sensitive financial information such as credit card numbers. All transactions
              are encrypted and compliant with payment security standards.
            </p>
          </section>

          {/* Children */}
          <section id="children" className="priv-section">
            <SectionLabel text="13 · Children" />
            <h2 style={h2Style}>Family Safety</h2>
            <p style={pStyle}>
              ManifiX services are intended for users aged 13 and above. We prioritize responsible design
              practices and privacy protections for all users, especially younger members of our community.
            </p>
          </section>

          {/* Updates */}
          <section id="updates" className="priv-section">
            <SectionLabel text="14 · Updates" />
            <h2 style={h2Style}>Policy Changes</h2>
            <p style={pStyle}>
              We may update this Privacy Policy periodically. When significant updates occur, users will
              be notified through the platform or email. Continued use of ManifiX after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="priv-section">
            <SectionLabel text="15 · Contact" />
            <h2 style={h2Style}>Get in Touch</h2>
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
                ManifiX AI · Data Protection
              </div>
              {[
                ["Email", "manifixofficial@gmail.com"],
                ["Website", "https://manifixai.com"],
                ["© Copyright", "2025 ManifiX AI. All rights reserved."],
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
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function InfoCard({ text }) {
  return (
    <div style={{
      marginTop: "16px", padding: "14px 18px",
      background: "rgba(212,175,55,0.06)",
      border: "1px solid rgba(212,175,55,0.22)",
      borderRadius: "10px",
      borderLeft: "3px solid #D4AF37",
      fontSize: "13px", color: "rgba(238,238,244,0.65)", lineHeight: 1.65,
    }}>
      {text}
    </div>
  );
}
