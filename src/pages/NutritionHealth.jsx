import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  Flame,
  HeartPulse,
  Salad,
  Sparkles,
  TrendingUp,
  Droplets,
  Utensils,
  BarChart3,
  PlayCircle,
} from "lucide-react";

const mealPlans = [
  {
    title: "Fat Burn Breakfast",
    calories: "320 kcal",
    type: "High Protein",
    icon: Flame,
    gradient: "from-orange-400 to-red-500",
  },
  {
    title: "Energy Lunch",
    calories: "540 kcal",
    type: "Balanced",
    icon: Salad,
    gradient: "from-green-400 to-emerald-500",
  },
  {
    title: "Heart Healthy Dinner",
    calories: "410 kcal",
    type: "Low Sugar",
    icon: HeartPulse,
    gradient: "from-pink-400 to-rose-500",
  },
  {
    title: "Hydration Recovery",
    calories: "Daily Goal",
    type: "Water + Electrolytes",
    icon: Droplets,
    gradient: "from-cyan-400 to-blue-500",
  },
];

const nutritionTips = [
  "Protein in the morning improves energy stability.",
  "Hydration affects mood and focus more than most people realize.",
  "Whole foods reduce stress-related cravings.",
  "Late-night sugar spikes reduce sleep quality.",
  "Healthy eating works best when habits stay simple.",
];

export default function NutritionHealth() {
  const [water, setWater] = useState(5);
  const [goal] = useState(8);
  const [tipIndex, setTipIndex] = useState(0);
  const [nutritionScore] = useState(82);
  const [streak] = useState(21);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % nutritionTips.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const hydrationProgress = useMemo(() => {
    return Math.min(100, (water / goal) * 100);
  }, [water, goal]);

  return (
    <div className="min-h-screen bg-[#06110B] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[120px] bg-green-500" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-[140px] bg-emerald-400" />
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
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl shadow-2xl shadow-green-500/30">
              🍎
            </div>

            <div>
              <p className="text-green-300 tracking-wide text-sm font-medium">
                MANIFIX NUTRITION AI
              </p>

              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Eat Better.
                <br />
                Feel Stronger.
              </h1>
            </div>
          </div>

          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
            Personalized meal systems, hydration tracking, AI nutrition
            coaching, healthy habits, and energy optimization — built for
            real-life consistency.
          </p>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {[
            {
              label: "Nutrition Score",
              value: `${nutritionScore}/100`,
              icon: BarChart3,
            },
            {
              label: "Healthy Streak",
              value: `${streak} days`,
              icon: Flame,
            },
            {
              label: "Water Progress",
              value: `${water}/${goal} glasses`,
              icon: Droplets,
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

        {/* AI CARD */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-3xl border border-green-400/20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-green-300" />
            </div>

            <div>
              <p className="text-green-200 text-lg font-bold">
                AI Nutrition Insight
              </p>

              <p className="text-gray-200 mt-2 leading-relaxed">
                Your energy levels improve most on high-protein breakfasts.
                Reducing late-night sugar may improve sleep and stress recovery.
              </p>
            </div>
          </div>
        </motion.div>

        {/* HYDRATION */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black">Hydration Tracker</h2>
              <p className="text-gray-400 mt-2">
                Water impacts focus, mood, recovery, and metabolism.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWater((prev) => Math.max(0, prev - 1))}
                className="w-12 h-12 rounded-2xl bg-white/10 text-xl"
              >
                −
              </button>

              <button
                onClick={() => setWater((prev) => Math.min(goal, prev + 1))}
                className="w-12 h-12 rounded-2xl bg-green-500 text-black text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 h-4 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${hydrationProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-green-400"
            />
          </div>
        </div>

        {/* MEAL PROGRAMS */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black">Smart Meal Programs</h2>

            <button className="text-green-300 text-sm font-medium">
              Explore All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {mealPlans.map((meal, index) => {
              const Icon = meal.icon;

              return (
                <motion.div
                  key={meal.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${meal.gradient} opacity-10`}
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Icon className="w-7 h-7" />
                        </div>

                        <div>
                          <p className="text-xl font-bold">{meal.title}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {meal.calories} • {meal.type}
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

        {/* DAILY TIP */}
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Apple className="w-5 h-5 text-emerald-300" />
            <p className="font-bold text-emerald-200">Daily Nutrition Tip</p>
          </div>

          <p className="text-xl font-semibold leading-relaxed text-white">
            {nutritionTips[tipIndex]}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-[32px] overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 p-[1px]"
        >
          <div className="rounded-[32px] bg-[#09150F] px-8 py-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Healthy Habits.
              <br />
              Long-Term Energy.
            </h2>

            <p className="text-gray-300 mt-5 max-w-2xl mx-auto leading-relaxed">
              Build sustainable nutrition routines with AI-guided meal systems,
              hydration tracking, energy optimization, and healthy lifestyle
              coaching.
            </p>

            <button className="mt-7 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold text-lg shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform">
              Start Healthy Journey
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
