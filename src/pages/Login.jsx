import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { useApp } from "../context/AppProvider";
import { Helmet } from "react-helmet-async";

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

  // ✅ Redirect if logged in
  useEffect(() => {
    if (!appLoading && user) {
      navigate("/app/dashboard", { replace: true }); // 🔥 unified route
    }
  }, [user, appLoading, navigate]);

  // ✅ Enter key support
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleEmailLogin();
  };

  // ✅ Error mapping (PRO UX)
  const getFriendlyError = (msg) => {
    if (!msg) return "Something went wrong";
    if (msg.includes("Invalid login")) return "Incorrect email or password";
    if (msg.includes("Email not confirmed")) return "Please verify your email";
    return msg;
  };

  // ✅ Email login
  const handleEmailLogin = async () => {
    if (loading) return;

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loggedUser = await authService.login(
        email.trim().toLowerCase(),
        password
      );

      if (!loggedUser) throw new Error("Invalid login");

      setUser(loggedUser);

      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError(getFriendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login (better UX)
  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await authService.loginWithGoogle();
      // ⚠️ no setLoading(false) (redirect happens)
    } catch (err) {
      console.error(err);
      setError(getFriendlyError(err.message));
      setLoading(false);
    }
  };

  // ✅ Session loading screen
  if (appLoading) {
    return (
      <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="overlay" />
        <div className="auth-card">
          <img src={logo} alt="logo" className="logo" />
          <h2>Welcome back...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <Helmet>
        <title>Login — ManifiX AI</title>
      </Helmet>

      <div className="overlay" />

      {/* 🔥 Loading Overlay */}
      {loading && <div className="loading-overlay">Processing...</div>}

      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        <h2>Welcome Back</h2>

        {/* Google */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="https://img.icons8.com/color/24/google-logo.png" alt="g" />
          Continue with Google
        </button>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        {error && <p className="error">{error}</p>}

        <button
          className="primary-btn"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="microcopy">
          Forgot password?{" "}
          <span onClick={() => navigate("/forgot-password")}>Reset</span>
        </p>

        <p className="microcopy">
          New here?{" "}
          <span onClick={() => navigate("/signup")}>Create account</span>
        </p>
      </div>
    </div>
  );
}
