import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// App Pages
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Vibe from "./pages/Vibe";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";

/**
 * AppRouter handles all routes with proper auth protection
 * @param {object|null} user - Current authenticated user
 */
export default function AppRouter({ user }) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/app/gpt" replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/app/gpt" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/app/gpt" replace /> : <Signup />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/app/gpt" replace /> : <ForgotPassword />}
      />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute user={user}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Nested App Pages */}
        <Route index element={<Navigate to="gpt" replace />} />
        <Route path="gpt" element={<Gpt />} />
        <Route path="magic16" element={<Magic16 />} />
        <Route path="vibe" element={<Vibe />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
