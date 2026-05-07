import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppProvider";

/* ---------------- 2026 High-Value Pages ---------------- */
import Landing from "./pages/Landing"; // Now includes About & Features logic
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Recruit from "./pages/Recruit"; 

/* Auth - The Entryway */
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* Onboarding - The Conversion */
import Onboarding from "./pages/OnboardingSystem";

/* App Pages - The Billion Dollar Engine */
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt"; // Personal AI Strategist
import Magic16 from "./pages/Magic16"; // Core Product
import Result from "./pages/Result"; // Viral Share Page
import Leaderboard from "./pages/Leaderboard"; // THE STATUS MOAT
import Billing from "./pages/Billing"; // Renamed to "Membership" in UI
import Settings from "./pages/Settings";

/* 404 */
import NotFound from "./pages/NotFound";

/* ================= AUTO-SCROLL LOGIC ================= */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function AppRouter() {
  const { user } = useApp() || {};

  /* ================= GROWTH LOGIC ================= */
  const hasStarted =
    typeof window !== "undefined" &&
    window.localStorage?.getItem("magic16_started") === "true";

  /* ================= THE PROTECTED "ELITE" APP AREA ================= */
  const appElement = (
    <ProtectedRoute>
      {/* If they haven't finished onboarding, force them to commit */}
      {hasStarted ? <MainLayout /> : <Navigate to="/onboardingSystem" replace />}
    </ProtectedRoute>
  );

  return (
    <HelmetProvider>
      <ScrollToTop />

      <Routes>
        {/* ================= 1. PUBLIC (THE HOOK) ================= */}
        {/* About and Features are now sections on this Landing page */}
        <Route path="/" element={<Landing />} />

        {/* ================= 2. AUTH (THE GATE) ================= */}
        <Route
          path="/login"
          element={user ? <Navigate to="/app/magic16" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/app/magic16" replace /> : <Signup />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= 3. ONBOARDING (THE SETUP) ================= */}
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : hasStarted ? (
              <Navigate to="/app/dashboard" replace />
            ) : (
              <Onboarding />
            )
          }
        />

        {/* ================= 4. LEGAL (FOR RAZORPAY COMPLIANCE) ================= */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* ================= 5. THE CORE ENGINE (₹1,999/mo AREA) ================= */}
        <Route path="/app" element={appElement}>
          {/* Landing in the app defaults to the workout for maximum friction-less action */}
          <Route index element={<Navigate to="magic16" replace />} />

          {/* High-Value Routes */}
          <Route path="magic16" element={<Magic16 />} />
          <Route path="result" element={<Result />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leaderboard" element={<Leaderboard />} /> {/* THE COMPETITION */}
          <Route path="recruit" element={<Recruit />} /> {/* ADD THIS LINE */}
          <Route path="gpt" element={<Gpt />} /> {/* THE COACH */}
          <Route path="membership" element={<Billing />} /> {/* THE REVENUE */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ================= 6. THE FAIL-SAFE ================= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HelmetProvider>
  );
}
