import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/auth.service";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

// ─── INLINE SVG LOGO ────────────────────────────────────────────────────────────
const ManifixLogo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#rpLogoGrad)" />
    <path
      d="M5 25 L5 9 L11.5 9 L16 17.5 L20.5 9 L27 9 L27 25 L22.5 25 L22.5 15.5 L16 25.5 L9.5 15.5 L9.5 25 Z"
      fill="#fff"
    />
    <circle cx="26" cy="8" r="3.5" fill="#D4AF37" />
    <defs>
      <linearGradient id="rpLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0f0f18" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── EYE ICONS ──────────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── PASSWORD STRENGTH ──────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  const map = [
    { label: "Too short",  color: "#f87171" },
    { label: "Weak",       color: "#fb923c" },
    { label: "Fair",       color: "#facc15" },
    { label: "Strong",     color: "#4ade80" },
    { label: "Very strong",color: "#34d399" },
  ];
  return { score, ...map[score] };
}

// ─── STYLES ─────────────────────────────────────────────────────────────────────
const S = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative",
    padding: "24px 16px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(10,10,30,0.88) 100%)",
    backdropFilter: "blur(2px)",
    zIndex: 0,
  },
  loadingOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 999, backdropFilter: "blur(4px)",
  },
  loadingText: {
    color: "#fff", fontSize: "15px", fontWeight: 500,
    letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "10px",
  },
  spinner: {
    width: "18px", height: "18px",
    border: "2.5px solid rgba(255,255,255,0.2)",
    borderTopColor: "#D4AF37",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  card: {
    position: "relative", zIndex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(24px)",
    borderRadius: "20px",
    padding: "44px 40px",
    width: "100%", maxWidth: "420px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
    animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
  },
  // ── Token invalid state ──
  invalidCard: {
    textAlign: "center",
    padding: "52px 40px",
  },
  invalidIcon: {
    fontSize: "48px", marginBottom: "16px", display: "block",
  },
  invalidTitle: {
    fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "8px",
  },
  invalidSub: {
    fontSize: "14px", color: "rgba(255,255,255,0.42)", marginBottom: "24px", lineHeight: 1.6,
  },
  brand: {
    display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px",
  },
  logoWrap: {
    width: "52px", height: "52px", borderRadius: "14px",
    background: "linear-gradient(135deg, #1a1a2e, #0f0f18)",
    border: "1px solid rgba(212,175,55,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "12px",
    boxShadow: "0 8px 24px rgba(212,175,55,0.2)",
  },
  brandName: {
    fontSize: "22px", fontWeight: 700, color: "#D4AF37",
    margin: 0, letterSpacing: "0.14em",
    textShadow: "0 0 20px rgba(212,175,55,0.4)",
  },
  tagline: {
    fontSize: "11px", color: "rgba(255,255,255,0.35)",
    margin: "4px 0 0", letterSpacing: "0.1em", textTransform: "uppercase",
  },
  heading: {
    fontSize: "20px", fontWeight: 600, color: "#fff",
    textAlign: "center", margin: "0 0 6px", letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "13.5px", color: "rgba(255,255,255,0.4)",
    textAlign: "center", margin: "0 0 28px", lineHeight: 1.5,
  },
  fieldWrap: { position: "relative", marginBottom: "14px" },
  label: {
    display: "block", fontSize: "11px", fontWeight: 600,
    color: "rgba(255,255,255,0.45)", marginBottom: "6px",
    letterSpacing: "0.06em", textTransform: "uppercase",
  },
  input: (focused, hasError) => ({
    width: "100%",
    padding: "12px 44px 12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: `1.5px solid ${hasError ? "rgba(248,113,113,0.6)" : focused ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.10)"}`,
    borderRadius: "10px",
    color: "#fff", fontSize: "14.5px", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(212,175,55,0.12)" : "none",
    fontFamily: "inherit",
  }),
  eyeBtn: {
    position: "absolute", right: "12px", bottom: "12px",
    background: "none", border: "none", cursor: "pointer", padding: "2px",
    color: "rgba(255,255,255,0.38)", display: "flex", alignItems: "center",
    transition: "color 0.2s", lineHeight: 1,
  },
  hint: { fontSize: "12px", color: "rgba(248,113,113,0.85)", margin: "-8px 0 10px" },
  // ── Strength bar ──
  strengthWrap: { marginTop: "-6px", marginBottom: "14px" },
  strengthBar: (score) => ({
    height: "3px", borderRadius: "2px",
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden", marginBottom: "4px",
  }),
  strengthFill: (score, color) => ({
    height: "100%", width: `${(score / 4) * 100}%`,
    background: color, borderRadius: "2px",
    transition: "width 0.3s ease, background 0.3s ease",
  }),
  strengthLabel: (color) => ({
    fontSize: "11px", color, letterSpacing: "0.04em", fontWeight: 600,
  }),
  // ── Match indicator ──
  matchRow: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "12px", marginTop: "-8px", marginBottom: "14px",
  },
  errorBox: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.28)",
    borderRadius: "8px", padding: "10px 14px",
    color: "rgba(248,113,113,0.9)", fontSize: "13px",
    margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px",
  },
  successBox: {
    background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.28)",
    borderRadius: "8px", padding: "10px 14px",
    color: "rgba(52,211,153,0.9)", fontSize: "13px",
    margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px",
  },
  primaryBtn: (disabled) => ({
    width: "100%", padding: "13px",
    background: disabled
      ? "rgba(212,175,55,0.2)"
      : "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
    color: disabled ? "rgba(255,255,255,0.3)" : "#000",
    border: "none", borderRadius: "10px",
    fontSize: "15px", fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.06em",
    fontFamily: "inherit",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: disabled ? "none" : "0 6px 20px rgba(212,175,55,0.35)",
  }),
  trust: {
    textAlign: "center", fontSize: "11.5px",
    color: "rgba(255,255,255,0.2)", marginTop: "18px", letterSpacing: "0.03em",
  },
  footer: {
    textAlign: "center", marginTop: "20px",
    fontSize: "13px", color: "rgba(255,255,255,0.35)",
  },
  footerLink: {
    color: "#D4AF37", background: "none", border: "none",
    cursor: "pointer", fontFamily: "inherit",
    fontSize: "13px", fontWeight: 600, padding: 0, marginLeft: "4px",
  },
  // ── Success screen ──
  successScreen: {
    textAlign: "center", padding: "12px 0",
  },
  successIcon: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 20px", fontSize: "28px",
  },
  successTitle: {
    fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "8px",
  },
  successSub: {
    fontSize: "14px", color: "rgba(255,255,255,0.4)",
    lineHeight: 1.6, marginBottom: "24px",
  },
  countdown: {
    fontSize: "12px", color: "rgba(255,255,255,0.3)",
    fontFamily: "'JetBrains Mono', monospace", marginTop: "12px",
  },
};

// ─── FIELD COMPONENT ────────────────────────────────────────────────────────────
function Field({ id, label, value, onChange, onKeyDown, placeholder, error, disabled, show, onToggle }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.fieldWrap}>
      <label htmlFor={id} style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={S.input(focused, !!error)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          style={S.eyeBtn}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOpen /> : <EyeClosed />}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" style={S.hint}>{error}</p>}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [done, setDone]                 = useState(false);
  const [countdown, setCountdown]       = useState(5);
  const [fieldErrors, setFieldErrors]   = useState({ password: "", confirm: "" });

  const strength = getStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  // ── Inject keyframes once ────────────────────────────────────────────────────
  useEffect(() => {
    const id = "manifix-reset-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
      @keyframes spin    { to { transform: rotate(360deg); } }
      @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes popIn   { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
      input::placeholder { color: rgba(255,255,255,0.2); }
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 100px rgba(212,175,55,0.05) inset !important;
        -webkit-text-fill-color: #fff !important;
      }
    `;
    document.head.appendChild(el);
  }, []);

  // ── Auto-redirect countdown after success ───────────────────────────────────
  useEffect(() => {
    if (!done) return;
    if (countdown === 0) { navigate("/login"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [done, countdown, navigate]);

  // ── No token — invalid link screen ──────────────────────────────────────────
  if (!token) {
    return (
      <div style={S.wrapper} role="main">
        <div style={S.overlay} aria-hidden="true" />
        <div style={{ ...S.card, ...S.invalidCard }}>
          <span style={S.invalidIcon}>🔗</span>
          <h2 style={S.invalidTitle}>Invalid Reset Link</h2>
          <p style={S.invalidSub}>
            This password reset link is missing or has expired.<br />
            Please request a new one.
          </p>
          <button
            style={S.primaryBtn(false)}
            onClick={() => navigate("/forgot-password")}
          >
            Request New Link
          </button>
          <p style={S.footer}>
            Remembered it?
            <button style={S.footerLink} onClick={() => navigate("/login")}>
              Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = { password: "", confirm: "" };
    if (!password)             errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Minimum 8 characters";
    else if (strength.score < 2)  errors.password = "Password is too weak";
    if (!confirm)              errors.confirm = "Please confirm your password";
    else if (password !== confirm) errors.confirm = "Passwords do not match";
    setFieldErrors(errors);
    return !errors.password && !errors.confirm;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.confirmResetPassword(token, password);
      setDone(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400 || status === 410) {
        setError("This reset link has expired. Please request a new one.");
      } else {
        setError(err?.message || "Reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleReset(); };
  const clearErr = (f) => setFieldErrors((p) => ({ ...p, [f]: "" }));

  return (
    <div style={S.wrapper} role="main">
      <div style={S.overlay} aria-hidden="true" />

      {/* Loading overlay */}
      {loading && (
        <div style={S.loadingOverlay} aria-live="polite">
          <p style={S.loadingText}>
            <span style={S.spinner} aria-hidden="true" />
            Securing your account…
          </p>
        </div>
      )}

      <div style={S.card} role="region" aria-label="Reset password form">

        {done ? (
          /* ── SUCCESS SCREEN ─────────────────────────────────────────────── */
          <div style={{ ...S.successScreen, animation: "popIn 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={S.successIcon} aria-hidden="true">✓</div>
            <h2 style={S.successTitle}>Password Reset!</h2>
            <p style={S.successSub}>
              Your password has been updated successfully.<br />
              You can now log in with your new password.
            </p>
            <button
              style={S.primaryBtn(false)}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
            <p style={S.countdown} aria-live="polite">
              Redirecting in {countdown}s…
            </p>
          </div>
        ) : (
          /* ── FORM ───────────────────────────────────────────────────────── */
          <>
            {/* Brand */}
            <div style={S.brand}>
              <div style={S.logoWrap}>
                <ManifixLogo />
              </div>
              <h1 style={S.brandName}>MANIFIX</h1>
              <p style={S.tagline}>Intelligence meets Intention</p>
            </div>

            <h2 style={S.heading}>Set New Password</h2>
            <p style={S.subtitle}>
              Choose a strong password to secure your account
            </p>

            {/* Error banner */}
            {error && (
              <div style={S.errorBox} role="alert" aria-live="assertive">
                <span aria-hidden="true">⚠</span> {error}
              </div>
            )}

            {/* New password */}
            <Field
              id="rp-password"
              label="New Password"
              value={password}
              placeholder="Min. 8 characters"
              error={fieldErrors.password}
              disabled={loading}
              show={showPw}
              onToggle={() => setShowPw((p) => !p)}
              onChange={(e) => { setPassword(e.target.value); clearErr("password"); }}
              onKeyDown={handleKeyDown}
            />

            {/* Strength meter */}
            {password.length > 0 && (
              <div style={S.strengthWrap} aria-label={`Password strength: ${strength.label}`}>
                <div style={S.strengthBar(strength.score)}>
                  <div style={S.strengthFill(strength.score, strength.color)} />
                </div>
                <span style={S.strengthLabel(strength.color)}>{strength.label}</span>
              </div>
            )}

            {/* Confirm password */}
            <Field
              id="rp-confirm"
              label="Confirm Password"
              value={confirm}
              placeholder="Re-enter your password"
              error={fieldErrors.confirm}
              disabled={loading}
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
              onChange={(e) => { setConfirm(e.target.value); clearErr("confirm"); }}
              onKeyDown={handleKeyDown}
            />

            {/* Match indicator */}
            {confirm.length > 0 && (
              <div style={S.matchRow} aria-live="polite">
                <span style={{ fontSize: "14px" }}>
                  {passwordsMatch ? "✓" : "✗"}
                </span>
                <span style={{
                  fontSize: "12px",
                  color: passwordsMatch ? "rgba(52,211,153,0.85)" : "rgba(248,113,113,0.75)",
                }}>
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              style={S.primaryBtn(loading)}
              onClick={handleReset}
              disabled={loading}
              aria-busy={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(1px)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? "Updating…" : "Reset Password"}
            </button>

            {/* Trust */}
            <p style={S.trust} aria-hidden="true">
              🔒 256-bit encrypted · Your data is never stored in plain text
            </p>

            {/* Footer */}
            <p style={S.footer}>
              Remembered your password?
              <button
                type="button"
                style={S.footerLink}
                onClick={() => navigate("/login")}
                aria-label="Go back to login"
              >
                Back to Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
