import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, HeartPulse, Moon, Flame, Smile, TimerReset, BarChart3, Bell, Sparkles,
  PlayCircle, PauseCircle, SkipForward, Plus, X, CheckCircle2, ChevronRight,
  ChevronDown, ChevronUp, Save, Trash2, Edit2, Download, Settings, Home,
  Calendar, BookOpen, Trophy, Target, Clock, Wind, Sun, Cloud, Zap, AlertTriangle,
  Info, Volume2, VolumeX, RefreshCw, Star, ArrowRight, Minus, Heart, Coffee,
  Smartphone, Users, Briefcase, Wallet, Dumbbell, BookMarked, MessageCircle,
  Shield, TrendingUp, History, LucideIcon
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from "recharts";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F5D76E";
const GOLD_DARK = "#AA8C2C";
const BG = "#050505";
const CARD_BG = "rgba(212, 175, 55, 0.03)";
const CARD_BORDER = "rgba(212, 175, 55, 0.12)";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#A1A1AA";
const TEXT_MUTED = "#71717A";

const defaultMoods = ["Overwhelmed", "Anxious", "Tired", "Restless", "Burned Out", "Peaceful", "Calm", "Focused", "Energized"];

const moodEmojis = {
  Overwhelmed: "😰", Anxious: "😟", Tired: "😴", Restless: "🤸",
  "Burned Out": "🔥", Peaceful: "😌", Calm: "😌", Focused: "🎯", Energized: "⚡"
};

const moodValues = {
  Peaceful: 10, Calm: 9, Energized: 8, Focused: 7, Tired: 5,
  Restless: 4, Anxious: 3, "Burned Out": 2, Overwhelmed: 1
};

const dailyTips = [
  "Hydrate before caffeine.", "Walk for 5 minutes after stressful work.",
  "Avoid doom-scrolling before sleep.", "Take one deep breath before replying emotionally.",
  "Stretch your shoulders every hour.", "Write down 3 things you're grateful for.",
  "Practice the 5-4-3-2-1 grounding technique.", "Listen to calming music for 10 minutes.",
  "Step outside and feel the sun on your face.", "Progressive muscle relaxation before bed."
];

const stressPrograms = [
  { id: 1, title: "2-Minute Calm Reset", duration: 2, level: "Beginner", icon: TimerReset, description: "Quick stress relief for busy moments. Focuses on instant nervous system reset through breath pacing.", steps: ["Find a quiet spot", "Inhale 4 seconds", "Hold 4 seconds", "Exhale 6 seconds", "Repeat 8 cycles"], category: "breathing" },
  { id: 2, title: "Anxiety Cooldown", duration: 7, level: "Popular", icon: Brain, description: "Targeted anxiety reduction using cognitive reframing and grounding techniques.", steps: ["Acknowledge the anxiety", "Name 5 things you see", "Name 4 things you touch", "Name 3 sounds", "Challenge one thought", "Breathe slowly", "Accept what you cannot control"], category: "anxiety" },
  { id: 3, title: "Deep Breathing", duration: 5, level: "Daily", icon: HeartPulse, description: "Diaphragmatic breathing to activate the parasympathetic nervous system.", steps: ["Place hand on belly", "Breathe in through nose", "Feel belly expand", "Exhale through pursed lips", "Feel belly contract", "Find your rhythm"], category: "breathing" },
  { id: 4, title: "Sleep Stress Release", duration: 10, level: "Night", icon: Moon, description: "Progressive muscle relaxation and body scan for deep sleep preparation.", steps: ["Lie comfortably", "Close your eyes", "Scan from toes upward", "Tense each muscle group", "Hold for 5 seconds", "Release tension", "Notice the warmth", "Let go of thoughts"], category: "sleep" },
  { id: 5, title: "Mindful Walking", duration: 5, level: "Beginner", icon: Wind, description: "Combine movement with mindfulness to reduce cortisol and improve mood.", steps: ["Start walking slowly", "Feel each footstep", "Notice your surroundings", "Match breath to steps", "Release mental tension", "End with gratitude"], category: "movement" },
  { id: 6, title: "Workplace Decompression", duration: 3, level: "Daily", icon: Briefcase, description: "Quick desk-friendly exercises to reduce work stress without leaving your station.", steps: ["Roll shoulders back 5 times", "Neck stretches side to side", "Close eyes, deep breath", "Unclench jaw", "Stretch arms overhead", "Reset posture"], category: "workplace" }
];

const copingStrategies = [
  { id: 1, title: "Box Breathing", desc: "4-4-4-4 pattern for instant calm", category: "Breathing", time: "3 min" },
  { id: 2, title: "5-4-3-2-1 Grounding", desc: "Engage all five senses to return to present", category: "Grounding", time: "2 min" },
  { id: 3, title: "Progressive Relaxation", desc: "Systematically release muscle tension", category: "Relaxation", time: "10 min" },
  { id: 4, title: "Thought Reframing", desc: "Challenge and reframe negative thoughts", category: "Cognitive", time: "5 min" },
  { id: 5, title: "Body Scan", desc: "Mindful awareness from head to toe", category: "Mindfulness", time: "8 min" },
  { id: 6, title: "Gratitude Journal", desc: "Write 3 things you appreciate", category: "Journaling", time: "5 min" },
  { id: 7, title: "Visualization", desc: "Picture your safe, calm place", category: "Visualization", time: "5 min" },
  { id: 8, title: "Self-Compassion Break", desc: "Kind words to yourself in hard moments", category: "Compassion", time: "3 min" }
];

const triggers = [
  { id: 1, label: "Work Pressure", icon: Briefcase },
  { id: 2, label: "Financial Concerns", icon: Wallet },
  { id: 3, label: "Relationship Issues", icon: Users },
  { id: 4, label: "Health Worries", icon: HeartPulse },
  { id: 5, label: "Lack of Sleep", icon: Moon },
  { id: 6, label: "Too Much Caffeine", icon: Coffee },
  { id: 7, label: "Social Media", icon: Smartphone },
  { id: 8, label: "Noise/Environment", icon: Bell },
  { id: 9, label: "Uncertainty", icon: Cloud },
  { id: 10, label: "Physical Tension", icon: Dumbbell }
];

export default function StressHealth() {
  const [activeTab, setActiveTab] = useState("home");
  const [stressScore, setStressScore] = useState(68);
  const [streak, setStreak] = useState(12);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useLocalStorage("stressMoods", []);
  const [activeProgram, setActiveProgram] = useState(null);
  const [programRunning, setProgramRunning] = useState(false);
  const [programTime, setProgramTime] = useState(0);
  const [programStep, setProgramStep] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState("idle");
  const [journalEntries, setJournalEntries] = useLocalStorage("stressJournal", []);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({ trigger: [], mood: "", intensity: 5, notes: "" });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCoping, setShowCoping] = useState(false);
  const [selectedCoping, setSelectedCoping] = useState(null);
  const [copingActive, setCopingActive] = useState(false);
  const [copingTime, setCopingTime] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [showTriggers, setShowTriggers] = useState(false);
  const [activeTriggers, setActiveTriggers] = useLocalStorage("stressTriggers", []);
  const [goals, setGoals] = useLocalStorage("stressGoals", [
    { id: 1, text: "Complete 3 sessions today", done: false },
    { id: 2, text: "Log mood twice today", done: false },
    { id: 3, text: "Practice breathing for 5 min", done: false },
    { id: 4, text: "Write one journal entry", done: false }
  ]);
  const [showAchievements, setShowAchievements] = useState(false);

  const programInterval = useRef(null);
  const copingInterval = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % dailyTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const moodChartData = useMemo(() => {
    const last7 = moodHistory.slice(-7);
    if (last7.length < 2) return [];
    return last7.map((m, i) => ({
      day: `Day ${moodHistory.length - 7 + i + 1}`,
      value: moodValues[m.mood] || 5
    }));
  }, [moodHistory]);

  const weeklyStress = useMemo(() => [
    { day: "Mon", score: 72 }, { day: "Tue", score: 65 },
    { day: "Wed", score: 58 }, { day: "Thu", score: 62 },
    { day: "Fri", score: 48 }, { day: "Sat", score: 42 },
    { day: "Sun", score: 45 }
  ], []);

  const startProgram = useCallback((program) => {
    setActiveProgram(program);
    setProgramTime(0);
    setProgramStep(0);
    setProgramRunning(true);
    setBreathingPhase("inhale");

    const totalSeconds = program.duration * 60;
    const stepDuration = totalSeconds / program.steps.length;

    programInterval.current = setInterval(() => {
      setProgramTime(prev => {
        const newTime = prev + 1;
        const currentStep = Math.floor(newTime / stepDuration);
        if (currentStep >= program.steps.length) {
          clearInterval(programInterval.current);
          setProgramRunning(false);
          setBreathingPhase("done");
          setGoals(prev => prev.map(g => g.id === 3 ? { ...g, done: true } : g));
          return newTime;
        }
        setProgramStep(currentStep);
        const phaseIndex = Math.floor((newTime % stepDuration) / (stepDuration / 4));
        const phases = ["inhale", "hold", "exhale", "rest"];
        setBreathingPhase(phases[phaseIndex]);
        return newTime;
      });
    }, 1000);
  }, [setGoals]);

  const stopProgram = useCallback(() => {
    if (programInterval.current) clearInterval(programInterval.current);
    setProgramRunning(false);
    setBreathingPhase("idle");
    setActiveProgram(null);
  }, []);

  const pauseProgram = useCallback(() => {
    if (programInterval.current) {
      clearInterval(programInterval.current);
      programInterval.current = null;
      setProgramRunning(false);
    }
  }, []);

  const resumeProgram = useCallback(() => {
    if (!activeProgram) return;
    setProgramRunning(true);
    const stepDuration = (activeProgram.duration * 60) / activeProgram.steps.length;
    programInterval.current = setInterval(() => {
      setProgramTime(prev => {
        const newTime = prev + 1;
        const currentStep = Math.floor(newTime / stepDuration);
        if (currentStep >= activeProgram.steps.length) {
          clearInterval(programInterval.current);
          setProgramRunning(false);
          setBreathingPhase("done");
          return newTime;
        }
        setProgramStep(currentStep);
        const phaseIndex = Math.floor((newTime % stepDuration) / (stepDuration / 4));
        const phases = ["inhale", "hold", "exhale", "rest"];
        setBreathingPhase(phases[phaseIndex]);
        return newTime;
      });
    }, 1000);
  }, [activeProgram]);

  const selectMood = useCallback((mood) => {
    setSelectedMood(mood);
    const entry = { id: Date.now(), mood, timestamp: new Date().toISOString() };
    setMoodHistory(prev => [...prev, entry]);
    if (["Peaceful", "Calm", "Energized"].includes(mood)) setStreak(prev => prev + 1);
    setGoals(prev => prev.map(g => g.id === 2 ? { ...g, done: true } : g));
  }, [setMoodHistory, setGoals]);

  const toggleTrigger = useCallback((id) => {
    setActiveTriggers(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }, [setActiveTriggers]);

  const saveJournalEntry = useCallback(() => {
    if (!journalForm.mood || journalForm.trigger.length === 0) return;
    const entry = { id: Date.now(), date: new Date().toISOString(), ...journalForm };
    setJournalEntries(prev => [...prev, entry]);
    setShowJournalModal(false);
    setJournalForm({ trigger: [], mood: "", intensity: 5, notes: "" });
    setGoals(prev => prev.map(g => g.id === 4 ? { ...g, done: true } : g));
  }, [journalForm, setJournalEntries, setGoals]);

  const deleteJournalEntry = useCallback((id) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  }, [setJournalEntries]);

  const toggleGoal = useCallback((id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  }, [setGoals]);

  const exportData = useCallback(() => {
    const data = { moodHistory, journalEntries, activeTriggers, goals, streak, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stress-health-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [moodHistory, journalEntries, activeTriggers, goals, streak]);

  const resetData = useCallback(() => {
    setMoodHistory([]);
    setJournalEntries([]);
    setActiveTriggers([]);
    setGoals([
      { id: 1, text: "Complete 3 sessions today", done: false },
      { id: 2, text: "Log mood twice today", done: false },
      { id: 3, text: "Practice breathing for 5 min", done: false },
      { id: 4, text: "Write one journal entry", done: false }
    ]);
    setStreak(0);
    setStressScore(68);
  }, [setMoodHistory, setJournalEntries, setActiveTriggers, setGoals]);

  const quizQuestions = [
    { id: 1, text: "How often do you feel overwhelmed?", options: ["Rarely", "Sometimes", "Often", "Always"] },
    { id: 2, text: "How well do you sleep?", options: ["Very well", "Mostly well", "Poorly", "Very poorly"] },
    { id: 3, text: "How often do you feel anxious?", options: ["Never", "Rarely", "Sometimes", "Frequently"] },
    { id: 4, text: "How is your work-life balance?", options: ["Excellent", "Good", "Fair", "Poor"] },
    { id: 5, text: "Do you have time for self-care?", options: ["Always", "Usually", "Rarely", "Never"] }
  ];

  const calculateStressScore = useCallback(() => {
    const values = { Rarely: 2, Sometimes: 3, Often: 4, Always: 5, Never: 1, Frequently: 5, Verywell: 1, Mostlywell: 2, Poorly: 4, Verypoorly: 5, Excellent: 1, Good: 2, Fair: 3, Poor: 5, Usually: 2 };
    let total = 0;
    Object.values(quizAnswers).forEach(answer => {
      total += values[answer.replace(/\s/g, "")] || 3;
    });
    const maxScore = quizQuestions.length * 5;
    const normalizedScore = Math.round((total / maxScore) * 100);
    setStressScore(Math.min(100, normalizedScore));
    setQuizComplete(true);
    setTimeout(() => setShowQuiz(false), 2000);
  }, [quizAnswers]);

  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "programs", icon: PlayCircle, label: "Programs" },
    { id: "tracker", icon: BarChart3, label: "Tracker" },
    { id: "journal", icon: BookOpen, label: "Journal" },
    { id: "tools", icon: Zap, label: "Tools" }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStressLevel = (score) => {
    if (score <= 25) return { label: "Very Low", color: "#34D399" };
    if (score <= 40) return { label: "Low", color: "#60A5FA" };
    if (score <= 60) return { label: "Moderate", color: GOLD };
    if (score <= 80) return { label: "High", color: "#F97316" };
    return { label: "Critical", color: "#EF4444" };
  };

  const stressLevel = getStressLevel(stressScore);

  /* ════════════════════════════════════════════════════════════
     RENDER FUNCTIONS
  ═════════════════════════════════════════════════════════════ */
  const renderHome = () => (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl p-8 md:p-12" style={{ background: `linear-gradient(135deg, ${GOLD}15 0%, ${BG} 50%, ${GOLD}08 100%)`, border: `1px solid ${GOLD}30` }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${GOLD}80, transparent)`, filter: "blur(60px)" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 mb-6">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-sm tracking-wider text-yellow-300">AI STRESS MANAGEMENT PLATFORM</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300">Reduce Stress.</span>
            <br />
            <span className="text-white">Reclaim Peace.</span>
          </h1>
          <p className="text-gray-400 text-lg mt-5 max-w-2xl leading-relaxed">Guided breathing, emotional resets, AI-powered calm routines, sleep recovery, and burnout prevention — built for modern life.</p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button onClick={() => setActiveTab("programs")} className="px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:scale-105 transition-all shadow-lg shadow-yellow-500/30">Start Recovery Session</button>
            <button onClick={() => setShowQuiz(true)} className="px-6 py-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition-all">Take Stress Assessment</button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GoldCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Stress Level</p>
              <h2 className="text-4xl font-black text-white mt-2">{stressScore}%</h2>
              <p className="text-sm mt-1" style={{ color: stressLevel.color }}>{stressLevel.label}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${stressLevel.color}15` }}>
              <BarChart3 size={28} style={{ color: stressLevel.color }} />
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mt-4">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stressScore}%` }} transition={{ duration: 1.5 }} className="h-full rounded-full" style={{ background: `linear-gradient(to right, ${stressLevel.color}80, ${stressLevel.color})` }} />
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Calm Streak</p>
              <h2 className="text-4xl font-black text-white mt-2">{streak} days</h2>
              <p className="text-sm text-gray-400 mt-1">Keep it going</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)" }}>
              <Flame size={28} className="text-orange-400" />
            </div>
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Current Mood</p>
              <h2 className="text-4xl font-black text-white mt-2">{selectedMood ? moodEmojis[selectedMood] : "—"} </h2>
              <p className="text-sm text-gray-400 mt-1">{selectedMood || "Tap to check in"}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
              <Smile size={28} className="text-yellow-400" />
            </div>
          </div>
        </GoldCard>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {moodHistory.slice(-5).map(entry => (
          <div key={entry.id} className="flex-shrink-0 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <p className="text-2xl">{moodEmojis[entry.mood] || "😊"}</p>
            <p className="text-xs text-gray-500 mt-1">{entry.mood}</p>
          </div>
        ))}
        {moodHistory.length === 0 && (
          <div className="flex-shrink-0 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <p className="text-sm text-gray-500">No mood entries yet</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-4"><Brain size={20} className="text-yellow-400" /><h3 className="font-bold text-white">Daily Goals</h3></div>
          <div className="space-y-3">
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => toggleGoal(goal.id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${goal.done ? "bg-yellow-500/20 border-yellow-400" : "border-white/20"}`}>
                    {goal.done && <CheckCircle2 size={14} className="text-yellow-400" />}
                  </div>
                  <span className={`text-sm ${goal.done ? "text-gray-500 line-through" : "text-white"}`}>{goal.text}</span>
                </div>
              </div>
            ))}
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-4"><Target size={20} className="text-yellow-400" /><h3 className="font-bold text-white">Active Triggers</h3></div>
          {activeTriggers.length === 0 ? (
            <p className="text-gray-500 text-sm">No triggers identified yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeTriggers.map(t => {
                const trigger = triggers.find(tr => tr.id === t);
                return (
                  <div key={t} className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300 flex items-center gap-2">
                    {trigger && <trigger.icon size={14} />}
                    {trigger?.label}
                  </div>
                );
              })}
            </div>
          )}
        </GoldCard>
      </div>

      <AnimatePresence>
        {showQuiz && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQuiz(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <GoldCard className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-300">Stress Assessment</h3>
                  <button onClick={() => setShowQuiz(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><X size={16} className="text-gray-400" /></button>
                </div>
                {quizComplete ? (
                  <div className="text-center py-8">
                    <Shield size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-white mb-2">Assessment Complete</h4>
                    <p className="text-gray-400">Your stress level: <span className="text-yellow-400 font-bold">{stressScore}%</span></p>
                    <p className="text-sm text-gray-500 mt-2">We've personalized your recommendations based on your results.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizQuestions.map((q, qi) => (
                      <div key={q.id}>
                        <p className="text-sm font-medium text-white mb-3">{qi + 1}. {q.text}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map(opt => (
                            <button key={opt} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))} className={`px-4 py-2 rounded-xl text-sm transition-all ${quizAnswers[q.id] === opt ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-white/5 text-gray-400 border border-white/10 hover:border-yellow-500/20"}`}>{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={calculateStressScore} disabled={Object.keys(quizAnswers).length < quizQuestions.length} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all">Calculate Score</button>
                  </div>
                )}
              </GoldCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderPrograms = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Stress Recovery Programs</h2>
        <p className="text-gray-400 text-sm mt-1">Select a program and follow the guided steps</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {stressPrograms.map(program => {
          const Icon = program.icon;
          return (
            <motion.div key={program.id} whileHover={{ y: -4 }} className="rounded-2xl p-5 cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD}20` }} onClick={() => startProgram(program)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15` }}>
                      <Icon size={22} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{program.title}</h3>
                      <p className="text-sm text-gray-500">{program.duration} min · {program.level}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{program.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-yellow-400 text-sm">
                <PlayCircle size={14} /><span>Tap to start</span><ArrowRight size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeProgram && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="text-center max-w-md w-full">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{activeProgram.title}</h3>
                <p className="text-gray-400 text-sm">Step {programStep + 1} of {activeProgram.steps.length}</p>
              </div>

              <motion.div
                animate={breathingPhase === "inhale" ? { scale: 1.4 } : breathingPhase === "exhale" ? { scale: 0.9 } : breathingPhase === "hold" ? { scale: 1.4 } : { scale: 1 }}
                transition={{ duration: breathingPhase === "hold" ? 1 : breathingPhase === "rest" ? 0.5 : 4, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full mx-auto mb-8 flex items-center justify-center"
                style={{ background: breathingPhase === "done" ? "rgba(52,211,153,0.2)" : `radial-gradient(circle, ${GOLD}60, ${GOLD}08)`, border: `2px solid ${GOLD}50` }}
              >
                <span className="text-lg font-bold text-yellow-400 capitalize">{breathingPhase === "done" ? "Complete!" : breathingPhase}</span>
              </motion.div>

              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                <p className="text-white font-medium">{activeProgram.steps[programStep]}</p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button onClick={programRunning ? pauseProgram : resumeProgram} className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                  {programRunning ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
                </button>
                <button onClick={stopProgram} className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400"><X size={24} /></button>
              </div>

              <p className="text-3xl font-black text-white">{formatTime(programTime)} / {activeProgram.duration}:00</p>

              <div className="flex gap-1 justify-center mt-4">
                {activeProgram.steps.map((_, i) => (
                  <div key={i} className={`h-1 w-8 rounded-full transition-all ${i <= programStep ? "bg-yellow-400" : "bg-white/10"}`} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderTracker = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Mood & Stress Tracker</h2>
        <p className="text-gray-400 text-sm mt-1">Track your emotional patterns and stress levels</p>
      </div>

      <GoldCard className="p-6">
        <h3 className="font-bold text-white mb-4">How are you feeling?</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <button key={mood} onClick={() => selectMood(mood)} className={`p-4 rounded-xl text-center transition-all ${selectedMood === mood ? "bg-yellow-500/20 border border-yellow-500/40 scale-105" : "bg-white/5 border border-white/5 hover:border-yellow-500/20"}`}>
              <p className="text-3xl mb-1">{emoji}</p>
              <p className="text-xs text-gray-400">{mood}</p>
            </button>
          ))}
        </div>
      </GoldCard>

      <GoldCard className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-yellow-400" />Mood History (Last 7 entries)</h3>
        {moodChartData.length > 1 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodChartData}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0, 10]} />
                <Tooltip contentStyle={{ background: "rgba(10,10,10,0.95)", border: `1px solid ${GOLD}40`, borderRadius: "12px", color: "#fff" }} />
                <Area type="monotone" dataKey="value" stroke={GOLD} fill="url(#moodGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">Log your mood daily to see trends</p>
        )}
      </GoldCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <GoldCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-yellow-400" />Weekly Stress Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "rgba(10,10,10,0.95)", border: `1px solid ${GOLD}40`, borderRadius: "12px", color: "#fff" }} />
                <Bar dataKey="score" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-400" />Identify Triggers</h3>
          <p className="text-sm text-gray-400 mb-4">Select what's causing you stress today</p>
          <div className="grid grid-cols-2 gap-2">
            {triggers.map(t => (
              <button key={t.id} onClick={() => toggleTrigger(t.id)} className={`p-3 rounded-xl text-sm flex items-center gap-2 transition-all ${activeTriggers.includes(t.id) ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-white/5 text-gray-400 border border-white/5 hover:border-yellow-500/20"}`}>
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </GoldCard>
      </div>

      <GoldCard className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><History size={18} className="text-yellow-400" />Mood Log</h3>
        {moodHistory.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No entries yet. Check in with your mood above!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...moodHistory].reverse().slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{moodEmojis[entry.mood] || "😊"}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{entry.mood}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GoldCard>
    </div>
  );

  const renderJournal = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Stress Journal</h2>
          <p className="text-gray-400 text-sm mt-1">Document your stress patterns and coping experiences</p>
        </div>
        <button onClick={() => setShowJournalModal(true)} className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-sm flex items-center gap-2">
          <Plus size={16} /> New Entry
        </button>
      </div>

      <div className="space-y-4">
        {journalEntries.length === 0 ? (
          <GoldCard className="p-12 text-center">
            <BookOpen size={48} className="text-yellow-500/30 mx-auto mb-4" />
            <p className="text-gray-500">No journal entries yet</p>
            <p className="text-sm text-gray-600 mt-1">Start tracking your stress patterns</p>
          </GoldCard>
        ) : (
          [...journalEntries].reverse().map(entry => (
            <GoldCard key={entry.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">{moodEmojis[entry.mood] || "😊"}</span>
                    <span className="text-white font-medium">{entry.mood}</span>
                    <span className="text-xs text-gray-500">Intensity: {entry.intensity}/10</span>
                  </div>
                </div>
                <button onClick={() => deleteJournalEntry(entry.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20"><Trash2 size={14} className="text-red-400" /></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {entry.trigger.map(t => {
                  const trigger = triggers.find(tr => tr.id === t);
                  return trigger ? (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 flex items-center gap-1">
                      <trigger.icon size={10} /> {trigger.label}
                    </span>
                  ) : null;
                })}
              </div>
              {entry.notes && <p className="text-sm text-gray-400 italic">"{entry.notes}"</p>}
            </GoldCard>
          ))
        )}
      </div>

      <AnimatePresence>
        {showJournalModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowJournalModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <GoldCard className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-yellow-300">New Journal Entry</h3>
                  <button onClick={() => setShowJournalModal(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">How are you feeling?</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(moodEmojis).map(([mood, emoji]) => (
                        <button key={mood} onClick={() => setJournalForm(p => ({ ...p, mood }))} className={`px-3 py-2 rounded-xl text-sm transition-all ${journalForm.mood === mood ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-white/5 text-gray-400 border border-white/10"}`}>{emoji} {mood}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">What's causing stress?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {triggers.map(t => (
                        <button key={t.id} onClick={() => setJournalForm(p => ({ ...p, trigger: p.trigger.includes(t.id) ? p.trigger.filter(id => id !== t.id) : [...p.trigger, t.id] }))} className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-all ${journalForm.trigger.includes(t.id) ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-white/5 text-gray-400 border border-white/5"}`}>
                          <t.icon size={12} /> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Intensity: {journalForm.intensity}/10</label>
                    <input type="range" min="1" max="10" value={journalForm.intensity} onChange={e => setJournalForm(p => ({ ...p, intensity: parseInt(e.target.value) }))} className="w-full accent-yellow-400" />
                    <div className="flex justify-between text-xs text-gray-500"><span>Low</span><span>High</span></div>
                  </div>
                  <textarea placeholder="Write about how you're feeling..." value={journalForm.notes} onChange={e => setJournalForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none h-24" />
                  <button onClick={saveJournalEntry} disabled={!journalForm.mood || journalForm.trigger.length === 0} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all flex items-center justify-center gap-2"><Save size={16} /> Save Entry</button>
                </div>
              </GoldCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">Stress Relief Tools</h2>
        <p className="text-gray-400 text-sm mt-1">Interactive techniques and coping strategies</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-5"><Wind size={20} className="text-yellow-400" /><h3 className="font-bold text-white">Breathing Exercise</h3></div>
          <div className="flex flex-col items-center py-4">
            <BreathingExercise />
          </div>
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-5"><MessageCircle size={20} className="text-yellow-400" /><h3 className="font-bold text-white">Coping Strategies</h3></div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {copingStrategies.map(s => (
              <button key={s.id} onClick={() => { setSelectedCoping(s); setCopingActive(false); setCopingTime(0); }} className={`w-full p-3 rounded-xl text-left transition-all ${selectedCoping?.id === s.id ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5 border border-white/5 hover:border-yellow-500/20"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                  <span className="text-xs text-yellow-400">{s.time}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedCoping && (
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-gray-300">{selectedCoping.desc}</p>
              <button
                onClick={() => {
                  setCopingActive(!copingActive);
                  if (!copingActive) {
                    setCopingTime(0);
                    const minutes = parseInt(selectedCoping.time);
                    copingInterval.current = setInterval(() => setCopingTime(p => p + 1), 1000);
                    setTimeout(() => {
                      if (copingInterval.current) clearInterval(copingInterval.current);
                      setCopingActive(false);
                    }, minutes * 60 * 1000);
                  } else {
                    if (copingInterval.current) clearInterval(copingInterval.current);
                  }
                }}
                className="w-full mt-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
              >
                {copingActive ? "Stop Session" : "Start Now"}
              </button>
              {copingActive && <p className="text-center text-white font-mono mt-2">{formatTime(copingTime)}</p>}
            </div>
          )}
        </GoldCard>

        <GoldCard className="p-6">
          <div className="flex items-center gap-3 mb-5"><Bell size={20} className="text-yellow-400" /><h3 className="font-bold text-white">Daily Tip</h3></div>
          <div className="min-h-[120px] flex items-center justify-center">
            <motion.p key={tipIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg text-white text-center leading-relaxed">{dailyTips[tipIndex]}</motion.p>
          </div>
          <button onClick={() => setTipIndex(p => (p + 1) % dailyTips.length)} className="w-full mt-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors">Next Tip →</button>
        </GoldCard>
      </div>

      <GoldCard className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Info size={18} className="text-yellow-400" />Quick Stress Relief Guide</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "5-4-3-2-1 Grounding", desc: "5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste", icon: Target },
            { title: "Box Breathing", desc: "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Repeat 4 times.", icon: Clock },
            { title: "Progressive Relaxation", desc: "Tense and release each muscle group from toes to head", icon: Shield },
            { title: "Gratitude Shift", desc: "Name 3 things you're grateful for right now", icon: Heart }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <item.icon size={20} className="text-yellow-400 mb-2" />
              <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </GoldCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 50%)" }} />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] opacity-15" style={{ background: `radial-gradient(circle, ${GOLD}30, transparent)`, filter: "blur(100px)" }} />

      <header className="relative z-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DARK})` }}>
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">AURUM CALM</h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">STRESS MANAGEMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Flame size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">{streak}d</span>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><Settings size={18} className="text-gray-400" /></button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 py-8 pb-28 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {activeTab === "home" && renderHome()}
            {activeTab === "programs" && renderPrograms()}
            {activeTab === "tracker" && renderTracker()}
            {activeTab === "journal" && renderJournal()}
            {activeTab === "tools" && renderTools()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 px-4 py-2">
          <div className="flex items-center justify-around">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeTab === tab.id ? "text-yellow-400" : "text-gray-500"}`}>
                  <Icon size={20} />
                  <span className="text-[10px]">{tab.label}</span>
                  {activeTab === tab.id && <div className="w-1 h-1 rounded-full bg-yellow-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}>
              <Icon size={18} className={activeTab === tab.id ? "text-yellow-400" : "text-gray-500 group-hover:text-gray-300"} />
              {activeTab === tab.id && <div className="absolute -left-1 w-1 h-6 rounded-full bg-yellow-400" />}
              <div className="absolute left-14 px-3 py-1.5 rounded-lg bg-[#111] border border-white/10 text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{tab.label}</div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <GoldCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3"><Volume2 size={18} className="text-yellow-400" /><div><p className="text-sm font-medium text-white">Sound Effects</p><p className="text-xs text-gray-500">{soundEnabled ? "Enabled" : "Disabled"}</p></div></div>
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${soundEnabled ? "bg-yellow-500" : "bg-gray-600"}`}>
                      <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" style={{ transform: soundEnabled ? "translateX(20px)" : "translateX(0)" }} />
                    </button>
                  </div>
                  <button onClick={exportData} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-yellow-500/10 transition-colors">
                    <Download size={18} className="text-yellow-400" />
                    <div className="text-left"><p className="text-sm font-medium text-white">Export Data</p><p className="text-xs text-gray-500">Download your health data</p></div>
                  </button>
                  <button onClick={resetData} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors">
                    <RefreshCw size={18} className="text-red-400" />
                    <div className="text-left"><p className="text-sm font-medium text-white">Reset All Data</p><p className="text-xs text-gray-500">Clear everything</p></div>
                  </button>
                </div>
              </GoldCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HELPER COMPONENTS & HOOKS
════════════════════════════════════════════════════════════ */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = value => {
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

function GoldCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-yellow-500/10 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function BreathingExercise() {
  const [phase, setPhase] = useState("idle");
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setCycles(0);
    setPhase("inhale");
    let p = 0;
    const phases = ["inhale", "hold", "exhale", "rest"];
    intervalRef.current = setInterval(() => {
      p = (p + 1) % 4;
      if (p === 0) setCycles(c => c + 1);
      setPhase(phases[p]);
    }, 4000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("idle");
    setCycles(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="text-center">
      <motion.div
        animate={phase === "inhale" ? { scale: 1.5 } : phase === "exhale" ? { scale: 0.8 } : phase === "hold" ? { scale: 1.5 } : { scale: 1 }}
        transition={{ duration: phase === "hold" ? 1 : 4, ease: "easeInOut" }}
        className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ background: phase === "idle" ? "rgba(255,255,255,0.05)" : `radial-gradient(circle, ${GOLD}60, ${GOLD}08)`, border: `2px solid ${GOLD}50` }}
      >
        <span className="text-sm font-bold text-yellow-400 capitalize">{phase === "idle" ? "Start" : phase}</span>
      </motion.div>
      <p className="text-xs text-gray-500 mb-3">Cycles: {cycles}</p>
      <button onClick={phase === "idle" ? start : stop} className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${phase === "idle" ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"}`}>
        {phase === "idle" ? "Start Exercise" : "Stop"}
      </button>
    </div>
  );
}
