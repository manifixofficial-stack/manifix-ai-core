import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/auth.service";

function injectStyles() {
  if (document.getElementById("manifix-signup-styles")) return;
  const s = document.createElement("style");
  s.id = "manifix-signup-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Outfit:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes su-particle {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: .5; }
      100% { transform: translateY(-120vh) translateX(var(--dx)) scale(.2); opacity: 0; }
    }
    @keyframes su-rotate { to { transform: rotate(360deg); } }
    @keyframes su-rotate-rev { to { transform: rotate(-360deg); } }
    @keyframes su-pulse-ring {
      0%   { transform: scale(.9); opacity: .6; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @keyframes su-shimmer-gold {
      0%   { background-position: -300% center; }
      100% { background-position: 300% center; }
    }
    @keyframes su-card-in {
      from { opacity: 0; transform: translateY(50px) scale(.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes su-glow {
      0%,100% { opacity: .15; }
      50%      { opacity: .32; }
    }
    @keyframes su-scan {
      0%   { top: -2px; opacity: 0; }
      5%   { opacity: 1; }
      95%  { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes su-float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes su-blink {
      0%,100% { opacity: 1; }
      50%      { opacity: .15; }
    }
    @keyframes su-stagger-in {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes su-hex-drift {
      0%   { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-30px) rotate(180deg); }
    }
    @keyframes su-perk-hover {
      0%,100% { background: rgba(212,175,55,.04); }
      50%      { background: rgba(212,175,55,.08); }
    }

    .su-shimmer {
      background: linear-gradient(90deg,#c8a030,#ffd966,#f5bc00,#ffe88a,#c8a030);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: su-shimmer-gold 4s linear infinite;
    }

    .su-card {
      animation: su-card-in .75s cubic-bezier(.16,1,.3,1) both;
    }

    .su-btn-google {
      position: relative;
      width: 100%;
      padding: 17px 24px;
      background: linear-gradient(135deg, #161616 0%, #0e0e0e 100%);
      border: 1px solid rgba(212,175,55,.3);
      border-radius: 14px;
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
      transition: all .25s;
      overflow: hidden;
    }
    .su-btn-google::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(212,175,55,.07) 0%, transparent 60%);
      opacity: 0;
      transition: opacity .25s;
    }
    .su-btn-google:hover {
      border-color: rgba(212,175,55,.65);
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(212,175,55,.15), 0 2px 8px rgba(0,0,0,.4);
    }
    .su-btn-google:hover::after { opacity: 1; }
    .su-btn-google:active { transform: translateY(0) scale(.99); }
    .su-btn-google:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: none; }

    .su-perk {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid rgba(255,255,255,.05);
      border-radius: 10px;
      background: rgba(255,255,255,.02);
      transition: border-color .2s, background .2s;
      animation: su-stagger-in .5s ease both;
    }
    .su-perk:hover {
      border-color: rgba(212,175,55,.15);
      background: rgba(212,175,55,.04);
    }
    .su-perk-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(212,175,55,.25);
      background: rgba(212,175,55,.06);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .su-ring-outer { animation: su-rotate 14s linear infinite; }
    .su-ring-inner { animation: su-rotate-rev 9s linear infinite; }
    .su-pulse { animation: su-pulse-ring 2.2s ease-out infinite; }
    .su-float { animation: su-float 4.5s ease-in-out infinite; }
    .su-particle {
      position: fixed; bottom: -10px;
      border-radius: 50%;
      pointer-events: none;
      animation: su-particle var(--dur) ease-in var(--delay) infinite;
    }
    .su-scan-line {
      position: fixed; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg,transparent,rgba(212,175,55,.12),rgba(212,175,55,.25),rgba(212,175,55,.12),transparent);
      animation: su-scan 6s linear infinite;
      pointer-events: none; z-index: 0;
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

const perks = [
  { icon: "⚡", title: "16-Day Protocol", desc: "Full structured AI-guided program on activation" },
  { icon: "🔒", title: "Zero password risk", desc: "OAuth secured — Google manages your credentials" },
  { icon: "✦", title: "Instant access", desc: "No email verification. One click, you're in" },
];

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${4 + Math.random() * 92}%`,
  dur: `${7 + Math.random() * 9}s`,
  delay: `${Math.random() * 9}s`,
  dx: `${(Math.random() - .5) * 70}px`,
  color: i % 5 === 0 ? "rgba(200,45,45,.55)" : i % 3 === 0 ? "rgba(212,175,55,.65)" : "rgba(212,175,55,.3)",
  size: `${2 + Math.random() * 2.5}px`,
}));

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle?.();
      if (!user) throw new Error("Sign-in cancelled");
      setSuccess(true);
      setTimeout(() => navigate("/onboarding", { replace: true }), 1200);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in was closed. Please try again.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("Domain not authorised. Add it in Firebase → Authentication → Authorised Domains.");
      } else {
        setError(err?.message || "Google sign-in failed. Please try again.");
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
        <div key={p.id} className="su-particle" style={{
          left: p.left, width: p.size, height: p.size, background: p.color,
          "--dur": p.dur, "--delay": p.delay, "--dx": p.dx,
        }} />
      ))}

      {/* Scan line */}
      <div className="su-scan-line" />

      {/* Ambient glows */}
      <div style={{
        position: "fixed", top: "-5%", right: "5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,.07) 0%, transparent 65%)",
        filter: "blur(30px)", animation: "su-glow 6s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "0%", left: "0%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,40,40,.06) 0%, transparent 60%)",
        filter: "blur(30px)", animation: "su-glow 8s ease-in-out infinite 1s",
        pointerEvents: "none",
      }} />

      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(212,175,55,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.022) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Corner brackets */}
      {[
        { top: 20, left: 20, borderTop: "1px solid rgba(212,175,55,.28)", borderLeft: "1px solid rgba(212,175,55,.28)" },
        { top: 20, right: 20, borderTop: "1px solid rgba(212,175,55,.28)", borderRight: "1px solid rgba(212,175,55,.28)" },
        { bottom: 20, left: 20, borderBottom: "1px solid rgba(212,175,55,.28)", borderLeft: "1px solid rgba(212,175,55,.28)" },
        { bottom: 20, right: 20, borderBottom: "1px solid rgba(212,175,55,.28)", borderRight: "1px solid rgba(212,175,55,.28)" },
      ].map((pos, i) => (
        <div key={i} style={{ position: "fixed", width: 24, height: 24, ...pos }} />
      ))}

      {/* CARD */}
      <div className="su-card" style={{
        position: "relative", zIndex: 1,
        width: "min(440px, 96vw)",
        background: "linear-gradient(160deg, #0f0f12 0%, #0a0a0d 60%, #0d0a0a 100%)",
        border: "1px solid rgba(212,175,55,.18)",
        borderRadius: 22,
        padding: "44px 36px",
        boxShadow: "0 40px 100px rgba(0,0,0,.75), 0 0 0 1px rgba(212,175,55,.07), inset 0 1px 0 rgba(212,175,55,.1)",
        overflow: "hidden",
      }}>

        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,.55), transparent)",
        }} />

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="su-float" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", position: "relative",
            width: 88, height: 88, marginBottom: 18,
          }}>
            <div className="su-ring-outer" style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(212,175,55,.28)",
              borderTopColor: "rgba(212,175,55,.75)",
            }} />
            <div className="su-ring-inner" style={{
              position: "absolute", inset: 10, borderRadius: "50%",
              border: "1px dashed rgba(212,175,55,.15)",
              borderBottomColor: "rgba(220,55,55,.55)",
            }} />
            <div className="su-pulse" style={{
              position: "absolute", inset: 6, borderRadius: "50%",
              border: "1px solid rgba(212,175,55,.25)",
            }} />
            <div style={{
              width: 48, height: 48, borderRadius: 11,
              background: "linear-gradient(135deg, #1c1c1c, #101010)",
              border: "1px solid rgba(212,175,55,.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cinzel', serif",
              fontSize: 20, fontWeight: 700, color: "#D4AF37",
              boxShadow: "0 0 18px rgba(212,175,55,.12)",
            }}>M</div>
          </div>

          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 26, fontWeight: 700,
            letterSpacing: ".2em", marginBottom: 5,
          }} className="su-shimmer">MANIFIX AI</h1>

          <p style={{
            fontSize: 10, letterSpacing: ".22em",
            color: "rgba(255,255,255,.22)",
            textTransform: "uppercase",
          }}>Initiate 16-Day Protocol</p>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 12, padding: "4px 14px",
            border: "1px solid rgba(212,175,55,.12)",
            borderRadius: 20, background: "rgba(212,175,55,.05)",
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%", background: "#D4AF37",
              boxShadow: "0 0 6px rgba(212,175,55,.8)",
              animation: "su-blink 2.2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 9, letterSpacing: ".18em",
              color: "rgba(212,175,55,.55)",
              textTransform: "uppercase",
            }}>Free forever plan included</span>
          </div>
        </div>

        {/* Perks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          {perks.map((p, i) => (
            <div key={i} className="su-perk" style={{ animationDelay: `${i * .1 + .2}s` }}>
              <div className="su-perk-icon">{p.icon}</div>
              <div>
                <p style={{
                  fontSize: 13, fontWeight: 500,
                  color: "rgba(255,255,255,.85)", marginBottom: 2,
                }}>{p.title}</p>
                <p style={{
                  fontSize: 11, color: "rgba(255,255,255,.35)",
                  lineHeight: 1.4,
                }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: "12px 16px",
            background: "rgba(220,38,38,.08)",
            border: "1px solid rgba(220,38,38,.22)",
            borderLeft: "3px solid #dc2626",
            borderRadius: 8, fontSize: 12,
            color: "#f87171", letterSpacing: ".03em",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ marginTop: 1 }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            marginBottom: 16, padding: "12px 16px",
            background: "rgba(34,197,94,.07)",
            border: "1px solid rgba(34,197,94,.22)",
            borderLeft: "3px solid #22c55e",
            borderRadius: 8, fontSize: 12,
            color: "#4ade80", letterSpacing: ".03em",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            ✓ Account created! Launching onboarding...
          </div>
        )}

        {/* Google CTA */}
        <button
          className="su-btn-google"
          onClick={handleGoogleSignup}
          disabled={loading || success}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, border: "2px solid rgba(212,175,55,.25)",
                borderTopColor: "#D4AF37", borderRadius: "50%",
                animation: "su-rotate .8s linear infinite",
              }} />
              <span style={{ color: "rgba(255,255,255,.45)" }}>Connecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="rgba(212,175,55,.55)" strokeWidth="2"
                style={{ marginLeft: "auto" }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>

        {/* Terms */}
        <p style={{
          textAlign: "center", marginTop: 14,
          fontSize: 10, color: "rgba(255,255,255,.2)",
          lineHeight: 1.7, letterSpacing: ".02em",
        }}>
          By continuing you agree to our{" "}
          <Link to="/terms" style={{ color: "rgba(212,175,55,.6)", textDecoration: "none" }}>Terms</Link>
          {" & "}
          <Link to="/privacy" style={{ color: "rgba(212,175,55,.6)", textDecoration: "none" }}>Privacy Policy</Link>
        </p>

        {/* Divider */}
        <div style={{
          height: 1, margin: "22px 0",
          background: "linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent)",
        }} />

        {/* Footer nav */}
        <p style={{
          textAlign: "center", fontSize: 12,
          color: "rgba(255,255,255,.25)", letterSpacing: ".03em",
        }}>
          Already enrolled?{" "}
          <Link to="/login" style={{
            color: "#D4AF37", textDecoration: "none",
            fontWeight: 500,
          }}>
            Access Vault →
          </Link>
        </p>

        <p style={{
          textAlign: "center", marginTop: 18,
          fontSize: 9, letterSpacing: ".18em",
          color: "rgba(255,255,255,.1)",
          textTransform: "uppercase",
        }}>
          ManifiX AI · Magic16 · {new Date().getFullYear()}
        </p>

        {/* Bottom glow */}
        <div style={{
          position: "absolute", bottom: 0, left: "25%", right: "25%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(220,55,55,.35), transparent)",
        }} />
      </div>
    </div>
  );
}
