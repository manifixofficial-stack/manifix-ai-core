import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Pill,
  Bell,
  Clock3,
  ShieldCheck,
  Brain,
  Activity,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  HeartPulse,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Settings,
  Home,
  BarChart3,
  BookOpen,
  Trophy,
  Star,
  AlertCircle,
  Check,
  Timer,
  Zap,
  Target,
  Flame,
  Save,
  ArrowRight,
  Eye,
  EyeOff,
  Download,
  Share2,
  Info,
  RefreshCw,
  User,
  Lock,
  BellRing,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const GOLD_PRIMARY = "#D4AF37";
const GOLD_LIGHT = "#FFD700";
const GOLD_DARK = "#B8960C";
const GOLD_MUTED = "#C9A96E";

const defaultMeds = [
  {
    id: 1,
    name: "Vitamin D3",
    dosage: "5000 IU",
    frequency: "Daily",
    time: "08:00",
    taken: true,
    category: "Supplement",
    startDate: "2026-01-15",
    notes: "Take with breakfast",
  },
  {
    id: 2,
    name: "Omega-3 Fish Oil",
    dosage: "2000mg",
    frequency: "Daily",
    time: "13:00",
    taken: true,
    category: "Supplement",
    startDate: "2026-02-01",
    notes: "With lunch for better absorption",
  },
  {
    id: 3,
    name: "Magnesium Glycinate",
    dosage: "400mg",
    frequency: "Daily",
    time: "21:00",
    taken: false,
    category: "Supplement",
    startDate: "2026-03-10",
    notes: "Before bed for sleep support",
  },
  {
    id: 4,
    name: "Probiotic Complex",
    dosage: "50B CFU",
    frequency: "Daily",
    time: "08:00",
    taken: false,
    category: "Supplement",
    startDate: "2026-04-01",
    notes: "Empty stomach in morning",
  },
];

const wellnessData = [
  { day: "Mon", energy: 7, mood: 8, sleep: 9, compliance: 100 },
  { day: "Tue", energy: 6, mood: 7, sleep: 8, compliance: 100 },
  { day: "Wed", energy: 8, mood: 9, sleep: 7, compliance: 75 },
  { day: "Thu", energy: 7, mood: 8, sleep: 8, compliance: 100 },
  { day: "Fri", energy: 9, mood: 9, sleep: 9, compliance: 100 },
  { day: "Sat", energy: 8, mood: 10, sleep: 8, compliance: 50 },
  { day: "Sun", energy: 9, mood: 9, sleep: 10, compliance: 80 },
];

const complianceHistory = [
  { date: "May 11", rate: 100 },
  { date: "May 12", rate: 100 },
  { date: "May 13", rate: 75 },
  { date: "May 14", rate: 100 },
  { date: "May 15", rate: 100 },
  { date: "May 16", rate: 80 },
  { date: "May 17", rate: 67 },
];

const categoryIcon = {
  Supplement: Pill,
  Prescription: ShieldCheck,
  OTC: Activity,
  Herbal: Sparkles,
  Vitamin: Star,
};

export default function MedicationHealth() {
  const [activeTab, setActiveTab] = useState("home");
  const [medications, setMedications] = useState(() => {
    const saved = localStorage.getItem("goldMeds");
    return saved ? JSON.parse(saved) : defaultMeds;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [streak, setStreak] = useState(14);
  const [wellnessLog, setWellnessLog] = useState(() => {
    const saved = localStorage.getItem("goldWellness");
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Time to take Magnesium Glycinate",
      time: "21:00",
      read: false,
      type: "reminder",
    },
    {
      id: 2,
      text: "Great job! 14-day streak maintained",
      time: "08:05",
      read: false,
      type: "achievement",
    },
    {
      id: 3,
      text: "Probiotic Complex due at 8:00 AM",
      time: "07:45",
      read: true,
      type: "reminder",
    },
  ]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode] = useState(true);
  const [selectedDay, setSelectedDay] = useState(6);
  const [animateProgress, setAnimateProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedMed, setExpandedMed] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [reminderSound] = useState(true);
  const [aiInsightExpanded, setAiInsightExpanded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Daily",
    time: "",
    category: "Supplement",
    startDate: "",
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem("goldMeds", JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem("goldWellness", JSON.stringify(wellnessLog));
  }, [wellnessLog]);

  useEffect(() => {
    const target =
      medications.length > 0
        ? (medications.filter((m) => m.taken).length / medications.length) * 100
        : 0;
    let frame;
    let start = 0;
    const animate = () => {
      start += 2;
      if (start >= target) {
        setAnimateProgress(Math.round(target));
        return;
      }
      setAnimateProgress(Math.round(start));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [medications]);

  const takenCount = useMemo(
    () => medications.filter((m) => m.taken).length,
    [medications]
  );
  const progress = useMemo(
    () =>
      medications.length > 0
        ? Math.round((takenCount / medications.length) * 100)
        : 0,
    [takenCount, medications.length]
  );

  const filteredMeds = useMemo(() => {
    let filtered = [...medications];
    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterCategory !== "All") {
      filtered = filtered.filter((m) => m.category === filterCategory);
    }
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, searchQuery, filterCategory]);

  const toggleTaken = useCallback(
    (id) => {
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
      );
    },
    [setMedications]
  );

  const addMedication = useCallback(() => {
    if (!form.name || !form.time) return;
    const newMed = {
      ...form,
      id: Date.now(),
      taken: false,
      startDate: form.startDate || new Date().toISOString().split("T")[0],
    };
    setMedications((prev) => [...prev, newMed]);
    setShowAddModal(false);
    setForm({
      name: "",
      dosage: "",
      frequency: "Daily",
      time: "",
      category: "Supplement",
      startDate: "",
      notes: "",
    });
  }, [form, setMedications]);

  const updateMedication = useCallback(() => {
    if (!editingMed || !form.name || !form.time) return;
    setMedications((prev) =>
      prev.map((m) =>
        m.id === editingMed.id
          ? {
              ...m,
              name: form.name,
              dosage: form.dosage,
              frequency: form.frequency,
              time: form.time,
              category: form.category,
              startDate: form.startDate,
              notes: form.notes,
            }
          : m
      )
    );
    setShowAddModal(false);
    setEditingMed(null);
    setForm({
      name: "",
      dosage: "",
      frequency: "Daily",
      time: "",
      category: "Supplement",
      startDate: "",
      notes: "",
    });
  }, [editingMed, form, setMedications]);

  const deleteMedication = useCallback(
    (id) => {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      setShowDeleteConfirm(null);
    },
    [setMedications]
  );

  const openEdit = useCallback(
    (med) => {
      setEditingMed(med);
      setForm({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        time: med.time,
        category: med.category,
        startDate: med.startDate,
        notes: med.notes,
      });
      setShowAddModal(true);
    },
    [setForm]
  );

  const openAdd = useCallback(() => {
    setEditingMed(null);
    setForm({
      name: "",
      dosage: "",
      frequency: "Daily",
      time: "",
      category: "Supplement",
      startDate: "",
      notes: "",
    });
    setShowAddModal(true);
  }, [setForm]);

  const logWellness = useCallback(
    (entry) => {
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...entry,
      };
      setWellnessLog((prev) => [...prev, newEntry]);
    },
    [setWellnessLog]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const categories = useMemo(
    () => ["All", ...new Set(medications.map((m) => m.category))],
    [medications]
  );

  const aiInsights = [
    {
      icon: Brain,
      title: "Sleep Optimization",
      text: "Taking Magnesium Glycinate 1 hour before bed has improved your sleep efficiency by 23%. Consider pairing with reduced screen time for maximum benefit.",
      trend: "up",
    },
    {
      icon: Activity,
      title: "Energy Correlation",
      text: "Your morning supplements show a strong positive correlation with energy levels. Consistency in your AM routine predicts 8.5/10 average energy today.",
      trend: "up",
    },
    {
      icon: Target,
      title: "Streak Analysis",
      text: "Your 14-day streak puts you in the top 5% of users. Maintaining this pattern for 21 more days will establish permanent habit formation.",
      trend: "up",
    },
  ];

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "schedule", icon: Calendar, label: "Schedule" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "journal", icon: BookOpen, label: "Journal" },
    { id: "achievements", icon: Trophy, label: "Rewards" },
  ];

  const GoldButton = ({ children, onClick, variant = "primary", className = "" }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
        variant === "primary"
          ? "bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-400 text-black shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
          : variant === "secondary"
          ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
      } ${className}`}
    >
      {children}
    </motion.button>
  );

  const GoldCard = ({ children, className = "" }) => (
    <div
      className={`rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-yellow-500/10 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );

  const renderHome = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(10,10,10,0.9) 50%, rgba(212,175,55,0.08) 100%)",
          border: "1px solid rgba(212,175,55,0.2)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 mb-6"
          >
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-sm tracking-wider text-yellow-300">
              AI-Powered Health Platform
            </span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300">
              Master Your
            </span>
            <br />
            <span className="text-white">Health Routine</span>
          </h1>
          <p className="text-gray-400 text-lg mt-5 max-w-xl leading-relaxed">
            Premium medication tracking, intelligent scheduling, and predictive
            wellness analytics designed for those who demand excellence.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <GoldButton onClick={openAdd}>
              <span className="flex items-center gap-2">
                <Plus size={18} />
                Add Medication
              </span>
            </GoldButton>
            <GoldButton variant="secondary" onClick={() => setActiveTab("schedule")}>
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                View Schedule
              </span>
            </GoldButton>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: ShieldCheck,
            label: "Accuracy",
            value: `${progress}%`,
            sub: "Today's compliance",
            color: "#D4AF37",
          },
          {
            icon: Flame,
            label: "Streak",
            value: `${streak} days`,
            sub: "Current streak",
            color: "#FF6B35",
          },
          {
            icon: HeartPulse,
            label: "Wellness",
            value: "92",
            sub: "Health score",
            color: "#D4AF37",
          },
          {
            icon: Clock3,
            label: "Next Dose",
            value: "21:00",
            sub: "Magnesium",
            color: "#60A5FA",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GoldCard className="p-5 hover:border-yellow-500/30 transition-all duration-300">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${stat.color}15` }}
                >
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <p className="text-gray-500 text-xs tracking-wide">{stat.label}</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {stat.value}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
              </GoldCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GoldCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.15)" }}
              >
                <Timer size={18} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Today's Progress</h3>
                <p className="text-xs text-gray-500">
                  {takenCount} of {medications.length} medications taken
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                {animateProgress}%
              </span>
            </div>
          </div>
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-300"
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <span>Morning</span>
            <span>Afternoon</span>
            <span>Evening</span>
            <span>Night</span>
          </div>
        </GoldCard>

        <GoldCard className="p-6 relative overflow-hidden">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.4), transparent)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={20} className="text-yellow-400" />
              <h3 className="font-bold text-white">AI Insight</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your consistency pattern shows optimal absorption windows between
              8-9 AM. Consider consolidating morning supplements for enhanced
              bioavailability.
            </p>
            <button
              onClick={() => setAiInsightExpanded(!aiInsightExpanded)}
              className="mt-4 text-yellow-400 text-sm flex items-center gap-1 hover:text-yellow-300"
            >
              {aiInsightExpanded ? "Less details" : "Read more"}
              {aiInsightExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            <AnimatePresence>
              {aiInsightExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3 text-sm text-gray-400">
                    <p>
                      • Vitamin D3 absorption increases 32% when taken with
                      dietary fat
                    </p>
                    <p>
                      • Omega-3 levels peak 3-4 hours after ingestion
                    </p>
                    <p>
                      • Magnesium Glycinate timing correlates with 1.2hr
                      faster sleep onset
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GoldCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Pill size={20} className="text-yellow-400" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.slice(0, 3).map((med, i) => {
            const CatIcon = categoryIcon[med.category] || Pill;
            return (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                <GoldCard
                  className={`p-5 cursor-pointer transition-all duration-300 hover:border-yellow-500/30 ${
                    med.taken ? "border-yellow-500/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          med.taken
                            ? "bg-yellow-500/20"
                            : "bg-white/5"
                        }`}
                      >
                        {med.taken ? (
                          <CheckCircle2 size={18} className="text-yellow-400" />
                        ) : (
                          <CatIcon size={18} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {med.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {med.dosage} · {med.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaken(med.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        med.taken
                          ? "border-yellow-400 bg-yellow-400/20"
                          : "border-white/20 hover:border-yellow-400/50"
                      }`}
                    >
                      {med.taken && <Check size={14} className="text-yellow-400" />}
                    </button>
                  </div>
                </GoldCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
            Medication Schedule
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {medications.length} medications ·{" "}
            {medications.filter((m) => m.taken).length} taken today
          </p>
        </div>
        <GoldButton onClick={openAdd}>
          <span className="flex items-center gap-2">
            <Plus size={16} />
            Add Medication
          </span>
        </GoldButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${
                filterCategory === cat
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:border-yellow-500/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredMeds.map((med, i) => {
            const CatIcon = categoryIcon[med.category] || Pill;
            return (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <GoldCard
                  className={`p-5 transition-all duration-300 cursor-pointer ${
                    med.taken
                      ? "border-yellow-500/25 bg-yellow-500/5"
                      : "hover:border-yellow-500/20"
                  }`}
                >
                  <div
                    className="flex items-center justify-between"
                    onClick={() =>
                      setExpandedMed(expandedMed === med.id ? null : med.id)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          med.taken ? "bg-yellow-500/20" : "bg-white/5"
                        }`}
                      >
                        {med.taken ? (
                          <CheckCircle2 size={20} className="text-yellow-400" />
                        ) : (
                          <CatIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-bold text-base ${
                              med.taken
                                ? "text-yellow-200"
                                : "text-white"
                            }`}
                          >
                            {med.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                            {med.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {med.dosage} · {med.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {med.time}
                        </p>
                        <p className="text-xs text-gray-500">
                          {parseInt(med.time) < 12
                            ? "Morning"
                            : parseInt(med.time) < 17
                            ? "Afternoon"
                            : parseInt(med.time) < 21
                            ? "Evening"
                            : "Night"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaken(med.id);
                        }}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          med.taken
                            ? "border-yellow-400 bg-yellow-400/20"
                            : "border-white/20 hover:border-yellow-400/50"
                        }`}
                      >
                        {med.taken && (
                          <Check size={16} className="text-yellow-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedMed === med.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Start Date</p>
                              <p className="text-white">
                                {med.startDate || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Status</p>
                              <p className={med.taken ? "text-green-400" : "text-yellow-400"}>
                                {med.taken ? "Taken" : "Pending"}
                              </p>
                            </div>
                          </div>
                          {med.notes && (
                            <div>
                              <p className="text-gray-500 text-sm">Notes</p>
                              <p className="text-gray-300 text-sm mt-1">
                                {med.notes}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => openEdit(med)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-300 text-sm hover:bg-yellow-500/20 transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(med.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GoldCard>

                <AnimatePresence>
                  {showDeleteConfirm === med.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    >
                      <GoldCard className="p-6 w-full max-w-sm mx-4">
                        <div className="text-center">
                          <AlertCircle
                            size={48}
                            className="text-yellow-400 mx-auto mb-4"
                          />
                          <h3 className="text-xl font-bold text-white mb-2">
                            Delete Medication?
                          </h3>
                          <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to remove{" "}
                            <span className="text-yellow-300">{med.name}</span>?
                            This action cannot be undone.
                          </p>
                          <div className="flex gap-3">
                            <GoldButton
                              variant="secondary"
                              onClick={() => setShowDeleteConfirm(null)}
                              className="flex-1"
                            >
                              Cancel
                            </GoldButton>
                            <button
                              onClick={() => deleteMedication(med.id)}
                              className="flex-1 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </GoldCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredMeds.length === 0 && (
          <div className="text-center py-16">
            <Pill size={48} className="text-yellow-500/30 mx-auto mb-4" />
            <p className="text-gray-500">No medications found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          Analytics & Insights
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Track your health trends and medication compliance
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={20} className="text-yellow-400" />
            <h3 className="font-bold text-white">Compliance Rate (7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={complianceHistory}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value) => [`${value}%`, "Compliance"]}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#goldGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-yellow-400" />
            <h3 className="font-bold text-white">Wellness Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={wellnessData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="day"
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                domain={[0, 10]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-400">Energy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-gray-400">Mood</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-gray-400">Sleep</span>
            </div>
          </div>
        </GoldCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GoldCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Target size={18} className="text-yellow-400" />
            Daily Compliance
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={complianceHistory}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="rate" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GoldCard>

        <GoldCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-yellow-400" />
            Summary
          </h3>
          <div className="space-y-4">
            {[
              {
                label: "Total Medications",
                value: medications.length,
                icon: Pill,
              },
              {
                label: "Taken Today",
                value: takenCount,
                icon: CheckCircle2,
              },
              {
                label: "Pending",
                value: medications.length - takenCount,
                icon: Clock3,
              },
              {
                label: "Current Streak",
                value: `${streak} days`,
                icon: Flame,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-yellow-400/60" />
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Brain size={18} className="text-yellow-400" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {aiInsights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-start gap-2">
                    <Icon size={14} className="text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {insight.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GoldCard>
      </div>
    </div>
  );

  const [journalForm, setJournalForm] = useState({
    energy: 5,
    mood: 5,
    sleep: 5,
    note: "",
  });

  const renderJournal = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          Wellness Journal
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Log your daily wellness metrics and observations
        </p>
      </div>

      <GoldCard className="p-6">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">
          <Star size={18} className="text-yellow-400" />
          Today's Entry
        </h3>

        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          {[
            { key: "energy", label: "Energy", icon: Zap },
            { key: "mood", label: "Mood", icon: HeartPulse },
            { key: "sleep", label: "Sleep", icon: Moon },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className="text-yellow-400" />
                  <span className="text-sm text-gray-400">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setJournalForm((p) => ({
                        ...p,
                        [item.key]: Math.max(1, p[item.key] - 1),
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:border-yellow-500/30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-2xl font-black text-white w-8 text-center">
                    {journalForm[item.key]}
                  </span>
                  <button
                    onClick={() =>
                      setJournalForm((p) => ({
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
        </div>

        <textarea
          placeholder="How are you feeling today? Any observations..."
          value={journalForm.note}
          onChange={(e) =>
            setJournalForm((p) => ({ ...p, note: e.target.value }))
          }
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500/40 resize-none h-24"
        />

        <div className="flex justify-end mt-4">
          <GoldButton
            onClick={() => {
              logWellness(journalForm);
              setJournalForm({ energy: 5, mood: 5, sleep: 5, note: "" });
            }}
          >
            <span className="flex items-center gap-2">
              <Save size={16} />
              Save Entry
            </span>
          </GoldButton>
        </div>
      </GoldCard>

      <div>
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <History size={18} className="text-yellow-400" />
          Recent Entries
        </h3>
        <div className="space-y-3">
          {wellnessLog.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={40} className="text-yellow-500/30 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No entries yet. Start logging your wellness!</p>
            </div>
          ) : (
            [...wellnessLog].reverse().map((entry) => (
              <GoldCard key={entry.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-4 text-sm mb-2">
                  <span className="text-gray-400">
                    ⚡ Energy:{" "}
                    <span className="text-white font-bold">
                      {entry.energy}/10
                    </span>
                  </span>
                  <span className="text-gray-400">
                    💚 Mood:{" "}
                    <span className="text-white font-bold">
                      {entry.mood}/10
                    </span>
                  </span>
                  <span className="text-gray-400">
                    🌙 Sleep:{" "}
                    <span className="text-white font-bold">
                      {entry.sleep}/10
                    </span>
                  </span>
                </div>
                {entry.note && (
                  <p className="text-sm text-gray-400 mt-2 italic">
                    "{entry.note}"
                  </p>
                )}
              </GoldCard>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const achievements = [
    {
      title: "First Step",
      desc: "Add your first medication",
      icon: Pill,
      unlocked: medications.length > 0,
      progress: medications.length > 0 ? 100 : Math.min(100, (medications.length / 1) * 100),
    },
    {
      title: "Week Warrior",
      desc: "Maintain a 7-day streak",
      icon: Flame,
      unlocked: streak >= 7,
      progress: streak >= 7 ? 100 : Math.min(100, (streak / 7) * 100),
    },
    {
      title: "Consistency King",
      desc: "Maintain a 14-day streak",
      icon: Trophy,
      unlocked: streak >= 14,
      progress: streak >= 14 ? 100 : Math.min(100, (streak / 14) * 100),
    },
    {
      title: "Perfect Day",
      desc: "Take all medications in one day",
      icon: Star,
      unlocked: medications.length > 0 && takenCount === medications.length,
      progress:
        medications.length > 0
          ? Math.round((takenCount / medications.length) * 100)
          : 0,
    },
    {
      title: "Health Journaler",
      desc: "Log 5 wellness entries",
      icon: BookOpen,
      unlocked: wellnessLog.length >= 5,
      progress: Math.min(100, (wellnessLog.length / 5) * 100),
    },
    {
      title: "Medication Master",
      desc: "Add 5 different medications",
      icon: ShieldCheck,
      unlocked: medications.length >= 5,
      progress: Math.min(100, (medications.length / 5) * 100),
    },
    {
      title: "Monthly Milestone",
      desc: "Maintain a 30-day streak",
      icon: Zap,
      unlocked: streak >= 30,
      progress: streak >= 30 ? 100 : Math.min(100, (streak / 30) * 100),
    },
    {
      title: "AI Explorer",
      desc: "View AI insights",
      icon: Brain,
      unlocked: true,
      progress: 100,
    },
  ];

  const renderAchievements = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
          Achievements & Rewards
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Track your milestones and stay motivated
        </p>
      </div>

      <GoldCard className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Achievements</p>
            <h3 className="text-3xl font-black text-white mt-1">
              {achievements.filter((a) => a.unlocked).length}
              <span className="text-gray-500 text-xl">
                /{achievements.length}
              </span>
            </h3>
          </div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.15)" }}
          >
            <Trophy size={28} className="text-yellow-400" />
          </div>
        </div>
        <div className="mt-4 w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${
                (achievements.filter((a) => a.unlocked).length /
                  achievements.length) *
                100
              }%`,
            }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-300"
          />
        </div>
      </GoldCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((ach, i) => {
          const Icon = ach.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <GoldCard
                className={`p-5 transition-all duration-300 ${
                  ach.unlocked
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "opacity-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    ach.unlocked ? "bg-yellow-500/20" : "bg-white/5"
                  }`}
                >
                  <Icon
                    size={22}
                    className={ach.unlocked ? "text-yellow-400" : "text-gray-600"}
                  />
                </div>
                <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{ach.desc}</p>
                <div className="mt-3 w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500/50"
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
                {ach.unlocked && (
                  <div className="flex items-center gap-1 mt-2">
                    <Check size={12} className="text-yellow-400" />
                    <span className="text-xs text-yellow-400">Unlocked</span>
                  </div>
                )}
              </GoldCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div
        className="fixed inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />

      <header className="relative z-20 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8960C 100%)",
              }}
            >
              <HeartPulse size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                AURUM HEALTH
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">
                Premium Wellness Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Flame size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">
                {streak}d
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <BellRing size={18} className="text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-12 w-80 rounded-2xl bg-[#111] border border-yellow-500/20 shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-bold text-white">Notifications</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={markAllRead}
                          className="text-xs text-yellow-400 hover:text-yellow-300"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={clearNotifications}
                          className="text-xs text-gray-500 hover:text-gray-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell size={24} className="text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-white/5 ${
                              !notif.read ? "bg-yellow-500/5" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  notif.type === "achievement"
                                    ? "bg-yellow-500/20"
                                    : "bg-white/5"
                                }`}
                              >
                                {notif.type === "achievement" ? (
                                  <Star size={14} className="text-yellow-400" />
                                ) : (
                                  <Bell size={14} className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">
                                  {notif.text}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Settings size={18} className="text-gray-400" />
            </button>
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
            {activeTab === "schedule" && renderSchedule()}
            {activeTab === "analytics" && renderAnalytics()}
            {activeTab === "journal" && renderJournal()}
            {activeTab === "achievements" && renderAchievements()}
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
                    activeTab === tab.id
                      ? "text-yellow-400"
                      : "text-gray-500"
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
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GoldCard className="p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Sun size={18} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Dark Mode
                        </p>
                        <p className="text-xs text-gray-500">Always on</p>
                      </div>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-yellow-500/30 flex items-center px-0.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Reminders
                        </p>
                        <p className="text-xs text-gray-500">
                          {reminderSound ? "Sound enabled" : "Sound disabled"}
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-yellow-500/30 flex items-center px-0.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-400" />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMedications(defaultMeds);
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors"
                  >
                    <RefreshCw size={18} className="text-gray-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">
                        Reset All Data
                      </p>
                      <p className="text-xs text-gray-500">
                        Restore to defaults
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          Export Data
                        </p>
                        <p className="text-xs text-gray-500">Download as JSON</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const data = {
                          medications,
                          wellnessLog,
                          streak,
                          exportedAt: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `aurum-health-${new Date().toISOString().split("T")[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs text-yellow-400 hover:text-yellow-300"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowAddModal(false);
              setEditingMed(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GoldCard className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
                    {editingMed ? "Edit Medication" : "Add Medication"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingMed(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g., Vitamin D3"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={form.dosage}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, dosage: e.target.value }))
                        }
                        placeholder="e.g., 5000 IU"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, category: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/40 appearance-none"
                      >
                        {["Supplement", "Prescription", "OTC", "Herbal", "Vitamin"].map(
                          (c) => (
                            <option key={c} value={c} className="bg-[#111]">
                              {c}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Time *
                      </label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, time: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Frequency
                      </label>
                      <select
                        value={form.frequency}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, frequency: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/40 appearance-none"
                      >
                        {["Daily", "Twice Daily", "Weekly", "As Needed"].map(
                          (f) => (
                            <option key={f} value={f} className="bg-[#111]">
                              {f}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Special instructions..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none h-20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingMed(null);
                      }}
                      className="flex-1 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-semibold hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <GoldButton
                      onClick={editingMed ? updateMedication : addMedication}
                      className="flex-1"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Save size={16} />
                        {editingMed ? "Update" : "Save"}
                      </span>
                    </GoldButton>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:flex fixed bottom-5 right-5 z-20">
        <button
          onClick={openAdd}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all hover:scale-105"
          style={{
            background:
              "linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8960C 100%)",
          }}
        >
          <Plus size={24} className="text-black" />
        </button>
      </div>
    </div>
  );
}
