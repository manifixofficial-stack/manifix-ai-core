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

const HEALTH_METRICS = [
  {
    icon: "🩸",
    title: "Blood Sugar",
    value: "96 mg/dL",
    status: "Stable",
    color: "#FFD166",
  },
  {
    icon: "❤️",
    title: "Heart Rate",
    value: "72 BPM",
    status: "Healthy",
    color: "#F59E0B",
  },
  {
    icon: "🚶",
    title: "Daily Steps",
    value: "8,420",
    status: "Excellent",
    color: "#D4AF37",
  },
  {
    icon: "😴",
    title: "Sleep Recovery",
    value: "89%",
    status: "Recovered",
    color: "#FFE082",
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
    <>
      <style>{`
        *{
          box-sizing:border-box;
        }

        body{
          background:#000;
        }

        .chronic-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left, rgba(212,175,55,0.18), transparent 30%),
            radial-gradient(circle at bottom right, rgba(255,215,0,0.08), transparent 25%),
            #000;
          color:white;
          padding:40px 24px 100px;
          overflow:hidden;
          font-family:Inter, sans-serif;
        }

        .chronic-hero{
          max-width:1400px;
          margin:auto;
          display:grid;
          grid-template-columns:1.2fr 0.8fr;
          gap:40px;
          align-items:center;
          margin-bottom:80px;
        }

        .chronic-badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:10px 18px;
          border-radius:999px;
          background:rgba(212,175,55,0.12);
          border:1px solid rgba(212,175,55,0.35);
          color:#FFD700;
          font-weight:700;
          margin-bottom:24px;
          backdrop-filter:blur(12px);
        }

        .chronic-left h1{
          font-size:clamp(3rem,7vw,6rem);
          line-height:0.95;
          margin:0;
          font-weight:900;
          letter-spacing:-3px;
          background:linear-gradient(180deg,#fff,#FFD700);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }

        .chronic-left p{
          margin-top:28px;
          max-width:650px;
          color:#d1d5db;
          font-size:1.12rem;
          line-height:1.8;
        }

        .chronic-buttons{
          display:flex;
          gap:18px;
          margin-top:34px;
          flex-wrap:wrap;
        }

        .primary-btn,
        .secondary-btn,
        .action-btn{
          border:none;
          cursor:pointer;
          transition:0.3s ease;
          font-weight:800;
        }

        .primary-btn{
          background:linear-gradient(135deg,#FFD700,#D4AF37);
          color:black;
          padding:16px 26px;
          border-radius:18px;
          font-size:1rem;
          box-shadow:0 10px 40px rgba(255,215,0,0.25);
        }

        .primary-btn:hover{
          transform:translateY(-3px) scale(1.02);
        }

        .secondary-btn{
          background:rgba(255,255,255,0.05);
          color:white;
          padding:16px 26px;
          border-radius:18px;
          border:1px solid rgba(255,215,0,0.25);
          backdrop-filter:blur(14px);
        }

        .secondary-btn:hover{
          background:rgba(255,215,0,0.08);
        }

        .hero-stats{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:18px;
          margin-top:44px;
        }

        .hero-stats div{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,215,0,0.14);
          border-radius:24px;
          padding:24px;
          backdrop-filter:blur(14px);
        }

        .hero-stats strong{
          display:block;
          font-size:2rem;
          color:#FFD700;
          margin-bottom:8px;
        }

        .hero-stats span{
          color:#cfcfcf;
          font-size:0.95rem;
        }

        .chronic-card{
          background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03));
          border:1px solid rgba(255,215,0,0.18);
          border-radius:32px;
          padding:34px;
          backdrop-filter:blur(18px);
          box-shadow:0 20px 80px rgba(255,215,0,0.08);
        }

        .score-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:30px;
        }

        .score-header p{
          color:#bbb;
          margin-bottom:6px;
        }

        .score-header h2{
          font-size:4rem;
          margin:0;
          color:#FFD700;
        }

        .score-icon{
          width:82px;
          height:82px;
          border-radius:24px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(255,215,0,0.12);
          color:#FFD700;
        }

        .score-progress{
          height:16px;
          background:#1a1a1a;
          border-radius:999px;
          overflow:hidden;
          margin-bottom:26px;
        }

        .score-fill{
          height:100%;
          border-radius:999px;
          background:linear-gradient(90deg,#FFD700,#D4AF37);
        }

        .score-metrics{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:14px;
        }

        .score-metrics div{
          background:rgba(255,255,255,0.04);
          padding:18px;
          border-radius:18px;
          text-align:center;
        }

        .score-metrics span{
          display:block;
          color:#999;
          margin-bottom:8px;
        }

        .score-metrics strong{
          color:#FFD700;
        }

        .section-title{
          text-align:center;
          margin-bottom:50px;
        }

        .section-title h2{
          font-size:3rem;
          margin-bottom:12px;
          color:#FFD700;
        }

        .section-title p{
          color:#c5c5c5;
          max-width:700px;
          margin:auto;
          line-height:1.7;
        }

        .metrics-grid{
          max-width:1400px;
          margin:auto;
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
          gap:24px;
        }

        .metric-card{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,215,0,0.12);
          border-radius:30px;
          padding:30px;
          text-align:center;
          backdrop-filter:blur(14px);
          transition:0.3s ease;
        }

        .metric-card:hover{
          transform:translateY(-6px);
          border-color:#FFD700;
        }

        .metric-icon{
          width:74px;
          height:74px;
          border-radius:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:2rem;
          margin:auto auto 24px;
          border:1px solid rgba(255,215,0,0.3);
        }

        .metric-card h3{
          margin-bottom:12px;
          color:#fff;
        }

        .metric-card h1{
          color:#FFD700;
          margin-bottom:10px;
          font-size:2.5rem;
        }

        .metric-card p{
          color:#bdbdbd;
        }

        .daily-control{
          max-width:1400px;
          margin:90px auto;
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
          gap:26px;
        }

        .control-card{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,215,0,0.12);
          border-radius:30px;
          padding:34px;
          backdrop-filter:blur(16px);
        }

        .control-head{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:20px;
          color:#FFD700;
        }

        .control-card h1{
          font-size:3rem;
          color:#FFD700;
          margin:10px 0;
        }

        .control-card p{
          color:#c7c7c7;
          line-height:1.7;
        }

        .medicine-status{
          margin-bottom:20px;
          font-size:1.1rem;
          font-weight:700;
        }

        .walk-progress{
          height:14px;
          background:#181818;
          border-radius:999px;
          overflow:hidden;
          margin:20px 0;
        }

        .walk-fill{
          height:100%;
          background:linear-gradient(90deg,#FFD700,#D4AF37);
        }

        .action-btn{
          margin-top:18px;
          width:100%;
          padding:15px;
          border-radius:18px;
          background:linear-gradient(135deg,#FFD700,#B8860B);
          color:black;
          font-size:1rem;
        }

        .action-btn:hover{
          transform:translateY(-2px);
        }

        .habits-section{
          max-width:1400px;
          margin:auto;
        }

        .habits-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
          gap:26px;
        }

        .habit-card{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,215,0,0.12);
          border-radius:28px;
          padding:30px;
          transition:0.3s ease;
          backdrop-filter:blur(14px);
        }

        .habit-card:hover{
          transform:translateY(-6px);
          border-color:#FFD700;
        }

        .habit-icon{
          width:70px;
          height:70px;
          border-radius:20px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(255,215,0,0.1);
          color:#FFD700;
          margin-bottom:22px;
        }

        .habit-card h3{
          margin-bottom:14px;
          font-size:1.4rem;
        }

        .habit-card p{
          color:#c9c9c9;
          line-height:1.8;
        }

        .habit-link{
          margin-top:22px;
          display:flex;
          align-items:center;
          gap:8px;
          color:#FFD700;
          font-weight:700;
        }

        @media(max-width:980px){

          .chronic-hero{
            grid-template-columns:1fr;
          }

          .hero-stats{
            grid-template-columns:1fr;
          }

          .score-metrics{
            grid-template-columns:1fr;
          }

          .section-title h2{
            font-size:2.2rem;
          }

          .chronic-left h1{
            font-size:4rem;
          }
        }

        @media(max-width:640px){

          .chronic-page{
            padding:26px 18px 80px;
          }

          .chronic-left h1{
            font-size:3rem;
          }

          .primary-btn,
          .secondary-btn{
            width:100%;
          }

          .score-header h2{
            font-size:3rem;
          }
        }
      `}</style>

      <div className="chronic-page">

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
    </>
  );
}
