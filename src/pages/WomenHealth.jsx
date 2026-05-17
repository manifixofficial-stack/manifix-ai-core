/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Women's Health Module v7.0 GOLD EDITION       ║
 * ║                                                                          ║
 * ║  REAL FEATURES (no placeholder dashboard):                              ║
 * ║  • Cycle Tracker — Phase engine, predictions, calendar ring             ║
 * ║  • Mood & Energy Logger — History, patterns, streak                     ║
 * ║  • Symptom Log — Severity, timeline, delete                             ║
 * ║  • Hormone Balance — Sliders, phase-aware tips                          ║
 * ║  • Supplements — Add, mark taken, adherence %                           ║
 * ║  • Self Care — Checklist, water intake, sleep log                       ║
 * ║  • Wellness Programs — Progress, continue, streaks                      ║
 * ║  • Health Journal — Write, emoji mood, delete                           ║
 * ║  • Insights — Score breakdown, recommendations                          ║
 * ║                                                                          ║
 * ║  COLOR SYSTEM: ManifiX GOLD & BLACK                                     ║
 * ║  Gold: #D4A017  Deep: #B8860B  Bright: #FFD700  Black: #000000         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Flame, Droplets, Moon, Sun, Heart, Activity,
  Pill, Target, BookOpen, Plus, Minus, X, Check,
  Trophy, Star, Bell, Settings, Menu, Save, Trash2,
  AlertCircle, Info, Zap, BarChart3, Smile, Thermometer,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   MANIFIX GOLD & BLACK DESIGN TOKENS
══════════════════════════════════════════════════════════ */
const G   = "#D4A017";   // ManifiX Signature Gold
const GB  = "#B8860B";   // Deep Gold
const GBR = "#FFD700";   // Bright Gold highlight
const GD  = "#7A5C0A";   // Dim Gold
const BK  = "#000000";   // Pure Black
const S1  = "#080600";   // Surface 1
const S2  = "#0F0C02";   // Surface 2
const S3  = "#171200";   // Surface 3 (cards)
const S4  = "#1F1800";   // Surface 4 (hover)
const TX  = "#F0E6C8";   // Cream text
const TM  = "#9A8050";   // Muted text
const TD  = "#3A2E10";   // Dim text
const BDR = `rgba(212,160,23,0.18)`;
const BGW = `rgba(212,160,23,0.08)`;

/* ══════════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
══════════════════════════════════════════════════════════ */
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ══════════════════════════════════════════════════════════
   CYCLE PHASE ENGINE
══════════════════════════════════════════════════════════ */
function getCyclePhase(day) {
  if (day <= 5)  return { name: "Menstrual",   icon: Droplets, color: "#E05C5C", tip: "Rest and warmth. Gentle movement, iron-rich foods." };
  if (day <= 13) return { name: "Follicular",  icon: Sun,      color: G,         tip: "Energy rising. Ideal for new goals and strength training." };
  if (day <= 16) return { name: "Ovulation",   icon: Flame,    color: GBR,       tip: "Peak confidence. Great for social events and communication." };
  return              { name: "Luteal",        icon: Moon,     color: GB,        tip: "Progesterone dominant. Prioritize self-care and rest." };
}

/* ══════════════════════════════════════════════════════════
   DEFAULT DATA
══════════════════════════════════════════════════════════ */
const DEF_SUPPS = [
  { id: 1, name: "Vitamin D3",  dosage: "2000 IU", time: "Morning", taken: false },
  { id: 2, name: "Iron",        dosage: "18mg",    time: "Evening", taken: false },
  { id: 3, name: "Omega-3",     dosage: "1000mg",  time: "Lunch",   taken: false },
  { id: 4, name: "Magnesium",   dosage: "400mg",   time: "Night",   taken: false },
  { id: 5, name: "B-Complex",   dosage: "Daily",   time: "Morning", taken: false },
];
const DEF_CARE = [
  { id: 1, name: "Morning Meditation", duration: "10 min", done: false, cat: "Mindfulness" },
  { id: 2, name: "Gentle Yoga",        duration: "20 min", done: false, cat: "Movement"    },
  { id: 3, name: "Journaling",         duration: "15 min", done: false, cat: "Reflection"  },
  { id: 4, name: "Skin Care Routine",  duration: "10 min", done: false, cat: "Self Care"   },
  { id: 5, name: "Read a Book",        duration: "30 min", done: false, cat: "Relaxation"  },
  { id: 6, name: "Warm Bath",          duration: "20 min", done: false, cat: "Relaxation"  },
];
const DEF_PROGS = [
  { id: 1, name: "Hormone Balance",   duration: "14 days",  progress: 65, cat: "Popular"   },
  { id: 2, name: "Cycle Wellness",    duration: "Daily",    progress: 80, cat: "Tracking"  },
  { id: 3, name: "Stress & Mood",     duration: "7 days",   progress: 40, cat: "Mind Care" },
  { id: 4, name: "Energy Recovery",   duration: "10 days",  progress: 25, cat: "Boost"     },
  { id: 5, name: "Sleep Optimization",duration: "7 days",   progress: 50, cat: "Rest"      },
  { id: 6, name: "Nutrition Balance", duration: "14 days",  progress: 30, cat: "Diet"      },
];
const DEF_JOURNAL = [
  { id: 1, date: "Today",     title: "Feeling centered",  content: "Great morning routine. Meditation helped me start with clarity.", mood: "😊" },
  { id: 2, date: "Yesterday", title: "Productive day",    content: "Finished a big project. Felt accomplished and energized.",        mood: "😄" },
];
const AFFIRMATIONS = [
  "I am strong, capable, and worthy of all good things.",
  "My body is resilient and knows how to heal itself.",
  "I embrace my emotions and honor my needs.",
  "Every day I am growing into my best self.",
  "I deserve rest, care, and compassion.",
  "My wellness journey is uniquely mine, and I trust it.",
];
const TABS = [
  { id: "cycle",       label: "Cycle Tracker",    Icon: CalendarDays },
  { id: "mood",        label: "Mood Tracker",      Icon: Smile        },
  { id: "symptoms",    label: "Symptoms Log",      Icon: Thermometer  },
  { id: "hormones",    label: "Hormone Balance",   Icon: Activity     },
  { id: "supplements", label: "Supplements",       Icon: Pill         },
  { id: "selfcare",    label: "Self Care",         Icon: Heart        },
  { id: "programs",    label: "Programs",          Icon: Target       },
  { id: "journal",     label: "Health Journal",    Icon: BookOpen     },
  { id: "insights",    label: "Insights",          Icon: Star         },
];
const MOOD_OPTS = [
  { v: "Balanced",  e: "😊" }, { v: "Energetic", e: "⚡" },
  { v: "Focused",   e: "🧘" }, { v: "Tired",     e: "😴" },
  { v: "Stressed",  e: "😟" }, { v: "Emotional", e: "😢" },
];
const SEV_COLORS = { severe: "#EF4444", moderate: GBR, mild: G, low: GD };

/* ══════════════════════════════════════════════════════════
   STYLE INJECTION
══════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("wh-gold-css")) return;
  const s = document.createElement("style");
  s.id = "wh-gold-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:${BK}}
    ::-webkit-scrollbar-thumb{background:${TD};border-radius:3px}
    ::-webkit-scrollbar-thumb:hover{background:${G}}

    @keyframes goldShimmer{
      0%{background-position:200% center}100%{background-position:-200% center}
    }
    @keyframes goldPulse{
      0%,100%{box-shadow:0 0 0 rgba(212,160,23,0)}
      50%{box-shadow:0 0 28px rgba(212,160,23,0.22)}
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes heartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.1)}28%{transform:scale(1)}}

    .wh-app{display:flex;min-height:100dvh;background:${BK};font-family:'JetBrains Mono',monospace;color:${TX};overflow:hidden}
    .wh-sidebar{
      width:258px;background:${S1};border-right:1px solid ${BDR};
      padding:20px 0;position:fixed;height:100dvh;z-index:50;
      display:flex;flex-direction:column;transition:transform .3s ease;
    }
    .wh-sidebar.closed{transform:translateX(-100%)}
    .wh-logo{display:flex;align-items:center;gap:10px;padding:0 20px 24px;border-bottom:1px solid ${TD}}
    .wh-logo-icon{width:40px;height:40px;border-radius:12px;background:${G};display:flex;align-items:center;justify-content:center;color:${BK};flex-shrink:0}
    .wh-logo-mark{
      font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:900;
      background:linear-gradient(90deg,${GD} 0%,${G} 35%,${GBR} 50%,${G} 65%,${GD} 100%);
      background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      animation:goldShimmer 3s linear infinite;
    }
    .wh-nav{flex:1;padding:14px 12px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
    .wh-nav-btn{
      display:flex;align-items:center;gap:10px;padding:10px 13px;
      border-radius:10px;cursor:pointer;border:none;background:none;
      color:${TM};font-family:inherit;font-size:.8rem;font-weight:600;
      width:100%;text-align:left;transition:all .16s;letter-spacing:.04em;
      text-transform:uppercase;
    }
    .wh-nav-btn:hover{background:${BGW};color:${G}}
    .wh-nav-btn.active{background:rgba(212,160,23,0.12);color:${G};border-left:2px solid ${G}}
    .wh-nav-btn svg{flex-shrink:0}
    .wh-sidebar-foot{padding:14px 12px;border-top:1px solid ${TD}}
    .wh-profile{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:${BGW}}
    .wh-avatar{width:34px;height:34px;border-radius:50%;background:${G};display:flex;align-items:center;justify-content:center;color:${BK};font-weight:900;font-size:.75rem;font-family:'Syne',sans-serif;flex-shrink:0}

    .wh-main{flex:1;margin-left:258px;padding:28px 32px;overflow-y:auto;max-height:100dvh}
    .wh-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:18px;border-bottom:1px solid ${TD}}
    .wh-page-title{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:900;color:${TX}}
    .wh-page-sub{font-size:.72rem;color:${TM};margin-top:3px;letter-spacing:.1em;text-transform:uppercase}

    .wh-card{
      background:${S3};border:1px solid ${BDR};border-radius:16px;
      padding:20px;transition:border-color .2s;
    }
    .wh-card:hover{border-color:${G}55}
    .wh-card-title{font-size:.7rem;color:${TM};letter-spacing:.16em;text-transform:uppercase;font-weight:600}
    .wh-card-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:${BGW};color:${G}}
    .wh-stat-big{font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:900;color:${G};line-height:1}

    .wh-bar-track{height:6px;background:${TD};border-radius:999px;overflow:hidden;margin-top:10px}
    .wh-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,${GB},${G},${GBR});transition:width .5s}

    .btn-gold{
      background:linear-gradient(135deg,${GB},${G});color:${BK};border:none;
      padding:10px 20px;border-radius:10px;font-family:'Syne',sans-serif;
      font-size:.8rem;font-weight:700;cursor:pointer;letter-spacing:.06em;
      text-transform:uppercase;transition:all .18s;
    }
    .btn-gold:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 6px 20px rgba(212,160,23,0.3)}
    .btn-gold:active{transform:translateY(0)}
    .btn-outline{
      background:transparent;color:${G};border:1px solid ${BDR};
      padding:10px 18px;border-radius:10px;font-family:'Syne',sans-serif;
      font-size:.8rem;font-weight:700;cursor:pointer;letter-spacing:.06em;
      text-transform:uppercase;transition:all .16s;
    }
    .btn-outline:hover{background:${BGW};border-color:${G}}
    .btn-sm{padding:7px 13px;font-size:.72rem}
    .btn-icon{
      width:36px;height:36px;border-radius:9px;background:${S3};border:1px solid ${BDR};
      color:${TM};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;
    }
    .btn-icon:hover{background:${BGW};color:${G};border-color:${G}}

    .wh-input{
      width:100%;padding:10px 13px;border-radius:10px;border:1px solid ${TD};
      background:${S2};color:${TX};font-size:.85rem;font-family:'JetBrains Mono',monospace;
      outline:none;transition:border-color .2s;
    }
    .wh-input:focus{border-color:${G}}
    .wh-input::placeholder{color:${TD}}
    .wh-select{
      width:100%;padding:10px 13px;border-radius:10px;border:1px solid ${TD};
      background:${S2};color:${TX};font-size:.85rem;font-family:'JetBrains Mono',monospace;
      outline:none;cursor:pointer;
    }
    .wh-select option{background:${S1};color:${TX}}
    .wh-label{font-size:.68rem;color:${TM};letter-spacing:.12em;text-transform:uppercase;display:block;margin-bottom:5px}

    .wh-modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
    .wh-modal-box{width:min(420px,100%);max-height:90vh;overflow-y:auto}

    .mood-chip{
      display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;
      border:1px solid ${TD};background:${S2};cursor:pointer;transition:all .16s;
      font-size:.78rem;color:${TM};font-family:'JetBrains Mono',monospace;
    }
    .mood-chip:hover{border-color:${G};color:${G}}
    .mood-chip.active{border-color:${G};background:${BGW};color:${G}}

    .supp-row{
      display:flex;align-items:center;gap:12px;padding:13px;border-radius:12px;
      background:${S2};border:1px solid ${TD};cursor:pointer;transition:all .2s;
    }
    .supp-row:hover{background:${BGW}}
    .supp-row.done{background:rgba(212,160,23,0.08);border-color:${G}}
    .check-circle{
      width:26px;height:26px;border-radius:50%;border:2px solid ${TD};
      display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;
    }
    .check-circle.done{background:${G};border-color:${G};color:${BK}}

    .care-row{
      display:flex;align-items:center;gap:12px;padding:13px;border-radius:12px;
      background:${S2};border:1px solid ${TD};cursor:pointer;transition:all .2s;
    }
    .care-row:hover{background:${BGW}}
    .care-row.done{background:rgba(212,160,23,0.08);border-color:${G}}

    .prog-card{
      padding:18px;border-radius:14px;background:${S2};border:1px solid ${TD};
      transition:all .22s;cursor:pointer;
    }
    .prog-card:hover{border-color:${G}}

    .sym-row{
      display:flex;align-items:center;gap:12px;padding:11px 14px;
      border-radius:11px;background:${S2};border:1px solid ${TD};
    }

    .jrnl-card{
      padding:14px;border-radius:13px;background:${S2};border:1px solid ${TD};
    }

    .water-drop{
      width:36px;height:36px;border-radius:50%;border:2px solid ${TD};
      display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;color:${TM};
    }
    .water-drop.filled{background:${BGW};border-color:${G};color:${G}}
    .water-drop:hover{transform:scale(1.1)}

    .gold-rule{height:1px;background:linear-gradient(90deg,transparent,${G}66,${GBR}88,${G}66,transparent)}
    .gold-badge{
      font-size:.65rem;padding:3px 9px;border-radius:999px;
      background:${BGW};border:1px solid ${BDR};color:${G};
      letter-spacing:.12em;text-transform:uppercase;font-weight:600;
    }
    .insight-block{
      padding:13px 16px;border-radius:11px;background:${S2};border:1px solid ${BDR};
    }
    .insight-label{font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:${G};font-weight:700;margin-bottom:4px}
    .insight-text{font-size:.8rem;color:${TX};line-height:1.6}

    .notif-drop{
      position:absolute;top:48px;right:0;width:300px;background:${S1};
      border:1px solid ${BDR};border-radius:14px;padding:14px;
      box-shadow:0 20px 60px rgba(0,0,0,.7);z-index:300;
    }
    .notif-row{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:9px;background:${S2};margin-bottom:6px}

    @media(max-width:900px){
      .wh-sidebar{transform:translateX(-100%)}
      .wh-sidebar.open{transform:translateX(0)!important}
      .wh-main{margin-left:0;padding:18px 14px}
    }
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   SHARED MICRO-COMPONENTS
══════════════════════════════════════════════════════════ */
function GoldRule() { return <div className="gold-rule" style={{ margin: "14px 0" }} />; }
function CardHead({ title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <span className="wh-card-title">{title}</span>
      {right}
    </div>
  );
}
function Bar({ pct, color }) {
  return (
    <div className="wh-bar-track">
      <div className="wh-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color || undefined }} />
    </div>
  );
}
function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", borderRadius: 9, background: S2 }}>
      <span style={{ fontSize: ".8rem", color: TM }}>{label}</span>
      <span style={{ fontSize: ".8rem", color: color || G, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
function ModalWrap({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div className="wh-modal-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="wh-card wh-modal-box" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: .2 }} onClick={e => e.stopPropagation()}>
          <div style={{ height: 3, background: `linear-gradient(90deg,${GB},${GBR},${GB})`, borderRadius: "2px 2px 0 0", margin: "-20px -20px 18px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.05rem", fontWeight: 800, color: G }}>{title}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: TM, cursor: "pointer" }}><X size={16} /></button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: CYCLE TRACKER
══════════════════════════════════════════════════════════ */
function CyclePage({ cycleDay, setCycleDay, cycleLength, setCycleLength, cycleStartDate, setCycleStartDate }) {
  const phase = getCyclePhase(cycleDay);
  const PhaseIcon = phase.icon;
  const progPct = (cycleDay / cycleLength) * 100;
  const r = 58;
  const circ = 2 * Math.PI * r;
  const dashArr = `${(progPct / 100) * circ} ${circ}`;

  const predictions = [
    { label: "Next Period",    days: cycleLength - cycleDay },
    { label: "Fertile Window", days: Math.max(14 - cycleDay, 0) },
    { label: "Ovulation Peak", days: cycleDay <= 14 ? 14 - cycleDay : cycleLength - cycleDay + 14 },
    { label: "Luteal Start",   days: Math.max(17 - cycleDay, 0) },
  ];

  return (
    <motion.div key="cycle" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      {/* Main cycle ring card */}
      <div className="wh-card" style={{ textAlign: "center", padding: "36px 24px", marginBottom: 20 }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <svg width={140} height={140}>
            <circle cx={70} cy={70} r={r} fill="none" stroke={TD} strokeWidth={9} />
            <circle cx={70} cy={70} r={r} fill="none" stroke={phase.color} strokeWidth={9}
              strokeLinecap="round" strokeDasharray={dashArr}
              style={{ transition: "stroke-dasharray .6s ease" }}
              transform="rotate(-90 70 70)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: 900, color: phase.color }}>{cycleDay}</div>
            <div style={{ fontSize: ".65rem", color: TM, letterSpacing: ".1em", textTransform: "uppercase" }}>of {cycleLength}d</div>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 999, background: `${phase.color}18`, border: `1px solid ${phase.color}44`, marginBottom: 14 }}>
          <PhaseIcon size={14} style={{ color: phase.color }} />
          <span style={{ fontSize: ".8rem", fontWeight: 700, color: phase.color, letterSpacing: ".1em", textTransform: "uppercase" }}>{phase.name} Phase</span>
        </div>

        <div style={{ fontSize: ".82rem", color: TM, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 22px" }}>{phase.tip}</div>

        {/* Phase progress pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 22 }}>
          {[
            { label: "Menstrual",  range: "1–5"  },
            { label: "Follicular", range: "6–13" },
            { label: "Ovulation",  range: "14–16"},
            { label: "Luteal",     range: "17+"  },
          ].map((p, i) => {
            const active = (i === 0 && cycleDay <= 5) || (i === 1 && cycleDay >= 6 && cycleDay <= 13) || (i === 2 && cycleDay >= 14 && cycleDay <= 16) || (i === 3 && cycleDay >= 17);
            return (
              <div key={i} style={{ padding: "9px 6px", borderRadius: 9, background: active ? `${G}18` : S2, border: `1px solid ${active ? G : TD}` }}>
                <div style={{ fontSize: ".68rem", color: active ? G : TM, fontWeight: active ? 700 : 400, letterSpacing: ".06em" }}>{p.label}</div>
                <div style={{ fontSize: ".6rem", color: TD, marginTop: 2 }}>{p.range}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button className="btn-outline btn-sm" onClick={() => setCycleDay(d => Math.max(1, d - 1))}><Minus size={12} /></button>
          <button className="btn-gold btn-sm" onClick={() => setCycleDay(d => Math.min(cycleLength, d + 1))}>+ Next Day</button>
          <button className="btn-outline btn-sm" onClick={() => { setCycleDay(1); setCycleStartDate(new Date().toISOString().split("T")[0]); }}>New Cycle</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Settings */}
        <div className="wh-card">
          <CardHead title="Cycle Settings" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="wh-label">Start Date</label>
              <input className="wh-input" type="date" value={cycleStartDate} onChange={e => {
                setCycleStartDate(e.target.value);
                const diff = Math.floor((Date.now() - new Date(e.target.value)) / 864e5);
                setCycleDay(diff > 0 ? (diff % cycleLength) || 1 : 1);
              }} />
            </div>
            <div>
              <label className="wh-label">Cycle Length: <span style={{ color: G }}>{cycleLength} days</span></label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-outline btn-sm" onClick={() => setCycleLength(l => Math.max(21, l - 1))}><Minus size={12} /></button>
                <div style={{ flex: 1 }}><Bar pct={(cycleLength - 21) / 19 * 100} /></div>
                <button className="btn-outline btn-sm" onClick={() => setCycleLength(l => Math.min(40, l + 1))}><Plus size={12} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Predictions */}
        <div className="wh-card">
          <CardHead title="Predictions" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {predictions.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 9, background: S2 }}>
                <span style={{ fontSize: ".8rem", color: TM }}>{p.label}</span>
                <span style={{ fontSize: ".8rem", color: G, fontWeight: 700 }}>{p.days > 0 ? `In ${p.days}d` : "Today"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: MOOD TRACKER
══════════════════════════════════════════════════════════ */
function MoodPage({ mood, setMood, energy, setEnergy, streak, setStreak, moodHistory, setMoodHistory }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ mood: "Balanced", energy: 70, note: "" });

  const save = () => {
    setMoodHistory(prev => [{ id: Date.now(), date: new Date().toLocaleDateString(), ...form }, ...prev]);
    setMood(form.mood); setEnergy(form.energy); setStreak(s => s + 1);
    setShowModal(false); setForm({ mood: "Balanced", energy: 70, note: "" });
  };
  const avgEnergy = moodHistory.length ? Math.round(moodHistory.reduce((a, m) => a + m.energy, 0) / moodHistory.length) : energy;

  return (
    <motion.div key="mood" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      {/* Current mood card */}
      <div className="wh-card" style={{ marginBottom: 20 }}>
        <CardHead title="How are you feeling today?" right={<span className="gold-badge">🔥 {streak} day streak</span>} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {MOOD_OPTS.map(m => (
            <button key={m.v} className={`mood-chip ${mood === m.v ? "active" : ""}`} onClick={() => setMood(m.v)}>
              <span style={{ fontSize: "1.1rem" }}>{m.e}</span> {m.v}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="wh-label">Energy: <span style={{ color: G }}>{energy}%</span></label>
          <input type="range" min={10} max={100} step={5} value={energy}
            onChange={e => setEnergy(+e.target.value)}
            style={{ width: "100%", accentColor: G }} />
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}><Save size={13} style={{ marginRight: 6 }} />Log Full Entry</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* History */}
        <div className="wh-card">
          <CardHead title="Mood History" right={<span className="gold-badge">{moodHistory.length} entries</span>} />
          {moodHistory.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: TM, fontSize: ".82rem" }}>No entries yet. Start logging!</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {moodHistory.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: S2 }}>
                <span style={{ fontSize: "1.3rem" }}>{MOOD_OPTS.find(m => m.v === h.mood)?.e || "😊"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700 }}>{h.mood}</div>
                  <div style={{ fontSize: ".68rem", color: TM }}>{h.date}</div>
                  {h.note && <div style={{ fontSize: ".7rem", color: TM, marginTop: 2, fontStyle: "italic" }}>{h.note}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: G, fontWeight: 700, fontSize: ".9rem" }}>{h.energy}%</div>
                  <div style={{ fontSize: ".65rem", color: TM }}>energy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patterns */}
        <div className="wh-card">
          <CardHead title="Mood Patterns" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <StatRow label="Current Mood"   value={mood} />
            <StatRow label="Avg Energy"     value={`${avgEnergy}%`} />
            <StatRow label="Best State"     value="Energetic" />
            <StatRow label="Streak"         value={`${streak} days`} />
            <StatRow label="Entries Total"  value={moodHistory.length} />
          </div>
          <GoldRule />
          <div style={{ fontSize: ".78rem", color: TM, lineHeight: 1.6 }}>
            {mood === "Stressed" || mood === "Emotional"
              ? "Try 5-min deep breathing or a short walk. Journaling also helps."
              : energy < 50
              ? "Iron and B-vitamins may support your energy. Ensure 7-8h sleep."
              : "Balanced mood and energy. Keep your current routine!"}
          </div>
        </div>
      </div>

      <ModalWrap show={showModal} onClose={() => setShowModal(false)} title="Log Mood & Energy">
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label className="wh-label">Mood</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {MOOD_OPTS.map(m => (
                <button key={m.v} className={`mood-chip ${form.mood === m.v ? "active" : ""}`} onClick={() => setForm(f => ({ ...f, mood: m.v }))}>
                  {m.e} {m.v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-label">Energy Level: <span style={{ color: G }}>{form.energy}%</span></label>
            <input type="range" min={10} max={100} step={5} value={form.energy}
              onChange={e => setForm(f => ({ ...f, energy: +e.target.value }))}
              style={{ width: "100%", accentColor: G }} />
          </div>
          <div>
            <label className="wh-label">Note</label>
            <textarea className="wh-input" placeholder="How are you feeling?" rows={3}
              style={{ resize: "vertical" }} value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={save}>Save Entry</button>
            <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </ModalWrap>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SYMPTOMS LOG
══════════════════════════════════════════════════════════ */
function SymptomsPage({ symptoms, setSymptoms }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", severity: "mild" });

  const add = () => {
    if (!form.name.trim()) return;
    setSymptoms(prev => [{ id: Date.now(), date: new Date().toLocaleDateString(), logged: true, ...form }, ...prev]);
    setForm({ name: "", severity: "mild" }); setShowModal(false);
  };
  const del = id => setSymptoms(prev => prev.filter(s => s.id !== id));

  return (
    <motion.div key="symptoms" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      <div className="wh-card">
        <CardHead title="Symptoms Log"
          right={<button className="btn-gold btn-sm" onClick={() => setShowModal(true)}><Plus size={12} style={{ marginRight: 4 }} />Log Symptom</button>}
        />

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
          {["severe","moderate","mild","low"].map(sev => (
            <div key={sev} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, background: S2, border: `1px solid ${SEV_COLORS[sev]}33` }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: SEV_COLORS[sev] }}>{symptoms.filter(s => s.severity === sev).length}</div>
              <div style={{ fontSize: ".65rem", color: TM, textTransform: "capitalize" }}>{sev}</div>
            </div>
          ))}
        </div>
        <GoldRule />

        {symptoms.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: TM }}>
            <Thermometer size={36} style={{ color: TD, marginBottom: 12 }} />
            <div>No symptoms logged yet</div>
            <div style={{ fontSize: ".78rem", marginTop: 5 }}>Track daily to spot patterns</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {symptoms.map(sym => (
            <div key={sym.id} className="sym-row">
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: SEV_COLORS[sym.severity] || G, flexShrink: 0 }} />
              <div style={{ flex: 1, fontWeight: 600, fontSize: ".85rem" }}>{sym.name}</div>
              <span style={{ fontSize: ".68rem", padding: "3px 8px", borderRadius: 5, background: `${SEV_COLORS[sym.severity]}18`, color: SEV_COLORS[sym.severity], fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{sym.severity}</span>
              <span style={{ fontSize: ".68rem", color: TM }}>{sym.date}</span>
              <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => del(sym.id)}><X size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      <ModalWrap show={showModal} onClose={() => setShowModal(false)} title="Log Symptom">
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label className="wh-label">Symptom</label>
            <input className="wh-input" placeholder="e.g., Cramps, Headache, Bloating" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="wh-label">Severity</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["low","mild","moderate","severe"].map(s => (
                <button key={s} className={`btn-sm ${form.severity === s ? "btn-gold" : "btn-outline"}`} onClick={() => setForm(f => ({ ...f, severity: s }))} style={{ textTransform: "capitalize", flex: 1 }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={add}>Save</button>
            <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </ModalWrap>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: HORMONE BALANCE
══════════════════════════════════════════════════════════ */
function HormonesPage({ hormones, setHormones, cycleDay }) {
  const phase = getCyclePhase(cycleDay);

  const adjust = (name, delta) => setHormones(prev => prev.map(h => h.name === name ? { ...h, value: Math.min(100, Math.max(0, h.value + delta)) } : h));

  const tips = {
    Estrogen:      "Flaxseeds, soy, leafy greens support healthy estrogen metabolism.",
    Progesterone:  "Magnesium & Vitamin B6 support progesterone. Avoid excess caffeine.",
    Cortisol:      "Deep breathing, adaptogens, and 7-8h sleep reduce cortisol.",
    Serotonin:     "Sunlight, exercise, and tryptophan-rich foods boost serotonin.",
  };

  return (
    <motion.div key="hormones" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      <div className="wh-card" style={{ marginBottom: 20 }}>
        <CardHead title="Hormone Balance Tracker"
          right={<span className="gold-badge">{phase.name} Phase</span>}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {hormones.map(h => (
            <div key={h.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: ".88rem" }}>{h.name}</span>
                  <span style={{ fontSize: ".72rem", color: TM, marginLeft: 8 }}>{tips[h.name]?.split(".")[0]}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => adjust(h.name, -5)}><Minus size={10} /></button>
                  <span style={{ color: G, fontWeight: 700, width: 38, textAlign: "center", fontSize: ".9rem" }}>{h.value}%</span>
                  <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => adjust(h.name, 5)}><Plus size={10} /></button>
                </div>
              </div>
              <Bar pct={h.value} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="wh-card">
          <CardHead title="Hormone Tips" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hormones.map(h => (
              <div key={h.name} className="insight-block">
                <div className="insight-label">{h.name}</div>
                <div className="insight-text">{tips[h.name]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="wh-card">
          <CardHead title="Phase Support" />
          <div className="insight-block" style={{ marginBottom: 10 }}>
            <div className="insight-label">{phase.name} Phase</div>
            <div className="insight-text">{phase.tip}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hormones.map(h => (
              <StatRow key={h.name} label={h.name} value={h.value >= 70 ? "Optimal" : h.value >= 40 ? "Moderate" : "Low"} color={h.value >= 70 ? "#22c55e" : h.value >= 40 ? G : "#ef4444"} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SUPPLEMENTS
══════════════════════════════════════════════════════════ */
function SupplementsPage({ supplements, setSupplements }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", time: "Morning" });

  const toggle = id => setSupplements(prev => prev.map(s => s.id === id ? { ...s, taken: !s.taken } : s));
  const remove = id => setSupplements(prev => prev.filter(s => s.id !== id));
  const add = () => {
    if (!form.name.trim()) return;
    setSupplements(prev => [...prev, { id: Date.now(), ...form, taken: false }]);
    setForm({ name: "", dosage: "", time: "Morning" }); setShowModal(false);
  };

  const taken  = supplements.filter(s => s.taken).length;
  const total  = supplements.length;
  const pct    = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <motion.div key="supplements" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Taken Today",  value: taken,       sub: `of ${total}` },
          { label: "Remaining",    value: total-taken, sub: "pending doses" },
          { label: "Adherence",    value: `${pct}%`,   sub: "today" },
        ].map((s, i) => (
          <div key={i} className="wh-card" style={{ textAlign: "center" }}>
            <div className="wh-card-title" style={{ marginBottom: 8 }}>{s.label}</div>
            <div className="wh-stat-big">{s.value}</div>
            <div style={{ fontSize: ".72rem", color: TM, marginTop: 4 }}>{s.sub}</div>
            {i === 2 && <Bar pct={pct} />}
          </div>
        ))}
      </div>

      <div className="wh-card">
        <CardHead title="Today's Supplements"
          right={<button className="btn-gold btn-sm" onClick={() => setShowModal(true)}><Plus size={12} style={{ marginRight: 4 }} />Add</button>}
        />

        {supplements.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: TM, fontSize: ".82rem" }}>No supplements added. Tap Add to begin.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supplements.map(s => (
            <div key={s.id} className={`supp-row ${s.taken ? "done" : ""}`} onClick={() => toggle(s.id)}>
              <div className={`check-circle ${s.taken ? "done" : ""}`}>{s.taken && <Check size={13} />}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{s.name}</div>
                <div style={{ fontSize: ".72rem", color: TM }}>{s.dosage}</div>
              </div>
              <span style={{ fontSize: ".7rem", background: S3, padding: "4px 9px", borderRadius: 6, color: TM }}>{s.time}</span>
              <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={e => { e.stopPropagation(); remove(s.id); }}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
      </div>

      <ModalWrap show={showModal} onClose={() => setShowModal(false)} title="Add Supplement">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="wh-label">Name</label>
            <input className="wh-input" placeholder="e.g., Vitamin D3" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="wh-label">Dosage</label>
            <input className="wh-input" placeholder="e.g., 2000 IU" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} />
          </div>
          <div>
            <label className="wh-label">Time</label>
            <select className="wh-select" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
              {["Morning","Lunch","Evening","Night"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={add}>Add Supplement</button>
            <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </ModalWrap>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SELF CARE
══════════════════════════════════════════════════════════ */
function SelfCarePage({ selfCare, setSelfCare, water, setWater, sleep, setSleep }) {
  const WATER_GOAL = 8;
  const toggle = id => setSelfCare(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));
  const done = selfCare.filter(a => a.done).length;

  return (
    <motion.div key="selfcare" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      {/* Checklist */}
      <div className="wh-card" style={{ marginBottom: 20 }}>
        <CardHead title="Daily Self-Care Routine" right={<span className="gold-badge">{done}/{selfCare.length} done</span>} />
        <Bar pct={(done / selfCare.length) * 100} />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {selfCare.map(a => (
            <div key={a.id} className={`care-row ${a.done ? "done" : ""}`} onClick={() => toggle(a.id)}>
              <div className={`check-circle ${a.done ? "done" : ""}`}>{a.done && <Check size={13} />}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: ".88rem", color: a.done ? TM : TX }}>{a.name}</div>
                <div style={{ fontSize: ".7rem", color: TM, marginTop: 2 }}>{a.duration} · {a.cat}</div>
              </div>
              {a.done && <Check size={14} style={{ color: G }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Water */}
        <div className="wh-card">
          <CardHead title="Water Intake" right={<div className="wh-card-icon"><Droplets size={16} /></div>} />
          <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", margin: "16px 0" }}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <div key={i} className={`water-drop ${i < water ? "filled" : ""}`} onClick={() => setWater(i + 1 === water ? i : i + 1)}>
                <Droplets size={13} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: ".82rem", color: TM }}>{water}/{WATER_GOAL} glasses</div>
          <Bar pct={(water / WATER_GOAL) * 100} />
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <button className="btn-outline btn-sm" onClick={() => setWater(w => Math.max(0, w - 1))}><Minus size={11} /></button>
            <button className="btn-gold btn-sm" onClick={() => setWater(w => Math.min(WATER_GOAL, w + 1))}>+ Glass</button>
          </div>
        </div>

        {/* Sleep */}
        <div className="wh-card">
          <CardHead title="Sleep Tracker" right={<div className="wh-card-icon"><Moon size={16} /></div>} />
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "3rem", fontWeight: 900, color: G }}>{sleep}h</div>
            <div style={{ fontSize: ".8rem", color: sleep >= 7 ? "#22c55e" : "#f59e0b", marginTop: 4, fontWeight: 600 }}>
              {sleep >= 8 ? "★ Excellent" : sleep >= 7 ? "Good rest" : sleep >= 6 ? "Slightly low" : "⚠ Rest more"}
            </div>
          </div>
          <Bar pct={(sleep / 10) * 100} />
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
            <button className="btn-outline btn-sm" onClick={() => setSleep(h => Math.max(4, Math.round((h - 0.5) * 2) / 2))}><Minus size={11} /></button>
            <span style={{ padding: "6px 14px", color: TM, fontSize: ".78rem" }}>0.5h steps</span>
            <button className="btn-gold btn-sm" onClick={() => setSleep(h => Math.min(12, Math.round((h + 0.5) * 2) / 2))}><Plus size={11} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: PROGRAMS
══════════════════════════════════════════════════════════ */
function ProgramsPage({ programs, setPrograms }) {
  const cont = id => setPrograms(prev => prev.map(p => p.id === id ? { ...p, progress: Math.min(100, p.progress + 10) } : p));
  const reset = id => setPrograms(prev => prev.map(p => p.id === id ? { ...p, progress: 0 } : p));

  return (
    <motion.div key="programs" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      <div className="wh-card">
        <CardHead title="Wellness Programs" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {programs.map(prog => (
            <div key={prog.id} className="prog-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".92rem", marginBottom: 2 }}>{prog.name}</div>
                  <div style={{ fontSize: ".7rem", color: TM }}>{prog.duration}</div>
                </div>
                <span className="gold-badge">{prog.cat}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: ".68rem", color: TM }}>Progress</span>
                <span style={{ fontSize: ".78rem", color: G, fontWeight: 700 }}>{prog.progress}%</span>
              </div>
              <Bar pct={prog.progress} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn-gold btn-sm" style={{ flex: 1 }} onClick={() => cont(prog.id)}><Plus size={11} style={{ marginRight: 4 }} />Continue</button>
                <button className="btn-outline btn-sm" onClick={() => reset(prog.id)}>Reset</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: HEALTH JOURNAL
══════════════════════════════════════════════════════════ */
function JournalPage({ journal, setJournal }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "😊" });

  const add = () => {
    if (!form.title.trim()) return;
    setJournal(prev => [{ id: Date.now(), date: new Date().toLocaleDateString(), ...form }, ...prev]);
    setForm({ title: "", content: "", mood: "😊" }); setShowModal(false);
  };
  const del = id => setJournal(prev => prev.filter(j => j.id !== id));

  return (
    <motion.div key="journal" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      <div className="wh-card">
        <CardHead title="Health Journal"
          right={<button className="btn-gold btn-sm" onClick={() => setShowModal(true)}><Plus size={12} style={{ marginRight: 4 }} />New Entry</button>}
        />

        {journal.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: TM }}>
            <BookOpen size={36} style={{ color: TD, marginBottom: 12 }} />
            <div>No journal entries yet</div>
            <div style={{ fontSize: ".78rem", marginTop: 5 }}>Start writing your health journey</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {journal.map(entry => (
            <div key={entry.id} className="jrnl-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: ".68rem", color: TM, letterSpacing: ".1em" }}>{entry.date}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>{entry.mood}</span>
                  <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => del(entry.id)}><Trash2 size={11} /></button>
                </div>
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: ".95rem", color: G, marginBottom: 6 }}>{entry.title}</div>
              <div style={{ fontSize: ".82rem", color: TX, lineHeight: 1.65 }}>{entry.content}</div>
            </div>
          ))}
        </div>
      </div>

      <ModalWrap show={showModal} onClose={() => setShowModal(false)} title="New Journal Entry">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="wh-label">Title</label>
            <input className="wh-input" placeholder="e.g., Feeling centered today" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="wh-label">Mood</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["😊","😄","😐","😟","😢","😴"].map(m => (
                <div key={m} onClick={() => setForm(f => ({ ...f, mood: m }))} style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${form.mood === m ? G : TD}`, background: form.mood === m ? BGW : S2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", cursor: "pointer", transition: "all .15s" }}>{m}</div>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-label">Content</label>
            <textarea className="wh-input" placeholder="Write about your day..." rows={4} style={{ resize: "vertical", lineHeight: 1.6 }}
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={add}>Save Entry</button>
            <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </ModalWrap>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: INSIGHTS
══════════════════════════════════════════════════════════ */
function InsightsPage({ cycleDay, cycleLength, mood, energy, water, sleep, healthScore, supplements, selfCare, moodHistory, affIdx }) {
  const phase = getCyclePhase(cycleDay);
  const suppPct = supplements.length ? Math.round((supplements.filter(s => s.taken).length / supplements.length) * 100) : 0;
  const carePct = selfCare.length  ? Math.round((selfCare.filter(a => a.done).length  / selfCare.length)  * 100) : 0;
  const WATER_GOAL = 8;
  const aff = AFFIRMATIONS[affIdx % AFFIRMATIONS.length];

  const scores = [
    { label: "Cycle Health",       pct: 85 },
    { label: "Mood & Energy",      pct: energy },
    { label: "Hydration",          pct: Math.round((water / WATER_GOAL) * 100) },
    { label: "Sleep Quality",      pct: Math.round((sleep / 8) * 100) },
    { label: "Supplement Adherence", pct: suppPct },
    { label: "Self-Care Routine",  pct: carePct },
  ];
  const overallScore = Math.round(scores.reduce((a, s) => a + Math.min(s.pct, 100), 0) / scores.length);

  return (
    <motion.div key="insights" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .22 }}>
      {/* Score ring */}
      <div className="wh-card" style={{ textAlign: "center", marginBottom: 20, padding: "30px 24px" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 18 }}>
          <svg width={130} height={130}>
            <circle cx={65} cy={65} r={54} fill="none" stroke={TD} strokeWidth={9} />
            <circle cx={65} cy={65} r={54} fill="none" stroke={G} strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={`${(overallScore / 100) * (2 * Math.PI * 54)} ${2 * Math.PI * 54}`}
              transform="rotate(-90 65 65)"
              style={{ transition: "stroke-dasharray .7s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.9rem", fontWeight: 900, color: G }}>{overallScore}</div>
            <div style={{ fontSize: ".62rem", color: TM, letterSpacing: ".1em" }}>WELLNESS</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: ".95rem", fontWeight: 700, color: G, fontStyle: "italic", maxWidth: 340, margin: "0 auto" }}>
          "{aff}"
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Score breakdown */}
        <div className="wh-card">
          <CardHead title="Score Breakdown" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {scores.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: ".8rem", color: TM }}>{s.label}</span>
                  <span style={{ fontSize: ".8rem", color: G, fontWeight: 700 }}>{Math.min(s.pct, 100)}%</span>
                </div>
                <Bar pct={s.pct} />
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="wh-card">
          <CardHead title="Recommendations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="insight-block">
              <div className="insight-label">{phase.name} Phase</div>
              <div className="insight-text">{phase.tip}</div>
            </div>
            {water < WATER_GOAL - 2 && (
              <div className="insight-block">
                <div className="insight-label">Hydration</div>
                <div className="insight-text">Drink {WATER_GOAL - water} more glasses. Supports hormone balance and energy.</div>
              </div>
            )}
            {sleep < 7 && (
              <div className="insight-block">
                <div className="insight-label">Sleep</div>
                <div className="insight-text">Aim for 7-8h. Sleep regulates cortisol, estrogen, and mood.</div>
              </div>
            )}
            {(mood === "Stressed" || mood === "Emotional") && (
              <div className="insight-block">
                <div className="insight-label">Mood Support</div>
                <div className="insight-text">Deep breathing and journaling can lower cortisol. You're doing great.</div>
              </div>
            )}
            {suppPct < 80 && (
              <div className="insight-block">
                <div className="insight-label">Supplements</div>
                <div className="insight-text">Consistency builds results. Check off today's supplements.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function WomenHealth() {
  useEffect(() => injectCSS(), []);

  const [tab,       setTab]       = useState("cycle");
  const [sidebar,   setSidebar]   = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [affIdx,    setAffIdx]    = useState(0);

  // Cycle
  const [cycleDay,       setCycleDay]       = useState(() => ls.get("wh_cycleDay",       12));
  const [cycleLength,    setCycleLength]    = useState(() => ls.get("wh_cycleLength",    28));
  const [cycleStartDate, setCycleStartDate] = useState(() => ls.get("wh_startDate",      new Date(Date.now() - 12 * 864e5).toISOString().split("T")[0]));
  // Mood
  const [mood,        setMood]        = useState(() => ls.get("wh_mood",        "Balanced"));
  const [energy,      setEnergy]      = useState(() => ls.get("wh_energy",      78));
  const [streak,      setStreak]      = useState(() => ls.get("wh_streak",      18));
  const [moodHistory, setMoodHistory] = useState(() => ls.get("wh_moodHistory", []));
  // Symptoms
  const [symptoms, setSymptoms] = useState(() => ls.get("wh_symptoms", []));
  // Hormones
  const [hormones, setHormones] = useState(() => ls.get("wh_hormones", [
    { name: "Estrogen",      value: 65 },
    { name: "Progesterone",  value: 70 },
    { name: "Cortisol",      value: 45 },
    { name: "Serotonin",     value: 80 },
  ]));
  // Supplements
  const [supplements, setSupplements] = useState(() => ls.get("wh_supplements", DEF_SUPPS));
  // Self care
  const [selfCare, setSelfCare] = useState(() => ls.get("wh_selfCare", DEF_CARE));
  const [water,    setWater]    = useState(() => ls.get("wh_water",    6));
  const [sleep,    setSleep]    = useState(() => ls.get("wh_sleep",    7.5));
  // Programs
  const [programs, setPrograms] = useState(() => ls.get("wh_programs", DEF_PROGS));
  // Journal
  const [journal, setJournal] = useState(() => ls.get("wh_journal", DEF_JOURNAL));

  // Persist all state
  useEffect(() => { ls.set("wh_cycleDay",    cycleDay);       }, [cycleDay]);
  useEffect(() => { ls.set("wh_cycleLength", cycleLength);    }, [cycleLength]);
  useEffect(() => { ls.set("wh_startDate",   cycleStartDate); }, [cycleStartDate]);
  useEffect(() => { ls.set("wh_mood",        mood);           }, [mood]);
  useEffect(() => { ls.set("wh_energy",      energy);         }, [energy]);
  useEffect(() => { ls.set("wh_streak",      streak);         }, [streak]);
  useEffect(() => { ls.set("wh_moodHistory", moodHistory);    }, [moodHistory]);
  useEffect(() => { ls.set("wh_symptoms",    symptoms);       }, [symptoms]);
  useEffect(() => { ls.set("wh_hormones",    hormones);       }, [hormones]);
  useEffect(() => { ls.set("wh_supplements", supplements);    }, [supplements]);
  useEffect(() => { ls.set("wh_selfCare",    selfCare);       }, [selfCare]);
  useEffect(() => { ls.set("wh_water",       water);          }, [water]);
  useEffect(() => { ls.set("wh_sleep",       sleep);          }, [sleep]);
  useEffect(() => { ls.set("wh_programs",    programs);       }, [programs]);
  useEffect(() => { ls.set("wh_journal",     journal);        }, [journal]);

  // Affirmation cycle
  useEffect(() => {
    const t = setInterval(() => setAffIdx(i => (i + 1) % AFFIRMATIONS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Notifications
  const notifications = useMemo(() => {
    const n = [];
    const pend = supplements.filter(s => !s.taken).length;
    if (pend > 0)       n.push({ id: 1, type: "warning", msg: `${pend} supplements pending today` });
    if (water < 6)      n.push({ id: 2, type: "info",    msg: `Drink ${8 - water} more glasses of water` });
    if (energy < 50)    n.push({ id: 3, type: "alert",   msg: "Low energy — consider rest and iron-rich foods" });
    if (!selfCare.some(a => a.done)) n.push({ id: 4, type: "info", msg: "Start your daily self-care routine" });
    return n;
  }, [supplements, water, energy, selfCare]);

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div className="wh-app">
      {/* Sidebar overlay (mobile) */}
      {sidebar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, display: "none" }}
          className="wh-overlay-mobile" onClick={() => setSidebar(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`wh-sidebar ${sidebar ? "" : "closed"}`}>
        {/* Logo */}
        <div className="wh-logo">
          <div className="wh-logo-icon"><Heart size={18} /></div>
          <span className="wh-logo-mark">ManifiX</span>
        </div>

        {/* Nav */}
        <nav className="wh-nav">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className={`wh-nav-btn ${tab === id ? "active" : ""}`}
              onClick={() => { setTab(id); if (window.innerWidth < 900) setSidebar(false); }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="wh-sidebar-foot">
          <div className="wh-profile">
            <div className="wh-avatar">MX</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".82rem", fontWeight: 700, color: TX }}>Wellness Pro</div>
              <div style={{ fontSize: ".68rem", color: TM, marginTop: 1 }}>ManifiX Premium</div>
            </div>
            <Settings size={14} style={{ color: TM, cursor: "pointer" }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="wh-main">
        {/* Top bar */}
        <div className="wh-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="btn-icon" onClick={() => setSidebar(s => !s)} style={{ display: "none" }} id="wh-menu-btn">
              <Menu size={16} />
            </button>
            <div>
              <div className="wh-page-title">{activeTab?.label}</div>
              <div className="wh-page-sub">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Quick stats chips */}
            <span className="gold-badge">🔥 {streak}d</span>
            <span className="gold-badge">💊 {supplements.filter(s=>s.taken).length}/{supplements.length}</span>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button className="btn-icon" onClick={() => setShowNotif(v => !v)}>
                <Bell size={15} />
                {notifications.length > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, width: 17, height: 17, borderRadius: "50%", background: G, color: BK, fontSize: ".58rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {notifications.length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotif && (
                  <motion.div className="notif-drop" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: G, marginBottom: 12, fontSize: ".9rem" }}>Alerts</div>
                    {notifications.map(n => (
                      <div key={n.id} className="notif-row">
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: BGW, color: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {n.type === "alert" ? <AlertCircle size={13} /> : <Info size={13} />}
                        </div>
                        <div style={{ fontSize: ".78rem", color: TX, lineHeight: 1.5 }}>{n.msg}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div style={{ textAlign: "center", padding: "14px 0", color: TM, fontSize: ".8rem" }}>All clear 🌸</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <AnimatePresence mode="wait">
          {tab === "cycle" && (
            <CyclePage cycleDay={cycleDay} setCycleDay={setCycleDay} cycleLength={cycleLength} setCycleLength={setCycleLength} cycleStartDate={cycleStartDate} setCycleStartDate={setCycleStartDate} />
          )}
          {tab === "mood" && (
            <MoodPage mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} streak={streak} setStreak={setStreak} moodHistory={moodHistory} setMoodHistory={setMoodHistory} />
          )}
          {tab === "symptoms" && (
            <SymptomsPage symptoms={symptoms} setSymptoms={setSymptoms} />
          )}
          {tab === "hormones" && (
            <HormonesPage hormones={hormones} setHormones={setHormones} cycleDay={cycleDay} />
          )}
          {tab === "supplements" && (
            <SupplementsPage supplements={supplements} setSupplements={setSupplements} />
          )}
          {tab === "selfcare" && (
            <SelfCarePage selfCare={selfCare} setSelfCare={setSelfCare} water={water} setWater={setWater} sleep={sleep} setSleep={setSleep} />
          )}
          {tab === "programs" && (
            <ProgramsPage programs={programs} setPrograms={setPrograms} />
          )}
          {tab === "journal" && (
            <JournalPage journal={journal} setJournal={setJournal} />
          )}
          {tab === "insights" && (
            <InsightsPage cycleDay={cycleDay} cycleLength={cycleLength} mood={mood} energy={energy} water={water} sleep={sleep} healthScore={85} supplements={supplements} selfCare={selfCare} moodHistory={moodHistory} affIdx={affIdx} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
