// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp();

  // Show a loading state while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          fontSize: "1.2rem",
          color: "#fff",
        }}
      >
        Loading...
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated, render the protected content
  return <>{children}</>;
}
