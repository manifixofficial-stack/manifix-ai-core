import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

function injectStyles() {
  if (document.getElementById("manifix-login-styles")) return;
  const s = document.createElement("style");
  s.id = "manifix-login-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Outfit:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes ml-particle {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: .6; }
      100% { transform: translateY(-120vh) translateX(var(--dx)) scale(.3); opacity: 0; }
    }
    @keyframes ml-rotate-slow {
      to { transform: rotate(360deg); }
    }
    @keyframes ml-rotate-rev {
      to { transform: rotate(-360deg); }
    }
    @keyframes ml-pulse-ring {
      0%   { transform: scale(1); opacity: .5; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes ml-shimmer-gold {
      0%   { background-position: -300% center; }
      100% { background-position: 300% center; }
    }
    @keyframes ml-card-in {
      from { opacity: 0; transform: translateY(40px) scale(.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes ml-glow-breathe {
      0%,100% { opacity: .18; }
      50%      { opacity: .38; }
    }
    @keyframes ml-scan-line {
      0%   { top: -2px; opacity: 0; }
      5%   { opacity: 1; }
      95%  { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes ml-flicker {
      0%,97%,100% { opacity: 1; }
      98% { opacity: .85; }
      99% { opacity: .92; }
    }
    @keyframes ml-btn-hover-glow {
      0%   { box-shadow: 0 0 0 0 rgba(212,175,55,.5); }
      100% { box-shadow: 0 0 28px 8px rgba(212,175,55,.0); }
    }
    @keyframes ml-border-spin {
      to { --angle: 360deg; }
    }
    @keyframes ml-float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes ml-blink-dot {
      0%,100% { opacity: 1; }
      50%      { opacity: .2; }
    }
    @keyframes ml-wave {
      0%  { d: path("M0,8 C20,0 40,16 60,8 C80,0 100,16 120,8 L120,20 L0,20 Z"); }
      50% { d: path("M0,12 C20,4 40,20 60,12 C80,4 100,20 120,12 L120,20 L0,20 Z"); }
      100%{ d: path("M0,8 C20,0 40,16 60,8 C80,0 100,16 120,8 L120,20 L0,20 Z"); }
    }

    .ml-shimmer-text {
      background: linear-gradient(90deg,#c8a030,#ffd966,#f5bc00,#ffe88a,#c8a030);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ml-shimmer-gold 4s linear infinite;
    }

    .ml-card {
      animation: ml-card-in .7s cubic-bezier(.22,1,.36,1) both;
    }

    .ml-btn-google {
      position: relative;
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1a1a1a 0%, #111 100%);
      border: 1px solid rgba(212,175,55,.35);
      border-radius: 12px;
      color: #eee;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: .04em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: border-color .25s, background .25s, transform .15s, box-shadow .25s;
      overflow: hidden;
    }
    .ml-btn-google::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(212,175,55,.08) 0%, rgba(212,175,55,.02) 100%);
      opacity: 0;
      transition: opacity .25s;
      border-radius: inherit;
    }
    .ml-btn-google:hover { 
      border-color: rgba(212,175,55,.7);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(212,175,55,.18), 0 0 0 1px rgba(212,175,55,.12);
    }
    .ml-btn-google:hover::before { opacity: 1; }
    .ml-btn-google:active { transform: translateY(0) scale(.99); }
    .ml-btn-google:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    .ml-ring-outer {
      animation: ml-rotate-slow 12s linear infinite;
    }
    .ml-ring-inner {
      animation: ml-rotate-rev 8s linear infinite;
    }
    .ml-pulse-ring {
      animation: ml-pulse-ring 2s ease-out infinite;
    }
    .ml-logo-float {
      animation: ml-float 4s ease-in-out infinite;
    }
    .ml-flicker {
      animation: ml-flicker 8s ease-in-out infinite;
    }

    .ml-divider {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 28px 0 20px;
    }
    .ml-divider::before, .ml-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212,175,55,.2), transparent);
    }

    .ml-trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      letter-spacing: .06em;
      color: rgba(255,255,255,.22);
    }
    .ml-trust-item span.dot {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: rgba(212,175,55,.5);
      flex-shrink: 0;
    }

    .ml-particle {
      position: fixed;
      bottom: -10px;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      pointer-events: none;
      animation: ml-particle var(--dur) ease-in var(--delay) infinite;
    }

    .ml-scan {
      position: fixed;
      left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212,175,55,.15), rgba(212,175,55,.3), rgba(212,175,55,.15), transparent);
      animation: ml-scan-line 5s linear infinite;
      pointer-events: none;
      z-index: 0;
    }
  `;
  document.head.appendChild(s);
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  dur: `${6 + Math.random() * 10}s`,
  delay: `${Math.random() * 8}s`,
  dx: `${(Math.random() - .5) * 60}px`,
  color: i % 4 === 0 ? "rgba(220,60,60,.6)" : i % 3 === 0 ? "rgba(212,175,55,.7)" : "rgba(212,175,55,.35)",
  size: `${2 + Math.random() * 3}px`,
}));

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.loginWithGoogle?.();
      setSuccess(true);
      setTimeout(() => navigate("/app/dashboard"), 1200);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. Please try again.");
      } else {
        setError(err?.message || "Google authentication failed.");
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#070709",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="ml-particle" style={{
          left: p.left,
          width: p.size, height: p.size,
          background: p.color,
          "--dur": p.dur,
          "--delay": p.delay,
          "--dx": p.dx,
        }} />
      ))}

      {/* Scan line */}
      <div className="ml-scan" />

      {/* Background radial glows */}
      <div style={{
        position: "fixed", top: "10%", left: "50%",
        transform: "translateX(-50%)",
        width: 700, height: 400,
        background: "radial-gradient(ellipse, rgba(212,175,55,.07) 0%, transparent 65%)",
        animation: "ml-glow-breathe 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "5%", right: "10%",
        width: 400, height: 300,
        background: "radial-gradient(ellipse, rgba(200,40,40,.06) 0%, transparent 60%)",
        animation: "ml-glow-breathe 7s ease-in-out infinite .5s",
        pointerEvents: "none",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(212,175,55,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.025) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Corner brackets */}
      {[
        { top: 20, left: 20, borderTop: "1px solid rgba(212,175,55,.3)", borderLeft: "1px solid rgba(212,175,55,.3)" },
        { top: 20, right: 20, borderTop: "1px solid rgba(212,175,55,.3)", borderRight: "1px solid rgba(212,175,55,.3)" },
        { bottom: 20, left: 20, borderBottom: "1px solid rgba(212,175,55,.3)", borderLeft: "1px solid rgba(212,175,55,.3)" },
        { bottom: 20, right: 20, borderBottom: "1px solid rgba(212,175,55,.3)", borderRight: "1px solid rgba(212,175,55,.3)" },
      ].map((pos, i) => (
        <div key={i} style={{ position: "fixed", width: 24, height: 24, ...pos }} />
      ))}

      {/* CARD */}
      <div className="ml-card ml-flicker" style={{
        position: "relative",
        zIndex: 1,
        width: "min(420px, 96vw)",
        background: "linear-gradient(160deg, #0f0f12 0%, #0a0a0d 50%, #0d0a0a 100%)",
        border: "1px solid rgba(212,175,55,.2)",
        borderRadius: 20,
        padding: "44px 36px",
        boxShadow: "0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(212,175,55,.08), inset 0 1px 0 rgba(212,175,55,.12)",
        overflow: "hidden",
      }}>

        {/* Card top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,.6), transparent)",
        }} />

        {/* Logo section */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>

          {/* Animated logo ring */}
          <div className="ml-logo-float" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", position: "relative",
            width: 96, height: 96, marginBottom: 20,
          }}>
            {/* Outer ring */}
            <div className="ml-ring-outer" style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "1px solid rgba(212,175,55,.3)",
              borderTopColor: "rgba(212,175,55,.8)",
            }} />
            {/* Inner ring */}
            <div className="ml-ring-inner" style={{
              position: "absolute", inset: 10,
              borderRadius: "50%",
              border: "1px dashed rgba(212,175,55,.2)",
              borderBottomColor: "rgba(220,60,60,.6)",
            }} />
            {/* Pulse */}
            <div className="ml-pulse-ring" style={{
              position: "absolute", inset: 4,
              borderRadius: "50%",
              border: "1px solid rgba(212,175,55,.3)",
            }} />
            {/* M letter core */}
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: "linear-gradient(135deg, #1a1a1a, #111)",
              border: "1px solid rgba(212,175,55,.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cinzel', serif",
              fontSize: 22, fontWeight: 700,
              color: "#D4AF37",
              letterSpacing: 0,
              boxShadow: "0 0 20px rgba(212,175,55,.15)",
            }}>M</div>
          </div>

          {/* Brand name */}
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 28, fontWeight: 700,
            letterSpacing: ".2em",
            marginBottom: 6,
          }} className="ml-shimmer-text">MANIFIX AI</h1>

          <p style={{
            fontSize: 11, letterSpacing: ".2em",
            color: "rgba(255,255,255,.25)",
            textTransform: "uppercase",
            fontFamily: "'Outfit', monospace",
          }}>Intelligence meets intention</p>

          {/* Online indicator */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 14, padding: "4px 14px",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 20, background: "rgba(255,255,255,.03)",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,.7)",
              animation: "ml-blink-dot 2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 10, letterSpacing: ".18em",
              color: "rgba(255,255,255,.3)",
              textTransform: "uppercase",
            }}>System Active</span>
          </div>
        </div>

        {/* Heading */}
        <p style={{
          fontSize: 11, letterSpacing: ".18em",
          color: "rgba(212,175,55,.4)",
          textTransform: "uppercase",
          marginBottom: 24,
          paddingLeft: 12,
          borderLeft: "2px solid rgba(212,175,55,.25)",
        }}>Neural Access Portal</p>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 18, padding: "12px 16px",
            background: "rgba(220,38,38,.08)",
            border: "1px solid rgba(220,38,38,.25)",
            borderLeft: "3px solid #dc2626",
            borderRadius: 8,
            fontSize: 12, color: "#f87171",
            letterSpacing: ".04em",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            marginBottom: 18, padding: "12px 16px",
            background: "rgba(34,197,94,.08)",
            border: "1px solid rgba(34,197,94,.25)",
            borderLeft: "3px solid #22c55e",
            borderRadius: 8,
            fontSize: 12, color: "#4ade80",
            letterSpacing: ".04em",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✓</span> Access granted. Entering system...
          </div>
        )}

        {/* Google CTA */}
        <button
          className="ml-btn-google"
          onClick={handleGoogle}
          disabled={loading || success}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, border: "2px solid rgba(212,175,55,.3)",
                borderTopColor: "#D4AF37", borderRadius: "50%",
                animation: "ml-rotate-slow .8s linear infinite",
              }} />
              <span style={{ color: "rgba(255,255,255,.5)", letterSpacing: ".06em" }}>
                Authenticating...
              </span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(212,175,55,.6)" strokeWidth="2"
                style={{ marginLeft: "auto" }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="ml-divider">
          <span style={{
            fontSize: 9, letterSpacing: ".2em",
            color: "rgba(255,255,255,.18)",
            textTransform: "uppercase",
          }}>Secure OAuth 2.0</span>
        </div>

        {/* Trust badges */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: 8, marginBottom: 28,
          padding: "12px 14px",
          background: "rgba(255,255,255,.02)",
          border: "1px solid rgba(255,255,255,.05)",
          borderRadius: 10,
        }}>
          {["256-bit TLS", "Zero data sold", "SOC 2 type II"].map((t, i) => (
            <div key={i} className="ml-trust-item">
              <span className="dot" />
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,.25)",
            letterSpacing: ".04em",
          }}>
            No account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              style={{
                color: "#D4AF37", background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, letterSpacing: ".04em",
                textDecoration: "underline", textUnderlineOffset: 3,
                padding: 0,
              }}
            >
              Create one free →
            </button>
          </p>
          <p style={{
            marginTop: 16, fontSize: 9,
            letterSpacing: ".16em",
            color: "rgba(255,255,255,.1)",
            textTransform: "uppercase",
          }}>
            ManifiX AI · Magic16 · {new Date().getFullYear()}
          </p>
        </div>

        {/* Bottom inner glow */}
        <div style={{
          position: "absolute", bottom: 0, left: "30%", right: "30%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(220,60,60,.4), transparent)",
        }} />
      </div>
    </div>
  );
}
