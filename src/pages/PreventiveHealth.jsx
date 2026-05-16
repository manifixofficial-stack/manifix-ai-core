import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

export default function PreventiveHealth() {
  const [score, setScore] = useState(45);
  const [streak, setStreak] = useState(12);
  const [steps, setSteps] = useState(4320);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prev) => (prev >= 87 ? 45 : prev + 1));
      setSteps((prev) => prev + Math.floor(Math.random() * 120));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const healthModules = useMemo(
    () => [
      {
        title: "Heart Protection",
        value: "92%",
        icon: HeartPulse,
        color: "from-red-500 to-pink-500",
      },
      {
        title: "Mental Balance",
        value: "88%",
        icon: Brain,
        color: "from-violet-500 to-purple-500",
      },
      {
        title: "Fitness Score",
        value: "81%",
        icon: Dumbbell,
        color: "from-cyan-500 to-blue-500",
      },
      {
        title: "Sleep Quality",
        value: "84%",
        icon: Moon,
        color: "from-indigo-500 to-sky-500",
      },
    ],
    []
  );

  const habits = [
    "Drink 3L water",
    "10K steps movement",
    "Morning sunlight",
    "Deep breathing session",
    "Sugar control tracking",
    "AI posture correction",
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.25),transparent_35%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full mb-6 backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm tracking-wide text-zinc-200">
                AI Preventive Healthcare System
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              Prevent Disease
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Before It Starts
              </span>
            </h1>

            <p className="mt-6 text-zinc-300 text-lg leading-relaxed max-w-xl">
              ManifiX uses AI-driven wellness tracking, daily health scoring,
              smart habit systems, and predictive insights to help users stay
              healthier for years.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold hover:scale-105 transition-all duration-300 shadow-2xl shadow-green-500/30">
                Start Prevention Journey
              </button>

              <button className="px-6 py-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                Explore AI Insights
              </button>
            </div>
          </div>

          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-zinc-400 text-sm">Health Prevention Score</p>
                <h2 className="text-5xl font-black mt-2">{score}</h2>
              </div>

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Shield className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2 text-sm text-zinc-300">
                  <span>Body Recovery</span>
                  <span>87%</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[87%] bg-gradient-to-r from-green-400 to-emerald-600 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm text-zinc-300">
                  <span>Inflammation Risk</span>
                  <span>Low</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[22%] bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <Footprints className="w-4 h-4" />
                  Daily Steps
                </div>
                <p className="text-2xl font-bold">{steps}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <Flame className="w-4 h-4" />
                  Wellness Streak
                </div>
                <p className="text-2xl font-bold">{streak} Days</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black">
                AI Health Intelligence
              </h2>
              <p className="text-zinc-400 mt-2">
                Predictive wellness tracking for long-term prevention.
              </p>
            </div>

            <button className="hidden md:flex items-center gap-2 text-green-400 hover:gap-3 transition-all duration-300">
              View Full Analytics
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {healthModules.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  className="group bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl hover:scale-[1.03] transition-all duration-500"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold">{item.title}</h3>

                  <p className="text-4xl font-black mt-5">{item.value}</p>

                  <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Improvement detected
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20 grid lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <TimerReset className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-black">Daily Prevention Habits</h2>
            </div>

            <div className="space-y-4">
              {habits.map((habit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                      {index + 1}
                    </div>
                    <p className="font-medium">{habit}</p>
                  </div>

                  <Activity className="w-5 h-5 text-zinc-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-700/20 border border-green-500/20 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-green-500/20 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 border border-green-400/20">
                <ScanSearch className="w-8 h-8 text-green-300" />
              </div>

              <h2 className="text-4xl font-black leading-tight max-w-md">
                AI Predicts Health Risks Before Symptoms Appear
              </h2>

              <p className="mt-5 text-zinc-200 leading-relaxed max-w-lg">
                Smart health analysis combines movement, stress, sleep,
                nutrition, and recovery patterns to generate future wellness
                forecasts.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-10">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <Apple className="w-6 h-6 mb-3 text-green-300" />
                  <p className="text-2xl font-black">96%</p>
                  <span className="text-xs text-zinc-300">Nutrition</span>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <Moon className="w-6 h-6 mb-3 text-blue-300" />
                  <p className="text-2xl font-black">8.2h</p>
                  <span className="text-xs text-zinc-300">Sleep</span>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <Trophy className="w-6 h-6 mb-3 text-yellow-300" />
                  <p className="text-2xl font-black">Top 4%</p>
                  <span className="text-xs text-zinc-300">Health Rank</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
