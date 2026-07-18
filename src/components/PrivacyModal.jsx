import React, { useState, useEffect } from "react";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const G = {
  green:      "#34D399",
  greenLight: "#8FF0C4",
  greenDeep:  "#0F9D58",
  greenDim:   "rgba(52,211,153,0.10)",
  greenGlow:  "rgba(52,211,153,0.25)",
  bg:         "#060907",
  surface:    "#0B0F0D",
  surface2:   "#101512",
  border:     "rgba(52,211,153,0.14)",
  borderMid:  "rgba(52,211,153,0.28)",
  text:       "#F4F7F5",
  muted:      "rgba(244,247,245,0.55)",
  dim:        "rgba(244,247,245,0.20)",
  font:       "'Rajdhani', sans-serif",
  body:       "'Inter', sans-serif",
  mono:       "'JetBrains Mono', monospace",
};

const SECTIONS = [
  { id: "overview",     label: "Overview",            num: "01" },
  { id: "definitions",  label: "Definitions",         num: "02" },
  { id: "data",         label: "Data Collected",      num: "03" },
  { id: "usage",        label: "How We Use It",       num: "04" },
  { id: "sharing",      label: "Sharing",             num: "05" },
  { id: "retention",    label: "Data Retention",      num: "06" },
  { id: "transfer",     label: "Data Transfer",       num: "07" },
  { id: "deletion",     label: "Delete Your Data",    num: "08" },
  { id: "disclosure",   label: "Disclosure",          num: "09" },
  { id: "security",     label: "Security",            num: "10" },
  { id: "tracking",     label: "Tracking & SDKs",     num: "11" },
  { id: "children",     label: "Children's Privacy",  num: "12" },
  { id: "links",        label: "Third-Party Links",   num: "13" },
  { id: "updates",      label: "Policy Updates",      num: "14" },
  { id: "contact",      label: "Contact",             num: "15" },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.body}; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 3px; }

  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .green-shimmer {
    background: linear-gradient(90deg, ${G.green}, ${G.greenLight}, #ffffff, ${G.greenLight}, ${G.green});
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  .priv-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px;
    font-family: ${G.mono};
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: ${G.muted};
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.2s ease;
    border-radius: 0 5px 5px 0;
  }
  .priv-nav-link:hover {
    color: ${G.greenLight};
    border-left-color: ${G.green};
    background: ${G.greenDim};
  }
  .priv-nav-link.active {
    color: ${G.green};
    border-left-color: ${G.green};
    background: ${G.greenDim};
  }
  .priv-nav-link .num {
    font-size: 9px;
    opacity: 0.45;
    min-width: 18px;
  }

  .priv-section {
    padding: 48px 0;
    border-bottom: 1px solid ${G.border};
    animation: fadeUp 0.5s ease both;
  }
  .priv-section:last-child { border-bottom: none; }

  .data-row {
    display: flex;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-size: 14.5px;
    color: ${G.muted};
    line-height: 1.7;
  }
  .data-row:last-child { border-bottom: none; }
  .data-label {
    font-family: ${G.mono};
    font-size: 10px;
    color: ${G.green};
    min-width: 140px;
    padding-top: 3px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .bullet-item {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    font-size: 14.5px;
    color: ${G.muted};
    line-height: 1.7;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .bullet-item:last-child { border-bottom: none; }
  .bullet-dot {
    color: ${G.green};
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 12px;
  }

  @media (max-width: 920px) {
    .priv-layout { flex-direction: column !important; }
    .priv-sidebar {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 4px !important;
      padding: 16px 20px !important;
      border-right: none !important;
      border-bottom: 1px solid ${G.border} !important;
    }
    .priv-sidebar .priv-nav-link {
      border: 1px solid ${G.border} !important;
      border-left: 2px solid transparent !important;
      border-radius: 6px !important;
      padding: 5px 12px !important;
    }
    .priv-sidebar .priv-nav-link.active {
      border-color: ${G.greenGlow} !important;
      border-left-color: ${G.green} !important;
    }
    .priv-main { padding: 32px 20px 60px !important; }
  }
`;

// ── Logo ───────────────────────────────────────────────────────────────────────
const VeggeGoLogo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="url(#pvLG)" />
    <path d="M8 8L16 24L24 8" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="26" cy="7" r="3" fill={G.green} />
    <defs>
      <linearGradient id="pvLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#141a17" />
        <stop offset="100%" stopColor="#04060a" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
function SectionLabel({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <span style={{ fontFamily: G.mono, fontSize: "9px", color: G.green, letterSpacing: "0.2em", opacity: 0.6 }}>{num}</span>
      <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.green, letterSpacing: "0.16em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

function InfoCard({ children }) {
  return (
    <div style={{
      marginTop: "16px", padding: "16px 20px",
      background: "rgba(52,211,153,0.06)",
      border: `1px solid ${G.borderMid}`,
      borderLeft: `3px solid ${G.green}`,
      borderRadius: "0 10px 10px 0",
      fontSize: "13.5px", color: "rgba(244,247,245,0.68)", lineHeight: 1.7,
    }}>
      {children}
    </div>
  );
}

function SubHead({ children }) {
  return (
    <h3 style={{
      fontFamily: G.font, fontSize: "18px", fontWeight: 600,
      color: G.greenLight, marginTop: "24px", marginBottom: "10px",
      letterSpacing: "0.02em",
    }}>
      {children}
    </h3>
  );
}

function Para({ children, mt = 0 }) {
  return (
    <p style={{
      fontSize: "15px", color: G.muted, lineHeight: 1.8,
      marginTop: mt ? `${mt}px` : undefined,
    }}>
      {children}
    </p>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ listStyle: "none", marginTop: "12px" }}>
      {items.map((item, i) => (
        <li key={i} className="bullet-item">
          <span className="bullet-dot">◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Privacy() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const id = "veggego-priv-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-25% 0px -60% 0px" }
    );
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: G.bg, minHeight: "100vh" }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "58px",
        background: "rgba(6,9,7,0.94)",
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${G.border}`,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <VeggeGoLogo size={26} />
          <span style={{ fontFamily: G.font, fontWeight: 700, fontSize: "19px", color: G.green, letterSpacing: "0.12em" }}>
            VEGGE GO
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <a href="/terms" style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.09em" }}>
            Terms
          </a>
          <a href="/support" style={{
            fontFamily: G.mono, fontSize: "10px", color: G.green,
            textDecoration: "none", letterSpacing: "0.09em",
            padding: "6px 18px",
            border: `1px solid rgba(52,211,153,0.35)`,
            borderRadius: "6px",
            background: "rgba(52,211,153,0.06)",
          }}>
            Support →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{
        padding: "64px 32px 48px",
        borderBottom: `1px solid ${G.border}`,
        background: `linear-gradient(180deg, rgba(52,211,153,0.06) 0%, transparent 100%)`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", bottom: 0, left: "15%", right: "15%", height: "1px",
          background: `linear-gradient(90deg, transparent, ${G.green}, transparent)`,
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 18px", borderRadius: "20px",
          background: G.greenDim, border: `1px solid ${G.border}`,
          fontFamily: G.mono, fontSize: "9px", color: G.green,
          letterSpacing: "0.18em", marginBottom: "22px",
        }}>
          🔒 LAST UPDATED · JULY 17, 2026
        </div>

        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(38px, 6vw, 64px)",
          color: "#FFFFFF", letterSpacing: "0em", marginBottom: "14px",
          lineHeight: 1.05,
        }}>
          Privacy <span className="green-shimmer">Policy</span>
        </h1>

        <p style={{
          fontSize: "15.5px", color: G.muted,
          maxWidth: "560px", margin: "0 auto 24px",
          lineHeight: 1.7,
        }}>
          Vegge Go is a mobile &amp; VR AR game developed by Manifix AI Studio. This policy explains
          exactly what data we collect when you play — from sign-in to camera-based AR features — and
          how we protect it.
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "12px 24px",
          background: "rgba(52,211,153,0.08)",
          border: `1px solid rgba(52,211,153,0.32)`,
          borderRadius: "10px",
          fontFamily: G.mono, fontSize: "11px", color: G.green, letterSpacing: "0.09em",
        }}>
          🛡️&nbsp;&nbsp;We NEVER sell your personal data · Ever.
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <div className="priv-layout" style={{ display: "flex", maxWidth: "1220px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── SIDEBAR ── */}
        <aside className="priv-sidebar" style={{
          width: "230px", flexShrink: 0,
          position: "sticky", top: "58px",
          height: "calc(100vh - 58px)", overflowY: "auto",
          padding: "28px 0",
          borderRight: `1px solid ${G.border}`,
        }}>
          <div style={{
            fontFamily: G.mono, fontSize: "8.5px", color: G.dim,
            letterSpacing: "0.22em", padding: "0 14px 14px",
            textTransform: "uppercase",
          }}>
            Table of Contents
          </div>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`priv-nav-link${active === s.id ? " active" : ""}`}
            >
              <span className="num">{s.num}</span>
              {s.label}
            </a>
          ))}
        </aside>

        {/* ── MAIN ── */}
        <main className="priv-main" style={{ flex: 1, padding: "44px 0 80px 52px", maxWidth: "800px" }}>

          {/* 01 · Overview */}
          <section id="overview" className="priv-section">
            <SectionLabel num="01" text="Overview" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px", letterSpacing: "0.01em" }}>
              Introduction
            </h2>
            <Para>
              This Privacy Policy describes the policies and procedures of <strong style={{ color: "#fff" }}>Manifix AI Studio</strong> on
              the collection, use, and disclosure of your information when you play <strong style={{ color: "#fff" }}>Vegge Go</strong>,
              our mobile and VR augmented-reality game, and tells you about your privacy rights and how the law protects you.
            </Para>
            <Para mt={14}>
              We use your Personal Data to provide, secure, and improve the game — including sign-in, anti-cheat protection,
              AR features, and in-game purchases. By downloading or playing Vegge Go, you agree to the collection and use of
              information in accordance with this Privacy Policy.
            </Para>
            <InfoCard>
              <strong>Studio:</strong> Manifix AI Studio, Indira Nagar, Kancharapalem, Near Urvasi Junction,
              Visakhapatnam, Andhra Pradesh – 530008, India.<br /><br />
              <strong>Website:</strong> <a href="http://www.manifixai.com" style={{ color: G.green }}>www.manifixai.com</a><br /><br />
              Vegge Go is distributed on Google Play and complies with the Google Play Developer Program Policies,
              including requirements around data safety disclosures, permissions, and user consent.
            </InfoCard>
          </section>

          {/* 02 · Definitions */}
          <section id="definitions" className="priv-section">
            <SectionLabel num="02" text="Definitions" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Interpretation &amp; Definitions
            </h2>
            <Para>
              Words with initial capital letters have meanings defined below. The following definitions apply regardless of
              whether they appear in singular or plural form.
            </Para>
            <div style={{ marginTop: "20px" }}>
              {[
                ["Account", "The player profile created when You sign in to Vegge Go via Google OAuth, used to access the Service."],
                ["Anti-Cheat System", "The mechanisms we use to detect and prevent cheating, exploitation, or unauthorized modification of the game, including Device UUID logging."],
                ["Company / Studio", "Manifix AI Studio, Andhra Pradesh, India — the developer and publisher of Vegge Go."],
                ["Country", "Andhra Pradesh, India"],
                ["Device", "Any smartphone, headset, tablet, or other hardware used to access and play Vegge Go, including VR/AR-capable devices."],
                ["Device UUID", "A unique identifier assigned to your Device, used to enforce fair play and secure your Account."],
                ["Personal Data", "Any information that relates to an identified or identifiable individual. We use \"Personal Data\" and \"Personal Information\" interchangeably unless a law uses a specific term."],
                ["Service", "The Vegge Go mobile and VR game, related AR features, and any associated services accessible from www.manifixai.com."],
                ["Service Provider", "Any natural or legal person who processes data on behalf of the Studio, such as Google, Google Gemini, and Razorpay."],
                ["Usage Data", "Data collected automatically from your use of the Service (e.g., gameplay sessions, in-game events, duration of play)."],
                ["You", "The individual playing or accessing Vegge Go, or the legal entity on whose behalf such individual is acting."],
              ].map(([label, desc]) => (
                <div key={label} className="data-row">
                  <span className="data-label">{label}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 03 · Data Collected */}
          <section id="data" className="priv-section">
            <SectionLabel num="03" text="Data Collected" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Types of Data We Collect
            </h2>

            <SubHead>Personal Data</SubHead>
            <Para>
              When you sign in to Vegge Go using <strong style={{ color: "#fff" }}>Google OAuth</strong>, we receive certain
              personally identifiable information from your Google Account, which may include:
            </Para>
            <BulletList items={[
              "Your name and email address",
              "Your Google Account profile photo (used as your in-game avatar)",
              "A unique Google Account identifier used to create and secure your Vegge Go Account",
            ]} />

            <SubHead>Device UUID &amp; Anti-Cheat Data</SubHead>
            <Para>
              To keep gameplay fair, we log a unique Device UUID (device identifier) each time you play. This is used solely
              to detect cheating, multi-accounting, exploits, and unauthorized modification of the game client, and to
              enforce bans or restrictions where our anti-cheat systems detect abuse.
            </Para>

            <SubHead>Camera &amp; AR Data</SubHead>
            <Para>
              Vegge Go uses your Device&apos;s camera to power its augmented-reality (AR) features, overlaying in-game objects
              onto your real-world surroundings. Camera access is requested only with your explicit permission and is used
              locally to render AR gameplay. We do not record, store, or transmit your camera feed to our servers unless you
              explicitly choose to capture and share an in-game screenshot or clip.
            </Para>

            <SubHead>Usage Data</SubHead>
            <Para>
              Usage Data is collected automatically as you play. It may include your Device&apos;s IP address, device model and
              operating system, VR/AR headset type (where applicable), in-game progress and achievements, session length,
              crash and diagnostic logs, and other gameplay analytics.
            </Para>
          </section>

          {/* 04 · Usage */}
          <section id="usage" className="priv-section">
            <SectionLabel num="04" text="How We Use It" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Use of Your Personal Data
            </h2>
            <Para>The Studio may use your Personal Data for the following purposes:</Para>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "18px" }}>
              {[
                ["🎮", "Provide, maintain, and operate Vegge Go, including syncing your progress across sessions"],
                ["🔐", "Authenticate you and manage your Account via Google OAuth"],
                ["🛡️", "Run anti-cheat checks using your Device UUID to keep gameplay fair for all players"],
                ["📷", "Power camera-based AR features so in-game objects appear in your real environment"],
                ["🤖", "Power AI-driven in-game features (e.g., dynamic content, hints, chat) using the Google Gemini API"],
                ["💳", "Process in-game purchases and subscriptions securely via Razorpay"],
                ["📬", "Contact you about updates, security alerts, or support requests"],
                ["📊", "Analyze gameplay trends to balance, fix, and improve the game"],
              ].map(([icon, text], i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "13px 15px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: "9px",
                  fontSize: "13px", color: G.muted, lineHeight: 1.6,
                }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </section>

          {/* 05 · Sharing */}
          <section id="sharing" className="priv-section">
            <SectionLabel num="05" text="Sharing" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              When We Share Your Information
            </h2>
            <Para>
              We share Personal Data only with the following categories of Service Providers, and only as needed to run
              Vegge Go:
            </Para>
            <div style={{ marginTop: "16px" }}>
              {[
                ["Google (OAuth)", "Used to authenticate your sign-in and identify your Account. Governed by Google's own Privacy Policy."],
                ["Google Gemini API", "Processes limited gameplay inputs to power AI-driven features such as in-game hints, dynamic content, or chat. We do not send unnecessary Personal Data to this API."],
                ["Razorpay", "Our third-party payment processor, used to securely handle in-game purchases and subscriptions. We do not store your full payment card details on our servers."],
                ["Analytics & Crash Reporting Providers", "Help us diagnose crashes and understand gameplay trends, using de-identified or aggregated data where possible."],
                ["Business Transfers", "In connection with any merger, sale of Studio assets, financing, or acquisition of all or a portion of our business."],
                ["With Your Consent", "We may disclose your Personal Data for any other purpose with your explicit consent."],
              ].map(([label, desc]) => (
                <div key={label} className="data-row">
                  <span className="data-label">{label}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <InfoCard>
              Vegge Go does <strong>not sell or rent</strong> your personal data to third parties for their own marketing purposes.
            </InfoCard>
          </section>

          {/* 06 · Retention */}
          <section id="retention" className="priv-section">
            <SectionLabel num="06" text="Data Retention" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Retention of Your Personal Data
            </h2>
            <Para>
              The Studio will retain your Personal Data only for as long as necessary for the purposes described in this
              Privacy Policy, and to comply with legal obligations, resolve disputes, prevent cheating, and enforce our
              agreements.
            </Para>
            <Para mt={12}>
              Where possible, we apply shorter retention periods and/or reduce identifiability by deleting, aggregating, or
              anonymizing data.
            </Para>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                ["Account Information", "Duration of account relationship + up to 24 months after account closure."],
                ["Device UUID / Anti-Cheat Logs", "Up to 24 months, or longer if tied to an active ban or investigation."],
                ["Purchase & Transaction Records", "Retained as required by applicable tax and financial regulations."],
                ["Support Tickets & Correspondence", "Up to 24 months from ticket closure."],
                ["Gameplay Analytics & Server Logs", "Up to 24 months from date of collection."],
              ].map(([label, period]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "14px 18px", gap: "20px",
                  background: G.surface, border: `1px solid ${G.border}`,
                  borderRadius: "9px",
                }}>
                  <span style={{ fontSize: "13.5px", color: "#fff", fontWeight: 500 }}>{label}</span>
                  <span style={{ fontFamily: G.mono, fontSize: "11px", color: G.green, whiteSpace: "nowrap" }}>{period}</span>
                </div>
              ))}
            </div>

            <SubHead>When Retention Periods Expire</SubHead>
            <BulletList items={[
              "Deletion — Personal Data is removed from our systems and no longer actively processed.",
              "Backup retention — Residual copies may remain in encrypted backups for a limited period and are not restored except for security, disaster recovery, or legal compliance.",
              "Anonymization — In some cases, Personal Data is converted into anonymous statistical data that cannot be linked back to you. This anonymized data may be retained indefinitely for research and analytics.",
            ]} />
          </section>

          {/* 07 · Transfer */}
          <section id="transfer" className="priv-section">
            <SectionLabel num="07" text="Data Transfer" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Transfer of Your Personal Data
            </h2>
            <Para>
              Your information, including Personal Data, is processed at the Studio&apos;s operating offices and by the
              third-party infrastructure we rely on (including Google Cloud services used for OAuth and the Gemini API, and
              Razorpay for payments). This means your information may be transferred to — and maintained on — computers
              located outside of your state, province, country, or other governmental jurisdiction where data protection
              laws may differ.
            </Para>
            <Para mt={14}>
              Where required by applicable law, we will ensure that international transfers of your Personal Data are subject
              to appropriate safeguards. The Studio will take all steps reasonably necessary to ensure your data is treated
              securely, and no transfer of your Personal Data will take place to an organization or country unless adequate
              security controls are in place.
            </Para>
          </section>

          {/* 08 · Deletion */}
          <section id="deletion" className="priv-section">
            <SectionLabel num="08" text="Delete Your Data" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Delete Your Personal Data
            </h2>
            <Para>
              You have the right to delete or request that we assist in deleting the Personal Data we have collected about
              you, including your Account, Device UUID logs, and purchase history (subject to legal retention requirements).
            </Para>
            <Para mt={12}>
              To request deletion, email us at <strong style={{ color: "#fff" }}>manifixofficial@gmail.com</strong> from the
              address linked to your Vegge Go Account, with the subject line &quot;Data Deletion Request.&quot; We will verify your
              identity and confirm once your data has been deleted or anonymized.
            </Para>
            <InfoCard>
              Please note that we may need to retain certain information — such as anti-cheat logs tied to an active
              investigation or transaction records required for tax purposes — where we have a legal obligation or lawful
              basis to do so.
            </InfoCard>
          </section>

          {/* 09 · Disclosure */}
          <section id="disclosure" className="priv-section">
            <SectionLabel num="09" text="Disclosure" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Disclosure of Your Personal Data
            </h2>

            <SubHead>Business Transactions</SubHead>
            <Para>
              If the Studio is involved in a merger, acquisition, or asset sale, your Personal Data may be transferred.
              We will provide notice before your Personal Data is transferred and becomes subject to a different Privacy
              Policy.
            </Para>

            <SubHead>Law Enforcement</SubHead>
            <Para>
              Under certain circumstances, the Studio may be required to disclose your Personal Data if required to do so by
              law or in response to valid requests by public authorities (e.g., a court or government agency).
            </Para>

            <SubHead>Google Play Compliance</SubHead>
            <Para>
              As a title distributed on Google Play, Vegge Go's data collection, permissions, and disclosures are designed to
              meet the requirements of the Google Play Developer Program Policies, including the Data Safety section shown
              on our store listing.
            </Para>

            <SubHead>Other Legal Requirements</SubHead>
            <Para>The Studio may disclose your Personal Data in the good faith belief that such action is necessary to:</Para>
            <BulletList items={[
              "Comply with a legal obligation",
              "Protect and defend the rights or property of the Studio",
              "Prevent or investigate cheating, fraud, or possible wrongdoing in connection with the Service",
              "Protect the personal safety of players or the public",
              "Protect against legal liability",
            ]} />
          </section>

          {/* 10 · Security */}
          <section id="security" className="priv-section">
            <SectionLabel num="10" text="Security" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Security of Your Personal Data
            </h2>
            <Para>
              The security of your Personal Data is important to us. We use commercially reasonable means to protect it,
              including encrypted HTTPS transmission, secure cloud infrastructure, role-based access controls, encrypted
              payment processing through Razorpay, and continuous monitoring for suspicious or cheating-related activity.
            </Para>
            <InfoCard>
              However, no method of transmission over the Internet or method of electronic storage is 100% secure.
              While we strive to protect your Personal Data, we cannot guarantee its absolute security.
            </InfoCard>

            <SubHead>Database &amp; Infrastructure Availability</SubHead>
            <Para>
              Because our infrastructure operates on an isolated cloud system, Manifix AI Studio offers this service on an
              &quot;As-Is&quot; and &quot;As-Available&quot; baseline model. We assume no legal or financial liability for sudden database
              packet drops, account data corruption, loss of game scores, or temporary server outages inside our MongoDB
              Atlas or Render network clusters. The full limitation of liability for data loss is set out in our{" "}
              <a href="/terms#liability" style={{ color: G.green, textDecoration: "none" }}>Terms and Conditions</a>.
            </Para>
          </section>

          {/* 11 · Tracking & SDKs */}
          <section id="tracking" className="priv-section">
            <SectionLabel num="11" text="Tracking & SDKs" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Tracking Technologies &amp; Third-Party SDKs
            </h2>
            <Para>
              Vegge Go uses a small set of software development kits (SDKs) and similar technologies to operate core
              features of the game. These may store identifiers on your Device to keep you signed in, remember your
              preferences, and detect abuse.
            </Para>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  type: "Google OAuth SDK",
                  kind: "Essential · Administered by Google",
                  desc: "Handles sign-in and keeps you authenticated between sessions. Required to create and access your Account.",
                },
                {
                  type: "Anti-Cheat / Device UUID Logging",
                  kind: "Essential · Administered by Us",
                  desc: "Identifies your Device to detect exploits, multi-accounting, and unauthorized modification of the game client.",
                },
                {
                  type: "Razorpay Payment SDK",
                  kind: "Essential for Purchases · Administered by Razorpay",
                  desc: "Processes in-game purchases and subscriptions. We never see or store your full card or bank details.",
                },
                {
                  type: "Analytics & Crash Reporting",
                  kind: "Functional · Administered by Us & Providers",
                  desc: "Helps us understand gameplay patterns, fix bugs, and balance the game. Data is aggregated where possible.",
                },
              ].map(c => (
                <div key={c.type} style={{
                  padding: "16px 20px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: "10px",
                }}>
                  <div style={{ fontFamily: G.font, fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{c.type}</div>
                  <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.green, letterSpacing: "0.07em", marginBottom: "8px" }}>{c.kind}</div>
                  <div style={{ fontSize: "13.5px", color: G.muted, lineHeight: 1.65 }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <Para mt={16}>
              Some of these technologies are essential to gameplay, sign-in, and anti-cheat, and cannot be disabled without
              affecting your ability to play. Where non-essential tracking is used, we request it only with your consent,
              which you can withdraw at any time through your Device or Account settings.
            </Para>
          </section>

          {/* 12 · Children */}
          <section id="children" className="priv-section">
            <SectionLabel num="12" text="Children's Privacy" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Children&apos;s Privacy
            </h2>
            <Para>
              Vegge Go is not directed at children under the age of 13, and we do not knowingly collect personally
              identifiable information from anyone under 13, consistent with the Google Play Developer Program Policies and
              applicable children's privacy laws.
            </Para>
            <Para mt={12}>
              If you are a parent or guardian and believe your child has provided us with Personal Data, please contact us.
              If we become aware that we have collected Personal Data from a child under 13 without verified parental
              consent, we take steps to remove that information from our servers.
            </Para>
            <InfoCard>
              If we need to rely on consent as a legal basis for processing your information and your country requires
              consent from a parent, we may require your parent&apos;s consent before we collect and use that information.
            </InfoCard>
          </section>

          {/* 13 · Links */}
          <section id="links" className="priv-section">
            <SectionLabel num="13" text="Third-Party Links" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Links to Other Websites &amp; Services
            </h2>
            <Para>
              Vegge Go may contain links to other websites or services (such as our social channels, or Google Play itself)
              that are not operated by us. If you tap on a third-party link, you will be directed to that party&apos;s site or
              app. We strongly advise you to review the Privacy Policy of every service you visit.
            </Para>
            <Para mt={12}>
              We have no control over and assume no responsibility for the content, privacy policies, or practices of any
              third-party sites or services, including Google and Razorpay, whose own privacy policies govern their handling
              of your data.
            </Para>
          </section>

          {/* 14 · Updates */}
          <section id="updates" className="priv-section">
            <SectionLabel num="14" text="Policy Updates" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Changes to This Privacy Policy
            </h2>
            <Para>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and, where the changes are material, via an in-game notice and/or email prior to
              the change becoming effective. The &quot;Last updated&quot; date at the top of this page will also be updated.
            </Para>
            <Para mt={12}>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are
              effective when they are posted on this page.
            </Para>
          </section>

          {/* 15 · Contact */}
          <section id="contact" className="priv-section">
            <SectionLabel num="15" text="Contact" />
            <h2 style={{ fontFamily: G.font, fontSize: "29px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Contact Us
            </h2>
            <Para>
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us:
            </Para>

            <div style={{
              marginTop: "22px", padding: "28px 30px",
              background: G.surface,
              border: `1px solid ${G.borderMid}`,
              borderRadius: "14px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: "8%", right: "8%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${G.green}, transparent)`,
              }} />

              <div style={{
                fontFamily: G.font, fontSize: "21px", fontWeight: 700,
                color: "#fff", marginBottom: "20px", letterSpacing: "0.03em",
              }}>
                Vegge Go · Data Protection
              </div>

              {[
                ["Studio",   "Manifix AI Studio"],
                ["Game",     "Vegge Go (Mobile & VR AR Game)"],
                ["Address",  "Visakhapatnam, Andhra Pradesh, India"],
                ["Email",    "manifixofficial@gmail.com"],
                ["Website",  "www.manifixai.com"],
                ["© Copyright", "2025–2026 Manifix AI Studio. All rights reserved."],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", gap: "18px", padding: "11px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
                }}>
                  <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.green, minWidth: "96px", paddingTop: "2px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "14px", color: G.muted, lineHeight: 1.6 }}>{val}</span>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${G.border}`,
        padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "12px",
        background: "rgba(6,9,7,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <VeggeGoLogo size={22} />
          <span style={{ fontFamily: G.font, fontSize: "16px", color: G.muted, letterSpacing: "0.08em" }}>
            VEGGE GO
          </span>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.08em" }}>
          © 2025–2026 Manifix AI Studio · All rights reserved · Visakhapatnam, India
        </div>
        <div style={{ display: "flex", gap: "18px" }}>
          {[["Privacy Policy", "#overview"], ["Terms of Service", "/terms"], ["Contact", "#contact"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.06em" }}>
              {label}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
