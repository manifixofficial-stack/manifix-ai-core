// src/AppRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// PUBLIC PAGES
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// MAIN APP PAGES
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Vibe from "./pages/Vibe";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";

export default function AppRouter({ user }) {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/app/dashboard" replace /> : <Landing />
        }
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />

      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ================= PROTECTED APP ROUTES ================= */}
      <Route
        path="/app"
        element={
          <ProtectedRoute user={user}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect /app → /app/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="gpt" element={<Gpt />} />
        <Route path="magic16" element={<Magic16 />} />
        <Route path="vibe" element={<Vibe />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="billing" element={<Billing />} />
      </Route>

      {/* ================ 404 =============== */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
