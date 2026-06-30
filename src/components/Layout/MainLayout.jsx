import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ShieldAlert, Landmark, EyeOff, Trophy,
  Settings, Menu, X, ChevronLeft, ChevronRight,
  MessageCircle, HelpCircle, Zap,
} from "lucide-react";

/* ══════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════ */
const T = {
  gold: "#D4AF37",
  goldLight: "#F0D060",
  goldDim: "rgba(212,175,55,0.10)",
  goldBorder: "rgba(212,175,55,0.20)",
  bg: "#08070a",
  surface: "#0d0b08",
  surface2: "#15110a",
  panel: "rgba(10,9,7,0.97)",
  border: "rgba(212,175,55,0.12)",
  borderHi: "rgba(212,175,55,0.30)",
  text: "#f4ead0",
  muted: "rgba(244,234,208,0.5)",
  dim: "rgba(244,234,208,0.25)",
  font: "'Syne', sans-serif",
  mono: "'JetBrains Mono', monospace",
  body: "'DM Sans', sans-serif",
  SIDEBAR: 248,
  SIDEBAR_COL: 66,
  TOPBAR: 60,
  BOTTOMNAV: 64,
  BREAKPOINT: 768,
};

/* ══════════════════════════════════════════════
   CSS INJECTION
══════════════════════════════════════════════ */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 3px; }

  @keyframes mxl-shimmer { 0% { background-position: -300% center; } 100% { background-position: 300% center; } }
  @keyframes mxl-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); } 60% { box-shadow: 0 0 0 8px rgba(212,175,55,0); } }
  @keyframes mxl-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes mxl-slideup { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
  @keyframes mxl-pop { 0% { transform:scale(1); } 40% { transform:scale(1.15); } 100% { transform:scale(1); } }
  @keyframes mxl-grid { 0%,100% { opacity:.02; } 50% { opacity:.05; } }
  @keyframes mxl-orb { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(15px,-10px) scale(1.04); } }

  .mxl-gold {
    background: linear-gradient(90deg,#9A6F00,${T.gold},${T.goldLight},${T.gold},#9A6F00);
    background-size: 300% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: mxl-shimmer 5s linear infinite;
  }

  .mxl-nav {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px;
    color: ${T.muted}; text-decoration: none;
    font-size: 11.5px; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; font-family: ${T.font};
    transition: all .15s ease;
    border: 1px solid transparent;
    white-space: nowrap;
  }
  .mxl-nav:hover { color: ${T.goldLight}; background: ${T.goldDim}; border-color: ${T.border}; }
  .mxl-nav.active {
    color: ${T.gold};
    background: linear-gradient(90deg,rgba(212,175,55,0.12) 0%,transparent 100%);
    border-color: rgba(212,175,55,0.22);
    box-shadow: inset 3px 0 0 ${T.gold};
  }

  .mxl-mnav {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    height: 100%; cursor: pointer; text-decoration: none;
    transition: all .2s ease; position: relative; color: ${T.dim};
    -webkit-tap-highlight-color: transparent;
  }
  .mxl-mnav.active { color: ${T.gold}; }
  .mxl-mnav.active svg { animation: mxl-pop .3s ease both; }

  .mxl-fab {
    position: fixed; right: 20px; width: 46px; height: 46px; border-radius: 50%;
    background: linear-gradient(135deg,${T.gold} 0%,#8A6010 100%);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(212,175,55,0.35); transition: all .2s ease;
    animation: mxl-pulse 2.5s ease-in-out infinite; z-index: 200;
    -webkit-tap-highlight-color: transparent;
  }
  .mxl-fab.open { background: ${T.surface2}; border: 1px solid ${T.goldBorder}; animation: none; }

  .mxl-chat {
    position: fixed; left: 0; right: 0; z-index: 180; background: rgba(7,6,4,0.99);
    border-top: 1px solid ${T.border}; border-radius: 20px 20px 0 0;
    display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(20px);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.8); animation: mxl-slideup .3s cubic-bezier(.16,1,.3,1) both;
  }

  .mxl-upgrade {
    display: block; text-align: center; padding: 10px;
    background: linear-gradient(135deg,${T.gold} 0%,#9A6010 100%);
    color: #0a0805; font-weight: 700; font-size: 11px; letter-spacing: .1em;
    border-radius: 8px; text-decoration: none; font-family: ${T.font}; transition: opacity .2s;
  }
  .mxl-upgrade:hover { opacity: .9; }
  .mxl-page { animation: mxl-fadeup .28s ease both; }
`;

function injectCSS() {
  const id = "impulseguard-layout-v1";
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function useStreak() {
  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(localStorage.getItem("impulseguard_streak") ?? "5", 10);
    } catch {
      return 5;
    }
  });
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "impulseguard_streak") setStreak(parseInt(e.newValue ?? "0", 10));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return streak;
}

/* ══════════════════════════════════════════════
   NAVIGATION SCHEMA
══════════════════════════════════════════════ */
const NAV_GROUPS = [
  {
    section: "FINTECH ACTUATOR",
    items: [
      { name: "Shield Gate", path: "/app/dashboard", Icon: ShieldAlert },
      { name: "Impulse Vault", path: "/app/vault", Icon: Landmark },
      { name: "DeadMan Switch", path: "/app/subscriptions", Icon: EyeOff },
    ],
  },
  {
    section: "PLATFORM OS",
    items: [
      { name: "Global Ranks", path: "/app/leaderboard", Icon: Trophy },
      { name: "Edge Security", path: "/app/security", Icon: HelpCircle },
      { name: "Card Settings", path: "/app/settings", Icon: Settings },
    ],
  },
];

const BOTTOM_NAV = [
  { name: "Shield", path: "/app/dashboard", Icon: ShieldAlert },
  { name: "Vault", path: "/app/vault", Icon: Landmark },
  { name: "DeadMan", path: "/app/subscriptions", Icon: EyeOff },
  { name: "Rank", path: "/app/leaderboard", Icon: Trophy },
  { name: "Config", path: "/app/settings", Icon: Settings },
];

/* ══════════════════════════════════════════════
   UI SHELL FRAGMENTS
══════════════════════════════════════════════ */
function Logo({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "rgba(212,175,55,0.08)",
        border: "1.5px solid rgba(212,175,55,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.46),
        fontFamily: T.font,
        color: T.gold,
        fontWeight: 800,
      }}
    >
      I
    </div>
  );
}

function Atmosphere() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(212,175,55,0.02) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "mxl-grid 8s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 450,
          height: 450,
          borderRadius: "50%",
          top: -150,
          left: -100,
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle,rgba(212,175,55,0.05) 0%,transparent 70%)",
          filter: "blur(60px)",
          animation: "mxl-orb 15s ease-in-out infinite",
        }}
      />
    </>
  );
}

function NavItem({ name, path, Icon, collapsed, onClick }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) => `mxl-nav${isActive ? " active" : ""}`}
      title={collapsed ? name : undefined}
      style={collapsed ? { justifyContent: "center", padding: "10px 0" } : {}}
      onClick={onClick}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{name}</span>}
    </NavLink>
  );
}

function Sidebar({ collapsed, streak }) {
  return (
    <aside
      style={{
        width: collapsed ? T.SIDEBAR_COL : T.SIDEBAR,
        minWidth: collapsed ? T.SIDEBAR_COL : T.SIDEBAR,
        height: "100vh",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 90,
        overflow: "hidden",
        flexShrink: 0,
        transition: "width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          padding: "16px",
          borderBottom: `1px solid ${T.border}`,
          minHeight: 66,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Logo size={30} />
        {!collapsed && (
          <div>
            <div className="mxl-gold" style={{ fontFamily: T.font, fontSize: 15, fontWeight: 800, letterSpacing: ".1em" }}>
              IMPULSEGUARD
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 8, color: T.dim, letterSpacing: ".1em", marginTop: 2 }}>
              BIOMETRIC BANKING OS
            </div>
          </div>
        )}
      </div>

      {!collapsed && streak > 0 && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "4px 10px",
              fontFamily: T.mono,
              fontSize: 10,
              color: T.gold,
            }}
          >
            <Zap size={11} /> {streak} PROTECTION STREAK
          </div>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.section} style={{ marginBottom: 12 }}>
            {!collapsed ? (
              <p
                style={{
                  fontFamily: T.mono,
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: T.dim,
                  letterSpacing: ".14em",
                  padding: "4px 6px",
                  textTransform: "uppercase",
                }}
              >
                {group.section}
              </p>
            ) : gi > 0 ? (
              <div style={{ height: 1, background: T.border, margin: "8px 4px" }} />
            ) : null}
            {group.items.map((item) => (
              <NavItem key={item.path} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div
          style={{
            margin: "0 10px 16px",
            padding: "12px",
            background: "rgba(212,175,55,0.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            Elite Hardware Access
          </p>
          <NavLink to="/app/membership" className="mxl-upgrade">
            ⚡ GO ELITE
          </NavLink>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 16 }}>
          <NavLink
            to="/app/membership"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${T.gold},#8A6010)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            ⚡
          </NavLink>
        </div>
      )}
    </aside>
  );
}

function Topbar({ collapsed, onToggle, pageName, streak }) {
  return (
    <header
      style={{
        height: T.TOPBAR,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: `1px solid ${T.border}`,
        background: T.panel,
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 80,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={onToggle}
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "transparent",
            color: T.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: ".04em" }}>
          {pageName}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: T.mono,
            fontSize: 10,
            color: T.gold,
            background: "rgba(212,175,55,0.06)",
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "5px 10px",
          }}
        >
          <Zap size={11} /> {streak} STREAK
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${T.gold},#8A6010)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "#0a0805",
          }}
        >
          MR
        </div>
      </div>
    </header>
  );
}

function MobileTopbar({ onMenu, streak, pageName }) {
  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        borderBottom: `1px solid ${T.border}`,
        background: T.panel,
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 80,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onMenu}
          style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.text }}>{pageName}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: T.mono,
          fontSize: 10,
          color: T.gold,
        }}
      >
        <Zap size={11} /> {streak}
      </div>
    </header>
  );
}

function MobileDrawer({ open, onClose, streak }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 198, backdropFilter: "blur(4px)" }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          zIndex: 199,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .3s cubic-bezier(.16,1,.3,1)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={26} />
            <span className="mxl-gold" style={{ fontFamily: T.font, fontSize: 14, fontWeight: 800 }}>
              IMPULSEGUARD
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "4px 10px",
              fontFamily: T.mono,
              fontSize: 10,
              color: T.gold,
            }}
          >
            <Zap size={11} /> {streak} PROTECTION STREAK
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.section} style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontFamily: T.mono,
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: T.dim,
                  padding: "0 6px 4px",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                }}
              >
                {group.section}
              </p>
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} collapsed={false} onClick={onClose} />
              ))}
            </div>
          ))}
        </nav>

        <div style={{ margin: "0 10px 16px" }}>
          <NavLink to="/app/membership" className="mxl-upgrade" onClick={onClose}>
            ⚡ GO ELITE
          </NavLink>
        </div>
      </div>
    </>
  );
}

function BottomNav() {
  const location = useLocation();
  return (
    <nav
      style={{
        height: T.BOTTOMNAV,
        display: "flex",
        alignItems: "center",
        background: T.panel,
        borderTop: `1px solid ${T.border}`,
        backdropFilter: "blur(20px)",
        padding: "0 4px",
        zIndex: 100,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {BOTTOM_NAV.map(({ name, path, Icon }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
          <NavLink key={path} to={path} className={`mxl-mnav${active ? " active" : ""}`}>
            <Icon size={18} style={{ color: active ? T.gold : T.dim }} />
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 8,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: active ? T.gold : T.dim,
              }}
            >
              {name}
            </span>
            {active && (
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 1.5,
                  background: T.gold,
                }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function ChatOverlay({ bottomOffset }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`mxl-fab${open ? " open" : ""}`}
        style={{ bottom: bottomOffset + 14 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle assistant"
      >
        {open ? <X size={18} color={T.gold} /> : <MessageCircle size={18} color="#0a0805" />}
      </button>
      {open && (
        <div className="mxl-chat" style={{ bottom: bottomOffset, height: "48vh", maxHeight: 400 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: ".08em" }}>
              🛡️ ACTIVE REASONING ENGINE
            </span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}>
              <X size={16} />
            </button>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: T.mono, fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Biometric authorization telemetry linked. Monitoring checkouts locally...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════
   MAIN LAYOUT
══════════════════════════════════════════════ */
export default function MainLayout() {
  const location = useLocation();
  const isMobile = useMediaQuery(`(max-width: ${T.BREAKPOINT}px)`);
  const streak = useStreak();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    injectCSS();
  }, []);

  const pageName = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          background: T.bg,
          fontFamily: T.body,
          color: T.text,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Atmosphere />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} streak={streak} />
        <MobileTopbar onMenu={() => setDrawerOpen(true)} streak={streak} pageName={pageName} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            zIndex: 1,
            WebkitOverflowScrolling: "touch",
            paddingBottom: T.BOTTOMNAV + 4,
          }}
        >
          <div className="mxl-page" style={{ padding: "16px" }}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
        <ChatOverlay bottomOffset={T.BOTTOMNAV} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: T.bg,
        overflow: "hidden",
        fontFamily: T.body,
        color: T.text,
        position: "relative",
      }}
    >
      <Atmosphere />
      <Sidebar collapsed={collapsed} streak={streak} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} pageName={pageName} streak={streak} />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px", position: "relative", zIndex: 1 }}>
          <div className="mxl-page">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatOverlay bottomOffset={16} />
    </div>
  );
}
