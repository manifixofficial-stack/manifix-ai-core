// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext"; // your app context
import "../styles/ProtectedRoute.css"; // optional for branded loading

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp(); // get user and loading state from context

  if (loading) {
    // Show branded loading while checking auth
    return (
      <div className="protected-loading">
        <div className="logo-container">
          <img src="/assets/logo.png" alt="ManifiX Logo" />
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
