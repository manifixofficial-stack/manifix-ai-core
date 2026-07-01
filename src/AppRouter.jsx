import React, { useEffect, Suspense, lazy } from "react";
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

/* ── Veggie Go Game (public, no login required) ──
   Lazy-loaded on purpose: if anything inside this game bundle throws at
   import time (broken relative path, missing socket config, etc.), it only
   breaks this one route instead of taking down the entire ManifiX app,
   which is what a top-level static import would do. */
const VeggieGoApp = lazy(() => import("./games/veggie-go/VeggieGoApp"));

/* ── Error boundary: catches render-time crashes anywhere in the tree and
   shows a visible message instead of a silent white screen. ── */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surfaces in the browser console even if the UI is masking it.
    console.error("AppRouter crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#080808",
            color: "#ffc83c",
            fontFamily: "monospace",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <h2 style={{ marginBottom: "8px" }}>Something broke while loading this page.</h2>
          <p style={{ color: "#8a8a93", fontSize: "13px", maxWidth: "480px" }}>
            {this.state.error?.message || "Unknown error — check the browser console for details."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        color: "#ffc83c",
        fontFamily: "monospace"
      }}
    >
      Loading...
    </div>
  );
}

export default function AppRouter() {
  const { user } = useApp() || {};

  const appElement = (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );

  return (
    <RouteErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
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

          {/* ── VEGGIE GO — public, no auth wall, room-code entry only ── */}
          <Route path="/veggie-go" element={<VeggieGoApp />} />

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
      </Suspense>
    </RouteErrorBoundary>
  );
}
