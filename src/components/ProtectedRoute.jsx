// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp();

  // 🔄 Show loading screen while checking auth
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Checking your identity...</p>
      </div>
    );
  }

  // 🚫 Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Authorized
  return children;
}

const styles = {
  loaderContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
    color: "#fff",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #6e00ff",
    borderTop: "4px solid #00f0ff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  text: {
    marginTop: "15px",
    fontSize: "14px",
    opacity: 0.8,
  },
};
