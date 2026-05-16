import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Moon,
  Sparkles,
  Activity,
  CalendarDays,
  Flower2,
  ShieldCheck,
  Flame,
  Bell,
  PlayCircle,
  Plus,
  Minus,
  X,
  Menu,
  User,
  Settings,
  Search,
  BarChart3,
  FileText,
  Send,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Target,
  Trophy,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BookOpen,
  Droplets,
  Brain,
  Zap,
  Coffee,
  Wind,
  BedDouble,
  Scale,
  Pill,
  HeartPulse,
  Calendar,
  MessageCircle,
  Smile,
  Frown,
  Meh,
  Sun,
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  LogOut,
  BellRing,
  ChevronLeft,
  Save,
  CalendarRange,
  Thermometer,
  Eye,
  Hand,
  Headphones,
  Award,
} from "lucide-react";

export default function WomenHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cycleDay, setCycleDay] = useState(12);
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleStartDate, setCycleStartDate] = useState(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [energy, setEnergy] = useState(78);
  const [mood, setMood] = useState("Balanced");
  const [streak, setStreak] = useState(18);
  const [symptoms, setSymptoms] = useState([
    { id: 1, name: "Cramps", severity: "mild", date: "Today", logged: true },
    { id: 2, name: "Headache", severity: "moderate", date: "Today", logged: true },
    { id: 3, name: "Bloating", severity: "mild", date: "Yesterday", logged: true },
    { id: 4, name: "Fatigue", severity: "low", date: "2 days ago", logged: true },
  ]);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [newSymptom, setNewSymptom] = useState({ name: "", severity: "mild" });
  const [moodHistory, setMoodHistory] = useState([
    { id: 1, date: "Today", mood: "Balanced", energy: 78, note: "Feeling good today" },
    { id: 2, date: "Yesterday", mood: "Energetic", energy: 85, note: "Great workout session" },
    { id: 3, date: "2 days ago", mood: "Stressed", energy: 60, note: "Work deadline pressure" },
    { id: 4, date: "3 days ago", mood: "Tired", energy: 55, note: "Poor sleep last night" },
    { id: 5, date: "4 days ago", mood: "Focused", energy: 80, note: "Productive day" },
  ]);
  const [showMoodLog, setShowMoodLog] = useState(false);
  const [moodLogInput, setMoodLogInput] = useState({ mood: "Balanced", energy: 70, note: "" });
  const [supplements, setSupplements] = useState([
    { id: 1, name: "Vitamin D3", dosage: "2000 IU", time: "Morning", taken: false },
    { id: 2, name: "Iron", dosage: "18mg", time: "Evening", taken: false },
    { id: 3, name: "Omega-3", dosage: "1000mg", time: "Lunch", taken: false },
    { id: 4, name: "Magnesium", dosage: "400mg", time: "Night", taken: false },
    { id: 5, name: "B-Complex", dosage: "Daily", time: "Morning", taken: false },
  ]);
  const [selfCareActivities, setSelfCareActivities] = useState([
    { id: 1, name: "Morning Meditation", duration: "10 min", done: false, category: "Mindfulness" },
    { id: 2, name: "Gentle Yoga", duration: "20 min", done: false, category: "Movement" },
    { id: 3, name: "Journaling", duration: "15 min", done: false, category: "Reflection" },
    { id: 4, name: "Skin Care Routine", duration: "10 min", done: false, category: "Self Care" },
    { id: 5, name: "Read a Book", duration: "30 min", done: false, category: "Relaxation" },
    { id: 6, name: "Warm Bath", duration: "20 min", done: false, category: "Relaxation" },
  ]);
  const [wellnessPrograms, setWellnessPrograms] = useState([
    { id: 1, name: "Hormone Balance", duration: "14 days", progress: 65, category: "Popular", completed: false },
    { id: 2, name: "Cycle Wellness", duration: "Daily", progress: 80, category: "Tracking", completed: false },
    { id: 3, name: "Stress & Mood Care", duration: "7 days", progress: 40, category: "Mind Care", completed: false },
    { id: 4, name: "Energy Recovery", duration: "10 days", progress: 25, category: "Boost", completed: false },
    { id: 5, name: "Sleep Optimization", duration: "7 days", progress: 50, category: "Rest", completed: false },
    { id: 6, name: "Nutrition Balance", duration: "14 days", progress: 30, category: "Diet", completed: false },
  ]);
  const [healthJournal, setHealthJournal] = useState([
    { id: 1, date: "Today", title: "Feeling centered", content: "Had a great morning routine today. Meditation really helped me start the day with clarity.", mood: "😊" },
    { id: 2, date: "Yesterday", title: "Productive day", content: "Finished a big project at work. Felt accomplished and energized.", mood: "😄" },
  ]);
  const [journalInput, setJournalInput] = useState({ title: "", content: "", mood: "😊" });
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [healthScore, setHealthScore] = useState(85);
  const [waterIntake, setWaterIntake] = useState(6);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [hormoneLevels, setHormoneLevels] = useState({ estrogen: 65, progesterone: 70, cortisol: 45, serotonin: 80 });
  const [hydrationGoal, setHydrationGoal] = useState(8);
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  const affirmations = [
    "I am strong, capable, and worthy of all good things.",
    "My body is resilient and knows how to heal itself.",
    "I embrace my emotions and honor my needs.",
    "Every day I am growing into my best self.",
    "I deserve rest, care, and compassion.",
    "My wellness journey is uniquely mine, and I trust it.",
  ];

  useEffect(() => {
    const saved = localStorage.getItem("womenHealthData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCycleDay(parsed.cycleDay || 12);
      setCycleLength(parsed.cycleLength || 28);
      setCycleStartDate(parsed.cycleStartDate || cycleStartDate);
      setEnergy(parsed.energy || 78);
      setMood(parsed.mood || "Balanced");
      setStreak(parsed.streak || 18);
      setSymptoms(parsed.symptoms || symptoms);
      setMoodHistory(parsed.moodHistory || moodHistory);
      setSupplements(parsed.supplements || supplements);
      setSelfCareActivities(parsed.selfCareActivities || selfCareActivities);
      setWellnessPrograms(parsed.wellnessPrograms || wellnessPrograms);
      setHealthJournal(parsed.healthJournal || healthJournal);
      setHealthScore(parsed.healthScore || 85);
      setWaterIntake(parsed.waterIntake || 6);
      setSleepHours(parsed.sleepHours || 7.5);
      setHormoneLevels(parsed.hormoneLevels || hormoneLevels);
    }
  }, []);

  useEffect(() => {
    const data = {
      cycleDay, cycleLength, cycleStartDate, energy, mood, streak, symptoms,
      moodHistory, supplements, selfCareActivities, wellnessPrograms,
      healthJournal, healthScore, waterIntake, sleepHours, hormoneLevels,
    };
    localStorage.setItem("womenHealthData", JSON.stringify(data));
  }, [cycleDay, cycleLength, cycleStartDate, energy, mood, streak, symptoms, moodHistory, supplements, selfCareActivities, wellnessPrograms, healthJournal, healthScore, waterIntake, sleepHours, hormoneLevels]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAffirmationIndex((prev) => (prev + 1) % affirmations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const cyclePhase = useMemo(() => {
    if (cycleDay <= 5) return { name: "Menstrual", color: "#EF4444", icon: Droplets };
    if (cycleDay <= 14) return { name: "Follicular", color: "#FFD700", icon: Sun };
    if (cycleDay <= 16) return { name: "Ovulation", color: "#F59E0B", icon: Flame };
    return { name: "Luteal", color: "#8B5CF6", icon: Moon };
  }, [cycleDay]);

  const notifications = useMemo(() => {
    const notifs = [];
    if (supplements.filter((s) => !s.taken).length > 0) {
      notifs.push({ id: 1, type: "warning", message: `${supplements.filter((s) => !s.taken).length} supplements pending today` });
    }
    if (waterIntake < 6) {
      notifs.push({ id: 2, type: "info", message: `Drink ${hydrationGoal - waterIntake} more glasses of water` });
    }
    if (energy < 50) {
      notifs.push({ id: 3, type: "alert", message: "Low energy detected. Consider a rest day." });
    }
    if (selfCareActivities.filter((a) => a.done).length === 0) {
      notifs.push({ id: 4, type: "info", message: "Start your daily self-care routine" });
    }
    return notifs;
  }, [supplements, waterIntake, hydrationGoal, energy, selfCareActivities]);

  const addSymptom = useCallback(() => {
    if (!newSymptom.name.trim()) return;
    setSymptoms((prev) => [
      { id: Date.now(), name: newSymptom.name, severity: newSymptom.severity, date: "Today", logged: true },
      ...prev,
    ]);
    setNewSymptom({ name: "", severity: "mild" });
    setShowAddSymptom(false);
  }, [newSymptom]);

  const toggleSupplement = useCallback((id) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taken: !s.taken } : s))
    );
  }, []);

  const toggleSelfCare = useCallback((id) => {
    setSelfCareActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }, []);

  const addMoodEntry = useCallback(() => {
    if (!moodLogInput.mood) return;
    setMoodHistory((prev) => [
      { id: Date.now(), date: new Date().toLocaleDateString(), ...moodLogInput },
      ...prev,
    ]);
    setMoodLogInput({ mood: "Balanced", energy: 70, note: "" });
    setShowMoodLog(false);
  }, [moodLogInput]);

  const addJournalEntry = useCallback(() => {
    if (!journalInput.title.trim()) return;
    setHealthJournal((prev) => [
      { id: Date.now(), date: new Date().toLocaleDateString(), ...journalInput },
      ...prev,
    ]);
    setJournalInput({ title: "", content: "", mood: "😊" });
    setShowAddJournal(false);
  }, [journalInput]);

  const deleteJournalEntry = useCallback((id) => {
    setHealthJournal((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const deleteSymptom = useCallback((id) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "cycle", label: "Cycle Tracker", icon: CalendarRange },
    { id: "mood", label: "Mood Tracker", icon: Smile },
    { id: "symptoms", label: "Symptoms Log", icon: Thermometer },
    { id: "hormones", label: "Hormone Balance", icon: Flower2 },
    { id: "supplements", label: "Supplements", icon: Pill },
    { id: "selfcare", label: "Self Care", icon: Heart },
    { id: "programs", label: "Wellness Programs", icon: Target },
    { id: "journal", label: "Health Journal", icon: BookOpen },
    { id: "insights", label: "AI Insights", icon: Sparkles },
  ];

  const getMoodEmoji = (m) => {
    const map = { "Balanced": "😊", "Tired": "😴", "Stressed": "😟", "Focused": "🧘", "Emotional": "😢", "Energetic": "⚡" };
    return map[m] || "😊";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; font-family: 'Inter', sans-serif; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,215,0,0.5); }

        .app-container { display: flex; min-height: 100vh; background: #000; color: white; overflow: hidden; }
        .sidebar { width: 280px; background: linear-gradient(180deg, #0a0a0a 0%, #000 100%); border-right: 1px solid rgba(255,215,0,0.12); padding: 24px 0; position: fixed; height: 100vh; z-index: 50; display: flex; flex-direction: column; transition: transform 0.3s ease; }
        .sidebar-logo { display: flex; align-items: center; gap: 12px; padding: 0 24px; margin-bottom: 32px; }
        .sidebar-logo-icon { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #FFD700, #D4AF37); display: flex; align-items: center; justify-content: center; color: #000; }
        .sidebar-logo-text { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #FFD700, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sidebar-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; font-weight: 500; color: #888; border: none; background: none; width: 100%; text-align: left; font-size: 0.95rem; }
        .nav-item:hover { background: rgba(255,215,0,0.06); color: #FFD700; }
        .nav-item.active { background: rgba(255,215,0,0.1); color: #FFD700; font-weight: 600; }
        .nav-item svg { width: 20px; height: 20px; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,215,0,0.08); margin-top: auto; }
        .sidebar-profile { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: rgba(255,255,255,0.03); }
        .profile-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FFD700, #D4AF37); display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700; }
        .profile-info { flex: 1; }
        .profile-name { font-size: 0.9rem; font-weight: 600; color: #fff; }
        .profile-role { font-size: 0.75rem; color: #888; }
        .main-content { flex: 1; margin-left: 280px; padding: 32px; overflow-y: auto; max-height: 100vh; background: radial-gradient(circle at top left, rgba(255,215,0,0.06), transparent 40%), radial-gradient(circle at bottom right, rgba(212,175,55,0.04), transparent 35%), #000; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .top-bar-left h1 { font-size: 2rem; font-weight: 800; color: #fff; }
        .top-bar-left p { color: #888; font-size: 0.9rem; margin-top: 4px; }
        .top-bar-right { display: flex; align-items: center; gap: 12px; }
        .top-bar-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.1); color: #888; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; position: relative; }
        .top-bar-btn:hover { background: rgba(255,215,0,0.08); color: #FFD700; border-color: rgba(255,215,0,0.2); }
        .notif-badge { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; background: #EF4444; color: white; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .notification-dropdown { position: absolute; top: 52px; right: 0; width: 320px; background: #111; border: 1px solid rgba(255,215,0,0.15); border-radius: 18px; padding: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 100; }
        .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.03); }
        .notif-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-text { font-size: 0.85rem; color: #ccc; line-height: 1.4; }
        .notif-time { font-size: 0.7rem; color: #666; margin-top: 4px; }
        .mobile-menu-btn { display: none; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.1); color: #888; align-items: center; justify-content: center; cursor: pointer; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
        .card { background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,215,0,0.1); border-radius: 24px; padding: 24px; backdrop-filter: blur(14px); transition: all 0.3s ease; }
        .card:hover { border-color: rgba(255,215,0,0.2); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 0.9rem; color: #888; font-weight: 500; }
        .card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); color: #FFD700; }
        .stat-value { font-size: 2.4rem; font-weight: 800; color: #FFD700; line-height: 1; margin-bottom: 8px; }
        .stat-sub { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #888; }
        .trend-up { color: #10B981; }
        .trend-down { color: #EF4444; }
        .progress-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; margin-top: 16px; }
        .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #FFD700, #D4AF37); transition: width 0.5s ease; }
        .health-score-ring { width: 140px; height: 140px; margin: 0 auto; position: relative; }
        .health-score-ring svg { transform: rotate(-90deg); }
        .health-score-ring .score-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .health-score-ring .score-number { font-size: 2.2rem; font-weight: 900; color: #FFD700; line-height: 1; }
        .health-score-ring .score-label { font-size: 0.7rem; color: #888; margin-top: 2px; }
        .btn { border: none; cursor: pointer; transition: all 0.2s ease; font-weight: 600; font-family: 'Inter', sans-serif; }
        .btn-primary { background: linear-gradient(135deg, #FFD700, #D4AF37); color: #000; padding: 12px 24px; border-radius: 14px; font-size: 0.9rem; box-shadow: 0 8px 24px rgba(255,215,0,0.2); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,215,0,0.3); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; padding: 12px 24px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.15); font-size: 0.9rem; }
        .btn-secondary:hover { background: rgba(255,215,0,0.08); border-color: rgba(255,215,0,0.25); }
        .btn-sm { padding: 8px 16px; font-size: 0.8rem; border-radius: 10px; }
        .btn-danger { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
        .input-field { width: 100%; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.12); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; transition: all 0.2s ease; }
        .input-field:focus { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.04); }
        .input-field::placeholder { color: #555; }
        .select-field { width: 100%; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(255,215,0,0.12); background: rgba(255,255,255,0.04); color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; appearance: none; cursor: pointer; }
        .select-field option { background: #111; color: #fff; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .badge-gold { background: rgba(255,215,0,0.12); color: #FFD700; }
        .badge-green { background: rgba(16,185,129,0.12); color: #10B981; }
        .badge-red { background: rgba(239,68,68,0.12); color: #EF4444; }
        .insight-card { padding: 16px; border-radius: 14px; background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; }
        .insight-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,215,0,0.12); display: flex; align-items: center; justify-content: center; color: #FFD700; flex-shrink: 0; }
        .insight-text { font-size: 0.85rem; color: #ccc; line-height: 1.5; }
        .insight-title { font-weight: 600; color: #FFD700; margin-bottom: 4px; }
        .symptom-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 10px; transition: all 0.2s ease; }
        .symptom-item:hover { background: rgba(255,215,0,0.04); }
        .symptom-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .symptom-name { flex: 1; font-weight: 500; }
        .symptom-severity { font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; }
        .severity-mild { background: rgba(16,185,129,0.12); color: #10B981; }
        .severity-moderate { background: rgba(255,215,0,0.12); color: #FFD700; }
        .severity-severe { background: rgba(239,68,68,0.12); color: #EF4444; }
        .severity-low { background: rgba(59,130,246,0.12); color: #3B82F6; }
        .routine-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px; }
        .routine-item:hover { background: rgba(255,215,0,0.04); }
        .routine-item.completed { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.25); }
        .routine-check { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; }
        .routine-check.completed { background: #FFD700; border-color: #FFD700; color: #000; }
        .routine-text { flex: 1; font-weight: 500; }
        .routine-text.completed { text-decoration: line-through; color: #888; }
        .mood-selector { display: flex; gap: 12px; justify-content: center; margin: 16px 0; flex-wrap: wrap; }
        .mood-option { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 1.5rem; }
        .mood-option:hover { transform: scale(1.1); }
        .mood-option.active { border-color: #FFD700; background: rgba(255,215,0,0.12); }
        .water-drop { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,215,0,0.1); border: 2px solid rgba(255,215,0,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; color: #FFD700; }
        .water-drop.filled { background: rgba(255,215,0,0.25); border-color: #FFD700; }
        .water-drop:hover { transform: scale(1.1); }
        .journal-item { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; }
        .journal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .journal-date { font-size: 0.75rem; color: #666; }
        .journal-mood { font-size: 1.4rem; }
        .journal-title { font-weight: 700; font-size: 1.05rem; color: #FFD700; margin-bottom: 6px; }
        .journal-content { color: #ccc; line-height: 1.6; font-size: 0.9rem; }
        .journal-actions { display: flex; gap: 8px; margin-top: 8px; }
        .program-card { padding: 20px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); transition: all 0.3s ease; cursor: pointer; }
        .program-card:hover { border-color: rgba(255,215,0,0.3); }
        .program-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .program-name { font-weight: 700; font-size: 1.05rem; }
        .program-category { font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; background: rgba(255,215,0,0.12); color: #FFD700; }
        .program-progress { margin-top: 12px; }
        .supplement-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; transition: all 0.2s ease; cursor: pointer; }
        .supplement-item:hover { background: rgba(255,215,0,0.04); }
        .supplement-item.taken { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.25); }
        .supplement-check { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .supplement-check.taken { background: #FFD700; border-color: #FFD700; color: #000; }
        .supplement-info { flex: 1; }
        .supplement-name { font-weight: 600; }
        .supplement-dosage { font-size: 0.8rem; color: #888; }
        .supplement-time { font-size: 0.75rem; color: #666; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 8px; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40; }
        .hormone-meter { margin-bottom: 20px; }
        .hormone-label { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: #ccc; }
        .hormone-bar { height: 10px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
        .hormone-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
        @media (max-width: 1200px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 1024px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.active { display: block; }
          .main-content { margin-left: 0; padding: 20px 16px; }
          .mobile-menu-btn { display: flex; }
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .top-bar { flex-wrap: wrap; gap: 16px; }
        }
      `}</style>

      <div className="app-container">
        <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><Flower2 size={22} /></div>
            <span className="sidebar-logo-text">WomenAI</span>
          </div>

          <nav className="sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-profile">
              <div className="profile-avatar">JD</div>
              <div className="profile-info">
                <div className="profile-name">Jane Doe</div>
                <div className="profile-role">Premium Member</div>
              </div>
              <Settings size={18} style={{ color: "#666", cursor: "pointer" }} />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={20} />
              </button>
              <div className="top-bar-left">
                <h1>{tabs.find((t) => t.id === activeTab)?.label || "Dashboard"}</h1>
                <p>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>

            <div className="top-bar-right">
              <div style={{ position: "relative" }}>
                <button className="top-bar-btn" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={18} />
                  {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="notification-dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16, color: "#FFD700" }}>Notifications</div>
                      {notifications.map((notif) => (
                        <div key={notif.id} className="notif-item">
                          <div className="notif-icon" style={{
                            background: notif.type === "alert" ? "rgba(239,68,68,0.15)" : notif.type === "warning" ? "rgba(255,215,0,0.15)" : "rgba(59,130,246,0.15)",
                            color: notif.type === "alert" ? "#EF4444" : notif.type === "warning" ? "#FFD700" : "#3B82F6",
                          }}>
                            {notif.type === "alert" ? <AlertTriangle size={16} /> : notif.type === "warning" ? <AlertCircle size={16} /> : <Info size={16} />}
                          </div>
                          <div>
                            <div className="notif-text">{notif.message}</div>
                            <div className="notif-time">Just now</div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#666" }}>No notifications</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="top-bar-btn"><BellRing size={18} /></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-4">
                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="card-header">
                      <span className="card-title">Health Score</span>
                      <div className="card-icon"><Sparkles size={20} /></div>
                    </div>
                    <div className="health-score-ring">
                      <svg width="140" height="140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="12" />
                        <circle cx="70" cy="70" r="60" fill="none" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${healthScore * 3.77} ${377 - healthScore * 3.77}`} style={{ transition: "stroke-dasharray 1s ease" }} />
                        <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#D4AF37" /></linearGradient></defs>
                      </svg>
                      <div className="score-value">
                        <div className="score-number">{healthScore}</div>
                        <div className="score-label">/ 100</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="card-header">
                      <span className="card-title">Cycle Phase</span>
                      <div className="card-icon"><CalendarDays size={20} /></div>
                    </div>
                    <div className="stat-value" style={{ color: cyclePhase.color }}>{cyclePhase.name}</div>
                    <div className="stat-sub">Day {cycleDay} of {cycleLength}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(cycleDay / cycleLength) * 100}%`, background: cyclePhase.color }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="card-header">
                      <span className="card-title">Energy Level</span>
                      <div className="card-icon"><Zap size={20} /></div>
                    </div>
                    <div className="stat-value">{energy}%</div>
                    <div className="stat-sub">{energy >= 70 ? <span className="trend-up">High</span> : energy >= 40 ? <span style={{ color: "#FFD700" }}>Moderate</span> : <span className="trend-down">Low</span>}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${energy}%`, background: energy >= 70 ? "linear-gradient(90deg, #10B981, #059669)" : energy >= 40 ? "linear-gradient(90deg, #FFD700, #D4AF37)" : "linear-gradient(90deg, #EF4444, #DC2626)" }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="card-header">
                      <span className="card-title">Streak</span>
                      <div className="card-icon"><Trophy size={20} /></div>
                    </div>
                    <div className="stat-value">{streak}<span style={{ fontSize: "1rem", color: "#888" }}> days</span></div>
                    <div className="stat-sub"><span className="trend-up">🌸 Keep going!</span></div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }} />
                    </div>
                  </motion.div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Quick Actions</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      {[
                        { label: "Log Mood", action: () => setActiveTab("mood"), icon: Smile },
                        { label: "Add Water", action: () => setWaterIntake((v) => Math.min(hydrationGoal, v + 1)), icon: Droplets },
                        { label: "Self Care", action: () => setActiveTab("selfcare"), icon: Heart },
                        { label: "AI Insights", action: () => setActiveTab("insights"), icon: Sparkles },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button key={i} className="btn btn-secondary" style={{ padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }} onClick={item.action}>
                            <Icon size={24} style={{ color: "#FFD700" }} />
                            <span style={{ fontSize: "0.85rem" }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Daily Affirmation</span>
                      <div className="card-icon"><Star size={20} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 600, color: "#FFD700", lineHeight: 1.6, fontStyle: "italic" }}>
                        "{affirmations[affirmationIndex]}"
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">AI Wellness Insights</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Moon size={18} /></div>
                    <div>
                      <div className="insight-title">Cycle Phase Insight</div>
                      <div className="insight-text">
                        {cyclePhase.name === "Follicular" ? "Energy is rising! Great time for new goals and workouts." : cyclePhase.name === "Ovulation" ? "Peak fertility window. Social confidence is high." : cyclePhase.name === "Luteal" ? "Focus on self-care and rest. Energy may be lower." : "Prioritize rest and gentle movement during this phase."}
                      </div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Droplets size={18} /></div>
                    <div>
                      <div className="insight-title">Hydration Reminder</div>
                      <div className="insight-text">
                        {waterIntake < 6 ? `You've had ${waterIntake}/${hydrationGoal} glasses. Aim for 8 glasses daily for optimal hormone balance.` : "Great hydration today! Keep it up for better skin and energy."}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CYCLE TRACKER */}
            {activeTab === "cycle" && (
              <motion.div key="cycle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: "40px 24px" }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 24 }}>
                    <span className="card-title" style={{ fontSize: "1.4rem", color: "#FFD700" }}>Cycle Wellness Tracker</span>
                  </div>

                  <div style={{ fontSize: "5rem", fontWeight: 900, color: cyclePhase.color, marginBottom: 8 }}>{cycleDay}</div>
                  <div style={{ color: "#888", fontSize: "1.1rem", marginBottom: 8 }}>of {cycleLength} days</div>
                  <div className="badge" style={{ marginBottom: 32, background: `${cyclePhase.color}20`, color: cyclePhase.color }}>{cyclePhase.name} Phase</div>

                  <div className="progress-bar" style={{ height: 12, marginBottom: 24 }}>
                    <div className="progress-fill" style={{ width: `${(cycleDay / cycleLength) * 100}%`, background: cyclePhase.color }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, textAlign: "center" }}>
                    {[
                      { day: 1, label: "Menstrual" },
                      { day: 14, label: "Follicular" },
                      { day: 16, label: "Ovulation" },
                      { day: 28, label: "Luteal" },
                    ].map((phase, i) => (
                      <div key={i} style={{ padding: "12px", borderRadius: 12, background: cycleDay <= phase.day ? `${cyclePhase.color}20` : "rgba(255,255,255,0.03)" }}>
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>Day {phase.day}</div>
                        <div style={{ fontSize: "0.7rem", color: "#666" }}>{phase.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setCycleDay((d) => Math.max(1, d - 1))}><Minus size={14} /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => setCycleDay((d) => Math.min(cycleLength, d + 1))}>
                      <Plus size={14} style={{ marginRight: 4 }} />Next Day
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setCycleDay(1); setCycleStartDate(new Date().toISOString().split("T")[0]); }}>New Cycle</button>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Cycle Settings</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Cycle Start Date</label>
                        <input className="input-field" type="date" value={cycleStartDate} onChange={(e) => {
                          setCycleStartDate(e.target.value);
                          const start = new Date(e.target.value);
                          const now = new Date();
                          const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                          setCycleDay(diff > 0 ? diff % cycleLength : 1);
                        }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Cycle Length (days)</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setCycleLength((l) => Math.max(21, l - 1))}><Minus size={14} /></button>
                          <span style={{ padding: "8px 24px", color: "#FFD700", fontWeight: 700, fontSize: "1.2rem" }}>{cycleLength}</span>
                          <button className="btn btn-secondary btn-sm" onClick={() => setCycleLength((l) => Math.min(40, l + 1))}><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Phase Predictions</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { phase: "Next Period", days: cycleLength - cycleDay, color: "#EF4444" },
                        { phase: "Fertile Window", days: Math.max(14 - cycleDay, 0), color: "#FFD700" },
                        { phase: "Peak Energy", days: cycleDay <= 14 ? 14 - cycleDay : cycleLength - cycleDay + 14, color: "#10B981" },
                      ].map((pred, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{pred.phase}</div>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>Estimated</div>
                          </div>
                          <div style={{ color: pred.color, fontWeight: 700 }}>{pred.days > 0 ? `In ${pred.days} days` : "Today"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MOOD TRACKER */}
            {activeTab === "mood" && (
              <motion.div key="mood" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">How are you feeling today?</span>
                    <div className="card-icon"><Smile size={20} /></div>
                  </div>

                  <div className="mood-selector">
                    {[
                      { value: "Balanced", emoji: "😊" },
                      { value: "Energetic", emoji: "⚡" },
                      { value: "Focused", emoji: "🧘" },
                      { value: "Tired", emoji: "😴" },
                      { value: "Stressed", emoji: "😟" },
                      { value: "Emotional", emoji: "😢" },
                    ].map((m) => (
                      <div key={m.value} className={`mood-option ${mood === m.value ? "active" : ""}`} onClick={() => setMood(m.value)} title={m.value}>
                        {m.emoji}
                      </div>
                    ))}
                  </div>

                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => setShowMoodLog(true)}>
                      <Save size={16} style={{ marginRight: 6 }} />Log Mood & Energy
                    </button>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Mood History</span>
                      <span className="badge badge-gold">{moodHistory.length} entries</span>
                    </div>
                    {moodHistory.map((entry) => (
                      <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)", marginBottom: 10 }}>
                        <span style={{ fontSize: "1.5rem" }}>{getMoodEmoji(entry.mood)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{entry.mood}</div>
                          <div style={{ fontSize: "0.75rem", color: "#888" }}>{entry.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#FFD700", fontWeight: 700 }}>{entry.energy}%</div>
                          <div style={{ fontSize: "0.7rem", color: "#888" }}>energy</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Mood Patterns</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Most Common", value: mood, color: "#FFD700" },
                        { label: "Avg Energy", value: Math.round(moodHistory.reduce((a, m) => a + m.energy, 0) / moodHistory.length) + "%", color: "#10B981" },
                        { label: "Best Mood", value: "Energetic", color: "#3B82F6" },
                        { label: "Mood Stability", value: "Good", color: "#8B5CF6" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
                          <span style={{ color: "#888" }}>{item.label}</span>
                          <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showMoodLog && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowMoodLog(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 420, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>Log Mood</h3>
                          <button onClick={() => setShowMoodLog(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8, display: "block" }}>Mood</label>
                            <div className="mood-selector" style={{ justifyContent: "flex-start" }}>
                              {["Balanced", "Energetic", "Focused", "Tired", "Stressed", "Emotional"].map((m) => (
                                <button key={m} className={`btn btn-sm ${moodLogInput.mood === m ? "btn-primary" : "btn-secondary"}`} onClick={() => setMoodLogInput({ ...moodLogInput, mood: m })}>{getMoodEmoji(m)} {m}</button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8, display: "block" }}>Energy Level</label>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setMoodLogInput({ ...moodLogInput, energy: Math.max(10, moodLogInput.energy - 10) })}><Minus size={14} /></button>
                              <span style={{ padding: "8px 24px", color: "#FFD700", fontWeight: 700 }}>{moodLogInput.energy}%</span>
                              <button className="btn btn-secondary btn-sm" onClick={() => setMoodLogInput({ ...moodLogInput, energy: Math.min(100, moodLogInput.energy + 10) })}><Plus size={14} /></button>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Note (optional)</label>
                            <textarea className="input-field" placeholder="How are you feeling?" value={moodLogInput.note} onChange={(e) => setMoodLogInput({ ...moodLogInput, note: e.target.value })} style={{ minHeight: 60, resize: "vertical" }} />
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMoodEntry}>Save Entry</button>
                            <button className="btn btn-secondary" onClick={() => setShowMoodLog(false)}>Cancel</button>
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
              <motion.div key="symptoms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span className="card-title">Symptoms Log</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddSymptom(true)}>
                      <Plus size={14} style={{ marginRight: 4 }} />Add Symptom
                    </button>
                  </div>

                  {symptoms.map((symptom) => (
                    <div key={symptom.id} className="symptom-item">
                      <div className={`symptom-dot ${symptom.severity === "mild" ? "severity-mild" : symptom.severity === "moderate" ? "severity-moderate" : symptom.severity === "severe" ? "severity-severe" : "severity-low"}`} style={{ background: symptom.severity === "mild" ? "#10B981" : symptom.severity === "moderate" ? "#FFD700" : symptom.severity === "severe" ? "#EF4444" : "#3B82F6" }} />
                      <div className="symptom-name">{symptom.name}</div>
                      <span className={`symptom-severity severity-${symptom.severity}`}>{symptom.severity}</span>
                      <span style={{ fontSize: "0.75rem", color: "#666" }}>{symptom.date}</span>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSymptom(symptom.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {symptoms.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <Thermometer size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No symptoms logged</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Track how you're feeling</div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddSymptom && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowAddSymptom(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 420, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>Log Symptom</h3>
                          <button onClick={() => setShowAddSymptom(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Symptom Name</label>
                            <input className="input-field" placeholder="e.g., Cramps, Headache" value={newSymptom.name} onChange={(e) => setNewSymptom({ ...newSymptom, name: e.target.value })} />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8, display: "block" }}>Severity</label>
                            <div style={{ display: "flex", gap: 8 }}>
                              {["low", "mild", "moderate", "severe"].map((s) => (
                                <button key={s} className={`btn btn-sm ${newSymptom.severity === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setNewSymptom({ ...newSymptom, severity: s })}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addSymptom}>Save Symptom</button>
                            <button className="btn btn-secondary" onClick={() => setShowAddSymptom(false)}>Cancel</button>
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
              <motion.div key="hormones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Hormone Balance Tracker</span>
                    <div className="card-icon"><Flower2 size={20} /></div>
                  </div>

                  {Object.entries(hormoneLevels).map(([hormone, level]) => (
                    <div key={hormone} className="hormone-meter">
                      <div className="hormone-label">
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{hormone}</span>
                        <span style={{ color: "#FFD700" }}>{level}%</span>
                      </div>
                      <div className="hormone-bar">
                        <div className="hormone-fill" style={{ width: `${level}%`, background: level >= 70 ? "linear-gradient(90deg, #10B981, #059669)" : level >= 40 ? "linear-gradient(90deg, #FFD700, #D4AF37)" : "linear-gradient(90deg, #EF4444, #DC2626)" }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Hormone Tips</span>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Zap size={18} /></div>
                      <div>
                        <div className="insight-title">Estrogen Balance</div>
                        <div className="insight-text">Include flaxseeds, soy, and leafy greens. These foods support natural estrogen metabolism.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Brain size={18} /></div>
                      <div>
                        <div className="insight-title">Cortisol Management</div>
                        <div className="insight-text">Practice deep breathing and meditation. High cortisol disrupts sleep and energy.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Hormone Support</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Sleep Quality", value: sleepHours >= 7 ? "Good" : "Improve", color: sleepHours >= 7 ? "#10B981" : "#FFD700" },
                        { label: "Stress Level", value: hormoneLevels.cortisol < 50 ? "Low" : "Moderate", color: hormoneLevels.cortisol < 50 ? "#10B981" : "#FFD700" },
                        { label: "Nutrition", value: "Balanced", color: "#10B981" },
                        { label: "Movement", value: energy >= 60 ? "Active" : "Low", color: energy >= 60 ? "#10B981" : "#FFD700" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
                          <span style={{ color: "#888" }}>{item.label}</span>
                          <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUPPLEMENTS */}
            {activeTab === "supplements" && (
              <motion.div key="supplements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Taken Today</span></div>
                    <div className="stat-value">{supplements.filter((s) => s.taken).length}</div>
                    <div className="stat-sub">of {supplements.length} supplements</div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Pending</span></div>
                    <div className="stat-value" style={{ color: "#EF4444" }}>{supplements.filter((s) => !s.taken).length}</div>
                    <div className="stat-sub">Remaining doses</div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Adherence</span></div>
                    <div className="stat-value">{Math.round((supplements.filter((s) => s.taken).length / supplements.length) * 100)}%</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(supplements.filter((s) => s.taken).length / supplements.length) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Today's Supplements</span>
                  </div>
                  {supplements.map((supp) => (
                    <div key={supp.id} className={`supplement-item ${supp.taken ? "taken" : ""}`} onClick={() => toggleSupplement(supp.id)}>
                      <div className={`supplement-check ${supp.taken ? "taken" : ""}`}>
                        {supp.taken && <CheckCircle2 size={16} />}
                      </div>
                      <div className="supplement-info">
                        <div className="supplement-name">{supp.name}</div>
                        <div className="supplement-dosage">{supp.dosage}</div>
                      </div>
                      <div className="supplement-time">{supp.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SELF CARE */}
            {activeTab === "selfcare" && (
              <motion.div key="selfcare" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Daily Self-Care Routine</span>
                    <span className="badge badge-gold">{selfCareActivities.filter((a) => a.done).length}/{selfCareActivities.length} done</span>
                  </div>

                  <div className="progress-bar" style={{ marginBottom: 24 }}>
                    <div className="progress-fill" style={{ width: `${(selfCareActivities.filter((a) => a.done).length / selfCareActivities.length) * 100}%` }} />
                  </div>

                  {selfCareActivities.map((activity) => (
                    <div key={activity.id} className={`routine-item ${activity.done ? "completed" : ""}`} onClick={() => toggleSelfCare(activity.id)}>
                      <div className={`routine-check ${activity.done ? "completed" : ""}`}>
                        {activity.done && <CheckCircle2 size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={`routine-text ${activity.done ? "completed" : ""}`}>{activity.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>{activity.duration} • {activity.category}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Water Intake</span>
                      <div className="card-icon"><Droplets size={20} /></div>
                    </div>
                    <div className="water-tracker" style={{ marginBottom: 16 }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className={`water-drop ${n <= waterIntake ? "filled" : ""}`} onClick={() => setWaterIntake(n === waterIntake ? n - 1 : n)}>
                          <Droplets size={16} />
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: "center", color: "#888" }}>{waterIntake}/{hydrationGoal} glasses</div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Tracker</span>
                      <div className="card-icon"><Moon size={20} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>{sleepHours}h</div>
                      <div style={{ color: "#888", marginTop: 4 }}>{sleepHours >= 7 ? "Great sleep!" : "Try for 7-8 hours"}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSleepHours((h) => Math.max(4, Math.round((h - 0.5) * 2) / 2))}><Minus size={14} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSleepHours((h) => Math.min(12, Math.round((h + 0.5) * 2) / 2))}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROGRAMS */}
            {activeTab === "programs" && (
              <motion.div key="programs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Wellness Programs</span>
                  </div>

                  <div className="grid-3">
                    {wellnessPrograms.map((program) => (
                      <div key={program.id} className="program-card">
                        <div className="program-header">
                          <div>
                            <div className="program-name">{program.name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>{program.duration}</div>
                          </div>
                          <span className="program-category">{program.category}</span>
                        </div>

                        <div className="program-progress">
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.75rem", color: "#888" }}>Progress</span>
                            <span style={{ fontSize: "0.75rem", color: "#FFD700" }}>{program.progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${program.progress}%` }} />
                          </div>
                        </div>

                        <button className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 12 }} onClick={() => {
                          setWellnessPrograms((prev) =>
                            prev.map((p) => p.id === program.id ? { ...p, progress: Math.min(100, p.progress + 10) } : p)
                          );
                        }}>
                          <Plus size={14} style={{ marginRight: 4 }} />Continue
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* JOURNAL */}
            {activeTab === "journal" && (
              <motion.div key="journal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Health Journal</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddJournal(true)}>
                      <Plus size={14} style={{ marginRight: 4 }} />New Entry
                    </button>
                  </div>

                  {healthJournal.map((entry) => (
                    <div key={entry.id} className="journal-item">
                      <div className="journal-header">
                        <span className="journal-date">{entry.date}</span>
                        <span className="journal-mood">{entry.mood}</span>
                      </div>
                      <div className="journal-title">{entry.title}</div>
                      <div className="journal-content">{entry.content}</div>
                      <div className="journal-actions">
                        <button className="btn btn-sm btn-danger" onClick={() => deleteJournalEntry(entry.id)}>
                          <Trash2 size={12} style={{ marginRight: 4 }} />Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {healthJournal.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <BookOpen size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No journal entries yet</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Start writing your health journey</div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddJournal && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowAddJournal(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>New Journal Entry</h3>
                          <button onClick={() => setShowAddJournal(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Title</label>
                            <input className="input-field" placeholder="e.g., Feeling centered today" value={journalInput.title} onChange={(e) => setJournalInput({ ...journalInput, title: e.target.value })} />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8, display: "block" }}>Mood</label>
                            <div className="mood-selector" style={{ justifyContent: "flex-start" }}>
                              {["😊", "😄", "😐", "😟", "😢", "😴"].map((m) => (
                                <div key={m} className={`mood-option ${journalInput.mood === m ? "active" : ""}`} onClick={() => setJournalInput({ ...journalInput, mood: m })} style={{ width: 40, height: 40, fontSize: "1.2rem" }}>{m}</div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Content</label>
                            <textarea className="input-field" placeholder="Write about your day..." value={journalInput.content} onChange={(e) => setJournalInput({ ...journalInput, content: e.target.value })} style={{ minHeight: 100, resize: "vertical", lineHeight: 1.6 }} />
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addJournalEntry}>Save Entry</button>
                            <button className="btn btn-secondary" onClick={() => setShowAddJournal(false)}>Cancel</button>
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
              <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">AI Women's Health Analysis</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><CalendarDays size={18} /></div>
                    <div>
                      <div className="insight-title">Cycle Phase Insight</div>
                      <div className="insight-text">
                        {cyclePhase.name === "Follicular" ? "You're in your follicular phase. Estrogen is rising, bringing more energy and creativity. Perfect time for workouts and new projects." : cyclePhase.name === "Ovulation" ? "Ovulation phase detected. Communication and confidence are at their peak. Great for social events and important conversations." : cyclePhase.name === "Luteal" ? "Luteal phase: Progesterone is dominant. Focus on self-care, rest, and gentle exercise. Your body is preparing for the next cycle." : "Menstrual phase: Allow yourself to rest and recover. Light stretching and warm foods are beneficial during this time."}
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><HeartPulse size={18} /></div>
                    <div>
                      <div className="insight-title">Overall Wellness</div>
                      <div className="insight-text">
                        Your health score is {healthScore}/100. {healthScore >= 80 ? "Excellent! Keep maintaining your current wellness routine." : healthScore >= 60 ? "Good progress. Focus on improving sleep and stress management to boost your score." : "Let's work on building healthy habits together. Start with hydration and consistent sleep."}
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><Brain size={18} /></div>
                    <div>
                      <div className="insight-title">Mood & Stress</div>
                      <div className="insight-text">
                        Current mood: {mood} with {energy}% energy. {mood === "Stressed" || mood === "Emotional" ? "Consider practicing deep breathing or meditation. Your body might be responding to hormonal changes." : energy < 60 ? "Low energy detected. Ensure you're getting enough iron and B vitamins, and prioritize rest." : "Your mood and energy levels look balanced. Keep up your healthy routines!"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Personalized Recommendations</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {waterIntake < 6 && (
                        <div style={{ padding: "14px", borderRadius: 12, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                          <div style={{ fontWeight: 600, color: "#3B82F6", marginBottom: 4 }}>Hydration</div>
                          <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Drink {hydrationGoal - waterIntake} more glasses today for better hormone balance and skin health.</div>
                        </div>
                      )}
                      {sleepHours < 7 && (
                        <div style={{ padding: "14px", borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                          <div style={{ fontWeight: 600, color: "#8B5CF6", marginBottom: 4 }}>Sleep</div>
                          <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Aim for 7-8 hours. Quality sleep is crucial for hormone regulation and mood stability.</div>
                        </div>
                      )}
                      <div style={{ padding: "14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div style={{ fontWeight: 600, color: "#10B981", marginBottom: 4 }}>Movement</div>
                        <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Continue your {selfCareActivities.filter((a) => a.done).length} self-care activities daily. Consistency is key.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Health Score Breakdown</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {[
                        { label: "Cycle Health", value: 85, color: "linear-gradient(90deg, #FFD700, #D4AF37)" },
                        { label: "Mood Balance", value: energy, color: "linear-gradient(90deg, #10B981, #059669)" },
                        { label: "Hydration", value: (waterIntake / hydrationGoal) * 100, color: "linear-gradient(90deg, #3B82F6, #60A5FA)" },
                        { label: "Sleep Quality", value: (sleepHours / 8) * 100, color: "linear-gradient(90deg, #8B5CF6, #A78BFA)" },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.85rem", color: "#ccc" }}>{item.label}</span>
                            <span style={{ fontSize: "0.85rem", color: "#FFD700", fontWeight: 700 }}>{Math.round(item.value)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(item.value, 100)}%`, background: item.color }} />
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

function AlertCircle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
