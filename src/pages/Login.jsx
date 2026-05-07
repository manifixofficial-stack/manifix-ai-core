import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

import authService from "../services/auth.service";
import { useApp } from "../context/AppProvider";

import logo from "../assets/logo.png";

import "../styles/Login.css";

import {
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();

  const {
    user,
    setUser,
    loading: appLoading,
  } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!appLoading && user) {
      navigate("/app/magic16", {
        replace: true,
      });
    }
  }, [user, appLoading, navigate]);

  // ENTER KEY LOGIN
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleEmailLogin();
    }
  };

  // EMAIL LOGIN
  const handleEmailLogin = async () => {
    if (loading) return;

    if (!email || !password) {
      setError("Credentials required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const loggedUser = await authService.login(
        email.trim().toLowerCase(),
        password
      );

      if (!loggedUser) {
        throw new Error("Verification failed.");
      }

      setUser(loggedUser);

      navigate("/app/magic16", {
        replace: true,
      });

    } catch (err) {
      console.error(err);

      setError("Invalid access credentials.");

    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      // MUST EXIST INSIDE auth.service.js
      const loggedUser =
        await authService.googleLogin();

      if (!loggedUser) {
        throw new Error("Google login failed");
      }

      setUser(loggedUser);

      navigate("/app/magic16", {
        replace: true,
      });

    } catch (err) {
      console.error(err);

      setError("Google authentication failed.");

    } finally {
      setLoading(false);
    }
  };

  // LOADING SCREEN
  if (appLoading) {
    return (
      <div className="auth-elite-loading">
        <motion.img
          src={logo}
          alt="ManifiX Logo"
          className="loading-logo"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        />
      </div>
    );
  }

  return (
    <div className="auth-elite-wrapper">
      <Helmet>
        <title>
          Elite Access | ManifiX AI
        </title>
      </Helmet>

      <div className="vault-background" />

      <motion.div
        className="auth-card-pro"
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
      >
        {/* HEADER */}
        <div className="brand-header">
          <img
            src={logo}
            alt="ManifiX"
            className="logo-gold"
          />

          <h1 className="gold-text">
            MANIFIX
          </h1>

          <p className="subtitle">
            AUTHENTICATION REQUIRED
          </p>
        </div>

        {/* INPUTS */}
        <div className="input-stack">

          {/* EMAIL */}
          <div className="field">
            <input
              type="email"
              placeholder="System Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={handleKeyPress}
              autoComplete="email"
            />
          </div>

          {/* PASSWORD */}
          <div className="field password-field">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Security Key"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={handleKeyPress}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword ? (
                <EyeSlashIcon />
              ) : (
                <EyeIcon />
              )}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <motion.p
            className="auth-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* LOGIN BUTTON */}
        <button
          type="button"
          className="btn-gold-login"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading
            ? "VERIFYING..."
            : "ENTER THE LOOP →"}
        </button>

        {/* FOOTER */}
        <div className="auth-footer">

          {/* GOOGLE */}
          <button
            type="button"
            className="google-link"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            CONTINUE WITH GOOGLE
          </button>

          {/* LINKS */}
          <div className="sub-links">
            <span
              onClick={() =>
                navigate("/signup")
              }
            >
              CREATE ACCOUNT
            </span>

            <span
              onClick={() =>
                navigate(
                  "/forgot-password"
                )
              }
            >
              FORGOT KEY
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
