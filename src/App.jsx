// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext"; // <-- your file
import Login from "./pages/Login";
import GPTPage from "./pages/Gpt";
import Magic16Page from "./pages/Magic16";
import VibePage from "./pages/Vibe";
import ProfilePage from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected app pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app/gpt" element={<Gpt />} />
            <Route path="/app/magic16" element={<Magic16 />} />
            <Route path="/app/vibe" element={<Vibe/>} />
            <Route path="/app/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
