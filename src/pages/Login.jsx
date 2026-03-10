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

  // Redirect already logged-in users
  useEffect(() => {
    if (user) navigate("/app/gpt", { replace: true });
  }, [user, navigate]);

  // ----------- Email Login -----------
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

  // ----------- Google Login -----------
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const loggedUser = await authService.loginWithGoogle(); // returns { id, email, session }

      if (!loggedUser) throw new Error("Google sign-in failed");

      // ✅ First-time user check
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", loggedUser.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(fetchError);
        throw new Error("Failed to fetch user profile");
      }

      if (!data) {
        // Insert new user profile
        const { error: insertError } = await supabase.from("profiles").insert({
          id: loggedUser.id,
          email: loggedUser.email,
          created_at: new Date(),
        });

        if (insertError) {
          console.error(insertError);
          throw new Error("Failed to create user profile");
        }
      }

      setUser(loggedUser);
      navigate("/app/gpt", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed");
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
