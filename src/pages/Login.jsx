import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { useApp } from "../context/AppProvider";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion"; // For premium feel

import logo from "../assets/logo.png";
import "../styles/Login.css";

// Heroicons
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser, loading: appLoading } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appLoading && user) {
      // BILLION DOLLAR MOVE: Redirect to the core habit immediately
      navigate("/app/magic16", { replace: true });
    }
  }, [user, appLoading, navigate]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleEmailLogin();
  };

  const handleEmailLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      setError("Credentials required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const loggedUser = await authService.login(email.trim().toLowerCase(), password);
      if (!loggedUser) throw new Error("Verification failed.");
      setUser(loggedUser);
      navigate("/app/magic16", { replace: true });
    } catch (err) {
      setError("Invalid access credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (appLoading) {
    return (
      <div className="auth-elite-loading">
        <motion.img 
          src={logo} 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="loading-logo" 
        />
      </div>
    );
  }

  return (
    <div className="auth-elite-wrapper">
      <Helmet><title>Elite Access | ManifiX AI</title></Helmet>
      
      <div className="vault-background" />

      <motion.div 
        className="auth-card-pro"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="brand-header">
          <img src={logo} alt="ManifiX" className="logo-gold" />
          <h1 className="gold-text">MANIFIX</h1>
          <p className="subtitle">AUTHENTICATION REQUIRED</p>
        </div>

        <div className="input-stack">
          <div className="field">
            <input
              type="email"
              placeholder="System Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          <div className="field password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Security Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">{error}</motion.p>}

        <button 
          className="btn-gold-login" 
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? "VERIFYING..." : "ENTER THE LOOP →"}
        </button>

        <div className="auth-footer">
          <button onClick={() => handleGoogleLogin} className="google-link">
            CONTINUE WITH GOOGLE
          </button>
          <div className="sub-links">
            <span onClick={() => navigate("/signup")}>CREATE ACCOUNT</span>
            <span onClick={() => navigate("/forgot-password")}>FORGOT KEY</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
