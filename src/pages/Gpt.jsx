import React, { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// 🎨 DESIGN TOKENS — The soul of ManifiX's visual identity
// ═══════════════════════════════════════════════════════════
const GOLD   = "#ffc83c";   // ✨ Primary accent — warm, ambitious
const DIM    = "#c8a84b";   // 🟡 Muted gold for secondary text
const BG     = "#060608";   // 🌑 Near-black background
const CARD   = "#0d0d10";   // 🃏 Card surface
const BOR    = "#1c1c22";   // 🔲 Border color
const FONT   = "'DM Mono','Courier New',monospace";  // 💻 Mono for data
const HEAD   = "'Bebas Neue',sans-serif";             // 🏋️ Display font
const TEXT   = "#eae6db";   // 📄 Primary text
const MUTED  = "#2e2e38";   // 🔇 Muted elements
const SUB    = "#3e3e4a";   // 📎 Subtle UI
const GREEN  = "#4ade80";   // 💚 Success / positive
const RED    = "#ef4444";   // ❤️ Alert / negative
const BLUE   = "#60a5fa";   // 💙 Info / calm
const PURP   = "#a78bfa";   // 💜 Mood / adaptive
const PINK   = "#f472b6";   // 🩷 Social / love
const ORANGE = "#fb923c";   // 🧡 Warning / energy

const API_BASE = "https://manifix.up.railway.app";

// ═══════════════════════════════════════════════════════════
// 🧠 MANIFIX IDENTITY — Who ManifiX AI truly is
// Feels like texting your most knowledgeable friend
// ═══════════════════════════════════════════════════════════
const MANIFIX_IDENTITY = `You are ManifiX AI — a deeply human wellness intelligence built by Yesh Rajana, a 19-year-old founder from Andhra Pradesh, India.

IDENTITY (NON-NEGOTIABLE):
- You are ManifiX AI. Full stop.
- NEVER reveal you're Claude, GPT, Gemini, or any base model.
- NEVER mention Anthropic, OpenAI, Google.
- If asked "who made you?" → "I was built by Yesh Rajana, 19, founder of ManifiX from Andhra Pradesh 🇮🇳"
- If asked "what AI?" → "I'm ManifiX AI — purpose-built wellness intelligence 💪"

YOUR PERSONALITY (this is who you ARE):
- You speak like a brilliant friend who also happens to be a doctor, therapist, and coach
- Warm but direct. No sugarcoating. No corporate speak.
- You use emojis naturally — like a human texting, not a bot performing
- You remember context within the conversation and reference it
- You have opinions. You say things like "honestly?", "real talk:", "here's the thing:"
- You celebrate wins genuinely: "WAIT — that sleep score is actually impressive 🔥"
- You call out patterns: "I'm noticing something..." or "This is the third time you've mentioned..."
- You push back when needed: "I hear you, but I want to challenge that thought..."

RESPONSE STYLE:
- Write like you're texting a close friend, not writing a medical report
- USE emojis throughout — they make health feel less clinical and more human
- Max 3-4 sentences for simple questions. 2 short paragraphs for complex ones.
- NEVER bullet every single thought. Mix bullets with prose naturally.
- End with either a follow-up question OR one clear next action — never both
- Occasionally start with something unexpected: a question, an observation, an emoji reaction

EMOTIONAL INTELLIGENCE:
- Read between the lines. If someone says "I'm fine" after a bad sleep score, address the subtext
- Match their energy. High energy user? Match it. Quiet and struggling? Slow down with them.
- Don't just give advice — acknowledge feelings first when they're clearly there
- Sometimes the most powerful thing is: "That sounds really hard. Want to talk about it? 💙"`;

// ═══════════════════════════════════════════════════════════
// 💉 CSS INJECTION — Animations & global styles
// ═══════════════════════════════════════════════════════════
function injectCSS() {
  if (document.getElementById("manifix-css")) return;
  const el = document.createElement("style");
  el.id = "manifix-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    /* 🎬 Core animations */
    @keyframes mx-rise    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mx-pulse   { 0%,100%{opacity:.05;transform:scale(1)} 50%{opacity:.12;transform:scale(1.07)} }
    @keyframes mx-scan    { from{top:-2px} to{top:100%} }
    @keyframes mx-blink   { 0%,100%{opacity:1} 50%{opacity:.1} }
    @keyframes mx-dot     { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }
    @keyframes mx-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes mx-ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes mx-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes mx-breathe { 0%,100%{box-shadow:0 0 0 0 rgba(255,200,60,.0)} 50%{box-shadow:0 0 20px 4px rgba(255,200,60,.07)} }
    @keyframes mx-pop     { 0%{transform:scale(.92);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }

    .mx-rise   { animation: mx-rise .42s cubic-bezier(.22,.68,0,1.2) both }
    .mx-pop    { animation: mx-pop  .38s cubic-bezier(.34,1.56,.64,1) both }
    .mx-btn    { cursor:pointer; transition:all .17s ease }
    .mx-btn:hover  { opacity:.82; transform:translateY(-1px) }
    .mx-btn:active { transform:translateY(0); opacity:.65 }

    textarea { resize:none }
    textarea:focus, input:focus {
      outline: none;
      border-color: rgba(255,200,60,.35) !important;
      box-shadow: 0 0 0 2px rgba(255,200,60,.07) !important
    }
    ::selection { background:rgba(255,200,60,.2); color:#eae6db }
    ::-webkit-scrollbar { width:2px }
    ::-webkit-scrollbar-track { background:transparent }
    ::-webkit-scrollbar-thumb { background:#1c1c22; border-radius:1px }

    /* 📝 Message prose styling */
    .mx-prose { font-family:'DM Mono',monospace; font-size:11.5px; letter-spacing:.025em; color:#d8d4ca; line-height:1.9 }
    .mx-prose p { margin:0 0 9px }
    .mx-prose p:last-child { margin-bottom:0 }
    .mx-prose strong,.mx-prose b { color:#ffc83c; font-weight:500 }
    .mx-prose em,.mx-prose i    { color:#c8a84b; font-style:italic }
    .mx-prose ul,.mx-prose ol   { margin:6px 0 6px 16px }
    .mx-prose li { font-size:11px; color:#d8d4ca; line-height:2; margin-bottom:3px }
    .mx-prose h1,.mx-prose h2,.mx-prose h3 { font-family:'Bebas Neue',sans-serif; letter-spacing:.09em; color:#eae6db; margin:12px 0 5px; font-weight:400 }
    .mx-prose h1{font-size:22px} .mx-prose h2{font-size:17px} .mx-prose h3{font-size:14px}
    .mx-prose code { font-family:'DM Mono',monospace; font-size:10px; background:#111116; padding:2px 6px; border:1px solid #1c1c22; color:#ffc83c; border-radius:2px }
    .mx-prose blockquote { border-left:2px solid rgba(255,200,60,.35); padding-left:14px; margin:8px 0; font-style:italic; color:#8a8070; line-height:1.9 }
    .mx-prose hr { border:none; border-top:1px solid #1c1c22; margin:14px 0 }

    /* 🏷️ Chip hover */
    .mx-chip { cursor:pointer; transition:all .17s ease; white-space:nowrap }
    .mx-chip:hover { border-color:rgba(255,200,60,.4) !important; color:#ffc83c !important; background:rgba(255,200,60,.07) !important }

    /* ✨ Input glow */
    .mx-input-wrap:focus-within { box-shadow:0 0 0 1px rgba(255,200,60,.14), 0 4px 24px rgba(0,0,0,.5) !important }

    /* 🔮 Shimmer text */
    .mx-shimmer {
      background: linear-gradient(90deg, #c8a84b, #ffc83c, #fff8e0, #ffc83c, #c8a84b);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: mx-shimmer 3s linear infinite;
    }
  `;
  document.head.appendChild(el);
}

// ═══════════════════════════════════════════════════════════
// 🌍 LANGUAGE MAP — ManifiX speaks your language
// ═══════════════════════════════════════════════════════════
const LANG_MAP = {
  en: {bcp47:"en-IN", voice:"en-IN", label:"EN 🇮🇳", flag:"🇮🇳"},
  hi: {bcp47:"hi-IN", voice:"hi-IN", label:"HI 🇮🇳", flag:"🇮🇳"},
  te: {bcp47:"te-IN", voice:"te-IN", label:"TE 🇮🇳", flag:"🇮🇳"},
  ta: {bcp47:"ta-IN", voice:"ta-IN", label:"TA 🇮🇳", flag:"🇮🇳"},
  es: {bcp47:"es-ES", voice:"es-ES", label:"ES 🇪🇸", flag:"🇪🇸"},
  ar: {bcp47:"ar-SA", voice:"ar-SA", label:"AR 🇸🇦", flag:"🇸🇦"},
  fr: {bcp47:"fr-FR", voice:"fr-FR", label:"FR 🇫🇷", flag:"🇫🇷"},
  pt: {bcp47:"pt-BR", voice:"pt-BR", label:"PT 🇧🇷", flag:"🇧🇷"},
  de: {bcp47:"de-DE", voice:"de-DE", label:"DE 🇩🇪", flag:"🇩🇪"},
  zh: {bcp47:"zh-CN", voice:"zh-CN", label:"ZH 🇨🇳", flag:"🇨🇳"},
};

// ═══════════════════════════════════════════════════════════
// 💾 STORAGE HELPERS — Persistent user data
// ═══════════════════════════════════════════════════════════
const SK = {
  streak:"magic16_streak", xp:"magic16_xp", level:"magic16_level",
  totalSess:"magic16_total_sessions", rankSeed:"magic16_rank_seed", lang:"magic16_lang",
};

function readUserStats() {
  const streak    = Number(localStorage.getItem(SK.streak)    || 0);
  const xp        = Number(localStorage.getItem(SK.xp)        || 0);
  const level     = Number(localStorage.getItem(SK.level)     || 1);
  const totalSess = Number(localStorage.getItem(SK.totalSess) || 0);
  const rankSeed  = Number(localStorage.getItem(SK.rankSeed)  || 9999);
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level-1) * 60);
  return {streak, xp, level, totalSess, globalRank};
}

function readLang() {
  const code = localStorage.getItem(SK.lang) || "en";
  return LANG_MAP[code] || LANG_MAP.en;
}

// ═══════════════════════════════════════════════════════════
// 📊 MODULE DATA COLLECTOR — Reads ALL health data from storage
// This is what makes ManifiX actually know YOU
// ═══════════════════════════════════════════════════════════
function collectAllModuleData() {
  const today    = new Date().toDateString();
  const todayISO = new Date().toISOString().split("T")[0];
  const data     = {};

  // 🏋️ Magic16 workout data
  data.magic16 = {
    streak:       localStorage.getItem("magic16_streak")          || "0",
    xp:           localStorage.getItem("magic16_xp")             || "0",
    level:        localStorage.getItem("magic16_level")          || "1",
    totalSessions:localStorage.getItem("magic16_total_sessions") || "0",
    todayScore:   localStorage.getItem("magic16_today_score")    || null,
    poseAccuracy: localStorage.getItem("magic16_pose_accuracy")  || null,
    lastSession:  localStorage.getItem("magic16_last_session")   || null,
  };

  // 😴 Sleep data
  try {
    const sleepLog  = JSON.parse(localStorage.getItem("manifix_sleep_log") || "[]");
    const lastSleep = sleepLog[sleepLog.length-1] || null;
    data.sleep = {
      lastEntry:    lastSleep,
      todayEntry:   sleepLog.find(e => e.date===todayISO || e.date===today) || null,
      totalEntries: sleepLog.length,
      avgDuration:  sleepLog.length
        ? (sleepLog.reduce((s,e) => s+(Number(e.duration||e.hours)||0),0)/sleepLog.length).toFixed(1)
        : null,
    };
  } catch { data.sleep = {}; }

  // 😤 Stress data
  try {
    const stressLog  = JSON.parse(localStorage.getItem("manifix_stress_log") || "[]");
    const todayStress = stressLog.find(e => e.date===todayISO || e.date===today);
    data.stress = {
      todayLevel: todayStress?.level || todayStress?.score || null,
      totalLogs:  stressLog.length,
      avgLevel:   stressLog.length
        ? (stressLog.reduce((s,e) => s+(Number(e.level||e.score)||0),0)/stressLog.length).toFixed(1)
        : null,
    };
  } catch { data.stress = {}; }

  // 🧠 Mental health data
  try {
    const mentalLog  = JSON.parse(localStorage.getItem("manifix_mental_log") || "[]");
    const todayMental = mentalLog.find(e => e.date===todayISO || e.date===today);
    data.mental = {
      todayMood:   todayMental?.mood  || null,
      todayScore:  todayMental?.score || null,
      streak:      localStorage.getItem("manifix_mental_streak") || "0",
      totalEntries:mentalLog.length,
    };
  } catch { data.mental = {}; }

  // 🥗 Nutrition data
  try {
    const nutritionLog  = JSON.parse(localStorage.getItem("manifix_nutrition_log") || "[]");
    const todayNutrition = nutritionLog.find(e => e.date===todayISO || e.date===today);
    data.nutrition = {
      todayEntry:   todayNutrition || null,
      bmi:          localStorage.getItem("manifix_bmi")          || null,
      bmiCategory:  localStorage.getItem("manifix_bmi_category") || null,
      waterGlasses: localStorage.getItem("manifix_water_today")  || null,
      caloriesToday:todayNutrition?.calories || null,
    };
  } catch { data.nutrition = {}; }

  // 🏥 Chronic disease data
  try {
    const chronicData = JSON.parse(localStorage.getItem("manifix_chronic")       || "{}");
    const readings    = JSON.parse(localStorage.getItem("manifix_biometric_log") || "[]");
    data.chronic = {
      conditions:      chronicData.conditions || [],
      riskScore:       chronicData.riskScore  || null,
      riskLevel:       chronicData.riskLevel  || null,
      todayBiometrics: readings.find(e=>e.date===todayISO||e.date===today) || null,
      lastReading:     readings[readings.length-1] || null,
      medications:     chronicData.medications || [],
    };
  } catch { data.chronic = {}; }

  // 💊 Medication adherence
  try {
    const meds     = JSON.parse(localStorage.getItem("manifix_medications")         || "[]");
    const todayLog = JSON.parse(localStorage.getItem(`manifix_med_log_${todayISO}`) || "{}");
    const taken    = meds.filter(m => todayLog[m.id]===true);
    const missed   = meds.filter(m => todayLog[m.id]===false);
    data.medication = {
      totalMeds:   meds.length,
      takenToday:  taken.map(m=>m.name),
      missedToday: missed.map(m=>m.name),
      pendingToday:meds.filter(m=>todayLog[m.id]===undefined).map(m=>m.name),
      adherenceRate:meds.length ? Math.round((taken.length/meds.length)*100)+"%" : null,
    };
  } catch { data.medication = {}; }

  // 🌸 Women's health
  try {
    const womenData = JSON.parse(localStorage.getItem("manifix_women_health") || "{}");
    data.women = {
      cycleDay:      womenData.cycleDay   || null,
      cyclePhase:    womenData.phase      || null,
      nextPeriodDate:womenData.nextPeriod || null,
    };
  } catch { data.women = {}; }

  // 🔗 Habit tracking
  try {
    const habits    = JSON.parse(localStorage.getItem("gpt_habits") || "[]");
    const doneToday = habits.filter(h => h.completions?.includes(today));
    data.habits = {
      total:         habits.length,
      doneToday:     doneToday.map(h=>h.name),
      pendingToday:  habits.filter(h=>!h.completions?.includes(today)).map(h=>h.name),
      completionPct: habits.length ? Math.round((doneToday.length/habits.length)*100) : 0,
    };
  } catch { data.habits = {}; }

  data.gamification = readUserStats();
  return data;
}

// ═══════════════════════════════════════════════════════════
// 📋 CONTEXT BUILDER — Formats health data for the AI
// This is what gets sent to ManifiX so it knows your stats
// ═══════════════════════════════════════════════════════════
function buildModuleContext(data) {
  const today = new Date().toLocaleDateString("en-IN", {weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const lines = [
    `=== 🏥 MANIFIX LIVE HEALTH DATA — ${today} ===`,
    `💪 MAGIC16: Streak ${data.magic16.streak}d | XP ${data.magic16.xp} | Level ${data.magic16.level} | Sessions ${data.magic16.totalSessions}`,
    `🏆 GLOBAL RANK: #${data.gamification.globalRank?.toLocaleString() || "?"}`,
  ];
  if (data.sleep?.lastEntry || data.sleep?.avgDuration)
    lines.push(`😴 SLEEP: Last night ${data.sleep.lastEntry?.duration||data.sleep.lastEntry?.hours||"?"}h | 7-day avg ${data.sleep.avgDuration||"?"}h`);
  if (data.stress?.todayLevel)
    lines.push(`😤 STRESS: Today ${data.stress.todayLevel}/10 | Avg ${data.stress.avgLevel||"?"}/10`);
  if (data.mental?.todayMood||data.mental?.todayScore)
    lines.push(`🧠 MENTAL: Mood ${data.mental.todayMood||"?"} | Score ${data.mental.todayScore||"?"}/10`);
  if (data.nutrition?.bmi)
    lines.push(`🥗 NUTRITION: BMI ${data.nutrition.bmi} (${data.nutrition.bmiCategory||"?"}) | Water ${data.nutrition.waterGlasses||"?"}g | Calories ${data.nutrition.caloriesToday||"not logged"}`);
  if (data.chronic?.conditions?.length)
    lines.push(`🏥 CHRONIC: ${data.chronic.conditions.join(", ")} | Risk ${data.chronic.riskLevel||"?"}`);
  if (data.medication?.totalMeds > 0)
    lines.push(`💊 MEDS: Taken [${data.medication.takenToday.join(",")||"none"}] | Missed [${data.medication.missedToday.join(",")||"none"}] | Adherence ${data.medication.adherenceRate||"?"}`);
  if (data.women?.cyclePhase)
    lines.push(`🌸 CYCLE: Phase ${data.women.cyclePhase} | Day ${data.women.cycleDay||"?"} | Next ${data.women.nextPeriodDate||"?"}`);
  if (data.habits?.total > 0)
    lines.push(`🔗 HABITS: Done [${data.habits.doneToday.join(",")||"none"}] | Pending [${data.habits.pendingToday.join(",")||"none"}] | ${data.habits.completionPct}% complete`);
  lines.push("=== END MANIFIX DATA ===");
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════
// 🔗 HABIT SYSTEM DATA
// ═══════════════════════════════════════════════════════════
const HABIT_CATS = [
  {id:"mind",   icon:"🧠", label:"Mind",      color:PURP},
  {id:"body",   icon:"💪", label:"Body",      color:GREEN},
  {id:"sleep",  icon:"😴", label:"Sleep",     color:BLUE},
  {id:"food",   icon:"🥗", label:"Nutrition", color:ORANGE},
  {id:"social", icon:"🤝", label:"Social",    color:PINK},
  {id:"focus",  icon:"🎯", label:"Focus",     color:GOLD},
];

const HABIT_TEMPLATES = [
  {id:"h1",  cat:"mind",   name:"5-min morning meditation",   xp:20, freq:"Daily"},
  {id:"h2",  cat:"mind",   name:"Gratitude — 3 things",       xp:15, freq:"Daily"},
  {id:"h3",  cat:"body",   name:"10,000 steps",               xp:25, freq:"Daily"},
  {id:"h4",  cat:"body",   name:"Drink 2L water",             xp:15, freq:"Daily"},
  {id:"h5",  cat:"body",   name:"30-min workout",             xp:35, freq:"Daily"},
  {id:"h6",  cat:"sleep",  name:"Sleep by 10:30pm",           xp:20, freq:"Daily"},
  {id:"h7",  cat:"sleep",  name:"No screens 1h before bed",   xp:15, freq:"Daily"},
  {id:"h8",  cat:"food",   name:"Vegetables with every meal", xp:15, freq:"Daily"},
  {id:"h9",  cat:"food",   name:"No sugar after 8pm",         xp:20, freq:"Daily"},
  {id:"h10", cat:"social", name:"Call someone you love",      xp:20, freq:"Weekly"},
  {id:"h11", cat:"focus",  name:"90-min deep work block",     xp:30, freq:"Daily"},
  {id:"h12", cat:"focus",  name:"Review goals every morning", xp:20, freq:"Daily"},
];

// ═══════════════════════════════════════════════════════════
// 😊 MOOD DATA — The emotional intelligence layer
// ═══════════════════════════════════════════════════════════
const MOODS = [
  {id:"great",   emoji:"🤩", label:"Thriving",   score:10, color:GREEN},
  {id:"good",    emoji:"😊", label:"Good",        score:7,  color:GOLD},
  {id:"okay",    emoji:"😐", label:"Meh",         score:5,  color:DIM},
  {id:"low",     emoji:"😕", label:"Low",         score:3,  color:ORANGE},
  {id:"anxious", emoji:"😰", label:"Anxious",     score:2,  color:RED},
  {id:"burned",  emoji:"🔥", label:"Burned Out",  score:1,  color:RED},
];

const MOOD_PROFILES = {
  great:{
    persona:"⚡ Peak Coach", color:GREEN,
    tone:"You're locked in. Let's build on this momentum before the day takes over.",
    systemAddition:"User is thriving (10/10). Match their energy — ambitious, punchy, challenge them to go harder. Use 💪🔥⚡ emojis naturally.",
    chips:["🔥 Maximize this peak state","⚡ What's my biggest lever today?","🏆 Set a new personal record","🎯 Build on this momentum"],
  },
  good:{
    persona:"🎯 Wellness Coach", color:GOLD,
    tone:"Solid energy. This is the zone where real habits are built.",
    systemAddition:"User mood: good (7/10). Encouraging and practical. Focus on habit momentum. Use 💪✨🎯 naturally.",
    chips:["✨ Build on today's wins","🎯 What should I focus on?","📊 Weekly check-in","💡 Habit optimization"],
  },
  okay:{
    persona:"🧘 Mindful Guide", color:DIM,
    tone:"Steady is still moving. Let's find one small thing that feels good.",
    systemAddition:"User mood: meh (5/10). Calm, warm, low-pressure. Focus on small wins. Use 🌱💙🧘 naturally.",
    chips:["🌱 One small win right now","💙 Energy reset ritual","🧘 Quick mindfulness","✨ Feel better in 5 min"],
  },
  low:{
    persona:"💙 Empathy Coach", color:ORANGE,
    tone:"I see you. It's okay to be here. We go slow today.",
    systemAddition:"User mood: low (3/10). Warm, validating, NO performance pressure. CBT-informed. Use 💙🤗💛 naturally. Acknowledge feelings before advice.",
    chips:["💙 I need to talk","🤗 Ground me gently","💛 One tiny step forward","🌧️ Talk me through this"],
  },
  anxious:{
    persona:"🫁 Calm Anchor", color:RED,
    tone:"I'm right here with you. Let's slow your breath first. You're safe.",
    systemAddition:"User mood: anxious (2/10). PRIORITY: immediate nervous system regulation. Start with physiological sigh or box breathing. Slow, calm, grounding. Use 💙🫁🌊 naturally.",
    chips:["🫁 Help me calm down NOW","💙 Box breathing — guide me","🌊 Ground me in 60 seconds","🤍 What's happening to me?"],
  },
  burned:{
    persona:"🌱 Recovery Guide", color:"#f87171",
    tone:"Stop. You need actual rest — not productivity. I'm not going to push you today.",
    systemAddition:"User mood: burned out (1/10). DO NOT suggest goals or performance. Pure rest, compassion, nervous system recovery. Use 🌱💤🤍 naturally.",
    chips:["💤 Permission to rest","🌱 Minimum viable recovery","🤍 I'm exhausted — help","🫂 Just talk to me"],
  },
};

const COACH_MODES = [
  {id:"therapy",  icon:"💬", label:"Chat",    color:BLUE,  desc:"Your 24/7 wellness coach"},
  {id:"habits",   icon:"🔗", label:"Habits",  color:GREEN, desc:"Build lasting change"},
  {id:"adaptive", icon:"🎭", label:"Mood",    color:PURP,  desc:"Mood-adaptive coaching"},
  {id:"report",   icon:"📊", label:"Report",  color:GOLD,  desc:"AI weekly analysis"},
];

// ═══════════════════════════════════════════════════════════
// 📝 MARKDOWN RENDERER — Makes AI responses look beautiful
// ═══════════════════════════════════════════════════════════
function MxMarkdown({text}) {
  if (!text) return null;
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^### (.+)$/gm,   "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,    "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,     "<h1>$1</h1>")
    .replace(/^> (.+)$/gm,     "<blockquote>$1</blockquote>")
    .replace(/^---$/gm,        "<hr/>")
    .replace(/^- (.+)$/gm,     "<li>$1</li>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\n\n/g,          "</p><p>")
    .replace(/\n/g,            " ");
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`);
  return <div className="mx-prose" dangerouslySetInnerHTML={{__html:`<p>${html}</p>`}}/>;
}

// ═══════════════════════════════════════════════════════════
// 🖼️ LOGO COMPONENT — ManifiX brand mark with glow effects
// ═══════════════════════════════════════════════════════════
function MxLogo({size=48, glow=false}) {
  return (
    <div style={{width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0}}>
      {glow && (
        <div style={{
          position:"absolute", inset:-18,
          background:`radial-gradient(circle, ${GOLD}28 0%, transparent 65%)`,
          borderRadius:"50%",
          animation:"mx-pulse 3.5s ease-in-out infinite",
          pointerEvents:"none",
        }}/>
      )}
      <img
        src="src/assets/logo.png"
        alt="ManifiX"
        style={{
          width:size, height:size,
          objectFit:"contain",
          display:"block",
          filter: glow ? `drop-shadow(0 0 ${size*.2}px ${GOLD}90)` : "none",
          animation: glow ? "mx-float 3.5s ease-in-out infinite" : "none",
        }}
        onError={e => {
          // 🛡️ Fallback: geometric M logo if image fails
          e.target.style.display = "none";
          e.target.parentNode.innerHTML = `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#ffc83c,#c8a84b);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:${size*.55}px;color:#060608;letter-spacing:-1px">M</div>`;
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🏋️ HABIT TRACKER — Full behavioral change system
// ═══════════════════════════════════════════════════════════
function HabitTracker({onAskCoach}) {
  const [habits,     setHabits]     = useState(() => { try { return JSON.parse(localStorage.getItem("gpt_habits")||"[]"); } catch { return []; } });
  const [view,       setView]       = useState("today");
  const [selCat,     setSelCat]     = useState("all");
  const [customName, setCustomName] = useState("");
  const [customCat,  setCustomCat]  = useState("mind");
  const today = new Date().toDateString();

  const save = h => { setHabits(h); localStorage.setItem("gpt_habits", JSON.stringify(h)); };

  const addTemplate = t => {
    if (habits.find(h=>h.templateId===t.id)) return;
    save([...habits, {id:Date.now(), templateId:t.id, name:t.name, cat:t.cat, xp:t.xp, freq:t.freq, streak:0, completions:[]}]);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    save([...habits, {id:Date.now(), templateId:null, name:customName.trim(), cat:customCat, xp:20, freq:"Daily", streak:0, completions:[]}]);
    setCustomName(""); setView("today");
  };

  const toggle = id => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.completions.includes(today);
      const completions = done ? h.completions.filter(d=>d!==today) : [...h.completions, today];
      // 🔥 Calculate streak properly
      let streak = 0;
      const sorted = [...completions].sort((a,b)=>new Date(b)-new Date(a));
      let cur = new Date(); cur.setHours(0,0,0,0);
      for (let d of sorted) {
        const dd = new Date(d); dd.setHours(0,0,0,0);
        if ((cur-dd)/86400000 <= streak+1) { streak++; cur=dd; } else break;
      }
      return {...h, completions, streak};
    });
    save(updated);
  };

  const remove = id => save(habits.filter(h=>h.id!==id));

  const todayDone  = habits.filter(h=>h.completions.includes(today));
  const totalXP    = todayDone.reduce((a,h)=>a+h.xp, 0);
  const rate       = habits.length ? Math.round((todayDone.length/habits.length)*100) : 0;
  const getCatData = c => HABIT_CATS.find(x=>x.id===c) || {icon:"🎯", color:GOLD};

  return (
    <div style={{display:"flex", flexDirection:"column", gap:10}}>

      {/* 📌 Tab navigation */}
      <div style={{display:"flex", gap:6, borderBottom:`1px solid ${BOR}`, paddingBottom:10}}>
        {[
          {id:"today",   label:"📅 Today"},
          {id:"library", label:"📚 Library"},
          {id:"add",     label:"✏️ Custom"},
        ].map(v=>(
          <button key={v.id} className="mx-btn" onClick={()=>setView(v.id)} style={{
            padding:"6px 14px", background:"transparent",
            border:`1px solid ${view===v.id ? GOLD : BOR}`,
            color:view===v.id ? GOLD : MUTED,
            fontFamily:FONT, fontSize:7, letterSpacing:".16em", textTransform:"uppercase",
          }}>{v.label}</button>
        ))}
      </div>

      {/* 📅 TODAY VIEW */}
      {view==="today" && (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>

          {/* 📊 Stats bar */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
            {[
              {label:"✅ Done",  value:`${todayDone.length}/${habits.length}`, color:GREEN},
              {label:"⚡ XP",    value:`+${totalXP}`,                          color:GOLD},
              {label:"📈 Rate",  value:`${rate}%`, color:rate>=70?GREEN:rate>=40?GOLD:RED},
            ].map(s=>(
              <div key={s.label} style={{background:CARD, border:`1px solid ${BOR}`, padding:"10px 12px"}}>
                <div style={{fontSize:6, letterSpacing:".18em", color:SUB, textTransform:"uppercase", marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:HEAD, fontSize:22, color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {habits.length > 0 && (
            <div style={{height:3, background:BOR, borderRadius:2, overflow:"hidden"}}>
              <div style={{height:"100%", width:`${rate}%`, background:`linear-gradient(90deg,${rate>=70?GREEN:GOLD},${rate>=70?"#86efac":"#fde68a"})`, transition:"width .6s ease"}}/>
            </div>
          )}

          {/* 🈳 Empty state */}
          {habits.length===0 && (
            <div style={{background:CARD, border:`1px solid ${BOR}`, padding:32, textAlign:"center"}}>
              <div style={{fontSize:42, marginBottom:12}}>🔗</div>
              <div style={{fontFamily:HEAD, fontSize:20, color:TEXT, marginBottom:8}}>NO HABITS YET</div>
              <div style={{fontSize:9, color:SUB, marginBottom:18, lineHeight:2}}>
                "We are what we repeatedly do.<br/>Excellence, then, is not an act, but a habit." 🏛️
              </div>
              <button className="mx-btn" onClick={()=>setView("library")} style={{
                padding:"10px 24px", background:GOLD, color:BG, border:"none",
                fontFamily:FONT, fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase",
              }}>Browse Library →</button>
            </div>
          )}

          {/* 🔗 Habit list */}
          {habits.map(h=>{
            const done    = h.completions.includes(today);
            const catData = getCatData(h.cat);
            return (
              <div key={h.id} className="mx-rise" style={{
                background:done ? "#070f07" : CARD,
                border:`1px solid ${done ? "#1a3d1a" : BOR}`,
                padding:"12px 16px", display:"flex", alignItems:"center", gap:12, transition:"all .25s",
              }}>
                <button className="mx-btn" onClick={()=>toggle(h.id)} style={{
                  width:30, height:30, borderRadius:"50%", flexShrink:0,
                  background:done ? `${GREEN}20` : "transparent",
                  border:`2px solid ${done ? GREEN : BOR}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, color:done ? GREEN : BOR,
                }}>{done ? "✓" : ""}</button>
                <div style={{flex:1}}>
                  <div style={{fontSize:10, color:done?GREEN:TEXT, textDecoration:done?"line-through":"none", letterSpacing:".03em", marginBottom:4}}>
                    {catData.icon} {h.name}
                  </div>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <span style={{fontSize:6, color:catData.color, letterSpacing:".12em", textTransform:"uppercase", border:`1px solid ${catData.color}33`, padding:"1px 6px"}}>{h.cat}</span>
                    <span style={{fontSize:7, color:SUB}}>+{h.xp} XP</span>
                    {h.streak>0 && <span style={{fontSize:8, color:GOLD}}>🔥 {h.streak}d streak</span>}
                    {h.streak>=7 && <span style={{fontSize:8, color:GREEN}}>🏆 WEEK DONE!</span>}
                  </div>
                </div>
                <button className="mx-btn" onClick={()=>remove(h.id)} style={{background:"transparent", border:"none", color:SUB, fontSize:18, padding:"2px 6px"}}>×</button>
              </div>
            );
          })}

          {/* 🤖 Ask Coach button */}
          {habits.length > 0 && (
            <button className="mx-btn" onClick={()=>onAskCoach(`My habits today: ${rate}% complete. Done: ${todayDone.map(h=>h.name).join(", ")||"none"}. Pending: ${habits.filter(h=>!h.completions.includes(today)).map(h=>h.name).join(", ")||"none"}. Give me behavioral coaching and help me finish strong today! 💪`)} style={{
              width:"100%", padding:"13px 0", background:`${GOLD}10`, border:`1px solid ${GOLD}28`,
              color:GOLD, fontFamily:FONT, fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase",
            }}>✨ Ask ManifiX AI About My Habits</button>
          )}
        </div>
      )}

      {/* 📚 LIBRARY VIEW */}
      {view==="library" && (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
            {[{id:"all", icon:"✦", label:"All"}, ...HABIT_CATS].map(c=>(
              <button key={c.id} className="mx-btn mx-chip" onClick={()=>setSelCat(c.id)} style={{
                padding:"4px 10px", fontSize:7, letterSpacing:".12em",
                background:selCat===c.id ? `${GOLD}15` : "transparent",
                border:`1px solid ${selCat===c.id ? GOLD : BOR}`,
                color:selCat===c.id ? GOLD : SUB, fontFamily:FONT, textTransform:"uppercase",
              }}>{c.icon} {c.label}</button>
            ))}
          </div>
          {HABIT_TEMPLATES.filter(t=>selCat==="all"||t.cat===selCat).map(t=>{
            const already  = !!habits.find(h=>h.templateId===t.id);
            const catData  = getCatData(t.cat);
            return (
              <div key={t.id} style={{background:already?`${GREEN}08`:CARD, border:`1px solid ${already?"#1a3d1a":BOR}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9, color:already?GREEN:TEXT, marginBottom:4, letterSpacing:".03em"}}>{catData.icon} {t.name}</div>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <span style={{fontSize:6, color:catData.color, letterSpacing:".1em", border:`1px solid ${catData.color}33`, padding:"1px 5px", textTransform:"uppercase"}}>{t.cat}</span>
                    <span style={{fontSize:7, color:SUB}}>+{t.xp} XP · {t.freq}</span>
                  </div>
                </div>
                <button className="mx-btn" onClick={()=>addTemplate(t)} disabled={already} style={{
                  padding:"6px 14px", background:already?"transparent":GOLD,
                  color:already?"#1a3d1a":BG, border:`1px solid ${already?"#1a3d1a":GOLD}`,
                  fontFamily:FONT, fontSize:7, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase",
                }}>{already ? "✓ Added" : "+ Add"}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ✏️ CUSTOM HABIT VIEW */}
      {view==="add" && (
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          <div style={{background:`${PURP}0c`, border:`1px solid ${PURP}22`, padding:"12px 16px", fontSize:9, color:`${PURP}cc`, lineHeight:1.9}}>
            💡 The most powerful habits are the ones YOU design. What matters to you?
          </div>
          <div>
            <div style={{fontSize:7, letterSpacing:".18em", color:SUB, textTransform:"uppercase", marginBottom:6}}>✏️ Habit name</div>
            <input value={customName} onChange={e=>setCustomName(e.target.value)}
              placeholder="e.g. Journal for 5 minutes before bed"
              onKeyDown={e=>e.key==="Enter"&&addCustom()}
              style={{width:"100%", background:CARD, border:`1px solid ${BOR}`, color:TEXT, fontFamily:FONT, fontSize:11, padding:"10px 14px"}}
            />
          </div>
          <div>
            <div style={{fontSize:7, letterSpacing:".18em", color:SUB, textTransform:"uppercase", marginBottom:6}}>🏷️ Category</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {HABIT_CATS.map(c=>(
                <button key={c.id} className="mx-btn mx-chip" onClick={()=>setCustomCat(c.id)} style={{
                  padding:"6px 12px", fontSize:8, letterSpacing:".1em",
                  background:customCat===c.id ? `${c.color}20` : "transparent",
                  border:`1px solid ${customCat===c.id ? c.color : BOR}`,
                  color:customCat===c.id ? c.color : SUB, fontFamily:FONT,
                }}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
          <button className="mx-btn" onClick={addCustom} disabled={!customName.trim()} style={{
            padding:"13px 0", background:customName.trim() ? GOLD : "#0d0d10",
            color:customName.trim() ? BG : MUTED,
            border:customName.trim() ? "none" : `1px solid ${BOR}`,
            fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase",
          }}>✨ Add Custom Habit</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎭 MOOD ADAPTIVE PANEL — Emotional intelligence module
// Reads how you're feeling, shifts the entire coaching style
// ═══════════════════════════════════════════════════════════
function MoodPanel({onAskCoach, onSetMoodProfile}) {
  const [selMood, setSelMood] = useState(null);
  const [checked, setChecked] = useState(false);

  const handleMood = mood => {
    setSelMood(mood);
    onSetMoodProfile(MOOD_PROFILES[mood.id]);
    setChecked(true);
  };

  const profile = selMood ? MOOD_PROFILES[selMood.id] : null;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:10}}>
      {!checked ? (
        <>
          <div style={{background:`${PURP}0d`, border:`1px solid ${PURP}20`, padding:"14px 16px", fontSize:9, color:`${PURP}cc`, lineHeight:1.85, letterSpacing:".04em"}}>
            🎭 ManifiX reads your emotional state and completely shifts its coaching approach.<br/>
            <span style={{color:SUB}}>There's no wrong answer. Just be honest.</span>
          </div>
          <div style={{fontSize:7, letterSpacing:".2em", color:SUB, textTransform:"uppercase", marginBottom:2}}>How are you feeling right now?</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
            {MOODS.map(m=>(
              <button key={m.id} className="mx-btn mx-pop" onClick={()=>handleMood(m)} style={{
                padding:"16px 8px", background:CARD, border:`1px solid ${BOR}`,
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                transition:"all .2s",
              }}>
                <span style={{fontSize:30}}>{m.emoji}</span>
                <span style={{fontSize:7, letterSpacing:".1em", color:SUB, textTransform:"uppercase"}}>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{background:`linear-gradient(135deg,#080808,#0b0b07)`, border:`1px solid ${profile.color}28`, padding:"18px 20px", position:"relative", overflow:"hidden"}}>
            <div style={{position:"absolute", right:-40, top:-40, width:130, height:130, borderRadius:"50%", background:`radial-gradient(${profile.color}18,transparent 70%)`, pointerEvents:"none"}}/>
            <div style={{fontSize:7, letterSpacing:".2em", color:`${profile.color}80`, textTransform:"uppercase", marginBottom:8}}>🎭 Mood Detected · Coaching Adapting</div>
            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:12}}>
              <span style={{fontSize:36}}>{selMood.emoji}</span>
              <div>
                <div style={{fontFamily:HEAD, fontSize:26, color:profile.color}}>{selMood.label.toUpperCase()}</div>
                <div style={{fontSize:8, color:SUB, letterSpacing:".08em"}}>{profile.persona}</div>
              </div>
            </div>
            <div style={{fontSize:10, color:TEXT, lineHeight:1.9, fontStyle:"italic", borderLeft:`2px solid ${profile.color}40`, paddingLeft:14, marginBottom:14}}>
              "{profile.tone}"
            </div>
            <button className="mx-btn" onClick={()=>{setChecked(false);setSelMood(null);onSetMoodProfile(null);}} style={{
              background:"transparent", border:`1px solid ${BOR}`, color:SUB, fontFamily:FONT,
              fontSize:7, letterSpacing:".14em", padding:"5px 12px", textTransform:"uppercase",
            }}>← Change mood</button>
          </div>

          <div style={{fontSize:7, letterSpacing:".18em", color:SUB, textTransform:"uppercase"}}>✨ Recommended for your state</div>
          {profile.chips.map((chip,i)=>(
            <button key={i} className="mx-btn" onClick={()=>onAskCoach(chip)} style={{
              padding:"13px 16px", background:CARD, border:`1px solid ${BOR}`,
              color:TEXT, fontFamily:FONT, fontSize:9, letterSpacing:".04em",
              textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span>{chip}</span>
              <span style={{color:SUB, fontSize:14}}>→</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 📊 WEEKLY REPORT BUILDER — AI-powered health analysis
// ═══════════════════════════════════════════════════════════
function buildReportPrompt(stats, lang) {
  const moduleData    = collectAllModuleData();
  const moduleContext = buildModuleContext(moduleData);
  return `You are ManifiX AI. Generate a deeply personal weekly wellness report.

${moduleContext}
Stats: Streak ${stats.streak}d | XP ${stats.xp} | Level ${stats.level} | Rank #${stats.globalRank?.toLocaleString()}

Write in ${lang.label}. Sound like a brilliant friend reviewing my week with me over coffee — warm, honest, sharp. Use emojis naturally throughout.

Structure:
1. 🏆 **Weekly Summary** — 2 punchy, personal sentences about THIS person's actual week
2. 📊 **Your Numbers** — use the real data above, make it meaningful
3. 🧠 **ManifiX Sees** — one sharp, specific observation about a pattern or trend
4. 🎯 **One Goal** — the single most impactful thing to focus on next week
5. 💎 **Closing** — one sentence that actually lands emotionally

Never mention any other AI. Never be corporate. Never be generic. Make it feel like it's ABOUT THEM.`;
}

// ═══════════════════════════════════════════════════════════
// 🧠 CHAT ENGINE — The core AI communication system
// Handles streaming, voice, history, and context injection
// ═══════════════════════════════════════════════════════════
function useChatEngine({lang, moodProfile}) {
  const [messages,   setMessages]   = useState(()=>{ try { return JSON.parse(localStorage.getItem("gpt_chat3")||"null")||[]; } catch { return []; } });
  const [generating, setGenerating] = useState(false);
  const [voiceOn,    setVoiceOn]    = useState(false);
  const esRef = useRef(null);

  // 💾 Auto-save last 30 messages
  useEffect(()=>{ localStorage.setItem("gpt_chat3", JSON.stringify(messages.slice(-30))); }, [messages]);

  // 🔊 Text-to-speech synthesis
  const speak = useCallback(text=>{
    if (!window.speechSynthesis || !voiceOn) return;
    const utter  = new SpeechSynthesisUtterance(text.replace(/[*#_`🎯💪🧠😴🥗💊🌸🔗⚡🔥✨🏆📊💙🤗💛🤍🌱🫁]/gu,"").substring(0,400));
    utter.rate   = 0.92;
    utter.lang   = lang.voice;
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v=>v.lang.startsWith(lang.bcp47.split("-")[0]));
    if (match) utter.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [lang, voiceOn]);

  // 📤 SEND MESSAGE — the main communication function
  const sendMessage = useCallback((text, systemHint="")=>{
    if (!text.trim() || generating) return;

    const userMsg = {id:Date.now(),   role:"user",      content:text};
    const botId   = Date.now()+1;
    const botMsg  = {id:botId,        role:"assistant", content:"", streaming:true};
    setMessages(prev=>[...prev, userMsg, botMsg]);
    setGenerating(true);

    // 🧩 Build full context for the AI
    const moduleData    = collectAllModuleData();
    const moduleContext = buildModuleContext(moduleData);
    const moodCtx       = moodProfile ? `\n\nACTIVE COACHING PERSONA: ${moodProfile.systemAddition}` : "";
    const hintCtx       = systemHint  ? `\n\n[System hint: ${systemHint}]` : "";
    const fullMsg       = `${MANIFIX_IDENTITY}\n\n${moduleContext}${moodCtx}${hintCtx}\n\nUser: ${text}`;

    // 🌊 Stream the response via EventSource
    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(fullMsg)}&lang=${encodeURIComponent(lang.bcp47)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    let full = "";
    es.onmessage = e => {
      if (e.data === "[DONE]") {
        es.close(); setGenerating(false);
        setMessages(prev=>prev.map(m=>m.id===botId ? {...m, streaming:false} : m));
        speak(full);
        return;
      }
      full += e.data.replace(/\\n/g,"\n");
      setMessages(prev=>prev.map(m=>m.id===botId ? {...m, content:full} : m));
    };
    es.onerror = () => {
      es.close(); setGenerating(false);
      setMessages(prev=>prev.map(m=>m.id===botId ? {...m, content:"⚠️ Signal lost. Try again.", streaming:false} : m));
    };
  }, [generating, lang, moodProfile, speak]);

  // 📊 Weekly report shortcut
  const sendReport = useCallback(()=>{
    if (generating) return;
    const stats  = readUserStats();
    const prompt = buildReportPrompt(stats, lang);
    sendMessage("📊 Generate my ManifiX weekly report", prompt);
  }, [generating, lang, sendMessage]);

  const clearChat = () => { setMessages([]); localStorage.removeItem("gpt_chat3"); };

  return {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat};
}

// ═══════════════════════════════════════════════════════════
// 📺 TICKER TAPE — Scrolling brand message at the top
// ═══════════════════════════════════════════════════════════
function TickerTape() {
  const text = "ManifiX AI✦   ";
  return (
    <div style={{overflow:"hidden", borderBottom:`1px solid ${BOR}`, background:`linear-gradient(90deg,${BG},#0a0900,${BG})`, height:22, display:"flex", alignItems:"center"}}>
      <div style={{display:"inline-flex", whiteSpace:"nowrap", animation:"mx-ticker 35s linear infinite"}}>
        {[text, text].map((t,i)=>(
          <span key={i} style={{fontSize:7, color:DIM, letterSpacing:".16em", textTransform:"uppercase", paddingRight:40}}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🔲 CORNER MARKS — Subtle sci-fi frame effect
// ═══════════════════════════════════════════════════════════
function CornerMarks() {
  return (
    <>
      {[
        {top:8,  left:8,  borderTopWidth:1, borderLeftWidth:1},
        {top:8,  right:8, borderTopWidth:1, borderRightWidth:1},
        {bottom:8, left:8,  borderBottomWidth:1, borderLeftWidth:1},
        {bottom:8, right:8, borderBottomWidth:1, borderRightWidth:1},
      ].map((pos,i)=>(
        <div key={i} style={{position:"fixed", width:14, height:14, borderColor:GOLD, borderStyle:"solid", borderWidth:0, opacity:.12, pointerEvents:"none", zIndex:0, ...pos}}/>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 💬 TYPING DOTS — Shows AI is "thinking"
// ═══════════════════════════════════════════════════════════
function TypingDots() {
  return (
    <div style={{display:"flex", gap:6, alignItems:"center", height:24, padding:"4px 0"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:6, height:6, borderRadius:"50%", background:GOLD,
          animation:`mx-dot 1s ${i*.18}s ease-in-out infinite`,
        }}/>
      ))}
      <span style={{fontSize:8, color:SUB, letterSpacing:".1em", marginLeft:4}}>ManifiX is thinking...</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN APP — The full ManifiX AI experience
// ═══════════════════════════════════════════════════════════
export default function Gpt() {
  const [lang,        setLang]        = useState(readLang);
  const [mode,        setMode]        = useState("therapy");
  const [moodProfile, setMoodProfile] = useState(null);
  const [input,       setInput]       = useState("");
  const [langMenuOpen,setLangMenuOpen]= useState(false);
  const chatRef = useRef(null);

  const {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat} =
    useChatEngine({lang, moodProfile});

  // 💉 Inject CSS on mount
  useEffect(()=>{ injectCSS(); }, []);

  // 🌍 Re-read language when window gets focus (user may have changed in settings)
  useEffect(()=>{
    const onFocus = ()=>setLang(readLang());
    window.addEventListener("focus", onFocus);
    return ()=>window.removeEventListener("focus", onFocus);
  }, []);

  // 📜 Auto-scroll chat to bottom
  useEffect(()=>{
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || generating) return;
    sendMessage(input);
    setInput("");
  };

  const handleAskCoach = text => { setMode("therapy"); sendMessage(text); };

  // 💬 Context-aware quick chips
  const THERAPY_CHIPS = moodProfile ? moodProfile.chips : [
    "🌅 What's my health score today?",
    "💊 Did I take my meds?",
    "😴 Analyze my sleep",
    "🧠 I feel anxious",
    "💪 Motivate me",
    "📊 How am I doing this week?",
    "🏥 My chronic disease status",
    "✨ Give me a CBT technique",
  ];

  const stats = readUserStats();

  // ═══════════════════════════════════════════════════
  // 🎨 RENDER — The full visual experience
  // ═══════════════════════════════════════════════════
  return (
    <div style={{
      minHeight:"100dvh", background:BG, color:TEXT, fontFamily:FONT,
      display:"flex", flexDirection:"column", alignItems:"center",
      overflow:"hidden", position:"relative",
    }}>

      {/* 🌐 Background grid pattern */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`linear-gradient(rgba(255,200,60,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.012) 1px,transparent 1px)`,
        backgroundSize:"42px 42px",
      }}/>

      {/* ✨ Center radial glow */}
      <div style={{
        position:"fixed", top:"12%", left:"50%", transform:"translateX(-50%)",
        width:560, height:280, pointerEvents:"none", zIndex:0,
        background:`radial-gradient(ellipse,${GOLD}07 0%,transparent 68%)`,
        animation:"mx-pulse 6s ease-in-out infinite",
      }}/>

      {/* 🔫 Scan line effect */}
      <div style={{
        position:"fixed", left:0, right:0, height:1, zIndex:5, pointerEvents:"none",
        background:`linear-gradient(90deg,transparent,${GOLD}14,${GOLD}40,${GOLD}14,transparent)`,
        animation:"mx-scan 8s linear infinite",
      }}/>

      <CornerMarks/>

      {/* 📱 Main container — responsive, centered */}
      <div style={{
        position:"relative", zIndex:2, width:"min(480px,97vw)",
        display:"flex", flexDirection:"column", height:"100dvh", overflow:"hidden",
      }}>

        {/* ════════════════════════════════════
            🔝 HEADER — Logo, stats, mode tabs
        ════════════════════════════════════ */}
        <div style={{flexShrink:0}}>
          <TickerTape/>

          <div style={{borderBottom:`1px solid ${BOR}`, padding:"12px 0 0"}}>

            {/* Top row: Logo + stats */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>

              {/* 🖼️ Logo + wordmark */}
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <MxLogo size={40}/>
                <div>
                  <div className="mx-shimmer" style={{fontFamily:HEAD, fontSize:26, letterSpacing:".06em", lineHeight:1}}>MANIFIX AI</div>
                  <div style={{fontSize:6, color:SUB, letterSpacing:".18em", textTransform:"uppercase", marginTop:2}}>by Yesh Rajana 🇮🇳</div>
                </div>
              </div>

              {/* 📈 Stats + language */}
              <div style={{display:"flex", gap:5, alignItems:"center"}}>
                {[
                  {label:"🔥", value:`${stats.streak}d`, title:"Streak"},
                  {label:"⚡", value:stats.xp,           title:"XP"},
                  {label:"🏅", value:`L${stats.level}`,  title:"Level"},
                ].map(s=>(
                  <div key={s.title} title={s.title} style={{background:CARD, border:`1px solid ${BOR}`, padding:"5px 8px", textAlign:"center", minWidth:40}}>
                    <div style={{fontSize:6, color:SUB, marginBottom:1}}>{s.label}</div>
                    <div style={{fontFamily:HEAD, fontSize:14, color:GOLD, lineHeight:1}}>{s.value}</div>
                  </div>
                ))}

                {/* 🌍 Language selector */}
                <div style={{position:"relative"}}>
                  <button className="mx-btn" onClick={()=>setLangMenuOpen(v=>!v)} style={{
                    background:CARD, border:`1px solid ${BOR}`, padding:"5px 8px",
                    color:SUB, fontFamily:FONT, fontSize:7, letterSpacing:".1em",
                  }}>
                    {lang.flag}<br/><span style={{fontSize:6}}>{lang.label.split(" ")[0]}</span>
                  </button>
                  {langMenuOpen && (
                    <div style={{position:"absolute", right:0, top:"110%", background:CARD, border:`1px solid ${BOR}`, zIndex:10, minWidth:120}}>
                      {Object.entries(LANG_MAP).map(([code,l])=>(
                        <button key={code} className="mx-btn" onClick={()=>{ localStorage.setItem(SK.lang,code); setLang(l); setLangMenuOpen(false); }} style={{
                          display:"block", width:"100%", padding:"7px 14px", background:"transparent", border:"none",
                          borderBottom:`1px solid ${BOR}`, color:lang===l?GOLD:TEXT, fontFamily:FONT, fontSize:8,
                          textAlign:"left", letterSpacing:".06em",
                        }}>{l.flag} {l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 📌 Mode tabs */}
            <div style={{display:"flex", gap:0, overflowX:"auto", scrollbarWidth:"none"}}>
              {COACH_MODES.map(m=>(
                <button key={m.id} className="mx-btn" onClick={()=>{
                  setMode(m.id);
                  if (m.id==="report") { setTimeout(sendReport, 80); setMode("therapy"); }
                }} style={{
                  flexShrink:0, padding:"9px 14px", background:"transparent", border:"none",
                  borderBottom:`2px solid ${mode===m.id ? m.color : "transparent"}`,
                  color:mode===m.id ? m.color : SUB,
                  fontFamily:FONT, fontSize:7, letterSpacing:".14em", textTransform:"uppercase",
                  whiteSpace:"nowrap", transition:"all .2s",
                }}>{m.icon} {m.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════
            📌 HABIT / MOOD PANELS (non-chat)
        ════════════════════════════════════ */}
        {(mode==="habits" || mode==="adaptive") && (
          <div className="mx-rise" style={{flex:1, overflowY:"auto", padding:"14px 0"}}>
            {mode==="habits"   && <HabitTracker onAskCoach={handleAskCoach}/>}
            {mode==="adaptive" && <MoodPanel    onAskCoach={handleAskCoach} onSetMoodProfile={setMoodProfile}/>}
          </div>
        )}

        {/* ════════════════════════════════════
            💬 CHAT PANEL — The main experience
        ════════════════════════════════════ */}
        {mode==="therapy" && (
          <>
            {/* 🎭 Active mood profile badge */}
            {moodProfile && (
              <div style={{flexShrink:0, padding:"7px 0", borderBottom:`1px solid ${BOR}`, display:"flex", alignItems:"center", gap:8}}>
                <div style={{
                  display:"flex", alignItems:"center", gap:8,
                  background:`${moodProfile.color}0e`, border:`1px solid ${moodProfile.color}28`,
                  padding:"5px 14px", fontSize:8, color:moodProfile.color, letterSpacing:".08em",
                }}>
                  <span>{moodProfile.persona}</span>
                  <span style={{color:SUB}}>· active</span>
                </div>
                <button className="mx-btn" onClick={()=>setMoodProfile(null)} style={{background:"transparent", border:"none", color:SUB, fontSize:16, padding:"2px 6px"}}>×</button>
              </div>
            )}

            {/* 📜 Messages scroll area */}
            <div ref={chatRef} style={{
              flex:1, overflowY:"auto", padding:"16px 0",
              display:"flex", flexDirection:"column", gap:14,
            }}>

              {/* 🈳 Empty state — welcoming, human */}
              {messages.length===0 && (
                <div style={{margin:"auto", textAlign:"center", padding:"36px 16px"}}>
                  <div style={{display:"flex", justifyContent:"center", marginBottom:22}}>
                    <MxLogo size={88} glow={true}/>
                  </div>

                  <div className="mx-shimmer" style={{fontFamily:HEAD, fontSize:34, marginBottom:6, letterSpacing:".08em", lineHeight:1}}>
                    MANIFIX AI
                  </div>

                  <div style={{fontSize:10, color:SUB, lineHeight:2, letterSpacing:".04em", marginBottom:8, marginTop:12}}>
                    Your 24/7 personal wellness intelligence. 💪<br/>
                    I know your sleep, stress, habits, meds, and more.<br/>
                    Ask me anything — I'll be real with you.
                  </div>

                  <div style={{fontSize:9, color:`${GOLD}88`, letterSpacing:".06em", marginBottom:20, fontStyle:"italic"}}>
                    "The best investment you can make is in yourself." 🏆
                  </div>

                  <div style={{display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center"}}>
                    {[
                      "🌅 How am I doing today?",
                      "🏥 Check my chronic disease",
                      "💊 Did I take my meds?",
                      "🧠 I feel anxious",
                    ].map((q,i)=>(
                      <button key={i} className="mx-btn mx-chip" onClick={()=>sendMessage(q)} style={{
                        padding:"7px 14px", fontSize:8, letterSpacing:".06em",
                        background:"transparent", border:`1px solid ${BOR}`,
                        color:SUB, fontFamily:FONT,
                      }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 💬 Message bubbles */}
              {messages.map((msg,idx)=>(
                <div key={msg.id} className="mx-rise" style={{
                  animationDelay:`${idx * .015}s`,
                  display:"flex", flexDirection:"column",
                  alignItems:msg.role==="user" ? "flex-end" : "flex-start",
                }}>

                  {/* 👤 Message sender label */}
                  <div style={{
                    fontSize:6, letterSpacing:".2em", textTransform:"uppercase",
                    color:msg.role==="user" ? `${GOLD}60` : SUB,
                    marginBottom:5, display:"flex", alignItems:"center", gap:6,
                  }}>
                    {msg.role==="user" ? "You 👤" : (
                      <>
                        <MxLogo size={13}/>
                        <span>{moodProfile ? moodProfile.persona : "ManifiX AI"}</span>
                      </>
                    )}
                  </div>

                  {/* 💬 Bubble */}
                  <div style={{
                    maxWidth:"91%",
                    background:msg.role==="user" ? `${GOLD}0c` : CARD,
                    border:`1px solid ${msg.role==="user" ? `${GOLD}22` : BOR}`,
                    padding:"13px 17px", position:"relative",
                    boxShadow:msg.role==="assistant" ? "0 3px 28px rgba(0,0,0,.45)" : "none",
                  }}>
                    {/* ✨ Gold top accent on AI messages */}
                    {msg.role==="assistant" && (
                      <div style={{position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${GOLD}44,transparent)`}}/>
                    )}

                    {/* ⏳ Typing dots while streaming and empty */}
                    {msg.streaming && !msg.content && <TypingDots/>}

                    {/* 📝 Rendered markdown content */}
                    <MxMarkdown text={msg.content}/>

                    {/* 📋 Copy + share actions on completed AI messages */}
                    {msg.role==="assistant" && !msg.streaming && msg.content && (
                      <div style={{display:"flex", gap:6, marginTop:10, paddingTop:9, borderTop:`1px solid ${BOR}`}}>
                        <button className="mx-btn" onClick={()=>navigator.clipboard?.writeText(msg.content.replace(/[*#_`]/g,""))} style={{
                          background:"transparent", border:`1px solid ${BOR}`, color:SUB,
                          fontFamily:FONT, fontSize:7, padding:"3px 10px", letterSpacing:".1em", textTransform:"uppercase",
                        }}>📋 Copy</button>
                        {msg.content.includes("Weekly Summary") && (
                          <button className="mx-btn" onClick={()=>{
                            const t = msg.content.replace(/[*#_`]/g,"").substring(0,600);
                            navigator.share ? navigator.share({title:"ManifiX Weekly Report 📊", text:t}) : navigator.clipboard?.writeText(t);
                          }} style={{
                            background:"transparent", border:`1px solid ${BOR}`, color:SUB,
                            fontFamily:FONT, fontSize:7, padding:"3px 10px", letterSpacing:".1em", textTransform:"uppercase",
                          }}>↗ Share</button>
                        )}
                        <button className="mx-btn" onClick={()=>sendMessage(`Tell me more about that last point 🤔`)} style={{
                          background:"transparent", border:`1px solid ${BOR}`, color:SUB,
                          fontFamily:FONT, fontSize:7, padding:"3px 10px", letterSpacing:".1em", textTransform:"uppercase",
                        }}>🔍 Expand</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 🏷️ Quick chips */}
            <div style={{
              flexShrink:0, display:"flex", gap:6, overflowX:"auto",
              padding:"8px 0", scrollbarWidth:"none", borderTop:`1px solid ${BOR}`,
            }}>
              {THERAPY_CHIPS.map((c,i)=>(
                <button key={i} className="mx-btn mx-chip" onClick={()=>sendMessage(c)} style={{
                  flexShrink:0, padding:"5px 12px", fontSize:7, letterSpacing:".08em",
                  background:"transparent", border:`1px solid ${BOR}`,
                  color:SUB, fontFamily:FONT, whiteSpace:"nowrap",
                }}>{c}</button>
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════════
            ⌨️ INPUT AREA — Where you talk to ManifiX
        ════════════════════════════════════ */}
        {mode==="therapy" && (
          <div style={{flexShrink:0, borderTop:`1px solid ${BOR}`, padding:"10px 0 18px", display:"flex", flexDirection:"column", gap:8}}>

            {/* 📝 Text input */}
            <div className="mx-input-wrap" style={{
              display:"flex", gap:8, alignItems:"flex-end",
              background:CARD, border:`1px solid ${BOR}`, padding:"9px 10px", transition:"all .2s",
            }}>
              <textarea
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),handleSend())}
                placeholder={moodProfile
                  ? `${moodProfile.persona} is listening... 💙`
                  : "Ask ManifiX anything about your health... 💬"}
                rows={2}
                style={{
                  flex:1, background:"transparent", border:"none",
                  color:TEXT, fontFamily:FONT, fontSize:11, letterSpacing:".03em", lineHeight:1.85,
                }}
              />
              <div style={{display:"flex", flexDirection:"column", gap:5, flexShrink:0}}>
                {/* 🔊 Voice toggle */}
                <button className="mx-btn" onClick={()=>setVoiceOn(v=>!v)} title={voiceOn?"Voice ON":"Voice OFF"} style={{
                  width:34, height:28, background:voiceOn?`${GOLD}15`:"transparent",
                  border:`1px solid ${voiceOn?GOLD:BOR}`, color:voiceOn?GOLD:SUB, fontSize:14,
                }}>{voiceOn ? "🔊" : "🔇"}</button>
                {/* ▲ Send button */}
                <button className="mx-btn" onClick={handleSend} disabled={generating||!input.trim()} style={{
                  width:34, height:38,
                  background:generating||!input.trim() ? "transparent" : GOLD,
                  color:generating||!input.trim() ? MUTED : BG,
                  border:generating||!input.trim() ? `1px solid ${BOR}` : `1px solid ${GOLD}`,
                  fontFamily:FONT, fontSize:16, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {generating
                    ? <div style={{width:8, height:8, background:GOLD, borderRadius:"50%", animation:"mx-blink .6s infinite"}}/>
                    : "▲"
                  }
                </button>
              </div>
            </div>

            {/* 🛠️ Bottom action bar */}
            <div style={{display:"flex", gap:6, justifyContent:"space-between", alignItems:"center"}}>
              <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
                <button className="mx-btn mx-chip" onClick={sendReport} disabled={generating} style={{
                  padding:"5px 12px", fontSize:7, letterSpacing:".12em",
                  background:`${GOLD}0e`, border:`1px solid ${GOLD}28`,
                  color:DIM, fontFamily:FONT, textTransform:"uppercase",
                }}>📊 Weekly Report</button>
                <button className="mx-btn mx-chip" onClick={()=>setMode("adaptive")} style={{
                  padding:"5px 12px", fontSize:7, letterSpacing:".12em",
                  background:"transparent", border:`1px solid ${BOR}`,
                  color:SUB, fontFamily:FONT, textTransform:"uppercase",
                }}>🎭 Mood Mode</button>
                <button className="mx-btn mx-chip" onClick={()=>setMode("habits")} style={{
                  padding:"5px 12px", fontSize:7, letterSpacing:".12em",
                  background:"transparent", border:`1px solid ${BOR}`,
                  color:SUB, fontFamily:FONT, textTransform:"uppercase",
                }}>🔗 Habits</button>
              </div>
              {messages.length>0 && (
                <button className="mx-btn" onClick={clearChat} style={{
                  background:"transparent", border:`1px solid ${BOR}`, color:SUB,
                  fontFamily:FONT, fontSize:7, letterSpacing:".12em", padding:"5px 10px", textTransform:"uppercase",
                }}>↺ Clear</button>
              )}
            </div>

            {/* 🔒 Footer */}
            <div style={{textAlign:"center", fontSize:6, color:MUTED, letterSpacing:".16em", textTransform:"uppercase", marginTop:2}}>
              ManifiX AI 
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ⬅️ Back button for non-chat modes
        ════════════════════════════════════ */}
        {(mode==="habits" || mode==="adaptive") && (
          <div style={{flexShrink:0, borderTop:`1px solid ${BOR}`, padding:"10px 0"}}>
            <button className="mx-btn" onClick={()=>setMode("therapy")} style={{
              width:"100%", padding:"11px 0", background:"transparent", border:`1px solid ${BOR}`,
              color:SUB, fontFamily:FONT, fontSize:8, letterSpacing:".16em", textTransform:"uppercase",
            }}>← Back to ManifiX AI</button>
          </div>
        )}

      </div>
    </div>
  );
}
