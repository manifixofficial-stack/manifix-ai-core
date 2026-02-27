// src/AppRouter.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// ================= PUBLIC PAGES =================
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// ================= MAIN APP PAGES =================
import Dashboard from "./pages/Dashboard";
import Gpt from "./pages/Gpt";
import Magic16 from "./pages/Magic16";
import Vibe from "./pages/Vibe";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";

// ================= ADMIN PAGE =================
import Admin from "./pages/Admin";

export default function AppRouter({ user }) {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ================= PROTECTED APP ROUTES ================= */}
      <Route
        element={
          <ProtectedRoute user={user}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gpt" element={<Gpt />} />
        <Route path="/magic16" element={<Magic16 />} />
        <Route path="/vibe" element={<Vibe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
      </Route>

      {/* ================= ADMIN ROUTE ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} adminOnly>
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* ================= 404 ROUTE ================= */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
