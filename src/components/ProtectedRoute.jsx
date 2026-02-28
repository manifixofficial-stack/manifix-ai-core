// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, children }) {
  // Wait until user state is checked (user is null during initial auth load)
  if (user === undefined || user === null) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the protected content
  return children;
}
