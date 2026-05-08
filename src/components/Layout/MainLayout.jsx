import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Brain, Trophy,
  UserCircle, Settings, Menu, Flame, Zap, Users, X,
} from "lucide-react";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  gold:        "#D4AF37",
  goldLight:   "#F0D060",
  goldDim:     "rgba(212,175,55,0.18)",
  goldGlow:    "rgba(212,175,55,0.35)",
  bg:          "#0A0A0F",
  surface:     "#0F0F18",
  surfaceUp:   "#14141F",
  border:      "rgba(212,175,55,0.12)",
  borderHover: "rgba(212,175,55,0.35)",
  text:        "#E8E8F0",
  textMuted:   "rgba(232,232,240,0.42)",
  textDim:     "rgba(232,232,240,0.22)",
  purple:      "#7C3AED",
  font:        "'Rajdhani', 'DM Sans', sans-serif",
  fontMono:    "'JetBrains Mono', monospace",
  sidebar:     240,
  sidebarCollapsed: 68,
  topbar:      56,
};

// ─── GLOBAL STYLES INJECTION ────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${T.bg};
    color: ${T.text};
    font-family: ${T.font};
    overflow: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.gold}44; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulseGold {
    0%, 100% { box-shadow: 0 0 8px ${T.goldGlow}; }
    50%       { box-shadow: 0 0 20px ${T.goldGlow}, 0 0 40px ${T.goldDim}; }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(400%); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .nav-link-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 14px;
    border-radius: 8px;
    color: ${T.textMuted};
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.18s ease;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
  }
  .nav-link-item:hover {
    color: ${T.goldLight};
    background: ${T.goldDim};
    border-color: ${T.border};
  }
  .nav-link-item.active {
    color: ${T.gold};
    background: linear-gradient(90deg, rgba(212,175,55,0.15) 0%, transparent 100%);
    border-color: rgba(212,175,55,0.28);
    box-shadow: inset 3px 0 0 ${T.gold};
  }
  .nav-link-item.active::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(212,175,55,0.06) 0%, transparent 80%);
    pointer-events: none;
  }
  .upgrade-btn-mini {
    display: block;
    text-align: center;
    padding: 9px;
    background: linear-gradient(135deg, ${T.gold} 0%, #B8860B 100%);
    color: #000;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.1em;
    border-radius: 7px;
    text-decoration: none;
    margin-top: 10px;
    transition: opacity 0.2s, transform 0.1s;
    font-family: ${T.font};
  }
  .upgrade-btn-mini:hover { opacity: 0.88; transform: translateY(-1px); }

  .scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
    animation: fadeSlideIn 0.3s ease both;
  }

  @media (max-width: 768px) {
    .scroll-content { padding: 16px; }
  }
`;

// ─── INLINE SVG LOGO ────────────────────────────────────────────────────────────
const ManifixLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
    <path
      d="M5 25 L5 9 L11.5 9 L16 17.5 L20.5 9 L27 9 L27 25 L22.5 25 L22.5 15.5 L16 25.5 L9.5 15.5 L9.5 25 Z"
      fill="#fff"
    />
    <circle cx="26" cy="8" r="3.5" fill={T.gold} />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#0f0f18" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── AI STATUS INDICATOR ────────────────────────────────────────────────────────
const AiPulse = () => (
  <div style={{
    width: 7, height: 7, borderRadius: "50%",
    background: T.gold,
    boxShadow: `0 0 6px ${T.goldGlow}`,
    animation: "pulseGold 2s ease-in-out infinite",
    flexShrink: 0,
  }} />
);

// ─── MAIN LAYOUT ────────────────────────────────────────────────────────────────
export default function MainLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak]         = useState(0);
  const [userInitial]               = useState("Y");
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Inject global styles once
  useEffect(() => {
    const id = "manifix-layout-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const s = parseInt(localStorage.getItem("magic16_streak") ?? "0", 10);
    setStreak(s);
  }, []);

  const navItems = useMemo(() => [
    {
      section: "COMMAND",
      items: [
        { name: "Dashboard",   path: "/app/dashboard",   icon: LayoutDashboard },
        { name: "Global Rank", path: "/app/leaderboard", icon: Trophy },
        { name: "Recruit",     path: "/app/recruit",     icon: Users },
      ],
    },
    {
      section: "SYSTEMS",
      items: [
        { name: "Magic16",   path: "/app/magic16", icon: Sparkles },
        { name: "ManifiX AI", path: "/app/gpt",    icon: Brain },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        { name: "Elite Membership", path: "/app/membership", icon: UserCircle },
        { name: "Settings",         path: "/app/settings",   icon: Settings },
      ],
    },
  ], []);

  const sidebarW = collapsed ? T.sidebarCollapsed : T.sidebar;

  // ── Breadcrumb from pathname ──────────────────────────────────────────────────
  const pageName = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, overflow: "hidden" }}>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            zIndex: 98, backdropFilter: "blur(4px)",
          }}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Main navigation"
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          height: "100vh",
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
          zIndex: 99,
          overflow: "hidden",
          // Mobile: slide in from left
          ...(typeof window !== "undefined" && window.innerWidth <= 768
            ? {
                position: "fixed",
                left: mobileOpen ? 0 : -T.sidebar,
                width: T.sidebar,
                minWidth: T.sidebar,
              }
            : {}),
        }}
      >
        {/* Scanline effect */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${T.gold}44, transparent)`,
          animation: "scanline 4s linear infinite",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          padding: collapsed ? "18px 0" : "18px 18px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${T.border}`,
          minHeight: 68,
          transition: "padding 0.28s",
        }}>
          <div style={{ flexShrink: 0, animation: "pulseGold 3s ease-in-out infinite" }}>
            <ManifixLogo size={34} />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <h1 style={{
                fontSize: "18px",
                fontWeight: 700,
                color: T.gold,
                letterSpacing: "0.18em",
                fontFamily: T.font,
                lineHeight: 1,
                whiteSpace: "nowrap",
                textShadow: `0 0 20px ${T.goldGlow}`,
              }}>
                MANIFIX
              </h1>
              <p style={{
                fontSize: "9px",
                color: T.textDim,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 3,
                fontFamily: T.fontMono,
              }}>
                INTELLIGENCE · ELITE
              </p>
            </div>
          )}
        </div>

        {/* Streak chip */}
        {!collapsed && (
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(212,175,55,0.08)",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: 600,
              color: T.gold,
              letterSpacing: "0.08em",
              fontFamily: T.fontMono,
            }}>
              <Flame size={12} color={T.gold} />
              {streak} DAY STREAK
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 10px" }}>
          {navItems.map((group, gi) => (
            <div key={group.section} style={{ marginBottom: 6 }}>
              {!collapsed && (
                <p style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: T.textDim,
                  letterSpacing: "0.14em",
                  padding: "10px 6px 4px",
                  fontFamily: T.fontMono,
                }}>
                  {group.section}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: 1, background: T.border, margin: "8px 4px" }} />
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link-item${isActive ? " active" : ""}`
                  }
                  title={collapsed ? item.name : undefined}
                  style={collapsed ? { justifyContent: "center", padding: "10px 0" } : {}}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Upgrade box */}
        {!collapsed && (
          <div style={{
            margin: "0 12px 16px",
            padding: "14px",
            background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(124,58,237,0.08) 100%)",
            border: `1px solid ${T.border}`,
            borderRadius: 10,
          }}>
            <p style={{ fontSize: "11px", color: T.textMuted, marginBottom: 2, letterSpacing: "0.04em" }}>
              Unlock full power
            </p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: T.text, marginBottom: 8 }}>
              Level up your AI
            </p>
            <NavLink to="/app/membership" className="upgrade-btn-mini">
              ⚡ GO ELITE
            </NavLink>
          </div>
        )}

        {/* Collapsed upgrade dot */}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "0 0 16px" }}>
            <NavLink
              to="/app/membership"
              title="Go Elite"
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.gold}, #B8860B)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                textDecoration: "none",
                boxShadow: `0 4px 14px ${T.goldGlow}`,
              }}
            >
              ⚡
            </NavLink>
          </div>
        )}
      </aside>

      {/* ── MAIN VIEWPORT ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* TOPBAR */}
        <header style={{
          height: T.topbar,
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Desktop collapse / Mobile hamburger */}
            <button
              onClick={() => {
                if (window.innerWidth <= 768) setMobileOpen((o) => !o);
                else setCollapsed((c) => !c);
              }}
              aria-label="Toggle sidebar"
              style={{
                background: "none",
                border: `1px solid ${T.border}`,
                borderRadius: 7,
                padding: "6px 8px",
                color: T.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.goldGlow; e.currentTarget.style.color = T.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              <Menu size={17} />
            </button>

            {/* Breadcrumb */}
            <span style={{
              fontSize: "13px",
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: "0.08em",
              fontFamily: T.fontMono,
            }}>
              MANIFIX{" "}
              <span style={{ color: T.textDim }}>/ </span>
              <span style={{ color: T.gold }}>{pageName.toUpperCase()}</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* AI Status pill */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 12px",
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              fontSize: "11px",
              fontWeight: 600,
              color: T.gold,
              letterSpacing: "0.08em",
              fontFamily: T.fontMono,
            }}>
              <AiPulse />
              AI OBSERVER: ACTIVE
            </div>

            {/* Streak badge (topbar) */}
            {streak > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                background: "rgba(212,175,55,0.06)",
                border: `1px solid ${T.border}`,
                borderRadius: 20,
                fontSize: "11px",
                color: T.gold,
                fontFamily: T.fontMono,
                fontWeight: 600,
              }}>
                <Flame size={11} color={T.gold} />
                {streak}
              </div>
            )}

            {/* User avatar */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.gold} 0%, #B8860B 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "#000",
              boxShadow: `0 0 0 2px ${T.surface}, 0 0 0 3px ${T.gold}55`,
              cursor: "pointer",
              userSelect: "none",
              fontFamily: T.font,
              letterSpacing: "0.05em",
            }}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          className="scroll-content"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px",
            background: T.bg,
          }}
        >
          {/* Subtle grid texture */}
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
            zIndex: 0,
          }} aria-hidden="true" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
