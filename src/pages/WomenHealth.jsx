import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Flame, Droplets, Moon, Sun, Heart, Activity,
  Pill, Target, BookOpen, Plus, Minus, X, Check, Clock,
  ArrowUpRight, ArrowDownRight, Trophy, Star, Bell, Settings,
  Menu, Save, Trash2, ChevronRight, AlertCircle, Info,
  Zap, Wind, Coffee, Scale, Thermometer, BarChart3,
  Smile, Frown, Meh, Eye, Hand, Headphones, Award, Calendar,
} from "lucide-react";

const GOLD = "#FFD700";
const GOLD_DIM = "#B8860B";
const GOLD_GLOW = "rgba(255,215,0,0.12)";
const GOLD_LIGHT = "rgba(255,215,0,0.06)";
const GOLD_BORDER = "rgba(255,215,0,0.18)";
const BLACK = "#000000";
const DARK_1 = "#050505";
const DARK_2 = "#0A0A0A";
const DARK_3 = "#111111";
const DARK_4 = "#1A1A1A";
const DARK_5 = "#222222";
const TEXT_MAIN = "#E8E8E8";
const TEXT_DIM = "#666666";
const TEXT_MUTED = "#444444";

export default function WomenHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cycleDay, setCycleDay] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_cycleDay") || "12", 10); } catch { return 12; }
  });
  const [cycleLength, setCycleLength] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_cycleLength") || "28", 10); } catch { return 28; }
  });
  const [cycleStartDate, setCycleStartDate] = useState(() => {
    try { return localStorage.getItem("wh_startDate") || new Date(Date.now() - 12 * 864e5).toISOString().split("T")[0]; } catch { return new Date(Date.now() - 12 * 864e5).toISOString().split("T")[0]; }
  });
  const [energy, setEnergy] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_energy") || "78", 10); } catch { return 78; }
  });
  const [mood, setMood] = useState(() => localStorage.getItem("wh_mood") || "Balanced");
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_streak") || "18", 10); } catch { return 18; }
  });
  const [symptoms, setSymptoms] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_symptoms") || "[]"); } catch { return []; }
  });
  const [moodHistory, setMoodHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_moodHistory") || "[]"); } catch { return []; }
  });
  const [supplements, setSupplements] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_supplements") || "[]"); } catch {
      return [
        { id: 1, name: "Vitamin D3", dosage: "2000 IU", time: "Morning", taken: false },
        { id: 2, name: "Iron", dosage: "18mg", time: "Evening", taken: false },
        { id: 3, name: "Omega-3", dosage: "1000mg", time: "Lunch", taken: false },
        { id: 4, name: "Magnesium", dosage: "400mg", time: "Night", taken: false },
        { id: 5, name: "B-Complex", dosage: "Daily", time: "Morning", taken: false },
      ];
    }
  });
  const [selfCare, setSelfCare] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_selfCare") || "[]"); } catch {
      return [
        { id: 1, name: "Morning Meditation", duration: "10 min", done: false, category: "Mindfulness" },
        { id: 2, name: "Gentle Yoga", duration: "20 min", done: false, category: "Movement" },
        { id: 3, name: "Journaling", duration: "15 min", done: false, category: "Reflection" },
        { id: 4, name: "Skin Care Routine", duration: "10 min", done: false, category: "Self Care" },
        { id: 5, name: "Read a Book", duration: "30 min", done: false, category: "Relaxation" },
        { id: 6, name: "Warm Bath", duration: "20 min", done: false, category: "Relaxation" },
      ];
    }
  });
  const [programs, setPrograms] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_programs") || "[]"); } catch {
      return [
        { id: 1, name: "Hormone Balance", duration: "14 days", progress: 65, category: "Popular", completed: false },
        { id: 2, name: "Cycle Wellness", duration: "Daily", progress: 80, category: "Tracking", completed: false },
        { id: 3, name: "Stress & Mood Care", duration: "7 days", progress: 40, category: "Mind Care", completed: false },
        { id: 4, name: "Energy Recovery", duration: "10 days", progress: 25, category: "Boost", completed: false },
        { id: 5, name: "Sleep Optimization", duration: "7 days", progress: 50, category: "Rest", completed: false },
        { id: 6, name: "Nutrition Balance", duration: "14 days", progress: 30, category: "Diet", completed: false },
      ];
    }
  });
  const [journal, setJournal] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_journal") || "[]"); } catch {
      return [
        { id: 1, date: "Today", title: "Feeling centered", content: "Had a great morning routine today. Meditation really helped me start the day with clarity.", mood: "😊" },
        { id: 2, date: "Yesterday", title: "Productive day", content: "Finished a big project at work. Felt accomplished and energized.", mood: "😄" },
      ];
    }
  });
  const [healthScore, setHealthScore] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_healthScore") || "85", 10); } catch { return 85; }
  });
  const [water, setWater] = useState(() => {
    try { return parseInt(localStorage.getItem("wh_water") || "6", 10); } catch { return 6; }
  });
  const [sleep, setSleep] = useState(() => {
    try { return parseFloat(localStorage.getItem("wh_sleep") || "7.5"); } catch { return 7.5; }
  });
  const [hormones, setHormones] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wh_hormones") || "[]"); } catch {
      return [
        { name: "Estrogen", value: 65 },
        { name: "Progesterone", value: 70 },
        { name: "Cortisol", value: 45 },
        { name: "Serotonin", value: 80 },
      ];
    }
  });
  const [waterGoal, setWaterGoal] = useState(8);
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodModal, setMoodModal] = useState({ mood: "Balanced", energy: 70, note: "" });
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [symptomInput, setSymptomInput] = useState({ name: "", severity: "mild" });
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalInput, setJournalInput] = useState({ title: "", content: "", mood: "😊" });
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [newSupplement, setNewSupplement] = useState({ name: "", dosage: "", time: "Morning" });
  const [showSuppModal, setShowSuppModal] = useState(false);

  const affirmations = useMemo(() => [
    "I am strong, capable, and worthy of all good things.",
    "My body is resilient and knows how to heal itself.",
    "I embrace my emotions and honor my needs.",
    "Every day I am growing into my best self.",
    "I deserve rest, care, and compassion.",
    "My wellness journey is uniquely mine, and I trust it.",
  ], []);

  useEffect(() => { localStorage.setItem("wh_cycleDay", cycleDay); }, [cycleDay]);
  useEffect(() => { localStorage.setItem("wh_cycleLength", cycleLength); }, [cycleLength]);
  useEffect(() => { localStorage.setItem("wh_startDate", cycleStartDate); }, [cycleStartDate]);
  useEffect(() => { localStorage.setItem("wh_energy", energy); }, [energy]);
  useEffect(() => { localStorage.setItem("wh_mood", mood); }, [mood]);
  useEffect(() => { localStorage.setItem("wh_streak", streak); }, [streak]);
  useEffect(() => { localStorage.setItem("wh_symptoms", JSON.stringify(symptoms)); }, [symptoms]);
  useEffect(() => { localStorage.setItem("wh_moodHistory", JSON.stringify(moodHistory)); }, [moodHistory]);
  useEffect(() => { localStorage.setItem("wh_supplements", JSON.stringify(supplements)); }, [supplements]);
  useEffect(() => { localStorage.setItem("wh_selfCare", JSON.stringify(selfCare)); }, [selfCare]);
  useEffect(() => { localStorage.setItem("wh_programs", JSON.stringify(programs)); }, [programs]);
  useEffect(() => { localStorage.setItem("wh_journal", JSON.stringify(journal)); }, [journal]);
  useEffect(() => { localStorage.setItem("wh_healthScore", healthScore); }, [healthScore]);
  useEffect(() => { localStorage.setItem("wh_water", water); }, [water]);
  useEffect(() => { localStorage.setItem("wh_sleep", sleep); }, [sleep]);
  useEffect(() => { localStorage.setItem("wh_hormones", JSON.stringify(hormones)); }, [hormones]);

  useEffect(() => {
    const int = setInterval(() => setAffirmationIdx(p => (p + 1) % affirmations.length), 5000);
    return () => clearInterval(int);
  }, [affirmations.length]);

  const cyclePhase = useMemo(() => {
    if (cycleDay <= 5) return { name: "Menstrual", color: GOLD, icon: Droplets };
    if (cycleDay <= 14) return { name: "Follicular", color: GOLD, icon: Sun };
    if (cycleDay <= 16) return { name: "Ovulation", color: GOLD_DIM, icon: Flame };
    return { name: "Luteal", color: GOLD, icon: Moon };
  }, [cycleDay]);

  const notifications = useMemo(() => {
    const notifs = [];
    const pendingSupps = supplements.filter(s => !s.taken);
    if (pendingSupps.length > 0) notifs.push({ id: 1, type: "warning", message: `${pendingSupps.length} supplements pending today` });
    if (water < waterGoal - 2) notifs.push({ id: 2, type: "info", message: `Drink ${waterGoal - water} more glasses of water` });
    if (energy < 50) notifs.push({ id: 3, type: "alert", message: "Low energy detected. Consider a rest day." });
    if (selfCare.filter(a => a.done).length === 0) notifs.push({ id: 4, type: "info", message: "Start your daily self-care routine" });
    return notifs;
  }, [supplements, water, waterGoal, energy, selfCare]);

  const toggleSupplement = useCallback(id => {
    setSupplements(prev => prev.map(s => s.id === id ? { ...s, taken: !s.taken } : s));
  }, []);

  const toggleSelfCare = useCallback(id => {
    setSelfCare(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));
  }, []);

  const addSymptom = useCallback(() => {
    if (!symptomInput.name.trim()) return;
    setSymptoms(prev => [{ id: Date.now(), name: symptomInput.name, severity: symptomInput.severity, date: "Today", logged: true }, ...prev]);
    setSymptomInput({ name: "", severity: "mild" });
    setShowSymptomModal(false);
  }, [symptomInput]);

  const deleteSymptom = useCallback(id => setSymptoms(prev => prev.filter(s => s.id !== id)), []);

  const addMoodEntry = useCallback(() => {
    if (!moodModal.mood) return;
    setMoodHistory(prev => [{ id: Date.now(), date: new Date().toLocaleDateString(), ...moodModal }, ...prev]);
    setMood(moodModal.mood);
    setEnergy(moodModal.energy);
    setMoodModal({ mood: "Balanced", energy: 70, note: "" });
    setShowMoodModal(false);
    setStreak(prev => prev + 1);
  }, [moodModal]);

  const addJournalEntry = useCallback(() => {
    if (!journalInput.title.trim()) return;
    setJournal(prev => [{ id: Date.now(), date: new Date().toLocaleDateString(), ...journalInput }, ...prev]);
    setJournalInput({ title: "", content: "", mood: "😊" });
    setShowJournalModal(false);
  }, [journalInput]);

  const deleteJournal = useCallback(id => setJournal(prev => prev.filter(j => j.id !== id)), []);

  const addSupplement = useCallback(() => {
    if (!newSupplement.name.trim()) return;
    setSupplements(prev => [...prev, { id: Date.now(), ...newSupplement, taken: false }]);
    setNewSupplement({ name: "", dosage: "", time: "Morning" });
    setShowSuppModal(false);
  }, [newSupplement]);

  const removeSupplement = useCallback(id => setSupplements(prev => prev.filter(s => s.id !== id)), []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "cycle", label: "Cycle Tracker", icon: CalendarDays },
    { id: "mood", label: "Mood Tracker", icon: Smile },
    { id: "symptoms", label: "Symptoms Log", icon: Thermometer },
    { id: "hormones", label: "Hormone Balance", icon: Activity },
    { id: "supplements", label: "Supplements", icon: Pill },
    { id: "selfcare", label: "Self Care", icon: Heart },
    { id: "programs", label: "Programs", icon: Target },
    { id: "journal", label: "Health Journal", icon: BookOpen },
    { id: "insights", label: "Insights", icon: Star },
  ];

  const getMoodIcon = (m) => {
    const map = { Balanced: "😊", Tired: "😴", Stressed: "😟", Focused: "🧘", Emotional: "😢", Energetic: "⚡" };
    return map[m] || "😊";
  };

  const getSeverityColor = (sev) => {
    if (sev === "severe") return GOLD;
    if (sev === "moderate") return GOLD_DIM;
    if (sev === "mild") return "#B8860B";
    return "#8B6508";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${BLACK};font-family:'Inter',sans-serif;color:${TEXT_MAIN}}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:${DARK_2}}
        ::-webkit-scrollbar-thumb{background:${GOLD_GLOW};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${GOLD_BORDER}}
        ::selection{background:${GOLD_GLOW};color:${GOLD}}
        .wh-app{display:flex;min-height:100vh;background:${BLACK};overflow:hidden}
        .wh-sidebar{width:260px;background:${DARK_1};border-right:1px solid ${GOLD_BORDER};padding:20px 0;position:fixed;height:100vh;z-index:50;display:flex;flex-direction:column;transition:transform .3s ease}
        .wh-logo{display:flex;align-items:center;gap:10px;padding:0 20px;margin-bottom:28px}
        .wh-logo-icon{width:40px;height:40px;border-radius:12px;background:${GOLD};display:flex;align-items:center;justify-content:center;color:${BLACK}}
        .wh-logo-text{font-size:1.25rem;font-weight:900;color:${GOLD};letter-spacing:.02em}
        .wh-nav{flex:1;padding:0 12px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
        .wh-nav-item{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:12px;cursor:pointer;transition:all .18s ease;font-weight:500;color:${TEXT_DIM};border:none;background:none;width:100%;text-align:left;font-size:.9rem}
        .wh-nav-item:hover{background:${GOLD_LIGHT};color:${GOLD}}
        .wh-nav-item.active{background:${GOLD_GLOW};color:${GOLD};font-weight:600}
        .wh-nav-item svg{width:18px;height:18px}
        .wh-footer{padding:14px 12px;border-top:1px solid ${GOLD_BORDER};margin-top:auto}
        .wh-profile{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:${GOLD_LIGHT}}
        .wh-avatar{width:32px;height:32px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;color:${BLACK};font-weight:700;font-size:.8rem}
        .wh-info{flex:1}
        .wh-name{font-size:.85rem;font-weight:600;color:${TEXT_MAIN}}
        .wh-role{font-size:.7rem;color:${TEXT_DIM}}
        .wh-main{flex:1;margin-left:260px;padding:28px;overflow-y:auto;max-height:100vh;background:${BLACK}}
        .wh-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}
        .wh-top h1{font-size:1.8rem;font-weight:900;color:${TEXT_MAIN}}
        .wh-top p{color:${TEXT_DIM};font-size:.85rem;margin-top:3px}
        .wh-top-right{display:flex;align-items:center;gap:10px}
        .wh-btn-icon{width:40px;height:40px;border-radius:12px;background:${DARK_3};border:1px solid ${GOLD_BORDER};color:${TEXT_DIM};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative}
        .wh-btn-icon:hover{background:${GOLD_LIGHT};color:${GOLD};border-color:${GOLD}}
        .wh-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${GOLD};color:${BLACK};font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center}
        .wh-notif-drop{position:absolute;top:50px;right:0;width:300px;background:${DARK_2};border:1px solid ${GOLD_BORDER};border-radius:16px;padding:14px;box-shadow:0 16px 48px rgba(0,0,0,.6);z-index:100}
        .wh-notif-item{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:10px;margin-bottom:6px;background:${DARK_3}}
        .wh-notif-text{font-size:.82rem;color:${TEXT_MAIN};line-height:1.4}
        .wh-notif-time{font-size:.68rem;color:${TEXT_DIM};margin-top:3px}
        .wh-grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-bottom:22px}
        .wh-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:22px}
        .wh-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:22px}
        .wh-card{background:${DARK_2};border:1px solid ${GOLD_BORDER};border-radius:20px;padding:20px;transition:all .25s}
        .wh-card:hover{border-color:${GOLD}}
        .wh-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .wh-card-title{font-size:.82rem;color:${TEXT_DIM};font-weight:500}
        .wh-card-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${GOLD_GLOW};color:${GOLD}}
        .wh-stat{font-size:2.2rem;font-weight:900;color:${GOLD};line-height:1;margin-bottom:6px}
        .wh-sub{font-size:.8rem;color:${TEXT_DIM};display:flex;align-items:center;gap:5px}
        .wh-bar{height:7px;background:${DARK_4};border-radius:999px;overflow:hidden;margin-top:14px}
        .wh-bar-fill{height:100%;border-radius:999px;background:${GOLD};transition:width .5s}
        .wh-btn{border:none;cursor:pointer;transition:all .18s;font-weight:600;font-family:'Inter',sans-serif}
        .wh-btn-gold{background:${GOLD};color:${BLACK};padding:10px 20px;border-radius:12px;font-size:.85rem}
        .wh-btn-gold:hover{transform:translateY(-2px);box-shadow:0 8px 24px ${GOLD_GLOW}}
        .wh-btn-dark{background:${DARK_3};color:${TEXT_MAIN};padding:10px 20px;border-radius:12px;border:1px solid ${GOLD_BORDER};font-size:.85rem}
        .wh-btn-dark:hover{background:${GOLD_LIGHT};border-color:${GOLD}}
        .wh-btn-sm{padding:7px 14px;font-size:.78rem;border-radius:9px}
        .wh-input{width:100%;padding:10px 14px;border-radius:12px;border:1px solid ${GOLD_BORDER};background:${DARK_3};color:${TEXT_MAIN};font-size:.9rem;font-family:'Inter',sans-serif;outline:none;transition:all .2s}
        .wh-input:focus{border-color:${GOLD};background:${DARK_2}}
        .wh-input::placeholder{color:${TEXT_MUTED}}
        .wh-select{width:100%;padding:10px 14px;border-radius:12px;border:1px solid ${GOLD_BORDER};background:${DARK_3};color:${TEXT_MAIN};font-size:.9rem;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
        .wh-select option{background:${DARK_2};color:${TEXT_MAIN}}
        .wh-modal{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
        .wh-modal-card{max-width:400px;width:100%}
        .wh-mood-opt{width:46px;height:46px;border-radius:50%;background:${DARK_3};border:2px solid ${DARK_5};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-size:1.4rem}
        .wh-mood-opt:hover{transform:scale(1.08)}
        .wh-mood-opt.active{border-color:${GOLD};background:${GOLD_GLOW}}
        .wh-water{width:38px;height:38px;border-radius:50%;background:${DARK_3};border:2px solid ${GOLD_BORDER};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:${GOLD}}
        .wh-water.filled{background:${GOLD_GLOW};border-color:${GOLD}}
        .wh-water:hover{transform:scale(1.1)}
        .wh-journal-item{padding:14px;border-radius:14px;background:${DARK_3};border:1px solid ${DARK_5};margin-bottom:10px}
        .wh-journal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .wh-journal-date{font-size:.72rem;color:${TEXT_DIM}}
        .wh-journal-mood{font-size:1.3rem}
        .wh-journal-title{font-weight:700;font-size:.98rem;color:${GOLD};margin-bottom:4px}
        .wh-journal-content{color:${TEXT_MAIN};line-height:1.6;font-size:.85rem}
        .wh-program{padding:18px;border-radius:18px;background:${DARK_3};border:1px solid ${DARK_5};transition:all .25s;cursor:pointer}
        .wh-program:hover{border-color:${GOLD}}
        .wh-supplement{display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:${DARK_3};border:1px solid ${DARK_5};margin-bottom:10px;transition:all .2s;cursor:pointer}
        .wh-supplement:hover{background:${GOLD_LIGHT}}
        .wh-supplement.taken{background:${GOLD_GLOW};border-color:${GOLD}}
        .wh-check{width:26px;height:26px;border-radius:50%;border:2px solid ${GOLD_BORDER};display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .wh-check.done{background:${GOLD};border-color:${GOLD};color:${BLACK}}
        .wh-routine{display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:${DARK_3};border:1px solid ${DARK_5};cursor:pointer;transition:all .2s;margin-bottom:10px}
        .wh-routine:hover{background:${GOLD_LIGHT}}
        .wh-routine.done{background:${GOLD_GLOW};border-color:${GOLD}}
        .wh-symptom{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:${DARK_3};border:1px solid ${DARK_5};margin-bottom:8px}
        .wh-symptom:hover{background:${GOLD_LIGHT}}
        .wh-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        .wh-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:40}
        .wh-hormone{margin-bottom:18px}
        .wh-hormone-label{display:flex;justify-content:space-between;margin-bottom:5px;font-size:.82rem;color:${TEXT_MAIN}}
        .wh-hormone-bar{height:8px;background:${DARK_4};border-radius:999px;overflow:hidden}
        .wh-hormone-fill{height:100%;border-radius:999px;background:${GOLD};transition:width .5s}
        .wh-mobile-btn{display:none;width:40px;height:40px;border-radius:12px;background:${DARK_3};border:1px solid ${GOLD_BORDER};color:${TEXT_DIM};align-items:center;justify-content:center;cursor:pointer}
        @media(max-width:1200px){.wh-grid4{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:1024px){.wh-grid3{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){
          .wh-sidebar{transform:translateX(-100%)}
          .wh-sidebar.open{transform:translateX(0)}
          .wh-overlay.active{display:block}
          .wh-main{margin-left:0;padding:18px 14px}
          .wh-mobile-btn{display:flex}
          .wh-grid2,.wh-grid3,.wh-grid4{grid-template-columns:1fr}
          .wh-top{flex-wrap:wrap;gap:14px}
        }
      `}</style>

      <div className="wh-app">
        <div className={`wh-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`wh-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="wh-logo">
            <div className="wh-logo-icon"><Heart size={20} /></div>
            <span className="wh-logo-text">ManifiX</span>
          </div>

          <nav className="wh-nav">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`wh-nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="wh-footer">
            <div className="wh-profile">
              <div className="wh-avatar">MX</div>
              <div className="wh-info">
                <div className="wh-name">Premium User</div>
                <div className="wh-role">Wellness Pro</div>
              </div>
              <Settings size={16} style={{ color: TEXT_DIM, cursor: "pointer" }} />
            </div>
          </div>
        </aside>

        <main className="wh-main">
          <div className="wh-top">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="wh-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={18} />
              </button>
              <div>
                <h1>{tabs.find(t => t.id === activeTab)?.label || "Dashboard"}</h1>
                <p>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>

            <div className="wh-top-right">
              <div style={{ position: "relative" }}>
                <button className="wh-btn-icon" onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={16} />
                  {notifications.length > 0 && <span className="wh-badge">{notifications.length}</span>}
                </button>

                <AnimatePresence>
                  {showNotif && (
                    <motion.div
                      className="wh-notif-drop"
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    >
                      <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: 14, color: GOLD }}>Notifications</div>
                      {notifications.map(n => (
                        <div key={n.id} className="wh-notif-item">
                          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: n.type === "alert" ? "rgba(255,215,0,0.15)" : GOLD_GLOW, color: n.type === "alert" ? GOLD : GOLD_DIM }}>
                            {n.type === "alert" ? <AlertCircle size={14} /> : <Info size={14} />}
                          </div>
                          <div>
                            <div className="wh-notif-text">{n.message}</div>
                            <div className="wh-notif-time">Just now</div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && <div style={{ textAlign: "center", padding: "18px 0", color: TEXT_DIM }}>No notifications</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-grid4">
                  <motion.div className="wh-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .04 }}>
                    <div className="wh-card-header">
                      <span className="wh-card-title">Health Score</span>
                      <div className="wh-card-icon"><Star size={18} /></div>
                    </div>
                    <div style={{ width: 120, height: 120, margin: "0 auto", position: "relative" }}>
                      <svg width="120" height="120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke={DARK_4} strokeWidth="10" />
                        <circle cx="60" cy="60" r="52" fill="none" stroke={GOLD} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${healthScore * 3.27} ${327 - healthScore * 3.27}`} style={{ transition: "stroke-dasharray .8s" }} />
                      </svg>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: GOLD }}>{healthScore}</div>
                        <div style={{ fontSize: ".65rem", color: TEXT_DIM }}>/ 100</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="wh-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
                    <div className="wh-card-header">
                      <span className="wh-card-title">Cycle Phase</span>
                      <div className="wh-card-icon"><CalendarDays size={18} /></div>
                    </div>
                    <div className="wh-stat" style={{ color: cyclePhase.color }}>{cyclePhase.name}</div>
                    <div className="wh-sub">Day {cycleDay} of {cycleLength}</div>
                    <div className="wh-bar">
                      <div className="wh-bar-fill" style={{ width: `${(cycleDay / cycleLength) * 100}%` }} />
                    </div>
                  </motion.div>

                  <motion.div className="wh-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}>
                    <div className="wh-card-header">
                      <span className="wh-card-title">Energy Level</span>
                      <div className="wh-card-icon"><Zap size={18} /></div>
                    </div>
                    <div className="wh-stat">{energy}%</div>
                    <div className="wh-sub">
                      {energy >= 70 ? <span style={{ color: GOLD }}>High</span> : energy >= 40 ? <span style={{ color: GOLD_DIM }}>Moderate</span> : <span style={{ color: GOLD }}>Low</span>}
                    </div>
                    <div className="wh-bar">
                      <div className="wh-bar-fill" style={{ width: `${energy}%` }} />
                    </div>
                  </motion.div>

                  <motion.div className="wh-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }}>
                    <div className="wh-card-header">
                      <span className="wh-card-title">Streak</span>
                      <div className="wh-card-icon"><Trophy size={18} /></div>
                    </div>
                    <div className="wh-stat">{streak}<span style={{ fontSize: ".9rem", color: TEXT_DIM }}> days</span></div>
                    <div className="wh-sub">🌸 Keep going!</div>
                    <div className="wh-bar">
                      <div className="wh-bar-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }} />
                    </div>
                  </motion.div>
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Quick Actions</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                      {[
                        { label: "Log Mood", action: () => setShowMoodModal(true), icon: Smile },
                        { label: "Add Water", action: () => setWater(p => Math.min(waterGoal, p + 1)), icon: Droplets },
                        { label: "Self Care", action: () => setActiveTab("selfcare"), icon: Heart },
                        { label: "Insights", action: () => setActiveTab("insights"), icon: Star },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button key={i} className="wh-btn wh-btn-dark" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }} onClick={item.action}>
                            <Icon size={22} style={{ color: GOLD }} />
                            <span style={{ fontSize: ".82rem" }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Daily Affirmation</span>
                      <div className="wh-card-icon"><Star size={18} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "26px 0" }}>
                      <div style={{ fontSize: "1.15rem", fontWeight: 600, color: GOLD, lineHeight: 1.5, fontStyle: "italic" }}>
                        "{affirmations[affirmationIdx]}"
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wh-card">
                  <div className="wh-card-header">
                    <span className="wh-card-title">Cycle Wellness Insights</span>
                    <div className="wh-card-icon"><Info size={18} /></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ fontWeight: 600, color: GOLD, marginBottom: 3, fontSize: ".85rem" }}>Phase Insight</div>
                      <div style={{ fontSize: ".82rem", color: TEXT_MAIN, lineHeight: 1.5 }}>
                        {cyclePhase.name === "Follicular" ? "Energy is rising! Great time for new goals and workouts." :
                         cyclePhase.name === "Ovulation" ? "Peak confidence window. Social energy is high." :
                         cyclePhase.name === "Luteal" ? "Focus on self-care and rest. Energy may be lower." :
                         "Prioritize rest and gentle movement during this phase."}
                      </div>
                    </div>
                    <div style={{ padding: 14, borderRadius: 12, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ fontWeight: 600, color: GOLD, marginBottom: 3, fontSize: ".85rem" }}>Hydration Check</div>
                      <div style={{ fontSize: ".82rem", color: TEXT_MAIN, lineHeight: 1.5 }}>
                        {water < waterGoal - 2 ? `You've had ${water}/${waterGoal} glasses. Aim for ${waterGoal} glasses daily.` : "Great hydration today! Keep it up."}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CYCLE TRACKER */}
            {activeTab === "cycle" && (
              <motion.div key="cycle" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22, textAlign: "center", padding: "36px 22px" }}>
                  <div style={{ fontSize: "4.5rem", fontWeight: 900, color: cyclePhase.color, marginBottom: 6 }}>{cycleDay}</div>
                  <div style={{ color: TEXT_DIM, fontSize: "1rem", marginBottom: 6 }}>of {cycleLength} days</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 999, background: `${cyclePhase.color}18`, color: cyclePhase.color, fontSize: ".8rem", fontWeight: 600, marginBottom: 28 }}>{cyclePhase.name} Phase</div>

                  <div className="wh-bar" style={{ height: 10, marginBottom: 22 }}>
                    <div className="wh-bar-fill" style={{ width: `${(cycleDay / cycleLength) * 100}%` }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, textAlign: "center" }}>
                    {[{ day: 1, label: "Menstrual" }, { day: 14, label: "Follicular" }, { day: 16, label: "Ovulation" }, { day: 28, label: "Luteal" }].map((p, i) => (
                      <div key={i} style={{ padding: "10px", borderRadius: 10, background: cycleDay <= p.day ? `${cyclePhase.color}18` : DARK_3 }}>
                        <div style={{ fontSize: ".72rem", color: TEXT_DIM }}>Day {p.day}</div>
                        <div style={{ fontSize: ".68rem", color: TEXT_MUTED }}>{p.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
                    <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setCycleDay(d => Math.max(1, d - 1))}><Minus size={12} /></button>
                    <button className="wh-btn wh-btn-gold wh-btn-sm" onClick={() => setCycleDay(d => Math.min(cycleLength, d + 1))}>
                      <Plus size={12} style={{ marginRight: 3 }} />Next Day
                    </button>
                    <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => { setCycleDay(1); setCycleStartDate(new Date().toISOString().split("T")[0]); }}>New Cycle</button>
                  </div>
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Cycle Settings</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 5, display: "block" }}>Start Date</label>
                        <input className="wh-input" type="date" value={cycleStartDate} onChange={e => {
                          setCycleStartDate(e.target.value);
                          const start = new Date(e.target.value);
                          const now = new Date();
                          const diff = Math.floor((now - start) / 864e5);
                          setCycleDay(diff > 0 ? diff % cycleLength : 1);
                        }} />
                      </div>
                      <div>
                        <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 5, display: "block" }}>Cycle Length</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setCycleLength(l => Math.max(21, l - 1))}><Minus size={12} /></button>
                          <span style={{ padding: "6px 20px", color: GOLD, fontWeight: 700, fontSize: "1.1rem" }}>{cycleLength}</span>
                          <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setCycleLength(l => Math.min(40, l + 1))}><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Predictions</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { phase: "Next Period", days: cycleLength - cycleDay },
                        { phase: "Fertile Window", days: Math.max(14 - cycleDay, 0) },
                        { phase: "Peak Energy", days: cycleDay <= 14 ? 14 - cycleDay : cycleLength - cycleDay + 14 },
                      ].map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: 10, background: DARK_3 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: ".85rem" }}>{p.phase}</div>
                            <div style={{ fontSize: ".72rem", color: TEXT_DIM }}>Estimated</div>
                          </div>
                          <div style={{ color: GOLD, fontWeight: 700 }}>{p.days > 0 ? `In ${p.days}d` : "Today"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MOOD TRACKER */}
            {activeTab === "mood" && (
              <motion.div key="mood" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div className="wh-card-header">
                    <span className="wh-card-title">How are you feeling today?</span>
                    <div className="wh-card-icon"><Smile size={18} /></div>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "14px 0", flexWrap: "wrap" }}>
                    {[
                      { value: "Balanced", emoji: "😊" },
                      { value: "Energetic", emoji: "⚡" },
                      { value: "Focused", emoji: "🧘" },
                      { value: "Tired", emoji: "😴" },
                      { value: "Stressed", emoji: "😟" },
                      { value: "Emotional", emoji: "😢" },
                    ].map(m => (
                      <div key={m.value} className={`wh-mood-opt ${mood === m.value ? "active" : ""}`} onClick={() => setMood(m.value)} title={m.value}>
                        {m.emoji}
                      </div>
                    ))}
                  </div>

                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <button className="wh-btn wh-btn-gold" onClick={() => setShowMoodModal(true)}>
                      <Save size={14} style={{ marginRight: 5 }} />Log Mood & Energy
                    </button>
                  </div>
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Mood History</span>
                      <span style={{ fontSize: ".78rem", padding: "4px 12px", borderRadius: 999, background: GOLD_GLOW, color: GOLD, fontWeight: 600 }}>{moodHistory.length} entries</span>
                    </div>
                    {moodHistory.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: TEXT_DIM }}>No mood entries yet. Start tracking!</div>}
                    {moodHistory.map(entry => (
                      <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: DARK_3, border: `1px solid ${DARK_5}`, marginBottom: 8 }}>
                        <span style={{ fontSize: "1.4rem" }}>{getMoodIcon(entry.mood)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: ".88rem" }}>{entry.mood}</div>
                          <div style={{ fontSize: ".72rem", color: TEXT_DIM }}>{entry.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: GOLD, fontWeight: 700 }}>{entry.energy}%</div>
                          <div style={{ fontSize: ".7rem", color: TEXT_DIM }}>energy</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Mood Patterns</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "Most Common", value: mood },
                        { label: "Avg Energy", value: moodHistory.length ? `${Math.round(moodHistory.reduce((a, m) => a + m.energy, 0) / moodHistory.length)}%` : "—" },
                        { label: "Best Mood", value: "Energetic" },
                        { label: "Stability", value: "Good" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: 10, background: DARK_3 }}>
                          <span style={{ color: TEXT_DIM }}>{item.label}</span>
                          <span style={{ color: GOLD, fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showMoodModal && (
                    <motion.div className="wh-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMoodModal(false)}>
                      <motion.div className="wh-card wh-modal-card" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>Log Mood</h3>
                          <button onClick={() => setShowMoodModal(false)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 6, display: "block" }}>Mood</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {["Balanced", "Energetic", "Focused", "Tired", "Stressed", "Emotional"].map(m => (
                                <button key={m} className={`wh-btn wh-btn-sm ${moodModal.mood === m ? "wh-btn-gold" : "wh-btn-dark"}`} onClick={() => setMoodModal({ ...moodModal, mood: m })}>{getMoodIcon(m)} {m}</button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 6, display: "block" }}>Energy Level</label>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setMoodModal({ ...moodModal, energy: Math.max(10, moodModal.energy - 10) })}><Minus size={12} /></button>
                              <span style={{ padding: "6px 20px", color: GOLD, fontWeight: 700 }}>{moodModal.energy}%</span>
                              <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setMoodModal({ ...moodModal, energy: Math.min(100, moodModal.energy + 10) })}><Plus size={12} /></button>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 5, display: "block" }}>Note</label>
                            <textarea className="wh-input" placeholder="How are you feeling?" value={moodModal.note} onChange={e => setMoodModal({ ...moodModal, note: e.target.value })} style={{ minHeight: 50, resize: "vertical" }} />
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                            <button className="wh-btn wh-btn-gold" style={{ flex: 1 }} onClick={addMoodEntry}>Save Entry</button>
                            <button className="wh-btn wh-btn-dark" onClick={() => setShowMoodModal(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SYMPTOMS */}
            {activeTab === "symptoms" && (
              <motion.div key="symptoms" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <span className="wh-card-title">Symptoms Log</span>
                    <button className="wh-btn wh-btn-gold wh-btn-sm" onClick={() => setShowSymptomModal(true)}>
                      <Plus size={12} style={{ marginRight: 3 }} />Add Symptom
                    </button>
                  </div>

                  {symptoms.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: TEXT_DIM }}>
                    <Thermometer size={36} style={{ color: TEXT_MUTED, marginBottom: 14 }} />
                    <div>No symptoms logged</div>
                    <div style={{ fontSize: ".82rem", marginTop: 6 }}>Track how you're feeling daily</div>
                  </div>}

                  {symptoms.map(sym => (
                    <div key={sym.id} className="wh-symptom">
                      <div className="wh-dot" style={{ background: getSeverityColor(sym.severity) }} />
                      <div style={{ flex: 1, fontWeight: 500 }}>{sym.name}</div>
                      <span style={{ fontSize: ".72rem", padding: "3px 7px", borderRadius: 5, background: `${getSeverityColor(sym.severity)}22`, color: getSeverityColor(sym.severity) }}>{sym.severity}</span>
                      <span style={{ fontSize: ".72rem", color: TEXT_DIM }}>{sym.date}</span>
                      <button className="wh-btn wh-btn-dark wh-btn-sm" style={{ padding: "5px 8px" }} onClick={() => deleteSymptom(sym.id)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showSymptomModal && (
                    <motion.div className="wh-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSymptomModal(false)}>
                      <motion.div className="wh-card wh-modal-card" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>Log Symptom</h3>
                          <button onClick={() => setShowSymptomModal(false)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 5, display: "block" }}>Symptom Name</label>
                            <input className="wh-input" placeholder="e.g., Cramps, Headache" value={symptomInput.name} onChange={e => setSymptomInput({ ...symptomInput, name: e.target.value })} />
                          </div>

                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 6, display: "block" }}>Severity</label>
                            <div style={{ display: "flex", gap: 6 }}>
                              {["low", "mild", "moderate", "severe"].map(s => (
                                <button key={s} className={`wh-btn wh-btn-sm ${symptomInput.severity === s ? "wh-btn-gold" : "wh-btn-dark"}`} onClick={() => setSymptomInput({ ...symptomInput, severity: s })}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                            <button className="wh-btn wh-btn-gold" style={{ flex: 1 }} onClick={addSymptom}>Save Symptom</button>
                            <button className="wh-btn wh-btn-dark" onClick={() => setShowSymptomModal(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* HORMONES */}
            {activeTab === "hormones" && (
              <motion.div key="hormones" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div className="wh-card-header">
                    <span className="wh-card-title">Hormone Balance Tracker</span>
                    <div className="wh-card-icon"><Activity size={18} /></div>
                  </div>

                  {hormones.map((h, i) => (
                    <div key={i} className="wh-hormone">
                      <div className="wh-hormone-label">
                        <span style={{ fontWeight: 600 }}>{h.name}</span>
                        <span style={{ color: GOLD }}>{h.value}%</span>
                      </div>
                      <div className="wh-hormone-bar">
                        <div className="wh-hormone-fill" style={{ width: `${h.value}%` }} />
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setHormones(p => p.map(h => ({ ...h, value: Math.max(20, h.value - 5) })))}>Decrease</button>
                    <button className="wh-btn wh-btn-gold wh-btn-sm" onClick={() => setHormones(p => p.map(h => ({ ...h, value: Math.min(100, h.value + 5) })))}>Increase</button>
                  </div>
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Hormone Tips</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ padding: 12, borderRadius: 10, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                        <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".82rem" }}>Estrogen Balance</div>
                        <div style={{ fontSize: ".78rem", color: TEXT_MAIN, lineHeight: 1.5 }}>Include flaxseeds, soy, and leafy greens for natural metabolism.</div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 10, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                        <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".82rem" }}>Cortisol Management</div>
                        <div style={{ fontSize: ".78rem", color: TEXT_MAIN, lineHeight: 1.5 }}>Practice deep breathing. High cortisol disrupts sleep and energy.</div>
                      </div>
                    </div>
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Support Metrics</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Sleep Quality", value: sleep >= 7 ? "Good" : "Improve" },
                        { label: "Stress Level", value: hormones.find(h => h.name === "Cortisol")?.value < 50 ? "Low" : "Moderate" },
                        { label: "Nutrition", value: "Balanced" },
                        { label: "Movement", value: energy >= 60 ? "Active" : "Low" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px", borderRadius: 8, background: DARK_3 }}>
                          <span style={{ color: TEXT_DIM }}>{item.label}</span>
                          <span style={{ color: GOLD, fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUPPLEMENTS */}
            {activeTab === "supplements" && (
              <motion.div key="supplements" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-grid3" style={{ marginBottom: 22 }}>
                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Taken Today</span></div>
                    <div className="wh-stat">{supplements.filter(s => s.taken).length}</div>
                    <div className="wh-sub">of {supplements.length} supplements</div>
                  </div>
                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Pending</span></div>
                    <div className="wh-stat" style={{ color: GOLD_DIM }}>{supplements.filter(s => !s.taken).length}</div>
                    <div className="wh-sub">Remaining doses</div>
                  </div>
                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Adherence</span></div>
                    <div className="wh-stat">{supplements.length > 0 ? Math.round((supplements.filter(s => s.taken).length / supplements.length) * 100) : 0}%</div>
                    <div className="wh-bar">
                      <div className="wh-bar-fill" style={{ width: `${supplements.length > 0 ? (supplements.filter(s => s.taken).length / supplements.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="wh-card">
                  <div className="wh-card-header">
                    <span className="wh-card-title">Today's Supplements</span>
                    <button className="wh-btn wh-btn-gold wh-btn-sm" onClick={() => setShowSuppModal(true)}>
                      <Plus size={12} style={{ marginRight: 3 }} />Add
                    </button>
                  </div>

                  {supplements.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: TEXT_DIM }}>No supplements added yet.</div>}

                  {supplements.map(supp => (
                    <div key={supp.id} className={`wh-supplement ${supp.taken ? "taken" : ""}`} onClick={() => toggleSupplement(supp.id)}>
                      <div className={`wh-check ${supp.taken ? "done" : ""}`}>
                        {supp.taken && <Check size={14} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{supp.name}</div>
                        <div style={{ fontSize: ".78rem", color: TEXT_DIM }}>{supp.dosage}</div>
                      </div>
                      <div style={{ fontSize: ".72rem", color: TEXT_DIM, background: DARK_3, padding: "4px 9px", borderRadius: 6 }}>{supp.time}</div>
                      <button className="wh-btn wh-btn-dark wh-btn-sm" style={{ padding: "5px 8px" }} onClick={e => { e.stopPropagation(); removeSupplement(supp.id); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showSuppModal && (
                    <motion.div className="wh-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSuppModal(false)}>
                      <motion.div className="wh-card wh-modal-card" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>Add Supplement</h3>
                          <button onClick={() => setShowSuppModal(false)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 4, display: "block" }}>Name</label>
                            <input className="wh-input" placeholder="e.g., Vitamin D3" value={newSupplement.name} onChange={e => setNewSupplement({ ...newSupplement, name: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 4, display: "block" }}>Dosage</label>
                            <input className="wh-input" placeholder="e.g., 2000 IU" value={newSupplement.dosage} onChange={e => setNewSupplement({ ...newSupplement, dosage: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 4, display: "block" }}>Time</label>
                            <select className="wh-select" value={newSupplement.time} onChange={e => setNewSupplement({ ...newSupplement, time: e.target.value })}>
                              <option>Morning</option>
                              <option>Lunch</option>
                              <option>Evening</option>
                              <option>Night</option>
                            </select>
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                            <button className="wh-btn wh-btn-gold" style={{ flex: 1 }} onClick={addSupplement}>Add</button>
                            <button className="wh-btn wh-btn-dark" onClick={() => setShowSuppModal(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SELF CARE */}
            {activeTab === "selfcare" && (
              <motion.div key="selfcare" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div className="wh-card-header">
                    <span className="wh-card-title">Daily Self-Care Routine</span>
                    <span style={{ fontSize: ".78rem", padding: "4px 12px", borderRadius: 999, background: GOLD_GLOW, color: GOLD, fontWeight: 600 }}>{selfCare.filter(a => a.done).length}/{selfCare.length} done</span>
                  </div>

                  <div className="wh-bar" style={{ marginBottom: 20 }}>
                    <div className="wh-bar-fill" style={{ width: `${(selfCare.filter(a => a.done).length / selfCare.length) * 100}%` }} />
                  </div>

                  {selfCare.map(act => (
                    <div key={act.id} className={`wh-routine ${act.done ? "done" : ""}`} onClick={() => toggleSelfCare(act.id)}>
                      <div className={`wh-check ${act.done ? "done" : ""}`}>
                        {act.done && <Check size={14} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: act.done ? TEXT_DIM : TEXT_MAIN }}>{act.name}</div>
                        <div style={{ fontSize: ".72rem", color: TEXT_DIM, marginTop: 2 }}>{act.duration} • {act.category}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Water Intake</span>
                      <div className="wh-card-icon"><Droplets size={18} /></div>
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "14px 0" }}>
                      {Array.from({ length: waterGoal }).map((_, i) => (
                        <div key={i} className={`wh-water ${i < water ? "filled" : ""}`} onClick={() => setWater(i + 1 === water ? i : i + 1)}>
                          <Droplets size={14} />
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: ".85rem" }}>{water}/{waterGoal} glasses</div>
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header">
                      <span className="wh-card-title">Sleep Tracker</span>
                      <div className="wh-card-icon"><Moon size={18} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "18px 0" }}>
                      <div style={{ fontSize: "2.8rem", fontWeight: 900, color: GOLD }}>{sleep}h</div>
                      <div style={{ color: TEXT_DIM, marginTop: 3 }}>{sleep >= 7 ? "Great sleep!" : "Try for 7-8 hours"}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
                        <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setSleep(h => Math.max(4, Math.round((h - 0.5) * 2) / 2))}><Minus size={12} /></button>
                        <button className="wh-btn wh-btn-dark wh-btn-sm" onClick={() => setSleep(h => Math.min(12, Math.round((h + 0.5) * 2) / 2))}><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROGRAMS */}
            {activeTab === "programs" && (
              <motion.div key="programs" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card">
                  <div className="wh-card-header">
                    <span className="wh-card-title">Wellness Programs</span>
                  </div>

                  <div className="wh-grid3">
                    {programs.map(prog => (
                      <div key={prog.id} className="wh-program">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{prog.name}</div>
                            <div style={{ fontSize: ".78rem", color: TEXT_DIM, marginTop: 3 }}>{prog.duration}</div>
                          </div>
                          <span style={{ fontSize: ".72rem", padding: "3px 7px", borderRadius: 5, background: GOLD_GLOW, color: GOLD, fontWeight: 600 }}>{prog.category}</span>
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: ".72rem", color: TEXT_DIM }}>Progress</span>
                            <span style={{ fontSize: ".72rem", color: GOLD, fontWeight: 700 }}>{prog.progress}%</span>
                          </div>
                          <div className="wh-bar">
                            <div className="wh-bar-fill" style={{ width: `${prog.progress}%` }} />
                          </div>
                        </div>

                        <button className="wh-btn wh-btn-gold wh-btn-sm" style={{ width: "100%", marginTop: 10 }} onClick={() => {
                          setPrograms(prev => prev.map(p => p.id === prog.id ? { ...p, progress: Math.min(100, p.progress + 10) } : p));
                        }}>
                          <Plus size={12} style={{ marginRight: 3 }} />Continue
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* JOURNAL */}
            {activeTab === "journal" && (
              <motion.div key="journal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div className="wh-card-header">
                    <span className="wh-card-title">Health Journal</span>
                    <button className="wh-btn wh-btn-gold wh-btn-sm" onClick={() => setShowJournalModal(true)}>
                      <Plus size={12} style={{ marginRight: 3 }} />New Entry
                    </button>
                  </div>

                  {journal.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: TEXT_DIM }}>
                    <BookOpen size={36} style={{ color: TEXT_MUTED, marginBottom: 14 }} />
                    <div>No journal entries yet</div>
                    <div style={{ fontSize: ".82rem", marginTop: 6 }}>Start writing your health journey</div>
                  </div>}

                  {journal.map(entry => (
                    <div key={entry.id} className="wh-journal-item">
                      <div className="wh-journal-head">
                        <span className="wh-journal-date">{entry.date}</span>
                        <span className="wh-journal-mood">{entry.mood}</span>
                      </div>
                      <div className="wh-journal-title">{entry.title}</div>
                      <div className="wh-journal-content">{entry.content}</div>
                      <div style={{ marginTop: 6 }}>
                        <button className="wh-btn wh-btn-dark wh-btn-sm" style={{ padding: "4px 8px" }} onClick={() => deleteJournal(entry.id)}>
                          <Trash2 size={10} style={{ marginRight: 3 }} />Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showJournalModal && (
                    <motion.div className="wh-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowJournalModal(false)}>
                      <motion.div className="wh-card wh-modal-card" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>New Journal Entry</h3>
                          <button onClick={() => setShowJournalModal(false)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 4, display: "block" }}>Title</label>
                            <input className="wh-input" placeholder="e.g., Feeling centered today" value={journalInput.title} onChange={e => setJournalInput({ ...journalInput, title: e.target.value })} />
                          </div>

                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 5, display: "block" }}>Mood</label>
                            <div style={{ display: "flex", gap: 8 }}>
                              {["😊", "😄", "😐", "😟", "😢", "😴"].map(m => (
                                <div key={m} className={`wh-mood-opt ${journalInput.mood === m ? "active" : ""}`} onClick={() => setJournalInput({ ...journalInput, mood: m })} style={{ width: 36, height: 36, fontSize: "1.1rem" }}>{m}</div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: ".78rem", color: TEXT_DIM, marginBottom: 4, display: "block" }}>Content</label>
                            <textarea className="wh-input" placeholder="Write about your day..." value={journalInput.content} onChange={e => setJournalInput({ ...journalInput, content: e.target.value })} style={{ minHeight: 80, resize: "vertical", lineHeight: 1.5 }} />
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                            <button className="wh-btn wh-btn-gold" style={{ flex: 1 }} onClick={addJournalEntry}>Save Entry</button>
                            <button className="wh-btn wh-btn-dark" onClick={() => setShowJournalModal(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* INSIGHTS */}
            {activeTab === "insights" && (
              <motion.div key="insights" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .25 }}>
                <div className="wh-card" style={{ marginBottom: 22 }}>
                  <div className="wh-card-header">
                    <span className="wh-card-title">Wellness Analysis</span>
                    <div className="wh-card-icon"><Star size={18} /></div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ padding: 13, borderRadius: 11, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".82rem" }}>Cycle Phase</div>
                      <div style={{ fontSize: ".8rem", color: TEXT_MAIN, lineHeight: 1.5 }}>
                        {cyclePhase.name === "Follicular" ? "Estrogen rising. High energy and creativity. Perfect for workouts and projects." :
                         cyclePhase.name === "Ovulation" ? "Peak confidence. Great for social events and important conversations." :
                         cyclePhase.name === "Luteal" ? "Progesterone dominant. Focus on self-care, rest, and gentle exercise." :
                         "Allow yourself to rest. Light stretching and warm foods are beneficial."}
                      </div>
                    </div>
                    <div style={{ padding: 13, borderRadius: 11, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".82rem" }}>Overall Wellness</div>
                      <div style={{ fontSize: ".8rem", color: TEXT_MAIN, lineHeight: 1.5 }}>
                        Score: {healthScore}/100. {healthScore >= 80 ? "Excellent! Keep maintaining your routine." : healthScore >= 60 ? "Good progress. Focus on sleep and stress." : "Let's build healthy habits together. Start with hydration."}
                      </div>
                    </div>
                    <div style={{ padding: 13, borderRadius: 11, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".82rem" }}>Mood & Stress</div>
                      <div style={{ fontSize: ".8rem", color: TEXT_MAIN, lineHeight: 1.5 }}>
                        Mood: {mood} • Energy: {energy}%. {mood === "Stressed" || mood === "Emotional" ? "Consider deep breathing or meditation." : energy < 60 ? "Ensure iron and B vitamins intake, prioritize rest." : "Balanced mood and energy. Keep it up!"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wh-grid2">
                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Recommendations</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {water < waterGoal - 2 && (
                        <div style={{ padding: 12, borderRadius: 10, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                          <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".8rem" }}>Hydration</div>
                          <div style={{ fontSize: ".78rem", color: TEXT_MAIN }}>Drink {waterGoal - water} more glasses today for better hormone balance.</div>
                        </div>
                      )}
                      {sleep < 7 && (
                        <div style={{ padding: 12, borderRadius: 10, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                          <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".8rem" }}>Sleep</div>
                          <div style={{ fontSize: ".78rem", color: TEXT_MAIN }}>Aim for 7-8 hours. Quality sleep regulates hormones.</div>
                        </div>
                      )}
                      <div style={{ padding: 12, borderRadius: 10, background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}` }}>
                        <div style={{ fontWeight: 600, color: GOLD, marginBottom: 2, fontSize: ".8rem" }}>Movement</div>
                        <div style={{ fontSize: ".78rem", color: TEXT_MAIN }}>Continue {selfCare.filter(a => a.done).length} self-care activities daily.</div>
                      </div>
                    </div>
                  </div>

                  <div className="wh-card">
                    <div className="wh-card-header"><span className="wh-card-title">Score Breakdown</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { label: "Cycle Health", value: 85 },
                        { label: "Mood Balance", value: energy },
                        { label: "Hydration", value: (water / waterGoal) * 100 },
                        { label: "Sleep Quality", value: (sleep / 8) * 100 },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: ".82rem", color: TEXT_MAIN }}>{item.label}</span>
                            <span style={{ fontSize: ".82rem", color: GOLD, fontWeight: 700 }}>{Math.round(item.value)}%</span>
                          </div>
                          <div className="wh-bar">
                            <div className="wh-bar-fill" style={{ width: `${Math.min(item.value, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
