// src/pages/SleepHealth.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   MANIFIX MODULES
════════════════════════════════════════════════════════════ */

const MANIFIX_MODULES = [
  { id:"mental",    icon:"🧠", label:"Mental",    stat:"970M affected",   result:"Calm in 30d",    route:"/app/mental",    color:"#A78BFA" },
  { id:"sleep",     icon:"😴", label:"Sleep",     stat:"45% deprived",    result:"8h deep sleep",  route:"/app/sleep",     color:"#818CF8" },
  { id:"nutrition", icon:"🍎", label:"Nutrition", stat:"1B obese adults", result:"−8kg in 2mo",    route:"/app/nutrition", color:"#34D399" },
  { id:"stress",    icon:"😓", label:"Stress",    stat:"67% burned out",  result:"Level 9→3",      route:"/app/stress",    color:"#F59E0B" },
  { id:"chronic",   icon:"🫀", label:"Chronic",   stat:"422M diabetics",  result:"Risk ↓40%",      route:"/app/chronic",   color:"#F87171" },
  { id:"women",     icon:"👩", label:"Women",     stat:"PCOS · hormones", result:"Symptoms ↓",     route:"/app/women",     color:"#F9A8D4" },
  { id:"elderly",   icon:"👴", label:"Elderly",   stat:"Family health",   result:"Connected daily", route:"/app/elderly",   color:"#FCD34D" },
  { id:"meds",      icon:"💊", label:"Meds",      stat:"50% non-adherent",result:"0 missed/60d",   route:"/app/medication",color:"#6EE7B7" },
  { id:"children",  icon:"🧒", label:"Children",  stat:"81% teens inactive",result:"Growth tracked",route:"/app/children",  color:"#93C5FD" },
  { id:"prevent",   icon:"🏃", label:"Preventive",stat:"SDG 3.8 equity",  result:"Score 45→87",    route:"/app/preventive",color:"#A3E635" },
];

/* ════════════════════════════════════════════════════════════
   SLEEP DATA
════════════════════════════════════════════════════════════ */

const SLEEP_FEATURES = [
  {
    icon: "🌙",
    title: "Sleep AI",
    desc: "Personalized sleep optimization engine",
  },
  {
    icon: "🎧",
    title: "Deep Sleep Sounds",
    desc: "Rain, ocean, brown noise & calming audio",
  },
  {
    icon: "🛌",
    title: "Sleep Routine",
    desc: "AI-guided nightly wind-down rituals",
  },
  {
    icon: "📊",
    title: "Sleep Score",
    desc: "Track quality, consistency & recovery",
  },
  {
    icon: "💤",
    title: "Recovery Mode",
    desc: "Burnout and stress recovery sessions",
  },
  {
    icon: "🌍",
    title: "Offline Sleep",
    desc: "Low-data sleep support globally",
  },
];

const NIGHT_TIPS = [
  "No screens 60 minutes before sleep",
  "Cold rooms improve deep sleep quality",
  "Meditation lowers sleep anxiety",
  "Consistent sleep timing improves recovery",
  "Deep sleep strengthens immunity",
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */

export default function SleepHealth() {
  const navigate = useNavigate();

  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((p) => (p + 1) % NIGHT_TIPS.length);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const module = useMemo(
    () => MANIFIX_MODULES.find((m) => m.id === "sleep"),
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04030a",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: "24px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {module.icon} Sleep
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "#A78BFA",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ManifiX AI Sleep Recovery Platform
          </div>
        </div>

        <button
          onClick={() => navigate("/app/dashboard")}
          style={{
            background: "transparent",
            border: "1px solid #2e1065",
            color: "#A78BFA",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
      </div>

      {/* HERO */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#09090f 0%, #1e1b4b 40%, #4c1d95 100%)",
          borderRadius: "30px",
          padding: "36px",
          marginBottom: "28px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-70px",
            top: "-70px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        <div
          style={{
            fontSize: "14px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c4b5fd",
            marginBottom: "12px",
          }}
        >
          Global Sleep Crisis
        </div>

        <div
          style={{
            fontSize: "58px",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: "18px",
          }}
        >
          Sleep Better.
          <br />
          Recover Faster.
        </div>

        <div
          style={{
            maxWidth: "720px",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "#ddd6fe",
          }}
        >
          Millions suffer from chronic sleep deprivation, stress,
          anxiety, burnout, and poor recovery. ManifiX AI helps users
          restore deep sleep naturally with AI-guided routines,
          calming audio, meditation, and recovery analytics.
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "24px",
          }}
        >
          <button
            onClick={() => navigate("/app/magic16")}
            style={{
              background: "#fff",
              color: "#4c1d95",
              border: "none",
              padding: "14px 22px",
              borderRadius: "16px",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            🌙 Start Sleep16
          </button>

          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.16)",
              color: "#fff",
              padding: "14px 22px",
              borderRadius: "16px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            🎧 Sleep Sounds
          </button>
        </div>
      </div>

      {/* AI TIP */}

      <div
        style={{
          background: "#0a0914",
          border: "1px solid #18181b",
          borderRadius: "20px",
          padding: "18px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6d28d9",
            marginBottom: "10px",
          }}
        >
          Night Recovery Insight
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#ddd6fe",
          }}
        >
          {NIGHT_TIPS[tipIndex]}
        </div>
      </div>

      {/* FEATURES */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "18px",
          marginBottom: "32px",
        }}
      >
        {SLEEP_FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: "#09090b",
              border: "1px solid #18181b",
              borderRadius: "24px",
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "16px",
              }}
            >
              {f.icon}
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              {f.title}
            </div>

            <div
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#a1a1aa",
              }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "16px",
          marginBottom: "34px",
        }}
      >
        {[
          { value: "45%", label: "Adults sleep deprived" },
          { value: "$411B", label: "Productivity loss yearly" },
          { value: "40%", label: "Depression reduction possible" },
          { value: "8H", label: "Deep sleep transformation" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#09090b",
              border: "1px solid #18181b",
              borderRadius: "20px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "38px",
                fontWeight: 900,
                color: "#A78BFA",
                marginBottom: "8px",
              }}
            >
              {s.value}
            </div>

            <div
              style={{
                fontSize: "14px",
                color: "#71717a",
                lineHeight: 1.6,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ALL MODULES */}

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#52525b",
            marginBottom: "14px",
          }}
        >
          Explore All ManifiX Modules
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: "12px",
          }}
        >
          {MANIFIX_MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(m.route)}
              style={{
                background: "#09090b",
                border: "1px solid #18181b",
                borderRadius: "18px",
                padding: "18px 12px",
                cursor: "pointer",
                color: "#fff",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                {m.icon}
              </div>

              <div
                style={{
                  fontWeight: 800,
                  fontSize: "15px",
                  marginBottom: "4px",
                }}
              >
                {m.label}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#71717a",
                  marginBottom: "6px",
                }}
              >
                {m.stat}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: m.color,
                  fontWeight: 700,
                }}
              >
                {m.result}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER */}

      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          fontSize: "12px",
          letterSpacing: "0.14em",
          color: "#3f3f46",
          textTransform: "uppercase",
        }}
      >
        ManifiX AI · Sleep Health · WHO SDG 3.4
      </div>
    </div>
  );
}
