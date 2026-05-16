import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Star,
  Clock,
  Calendar,
  BarChart3,
  BookOpen,
  Settings,
  Bell,
  Search,
  Menu,
  User,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Wind,
  CloudRain,
  Waves,
  Flame,
  Coffee,
  Smartphone,
  Zap,
  Activity,
  HeartPulse,
  Brain,
  Trophy,
  CheckCircle2,
  Plus,
  X,
  Trash2,
  Save,
  Info,
  AlertTriangle,
  TrendingUp,
  Music,
  Headphones,
  Thermometer,
  Lightbulb,
  Eye,
  EyeOff,
} from "lucide-react";

const sleepSounds = [
  { id: 1, name: "Rain on Roof", icon: CloudRain, color: "#60A5FA" },
  { id: 2, name: "Ocean Waves", icon: Waves, color: "#34D399" },
  { id: 3, name: "White Noise", icon: Wind, color: "#A78BFA" },
  { id: 4, name: "Forest Night", icon: Moon, color: "#FBBF24" },
  { id: 5, name: "Soft Piano", icon: Music, color: "#F472B6" },
  { id: 6, name: "Campfire", icon: Flame, color: "#FB923C" },
];

const defaultSleepLog = [
  { id: 1, date: "2026-05-16", duration: 7.5, quality: 8, notes: "Felt rested" },
  { id: 2, date: "2026-05-15", duration: 6.2, quality: 5, notes: "Woke up twice" },
  { id: 3, date: "2026-05-14", duration: 8.0, quality: 9, notes: "Deep sleep" },
];

export default function SleepHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sleepScore, setSleepScore] = useState(82);
  const [bedtimeGoal, setBedtimeGoal] = useState("23:00");
  const [wakeTimeGoal, setWakeTimeGoal] = useState("07:00");
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [sleepLog, setSleepLog] = useState(() => {
    const saved = localStorage.getItem("sleepLog");
    return saved ? JSON.parse(saved) : defaultSleepLog;
  });
  const [showAddLog, setShowAddLog] = useState(false);
  const [newLog, setNewLog] = useState({ duration: "", quality: 5, notes: "" });
  const [habits, setHabits] = useState([
    { id: 1, text: "No screens 1hr before bed", done: false },
    { id: 2, text: "Read for 15 minutes", done: false },
    { id: 3, text: "Meditate/Deep breathe", done: false },
    { id: 4, text: "Room temp 65-68°F", done: false },
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem("sleepLog", JSON.stringify(sleepLog));
  }, [sleepLog]);

  const avgDuration = useMemo(() => {
    if (sleepLog.length === 0) return 0;
    const total = sleepLog.reduce((acc, log) => acc + log.duration, 0);
    return (total / sleepLog.length).toFixed(1);
  }, [sleepLog]);

  const avgQuality = useMemo(() => {
    if (sleepLog.length === 0) return 0;
    const total = sleepLog.reduce((acc, log) => acc + log.quality, 0);
    return Math.round(total / sleepLog.length);
  }, [sleepLog]);

  const toggleHabit = useCallback((id) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  }, []);

  const addSleepLog = useCallback(() => {
    if (!newLog.duration) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      duration: parseFloat(newLog.duration),
      quality: parseInt(newLog.quality),
      notes: newLog.notes,
    };
    setSleepLog((prev) => [entry, ...prev]);
    setShowAddLog(false);
    setNewLog({ duration: "", quality: 5, notes: "" });
    
    // Update score based on new entry
    const qualityScore = parseInt(newLog.quality) * 10;
    const durationScore = parseFloat(newLog.duration) >= 7 ? 20 : 10;
    setSleepScore(Math.min(100, Math.round((qualityScore + durationScore) / 2)));
  }, [newLog]);

  const deleteLog = useCallback((id) => {
    setSleepLog((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const toggleSound = useCallback((id) => {
    if (currentSound === id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSound(id);
      setIsPlaying(true);
    }
  }, [currentSound, isPlaying]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "sounds", label: "Sleep Sounds", icon: Headphones },
    { id: "log", label: "Sleep Log", icon: BookOpen },
    { id: "habits", label: "Hygiene Habits", icon: CheckCircle2 },
    { id: "insights", label: "AI Insights", icon: Brain },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050510; font-family: 'Inter', sans-serif; color: white; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a15; }
        ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 3px; }
        
        .app-container { display: flex; min-height: 100vh; background: #050510; overflow: hidden; }
        
        .sidebar { width: 260px; background: linear-gradient(180deg, #0a0a15 0%, #050510 100%); border-right: 1px solid rgba(139, 92, 246, 0.1); padding: 24px 0; position: fixed; height: 100vh; z-index: 50; transition: transform 0.3s ease; display: flex; flex-direction: column; }
        .sidebar-header { padding: 0 24px; margin-bottom: 32px; display: flex; align-items: center; gap: 12px; }
        .sidebar-logo { width: 40px; height: 40px; rounded: 12px; background: linear-gradient(135deg, #8B5CF6, #6366F1); display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .sidebar-title { font-size: 1.2rem; font-weight: 800; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 24px; color: #94a3b8; cursor: pointer; transition: all 0.2s; font-weight: 500; border: none; background: none; width: 100%; text-align: left; }
        .nav-item:hover { color: #fff; background: rgba(139, 92, 246, 0.05); }
        .nav-item.active { color: #8B5CF6; background: rgba(139, 92, 246, 0.1); border-right: 3px solid #8B5CF6; }
        
        .main-content { flex: 1; margin-left: 260px; padding: 32px; overflow-y: auto; max-height: 100vh; background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 40%), #050510; }
        
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .page-title { font-size: 2rem; font-weight: 800; color: #fff; }
        .page-subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 4px; }
        
        .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 24px; backdrop-filter: blur(10px); transition: all 0.3s; }
        .card:hover { border-color: rgba(139, 92, 246, 0.2); background: rgba(255, 255, 255, 0.04); }
        
        .stat-card { text-align: center; }
        .stat-value { font-size: 2.5rem; font-weight: 800; background: linear-gradient(to bottom, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 12px 0; }
        .stat-label { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }
        
        .btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-family: inherit; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-icon { padding: 10px; border-radius: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .btn-icon:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
        
        .sound-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
        .sound-card { padding: 20px; border-radius: 20px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        .sound-card:hover { transform: translateY(-4px); background: rgba(255, 255, 255, 0.06); }
        .sound-card.active { border-color: #8B5CF6; background: rgba(139, 92, 246, 0.1); }
        .sound-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        
        .habit-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.03); margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
        .habit-item:hover { background: rgba(255, 255, 255, 0.05); }
        .habit-check { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .habit-item.completed .habit-check { background: #8B5CF6; border-color: #8B5CF6; }
        .habit-text { flex: 1; font-weight: 500; }
        .habit-item.completed .habit-text { text-decoration: line-through; color: #64748b; }
        
        .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0, 0, 0, 0.2); color: #fff; font-family: inherit; outline: none; }
        .input-field:focus { border-color: #8B5CF6; }
        
        .mobile-menu-btn { display: none; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
        
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.active { display: block; }
          .main-content { margin-left: 0; padding: 20px; }
          .mobile-menu-btn { display: flex; }
          .sound-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="app-container">
        <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />
        
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo"><Moon size={20} color="white" /></div>
            <span className="sidebar-title">Somnium AI</span>
          </div>
          
          <nav style={{ flex: 1 }}>
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
          
          <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="nav-item" onClick={() => setShowSettings(true)}>
              <Settings size={20} />
              Settings
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="mobile-menu-btn btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={20} />
              </button>
              <div>
                <h1 className="page-title">{tabs.find(t => t.id === activeTab)?.label}</h1>
                <p className="page-subtitle">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-icon"><Bell size={20} /></button>
              <button className="btn-icon"><User size={20} /></button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
              >
                <div className="card" style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Sleep Score</h3>
                      <div style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1, background: "linear-gradient(to right, #8B5CF6, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {sleepScore}
                      </div>
                      <p style={{ color: "#64748b", marginTop: 8 }}>Based on last 7 nights</p>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "16px", background: "rgba(139, 92, 246, 0.1)" }}>
                      <Star size={32} color="#8B5CF6" fill="#8B5CF6" />
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
                    <div style={{ textAlign: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "16px" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>{avgDuration}h</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Avg Duration</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "16px" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>{avgQuality}/10</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Avg Quality</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "16px" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>{bedtimeGoal}</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Target Bedtime</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 20 }}>Tonight's Goal</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#cbd5e1" }}>Bedtime</span>
                      <input 
                        type="time" 
                        value={bedtimeGoal} 
                        onChange={(e) => setBedtimeGoal(e.target.value)}
                        style={{ background: "transparent", border: "none", color: "#8B5CF6", fontSize: "1.2rem", fontWeight: 700, fontFamily: "inherit" }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#cbd5e1" }}>Wake Up</span>
                      <input 
                        type="time" 
                        value={wakeTimeGoal} 
                        onChange={(e) => setWakeTimeGoal(e.target.value)}
                        style={{ background: "transparent", border: "none", color: "#8B5CF6", fontSize: "1.2rem", fontWeight: 700, fontFamily: "inherit" }}
                      />
                    </div>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: "0.9rem" }}>
                      <Clock size={16} />
                      <span>Target: {Math.floor((new Date(`2000-01-01T${wakeTimeGoal}`) - new Date(`2000-01-01T${bedtimeGoal}`)) / (1000 * 60 * 60))} hours</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8" }}>Recent Sleep Logs</h3>
                    <button className="btn btn-primary" onClick={() => setShowAddLog(true)}>
                      <Plus size={16} /> Add Log
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {sleepLog.slice(0, 3).map((log) => (
                      <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }}>
                            <Moon size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#fff" }}>{log.date}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{log.notes || "No notes"}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{log.duration} hrs</div>
                          <div style={{ fontSize: "0.85rem", color: log.quality > 7 ? "#4ade80" : log.quality > 4 ? "#fbbf24" : "#f87171" }}>
                            Quality: {log.quality}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "sounds" && (
              <motion.div
                key="sounds"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sound-grid">
                  {sleepSounds.map((sound) => {
                    const Icon = sound.icon;
                    const isActive = currentSound === sound.id;
                    return (
                      <div
                        key={sound.id}
                        className={`sound-card ${isActive ? "active" : ""}`}
                        onClick={() => toggleSound(sound.id)}
                      >
                        <div className="sound-icon" style={{ background: `${sound.color}20`, color: sound.color }}>
                          <Icon size={24} />
                        </div>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{sound.name}</div>
                        {isActive && isPlaying && (
                          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: "20px" }}>
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, 16, 8, 20, 6] }}
                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                style={{ width: "4px", background: sound.color, borderRadius: "2px" }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {currentSound && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ marginTop: 24, maxWidth: "600px", margin: "24px auto 0" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <button
                        className="btn-icon"
                        style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#8B5CF6", color: "#fff", border: "none" }}
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 8 }}>
                          {sleepSounds.find(s => s.id === currentSound)?.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Volume2 size={16} color="#94a3b8" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            style={{ flex: 1, accentColor: "#8B5CF6" }}
                          />
                          <VolumeX size={16} color="#94a3b8" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "log" && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                  <button className="btn btn-primary" onClick={() => setShowAddLog(true)}>
                    <Plus size={16} /> Add New Entry
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {sleepLog.map((log) => (
                    <div key={log.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6" }}>
                          <Calendar size={24} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>{log.date}</div>
                          <div style={{ color: "#94a3b8", marginTop: 4 }}>{log.notes || "No notes added"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>Duration</div>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{log.duration}h</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>Quality</div>
                          <div style={{ fontWeight: 700, color: log.quality > 7 ? "#4ade80" : log.quality > 4 ? "#fbbf24" : "#f87171" }}>{log.quality}/10</div>
                        </div>
                        <button className="btn-icon" onClick={() => deleteLog(log.id)} style={{ color: "#ef4444" }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {showAddLog && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => setShowAddLog(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="card"
                        style={{ width: "100%", maxWidth: "400px", padding: "32px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24, color: "#fff" }}>Log Sleep</h3>
                        
                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Duration (hours)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="input-field"
                            placeholder="e.g., 7.5"
                            value={newLog.duration}
                            onChange={(e) => setNewLog({ ...newLog, duration: e.target.value })}
                          />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Quality (1-10)</label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={newLog.quality}
                            onChange={(e) => setNewLog({ ...newLog, quality: e.target.value })}
                            style={{ width: "100%", accentColor: "#8B5CF6" }}
                          />
                          <div style={{ textAlign: "right", color: "#8B5CF6", fontWeight: 700, marginTop: 4 }}>{newLog.quality}/10</div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", color: "#94a3b8", marginBottom: 8, fontSize: "0.9rem" }}>Notes</label>
                          <textarea
                            className="input-field"
                            rows="3"
                            placeholder="How did you feel?"
                            value={newLog.notes}
                            onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                          />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddLog(false)}>Cancel</button>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={addSleepLog}>Save Entry</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "#fff" }}>Sleep Hygiene Checklist</h3>
                  <p style={{ color: "#94a3b8", marginBottom: 24 }}>Complete these habits to improve your sleep score.</p>
                  
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`habit-item ${habit.done ? "completed" : ""}`}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      <div className="habit-check">
                        {habit.done && <CheckCircle2 size={14} color="white" />}
                      </div>
                      <span className="habit-text">{habit.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                        <Smartphone size={24} />
                      </div>
                      <h4 style={{ fontWeight: 600, color: "#fff" }}>Digital Detox</h4>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                      Blue light from screens suppresses melatonin production. Try to stop using phones and computers at least 60 minutes before bed.
                    </p>
                  </div>

                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                        <Coffee size={24} />
                      </div>
                      <h4 style={{ fontWeight: 600, color: "#fff" }}>Caffeine Cut-off</h4>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                      Caffeine has a half-life of 5-6 hours. Avoid coffee, tea, and energy drinks after 2 PM to ensure it doesn't interfere with sleep onset.
                    </p>
                  </div>

                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                        <Thermometer size={24} />
                      </div>
                      <h4 style={{ fontWeight: 600, color: "#fff" }}>Cool Environment</h4>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                      Your body temperature needs to drop to initiate sleep. Keep your bedroom between 60-67°F (15-19°C) for optimal conditions.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 16 }}>
                    <div style={{ padding: "12px", borderRadius: "16px", background: "rgba(139, 92, 246, 0.2)", color: "#8B5CF6" }}>
                      <Brain size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8, color: "#fff" }}>AI Sleep Analysis</h3>
                      <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                        Based on your recent logs, your sleep duration is consistent, but quality fluctuates on days when you log high screen time. 
                        Consider implementing a strict "no-phone" rule after 9 PM to stabilize your REM cycles.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                  <div className="card">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 20 }}>Weekly Trend</h3>
                    <div style={{ height: "200px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
                      {sleepLog.slice(0, 7).reverse().map((log, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${(log.duration / 10) * 100}%`,
                              background: "linear-gradient(to top, #8B5CF6, #EC4899)",
                              borderRadius: "8px 8px 0 0",
                              minHeight: "4px",
                              opacity: 0.8
                            }}
                          />
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8", marginBottom: 20 }}>Recommendations</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", marginTop: "2px" }}>
                          <TrendingUp size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", marginBottom: "4px" }}>Consistency is Key</div>
                          <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Try to wake up at the same time every day, even on weekends, to regulate your circadian rhythm.</div>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", marginTop: "2px" }}>
                          <Lightbulb size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", marginBottom: "4px" }}>Morning Light</div>
                          <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Get 10-15 minutes of direct sunlight within 30 minutes of waking up to boost daytime alertness.</div>
                        </div>
                      </div>
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
