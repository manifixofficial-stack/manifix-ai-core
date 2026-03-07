// src/components/ProtectedRoute.jsx
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          fontSize: "1.2rem",
          color: "#fff",
        }}
      >
        Loading...
      </div>
    );
  }

  // If user is NOT logged in
  if (!user) {
    // Prevent access to protected pages
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user is logged in and tries to access public pages (Landing/Login)
  if (user && (location.pathname === "/" || location.pathname === "/login")) {
    return <Navigate to="/app/gpt" replace />;
  }

  // Authenticated & allowed, render children
  return <>{children}</>;
}
