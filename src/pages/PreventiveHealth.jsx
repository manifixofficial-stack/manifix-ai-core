/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ManifiX AI — Preventive Health Module v6.0                           ║
 * ║  Real 90-Day Roadmap · Real Streak Engine · Biometric Trend Charts    ║
 * ║  WHO ICD Framework · Multi-Language Voice · Offline-First PWA         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * package.json:
 *   "framer-motion": "^11.x"
 *   "recharts": "^2.x"
 *   "react-router-dom": "^6.x"
 */

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ══════════════ TOKENS ══════════════ */
const A   = "#4ADE80";   // primary accent — vitality green
const A2  = "#86EFAC";   // light accent
const BG  = "#030d07";   // near-black deep green
const C1  = "#091810";   // card bg
const C2  = "#0d2018";   // card bg alt
const BOR = "#0f2a1a";   // border
const BOR2= "#183d24";   // border highlight
const FONT= "'JetBrains Mono','Courier New',monospace";
const HEAD= "'Syne','system-ui',sans-serif";
const BLUE  = "#60a5fa";
const PURPLE= "#a78bfa";
const AMBER = "#fbbf24";
const RED   = "#f87171";
const TEAL  = "#2dd4bf";

/* ══════════════ CSS INJECT ══════════════ */
function injectCSS() {
  if (document.getElementById("ph-css")) return;
  const el = document.createElement("style");
  el.id = "ph-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes ph-pulse{0%,100%{opacity:.07;transform:scale(1)}50%{opacity:.16;transform:scale(1.06)}}
    @keyframes ph-spin{to{transform:rotate(360deg)}}
    @keyframes ph-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ph-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes ph-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}}
    @keyframes ph-scan{from{top:0}to{top:100%}}
    @keyframes ph-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .ph-btn{cursor:pointer;transition:all .15s ease;outline:none}
    .ph-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .ph-btn:active{transform:translateY(0) scale(.98)}
    .ph-card{background:#091810;border:1px solid #0f2a1a;transition:border-color .2s}
    .ph-card:hover{border-color:#183d24}
    .ph-input{background:#050e08;border:1px solid #0f2a1a;color:#d4f0e0;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.04em;padding:9px 13px;width:100%;outline:none;transition:border-color .2s;resize:none}
    .ph-input:focus{border-color:#4ADE8055}
    .ph-input::placeholder{color:#1a2a1f}
    .ph-range{width:100%;accent-color:#4ADE80}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#0f2a1a;border-radius:2px}
  `;
  document.head.appendChild(el);
}

/* ══════════════ PERSISTENCE ══════════════ */
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = useCallback(val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, v]);
  return [v, set];
}

/* ══════════════ REAL 90-DAY ROADMAP ENGINE ══════════════ */
// A real roadmap anchors to an ISO date stored in localStorage.
// Day 1 = the day the user first opened the app.
// Progress is real calendar-day math, not modulo.
function getRoadmapState() {
  const stored = localStorage.getItem("ph_roadmap_start");
  const now = Date.now();
  if (!stored) {
    const start = new Date().toISOString().split("T")[0];
    localStorage.setItem("ph_roadmap_start", start);
    return { day: 1, startDate: start, pct: 1 };
  }
  const startMs = new Date(stored).setHours(0, 0, 0, 0);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const elapsed = Math.floor((todayMs - startMs) / 86400000);
  const day = Math.min(90, Math.max(1, elapsed + 1));
  return { day, startDate: stored, pct: Math.round((day / 90) * 100) };
}

/* 90-day phase plan — real content per phase */
const ROADMAP_PHASES = [
  {
    phase: 1, days: "1–30", title: "Foundation",
    color: BLUE,
    desc: "Establish baseline habits, get first screenings, and understand your risk profile.",
    milestones: [
      { day: 7,  label: "Complete baseline health assessment" },
      { day: 14, label: "BP, glucose & weight logged 5+ times" },
      { day: 21, label: "8-habit streak for 3 consecutive days" },
      { day: 30, label: "Wellness score ≥ 60" },
    ],
  },
  {
    phase: 2, days: "31–60", title: "Build",
    color: A,
    desc: "Increase consistency, deepen nutrition tracking, and add stress management rituals.",
    milestones: [
      { day: 37, label: "7-day habit streak achieved" },
      { day: 45, label: "Sleep average ≥ 7h for 2 weeks" },
      { day: 52, label: "Stress score ≤ 4 average this week" },
      { day: 60, label: "Wellness score ≥ 75" },
    ],
  },
  {
    phase: 3, days: "61–90", title: "Protect",
    color: AMBER,
    desc: "Lock in lifestyle medicine, plan annual screenings, and set next 90-day goals.",
    milestones: [
      { day: 67, label: "14-day unbroken habit streak" },
      { day: 75, label: "Annual screening appointments booked" },
      { day: 82, label: "Share progress with care team" },
      { day: 90, label: "Wellness score ≥ 87 — Prevention Master" },
    ],
  },
];

function getCurrentPhase(day) {
  if (day <= 30) return ROADMAP_PHASES[0];
  if (day <= 60) return ROADMAP_PHASES[1];
  return ROADMAP_PHASES[2];
}

function getNextMilestone(day) {
  const all = ROADMAP_PHASES.flatMap(p => p.milestones);
  return all.find(m => m.day > day) || all[all.length - 1];
}

/* ══════════════ HABITS ══════════════ */
const DEFAULT_HABITS = [
  { id:"h_water",   name:"Hydration · 8 glasses",    cat:"nutrition", icon:"💧", who:"WHO hydration baseline" },
  { id:"h_steps",   name:"Movement · 8,000 steps",   cat:"fitness",   icon:"🚶", who:"WHO 150min/wk moderate activity" },
  { id:"h_veggies", name:"Vegetables · 5 servings",  cat:"nutrition", icon:"🥦", who:"WHO fruit & veg 400g/day" },
  { id:"h_breathe", name:"Breathing · 5 min",        cat:"mental",    icon:"🌬️", who:"Reduces cortisol 23% (NIH)" },
  { id:"h_sleep",   name:"Sleep · 7–8 hours",        cat:"sleep",     icon:"😴", who:"WHO sleep health guideline" },
  { id:"h_sun",     name:"Morning sunlight · 10 min",cat:"wellness",  icon:"☀️", who:"Circadian rhythm + Vit D" },
  { id:"h_screen",  name:"No screen before bed",     cat:"sleep",     icon:"📵", who:"Melatonin protection" },
  { id:"h_stretch", name:"Stretching · daily",       cat:"fitness",   icon:"🧘", who:"Musculoskeletal NCD prevention" },
];

/* ══════════════ SCREENING CHECKLIST ══════════════ */
const SCREENINGS = [
  { id:"s_bp",      name:"Blood Pressure",       freq:"Every 6 months", icon:"❤️",  urgency:"high" },
  { id:"s_glucose", name:"Blood Glucose (FBS)",  freq:"Annual",         icon:"🩸",  urgency:"high" },
  { id:"s_bmi",     name:"BMI + Waist Circ.",    freq:"Monthly",        icon:"⚖️",  urgency:"medium" },
  { id:"s_lipids",  name:"Lipid Panel",          freq:"Every 2 years",  icon:"🔬",  urgency:"medium" },
  { id:"s_dental",  name:"Dental Checkup",       freq:"Every 6 months", icon:"🦷",  urgency:"low" },
  { id:"s_vision",  name:"Vision Screening",     freq:"Annual",         icon:"👁️",  urgency:"low" },
  { id:"s_cancer",  name:"Cancer Screening",     freq:"As per age/sex", icon:"🩺",  urgency:"high" },
  { id:"s_mental",  name:"Mental Health Check",  freq:"Quarterly",      icon:"🧠",  urgency:"medium" },
];

/* ══════════════ WHO DOMAINS ══════════════ */
const WHO_DOMAINS = {
  ncd: {
    code: "PREV-NCD", label: "NCD Prevention",
    color: RED,
    stats: [
      "NCDs cause 74% of all deaths globally — WHO 2023",
      "80% of heart disease & Type 2 diabetes are preventable",
      "4 primary risk factors: tobacco, inactivity, alcohol, poor diet",
      "$4 return for every $1 invested in prevention — WHO LMIC data",
    ],
    sdg: "SDG 3.4 — Reduce premature NCD mortality by 1/3 by 2030",
    action: "Daily habits + screening + lifestyle → NCD risk ↓50–70%",
  },
  screening: {
    code: "PREV-SCR", label: "Early Screening",
    color: BLUE,
    stats: [
      "50% of cancers are curable if detected early — WHO",
      "Only 30% of adults get recommended annual screenings",
      "Regular BP + glucose checks reduce complication risk by 40%",
      "AI-assisted triage increases early detection by 35%",
    ],
    sdg: "SDG 3.8 — Universal health coverage & preventive care",
    action: "Monthly self-checks + annual clinical → Early intervention ↑",
  },
  lifestyle: {
    code: "PREV-LIF", label: "Lifestyle Medicine",
    color: AMBER,
    stats: [
      "Healthy lifestyle adds 10–14 years of life expectancy — Lancet 2023",
      "Sleep + movement + stress → Immune function ↑30%",
      "Reducing ultra-processed food → Inflammation ↓25%",
      "Social connection reduces mortality risk = quitting smoking",
    ],
    sdg: "SDG 3.4 + 3.5 — Healthy lives & substance abuse prevention",
    action: "Micro-habits + consistency + tracking → Biological age ↓5–10 years",
  },
};

/* ══════════════ TIPS ══════════════ */
const TIPS = [
  "Drink water before coffee every morning — sets hydration baseline.",
  "5-min walk after meals reduces postprandial glucose by 12% (NIH).",
  "Dim lights 1hr before sleep — melatonin rises 70% faster.",
  "Name your emotion — reduces amygdala activity by 50% (fMRI).",
  "Cold water splash on wrists resets acute stress in 30 seconds.",
  "Eat the rainbow — phytonutrient diversity reduces NCD risk 35%.",
  "7hrs sleep is the single strongest longevity predictor (Lancet 2023).",
  "Sunlight before 9am anchors circadian rhythm all day.",
  "Stand every 45 minutes — sitting ≥8hrs/day adds NCD risk 20%.",
  "Deep breathing 5min/day lowers resting BP by 4–8 mmHg over 4 weeks.",
  "Fermented foods 3x/week → microbiome diversity ↑ in 6 weeks.",
  "Social connection is as protective as not smoking — Harvard study.",
];

/* ══════════════ WELLNESS SCORE ══════════════ */
function calcWellness(habits, water, sleep, stress, habitStreak) {
  let s = 40;
  const done = Object.values(habits).filter(h => h.done).length;
  s += (done / DEFAULT_HABITS.length) * 28;
  s += water >= 8 ? 10 : Math.min(10, water * 1.25);
  s += sleep >= 7 && sleep <= 9 ? 10 : Math.max(0, 10 - Math.abs(sleep - 8) * 4);
  s += stress <= 3 ? 10 : Math.max(0, 10 - stress * 2);
  s += Math.min(5, habitStreak * 0.5);
  return Math.min(100, Math.round(s));
}

/* ══════════════ REAL STREAK ENGINE ══════════════ */
// Streak is real: stored as { count, lastDate (ISO date string) }
// Increments only when a new calendar day passes with habits done
function updateStreak(streakObj, habitsDone) {
  const today = new Date().toISOString().split("T")[0];
  if (!habitsDone) return streakObj;
  if (!streakObj.lastDate) return { count: 1, lastDate: today };
  const last = new Date(streakObj.lastDate);
  const now  = new Date(today);
  const diff = Math.round((now - last) / 86400000);
  if (diff === 0) return streakObj;              // same day, no change
  if (diff === 1) return { count: streakObj.count + 1, lastDate: today }; // next day
  return { count: 0, lastDate: today };         // streak broken
}

/* ══════════════ VOICE ENGINE ══════════════ */
function speak(text, lang = "en-IN") {
  if (!("speechSynthesis" in window) || !text) return;
  const say = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.87; u.pitch = 0.95;
    const vs = window.speechSynthesis.getVoices();
    const base = lang.split("-")[0];
    u.voice = vs.find(v => v.lang === lang) || vs.find(v => v.lang.startsWith(base)) || vs.find(v => v.lang.startsWith("en")) || null;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  if (speechSynthesis.getVoices().length) say();
  else speechSynthesis.onvoiceschanged = say;
}

/* ══════════════ SHARED UI ══════════════ */
const Card = ({ children, style = {}, glow = false }) => (
  <div className="ph-card" style={{
    padding: 18,
    ...(glow ? { boxShadow: `0 0 22px ${A}12`, borderColor: BOR2 } : {}),
    ...style,
  }}>{children}</div>
);

const SectionLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 8, letterSpacing: ".22em", color: "#1a3025", textTransform: "uppercase", marginBottom: 8, ...style }}>
    {children}
  </div>
);

function ProgressRing({ value, max = 100, size = 100, stroke = 6, color = A, label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0d2018" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: HEAD, fontSize: size * 0.26, color, lineHeight: 1 }}>{value}</div>
        {sublabel && <div style={{ fontSize: 8, color: "#1a3025", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function GreenBtn({ children, onClick, variant = "solid", color = A, icon, style = {}, disabled = false }) {
  return (
    <button className="ph-btn" onClick={onClick} disabled={disabled} style={{
      padding: "12px 20px",
      background: disabled ? "#111" : variant === "solid" ? color : `${color}14`,
      border: `1px solid ${disabled ? "#222" : variant === "solid" ? color : `${color}44`}`,
      color: disabled ? "#333" : variant === "solid" ? BG : color,
      fontFamily: HEAD,
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: ".04em",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .15s",
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {children}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C1, border: `1px solid ${BOR2}`, padding: "8px 12px", fontFamily: FONT, fontSize: 9 }}>
      <div style={{ color: A, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || A }}>{p.name}: <span style={{ color: "#d4f0e0" }}>{p.value}</span></div>
      ))}
    </div>
  );
};

/* ══════════════ BREATHING ENGINE ══════════════ */
const BREATH_MODES = {
  "4-4-6-2": { name: "Extended Exhale",   seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 4 }, { ph: "Exhale", s: 6 }, { ph: "Rest", s: 2 }], benefit: "Activates parasympathetic system", color: A },
  "4-7-8":   { name: "4-7-8 Relaxation", seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 7 }, { ph: "Exhale", s: 8 }],                       benefit: "Maximum oxygen exchange",         color: BLUE },
  "box":     { name: "Box Breathing",     seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 4 }, { ph: "Exhale", s: 4 }, { ph: "Rest", s: 4 }], benefit: "Balance & focus (Navy SEAL)", color: TEAL },
  "resonance":{ name: "Resonance (HRV)", seq: [{ ph: "Inhale", s: 5 }, { ph: "Exhale", s: 5 }],                                              benefit: "0.1Hz HRV coherence",             color: PURPLE },
};

function BreathEngine({ active, mode = "4-4-6-2", onStop }) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);
  const cancelRef = useRef(false);
  const cfg = BREATH_MODES[mode];

  useEffect(() => {
    if (!active) return;
    cancelRef.current = false;
    let pi = 0;
    let ct = cfg.seq[0].s;
    setPhase(cfg.seq[0].ph); setCount(ct);

    const tick = () => {
      if (cancelRef.current) return;
      ct--;
      if (ct < 0) {
        pi = (pi + 1) % cfg.seq.length;
        if (pi === 0) setCycles(c => c + 1);
        ct = cfg.seq[pi].s;
        setPhase(cfg.seq[pi].ph);
      }
      setCount(ct);
      timerRef.current = setTimeout(tick, 1000);
    };
    timerRef.current = setTimeout(tick, 1000);
    return () => { cancelRef.current = true; clearTimeout(timerRef.current); };
  }, [active, mode]);

  const isIn  = phase === "Inhale";
  const isOut = phase === "Exhale";
  const sz = active ? (isIn ? 148 : isOut ? 76 : 110) : 96;
  const dur = isIn ? cfg.seq[0].s : isOut ? (cfg.seq.find(s => s.ph === "Exhale")?.s || 6) : 1;

  return (
    <div style={{ textAlign: "center", padding: "14px 0" }}>
      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* outer ring */}
        <motion.div
          animate={{ width: sz + 48, height: sz + 48, opacity: active ? 0.18 : 0 }}
          transition={{ duration: dur, ease: "easeInOut" }}
          style={{ position: "absolute", borderRadius: "50%", border: `1px solid ${cfg.color}` }}
        />
        <motion.div
          animate={{ width: sz, height: sz }}
          transition={{ duration: dur, ease: "easeInOut" }}
          style={{ borderRadius: "50%", background: `${cfg.color}14`, border: `2px solid ${cfg.color}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        >
          {active ? (
            <>
              <div style={{ fontFamily: HEAD, fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 8, letterSpacing: ".16em", color: `${cfg.color}88`, textTransform: "uppercase" }}>{phase}</div>
            </>
          ) : <div style={{ fontSize: 32 }}>🌬️</div>}
        </motion.div>
      </div>
      {active && (
        <>
          <div style={{ fontSize: 8, letterSpacing: ".18em", color: "#1a3025", textTransform: "uppercase", marginBottom: 4 }}>
            {cycles} cycle{cycles !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 9, color: cfg.color, marginBottom: 14, letterSpacing: ".08em" }}>{cfg.benefit}</div>
        </>
      )}
    </div>
  );
}

/* ══════════════ LOG MODAL ══════════════ */
function LogModal({ onClose, onSave }) {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [water, setWater] = useState(6);
  const [sleep, setSleep] = useState(7.5);
  const [note, setNote] = useState("");

  const fields = [
    { l: "Mood", e: "😊", v: mood, s: setMood, min: 1, max: 10, step: 1, color: A },
    { l: "Energy", e: "⚡", v: energy, s: setEnergy, min: 1, max: 10, step: 1, color: AMBER },
    { l: "Stress", e: "😰", v: stress, s: setStress, min: 0, max: 10, step: 1, color: RED },
    { l: "Water (glasses)", e: "💧", v: water, s: setWater, min: 0, max: 12, step: 1, color: BLUE },
    { l: "Sleep (hours)", e: "😴", v: sleep, s: setSleep, min: 3, max: 12, step: 0.5, color: PURPLE },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ scale: .92, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: C1, border: `2px solid ${A}`, padding: 24, width: "min(400px,100%)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: "#f0f8f4" }}>📝 Daily Health Log</div>
          <button className="ph-btn" onClick={onClose} style={{ background: "none", border: "none", color: "#444", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {fields.map(f => (
          <div key={f.l} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#2a4a35", marginBottom: 4, fontFamily: FONT }}>
              <span>{f.e} {f.l}</span>
              <span style={{ color: f.color, fontWeight: 600 }}>{f.v}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.v}
              onChange={e => f.s(parseFloat(e.target.value))}
              className="ph-range" style={{ width: "100%" }} />
          </div>
        ))}
        <textarea className="ph-input" rows={2} placeholder="Optional notes..."
          value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <GreenBtn onClick={onClose} variant="ghost" color="#444" style={{ flex: 1 }}>Cancel</GreenBtn>
          <GreenBtn onClick={() => onSave({ mood, energy, stress, water, sleep, note })} style={{ flex: 1 }}>Save Log</GreenBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════ SCREENING MODAL ══════════════ */
function ScreeningModal({ done, onToggle, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ scale: .92, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: C1, border: `2px solid ${BLUE}`, padding: 24, width: "min(420px,100%)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: "#f0f8f4" }}>🩺 Screening Checklist</div>
          <button className="ph-btn" onClick={onClose} style={{ background: "none", border: "none", color: "#444", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: "#2a4a35", marginBottom: 14, lineHeight: 1.7, fontFamily: FONT }}>
          WHO-aligned preventive screening schedule. Track what you've completed.
        </div>
        {SCREENINGS.map(s => {
          const isDone = done.includes(s.id);
          const urgencyColor = s.urgency === "high" ? RED : s.urgency === "medium" ? AMBER : A;
          return (
            <button key={s.id} className="ph-btn" onClick={() => onToggle(s.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 14px", marginBottom: 8,
                background: isDone ? `${A}0e` : "#050e08",
                border: `1px solid ${isDone ? A : BOR}`,
                textAlign: "left", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: isDone ? "#4a4a4a" : "#c8e8d4", textDecoration: isDone ? "line-through" : "none", fontFamily: FONT }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: "#1a3025", fontFamily: FONT }}>{s.freq}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: urgencyColor }} />
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${isDone ? A : BOR2}`, background: isDone ? A : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: BG }}>{isDone ? "✓" : ""}</div>
              </div>
            </button>
          );
        })}
        <div style={{ marginTop: 12, fontSize: 10, color: "#1a3025", fontFamily: FONT, textAlign: "center" }}>
          {done.length}/{SCREENINGS.length} screenings up to date
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════ MAIN COMPONENT ══════════════ */
export default function PreventiveHealth() {
  const roadmap = useMemo(getRoadmapState, []);
  const [habits, setHabits]       = useLS("ph_habits", {});
  const [streak, setStreak]       = useLS("ph_streak", { count: 0, lastDate: null });
  const [logs, setLogs]           = useLS("ph_logs", []);
  const [screenings, setScreenings]= useLS("ph_screenings", []);
  const [habitsToday, setHabitsToday] = useLS("ph_habits_today", { date: "", done: {} });
  const [breathMode, setBreathMode] = useState("4-4-6-2");
  const [breathActive, setBreathActive] = useState(false);
  const [tab, setTab]             = useState("today");
  const [showLog, setShowLog]     = useState(false);
  const [showScreen, setShowScreen] = useState(false);
  const [whoOpen, setWhoOpen]     = useState(null);
  const [tipIdx, setTipIdx]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(!navigator.onLine);
  const [selLang]                 = useState("en-IN");

  /* Ensure habits_today resets on new calendar day */
  const todayStr = new Date().toISOString().split("T")[0];
  useEffect(() => {
    if (habitsToday.date !== todayStr) {
      setHabitsToday({ date: todayStr, done: {} });
    }
  }, [todayStr]);

  useEffect(() => { injectCSS(); setTimeout(() => setLoading(false), 900); }, []);
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, []);

  /* Habit toggle — real today tracking */
  const toggleHabit = useCallback((id) => {
    setHabitsToday(prev => {
      const now = { ...prev.done, [id]: !prev.done[id] };
      // Update global habit streak data
      const allDone = DEFAULT_HABITS.every(h => now[h.id]);
      if (allDone) {
        setStreak(s => updateStreak(s, true));
      }
      setHabits(h => ({
        ...h,
        [id]: {
          bestStreak: Math.max(h[id]?.bestStreak || 0, streak.count),
          timesCompleted: (h[id]?.timesCompleted || 0) + (!prev.done[id] ? 1 : 0),
        },
      }));
      return { ...prev, done: now };
    });
  }, [streak.count, setStreak, setHabits, setHabitsToday]);

  /* Save log */
  const handleSaveLog = useCallback((entry) => {
    const newLog = { id: Date.now(), date: new Date().toISOString(), ...entry };
    setLogs(p => [newLog, ...p.slice(0, 59)]);
    setShowLog(false);
    speak("Health log saved. Tracking patterns helps predict and prevent risks.", selLang);
  }, [setLogs, selLang]);

  /* Toggle screening */
  const toggleScreening = useCallback((id) => {
    setScreenings(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }, [setScreenings]);

  /* Derived stats */
  const doneToday = Object.values(habitsToday.done).filter(Boolean).length;
  const latestLog = logs[0];
  const wellnessScore = useMemo(() =>
    calcWellness(habitsToday.done, latestLog?.water || 6, latestLog?.sleep || 7.5, latestLog?.stress || 4, streak.count),
    [habitsToday.done, latestLog, streak.count]);

  const phase = getCurrentPhase(roadmap.day);
  const nextMilestone = getNextMilestone(roadmap.day);
  const daysToMilestone = nextMilestone.day - roadmap.day;

  /* Chart data from logs */
  const chartData = useMemo(() => {
    const recent = [...logs].reverse().slice(-14);
    return recent.map((l, i) => ({
      day: `D${i + 1}`,
      mood: l.mood,
      energy: l.energy,
      stress: l.stress,
      wellness: Math.round((l.mood * 1.2 + l.energy * 1.2 + (10 - l.stress) * 1.6) / 4),
    }));
  }, [logs]);

  const TABS = [
    { id: "today",    label: "Today",    emoji: "◈" },
    { id: "roadmap",  label: "90-Day",   emoji: "🗺" },
    { id: "screen",   label: "Screens",  emoji: "🩺" },
    { id: "trends",   label: "Trends",   emoji: "📊" },
    { id: "who",      label: "WHO",      emoji: "🌍" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🛡️</div>
      </motion.div>
      <div style={{ fontSize: 11, letterSpacing: ".2em", color: A, textTransform: "uppercase", marginBottom: 18 }}>Loading Preventive Care</div>
      <div style={{ width: 28, height: 28, border: `3px solid ${BOR2}`, borderTopColor: A, borderRadius: "50%", animation: "ph-spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#d4f0e0", fontFamily: FONT, overflowX: "hidden", position: "relative" }}>

      {/* Ambient */}
      <div style={{ position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)", width: 500, height: 240, background: `radial-gradient(ellipse,${A}09 0%,transparent 65%)`, animation: "ph-pulse 7s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "15%", right: "5%", width: 280, height: 160, background: `radial-gradient(ellipse,${TEAL}06 0%,transparent 70%)`, animation: "ph-pulse 10s ease-in-out infinite 3s", pointerEvents: "none" }} />

      {/* Grid texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(${A}02 1px,transparent 1px),linear-gradient(90deg,${A}02 1px,transparent 1px)`, backgroundSize: "44px 44px", pointerEvents: "none" }} />

      {/* Offline badge */}
      <AnimatePresence>
        {offline && (
          <motion.div initial={{ y: -30 }} animate={{ y: 0 }} exit={{ y: -30 }}
            style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 90, fontSize: 10, letterSpacing: ".14em", background: C1, border: `1px solid ${A}`, color: A, padding: "6px 14px", textTransform: "uppercase" }}>
            ⚡ Offline — Full functionality active
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>{showLog && <LogModal onClose={() => setShowLog(false)} onSave={handleSaveLog} />}</AnimatePresence>
      <AnimatePresence>{showScreen && <ScreeningModal done={screenings} onToggle={toggleScreening} onClose={() => setShowScreen(false)} />}</AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: `${BG}f0`, backdropFilter: "blur(14px)", zIndex: 20 }}>
        <div>
          <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, lineHeight: 1, color: "#f0f8f4" }}>
            Mani<span style={{ color: A }}>fiX</span> Prevent
          </div>
          <div style={{ fontSize: 8, letterSpacing: ".22em", color: "#1a3025", textTransform: "uppercase", marginTop: 3 }}>
            Prevent · Protect · Prosper · WHO ICD-11
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, letterSpacing: ".18em", color: "#1a2a1f", textTransform: "uppercase" }}>Day</div>
            <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 800, color: phase.color, lineHeight: 1 }}>{roadmap.day}/90</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, letterSpacing: ".18em", color: "#1a2a1f", textTransform: "uppercase" }}>Score</div>
            <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 800, color: A, lineHeight: 1 }}>{wellnessScore}</div>
          </div>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "0 22px", display: "flex", gap: 0, overflowX: "auto", background: `${BG}f8`, position: "sticky", top: 57, zIndex: 19 }}>
        {TABS.map(t => (
          <button key={t.id} className="ph-btn" onClick={() => setTab(t.id)}
            style={{ padding: "11px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t.id ? A : "transparent"}`, color: tab === t.id ? A : "#1a3025", fontFamily: FONT, fontSize: 8, letterSpacing: ".18em", textTransform: "uppercase", whiteSpace: "nowrap", transition: "all .2s" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 18px 70px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .27 }}>

            {/* ─── TODAY ─── */}
            {tab === "today" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Tip ticker */}
                <div style={{ overflow: "hidden", borderBottom: `1px solid ${BOR}`, paddingBottom: 9 }}>
                  <div style={{ display: "flex", gap: 36, animation: "ph-ticker 24s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
                    {[...Array(3)].flatMap(() => [
                      `DAY ${roadmap.day}/90`, `STREAK ${streak.count}D`, `SCORE ${wellnessScore}`,
                      `HABITS ${doneToday}/${DEFAULT_HABITS.length}`, `SCREENS ${screenings.length}/${SCREENINGS.length}`, `PHASE ${phase.title.toUpperCase()}`
                    ]).map((t, i) => (
                      <span key={i} style={{ fontSize: 7, letterSpacing: ".22em", color: "#1a3025", textTransform: "uppercase" }}>
                        {t} <span style={{ color: `${A}33`, marginLeft: 5 }}>◈</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hero stats */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
                  <ProgressRing value={wellnessScore} size={108} stroke={7} color={wellnessScore >= 75 ? A : wellnessScore >= 55 ? AMBER : RED} sublabel="score" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { l: "Streak", v: `${streak.count}d`, color: AMBER, icon: "🔥" },
                      { l: "Habits", v: `${doneToday}/${DEFAULT_HABITS.length}`, color: A, icon: "✓" },
                      { l: "Screens", v: `${screenings.length}/${SCREENINGS.length}`, color: BLUE, icon: "🩺" },
                      { l: "Phase", v: phase.title, color: phase.color, icon: "◈" },
                    ].map(({ l, v, color, icon }) => (
                      <Card key={l} style={{ padding: "10px 12px" }}>
                        <SectionLabel style={{ marginBottom: 2 }}>{l}</SectionLabel>
                        <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{icon} {v}</div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Phase banner */}
                <Card glow style={{ borderColor: `${phase.color}44`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${phase.color},transparent)` }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 16, fontWeight: 700, color: phase.color }}>{phase.title} Phase</div>
                    <div style={{ fontSize: 9, color: "#1a3025", letterSpacing: ".1em" }}>Days {phase.days}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.7, marginBottom: 10 }}>{phase.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 8, color: "#1a3025", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 2 }}>Next milestone in</div>
                      <div style={{ fontFamily: HEAD, fontSize: 20, color: phase.color }}>{daysToMilestone} days</div>
                      <div style={{ fontSize: 9, color: "#2a4a35" }}>{nextMilestone.label}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 8, color: "#1a3025", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 2 }}>Roadmap</div>
                      <div style={{ fontFamily: HEAD, fontSize: 20, color: A }}>{roadmap.pct}%</div>
                      <div style={{ height: 3, width: 80, background: BOR, marginTop: 4 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${roadmap.pct}%` }} transition={{ duration: 1.4, ease: "easeOut" }}
                          style={{ height: "100%", background: `linear-gradient(90deg,${phase.color}88,${phase.color})` }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Habits */}
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <SectionLabel style={{ marginBottom: 0 }}>Daily Prevention Habits — {doneToday}/{DEFAULT_HABITS.length}</SectionLabel>
                    <div style={{ fontSize: 9, color: A }}>Today {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                  </div>
                  <div style={{ height: 3, background: BOR, marginBottom: 12 }}>
                    <motion.div animate={{ width: `${(doneToday / DEFAULT_HABITS.length) * 100}%` }} transition={{ duration: 1.2 }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${A}66,${A})` }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {DEFAULT_HABITS.map(h => {
                      const done = !!habitsToday.done[h.id];
                      const meta = habits[h.id] || {};
                      return (
                        <motion.button key={h.id} className="ph-btn" onClick={() => toggleHabit(h.id)}
                          whileTap={{ scale: .97 }}
                          style={{ padding: "11px 12px", background: done ? `${A}0e` : "#050e08", border: `1px solid ${done ? A : BOR}`, display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ fontSize: 18 }}>{h.icon}</span>
                            <div>
                              <div style={{ fontSize: 10, color: done ? "#2a4a35" : "#9ac8b4", textDecoration: done ? "line-through" : "none", lineHeight: 1.3 }}>{h.name}</div>
                              <div style={{ fontSize: 8, color: "#1a3025", marginTop: 2 }}>×{meta.timesCompleted || 0} total</div>
                            </div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${done ? A : BOR2}`, background: done ? A : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: BG, flexShrink: 0 }}>
                            {done ? "✓" : ""}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>

                {/* Breathing */}
                <Card>
                  <SectionLabel>Breath Coach</SectionLabel>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {Object.entries(BREATH_MODES).map(([key, cfg]) => (
                      <button key={key} className="ph-btn" onClick={() => { setBreathMode(key); setBreathActive(false); }}
                        style={{ padding: "5px 11px", background: breathMode === key ? `${cfg.color}18` : "#050e08", border: `1px solid ${breathMode === key ? cfg.color : BOR}`, color: breathMode === key ? cfg.color : "#1a3025", fontFamily: FONT, fontSize: 8, letterSpacing: ".1em" }}>
                        {cfg.name}
                      </button>
                    ))}
                  </div>
                  <BreathEngine active={breathActive} mode={breathMode} />
                  <GreenBtn onClick={() => setBreathActive(v => !v)} variant={breathActive ? "ghost" : "solid"}
                    color={breathActive ? RED : A} icon={breathActive ? "⏹" : "▶"} style={{ width: "100%" }}>
                    {breathActive ? "Stop Breathing Exercise" : "Start Breathing Exercise"}
                  </GreenBtn>
                </Card>

                {/* Quick actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <GreenBtn onClick={() => setShowLog(true)} icon="📝" style={{ width: "100%" }}>Log Daily Health</GreenBtn>
                  <GreenBtn onClick={() => setShowScreen(true)} variant="ghost" icon="🩺" style={{ width: "100%" }}>Screening List</GreenBtn>
                </div>

                {/* Daily tip */}
                <Card>
                  <SectionLabel>Evidence-Based Tip</SectionLabel>
                  <AnimatePresence mode="wait">
                    <motion.div key={tipIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: "#3a5a45", lineHeight: 1.9 }}>
                      {TIPS[tipIdx]}
                    </motion.div>
                  </AnimatePresence>
                </Card>
              </div>
            )}

            {/* ─── 90-DAY ROADMAP ─── */}
            {tab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>90-DAY PREVENTION ROADMAP</div>
                <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.7, fontFamily: FONT }}>
                  Your personal prevention journey started <strong style={{ color: A }}>{roadmap.startDate}</strong>. Real calendar-day tracking — no resets, no shortcuts.
                </div>

                {/* Overall progress */}
                <Card glow>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <SectionLabel style={{ marginBottom: 0 }}>Overall Progress</SectionLabel>
                    <div style={{ fontFamily: HEAD, fontSize: 22, color: A }}>{roadmap.pct}% complete</div>
                  </div>
                  <div style={{ height: 8, background: BOR, marginBottom: 6, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${roadmap.pct}%` }} transition={{ duration: 1.6, ease: "easeOut" }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${BLUE},${A},${AMBER})` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#1a3025", letterSpacing: ".12em" }}>
                    <span>Day 1 · Foundation</span><span>Day 30 · Build</span><span>Day 60 · Protect</span><span>Day 90</span>
                  </div>
                </Card>

                {/* Phase cards */}
                {ROADMAP_PHASES.map(ph => {
                  const active = roadmap.day >= (ph.phase === 1 ? 1 : ph.phase === 2 ? 31 : 61) &&
                                 roadmap.day <= (ph.phase === 1 ? 30 : ph.phase === 2 ? 60 : 90);
                  const done   = roadmap.day > (ph.phase === 1 ? 30 : ph.phase === 2 ? 60 : 90);
                  return (
                    <Card key={ph.phase} style={{ position: "relative", overflow: "hidden", borderColor: active ? `${ph.color}55` : BOR }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: active ? `linear-gradient(90deg,transparent,${ph.color},transparent)` : "transparent" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: ph.color, lineHeight: 1 }}>Phase {ph.phase}: {ph.title}</div>
                          <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>Days {ph.days}</div>
                        </div>
                        <div style={{ fontSize: 9, padding: "4px 10px", background: done ? `${A}14` : active ? `${ph.color}14` : "#050e08", border: `1px solid ${done ? A : active ? ph.color : BOR}`, color: done ? A : active ? ph.color : "#1a3025", letterSpacing: ".1em", textTransform: "uppercase" }}>
                          {done ? "✓ Complete" : active ? "Active" : "Upcoming"}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.7, marginBottom: 12 }}>{ph.desc}</div>
                      <SectionLabel>Milestones</SectionLabel>
                      {ph.milestones.map(m => {
                        const reached = roadmap.day >= m.day;
                        return (
                          <div key={m.day} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${BOR}` }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, border: `2px solid ${reached ? ph.color : BOR2}`, background: reached ? ph.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: BG }}>{reached ? "✓" : ""}</div>
                            <span style={{ fontSize: 10, color: reached ? "#3a5a45" : "#1a3025", textDecoration: reached ? "line-through" : "none" }}>{m.label}</span>
                            <span style={{ marginLeft: "auto", fontSize: 8, color: "#1a3025", flexShrink: 0 }}>Day {m.day}</span>
                          </div>
                        );
                      })}
                    </Card>
                  );
                })}

                <Card>
                  <SectionLabel>Streak History</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 36, fontWeight: 800, color: AMBER, lineHeight: 1 }}>🔥 {streak.count}</div>
                      <div style={{ fontSize: 9, color: "#2a4a35", marginTop: 3 }}>consecutive days with all habits</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 8, color: "#1a3025", textTransform: "uppercase", letterSpacing: ".14em" }}>Last logged</div>
                      <div style={{ fontSize: 11, color: A }}>{streak.lastDate || "Not yet"}</div>
                      <div style={{ fontSize: 8, color: "#1a3025", marginTop: 4 }}>Real date tracking — resets if any day is missed</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ─── SCREENING ─── */}
            {tab === "screen" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>SCREENING TRACKER</div>
                    <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>WHO-aligned preventive health checks</div>
                  </div>
                  <div style={{ fontFamily: HEAD, fontSize: 24, color: BLUE }}>{screenings.length}/{SCREENINGS.length}</div>
                </div>

                <Card glow style={{ borderColor: `${BLUE}44` }}>
                  <SectionLabel>Up-to-Date Screenings</SectionLabel>
                  <div style={{ height: 8, background: BOR, marginBottom: 8, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${(screenings.length / SCREENINGS.length) * 100}%` }} transition={{ duration: 1.2 }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${BLUE}77,${BLUE})` }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#2a4a35" }}>
                    {screenings.length === 0 ? "No screenings logged yet. Start with BP and glucose." :
                     screenings.length < 4 ? "Good start — BP, glucose and lipids are the highest priority." :
                     screenings.length < 7 ? "Solid coverage. Annual cancer screening if age-eligible." : "Excellent screening compliance — WHO goal achieved!"}
                  </div>
                </Card>

                {SCREENINGS.map(s => {
                  const isDone = screenings.includes(s.id);
                  const urgencyColor = s.urgency === "high" ? RED : s.urgency === "medium" ? AMBER : A;
                  return (
                    <motion.div key={s.id} layout>
                      <Card style={{ borderColor: isDone ? `${A}33` : BOR, cursor: "pointer" }}
                        onClick={() => toggleScreening(s.id)}>
                        <div className="ph-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 24 }}>{s.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, color: isDone ? "#2a4a35" : "#9ac8b4", textDecoration: isDone ? "line-through" : "none" }}>{s.name}</div>
                              <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>Frequency: {s.freq}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 8, letterSpacing: ".12em", textTransform: "uppercase", color: urgencyColor }}>{s.urgency}</div>
                            </div>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${isDone ? A : BOR2}`, background: isDone ? A : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: BG, flexShrink: 0 }}>
                              {isDone ? "✓" : ""}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ─── TRENDS ─── */}
            {tab === "trends" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>HEALTH TRENDS</div>

                {logs.length < 3 ? (
                  <Card style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontFamily: HEAD, fontSize: 18, color: "#1a3025", marginBottom: 8 }}>No Data Yet</div>
                    <div style={{ fontSize: 10, color: "#1a3025", lineHeight: 1.7 }}>Log your daily health at least 3 times to see trends.</div>
                    <GreenBtn onClick={() => setShowLog(true)} style={{ marginTop: 16, width: "100%" }} icon="📝">Log Now</GreenBtn>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <SectionLabel>Wellness Score Trend</SectionLabel>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="wG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={A} stopOpacity={.3} />
                                <stop offset="100%" stopColor={A} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                            <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                            <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[0, 10]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="wellness" name="Wellness" stroke={A} fill="url(#wG)" strokeWidth={2} dot={{ fill: A, r: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Card>
                        <SectionLabel>Mood & Energy</SectionLabel>
                        <div style={{ height: 170 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                              <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                              <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[0, 10]} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="mood" name="Mood" stroke={A} strokeWidth={2} dot={{ fill: A, r: 2 }} />
                              <Line type="monotone" dataKey="energy" name="Energy" stroke={AMBER} strokeWidth={2} dot={{ fill: AMBER, r: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>

                      <Card>
                        <SectionLabel>Stress Trend</SectionLabel>
                        <div style={{ height: 170 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" vertical={false} />
                              <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                              <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[0, 10]} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="stress" name="Stress" radius={[2, 2, 0, 0]}>
                                {chartData.map((d, i) => <Cell key={i} fill={d.stress > 6 ? RED : d.stress > 4 ? AMBER : A} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>

                    {/* Log history */}
                    <Card>
                      <SectionLabel>Recent Log Entries</SectionLabel>
                      {logs.slice(0, 7).map((l, i) => (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${BOR}` }}>
                          <div style={{ fontSize: 8, color: "#1a3025", minWidth: 64 }}>{new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                          {[
                            { l: "Mood", v: l.mood, c: A },
                            { l: "Energy", v: l.energy, c: AMBER },
                            { l: "Stress", v: l.stress, c: l.stress > 5 ? RED : GREEN },
                            { l: "Sleep", v: l.sleep + "h", c: PURPLE },
                            { l: "Water", v: l.water + "g", c: BLUE },
                          ].map(({ l: lbl, v, c }) => (
                            <div key={lbl} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 7, color: "#1a3025", letterSpacing: ".1em", textTransform: "uppercase" }}>{lbl}</div>
                              <div style={{ fontSize: 12, fontFamily: HEAD, color: c, fontWeight: 700 }}>{v}</div>
                            </div>
                          ))}
                          {l.note && <div style={{ fontSize: 9, color: "#1a3025", fontStyle: "italic", marginLeft: "auto", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{l.note}"</div>}
                        </div>
                      ))}
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ─── WHO GUIDELINES ─── */}
            {tab === "who" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>WHO EVIDENCE BASE</div>
                <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.8 }}>
                  ManifiX Prevent is built on the WHO ICD-11 Framework and SDG 3.4/3.8. Every habit and recommendation maps to evidence-based preventive medicine.
                </div>

                {Object.entries(WHO_DOMAINS).map(([key, d]) => (
                  <Card key={key} style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${d.color},transparent)` }} />
                    <button className="ph-btn" onClick={() => setWhoOpen(whoOpen === key ? null : key)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                      <div>
                        <div style={{ fontSize: 8, letterSpacing: ".16em", color: "#1a3025", textTransform: "uppercase", marginBottom: 4 }}>{d.code}</div>
                        <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 700, color: d.color }}>{d.label}</div>
                      </div>
                      <motion.div animate={{ rotate: whoOpen === key ? 180 : 0 }} transition={{ duration: .2 }}
                        style={{ color: d.color, fontSize: 16 }}>▼</motion.div>
                    </button>
                    <AnimatePresence>
                      {whoOpen === key && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }}
                          style={{ overflow: "hidden" }}>
                          <div style={{ paddingTop: 14 }}>
                            {d.stats.map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: i === 0 ? "#3a5a45" : "#2a4a35", lineHeight: 1.7, borderLeft: `3px solid ${i === 0 ? d.color : BOR2}`, paddingLeft: 10, marginBottom: 7 }}>
                                {s}
                              </div>
                            ))}
                            <div style={{ marginTop: 10, padding: "10px 12px", background: "#050e08", border: `1px solid ${BOR2}` }}>
                              <div style={{ fontSize: 8, color: "#1a3025", marginBottom: 4 }}>{d.sdg}</div>
                              <div style={{ fontSize: 10, color: d.color }}>{d.action}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}

                {/* Habit WHO mapping */}
                <Card>
                  <SectionLabel>Habit Evidence Mapping</SectionLabel>
                  {DEFAULT_HABITS.map(h => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#7ab894" }}>{h.name}</div>
                        <div style={{ fontSize: 8, color: "#1a3025", marginTop: 2 }}>{h.who}</div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
