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
  const [aiMessage, setAiMessage] = useState("");

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

  /* ---------------- KEYBOARD ---------------- */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ---------------- AI MICRO MOTIVATION ---------------- */
  useEffect(() => {
    const messages = [
      "💡 Just 1 Magic16 session can reset your mind.",
      "🔥 Don’t break your streak today.",
      "🧠 Focus = your superpower right now.",
      "⚡ Small action → big transformation.",
      "🎯 One session > zero progress.",
    ];

    const interval = setInterval(() => {
      const random = messages[Math.floor(Math.random() * messages.length)];
      setAiMessage(random);
    }, 8000);

    setAiMessage(messages[0]);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- DAILY MISSION ---------------- */
  const dailyMission = useMemo(() => {
    const missions = [
      "Complete 1 Magic16 session",
      "Hold perfect posture for 2 min",
      "Do 5 min breathing focus",
      "Achieve 80% accuracy",
    ];
    return missions[new Date().getDate() % missions.length];
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

      {/* OVERLAY */}
      <div
        className={`overlay ${mobileOpen ? "show" : ""}`}
        onClick={closeMobile}
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="logo" className="logo" />
          {!collapsed && <h1 className="brand">ManifiX</h1>}
        </div>

        {/* DAILY MISSION (🔥 ADDICTION LOOP ELEMENT) */}
        {!collapsed && (
          <div className="daily-mission">
            🎯 Today: {dailyMission}
          </div>
        )}

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
                    <Icon size={20} />
                    {!collapsed && (
                      <span>{item.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="left">
            <button className="icon-btn" onClick={toggleMobile}>
              <Menu size={22} />
            </button>

            <button className="icon-btn" onClick={toggleSidebar}>
              <ChevronLeft size={22} />
            </button>

            <h2 className="title">ManifiX Platform</h2>
          </div>

          <div className="right">

            {/* 🔥 STREAK PRESSURE */}
            <div className="badge pulse">
              🔥 Streak: 3 (Don’t break it!)
            </div>

            {/* 🧠 AI MOTIVATION */}
            <div className="ai-tip">
              {aiMessage}
            </div>

            <div className="avatar">Y</div>
          </div>

        </header>

        {/* CONTENT */}
        <main className="content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
