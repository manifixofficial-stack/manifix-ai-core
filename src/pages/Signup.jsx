import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { motion } from "framer-motion"; // For premium transitions
import { Helmet } from "react-helmet-async";

import logo from "../assets/logo.png"; // Use your high-res logo
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import "../styles/Login.css"; // Reuse the vault styles for 1:1 consistency

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignup = async () => {
    setError("");
    if (!email.includes("@")) return setError("Valid System Email required.");
    if (password.length < 8) return setError("Security Key must be 8+ characters.");

    setLoading(true);

    try {
      const user = await authService.signUp(email.trim().toLowerCase(), password);
      if (!user) throw new Error();

      // BILLION DOLLAR MOVE: Direct to Onboarding, then Magic16
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError("Registration protocol failed. Try another email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-elite-wrapper">
      <Helmet><title>Initiate Evolution | ManifiX AI</title></Helmet>
      <div className="vault-background" />

      <motion.div 
        className="auth-card-pro"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* BRAND IDENTITY */}
        <div className="brand-header">
          <img src={logo} alt="ManifiX" className="logo-gold" />
          <h1 className="gold-text">MANIFIX</h1>
          <p className="subtitle">INITIATE 16-DAY PROTOCOL</p>
        </div>

        {/* SOCIAL AUTH */}
        <button className="google-link-elite" disabled={loading}>
          <img src="https://icons8.com" alt="" />
          CONTINUE WITH GOOGLE
        </button>

        <div className="divider"><span>OR REGISTER VIA EMAIL</span></div>

        {/* INPUTS */}
        <div className="input-stack">
          <div className="field">
            <input
              type="email"
              placeholder="System Email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create Security Key"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        {/* CTA */}
        <button
          className="btn-gold-login"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "CONFIGURING..." : "BEGIN EVOLUTION →"}
        </button>

        {/* FOOTER */}
        <div className="auth-footer">
          <p className="sub-links-center">
            ALREADY ENROLLED? <span onClick={() => navigate("/login")} className="gold-text-link">ACCESS VAULT</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
