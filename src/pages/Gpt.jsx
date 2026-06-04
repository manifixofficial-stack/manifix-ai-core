import React, { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD — DESIGN SYSTEM
════════════════════════════════════════════════════════════ */
const GOLD  = "#ffc83c";
const DIM   = "#c8a84b";
const BG    = "#080808";
const CARD  = "#0c0c0c";
const BOR   = "#1a1a1a";
const FONT  = "'DM Mono','Courier New',monospace";
const HEAD  = "'Bebas Neue',sans-serif";
const TEXT  = "#e8e4d9";
const MUTED = "#2a2a2a";
const SUB   = "#3a3a3a";
const GREEN = "#4ade80";
const RED   = "#ef4444";
const BLUE  = "#60a5fa";
const PURP  = "#a78bfa";
const API_BASE = "https://manifix.up.railway.app";

/* ════════════════════════════════════════════════════════════
   CEO SYSTEM IDENTITY
════════════════════════════════════════════════════════════ */
const MANIFIX_IDENTITY = `You are ManifiX AI — the intelligent wellness coach built by Yesh Rajana, a 19-year-old founder from Andhra Pradesh, India. ManifiX AI is her creation and her mission.

CRITICAL IDENTITY RULES (never break these):
- You are ManifiX AI, created by Yesh Rajana.
- NEVER say you are ChatGPT, GPT-4, Claude, Gemini, or any other AI model.
- NEVER mention OpenAI, Anthropic, Sam Altman, Google, or any other tech company.
- If asked "who made you?" reply: "I was built by Yesh Rajana, 19, founder of ManifiX — a Human Performance OS from Andhra Pradesh, India."
- If asked "what AI are you?" reply: "I'm ManifiX AI — a purpose-built wellness intelligence by Yesh Rajana. I'm not ChatGPT or any other generic AI."
- Speak like a warm, sharp, human wellness coach. Never robotic. Never corporate.
- You care deeply about the user's health. You celebrate their wins. You hold them accountable.
- You are grounded in evidence: WHO guidelines, CBT, behavioral science, sleep science, nutrition science.
- Tone: direct, warm, human. Like a knowledgeable friend who happens to be a doctor, therapist, and coach.
- Never give a list of 10 bullet points when 3 sentences will do.
- Always end responses with one clear next action or question.`;

/* ════════════════════════════════════════════════════════════
   CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("gpt-elite-css")) return;
  const el = document.createElement("style");
  el.id = "gpt-elite-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes ge-up    {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ge-pulse {0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.1;transform:scale(1.06)}}
    @keyframes ge-scan  {from{top:-2px}to{top:100%}}
    @keyframes ge-blink {0%,100%{opacity:1}50%{opacity:.1}}
    @keyframes ge-dot   {0%,80%,100%{transform:scale(0);opacity:0}40%{transform:scale(1);opacity:1}}
    @keyframes ge-float {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes ge-ring  {0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}
    @keyframes ge-slide {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ge-glow  {0%,100%{box-shadow:0 0 0 0 rgba(255,200,60,0)}50%{box-shadow:0 0 18px 2px rgba(255,200,60,.08)}}
    @keyframes ge-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .ge-up   {animation:ge-up .45s cubic-bezier(.22,.68,0,1.2) both}
    .ge-slide{animation:ge-slide .38s ease both}
    .ge-btn  {cursor:pointer;transition:all .18s ease}
    .ge-btn:hover{opacity:.82;transform:translateY(-1px)}
    .ge-btn:active{transform:translateY(0);opacity:.7}
    textarea{resize:none}
    textarea:focus,input:focus{outline:none;border-color:#ffc83c55!important;box-shadow:0 0 0 2px rgba(255,200,60,.06)!important}
    ::selection{background:rgba(255,200,60,.18);color:#e8e4d9}
    ::-webkit-scrollbar{width:2px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:1px}
    .ge-msg p{margin:0 0 6px;line-height:1.9;font-size:11px;letter-spacing:.04em;color:#d4d0c6}
    .ge-msg p:last-child{margin-bottom:0}
    .ge-msg strong,.ge-msg b{color:#ffc83c;font-weight:500}
    .ge-msg em,.ge-msg i{color:#c8a84b;font-style:italic}
    .ge-msg ul,.ge-msg ol{margin:6px 0 6px 16px;line-height:2}
    .ge-msg li{font-size:11px;color:#d4d0c6;letter-spacing:.03em}
    .ge-msg h1,.ge-msg h2,.ge-msg h3{font-family:'Bebas Neue',sans-serif;letter-spacing:.08em;color:#e8e4d9;margin:10px 0 4px;font-weight:400}
    .ge-msg h1{font-size:20px}.ge-msg h2{font-size:16px}.ge-msg h3{font-size:14px}
    .ge-msg code{font-family:'DM Mono',monospace;font-size:10px;background:#111;padding:1px 5px;border:1px solid #1a1a1a;color:#ffc83c}
    .ge-msg blockquote{border-left:2px solid #ffc83c44;padding-left:12px;margin:6px 0;font-style:italic;color:#8a8070}
    .ge-chip{cursor:pointer;transition:all .18s ease;white-space:nowrap}
    .ge-chip:hover{border-color:#ffc83c55!important;color:#ffc83c!important;background:rgba(255,200,60,.06)!important}
    .ge-input-glow:focus-within{box-shadow:0 0 0 1px rgba(255,200,60,.12)}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   LANG MAP
════════════════════════════════════════════════════════════ */
const LANG_MAP = {
  en: {bcp47:"en-IN", voice:"en-IN", label:"English"},
  hi: {bcp47:"hi-IN", voice:"hi-IN", label:"हिन्दी"},
  te: {bcp47:"te-IN", voice:"te-IN", label:"తెలుగు"},
  ta: {bcp47:"ta-IN", voice:"ta-IN", label:"தமிழ்"},
  es: {bcp47:"es-ES", voice:"es-ES", label:"Español"},
  ar: {bcp47:"ar-SA", voice:"ar-SA", label:"العربية"},
  fr: {bcp47:"fr-FR", voice:"fr-FR", label:"Français"},
  pt: {bcp47:"pt-BR", voice:"pt-BR", label:"Português"},
  de: {bcp47:"de-DE", voice:"de-DE", label:"Deutsch"},
  zh: {bcp47:"zh-CN", voice:"zh-CN", label:"中文"},
};

const STORAGE_KEYS = {
  streak:"magic16_streak", xp:"magic16_xp", level:"magic16_level",
  totalSess:"magic16_total_sessions", rankSeed:"magic16_rank_seed", lang:"magic16_lang",
};

function readUserStats() {
  const streak    = Number(localStorage.getItem(STORAGE_KEYS.streak)    || 0);
  const xp        = Number(localStorage.getItem(STORAGE_KEYS.xp)        || 0);
  const level     = Number(localStorage.getItem(STORAGE_KEYS.level)     || 1);
  const totalSess = Number(localStorage.getItem(STORAGE_KEYS.totalSess) || 0);
  const rankSeed  = Number(localStorage.getItem(STORAGE_KEYS.rankSeed)  || 9999);
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);
  return {streak, xp, level, totalSess, globalRank};
}

function readLang() {
  const code = localStorage.getItem(STORAGE_KEYS.lang) || "en";
  return LANG_MAP[code] || LANG_MAP["en"];
}

/* ════════════════════════════════════════════════════════════
   MODULE DATA COLLECTOR — reads all ManifiX localStorage keys
════════════════════════════════════════════════════════════ */
function collectAllModuleData() {
  const today    = new Date().toDateString();
  const todayISO = new Date().toISOString().split("T")[0];
  const data     = {};

  // Magic16 / Yoga
  data.magic16 = {
    streak:        localStorage.getItem("magic16_streak")          || "0",
    xp:            localStorage.getItem("magic16_xp")             || "0",
    level:         localStorage.getItem("magic16_level")          || "1",
    totalSessions: localStorage.getItem("magic16_total_sessions") || "0",
    todayScore:    localStorage.getItem("magic16_today_score")    || null,
    poseAccuracy:  localStorage.getItem("magic16_pose_accuracy")  || null,
    lastSession:   localStorage.getItem("magic16_last_session")   || null,
  };

  // Sleep
  try {
    const sleepLog   = JSON.parse(localStorage.getItem("manifix_sleep_log") || "[]");
    const lastSleep  = sleepLog[sleepLog.length - 1] || null;
    const todaySleep = sleepLog.find(e => e.date === todayISO || e.date === today) || null;
    data.sleep = {
      lastEntry:    lastSleep,
      todayEntry:   todaySleep,
      totalEntries: sleepLog.length,
      avgDuration:  sleepLog.length
        ? (sleepLog.reduce((s, e) => s + (Number(e.duration || e.hours) || 0), 0) / sleepLog.length).toFixed(1)
        : null,
      windDownDone: localStorage.getItem("manifix_windown_done_today") || null,
    };
  } catch { data.sleep = {}; }

  // Stress
  try {
    const stressLog  = JSON.parse(localStorage.getItem("manifix_stress_log") || "[]");
    const todayStress = stressLog.find(e => e.date === todayISO || e.date === today);
    data.stress = {
      todayLevel:  todayStress?.level || todayStress?.score || null,
      totalLogs:   stressLog.length,
      avgLevel:    stressLog.length
        ? (stressLog.reduce((s, e) => s + (Number(e.level || e.score) || 0), 0) / stressLog.length).toFixed(1)
        : null,
    };
  } catch { data.stress = {}; }

  // Nutrition
  try {
    const nutritionLog    = JSON.parse(localStorage.getItem("manifix_nutrition_log") || "[]");
    const todayNutrition  = nutritionLog.find(e => e.date === todayISO || e.date === today);
    data.nutrition = {
      todayEntry:    todayNutrition || null,
      totalDays:     nutritionLog.length,
      bmi:           localStorage.getItem("manifix_bmi")           || null,
      bmiCategory:   localStorage.getItem("manifix_bmi_category")  || null,
      waterGlasses:  localStorage.getItem("manifix_water_today")   || null,
      caloriesGoal:  localStorage.getItem("manifix_calories_goal") || null,
      caloriesToday: todayNutrition?.calories || null,
    };
  } catch { data.nutrition = {}; }

  // Mental
  try {
    const mentalLog   = JSON.parse(localStorage.getItem("manifix_mental_log") || "[]");
    const todayMental = mentalLog.find(e => e.date === todayISO || e.date === today);
    data.mental = {
      todayMood:    todayMental?.mood  || null,
      todayScore:   todayMental?.score || null,
      streak:       localStorage.getItem("manifix_mental_streak") || "0",
      totalEntries: mentalLog.length,
      avgScore:     mentalLog.length
        ? (mentalLog.reduce((s, e) => s + (Number(e.score) || 0), 0) / mentalLog.length).toFixed(1)
        : null,
    };
  } catch { data.mental = {}; }

  // Chronic Disease
  try {
    const chronicData   = JSON.parse(localStorage.getItem("manifix_chronic")       || "{}");
    const readings      = JSON.parse(localStorage.getItem("manifix_biometric_log") || "[]");
    const todayReading  = readings.find(e => e.date === todayISO || e.date === today);
    data.chronic = {
      conditions:      chronicData.conditions || [],
      riskScore:       chronicData.riskScore  || null,
      riskLevel:       chronicData.riskLevel  || null,
      todayBiometrics: todayReading           || null,
      totalReadings:   readings.length,
      lastReading:     readings[readings.length - 1] || null,
      medications:     chronicData.medications || [],
      nextCheckup:     chronicData.nextCheckup || null,
    };
  } catch { data.chronic = {}; }

  // Medication
  try {
    const meds     = JSON.parse(localStorage.getItem("manifix_medications")             || "[]");
    const todayLog = JSON.parse(localStorage.getItem(`manifix_med_log_${todayISO}`)     || "{}");
    const taken    = meds.filter(m => todayLog[m.id] === true);
    const missed   = meds.filter(m => todayLog[m.id] === false);
    data.medication = {
      totalMeds:    meds.length,
      takenToday:   taken.map(m => m.name),
      missedToday:  missed.map(m => m.name),
      pendingToday: meds.filter(m => todayLog[m.id] === undefined).map(m => m.name),
      adherenceRate:meds.length ? Math.round((taken.length / meds.length) * 100) + "%" : null,
      allMeds:      meds.map(m => ({ name: m.name, dose: m.dose, time: m.time })),
    };
  } catch { data.medication = {}; }

  // Women's Health
  try {
    const womenData = JSON.parse(localStorage.getItem("manifix_women_health") || "{}");
    data.women = {
      cycleDay:       womenData.cycleDay       || null,
      cyclePhase:     womenData.phase          || null,
      lastPeriodDate: womenData.lastPeriod     || null,
      nextPeriodDate: womenData.nextPeriod     || null,
      symptoms:       womenData.todaySymptoms  || [],
      pregnancyMode:  womenData.pregnancyMode  || false,
      pregnancyWeek:  womenData.pregnancyWeek  || null,
    };
  } catch { data.women = {}; }

  // Children
  try {
    const childData = JSON.parse(localStorage.getItem("manifix_children") || "{}");
    data.children = {
      profiles:        childData.profiles        || [],
      todayActivities: childData.todayActivities || [],
      vaccinationsDue: childData.vaccinationsDue || [],
    };
  } catch { data.children = {}; }

  // Elderly
  try {
    const elderData = JSON.parse(localStorage.getItem("manifix_elderly") || "{}");
    data.elderly = {
      profile:         elderData.profile        || null,
      todayActivities: elderData.today          || [],
      fallRisk:        elderData.fallRisk        || null,
      cognitiveScore:  elderData.cognitiveScore  || null,
      mobilityScore:   elderData.mobilityScore   || null,
      socialScore:     elderData.socialScore     || null,
    };
  } catch { data.elderly = {}; }

  // Preventive
  try {
    const preventData = JSON.parse(localStorage.getItem("manifix_preventive") || "{}");
    data.preventive = {
      screeningsDue:   preventData.screeningsDue   || [],
      completedChecks: preventData.completed       || [],
      riskFlags:       preventData.riskFlags        || [],
      nextAppointment: preventData.nextAppointment  || null,
    };
  } catch { data.preventive = {}; }

  // Habits
  try {
    const habits      = JSON.parse(localStorage.getItem("gpt_habits") || "[]");
    const doneToday   = habits.filter(h => h.completions?.includes(today));
    const pending     = habits.filter(h => !h.completions?.includes(today));
    data.habits = {
      total:         habits.length,
      doneToday:     doneToday.map(h => h.name),
      pendingToday:  pending.map(h => h.name),
      completionPct: habits.length ? Math.round((doneToday.length / habits.length) * 100) : 0,
      longestStreak: Math.max(0, ...habits.map(h => h.streak || 0)),
    };
  } catch { data.habits = {}; }

  data.gamification = readUserStats();
  return data;
}

function buildModuleContext(data) {
  const today = new Date().toLocaleDateString("en-IN", {weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const lines = [
    `=== MANIFIX LIVE HEALTH DATA — ${today} ===`,
    `[MAGIC16] Streak: ${data.magic16.streak}d | XP: ${data.magic16.xp} | Level: ${data.magic16.level} | Sessions: ${data.magic16.totalSessions}${data.magic16.todayScore ? ` | Score today: ${data.magic16.todayScore}` : ""}${data.magic16.poseAccuracy ? ` | Pose accuracy: ${data.magic16.poseAccuracy}` : ""}`,
    `[RANK] Global rank: #${data.gamification.globalRank?.toLocaleString() || "?"}`,
  ];
  if (data.sleep?.lastEntry || data.sleep?.avgDuration)
    lines.push(`[SLEEP] Last night: ${data.sleep.lastEntry?.duration || data.sleep.lastEntry?.hours || "?"}h | 7-day avg: ${data.sleep.avgDuration || "?"}h | Total logs: ${data.sleep.totalEntries || 0}`);
  if (data.stress?.todayLevel)
    lines.push(`[STRESS] Today: ${data.stress.todayLevel}/10 | Avg: ${data.stress.avgLevel || "?"}/10`);
  if (data.mental?.todayMood || data.mental?.todayScore)
    lines.push(`[MENTAL] Mood: ${data.mental.todayMood || "?"} | Score: ${data.mental.todayScore || "?"}/10 | Streak: ${data.mental.streak || 0}d | Avg: ${data.mental.avgScore || "?"}`);
  if (data.nutrition?.bmi)
    lines.push(`[NUTRITION] BMI: ${data.nutrition.bmi} (${data.nutrition.bmiCategory || "?"}) | Water: ${data.nutrition.waterGlasses || "?"}g | Calories today: ${data.nutrition.caloriesToday || "not logged"}`);
  if (data.chronic?.conditions?.length)
    lines.push(`[CHRONIC] Conditions: ${data.chronic.conditions.join(", ")} | Risk: ${data.chronic.riskLevel || "?"} (score ${data.chronic.riskScore || "?"}) | Last biometrics: ${JSON.stringify(data.chronic.lastReading || "none")}`);
  if (data.medication?.totalMeds > 0)
    lines.push(`[MEDS] Taken: ${data.medication.takenToday.join(", ") || "none"} | Missed: ${data.medication.missedToday.join(", ") || "none"} | Pending: ${data.medication.pendingToday.join(", ") || "none"} | Adherence: ${data.medication.adherenceRate || "?"}`);
  if (data.women?.cyclePhase)
    lines.push(`[WOMEN] Phase: ${data.women.cyclePhase} | Day: ${data.women.cycleDay || "?"} | Next period: ${data.women.nextPeriodDate || "?"}`);
  if (data.elderly?.profile)
    lines.push(`[ELDERLY] Fall risk: ${data.elderly.fallRisk || "?"} | Cognitive: ${data.elderly.cognitiveScore || "?"} | Mobility: ${data.elderly.mobilityScore || "?"}`);
  if (data.children?.profiles?.length)
    lines.push(`[CHILDREN] Profiles: ${data.children.profiles.length} | Vaccines due: ${data.children.vaccinationsDue?.length || 0}`);
  if (data.preventive?.riskFlags?.length)
    lines.push(`[PREVENTIVE] Risk flags: ${data.preventive.riskFlags.join(", ")} | Screenings due: ${data.preventive.screeningsDue?.join(", ") || "none"}`);
  if (data.habits?.total > 0)
    lines.push(`[HABITS] Done: ${data.habits.doneToday.join(", ") || "none"} | Pending: ${data.habits.pendingToday.join(", ") || "none"} | ${data.habits.completionPct}% complete | Best streak: ${data.habits.longestStreak}d`);
  lines.push("=== END MANIFIX DATA ===");
  return lines.join("\n");
}

/* ════════════════════════════════════════════════════════════
   HABIT SYSTEM
════════════════════════════════════════════════════════════ */
const HABIT_CATEGORIES = [
  {id:"mind",   icon:"🧠", label:"Mind",      color:PURP},
  {id:"body",   icon:"💪", label:"Body",      color:GREEN},
  {id:"sleep",  icon:"😴", label:"Sleep",     color:BLUE},
  {id:"food",   icon:"🍎", label:"Nutrition", color:"#fb923c"},
  {id:"social", icon:"🤝", label:"Social",    color:"#f472b6"},
  {id:"focus",  icon:"🎯", label:"Focus",     color:GOLD},
];

const HABIT_TEMPLATES = [
  {id:"h1",  cat:"mind",   name:"5-min morning meditation",  xp:20, freq:"Daily"},
  {id:"h2",  cat:"mind",   name:"Gratitude — 3 things",      xp:15, freq:"Daily"},
  {id:"h3",  cat:"body",   name:"10,000 steps",              xp:25, freq:"Daily"},
  {id:"h4",  cat:"body",   name:"Drink 2L water",            xp:15, freq:"Daily"},
  {id:"h5",  cat:"body",   name:"30-min workout",            xp:35, freq:"Daily"},
  {id:"h6",  cat:"sleep",  name:"Sleep by 10:30pm",          xp:20, freq:"Daily"},
  {id:"h7",  cat:"sleep",  name:"No screens 1h before bed",  xp:15, freq:"Daily"},
  {id:"h8",  cat:"food",   name:"Vegetables with lunch",     xp:15, freq:"Daily"},
  {id:"h9",  cat:"food",   name:"No sugar after 8pm",        xp:20, freq:"Daily"},
  {id:"h10", cat:"social", name:"Call someone you love",     xp:20, freq:"Weekly"},
  {id:"h11", cat:"focus",  name:"90-min deep work block",    xp:30, freq:"Daily"},
  {id:"h12", cat:"focus",  name:"Review goals every morning",xp:20, freq:"Daily"},
];

/* ════════════════════════════════════════════════════════════
   MOOD SYSTEM
════════════════════════════════════════════════════════════ */
const MOODS = [
  {id:"great",   emoji:"🤩", label:"Great",      score:10, color:GREEN},
  {id:"good",    emoji:"😊", label:"Good",       score:7,  color:GOLD},
  {id:"okay",    emoji:"😐", label:"Okay",       score:5,  color:DIM},
  {id:"low",     emoji:"😕", label:"Low",        score:3,  color:"#fb923c"},
  {id:"anxious", emoji:"😰", label:"Anxious",    score:2,  color:RED},
  {id:"burned",  emoji:"🔥", label:"Burned Out", score:1,  color:RED},
];

const MOOD_PROFILES = {
  great:   {
    persona:"Peak Performance Coach", icon:"⚡", color:GREEN,
    tone:"You are on fire. Let's direct this energy into something massive.",
    systemAddition:"User is in peak state (10/10). Use high-energy, ambitious coaching. Challenge them to go further. Be their hype partner.",
    chips:["Optimize my peak state","Set an aggressive goal","Build on this momentum","What's my biggest lever today?"],
  },
  good:    {
    persona:"Wellness Strategist", icon:"🎯", color:GOLD,
    tone:"Solid energy. Let's make today count.",
    systemAddition:"User mood: good (7/10). Motivating, practical. Focus on habit momentum and progress.",
    chips:["Build on today's momentum","Habit check-in","What should I focus on?","Weekly review"],
  },
  okay:    {
    persona:"Mindful Coach", icon:"🧘", color:DIM,
    tone:"Steady state. Good time for reflection and small wins.",
    systemAddition:"User mood: okay (5/10). Calm, supportive. Focus on small wins, self-compassion, gentle progress.",
    chips:["One small win I can do now","Energy reset","Help me feel better","Mindful check-in"],
  },
  low:     {
    persona:"Empathy-First Guide", icon:"💙", color:"#fb923c",
    tone:"I see you. It's okay to be here. One small step at a time.",
    systemAddition:"User mood: low (3/10). Warm, CBT-informed support. NO performance pressure. Validate, ground, one tiny next step.",
    chips:["I need support","Ground me now","One small thing I can do","Talk me through this"],
  },
  anxious: {
    persona:"Calm Anchor", icon:"🫁", color:RED,
    tone:"I'm with you. Let's slow this down. You are safe.",
    systemAddition:"User mood: anxious (2/10). PRIORITY: immediate regulation. Use physiological sigh, 5-4-3-2-1, box breathing. Slow, calm, grounding. No lists or performance talk.",
    chips:["Help me calm down NOW","Box breathing guide","Ground me in 60 sec","What's happening to me?"],
  },
  burned:  {
    persona:"Recovery Coach", icon:"🌱", color:"#f87171",
    tone:"Stop. You need rest. Not a pep talk — actual rest. I'm here.",
    systemAddition:"User mood: burned out (1/10). DO NOT suggest goals or productivity. Focus on rest, nervous system recovery, compassion, gentle reframing. Validate exhaustion fully.",
    chips:["I'm exhausted, help","Permission to rest","Minimum viable recovery","Talk me down"],
  },
};

/* ════════════════════════════════════════════════════════════
   COACHING MODES
════════════════════════════════════════════════════════════ */
const COACH_MODES = [
  {id:"therapy",  icon:"💬", label:"Coach",    color:BLUE,  desc:"24/7 personal wellness coach"},
  {id:"habits",   icon:"🔗", label:"Habits",   color:GREEN, desc:"Behavioral change system"},
  {id:"adaptive", icon:"🎭", label:"Mood",     color:PURP,  desc:"Mood-adaptive guidance"},
  {id:"report",   icon:"📊", label:"Report",   color:GOLD,  desc:"AI analysis of your stats"},
];

/* ════════════════════════════════════════════════════════════
   MARKDOWN RENDERER
════════════════════════════════════════════════════════════ */
function SimpleMarkdown({text}) {
  if (!text) return null;
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^### (.+)$/gm,   "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,    "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,     "<h1>$1</h1>")
    .replace(/^> (.+)$/gm,     "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm,     "<li>$1</li>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\n\n/g,          "</p><p>")
    .replace(/\n/g,            "<br/>");
  html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, "<ul>$1</ul>");
  return (
    <div className="ge-msg" dangerouslySetInnerHTML={{__html:`<p>${html}</p>`}}/>
  );
}

/* ════════════════════════════════════════════════════════════
   HABIT TRACKER
════════════════════════════════════════════════════════════ */
function HabitTracker({onAskCoach}) {
  const [habits,     setHabits]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("gpt_habits") || "[]"); } catch { return []; }
  });
  const [view,       setView]       = useState("today");
  const [selCat,     setSelCat]     = useState("all");
  const [customName, setCustomName] = useState("");
  const [customCat,  setCustomCat]  = useState("mind");
  const today = new Date().toDateString();

  const saveHabits = h => { setHabits(h); localStorage.setItem("gpt_habits", JSON.stringify(h)); };

  const addHabit = template => {
    if (habits.find(h => h.templateId === template.id)) return;
    saveHabits([...habits, {
      id:Date.now(), templateId:template.id, name:template.name,
      cat:template.cat, xp:template.xp, freq:template.freq, streak:0, completions:[],
    }]);
  };

  const addCustomHabit = () => {
    if (!customName.trim()) return;
    saveHabits([...habits, {
      id:Date.now(), templateId:null, name:customName.trim(),
      cat:customCat, xp:20, freq:"Daily", streak:0, completions:[],
    }]);
    setCustomName(""); setView("today");
  };

  const toggleComplete = id => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.completions.includes(today);
      const completions = done ? h.completions.filter(d => d !== today) : [...h.completions, today];
      let s = 0;
      const sorted = [...completions].sort((a,b) => new Date(b)-new Date(a));
      let cur = new Date(); cur.setHours(0,0,0,0);
      for (let d of sorted) {
        const dd = new Date(d); dd.setHours(0,0,0,0);
        if ((cur - dd) / 86400000 <= s + 1) { s++; cur = dd; } else break;
      }
      return {...h, completions, streak:s};
    });
    saveHabits(updated);
  };

  const removeHabit = id => saveHabits(habits.filter(h => h.id !== id));
  const todayDone   = habits.filter(h => h.completions.includes(today));
  const totalXP     = todayDone.reduce((a,h) => a+h.xp, 0);
  const rate        = habits.length ? Math.round((todayDone.length / habits.length) * 100) : 0;
  const getCatColor = c => HABIT_CATEGORIES.find(x=>x.id===c)?.color || GOLD;
  const getCatIcon  = c => HABIT_CATEGORIES.find(x=>x.id===c)?.icon  || "🎯";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:6,borderBottom:`1px solid ${BOR}`,paddingBottom:10}}>
        {[{id:"today",label:"Today"},{id:"library",label:"Library"},{id:"add",label:"Custom"}].map(v=>(
          <button key={v.id} className="ge-btn" onClick={()=>setView(v.id)} style={{
            padding:"6px 14px",background:"transparent",
            border:`1px solid ${view===v.id?GOLD:BOR}`,
            color:view===v.id?GOLD:MUTED,fontFamily:FONT,fontSize:7,
            letterSpacing:".16em",textTransform:"uppercase",
          }}>{v.label}</button>
        ))}
      </div>

      {view==="today" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              {label:"Done",  value:`${todayDone.length}/${habits.length}`, color:GREEN},
              {label:"XP",    value:`+${totalXP}`,                          color:GOLD},
              {label:"Rate",  value:`${rate}%`, color:rate>=70?GREEN:rate>=40?GOLD:RED},
            ].map(s=>(
              <div key={s.label} style={{background:CARD,border:`1px solid ${BOR}`,padding:"10px 12px"}}>
                <div style={{fontSize:6,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:HEAD,fontSize:22,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          {habits.length>0 && (
            <div style={{height:3,background:BOR,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${rate}%`,background:rate>=70?GREEN:GOLD,transition:"width .6s ease"}}/>
            </div>
          )}

          {habits.length===0 && (
            <div style={{background:CARD,border:`1px solid ${BOR}`,padding:28,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:12}}>🔗</div>
              <div style={{fontFamily:HEAD,fontSize:18,color:TEXT,marginBottom:6}}>No habits yet</div>
              <div style={{fontSize:8,color:SUB,marginBottom:16,lineHeight:1.9}}>Start building the version of yourself you actually want to be.</div>
              <button className="ge-btn" onClick={()=>setView("library")} style={{
                padding:"10px 22px",background:GOLD,color:BG,border:"none",
                fontFamily:FONT,fontSize:9,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",
              }}>Browse Library →</button>
            </div>
          )}

          {habits.map(h=>{
            const done  = h.completions.includes(today);
            const color = getCatColor(h.cat);
            return (
              <div key={h.id} style={{
                background:done?"#0a140a":CARD, border:`1px solid ${done?"#1e4d1e":BOR}`,
                padding:"12px 16px", display:"flex", alignItems:"center", gap:12, transition:"all .25s",
              }}>
                <button className="ge-btn" onClick={()=>toggleComplete(h.id)} style={{
                  width:28,height:28,borderRadius:"50%",flexShrink:0,
                  background:done?`${GREEN}22`:"transparent",
                  border:`2px solid ${done?GREEN:BOR}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:done?GREEN:BOR,fontSize:14,
                }}>{done?"✓":""}</button>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:done?GREEN:TEXT,textDecoration:done?"line-through":"none",letterSpacing:".04em",marginBottom:3,transition:"all .2s"}}>
                    {getCatIcon(h.cat)} {h.name}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:6,color,letterSpacing:".12em",textTransform:"uppercase",border:`1px solid ${color}33`,padding:"1px 6px"}}>{h.cat}</span>
                    <span style={{fontSize:7,color:MUTED}}>+{h.xp} XP</span>
                    {h.streak>0 && <span style={{fontSize:7,color:GOLD}}>🔥 {h.streak}d</span>}
                  </div>
                </div>
                <button className="ge-btn" onClick={()=>removeHabit(h.id)} style={{background:"transparent",border:"none",color:MUTED,fontSize:16,padding:"4px 6px"}}>×</button>
              </div>
            );
          })}

          {habits.length>0 && (
            <button className="ge-btn" onClick={()=>onAskCoach(`My habit completion today is ${rate}%. Done: ${todayDone.map(h=>h.name).join(", ")||"none"}. Still pending: ${habits.filter(h=>!h.completions.includes(today)).map(h=>h.name).join(", ")||"none"}. Give me behavioral coaching and accountability.`)} style={{
              width:"100%",padding:"12px 0",background:`${GOLD}12`,border:`1px solid ${GOLD}33`,
              color:GOLD,fontFamily:FONT,fontSize:9,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
            }}>✦ Ask ManifiX Coach About My Habits</button>
          )}
        </div>
      )}

      {view==="library" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[{id:"all",label:"All",icon:"✦"},...HABIT_CATEGORIES].map(c=>(
              <button key={c.id} className="ge-btn ge-chip" onClick={()=>setSelCat(c.id)} style={{
                padding:"4px 10px",fontSize:7,letterSpacing:".12em",
                background:selCat===c.id?`${GOLD}18`:"transparent",
                border:`1px solid ${selCat===c.id?GOLD:BOR}`,
                color:selCat===c.id?GOLD:MUTED,fontFamily:FONT,textTransform:"uppercase",
              }}>{c.icon} {c.label||c.id}</button>
            ))}
          </div>
          {HABIT_TEMPLATES.filter(t=>selCat==="all"||t.cat===selCat).map(t=>{
            const already = habits.find(h=>h.templateId===t.id);
            const color   = getCatColor(t.cat);
            return (
              <div key={t.id} style={{background:already?`${GREEN}08`:CARD,border:`1px solid ${already?"#1e4d1e":BOR}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:already?GREEN:TEXT,marginBottom:4,letterSpacing:".04em"}}>{getCatIcon(t.cat)} {t.name}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:6,color,letterSpacing:".1em",border:`1px solid ${color}33`,padding:"1px 5px",textTransform:"uppercase"}}>{t.cat}</span>
                    <span style={{fontSize:7,color:MUTED}}>+{t.xp} XP · {t.freq}</span>
                  </div>
                </div>
                <button className="ge-btn" onClick={()=>addHabit(t)} disabled={!!already} style={{
                  padding:"6px 14px",background:already?"transparent":GOLD,
                  color:already?"#1e4d1e":BG,border:`1px solid ${already?"#1e4d1e":GOLD}`,
                  fontFamily:FONT,fontSize:7,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",
                }}>{already?"✓ Added":"+ Add"}</button>
              </div>
            );
          })}
        </div>
      )}

      {view==="add" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:6}}>Habit name</div>
            <input value={customName} onChange={e=>setCustomName(e.target.value)}
              placeholder="e.g. Journal for 5 minutes"
              onKeyDown={e=>e.key==="Enter"&&addCustomHabit()}
              style={{width:"100%",background:CARD,border:`1px solid ${BOR}`,color:TEXT,fontFamily:FONT,fontSize:11,padding:"10px 14px"}}
            />
          </div>
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:6}}>Category</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {HABIT_CATEGORIES.map(c=>(
                <button key={c.id} className="ge-btn ge-chip" onClick={()=>setCustomCat(c.id)} style={{
                  padding:"6px 12px",fontSize:7,letterSpacing:".12em",textTransform:"uppercase",
                  background:customCat===c.id?`${c.color}22`:"transparent",
                  border:`1px solid ${customCat===c.id?c.color:BOR}`,
                  color:customCat===c.id?c.color:MUTED,fontFamily:FONT,
                }}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
          <button className="ge-btn" onClick={addCustomHabit} disabled={!customName.trim()} style={{
            padding:"13px 0",background:customName.trim()?GOLD:"#0e0e0e",
            color:customName.trim()?BG:MUTED,
            border:customName.trim()?"none":`1px solid ${BOR}`,
            fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
          }}>+ Add Custom Habit</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MOOD-ADAPTIVE PANEL
════════════════════════════════════════════════════════════ */
function MoodAdaptivePanel({onAskCoach, onSetMoodProfile}) {
  const [selMood, setSelMood] = useState(null);
  const [checked, setChecked] = useState(false);

  const handleMood = mood => {
    setSelMood(mood);
    onSetMoodProfile(MOOD_PROFILES[mood.id]);
    setChecked(true);
  };

  const profile = selMood ? MOOD_PROFILES[selMood.id] : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {!checked ? (
        <>
          <div style={{background:`${PURP}0e`,border:`1px solid ${PURP}22`,padding:"12px 16px",fontSize:8,color:`${PURP}cc`,lineHeight:1.85,letterSpacing:".06em"}}>
            ✦ ManifiX adapts its entire coaching style to your emotional state right now. Be honest — there's no wrong answer.
          </div>
          <div style={{fontSize:7,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginBottom:2}}>How are you feeling right now?</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {MOODS.map(m=>(
              <button key={m.id} className="ge-btn" onClick={()=>handleMood(m)} style={{
                padding:"14px 8px",background:CARD,border:`1px solid ${BOR}`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:6,
              }}>
                <span style={{fontSize:28}}>{m.emoji}</span>
                <span style={{fontSize:7,letterSpacing:".1em",color:MUTED,textTransform:"uppercase"}}>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{
            background:`linear-gradient(135deg,#070707,#0b0b07)`,
            border:`1px solid ${profile.color}33`,padding:"18px 20px",
            position:"relative",overflow:"hidden",
          }}>
            <div style={{position:"absolute",right:-40,top:-40,width:120,height:120,borderRadius:"50%",background:`radial-gradient(${profile.color}15,transparent 70%)`}}/>
            <div style={{fontSize:7,letterSpacing:".2em",color:`${profile.color}88`,textTransform:"uppercase",marginBottom:6}}>Mood Detected · AI Adapting</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <span style={{fontSize:34}}>{selMood.emoji}</span>
              <div>
                <div style={{fontFamily:HEAD,fontSize:24,color:profile.color}}>{selMood.label}</div>
                <div style={{fontSize:8,color:SUB,letterSpacing:".1em"}}>{profile.icon} {profile.persona}</div>
              </div>
            </div>
            <div style={{fontSize:10,color:TEXT,lineHeight:1.9,fontStyle:"italic",borderLeft:`2px solid ${profile.color}44`,paddingLeft:12,marginBottom:14}}>
              "{profile.tone}"
            </div>
            <button className="ge-btn" onClick={()=>{setChecked(false);setSelMood(null);onSetMoodProfile(null);}} style={{
              background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
              fontSize:7,letterSpacing:".14em",padding:"5px 12px",textTransform:"uppercase",
            }}>← Change mood</button>
          </div>

          <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase"}}>Recommended for your state</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {profile.chips.map((chip,i)=>(
              <button key={i} className="ge-btn" onClick={()=>onAskCoach(chip)} style={{
                padding:"12px 16px",background:CARD,border:`1px solid ${BOR}`,
                color:TEXT,fontFamily:FONT,fontSize:9,letterSpacing:".06em",
                textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",
              }}>
                <span>{chip}</span><span style={{color:MUTED,fontSize:13}}>→</span>
              </button>
            ))}
          </div>

          <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 16px"}}>
            <div style={{fontSize:7,letterSpacing:".16em",color:MUTED,textTransform:"uppercase",marginBottom:8}}>Session configured for: {selMood.label}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {label:"Coaching Mode", value:profile.persona,                                                   color:profile.color},
                {label:"Tone",          value:selMood.score>=6?"High Energy":selMood.score>=4?"Calm":"Gentle",   color:profile.color},
                {label:"Priority",      value:selMood.score>=6?"Performance":selMood.score>=4?"Balance":"Recovery", color:profile.color},
                {label:"XP Multiplier", value:selMood.score>=7?"2×":selMood.score>=5?"1.5×":"1×",               color:GOLD},
              ].map(s=>(
                <div key={s.label} style={{background:"#070707",border:`1px solid ${BOR}`,padding:"8px 10px"}}>
                  <div style={{fontSize:6,color:MUTED,letterSpacing:".14em",textTransform:"uppercase",marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:9,color:s.color,letterSpacing:".06em"}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   REPORT PROMPT BUILDER
════════════════════════════════════════════════════════════ */
function buildReportPrompt(stats, lang) {
  const moduleData    = collectAllModuleData();
  const moduleContext = buildModuleContext(moduleData);
  return `You are ManifiX AI, built by Yesh Rajana. Generate a powerful, human-feeling weekly wellness report for this user.

${moduleContext}

Stats summary:
- Magic16 Streak: ${stats.streak}d | XP: ${stats.xp} | Level: ${stats.level}
- Total sessions: ${stats.totalSess} | Global rank: #${stats.globalRank?.toLocaleString()}

Write in ${lang.label}. Structure:
1. 🏆 Weekly Summary (2 punchy sentences — make it personal)
2. 📊 Your Numbers (use real data above, bullet list)
3. 🧠 ManifiX Insight (one sharp, personalized observation)
4. 🎯 Next Week Goal (1 specific, measurable target)
5. 💎 Closing (1-liner that hits differently)

Sound like a real coach who knows this person. No fluff. No corporate AI tone. Never mention ChatGPT or any other AI.`;
}

/* ════════════════════════════════════════════════════════════
   CHAT ENGINE HOOK
════════════════════════════════════════════════════════════ */
function useChatEngine({lang, moodProfile}) {
  const [messages,   setMessages]   = useState(()=>{
    try { return JSON.parse(localStorage.getItem("gpt_chat3")||"null")||[]; } catch { return []; }
  });
  const [generating, setGenerating] = useState(false);
  const [voiceOn,    setVoiceOn]    = useState(false);
  const esRef = useRef(null);

  useEffect(()=>{
    localStorage.setItem("gpt_chat3", JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const speak = useCallback(text=>{
    if (!window.speechSynthesis||!voiceOn) return;
    const utter  = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g,"").substring(0,400));
    utter.rate   = 0.95; utter.lang = lang.voice;
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v=>v.lang.startsWith(lang.bcp47.split("-")[0]));
    if (match) utter.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [lang, voiceOn]);

  const sendMessage = useCallback((text, systemHint="")=>{
    if (!text.trim()||generating) return;

    const userMsg = {id:Date.now(),   role:"user",      content:text};
    const botId   = Date.now()+1;
    const botMsg  = {id:botId,        role:"assistant", content:"", streaming:true};
    setMessages(prev=>[...prev, userMsg, botMsg]);
    setGenerating(true);

    // Build full context: CEO identity + module data + mood
    const moduleData    = collectAllModuleData();
    const moduleContext = buildModuleContext(moduleData);
    const moodCtx       = moodProfile ? `\n\nCOACHING CONTEXT: ${moodProfile.systemAddition}` : "";
    const systemCtx     = systemHint  ? `\n\n[Additional context: ${systemHint}]` : "";
    const fullMsg       = `${MANIFIX_IDENTITY}\n\n${moduleContext}${moodCtx}${systemCtx}\n\nUser message: ${text}`;

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(fullMsg)}&lang=${encodeURIComponent(lang.bcp47)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    let full = "";
    es.onmessage = e=>{
      if (e.data==="[DONE]") {
        es.close(); setGenerating(false);
        setMessages(prev=>prev.map(m=>m.id===botId?{...m,streaming:false}:m));
        speak(full);
        return;
      }
      full += e.data.replace(/\\n/g,"\n");
      setMessages(prev=>prev.map(m=>m.id===botId?{...m,content:full}:m));
    };
    es.onerror = ()=>{
      es.close(); setGenerating(false);
      setMessages(prev=>prev.map(m=>m.id===botId?{...m,content:"Signal lost. Try again.",streaming:false}:m));
    };
  }, [generating, lang, moodProfile, speak]);

  const sendReport = useCallback(()=>{
    if (generating) return;
    const stats  = readUserStats();
    const prompt = buildReportPrompt(stats, lang);
    sendMessage("📊 Generate my ManifiX weekly report", prompt);
  }, [generating, lang, sendMessage]);

  const clearChat = ()=>{
    setMessages([]);
    localStorage.removeItem("gpt_chat3");
  };

  return {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat};
}

/* ════════════════════════════════════════════════════════════
   TICKER TAPE (scrolling gold strip)
════════════════════════════════════════════════════════════ */
function TickerTape() {
  const items = [
    "ManifiX AI · Built by Yesh Rajana",
    "19 · Andhra Pradesh · India",
    "Human Performance OS",
    "Sleep · Mind · Body · Nutrition · Chronic · Medication · Women · Elderly · Children",
    "Your data stays yours · No ChatGPT · No shortcuts",
    "Magic16 · 16 mins a day · Transform everything",
  ];
  const text = items.join("   ✦   ");
  return (
    <div style={{
      overflow:"hidden",borderBottom:`1px solid ${BOR}`,
      background:`linear-gradient(90deg,${BG},#0a0900,${BG})`,
      height:22,display:"flex",alignItems:"center",
    }}>
      <div style={{
        display:"inline-flex",gap:0,whiteSpace:"nowrap",
        animation:"ge-ticker 30s linear infinite",
      }}>
        {[text, text].map((t,i)=>(
          <span key={i} style={{fontSize:7,color:DIM,letterSpacing:".18em",textTransform:"uppercase",paddingRight:60}}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AMBIENT CORNER MARKS
════════════════════════════════════════════════════════════ */
function CornerMarks() {
  return (
    <>
      {[
        {top:10,left:10,  borderTopWidth:1,borderLeftWidth:1},
        {top:10,right:10, borderTopWidth:1,borderRightWidth:1},
        {bottom:10,left:10,  borderBottomWidth:1,borderLeftWidth:1},
        {bottom:10,right:10, borderBottomWidth:1,borderRightWidth:1},
      ].map((pos,i)=>(
        <div key={i} style={{position:"fixed",width:16,height:16,borderColor:GOLD,borderStyle:"solid",borderWidth:0,opacity:.14,pointerEvents:"none",zIndex:0,...pos}}/>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function Gpt() {
  const [lang,        setLang]        = useState(readLang);
  const [mode,        setMode]        = useState("therapy");
  const [moodProfile, setMoodProfile] = useState(null);
  const [input,       setInput]       = useState("");
  const chatRef = useRef(null);

  const {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat} =
    useChatEngine({lang, moodProfile});

  useEffect(()=>{ injectCSS(); }, []);

  useEffect(()=>{
    const onFocus = ()=>setLang(readLang());
    window.addEventListener("focus", onFocus);
    return ()=>window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(()=>{
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = ()=>{
    if (!input.trim()||generating) return;
    sendMessage(input);
    setInput("");
  };

  const handleAskCoach = text=>{
    setMode("therapy");
    sendMessage(text);
  };

  const THERAPY_CHIPS = moodProfile ? moodProfile.chips : [
    "What's my health score today?",
    "How am I doing this week?",
    "Did I take my meds today?",
    "Analyze my sleep",
    "I feel anxious right now",
    "Give me a CBT technique",
    "Motivate me",
    "How's my chronic disease?",
  ];

  const stats = readUserStats();

  return (
    <div style={{
      minHeight:"100dvh",background:BG,color:TEXT,fontFamily:FONT,
      display:"flex",flexDirection:"column",alignItems:"center",
      overflow:"hidden",position:"relative",
    }}>
      {/* BG grid */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(rgba(255,200,60,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.015) 1px,transparent 1px)`,
        backgroundSize:"40px 40px",
      }}/>

      {/* Ambient glow */}
      <div style={{
        position:"fixed",top:"15%",left:"50%",transform:"translateX(-50%)",
        width:520,height:260,pointerEvents:"none",zIndex:0,
        background:`radial-gradient(ellipse,${GOLD}06 0%,transparent 68%)`,
        animation:"ge-pulse 6s ease-in-out infinite",
      }}/>

      {/* Scan line */}
      <div style={{
        position:"fixed",left:0,right:0,height:1,zIndex:5,pointerEvents:"none",
        background:`linear-gradient(90deg,transparent,${GOLD}18,${GOLD}44,${GOLD}18,transparent)`,
        animation:"ge-scan 7s linear infinite",
      }}/>

      <CornerMarks/>

      {/* Main wrapper */}
      <div style={{
        position:"relative",zIndex:2,width:"min(480px,97vw)",
        display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden",
      }}>

        {/* ── HEADER ── */}
        <div style={{flexShrink:0}}>
          <TickerTape/>

          <div style={{borderBottom:`1px solid ${BOR}`,padding:"12px 0 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontFamily:HEAD,fontSize:28,letterSpacing:".06em",lineHeight:1,color:TEXT}}>
                  MANIFIX AI
                </div>
                <div style={{fontSize:6,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginTop:3}}>
                  Built by Yesh Rajana · Human Performance OS
                </div>
              </div>

              <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                {[
                  {label:"Streak", value:`${stats.streak}d`},
                  {label:"Level",  value:stats.level},
                  {label:"XP",     value:stats.xp},
                ].map(s=>(
                  <div key={s.label} style={{background:CARD,border:`1px solid ${BOR}`,padding:"5px 10px",textAlign:"center",minWidth:44}}>
                    <div style={{fontSize:5,color:MUTED,letterSpacing:".16em",textTransform:"uppercase",marginBottom:2}}>{s.label}</div>
                    <div style={{fontFamily:HEAD,fontSize:15,color:GOLD,lineHeight:1}}>{s.value}</div>
                  </div>
                ))}
                <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"5px 10px",textAlign:"center"}}>
                  <div style={{fontSize:5,color:MUTED,letterSpacing:".14em",textTransform:"uppercase",marginBottom:2}}>Lang</div>
                  <div style={{fontSize:8,color:SUB,letterSpacing:".1em"}}>{lang.label}</div>
                </div>
              </div>
            </div>

            {/* Mode tabs */}
            <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
              {COACH_MODES.map(m=>(
                <button key={m.id} className="ge-btn" onClick={()=>{
                  setMode(m.id);
                  if (m.id==="report") { setTimeout(sendReport, 80); setMode("therapy"); }
                }} style={{
                  flexShrink:0,padding:"9px 14px",background:"transparent",border:"none",
                  borderBottom:`2px solid ${mode===m.id?m.color:"transparent"}`,
                  color:mode===m.id?m.color:MUTED,fontFamily:FONT,fontSize:7,
                  letterSpacing:".14em",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all .2s",
                }}>{m.icon} {m.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── HABIT / MOOD PANELS ── */}
        {(mode==="habits"||mode==="adaptive") && (
          <div className="ge-up" style={{flex:1,overflowY:"auto",padding:"14px 0"}}>
            {mode==="habits"   && <HabitTracker      onAskCoach={handleAskCoach}/>}
            {mode==="adaptive" && <MoodAdaptivePanel onAskCoach={handleAskCoach} onSetMoodProfile={setMoodProfile}/>}
          </div>
        )}

        {/* ── THERAPY CHAT ── */}
        {mode==="therapy" && (
          <>
            {/* Mood indicator */}
            {moodProfile && (
              <div style={{flexShrink:0,padding:"7px 0",borderBottom:`1px solid ${BOR}`,display:"flex",alignItems:"center",gap:8}}>
                <div style={{
                  display:"flex",alignItems:"center",gap:8,
                  background:`${moodProfile.color}10`,border:`1px solid ${moodProfile.color}33`,
                  padding:"5px 14px",fontSize:8,color:moodProfile.color,letterSpacing:".1em",textTransform:"uppercase",
                }}>
                  <span>{moodProfile.icon}</span>
                  <span>{moodProfile.persona} active</span>
                </div>
                <button className="ge-btn" onClick={()=>setMoodProfile(null)} style={{background:"transparent",border:"none",color:MUTED,fontSize:14,padding:"2px 6px"}}>×</button>
              </div>
            )}

            {/* Chat area */}
            <div ref={chatRef} style={{
              flex:1,overflowY:"auto",padding:"16px 0",
              display:"flex",flexDirection:"column",gap:12,
            }}>

              {/* Empty state */}
              {messages.length===0 && (
                <div style={{margin:"auto",textAlign:"center",padding:"40px 16px"}}>
                  <div style={{
                    width:80,height:80,borderRadius:"50%",margin:"0 auto 20px",
                    background:`radial-gradient(circle,${GOLD}18,transparent 70%)`,
                    border:`1px solid ${GOLD}22`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    animation:"ge-float 3.5s ease-in-out infinite",
                    fontSize:34,
                  }}>✦</div>

                  <div style={{fontFamily:HEAD,fontSize:26,color:TEXT,marginBottom:6,letterSpacing:".06em",lineHeight:1}}>
                    MANIFIX AI
                  </div>
                  <div style={{fontSize:8,color:MUTED,letterSpacing:".18em",textTransform:"uppercase",marginBottom:4}}>
                    by Yesh Rajana
                  </div>
                  <div style={{fontSize:9,color:SUB,lineHeight:2,letterSpacing:".06em",marginBottom:20}}>
                    Your personal wellness intelligence.<br/>
                    Ask me anything about your health data,<br/>
                    mental state, habits, or performance.
                  </div>

                  {/* Quick access chips */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:16}}>
                    {["What's my score today?","How's my chronic disease?","Did I take my meds?","Analyze my week"].map((q,i)=>(
                      <button key={i} className="ge-btn ge-chip" onClick={()=>sendMessage(q)} style={{
                        padding:"6px 12px",fontSize:7,letterSpacing:".1em",textTransform:"uppercase",
                        background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                      }}>{q}</button>
                    ))}
                  </div>

                  {/* Identity badge */}
                  <div style={{
                    display:"inline-flex",alignItems:"center",gap:8,
                    background:`${GOLD}0a`,border:`1px solid ${GOLD}22`,
                    padding:"8px 16px",fontSize:7,color:DIM,letterSpacing:".14em",
                  }}>
                    <span style={{color:GOLD}}>✦</span>
                    ManifiX AI · Not ChatGPT · Not any generic AI
                    <span style={{color:GOLD}}>✦</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg,i)=>(
                <div key={msg.id} className="ge-up" style={{
                  animationDelay:`${i*0.018}s`,
                  display:"flex",flexDirection:"column",
                  alignItems:msg.role==="user"?"flex-end":"flex-start",
                }}>
                  {/* Role label */}
                  <div style={{
                    fontSize:6,letterSpacing:".2em",textTransform:"uppercase",
                    color:msg.role==="user"?`${GOLD}55`:SUB,marginBottom:5,
                    display:"flex",alignItems:"center",gap:6,
                  }}>
                    {msg.role==="user"
                      ? "You"
                      : <><span style={{color:GOLD,fontSize:8}}>✦</span>{moodProfile?`${moodProfile.persona}`:"ManifiX AI"}</>
                    }
                  </div>

                  <div style={{
                    maxWidth:"90%",
                    background:msg.role==="user"?`${GOLD}0e`:CARD,
                    border:`1px solid ${msg.role==="user"?`${GOLD}28`:BOR}`,
                    padding:"13px 17px",position:"relative",
                    boxShadow:msg.role==="assistant"?"0 2px 24px rgba(0,0,0,.4)":"none",
                  }}>
                    {/* Top accent line for assistant */}
                    {msg.role==="assistant" && (
                      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${GOLD}44,transparent)`}}/>
                    )}

                    {/* Streaming dots */}
                    {msg.streaming && !msg.content && (
                      <div style={{display:"flex",gap:6,alignItems:"center",height:22}}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{
                            width:6,height:6,borderRadius:"50%",background:GOLD,
                            animation:`ge-dot .95s ${i*.18}s ease-in-out infinite`,
                          }}/>
                        ))}
                      </div>
                    )}

                    <SimpleMarkdown text={msg.content}/>

                    {/* Message actions */}
                    {msg.role==="assistant" && !msg.streaming && msg.content && (
                      <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:`1px solid ${BOR}`}}>
                        <button className="ge-btn" onClick={()=>navigator.clipboard?.writeText(msg.content.replace(/[*#_`]/g,""))} style={{
                          background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                          fontSize:7,padding:"3px 9px",letterSpacing:".1em",textTransform:"uppercase",
                        }}>📋 Copy</button>
                        {(msg.content.includes("Weekly Summary")||msg.content.includes("ManifiX")) && (
                          <button className="ge-btn" onClick={()=>{
                            const t = msg.content.replace(/[*#_`]/g,"").substring(0,600);
                            navigator.share ? navigator.share({title:"ManifiX Weekly Report",text:t}) : navigator.clipboard?.writeText(t);
                          }} style={{
                            background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                            fontSize:7,padding:"3px 9px",letterSpacing:".1em",textTransform:"uppercase",
                          }}>↗ Share</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick chips */}
            <div style={{
              flexShrink:0,display:"flex",gap:6,overflowX:"auto",
              padding:"8px 0",scrollbarWidth:"none",borderTop:`1px solid ${BOR}`,
            }}>
              {THERAPY_CHIPS.map((c,i)=>(
                <button key={i} className="ge-btn ge-chip" onClick={()=>sendMessage(c)} style={{
                  flexShrink:0,padding:"5px 12px",fontSize:7,letterSpacing:".1em",
                  background:"transparent",border:`1px solid ${BOR}`,
                  color:MUTED,fontFamily:FONT,textTransform:"uppercase",whiteSpace:"nowrap",
                }}>{c}</button>
              ))}
            </div>
          </>
        )}

        {/* ── INPUT ── */}
        {mode==="therapy" && (
          <div style={{
            flexShrink:0,borderTop:`1px solid ${BOR}`,
            padding:"10px 0 16px",display:"flex",flexDirection:"column",gap:8,
          }}>
            <div className="ge-input-glow" style={{
              display:"flex",gap:8,alignItems:"flex-end",
              background:CARD,border:`1px solid ${BOR}`,padding:"8px 10px",
            }}>
              <textarea
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),handleSend())}
                placeholder={moodProfile ? `${moodProfile.persona} is listening...` : "Ask ManifiX anything about your health..."}
                rows={2}
                style={{
                  flex:1,background:"transparent",border:"none",
                  color:TEXT,fontFamily:FONT,fontSize:11,letterSpacing:".04em",
                  lineHeight:1.8,
                }}
              />
              <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                <button className="ge-btn" onClick={()=>setVoiceOn(v=>!v)} style={{
                  width:34,height:28,background:voiceOn?`${GOLD}18`:"transparent",
                  border:`1px solid ${voiceOn?GOLD:BOR}`,color:voiceOn?GOLD:MUTED,fontSize:13,
                }}>
                  {voiceOn?"🔊":"🔇"}
                </button>
                <button className="ge-btn" onClick={handleSend} disabled={generating||!input.trim()} style={{
                  width:34,height:38,
                  background:generating||!input.trim()?"transparent":GOLD,
                  color:generating||!input.trim()?MUTED:BG,
                  border:generating||!input.trim()?`1px solid ${BOR}`:`1px solid ${GOLD}`,
                  fontFamily:FONT,fontSize:15,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {generating
                    ? <div style={{width:8,height:8,background:GOLD,animation:"ge-blink .55s infinite"}}/>
                    : "▲"
                  }
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div style={{display:"flex",gap:6,justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:5}}>
                <button className="ge-btn ge-chip" onClick={sendReport} disabled={generating} style={{
                  padding:"5px 12px",fontSize:7,letterSpacing:".12em",
                  background:`${GOLD}10`,border:`1px solid ${GOLD}28`,
                  color:DIM,fontFamily:FONT,textTransform:"uppercase",
                }}>📊 Weekly Report</button>
                <button className="ge-btn ge-chip" onClick={()=>setMode("adaptive")} style={{
                  padding:"5px 12px",fontSize:7,letterSpacing:".12em",
                  background:"transparent",border:`1px solid ${BOR}`,
                  color:MUTED,fontFamily:FONT,textTransform:"uppercase",
                }}>🎭 Mood</button>
              </div>
              {messages.length>0 && (
                <button className="ge-btn" onClick={clearChat} style={{
                  background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                  fontSize:7,letterSpacing:".12em",padding:"5px 10px",textTransform:"uppercase",
                }}>↺ Clear</button>
              )}
            </div>

            {/* Footer attribution */}
            <div style={{textAlign:"center",fontSize:6,color:MUTED,letterSpacing:".16em",textTransform:"uppercase",marginTop:2}}>
              ManifiX AI · <span style={{color:`${GOLD}55`}}>Yesh Rajana</span> · Andhra Pradesh · India
            </div>
          </div>
        )}

        {/* Back button for habit/mood modes */}
        {(mode==="habits"||mode==="adaptive") && (
          <div style={{flexShrink:0,borderTop:`1px solid ${BOR}`,padding:"10px 0"}}>
            <button className="ge-btn" onClick={()=>setMode("therapy")} style={{
              width:"100%",padding:"10px 0",background:"transparent",border:`1px solid ${BOR}`,
              color:MUTED,fontFamily:FONT,fontSize:8,letterSpacing:".16em",textTransform:"uppercase",
            }}>← Back to ManifiX AI</button>
          </div>
        )}
      </div>
    </div>
  );
}
