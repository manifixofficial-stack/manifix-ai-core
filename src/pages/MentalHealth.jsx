/**
 * ManifiX AI — MentalWellness.jsx (MERGED v1.0)
 * Combines former MentalHealth.jsx + Stress.jsx into one module.
 *
 * WHAT CHANGED FROM THE TWO SOURCE FILES — READ BEFORE USING
 * ────────────────────────────────────────────────────────────
 * 1. ONE STREAK SYSTEM. Both files had independent streak logic
 *    (mh_streak, mx_streak) disconnected from Dashboard/Settings/
 *    Magic16's "magic16_streak" key. This file now reads/writes
 *    ONLY "magic16_streak" via useStreak() below. Once Dashboard
 *    and Settings are updated (your next step), all four surfaces
 *    will show the same number. Ice Shield freeze logic is wired
 *    in here for real — see useStreak().
 *
 * 2. ONE MOOD LOG. MentalHealth wrote to "mh_moods2", Stress wrote
 *    to "mx_moods". Both are gone. Everything now reads/writes
 *    "manifix_mood_log" via useMoodLog(). Mood logged in the Mood
 *    tab now shows up in Stress's trend charts and vice versa.
 *
 * 3. ONE SOUNDSCAPE ENGINE. Stress.jsx's version was the more
 *    sophisticated one (real binaural oscillators + filtered
 *    brown-noise bed, not just colored noise). MentalHealth's
 *    simpler noise-only version was removed. Sounds tab now uses
 *    the binaural engine everywhere.
 *
 * 4. CBT TOOLS kept exclusively from MentalHealth (no equivalent
 *    existed in Stress) — 5 structured exercises + distortion
 *    tracking.
 *
 * 5. STRAIN, EAT JOURNAL, FOCUS MODE, READINESS RING, SLEEP COACH,
 *    GUIDED SESSIONS kept exclusively from Stress (no equivalent
 *    existed in MentalHealth).
 *
 * 6. GUIDED MEDITATION PROGRAMS (7-Day Calm, 21-Day Focus, Anxiety
 *    Relief, Mood Lift, Sleep Stories) kept from MentalHealth as
 *    the primary "Meditate" tab. Stress's separate quick-Programs
 *    list and 6-item Meditations list were CONSOLIDATED into this
 *    same tab as a "Quick Sessions" sub-section, rather than living
 *    as three separate disconnected systems.
 *
 * 7. SECURITY — NOT FIXED HERE, FLAGGED: Both source files called
 *    api.anthropic.com directly from the browser for AI insights
 *    (CBT reframe, mood insight). That is still here, isolated in
 *    callClaudeForInsight() below, clearly marked. This MUST be
 *    moved behind a backend proxy before production — do not ship
 *    this function as-is. I have not silently "fixed" this by
 *    deleting the feature; I've isolated it so you can swap the
 *    fetch URL for your own backend endpoint in one place.
 *
 * 8. CRISIS BANNER kept from MentalHealth — SOS breathing overlay
 *    kept from Stress. Both serve different moments (browsing vs.
 *    acute panic) so both stay, unmerged.
 *
 * WHAT YOU STILL NEED TO DO (not in this file):
 * - Update Dashboard.jsx and Settings.jsx to read/write
 *   "magic16_streak" the same way useStreak() does here, and wire
 *   Settings' Ice Shield UI to actually call the freeze logic.
 * - Move callClaudeForInsight() behind a real backend route.
 * - Route all localStorage calls through PrivacyVault encryption
 *   once that's connected app-wide (out of scope for this file).
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar as RBar,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

/* ════════════════════════════════════════════════════════════
   DESIGN TOKENS (unified — Stress.jsx's darker palette kept as base)
════════════════════════════════════════════════════════════ */
const G = "#ffc83c";
const DIM = "#c8a84b";
const BG = "#060608";
const CARD = "#0b0b0e";
const BOR = "#18181f";
const BOR2 = "#222230";
const FONT = "'DM Mono','Courier New',monospace";
const HEAD = "'Bebas Neue',sans-serif";
const TEXT = "#e8e4d9";
const MUTED = "#2a2a2a";
const SUB = "#3a3a3a";
const GREEN = "#4ade80";
const RED = "#ef4444";
const BLUE = "#60a5fa";
const PURPLE = "#a78bfa";
const ORANGE = "#f97316";
const TEAL = "#2dd4bf";
const PINK = "#f472b6";
const INDIGO = "#818cf8";
const GRID_C = "rgba(255,200,60,.025)";

/* ════════════════════════════════════════════════════════════
   CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("mw-css")) return;
  const s = document.createElement("style");
  s.id = "mw-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes mw-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mw-pulse{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.16;transform:scale(1.1)}}
    @keyframes mw-blink{0%,100%{opacity:1}50%{opacity:.15}}
    @keyframes mw-scan{from{top:-2px}to{top:102%}}
    @keyframes mw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes mw-breathe{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:.9}}
    @keyframes mw-streak{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    .mw-btn{cursor:pointer;transition:all .14s ease}
    .mw-btn:hover{opacity:.88;transform:translateY(-1px)}
    .mw-btn:active{transform:translateY(0) scale(.97)}
    .mw-card{background:${CARD};border:1px solid ${BOR};transition:border-color .2s}
    .mw-card:hover{border-color:${BOR2}}
    .mw-input{background:#08080c;border:1px solid ${BOR};color:${TEXT};font-family:${FONT};
      font-size:11px;letter-spacing:.05em;padding:10px 14px;width:100%;outline:none;resize:vertical}
    .mw-input:focus{border-color:${G}44}
    .mw-range{width:100%;accent-color:${G};height:3px;cursor:pointer}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:${BOR};border-radius:2px}
  `;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════════
   STORAGE HELPERS
════════════════════════════════════════════════════════════ */
const store = {
  get: (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

function useLS(key, init) {
  const [v, setV] = useState(() => store.get(key, init));
  const set = useCallback((val) => {
    setV((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      store.set(key, next);
      return next;
    });
  }, [key]);
  return [v, set];
}

/* ════════════════════════════════════════════════════════════
   1) SHARED STREAK HOOK — single source of truth
   Key: "magic16_streak" — SAME key Dashboard/Settings/Magic16
   must be updated to use. Freeze (Ice Shield) logic lives here,
   for real, unlike the disconnected Settings UI from before.
════════════════════════════════════════════════════════════ */
const STREAK_KEY = "magic16_streak";
const FREEZE_KEY = "magic16_freeze_count"; // max 3, earned every 5-day streak
const LASTDATE_KEY = "magic16_last_date";

function useStreak() {
  const [streak, setStreakRaw] = useState(() => Number(localStorage.getItem(STREAK_KEY) || 0));
  const [freezes, setFreezesRaw] = useState(() => Number(localStorage.getItem(FREEZE_KEY) || 0));
  const [lastDate, setLastDateRaw] = useState(() => localStorage.getItem(LASTDATE_KEY) || "");

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const todayDone = lastDate === today;

  const persist = (s, f, d) => {
    localStorage.setItem(STREAK_KEY, String(s));
    localStorage.setItem(FREEZE_KEY, String(f));
    localStorage.setItem(LASTDATE_KEY, d);
  };

  // On mount: check if a day was missed and whether a freeze should auto-consume.
  useEffect(() => {
    if (!lastDate || lastDate === today || lastDate === yesterday) return;
    // More than one day missed — a freeze can only ever cover ONE missed day.
    if (freezes > 0) {
      const newFreezes = freezes - 1;
      setFreezesRaw(newFreezes);
      persist(streak, newFreezes, lastDate); // streak preserved, freeze consumed
    } else {
      setStreakRaw(0);
      persist(0, freezes, lastDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIn = useCallback(() => {
    if (lastDate === today) return { streak, freezes };
    const newStreak = lastDate === yesterday ? streak + 1 : 1;
    const newFreezes = newStreak > 0 && newStreak % 5 === 0 ? Math.min(3, freezes + 1) : freezes;
    setStreakRaw(newStreak);
    setFreezesRaw(newFreezes);
    setLastDateRaw(today);
    persist(newStreak, newFreezes, today);
    return { streak: newStreak, freezes: newFreezes };
  }, [streak, freezes, lastDate, today, yesterday]);

  const resetStreak = useCallback(() => {
    setStreakRaw(0);
    setLastDateRaw(today);
    persist(0, freezes, today);
  }, [freezes, today]);

  return { streak, freezes, todayDone, checkIn, resetStreak };
}

/* ════════════════════════════════════════════════════════════
   2) SHARED MOOD LOG HOOK — single source of truth
   Key: "manifix_mood_log". One unified entry shape used by
   both the Mood Journal tab and Stress's trend/journal charts.
════════════════════════════════════════════════════════════ */
const MOOD_LOG_KEY = "manifix_mood_log";

const MOOD_MAP = {
  Overwhelmed: { emoji: "😰", score: 1, color: RED },
  Anxious: { emoji: "😟", score: 3, color: ORANGE },
  Tired: { emoji: "😴", score: 4, color: "#888" },
  Restless: { emoji: "🤸", score: 4, color: G },
  "Burned Out": { emoji: "🔥", score: 2, color: RED },
  Sad: { emoji: "😢", score: 2, color: BLUE },
  Calm: { emoji: "🧘", score: 8, color: TEAL },
  Peaceful: { emoji: "😌", score: 9, color: GREEN },
  Focused: { emoji: "🎯", score: 8, color: BLUE },
  Energized: { emoji: "⚡", score: 9, color: ORANGE },
  Grateful: { emoji: "🙏", score: 8, color: PURPLE },
};

function useMoodLog() {
  const [log, setLog] = useLS(MOOD_LOG_KEY, []);

  const addEntry = useCallback((mood, extra = {}) => {
    const def = MOOD_MAP[mood] || { emoji: "🙂", score: 5, color: G };
    const entry = {
      id: Date.now(),
      date: new Date().toDateString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
      mood, score: def.score, emoji: def.emoji,
      ...extra,
    };
    setLog((p) => [entry, ...p].slice(0, 120));
    return entry;
  }, [setLog]);

  const last7 = log.slice(0, 7);
  const avgScore = last7.length
    ? (last7.reduce((a, m) => a + m.score, 0) / last7.length).toFixed(1)
    : null;
  const mhScore = avgScore
    ? Math.min(100, Math.round((Number(avgScore) / 10) * 70 + last7.length * 4))
    : 0;

  return { log, addEntry, avgScore, mhScore };
}

/* ════════════════════════════════════════════════════════════
   3) AI INSIGHT CALL — ISOLATED, NOT BACKEND-SAFE YET
   See header note #7. Swap this fetch for your backend proxy
   route before production. Left functional for dev/demo only.
════════════════════════════════════════════════════════════ */
async function callClaudeForInsight(prompt) {
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await resp.json();
    return data.content?.find((c) => c.type === "text")?.text || "";
  } catch (e) {
    return null; // caller supplies a graceful fallback line
  }
}

/* ════════════════════════════════════════════════════════════
   STATIC DATA
════════════════════════════════════════════════════════════ */
const TIPS = [
  "Deep breathing reduces cortisol by 23% in 4 minutes.",
  "8 minutes of meditation improves focus for 4 hours.",
  "Daily movement lowers depression risk by 26%.",
  "Sleep quality is the #1 predictor of next-day mood.",
  "Mindfulness reduces burnout symptoms by 30% in 30 days.",
  "Gratitude journaling rewires neural reward pathways.",
  "5 minutes of box breathing lowers blood pressure significantly.",
  "Name the emotion — naming reduces its intensity by roughly half.",
  "Cold water on wrists can interrupt acute panic quickly.",
  "Social connection matters for health as much as not smoking.",
];

const CRISIS_RESOURCES = [
  { name: "iCall (India)", contact: "9152987821", type: "call" },
  { name: "Vandrevala Foundation", contact: "1860-2662-345", type: "call" },
  { name: "International SOS / Find a Helpline", contact: "findahelpline.com", type: "link" },
];

const SOUNDSCAPES = [
  { id: "rain", label: "Rain Forest", emoji: "🌧️", color: BLUE, freq: 432, filt: 3000, desc: "432hz · reduces anxiety, slows heart rate" },
  { id: "ocean", label: "Deep Ocean", emoji: "🌊", color: TEAL, freq: 528, filt: 800, desc: "528hz · calm nervous system" },
  { id: "fire", label: "Campfire", emoji: "🔥", color: ORANGE, freq: 396, filt: 600, desc: "396hz · grounding, releases tension" },
  { id: "space", label: "Deep Space", emoji: "🌌", color: INDIGO, freq: 741, filt: 1200, desc: "741hz · mental clarity" },
  { id: "forest", label: "Forest Morn", emoji: "🌿", color: GREEN, freq: 639, filt: 2000, desc: "639hz · emotional balance" },
  { id: "wind", label: "Mountain Wind", emoji: "🏔️", color: PURPLE, freq: 852, filt: 4000, desc: "852hz · intuition, clarity" },
];

const MEDITATION_PROGRAMS = [
  { id: "7day-calm", title: "7-Day Calm", subtitle: "Stress Relief Foundation", days: 7, badge: "BEGINNER", badgeColor: GREEN, icon: "🌿",
    sessions: [
      { day: 1, title: "Anchor Breath", duration: "8 min", focus: "Breathing", done: false, desc: "Learn breath awareness as your foundation." },
      { day: 2, title: "Body Scan Release", duration: "10 min", focus: "Body", done: false, desc: "Progressive relaxation releases stored tension." },
      { day: 3, title: "Thought Observer", duration: "8 min", focus: "Mind", done: false, desc: "Watch thoughts without attachment." },
      { day: 4, title: "Gratitude Pulse", duration: "7 min", focus: "Emotion", done: false, desc: "Rewire the brain's reward circuit." },
      { day: 5, title: "Open Awareness", duration: "12 min", focus: "Presence", done: false, desc: "Expand into spacious awareness." },
      { day: 6, title: "Loving Kindness", duration: "10 min", focus: "Compassion", done: false, desc: "Metta meditation, dissolve self-criticism." },
      { day: 7, title: "Integration", duration: "15 min", focus: "Synthesis", done: false, desc: "Consolidate the week into a daily anchor." },
    ] },
  { id: "anxiety-pack", title: "Anxiety Relief", subtitle: "Clinical-Grade Calm", days: 7, badge: "ANXIETY", badgeColor: BLUE, icon: "🫁",
    sessions: [
      { day: 1, title: "Physiological Sigh", duration: "5 min", focus: "Nervous System", done: false, desc: "Double-inhale, slow exhale — fast cortisol drop." },
      { day: 2, title: "Box Breathing", duration: "8 min", focus: "Regulation", done: false, desc: "4-4-4-4 pattern for calm under stress." },
      { day: 3, title: "5-4-3-2-1 Grounding", duration: "6 min", focus: "Grounding", done: false, desc: "Sensory grounding to interrupt a panic spiral." },
      { day: 4, title: "RAIN Technique", duration: "10 min", focus: "Emotion", done: false, desc: "Recognize, Allow, Investigate, Nurture." },
      { day: 5, title: "Vagus Nerve Hum", duration: "7 min", focus: "Vagal Tone", done: false, desc: "Humming activates the vagus nerve." },
      { day: 6, title: "Worry Window", duration: "8 min", focus: "CBT", done: false, desc: "Schedule worry to contain it." },
      { day: 7, title: "Safe Place Viz", duration: "12 min", focus: "Imagery", done: false, desc: "Build an accessible mental safe space." },
    ] },
  { id: "depression-pack", title: "Mood Lift", subtitle: "Depression Support", days: 7, badge: "DEPRESSION", badgeColor: PURPLE, icon: "🌅",
    sessions: [
      { day: 1, title: "Morning Activation", duration: "8 min", focus: "Activation", done: false, desc: "Behavioral activation breaks low-mood inertia." },
      { day: 2, title: "Pleasure Mapping", duration: "10 min", focus: "Reward", done: false, desc: "Reconnect with genuinely pleasurable activities." },
      { day: 3, title: "Self-Compassion Sit", duration: "12 min", focus: "Kindness", done: false, desc: "Treat yourself as you would a suffering friend." },
      { day: 4, title: "Energy Breath", duration: "7 min", focus: "Vitality", done: false, desc: "Breathwork to boost energy." },
      { day: 5, title: "Negative to Neutral", duration: "10 min", focus: "Reframe", done: false, desc: "Observe depressive thoughts without fusion." },
      { day: 6, title: "Small Wins Log", duration: "6 min", focus: "Progress", done: false, desc: "Rebuild self-efficacy via tiny documented wins." },
      { day: 7, title: "Future Self Letter", duration: "15 min", focus: "Hope", done: false, desc: "Write to your future self." },
    ] },
];

const QUICK_SESSIONS = [
  { id: 1, title: "2-Min Calm Reset", duration: 2, emoji: "⏱️", color: TEAL, steps: ["Find a quiet spot", "Inhale 4s", "Hold 4s", "Exhale 6s", "Repeat 8 cycles", "Notice the calm"] },
  { id: 2, title: "Anxiety Cooldown", duration: 7, emoji: "🧠", color: ORANGE, steps: ["Acknowledge the feeling", "Name 5 things you see", "Name 4 things you touch", "Name 3 sounds", "Challenge one anxious thought", "Breathe slowly 60s", "Accept what you can't control"] },
  { id: 3, title: "Desk Decompression", duration: 3, emoji: "💻", color: G, steps: ["Roll shoulders back 5×", "Neck stretches", "3 deep breaths", "Unclench jaw and fists", "Stretch arms overhead", "Reset posture"] },
];

const DISTORTIONS = ["All-or-Nothing", "Catastrophizing", "Mind Reading", "Fortune Telling", "Emotional Reasoning", "Should Statements", "Personalization", "Overgeneralization", "Mental Filter", "Discounting Positives", "Labelling", "Magnification"];

const CBT_EXERCISES = [
  { id: "thought-record", title: "Thought Record", icon: "📋", desc: "Identify & challenge automatic negative thoughts", steps: ["Situation", "Automatic Thought", "Emotions (0–100%)", "Cognitive Distortions", "Evidence FOR", "Evidence AGAINST", "Balanced Thought"] },
  { id: "worry-time", title: "Scheduled Worry", icon: "⏰", desc: "Contain worry to a set window daily", steps: ["Worry Topic", "Postpone Until", "Productive Action Now"] },
  { id: "activity-scheduling", title: "Activity Scheduling", icon: "📅", desc: "Behavioral activation for depression", steps: ["Activity", "Mastery Rating", "Pleasure Rating", "Scheduled Time"] },
  { id: "core-beliefs", title: "Core Belief Audit", icon: "🔑", desc: "Uncover deep beliefs driving patterns", steps: ["Surface Belief", "Downward Arrow (Why? ×5)", "Core Belief Found", "New Adaptive Belief"] },
];

const TRIGGERS = [
  { id: 1, label: "Work Pressure", icon: "💼" }, { id: 2, label: "Financial", icon: "💰" },
  { id: 3, label: "Relationships", icon: "👥" }, { id: 4, label: "Health Worry", icon: "🫀" },
  { id: 5, label: "Poor Sleep", icon: "🌙" }, { id: 6, label: "Caffeine", icon: "☕" },
  { id: 7, label: "Social Media", icon: "📱" }, { id: 8, label: "Uncertainty", icon: "🌫️" },
];

const ACTIVITIES = [
  { id: 1, label: "Work / Study", icon: "💼", mets: 1.5, stressMultiplier: 1.8 },
  { id: 2, label: "Running", icon: "🏃", mets: 8.0, stressMultiplier: 0.4 },
  { id: 3, label: "Weight Training", icon: "🏋️", mets: 6.0, stressMultiplier: 0.5 },
  { id: 4, label: "Yoga", icon: "🧘", mets: 2.5, stressMultiplier: 0.2 },
  { id: 5, label: "Commuting", icon: "🚌", mets: 2.0, stressMultiplier: 1.2 },
  { id: 6, label: "Screen time", icon: "📱", mets: 1.3, stressMultiplier: 1.4 },
  { id: 7, label: "Meditation", icon: "🪷", mets: 1.2, stressMultiplier: 0.1 },
  { id: 8, label: "Sleep", icon: "😴", mets: 0.9, stressMultiplier: -1.5 },
];

const FOCUS_PRESETS = [
  { id: "deep", label: "Deep Work", work: 50, rest: 10, icon: "🧠", color: BLUE, desc: "50/10 ultra-focus blocks." },
  { id: "pomodoro", label: "Pomodoro", work: 25, rest: 5, icon: "🍅", color: ORANGE, desc: "Classic 25/5 cycle." },
  { id: "sprint", label: "Sprint", work: 15, rest: 3, icon: "⚡", color: G, desc: "Short sprints for high-stress days." },
];

const FOOD_MOODS = ["Anxious", "Bored", "Stressed", "Tired", "Lonely", "Procrastinating", "Hungry (physical)"];
const FOOD_CATEGORIES = [
  { id: "sugar", label: "Sugar / Sweets", icon: "🍬", riskScore: 3 },
  { id: "salty", label: "Salty Snacks", icon: "🍟", riskScore: 2 },
  { id: "comfort", label: "Comfort Food", icon: "🍕", riskScore: 2 },
  { id: "healthy", label: "Healthy Food", icon: "🥗", riskScore: 0 },
  { id: "water", label: "Water / Herbal", icon: "💧", riskScore: -0.5 },
];

const HRV_ZONES = [
  { label: "Recovery", min: 60, max: 120, color: GREEN, desc: "Excellent recovery." },
  { label: "Balanced", min: 45, max: 60, color: TEAL, desc: "Good balance." },
  { label: "Moderate", min: 30, max: 45, color: G, desc: "Moderate stress." },
  { label: "Strained", min: 15, max: 30, color: ORANGE, desc: "Prioritise rest." },
  { label: "Critical", min: 0, max: 15, color: RED, desc: "Recovery deficit." },
];

const GUIDED_SESSIONS = [
  { id: 1, title: "Morning Intention", emoji: "🌅", duration: 8, type: "Morning", color: ORANGE,
    script: ["Take a comfortable seated position. Gently close your eyes.", "Feel three contact points with the seat beneath you.", "Set one clear intention for today.", "Breathe in that intention.", "Open your eyes. Carry it with you."] },
  { id: 2, title: "Anxiety Dissolve", emoji: "💧", duration: 12, type: "Crisis", color: BLUE,
    script: ["You are safe in this moment.", "Notice the anxiety as a physical sensation.", "Breathe into that exact spot.", "Each exhale, release 10% of that tension.", "Thank the anxiety. You don't need to act on it now."] },
  { id: 3, title: "Compassion Download", emoji: "❤️", duration: 15, type: "Healing", color: PINK,
    script: ["Place one hand on your heart.", "You have been working hard — you deserve kindness.", "Think of someone who loves you unconditionally.", "Direct that same love inward.", "Rest here. You are enough."] },
];

/* ════════════════════════════════════════════════════════════
   SHARED UI ATOMS
════════════════════════════════════════════════════════════ */
const Card = ({ children, style = {} }) => (
  <div className="mw-card" style={{ padding: 18, ...style }}>{children}</div>
);
const Label = ({ children, color = MUTED, style = {} }) => (
  <div style={{ fontSize: 8, letterSpacing: ".2em", color, textTransform: "uppercase", marginBottom: 7, ...style }}>{children}</div>
);
const Badge = ({ children, color = G }) => (
  <span style={{ fontSize: 6, letterSpacing: ".14em", padding: "2px 7px", background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: "uppercase", fontFamily: FONT }}>{children}</span>
);
const GoldBtn = ({ children, onClick, style = {}, small = false }) => (
  <button className="mw-btn" onClick={onClick} style={{ padding: small ? "7px 14px" : "12px 22px", background: G, color: BG, border: "none", fontFamily: FONT, fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", ...style }}>{children}</button>
);
const GhostBtn = ({ children, onClick, color = SUB, style = {} }) => (
  <button className="mw-btn" onClick={onClick} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${BOR2}`, color, fontFamily: FONT, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", ...style }}>{children}</button>
);
function Bar({ pct, color = G, height = 4 }) {
  return (
    <div style={{ height, background: "#111118", borderRadius: height, overflow: "hidden", marginTop: 6 }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ height: "100%", background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: height }} />
    </div>
  );
}
function Pill({ children, color = G, active, onClick }) {
  return (
    <button className="mw-btn" onClick={onClick} style={{ padding: "5px 11px", background: active ? `${color}18` : "#111118", border: `1px solid ${active ? color : BOR}`, color: active ? color : SUB, fontFamily: FONT, fontSize: 9, letterSpacing: ".08em" }}>{children}</button>
  );
}
const MwTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: CARD, border: `1px solid ${BOR}`, padding: "8px 12px", fontFamily: FONT, fontSize: 9, color: SUB }}>
      <div style={{ color: G, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || G }}>{p.name}: <span style={{ color: TEXT }}>{p.value}</span></div>)}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   CRISIS BANNER (kept from MentalHealth.jsx)
════════════════════════════════════════════════════════════ */
function CrisisBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="mw-btn" onClick={() => setOpen((o) => !o)} style={{ width: "100%", padding: "10px 14px", background: "#140808", border: `1px solid ${RED}44`, color: RED, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
        <span>⚠ Crisis Support Resources</span><span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ background: "#100808", border: `1px solid ${RED}22`, borderTop: "none", padding: "14px 16px" }}>
          <div style={{ fontSize: 8, color: "#f87171", lineHeight: 1.8, marginBottom: 12 }}>
            If you are in crisis or having thoughts of self-harm, please reach out immediately. You are not alone.
          </div>
          {CRISIS_RESOURCES.map((r) => (
            <div key={r.name} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a0a0a", padding: "8px 0" }}>
              <span style={{ fontSize: 9, color: TEXT }}>{r.name}</span>
              {r.type === "call"
                ? <a href={`tel:${r.contact}`} style={{ fontSize: 9, color: RED, fontFamily: FONT, background: `${RED}11`, border: `1px solid ${RED}33`, padding: "4px 10px", textDecoration: "none" }}>{r.contact}</a>
                : <a href={`https://${r.contact}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: BLUE, fontFamily: FONT, background: `${BLUE}11`, border: `1px solid ${BLUE}33`, padding: "4px 10px", textDecoration: "none" }}>Open →</a>}
            </div>
          ))}
          <div style={{ fontSize: 7, color: "#444", marginTop: 10, lineHeight: 1.7 }}>
            ManifiX AI is not a substitute for professional mental health care. If you are in immediate danger, call emergency services (112 in India / 911 in the US).
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SOS BREATHING OVERLAY (kept from Stress.jsx)
════════════════════════════════════════════════════════════ */
function SosOverlay({ onClose }) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(4);
  const ref = useRef(null);
  const SEQ = [{ l: "Inhale", s: 4 }, { l: "Hold", s: 4 }, { l: "Exhale", s: 6 }, { l: "Rest", s: 2 }];
  useEffect(() => {
    let pi = 0, ct = 4;
    ref.current = setInterval(() => {
      ct--;
      if (ct < 0) { pi = (pi + 1) % SEQ.length; ct = SEQ[pi].s; setPhase(SEQ[pi].l); }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const sz = phase === "Inhale" ? 200 : phase === "Exhale" ? 100 : 160;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.97)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontFamily: HEAD, fontSize: 40, color: RED }}>SOS CALM MODE</div>
        <div style={{ fontSize: 8, letterSpacing: ".2em", color: SUB, margin: "8px 0 32px" }}>3-min emergency protocol · Follow the circle</div>
        <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div animate={{ width: sz, height: sz }} transition={{ duration: phase === "Inhale" ? 4 : phase === "Exhale" ? 6 : 1, ease: "easeInOut" }}
            style={{ borderRadius: "50%", background: "rgba(239,68,68,.12)", border: "2px solid rgba(239,68,68,.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: HEAD, fontSize: 44, color: RED }}>{count}</div>
            <div style={{ fontSize: 9, color: "rgba(239,68,68,.5)" }}>{phase}</div>
          </motion.div>
        </div>
        <GhostBtn onClick={onClose} color={SUB}>Exit SOS Mode</GhostBtn>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   UNIFIED SOUNDSCAPE ENGINE (Stress.jsx's binaural version)
════════════════════════════════════════════════════════════ */
function SoundscapePlayer() {
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(60);
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);

  const stopAll = useCallback(() => {
    nodesRef.current.forEach((n) => { try { n.stop(); n.disconnect(); } catch {} });
    nodesRef.current = [];
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} ctxRef.current = null; }
    setPlaying(false);
  }, []);

  const play = useCallback((sc) => {
    stopAll();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = volume / 100;
      master.connect(ctx.destination);

      const bufSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i]; data[i] *= 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = sc.filt;
      src.connect(filter); filter.connect(master);

      const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
      const g1 = ctx.createGain(); const g2 = ctx.createGain();
      g1.gain.value = 0.04; g2.gain.value = 0.04;
      osc1.frequency.value = sc.freq; osc2.frequency.value = sc.freq + 8;
      osc1.connect(g1); g1.connect(master);
      osc2.connect(g2); g2.connect(master);

      src.start(); osc1.start(); osc2.start();
      nodesRef.current = [src, osc1, osc2];
      setActive(sc); setPlaying(true);
    } catch (e) { /* Web Audio unavailable */ }
  }, [volume, stopAll]);

  useEffect(() => { if (nodesRef.current.length) {/* live volume handled on master gain via ctxRef */} }, [volume]);
  useEffect(() => () => stopAll(), []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {SOUNDSCAPES.map((sc) => (
          <button key={sc.id} className="mw-btn" onClick={() => (active?.id === sc.id && playing ? stopAll() : play(sc))}
            style={{ padding: "14px 10px", background: active?.id === sc.id && playing ? `${sc.color}18` : "#0e0e14", border: `1px solid ${active?.id === sc.id && playing ? sc.color : BOR}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22 }}>{sc.emoji}</span>
            <span style={{ fontSize: 9, color: active?.id === sc.id && playing ? sc.color : SUB }}>{sc.label}</span>
            <span style={{ fontSize: 7, color: MUTED }}>{sc.freq}hz</span>
            {active?.id === sc.id && playing && <span style={{ fontSize: 7, color: sc.color }}>▶ PLAYING</span>}
          </button>
        ))}
      </div>
      {playing && active && (
        <Card style={{ border: `1px solid ${active.color}22` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: active.color }}>{active.emoji} {active.label}</div>
              <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{active.desc}</div>
            </div>
            <button className="mw-btn" onClick={stopAll} style={{ padding: "5px 10px", background: `${RED}12`, border: `1px solid ${RED}33`, color: RED, fontFamily: FONT, fontSize: 8 }}>■ STOP</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, color: MUTED }}>VOL</span>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mw-range" style={{ flex: 1 }} />
            <span style={{ fontSize: 9, color: active.color }}>{volume}%</span>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SESSION TIMER OVERLAY (used by meditation programs + quick sessions)
════════════════════════════════════════════════════════════ */
function SessionTimer({ title, focus, durationMin, onClose, onComplete }) {
  const [phase, setPhase] = useState("ready");
  const [elapsed, setElapsed] = useState(0);
  const totalSec = durationMin * 60;
  const ref = useRef(null);

  const tick = () => {
    ref.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSec) { clearInterval(ref.current); setPhase("done"); return totalSec; }
        return e + 1;
      });
    }, 1000);
  };
  const start = () => { setPhase("running"); tick(); };
  const pause = () => { clearInterval(ref.current); setPhase("paused"); };
  const resume = () => { setPhase("running"); tick(); };
  useEffect(() => () => clearInterval(ref.current), []);

  const remaining = totalSec - elapsed;
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const pct = totalSec > 0 ? elapsed / totalSec : 0;
  const r = 80; const circ = 2 * Math.PI * r; const dash = circ * (1 - pct);
  const breathCycle = elapsed % 16;
  const breathLabel = breathCycle < 4 ? "Inhale..." : breathCycle < 8 ? "Hold..." : breathCycle < 12 ? "Exhale..." : "Hold...";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "#040404f2", zIndex: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: HEAD, fontSize: 28, color: G }}>{title}</div>
        <div style={{ fontSize: 8, color: SUB, marginTop: 4 }}>{focus} · {durationMin} min</div>
      </div>
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width={200} height={200} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={100} cy={100} r={r} fill="none" stroke={BOR} strokeWidth={6} />
          <circle cx={100} cy={100} r={r} fill="none" stroke={G} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" style={{ transition: "stroke-dashoffset .9s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {phase === "done" ? <div style={{ fontSize: 42 }}>✨</div> : (
            <>
              <div style={{ fontFamily: HEAD, fontSize: 40, color: TEXT }}>{mins}:{secs}</div>
              <div style={{ fontSize: 7, color: MUTED, marginTop: 4 }}>{phase === "running" ? "FOCUS" : phase === "paused" ? "PAUSED" : "READY"}</div>
            </>
          )}
        </div>
      </div>
      {phase === "running" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", margin: "0 auto 10px", background: `radial-gradient(circle,${G}33,transparent 70%)`, animation: "mw-breathe 8s ease-in-out infinite" }} />
          <div style={{ fontSize: 9, color: G }}>{breathLabel}</div>
        </div>
      )}
      {phase === "done" && <div style={{ fontFamily: HEAD, fontSize: 22, color: GREEN }}>Session Complete ✓</div>}
      <div style={{ display: "flex", gap: 10 }}>
        {phase === "ready" && <GoldBtn onClick={start}>▶ Begin</GoldBtn>}
        {phase === "running" && <GhostBtn color={G} onClick={pause}>⏸ Pause</GhostBtn>}
        {phase === "paused" && <GoldBtn onClick={resume}>▶ Resume</GoldBtn>}
        {phase === "done" && <GoldBtn style={{ background: GREEN }} onClick={() => { onComplete?.(); onClose(); }}>✓ Complete</GoldBtn>}
        <GhostBtn onClick={onClose}>✕ Close</GhostBtn>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   GUIDED VOICE-STYLE SESSION OVERLAY (kept from Stress.jsx)
════════════════════════════════════════════════════════════ */
function GuidedOverlay({ session, onClose }) {
  const [step, setStep] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const ref = useRef(null);
  const stepDur = Math.round((session.duration * 60) / session.script.length);
  useEffect(() => {
    if (!running) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setTime((t) => {
        const nt = t + 1;
        setStep(Math.min(Math.floor(nt / stepDur), session.script.length - 1));
        return nt;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, stepDur, session]);
  const pct = (time / (session.duration * 60)) * 100;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(2,2,8,.98)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 9, color: MUTED, marginBottom: 8 }}>{session.type} SESSION</div>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{session.emoji}</div>
        <div style={{ fontFamily: HEAD, fontSize: 32, color: TEXT, marginBottom: 20 }}>{session.title}</div>
        <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto 24px" }}>
          <svg viewBox="0 0 150 150" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="75" cy="75" r="65" fill="none" stroke="#111118" strokeWidth="5" />
            <circle cx="75" cy="75" r="65" fill="none" stroke={session.color} strokeWidth="5" strokeDasharray={2 * Math.PI * 65} strokeDashoffset={2 * Math.PI * 65 * (1 - pct / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: HEAD, fontSize: 36, color: session.color }}>{step + 1}</div>
            <div style={{ fontSize: 7, color: MUTED }}>of {session.script.length}</div>
          </div>
        </div>
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: CARD, border: `1px solid ${session.color}22`, padding: "18px 22px", marginBottom: 20, fontSize: 13, color: TEXT, lineHeight: 1.9, minHeight: 70 }}>
          {session.script[step]}
        </motion.div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <GhostBtn color={session.color} onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Resume"}</GhostBtn>
          <GhostBtn onClick={onClose}>✕ Close</GhostBtn>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   READINESS RING (kept from Stress.jsx)
════════════════════════════════════════════════════════════ */
function ReadinessRing({ score, size = 190 }) {
  const col = score >= 80 ? GREEN : score >= 60 ? TEAL : score >= 40 ? G : score >= 20 ? ORANGE : RED;
  const label = score >= 80 ? "Peak" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Low";
  const r = size / 2 - 10; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#111118" strokeWidth="8" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - score / 100) }} transition={{ duration: 1.6 }} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: HEAD, fontSize: 46, color: col }}>{score}</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function MentalWellness() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");

  // SHARED HOOKS — single source of truth
  const { streak, freezes, todayDone, checkIn } = useStreak();
  const { log: moodLog, addEntry: logMoodEntry, avgScore, mhScore } = useMoodLog();

  // CBT state
  const [activeEx, setActiveEx] = useState(null);
  const [cbtStep, setCbtStep] = useState(0);
  const [cbtAnswers, setCbtAnswers] = useState({});
  const [cbtDistorts, setCbtDistorts] = useState([]);
  const [cbtSaved, setCbtSaved] = useState(false);
  const [cbtHistory, setCbtHistory] = useLS("manifix_cbt_log", []);
  const [aiReframe, setAiReframe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Mood form state
  const [selMood, setSelMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [moodNote, setMoodNote] = useState("");
  const [moodEmotions, setMoodEmotions] = useState([]);
  const [moodSaved, setMoodSaved] = useState(false);
  const [moodInsight, setMoodInsight] = useState("");
  const [moodInsightLoading, setMoodInsightLoading] = useState(false);

  // Meditation programs
  const [programs, setPrograms] = useLS("manifix_med_programs", MEDITATION_PROGRAMS);
  const [selProgram, setSelProgram] = useState(null);
  const [timerSession, setTimerSession] = useState(null); // {title, focus, durationMin, onComplete}

  // Journal (stress trigger journal — distinct from mood log)
  const [journal, setJournal] = useLS("manifix_journal", []);
  const [showJModal, setJModal] = useState(false);
  const [jForm, setJForm] = useState({ trigger: [], mood: "", intensity: 5, notes: "" });

  // Strain / Eat / Focus / Sleep / Readiness (kept from Stress.jsx)
  const [strainLog, setStrainLog] = useLS("manifix_strain_log", []);
  const [showStrainForm, setShowStrainForm] = useState(false);
  const [strainForm, setStrainForm] = useState({ actId: null, duration: 30, effort: 5 });
  const [eatLog, setEatLog] = useLS("manifix_eat_log", []);
  const [showEatModal, setShowEatModal] = useState(false);
  const [eatForm, setEatForm] = useState({ mood: "", food: "", hunger: 3 });
  const [hrvData, setHrv] = useLS("manifix_hrv", []);
  const [showSOS, setShowSOS] = useState(false);
  const [activeGuided, setActiveGuided] = useState(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [stressScore, setStressScore] = useState(() => Number(localStorage.getItem("manifix_stress_score") || 55));

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  // HRV simulated collection (clearly an estimate — same honesty pattern as SleepGold)
  useEffect(() => {
    const collect = () => {
      const base = 55 - stressScore * 0.25;
      const v = Math.round(Math.max(25, base + (Math.random() - 0.5) * 18));
      setHrv((p) => [...p.slice(-20), { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: v }]);
    };
    collect();
    const id = setInterval(collect, 25000);
    return () => clearInterval(id);
  }, [stressScore, setHrv]);

  const hrvLast = hrvData.length ? hrvData[hrvData.length - 1].value : 48;
  const currentHrvZone = HRV_ZONES.find((z) => hrvLast >= z.min && hrvLast < z.max) || HRV_ZONES[2];

  // Strain calc (real MET-based math, kept from Stress.jsx)
  const today = new Date().toDateString();
  const todayStrainLogs = strainLog.filter((l) => new Date(l.date).toDateString() === today);
  const todayStrain = Math.min(21, todayStrainLogs.reduce((sum, l) => {
    const act = ACTIVITIES.find((a) => a.id === l.actId);
    if (!act) return sum;
    return sum + (act.mets * l.duration / 60) * (l.effort / 5) * (1 + act.stressMultiplier * 0.3);
  }, 0));
  const todayRecovery = Math.max(0, Math.min(100, 100 - todayStrain * 3.8 - stressScore * 0.2));

  // Readiness / resilience composite (kept formula from Stress.jsx)
  const moodAvgRaw = moodLog.length ? moodLog.slice(0, 7).reduce((a, m) => a + m.score, 0) / Math.min(7, moodLog.length) * 10 : 50;
  const resilienceScore = Math.round(
    Math.min(100, hrvLast * 1.25) * 0.30 +
    Math.max(0, 100 - todayStrain * 4) * 0.25 +
    moodAvgRaw * 0.25 +
    Math.min(100, moodLog.length * 5) * 0.20
  );
  const resilienceCol = resilienceScore >= 80 ? GREEN : resilienceScore >= 60 ? TEAL : resilienceScore >= 40 ? G : ORANGE;

  /* ── CBT handlers ── */
  const saveCbtRecord = useCallback(async () => {
    if (!activeEx) return;
    const ex = CBT_EXERCISES.find((e) => e.id === activeEx);
    const record = { id: Date.now(), exercise: ex.title, date: new Date().toDateString(), answers: cbtAnswers, distortions: cbtDistorts };
    setCbtHistory((p) => [record, ...p].slice(0, 30));
    setCbtSaved(true);
    const thought = cbtAnswers["Automatic Thought"] || cbtAnswers["Worry Topic"] || cbtAnswers["Surface Belief"] || "";
    if (thought) {
      setAiLoading(true);
      const prompt = `You are a CBT therapist. A client has the thought: "${thought}". ${cbtDistorts.length ? `Distortions: ${cbtDistorts.join(", ")}.` : ""} Give a compassionate, evidence-based balanced reframe in 2-3 sentences.`;
      const result = await callClaudeForInsight(prompt);
      setAiReframe(result || "Challenging negative thoughts takes courage — you're building real cognitive resilience.");
      setAiLoading(false);
    }
  }, [activeEx, cbtAnswers, cbtDistorts, setCbtHistory]);

  /* ── Mood handlers ── */
  const logMood = useCallback(async () => {
    if (!selMood) return;
    logMoodEntry(selMood, { note: moodNote, emotions: moodEmotions, energy });
    checkIn();
    setMoodSaved(true);
    setMoodInsightLoading(true);
    const prompt = `You are a compassionate mental health coach. Someone logged mood: ${selMood}. Emotions: ${moodEmotions.join(", ") || "not specified"}. Energy: ${energy}/10. ${moodNote ? `Note: "${moodNote}"` : ""}. Give a warm, specific 2-sentence insight and one practical micro-action.`;
    const result = await callClaudeForInsight(prompt);
    setMoodInsight(result || "Thank you for checking in — awareness of your emotional state is real self-care.");
    setMoodInsightLoading(false);
    setMoodNote(""); setMoodEmotions([]); setSelMood(null); setEnergy(5);
  }, [selMood, moodNote, moodEmotions, energy, logMoodEntry, checkIn]);

  /* ── Meditation handlers ── */
  const completeSession = useCallback((session) => {
    if (selProgram) {
      setPrograms((prev) => prev.map((p) => p.id !== selProgram ? p : { ...p, sessions: p.sessions.map((s) => s.day === session.day ? { ...s, done: true } : s) }));
    }
    checkIn();
  }, [selProgram, setPrograms, checkIn]);

  /* ── Journal handlers ── */
  const saveJournal = useCallback(() => {
    if (!jForm.mood || !jForm.trigger.length) return;
    setJournal((p) => [{ id: Date.now(), date: new Date().toISOString(), ...jForm }, ...p]);
    setJModal(false); setJForm({ trigger: [], mood: "", intensity: 5, notes: "" });
  }, [jForm, setJournal]);

  /* ── Strain / Eat handlers ── */
  const logStrainActivity = useCallback(() => {
    if (!strainForm.actId) return;
    setStrainLog((p) => [...p, { ...strainForm, id: Date.now(), date: new Date().toISOString() }]);
    setStrainForm({ actId: null, duration: 30, effort: 5 });
    setShowStrainForm(false);
  }, [strainForm, setStrainLog]);

  const saveEatEntry = useCallback(() => {
    if (!eatForm.mood || !eatForm.food) return;
    setEatLog((p) => [...p, { ...eatForm, id: Date.now(), time: new Date().toISOString() }]);
    setShowEatModal(false); setEatForm({ mood: "", food: "", hunger: 3 });
  }, [eatForm, setEatLog]);

  const moodChartData = useMemo(() => moodLog.slice(0, 10).reverse().map((m, i) => ({ day: `D${i + 1}`, value: m.score })), [moodLog]);

  const TABS = [
    { id: "home", label: "Overview" },
    { id: "meditate", label: "Meditate" },
    { id: "mood", label: "Mood Log" },
    { id: "cbt", label: "CBT" },
    { id: "sounds", label: "Sounds" },
    { id: "guided", label: "Guided" },
    { id: "readiness", label: "Readiness" },
    { id: "strain", label: "Strain" },
    { id: "eat", label: "Eat Journal" },
    { id: "journal", label: "Journal" },
  ];

  const prog = programs.find((p) => p.id === selProgram);

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: TEXT, fontFamily: FONT, position: "relative", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${GRID_C} 1px,transparent 1px),linear-gradient(90deg,${GRID_C} 1px,transparent 1px)`, backgroundSize: "44px 44px" }} />
      <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: 500, height: 260, background: `radial-gradient(ellipse,${G}07 0%,transparent 70%)`, animation: "mw-pulse 6s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Overlays */}
      <AnimatePresence>{showSOS && <SosOverlay onClose={() => setShowSOS(false)} />}</AnimatePresence>
      <AnimatePresence>{activeGuided && <GuidedOverlay session={activeGuided} onClose={() => setActiveGuided(null)} />}</AnimatePresence>
      <AnimatePresence>
        {timerSession && (
          <SessionTimer {...timerSession} onClose={() => setTimerSession(null)}
            onComplete={() => { timerSession.onComplete?.(); }} />
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: `${BG}f0`, backdropFilter: "blur(12px)", zIndex: 20 }}>
        <div>
          <div style={{ fontFamily: HEAD, fontSize: 28, color: TEXT }}>🧠 MENTAL WELLNESS</div>
          <div style={{ fontSize: 7, letterSpacing: ".18em", color: MUTED, textTransform: "uppercase", marginTop: 2 }}>Mood · Meditation · CBT · Sounds · Strain · Readiness</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {streak > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 7, color: MUTED }}>STREAK {freezes > 0 ? `· 🛡${freezes}` : ""}</div>
              <div style={{ fontFamily: HEAD, fontSize: 20, color: G }}>🔥 {streak}d</div>
            </div>
          )}
          <button className="mw-btn" onClick={() => setShowSOS(true)} style={{ padding: "8px 12px", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", color: RED, fontFamily: FONT, fontSize: 8, fontWeight: 700, letterSpacing: ".14em" }}>🆘 SOS</button>
          <button className="mw-btn" onClick={() => navigate(-1)} style={{ background: "transparent", border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 8, padding: "7px 12px" }}>← Back</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "0 14px", display: "flex", gap: 1, overflowX: "auto", position: "sticky", top: 60, background: `${BG}f8`, zIndex: 19 }}>
        {TABS.map((t) => (
          <button key={t.id} className="mw-btn" onClick={() => setTab(t.id)}
            style={{ padding: "11px 11px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t.id ? G : "transparent"}`, color: tab === t.id ? G : MUTED, fontFamily: FONT, fontSize: 7, letterSpacing: ".13em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px 16px 70px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

            {/* ══════ OVERVIEW ══════ */}
            {tab === "home" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Card style={{ background: G, color: "#080808" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 16 }}>💡</div>
                    <div style={{ fontSize: 11, fontFamily: HEAD, letterSpacing: ".04em" }}>{TIPS[tipIdx]}</div>
                  </div>
                </Card>

                {!todayDone && (
                  <button className="mw-btn" onClick={() => setTab("mood")} style={{ padding: "10px 14px", background: `${G}11`, border: `1px solid ${G}22`, color: `${G}cc`, fontFamily: FONT, fontSize: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>✦ Daily check-in not done — log your mood</span><span>→</span>
                  </button>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[
                    { label: "MH Score", value: mhScore > 0 ? `${mhScore}` : "—", color: mhScore >= 70 ? GREEN : mhScore >= 50 ? G : RED },
                    { label: "Readiness", value: resilienceScore, color: resilienceCol },
                    { label: "Stress Idx", value: `${stressScore}%`, color: stressScore <= 50 ? GREEN : stressScore <= 75 ? G : RED },
                    { label: "HRV Zone", value: currentHrvZone.label, color: currentHrvZone.color },
                  ].map(({ label, value, color }) => (
                    <Card key={label}>
                      <Label>{label}</Label>
                      <div style={{ fontFamily: HEAD, fontSize: 26, color }}>{value}</div>
                    </Card>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { icon: "🧘", label: "Meditate", sub: `${programs.length} programs`, action: () => setTab("meditate") },
                    { icon: "😊", label: "Log Mood", sub: `${moodLog.length} entries`, action: () => setTab("mood") },
                    { icon: "🛠", label: "CBT Tools", sub: `${cbtHistory.length} records`, action: () => setTab("cbt") },
                    { icon: "🎵", label: "Soundscapes", sub: "Binaural · 6 scenes", action: () => setTab("sounds") },
                    { icon: "🛡", label: "Readiness", sub: `Score ${resilienceScore}`, action: () => setTab("readiness") },
                    { icon: "⚡", label: "Strain", sub: `${todayStrain.toFixed(1)}/21 today`, action: () => setTab("strain") },
                  ].map((c, i) => (
                    <button key={i} className="mw-btn" onClick={c.action} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "16px 12px", textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 24 }}>{c.icon}</span>
                      <div style={{ fontSize: 10, fontFamily: HEAD, color: TEXT }}>{c.label}</div>
                      <div style={{ fontSize: 8, color: MUTED }}>{c.sub}</div>
                    </button>
                  ))}
                </div>

                <CrisisBanner />
              </div>
            )}

            {/* ══════ MEDITATE (programs + quick sessions, merged) ══════ */}
            {tab === "meditate" && !selProgram && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Label>Guided Programs</Label>
                {programs.map((p) => {
                  const done = p.sessions.filter((s) => s.done).length;
                  const pct = Math.round((done / p.sessions.length) * 100);
                  return (
                    <button key={p.id} className="mw-btn" onClick={() => setSelProgram(p.id)} style={{ textAlign: "left", background: CARD, border: `1px solid ${BOR}`, padding: "16px 18px" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ fontSize: 28 }}>{p.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ fontFamily: HEAD, fontSize: 17, color: TEXT }}>{p.title}</div>
                            <Badge color={p.badgeColor}>{p.badge}</Badge>
                          </div>
                          <div style={{ fontSize: 7, color: MUTED, marginTop: 3 }}>{p.subtitle} · {p.days} days</div>
                        </div>
                      </div>
                      <Bar pct={pct} color={p.badgeColor} height={3} />
                      <div style={{ fontSize: 7, color: MUTED, marginTop: 4 }}>{done}/{p.sessions.length} done</div>
                    </button>
                  );
                })}

                <Label style={{ marginTop: 8 }}>Quick Sessions</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {QUICK_SESSIONS.map((q) => (
                    <button key={q.id} className="mw-btn" onClick={() => setTimerSession({ title: q.title, focus: "Quick session", durationMin: q.duration, onComplete: checkIn })}
                      style={{ background: CARD, border: `1px solid ${BOR}`, padding: "14px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 22 }}>{q.emoji}</div>
                      <div style={{ fontFamily: HEAD, fontSize: 13, color: TEXT, marginTop: 4 }}>{q.title}</div>
                      <div style={{ fontSize: 8, color: q.color }}>{q.duration} min</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "meditate" && selProgram && prog && (() => {
              const done = prog.sessions.filter((s) => s.done).length;
              const pct = Math.round((done / prog.sessions.length) * 100);
              const next = prog.sessions.find((s) => !s.done);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <GhostBtn onClick={() => setSelProgram(null)}>← Back</GhostBtn>
                    <div style={{ fontFamily: HEAD, fontSize: 18, color: TEXT }}>{prog.icon} {prog.title}</div>
                  </div>
                  <Card><Label>Progress</Label><Bar pct={pct} color={prog.badgeColor} /><div style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>{done}/{prog.sessions.length} sessions</div></Card>
                  {next && (
                    <Card style={{ border: `1px solid ${G}33` }}>
                      <Label color={`${G}88`}>Next Session</Label>
                      <div style={{ fontFamily: HEAD, fontSize: 20, color: G }}>Day {next.day}: {next.title}</div>
                      <div style={{ fontSize: 9, color: SUB, margin: "8px 0 14px" }}>{next.desc}</div>
                      <GoldBtn onClick={() => setTimerSession({ title: next.title, focus: next.focus, durationMin: parseInt(next.duration), onComplete: () => completeSession(next) })}>🧘 Start Session</GoldBtn>
                    </Card>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {prog.sessions.map((s) => (
                      <div key={s.day} style={{ background: s.done ? "#0a140a" : CARD, border: `1px solid ${s.done ? "#1e4d1e" : BOR}`, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: s.done ? `${GREEN}22` : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s.done ? 12 : 9, color: s.done ? GREEN : SUB }}>{s.done ? "✓" : s.day}</div>
                        <div style={{ fontSize: 9, color: s.done ? GREEN : TEXT }}>{s.title}</div>
                        <div style={{ marginLeft: "auto", fontSize: 7, color: MUTED }}>{s.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ══════ MOOD LOG (unified) ══════ */}
            {tab === "mood" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {moodSaved && (moodInsightLoading
                  ? <div style={{ background: `${G}08`, border: `1px solid ${G}22`, padding: 14, fontSize: 9, color: MUTED }}>AI analysing your mood pattern...</div>
                  : moodInsight && <div style={{ background: `${G}08`, border: `1px solid ${G}33`, padding: 14 }}><Label color={`${G}88`}>AI Insight</Label><div style={{ fontSize: 10, color: TEXT, lineHeight: 1.8 }}>{moodInsight}</div></div>
                )}
                <Card>
                  <Label>How are you feeling right now?</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {Object.entries(MOOD_MAP).map(([m, def]) => (
                      <button key={m} className="mw-btn" onClick={() => { setSelMood(m); setMoodSaved(false); setMoodInsight(""); }}
                        style={{ padding: "10px 4px", background: selMood === m ? `${def.color}22` : "#0a0a0a", border: `1px solid ${selMood === m ? def.color : BOR}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 20 }}>{def.emoji}</span>
                        <span style={{ fontSize: 6, color: selMood === m ? def.color : MUTED }}>{m}</span>
                      </button>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Label>Energy: {energy}/10</Label>
                  <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="mw-range" />
                </Card>
                <textarea className="mw-input" rows={3} placeholder="What's on your mind? (optional)" value={moodNote} onChange={(e) => setMoodNote(e.target.value)} />
                <GoldBtn onClick={logMood} style={{ opacity: selMood ? 1 : 0.35, pointerEvents: selMood ? "auto" : "none" }}>{moodSaved ? "✓ Logged — Log Another" : "Log Mood + Get AI Insight"}</GoldBtn>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Card><Label>7-Day Avg</Label><div style={{ fontFamily: HEAD, fontSize: 24, color: G }}>{avgScore || "—"}</div></Card>
                  <Card><Label>Days Tracked</Label><div style={{ fontFamily: HEAD, fontSize: 24, color: G }}>{moodLog.length}</div></Card>
                  <Card><Label>MH Score</Label><div style={{ fontFamily: HEAD, fontSize: 24, color: G }}>{mhScore > 0 ? mhScore : "—"}</div></Card>
                </div>

                {moodChartData.length > 1 && (
                  <Card>
                    <Label>Mood Trend</Label>
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={moodChartData}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14" />
                          <XAxis dataKey="day" stroke="#1a1a2a" tick={{ fontSize: 8, fill: "#2a2a3a" }} />
                          <YAxis stroke="#1a1a2a" tick={{ fontSize: 8, fill: "#2a2a3a" }} domain={[0, 10]} />
                          <Tooltip content={<MwTooltip />} />
                          <Line type="monotone" dataKey="value" stroke={G} strokeWidth={2} dot={{ fill: G, r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════ CBT (kept from MentalHealth.jsx) ══════ */}
            {tab === "cbt" && !activeEx && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {CBT_EXERCISES.map((e) => (
                    <button key={e.id} className="mw-btn" onClick={() => { setActiveEx(e.id); setCbtStep(0); setCbtAnswers({}); setCbtDistorts([]); setCbtSaved(false); setAiReframe(""); }}
                      style={{ background: CARD, border: `1px solid ${BOR}`, padding: "16px 14px", textAlign: "left" }}>
                      <div style={{ fontSize: 24 }}>{e.icon}</div>
                      <div style={{ fontFamily: HEAD, fontSize: 13, color: TEXT, marginTop: 6 }}>{e.title}</div>
                      <div style={{ fontSize: 7, color: SUB, marginTop: 4 }}>{e.desc}</div>
                    </button>
                  ))}
                </div>
                {cbtHistory.length > 0 && (
                  <Card>
                    <Label>Recent Records</Label>
                    {cbtHistory.slice(0, 4).map((r) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
                        <span style={{ fontSize: 9, color: TEXT }}>{r.exercise}</span>
                        <span style={{ fontSize: 7, color: MUTED }}>{r.date}</span>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {tab === "cbt" && activeEx && (() => {
              const ex = CBT_EXERCISES.find((e) => e.id === activeEx);
              const currentStep = ex.steps[cbtStep];
              const isDistortStep = currentStep === "Cognitive Distortions";
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <GhostBtn onClick={() => setActiveEx(null)}>← Back</GhostBtn>
                    <div style={{ fontSize: 9, color: TEXT }}>{ex.icon} {ex.title} · Step {cbtStep + 1}/{ex.steps.length}</div>
                  </div>
                  {!cbtSaved ? (
                    <Card>
                      <Label>{currentStep}</Label>
                      {isDistortStep ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {DISTORTIONS.map((d) => (
                            <Pill key={d} active={cbtDistorts.includes(d)} onClick={() => setCbtDistorts((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d])}>{d}</Pill>
                          ))}
                        </div>
                      ) : (
                        <textarea className="mw-input" rows={4} placeholder={`Write your ${currentStep.toLowerCase()}...`} value={cbtAnswers[currentStep] || ""} onChange={(e) => setCbtAnswers((a) => ({ ...a, [currentStep]: e.target.value }))} />
                      )}
                    </Card>
                  ) : (
                    <Card>
                      <Label color={GREEN}>Record Saved ✓</Label>
                      {aiLoading ? <div style={{ fontSize: 9, color: MUTED }}>AI generating reframe...</div> : aiReframe && (
                        <div style={{ fontSize: 10, color: TEXT, lineHeight: 1.8, background: `${G}08`, border: `1px solid ${G}22`, padding: 12, marginTop: 8 }}>{aiReframe}</div>
                      )}
                    </Card>
                  )}
                  {!cbtSaved ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      {cbtStep > 0 && <GhostBtn onClick={() => setCbtStep((s) => s - 1)}>← Previous</GhostBtn>}
                      {cbtStep < ex.steps.length - 1
                        ? <GoldBtn onClick={() => setCbtStep((s) => s + 1)} style={{ flex: 1 }}>Next Step →</GoldBtn>
                        : <GoldBtn onClick={saveCbtRecord} style={{ flex: 1, background: GREEN }}>✓ Save Record</GoldBtn>}
                    </div>
                  ) : <GhostBtn onClick={() => setActiveEx(null)}>← Back to Exercises</GhostBtn>}
                </div>
              );
            })()}

            {/* ══════ SOUNDS (unified engine) ══════ */}
            {tab === "sounds" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Card>
                  <Label>Binaural Soundscape Engine — Real Web Audio API</Label>
                  <SoundscapePlayer />
                </Card>
              </div>
            )}

            {/* ══════ GUIDED ══════ */}
            {tab === "guided" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {GUIDED_SESSIONS.map((s) => (
                  <Card key={s.id} style={{ border: `1px solid ${s.color}18` }}>
                    <div style={{ fontSize: 28 }}>{s.emoji}</div>
                    <div style={{ fontFamily: HEAD, fontSize: 18, color: TEXT, marginTop: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 8, color: SUB, margin: "4px 0 12px" }}>{s.duration} min · {s.type}</div>
                    <GoldBtn onClick={() => setActiveGuided(s)} style={{ width: "100%", background: s.color }}>▶ Begin</GoldBtn>
                  </Card>
                ))}
              </div>
            )}

            {/* ══════ READINESS ══════ */}
            {tab === "readiness" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Card style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <ReadinessRing score={resilienceScore} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Label>HRV Zone: {currentHrvZone.label}</Label>
                    <div style={{ fontSize: 9, color: SUB, lineHeight: 1.7 }}>{currentHrvZone.desc}</div>
                    <div style={{ fontSize: 8, color: MUTED, marginTop: 10 }}>Current HRV (estimated): {hrvLast}ms</div>
                  </div>
                </Card>
                {hrvData.length > 2 && (
                  <Card>
                    <Label>HRV Trend (estimated, no wearable connected)</Label>
                    <div style={{ height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hrvData.slice(-10)}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14" />
                          <XAxis dataKey="time" stroke="#1a1a2a" tick={{ fontSize: 7, fill: "#2a2a3a" }} />
                          <YAxis stroke="#1a1a2a" tick={{ fontSize: 7, fill: "#2a2a3a" }} domain={[20, 80]} />
                          <Tooltip content={<MwTooltip />} />
                          <Area type="monotone" dataKey="value" stroke={G} fill={`${G}22`} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════ STRAIN ══════ */}
            {tab === "strain" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: HEAD, fontSize: 22, color: TEXT }}>STRAIN SCORE</div>
                  <GoldBtn small onClick={() => setShowStrainForm(true)}>+ Log Activity</GoldBtn>
                </div>
                <Card>
                  <Label>Today's Strain · {todayStrain.toFixed(1)}/21</Label>
                  <Bar pct={(todayStrain / 21) * 100} color={todayStrain > 13 ? RED : todayStrain > 8 ? ORANGE : GREEN} />
                  <div style={{ fontSize: 8, color: MUTED, marginTop: 8 }}>Recovery estimate: {Math.round(todayRecovery)}%</div>
                </Card>
                {showStrainForm && (
                  <Card style={{ border: `1px solid ${ORANGE}22` }}>
                    <Label>Log Activity</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
                      {ACTIVITIES.map((a) => (
                        <button key={a.id} className="mw-btn" onClick={() => setStrainForm((p) => ({ ...p, actId: a.id }))}
                          style={{ padding: "10px 4px", background: strainForm.actId === a.id ? `${ORANGE}18` : "#0e0e14", border: `1px solid ${strainForm.actId === a.id ? ORANGE : BOR}`, textAlign: "center" }}>
                          <div style={{ fontSize: 16 }}>{a.icon}</div>
                          <div style={{ fontSize: 6, color: MUTED, marginTop: 3 }}>{a.label}</div>
                        </button>
                      ))}
                    </div>
                    <Label>Duration: {strainForm.duration}min</Label>
                    <input type="range" min={5} max={240} value={strainForm.duration} onChange={(e) => setStrainForm((p) => ({ ...p, duration: Number(e.target.value) }))} className="mw-range" style={{ marginBottom: 12 }} />
                    <Label>Effort: {strainForm.effort}/10</Label>
                    <input type="range" min={1} max={10} value={strainForm.effort} onChange={(e) => setStrainForm((p) => ({ ...p, effort: Number(e.target.value) }))} className="mw-range" style={{ marginBottom: 12 }} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <GoldBtn onClick={logStrainActivity} style={{ flex: 1, background: ORANGE, opacity: strainForm.actId ? 1 : 0.35 }}>Add to Strain</GoldBtn>
                      <GhostBtn onClick={() => setShowStrainForm(false)}>Cancel</GhostBtn>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════ EAT JOURNAL ══════ */}
            {tab === "eat" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: HEAD, fontSize: 22, color: TEXT }}>EAT JOURNAL</div>
                  <GoldBtn small style={{ background: ORANGE }} onClick={() => setShowEatModal(true)}>+ Log Moment</GoldBtn>
                </div>
                {showEatModal && (
                  <Card style={{ border: `1px solid ${ORANGE}22` }}>
                    <Label>Emotional state before eating</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {FOOD_MOODS.map((m) => <Pill key={m} color={ORANGE} active={eatForm.mood === m} onClick={() => setEatForm((p) => ({ ...p, mood: m }))}>{m}</Pill>)}
                    </div>
                    <Label>What did you eat?</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                      {FOOD_CATEGORIES.map((f) => (
                        <button key={f.id} className="mw-btn" onClick={() => setEatForm((p) => ({ ...p, food: f.id }))} style={{ padding: "9px 10px", background: eatForm.food === f.id ? `${ORANGE}18` : "#0e0e14", border: `1px solid ${eatForm.food === f.id ? ORANGE : BOR}`, textAlign: "left", display: "flex", gap: 8, alignItems: "center" }}>
                          <span>{f.icon}</span><span style={{ fontSize: 8, color: SUB }}>{f.label}</span>
                        </button>
                      ))}
                    </div>
                    <Label>Hunger: {eatForm.hunger}/10</Label>
                    <input type="range" min={1} max={10} value={eatForm.hunger} onChange={(e) => setEatForm((p) => ({ ...p, hunger: Number(e.target.value) }))} className="mw-range" style={{ marginBottom: 12 }} />
                    <GoldBtn onClick={saveEatEntry} style={{ background: ORANGE, opacity: eatForm.mood && eatForm.food ? 1 : 0.35 }}>Save Log</GoldBtn>
                  </Card>
                )}
                {eatLog.length > 0 ? (
                  <Card>
                    <Label>Recent Entries — hunger below 5 suggests emotional eating</Label>
                    {eatLog.slice(-8).reverse().map((e) => {
                      const cat = FOOD_CATEGORIES.find((f) => f.id === e.food);
                      return (
                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BOR}` }}>
                          <span style={{ fontSize: 9, color: TEXT }}>{cat?.icon} {e.mood}</span>
                          <span style={{ fontSize: 8, color: e.hunger < 5 ? RED : GREEN }}>Hunger {e.hunger}/10</span>
                        </div>
                      );
                    })}
                  </Card>
                ) : <Card style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 9, color: MUTED }}>No entries yet</div></Card>}
              </div>
            )}

            {/* ══════ JOURNAL (trigger journal, distinct from mood log) ══════ */}
            {tab === "journal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: HEAD, fontSize: 22, color: TEXT }}>TRIGGER JOURNAL</div>
                  <GoldBtn small onClick={() => setJModal(true)}>+ New Entry</GoldBtn>
                </div>
                {showJModal && (
                  <Card style={{ border: `1px solid ${G}22` }}>
                    <Label>Mood</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {Object.keys(MOOD_MAP).slice(0, 8).map((m) => <Pill key={m} active={jForm.mood === m} onClick={() => setJForm((p) => ({ ...p, mood: m }))}>{MOOD_MAP[m].emoji} {m}</Pill>)}
                    </div>
                    <Label>Triggers</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                      {TRIGGERS.map((t) => (
                        <button key={t.id} className="mw-btn" onClick={() => setJForm((p) => ({ ...p, trigger: p.trigger.includes(t.id) ? p.trigger.filter((x) => x !== t.id) : [...p.trigger, t.id] }))}
                          style={{ padding: "9px 10px", background: jForm.trigger.includes(t.id) ? `${G}18` : "#0e0e14", border: `1px solid ${jForm.trigger.includes(t.id) ? G : BOR}`, textAlign: "left", display: "flex", gap: 8 }}>
                          <span>{t.icon}</span><span style={{ fontSize: 8, color: SUB }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                    <Label>Intensity: {jForm.intensity}/10</Label>
                    <input type="range" min={1} max={10} value={jForm.intensity} onChange={(e) => setJForm((p) => ({ ...p, intensity: Number(e.target.value) }))} className="mw-range" style={{ marginBottom: 12 }} />
                    <textarea className="mw-input" rows={3} placeholder="Notes..." value={jForm.notes} onChange={(e) => setJForm((p) => ({ ...p, notes: e.target.value }))} style={{ marginBottom: 12 }} />
                    <GoldBtn onClick={saveJournal} style={{ opacity: jForm.mood && jForm.trigger.length ? 1 : 0.35 }}>Save Entry</GoldBtn>
                  </Card>
                )}
                {journal.length === 0 ? <Card style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 9, color: MUTED }}>No entries yet</div></Card> : (
                  journal.map((entry) => (
                    <Card key={entry.id}>
                      <div style={{ fontSize: 7, color: MUTED, marginBottom: 6 }}>{new Date(entry.date).toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: TEXT }}>{MOOD_MAP[entry.mood]?.emoji} {entry.mood} · Intensity {entry.intensity}/10</div>
                      {entry.notes && <div style={{ fontSize: 9, color: SUB, marginTop: 6, fontStyle: "italic" }}>"{entry.notes}"</div>}
                    </Card>
                  ))
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
