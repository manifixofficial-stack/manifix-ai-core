// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { name: "Dashboard", path: "/app/dashboard", icon: <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/></svg> },
    { name: "ManifiX AI", path: "/app/gpt", icon: <svg viewBox="0 0 24 24"><path d="M12 2L2 7v7c0 5 4 9 9 9s9-4 9-9V7l-10-5z"/></svg> },
    { name: "Magic16", path: "/app/magic16", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 6v6l4 2"/></svg> },
    { name: "Feedback", path: "/app/feedback", icon: <svg viewBox="0 0 24 24"><path d="M21 6h-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H3v14h18V6z"/></svg> },
    { name: "Billing", path: "/app/billing", icon: <svg viewBox="0 0 24 24"><path d="M2 4v16h20V4H2zm18 14H4V6h16v12z"/></svg> },
    { name: "Privacy Policy", path: "/privacy", icon: <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.25 3.75 10.25 9 11 5.25-.75 9-5.75 9-11V5l-9-4z"/></svg> },
    { name: "Terms of Use", path: "/terms", icon: <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg> },
    { name: "Contact", path: "/contact", icon: <svg viewBox="0 0 24 24"><path d="M21 8V7l-3 2-2-1-2 1-3-2v1l-3-2v11h18V8z"/></svg> },
  ];

  return (
    <div className={`layout ${sidebarOpen ? "open" : "closed"}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="menu-toggle" onClick={toggleSidebar}>=</button>
          <img src={logo} alt="ManifiX Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">ManifiX</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-text">{item.name}</span>
              <span className="active-bar" />
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
