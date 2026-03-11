import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppProvider";
import { HelmetProvider } from 'react-helmet-async';

/* Public Pages */
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import Blog from "./pages/Blog";
import About from "./pages/About";

/* App Pages */
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Feedback from "./pages/Feedback";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

export default function AppRouter() {
  const { user } = useApp();

  return (
    <HelmetProvider>
      <Routes>
        {/* Home */}
        <Route path="/" element={user ? <Navigate to="/app/gpt" replace /> : <Home />} />

        {/* Auth */}
        <Route path="/login" element={user ? <Navigate to="/app/gpt" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/app/gpt" replace /> : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Public */}
        <Route path="/about" element={<About />} />
        <Route path="/features/:feature?" element={<Features />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="gpt" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gpt" element={<Gpt />} />
          <Route path="magic16" element={<Magic16 />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Billing />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HelmetProvider>
  );
}
