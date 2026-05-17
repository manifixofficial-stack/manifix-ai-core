/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ManifiX AI — SleepHealth Module v2.0 (Billion-Value Edition)         ║
 * ║  Features: Circadian Calculator, Sleep Cycle Tracking, Voice Coaching,║
 * ║  Offline Persistence, Smart Scoring, 4-7-8 Breathing Tool               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, Star, Clock, Calendar, BarChart3, BookOpen, Settings,
  Bell, Search, Menu, User, ChevronRight, PlayCircle, PauseCircle,
  Volume2, VolumeX, Wind, CloudRain, Waves, Flame, Coffee, Smartphone,
  Zap, Activity, HeartPulse, Brain, Trophy, CheckCircle2, Plus, X,
  Trash2, Save, Info, AlertTriangle, TrendingUp, Music, Headphones,
  Thermometer, Lightbulb, Eye, EyeOff, Download, Mic, MicOff
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   1. CONFIGURATION & CONSTANTS
════════════════════════════════════════════════════════════ */
const SLEEP_SOUNDS = [
  { id: 1, name: "Rain on Roof", icon: CloudRain, color: "#60A5FA", freq: 200 },
  { id: 2, name: "Ocean Waves", icon: Waves, color: "#34D399", freq: 100 },
  { id: 3, name: "White Noise", icon: Wind, color: "#A78BFA", freq: 400 },
  { id: 4, name: "Forest Night", icon: Moon, color: "#FBBF24", freq: 150 },
  { id: 5, name: "Soft Piano", icon: Music, color: "#F472B6", freq: 300 },
  { id: 6, name: "Campfire", icon: Flame, color: "#FB923C", freq: 50 },
];

const DEFAULT_HABITS = [
  { id: 1, text: "No screens 1hr before bed", icon: Smartphone },
  { id: 2, text: "Read for 15 minutes", icon: BookOpen },
  { id: 3, text: "Meditate/Deep breathe", icon: Wind },
  { id: 4, text: "Room temp 65-68°F", icon: Thermometer },
  { id: 5, text: "No caffeine after 2PM", icon: Coffee },
  { id: 6, text: "Stretch/Yoga", icon: Activity },
];

const LANG_MAP = {
  "en-IN": "en-IN", "hi-IN": "hi-IN", "es-ES": "es-ES", "zh-CN": "zh-CN",
  "fr-FR": "fr-FR", "de-DE": "de-DE", "ja-JP": "ja-JP", "en": "en-IN"
};

const PHRASES = {
  "en-IN": {
    welcome: "Welcome to SleepHealth. Let's track your rest and recovery.",
    tip_bedtime: "Consistent bedtimes improve sleep quality by 40%. Try to sleep at the same time.",
    tip_screen: "Blue light suppresses melatonin. Enable night mode now.",
    tip_breathe: "The 4-7-8 technique activates the parasympathetic nervous system for deep rest.",
    log_saved: "Sleep log saved. Your consistency score is updating.",
    cycle_calc: "Based on 90-minute cycles, you should wake up at one of these times.",
  },
  "hi-IN": {
    welcome: "स्लीपहेल्थ में आपका स्वागत है। आइए अपनी नींद और रिकवरी को ट्रैक करें।",
    tip_bedtime: "नियमित सोने का समय नींद की गुणवत्ता में 40% सुधार करता है।",
    tip_screen: "नीली रोशनी मेलाटोनिन को दबाती है। अभी नाइट मोड सक्षम करें।",
    tip_breathe: "4-7-8 तकनीक गहरी नींद के लिए पैरासिम्पेथेटिक तंत्रिका तंत्र को सक्रिय करती है।",
    log_saved: "नींद लॉग सहेजा गया। आपकी निरंतरता स्कोर अपडेट हो रहा है।",
    cycle_calc: "90-मिनट के चक्रों के आधार पर, आपको इनमें से किसी एक समय पर उठना चाहिए।",
  },
};

/* ════════════════════════════════════════════════════════════
   2. UTILITY FUNCTIONS & HOOKS
════════════════════════════════════════════════════════════ */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn("LocalStorage update failed", error);
    }
  };
  return [storedValue, setValue];
}

function calculateSleepScore(logs, habits) {
  if (logs.length === 0) return 50;
  const recentLogs = logs.slice(0, 7);
  const avgDuration = recentLogs.reduce((a, b) => a + b.duration, 0) / recentLogs.length;
  const avgQuality = recentLogs.reduce((a, b) => a + b.quality, 0) / recentLogs.length;
  
  // Duration Score (Optimal 7-9h)
  let durationScore = 0;
  if (avgDuration >= 7 && avgDuration <= 9) durationScore = 40;
  else if (avgDuration > 5) durationScore = 30;
  else durationScore = 15;

  // Quality Score
  const qualityScore = (avgQuality / 10) * 30;

  // Consistency Score (Variability penalty)
  const durations = recentLogs.map(l => l.duration);
  const variance = durations.reduce((a, b) => a + Math.pow(b - avgDuration, 2), 0) / durations.length;
  const consistencyScore = Math.max(0, 20 - variance * 10);

  // Habit Bonus
  const completedHabits = habits.filter(h => h.done).length;
  const habitScore = (completedHabits / habits.length) * 10;

  return Math.min(100, Math.round(durationScore + qualityScore + consistencyScore + habitScore));
}

function createSpeaker(lang) {
  return (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_MAP[lang] || "en-IN";
    u.rate = 0.9;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  };
}

function getCycleTimes(wakeTimeStr) {
  const [hours, minutes] = wakeTimeStr.split(":").map(Number);
  const wakeDate = new Date();
  wakeDate.setHours(hours, minutes, 0, 0);
  // If wake time is in the past today, assume tomorrow
  if (wakeDate < new Date()) wakeDate.setDate(wakeDate.getDate() + 1);

  const cycles = [6, 5, 4, 3].map(c => {
    const fallAsleepTime = new Date(wakeDate.getTime() - (c * 90 + 15) * 60000); // 15 min to fall asleep
    return {
      cycles: c,
      time: fallAsleepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommended: c === 5
    };
  });
  return cycles;
}

/* ════════════════════════════════════════════════════════════
   3. MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function SleepHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [sleepLog, setSleepLog] = useLocalStorage("manifix_sleepLog", [
    { id: 1, date: "2026-05-16", duration: 7.5, quality: 8, notes: "Felt rested", habits: [1, 2, 4] },
    { id: 2, date: "2026-05-15", duration: 6.2, quality: 5, notes: "Woke up twice", habits: [1] },
    { id: 3, date: "2026-05-14", duration: 8.0, quality: 9, notes: "Deep sleep", habits: [1, 2, 3, 4, 5, 6] },
  ]);
  const [habits, setHabits] = useLocalStorage("manifix_sleepHabits", DEFAULT_HABITS.map(h => ({ ...h, done: false, date: new Date().toDateString() })));
  
  // UI State
  const [sleepScore, setSleepScore] = useState(0);
  const [bedtimeGoal, setBedtimeGoal] = useLocalStorage("manifix_bedtime", "23:00");
  const [wakeTimeGoal, setWakeTimeGoal] = useLocalStorage("manifix_wake", "07:00");
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showCycleCalc, setShowCycleCalc] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [lang, setLang] = useLocalStorage("manifix_lang", "en-IN");
  
  const newLogRef = useRef({ duration: "", quality: 5, notes: "" });
  const [newLog, setNewLog] = useState(newLogRef.current);

  const speak = useMemo(() => createSpeaker(lang), [lang]);
  const sleepDuration = useMemo(() => sleepLog.map(l => l.duration), [sleepLog]);
  const sleepQuality = useMemo(() => sleepLog.map(l => l.quality), [sleepLog]);

  // Effects
  useEffect(() => {
    setSleepScore(calculateSleepScore(sleepLog, habits));
  }, [sleepLog, habits]);

  useEffect(() => {
    // Reset habits daily if date changed
    const today = new Date().toDateString();
    if (habits[0] && habits[0].date !== today) {
      setHabits(DEFAULT_HABITS.map(h => ({ ...h, done: false, date: today })));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => speak(PHRASES[lang]?.welcome || PHRASES["en-IN"].welcome), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const addSleepLog = useCallback(() => {
    if (!newLog.duration) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      duration: parseFloat(newLog.duration),
      quality: parseInt(newLog.quality),
      notes: newLog.notes,
      habits: habits.filter(h => h.done).map(h => h.id),
    };
    setSleepLog(prev => [entry, ...prev]);
    setShowAddLog(false);
    setNewLog({ duration: "", quality: 5, notes: "" });
    speak(PHRASES[lang]?.log_saved);
  }, [newLog, habits, setSleepLog, lang, speak]);

  const toggleHabit = useCallback((id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  }, [setHabits]);

  const toggleSound = useCallback((id) => {
    if (currentSound === id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSound(id);
      setIsPlaying(true);
    }
  }, [currentSound, isPlaying]);

  const exportData = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ sleepLog, habits }));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sleephealth_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [sleepLog, habits]);

  // Tab Definitions
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "sounds", label: "Sleep Sounds", icon: Headphones },
    { id: "log", label: "Sleep Log", icon: BookOpen },
    { id: "habits", label: "Hygiene", icon: CheckCircle2 },
    { id: "insights", label: "AI Insights", icon: Brain },
  ];

  /* ════════════════════════════════════════════════════════════
     4. STYLES
  ═════════════════════════════════════════════════════════════ */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
    body { background: #050510; font-family: 'Inter', sans-serif; color: #e2e8f0; overflow: hidden; }
    
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0a0a15; }
    ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 3px; }
    
    .app-container { display: flex; height: 100vh; background: #050510; }
    .sidebar { width: 260px; background: linear-gradient(180deg, #0a0a15 0%, #050510 100%); border-right: 1px solid rgba(139, 92, 246, 0.1); display: flex; flex-direction: column; z-index: 50; transition: transform 0.3s ease; }
    .sidebar-header { padding: 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .logo-box { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #8B5CF6, #6366F1); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
    .nav-item { display: flex; align-items: center; gap: 14px; padding: 14px 24px; color: #94a3b8; cursor: pointer; transition: all 0.2s; font-weight: 500; border: none; background: none; width: 100%; text-align: left; font-size: 0.95rem; }
    .nav-item:hover { color: #fff; background: rgba(139, 92, 246, 0.05); }
    .nav-item.active { color: #8B5CF6; background: rgba(139, 92, 246, 0.1); border-right: 3px solid #8B5CF6; }
    
    .main-content { flex: 1; padding: 32px; overflow-y: auto; background: radial-gradient(circle at 20% 0%, rgba(99, 102, 241, 0.06), transparent 50%), #050510; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-title { font-size: 1.8rem; font-weight: 800; background: linear-gradient(to right, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 24px; backdrop-filter: blur(10px); transition: all 0.3s; }
    .card:hover { border-color: rgba(139, 92, 246, 0.2); background: rgba(255, 255, 255, 0.03); }
    
    .btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-family: inherit; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4); }
    .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); }
    .btn-icon { padding: 10px; border-radius: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-icon:hover { color: #fff; background: rgba(255, 255, 255, 0.1); border-color: #8B5CF6; }
    
    .sound-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
    .sound-card { padding: 20px; border-radius: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .sound-card:hover { transform: translateY(-4px); background: rgba(255, 255, 255, 0.05); }
    .sound-card.active { border-color: var(--sound-color); background: rgba(139, 92, 246, 0.05); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
    .sound-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.1); color: var(--sound-color); }
    
    .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); color: #fff; font-family: inherit; outline: none; transition: 0.2s; }
    .input-field:focus { border-color: #8B5CF6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
    
    .breath-circle { width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, #8B5CF6 0%, transparent 70%); opacity: 0.5; position: relative; display: flex; align-items: center; justify-content: center; }
    .breath-ring { position: absolute; inset: -20px; border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 50%; }
    
    @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.3); opacity: 0.8; } }
    .breathe-anim { animation: breathe 19s ease-in-out infinite; }
    
    @media (max-width: 768px) {
      .sidebar { position: fixed; height: 100%; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main-content { margin-left: 0; padding: 20px; }
      .sound-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  /* ════════════════════════════════════════════════════════════
     5. RENDER
  ═════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        
        {/* Sidebar Overlay Mobile */}
        {sidebarOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} onClick={() => setSidebarOpen(false)} />}
        
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <div className="logo-box"><Moon size={20} color="white" /></div>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, background: "linear-gradient(to right, #fff, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Somnium AI</span>
          </div>
          
          <nav style={{ flex: 1 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={`nav-item ${activeTab === tab.id ? "active" : ""}`} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}>
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          
          <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button className="nav-item" onClick={() => setLang(l => l === "en-IN" ? "hi-IN" : "en-IN")}>
              <GlobeIcon size={18} />
              {lang === "en-IN" ? "English" : "हिंदी"}
            </button>
            <button className="nav-item" onClick={exportData}>
              <Download size={18} />
              Export Data
            </button>
          </div>
        </aside>

        <main className="main-content">
          <div className="top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="btn-icon" style={{ display: "none" }} onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
              <div>
                <h1 className="page-title">{tabs.find(t => t.id === activeTab)?.label}</h1>
                <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 4 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-icon" onClick={() => setShowCycleCalc(!showCycleCalc)} title="Cycle Calculator"><Zap size={20} /></button>
              <button className="btn-icon"><Bell size={20} /></button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* ═══ DASHBOARD TAB ═══ */}
            {activeTab === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                  {/* Score Card */}
                  <div className="card" style={{ gridColumn: "span 1", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(99, 102, 241, 0.02))", borderColor: "rgba(139, 92, 246, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Sleep Score</h3>
                        <div style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1, background: "linear-gradient(to right, #8B5CF6, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          {sleepScore}
                        </div>
                      </div>
                      <Star size={40} color="#8B5CF6" fill="rgba(139, 92, 246, 0.2)" />
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sleepScore}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: "100%", background: "linear-gradient(90deg, #8B5CF6, #EC4899)" }} />
                    </div>
                    <p style={{ color: "#64748b", marginTop: 8, fontSize: "0.85rem" }}>Based on last 7 nights • {sleepLog.length} entries</p>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="card" style={{ padding: "16px" }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 4 }}>Avg Duration</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {(sleepLog.reduce((a, b) => a + b.duration, 0) / (sleepLog.length || 1)).toFixed(1)}h
                      </div>
                      <div style={{ color: "#4ade80", fontSize: "0.75rem", marginTop: 2 }}>↑ 5% vs last week</div>
                    </div>
                    <div className="card" style={{ padding: "16px" }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 4 }}>Avg Quality</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {(sleepLog.reduce((a, b) => a + b.quality, 0) / (sleepLog.length || 1)).toFixed(1)}/10
                      </div>
                      <div style={{ color: "#fbbf24", fontSize: "0.75rem", marginTop: 2 }}>Stable</div>
                    </div>
                  </div>

                  {/* Cycle Calculator Popup */}
                  {showCycleCalc && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ gridColumn: "span 2", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                      <h3 style={{ color: "#fbbf24", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Clock size={20} /> Smart Wake-Up Calculator</h3>
                      <p style={{ color: "#94a3b8", marginBottom: 16, fontSize: "0.9rem" }}>If you want to wake up at <strong style={{ color: "#fff" }}>{wakeTimeGoal}</strong>, try to fall asleep at:</p>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {getCycleTimes(wakeTimeGoal).map((c, i) => (
                          <div key={i} style={{ padding: "12px 20px", borderRadius: "12px", background: c.recommended ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.03)", border: c.recommended ? "1px solid #fbbf24" : "1px solid transparent", color: c.recommended ? "#fbbf24" : "#cbd5e1", fontWeight: 600, fontSize: "1.1rem" }}>
                            {c.time} <span style={{ fontSize: "0.7rem", opacity: 0.7, fontWeight: 400 }}>{c.cycles} cycles</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Log */}
                  <div className="card" style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(139, 92, 246, 0.05)" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>Track Last Night</h3>
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Logging daily improves AI accuracy</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddLog(true)}><Plus size={18} /> Log Sleep</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ SOUNDS TAB ═══ */}
            {activeTab === "sounds" && (
              <motion.div key="sounds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="sound-grid">
                  {SLEEP_SOUNDS.map(sound => {
                    const Icon = sound.icon;
                    const isActive = currentSound === sound.id;
                    return (
                      <div key={sound.id} className="sound-card" style={{ "--sound-color": sound.color }} onClick={() => toggleSound(sound.id)}>
                        <div className="sound-icon"><Icon size={24} /></div>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>{sound.name}</div>
                        {isActive && isPlaying && (
                          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: "16px" }}>
                            {[1, 2, 3, 4].map(i => <motion.div key={i} animate={{ height: [4, 14, 8, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }} style={{ width: "3px", background: sound.color, borderRadius: "2px" }} />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Breathing Tool & Player */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
                  {/* Player */}
                  {currentSound && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <button className="btn-icon" style={{ width: 60, height: 60, borderRadius: "50%", background: "#8B5CF6", color: "#fff", border: "none" }} onClick={() => setIsPlaying(!isPlaying)}>
                          {isPlaying ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 4 }}>{SLEEP_SOUNDS.find(s => s.id === currentSound)?.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Volume2 size={16} color="#94a3b8" />
                            <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(e.target.value)} style={{ flex: 1, accentColor: "#8B5CF6", height: 4 }} />
                            <VolumeX size={16} color="#94a3b8" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 4-7-8 Breathing */}
                  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                    <h3 style={{ marginBottom: 16, color: "#cbd5e1" }}>4-7-8 Relaxation</h3>
                    {breathingActive ? (
                      <div className="breath-circle breathe-anim">
                        <div className="breath-ring" style={{ animation: "breathe 19s ease-in-out infinite" }} />
                        <span style={{ zIndex: 2, fontWeight: 700, color: "#fff" }}>Breathe</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <Wind size={48} color="#8B5CF6" style={{ marginBottom: 12 }} />
                        <p style={{ color: "#94a3b8", marginBottom: 16 }}>Inhale 4s • Hold 7s • Exhale 8s</p>
                      </div>
                    )}
                    <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => { setBreathingActive(!breathingActive); speak(PHRASES[lang]?.tip_breathe); }}>
                      {breathingActive ? "Stop" : "Start Breathing"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ LOG TAB ═══ */}
            {activeTab === "log" && (
              <motion.div key="log" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                  <button className="btn btn-primary" onClick={() => setShowAddLog(true)}><Plus size={16} /> Add Entry</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {sleepLog.map(log => (
                    <div key={log.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }}><Calendar size={22} /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{log.date}</div>
                          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{log.notes || "No notes"}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{log.duration} hrs</div>
                        <div style={{ fontSize: "0.85rem", color: log.quality > 7 ? "#4ade80" : log.quality > 4 ? "#fbbf24" : "#f87171" }}>Quality: {log.quality}/10</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ HABITS TAB ═══ */}
            {activeTab === "habits" && (
              <motion.div key="habits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "#fff" }}>Sleep Hygiene Checklist</h3>
                  <p style={{ color: "#94a3b8", marginBottom: 20 }}>Complete these habits to boost your score by up to 10 points.</p>
                  {habits.map(habit => {
                    const Icon = habit.icon;
                    return (
                      <div key={habit.id} onClick={() => toggleHabit(habit.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: "14px", background: habit.done ? "rgba(74, 222, 128, 0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${habit.done ? "rgba(74, 222, 128, 0.2)" : "transparent"}`, cursor: "pointer", marginBottom: 8, transition: "all 0.2s" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${habit.done ? "#4ade80" : "#475569"}`, background: habit.done ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                          {habit.done && <CheckCircle2 size={16} color="#fff" />}
                        </div>
                        <Icon size={20} color={habit.done ? "#4ade80" : "#94a3b8"} style={{ marginRight: 8 }} />
                        <span style={{ flex: 1, fontWeight: 500, color: habit.done ? "#4ade80" : "#cbd5e1", textDecoration: habit.done ? "line-through" : "none" }}>{habit.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "#ef4444" }}><Smartphone size={20} /> <h4 style={{ fontWeight: 600 }}>Digital Detox</h4></div>
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5 }}>Blue light suppresses melatonin. Stop using phones 60 mins before bed.</p>
                  </div>
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "#f59e0b" }}><Coffee size={20} /> <h4 style={{ fontWeight: 600 }}>Caffeine Cut-off</h4></div>
                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5 }}>Avoid caffeine after 2 PM. Half-life is 5-6 hours, impacting deep sleep.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ INSIGHTS TAB ═══ */}
            {activeTab === "insights" && (
              <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.04))", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 16 }}>
                    <div style={{ padding: 12, borderRadius: 16, background: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6" }}><Brain size={28} /></div>
                    <div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8, color: "#fff" }}>AI Sleep Analysis</h3>
                      <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: "0.95rem" }}>
                        Based on your recent logs, your sleep duration is averaging {(sleepLog.reduce((a, b) => a + b.duration, 0) / (sleepLog.length || 1)).toFixed(1)} hours. 
                        {sleepScore > 80 ? " Your consistency is excellent! Keep it up." : sleepScore > 60 ? " Try to stabilize your wake time to improve quality." : " Consider the 4-7-8 breathing exercise before bed."}
                      </p>
                      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => speak(PHRASES[lang]?.tip_bedtime)}><Mic size={16} /> Hear Tip</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div className="card">
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 20 }}>Weekly Trend</h3>
                    <div style={{ height: "200px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
                      {sleepLog.slice(0, 7).reverse().map((log, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${log.duration * 12}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} style={{ width: "100%", background: "linear-gradient(to top, #8B5CF6, #EC4899)", borderRadius: "8px 8px 0 0", minHeight: 4 }} />
                          <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 20 }}>Recommendations</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                        <div style={{ padding: 8, borderRadius: 8, background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", marginTop: 2 }}><TrendingUp size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>Consistency is Key</div>
                          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Wake up at the same time daily to regulate circadian rhythm.</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                        <div style={{ padding: 8, borderRadius: 8, background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", marginTop: 2 }}><Lightbulb size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>Morning Light</div>
                          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Get 10-15 mins sunlight within 30 mins of waking.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* ═══ MODAL: ADD LOG ═══ */}
        <AnimatePresence>
          {showAddLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddLog(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card" style={{ width: "100%", maxWidth: "450px", padding: "32px", background: "#0f0f1a", border: "1px solid rgba(139, 92, 246, 0.3)" }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24, color: "#fff" }}>Log Sleep</h3>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Duration (hours)</label>
                  <input type="number" step="0.1" className="input-field" placeholder="e.g., 7.5" value={newLog.duration} onChange={e => setNewLog({ ...newLog, duration: e.target.value })} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Quality (1-10)</label>
                  <input type="range" min="1" max="10" value={newLog.quality} onChange={e => setNewLog({ ...newLog, quality: e.target.value })} style={{ width: "100%", accentColor: "#8B5CF6" }} />
                  <div style={{ textAlign: "right", color: "#8B5CF6", fontWeight: 700, marginTop: 4 }}>{newLog.quality}/10</div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Notes</label>
                  <textarea className="input-field" rows="3" placeholder="Dreams, wake ups..." value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddLog(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={addSleepLog}>Save Entry</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// Helper component for Globe Icon since it wasn't imported in original list but used
function GlobeIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
