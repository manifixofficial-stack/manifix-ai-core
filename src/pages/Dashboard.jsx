import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
};

const XP_PER_LEVEL   = 500;
const XP_PER_SESSION = 120;

/* ─────────────────────────────────────────────
   ✅ FIXED: loadState checks for missed days
   and resets streak to 0 if user skipped
───────────────────────────────────────────── */
function loadState() {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const lastDate  = localStorage.getItem(KEYS.lastDate) || "";

  // ✅ CRITICAL BUG FIX — streak resets if last session wasn't today OR yesterday
  let streak = Number(localStorage.getItem(KEYS.streak) || 0);
  if (lastDate && lastDate !== today && lastDate !== yesterday) {
    streak = 0;
    localStorage.setItem(KEYS.streak,   "0");
    localStorage.setItem(KEYS.xp,       "0");
    localStorage.setItem(KEYS.level,    "1");
    localStorage.removeItem(KEYS.lastDate);
  }

  const xp           = Number(localStorage.getItem(KEYS.xp)       || 0);
  const level        = Number(localStorage.getItem(KEYS.level)     || 1);
  const missionDone  = lastDate === today;
  const goal         = localStorage.getItem(KEYS.goal)     || "Discipline";
  const identity     = localStorage.getItem(KEYS.identity) || "I don't quit.";
  const intensity    = localStorage.getItem(KEYS.intensity)|| "Standard";
  const totalSess    = Number(localStorage.getItem(KEYS.totalSess) || streak);

  // rank improves with streak + level
  let rankSeed = Number(localStorage.getItem(KEYS.rankSeed) || 0);
  if (!rankSeed) {
    rankSeed = Math.floor(Math.random() * 9000) + 2000;
    localStorage.setItem(KEYS.rankSeed, rankSeed);
  }
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);

  return { streak, xp, level, missionDone, globalRank, goal, identity, intensity, totalSess };
}

/* ─────────────────────────────────────────────
   recordSessionComplete — exported for Magic16
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
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   PSYCH COPY — rotates by streak
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

/* ─────────────────────────────────────────────
   MILESTONE BADGES
───────────────────────────────────────────── */
const getMilestone = (streak) => {
  if (streak >= 16) return { label: "PROTOCOL COMPLETE", color: "#ffc83c" };
  if (streak >= 7)  return { label: "ONE WEEK WARRIOR",  color: "#c8a84b" };
  if (streak >= 3)  return { label: "LOCKED IN",         color: "#888" };
  return null;
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Dashboard() {
  const [st,       setSt]      = useState(() => loadState());
  const [timer,    setTimer]   = useState({ h: 0, m: 0, s: 0, expired: false });
  const [danger,   setDanger]  = useState(false);
  const [mounted,  setMounted] = useState(false);
  const [levelUp,  setLevelUp] = useState(false);
  const [newLevel, setNewLevel]= useState(1);
  const [streakPop,setStreakPop]= useState(false);
  const [psychIdx, setPsychIdx]= useState(0);

  useEffect(() => {
    injectStyles();
    setMounted(true);

    const fresh = loadState();
    setSt(fresh);

    // level-up detection
    const prev = Number(localStorage.getItem(KEYS.prevLevel) || fresh.level);
    if (fresh.level > prev) {
      setNewLevel(fresh.level);
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 4500);
    }
    localStorage.setItem(KEYS.prevLevel, fresh.level);

    // streak pop animation on load if streak > 0
    if (fresh.streak > 0) {
      setTimeout(() => setStreakPop(true), 600);
    }

    // rotate psych line every 8s
    const id = setInterval(() => {
      setPsychIdx((i) => (i + 1) % PSYCH.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // countdown to midnight (updates every second for drama)
  useEffect(() => {
    const tick = () => {
      const now  = new Date();
      const end  = new Date(); end.setHours(23, 59, 59, 999);
      const diff = end - now;
      if (diff <= 0) {
        setTimer({ h: 0, m: 0, s: 0, expired: true });
        setDanger(true);
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimer({ h, m, s, expired: false });
      setDanger(h < 2);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // bridge for Magic16 to call after session
  useEffect(() => {
    window.__magic16_recordComplete = () => {
      recordSessionComplete();
      setSt(loadState());
    };
    return () => { delete window.__magic16_recordComplete; };
  }, []);

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

  const stagger = (i, extra = {}) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut", ...extra },
  });

  /* ── RENDER ── */
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

      {/* ambient glow */}
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

      {/* corner marks */}
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
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
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
            <div style={{
              fontSize:11, letterSpacing:".22em",
              color:"#444", textTransform:"uppercase",
            }}>Neural capacity expanded</div>
            <div style={{
              fontSize:10, color:"#2a2a2a",
              letterSpacing:".15em", textTransform:"uppercase",
              marginTop:8,
            }}>+{XP_PER_SESSION} XP this session</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ── */}
      <div style={{
        position:"relative", zIndex:1,
        width:"min(440px,96vw)",
        display:"flex", flexDirection:"column",
        gap:0,
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

        {/* ══ IDENTITY STRIP ══ */}
        <motion.div {...stagger(1)} style={{
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
        <motion.div {...stagger(2)} style={{
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
                fontSize:32, letterSpacing:".03em",
                lineHeight:1,
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
        <motion.div {...stagger(3)} style={{
          border: danger ? "1px solid #2a1010" : "1px solid #1c1c1c",
          background: danger ? "#0a0808" : "#0b0b0b",
          padding:"20px 18px",
          marginBottom:14,
          position:"relative", overflow:"hidden",
          transition:"border-color 1s, background 1s",
        }}>
          {/* card scan */}
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

          {/* protocol bar */}
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

          {/* psych line — animated */}
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
        <motion.div {...stagger(4)} style={{
          border:"1px solid #141414",
          background:"#0c0c0c",
          padding:"12px 14px",
          marginBottom:14,
        }}>
          <div style={{
            fontSize:8, letterSpacing:".22em",
            color:"#2a2a2a", textTransform:"uppercase", marginBottom:10,
          }}>16-day protocol map</div>
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:6,
          }}>
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
                  borderRadius:3,
                  position:"relative",
                  cursor:"default",
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
        <motion.div {...stagger(5)} style={{
          border:"1px solid #181818",
          background:"#0c0c0c",
          padding:"12px 14px",
          marginBottom:14,
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

        {/* ══ TIMER + MISSION (only if not done) ══ */}
        {!missionDone && (
          <motion.div {...stagger(6)} style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14,
          }}>
            <div
              className={danger ? "db-danger-btn" : ""}
              style={{
                border:`1px solid ${danger ? "#3a1010" : "#181818"}`,
                background:"#0c0c0c",
                padding:"14px",
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
              border:"1px solid #181818",
              background:"#0c0c0c",
              padding:"14px",
              display:"flex", flexDirection:"column", gap:6,
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
                {danger ? "EXECUTE NOW" : "EXECUTE MAGIC16"}
              </div>
              <div style={{
                fontSize:8, color:"#222",
                letterSpacing:".12em", textTransform:"uppercase",
              }}>16 min · AI verified</div>
            </div>
          </motion.div>
        )}

        {/* ══ CTA BUTTON ══ */}
        <motion.div {...stagger(7)} style={{ marginBottom:10 }}>
          {missionDone ? (
            <div className="db-cta-done">
              ✓ Session Complete — Rest and Integrate
            </div>
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
          <motion.div {...stagger(8)} style={{
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
              border:"1px solid #1e4d1e",
              background:"#0a140a",
              padding:"14px 16px",
              marginBottom:14,
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

        {/* ══ SECONDARY ACTIONS ══ */}
        <motion.div {...stagger(9)} style={{
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
              // reset for testing (dev only)
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

        {/* ══ FOOTER ══ */}
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
