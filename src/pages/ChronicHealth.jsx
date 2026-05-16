import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  Activity,
  Shield,
  Brain,
  Footprints,
  TrendingDown,
  Apple,
  Moon,
  ChevronRight,
  TimerReset,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Droplets,
  Thermometer,
  Pill,
  Dumbbell,
  BedDouble,
  Wind,
  Sparkles,
  BookOpen,
  Calendar,
  BarChart3,
  Zap,
  Target,
  Clock,
  Stethoscope,
  Bell,
  Settings,
  Search,
  Filter,
  Edit3,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  TrendingUp,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  X,
  Menu,
  User,
  LogOut,
  BellRing,
  ChevronLeft,
  PlusCircle,
  FileText,
  Camera,
  Mic,
  Send,
  MessageCircle,
  Heart,
  Weight,
  Eye,
  Ear,
  Hand,
  Smile,
  Frown,
  Meh,
  Coffee,
  GlassWater,
  Sun,
  Cloud,
  CloudRain,
} from "lucide-react";

const HEALTH_CATEGORIES = [
  { id: "diabetes", name: "Diabetes", icon: Droplets, color: "#FFD700" },
  { id: "cardio", name: "Cardiovascular", icon: HeartPulse, color: "#FFD700" },
  { id: "inflammation", name: "Inflammation", icon: Flame, color: "#FFD700" },
  { id: "neurological", name: "Neurological", icon: Brain, color: "#FFD700" },
  { id: "metabolic", name: "Metabolic", icon: Activity, color: "#FFD700" },
];

const MEDICATIONS = [
  { id: 1, name: "Metformin", dosage: "500mg", time: "Morning", taken: false },
  { id: 2, name: "Lisinopril", dosage: "10mg", time: "Evening", taken: false },
  { id: 3, name: "Vitamin D3", dosage: "2000 IU", time: "Morning", taken: false },
  { id: 4, name: "Omega-3", dosage: "1000mg", time: "Afternoon", taken: false },
];

const MEAL_LOGS = [
  { id: 1, meal: "Breakfast", time: "8:00 AM", carbs: 45, protein: 20, fat: 12, calories: 350, glucoseBefore: 92, glucoseAfter: 118 },
  { id: 2, meal: "Lunch", time: "12:30 PM", carbs: 60, protein: 30, fat: 15, calories: 480, glucoseBefore: 98, glucoseAfter: 135 },
  { id: 3, meal: "Snack", time: "3:00 PM", carbs: 25, protein: 8, fat: 5, calories: 180, glucoseBefore: 105, glucoseAfter: 128 },
  { id: 4, meal: "Dinner", time: "7:00 PM", carbs: 55, protein: 25, fat: 18, calories: 520, glucoseBefore: 100, glucoseAfter: 142 },
];

const SYMPTOMS = [
  { id: "fatigue", name: "Fatigue", icon: Meh },
  { id: "dizziness", name: "Dizziness", icon: Cloud },
  { id: "headache", name: "Headache", icon: Brain },
  { id: "nausea", name: "Nausea", icon: Frown },
  { id: "pain", name: "Pain", icon: AlertTriangle },
  { id: "swelling", name: "Swelling", icon: Droplets },
  { id: "breathless", name: "Breathlessness", icon: Wind },
  { id: "insomnia", name: "Insomnia", icon: Moon },
];

function Flame(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}

export default function ChronicHealth() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [medicineLog, setMedicineLog] = useState(MEDICATIONS);
  const [healthScore, setHealthScore] = useState(84);
  const [steps, setSteps] = useState(8420);
  const [glucoseReadings, setGlucoseReadings] = useState([
    { id: 1, value: 96, time: "8:00 AM", date: "Today", type: "Fasting" },
    { id: 2, value: 128, time: "9:30 AM", date: "Today", type: "Post-meal" },
    { id: 3, value: 102, time: "12:00 PM", date: "Today", type: "Pre-meal" },
    { id: 4, value: 135, time: "2:00 PM", date: "Today", type: "Post-meal" },
    { id: 5, value: 98, time: "5:00 PM", date: "Today", type: "Pre-meal" },
  ]);
  const [bloodPressure, setBloodPressure] = useState({ systolic: 118, diastolic: 76 });
  const [waterIntake, setWaterIntake] = useState(6);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [showAddGlucose, setShowAddGlucose] = useState(false);
  const [newGlucose, setNewGlucose] = useState("");
  const [newGlucoseType, setNewGlucoseType] = useState("Fasting");
  const [mealLog, setMealLog] = useState(MEAL_LOGS);
  const [activeMealTab, setActiveMealTab] = useState("daily");
  const [healthJournal, setHealthJournal] = useState([]);
  const [journalInput, setJournalInput] = useState("");
  const [mood, setMood] = useState(3);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(85);
  const [exerciseMinutes, setExerciseMinutes] = useState(45);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chronicHealthData");
    if (saved) {
      const parsed = JSON.parse(saved);
      setHealthScore(parsed.healthScore || 84);
      setSteps(parsed.steps || 8420);
      setGlucoseReadings(parsed.glucoseReadings || glucoseReadings);
      setBloodPressure(parsed.bloodPressure || { systolic: 118, diastolic: 76 });
      setWaterIntake(parsed.waterIntake || 6);
      setMedicineLog(parsed.medicineLog || MEDICATIONS);
      setSelectedSymptoms(parsed.selectedSymptoms || []);
      setMealLog(parsed.mealLog || MEAL_LOGS);
      setHealthJournal(parsed.healthJournal || []);
      setMood(parsed.mood || 3);
      setSleepHours(parsed.sleepHours || 7.5);
      setSleepQuality(parsed.sleepQuality || 85);
      setExerciseMinutes(parsed.exerciseMinutes || 45);
    }
  }, []);

  useEffect(() => {
    const data = {
      healthScore, steps, glucoseReadings, bloodPressure,
      waterIntake, medicineLog, selectedSymptoms, mealLog,
      healthJournal, mood, sleepHours, sleepQuality, exerciseMinutes,
    };
    localStorage.setItem("chronicHealthData", JSON.stringify(data));
  }, [healthScore, steps, glucoseReadings, bloodPressure, waterIntake, medicineLog, selectedSymptoms, mealLog, healthJournal, mood, sleepHours, sleepQuality, exerciseMinutes]);

  const glucoseAvg = useMemo(() => {
    if (glucoseReadings.length === 0) return 0;
    return Math.round(glucoseReadings.reduce((a, b) => a + b.value, 0) / glucoseReadings.length);
  }, [glucoseReadings]);

  const glucoseTrend = useMemo(() => {
    if (glucoseReadings.length < 2) return "stable";
    const last = glucoseReadings[glucoseReadings.length - 1].value;
    const prev = glucoseReadings[glucoseReadings.length - 2].value;
    return last > prev + 5 ? "up" : last < prev - 5 ? "down" : "stable";
  }, [glucoseReadings]);

  const dailyCalories = useMemo(() => {
    return mealLog.reduce((a, m) => a + m.calories, 0);
  }, [mealLog]);

  const dailyCarbs = useMemo(() => {
    return mealLog.reduce((a, m) => a + m.carbs, 0);
  }, [mealLog]);

  const medicationsTaken = useMemo(() => {
    return medicineLog.filter((m) => m.taken).length;
  }, [medicineLog]);

  const riskLevel = useMemo(() => {
    let risk = 0;
    if (glucoseAvg > 140) risk += 2;
    else if (glucoseAvg > 120) risk += 1;
    if (bloodPressure.systolic > 140) risk += 2;
    else if (bloodPressure.systolic > 120) risk += 1;
    if (sleepHours < 6) risk += 1;
    if (selectedSymptoms.length > 3) risk += 2;
    else if (selectedSymptoms.length > 0) risk += 1;
    return risk;
  }, [glucoseAvg, bloodPressure, sleepHours, selectedSymptoms]);

  const toggleMedicine = useCallback((id) => {
    setMedicineLog((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
  }, []);

  const addGlucoseReading = useCallback(() => {
    if (!newGlucose || isNaN(newGlucose)) return;
    const value = parseInt(newGlucose);
    const reading = {
      id: Date.now(),
      value,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      date: "Today",
      type: newGlucoseType,
    };
    setGlucoseReadings((prev) => [...prev, reading]);
    setNewGlucose("");
    setShowAddGlucose(false);
  }, [newGlucose, newGlucoseType]);

  const toggleSymptom = useCallback((id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

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

  const notifications = useMemo(() => {
    const notifs = [];
    if (medicationsTaken < medicineLog.length) {
      notifs.push({ id: 1, type: "warning", message: `${medicineLog.length - medicationsTaken} medications pending today` });
    }
    if (waterIntake < 8) {
      notifs.push({ id: 2, type: "info", message: `${8 - waterIntake} more glasses of water recommended` });
    }
    if (glucoseAvg > 130) {
      notifs.push({ id: 3, type: "alert", message: `Average glucose ${glucoseAvg} mg/dL - above target range` });
    }
    if (steps < 5000) {
      notifs.push({ id: 4, type: "info", message: `Only ${steps.toLocaleString()} steps today - aim for 10,000` });
    }
    return notifs;
  }, [medicationsTaken, medicineLog.length, waterIntake, glucoseAvg, steps]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "glucose", label: "Glucose Tracker", icon: Droplets },
    { id: "medication", label: "Medication", icon: Pill },
    { id: "nutrition", label: "Nutrition", icon: Apple },
    { id: "symptoms", label: "Symptoms", icon: Stethoscope },
    { id: "journal", label: "Health Journal", icon: BookOpen },
    { id: "lifestyle", label: "Lifestyle", icon: Activity },
  ];

  const getGlucoseStatus = (value) => {
    if (value < 70) return { label: "Low", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
    if (value <= 100) return { label: "Normal", color: "#10B981", bg: "rgba(16,185,129,0.15)" };
    if (value <= 140) return { label: "Elevated", color: "#FFD700", bg: "rgba(255,215,0,0.15)" };
    return { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
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

        .nav-item:hover {
          background: rgba(255,215,0,0.06);
          color: #FFD700;
        }

        .nav-item.active {
          background: rgba(255,215,0,0.1);
          color: #FFD700;
          font-weight: 600;
        }

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

        .top-bar-left h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
        }

        .top-bar-left p {
          color: #888;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

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

        .top-bar-btn:hover {
          background: rgba(255,215,0,0.08);
          color: #FFD700;
          border-color: rgba(255,215,0,0.2);
        }

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

        .notif-item:last-child { margin-bottom: 0; }

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

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,215,0,0.1);
          border-radius: 24px;
          padding: 24px;
          backdrop-filter: blur(14px);
          transition: all 0.3s ease;
        }

        .card:hover {
          border-color: rgba(255,215,0,0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 0.9rem;
          color: #888;
          font-weight: 500;
        }

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

        .stat-value {
          font-size: 2.4rem;
          font-weight: 800;
          color: #FFD700;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-sub {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #888;
        }

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

        .health-score-ring svg {
          transform: rotate(-90deg);
        }

        .health-score-ring .score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .health-score-ring .score-number {
          font-size: 2.2rem;
          font-weight: 900;
          color: #FFD700;
          line-height: 1;
        }

        .health-score-ring .score-label {
          font-size: 0.7rem;
          color: #888;
          margin-top: 2px;
        }

        .glucose-chart {
          height: 200px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding-top: 20px;
        }

        .glucose-bar {
          flex: 1;
          border-radius: 8px 8px 0 0;
          background: linear-gradient(180deg, #FFD700, #D4AF37);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 20px;
        }

        .glucose-bar:hover {
          opacity: 0.8;
        }

        .glucose-bar .bar-label {
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          color: #666;
          white-space: nowrap;
        }

        .glucose-bar .bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          font-weight: 700;
          color: #FFD700;
        }

        .medication-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .medication-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          transition: all 0.2s ease;
        }

        .medication-item:hover {
          background: rgba(255,215,0,0.04);
        }

        .med-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .med-check.taken {
          background: #FFD700;
          border-color: #FFD700;
          color: #000;
        }

        .med-check:hover {
          border-color: #FFD700;
        }

        .med-info { flex: 1; }
        .med-name { font-weight: 600; font-size: 0.95rem; }
        .med-dosage { font-size: 0.8rem; color: #888; margin-top: 2px; }
        .med-time {
          font-size: 0.75rem;
          color: #666;
          background: rgba(255,255,255,0.04);
          padding: 4px 10px;
          border-radius: 8px;
        }

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

        .btn-secondary:hover {
          background: rgba(255,215,0,0.08);
          border-color: rgba(255,215,0,0.25);
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.8rem;
          border-radius: 10px;
        }

        .btn-danger {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
          border: 1px solid rgba(239,68,68,0.2);
        }

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

        .input-field:focus {
          border-color: rgba(255,215,0,0.4);
          background: rgba(255,215,0,0.04);
        }

        .input-field::placeholder { color: #555; }

        .select-field {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,215,0,0.12);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .select-field option { background: #111; color: #fff; }

        .symptom-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .symptom-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .symptom-item:hover {
          background: rgba(255,215,0,0.06);
        }

        .symptom-item.active {
          background: rgba(255,215,0,0.12);
          border-color: #FFD700;
        }

        .symptom-item .symptom-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255,215,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
        }

        .symptom-item .symptom-name {
          font-size: 0.8rem;
          color: #aaa;
          text-align: center;
        }

        .symptom-item.active .symptom-name { color: #FFD700; }

        .journal-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .journal-item {
          padding: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
        }

        .journal-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .journal-date { font-size: 0.75rem; color: #666; }
        .journal-mood { font-size: 1.2rem; }
        .journal-text { font-size: 0.9rem; color: #ccc; line-height: 1.6; }
        .journal-actions { display: flex; gap: 8px; margin-top: 8px; }

        .water-tracker {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
          padding: 20px 0;
        }

        .water-drop {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59,130,246,0.1);
          border: 2px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #3B82F6;
        }

        .water-drop.filled {
          background: rgba(59,130,246,0.25);
          border-color: #3B82F6;
          color: #3B82F6;
        }

        .water-drop:hover {
          transform: scale(1.1);
        }

        .meal-card {
          padding: 20px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.08);
          margin-bottom: 16px;
        }

        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .meal-name { font-weight: 700; font-size: 1.1rem; }
        .meal-time { font-size: 0.8rem; color: #666; }

        .meal-macros {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .macro-item {
          text-align: center;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
        }

        .macro-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #FFD700;
        }

        .macro-label {
          font-size: 0.7rem;
          color: #666;
          margin-top: 4px;
        }

        .glucose-range-bar {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #EF4444 0%, #EF4444 20%, #10B981 20%, #10B981 60%, #FFD700 60%, #FFD700 80%, #EF4444 80%, #EF4444 100%);
          position: relative;
          margin: 20px 0 30px;
        }

        .glucose-marker {
          position: absolute;
          top: -8px;
          width: 4px;
          height: 28px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(255,215,0,0.5);
        }

        .risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .risk-low { background: rgba(16,185,129,0.12); color: #10B981; }
        .risk-medium { background: rgba(255,215,0,0.12); color: #FFD700; }
        .risk-high { background: rgba(239,68,68,0.12); color: #EF4444; }

        .tab-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tab-pill {
          padding: 8px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.1);
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .tab-pill:hover {
          background: rgba(255,215,0,0.06);
          color: #FFD700;
        }

        .tab-pill.active {
          background: rgba(255,215,0,0.12);
          color: #FFD700;
          border-color: rgba(255,215,0,0.3);
          font-weight: 600;
        }

        .lifestyle-meter {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .lifestyle-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,215,0,0.08);
          color: #FFD700;
          flex-shrink: 0;
        }

        .lifestyle-info { flex: 1; }
        .lifestyle-label { font-size: 0.85rem; color: #888; }
        .lifestyle-value { font-size: 1.3rem; font-weight: 700; color: #fff; }

        .slider-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          position: relative;
          margin: 8px 0;
        }

        .slider-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFD700;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255,215,0,0.4);
        }

        .mood-selector {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 16px 0;
        }

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

        .mood-option.active {
          border-color: #FFD700;
          background: rgba(255,215,0,0.12);
        }

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

        .ai-chat-input {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,215,0,0.1);
        }

        .ai-chat-input input {
          flex: 1;
          background: none;
          border: none;
          color: #fff;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          outline: none;
        }

        .ai-chat-input input::placeholder { color: #555; }

        .section-label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-gold { background: rgba(255,215,0,0.12); color: #FFD700; }
        .badge-green { background: rgba(16,185,129,0.12); color: #10B981; }
        .badge-red { background: rgba(239,68,68,0.12); color: #EF4444; }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 40;
        }

        @media (max-width: 1200px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .symptom-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 1024px) {
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.active { display: block; }
          .main-content { margin-left: 0; padding: 20px 16px; }
          .mobile-menu-btn { display: flex; }
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .symptom-grid { grid-template-columns: repeat(2, 1fr); }
          .meal-macros { grid-template-columns: repeat(2, 1fr); }
          .top-bar { flex-wrap: wrap; gap: 16px; }
        }
      `}</style>

      <div className="app-container">
        <div
          className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <HeartPulse size={22} />
            </div>
            <span className="sidebar-logo-text">ChronicAI</span>
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
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={20} />
              </button>
              <div className="top-bar-left">
                <h1>
                  {tabs.find((t) => t.id === activeTab)?.label || "Dashboard"}
                </h1>
                <p>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="top-bar-right">
              <div style={{ position: "relative" }}>
                <button
                  className="top-bar-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="notif-badge">{notifications.length}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="notification-dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          marginBottom: 16,
                          color: "#FFD700",
                        }}
                      >
                        Notifications
                      </div>
                      {notifications.map((notif) => (
                        <div key={notif.id} className="notif-item">
                          <div
                            className="notif-icon"
                            style={{
                              background:
                                notif.type === "alert"
                                  ? "rgba(239,68,68,0.15)"
                                  : notif.type === "warning"
                                  ? "rgba(255,215,0,0.15)"
                                  : "rgba(59,130,246,0.15)",
                              color:
                                notif.type === "alert"
                                  ? "#EF4444"
                                  : notif.type === "warning"
                                  ? "#FFD700"
                                  : "#3B82F6",
                            }}
                          >
                            {notif.type === "alert" ? (
                              <AlertTriangle size={16} />
                            ) : notif.type === "warning" ? (
                              <AlertCircle size={16} />
                            ) : (
                              <Info size={16} />
                            )}
                          </div>
                          <div>
                            <div className="notif-text">{notif.message}</div>
                            <div className="notif-time">Just now</div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px 0",
                            color: "#666",
                          }}
                        >
                          No notifications
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="top-bar-btn">
                <Search size={18} />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid-4">
                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="card-header">
                      <span className="card-title">Health Score</span>
                      <div className="card-icon">
                        <Shield size={20} />
                      </div>
                    </div>
                    <div className="health-score-ring">
                      <svg width="140" height="140">
                        <circle
                          cx="70"
                          cy="70"
                          r="60"
                          fill="none"
                          stroke="rgba(255,215,0,0.1)"
                          strokeWidth="12"
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r="60"
                          fill="none"
                          stroke="url(#goldGradient)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${healthScore * 3.77} ${377 - healthScore * 3.77}`}
                          style={{ transition: "stroke-dasharray 1s ease" }}
                        />
                        <defs>
                          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FFD700" />
                            <stop offset="100%" stopColor="#D4AF37" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="score-value">
                        <div className="score-number">{healthScore}</div>
                        <div className="score-label">/ 100</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <span
                        className={`risk-badge ${
                          riskLevel === 0
                            ? "risk-low"
                            : riskLevel <= 2
                            ? "risk-medium"
                            : "risk-high"
                        }`}
                      >
                        {riskLevel === 0
                          ? "Low Risk"
                          : riskLevel <= 2
                          ? "Moderate Risk"
                          : "High Risk"}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="card-header">
                      <span className="card-title">Avg Glucose</span>
                      <div className="card-icon">
                        <Droplets size={20} />
                      </div>
                    </div>
                    <div className="stat-value">{glucoseAvg} mg/dL</div>
                    <div className="stat-sub">
                      {glucoseTrend === "up" ? (
                        <>
                          <ArrowUpRight size={14} className="trend-down" />
                          <span className="trend-down">Trending up</span>
                        </>
                      ) : glucoseTrend === "down" ? (
                        <>
                          <ArrowDownRight size={14} className="trend-up" />
                          <span className="trend-up">Trending down</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: "#10B981" }}>●</span>
                          <span>Stable</span>
                        </>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (glucoseAvg / 200) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="card-header">
                      <span className="card-title">Blood Pressure</span>
                      <div className="card-icon">
                        <HeartPulse size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {bloodPressure.systolic}/{bloodPressure.diastolic}
                    </div>
                    <div className="stat-sub">
                      <span
                        style={{
                          color:
                            bloodPressure.systolic <= 120
                              ? "#10B981"
                              : "#FFD700",
                        }}
                      >
                        {bloodPressure.systolic <= 120
                          ? "Normal"
                          : "Elevated"}
                      </span>
                    </div>
                    <div className="glucose-range-bar">
                      <div
                        className="glucose-marker"
                        style={{
                          left: `${
                            ((bloodPressure.systolic - 70) / 130) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="card-header">
                      <span className="card-title">Daily Steps</span>
                      <div className="card-icon">
                        <Footprints size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {steps.toLocaleString()}
                    </div>
                    <div className="stat-sub">
                      <span>Goal: 10,000</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (steps / 10000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Glucose Trend (Today)</span>
                      <div className="card-icon">
                        <Activity size={20} />
                      </div>
                    </div>
                    <div className="glucose-chart">
                      {glucoseReadings.map((reading, i) => (
                        <div
                          key={reading.id}
                          className="glucose-bar"
                          style={{
                            height: `${Math.max(
                              (reading.value / 200) * 100,
                              10
                            )}%`,
                            background:
                              reading.value > 140
                                ? "linear-gradient(180deg, #EF4444, #DC2626)"
                                : reading.value > 120
                                ? "linear-gradient(180deg, #FFD700, #D4AF37)"
                                : "linear-gradient(180deg, #10B981, #059669)",
                          }}
                        >
                          <span className="bar-value">
                            {reading.value}
                          </span>
                          <span className="bar-label">{reading.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">AI Health Insights</span>
                      <div className="card-icon">
                        <Sparkles size={20} />
                      </div>
                    </div>

                    <div className="insight-card">
                      <div className="insight-icon">
                        <Apple size={18} />
                      </div>
                      <div>
                        <div className="insight-title">Nutrition Alert</div>
                        <div className="insight-text">
                          Your average carb intake is {Math.round(dailyCarbs / mealLog.length)}g per meal. Consider reducing to under 45g for better glucose control.
                        </div>
                      </div>
                    </div>

                    <div className="insight-card">
                      <div className="insight-icon">
                        <Moon size={18} />
                      </div>
                      <div>
                        <div className="insight-title">Sleep Quality</div>
                        <div className="insight-text">
                          {sleepHours} hours of sleep detected. Aim for 7-8 hours for optimal inflammation reduction and recovery.
                        </div>
                      </div>
                    </div>

                    <div className="insight-card">
                      <div className="insight-icon">
                        <Activity size={18} />
                      </div>
                      <div>
                        <div className="insight-title">Activity Recommendation</div>
                        <div className="insight-text">
                          A 15-minute walk after meals can reduce post-meal glucose spikes by up to 30%.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Medication Adherence</span>
                      <div className="card-icon">
                        <Pill size={20} />
                      </div>
                    </div>
                    <div
                      className="stat-value"
                      style={{ fontSize: "2rem" }}
                    >
                      {medicationsTaken}/{medicineLog.length}
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (medicationsTaken / medicineLog.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: "0.85rem",
                        color: "#888",
                      }}
                    >
                      Today's medications
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Water Intake</span>
                      <div className="card-icon">
                        <GlassWater size={20} />
                      </div>
                    </div>
                    <div className="water-tracker">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div
                          key={n}
                          className={`water-drop ${
                            n <= waterIntake ? "filled" : ""
                          }`}
                          onClick={() => setWaterIntake(n <= waterIntake ? n - 1 : n)}
                        >
                          <Droplets size={16} />
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "#888",
                      }}
                    >
                      {waterIntake}/8 glasses
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Symptoms Today</span>
                      <div className="card-icon">
                        <Stethoscope size={20} />
                      </div>
                    </div>
                    <div
                      className="stat-value"
                      style={{ fontSize: "2rem" }}
                    >
                      {selectedSymptoms.length}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {selectedSymptoms.length === 0 ? (
                        <span style={{ color: "#666", fontSize: "0.85rem" }}>
                          No symptoms recorded
                        </span>
                      ) : (
                        selectedSymptoms.map((s) => {
                          const symptom = SYMPTOMS.find((sy) => sy.id === s);
                          return (
                            <span
                              key={s}
                              className="badge badge-gold"
                            >
                              {symptom?.name || s}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">AI Health Assistant</span>
                    <div className="card-icon">
                      <MessageCircle size={20} />
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,215,0,0.04)",
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      minHeight: 120,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #FFD700, #D4AF37)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#000",
                          flexShrink: 0,
                        }}
                      >
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#FFD700",
                            marginBottom: 8,
                          }}
                        >
                          ChronicAI Assistant
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#ccc",
                            lineHeight: 1.7,
                          }}
                        >
                          Hello! Based on your health data today, your glucose
                          levels are averaging {glucoseAvg} mg/dL.{" "}
                          {glucoseAvg > 120
                            ? "This is slightly elevated. Consider taking a 15-minute walk after meals and reducing carbohydrate intake."
                            : "This is within a healthy range. Keep up the great work with your current routine!"}{" "}
                          Your medication adherence is at{" "}
                          {Math.round(
                            (medicationsTaken / medicineLog.length) * 100
                          )}
                          %.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ai-chat-input">
                    <input
                      type="text"
                      placeholder="Ask about your health..."
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Send size={14} />
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GLUCOSE TRACKER TAB */}
            {activeTab === "glucose" && (
              <motion.div
                key="glucose"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid-4">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Current Reading</span>
                      <div className="card-icon">
                        <Droplets size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {glucoseReadings.length > 0
                        ? glucoseReadings[glucoseReadings.length - 1].value
                        : "--"}
                      <span style={{ fontSize: "1rem", color: "#888" }}>
                        {" "}
                        mg/dL
                      </span>
                    </div>
                    <div className="stat-sub">
                      Last measured:{" "}
                      {glucoseReadings.length > 0
                        ? glucoseReadings[glucoseReadings.length - 1].time
                        : "--"}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Average Today</span>
                      <div className="card-icon">
                        <BarChart3 size={20} />
                      </div>
                    </div>
                    <div className="stat-value">{glucoseAvg} mg/dL</div>
                    <div className="stat-sub">
                      {glucoseReadings.length} readings today
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Lowest</span>
                      <div className="card-icon">
                        <ArrowDownRight size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {glucoseReadings.length > 0
                        ? Math.min(
                            ...glucoseReadings.map((r) => r.value)
                          )
                        : "--"}
                      <span style={{ fontSize: "1rem", color: "#888" }}>
                        {" "}
                        mg/dL
                      </span>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Highest</span>
                      <div className="card-icon">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {glucoseReadings.length > 0
                        ? Math.max(
                            ...glucoseReadings.map((r) => r.value)
                          )
                        : "--"}
                      <span style={{ fontSize: "1rem", color: "#888" }}>
                        {" "}
                        mg/dL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">Glucose Range</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    <span>Low</span>
                    <span>Normal</span>
                    <span>Elevated</span>
                    <span>High</span>
                  </div>
                  <div className="glucose-range-bar">
                    {glucoseReadings.map((reading, i) => (
                      <div
                        key={reading.id}
                        className="glucose-marker"
                        style={{
                          left: `${Math.min(
                            ((reading.value - 50) / 200) * 100,
                            98
                          )}%`,
                          background: getGlucoseStatus(reading.value).color,
                          boxShadow: `0 0 8px ${getGlucoseStatus(reading.value).color}`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <span className="card-title">Reading History</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddGlucose(true)}
                    >
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Add Reading
                    </button>
                  </div>

                  <div className="glucose-chart" style={{ height: 180 }}>
                    {glucoseReadings.map((reading) => (
                      <div
                        key={reading.id}
                        className="glucose-bar"
                        style={{
                          height: `${Math.max(
                            (reading.value / 200) * 100,
                            10
                          )}%`,
                          background: getGlucoseStatus(reading.value)
                            .bg.includes("239")
                            ? "linear-gradient(180deg, #EF4444, #DC2626)"
                            : getGlucoseStatus(reading.value).color === "#FFD700"
                            ? "linear-gradient(180deg, #FFD700, #D4AF37)"
                            : "linear-gradient(180deg, #10B981, #059669)",
                        }}
                      >
                        <span className="bar-value">{reading.value}</span>
                        <span className="bar-label">{reading.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">All Readings</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {glucoseReadings
                      .slice()
                      .reverse()
                      .map((reading) => (
                        <div
                          key={reading.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${getGlucoseStatus(reading.value).color}30`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                            }}
                          >
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  getGlucoseStatus(reading.value).color,
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                                {reading.value} mg/dL
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#666" }}>
                                {reading.type}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span
                              className="badge"
                              style={{
                                background: getGlucoseStatus(reading.value).bg,
                                color: getGlucoseStatus(reading.value).color,
                              }}
                            >
                              {getGlucoseStatus(reading.value).label}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "#666" }}>
                              {reading.time}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <AnimatePresence>
                  {showAddGlucose && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        padding: 20,
                      }}
                      onClick={() => setShowAddGlucose(false)}
                    >
                      <motion.div
                        className="card"
                        style={{
                          maxWidth: 420,
                          width: "100%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 24,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: 700,
                              color: "#FFD700",
                            }}
                          >
                            Add Glucose Reading
                          </h3>
                          <button
                            onClick={() => setShowAddGlucose(false)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#666",
                              cursor: "pointer",
                              padding: 4,
                            }}
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                          }}
                        >
                          <div>
                            <label
                              className="section-label"
                              style={{ marginBottom: 8, display: "block" }}
                            >
                              Glucose Level (mg/dL)
                            </label>
                            <input
                              className="input-field"
                              type="number"
                              placeholder="e.g., 96"
                              value={newGlucose}
                              onChange={(e) => setNewGlucose(e.target.value)}
                            />
                          </div>

                          <div>
                            <label
                              className="section-label"
                              style={{ marginBottom: 8, display: "block" }}
                            >
                              Reading Type
                            </label>
                            <select
                              className="select-field"
                              value={newGlucoseType}
                              onChange={(e) => setNewGlucoseType(e.target.value)}
                            >
                              <option value="Fasting">Fasting</option>
                              <option value="Pre-meal">Pre-meal</option>
                              <option value="Post-meal">Post-meal</option>
                              <option value="Bedtime">Bedtime</option>
                            </select>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginTop: 8,
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              style={{ flex: 1 }}
                              onClick={addGlucoseReading}
                            >
                              Save Reading
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setShowAddGlucose(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* MEDICATION TAB */}
            {activeTab === "medication" && (
              <motion.div
                key="medication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid-3" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Taken Today</span>
                    </div>
                    <div className="stat-value">{medicationsTaken}</div>
                    <div className="stat-sub">of {medicineLog.length} medications</div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Pending</span>
                    </div>
                    <div className="stat-value" style={{ color: "#EF4444" }}>
                      {medicineLog.length - medicationsTaken}
                    </div>
                    <div className="stat-sub">Remaining doses</div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Adherence Rate</span>
                    </div>
                    <div className="stat-value">
                      {Math.round(
                        (medicationsTaken / medicineLog.length) * 100
                      )}
                      %
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (medicationsTaken / medicineLog.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Today's Medications</span>
                    <button className="btn btn-primary btn-sm">
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Add Medication
                    </button>
                  </div>

                  <div className="medication-list">
                    {medicineLog.map((med) => (
                      <div key={med.id} className="medication-item">
                        <div
                          className={`med-check ${med.taken ? "taken" : ""}`}
                          onClick={() => toggleMedicine(med.id)}
                        >
                          {med.taken && <CheckCircle2 size={16} />}
                        </div>
                        <div className="med-info">
                          <div className="med-name">{med.name}</div>
                          <div className="med-dosage">{med.dosage}</div>
                        </div>
                        <div className="med-time">{med.time}</div>
                        <div
                          className="badge"
                          style={{
                            background: med.taken
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(255,215,0,0.12)",
                            color: med.taken ? "#10B981" : "#FFD700",
                          }}
                        >
                          {med.taken ? "Taken" : "Pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="card"
                  style={{ marginTop: 24 }}
                >
                  <div className="card-header">
                    <span className="card-title">Medication Reminders</span>
                    <div className="card-icon">
                      <Clock size={20} />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {["8:00 AM", "12:00 PM", "6:00 PM", "9:00 PM"].map(
                      (time, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 16px",
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,215,0,0.08)",
                          }}
                        >
                          <Clock size={18} style={{ color: "#FFD700" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                              {time}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#666" }}>
                              Medication reminder
                            </div>
                          </div>
                          <div
                            className="badge badge-green"
                          >
                            Active
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NUTRITION TAB */}
            {activeTab === "nutrition" && (
              <motion.div
                key="nutrition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid-4" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Total Calories</span>
                    </div>
                    <div className="stat-value">
                      {dailyCalories.toLocaleString()}
                    </div>
                    <div className="stat-sub">kcal consumed today</div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Total Carbs</span>
                    </div>
                    <div className="stat-value">{dailyCarbs}g</div>
                    <div className="stat-sub">carbohydrates</div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Meals Logged</span>
                    </div>
                    <div className="stat-value">{mealLog.length}</div>
                    <div className="stat-sub">today</div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Avg Glucose Impact</span>
                    </div>
                    <div className="stat-value">
                      {mealLog.length > 0
                        ? Math.round(
                            mealLog.reduce(
                              (a, m) => a + (m.glucoseAfter - m.glucoseBefore),
                              0
                            ) / mealLog.length
                          )
                        : 0}
                      <span style={{ fontSize: "1rem", color: "#888" }}>
                        {" "}
                        mg/dL
                      </span>
                    </div>
                    <div className="stat-sub">post-meal spike</div>
                  </div>
                </div>

                <div className="tab-pills">
                  {["daily", "weekly", "monthly", "custom"].map((tab) => (
                    <button
                      key={tab}
                      className={`tab-pill ${
                        activeMealTab === tab ? "active" : ""
                      }`}
                      onClick={() => setActiveMealTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {mealLog.map((meal) => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-header">
                      <div>
                        <div className="meal-name">{meal.meal}</div>
                        <div className="meal-time">{meal.time}</div>
                      </div>
                      <span className="badge badge-gold">
                        {meal.calories} kcal
                      </span>
                    </div>
                    <div className="meal-macros">
                      <div className="macro-item">
                        <div className="macro-value">{meal.carbs}g</div>
                        <div className="macro-label">Carbs</div>
                      </div>
                      <div className="macro-item">
                        <div className="macro-value">{meal.protein}g</div>
                        <div className="macro-label">Protein</div>
                      </div>
                      <div className="macro-item">
                        <div className="macro-value">{meal.fat}g</div>
                        <div className="macro-label">Fat</div>
                      </div>
                      <div className="macro-item">
                        <div className="macro-value">{meal.calories}</div>
                        <div className="macro-label">Calories</div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(255,215,0,0.06)",
                        border: "1px solid rgba(255,215,0,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", color: "#888" }}>
                        Glucose Impact
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#ccc",
                          }}
                        >
                          {meal.glucoseBefore} → {meal.glucoseAfter} mg/dL
                        </span>
                        <span
                          className="badge"
                          style={{
                            background:
                              meal.glucoseAfter - meal.glucoseBefore > 40
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(16,185,129,0.12)",
                            color:
                              meal.glucoseAfter - meal.glucoseBefore > 40
                                ? "#EF4444"
                                : "#10B981",
                          }}
                        >
                          +{meal.glucoseAfter - meal.glucoseBefore} mg/dL
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="card" style={{ marginTop: 8 }}>
                  <div className="card-header">
                    <span className="card-title">Nutrition Tips</span>
                    <div className="card-icon">
                      <Sparkles size={20} />
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon">
                      <Apple size={18} />
                    </div>
                    <div>
                      <div className="insight-title">Fiber Intake</div>
                      <div className="insight-text">
                        Aim for 25-30g of fiber daily. High-fiber foods slow carbohydrate absorption and help stabilize blood sugar levels.
                      </div>
                    </div>
                  </div>
                  <div className="insight-card">
                    <div className="insight-icon">
                      <GlassWater size={18} />
                    </div>
                    <div>
                      <div className="insight-title">Hydration</div>
                      <div className="insight-text">
                        Drink water before meals to help control blood sugar spikes and support kidney function.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SYMPTOMS TAB */}
            {activeTab === "symptoms" && (
              <motion.div
                key="symptoms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">
                      How are you feeling today?
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#888",
                      fontSize: "0.9rem",
                      marginBottom: 20,
                    }}
                  >
                    Select any symptoms you're experiencing. This helps track
                    patterns and improve your health insights.
                  </p>

                  <div className="symptom-grid">
                    {SYMPTOMS.map((symptom) => {
                      const Icon = symptom.icon;
                      return (
                        <div
                          key={symptom.id}
                          className={`symptom-item ${
                            selectedSymptoms.includes(symptom.id)
                              ? "active"
                              : ""
                          }`}
                          onClick={() => toggleSymptom(symptom.id)}
                        >
                          <div className="symptom-icon">
                            <Icon size={22} />
                          </div>
                          <span className="symptom-name">{symptom.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Risk Assessment</span>
                      <div className="card-icon">
                        <AlertTriangle size={20} />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px",
                          borderRadius: 14,
                          background:
                            riskLevel === 0
                              ? "rgba(16,185,129,0.08)"
                              : riskLevel <= 2
                              ? "rgba(255,215,0,0.08)"
                              : "rgba(239,68,68,0.08)",
                          border: `1px solid ${
                            riskLevel === 0
                              ? "rgba(16,185,129,0.2)"
                              : riskLevel <= 2
                              ? "rgba(255,215,0,0.2)"
                              : "rgba(239,68,68,0.2)"
                          }`,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "1.1rem",
                              color:
                                riskLevel === 0
                                  ? "#10B981"
                                  : riskLevel <= 2
                                  ? "#FFD700"
                                  : "#EF4444",
                            }}
                          >
                            {riskLevel === 0
                              ? "Low Risk"
                              : riskLevel <= 2
                              ? "Moderate Risk"
                              : "High Risk"}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
                            Overall health risk level
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "2.5rem",
                            fontWeight: 900,
                            color:
                              riskLevel === 0
                                ? "#10B981"
                                : riskLevel <= 2
                                ? "#FFD700"
                                : "#EF4444",
                          }}
                        >
                          {riskLevel}/6
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            color: "#888",
                          }}
                        >
                          <span>Glucose levels</span>
                          <span style={{ color: glucoseAvg > 140 ? "#EF4444" : glucoseAvg > 120 ? "#FFD700" : "#10B981" }}>
                            {glucoseAvg > 140 ? "High" : glucoseAvg > 120 ? "Elevated" : "Normal"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            color: "#888",
                          }}
                        >
                          <span>Blood pressure</span>
                          <span style={{ color: bloodPressure.systolic > 140 ? "#EF4444" : bloodPressure.systolic > 120 ? "#FFD700" : "#10B981" }}>
                            {bloodPressure.systolic > 140 ? "High" : bloodPressure.systolic > 120 ? "Elevated" : "Normal"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            color: "#888",
                          }}
                        >
                          <span>Sleep quality</span>
                          <span style={{ color: sleepHours < 6 ? "#EF4444" : sleepHours < 7 ? "#FFD700" : "#10B981" }}>
                            {sleepHours < 6 ? "Poor" : sleepHours < 7 ? "Fair" : "Good"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            color: "#888",
                          }}
                        >
                          <span>Active symptoms</span>
                          <span style={{ color: selectedSymptoms.length > 3 ? "#EF4444" : selectedSymptoms.length > 0 ? "#FFD700" : "#10B981" }}>
                            {selectedSymptoms.length > 3 ? "Multiple" : selectedSymptoms.length > 0 ? "Some" : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Symptom Log</span>
                      <div className="card-icon">
                        <FileText size={20} />
                      </div>
                    </div>
                    {selectedSymptoms.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "30px 0",
                          color: "#666",
                        }}
                      >
                        No symptoms recorded for today
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {selectedSymptoms.map((s) => {
                          const symptom = SYMPTOMS.find((sy) => sy.id === s);
                          const Icon = symptom?.icon || AlertCircle;
                          return (
                            <div
                              key={s}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 16px",
                                borderRadius: 14,
                                background: "rgba(255,215,0,0.06)",
                                border: "1px solid rgba(255,215,0,0.12)",
                              }}
                            >
                              <Icon size={20} style={{ color: "#FFD700" }} />
                              <span
                                style={{
                                  flex: 1,
                                  fontWeight: 500,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {symptom?.name || s}
                              </span>
                              <span
                                style={{ fontSize: "0.75rem", color: "#666" }}
                              >
                                Just now
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* HEALTH JOURNAL TAB */}
            {activeTab === "journal" && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <span className="card-title">How are you feeling?</span>
                    <div className="card-icon">
                      <Smile size={20} />
                    </div>
                  </div>

                  <div className="mood-selector">
                    {[
                      { value: 1, emoji: "😢", label: "Terrible" },
                      { value: 2, emoji: "😟", label: "Bad" },
                      { value: 3, emoji: "😐", label: "Okay" },
                      { value: 4, emoji: "😊", label: "Good" },
                      { value: 5, emoji: "😄", label: "Great" },
                    ].map((m) => (
                      <div
                        key={m.value}
                        className={`mood-option ${
                          mood === m.value ? "active" : ""
                        }`}
                        onClick={() => setMood(m.value)}
                        title={m.label}
                      >
                        {m.emoji}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <textarea
                      className="input-field"
                      placeholder="Write about how you're feeling today..."
                      value={journalInput}
                      onChange={(e) => setJournalInput(e.target.value)}
                      style={{
                        minHeight: 80,
                        resize: "vertical",
                        lineHeight: 1.6,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <button className="btn btn-primary" onClick={addJournalEntry}>
                      <Save size={14} style={{ marginRight: 6 }} />
                      Save Entry
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Journal History</span>
                    <span className="badge badge-gold">
                      {healthJournal.length} entries
                    </span>
                  </div>

                  {healthJournal.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#666",
                      }}
                    >
                      <BookOpen
                        size={40}
                        style={{
                          color: "#333",
                          marginBottom: 16,
                        }}
                      />
                      <div>No journal entries yet</div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          marginTop: 8,
                        }}
                      >
                        Start tracking your daily health experience
                      </div>
                    </div>
                  ) : (
                    <div className="journal-list">
                      {healthJournal.map((entry) => {
                        const moodEmojis = ["😢", "😟", "😐", "😊", "😄"];
                        return (
                          <div key={entry.id} className="journal-item">
                            <div className="journal-meta">
                              <span className="journal-date">
                                {entry.date} at {entry.time}
                              </span>
                              <span className="journal-mood">
                                {moodEmojis[entry.mood - 1] || "😐"}
                              </span>
                            </div>
                            <div className="journal-text">{entry.text}</div>
                            <div className="journal-actions">
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteJournalEntry(entry.id)}
                              >
                                <Trash2 size={12} style={{ marginRight: 4 }} />
                                Delete
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

            {/* LIFESTYLE TAB */}
            {activeTab === "lifestyle" && (
              <motion.div
                key="lifestyle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid-2" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Daily Movement</span>
                      <div className="card-icon">
                        <Footprints size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {steps.toLocaleString()}
                    </div>
                    <div className="stat-sub">
                      Target: 10,000 steps
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (steps / 10000) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 16, width: "100%" }}
                      onClick={() => setSteps((v) => v + 500)}
                    >
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Add 500 Steps
                    </button>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Exercise Duration</span>
                      <div className="card-icon">
                        <Dumbbell size={20} />
                      </div>
                    </div>
                    <div className="stat-value">
                      {exerciseMinutes}
                      <span style={{ fontSize: "1rem", color: "#888" }}>
                        {" "}
                        min
                      </span>
                    </div>
                    <div className="stat-sub">Target: 60 minutes</div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (exerciseMinutes / 60) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 16, width: "100%" }}
                      onClick={() => setExerciseMinutes((v) => v + 10)}
                    >
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Add 10 Minutes
                    </button>
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Sleep Tracking</span>
                      <div className="card-icon">
                        <Moon size={20} />
                      </div>
                    </div>

                    <div className="lifestyle-meter">
                      <div className="lifestyle-icon">
                        <BedDouble size={22} />
                      </div>
                      <div className="lifestyle-info">
                        <div className="lifestyle-label">Sleep Duration</div>
                        <div className="lifestyle-value">{sleepHours} hours</div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setSleepHours((v) => Math.max(v - 0.5, 3))
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setSleepHours((v) => Math.min(v + 0.5, 12))
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="lifestyle-meter">
                      <div className="lifestyle-icon">
                        <Star size={22} />
                      </div>
                      <div className="lifestyle-info">
                        <div className="lifestyle-label">Sleep Quality</div>
                        <div className="lifestyle-value">{sleepQuality}%</div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setSleepQuality((v) => Math.max(v - 5, 0))
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setSleepQuality((v) => Math.min(v + 5, 100))
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Water Intake</span>
                      <div className="card-icon">
                        <GlassWater size={20} />
                      </div>
                    </div>

                    <div className="water-tracker">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div
                          key={n}
                          className={`water-drop ${
                            n <= waterIntake ? "filled" : ""
                          }`}
                          onClick={() =>
                            setWaterIntake(n <= waterIntake ? n - 1 : n)
                          }
                        >
                          <Droplets size={16} />
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "#FFD700",
                      }}
                    >
                      {waterIntake} / 8 glasses
                    </div>
                    <div
                      className="progress-bar"
                      style={{ marginTop: 12 }}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(waterIntake / 8) * 100}%`,
                          background:
                            "linear-gradient(90deg, #3B82F6, #60A5FA)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Healthy Lifestyle Habits</span>
                    <div className="card-icon">
                      <Award size={20} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {[
                      {
                        icon: Apple,
                        title: "Balanced Nutrition",
                        desc: "Maintain consistent carb intake and eat fiber-rich meals daily.",
                        done: true,
                      },
                      {
                        icon: Footprints,
                        title: "Daily Movement",
                        desc: "Walk at least 8,000 steps and do 30 minutes of light exercise.",
                        done: steps >= 8000,
                      },
                      {
                        icon: Moon,
                        title: "Quality Sleep",
                        desc: "Sleep 7-8 hours with consistent bedtime and wake time.",
                        done: sleepHours >= 7,
                      },
                      {
                        icon: Pill,
                        title: "Medication Adherence",
                        desc: "Take all prescribed medications on time as scheduled.",
                        done: medicationsTaken === medicineLog.length,
                      },
                      {
                        icon: GlassWater,
                        title: "Hydration",
                        desc: "Drink at least 8 glasses of water throughout the day.",
                        done: waterIntake >= 8,
                      },
                      {
                        icon: Brain,
                        title: "Stress Management",
                        desc: "Practice mindfulness, deep breathing, or meditation daily.",
                        done: mood >= 4,
                      },
                    ].map((habit, i) => {
                      const Icon = habit.icon;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: 20,
                            borderRadius: 18,
                            background: habit.done
                              ? "rgba(16,185,129,0.08)"
                              : "rgba(255,255,255,0.03)",
                            border: `1px solid ${
                              habit.done
                                ? "rgba(16,185,129,0.2)"
                                : "rgba(255,215,0,0.1)"
                            }`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: habit.done
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(255,215,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: habit.done ? "#10B981" : "#FFD700",
                              }}
                            >
                              <Icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  color: "#fff",
                                }}
                              >
                                {habit.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#888",
                                  marginTop: 2,
                                }}
                              >
                                {habit.done ? "Completed ✓" : "In Progress"}
                              </div>
                            </div>
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#aaa",
                              lineHeight: 1.6,
                            }}
                          >
                            {habit.desc}
                          </p>
                        </div>
                      );
                    })}
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
