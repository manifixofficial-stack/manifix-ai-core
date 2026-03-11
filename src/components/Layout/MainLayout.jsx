// src/components/Layout/MainLayout.jsx
import React, { useState, useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const navSections = useMemo(() => [
    {
      title: "Core",
      items: [{ name: "Dashboard", path: "/app/dashboard", icon: "dashboard" }]
    },
    {
      title: "AI Platform",
      items: [
        { name: "ManifiX AI", path: "/app/gpt", icon: "ai" },
        { name: "Magic16", path: "/app/magic16", icon: "magic" }
      ]
    },
    {
      title: "Account",
      items: [
        { name: "Feedback", path: "/app/feedback", icon: "feedback" },
        { name: "Billing", path: "/app/billing", icon: "billing" }
      ]
    },
    {
      title: "Resources",
      items: [
        { name: "Home", path: "/home", icon: "home" },
        { name: "About ManifiX", path: "/about", icon: "about" },
        { name: "Blog", path: "/blog", icon: "blog" },
        { name: "Features", path: "/features/gpt", icon: "features" }
      ]
    },
    {
      title: "Support",
      items: [{ name: "Contact", path: "/contact", icon: "contact" }]
    },
    {
      title: "Legal",
      items: [
        { name: "Privacy Policy", path: "/privacy", icon: "privacy" },
        { name: "Terms of Use", path: "/terms", icon: "terms" }
      ]
    }
  ], []);

  return (
    <div className={`layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      
      {/* Mobile overlay */}
      <div
        className={`overlay ${mobileOpen ? "show" : ""}`}
        onClick={toggleMobile}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          {!sidebarCollapsed && <h1>ManifiX</h1>}
        </div>

        <nav>
          {navSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && <div className="nav-section">{section.title}</div>}

              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{renderIcon(item.icon)}</span>
                  {!sidebarCollapsed && <span className="nav-text">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={toggleMobile}
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>
          <button
            className="collapse-btn"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            ⇔
          </button>
          <div className="title">ManifiX Platform</div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ---------------- ICONS ---------------- */

const renderIcon = (type) => {
  const commonProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, width: 24, height: 24 };

  switch (type) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case "home":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M3 10L12 3l9 7" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "magic":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
        </svg>
      );
    case "feedback":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      );
    case "billing":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "about":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case "blog":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="13" y2="15" />
        </svg>
      );
    case "features":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
        </svg>
      );
    case "contact":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M2 6l10 7L22 6v12H2z" />
        </svg>
      );
    case "privacy":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "terms":
      return (
        <svg viewBox="0 0 24 24" {...commonProps}>
          <path d="M6 2h9l5 5v15H6z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    default:
      return null;
  }
};
