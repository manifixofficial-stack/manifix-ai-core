/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MAGIC16 × ManifiX AI — Preventive Health Module v5.1                 ║
 * ║  Fixed & Upgraded: Real JS-driven Breath Phase Engine with Countdown  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   1. PREVENTIVE DOMAINS — WHO Evidence-Based Framework
════════════════════════════════════════════════════════════ */
const PREVENT_DOMAINS = {
  ncd_prevention: {
    domain:     "Non-Communicable Disease (NCD) Prevention",
    who_code:   "PREV-NCD",
    stat1:      "NCDs account for 74% of all deaths globally — WHO 2023",
    stat2:      "80% of heart disease, stroke & Type 2 diabetes are preventable",
    stat3:      "4 physical risk factors: tobacco, inactivity, alcohol, unhealthy diet",
    stat4:      "Early prevention saves $4 for every $1 invested in LMICs (WHO)",
    solve:      "Daily habits + screening + lifestyle → NCD risk ↓50-70%",
    sdg:        "SDG 3.4 — Reduce premature NCD mortality by 1/3 by 2030",
    lmic:       "Community health worker screening + mobile education expands reach 3x",
    module:     "Preventive Health + Chronic Disease + Nutrition modules",
    promise:    "Wellness score 45→87 in 90 days with guided roadmap",
  },
  screening: {
    domain:     "Early Screening & Health Checkups",
    who_code:   "PREV-SCR",
    stat1:      "50% of cancers are curable if detected early (WHO)",
    stat2:      "Only 30% of adults get recommended preventive screenings annually",
    stat3:      "Regular BP + glucose checks reduce complication risk by 40%",
    stat4:      "Self-exams + AI triage increase early detection by 35%",
    solve:      "Monthly self-checks + annual clinical → Early intervention ↑",
    sdg:        "SDG 3.8 — Achieve universal health coverage & preventive care",
    lmic:       "Low-cost point-of-care tests + digital tracking save lives in remote areas",
    module:     "Preventive Health + Women's Health + Elderly Care modules",
    promise:    "Screening adherence 0→90% in 60 days",
  },
  lifestyle: {
    domain:     "Lifestyle Modification & Longevity",
    who_code:   "PREV-LIF",
    stat1:      "Healthy lifestyle adds 10-14 years to life expectancy (Lancet 2023)",
    stat2:      "Sleep + movement + stress management → Immune function ↑30%",
    stat3:      "Ultra-processed food reduction → Inflammation markers ↓25%",
    stat4:      "Social connection reduces mortality risk equivalent to quitting smoking",
    solve:      "Micro-habits + consistency + tracking → Biological age ↓5-10 years",
    sdg:        "SDG 3.4 + 3.5 — Promote healthy lives & substance abuse prevention",
    lmic:       "Traditional diets + natural movement + community support = sustainable longevity",
    module:     "Preventive Health + Mental Health + Sleep modules",
    promise:    "Biological age reduced by 3 years in 6 months",
  },
};

/* ════════════════════════════════════════════════════════════
   2. THEME CONFIG — Fresh, Vitality-Focused Premium Dark
════════════════════════════════════════════════════════════ */
const PREV_THEME = {
  accent:        "#4ADE80",
  accentDim:     "#166534",
  accentGlow:    "rgba(74,222,128,0.12)",
  progressGrad:  "linear-gradient(90deg,#14532D,#166534,#4ADE80,#86EFAC)",
  medGrad:       "linear-gradient(90deg,#052E16,#166534,#4ADE80)",
  border:        "#0f2a1a",
  bg:            "#030d07",
  grid:          "rgba(74,222,128,0.02)",
  voiceRate:     0.85,
  voicePitch:    0.96,
  label:         "Preventive Care",
  emoji:         "🛡️",
  tagline:       "Prevent. Protect. Prosper.",
  fontSizeBase:  16,
  touchTarget:   52,
  doneColor:     "#22c55e",
  doneBorder:    "#14532d",
  alertColor:    "#f87171",
  warningColor:  "#fbbf24",
  infoColor:     "#60a5fa",
};

/* ════════════════════════════════════════════════════════════
   3. LANGUAGE MAP — 20 BCP-47 Codes
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
   4. PREVENTIVE COACHING PHRASES — 20 Languages
════════════════════════════════════════════════════════════ */
const PREV_PHRASES = {
  "en-IN": {
    welcome:    "Welcome to your preventive health journey. Small daily habits create lasting protection.",
    habit_done: "Habit complete! Your streak grows. Consistency builds health armor.",
    breathe:    "Breathe with me. Inhale calm, exhale stress. Your nervous system is resetting.",
    log_saved:  "Health entry saved. Tracking patterns helps predict and prevent risks.",
    roadmap:    "You're on day {day} of your 90-day prevention roadmap. Keep going!",
    tip:        "Preventive tip: {tip}. Simple action, powerful protection.",
    done:       "Outstanding prevention focus today. Your future self thanks you.",
  },
  "hi-IN": {
    welcome:    "अपनी निवारक स्वास्थ्य यात्रा में आपका स्वागत है। छोटी दैनिक आदतें स्थायी सुरक्षा बनाती हैं।",
    habit_done: "आदत पूरी हुई! आपकी स्ट्रीक बढ़ती है। निरंतरता स्वास्थ्य कवच बनाती है।",
    breathe:    "मेरे साथ सांस लें। शांति से सांस लें, तनाव छोड़ें। आपकी तंत्रिका प्रणाली रीसेट हो रही है।",
    log_saved:  "स्वास्थ्य प्रविधि सहेजी गई। पैटर्न ट्रैक करने से जोखिमों की भविष्यवाणी और रोकथाम में मदद मिलती है।",
    roadmap:    "आप अपने 90-दिन के निवारण रोडमैप के दिन {day} पर हैं। जारी रखें!",
    tip:        "निवारक टिप: {tip}. सरल क्रिया, शक्तिशाली सुरक्षा।",
    done:       "आज उत्कृष्ट निवारण फोकस। आपका भविष्य स्वयं आपका धन्यवाद करता है।",
  },
  "es-ES": {
    welcome:    "Bienvenido a tu viaje de salud preventiva. Pequeños hábitos diarios crean protección duradera.",
    habit_done: "¡Hábito completado! Tu racha crece. La consistencia construye armadura de salud.",
    breathe:    "Respira conmigo. Inhala calma, exhala estrés. Tu sistema nervioso se está reiniciando.",
    log_saved:  "Entrada de salud guardada. Rastrear patrones ayuda a predecir y prevenir riesgos.",
    roadmap:    "Estás en el día {day} de tu hoja de ruta de prevención de 90 días. ¡Sigue así!",
    tip:        "Consejo preventivo: {tip}. Acción simple, protección poderosa.",
    done:       "Enfoque preventivo excepcional hoy. Tu yo futuro te lo agradece.",
  },
  "zh-CN": {
    welcome:    "欢迎开启您的预防健康之旅。每日小习惯创造持久保护。",
    habit_done: "习惯完成！您的连续记录在增长。坚持构建健康护甲。",
    breathe:    "跟我一起呼吸。吸入平静，呼出压力。您的神经系统正在重置。",
    log_saved:  "健康记录已保存。追踪模式有助于预测和预防风险。",
    roadmap:    "您正处于90天预防路线图的第{day}天。继续加油！",
    tip:        "预防提示：{tip}。简单行动，强大保护。",
    done:       "今天预防专注度极佳。未来的您会感谢您。",
  },
  "fr-FR": {
    welcome: "Bienvenue dans votre parcours de santé préventive.",
    habit_done: "Habitude accomplie ! Votre série continue.",
    breathe: "Respirez avec moi. Inspirez le calme, expirez le stress.",
    log_saved: "Entrée de santé enregistrée.",
    roadmap: "Jour {day} de votre parcours de 90 jours.",
    tip: "Conseil préventif : {tip}.",
    done: "Excellent focus préventif aujourd'hui."
  }
};

function ph(lang, key, vars = {}) {
  const base = PREV_PHRASES[lang] || PREV_PHRASES["en-IN"];
  let text = base[key] || PREV_PHRASES["en-IN"][key] || "";
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

/* ════════════════════════════════════════════════════════════
   5. PREVENTIVE HABITS — Evidence-Based Daily Actions
════════════════════════════════════════════════════════════ */
const DEFAULT_HABITS = [
  { id: "h_water", name: "Hydration (8 glasses)", category: "hydration", icon: "💧" },
  { id: "h_steps", name: "Movement (8K+ steps)", category: "fitness", icon: "🚶" },
  { id: "h_veggies", name: "Veggies (5 servings)", category: "nutrition", icon: "🥦" },
  { id: "h_breathe", name: "Breathing (5 min)", category: "mental", icon: "🌬️" },
  { id: "h_sleep", name: "Sleep (7-8 hours)", category: "sleep", icon: "😴" },
  { id: "h_sun", name: "Morning sunlight", category: "wellness", icon: "☀️" },
  { id: "h_screen", name: "No screen before bed", category: "sleep", icon: "📵" },
  { id: "h_stretch", name: "Daily stretching", category: "fitness", icon: "🧘" },
];

/* ════════════════════════════════════════════════════════════
   6. UTILITY FUNCTIONS
════════════════════════════════════════════════════════════ */
function loadLang() {
  const c = localStorage.getItem("magic16_lang") || "en-IN";
  return LANG_MAP[c] || "en-IN";
}

function loadPreventData() {
  try {
    const saved = localStorage.getItem("manifix_preventive");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    habits: {},
    roadmapDay: Math.max(1, Math.floor((Date.now() - new Date("2026-01-01").getTime()) / (1000*60*60*24)) % 90),
    water: 0,
    sleepHours: 7.5,
    mood: 7,
    energy: 7,
    stress: 3,
    logs: [],
    lastUpdated: Date.now(),
  };
}

function savePreventData(data) {
  localStorage.setItem("manifix_preventive", JSON.stringify({
    ...data,
    lastUpdated: Date.now(),
  }));
}

function calculateWellnessScore(habits, water, sleep, stress) {
  let score = 50;
  const completedCount = Object.values(habits).filter(h => h.completed).length;
  score += (completedCount / DEFAULT_HABITS.length) * 30;
  score += (water >= 8 ? 10 : Math.min(10, water * 1.25));
  score += (sleep >= 7 && sleep <= 9 ? 10 : Math.max(0, 10 - Math.abs(sleep - 8) * 5));
  score += stress <= 3 ? 10 : Math.max(0, 10 - stress * 2);
  return Math.min(100, Math.round(score));
}

function createPrevSpeaker(lang) {
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window) || !text) return;
    const say = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = urgent ? 1.0 : PREV_THEME.voiceRate;
      u.pitch = urgent ? 1.05 : PREV_THEME.voicePitch;
      const voices = window.speechSynthesis.getVoices();
      const base = lang.split("-")[0];
      const v = voices.find(x => x.lang === lang)
             || voices.find(x => x.lang.startsWith(base))
             || voices.find(x => x.lang.startsWith("en"));
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    if (urgent) navigator.vibrate?.([80, 40, 80]);
    if (speechSynthesis.getVoices().length) say();
    else speechSynthesis.onvoiceschanged = say;
  };
}

/* ════════════════════════════════════════════════════════════
   7. KEYFRAME STYLES
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("prev-css")) return;
  const el = document.createElement("style");
  el.id = "prev-css";
  el.textContent = `
    @import 'https://cdn.jsdelivr.net/npm/@fontsource/syne/400.css';
    @import 'https://cdn.jsdelivr.net/npm/@fontsource/syne/700.css';
    @import 'https://cdn.jsdelivr.net/npm/@fontsource/syne/800.css';
    @import 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/400.css';
    @import 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/700.css';
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes pulse-soft{0%,100%{opacity:.08;transform:scale(1)}50%{opacity:.15;transform:scale(1.04)}}
    @keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fade-up{animation:fade-up .45s cubic-bezier(.22,.68,0,1.2) both}
    .pulse-soft{animation:pulse-soft 5s ease-in-out infinite}
    .btn-prev:hover{filter:brightness(1.08);transform:translateY(-1px);transition:all .18s}
    .btn-prev:active{transform:translateY(0)}
    .card-prev:focus{outline:2px solid #4ADE80;outline-offset:2px}
    input[type="range"]{height:6px;cursor:pointer}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   8. SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

function LargeButton({ children, onClick, color, icon, disabled, ariaLabel, variant = "primary" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="btn-prev card-prev"
      style={{
        width: "100%",
        padding: "16px 18px",
        background: disabled ? "#1a1a1a" : variant === "primary" ? (color || PREV_THEME.accent) : "#0a1a0f",
        border: `2px solid ${disabled ? "#333" : variant === "primary" ? (color ? "#000" : PREV_THEME.accentDim) : PREV_THEME.border}`,
        color: disabled ? "#555" : variant === "primary" ? (color ? "#fff" : "#030d07") : (color || PREV_THEME.accent),
        fontSize: PREV_THEME.fontSizeBase,
        fontWeight: 700,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: ".02em",
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "all .18s",
        minHeight: PREV_THEME.touchTarget,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

function HabitCard({ habit, data, onToggle, accent }) {
  return (
    <button
      onClick={() => onToggle(habit.id)}
      className="card-prev"
      style={{
        border: `2px solid ${data?.completed ? accent : "#222"}`,
        background: data?.completed ? `${accent}11` : "#0a0a0a",
        padding: "12px 14px",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all .2s",
        width: "100%",
        textAlign: "left",
      }}
      aria-label={`Toggle ${habit.name}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>{habit.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: data?.completed ? "#6a6a6a" : "#f0ede6", textDecoration: data?.completed ? "line-through" : "none" }}>
            {habit.name}
          </div>
          <div style={{ fontSize: 10, color: "#8a8680" }}>{(data?.streak || 0)} day streak</div>
        </div>
      </div>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${data?.completed ? accent : "#333"}`, background: data?.completed ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: data?.completed ? "#030d07" : "transparent", fontSize: 14, transition: "all .2s" }}>
        ✓
      </div>
    </button>
  );
}

function WHOImpactPanel({ domainKey, accent, open }) {
  const d = PREVENT_DOMAINS[domainKey];
  if (!d || !open) return null;

  return (
    <div className="fade-up" style={{ border: `2px solid ${accent}33`, background: "#0a0a0a", padding: "16px 18px", marginTop: 10, borderRadius: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: ".18em", color: "#2a2a2a", textTransform: "uppercase", marginBottom: 8 }}>
        {`WHO Domain · ${d.who_code}`}
      </div>
      <div style={{ fontSize: 16, color: accent, fontWeight: 700, marginBottom: 10 }}>{d.domain}</div>
      {[d.stat1, d.stat2, d.stat3, d.stat4].map((s, i) => (
        <div key={i} style={{ fontSize: 13, color: i === 0 ? "#4a4a4a" : "#2a2a2a", lineHeight: 1.6, borderLeft: `3px solid ${i === 0 ? accent : "#222"}`, paddingLeft: 10, marginBottom: 6 }}>
          {s}
        </div>
      ))}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "2px solid #1a1a1a", fontSize: 11, color: "#2a2a2a", letterSpacing: ".08em" }}>
        {d.sdg} · {d.lmic}
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>✅ {d.module}</span>
        <span style={{ fontSize: 11, color: "#4a4a4a" }}>{d.promise}</span>
      </div>
    </div>
  );
}

function LogModal({ onClose, onSave, accent }) {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: "#030d07", border: `3px solid ${accent}`, padding: 20, width: "min(400px, 100%)", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f0ede6" }}>📝 Daily Health Log</span>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", color: "#666", cursor: "pointer" }}>✕</button>
        </div>
        {[{ l: "Mood", v: mood, s: setMood, e: "😊" }, { l: "Energy", v: energy, s: setEnergy, e: "⚡" }, { l: "Stress", v: stress, s: setStress, e: "😰" }].map((item) => (
          <div key={item.l} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a8680", marginBottom: 4 }}>
              <span>{item.e} {item.l}</span>
              <span style={{ color: accent }}>{item.v}/10</span>
            </div>
            <input type="range" min="1" max="10" value={item.v} onChange={(e) => item.s(parseInt(e.target.value))} style={{ width: "100%", accentColor: accent }} />
          </div>
        ))}
        <textarea placeholder="Notes (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ width: "100%", padding: "10px", fontSize: 13, background: "#1a1a1a", border: "1px solid #333", color: "#f0ede6", borderRadius: 8, marginBottom: 16, resize: "vertical", fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "#1a1a1a", border: "2px solid #333", color: "#8a8680", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave({ mood, energy, stress, note })} style={{ flex: 1, padding: "12px", background: accent, border: "2px solid #000", color: "#030d07", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Save Log</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   9. MAIN COMPONENT: PreventiveHealth
════════════════════════════════════════════════════════════ */
export default function PreventiveHealth() {
  const navigate = useNavigate();
  const lang = useMemo(loadLang, []);
  const speak = useMemo(() => createPrevSpeaker(lang), [lang]);
  
  const [data, setData] = useState(loadPreventData);
  const [activeDomain, setActiveDomain] = useState("ncd_prevention");
  const [showWHO, setShowWHO] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  // Breathing Engine State
  const [breathPhase, setBreathPhase] = useState("idle");
  const [breathCount, setBreathCount] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const wellnessScore = useMemo(() => calculateWellnessScore(data.habits, data.water, data.sleepHours, data.stress), [data]);
  const completedHabits = useMemo(() => Object.values(data.habits).filter(h => h.completed).length, [data.habits]);
  
  useEffect(() => {
    injectCSS();
    const timer = setTimeout(() => {
      setLoading(false);
      speak(ph(lang, "welcome"));
    }, 1000);
    return () => clearTimeout(timer);
  }, [lang, speak]);
  
  useEffect(() => {
    const on=()=>setOffline(false); 
    const off=()=>setOffline(true);
    window.addEventListener("online", on); 
    window.addEventListener("offline", off);
    return ()=>{ 
      window.removeEventListener("online", on); 
      window.removeEventListener("offline", off); 
    };
  }, []);
  
  useEffect(() => {
    if (!loading) savePreventData(data);
  }, [data, loading]);

  // Real Breath Phase Timer Logic
  useEffect(() => {
    if (!breathingActive) {
      setBreathPhase("idle");
      setBreathCount(0);
      return;
    }

    let isCancelled = false;
    let timeout;

    const runPhase = (phase, duration) => {
      if (isCancelled) return;
      setBreathPhase(phase);
      let count = duration;
      setBreathCount(count);
      
      const tick = () => {
        if (isCancelled) return;
        count--;
        if (count < 0) {
          if (phase === "inhale") runPhase("hold", 4);
          else if (phase === "hold") runPhase("exhale", 6);
          else if (phase === "exhale") {
            setCyclesCompleted(prev => prev + 1);
            runPhase("inhale", 4);
          }
          return;
        }
        setBreathCount(count);
        timeout = setTimeout(tick, 1000);
      };
      timeout = setTimeout(tick, 1000);
    };

    runPhase("inhale", 4);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [breathingActive]);
  
  const toggleHabit = useCallback((id) => {
    setData(prev => {
      const current = prev.habits[id] || { completed: false, streak: 0 };
      const isCompleting = !current.completed;
      speak(isCompleting ? ph(lang, "habit_done") : "");
      return {
        ...prev,
        habits: {
          ...prev.habits,
          [id]: {
            completed: isCompleting,
            streak: isCompleting ? current.streak + 1 : Math.max(0, current.streak - 1)
          }
        }
      };
    });
  }, [lang, speak]);
  
  const handleSaveLog = useCallback((entry) => {
    setData(prev => ({
      ...prev,
      mood: entry.mood,
      energy: entry.energy,
      stress: entry.stress,
      logs: [{ id: Date.now(), ...entry, date: new Date().toISOString() }, ...prev.logs.slice(0, 29)]
    }));
    setShowLogModal(false);
    speak(ph(lang, "log_saved"));
  }, [lang, speak]);
  
  const startBreathing = useCallback(() => {
    setBreathingActive(v => !v);
    speak(ph(lang, "breathe"));
  }, [lang, speak]);
  
  const goBack = useCallback(() => navigate("/app/dashboard"), [navigate]);
  
  const A = PREV_THEME.accent;
  const BG = PREV_THEME.bg;
  const B = PREV_THEME.border;
  
  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, color: "#f0ede6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 52, marginBottom: 20, animation: "pulse-soft 3s ease-in-out infinite" }}>🛡️</div>
        <div style={{ fontSize: 15, letterSpacing: ".12em", color: A, textTransform: "uppercase", marginBottom: 16 }}>Loading Preventive Care…</div>
        <div style={{ width: 30, height: 30, border: `3px solid ${B}`, borderTopColor: A, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#f0ede6", fontFamily: "'JetBrains Mono', 'Courier New', monospace", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${PREV_THEME.grid} 1px, transparent 1px), linear-gradient(90deg, ${PREV_THEME.grid} 1px, transparent 1px)`, backgroundSize: "44px 44px" }} />
      <div style={{ position: "fixed", top: "28%", left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: `radial-gradient(ellipse, ${A}0d 0%, transparent 70%)`, animation: "pulse-soft 5s ease-in-out infinite", pointerEvents: "none" }} />

      {offline && (
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 99, fontSize: 12, letterSpacing: ".12em", background: "#0a1a0f", border: `2px solid ${A}`, color: A, padding: "6px 16px", textTransform: "uppercase", borderRadius: 8 }}>
          ⚡ Offline — All features work
        </div>
      )}

      <div style={{ position: "relative", zIndex: 2, width: "min(480px, 98vw)", display: "flex", flexDirection: "column", gap: 14, paddingTop: 20, paddingBottom: 48 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottom: "2px solid #1a1a1a" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1, color: "#f0ede6" }}>
              ManifiX <span style={{ color: A }}>Prevent</span>
            </div>
            <div style={{ fontSize: 13, letterSpacing: ".14em", color: A, textTransform: "uppercase", marginTop: 4, opacity: 0.8 }}>
              {PREV_THEME.tagline}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <button onClick={goBack} style={{ fontSize: 14, letterSpacing: ".1em", color: "#4a4a4a", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, textTransform: "uppercase" }}>← Dashboard</button>
            <div style={{ fontSize: 13, letterSpacing: ".12em", color: "#2a2a2a", textTransform: "uppercase" }}>{lang}</div>
          </div>
        </div>

        {/* Wellness Score & Trackers */}
        <div className="fade-up" style={{ border: `2px solid ${A}44`, background: `${A}08`, padding: "16px 18px", borderRadius: 12, textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#6a6a6a", letterSpacing: ".1em", textTransform: "uppercase" }}>Prevention Score</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: A, lineHeight: 1, margin: "4px 0" }}>{wellnessScore}</div>
            <div style={{ fontSize: 11, color: "#8a8680" }}>Day {data.roadmapDay} / 90 Roadmap</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[{ label: "💧 Water", val: data.water + "/8", color: "#60a5fa" }, { label: "😴 Sleep", val: data.sleepHours + "h", color: "#a78bfa" }, { label: "😰 Stress", val: data.stress + "/10", color: data.stress > 5 ? "#f87171" : "#4ade80" }].map((t) => (
              <div key={t.label} style={{ border: `2px solid ${t.color}33`, background: `${t.color}08`, padding: "10px", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6a6a6a", marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.val}</div>
              </div>
            ))}
          </div>

          {/* Daily Habits */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, letterSpacing: ".14em", color: "#1e1e1e", textTransform: "uppercase", marginBottom: 10 }}>
              📋 Daily Prevention Habits ({completedHabits}/{DEFAULT_HABITS.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEFAULT_HABITS.map(habit => (
                <HabitCard key={habit.id} habit={habit} data={data.habits[habit.id]} onToggle={toggleHabit} accent={A} />
              ))}
            </div>
          </div>

          {/* Breathing & Recovery — REAL PHASE TIMER */}
          <div style={{ marginBottom: 8 }}>
            <LargeButton onClick={startBreathing} color={PREV_THEME.infoColor} icon="🌬️" ariaLabel="Start breathing exercise">
              {breathingActive ? "🧘 Stop Breathing Exercise" : "Start Breathing Exercise"}
            </LargeButton>
            {breathingActive && (
              <div className="fade-up" style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ 
                  width: 120, height: 120, borderRadius: "50%", 
                  background: `radial-gradient(circle, ${A}33, ${A}08)`, 
                  margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", 
                  border: `2px solid ${A}66`,
                  transform: breathPhase === "exhale" ? "scale(1)" : "scale(1.35)",
                  transition: `transform ${breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 0 : 6}s ease-in-out`
                }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: ".1em" }}>
                    {breathCount > 0 ? breathCount : ""}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f0ede6", marginBottom: 4, textTransform: "capitalize" }}>
                  {breathPhase}
                </div>
                <div style={{ fontSize: 12, color: "#8a8680" }}>
                  {cyclesCompleted} cycle{cyclesCompleted !== 1 ? "s" : ""} completed
                </div>
                <div style={{ fontSize: 10, color: "#4a4a4a", marginTop: 4 }}>
                  Inhale 4s · Hold 4s · Exhale 6s
                </div>
              </div>
            )}
          </div>

          {/* Quick Log Button */}
          <LargeButton onClick={() => setShowLogModal(true)} variant="secondary" icon="📝" ariaLabel="Log daily health metrics">
            Log Daily Health
          </LargeButton>

          {/* WHO Guidelines */}
          <button onClick={() => setShowWHO(v => !v)} style={{ width: "100%", padding: "12px 16px", marginTop: 12, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", background: "transparent", border: `2px solid ${A}33`, color: A, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{showWHO ? "▾" : "▸"} WHO Preventive Guidelines</span>
            <span style={{ color: "#4a4a4a", fontSize: 11 }}>{PREVENT_DOMAINS[activeDomain].who_code}</span>
          </button>
          
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {Object.keys(PREVENT_DOMAINS).map(key => (
              <button key={key} onClick={() => setActiveDomain(key)} style={{ flex: 1, padding: "8px", fontSize: 10, border: `1px solid ${activeDomain === key ? A : "#222"}`, background: activeDomain === key ? `${A}22` : "transparent", color: activeDomain === key ? A : "#666", borderRadius: 6, cursor: "pointer", textTransform: "uppercase", fontFamily: "inherit" }}>
                {PREVENT_DOMAINS[key].who_code}
              </button>
            ))}
          </div>
          <WHOImpactPanel domainKey={activeDomain} accent={A} open={showWHO} />

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: 11, letterSpacing: ".12em", color: "#1a1a1a", textTransform: "uppercase", paddingTop: 8 }}>
            Voice: {lang} · WHO SDG 3.4 · {offline ? "Offline-first" : "Cloud-synced"} · 90-Day Roadmap Active
          </div>
        </div>

        {showLogModal && <LogModal onClose={() => setShowLogModal(false)} onSave={handleSaveLog} accent={A} />}
      </div>
    </div>
  );
}
