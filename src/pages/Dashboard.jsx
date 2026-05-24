import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../services/auth.service";
import { supabase } from "../lib/supabaseClient"; // adjust path if yours differs

/* ─────────────────────────────────────────────
   STORAGE KEYS — single source of truth
───────────────────────────────────────────── */
const KEYS = {
  streak:    "magic16_streak",
  xp:        "magic16_xp",
  level:     "magic16_level",
  lastDate:  "magic16_last_date",
  prevLevel: "magic16_prev_level",
  rankSeed:  "magic16_rank_seed",
  goal:      "magic16_goal",
  identity:  "magic16_identity",
  intensity: "magic16_intensity",
  totalSess: "magic16_total_sessions",
  mode:      "magic16_mode",
  lang:      "magic16_lang",
};

const XP_PER_LEVEL   = 500;
const XP_PER_SESSION = 120;

/* ─────────────────────────────────────────────
   MODE CONFIG
───────────────────────────────────────────── */
const MODES = [
  {
    id: "morning",
    label: "Morning",
    icon: "🌿",
    sub: "Energise & activate",
    color: "#c8a84b",
    border: "#2a2010",
    bg: "#0f0d08",
  },
  {
    id: "sleep",
    label: "Sleep",
    icon: "🌙",
    sub: "Wind-down ritual",
    color: "#6a9fd4",
    border: "#0f1e2e",
    bg: "#080d18",
    premium: true,
  },
  {
    id: "focus",
    label: "Focus",
    icon: "🎯",
    sub: "Deep work prep",
    color: "#9b8fd4",
    border: "#1e1a30",
    bg: "#0d0b18",
  },
  {
    id: "posture",
    label: "Posture",
    icon: "🧍",
    sub: "Desk & remote work",
    color: "#9bbdaa",
    border: "#1a2a20",
    bg: "#0a1410",
    comingSoon: true,
  },
];

/* ─────────────────────────────────────────────
   LANGUAGE CONFIG
───────────────────────────────────────────── */
const LANGUAGES = [
  { code: "en",  flag: "🇬🇧", name: "English"  },
  { code: "hi",  flag: "🇮🇳", name: "हिन्दी"    },
  { code: "te",  flag: "🇮🇳", name: "తెలుగు"    },
  { code: "ta",  flag: "🇮🇳", name: "தமிழ்"     },
  { code: "es",  flag: "🇪🇸", name: "Español"   },
  { code: "ar",  flag: "🇸🇦", name: "العربية"   },
  { code: "fr",  flag: "🇫🇷", name: "Français"  },
  { code: "pt",  flag: "🇧🇷", name: "Português" },
  { code: "de",  flag: "🇩🇪", name: "Deutsch"   },
  { code: "zh",  flag: "🇨🇳", name: "中文"       },
];

/* ─────────────────────────────────────────────
   loadState — checks for missed days + new keys
───────────────────────────────────────────── */
function loadState() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const lastDate  = localStorage.getItem(KEYS.lastDate) || "";

  let streak = Number(localStorage.getItem(KEYS.streak) || 0);
  if (lastDate && lastDate !== today && lastDate !== yesterday) {
    streak = 0;
    localStorage.setItem(KEYS.streak,   "0");
    localStorage.setItem(KEYS.xp,       "0");
    localStorage.setItem(KEYS.level,    "1");
    localStorage.removeItem(KEYS.lastDate);
  }

  const xp          = Number(localStorage.getItem(KEYS.xp)       || 0);
  const level       = Number(localStorage.getItem(KEYS.level)     || 1);
  const missionDone = lastDate === today;
  const goal        = localStorage.getItem(KEYS.goal)     || "Discipline";
  const identity    = localStorage.getItem(KEYS.identity) || "I don't quit.";
  const intensity   = localStorage.getItem(KEYS.intensity)|| "Standard";
  const totalSess   = Number(localStorage.getItem(KEYS.totalSess) || streak);
  const mode        = localStorage.getItem(KEYS.mode) || "morning";
  const lang        = localStorage.getItem(KEYS.lang) || "en";

  let rankSeed = Number(localStorage.getItem(KEYS.rankSeed) || 0);
  if (!rankSeed) {
    rankSeed = Math.floor(Math.random() * 9000) + 2000;
    localStorage.setItem(KEYS.rankSeed, rankSeed);
  }
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);

  return { streak, xp, level, missionDone, globalRank, goal, identity, intensity, totalSess, mode, lang };
}

/* ─────────────────────────────────────────────
   recordSessionComplete
───────────────────────────────────────────── */
export function recordSessionComplete() {
  const today  = new Date().toDateString();
  let streak   = Number(localStorage.getItem(KEYS.streak)    || 0) + 1;
  let xp       = Number(localStorage.getItem(KEYS.xp)        || 0) + XP_PER_SESSION;
  let level    = Number(localStorage.getItem(KEYS.level)      || 1);
  let total    = Number(localStorage.getItem(KEYS.totalSess)  || 0) + 1;

  while (xp >= XP_PER_LEVEL) { xp -= XP_PER_LEVEL; level += 1; }

  localStorage.setItem(KEYS.streak,    streak);
  localStorage.setItem(KEYS.xp,        xp);
  localStorage.setItem(KEYS.level,     level);
  localStorage.setItem(KEYS.lastDate,  today);
  localStorage.setItem(KEYS.totalSess, total);
}

/* ─────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("db-styles")) return;
  const s = document.createElement("style");
  s.id = "db-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes db-scan    { from{transform:translateY(-100%)} to{transform:translateY(600%)} }
    @keyframes db-shimmer { from{background-position:-200% center} to{background-position:200% center} }
    @keyframes db-blink   { 0%,100%{opacity:1} 50%{opacity:0.1} }
    @keyframes db-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes db-breathe { 0%,100%{opacity:.12;transform:scale(1)} 50%{opacity:.28;transform:scale(1.06)} }
    @keyframes db-danger  { 0%,100%{box-shadow:0 0 0 0 rgba(255,60,60,.5)} 50%{box-shadow:0 0 0 12px rgba(255,60,60,0)} }
    @keyframes db-grid    { 0%,100%{opacity:.04} 50%{opacity:.08} }
    @keyframes db-streak  { 0%{transform:scale(0.6) rotate(-8deg);opacity:0} 60%{transform:scale(1.12) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
    @keyframes db-xp-flow { from{background-position:-200% center} to{background-position:200% center} }
    @keyframes db-ticker  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes db-report-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(200,168,75,.3)} 50%{box-shadow:0 0 0 8px rgba(200,168,75,0)} }
    @keyframes db-auth-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

    .db-shimmer {
      background: linear-gradient(90deg,#c8a84b,#ffe08a,#ffc83c,#ffe08a,#c8a84b);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: db-shimmer 2.8s linear infinite;
    }
    .db-blink       { animation: db-blink 1.1s ease-in-out infinite; }
    .db-float       { animation: db-float 3.5s ease-in-out infinite; }
    .db-breathe     { animation: db-breathe 5s ease-in-out infinite; }
    .db-danger-btn  { animation: db-danger 1.6s ease-in-out infinite; }
    .db-streak-pop  { animation: db-streak .6s cubic-bezier(.34,1.56,.64,1) both; }
    .db-ticker      { animation: db-ticker .4s ease both; }
    .db-report-pulse { animation: db-report-pulse 2s ease-in-out infinite; }
    .db-auth-spin   { animation: db-auth-spin 1s linear infinite; }

    .db-cta-btn {
      display: block; width: 100%; padding: 18px 0;
      background: #ffc83c; color: #080808;
      text-align: center; text-decoration: none;
      font-family: 'DM Mono', monospace;
      font-size: 13px; font-weight: 700;
      letter-spacing: .22em; text-transform: uppercase;
      cursor: pointer; border: none;
      transition: background .15s, transform .1s;
    }
    .db-cta-btn:hover  { background: #ffe08a; }
    .db-cta-btn:active { transform: scale(.98); }
    .db-cta-done {
      display: block; width: 100%; padding: 18px 0;
      background: #0f0f0f; color: #2a2a2a;
      text-align: center; text-decoration: none;
      font-family: 'DM Mono', monospace;
      font-size: 13px; font-weight: 700;
      letter-spacing: .22em; text-transform: uppercase;
      border: 1px solid #1a1a1a; cursor: default;
    }
    .db-opt-btn {
      background: transparent; border: 1px solid #1a1a1a;
      color: #2a2a2a; font-family: 'DM Mono', monospace;
      font-size: 10px; letter-spacing: .18em;
      text-transform: uppercase; padding: 8px 0;
      cursor: pointer; transition: color .2s, border-color .2s;
      width: 100%;
    }
    .db-opt-btn:hover { color: #555; border-color: #2a2a2a; }

    /* ── Mode selector ── */
    .db-mode-card {
      border: 1px solid #181818;
      background: #0c0c0c;
      padding: 10px 12px;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .db-mode-card:hover { border-color: #2a2a2a; background: #0f0f0f; }
    .db-mode-card.active { background: var(--mode-bg); border-color: var(--mode-border); }

    /* ── Lang picker ── */
    .db-lang-select {
      background: #0c0c0c;
      border: 1px solid #1a1a1a;
      color: #555;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: .12em;
      padding: 7px 10px;
      cursor: pointer;
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      outline: none;
      transition: border-color .2s, color .2s;
    }
    .db-lang-select:hover { border-color: #2a2a2a; color: #888; }
    .db-lang-select:focus { border-color: #c8a84b55; color: #c8a84b; }
    .db-lang-select option { background: #0c0c0c; color: #888; }

    /* ── Weekly report button ── */
    .db-report-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 14px 16px;
      background: #0c0c08;
      border: 1px solid #2a2010;
      color: #c8a84b;
      font-family: 'DM Mono', monospace;
      font-size: 11px; font-weight: 500;
      letter-spacing: .18em; text-transform: uppercase;
      cursor: pointer;
      transition: background .2s, border-color .2s;
    }
    .db-report-btn:hover { background: #0f0f0a; border-color: #c8a84b55; }
    .db-report-btn:active { transform: scale(.99); }

    /* ── Auth loading screen ── */
    .db-auth-loader {
      position: fixed; inset: 0;
      background: #080808;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; z-index: 300;
    }
    .db-auth-loader-ring {
      width: 32px; height: 32px;
      border: 2px solid #1a1a1a;
      border-top-color: #c8a84b;
      border-radius: 50%;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   PSYCH COPY
───────────────────────────────────────────── */
const PSYCH = [
  "The brain seeks comfort. Deny it.",
  "Every elite performer you admire did the work today.",
  "Consistency is not motivation. It is architecture.",
  "You don't rise to the occasion. You fall to your systems.",
  "The streak is not the goal. It is the proof.",
  "Discomfort is data. Keep moving.",
  "Champions aren't made in sessions. They're revealed by them.",
  "The only thing standing between you and 1% is today's 16 minutes.",
];
const getPsych = (streak, danger, done) => {
  if (done)   return "Biological objective achieved. You are in the top 1% today.";
  if (danger) return "CRITICAL: Window closing. Execute now or reset to zero.";
  return PSYCH[streak % PSYCH.length];
};

const getMilestone = (streak) => {
  if (streak >= 16) return { label: "PROTOCOL COMPLETE", color: "#ffc83c" };
  if (streak >= 7)  return { label: "ONE WEEK WARRIOR",  color: "#c8a84b" };
  if (streak >= 3)  return { label: "LOCKED IN",         color: "#888" };
  return null;
};

/* ─────────────────────────────────────────────
   WEEKLY REPORT COMPONENT
───────────────────────────────────────────── */
function WeeklyReport({ streak, xp, level, totalSess, globalRank, onClose }) {
  const accuracy = Math.min(99, 70 + streak * 2);
  const weekSess = Math.min(7, streak);
  const weekXP   = weekSess * XP_PER_SESSION;

  return (
    <motion.div
      style={{
        position: "fixed", inset: 0,
        background: "#000000f5",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "24px",
        overflowY: "auto",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          width: "min(400px, 100%)",
          border: "1px solid #2a2010",
          background: "#09090a",
          padding: "24px 20px",
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 20,
          borderBottom: "1px solid #141414", paddingBottom: 14,
        }}>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 28, letterSpacing: ".06em", lineHeight: 1,
            }} className="db-shimmer">Weekly Report</div>
            <div style={{
              fontSize: 9, letterSpacing: ".2em",
              color: "#2a2a2a", textTransform: "uppercase", marginTop: 3,
            }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #1a1a1a",
            color: "#333", fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: ".15em", padding: "5px 10px",
            cursor: "pointer", textTransform: "uppercase",
          }}>✕ Close</button>
        </div>

        {/* stats grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 8, marginBottom: 16,
        }}>
          {[
            { label: "Sessions this week", value: weekSess, suffix: "/ 7" },
            { label: "XP earned",          value: weekXP,   suffix: "xp"  },
            { label: "Accuracy score",     value: accuracy, suffix: "%"   },
            { label: "Global rank",        value: `#${globalRank.toLocaleString()}`, suffix: "" },
          ].map(({ label, value, suffix }) => (
            <div key={label} style={{
              border: "1px solid #181818", background: "#0c0c0c",
              padding: "12px 14px",
            }}>
              <div style={{
                fontSize: 8, letterSpacing: ".2em",
                color: "#2a2a2a", textTransform: "uppercase", marginBottom: 5,
              }}>{label}</div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 28, letterSpacing: ".03em", lineHeight: 1, color: "#c8a84b",
              }}>
                {value}
                {suffix && <span style={{ fontSize: 13, color: "#3a3a3a", marginLeft: 4 }}>{suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* streak bar */}
        <div style={{
          border: "1px solid #181818", background: "#0c0c0c",
          padding: "12px 14px", marginBottom: 16,
        }}>
          <div style={{
            fontSize: 8, letterSpacing: ".2em",
            color: "#2a2a2a", textTransform: "uppercase", marginBottom: 8,
          }}>
            Weekly consistency
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: 28,
                background: i < weekSess ? "#c8a84b" : "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: i < weekSess ? "#80600a" : "#1a1a1a",
              }}>
                {i < weekSess ? "✓" : "—"}
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 5, fontSize: 7, color: "#222",
            letterSpacing: ".1em", textTransform: "uppercase",
          }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <span key={d} style={{ flex: 1, textAlign: "center" }}>{d}</span>
            ))}
          </div>
        </div>

        {/* insight */}
        <div style={{
          border: "1px solid #1e2a1e", background: "#0a0e0a",
          padding: "12px 14px", marginBottom: 16,
          borderLeft: "2px solid #4ade8055",
        }}>
          <div style={{
            fontSize: 8, letterSpacing: ".2em",
            color: "#1e4d1e", textTransform: "uppercase", marginBottom: 5,
          }}>AI insight</div>
          <div style={{ fontSize: 11, color: "#2a4a2a", lineHeight: 1.7, letterSpacing: ".06em" }}>
            {weekSess >= 6
              ? `Elite consistency. ${accuracy}% accuracy puts you in the top tier globally.`
              : weekSess >= 4
              ? `Good week. Push to 7/7 next week to unlock the One Week Warrior badge.`
              : `${7 - weekSess} missed sessions this week. Each one costs you ~${(7 - weekSess) * 40} rank positions.`
            }
          </div>
        </div>

        {/* share */}
        <button
          className="db-cta-btn"
          onClick={() => {
            const text = `📊 My ManifiX Weekly Report\n\n🔥 Streak: ${streak} days\n⚡ XP: ${weekXP} this week\n🎯 Accuracy: ${accuracy}%\n🌍 Global Rank: #${globalRank.toLocaleString()}\n\n#ManifiXAI #Magic16 #Discipline`;
            if (navigator.share) {
              navigator.share({ title: "My ManifiX Weekly Report", text });
            } else {
              navigator.clipboard?.writeText(text);
              alert("Copied to clipboard!");
            }
          }}
        >
          ↗ Share Report
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   AUTH LOADING SCREEN
───────────────────────────────────────────── */
function AuthLoader() {
  return (
    <div className="db-auth-loader">
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 24, letterSpacing: ".1em",
      }} className="db-shimmer">MAGIC16</div>
      <div className="db-auth-loader-ring db-auth-spin" />
      <div style={{
        fontSize: 8, letterSpacing: ".22em",
        color: "#2a2a2a", textTransform: "uppercase",
      }}>Verifying identity...</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();

  /* ── Auth state ── */
  const [authChecked, setAuthChecked] = useState(false);

  /* ── App state ── */
  const [st,          setSt]         = useState(() => loadState());
  const [timer,       setTimer]      = useState({ h: 0, m: 0, s: 0, expired: false });
  const [danger,      setDanger]     = useState(false);
  const [mounted,     setMounted]    = useState(false);
  const [levelUp,     setLevelUp]    = useState(false);
  const [newLevel,    setNewLevel]   = useState(1);
  const [streakPop,   setStreakPop]  = useState(false);
  const [psychIdx,    setPsychIdx]   = useState(0);
  const [showReport,  setShowReport] = useState(false);
  const [activeMode,  setActiveMode] = useState(st.mode);
  const [activeLang,  setActiveLang] = useState(st.lang);

  /* ─────────────────────────────────────────────────────────────────
     AUTH + ONBOARDING GUARD

     Root cause of "dashboard not opening":
     After Google OAuth redirect, Supabase restores the session
     asynchronously from the URL hash / stored token.
     Calling getCurrentUser() immediately returns null — causing a
     false redirect to /login before the session is ready.

     Fix: use supabase.auth.getSession() (reads stored token, no
     network, available instantly), then fall back to
     onAuthStateChange with a 4-second safety timeout.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const runCheck = async (userId) => {
      try {
        const onboarded = await authService.isOnboarded(userId);
        if (cancelled) return;
        if (!onboarded) {
          navigate("/onboarding", { replace: true });
        } else {
          setAuthChecked(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[Dashboard] isOnboarded check failed:", err);
        // isOnboarded errored — show dashboard anyway; safer than
        // an infinite login loop
        setAuthChecked(true);
      }
    };

    const init = async () => {
      try {
        // getSession() reads from localStorage / cookie — no network
        // call, resolves immediately even right after OAuth redirect
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          console.error("[Dashboard] getSession error:", error.message);
          navigate("/login", { replace: true });
          return;
        }

        if (session?.user) {
          await runCheck(session.user.id);
          return;
        }

        // No session yet — wait up to 4 s for the token to land.
        // This covers the brief post-OAuth window where the session
        // cookie / hash is still being processed by Supabase.
        const timeout = setTimeout(() => {
          if (cancelled) return;
          console.warn("[Dashboard] No session after 4s — sending to login");
          navigate("/login", { replace: true });
        }, 4000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (cancelled) return;
            if (newSession?.user) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              await runCheck(newSession.user.id);
            } else if (event === "SIGNED_OUT") {
              clearTimeout(timeout);
              subscription.unsubscribe();
              if (!cancelled) navigate("/login", { replace: true });
            }
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.error("[Dashboard] Auth init failed:", err);
        navigate("/login", { replace: true });
      }
    };

    init();
    return () => { cancelled = true; };
  }, [navigate]);

  /* ── Dashboard bootstrap (runs only after auth clears) ── */
  useEffect(() => {
    if (!authChecked) return;

    injectStyles();
    setMounted(true);

    const fresh = loadState();
    setSt(fresh);
    setActiveMode(fresh.mode);
    setActiveLang(fresh.lang);

    const prev = Number(localStorage.getItem(KEYS.prevLevel) || fresh.level);
    if (fresh.level > prev) {
      setNewLevel(fresh.level);
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 4500);
    }
    localStorage.setItem(KEYS.prevLevel, fresh.level);

    if (fresh.streak > 0) {
      setTimeout(() => setStreakPop(true), 600);
    }

    const id = setInterval(() => {
      setPsychIdx((i) => (i + 1) % PSYCH.length);
    }, 8000);
    return () => clearInterval(id);
  }, [authChecked]);

  /* ── Countdown timer ── */
  useEffect(() => {
    if (!authChecked) return;

    const tick = () => {
      const now  = new Date();
      const end  = new Date(); end.setHours(23, 59, 59, 999);
      const diff = end - now;
      if (diff <= 0) { setTimer({ h:0,m:0,s:0,expired:true }); setDanger(true); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimer({ h, m, s, expired: false });
      setDanger(h < 2);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [authChecked]);

  /* ── Expose session-complete hook ── */
  useEffect(() => {
    window.__magic16_recordComplete = () => {
      recordSessionComplete();
      setSt(loadState());
    };
    return () => { delete window.__magic16_recordComplete; };
  }, []);

  /* ── Save mode on change ── */
  const handleModeChange = (modeId) => {
    const mode = MODES.find(m => m.id === modeId);
    if (mode?.comingSoon) return;
    setActiveMode(modeId);
    localStorage.setItem(KEYS.mode, modeId);
    setSt(prev => ({ ...prev, mode: modeId }));
  };

  /* ── Save lang on change ── */
  const handleLangChange = (e) => {
    const lang = e.target.value;
    setActiveLang(lang);
    localStorage.setItem(KEYS.lang, lang);
    setSt(prev => ({ ...prev, lang }));
  };

  /* ── Block render until auth resolved ── */
  if (!authChecked) return <AuthLoader />;

  const { streak, xp, level, missionDone, globalRank,
          goal, identity, intensity, totalSess } = st;

  const dayProgress  = Math.min(streak, 16);
  const progressPct  = Math.round((dayProgress / 16) * 100);
  const xpPct        = Math.round((xp / XP_PER_LEVEL) * 100);
  const timerStr     = timer.expired
    ? "EXPIRED"
    : `${String(timer.h).padStart(2,"0")}:${String(timer.m).padStart(2,"0")}:${String(timer.s).padStart(2,"0")}`;
  const psychLine    = getPsych(streak, danger, missionDone);
  const milestone    = getMilestone(streak);
  const currentLang  = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  const stagger = (i, extra = {}) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut", ...extra },
  });

  return (
    <div style={{
      minHeight: "100dvh",
      background: danger ? "#090500" : "#080808",
      fontFamily: "'DM Mono','Courier New',monospace",
      color: "#e8e4d9",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 50px",
      position: "relative",
      overflowX: "hidden",
      transition: "background 1.2s ease",
    }}>

      {/* bg grid */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,200,60,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "db-grid 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div className="db-breathe" style={{
        position: "fixed",
        top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 300,
        background: danger
          ? "radial-gradient(ellipse,rgba(255,60,60,.12) 0%,transparent 70%)"
          : "radial-gradient(ellipse,rgba(200,168,75,.1) 0%,transparent 70%)",
        pointerEvents: "none",
        transition: "background 1s",
      }} />

      {[
        { top:16,left:16,   borderTopWidth:2, borderLeftWidth:2   },
        { top:16,right:16,  borderTopWidth:2, borderRightWidth:2  },
        { bottom:16,left:16,  borderBottomWidth:2,borderLeftWidth:2   },
        { bottom:16,right:16, borderBottomWidth:2,borderRightWidth:2  },
      ].map((pos,i)=>(
        <div key={i} style={{
          position:"fixed", width:18, height:18,
          borderColor: danger ? "#ff3c3c" : "#1e1e1e",
          borderStyle:"solid", borderWidth:0, ...pos,
          transition:"border-color 1s",
        }}/>
      ))}

      {/* ══ LEVEL UP OVERLAY ══ */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            style={{
              position:"fixed", inset:0,
              background:"#000000f0",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              zIndex:100, gap:14,
            }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          >
            <div className="db-float" style={{
              width:140, height:140, borderRadius:"50%",
              background:"radial-gradient(circle,rgba(200,168,75,.4) 0%,transparent 70%)",
            }} />
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:52, letterSpacing:".1em",
              textAlign:"center", lineHeight:1,
            }} className="db-shimmer">
              LEVEL {newLevel}<br/>UNLOCKED
            </div>
            <div style={{ fontSize:11, letterSpacing:".22em", color:"#444", textTransform:"uppercase" }}>Neural capacity expanded</div>
            <div style={{ fontSize:10, color:"#2a2a2a", letterSpacing:".15em", textTransform:"uppercase", marginTop:8 }}>
              +{XP_PER_SESSION} XP this session
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ WEEKLY REPORT OVERLAY ══ */}
      <AnimatePresence>
        {showReport && (
          <WeeklyReport
            streak={streak}
            xp={xp}
            level={level}
            totalSess={totalSess}
            globalRank={globalRank}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>

      {/* ── CONTENT ── */}
      <div style={{
        position:"relative", zIndex:1,
        width:"min(440px,96vw)",
        display:"flex", flexDirection:"column", gap:0,
      }}>

        {/* ══ HEADER ══ */}
        <motion.div {...stagger(0)} style={{
          borderBottom:"1px solid #1c1c1c",
          padding:"18px 0 14px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:20,
        }}>
          <div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:36, letterSpacing:".06em", lineHeight:1,
            }}>MAGIC16</div>
            <div style={{
              fontSize:9, letterSpacing:".25em",
              color:"#2a2a2a", textTransform:"uppercase", marginTop:2,
            }}>Discipline operating system</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{
              fontSize:8, letterSpacing:".2em",
              color:"#2a2a2a", textTransform:"uppercase", marginBottom:3,
            }}>Global rank</div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:30, letterSpacing:".04em", lineHeight:1,
            }} className="db-shimmer">
              #{globalRank.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* ══ MODE SELECTOR ══ */}
        <motion.div {...stagger(1)}>
          <div style={{
            fontSize:8, letterSpacing:".22em",
            color:"#2a2a2a", textTransform:"uppercase", marginBottom:8,
          }}>Active mode</div>
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr",
            gap:6, marginBottom:14,
          }}>
            {MODES.map((mode) => {
              const isActive = activeMode === mode.id;
              return (
                <div
                  key={mode.id}
                  className={`db-mode-card${isActive ? " active" : ""}`}
                  style={{
                    "--mode-bg":     mode.bg,
                    "--mode-border": mode.border,
                    opacity: mode.comingSoon ? 0.4 : 1,
                    cursor: mode.comingSoon ? "not-allowed" : "pointer",
                  }}
                  onClick={() => handleModeChange(mode.id)}
                  title={mode.comingSoon ? "Coming soon" : mode.label}
                >
                  <div style={{ fontSize:18, lineHeight:1 }}>{mode.icon}</div>
                  <div style={{
                    fontSize:9, fontWeight:700, letterSpacing:".12em",
                    textTransform:"uppercase",
                    color: isActive ? mode.color : "#2a2a2a",
                    transition:"color .2s",
                  }}>{mode.label}</div>
                  <div style={{
                    fontSize:8, letterSpacing:".05em",
                    color: isActive ? mode.color + "88" : "#1c1c1c",
                    lineHeight:1.3,
                  }}>{mode.comingSoon ? "Soon" : mode.sub}</div>
                  {mode.premium && !mode.comingSoon && (
                    <div style={{
                      position:"absolute", top:5, right:5,
                      fontSize:7, letterSpacing:".1em",
                      background:"#1a1408", color:"#c8a84b",
                      border:"1px solid #2a2010", padding:"1px 4px",
                    }}>PRO</div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ══ LANGUAGE PICKER ══ */}
        <motion.div {...stagger(2)} style={{ marginBottom:14 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            border:"1px solid #141414", background:"#0a0a0a", padding:"8px 12px",
          }}>
            <div style={{ fontSize:16, flexShrink:0 }}>{currentLang.flag}</div>
            <div style={{ flex:1, position:"relative" }}>
              <select
                className="db-lang-select"
                value={activeLang}
                onChange={handleLangChange}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{
              fontSize:8, letterSpacing:".15em",
              color:"#1e1e1e", textTransform:"uppercase",
              flexShrink:0,
            }}>Voice lang</div>
          </div>
        </motion.div>

        {/* ══ IDENTITY STRIP ══ */}
        <motion.div {...stagger(3)} style={{
          border:"1px solid #141414",
          background:"#0a0a0a",
          padding:"10px 14px",
          marginBottom:14,
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ fontSize:9, letterSpacing:".15em", color:"#2a2a2a", textTransform:"uppercase" }}>
            {goal} · {intensity}
          </div>
          <div style={{
            fontSize:10, letterSpacing:".1em",
            color:"#3a3a3a", fontStyle:"italic",
          }}>"{identity}"</div>
        </motion.div>

        {/* ══ STAT STRIP ══ */}
        <motion.div {...stagger(4)} style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:8, marginBottom:14,
        }}>
          {[
            { label:"Streak",   value: streak,    accent: streak > 0 },
            { label:"Level",    value: level,     accent: false      },
            { label:"Sessions", value: totalSess, accent: false      },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              border:`1px solid ${accent && streak > 0 ? "#2a2010" : "#181818"}`,
              background: accent && streak > 0 ? "#0f0d08" : "#0c0c0c",
              padding:"10px 12px",
            }}>
              <span style={{
                fontSize:8, letterSpacing:".22em",
                color:"#2e2e2e", textTransform:"uppercase",
                marginBottom:5, display:"block",
              }}>{label}</span>
              <span style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:32, letterSpacing:".03em", lineHeight:1,
                color: accent && streak > 0 ? "#ffc83c" : "#e8e4d9",
              }}
                className={label === "Streak" && streakPop ? "db-streak-pop" : ""}
              >{value}</span>
            </div>
          ))}
        </motion.div>

        {/* ══ MILESTONE BADGE ══ */}
        <AnimatePresence>
          {milestone && (
            <motion.div
              initial={{ opacity:0, y:-10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{
                border:`1px solid ${milestone.color}44`,
                background:"#0c0c0a",
                padding:"8px 14px",
                marginBottom:14,
                display:"flex", alignItems:"center", gap:10,
              }}
            >
              <span style={{ fontSize:14 }}>🏆</span>
              <span style={{
                fontSize:9, letterSpacing:".2em",
                color: milestone.color, textTransform:"uppercase",
              }}>{milestone.label}</span>
              <span style={{
                marginLeft:"auto", fontSize:8,
                letterSpacing:".15em", color:"#2a2a2a",
                textTransform:"uppercase",
              }}>Day {streak} / 16</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ MAIN PROTOCOL CARD ══ */}
        <motion.div {...stagger(5)} style={{
          border: danger ? "1px solid #2a1010" : "1px solid #1c1c1c",
          background: danger ? "#0a0808" : "#0b0b0b",
          padding:"20px 18px",
          marginBottom:14,
          position:"relative", overflow:"hidden",
          transition:"border-color 1s, background 1s",
        }}>
          <div style={{
            position:"absolute", left:0, right:0, height:"28%",
            background:"linear-gradient(180deg,transparent,rgba(200,168,75,.04),transparent)",
            animation:"db-scan 3.5s ease-in-out infinite",
            pointerEvents:"none",
          }} />

          <div style={{
            display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:14,
          }}>
            <div>
              <div style={{
                fontSize:9, letterSpacing:".22em",
                color: danger ? "#4a2020" : "#2e2e2e",
                textTransform:"uppercase", marginBottom:4,
              }}>Protocol Progress</div>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:40, letterSpacing:".04em", lineHeight:1,
                color: danger ? "#ff5c5c" : "#e8e4d9",
              }}>Day {dayProgress} <span style={{ fontSize:20, color:"#2a2a2a" }}>/ 16</span></div>
            </div>
            <div style={{
              fontSize:9, letterSpacing:".18em",
              padding:"4px 10px",
              border:`1px solid ${missionDone ? "#1e4d1e" : danger ? "#3a1010" : "#1e1e1e"}`,
              color: missionDone ? "#4ade80" : danger ? "#ff5c5c" : "#333",
              textTransform:"uppercase",
            }}>
              {missionDone ? "✓ Complete" : danger ? "⚠ Urgent" : "Pending"}
            </div>
          </div>

          <div style={{ height:3, background:"#141414", marginBottom:6, overflow:"hidden" }}>
            <motion.div
              style={{ height:"100%", background:"linear-gradient(90deg,#c8a84b,#ffc83c)" }}
              initial={{ width:0 }}
              animate={{ width: mounted ? `${progressPct}%` : 0 }}
              transition={{ duration:1.4, ease:"easeOut" }}
            />
          </div>
          <div style={{
            display:"flex", justifyContent:"space-between",
            fontSize:8, color:"#2a2a2a",
            letterSpacing:".15em", textTransform:"uppercase", marginBottom:16,
          }}>
            <span>Protocol sync</span>
            <span>{progressPct}%</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={missionDone ? "done" : danger ? "danger" : psychIdx}
              style={{
                fontSize:11, lineHeight:1.78,
                color: danger ? "#ff5c5c" : "#3a3a3a",
                letterSpacing:".07em",
                borderLeft:`2px solid ${danger ? "#ff3c3c" : "#1e1e1e"}`,
                paddingLeft:10,
                transition:"border-color .6s, color .6s",
              }}
              initial={{ opacity:0, y:6 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.35 }}
            >
              {psychLine}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ══ 16-DAY DOT GRID ══ */}
        <motion.div {...stagger(6)} style={{
          border:"1px solid #141414", background:"#0c0c0c",
          padding:"12px 14px", marginBottom:14,
        }}>
          <div style={{
            fontSize:8, letterSpacing:".22em",
            color:"#2a2a2a", textTransform:"uppercase", marginBottom:10,
          }}>16-day protocol map</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:6 }}>
            {Array.from({ length:16 },(_,i) => (
              <motion.div
                key={i}
                title={`Day ${i+1}`}
                style={{
                  aspectRatio:"1",
                  background: i < dayProgress ? "#c8a84b" : "#111",
                  border: i === dayProgress && !missionDone
                    ? "1px solid #ffc83c"
                    : "1px solid #1a1a1a",
                  borderRadius:3, position:"relative", cursor:"default",
                }}
                initial={{ scale:0.5, opacity:0 }}
                animate={{ scale:1, opacity:1 }}
                transition={{ delay: 0.03*i + 0.2, duration:0.25 }}
              >
                {i < dayProgress && (
                  <div style={{
                    position:"absolute", inset:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:7, color:"#80600a",
                  }}>✓</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══ XP BAR ══ */}
        <motion.div {...stagger(7)} style={{
          border:"1px solid #181818", background:"#0c0c0c",
          padding:"12px 14px", marginBottom:14,
        }}>
          <div style={{
            display:"flex", justifyContent:"space-between",
            fontSize:9, letterSpacing:".2em",
            color:"#2a2a2a", textTransform:"uppercase", marginBottom:8,
          }}>
            <span>XP → Level {level+1}</span>
            <span>{xp} / {XP_PER_LEVEL}</span>
          </div>
          <div style={{ height:4, background:"#141414", overflow:"hidden", borderRadius:2 }}>
            <motion.div
              style={{
                height:"100%", borderRadius:2,
                background:"linear-gradient(90deg,#6b46c1,#c084fc,#9d4edd)",
                backgroundSize:"200% auto",
                animation:"db-xp-flow 2.5s linear infinite",
              }}
              initial={{ width:0 }}
              animate={{ width: mounted ? `${xpPct}%` : 0 }}
              transition={{ duration:1.6, ease:"easeOut" }}
            />
          </div>
          {xpPct >= 80 && (
            <div style={{
              fontSize:8, letterSpacing:".18em",
              color:"#6b46c1", textTransform:"uppercase", marginTop:6,
            }}>
              <span className="db-blink">●</span> Level up close — {XP_PER_LEVEL - xp} XP remaining
            </div>
          )}
        </motion.div>

        {/* ══ TIMER + MISSION ══ */}
        {!missionDone && (
          <motion.div {...stagger(8)} style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14,
          }}>
            <div
              className={danger ? "db-danger-btn" : ""}
              style={{
                border:`1px solid ${danger ? "#3a1010" : "#181818"}`,
                background:"#0c0c0c", padding:"14px",
              }}
            >
              <span style={{
                fontSize:8, letterSpacing:".22em",
                color: danger ? "#4a2020" : "#2a2a2a",
                textTransform:"uppercase", marginBottom:4, display:"block",
              }}>Window closes</span>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:26, letterSpacing:".04em", lineHeight:1,
                color: danger ? "#ff5c5c" : "#e8e4d9",
                fontVariantNumeric:"tabular-nums",
              }} className="db-ticker">{timerStr}</div>
            </div>

            <div style={{
              border:"1px solid #181818", background:"#0c0c0c",
              padding:"14px", display:"flex", flexDirection:"column", gap:6,
            }}>
              <span style={{
                fontSize:8, letterSpacing:".22em",
                color:"#2a2a2a", textTransform:"uppercase", display:"block",
              }}>Active mission</span>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",
                fontSize:18, letterSpacing:".03em", lineHeight:1.2,
                color: danger ? "#ff5c5c" : "#c8a84b",
              }}>
                {danger ? "EXECUTE NOW" : `EXECUTE ${MODES.find(m=>m.id===activeMode)?.label?.toUpperCase() || "MAGIC16"}`}
              </div>
              <div style={{ fontSize:8, color:"#222", letterSpacing:".12em", textTransform:"uppercase" }}>
                16 min · {currentLang.flag} {currentLang.name} · AI verified
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ CTA BUTTON ══ */}
        <motion.div {...stagger(9)} style={{ marginBottom:10 }}>
          {missionDone ? (
            <div className="db-cta-done">✓ Session Complete — Rest and Integrate</div>
          ) : (
            <Link
              to="/app/magic16"
              className={`db-cta-btn ${danger ? "db-danger-btn" : ""}`}
            >
              {danger
                ? `⚠ LAST CHANCE — Start Day ${dayProgress + 1} →`
                : `Start Session — Day ${dayProgress + 1} →`}
            </Link>
          )}
        </motion.div>

        {/* streak reset warning */}
        {!missionDone && (
          <motion.div {...stagger(10)} style={{
            fontSize:9, letterSpacing:".15em",
            color: danger ? "#ff3c3c" : "#2a2a2a",
            textAlign:"center", textTransform:"uppercase", marginBottom:16,
            transition:"color .6s",
          }}>
            <span className="db-blink">⚠</span>{" "}
            {danger
              ? `Streak of ${streak} resets at midnight`
              : "Miss today and streak resets to zero"}
          </motion.div>
        )}

        {/* ══ STREAK COMPLETE BANNER ══ */}
        {missionDone && streak > 0 && (
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            style={{
              border:"1px solid #1e4d1e", background:"#0a140a",
              padding:"14px 16px", marginBottom:14,
              display:"flex", alignItems:"center", gap:12,
            }}
          >
            <span style={{ fontSize:22 }}>🔥</span>
            <div>
              <div style={{
                fontSize:11, letterSpacing:".15em",
                color:"#4ade80", textTransform:"uppercase", marginBottom:2,
              }}>Day {streak} complete</div>
              <div style={{
                fontSize:9, color:"#1e4d1e",
                letterSpacing:".12em", textTransform:"uppercase",
              }}>+{XP_PER_SESSION} XP earned · Come back tomorrow</div>
            </div>
          </motion.div>
        )}

        {/* ══ WEEKLY REPORT BUTTON (streak >= 7) ══ */}
        <AnimatePresence>
          {streak >= 7 && (
            <motion.div
              {...stagger(11)}
              style={{ marginBottom:10 }}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
            >
              <button
                className="db-report-btn db-report-pulse"
                onClick={() => setShowReport(true)}
              >
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:16 }}>📊</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:10, letterSpacing:".18em", color:"#c8a84b" }}>
                      Weekly Report Ready
                    </div>
                    <div style={{
                      fontSize:8, letterSpacing:".12em",
                      color:"#3a3010", marginTop:2,
                    }}>
                      {streak} day streak · Share to Instagram
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize:10, letterSpacing:".15em",
                  color:"#c8a84b44",
                }}>→</div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ SECONDARY ACTIONS ══ */}
        <motion.div {...stagger(12)} style={{
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20,
        }}>
          <button
            className="db-opt-btn"
            onClick={() => {
              const text = `Day ${streak} on ManifiX AI Magic16. ${streak} day streak. Top ${Math.min(globalRank,9999).toLocaleString()} globally. #ManifiXAI`;
              if (navigator.share) {
                navigator.share({ title:"ManifiX AI", text });
              } else {
                navigator.clipboard?.writeText(text);
              }
            }}
          >
            ↗ Share streak
          </button>
          <button
            className="db-opt-btn"
            onClick={() => {
              const confirm = window.confirm("Reset all progress?");
              if (confirm) {
                Object.values(KEYS).forEach(k => localStorage.removeItem(k));
                window.location.href = "/";
              }
            }}
          >
            ↺ Reset data
          </button>
        </motion.div>

        <div style={{
          fontSize:8, letterSpacing:".22em",
          color:"#1a1a1a", textAlign:"center", textTransform:"uppercase",
        }}>
          ManifiX AI · Magic16 · {new Date().getFullYear()} · No excuses.
        </div>

      </div>
    </div>
  );
}
