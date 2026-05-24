// src/pages/Signup.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/auth.service";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const G = {
  gold:     "#C9A84C",
  goldLight:"#F0CC6A",
  goldDark: "#A07828",
  goldDim:  "rgba(201,168,76,0.11)",
  goldGlow: "rgba(201,168,76,0.30)",
  bg:       "#05050A",
  surface:  "#09090F",
  surface2: "#0D0D18",
  border:   "rgba(201,168,76,0.16)",
  text:     "#ECEEF8",
  muted:    "rgba(236,238,248,0.50)",
  dim:      "rgba(236,238,248,0.22)",
  error:    "rgba(255,107,107,0.90)",
  font:     "'Bebas Neue', sans-serif",
  body:     "'DM Sans', sans-serif",
  mono:     "'IBM Plex Mono', monospace",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,700&family=DM+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: ${G.body}; }

  @keyframes su-shimmer {
    0%   { background-position: -400% center; }
    100% { background-position:  400% center; }
  }
  @keyframes su-pulse {
    0%,100% { box-shadow: 0 6px 30px rgba(201,168,76,0.38); }
    50%      { box-shadow: 0 6px 44px rgba(201,168,76,0.62); }
  }
  @keyframes su-orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(40px,-28px) scale(1.1); }
  }
  @keyframes su-orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(-28px, 36px) scale(0.94); }
  }
  @keyframes su-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes su-gridPulse {
    0%,100% { opacity: 0.022; }
    50%      { opacity: 0.05; }
  }
  @keyframes su-borderGlow {
    0%,100% { border-color: rgba(201,168,76,0.16); }
    50%      { border-color: rgba(201,168,76,0.38); }
  }
  @keyframes su-shine {
    from { left: -80%; }
    to   { left: 130%; }
  }
  @keyframes su-logoGlow {
    0%,100% { filter: drop-shadow(0 0 8px rgba(201,168,76,0.45)) drop-shadow(0 0 20px rgba(201,168,76,0.18)); }
    50%      { filter: drop-shadow(0 0 16px rgba(201,168,76,0.75)) drop-shadow(0 0 40px rgba(201,168,76,0.30)); }
  }

  .su-gold-text {
    background: linear-gradient(90deg, ${G.goldDark}, ${G.gold}, ${G.goldLight}, ${G.goldLight}, ${G.gold}, ${G.goldDark});
    background-size: 400% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: su-shimmer 6s linear infinite;
  }

  .su-grid-bg {
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 56px 56px;
    animation: su-gridPulse 7s ease-in-out infinite;
  }

  .su-logo-img {
    object-fit: contain;
    display: block;
    animation: su-logoGlow 3.5s ease-in-out infinite;
    border-radius: 14px;
  }

  .su-input {
    width: 100%;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(201,168,76,0.16);
    border-radius: 6px;
    padding: 15px 18px;
    font-size: 14px;
    font-family: ${G.body};
    color: ${G.text};
    outline: none;
    transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
    letter-spacing: 0.02em;
  }
  .su-input::placeholder { color: ${G.dim}; }
  .su-input:focus {
    border-color: rgba(201,168,76,0.50);
    background: rgba(201,168,76,0.04);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
  }
  .su-input:disabled { opacity: 0.45; cursor: not-allowed; }

  .su-btn-gold {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, ${G.gold} 0%, ${G.goldDark} 50%, ${G.gold} 100%);
    background-size: 200% auto;
    color: #05050A;
    font-family: ${G.font};
    font-size: 18px;
    letter-spacing: 0.14em;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, background-position 0.4s;
    animation: su-pulse 3s ease-in-out infinite;
    position: relative; overflow: hidden;
  }
  .su-btn-gold::after {
    content: '';
    position: absolute;
    top: 0; left: -80%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
    transform: skewX(-18deg);
  }
  .su-btn-gold:hover:not(:disabled) {
    transform: translateY(-2px);
    background-position: right center;
  }
  .su-btn-gold:hover:not(:disabled)::after {
    animation: su-shine 0.55s ease forwards;
  }
  .su-btn-gold:disabled { opacity: 0.45; cursor: not-allowed; animation: none; }

  .su-btn-google {
    width: 100%;
    padding: 14px;
    background: rgba(255,255,255,0.035);
    color: ${G.text};
    font-family: ${G.body};
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.04em;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 6px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.22s ease;
  }
  .su-btn-google:hover:not(:disabled) {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.20);
    transform: translateY(-2px);
  }
  .su-btn-google:disabled { opacity: 0.45; cursor: not-allowed; }

  .su-divider {
    display: flex; align-items: center; gap: 14px;
    color: ${G.dim};
    font-family: ${G.mono}; font-size: 9px; letter-spacing: 0.18em;
  }
  .su-divider::before, .su-divider::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent);
  }

  .su-feature-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 4px;
    background: rgba(201,168,76,0.05);
    border: 1px solid rgba(201,168,76,0.14);
    font-family: ${G.mono}; font-size: 10px;
    color: ${G.muted}; letter-spacing: 0.08em;
    white-space: nowrap;
  }
`;

// ── Real Manifix Logo — /public/assets/logo.png ──────────────────────────────
const ManifixLogo = ({ size = 62 }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/assets/logo.png"
        alt="ManifiX AI"
        width={size}
        height={size}
        className="su-logo-img"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // SVG fallback if image fails to load
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="suBgFb" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1A30"/>
          <stop offset="100%" stopColor="#07070E"/>
        </linearGradient>
        <linearGradient id="suGoldFb" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C9A84C"/>
          <stop offset="100%" stopColor="#F0CC6A"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#suBgFb)"/>
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="url(#suGoldFb)" strokeOpacity="0.4" strokeWidth="1"/>
      <path d="M10 50V16L23 16L32 35L41 16L54 16V50H45V29L32 51L19 29V50Z" fill="white"/>
      <circle cx="52" cy="14" r="5.5" fill="url(#suGoldFb)"/>
      <rect x="10" y="53" width="44" height="2" rx="1" fill="url(#suGoldFb)" opacity="0.55"/>
    </svg>
  );
};

// ── Google Icon ─────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Eye icons ───────────────────────────────────────────────────────────────
const EyeOn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ── Check icon ──────────────────────────────────────────────────────────────
const Check = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const id = "manifix-signup-v2";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Password strength
  const pwStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: "Too Short", color: "#FF6B6B", w: "25%" };
    if (password.length < 8) return { label: "Weak",      color: "#FB923C", w: "50%" };
    if (password.length < 12) return { label: "Good",     color: G.gold,    w: "75%" };
    return { label: "Strong", color: "#4ADE80", w: "100%" };
  })();

  const handleEmailSignup = async () => {
    setError("");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8)  return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const user = await authService.signUp(email.trim().toLowerCase(), password);
      if (!user) throw new Error("No user returned");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGLoading(true);
    try {
      await authService.loginWithGoogle(); // ✅ correct method, redirect handled by Supabase
    } catch (err) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGLoading(false);
    }
  };

  const isLoading = loading || gLoading;

  return (
    <div style={{
      minHeight: "100vh", background: G.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <Helmet><title>Join ManifiX AI — Begin Your Evolution</title></Helmet>

      {/* Grid bg */}
      <div className="su-grid-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Ambient orbs */}
      <div style={{
        position: "fixed", width: "700px", height: "700px", borderRadius: "50%",
        top: "-220px", left: "-220px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 65%)",
        filter: "blur(70px)", animation: "su-orb1 16s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", width: "550px", height: "550px", borderRadius: "50%",
        bottom: "-160px", right: "-160px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 65%)",
        filter: "blur(70px)", animation: "su-orb2 20s ease-in-out infinite",
      }} />

      {/* Decorative corner frames */}
      {[
        { top: "24px",    left: "24px",  borderTop: `1px solid ${G.border}`, borderLeft:  `1px solid ${G.border}` },
        { top: "24px",    right: "24px", borderTop: `1px solid ${G.border}`, borderRight: `1px solid ${G.border}` },
        { bottom: "24px", left: "24px",  borderBottom: `1px solid ${G.border}`, borderLeft:  `1px solid ${G.border}` },
        { bottom: "24px", right: "24px", borderBottom: `1px solid ${G.border}`, borderRight: `1px solid ${G.border}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "fixed", width: "50px", height: "50px", zIndex: 1, ...s }} />
      ))}

      {/* ── CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: "440px",
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: "10px",
          padding: "44px 40px",
          position: "relative", overflow: "hidden", zIndex: 10,
          boxShadow: `0 40px 100px rgba(0,0,0,0.70), 0 0 0 1px rgba(201,168,76,0.07), 0 0 80px rgba(201,168,76,0.05)`,
          animation: "su-borderGlow 5s ease-in-out infinite",
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
          background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
        }} />
        {/* Bottom line */}
        <div style={{
          position: "absolute", bottom: 0, left: "30%", right: "30%", height: "1px",
          background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)`,
        }} />

        {/* ── BRAND HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* Real logo with glowing ring container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex", justifyContent: "center",
              marginBottom: "18px",
              animation: "su-float 6s ease-in-out infinite",
            }}
          >
            {/* Gold ring wrapper */}
            <div style={{
              width: "82px", height: "82px",
              borderRadius: "20px",
              background: "rgba(201,168,76,0.06)",
              border: `1.5px solid rgba(201,168,76,0.30)`,
              boxShadow: `0 0 0 6px rgba(201,168,76,0.05), 0 8px 32px rgba(201,168,76,0.20)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "10px",
            }}>
              <ManifixLogo size={62} />
            </div>
          </motion.div>

          <h1 style={{
            fontFamily: G.font, fontSize: "28px",
            letterSpacing: "0.22em", marginBottom: "5px", lineHeight: 1,
          }} className="su-gold-text">
            MANIFIX AI
          </h1>
          <p style={{
            fontFamily: "'Playfair Display', serif", fontStyle: "italic",
            fontSize: "13px", color: G.muted, letterSpacing: "0.04em",
          }}>
            Begin Your 16-Minute Evolution
          </p>
        </div>

        {/* ── FEATURE PILLS ── */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "28px" }}>
          {[["⚡","Magic16"], ["🌍","Global Rank"], ["🤖","AI Coach"]].map(([icon, label]) => (
            <div key={label} className="su-feature-pill">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* ── GOOGLE ── */}
        <button className="su-btn-google" onClick={handleGoogleSignup} disabled={isLoading}>
          {gLoading ? (
            <span style={{ fontFamily: G.mono, fontSize: "12px", color: G.muted, letterSpacing: "0.08em" }}>
              Connecting to Google...
            </span>
          ) : (
            <><GoogleIcon /><span style={{ fontFamily: G.body, fontWeight: 600 }}>Continue with Google</span></>
          )}
        </button>

        {/* ── DIVIDER ── */}
        <div className="su-divider" style={{ margin: "22px 0" }}>OR REGISTER WITH EMAIL</div>

        {/* ── FORM ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <input
            className="su-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            onKeyDown={e => e.key === "Enter" && handleEmailSignup()}
          />

          <div style={{ position: "relative" }}>
            <input
              className="su-input"
              type={showPw ? "text" : "password"}
              placeholder="Create password (8+ characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              style={{ paddingRight: "46px" }}
              onKeyDown={e => e.key === "Enter" && handleEmailSignup()}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: G.dim, display: "flex", alignItems: "center", transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = G.gold}
              onMouseLeave={e => e.currentTarget.style.color = G.dim}
            >
              {showPw ? <EyeOff /> : <EyeOn />}
            </button>
          </div>

          {/* Password strength bar */}
          {pwStrength && (
            <div>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: pwStrength.w,
                  background: pwStrength.color, borderRadius: "2px",
                  transition: "width 0.3s ease, background 0.3s ease",
                  boxShadow: `0 0 8px ${pwStrength.color}55`,
                }} />
              </div>
              <div style={{ fontFamily: G.mono, fontSize: "9px", color: pwStrength.color, marginTop: "5px", letterSpacing: "0.12em" }}>
                {pwStrength.label}
              </div>
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: "14px", padding: "12px 16px",
              background: "rgba(255,107,107,0.07)",
              border: "1px solid rgba(255,107,107,0.22)",
              borderLeft: "3px solid #FF6B6B",
              borderRadius: "0 6px 6px 0",
              fontSize: "13px", color: G.error, lineHeight: 1.55,
              fontFamily: G.body,
            }}
          >
            {error}
          </motion.div>
        )}

        {/* ── SUBMIT ── */}
        <button className="su-btn-gold" onClick={handleEmailSignup} disabled={isLoading}>
          {loading ? "CONFIGURING..." : "BEGIN EVOLUTION →"}
        </button>

        {/* ── WHAT YOU GET ── */}
        <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "6px", background: G.goldDim, border: `1px solid rgba(201,168,76,0.16)` }}>
          <div style={{ fontFamily: G.mono, fontSize: "9px", color: G.gold, letterSpacing: "0.18em", marginBottom: "10px" }}>
            INCLUDED IN YOUR MEMBERSHIP
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[
              "Magic16 Protocol",    "SleepGold Engine",
              "AI Conversation Coach","Women's Health AI",
              "Mental Health AI",    "Burnout Shield",
              "Nutrition Intelligence","Global Leaderboard",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <Check />
                <span style={{ fontFamily: G.body, fontSize: "11.5px", color: G.muted }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TERMS ── */}
        <p style={{
          textAlign: "center", marginTop: "16px",
          fontFamily: G.mono, fontSize: "10px", color: G.dim, lineHeight: 1.65,
          letterSpacing: "0.04em",
        }}>
          By signing up you agree to our{" "}
          <Link to="/terms"   style={{ color: G.gold, textDecoration: "none" }}>Terms</Link>
          {" & "}
          <Link to="/privacy" style={{ color: G.gold, textDecoration: "none" }}>Privacy Policy</Link>
        </p>

        {/* ── DIVIDER ── */}
        <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${G.border}, transparent)`, margin: "20px 0" }} />

        {/* ── LOGIN LINK ── */}
        <p style={{ textAlign: "center", fontFamily: G.mono, fontSize: "11px", color: G.muted, letterSpacing: "0.07em" }}>
          Already enrolled?{" "}
          <Link to="/login" style={{ color: G.gold, textDecoration: "none", fontWeight: 600 }}>
            Access Vault →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
