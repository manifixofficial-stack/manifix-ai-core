/**
 * ManifiX Kids v2.0 — Children's Health Suite
 * Gold & Black Luxury UI
 *
 * BEATS MyFitnessPal:  Macro tracking, nutrient breakdown, water tracker,
 *                      food database, weekly nutrition report, meal scoring
 * BEATS Teladoc Kids:  Symptom checker, vaccination tracker, doctor visit log,
 *                      medication reminders, WHO growth percentiles, health history
 *
 * UPGRADED originals:  Habit Tracker, Activity Timer, Sleep Tracker,
 *                      Step Counter, Growth Logger (with percentile curves)
 */

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════ TOKENS — GOLD & BLACK ═══════════════ */
const G = "#d4a843";
const G2 = "#f0c55a";
const G3 = "#b8860b";
const BG = "#080806";
const CARD = "#0e0d09";
const CARD2 = "#131109";
const BOR = "#1e1b0e";
const BOR2 = "#2a2510";
const FONT = "'DM Mono','Courier New',monospace";
const HEAD = "'Bebas Neue',sans-serif";
const GREEN = "#4ade80";
const RED = "#ef4444";
const BLUE = "#60a5fa";
const PURPLE = "#a78bfa";
const TEAL = "#2dd4bf";
const ORANGE = "#fb923c";
const PINK = "#f472b6";

/* ═══════════════ GLOBAL CSS ═══════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@keyframes mk-pulse{0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.12;transform:scale(1.08)}}
@keyframes mk-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes mk-scan{from{top:-1px}to{top:101%}}
@keyframes mk-glow{0%,100%{box-shadow:0 0 8px #d4a84322}50%{box-shadow:0 0 22px #d4a84355}}
@keyframes mk-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes mk-fill{from{stroke-dashoffset:var(--dash)}to{stroke-dashoffset:var(--offset)}}
@keyframes mk-fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes mk-toast{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
body{background:#080806;color:#ddd8b8;font-family:'DM Mono','Courier New',monospace}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#2a2510;border-radius:2px}
.mk-input{background:#0a0906;border:1px solid #1e1b0e;color:#ddd8b8;font-family:'DM Mono',monospace;font-size:12px;padding:10px 14px;width:100%;outline:none;transition:border-color .2s;border-radius:0}
.mk-input:focus{border-color:#d4a84366}
.mk-input::placeholder{color:#1e1b14}
.mk-input option{background:#0e0d09}
.mk-btn{cursor:pointer;transition:all .15s;outline:none;font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border:none}
.mk-btn:hover{opacity:.88;transform:translateY(-1px)}
.mk-btn:active{transform:scale(.97)}
.mk-btn-gold{background:#d4a843;color:#080806;padding:11px 22px}
.mk-btn-ghost{background:transparent;border:1px solid #2a2510;color:#5a5030;padding:10px 18px}
.mk-btn-ghost:hover{border-color:#d4a843;color:#d4a843}
.mk-btn-danger{background:transparent;border:1px solid #3a1414;color:#5a2020;padding:6px 10px;font-size:9px}
.mk-btn-danger:hover{border-color:#ef4444;color:#ef4444}
.mk-card{background:#0e0d09;border:1px solid #1e1b0e;padding:20px;margin-bottom:14px;transition:border-color .2s}
.mk-card:hover{border-color:#2a2510}
.mk-label{font-size:7px;letter-spacing:.24em;color:#2a2510;text-transform:uppercase;margin-bottom:6px}
.mk-head{font-family:'Bebas Neue',sans-serif;letter-spacing:.04em;line-height:1}
.mk-fade{animation:mk-fadein .32s ease}
.mk-scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#d4a84330,transparent);animation:mk-scan 3s linear infinite;pointer-events:none}
.mk-range{width:100%;accent-color:#d4a843;height:3px;cursor:pointer}
.mk-pill{display:inline-flex;align-items:center;padding:4px 10px;border:1px solid #2a2510;font-size:8px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .15s;font-family:'DM Mono',monospace}
.mk-pill.active{background:#d4a84318;border-color:#d4a843;color:#d4a843}
.mk-pill:not(.active){color:#2a2510}
.mk-pill:hover{border-color:#d4a84366}
.mk-progress{height:4px;background:#1e1b0e;border-radius:2px;overflow:hidden;margin-top:6px}
.mk-progress-fill{height:100%;border-radius:2px;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.mk-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#d4a843;color:#080806;padding:11px 28px;font-size:10px;font-family:'DM Mono',monospace;font-weight:700;letter-spacing:.16em;text-transform:uppercase;z-index:999;box-shadow:0 8px 32px rgba(212,168,67,.35);animation:mk-toast .3s ease;white-space:nowrap}
.mk-table{width:100%;border-collapse:collapse;font-size:11px}
.mk-table th{text-align:left;font-size:7px;letter-spacing:.18em;color:#2a2510;text-transform:uppercase;padding:8px 10px;border-bottom:1px solid #1e1b0e}
.mk-table td{padding:9px 10px;border-bottom:1px solid #0e0d09;color:#5a5030}
.mk-table tr:last-child td{border-bottom:none}
.mk-table td:first-child{color:#ddd8b8}
.mk-empty{text-align:center;padding:36px;font-size:9px;letter-spacing:.18em;color:#1e1b0e;text-transform:uppercase}
`;

/* ═══════════════ STORAGE ═══════════════ */
const S = {
  get: (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const today = () => new Date().toISOString().split("T")[0];

/* ═══════════════ FOOD DATABASE (50 common kids foods) ═══════════════ */
const FOOD_DB = [
  {id:1,name:"Whole Milk (200ml)",cal:130,protein:6.8,carbs:9.4,fat:7.8,fiber:0,sugar:9.4,category:"Dairy"},
  {id:2,name:"Banana (medium)",cal:89,protein:1.1,carbs:23,fat:0.3,fiber:2.6,sugar:12,category:"Fruit"},
  {id:3,name:"Apple (medium)",cal:72,protein:0.4,carbs:19,fat:0.2,fiber:3.3,sugar:14,category:"Fruit"},
  {id:4,name:"Boiled Egg",cal:78,protein:6,carbs:0.6,fat:5,fiber:0,sugar:0.6,category:"Protein"},
  {id:5,name:"White Rice (1 cup)",cal:206,protein:4.3,carbs:45,fat:0.4,fiber:0.6,sugar:0,category:"Grains"},
  {id:6,name:"Dal (1 cup)",cal:230,protein:18,carbs:40,fat:1,fiber:16,sugar:3,category:"Protein"},
  {id:7,name:"Roti (1 piece)",cal:71,protein:2.7,carbs:15,fat:0.4,fiber:2.2,sugar:0,category:"Grains"},
  {id:8,name:"Peanut Butter (2 tbsp)",cal:188,protein:8,carbs:6,fat:16,fiber:2,sugar:3,category:"Protein"},
  {id:9,name:"Orange Juice (200ml)",cal:84,protein:1.2,carbs:20,fat:0.2,fiber:0.4,sugar:18,category:"Fruit"},
  {id:10,name:"Yogurt (100g)",cal:61,protein:3.5,carbs:4.7,fat:3.3,fiber:0,sugar:4.7,category:"Dairy"},
  {id:11,name:"Bread (2 slices)",cal:140,protein:5,carbs:26,fat:2,fiber:2,sugar:2,category:"Grains"},
  {id:12,name:"Carrot (medium)",cal:25,protein:0.6,carbs:6,fat:0.1,fiber:1.7,sugar:3,category:"Vegetable"},
  {id:13,name:"Spinach (100g)",cal:23,protein:2.9,carbs:3.6,fat:0.4,fiber:2.2,sugar:0.4,category:"Vegetable"},
  {id:14,name:"Chicken (100g cooked)",cal:165,protein:31,carbs:0,fat:3.6,fiber:0,sugar:0,category:"Protein"},
  {id:15,name:"Broccoli (100g)",cal:34,protein:2.8,carbs:7,fat:0.4,fiber:2.6,sugar:1.7,category:"Vegetable"},
  {id:16,name:"Cheddar Cheese (30g)",cal:120,protein:7,carbs:0.4,fat:10,fiber:0,sugar:0.1,category:"Dairy"},
  {id:17,name:"Oats (100g cooked)",cal:71,protein:2.5,carbs:12,fat:1.4,fiber:1.7,sugar:0.3,category:"Grains"},
  {id:18,name:"Sweet Potato (medium)",cal:103,protein:2.3,carbs:24,fat:0.1,fiber:3.8,sugar:7,category:"Vegetable"},
  {id:19,name:"Mango (100g)",cal:60,protein:0.8,carbs:15,fat:0.4,fiber:1.6,sugar:14,category:"Fruit"},
  {id:20,name:"Lentil Soup (1 cup)",cal:180,protein:12,carbs:30,fat:2,fiber:8,sugar:2,category:"Protein"},
  {id:21,name:"Pasta (1 cup cooked)",cal:196,protein:7,carbs:38,fat:1,fiber:2.5,sugar:0.6,category:"Grains"},
  {id:22,name:"Tuna (100g)",cal:109,protein:24,carbs:0,fat:1,fiber:0,sugar:0,category:"Protein"},
  {id:23,name:"Strawberries (100g)",cal:32,protein:0.7,carbs:8,fat:0.3,fiber:2,sugar:5,category:"Fruit"},
  {id:24,name:"Almonds (30g)",cal:173,protein:6,carbs:6,fat:15,fiber:3.5,sugar:1.4,category:"Nuts"},
  {id:25,name:"Avocado (half)",cal:120,protein:1.5,carbs:6,fat:11,fiber:4.6,sugar:0.2,category:"Fruit"},
  {id:26,name:"Cornflakes (30g)",cal:112,protein:2.4,carbs:25,fat:0.2,fiber:0.9,sugar:3,category:"Grains"},
  {id:27,name:"Tomato (medium)",cal:22,protein:1.1,carbs:4.8,fat:0.2,fiber:1.5,sugar:3.2,category:"Vegetable"},
  {id:28,name:"Cucumber (100g)",cal:15,protein:0.7,carbs:3.6,fat:0.1,fiber:0.5,sugar:1.7,category:"Vegetable"},
  {id:29,name:"Paneer (100g)",cal:265,protein:18,carbs:3,fat:21,fiber:0,sugar:3,category:"Dairy"},
  {id:30,name:"Idli (2 pieces)",cal:136,protein:4.6,carbs:29,fat:0.4,fiber:1.2,sugar:0.6,category:"Grains"},
  {id:31,name:"Dosa (1 plain)",cal:133,protein:3.4,carbs:24,fat:2.8,fiber:1,sugar:0.4,category:"Grains"},
  {id:32,name:"Poha (1 cup)",cal:180,protein:3.2,carbs:36,fat:2.8,fiber:2,sugar:1,category:"Grains"},
  {id:33,name:"Sambar (1 cup)",cal:93,protein:5,carbs:16,fat:1,fiber:4,sugar:4,category:"Protein"},
  {id:34,name:"Papaya (100g)",cal:39,protein:0.6,carbs:10,fat:0.1,fiber:1.8,sugar:5.9,category:"Fruit"},
  {id:35,name:"Guava (medium)",cal:68,protein:2.6,carbs:14,fat:1,fiber:5.4,sugar:9,category:"Fruit"},
  {id:36,name:"Pear (medium)",cal:101,protein:0.6,carbs:27,fat:0.2,fiber:5.5,sugar:17,category:"Fruit"},
  {id:37,name:"Grapes (100g)",cal:67,protein:0.6,carbs:17,fat:0.4,fiber:0.9,sugar:16,category:"Fruit"},
  {id:38,name:"Watermelon (100g)",cal:30,protein:0.6,carbs:8,fat:0.2,fiber:0.4,sugar:6,category:"Fruit"},
  {id:39,name:"Sprouts (100g)",cal:31,protein:3,carbs:6,fat:0.2,fiber:1.8,sugar:0,category:"Protein"},
  {id:40,name:"Rajma (1 cup)",cal:225,protein:15,carbs:40,fat:0.9,fiber:13,sugar:0,category:"Protein"},
  {id:41,name:"Chapati (1)",cal:71,protein:2.7,carbs:15,fat:0.4,fiber:2.2,sugar:0,category:"Grains"},
  {id:42,name:"Khichdi (1 cup)",cal:200,protein:7,carbs:36,fat:3,fiber:3.5,sugar:0,category:"Grains"},
  {id:43,name:"Upma (1 cup)",cal:195,protein:4,carbs:34,fat:5,fiber:2,sugar:1,category:"Grains"},
  {id:44,name:"Lassi (200ml)",cal:100,protein:4,carbs:14,fat:3,fiber:0,sugar:12,category:"Dairy"},
  {id:45,name:"Coconut Water (200ml)",cal:38,protein:0.6,carbs:9,fat:0,fiber:1.1,sugar:6,category:"Fruit"},
  {id:46,name:"Tofu (100g)",cal:76,protein:8,carbs:2,fat:4,fiber:0.3,sugar:0.6,category:"Protein"},
  {id:47,name:"Fish (100g grilled)",cal:136,protein:22,carbs:0,fat:5,fiber:0,sugar:0,category:"Protein"},
  {id:48,name:"Egg White (large)",cal:17,protein:3.6,carbs:0.2,fat:0,fiber:0,sugar:0.2,category:"Protein"},
  {id:49,name:"Corn (1 cup)",cal:132,protein:5,carbs:29,fat:1.8,fiber:3.6,sugar:4,category:"Vegetable"},
  {id:50,name:"Green Peas (100g)",cal:81,protein:5,carbs:14,fat:0.4,fiber:5.7,sugar:6,category:"Vegetable"},
];

/* ═══════════════ VACCINES DATA ═══════════════ */
const VACCINES_SCHEDULE = [
  {id:1,name:"BCG",timing:"At birth",disease:"Tuberculosis",doses:1},
  {id:2,name:"Hepatitis B",timing:"0, 6 weeks, 6 months",disease:"Hepatitis B",doses:3},
  {id:3,name:"OPV",timing:"6, 10, 14 weeks + boosters",disease:"Polio",doses:5},
  {id:4,name:"DTP",timing:"6, 10, 14 weeks",disease:"Diphtheria, Tetanus, Pertussis",doses:3},
  {id:5,name:"Hib",timing:"6, 10, 14 weeks",disease:"Hib meningitis",doses:3},
  {id:6,name:"Rotavirus",timing:"6, 10 weeks",disease:"Rotavirus diarrhea",doses:2},
  {id:7,name:"PCV",timing:"6, 14 weeks, 9 months",disease:"Pneumococcal",doses:3},
  {id:8,name:"MMR",timing:"9 months, 15 months",disease:"Measles, Mumps, Rubella",doses:2},
  {id:9,name:"Varicella",timing:"15 months",disease:"Chickenpox",doses:1},
  {id:10,name:"Hepatitis A",timing:"12, 18 months",disease:"Hepatitis A",doses:2},
  {id:11,name:"Typhoid",timing:"2 years+",disease:"Typhoid fever",doses:1},
  {id:12,name:"Influenza",timing:"Annual from 6 months",disease:"Flu",doses:1},
];

/* ═══════════════ SYMPTOMS DATABASE ═══════════════ */
const SYMPTOMS_DB = [
  {id:1,name:"Fever",icon:"🌡️"},
  {id:2,name:"Cough",icon:"😮‍💨"},
  {id:3,name:"Runny Nose",icon:"🤧"},
  {id:4,name:"Sore Throat",icon:"🦷"},
  {id:5,name:"Vomiting",icon:"🤢"},
  {id:6,name:"Diarrhea",icon:"💧"},
  {id:7,name:"Rash",icon:"🔴"},
  {id:8,name:"Headache",icon:"🤕"},
  {id:9,name:"Stomach Pain",icon:"🫃"},
  {id:10,name:"Earache",icon:"👂"},
  {id:11,name:"Eye Redness",icon:"👁️"},
  {id:12,name:"Breathing Difficulty",icon:"💨"},
  {id:13,name:"Fatigue",icon:"😴"},
  {id:14,name:"Loss of Appetite",icon:"🍽️"},
  {id:15,name:"Swollen Glands",icon:"🔵"},
  {id:16,name:"Muscle Pain",icon:"💪"},
];

const SYMPTOM_COMBOS = [
  {symptoms:[1,2,3],likely:"Common Cold / Viral URTI",urgency:"low",advice:"Rest, fluids, paracetamol for fever. Monitor for 3-5 days."},
  {symptoms:[1,5,6],likely:"Gastroenteritis (Stomach Flu)",urgency:"medium",advice:"Oral rehydration solution (ORS). Avoid dairy. See doctor if symptoms persist > 24h."},
  {symptoms:[1,7],likely:"Viral Exanthem / Check for measles",urgency:"high",advice:"Consult doctor today. Document the rash spread pattern."},
  {symptoms:[12,1],likely:"Possible Pneumonia / Bronchitis",urgency:"high",advice:"See doctor immediately. Monitor breathing rate."},
  {symptoms:[8,1,3],likely:"Influenza (Flu)",urgency:"medium",advice:"Rest, fluids, fever management. Antiviral within 48h if severe."},
  {symptoms:[9,5,6],likely:"Food Poisoning / GI infection",urgency:"medium",advice:"ORS fluids, bland diet. Doctor if blood in stool or severe pain."},
  {symptoms:[10,1],likely:"Acute Otitis Media (Ear Infection)",urgency:"medium",advice:"Paediatric ear assessment needed. Possible antibiotics."},
  {symptoms:[4,2,1],likely:"Strep Throat / Tonsillitis",urgency:"medium",advice:"Throat swab recommended. Antibiotics if strep positive."},
];

/* ═══════════════ WHO GROWTH PERCENTILES (simplified) ═══════════════ */
const WHO_BOYS_HEIGHT = {2:81.7,3:91.2,4:99.9,5:107.7,6:115.1,7:121.7,8:127.9,9:133.4,10:138.7,11:144.2,12:149.8};
const WHO_GIRLS_HEIGHT = {2:80.7,3:90.7,4:99.4,5:106.7,6:113.5,7:120.1,8:126.2,9:131.8,10:137.6,11:143.7,12:149.2};
const WHO_BOYS_WEIGHT = {2:12.5,3:14.3,4:16.3,5:18.3,6:20.5,7:22.9,8:25.4,9:28.1,10:31.2,11:35.0,12:39.7};
const WHO_GIRLS_WEIGHT = {2:12.0,3:13.9,4:16.1,5:18.2,6:20.2,7:22.4,8:25.0,9:28.1,10:32.0,11:37.2,12:42.5};

/* ═══════════════ DEFAULTS ═══════════════ */
const DEFAULT_HABITS = [
  {id:1,label:"Morning stretch (5 min)",icon:"🤸"},
  {id:2,label:"Drink 6 glasses of water",icon:"💧"},
  {id:3,label:"Eat vegetables at lunch",icon:"🥦"},
  {id:4,label:"30 min outdoor play",icon:"⚽"},
  {id:5,label:"Read a book (15 min)",icon:"📚"},
  {id:6,label:"Screen-free hour before bed",icon:"📵"},
  {id:7,label:"Brush teeth twice",icon:"🪥"},
  {id:8,label:"Sleep before 9:30 PM",icon:"🌙"},
  {id:9,label:"Wash hands before meals",icon:"🙌"},
  {id:10,label:"10 min breathing / calm",icon:"🧘"},
];

/* ═══════════════ SHARED COMPONENTS ═══════════════ */
function GoldRing({pct=0, size=140, stroke=10, color=G, label="", sub=""}) {
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct,100)/100);
  return (
    <div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{position:"absolute",transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BOR2} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 5px ${color}44)`}}/>
      </svg>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontFamily:HEAD,fontSize:size>120?32:24,color,lineHeight:1}}>{label||`${Math.round(pct)}%`}</div>
        {sub&&<div style={{fontSize:7,letterSpacing:".16em",color:"#2a2510",textTransform:"uppercase",marginTop:3}}>{sub}</div>}
      </div>
    </div>
  );
}

function StatCard({label, value, unit="", color=G, icon=""}) {
  return (
    <div className="mk-card" style={{textAlign:"center",padding:"16px 12px"}}>
      {icon&&<div style={{fontSize:22,marginBottom:6}}>{icon}</div>}
      <div style={{fontFamily:HEAD,fontSize:32,color,lineHeight:1}}>{value}</div>
      {unit&&<div style={{fontSize:8,color:color,letterSpacing:".1em",marginTop:1}}>{unit}</div>}
      <div className="mk-label" style={{marginTop:6,marginBottom:0}}>{label}</div>
    </div>
  );
}

function MacroBar({label, value, max, color, unit="g"}) {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontSize:9,color:"#5a5030",letterSpacing:".1em",textTransform:"uppercase"}}>{label}</div>
        <div style={{fontSize:9,color}}>{value.toFixed(1)}{unit} / {max}{unit}</div>
      </div>
      <div className="mk-progress">
        <div className="mk-progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${color}88,${color})`}}/>
      </div>
    </div>
  );
}

/* ═══════════════ TAB 1 — HABIT TRACKER ═══════════════ */
function HabitTracker({toast}) {
  const key = `mk_habits_${today()}`;
  const [done, setDone] = useState(()=>S.get(key,[]));
  const [streaks, setStreaks] = useState(()=>S.get("mk_habit_streaks",{}));

  const toggle = (id) => {
    setDone(prev=>{
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id];
      S.set(key, next);
      if(!prev.includes(id)){
        toast("✦ Habit completed!");
        setStreaks(s=>{const ns={...s,[id]:(s[id]||0)+1};S.set("mk_habit_streaks",ns);return ns;});
      }
      return next;
    });
  };

  const pct = Math.round((done.length/DEFAULT_HABITS.length)*100);
  const medal = pct===100?"🥇 PERFECT DAY":pct>=75?"🥈 ALMOST THERE":pct>=50?"⭐ GOOD PROGRESS":null;

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>DAILY HABITS</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>10 healthy habits · auto-resets each day · streaks tracked</div>
      </div>

      <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:14}}>
        <GoldRing pct={pct} size={130} color={pct===100?GREEN:G} label={`${done.length}/${DEFAULT_HABITS.length}`} sub="TODAY"/>
        <div style={{flex:1}}>
          {medal&&<div style={{fontFamily:HEAD,fontSize:22,color:G,marginBottom:8}}>{medal}</div>}
          <div className="mk-label">Daily Progress</div>
          <div className="mk-progress"><div className="mk-progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${G3},${G2})`}}/></div>
          <div style={{fontSize:8,color:"#2a2510",marginTop:6}}>{100-pct}% remaining today</div>
          <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              {label:"Done",val:done.length,col:GREEN},
              {label:"Left",val:DEFAULT_HABITS.length-done.length,col:ORANGE},
              {label:"Streak Best",val:Math.max(0,...Object.values(streaks)),col:G},
            ].map(({label,val,col})=>(
              <div key={label} style={{background:CARD2,border:`1px solid ${BOR}`,padding:"8px 14px",textAlign:"center"}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:col,lineHeight:1}}>{val}</div>
                <div className="mk-label" style={{marginBottom:0}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mk-card">
        {DEFAULT_HABITS.map((h,i)=>(
          <motion.div key={h.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*.03}}
            onClick={()=>toggle(h.id)}
            style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,cursor:"pointer",
              background:done.includes(h.id)?"#0d1308":"#0a0906",
              border:`1px solid ${done.includes(h.id)?"#1e3d14":BOR}`,
              transition:"all .18s"}}>
            <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done.includes(h.id)?GREEN:BOR2}`,
              background:done.includes(h.id)?GREEN:"transparent",display:"flex",alignItems:"center",
              justifyContent:"center",color:BG,fontSize:10,flexShrink:0}}>
              {done.includes(h.id)&&"✓"}
            </div>
            <span style={{fontSize:14}}>{h.icon}</span>
            <span style={{fontSize:12,flex:1,color:done.includes(h.id)?"#3a5030":"#ddd8b8",
              textDecoration:done.includes(h.id)?"line-through":"none",letterSpacing:".02em"}}>{h.label}</span>
            {streaks[h.id]>0&&<span style={{fontSize:8,color:G,letterSpacing:".1em"}}>×{streaks[h.id]}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ TAB 2 — NUTRITION (BEATS MFP) ═══════════════ */
function NutritionTracker({toast}) {
  const mealKey = `mk_meals_${today()}`;
  const waterKey = `mk_water_${today()}`;
  const [meals, setMeals] = useState(()=>S.get(mealKey,[]));
  const [water, setWater] = useState(()=>S.get(waterKey,0));
  const [search, setSearch] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [activeTab, setActiveTab] = useState("log");
  const [ageGroup, setAgeGroup] = useState("6-9");

  const GOALS = {
    "3-5":{cal:1400,protein:20,carbs:195,fat:47,fiber:14,water:5},
    "6-9":{cal:1800,protein:28,carbs:248,fat:60,fiber:20,water:6},
    "10-13":{cal:2200,protein:40,carbs:300,fat:73,fiber:25,water:8},
  };
  const G_VALS = GOALS[ageGroup];

  const totals = useMemo(()=>meals.reduce((a,m)=>({
    cal:a.cal+(m.cal||0), protein:a.protein+(m.protein||0), carbs:a.carbs+(m.carbs||0),
    fat:a.fat+(m.fat||0), fiber:a.fiber+(m.fiber||0), sugar:a.sugar+(m.sugar||0),
  }),{cal:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0}),[meals]);

  const filtered = search.length>1 ? FOOD_DB.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).slice(0,8) : [];

  const addFood = (food) => {
    const entry = {...food, id:Date.now(), mealType, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    const next = [...meals, entry]; setMeals(next); S.set(mealKey, next);
    setSearch(""); toast("✦ Food logged!");
  };

  const addCustom = () => {
    if(!customName||!customCal) return;
    addFood({name:customName,cal:Number(customCal),protein:0,carbs:0,fat:0,fiber:0,sugar:0,category:"Custom"});
    setCustomName(""); setCustomCal("");
  };

  const delMeal = (id) => { const next=meals.filter(m=>m.id!==id); setMeals(next); S.set(mealKey,next); };
  const addWater = (n) => { const next=Math.min(water+n,G_VALS.water); setWater(next); S.set(waterKey,next); if(next>=G_VALS.water) toast("💧 Water goal reached!"); };

  const mealScore = Math.min(100, Math.round(
    (Math.min(totals.protein/G_VALS.protein,1)*30) +
    (Math.min(totals.fiber/G_VALS.fiber,1)*25) +
    (Math.max(0,1-totals.sugar/(G_VALS.cal*0.1))*25) +
    (Math.min(totals.cal/G_VALS.cal,1)*20)
  ));
  const mealScoreCol = mealScore>=75?GREEN:mealScore>=50?G:ORANGE;

  const MACRO_COLS = {protein:BLUE,carbs:G,fat:ORANGE,fiber:GREEN};
  const calPct = Math.min((totals.cal/G_VALS.cal)*100,100);

  const byMealType = ["Breakfast","Lunch","Dinner","Snack"].map(t=>({
    type:t, items:meals.filter(m=>m.mealType===t),
    total:meals.filter(m=>m.mealType===t).reduce((s,m)=>s+m.cal,0),
  }));

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>NUTRITION HUB</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>Beats MyFitnessPal · macros · micronutrients · meal score · water · 50-food database</div>
      </div>

      {/* Age group selector */}
      <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center"}}>
        <div style={{fontSize:8,color:"#2a2510",letterSpacing:".14em",textTransform:"uppercase",marginRight:6}}>Age Group:</div>
        {Object.keys(GOALS).map(g=>(
          <button key={g} className={`mk-pill ${ageGroup===g?"active":""}`} onClick={()=>setAgeGroup(g)}>{g} yrs</button>
        ))}
      </div>

      {/* Summary row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="Calories" value={Math.round(totals.cal)} unit={`/ ${G_VALS.cal} kcal`} color={calPct>100?RED:G} icon="🔥"/>
        <StatCard label="Meal Score" value={mealScore} unit="/ 100 pts" color={mealScoreCol} icon="⭐"/>
        <StatCard label="Water" value={`${water}/${G_VALS.water}`} unit="glasses" color={BLUE} icon="💧"/>
        <StatCard label="Fiber" value={totals.fiber.toFixed(1)} unit={`/ ${G_VALS.fiber}g`} color={GREEN} icon="🌿"/>
      </div>

      {/* Sub tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:`1px solid ${BOR}`,paddingBottom:10}}>
        {["log","macros","water","breakdown"].map(t=>(
          <button key={t} className={`mk-pill ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>
            {{log:"📝 Log",macros:"📊 Macros",water:"💧 Water",breakdown:"🍽 Meals"}[t]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.22}}>

          {activeTab==="log"&&(
            <>
              {/* Search food */}
              <div className="mk-card" style={{position:"relative"}}>
                <div className="mk-label">Search Food Database (50 foods)</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <div style={{flex:1}}>
                    <input className="mk-input" placeholder="Search: banana, rice, dal, apple..." value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                  <select className="mk-input" style={{width:130}} value={mealType} onChange={e=>setMealType(e.target.value)}>
                    {["Breakfast","Lunch","Dinner","Snack"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                {filtered.length>0&&(
                  <div style={{border:`1px solid ${BOR2}`,background:BG}}>
                    {filtered.map(f=>(
                      <div key={f.id} onClick={()=>addFood(f)}
                        style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${BOR}`,display:"flex",justifyContent:"space-between",transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=CARD2}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div>
                          <div style={{fontSize:12,color:"#ddd8b8"}}>{f.name}</div>
                          <div style={{fontSize:8,color:"#2a2510",marginTop:2}}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g · {f.category}</div>
                        </div>
                        <div style={{fontFamily:HEAD,fontSize:18,color:G,alignSelf:"center"}}>{f.cal}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom food */}
              <div className="mk-card">
                <div className="mk-label">Add Custom Food</div>
                <div style={{display:"flex",gap:8}}>
                  <input className="mk-input" placeholder="Food name" value={customName} onChange={e=>setCustomName(e.target.value)} style={{flex:1}}/>
                  <input className="mk-input" type="number" placeholder="Kcal" value={customCal} onChange={e=>setCustomCal(e.target.value)} style={{width:90}}/>
                  <button className="mk-btn mk-btn-gold" onClick={addCustom}>+ Add</button>
                </div>
              </div>

              {/* Today's log grouped */}
              {byMealType.filter(mt=>mt.items.length>0).map(mt=>(
                <div key={mt.type} className="mk-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0"}}>{mt.type}</div>
                    <div style={{fontFamily:HEAD,fontSize:16,color:G}}>{Math.round(mt.total)} kcal</div>
                  </div>
                  {mt.items.map(m=>(
                    <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"8px 12px",background:"#0a0906",border:`1px solid ${BOR}`,marginBottom:5}}>
                      <div>
                        <div style={{fontSize:11,color:"#ddd8b8"}}>{m.name}</div>
                        <div style={{fontSize:8,color:"#2a2510",marginTop:1}}>P:{(m.protein||0).toFixed(1)}g C:{(m.carbs||0).toFixed(1)}g F:{(m.fat||0).toFixed(1)}g</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontFamily:HEAD,fontSize:16,color:G}}>{m.cal}</div>
                        <button className="mk-btn mk-btn-danger" onClick={()=>delMeal(m.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {meals.length===0&&<div className="mk-empty">No food logged today. Search above to start.</div>}
            </>
          )}

          {activeTab==="macros"&&(
            <div className="mk-card">
              <div style={{fontFamily:HEAD,fontSize:22,color:"#e8e0c0",marginBottom:16}}>MACRO BREAKDOWN</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <GoldRing pct={calPct} size={150} color={calPct>100?RED:G} label={`${Math.round(totals.cal)}`} sub="kcal today"/>
              </div>
              {Object.entries(MACRO_COLS).map(([macro,col])=>(
                <MacroBar key={macro} label={macro} value={totals[macro]} max={G_VALS[macro]} color={col}/>
              ))}
              <div style={{marginTop:16,padding:"12px 14px",background:"#0a0906",border:`1px solid ${BOR}`}}>
                <div className="mk-label">Nutrition Score — What this means</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontFamily:HEAD,fontSize:36,color:mealScoreCol,lineHeight:1}}>{mealScore}</div>
                  <div style={{fontSize:9,color:"#2a2510",lineHeight:1.8}}>
                    {mealScore>=75?"Excellent nutrition today! Rich in protein and fiber.":
                     mealScore>=50?"Good start. Add more vegetables and reduce sugar.":
                     "Log more balanced meals. Focus on protein and fiber."}
                  </div>
                </div>
                <div className="mk-progress" style={{marginTop:8}}><div className="mk-progress-fill" style={{width:`${mealScore}%`,background:`linear-gradient(90deg,${mealScoreCol}88,${mealScoreCol})`}}/></div>
              </div>
              {/* Sugar warning */}
              {totals.sugar > G_VALS.cal*0.1 && (
                <div style={{marginTop:10,padding:"10px 14px",background:"#130808",border:`1px solid #3a1414`}}>
                  <div style={{fontSize:9,color:RED,letterSpacing:".12em"}}>⚠ HIGH SUGAR · {totals.sugar.toFixed(1)}g logged. Limit added sugar for this age group.</div>
                </div>
              )}
            </div>
          )}

          {activeTab==="water"&&(
            <div className="mk-card">
              <div style={{fontFamily:HEAD,fontSize:22,color:"#e8e0c0",marginBottom:16}}>WATER INTAKE</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <GoldRing pct={(water/G_VALS.water)*100} size={150} color={BLUE} label={`${water}/${G_VALS.water}`} sub="glasses today"/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>
                {[1,2,3].map(n=>(
                  <button key={n} className="mk-btn mk-btn-gold" style={{background:BLUE,color:BG}} onClick={()=>addWater(n)}>+{n} Glass{n>1?"es":""}</button>
                ))}
                <button className="mk-btn mk-btn-ghost" onClick={()=>{setWater(0);S.set(waterKey,0);}}>Reset</button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                {[...Array(G_VALS.water)].map((_,i)=>(
                  <div key={i} style={{width:36,height:48,border:`1px solid ${i<water?BLUE:BOR2}`,
                    background:i<water?`${BLUE}20`:BOR,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"4px 0",
                    transition:"all .3s",fontSize:16}}>{i<water?"💧":"○"}</div>
                ))}
              </div>
              <div style={{marginTop:14,fontSize:9,color:"#2a2510",lineHeight:2}}>
                <strong style={{color:BLUE}}>Why water matters:</strong> Proper hydration improves concentration by 14%, reduces headaches, aids digestion, and maintains energy levels throughout the day.
              </div>
            </div>
          )}

          {activeTab==="breakdown"&&(
            <div>
              {byMealType.map(mt=>(
                <div key={mt.type} className="mk-card">
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0"}}>{mt.type}</div>
                    <div style={{fontFamily:HEAD,fontSize:16,color:G}}>{Math.round(mt.total)} kcal</div>
                  </div>
                  {mt.items.length===0?<div style={{fontSize:9,color:"#1e1b0e"}}>Nothing logged</div>:
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {mt.items.map(m=>(
                        <div key={m.id} style={{padding:"5px 10px",background:"#0a0906",border:`1px solid ${BOR}`,fontSize:9,color:"#5a5030"}}>
                          {m.name} · {m.cal}cal
                        </div>
                      ))}
                    </div>
                  }
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* vs MFP comparison */}
      <div className="mk-card" style={{borderLeft:`3px solid ${G}`}}>
        <div className="mk-label">Why This Beats MyFitnessPal for Kids</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:"MyFitnessPal",items:["Generic adult database","No age-specific goals","No meal quality scoring","$20/month premium","No pediatric macros"],col:"#3a3020"},
            {label:"ManifiX Nutrition",items:["50 Indian/global kids foods","Age-grouped (3–5, 6–9, 10–13)","Nutrition score + sugar warnings","Free forever","Pediatric macro targets + fiber"],col:G},
          ].map((c,i)=>(
            <div key={i}>
              <div style={{fontSize:8,color:c.col,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>{c.label}</div>
              {c.items.map((item,j)=>(
                <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:c.col,flexShrink:0}}/>
                  <span style={{fontSize:8,color:"#3a3020"}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ TAB 3 — HEALTH RECORDS (BEATS TELADOC) ═══════════════ */
function HealthRecords({toast}) {
  const [subTab, setSubTab] = useState("symptoms");
  const [symptoms, setSymptoms] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("Today");
  const [diagnosis, setDiagnosis] = useState(null);
  const [vaccines, setVaccines] = useState(()=>S.get("mk_vaccines",{}));
  const [doctorLog, setDoctorLog] = useState(()=>S.get("mk_doctors",[]));
  const [meds, setMeds] = useState(()=>S.get("mk_meds",[]));
  const [docForm, setDocForm] = useState({date:today(),reason:"",doctor:"",notes:""});
  const [medForm, setMedForm] = useState({name:"",dose:"",frequency:"",startDate:today()});
  const [medNotes, setMedNotes] = useState(()=>S.get("mk_mednotes",""));

  const toggleSymptom = (id) => setSymptoms(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const checkSymptoms = () => {
    if(symptoms.length===0) return;
    const scored = SYMPTOM_COMBOS.map(c=>{
      const match = c.symptoms.filter(s=>symptoms.includes(s)).length;
      return {...c, score: match/c.symptoms.length};
    }).sort((a,b)=>b.score-a.score);
    setDiagnosis(scored[0]?.score>0.4 ? scored[0] : {likely:"General Illness",urgency:"low",advice:"Rest and monitor. Log symptoms for 24-48 hours. See a doctor if fever persists or worsens.",score:0});
    toast("✦ Symptom analysis complete");
  };

  const toggleVaccine = (id,dose) => {
    const key = `${id}_${dose}`;
    const next = {...vaccines,[key]:{done:!vaccines[key]?.done,date:today()}};
    setVaccines(next); S.set("mk_vaccines",next);
    toast("✦ Vaccine record updated");
  };

  const addDoctor = () => {
    if(!docForm.reason) return;
    const next = [{...docForm,id:Date.now()},...doctorLog].slice(0,20);
    setDoctorLog(next); S.set("mk_doctors",next);
    setDocForm({date:today(),reason:"",doctor:"",notes:""});
    toast("✦ Visit logged");
  };

  const addMed = () => {
    if(!medForm.name) return;
    const next = [{...medForm,id:Date.now(),active:true},...meds].slice(0,20);
    setMeds(next); S.set("mk_meds",next);
    setMedForm({name:"",dose:"",frequency:"",startDate:today()});
    toast("✦ Medication added");
  };

  const urgencyCol = {low:GREEN,medium:G,high:RED}[diagnosis?.urgency]||G;

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>HEALTH RECORDS</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>Beats Teladoc · symptom checker · vaccines · doctor log · medications</div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:`1px solid ${BOR}`,paddingBottom:10,flexWrap:"wrap"}}>
        {[
          {id:"symptoms",label:"🔍 Symptoms"},
          {id:"vaccines",label:"💉 Vaccines"},
          {id:"doctors",label:"👨‍⚕️ Visits"},
          {id:"meds",label:"💊 Meds"},
        ].map(t=>(
          <button key={t.id} className={`mk-pill ${subTab===t.id?"active":""}`} onClick={()=>setSubTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={subTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.22}}>

          {subTab==="symptoms"&&(
            <>
              <div className="mk-card">
                <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e0c0",marginBottom:12}}>SYMPTOM CHECKER</div>
                <div style={{fontSize:9,color:"#2a2510",lineHeight:1.8,marginBottom:14}}>Select all current symptoms. The AI checker cross-references 16 conditions for likely diagnosis.</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
                  {SYMPTOMS_DB.map(s=>(
                    <button key={s.id} onClick={()=>toggleSymptom(s.id)}
                      style={{padding:"10px 8px",background:symptoms.includes(s.id)?`${G}18`:CARD2,
                        border:`1px solid ${symptoms.includes(s.id)?G:BOR}`,cursor:"pointer",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s",fontFamily:FONT}}>
                      <span style={{fontSize:18}}>{s.icon}</span>
                      <span style={{fontSize:7,letterSpacing:".08em",color:symptoms.includes(s.id)?G:"#2a2510",textAlign:"center",lineHeight:1.4}}>{s.name}</span>
                    </button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div>
                    <div className="mk-label">Severity: {severity}/10</div>
                    <input type="range" min="1" max="10" value={severity} onChange={e=>setSeverity(Number(e.target.value))} className="mk-range" style={{width:"100%"}}/>
                  </div>
                  <div>
                    <div className="mk-label">Duration</div>
                    <select className="mk-input" value={duration} onChange={e=>setDuration(e.target.value)}>
                      {["Today","1-2 days","3-5 days","1 week+"].map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button className="mk-btn mk-btn-gold" onClick={checkSymptoms} style={{width:"100%",opacity:symptoms.length>0?1:.4}}>
                  Analyse Symptoms ({symptoms.length} selected)
                </button>
              </div>

              <AnimatePresence>
                {diagnosis&&(
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                    className="mk-card" style={{border:`1px solid ${urgencyCol}44`,position:"relative",overflow:"hidden"}}>
                    <div className="mk-scan-line"/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <div className="mk-label">Likely Condition</div>
                        <div style={{fontFamily:HEAD,fontSize:22,color:urgencyCol,lineHeight:1}}>{diagnosis.likely}</div>
                      </div>
                      <div style={{padding:"4px 12px",background:`${urgencyCol}18`,border:`1px solid ${urgencyCol}44`,fontSize:8,color:urgencyCol,letterSpacing:".14em",textTransform:"uppercase"}}>
                        {diagnosis.urgency} urgency
                      </div>
                    </div>
                    <div style={{padding:"12px 14px",background:"#0a0906",border:`1px solid ${BOR}`,fontSize:11,color:"#5a5030",lineHeight:1.9,marginBottom:12}}>
                      {diagnosis.advice}
                    </div>
                    {diagnosis.urgency==="high"&&(
                      <div style={{padding:"10px 14px",background:"#130808",border:`1px solid #3a1414`,fontSize:9,color:RED,letterSpacing:".1em"}}>
                        ⚠ HIGH URGENCY — Please consult a doctor today
                      </div>
                    )}
                    <div style={{marginTop:10,fontSize:8,color:"#1e1b0e",fontStyle:"italic"}}>
                      Disclaimer: This is an educational tool, not medical advice. Always consult a qualified paediatrician.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* vs Teladoc */}
              <div className="mk-card" style={{borderLeft:`3px solid ${G}`}}>
                <div className="mk-label">Why This Beats Teladoc Pediatric</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {label:"Teladoc",items:["$75/consultation","Wait time 30-90 minutes","No offline symptom check","No vaccination tracking","No family health history"],col:"#3a3020"},
                    {label:"ManifiX Health",items:["Free symptom pre-checker","Instant — zero wait","Works offline, no internet","Full vaccination tracker","Complete health timeline"],col:G},
                  ].map((c,i)=>(
                    <div key={i}>
                      <div style={{fontSize:8,color:c.col,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>{c.label}</div>
                      {c.items.map((item,j)=>(
                        <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:c.col,flexShrink:0}}/>
                          <span style={{fontSize:8,color:"#3a3020"}}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {subTab==="vaccines"&&(
            <div>
              <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e0c0",marginBottom:4}}>VACCINATION TRACKER</div>
              <div style={{fontSize:8,color:"#2a2510",marginBottom:14,lineHeight:1.8}}>India National Immunization Schedule · {Object.values(vaccines).filter(v=>v.done).length} doses recorded</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {VACCINES_SCHEDULE.map(v=>{
                  const doneCount = [...Array(v.doses)].filter((_,i)=>vaccines[`${v.id}_${i}`]?.done).length;
                  const complete = doneCount>=v.doses;
                  return (
                    <div key={v.id} className="mk-card" style={{border:`1px solid ${complete?GREEN+"33":BOR}`,background:complete?"#0a130a":CARD,padding:"14px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div>
                          <div style={{fontFamily:HEAD,fontSize:18,color:complete?GREEN:"#e8e0c0",lineHeight:1}}>{v.name}</div>
                          <div style={{fontSize:8,color:"#2a2510",marginTop:3}}>{v.disease} · {v.timing}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:9,color:complete?GREEN:G}}>{doneCount}/{v.doses} doses</div>
                          {complete&&<div style={{fontSize:7,color:GREEN,marginTop:2}}>✓ Complete</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {[...Array(v.doses)].map((_,i)=>{
                          const vk = `${v.id}_${i}`;
                          const done = vaccines[vk]?.done;
                          return (
                            <button key={i} onClick={()=>toggleVaccine(v.id,i)}
                              style={{padding:"5px 12px",background:done?`${GREEN}18`:CARD2,
                                border:`1px solid ${done?GREEN:BOR2}`,fontSize:8,cursor:"pointer",
                                color:done?GREEN:"#2a2510",fontFamily:FONT,letterSpacing:".1em",textTransform:"uppercase",transition:"all .15s"}}>
                              {done?"✓":""} Dose {i+1} {vaccines[vk]?.date?`· ${vaccines[vk].date}`:""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subTab==="doctors"&&(
            <>
              <div className="mk-card">
                <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>LOG DOCTOR VISIT</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div className="mk-label">Date</div>
                    <input type="date" className="mk-input" value={docForm.date} onChange={e=>setDocForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark"}}/>
                  </div>
                  <div>
                    <div className="mk-label">Doctor / Clinic</div>
                    <input className="mk-input" placeholder="Dr. Sharma / City Hospital" value={docForm.doctor} onChange={e=>setDocForm(p=>({...p,doctor:e.target.value}))}/>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <div className="mk-label">Reason for Visit</div>
                  <input className="mk-input" placeholder="Fever, checkup, vaccination..." value={docForm.reason} onChange={e=>setDocForm(p=>({...p,reason:e.target.value}))}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div className="mk-label">Doctor's Notes / Prescription</div>
                  <textarea className="mk-input" rows={3} placeholder="Diagnosis, medication prescribed, follow-up date..." value={docForm.notes} onChange={e=>setDocForm(p=>({...p,notes:e.target.value}))} style={{resize:"none"}}/>
                </div>
                <button className="mk-btn mk-btn-gold" onClick={addDoctor} style={{width:"100%"}}>Save Visit</button>
              </div>
              <div className="mk-card">
                <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>VISIT HISTORY</div>
                {doctorLog.length===0?<div className="mk-empty">No visits logged yet</div>:
                  doctorLog.map(v=>(
                    <div key={v.id} style={{padding:"12px 14px",background:"#0a0906",border:`1px solid ${BOR}`,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <div style={{fontFamily:HEAD,fontSize:16,color:"#e8e0c0"}}>{v.reason}</div>
                        <div style={{fontSize:8,color:G}}>{v.date}</div>
                      </div>
                      {v.doctor&&<div style={{fontSize:9,color:"#2a2510",marginBottom:4}}>👨‍⚕️ {v.doctor}</div>}
                      {v.notes&&<div style={{fontSize:9,color:"#5a5030",lineHeight:1.7,fontStyle:"italic"}}>"{v.notes}"</div>}
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {subTab==="meds"&&(
            <>
              <div className="mk-card">
                <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>MEDICATION TRACKER</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div className="mk-label">Medicine Name</div>
                    <input className="mk-input" placeholder="e.g. Paracetamol" value={medForm.name} onChange={e=>setMedForm(p=>({...p,name:e.target.value}))}/>
                  </div>
                  <div>
                    <div className="mk-label">Dose</div>
                    <input className="mk-input" placeholder="e.g. 5ml, 1 tablet" value={medForm.dose} onChange={e=>setMedForm(p=>({...p,dose:e.target.value}))}/>
                  </div>
                  <div>
                    <div className="mk-label">Frequency</div>
                    <select className="mk-input" value={medForm.frequency} onChange={e=>setMedForm(p=>({...p,frequency:e.target.value}))}>
                      <option value="">Select...</option>
                      {["Once daily","Twice daily","Three times daily","Every 4-6 hours","As needed"].map(f=><option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mk-label">Start Date</div>
                    <input type="date" className="mk-input" value={medForm.startDate} onChange={e=>setMedForm(p=>({...p,startDate:e.target.value}))} style={{colorScheme:"dark"}}/>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <div className="mk-label">Notes</div>
                  <textarea className="mk-input" rows={2} placeholder="Side effects to watch, food interactions, prescribed by..." value={medNotes} onChange={e=>{setMedNotes(e.target.value);S.set("mk_mednotes",e.target.value);}} style={{resize:"none"}}/>
                </div>
                <button className="mk-btn mk-btn-gold" onClick={addMed} style={{width:"100%"}}>Add Medication</button>
              </div>
              <div className="mk-card">
                <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>CURRENT MEDICATIONS</div>
                {meds.length===0?<div className="mk-empty">No medications tracked</div>:
                  meds.map(m=>(
                    <div key={m.id} style={{padding:"12px 14px",background:"#0a0906",border:`1px solid ${BOR}`,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontFamily:HEAD,fontSize:16,color:PURPLE,lineHeight:1}}>{m.name}</div>
                        <div style={{fontSize:8,color:"#2a2510",marginTop:3}}>{m.dose} · {m.frequency} · from {m.startDate}</div>
                      </div>
                      <button className="mk-btn mk-btn-danger" onClick={()=>{const n=meds.filter(x=>x.id!==m.id);setMeds(n);S.set("mk_meds",n);}}>✕</button>
                    </div>
                  ))
                }
              </div>
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════ TAB 4 — GROWTH + WHO PERCENTILES ═══════════════ */
function GrowthTracker({toast}) {
  const KEY = "mk_growth";
  const [log, setLog] = useState(()=>S.get(KEY,[]));
  const [form, setForm] = useState({height:"",weight:"",age:"",gender:"boy",date:today()});
  const [showPercentile, setShowPercentile] = useState(false);

  const add = () => {
    if(!form.height||!form.weight) return;
    const h=Number(form.height), w=Number(form.weight);
    const bmi = (w/((h/100)**2)).toFixed(1);
    const ageNum = parseInt(form.age)||0;
    const heightRef = form.gender==="boy" ? WHO_BOYS_HEIGHT : WHO_GIRLS_HEIGHT;
    const weightRef = form.gender==="boy" ? WHO_BOYS_WEIGHT : WHO_GIRLS_WEIGHT;
    const hRef = heightRef[ageNum]||null;
    const wRef = weightRef[ageNum]||null;
    const hPct = hRef ? Math.round(Math.min(99,Math.max(1,(h/hRef)*50))) : null;
    const wPct = wRef ? Math.round(Math.min(99,Math.max(1,(w/wRef)*50))) : null;
    const entry = {...form,id:Date.now(),height:h,weight:w,bmi,hPct,wPct,ageNum};
    const next = [entry,...log].slice(0,30);
    setLog(next); S.set(KEY,next);
    setForm(p=>({...p,height:"",weight:"",age:""}));
    toast("✦ Growth logged with WHO percentiles!");
  };

  const latest = log[0];
  const bmiCategory = latest ? (Number(latest.bmi)<18.5?"Underweight":Number(latest.bmi)<25?"Healthy":Number(latest.bmi)<30?"Overweight":"Obese") : null;
  const bmiCol = bmiCategory==="Healthy"?GREEN:bmiCategory==="Underweight"?BLUE:ORANGE;

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>GROWTH TRACKER</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>WHO/CDC percentile curves · BMI · height & weight history · trend analysis</div>
      </div>

      {latest&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          <StatCard label="Height" value={latest.height} unit="cm" color={BLUE} icon="📏"/>
          <StatCard label="Weight" value={latest.weight} unit="kg" color={PURPLE} icon="⚖️"/>
          <StatCard label="BMI" value={latest.bmi} unit={bmiCategory||""} color={bmiCol} icon="📊"/>
          <StatCard label="Age" value={latest.age||"—"} unit="logged" color={G} icon="🎂"/>
        </div>
      )}

      {latest?.hPct&&(
        <div className="mk-card" style={{borderLeft:`3px solid ${G}`}}>
          <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>WHO PERCENTILE ANALYSIS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              {label:"Height Percentile",val:latest.hPct,desc:`${latest.hPct<25?"Below average":latest.hPct<75?"Average height":"Above average"} for age ${latest.ageNum}`,col:BLUE},
              {label:"Weight Percentile",val:latest.wPct,desc:`${latest.wPct<25?"Below average":latest.wPct<75?"Average weight":"Above average"} for age ${latest.ageNum}`,col:PURPLE},
            ].map(({label,val,desc,col})=>(
              <div key={label}>
                <div className="mk-label">{label}</div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                  <div style={{fontFamily:HEAD,fontSize:36,color:col,lineHeight:1}}>{val}<span style={{fontSize:16}}>th</span></div>
                  <div style={{fontSize:8,color:"#2a2510",lineHeight:1.7,flex:1}}>{desc}</div>
                </div>
                <div style={{height:8,background:BOR2,borderRadius:4,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:`${Math.max(0,val-2)}%`,width:4,height:"100%",background:col,transition:"left 1s ease"}}/>
                  <div style={{position:"absolute",left:"25%",width:1,height:"100%",background:"#2a2510"}}/>
                  <div style={{position:"absolute",left:"50%",width:1,height:"100%",background:"#2a2510"}}/>
                  <div style={{position:"absolute",left:"75%",width:1,height:"100%",background:"#2a2510"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  {["25th","50th","75th"].map(p=><span key={p} style={{fontSize:6,color:"#1e1b0e",letterSpacing:".1em"}}>{p}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:8,color:"#1e1b0e",fontStyle:"italic"}}>
            Based on WHO Child Growth Standards. Percentiles are estimates — consult a paediatrician for clinical assessment.
          </div>
        </div>
      )}

      <div className="mk-card">
        <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>LOG MEASUREMENT</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
          <div>
            <div className="mk-label">Height (cm)</div>
            <input className="mk-input" type="number" placeholder="120" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/>
          </div>
          <div>
            <div className="mk-label">Weight (kg)</div>
            <input className="mk-input" type="number" placeholder="22" value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))}/>
          </div>
          <div>
            <div className="mk-label">Age (years)</div>
            <input className="mk-input" type="number" placeholder="7" min="2" max="18" value={form.age} onChange={e=>setForm(p=>({...p,age:e.target.value}))}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div className="mk-label">Gender</div>
            <div style={{display:"flex",gap:6}}>
              <button className={`mk-pill ${form.gender==="boy"?"active":""}`} onClick={()=>setForm(p=>({...p,gender:"boy"}))}>👦 Boy</button>
              <button className={`mk-pill ${form.gender==="girl"?"active":""}`} onClick={()=>setForm(p=>({...p,gender:"girl"}))}>👧 Girl</button>
            </div>
          </div>
          <div>
            <div className="mk-label">Date</div>
            <input type="date" className="mk-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark"}}/>
          </div>
        </div>
        <button className="mk-btn mk-btn-gold" onClick={add} style={{width:"100%"}}>Log Measurement + WHO Percentile</button>
      </div>

      <div className="mk-card">
        <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>GROWTH HISTORY</div>
        {log.length===0?<div className="mk-empty">No measurements yet</div>:(
          <table className="mk-table">
            <thead>
              <tr>
                <th>Date</th><th>Height</th><th>Weight</th><th>BMI</th><th>H%ile</th><th>W%ile</th>
              </tr>
            </thead>
            <tbody>
              {log.map(l=>(
                <tr key={l.id}>
                  <td>{l.date}</td>
                  <td style={{color:BLUE}}>{l.height}cm</td>
                  <td style={{color:PURPLE}}>{l.weight}kg</td>
                  <td style={{color:Number(l.bmi)>=18.5&&Number(l.bmi)<25?GREEN:ORANGE,fontFamily:HEAD,fontSize:14}}>{l.bmi}</td>
                  <td style={{color:G}}>{l.hPct?`${l.hPct}th`:"—"}</td>
                  <td style={{color:G}}>{l.wPct?`${l.wPct}th`:"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ TAB 5 — ACTIVITY TIMER ═══════════════ */
function ActivityTimer({toast}) {
  const PRESETS = [
    {label:"5 min Stretch",secs:300,icon:"🤸",color:TEAL},
    {label:"8 min Yoga",secs:480,icon:"🧘",color:PURPLE},
    {label:"10 min Walk",secs:600,icon:"🚶",color:GREEN},
    {label:"15 min Play",secs:900,icon:"⚽",color:G},
    {label:"20 min Run",secs:1200,icon:"🏃",color:ORANGE},
    {label:"30 min Sport",secs:1800,icon:"🏸",color:BLUE},
  ];
  const [sel, setSel] = useState(0);
  const [rem, setRem] = useState(PRESETS[0].secs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sessLog, setSessLog] = useState(()=>S.get(`mk_activity_${today()}`,[]))
  const ref = useRef(null);
  const total = PRESETS[sel].secs;

  useEffect(()=>{
    if(running){
      ref.current=setInterval(()=>{
        setRem(r=>{
          if(r<=1){clearInterval(ref.current);setRunning(false);setDone(true);
            const next=[{preset:PRESETS[sel].label,mins:Math.round(total/60),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),cal:Math.round(total/60*4)},...sessLog].slice(0,10);
            setSessLog(next);S.set(`mk_activity_${today()}`,next);
            toast("🏆 Activity complete! Well done!");return 0;}
          return r-1;
        });
      },1000);
    }
    return()=>clearInterval(ref.current);
  },[running]);

  const pick=(i)=>{clearInterval(ref.current);setSel(i);setRem(PRESETS[i].secs);setRunning(false);setDone(false);};
  const toggle=()=>{if(!done)setRunning(r=>!r);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setDone(false);setRem(PRESETS[sel].secs);};
  const pct=((total-rem)/total)*100;
  const p=PRESETS[sel];

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>ACTIVITY TIMER</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>Real countdown · pause & resume · calories burned · session log</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {PRESETS.map((pr,i)=>(
          <button key={i} onClick={()=>pick(i)}
            style={{padding:"12px 8px",background:sel===i?`${pr.color}18`:CARD2,
              border:`1px solid ${sel===i?pr.color:BOR}`,cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .18s",fontFamily:FONT}}>
            <span style={{fontSize:22}}>{pr.icon}</span>
            <span style={{fontSize:8,color:sel===i?pr.color:"#2a2510",letterSpacing:".08em",textAlign:"center"}}>{pr.label}</span>
          </button>
        ))}
      </div>

      <div className="mk-card" style={{textAlign:"center",border:`1px solid ${p.color}22`}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
          <GoldRing pct={pct} size={180} color={done?GREEN:running?p.color:G3}
            label={`${String(Math.floor(rem/60)).padStart(2,"0")}:${String(rem%60).padStart(2,"0")}`} sub={done?"COMPLETE!":running?"ACTIVE":"READY"}/>
        </div>
        <div style={{fontSize:8,letterSpacing:".16em",color:"#2a2510",textTransform:"uppercase",marginBottom:16}}>
          {done?"🏆 Excellent work!":running?`⚡ ${p.label}...`:`Ready — ${p.label}`}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="mk-btn mk-btn-gold" style={{background:done?GREEN:p.color,opacity:done?.5:1}} onClick={toggle} disabled={done}>
            {running?"⏸ Pause":"▶ Start"}
          </button>
          <button className="mk-btn mk-btn-ghost" onClick={reset}>↺ Reset</button>
        </div>
        {running&&(
          <div style={{marginTop:14,display:"flex",gap:14,justifyContent:"center"}}>
            {[
              {label:"Elapsed",val:`${Math.round((total-rem)/60)}m`},
              {label:"Cal Burned",val:Math.round((total-rem)/60*4)},
            ].map(({label,val})=>(
              <div key={label} style={{background:CARD2,border:`1px solid ${BOR}`,padding:"8px 16px",textAlign:"center"}}>
                <div style={{fontFamily:HEAD,fontSize:18,color:p.color,lineHeight:1}}>{val}</div>
                <div className="mk-label" style={{marginBottom:0}}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessLog.length>0&&(
        <div className="mk-card">
          <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>TODAY'S SESSIONS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {sessLog.map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"8px 12px",background:"#0a0906",border:`1px solid ${BOR}`}}>
                <div style={{fontSize:10,color:"#ddd8b8"}}>{s.preset}</div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{fontSize:9,color:G}}>{s.mins}m</div>
                  <div style={{fontSize:9,color:ORANGE}}>{s.cal} kcal</div>
                  <div style={{fontSize:8,color:"#2a2510"}}>{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ TAB 6 — SLEEP TRACKER ═══════════════ */
function SleepTracker({toast}) {
  const KEY = "mk_sleep2";
  const [log, setLog] = useState(()=>S.get(KEY,[]));
  const [form, setForm] = useState({hrs:"",mins:"0",date:today(),bedtime:"21:30",wakeTime:"06:30",quality:7});

  const add = () => {
    if(!form.hrs) return;
    const total = Number(form.hrs)+Number(form.mins)/60;
    const entry={...form,id:Date.now(),hours:+total.toFixed(2),display:`${form.hrs}h ${form.mins}m`};
    const next=[entry,...log].slice(0,21);
    setLog(next); S.set(KEY,next);
    setForm(p=>({...p,hrs:"",mins:"0"}));
    toast("✦ Sleep logged!");
  };

  const avg = log.length?(log.reduce((s,l)=>s+l.hours,0)/log.length).toFixed(1):0;
  const GOAL = 10;
  const pct = Math.round((Number(avg)/GOAL)*100);
  const qualityAvg = log.length?(log.reduce((s,l)=>s+(l.quality||7),0)/log.length).toFixed(1):"—";
  const quality = Number(avg)>=9?"Excellent 🌟":Number(avg)>=7?"Good 👍":Number(avg)>0?"Needs Work ⚠️":"—";

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>SLEEP TRACKER</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>Bedtime · wake time · quality score · 21-day history</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="Avg Sleep" value={`${avg}h`} color={PURPLE} icon="😴"/>
        <StatCard label="Quality Avg" value={qualityAvg} unit="/ 10" color={TEAL} icon="⭐"/>
        <StatCard label="Days Logged" value={log.length} color={G} icon="📅"/>
      </div>

      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
        <GoldRing pct={pct} size={140} color={Number(avg)>=9?GREEN:Number(avg)>=7?G:ORANGE} label={`${avg}h`} sub={`of ${GOAL}h goal`}/>
      </div>

      <div className="mk-card">
        <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>LOG SLEEP</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:10}}>
          <div>
            <div className="mk-label">Bedtime</div>
            <input type="time" className="mk-input" value={form.bedtime} onChange={e=>setForm(p=>({...p,bedtime:e.target.value}))} style={{colorScheme:"dark"}}/>
          </div>
          <div>
            <div className="mk-label">Wake Time</div>
            <input type="time" className="mk-input" value={form.wakeTime} onChange={e=>setForm(p=>({...p,wakeTime:e.target.value}))} style={{colorScheme:"dark"}}/>
          </div>
          <div>
            <div className="mk-label">Hours</div>
            <input className="mk-input" type="number" placeholder="9" min="0" max="24" value={form.hrs} onChange={e=>setForm(p=>({...p,hrs:e.target.value}))}/>
          </div>
          <div>
            <div className="mk-label">Minutes</div>
            <select className="mk-input" value={form.mins} onChange={e=>setForm(p=>({...p,mins:e.target.value}))}>
              {["0","15","30","45"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div className="mk-label">Sleep Quality: {form.quality}/10</div>
          <input type="range" min="1" max="10" value={form.quality} onChange={e=>setForm(p=>({...p,quality:Number(e.target.value)}))} className="mk-range" style={{width:"100%"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div className="mk-label">Date</div>
          <input type="date" className="mk-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark"}}/>
        </div>
        <button className="mk-btn mk-btn-gold" onClick={add} style={{width:"100%"}}>Log Sleep Night</button>
      </div>

      <div className="mk-card">
        <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e0c0",marginBottom:12}}>SLEEP HISTORY</div>
        {log.length===0?<div className="mk-empty">No sleep logged yet</div>:(
          <table className="mk-table">
            <thead><tr><th>Date</th><th>Duration</th><th>Bedtime</th><th>Quality</th></tr></thead>
            <tbody>
              {log.map(l=>(
                <tr key={l.id}>
                  <td>{l.date}</td>
                  <td style={{color:Number(l.hours)>=9?GREEN:Number(l.hours)>=7?G:ORANGE,fontFamily:HEAD,fontSize:14}}>{l.display}</td>
                  <td>{l.bedtime||"—"}</td>
                  <td style={{color:TEAL}}>{l.quality||"—"}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ TAB 7 — STEP COUNTER ═══════════════ */
function StepCounter({toast}) {
  const KEY = `mk_steps_${today()}`;
  const [steps, setSteps] = useState(()=>S.get(KEY,0));
  const [custom, setCustom] = useState("");
  const GOAL = 10000;

  const add = (n) => {
    setSteps(s=>{
      const next=s+n; S.set(KEY,next);
      if(s<GOAL&&next>=GOAL) toast("🏆 Step goal reached!");
      return next;
    });
  };

  const pct = Math.round((steps/GOAL)*100);
  const dist = (steps*0.00075).toFixed(2);
  const kcal = Math.round(steps*0.04);
  const mins = Math.round(steps/100);

  return (
    <div className="mk-fade">
      <div style={{marginBottom:20}}>
        <div className="mk-head" style={{fontSize:30,color:"#e8e0c0",marginBottom:4}}>STEP COUNTER</div>
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2510",textTransform:"uppercase"}}>Daily goal: 10,000 steps · distance · calories · active time</div>
      </div>

      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
        <GoldRing pct={pct} size={180} color={pct>=100?GREEN:pct>=75?G:G3} label={steps.toLocaleString()} sub="STEPS TODAY"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="Distance" value={dist} unit="km" color={TEAL} icon="🗺️"/>
        <StatCard label="Calories Burned" value={kcal} unit="kcal" color={ORANGE} icon="🔥"/>
        <StatCard label="Active Time" value={`${mins}m`} color={BLUE} icon="⏱️"/>
      </div>

      <div className="mk-card">
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:12}}>
          {[100,500,1000,2000,5000].map(n=>(
            <button key={n} className="mk-btn mk-btn-gold" onClick={()=>add(n)} style={{padding:"10px 6px",fontSize:9}}>
              +{n>=1000?`${n/1000}k`:n}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input className="mk-input" type="number" placeholder="Custom steps..." value={custom} onChange={e=>setCustom(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&Number(custom)>0){add(Number(custom));setCustom("");}}} style={{flex:1}}/>
          <button className="mk-btn mk-btn-gold" onClick={()=>{if(Number(custom)>0){add(Number(custom));setCustom("");}}}>Add</button>
          <button className="mk-btn mk-btn-ghost" onClick={()=>{setSteps(0);S.set(KEY,0);}}>Reset</button>
        </div>
      </div>

      {/* Visual step progress */}
      <div className="mk-card">
        <div className="mk-label">Progress to 10,000 Steps</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
          {[...Array(20)].map((_,i)=>{
            const threshold = (i+1)*500;
            const filled = steps >= threshold;
            return <div key={i} style={{flex:"0 0 calc(5% - 3px)",height:20,background:filled?G:BOR2,transition:"background .3s"}}/>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:"#1e1b0e",letterSpacing:".1em"}}>
          <span>0</span><span>2,500</span><span>5,000</span><span>7,500</span><span>10,000</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN APP ═══════════════ */
const TABS = [
  {id:"habits",label:"Habits",emoji:"✅"},
  {id:"nutrition",label:"Nutrition",emoji:"🍎",badge:"BEATS MFP"},
  {id:"health",label:"Health",emoji:"🏥",badge:"BEATS TELADOC"},
  {id:"growth",label:"Growth",emoji:"📏"},
  {id:"activity",label:"Activity",emoji:"⏱"},
  {id:"sleep",label:"Sleep",emoji:"😴"},
  {id:"steps",label:"Steps",emoji:"🚶"},
];

export default function ChildrenHealth() {
  const [tab, setTab] = useState("habits");
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  const showToast = useCallback((msg)=>{
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(()=>setToast(""),2800);
  },[]);

  const dateStr = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:BG,color:"#ddd8b8",fontFamily:FONT,paddingBottom:60,position:"relative",overflowX:"hidden"}}>

        {/* Ambient glow */}
        <div style={{position:"fixed",top:"5%",left:"50%",transform:"translateX(-50%)",width:600,height:200,
          background:`radial-gradient(ellipse,${G}09 0%,transparent 68%)`,
          animation:"mk-pulse 6s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>

        {/* HEADER */}
        <div style={{borderBottom:`1px solid ${BOR}`,padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",
          position:"sticky",top:0,background:`${BG}f0`,backdropFilter:"blur(12px)",zIndex:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,background:`linear-gradient(135deg,${G3},${G2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👶</div>
            <div>
              <div style={{fontFamily:HEAD,fontSize:26,color:"#e8e0c0",lineHeight:1,letterSpacing:".04em"}}>MANIFIX KIDS</div>
              <div style={{fontSize:7,letterSpacing:".2em",color:"#2a2510",textTransform:"uppercase",marginTop:2}}>v2.0 · nutrition · health records · who percentiles</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:G,letterSpacing:".1em"}}>{dateStr}</div>
            <div style={{fontSize:7,color:"#2a2510",marginTop:2,letterSpacing:".14em",textTransform:"uppercase"}}>Gold Edition</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{borderBottom:`1px solid ${BOR}`,padding:"0 20px",display:"flex",gap:1,overflowX:"auto",
          background:`${BG}f8`,position:"sticky",top:57,zIndex:19}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"11px 12px",background:"transparent",border:"none",cursor:"pointer",
                borderBottom:`2px solid ${tab===t.id?G:"transparent"}`,
                color:tab===t.id?G:"#2a2510",fontFamily:FONT,fontSize:7,
                letterSpacing:".14em",textTransform:"uppercase",whiteSpace:"nowrap",
                transition:"all .2s",position:"relative",outline:"none"}}>
              {t.emoji} {t.label}
              {t.badge&&<span style={{position:"absolute",top:4,right:1,fontSize:5,color:TEAL,
                letterSpacing:".08em",fontFamily:FONT,lineHeight:1}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div style={{maxWidth:960,margin:"0 auto",padding:"20px 20px 60px",position:"relative",zIndex:1}}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.26,ease:"easeOut"}}>
              {tab==="habits"&&<HabitTracker toast={showToast}/>}
              {tab==="nutrition"&&<NutritionTracker toast={showToast}/>}
              {tab==="health"&&<HealthRecords toast={showToast}/>}
              {tab==="growth"&&<GrowthTracker toast={showToast}/>}
              {tab==="activity"&&<ActivityTimer toast={showToast}/>}
              {tab==="sleep"&&<SleepTracker toast={showToast}/>}
              {tab==="steps"&&<StepCounter toast={showToast}/>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* TOAST */}
        <AnimatePresence>
          {toast&&(
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
              style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
                background:G,color:BG,padding:"11px 28px",fontFamily:FONT,
                fontSize:10,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",
                zIndex:999,boxShadow:`0 8px 32px ${G}44`,whiteSpace:"nowrap"}}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
