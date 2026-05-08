import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   STORAGE HELPERS  — single source of truth
   All reads/writes go through here so nothing
   ever gets out of sync between pages.
───────────────────────────────────────────── */
const KEYS = {
  streak:   "magic16_streak",
  xp:       "magic16_xp",
  level:    "magic16_level",
  lastDate: "magic16_last_date",
  prevLevel:"magic16_prev_level",
  rankSeed: "magic16_rank_seed",
};

const XP_PER_LEVEL = 500;   // XP needed per level
const XP_PER_SESSION = 120; // XP awarded per completed session

function loadState() {
  const streak   = Number(localStorage.getItem(KEYS.streak)   || 0);
  const xp       = Number(localStorage.getItem(KEYS.xp)       || 0);
  const level    = Number(localStorage.getItem(KEYS.level)     || 1);
  const lastDate = localStorage.getItem(KEYS.lastDate)         || "";
  const today    = new Date().toDateString();
  const missionDone = lastDate === today;

  // Deterministic-ish rank based on streak + level so it feels personal
  let rankSeed = Number(localStorage.getItem(KEYS.rankSeed) || 0);
  if (!rankSeed) {
    rankSeed = Math.floor(Math.random() * 8000) + 1200;
    localStorage.setItem(KEYS.rankSeed, rankSeed);
  }
  // rank improves as streak grows — shrinks by ~40 per streak day
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);

  return { streak, xp, level, missionDone, globalRank };
}

/**
 * Called from Magic16's result screen (or can be called after a session).
 * Write this in ONE place so Dashboard always reads consistent data.
 */
export function recordSessionComplete() {
  const today  = new Date().toDateString();
  const streak = Number(localStorage.getItem(KEYS.streak) || 0) + 1;
  let   xp     = Number(localStorage.getItem(KEYS.xp)    || 0) + XP_PER_SESSION;
  let   level  = Number(localStorage.getItem(KEYS.level)  || 1);

  // Level up loop (can level multiple times if XP overflow)
  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL;
    level += 1;
  }

  localStorage.setItem(KEYS.streak,   streak);
  localStorage.setItem(KEYS.xp,       xp);
  localStorage.setItem(KEYS.level,    level);
  localStorage.setItem(KEYS.lastDate, today);
}

/* ─────────────────────────────────────────────
   KEYFRAME + FONT INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("db-styles")) return;
  const s = document.createElement("style");
  s.id = "db-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

    @keyframes db-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,60,60,0.5); }
      50%      { box-shadow: 0 0 0 10px rgba(255,60,60,0); }
    }
    @keyframes db-scan {
      from { transform: translateY(-100%); }
      to   { transform: translateY(400%); }
    }
    @keyframes db-shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }
    @keyframes db-blink {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.15; }
    }
    @keyframes db-float {
      0%,100% { transform: translateY(0px); }
      50%     { transform: translateY(-6px); }
    }
    .db-danger-pulse { animation: db-pulse 1.8s ease-in-out infinite; }
    .db-blink        { animation: db-blink 1.1s ease-in-out infinite; }
    .db-float        { animation: db-float 3s ease-in-out infinite; }
    .db-shimmer-text {
      background: linear-gradient(90deg, #c8a84b, #f5d06a, #c8a84b, #f5d06a);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: db-shimmer 2.5s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   INLINE STYLE MAP
───────────────────────────────────────────── */
const C = {
  // layout
  root: (danger) => ({
    minHeight: "100dvh",
    background: danger ? "#0a0500" : "#080808",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    color: "#e8e4d9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 0 40px",
    position: "relative",
    overflowX: "hidden",
    transition: "background 1s ease",
  }),
  noiseBg: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat",
    pointerEvents: "none",
    zIndex: 0,
  },
  inner: {
    position: "relative",
    zIndex: 1,
    width: "min(440px, 96vw)",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  // header band
  headerBand: {
    borderBottom: "1px solid #1c1c1c",
    padding: "18px 0 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logoWrap: { display: "flex", flexDirection: "column" },
  logoMain: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: "0.06em",
    lineHeight: 1,
    color: "#e8e4d9",
  },
  logoSub: {
    fontSize: 9,
    letterSpacing: "0.25em",
    color: "#3a3a3a",
    textTransform: "uppercase",
    marginTop: 1,
  },
  rankPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  rankLabel: { fontSize: 8, letterSpacing: "0.2em", color: "#3a3a3a", textTransform: "uppercase" },
  rankNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 26,
    letterSpacing: "0.04em",
    lineHeight: 1,
  },

  // stat strip
  statStrip: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 18,
  },
  statCell: {
    border: "1px solid #181818",
    background: "#0c0c0c",
    padding: "10px 12px",
  },
  statCellLabel: {
    fontSize: 8,
    letterSpacing: "0.22em",
    color: "#3a3a3a",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  },
  statCellValue: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: "0.03em",
    lineHeight: 1,
    color: "#e8e4d9",
  },

  // main card
  mainCard: {
    border: "1px solid #1c1c1c",
    background: "#0b0b0b",
    padding: "20px 18px",
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
  },
  cardScan: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "30%",
    background: "linear-gradient(180deg, transparent, rgba(197,161,55,0.04), transparent)",
    animation: "db-scan 3s ease-in-out infinite",
    pointerEvents: "none",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  protocolLabel: {
    fontSize: 9,
    letterSpacing: "0.22em",
    color: "#3a3a3a",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  protocolDay: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36,
    letterSpacing: "0.04em",
    lineHeight: 1,
  },
  statusChip: (done) => ({
    fontSize: 9,
    letterSpacing: "0.18em",
    padding: "4px 8px",
    border: `1px solid ${done ? "#1e4d1e" : "#2a2a2a"}`,
    color: done ? "#4ade80" : "#444",
    textTransform: "uppercase",
  }),
  barBg: {
    height: 3,
    background: "#141414",
    marginBottom: 6,
    overflow: "hidden",
  },
  barFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, #c8a84b, #f5d06a)",
    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
  }),
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#3a3a3a",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  psych: (danger) => ({
    fontSize: 11,
    lineHeight: 1.7,
    color: danger ? "#ff5c5c" : "#4a4a4a",
    letterSpacing: "0.06em",
    borderLeft: `2px solid ${danger ? "#ff3c3c" : "#1e1e1e"}`,
    paddingLeft: 10,
    transition: "all .6s ease",
  }),

  // XP bar
  xpWrap: {
    border: "1px solid #181818",
    background: "#0c0c0c",
    padding: "12px 14px",
    marginBottom: 14,
  },
  xpTopRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 9,
    letterSpacing: "0.2em",
    color: "#3a3a3a",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  xpBarBg: { height: 4, background: "#141414", overflow: "hidden" },
  xpBarFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, #6b46c1, #c084fc)",
    transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)",
  }),

  // timer / action grid
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14,
  },
  timerBox: (danger) => ({
    border: `1px solid ${danger ? "#3a1010" : "#181818"}`,
    background: "#0c0c0c",
    padding: "14px 14px",
  }),
  timerLabel: { fontSize: 8, letterSpacing: "0.22em", color: "#3a3a3a", textTransform: "uppercase", marginBottom: 4, display: "block" },
  timerValue: (danger) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 30,
    letterSpacing: "0.04em",
    lineHeight: 1,
    color: danger ? "#ff5c5c" : "#e8e4d9",
  }),
  missionBox: {
    border: "1px solid #181818",
    background: "#0c0c0c",
    padding: "14px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  missionLabel: { fontSize: 8, letterSpacing: "0.22em", color: "#3a3a3a", textTransform: "uppercase", marginBottom: 4, display: "block" },
  missionValue: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 18,
    letterSpacing: "0.03em",
    lineHeight: 1.2,
    color: "#c8a84b",
  },

  // CTA
  ctaBtn: (done) => ({
    display: "block",
    width: "100%",
    padding: "18px 0",
    background: done ? "#0f0f0f" : "#c8a84b",
    color: done ? "#333" : "#080808",
    border: done ? "1px solid #1e1e1e" : "none",
    textAlign: "center",
    textDecoration: "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: done ? "default" : "pointer",
    marginBottom: 10,
    transition: "all .2s",
  }),
  warningText: {
    fontSize: 9,
    letterSpacing: "0.15em",
    color: "#ff3c3c",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
  },

  // level up overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#000000ee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    gap: 12,
  },
  overlayGlow: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(197,161,55,0.35) 0%, transparent 70%)",
    marginBottom: 10,
  },
  overlayTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 48,
    letterSpacing: "0.1em",
    color: "#f5d06a",
    textAlign: "center",
  },
  overlayBody: {
    fontSize: 11,
    letterSpacing: "0.2em",
    color: "#666",
    textTransform: "uppercase",
    textAlign: "center",
  },

  // day dots
  dotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: 6,
    marginBottom: 14,
  },
  dot: (filled, today) => ({
    aspectRatio: "1",
    background: filled ? "#c8a84b" : "#111",
    border: today ? "1px solid #c8a84b" : "1px solid #1a1a1a",
    borderRadius: 2,
    transition: "all .3s",
  }),

  // footer
  footer: {
    marginTop: 20,
    fontSize: 9,
    letterSpacing: "0.2em",
    color: "#222",
    textAlign: "center",
    textTransform: "uppercase",
  },
};

/* ─────────────────────────────────────────────
   PSYCH COPY  (rotates based on streak + time)
───────────────────────────────────────────── */
const PSYCH_LINES = [
  "The brain seeks comfort. Deny it.",
  "Every elite performer you admire did the work today.",
  "Consistency is not motivation. It is architecture.",
  "You don't rise to the occasion. You fall to your systems.",
  "The streak is not the goal. It is the proof.",
  "Discomfort is data. Keep moving.",
];

function getPsychLine(streak, danger, done) {
  if (done) return "Biological objective achieved. You are in the top 1% today.";
  if (danger) return "CRITICAL: Window closing. Execute now or reset to zero.";
  return PSYCH_LINES[streak % PSYCH_LINES.length];
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Dashboard() {
  const [state, setState] = useState(() => loadState());
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, expired: false });
  const [danger, setDanger] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [mounted, setMounted] = useState(false);
  const prevLevelRef = useRef(null);

  useEffect(() => {
    injectStyles();
    setMounted(true);

    const fresh = loadState();
    setState(fresh);

    // Detect level-up since last visit
    const prevLevel = Number(localStorage.getItem(KEYS.prevLevel) || fresh.level);
    if (fresh.level > prevLevel) {
      setNewLevel(fresh.level);
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 4000);
    }
    localStorage.setItem(KEYS.prevLevel, fresh.level);
    prevLevelRef.current = fresh.level;
  }, []);

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, expired: true });
        setDanger(true);
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft({ h, m, expired: false });
      setDanger(h < 3);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Expose recordSessionComplete so Magic16 can call it
  useEffect(() => {
    window.__magic16_recordComplete = () => {
      recordSessionComplete();
      setState(loadState());
    };
    return () => { delete window.__magic16_recordComplete; };
  }, []);

  const { streak, xp, level, missionDone, globalRank } = state;
  const dayProgress    = Math.min(streak, 16);
  const progressPct    = Math.floor((dayProgress / 16) * 100);
  const xpPct          = Math.floor((xp / XP_PER_LEVEL) * 100);
  const timerStr       = timeLeft.expired ? "EXPIRED" : `${timeLeft.h}h ${timeLeft.m}m`;
  const psychLine      = getPsychLine(streak, danger, missionDone);

  const stagger = (i) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeOut" },
  });

  return (
    <div style={C.root(danger)}>
      {/* noise texture */}
      <div style={C.noiseBg} />

      {/* LEVEL UP OVERLAY */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            style={C.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={C.overlayGlow} className="db-float" />
            <div style={C.overlayTitle} className="db-shimmer-text">
              LEVEL {newLevel}<br />UNLOCKED
            </div>
            <div style={C.overlayBody}>Neural capacity expanded</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={C.inner}>
        {/* ── HEADER */}
        <motion.div style={C.headerBand} {...stagger(0)}>
          <div style={C.logoWrap}>
            <span style={C.logoMain}>MAGIC16</span>
            <span style={C.logoSub}>Discipline Operating System</span>
          </div>
          <div style={C.rankPill}>
            <span style={C.rankLabel}>Global Rank</span>
            <span style={{ ...C.rankNum }} className="db-shimmer-text">
              #{globalRank.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* ── STAT STRIP */}
        <motion.div style={C.statStrip} {...stagger(1)}>
          {[
            { label: "Streak", value: streak },
            { label: "Level",  value: level  },
            { label: "XP",     value: xp     },
          ].map(({ label, value }) => (
            <div key={label} style={C.statCell}>
              <span style={C.statCellLabel}>{label}</span>
              <span style={C.statCellValue}>{value}</span>
            </div>
          ))}
        </motion.div>

        {/* ── MAIN PROTOCOL CARD */}
        <motion.div style={C.mainCard} {...stagger(2)}>
          <div style={C.cardScan} />

          <div style={C.cardTopRow}>
            <div>
              <div style={C.protocolLabel}>Protocol Progress</div>
              <div style={C.protocolDay}>Day {dayProgress} / 16</div>
            </div>
            <div style={C.statusChip(missionDone)}>
              {missionDone ? "✓ Complete" : "Pending"}
            </div>
          </div>

          <div style={C.barBg}>
            <div style={C.barFill(mounted ? progressPct : 0)} />
          </div>
          <div style={C.barLabel}>
            <span>System Sync</span>
            <span>{progressPct}%</span>
          </div>

          <div style={C.psych(danger)}>{psychLine}</div>
        </motion.div>

        {/* ── DAY DOTS */}
        <motion.div style={C.dotsGrid} {...stagger(3)}>
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              style={C.dot(i < dayProgress, i === dayProgress && !missionDone)}
              title={`Day ${i + 1}`}
            />
          ))}
        </motion.div>

        {/* ── XP BAR */}
        <motion.div style={C.xpWrap} {...stagger(4)}>
          <div style={C.xpTopRow}>
            <span>XP Progress → Level {level + 1}</span>
            <span>{xp} / {XP_PER_LEVEL}</span>
          </div>
          <div style={C.xpBarBg}>
            <div style={C.xpBarFill(mounted ? xpPct : 0)} />
          </div>
        </motion.div>

        {/* ── TIMER + MISSION */}
        {!missionDone && (
          <motion.div style={C.twoCol} {...stagger(5)}>
            <div
              style={C.timerBox(danger)}
              className={danger ? "db-danger-pulse" : ""}
            >
              <span style={C.timerLabel}>Window Closes</span>
              <div style={C.timerValue(danger)}>{timerStr}</div>
            </div>
            <div style={C.missionBox}>
              <span style={C.missionLabel}>Active Mission</span>
              <div style={C.missionValue}>
                {danger ? "EXECUTE NOW" : "EXECUTE MAGIC16"}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CTA */}
        <motion.div {...stagger(6)}>
          <Link
            to="/app/magic16"
            style={C.ctaBtn(missionDone)}
            onClick={(e) => missionDone && e.preventDefault()}
          >
            {missionDone ? "Session Complete — Rest & Integrate" : `Start Session — Day ${dayProgress + 1} →`}
          </Link>

          {!missionDone && (
            <div style={C.warningText}>
              <span className="db-blink">⚠</span> Failure resets streak to zero
            </div>
          )}
        </motion.div>

        {/* ── FOOTER */}
        <div style={C.footer}>
          Magic16 · {new Date().getFullYear()} · No excuses.
        </div>
      </div>
    </div>
  );
}
