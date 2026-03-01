// src/components/Layout/MainLayout.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "../styles/MainLayout.css";
import Logo from "../../assets/logo.png";

export default function MainLayout() {
  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <img src={Logo} alt="ManifiX Logo" className="sidebar-logo" />
          <h2>ManifiX</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/billing"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            💳 Billing
          </NavLink>
          <NavLink
            to="/gpt"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            💬 GPT
          </NavLink>
          <NavLink
            to="/magic16"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            🔮 Magic16
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            👤 Profile
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            ⚙️ Settings
          </NavLink>
        </nav>

        {/* Sidebar bottom: optional share / extra */}
        <div className="sidebar-bottom">
          <button
            className="share-btn"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            title="Share Current Page"
          >
            🔗 Share
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
