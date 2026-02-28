import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import GptPage from "./pages/Gpt";
import Magic16Page from "./pages/Magic16";
import VibePage from "./pages/Vibe";
import BillingPage from "./pages/Billing";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);

  return (
    <AppProvider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected user routes */}
          <Route element={<ProtectedRoute user={user} />}>
            <Route path="/gpt" element={<GptPage />} />
            <Route path="/magic16" element={<Magic16Page />} />
            <Route path="/vibe" element={<VibePage />} />
            <Route path="/billing" element={<BillingPage />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
