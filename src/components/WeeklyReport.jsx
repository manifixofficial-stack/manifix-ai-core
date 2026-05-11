import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { loadLanguage, loadMode, getLanguage, getMode } from "../constants/languages";

/* ─────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("wr-styles")) return;
  const s = document.createElement("style");
  s.id = "wr-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

    @keyframes wr-scan {
      from { top:-4px; } to { top:100%; }
    }
    @keyframes wr-shimmer {
      from { background-position:-200% center; }
      to   { background-position:200% center; }
    }
    @keyframes wr-fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes wr-bar-grow {
      from { height:0; }
      to   { height:var(--bar-h); }
    }
    @keyframes wr-blink {
      0%,100% { opacity:1; } 50% { opacity:0.1; }
    }
    @keyframes wr-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes wr-pulse {
      0%,100% { opacity:0.15; transform:scale(1); }
      50%     { opacity:0.3;  transform:scale(1.06); }
    }
    @keyframes wr-count {
      from { opacity:0; transform:scale(0.7); }
      to   { opacity:1; transform:scale(1); }
    }

    .wr-shimmer {
      background: linear-gradient(90deg,#c8a84b,#ffe08a,#ffc83c,#ffe08a,#c8a84b);
      background-size:200% auto;
      -webkit-background-clip:text;
      -webkit-text-fill-color:transparent;
      background-clip:text;
      animation:wr-shimmer 2.8s linear infinite;
    }
    .wr-fade-up { animation:wr-fade-up 0.45s ease both; }
    .wr-blink   { animation:wr-blink 1.1s ease-in-out infinite; }

    .wr-bar {
      width:100%;
      border-radius:2px 2px 0 0;
      animation:wr-bar-grow 1s cubic-bezier(0.4,0,0.2,1) both;
      transform-origin:bottom;
    }
    .wr-share-btn {
      width:100%; padding:15px 0;
      background:#ffc83c; color:#080808;
      border:none; cursor:pointer;
      font-family:'DM Mono',monospace;
      font-size:12px; font-weight:700;
      letter-spacing:.22em; text-transform:uppercase;
      transition:background .15s, transform .1s;
    }
    .wr-share-btn:hover  { background:#ffe08a; }
    .wr-share-btn:active { transform:scale(.99); }
    .wr-share-btn:disabled {
      background:#111; color:#2a2a2a;
      border:1px solid #1a1a1a; cursor:not-allowed;
    }
    .wr-sec-btn {
      width:100%; padding:12px 0;
      background:transparent; color:#444;
      border:1px solid #1a1a1a; cursor:pointer;
      font-family:'DM Mono',monospace;
      font-size:11px; font-weight:500;
      letter-spacing:.18em; text-transform:uppercase;
      transition:color .2s, border-color .2s;
    }
    .wr-sec-btn:hover { color:#666; border-color:#2a2a2a; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   DATA HELPERS
───────────────────────────────────────────── */
const API_BASE = "https://manifix.up.railway.app";
const XP_PER_SESSION = 120;

function loadWeekData() {
  const streak    = Number(localStorage.getItem("magic16_streak")    || 0);
  const xp        = Number(localStorage.getItem("magic16_xp")        || 0);
  const level     = Number(localStorage.getItem("magic16_level")      || 1);
  const goal      = localStorage.getItem("magic16_goal")              || "Discipline";
  const identity  = localStorage.getItem("magic16_identity")          || "I don't quit.";
  const intensity = localStorage.getItem("magic16_intensity")         || "Standard";
  const rankSeed  = Number(localStorage.getItem("magic16_rank_seed")  || 4000);
  const globalRank= Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);

  // Simulate 7-day accuracy history from stored data
  // In production this would come from Supabase
  const accuracyHistory = JSON.parse(
    localStorage.getItem("magic16_accuracy_history") || "[]"
  );

  // Fill missing days with 0
  const days = Array.from({ length: 7 }, (_, i) => ({
    day:      i + 1,
    label:    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
    accuracy: accuracyHistory[i] ?? 0,
    done:     i < streak,
  }));

  const sessionsThisWeek = Math.min(streak, 7);
  const avgAccuracy      = days.filter(d => d.done).length > 0
    ? Math.round(days.filter(d => d.done).reduce((a, d) => a + d.accuracy, 0) / Math.max(sessionsThisWeek, 1))
    : 0;
  const bestDay          = days.reduce((best, d) => d.accuracy > best.accuracy ? d : best, days[0]);
  const xpThisWeek       = sessionsThisWeek * XP_PER_SESSION;
  const weekNumber       = Math.ceil(streak / 7);

  return {
    streak, xp, level, goal, identity, intensity,
    globalRank, days, sessionsThisWeek, avgAccuracy,
    bestDay, xpThisWeek, weekNumber,
  };
}

/* ─────────────────────────────────────────────
   ACCURACY BAR CHART
───────────────────────────────────────────── */
function AccuracyChart({ days, accentColor }) {
  const maxAcc = Math.max(...days.map(d => d.accuracy), 1);

  return (
    <div style={{
      display:"flex", alignItems:"flex-end",
      gap:6, height:80,
      padding:"0 4px",
    }}>
      {days.map((d, i) => {
        const pct  = d.done ? Math.max((d.accuracy / 100) * 80, 4) : 4;
        const color = d.done
          ? (d.accuracy >= 80 ? accentColor : d.accuracy >= 50 ? "#c8a84b" : "#ff5c5c")
          : "#111";

        return (
          <div key={i} style={{
            flex:1, display:"flex",
            flexDirection:"column",
            alignItems:"center", gap:4,
          }}>
            <div style={{ fontSize:8, color:"#2a2a2a", letterSpacing:".1em" }}>
              {d.done ? `${d.accuracy}%` : ""}
            </div>
            <div style={{
              width:"100%", background:"#111",
              borderRadius:"2px 2px 0 0",
              height:60, position:"relative",
              overflow:"hidden",
            }}>
              <motion.div
                style={{
                  position:"absolute", bottom:0,
                  left:0, right:0,
                  background: d.done
                    ? `linear-gradient(to top, ${color}, ${color}88)`
                    : "#1a1a1a",
                  borderRadius:"2px 2px 0 0",
                }}
                initial={{ height:0 }}
                animate={{ height:`${pct}px` }}
                transition={{ delay: i * 0.08, duration:0.8, ease:"easeOut" }}
              />
            </div>
            <div style={{
              fontSize:8, letterSpacing:".1em",
              color: d.done ? "#3a3a3a" : "#1e1e1e",
              textTransform:"uppercase",
            }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, delay }) {
  return (
    <motion.div
      style={{
        border:`1px solid ${accent ? "#2a2010" : "#1a1a1a"}`,
        background: accent ? "#0f0d08" : "#0c0c0c",
        padding:"10px 12px", flex:1,
      }}
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.4, ease:"easeOut" }}
    >
      <div style={{
        fontSize:8, letterSpacing:".22em",
        color:"#2a2a2a", textTransform:"uppercase",
        marginBottom:5,
      }}>{label}</div>
      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:28, letterSpacing:".04em",
        color: accent ? "#ffc83c" : "#e8e4d9",
        lineHeight:1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize:8, color:"#222",
          letterSpacing:".1em", marginTop:3,
          textTransform:"uppercase",
        }}>{sub}</div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function WeeklyReport({ onClose }) {
  const cardRef     = useRef(null);
  const langCode    = loadLanguage();
  const modeId      = loadMode();
  const lang        = getLanguage(langCode);
  const mode        = getMode(modeId);
  const accentColor = mode.color || "#ffc83c";

  const [data,       setData]       = useState(null);
  const [summary,    setSummary]    = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [sharing,    setSharing]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [stage,      setStage]      = useState(0);

  // Load data
  useEffect(() => {
    injectStyles();
    const d = loadWeekData();
    setData(d);
    // Staggered reveal
    setTimeout(() => setStage(1), 200);
    setTimeout(() => setStage(2), 600);
    setTimeout(() => setStage(3), 1000);
  }, []);

  // Fetch GPT summary
  useEffect(() => {
    if (!data) return;
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const prompt = `Generate a short, powerful weekly wellness report summary for a ManifiX AI user.
User data:
- Streak: ${data.streak} days
- Sessions this week: ${data.sessionsThisWeek}/7
- Average accuracy: ${data.avgAccuracy}%
- Level: ${data.level}
- XP earned this week: ${data.xpThisWeek}
- Goal: ${data.goal}
- Identity: ${data.identity}
- Global rank: #${data.globalRank.toLocaleString()}
- Best day accuracy: ${data.bestDay?.accuracy}%

Write exactly 2-3 sentences. Be direct and powerful. No fluff. Acknowledge their effort specifically. End with one sharp forward-looking statement. Respond in ${lang.nativeName}.`;

        const url = `${API_BASE}/api/stream?message=${encodeURIComponent(prompt)}`;
        const eventSource = new EventSource(url);
        let full = "";

        eventSource.onmessage = (e) => {
          if (e.data === "[DONE]") {
            eventSource.close();
            setSummaryLoading(false);
            return;
          }
          full += e.data;
          setSummary(full);
        };
        eventSource.onerror = () => {
          eventSource.close();
          setSummary(getFallbackSummary(data, langCode));
          setSummaryLoading(false);
        };
      } catch {
        setSummary(getFallbackSummary(data, langCode));
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [data]);

  // Fallback summary if API fails
  function getFallbackSummary(d, lc) {
    const summaries = {
      "en-IN": `${d.sessionsThisWeek} sessions. ${d.avgAccuracy}% average accuracy. Rank #${d.globalRank.toLocaleString()}. You showed up when most people didn't. Week ${d.weekNumber + 1} starts now.`,
      "hi-IN": `${d.sessionsThisWeek} सत्र। ${d.avgAccuracy}% औसत सटीकता। रैंक #${d.globalRank.toLocaleString()}। आप तब आए जब ज़्यादातर लोग नहीं आए। सप्ताह ${d.weekNumber + 1} अभी शुरू होता है।`,
      "te-IN": `${d.sessionsThisWeek} సెషన్లు. ${d.avgAccuracy}% సగటు ఖచ్చితత్వం. రాంక్ #${d.globalRank.toLocaleString()}. మీరు వచ్చారు, చాలా మంది రాలేదు. వారం ${d.weekNumber + 1} ఇప్పుడు ప్రారంభమవుతుంది.`,
    };
    return summaries[lc] || summaries["en-IN"];
  }

  // Share as image
  const handleShare = useCallback(async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const image = canvas.toDataURL("image/png");
      const blob  = await (await fetch(image)).blob();
      const file  = new File([blob], "manifix-weekly-report.png", { type:"image/png" });

      const shareText = `Week ${data?.weekNumber} done. ${data?.sessionsThisWeek}/7 sessions. ${data?.avgAccuracy}% avg accuracy. Rank #${data?.globalRank?.toLocaleString()}. #ManifiXAI #Magic16`;

      if (navigator.share && navigator.canShare({ files:[file] })) {
        await navigator.share({
          title: "ManifiX AI — Weekly Report",
          text:  shareText,
          files: [file],
        });
      } else {
        const a    = document.createElement("a");
        a.href     = URL.createObjectURL(blob);
        a.download = "manifix-weekly-report.png";
        a.click();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn("Share failed:", e);
    } finally {
      setSharing(false);
    }
  }, [sharing, data]);

  // Copy text summary
  const handleCopyText = useCallback(() => {
    const text = `ManifiX AI — Week ${data?.weekNumber} Report\n\nSessions: ${data?.sessionsThisWeek}/7\nAvg Accuracy: ${data?.avgAccuracy}%\nStreak: ${data?.streak} days\nLevel: ${data?.level}\nGlobal Rank: #${data?.globalRank?.toLocaleString()}\n\n${summary}\n\nmanifixai.com`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data, summary]);

  if (!data) return null;

  /* ── RENDER ── */
  return (
    <AnimatePresence>
      <motion.div
        style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.92)",
          display:"flex", alignItems:"center",
          justifyContent:"center",
          padding:"16px",
          overflowY:"auto",
          backdropFilter:"blur(4px)",
        }}
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        exit={{ opacity:0 }}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          style={{
            width:"min(440px,96vw)",
            display:"flex", flexDirection:"column",
            gap:10, position:"relative", zIndex:1,
            fontFamily:"'DM Mono','Courier New',monospace",
          }}
          initial={{ opacity:0, y:30, scale:0.97 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:20 }}
          transition={{ duration:0.45, ease:"easeOut" }}
        >

          {/* ── CLOSE BUTTON ── */}
          <div style={{
            display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:2,
          }}>
            <div style={{
              fontSize:9, letterSpacing:".22em",
              color:"#2a2a2a", textTransform:"uppercase",
            }}>
              Weekly intelligence report
            </div>
            <button
              onClick={onClose}
              style={{
                background:"none", border:"1px solid #1e1e1e",
                color:"#333", cursor:"pointer",
                fontFamily:"inherit", fontSize:9,
                letterSpacing:".18em", textTransform:"uppercase",
                padding:"4px 10px", transition:"color .2s",
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* ── SHAREABLE CARD ── */}
          <div
            ref={cardRef}
            style={{
              border:"1px solid #1e1e1e",
              background:"#0b0b0b",
              padding:"22px 20px",
              position:"relative", overflow:"hidden",
            }}
          >
            {/* scan line */}
            <div style={{
              position:"absolute", left:0, right:0, height:2,
              background:`linear-gradient(90deg,transparent,${accentColor}33,${accentColor}88,${accentColor}33,transparent)`,
              animation:"wr-scan 3.5s linear infinite",
              pointerEvents:"none",
            }} />

            {/* ambient glow */}
            <div style={{
              position:"absolute",
              top:"20%", left:"50%",
              transform:"translateX(-50%)",
              width:300, height:150,
              background:`radial-gradient(ellipse,${accentColor}12 0%,transparent 70%)`,
              animation:"wr-pulse 4s ease-in-out infinite",
              pointerEvents:"none",
            }} />

            {/* watermark */}
            <div style={{
              position:"absolute", top:10, right:12,
              fontSize:8, letterSpacing:".25em",
              color:"#1a1a1a", textTransform:"uppercase",
            }}>MANIFIX AI</div>

            {/* ── HEADER ── */}
            <motion.div
              style={{ marginBottom:18 }}
              initial={{ opacity:0, y:10 }}
              animate={stage >= 1 ? { opacity:1, y:0 } : {}}
              transition={{ duration:0.4 }}
            >
              <div style={{
                display:"flex", justifyContent:"space-between",
                alignItems:"flex-start",
              }}>
                <div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:42, letterSpacing:".06em",
                    lineHeight:1, color:"#e8e4d9",
                  }}>WEEK {data.weekNumber}</div>
                  <div style={{
                    fontSize:9, letterSpacing:".22em",
                    color:"#2a2a2a", textTransform:"uppercase",
                    marginTop:2,
                  }}>Intelligence report</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{
                    fontSize:8, letterSpacing:".18em",
                    color:"#2a2a2a", textTransform:"uppercase",
                    marginBottom:3,
                  }}>Global rank</div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:32, letterSpacing:".04em", lineHeight:1,
                  }} className="wr-shimmer">
                    #{data.globalRank.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── STATS ROW ── */}
            {stage >= 1 && (
              <div style={{
                display:"flex", gap:8, marginBottom:16,
              }}>
                <StatCard
                  label="Sessions"
                  value={`${data.sessionsThisWeek}/7`}
                  sub="this week"
                  accent
                  delay={0}
                />
                <StatCard
                  label="Avg Accuracy"
                  value={`${data.avgAccuracy}%`}
                  sub="weekly avg"
                  delay={0.07}
                />
                <StatCard
                  label="XP Earned"
                  value={`+${data.xpThisWeek}`}
                  sub="this week"
                  delay={0.14}
                />
                <StatCard
                  label="Level"
                  value={data.level}
                  sub="current"
                  delay={0.21}
                />
              </div>
            )}

            {/* ── ACCURACY CHART ── */}
            {stage >= 2 && (
              <motion.div
                style={{
                  border:"1px solid #141414",
                  background:"#0c0c0c",
                  padding:"12px 14px",
                  marginBottom:14,
                }}
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ duration:0.5 }}
              >
                <div style={{
                  display:"flex", justifyContent:"space-between",
                  fontSize:8, letterSpacing:".18em",
                  color:"#2a2a2a", textTransform:"uppercase",
                  marginBottom:10,
                }}>
                  <span>7-day accuracy</span>
                  <span>Best: {data.bestDay?.accuracy}% on {data.bestDay?.label}</span>
                </div>
                <AccuracyChart days={data.days} accentColor={accentColor} />
              </motion.div>
            )}

            {/* ── STREAK + MODE ── */}
            {stage >= 2 && (
              <motion.div
                style={{
                  display:"grid", gridTemplateColumns:"1fr 1fr",
                  gap:8, marginBottom:14,
                }}
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.4, delay:0.1 }}
              >
                <div style={{
                  border:"1px solid #1a1a1a",
                  background:"#0c0c0c",
                  padding:"10px 12px",
                }}>
                  <div style={{
                    fontSize:8, letterSpacing:".18em",
                    color:"#2a2a2a", textTransform:"uppercase",
                    marginBottom:4,
                  }}>Total streak</div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:28, color:"#e8e4d9", lineHeight:1,
                  }}>{data.streak} days 🔥</div>
                </div>

                <div style={{
                  border:`1px solid ${mode.colorDim || "#1a1a1a"}`,
                  background:"#0c0c0c",
                  padding:"10px 12px",
                }}>
                  <div style={{
                    fontSize:8, letterSpacing:".18em",
                    color:"#2a2a2a", textTransform:"uppercase",
                    marginBottom:4,
                  }}>Mode</div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:22, lineHeight:1,
                    color: accentColor,
                  }}>{mode.emoji} {mode.label}</div>
                  <div style={{
                    fontSize:8, color:"#222",
                    letterSpacing:".1em", marginTop:3,
                    textTransform:"uppercase",
                  }}>{lang.nativeName}</div>
                </div>
              </motion.div>
            )}

            {/* ── 16-DAY DOTS ── */}
            {stage >= 2 && (
              <motion.div
                style={{ marginBottom:14 }}
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ duration:0.5, delay:0.2 }}
              >
                <div style={{
                  fontSize:8, letterSpacing:".18em",
                  color:"#2a2a2a", textTransform:"uppercase",
                  marginBottom:8,
                }}>16-day protocol</div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(8,1fr)", gap:5,
                }}>
                  {Array.from({ length:16 }, (_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        aspectRatio:"1", borderRadius:2,
                        background: i < data.streak ? accentColor : "#111",
                        border: i === data.streak - 1
                          ? `1px solid ${accentColor}`
                          : "1px solid #1a1a1a",
                      }}
                      initial={{ scale:0.4, opacity:0 }}
                      animate={{ scale:1, opacity:1 }}
                      transition={{ delay:0.03*i+0.3, duration:0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── GPT SUMMARY ── */}
            {stage >= 3 && (
              <motion.div
                style={{
                  borderLeft:`2px solid ${accentColor}`,
                  paddingLeft:12,
                  marginBottom:10,
                }}
                initial={{ opacity:0, x:-8 }}
                animate={{ opacity:1, x:0 }}
                transition={{ duration:0.5 }}
              >
                <div style={{
                  fontSize:8, letterSpacing:".18em",
                  color:"#2a2a2a", textTransform:"uppercase",
                  marginBottom:8,
                }}>AI assessment</div>

                {summaryLoading && !summary ? (
                  <div style={{
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                    <div style={{
                      width:14, height:14,
                      border:"1.5px solid #1e1e1e",
                      borderTopColor: accentColor,
                      borderRadius:"50%",
                      animation:"wr-spin .7s linear infinite",
                      flexShrink:0,
                    }} />
                    <span style={{
                      fontSize:9, color:"#2a2a2a",
                      letterSpacing:".15em", textTransform:"uppercase",
                    }}>Generating intelligence report...</span>
                  </div>
                ) : (
                  <div style={{
                    fontSize:12, lineHeight:1.75,
                    color:"#4a4a4a", letterSpacing:".06em",
                  }}>
                    {summary}
                    {summaryLoading && (
                      <span className="wr-blink" style={{
                        color: accentColor, marginLeft:2,
                      }}>▊</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── IDENTITY + GOAL ── */}
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:9, color:"#1e1e1e",
              letterSpacing:".12em", textTransform:"uppercase",
              borderTop:"1px solid #141414", paddingTop:10,
              marginTop:8,
            }}>
              <span>"{data.identity}"</span>
              <span>{data.goal}</span>
            </div>

          </div>
          {/* END SHAREABLE CARD */}

          {/* ── ACTION BUTTONS ── */}
          <motion.div
            style={{ display:"flex", flexDirection:"column", gap:8 }}
            initial={{ opacity:0, y:14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.5, duration:0.4 }}
          >
            {/* Share card */}
            <button
              className="wr-share-btn"
              onClick={handleShare}
              disabled={sharing || summaryLoading}
            >
              {sharing
                ? "Generating..."
                : copied
                ? "✓ Downloaded"
                : "↗ Share weekly report"}
            </button>

            {/* Copy text */}
            <button
              className="wr-sec-btn"
              onClick={handleCopyText}
            >
              {copied ? "✓ Copied" : "📋 Copy text summary"}
            </button>

            {/* Social share text */}
            <button
              className="wr-sec-btn"
              onClick={() => {
                const text = `Week ${data.weekNumber} done on ManifiX AI.\n${data.sessionsThisWeek}/7 sessions. ${data.avgAccuracy}% accuracy.\nRank #${data.globalRank.toLocaleString()}.\n\nmanifixai.com\n#ManifiXAI #Magic16 #yoga`;
                if (navigator.share) {
                  navigator.share({ title:"ManifiX AI", text });
                } else {
                  navigator.clipboard?.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              ↗ Share to Instagram / X / WhatsApp
            </button>

            {/* Close */}
            <button className="wr-sec-btn" onClick={onClose}>
              ← Back to dashboard
            </button>

          </motion.div>

          {/* footer */}
          <div style={{
            textAlign:"center", fontSize:8,
            letterSpacing:".2em", color:"#141414",
            textTransform:"uppercase",
          }}>
            ManifiX AI · Weekly Intelligence · manifixai.com
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
