import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";

/* ─────────────────────────────────────────────
   ✅ ADDITION — LANGUAGE MAP (mirrors Gpt.jsx)
───────────────────────────────────────────── */
const LANG_LABELS = {
  en: "English", hi: "हिन्दी", te: "తెలుగు", ta: "தமிழ்",
  es: "Español", ar: "العربية", fr: "Français",
  pt: "Português", de: "Deutsch", zh: "中文",
};

const LANG_FLAGS = {
  en: "🇬🇧", hi: "🇮🇳", te: "🇮🇳", ta: "🇮🇳",
  es: "🇪🇸", ar: "🇸🇦", fr: "🇫🇷",
  pt: "🇧🇷", de: "🇩🇪", zh: "🇨🇳",
};

/* ─────────────────────────────────────────────
   ✅ ADDITION — MODE THEME MAP
───────────────────────────────────────────── */
const MODE_COLORS = {
  morning: { accent: "#ffc83c", dim: "#c8a84b", label: "MORNING" },
  sleep:   { accent: "#6b46c1", dim: "#9b8fd4", label: "SLEEP"   },
  focus:   { accent: "#378ADD", dim: "#5b9fd4", label: "FOCUS"   },
  posture: { accent: "#22c55e", dim: "#16a34a", label: "POSTURE" },
};

/* ─────────────────────────────────────────────
   ✅ ADDITION — PSYCH MESSAGES (multilingual subset)
   Full translation deferred to your getCue system;
   English used for card, native for spoken output.
───────────────────────────────────────────── */
function getPsychMessage(accuracy, streak, mode) {
  if (mode === "sleep") {
    return accuracy >= 80
      ? "Wind-down mastered. Your nervous system thanks you. Sleep deep."
      : "Good session. Each wind-down trains your rest response. Keep going.";
  }
  if (mode === "focus") {
    return accuracy >= 80
      ? "Focus protocol complete. Your prefrontal cortex is now primed. Execute."
      : "Solid prep. Deep work starts now. You've given your brain the signal.";
  }
  if (mode === "posture") {
    return accuracy >= 80
      ? "Posture reset complete. Your spine is aligned. Remote work reclaimed."
      : "Good session. Consistency will reverse months of desk damage.";
  }
  // morning / default
  if (accuracy >= 90) return "Exceptional. You move like someone who will not be stopped.";
  if (accuracy >= 80) return `Day ${streak} complete. Elite tier. Most people didn't even start today.`;
  if (accuracy >= 60) return "Solid execution. Consistency compounds. Show up again tomorrow.";
  return "You showed up. That alone puts you ahead. Sharpen form tomorrow.";
}

/* ─────────────────────────────────────────────
   ✅ ADDITION — WEEKLY STATS from localStorage
───────────────────────────────────────────── */
function getWeeklyStats(streak) {
  const weekSessions = Math.min(7, streak);
  const totalXP      = Number(localStorage.getItem("magic16_xp")        || 0);
  const level        = Number(localStorage.getItem("magic16_level")     || 1);
  const totalSess    = Number(localStorage.getItem("magic16_total_sessions") || streak);
  const accuracy7d   = Math.min(99, 70 + streak * 2);
  return { weekSessions, totalXP, level, totalSess, accuracy7d };
}

/* ─────────────────────────────────────────────
   KEYFRAME INJECTION
───────────────────────────────────────────── */
function injectStyles(accentColor) {
  const existing = document.getElementById("result-styles");
  if (existing) existing.remove(); // rebuild with new accent
  const s = document.createElement("style");
  s.id = "result-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes r-scan       { from{top:-4px} to{top:100%} }
    @keyframes r-shimmer    { from{background-position:-200% center} to{background-position:200% center} }
    @keyframes r-blink      { 0%,100%{opacity:1} 50%{opacity:0.15} }
    @keyframes r-grid-pulse { 0%,100%{opacity:0.04} 50%{opacity:0.08} }
    @keyframes r-float      { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
    @keyframes r-glow-pulse { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.35;transform:scale(1.08)} }
    @keyframes r-fade-up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    .r-shimmer {
      background: linear-gradient(90deg,${accentColor},#ffe08a,${accentColor},#ffe08a,${accentColor});
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: r-shimmer 2.8s linear infinite;
    }
    .r-blink   { animation: r-blink 1.1s ease-in-out infinite; }
    .r-float   { animation: r-float 3.5s ease-in-out infinite; }
    .r-fade-up { animation: r-fade-up 0.5s ease both; }
    .r-glow    { animation: r-glow-pulse 4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   ACCURACY RING
───────────────────────────────────────────── */
const RADIUS       = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AccuracyRing({ accuracy, isPro, animate, accentColor }) {
  const offset = CIRCUMFERENCE - (accuracy / 100) * CIRCUMFERENCE;
  const color  = accentColor || (accuracy >= 80 ? "#ffc83c" : accuracy >= 50 ? "#c8a84b" : "#ff5c5c");

  return (
    <div style={{ position:"relative", width:160, height:160, flexShrink:0 }}>
      <div className="r-glow" style={{
        position:"absolute", inset:-16, borderRadius:"50%",
        background:`radial-gradient(circle,${color}33 0%,transparent 70%)`,
        pointerEvents:"none",
      }} />

      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#1a1a1a" strokeWidth="6" />
        <motion.circle
          cx="80" cy="80" r={RADIUS} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={animate ? offset : CIRCUMFERENCE}
          transform="rotate(-90 80 80)"
          animate={animate ? { strokeDashoffset: offset } : {}}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          transition={{ duration:2, ease:"easeOut", delay:0.3 }}
        />
        {[0,25,50,75].map(pct => {
          const angle = (pct/100)*360-90;
          const rad   = (angle*Math.PI)/180;
          return (
            <line key={pct}
              x1={80+(RADIUS-10)*Math.cos(rad)} y1={80+(RADIUS-10)*Math.sin(rad)}
              x2={80+(RADIUS+2)*Math.cos(rad)}  y2={80+(RADIUS+2)*Math.sin(rad)}
              stroke="#2a2a2a" strokeWidth="1.5"
            />
          );
        })}
      </svg>

      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:2,
      }}>
        <motion.span
          style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:42, lineHeight:1, color }}
          initial={{ opacity:0, scale:0.7 }}
          animate={animate ? { opacity:1, scale:1 } : {}}
          transition={{ duration:0.5, delay:1.2, ease:"backOut" }}
        >
          {accuracy}%
        </motion.span>
        <span style={{ fontSize:8, letterSpacing:"0.22em", color:"#333", textTransform:"uppercase" }}>
          accuracy
        </span>
        {isPro && (
          <span style={{ fontSize:7, letterSpacing:"0.15em", color, textTransform:"uppercase", marginTop:2 }}>
            PRO ✦
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, accentColor, delay }) {
  return (
    <motion.div
      style={{
        border:`1px solid ${accent ? (accentColor+"33") : "#1a1a1a"}`,
        background: accent ? "#0f0d08" : "#0c0c0c",
        padding:"12px 14px", flex:1,
      }}
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.45, ease:"easeOut" }}
    >
      <div style={{
        fontSize:8, letterSpacing:"0.22em", color:"#2e2e2e",
        textTransform:"uppercase", marginBottom:5,
      }}>{label}</div>
      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:28, letterSpacing:"0.04em",
        color: accent ? (accentColor || "#ffc83c") : "#e8e4d9",
        lineHeight:1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize:9, color:"#2a2a2a",
          letterSpacing:"0.12em", marginTop:3, textTransform:"uppercase",
        }}>{sub}</div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   ✅ ADDITION — WEEKLY BAR (7-day grid)
───────────────────────────────────────────── */
function WeeklyBar({ weekSessions, accentColor }) {
  return (
    <div>
      <div style={{
        fontSize:8, letterSpacing:"0.22em", color:"#2a2a2a",
        textTransform:"uppercase", marginBottom:6,
      }}>This week</div>
      <div style={{ display:"flex", gap:4 }}>
        {Array.from({ length:7 }, (_, i) => (
          <div key={i} style={{
            flex:1, height:20, borderRadius:2,
            background: i < weekSessions ? (accentColor || "#ffc83c") : "#111",
            border:`1px solid ${i < weekSessions ? (accentColor+"55") : "#1a1a1a"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:7, color: i < weekSessions ? "#0a0a0a" : "#222",
          }}>
            {i < weekSessions ? "✓" : ""}
          </div>
        ))}
      </div>
      <div style={{
        display:"flex", justifyContent:"space-between",
        marginTop:4, fontSize:7, color:"#222",
        letterSpacing:"0.1em", textTransform:"uppercase",
      }}>
        {["M","T","W","T","F","S","S"].map((d,i) => (
          <span key={i} style={{ flex:1, textAlign:"center" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Result() {
  const location = useLocation();
  const navigate  = useNavigate();
  const cardRef   = useRef(null);

  const raw      = location.state || {};
  const accuracy = raw.accuracy ?? 0;
  const isPro    = raw.isPro    ?? false;
  const video    = raw.video    ?? null;
  const day      = raw.day      ?? raw.streak ?? 1;
  const streak   = day;

  // ✅ ADDITION — read mode & lang from state (sent by Magic16) or fallback to localStorage
  const mode     = raw.mode || localStorage.getItem("magic16_mode") || "morning";
  const langCode = raw.lang || localStorage.getItem("magic16_lang") || "en";

  // ✅ ADDITION — theme derived from mode
  const modeTheme = useMemo(() => MODE_COLORS[mode] || MODE_COLORS.morning, [mode]);
  const accent    = modeTheme.accent;

  // ✅ ADDITION — weekly stats
  const weekly = useMemo(() => getWeeklyStats(streak), [streak]);

  // ✅ ADDITION — language display
  const langFlag  = LANG_FLAGS[langCode]  || "🌐";
  const langLabel = LANG_LABELS[langCode] || "English";

  const XP_GAINED = 120;

  const [globalRank] = useState(() => {
    const seed = Number(localStorage.getItem("magic16_rank_seed") || 4000);
    const lvl  = Number(localStorage.getItem("magic16_level")     || 1);
    return Math.max(1, seed - streak * 40 - (lvl - 1) * 60);
  });

  const [stage,   setStage]   = useState(0);
  const [sharing, setSharing] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const psychLine = useMemo(() => getPsychMessage(accuracy, streak, mode), [accuracy, streak, mode]);

  useEffect(() => {
    injectStyles(accent);

    confetti({
      particleCount: 200,
      spread: 110,
      origin: { y: 0.55 },
      colors: [accent, "#ffe08a", "#ffffff", modeTheme.dim],
    });

    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 1600),
      setTimeout(() => setStage(4), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [accent, modeTheme]);

  /* ── SHARE CARD (html2canvas) ── */
  const handleShareCard = useCallback(async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");
      const blob  = await (await fetch(image)).blob();
      const file  = new File([blob], "manifix-proof.png", { type:"image/png" });

      if (navigator.share && navigator.canShare({ files:[file] })) {
        await navigator.share({
          title: "ManifiX AI — Proof of Discipline",
          text:  `${modeTheme.label} MODE — Day ${streak} complete. ${accuracy}% accuracy. ${langFlag} #ManifiXAI #Magic16`,
          files: [file],
        });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "manifix-proof.png"; a.click();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn("Share failed:", e);
    } finally {
      setSharing(false);
    }
  }, [sharing, streak, accuracy, modeTheme, langFlag]);

  const handleShareVideo = useCallback(async () => {
    if (!video) return;
    const file = new File([video], "magic16-proof.webm", { type:"video/webm" });
    if (navigator.share && navigator.canShare({ files:[file] })) {
      await navigator.share({ files:[file], title:"Magic16 — Proof of Discipline" });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(video); a.download = "magic16-proof.webm"; a.click();
    }
  }, [video]);

  /* ─── RENDER ─── */
  return (
    <div style={{
      minHeight:"100dvh", background:"#080808", color:"#e8e4d9",
      fontFamily:"'DM Mono','Courier New',monospace",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"0 0 50px", position:"relative", overflowX:"hidden",
    }}>

      {/* bg grid */}
      <div style={{
        position:"fixed", inset:0,
        backgroundImage:`linear-gradient(${accent}08 1px,transparent 1px),linear-gradient(90deg,${accent}08 1px,transparent 1px)`,
        backgroundSize:"40px 40px",
        animation:"r-grid-pulse 4s ease-in-out infinite",
        pointerEvents:"none",
      }} />

      {/* ambient glow */}
      <div style={{
        position:"fixed", top:0, left:"50%",
        transform:"translateX(-50%)",
        width:500, height:200,
        background:`radial-gradient(ellipse,${accent}18 0%,transparent 70%)`,
        pointerEvents:"none",
      }} />

      {/* corner marks */}
      {[
        { top:16,left:16,   borderTopWidth:2, borderLeftWidth:2   },
        { top:16,right:16,  borderTopWidth:2, borderRightWidth:2  },
        { bottom:16,left:16,  borderBottomWidth:2, borderLeftWidth:2   },
        { bottom:16,right:16, borderBottomWidth:2, borderRightWidth:2  },
      ].map((pos,i) => (
        <div key={i} style={{
          position:"fixed", width:18, height:18,
          borderColor:accent, borderStyle:"solid", borderWidth:0, opacity:0.4, ...pos,
        }} />
      ))}

      {/* CONTENT */}
      <div style={{
        position:"relative", zIndex:2,
        width:"min(420px,96vw)",
        display:"flex", flexDirection:"column",
        gap:12, paddingTop:24,
      }}>

        {/* ── HEADER */}
        <motion.div
          style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            borderBottom:"1px solid #1e1e1e", paddingBottom:10,
          }}
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4 }}
        >
          <div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:26, letterSpacing:"0.06em", color:"#e8e4d9", lineHeight:1,
            }}>MAGIC16</div>
            <div style={{
              display:"flex", alignItems:"center", gap:6, marginTop:3,
            }}>
              {/* ✅ ADDITION — mode badge */}
              <span style={{
                fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase",
                color:accent, border:`1px solid ${accent}44`,
                padding:"1px 6px", background:accent+"11",
              }}>{modeTheme.label}</span>
              {/* ✅ ADDITION — language flag badge */}
              <span style={{
                fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase",
                color:"#444", border:"1px solid #1a1a1a",
                padding:"1px 6px",
              }}>{langFlag} {langLabel}</span>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{
              fontSize:9, letterSpacing:"0.18em", color:"#2a2a2a",
              textTransform:"uppercase", marginBottom:2,
            }}>Day completed</div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:32, letterSpacing:"0.04em", lineHeight:1,
            }} className="r-shimmer">{String(streak).padStart(2,"0")}</div>
          </div>
        </motion.div>

        {/* ═══ SHAREABLE CARD ═══ */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              ref={cardRef}
              style={{
                border:`1px solid ${accent}33`,
                background:"#0b0b0b",
                padding:"22px 20px",
                position:"relative", overflow:"hidden",
              }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, ease:"easeOut" }}
            >
              {/* scan line */}
              <div style={{
                position:"absolute", left:0, right:0, height:2,
                background:`linear-gradient(90deg,transparent,${accent}33,${accent}88,${accent}33,transparent)`,
                animation:"r-scan 3s linear infinite", pointerEvents:"none",
              }} />

              {/* ✅ ADDITION — card header with mode + lang */}
              <div style={{
                display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:16,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {/* mode pill */}
                  <span style={{
                    fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase",
                    color:accent, border:`1px solid ${accent}55`,
                    padding:"2px 8px", background:accent+"11",
                  }}>{modeTheme.label} MODE</span>
                  {/* lang pill */}
                  <span style={{
                    fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase",
                    color:"#333", border:"1px solid #1a1a1a",
                    padding:"2px 6px",
                  }}>{langFlag}</span>
                </div>
                {/* watermark */}
                <span style={{
                  fontSize:8, letterSpacing:"0.25em",
                  color:"#1e1e1e", textTransform:"uppercase",
                }}>MANIFIX AI</span>
              </div>

              {/* ring + rank row */}
              <div style={{
                display:"flex", alignItems:"center", gap:20, marginBottom:18,
              }}>
                <AccuracyRing
                  accuracy={accuracy} isPro={isPro}
                  animate={stage >= 1} accentColor={accent}
                />

                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                  {isPro && (
                    <motion.div
                      style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        border:`1px solid ${accent}`, padding:"5px 10px",
                        fontSize:9, letterSpacing:"0.18em",
                        color:accent, textTransform:"uppercase",
                        background: accent+"11", alignSelf:"flex-start",
                      }}
                      initial={{ scale:0, opacity:0 }}
                      animate={{ scale:1, opacity:1 }}
                      transition={{ delay:1.4, type:"spring", stiffness:200 }}
                    >
                      🏆 Discipline pro
                    </motion.div>
                  )}

                  {/* global rank */}
                  <div>
                    <div style={{
                      fontSize:8, letterSpacing:"0.22em", color:"#2a2a2a",
                      textTransform:"uppercase", marginBottom:3,
                    }}>Global rank</div>
                    <div style={{
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize:36, letterSpacing:"0.04em", lineHeight:1,
                    }} className="r-shimmer">#{globalRank.toLocaleString()}</div>
                  </div>

                  {/* streak */}
                  <div>
                    <div style={{
                      fontSize:8, letterSpacing:"0.22em", color:"#2a2a2a",
                      textTransform:"uppercase", marginBottom:3,
                    }}>Current streak</div>
                    <div style={{
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize:28, letterSpacing:"0.04em",
                      color:"#e8e4d9", lineHeight:1,
                    }}>{streak} {streak === 1 ? "day" : "days"} 🔥</div>
                  </div>
                </div>
              </div>

              {/* divider */}
              <div style={{ borderTop:"1px solid #141414", marginBottom:14 }} />

              {/* ✅ ADDITION — WEEKLY STATS SECTION */}
              <div style={{
                display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                gap:8, marginBottom:14,
              }}>
                {[
                  { label:"Week",    value:`${weekly.weekSessions}/7`,  sub:"sessions" },
                  { label:"Level",   value:`L${weekly.level}`,          sub:`${weekly.totalXP} XP` },
                  { label:"7d Acc",  value:`${weekly.accuracy7d}%`,     sub:"avg accuracy" },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{
                    border:"1px solid #1a1a1a", background:"#0c0c0c", padding:"8px 10px",
                  }}>
                    <div style={{
                      fontSize:7, letterSpacing:"0.2em", color:"#2a2a2a",
                      textTransform:"uppercase", marginBottom:4,
                    }}>{label}</div>
                    <div style={{
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize:20, letterSpacing:"0.04em",
                      color:accent, lineHeight:1,
                    }}>{value}</div>
                    <div style={{
                      fontSize:7, color:"#222", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginTop:2,
                    }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* ✅ ADDITION — WEEKLY BAR */}
              <div style={{ marginBottom:14 }}>
                <WeeklyBar weekSessions={weekly.weekSessions} accentColor={accent} />
              </div>

              {/* 16-day protocol dots */}
              <div>
                <div style={{
                  fontSize:8, letterSpacing:"0.22em", color:"#2a2a2a",
                  textTransform:"uppercase", marginBottom:8,
                }}>16-day protocol</div>
                <div style={{
                  display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:5,
                }}>
                  {Array.from({ length:16 }, (_,i) => (
                    <motion.div
                      key={i}
                      style={{
                        aspectRatio:"1", borderRadius:2,
                        background: i < streak ? accent : "#111",
                        border: i === streak-1
                          ? `1px solid ${accent}`
                          : "1px solid #1a1a1a",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:7, color: i < streak ? "#0a0a0a" : "#1a1a1a",
                      }}
                      initial={{ scale:0.5, opacity:0 }}
                      animate={{ scale:1, opacity:1 }}
                      transition={{ delay:0.05*i+0.3, duration:0.25 }}
                    >
                      {i < streak ? "✓" : ""}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ✅ ADDITION — card footer hashtag row */}
              <div style={{
                marginTop:14, paddingTop:10,
                borderTop:"1px solid #141414",
                display:"flex", justifyContent:"space-between",
                alignItems:"center",
              }}>
                <span style={{
                  fontSize:8, letterSpacing:"0.15em",
                  color:"#1e1e1e", textTransform:"uppercase",
                }}>#ManifiXAI · #Magic16</span>
                <span style={{
                  fontSize:8, letterSpacing:"0.12em",
                  color:"#1e1e1e", textTransform:"uppercase",
                }}>manifix.app</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATS ROW */}
        <AnimatePresence>
          {stage >= 2 && (
            <div style={{ display:"flex", gap:8 }}>
              <StatCard label="XP gained"  value={`+${XP_GAINED}`} sub="this session" accent accentColor={accent} delay={0}    />
              <StatCard label="Level"      value={weekly.level}     sub="current"             delay={0.08}  accentColor={accent} />
              <StatCard label="Total sess" value={weekly.totalSess} sub="all time"             delay={0.16}  accentColor={accent} />
            </div>
          )}
        </AnimatePresence>

        {/* ── PSYCH LINE */}
        <AnimatePresence>
          {stage >= 3 && (
            <motion.div
              style={{
                borderLeft:`2px solid ${accent}`,
                paddingLeft:12, fontSize:11,
                color:"#4a4a4a", letterSpacing:"0.08em",
                lineHeight:1.75, textTransform:"uppercase",
              }}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              transition={{ duration:0.5 }}
            >
              {psychLine}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VIDEO PROOF */}
        <AnimatePresence>
          {stage >= 4 && video && (
            <motion.div
              style={{ border:"1px solid #1a1a1a", background:"#0c0c0c", overflow:"hidden" }}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.45 }}
            >
              <div style={{
                fontSize:8, letterSpacing:"0.22em", color:"#2a2a2a",
                textTransform:"uppercase", padding:"8px 12px",
                borderBottom:"1px solid #141414",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span className="r-blink" style={{ color:"#ff3c3c" }}>●</span>
                AI verified clip ready
              </div>
              <video
                src={URL.createObjectURL(video)}
                autoPlay loop muted playsInline
                style={{
                  width:"100%", display:"block",
                  maxHeight:180, objectFit:"cover",
                  transform:"scaleX(-1)", opacity:0.85,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION BUTTONS */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              style={{ display:"flex", flexDirection:"column", gap:8 }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:0.1 }}
            >
              {/* share card — primary, mode-coloured */}
              <button
                onClick={handleShareCard}
                disabled={sharing}
                style={{
                  width:"100%", padding:"16px 0",
                  background: sharing ? "#111" : accent,
                  color: sharing ? "#333" : "#080808",
                  border:"none", fontSize:12, fontWeight:700,
                  letterSpacing:"0.22em", textTransform:"uppercase",
                  fontFamily:"inherit",
                  cursor: sharing ? "not-allowed" : "pointer",
                  transition:"all .2s",
                }}
              >
                {sharing ? "Generating…" : copied ? "✓ Downloaded" : "↗ Share proof card"}
              </button>

              {/* share video */}
              {video && (
                <button
                  onClick={handleShareVideo}
                  style={{
                    width:"100%", padding:"13px 0",
                    background:"transparent", color:"#555",
                    border:"1px solid #1e1e1e",
                    fontSize:11, letterSpacing:"0.2em",
                    textTransform:"uppercase", fontFamily:"inherit",
                    cursor:"pointer", transition:"all .2s",
                  }}
                >
                  ↗ Share video clip
                </button>
              )}

              {/* back to dashboard */}
              <button
                onClick={() => navigate("/app/dashboard")}
                style={{
                  width:"100%", padding:"13px 0",
                  background:"transparent", color:"#2a2a2a",
                  border:"1px solid #141414",
                  fontSize:11, letterSpacing:"0.2em",
                  textTransform:"uppercase", fontFamily:"inherit",
                  cursor:"pointer", transition:"color .2s,border-color .2s",
                }}
                onMouseEnter={e => { e.target.style.color="#555"; e.target.style.borderColor="#2a2a2a"; }}
                onMouseLeave={e => { e.target.style.color="#2a2a2a"; e.target.style.borderColor="#141414"; }}
              >
                ← Back to dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FOOTER */}
        <div style={{
          fontSize:8, letterSpacing:"0.22em",
          color:"#1e1e1e", textAlign:"center",
          textTransform:"uppercase", marginTop:8,
        }}>
          Magic16 · ManifiX AI · {modeTheme.label} · No excuses.
        </div>

      </div>
    </div>
  );
}
