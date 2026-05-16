import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Brain,
  Activity,
  Heart,
  Sparkles,
  Gamepad2,
  Trophy,
  Smile,
  Apple,
  Moon,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Timer,
  Star,
  Rocket,
} from "lucide-react";

export default function ChildrenHealth() {
  const [growthScore, setGrowthScore] = useState(78);
  const [energy, setEnergy] = useState(92);
  const [steps, setSteps] = useState(5200);

  useEffect(() => {
    const interval = setInterval(() => {
      setGrowthScore((prev) => (prev >= 98 ? 78 : prev + 1));
      setSteps((prev) => prev + Math.floor(Math.random() * 150));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const wellnessCards = useMemo(
    () => [
      {
        title: "Brain Development",
        value: "94%",
        icon: Brain,
        color: "from-violet-500 to-purple-600",
      },
      {
        title: "Daily Activity",
        value: "8.1K",
        icon: Activity,
        color: "from-cyan-500 to-blue-500",
      },
      {
        title: "Healthy Sleep",
        value: "9.2h",
        icon: Moon,
        color: "from-indigo-500 to-sky-500",
      },
      {
        title: "Nutrition Balance",
        value: "91%",
        icon: Apple,
        color: "from-green-500 to-emerald-600",
      },
    ],
    []
  );

  const habits = [
    "Morning stretching",
    "Healthy breakfast",
    "Outdoor sunlight play",
    "Screen-time balance",
    "Learning focus games",
    "Night sleep routine",
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_40%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl mb-6">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-sm text-zinc-200 tracking-wide">
                AI Smart Children Wellness
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              Healthy Kids.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Strong Future.
              </span>
            </h1>

            <p className="mt-6 text-zinc-300 text-lg leading-relaxed max-w-xl">
              ManifiX helps children build healthy habits, improve movement,
              balance screen time, track nutrition, and develop smarter daily
              routines using AI-powered wellness systems.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-500/30">
                Start Healthy Journey
              </button>

              <button className="px-6 py-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                Explore AI Tracking
              </button>
            </div>
          </div>

          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-zinc-400 text-sm">Growth Wellness Score</p>
                <h2 className="text-5xl font-black mt-2">{growthScore}</h2>
              </div>

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Baby className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2 text-sm text-zinc-300">
                  <span>Focus & Learning</span>
                  <span>89%</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[89%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm text-zinc-300">
                  <span>Energy Balance</span>
                  <span>{energy}%</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[92%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <Activity className="w-4 h-4" />
                  Daily Steps
                </div>
                <p className="text-2xl font-bold">{steps}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <Heart className="w-4 h-4" />
                  Wellness Level
                </div>
                <p className="text-2xl font-bold">Excellent</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black">
                Smart Kids Wellness System
              </h2>
              <p className="text-zinc-400 mt-2">
                AI-powered healthy development tracking.
              </p>
            </div>

            <button className="hidden md:flex items-center gap-2 text-cyan-400 hover:gap-3 transition-all duration-300">
              View Full Dashboard
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {wellnessCards.map((item, index) => {
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

                  <div className="flex items-center gap-2 mt-4 text-cyan-300 text-sm">
                    <Rocket className="w-4 h-4" />
                    Healthy progress improving
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20 grid lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-black">Healthy Daily Habits</h2>
            </div>

            <div className="space-y-4">
              {habits.map((habit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold">
                      {index + 1}
                    </div>
                    <p className="font-medium">{habit}</p>
                  </div>

                  <Star className="w-5 h-5 text-zinc-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-400/20">
                <Gamepad2 className="w-8 h-8 text-cyan-300" />
              </div>

              <h2 className="text-4xl font-black leading-tight max-w-md">
                Fun AI Wellness For Modern Kids
              </h2>

              <p className="mt-5 text-zinc-200 leading-relaxed max-w-lg">
                Interactive wellness tracking makes healthy living feel fun,
                rewarding, and engaging for children and families.
              </p>

              <div className="grid grid-cols-3 gap-4 mt-10">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <BookOpen className="w-6 h-6 mb-3 text-cyan-300" />
                  <p className="text-2xl font-black">93%</p>
                  <span className="text-xs text-zinc-300">Learning</span>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <Smile className="w-6 h-6 mb-3 text-yellow-300" />
                  <p className="text-2xl font-black">Happy</p>
                  <span className="text-xs text-zinc-300">Mood</span>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                  <Timer className="w-6 h-6 mb-3 text-green-300" />
                  <p className="text-2xl font-black">2h</p>
                  <span className="text-xs text-zinc-300">Outdoor</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
