// src/components/Layout/MainLayout.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

import {
  LayoutDashboard,
  Sparkles,
  Brain,
  MessageSquare,
  CreditCard,
  Home,
  Info,
  FileText,
  Star,
  Mail,
  Shield,
  FileCheck,
  Menu,
  ChevronLeft,
} from "lucide-react";

import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ---------------- HANDLERS ---------------- */

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  /* ---------------- KEYBOARD ACCESSIBILITY ---------------- */

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ---------------- NAV DATA ---------------- */

  const navItems = useMemo(
    () => [
      {
        section: "Core",
        items: [
          { name: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        section: "AI Platform",
        items: [
          { name: "ManifiX AI", path: "/app/gpt", icon: Brain },
          { name: "Magic16", path: "/app/magic16", icon: Sparkles },
        ],
      },
      {
        section: "Account",
        items: [
          { name: "Feedback", path: "/app/feedback", icon: MessageSquare },
          { name: "Billing", path: "/app/billing", icon: CreditCard },
        ],
      },
      {
        section: "Resources",
        items: [
          { name: "Home", path: "/", icon: Home },
          { name: "About", path: "/about", icon: Info },
          { name: "Blog", path: "/blog", icon: FileText },
          { name: "Features", path: "/features/gpt", icon: Star },
        ],
      },
      {
        section: "Support",
        items: [{ name: "Contact", path: "/contact", icon: Mail }],
      },
      {
        section: "Legal",
        items: [
          { name: "Privacy", path: "/privacy", icon: Shield },
          { name: "Terms", path: "/terms", icon: FileCheck },
        ],
      },
    ],
    []
  );

  /* ---------------- RENDER ---------------- */

  return (
    <div className={`layout ${collapsed ? "collapsed" : ""}`}>

      {/* Overlay */}
      <div
        className={`overlay ${mobileOpen ? "show" : ""}`}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileOpen ? "open" : ""}`}
        aria-label="Sidebar Navigation"
      >
        <div className="sidebar-header">
          <img src={logo} alt="ManifiX Logo" className="logo" />
          {!collapsed && <h1 className="brand">ManifiX</h1>}
        </div>

        <nav className="nav">
          {navItems.map((group) => (
            <div key={group.section} className="nav-group">
              {!collapsed && (
                <p className="nav-section">{group.section}</p>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={20} className="nav-icon" aria-hidden="true" />
                    {!collapsed && (
                      <span className="nav-text">{item.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="main">

        {/* Topbar */}
        <header className="topbar">
          <div className="left">
            <button
              className="icon-btn"
              onClick={toggleMobile}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <button
              className="icon-btn"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                size={22}
                className={collapsed ? "rotate" : ""}
              />
            </button>

            <h2 className="title">ManifiX Platform</h2>
          </div>

          <div className="right">
            <div className="badge" aria-label="Current streak">
              🔥 Streak: 3
            </div>
            <div
              className="avatar"
              role="img"
              aria-label="User profile"
            >
              Y
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
