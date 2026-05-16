import { useEffect, useMemo, useState } from "react";
import {
  Baby, Brain, Activity, Heart, Sparkles, Gamepad2,
  Smile, Apple, Moon, ChevronRight, ShieldCheck,
  BookOpen, Timer, Star, Rocket, Check,
} from "lucide-react";

// ─── Animated Ring (SVG) ────────────────────────────────────────────────────
function RingProgress({ value = 78, size = 160, stroke = 10, color = "url(#rg1)" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00e5c4" />
          <stop offset="100%" stopColor="#005fff" />
        </linearGradient>
        <linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a29bfe" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ─── Bar Progress ───────────────────────────────────────────────────────────
function BarProgress({ label, value, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#6b8fa8" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: "#e8f4f8" }}>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 100, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 100,
          width: `${value}%`,
          background: color,
          transition: "width 1.5s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, title, value, color, bgColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0d2236",
        border: `1px solid ${hovered ? "rgba(0,229,196,0.3)" : "rgba(0,229,196,0.12)"}`,
        borderRadius: 24,
        padding: 24,
        transition: "all 0.3s",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        cursor: "default",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: bgColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <Icon size={24} color={color} />
      </div>
      <p style={{ fontSize: 13, color: "#6b8fa8", fontWeight: 500, marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "'Syne', sans-serif", marginBottom: 10 }}>{value}</p>
      <div style={{ fontSize: 12, color: "#00e5c4", display: "flex", alignItems: "center", gap: 5 }}>
        <Rocket size={13} /> Healthy progress improving
      </div>
    </div>
  );
}

// ─── Habit Row ──────────────────────────────────────────────────────────────
function HabitRow({ index, label }) {
  const [done, setDone] = useState(index < 4);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => setDone(d => !d)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 16px",
        borderRadius: 16,
        border: `1px solid ${hovered ? "rgba(0,229,196,0.2)" : "rgba(255,255,255,0.05)"}`,
        background: hovered ? "rgba(0,229,196,0.04)" : "transparent",
        marginBottom: 10,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "rgba(0,229,196,0.1)",
          color: "#00e5c4",
          fontWeight: 700, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>{index + 1}</div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: 9,
        border: done ? "1px solid #00e5c4" : "1px solid rgba(255,255,255,0.15)",
        background: done ? "rgba(0,229,196,0.15)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
        color: "#00e5c4",
      }}>
        {done && <Check size={14} />}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ChildrenHealth() {
  const [score, setScore] = useState(78);
  const [steps, setSteps] = useState(5200);
  const [dir, setDir] = useState(1);

  // Animate score & steps
  useEffect(() => {
    const id = setInterval(() => {
      setScore(prev => {
        const next = prev + dir;
        if (next >= 98 || next <= 78) setDir(d => -d);
        return next;
      });
      setSteps(prev => prev + Math.floor(Math.random() * 130 + 20));
    }, 2500);
    return () => clearInterval(id);
  }, [dir]);

  const wellnessCards = useMemo(() => [
    { icon: Brain,    title: "Brain Development", value: "94%",  color: "#a29bfe", bgColor: "rgba(162,155,254,0.12)" },
    { icon: Activity, title: "Daily Activity",     value: "8.1K", color: "#00e5c4", bgColor: "rgba(0,229,196,0.10)" },
    { icon: Moon,     title: "Healthy Sleep",      value: "9.2h", color: "#005fff", bgColor: "rgba(0,95,255,0.12)"  },
    { icon: Apple,    title: "Nutrition Balance",  value: "91%",  color: "#00e676", bgColor: "rgba(0,230,118,0.10)" },
  ], []);

  const habits = [
    "Morning stretching", "Healthy breakfast", "Outdoor sunlight play",
    "Screen-time balance", "Learning focus games", "Night sleep routine",
  ];

  const s = {
    root: {
      minHeight: "100vh",
      background: "#020d1a",
      color: "#e8f4f8",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
    },
    orb: (top, left, w, h, c) => ({
      position: "fixed", borderRadius: "50%",
      filter: "blur(100px)", pointerEvents: "none", zIndex: 0,
      top, left, width: w, height: h,
      background: c,
    }),
    wrap: {
      position: "relative", zIndex: 1,
      maxWidth: 1200, margin: "0 auto", padding: "40px 24px",
    },
    nav: {
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 60,
    },
    logo: {
      display: "flex", alignItems: "center", gap: 10,
      fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
    },
    logoDot: {
      width: 34, height: 34, borderRadius: 10,
      background: "linear-gradient(135deg,#00e5c4,#005fff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16,
    },
    navLinks: { display: "flex", gap: 28 },
    navLink: { color: "#6b8fa8", textDecoration: "none", fontSize: 14, fontWeight: 500 },
    btnPrimary: {
      padding: "14px 28px", borderRadius: 100,
      background: "linear-gradient(135deg,#00e5c4,#005fff)",
      border: "none", color: "#000", fontWeight: 700,
      fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.3s",
    },
    btnGhost: {
      padding: "14px 28px", borderRadius: 100,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(0,229,196,0.15)",
      color: "#e8f4f8", fontSize: 15, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.3s",
    },
    hero: {
      display: "grid",
      gridTemplateColumns: "1fr 380px",
      gap: 60, alignItems: "center", marginBottom: 80,
    },
    badge: {
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(0,229,196,0.08)",
      border: "1px solid rgba(0,229,196,0.2)",
      borderRadius: 100, padding: "8px 18px",
      fontSize: 13, color: "#00e5c4", fontWeight: 500, marginBottom: 28,
    },
    pulseDot: {
      width: 8, height: 8, borderRadius: "50%",
      background: "#00e5c4",
      animation: "pulse 2s infinite",
    },
    h1: {
      fontFamily: "'Syne', sans-serif", fontWeight: 800,
      fontSize: 64, lineHeight: 1.05, marginBottom: 20,
    },
    grad: {
      background: "linear-gradient(90deg,#00e5c4,#005fff,#a29bfe)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    desc: { color: "#6b8fa8", fontSize: 17, lineHeight: 1.7, maxWidth: 480, marginBottom: 36 },
    scoreCard: {
      background: "#0d2236",
      border: "1px solid rgba(0,229,196,0.15)",
      borderRadius: 28, padding: 28,
    },
    sectionHead: {
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-end", marginBottom: 32,
    },
    sectionTitle: {
      fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
    },
    cardsGrid: {
      display: "grid", gridTemplateColumns: "repeat(4,1fr)",
      gap: 18, marginBottom: 70,
    },
    bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
    habitsCard: {
      background: "#0d2236",
      border: "1px solid rgba(0,229,196,0.12)",
      borderRadius: 28, padding: 28,
    },
    funCard: {
      background: "linear-gradient(145deg,rgba(0,95,255,0.15),rgba(162,155,254,0.1))",
      border: "1px solid rgba(0,95,255,0.2)",
      borderRadius: 28, padding: 28,
    },
    funStatsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
    funStat: {
      background: "rgba(0,0,0,0.25)", borderRadius: 16, padding: 14,
      border: "1px solid rgba(255,255,255,0.07)", textAlign: "center",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,229,196,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(0,229,196,0); }
        }
      `}</style>

      <div style={s.root}>
        {/* Orbs */}
        <div style={s.orb("-100px","-100px","500px","500px","radial-gradient(circle,rgba(0,229,196,0.13),transparent 70%)")} />
        <div style={s.orb("auto","-150px","600px","600px","radial-gradient(circle,rgba(0,95,255,0.10),transparent 70%)")} />

        <div style={s.wrap}>
          {/* NAV */}
          <nav style={s.nav}>
            <div style={s.logo}>
              <div style={s.logoDot}>🌟</div>
              ManifiX
            </div>
            <div style={s.navLinks}>
              {["Dashboard","Activity","Nutrition","Reports"].map(l => (
                <a key={l} href="#" style={s.navLink}>{l}</a>
              ))}
            </div>
            <button style={s.btnPrimary}>Get Started</button>
          </nav>

          {/* HERO */}
          <div style={s.hero}>
            <div>
              <div style={s.badge}>
                <span style={s.pulseDot} />
                AI-Powered Children Wellness Platform
              </div>
              <h1 style={s.h1}>
                Healthy Kids.<br />
                <span style={s.grad}>Strong Future.</span>
              </h1>
              <p style={s.desc}>
                ManifiX helps children build healthy habits, improve movement, balance screen time,
                track nutrition, and develop smarter daily routines using AI-powered wellness systems.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button style={s.btnPrimary}>Start Healthy Journey →</button>
                <button style={s.btnGhost}>Explore AI Tracking</button>
              </div>
            </div>

            {/* Score Card */}
            <div style={s.scoreCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: "#6b8fa8", letterSpacing: ".8px", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                    Growth Wellness Score
                  </p>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 64, fontWeight: 800, lineHeight: 1, color: "#00e5c4" }}>
                    {score}
                  </p>
                </div>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: "linear-gradient(135deg,#00e5c4,#005fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                }}>👶</div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 20px" }}>
                <div style={{ position: "relative" }}>
                  <RingProgress value={score} size={150} stroke={10} color="url(#rg1)" />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Baby size={28} color="#00e5c4" />
                  </div>
                </div>
              </div>

              <BarProgress label="Focus & Learning" value={89} color="linear-gradient(90deg,#00e5c4,#005fff)" />
              <BarProgress label="Energy Balance"   value={92} color="linear-gradient(90deg,#00b894,#00cec9)" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b8fa8", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Activity size={13} /> Daily Steps
                  </div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700 }}>
                    {steps.toLocaleString()}
                  </p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b8fa8", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Heart size={13} /> Wellness
                  </div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: "#00e5c4" }}>
                    Excellent
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WELLNESS CARDS */}
          <div style={s.sectionHead}>
            <div>
              <div style={s.sectionTitle}>Smart Wellness System</div>
              <p style={{ color: "#6b8fa8", marginTop: 4, fontSize: 14 }}>AI-powered healthy development tracking.</p>
            </div>
            <button style={{ background: "none", border: "none", color: "#00e5c4", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              View Full Dashboard <ChevronRight size={16} />
            </button>
          </div>

          <div style={s.cardsGrid}>
            {wellnessCards.map((c, i) => <MetricCard key={i} {...c} />)}
          </div>

          {/* BOTTOM GRID */}
          <div style={s.bottomGrid}>
            {/* Habits */}
            <div style={s.habitsCard}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={24} color="#00e5c4" /> Healthy Daily Habits
              </div>
              {habits.map((h, i) => <HabitRow key={i} index={i} label={h} />)}
            </div>

            {/* Fun AI card */}
            <div style={s.funCard}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: "rgba(0,95,255,0.2)",
                border: "1px solid rgba(0,95,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 22,
              }}>🎮</div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 14, maxWidth: 300 }}>
                Fun AI Wellness For Modern Kids
              </h2>
              <p style={{ color: "#6b8fa8", fontSize: 14, lineHeight: 1.7, maxWidth: 340, marginBottom: 24 }}>
                Interactive wellness tracking makes healthy living feel fun, rewarding, and engaging for children and families.
              </p>
              <div style={s.funStatsGrid}>
                {[
                  { icon: <BookOpen size={20} color="#00e5c4" />, val: "93%",   label: "Learning" },
                  { icon: <Smile     size={20} color="#ffd166" />, val: "Happy", label: "Mood"     },
                  { icon: <Timer     size={20} color="#00e5c4" />, val: "2h",    label: "Outdoor"  },
                ].map((st, i) => (
                  <div key={i} style={s.funStat}>
                    <div style={{ marginBottom: 8 }}>{st.icon}</div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 3 }}>{st.val}</p>
                    <p style={{ fontSize: 11, color: "#6b8fa8" }}>{st.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
