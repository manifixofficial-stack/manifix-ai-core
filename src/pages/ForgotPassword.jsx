import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

import logo from "../assets/logo.png";
import "../styles/Login.css"; // Reuse login styles for consistency

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return setError("System Email required for recovery.");
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authService.sendPasswordResetEmail(email.trim().toLowerCase());
      setMessage("Recovery instructions transmitted to your email.");
    } catch (err) {
      setError("Identification failed. Check your email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-elite-wrapper">
      <Helmet><title>Recovery | ManifiX AI</title></Helmet>
      
      <div className="vault-background" />

      <motion.div 
        className="auth-card-pro"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="brand-header">
          <img src={logo} alt="ManifiX" className="logo-gold" />
          <h1 className="gold-text">KEY RECOVERY</h1>
          <p className="subtitle">SECURE IDENTITY VERIFICATION</p>
        </div>

        <p className="recovery-instruction">
          Enter your system email to receive a secure access key reset.
        </p>

        <form onSubmit={handleReset} className="input-stack">
          <div className="field">
            <input
              type="email"
              placeholder="System Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button 
            className="btn-gold-login" 
            type="submit"
            disabled={loading}
          >
            {loading ? "TRANSMITTING..." : "INITIATE RECOVERY →"}
          </button>
        </form>

        <div className="auth-footer">
          <div className="sub-links-center">
            <span onClick={() => navigate("/login")}>BACK TO AUTHENTICATION</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
