import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in
  const isAuthenticated = !!localStorage.getItem("token"); // Or any auth flag you use

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // redirect to Landing if not logged in
  }

  return children; // render the protected page
};

export default ProtectedRoute;
