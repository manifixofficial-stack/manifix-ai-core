// src/components/Layout/MainLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/app/dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"
          />
        </svg>
      ),
    },
    {
      name: "GPT AI",
      path: "/app/gpt",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2L2 7v7c0 5 4 9 9 9s9-4 9-9V7l-10-5z"
          />
        </svg>
      ),
    },
    {
      name: "Magic16",
      path: "/app/magic16",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path fill="currentColor" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      name: "Feedback",
      path: "/app/feedback",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M21 6h-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H3v14h18V6zm-6 0V4h2v2h-2zm-8 0V4h2v2H7z"
          />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/app/settings",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm10 4c0-.7-.1-1.4-.3-2l2-2-3-3-2 2a7.7 7.7 0 0 0-2-.3V2h-4v2.7a7.7 7.7 0 0 0-2 .3l-2-2-3 3 2 2a7.7 7.7 0 0 0-.3 2H2v4h2.7a7.7 7.7 0 0 0 .3 2l-2 2 3 3 2-2a7.7 7.7 0 0 0 2 .3V22h4v-2.7a7.7 7.7 0 0 0 2-.3l2 2 3-3-2-2a7.7 7.7 0 0 0 .3-2H22v-4z"
          />
        </svg>
      ),
    },
    {
      name: "Billing",
      path: "/app/billing",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M2 4v16h20V4H2zm18 14H4V6h16v12zM6 8h12v2H6V8zm0 4h8v2H6v-2z"
          />
        </svg>
      ),
    },
    {
      name: "Contact",
      path: "/app/contact",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="chatgpt-layout">
      {/* Sidebar */}
      <aside className="chatgpt-sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="ManifiX Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">ManifiX</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="chatgpt-main">
        <Outlet />
      </main>
    </div>
  );
}
