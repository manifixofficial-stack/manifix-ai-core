import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute ensures only authenticated users can access children.
 * @param {ReactNode} children - Protected component(s)
 * @param {object|null} user - Current user object (from App state)
 */
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    // User not logged in → redirect to landing
    return <Navigate to="/" replace />;
  }
  // User logged in → render the protected page
  return children;
};

export default ProtectedRoute;
