import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

const wellnessPrograms = [
  {
    title: "Hormone Balance",
    duration: "14 days",
    tag: "Popular",
    icon: Flower2,
    gradient: "from-pink-400 to-rose-500",
  },
  {
    title: "Cycle Wellness",
    duration: "Daily",
    tag: "Tracking",
    icon: CalendarDays,
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    title: "Stress & Mood Care",
    duration: "7 min",
    tag: "Mind Care",
    icon: Heart,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Energy Recovery",
    duration: "10 min",
    tag: "Boost",
    icon: Flame,
    gradient: "from-orange-400 to-pink-500",
  },
];

const wellnessTips = [
  "Sleep quality strongly affects hormone balance.",
  "Hydration improves energy and recovery.",
  "Daily movement helps reduce stress and fatigue.",
  "Balanced meals stabilize mood and focus.",
  "Mindful breathing can reduce emotional overload.",
];

export default function WomenHealth() {
  const [cycleDay] = useState(12);
  const [energy] = useState(78);
  const [streak] = useState(18);
  const [tipIndex, setTipIndex] = useState(0);
  const [mood, setMood] = useState("Balanced");

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % wellnessTips.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const cycleProgress = useMemo(() => {
    return Math.min(100, (cycleDay / 28) * 100);
  }, [cycleDay]);

  const moods = [
    "Balanced",
    "Tired",
    "Stressed",
    "Focused",
    "Emotional",
    "Energetic",
  ];

  return (
    <div className="min-h-screen bg-[#140812] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 pb-32">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-10"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-3xl shadow-2xl shadow-pink-500/30">
              👩
            </div>

            <div>
              <p className="text-pink-300 tracking-wide text-sm font-medium">
                MANIFIX WOMEN CARE
              </p>

              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Feel Balanced.
                <br />
                Feel Strong.
              </h1>
            </div>
          </div>

          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
            Smart wellness support for hormones, energy, stress, sleep, mood,
            and cycle health — designed for real-life emotional wellbeing.
          </p>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {[
            {
              label: "Wellness Energy",
              value: `${energy}%`,
              icon: Activity,
            },
            {
              label: "Healthy Streak",
              value: `${streak} days`,
              icon: Flame,
            },
            {
              label: "Mood Status",
              value: mood,
              icon: Heart,
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{item.label}</p>
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

        {/* AI INSIGHT */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-3xl border border-pink-400/20 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 p-6 backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-pink-300" />
            </div>

            <div>
              <p className="text-pink-200 text-lg font-bold">
                AI Wellness Insight
              </p>

              <p className="text-gray-200 mt-2 leading-relaxed">
                Your stress and sleep patterns may affect energy stability.
                Gentle evening routines can improve emotional recovery.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CYCLE TRACKER */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black">Cycle Wellness Tracker</h2>
              <p className="text-gray-400 mt-2">
                Understand patterns in mood, energy, and recovery.
              </p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-pink-500/20 border border-pink-400/20 text-pink-200 font-semibold">
              Day {cycleDay} of 28
            </div>
          </div>

          <div className="mt-6 h-4 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cycleProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500"
            />
          </div>
        </div>

        {/* PROGRAMS */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black">Wellness Programs</h2>

            <button className="text-pink-300 text-sm font-medium">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {wellnessPrograms.map((program, index) => {
              const Icon = program.icon;

              return (
                <motion.div
                  key={program.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${program.gradient} opacity-10`}
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
                            {program.duration} • {program.tag}
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

        {/* MOOD SELECTOR */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-2xl font-black">Daily Mood Check</h2>

          <div className="flex flex-wrap gap-3 mt-5">
            {moods.map((item) => (
              <button
                key={item}
                onClick={() => setMood(item)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  mood === item
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* DAILY TIP */}
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 backdrop-blur-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-fuchsia-300" />
            <p className="font-bold text-fuchsia-200">Daily Wellness Tip</p>
          </div>

          <p className="text-xl font-semibold leading-relaxed text-white">
            {wellnessTips[tipIndex]}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-[32px] overflow-hidden bg-gradient-to-r from-pink-500 to-fuchsia-500 p-[1px]"
        >
          <div className="rounded-[32px] bg-[#180A15] px-8 py-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Better Balance.
              <br />
              Better Everyday Life.
            </h2>

            <p className="text-gray-300 mt-5 max-w-2xl mx-auto leading-relaxed">
              Support emotional wellbeing, energy recovery, stress balance,
              and healthy routines with intelligent daily wellness guidance.
            </p>

            <button className="mt-7 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-fuchsia-500 font-bold text-lg shadow-2xl shadow-pink-500/30 hover:scale-105 transition-transform">
              Start Wellness Journey
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
