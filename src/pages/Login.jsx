// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { useApp } from "../context/AppProvider";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser, loading: appLoading } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- Redirect if already logged in ----------------
  useEffect(() => {
    if (!appLoading && user) {
      navigate("/app/gpt", { replace: true });
    }
  }, [user, appLoading, navigate]);

  // ---------------- Email login ----------------
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const loggedUser = await authService.login(email.trim(), password);

      if (!loggedUser) throw new Error("Invalid credentials");

      // Set user in AppProvider context
      setUser(loggedUser);

      navigate("/app/gpt", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Google OAuth login ----------------
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Redirect to Google login; on return, AppProvider handles user
      await authService.loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Google login failed");
      setLoading(false);
    }
  };

  // ---------------- Show loading while AppProvider checks session ----------------
  if (appLoading) {
    return (
      <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay" />
        <div className="auth-card">
          <div className="brand">
            <img src={logo} alt="ManifiX Logo" className="logo" />
            <h1>ManifiX</h1>
            <p className="tagline">Intelligence meets Intention</p>
          </div>
          <p>Checking your session...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay" />

      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        <h2>Welcome Back</h2>

        {/* Google Login */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img
            src="https://img.icons8.com/color/24/google-logo.png"
            alt="Google"
          />
          {loading ? "Processing..." : "Continue with Google"}
        </button>

        {/* Email login */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <p className="error">{error}</p>}

        <button
          className="primary-btn"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? "Processing..." : "Login"}
        </button>

        {/* Links */}
        <p className="microcopy">
          Forgot password?{" "}
          <span className="link" onClick={() => navigate("/forgot-password")}>
            Reset here
          </span>
        </p>

        <p className="microcopy">
          Don’t have an account?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
