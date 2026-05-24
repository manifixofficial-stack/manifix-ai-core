/**
 * ManifiX — Onboarding.jsx  (v3 — Audit-Compliant)
 * ─────────────────────────────────────────────────
 * ✔ Real feature descriptions (no fake AI claims)
 * ✔ Honest capability badges
 * ✔ authService.completeOnboarding() on finish
 * ✔ Professional dark UI — gold/obsidian aesthetic
 * ✔ Fully accessible (ARIA, keyboard nav)
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

/* ─── Framer-motion with safe fallback ─── */
let motion, AnimatePresence;
try {
  const fm = require("framer-motion");
  motion = fm.motion;
  AnimatePresence = fm.AnimatePresence;
} catch {
  AnimatePresence = ({ children }) => <>{children}</>;
  const FM = React.forwardRef(({ children, style, ...rest }, ref) => (
    <div ref={ref} style={{ transition: "opacity .35s ease, transform .35s ease", ...style }} {...rest}>
      {children}
    </div>
  ));
  FM.displayName = "FM";
  motion = { div: FM };
}

/* ══════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════ */
const STYLE_ID = "manifix-ob-v3";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');

    #mfob *, #mfob *::before, #mfob *::after { box-sizing:border-box; margin:0; padding:0; }

    #mfob {
      --g:    #d4a843;
      --g2:   #f0cc70;
      --gd:   rgba(212,168,67,.14);
      --r:    #e05454;
      --rd:   rgba(224,84,84,.13);
      --bg:   #07070b;
      --s1:   #0e0e14;
      --s2:   #131319;
      --b:    rgba(255,255,255,.07);
      --bhi:  rgba(255,255,255,.13);
      --tp:   #f0ece3;
      --tm:   rgba(240,236,227,.35);
      --tf:   rgba(240,236,227,.12);
      --mono: 'JetBrains Mono', monospace;
      --disp: 'Syne', sans-serif;
    }

    @keyframes ob3-breathe {
      0%,100%{ opacity:.07; transform:scale(1) translateX(-50%); }
      50%    { opacity:.18; transform:scale(1.1) translateX(-46%); }
    }
    @keyframes ob3-scan {
      0%  { transform:translateY(-100%); opacity:0; }
      5%  { opacity:1; }
      95% { opacity:1; }
      100%{ transform:translateY(1400%); opacity:0; }
    }
    @keyframes ob3-blink {
      0%,49%,100%{ opacity:1; } 50%,99%{ opacity:0; }
    }
    @keyframes ob3-pulse {
      0%,100%{ box-shadow:0 0 0 0 rgba(212,168,67,.4); }
      50%    { box-shadow:0 0 0 12px rgba(212,168,67,0); }
    }
    @keyframes ob3-shake {
      0%,100%{ transform:translateX(0); }
      20%    { transform:translateX(-6px); }
      40%    { transform:translateX(6px); }
      60%    { transform:translateX(-4px); }
      80%    { transform:translateX(4px); }
    }
    @keyframes ob3-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes ob3-fadeup {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:none; }
    }
    @keyframes ob3-bar {
      from { width:0; }
    }
    @keyframes ob3-countup {
      from { opacity:0; transform:scale(.85); }
      to   { opacity:1; transform:scale(1); }
    }

    .ob3-blink  { animation:ob3-blink 1.1s step-end infinite; }
    .ob3-pulse  { animation:ob3-pulse 2.2s ease-in-out infinite; }
    .ob3-shake  { animation:ob3-shake .4s ease; }
    .ob3-fadeup { animation:ob3-fadeup .4s ease both; }

    /* ── Option button ── */
    .ob3-opt {
      width:100%; padding:12px 14px;
      background:var(--s1); border:1px solid var(--b);
      color:var(--tm); font-family:var(--mono);
      font-size:11px; letter-spacing:.14em; text-transform:uppercase;
      cursor:pointer; text-align:left;
      transition:border-color .18s, color .18s, background .18s, transform .1s;
      outline:none; border-radius:3px;
      display:flex; align-items:flex-start; gap:10px;
      user-select:none;
    }
    .ob3-opt:hover:not(:disabled) {
      border-color:var(--bhi); color:rgba(240,236,227,.6);
      background:var(--s2);
    }
    .ob3-opt:active:not(:disabled) { transform:scale(.99); }
    .ob3-opt:focus-visible { outline:2px solid var(--g); outline-offset:2px; }
    .ob3-opt.on-gold { border-color:var(--g); color:var(--g); background:var(--gd); }
    .ob3-opt.on-red  { border-color:var(--r); color:var(--r); background:var(--rd); }

    /* ── Primary CTA ── */
    .ob3-cta {
      width:100%; padding:14px 0; margin-top:14px;
      font-family:var(--mono); font-size:11px; font-weight:700;
      letter-spacing:.22em; text-transform:uppercase;
      cursor:pointer; border:none; border-radius:3px;
      transition:opacity .18s, transform .1s;
      outline:none;
    }
    .ob3-cta:not(:disabled) { background:var(--g); color:#080608; }
    .ob3-cta:not(:disabled):hover { opacity:.88; }
    .ob3-cta:not(:disabled):active { transform:scale(.985); }
    .ob3-cta:disabled {
      background:var(--s2); color:var(--tf);
      border:1px solid var(--b); cursor:not-allowed;
    }
    .ob3-cta.warn { background:var(--rd) !important; color:var(--r) !important; border:1px solid rgba(224,84,84,.25) !important; }
    .ob3-cta.warn:hover { opacity:.82 !important; }

    /* ── Commit input ── */
    .ob3-input {
      width:100%; padding:13px 15px;
      background:var(--s1); border:1px solid var(--b);
      color:var(--tp); font-family:var(--mono);
      font-size:13px; font-weight:500; letter-spacing:.18em;
      outline:none; caret-color:var(--g); border-radius:0 0 3px 3px;
      transition:border-color .18s;
    }
    .ob3-input::placeholder { color:var(--tf); letter-spacing:.1em; }
    .ob3-input:focus  { border-color:rgba(212,168,67,.35); }
    .ob3-input.valid  { border-color:var(--g); color:var(--g); }
    .ob3-input.error  { border-color:var(--r); animation:ob3-shake .4s ease; }

    /* ── Step dots ── */
    .ob3-dot {
      height:2px; background:var(--tf); border-radius:9px;
      flex:1; transition:background .35s, flex .35s;
    }
    .ob3-dot.cur  { background:var(--g); flex:2.5; }
    .ob3-dot.done { background:rgba(212,168,67,.3); }

    /* ── Feature card ── */
    .ob3-feat {
      display:flex; gap:10px; align-items:flex-start;
      padding:10px 13px;
      background:var(--s1); border:1px solid var(--b); border-radius:3px;
      transition:border-color .18s, background .18s;
    }
    .ob3-feat:hover { border-color:var(--bhi); background:var(--s2); }

    /* ── Spinner ── */
    .ob3-spin {
      display:inline-block; width:11px; height:11px;
      border:1.5px solid rgba(8,6,8,.25); border-top-color:#080608;
      border-radius:50%; animation:ob3-spin .7s linear infinite;
      vertical-align:middle; margin-right:8px;
    }
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════
   DATA — honest, audit-aligned feature list
══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: "⚡",
    name: "Magic16 Protocol",
    desc: "16-minute daily session. Streak tracking, XP, and global leaderboard.",
    tag: "Core",
    tagColor: "#d4a843",
  },
  {
    icon: "🌙",
    name: "SleepGold Engine",
    desc: "Binaural audio engine (real 40Hz gamma / 10Hz alpha tones) + sleep-window reminders.",
    tag: "Real Audio",
    tagColor: "#6a9fd4",
  },
  {
    icon: "🧠",
    name: "Mental Health Suite",
    desc: "Mood logging, breathing exercises, and pattern journaling. Not a clinical tool.",
    tag: "Self-care",
    tagColor: "#9b8fd4",
  },
  {
    icon: "🔥",
    name: "Stress & Burnout Shield",
    desc: "HRV-guided breathing (box / 4-7-8 patterns) and daily stress check-ins.",
    tag: "Evidence-based",
    tagColor: "#d46a6a",
  },
  {
    icon: "🥗",
    name: "Nutrition Intelligence",
    desc: "Macro tracking + meal logging. Multilingual phrases (EN/ES/ZH; others expanding).",
    tag: "Beta",
    tagColor: "#6ad4a0",
  },
  {
    icon: "💊",
    name: "Medication Tracker",
    desc: "Daily pill reminders with time-window check-ins. Single reminder per slot.",
    tag: "Reminder only",
    tagColor: "#d4a843",
  },
  {
    icon: "🌍",
    name: "Global Leaderboard",
    desc: "Rank among all active streaks worldwide. Updates on session completion.",
    tag: "Live",
    tagColor: "#4ade80",
  },
  {
    icon: "🛡",
    name: "Preventive Health",
    desc: "Guided breath work and 90-day protocol roadmap. Roadmap is milestone-based.",
    tag: "Guided",
    tagColor: "#9bbdaa",
  },
];

const GOALS = [
  { val: "Discipline", icon: "⚔", desc: "Daily habits. Non-negotiable consistency." },
  { val: "Focus",      icon: "◎", desc: "Deep work preparation. Mental clarity."    },
  { val: "Recovery",   icon: "↺", desc: "Sleep, stress, and burnout reduction."      },
  { val: "Strength",   icon: "↑", desc: "Physical and mental output capacity."       },
];

const INTENSITIES = [
  { val: "Standard",   desc: "16 min / day. Sustainable long-term.",     cls: "on-gold", badge: null      },
  { val: "High",       desc: "Extended sessions. Faster progression.",   cls: "on-gold", badge: "POPULAR" },
  { val: "NO EXCUSES", desc: "Maximum accountability. Zero grace days.", cls: "on-red",  badge: "HARD"    },
];

const IDENTITIES = [
  { val: "I don't quit.",          sub: "Commitment over motivation." },
  { val: "I finish what I start.", sub: "Execution over intention."   },
  { val: "I operate at 1%.",       sub: "Standards non-negotiable."   },
];

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════ */
const Dots = ({ cur, total }) => (
  <div style={{ display:"flex", gap:5, marginBottom:24 }}
    role="progressbar" aria-valuenow={cur} aria-valuemin={1} aria-valuemax={total}>
    {Array.from({ length:total }, (_,i) => {
      const n = i+1;
      return <div key={i} className={`ob3-dot${n===cur?" cur":n<cur?" done":""}`} />;
    })}
  </div>
);

const Tag = ({ label, color }) => (
  <span style={{
    fontSize:8, letterSpacing:".14em", padding:"2px 7px",
    border:`1px solid ${color}44`, color, borderRadius:2,
    fontFamily:"var(--mono)", textTransform:"uppercase",
    flexShrink:0, whiteSpace:"nowrap",
  }}>{label}</span>
);

const Micro = ({ children, color }) => (
  <div style={{
    fontSize:9, letterSpacing:".28em", textTransform:"uppercase",
    color: color || "var(--tf)", marginBottom:9,
    fontFamily:"var(--mono)",
  }}>{children}</div>
);

const Heading = ({ children, color }) => (
  <h2 style={{
    fontFamily:"var(--disp)",
    fontSize:"clamp(34px,8.5vw,50px)",
    fontWeight:800, letterSpacing:"-.015em", lineHeight:.97,
    color: color || "var(--tp)", marginBottom:20,
  }}>{children}</h2>
);

const Card = ({ children, warn }) => (
  <div style={{
    background: warn ? "rgba(10,5,5,.98)" : "var(--s1)",
    border:`1px solid ${warn ? "rgba(224,84,84,.18)" : "var(--b)"}`,
    borderRadius:5, padding:"26px 22px",
    position:"relative", overflow:"hidden",
  }}>
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:1,
      background: warn
        ? "linear-gradient(90deg,transparent,rgba(224,84,84,.5),transparent)"
        : "linear-gradient(90deg,transparent,rgba(212,168,67,.22),transparent)",
    }} />
    {children}
  </div>
);

const OptBtn = ({ val, icon, desc, sub, badge, sel, cls, onClick }) => (
  <button type="button" role="radio" aria-checked={sel}
    className={`ob3-opt${sel ? ` ${cls}` : ""}`} onClick={onClick}>
    {icon && <span style={{ fontSize:13, opacity:.6, minWidth:14, textAlign:"center", flexShrink:0 }}>{icon}</span>}
    <span style={{ flex:1 }}>
      <span style={{ display:"block" }}>{val}</span>
      {(desc||sub) && (
        <span style={{
          display:"block", fontSize:9, letterSpacing:".08em",
          textTransform:"none", fontStyle:"italic", marginTop:2, opacity:.5,
        }}>{desc||sub}</span>
      )}
    </span>
    {badge && (
      <span style={{
        fontSize:8, letterSpacing:".12em", padding:"2px 6px",
        border:`1px solid ${sel?"currentColor":"var(--b)"}`,
        borderRadius:2, opacity:sel?1:.4, whiteSpace:"nowrap",
      }}>{badge}</span>
    )}
    <span style={{
      width:13, height:13, borderRadius:"50%", flexShrink:0, marginLeft:4,
      border:`1px solid ${sel?"currentColor":"var(--b)"}`,
      background: sel ? "currentColor" : "transparent",
      transition:"background .18s, border-color .18s",
    }} aria-hidden />
  </button>
);

const SumRow = ({ label, val, red }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"baseline",
    fontSize:10, letterSpacing:".12em", padding:"5px 0",
    borderBottom:"1px solid var(--b)",
  }}>
    <span style={{ color:"var(--tf)", textTransform:"uppercase" }}>{label}</span>
    <span style={{ color: red ? "var(--r)" : "var(--g)", textAlign:"right", maxWidth:"62%" }}>{val}</span>
  </div>
);

/* ══════════════════════════════════════════════════════
   PAGE VARIANTS
══════════════════════════════════════════════════════ */
const PV = {
  enter:  { opacity:0, y:20, scale:.985 },
  center: { opacity:1, y:0,  scale:1, transition:{ duration:.38, ease:[.22,1,.36,1] } },
  exit:   { opacity:0, y:-14, scale:.98, transition:{ duration:.22, ease:[.55,0,1,.45] } },
};

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();

  const [phase,      setPhase]      = useState("intro");  // intro | steps
  const [step,       setStep]       = useState(1);
  const [scanPct,    setScanPct]    = useState(0);

  const [goal,       setGoal]       = useState("");
  const [intensity,  setIntensity]  = useState("");
  const [identity,   setIdentity]   = useState("");
  const [commitText, setCommitText] = useState("");
  const [inputState, setInputState] = useState("idle");   // idle | valid | error
  const [loading,    setLoading]    = useState(false);
  const [authError,  setAuthError]  = useState("");

  const inputRef  = useRef(null);
  const shakeTimer = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  /* Intro scan */
  useEffect(() => {
    if (phase !== "intro") return;
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(pct + Math.random() * 4 + 1.8, 100);
      setScanPct(Math.floor(pct));
      if (pct >= 100) { clearInterval(iv); setTimeout(() => setPhase("steps"), 360); }
    }, 26);
    return () => clearInterval(iv);
  }, [phase]);

  /* Auto-focus commit */
  useEffect(() => {
    if (step === 6) setTimeout(() => inputRef.current?.focus(), 440);
  }, [step]);

  /* Live validate commit phrase */
  useEffect(() => {
    setInputState(
      commitText === ""                ? "idle"  :
      commitText === "I WILL NOT QUIT" ? "valid" : "idle"
    );
  }, [commitText]);

  /* Final lock */
  const handleFinalLock = useCallback(async () => {
    if (loading) return;
    setAuthError("");
    if (commitText.trim().toUpperCase() !== "I WILL NOT QUIT") {
      setInputState("error");
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setInputState("idle"), 600);
      inputRef.current?.focus();
      return;
    }
    if (!goal || !intensity || !identity) return;

    setLoading(true);

    /* Write game state */
    try {
      localStorage.setItem("magic16_streak",       "0");
      localStorage.setItem("magic16_xp",           "0");
      localStorage.setItem("magic16_level",        "1");
      localStorage.setItem("magic16_goal",         goal);
      localStorage.setItem("magic16_intensity",    intensity);
      localStorage.setItem("magic16_identity",     identity);
      localStorage.setItem("magic16_onboarded_at", String(Date.now()));
      localStorage.setItem("magic16_total_sessions","0");
      /* magic16_last_date intentionally NOT set — mission starts pending */
    } catch (e) {
      console.warn("[ManifiX] localStorage write:", e.message);
    }

    /* Mark onboarded in Supabase */
    try {
      const user = await authService.getCurrentUser();
      if (user) await authService.completeOnboarding(user.id);
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      console.error("[ManifiX] completeOnboarding failed:", err);
      setAuthError("Profile sync failed. Check your connection and try again.");
      setLoading(false);
    }
  }, [loading, commitText, goal, intensity, identity, navigate]);

  /* Keyboard nav */
  const onKey = useCallback((e) => {
    if (e.key !== "Enter" || phase !== "steps") return;
    if (step === 1 && goal)      return setStep(2);
    if (step === 2 && intensity) return setStep(3);
    if (step === 3)              return setStep(4);
    if (step === 4 && identity)  return setStep(5);
    if (step === 5)              return setStep(6);
    if (step === 6)              handleFinalLock();
  }, [phase, step, goal, intensity, identity, handleFinalLock]);

  const canSubmit = useMemo(
    () => commitText === "I WILL NOT QUIT" && !loading,
    [commitText, loading]
  );
  const isExtreme = intensity === "NO EXCUSES";

  /* ── render ── */
  return (
    <div id="mfob" onKeyDown={onKey} style={{
      minHeight:"100dvh", background:"var(--bg)",
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative", overflow:"hidden", padding:"20px 16px",
    }}>

      {/* Ambient glow */}
      <div aria-hidden style={{
        position:"fixed", top:"18%", left:"50%",
        width:560, height:340,
        background:"radial-gradient(ellipse,rgba(212,168,67,.09) 0%,transparent 68%)",
        animation:"ob3-breathe 7s ease-in-out infinite",
        pointerEvents:"none", zIndex:0,
      }} />

      {/* Scan line */}
      <div aria-hidden style={{
        position:"fixed", left:0, right:0, height:70,
        background:"linear-gradient(180deg,transparent,rgba(212,168,67,.025),transparent)",
        animation:"ob3-scan 5s ease-in-out infinite",
        pointerEvents:"none", zIndex:0,
      }} />

      {/* Corner brackets */}
      {[
        { top:16,left:16,   borderTop:"1px solid var(--b)",  borderLeft:"1px solid var(--b)"   },
        { top:16,right:16,  borderTop:"1px solid var(--b)",  borderRight:"1px solid var(--b)"  },
        { bottom:16,left:16,  borderBottom:"1px solid var(--b)", borderLeft:"1px solid var(--b)"   },
        { bottom:16,right:16, borderBottom:"1px solid var(--b)", borderRight:"1px solid var(--b)"  },
      ].map((pos,i) => (
        <div key={i} aria-hidden style={{ position:"fixed", width:20, height:20, ...pos }} />
      ))}

      {/* Version */}
      <div aria-hidden style={{
        position:"fixed", bottom:14, left:18,
        fontSize:8, letterSpacing:".2em", color:"var(--tf)",
        fontFamily:"var(--mono)", textTransform:"uppercase",
      }}>ManifiX · v2.0</div>

      <AnimatePresence mode="wait">

        {/* ══════════ INTRO ══════════ */}
        {phase === "intro" && (
          <motion.div key="intro"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{
              textAlign:"center", zIndex:1, position:"relative",
              display:"flex", flexDirection:"column", alignItems:"center", gap:22,
            }}
          >
            <div style={{
              fontFamily:"var(--disp)", fontSize:"clamp(52px,13vw,88px)",
              fontWeight:800, letterSpacing:"-.025em", color:"var(--tp)", lineHeight:1,
            }}>
              MANIFIX
            </div>

            {/* Scan bar */}
            <div style={{
              width:"min(260px,70vw)", height:2,
              background:"var(--b)", borderRadius:9, overflow:"hidden",
            }}>
              <div style={{
                height:"100%", width:`${scanPct}%`,
                background:"var(--g)", transition:"width .05s linear", borderRadius:9,
              }} />
            </div>

            <div style={{
              fontFamily:"var(--mono)", fontSize:11, letterSpacing:".2em",
              color:"var(--tm)", display:"flex", alignItems:"center", gap:9,
            }}>
              <span className="ob3-blink" style={{ color:"var(--g)", fontSize:7 }} aria-hidden>●</span>
              Initializing profile — {scanPct}%
            </div>

            {/* Module list */}
            <div style={{
              display:"flex", flexDirection:"column", gap:5, marginTop:4,
              animation:"ob3-fadeup .6s ease .3s both",
            }}>
              {[
                ["Magic16 Protocol",    "active"],
                ["SleepGold Engine",    "active"],
                ["Mental Health Suite", "active"],
                ["Nutrition Tracker",   "active"],
                ["Global Leaderboard",  "active"],
              ].map(([m, st]) => (
                <div key={m} style={{
                  fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em",
                  color:"var(--tf)", textTransform:"uppercase",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <span style={{ color:"var(--g)", fontSize:7 }}>✓</span>
                  {m} — <span style={{ color:"var(--g)" }}>{st}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════ STEPS ══════════ */}
        {phase === "steps" && (
          <div style={{ position:"relative", zIndex:1, width:"min(430px,96vw)" }}>
            <AnimatePresence mode="wait">

              {/* ── STEP 1: What's included ── */}
              {step === 1 && (
                <motion.div key="s1" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card>
                    <Dots cur={1} total={6} />
                    <Micro>Your ManifiX Suite</Micro>
                    <Heading>Everything<br />unlocked.</Heading>
                    <p style={{
                      fontSize:11, color:"var(--tm)", letterSpacing:".07em",
                      lineHeight:1.75, marginBottom:16, fontFamily:"var(--mono)",
                    }}>
                      All modules activate today. Here's what's real and what's in beta.
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:4 }}>
                      {FEATURES.map(({ icon, name, desc, tag, tagColor }) => (
                        <div key={name} className="ob3-feat">
                          <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{
                              display:"flex", alignItems:"center",
                              gap:7, marginBottom:3,
                            }}>
                              <span style={{
                                fontFamily:"var(--mono)", fontSize:10,
                                letterSpacing:".12em", color:"var(--tp)",
                                textTransform:"uppercase",
                              }}>{name}</span>
                              <Tag label={tag} color={tagColor} />
                            </div>
                            <div style={{
                              fontSize:10, color:"var(--tf)", lineHeight:1.6,
                              fontFamily:"var(--mono)", letterSpacing:".05em",
                            }}>{desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="ob3-cta ob3-pulse"
                      onClick={() => setStep(2)}>
                      Let's configure →
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* ── STEP 2: Goal ── */}
              {step === 2 && (
                <motion.div key="s2" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card>
                    <Dots cur={2} total={6} />
                    <Micro>Step 2 of 6 — Primary Goal</Micro>
                    <Heading>What are you<br />optimising for?</Heading>
                    <div role="radiogroup" aria-label="Select primary goal"
                      style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {GOALS.map(({ val, icon, desc }) => (
                        <OptBtn key={val} val={val} icon={icon} desc={desc}
                          sel={goal===val} cls="on-gold"
                          onClick={() => setGoal(val)} />
                      ))}
                    </div>
                    <button type="button" className="ob3-cta" disabled={!goal}
                      onClick={() => setStep(3)}>
                      Continue →
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* ── STEP 3: Intensity ── */}
              {step === 3 && (
                <motion.div key="s3" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card>
                    <Dots cur={3} total={6} />
                    <Micro>Step 3 of 6 — Intensity</Micro>
                    <Heading>Set your<br />threshold.</Heading>
                    <div role="radiogroup" aria-label="Select intensity"
                      style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {INTENSITIES.map(({ val, desc, cls, badge }) => (
                        <OptBtn key={val} val={val} desc={desc} badge={badge}
                          sel={intensity===val} cls={cls}
                          onClick={() => setIntensity(val)} />
                      ))}
                    </div>
                    {isExtreme && (
                      <div style={{
                        marginTop:10, padding:"9px 12px",
                        background:"var(--rd)",
                        border:"1px solid rgba(224,84,84,.2)", borderRadius:3,
                        fontSize:9, letterSpacing:".1em",
                        color:"var(--r)", fontFamily:"var(--mono)",
                        lineHeight:1.65, animation:"ob3-fadeup .25s ease both",
                      }}>
                        ⚠ NO EXCUSES mode: zero-grace streak reset.
                        Miss one day and your streak drops to zero — no recovery window.
                      </div>
                    )}
                    <button type="button"
                      className={`ob3-cta${isExtreme?" warn":""}`}
                      disabled={!intensity} onClick={() => setStep(4)}>
                      Continue →
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* ── STEP 4: Warning ── */}
              {step === 4 && (
                <motion.div key="s4" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card warn>
                    <Dots cur={4} total={6} />
                    <Micro color="var(--r)">⚠ Protocol Terms</Micro>
                    <Heading color="var(--r)">Miss once.<br />Start over.</Heading>
                    <div style={{
                      fontSize:11, lineHeight:1.9, color:"rgba(224,84,84,.45)",
                      letterSpacing:".06em", marginBottom:22,
                      fontFamily:"var(--mono)",
                      borderLeft:"2px solid rgba(224,84,84,.18)", paddingLeft:12,
                    }}>
                      Streaks are unforgiving by design. One missed day resets your
                      counter to zero. No exceptions. The system does not negotiate.
                      {isExtreme && (
                        <><br /><br />
                        <span style={{ color:"var(--r)" }}>
                          You selected NO EXCUSES. Full accountability is active from day one.
                        </span></>
                      )}
                    </div>
                    <button type="button" className="ob3-cta warn"
                      onClick={() => setStep(5)}>
                      I accept →
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* ── STEP 5: Identity ── */}
              {step === 5 && (
                <motion.div key="s5" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card>
                    <Dots cur={5} total={6} />
                    <Micro>Step 5 of 6 — Identity</Micro>
                    <Heading>Who do you<br />become?</Heading>
                    <p style={{
                      fontSize:11, color:"var(--tm)", letterSpacing:".07em",
                      lineHeight:1.75, marginBottom:16, fontFamily:"var(--mono)",
                    }}>
                      Choose the statement you hold yourself to daily.
                    </p>
                    <div role="radiogroup" aria-label="Select identity statement"
                      style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {IDENTITIES.map(({ val, sub }) => (
                        <OptBtn key={val} val={`"${val}"`} sub={sub}
                          sel={identity===val} cls="on-gold"
                          onClick={() => setIdentity(val)} />
                      ))}
                    </div>
                    <button type="button" className="ob3-cta" disabled={!identity}
                      onClick={() => setStep(6)}>
                      Sync identity →
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* ── STEP 6: Final lock ── */}
              {step === 6 && (
                <motion.div key="s6" variants={PV} initial="enter" animate="center" exit="exit">
                  <Card>
                    <Dots cur={6} total={6} />
                    <Micro>Final Lock — Confirm</Micro>
                    <Heading>Prove<br />it.</Heading>

                    {/* Summary */}
                    <div style={{
                      background:"var(--s2)", border:"1px solid var(--b)",
                      borderRadius:3, padding:"10px 13px", marginBottom:18,
                    }}>
                      <SumRow label="Goal"      val={goal} />
                      <SumRow label="Intensity"  val={intensity} red={isExtreme} />
                      <SumRow label="Identity"   val={`"${identity}"`} />
                    </div>

                    {/* Commit input */}
                    <div style={{ marginBottom:0 }}>
                      <div style={{
                        fontSize:9, letterSpacing:".22em", textTransform:"uppercase",
                        color:"var(--tf)", padding:"9px 14px",
                        background:"var(--s2)",
                        border:"1px solid var(--b)", borderBottom:"none",
                        borderRadius:"3px 3px 0 0",
                        fontFamily:"var(--mono)",
                      }}>
                        Type exactly: I WILL NOT QUIT
                      </div>
                      <input
                        ref={inputRef}
                        className={`ob3-input${inputState==="valid"?" valid":inputState==="error"?" error":""}`}
                        value={commitText}
                        onChange={e => {
                          setCommitText(e.target.value.toUpperCase());
                          setAuthError("");
                        }}
                        placeholder="TYPE HERE..."
                        autoComplete="off" autoCorrect="off" spellCheck={false}
                        aria-label='Type "I WILL NOT QUIT" to confirm'
                        aria-invalid={inputState==="error"}
                        disabled={loading} maxLength={20}
                      />
                    </div>

                    <button type="button"
                      className={`ob3-cta${canSubmit?" ob3-pulse":""}`}
                      disabled={!canSubmit} onClick={handleFinalLock}>
                      {loading
                        ? <><span className="ob3-spin" aria-hidden />Syncing profile…</>
                        : "Activate ManifiX →"
                      }
                    </button>

                    {authError && (
                      <div role="alert" aria-live="assertive" style={{
                        marginTop:10, padding:"9px 13px",
                        background:"var(--rd)",
                        border:"1px solid rgba(224,84,84,.22)", borderRadius:3,
                        fontFamily:"var(--mono)", fontSize:9,
                        letterSpacing:".12em", color:"var(--r)", lineHeight:1.7,
                        animation:"ob3-fadeup .25s ease both",
                      }}>
                        ⚠ {authError}
                      </div>
                    )}

                    <button type="button"
                      onClick={() => { setStep(5); setAuthError(""); }}
                      style={{
                        background:"none", border:"none",
                        color:"var(--tf)", fontFamily:"var(--mono)",
                        fontSize:9, letterSpacing:".18em",
                        textTransform:"uppercase", cursor:"pointer",
                        display:"block", width:"100%", textAlign:"center",
                        marginTop:12, padding:"6px 0",
                        transition:"color .18s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color="var(--tm)"}
                      onMouseLeave={e => e.currentTarget.style.color="var(--tf)"}
                    >
                      ← Back
                    </button>
                  </Card>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
