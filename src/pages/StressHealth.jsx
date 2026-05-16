import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  HeartPulse,
  Moon,
  Flame,
  Smile,
  TimerReset,
  BarChart3,
  Bell,
  Sparkles,
  PlayCircle,
} from "lucide-react";

const stressPrograms = [
  {
    title: "2-Minute Calm Reset",
    duration: "2 min",
    level: "Beginner",
    icon: TimerReset,
    color: "from-orange-400 to-red-500",
  },
  {
    title: "Anxiety Cooldown",
    duration: "7 min",
    level: "Popular",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Deep Breathing",
    duration: "5 min",
    level: "Daily",
    icon: HeartPulse,
    color: "from-cyan-400 to-blue-500",
  },
  {
    title: "Sleep Stress Release",
    duration: "10 min",
    level: "Night",
    icon: Moon,
    color: "from-indigo-500 to-violet-600",
  },
];

const dailyTips = [
  "Hydrate before caffeine.",
  "Walk for 5 minutes after stressful work.",
  "Avoid doom-scrolling before sleep.",
  "Take one deep breath before replying emotionally.",
  "Stretch your shoulders every hour.",
];

export default function StressHealth() {
  const [stressScore, setStressScore] = useState(74);
  const [streak, setStreak] = useState(12);
  const [selectedMood, setSelectedMood] = useState("Overwhelmed");
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % dailyTips.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    return Math.max(10, 100 - stressScore);
  }, [stressScore]);

  const moods = [
    "Overwhelmed",
    "Anxious",
    "Tired",
    "Restless",
    "Burned Out",
    "Peaceful",
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 px-5 pb-32 max-w-6xl mx-auto">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-3xl shadow-2xl shadow-orange-500/30">
              😓
            </div>

            <div>
              <p className="text-orange-300 text-sm font-medium tracking-wide">
                MANIFIX STRESS CARE
              </p>
              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Reduce Stress.
                <br />
                Reclaim Peace.
              </h1>
            </div>
          </div>

          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed mt-5">
            Guided breathing, emotional resets, AI-powered calm routines,
            sleep recovery, and burnout prevention — built for modern life.
          </p>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            {
              label: "Stress Recovery Score",
              value: `${progress}%`,
              icon: BarChart3,
            },
            {
              label: "Daily Calm Streak",
              value: `${streak} days`,
              icon: Flame,
            },
            {
              label: "Mood Status",
              value: selectedMood,
              icon: Smile,
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{item.label}</p>
                    <h2 className="text-3xl font-black mt-2">{item.value}</h2>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-7 h-7" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI MESSAGE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-3xl p-6 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-400/20 backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-orange-300" />
            </div>

            <div>
              <p className="text-orange-200 font-semibold text-lg">
                AI Calm Insight
              </p>

              <p className="text-gray-200 mt-2 leading-relaxed">
                Your stress patterns increase most during late-night screen time.
                A 10-minute breathing session before sleep may improve recovery.
              </p>
            </div>
          </div>
        </motion.div>

        {/* PROGRAMS */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black">Stress Recovery Programs</h2>

            <button className="text-sm text-orange-300 font-medium">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stressPrograms.map((program, index) => {
              const Icon = program.icon;

              return (
                <motion.div
                  key={program.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-10`}
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Icon className="w-7 h-7" />
                        </div>

                        <div>
                          <p className="text-xl font-bold">{program.title}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {program.duration} • {program.level}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                      <PlayCircle className="w-7 h-7" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* MOOD TRACKER */}
        <div className="mt-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black">Mood Tracker</h2>
              <p className="text-gray-400 mt-2">
                Check in daily to understand emotional patterns.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    selectedMood === mood
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DAILY TIP */}
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-3xl p-6 border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-cyan-300" />
            <p className="font-bold text-cyan-200">Daily Anti-Stress Tip</p>
          </div>

          <p className="text-xl text-white font-semibold leading-relaxed">
            {dailyTips[quoteIndex]}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-[32px] overflow-hidden bg-gradient-to-r from-orange-500 to-pink-600 p-[1px]"
        >
          <div className="rounded-[32px] bg-[#0B1020] px-8 py-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Small Calm Habits.
              <br />
              Massive Life Changes.
            </h2>

            <p className="text-gray-300 mt-5 max-w-2xl mx-auto leading-relaxed">
              Build emotional resilience with guided recovery systems,
              breathing routines, sleep optimization, and mindful AI support.
            </p>

            <button className="mt-7 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 font-bold text-lg shadow-2xl shadow-orange-500/30 hover:scale-105 transition-transform">
              Start Recovery Journey
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
