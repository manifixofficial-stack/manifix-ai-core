// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { useApp } from "../context/AppContext";

import logo from "../assets/logo.svg";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";

import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { setUser, user } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect logged-in users to GPT page
  useEffect(() => {
    if (user) navigate("/app/gpt", { replace: true });
  }, [user, navigate]);

  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const loggedUser = await authService.login(email.trim(), password);
      if (loggedUser) {
        setUser(loggedUser);
        navigate("/app/gpt", { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        navigate("/app/gpt", { replace: true });
      }
    } catch {
      setError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay" />
      <div className="auth-card">
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Continue your daily alignment journey</p>

        {/* GOOGLE LOGIN BUTTON */}
        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <img src="https://img.icons8.com/color/24/google-logo.png" alt="Google Icon" />
          Continue with Google
        </button>

        <div className="divider"><span>or continue with email</span></div>

        {/* EMAIL LOGIN */}
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

        <button className="primary-btn" onClick={handleEmailLogin} disabled={loading}>
          {loading ? "Processing..." : "Login"}
        </button>

        <p className="microcopy">
          Forgot password? <span className="link" onClick={() => navigate("/forgot-password")}>Reset here</span>
        </p>

        <p className="microcopy">
          Don’t have an account? <span className="link" onClick={() => navigate("/signup")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
}
