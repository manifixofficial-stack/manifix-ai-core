import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Activity,
  Bell,
  Shield,
  Brain,
  Footprints,
  Moon,
  Timer,
  Sparkles,
  ChevronRight,
  Droplets,
  Thermometer,
  Pill,
  Dumbbell,
  BedDouble,
  Wind,
  Stethoscope,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  X,
  Menu,
  Settings,
  User,
  MessageCircle,
  Send,
  HeartPulse,
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Smile,
  Meh,
  Frown,
  Info,
  Save,
  Trash2,
  ChevronLeft,
  Sun,
  Cloud,
  CloudRain,
  BellRing,
  FileText,
  Camera,
  Mic,
  LogOut,
} from "lucide-react";

export default function ElderlyHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [bloodPressure, setBloodPressure] = useState({ systolic: 118, diastolic: 76 });
  const [oxygen, setOxygen] = useState(97);
  const [temperature, setTemperature] = useState(36.6);
  const [steps, setSteps] = useState(4200);
  const [completedRoutines, setCompletedRoutines] = useState([]);
  const [medicationLog, setMedicationLog] = useState([
    { id: 1, name: "Metformin", dosage: "500mg", time: "8:00 AM", taken: false },
    { id: 2, name: "Amlodipine", dosage: "5mg", time: "12:00 PM", taken: false },
    { id: 3, name: "Vitamin D3", dosage: "2000 IU", time: "1:00 PM", taken: false },
    { id: 4, name: "Atorvastatin", dosage: "20mg", time: "8:00 PM", taken: false },
  ]);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(85);
  const [waterIntake, setWaterIntake] = useState(4);
  const [familyMessages, setFamilyMessages] = useState([
    { id: 1, from: "Sarah (Daughter)", message: "Hi Dad! How are you feeling today? ❤️", time: "9:00 AM", read: true },
    { id: 2, from: "Dr. Johnson", message: "Your blood pressure looks great this week. Keep it up!", time: "10:30 AM", read: false },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [balanceScore, setBalanceScore] = useState(82);
  const [fallRisk, setFallRisk] = useState("Low");
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "Sarah - Daughter", phone: "+1 555-0101", relation: "Daughter" },
    { name: "Dr. Johnson - Physician", phone: "+1 555-0202", relation: "Doctor" },
  ]);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [healthJournal, setHealthJournal] = useState([]);
  const [journalInput, setJournalInput] = useState("");
  const [mood, setMood] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [flexibilityExercises, setFlexibilityExercises] = useState([
    { id: 1, name: "Neck Stretch", duration: "2 min", done: false },
    { id: 2, name: "Shoulder Rolls", duration: "3 min", done: false },
    { id: 3, name: "Ankle Circles", duration: "2 min", done: false },
    { id: 4, name: "Knee Flexion", duration: "3 min", done: false },
    { id: 5, name: "Hip Stretch", duration: "2 min", done: false },
  ]);
  const [balanceExercises, setBalanceExercises] = useState([
    { id: 1, name: "Single Leg Stand", duration: "1 min per leg", done: false },
    { id: 2, name: "Heel-Toe Walk", duration: "2 min", done: false },
    { id: 3, name: "Sit-To-Stand", duration: "10 reps", done: false },
    { id: 4, name: "Side Leg Raises", duration: "2 min", done: false },
  ]);

  const wellnessRoutines = useMemo(() => [
    "Morning breathing routine",
    "Medicine reminder",
    "Joint flexibility session",
    "Hydration check",
    "Family wellness update",
    "Night recovery meditation",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((prev) => {
        const random = Math.floor(Math.random() * 4) - 1;
        return Math.max(65, Math.min(85, prev + random));
      });
      setOxygen((prev) => {
        const random = Math.floor(Math.random() * 3) - 1;
        return Math.max(94, Math.min(99, prev + random));
      });
      setTemperature((prev) => {
        const random = (Math.random() * 0.2) - 0.1;
        return Math.round((prev + random) * 10) / 10;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("elderlyHealthData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setHeartRate(parsed.heartRate || 72);
      setBloodPressure(parsed.bloodPressure || { systolic: 118, diastolic: 76 });
      setOxygen(parsed.oxygen || 97);
      setTemperature(parsed.temperature || 36.6);
      setSteps(parsed.steps || 4200);
      setCompletedRoutines(parsed.completedRoutines || []);
      setMedicationLog(parsed.medicationLog || medicationLog);
      setSleepHours(parsed.sleepHours || 7.5);
      setSleepQuality(parsed.sleepQuality || 85);
      setWaterIntake(parsed.waterIntake || 4);
      setFamilyMessages(parsed.familyMessages || familyMessages);
      setBalanceScore(parsed.balanceScore || 82);
      setFallRisk(parsed.fallRisk || "Low");
      setHealthJournal(parsed.healthJournal || []);
      setMood(parsed.mood || 3);
      setFlexibilityExercises(parsed.flexibilityExercises || flexibilityExercises);
      setBalanceExercises(parsed.balanceExercises || balanceExercises);
    }
  }, []);

  useEffect(() => {
    const data = {
      heartRate, bloodPressure, oxygen, temperature, steps, completedRoutines,
      medicationLog, sleepHours, sleepQuality, waterIntake, familyMessages,
      balanceScore, fallRisk, healthJournal, mood, flexibilityExercises, balanceExercises,
    };
    localStorage.setItem("elderlyHealthData", JSON.stringify(data));
  }, [heartRate, bloodPressure, oxygen, temperature, steps, completedRoutines, medicationLog, sleepHours, sleepQuality, waterIntake, familyMessages, balanceScore, fallRisk, healthJournal, mood, flexibilityExercises, balanceExercises]);

  useEffect(() => {
    if (breathingActive) {
      const phases = ["inhale", "hold", "exhale", "hold"];
      let phaseIndex = 0;
      const interval = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        setBreathPhase(phases[phaseIndex]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [breathingActive]);

  const toggleRoutine = useCallback((index) => {
    setCompletedRoutines((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return [...prev, index];
    });
  }, []);

  const toggleMedication = useCallback((id) => {
    setMedicationLog((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
  }, []);

  const toggleFlexibility = useCallback((id) => {
    setFlexibilityExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e))
    );
  }, []);

  const toggleBalance = useCallback((id) => {
    setBalanceExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e))
    );
  }, []);

  const addMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    setFamilyMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: "You",
        message: newMessage,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        read: true,
      },
    ]);
    setNewMessage("");
  }, [newMessage]);

  const addJournalEntry = useCallback(() => {
    if (!journalInput.trim()) return;
    setHealthJournal((prev) => [
      {
        id: Date.now(),
        text: journalInput,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        mood,
      },
      ...prev,
    ]);
    setJournalInput("");
  }, [journalInput, mood]);

  const deleteJournalEntry = useCallback((id) => {
    setHealthJournal((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const healthScore = useMemo(() => {
    let score = 70;
    if (heartRate >= 60 && heartRate <= 80) score += 5;
    if (oxygen >= 95) score += 5;
    if (steps >= 5000) score += 3;
    if (completedRoutines.length >= 4) score += 5;
    if (sleepHours >= 7) score += 3;
    if (waterIntake >= 6) score += 2;
    if (medicationLog.filter((m) => m.taken).length === medicationLog.length) score += 5;
    return Math.min(score, 100);
  }, [heartRate, oxygen, steps, completedRoutines.length, sleepHours, waterIntake, medicationLog]);

  const notifications = useMemo(() => {
    const notifs = [];
    if (medicationLog.filter((m) => !m.taken).length > 0) {
      notifs.push({ id: 1, type: "warning", message: `${medicationLog.filter((m) => !m.taken).length} medications pending today` });
    }
    if (waterIntake < 6) {
      notifs.push({ id: 2, type: "info", message: `${6 - waterIntake} more glasses of water recommended` });
    }
    if (steps < 3000) {
      notifs.push({ id: 3, type: "alert", message: `Only ${steps.toLocaleString()} steps today. Try to move a bit more!` });
    }
    if (completedRoutines.length < wellnessRoutines.length - 2) {
      notifs.push({ id: 4, type: "info", message: "Complete your daily wellness routines" });
    }
    return notifs;
  }, [medicationLog, waterIntake, steps, completedRoutines.length, wellnessRoutines.length]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "vitals", label: "Vital Signs", icon: HeartPulse },
    { id: "medication", label: "Medication", icon: Pill },
    { id: "routines", label: "Wellness Routines", icon: Timer },
    { id: "mobility", label: "Mobility", icon: Footprints },
    { id: "sleep", label: "Sleep", icon: Moon },
    { id: "fall-prevention", label: "Fall Prevention", icon: Shield },
    { id: "breathing", label: "Breathing", icon: Wind },
    { id: "family", label: "Family Connect", icon: Users },
    { id: "journal", label: "Health Journal", icon: FileText },
  ];

  const getHeartRateStatus = (hr) => {
    if (hr < 60) return { label: "Low", color: "#FFD700" };
    if (hr <= 80) return { label: "Normal", color: "#10B981" };
    return { label: "Elevated", color: "#EF4444" };
  };

  const getBloodPressureStatus = (sys) => {
    if (sys < 120) return { label: "Normal", color: "#10B981" };
    if (sys < 140) return { label: "Elevated", color: "#FFD700" };
    return { label: "High", color: "#EF4444" };
  };

  const getOxygenStatus = (ox) => {
    if (ox >= 95) return { label: "Normal", color: "#10B981" };
    if (ox >= 91) return { label: "Low", color: "#FFD700" };
    return { label: "Critical", color: "#EF4444" };
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

        .app-container {
          display: flex;
          min-height: 100vh;
          background: #000;
          color: white;
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
          border-right: 1px solid rgba(255,215,0,0.12);
          padding: 24px 0;
          position: fixed;
          height: 100vh;
          z-index: 50;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
          margin-bottom: 32px;
        }

        .sidebar-logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FFD700, #D4AF37);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
        }

        .sidebar-logo-text {
          font-size: 1.3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #FFD700, #fff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #888;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 0.95rem;
        }

        .nav-item:hover { background: rgba(255,215,0,0.06); color: #FFD700; }
        .nav-item.active { background: rgba(255,215,0,0.1); color: #FFD700; font-weight: 600; }
        .nav-item svg { width: 20px; height: 20px; }

        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255,215,0,0.08);
          margin-top: auto;
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFD700, #D4AF37);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-weight: 700;
        }

        .profile-info { flex: 1; }
        .profile-name { font-size: 0.9rem; font-weight: 600; color: #fff; }
        .profile-role { font-size: 0.75rem; color: #888; }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 32px;
          overflow-y: auto;
          max-height: 100vh;
          background: radial-gradient(circle at top left, rgba(255,215,0,0.06), transparent 40%),
                      radial-gradient(circle at bottom right, rgba(212,175,55,0.04), transparent 35%),
                      #000;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .top-bar-left h1 { font-size: 2rem; font-weight: 800; color: #fff; }
        .top-bar-left p { color: #888; font-size: 0.9rem; margin-top: 4px; }

        .top-bar-right { display: flex; align-items: center; gap: 12px; }

        .top-bar-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.1);
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .top-bar-btn:hover { background: rgba(255,215,0,0.08); color: #FFD700; border-color: rgba(255,215,0,0.2); }

        .notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #EF4444;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-dropdown {
          position: absolute;
          top: 52px;
          right: 0;
          width: 320px;
          background: #111;
          border: 1px solid rgba(255,215,0,0.15);
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          z-index: 100;
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.03);
        }

        .notif-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-text { font-size: 0.85rem; color: #ccc; line-height: 1.4; }
        .notif-time { font-size: 0.7rem; color: #666; margin-top: 4px; }

        .mobile-menu-btn {
          display: none;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.1);
          color: #888;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,215,0,0.1);
          border-radius: 24px;
          padding: 24px;
          backdrop-filter: blur(14px);
          transition: all 0.3s ease;
        }

        .card:hover { border-color: rgba(255,215,0,0.2); }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 0.9rem; color: #888; font-weight: 500; }

        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,215,0,0.1);
          color: #FFD700;
        }

        .stat-value { font-size: 2.4rem; font-weight: 800; color: #FFD700; line-height: 1; margin-bottom: 8px; }
        .stat-sub { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #888; }
        .trend-up { color: #10B981; }
        .trend-down { color: #EF4444; }

        .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #FFD700, #D4AF37);
          transition: width 0.5s ease;
        }

        .health-score-ring {
          width: 140px;
          height: 140px;
          margin: 0 auto;
          position: relative;
        }

        .health-score-ring svg { transform: rotate(-90deg); }

        .health-score-ring .score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .health-score-ring .score-number { font-size: 2.2rem; font-weight: 900; color: #FFD700; line-height: 1; }
        .health-score-ring .score-label { font-size: 0.7rem; color: #888; margin-top: 2px; }

        .btn {
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        .btn-primary {
          background: linear-gradient(135deg, #FFD700, #D4AF37);
          color: #000;
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 0.9rem;
          box-shadow: 0 8px 24px rgba(255,215,0,0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255,215,0,0.3);
        }

        .btn-secondary {
          background: rgba(255,255,255,0.05);
          color: #fff;
          padding: 12px 24px;
          border-radius: 14px;
          border: 1px solid rgba(255,215,0,0.15);
          font-size: 0.9rem;
        }

        .btn-secondary:hover { background: rgba(255,215,0,0.08); border-color: rgba(255,215,0,0.25); }
        .btn-sm { padding: 8px 16px; font-size: 0.8rem; border-radius: 10px; }
        .btn-danger { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,215,0,0.12);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .input-field:focus { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.04); }
        .input-field::placeholder { color: #555; }

        .routine-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 12px;
        }

        .routine-item:hover { background: rgba(255,215,0,0.04); }
        .routine-item.completed { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.25); }

        .routine-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .routine-check.completed { background: #FFD700; border-color: #FFD700; color: #000; }

        .routine-text { flex: 1; font-weight: 500; }
        .routine-text.completed { text-decoration: line-through; color: #888; }

        .water-tracker { display: flex; align-items: center; gap: 16px; justify-content: center; padding: 20px 0; }

        .water-drop {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,215,0,0.1);
          border: 2px solid rgba(255,215,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #FFD700;
        }

        .water-drop.filled { background: rgba(255,215,0,0.25); border-color: #FFD700; }
        .water-drop:hover { transform: scale(1.1); }

        .mood-selector { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }

        .mood-option {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.5rem;
        }

        .mood-option:hover { transform: scale(1.1); }
        .mood-option.active { border-color: #FFD700; background: rgba(255,215,0,0.12); }

        .journal-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }

        .journal-item {
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
        }

        .journal-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .journal-date { font-size: 0.75rem; color: #666; }
        .journal-mood { font-size: 1.2rem; }
        .journal-text { font-size: 0.9rem; color: #ccc; line-height: 1.6; }
        .journal-actions { display: flex; gap: 8px; margin-top: 8px; }

        .message-item {
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          margin-bottom: 12px;
        }

        .message-item.unread { border-color: rgba(255,215,0,0.25); background: rgba(255,215,0,0.06); }
        .message-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .message-from { font-weight: 600; color: #FFD700; font-size: 0.9rem; }
        .message-time { font-size: 0.75rem; color: #666; }
        .message-text { color: #ccc; line-height: 1.6; }

        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
        .badge-gold { background: rgba(255,215,0,0.12); color: #FFD700; }
        .badge-green { background: rgba(16,185,129,0.12); color: #10B981; }
        .badge-red { background: rgba(239,68,68,0.12); color: #EF4444; }

        .insight-card {
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,215,0,0.06);
          border: 1px solid rgba(255,215,0,0.15);
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .insight-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,215,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          flex-shrink: 0;
        }

        .insight-text { font-size: 0.85rem; color: #ccc; line-height: 1.5; }
        .insight-title { font-weight: 600; color: #FFD700; margin-bottom: 4px; }

        .exercise-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .exercise-item:hover { background: rgba(255,215,0,0.04); }
        .exercise-item.done { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.2); }

        .exercise-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .exercise-check.done { background: #10B981; border-color: #10B981; color: #000; }

        .exercise-info { flex: 1; }
        .exercise-name { font-weight: 600; }
        .exercise-duration { font-size: 0.8rem; color: #666; }

        .breathing-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,215,0,0.1);
          border: 3px solid rgba(255,215,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 40px auto;
          transition: all 4s ease-in-out;
          cursor: pointer;
        }

        .breathing-circle.inhale {
          transform: scale(1.3);
          background: rgba(255,215,0,0.2);
          border-color: #FFD700;
        }

        .breathing-circle.exhale {
          transform: scale(0.85);
          background: rgba(255,215,0,0.05);
          border-color: rgba(255,215,0,0.2);
        }

        .breathing-circle.hold {
          transform: scale(1.1);
          background: rgba(255,215,0,0.15);
          border-color: rgba(255,215,0,0.4);
        }

        .breathing-text { font-size: 1.4rem; font-weight: 700; color: #FFD700; text-transform: capitalize; }

        .emergency-btn {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: white;
          padding: 16px 32px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 800;
          box-shadow: 0 10px 40px rgba(239,68,68,0.3);
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          width: 100%;
          margin-top: 20px;
        }

        .emergency-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 48px rgba(239,68,68,0.4); }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 40;
        }

        .vital-card {
          padding: 20px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.1);
        }

        .vital-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .vital-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(255,215,0,0.1); color: #FFD700; }
        .vital-label { font-size: 0.85rem; color: #888; }
        .vital-value { font-size: 2rem; font-weight: 800; color: #FFD700; }
        .vital-status { font-size: 0.75rem; margin-top: 4px; }

        .ai-chat-input {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.1);
        }

        .ai-chat-input input { flex: 1; background: none; border: none; color: #fff; font-size: 0.95rem; font-family: 'Inter', sans-serif; outline: none; }
        .ai-chat-input input::placeholder { color: #555; }

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
            <div className="sidebar-logo-icon"><HeartPulse size={22} /></div>
            <span className="sidebar-logo-text">ElderlyAI</span>
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
                      <div className="card-icon"><Shield size={20} /></div>
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
                      <span className="card-title">Heart Rate</span>
                      <div className="card-icon"><Heart size={20} /></div>
                    </div>
                    <div className="stat-value">{heartRate} <span style={{ fontSize: "1rem", color: "#888" }}>BPM</span></div>
                    <div className="stat-sub">
                      <span style={{ color: getHeartRateStatus(heartRate).color }}>{getHeartRateStatus(heartRate).label}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((heartRate / 100) * 100, 100)}%` }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="card-header">
                      <span className="card-title">Daily Steps</span>
                      <div className="card-icon"><Footprints size={20} /></div>
                    </div>
                    <div className="stat-value">{steps.toLocaleString()}</div>
                    <div className="stat-sub">Goal: 8,000</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((steps / 8000) * 100, 100)}%` }} />
                    </div>
                  </motion.div>

                  <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="card-header">
                      <span className="card-title">Routines</span>
                      <div className="card-icon"><Timer size={20} /></div>
                    </div>
                    <div className="stat-value">{completedRoutines.length}<span style={{ fontSize: "1.2rem", color: "#888" }}>/6</span></div>
                    <div className="stat-sub">Daily wellness tasks</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(completedRoutines.length / 6) * 100}%` }} />
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
                        { label: "Add Steps", action: () => setSteps((v) => v + 500), icon: Footprints },
                        { label: "Log Water", action: () => setWaterIntake((v) => Math.min(v + 1, 8)), icon: Droplets },
                        { label: "Sleep Log", action: () => setActiveTab("sleep"), icon: Moon },
                        { label: "Medication", action: () => setActiveTab("medication"), icon: Pill },
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
                      <span className="card-title">AI Health Insight</span>
                      <div className="card-icon"><Sparkles size={20} /></div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Activity size={18} /></div>
                      <div>
                        <div className="insight-title">Wellness Summary</div>
                        <div className="insight-text">
                          {healthScore >= 85 ? "Excellent! Your health metrics are within optimal ranges." : healthScore >= 70 ? "Good progress. Try completing more daily routines for better results." : "Let's improve your wellness routine. Start with hydration and light movement."}
                        </div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Droplets size={18} /></div>
                      <div>
                        <div className="insight-title">Hydration Reminder</div>
                        <div className="insight-text">
                          {waterIntake < 6 ? `You've had ${waterIntake}/8 glasses. Keep drinking water throughout the day.` : "Great job staying hydrated!"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Family Messages</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("family")}>View All</button>
                  </div>
                  {familyMessages.slice(-2).reverse().map((msg) => (
                    <div key={msg.id} className={`message-item ${msg.read ? "" : "unread"}`}>
                      <div className="message-header">
                        <span className="message-from">{msg.from}</span>
                        <span className="message-time">{msg.time}</span>
                      </div>
                      <div className="message-text">{msg.message}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* VITALS */}
            {activeTab === "vitals" && (
              <motion.div key="vitals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-4" style={{ marginBottom: 24 }}>
                  <motion.div className="vital-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="vital-header">
                      <div className="vital-icon"><Heart size={22} /></div>
                      <div>
                        <div className="vital-label">Heart Rate</div>
                        <div className="vital-value">{heartRate}</div>
                      </div>
                    </div>
                    <div className="vital-status" style={{ color: getHeartRateStatus(heartRate).color }}>
                      {getHeartRateStatus(heartRate).label} BPM
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setHeartRate((v) => Math.max(60, v - 2))}><Minus size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setHeartRate((v) => Math.min(100, v + 2))}><Plus size={14} /></button>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1, marginLeft: 8 }} onClick={() => setHeartRate(72)}>Reset</button>
                    </div>
                  </motion.div>

                  <motion.div className="vital-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="vital-header">
                      <div className="vital-icon"><Activity size={22} /></div>
                      <div>
                        <div className="vital-label">Blood Pressure</div>
                        <div className="vital-value">{bloodPressure.systolic}/{bloodPressure.diastolic}</div>
                      </div>
                    </div>
                    <div className="vital-status" style={{ color: getBloodPressureStatus(bloodPressure.systolic).color }}>
                      {getBloodPressureStatus(bloodPressure.systolic).label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setBloodPressure((v) => ({ ...v, systolic: Math.max(90, v.systolic - 2) }))}><Minus size={12} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setBloodPressure((v) => ({ ...v, systolic: Math.min(180, v.systolic + 2) }))}><Plus size={12} /></button>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setBloodPressure((v) => ({ ...v, diastolic: Math.max(50, v.diastolic - 2) }))}><Minus size={12} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setBloodPressure((v) => ({ ...v, diastolic: Math.min(110, v.diastolic + 2) }))}><Plus size={12} /></button>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="vital-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="vital-header">
                      <div className="vital-icon"><Wind size={22} /></div>
                      <div>
                        <div className="vital-label">Oxygen Level</div>
                        <div className="vital-value">{oxygen}%</div>
                      </div>
                    </div>
                    <div className="vital-status" style={{ color: getOxygenStatus(oxygen).color }}>
                      {getOxygenStatus(oxygen).label}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setOxygen((v) => Math.max(88, v - 1))}><Minus size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setOxygen((v) => Math.min(100, v + 1))}><Plus size={14} /></button>
                    </div>
                  </motion.div>

                  <motion.div className="vital-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="vital-header">
                      <div className="vital-icon"><Thermometer size={22} /></div>
                      <div>
                        <div className="vital-label">Temperature</div>
                        <div className="vital-value">{temperature}°C</div>
                      </div>
                    </div>
                    <div className="vital-status" style={{ color: temperature > 37.5 ? "#EF4444" : "#10B981" }}>
                      {temperature > 37.5 ? "Fever" : "Normal"}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setTemperature((v) => Math.round((v - 0.1) * 10) / 10)}><Minus size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setTemperature((v) => Math.round((v + 0.1) * 10) / 10)}><Plus size={14} /></button>
                    </div>
                  </motion.div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Vital Trend Summary</span>
                    <div className="card-icon"><BarChart3 size={20} /></div>
                  </div>
                  <div className="grid-3" style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: "center", padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 8 }}>Average HR</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFD700" }}>{heartRate}</div>
                      <div className="stat-sub" style={{ marginTop: 4, justifyContent: "center" }}>
                        <TrendingUp size={14} style={{ color: "#10B981" }} />
                        <span>Stable</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 8 }}>BP Range</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFD700" }}>{bloodPressure.systolic}/{bloodPressure.diastolic}</div>
                      <div className="stat-sub" style={{ marginTop: 4, justifyContent: "center" }}>
                        <span style={{ color: getBloodPressureStatus(bloodPressure.systolic).color }}>{getBloodPressureStatus(bloodPressure.systolic).label}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 8 }}>O2 Saturation</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFD700" }}>{oxygen}%</div>
                      <div className="stat-sub" style={{ marginTop: 4, justifyContent: "center" }}>
                        <span style={{ color: getOxygenStatus(oxygen).color }}>{getOxygenStatus(oxygen).label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MEDICATION */}
            {activeTab === "medication" && (
              <motion.div key="medication" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Taken Today</span></div>
                    <div className="stat-value">{medicationLog.filter((m) => m.taken).length}</div>
                    <div className="stat-sub">of {medicationLog.length} medications</div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Pending</span></div>
                    <div className="stat-value" style={{ color: "#EF4444" }}>{medicationLog.filter((m) => !m.taken).length}</div>
                    <div className="stat-sub">Remaining doses</div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Adherence Rate</span></div>
                    <div className="stat-value">{Math.round((medicationLog.filter((m) => m.taken).length / medicationLog.length) * 100)}%</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(medicationLog.filter((m) => m.taken).length / medicationLog.length) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Today's Medications</span>
                    <button className="btn btn-primary btn-sm"><Plus size={14} style={{ marginRight: 4 }} />Add Medication</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {medicationLog.map((med) => (
                      <div key={med.id} className="medication-item routine-item" style={{ cursor: "pointer" }} onClick={() => toggleMedication(med.id)}>
                        <div className={`routine-check ${med.taken ? "completed" : ""}`}>
                          {med.taken && <CheckCircle2 size={16} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="routine-text" style={{ fontWeight: 600 }}>{med.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>{med.dosage}</div>
                        </div>
                        <div className="badge" style={{ background: med.taken ? "rgba(16,185,129,0.12)" : "rgba(255,215,0,0.12)", color: med.taken ? "#10B981" : "#FFD700" }}>
                          {med.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-header">
                    <span className="card-title">AI Medication Reminders</span>
                    <div className="card-icon"><Clock size={20} /></div>
                  </div>
                  {["8:00 AM - Morning medications", "12:00 PM - Midday dose", "6:00 PM - Evening medications", "9:00 PM - Night time dose"].map((time, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)", marginBottom: 10 }}>
                      <Clock size={18} style={{ color: "#FFD700" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{time}</div>
                        <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 2 }}>Medication reminder</div>
                      </div>
                      <div className="badge badge-green">Active</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ROUTINES */}
            {activeTab === "routines" && (
              <motion.div key="routines" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Daily Wellness Routine</span>
                    <span className="badge badge-gold">{completedRoutines.length}/6 Completed</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 24 }}>
                    <div className="progress-fill" style={{ width: `${(completedRoutines.length / 6) * 100}%` }} />
                  </div>

                  {wellnessRoutines.map((task, index) => (
                    <div key={index} className={`routine-item ${completedRoutines.includes(index) ? "completed" : ""}`} onClick={() => toggleRoutine(index)}>
                      <div className={`routine-check ${completedRoutines.includes(index) ? "completed" : ""}`}>
                        {completedRoutines.includes(index) && <CheckCircle2 size={16} />}
                      </div>
                      <div className={`routine-text ${completedRoutines.includes(index) ? "completed" : ""}`}>{task}</div>
                      <ChevronRight size={18} style={{ color: "#666" }} />
                    </div>
                  ))}
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Quick Start</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Breathing Exercise", action: () => setActiveTab("breathing"), icon: Wind },
                        { label: "Stretching", action: () => setActiveTab("mobility"), icon: Dumbbell },
                        { label: "Log Hydration", action: () => setWaterIntake((v) => Math.min(v + 1, 8)), icon: Droplets },
                        { label: "Sleep Prep", action: () => setActiveTab("sleep"), icon: Moon },
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
                      <span className="card-title">Routine Streak</span>
                      <div className="card-icon"><Target size={20} /></div>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: "3rem", fontWeight: 900, color: "#FFD700" }}>7</div>
                      <div style={{ color: "#888", marginTop: 4 }}>days consecutive</div>
                      <div style={{ marginTop: 16 }}>
                        <span className="badge badge-green">Keep it up!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MOBILITY */}
            {activeTab === "mobility" && (
              <motion.div key="mobility" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Steps Today</span></div>
                    <div className="stat-value">{steps.toLocaleString()}</div>
                    <div className="stat-sub">Goal: 8,000</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min((steps / 8000) * 100, 100)}%` }} />
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={() => setSteps((v) => v + 500)}>
                      <Plus size={14} style={{ marginRight: 4 }} />Add 500 Steps
                    </button>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Active Minutes</span></div>
                    <div className="stat-value">45</div>
                    <div className="stat-sub">Goal: 60 minutes</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Balance Score</span></div>
                    <div className="stat-value">{balanceScore}%</div>
                    <div className="stat-sub">Good stability</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${balanceScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Flexibility Exercises</span>
                    </div>
                    {flexibilityExercises.map((exercise) => {
                      const Icon = Dumbbell;
                      return (
                        <div key={exercise.id} className={`exercise-item ${exercise.done ? "done" : ""}`}>
                          <div className={`exercise-check ${exercise.done ? "done" : ""}`} onClick={() => toggleFlexibility(exercise.id)}>
                            {exercise.done && <CheckCircle2 size={16} />}
                          </div>
                          <Icon size={20} style={{ color: exercise.done ? "#10B981" : "#FFD700" }} />
                          <div className="exercise-info">
                            <div className="exercise-name">{exercise.name}</div>
                            <div className="exercise-duration">{exercise.duration}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Balance Exercises</span>
                    </div>
                    {balanceExercises.map((exercise) => {
                      const Icon = Shield;
                      return (
                        <div key={exercise.id} className={`exercise-item ${exercise.done ? "done" : ""}`}>
                          <div className={`exercise-check ${exercise.done ? "done" : ""}`} onClick={() => toggleBalance(exercise.id)}>
                            {exercise.done && <CheckCircle2 size={16} />}
                          </div>
                          <Icon size={20} style={{ color: exercise.done ? "#10B981" : "#FFD700" }} />
                          <div className="exercise-info">
                            <div className="exercise-name">{exercise.name}</div>
                            <div className="exercise-duration">{exercise.duration}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card" style={{ marginTop: 0 }}>
                  <div className="card-header">
                    <span className="card-title">Mobility Tips</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Footprints size={18} /></div>
                    <div>
                      <div className="insight-title">Daily Walking</div>
                      <div className="insight-text">Aim for at least 30 minutes of walking daily. Break it into 10-minute sessions if needed.</div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Shield size={18} /></div>
                    <div>
                      <div className="insight-title">Fall Prevention</div>
                      <div className="insight-text">Practice balance exercises daily. Hold onto sturdy furniture when standing on one leg.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SLEEP */}
            {activeTab === "sleep" && (
              <motion.div key="sleep" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-2" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Duration</span>
                      <div className="card-icon"><Moon size={20} /></div>
                    </div>
                    <div className="stat-value">{sleepHours} <span style={{ fontSize: "1rem", color: "#888" }}>hours</span></div>
                    <div className="stat-sub">Target: 7-8 hours</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSleepHours((v) => Math.max(4, v - 0.5))}><Minus size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSleepHours((v) => Math.min(12, v + 0.5))}><Plus size={14} /></button>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setSleepHours(7.5)}>Reset to 7.5h</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Quality</span>
                      <div className="card-icon"><Star size={20} /></div>
                    </div>
                    <div className="stat-value">{sleepQuality}%</div>
                    <div className="stat-sub">Quality rating</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${sleepQuality}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSleepQuality((v) => Math.max(20, v - 5))}><Minus size={14} /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSleepQuality((v) => Math.min(100, v + 5))}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Sleep Hygiene Tips</span>
                    <div className="card-icon"><Sparkles size={20} /></div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Moon size={18} /></div>
                    <div>
                      <div className="insight-title">Consistent Schedule</div>
                      <div className="insight-text">Go to bed and wake up at the same time every day to regulate your sleep cycle.</div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Phone size={18} /></div>
                    <div>
                      <div className="insight-title">Screen-Free Zone</div>
                      <div className="insight-text">Avoid screens 1 hour before bedtime. Blue light disrupts melatonin production.</div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon"><Coffee size={18} /></div>
                    <div>
                      <div className="insight-title">Caffeine Limit</div>
                      <div className="insight-text">Avoid caffeine after 2 PM. It can stay in your system for up to 8 hours.</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Bedtime Routine Checklist</span>
                  </div>
                  {["Take evening medications", "Drink herbal tea", "Gentle stretching", "Read or listen to calm music", "Turn off screens", "Set alarm for morning"].map((task, i) => (
                    <div key={i} className="routine-item" style={{ cursor: "pointer" }} onClick={(e) => { e.currentTarget.classList.toggle("completed"); e.currentTarget.querySelector(".routine-check").classList.toggle("completed"); }}>
                      <div className="routine-check"><CheckCircle2 size={16} style={{ opacity: 0 }} /></div>
                      <div className="routine-text">{task}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FALL PREVENTION */}
            {activeTab === "fall-prevention" && (
              <motion.div key="fall-prevention" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Fall Risk Assessment</span>
                    <div className="card-icon"><Shield size={20} /></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ flex: 1 }}>
                      <div className="stat-value" style={{ color: fallRisk === "Low" ? "#10B981" : fallRisk === "Moderate" ? "#FFD700" : "#EF4444" }}>{fallRisk}</div>
                      <div className="stat-sub">Current fall risk level</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setFallRisk("Low")}>Low</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setFallRisk("Moderate")}>Moderate</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setFallRisk("High")}>High</button>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div className="stat-value">{balanceScore}%</div>
                      <div className="stat-sub">Balance Score</div>
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Emergency Contacts</span>
                    </div>
                    {emergencyContacts.map((contact, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)", marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,215,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700" }}>
                          <Phone size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{contact.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#888" }}>{contact.phone}</div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 8 }}>
                      <Plus size={14} style={{ marginRight: 4 }} />Add Contact
                    </button>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Quick Actions</span>
                    </div>
                    <button className="emergency-btn">
                      <AlertTriangle size={20} />
                      Emergency Alert
                    </button>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-secondary" style={{ width: "100%", padding: "14px", marginBottom: 8 }}>
                        <Phone size={18} style={{ marginRight: 8 }} />Call Emergency Services
                      </button>
                      <button className="btn btn-secondary" style={{ width: "100%", padding: "14px" }}>
                        <Users size={18} style={{ marginRight: 8 }} />Notify Family
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Home Safety Checklist</span>
                  </div>
                  {["Clear walkways and remove tripping hazards", "Install grab bars in bathroom", "Ensure adequate lighting", "Keep frequently used items within reach", "Secure loose rugs with non-slip backing", "Keep a phone nearby at all times"].map((item, i) => (
                    <div key={i} className="routine-item" style={{ cursor: "pointer" }} onClick={(e) => { e.currentTarget.classList.toggle("completed"); e.currentTarget.querySelector(".routine-check").classList.toggle("completed"); }}>
                      <div className="routine-check"><CheckCircle2 size={16} style={{ opacity: 0 }} /></div>
                      <div className="routine-text">{item}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* BREATHING */}
            {activeTab === "breathing" && (
              <motion.div key="breathing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
                  <div className="card-header" style={{ justifyContent: "center", marginBottom: 40 }}>
                    <span className="card-title" style={{ fontSize: "1.2rem" }}>Guided Breathing Exercise</span>
                  </div>

                  <motion.div
                    className={`breathing-circle ${breathingActive ? breathPhase : ""}`}
                    onClick={() => setBreathingActive(!breathingActive)}
                  >
                    <div className="breathing-text">
                      {breathingActive ? breathPhase : "Tap to Start"}
                    </div>
                  </motion.div>

                  <p style={{ color: "#888", marginTop: 24, fontSize: "0.95rem" }}>
                    {breathingActive ? "Breathe with the circle. Inhale as it expands, exhale as it contracts." : "Tap the circle to begin a guided breathing session. 4-second inhale, hold, exhale, hold."}
                  </p>

                  <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setBreathingActive(false)}>Reset</button>
                    <button className="btn btn-primary" onClick={() => setHeartRate((v) => Math.max(60, v - 3))}>Log Session (-3 BPM)</button>
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Benefits</span>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Heart size={18} /></div>
                      <div>
                        <div className="insight-title">Reduces Heart Rate</div>
                        <div className="insight-text">Deep breathing activates the parasympathetic nervous system, lowering heart rate naturally.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Brain size={18} /></div>
                      <div>
                        <div className="insight-title">Improves Focus</div>
                        <div className="insight-text">Regular breathing practice enhances cognitive function and mental clarity.</div>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon"><Moon size={18} /></div>
                      <div>
                        <div className="insight-title">Better Sleep</div>
                        <div className="insight-text">Practice before bed to calm your mind and improve sleep quality.</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Session Stats</span>
                    </div>
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#FFD700" }}>12</div>
                      <div style={{ color: "#888", marginTop: 4 }}>sessions completed this week</div>
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#888" }}>Average HR reduction</span>
                          <span style={{ color: "#10B981", fontWeight: 700 }}>-5 BPM</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: "75%", background: "linear-gradient(90deg, #10B981, #059669)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FAMILY CONNECT */}
            {activeTab === "family" && (
              <motion.div key="family" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="grid-2" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Family Members</span>
                      <button className="btn btn-primary btn-sm"><Plus size={14} style={{ marginRight: 4 }} />Add</button>
                    </div>
                    {[
                      { name: "Sarah Doe", relation: "Daughter", status: "Online", avatar: "SD" },
                      { name: "Mike Doe", relation: "Son", status: "Last seen 2h ago", avatar: "MD" },
                      { name: "Dr. Johnson", relation: "Physician", status: "Online", avatar: "DJ" },
                    ].map((member, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)", marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #FFD700, #D4AF37)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700 }}>
                          {member.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{member.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#888" }}>{member.relation}</div>
                        </div>
                        <div className="badge" style={{ background: member.status === "Online" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)", color: member.status === "Online" ? "#10B981" : "#666" }}>
                          {member.status}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Share Health Status</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Share Vitals", icon: HeartPulse },
                        { label: "Share Activity", icon: Footprints },
                        { label: "Share Sleep", icon: Moon },
                        { label: "Share Meds", icon: Pill },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button key={i} className="btn btn-secondary" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <Icon size={24} style={{ color: "#FFD700" }} />
                            <span style={{ fontSize: "0.85rem" }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }}>
                      Share All Health Data
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Messages</span>
                    <span className="badge badge-gold">{familyMessages.filter((m) => !m.read).length} unread</span>
                  </div>

                  <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
                    {familyMessages.map((msg) => (
                      <div key={msg.id} className={`message-item ${msg.read ? "" : "unread"}`}>
                        <div className="message-header">
                          <span className="message-from">{msg.from}</span>
                          <span className="message-time">{msg.time}</span>
                        </div>
                        <div className="message-text">{msg.message}</div>
                      </div>
                    ))}
                  </div>

                  <div className="ai-chat-input">
                    <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMessage()} />
                    <button className="btn btn-primary btn-sm" onClick={addMessage}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* JOURNAL */}
            {activeTab === "journal" && (
              <motion.div key="journal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">How are you feeling?</span>
                    <div className="card-icon"><Smile size={20} /></div>
                  </div>

                  <div className="mood-selector">
                    {[
                      { value: 1, emoji: "😢", label: "Terrible" },
                      { value: 2, emoji: "😟", label: "Bad" },
                      { value: 3, emoji: "😐", label: "Okay" },
                      { value: 4, emoji: "😊", label: "Good" },
                      { value: 5, emoji: "😄", label: "Great" },
                    ].map((m) => (
                      <div key={m.value} className={`mood-option ${mood === m.value ? "active" : ""}`} onClick={() => setMood(m.value)} title={m.label}>
                        {m.emoji}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <textarea className="input-field" placeholder="Write about how you're feeling today..." value={journalInput} onChange={(e) => setJournalInput(e.target.value)} style={{ minHeight: 80, resize: "vertical", lineHeight: 1.6 }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={addJournalEntry}>
                      <Save size={14} style={{ marginRight: 6 }} />Save Entry
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Journal History</span>
                    <span className="badge badge-gold">{healthJournal.length} entries</span>
                  </div>

                  {healthJournal.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                      <FileText size={40} style={{ color: "#333", marginBottom: 16 }} />
                      <div>No journal entries yet</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Start tracking your daily health experience</div>
                    </div>
                  ) : (
                    <div className="journal-list">
                      {healthJournal.map((entry) => {
                        const moodEmojis = ["😢", "😟", "😐", "😊", "😄"];
                        return (
                          <div key={entry.id} className="journal-item">
                            <div className="journal-meta">
                              <span className="journal-date">{entry.date} at {entry.time}</span>
                              <span className="journal-mood">{moodEmojis[entry.mood - 1] || "😐"}</span>
                            </div>
                            <div className="journal-text">{entry.text}</div>
                            <div className="journal-actions">
                              <button className="btn btn-sm btn-danger" onClick={() => deleteJournalEntry(entry.id)}>
                                <Trash2 size={12} style={{ marginRight: 4 }} />Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
