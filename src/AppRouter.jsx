import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppProvider";
import { HelmetProvider } from "react-helmet-async";

/* ---------------- Public Pages ---------------- */
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Features from "./pages/Features";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

/* ---------------- Auth Pages ---------------- */
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

/* ---------------- Onboarding ---------------- */
import Onboarding from "./pages/Onboarding";

/* ---------------- Protected App Pages ---------------- */
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Feedback from "./pages/Feedback";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Session from "./pages/Session";
import Result from "./pages/Result";

/* ---------------- Not Found ---------------- */
import NotFound from "./pages/NotFound";

export default function AppRouter() {
  const { user } = useApp() || {};

  // 🔥 CHECK ONBOARDING STATE
  const hasStarted = localStorage.getItem("magic16_started");

  return (
    <HelmetProvider>
      <Routes>

        {/* ---------------- Public ---------------- */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />

        {/* ---------------- Auth ---------------- */}
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

        {/* ---------------- Onboarding ---------------- */}
        <Route
          path="/onboarding"
          element={
            !user
              ? <Navigate to="/login" replace />
              : hasStarted
              ? <Navigate to="/app/dashboard" replace />
              : <Onboarding />
          }
        />

        {/* ---------------- Public Info ---------------- */}
        <Route path="/about" element={<About />} />
        <Route
          path="/features"
          element={<Navigate to="/features/gpt" replace />}
        />
        <Route path="/features/:feature" element={<Features />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* ---------------- Protected App ---------------- */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              {
                !hasStarted
                  ? <Navigate to="/onboarding" replace />
                  : <MainLayout />
              }
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gpt" element={<Gpt />} />
          <Route path="session" element={<Session />} />
          <Route path="result" element={<Result />} />
          <Route path="magic16" element={<Magic16 />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ---------------- 404 ---------------- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </HelmetProvider>
  );
}
