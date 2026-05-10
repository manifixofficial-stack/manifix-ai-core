import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import MainLayout     from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp }     from "./context/AppProvider";

/* ── Public Pages ── */
import Landing       from "./pages/Landing";
import Privacy       from "./pages/Privacy";
import Terms         from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";

/* ── Auth ── */
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* ── Onboarding ── */
import Onboarding from "./pages/Onboarding";

/* ── App Pages ── */
import Dashboard   from "./pages/Dashboard";
import Gpt         from "./pages/Gpt";
import Magic16     from "./pages/Magic16";
import Result      from "./pages/Result";
import Leaderboard from "./pages/Leaderboard";
import Recruit     from "./pages/Recruit";
import Billing     from "./pages/Billing";
import Settings    from "./pages/Settings";

/* ── 404 ── */
import NotFound from "./pages/NotFound";

/* ─────────────────────────────────────────────
   SCROLL TO TOP ON ROUTE CHANGE
───────────────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ─────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────── */
export default function AppRouter() {
  const { user } = useApp() || {};

  /* ✅ FIX: useState instead of useMemo
     - useMemo([]) only ran ONCE at mount → always returned false → loop
     - useState with initializer reads fresh value at mount
     - onStarted() is passed to Onboarding so it can flip the flag
       the moment it writes to localStorage, before navigating          */
  const [hasStarted, setHasStarted] = useState(
    () => localStorage.getItem("magic16_started") === "true"
  );

  // Called by Onboarding right before it navigates to /app/dashboard
  const onStarted = useCallback(() => {
    setHasStarted(true);
  }, []);

  /* ── Optional: sync if another tab completes onboarding ── */
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "magic16_started" && e.newValue === "true") {
        setHasStarted(true);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Protected shell — gates the entire /app area
  const appElement = (
    <ProtectedRoute>
      {hasStarted
        ? <MainLayout />
        : <Navigate to="/onboarding" replace />}
    </ProtectedRoute>
  );

  return (
    <HelmetProvider>
      <ScrollToTop />

      <Routes>

        {/* ══════════════════════════════════════
            1. PUBLIC
        ══════════════════════════════════════ */}
        <Route path="/"               element={<Landing />} />
        <Route path="/privacy"        element={<Privacy />} />
        <Route path="/terms"          element={<Terms />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ══════════════════════════════════════
            2. AUTH
        ══════════════════════════════════════ */}
        <Route
          path="/login"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Signup />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ══════════════════════════════════════
            3. ONBOARDING
            ✅ passes onStarted so Onboarding can
               update state BEFORE navigating
        ══════════════════════════════════════ */}
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : hasStarted ? (
              <Navigate to="/app/dashboard" replace />
            ) : (
              <Onboarding onStarted={onStarted} />
            )
          }
        />

        {/* ══════════════════════════════════════
            4. PROTECTED APP  (/app/*)
        ══════════════════════════════════════ */}
        <Route path="/app" element={appElement}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="magic16"     element={<Magic16 />} />
          <Route path="result"      element={<Result />} />  {/* ✅ /app/result */}
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="recruit"     element={<Recruit />} />
          <Route path="gpt"         element={<Gpt />} />
          <Route path="membership"  element={<Billing />} />
          <Route path="settings"    element={<Settings />} />
        </Route>

        {/* ══════════════════════════════════════
            5. 404
        ══════════════════════════════════════ */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </HelmetProvider>
  );
}
