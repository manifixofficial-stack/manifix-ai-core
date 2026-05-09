import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";

/* ─────────────────────────────────────────────
   KEYFRAME INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("result-styles")) return;
  const s = document.createElement("style");
  s.id = "result-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes r-scan {
      from { top: -4px; }
      to   { top: 100%; }
    }
    @keyframes r-shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }
    @keyframes r-blink {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.15; }
    }
    @keyframes r-grid-pulse {
      0%,100% { opacity: 0.04; }
      50%     { opacity: 0.08; }
    }
    @keyframes r-ring-spin {
      from { stroke-dashoffset: 283; }
    }
    @keyframes r-float {
      0%,100% { transform: translateY(0px); }
      50%     { transform: translateY(-6px); }
    }
    @keyframes r-glow-pulse {
      0%,100% { opacity: 0.15; transform: scale(1); }
      50%     { opacity: 0.35; transform: scale(1.08); }
    }
    @keyframes r-count {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes r-fade-up {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes r-ticker {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .r-shimmer {
      background: linear-gradient(90deg, #c8a84b, #ffe08a, #ffc83c, #ffe08a, #c8a84b);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: r-shimmer 2.8s linear infinite;
    }
    .r-blink { animation: r-blink 1.1s ease-in-out infinite; }
    .r-float { animation: r-float 3.5s ease-in-out infinite; }
    .r-fade-up { animation: r-fade-up 0.5s ease both; }
    .r-glow { animation: r-glow-pulse 4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   ACCURACY RING COMPONENT
───────────────────────────────────────────── */
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~339

function AccuracyRing({ accuracy, isPro, animate }) {
  const offset = CIRCUMFERENCE - (accuracy / 100) * CIRCUMFERENCE;
  const color  = accuracy >= 80 ? "#ffc83c" : accuracy >= 50 ? "#c8a84b" : "#ff5c5c";

  return (
    <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
      {/* glow behind ring */}
      <div className="r-glow" style={{
        position: "absolute",
        inset: -16,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* track */}
        <circle
          cx="80" cy="80" r={RADIUS}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="6"
        />
        {/* fill */}
        <motion.circle
          cx="80" cy="80" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={animate ? offset : CIRCUMFERENCE}
          transform="rotate(-90 80 80)"
          animate={animate ? { strokeDashoffset: offset } : {}}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        />
        {/* tick marks */}
        {[0, 25, 50, 75].map((pct) => {
          const angle = (pct / 100) * 360 - 90;
          const rad   = (angle * Math.PI) / 180;
          const x1 = 80 + (RADIUS - 10) * Math.cos(rad);
          const y1 = 80 + (RADIUS - 10) * Math.sin(rad);
          const x2 = 80 + (RADIUS + 2)  * Math.cos(rad);
          const y2 = 80 + (RADIUS + 2)  * Math.sin(rad);
          return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a2a2a" strokeWidth="1.5" />;
        })}
      </svg>

      {/* center text */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}>
        <motion.span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 42,
            lineHeight: 1,
            color,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={animate ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.2, ease: "backOut" }}
        >
          {accuracy}%
        </motion.span>
        <span style={{
          fontSize: 8,
          letterSpacing: "0.22em",
          color: "#333",
          textTransform: "uppercase",
        }}>accuracy</span>
        {isPro && (
          <span style={{
            fontSize: 7,
            letterSpacing: "0.15em",
            color: "#ffc83c",
            textTransform: "uppercase",
            marginTop: 2,
          }}>PRO ✦</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD COMPONENT
───────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, delay }) {
  return (
    <motion.div
      style={{
        border: `1px solid ${accent ? "#2a2010" : "#1a1a1a"}`,
        background: accent ? "#0f0d08" : "#0c0c0c",
        padding: "12px 14px",
        flex: 1,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: "0.22em",
        color: "#2e2e2e",
        textTransform: "uppercase",
        marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28,
        letterSpacing: "0.04em",
        color: accent ? "#ffc83c" : "#e8e4d9",
        lineHeight: 1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 9,
          color: "#2a2a2a",
          letterSpacing: "0.12em",
          marginTop: 3,
          textTransform: "uppercase",
        }}>{sub}</div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   PSYCH MESSAGE based on accuracy
───────────────────────────────────────────── */
function getPsychMessage(accuracy, streak) {
  if (accuracy >= 90) return "Exceptional. You move like someone who will not be stopped.";
  if (accuracy >= 80) return `Day ${streak} complete. Elite tier. Most people didn't even start today.`;
  if (accuracy >= 60) return "Solid execution. Consistency compounds. Show up again tomorrow.";
  return "You showed up. That alone puts you ahead. Sharpen form tomorrow.";
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Result() {
  const location = useLocation();
  const navigate  = useNavigate();
  const cardRef   = useRef(null);

  // ✅ FIXED: accept both `day` and `streak` — Magic16 sends both
  const raw = location.state || {};
  const accuracy = raw.accuracy ?? 0;
  const isPro    = raw.isPro    ?? false;
  const video    = raw.video    ?? null;
  const day      = raw.day      ?? raw.streak ?? 1;   // ✅ works either way
  const streak   = day;                                // alias for display

  // XP gained this session (matches Dashboard constant)
  const XP_GAINED = 120;

  // Global rank — read from localStorage (set by Dashboard) instead of random
  const [globalRank] = useState(() => {
    const seed   = Number(localStorage.getItem("magic16_rank_seed") || 4000);
    const lvl    = Number(localStorage.getItem("magic16_level")     || 1);
    return Math.max(1, seed - streak * 40 - (lvl - 1) * 60);
  });

  // Animation stages
  const [stage,    setStage]    = useState(0);
  const [sharing,  setSharing]  = useState(false);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    injectStyles();

    // confetti burst
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.55 },
      colors: ["#ffc83c", "#ffe08a", "#ffffff", "#c8a84b"],
    });

    // staggered reveal
    const timers = [
      setTimeout(() => setStage(1), 400),   // ring + header
      setTimeout(() => setStage(2), 1000),  // stats row
      setTimeout(() => setStage(3), 1600),  // psych line + XP
      setTimeout(() => setStage(4), 2200),  // video + actions
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Share card as image
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
      const file  = new File([blob], "manifix-proof.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "ManifiX AI — Proof of Discipline",
          text:  `Day ${streak} complete. ${accuracy}% accuracy. Can you handle this? #ManifiXAI #Magic16`,
          files: [file],
        });
      } else {
        // fallback: download
        const a = document.createElement("a");
        a.href     = URL.createObjectURL(blob);
        a.download = "manifix-proof.png";
        a.click();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn("Share failed:", e);
    } finally {
      setSharing(false);
    }
  }, [sharing, streak, accuracy]);

  // Share video clip
  const handleShareVideo = useCallback(async () => {
    if (!video) return;
    const file = new File([video], "magic16-proof.webm", { type: "video/webm" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Magic16 — Proof of Discipline" });
    } else {
      const a = document.createElement("a");
      a.href     = URL.createObjectURL(video);
      a.download = "magic16-proof.webm";
      a.click();
    }
  }, [video]);

  const accuracyColor =
    accuracy >= 80 ? "#ffc83c" : accuracy >= 50 ? "#c8a84b" : "#ff5c5c";
  const psychLine = getPsychMessage(accuracy, streak);

  /* ── RENDER ── */
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#080808",
      color: "#e8e4d9",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 50px",
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* background grid */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,200,60,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "r-grid-pulse 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* ambient glow top */}
      <div style={{
        position: "fixed",
        top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 200,
        background: `radial-gradient(ellipse, ${accuracyColor}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* corner marks */}
      {[
        { top: 16, left: 16,   borderTopWidth: 2, borderLeftWidth: 2  },
        { top: 16, right: 16,  borderTopWidth: 2, borderRightWidth: 2 },
        { bottom: 16, left: 16,  borderBottomWidth: 2, borderLeftWidth: 2  },
        { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed",
          width: 18, height: 18,
          borderColor: "#ffc83c",
          borderStyle: "solid",
          borderWidth: 0,
          opacity: 0.4,
          ...pos,
        }} />
      ))}

      {/* ── MAIN CONTENT */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "min(420px, 96vw)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        paddingTop: 24,
      }}>

        {/* ── HEADER */}
        <motion.div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1e1e1e",
            paddingBottom: 10,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 26,
              letterSpacing: "0.06em",
              color: "#e8e4d9",
              lineHeight: 1,
            }}>MAGIC16</div>
            <div style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              color: "#2a2a2a",
              textTransform: "uppercase",
              marginTop: 1,
            }}>Session Result</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "#2a2a2a",
              textTransform: "uppercase",
              marginBottom: 2,
            }}>Day completed</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 32,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }} className="r-shimmer">{String(streak).padStart(2, "0")}</div>
          </div>
        </motion.div>

        {/* ── SHAREABLE CARD (for html2canvas) */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              ref={cardRef}
              style={{
                border: "1px solid #1e1e1e",
                background: "#0b0b0b",
                padding: "22px 20px",
                position: "relative",
                overflow: "hidden",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* scan line */}
              <div style={{
                position: "absolute",
                left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg,transparent,#ffc83c33,#ffc83c88,#ffc83c33,transparent)",
                animation: "r-scan 3s linear infinite",
                pointerEvents: "none",
              }} />

              {/* watermark */}
              <div style={{
                position: "absolute",
                top: 12, right: 14,
                fontSize: 8,
                letterSpacing: "0.25em",
                color: "#1a1a1a",
                textTransform: "uppercase",
              }}>MANIFIX AI</div>

              {/* ring + pro badge row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 18,
              }}>
                <AccuracyRing accuracy={accuracy} isPro={isPro} animate={stage >= 1} />

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  {isPro && (
                    <motion.div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #c8a84b",
                        padding: "5px 10px",
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        color: "#ffc83c",
                        textTransform: "uppercase",
                        background: "#0f0d08",
                        alignSelf: "flex-start",
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
                    >
                      🏆 Discipline pro
                    </motion.div>
                  )}

                  {/* global rank */}
                  <div>
                    <div style={{
                      fontSize: 8,
                      letterSpacing: "0.22em",
                      color: "#2a2a2a",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}>Global rank</div>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 36,
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                    }} className="r-shimmer">
                      #{globalRank.toLocaleString()}
                    </div>
                  </div>

                  {/* streak */}
                  <div>
                    <div style={{
                      fontSize: 8,
                      letterSpacing: "0.22em",
                      color: "#2a2a2a",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}>Current streak</div>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 28,
                      letterSpacing: "0.04em",
                      color: "#e8e4d9",
                      lineHeight: 1,
                    }}>{streak} {streak === 1 ? "day" : "days"} 🔥</div>
                  </div>
                </div>
              </div>

              {/* divider */}
              <div style={{ borderTop: "1px solid #141414", marginBottom: 14 }} />

              {/* day dots — 16 day progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 8,
                  letterSpacing: "0.22em",
                  color: "#2a2a2a",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>16-day protocol</div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: 5,
                }}>
                  {Array.from({ length: 16 }, (_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 2,
                        background: i < streak ? "#c8a84b" : "#111",
                        border: i === streak - 1 ? "1px solid #ffc83c" : "1px solid #1a1a1a",
                      }}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.05 * i + 0.3, duration: 0.25 }}
                    />
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATS ROW */}
        <AnimatePresence>
          {stage >= 2 && (
            <div style={{ display: "flex", gap: 8 }}>
              <StatCard
                label="XP gained"
                value={`+${XP_GAINED}`}
                sub="this session"
                accent
                delay={0}
              />
              <StatCard
                label="Level"
                value={localStorage.getItem("magic16_level") || "1"}
                sub="current"
                delay={0.08}
              />
              <StatCard
                label="Total XP"
                value={Number(localStorage.getItem("magic16_xp") || 0)}
                sub="accumulated"
                delay={0.16}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── PSYCH LINE */}
        <AnimatePresence>
          {stage >= 3 && (
            <motion.div
              style={{
                borderLeft: `2px solid ${accuracyColor}`,
                paddingLeft: 12,
                fontSize: 11,
                color: "#4a4a4a",
                letterSpacing: "0.08em",
                lineHeight: 1.75,
                textTransform: "uppercase",
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {psychLine}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VIDEO PROOF */}
        <AnimatePresence>
          {stage >= 4 && video && (
            <motion.div
              style={{
                border: "1px solid #1a1a1a",
                background: "#0c0c0c",
                overflow: "hidden",
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "#2a2a2a",
                textTransform: "uppercase",
                padding: "8px 12px",
                borderBottom: "1px solid #141414",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span className="r-blink" style={{ color: "#ff3c3c" }}>●</span>
                AI verified clip ready
              </div>
              <video
                src={URL.createObjectURL(video)}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  display: "block",
                  maxHeight: 180,
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  opacity: 0.85,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION BUTTONS */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* share card button */}
              <button
                onClick={handleShareCard}
                disabled={sharing}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  background: sharing ? "#111" : "#ffc83c",
                  color: sharing ? "#333" : "#080808",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  cursor: sharing ? "not-allowed" : "pointer",
                  transition: "all .2s",
                }}
              >
                {sharing
                  ? "Generating…"
                  : copied
                  ? "✓ Downloaded"
                  : "↗ Share proof card"}
              </button>

              {/* share video */}
              {video && (
                <button
                  onClick={handleShareVideo}
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    background: "transparent",
                    color: "#555",
                    border: "1px solid #1e1e1e",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  ↗ Share video clip
                </button>
              )}

              {/* next day — ✅ FIXED: goes to /app/dashboard not /magic16 */}
              <button
                onClick={() => navigate("/app/dashboard")}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  background: "transparent",
                  color: "#2a2a2a",
                  border: "1px solid #141414",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "color .2s, border-color .2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#555";
                  e.target.style.borderColor = "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#2a2a2a";
                  e.target.style.borderColor = "#141414";
                }}
              >
                ← Back to dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FOOTER */}
        <div style={{
          fontSize: 8,
          letterSpacing: "0.22em",
          color: "#1e1e1e",
          textAlign: "center",
          textTransform: "uppercase",
          marginTop: 8,
        }}>
          Magic16 · ManifiX AI · No excuses.
        </div>

      </div>
    </div>
  );
}
