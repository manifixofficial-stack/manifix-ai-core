/**
 * ManifiX — MainLayout.jsx  (Production v3)
 * ─────────────────────────────────────────
 * ✔ True responsive: desktop sidebar + mobile bottom-nav
 * ✔ useMediaQuery hook — no window.innerWidth in render
 * ✔ Streak reads from localStorage live
 * ✔ Collapsible sidebar (desktop)
 * ✔ Slide-in drawer (mobile)
 * ✔ Chat FAB with panel (mobile)
 * ✔ All nav routes match AppRouter.jsx
 * ✔ No MobileLayout.jsx dependency — unified file
 */

import React, {
  useState, useEffect, useMemo, useCallback, useRef,
} from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Sparkles, Brain, Trophy,
  Settings, Menu, Flame, Zap, Users, X,
  UserCircle, ChevronLeft, ChevronRight,
  HeartPulse, Moon, Apple, Wind, Baby,
  ShieldPlus, User, Pill, Activity,
  MessageCircle,
} from "lucide-react";

/* ══════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════ */
const T = {
  gold:        "#D4AF37",
  goldLight:   "#F0D060",
  goldDim:     "rgba(212,175,55,0.15)",
  goldGlow:    "rgba(212,175,55,0.32)",
  goldBorder:  "rgba(212,175,55,0.20)",
  bg:          "#080810",
  surface:     "#0D0D18",
  surface2:    "#12121E",
  panel:       "rgba(10,10,20,0.97)",
  border:      "rgba(212,175,55,0.11)",
  borderHi:    "rgba(212,175,55,0.30)",
  text:        "#ECEEF8",
  muted:       "rgba(236,238,248,0.45)",
  dim:         "rgba(236,238,248,0.20)",
  font:        "'Syne', sans-serif",
  mono:        "'JetBrains Mono', monospace",
  body:        "'DM Sans', sans-serif",
  SIDEBAR:     248,
  SIDEBAR_COL: 66,
  TOPBAR:      56,
  BOTTOMNAV:   66,
  BREAKPOINT:  768,
};

/* ══════════════════════════════════════════════
   CSS INJECTION
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.18); border-radius: 3px; }

  @keyframes mxl-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes mxl-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); }
    60%      { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
  }
  @keyframes mxl-scan {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(5000%); }
  }
  @keyframes mxl-fadeup {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:none; }
  }
  @keyframes mxl-slidein {
    from { transform:translateX(-100%); }
    to   { transform:translateX(0); }
  }
  @keyframes mxl-slideup {
    from { transform:translateY(100%); opacity:0; }
    to   { transform:translateY(0); opacity:1; }
  }
  @keyframes mxl-pop {
    0%   { transform:scale(1); }
    40%  { transform:scale(1.22) translateY(-2px); }
    100% { transform:scale(1); }
  }
  @keyframes mxl-blink {
    0%,49%,100%{ opacity:1; } 50%,99%{ opacity:0; }
  }
  @keyframes mxl-grid {
    0%,100%{ opacity:.03; } 50%{ opacity:.065; }
  }
  @keyframes mxl-orb {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(18px,-14px) scale(1.06); }
  }

  /* Gold shimmer text */
  .mxl-gold {
    background: linear-gradient(90deg,#9A6F00,${T.gold},${T.goldLight},${T.gold},#9A6F00);
    background-size: 300% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: mxl-shimmer 5s linear infinite;
  }

  /* Nav link — desktop */
  .mxl-nav {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 7px;
    color: ${T.muted}; text-decoration: none;
    font-size: 12px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase; font-family: ${T.font};
    transition: all .18s ease;
    border: 1px solid transparent;
    position: relative; overflow: hidden;
    white-space: nowrap;
  }
  .mxl-nav:hover {
    color: ${T.goldLight};
    background: ${T.goldDim};
    border-color: ${T.border};
  }
  .mxl-nav.active {
    color: ${T.gold};
    background: linear-gradient(90deg,rgba(212,175,55,0.14) 0%,transparent 100%);
    border-color: rgba(212,175,55,0.25);
    box-shadow: inset 3px 0 0 ${T.gold};
  }

  /* Nav item — mobile bottom */
  .mxl-mnav {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px;
    height: 100%; cursor: pointer;
    background: none; border: none; text-decoration: none;
    transition: all .2s ease;
    position: relative; border-radius: 8px; padding: 5px 3px;
    -webkit-tap-highlight-color: transparent;
    color: ${T.dim};
  }
  .mxl-mnav:hover { background: rgba(212,175,55,0.05); }
  .mxl-mnav.active { color: ${T.gold}; background: rgba(212,175,55,0.07); }
  .mxl-mnav.active svg { animation: mxl-pop .32s cubic-bezier(.16,1,.3,1) both; }

  /* Chat FAB */
  .mxl-fab {
    position: fixed; right: 16px;
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg,${T.gold} 0%,#8A6010 100%);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 22px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.5);
    transition: all .2s ease;
    animation: mxl-pulse 2.6s ease-in-out infinite;
    z-index: 200;
    -webkit-tap-highlight-color: transparent;
  }
  .mxl-fab:hover { transform: scale(1.08); }
  .mxl-fab:active { transform: scale(.94); }
  .mxl-fab.open { background: rgba(212,175,55,0.12); border: 1px solid ${T.goldBorder}; animation: none; }

  /* Chat panel */
  .mxl-chat {
    position: fixed; left: 0; right: 0; z-index: 180;
    background: rgba(7,7,16,0.98);
    border-top: 1px solid ${T.border};
    border-radius: 20px 20px 0 0;
    display: flex; flex-direction: column; overflow: hidden;
    backdrop-filter: blur(24px);
    box-shadow: 0 -16px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(212,175,55,0.16);
    animation: mxl-slideup .36s cubic-bezier(.16,1,.3,1) both;
  }

  /* Upgrade button */
  .mxl-upgrade {
    display: block; text-align: center; padding: 9px;
    background: linear-gradient(135deg,${T.gold} 0%,#9A6010 100%);
    color: #050508; font-weight: 700; font-size: 11px;
    letter-spacing: .12em; border-radius: 7px;
    text-decoration: none; margin-top: 10px;
    transition: opacity .2s, transform .1s;
    font-family: ${T.font};
  }
  .mxl-upgrade:hover { opacity:.88; transform:translateY(-1px); }

  /* Page fade */
  .mxl-page {
    animation: mxl-fadeup .32s ease both;
  }
`;

function injectCSS() {
  const id = "manifix-main-layout-v3";
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   useMediaQuery hook
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

/* ══════════════════════════════════════════════
   useStreak — reads localStorage live
══════════════════════════════════════════════ */
function useStreak() {
  const [streak, setStreak] = useState(
    () => parseInt(localStorage.getItem("magic16_streak") ?? "0", 10)
  );
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "magic16_streak") {
        setStreak(parseInt(e.newValue ?? "0", 10));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return streak;
}

/* ══════════════════════════════════════════════
   NAV STRUCTURE — matches AppRouter.jsx routes
══════════════════════════════════════════════ */
const NAV_GROUPS = [
  {
    section: "COMMAND",
    items: [
      { name: "Dashboard",   path: "/app/dashboard",   Icon: LayoutDashboard },
      { name: "Global Rank", path: "/app/leaderboard", Icon: Trophy          },
      { name: "Recruit",     path: "/app/recruit",     Icon: Users           },
    ],
  },
  {
    section: "SYSTEMS",
    items: [
      { name: "Magic16",    path: "/app/magic16", Icon: Sparkles },
      { name: "ManifiX AI", path: "/app/gpt",     Icon: Brain    },
    ],
  },
  {
    section: "HEALTH",
    items: [
      { name: "Mental",     path: "/app/mental",     Icon: HeartPulse },
      { name: "Sleep",      path: "/app/sleep",      Icon: Moon       },
      { name: "Nutrition",  path: "/app/nutrition",  Icon: Apple      },
      { name: "Stress",     path: "/app/stress",     Icon: Wind       },
      { name: "Women",      path: "/app/women",      Icon: User       },
      { name: "Elderly",    path: "/app/elderly",    Icon: Activity   },
      { name: "Medication", path: "/app/medication", Icon: Pill       },
      { name: "Children",   path: "/app/children",   Icon: Baby       },
      { name: "Preventive", path: "/app/preventive", Icon: ShieldPlus },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { name: "Membership", path: "/app/membership", Icon: Zap        },
      { name: "Settings",   path: "/app/settings",   Icon: Settings   },
    ],
  },
];

// Bottom nav — 5 most important items for mobile
const BOTTOM_NAV = [
  { name: "Home",    path: "/app/dashboard",   Icon: LayoutDashboard },
  { name: "Magic16", path: "/app/magic16",     Icon: Sparkles        },
  { name: "AI",      path: "/app/gpt",         Icon: Brain           },
  { name: "Rank",    path: "/app/leaderboard", Icon: Trophy          },
  { name: "More",    path: "/app/settings",    Icon: Settings        },
];

/* ══════════════════════════════════════════════
   LOGO
══════════════════════════════════════════════ */
const Logo = ({ size = 32 }) => {
  const [err, setErr] = useState(false);
  if (!err) return (
    <img src="/assets/logo.png" alt="ManifiX" width={size} height={size}
      style={{ objectFit:"contain", display:"block",
        filter:"drop-shadow(0 0 8px rgba(212,175,55,0.5))" }}
      onError={() => setErr(true)} />
  );
  return (
    <div style={{
      width:size, height:size, borderRadius: Math.round(size*0.28),
      background:"rgba(212,175,55,0.08)",
      border:"1.5px solid rgba(212,175,55,0.3)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: Math.round(size*0.48), fontFamily:T.font, color:T.gold,
    }}>M</div>
  );
};

/* ══════════════════════════════════════════════
   DESKTOP SIDEBAR
══════════════════════════════════════════════ */
function Sidebar({ collapsed, streak }) {
  const location = useLocation();
  const isActive = (p) =>
    location.pathname === p || location.pathname.startsWith(p + "/");

  return (
    <aside style={{
      width: collapsed ? T.SIDEBAR_COL : T.SIDEBAR,
      minWidth: collapsed ? T.SIDEBAR_COL : T.SIDEBAR,
      height: "100vh",
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      transition: "width .28s cubic-bezier(.4,0,.2,1), min-width .28s cubic-bezier(.4,0,.2,1)",
      position: "relative", zIndex: 90, overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Scan line */}
      <div aria-hidden style={{
        position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${T.gold}44,transparent)`,
        animation:"mxl-scan 5s linear infinite", pointerEvents:"none", zIndex:1,
      }} />

      {/* Brand */}
      <div style={{
        display:"flex", alignItems:"center",
        gap: collapsed ? 0 : 11,
        padding: collapsed ? "17px 0" : "17px 16px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom:`1px solid ${T.border}`,
        minHeight: 66, transition:"padding .28s",
      }}>
        <Logo size={collapsed ? 34 : 38} />
        {!collapsed && (
          <div>
            <div className="mxl-gold" style={{
              fontFamily:T.font, fontSize:17, fontWeight:800,
              letterSpacing:".18em", lineHeight:1,
            }}>MANIFIX AI</div>
            <div style={{
              fontFamily:T.mono, fontSize:8, color:T.dim,
              letterSpacing:".16em", textTransform:"uppercase", marginTop:3,
            }}>HUMAN PERFORMANCE OS</div>
          </div>
        )}
      </div>

      {/* Streak chip */}
      {!collapsed && streak > 0 && (
        <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:"rgba(212,175,55,0.07)",
            border:`1px solid ${T.border}`,
            borderRadius:20, padding:"5px 11px",
            fontFamily:T.mono, fontSize:10, fontWeight:600,
            color:T.gold, letterSpacing:".08em",
          }}>
            <Flame size={11} color={T.gold} />
            {streak} DAY STREAK
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"10px 8px" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.section} style={{ marginBottom:4 }}>
            {!collapsed ? (
              <p style={{
                fontFamily:T.mono, fontSize:9, fontWeight:700,
                color:T.dim, letterSpacing:".16em",
                padding:"9px 5px 3px", textTransform:"uppercase",
              }}>{group.section}</p>
            ) : gi > 0 ? (
              <div style={{ height:1, background:T.border, margin:"7px 4px" }} />
            ) : null}

            {group.items.map(({ name, path, Icon }) => (
              <NavLink key={path} to={path}
                className={({ isActive: a }) => `mxl-nav${a ? " active" : ""}`}
                title={collapsed ? name : undefined}
                style={collapsed ? { justifyContent:"center", padding:"9px 0" } : {}}
              >
                <Icon size={16} style={{ flexShrink:0 }} />
                {!collapsed && <span>{name}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Upgrade */}
      {!collapsed ? (
        <div style={{
          margin:"0 10px 14px",
          padding:"13px",
          background:"linear-gradient(135deg,rgba(212,175,55,0.07) 0%,rgba(100,50,200,0.07) 100%)",
          border:`1px solid ${T.border}`, borderRadius:9,
        }}>
          <p style={{ fontSize:10, color:T.muted, letterSpacing:".04em", marginBottom:2 }}>Unlock full power</p>
          <p style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:7 }}>Upgrade to Elite</p>
          <NavLink to="/app/membership" className="mxl-upgrade">⚡ GO ELITE</NavLink>
        </div>
      ) : (
        <div style={{ display:"flex", justifyContent:"center", paddingBottom:14 }}>
          <NavLink to="/app/membership" title="Go Elite" style={{
            width:34, height:34, borderRadius:"50%",
            background:`linear-gradient(135deg,${T.gold},#8A6010)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, textDecoration:"none",
            boxShadow:`0 4px 14px ${T.goldGlow}`,
          }}>⚡</NavLink>
        </div>
      )}
    </aside>
  );
}

/* ══════════════════════════════════════════════
   MOBILE DRAWER SIDEBAR
══════════════════════════════════════════════ */
function MobileDrawer({ open, onClose, streak }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose} style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.75)",
          zIndex:198, backdropFilter:"blur(4px)",
        }} aria-hidden />
      )}

      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, left:0, bottom:0,
        width: Math.min(T.SIDEBAR, 300),
        background:T.surface,
        borderRight:`1px solid ${T.border}`,
        zIndex:199,
        display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition:"transform .32s cubic-bezier(.16,1,.3,1)",
        overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 16px", borderBottom:`1px solid ${T.border}`,
          minHeight:60,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Logo size={34} />
            <div className="mxl-gold" style={{
              fontFamily:T.font, fontSize:15, fontWeight:800, letterSpacing:".15em",
            }}>MANIFIX AI</div>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:`1px solid ${T.border}`,
            borderRadius:7, padding:"5px 7px", cursor:"pointer",
            color:T.muted, display:"flex", alignItems:"center",
          }}><X size={15} /></button>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(212,175,55,0.07)", border:`1px solid ${T.border}`,
              borderRadius:20, padding:"5px 11px",
              fontFamily:T.mono, fontSize:10, color:T.gold,
            }}>
              <Flame size={11} color={T.gold} />
              {streak} DAY STREAK
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.section} style={{ marginBottom:4 }}>
              <p style={{
                fontFamily:T.mono, fontSize:9, fontWeight:700,
                color:T.dim, letterSpacing:".16em",
                padding:"9px 5px 3px", textTransform:"uppercase",
              }}>{group.section}</p>
              {group.items.map(({ name, path, Icon }) => (
                <NavLink key={path} to={path}
                  className={({ isActive: a }) => `mxl-nav${a ? " active" : ""}`}
                  onClick={onClose}
                >
                  <Icon size={15} style={{ flexShrink:0 }} />
                  <span>{name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Upgrade */}
        <div style={{ margin:"0 10px 14px", padding:"12px", background:"rgba(212,175,55,0.06)", border:`1px solid ${T.border}`, borderRadius:9 }}>
          <p style={{ fontSize:11, color:T.muted, marginBottom:6 }}>Unlock full power</p>
          <NavLink to="/app/membership" className="mxl-upgrade" onClick={onClose}>⚡ GO ELITE</NavLink>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   DESKTOP TOPBAR
══════════════════════════════════════════════ */
function Topbar({ collapsed, onToggle, pageName, streak }) {
  return (
    <header style={{
      height:T.TOPBAR, background:T.panel,
      borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"0 20px", flexShrink:0,
      position:"relative", zIndex:10,
      backdropFilter:"blur(20px)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:13 }}>
        <button onClick={onToggle} aria-label="Toggle sidebar" style={{
          background:"none", border:`1px solid ${T.border}`,
          borderRadius:7, padding:"6px 8px",
          color:T.muted, cursor:"pointer",
          display:"flex", alignItems:"center",
          transition:"border-color .2s, color .2s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.goldBorder; e.currentTarget.style.color=T.gold; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border;     e.currentTarget.style.color=T.muted; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <span style={{
          fontFamily:T.mono, fontSize:12, fontWeight:600,
          color:T.dim, letterSpacing:".08em",
        }}>
          MANIFIX <span style={{ color:T.dim }}>/ </span>
          <span style={{ color:T.gold }}>{pageName.toUpperCase()}</span>
        </span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* AI status */}
        <div style={{
          display:"flex", alignItems:"center", gap:7,
          padding:"5px 12px",
          background:"rgba(212,175,55,0.05)",
          border:`1px solid ${T.border}`,
          borderRadius:20, fontFamily:T.mono,
          fontSize:10, fontWeight:600, color:T.gold,
          letterSpacing:".08em",
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%",
            background:T.gold, display:"inline-block",
            boxShadow:`0 0 6px ${T.goldGlow}`,
            animation:"mxl-blink 2.2s step-end infinite",
          }} />
          AI ACTIVE
        </div>

        {streak > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"5px 10px",
            background:"rgba(212,175,55,0.06)",
            border:`1px solid ${T.border}`,
            borderRadius:20, fontFamily:T.mono,
            fontSize:11, color:T.gold, fontWeight:600,
          }}>
            <Flame size={11} color={T.gold} />
            {streak}
          </div>
        )}

        {/* Avatar */}
        <div style={{
          width:34, height:34, borderRadius:"50%",
          background:`linear-gradient(135deg,${T.gold} 0%,#8A6010 100%)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:700, color:"#050508",
          boxShadow:`0 0 0 2px ${T.surface}, 0 0 0 3.5px rgba(212,175,55,0.4)`,
          cursor:"pointer", userSelect:"none",
          fontFamily:T.font, letterSpacing:".05em",
        }}>M</div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════
   MOBILE TOPBAR
══════════════════════════════════════════════ */
function MobileTopbar({ onMenu, streak, pageName }) {
  return (
    <header style={{
      height:54, background:T.panel,
      borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"0 14px", flexShrink:0,
      position:"relative", zIndex:10,
      backdropFilter:"blur(20px)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onMenu} style={{
          background:"none", border:`1px solid ${T.border}`,
          borderRadius:7, padding:"6px 7px", cursor:"pointer",
          color:T.muted, display:"flex", alignItems:"center",
        }}><Menu size={16} /></button>
        <Logo size={28} />
        <div className="mxl-gold" style={{
          fontFamily:T.font, fontSize:14, fontWeight:800, letterSpacing:".15em",
        }}>MANIFIX AI</div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {streak > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"4px 9px",
            background:"rgba(212,175,55,0.07)",
            border:`1px solid ${T.border}`,
            borderRadius:20, fontFamily:T.mono,
            fontSize:10, color:T.gold, fontWeight:600,
          }}>
            <Flame size={10} color={T.gold} />
            {streak}
          </div>
        )}

        {/* Magic16 quick launch */}
        <NavLink to="/app/magic16" style={{
          display:"flex", alignItems:"center", gap:5,
          padding:"6px 11px", borderRadius:7,
          background:`linear-gradient(135deg,${T.gold} 0%,#8A6010 100%)`,
          border:"none", textDecoration:"none",
          fontFamily:T.font, fontSize:10, fontWeight:700,
          color:"#050508", letterSpacing:".1em",
          boxShadow:`0 3px 12px rgba(212,175,55,0.35)`,
        }}>
          <Zap size={11} />M16
        </NavLink>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════
   MOBILE BOTTOM NAV
══════════════════════════════════════════════ */
function BottomNav() {
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <nav style={{
      height:T.BOTTOMNAV,
      display:"flex", alignItems:"center",
      background:T.panel,
      borderTop:`1px solid ${T.border}`,
      backdropFilter:"blur(20px)",
      padding:"0 4px",
      flexShrink:0, zIndex:100,
      position:"relative",
      boxShadow:`0 -1px 0 rgba(212,175,55,0.12), 0 -18px 50px rgba(212,175,55,0.04)`,
    }}>
      {BOTTOM_NAV.map(({ name, path, Icon }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + "/");
        return (
          <NavLink key={path} to={path}
            className={`mxl-mnav${active ? " active" : ""}`}
          >
            <Icon size={20} />
            <span style={{
              fontFamily:T.mono, fontSize:8.5,
              letterSpacing:".09em", textTransform:"uppercase",
              color: active ? T.gold : T.dim,
            }}>{name}</span>
            {active && (
              <span style={{
                position:"absolute", bottom:4, left:"50%",
                transform:"translateX(-50%)",
                width:20, height:2, borderRadius:2,
                background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,
              }} />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ══════════════════════════════════════════════
   CHAT FAB + PANEL (mobile)
══════════════════════════════════════════════ */
function ChatOverlay({ bottomOffset }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={`mxl-fab${open ? " open" : ""}`}
        style={{ bottom: bottomOffset + 14 }}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        {open
          ? <X size={18} color={open ? T.gold : "#050508"} />
          : <MessageCircle size={19} color="#050508" />
        }
      </button>

      {open && (
        <div className="mxl-chat" style={{ bottom: bottomOffset, height:"56vh", maxHeight:460 }}>
          {/* Header */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 16px 10px",
            borderBottom:`1px solid ${T.border}`, flexShrink:0,
          }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              fontFamily:T.font, fontSize:13, fontWeight:700,
              color:T.gold, letterSpacing:".12em",
            }}>
              <Brain size={15} color={T.gold} />
              AI COACH
              <span style={{
                width:6, height:6, borderRadius:"50%",
                background:"#4ADE80",
                boxShadow:"0 0 6px rgba(74,222,128,0.8)",
              }} />
            </div>
            <button onClick={() => setOpen(false)} style={{
              background:"rgba(212,175,55,0.07)",
              border:`1px solid ${T.border}`,
              borderRadius:7, padding:"5px 7px",
              cursor:"pointer", color:T.muted, display:"flex", alignItems:"center",
            }}><X size={13} /></button>
          </div>

          {/* Body */}
          <div style={{
            flex:1, overflow:"hidden",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            padding:"20px",
          }}>
            <div style={{
              fontFamily:T.mono, fontSize:10, letterSpacing:".14em",
              color:T.dim, textTransform:"uppercase", textAlign:"center",
            }}>
              Navigate to{" "}
              <NavLink to="/app/gpt" onClick={() => setOpen(false)}
                style={{ color:T.gold, textDecoration:"none" }}>
                ManifiX AI →
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════
   GRID + ORB ATMOSPHERE
══════════════════════════════════════════════ */
function Atmosphere() {
  return (
    <>
      <div aria-hidden style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:`
          linear-gradient(rgba(212,175,55,0.03) 1px,transparent 1px),
          linear-gradient(90deg,rgba(212,175,55,0.03) 1px,transparent 1px)
        `,
        backgroundSize:"48px 48px",
        animation:"mxl-grid 8s ease-in-out infinite",
      }} />
      <div aria-hidden style={{
        position:"fixed", width:500, height:500, borderRadius:"50%",
        top:-140, left:-120, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle,rgba(212,175,55,0.055) 0%,transparent 68%)",
        filter:"blur(70px)", animation:"mxl-orb 16s ease-in-out infinite",
      }} />
      <div aria-hidden style={{
        position:"fixed", width:380, height:380, borderRadius:"50%",
        bottom:-80, right:-80, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle,rgba(100,60,220,0.045) 0%,transparent 68%)",
        filter:"blur(70px)",
        animation:"mxl-orb 20s ease-in-out infinite",
        animationDelay:"-8s",
      }} />
    </>
  );
}

/* ══════════════════════════════════════════════
   MAIN LAYOUT
══════════════════════════════════════════════ */
export default function MainLayout() {
  const location  = useLocation();
  const isMobile  = useMediaQuery(`(max-width: ${T.BREAKPOINT}px)`);
  const streak    = useStreak();

  const [collapsed,    setCollapsed]    = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => { injectCSS(); }, []);

  const pageName = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }, [location.pathname]);

  /* ── MOBILE LAYOUT ── */
  if (isMobile) {
    return (
      <div style={{
        display:"flex", flexDirection:"column",
        height:"100dvh", background:T.bg,
        fontFamily:T.body, color:T.text,
        overflow:"hidden", position:"relative",
      }}>
        <Atmosphere />

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          streak={streak}
        />

        <MobileTopbar
          onMenu={() => setDrawerOpen(true)}
          streak={streak}
          pageName={pageName}
        />

        {/* Page content */}
        <main style={{
          flex:1, overflowY:"auto", overflowX:"hidden",
          position:"relative", zIndex:1,
          WebkitOverflowScrolling:"touch",
          paddingBottom: T.BOTTOMNAV + 4,
        }}>
          <div className="mxl-page" style={{ padding:"16px" }}>
            <Outlet />
          </div>
        </main>

        <ChatOverlay bottomOffset={T.BOTTOMNAV} />
        <BottomNav />
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ── */
  return (
    <div style={{
      display:"flex", height:"100vh",
      background:T.bg, overflow:"hidden",
      fontFamily:T.body, color:T.text,
      position:"relative",
    }}>
      <Atmosphere />

      <Sidebar collapsed={collapsed} streak={streak} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <Topbar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          pageName={pageName}
          streak={streak}
        />

        <main style={{
          flex:1, overflowY:"auto",
          padding:"28px",
          background:"transparent",
          position:"relative", zIndex:1,
        }}>
          <div className="mxl-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
