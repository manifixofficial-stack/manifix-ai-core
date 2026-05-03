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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [aiMessage, setAiMessage] = useState("");
  const [streak, setStreak] = useState(0);

  /* ---------------- SCREEN DETECT ---------------- */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) setMobileOpen(false); // reset mobile drawer
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        items: [{ name: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard }],
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
    <div className="layout">

      {/* OVERLAY (mobile only) */}
      {isMobile && mobileOpen && (
        <div className="overlay" onClick={closeMobile} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar 
          ${collapsed && !isMobile ? "collapsed" : ""} 
          ${mobileOpen ? "open" : ""}
        `}
      >
        <div className="sidebar-header">
          <img src={logo} alt="logo" />
          {!collapsed && !isMobile && <h1>ManifiX</h1>}
        </div>

        {!collapsed && !isMobile && (
          <>
            <div className="streak-box">
              <Flame size={16} />
              <span>{streak}-Day Streak</span>
            </div>

            <div className="mission-box">
              <Target size={14} />
              <span>{dailyMission}</span>
            </div>
          </>
        )}

        <nav>
          {navItems.map((group) => (
            <div key={group.section}>
              {!collapsed && !isMobile && <p>{group.section}</p>}

              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.name} to={item.path} onClick={closeMobile}>
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
            <button
              className="icon-btn"
              onClick={isMobile ? toggleMobile : toggleSidebar}
            >
              {isMobile ? <Menu size={22} /> : <ChevronLeft size={22} />}
            </button>

            <h2>ManifiX</h2>
          </div>

          <div className="right">
            {!isMobile && <div className="badge">your improvement</div>}

            {!isMobile && (
              <div className="ai-tip">
                <Zap size={14} /> {aiMessage}
              </div>
            )}

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
