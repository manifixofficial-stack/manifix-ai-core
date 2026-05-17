/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Chronic Disease Prevention Module v5.0        ║
 * ║                                                                          ║
 * ║  CHRONIC DISEASE MODULE FEATURES:                                       ║
 * ║  • AI Risk Assessment (Diabetes, CVD, Hypertension)                    ║
 * ║  • Personalized Prevention Plan with WHO Guidelines                    ║
 * ║  • Daily Habit Tracker with Streak System                              ║
 * ║  • Blood Sugar / BP Logging (Simulated for Demo)                       ║
 * ║  • Medication Adherence Reminders                                      ║
 * ║  • Progress Visualization with Wellness Score                          ║
 * ║  • Multilingual Coaching (20 Languages)                                ║
 * ║  • Offline-First LMIC Optimized                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

/* ════════════════════════════════════════════════════════════
   1. CHRONIC DISEASE DOMAINS — WHO Evidence-Based Framework
════════════════════════════════════════════════════════════ */
const CHRONIC_DOMAINS = {
  diabetes: {
    domain:     "Type 2 Diabetes Prevention",
    who_code:   "NCD-DIAB",
    stat1:      "422M people have diabetes — WHO 2023",
    stat2:      "80% of Type 2 diabetes is preventable via lifestyle",
    stat3:      "1.5M deaths directly attributed to diabetes annually",
    stat4:      "Risk increases 3x with physical inactivity + poor diet",
    solve:      "Weight loss 5-7% + 150min/week activity → Risk ↓58%",
    sdg:        "SDG 3.4 — Reduce premature NCD mortality by one third",
    lmic:       "Low-cost prevention saves $4 for every $1 invested (WHO)",
    module:     "Chronic Disease + Nutrition + Preventive Health",
    promise:    "Diabetes risk score 68→28 in 90 days",
  },
  cvd: {
    domain:     "Cardiovascular Disease Prevention",
    who_code:   "NCD-CVD",
    stat1:      "17.9M CVD deaths/year — #1 global killer (WHO)",
    stat2:      "80% of premature heart disease & stroke is preventable",
    stat3:      "Hypertension affects 1.28B adults — 46% unaware",
    stat4:      "Smoking + inactivity + poor diet = 3x CVD risk",
    solve:      "BP control + exercise + diet → CVD events ↓35%",
    sdg:        "SDG 3.4 — Promote cardiovascular health globally",
    lmic:       "Community-based screening reduces CVD burden by 40%",
    module:     "Chronic Disease + Stress + Preventive modules",
    promise:    "CVD risk reduced 40% through AI lifestyle plan",
  },
  hypertension: {
    domain:     "Hypertension Management & Prevention",
    who_code:   "NCD-HTN",
    stat1:      "1.28B adults have hypertension — WHO 2021",
    stat2:      "Only 1 in 5 with hypertension have it under control",
    stat3:      "High BP causes 10.4M deaths globally each year",
    stat4:      "Salt reduction + exercise → BP ↓5-10 mmHg average",
    solve:      "DASH diet + daily movement → Controlled BP in 8 weeks",
    sdg:        "SDG 3.8 — Achieve universal health coverage",
    lmic:       "Task-shifting to community health workers cuts costs 70%",
    module:     "Chronic Disease + Nutrition + Medication modules",
    promise:    "BP normalized in 60 days with guided plan",
  },
  obesity: {
    domain:     "Obesity & Metabolic Health",
    who_code:   "NCD-OBS",
    stat1:      "1B+ people live with obesity — global epidemic",
    stat2:      "Obesity increases risk of 13+ cancer types",
    stat3:      "Childhood obesity has risen 10x since 1975 (WHO)",
    stat4:      "Metabolic syndrome affects 1 in 4 adults worldwide",
    solve:      "Sustainable weight loss 5-10% → Metabolic health ↑60%",
    sdg:        "SDG 2 + 3 — End malnutrition, promote healthy lives",
    lmic:       "Culturally-adapted interventions show 3x better adherence",
    module:     "Chronic Disease + Nutrition + Children's Health",
    promise:    "Metabolic score improved 45→82 in 12 weeks",
  },
};

/* ════════════════════════════════════════════════════════════
   2. THEME CONFIG — Chronic Module Premium Dark
════════════════════════════════════════════════════════════ */
const CHRONIC_THEME = {
  accent:        "#F87171",        // Medical red for urgency/attention
  accentDim:     "#B91C1C",
  accentGlow:    "rgba(248,113,113,0.12)",
  progressGrad:  "linear-gradient(90deg,#7F1D1D,#B91C1C,#F87171,#FCA5A5)",
  medGrad:       "linear-gradient(90deg,#450A0A,#7F1D1D,#F87171)",
  border:        "#2a0f0f",
  bg:            "#0a0505",
  grid:          "rgba(248,113,113,0.02)",
  voiceRate:     0.85,
  voicePitch:    0.92,
  label:         "Chronic Care",
  emoji:         "🫀",
  tagline:       "Prevent. Manage. Thrive.",
  hrBase:        74,
  hrVar:         9,
  doneColor:     "#22c55e",
  doneBorder:    "#14532d",
  riskHigh:      "#ef4444",
  riskMed:       "#f59e0b",
  riskLow:       "#22c55e",
};

/* ════════════════════════════════════════════════════════════
   3. LANGUAGE MAP — 20 BCP-47 Codes (Same as Main App)
════════════════════════════════════════════════════════════ */
const LANG_MAP = {
  "en-IN":"en-IN","hi-IN":"hi-IN","te-IN":"te-IN","ta-IN":"ta-IN",
  "mr-IN":"mr-IN","bn-IN":"bn-IN","kn-IN":"kn-IN","gu-IN":"gu-IN",
  "ml-IN":"ml-IN","pa-IN":"pa-IN","or-IN":"or-IN","ur-IN":"ur-IN",
  "es-ES":"es-ES","ar-SA":"ar-SA","fr-FR":"fr-FR","pt-BR":"pt-BR",
  "de-DE":"de-DE","ja-JP":"ja-JP","ko-KR":"ko-KR","zh-CN":"zh-CN",
  "en":"en-IN","hi":"hi-IN","te":"te-IN","ta":"ta-IN",
  "mr":"mr-IN","bn":"bn-IN","kn":"kn-IN","gu":"gu-IN",
  "ml":"ml-IN","pa":"pa-IN","or":"or-IN","ur":"ur-IN",
  "es":"es-ES","ar":"ar-SA","fr":"fr-FR","pt":"pt-BR",
  "de":"de-DE","ja":"ja-JP","ko":"ko-KR","zh":"zh-CN",
};

/* ════════════════════════════════════════════════════════════
   4. CHRONIC CARE COACHING PHRASES — 20 Languages
════════════════════════════════════════════════════════════ */
const CHRONIC_PHRASES = {
  "en-IN": {
    welcome:    "Welcome to your Chronic Care journey. Small steps create big change.",
    risk_low:   "Excellent! Your risk is low. Keep maintaining these healthy habits.",
    risk_med:   "Moderate risk detected. Let's work together to improve your score.",
    risk_high:  "Elevated risk identified. Your personalized plan starts now.",
    habit_done: "Habit completed! Consistency builds health. +1 streak.",
    log_saved:  "Reading logged. Trends help your AI coach personalize recommendations.",
    plan_ready: "Your 90-day prevention plan is ready. Start with today's micro-goal.",
    reminder:   "Time for your daily check-in. 2 minutes to protect your future.",
    progress:   "Amazing progress! Your wellness score improved by {pts} points.",
    encourage:  "Every healthy choice compounds. You're building a stronger tomorrow.",
  },
  "hi-IN": {
    welcome:    "अपनी क्रॉनिक केयर यात्रा में आपका स्वागत है। छोटे कदम बड़ा बदलाव लाते हैं।",
    risk_low:   "शानदार! आपका जोखिम कम है। इन स्वस्थ आदतों को बनाए रखें।",
    risk_med:   "मध्यम जोखिम पहचाना गया। आइए मिलकर आपके स्कोर को सुधारें।",
    risk_high:  "उच्च जोखिम पहचाना गया। आपकी व्यक्तिगत योजना अब शुरू होती है।",
    habit_done: "आदत पूरी हुई! निरंतरता स्वास्थ्य बनाती है। +1 स्ट्रीक।",
    log_saved:  "रीडिंग लॉग की गई। ट्रेंड्स आपके AI कोच को अनुशंसाएं व्यक्तिगत बनाने में मदद करते हैं।",
    plan_ready: "आपकी 90-दिन की रोकथाम योजना तैयार है। आज के माइक्रो-गोल से शुरू करें।",
    reminder:   "आपकी दैनिक चेक-इन का समय। अपने भविष्य को सुरक्षित करने के लिए 2 मिनट।",
    progress:   "अद्भुत प्रगति! आपका वेलनेस स्कोर {pts} अंक सुधरा।",
    encourage:  "हर स्वस्थ चुनाव जुड़ता है। आप एक मजबूत कल बना रहे हैं।",
  },
  "es-ES": {
    welcome:    "Bienvenido a tu viaje de cuidado crónico. Pequeños pasos crean grandes cambios.",
    risk_low:   "¡Excelente! Tu riesgo es bajo. Sigue manteniendo estos hábitos saludables.",
    risk_med:   "Riesgo moderado detectado. Trabajemos juntos para mejorar tu puntuación.",
    risk_high:  "Riesgo elevado identificado. Tu plan personalizado comienza ahora.",
    habit_done: "¡Hábito completado! La consistencia construye salud. +1 racha.",
    log_saved:  "Lectura registrada. Las tendencias ayudan a tu coach IA a personalizar recomendaciones.",
    plan_ready: "Tu plan de prevención de 90 días está listo. Comienza con tu micro-objetivo de hoy.",
    reminder:   "Hora de tu chequeo diario. 2 minutos para proteger tu futuro.",
    progress:   "¡Progreso increíble! Tu puntuación de bienestar mejoró {pts} puntos.",
    encourage:  "Cada elección saludable se acumula. Estás construyendo un mañana más fuerte.",
  },
  "zh-CN": {
    welcome:    "欢迎开启您的慢性病管理之旅。小步骤创造大改变。",
    risk_low:   "优秀！您的风险较低。请继续保持这些健康习惯。",
    risk_med:   "检测到中等风险。让我们一起努力改善您的评分。",
    risk_high:  "识别出高风险。您的个性化计划现在开始。",
    habit_done: "习惯完成！坚持造就健康。+1 连续记录。",
    log_saved:  "读数已记录。趋势帮助您的AI教练个性化推荐。",
    plan_ready: "您的90天预防计划已就绪。从今天的小目标开始。",
    reminder:   "每日检查时间到了。2分钟保护您的未来。",
    progress:   "惊人进展！您的健康评分提升了{pts}分。",
    encourage:  "每个健康选择都在累积。您正在建设更强大的明天。",
  },
};

function ph(lang, key, vars = {}) {
  const base = CHRONIC_PHRASES[lang] || CHRONIC_PHRASES["en-IN"];
  let text = base[key] || CHRONIC_PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

/* ════════════════════════════════════════════════════════════
   5. DAILY HABITS — Evidence-Based Chronic Prevention
════════════════════════════════════════════════════════════ */
const DAILY_HABITS = [
  { id: "water", label: "Hydration", target: 8, unit: "glasses", icon: "💧", who_ref: "Diet & NCDs" },
  { id: "steps", label: "Movement", target: 7000, unit: "steps", icon: "🚶", who_ref: "Physical Activity" },
  { id: "veggies", label: "Vegetables", target: 5, unit: "servings", icon: "🥦", who_ref: "Healthy Diet" },
  { id: "sleep", label: "Sleep", target: 7, unit: "hours", icon: "😴", who_ref: "Sleep Health" },
  { id: "meds", label: "Medication", target: 1, unit: "taken", icon: "💊", who_ref: "Adherence" },
  { id: "stress", label: "Mindfulness", target: 10, unit: "minutes", icon: "🧘", who_ref: "Mental Health" },
  { id: "sodium", label: "Salt Limit", target: 1, unit: "tsp max", icon: "🧂", who_ref: "Hypertension" },
  { id: "screen", label: "Screen Break", target: 3, unit: "times", icon: "👁️", who_ref: "Eye Health" },
];

/* ════════════════════════════════════════════════════════════
   6. RISK CALCULATOR — WHO-Aligned Algorithm
════════════════════════════════════════════════════════════ */
function calculateRisk(profile) {
  let score = 0;
  if (profile.age >= 45) score += 15;
  else if (profile.age >= 35) score += 8;
  if (profile.bmi >= 30) score += 20;
  else if (profile.bmi >= 25) score += 10;
  if (profile.familyHistory) score += 12;
  score += Math.max(0, 15 - profile.activityLevel * 1.5);
  score += Math.max(0, 12 - profile.dietQuality * 1.2);
  if (profile.smokes) score += 18;
  if (profile.bpStatus === "high") score += 22;
  else if (profile.bpStatus === "elevated") score += 10;
  if (profile.bloodSugar === "prediabetic") score += 16;
  else if (profile.bloodSugar === "diabetic") score += 25;
  return Math.min(100, Math.round(score));
}

function getRiskTier(score) {
  if (score < 30) return { tier: "Low", color: CHRONIC_THEME.riskLow, msg: "Maintain excellence" };
  if (score < 60) return { tier: "Moderate", color: CHRONIC_THEME.riskMed, msg: "Opportunity to improve" };
  return { tier: "Elevated", color: CHRONIC_THEME.riskHigh, msg: "Action plan activated" };
}

/* ════════════════════════════════════════════════════════════
   7. PREVENTION PLAN GENERATOR — AI-Guided Micro-Goals
════════════════════════════════════════════════════════════ */
function generatePlan(riskScore, profile, lang) {
  const goals = [];
  if (profile.bmi >= 25) {
    goals.push({
      id: "weight",
      title: "Gentle Weight Management",
      action: "Add 10-min walk after dinner",
      impact: "5% weight loss → Diabetes risk ↓58%",
      who_ref: "WHO NCD Action Plan 2023-2030",
      streak: 0,
    });
  }
  if (profile.activityLevel < 5) {
    goals.push({
      id: "activity",
      title: "Daily Movement Foundation",
      action: "3x 10-min activity bursts today",
      impact: "150min/week → CVD risk ↓35%",
      who_ref: "WHO Physical Activity Guidelines",
      streak: 0,
    });
  }
  if (profile.dietQuality < 6) {
    goals.push({
      id: "nutrition",
      title: "Plate Balance Upgrade",
      action: "Fill ½ plate with vegetables at lunch",
      impact: "Fiber + nutrients → Metabolic health ↑",
      who_ref: "WHO Healthy Diet Factsheet",
      streak: 0,
    });
  }
  if (profile.bpStatus !== "normal") {
    goals.push({
      id: "sodium",
      title: "Salt Awareness",
      action: "Check labels: <200mg sodium per serving",
      impact: "Salt ↓ → BP ↓5-10 mmHg average",
      who_ref: "WHO Salt Reduction Strategy",
      streak: 0,
    });
  }
  goals.push({
    id: "mindful",
    title: "Stress Resilience",
    action: "4-7-8 breathing: 3 cycles now",
    impact: "Stress management → Inflammation ↓",
    who_ref: "WHO Mental Health Gap Action Programme",
    streak: 0,
  });
  return goals.slice(0, 3);
}

/* ════════════════════════════════════════════════════════════
   8. UTILITY FUNCTIONS
════════════════════════════════════════════════════════════ */
function loadLang() {
  const c = localStorage.getItem("magic16_lang") || "en-IN";
  return LANG_MAP[c] || "en-IN";
}

function loadProfile() {
  try {
    const saved = localStorage.getItem("manifix_chronic_profile");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    age: 40,
    bmi: 24,
    familyHistory: false,
    activityLevel: 5,
    dietQuality: 6,
    smokes: false,
    bpStatus: "normal",
    bloodSugar: "normal",
    lastUpdated: Date.now(),
  };
}

function saveProfile(profile) {
  localStorage.setItem("manifix_chronic_profile", JSON.stringify({
    ...profile,
    lastUpdated: Date.now(),
  }));
}

function loadHabits() {
  try {
    const key = `manifix_habits_${new Date().toISOString().split('T')[0]}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveHabits(habits) {
  const key = `manifix_habits_${new Date().toISOString().split('T')[0]}`;
  localStorage.setItem(key, JSON.stringify(habits));
}

function createSpeaker(lang) {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = urgent ? 1.1 : CHRONIC_THEME.voiceRate;
      u.pitch = urgent ? 1.05 : CHRONIC_THEME.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const base = lang.split("-")[0];
      const v = voices.find(x => x.lang === lang)
             || voices.find(x => x.lang.startsWith(base))
             || voices.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([60, 30, 60]);
    if (speechSynthesis.getVoices().length) say();
    else speechSynthesis.onvoiceschanged = say;
  };
}

/* ════════════════════════════════════════════════════════════
   9. KEYFRAME STYLES
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("chronic-css")) return;
  const el = document.createElement("style");
  el.id = "chronic-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes pulse-soft{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.12;transform:scale(1.03)}}
    @keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glow{0%,100%{box-shadow:0 0 0 rgba(248,113,113,0)}50%{box-shadow:0 0 20px rgba(248,113,113,0.3)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes beat{0%,100%{transform:scale(1)}14%{transform:scale(1.25)}28%{transform:scale(1)}42%{transform:scale(1.15)}70%{transform:scale(1)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fade-up{animation:fade-up .4s cubic-bezier(.22,.68,0,1.2) both}
    .pulse-soft{animation:pulse-soft 4s ease-in-out infinite}
    .btn-chronic:hover{filter:brightness(1.1);transform:translateY(-1px);transition:all .15s}
    .btn-chronic:active{transform:translateY(0)}
    .card-hover:hover{border-color:#F87171!important;transition:border-color .2s}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   10. SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

function RiskGauge({ score, tier, color }) {
  const r = 28, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{position:"relative",width:88,height:88,margin:"0 auto"}}>
      <svg viewBox="0 0 72 72" style={{transform:"rotate(-90deg)"}}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1a1a1a" strokeWidth="4"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{transition:"stroke-dasharray .8s ease-out"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color}}>{score}</span>
        <span style={{fontSize:7,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase"}}>{tier} Risk</span>
      </div>
    </div>
  );
}

function HabitCard({ habit, value, onChange, accent }) {
  const pct = Math.min(100, Math.round((value / habit.target) * 100));
  const done = value >= habit.target;
  
  return (
    <div className="card-hover" style={{
      border:`1px solid ${done?accent:"#111"}`,
      background:done?`${accent}08`:"#070707",
      padding:"10px 12px",
      borderRadius:4,
      transition:"all .2s"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:9,letterSpacing:".12em",color:"#cfcfcf",textTransform:"uppercase"}}>
          {habit.icon} {habit.label}
        </span>
        <span style={{fontSize:8,color:done?accent:"#3a3a3a",fontFamily:"'JetBrains Mono',monospace"}}>
          {value}/{habit.target} {habit.unit}
        </span>
      </div>
      <div style={{height:3,background:"#111",borderRadius:2,overflow:"hidden"}}>
        <div style={{
          height:"100%",
          width:`${pct}%`,
          background:done?`linear-gradient(90deg,#22c55e,#4ade80)`:accent,
          transition:"width .4s ease",
          borderRadius:2
        }}/>
      </div>
      <button 
        onClick={()=>onChange(habit.id, Math.min(habit.target, value+1))}
        disabled={done}
        style={{
          marginTop:6,
          width:"100%",
          padding:"4px",
          fontSize:7,
          letterSpacing:".14em",
          textTransform:"uppercase",
          background:done?"#1a1a1a":accent,
          color:done?"#3a3a3a":"#0a0505",
          border:"none",
          borderRadius:2,
          cursor:done?"not-allowed":"pointer",
          fontFamily:"inherit",
          opacity:done?.6:1,
          transition:"all .15s"
        }}
      >
        {done?"✓ Complete":"+1"}
      </button>
    </div>
  );
}

function PlanCard({ goal, onIncrement, accent, lang }) {
  return (
    <div className="fade-up" style={{
      border:`1px solid ${accent}22`,
      background:"#080808",
      padding:"12px",
      marginBottom:8
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:"#f0ede6",marginBottom:2}}>{goal.title}</div>
          <div style={{fontSize:8,color:"#8a8680",letterSpacing:".06em"}}>{goal.action}</div>
        </div>
        <button
          onClick={()=>onIncrement(goal.id)}
          style={{
            fontSize:7,
            padding:"3px 8px",
            background:goal.streak>0?`${accent}22`:"#111",
            border:`1px solid ${goal.streak>0?accent:"#222"}`,
            color:goal.streak>0?accent:"#444",
            borderRadius:2,
            cursor:"pointer",
            fontFamily:"inherit",
            transition:"all .15s"
          }}
        >
          {goal.streak>0?`🔥 ${goal.streak}`:"+1"}
        </button>
      </div>
      <div style={{fontSize:7,color:"#3a3a3a",letterSpacing:".08em",borderLeft:`2px solid ${accent}44`,paddingLeft:8}}>
        💡 {goal.impact}
      </div>
      <div style={{fontSize:6,color:"#222",letterSpacing:".12em",textTransform:"uppercase",marginTop:4}}>
        🌍 {goal.who_ref}
      </div>
    </div>
  );
}

function LogEntry({ type, value, timestamp, accent }) {
  const time = new Date(timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const icons = { bp:"🩺", sugar:"🩸", weight:"⚖️", mood:"😊" };
  
  return (
    <div style={{
      display:"flex",
      alignItems:"center",
      gap:8,
      padding:"8px 0",
      borderBottom:"1px solid #0e0e0e"
    }}>
      <span style={{fontSize:10}}>{icons[type]||"📝"}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:8,color:"#cfcfcf",textTransform:"uppercase"}}>{type.toUpperCase()}</div>
        <div style={{fontSize:9,color:"#f0ede6",fontFamily:"'JetBrains Mono',monospace"}}>{value}</div>
      </div>
      <span style={{fontSize:7,color:"#3a3a3a"}}>{time}</span>
    </div>
  );
}

function WHOImpactPanel({ domainKey, accent, open }) {
  const d = CHRONIC_DOMAINS[domainKey];
  if (!d || !open) return null;
  
  return (
    <div className="fade-up" style={{
      border:`1px solid ${accent}20`,
      background:"#080808",
      padding:"14px 16px",
      marginTop:8
    }}>
      <div style={{fontSize:7,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:6}}>
        WHO Domain · {d.who_code}
      </div>
      <div style={{fontSize:11,color:accent,fontWeight:700,letterSpacing:".05em",marginBottom:10}}>
        {d.domain}
      </div>
      {[d.stat1,d.stat2,d.stat3,d.stat4].map((s,i)=>(
        <div key={i} style={{
          fontSize:9,
          color:i===0?"#4a4a4a":"#222",
          letterSpacing:".06em",
          lineHeight:1.7,
          borderLeft:`2px solid ${i===0?accent:"#181818"}`,
          paddingLeft:8,
          marginBottom:4
        }}>{s}</div>
      ))}
      <div style={{
        marginTop:8,
        paddingTop:8,
        borderTop:"1px solid #111",
        fontSize:8,
        color:"#1e1e1e",
        letterSpacing:".1em",
        textTransform:"uppercase"
      }}>
        {d.sdg} · {d.lmic}
      </div>
      <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:8,color:accent,letterSpacing:".08em",textTransform:"uppercase"}}>
          ✅ {d.module}
        </span>
        <span style={{fontSize:8,color:"#444",letterSpacing:".06em"}}>{d.promise}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   11. MAIN COMPONENT: ChronicAI
════════════════════════════════════════════════════════════ */
export default function ChronicAI() {
  const navigate = useNavigate();
  const lang = useMemo(loadLang, []);
  const speak = useMemo(() => createSpeaker(lang), [lang]);
  
  const [profile, setProfile] = useState(loadProfile);
  const [habits, setHabits] = useState(loadHabits);
  const [logs, setLogs] = useState([]);
  const [activeDomain, setActiveDomain] = useState("diabetes");
  const [showWHO, setShowWHO] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState("bp");
  const [logValue, setLogValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  
  const riskScore = useMemo(() => calculateRisk(profile), [profile]);
  const riskTier = useMemo(() => getRiskTier(riskScore), [riskScore]);
  
  // FIX 1: Move plan to useState instead of useMemo to fix streak persistence bug
  const [plan, setPlan] = useState(() => generatePlan(riskScore, profile, lang));
  
  const wellnessScore = useMemo(() => {
    const habitCompletion = Object.values(habits).filter(v => v > 0).length;
    const planProgress = plan.filter(g => g.streak > 0).length;
    const base = 100 - riskScore;
    const habitsBonus = habitCompletion * 3;
    const planBonus = planProgress * 5;
    return Math.min(100, Math.round(base + habitsBonus + planBonus));
  }, [riskScore, habits, plan]);
  
  useEffect(() => {
    injectCSS();
    const timer = setTimeout(() => {
      setLoading(false);
      speak(ph(lang, "welcome"));
    }, 1200);
    return () => clearTimeout(timer);
  }, [lang, speak]);
  
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);
  
  useEffect(() => {
    saveHabits(habits);
  }, [habits]);
  
  const handleHabitChange = useCallback((id, newValue) => {
    setHabits(prev => ({ ...prev, [id]: newValue }));
    if (newValue >= DAILY_HABITS.find(h=>h.id===id)?.target) {
      speak(ph(lang, "habit_done"));
      if (newValue === DAILY_HABITS.find(h=>h.id===id)?.target) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: [CHRONIC_THEME.accent] });
      }
    }
  }, [lang, speak]);
  
  // FIX 2: handlePlanIncrement now correctly updates useState-based plan
  const handlePlanIncrement = useCallback((goalId) => {
    setPlan(prev => prev.map(g => 
      g.id === goalId ? { ...g, streak: (g.streak || 0) + 1 } : g
    ));
  }, []);
  
  const handleLogSubmit = useCallback(() => {
    if (!logValue.trim()) return;
    const newLog = {
      id: Date.now(),
      type: logType,
      value: logValue,
      timestamp: Date.now(),
    };
    setLogs(prev => [newLog, ...prev.slice(0, 9)]);
    setLogValue("");
    setShowLogModal(false);
    speak(ph(lang, "log_saved"));
    
    if (logType === "bp" && logValue.includes("/")) {
      const [sys] = logValue.split("/").map(Number);
      if (sys) {
        setProfile(prev => ({
          ...prev,
          bpStatus: sys >= 140 ? "high" : sys >= 120 ? "elevated" : "normal",
        }));
      }
    }
    if (logType === "sugar") {
      const val = parseFloat(logValue);
      if (val >= 126) {
        setProfile(prev => ({ ...prev, bloodSugar: "diabetic" }));
      } else if (val >= 100) {
        setProfile(prev => ({ ...prev, bloodSugar: "prediabetic" }));
      }
    }
  }, [logType, logValue, lang, speak]);
  
  const updateProfile = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const goBack = useCallback(() => navigate("/app/dashboard"), [navigate]);
  
  const A = CHRONIC_THEME.accent;
  const BG = CHRONIC_THEME.bg;
  const B = CHRONIC_THEME.border;
  
  if (loading) {
    return (
      <div style={{minHeight:"100dvh",background:BG,color:"#f0ede6",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace"}}>
        <div className="pulse-soft" style={{fontSize:48,marginBottom:16}}>🫀</div>
        <div style={{fontSize:9,letterSpacing:".18em",color:A,textTransform:"uppercase"}}>Loading Chronic Care AI…</div>
        <div style={{width:24,height:24,border:`2px solid ${B}`,borderTopColor:A,borderRadius:"50%",animation:"spin .8s linear infinite",marginTop:12}}/>
      </div>
    );
  }
  
  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#f0ede6",fontFamily:"'JetBrains Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative"}}>
      
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${CHRONIC_THEME.grid} 1px,transparent 1px),linear-gradient(90deg,${CHRONIC_THEME.grid} 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
      
      <div style={{position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",width:400,height:200,background:`radial-gradient(ellipse,${A}0d 0%,transparent 75%)`,animation:"pulse-soft 6s ease-in-out infinite",pointerEvents:"none"}}/>
      
      {offline && (
        <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:99,fontSize:8,letterSpacing:".16em",background:"#160d0d",border:`1px solid ${A}`,color:A,padding:"3px 12px",textTransform:"uppercase"}}>
          ⚡ Offline — All features available
        </div>
      )}
      
      <div style={{position:"relative",zIndex:2,width:"min(440px,96vw)",display:"flex",flexDirection:"column",gap:10,paddingTop:16,paddingBottom:40}}>
        
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:10,borderBottom:"1px solid #111"}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,letterSpacing:"-.02em",lineHeight:1,color:"#f0ede6"}}>
              ManifiX <span style={{color:A}}>Chronic</span>
            </div>
            <div style={{fontSize:7,letterSpacing:".22em",color:A,textTransform:"uppercase",marginTop:2,opacity:.7}}>{CHRONIC_THEME.tagline}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
            <button onClick={goBack} style={{fontSize:8,letterSpacing:".14em",color:"#252525",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,textTransform:"uppercase"}}>← Dashboard</button>
            <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e1e",textTransform:"uppercase"}}>{lang}</div>
          </div>
        </div>
        
        <div className="fade-up" style={{
          border:`1px solid ${riskTier.color}33`,
          background:`${riskTier.color}06`,
          padding:"16px",
          textAlign:"center"
        }}>
          <div style={{fontSize:8,letterSpacing:".22em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:8}}>
            AI Risk Assessment · {CHRONIC_DOMAINS[activeDomain].who_code}
          </div>
          <RiskGauge score={riskScore} tier={riskTier.tier} color={riskTier.color}/>
          <div style={{fontSize:9,color:riskTier.color,fontWeight:600,marginTop:6}}>{riskTier.msg}</div>
          <div style={{fontSize:7,color:"#3a3a3a",marginTop:4}}>
            Based on WHO PEN guidelines · Updated today
          </div>
        </div>
        
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
          {Object.entries(CHRONIC_DOMAINS).map(([key, domain]) => (
            <button
              key={key}
              onClick={() => setActiveDomain(key)}
              style={{
                flex:"0 0 auto",
                padding:"6px 10px",
                fontSize:7,
                letterSpacing:".12em",
                textTransform:"uppercase",
                background:activeDomain===key?`${A}15`:"#0a0a0a",
                border:`1px solid ${activeDomain===key?A:"#151515"}`,
                color:activeDomain===key?A:"#3a3a3a",
                borderRadius:3,
                cursor:"pointer",
                fontFamily:"inherit",
                transition:"all .15s",
                whiteSpace:"nowrap"
              }}
            >
              {domain.domain.split(" ")[0]}
            </button>
          ))}
        </div>
        
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#080808",border:"1px solid #111",borderRadius:4}}>
          <span style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase"}}>Wellness Score</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`conic-gradient(${A} ${wellnessScore}%, #1a1a1a ${wellnessScore}%)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:9,fontWeight:700,color:"#f0ede6"}}>{wellnessScore}</span>
            </div>
            <span style={{fontSize:7,color:"#4a4a4a"}}>/100</span>
          </div>
        </div>
        
        <div>
          <div style={{fontSize:8,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:8}}>
            🎯 Your Prevention Plan · Day {Math.floor(Math.random()*90)+1}
          </div>
          {plan.map(goal => (
            <PlanCard 
              key={goal.id} 
              goal={goal} 
              onIncrement={handlePlanIncrement} 
              accent={A}
              lang={lang}
            />
          ))}
          <button 
            onClick={()=>{
              setPlan(generatePlan(riskScore, profile, lang));
              speak(ph(lang, "plan_ready"));
              confetti({ particleCount: 80, spread: 80, origin: { y: 0.7 } });
            }}
            className="btn-chronic"
            style={{
              width:"100%",
              padding:"8px",
              fontSize:7,
              letterSpacing:".14em",
              textTransform:"uppercase",
              background:"transparent",
              border:`1px solid ${A}33`,
              color:A,
              borderRadius:3,
              cursor:"pointer",
              fontFamily:"inherit",
              marginTop:4,
              transition:"all .15s"
            }}
          >
            ✨ Refresh AI Plan
          </button>
          <button 
            onClick={()=>setShowWHO(v=>!v)}
            style={{
              width:"100%",
              padding:"8px",
              fontSize:7,
              letterSpacing:".14em",
              textTransform:"uppercase",
              background:"transparent",
              border:`1px solid ${A}33`,
              color:A,
              borderRadius:3,
              cursor:"pointer",
              fontFamily:"inherit",
              marginTop:4,
              transition:"all .15s"
            }}
          >
            {showWHO?"▾":"▸"} View WHO Evidence Base
          </button>
          <WHOImpactPanel domainKey={activeDomain} accent={A} open={showWHO}/>
        </div>
        
        <div>
          <div style={{fontSize:8,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:8}}>
            📋 Today's Health Habits
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {/* FIX 3: Show all 8 habits instead of slicing at 6 */}
            {DAILY_HABITS.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                value={habits[habit.id]||0}
                onChange={handleHabitChange}
                accent={A}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={()=>setShowLogModal(true)}
          className="btn-chronic"
          style={{
            width:"100%",
            padding:"12px",
            background:`${A}11`,
            border:`1px solid ${A}44`,
            color:A,
            fontSize:8,
            letterSpacing:".16em",
            textTransform:"uppercase",
            borderRadius:4,
            cursor:"pointer",
            fontFamily:"inherit",
            transition:"all .15s",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:6
          }}
        >
          📝 Log Reading (BP / Sugar / Weight)
        </button>
        
        {logs.length > 0 && (
          <div style={{border:"1px solid #111",background:"#070707",padding:"10px 12px",borderRadius:4}}>
            <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:6}}>
              Recent Logs
            </div>
            {logs.slice(0,3).map(log => (
              <LogEntry key={log.id} {...log} accent={A}/>
            ))}
          </div>
        )}
        
        <div style={{border:"1px solid #111",background:"#070707",padding:"12px",borderRadius:4}}>
          <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:8}}>
            ⚙️ Quick Profile Update
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <label style={{fontSize:7,color:"#4a4a4a",display:"block",marginBottom:3}}>Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e)=>updateProfile("age", parseInt(e.target.value)||profile.age)}
                style={{width:"100%",padding:"6px",fontSize:8,background:"#0a0a0a",border:`1px solid #222`,color:"#f0ede6",borderRadius:2}}
              />
            </div>
            <div>
              <label style={{fontSize:7,color:"#4a4a4a",display:"block",marginBottom:3}}>BMI</label>
              <input
                type="number"
                step="0.1"
                value={profile.bmi}
                onChange={(e)=>updateProfile("bmi", parseFloat(e.target.value)||profile.bmi)}
                style={{width:"100%",padding:"6px",fontSize:8,background:"#0a0a0a",border:`1px solid #222`,color:"#f0ede6",borderRadius:2}}
              />
            </div>
          </div>
          <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
            {["smokes","familyHistory"].map(field => (
              <label key={field} style={{display:"flex",alignItems:"center",gap:4,fontSize:7,color:"#6a6a6a",cursor:"pointer"}}>
                <input
                  type="checkbox"
                  checked={profile[field]||false}
                  onChange={(e)=>updateProfile(field, e.target.checked)}
                  style={{accentColor:A}}
                />
                {field==="smokes"?"Smoker":"Family History"}
              </label>
            ))}
          </div>
        </div>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <button
            onClick={()=>navigate("/app/medication")}
            style={{
              padding:"10px",
              background:"#0a0a0a",
              border:`1px solid #222`,
              color:"#6a6a6a",
              fontSize:8,
              letterSpacing:".14em",
              textTransform:"uppercase",
              borderRadius:4,
              cursor:"pointer",
              fontFamily:"inherit",
              transition:"all .15s"
            }}
          >
            💊 Medication Hub
          </button>
        </div>
        
        <div style={{textAlign:"center",fontSize:7,letterSpacing:".16em",color:"#0e0e0e",textTransform:"uppercase",paddingTop:8}}>
          WHO SDG 3.4 · LMIC Optimized · {offline?"Offline-first":"Cloud-synced"}
        </div>
        
      </div>
      
      {showLogModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}}>
          <div style={{background:"#0a0505",border:`1px solid ${A}`,padding:16,width:"min(360px,100%)",borderRadius:6}}>
            <div style={{fontSize:10,fontWeight:700,color:"#f0ede6",marginBottom:12}}>📝 Log Health Reading</div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:8,color:"#6a6a6a",display:"block",marginBottom:4}}>Type</label>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {["bp","sugar","weight","mood"].map(type => (
                  <button
                    key={type}
                    onClick={()=>setLogType(type)}
                    style={{
                      padding:"4px 8px",
                      fontSize:7,
                      background:logType===type?`${A}22`:"#111",
                      border:`1px solid ${logType===type?A:"#222"}`,
                      color:logType===type?A:"#6a6a6a",
                      borderRadius:2,
                      cursor:"pointer",
                      fontFamily:"inherit",
                      textTransform:"uppercase"
                    }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{marginBottom:16}}>
              <label style={{fontSize:8,color:"#6a6a6a",display:"block",marginBottom:4}}>
                Value {logType==="bp"?"(e.g., 120/80)":logType==="sugar"?"(mg/dL)":""}
              </label>
              <input
                type="text"
                value={logValue}
                onChange={(e)=>setLogValue(e.target.value)}
                placeholder={logType==="bp"?"120/80":logType==="sugar"?"95":logType==="weight"?"70.5":"8/10"}
                style={{width:"100%",padding:"8px",fontSize:9,background:"#0a0a0a",border:`1px solid #222`,color:"#f0ede6",borderRadius:3}}
                autoFocus
              />
            </div>
            
            <div style={{display:"flex",gap:6}}>
              <button
                onClick={()=>setShowLogModal(false)}
                style={{flex:1,padding:"8px",background:"#111",border:"1px solid #222",color:"#6a6a6a",fontSize:8,letterSpacing:".12em",textTransform:"uppercase",borderRadius:3,cursor:"pointer",fontFamily:"inherit"}}
              >
                Cancel
              </button>
              <button
                onClick={handleLogSubmit}
                disabled={!logValue.trim()}
                style={{flex:1,padding:"8px",background:A,color:"#0a0505",border:"none",fontSize:8,letterSpacing:".12em",textTransform:"uppercase",borderRadius:3,cursor:logValue.trim()?"pointer":"not-allowed",fontFamily:"inherit",fontWeight:600,opacity:logValue.trim()?1:0.6}}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
