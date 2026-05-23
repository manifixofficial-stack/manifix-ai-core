import React, { useState, useEffect } from "react";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const G = {
  gold:       "#C9A84C",
  goldLight:  "#E8C97A",
  goldDim:    "rgba(201,168,76,0.10)",
  goldGlow:   "rgba(201,168,76,0.25)",
  bg:         "#07070E",
  surface:    "#0C0C18",
  surface2:   "#101020",
  border:     "rgba(201,168,76,0.12)",
  borderMid:  "rgba(201,168,76,0.22)",
  text:       "#EAEAF2",
  muted:      "rgba(234,234,242,0.52)",
  dim:        "rgba(234,234,242,0.20)",
  red:        "#f87171",
  redDim:     "rgba(248,113,113,0.08)",
  redBorder:  "rgba(248,113,113,0.22)",
  font:       "'Cormorant Garamond', serif",
  body:       "'Plus Jakarta Sans', sans-serif",
  mono:       "'IBM Plex Mono', monospace",
};

const SECTIONS = [
  { id: "intro",        label: "Introduction",           num: "01" },
  { id: "definitions",  label: "Definitions",            num: "02" },
  { id: "acknowledgment", label: "Acknowledgment",       num: "03" },
  { id: "links",        label: "Links to Websites",      num: "04" },
  { id: "termination",  label: "Termination",            num: "05" },
  { id: "liability",    label: "Limitation of Liability",num: "06" },
  { id: "disclaimer",   label: '"AS IS" Disclaimer',     num: "07" },
  { id: "governing",    label: "Governing Law",          num: "08" },
  { id: "disputes",     label: "Disputes Resolution",    num: "09" },
  { id: "eu",           label: "EU Users",               num: "10" },
  { id: "us",           label: "US Legal Compliance",    num: "11" },
  { id: "severability", label: "Severability & Waiver",  num: "12" },
  { id: "translation",  label: "Translation",            num: "13" },
  { id: "changes",      label: "Changes to Terms",       num: "14" },
  { id: "contact",      label: "Contact",                num: "15" },
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
    from { opacity: 0; transform: translateY(14px); }
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

  .terms-nav-link {
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
  .terms-nav-link:hover {
    color: ${G.goldLight};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
  }
  .terms-nav-link.active {
    color: ${G.gold};
    border-left-color: ${G.gold};
    background: ${G.goldDim};
  }
  .terms-nav-link .num {
    font-size: 9px;
    opacity: 0.42;
    min-width: 18px;
  }

  .terms-section {
    padding: 48px 0;
    border-bottom: 1px solid ${G.border};
    animation: fadeUp 0.5s ease both;
  }
  .terms-section:last-child { border-bottom: none; }

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
    min-width: 160px;
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

  @media (max-width: 920px) {
    .terms-layout { flex-direction: column !important; }
    .terms-sidebar {
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
    .terms-sidebar .terms-nav-link {
      border: 1px solid ${G.border} !important;
      border-left: 2px solid transparent !important;
      border-radius: 6px !important;
      padding: 5px 12px !important;
    }
    .terms-sidebar .terms-nav-link.active {
      border-color: ${G.goldGlow} !important;
      border-left-color: ${G.gold} !important;
    }
    .terms-main { padding: 32px 20px 60px !important; }
  }
`;

// ── Logo ───────────────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="url(#tmLG)" />
    <path d="M5 25V9L11.5 9L16 17.5L20.5 9L27 9V25H22.5V15.5L16 25.5L9.5 15.5V25Z" fill="#fff" />
    <circle cx="26" cy="8" r="3" fill={G.gold} />
    <defs>
      <linearGradient id="tmLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a30" />
        <stop offset="100%" stopColor="#0a0a16" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Shared Sub-Components ──────────────────────────────────────────────────────
function SectionLabel({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <span style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.2em", opacity: 0.55 }}>{num}</span>
      <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.gold, letterSpacing: "0.16em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{
      fontFamily: G.font, fontSize: "28px", fontWeight: 700,
      color: G.text, marginBottom: "16px", letterSpacing: "0.01em",
    }}>
      {children}
    </h2>
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
    <p style={{ fontSize: "15px", color: G.muted, lineHeight: 1.8, marginTop: mt ? `${mt}px` : undefined }}>
      {children}
    </p>
  );
}

function InfoCard({ children, type = "gold" }) {
  const isRed = type === "red";
  return (
    <div style={{
      marginTop: "16px", padding: "16px 20px",
      background: isRed ? G.redDim : "rgba(201,168,76,0.05)",
      border: `1px solid ${isRed ? G.redBorder : G.borderMid}`,
      borderLeft: `3px solid ${isRed ? G.red : G.gold}`,
      borderRadius: "0 10px 10px 0",
      fontSize: "13.5px", color: "rgba(234,234,242,0.65)", lineHeight: 1.7,
    }}>
      {children}
    </div>
  );
}

function BulletList({ items, dot = "◆", dotColor = G.gold }) {
  return (
    <ul style={{ listStyle: "none", marginTop: "12px" }}>
      {items.map((item, i) => (
        <li key={i} className="bullet-item">
          <span style={{ color: dotColor, flexShrink: 0, marginTop: "2px", fontSize: "11px" }}>{dot}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Terms() {
  const [active, setActive] = useState("intro");

  useEffect(() => {
    const id = "manifix-terms-css";
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
          <a href="/privacy" style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.09em" }}>
            Privacy
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
          📋 LAST UPDATED · MAY 21, 2026
        </div>

        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(38px, 6vw, 62px)",
          color: G.text, letterSpacing: "-0.01em", marginBottom: "14px",
          lineHeight: 1.1,
        }}>
          Terms &amp; <span className="gold-shimmer">Conditions</span>
        </h1>

        <p style={{
          fontSize: "15.5px", color: G.muted,
          maxWidth: "520px", margin: "0 auto 24px",
          lineHeight: 1.7,
        }}>
          Please read these terms and conditions carefully before using the ManifiX AI Service.
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "12px 24px",
          background: "rgba(201,168,76,0.07)",
          border: `1px solid rgba(201,168,76,0.28)`,
          borderRadius: "10px",
          fontFamily: G.mono, fontSize: "11px", color: G.gold, letterSpacing: "0.09em",
        }}>
          ⚖️&nbsp;&nbsp;Governed by the laws of Andhra Pradesh, India
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <div className="terms-layout" style={{ display: "flex", maxWidth: "1220px", margin: "0 auto", padding: "0 24px" }}>

        {/* ── SIDEBAR ── */}
        <aside className="terms-sidebar" style={{
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
              className={`terms-nav-link${active === s.id ? " active" : ""}`}
            >
              <span className="num">{s.num}</span>
              {s.label}
            </a>
          ))}
        </aside>

        {/* ── MAIN ── */}
        <main className="terms-main" style={{ flex: 1, padding: "44px 0 80px 52px", maxWidth: "800px" }}>

          {/* 01 · Introduction */}
          <section id="intro" className="terms-section">
            <SectionLabel num="01" text="Introduction" />
            <H2>Welcome to ManifiX AI</H2>
            <Para>
              ManifiX is a comprehensive AI-powered platform designed to help users build elite discipline,
              manage productivity, and maintain peak mental performance. We combine intelligent AI assistance,
              structured wellness tools, and a global performance community.
            </Para>
            <Para mt={14}>
              These Terms and Conditions govern your access to and use of all ManifiX services including our
              web application, mobile platform, APIs, integrations, AI coaching tools, and the Magic16 wellness system.
              By using ManifiX, you agree to these Terms and all applicable laws.
            </Para>
            <InfoCard>
              ManifiX is committed to a secure, trusted environment. We prioritize user privacy, account safety,
              responsible AI usage, and an inclusive experience for all.
            </InfoCard>
          </section>

          {/* 02 · Definitions */}
          <section id="definitions" className="terms-section">
            <SectionLabel num="02" text="Definitions" />
            <H2>Interpretation &amp; Definitions</H2>
            <Para>
              Words with initial capital letters have meanings defined below. These definitions apply
              regardless of whether they appear in singular or plural form.
            </Para>
            <div style={{ marginTop: "20px" }}>
              {[
                ["Affiliate", "An entity that controls, is controlled by, or is under common control with a party, where control means ownership of 50% or more of the shares or voting securities."],
                ["Country", "Andhra Pradesh, India"],
                ["Company", "ManifixAI Private Limited,India. Also referred to as We, Us, or Our."],
                ["Device", "Any device that can access the Service — computer, mobile phone, or digital tablet."],
                ["Service", "The ManifiX AI website accessible from www.manifixai.com."],
                ["Terms and Conditions", "These Terms and Conditions, including any documents expressly incorporated by reference, forming the entire agreement between You and the Company regarding the Service."],
                ["Third-Party Social Media Service", "Any services or content provided by a third party that is displayed, included, or linked to through the Service."],
                ["Website", "ManifiX AI, accessible from http://www.manifixai.com"],
                ["You", "The individual accessing or using the Service, or the legal entity on whose behalf such individual is acting."],
              ].map(([label, desc]) => (
                <div key={label} className="data-row">
                  <span className="data-label">{label}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 03 · Acknowledgment */}
          <section id="acknowledgment" className="terms-section">
            <SectionLabel num="03" text="Acknowledgment" />
            <H2>Acknowledgment</H2>
            <Para>
              These are the Terms and Conditions governing the use of this Service and the agreement between
              You and the Company. These Terms set out the rights and obligations of all users regarding use
              of the Service.
            </Para>
            <Para mt={14}>
              Your access to and use of the Service is conditioned on your acceptance of and compliance with
              these Terms and Conditions. These Terms apply to all visitors, users, and others who access or
              use the Service.
            </Para>
            <Para mt={14}>
              By accessing or using the Service you agree to be bound by these Terms and Conditions. If you
              disagree with any part of these Terms, you may not access the Service.
            </Para>
            <InfoCard type="red">
              <strong>Age Requirement:</strong> You represent that you are over the age of 18. The Company
              does not permit those under 18 to use the Service.
            </InfoCard>
            <Para mt={16}>
              Your access to and use of the Service is also subject to our{" "}
              <a href="/privacy" style={{ color: G.gold, textDecoration: "none" }}>Privacy Policy</a>,
              which describes how we collect, use, and disclose personal information. Please read our
              Privacy Policy carefully before using our Service.
            </Para>
          </section>

          {/* 04 · Links */}
          <section id="links" className="terms-section">
            <SectionLabel num="04" text="Links to Websites" />
            <H2>Links to Other Websites</H2>
            <Para>
              Our Service may contain links to third-party websites or services that are not owned or
              controlled by the Company. The Company has no control over, and assumes no responsibility for,
              the content, privacy policies, or practices of any third-party websites or services.
            </Para>
            <Para mt={14}>
              You acknowledge and agree that the Company shall not be responsible or liable, directly or
              indirectly, for any damage or loss caused or alleged to be caused by or in connection with the
              use of or reliance on any content, goods, or services available on or through any such
              third-party websites.
            </Para>
            <InfoCard>
              We strongly advise you to read the terms and conditions and privacy policies of any third-party
              websites or services that you visit.
            </InfoCard>

            <SubHead>Links from Third-Party Social Media Services</SubHead>
            <Para>
              The Service may display, include, or link to content or services provided by a Third-Party
              Social Media Service. Such services are not owned or controlled by the Company, and the Company
              does not endorse or assume responsibility for any Third-Party Social Media Service.
            </Para>
            <Para mt={14}>
              Your use of any Third-Party Social Media Service is governed by that service's own terms and
              privacy policies. The Company is not responsible for any damage or loss arising from your
              access to or use of any Third-Party Social Media Service.
            </Para>
          </section>

          {/* 05 · Termination */}
          <section id="termination" className="terms-section">
            <SectionLabel num="05" text="Termination" />
            <H2>Termination</H2>
            <Para>
              We may terminate or suspend your access immediately, without prior notice or liability, for any
              reason whatsoever, including without limitation if you breach these Terms and Conditions.
            </Para>
            <Para mt={14}>
              Upon termination, your right to use the Service will cease immediately.
            </Para>
            <InfoCard type="red">
              Violations of these Terms may result in immediate account suspension. Users may also delete
              their own accounts at any time through Account Settings.
            </InfoCard>
          </section>

          {/* 06 · Liability */}
          <section id="liability" className="terms-section">
            <SectionLabel num="06" text="Limitation of Liability" />
            <H2>Limitation of Liability</H2>
            <Para>
              Notwithstanding any damages that you might incur, the entire liability of the Company and any
              of its suppliers under any provision of these Terms and your exclusive remedy for all of the
              foregoing shall be limited to the amount actually paid by you through the Service or{" "}
              <strong style={{ color: G.text }}>100 USD</strong> if you haven't purchased anything through the Service.
            </Para>
            <Para mt={14}>
              To the maximum extent permitted by applicable law, in no event shall the Company or its
              suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever,
              including but not limited to:
            </Para>
            <BulletList items={[
              "Damages for loss of profits, loss of data, or other information",
              "Business interruption or personal injury",
              "Loss of privacy arising from use of or inability to use the Service",
              "Damages related to third-party software or hardware used with the Service",
              "Any other damages arising out of or in connection with any provision of these Terms",
            ]} />
            <Para mt={14}>
              Some states do not allow the exclusion of implied warranties or limitation of liability for
              incidental or consequential damages, which means some of the above limitations may not apply.
              In these states, each party's liability will be limited to the greatest extent permitted by law.
            </Para>
          </section>

          {/* 07 · Disclaimer */}
          <section id="disclaimer" className="terms-section">
            <SectionLabel num="07" text='"AS IS" Disclaimer' />
            <H2>"AS IS" and "AS AVAILABLE" Disclaimer</H2>
            <Para>
              The Service is provided to you "AS IS" and "AS AVAILABLE" and with all faults and defects
              without warranty of any kind. To the maximum extent permitted under applicable law, the Company
              expressly disclaims all warranties, whether express, implied, statutory, or otherwise, including:
            </Para>
            <BulletList items={[
              "All implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement",
              "Warranties that may arise out of course of dealing, performance, or trade practice",
              "Any warranty that the Service will meet your requirements or achieve intended results",
              "Any warranty that the Service will be compatible or work with any other software, systems, or services",
              "Any warranty that the Service will operate without interruption or be error-free",
              "Any warranty that the Service is free of viruses, malware, trojan horses, worms, or other harmful components",
            ]} />
            <Para mt={14}>
              Some jurisdictions do not allow the exclusion of certain types of warranties or limitations on
              applicable statutory rights of a consumer, so some or all of the above exclusions and limitations
              may not apply to you.
            </Para>
          </section>

          {/* 08 · Governing Law */}
          <section id="governing" className="terms-section">
            <SectionLabel num="08" text="Governing Law" />
            <H2>Governing Law</H2>
            <Para>
              The laws of the Country — <strong style={{ color: G.text }}>Andhra Pradesh, India</strong> — excluding
              its conflicts of law rules, shall govern these Terms and your use of the Service. Your use of
              the Service may also be subject to other local, state, national, or international laws.
            </Para>
          </section>

          {/* 09 · Disputes */}
          <section id="disputes" className="terms-section">
            <SectionLabel num="09" text="Disputes Resolution" />
            <H2>Disputes Resolution</H2>
            <Para>
              If you have any concern or dispute about the Service, you agree to first try to resolve the
              dispute informally by contacting the Company at{" "}
              <a href="mailto:manifixofficial@gmail.com" style={{ color: G.gold, textDecoration: "none" }}>
                manifixofficial@gmail.com
              </a>.
            </Para>
          </section>

          {/* 10 · EU Users */}
          <section id="eu" className="terms-section">
            <SectionLabel num="10" text="EU Users" />
            <H2>For European Union (EU) Users</H2>
            <Para>
              If you are a European Union consumer, you will benefit from any mandatory provisions of the
              law of the country in which you are resident.
            </Para>
          </section>

          {/* 11 · US Compliance */}
          <section id="us" className="terms-section">
            <SectionLabel num="11" text="US Legal Compliance" />
            <H2>United States Legal Compliance</H2>
            <Para>
              You represent and warrant that:
            </Para>
            <BulletList items={[
              "You are not located in a country that is subject to the United States government embargo, or that has been designated by the United States government as a "terrorist supporting" country.",
              "You are not listed on any United States government list of prohibited or restricted parties.",
            ]} />
          </section>

          {/* 12 · Severability */}
          <section id="severability" className="terms-section">
            <SectionLabel num="12" text="Severability & Waiver" />
            <H2>Severability and Waiver</H2>

            <SubHead>Severability</SubHead>
            <Para>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be
              changed and interpreted to accomplish the objectives of that provision to the greatest extent
              possible under applicable law. The remaining provisions will continue in full force and effect.
            </Para>

            <SubHead>Waiver</SubHead>
            <Para>
              Except as provided herein, the failure to exercise a right or to require performance of an
              obligation under these Terms shall not affect a party's ability to exercise such right or
              require such performance at any time thereafter. Nor shall the waiver of a breach constitute a
              waiver of any subsequent breach.
            </Para>
          </section>

          {/* 13 · Translation */}
          <section id="translation" className="terms-section">
            <SectionLabel num="13" text="Translation" />
            <H2>Translation Interpretation</H2>
            <Para>
              These Terms and Conditions may have been translated if we have made them available to you on
              our Service. You agree that the original English text shall prevail in the case of a dispute.
            </Para>
          </section>

          {/* 14 · Changes */}
          <section id="changes" className="terms-section">
            <SectionLabel num="14" text="Changes to Terms" />
            <H2>Changes to These Terms and Conditions</H2>
            <Para>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
              If a revision is material, we will make reasonable efforts to provide at least{" "}
              <strong style={{ color: G.text }}>30 days' notice</strong> prior to any new terms taking effect.
              What constitutes a material change will be determined at our sole discretion.
            </Para>
            <Para mt={14}>
              By continuing to access or use our Service after those revisions become effective, you agree to
              be bound by the revised terms. If you do not agree to the new terms, in whole or in part, please
              stop using the Service.
            </Para>
          </section>

          {/* 15 · Contact */}
          <section id="contact" className="terms-section">
            <SectionLabel num="15" text="Contact" />
            <H2>Contact Us</H2>
            <Para>
              If you have any questions about these Terms and Conditions, please contact us:
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
                ManifiX AI · Legal &amp; Support
              </div>

              {[
                ["Company",     "ManifixAI Private Limited"],
                ["Address",     "Andhra Pradesh, India"],
                ["Email",       "manifixofficial@gmail.com"],
                ["Website",     "www.manifixai.com"],
                ["Country",     "India"],
                ["© Copyright", "2025–2026 ManifiX AI. All rights reserved."],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", gap: "18px", padding: "11px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.042)`,
                }}>
                  <span style={{
                    fontFamily: G.mono, fontSize: "10px", color: G.gold,
                    minWidth: "96px", paddingTop: "2px",
                    letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "14px", color: G.muted, lineHeight: 1.6 }}>{val}</span>
                </div>
              ))}

              <a href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                marginTop: "24px", padding: "13px 32px",
                background: `linear-gradient(135deg, ${G.gold} 0%, #A07828 100%)`,
                color: "#060606", fontFamily: G.font, fontWeight: 700,
                fontSize: "14px", letterSpacing: "0.1em",
                borderRadius: "8px", textDecoration: "none",
                boxShadow: `0 4px 24px rgba(201,168,76,0.25)`,
              }}>
                ACCEPT &amp; GET STARTED →
              </a>
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
          © 2025–2026 ManifixAI Private Limited · All rights reserved · India
        </div>
        <div style={{ display: "flex", gap: "18px" }}>
          {[["Terms of Service", "#intro"], ["Privacy Policy", "/privacy"], ["Contact", "#contact"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.06em" }}>
              {label}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
