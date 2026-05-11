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

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────────
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

// ─── LOGO ───────────────────────────────────────────────────────────────────────
const LOGO_SRC = "data:image/png;base64,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";

const ManifixLogo = ({ size = 32 }) => (
  <img
    src={LOGO_SRC}
    alt="ManifiX"
    width={size}
    height={size}
    style={{
      objectFit: "contain",
      display: "block",
      filter: "drop-shadow(0 0 10px rgba(212,175,55,0.45))",
    }}
  />
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

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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
        { name: "Magic16",    path: "/app/magic16", icon: Sparkles },
        { name: "ManifiX AI", path: "/app/gpt",     icon: Brain },
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

  const pageName = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, overflow: "hidden" }}>

      {/* Mobile overlay */}
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

      {/* SIDEBAR */}
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
          <div style={{ flexShrink: 0 }}>
            <ManifixLogo size={collapsed ? 36 : 40} />
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

      {/* MAIN VIEWPORT */}
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
