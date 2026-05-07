import React, { useState, useMemo, useCallback, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Brain,
  Trophy, // Leaderboard
  UserCircle, // Membership/Identity
  Settings,
  Menu,
  ChevronLeft,
  Flame,
  Zap,
} from "lucide-react";

import "../../styles/MainLayout.css";
import logo from "../../assets/logo.png";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  /* ---------------- 2026 ELITE NAV ---------------- */
  const navItems = useMemo(() => [
    {
      section: "COMMAND",
      items: [
        { name: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard },
        { name: "Global Rank", path: "/app/leaderboard", icon: Trophy }, // BILLION $ ADDITION
      ],
    },
    {
      section: "SYSTEMS",
      items: [
        { name: "Magic16", path: "/app/magic16", icon: Sparkles },
        { name: "ManifiX AI", path: "/app/gpt", icon: Brain },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        { name: "Elite Membership", path: "/app/membership", icon: UserCircle }, // UPGRADED BILLING
        { name: "Settings", path: "/app/settings", icon: Settings },
      ],
    },
  ], []);

  useEffect(() => {
    const s = parseInt(localStorage.getItem("magic16_streak") ?? "0", 10);
    setStreak(s);
  }, []);

  return (
    <div className="elite-layout">
      {/* SIDEBAR: NOW USES GOLD ACCENTS */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="logo" className="gold-shadow" />
          {!collapsed && <h1 className="gold-text">MANIFIX</h1>}
        </div>

        {!collapsed && (
          <div className="status-container">
            <div className="streak-chip">
              <Flame size={14} color="#D4AF37" />
              <span>{streak} DAY STREAK</span>
            </div>
          </div>
        )}

        <nav>
          {navItems.map((group) => (
            <div key={group.section} className="nav-group">
              {!collapsed && <p className="section-label">{group.section}</p>}
              {group.items.map((item) => (
                <NavLink key={item.name} to={item.path} className="nav-link">
                  <item.icon size={20} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* UPGRADE PROMPT IN SIDEBAR */}
        {!collapsed && (
          <div className="sidebar-upgrade-box">
             <p>Level up your AI</p>
             <NavLink to="/app/membership" className="upgrade-btn-mini">GO ELITE</NavLink>
          </div>
        )}
      </aside>

      <div className="main-viewport">
        <header className="elite-topbar">
          <div className="left">
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <Menu size={20} />
            </button>
            <span className="breadcrumb">MANIFIX / <span className="gold-text">ELITE</span></span>
          </div>

          <div className="right">
            <div className="ai-status-pill">
              <Zap size={12} fill="#D4AF37" color="#D4AF37" />
              <span>AI OBSERVER: ACTIVE</span>
            </div>
            <div className="user-avatar-gold">Y</div>
          </div>
        </header>

        <main className="scroll-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
