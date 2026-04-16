// src/components/Layout/MainLayout.jsx

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"

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
  Rocket,
} from "lucide-react"

import "../../styles/MainLayout.css"
import logo from "../../assets/logo.png"

export default function MainLayout() {
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [streak, setStreak] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  /* ================= LOAD USER STATE ================= */
  useEffect(() => {
    const s = Number(localStorage.getItem("magic16_streak") || 0)
    const started = localStorage.getItem("magic16_started") === "true"

    setStreak(s)
    setHasStarted(started)
  }, [])

  /* ================= AI ROTATION ================= */
  useEffect(() => {
    const messages = [
      "💡 1 session = identity shift",
      "🔥 Don’t break your streak now",
      "🧠 Focus builds discipline",
      "⚡ You are closer than yesterday",
      "🎯 Show up today or restart",
    ]

    let i = 0
    setAiMessage(messages[0])

    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setAiMessage(messages[i])
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  /* ================= CTA LOGIC ================= */
  const getCTA = () => {
    if (!hasStarted) return "🚀 Start 16-Day Reset"
    if (streak === 0) return "⚠️ Fix Your Streak Now"
    if (streak < 5) return "🔥 Build Momentum"
    if (streak < 12) return "⚡ Keep Going"
    return "👑 Finish Strong"
  }

  const handleCTA = () => {
    if (!hasStarted) {
      navigate("/onboarding")
    } else {
      navigate("/app/magic16")
    }
  }

  /* ================= NAV ================= */
  const navItems = useMemo(() => [
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
  ], [])

  return (
    <div className={`layout ${collapsed ? "collapsed" : ""}`}>

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>

        {/* HEADER */}
        <div className="sidebar-header">
          <img src={logo} className="logo" />
          {!collapsed && <h1>ManifiX</h1>}
        </div>

        {/* STREAK CARD */}
        {!collapsed && (
          <div className="streak-box pulse">
            <Flame size={16} />
            <span>{streak}-Day Streak</span>
          </div>
        )}

        {/* AI MESSAGE */}
        {!collapsed && (
          <div className="ai-box">
            <Zap size={14} />
            <span>{aiMessage}</span>
          </div>
        )}

        {/* NAV */}
        <nav className="nav">
          {navItems.map((group) => (
            <div key={group.section} className="nav-group">
              {!collapsed && <p className="nav-section">{group.section}</p>}

              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={20} />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* 🔥 FIXED CTA (MOST IMPORTANT PART) */}
        <div className="sidebar-footer">
          <button className="cta-btn" onClick={handleCTA}>
            <Rocket size={16} />
            {getCTA()}
          </button>
        </div>

      </aside>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <header className="topbar">
          <button onClick={() => setCollapsed(p => !p)}>
            {collapsed ? <Menu /> : <ChevronLeft />}
          </button>

          <h2>ManifiX</h2>

          <div className="badge">🔥 Active</div>
        </header>

        {/* CONTENT */}
        <main className="content">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
