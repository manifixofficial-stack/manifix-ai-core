// src/components/Layout/MainLayout.jsx

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
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

  /* ---------------- STREAK LOAD ---------------- */
  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 1);
    setStreak(s);
  }, []);

  /* ---------------- KEYBOARD ---------------- */
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  /* ---------------- AI MICRO LOOP ---------------- */
  useEffect(() => {
    const messages = [
      "💡 1 session can change your entire day.",
      "🔥 Don’t break your streak now.",
      "🧠 Focus = your strongest skill.",
      "⚡ Small action → identity shift.",
      "🎯 Just 5 minutes is enough to start.",
    ];

    setAiMessage(messages[0]);

    const interval = setInterval(() => {
      setAiMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- DAILY MISSION ENGINE ---------------- */
  const dailyMission = useMemo(() => {
    const missions = [
      "Complete 1 Magic16 session",
      "Hold perfect posture for 2 minutes",
      "Do 5 min breathing focus",
      "Reach 80% accuracy",
      "No skip day today",
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

  /* ---------------- UI ---------------- */
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

        {/* 🔥 STREAK BLOCK */}
        {!collapsed && (
          <div className="streak-box">
            <Flame size={16} />
            <span>{streak}-Day Streak</span>
          </div>
        )}

        {/* 🎯 DAILY MISSION */}
        {!collapsed && (
          <div className="mission-box">
            <Target size={14} />
            <span>{dailyMission}</span>
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
            <button className="icon-btn" onClick={toggleMobile}>
              <Menu size={22} />
            </button>

            <button className="icon-btn" onClick={toggleSidebar}>
              <ChevronLeft size={22} />
            </button>

            <h2 className="title">ManifiX Platform</h2>
          </div>

          <div className="right">

            {/* 🔥 STREAK WARNING */}
            <div className="badge">
              🔥 Streak Active
            </div>

            {/* 🧠 AI TIP */}
            <div className="ai-tip">
              <Zap size={14} /> {aiMessage}
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
