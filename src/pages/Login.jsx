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

  // -------------------- SESSION CHECK & AUTH STATE --------------------
  useEffect(() => {
    const init = async () => {
      // Get current session (for new redirect after OAuth)
      const session = await authService.getSession();
      if (session?.user) await handleUser(session.user);
    };

    init();

    // Listen to auth changes (handles OAuth redirect and real-time login)
    const unsubscribe = authService.onAuthChange(async (user) => {
      if (user) await handleUser(user);
    });

    return () => unsubscribe();
  }, []);

  // -------------------- HANDLE USER & CREATE PROFILE IF NEW --------------------
  const handleUser = async (currentUser) => {
    setUser(currentUser);

    // Check if profile exists
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(fetchError);
      setError("Failed to fetch user profile");
      return;
    }

    // Insert new profile if first-time user
    if (!data) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: currentUser.id,
        email: currentUser.email,
        created_at: new Date(),
      });

      if (insertError) {
        console.error(insertError);
        setError("Failed to create user profile");
        return;
      }
    }

    // Navigate to main app
    navigate("/app/gpt", { replace: true });
  };

  // -------------------- EMAIL LOGIN --------------------
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const loggedUser = await authService.login(email.trim(), password);
      if (loggedUser) await handleUser(loggedUser);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- GOOGLE LOGIN --------------------
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Supabase OAuth redirects user to Google login page
      await authService.loginWithGoogle();
      // No user is returned immediately — handleUser() is triggered on redirect
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="auth-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
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
