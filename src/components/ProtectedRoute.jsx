// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp();

  // Show a loading indicator while checking auth
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated, render children
  return <>{children}</>;
}
