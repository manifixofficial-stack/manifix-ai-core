// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, children }) => {
  // If we don’t know auth state yet, show nothing
  if (user === undefined) return null;

  // If user is not logged in, redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Otherwise render the protected content
  return children;
};

export default ProtectedRoute;
