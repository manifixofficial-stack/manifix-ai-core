import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import MainLayout     from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp }     from "./context/AppProvider";

/* ── Auth ── */
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* ── Protected App Pages ── */
import Dashboard   from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Security    from "./pages/Security";
import Settings    from "./pages/Settings";
import Membership  from "./pages/Membership";

/* ── 404 ── */
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function AppRouter() {
  const { user } = useApp() || {};

  const appElement = (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── ROOT ── */}
        <Route
          path="/"
          element={<Navigate to={user ? "/app/dashboard" : "/login"} replace />}
        />

        {/* ── AUTH ── */}
        <Route
          path="/login"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/app/dashboard" replace /> : <Signup />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── PROTECTED APP ── */}
        <Route path="/app" element={appElement}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="security"    element={<Security />} />
          <Route path="settings"    element={<Settings />} />
          <Route path="membership"  element={<Membership />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
