// src/pages/Signup.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/auth.service";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const G = {
  gold:     "#D4AF37",
  goldDark: "#B8860B",
  goldDim:  "rgba(212,175,55,0.12)",
  goldGlow: "rgba(212,175,55,0.35)",
  bg:       "#08080F",
  surface:  "#0D0D18",
  surface2: "#111120",
  border:   "rgba(212,175,55,0.18)",
  text:     "#EEEEF4",
  muted:    "rgba(238,238,244,0.45)",
  dim:      "rgba(238,238,244,0.22)",
  error:    "rgba(248,113,113,0.85)",
  font:     "'Rajdhani', sans-serif",
  body:     "'DM Sans', sans-serif",
  mono:     "'JetBrains Mono', monospace",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: ${G.body}; }

  @keyframes su-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes su-pulse {
    0%,100% { box-shadow: 0 0 0 0 ${G.goldGlow}; }
    60%      { box-shadow: 0 0 0 12px rgba(212,175,55,0); }
  }
  @keyframes su-orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(30px,-20px) scale(1.1); }
  }
  @keyframes su-orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(-20px,30px) scale(0.95); }
  }

  .su-gold-text {
    background: linear-gradient(90deg, ${G.gold}, #F0D060, ${G.goldDark}, ${G.gold});
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: su-shimmer 3s linear infinite;
  }

  .su-input {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid ${G.border};
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 14px;
    font-family: ${G.body};
    color: ${G.text};
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    letter-spacing: 0.02em;
  }
  .su-input::placeholder { color: ${G.muted}; }
  .su-input:focus {
    border-color: rgba(212,175,55,0.55);
    background: rgba(212,175,55,0.04);
  }
  .su-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .su-btn-gold {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, ${G.gold} 0%, ${G.goldDark} 100%);
    color: #000;
    font-family: ${G.font};
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.12em;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    animation: su-pulse 2.5s ease-in-out infinite;
  }
  .su-btn-gold:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .su-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }

  .su-btn-google {
    width: 100%;
    padding: 13px;
    background: rgba(255,255,255,0.04);
    color: ${G.text};
    font-family: ${G.font};
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.08em;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
  }
  .su-btn-google:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.22);
    transform: translateY(-1px);
  }
  .su-btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

  .su-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${G.dim};
    font-family: ${G.mono};
    font-size: 10px;
    letter-spacing: 0.14em;
  }
  .su-divider::before, .su-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${G.border};
  }
`;

// ── Inline SVG logo (gold geometric — matches new brand) ──────────────────────
const ManifixLogo = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="url(#suBg)" />
    <path
      d="M10 50V16L23 16L32 35L41 16L54 16V50H45V29L32 51L19 29V50Z"
      fill="white"
    />
    <circle cx="52" cy="14" r="6" fill={G.gold} />
    <defs>
      <linearGradient id="suBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0a0a14" />
      </linearGradient>
    </defs>
  </svg>
);

// ── Google SVG icon ───────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Eye icons ─────────────────────────────────────────────────────────────────
const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const id = "manifix-signup-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  // ── Email signup ────────────────────────────────────────────────────────────
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

  // ── Google signup ────────────────────────────────────────────────────────────
  const handleGoogleSignup = async () => {
    setError("");
    setGLoading(true);
    try {
      // Works with Firebase signInWithPopup or redirect — depends on your authService
      const user = await authService.signInWithGoogle();
      if (!user) throw new Error("Google sign-in cancelled");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      // Common errors
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was closed. Please try again.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("This domain is not authorised in Firebase. Add it in Firebase Console → Authentication → Settings → Authorised Domains.");
      } else {
        setError(err?.message || "Google sign-in failed. Please try again.");
      }
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
      fontFamily: G.body,
    }}>
      <Helmet><title>Join ManifiX AI | Begin Your Evolution</title></Helmet>

      {/* Ambient orbs */}
      <div style={{
        position: "fixed", width: "600px", height: "600px", borderRadius: "50%",
        top: "-200px", left: "-200px", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)",
        filter: "blur(40px)", animation: "su-orb1 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
        bottom: "-150px", right: "-150px", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)",
        filter: "blur(40px)", animation: "su-orb2 14s ease-in-out infinite",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: "420px",
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: "20px",
          padding: "40px 36px",
          position: "relative", overflow: "hidden",
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)`,
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
          background: `linear-gradient(90deg, transparent, ${G.gold}, transparent)`,
        }} />

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <ManifixLogo size={56} />
          </div>
          <h1 style={{
            fontFamily: G.font, fontWeight: 700, fontSize: "26px",
            letterSpacing: "0.18em", marginBottom: "4px",
          }} className="su-gold-text">
            MANIFIX AI
          </h1>
          <p style={{
            fontFamily: G.mono, fontSize: "10px", color: G.dim,
            letterSpacing: "0.18em", textTransform: "uppercase",
          }}>
            Initiate 16-Day Protocol
          </p>
        </div>

        {/* Google Button */}
        <button
          className="su-btn-google"
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          {gLoading ? (
            <span style={{ fontFamily: G.mono, fontSize: "12px", color: G.muted }}>Connecting...</span>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="su-divider" style={{ margin: "20px 0" }}>
          OR REGISTER VIA EMAIL
        </div>

        {/* Email + Password */}
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
              style={{ paddingRight: "44px" }}
              onKeyDown={e => e.key === "Enter" && handleEmailSignup()}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: G.muted, display: "flex", alignItems: "center",
              }}
            >
              {showPw ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: "14px", padding: "10px 14px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "8px", borderLeft: "3px solid #f87171",
            fontSize: "13px", color: G.error, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="su-btn-gold"
          onClick={handleEmailSignup}
          disabled={isLoading}
        >
          {loading ? "CONFIGURING..." : "BEGIN EVOLUTION →"}
        </button>

        {/* Terms note */}
        <p style={{
          textAlign: "center", marginTop: "14px",
          fontFamily: G.mono, fontSize: "10px", color: G.dim, lineHeight: 1.6,
        }}>
          By signing up you agree to our{" "}
          <Link to="/terms" style={{ color: G.gold, textDecoration: "none" }}>Terms</Link>
          {" & "}
          <Link to="/privacy" style={{ color: G.gold, textDecoration: "none" }}>Privacy Policy</Link>
        </p>

        {/* Divider */}
        <div style={{ height: "1px", background: G.border, margin: "20px 0" }} />

        {/* Footer */}
        <p style={{ textAlign: "center", fontFamily: G.mono, fontSize: "11px", color: G.muted, letterSpacing: "0.06em" }}>
          Already enrolled?{" "}
          <Link to="/login" style={{ color: G.gold, textDecoration: "none", fontWeight: 600 }}>
            Access Vault →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
