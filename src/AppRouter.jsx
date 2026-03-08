// src/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppContext";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// App Pages
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Feedback from "./pages/Feedback";
import Billing from "./pages/Billing";

export default function AppRouter() {
  const { user } = useApp(); // get user from context

  return (
    <Routes>
      {/* Landing Page - First page */}
      <Route
        path="/"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Landing />}
      />

      {/* Auth Pages */}
      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Signup />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Public Pages */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="gpt" element={<Gpt />} />
        <Route path="magic16" element={<Magic16 />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="billing" element={<Billing />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
