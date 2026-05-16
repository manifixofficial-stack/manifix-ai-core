import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

const MEDICATIONS = [
  {
    name: "Vitamin D",
    dosage: "1 tablet · Morning",
    time: "08:00 AM",
    taken: true,
  },
  {
    name: "Omega 3",
    dosage: "2 capsules · Lunch",
    time: "01:00 PM",
    taken: true,
  },
  {
    name: "Magnesium",
    dosage: "1 tablet · Night",
    time: "09:00 PM",
    taken: false,
  },
];

const STATS = [
  {
    title: "Medication Accuracy",
    value: "98%",
    icon: ShieldCheck,
    color: "#34D399",
  },
  {
    title: "Missed Doses",
    value: "0",
    icon: Pill,
    color: "#60A5FA",
  },
  {
    title: "Recovery Progress",
    value: "+21%",
    icon: Activity,
    color: "#F59E0B",
  },
  {
    title: "Wellness Score",
    value: "92",
    icon: HeartPulse,
    color: "#F87171",
  },
];

export default function MedicationHealth() {
  const [takenCount, setTakenCount] = useState(2);
  const [reminderPulse, setReminderPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setReminderPulse((prev) => !prev);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    return Math.round((takenCount / MEDICATIONS.length) * 100);
  }, [takenCount]);

  return (
    <div className="min-h-screen bg-[#040816] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb20,transparent_45%)]" />
      <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6">
              <Sparkles size={16} />
              <span className="text-sm tracking-wide">
                AI Medication Assistant
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-none max-w-4xl">
              Never miss
              <span className="block text-cyan-400 mt-2">
                your health routine
              </span>
            </h1>

            <p className="text-lg text-gray-300 mt-6 max-w-2xl leading-relaxed">
              Smart reminders, medication tracking, recovery analytics, and AI
              wellness guidance designed to build long-term healthy habits.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-7 py-4 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-500/30">
                Start Medication Plan
              </button>

              <button className="px-7 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                Sync Health Schedule
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[420px] rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm">Today Progress</p>
                <h3 className="text-2xl font-bold">Dose Completion</h3>
              </div>

              <div className="w-16 h-16 rounded-full border-4 border-cyan-400 flex items-center justify-center text-xl font-black">
                {progress}%
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-black/30 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell className={`${reminderPulse ? "text-cyan-400" : "text-white"} transition-all`} />
                  <span className="font-semibold">Next Reminder</span>
                </div>

                <span className="font-black text-xl">09:00 PM</span>
              </div>

              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-sm text-gray-400 mt-3">
                AI predicts strong consistency streak this week.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-14">
          {STATS.map((item, index) => {
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
                <h3 className="text-4xl font-black mt-3">{item.value}</h3>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-14">
          <div className="rounded-[32px] p-7 bg-white/5 border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Clock3 className="text-cyan-400" />
              <h2 className="text-2xl font-bold">Medication Schedule</h2>
            </div>

            <div className="space-y-4">
              {MEDICATIONS.map((med, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => setTakenCount(index + 1)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      med.taken
                        ? "bg-cyan-500/15 border-cyan-400/40"
                        : "bg-black/20 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          med.taken ? "bg-cyan-400/20" : "bg-white/5"
                        }`}
                      >
                        {med.taken ? (
                          <CheckCircle2 className="text-cyan-400" />
                        ) : (
                          <Pill className="text-white" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">{med.name}</h3>
                        <p className="text-sm text-gray-400">
                          {med.dosage}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-300">{med.time}</span>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] p-7 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-400/20 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/20 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <Brain className="text-cyan-300" />
                <h2 className="text-2xl font-bold">AI Wellness Insight</h2>
              </div>

              <p className="text-lg text-gray-200 leading-relaxed">
                Your medication consistency improved sleep quality and energy
                levels over the past 14 days. AI recommends keeping the same
                evening routine for maximum recovery.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
                  <Bell className="mb-3 text-cyan-300" />
                  <p className="text-sm text-gray-400">Reminder Accuracy</p>
                  <h3 className="text-3xl font-black mt-2">99%</h3>
                </div>

                <div className="p-5 rounded-2xl bg-black/20 border border-white/10">
                  <Activity className="mb-3 text-green-300" />
                  <p className="text-sm text-gray-400">Recovery Trend</p>
                  <h3 className="text-3xl font-black mt-2">Positive</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
