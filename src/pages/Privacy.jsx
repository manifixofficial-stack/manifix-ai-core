import React, { useState, useEffect, useRef } from "react";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const G = {
  gold:      "#C9A84C",
  goldLight: "#E8C97A",
  goldDim:   "rgba(201,168,76,0.10)",
  goldGlow:  "rgba(201,168,76,0.25)",
  bg:        "#07070E",
  surface:   "#0C0C18",
  surface2:  "#101020",
  border:    "rgba(201,168,76,0.12)",
  borderMid: "rgba(201,168,76,0.22)",
  text:      "#EAEAF2",
  muted:     "rgba(234,234,242,0.52)",
  dim:       "rgba(234,234,242,0.20)",
  font:      "'Cormorant Garamond', serif",
  body:      "'Plus Jakarta Sans', sans-serif",
  mono:      "'IBM Plex Mono', monospace",
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
  { id: "cookies",      label: "Cookies",             num: "11" },
  { id: "children",     label: "Children's Privacy",  num: "12" },
  { id: "links",        label: "Third-Party Links",   num: "13" },
  { id: "updates",      label: "Policy Updates",      num: "14" },
  { id: "contact",      label: "Contact",             num: "15" },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

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

  .gold-shimmer {
    background: linear-gradient(90deg, ${G.gold}, ${G.goldLight}, #A07828, ${G.goldLight}, ${G.gold});
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
    color: ${G.goldLight};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
  }
  .priv-nav-link.active {
    color: ${G.gold};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
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
    border-bottom: 1px solid rgba(255,255,255,0.035);
    font-size: 14.5px;
    color: ${G.muted};
    line-height: 1.7;
  }
  .data-row:last-child { border-bottom: none; }
  .data-label {
    font-family: ${G.mono};
    font-size: 10px;
    color: ${G.gold};
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
    border-bottom: 1px solid rgba(255,255,255,0.035);
  }
  .bullet-item:last-child { border-bottom: none; }
  .bullet-dot {
    color: ${G.gold};
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
      border-color: ${G.goldGlow} !important;
      border-left-color: ${G.gold} !important;
    }
    .priv-main { padding: 32px 20px 60px !important; }
  }
`;

// ── Logo ───────────────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="url(#pvLG)" />
    <path d="M5 25V9L11.5 9L16 17.5L20.5 9L27 9V25H22.5V15.5L16 25.5L9.5 15.5V25Z" fill="#fff" />
    <circle cx="26" cy="8" r="3" fill={G.gold} />
    <defs>
      <linearGradient id="pvLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a30" />
        <stop offset="100%" stopColor="#0a0a16" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
function SectionLabel({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <span style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.2em", opacity: 0.6 }}>{num}</span>
      <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.16em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

function InfoCard({ children }) {
  return (
    <div style={{
      marginTop: "16px", padding: "16px 20px",
      background: "rgba(201,168,76,0.05)",
      border: `1px solid ${G.borderMid}`,
      borderLeft: `3px solid ${G.gold}`,
      borderRadius: "0 10px 10px 0",
      fontSize: "13.5px", color: "rgba(234,234,242,0.65)", lineHeight: 1.7,
    }}>
      {children}
    </div>
  );
}

function SubHead({ children }) {
  return (
    <h3 style={{
      fontFamily: G.font, fontSize: "17px", fontWeight: 600,
      color: G.goldLight, marginTop: "24px", marginBottom: "10px",
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
    const id = "manifix-priv-css";
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

      {/* ── GLOBAL STYLES ── */}

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "58px",
        background: "rgba(7,7,14,0.94)",
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${G.border}`,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <ManifixLogo size={26} />
          <span style={{ fontFamily: G.font, fontWeight: 700, fontSize: "18px", color: G.gold, letterSpacing: "0.12em" }}>
            MANIFIX AI
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <a href="/terms" style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.09em" }}>
            Terms
          </a>
          <a href="/login" style={{
            fontFamily: G.mono, fontSize: "10px", color: G.gold,
            textDecoration: "none", letterSpacing: "0.09em",
            padding: "6px 18px",
            border: `1px solid rgba(201,168,76,0.30)`,
            borderRadius: "6px",
            background: "rgba(201,168,76,0.05)",
          }}>
            Login →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{
        padding: "64px 32px 48px",
        borderBottom: `1px solid ${G.border}`,
        background: `linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%)`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative line */}
        <div style={{
          position: "absolute", bottom: 0, left: "15%", right: "15%", height: "1px",
          background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 18px", borderRadius: "20px",
          background: G.goldDim, border: `1px solid ${G.border}`,
          fontFamily: G.mono, fontSize: "9px", color: G.gold,
          letterSpacing: "0.18em", marginBottom: "22px",
        }}>
          🔒 LAST UPDATED · MAY 21, 2026
        </div>

        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(38px, 6vw, 62px)",
          color: G.text, letterSpacing: "-0.01em", marginBottom: "14px",
          lineHeight: 1.1,
        }}>
          Privacy <span className="gold-shimmer">Policy</span>
        </h1>

        <p style={{
          fontSize: "15.5px", color: G.muted,
          maxWidth: "520px", margin: "0 auto 24px",
          lineHeight: 1.7,
        }}>
          ManifiX AI is committed to transparency. This policy describes exactly how
          we collect, use, and protect your personal data.
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "12px 24px",
          background: "rgba(201,168,76,0.07)",
          border: `1px solid rgba(201,168,76,0.28)`,
          borderRadius: "10px",
          fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.09em",
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
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px", letterSpacing: "0.01em" }}>
              Introduction
            </h2>
            <Para>
              This Privacy Policy describes the policies and procedures of <strong style={{ color: G.text }}>ManifixAI Private Limited</strong> on
              the collection, use, and disclosure of your information when you use our Service, and tells you about your
              privacy rights and how the law protects you.
            </Para>
            <Para mt={14}>
              We use your Personal Data to provide and improve the Service. By using the Service, you agree to the collection
              and use of information in accordance with this Privacy Policy.
            </Para>
            <InfoCard>
              <strong>Company:</strong> ManifixAI Private Limited, Indira Nagar, Kancharapalem, Near Urvasi Junction,
              Visakhapatnam, Andhra Pradesh – 530008, India.<br /><br />
              <strong>Website:</strong> <a href="http://www.manifixai.com" style={{ color: G.gold }}>www.manifixai.com</a>
            </InfoCard>
          </section>

          {/* 02 · Definitions */}
          <section id="definitions" className="priv-section">
            <SectionLabel num="02" text="Definitions" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Interpretation &amp; Definitions
            </h2>
            <Para>
              Words with initial capital letters have meanings defined below. The following definitions apply regardless of
              whether they appear in singular or plural form.
            </Para>
            <div style={{ marginTop: "20px" }}>
              {[
                ["Account", "A unique account created for You to access our Service or parts of our Service."],
                ["Affiliate", "An entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares or voting securities."],
                ["Company", "ManifixAI Private Limited, Indira Nagar, Kancharapalem, Near Urvasi Junction, Visakhapatnam, Andhra Pradesh 530008, India."],
                ["Cookies", "Small files placed on your device by a website, containing details of your browsing history and other information."],
                ["Country", "Andhra Pradesh, India"],
                ["Device", "Any device that can access the Service — computer, mobile phone, or digital tablet."],
                ["Personal Data", "Any information that relates to an identified or identifiable individual. We use "Personal Data" and "Personal Information" interchangeably unless a law uses a specific term."],
                ["Service", "The ManifiX AI website accessible from www.manifixai.com."],
                ["Service Provider", "Any natural or legal person who processes data on behalf of the Company to facilitate or improve the Service."],
                ["Usage Data", "Data collected automatically from the use of the Service or its infrastructure (e.g., duration of a page visit)."],
                ["You", "The individual accessing or using the Service, or the legal entity on whose behalf such individual is acting."],
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
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Types of Data We Collect
            </h2>

            <SubHead>Personal Data</SubHead>
            <Para>
              While using our Service, we may ask you to provide certain personally identifiable information that can be used
              to contact or identify you. This may include, but is not limited to:
            </Para>
            <BulletList items={[
              "Email address",
              "First name and last name",
              "Phone number",
              "Address, State, Province, ZIP/Postal code, City",
            ]} />

            <SubHead>Usage Data</SubHead>
            <Para>
              Usage Data is collected automatically when using the Service. It may include your device's IP address, browser
              type and version, the pages you visit, the time and date of your visit, time spent on pages, unique device
              identifiers, and other diagnostic data.
            </Para>
            <Para mt={12}>
              When you access the Service via a mobile device, we may also collect the type of mobile device, mobile device
              unique ID, IP address of your mobile device, mobile operating system, and mobile browser type.
            </Para>
          </section>

          {/* 04 · Usage */}
          <section id="usage" className="priv-section">
            <SectionLabel num="04" text="How We Use It" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Use of Your Personal Data
            </h2>
            <Para>The Company may use your Personal Data for the following purposes:</Para>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "18px" }}>
              {[
                ["🖥️", "Provide & maintain our Service, including monitoring usage"],
                ["👤", "Manage your Account and registration as a user"],
                ["📝", "Performance of a contract for products or services you've purchased"],
                ["📬", "Contact you via email, SMS, or push notifications for updates and security alerts"],
                ["📣", "Send news, special offers, and information about similar goods and services (opt-out available)"],
                ["🎫", "Manage your requests and support inquiries"],
                ["🔀", "Business transfers such as mergers, acquisitions, or asset sales"],
                ["📊", "Data analysis, usage trend identification, and service improvement"],
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
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              When We Share Your Information
            </h2>
            <Para>
              We may share your Personal Data in the following situations:
            </Para>
            <div style={{ marginTop: "16px" }}>
              {[
                ["With Service Providers", "To monitor and analyze use of our Service, and to contact you."],
                ["Business Transfers", "In connection with any merger, sale of Company assets, financing, or acquisition of all or a portion of our business."],
                ["With Affiliates", "We may share data with our affiliates, who are required to honor this Privacy Policy. Affiliates include our parent company, subsidiaries, and joint venture partners."],
                ["With Business Partners", "To offer you certain products, services, or promotions."],
                ["With Other Users", "When you share Personal Data in any public area of our Service, it may be viewed by all users and publicly distributed."],
                ["With Your Consent", "We may disclose your Personal Data for any other purpose with your explicit consent."],
              ].map(([label, desc]) => (
                <div key={label} className="data-row">
                  <span className="data-label">{label}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <InfoCard>
              ManifiX does <strong>not sell or rent</strong> your personal data to third parties for their own marketing purposes.
            </InfoCard>
          </section>

          {/* 06 · Retention */}
          <section id="retention" className="priv-section">
            <SectionLabel num="06" text="Data Retention" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Retention of Your Personal Data
            </h2>
            <Para>
              The Company will retain your Personal Data only for as long as necessary for the purposes described in this
              Privacy Policy, and to comply with legal obligations, resolve disputes, and enforce our agreements.
            </Para>
            <Para mt={12}>
              Where possible, we apply shorter retention periods and/or reduce identifiability by deleting, aggregating, or
              anonymizing data.
            </Para>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                ["Account Information", "Duration of account relationship + up to 24 months after account closure."],
                ["Support Tickets & Correspondence", "Up to 24 months from ticket closure."],
                ["Chat Transcripts", "Up to 24 months for quality assurance and staff training."],
                ["Website Analytics & Server Logs", "Up to 24 months from date of collection."],
              ].map(([label, period]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "14px 18px", gap: "20px",
                  background: G.surface, border: `1px solid ${G.border}`,
                  borderRadius: "9px",
                }}>
                  <span style={{ fontSize: "13.5px", color: G.text, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontFamily: G.mono, fontSize: "11px", color: G.gold, whiteSpace: "nowrap" }}>{period}</span>
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
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Transfer of Your Personal Data
            </h2>
            <Para>
              Your information, including Personal Data, is processed at the Company's operating offices and in any other
              places where the parties involved in the processing are located. This means your information may be transferred
              to — and maintained on — computers located outside of your state, province, country, or other governmental
              jurisdiction where data protection laws may differ.
            </Para>
            <Para mt={14}>
              Where required by applicable law, we will ensure that international transfers of your Personal Data are subject
              to appropriate safeguards. The Company will take all steps reasonably necessary to ensure your data is treated
              securely, and no transfer of your Personal Data will take place to an organization or country unless adequate
              security controls are in place.
            </Para>
          </section>

          {/* 08 · Deletion */}
          <section id="deletion" className="priv-section">
            <SectionLabel num="08" text="Delete Your Data" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Delete Your Personal Data
            </h2>
            <Para>
              You have the right to delete or request that we assist in deleting the Personal Data we have collected about you.
            </Para>
            <Para mt={12}>
              You may update, amend, or delete your information at any time by signing in to your Account and visiting the
              account settings section. You may also contact us directly to request access to, correction of, or deletion of
              any Personal Data you have provided.
            </Para>
            <InfoCard>
              Please note that we may need to retain certain information where we have a legal obligation or lawful basis to do so.
            </InfoCard>
          </section>

          {/* 09 · Disclosure */}
          <section id="disclosure" className="priv-section">
            <SectionLabel num="09" text="Disclosure" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Disclosure of Your Personal Data
            </h2>

            <SubHead>Business Transactions</SubHead>
            <Para>
              If the Company is involved in a merger, acquisition, or asset sale, your Personal Data may be transferred.
              We will provide notice before your Personal Data is transferred and becomes subject to a different Privacy Policy.
            </Para>

            <SubHead>Law Enforcement</SubHead>
            <Para>
              Under certain circumstances, the Company may be required to disclose your Personal Data if required to do so by
              law or in response to valid requests by public authorities (e.g., a court or government agency).
            </Para>

            <SubHead>Other Legal Requirements</SubHead>
            <Para>The Company may disclose your Personal Data in the good faith belief that such action is necessary to:</Para>
            <BulletList items={[
              "Comply with a legal obligation",
              "Protect and defend the rights or property of the Company",
              "Prevent or investigate possible wrongdoing in connection with the Service",
              "Protect the personal safety of users of the Service or the public",
              "Protect against legal liability",
            ]} />
          </section>

          {/* 10 · Security */}
          <section id="security" className="priv-section">
            <SectionLabel num="10" text="Security" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Security of Your Personal Data
            </h2>
            <Para>
              The security of your Personal Data is important to us. We use commercially reasonable means to protect your
              Personal Data, including encrypted HTTPS transmission, secure cloud infrastructure, role-based access controls,
              and security monitoring for suspicious activity.
            </Para>
            <InfoCard>
              However, no method of transmission over the Internet or method of electronic storage is 100% secure.
              While we strive to protect your Personal Data, we cannot guarantee its absolute security.
            </InfoCard>
          </section>

          {/* 11 · Cookies */}
          <section id="cookies" className="priv-section">
            <SectionLabel num="11" text="Cookies" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Tracking Technologies &amp; Cookies
            </h2>
            <Para>
              We use Cookies and similar tracking technologies (beacons, tags, scripts) to track activity on our Service and
              store certain information. Cookies can be "Persistent" (remain when you go offline) or "Session" (deleted when
              you close your browser).
            </Para>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  type: "Necessary / Essential Cookies",
                  kind: "Session Cookies · Administered by Us",
                  desc: "Essential to provide services available through the Website and to authenticate users. Cannot be disabled without affecting service functionality.",
                },
                {
                  type: "Cookie Policy / Notice Acceptance",
                  kind: "Persistent Cookies · Administered by Us",
                  desc: "Identify if users have accepted the use of cookies on the Website.",
                },
                {
                  type: "Functionality Cookies",
                  kind: "Persistent Cookies · Administered by Us",
                  desc: "Allow us to remember your choices (e.g., login details, language preference) for a more personalised experience.",
                },
              ].map(c => (
                <div key={c.type} style={{
                  padding: "16px 20px",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: "10px",
                }}>
                  <div style={{ fontFamily: G.font, fontSize: "15px", fontWeight: 600, color: G.text, marginBottom: "4px" }}>{c.type}</div>
                  <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.07em", marginBottom: "8px" }}>{c.kind}</div>
                  <div style={{ fontSize: "13.5px", color: G.muted, lineHeight: 1.65 }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <Para mt={16}>
              Where required by law, we use non-essential cookies only with your consent. You can withdraw or change your
              consent at any time through your browser/device settings. You can instruct your browser to refuse all cookies,
              though some parts of the Service may not function properly as a result.
            </Para>
          </section>

          {/* 12 · Children */}
          <section id="children" className="priv-section">
            <SectionLabel num="12" text="Children's Privacy" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Children's Privacy
            </h2>
            <Para>
              Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable
              information from anyone under the age of 16.
            </Para>
            <Para mt={12}>
              If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please
              contact us. If we become aware that we have collected Personal Data from anyone under the age of 16 without
              verification of parental consent, we take steps to remove that information from our servers.
            </Para>
            <InfoCard>
              If we need to rely on consent as a legal basis for processing your information and your country requires consent
              from a parent, we may require your parent's consent before we collect and use that information.
            </InfoCard>
          </section>

          {/* 13 · Links */}
          <section id="links" className="priv-section">
            <SectionLabel num="13" text="Third-Party Links" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Links to Other Websites
            </h2>
            <Para>
              Our Service may contain links to other websites that are not operated by us. If you click on a third-party
              link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of
              every site you visit.
            </Para>
            <Para mt={12}>
              We have no control over and assume no responsibility for the content, privacy policies, or practices of any
              third-party sites or services.
            </Para>
          </section>

          {/* 14 · Updates */}
          <section id="updates" className="priv-section">
            <SectionLabel num="14" text="Policy Updates" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
              Changes to This Privacy Policy
            </h2>
            <Para>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page, and will let you know via email and/or a prominent notice on our Service prior to
              the change becoming effective. The "Last updated" date at the top of this page will also be updated.
            </Para>
            <Para mt={12}>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are
              effective when they are posted on this page.
            </Para>
          </section>

          {/* 15 · Contact */}
          <section id="contact" className="priv-section">
            <SectionLabel num="15" text="Contact" />
            <h2 style={{ fontFamily: G.font, fontSize: "28px", fontWeight: 700, color: G.text, marginBottom: "16px" }}>
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
                background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
              }} />

              <div style={{
                fontFamily: G.font, fontSize: "20px", fontWeight: 700,
                color: G.text, marginBottom: "20px", letterSpacing: "0.03em",
              }}>
                ManifiX AI · Data Protection
              </div>

              {[
                ["Company",  "ManifixAI Private Limited"],
                ["Address",  "India"],
                ["Email",    "manifixofficial@gmail.com"],
                ["Website",  "www.manifixai.com"],
                ["Country",  "India"],
                ["© Copyright", "2025–2026 ManifiX AI. All rights reserved."],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", gap: "18px", padding: "11px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.042)`,
                }}>
                  <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, minWidth: "96px", paddingTop: "2px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
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
        background: "rgba(7,7,14,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ManifixLogo size={22} />
          <span style={{ fontFamily: G.font, fontSize: "15px", color: G.muted, letterSpacing: "0.08em" }}>
            MANIFIX AI
          </span>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.08em" }}>
          © 2025–2026 ManifixAI Private Limited · All rights reserved · Visakhapatnam, India
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
