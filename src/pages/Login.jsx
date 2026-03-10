// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import supabase from "../services/supabase";
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

  // ---------------- SPA-ready: Handle existing session ----------------
  useEffect(() => {
    const init = async () => {
      // Check if there is a session (page refresh safe)
      const session = await authService.getSession();
      if (session?.user) {
        await handleUser(session.user);
      }
    };

    init();

    // Subscribe to auth state changes (OAuth redirect safe)
    const unsubscribe = authService.onAuthChange(async (currentUser) => {
      if (currentUser) {
        await handleUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------- Handle user login / new user ----------------
  const handleUser = async (loggedUser) => {
    try {
      // Check if profile exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", loggedUser.id)
        .single();

      // If profile doesn't exist, create it
      if (!profile) {
        await supabase.from("profiles").insert({
          id: loggedUser.id,
          email: loggedUser.email,
          created_at: new Date(),
        });
      }

      // Set user in context & navigate
      setUser(loggedUser);
      navigate("/app/gpt", { replace: true });
    } catch (err) {
      console.error("Profile handling failed:", err);
      setError("Login failed, please try again");
    }
  };

  // ---------------- Email login ----------------
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const loggedUser = await authService.login(email.trim(), password);

      if (!loggedUser) throw new Error("Invalid credentials");

      await handleUser(loggedUser);
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
      // This will redirect to Google OAuth, user comes back via onAuthChange
      await authService.loginWithGoogle();
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
