import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const CARE_MODULES = [
  {
    title: "Daily Movement",
    value: "4,200",
    unit: "steps",
    icon: Footprints,
    color: "#60A5FA",
  },
  {
    title: "Heart Wellness",
    value: "Stable",
    unit: "today",
    icon: Heart,
    color: "#F87171",
  },
  {
    title: "Sleep Recovery",
    value: "7.9h",
    unit: "deep sleep",
    icon: Moon,
    color: "#A78BFA",
  },
  {
    title: "Mind Activity",
    value: "92%",
    unit: "focus",
    icon: Brain,
    color: "#34D399",
  },
];

const ROUTINES = [
  "Morning breathing routine",
  "Medicine reminder",
  "Joint flexibility session",
  "Hydration check",
  "Family wellness update",
  "Night recovery meditation",
];

export default function ElderlyHealth() {
  const [completed, setCompleted] = useState(2);
  const [pulse, setPulse] = useState(72);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => {
        const random = Math.floor(Math.random() * 4) - 1;
        return Math.max(68, Math.min(78, prev + random));
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    return Math.round((completed / ROUTINES.length) * 100);
  }, [completed]);

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e3a8a30,transparent_45%)]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl mb-6">
              <Sparkles size={16} />
              <span className="text-sm tracking-wide">
                AI Elderly Wellness System
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-none max-w-3xl">
              Healthy aging
              <span className="block text-cyan-400 mt-2">
                powered by AI care
              </span>
            </h1>

            <p className="text-gray-300 text-lg mt-6 max-w-2xl leading-relaxed">
              Personalized routines, medicine reminders, mobility tracking,
              sleep recovery, and family wellness connection designed for
              long-term healthy living.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-6 py-4 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-500/30">
                Start Wellness Plan
              </button>

              <button className="px-6 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                Connect Family
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[420px] rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm">Live Wellness</p>
                <h3 className="text-2xl font-bold">Recovery Score</h3>
              </div>

              <div className="w-16 h-16 rounded-full border-4 border-cyan-400 flex items-center justify-center text-xl font-black">
                91
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-black/30 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Heart className="text-red-400" />
                    <span className="font-semibold">Heart Rate</span>
                  </div>

                  <span className="text-2xl font-black">{pulse} BPM</span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-pink-500"
                    style={{ width: `${pulse}%` }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-black/30 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Shield className="text-cyan-400" />
                    <span className="font-semibold">Daily Progress</span>
                  </div>

                  <span className="font-bold">{progress}%</span>
                </div>

                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-14">
          {CARE_MODULES.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="rounded-[28px] p-6 bg-white/5 border border-white/10 backdrop-blur-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${item.color}20` }}
                >
                  <Icon style={{ color: item.color }} />
                </div>

                <p className="text-gray-400 text-sm">{item.title}</p>

                <div className="flex items-end gap-2 mt-3">
                  <h3 className="text-4xl font-black">{item.value}</h3>
                  <span className="text-gray-400 pb-1">{item.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <div className="rounded-[32px] p-7 bg-white/5 border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Timer className="text-cyan-400" />
              <h2 className="text-2xl font-bold">Daily Wellness Routine</h2>
            </div>

            <div className="space-y-4">
              {ROUTINES.map((task, index) => {
                const done = index < completed;

                return (
                  <button
                    key={index}
                    onClick={() => setCompleted(index + 1)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      done
                        ? "bg-cyan-500/15 border-cyan-400/40"
                        : "bg-black/20 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          done
                            ? "bg-cyan-400 border-cyan-400"
                            : "border-white/30"
                        }`}
                      />

                      <span className="font-medium">{task}</span>
                    </div>

                    <ChevronRight size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] p-7 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-400/20 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-40 h-40 bg-cyan-400/20 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <Activity className="text-cyan-300" />
                <h2 className="text-2xl font-bold">AI Health Insight</h2>
              </div>

              <p className="text-lg text-gray-200 leading-relaxed">
                Consistent sleep recovery and light movement routines improved
                wellness stability this week. AI recommends hydration reminders
                and 10 minutes of stretching after dinner.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
                  <Bell className="mb-3 text-cyan-300" />
                  <p className="text-sm text-gray-400">Medication Accuracy</p>
                  <h3 className="text-3xl font-black mt-2">98%</h3>
                </div>

                <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
                  <Shield className="mb-3 text-green-300" />
                  <p className="text-sm text-gray-400">Fall Risk</p>
                  <h3 className="text-3xl font-black mt-2">Low</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
