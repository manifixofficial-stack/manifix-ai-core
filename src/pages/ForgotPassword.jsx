import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

import logo from "../assets/logo.svg";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import "../styles/Login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [timer, setTimer] = useState(0);

  // ✅ Live email validation
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // ⏱ Resend countdown
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleReset = async () => {
    setError("");
    setMessage("");

    if (!isValidEmail(email)) {
      return setError("Enter a valid email address");
    }

    setLoading(true);

    try {
      await authService.resetPassword(email.trim().toLowerCase());

      // 🎉 Premium success UX
      setMessage("📩 Check your inbox. We sent a secure reset link.");
      setTimer(30); // start resend timer

    } catch (err) {
      setError(err?.message || "Reset failed. Try again.");
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

      {/* 🔥 Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          Sending secure link...
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
        <h2>Reset Password</h2>
        <p className="subtitle">
          Enter your email to receive a secure reset link
        </p>

        {/* Email input */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          disabled={loading}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        {/* Live validation hint */}
        {email && !isValidEmail(email) && (
          <p className="hint">Enter a valid email</p>
        )}

        {/* Status */}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {/* Button */}
        <button
          className="primary-btn"
          onClick={handleReset}
          disabled={loading || timer > 0}
        >
          {timer > 0
            ? `Resend in ${timer}s`
            : loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        {/* Trust */}
        <p className="trust">
          🔒 Secure reset • No spam • Privacy protected
        </p>

        {/* Back to login */}
        <p className="microcopy">
          Remembered your password?
          <span className="link" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
