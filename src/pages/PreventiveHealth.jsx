import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Shield,
  HeartPulse,
  Activity,
  Brain,
  Flame,
  Footprints,
  Apple,
  Moon,
  Trophy,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TimerReset,
  Dumbbell,
  ScanSearch,
  CheckCircle2,
  Plus,
  X,
  Droplets,
  Wind,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Target,
  Clock,
  BarChart3,
  Home,
  Settings,
  Bell,
  Calendar,
  Star,
  ArrowRight,
  Minus,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#FFD700";

const defaultHabits = [
  { id: 1, name: "Drink 3L water", category: "hydration", completed: false, streak: 5 },
  { id: 2, name: "10K steps movement", category: "fitness", completed: false, streak: 12 },
  { id: 3, name: "Morning sunlight (15 min)", category: "wellness", completed: false, streak: 8 },
  { id: 4, name: "Deep breathing session", category: "mental", completed: false, streak: 3 },
  { id: 5, name: "Sugar control tracking", category: "nutrition", completed: false, streak: 7 },
  { id: 6, name: "AI posture correction", category: "fitness", completed: false, streak: 4 },
  { id: 7, name: "Meditation (10 min)", category: "mental", completed: false, streak: 15 },
  { id: 8, name: "No screen before bed", category: "sleep", completed: false, streak: 6 },
];

const weeklyData = [
  { day: "Mon", score: 72, steps: 8200, sleep: 7.5 },
  { day: "Tue", score: 78, steps: 9500, sleep: 8.0 },
  { day: "Wed", score: 81, steps: 7800, sleep: 6.5 },
  { day: "Thu", score: 76, steps: 10200, sleep: 8.2 },
  { day: "Fri", score: 85, steps: 11000, sleep: 7.8 },
  { day: "Sat", score: 90, steps: 12500, sleep: 9.0 },
  { day: "Sun", score: 87, steps: 4320, sleep: 8.5 },
];

const heartData = [
  { time: "6am", bpm: 58 },
  { time: "8am", bpm: 72 },
  { time: "10am", bpm: 68 },
  { time: "12pm", bpm: 75 },
  { time: "2pm", bpm: 70 },
  { time: "4pm", bpm: 78 },
  { time: "6pm", bpm: 82 },
  { time: "8pm", bpm: 65 },
  { time: "10pm", bpm: 60 },
];

export default function PreventiveHealth() {
  const [activeTab, setActiveTab] = useState("home");
  const [score, setScore] = useState(72);
  const [streak, setStreak] = useState(12);
  const [steps, setSteps] = useState(4320);
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("preventiveHabits");
    return saved ? JSON.parse(saved) : defaultHabits;
  });
  const [breathingPhase, setBreathingPhase] = useState("idle");
  const [breathCycle, setBreathCycle] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [inflammation, setInflammation] = useState(22);
  const [nutrition, setNutrition] = useState(82);
  const [customHabits, setCustomHabits] = useState(() => {
    const saved = localStorage.getItem("customHabits");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("wellness");
  const [expandedModule, setExpandedModule] = useState(null);
  const [dailyLog, setDailyLog] = useState(() => {
    const saved = localStorage.getItem("preventiveLog");
    return saved ? JSON.parse(saved) : [];
  });
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    mood: 7,
    energy: 7,
    stress: 3,
    note: "",
  });

  const breathInterval = useRef(null);

  useEffect(() => {
    localStorage.setItem("preventiveHabits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("customHabits", JSON.stringify(customHabits));
  }, [customHabits]);

  useEffect(() => {
    localStorage.setItem("preventiveLog", JSON.stringify(dailyLog));
  }, [dailyLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((prev) => prev + Math.floor(Math.random() * 80) + 10);
      setHeartRate((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const completedCount = [...habits, ...customHabits].filter((h) => h.completed).length;
    const totalCount = habits.length + customHabits.length;
    if (totalCount > 0) {
      const newScore = Math.round(60 + (completedCount / totalCount) * 25 + Math.min(15, streak * 0.5));
      setScore(newScore);
    }
  }, [habits, customHabits, streak]);

  const startBreathing = useCallback(() => {
    setShowBreathing(true);
    setBreathCycle(0);
    let phase = 0;
    const phases = ["inhale", "hold", "exhale", "rest"];
    setBreathingPhase("inhale");
    breathInterval.current = setInterval(() => {
      phase = (phase + 1) % 4;
      if (phase === 0) setBreathCycle((c) => c + 1);
      setBreathingPhase(phases[phase]);
    }, 4000);
  }, []);

  const stopBreathing = useCallback(() => {
    setShowBreathing(false);
    if (breathInterval.current) {
      clearInterval(breathInterval.current);
      breathInterval.current = null;
    }
    setBreathingPhase("idle");
    setBreathCycle(0);
  }, []);

  const toggleHabit = useCallback((id, isCustom = false) => {
    if (isCustom) {
      setCustomHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                completed: !h.completed,
                streak: h.completed ? h.streak : h.streak + 1,
              }
            : h
        )
      );
    } else {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                completed: !h.completed,
                streak: h.completed ? Math.max(0, h.streak - 1) : h.streak + 1,
              }
            : h
        )
      );
    }
  }, []);

  const addCustomHabit = useCallback(() => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName,
      category: newHabitCategory,
      completed: false,
      streak: 0,
    };
    setCustomHabits((prev) => [...prev, newHabit]);
    setNewHabitName("");
    setShowAddHabit(false);
  }, [newHabitName, newHabitCategory]);

  const deleteCustomHabit = useCallback((id) => {
    setCustomHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addWater = useCallback(() => {
    setWaterGlasses((prev) => Math.min(12, prev + 1));
  }, []);

  const removeWater = useCallback(() => {
    setWaterGlasses((prev) => Math.max(0, prev - 1));
  }, []);

  const saveLog = useCallback(() => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...logForm,
    };
    setDailyLog((prev) => [...prev, entry]);
    setShowLogModal(false);
    setLogForm({ mood: 7, energy: 7, stress: 3, note: "" });
  }, [logForm]);

  const completedHabits = useMemo(
    () => [...habits, ...customHabits].filter((h) => h.completed).length,
    [habits, customHabits]
  );
  const totalHabits = habits.length + customHabits.length;

  const allHabitsList = useMemo(() => {
    const list = [...habits, ...customHabits];
    list.sort((a, b) => {
      if (a.completed === b.completed) return a.streak - b.streak;
      return a.completed ? 1 : -1;
    });
    return list;
  }, [habits, customHabits]);

  const healthModules = [
    {
      id: "heart",
      title: "Heart Protection",
      value: `${90 + Math.floor(Math.random() * 10)}%`,
      icon: HeartPulse,
      color: "from-red-500 to-pink-500",
      bgColor: "rgba(239,68,68,0.1)",
      data: heartData,
      detail: "Your resting heart rate averages 62 BPM, well within the optimal range of 60-100. Consistent cardio has improved your cardiac efficiency by 18% over the past month.",
      tips: ["Maintain 150min/week moderate cardio", "Monitor BP weekly", "Reduce sodium intake"],
    },
    {
      id: "mental",
      title: "Mental Balance",
      value: "88%",
      icon: Brain,
      color: "from-violet-500 to-purple-500",
      bgColor: "rgba(139,92,246,0.1)",
      data: [
        { time: "Mon", stress: 4 },
        { time: "Tue", stress: 3 },
        { time: "Wed", stress: 5 },
        { time: "Thu", stress: 2 },
        { time: "Fri", stress: 3 },
        { time: "Sat", stress: 2 },
        { time: "Sun", stress: 1 },
      ],
      detail: "Your daily meditation practice has reduced cortisol markers by 34%. Breathing exercises are effectively lowering anxiety triggers before they escalate.",
      tips: ["Continue 10-min morning meditation", "Practice box breathing during stress", "Limit caffeine after 2pm"],
    },
    {
      id: "fitness",
      title: "Fitness Score",
      value: "81%",
      icon: Dumbbell,
      color: "from-cyan-500 to-blue-500",
      bgColor: "rgba(6,182,212,0.1)",
      data: [
        { day: "Mon", activity: 75 },
        { day: "Tue", activity: 88 },
        { day: "Wed", activity: 65 },
        { day: "Thu", activity: 92 },
        { day: "Fri", activity: 85 },
        { day: "Sat", activity: 95 },
        { day: "Sun", activity: 40 },
      ],
      detail: `You've logged ${steps.toLocaleString()} steps today. Your weekly average is 9,300 steps - just 700 short of your 10K goal. Muscle recovery indicators show optimal repair cycles.`,
      tips: ["Aim for 10K daily steps", "Add 2 strength sessions/week", "Stretch before bed"],
    },
    {
      id: "sleep",
      title: "Sleep Quality",
      value: `${Math.round(sleepHours * 10)}%`,
      icon: Moon,
      color: "from-indigo-500 to-sky-500",
      bgColor: "rgba(99,102,241,0.1)",
      data: [
        { day: "Mon", hours: 7.5 },
        { day: "Tue", hours: 8.0 },
        { day: "Wed", hours: 6.5 },
        { day: "Thu", hours: 8.2 },
        { day: "Fri", hours: 7.8 },
        { day: "Sat", hours: 9.0 },
        { day: "Sun", hours: 8.5 },
      ],
      detail: `Your current sleep duration of ${sleepHours}h supports optimal cellular repair. Deep sleep phases account for 22% of total sleep time, above the healthy threshold of 20%.`,
      tips: ["Keep consistent sleep schedule", "No screens 1hr before bed", "Room temp 65-68°F"],
    },
  ];

  const aiInsights = [
    {
      severity: "low",
      title: "Hydration Alert",
      text: `You've consumed ${waterGlasses} glasses today. Aim for 8+ glasses to maintain optimal cellular function and prevent inflammation spikes.`,
      action: "Track more water",
    },
    {
      severity: "medium",
      title: "Activity Gap Detected",
      text: `Step count at ${steps.toLocaleString()} is below your weekly average of 9,300. A 20-minute walk before dinner could close this gap and improve tonight's sleep quality by 12%.`,
      action: "Start walking",
    },
    {
      severity: "high",
      title: "Prevention Priority",
      text: "Your inflammation risk is trending upward based on 3 consecutive days of reduced sleep and increased stress. Implement the 4-7-8 breathing technique tonight to activate parasympathetic recovery.",
      action: "Start breathing",
    },
  ];

  const renderHome = () => (
    <div className="space-y-8">
      <div
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(10,10,10,0.95) 40%, rgba(212,175,55,0.06) 100%)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.3), transparent)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 mb-6">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-sm tracking-wider text-yellow-300">
              AI Preventive Healthcare System
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300">
              Prevent Disease
            </span>
            <br />
            <span className="text-white">Before It Starts</span>
          </h1>
          <p className="text-gray-400 text-lg mt-5 max-w-xl leading-relaxed">
            ManifiX uses AI-driven wellness tracking, daily health scoring,
            smart habit systems, and predictive insights to help you stay
            healthier for years.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => setActiveTab("habits")}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/30"
            >
              Start Prevention Journey
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className="px-6 py-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition-all duration-300"
            >
              Explore AI Insights
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gray-500 text-sm">Prevention Score</p>
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                {score}
              </h2>
            </div>
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.15)" }}
            >
              <Shield size={40} className="text-yellow-400" />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-400">Body Recovery</span>
                <span className="text-white font-bold">87%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ duration: 1.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-amber-400"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-400">Inflammation Risk</span>
                <span className="text-yellow-400 font-bold">{inflammation}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${inflammation}%` }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-400">Habit Compliance</span>
                <span className="text-white font-bold">
                  {totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      totalHabits > 0
                        ? `${(completedHabits / totalHabits) * 100}%`
                        : "0%",
                  }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-green-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Footprints size={14} className="text-yellow-400" />
              Daily Steps
            </div>
            <p className="text-3xl font-black text-white">{steps.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Goal: 10,000</p>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                style={{ width: `${Math.min(100, (steps / 10000) * 100)}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Flame size={14} className="text-yellow-400" />
              Wellness Streak
            </div>
            <p className="text-3xl font-black text-white">{streak} Days</p>
            <p className="text-xs text-gray-500 mt-1">Keep it going!</p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <HeartPulse size={14} className="text-yellow-400" />
              Heart Rate
            </div>
            <p className="text-3xl font-black text-white">{heartRate} BPM</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-xs text-green-400">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              whileHover={{ y: -4 }}
              className={`rounded-2xl p-5 cursor-pointer transition-all duration-300`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
              onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: mod.bgColor }}
              >
                <Icon size={20} className="text-yellow-400" />
              </div>
              <h3 className="text-sm text-gray-400">{mod.title}</h3>
              <p className="text-2xl font-black text-white mt-2">{mod.value}</p>
              <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs">
                <TrendingUp size={12} />
                Improving
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock size={18} className="text-yellow-400" />
            <h3 className="font-bold text-white">Today's Habits</h3>
            <span className="text-xs text-gray-500 ml-auto">
              {completedHabits}/{totalHabits} done
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allHabitsList.slice(0, 6).map((habit) => (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id, customHabits.includes(habit))}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                      habit.completed
                        ? "bg-yellow-500/20 border-yellow-400"
                        : "border-white/20"
                    }`}
                  >
                    {habit.completed && <CheckCircle2 size={14} className="text-yellow-400" />}
                  </div>
                  <span
                    className={`text-sm ${habit.completed ? "text-gray-500 line-through" : "text-white"}`}
                  >
                    {habit.name}
                  </span>
                </div>
                {habit.streak > 0 && (
                  <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                    <Flame size={10} /> {habit.streak}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(10,10,10,0.95))",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.3), transparent)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <ScanSearch size={20} className="text-yellow-400" />
              <h3 className="font-bold text-white">AI Risk Forecast</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Based on your current patterns, your 30-day disease prevention
              probability is{" "}
              <span className="text-yellow-400 font-bold">94.2%</span>. Key
              risk factor: inconsistent sleep schedule increasing cortisol
              variability by 12%.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                <Apple size={16} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">96%</p>
                <span className="text-xs text-gray-500">Nutrition</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                <Moon size={16} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{sleepHours}h</p>
                <span className="text-xs text-gray-500">Sleep</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                <Trophy size={16} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">Top 8%</p>
                <span className="text-xs text-gray-500">Health Rank</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHabits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
            Daily Prevention Habits
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Complete your habits to build long-term disease prevention
          </p>
        </div>
        <button
          onClick={() => setShowAddHabit(true)}
          className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Habit
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Completed", value: completedHabits, icon: CheckCircle2, color: "#D4AF37" },
          { label: "In Progress", value: totalHabits - completedHabits, icon: Target, color: "#60A5FA" },
          { label: "Best Streak", value: Math.max(...allHabitsList.map((h) => h.streak), 0), icon: Flame, color: "#F97316" },
          { label: "Compliance", value: totalHabits > 0 ? `${Math.round((completedHabits / totalHabits) * 100)}%` : "0%", icon: BarChart3, color: "#34D399" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                  <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {allHabitsList.map((habit, index) => {
          const categoryColors = {
            hydration: "from-blue-500 to-cyan-400",
            fitness: "from-orange-500 to-amber-400",
            wellness: "from-green-500 to-emerald-400",
            mental: "from-violet-500 to-purple-400",
            nutrition: "from-red-500 to-pink-400",
            sleep: "from-indigo-500 to-sky-400",
          };
          const isCustom = customHabits.includes(habit);
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                  habit.completed
                    ? "bg-yellow-500/5 border border-yellow-500/20"
                    : "bg-white/5 border border-white/5 hover:border-yellow-500/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                      categoryColors[habit.category] || "from-gray-500 to-gray-400"
                    } flex items-center justify-center text-sm font-bold`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        habit.completed ? "text-gray-500 line-through" : "text-white"
                      }`}
                    >
                      {habit.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {habit.category} · Streak: {habit.streak} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isCustom && (
                    <button
                      onClick={() => deleteCustomHabit(habit.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20"
                    >
                      <X size={14} className="text-red-400" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleHabit(habit.id, isCustom)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                      habit.completed
                        ? "bg-yellow-500/20 border-yellow-400"
                        : "border-white/20 hover:border-yellow-400/50"
                    }`}
                  >
                    {habit.completed && <CheckCircle2 size={16} className="text-yellow-400" />}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAddHabit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddHabit(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-300">Add New Habit</h3>
                  <button
                    onClick={() => setShowAddHabit(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Habit name..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 mb-4"
                />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["hydration", "fitness", "wellness", "mental", "nutrition", "sleep"].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewHabitCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                          newHabitCategory === cat
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-white/5 text-gray-400 border border-white/10"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={addCustomHabit}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:scale-105 transition-all"
                >
                  Add Habit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderHealthModules = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          AI Health Intelligence
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Click each module to explore detailed analysis and recommendations
        </p>
      </div>

      <div className="space-y-4">
        {healthModules.map((mod, index) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="rounded-3xl overflow-hidden transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(212,175,55,0.1)",
                }}
              >
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="w-full p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: mod.bgColor }}
                    >
                      <Icon size={24} className="text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-white">{mod.title}</h3>
                      <p className="text-3xl font-black text-yellow-400">{mod.value}</p>
                    </div>
                  </div>
                  {expandedModule === mod.id ? (
                    <ChevronUp size={20} className="text-yellow-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedModule === mod.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 space-y-4">
                        <p className="text-gray-300 text-sm leading-relaxed">{mod.detail}</p>
                        {mod.data && mod.data.length > 0 && (
                          <div className="h-40 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              {mod.id === "heart" ? (
                                <AreaChart data={mod.data}>
                                  <defs>
                                    <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "rgba(10,10,10,0.95)",
                                      border: "1px solid rgba(212,175,55,0.2)",
                                      borderRadius: "12px",
                                      color: "#fff",
                                    }}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="bpm"
                                    stroke="#D4AF37"
                                    fill="url(#goldArea)"
                                  />
                                </AreaChart>
                              ) : (
                                <BarChart data={mod.data}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis
                                    dataKey={mod.data[0]?.day ? "day" : "time"}
                                    stroke="rgba(255,255,255,0.2)"
                                    fontSize={10}
                                  />
                                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                                  <Tooltip
                                    contentStyle={{
                                      background: "rgba(10,10,10,0.95)",
                                      border: "1px solid rgba(212,175,55,0.2)",
                                      borderRadius: "12px",
                                      color: "#fff",
                                    }}
                                  />
                                  <Bar
                                    dataKey={mod.data[0]?.stress ? "stress" : mod.data[0]?.activity ? "activity" : "hours"}
                                    fill="#D4AF37"
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        )}
                        <div className="space-y-2 mt-4">
                          <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">
                            AI Recommendations
                          </p>
                          {mod.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                              <ArrowRight size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          AI Prevention Insights
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Predictive health analysis and actionable recommendations
        </p>
      </div>

      <div className="space-y-4">
        {aiInsights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div
              className="rounded-2xl p-5 border-l-4 flex items-start gap-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor:
                  insight.severity === "high"
                    ? "#EF4444"
                    : insight.severity === "medium"
                    ? "#F59E0B"
                    : "#D4AF37",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    insight.severity === "high"
                      ? "rgba(239,68,68,0.15)"
                      : insight.severity === "medium"
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(212,175,55,0.15)",
                }}
              >
                <AlertTriangle
                  size={18}
                  className={
                    insight.severity === "high"
                      ? "text-red-400"
                      : insight.severity === "medium"
                      ? "text-amber-400"
                      : "text-yellow-400"
                  }
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-white">{insight.title}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      insight.severity === "high"
                        ? "bg-red-500/20 text-red-400"
                        : insight.severity === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {insight.severity} priority
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{insight.text}</p>
                <button
                  onClick={() => {
                    if (insight.title.includes("Hydration")) addWater();
                    if (insight.title.includes("Activity")) setActiveTab("habits");
                    if (insight.title.includes("Prevention")) {
                      setShowBreathing(true);
                      startBreathing();
                    }
                  }}
                  className="mt-3 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-300 text-sm hover:bg-yellow-500/20 transition-colors"
                >
                  {insight.action} →
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="rounded-3xl p-6 mt-8"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(10,10,10,0.95))",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain size={20} className="text-yellow-400" />
          <h3 className="font-bold text-white">Weekly Health Forecast</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#scoreGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          Prevention Tools
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Interactive wellness tools for daily health optimization
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Droplets size={20} className="text-blue-400" />
            <h3 className="font-bold text-white">Water Tracker</h3>
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <p className="text-5xl font-black text-white">{waterGlasses}</p>
              <p className="text-sm text-gray-500">of 8 glasses</p>
            </div>
          </div>
          <div className="flex gap-3 mb-4">
            <button
              onClick={removeWater}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
            >
              <Minus size={16} /> Remove
            </button>
            <button
              onClick={addWater}
              className="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={16} /> Add Glass
            </button>
          </div>
          <div className="flex gap-1.5 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-8 rounded-md transition-all duration-300 ${
                  i < waterGlasses
                    ? "bg-blue-500/60"
                    : "bg-white/5 border border-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Wind size={20} className="text-violet-400" />
            <h3 className="font-bold text-white">Breathing Exercise</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <motion.div
              animate={
                breathingPhase === "inhale"
                  ? { scale: 1.5 }
                  : breathingPhase === "exhale"
                  ? { scale: 0.8 }
                  : breathingPhase === "hold"
                  ? { scale: 1.5 }
                  : { scale: 1 }
              }
              transition={{ duration: breathingPhase === "hold" ? 1 : 4, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
              style={{
                background:
                  breathingPhase === "inhale"
                    ? "radial-gradient(circle, rgba(212,175,55,0.3), rgba(212,175,55,0.05))"
                    : breathingPhase === "exhale"
                    ? "radial-gradient(circle, rgba(96,165,250,0.3), rgba(96,165,250,0.05))"
                    : "radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                border: "2px solid rgba(212,175,55,0.3)",
              }}
            >
              <span className="text-sm font-bold text-yellow-400 capitalize">
                {breathingPhase === "idle" ? "Start" : breathingPhase}
              </span>
            </motion.div>
            <p className="text-xs text-gray-500 mb-3">
              Cycle: {breathCycle} · {breathingPhase === "idle" ? "Ready" : "In progress..."}
            </p>
            <button
              onClick={breathingPhase === "idle" ? startBreathing : stopBreathing}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                breathingPhase === "idle"
                  ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                  : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
              }`}
            >
              {breathingPhase === "idle" ? "Start Exercise" : "Stop"}
            </button>
          </div>
        </div>

        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Moon size={20} className="text-indigo-400" />
            <h3 className="font-bold text-white">Sleep Logger</h3>
          </div>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setSleepHours((p) => Math.max(0, p - 0.5))}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10"
            >
              <Minus size={18} />
            </button>
            <div className="text-center">
              <p className="text-4xl font-black text-white">{sleepHours}h</p>
              <p className="text-xs text-gray-500">Target: 8 hours</p>
            </div>
            <button
              onClick={() => setSleepHours((p) => Math.min(12, p + 0.5))}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (sleepHours / 12) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500">
            {sleepHours >= 7 && sleepHours <= 9
              ? "✓ Optimal sleep duration"
              : sleepHours < 7
              ? "⚠ Below recommended"
              : "⚠ Above recommended"}
          </p>
        </div>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-yellow-400" />
            <h3 className="font-bold text-white">Quick Health Log</h3>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
          >
            New Entry
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {dailyLog.length === 0 ? (
            <div className="text-center py-8">
              <Info size={32} className="text-yellow-500/30 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No entries yet. Start logging your health!</p>
            </div>
          ) : (
            [...dailyLog]
              .reverse()
              .map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex gap-4 text-sm mb-2">
                    <span>
                      ⚡{" "}
                      <span className="text-white font-bold">{entry.energy}/10</span>
                    </span>
                    <span>
                      😊{" "}
                      <span className="text-white font-bold">{entry.mood}/10</span>
                    </span>
                    <span>
                      😰{" "}
                      <span className="text-white font-bold">{entry.stress}/10</span>
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-gray-400 italic">"{entry.note}"</p>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLogModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-300">Health Log</h3>
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "energy", label: "Energy Level", icon: Zap },
                    { key: "mood", label: "Mood", icon: HeartPulse },
                    { key: "stress", label: "Stress Level", icon: Brain },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className="text-yellow-400" />
                          <span className="text-sm text-gray-400">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setLogForm((p) => ({
                                ...p,
                                [item.key]: Math.max(1, p[item.key] - 1),
                              }))
                            }
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:border-yellow-500/30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xl font-black text-white w-6 text-center">
                            {logForm[item.key]}
                          </span>
                          <button
                            onClick={() =>
                              setLogForm((p) => ({
                                ...p,
                                [item.key]: Math.min(10, p[item.key] + 1),
                              }))
                            }
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:border-yellow-500/30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <textarea
                    placeholder="Any notes about how you feel..."
                    value={logForm.note}
                    onChange={(e) => setLogForm((p) => ({ ...p, note: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none h-20"
                  />
                  <button
                    onClick={saveLog}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "habits", icon: Target, label: "Habits" },
    { id: "modules", icon: BarChart3, label: "Modules" },
    { id: "insights", icon: Brain, label: "Insights" },
    { id: "tools", icon: Zap, label: "Tools" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 50%)",
        }}
      />
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.2), transparent)",
          filter: "blur(100px)",
        }}
      />

      <header
        className="relative z-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #D4AF37, #FFD700, #B8960C)",
              }}
            >
              <Shield size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                AURUM HEALTH
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">
                Preventive Wellness Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Flame size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">{streak}d</span>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Bell size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 py-8 pb-28 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "home" && renderHome()}
            {activeTab === "habits" && renderHabits()}
            {activeTab === "modules" && renderHealthModules()}
            {activeTab === "insights" && renderInsights()}
            {activeTab === "tools" && renderTools()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 px-4 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                    activeTab === tab.id ? "text-yellow-400" : "text-gray-500"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px]">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="w-1 h-1 rounded-full bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-yellow-500/20 border border-yellow-500/30"
                  : "bg-white/5 border border-white/5 hover:bg-white/10"
              }`}
            >
              <Icon
                size={18}
                className={
                  activeTab === tab.id
                    ? "text-yellow-400"
                    : "text-gray-500 group-hover:text-gray-300"
                }
              />
              {activeTab === tab.id && (
                <div className="absolute -left-1 w-1 h-6 rounded-full bg-yellow-400" />
              )}
              <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-[#111] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showBreathing && breathingPhase !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={
                  breathingPhase === "inhale"
                    ? { scale: 2 }
                    : breathingPhase === "exhale"
                    ? { scale: 1 }
                    : breathingPhase === "hold"
                    ? { scale: 2 }
                    : { scale: 1 }
                }
                transition={{
                  duration: breathingPhase === "hold" ? 1 : 4,
                  ease: "easeInOut",
                }}
                className="w-48 h-48 rounded-full mx-auto mb-8 flex items-center justify-center"
                style={{
                  background:
                    breathingPhase === "inhale"
                      ? "radial-gradient(circle, rgba(212,175,55,0.4), rgba(212,175,55,0.1))"
                      : breathingPhase === "exhale"
                      ? "radial-gradient(circle, rgba(96,165,250,0.4), rgba(96,165,250,0.1))"
                      : "radial-gradient(circle, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                  border: "2px solid rgba(212,175,55,0.4)",
                }}
              >
                <span className="text-lg font-bold text-yellow-400 capitalize">
                  {breathingPhase}
                </span>
              </motion.div>
              <p className="text-gray-400 mb-6">
                Cycles completed: {breathCycle}
              </p>
              <button
                onClick={stopBreathing}
                className="px-8 py-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                End Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
