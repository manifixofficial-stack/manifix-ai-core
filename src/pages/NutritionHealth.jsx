/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Nutrition Health Module v7.0                   ║
 * ║                                                                          ║
 * ║  UPGRADES FROM v6.0:                                                    ║
 * ║  • AI Photo Food Recognition (Cal AI style — camera/upload → Claude)   ║
 * ║  • CBT-Based Eating Psychology (Noom-style daily lessons)               ║
 * ║  • Green/Yellow/Red food traffic-light color system                     ║
 * ║  • Ultra-Enhanced Macro Logger (beats MyFitnessPal)                    ║
 * ║  • Net calories with BMR-based adaptive goals                           ║
 * ║  • Meal timing intelligence & eating window tracker                     ║
 * ║  • Nutrient gap AI analysis & smart food swaps                         ║
 * ║  • Full 20-language support maintained                                  ║
 * ║  • Redesigned dark-green premium aesthetic                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ════════════════════════════════════════════════════════════
   THEME v7
════════════════════════════════════════════════════════════ */
const T = {
  accent: "#22c55e",
  accentDim: "#15803d",
  accentGlow: "rgba(34,197,94,0.1)",
  blue: "#38bdf8",
  yellow: "#fbbf24",
  red: "#f87171",
  purple: "#c084fc",
  orange: "#fb923c",
  teal: "#2dd4bf",
  green: "#4ade80",
  bg: "#020906",
  card: "#060f08",
  cardMid: "#091410",
  border: "#0d2010",
  borderMid: "#122618",
  textPrimary: "#ecfdf5",
  textMid: "#6ee7b7",
  textDim: "#1e4d35",
  voiceRate: 0.85,
  voicePitch: 0.96,
};

/* ════════════════════════════════════════════════════════════
   TRAFFIC LIGHT FOOD SYSTEM (Noom-style)
════════════════════════════════════════════════════════════ */
const FOOD_LIGHT = {
  rice: "yellow", roti: "yellow", bread: "yellow", oats: "green",
  chicken: "green", dal: "green", egg: "green", fish: "green",
  tofu: "green", spinach: "green", tomato: "green", carrot: "green",
  potato: "yellow", banana: "green", apple: "green", mango: "green",
  orange: "green", milk: "yellow", curd: "green", cheese: "red",
  nuts: "yellow", butter: "red", "fried-food": "red", "soda": "red",
  "cake": "red", "chips": "red", "cookie": "red",
};

const LIGHT_CONFIG = {
  green: { label: "Go", color: "#22c55e", bg: "rgba(34,197,94,0.12)", desc: "Eat freely — nutrient-dense, low calorie density" },
  yellow: { label: "Slow", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", desc: "Eat mindfully — moderate calorie density" },
  red: { label: "Careful", color: "#f87171", bg: "rgba(248,113,113,0.12)", desc: "Limit — high calorie density, low nutrients" },
};

/* ════════════════════════════════════════════════════════════
   CBT PSYCHOLOGY LESSONS (Noom-style)
════════════════════════════════════════════════════════════ */
const CBT_LESSONS = [
  {
    id: 1, day: 1, title: "The Why Behind Your Plate",
    content: "Before eating, pause 3 seconds and ask: Am I physically hungry, emotionally hungry, or just bored? This tiny habit rewires your relationship with food.",
    exercise: "For your next meal, rate your hunger 1-10 before and after eating. Notice the difference.",
    category: "mindfulness", icon: "🧠", duration: "3 min",
  },
  {
    id: 2, day: 2, title: "Cognitive Restructuring for Cravings",
    content: "Cravings last 15-20 minutes. When one hits, your brain's 'reward prediction' fires — but you can interrupt it. Acknowledge the craving, name it, then delay action by 10 minutes.",
    exercise: "Next craving: write it down + time. Wait 10 mins. Did it pass or intensify?",
    category: "cbt", icon: "💭", duration: "4 min",
  },
  {
    id: 3, day: 3, title: "The Slim by Design Principle",
    content: "You eat 92% of what you serve yourself. Use smaller plates, pre-portion snacks, and put fruit in visible spots. Environment design beats willpower every time.",
    exercise: "Rearrange one area of your kitchen to make healthy food more visible and accessible.",
    category: "environment", icon: "🏠", duration: "5 min",
  },
  {
    id: 4, day: 4, title: "Emotional Eating Triggers",
    content: "Stress, boredom, sadness, and celebration are the 4 main emotional eating triggers. None of them require food — they require acknowledgment. Create a 'trigger map' for yourself.",
    exercise: "List your personal top 3 emotional eating triggers and one non-food alternative for each.",
    category: "cbt", icon: "❤️", duration: "6 min",
  },
  {
    id: 5, day: 5, title: "Mindful Eating Protocol",
    content: "Your brain needs 20 minutes to register fullness. Eating slowly isn't just politeness — it's a metabolic strategy. Put your fork down between bites. Chew 20 times.",
    exercise: "Set a timer for 20 minutes for your next main meal. Finish within the window, not before.",
    category: "mindfulness", icon: "🍽️", duration: "3 min",
  },
  {
    id: 6, day: 6, title: "All-or-Nothing Thinking",
    content: "\"I had one cookie, I ruined my day\" is cognitive distortion. One bad meal = 1/21 weekly meals. Progress beats perfection. The 80/20 rule works: 80% healthy, 20% flexible.",
    exercise: "Practice self-compassionate self-talk after your next imperfect food choice.",
    category: "cbt", icon: "⚖️", duration: "4 min",
  },
  {
    id: 7, day: 7, title: "Food as Fuel vs. Food as Reward",
    content: "Using food as the primary reward creates a problematic loop. Build a reward menu with non-food items: music, walks, calls with friends, baths, reading.",
    exercise: "Create your personal 10-item non-food reward list for when you hit nutrition goals.",
    category: "habit", icon: "🎯", duration: "5 min",
  },
];

/* ════════════════════════════════════════════════════════════
   FOOD DATABASE (enhanced with light color + satiety score)
════════════════════════════════════════════════════════════ */
const FOOD_DB = {
  rice:    { name:"Rice (cooked)",          calories:130, protein:2.7,  carbs:28,   fat:0.3,  fiber:0.4, icon:"🍚", iron:0.2, calcium:10,  vitC:0,  vitD:0,   light:"yellow", satiety:55, glycemic:"medium" },
  roti:    { name:"Roti/Chapati",           calories:104, protein:3.3,  carbs:18,   fat:2.1,  fiber:2.5, icon:"🫓", iron:1.5, calcium:20,  vitC:0,  vitD:0,   light:"yellow", satiety:68, glycemic:"low"    },
  bread:   { name:"Whole Wheat Bread",      calories:81,  protein:4,    carbs:14,   fat:1.1,  fiber:2,   icon:"🍞", iron:1.2, calcium:30,  vitC:0,  vitD:0,   light:"yellow", satiety:62, glycemic:"medium" },
  oats:    { name:"Oats (cooked)",          calories:71,  protein:2.5,  carbs:12,   fat:1.4,  fiber:2,   icon:"🥣", iron:1.7, calcium:54,  vitC:0,  vitD:0,   light:"green",  satiety:83, glycemic:"low"    },
  chicken: { name:"Chicken Breast (grilled)",calories:165,protein:31,   carbs:0,    fat:3.6,  fiber:0,   icon:"🍗", iron:1.0, calcium:15,  vitC:0,  vitD:0.3, light:"green",  satiety:90, glycemic:"none"   },
  dal:     { name:"Dal / Lentils",          calories:116, protein:9,    carbs:20,   fat:0.4,  fiber:8,   icon:"🥘", iron:3.3, calcium:40,  vitC:1.5,vitD:0,   light:"green",  satiety:85, glycemic:"low"    },
  egg:     { name:"Egg (boiled)",           calories:78,  protein:6.3,  carbs:0.6,  fat:5.3,  fiber:0,   icon:"🥚", iron:1.2, calcium:28,  vitC:0,  vitD:1.1, light:"green",  satiety:88, glycemic:"none"   },
  fish:    { name:"Fish (grilled)",         calories:206, protein:22,   carbs:0,    fat:12,   fiber:0,   icon:"🐟", iron:0.8, calcium:30,  vitC:0,  vitD:5.6, light:"green",  satiety:87, glycemic:"none"   },
  tofu:    { name:"Tofu",                   calories:76,  protein:8,    carbs:1.9,  fat:4.8,  fiber:0.3, icon:"🫘", iron:1.6, calcium:200, vitC:0,  vitD:0,   light:"green",  satiety:75, glycemic:"low"    },
  spinach: { name:"Spinach (cooked)",       calories:23,  protein:3,    carbs:3.6,  fat:0.3,  fiber:2.4, icon:"🥬", iron:3.6, calcium:245, vitC:18, vitD:0,   light:"green",  satiety:72, glycemic:"low"    },
  tomato:  { name:"Tomato",                 calories:18,  protein:0.9,  carbs:3.9,  fat:0.2,  fiber:1.2, icon:"🍅", iron:0.3, calcium:10,  vitC:14, vitD:0,   light:"green",  satiety:65, glycemic:"low"    },
  carrot:  { name:"Carrot",                 calories:41,  protein:0.9,  carbs:10,   fat:0.2,  fiber:2.8, icon:"🥕", iron:0.3, calcium:33,  vitC:6,  vitD:0,   light:"green",  satiety:70, glycemic:"low"    },
  potato:  { name:"Potato (boiled)",        calories:87,  protein:2.5,  carbs:20,   fat:0.1,  fiber:2.2, icon:"🥔", iron:0.6, calcium:8,   vitC:13, vitD:0,   light:"yellow", satiety:78, glycemic:"high"   },
  banana:  { name:"Banana",                 calories:89,  protein:1.1,  carbs:23,   fat:0.3,  fiber:2.6, icon:"🍌", iron:0.3, calcium:5,   vitC:9,  vitD:0,   light:"green",  satiety:74, glycemic:"medium" },
  apple:   { name:"Apple",                  calories:52,  protein:0.3,  carbs:14,   fat:0.2,  fiber:2.4, icon:"🍎", iron:0.1, calcium:6,   vitC:5,  vitD:0,   light:"green",  satiety:76, glycemic:"low"    },
  mango:   { name:"Mango",                  calories:60,  protein:0.8,  carbs:15,   fat:0.4,  fiber:1.6, icon:"🥭", iron:0.2, calcium:11,  vitC:36, vitD:0,   light:"green",  satiety:68, glycemic:"medium" },
  orange:  { name:"Orange",                 calories:47,  protein:0.9,  carbs:12,   fat:0.1,  fiber:2.4, icon:"🍊", iron:0.1, calcium:40,  vitC:53, vitD:0,   light:"green",  satiety:72, glycemic:"low"    },
  milk:    { name:"Milk (whole)",           calories:61,  protein:3.2,  carbs:4.8,  fat:3.3,  fiber:0,   icon:"🥛", iron:0.1, calcium:120, vitC:0,  vitD:1.2, light:"yellow", satiety:69, glycemic:"low"    },
  curd:    { name:"Curd / Yogurt",          calories:59,  protein:3.5,  carbs:4.7,  fat:3.3,  fiber:0,   icon:"🍶", iron:0.1, calcium:110, vitC:0,  vitD:0.1, light:"green",  satiety:73, glycemic:"low"    },
  cheese:  { name:"Cheese (cheddar)",       calories:113, protein:7,    carbs:0.4,  fat:9.3,  fiber:0,   icon:"🧀", iron:0.2, calcium:200, vitC:0,  vitD:0.2, light:"red",    satiety:70, glycemic:"none"   },
  nuts:    { name:"Mixed Nuts (30g)",       calories:185, protein:5,    carbs:6,    fat:16,   fiber:3,   icon:"🥜", iron:1.2, calcium:35,  vitC:0,  vitD:0,   light:"yellow", satiety:80, glycemic:"low"    },
};

const FOOD_KEYS = Object.keys(FOOD_DB);
const QUICK_ADD = ["oats","egg","dal","chicken","spinach","banana","apple","curd","fish","nuts"];

/* ════════════════════════════════════════════════════════════
   ACTIVITIES
════════════════════════════════════════════════════════════ */
const ACTIVITIES = [
  { id:"walk",    name:"Walking",    icon:"🚶", calPerMin:4  },
  { id:"run",     name:"Running",    icon:"🏃", calPerMin:10 },
  { id:"yoga",    name:"Yoga",       icon:"🧘", calPerMin:3  },
  { id:"cycle",   name:"Cycling",    icon:"🚴", calPerMin:7  },
  { id:"swim",    name:"Swimming",   icon:"🏊", calPerMin:8  },
  { id:"dance",   name:"Dancing",    icon:"💃", calPerMin:5  },
  { id:"climb",   name:"Stair Climb",icon:"🧗", calPerMin:9  },
  { id:"stretch", name:"Stretching", icon:"🤸", calPerMin:2  },
];

/* ════════════════════════════════════════════════════════════
   LANGUAGE SUPPORT
════════════════════════════════════════════════════════════ */
const LANG_MAP = {
  "en-IN":"en-IN","hi-IN":"hi-IN","te-IN":"te-IN","ta-IN":"ta-IN",
  "mr-IN":"mr-IN","bn-IN":"bn-IN","kn-IN":"kn-IN","gu-IN":"gu-IN",
  "ml-IN":"ml-IN","pa-IN":"pa-IN","or-IN":"or-IN","ur-IN":"ur-IN",
  "es-ES":"es-ES","ar-SA":"ar-SA","fr-FR":"fr-FR","pt-BR":"pt-BR",
  "de-DE":"de-DE","ja-JP":"ja-JP","ko-KR":"ko-KR","zh-CN":"zh-CN",
  "en":"en-IN","hi":"hi-IN","te":"te-IN","ta":"ta-IN",
};

const NUT_PHRASES = {
  "en-IN": {
    welcome:"Welcome to ManifiX Nutrition v7. Smarter eating starts here.",
    log_food:"Food logged! Great choice.",
    water_remind:"Time for water! {glasses} of {goal} glasses today.",
    celebrate:"Goal reached! Outstanding nutrition today!",
    ai_thinking:"AI coach is thinking…",
    streak:"You're on a {days}-day streak!",
    burn:"Burned {cal} calories today.",
    photo_scan:"Analyzing your food photo…",
    cbt_done:"Psychology lesson complete! Great insight.",
  },
  "hi-IN": {
    welcome:"ManifiX Nutrition v7 में स्वागत। बेहतर खाना यहाँ से शुरू होता है।",
    log_food:"भोजन दर्ज किया गया!",
    water_remind:"पानी का समय! {glasses}/{goal} गिलास।",
    celebrate:"लक्ष्य पूरा! शानदार पोषण!",
    ai_thinking:"AI कोच सोच रहा है…",
    streak:"{days} दिन की स्ट्रीक!",
    burn:"{cal} कैलोरी जलाई।",
    photo_scan:"आपकी खाने की फोटो विश्लेषण हो रही है…",
    cbt_done:"मनोविज्ञान पाठ पूर्ण! बढ़िया अंतर्दृष्टि।",
  },
  "te-IN": {
    welcome:"ManifiX Nutrition v7కి స్వాగతం.",
    log_food:"ఆహారం నమోదు!",
    water_remind:"నీళ్ళు: {glasses}/{goal}",
    celebrate:"లక్ష్యం చేరుకుంది!",
    ai_thinking:"AI కోచ్ ఆలోচిస్తోంది…",
    streak:"{days} రోజుల స్ట్రీక్!",
    burn:"{cal} కేలరీలు.",
    photo_scan:"ఆహార ఫోటో విశ్లేషిస్తోంది…",
    cbt_done:"పాఠం పూర్తయింది!",
  },
};

function ph(lang, key, vars = {}) {
  const base = NUT_PHRASES[lang] || NUT_PHRASES["en-IN"];
  let text = base[key] || NUT_PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

/* ════════════════════════════════════════════════════════════
   DATA LAYER
════════════════════════════════════════════════════════════ */
function loadLang() {
  const c = (typeof localStorage !== "undefined" && localStorage.getItem("magic16_lang")) || "en-IN";
  return LANG_MAP[c] || "en-IN";
}

function loadData() {
  try {
    const s = localStorage.getItem("manifix_nutrition_v7");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    dailyGoal: { calories:2000, protein:50, carbs:250, fat:65, water:8 },
    logged: [], water: [], activities: [], mealPlan: null,
    groceryChecked: [], streakDays: 0, lastActiveDate: null,
    weeklyScores: [], cbtProgress: [], userProfile: { weight:70, height:170, age:30, gender:"other" },
    lastUpdated: Date.now(),
  };
}

function saveData(d) {
  try { localStorage.setItem("manifix_nutrition_v7", JSON.stringify({ ...d, lastUpdated: Date.now() })); } catch {}
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function calcTotals(logged, water) {
  const today = todayStr();
  const todayLogs = logged.filter(l => l.time.startsWith(today));
  const totals = { calories:0, protein:0, carbs:0, fat:0, fiber:0, iron:0, calcium:0, vitC:0, vitD:0, greenCount:0, yellowCount:0, redCount:0 };
  todayLogs.forEach(log => {
    const f = FOOD_DB[log.foodId]; if (!f) return;
    const p = log.portion || 1;
    totals.calories  += f.calories  * p;
    totals.protein   += f.protein   * p;
    totals.carbs     += f.carbs     * p;
    totals.fat       += f.fat       * p;
    totals.fiber     += f.fiber     * p;
    totals.iron      += (f.iron  || 0) * p;
    totals.calcium   += (f.calcium||0) * p;
    totals.vitC      += (f.vitC  || 0) * p;
    totals.vitD      += (f.vitD  || 0) * p;
    if (f.light === "green")  totals.greenCount++;
    if (f.light === "yellow") totals.yellowCount++;
    if (f.light === "red")    totals.redCount++;
  });
  const waterCount = water.filter(t => t.startsWith(today)).length;
  return { ...totals, water: waterCount };
}

function calcActivityBurn(activities) {
  const today = todayStr();
  return activities.filter(a => a.time.startsWith(today)).reduce((sum, a) => sum + (a.calories || 0), 0);
}

function calcScore(totals, goal, burn) {
  if (!goal) return 50;
  const net = totals.calories - burn;
  const calRatio = net / goal.calories;
  const s = [
    calRatio >= 0.8 && calRatio <= 1.2 ? 20 : Math.max(0, 20 - Math.abs(calRatio - 1) * 40),
    totals.protein >= goal.protein * 0.8 ? 20 : (totals.protein / goal.protein) * 20,
    totals.fiber >= 20 ? 20 : (totals.fiber / 20) * 20,
    Math.min(20, totals.water * 2.5),
    Math.min(20, totals.greenCount * 4),
  ];
  return Math.round(s.reduce((a, b) => a + b, 0));
}

function updateStreak(data) {
  const today = todayStr();
  if (data.lastActiveDate === today) return data;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = data.lastActiveDate === yesterday ? (data.streakDays || 0) + 1 : 1;
  return { ...data, streakDays: newStreak, lastActiveDate: today };
}

/* ════════════════════════════════════════════════════════════
   VOICE
════════════════════════════════════════════════════════════ */
function makeSpeaker(lang) {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = urgent ? 1.0 : T.voiceRate; u.pitch = T.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(x => x.lang === lang) || voices.find(x => x.lang.startsWith(lang.split("-")[0])) || voices.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([60, 30, 60]);
    if (speechSynthesis.getVoices().length) say(); else speechSynthesis.onvoiceschanged = say;
  };
}

/* ════════════════════════════════════════════════════════════
   CSS
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("nut-v7-css")) return;
  const el = document.createElement("style");
  el.id = "nut-v7-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
    @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
    @keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100px) rotate(720deg);opacity:0}}
    @keyframes streakBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    .fade-up{animation:fadeUp .35s cubic-bezier(.22,.68,0,1.2) both}
    .pop{animation:pop .3s ease both}
    .btn{transition:all .15s ease;cursor:pointer}
    .btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
    .btn:active{transform:scale(.97)}
    .ring:focus{outline:2px solid #22c55e;outline-offset:2px}
    .hide-scroll::-webkit-scrollbar{display:none}
    .hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
    .shimmer{background:linear-gradient(90deg,transparent 0%,rgba(34,197,94,.07) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 2s infinite}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

/* Score ring */
function ScoreRing({ score }) {
  const r = 38; const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const col = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      <circle cx="46" cy="46" r={r} fill="none" stroke="#0a2010" strokeWidth="7"/>
      <circle cx="46" cy="46" r={r} fill="none" stroke={col} strokeWidth="7"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform="rotate(-90 46 46)"
        style={{ transition:"stroke-dasharray .7s ease" }}/>
      <text x="46" y="49" textAnchor="middle" fill={col}
        style={{ fontSize:20, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>{score}</text>
      <text x="46" y="62" textAnchor="middle" fill="#1e4d35"
        style={{ fontSize:8, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:".1em" }}>SCORE</text>
    </svg>
  );
}

/* Macro bar */
function MacroBar({ label, current, goal, color, unit = "g" }) {
  const pct = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100));
  const over = pct >= 100;
  return (
    <div style={{ marginBottom:9 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim, marginBottom:3 }}>
        <span style={{ color:T.textMid }}>{label}</span>
        <span style={{ color:over ? T.accent : T.textDim }}>{Math.round(current)}/{goal}{unit}</span>
      </div>
      <div style={{ height:4, background:"#0a1a0a", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:over ? `linear-gradient(90deg,${color}99,${color})` : `linear-gradient(90deg,${color}55,${color}99)`, transition:"width .6s ease", borderRadius:2 }}/>
      </div>
    </div>
  );
}

/* Traffic light badge */
function TrafficLight({ food }) {
  const light = food?.light || "yellow";
  const cfg = LIGHT_CONFIG[light];
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:10, background:cfg.bg, color:cfg.color, letterSpacing:".08em", textTransform:"uppercase" }}>
      {light === "green" ? "●" : light === "yellow" ? "◐" : "○"} {cfg.label}
    </span>
  );
}

/* Micro nutrient */
function Micro({ label, current, goal, unit, icon }) {
  const pct = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100));
  const col = pct >= 80 ? T.accent : pct >= 50 ? T.yellow : T.red;
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:17, marginBottom:2 }}>{icon}</div>
      <div style={{ fontSize:9, color:T.textDim, marginBottom:1 }}>{label}</div>
      <div style={{ fontSize:11, fontWeight:700, color:col, fontFamily:"'Space Mono',monospace" }}>{Math.round(current)}/{goal}</div>
      <div style={{ fontSize:8, color:T.textDim }}>{unit}</div>
      <div style={{ height:2, background:"#0a1a0a", borderRadius:1, margin:"4px 0 0" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:1, transition:"width .5s" }}/>
      </div>
    </div>
  );
}

/* Water */
function WaterTracker({ count, goal, onAdd }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:12, color:T.textMid }}>💧 Hydration</span>
        <span style={{ fontSize:12, fontWeight:700, color:T.accent, fontFamily:"'Space Mono',monospace" }}>{count}/{goal}</span>
      </div>
      <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} onClick={() => i === count && onAdd()} style={{
            width:26, height:32, borderRadius:3, overflow:"hidden",
            background:i < count ? `${T.accent}18` : "#0a1a0a",
            border:`1.5px solid ${i < count ? T.accent : "#0d2010"}`,
            cursor:i === count ? "pointer" : "default", transition:"all .2s",
            display:"flex", flexDirection:"column", justifyContent:"flex-end",
          }}>
            {i < count && <div style={{ width:"100%", height:"80%", background:`linear-gradient(to top,${T.accentDim},${T.accent}66)` }}/>}
          </div>
        ))}
      </div>
      <button onClick={onAdd} disabled={count >= goal} className="btn ring" style={{
        width:"100%", padding:"9px", fontSize:12, fontWeight:600,
        background:count >= goal ? `${T.accent}15` : T.accent,
        border:`2px solid ${count >= goal ? T.accent : "#000"}`,
        color:count >= goal ? T.accent : "#020906", borderRadius:8, fontFamily:"inherit",
        opacity:count >= goal ? 0.7 : 1,
      }}>
        {count >= goal ? "✓ Hydration Goal Met!" : "+ Add Glass of Water"}
      </button>
    </div>
  );
}

/* Sparkline */
function SparkLine({ scores }) {
  if (!scores || scores.length < 2) return <div style={{ fontSize:11, color:T.textDim, textAlign:"center" }}>Track more days to see trend</div>;
  const max = Math.max(...scores, 1); const w = 200; const h = 36;
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${h - (s / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {scores.map((s, i) => (
        <circle key={i} cx={(i / (scores.length - 1)) * w} cy={h - (s / max) * h} r="3" fill={T.accent} stroke="#020906" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

/* Streak badge */
function StreakBadge({ days }) {
  if (!days) return null;
  return (
    <span className="btn" style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12,
      background:`${T.orange}15`, border:`1px solid ${T.orange}44`, fontSize:11, fontWeight:700, color:T.orange }}>
      🔥 {days}d streak
    </span>
  );
}

/* Confetti */
function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id:i, left:`${Math.random()*100}%`, color:[T.accent,T.yellow,T.blue,T.orange,T.purple][i%5],
    delay:`${Math.random()*.7}s`, dur:`${.9+Math.random()*.5}s`,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position:"absolute", left:p.left, top:"5%", width:8, height:8, borderRadius:2,
          background:p.color, animation:`confetti ${p.dur} ${p.delay} ease-in forwards` }}/>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI PHOTO FOOD RECOGNITION (Cal AI style)
════════════════════════════════════════════════════════════ */
function AIPhotoScanner({ lang, onFoodDetected, onClose }) {
  const [step, setStep] = useState("upload"); // upload | scanning | result
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setBase64(e.target.result.split(",")[1]);
      setStep("ready");
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!base64) return;
    setStep("scanning"); setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a precise nutrition AI. When given a food photo, identify the dish and estimate calories. 
          ALWAYS respond with valid JSON only, no markdown, no explanation outside JSON.
          Format: {"dish":"name","confidence":85,"calories":350,"protein":15,"carbs":40,"fat":12,"fiber":3,"light":"green|yellow|red","items":["item1","item2"],"tips":["tip1"]}
          Light color: green=healthy/low calorie, yellow=moderate, red=high calorie/processed.
          Be realistic with portions visible in image.`,
          messages:[{
            role:"user",
            content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:base64 } },
              { type:"text", text:"Identify this food and provide nutritional estimates as JSON." }
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch (e) {
      setResult({ dish:"Unknown Food", confidence:0, calories:200, protein:8, carbs:25, fat:7, fiber:2, light:"yellow", items:[], tips:["Unable to analyze — please try a clearer photo"] });
      setStep("result");
    }
    setLoading(false);
  };

  const cfg = result ? LIGHT_CONFIG[result.light || "yellow"] : LIGHT_CONFIG.yellow;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.teal}`,padding:20,width:"min(420px,100%)",borderRadius:16,maxHeight:"90vh",overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>📸 AI Food Scanner</div>
            <div style={{ fontSize:11,color:T.textDim }}>Cal AI-style photo recognition</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#444",cursor:"pointer" }}>✕</button>
        </div>

        {step === "upload" || step === "ready" ? (
          <>
            <div onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${T.teal}44`,borderRadius:12,padding:"30px 20px",textAlign:"center",cursor:"pointer",marginBottom:14,background:`${T.teal}06`,transition:"all .2s" }}>
              {preview ? (
                <img src={preview} alt="food" style={{ maxWidth:"100%",maxHeight:200,borderRadius:8,objectFit:"cover" }}/>
              ) : (
                <>
                  <div style={{ fontSize:36,marginBottom:8 }}>📷</div>
                  <div style={{ fontSize:13,color:T.textMid }}>Tap to upload food photo</div>
                  <div style={{ fontSize:11,color:T.textDim,marginTop:4 }}>JPG, PNG — camera or gallery</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}/>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={onClose} style={{ flex:1,padding:11,fontSize:12,background:"#111",border:"1.5px solid #222",color:T.textDim,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
              <button onClick={analyze} disabled={!base64} className="btn ring" style={{
                flex:2,padding:11,fontSize:13,fontWeight:700,
                background:base64?T.teal:"#111",border:`2px solid ${base64?T.teal:"#333"}`,
                color:base64?"#020906":T.textDim,borderRadius:10,cursor:base64?"pointer":"not-allowed",fontFamily:"inherit"
              }}>
                {base64 ? "🔍 Analyze Food" : "Upload Photo First"}
              </button>
            </div>
          </>
        ) : step === "scanning" ? (
          <div style={{ textAlign:"center",padding:"30px 0" }}>
            <div style={{ fontSize:48,marginBottom:16 }}>🔬</div>
            <div style={{ position:"relative",width:200,height:150,margin:"0 auto 16px",borderRadius:8,overflow:"hidden",border:`1px solid ${T.teal}33` }}>
              {preview && <img src={preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>}
              <div style={{ position:"absolute",inset:0,background:`linear-gradient(to bottom,${T.teal}33,transparent,${T.teal}33)`,animation:"scan 1.5s linear infinite" }}/>
            </div>
            <div style={{ fontSize:13,color:T.teal,animation:"pulse 1s ease-in-out infinite" }}>{ph(lang,"photo_scan")}</div>
            <div style={{ fontSize:11,color:T.textDim,marginTop:6 }}>Identifying ingredients & nutrients…</div>
          </div>
        ) : (
          <div className="fade-up">
            {preview && <img src={preview} alt="food" style={{ width:"100%",maxHeight:180,objectFit:"cover",borderRadius:8,marginBottom:14 }}/>}
            <div style={{ border:`2px solid ${cfg.color}44`,background:cfg.bg,padding:"14px 16px",borderRadius:12,marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>{result?.dish}</div>
                  <div style={{ fontSize:11,color:T.textDim,marginTop:2 }}>AI confidence: {result?.confidence}%</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:20,fontWeight:700,color:cfg.color,fontFamily:"'Space Mono',monospace" }}>{result?.calories}</div>
                  <div style={{ fontSize:10,color:T.textDim }}>calories</div>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10 }}>
                {[["Protein",result?.protein,"g",T.blue],["Carbs",result?.carbs,"g",T.yellow],["Fat",result?.fat,"g",T.red]].map(([l,v,u,c]) => (
                  <div key={l} style={{ textAlign:"center",padding:"6px 4px",background:"rgba(0,0,0,.3)",borderRadius:6 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace" }}>{v}{u}</div>
                    <div style={{ fontSize:9,color:T.textDim }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                <span style={{ fontSize:12,color:cfg.color }}>●</span>
                <span style={{ fontSize:11,color:T.textMid }}>{cfg.label} food — {cfg.desc}</span>
              </div>
              {result?.items?.length > 0 && (
                <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:8 }}>
                  {result.items.map((item,i) => (
                    <span key={i} style={{ fontSize:10,padding:"2px 6px",background:`${T.accent}15`,color:T.accent,borderRadius:4 }}>{item}</span>
                  ))}
                </div>
              )}
              {result?.tips?.map((tip,i) => (
                <div key={i} style={{ fontSize:11,color:T.textMid,borderLeft:`2px solid ${T.teal}`,paddingLeft:8 }}>💡 {tip}</div>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={() => { setStep("upload"); setPreview(null); setBase64(null); setResult(null); }}
                style={{ flex:1,padding:11,fontSize:12,background:"#111",border:"1.5px solid #222",color:T.textDim,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>
                📷 Scan Again
              </button>
              <button onClick={() => { onFoodDetected(result); onClose(); }} className="btn ring" style={{
                flex:2,padding:11,fontSize:13,fontWeight:700,background:T.accent,border:`2px solid ${T.accent}`,
                color:"#020906",borderRadius:10,cursor:"pointer",fontFamily:"inherit"
              }}>
                + Log {result?.calories} cal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CBT PSYCHOLOGY MODULE (Noom-style)
════════════════════════════════════════════════════════════ */
function CBTModule({ cbtProgress, onComplete, onClose }) {
  const completedIds = cbtProgress || [];
  const nextLesson = CBT_LESSONS.find(l => !completedIds.includes(l.id)) || CBT_LESSONS[0];
  const [activeLesson, setActiveLesson] = useState(nextLesson);
  const [phase, setPhase] = useState("read"); // read | exercise | done
  const [exerciseInput, setExerciseInput] = useState("");

  const catColor = { mindfulness: T.teal, cbt: T.purple, environment: T.blue, habit: T.orange };
  const totalCompleted = completedIds.length;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.purple}`,padding:20,width:"min(440px,100%)",borderRadius:16,maxHeight:"92vh",overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>🧠 Psychology Coach</div>
            <div style={{ fontSize:11,color:T.textDim }}>CBT-based eating mindset training · {totalCompleted}/{CBT_LESSONS.length} complete</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#444",cursor:"pointer" }}>✕</button>
        </div>

        {/* Progress dots */}
        <div style={{ display:"flex",gap:5,marginBottom:16 }}>
          {CBT_LESSONS.map(l => (
            <button key={l.id} onClick={() => { setActiveLesson(l); setPhase("read"); setExerciseInput(""); }}
              style={{ flex:1,height:5,borderRadius:3,background:completedIds.includes(l.id)?T.purple:l.id===activeLesson.id?`${T.purple}55`:"#1a1a2e",border:"none",cursor:"pointer",transition:"all .2s" }}/>
          ))}
        </div>

        {/* Lesson card */}
        <div className="fade-up" style={{ border:`2px solid ${catColor[activeLesson.category]}33`,background:`${catColor[activeLesson.category]}08`,padding:"16px 18px",borderRadius:12,marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
            <div>
              <span style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em" }}>Day {activeLesson.day} · {activeLesson.category}</span>
              <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary,marginTop:3 }}>{activeLesson.icon} {activeLesson.title}</div>
            </div>
            <span style={{ fontSize:10,color:T.textDim }}>{activeLesson.duration}</span>
          </div>

          {phase === "read" && (
            <>
              <p style={{ fontSize:13,color:"#cde8d5",lineHeight:1.7,marginBottom:14 }}>{activeLesson.content}</p>
              <button onClick={() => setPhase("exercise")} className="btn ring" style={{
                width:"100%",padding:"10px",fontSize:12,fontWeight:700,
                background:`${catColor[activeLesson.category]}22`,border:`2px solid ${catColor[activeLesson.category]}`,
                color:catColor[activeLesson.category],borderRadius:8,cursor:"pointer",fontFamily:"inherit"
              }}>
                ✏️ Try the Exercise
              </button>
            </>
          )}

          {phase === "exercise" && (
            <>
              <div style={{ fontSize:12,color:T.textMid,lineHeight:1.6,marginBottom:12,padding:"10px 12px",background:"rgba(0,0,0,.3)",borderRadius:8,borderLeft:`3px solid ${catColor[activeLesson.category]}` }}>
                📝 {activeLesson.exercise}
              </div>
              <textarea
                value={exerciseInput}
                onChange={e => setExerciseInput(e.target.value)}
                placeholder="Write your reflection here… (optional)"
                rows={3}
                style={{ width:"100%",padding:"10px 12px",fontSize:12,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textPrimary,borderRadius:8,marginBottom:12,fontFamily:"inherit",resize:"vertical" }}
              />
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => setPhase("read")} style={{ flex:1,padding:10,fontSize:12,background:"#111",border:"1.5px solid #222",color:T.textDim,borderRadius:8,cursor:"pointer",fontFamily:"inherit" }}>← Back</button>
                <button onClick={() => { onComplete(activeLesson.id); setPhase("done"); }} className="btn ring" style={{
                  flex:2,padding:10,fontSize:12,fontWeight:700,background:T.purple,border:`2px solid ${T.purple}`,
                  color:"#020906",borderRadius:8,cursor:"pointer",fontFamily:"inherit"
                }}>
                  ✓ Mark Complete
                </button>
              </div>
            </>
          )}

          {phase === "done" && (
            <div style={{ textAlign:"center",padding:"14px 0" }}>
              <div style={{ fontSize:36,marginBottom:8 }}>🎉</div>
              <div style={{ fontSize:14,fontWeight:700,color:T.accent,marginBottom:4 }}>Lesson Complete!</div>
              <div style={{ fontSize:12,color:T.textMid,marginBottom:14 }}>{completedIds.length + 1}/{CBT_LESSONS.length} lessons done</div>
              <button onClick={onClose} className="btn ring" style={{
                padding:"10px 24px",fontSize:13,fontWeight:700,background:T.accent,border:`2px solid ${T.accent}`,
                color:"#020906",borderRadius:8,cursor:"pointer",fontFamily:"inherit"
              }}>Done</button>
            </div>
          )}
        </div>

        {/* All lessons list */}
        <div style={{ fontSize:11,color:T.textDim,marginBottom:8,textTransform:"uppercase",letterSpacing:".1em" }}>All Lessons</div>
        <div style={{ display:"grid",gap:6 }}>
          {CBT_LESSONS.map(l => {
            const done = completedIds.includes(l.id);
            const active = l.id === activeLesson.id;
            return (
              <button key={l.id} onClick={() => { setActiveLesson(l); setPhase("read"); setExerciseInput(""); }} className="btn ring" style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                background:active?`${T.purple}15`:done?`${T.accent}08`:"#060f08",
                border:`1.5px solid ${active?T.purple:done?T.accent:T.border}`,
                borderRadius:8,cursor:"pointer",fontFamily:"inherit",textAlign:"left"
              }}>
                <span style={{ fontSize:18 }}>{l.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:active?T.purple:done?T.accent:T.textPrimary }}>{l.title}</div>
                  <div style={{ fontSize:10,color:T.textDim }}>{l.duration} · Day {l.day}</div>
                </div>
                {done && <span style={{ fontSize:12,color:T.accent }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ENHANCED FOOD LOG MODAL (beats MyFitnessPal)
════════════════════════════════════════════════════════════ */
function FoodLogModal({ onClose, onLog }) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [portion, setPortion] = useState(1);
  const [meal, setMeal] = useState("lunch");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const filtered = useMemo(() => {
    if (!search) return FOOD_KEYS.map(k => ({ key:k, ...FOOD_DB[k] }));
    return FOOD_KEYS.filter(k =>
      FOOD_DB[k].name.toLowerCase().includes(search.toLowerCase()) || FOOD_DB[k].icon.includes(search)
    ).map(k => ({ key:k, ...FOOD_DB[k] }));
  }, [search]);

  const lightGroups = { green: [], yellow: [], red: [] };
  filtered.forEach(f => lightGroups[f.light]?.push(f));

  const lightOrder = search ? null : ["green","yellow","red"];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.accent}`,padding:18,width:"min(460px,100%)",borderRadius:16,maxHeight:"92vh",overflowY:"auto" }} className="hide-scroll">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:T.textPrimary }}>🍽️ Log Food</div>
            <div style={{ fontSize:11,color:T.textDim }}>Traffic-light system · Full nutrition data</div>
          </div>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#444",cursor:"pointer" }}>✕</button>
        </div>

        {/* Search + view toggle */}
        <div style={{ display:"flex",gap:8,marginBottom:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search: rice, 🥚, dal, chicken…"
            style={{ flex:1,padding:"9px 12px",fontSize:12,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textPrimary,borderRadius:8,fontFamily:"inherit" }}/>
          <button onClick={()=>setViewMode(v=>v==="grid"?"list":"grid")} style={{ padding:"9px 12px",fontSize:12,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textMid,borderRadius:8,cursor:"pointer",fontFamily:"inherit" }}>
            {viewMode==="grid"?"≡":"⊞"}
          </button>
        </div>

        {/* Traffic light filter legend */}
        <div style={{ display:"flex",gap:6,marginBottom:12 }}>
          {Object.entries(LIGHT_CONFIG).map(([k,v]) => (
            <div key={k} style={{ flex:1,textAlign:"center",padding:"5px 4px",borderRadius:6,background:v.bg,border:`1px solid ${v.color}33` }}>
              <div style={{ fontSize:10,fontWeight:700,color:v.color }}>{v.label}</div>
              <div style={{ fontSize:9,color:v.color,opacity:.7 }}>{lightGroups[k]?.length} foods</div>
            </div>
          ))}
        </div>

        {/* Food grid/list */}
        <div style={{ maxHeight:200,overflowY:"auto",marginBottom:12 }} className="hide-scroll">
          {search ? (
            viewMode === "grid" ? (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
                {filtered.slice(0,20).map(f => {
                  const lcfg = LIGHT_CONFIG[f.light];
                  return (
                    <button key={f.key} onClick={()=>setSel(f)} className="btn ring" style={{
                      padding:"8px 4px",borderRadius:8,textAlign:"center",
                      background:sel?.key===f.key?`${lcfg.color}22`:"#0a1a0a",
                      border:`2px solid ${sel?.key===f.key?lcfg.color:"#0d2010"}`,
                      color:sel?.key===f.key?lcfg.color:T.textMid,fontSize:10,cursor:"pointer",fontFamily:"inherit",
                    }}>
                      <div style={{ fontSize:20,marginBottom:2 }}>{f.icon}</div>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</div>
                      <div style={{ fontSize:9,color:lcfg.color,marginTop:1 }}>{f.calories}cal</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display:"grid",gap:4 }}>
                {filtered.slice(0,15).map(f => {
                  const lcfg = LIGHT_CONFIG[f.light];
                  return (
                    <button key={f.key} onClick={()=>setSel(f)} className="btn ring" style={{
                      display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,
                      background:sel?.key===f.key?`${lcfg.color}12`:"#0a1a0a",
                      border:`1.5px solid ${sel?.key===f.key?lcfg.color:"#0d2010"}`,
                      cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                    }}>
                      <span style={{ fontSize:20 }}>{f.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,color:T.textPrimary }}>{f.name}</div>
                        <div style={{ fontSize:10,color:T.textDim }}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12,fontWeight:700,color:lcfg.color }}>{f.calories}</div>
                        <div style={{ fontSize:9,color:T.textDim }}>cal</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            ["green","yellow","red"].map(light => {
              const lcfg = LIGHT_CONFIG[light];
              const foods = lightGroups[light] || [];
              return foods.length > 0 ? (
                <div key={light} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10,color:lcfg.color,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6,display:"flex",alignItems:"center",gap:6 }}>
                    <span>●</span><span>{lcfg.label} Foods — {lcfg.desc.split(" — ")[1]}</span>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
                    {foods.map(f => (
                      <button key={f.key} onClick={()=>setSel(f)} className="btn ring" style={{
                        padding:"8px 4px",borderRadius:8,textAlign:"center",
                        background:sel?.key===f.key?`${lcfg.color}22`:"#0a1a0a",
                        border:`2px solid ${sel?.key===f.key?lcfg.color:"#0d2010"}`,
                        color:sel?.key===f.key?lcfg.color:T.textMid,fontSize:10,cursor:"pointer",fontFamily:"inherit",
                      }}>
                        <div style={{ fontSize:20,marginBottom:2 }}>{f.icon}</div>
                        <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</div>
                        <div style={{ fontSize:9,color:lcfg.color,marginTop:1 }}>{f.calories}cal</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })
          )}
        </div>

        {/* Selected food details */}
        {sel && (
          <div className="fade-up" style={{ border:`1.5px solid ${LIGHT_CONFIG[sel.light].color}44`,background:`${LIGHT_CONFIG[sel.light].color}08`,padding:"12px 14px",borderRadius:10,marginBottom:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{sel.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.textPrimary }}>{sel.name}</div>
                <div style={{ display:"flex",gap:6,marginTop:3 }}>
                  <TrafficLight food={sel}/>
                  <span style={{ fontSize:10,color:T.textDim }}>Satiety: {sel.satiety}/100</span>
                  <span style={{ fontSize:10,color:T.textDim }}>GI: {sel.glycemic}</span>
                </div>
              </div>
            </div>
            {/* Macro grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10 }}>
              {[["Cal",Math.round(sel.calories*portion),"",T.accent],["P",Math.round(sel.protein*portion*10)/10,"g",T.blue],["C",Math.round(sel.carbs*portion*10)/10,"g",T.yellow],["F",Math.round(sel.fat*portion*10)/10,"g",T.red]].map(([l,v,u,c]) => (
                <div key={l} style={{ textAlign:"center",padding:"6px 4px",background:"rgba(0,0,0,.3)",borderRadius:6 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace" }}>{v}{u}</div>
                  <div style={{ fontSize:9,color:T.textDim }}>{l}</div>
                </div>
              ))}
            </div>
            {/* Micro brief */}
            <div style={{ display:"flex",gap:10,fontSize:10,color:T.textDim,marginBottom:10 }}>
              <span>🩸 Iron {Math.round(sel.iron*portion*10)/10}mg</span>
              <span>🦴 Ca {Math.round(sel.calcium*portion)}mg</span>
              <span>🍊 Vit C {Math.round(sel.vitC*portion)}mg</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <div>
                <label style={{ fontSize:10,color:T.textDim,display:"block",marginBottom:4 }}>Portion size</label>
                <select value={portion} onChange={e=>setPortion(parseFloat(e.target.value))}
                  style={{ width:"100%",padding:"7px",fontSize:12,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textPrimary,borderRadius:6,fontFamily:"inherit" }}>
                  {[0.25,0.5,0.75,1,1.5,2,3].map(p=><option key={p} value={p} style={{ background:"#040d06" }}>{p}× ({Math.round(sel.calories*p)} cal)</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,color:T.textDim,display:"block",marginBottom:4 }}>Meal</label>
                <select value={meal} onChange={e=>setMeal(e.target.value)}
                  style={{ width:"100%",padding:"7px",fontSize:12,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textPrimary,borderRadius:6,fontFamily:"inherit" }}>
                  {["breakfast","lunch","dinner","snack"].map(m=><option key={m} value={m} style={{ background:"#040d06" }}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onClose} style={{ flex:1,padding:11,fontSize:13,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textDim,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>{ if(sel){ onLog({ foodId:sel.key, meal, portion }); onClose(); }}} disabled={!sel} className="btn ring" style={{
            flex:2,padding:11,fontSize:13,fontWeight:700,background:sel?T.accent:"#1a1a1a",
            border:`2px solid ${sel?T.accent:"#333"}`,color:sel?"#020906":T.textDim,
            borderRadius:10,cursor:sel?"pointer":"not-allowed",fontFamily:"inherit",
          }}>
            {sel ? `+ Log ${sel.name.split(" ")[0]} (${Math.round(sel.calories*portion)} cal)` : "Select a food"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY MODAL
════════════════════════════════════════════════════════════ */
function ActivityModal({ onClose, onLog }) {
  const [sel, setSel] = useState(null);
  const [mins, setMins] = useState(30);
  const calc = sel ? Math.round(sel.calPerMin * mins) : 0;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20 }}>
      <div style={{ background:T.bg,border:`3px solid ${T.orange}`,padding:20,width:"min(400px,100%)",borderRadius:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:15,fontWeight:700,color:T.textPrimary }}>🏃 Log Activity</span>
          <button onClick={onClose} style={{ fontSize:20,background:"none",border:"none",color:"#444",cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14 }}>
          {ACTIVITIES.map(a => (
            <button key={a.id} onClick={()=>setSel(a)} className="btn ring" style={{
              padding:"10px 6px",borderRadius:8,textAlign:"center",
              background:sel?.id===a.id?`${T.orange}20`:"#0a1a0a",
              border:`2px solid ${sel?.id===a.id?T.orange:"#0d2010"}`,
              color:sel?.id===a.id?T.orange:T.textMid,fontSize:10,cursor:"pointer",fontFamily:"inherit",
            }}>
              <div style={{ fontSize:22,marginBottom:3 }}>{a.icon}</div>
              <div>{a.name}</div>
            </button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,color:T.textDim,display:"block",marginBottom:6 }}>Duration: <span style={{ color:T.orange,fontWeight:700 }}>{mins} min</span></label>
          <input type="range" min={5} max={120} step={5} value={mins} onChange={e=>setMins(+e.target.value)} style={{ width:"100%",accentColor:T.orange }}/>
        </div>
        {sel && <div style={{ textAlign:"center",fontSize:15,fontWeight:700,color:T.orange,marginBottom:14,fontFamily:"'Space Mono',monospace" }}>~{calc} calories burned</div>}
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:11,fontSize:13,background:"#0a1a0a",border:`1.5px solid ${T.border}`,color:T.textDim,borderRadius:10,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>{ if(sel){ onLog({ activityId:sel.id,name:sel.name,icon:sel.icon,minutes:mins,calories:calc }); onClose(); }}} disabled={!sel} className="btn ring" style={{
            flex:1,padding:11,fontSize:13,fontWeight:700,background:sel?T.orange:"#1a1a1a",
            border:`2px solid ${sel?T.orange:"#333"}`,color:sel?"#020906":T.textDim,borderRadius:10,cursor:sel?"pointer":"not-allowed",fontFamily:"inherit"
          }}>Log Activity</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI COACH PANEL
════════════════════════════════════════════════════════════ */
function AICoachPanel({ lang, totals, score, mealPlan }) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const ask = useCallback(async () => {
    setOpen(true); setLoading(true); setAdvice("");
    const langName = {
      "en-IN":"English","hi-IN":"Hindi","te-IN":"Telugu","ta-IN":"Tamil","mr-IN":"Marathi",
      "bn-IN":"Bengali","kn-IN":"Kannada","gu-IN":"Gujarati","ml-IN":"Malayalam","pa-IN":"Punjabi",
      "es-ES":"Spanish","fr-FR":"French","de-DE":"German","ja-JP":"Japanese","ko-KR":"Korean","zh-CN":"Mandarin",
    }[lang] || "English";
    const summary = `User nutrition today: ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${totals.water} glasses water, ${Math.round(totals.fiber)}g fiber, green foods: ${totals.greenCount}, yellow: ${totals.yellowCount}, red: ${totals.redCount}. Score: ${score}/100. Give 3 short personalized improvements in ${langName}. Each tip under 25 words. Format: 1. 2. 3.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:"You are a compassionate, expert nutrition coach. Be brief, warm, culturally sensitive, and practical.",
          messages:[{ role:"user", content:summary }],
        })
      });
      const data = await res.json();
      setAdvice(data.content?.map(b=>b.text||"").join("") || "Unable to get advice right now.");
    } catch { setAdvice("Unable to reach AI coach. Check your connection."); }
    setLoading(false);
  }, [lang, totals, score, mealPlan]);

  return (
    <div style={{ border:`2px solid ${T.purple}33`,background:`${T.purple}06`,padding:"14px 16px",borderRadius:12 }}>
      <button onClick={open?()=>setOpen(false):ask} className="btn" style={{
        width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit"
      }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:18 }}>🤖</span>
          <span style={{ fontSize:13,fontWeight:700,color:T.purple }}>AI Nutrition Coach</span>
        </div>
        <span style={{ fontSize:11,color:T.purple }}>{open?"▾ Close":"▸ Get Advice"}</span>
      </button>
      {open && (
        <div className="fade-up" style={{ marginTop:12 }}>
          {loading ? (
            <div style={{ display:"flex",alignItems:"center",gap:10,color:T.textDim,fontSize:13 }}>
              <div style={{ width:16,height:16,border:`2px solid ${T.border}`,borderTopColor:T.purple,borderRadius:"50%",animation:"spin 1s linear infinite" }}/>
              {ph(lang,"ai_thinking")}
            </div>
          ) : (
            <div style={{ fontSize:13,color:T.textPrimary,lineHeight:1.75,whiteSpace:"pre-wrap" }}>{advice}</div>
          )}
          {!loading && (
            <button onClick={ask} className="btn" style={{ marginTop:8,fontSize:11,color:T.purple,background:"none",border:`1px solid ${T.purple}33`,padding:"5px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit" }}>
              ↻ Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function NutritionHealth() {
  const lang = useMemo(loadLang, []);
  const speak = useMemo(() => makeSpeaker(lang), [lang]);

  const [data, setData]             = useState(() => loadData());
  const [showFood, setShowFood]     = useState(false);
  const [showActivity, setActivity] = useState(false);
  const [showPhoto, setShowPhoto]   = useState(false);
  const [showCBT, setShowCBT]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [offline, setOffline]       = useState(!navigator.onLine);
  const [confetti, setConfetti]     = useState(false);
  const [activeTab, setActiveTab]   = useState("today");
  const [celebMsg, setCelebMsg]     = useState("");

  const totals   = useMemo(() => calcTotals(data.logged, data.water), [data.logged, data.water]);
  const burnCal  = useMemo(() => calcActivityBurn(data.activities || []), [data.activities]);
  const score    = useMemo(() => calcScore(totals, data.dailyGoal, burnCal), [totals, data.dailyGoal, burnCal]);
  const netCal   = Math.round(totals.calories - burnCal);
  const scoreColor = score >= 80 ? T.accent : score >= 60 ? T.yellow : T.red;

  // Meal plan
  const mealPlan = useMemo(() => {
    const day = new Date().getDay();
    const meals = {
      breakfast: [
        { name:"Oats + Banana + Milk", foods:["oats","banana","milk"], calories:290 },
        { name:"Egg + Roti + Spinach", foods:["egg","roti","spinach"], calories:204 },
        { name:"Curd + Mango + Nuts",  foods:["curd","mango","nuts"],  calories:304 },
      ],
      lunch: [
        { name:"Dal + Rice + Chicken + Carrot", foods:["dal","rice","chicken","carrot"], calories:452 },
        { name:"Fish + Roti + Tomato + Spinach",foods:["fish","roti","tomato","spinach"],calories:351 },
        { name:"Tofu + Rice + Veggies",         foods:["tofu","rice","spinach","tomato"],calories:247 },
      ],
      dinner: [
        { name:"Dal + Roti + Curd",     foods:["dal","roti","curd"],    calories:279 },
        { name:"Grilled Fish + Veggies",foods:["fish","spinach","tomato","carrot"],calories:288 },
        { name:"Egg + Roti + Salad",    foods:["egg","roti","tomato"],  calories:195 },
      ],
      snack: [
        { name:"Apple + Nuts",   foods:["apple","nuts"],   calories:237 },
        { name:"Banana + Curd",  foods:["banana","curd"],  calories:148 },
        { name:"Orange + Egg",   foods:["orange","egg"],   calories:125 },
      ],
    };
    return Object.fromEntries(Object.entries(meals).map(([k,v]) => [k, v[day % v.length]]));
  }, []);

  // Boot
  useEffect(() => {
    injectCSS();
    const d = updateStreak(data);
    if (d.streakDays !== data.streakDays) setData(d);
    const t = setTimeout(() => { setLoading(false); speak(ph(lang,"welcome")); }, 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Offline
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Persist
  useEffect(() => { saveData(data); }, [data]);

  // Score 100 confetti
  useEffect(() => {
    if (score >= 100) { setConfetti(true); setCelebMsg("Perfect Score! 🎉"); setTimeout(() => { setConfetti(false); setCelebMsg(""); }, 2500); }
  }, [score]);

  // Actions
  const logFood = useCallback((entry) => {
    setData(p => ({ ...p, logged: [...p.logged, { id:Date.now(), time:new Date().toISOString(), ...entry }] }));
    speak(ph(lang,"log_food"));
  }, [lang, speak]);

  const logPhotoFood = useCallback((result) => {
    const entry = { id:Date.now(), time:new Date().toISOString(), foodId:"_photo", meal:"snack", portion:1, _photo: result };
    setData(p => ({ ...p, logged: [...p.logged, entry] }));
  }, []);

  const addWater = useCallback(() => {
    setData(p => ({ ...p, water: [...p.water, new Date().toISOString()] }));
    if (totals.water + 1 >= data.dailyGoal.water) {
      speak(ph(lang,"celebrate"), true);
      setConfetti(true); setTimeout(() => setConfetti(false), 2000);
    }
  }, [totals.water, data.dailyGoal.water, lang, speak]);

  const logActivity = useCallback((act) => {
    setData(p => ({ ...p, activities: [...(p.activities||[]), { id:Date.now(), time:new Date().toISOString(), ...act }] }));
    speak(ph(lang,"burn", { cal:act.calories }));
  }, [lang, speak]);

  const completeCBT = useCallback((id) => {
    setData(p => ({ ...p, cbtProgress: [...(p.cbtProgress||[]), id] }));
    speak(ph(lang,"cbt_done"));
  }, [lang, speak]);

  const toggleGrocery = useCallback((item) => {
    setData(p => ({ ...p, groceryChecked: p.groceryChecked.includes(item) ? p.groceryChecked.filter(i=>i!==item) : [...p.groceryChecked, item] }));
  }, []);

  const grocery = useMemo(() => {
    const items = new Set();
    Object.values(mealPlan).forEach(m => m?.foods?.forEach(id => { const f = FOOD_DB[id]; if (f) items.add(f.name); }));
    ["Rice","Roti","Eggs","Milk","Dal"].forEach(s => { if (![...items].some(i => i.includes(s))) items.add(s); });
    return [...items].sort();
  }, [mealPlan]);

  // Today's log
  const todayLog = useMemo(() => data.logged.filter(l => l.time.startsWith(todayStr())), [data.logged]);
  const cbtDone = (data.cbtProgress || []).length;

  if (loading) return (
    <div style={{ minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",color:T.textPrimary }}>
      <div style={{ fontSize:54,marginBottom:18 }}>🥗</div>
      <div style={{ fontSize:12,letterSpacing:".18em",color:T.accent,textTransform:"uppercase",marginBottom:14 }}>ManifiX Nutrition v7</div>
      <div style={{ width:28,height:28,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 1s linear infinite" }}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh",background:T.bg,color:T.textPrimary,fontFamily:"'Space Grotesk',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",position:"relative" }}>
      {/* BG */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(34,197,94,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.012) 1px,transparent 1px)`,backgroundSize:"40px 40px" }}/>
      <div style={{ position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:500,height:250,background:`radial-gradient(ellipse,${T.accentGlow} 0%,transparent 70%)`,pointerEvents:"none" }}/>

      <Confetti show={confetti}/>

      {/* Offline banner */}
      {offline && (
        <div style={{ position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:99,fontSize:10,letterSpacing:".12em",background:T.card,border:`2px solid ${T.accent}`,color:T.accent,padding:"5px 14px",textTransform:"uppercase",borderRadius:6 }}>
          ⚡ Offline — All features active
        </div>
      )}

      {/* Celeb message */}
      {celebMsg && (
        <div style={{ position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:150,fontSize:14,fontWeight:700,background:T.accent,color:"#020906",padding:"10px 20px",borderRadius:10 }}>
          {celebMsg}
        </div>
      )}

      <div style={{ position:"relative",zIndex:2,width:"min(480px,98vw)",display:"flex",flexDirection:"column",gap:12,padding:"18px 0 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1.5px solid ${T.border}` }}>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700,lineHeight:1.1,color:T.textPrimary }}>
              ManifiX <span style={{ color:T.accent }}>Nutrition</span>
            </div>
            <div style={{ fontSize:10,letterSpacing:".18em",color:T.accent,textTransform:"uppercase",marginTop:3,opacity:.6 }}>v7 · AI-Powered Health</div>
            <div style={{ marginTop:8, display:"flex",gap:6 }}>
              <StreakBadge days={data.streakDays}/>
              {cbtDone > 0 && (
                <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:12,background:`${T.purple}15`,border:`1px solid ${T.purple}44`,fontSize:11,fontWeight:700,color:T.purple }}>
                  🧠 {cbtDone} lessons
                </span>
              )}
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
            {burnCal > 0 && (
              <div style={{ fontSize:11,color:T.orange,background:`${T.orange}12`,border:`1px solid ${T.orange}33`,padding:"2px 8px",borderRadius:8,fontFamily:"'Space Mono',monospace" }}>
                🔥 -{burnCal} burned
              </div>
            )}
            <div style={{ fontSize:10,color:T.textDim }}>{lang}</div>
          </div>
        </div>

        {/* ── SCORE + MACROS ── */}
        <div className="fade-up" style={{ display:"flex",gap:12 }}>
          <div style={{ border:`2px solid ${scoreColor}33`,background:`${scoreColor}08`,padding:"12px 10px",borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:112 }}>
            <ScoreRing score={score}/>
            <div style={{ fontSize:10,fontWeight:700,color:scoreColor,marginTop:4 }}>
              {score>=80?"Excellent":score>=60?"Good":"Keep going"}
            </div>
            <div style={{ fontSize:9,color:T.textDim,marginTop:2 }}>{netCal}/{data.dailyGoal.calories} net kcal</div>
          </div>
          <div style={{ flex:1,border:`1.5px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:T.textPrimary,marginBottom:8 }}>📊 Macros Today</div>
            <MacroBar label="Protein" current={totals.protein} goal={data.dailyGoal.protein} color={T.blue}/>
            <MacroBar label="Carbs"   current={totals.carbs}   goal={data.dailyGoal.carbs}   color={T.yellow}/>
            <MacroBar label="Fat"     current={totals.fat}     goal={data.dailyGoal.fat}      color={T.red}/>
            <MacroBar label="Fiber"   current={totals.fiber}   goal={25}                      color={T.teal}/>
          </div>
        </div>

        {/* ── TRAFFIC LIGHT SUMMARY ── */}
        <div className="fade-up" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
          {Object.entries(LIGHT_CONFIG).map(([key, cfg]) => {
            const count = totals[`${key}Count`] || 0;
            return (
              <div key={key} style={{ textAlign:"center",padding:"10px 8px",borderRadius:10,background:cfg.bg,border:`1.5px solid ${cfg.color}33` }}>
                <div style={{ fontSize:18,fontWeight:700,color:cfg.color,fontFamily:"'Space Mono',monospace" }}>{count}</div>
                <div style={{ fontSize:10,fontWeight:700,color:cfg.color,marginBottom:2 }}>{cfg.label}</div>
                <div style={{ fontSize:9,color:cfg.color,opacity:.7 }}>{key} foods</div>
              </div>
            );
          })}
        </div>

        {/* ── MICRO NUTRIENTS ── */}
        <div className="fade-up" style={{ border:`1.5px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:T.textPrimary,marginBottom:10 }}>🔬 Micro-Nutrients</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
            <Micro label="Iron"     current={totals.iron}    goal={18}   unit="mg" icon="🩸"/>
            <Micro label="Calcium"  current={totals.calcium} goal={1000} unit="mg" icon="🦴"/>
            <Micro label="Vit C"    current={totals.vitC}    goal={65}   unit="mg" icon="🍊"/>
            <Micro label="Vit D"    current={totals.vitD}    goal={15}   unit="µg" icon="☀️"/>
          </div>
        </div>

        {/* ── WATER ── */}
        <div className="fade-up" style={{ border:`1.5px solid ${T.accent}22`,background:`${T.accent}05`,padding:"12px 14px",borderRadius:12 }}>
          <WaterTracker count={totals.water} goal={data.dailyGoal.water} onAdd={addWater}/>
        </div>

        {/* ── QUICK ADD ROW ── */}
        <div>
          <div style={{ fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:".12em",marginBottom:6 }}>⚡ Quick Add</div>
          <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4 }} className="hide-scroll">
            {QUICK_ADD.map(key => {
              const f = FOOD_DB[key];
              const lcfg = LIGHT_CONFIG[f.light];
              return (
                <button key={key} onClick={() => logFood({ foodId:key, meal:"snack", portion:1 })} className="btn ring"
                  style={{ flex:"0 0 auto",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 10px",borderRadius:10,background:T.card,border:`1.5px solid ${T.border}`,cursor:"pointer",fontFamily:"inherit" }}>
                  <span style={{ fontSize:20 }}>{f.icon}</span>
                  <span style={{ fontSize:9,color:T.textDim,whiteSpace:"nowrap" }}>{f.name.split(" ")[0]}</span>
                  <span style={{ fontSize:9,color:lcfg.color }}>{f.calories}cal</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PRIMARY ACTIONS ── */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8 }}>
          <button onClick={()=>setShowFood(true)} className="btn ring" style={{ gridColumn:"span 2",padding:"12px 8px",fontSize:12,fontWeight:700,background:T.accent,border:"2px solid #000",color:"#020906",borderRadius:10,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
            🍽️ Log Food
          </button>
          <button onClick={()=>setShowPhoto(true)} className="btn ring" style={{ padding:"12px 6px",fontSize:11,fontWeight:700,background:`${T.teal}20`,border:`2px solid ${T.teal}`,color:T.teal,borderRadius:10,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
            📸 Photo
          </button>
          <button onClick={()=>setActivity(true)} className="btn ring" style={{ padding:"12px 6px",fontSize:11,fontWeight:700,background:`${T.orange}15`,border:`2px solid ${T.orange}`,color:T.orange,borderRadius:10,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
            🏃 Burns
          </button>
        </div>

        {/* CBT button */}
        <button onClick={()=>setShowCBT(true)} className="btn ring" style={{
          width:"100%",padding:"11px",fontSize:12,fontWeight:700,
          background:`${T.purple}15`,border:`2px solid ${T.purple}44`,
          color:T.purple,borderRadius:10,fontFamily:"inherit",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"space-between"
        }}>
          <span>🧠 CBT Psychology Coach — Eating Mindset Training</span>
          <span style={{ fontSize:10,opacity:.7 }}>{cbtDone}/{CBT_LESSONS.length} done ▸</span>
        </button>

        {/* ── TABS ── */}
        <div style={{ display:"flex",gap:5 }}>
          {["today","plan","grocery","trends"].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(activeTab===tab?"_":tab)} className="btn ring"
              style={{ flex:1,padding:"7px 4px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",fontFamily:"inherit",borderRadius:8,
                background:activeTab===tab?`${T.accent}18`:"#060f08",border:`1.5px solid ${activeTab===tab?T.accent:T.border}`,
                color:activeTab===tab?T.accent:T.textDim,cursor:"pointer" }}>
              {tab==="today"?"📋 Log":tab==="plan"?"🍱 Plan":tab==="grocery"?"🛒 Shop":"📈 Trend"}
            </button>
          ))}
        </div>

        {/* ── TAB: TODAY LOG ── */}
        {activeTab==="today" && (
          <div className="fade-up">
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>
              Today's Food Log · {todayLog.length} entries
            </div>
            {todayLog.length === 0 ? (
              <div style={{ textAlign:"center",padding:"24px 0",color:T.textDim,fontSize:12,border:`1.5px dashed ${T.border}`,borderRadius:10 }}>
                No food logged yet today.<br/>
                <span style={{ fontSize:11,opacity:.6 }}>Use Log Food or Photo Scanner above</span>
              </div>
            ) : (
              <div style={{ display:"grid",gap:6 }}>
                {todayLog.map(log => {
                  if (log._photo) {
                    return (
                      <div key={log.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.card,border:`1px solid ${T.teal}33`,borderRadius:8 }}>
                        <span style={{ fontSize:20 }}>📸</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12,fontWeight:700,color:T.teal }}>{log._photo.dish}</div>
                          <div style={{ fontSize:10,color:T.textDim }}>{log.meal} · AI scanned</div>
                        </div>
                        <div style={{ fontSize:13,fontWeight:700,color:T.accent,fontFamily:"'Space Mono',monospace" }}>{log._photo.calories}</div>
                      </div>
                    );
                  }
                  const f = FOOD_DB[log.foodId]; if (!f) return null;
                  const lcfg = LIGHT_CONFIG[f.light];
                  return (
                    <div key={log.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.card,border:`1px solid ${lcfg.color}22`,borderRadius:8 }}>
                      <span style={{ fontSize:20 }}>{f.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:T.textPrimary }}>{f.name}</div>
                        <div style={{ display:"flex",gap:6,alignItems:"center",marginTop:2 }}>
                          <span style={{ fontSize:9,color:T.textDim }}>{log.meal}</span>
                          {log.portion !== 1 && <span style={{ fontSize:9,color:T.textDim }}>{log.portion}×</span>}
                          <TrafficLight food={f}/>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12,fontWeight:700,color:T.accent,fontFamily:"'Space Mono',monospace" }}>{Math.round(f.calories*(log.portion||1))}</div>
                        <div style={{ fontSize:9,color:T.textDim }}>cal</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: MEAL PLAN ── */}
        {activeTab==="plan" && (
          <div className="fade-up">
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>Smart Meal Plan — Today</div>
            {Object.entries(mealPlan).map(([type, plan]) => (
              <div key={type} style={{ border:`1.5px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:10,marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:T.textPrimary,textTransform:"capitalize" }}>{type}</span>
                  <span style={{ fontSize:11,color:T.accent,fontFamily:"'Space Mono',monospace" }}>{plan.calories} cal</span>
                </div>
                <div style={{ fontSize:12,color:"#cde8d5",marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:8 }}>
                  {plan.foods?.map((fid,i) => {
                    const f = FOOD_DB[fid]; if (!f) return null;
                    const lcfg = LIGHT_CONFIG[f.light];
                    return <span key={i} style={{ fontSize:9,padding:"2px 7px",borderRadius:4,background:lcfg.bg,color:lcfg.color }}>{f.icon} {f.name.split(" ")[0]}</span>;
                  })}
                </div>
                <button onClick={() => plan.foods?.forEach(fid => logFood({ foodId:fid, meal:type, portion:1 }))} className="btn ring" style={{
                  width:"100%",padding:"7px",fontSize:11,background:`${T.accent}10`,border:`1px solid ${T.accent}`,color:T.accent,borderRadius:6,cursor:"pointer",fontFamily:"inherit"
                }}>
                  ✓ Log This Meal
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: GROCERY ── */}
        {activeTab==="grocery" && (
          <div className="fade-up">
            <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>
              Smart Grocery · {grocery.length} items
            </div>
            <div style={{ display:"grid",gap:5 }}>
              {grocery.map(item => {
                const checked = data.groceryChecked.includes(item);
                return (
                  <label key={item} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:checked?`${T.blue}08`:T.card,border:`1px solid ${checked?T.blue:T.border}`,cursor:"pointer",transition:"all .18s" }}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleGrocery(item)} style={{ accentColor:T.blue,width:15,height:15 }}/>
                    <span style={{ fontSize:12,color:checked?T.textDim:T.textPrimary,textDecoration:checked?"line-through":"none" }}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: TRENDS ── */}
        {activeTab==="trends" && (
          <div className="fade-up">
            <div style={{ border:`1.5px solid ${T.border}`,background:T.card,padding:"14px 16px",borderRadius:12,marginBottom:10 }}>
              <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10 }}>7-Day Score Trend</div>
              <div style={{ display:"flex",justifyContent:"center",marginBottom:8 }}>
                <SparkLine scores={[...(data.weeklyScores||[]).slice(-6), score]}/>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:T.textDim }}>
                <span>7 days ago</span><span style={{ color:scoreColor,fontFamily:"'Space Mono',monospace" }}>Today: {score}</span>
              </div>
            </div>
            {/* Activity log */}
            {(data.activities||[]).filter(a=>a.time.startsWith(todayStr())).length > 0 && (
              <div style={{ border:`1.5px solid ${T.border}`,background:T.card,padding:"12px 14px",borderRadius:12,marginBottom:10 }}>
                <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8 }}>Today's Activities · {burnCal} cal burned</div>
                <div style={{ display:"grid",gap:6 }}>
                  {(data.activities||[]).filter(a=>a.time.startsWith(todayStr())).map(a => (
                    <div key={a.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#0a1a0a",border:`1px solid ${T.border}`,borderRadius:8 }}>
                      <span style={{ fontSize:20 }}>{a.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:T.textPrimary }}>{a.name}</div>
                        <div style={{ fontSize:10,color:T.textDim }}>{a.minutes} min</div>
                      </div>
                      <div style={{ fontSize:13,fontWeight:700,color:T.orange,fontFamily:"'Space Mono',monospace" }}>-{a.calories}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* CBT progress */}
            <div style={{ border:`1.5px solid ${T.purple}22`,background:`${T.purple}06`,padding:"12px 14px",borderRadius:12 }}>
              <div style={{ fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6 }}>Psychology Progress</div>
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                {CBT_LESSONS.map(l => {
                  const done = (data.cbtProgress||[]).includes(l.id);
                  return (
                    <div key={l.id} style={{ width:32,height:32,borderRadius:6,background:done?`${T.purple}22`:"#0a1a0a",border:`1.5px solid ${done?T.purple:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>
                      {done ? "✓" : l.icon}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:11,color:T.purple,marginTop:8 }}>{cbtDone}/{CBT_LESSONS.length} lessons complete</div>
            </div>
          </div>
        )}

        {/* ── AI COACH ── */}
        <AICoachPanel lang={lang} totals={totals} score={score} mealPlan={mealPlan}/>

        {/* ── FOOTER ── */}
        <div style={{ textAlign:"center",fontSize:9,letterSpacing:".12em",color:T.textDim,textTransform:"uppercase",paddingTop:6 }}>
          v7.0 · AI Photo · CBT Coach · Traffic Light · 20 Languages · {offline?"Offline":"Online"}
        </div>

      </div>

      {showFood    && <FoodLogModal  onClose={()=>setShowFood(false)}  onLog={logFood}/>}
      {showActivity && <ActivityModal onClose={()=>setActivity(false)}  onLog={logActivity}/>}
      {showPhoto   && <AIPhotoScanner lang={lang} onFoodDetected={logPhotoFood} onClose={()=>setShowPhoto(false)}/>}
      {showCBT     && <CBTModule cbtProgress={data.cbtProgress} onComplete={completeCBT} onClose={()=>setShowCBT(false)}/>}
    </div>
  );
}
