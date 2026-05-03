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
  Star,
  Mail,
  Shield,
  FileCheck,
  Menu,
  ChevronLeft,
  Flame,
  Target,
  Zap,
} from "lucide-react";

import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [streak, setStreak] = useState(0);

  /* ---------------- HANDLERS ---------------- */
  const toggleSidebar = useCallback(() => {
    setCollapsed((p) => !p);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((p) => !p);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  /* ---------------- STREAK ---------------- */
  useEffect(() => {
    const s = parseInt(localStorage.getItem("magic16_streak") ?? "0", 10);
    setStreak(s);
  }, []);

  /* ---------------- AI TIP ---------------- */
  useEffect(() => {
    const messages = [
      "💡 One session can change your day.",
      "🔥 Don’t break your streak.",
      "🧠 Focus is your power.",
      "⚡ Action builds identity.",
      "🎯 Start small, win big.",
    ];

    let i = 0;
    setAiMessage(messages[0]);

    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setAiMessage(messages[i]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- DAILY MISSION ---------------- */
  const dailyMission = useMemo(() => {
    const missions = [
      "Complete 1 Magic16 session",
      "5 min deep focus",
      "No distractions today",
      "Stay consistent",
      "Win today",
    ];
    return missions[new Date().getDate() % missions.length];
  }, []);

  /* ---------------- NAV ---------------- */
  const navItems = useMemo(
    () => [
      {
        section: "Core",
        items: [
          { name: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        section: "AI",
        items: [
          { name: "ManifiX AI", path: "/app/gpt", icon: Brain },
          { name: "Magic16", path: "/app/magic16", icon: Sparkles },
        ],
      },
      {
        section: "Growth",
        items: [
          { name: "Feedback", path: "/app/feedback", icon: MessageSquare },
          { name: "Billing", path: "/app/billing", icon: CreditCard },
        ],
      },
      {
        section: "Explore",
        items: [
          { name: "Home", path: "/", icon: Home },
          { name: "About", path: "/about", icon: Info },
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
          {!collapsed && <h1>ManifiX</h1>}
        </div>

        {!collapsed && (
          <div className="streak-box">
            <Flame size={16} />
            <span>{streak}-Day Streak</span>
          </div>
        )}

        {!collapsed && (
          <div className="mission-box">
            <Target size={14} />
            <span>{dailyMission}</span>
          </div>
        )}

        <nav>
          {navItems.map((group) => (
            <div key={group.section}>
              {!collapsed && <p>{group.section}</p>}

              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.name} to={item.path}>
                    <Icon size={20} />
                    {!collapsed && <span>{item.name}</span>}
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
            {/* ONE MENU ONLY */}
            <button className="icon-btn" onClick={toggleMobile}>
              <Menu size={22} />
            </button>

            <h2>ManifiX</h2>
          </div>

          <div className="right">
            <div className="badge">your improvemnt</div>

            <div className="ai-tip">
              <Zap size={14} /> {aiMessage}
            </div>

            <div className="avatar">Y</div>
          </div>

        </header>

        <main className="content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
