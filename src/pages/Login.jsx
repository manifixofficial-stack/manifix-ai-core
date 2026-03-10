// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import authService from "../services/auth.service";
import { useApp } from "../context/AppContext";

import logo from "../assets/logo.png";
import bgImage from "../assets/backgrounds/dark-gradient.jpg";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------------------------- SPA-safe session check -------------------------
  useEffect(() => {
    const init = async () => {
      // Check if session exists (after redirect from OAuth)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await handleUser(session.user);
      }
    };

    init();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthChange(async (user) => {
      if (user) await handleUser(user);
    });

    return () => unsubscribe();
  }, []);

  // ------------------------- Handle user (new or existing) -------------------------
  const handleUser = async (user) => {
    try {
      // Create profile if first-time login
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) {
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          created_at: new Date(),
        });
      }

      setUser(user);
      navigate("/app/gpt", { replace: true });
    } catch (err) {
      console.error("Profile creation failed:", err);
      setError("Failed to initialize user profile");
    }
  };

  // ------------------------- Email/Password Login -------------------------
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const loggedUser = await authService.login(email.trim(), password);

      if (loggedUser) {
        await handleUser(loggedUser);
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------- Google Login -------------------------
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // 🔹 Trigger OAuth redirect
      await authService.loginWithGoogle();
      // Note: Do NOT expect user immediately. handleUser() will run after redirect.
    } catch (err) {
      console.error(err);
      setError(err.message || "Google login failed");
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
        {/* BRAND */}
        <div className="brand">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          <h1>ManifiX</h1>
          <p className="tagline">Intelligence meets Intention</p>
        </div>

        <h2>Welcome Back</h2>

        {/* GOOGLE LOGIN */}
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

        {/* EMAIL INPUT */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* PASSWORD INPUT */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <p className="error">{error}</p>}

        {/* EMAIL LOGIN BUTTON */}
        <button
          className="primary-btn"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? "Processing..." : "Login"}
        </button>

        {/* LINKS */}
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
