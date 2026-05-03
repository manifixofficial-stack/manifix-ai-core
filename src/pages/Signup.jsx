// src/pages/Signup.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

import logo from "../assets/logo.svg";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import "../styles/Signup.css";

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
      const user = await authService.signUp(email, password);
      if (!user) throw new Error();

      setSuccess("Account created 🎉");

      setTimeout(() => {
        navigate("/app/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup">

      <div className="card">

        {/* LOGO */}
        <div className="brand">
          <img src={logo} alt="logo" />
          <h1>ManifiX</h1>
        </div>

        {/* TITLE */}
        <h2>Create Account</h2>
        <p className="sub">Start your 16-day reset</p>

        {/* GOOGLE */}
        <button className="google-btn" disabled={loading}>
          <img src="https://img.icons8.com/color/20/google-logo.png" alt="" />
          Continue with Google
        </button>

        <div className="divider"><span>or</span></div>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="eye" />
            ) : (
              <EyeIcon className="eye" />
            )}
          </button>
        </div>

        {/* ERROR */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* BUTTON */}
        <button
          className="primary"
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        {/* FOOT */}
        <p className="foot">
          Already have account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>

      </div>
    </div>
  );
}
