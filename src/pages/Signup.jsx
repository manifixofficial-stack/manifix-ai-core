import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

import logo from "../assets/logo.svg";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import "../styles/Login.css";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidPassword = (password) => password.length >= 6;

  const handleEmailSignup = async () => {
    setError("");
    setSuccess("");

    if (!isValidEmail(email)) return setError("Enter valid email");
    if (!isValidPassword(password)) return setError("Min 6 characters");

    setLoading(true);

    try {
      const user = await authService.signUp(
        email.trim().toLowerCase(),
        password
      );

      if (!user) throw new Error("Signup failed");

      setSuccess("Account created 🎉");

      setTimeout(() => {
        navigate("/app/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="auth-card">

        {/* Brand */}
        <div className="brand">
          <img src={logo} alt="logo" />
          <h1>ManifiX</h1>
        </div>

        <h2>Create Account</h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="toggle-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="icon" />
            ) : (
              <EyeIcon className="icon" />
            )}
          </button>
        </div>

        {/* Messages */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Submit */}
        <button
          className="primary-btn"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="microcopy">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>

      </div>
    </div>
  );
}
