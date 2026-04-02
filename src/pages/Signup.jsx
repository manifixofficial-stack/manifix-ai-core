import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

import logo from "../assets/logo.svg";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import "../styles/Login.css";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Live validation
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidPassword = (password) => password.length >= 6;

  const handleEmailSignup = async () => {
    setError("");
    setSuccess("");

    if (!isValidEmail(email)) {
      return setError("Enter a valid email address");
    }

    if (!isValidPassword(password)) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const user = await authService.signUp(
        email.trim().toLowerCase(),
        password
      );

      if (!user) throw new Error("Signup failed");

      // 🎉 Success UX
      setSuccess("Account created successfully 🎉");

      setTimeout(() => {
        navigate("/app/dashboard", { replace: true });
      }, 1200);

    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      await authService.loginWithGoogle();
      // redirect handled externally
    } catch (err) {
      setError(err.message || "Google signup failed");
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-wrapper"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay" />

      {/* 🔥 Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          Creating your account...
        </div>
      )}

      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        {/* Title */}
        <h2>Create Account</h2>
        <p className="subtitle">Start your aligned journey</p>

        {/* 🔥 Google button */}
        <button
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <img
            src="https://img.icons8.com/color/24/google-logo.png"
            alt="google"
          />
          Continue with Google
        </button>

        <div className="divider">
          <span>or use email</span>
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        {/* Password with toggle 👁 */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password (min 6 chars)"
            value={password}
            disabled={loading}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          <span
            className="toggle-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁"}
          </span>
        </div>

        {/* Live hint */}
        {password && password.length < 6 && (
          <p className="hint">Password is too short</p>
        )}

        {/* Status */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Submit */}
        <button
          className="primary-btn"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        {/* Trust line */}
        <p className="trust">
          🔒 Secure • No spam • Private
        </p>

        {/* Login link */}
        <p className="microcopy">
          Already have an account?
          <span className="link" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
