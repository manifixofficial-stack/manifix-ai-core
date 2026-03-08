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
import Contact from "./pages/Contact";

// App Pages
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";

export default function AppRouter() {
  const { user } = useApp(); // ✅ Use context directly

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Signup />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

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
        <Route path="gpt" element={<Gpt/>} />
        <Route path="magic16" element={<Magic16 />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
