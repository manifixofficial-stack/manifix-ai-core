import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Star,
  BedDouble,
  Wind,
  Cloud,
  Droplets,
  Thermometer,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  User,
  Bell,
  Search,
  Menu,
  X,
  Plus,
  Minus,
  Trash2,
  Save,
  Send,
  ChevronRight,
  ChevronLeft,
  HeartPulse,
  Brain,
  Zap,
  Sunrise,
  Sunset,
  Music,
  Waves,
  Umbrella,
  Flame,
  Leaf,
  CloudRain,
  Coffee,
  Smartphone,
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle2,
  Target,
  Trophy,
  Sparkles,
  FileText,
  RefreshCw,
  LogOut,
  BellRing,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function SleepHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sleepLog, setSleepLog] = useState([
    { id: 1, date: "Today", bedtime: "10:30 PM", wakeTime: "6:30 AM", hours: 8, quality: 85, deepSleep: 2.5, interruptions: 1, dreams: "" },
    { id: 2, date: "Yesterday", bedtime: "11:00 PM", wakeTime: "7:00 AM", hours: 8, quality: 78, deepSleep: 2.1, interruptions: 2, dreams: "Flying over mountains" },
    { id: 3, date: "2 days ago", bedtime: "10:00 PM", wakeTime: "5:45 AM", hours: 7.75, quality: 90, deepSleep: 2.8, interruptions: 0, dreams: "" },
    { id: 4, date: "3 days ago", bedtime: "11:30 PM", wakeTime: "6:00 AM", hours: 6.5, quality: 65, deepSleep: 1.2, interruptions: 3, dreams: "Lost in a city" },
    { id: 5, date: "4 days ago", bedtime: "10:15 PM", wakeTime: "6:15 AM", hours: 8, quality: 88, deepSleep: 2.6, interruptions: 1, dreams: "" },
    { id: 6, date: "5 days ago", bedtime: "12:00 AM", wakeTime: "7:30 AM", hours: 7.5, quality: 70, deepSleep: 1.8, interruptions: 2, dreams: "Running through forest" },
    { id: 7, date: "6 days ago", bedtime: "10:45 PM", wakeTime: "6:30 AM", hours: 7.75, quality: 82, deepSleep: 2.3, interruptions: 1, dreams: "" },
  ]);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [sleepScore, setSleepScore] = useState(82);
  const [dreamJournal, setDreamJournal] = useState([
    { id: 1, date: "Today", title: "Flying over mountains", mood: "😊", description: "I was soaring over beautiful mountain ranges with golden peaks." },
    { id: 2, date: "3 days ago", title: "Lost in a city", mood: "😟", description: "Wandering through unfamiliar streets at night." },
    { id: 3, date: "5 days ago", title: "Running through forest", mood: "😨", description: "Chased by something through a dark forest." },
  ]);
  const [showAddDream, setShowAddDream] = useState(false);
  const [newDream, setNewDream] = useState({ title: "", mood: "😊", description: "" });
  const [sleepSounds, setSleepSounds] = useState([
    { id: 1, name: "Ocean Waves", icon: Waves, duration: "60 min", playing: false, volume: 50 },
    { id: 2, name: "Rain Sounds", icon: CloudRain, duration: "45 min", playing: false, volume: 60 },
    { id: 3, name: "Forest Night", icon: Leaf, duration: "30 min", playing: false, volume: 40 },
    { id: 4, name: "White Noise", icon: Wind, duration: "8 hours", playing: false, volume: 30 },
    { id: 5, name: "Thunder Storm", icon: Cloud, duration: "45 min", playing: false, volume: 55 },
    { id: 6, name: "Campfire", icon: Flame, duration: "60 min", playing: false, volume: 45 },
    { id: 7, name: "Deep Space", icon: Star, duration: "8 hours", playing: false, volume: 35 },
    { id: 8, name: "Piano Lullaby", icon: Music, duration: "30 min", playing: false, volume: 50 },
  ]);
  const [bedtime, setBedtime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [sleepRoutine, setSleepRoutine] = useState([
    { id: 1, name: "Turn off screens", time: "30 min before", done: false },
    { id: 2, name: "Dim lights", time: "20 min before", done: false },
    { id: 3, name: "Read or meditate", time: "15 min before", done: false },
    { id: 4, name: "Breathing exercise", time: "5 min before", done: false },
  ]);
  const [sleepEnvironment, setSleepEnvironment] = useState({
    temperature: 20,
    humidity: 45,
    lightLevel: 2,
    noiseLevel: 1,
    darkness: true,
    comfortable: true,
  });
  const [showAddSleepLog, setShowAddSleepLog] = useState(false);
  const [newSleepLog, setNewSleepLog] = useState({ bedtime: "", wakeTime: "", quality: 80, interruptions: 0, dreams: "" });
  const [showNotifications, setShowNotifications] = useState(false);
  const [sleepDebt, setSleepDebt] = useState(2.5);
  const [streak, setStreak] = useState(14);
  const [sleepAdvice, setSleepAdvice] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("sleepHealthData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSleepLog(parsed.sleepLog || sleepLog);
      setSleepGoal(parsed.sleepGoal || 8);
      setSleepScore(parsed.sleepScore || 82);
      setDreamJournal(parsed.dreamJournal || dreamJournal);
      setSleepSounds(parsed.sleepSounds || sleepSounds);
      setBedtime(parsed.bedtime || "22:30");
      setWakeTime(parsed.wakeTime || "06:30");
      setSleepRoutine(parsed.sleepRoutine || sleepRoutine);
      setSleepEnvironment(parsed.sleepEnvironment || sleepEnvironment);
      setSleepDebt(parsed.sleepDebt || 2.5);
      setStreak(parsed.streak || 14);
    }
  }, []);

  useEffect(() => {
    const data = {
      sleepLog, sleepGoal, sleepScore, dreamJournal, sleepSounds,
      bedtime, wakeTime, sleepRoutine, sleepEnvironment, sleepDebt, streak,
    };
    localStorage.setItem("sleepHealthData", JSON.stringify(data));
  }, [sleepLog, sleepGoal, sleepScore, dreamJournal, sleepSounds, bedtime, wakeTime, sleepRoutine, sleepEnvironment, sleepDebt, streak]);

  const avgSleepHours = useMemo(() => {
    if (sleepLog.length === 0) return 0;
    return (sleepLog.reduce((a, l) => a + l.hours, 0) / sleepLog.length).toFixed(1);
  }, [sleepLog]);

  const avgQuality = useMemo(() => {
    if (sleepLog.length === 0) return 0;
    return Math.round(sleepLog.reduce((a, l) => a + l.quality, 0) / sleepLog.length);
  }, [sleepLog]);

  const avgDeepSleep = useMemo(() => {
    if (sleepLog.length === 0) return 0;
    return (sleepLog.reduce((a, l) => a + l.deepSleep, 0) / sleepLog.length).toFixed(1);
  }, [sleepLog]);

  const notifications = useMemo(() => {
    const notifs = [];
    if (sleepDebt > 5) notifs.push({ id: 1, type: "alert", message: "High sleep debt detected! Prioritize rest tonight." });
    if (streak > 7) notifs.push({ id: 2, type: "success", message: `${streak}-day consistent sleep streak! Amazing!` });
    if (avgQuality < 70) notifs.push({ id: 3, type: "warning", message: "Sleep quality below 70%. Consider adjusting your routine." });
    if (sleepEnvironment.temperature > 22) notifs.push({ id: 4, type: "info", message: "Room temperature is warm. Ideal is 18-20°C for deep sleep." });
    return notifs;
  }, [sleepDebt, streak, avgQuality, sleepEnvironment.temperature]);

  const addDreamEntry = useCallback(() => {
    if (!newDream.title.trim()) return;
    setDreamJournal((prev) => [
      { id: Date.now(), date: new Date().toLocaleDateString(), ...newDream },
      ...prev,
    ]);
    setNewDream({ title: "", mood: "😊", description: "" });
    setShowAddDream(false);
  }, [newDream]);

  const deleteDreamEntry = useCallback((id) => {
    setDreamJournal((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addSleepLogEntry = useCallback(() => {
    if (!newSleepLog.bedtime || !newSleepLog.wakeTime) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      bedtime: newSleepLog.bedtime,
      wakeTime: newSleepLog.wakeTime,
      hours: 0,
      quality: newSleepLog.quality,
      deepSleep: 0,
      interruptions: newSleepLog.interruptions,
      dreams: newSleepLog.dreams,
    };
    setSleepLog((prev) => [entry, ...prev]);
    setNewSleepLog({ bedtime: "", wakeTime: "", quality: 80, interruptions: 0, dreams: "" });
    setShowAddSleepLog(false);
  }, [newSleepLog]);

  const toggleRoutine = useCallback((id) => {
    setSleepRoutine((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  }, []);

  const toggleSoundPlaying = useCallback((id) => {
    setSleepSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, playing: !s.playing } : { ...s, playing: false }))
    );
  }, []);

  const adjustSoundVolume = useCallback((id, delta) => {
    setSleepSounds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume: Math.max(0, Math.min(100, s.volume + delta)) } : s))
    );
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "sleep-log", label: "Sleep Log", icon: FileText },
    { id: "dreams", label: "Dream Journal", icon: Star },
    { id: "sounds", label: "Sleep Sounds", icon: Music },
    { id: "routine", label: "Sleep Routine", icon: Clock },
    { id: "environment", label: "Environment", icon: Thermometer },
    { id: "hygiene", label: "Sleep Hygiene", icon: Lightbulb },
    { id: "insights", label: "AI Insights", icon: Sparkles },
  ];

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
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .badge-gold { background: rgba(255,215,0,0.12); color: #FFD700; }
        .badge-green { background: rgba(16,185,129,0.12); color: #10B981; }
        .badge-red { background: rgba(239,68,68,0.12); color: #EF4444; }
        .insight-card { padding: 16px; border-radius: 14px; background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; }
        .insight-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,215,0,0.12); display: flex; align-items: center; justify-content: center; color: #FFD700; flex-shrink: 0; }
        .insight-text { font-size: 0.85rem; color: #ccc; line-height: 1.5; }
        .insight-title { font-weight: 600; color: #FFD700; margin-bottom: 4px; }
        .routine-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px; }
        .routine-item:hover { background: rgba(255,215,0,0.04); }
        .routine-item.completed { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.25); }
        .routine-check { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; }
        .routine-check.completed { background: #FFD700; border-color: #FFD700; color: #000; }
        .routine-text { flex: 1; font-weight: 500; }
        .routine-text.completed { text-decoration: line-through; color: #888; }
        .sound-card { padding: 20px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); transition: all 0.3s ease; }
        .sound-card:hover { border-color: rgba(255,215,0,0.2); }
        .sound-card.playing { border-color: #FFD700; background: rgba(255,215,0,0.08); }
        .sound-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); color: #FFD700; font-size: 1.5rem; }
        .sound-card.playing .sound-icon { background: #FFD700; color: #000; }
        .dream-item { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; }
        .dream-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .dream-date { font-size: 0.75rem; color: #666; }
        .dream-mood { font-size: 1.2rem; }
        .dream-title { font-weight: 700; font-size: 1.05rem; color: #FFD700; margin-bottom: 6px; }
        .dream-desc { color: #ccc; line-height: 1.6; font-size: 0.9rem; }
        .dream-actions { display: flex; gap: 8px; margin-top: 8px; }
        .sleep-chart-bar { flex: 1; border-radius: 8px 8px 0 0; background: linear-gradient(180deg, #FFD700, #D4AF37); position: relative; cursor: pointer; transition: all 0.2s ease; min-height: 20px; }
        .sleep-chart-bar:hover { opacity: 0.8; }
        .sleep-chart-bar .bar-label { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 0.65rem; color: #666; white-space: nowrap; }
        .sleep-chart-bar .bar-value { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 700; color: #FFD700; }
        .sleep-log-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.08); margin-bottom: 12px; transition: all 0.2s ease; }
        .sleep-log-item:hover { background: rgba(255,215,0,0.04); }
        .sleep-log-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,215,0,0.1); display: flex; align-items: center; justify-content: center; color: #FFD700; flex-shrink: 0; }
        .sleep-log-info { flex: 1; }
        .sleep-log-date { font-weight: 600; font-size: 0.95rem; }
        .sleep-log-time { font-size: 0.75rem; color: #666; margin-top: 2px; }
        .sleep-log-hours { font-weight: 700; color: #FFD700; font-size: 1.1rem; text-align: right; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40; }
        .env-control { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .env-label { flex: 1; font-size: 0.9rem; color: #ccc; }
        .env-value { font-weight: 700; color: #FFD700; min-width: 60px; text-align: right; }
        .env-slider { width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; position: relative; margin: 8px 0; }
        .env-slider-thumb { width: 18px; height: 18px; border-radius: 50%; background: #FFD700; position: absolute; top: 50%; transform: translateY(-50%); cursor: pointer; box-shadow: 0 0 10px rgba(255,215,0,0.4); }
        .env-toggle { width: 48px; height: 26px; border-radius: 13px; background: rgba(255,255,255,0.1); cursor: pointer; position: relative; transition: all 0.2s ease; }
        .env-toggle.active { background: rgba(255,215,0,0.3); }
        .env-toggle-knob { width: 22px; height: 22px; border-radius: 50%; background: #666; position: absolute; top: 2px; left: 2px; transition: all 0.2s ease; }
        .env-toggle.active .env-toggle-knob { left: 24px; background: #FFD700; }
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
            <div className="sidebar-logo-icon"><Moon size={22} /></div>
            <span className="sidebar-logo-text">SleepAI</span>
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
                <div className="profile-name">John Doe</div>
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
                            background: notif.type === "alert" ? "rgba(239,68,68,0.15)" : notif.type === "warning" ? "rgba(255,215,0,0.15)" : notif.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                            color: notif.type === "alert" ? "#EF4444" : notif.type === "warning" ? "#FFD700" : notif.type === "success" ? "#10B981" : "#3B82F6",
                          }}>
                            {notif.type === "alert" ? <AlertTriangle size={16} /> : notif.type === "warning" ? <AlertCircle size={16} /> : notif.type === "success" ? <Trophy size={16} /> : <Info size={16} />}
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
                      <span className="card-title">Sleep Score</span>
                      <div className="card-icon"><Moon size={20} /></div>
                    </div>
                    <div className="health-score-ring">
                      <svg width="140" height="140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="12" />
                        <circle cx="70" cy="70" r="60" fill="none" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${sleepScore * 3.77} ${377 - sleepScore * 3.77}`} style={{ transition: "stroke-dasharray 1s ease" }} />
                        <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#D4AF37" /></linearGradient></defs>
                      </svg>
                      <div className="score-value">
                        <div className="score-number">{sleepScore}</div>
                        <div className="score-label">/ 100</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="card-header">
                      <span className="card-title">Avg Sleep</span>
                      <div className="card-icon"><BedDouble size={20} /></div>
                    </div>
                    <div className="stat-value">{avgSleepHours}<span style={{ fontSize: "1rem", color: "#888" }}> hrs</span></div>
                    <div className="stat-sub">Target: {sleepGoal} hours</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((parseFloat(avgSleepHours) / sleepGoal) * 100, 100)}%` }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="card-header">
                      <span className="card-title">Sleep Debt</span>
                      <div className="card-icon"><Clock size={20} /></div>
                    </div>
                    <div className="stat-value">{sleepDebt}<span style={{ fontSize: "1rem", color: "#888" }}> hrs</span></div>
                    <div className="stat-sub">{sleepDebt > 5 ? <span className="trend-down">High</span> : <span className="trend-up">Manageable</span>}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((sleepDebt / 20) * 100, 100)}%`, background: sleepDebt > 5 ? "linear-gradient(90deg, #EF4444, #DC2626)" : "linear-gradient(90deg, #10B981, #059669)" }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="card-header">
                      <span className="card-title">Streak</span>
                      <div className="card-icon"><Trophy size={20} /></div>
                    </div>
                    <div className="stat-value">{streak}<span style={{ fontSize: "1rem", color: "#888" }}> days</span></div>
                    <div className="stat-sub"><span className="trend-up">🌙 Consistent!</span></div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }} />
                    </div>
                  </motion.div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Pattern (7 Days)</span>
                      <div className="card-icon"><BarChart3 size={20} /></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 150, paddingTop: 20 }}>
                      {sleepLog.slice(0, 7).reverse().map((log, i) => (
                        <div key={log.id} className="sleep-chart-bar" style={{ height: `${(log.hours / 10) * 100}%`, background: log.hours >= sleepGoal ? "linear-gradient(180deg, #FFD700, #D4AF37)" : "linear-gradient(180deg, rgba(255,215,0,0.5), rgba(212,175,55,0.5))" }}>
                          <span className="bar-value">{log.hours}h</span>
                          <span className="bar-label">{log.date.slice(0, 3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Quick Actions</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      {[
                        { label: "Log Sleep", action: () => setShowAddSleepLog(true), icon: FileText },
                        { label: "Dream Journal", action: () => setActiveTab("dreams"), icon: Star },
                        { label: "Sleep Sounds", action: () => setActiveTab("sounds"), icon: Music },
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
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">AI Sleep Insights</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Moon size={18} /></div>
                    <div>
                      <div className="insight-title">Sleep Quality Trend</div>
                      <div className="insight-text">
                        {avgQuality >= 80 ? "Your sleep quality is excellent! Your average quality score is " + avgQuality + "%. Keep maintaining your current routine." : "Your sleep quality averages " + avgQuality + "%. Try adjusting your bedtime routine for deeper sleep."}
                      </div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><BedDouble size={18} /></div>
                    <div>
                      <div className="insight-title">Deep Sleep Analysis</div>
                      <div className="insight-text">
                        Average deep sleep: {avgDeepSleep} hours. {parseFloat(avgDeepSleep) >= 2 ? "Excellent deep sleep duration!" : "Consider reducing evening caffeine and screen time to improve deep sleep."}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLEEP LOG */}
            {activeTab === "sleep-log" && (
              <motion.div key="sleep-log" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span className="card-title">Sleep History</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddSleepLog(true)}>
                      <Plus size={14} style={{ marginRight: 4 }} />Add Entry
                    </button>
                  </div>

                  {sleepLog.map((log) => (
                    <div key={log.id} className="sleep-log-item">
                      <div className="sleep-log-icon"><Moon size={22} /></div>
                      <div className="sleep-log-info">
                        <div className="sleep-log-date">{log.date}</div>
                        <div className="sleep-log-time">{log.bedtime} → {log.wakeTime} • Quality: {log.quality}% • Deep: {log.deepSleep}h</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="sleep-log-hours">{log.hours}h</div>
                        <div style={{ fontSize: "0.7rem", color: "#888" }}>total sleep</div>
                      </div>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showAddSleepLog && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowAddSleepLog(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>Log Sleep</h3>
                          <button onClick={() => setShowAddSleepLog(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Bedtime</label>
                              <input className="input-field" type="time" value={newSleepLog.bedtime} onChange={(e) => setNewSleepLog({ ...newSleepLog, bedtime: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Wake Time</label>
                              <input className="input-field" type="time" value={newSleepLog.wakeTime} onChange={(e) => setNewSleepLog({ ...newSleepLog, wakeTime: e.target.value })} />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Sleep Quality (0-100)</label>
                            <input className="input-field" type="range" min="0" max="100" value={newSleepLog.quality} onChange={(e) => setNewSleepLog({ ...newSleepLog, quality: parseInt(e.target.value) })} />
                            <div style={{ textAlign: "center", color: "#FFD700", fontWeight: 700, marginTop: 4 }}>{newSleepLog.quality}%</div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Interruptions</label>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setNewSleepLog({ ...newSleepLog, interruptions: Math.max(0, newSleepLog.interruptions - 1) })}><Minus size={14} /></button>
                              <span style={{ padding: "8px 16px", color: "#FFD700", fontWeight: 700 }}>{newSleepLog.interruptions}</span>
                              <button className="btn btn-secondary btn-sm" onClick={() => setNewSleepLog({ ...newSleepLog, interruptions: Math.min(10, newSleepLog.interruptions + 1) })}><Plus size={14} /></button>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Dreams (optional)</label>
                            <textarea className="input-field" placeholder="Describe any dreams..." value={newSleepLog.dreams} onChange={(e) => setNewSleepLog({ ...newSleepLog, dreams: e.target.value })} style={{ minHeight: 60, resize: "vertical" }} />
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addSleepLogEntry}>Save Entry</button>
                            <button className="btn btn-secondary" onClick={() => setShowAddSleepLog(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* DREAM JOURNAL */}
            {activeTab === "dreams" && (
              <motion.div key="dreams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span className="card-title">Dream Journal</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddDream(true)}>
                      <Plus size={14} style={{ marginRight: 4 }} />New Dream
                    </button>
                  </div>

                  {dreamJournal.map((dream) => (
                    <div key={dream.id} className="dream-item">
                      <div className="dream-header">
                        <span className="dream-date">{dream.date}</span>
                        <span className="dream-mood">{dream.mood}</span>
                      </div>
                      <div className="dream-title">{dream.title}</div>
                      <div className="dream-desc">{dream.description}</div>
                      <div className="dream-actions">
                        <button className="btn btn-sm btn-danger" onClick={() => deleteDreamEntry(dream.id)}>
                          <Trash2 size={12} style={{ marginRight: 4 }} />Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {dreamJournal.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <Star size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No dreams recorded yet</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Start tracking your dreams</div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddDream && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
                      onClick={() => setShowAddDream(false)}
                    >
                      <motion.div className="card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFD700" }}>Record Dream</h3>
                          <button onClick={() => setShowAddDream(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}>
                            <X size={20} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Dream Title</label>
                            <input className="input-field" placeholder="e.g., Flying over mountains" value={newDream.title} onChange={(e) => setNewDream({ ...newDream, title: e.target.value })} />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Dream Mood</label>
                            <div className="mood-selector" style={{ justifyContent: "flex-start" }}>
                              {["😊", "😐", "😟", "😨", "😢", "🤩"].map((m) => (
                                <div key={m} className={`mood-option ${newDream.mood === m ? "active" : ""}`} onClick={() => setNewDream({ ...newDream, mood: m })} style={{ width: 40, height: 40, fontSize: "1.2rem" }}>{m}</div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Description</label>
                            <textarea className="input-field" placeholder="Describe your dream in detail..." value={newDream.description} onChange={(e) => setNewDream({ ...newDream, description: e.target.value })} style={{ minHeight: 80, resize: "vertical", lineHeight: 1.6 }} />
                          </div>

                          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addDreamEntry}>Save Dream</button>
                            <button className="btn btn-secondary" onClick={() => setShowAddDream(false)}>Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SLEEP SOUNDS */}
            {activeTab === "sounds" && (
              <motion.div key="sounds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24, textAlign: "center", padding: "40px 24px" }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 24 }}>
                    <span className="card-title" style={{ fontSize: "1.4rem", color: "#FFD700" }}>Sleep Sounds Player</span>
                  </div>

                  <div style={{ fontSize: "1.2rem", color: "#888", marginBottom: 24 }}>
                    {sleepSounds.find((s) => s.playing)?.name || "Select a sound to play"}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSleepSounds((prev) => prev.map((s) => ({ ...s, playing: false })))}>
                      <SkipBack size={16} />
                    </button>
                    <button className="btn btn-primary" style={{ width: 64, height: 64, borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => {
                      const currentlyPlaying = sleepSounds.find((s) => s.playing);
                      if (currentlyPlaying) {
                        setSleepSounds((prev) => prev.map((s) => s.id === currentlyPlaying.id ? { ...s, playing: false } : s));
                      }
                    }}>
                      {sleepSounds.find((s) => s.playing) ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid-4">
                  {sleepSounds.map((sound) => {
                    const Icon = sound.icon;
                    return (
                      <div key={sound.id} className={`sound-card ${sound.playing ? "playing" : ""}`}>
                        <div className="sound-icon">
                          <Icon size={28} />
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{sound.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>{sound.duration}</div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => adjustSoundVolume(sound.id, -10)}>
                              <VolumeX size={12} />
                            </button>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${sound.volume}%`, background: sound.playing ? "#FFD700" : "linear-gradient(90deg, #888, #666)" }} />
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => adjustSoundVolume(sound.id, 10)}>
                              <Volume2 size={12} />
                            </button>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                            <button className={`btn ${sound.playing ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => toggleSoundPlaying(sound.id)}>
                              {sound.playing ? <Pause size={14} style={{ marginRight: 4 }} /> : <Play size={14} style={{ marginRight: 4 }} />}
                              {sound.playing ? "Pause" : "Play"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SLEEP ROUTINE */}
            {activeTab === "routine" && (
              <motion.div key="routine" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Nightly Sleep Routine</span>
                    <span className="badge badge-gold">{sleepRoutine.filter((r) => r.done).length}/{sleepRoutine.length} completed</span>
                  </div>

                  <div className="progress-bar" style={{ marginBottom: 24 }}>
                    <div className="progress-fill" style={{ width: `${(sleepRoutine.filter((r) => r.done).length / sleepRoutine.length) * 100}%` }} />
                  </div>

                  {sleepRoutine.map((routine) => (
                    <div key={routine.id} className={`routine-item ${routine.done ? "completed" : ""}`} onClick={() => toggleRoutine(routine.id)}>
                      <div className={`routine-check ${routine.done ? "completed" : ""}`}>
                        {routine.done && <CheckCircle2 size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={`routine-text ${routine.done ? "completed" : ""}`}>{routine.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 2 }}>{routine.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Schedule</span>
                      <div className="card-icon"><Clock size={20} /></div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Bedtime</label>
                        <input className="input-field" type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: 6, display: "block" }}>Wake Time</label>
                        <input className="input-field" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 14, background: "rgba(255,215,0,0.06)" }}>
                        <span style={{ color: "#888" }}>Sleep Duration</span>
                        <span style={{ color: "#FFD700", fontWeight: 700, fontSize: "1.2rem" }}>
                          {(() => {
                            const bed = bedtime.split(":").map(Number);
                            const wake = wakeTime.split(":").map(Number);
                            let hours = wake[0] - bed[0] + (wake[0] < bed[0] ? 24 : 0);
                            let mins = wake[1] - bed[1];
                            if (mins < 0) { hours--; mins += 60; }
                            return `${hours}h ${mins}m`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Routine Benefits</span>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Moon size={18} /></div>
                      <div>
                        <div className="insight-title">Consistent Schedule</div>
                        <div className="insight-text">Going to bed and waking up at the same time trains your body's internal clock.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Smartphone size={18} /></div>
                      <div>
                        <div className="insight-title">Screen-Free Zone</div>
                        <div className="insight-text">Avoid screens 1 hour before bed. Blue light disrupts melatonin production by up to 50%.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Wind size={18} /></div>
                      <div>
                        <div className="insight-title">Breathing Exercise</div>
                        <div className="insight-text">4-7-8 breathing technique activates parasympathetic nervous system for deeper sleep.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ENVIRONMENT */}
            {activeTab === "environment" && (
              <motion.div key="environment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Sleep Environment</span>
                    <div className="card-icon"><Thermometer size={20} /></div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div>
                      <div className="env-control">
                        <Thermometer size={20} style={{ color: "#FFD700" }} />
                        <div className="env-label">Temperature</div>
                        <div className="env-value">{sleepEnvironment.temperature}°C</div>
                      </div>
                      <div className="env-slider">
                        <div className="env-slider-thumb" style={{ left: `${((sleepEnvironment.temperature - 15) / 15) * 100}%` }} onClick={() => setSleepEnvironment((e) => ({ ...e, temperature: e.temperature === 30 ? 15 : e.temperature + 1 }))} />
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#666", marginTop: 4 }}>Optimal: 18-20°C</div>
                    </div>

                    <div>
                      <div className="env-control">
                        <Droplets size={20} style={{ color: "#FFD700" }} />
                        <div className="env-label">Humidity</div>
                        <div className="env-value">{sleepEnvironment.humidity}%</div>
                      </div>
                      <div className="env-slider">
                        <div className="env-slider-thumb" style={{ left: `${((sleepEnvironment.humidity - 20) / 60) * 100}%` }} onClick={() => setSleepEnvironment((e) => ({ ...e, humidity: e.humidity === 80 ? 20 : e.humidity + 5 }))} />
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#666", marginTop: 4 }}>Optimal: 40-60%</div>
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginTop: 24, marginBottom: 0 }}>
                    <div>
                      <div className="env-control">
                        <Sunrise size={20} style={{ color: "#FFD700" }} />
                        <div className="env-label">Light Level</div>
                        <div className="env-value">{sleepEnvironment.lightLevel}/10</div>
                      </div>
                      <div className="env-slider">
                        <div className="env-slider-thumb" style={{ left: `${(sleepEnvironment.lightLevel / 10) * 100}%` }} onClick={() => setSleepEnvironment((e) => ({ ...e, lightLevel: e.lightLevel === 10 ? 0 : e.lightLevel + 1 }))} />
                      </div>
                    </div>

                    <div>
                      <div className="env-control">
                        <Volume2 size={20} style={{ color: "#FFD700" }} />
                        <div className="env-label">Noise Level</div>
                        <div className="env-value">{sleepEnvironment.noiseLevel}/10</div>
                      </div>
                      <div className="env-slider">
                        <div className="env-slider-thumb" style={{ left: `${(sleepEnvironment.noiseLevel / 10) * 100}%` }} onClick={() => setSleepEnvironment((e) => ({ ...e, noiseLevel: e.noiseLevel === 10 ? 0 : e.noiseLevel + 1 }))} />
                      </div>
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginTop: 24, marginBottom: 0 }}>
                    <div className="env-control">
                      <Moon size={20} style={{ color: "#FFD700" }} />
                      <div className="env-label">Darkness</div>
                      <div className="env-toggle" style={{ marginLeft: "auto" }} onClick={() => setSleepEnvironment((e) => ({ ...e, darkness: !e.darkness }))}>
                        <div className={`env-toggle ${sleepEnvironment.darkness ? "active" : ""}`}>
                          <div className="env-toggle-knob" />
                        </div>
                      </div>
                    </div>

                    <div className="env-control">
                      <BedDouble size={20} style={{ color: "#FFD700" }} />
                      <div className="env-label">Comfortable Bed</div>
                      <div className="env-toggle" style={{ marginLeft: "auto" }} onClick={() => setSleepEnvironment((e) => ({ ...e, comfortable: !e.comfortable }))}>
                        <div className={`env-toggle ${sleepEnvironment.comfortable ? "active" : ""}`}>
                          <div className="env-toggle-knob" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Environment Score</span>
                  </div>
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>
                      {(() => {
                        let score = 70;
                        if (sleepEnvironment.temperature >= 18 && sleepEnvironment.temperature <= 20) score += 5;
                        if (sleepEnvironment.humidity >= 40 && sleepEnvironment.humidity <= 60) score += 5;
                        if (sleepEnvironment.lightLevel <= 2) score += 5;
                        if (sleepEnvironment.noiseLevel <= 2) score += 5;
                        if (sleepEnvironment.darkness) score += 5;
                        if (sleepEnvironment.comfortable) score += 5;
                        return Math.min(score, 100);
                      })()}
                    </div>
                    <div style={{ color: "#888", marginTop: 4 }}>Environment Quality Score</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLEEP HYGIENE */}
            {activeTab === "hygiene" && (
              <motion.div key="hygiene" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Sleep Hygiene Checklist</span>
                  </div>

                  {[
                    { icon: Smartphone, label: "No screens 1 hour before bed", tip: "Blue light suppresses melatonin by 50%. Use night mode if necessary." },
                    { icon: Coffee, label: "No caffeine after 2 PM", tip: "Caffeine has a 6-hour half-life. Even afternoon coffee can disrupt sleep." },
                    { icon: Lightbulb, label: "Dim lights in the evening", tip: "Bright light tells your brain it's daytime. Use warm, dim lighting." },
                    { icon: Moon, label: "Consistent sleep schedule", tip: "Same bedtime and wake time every day, even on weekends." },
                    { icon: Thermometer, label: "Cool room temperature", tip: "Ideal sleeping temperature is 18-20°C (65-68°F)." },
                    { icon: Wind, label: "Fresh air circulation", tip: "Good ventilation improves oxygen levels and sleep quality." },
                    { icon: Music, label: "Relaxing bedtime routine", tip: "Reading, meditation, or gentle stretching prepares your body for sleep." },
                    { icon: BedDouble, label: "Comfortable mattress and pillows", tip: "Replace mattresses every 7-10 years. Pillows every 1-2 years." },
                    { icon: Droplets, label: "Stay hydrated but limit liquids before bed", tip: "Drink water throughout the day but reduce intake 2 hours before sleep." },
                    { icon: Flame, label: "Avoid heavy meals before bed", tip: "Eat dinner at least 3 hours before bedtime for better digestion during sleep." },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: "flex", gap: 16, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)", marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,215,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700", flexShrink: 0 }}>
                          <Icon size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: "0.8rem", color: "#888", lineHeight: 1.5 }}>{item.tip}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* AI INSIGHTS */}
            {activeTab === "insights" && (
              <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">AI Sleep Analysis</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><BarChart3 size={18} /></div>
                    <div>
                      <div className="insight-title">Weekly Summary</div>
                      <div className="insight-text">
                        You've averaged {avgSleepHours} hours of sleep this week with {avgQuality}% quality. {parseFloat(avgSleepHours) >= 7 ? "Great consistency!" : "Try to extend your sleep by 30 minutes each night."} Your deep sleep averages {avgDeepSleep} hours.
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><Brain size={18} /></div>
                    <div>
                      <div className="insight-title">Sleep & Mental Health</div>
                      <div className="insight-text">
                        {avgQuality >= 80 ? "Your excellent sleep quality is supporting optimal mental health and cognitive function." : "Improving sleep quality can reduce stress and anxiety by up to 40%. Focus on a consistent bedtime routine."}
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><HeartPulse size={18} /></div>
                    <div>
                      <div className="insight-title">Physical Recovery</div>
                      <div className="insight-text">
                        {parseFloat(avgDeepSleep) >= 2 ? "Your deep sleep duration is excellent for muscle recovery and immune function." : "Deep sleep is crucial for physical recovery. Try reducing evening caffeine and screen time."}
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-icon"><Zap size={18} /></div>
                    <div>
                      <div className="insight-title">Energy Prediction</div>
                      <div className="insight-text">
                        {sleepDebt < 3 ? "Your sleep debt is low. You should feel energized today!" : "You have a sleep debt of " + sleepDebt + " hours. Consider a 20-minute power nap or an earlier bedtime tonight."}
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
                      {avgQuality < 80 && (
                        <div style={{ padding: "14px", borderRadius: 12, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
                          <div style={{ fontWeight: 600, color: "#FFD700", marginBottom: 4 }}>Improve Sleep Quality</div>
                          <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Try the 4-7-8 breathing technique before bed. Inhale 4s, hold 7s, exhale 8s.</div>
                        </div>
                      )}
                      {parseFloat(avgSleepHours) < 7 && (
                        <div style={{ padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <div style={{ fontWeight: 600, color: "#EF4444", marginBottom: 4 }}>Increase Sleep Duration</div>
                          <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Set an earlier bedtime by 15 minutes each night until you reach 7-8 hours.</div>
                        </div>
                      )}
                      <div style={{ padding: "14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div style={{ fontWeight: 600, color: "#10B981", marginBottom: 4 }}>Maintain Consistency</div>
                        <div style={{ fontSize: "0.85rem", color: "#ccc" }}>Keep your current {streak}-day streak going! Consistency is key to quality sleep.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Score Breakdown</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {[
                        { label: "Duration", value: Math.min(100, (parseFloat(avgSleepHours) / sleepGoal) * 100), color: "linear-gradient(90deg, #10B981, #059669)" },
                        { label: "Quality", value: avgQuality, color: "linear-gradient(90deg, #FFD700, #D4AF37)" },
                        { label: "Deep Sleep", value: Math.min(100, (parseFloat(avgDeepSleep) / 3) * 100), color: "linear-gradient(90deg, #3B82F6, #60A5FA)" },
                        { label: "Consistency", value: Math.min(100, (streak / 30) * 100), color: "linear-gradient(90deg, #8B5CF6, #A78BFA)" },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.85rem", color: "#ccc" }}>{item.label}</span>
                            <span style={{ fontSize: "0.85rem", color: "#FFD700", fontWeight: 700 }}>{Math.round(item.value)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${item.value}%`, background: item.color }} />
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

function Smartphone(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

function Coffee(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}

function Flame(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}
