// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import logo from "../assets/logo.png";
import "../styles/ProtectedRoute.css";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="logo-container">
          <img src={logo} alt="ManifiX Logo" />
          <h1>ManifiX</h1>
        </div>
        <p>Verifying your session...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
