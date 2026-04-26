import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppProvider";

/* ---------------- Pages ---------------- */
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Features from "./pages/Features";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

/* Auth */
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* Onboarding */
import Onboarding from "./pages/Onboarding";

/* Core App */
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Feedback from "./pages/Feedback";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Result from "./pages/Result";

/* 404 */
import NotFound from "./pages/NotFound";

export default function AppRouter() {
  const { user } = useApp() || {};

  const hasStarted =
    typeof window !== "undefined" &&
    localStorage.getItem("magic16_started") === "true";

  const currentDay =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("magic16_day") || 1)
      : 1;

  return (
    <HelmetProvider>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />

        {/* ================= AUTH ================= */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/onboarding" replace /> : <Login />
          }
        />

        <Route
          path="/signup"
          element={
            user ? <Navigate to="/onboarding" replace /> : <Signup />
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= ONBOARDING ================= */}
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : hasStarted ? (
              <Navigate to={`/app/magic16/day/${currentDay}`} replace />
            ) : (
              <Onboarding />
            )
          }
        />

        {/* ================= PUBLIC INFO ================= */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route
          path="/features"
          element={<Navigate to="/features/gpt" replace />}
        />
        <Route path="/features/:feature" element={<Features />} />

        {/* ================= PROTECTED APP ================= */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              {user ? (
                hasStarted ? (
                  <MainLayout />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )}
            </ProtectedRoute>
          }
        >

          {/* 🔥 DEFAULT → FORCE MAGIC16 */}
          <Route
            index
            element={
              <Navigate to={`magic16/day/${currentDay}`} replace />
            }
          />

          {/* ================= CORE SYSTEM ================= */}
          <Route path="magic16">
            <Route index element={<Magic16 />} />
            <Route path="day/:day" element={<Magic16 />} />
          </Route>

          {/* ================= COMPLETION ================= */}
          <Route path="result" element={<Result />} />

          {/* ================= SECONDARY ================= */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gpt" element={<Gpt />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />

        </Route>

        {/* ================= 404 ================= */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </HelmetProvider>
  );
}
