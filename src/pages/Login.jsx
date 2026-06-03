import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

/* ─────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("login-styles")) return;
  const s = document.createElement("style");
  s.id = "login-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes lg-scan {
      from { top: -4px; }
      to   { top: 100%; }
    }
    @keyframes lg-grid {
      0%,100% { opacity:.04; }
      50%     { opacity:.08; }
    }
    @keyframes lg-breathe {
      0%,100% { opacity:.12; transform:translateX(-50%) scale(1); }
      50%     { opacity:.22; transform:translateX(-50%) scale(1.08); }
    }
    @keyframes lg-fade-up {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes lg-shimmer {
      from { background-position:-200% center; }
      to   { background-position:200% center; }
    }
    @keyframes lg-blink {
      0%,100% { opacity:1; }
      50%     { opacity:0; }
    }
    @keyframes lg-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes lg-glitch1 {
      0%,100% { clip-path:inset(0 0 95% 0); transform:translateX(0); }
      20%     { clip-path:inset(30% 0 50% 0); transform:translateX(-3px); }
      40%     { clip-path:inset(60% 0 10% 0); transform:translateX(3px); }
      80%     { clip-path:inset(80% 0 5% 0); transform:translateX(-2px); }
    }
    @keyframes lg-glitch2 {
      0%,100% { clip-path:inset(50% 0 30% 0); opacity:0; }
      25%     { clip-path:inset(20% 0 60% 0); transform:translateX(5px); opacity:1; }
      75%     { clip-path:inset(70% 0 10% 0); transform:translateX(-5px); opacity:1; }
    }

    .lg-fade-up  { animation: lg-fade-up 0.5s ease both; }
    .lg-shimmer  {
      background: linear-gradient(90deg,#c8a84b,#ffe08a,#ffc83c,#ffe08a,#c8a84b);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: lg-shimmer 3s linear infinite;
    }
    .lg-glitch { position:relative; }
    .lg-glitch::before {
      content: attr(data-text);
      position: absolute; inset:0;
      font-family:inherit; font-size:inherit;
      letter-spacing:inherit; color:#ff3c3c;
      animation: lg-glitch1 3s infinite;
    }
    .lg-glitch::after {
      content: attr(data-text);
      position: absolute; inset:0;
      font-family:inherit; font-size:inherit;
      letter-spacing:inherit; color:#c8a84b;
      animation: lg-glitch2 3s infinite;
    }

    .lg-btn-primary {
      width:100%; padding:15px 0;
      background:#ffc83c; color:#080808;
      border:none; cursor:pointer;
      font-family:'DM Mono',monospace;
      font-size:12px; font-weight:700;
      letter-spacing:.22em; text-transform:uppercase;
      transition:background .15s, transform .1s;
    }
    .lg-btn-primary:hover:not(:disabled) { background:#ffe08a; }
    .lg-btn-primary:active:not(:disabled) { transform:scale(.99); }
    .lg-btn-primary:disabled {
      background:#111; color:#2a2a2a;
      border:1px solid #1a1a1a; cursor:not-allowed;
    }

    .lg-btn-google {
      width:100%; padding:13px 0;
      background:transparent;
      border:1px solid #1e1e1e; color:#555;
      font-family:'DM Mono',monospace;
      font-size:11px; font-weight:500;
      letter-spacing:.15em; text-transform:uppercase;
      cursor:pointer; display:flex;
      align-items:center; justify-content:center; gap:10px;
      transition:border-color .2s, color .2s;
    }
    .lg-btn-google:hover { border-color:#2e2e2e; color:#888; }

    .lg-check {
      accent-color:#ffc83c;
      cursor:pointer;
      width:14px; height:14px;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   GOOGLE ICON
───────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();

  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    injectStyles();
  }, []);

  const handleLogin = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authService.login(remember);
      setSuccess("Access granted. Entering system...");
      setTimeout(() => navigate("/app/dashboard"), 1000);
    } catch (err) {
      setError(
        err?.response?.status === 401
          ? "Access denied. Try again."
          : err?.message || "Authentication failed. Retry."
      );
    } finally {
      setLoading(false);
    }
  }, [remember, navigate]);

  const handleGoogle = async () => {
    try {
      await authService.loginWithGoogle?.();
    } catch {
      setError("Google authentication failed.");
    }
  };

  /* ── RENDER ── */
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#080808",
      fontFamily: "'DM Mono','Courier New',monospace",
      color: "#e8e4d9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "24px 16px",
    }}>

      {/* bg grid */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,200,60,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "lg-grid 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* ambient glow */}
      <div style={{
        position: "fixed",
        top: "30%", left: "50%",
        width: 500, height: 300,
        background: "radial-gradient(ellipse,rgba(200,168,75,.1) 0%,transparent 70%)",
        animation: "lg-breathe 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* scan line */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg,transparent,rgba(255,200,60,.06),rgba(255,200,60,.12),rgba(255,200,60,.06),transparent)",
        animation: "lg-scan 3.5s linear infinite",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* corner marks */}
      {[
        { top:16, left:16,   borderTopWidth:2, borderLeftWidth:2   },
        { top:16, right:16,  borderTopWidth:2, borderRightWidth:2  },
        { bottom:16, left:16,  borderBottomWidth:2, borderLeftWidth:2   },
        { bottom:16, right:16, borderBottomWidth:2, borderRightWidth:2  },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed", width: 18, height: 18,
          borderColor: "#1e1e1e", borderStyle: "solid", borderWidth: 0,
          ...pos,
        }} />
      ))}

      {/* loading overlay */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(8,8,8,.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, flexDirection: "column", gap: 16,
        }}>
          <div style={{
            width: 24, height: 24,
            border: "2px solid #1e1e1e",
            borderTopColor: "#ffc83c",
            borderRadius: "50%",
            animation: "lg-spin .7s linear infinite",
          }} />
          <div style={{
            fontSize: 10, letterSpacing: ".25em",
            color: "#333", textTransform: "uppercase",
          }}>Authenticating...</div>
        </div>
      )}

      {/* ── CARD ── */}
      <div className="lg-fade-up" style={{
        position: "relative", zIndex: 1,
        width: "min(400px,96vw)",
        border: "1px solid #1a1a1a",
        background: "#0b0b0b",
        padding: "36px 32px",
      }}>

        {/* inner scan */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: "25%",
          background: "linear-gradient(180deg,transparent,rgba(200,168,75,.03),transparent)",
          animation: "lg-scan 3s ease-in-out infinite",
          pointerEvents: "none", top: 0,
        }} />

        {/* ── LOGO ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>

          {/* system status dot */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: "1px solid #1e1e1e", padding: "4px 12px",
            marginBottom: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#ffc83c",
              animation: "lg-blink 1.2s ease-in-out infinite",
              display: "inline-block",
            }} />
            <span style={{
              fontSize: 8, letterSpacing: ".25em",
              color: "#3a3a3a", textTransform: "uppercase",
            }}>System online</span>
          </div>

          {/* main logo */}
          <div
            className="lg-glitch"
            data-text="MANIFIX"
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 64, letterSpacing: ".08em",
              lineHeight: 1, color: "#e8e4d9",
              marginBottom: 4,
            }}
          >
            MANIFIX
          </div>

          {/* AI badge */}
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 18, letterSpacing: ".3em",
            marginBottom: 8,
          }} className="lg-shimmer">
            AI
          </div>

          <div style={{
            fontSize: 9, letterSpacing: ".22em",
            color: "#2a2a2a", textTransform: "uppercase",
          }}>
            Intelligence meets intention
          </div>
        </div>

        {/* ── HEADING ── */}
        <div style={{
          fontSize: 9, letterSpacing: ".22em",
          color: "#2e2e2e", textTransform: "uppercase",
          marginBottom: 20, borderLeft: "2px solid #1e1e1e",
          paddingLeft: 10,
        }}>
          Neural access portal
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            border: "1px solid #2a1010", background: "#0a0808",
            padding: "10px 12px", marginBottom: 14,
            fontSize: 10, letterSpacing: ".1em",
            color: "#ff5c5c", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── SUCCESS ── */}
        {success && (
          <div style={{
            border: "1px solid #1e4d1e", background: "#0a140a",
            padding: "10px 12px", marginBottom: 14,
            fontSize: 10, letterSpacing: ".1em",
            color: "#4ade80", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✓</span> {success}
          </div>
        )}

        {/* ── REMEMBER + FORGOT ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 20,
        }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", fontSize: 10,
            letterSpacing: ".12em", color: "#2a2a2a",
            textTransform: "uppercase",
          }}>
            <input
              type="checkbox"
              className="lg-check"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{
              fontSize: 10, letterSpacing: ".12em",
              color: "#ffc83c", background: "none",
              border: "none", cursor: "pointer",
              fontFamily: "inherit", textTransform: "uppercase",
              padding: 0,
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* ── PRIMARY CTA ── */}
        <button
          type="button"
          className="lg-btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ marginBottom: 12 }}
        >
          {loading ? "Authenticating..." : "Enter System →"}
        </button>

        {/* ── DIVIDER ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          margin: "16px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: "#141414" }} />
          <span style={{
            fontSize: 8, letterSpacing: ".2em",
            color: "#1e1e1e", textTransform: "uppercase",
          }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#141414" }} />
        </div>

        {/* ── GOOGLE ── */}
        <button
          type="button"
          className="lg-btn-google"
          onClick={handleGoogle}
          disabled={loading}
          style={{ marginBottom: 24 }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* ── TRUST LINE ── */}
        <div style={{
          border: "1px solid #111", background: "#0c0c0c",
          padding: "8px 12px", marginBottom: 20,
          display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          {["256-bit encrypted", "Zero data sold", "SOC 2"].map((t, i) => (
            <span key={i} style={{
              fontSize: 8, letterSpacing: ".12em",
              color: "#222", textTransform: "uppercase",
            }}>✓ {t}</span>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          textAlign: "center", fontSize: 10,
          letterSpacing: ".12em", color: "#2a2a2a",
          textTransform: "uppercase",
        }}>
          No account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            style={{
              color: "#ffc83c", background: "none",
              border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 10,
              letterSpacing: ".12em", textTransform: "uppercase",
              padding: 0,
            }}
          >
            Create one free →
          </button>
        </div>

        {/* ── FOOTER BRAND ── */}
        <div style={{
          textAlign: "center", marginTop: 20,
          fontSize: 8, letterSpacing: ".22em",
          color: "#141414", textTransform: "uppercase",
        }}>
          ManifiX AI · Magic16 · {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
