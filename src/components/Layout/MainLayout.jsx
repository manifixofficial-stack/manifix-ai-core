// src/components/Layout/MainLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaHome,
  FaRobot,
  FaMagic,
  FaCommentDots,
  FaCog,
  FaCreditCard,
  FaEnvelope,
} from "react-icons/fa";
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const navItems = [
    { name: "Dashboard", path: "/app/dashboard", icon: <FaHome /> },
    { name: "GPT AI", path: "/app/gpt", icon: <FaRobot /> },
    { name: "Magic16", path: "/app/magic16", icon: <FaMagic /> },
    { name: "Feedback", path: "/app/feedback", icon: <FaCommentDots /> },
    { name: "Settings", path: "/app/settings", icon: <FaCog /> },
    { name: "Billing", path: "/app/billing", icon: <FaCreditCard /> },
    { name: "Contact", path: "/app/contact", icon: <FaEnvelope /> },
  ];

  return (
    <div className="chatgpt-layout">
      {/* Sidebar */}
      <aside className="chatgpt-sidebar">
        <div className="sidebar-header">
          <img src="/assets/logo.png" alt="ManifiX Logo" className="sidebar-logo" />
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
