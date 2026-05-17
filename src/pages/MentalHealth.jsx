import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD PALETTE
════════════════════════════════════════════════════════════ */
const ACC     = "#D4AF37";
const ACCDIM  = "#B8941F";
const ACCGLOW = "rgba(212,175,55,0.08)";
const BG      = "#050505";
const CARD    = "#080605";
const BORDER  = "#1a1508";
const GRID    = "rgba(212,175,55,0.012)";
const GOLD_GRAD = "linear-gradient(135deg,#1a1408,#D4AF37)";
const PROG_GRAD = "linear-gradient(90deg,#1a1408,#8B6914,#D4AF37)";
const TEXT_MAIN = "#F5E6C8";
const TEXT_DIM  = "#5a4a20";
const TEXT_MUTED = "#3a2e14";

/* ════════════════════════════════════════════════════════════
   CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("mentalcss")) return;
  const el = document.createElement("style");
  el.id = "mentalcss";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.10;transform:scale(1.06)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes scanline{from{top:-2px}to{top:100%}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(212,175,55,0)}50%{box-shadow:0 0 40px rgba(212,175,55,0.15)}}
    .fu{animation:fu .45s cubic-bezier(.22,.68,0,1.2) both}
    .sl-btn:hover{filter:brightness(1.15);transform:translateY(-1px);transition:all .16s}
    .sl-btn:active{transform:translateY(0)}
    .ghost:hover{border-color:#2a2010!important;color:#5a4a20!important;transition:all .16s}
    .glow-card:hover{animation:glow 3s ease-in-out infinite}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:${ACC}30;color:${TEXT_MAIN}}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   MANIFIX MODULES
════════════════════════════════════════════════════════════ */
const MANIFIX_MODULES = [
  { id:"mental",    icon:"🧠", label:"Mental",    stat:"970M affected",   result:"Calm in 30d",    route:"/app/mental",    color:"#D4AF37" },
  { id:"sleep",     icon:"😴", label:"Sleep",     stat:"45% deprived",    result:"8h deep sleep",  route:"/app/sleep",     color:"#C4A35A" },
  { id:"nutrition", icon:"🍎", label:"Nutrition", stat:"1B obese adults", result:"−8kg in 2mo",    route:"/app/nutrition", color:"#E8C84A" },
  { id:"stress",    icon:"😓", label:"Stress",    stat:"67% burned out",  result:"Level 9→3",      route:"/app/stress",    color:"#B8941F" },
  { id:"chronic",   icon:"🫀", label:"Chronic",   stat:"422M diabetics",  result:"Risk ↓40%",      route:"/app/chronic",   color:"#F0D060" },
  { id:"women",     icon:"👩", label:"Women",     stat:"PCOS · hormones", result:"Symptoms ↓",     route:"/app/women",     color:"#D4AF37" },
  { id:"elderly",   icon:"👴", label:"Elderly",   stat:"Family health",   result:"Connected daily", route:"/app/elderly",   color:"#C4A35A" },
  { id:"meds",      icon:"💊", label:"Meds",      stat:"50% non-adherent",result:"0 missed/60d",   route:"/app/medication",color:"#B8941F" },
  { id:"children",  icon:"🧒", label:"Children",  stat:"81% teens inactive",result:"Growth tracked",route:"/app/children",  color:"#E8C84A" },
  { id:"prevent",   icon:"🏃", label:"Preventive",stat:"SDG 3.8 equity",  result:"Score 45→87",    route:"/app/preventive",color:"#F0D060" },
];

/* ════════════════════════════════════════════════════════════
   MENTAL HEALTH DATA
════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon:"🧘", title:"AI Meditation", desc:"Guided breathing & mindfulness sessions", route:"/app/meditation" },
  { icon:"💬", title:"24/7 AI Therapy", desc:"Talk anytime with emotional AI support", route:"/app/therapy" },
  { icon:"📊", title:"Mood Analytics", desc:"Track stress, focus, anxiety & calm levels", route:"/app/mood" },
  { icon:"🎧", title:"Calm Audio", desc:"Sleep sounds & mental recovery audio", route:"/app/audio" },
  { icon:"⚡", title:"Stress Relief", desc:"5-minute burnout recovery routines", route:"/app/stress-relief" },
  { icon:"🌍", title:"Global Access", desc:"Offline-first mental care for everyone", route:"/app/global" },
];

const TIPS = [
  "Deep breathing reduces cortisol levels by 23%",
  "8 minutes meditation improves focus significantly",
  "Daily movement lowers depression risk by 26%",
  "Sleep quality directly impacts mental health",
  "Mindfulness reduces burnout symptoms by 30%",
  "Gratitude journaling rewires neural pathways",
  "Nature exposure decreases amygdala activity",
  "Cold showers boost norepinephrine 5×",
];

const STATS = [
  { value:"970M", label:"Mental disorders globally" },
  { value:"67%",  label:"Workers burned out" },
  { value:"75%",  label:"LMIC no treatment access" },
  { value:"30%",  label:"Stress reduction possible" },
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */
export default function MentalHealth() {
  const navigate = useNavigate();
  const [tipIndex, setTipIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTip, setActiveTip] = useState(0);
  const tipTimerRef = useRef(null);

  useEffect(() => {
    injectCSS();
  }, []);

  useEffect(() => {
    tipTimerRef.current = setInterval(() => {
      setTipIndex((p) => (p + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(tipTimerRef.current);
  }, []);

  const module = useMemo(
    () => MANIFIX_MODULES.find((m) => m.id === "mental"),
    []
  );

  const navigateTo = useCallback((route) => {
    if (route) navigate(route);
  }, [navigate]);

  return (
    <div style={{ minHeight:"100dvh", background:BG, color:TEXT_MAIN, fontFamily:"'JetBrains Mono','Courier New',monospace, display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden", position:"relative" }}>

      {/* BG grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`, backgroundSize:"44px 44px" }} />

      {/* Ambient glow */}
      <div style={{ position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)", width:440, height:220, background:`radial-gradient(ellipse,${ACC}08 0%,transparent 70%)`, animation:"pulse 5s ease-in-out infinite", pointerEvents:"none" }} />

      {/* Corners */}
      {[{top:13,left:13,borderTopWidth:2,borderLeftWidth:2},{top:13,right:13,borderTopWidth:2,borderRightWidth:2},{bottom:13,left:13,borderBottomWidth:2,borderLeftWidth:2},{bottom:13,right:13,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{ position:"fixed", width:20, height:20, borderColor:ACC, borderStyle:"solid", borderWidth:0, opacity:.2, pointerEvents:"none", ...pos }} />
      ))}

      {/* WHO Ticker */}
      <div style={{ width:"100%", overflow:"hidden", whiteSpace:"nowrap", borderTop:`1px solid ${BORDER}20`, borderBottom:`1px solid ${BORDER}20`, padding:"5px 0", background:"#030200" }}>
        <span style={{ display:"inline-block", animation:"ticker 60s linear infinite", fontSize:7, letterSpacing:".1em", color:TEXT_MUTED, textTransform:"uppercase" }}>
          {["970M people live with mental disorders","67% of workers experience burnout","1 in 4 people affected annually","Mental health investment yields 4:1 return","ManifiX AI — Mental wellness for all","SDG 3.4 — Mental health and wellbeing","Offline-first care for LMICs","30-day calm transformation program"].join("   ·   ").repeat(2)}
        </span>
      </div>

      {/* MAIN WRAPPER */}
      <div style={{ position:"relative", zIndex:2, width:"min(460px,96vw)", display:"flex", flexDirection:"column", gap:10, paddingTop:16, paddingBottom:52 }}>

        {/* ─── HEADER ─── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:12, borderBottom:`1px solid ${BORDER}30` }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, letterSpacing:"-.02em", lineHeight:1, color:TEXT_MAIN }}>
              MENTAL<span style={{ color:ACC }}>AI</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:400, color:`${ACC}25`, letterSpacing:".1em", marginLeft:8, verticalAlign:"middle" }}>× ManifiX</span>
            </div>
            <div style={{ fontSize:7, letterSpacing:".2em", color:`${ACC}60`, textTransform:"uppercase", marginTop:4 }}>
              Mental Health Platform · WHO SDG 3.4
            </div>
          </div>
          <button onClick={() => navigate("/app/dashboard")} className="ghost"
            style={{ background:"none", border:`1px solid ${BORDER}40`, color:TEXT_MUTED, cursor:"pointer", fontFamily:"inherit", padding:"8px 12px", fontSize:7, letterSpacing:".14em", textTransform:"uppercase" }}>
            ← Back
          </button>
        </div>

        {/* ─── HERO ─── */}
        <div className="fu glow-card" style={{ background:`linear-gradient(135deg,#0a0806 0%, #1a1408 50%, #2a2010 100%)`, border:`1px solid ${ACC}15`, padding:"28px", marginBottom:4, position:"relative", overflow:"hidden", borderRadius:0 }}>
          <div style={{ position:"absolute", right:"-50px", top:"-50px", width:"180px", height:"180px", borderRadius:"50%", background:`radial-gradient(circle,${ACC}08 0%,transparent 70%)` }} />
          <div style={{ position:"absolute", left:"20px", bottom:"20px", width:"40px", height:"40px", border:`1px solid ${ACC}10`, transform:"rotate(45deg)" }} />
          
          <div style={{ fontSize:7, letterSpacing:".18em", color:`${ACC}80`, textTransform:"uppercase", marginBottom:12, fontFamily:"'JetBrains Mono',monospace" }}>
            WHO Mental Health Crisis
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:900, lineHeight:1, marginBottom:14 }}>
            970M<span style={{ color:ACC }}> People</span>
            <br />
            <span style={{ fontSize:28, color:`${ACC}90`, fontWeight:700 }}>Need Support</span>
          </div>
          <div style={{ maxWidth:"360px", fontSize:9, lineHeight:1.8, color:TEXT_DIM, letterSpacing:".04em", marginBottom:20 }}>
            ManifiX AI delivers affordable mental health support, mindfulness, breathing, stress relief, and emotional wellness tools globally — including offline-first LMIC access.
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button className="sl-btn" onClick={() => navigateTo("/app/magic16")}
              style={{ background:ACC, color:"#050300", border:"none", padding:"14px 20px", fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer" }}>
              🧘 Start Session
            </button>
            <button className="ghost" onClick={() => navigateTo("/app/therapy")}
              style={{ background:"transparent", border:`1px solid ${BORDER}50`, color:TEXT_DIM, padding:"14px 20px", fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer" }}>
              💬 AI Therapy
            </button>
          </div>
        </div>

        {/* ─── LIVE TIP ─── */}
        <div className="fu" style={{ background:ACC, color:"#050300", padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:14 }}>💡</div>
          <div>
            <div style={{ fontSize:7, letterSpacing:".2em", textTransform:"uppercase", opacity:.7, marginBottom:4 }}>AI Wellness Insight</div>
            <div style={{ fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{TIPS[tipIndex]}</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
            {TIPS.map((_, i) => (
              <div key={i} style={{ width:6, height:6, borderRadius:"50%", background: i===tipIndex?"#050300":"#2a2010", transition:"all .3s" }} />
            ))}
          </div>
        </div>

        {/* ─── FEATURES ─── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="fu sl-btn" style={{ background:CARd, border:`1px solid ${hoveredCard===i?`${ACC}30`:`${BORDER}30`}`, padding:"18px 14px", cursor:"pointer", animationDelay:`${i*40}ms`, transition:"all .16s" }}
              onMouseEnter={() => setHoveredCard(i)} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ fontSize:28, marginBottom:10, animation:hoveredCard===i?"float 2s ease-in-out infinite":"none" }}>{f.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, marginBottom:6, color:hoveredCard===i?ACC:TEXT_MAIN }}>{f.title}</div>
              <div style={{ fontSize:8, lineHeight:1.7, color:TEXT_DIM, letterSpacing:".04em" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* ─── STATS ─── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="fu" style={{ background:CARd, border:`1px solid ${BORDER}20`, padding:"18px 14px", animationDelay:`${i*40}ms` }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:900, color:ACC, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:8, color:TEXT_DIM, lineHeight:1.6, letterSpacing:".04em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ─── MODULES ─── */}
        <div className="fu" style={{ marginTop:8 }}>
          <div style={{ fontSize:7, letterSpacing:".22em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:10 }}>
            Explore All ManifiX Modules
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
            {MANIFIX_MODULES.map((m, i) => (
              <button key={m.id} className="sl-btn" onClick={() => navigateTo(m.route)}
                style={{ background:CARd, border:`1px solid ${BORDER}20`, padding:"16px 12px", cursor:"pointer", color:TEXT_MAIN, textAlign:"left", animationDelay:`${i*30}ms`, display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:20 }}>{m.icon}</span>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11 }}>{m.label}</div>
                </div>
                <div style={{ fontSize:7, color:TEXT_DIM }}>{m.stat}</div>
                <div style={{ fontSize:8, color:ACC, fontWeight:700, letterSpacing:".08em" }}>{m.result}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div style={{ textAlign:"center", fontSize:6, letterSpacing:".16em", color:"#1a1408", textTransform:"uppercase", paddingTop:4 }}>
          ManifiX AI · Mental Health · WHO SDG 3.4 · Offline-first · 20 languages
        </div>

      </div>

    </div>
  );
}
