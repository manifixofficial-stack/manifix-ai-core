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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper validation
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidPassword = (password) => password.length >= 6;

  const handleEmailSignup = async () => {
    setError("");

    if (!isValidEmail(email)) return setError("Please enter a valid email.");
    if (!isValidPassword(password))
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const user = await authService.signUp(email.trim(), password);
      if (user) navigate("/app", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      if (user) navigate("/app", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Google sign-up failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-wrapper"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="overlay" />
      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        {/* Signup Form */}
        <h2>Create Account</h2>
        <p className="subtitle">Join the daily alignment journey</p>

        {/* Google Signup */}
        <button
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
          aria-label="Continue with Google"
        >
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

        <div className="divider">
          <span>or continue with email</span>
        </div>

        {/* Email Input */}
        <label htmlFor="signup-email" className="sr-only">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={({ target: { value } }) => setEmail(value)}
          disabled={loading}
          required
          aria-required="true"
        />

        {/* Password Input */}
        <label htmlFor="signup-password" className="sr-only">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={({ target: { value } }) => setPassword(value)}
          disabled={loading}
          required
          aria-required="true"
        />

        {/* Error message */}
        {error && <p className="error" role="alert">{error}</p>}

        {/* Signup Button */}
        <button
          className="primary-btn"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        {/* Login Link */}
        <p className="microcopy">
          Already have an account?{" "}
          <span
            className="link"
            onClick={() => navigate("/login")}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
