// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute() {
  const { user, loading } = useApp();

  if (loading) return <p>Loading...</p>; // or spinner

  return user ? <Outlet /> : <Navigate to="/Landing" replace />;
}
