import { useState } from "react";
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

  const handleReset = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay" />
      <div className="auth-card">
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        <h2>Reset Password</h2>
        <p className="subtitle">Enter your email to reset your password</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <button className="primary-btn" onClick={handleReset} disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="microcopy">
          Remembered your password? <span className="link" onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
