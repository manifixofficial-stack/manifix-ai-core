// src/pages/ChronicHealth.jsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Activity,
  Shield,
  Brain,
  Footprints,
  TrendingDown,
  Apple,
  Moon,
  ChevronRight,
  TimerReset,
} from "lucide-react";

import "../styles/chronichealth.css";

const HEALTH_METRICS = [
  {
    icon: "🩸",
    title: "Blood Sugar",
    value: "96 mg/dL",
    status: "Stable",
    color: "#F87171",
  },
  {
    icon: "❤️",
    title: "Heart Rate",
    value: "72 BPM",
    status: "Healthy",
    color: "#FB7185",
  },
  {
    icon: "🚶",
    title: "Daily Steps",
    value: "8,420",
    status: "Excellent",
    color: "#F97316",
  },
  {
    icon: "😴",
    title: "Sleep Recovery",
    value: "89%",
    status: "Recovered",
    color: "#EF4444",
  },
];

const HABITS = [
  {
    icon: Apple,
    title: "Nutrition Tracking",
    desc: "Balanced meal suggestions to reduce long-term health risks.",
  },
  {
    icon: Activity,
    title: "Movement Therapy",
    desc: "Daily mobility and walking goals powered by AI tracking.",
  },
  {
    icon: Moon,
    title: "Sleep Optimization",
    desc: "Improve recovery and inflammation through healthier sleep.",
  },
  {
    icon: Brain,
    title: "Stress Reduction",
    desc: "Reduce cortisol and chronic fatigue using mindfulness routines.",
  },
];

export default function ChronicHealth() {
  const [medicineTaken, setMedicineTaken] = useState(true);
  const [steps, setSteps] = useState(8420);
  const [healthScore, setHealthScore] = useState(84);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const progress = useMemo(() => {
    return Math.min((steps / 10000) * 100, 100);
  }, [steps]);

  return (
    <div className="chronic-page">

      {/* HERO */}
      <section className="chronic-hero">

        <motion.div
          className="chronic-left"
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="chronic-badge">
            <HeartPulse size={16} />
            Chronic Care AI
          </div>

          <h1>
            Prevent.
            <br />
            Monitor.
            <br />
            Heal Smarter.
          </h1>

          <p>
            AI-powered chronic health support helping millions manage
            diabetes, blood pressure, heart health, inflammation,
            and long-term wellness naturally.
          </p>

          <div className="chronic-buttons">
            <button className="primary-btn">
              Start Recovery
            </button>

            <button className="secondary-btn">
              Explore Insights
            </button>
          </div>

          <div className="hero-stats">

            <div>
              <strong>422M+</strong>
              <span>People with diabetes</span>
            </div>

            <div>
              <strong>40%</strong>
              <span>Risk reduction</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>AI health tracking</span>
            </div>

          </div>
        </motion.div>

        <motion.div
          className="chronic-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >

          <div className="score-header">
            <div>
              <p>Health Stability Score</p>
              <h2>{healthScore}%</h2>
            </div>

            <div className="score-icon">
              <Shield />
            </div>
          </div>

          <div className="score-progress">
            <div
              className="score-fill"
              style={{ width: `${healthScore}%` }}
            />
          </div>

          <div className="score-metrics">

            <div>
              <span>Inflammation</span>
              <strong>Low</strong>
            </div>

            <div>
              <span>Recovery</span>
              <strong>Improving</strong>
            </div>

            <div>
              <span>Energy</span>
              <strong>Stable</strong>
            </div>

          </div>

        </motion.div>

      </section>

      {/* METRICS */}
      <section className="metrics-section">

        <div className="section-title">
          <h2>Live Health Monitoring</h2>

          <p>
            Track important chronic wellness indicators in real time.
          </p>
        </div>

        <div className="metrics-grid">

          {HEALTH_METRICS.map((metric, index) => (
            <motion.div
              key={metric.title}
              className="metric-card"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >

              <div
                className="metric-icon"
                style={{
                  background: `${metric.color}20`,
                  borderColor: `${metric.color}50`,
                }}
              >
                {metric.icon}
              </div>

              <h3>{metric.title}</h3>

              <h1>{metric.value}</h1>

              <p>{metric.status}</p>

            </motion.div>
          ))}

        </div>
      </section>

      {/* DAILY CONTROL */}
      <section className="daily-control">

        <motion.div
          className="control-card"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="control-head">
            <TimerReset />
            <h3>Medication Routine</h3>
          </div>

          <div className="medicine-status">
            {medicineTaken ? "✅ Taken Today" : "⚠️ Pending"}
          </div>

          <button
            className="action-btn"
            onClick={() => setMedicineTaken(!medicineTaken)}
          >
            Toggle Status
          </button>
        </motion.div>

        <motion.div
          className="control-card"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="control-head">
            <Footprints />
            <h3>Movement Goal</h3>
          </div>

          <h1>{steps.toLocaleString()}</h1>

          <p>Daily recovery movement</p>

          <div className="walk-progress">
            <div
              className="walk-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            className="action-btn"
            onClick={() => setSteps((v) => v + 1000)}
          >
            Add 1,000 Steps
          </button>
        </motion.div>

        <motion.div
          className="control-card"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="control-head">
            <TrendingDown />
            <h3>Risk Reduction</h3>
          </div>

          <h1>−40%</h1>

          <p>
            Estimated improvement through consistent healthy habits.
          </p>

          <button
            className="action-btn"
            onClick={() =>
              setHealthScore((v) => Math.min(v + 2, 100))
            }
          >
            Improve Score
          </button>
        </motion.div>

      </section>

      {/* HABITS */}
      <section className="habits-section">

        <div className="section-title">
          <h2>Healthy Lifestyle System</h2>

          <p>
            Sustainable habits designed to improve chronic wellness over time.
          </p>
        </div>

        <div className="habits-grid">

          {HABITS.map((habit, index) => {
            const Icon = habit.icon;

            return (
              <motion.div
                key={habit.title}
                className="habit-card"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                viewport={{ once: true }}
              >
                <div className="habit-icon">
                  <Icon size={28} />
                </div>

                <h3>{habit.title}</h3>

                <p>{habit.desc}</p>

                <div className="habit-link">
                  Learn More
                  <ChevronRight size={18} />
                </div>
              </motion.div>
            );
          })}

        </div>

      </section>

    </div>
  );
}
