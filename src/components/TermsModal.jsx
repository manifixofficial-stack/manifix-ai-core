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
  red:        "#FF6B6B",
  redDim:     "rgba(255,107,107,0.08)",
  redBorder:  "rgba(255,107,107,0.24)",
  font:       "'Rajdhani', sans-serif",
  body:       "'Inter', sans-serif",
  mono:       "'JetBrains Mono', monospace",
};

const SECTIONS = [
  { id: "intro",        label: "Introduction",           num: "01" },
  { id: "definitions",  label: "Definitions",            num: "02" },
  { id: "acknowledgment", label: "Acknowledgment",       num: "03" },
  { id: "purchases",    label: "Purchases & Fair Play",  num: "04" },
  { id: "links",        label: "Links to Websites",      num: "05" },
  { id: "termination",  label: "Termination",            num: "06" },
  { id: "liability",    label: "Limitation of Liability",num: "07" },
  { id: "disclaimer",   label: '"AS IS" Disclaimer',     num: "08" },
  { id: "governing",    label: "Governing Law",          num: "09" },
  { id: "disputes",     label: "Disputes Resolution",    num: "10" },
  { id: "eu",           label: "EU Users",               num: "11" },
  { id: "us",           label: "US Legal Compliance",    num: "12" },
  { id: "severability", label: "Severability & Waiver",  num: "13" },
  { id: "translation",  label: "Translation",            num: "14" },
  { id: "changes",      label: "Changes to Terms",       num: "15" },
  { id: "contact",      label: "Contact",                num: "16" },
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
    from { opacity: 0; transform: translateY(14px); }
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
    color: ${G.greenLight};
    border-left-color: ${G.green};
    background: ${G.greenDim};
  }
  .terms-nav-link.active {
    color: ${G.green};
    border-left-color: ${G.green};
    background: ${G.greenDim};
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
    border-bottom: 1px solid rgba(255,255,255,0.06);
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
      border-color: ${G.greenGlow} !important;
      border-left-color: ${G.green} !important;
    }
    .terms-main { padding: 32px 20px 60px !important; }
  }
`;

// ── Logo ───────────────────────────────────────────────────────────────────────
const VeggeGoLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="7" fill="url(#tmLG)" />
    <path d="M8 8L16 24L24 8" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="26" cy="7" r="3" fill={G.green} />
    <defs>
      <linearGradient id="tmLG" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#141a17" />
        <stop offset="100%" stopColor="#04060a" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Shared Sub-Components ──────────────────────────────────────────────────────
function SectionLabel({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <span style={{ fontFamily: G.mono, fontSize: "9px", color: G.green, letterSpacing: "0.2em", opacity: 0.55 }}>{num}</span>
      <span style={{ fontFamily: G.mono, fontSize: "10px", color: G.green, letterSpacing: "0.16em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{
      fontFamily: G.font, fontSize: "29px", fontWeight: 700,
      color: "#FFFFFF", marginBottom: "16px", letterSpacing: "0.01em",
    }}>
      {children}
    </h2>
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
    <p style={{ fontSize: "15px", color: G.muted, lineHeight: 1.8, marginTop: mt ? `${mt}px` : undefined }}>
      {children}
    </p>
  );
}

function InfoCard({ children, type = "green" }) {
  const isRed = type === "red";
  return (
    <div style={{
      marginTop: "16px", padding: "16px 20px",
      background: isRed ? G.redDim : "rgba(52,211,153,0.06)",
      border: `1px solid ${isRed ? G.redBorder : G.borderMid}`,
      borderLeft: `3px solid ${isRed ? G.red : G.green}`,
      borderRadius: "0 10px 10px 0",
      fontSize: "13.5px", color: "rgba(244,247,245,0.68)", lineHeight: 1.7,
    }}>
      {children}
    </div>
  );
}

function BulletList({ items, dot = "◆", dotColor = G.green }) {
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
    const id = "veggego-terms-css";
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
          <a href="/privacy" style={{ fontFamily: G.mono, fontSize: "10px", color: G.muted, textDecoration: "none", letterSpacing: "0.09em" }}>
            Privacy
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
          📋 LAST UPDATED · JULY 17, 2026
        </div>

        <h1 style={{
          fontFamily: G.font, fontWeight: 700,
          fontSize: "clamp(38px, 6vw, 64px)",
          color: "#FFFFFF", letterSpacing: "0em", marginBottom: "14px",
          lineHeight: 1.05,
        }}>
          Terms &amp; <span className="green-shimmer">Conditions</span>
        </h1>

        <p style={{
          fontSize: "15.5px", color: G.muted,
          maxWidth: "520px", margin: "0 auto 24px",
          lineHeight: 1.7,
        }}>
          Please read these terms and conditions carefully before playing Vegge Go, developed by Manifix AI Studio.
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "12px 24px",
          background: "rgba(52,211,153,0.08)",
          border: `1px solid rgba(52,211,153,0.32)`,
          borderRadius: "10px",
          fontFamily: G.mono, fontSize: "11px", color: G.green, letterSpacing: "0.09em",
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
            <H2>Welcome to Vegge Go</H2>
            <Para>
              Vegge Go is a mobile and VR augmented-reality game developed by Manifix AI Studio. We combine
              real-world AR exploration, AI-driven in-game features, and a global community of players in one
              connected experience.
            </Para>
            <Para mt={14}>
              These Terms and Conditions govern your access to and use of Vegge Go, including the mobile and
              VR applications, sign-in via Google OAuth, AR camera features, AI-powered gameplay features, and
              in-game purchases. By downloading, installing, or playing Vegge Go, you agree to these Terms and
              all applicable laws.
            </Para>
            <InfoCard>
              Vegge Go is committed to a secure, trusted environment. We prioritize player privacy, account
              safety, fair play through anti-cheat systems, and an inclusive experience for all.
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
                ["Account", "The player profile created when You sign in to Vegge Go via Google OAuth."],
                ["Affiliate", "An entity that controls, is controlled by, or is under common control with a party, where \"control\" means ownership of 50% or more of the shares or voting securities."],
                ["Country", "Andhra Pradesh, India"],
                ["Company / Studio", "Manifix AI Studio, Andhra Pradesh 530008, India. Also referred to as \"We\", \"Us\", or \"Our\"."],
                ["Device", "Any smartphone, headset, tablet, or other hardware — including VR/AR-capable devices — used to access and play Vegge Go."],
                ["Device UUID", "A unique identifier assigned to your Device, used to enforce fair play and secure your Account."],
                ["Service", "The Vegge Go mobile and VR game and any associated services accessible from www.manifixai.com."],
                ["Terms and Conditions", "These Terms and Conditions, including any documents expressly incorporated by reference, forming the entire agreement between You and the Studio regarding the Service."],
                ["Third-Party Social Media Service", "Any services or content provided by a third party that is displayed, included, or linked to through the Service."],
                ["Virtual Items", "In-game currency, items, or content purchased or earned within Vegge Go, which have no real-world monetary value and cannot be redeemed for cash."],
                ["Website", "Vegge Go's companion website, accessible from http://www.manifixai.com"],
                ["You", "The individual playing or accessing Vegge Go, or the legal entity on whose behalf such individual is acting."],
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
              These are the Terms and Conditions governing the use of Vegge Go and the agreement between You
              and the Studio. These Terms set out the rights and obligations of all players regarding use of
              the Service.
            </Para>
            <Para mt={14}>
              Your access to and use of the Service is conditioned on your acceptance of and compliance with
              these Terms and Conditions. These Terms apply to all players, visitors, and others who access or
              use the Service.
            </Para>
            <Para mt={14}>
              By accessing or using the Service you agree to be bound by these Terms and Conditions. If you
              disagree with any part of these Terms, you may not access the Service.
            </Para>
            <InfoCard type="red">
              <strong>Age Requirement:</strong> You represent that you are at least 13 years old. If you are
              under 18, you confirm that you have the permission of a parent or guardian to play Vegge Go and,
              where applicable, to make in-game purchases.
            </InfoCard>
            <InfoCard>
              <strong>Play It Safe:</strong> Vegge Go uses your Device&apos;s camera for AR gameplay. Always stay
              aware of your real-world surroundings — traffic, obstacles, and other people — while playing, and
              avoid using AR features in unsafe locations.
            </InfoCard>
            <Para mt={16}>
              Your access to and use of the Service is also subject to our{" "}
              <a href="/privacy" style={{ color: G.green, textDecoration: "none" }}>Privacy Policy</a>,
              which describes how we collect, use, and disclose personal information. Please read our
              Privacy Policy carefully before using our Service.
            </Para>
          </section>

          {/* 04 · Purchases & Fair Play */}
          <section id="purchases" className="terms-section">
            <SectionLabel num="04" text="Purchases & Fair Play" />
            <H2>In-Game Purchases &amp; Fair Play</H2>
            <Para>
              Vegge Go may offer Virtual Items for purchase, processed securely through our third-party payment
              processor, <strong style={{ color: "#fff" }}>Razorpay</strong>. All purchases are final unless
              otherwise required by applicable law. Virtual Items have no cash value and cannot be exchanged,
              transferred, or refunded for real currency.
            </Para>
            <SubHead>Fair Play &amp; Anti-Cheat</SubHead>
            <Para>
              To keep the game fair for everyone, Vegge Go uses an Anti-Cheat System that logs your Device UUID
              and monitors for exploits, unauthorized modifications, and multi-accounting.
            </Para>
            <BulletList items={[
              "Do not use cheats, bots, exploits, or unauthorized third-party software with Vegge Go.",
              "Do not attempt to reverse-engineer, decompile, or tamper with the game client.",
              "Do not create multiple Accounts to circumvent restrictions, bans, or in-game limits.",
              "Do not harass, threaten, or abuse other players through in-game features.",
            ]} />
            <InfoCard type="red">
              Violating fair play rules may result in a warning, temporary suspension, or permanent ban of your
              Account, at the Studio&apos;s discretion, without entitlement to a refund of any purchases made.
            </InfoCard>
          </section>

          {/* 05 · Links */}
          <section id="links" className="terms-section">
            <SectionLabel num="05" text="Links to Websites" />
            <H2>Links to Other Websites</H2>
            <Para>
              Our Service may contain links to third-party websites or services — including Google Play and
              Razorpay — that are not owned or controlled by the Studio. The Studio has no control over, and
              assumes no responsibility for, the content, privacy policies, or practices of any third-party
              websites or services.
            </Para>
            <Para mt={14}>
              You acknowledge and agree that the Studio shall not be responsible or liable, directly or
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
              Social Media Service. Such services are not owned or controlled by the Studio, and the Studio
              does not endorse or assume responsibility for any Third-Party Social Media Service.
            </Para>
            <Para mt={14}>
              Your use of any Third-Party Social Media Service is governed by that service&apos;s own terms and
              privacy policies. The Studio is not responsible for any damage or loss arising from your access
              to or use of any Third-Party Social Media Service.
            </Para>
          </section>

          {/* 06 · Termination */}
          <section id="termination" className="terms-section">
            <SectionLabel num="06" text="Termination" />
            <H2>Termination</H2>
            <Para>
              We may terminate or suspend your access immediately, without prior notice or liability, for any
              reason whatsoever, including without limitation if you breach these Terms and Conditions or our
              fair play rules.
            </Para>
            <Para mt={14}>
              Upon termination, your right to use the Service will cease immediately.
            </Para>
            <InfoCard type="red">
              Violations of these Terms, including cheating or exploiting the game, may result in immediate
              Account suspension or ban. Players may also delete their own Accounts at any time through
              Account Settings.
            </InfoCard>
          </section>

          {/* 07 · Liability */}
          <section id="liability" className="terms-section">
            <SectionLabel num="07" text="Limitation of Liability" />
            <H2>Limitation of Liability</H2>
            <Para>
              Notwithstanding any damages that you might incur, the entire liability of the Studio and any of
              its suppliers under any provision of these Terms and your exclusive remedy for all of the
              foregoing shall be limited to the amount actually paid by you through the Service or{" "}
              <strong style={{ color: "#fff" }}>100 USD</strong> if you haven&apos;t purchased anything through the Service.
            </Para>
            <Para mt={14}>
              To the maximum extent permitted by applicable law, in no event shall the Studio or its suppliers
              be liable for any special, incidental, indirect, or consequential damages whatsoever, including
              but not limited to:
            </Para>
            <BulletList items={[
              "Damages for loss of profits, loss of data, or other information",
              "Business interruption, personal injury, or physical injury sustained while playing in AR/VR mode",
              "Loss of privacy arising from use of or inability to use the Service",
              "Damages related to third-party software, hardware, or headsets used with the Service",
              "Any other damages arising out of or in connection with any provision of these Terms",
            ]} />
            <Para mt={14}>
              Some states do not allow the exclusion of implied warranties or limitation of liability for
              incidental or consequential damages, which means some of the above limitations may not apply.
              In these states, each party&apos;s liability will be limited to the greatest extent permitted by law.
            </Para>
          </section>

          {/* 08 · Disclaimer */}
          <section id="disclaimer" className="terms-section">
            <SectionLabel num="08" text='"AS IS" Disclaimer' />
            <H2>&quot;AS IS&quot; and &quot;AS AVAILABLE&quot; Disclaimer</H2>
            <Para>
              The Service is provided to you &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; and with all faults and defects
              without warranty of any kind. To the maximum extent permitted under applicable law, the Studio
              expressly disclaims all warranties, whether express, implied, statutory, or otherwise, including:
            </Para>
            <BulletList items={[
              "All implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement",
              "Warranties that may arise out of course of dealing, performance, or trade practice",
              "Any warranty that the Service will meet your requirements or achieve intended results",
              "Any warranty that the Service will be compatible or work with any other software, systems, devices, or VR/AR hardware",
              "Any warranty that the Service will operate without interruption or be error-free",
              "Any warranty that the Service is free of viruses, malware, trojan horses, worms, or other harmful components",
            ]} />
            <Para mt={14}>
              Some jurisdictions do not allow the exclusion of certain types of warranties or limitations on
              applicable statutory rights of a consumer, so some or all of the above exclusions and limitations
              may not apply to you.
            </Para>
          </section>

          {/* 09 · Governing Law */}
          <section id="governing" className="terms-section">
            <SectionLabel num="09" text="Governing Law" />
            <H2>Governing Law</H2>
            <Para>
              The laws of the Country — <strong style={{ color: "#fff" }}>Andhra Pradesh, India</strong> — excluding
              its conflicts of law rules, shall govern these Terms and your use of the Service. Your use of
              the Service may also be subject to other local, state, national, or international laws.
            </Para>
          </section>

          {/* 10 · Disputes */}
          <section id="disputes" className="terms-section">
            <SectionLabel num="10" text="Disputes Resolution" />
            <H2>Disputes Resolution</H2>
            <Para>
              If you have any concern or dispute about the Service, you agree to first try to resolve the
              dispute informally by contacting the Studio at{" "}
              <a href="mailto:manifixofficial@gmail.com" style={{ color: G.green, textDecoration: "none" }}>
                manifixofficial@gmail.com
              </a>.
            </Para>
          </section>

          {/* 11 · EU Users */}
          <section id="eu" className="terms-section">
            <SectionLabel num="11" text="EU Users" />
            <H2>For European Union (EU) Users</H2>
            <Para>
              If you are a European Union consumer, you will benefit from any mandatory provisions of the
              law of the country in which you are resident.
            </Para>
          </section>

          {/* 12 · US Compliance */}
          <section id="us" className="terms-section">
            <SectionLabel num="12" text="US Legal Compliance" />
            <H2>United States Legal Compliance</H2>
            <Para>
              You represent and warrant that:
            </Para>
            <BulletList items={[
              "You are not located in a country that is subject to the United States government embargo, or that has been designated by the United States government as a \"terrorist supporting\" country.",
              "You are not listed on any United States government list of prohibited or restricted parties.",
            ]} />
          </section>

          {/* 13 · Severability */}
          <section id="severability" className="terms-section">
            <SectionLabel num="13" text="Severability & Waiver" />
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
              obligation under these Terms shall not affect a party&apos;s ability to exercise such right or
              require such performance at any time thereafter. Nor shall the waiver of a breach constitute a
              waiver of any subsequent breach.
            </Para>
          </section>

          {/* 14 · Translation */}
          <section id="translation" className="terms-section">
            <SectionLabel num="14" text="Translation" />
            <H2>Translation Interpretation</H2>
            <Para>
              These Terms and Conditions may have been translated if we have made them available to you on
              our Service. You agree that the original English text shall prevail in the case of a dispute.
            </Para>
          </section>

          {/* 15 · Changes */}
          <section id="changes" className="terms-section">
            <SectionLabel num="15" text="Changes to Terms" />
            <H2>Changes to These Terms and Conditions</H2>
            <Para>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
              If a revision is material, we will make reasonable efforts to provide at least{" "}
              <strong style={{ color: "#fff" }}>30 days&apos; notice</strong> prior to any new terms taking effect.
              What constitutes a material change will be determined at our sole discretion.
            </Para>
            <Para mt={14}>
              By continuing to access or play Vegge Go after those revisions become effective, you agree to
              be bound by the revised terms. If you do not agree to the new terms, in whole or in part, please
              stop using the Service.
            </Para>
          </section>

          {/* 16 · Contact */}
          <section id="contact" className="terms-section">
            <SectionLabel num="16" text="Contact" />
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
                background: `linear-gradient(90deg, transparent, ${G.green}, transparent)`,
              }} />

              <div style={{
                fontFamily: G.font, fontSize: "21px", fontWeight: 700,
                color: "#fff", marginBottom: "20px", letterSpacing: "0.03em",
              }}>
                Vegge Go · Legal &amp; Support
              </div>

              {[
                ["Studio",      "Manifix AI Studio"],
                ["Game",        "Vegge Go (Mobile & VR AR Game)"],
                ["Address",     "Visakhapatnam, Andhra Pradesh, India"],
                ["Email",       "manifixofficial@gmail.com"],
                ["Website",     "www.manifixai.com"],
                ["© Copyright", "2025–2026 Manifix AI Studio. All rights reserved."],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", gap: "18px", padding: "11px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
                }}>
                  <span style={{
                    fontFamily: G.mono, fontSize: "10px", color: G.green,
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
                background: `linear-gradient(135deg, ${G.green} 0%, ${G.greenDeep} 100%)`,
                color: "#04120a", fontFamily: G.font, fontWeight: 700,
                fontSize: "15px", letterSpacing: "0.1em",
                borderRadius: "8px", textDecoration: "none",
                boxShadow: `0 4px 24px rgba(52,211,153,0.28)`,
              }}>
                ACCEPT &amp; PLAY →
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
        background: "rgba(6,9,7,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <VeggeGoLogo size={22} />
          <span style={{ fontFamily: G.font, fontSize: "16px", color: G.muted, letterSpacing: "0.08em" }}>
            VEGGE GO
          </span>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.08em" }}>
          © 2025–2026 Manifix AI Studio · All rights reserved · India
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
