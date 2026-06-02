/**
 * ╔══════════════════════════════════════════════════════════════════════════════════╗
 * ║  ManifiX AI — Preventive Health Module v7.0  ★ COMPETITIVE UPGRADE             ║
 * ║  ┌─ BEATS OURA   → Readiness Score · Sleep Stages · HRV · Body Temp Trends    ║
 * ║  ├─ BEATS WHOOP  → Strain Score · Recovery% · Sleep Debt · Burnout Zone       ║
 * ║  └─ BEATS WW     → NutriPoints · Food Log · Non-Scale Wins · Coach Nudges     ║
 * ║  + Real 90-Day Roadmap · Streak Engine · WHO ICD-11 · Offline PWA             ║
 * ╚══════════════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ══════════════ DESIGN TOKENS ══════════════ */
const A      = "#4ADE80";
const A2     = "#86EFAC";
const BG     = "#030d07";
const C1     = "#091810";
const C2     = "#0d2018";
const BOR    = "#0f2a1a";
const BOR2   = "#183d24";
const FONT   = "'JetBrains Mono','Courier New',monospace";
const HEAD   = "'Syne','system-ui',sans-serif";
const BLUE   = "#60a5fa";
const PURPLE = "#a78bfa";
const AMBER  = "#fbbf24";
const RED    = "#f87171";
const TEAL   = "#2dd4bf";
const ROSE   = "#fb7185";
const CYAN   = "#22d3ee";
const LIME   = "#84cc16";

/* ══════════════ CSS ══════════════ */
function injectCSS() {
  if (document.getElementById("ph-css-v7")) return;
  const el = document.createElement("style");
  el.id = "ph-css-v7";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes ph-pulse{0%,100%{opacity:.07;transform:scale(1)}50%{opacity:.16;transform:scale(1.06)}}
    @keyframes ph-spin{to{transform:rotate(360deg)}}
    @keyframes ph-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ph-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes ph-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.35)}28%{transform:scale(1)}}
    @keyframes ph-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes ph-glow{0%,100%{box-shadow:0 0 10px #4ADE8020}50%{box-shadow:0 0 28px #4ADE8060}}
    @keyframes ph-scanline{from{top:0}to{top:100%}}
    @keyframes ph-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    .ph-btn{cursor:pointer;transition:all .15s ease;outline:none;border:none}
    .ph-btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
    .ph-btn:active{transform:scale(.97)}
    .ph-card{background:#091810;border:1px solid #0f2a1a;transition:border-color .2s,box-shadow .2s}
    .ph-card:hover{border-color:#183d24}
    .ph-input{background:#050e08;border:1px solid #0f2a1a;color:#d4f0e0;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.04em;padding:9px 13px;width:100%;outline:none;transition:border-color .2s;resize:none}
    .ph-input:focus{border-color:#4ADE8055}
    .ph-input::placeholder{color:#1a2a1f}
    .ph-range{width:100%;accent-color:#4ADE80;cursor:pointer}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#0f2a1a;border-radius:2px}
    .burnout-ring{animation:ph-glow 2.5s ease-in-out infinite}
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

/* ══════════════ ROADMAP ENGINE ══════════════ */
function getRoadmapState() {
  const stored = localStorage.getItem("ph_roadmap_start");
  const now = Date.now();
  if (!stored) {
    const start = new Date().toISOString().split("T")[0];
    localStorage.setItem("ph_roadmap_start", start);
    return { day: 1, startDate: start, pct: 1 };
  }
  const startMs = new Date(stored).setHours(0,0,0,0);
  const todayMs = new Date().setHours(0,0,0,0);
  const elapsed = Math.floor((todayMs - startMs) / 86400000);
  const day = Math.min(90, Math.max(1, elapsed + 1));
  return { day, startDate: stored, pct: Math.round((day / 90) * 100) };
}

const ROADMAP_PHASES = [
  { phase: 1, days: "1–30", title: "Foundation", color: BLUE, desc: "Establish baseline habits, get first screenings, understand risk profile.", milestones: [{ day: 7, label: "Complete baseline assessment" }, { day: 14, label: "BP, glucose & weight logged 5×" }, { day: 21, label: "8-habit streak 3 consecutive days" }, { day: 30, label: "Readiness score ≥ 60" }] },
  { phase: 2, days: "31–60", title: "Build", color: A, desc: "Increase consistency, deepen nutrition tracking, add stress management rituals.", milestones: [{ day: 37, label: "7-day habit streak" }, { day: 45, label: "Sleep average ≥ 7h for 2 weeks" }, { day: 52, label: "Stress score ≤ 4 avg this week" }, { day: 60, label: "Recovery% ≥ 75 average" }] },
  { phase: 3, days: "61–90", title: "Protect", color: AMBER, desc: "Lock in lifestyle medicine, plan annual screenings, set next 90-day goals.", milestones: [{ day: 67, label: "14-day unbroken habit streak" }, { day: 75, label: "Annual screening appointments booked" }, { day: 82, label: "Share progress with care team" }, { day: 90, label: "Readiness ≥ 87 — Prevention Master" }] },
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
  { id: "h_water",   name: "Hydration · 8 glasses",   cat: "nutrition", icon: "💧", who: "WHO hydration baseline" },
  { id: "h_steps",   name: "Movement · 8,000 steps",  cat: "fitness",   icon: "🚶", who: "WHO 150min/wk moderate activity" },
  { id: "h_veggies", name: "Vegetables · 5 servings", cat: "nutrition", icon: "🥦", who: "WHO fruit & veg 400g/day" },
  { id: "h_breathe", name: "Breathing · 5 min",       cat: "mental",    icon: "🌬️", who: "Reduces cortisol 23% (NIH)" },
  { id: "h_sleep",   name: "Sleep · 7–8 hours",       cat: "sleep",     icon: "😴", who: "WHO sleep health guideline" },
  { id: "h_sun",     name: "Morning sunlight · 10min",cat: "wellness",  icon: "☀️", who: "Circadian rhythm + Vit D" },
  { id: "h_screen",  name: "No screen before bed",    cat: "sleep",     icon: "📵", who: "Melatonin protection" },
  { id: "h_stretch", name: "Stretching · daily",      cat: "fitness",   icon: "🧘", who: "Musculoskeletal NCD prevention" },
];

/* ══════════════ ★ OURA: SLEEP STAGES ENGINE ══════════════ */
// Simulated from logged data — in a real app, synced from wearable
function calcSleepStages(sleepHours, stress) {
  const total = sleepHours * 60; // minutes
  const remPct   = Math.max(0.18, 0.22 - stress * 0.01);
  const deepPct  = Math.max(0.12, 0.20 - stress * 0.012);
  const lightPct = 1 - remPct - deepPct - 0.05;
  return {
    rem:   Math.round(total * remPct),
    deep:  Math.round(total * deepPct),
    light: Math.round(total * lightPct),
    awake: Math.round(total * 0.05),
    total: Math.round(total),
    quality: Math.round(((remPct / 0.22) * 40 + (deepPct / 0.20) * 40 + (sleepHours >= 7 ? 20 : (sleepHours / 7) * 20))),
  };
}

/* ══════════════ ★ OURA: READINESS SCORE ══════════════ */
function calcReadiness({ sleepHours, hrv, restingHR, stress, activityYesterday, sleepDebt }) {
  let score = 50;
  score += sleepHours >= 8 ? 18 : sleepHours >= 7 ? 14 : sleepHours >= 6 ? 8 : 2;
  score += hrv >= 60 ? 14 : hrv >= 45 ? 10 : hrv >= 30 ? 5 : 0;
  score += restingHR <= 60 ? 10 : restingHR <= 68 ? 7 : restingHR <= 75 ? 4 : 1;
  score -= stress * 1.2;
  score -= sleepDebt * 2.5;
  score += activityYesterday ? 8 : 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/* ══════════════ ★ WHOOP: STRAIN SCORE ══════════════ */
// Strain: 0-21 scale (Whoop's cardiac strain model)
function calcStrain({ steps, hrMax, restingHR, activeMinutes }) {
  const hrRange = Math.max(1, hrMax - restingHR);
  const effort = (steps / 8000) * 0.4 + (activeMinutes / 60) * 0.6;
  const strain = Math.min(21, Math.round(effort * 21 * (hrRange / 60)));
  return Math.max(1, strain);
}

function strainLabel(strain) {
  if (strain <= 3)  return { label: "Rest Day",        color: BLUE };
  if (strain <= 7)  return { label: "Light Activity",  color: TEAL };
  if (strain <= 13) return { label: "Moderate",        color: A };
  if (strain <= 17) return { label: "Strenuous",       color: AMBER };
  return                    { label: "All Out",         color: RED };
}

/* ══════════════ ★ WHOOP: RECOVERY % ══════════════ */
function calcRecovery({ readiness, sleepQuality, hrv, strain }) {
  const r = Math.round((readiness * 0.4 + sleepQuality * 0.35 + (hrv / 100) * 15 + Math.max(0, 21 - strain) / 21 * 10));
  return Math.min(100, Math.max(0, r));
}

function recoveryLabel(pct) {
  if (pct >= 67) return { label: "In The Green · Optimal",   color: A,     emoji: "🟢" };
  if (pct >= 34) return { label: "In The Yellow · Moderate", color: AMBER, emoji: "🟡" };
  return                { label: "In The Red · Rest",        color: RED,   emoji: "🔴" };
}

/* ══════════════ ★ WHOOP: BURNOUT RISK ══════════════ */
function calcBurnoutRisk(logs) {
  if (logs.length < 3) return { score: 0, level: "Unknown", color: "#444" };
  const recent = logs.slice(0, 7);
  const avgStress  = recent.reduce((a, l) => a + (l.stress || 4), 0) / recent.length;
  const avgSleep   = recent.reduce((a, l) => a + (l.sleep || 7), 0) / recent.length;
  const avgEnergy  = recent.reduce((a, l) => a + (l.energy || 7), 0) / recent.length;
  const avgMood    = recent.reduce((a, l) => a + (l.mood || 7), 0) / recent.length;
  const score = Math.round(avgStress * 15 + Math.max(0, 7 - avgSleep) * 10 + Math.max(0, 7 - avgEnergy) * 8 + Math.max(0, 7 - avgMood) * 7);
  const bounded = Math.min(100, score);
  if (bounded >= 70) return { score: bounded, level: "High Burnout Risk",    color: RED };
  if (bounded >= 45) return { score: bounded, level: "Moderate Risk",        color: AMBER };
  if (bounded >= 20) return { score: bounded, level: "Low Risk",             color: TEAL };
  return                    { score: bounded, level: "Optimal Zone",         color: A };
}

/* ══════════════ ★ WHOOP: SLEEP DEBT ══════════════ */
function calcSleepDebt(logs) {
  if (!logs.length) return 0;
  const recent = logs.slice(0, 7);
  const avgSleep = recent.reduce((a, l) => a + (l.sleep || 7), 0) / recent.length;
  return Math.max(0, Math.round((8 - avgSleep) * 10) / 10);
}

/* ══════════════ ★ WW: NUTRIPOINTS SYSTEM ══════════════ */
const FOOD_DB = [
  // Green (0-1 pt)
  { id: "f_apple",    name: "Apple",              cat: "fruit",  points: 0, emoji: "🍎", cal: 95,  protein: 0, fiber: 4 },
  { id: "f_spinach",  name: "Spinach (cup)",      cat: "veggie", points: 0, emoji: "🥬", cal: 7,   protein: 1, fiber: 1 },
  { id: "f_chicken",  name: "Chicken Breast 100g",cat: "protein",points: 1, emoji: "🍗", cal: 165, protein: 31, fiber: 0 },
  { id: "f_egg",      name: "Boiled Egg",         cat: "protein",points: 1, emoji: "🥚", cal: 70,  protein: 6, fiber: 0 },
  { id: "f_yogurt",   name: "Greek Yogurt (cup)", cat: "dairy",  points: 2, emoji: "🥛", cal: 130, protein: 17, fiber: 0 },
  { id: "f_oats",     name: "Oatmeal (bowl)",     cat: "grain",  points: 3, emoji: "🥣", cal: 154, protein: 5, fiber: 4 },
  { id: "f_rice",     name: "Rice (cup cooked)",  cat: "grain",  points: 4, emoji: "🍚", cal: 200, protein: 4, fiber: 1 },
  { id: "f_banana",   name: "Banana",             cat: "fruit",  points: 2, emoji: "🍌", cal: 105, protein: 1, fiber: 3 },
  // Yellow (moderate)
  { id: "f_bread",    name: "Whole Wheat Bread",  cat: "grain",  points: 4, emoji: "🍞", cal: 140, protein: 5, fiber: 3 },
  { id: "f_cheese",   name: "Cheese (slice)",     cat: "dairy",  points: 4, emoji: "🧀", cal: 110, protein: 7, fiber: 0 },
  // Red (high pt)
  { id: "f_burger",   name: "Burger",             cat: "junk",   points: 12, emoji: "🍔", cal: 550, protein: 25, fiber: 2 },
  { id: "f_pizza",    name: "Pizza slice",        cat: "junk",   points: 10, emoji: "🍕", cal: 285, protein: 12, fiber: 2 },
  { id: "f_fries",    name: "French Fries",       cat: "junk",   points: 9,  emoji: "🍟", cal: 365, protein: 4, fiber: 4 },
  { id: "f_soda",     name: "Soda can",           cat: "drink",  points: 8,  emoji: "🥤", cal: 150, protein: 0, fiber: 0 },
  { id: "f_cookie",   name: "Cookie",             cat: "sweet",  points: 7,  emoji: "🍪", cal: 160, protein: 2, fiber: 1 },
  { id: "f_nuts",     name: "Mixed Nuts (30g)",   cat: "snack",  points: 5,  emoji: "🥜", cal: 180, protein: 5, fiber: 2 },
  { id: "f_salmon",   name: "Salmon 100g",        cat: "protein",points: 2,  emoji: "🐟", cal: 208, protein: 20, fiber: 0 },
  { id: "f_avocado",  name: "Avocado (half)",     cat: "fruit",  points: 3,  emoji: "🥑", cal: 120, protein: 2, fiber: 5 },
];

const DAILY_POINTS_BUDGET = 23;

/* ══════════════ ★ WW: NON-SCALE VICTORIES ══════════════ */
const NSV_OPTIONS = [
  "Slept 7+ hours", "Drank 8 glasses of water", "Exercised 30+ min",
  "Ate 5+ servings of vegetables", "Managed stress well today",
  "No ultra-processed food", "Morning sunlight ritual done",
  "Mindful eating — no screens during meals", "Walked 8,000+ steps",
  "Said no to a craving", "Cooked a healthy meal at home", "Social connection — connected with someone",
];

/* ══════════════ SCREENINGS ══════════════ */
const SCREENINGS = [
  { id: "s_bp",      name: "Blood Pressure",      freq: "Every 6 months", icon: "❤️",  urgency: "high" },
  { id: "s_glucose", name: "Blood Glucose (FBS)", freq: "Annual",         icon: "🩸",  urgency: "high" },
  { id: "s_bmi",     name: "BMI + Waist Circ.",   freq: "Monthly",        icon: "⚖️",  urgency: "medium" },
  { id: "s_lipids",  name: "Lipid Panel",         freq: "Every 2 years",  icon: "🔬",  urgency: "medium" },
  { id: "s_dental",  name: "Dental Checkup",      freq: "Every 6 months", icon: "🦷",  urgency: "low" },
  { id: "s_vision",  name: "Vision Screening",    freq: "Annual",         icon: "👁️",  urgency: "low" },
  { id: "s_cancer",  name: "Cancer Screening",    freq: "As per age/sex", icon: "🩺",  urgency: "high" },
  { id: "s_mental",  name: "Mental Health Check", freq: "Quarterly",      icon: "🧠",  urgency: "medium" },
];

/* ══════════════ WHO DOMAINS ══════════════ */
const WHO_DOMAINS = {
  ncd: { code: "PREV-NCD", label: "NCD Prevention", color: RED, stats: ["NCDs cause 74% of all deaths globally — WHO 2023", "80% of heart disease & Type 2 diabetes are preventable", "4 primary risk factors: tobacco, inactivity, alcohol, poor diet", "$4 return for every $1 invested in prevention — WHO LMIC data"], sdg: "SDG 3.4 — Reduce premature NCD mortality by 1/3 by 2030", action: "Daily habits + screening + lifestyle → NCD risk ↓50–70%" },
  screening: { code: "PREV-SCR", label: "Early Screening", color: BLUE, stats: ["50% of cancers are curable if detected early — WHO", "Only 30% of adults get recommended annual screenings", "Regular BP + glucose checks reduce complication risk by 40%", "AI-assisted triage increases early detection by 35%"], sdg: "SDG 3.8 — Universal health coverage & preventive care", action: "Monthly self-checks + annual clinical → Early intervention ↑" },
  lifestyle: { code: "PREV-LIF", label: "Lifestyle Medicine", color: AMBER, stats: ["Healthy lifestyle adds 10–14 years of life expectancy — Lancet 2023", "Sleep + movement + stress → Immune function ↑30%", "Reducing ultra-processed food → Inflammation ↓25%", "Social connection reduces mortality risk = quitting smoking"], sdg: "SDG 3.4 + 3.5 — Healthy lives & substance abuse prevention", action: "Micro-habits + consistency + tracking → Biological age ↓5–10 years" },
};

/* ══════════════ TIPS ══════════════ */
const TIPS = [
  "Drink water before coffee every morning — sets hydration baseline.",
  "5-min walk after meals reduces postprandial glucose by 12% (NIH).",
  "Dim lights 1hr before sleep — melatonin rises 70% faster.",
  "Name your emotion — reduces amygdala activity by 50% (fMRI).",
  "Eat the rainbow — phytonutrient diversity reduces NCD risk 35%.",
  "7hrs sleep is the single strongest longevity predictor (Lancet 2023).",
  "Sunlight before 9am anchors circadian rhythm all day.",
  "Stand every 45 minutes — sitting ≥8hrs/day adds NCD risk 20%.",
  "Deep breathing 5min/day lowers resting BP by 4–8 mmHg over 4 weeks.",
  "Social connection is as protective as not smoking — Harvard study.",
];

/* ══════════════ STREAK ENGINE ══════════════ */
function updateStreak(streakObj, habitsDone) {
  const today = new Date().toISOString().split("T")[0];
  if (!habitsDone) return streakObj;
  if (!streakObj.lastDate) return { count: 1, lastDate: today };
  const diff = Math.round((new Date(today) - new Date(streakObj.lastDate)) / 86400000);
  if (diff === 0) return streakObj;
  if (diff === 1) return { count: streakObj.count + 1, lastDate: today };
  return { count: 0, lastDate: today };
}

/* ══════════════ WELLNESS SCORE ══════════════ */
function calcWellness(habitsDone, water, sleep, stress, streak, readiness, recovery) {
  let s = 20;
  const done = Object.values(habitsDone).filter(Boolean).length;
  s += (done / DEFAULT_HABITS.length) * 20;
  s += water >= 8 ? 8 : Math.min(8, water * 1);
  s += sleep >= 7 && sleep <= 9 ? 8 : Math.max(0, 8 - Math.abs(sleep - 8) * 3);
  s -= stress * 1.2;
  s += Math.min(4, streak * 0.4);
  s += readiness * 0.25;
  s += recovery * 0.15;
  return Math.min(100, Math.max(0, Math.round(s)));
}

/* ══════════════ BREATHING ══════════════ */
const BREATH_MODES = {
  "4-4-6-2": { name: "Extended Exhale", seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 4 }, { ph: "Exhale", s: 6 }, { ph: "Rest", s: 2 }], benefit: "Activates parasympathetic system", color: A },
  "4-7-8":   { name: "4-7-8 Relax",    seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 7 }, { ph: "Exhale", s: 8 }], benefit: "Maximum oxygen exchange", color: BLUE },
  "box":     { name: "Box Breathing",  seq: [{ ph: "Inhale", s: 4 }, { ph: "Hold", s: 4 }, { ph: "Exhale", s: 4 }, { ph: "Rest", s: 4 }], benefit: "Balance & focus (Navy SEAL)", color: TEAL },
  "resonance":{ name: "HRV Resonance", seq: [{ ph: "Inhale", s: 5 }, { ph: "Exhale", s: 5 }], benefit: "0.1Hz HRV coherence", color: PURPLE },
};

function BreathEngine({ active, mode = "4-4-6-2" }) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);
  const cancelRef = useRef(false);
  const cfg = BREATH_MODES[mode];

  useEffect(() => {
    if (!active) return;
    cancelRef.current = false;
    let pi = 0, ct = cfg.seq[0].s;
    setPhase(cfg.seq[0].ph); setCount(ct);
    const tick = () => {
      if (cancelRef.current) return;
      ct--;
      if (ct < 0) { pi = (pi + 1) % cfg.seq.length; if (pi === 0) setCycles(c => c + 1); ct = cfg.seq[pi].s; setPhase(cfg.seq[pi].ph); }
      setCount(ct); timerRef.current = setTimeout(tick, 1000);
    };
    timerRef.current = setTimeout(tick, 1000);
    return () => { cancelRef.current = true; clearTimeout(timerRef.current); };
  }, [active, mode]);

  const isIn = phase === "Inhale", isOut = phase === "Exhale";
  const sz = active ? (isIn ? 148 : isOut ? 76 : 110) : 96;
  const dur = isIn ? cfg.seq[0].s : isOut ? (cfg.seq.find(s => s.ph === "Exhale")?.s || 6) : 1;

  return (
    <div style={{ textAlign: "center", padding: "14px 0" }}>
      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <motion.div animate={{ width: sz + 48, height: sz + 48, opacity: active ? 0.15 : 0 }} transition={{ duration: dur, ease: "easeInOut" }}
          style={{ position: "absolute", borderRadius: "50%", border: `1px solid ${cfg.color}` }} />
        <motion.div animate={{ width: sz, height: sz }} transition={{ duration: dur, ease: "easeInOut" }}
          style={{ borderRadius: "50%", background: `${cfg.color}14`, border: `2px solid ${cfg.color}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {active ? (
            <><div style={{ fontFamily: HEAD, fontSize: 36, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 8, letterSpacing: ".16em", color: `${cfg.color}88`, textTransform: "uppercase" }}>{phase}</div></>
          ) : <div style={{ fontSize: 32 }}>🌬️</div>}
        </motion.div>
      </div>
      {active && <><div style={{ fontSize: 8, letterSpacing: ".18em", color: "#1a3025", textTransform: "uppercase", marginBottom: 4 }}>{cycles} cycle{cycles !== 1 ? "s" : ""}</div>
        <div style={{ fontSize: 9, color: cfg.color, marginBottom: 14 }}>{cfg.benefit}</div></>}
    </div>
  );
}

/* ══════════════ SHARED UI ══════════════ */
const Card = ({ children, style = {}, glow = false, color = A }) => (
  <div className="ph-card" style={{ padding: 18, ...(glow ? { boxShadow: `0 0 22px ${color}12`, borderColor: `${color}44` } : {}), ...style }}>{children}</div>
);

const SectionLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 8, letterSpacing: ".22em", color: "#1a3025", textTransform: "uppercase", marginBottom: 8, fontFamily: FONT, ...style }}>{children}</div>
);

function ProgressRing({ value, max = 100, size = 100, stroke = 6, color = A, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0d2018" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - Math.min(value/max, 1)) }}
          transition={{ duration: 1.4, ease: "easeOut" }} />
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
      padding: "12px 20px", background: disabled ? "#111" : variant === "solid" ? color : `${color}14`,
      border: `1px solid ${disabled ? "#222" : variant === "solid" ? color : `${color}44`}`,
      color: disabled ? "#333" : variant === "solid" ? BG : color,
      fontFamily: HEAD, fontWeight: 700, fontSize: 13, letterSpacing: ".04em",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      cursor: disabled ? "not-allowed" : "pointer", transition: "all .15s", opacity: disabled ? 0.5 : 1, ...style,
    }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}{children}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C1, border: `1px solid ${BOR2}`, padding: "8px 12px", fontFamily: FONT, fontSize: 9 }}>
      <div style={{ color: A, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || A }}>{p.name}: <span style={{ color: "#d4f0e0" }}>{p.value}</span></div>)}
    </div>
  );
};

/* ══════════════ ★ OURA: SLEEP STAGE CHART ══════════════ */
function SleepStageBar({ stages }) {
  const total = stages.total || 1;
  const bars = [
    { label: "Deep", min: stages.deep, color: PURPLE },
    { label: "REM",  min: stages.rem,  color: BLUE },
    { label: "Light",min: stages.light,color: TEAL },
    { label: "Awake",min: stages.awake,color: "#2a3a2f" },
  ];
  return (
    <div>
      <div style={{ display: "flex", height: 20, overflow: "hidden", borderRadius: 2, marginBottom: 8, gap: 1 }}>
        {bars.map(b => (
          <motion.div key={b.label} initial={{ width: 0 }} animate={{ width: `${(b.min / total) * 100}%` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{ height: "100%", background: b.color, minWidth: b.min > 0 ? 2 : 0 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, background: b.color, borderRadius: 1 }} />
            <span style={{ fontSize: 8, color: "#2a4a35", fontFamily: FONT }}>{b.label} <span style={{ color: b.color }}>{b.min}m</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ ★ WHOOP: STRAIN ARC ══════════════ */
function StrainArc({ strain, size = 120 }) {
  const { label, color } = strainLabel(strain);
  const pct = strain / 21;
  const r = 48;
  const circ = Math.PI * r; // half circle
  return (
    <div style={{ textAlign: "center", position: "relative", width: size, height: size * 0.65 }}>
      <svg width={size} height={size * 0.65} viewBox="0 0 120 78" style={{ overflow: "visible" }}>
        <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="#0d2018" strokeWidth={8} strokeLinecap="round" />
        <motion.path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.6, ease: "easeOut" }} />
        <text x="60" y="60" textAnchor="middle" fill={color} fontFamily={HEAD} fontSize="22" fontWeight="800">{strain}</text>
        <text x="60" y="74" textAnchor="middle" fill="#1a3025" fontFamily={FONT} fontSize="7">/21 STRAIN</text>
      </svg>
      <div style={{ fontSize: 8, color, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ══════════════ LOG MODAL ══════════════ */
function LogModal({ onClose, onSave }) {
  const [mood, setMood]     = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [water, setWater]   = useState(6);
  const [sleep, setSleep]   = useState(7.5);
  const [hrv, setHrv]       = useState(55);
  const [restHR, setRestHR] = useState(65);
  const [temp, setTemp]     = useState(36.8);
  const [steps, setSteps]   = useState(6000);
  const [activeMins, setActiveMins] = useState(30);
  const [note, setNote]     = useState("");

  const allFields = [
    { l: "Mood",          e: "😊", v: mood,       s: setMood,       min: 1,  max: 10,   step: 1,   color: A,      unit: "/10" },
    { l: "Energy",        e: "⚡", v: energy,     s: setEnergy,     min: 1,  max: 10,   step: 1,   color: AMBER,  unit: "/10" },
    { l: "Stress",        e: "😰", v: stress,     s: setStress,     min: 0,  max: 10,   step: 1,   color: RED,    unit: "/10" },
    { l: "Water (glasses)",e: "💧",v: water,      s: setWater,      min: 0,  max: 12,   step: 1,   color: BLUE,   unit: "g" },
    { l: "Sleep (hours)", e: "😴", v: sleep,      s: setSleep,      min: 3,  max: 12,   step: 0.5, color: PURPLE, unit: "h" },
    { l: "HRV (est.)",    e: "💓", v: hrv,        s: setHrv,        min: 20, max: 100,  step: 1,   color: ROSE,   unit: "ms" },
    { l: "Resting HR",    e: "❤️", v: restHR,     s: setRestHR,     min: 45, max: 100,  step: 1,   color: RED,    unit: "bpm" },
    { l: "Body Temp",     e: "🌡️", v: temp,       s: setTemp,       min: 36, max: 38.5, step: 0.1, color: AMBER,  unit: "°C" },
    { l: "Steps",         e: "🚶", v: steps,      s: setSteps,      min: 0,  max: 20000,step: 500, color: TEAL,   unit: "steps" },
    { l: "Active Mins",   e: "🏃", v: activeMins, s: setActiveMins, min: 0,  max: 180,  step: 5,   color: LIME,   unit: "min" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ scale: .92, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: C1, border: `2px solid ${A}`, padding: 24, width: "min(460px,100%)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: "#f0f8f4" }}>📝 Full Health Log</div>
          <button className="ph-btn" onClick={onClose} style={{ background: "none", color: "#444", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 8, color: "#1a3025", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14, fontFamily: FONT }}>
          Oura · Whoop · WW-grade biometric logging
        </div>
        {allFields.map(f => (
          <div key={f.l} style={{ marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#2a4a35", marginBottom: 4, fontFamily: FONT }}>
              <span>{f.e} {f.l}</span>
              <span style={{ color: f.color, fontWeight: 600 }}>{f.v} {f.unit}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.v}
              onChange={e => f.s(parseFloat(e.target.value))} className="ph-range" />
          </div>
        ))}
        <textarea className="ph-input" rows={2} placeholder="Optional notes..." value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <GreenBtn onClick={onClose} variant="ghost" color="#444" style={{ flex: 1 }}>Cancel</GreenBtn>
          <GreenBtn onClick={() => onSave({ mood, energy, stress, water, sleep, hrv, restHR, temp, steps, activeMins, note })} style={{ flex: 1 }}>Save Full Log</GreenBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════ FOOD LOG MODAL ══════════════ */
function FoodModal({ log, onAdd, onRemove, onClose, budget }) {
  const [search, setSearch] = useState("");
  const [meal, setMeal]     = useState("breakfast");
  const filtered = search ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : FOOD_DB;
  const totalPts = log.reduce((a, e) => a + e.points, 0);
  const remaining = budget - totalPts;
  const ptColor = remaining < 0 ? RED : remaining < 5 ? AMBER : A;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ scale: .92, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: C1, border: `2px solid ${AMBER}`, padding: 22, width: "min(480px,100%)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: "#f0f8f4" }}>🍽️ NutriPoints Log</div>
          <button className="ph-btn" onClick={onClose} style={{ background: "none", color: "#444", fontSize: 18 }}>✕</button>
        </div>

        {/* Points meter */}
        <div style={{ background: "#050e08", border: `1px solid ${BOR}`, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#2a4a35", fontFamily: FONT }}>Daily NutriPoints Budget</div>
            <div style={{ fontFamily: HEAD, fontSize: 18, color: ptColor }}>{remaining} remaining</div>
          </div>
          <div style={{ height: 6, background: BOR, overflow: "hidden" }}>
            <motion.div animate={{ width: `${Math.min(100, (totalPts / budget) * 100)}%` }} transition={{ duration: .8 }}
              style={{ height: "100%", background: `linear-gradient(90deg,${A},${AMBER},${remaining < 0 ? RED : AMBER})` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#1a3025", marginTop: 4, fontFamily: FONT }}>
            <span>Used: {totalPts} pts</span><span>Budget: {budget} pts/day</span>
          </div>
        </div>

        {/* Meal picker */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["breakfast","lunch","dinner","snack"].map(m => (
            <button key={m} className="ph-btn" onClick={() => setMeal(m)}
              style={{ padding: "5px 10px", background: meal === m ? `${AMBER}18` : "#050e08", border: `1px solid ${meal === m ? AMBER : BOR}`, color: meal === m ? AMBER : "#1a3025", fontFamily: FONT, fontSize: 8, letterSpacing: ".1em", textTransform: "capitalize" }}>
              {m}
            </button>
          ))}
        </div>

        {/* Search */}
        <input className="ph-input" placeholder="Search food..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />

        {/* Food grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
          {filtered.map(f => {
            const ptCol = f.points <= 2 ? A : f.points <= 5 ? AMBER : RED;
            return (
              <button key={f.id} className="ph-btn" onClick={() => onAdd({ ...f, meal, id: `${f.id}_${Date.now()}`, baseId: f.id })}
                style={{ padding: "9px 10px", background: "#050e08", border: `1px solid ${BOR}`, textAlign: "left", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 16 }}>{f.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: "#9ac8b4", fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  <div style={{ fontSize: 8, color: "#1a3025", fontFamily: FONT }}>{f.cal} kcal</div>
                </div>
                <div style={{ fontFamily: HEAD, fontSize: 14, color: ptCol, flexShrink: 0 }}>{f.points}p</div>
              </button>
            );
          })}
        </div>

        {/* Today's log */}
        {log.length > 0 && (
          <>
            <SectionLabel>Today's Logged Foods</SectionLabel>
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              {log.map((e, i) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: `1px solid ${BOR}` }}>
                  <span style={{ fontSize: 14 }}>{e.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#7ab894", fontFamily: FONT }}>{e.name}</div>
                    <div style={{ fontSize: 7, color: "#1a3025", textTransform: "capitalize" }}>{e.meal}</div>
                  </div>
                  <div style={{ fontFamily: HEAD, fontSize: 13, color: e.points <= 2 ? A : e.points <= 5 ? AMBER : RED }}>{e.points}p</div>
                  <button className="ph-btn" onClick={() => onRemove(i)}
                    style={{ background: "none", color: "#333", fontSize: 14, padding: "2px 6px" }}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}
        <GreenBtn onClick={onClose} color={AMBER} style={{ width: "100%", marginTop: 14 }}>Done Logging</GreenBtn>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════ NSV MODAL ══════════════ */
function NSVModal({ wins, onToggle, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ scale: .92, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: C1, border: `2px solid ${TEAL}`, padding: 24, width: "min(420px,100%)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: "#f0f8f4" }}>🏆 Non-Scale Victories</div>
          <button className="ph-btn" onClick={onClose} style={{ background: "none", color: "#444", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.7, fontFamily: FONT, marginBottom: 16 }}>
          WW-inspired: celebrate health wins that the scale can't measure.
        </div>
        {NSV_OPTIONS.map((nsv, i) => {
          const active = wins.includes(nsv);
          return (
            <button key={i} className="ph-btn" onClick={() => onToggle(nsv)}
              style={{ width: "100%", padding: "11px 14px", marginBottom: 7, background: active ? `${TEAL}0e` : "#050e08", border: `1px solid ${active ? TEAL : BOR}`, display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${active ? TEAL : BOR2}`, background: active ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: BG, flexShrink: 0 }}>{active ? "✓" : ""}</div>
              <div style={{ fontSize: 11, color: active ? TEAL : "#3a5a45", textDecoration: active ? "none" : "none", fontFamily: FONT }}>{nsv}</div>
            </button>
          );
        })}
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: TEAL, fontFamily: FONT }}>{wins.length} victories today 🎉</div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════ MAIN ══════════════ */
export default function PreventiveHealth() {
  const roadmap = useMemo(getRoadmapState, []);
  const [habits, setHabits]             = useLS("ph_habits", {});
  const [streak, setStreak]             = useLS("ph_streak", { count: 0, lastDate: null });
  const [logs, setLogs]                 = useLS("ph_logs_v7", []);
  const [screenings, setScreenings]     = useLS("ph_screenings", []);
  const [habitsToday, setHabitsToday]   = useLS("ph_habits_today", { date: "", done: {} });
  const [foodLog, setFoodLog]           = useLS("ph_food_log", []);
  const [nsvWins, setNsvWins]           = useLS("ph_nsv_wins", []);
  const [whoOpen, setWhoOpen]           = useState(null);
  const [breathMode, setBreathMode]     = useState("4-4-6-2");
  const [breathActive, setBreathActive] = useState(false);
  const [tab, setTab]                   = useState("today");
  const [showLog, setShowLog]           = useState(false);
  const [showFood, setShowFood]         = useState(false);
  const [showNSV, setShowNSV]           = useState(false);
  const [showScreen, setShowScreen]     = useState(false);
  const [tipIdx, setTipIdx]             = useState(0);
  const [loading, setLoading]           = useState(true);
  const [offline, setOffline]           = useState(!navigator.onLine);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => { injectCSS(); setTimeout(() => setLoading(false), 900); }, []);
  useEffect(() => { if (habitsToday.date !== todayStr) setHabitsToday({ date: todayStr, done: {} }); }, [todayStr]);
  useEffect(() => { const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const toggleHabit = useCallback((id) => {
    setHabitsToday(prev => {
      const now = { ...prev.done, [id]: !prev.done[id] };
      const allDone = DEFAULT_HABITS.every(h => now[h.id]);
      if (allDone) setStreak(s => updateStreak(s, true));
      setHabits(h => ({ ...h, [id]: { bestStreak: Math.max(h[id]?.bestStreak || 0, streak.count), timesCompleted: (h[id]?.timesCompleted || 0) + (!prev.done[id] ? 1 : 0) } }));
      return { ...prev, done: now };
    });
  }, [streak.count, setStreak, setHabits, setHabitsToday]);

  const handleSaveLog = useCallback((entry) => {
    setLogs(p => [{ id: Date.now(), date: new Date().toISOString(), ...entry }, ...p.slice(0, 89)]);
    setShowLog(false);
  }, [setLogs]);

  const handleAddFood = useCallback((food) => {
    setFoodLog(p => [...p, food]);
  }, [setFoodLog]);

  const handleRemoveFood = useCallback((idx) => {
    setFoodLog(p => p.filter((_, i) => i !== idx));
  }, [setFoodLog]);

  const handleToggleNSV = useCallback((nsv) => {
    setNsvWins(p => p.includes(nsv) ? p.filter(x => x !== nsv) : [...p, nsv]);
  }, [setNsvWins]);

  /* ── DERIVED BIOMETRICS ── */
  const latestLog   = logs[0];
  const doneToday   = Object.values(habitsToday.done).filter(Boolean).length;
  const sleepDebt   = calcSleepDebt(logs);
  const burnout     = calcBurnoutRisk(logs);
  const sleepStages = latestLog ? calcSleepStages(latestLog.sleep || 7.5, latestLog.stress || 4) : calcSleepStages(7.5, 4);
  const readiness   = latestLog ? calcReadiness({ sleepHours: latestLog.sleep || 7.5, hrv: latestLog.hrv || 55, restingHR: latestLog.restHR || 65, stress: latestLog.stress || 4, activityYesterday: doneToday > 4, sleepDebt }) : 72;
  const strain      = latestLog ? calcStrain({ steps: latestLog.steps || 6000, hrMax: 185, restingHR: latestLog.restHR || 65, activeMinutes: latestLog.activeMins || 30 }) : 8;
  const recovery    = latestLog ? calcRecovery({ readiness, sleepQuality: sleepStages.quality, hrv: latestLog.hrv || 55, strain }) : 65;
  const wellnessScore = calcWellness(habitsToday.done, latestLog?.water || 6, latestLog?.sleep || 7.5, latestLog?.stress || 4, streak.count, readiness, recovery);
  const foodPts     = foodLog.reduce((a, f) => a + f.points, 0);
  const foodRemaining = DAILY_POINTS_BUDGET - foodPts;
  const phase       = getCurrentPhase(roadmap.day);
  const nextMs      = getNextMilestone(roadmap.day);
  const strainInfo  = strainLabel(strain);
  const recoveryInfo= recoveryLabel(recovery);

  const chartData = useMemo(() => {
    return [...logs].reverse().slice(-14).map((l, i) => ({
      day: `D${i + 1}`,
      readiness: calcReadiness({ sleepHours: l.sleep || 7.5, hrv: l.hrv || 55, restingHR: l.restHR || 65, stress: l.stress || 4, activityYesterday: true, sleepDebt: 0 }),
      recovery:  calcRecovery({ readiness: 70, sleepQuality: 75, hrv: l.hrv || 55, strain: 8 }),
      hrv:       l.hrv || 55,
      stress:    l.stress || 4,
      mood:      l.mood || 7,
      energy:    l.energy || 7,
      strain:    calcStrain({ steps: l.steps || 6000, hrMax: 185, restingHR: l.restHR || 65, activeMinutes: l.activeMins || 30 }),
    }));
  }, [logs]);

  const radarData = [
    { subject: "Sleep",    A: (latestLog?.sleep || 7) / 9 * 100 },
    { subject: "Recovery", A: recovery },
    { subject: "Movement", A: (latestLog?.steps || 6000) / 10000 * 100 },
    { subject: "Nutrition",A: Math.max(0, (DAILY_POINTS_BUDGET - foodPts) / DAILY_POINTS_BUDGET * 100) },
    { subject: "Stress",   A: Math.max(0, (10 - (latestLog?.stress || 4)) * 10) },
    { subject: "Habits",   A: (doneToday / DEFAULT_HABITS.length) * 100 },
  ];

  const TABS = [
    { id: "today",   label: "Today",    emoji: "◈" },
    { id: "oura",    label: "Readiness",emoji: "🌙" },
    { id: "whoop",   label: "Strain",   emoji: "💪" },
    { id: "ww",      label: "Nutrition",emoji: "🍽️" },
    { id: "roadmap", label: "90-Day",   emoji: "🗺" },
    { id: "trends",  label: "Trends",   emoji: "📊" },
    { id: "who",     label: "WHO",      emoji: "🌍" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🛡️</div>
      </motion.div>
      <div style={{ fontSize: 11, letterSpacing: ".2em", color: A, textTransform: "uppercase", marginBottom: 6 }}>ManifiX Prevent v7.0</div>
      <div style={{ fontSize: 9, color: "#1a3025", letterSpacing: ".16em", marginBottom: 20 }}>BEATS OURA · WHOOP · WW</div>
      <div style={{ width: 28, height: 28, border: `3px solid ${BOR2}`, borderTopColor: A, borderRadius: "50%", animation: "ph-spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#d4f0e0", fontFamily: FONT, overflowX: "hidden" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)", width: 500, height: 240, background: `radial-gradient(ellipse,${A}09 0%,transparent 65%)`, animation: "ph-pulse 7s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "15%", right: "5%", width: 280, height: 160, background: `radial-gradient(ellipse,${PURPLE}06 0%,transparent 70%)`, animation: "ph-pulse 10s ease-in-out infinite 3s", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(${A}02 1px,transparent 1px),linear-gradient(90deg,${A}02 1px,transparent 1px)`, backgroundSize: "44px 44px", pointerEvents: "none", zIndex: 0 }} />

      {/* Modals */}
      <AnimatePresence>{showLog && <LogModal onClose={() => setShowLog(false)} onSave={handleSaveLog} />}</AnimatePresence>
      <AnimatePresence>{showFood && <FoodModal log={foodLog} onAdd={handleAddFood} onRemove={handleRemoveFood} onClose={() => setShowFood(false)} budget={DAILY_POINTS_BUDGET} />}</AnimatePresence>
      <AnimatePresence>{showNSV && <NSVModal wins={nsvWins} onToggle={handleToggleNSV} onClose={() => setShowNSV(false)} />}</AnimatePresence>

      {/* Offline */}
      <AnimatePresence>
        {offline && (
          <motion.div initial={{ y: -30 }} animate={{ y: 0 }} exit={{ y: -30 }}
            style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 90, fontSize: 10, letterSpacing: ".14em", background: C1, border: `1px solid ${A}`, color: A, padding: "6px 14px", textTransform: "uppercase" }}>
            ⚡ Offline — Full functionality active
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "12px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: `${BG}f0`, backdropFilter: "blur(14px)", zIndex: 20 }}>
        <div>
          <div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, lineHeight: 1, color: "#f0f8f4" }}>
            Mani<span style={{ color: A }}>fiX</span> <span style={{ fontSize: 16, color: "#1a3025" }}>v7</span>
          </div>
          <div style={{ fontSize: 7, letterSpacing: ".22em", color: "#1a3025", textTransform: "uppercase", marginTop: 2 }}>
            Oura · Whoop · WW · WHO ICD-11
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {[
            { l: "Day", v: `${roadmap.day}/90`, c: phase.color },
            { l: "Score", v: wellnessScore, c: A },
            { l: "Recovery", v: `${recovery}%`, c: recoveryInfo.color },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 7, letterSpacing: ".14em", color: "#1a2a1f", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "0 22px", display: "flex", gap: 0, overflowX: "auto", background: `${BG}f8`, position: "sticky", top: 55, zIndex: 19 }}>
        {TABS.map(t => (
          <button key={t.id} className="ph-btn" onClick={() => setTab(t.id)}
            style={{ padding: "10px 13px", background: "transparent", borderBottom: `2px solid ${tab === t.id ? A : "transparent"}`, color: tab === t.id ? A : "#1a3025", fontFamily: FONT, fontSize: 8, letterSpacing: ".16em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px 18px 80px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .27 }}>

            {/* ══════════════ TODAY ══════════════ */}
            {tab === "today" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Ticker */}
                <div style={{ overflow: "hidden", borderBottom: `1px solid ${BOR}`, paddingBottom: 9 }}>
                  <div style={{ display: "flex", gap: 36, animation: "ph-ticker 30s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
                    {[...Array(3)].flatMap(() => [`DAY ${roadmap.day}/90`, `STREAK ${streak.count}D`, `SCORE ${wellnessScore}`, `READINESS ${readiness}`, `RECOVERY ${recovery}%`, `STRAIN ${strain}/21`, `FOOD ${foodPts}/${DAILY_POINTS_BUDGET}pts`, `NSV ${nsvWins.length}`]).map((t, i) => (
                      <span key={i} style={{ fontSize: 7, letterSpacing: ".22em", color: "#1a3025" }}>{t} <span style={{ color: `${A}33` }}>◈</span></span>
                    ))}
                  </div>
                </div>

                {/* Hero 3-ring dashboard */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
                  <ProgressRing value={wellnessScore} size={108} stroke={7} color={wellnessScore >= 75 ? A : wellnessScore >= 55 ? AMBER : RED} sublabel="score" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                    {[
                      { l: "Readiness", v: readiness, c: readiness >= 70 ? A : readiness >= 50 ? AMBER : RED, icon: "🌙" },
                      { l: "Recovery",  v: `${recovery}%`, c: recoveryInfo.color, icon: recoveryInfo.emoji },
                      { l: "Strain",    v: `${strain}/21`, c: strainInfo.color, icon: "💪" },
                      { l: "Streak",    v: `${streak.count}d`, c: AMBER, icon: "🔥" },
                      { l: "Habits",    v: `${doneToday}/${DEFAULT_HABITS.length}`, c: A, icon: "✓" },
                      { l: "NutriPts",  v: `${foodRemaining}`, c: foodRemaining < 0 ? RED : foodRemaining < 5 ? AMBER : A, icon: "🍽️" },
                    ].map(({ l, v, c, icon }) => (
                      <Card key={l} style={{ padding: "9px 11px" }}>
                        <SectionLabel style={{ marginBottom: 2, fontSize: 7 }}>{l}</SectionLabel>
                        <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 700, color: c, lineHeight: 1 }}>{icon} {v}</div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Burnout risk banner (WHOOP) */}
                {burnout.score > 0 && (
                  <Card glow color={burnout.color} style={{ borderColor: `${burnout.color}55`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${burnout.color},transparent)` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <SectionLabel style={{ marginBottom: 2 }}>WHOOP Burnout Monitor</SectionLabel>
                        <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 700, color: burnout.color }}>{burnout.level}</div>
                        <div style={{ fontSize: 9, color: "#2a4a35", marginTop: 4 }}>Based on 7-day stress, sleep & energy trend</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: HEAD, fontSize: 36, color: burnout.color, lineHeight: 1 }}>{burnout.score}</div>
                        <div style={{ fontSize: 8, color: "#1a3025" }}>/ 100 risk</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, height: 4, background: BOR, overflow: "hidden" }}>
                      <motion.div animate={{ width: `${burnout.score}%` }} transition={{ duration: 1.4 }}
                        style={{ height: "100%", background: burnout.color }} />
                    </div>
                  </Card>
                )}

                {/* Phase + milestone */}
                <Card glow color={phase.color} style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${phase.color},transparent)` }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 16, fontWeight: 700, color: phase.color }}>{phase.title} Phase · Days {phase.days}</div>
                      <div style={{ fontSize: 10, color: "#2a4a35", marginTop: 4, lineHeight: 1.7 }}>{phase.desc}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontFamily: HEAD, fontSize: 22, color: A }}>{roadmap.pct}%</div>
                      <div style={{ height: 3, width: 70, background: BOR, marginTop: 4 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${roadmap.pct}%` }} transition={{ duration: 1.4 }}
                          style={{ height: "100%", background: `linear-gradient(90deg,${phase.color}88,${phase.color})` }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#1a3025", marginTop: 3 }}>{nextMs.day - roadmap.day} days to next goal</div>
                    </div>
                  </div>
                </Card>

                {/* Habits */}
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <SectionLabel style={{ marginBottom: 0 }}>Prevention Habits — {doneToday}/{DEFAULT_HABITS.length}</SectionLabel>
                    <div style={{ fontSize: 9, color: A }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
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
                        <motion.button key={h.id} className="ph-btn" onClick={() => toggleHabit(h.id)} whileTap={{ scale: .97 }}
                          style={{ padding: "11px 12px", background: done ? `${A}0e` : "#050e08", border: `1px solid ${done ? A : BOR}`, display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ fontSize: 18 }}>{h.icon}</span>
                            <div>
                              <div style={{ fontSize: 10, color: done ? "#2a4a35" : "#9ac8b4", textDecoration: done ? "line-through" : "none", lineHeight: 1.3 }}>{h.name}</div>
                              <div style={{ fontSize: 8, color: "#1a3025", marginTop: 2 }}>×{meta.timesCompleted || 0}</div>
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

                {/* Quick actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <GreenBtn onClick={() => setShowLog(true)} icon="📝" style={{ width: "100%", fontSize: 11 }}>Log Health</GreenBtn>
                  <GreenBtn onClick={() => setShowFood(true)} color={AMBER} icon="🍽️" style={{ width: "100%", fontSize: 11 }}>Food Log</GreenBtn>
                  <GreenBtn onClick={() => setShowNSV(true)} color={TEAL} icon="🏆" style={{ width: "100%", fontSize: 11 }}>Wins</GreenBtn>
                </div>

                {/* Breathing */}
                <Card>
                  <SectionLabel>HRV Breath Coach</SectionLabel>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {Object.entries(BREATH_MODES).map(([key, cfg]) => (
                      <button key={key} className="ph-btn" onClick={() => { setBreathMode(key); setBreathActive(false); }}
                        style={{ padding: "5px 10px", background: breathMode === key ? `${cfg.color}18` : "#050e08", border: `1px solid ${breathMode === key ? cfg.color : BOR}`, color: breathMode === key ? cfg.color : "#1a3025", fontFamily: FONT, fontSize: 8 }}>
                        {cfg.name}
                      </button>
                    ))}
                  </div>
                  <BreathEngine active={breathActive} mode={breathMode} />
                  <GreenBtn onClick={() => setBreathActive(v => !v)} variant={breathActive ? "ghost" : "solid"}
                    color={breathActive ? RED : A} icon={breathActive ? "⏹" : "▶"} style={{ width: "100%" }}>
                    {breathActive ? "Stop" : "Start Breathing Exercise"}
                  </GreenBtn>
                </Card>

                {/* Tip */}
                <Card>
                  <SectionLabel>Evidence Tip</SectionLabel>
                  <AnimatePresence mode="wait">
                    <motion.div key={tipIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: "#3a5a45", lineHeight: 1.9 }}>
                      {TIPS[tipIdx]}
                    </motion.div>
                  </AnimatePresence>
                </Card>
              </div>
            )}

            {/* ══════════════ ★ OURA: READINESS ══════════════ */}
            {tab === "oura" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>OURA-STYLE READINESS</div>
                  <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>Sleep stages · HRV · Body temp · Readiness score</div>
                </div>

                {/* Readiness hero */}
                <Card glow color={readiness >= 70 ? A : readiness >= 50 ? AMBER : RED}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <SectionLabel>Today's Readiness Score</SectionLabel>
                      <div style={{ fontFamily: HEAD, fontSize: 60, fontWeight: 800, color: readiness >= 70 ? A : readiness >= 50 ? AMBER : RED, lineHeight: 1 }}>{readiness}</div>
                      <div style={{ fontSize: 11, color: readiness >= 70 ? A : readiness >= 50 ? AMBER : RED, marginTop: 4 }}>
                        {readiness >= 85 ? "🟢 Optimal — Ready for peak performance" :
                         readiness >= 70 ? "🟡 Good — Normal training is fine" :
                         readiness >= 50 ? "🟠 Fair — Take it easy today" : "🔴 Low — Prioritize rest & recovery"}
                      </div>
                    </div>
                    <ProgressRing value={readiness} size={120} stroke={9} color={readiness >= 70 ? A : readiness >= 50 ? AMBER : RED} sublabel="readiness" />
                  </div>
                </Card>

                {/* Readiness contributors */}
                <Card>
                  <SectionLabel>Score Contributors</SectionLabel>
                  {[
                    { l: "Sleep Duration", v: latestLog?.sleep || 7.5, max: 9, unit: "h", color: PURPLE, target: "≥ 7h" },
                    { l: "HRV Balance",    v: latestLog?.hrv || 55,   max: 100, unit: "ms", color: ROSE, target: "≥ 50ms" },
                    { l: "Resting HR",     v: 100 - ((latestLog?.restHR || 65) - 45), max: 55, unit: "", color: RED, target: "≤ 60 bpm" },
                    { l: "Recovery Index", v: recovery, max: 100, unit: "%", color: A, target: "≥ 67%" },
                    { l: "Sleep Debt",     v: Math.max(0, 10 - sleepDebt * 3), max: 10, unit: "", color: AMBER, target: "< 1h debt" },
                  ].map(f => (
                    <div key={f.l} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a4a35", marginBottom: 4, fontFamily: FONT }}>
                        <span>{f.l}</span>
                        <span style={{ color: f.color }}>{f.v}{f.unit} <span style={{ color: "#1a3025" }}>· target {f.target}</span></span>
                      </div>
                      <div style={{ height: 4, background: BOR, overflow: "hidden" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (f.v / f.max) * 100)}%` }} transition={{ duration: 1.4 }}
                          style={{ height: "100%", background: f.color }} />
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Sleep stages */}
                <Card>
                  <SectionLabel>Sleep Architecture (Last Log)</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 32, color: PURPLE, lineHeight: 1 }}>{(sleepStages.total / 60).toFixed(1)}h</div>
                      <div style={{ fontSize: 9, color: "#1a3025" }}>total sleep</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 24, color: BLUE }}>{sleepStages.quality}</div>
                      <div style={{ fontSize: 9, color: "#1a3025" }}>sleep quality</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 24, color: sleepDebt > 1.5 ? RED : sleepDebt > 0.5 ? AMBER : A }}>{sleepDebt}h</div>
                      <div style={{ fontSize: 9, color: "#1a3025" }}>sleep debt</div>
                    </div>
                  </div>
                  <SleepStageBar stages={sleepStages} />
                  <div style={{ marginTop: 12, fontSize: 9, color: "#1a3025", lineHeight: 1.7, fontFamily: FONT }}>
                    Deep sleep supports immune function & tissue repair. REM drives memory consolidation.
                    Target: ≥18% REM · ≥15% Deep · &lt;5% awake.
                  </div>
                </Card>

                {/* Body temp trend (simulated) */}
                <Card>
                  <SectionLabel>Body Temperature Trend (°C)</SectionLabel>
                  {logs.length < 3 ? (
                    <div style={{ fontSize: 10, color: "#1a3025", padding: "20px 0", textAlign: "center" }}>Log 3+ days to see temperature trends</div>
                  ) : (
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...logs].reverse().slice(-14).map((l, i) => ({ day: `D${i+1}`, temp: l.temp || 36.8 }))}>
                          <defs><linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ROSE} stopOpacity={.3} /><stop offset="100%" stopColor={ROSE} stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                          <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                          <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[36.2, 38]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="temp" name="Temp °C" stroke={ROSE} fill="url(#tG)" strokeWidth={2} dot={{ fill: ROSE, r: 3 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: "#1a3025", marginTop: 8 }}>
                    Temp deviations &gt;0.5°C above baseline may signal illness, high stress, or overtraining.
                  </div>
                </Card>

                <GreenBtn onClick={() => setShowLog(true)} icon="📝" style={{ width: "100%" }}>Log Today's Biometrics</GreenBtn>
              </div>
            )}

            {/* ══════════════ ★ WHOOP: STRAIN & RECOVERY ══════════════ */}
            {tab === "whoop" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>WHOOP STRAIN · RECOVERY</div>
                  <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>Cardiac load · Recovery% · Sleep debt · Burnout prevention</div>
                </div>

                {/* Recovery + Strain hero */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Card glow color={recoveryInfo.color} style={{ textAlign: "center" }}>
                    <SectionLabel style={{ textAlign: "center" }}>Recovery</SectionLabel>
                    <ProgressRing value={recovery} size={100} stroke={8} color={recoveryInfo.color} sublabel="recovery" />
                    <div style={{ fontSize: 10, color: recoveryInfo.color, marginTop: 8, lineHeight: 1.5 }}>{recoveryInfo.label}</div>
                  </Card>
                  <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <SectionLabel style={{ textAlign: "center" }}>Day Strain</SectionLabel>
                    <StrainArc strain={strain} size={130} />
                  </Card>
                </div>

                {/* Burnout risk */}
                <Card glow color={burnout.color} className="burnout-ring">
                  <SectionLabel>Burnout Risk Index</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 24, color: burnout.color }}>{burnout.level}</div>
                      <div style={{ fontSize: 9, color: "#2a4a35", marginTop: 3 }}>7-day stress · sleep · energy composite</div>
                    </div>
                    <div style={{ fontFamily: HEAD, fontSize: 42, color: burnout.color, lineHeight: 1 }}>{burnout.score}</div>
                  </div>
                  <div style={{ height: 8, background: BOR, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${burnout.score}%` }} transition={{ duration: 1.6 }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${TEAL},${AMBER},${RED})` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#1a3025", marginTop: 4, fontFamily: FONT }}>
                    <span>Optimal</span><span>Low Risk</span><span>Moderate</span><span>High</span>
                  </div>
                </Card>

                {/* Sleep debt */}
                <Card>
                  <SectionLabel>Sleep Debt Tracker</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 36, color: sleepDebt > 2 ? RED : sleepDebt > 1 ? AMBER : A, lineHeight: 1 }}>{sleepDebt}h</div>
                      <div style={{ fontSize: 9, color: "#2a4a35" }}>accumulated sleep debt</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#1a3025" }}>7-day avg sleep</div>
                      <div style={{ fontFamily: HEAD, fontSize: 20, color: PURPLE }}>
                        {logs.length ? (logs.slice(0, 7).reduce((a, l) => a + (l.sleep || 7), 0) / Math.min(7, logs.length)).toFixed(1) : "7.0"}h
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: BOR, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${Math.min(100, (sleepDebt / 5) * 100)}%` }} transition={{ duration: 1.4 }}
                      style={{ height: "100%", background: sleepDebt > 2 ? RED : sleepDebt > 1 ? AMBER : A }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#1a3025", marginTop: 8 }}>Each hour of sleep debt reduces cognitive performance by ~15% and increases injury risk by 60%. Target: 0–0.5h debt.</div>
                </Card>

                {/* Strain history */}
                {chartData.length >= 3 && (
                  <Card>
                    <SectionLabel>Strain vs Recovery Trend</SectionLabel>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                          <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                          <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="recovery" name="Recovery%" stroke={A} strokeWidth={2} dot={{ fill: A, r: 2 }} />
                          <Line type="monotone" dataKey="strain" name="Strain" stroke={RED} strokeWidth={2} dot={{ fill: RED, r: 2 }} strokeDasharray="4 2" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: 9, color: "#1a3025", marginTop: 6 }}>
                      When strain consistently exceeds recovery, burnout risk rises. Maintain balance.
                    </div>
                  </Card>
                )}

                {/* HRV trend */}
                {chartData.length >= 3 && (
                  <Card>
                    <SectionLabel>HRV Trend (Heart Rate Variability)</SectionLabel>
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ROSE} stopOpacity={.3} /><stop offset="100%" stopColor={ROSE} stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                          <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                          <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="hrv" name="HRV ms" stroke={ROSE} fill="url(#hG)" strokeWidth={2} dot={{ fill: ROSE, r: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: 9, color: "#1a3025", marginTop: 6 }}>Higher HRV = better autonomic nervous system health and stress resilience. Target: ≥ 50ms.</div>
                  </Card>
                )}

                <GreenBtn onClick={() => setShowLog(true)} icon="📝" style={{ width: "100%" }}>Log Biometrics</GreenBtn>
              </div>
            )}

            {/* ══════════════ ★ WW: NUTRITION ══════════════ */}
            {tab === "ww" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>WW NUTRITION SYSTEM</div>
                  <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>NutriPoints budget · Food log · Non-scale victories</div>
                </div>

                {/* Points budget hero */}
                <Card glow color={foodRemaining < 0 ? RED : foodRemaining < 5 ? AMBER : A}>
                  <SectionLabel>Daily NutriPoints Budget</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 52, color: foodRemaining < 0 ? RED : foodRemaining < 5 ? AMBER : A, lineHeight: 1 }}>{foodRemaining}</div>
                      <div style={{ fontSize: 10, color: "#2a4a35" }}>points remaining today</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#1a3025" }}>Used</div>
                      <div style={{ fontFamily: HEAD, fontSize: 24, color: AMBER }}>{foodPts}</div>
                      <div style={{ fontSize: 9, color: "#1a3025", marginTop: 4 }}>Budget</div>
                      <div style={{ fontFamily: HEAD, fontSize: 24, color: "#2a4a35" }}>{DAILY_POINTS_BUDGET}</div>
                    </div>
                  </div>
                  <div style={{ height: 10, background: BOR, overflow: "hidden", borderRadius: 1 }}>
                    <motion.div animate={{ width: `${Math.min(100, (foodPts / DAILY_POINTS_BUDGET) * 100)}%` }} transition={{ duration: 1.2 }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${A},${AMBER},${foodRemaining < 0 ? RED : AMBER})` }} />
                  </div>
                  <GreenBtn onClick={() => setShowFood(true)} color={AMBER} icon="🍽️" style={{ width: "100%", marginTop: 12 }}>Log Food</GreenBtn>
                </Card>

                {/* Macros summary */}
                {foodLog.length > 0 && (
                  <Card>
                    <SectionLabel>Today's Nutrition Summary</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {[
                        { l: "Calories", v: foodLog.reduce((a, f) => a + f.cal, 0), unit: "kcal", color: AMBER },
                        { l: "Protein",  v: foodLog.reduce((a, f) => a + f.protein, 0), unit: "g", color: ROSE },
                        { l: "Fiber",    v: foodLog.reduce((a, f) => a + f.fiber, 0), unit: "g", color: TEAL },
                      ].map(({ l, v, unit, color }) => (
                        <div key={l} style={{ textAlign: "center", padding: "10px 8px", background: "#050e08", border: `1px solid ${BOR}` }}>
                          <div style={{ fontSize: 7, color: "#1a3025", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                          <div style={{ fontFamily: HEAD, fontSize: 22, color, lineHeight: 1 }}>{v}</div>
                          <div style={{ fontSize: 8, color: "#1a3025" }}>{unit}</div>
                        </div>
                      ))}
                    </div>
                    {/* Meal breakdown */}
                    {["breakfast","lunch","dinner","snack"].map(meal => {
                      const items = foodLog.filter(f => f.meal === meal);
                      if (!items.length) return null;
                      return (
                        <div key={meal} style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 9, color: AMBER, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6, fontFamily: FONT }}>{meal}</div>
                          {items.map((f, i) => (
                            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", borderBottom: `1px solid ${BOR}` }}>
                              <span style={{ fontSize: 14 }}>{f.emoji}</span>
                              <div style={{ flex: 1, fontSize: 10, color: "#7ab894", fontFamily: FONT }}>{f.name}</div>
                              <div style={{ fontFamily: HEAD, fontSize: 13, color: f.points <= 2 ? A : f.points <= 5 ? AMBER : RED }}>{f.points}p</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </Card>
                )}

                {/* Non-Scale Victories */}
                <Card glow color={TEAL}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <SectionLabel style={{ marginBottom: 2 }}>Non-Scale Victories</SectionLabel>
                      <div style={{ fontFamily: HEAD, fontSize: 18, color: TEAL }}>{nsvWins.length} wins today 🏆</div>
                    </div>
                    <GreenBtn onClick={() => setShowNSV(true)} color={TEAL} variant="ghost" icon="🏆" style={{ fontSize: 11, padding: "8px 14px" }}>Add Win</GreenBtn>
                  </div>
                  {nsvWins.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {nsvWins.map((w, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: i * 0.05 }}
                          style={{ padding: "5px 10px", background: `${TEAL}14`, border: `1px solid ${TEAL}44`, fontSize: 9, color: TEAL, fontFamily: FONT }}>
                          {w}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: "#1a3025", fontFamily: FONT }}>Tap "Add Win" to celebrate today's healthy choices — the scale isn't the only measure of progress.</div>
                  )}
                </Card>

                {/* Weekly coach nudge */}
                <Card>
                  <SectionLabel>Coach Nudge</SectionLabel>
                  <div style={{ fontSize: 11, color: "#3a5a45", lineHeight: 1.9 }}>
                    {foodPts > DAILY_POINTS_BUDGET ? `You're ${foodPts - DAILY_POINTS_BUDGET} pts over today. No guilt — tomorrow is a fresh start. Focus on whole foods and water.` :
                     foodPts < 5 ? "Haven't logged yet today? Even tracking 3 meals gives meaningful pattern data over 30 days." :
                     foodRemaining > 15 ? "You have plenty of NutriPoints left — great time to add protein or a serving of vegetables." :
                     "Great balance today! Consistency over 30 days is what drives real change, not perfection."}
                  </div>
                </Card>

                {/* Points guide */}
                <Card>
                  <SectionLabel>NutriPoints Guide</SectionLabel>
                  {[
                    { range: "0–2 pts", label: "ZeroPoint foods", desc: "Eat freely — fruits, most vegetables, lean proteins", color: A },
                    { range: "3–5 pts", label: "Moderate", desc: "Wholegrains, dairy, healthy fats — good in balance", color: TEAL },
                    { range: "6–9 pts", label: "Use mindfully", desc: "Processed snacks — enjoy occasionally", color: AMBER },
                    { range: "10+ pts",  label: "Occasional treats", desc: "High-calorie items — plan these intentionally", color: RED },
                  ].map(({ range, label, desc, color }) => (
                    <div key={range} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${BOR}` }}>
                      <div style={{ minWidth: 42, fontFamily: HEAD, fontSize: 11, color, flexShrink: 0 }}>{range}</div>
                      <div>
                        <div style={{ fontSize: 10, color: "#9ac8b4", fontFamily: FONT }}>{label}</div>
                        <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* ══════════════ 90-DAY ROADMAP ══════════════ */}
            {tab === "roadmap" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>90-DAY PREVENTION ROADMAP</div>
                <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.7 }}>
                  Journey started <strong style={{ color: A }}>{roadmap.startDate}</strong>. Real calendar-day tracking — no resets.
                </div>

                <Card glow>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <SectionLabel style={{ marginBottom: 0 }}>Overall Progress</SectionLabel>
                    <div style={{ fontFamily: HEAD, fontSize: 22, color: A }}>{roadmap.pct}%</div>
                  </div>
                  <div style={{ height: 8, background: BOR, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${roadmap.pct}%` }} transition={{ duration: 1.6, ease: "easeOut" }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${BLUE},${A},${AMBER})` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#1a3025", marginTop: 4 }}>
                    <span>Day 1</span><span>Day 30</span><span>Day 60</span><span>Day 90</span>
                  </div>
                </Card>

                {ROADMAP_PHASES.map(ph => {
                  const startDay = ph.phase === 1 ? 1 : ph.phase === 2 ? 31 : 61;
                  const endDay   = ph.phase === 1 ? 30 : ph.phase === 2 ? 60 : 90;
                  const active = roadmap.day >= startDay && roadmap.day <= endDay;
                  const done   = roadmap.day > endDay;
                  return (
                    <Card key={ph.phase} style={{ position: "relative", overflow: "hidden", borderColor: active ? `${ph.color}55` : BOR }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: active ? `linear-gradient(90deg,transparent,${ph.color},transparent)` : "transparent" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 700, color: ph.color }}>Phase {ph.phase}: {ph.title}</div>
                          <div style={{ fontSize: 9, color: "#1a3025", marginTop: 2 }}>Days {ph.days}</div>
                        </div>
                        <div style={{ fontSize: 9, padding: "4px 10px", background: done ? `${A}14` : active ? `${ph.color}14` : "#050e08", border: `1px solid ${done ? A : active ? ph.color : BOR}`, color: done ? A : active ? ph.color : "#1a3025", textTransform: "uppercase", letterSpacing: ".1em" }}>
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
                  <SectionLabel>Streak</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: HEAD, fontSize: 36, color: AMBER, lineHeight: 1 }}>🔥 {streak.count}</div>
                      <div style={{ fontSize: 9, color: "#2a4a35", marginTop: 3 }}>consecutive days — all habits</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 8, color: "#1a3025", textTransform: "uppercase", letterSpacing: ".14em" }}>Last recorded</div>
                      <div style={{ fontSize: 11, color: A }}>{streak.lastDate || "Not yet"}</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════════ TRENDS ══════════════ */}
            {tab === "trends" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>HEALTH TRENDS</div>

                {logs.length < 3 ? (
                  <Card style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontFamily: HEAD, fontSize: 18, color: "#1a3025", marginBottom: 8 }}>No Data Yet</div>
                    <div style={{ fontSize: 10, color: "#1a3025", lineHeight: 1.7 }}>Log health 3+ times to unlock trend charts.</div>
                    <GreenBtn onClick={() => setShowLog(true)} style={{ marginTop: 16, width: "100%" }} icon="📝">Log Now</GreenBtn>
                  </Card>
                ) : (
                  <>
                    {/* Radar — health domains */}
                    <Card>
                      <SectionLabel>Health Domain Radar</SectionLabel>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke={BOR2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#2a4a35", fontSize: 9 }} />
                            <Radar name="You" dataKey="A" stroke={A} fill={A} fillOpacity={0.2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Readiness + Recovery */}
                    <Card>
                      <SectionLabel>Readiness & Recovery Trend</SectionLabel>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A} stopOpacity={.3}/><stop offset="100%" stopColor={A} stopOpacity={0}/></linearGradient>
                              <linearGradient id="recG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE} stopOpacity={.2}/><stop offset="100%" stopColor={BLUE} stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" />
                            <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                            <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="readiness" name="Readiness" stroke={A} fill="url(#rG)" strokeWidth={2} dot={{ fill: A, r: 3 }} />
                            <Area type="monotone" dataKey="recovery" name="Recovery%" stroke={BLUE} fill="url(#recG)" strokeWidth={2} dot={{ fill: BLUE, r: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Card>
                        <SectionLabel>Mood & Energy</SectionLabel>
                        <div style={{ height: 160 }}>
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
                        <div style={{ height: 160 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="2 4" stroke="#0d2018" vertical={false} />
                              <XAxis dataKey="day" stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} />
                              <YAxis stroke="#1a3025" tick={{ fontSize: 8, fill: "#2a4a35" }} domain={[0, 10]} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="stress" name="Stress" radius={[2,2,0,0]}>
                                {chartData.map((d, i) => <Cell key={i} fill={d.stress > 6 ? RED : d.stress > 4 ? AMBER : A} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>

                    <Card>
                      <SectionLabel>Recent Log Entries</SectionLabel>
                      {logs.slice(0, 7).map((l) => (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BOR}`, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 8, color: "#1a3025", minWidth: 60, fontFamily: FONT }}>
                            {new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                          {[
                            { l: "Mood", v: l.mood, c: A }, { l: "Energy", v: l.energy, c: AMBER },
                            { l: "Stress", v: l.stress, c: l.stress > 5 ? RED : TEAL },
                            { l: "Sleep", v: l.sleep+"h", c: PURPLE }, { l: "HRV", v: l.hrv, c: ROSE },
                            { l: "Steps", v: (l.steps/1000)?.toFixed(1)+"k", c: TEAL },
                          ].map(({ l: lbl, v, c }) => (
                            <div key={lbl} style={{ textAlign: "center", minWidth: 36 }}>
                              <div style={{ fontSize: 7, color: "#1a3025", letterSpacing: ".08em", textTransform: "uppercase" }}>{lbl}</div>
                              <div style={{ fontSize: 11, fontFamily: HEAD, color: c, fontWeight: 700 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ══════════════ WHO ══════════════ */}
            {tab === "who" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: "#f0f8f4" }}>WHO EVIDENCE BASE</div>
                <div style={{ fontSize: 10, color: "#2a4a35", lineHeight: 1.8 }}>
                  ManifiX Prevent v7.0 is built on the WHO ICD-11 Framework and SDG 3.4/3.8. Every habit, score, and recommendation maps to evidence-based preventive medicine.
                </div>

                {Object.entries(WHO_DOMAINS).map(([key, d]) => (
                  <Card key={key} style={{ position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${d.color},transparent)` }} />
                    <button className="ph-btn" onClick={() => setWhoOpen(whoOpen === key ? null : key)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", padding: 0, textAlign: "left" }}>
                      <div>
                        <div style={{ fontSize: 8, letterSpacing: ".16em", color: "#1a3025", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT }}>{d.code}</div>
                        <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 700, color: d.color }}>{d.label}</div>
                      </div>
                      <motion.div animate={{ rotate: whoOpen === key ? 180 : 0 }} style={{ color: d.color, fontSize: 16 }}>▼</motion.div>
                    </button>
                    <AnimatePresence>
                      {whoOpen === key && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                          <div style={{ paddingTop: 14 }}>
                            {d.stats.map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: i === 0 ? "#3a5a45" : "#2a4a35", lineHeight: 1.7, borderLeft: `3px solid ${i === 0 ? d.color : BOR2}`, paddingLeft: 10, marginBottom: 7 }}>{s}</div>
                            ))}
                            <div style={{ marginTop: 10, padding: "10px 12px", background: "#050e08", border: `1px solid ${BOR2}` }}>
                              <div style={{ fontSize: 8, color: "#1a3025", marginBottom: 4, fontFamily: FONT }}>{d.sdg}</div>
                              <div style={{ fontSize: 10, color: d.color }}>{d.action}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}

                <Card>
                  <SectionLabel>Habit Evidence Mapping</SectionLabel>
                  {DEFAULT_HABITS.map(h => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#7ab894", fontFamily: FONT }}>{h.name}</div>
                        <div style={{ fontSize: 8, color: "#1a3025", marginTop: 2 }}>{h.who}</div>
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Competitive edge */}
                <Card glow color={CYAN}>
                  <SectionLabel>ManifiX v7 vs Competitors</SectionLabel>
                  {[
                    { feature: "Readiness Score (Oura-style)", mf: true, oura: true, whoop: false, ww: false },
                    { feature: "Sleep Stage Architecture",     mf: true, oura: true, whoop: false, ww: false },
                    { feature: "Body Temp Trend",              mf: true, oura: true, whoop: false, ww: false },
                    { feature: "Strain Score (Whoop-style)",   mf: true, oura: false, whoop: true, ww: false },
                    { feature: "Recovery % + HRV Trend",       mf: true, oura: true, whoop: true, ww: false },
                    { feature: "Burnout Risk Monitor",         mf: true, oura: false, whoop: true, ww: false },
                    { feature: "Sleep Debt Tracker",           mf: true, oura: false, whoop: true, ww: false },
                    { feature: "NutriPoints System (WW)",      mf: true, oura: false, whoop: false, ww: true },
                    { feature: "Non-Scale Victories",          mf: true, oura: false, whoop: false, ww: true },
                    { feature: "90-Day Prevention Roadmap",    mf: true, oura: false, whoop: false, ww: false },
                    { feature: "WHO ICD-11 Framework",         mf: true, oura: false, whoop: false, ww: false },
                    { feature: "HRV Breath Coach",             mf: true, oura: false, whoop: false, ww: false },
                    { feature: "Offline-First PWA",            mf: true, oura: false, whoop: false, ww: false },
                    { feature: "No Hardware Required",         mf: true, oura: false, whoop: false, ww: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${BOR}`, gap: 8 }}>
                      <div style={{ flex: 1, fontSize: 9, color: "#3a5a45", fontFamily: FONT }}>{row.feature}</div>
                      {[
                        { k: "mf", label: "ManifiX", color: A }
                      ].map(({ k, label, color }) => (
                        <div key={k} style={{ textAlign: "center", minWidth: 44 }}>
                          <div style={{ fontSize: 6, color: "#1a3025", letterSpacing: ".1em", marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 14, color: row[k] ? color : "#1a3025" }}>{row[k] ? "✓" : "·"}</div>
                        </div>
                      ))}
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
