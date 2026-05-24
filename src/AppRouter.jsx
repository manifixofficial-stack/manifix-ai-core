import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import MainLayout     from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp }     from "./context/AppProvider";

/* ── Public Pages ── */
import Landing       from "./pages/Landing";
import Home          from "./pages/Home";
import Privacy       from "./pages/Privacy";
import Terms         from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";

/* ── Auth ── */
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* ── Onboarding ── */
import Onboarding from "./pages/Onboarding";

/* ── Core App Pages ── */
import Dashboard   from "./pages/Dashboard";
import Gpt         from "./pages/Gpt";
import Magic16     from "./pages/Magic16";
import Result      from "./pages/Result";
import Leaderboard from "./pages/Leaderboard";
import Recruit     from "./pages/Recruit";
import Billing     from "./pages/Billing";
import Settings    from "./pages/Settings";

/* ── Health Ecosystem Pages ── */
import MentalHealth     from "./pages/MentalHealth";
import SleepHealth      from "./pages/SleepHealth";
import NutritionHealth  from "./pages/NutritionHealth";
import StressHealth     from "./pages/StressHealth";
import ChronicHealth    from "./pages/ChronicDisease";
import WomenHealth      from "./pages/WomenHealth";
import ElderlyHealth    from "./pages/ElderlyHealth";
import MedicationHealth from "./pages/MedicationHealth";
import ChildrenHealth   from "./pages/ChildrenHealth";
import PreventiveHealth from "./pages/PreventiveHealth";

/* ── 404 ── */
import NotFound from "./pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function AppRouter() {
  const { user } = useApp() || {};

  // ✅ Simple protected wrapper — no localStorage hasStarted check
  // Dashboard itself handles the isOnboarded() redirect via Supabase
  const appElement = (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );

  return (
    <>
      <ScrollToTop />
      <Routes>

        {/* ── LANDING ── */}
        <Route path="/" element={user ? <Navigate to="/app/dashboard" replace /> : <Landing />} />
        <Route path="/home" element={user ? <Navigate to="/app/dashboard" replace /> : <Home />} />

        {/* ── LEGAL ── */}
        <Route path="/privacy"        element={<Privacy />} />
        <Route path="/terms"          element={<Terms />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── AUTH ── */}
        <Route path="/login"  element={user ? <Navigate to="/app/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/app/dashboard" replace /> : <Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── ONBOARDING ── */}
        {/* ✅ Only requires being logged in. Dashboard decides if they need this. */}
        <Route
          path="/onboarding"
          element={!user ? <Navigate to="/login" replace /> : <Onboarding />}
        />

        {/* ── PROTECTED APP ── */}
        <Route path="/app" element={appElement}>
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Core */}
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="magic16"     element={<Magic16 />} />
          <Route path="result"      element={<Result />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="recruit"     element={<Recruit />} />
          <Route path="gpt"         element={<Gpt />} />
          <Route path="membership"  element={<Billing />} />
          <Route path="settings"    element={<Settings />} />

          {/* Health Ecosystem */}
          <Route path="mental"     element={<MentalHealth />} />
          <Route path="sleep"      element={<SleepHealth />} />
          <Route path="nutrition"  element={<NutritionHealth />} />
          <Route path="stress"     element={<StressHealth />} />
          <Route path="chronic"    element={<ChronicHealth />} />
          <Route path="women"      element={<WomenHealth />} />
          <Route path="elderly"    element={<ElderlyHealth />} />
          <Route path="medication" element={<MedicationHealth />} />
          <Route path="children"   element={<ChildrenHealth />} />
          <Route path="preventive" element={<PreventiveHealth />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}
