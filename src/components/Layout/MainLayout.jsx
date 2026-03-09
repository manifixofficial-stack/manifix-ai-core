// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

// Navigation items with SVG icons
const navItems = [
  { name: "Dashboard", path: "/app/dashboard", icon: <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { name: "ManifiX AI", path: "/app/gpt", icon: <svg viewBox="0 0 24 24"><path d="M12 2L2 7v7c0 5 4 9 9 9s9-4 9-9V7l-10-5z"/></svg> },
  { name: "Magic16", path: "/app/magic16", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 6v6l4 2"/></svg> },
  { name: "Feedback", path: "/app/feedback", icon: <svg viewBox="0 0 24 24"><path d="M21 6h-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H3v14h18V6z"/></svg> },
  { name: "Billing", path: "/app/billing", icon: <svg viewBox="0 0 24 24"><path d="M2 4v16h20V4H2zm18 14H4V6h16v12z"/></svg> },
  { name: "Settings", path: "/app/settings", icon: <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { name: "Privacy Policy", path: "/privacy", icon: <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.25 3.75 10.25 9 11 5.25-.75 9-5.75 9-11V5l-9-4z"/></svg> },
  { name: "Terms of Use", path: "/terms", icon: <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg> },
  { name: "Contact", path: "/contact", icon: <svg viewBox="0 0 24 24"><path d="M21 8V7l-3 2-2-1-2 1-3-2v1l-3-2v11h18V8z"/></svg> },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* ---------- Sidebar ---------- */}
      <motion.aside
        className={`sidebar`}
        initial={{ x: sidebarOpen ? 0 : -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "⬅️" : "➡️"}
          </button>
          <img src={logo} alt="ManifiX Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">{sidebarOpen && "ManifiX"}</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="link-icon">{item.icon}</span>
              {sidebarOpen && <span className="link-text">{item.name}</span>}
              {isActive && <motion.span layoutId="active-bar" className="active-bar" />}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* ---------- Main Content ---------- */}
      <main className="main-content">
        <header className="top-header">
          <h1>Welcome to ManifiX</h1>
          <div className="user-actions">
            <button className="btn-primary">Upgrade</button>
            <button className="btn-secondary">Profile</button>
          </div>
        </header>

        {/* Animated page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            className="content-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
