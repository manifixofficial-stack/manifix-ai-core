// src/pages/MentalHealth.jsx

import { useMemo, useState, useEffect } from "react";
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
   MENTAL HEALTH DATA
════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: "🧘",
    title: "AI Meditation",
    desc: "Guided breathing & mindfulness sessions",
  },
  {
    icon: "💬",
    title: "24/7 AI Therapy",
    desc: "Talk anytime with emotional AI support",
  },
  {
    icon: "📊",
    title: "Mood Analytics",
    desc: "Track stress, focus, anxiety & calm levels",
  },
  {
    icon: "🎧",
    title: "Calm Audio",
    desc: "Sleep sounds & mental recovery audio",
  },
  {
    icon: "⚡",
    title: "Stress Relief",
    desc: "5-minute burnout recovery routines",
  },
  {
    icon: "🌍",
    title: "Global Access",
    desc: "Offline-first mental care for everyone",
  },
];

const TIPS = [
  "Deep breathing reduces cortisol levels",
  "8 minutes meditation improves focus",
  "Daily movement lowers depression risk",
  "Sleep quality directly impacts mental health",
  "Mindfulness reduces burnout symptoms",
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */

export default function MentalHealth() {
  const navigate = useNavigate();

  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((p) => (p + 1) % TIPS.length);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const module = useMemo(
    () => MANIFIX_MODULES.find((m) => m.id === "mental"),
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06050e",
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
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {module.icon} Mental
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: "#A78BFA",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ManifiX AI Mental Health Platform
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
            "linear-gradient(135deg,#1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)",
          borderRadius: "28px",
          padding: "34px",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-50px",
            top: "-50px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        <div
          style={{
            fontSize: "18px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#d8b4fe",
            marginBottom: "12px",
          }}
        >
          WHO Mental Health Crisis
        </div>

        <div
          style={{
            fontSize: "52px",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: "18px",
          }}
        >
          970M People
          <br />
          Need Support
        </div>

        <div
          style={{
            maxWidth: "720px",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "#ede9fe",
          }}
        >
          ManifiX AI delivers affordable mental health support,
          mindfulness, breathing, stress relief, and emotional wellness
          tools globally — including offline-first LMIC access.
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/app/magic16")}
            style={{
              background: "#fff",
              color: "#4c1d95",
              border: "none",
              padding: "14px 20px",
              borderRadius: "16px",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            🧘 Start Mental Session
          </button>

          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: "16px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            💬 AI Therapy
          </button>
        </div>
      </div>

      {/* LIVE TIP */}

      <div
        style={{
          background: "#0f0f1a",
          border: "1px solid #1e1b4b",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "0.2em",
            color: "#6d28d9",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          AI Wellness Insight
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#ddd6fe",
          }}
        >
          {TIPS[tipIndex]}
        </div>
      </div>

      {/* FEATURES */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              background: "#0b0b12",
              border: "1px solid #18181b",
              borderRadius: "22px",
              padding: "24px",
              transition: "0.2s",
            }}
          >
            <div
              style={{
                fontSize: "42px",
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
          { value: "970M", label: "Mental disorders globally" },
          { value: "67%", label: "Workers burned out" },
          { value: "75%", label: "LMIC no treatment access" },
          { value: "30%", label: "Stress reduction possible" },
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

      {/* MODULES */}

      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "0.22em",
            color: "#52525b",
            textTransform: "uppercase",
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
        ManifiX AI · Mental Health · WHO SDG 3.4
      </div>
    </div>
  );
}
