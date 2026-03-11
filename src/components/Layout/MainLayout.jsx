// src/components/Layout/MainLayout.jsx

import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
  {
    name: "Dashboard",
    path: "/app/dashboard",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="2"/>
        <rect x="14" y="3" width="7" height="7" rx="2"/>
        <rect x="14" y="14" width="7" height="7" rx="2"/>
        <rect x="3" y="14" width="7" height="7" rx="2"/>
      </svg>
    )
  },

  {
    name: "ManifiX AI",
    path: "/app/gpt",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },

  {
    name: "Magic16",
    path: "/app/magic16",
    icon: (
      <svg viewBox="0 0 24 24">
        <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/>
      </svg>
    )
  },

  {
    name: "Feedback",
    path: "/app/feedback",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
      </svg>
    )
  },

  {
    name: "Billing",
    path: "/app/billing",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    )
  },

  {
    name: "Privacy Policy",
    path: "/privacy",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"/>
      </svg>
    )
  },

  {
    name: "Terms of Use",
    path: "/terms",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 2h9l5 5v15H6z"/>
        <path d="M14 2v6h6"/>
      </svg>
    )
  },

  {
    name: "Contact",
    path: "/contact",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M2 6l10 7L22 6v12H2z"/>
      </svg>
    )
  }
];

  return (
    <div className="app-layout">

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="sidebar-header">
          <img src={logo} alt="ManifiX Logo" className="logo"/>
          <h1>ManifiX</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main area */}
      <div className="content-area">

        {/* Topbar */}
        <header className="topbar">

          <button className="menu-btn" onClick={toggleSidebar}>
            ☰
          </button>

          <div className="topbar-title">
            ManifiX AI Platform
          </div>

        </header>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
