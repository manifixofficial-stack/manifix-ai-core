import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import logo from "../assets/logo.svg";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

// ─── Inline styles (no external CSS dependency) ───────────────────────────────
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
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(10,10,30,0.85) 100%)",
    backdropFilter: "blur(2px)",
    zIndex: 0,
  },
  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },
  loadingText: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: 500,
    letterSpacing: "0.04em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2.5px solid rgba(255,255,255,0.25)",
    borderTopColor: "#a78bfa",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(24px)",
    borderRadius: "20px",
    padding: "44px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow:
      "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
    animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "28px",
  },
  logoWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
    boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
  },
  logoImg: { width: "28px", height: "28px", filter: "brightness(0) invert(1)" },
  brandName: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.4)",
    margin: "4px 0 0",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#fff",
    textAlign: "center",
    margin: "0 0 6px",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
    margin: "0 0 28px",
  },
  fieldWrap: {
    position: "relative",
    marginBottom: "14px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "rgba(255,255,255,0.5)",
    marginBottom: "6px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  input: (focused, hasError) => ({
    width: "100%",
    padding: "12px 44px 12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: `1.5px solid ${
      hasError
        ? "rgba(248,113,113,0.6)"
        : focused
        ? "rgba(167,139,250,0.7)"
        : "rgba(255,255,255,0.10)"
    }`,
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14.5px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
    fontFamily: "inherit",
  }),
  eyeBtn: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    color: "rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s",
    lineHeight: 1,
  },
  hint: {
    fontSize: "12px",
    color: "rgba(248,113,113,0.85)",
    margin: "-8px 0 10px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "2px 0 20px",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    userSelect: "none",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#7c3aed",
    cursor: "pointer",
  },
  forgotLink: {
    fontSize: "13px",
    color: "#a78bfa",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  primaryBtn: (disabled) => ({
    width: "100%",
    padding: "13px",
    background: disabled
      ? "rgba(124,58,237,0.35)"
      : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    color: disabled ? "rgba(255,255,255,0.4)" : "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.01em",
    fontFamily: "inherit",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: disabled ? "none" : "0 6px 20px rgba(124,58,237,0.4)",
    transform: "translateY(0)",
  }),
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
    color: "rgba(255,255,255,0.2)",
    fontSize: "12px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.08)",
  },
  socialBtn: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.10)",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontFamily: "inherit",
    transition: "background 0.2s, border-color 0.2s",
    marginBottom: "10px",
  },
  errorBox: {
    background: "rgba(248,113,113,0.10)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "rgba(248,113,113,0.9)",
    fontSize: "13px",
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successBox: {
    background: "rgba(52,211,153,0.10)",
    border: "1px solid rgba(52,211,153,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "rgba(52,211,153,0.9)",
    fontSize: "13px",
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  footer: {
    textAlign: "center",
    marginTop: "22px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.38)",
  },
  footerLink: {
    color: "#a78bfa",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 500,
    padding: 0,
    marginLeft: "4px",
  },
  trust: {
    textAlign: "center",
    fontSize: "11.5px",
    color: "rgba(255,255,255,0.22)",
    marginTop: "18px",
    letterSpacing: "0.03em",
  },
};

// ─── Eye Icons ─────────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7l-6.5 5C9.8 39.6 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.2-2.7-.4-4z"/>
  </svg>
);

// ─── Field Component ───────────────────────────────────────────────────────────
function Field({ id, label, type, value, onChange, onKeyDown, placeholder, error, disabled, showToggle, showPassword, onToggle }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.fieldWrap}>
      <label htmlFor={id} style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={showToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={type === "password" ? "current-password" : "email"}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={S.input(focused, !!error)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={S.eyeBtn}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" style={S.hint}>{error}</p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const emailRef = useRef(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Inject keyframe animations once
  useEffect(() => {
    const styleId = "manifix-login-keyframes";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      input::placeholder { color: rgba(255,255,255,0.22); }
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 100px rgba(124,58,237,0.08) inset !important;
        -webkit-text-fill-color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);

  const validate = () => {
    const errors = { email: "", password: "" };
    if (!email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return !errors.email && !errors.password;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    setSuccess("");
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.login(email.trim().toLowerCase(), password, remember);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      // Generic message — never leak "user not found" vs "wrong password"
      setError(
        err?.response?.status === 401
          ? "Incorrect email or password."
          : err?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const clearFieldError = (field) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      await authService.loginWithGoogle?.();
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  const isDisabled = loading;

  return (
    <div style={S.wrapper} role="main">
      <div style={S.overlay} aria-hidden="true" />

      {/* Loading overlay */}
      {loading && (
        <div style={S.loadingOverlay} aria-live="polite" aria-label="Authenticating">
          <p style={S.loadingText}>
            <span style={S.spinner} aria-hidden="true" />
            Authenticating securely…
          </p>
        </div>
      )}

      <div style={S.card} role="region" aria-label="Login form">

        {/* Brand */}
        <div style={S.brand}>
          <div style={S.logoWrap} aria-hidden="true">
            <img src={logo} alt="" style={S.logoImg} />
          </div>
          <h1 style={S.brandName}>ManifiX</h1>
          <p style={S.tagline}>Intelligence meets Intention</p>
        </div>

        <h2 style={S.heading}>Welcome back</h2>
        <p style={S.subtitle}>Sign in to your account to continue</p>

        {/* Status banners */}
        {error && (
          <div style={S.errorBox} role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠</span> {error}
          </div>
        )}
        {success && (
          <div style={S.successBox} role="status" aria-live="polite">
            <span aria-hidden="true">✓</span> {success}
          </div>
        )}

        {/* Email */}
        <Field
          id="login-email"
          label="Email address"
          type="email"
          value={email}
          placeholder="you@example.com"
          error={fieldErrors.email}
          disabled={isDisabled}
          onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
          onKeyDown={handleKeyDown}
        />

        {/* Password */}
        <Field
          id="login-password"
          label="Password"
          type="password"
          value={password}
          placeholder="••••••••"
          error={fieldErrors.password}
          disabled={isDisabled}
          showToggle
          showPassword={showPassword}
          onToggle={() => setShowPassword((p) => !p)}
          onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
          onKeyDown={handleKeyDown}
        />

        {/* Remember + Forgot */}
        <div style={S.row}>
          <label style={S.checkLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={S.checkbox}
              aria-label="Remember me"
            />
            Remember me
          </label>
          <button
            type="button"
            style={S.forgotLink}
            onClick={() => navigate("/forgot-password")}
            aria-label="Go to forgot password page"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          style={S.primaryBtn(isDisabled)}
          onClick={handleLogin}
          disabled={isDisabled}
          aria-busy={loading}
          aria-label="Sign in to ManifiX"
          onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = "translateY(1px)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        {/* Divider */}
        <div style={S.divider} aria-hidden="true">
          <span style={S.dividerLine} />
          or continue with
          <span style={S.dividerLine} />
        </div>

        {/* Google */}
        <button
          type="button"
          style={S.socialBtn}
          onClick={handleGoogle}
          disabled={isDisabled}
          aria-label="Sign in with Google"
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        {/* Trust line */}
        <p style={S.trust} aria-hidden="true">
          🔒 256-bit encrypted · SOC 2 compliant · Zero data sold
        </p>

        {/* Footer */}
        <p style={S.footer}>
          Don't have an account?
          <button
            type="button"
            style={S.footerLink}
            onClick={() => navigate("/register")}
            aria-label="Go to registration page"
          >
            Create one free
          </button>
        </p>
      </div>
    </div>
  );
}
