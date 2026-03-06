import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import "../styles/MainLayout.css";

export default function MainLayout() {
  const [theme, setTheme] = useState("dark");

  return (
    <div className={`main-layout ${theme}`}>
      {/* Sidebar / Topbar */}
      <header className="main-header">
        <div className="logo-container">
          <img src={logo} alt="ManifiX Logo" className="logo"/>
          <h1>ManifiX</h1>
        </div>
        <nav className="nav-links">
          <Link to="/gpt">💬 Chat</Link>
          <Link to="/magic16">🧘 Magic16</Link>
        </nav>
        <div className="header-actions">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            🌓
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
