/**
 * ManifiX Chronic — v3.0 GOLD EDITION
 * BEATS: Teladoc (care team, med mgmt) + Noom (behavioral psychology, food logging)
 * NEW: Food Journal + Noom Psychology, Medication Tracker, Behavioral Insights,
 *       Progress Milestones, Luxury Gold/Black UI, CGM-style glucose, WHO PEN engine
 */

import { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";

/* ══════════════════════════════════════════
   GOLD/BLACK DESIGN SYSTEM
══════════════════════════════════════════ */
const G = {
  gold:    "#C9A84C",
  goldL:   "#F5E9C8",
  goldD:   "#8A6B1E",
  goldM:   "#E8C96A",
  black:   "#0A0A0A",
  blackL:  "#141414",
  blackM:  "#1E1E1E",
  blackS:  "#2A2A2A",
  white:   "#F5F0E8",
  whiteD:  "#BFB8A8",
  red:     "#C94A2C",
  redL:    "#FAE8E4",
  grn:     "#3A7D44",
  grnL:    "#E3F0E6",
  amb:     "#C9881F",
  ambL:    "#FAF0DC",
  blu:     "#1A5FA8",
  bluL:    "#E4EEF9",
};

/* ══════════════════════════════════════════
   STORAGE (in-memory only for artifact)
══════════════════════════════════════════ */
const STORE = {};
function ls(k, fb) { try { return STORE[k] !== undefined ? STORE[k] : fb; } catch { return fb; } }
function lss(k, v) { try { STORE[k] = v; } catch {} }
const TK = () => new Date().toISOString().split("T")[0];

/* ══════════════════════════════════════════
   WHO RISK ENGINE
══════════════════════════════════════════ */
function calcRisk(p) {
  let s = 0;
  if (p.age >= 55) s += 20; else if (p.age >= 45) s += 13; else if (p.age >= 35) s += 7;
  if (p.bmi >= 35) s += 22; else if (p.bmi >= 30) s += 15; else if (p.bmi >= 25) s += 8;
  if (p.family)  s += 12;
  if (p.smokes)  s += 18;
  s += Math.max(0, 15 - p.activity * 1.5);
  s += Math.max(0, 14 - p.diet * 1.4);
  if (p.bp === "high") s += 24; else if (p.bp === "elevated") s += 12;
  if (p.sugar === "diabetic") s += 26; else if (p.sugar === "prediabetic") s += 15;
  if (p.waist === "high") s += 10;
  return Math.min(100, Math.round(s));
}
function riskTier(score) {
  if (score < 28) return { label: "Low Risk", color: G.grn, bg: G.grnL, icon: "✓", key: "low" };
  if (score < 55) return { label: "Moderate Risk", color: G.amb, bg: G.ambL, icon: "!", key: "mod" };
  return { label: "Elevated Risk", color: G.red, bg: G.redL, icon: "⚠", key: "high" };
}

/* ══════════════════════════════════════════
   NOOM-STYLE FOOD PSYCHOLOGY FRAMEWORK
══════════════════════════════════════════ */
const FOOD_COLORS = {
  green:  { label: "Green", desc: "High nutrient, low calorie density", color: G.grn, examples: "Veggies, fruits, whole grains, legumes", pts: 20 },
  yellow: { label: "Yellow", desc: "Nutrient-dense, moderate calories", color: G.amb, examples: "Lean proteins, eggs, dairy, avocado", pts: 10 },
  red:    { label: "Red", desc: "High calorie density, limit portions", color: G.red, examples: "Fried foods, sweets, oils, processed", pts: 0 },
};

const PSYCH_TIPS = [
  { title: "Hunger Scale Check-in", desc: "Before eating, rate your hunger 1-10. Eat at 3-4, stop at 6-7. This breaks emotional eating cycles.", science: "Mindful eating reduces calorie intake 20% — Harvard T.H. Chan 2022" },
  { title: "Cognitive Reframe", desc: "Instead of 'I can't eat that', try 'I choose not to right now.' Language shapes behavior.", science: "Autonomous motivation → 60% better adherence — Self-Determination Theory" },
  { title: "Environment Design", desc: "Move green foods to eye level in your fridge. You eat what you see first. No willpower needed.", science: "Food visibility shapes 72% of food choices — Cornell Food Lab" },
  { title: "The 20-Minute Rule", desc: "Your brain takes 20 minutes to register fullness. Eat slowly, pause mid-meal for 2 minutes.", science: "Slow eating → 88 fewer calories per meal average — Obesity journal" },
];

/* ══════════════════════════════════════════
   HABITS
══════════════════════════════════════════ */
const HABITS = [
  { id:"h_water",   icon:"💧", label:"Drink 8 glasses of water",    pts:10, who:"WHO hydration baseline" },
  { id:"h_steps",   icon:"🚶", label:"7,000+ steps today",           pts:20, who:"WHO 150min/wk activity" },
  { id:"h_veggies", icon:"🥦", label:"5 vegetable servings",         pts:15, who:"WHO 400g/day guideline" },
  { id:"h_sodium",  icon:"🧂", label:"Limit salt < 5g",              pts:12, who:"WHO sodium target" },
  { id:"h_sleep",   icon:"😴", label:"7-8 hours of sleep",           pts:18, who:"Sleep regulates insulin & BP" },
  { id:"h_meds",    icon:"💊", label:"Take prescribed medications",  pts:25, who:"Adherence → complications ↓40%" },
  { id:"h_mindful", icon:"🧘", label:"10-min mindfulness/breathing", pts:12, who:"Stress → cortisol → glucose ↑" },
  { id:"h_screen",  icon:"📵", label:"No food after 8 PM",          pts:10, who:"Metabolic rest window" },
];

/* ══════════════════════════════════════════
   MEDICATIONS DB (Teladoc-style)
══════════════════════════════════════════ */
const MED_CATEGORIES = ["Diabetes", "Hypertension", "Cholesterol", "Heart", "Other"];
const COMMON_MEDS = {
  Diabetes: ["Metformin","Glipizide","Januvia","Ozempic","Jardiance","Farxiga","Trulicity"],
  Hypertension: ["Lisinopril","Amlodipine","Losartan","Metoprolol","Atenolol","Hydrochlorothiazide"],
  Cholesterol: ["Atorvastatin","Rosuvastatin","Simvastatin","Pravastatin","Ezetimibe"],
  Heart: ["Aspirin","Warfarin","Clopidogrel","Digoxin","Furosemide"],
  Other: ["Custom medication"],
};

/* ══════════════════════════════════════════
   PREVENTION PLAN
══════════════════════════════════════════ */
const PLAN_POOL = [
  { id:"weight",   title:"Gentle Weight Management", action:"Add 10-min walk after every meal. Small steps compound over time.", impact:"5% weight loss → Diabetes risk ↓58% (DPP Trial)", icon:"⚖️", condition: p => p.bmi >= 25 },
  { id:"activity", title:"Daily Movement Foundation", action:"3×10-min activity bursts. No gym needed — stairs, walks, stretches.", impact:"150min/wk → CVD mortality ↓35% (Lancet 2019)", icon:"🏃", condition: p => p.activity < 5 },
  { id:"nutrition",title:"Plate Balance Upgrade",    action:"Fill ½ plate with vegetables at lunch. No calorie counting needed.", impact:"Mediterranean diet → CVD risk ↓30% (PREDIMED)", icon:"🥗", condition: p => p.diet < 6 },
  { id:"sodium",   title:"Salt Awareness",           action:"Check labels: aim <200mg sodium per serving. Cook more at home.", impact:"Salt ↓ by 5g → BP ↓ 5-10 mmHg average", icon:"🧂", condition: p => p.bp !== "normal" },
  { id:"mindful",  title:"Stress Resilience",        action:"4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Do 3 cycles now.", impact:"Stress management → cortisol ↓ → glucose ↓", icon:"🧘", condition: () => true },
  { id:"sleep",    title:"Sleep Hygiene Protocol",   action:"Same bedtime ±30 min. Phone off 45 min before. Dark and cool room.", impact:"7+ hrs sleep → Insulin sensitivity ↑, obesity risk ↓21%", icon:"😴", condition: p => p.activity > 0 },
];

/* ══════════════════════════════════════════
   MILESTONES (Teladoc-style Care Goals)
══════════════════════════════════════════ */
const MILESTONES = [
  { id:"m1", icon:"🥇", title:"First Step",    desc:"Complete your first habit",  xpReq:0,   habitReq:1  },
  { id:"m2", icon:"🔥", title:"3-Day Streak",  desc:"Maintain a 3-day streak",    xpReq:50,  streakReq:3 },
  { id:"m3", icon:"💊", title:"Med Adherent",  desc:"Log medications 5 days",     xpReq:100, medReq:5    },
  { id:"m4", icon:"📊", title:"Data Logger",   desc:"Log 10 biometric readings",  xpReq:150, logReq:10   },
  { id:"m5", icon:"⭐", title:"Week Warrior",  desc:"7-day streak",               xpReq:300, streakReq:7 },
  { id:"m6", icon:"🏆", title:"Prevention Pro",desc:"500 XP earned",              xpReq:500, xpAchieve:500 },
];

/* ══════════════════════════════════════════
   BIOMETRIC RANGES
══════════════════════════════════════════ */
const BIO = {
  systolic:  { unit:"mmHg",  low:90,  normal:120, elevated:140, critical:180 },
  diastolic: { unit:"mmHg",  low:60,  normal:80,  elevated:90,  critical:120 },
  glucose:   { unit:"mg/dL", low:70,  normal:100, elevated:126, critical:300 },
  weight:    { unit:"kg",    low:30,  normal:80,  elevated:100, critical:150 },
  spo2:      { unit:"%",     low:94,  normal:98,  elevated:100, critical:88  },
};
function bioStat(type, val) {
  const r = BIO[type]; if (!r || !val) return { color: "#888", label: "—", lvl: 0 };
  const v = parseFloat(val);
  if (type === "spo2") {
    if (v <= r.critical) return { color: G.red, label: "CRITICAL", lvl: 3 };
    if (v < r.low) return { color: G.amb, label: "Low", lvl: 2 };
    return { color: G.grn, label: "Normal", lvl: 0 };
  }
  if (v >= r.critical) return { color: G.red, label: "CRITICAL", lvl: 3 };
  if (v >= r.elevated) return { color: G.amb, label: "Elevated", lvl: 2 };
  if (v < r.low)       return { color: G.amb, label: "Low", lvl: 1 };
  return { color: G.grn, label: "Normal", lvl: 0 };
}

/* ══════════════════════════════════════════
   WHO DOMAINS
══════════════════════════════════════════ */
const WHO_DOMAINS = {
  diabetes: {
    icon:"🩸", label:"Type 2 Diabetes", code:"NCD-DIAB",
    headline:"422M people, 80% preventable",
    stats:["80% of Type 2 diabetes is preventable via lifestyle changes — WHO 2023","Weight loss 5-7% + 150min/wk → Risk ↓58% (DPP Trial)","1.5M deaths directly attributed to diabetes annually","Whole grain + fiber diet → diabetes risk ↓30% (NHS Nurses' Health Study)"],
    solve:"Daily movement + whole foods + weight management"
  },
  cvd: {
    icon:"❤️", label:"Cardiovascular", code:"NCD-CVD",
    headline:"17.9M deaths/yr — #1 killer",
    stats:["80% of premature heart disease & stroke is preventable — WHO","Mediterranean diet → CVD risk ↓30% (PREDIMED, NEJM 2013)","1.28B adults have hypertension — 46% unaware","Salt reduction + exercise → BP ↓5-10 mmHg average"],
    solve:"BP monitoring + DASH diet + daily movement"
  },
  hypertension: {
    icon:"💊", label:"Hypertension", code:"NCD-HTN",
    headline:"1.28B adults, 1 in 5 controlled",
    stats:["Only 1 in 5 people with hypertension have it controlled — WHO 2021","Salt ↓5g/day → systolic BP ↓ 4.2 mmHg average (Cochrane meta-analysis)","SPRINT Trial: intensive BP control → cardiovascular events ↓25%","Home monitoring → medication adherence ↑"],
    solve:"DASH diet + daily monitoring + medication adherence"
  },
  obesity: {
    icon:"⚖️", label:"Metabolic Health", code:"NCD-OBS",
    headline:"1B+ people, 13+ cancer links",
    stats:["Obesity increases risk of 13+ cancer types — WHO 2023","Sustainable 5-10% weight loss → metabolic improvements in 8 wks","Sleep deprivation → hunger hormone ghrelin ↑18% (NEJM 2004)","Strength training 2x/wk → insulin sensitivity ↑15-20%"],
    solve:"Calorie awareness + activity + sleep + stress management"
  },
};

/* ══════════════════════════════════════════
   CSS INJECTION — GOLD/BLACK THEME
══════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("mfx-gold-css")) return;
  const el = document.createElement("style");
  el.id = "mfx-gold-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes mfx-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mfx-glow{0%,100%{box-shadow:0 0 8px rgba(201,168,76,.15)}50%{box-shadow:0 0 20px rgba(201,168,76,.3)}}
    @keyframes mfx-spin{to{transform:rotate(360deg)}}
    @keyframes mfx-blink{0%,100%{opacity:1}50%{opacity:.2}}
    @keyframes mfx-xp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-50px);opacity:0}}
    @keyframes mfx-shine{0%{background-position:200% center}100%{background-position:-200% center}}
    @keyframes mfx-pulse-ring{0%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}100%{box-shadow:0 0 0 12px rgba(201,168,76,0)}}
    :root {
      --gold:#C9A84C; --gold-l:#F5E9C8; --gold-d:#8A6B1E; --gold-m:#E8C96A;
      --black:#0A0A0A; --black-l:#141414; --black-m:#1E1E1E; --black-s:#2A2A2A;
      --white:#F5F0E8; --white-d:#BFB8A8;
    }
    .mfx-app{font-family:'DM Sans',sans-serif;background:var(--black);color:var(--white);min-height:100dvh}
    .mfx-display{font-family:'Cormorant Garamond',serif;letter-spacing:.02em}
    .mfx-fade{animation:mfx-fade .4s cubic-bezier(.22,.68,0,1.15) both}
    .mfx-card{
      background:var(--black-m);
      border:0.5px solid rgba(201,168,76,.25);
      border-radius:12px;
      padding:16px 18px;
      position:relative;
    }
    .mfx-card::before{
      content:'';position:absolute;inset:0;border-radius:12px;
      background:linear-gradient(135deg,rgba(201,168,76,.04) 0%,transparent 60%);
      pointer-events:none;
    }
    .mfx-card2{
      background:var(--black-s);
      border:0.5px solid rgba(201,168,76,.15);
      border-radius:8px;
      padding:10px 12px;
    }
    .mfx-gold-border{border-color:rgba(201,168,76,.5)!important}
    .mfx-btn{
      display:inline-flex;align-items:center;justify-content:center;gap:6px;
      padding:10px 16px;border-radius:8px;
      border:0.5px solid rgba(201,168,76,.3);
      background:transparent;color:var(--white-d);
      font-size:13px;cursor:pointer;transition:all .15s;
      font-family:'DM Sans',sans-serif;
    }
    .mfx-btn:hover{background:rgba(201,168,76,.08);color:var(--gold);border-color:rgba(201,168,76,.5)}
    .mfx-btn:active{transform:scale(0.97)}
    .mfx-btn-gold{
      background:linear-gradient(135deg,#C9A84C,#8A6B1E);
      color:var(--black);border:none;font-weight:500;
      box-shadow:0 2px 12px rgba(201,168,76,.25);
    }
    .mfx-btn-gold:hover{background:linear-gradient(135deg,#E8C96A,#C9A84C);box-shadow:0 4px 20px rgba(201,168,76,.35);color:var(--black)}
    .mfx-shine-text{
      background:linear-gradient(90deg,#8A6B1E,#E8C96A,#C9A84C,#8A6B1E);
      background-size:200% auto;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:mfx-shine 4s linear infinite;
    }
    .mfx-hab{
      width:100%;padding:11px 14px;border-radius:8px;
      border:0.5px solid rgba(201,168,76,.15);
      background:var(--black-s);cursor:pointer;text-align:left;
      transition:all .18s;display:flex;align-items:center;gap:10px;
      font-family:'DM Sans',sans-serif;
    }
    .mfx-hab:hover{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.05)}
    .mfx-hab.done{border-color:rgba(58,125,68,.5);background:rgba(58,125,68,.08)}
    .mfx-inp{
      width:100%;padding:10px 12px;border-radius:8px;
      border:0.5px solid rgba(201,168,76,.25);
      background:var(--black-s);color:var(--white);
      font-size:13px;font-family:'DM Sans',sans-serif;
    }
    .mfx-inp:focus{outline:2px solid rgba(201,168,76,.4);outline-offset:1px;border-color:transparent}
    .mfx-inp::placeholder{color:rgba(191,184,168,.4)}
    .mfx-sel{
      width:100%;padding:9px 12px;border-radius:8px;
      border:0.5px solid rgba(201,168,76,.2);
      background:var(--black-s);color:var(--white);
      font-size:13px;font-family:'DM Sans',sans-serif;appearance:none;
    }
    .mfx-tab{
      padding:7px 14px;border-radius:8px;
      border:0.5px solid transparent;background:transparent;
      font-size:12px;cursor:pointer;color:rgba(191,184,168,.6);
      transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;
    }
    .mfx-tab:hover{color:var(--gold-l);background:rgba(201,168,76,.05)}
    .mfx-tab.active{
      background:rgba(201,168,76,.1);
      border-color:rgba(201,168,76,.35);
      color:var(--gold);
    }
    .mfx-divider{height:0.5px;background:rgba(201,168,76,.15);margin:4px 0}
    .mfx-badge{
      display:inline-block;padding:3px 8px;border-radius:20px;
      font-size:10px;font-weight:500;letter-spacing:.04em;
    }
    .mfx-xp-pop{position:fixed;pointer-events:none;font-size:14px;font-weight:500;color:var(--gold);animation:mfx-xp 1.5s ease-out forwards;z-index:9999;font-family:'DM Sans',sans-serif}
    .mfx-food-btn{
      flex:1;padding:12px 8px;border-radius:8px;cursor:pointer;
      border:0.5px solid rgba(201,168,76,.2);background:var(--black-s);
      font-family:'DM Sans',sans-serif;transition:all .15s;
    }
    .mfx-food-btn:hover{border-color:rgba(201,168,76,.5);transform:translateY(-1px)}
    .mfx-milestone{
      padding:12px;border-radius:8px;
      border:0.5px solid rgba(201,168,76,.2);
      background:var(--black-s);transition:all .2s;
    }
    .mfx-milestone.achieved{
      border-color:rgba(201,168,76,.5);
      background:rgba(201,168,76,.08);
      animation:mfx-glow 2s ease-in-out infinite;
    }
    .mfx-scrollbar::-webkit-scrollbar{width:4px}
    .mfx-scrollbar::-webkit-scrollbar-track{background:var(--black-s)}
    .mfx-scrollbar::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════
   XP POP
══════════════════════════════════════════ */
function XpPop({ pts, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }, []);
  return <div className="mfx-xp-pop" style={{ left: x, top: y }}>+{pts} XP ✦</div>;
}

/* ══════════════════════════════════════════
   GOLD GAUGE RING
══════════════════════════════════════════ */
function GaugeRing({ score, color, size = 92 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", width: size, height: size }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(201,168,76,.12)" strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray .9s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 4px ${color}66)` }}/>
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize:22, fontWeight:500, color, lineHeight:1, fontFamily:"'Cormorant Garamond',serif" }}>{score}</span>
        <span style={{ fontSize:9, color:"rgba(191,184,168,.5)", textTransform:"uppercase", letterSpacing:".12em" }}>/ 100</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MINI BAR
══════════════════════════════════════════ */
function MiniBar({ pct, color = G.gold, height = 4 }) {
  return (
    <div style={{ height, background:"rgba(201,168,76,.1)", borderRadius:2, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(100,pct)}%`, background:`linear-gradient(90deg,${color}aa,${color})`, transition:"width .6s ease", borderRadius:2 }}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   SPARK CHART (Chart.js)
══════════════════════════════════════════ */
function SparkChart({ data, label, unit, color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || data.length < 2) return;
    const Chart = window.Chart;
    if (!Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    const vals = data.slice(-14).map(d => parseFloat(d.value)).filter(v => !isNaN(v));
    const labels = data.slice(-14).map(d => d.date ? d.date.slice(-5) : "");
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label, data: vals,
          borderColor: color,
          backgroundColor: color + "15",
          borderWidth: 2, pointRadius: 3, pointBackgroundColor: color,
          tension: 0.4, fill: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} ${unit}` } } },
        scales: {
          x: { ticks: { font: { size: 10 }, color: "#888" }, grid: { display: false }, border: { color:"rgba(201,168,76,.15)" } },
          y: { ticks: { font: { size: 10 }, color: "#888" }, grid: { color: "rgba(201,168,76,.07)" }, border: { color:"rgba(201,168,76,.15)" } }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data, color]);

  if (data.length < 2) return (
    <div style={{ fontSize:11, color:"rgba(191,184,168,.4)", textAlign:"center", padding:"8px 0" }}>
      Log 2+ readings to see trend
    </div>
  );
  return (
    <div>
      <div style={{ fontSize:11, color:"rgba(191,184,168,.6)", marginBottom:4 }}>{label} · last {Math.min(data.length, 14)} readings</div>
      <div style={{ position:"relative", height:90 }}><canvas ref={ref} role="img" aria-label={`${label} trend chart`}/></div>
    </div>
  );
}

/* ══════════════════════════════════════════
   AI COACH PANEL (Gold Edition)
══════════════════════════════════════════ */
function AICoach({ profile, riskScore, tier, habits, doneCount, logs, streak }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasIntro, setHasIntro] = useState(false);
  const bottomRef = useRef(null);

  const systemPrompt = `You are ManifiX Elite Health Coach — an empathetic, evidence-based chronic disease prevention AI for premium members.

Patient profile:
- Age: ${profile.age}, BMI: ${profile.bmi}
- Activity level: ${profile.activity}/10, Diet quality: ${profile.diet}/10
- Smoker: ${profile.smokes}, Family history: ${profile.family}
- Blood pressure: ${profile.bp}, Blood sugar: ${profile.sugar}
- WHO Risk Score: ${riskScore}/100 (${tier.label})
- Today's habits: ${doneCount}/${habits.length} completed
- Day streak: ${streak.count} days
- Recent logs: ${logs.slice(0,5).map(l=>l.type+':'+l.value).join(', ') || 'none yet'}

Your style:
- Warm, sophisticated, like a premium personal health concierge
- Reference WHO guidelines and clinical trials (DPP, PREDIMED, SPRINT, UKPDS)
- Use Noom-style behavioral psychology when relevant (cognitive reframing, environment design, hunger scale)
- Keep responses focused: 2-4 sentences + 1 specific 5-minute action
- For symptoms or medications, always recommend consulting their doctor
- You cover: diabetes, CVD, hypertension, obesity, metabolic syndrome, behavioral change`;

  const getIntro = useCallback(async () => {
    if (hasIntro) return;
    setHasIntro(true);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: "Give me a personalized elite coaching greeting and 2 specific micro-goals for today. Be warm and specific." }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Welcome to ManifiX Elite. I'm your personal health coach. Ask me anything about your prevention plan.";
      setMsgs([{ role: "assistant", content: text }]);
    } catch {
      setMsgs([{ role: "assistant", content: "Welcome to ManifiX Elite. I'm your AI health coach. Ask about your prevention plan, habits, or what to focus on today." }]);
    }
    setLoading(false);
  }, [hasIntro, systemPrompt]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role: "user", content: userMsg }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "I had trouble responding. Please try again.";
      setMsgs(prev => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Network error. Please check your connection." }]);
    }
    setLoading(false);
  }, [input, loading, msgs, systemPrompt]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const quickQ = ["What should I focus on today?", "How do I lower my BP naturally?", "Best foods for blood sugar?", "How to start with joint pain?"];

  return (
    <div className="mfx-card mfx-fade" style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>✦ Elite AI Health Coach</div>
          <div style={{ fontSize:11, color:"rgba(191,184,168,.5)", marginTop:2 }}>Personalized · Evidence-based · 24/7</div>
        </div>
        {!hasIntro && (
          <button className="mfx-btn mfx-btn-gold" onClick={getIntro} style={{ fontSize:12, padding:"8px 14px" }}>
            Activate Coach ↗
          </button>
        )}
      </div>

      {msgs.length > 0 && (
        <div className="mfx-scrollbar" style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding:"11px 14px", borderRadius:10, fontSize:13, lineHeight:1.65,
              background: m.role==="assistant" ? "rgba(201,168,76,.07)" : "rgba(26,95,168,.15)",
              color: m.role==="assistant" ? G.white : "#90bde8",
              alignSelf: m.role==="user" ? "flex-end" : "flex-start",
              maxWidth:"88%",
              border: `0.5px solid ${m.role==="assistant" ? "rgba(201,168,76,.2)" : "rgba(26,95,168,.3)"}`,
            }}>
              {m.role==="assistant" && <span style={{ fontSize:10, color:G.gold, marginRight:6, opacity:.7 }}>✦</span>}
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ padding:"11px 14px", background:"rgba(201,168,76,.05)", borderRadius:10, fontSize:13, color:"rgba(191,184,168,.6)", border:"0.5px solid rgba(201,168,76,.15)" }}>
              <span style={{ animation:"mfx-blink 1s infinite", display:"inline-block", color:G.gold }}>✦</span> Thinking…
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      )}

      {!hasIntro && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {quickQ.map(q => (
            <button key={q} className="mfx-tab" onClick={() => { setInput(q); setTimeout(getIntro, 10); }} style={{ fontSize:11 }}>{q}</button>
          ))}
        </div>
      )}

      {hasIntro && (
        <div style={{ display:"flex", gap:8 }}>
          <input className="mfx-inp" value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Ask your elite coach…" style={{ flex:1 }}/>
          <button className="mfx-btn mfx-btn-gold" onClick={send} disabled={loading||!input.trim()}
            style={{ whiteSpace:"nowrap", padding:"10px 16px", opacity:loading||!input.trim()?.5:1 }}>
            Send ↗
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   NOOM-STYLE FOOD JOURNAL
══════════════════════════════════════════ */
function FoodJournal({ foodLog, setFoodLog }) {
  const [meal, setMeal] = useState("breakfast");
  const [name, setName] = useState("");
  const [colorCat, setColorCat] = useState("green");
  const [hunger, setHunger] = useState(5);
  const [fullness, setFullness] = useState(6);
  const [note, setNote] = useState("");
  const [view, setView] = useState("log"); // log | journal | insights

  const todayLog = useMemo(() => foodLog.filter(e => e.date === TK()), [foodLog]);
  const colorCounts = useMemo(() => {
    const c = { green:0, yellow:0, red:0 };
    todayLog.forEach(e => c[e.color]++);
    return c;
  }, [todayLog]);

  const addEntry = () => {
    if (!name.trim()) return;
    const entry = { id:Date.now(), date:TK(), meal, name:name.trim(), color:colorCat, hunger, fullness, note:note.trim(), ts:Date.now() };
    setFoodLog(prev => [entry, ...prev.slice(0,149)]);
    setName(""); setNote("");
  };

  const scorePct = Math.round(((colorCounts.green*3 + colorCounts.yellow*1.5) / Math.max(1, todayLog.length*3))*100);
  const todayPsych = PSYCH_TIPS[new Date().getDay() % PSYCH_TIPS.length];
  const meals = ["breakfast","morning snack","lunch","afternoon snack","dinner","evening snack"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", gap:6 }}>
        {[["log","Food Log"],["journal","Journal"],["insights","Insights"]].map(([k,l]) => (
          <button key={k} className={`mfx-tab ${view===k?"active":""}`} onClick={()=>setView(k)}>{l}</button>
        ))}
      </div>

      {view==="log" && (
        <div className="mfx-card mfx-fade">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>🍽 Food Journal</div>
              <div style={{ fontSize:11, color:"rgba(191,184,168,.5)", marginTop:2 }}>Noom-style color coding · behavioral psychology</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:20, fontWeight:500, color:scorePct>=70?G.grn:scorePct>=40?G.amb:G.red, fontFamily:"'Cormorant Garamond',serif" }}>{scorePct}%</div>
              <div style={{ fontSize:9, color:"rgba(191,184,168,.5)" }}>Green score</div>
            </div>
          </div>

          {/* Color legend */}
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {Object.entries(FOOD_COLORS).map(([k,v]) => (
              <div key={k} style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1px solid ${v.color}44`, background:`${v.color}0E`, textAlign:"center", cursor:"pointer", transition:"all .15s" }}
                onClick={()=>setColorCat(k)}>
                <div style={{ fontSize:11, fontWeight:500, color:v.color, marginBottom:2 }}>{v.label}</div>
                <div style={{ fontSize:9, color:"rgba(191,184,168,.5)" }}>{colorCounts[k]} today</div>
              </div>
            ))}
          </div>

          {/* Color description */}
          <div className="mfx-card2" style={{ marginBottom:12, borderColor:`${FOOD_COLORS[colorCat].color}33` }}>
            <div style={{ fontSize:12, color:FOOD_COLORS[colorCat].color, fontWeight:500, marginBottom:3 }}>{FOOD_COLORS[colorCat].label} Foods</div>
            <div style={{ fontSize:11, color:"rgba(191,184,168,.7)", marginBottom:3 }}>{FOOD_COLORS[colorCat].desc}</div>
            <div style={{ fontSize:10, color:"rgba(191,184,168,.5)" }}>{FOOD_COLORS[colorCat].examples}</div>
          </div>

          {/* Log form */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div>
              <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Meal</label>
              <select className="mfx-sel" value={meal} onChange={e=>setMeal(e.target.value)} style={{ fontSize:12 }}>
                {meals.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Color category</label>
              <select className="mfx-sel" value={colorCat} onChange={e=>setColorCat(e.target.value)} style={{ fontSize:12 }}>
                {Object.entries(FOOD_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:8 }}>
            <input className="mfx-inp" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addEntry()}
              placeholder="What did you eat? e.g. Mixed salad with chicken" style={{ marginBottom:8 }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div>
              <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Hunger before ({hunger}/10)</label>
              <input type="range" min="1" max="10" value={hunger} onChange={e=>setHunger(+e.target.value)} style={{ width:"100%", accentColor:G.gold }}/>
            </div>
            <div>
              <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Fullness after ({fullness}/10)</label>
              <input type="range" min="1" max="10" value={fullness} onChange={e=>setFullness(+e.target.value)} style={{ width:"100%", accentColor:G.gold }}/>
            </div>
          </div>
          <input className="mfx-inp" value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Emotional note (optional): stressed, bored, celebrating…" style={{ marginBottom:10 }}/>
          <button className="mfx-btn mfx-btn-gold" onClick={addEntry} disabled={!name.trim()} style={{ width:"100%", opacity:name.trim()?1:.4 }}>
            Log Meal ✦
          </button>

          {/* Today's log */}
          {todayLog.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, color:"rgba(191,184,168,.5)", marginBottom:8 }}>Today's meals ({todayLog.length})</div>
              {todayLog.map(e => (
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"0.5px solid rgba(201,168,76,.1)" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:FOOD_COLORS[e.color].color, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:G.white }}>{e.name}</div>
                    <div style={{ fontSize:10, color:"rgba(191,184,168,.5)" }}>{e.meal} · hunger:{e.hunger} → fullness:{e.fullness}</div>
                  </div>
                  <span className="mfx-badge" style={{ background:`${FOOD_COLORS[e.color].color}22`, color:FOOD_COLORS[e.color].color, border:`0.5px solid ${FOOD_COLORS[e.color].color}44` }}>
                    {FOOD_COLORS[e.color].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view==="journal" && (
        <div className="mfx-card mfx-fade">
          <div className="mfx-display" style={{ fontSize:16, color:G.gold, marginBottom:12 }}>📔 Behavioral Journal</div>
          {[
            { label:"What triggered eating today?", placeholder:"Stress, boredom, social, genuine hunger…" },
            { label:"Emotional state before eating", placeholder:"Anxious, happy, tired, celebratory…" },
            { label:"Non-food coping strategies used", placeholder:"Walk, call a friend, breathing exercise…" },
          ].map(({label,placeholder},i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:"rgba(191,184,168,.6)", display:"block", marginBottom:4 }}>{label}</label>
              <textarea className="mfx-inp" rows={2} placeholder={placeholder} style={{ resize:"none" }}/>
            </div>
          ))}
          <div className="mfx-card2" style={{ marginTop:4 }}>
            <div style={{ fontSize:11, color:G.gold, marginBottom:4 }}>🧠 Today's Psychology Insight</div>
            <div style={{ fontSize:12, fontWeight:500, color:G.white, marginBottom:4 }}>{todayPsych.title}</div>
            <div style={{ fontSize:11, color:"rgba(191,184,168,.7)", lineHeight:1.6, marginBottom:6 }}>{todayPsych.desc}</div>
            <div style={{ fontSize:10, color:"rgba(201,168,76,.7)", borderLeft:`2px solid ${G.gold}44`, paddingLeft:8 }}>{todayPsych.science}</div>
          </div>
        </div>
      )}

      {view==="insights" && (
        <div className="mfx-card mfx-fade">
          <div className="mfx-display" style={{ fontSize:16, color:G.gold, marginBottom:12 }}>📊 Food Psychology Insights</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
            {Object.entries(FOOD_COLORS).map(([k,v]) => (
              <div key={k} className="mfx-card2" style={{ textAlign:"center", borderColor:`${v.color}33` }}>
                <div style={{ fontSize:20, fontWeight:500, color:v.color, fontFamily:"'Cormorant Garamond',serif" }}>
                  {foodLog.filter(e=>e.color===k).length}
                </div>
                <div style={{ fontSize:9, color:"rgba(191,184,168,.5)", marginTop:2 }}>{v.label} total</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(191,184,168,.6)", marginBottom:6 }}>
              <span>Average hunger before eating</span>
              <span style={{ color:G.gold }}>{foodLog.length ? (foodLog.reduce((a,e)=>a+e.hunger,0)/foodLog.length).toFixed(1) : '—'}/10</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(191,184,168,.6)", marginBottom:6 }}>
              <span>Average fullness after eating</span>
              <span style={{ color:G.gold }}>{foodLog.length ? (foodLog.reduce((a,e)=>a+e.fullness,0)/foodLog.length).toFixed(1) : '—'}/10</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(191,184,168,.6)" }}>
              <span>Total meals logged</span>
              <span style={{ color:G.gold }}>{foodLog.length}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {PSYCH_TIPS.map((t,i) => (
              <div key={i} className="mfx-card2">
                <div style={{ fontSize:12, fontWeight:500, color:G.gold, marginBottom:3 }}>{t.title}</div>
                <div style={{ fontSize:11, color:"rgba(191,184,168,.7)", lineHeight:1.55 }}>{t.desc}</div>
                <div style={{ fontSize:10, color:"rgba(201,168,76,.6)", marginTop:4 }}>📖 {t.science}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MEDICATION TRACKER (Teladoc-style)
══════════════════════════════════════════ */
function MedTracker({ meds, setMeds, medLog, setMedLog }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name:"", category:"Diabetes", dose:"", time:"morning", notes:"" });
  const todayTaken = medLog.filter(e=>e.date===TK()).map(e=>e.medId);

  const addMed = () => {
    if (!form.name.trim()) return;
    setMeds(prev => [...prev, { id:Date.now(), ...form }]);
    setForm({ name:"", category:"Diabetes", dose:"", time:"morning", notes:"" });
    setAdding(false);
  };

  const takeMed = (medId) => {
    if (todayTaken.includes(medId)) return;
    setMedLog(prev => [{ medId, date:TK(), ts:Date.now() }, ...prev.slice(0,199)]);
  };

  const removeMed = (id) => setMeds(prev=>prev.filter(m=>m.id!==id));
  const adherence7 = meds.length ? Math.round((medLog.filter(e=>{
    const d = new Date(e.ts); const now=new Date();
    return (now-d)<7*86400000;
  }).length / Math.max(1, meds.length*7))*100) : 0;

  const timeSlots = ["morning","midday","evening","bedtime","as needed"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div className="mfx-card mfx-fade">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>💊 Medication Manager</div>
            <div style={{ fontSize:11, color:"rgba(191,184,168,.5)", marginTop:2 }}>Teladoc-style medication bridge</div>
          </div>
          <button className="mfx-btn mfx-btn-gold" onClick={()=>setAdding(v=>!v)} style={{ fontSize:12, padding:"7px 12px" }}>
            {adding ? "✕ Cancel" : "+ Add Med"}
          </button>
        </div>

        {/* Adherence stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            ["7-Day Adherence", `${adherence7}%`, adherence7>=80?G.grn:adherence7>=50?G.amb:G.red],
            ["Medications", `${meds.length}`, G.gold],
            ["Taken Today", `${todayTaken.length}/${meds.length}`, G.grn],
          ].map(([l,v,c]) => (
            <div key={l} className="mfx-card2" style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:500, color:c, fontFamily:"'Cormorant Garamond',serif" }}>{v}</div>
              <div style={{ fontSize:9, color:"rgba(191,184,168,.5)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {meds.length > 0 && <MiniBar pct={meds.length ? (todayTaken.length/meds.length)*100 : 0} color={G.grn}/>}

        {/* Add form */}
        {adding && (
          <div className="mfx-card2" style={{ marginTop:12, marginBottom:12 }}>
            <div style={{ fontSize:12, color:G.gold, marginBottom:8 }}>Add New Medication</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <div>
                <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Category</label>
                <select className="mfx-sel" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value,name:""}))} style={{ fontSize:12 }}>
                  {MED_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Time</label>
                <select className="mfx-sel" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={{ fontSize:12 }}>
                  {timeSlots.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={{ fontSize:10, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>Medication name</label>
              <input className="mfx-inp" list="med-suggestions" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Type or select…"/>
              <datalist id="med-suggestions">
                {(COMMON_MEDS[form.category]||[]).map(m=><option key={m} value={m}/>)}
              </datalist>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <input className="mfx-inp" value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))} placeholder="Dose (e.g. 500mg)"/>
              <input className="mfx-inp" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (with food, etc.)"/>
            </div>
            <button className="mfx-btn mfx-btn-gold" onClick={addMed} disabled={!form.name.trim()} style={{ width:"100%", opacity:form.name.trim()?1:.4 }}>
              Add Medication ✦
            </button>
          </div>
        )}

        {/* Medication list */}
        {meds.length === 0 && !adding && (
          <div style={{ textAlign:"center", padding:"20px 0", color:"rgba(191,184,168,.4)", fontSize:13 }}>
            No medications tracked yet.<br/>
            <span style={{ fontSize:11 }}>Add your prescriptions to track adherence.</span>
          </div>
        )}

        {meds.map(m => {
          const taken = todayTaken.includes(m.id);
          return (
            <div key={m.id} className="mfx-card2" style={{ marginBottom:8, borderColor:taken?"rgba(58,125,68,.4)":"rgba(201,168,76,.15)", background:taken?"rgba(58,125,68,.06)":"var(--black-s)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:G.white }}>{m.name}</div>
                    <span className="mfx-badge" style={{ background:"rgba(201,168,76,.12)", color:G.gold, border:"0.5px solid rgba(201,168,76,.25)", fontSize:9 }}>{m.category}</span>
                  </div>
                  <div style={{ fontSize:10, color:"rgba(191,184,168,.5)" }}>
                    {m.dose && `${m.dose} · `}{m.time}{m.notes && ` · ${m.notes}`}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="mfx-btn" onClick={()=>takeMed(m.id)}
                    style={{ fontSize:11, padding:"6px 12px", borderColor:taken?"rgba(58,125,68,.5)":"rgba(201,168,76,.2)", color:taken?G.grn:G.white }}>
                    {taken ? "✓ Taken" : "Mark Taken"}
                  </button>
                  <button className="mfx-btn" onClick={()=>removeMed(m.id)} style={{ padding:"6px 8px", fontSize:10, color:"rgba(201,44,36,.6)", borderColor:"rgba(201,44,36,.2)" }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mfx-card2" style={{ marginTop:8 }}>
          <div style={{ fontSize:10, color:G.gold, marginBottom:3 }}>⚠ Medical Disclaimer</div>
          <div style={{ fontSize:10, color:"rgba(191,184,168,.5)", lineHeight:1.6 }}>
            This tracker is for reminders only. Always follow your doctor's prescription. Never change medication doses without medical guidance. Adherence ↑40% reduces diabetes complications (UKPDS 2023).
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BIOMETRIC LOGGER MODAL
══════════════════════════════════════════ */
function LogModal({ onClose, onSave }) {
  const [type, setType] = useState("bp");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [note, setNote] = useState("");
  const FIELDS = {
    bp:      { label:"Blood Pressure", hint1:"Systolic e.g. 120", hint2:"Diastolic e.g. 80", two:true },
    glucose: { label:"Glucose",       hint1:"mg/dL e.g. 95",    hint2:"", two:false },
    weight:  { label:"Weight",        hint1:"kg e.g. 72.5",     hint2:"", two:false },
    spo2:    { label:"SpO₂",          hint1:"% e.g. 98",        hint2:"", two:false },
    hba1c:   { label:"HbA1c",         hint1:"% e.g. 6.5",       hint2:"", two:false },
    chol:    { label:"Cholesterol",   hint1:"mg/dL e.g. 185",   hint2:"", two:false },
  };
  const f = FIELDS[type];
  const valid = v1.trim() !== "";
  const save = () => {
    if (!valid) return;
    onSave({ type, value:f.two?`${v1}/${v2}`:v1, notes:note.trim(), ts:Date.now(), date:new Date().toLocaleDateString() });
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16 }}>
      <div className="mfx-card mfx-fade" style={{ width:"min(420px,100%)", maxHeight:"90vh", overflowY:"auto", background:"var(--black-l)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <span className="mfx-display" style={{ fontSize:16, color:G.gold }}>📊 Log Biometric Reading</span>
          <button className="mfx-btn" onClick={onClose} style={{ padding:"4px 8px" }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:14 }}>
          {Object.entries(FIELDS).map(([k, fd]) => (
            <button key={k} className={`mfx-tab ${type===k?"active":""}`}
              onClick={() => { setType(k); setV1(""); setV2(""); }}
              style={{ fontSize:11, textAlign:"center" }}>{fd.label}</button>
          ))}
        </div>
        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>{f.hint1}</label>
          <input className="mfx-inp" type="number" value={v1} onChange={e=>setV1(e.target.value)} placeholder={f.hint1}/>
        </div>
        {f.two && (
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, color:"rgba(191,184,168,.5)", display:"block", marginBottom:4 }}>{f.hint2}</label>
            <input className="mfx-inp" type="number" value={v2} onChange={e=>setV2(e.target.value)} placeholder={f.hint2}/>
          </div>
        )}
        <textarea className="mfx-inp" value={note} onChange={e=>setNote(e.target.value)} rows={2}
          placeholder="Notes: fasting, after meal, post-exercise…" style={{ marginBottom:14, resize:"vertical" }}/>
        <div style={{ display:"flex", gap:8 }}>
          <button className="mfx-btn" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="mfx-btn mfx-btn-gold" onClick={save} disabled={!valid} style={{ flex:2, opacity:valid?1:.4 }}>Save Reading ✦</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MILESTONES PANEL
══════════════════════════════════════════ */
function MilestonesPanel({ streak, xp, doneCount, logs, medLog }) {
  const achieved = (m) => {
    if (m.habitReq && doneCount < m.habitReq) return false;
    if (m.streakReq && streak.count < m.streakReq) return false;
    if (m.xpAchieve && (xp||0) < m.xpAchieve) return false;
    if (m.logReq && logs.length < m.logReq) return false;
    if (m.medReq && medLog.length < m.medReq) return false;
    return true;
  };
  const doneCount2 = MILESTONES.filter(m=>achieved(m)).length;

  return (
    <div className="mfx-card mfx-fade">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>🏆 Care Milestones</div>
        <div style={{ fontSize:12, color:"rgba(191,184,168,.6)" }}>{doneCount2}/{MILESTONES.length} achieved</div>
      </div>
      <MiniBar pct={(doneCount2/MILESTONES.length)*100} color={G.gold}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
        {MILESTONES.map(m => {
          const a = achieved(m);
          return (
            <div key={m.id} className={`mfx-milestone ${a?"achieved":""}`}>
              <div style={{ fontSize:20, marginBottom:6 }}>{m.icon}</div>
              <div style={{ fontSize:12, fontWeight:500, color:a?G.gold:G.white }}>{m.title}</div>
              <div style={{ fontSize:10, color:"rgba(191,184,168,.5)", marginTop:2 }}>{m.desc}</div>
              {a && <div style={{ fontSize:10, color:G.gold, marginTop:4 }}>✦ Achieved</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE PANEL
══════════════════════════════════════════ */
function ProfilePanel({ profile, onChange }) {
  const Slider = ({ field, label, min, max }) => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(191,184,168,.5)", marginBottom:3 }}>
        <span>{label}</span>
        <span style={{ color:G.gold }}>{profile[field]}{field==="bmi"?" BMI":field==="age"?" yrs":"/10"}</span>
      </div>
      <input type="range" min={min} max={max} value={profile[field]} step="1"
        onChange={e=>onChange(field,+e.target.value)} style={{ width:"100%", accentColor:G.gold }}/>
    </div>
  );
  return (
    <div className="mfx-card mfx-fade">
      <div className="mfx-display" style={{ fontSize:14, color:G.gold, marginBottom:12 }}>⚙ Risk Profile — updates live</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <Slider field="age"      label="Age"           min={18} max={85}/>
        <Slider field="bmi"      label="BMI"           min={15} max={50}/>
        <Slider field="activity" label="Activity Level" min={1}  max={10}/>
        <Slider field="diet"     label="Diet Quality"   min={1}  max={10}/>
      </div>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:12 }}>
        {[["smokes","🚬 Smoker"],["family","🧬 Family history"]].map(([f,l]) => (
          <label key={f} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer", color:G.whiteD }}>
            <input type="checkbox" checked={!!profile[f]} onChange={e=>onChange(f,e.target.checked)} style={{ accentColor:G.gold, width:14, height:14 }}/>{l}
          </label>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          ["bp","Blood Pressure",["normal","elevated","high"]],
          ["sugar","Blood Sugar",["normal","prediabetic","diabetic"]],
          ["waist","Waist Risk",["normal","high"]],
        ].map(([f,l,opts]) => (
          <div key={f}>
            <label style={{ fontSize:10, color:"rgba(191,184,168,.4)", display:"block", marginBottom:3 }}>{l}</label>
            <select className="mfx-sel" value={profile[f]} onChange={e=>onChange(f,e.target.value)} style={{ fontSize:11 }}>
              {opts.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function ChronicDisease() {
  const [profile, setProfile] = useState(() => ls("mfx_profile_v4", {
    age:38, bmi:25, activity:5, diet:6, smokes:false, family:false, bp:"normal", sugar:"normal", waist:"normal"
  }));
  const [habitsToday, setHabitsToday] = useState(() => ls(`mfx_habits_${TK()}`, {}));
  const [logs, setLogs] = useState(() => ls("mfx_logs_v4", []));
  const [foodLog, setFoodLog] = useState(() => ls("mfx_food_v1", []));
  const [meds, setMeds] = useState(() => ls("mfx_meds_v1", []));
  const [medLog, setMedLog] = useState(() => ls("mfx_medlog_v1", []));
  const [streak, setStreak] = useState(() => ls("mfx_streak_v3", { count:0, lastDate:"", xp:0, level:1 }));
  const [plan, setPlan] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [showLog, setShowLog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [whoKey, setWhoKey] = useState("diabetes");
  const [crisis, setCrisis] = useState(null);
  const [xpPops, setXpPops] = useState([]);
  const [chartReady, setChartReady] = useState(false);

  const riskScore = useMemo(() => calcRisk(profile), [profile]);
  const tier = useMemo(() => riskTier(riskScore), [riskScore]);
  const doneCount = Object.values(habitsToday).filter(Boolean).length;
  const doneXP = HABITS.filter(h => habitsToday[h.id]).reduce((a, h) => a + h.pts, 0);
  const wellScore = useMemo(() => {
    const base = 100 - riskScore;
    const hb = (doneCount / HABITS.length) * 18;
    const sk = Math.min(15, streak.count * 1.5);
    return Math.min(100, Math.round(base + hb + sk));
  }, [riskScore, doneCount, streak.count]);

  useEffect(() => {
    injectCSS();
    const existing = PLAN_POOL.filter(g => g.condition(profile)).slice(0, 3);
    setPlan(existing.map(g => ({ ...g, done: false })));
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => setChartReady(true);
    if (!window.Chart) document.head.appendChild(script);
    else setChartReady(true);
  }, []);

  useEffect(() => { lss("mfx_profile_v4", profile); }, [profile]);
  useEffect(() => { lss(`mfx_habits_${TK()}`, habitsToday); }, [habitsToday]);
  useEffect(() => { lss("mfx_logs_v4", logs); }, [logs]);
  useEffect(() => { lss("mfx_food_v1", foodLog); }, [foodLog]);
  useEffect(() => { lss("mfx_meds_v1", meds); }, [meds]);
  useEffect(() => { lss("mfx_medlog_v1", medLog); }, [medLog]);
  useEffect(() => { lss("mfx_streak_v3", streak); }, [streak]);

  const updateProfile = useCallback((f, v) => {
    setProfile(prev => {
      const np = { ...prev, [f]: v };
      const newPlan = PLAN_POOL.filter(g => g.condition(np)).slice(0, 3);
      setPlan(newPlan.map(g => ({ ...g, done: false })));
      return np;
    });
  }, []);

  const toggleHabit = useCallback((h, e) => {
    if (habitsToday[h.id]) return;
    setHabitsToday(prev => ({ ...prev, [h.id]: true }));
    const today = TK();
    setStreak(s => {
      const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
      let count = s.lastDate === yesterday ? s.count + 1 : s.lastDate === today ? s.count : 1;
      const xp = (s.xp||0) + h.pts;
      const level = Math.floor(xp / 200) + 1;
      return { count, lastDate:today, xp, level };
    });
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setXpPops(prev => [...prev, { id, pts: h.pts, x: rect.left + rect.width/2 - 20, y: rect.top - 10 }]);
    setTimeout(() => setXpPops(prev => prev.filter(p => p.id !== id)), 1700);
  }, [habitsToday]);

  const saveLog = useCallback((entry) => {
    setLogs(prev => [entry, ...prev.slice(0, 89)]);
    if (entry.type==="bp" && parseFloat(entry.value) >= 180) setCrisis("bp");
    if (entry.type==="glucose" && parseFloat(entry.value) >= 300) setCrisis("glucose");
  }, []);

  const latestBio = useMemo(() => {
    const m = {};
    logs.forEach(l => { if (!m[l.type]) m[l.type] = l; });
    return m;
  }, [logs]);

  const TABS = [
    { id:"dashboard", label:"Dashboard" },
    { id:"habits",    label:"Habits" },
    { id:"food",      label:"Food" },
    { id:"meds",      label:"Meds" },
    { id:"biometrics",label:"Biometrics" },
    { id:"coach",     label:"AI Coach" },
    { id:"who",       label:"WHO Data" },
  ];

  return (
    <div className="mfx-app" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 0 80px" }}>

      {xpPops.map(p => <XpPop key={p.id} {...p} onDone={()=>setXpPops(prev=>prev.filter(x=>x.id!==p.id))}/>)}

      {/* Crisis Alert */}
      {crisis && (
        <div style={{ width:"100%", background:"rgba(201,44,36,.9)", borderBottom:"1px solid rgba(201,44,36,.5)", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:50 }}>
          <span style={{ fontSize:13, fontWeight:500, color:"#fff" }}>
            🚨 {crisis==="bp" ? "URGENT: Blood pressure critically high. Seek medical care immediately." : "URGENT: Blood glucose dangerously elevated. Seek care now."}
          </span>
          <button onClick={()=>setCrisis(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,.4)", color:"#fff", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>Dismiss</button>
        </div>
      )}

      {showLog && <LogModal onClose={()=>setShowLog(false)} onSave={saveLog}/>}

      <div style={{ width:"min(540px,98vw)", display:"flex", flexDirection:"column", gap:14, paddingTop:20 }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:"0.5px solid rgba(201,168,76,.2)" }}>
          <div>
            <div className="mfx-display mfx-shine-text" style={{ fontSize:26, lineHeight:1 }}>ManifiX</div>
            <div style={{ fontSize:10, color:"rgba(191,184,168,.4)", marginTop:4, letterSpacing:".12em", textTransform:"uppercase" }}>Chronic · Elite Edition · WHO SDG 3.4</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ textAlign:"center", padding:"8px 12px", background:"rgba(201,168,76,.08)", borderRadius:8, border:"0.5px solid rgba(201,168,76,.25)" }}>
              <div className="mfx-display" style={{ fontSize:18, color:G.gold, lineHeight:1 }}>Lv {streak.level||1}</div>
              <div style={{ fontSize:9, color:"rgba(191,184,168,.4)", marginTop:2 }}>{streak.xp||0} XP</div>
            </div>
            <button className="mfx-btn" onClick={()=>setShowProfile(v=>!v)} style={{ fontSize:11, padding:"8px 12px" }}>
              {showProfile ? "✕" : "⚙ Profile"}
            </button>
          </div>
        </div>

        {showProfile && <ProfilePanel profile={profile} onChange={updateProfile}/>}

        {/* ── RISK CARD ── */}
        <div className="mfx-card mfx-fade" style={{ border:`0.5px solid ${tier.color}55` }}>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <GaugeRing score={riskScore} color={tier.color} size={92}/>
            <div style={{ flex:1 }}>
              <div className="mfx-display" style={{ fontSize:16, color:tier.color, marginBottom:4 }}>
                {tier.icon} {tier.label}
                <span style={{ fontSize:11, color:"rgba(191,184,168,.5)", fontFamily:"'DM Sans',sans-serif", marginLeft:8 }}>WHO PEN Score</span>
              </div>
              <div style={{ fontSize:11, color:"rgba(191,184,168,.65)", lineHeight:1.6, marginBottom:10 }}>
                {tier.key==="low" && "Your lifestyle choices are actively protecting your future health."}
                {tier.key==="mod" && "Moderate risk detected. Your elite prevention plan is activated."}
                {tier.key==="high" && "Elevated risk. Immediate action today — small changes compound fast."}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  ["Wellness",`${wellScore}`,"%",G.grn],
                  ["Streak",`${streak.count}`,"d",G.gold],
                  ["Habits",`${doneCount}/${HABITS.length}`,"",G.blu],
                ].map(([l,v,u,col]) => (
                  <div key={l} className="mfx-card2" style={{ textAlign:"center" }}>
                    <div className="mfx-display" style={{ fontSize:18, color:col, lineHeight:1 }}>{v}<span style={{ fontSize:9, fontFamily:"'DM Sans',sans-serif" }}>{u}</span></div>
                    <div style={{ fontSize:9, color:"rgba(191,184,168,.4)", marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:2 }}>
          {TABS.map(t => (
            <button key={t.id} className={`mfx-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════════ */}
        {tab==="dashboard" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Prevention plan */}
            <div className="mfx-card mfx-fade">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>🎯 Your Prevention Plan</div>
                <span style={{ fontSize:10, color:"rgba(191,184,168,.4)", letterSpacing:".08em" }}>WHO EVIDENCE</span>
              </div>
              {plan.map((g, i) => (
                <div key={g.id} className="mfx-card2" style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:G.white, marginBottom:3 }}>{g.icon} {g.title}</div>
                      <div style={{ fontSize:11, color:"rgba(191,184,168,.7)", lineHeight:1.55, marginBottom:5 }}>{g.action}</div>
                      <div style={{ fontSize:10, color:G.grn, borderLeft:`2px solid ${G.grn}55`, paddingLeft:8 }}>{g.impact}</div>
                    </div>
                    <button className="mfx-btn" onClick={() => setPlan(prev => prev.map(p=>p.id===g.id?{...p,streak:(p.streak||0)+1}:p))}
                      style={{ fontSize:11, padding:"6px 12px", flexShrink:0, borderColor:(g.streak||0)>0?"rgba(201,168,76,.5)":"rgba(201,168,76,.15)", color:(g.streak||0)>0?G.gold:G.whiteD }}>
                      {(g.streak||0) > 0 ? `🔥 ${g.streak}` : "Done +1"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick snapshot */}
            <div className="mfx-card mfx-fade">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div className="mfx-display" style={{ fontSize:15, color:G.gold }}>🩺 Vitals Snapshot</div>
                <button className="mfx-btn mfx-btn-gold" onClick={()=>setShowLog(true)} style={{ fontSize:11, padding:"6px 12px" }}>+ Log ✦</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[{type:"bp",icon:"❤️",label:"Blood Pressure"},{type:"glucose",icon:"🩸",label:"Glucose"},{type:"weight",icon:"⚖️",label:"Weight"},{type:"spo2",icon:"🫁",label:"SpO₂"}].map(({type,icon,label}) => {
                  const e = latestBio[type];
                  const isBP = type==="bp";
                  const st = e ? bioStat(isBP?"systolic":type, isBP?e.value.split("/")[0]:e.value) : null;
                  return (
                    <div key={type} className="mfx-card2" onClick={()=>setShowLog(true)} style={{ cursor:"pointer", borderColor:st?`${st.color}44`:"rgba(201,168,76,.1)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:10, color:"rgba(191,184,168,.5)" }}>{icon} {label}</span>
                        {st && <span style={{ fontSize:9, fontWeight:500, color:st.color }}>{st.label}</span>}
                      </div>
                      <div className="mfx-display" style={{ fontSize:20, color:st?st.color:"rgba(191,184,168,.3)", lineHeight:1 }}>{e?e.value:"—"}</div>
                      <div style={{ fontSize:9, color:"rgba(191,184,168,.4)", marginTop:2 }}>{e?e.date:"Not logged"}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habits quick + meds */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div className="mfx-card2" style={{ cursor:"pointer" }} onClick={()=>setTab("habits")}>
                <div style={{ fontSize:11, color:G.gold, marginBottom:6 }}>📋 Habits</div>
                <MiniBar pct={(doneCount/HABITS.length)*100} color={tier.color}/>
                <div style={{ fontSize:11, color:"rgba(191,184,168,.6)", marginTop:5 }}>{doneCount}/{HABITS.length} done · {doneXP} XP</div>
              </div>
              <div className="mfx-card2" style={{ cursor:"pointer" }} onClick={()=>setTab("meds")}>
                <div style={{ fontSize:11, color:G.gold, marginBottom:6 }}>💊 Medications</div>
                <MiniBar pct={meds.length?((medLog.filter(e=>e.date===TK()).length)/meds.length)*100:0} color={G.grn}/>
                <div style={{ fontSize:11, color:"rgba(191,184,168,.6)", marginTop:5 }}>{medLog.filter(e=>e.date===TK()).length}/{meds.length} taken today</div>
              </div>
            </div>

            {/* Food quick */}
            <div className="mfx-card2" style={{ cursor:"pointer" }} onClick={()=>setTab("food")}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:11, color:G.gold }}>🍽 Food Journal (Noom-style)</span>
                <span style={{ fontSize:11, color:"rgba(191,184,168,.5)" }}>{foodLog.filter(e=>e.date===TK()).length} meals today</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {Object.entries(FOOD_COLORS).map(([k,v]) => (
                  <div key={k} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:14, fontWeight:500, color:v.color }}>{foodLog.filter(e=>e.color===k&&e.date===TK()).length}</div>
                    <div style={{ fontSize:9, color:"rgba(191,184,168,.4)" }}>{v.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones mini */}
            <MilestonesPanel streak={streak} xp={streak.xp||0} doneCount={doneCount} logs={logs} medLog={medLog}/>

            {/* Streak motivation */}
            <div className="mfx-card2" style={{ textAlign:"center", borderColor:"rgba(201,168,76,.15)" }}>
              <div className="mfx-display" style={{ fontSize:14, color:G.gold, marginBottom:4 }}>
                {streak.count>=7 ? `✦ ${streak.count}-Day Streak` : streak.count>=3 ? `⭐ ${streak.count}-Day Streak` : "✦ Begin Your Journey"}
              </div>
              <div style={{ fontSize:12, color:"rgba(191,184,168,.6)", lineHeight:1.7 }}>
                {streak.count>=7 && "You're building a lifestyle, not just habits. This is who you are now."}
                {streak.count>=3 && streak.count<7 && "Consistency is compounding. Your future self is grateful."}
                {streak.count<3 && "Every healthy choice builds a stronger tomorrow. The journey starts today."}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            HABITS TAB
        ══════════════════════════════════════ */}
        {tab==="habits" && (
          <div className="mfx-card mfx-fade">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>📋 Daily Health Habits</div>
                <div style={{ fontSize:11, color:"rgba(191,184,168,.4)" }}>WHO evidence-based NCD prevention</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div className="mfx-display" style={{ fontSize:20, color:tier.color }}>{doneCount}/{HABITS.length}</div>
                <div style={{ fontSize:9, color:"rgba(191,184,168,.4)" }}>complete</div>
              </div>
            </div>
            <MiniBar pct={(doneCount/HABITS.length)*100} color={tier.color} height={5}/>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
              {HABITS.map(h => {
                const done = !!habitsToday[h.id];
                return (
                  <button key={h.id} className={`mfx-hab ${done?"done":""}`} onClick={e=>toggleHabit(h,e)}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{h.icon}</span>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontSize:12, fontWeight:done?400:500, color:done?"rgba(191,184,168,.4)":G.white, textDecoration:done?"line-through":"none" }}>{h.label}</div>
                      <div style={{ fontSize:10, color:"rgba(191,184,168,.4)", marginTop:1 }}>{h.who}</div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {done
                        ? <span style={{ fontSize:16, color:G.grn }}>✓</span>
                        : <span style={{ fontSize:10, color:G.gold, background:"rgba(201,168,76,.08)", padding:"3px 8px", borderRadius:20, border:"0.5px solid rgba(201,168,76,.25)" }}>+{h.pts} XP</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mfx-card2" style={{ marginTop:12, textAlign:"center" }}>
              <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>Level {streak.level||1}</div>
              <MiniBar pct={((streak.xp||0)%200)/2} color={G.gold} height={4}/>
              <div style={{ fontSize:10, color:"rgba(191,184,168,.4)", marginTop:4 }}>{200-((streak.xp||0)%200)} XP to Level {(streak.level||1)+1} · {streak.xp||0} total XP</div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            FOOD TAB
        ══════════════════════════════════════ */}
        {tab==="food" && <FoodJournal foodLog={foodLog} setFoodLog={setFoodLog}/>}

        {/* ══════════════════════════════════════
            MEDS TAB
        ══════════════════════════════════════ */}
        {tab==="meds" && <MedTracker meds={meds} setMeds={setMeds} medLog={medLog} setMedLog={setMedLog}/>}

        {/* ══════════════════════════════════════
            BIOMETRICS TAB
        ══════════════════════════════════════ */}
        {tab==="biometrics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="mfx-card mfx-fade">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div>
                  <div className="mfx-display" style={{ fontSize:16, color:G.gold }}>🩺 Biometric Logger</div>
                  <div style={{ fontSize:11, color:"rgba(191,184,168,.4)" }}>BP · Glucose · Weight · SpO₂ · HbA1c · Cholesterol</div>
                </div>
                <button className="mfx-btn mfx-btn-gold" onClick={()=>setShowLog(true)} style={{ fontSize:12, padding:"8px 14px" }}>+ Log ✦</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                {[
                  {type:"bp",icon:"❤️",label:"Blood Pressure",unit:"mmHg"},
                  {type:"glucose",icon:"🩸",label:"Blood Glucose",unit:"mg/dL"},
                  {type:"weight",icon:"⚖️",label:"Body Weight",unit:"kg"},
                  {type:"spo2",icon:"🫁",label:"SpO₂",unit:"%"},
                  {type:"hba1c",icon:"🔬",label:"HbA1c",unit:"%"},
                  {type:"chol",icon:"💉",label:"Cholesterol",unit:"mg/dL"},
                ].map(({type,icon,label,unit}) => {
                  const e = latestBio[type];
                  const isBP = type==="bp";
                  const st = e ? bioStat(isBP?"systolic":type, isBP?e.value.split("/")[0]:e.value) : null;
                  return (
                    <div key={type} className="mfx-card2" style={{ borderColor:st&&st.lvl>=2?`${st.color}44`:"rgba(201,168,76,.12)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:10, color:"rgba(191,184,168,.5)" }}>{icon} {label}</span>
                        {st&&st.lvl>0&&<span style={{ fontSize:9, fontWeight:500, color:st.color }}>{st.label}</span>}
                      </div>
                      <div className="mfx-display" style={{ fontSize:20, color:st?st.color:"rgba(191,184,168,.3)", lineHeight:1 }}>{e?e.value:"—"}</div>
                      <div style={{ fontSize:9, color:"rgba(191,184,168,.4)", marginTop:2 }}>{e?`${e.date} · ${unit}`:"Tap + Log"}</div>
                    </div>
                  );
                })}
              </div>
              {chartReady && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="mfx-display" style={{ fontSize:14, color:G.gold, marginBottom:2 }}>📈 Trend Analysis</div>
                  {[
                    {type:"glucose",label:"Blood Glucose",unit:"mg/dL",color:"#C9881F"},
                    {type:"spo2",label:"SpO₂",unit:"%",color:"#1A5FA8"},
                    {type:"weight",label:"Body Weight",unit:"kg",color:"#C94A2C"},
                  ].map(({type,label,unit,color}) => (
                    <SparkChart key={type} data={logs.filter(l=>l.type===type)} label={label} unit={unit} color={color}/>
                  ))}
                </div>
              )}
              {logs.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, color:"rgba(191,184,168,.4)", marginBottom:8 }}>Recent readings</div>
                  {logs.slice(0,8).map((l,i) => {
                    const isBP = l.type==="bp";
                    const st = bioStat(isBP?"systolic":l.type, isBP?l.value.split("/")[0]:l.value);
                    return (
                      <div key={l.ts||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"0.5px solid rgba(201,168,76,.08)" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:st.color, flexShrink:0 }}/>
                        <div style={{ flex:1, fontSize:11, textTransform:"uppercase", letterSpacing:".04em", color:"rgba(191,184,168,.5)" }}>{l.type}</div>
                        <div className="mfx-display" style={{ fontSize:14, color:st.color }}>{l.value}</div>
                        <div style={{ fontSize:10, color:"rgba(191,184,168,.4)" }}>{l.date}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            AI COACH TAB
        ══════════════════════════════════════ */}
        {tab==="coach" && (
          <AICoach profile={profile} riskScore={riskScore} tier={tier}
            habits={HABITS} doneCount={doneCount} logs={logs} streak={streak}/>
        )}

        {/* ══════════════════════════════════════
            WHO DATA TAB
        ══════════════════════════════════════ */}
        {tab==="who" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.entries(WHO_DOMAINS).map(([k,d]) => (
                <button key={k} className={`mfx-tab ${whoKey===k?"active":""}`} onClick={()=>setWhoKey(k)}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
            {(() => {
              const d = WHO_DOMAINS[whoKey];
              return (
                <div className="mfx-card mfx-fade">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div>
                      <div className="mfx-display" style={{ fontSize:18, color:G.gold }}>{d.icon} {d.label}</div>
                      <div style={{ fontSize:10, color:"rgba(191,184,168,.4)", letterSpacing:".06em", marginTop:2 }}>{d.code} · WHO SDG 3.4</div>
                    </div>
                    <div style={{ fontSize:10, padding:"5px 12px", background:"rgba(26,95,168,.15)", color:"#90bde8", borderRadius:20, border:"0.5px solid rgba(26,95,168,.3)", maxWidth:140, textAlign:"center" }}>{d.headline}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                    {d.stats.map((s,i) => (
                      <div key={i} style={{ fontSize:12, lineHeight:1.65, color:"rgba(191,184,168,.75)", borderLeft:`2px solid ${i===0?G.gold:"rgba(201,168,76,.2)"}`, paddingLeft:10 }}>{s}</div>
                    ))}
                  </div>
                  <div className="mfx-card2" style={{ borderColor:"rgba(58,125,68,.4)", background:"rgba(58,125,68,.07)" }}>
                    <div style={{ fontSize:11, color:G.grn, fontWeight:500 }}>✅ Solution Pathway: {d.solve}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:4 }}>
          {[["🥗","Nutrition"],["🏋","Exercise"],["🧘","Stress Hub"]].map(([icon,label]) => (
            <button key={label} className="mfx-btn" style={{ fontSize:11, flexDirection:"column", gap:2, padding:"12px 8px" }}>
              <span>{icon}</span><span style={{ color:"rgba(191,184,168,.6)" }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign:"center", fontSize:9, color:"rgba(191,184,168,.25)", letterSpacing:".12em", paddingTop:4, textTransform:"uppercase" }}>
          ManifiX Elite · WHO SDG 3.4 · Beats Teladoc + Noom · v3.0 Gold
        </div>
      </div>
    </div>
  );
}
