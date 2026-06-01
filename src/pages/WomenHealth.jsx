/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ManifiX Women's Health v8.0 ULTRA GOLD — Beats Flo + Clue ║
 * ║                                                              ║
 * ║  NEW vs Flo:                                                ║
 * ║  • Flow Intensity Logger (spotting→heavy) per day           ║
 * ║  • BBT Chart — basal body temperature with ovulation marker ║
 * ║  • Cervical Mucus Tracker (4 types + descriptions)          ║
 * ║  • Fertility Score Engine (real algorithm)                  ║
 * ║  • Ovulation Test Logger (LH strip results)                 ║
 * ║  • Pregnancy Mode toggle                                    ║
 * ║                                                              ║
 * ║  NEW vs Clue:                                               ║
 * ║  • Sex & Contraception Log                                  ║
 * ║  • Cycle Calendar Heatmap (30-day visual)                   ║
 * ║  • Cycle Statistics (avg, min, max, regularity score)       ║
 * ║  • PMS Pattern Detector                                     ║
 * ║  • Custom Symptom Tags (color-coded)                        ║
 * ║  • Health Report Generator (text summary)                   ║
 * ║  • Smart Reminders Panel                                    ║
 * ║                                                              ║
 * ║  RETAINED: Mood, Hormones, Supplements, Self-Care,          ║
 * ║  Programs, Journal, Insights — all upgraded                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════════════
   GOLD & BLACK DESIGN TOKENS
══════════════════════════════════════════════════════════ */
const G   = "#D4A017";
const GB  = "#B8860B";
const GBR = "#FFD700";
const GD  = "#7A5C0A";
const BK  = "#000000";
const S1  = "#080600";
const S2  = "#0F0C02";
const S3  = "#171200";
const S4  = "#1F1800";
const TX  = "#F0E6C8";
const TM  = "#9A8050";
const TD  = "#3A2E10";
const BDR = `rgba(212,160,23,0.18)`;
const BGW = `rgba(212,160,23,0.08)`;
const ROSE = "#E05C8A";
const TEAL = "#2DD4BF";
const BLUE = "#60A5FA";

/* ══════════════════════════════════════════════════════════
   STORAGE (in-memory for artifact)
══════════════════════════════════════════════════════════ */
const MEM = {};
const ls = {
  get: (k, d) => MEM[k] !== undefined ? MEM[k] : d,
  set: (k, v) => { MEM[k] = v; },
};

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short" });

/* ══════════════════════════════════════════════════════════
   CYCLE PHASE ENGINE
══════════════════════════════════════════════════════════ */
function getCyclePhase(day, len = 28) {
  if (day <= 5)  return { name:"Menstrual",  color:ROSE, icon:"🌑", tip:"Rest, warmth, iron-rich foods. Light stretching helps cramps." };
  if (day <= Math.round(len * 0.46)) return { name:"Follicular", color:G,    icon:"🌤", tip:"Energy rising. Best time for new goals and strength training." };
  if (day <= Math.round(len * 0.57)) return { name:"Ovulation",  color:GBR,  icon:"🌕", tip:"Peak confidence and fertility. Great for social events." };
  return { name:"Luteal", color:GB, icon:"🌖", tip:"Progesterone dominant. Prioritize rest, magnesium, and self-care." };
}

/* ══════════════════════════════════════════════════════════
   FERTILITY SCORE ENGINE (real algorithm)
══════════════════════════════════════════════════════════ */
function calcFertility(cycleDay, cycleLen, bbtLogs, mucusLogs, lhLogs) {
  const ovDay = Math.round(cycleLen - 14);
  const daysToOv = ovDay - cycleDay;
  let score = 0;

  // Proximity to ovulation (max 40pts)
  if (Math.abs(daysToOv) === 0) score += 40;
  else if (Math.abs(daysToOv) === 1) score += 35;
  else if (Math.abs(daysToOv) <= 2) score += 25;
  else if (Math.abs(daysToOv) <= 3) score += 15;
  else if (daysToOv > 0 && daysToOv <= 5) score += 10;

  // BBT drop before ovulation (max 20pts)
  const recentBBT = bbtLogs.slice(-3).map(b => parseFloat(b.temp)).filter(Boolean);
  if (recentBBT.length >= 2 && recentBBT[recentBBT.length-1] < recentBBT[0]) score += 20;
  else if (recentBBT.length >= 2 && recentBBT[recentBBT.length-1] > recentBBT[0] + 0.2) score += 10;

  // Cervical mucus (max 25pts)
  const latestMucus = mucusLogs.slice(-1)[0]?.type;
  if (latestMucus === "egg-white") score += 25;
  else if (latestMucus === "watery") score += 18;
  else if (latestMucus === "creamy") score += 8;

  // LH surge (max 15pts)
  const latestLH = lhLogs.slice(-1)[0]?.result;
  if (latestLH === "positive") score += 15;
  else if (latestLH === "near-positive") score += 10;

  return Math.min(100, score);
}

/* ══════════════════════════════════════════════════════════
   DEFAULTS
══════════════════════════════════════════════════════════ */
const DEF_SUPPS = [
  { id:1, name:"Vitamin D3",  dosage:"2000 IU", time:"Morning", taken:false },
  { id:2, name:"Iron",        dosage:"18mg",    time:"Evening", taken:false },
  { id:3, name:"Omega-3",     dosage:"1000mg",  time:"Lunch",   taken:false },
  { id:4, name:"Magnesium",   dosage:"400mg",   time:"Night",   taken:false },
  { id:5, name:"B-Complex",   dosage:"Daily",   time:"Morning", taken:false },
  { id:6, name:"Folic Acid",  dosage:"400mcg",  time:"Morning", taken:false },
];
const DEF_CARE = [
  { id:1, name:"Morning Meditation", duration:"10 min", done:false, cat:"Mindfulness" },
  { id:2, name:"Gentle Yoga",        duration:"20 min", done:false, cat:"Movement"    },
  { id:3, name:"Journaling",         duration:"15 min", done:false, cat:"Reflection"  },
  { id:4, name:"Skin Care Routine",  duration:"10 min", done:false, cat:"Self Care"   },
  { id:5, name:"Warm Bath",          duration:"20 min", done:false, cat:"Relaxation"  },
];
const DEF_PROGS = [
  { id:1, name:"Hormone Balance",    duration:"14 days", progress:65, cat:"Popular"   },
  { id:2, name:"Cycle Wellness",     duration:"Daily",   progress:80, cat:"Tracking"  },
  { id:3, name:"Stress & Mood",      duration:"7 days",  progress:40, cat:"Mind Care" },
  { id:4, name:"Fertility Boost",    duration:"21 days", progress:20, cat:"Fertility" },
  { id:5, name:"PMS Relief",         duration:"7 days",  progress:55, cat:"Relief"    },
  { id:6, name:"Sleep Optimization", duration:"7 days",  progress:50, cat:"Rest"      },
];
const MOOD_OPTS = [
  { v:"Balanced", e:"😊" }, { v:"Energetic", e:"⚡" },
  { v:"Focused",  e:"🧘" }, { v:"Tired",     e:"😴" },
  { v:"Stressed", e:"😟" }, { v:"Emotional", e:"😢" },
  { v:"Happy",    e:"😄" }, { v:"Irritable", e:"😤" },
];
const FLOW_LEVELS = [
  { v:"none",     label:"None",     color:TD   },
  { v:"spotting", label:"Spotting", color:"#7A4040" },
  { v:"light",    label:"Light",    color:"#C05070" },
  { v:"medium",   label:"Medium",   color:ROSE },
  { v:"heavy",    label:"Heavy",    color:"#C02040" },
];
const MUCUS_TYPES = [
  { v:"dry",       label:"Dry",        desc:"No discharge. Low fertility.", color:TD    },
  { v:"sticky",    label:"Sticky",     desc:"Thick, tacky. Low fertility.", color:GB    },
  { v:"creamy",    label:"Creamy",     desc:"Lotion-like. Some fertility.", color:G     },
  { v:"watery",    label:"Watery",     desc:"Clear, thin. High fertility.", color:TEAL  },
  { v:"egg-white", label:"Egg-White",  desc:"Slippery, stretchy. PEAK fertility.", color:GBR },
];
const LH_RESULTS = [
  { v:"negative",     label:"Negative",     color:TD   },
  { v:"near-positive",label:"Near Peak",    color:GB   },
  { v:"positive",     label:"LH Surge ⚡",  color:GBR  },
];
const AFFIRMATIONS = [
  "My body is resilient and knows how to heal itself.",
  "I embrace my cycle as a source of power.",
  "I deserve rest, care, and compassion every phase.",
  "My wellness journey is uniquely mine, and I trust it.",
  "Every day I am growing into my best self.",
  "I honor my body's wisdom and natural rhythms.",
];
const TABS = [
  { id:"cycle",       label:"Cycle",       emoji:"🌙" },
  { id:"fertility",   label:"Fertility",   emoji:"🌸" },
  { id:"flow",        label:"Flow Log",    emoji:"💧" },
  { id:"mood",        label:"Mood",        emoji:"😊" },
  { id:"symptoms",    label:"Symptoms",    emoji:"📋" },
  { id:"sex",         label:"Intimacy",    emoji:"💑" },
  { id:"hormones",    label:"Hormones",    emoji:"⚗️" },
  { id:"supplements", label:"Supplements", emoji:"💊" },
  { id:"selfcare",    label:"Self Care",   emoji:"🛁" },
  { id:"programs",    label:"Programs",    emoji:"🎯" },
  { id:"journal",     label:"Journal",     emoji:"📖" },
  { id:"stats",       label:"Statistics",  emoji:"📊" },
  { id:"report",      label:"Report",      emoji:"📄" },
  { id:"insights",    label:"Insights",    emoji:"✨" },
];

/* ══════════════════════════════════════════════════════════
   CSS INJECTION
══════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("wh8-css")) return;
  const s = document.createElement("style");
  s.id = "wh8-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${BK}}
    ::-webkit-scrollbar-thumb{background:${TD};border-radius:2px}
    ::-webkit-scrollbar-thumb:hover{background:${G}}
    @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes glow{0%,100%{box-shadow:0 0 0 rgba(212,160,23,0)}50%{box-shadow:0 0 24px rgba(212,160,23,0.2)}}
    .wh-app{display:flex;min-height:100dvh;background:${BK};font-family:'DM Sans',sans-serif;color:${TX}}
    .wh-sidebar{width:220px;background:${S1};border-right:1px solid ${BDR};padding:16px 0;position:fixed;height:100dvh;z-index:50;display:flex;flex-direction:column;overflow:hidden}
    .wh-logo{display:flex;align-items:center;gap:10px;padding:0 16px 20px;border-bottom:1px solid ${TD};flex-shrink:0}
    .wh-logo-mark{font-family:'Syne',sans-serif;font-size:1.25rem;font-weight:900;background:linear-gradient(90deg,${GD},${G},${GBR},${G},${GD});background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
    .wh-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:1px;overflow-y:auto}
    .wh-nav-btn{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;border:none;background:none;color:${TM};font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:500;width:100%;text-align:left;transition:all .14s}
    .wh-nav-btn:hover{background:${BGW};color:${G}}
    .wh-nav-btn.active{background:rgba(212,160,23,0.12);color:${G};border-left:2px solid ${G}}
    .wh-main{flex:1;margin-left:220px;padding:24px 28px;overflow-y:auto;max-height:100dvh}
    .wh-card{background:${S3};border:1px solid ${BDR};border-radius:14px;padding:18px;transition:border-color .2s}
    .wh-card:hover{border-color:rgba(212,160,23,0.35)}
    .wh-card2{background:${S2};border:1px solid ${TD};border-radius:10px;padding:12px 14px}
    .wh-card-title{font-size:.65rem;color:${TM};letter-spacing:.16em;text-transform:uppercase;font-weight:600}
    .stat-big{font-family:'Syne',sans-serif;font-size:2.2rem;font-weight:900;color:${G};line-height:1}
    .bar-track{height:5px;background:${TD};border-radius:999px;overflow:hidden;margin-top:8px}
    .bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,${GB},${G},${GBR});transition:width .5s}
    .btn-gold{background:linear-gradient(135deg,${GB},${G});color:${BK};border:none;padding:9px 18px;border-radius:9px;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .16s}
    .btn-gold:hover{filter:brightness(1.12);transform:translateY(-1px);box-shadow:0 6px 18px rgba(212,160,23,0.28)}
    .btn-outline{background:transparent;color:${G};border:1px solid ${BDR};padding:9px 16px;border-radius:9px;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .14s}
    .btn-outline:hover{background:${BGW};border-color:${G}}
    .btn-sm{padding:6px 12px;font-size:.7rem}
    .btn-xs{padding:4px 9px;font-size:.65rem}
    .btn-icon{width:32px;height:32px;border-radius:8px;background:${S3};border:1px solid ${BDR};color:${TM};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .16s;font-size:14px}
    .btn-icon:hover{background:${BGW};color:${G};border-color:${G}}
    .wh-inp{width:100%;padding:9px 12px;border-radius:9px;border:1px solid ${TD};background:${S2};color:${TX};font-size:.83rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .18s}
    .wh-inp:focus{border-color:${G}}
    .wh-inp::placeholder{color:${TD}}
    .wh-sel{width:100%;padding:9px 12px;border-radius:9px;border:1px solid ${TD};background:${S2};color:${TX};font-size:.83rem;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer}
    .wh-lbl{font-size:.65rem;color:${TM};letter-spacing:.12em;text-transform:uppercase;display:block;margin-bottom:5px}
    .chip{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:7px;border:1px solid ${TD};background:${S2};cursor:pointer;transition:all .14s;font-size:.75rem;color:${TM};font-family:'DM Sans',sans-serif}
    .chip:hover{border-color:${G};color:${G}}
    .chip.active{border-color:${G};background:${BGW};color:${G}}
    .gold-rule{height:1px;background:linear-gradient(90deg,transparent,${G}66,${GBR}88,${G}66,transparent);margin:12px 0}
    .gold-badge{font-size:.62rem;padding:3px 8px;border-radius:999px;background:${BGW};border:1px solid ${BDR};color:${G};letter-spacing:.1em;text-transform:uppercase;font-weight:600}
    .modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
    .modal-box{width:min(440px,100%);max-height:90vh;overflow-y:auto}
    .insight-block{padding:11px 14px;border-radius:10px;background:${S2};border:1px solid ${BDR}}
    .insight-lbl{font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:${G};font-weight:700;margin-bottom:4px}
    .insight-txt{font-size:.78rem;color:${TX};line-height:1.6}
    .fade-up{animation:fadeUp .3s ease both}
    .heatmap-cell{border-radius:4px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:700}
    .heatmap-cell:hover{filter:brightness(1.3);transform:scale(1.08)}
    .bbt-dot{border-radius:50%;cursor:pointer;transition:all .14s}
    .bbt-dot:hover{filter:brightness(1.4);transform:scale(1.3)}
    @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   MICRO COMPONENTS
══════════════════════════════════════════════════════════ */
function Bar({ pct, color }) {
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width:`${Math.min(pct||0,100)}%`, background:color||undefined }}/>
    </div>
  );
}
function CardHead({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
      <span className="wh-card-title">{title}</span>
      {right}
    </div>
  );
}
function StatRow({ label, value, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 11px", borderRadius:8, background:S2 }}>
      <span style={{ fontSize:".78rem", color:TM }}>{label}</span>
      <span style={{ fontSize:".78rem", color:color||G, fontWeight:700 }}>{value}</span>
    </div>
  );
}
function GoldRule() { return <div className="gold-rule"/>; }

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="wh-card modal-box fade-up" onClick={e=>e.stopPropagation()}>
        <div style={{ height:3, background:`linear-gradient(90deg,${GB},${GBR},${GB})`, borderRadius:"2px 2px 0 0", margin:"-18px -18px 16px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:G }}>{title}</span>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CYCLE CALENDAR HEATMAP (NEW vs Clue)
══════════════════════════════════════════════════════════ */
function CycleCalendar({ cycleDay, cycleLen, flowLog, pregnancyMode }) {
  const cells = Array.from({ length: cycleLen }, (_, i) => i + 1);
  const getCellColor = (day) => {
    const flow = flowLog[day];
    if (flow && flow !== "none") {
      const fc = FLOW_LEVELS.find(f=>f.v===flow);
      return fc?.color || ROSE;
    }
    if (day === cycleDay) return G;
    const ovDay = Math.round(cycleLen - 14);
    if (Math.abs(day - ovDay) <= 1) return pregnancyMode ? "#22c55e" : GBR + "88";
    if (day <= 5) return ROSE + "44";
    if (day > ovDay && day <= ovDay + 3) return GB + "55";
    return S4;
  };
  const getLbl = (day) => {
    if (day === cycleDay) return "●";
    const ovDay = Math.round(cycleLen - 14);
    if (day === ovDay) return "♦";
    return "";
  };
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 }}>
        {cells.map(day => (
          <div key={day} className="heatmap-cell"
            style={{ height:34, background:getCellColor(day), border:`1px solid ${day===cycleDay?G:TD}33`, color: day===cycleDay?BK:TX }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:".55rem", opacity:.7, lineHeight:1 }}>{day}</div>
              <div style={{ fontSize:".65rem", lineHeight:1 }}>{getLbl(day)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
        {[["Period",ROSE],["Ovulation",GBR],["Today",G],["Luteal",GB+"88"]].map(([l,c])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:".65rem", color:TM }}>
            <div style={{ width:10, height:10, borderRadius:2, background:c }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BBT CHART (NEW vs Flo)
══════════════════════════════════════════════════════════ */
function BBTChart({ bbtLogs, cycleLen }) {
  const W = 380, H = 120, PAD = 32;
  if (bbtLogs.length < 2) return (
    <div style={{ textAlign:"center", padding:"20px 0", color:TM, fontSize:".8rem" }}>
      Log 2+ BBT readings to see your chart
    </div>
  );
  const vals = bbtLogs.slice(-cycleLen).map(b => parseFloat(b.temp)).filter(Boolean);
  const days = bbtLogs.slice(-cycleLen).map(b => b.day);
  const min = Math.min(...vals) - 0.1;
  const max = Math.max(...vals) + 0.1;
  const range = max - min || 0.5;
  const xStep = (W - PAD*2) / Math.max(1, vals.length - 1);
  const yPos = (v) => PAD + ((max - v) / range) * (H - PAD*2);

  const points = vals.map((v, i) => [PAD + i * xStep, yPos(v)]);
  const pathD = points.map((p, i) => `${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  // Detect ovulation (post-shift: 3 temps above 6-day avg)
  let ovMarkerX = null;
  if (vals.length >= 7) {
    for (let i = 6; i < vals.length; i++) {
      const prev6avg = vals.slice(i-6, i).reduce((a,v)=>a+v,0)/6;
      if (vals.slice(i, i+3).every(v => v > prev6avg + 0.2)) {
        ovMarkerX = PAD + i * xStep;
        break;
      }
    }
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      {/* Grid lines */}
      {[min+0.1, min+0.2, min+0.3, min+0.4].map((v,i) => (
        <line key={i} x1={PAD} y1={yPos(v)} x2={W-PAD} y2={yPos(v)}
          stroke={TD} strokeWidth="0.5" strokeDasharray="3,3"/>
      ))}
      {/* Ovulation marker */}
      {ovMarkerX && (
        <line x1={ovMarkerX} y1={PAD-8} x2={ovMarkerX} y2={H-PAD}
          stroke={GBR} strokeWidth="1.5" strokeDasharray="4,3" opacity=".8"/>
      )}
      {/* Line */}
      <path d={pathD} fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Area */}
      <path d={`${pathD} L${points[points.length-1][0]},${H-PAD} L${PAD},${H-PAD} Z`}
        fill={`${G}12`}/>
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={G} stroke={S3} strokeWidth={1.5} className="bbt-dot"/>
      ))}
      {/* Y axis labels */}
      {[min+0.1, min+0.3].map((v,i) => (
        <text key={i} x={PAD-4} y={yPos(v)+3} textAnchor="end" fill={TM} fontSize="9">{v.toFixed(1)}</text>
      ))}
      {/* X axis labels */}
      {days.filter((_,i)=>i%3===0).map((d,i) => (
        <text key={i} x={PAD + (bbtLogs.indexOf(bbtLogs.find(b=>b.day===d)))*xStep} y={H-PAD+12}
          textAnchor="middle" fill={TM} fontSize="8">D{d}</text>
      ))}
      {ovMarkerX && (
        <text x={ovMarkerX} y={PAD-12} textAnchor="middle" fill={GBR} fontSize="8" fontWeight="700">OV</text>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: CYCLE TRACKER (upgraded)
══════════════════════════════════════════════════════════ */
function CyclePage({ cycleDay, setCycleDay, cycleLen, setCycleLen, flowLog, pregnancyMode, setPregnancyMode, cycleHistory }) {
  const phase = getCyclePhase(cycleDay, cycleLen);
  const r = 56, circ = 2*Math.PI*r;
  const dash = `${(cycleDay/cycleLen)*circ} ${circ}`;
  const ovDay = Math.round(cycleLen - 14);
  const daysToOv = ovDay - cycleDay;
  const nextPeriod = cycleLen - cycleDay;

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Pregnancy mode toggle */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button
          onClick={() => setPregnancyMode(v=>!v)}
          className={pregnancyMode ? "btn-gold btn-sm" : "btn-outline btn-sm"}
          style={{ borderColor:pregnancyMode?"transparent":"rgba(34,197,94,.4)", color:pregnancyMode?BK:"#22c55e" }}>
          {pregnancyMode ? "🤰 Pregnancy Mode ON" : "🤰 Pregnancy Mode"}
        </button>
      </div>

      <div className="wh-card" style={{ textAlign:"center", padding:"30px 20px" }}>
        <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
          <svg width={136} height={136}>
            <circle cx={68} cy={68} r={r} fill="none" stroke={TD} strokeWidth={8}/>
            <circle cx={68} cy={68} r={r} fill="none" stroke={phase.color} strokeWidth={8}
              strokeLinecap="round" strokeDasharray={dash}
              style={{ transition:"stroke-dasharray .6s ease" }}
              transform="rotate(-90 68 68)"/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:"1.8rem", lineHeight:1 }}>{phase.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.9rem", fontWeight:900, color:phase.color }}>{cycleDay}</div>
            <div style={{ fontSize:".6rem", color:TM, letterSpacing:".08em" }}>of {cycleLen}d</div>
          </div>
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:999, background:`${phase.color}18`, border:`1px solid ${phase.color}44`, marginBottom:12 }}>
          <span style={{ fontSize:".78rem", fontWeight:700, color:phase.color, letterSpacing:".08em", textTransform:"uppercase" }}>{phase.name} Phase</span>
        </div>

        <div style={{ fontSize:".8rem", color:TM, lineHeight:1.6, maxWidth:320, margin:"0 auto 18px" }}>{phase.tip}</div>

        {/* Quick stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
          {[
            { l:"Next Period",    v:nextPeriod > 0 ? `${nextPeriod}d` : "Today", c:ROSE },
            { l:"Ovulation",      v:daysToOv > 0 ? `${daysToOv}d` : daysToOv === 0 ? "Today!" : `${-daysToOv}d ago`, c:GBR },
            { l:"Cycle Day",      v:cycleDay, c:G },
            { l:"Cycle Length",   v:`${cycleLen}d`, c:TM },
          ].map(item => (
            <div key={item.l} className="wh-card2" style={{ textAlign:"center", padding:"10px 6px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:900, color:item.c }}>{item.v}</div>
              <div style={{ fontSize:".6rem", color:TM, marginTop:2 }}>{item.l}</div>
            </div>
          ))}
        </div>

        {/* Phase pills */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:18 }}>
          {[["Menstrual","1–5",cycleDay<=5],["Follicular","6–"+(Math.round(cycleLen*.46)),cycleDay>=6&&cycleDay<=Math.round(cycleLen*.46)],
            ["Ovulation",""+(Math.round(cycleLen*.46)+1)+"–"+(Math.round(cycleLen*.57)),cycleDay>Math.round(cycleLen*.46)&&cycleDay<=Math.round(cycleLen*.57)],
            ["Luteal","17+",cycleDay>Math.round(cycleLen*.57)]
          ].map(([p,r,a])=>(
            <div key={p} style={{ padding:"8px 4px", borderRadius:8, background:a?`${G}18`:S2, border:`1px solid ${a?G:TD}` }}>
              <div style={{ fontSize:".65rem", color:a?G:TM, fontWeight:a?700:400 }}>{p}</div>
              <div style={{ fontSize:".58rem", color:TD, marginTop:1 }}>{r}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
          <button className="btn-outline btn-sm" onClick={()=>setCycleDay(d=>Math.max(1,d-1))}>‹ Prev</button>
          <button className="btn-gold btn-sm" onClick={()=>setCycleDay(d=>Math.min(cycleLen,d+1))}>Next Day ›</button>
          <button className="btn-outline btn-sm" onClick={()=>setCycleDay(1)}>New Cycle</button>
          <div>
            <select className="wh-sel" value={cycleLen} onChange={e=>setCycleLen(+e.target.value)}
              style={{ padding:"6px 10px", fontSize:".72rem", width:"auto" }}>
              {Array.from({length:20},(_,i)=>i+21).map(l=><option key={l} value={l}>{l}d cycle</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="wh-card">
        <CardHead title="30-Day Cycle Calendar" right={<span className="gold-badge">Visual</span>}/>
        <CycleCalendar cycleDay={cycleDay} cycleLen={cycleLen} flowLog={flowLog} pregnancyMode={pregnancyMode}/>
      </div>

      {cycleHistory.length > 1 && (
        <div className="wh-card">
          <CardHead title="Cycle Length History"/>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {cycleHistory.slice(-5).map((c,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:".72rem", color:TM, width:60 }}>Cycle {cycleHistory.length - i}</div>
                <div style={{ flex:1 }}><Bar pct={(c/40)*100} color={G}/></div>
                <div style={{ fontSize:".78rem", color:G, fontWeight:700, width:30 }}>{c}d</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: FERTILITY (NEW — beats Flo)
══════════════════════════════════════════════════════════ */
function FertilityPage({ cycleDay, cycleLen, bbtLogs, setBbtLogs, mucusLogs, setMucusLogs, lhLogs, setLhLogs, pregnancyMode }) {
  const [bbtForm, setBbtForm] = useState({ temp:"", time:"06:30" });
  const [lhResult, setLhResult] = useState("negative");
  const [mucusType, setMucusType] = useState("dry");
  const [showBBT, setShowBBT] = useState(false);

  const fertScore = useMemo(()=>calcFertility(cycleDay,cycleLen,bbtLogs,mucusLogs,lhLogs),[cycleDay,cycleLen,bbtLogs,mucusLogs,lhLogs]);
  const fertLabel = fertScore >= 70 ? "Peak Fertile" : fertScore >= 40 ? "Fertile" : fertScore >= 20 ? "Low Fertile" : "Not Fertile";
  const fertColor = fertScore >= 70 ? GBR : fertScore >= 40 ? G : fertScore >= 20 ? GB : TM;

  const logBBT = () => {
    if (!bbtForm.temp) return;
    setBbtLogs(prev=>[...prev, { day:cycleDay, temp:bbtForm.temp, time:bbtForm.time, date:today() }]);
    setBbtForm({ temp:"", time:"06:30" }); setShowBBT(false);
  };
  const logLH = () => setLhLogs(prev=>[...prev, { day:cycleDay, result:lhResult, date:today() }]);
  const logMucus = () => setMucusLogs(prev=>[...prev, { day:cycleDay, type:mucusType, date:today() }]);

  const ovDay = Math.round(cycleLen - 14);
  const fertileWindow = [ovDay-5, ovDay-4, ovDay-3, ovDay-2, ovDay-1, ovDay, ovDay+1];
  const inWindow = fertileWindow.includes(cycleDay);

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Fertility score */}
      <div className="wh-card" style={{ textAlign:"center", padding:"28px 20px", border:`1px solid ${fertColor}44` }}>
        <div style={{ fontSize:".65rem", color:TM, letterSpacing:".16em", textTransform:"uppercase", marginBottom:8 }}>Today's Fertility Score</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"4rem", fontWeight:900, color:fertColor, lineHeight:1 }}>{fertScore}</div>
        <div style={{ fontSize:"1rem", fontWeight:700, color:fertColor, marginTop:6, marginBottom:12 }}>{fertLabel}</div>
        <Bar pct={fertScore} color={fertColor}/>
        <div style={{ marginTop:14, padding:"10px 16px", borderRadius:10, background:`${fertColor}10`, border:`1px solid ${fertColor}33`, display:"inline-block" }}>
          <div style={{ fontSize:".78rem", color:fertColor }}>
            {inWindow ? `🌸 You are in your fertile window (Day ${cycleDay})` : `Next fertile window in ~${Math.max(0,fertileWindow[0]-cycleDay)}d`}
          </div>
        </div>
      </div>

      {/* BBT + Mucus + LH row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {/* BBT */}
        <div className="wh-card">
          <CardHead title="BBT" right={<button className="btn-gold btn-xs" onClick={()=>setShowBBT(true)}>+ Log</button>}/>
          {bbtLogs.length > 0 ? (
            <>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:900, color:G }}>{bbtLogs.slice(-1)[0].temp}°</div>
              <div style={{ fontSize:".68rem", color:TM }}>Day {bbtLogs.slice(-1)[0].day} · {bbtLogs.slice(-1)[0].time}</div>
              <div style={{ fontSize:".65rem", color:TM, marginTop:6 }}>{bbtLogs.length} readings</div>
            </>
          ) : (
            <div style={{ fontSize:".75rem", color:TM, textAlign:"center", padding:"12px 0" }}>No BBT yet</div>
          )}
        </div>

        {/* Cervical Mucus */}
        <div className="wh-card">
          <CardHead title="Mucus" right={<button className="btn-gold btn-xs" onClick={logMucus}>Log</button>}/>
          <select className="wh-sel" value={mucusType} onChange={e=>setMucusType(e.target.value)} style={{ marginBottom:8, fontSize:".75rem" }}>
            {MUCUS_TYPES.map(m=><option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          {mucusLogs.length > 0 && (
            <div style={{ fontSize:".68rem", color:MUCUS_TYPES.find(m=>m.v===mucusLogs.slice(-1)[0].type)?.color||G }}>
              Latest: {mucusLogs.slice(-1)[0].type}
            </div>
          )}
          <div style={{ fontSize:".65rem", color:TM, marginTop:4 }}>{MUCUS_TYPES.find(m=>m.v===mucusType)?.desc}</div>
        </div>

        {/* LH Test */}
        <div className="wh-card">
          <CardHead title="LH Strip" right={<button className="btn-gold btn-xs" onClick={logLH}>Log</button>}/>
          <select className="wh-sel" value={lhResult} onChange={e=>setLhResult(e.target.value)} style={{ marginBottom:8, fontSize:".75rem" }}>
            {LH_RESULTS.map(l=><option key={l.v} value={l.v}>{l.label}</option>)}
          </select>
          {lhLogs.length > 0 && (
            <div style={{ fontSize:".68rem", color:LH_RESULTS.find(l=>l.v===lhLogs.slice(-1)[0].result)?.color||G }}>
              Latest: {lhLogs.slice(-1)[0].result}
            </div>
          )}
        </div>
      </div>

      {/* BBT Chart */}
      <div className="wh-card">
        <CardHead title="Basal Body Temperature Chart" right={<span className="gold-badge">{bbtLogs.length} readings</span>}/>
        <BBTChart bbtLogs={bbtLogs} cycleLen={cycleLen}/>
      </div>

      {/* Fertile window calendar */}
      <div className="wh-card">
        <CardHead title="Fertile Window" right={<span className="gold-badge">Days {fertileWindow[0]}–{fertileWindow[fertileWindow.length-1]}</span>}/>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Array.from({length:cycleLen},(_,i)=>i+1).map(d => {
            const isToday = d === cycleDay;
            const isFertile = fertileWindow.includes(d);
            const isOv = d === ovDay;
            return (
              <div key={d} style={{ width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
                background:isOv?GBR:isFertile?`${G}40`:isToday?`${G}20`:S2,
                border:`1px solid ${isOv?GBR:isFertile?G:isToday?G:TD}`,
                fontSize:".72rem", fontWeight:isToday?700:400,
                color:isOv?BK:isFertile?G:isToday?G:TM }}>
                {d}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
          {[[GBR,"Ovulation"],[G,"Fertile Window"],[`${G}20`,"Today"]].map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:".65rem", color:TM }}>
              <div style={{ width:10, height:10, borderRadius:2, background:c, border:`1px solid ${G}44` }}/>{l}
            </div>
          ))}
        </div>
      </div>

      {/* BBT Log modal */}
      <Modal show={showBBT} onClose={()=>setShowBBT(false)} title="Log Basal Body Temperature">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label className="wh-lbl">Temperature (°C) — Take immediately on waking</label>
            <input className="wh-inp" type="number" step="0.01" min="35" max="38.5"
              placeholder="e.g. 36.6" value={bbtForm.temp} onChange={e=>setBbtForm(f=>({...f,temp:e.target.value}))}/>
          </div>
          <div>
            <label className="wh-lbl">Time taken</label>
            <input className="wh-inp" type="time" value={bbtForm.time} onChange={e=>setBbtForm(f=>({...f,time:e.target.value}))}/>
          </div>
          <div className="wh-card2" style={{ fontSize:".75rem", color:TM, lineHeight:1.6 }}>
            💡 For accuracy: take at same time each morning before getting up, after at least 3h sleep.
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={logBBT}>Save BBT</button>
            <button className="btn-outline" onClick={()=>setShowBBT(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: FLOW LOG (NEW beats Flo)
══════════════════════════════════════════════════════════ */
function FlowPage({ cycleDay, cycleLen, flowLog, setFlowLog }) {
  const currentFlow = flowLog[cycleDay] || "none";
  const setFlow = (day, val) => setFlowLog(prev=>({...prev,[day]:val}));

  const totalPeriodDays = Object.values(flowLog).filter(f=>f&&f!=="none").length;
  const avgFlow = Object.values(flowLog).filter(f=>f&&f!=="none").length > 0
    ? FLOW_LEVELS.find(f=>f.v===Object.values(flowLog).sort()[Math.floor(Object.values(flowLog).length/2)])?.label || "Medium"
    : "—";

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card" style={{ textAlign:"center", padding:"24px 20px" }}>
        <div style={{ fontSize:".65rem", color:TM, letterSpacing:".16em", textTransform:"uppercase", marginBottom:12 }}>Today's Flow — Day {cycleDay}</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:18 }}>
          {FLOW_LEVELS.map(f=>(
            <button key={f.v}
              onClick={()=>setFlow(cycleDay,f.v)}
              style={{ padding:"10px 16px", borderRadius:10, border:`2px solid ${currentFlow===f.v?f.color:TD}`,
                background:currentFlow===f.v?`${f.color}18`:S2, color:currentFlow===f.v?f.color:TM,
                cursor:"pointer", fontSize:".78rem", fontWeight:currentFlow===f.v?700:400,
                transition:"all .15s", fontFamily:"'DM Sans',sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:900,
          color:FLOW_LEVELS.find(f=>f.v===currentFlow)?.color||TM }}>
          {FLOW_LEVELS.find(f=>f.v===currentFlow)?.label}
        </div>
      </div>

      <div className="wh-card">
        <CardHead title="Flow History This Cycle"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 }}>
          {Array.from({length:cycleLen},(_,i)=>i+1).map(d=>{
            const fv = flowLog[d]||"none";
            const fc = FLOW_LEVELS.find(f=>f.v===fv);
            return (
              <div key={d}
                onClick={()=>setFlow(d,fv==="none"?"medium":fv==="medium"?"heavy":fv==="heavy"?"light":fv==="light"?"spotting":"none")}
                style={{ height:36, borderRadius:6, background:fv!=="none"?`${fc?.color}55`:S2,
                  border:`1px solid ${d===cycleDay?G:fv!=="none"?fc?.color+"44":TD}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", transition:"all .14s" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:".55rem", color:TM, lineHeight:1 }}>{d}</div>
                  {fv!=="none" && <div style={{ fontSize:".6rem", color:fc?.color }}>●</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize:".7rem", color:TM, marginTop:8 }}>Tap any day to cycle through flow levels</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {[
          { l:"Period Days", v:totalPeriodDays, c:ROSE },
          { l:"Current Phase", v:getCyclePhase(cycleDay,cycleLen).name, c:G },
          { l:"Typical Flow", v:avgFlow, c:GB },
        ].map(s=>(
          <div key={s.l} className="wh-card" style={{ textAlign:"center" }}>
            <div className="wh-card-title" style={{ marginBottom:6 }}>{s.l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:900, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="wh-card">
        <CardHead title="Flow Insights"/>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div className="insight-block">
            <div className="insight-lbl">Heavy Flow Tips</div>
            <div className="insight-txt">Iron-rich foods (spinach, lentils, red meat) help replace blood iron. Avoid caffeine which can worsen cramps.</div>
          </div>
          <div className="insight-block">
            <div className="insight-lbl">Pain Relief</div>
            <div className="insight-txt">Magnesium supplements, warm compress, and gentle yoga significantly reduce menstrual pain (Cochrane 2022).</div>
          </div>
          <div className="insight-block">
            <div className="insight-lbl">Track Your Patterns</div>
            <div className="insight-txt">Log consistently for 3+ cycles to identify your personal patterns and detect any changes early.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: MOOD TRACKER
══════════════════════════════════════════════════════════ */
function MoodPage({ mood, setMood, energy, setEnergy, streak, setStreak, moodHistory, setMoodHistory }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ mood:"Balanced", energy:70, note:"" });

  const save = () => {
    setMoodHistory(prev=>[{ id:Date.now(), date:new Date().toLocaleDateString(), ...form }, ...prev]);
    setMood(form.mood); setEnergy(form.energy);
    setStreak(s=>s+1); setShowModal(false);
    setForm({ mood:"Balanced", energy:70, note:"" });
  };

  const avgEnergy = moodHistory.length
    ? Math.round(moodHistory.reduce((a,m)=>a+m.energy,0)/moodHistory.length) : energy;

  // PMS pattern detector
  const pmsEntries = moodHistory.filter(m=>m.mood==="Stressed"||m.mood==="Irritable"||m.mood==="Emotional");
  const pmsPct = moodHistory.length ? Math.round((pmsEntries.length/moodHistory.length)*100) : 0;

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="How are you feeling today?" right={<span className="gold-badge">🔥 {streak}d streak</span>}/>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
          {MOOD_OPTS.map(m=>(
            <button key={m.v} className={`chip ${mood===m.v?"active":""}`} onClick={()=>setMood(m.v)}>
              <span>{m.e}</span>{m.v}
            </button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label className="wh-lbl">Energy: <span style={{ color:G }}>{energy}%</span></label>
          <input type="range" min={10} max={100} step={5} value={energy}
            onChange={e=>setEnergy(+e.target.value)} style={{ width:"100%", accentColor:G }}/>
        </div>
        <button className="btn-gold" onClick={()=>setShowModal(true)}>💾 Log Full Entry</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="wh-card">
          <CardHead title="Mood History" right={<span className="gold-badge">{moodHistory.length}</span>}/>
          {moodHistory.length === 0 && (
            <div style={{ textAlign:"center", padding:"20px 0", color:TM, fontSize:".78rem" }}>No entries yet. Start logging!</div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:7, maxHeight:260, overflowY:"auto" }}>
            {moodHistory.map(h=>(
              <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:9, background:S2 }}>
                <span style={{ fontSize:"1.2rem" }}>{MOOD_OPTS.find(m=>m.v===h.mood)?.e||"😊"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:".8rem", fontWeight:700 }}>{h.mood}</div>
                  <div style={{ fontSize:".65rem", color:TM }}>{h.date}</div>
                  {h.note && <div style={{ fontSize:".68rem", color:TM, fontStyle:"italic", marginTop:1 }}>{h.note}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:G, fontWeight:700, fontSize:".85rem" }}>{h.energy}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="wh-card">
          <CardHead title="Patterns & Insights"/>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:12 }}>
            <StatRow label="Current Mood"   value={mood}/>
            <StatRow label="Avg Energy"     value={`${avgEnergy}%`}/>
            <StatRow label="Streak"         value={`${streak} days`}/>
            <StatRow label="Total Entries"  value={moodHistory.length}/>
          </div>
          {/* PMS Pattern Detector */}
          {pmsPct > 20 && (
            <div className="insight-block" style={{ borderColor:"rgba(224,92,138,.4)" }}>
              <div style={{ fontSize:".65rem", color:ROSE, letterSpacing:".12em", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>PMS Pattern Detected</div>
              <div style={{ fontSize:".75rem", color:TX, lineHeight:1.5 }}>
                {pmsPct}% of logged days show mood instability. Consider magnesium, B6, and cycle-aware scheduling.
              </div>
            </div>
          )}
          <GoldRule/>
          <div style={{ fontSize:".75rem", color:TM, lineHeight:1.6 }}>
            {mood==="Stressed"||mood==="Irritable" ? "Try 5-min deep breathing. Journaling also lowers cortisol." :
              energy<50 ? "Iron and B-vitamins may support your energy. Aim for 7-8h sleep." :
              "Balanced mood. Keep your current routine!"}
          </div>
        </div>
      </div>

      <Modal show={showModal} onClose={()=>setShowModal(false)} title="Log Mood & Energy">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label className="wh-lbl">Mood</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {MOOD_OPTS.map(m=>(
                <button key={m.v} className={`chip ${form.mood===m.v?"active":""}`} onClick={()=>setForm(f=>({...f,mood:m.v}))}>
                  {m.e} {m.v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-lbl">Energy: <span style={{ color:G }}>{form.energy}%</span></label>
            <input type="range" min={10} max={100} step={5} value={form.energy}
              onChange={e=>setForm(f=>({...f,energy:+e.target.value}))} style={{ width:"100%", accentColor:G }}/>
          </div>
          <div>
            <label className="wh-lbl">Note</label>
            <textarea className="wh-inp" placeholder="How are you feeling?" rows={3}
              style={{ resize:"vertical" }} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={save}>Save Entry</button>
            <button className="btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SYMPTOMS (upgraded with custom tags)
══════════════════════════════════════════════════════════ */
function SymptomsPage({ symptoms, setSymptoms }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", severity:"mild", category:"General" });
  const CATS = ["General","Menstrual","Digestive","Head","Emotional","Skin","Other"];
  const SEV_COLORS2 = { severe:"#EF4444", moderate:GBR, mild:G, low:GD };
  const CAT_COLORS = { Menstrual:ROSE, Emotional:BLUE, Digestive:TEAL, Head:GBR, General:G, Skin:GB, Other:TM };

  const add = () => {
    if (!form.name.trim()) return;
    setSymptoms(prev=>[{ id:Date.now(), date:new Date().toLocaleDateString(), ...form }, ...prev]);
    setForm({ name:"", severity:"mild", category:"General" }); setShowModal(false);
  };
  const del = id => setSymptoms(prev=>prev.filter(s=>s.id!==id));

  const byCategory = CATS.reduce((acc,c)=>({ ...acc, [c]:symptoms.filter(s=>s.category===c) }),{});

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Symptoms Log"
          right={<button className="btn-gold btn-sm" onClick={()=>setShowModal(true)}>+ Log Symptom</button>}/>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
          {["severe","moderate","mild","low"].map(sev=>(
            <div key={sev} style={{ textAlign:"center", padding:"10px 6px", borderRadius:10, background:S2, border:`1px solid ${SEV_COLORS2[sev]}33` }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:900, color:SEV_COLORS2[sev] }}>{symptoms.filter(s=>s.severity===sev).length}</div>
              <div style={{ fontSize:".62rem", color:TM, textTransform:"capitalize" }}>{sev}</div>
            </div>
          ))}
        </div>
        <GoldRule/>

        {symptoms.length===0 && (
          <div style={{ textAlign:"center", padding:"32px 0", color:TM, fontSize:".8rem" }}>
            🌡 No symptoms logged yet. Start tracking to spot patterns.
          </div>
        )}

        {/* Group by category */}
        {CATS.filter(c=>byCategory[c].length>0).map(cat=>(
          <div key={cat} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:CAT_COLORS[cat]||G }}/>
              <span style={{ fontSize:".68rem", color:CAT_COLORS[cat]||G, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>{cat}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {byCategory[cat].map(sym=>(
                <div key={sym.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderRadius:10, background:S2, border:`1px solid ${TD}` }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:SEV_COLORS2[sym.severity]||G, flexShrink:0 }}/>
                  <div style={{ flex:1, fontWeight:600, fontSize:".83rem" }}>{sym.name}</div>
                  <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:5, background:`${SEV_COLORS2[sym.severity]}18`, color:SEV_COLORS2[sym.severity], fontWeight:700, textTransform:"uppercase" }}>{sym.severity}</span>
                  <span style={{ fontSize:".65rem", color:TM }}>{sym.date}</span>
                  <button className="btn-icon" style={{ width:26, height:26, fontSize:12 }} onClick={()=>del(sym.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal show={showModal} onClose={()=>setShowModal(false)} title="Log Symptom">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label className="wh-lbl">Symptom</label>
            <input className="wh-inp" placeholder="e.g., Cramps, Headache, Bloating" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>
          <div>
            <label className="wh-lbl">Category</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {CATS.map(c=>(
                <button key={c} className={`chip btn-xs ${form.category===c?"active":""}`}
                  onClick={()=>setForm(f=>({...f,category:c}))}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-lbl">Severity</label>
            <div style={{ display:"flex", gap:7 }}>
              {["low","mild","moderate","severe"].map(s=>(
                <button key={s} onClick={()=>setForm(f=>({...f,severity:s}))}
                  className={`btn-sm ${form.severity===s?"btn-gold":"btn-outline"}`}
                  style={{ textTransform:"capitalize", flex:1 }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={add}>Save</button>
            <button className="btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SEX & CONTRACEPTION LOG (NEW beats Clue)
══════════════════════════════════════════════════════════ */
function SexPage({ sexLog, setSexLog, cycleDay }) {
  const [form, setForm] = useState({ protection:"condom", initiatedBy:"self", notes:"", mood:"Positive" });
  const [showModal, setShowModal] = useState(false);

  const add = () => {
    setSexLog(prev=>[{ id:Date.now(), date:new Date().toLocaleDateString(), cycleDay, ...form }, ...prev]);
    setShowModal(false); setForm({ protection:"condom", initiatedBy:"self", notes:"", mood:"Positive" });
  };
  const del = id => setSexLog(prev=>prev.filter(s=>s.id!==id));

  const PROTECTION = ["condom","pill","iud","implant","no protection","other"];
  const MOODS = ["Positive","Neutral","Uncomfortable","Unplanned"];
  const PROT_COLORS = { condom:G, pill:TEAL, iud:BLUE, implant:GB, "no protection":ROSE, other:TM };

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Intimacy & Contraception Log"
          right={<button className="btn-gold btn-sm" onClick={()=>setShowModal(true)}>+ Log</button>}/>
        <div className="wh-card2" style={{ marginBottom:12, borderColor:"rgba(96,165,250,.2)" }}>
          <div style={{ fontSize:".72rem", color:BLUE, marginBottom:4 }}>🔒 Private & Confidential</div>
          <div style={{ fontSize:".72rem", color:TM, lineHeight:1.5 }}>
            Tracking intimacy helps identify patterns, monitor contraception consistency, and correlate with cycle symptoms.
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            { l:"Total Logged", v:sexLog.length, c:G },
            { l:"This Cycle",   v:sexLog.filter(s=>s.cycleDay<=cycleDay).length, c:TEAL },
            { l:"Protected %",  v:sexLog.length?Math.round(sexLog.filter(s=>s.protection!=="no protection").length/sexLog.length*100)+"%":"—", c:GB },
          ].map(s=>(
            <div key={s.l} className="wh-card2" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:".62rem", color:TM, marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {sexLog.length===0 && (
          <div style={{ textAlign:"center", padding:"24px 0", color:TM, fontSize:".8rem" }}>No entries yet.</div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {sexLog.slice(0,10).map(e=>(
            <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", borderRadius:10, background:S2 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".8rem", fontWeight:600 }}>Day {e.cycleDay} · {e.date}</div>
                {e.notes && <div style={{ fontSize:".7rem", color:TM, fontStyle:"italic", marginTop:1 }}>{e.notes}</div>}
              </div>
              <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:5,
                background:`${PROT_COLORS[e.protection]||G}18`, color:PROT_COLORS[e.protection]||G,
                fontWeight:700, textTransform:"capitalize" }}>{e.protection}</span>
              <span style={{ fontSize:".65rem", padding:"3px 8px", borderRadius:5, background:S3, color:TM }}>{e.mood}</span>
              <button className="btn-icon" style={{ width:26, height:26, fontSize:12 }} onClick={()=>del(e.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <Modal show={showModal} onClose={()=>setShowModal(false)} title="Log Intimacy">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label className="wh-lbl">Contraception Used</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {PROTECTION.map(p=>(
                <button key={p} className={`chip btn-xs ${form.protection===p?"active":""}`}
                  onClick={()=>setForm(f=>({...f,protection:p}))} style={{ textTransform:"capitalize" }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-lbl">How did you feel?</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {MOODS.map(m=>(
                <button key={m} className={`chip btn-xs ${form.mood===m?"active":""}`}
                  onClick={()=>setForm(f=>({...f,mood:m}))}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="wh-lbl">Notes (optional)</label>
            <textarea className="wh-inp" rows={2} placeholder="Any notes…" style={{ resize:"none" }}
              value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={add}>Save</button>
            <button className="btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: HORMONES
══════════════════════════════════════════════════════════ */
function HormonesPage({ hormones, setHormones, cycleDay, cycleLen }) {
  const phase = getCyclePhase(cycleDay, cycleLen);
  const adj = (name, delta) => setHormones(prev=>prev.map(h=>h.name===name?{...h,value:Math.min(100,Math.max(0,h.value+delta))}:h));
  const tips = {
    Estrogen:"Flaxseeds, soy, leafy greens support healthy estrogen metabolism.",
    Progesterone:"Magnesium & Vitamin B6 support progesterone. Avoid excess caffeine.",
    Cortisol:"Deep breathing, adaptogens, and 7-8h sleep reduce cortisol.",
    Serotonin:"Sunlight, exercise, and tryptophan-rich foods boost serotonin.",
    Testosterone:"Light resistance training, zinc-rich foods support healthy testosterone.",
  };
  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Hormone Balance Tracker" right={<span className="gold-badge">{phase.name} Phase</span>}/>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {hormones.map(h=>(
            <div key={h.name}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:".85rem" }}>{h.name}</span>
                  <span style={{ fontSize:".7rem", color:TM, marginLeft:8 }}>{tips[h.name]?.split(".")[0]}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <button className="btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={()=>adj(h.name,-5)}>−</button>
                  <span style={{ color:G, fontWeight:700, width:34, textAlign:"center", fontSize:".88rem" }}>{h.value}%</span>
                  <button className="btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={()=>adj(h.name,5)}>+</button>
                </div>
              </div>
              <Bar pct={h.value}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="wh-card">
          <CardHead title="Hormone Tips"/>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {hormones.map(h=>(
              <div key={h.name} className="insight-block">
                <div className="insight-lbl">{h.name}</div>
                <div className="insight-txt">{tips[h.name]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="wh-card">
          <CardHead title="Phase Support"/>
          <div className="insight-block" style={{ marginBottom:10 }}>
            <div className="insight-lbl">{phase.name}</div>
            <div className="insight-txt">{phase.tip}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {hormones.map(h=>(
              <StatRow key={h.name} label={h.name}
                value={h.value>=70?"Optimal":h.value>=40?"Moderate":"Low"}
                color={h.value>=70?"#22c55e":h.value>=40?G:"#ef4444"}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SUPPLEMENTS
══════════════════════════════════════════════════════════ */
function SupplementsPage({ supplements, setSupplements }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", dosage:"", time:"Morning" });
  const toggle = id => setSupplements(prev=>prev.map(s=>s.id===id?{...s,taken:!s.taken}:s));
  const remove = id => setSupplements(prev=>prev.filter(s=>s.id!==id));
  const add = () => {
    if (!form.name.trim()) return;
    setSupplements(prev=>[...prev, { id:Date.now(), ...form, taken:false }]);
    setForm({ name:"", dosage:"", time:"Morning" }); setShowModal(false);
  };
  const taken = supplements.filter(s=>s.taken).length;
  const pct = supplements.length ? Math.round((taken/supplements.length)*100) : 0;

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {[{l:"Taken Today",v:taken,s:`of ${supplements.length}`},{l:"Remaining",v:supplements.length-taken,s:"pending"},{l:"Adherence",v:`${pct}%`,s:"today",bar:true}].map((s,i)=>(
          <div key={i} className="wh-card" style={{ textAlign:"center" }}>
            <div className="wh-card-title" style={{ marginBottom:6 }}>{s.l}</div>
            <div className="stat-big">{s.v}</div>
            <div style={{ fontSize:".7rem", color:TM, marginTop:3 }}>{s.s}</div>
            {s.bar && <Bar pct={pct}/>}
          </div>
        ))}
      </div>
      <div className="wh-card">
        <CardHead title="Today's Supplements"
          right={<button className="btn-gold btn-sm" onClick={()=>setShowModal(true)}>+ Add</button>}/>
        {supplements.length===0 && <div style={{ textAlign:"center", padding:"24px 0", color:TM, fontSize:".8rem" }}>No supplements. Tap Add to begin.</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {supplements.map(s=>(
            <div key={s.id} onClick={()=>toggle(s.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 13px", borderRadius:11, background:s.taken?"rgba(212,160,23,0.07)":S2,
                border:`1px solid ${s.taken?G:TD}`, cursor:"pointer", transition:"all .16s" }}>
              <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${s.taken?G:TD}`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                background:s.taken?G:"transparent", color:s.taken?BK:TM, transition:"all .2s", fontSize:14 }}>
                {s.taken && "✓"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:".85rem" }}>{s.name}</div>
                <div style={{ fontSize:".7rem", color:TM }}>{s.dosage}</div>
              </div>
              <span style={{ fontSize:".68rem", background:S3, padding:"4px 9px", borderRadius:6, color:TM }}>{s.time}</span>
              <button className="btn-icon" style={{ width:26, height:26, fontSize:12 }}
                onClick={e=>{ e.stopPropagation(); remove(s.id); }}>🗑</button>
            </div>
          ))}
        </div>
      </div>
      <Modal show={showModal} onClose={()=>setShowModal(false)} title="Add Supplement">
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          <div><label className="wh-lbl">Name</label><input className="wh-inp" placeholder="e.g., Vitamin D3" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="wh-lbl">Dosage</label><input className="wh-inp" placeholder="e.g., 2000 IU" value={form.dosage} onChange={e=>setForm(f=>({...f,dosage:e.target.value}))}/></div>
          <div><label className="wh-lbl">Time</label>
            <select className="wh-sel" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}>
              {["Morning","Lunch","Evening","Night"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={add}>Add</button>
            <button className="btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: SELF CARE
══════════════════════════════════════════════════════════ */
function SelfCarePage({ selfCare, setSelfCare, water, setWater, sleep, setSleep }) {
  const WGOAL = 8;
  const toggle = id => setSelfCare(prev=>prev.map(a=>a.id===id?{...a,done:!a.done}:a));
  const done = selfCare.filter(a=>a.done).length;
  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Daily Self-Care Routine" right={<span className="gold-badge">{done}/{selfCare.length} done</span>}/>
        <Bar pct={(done/selfCare.length)*100}/>
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:14 }}>
          {selfCare.map(a=>(
            <div key={a.id} onClick={()=>toggle(a.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:11,
                background:a.done?"rgba(212,160,23,0.07)":S2, border:`1px solid ${a.done?G:TD}`, cursor:"pointer", transition:"all .16s" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${a.done?G:TD}`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                background:a.done?G:"transparent", color:a.done?BK:TM, fontSize:13 }}>
                {a.done && "✓"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:".85rem", fontWeight:600, color:a.done?TM:TX, textDecoration:a.done?"line-through":"none" }}>{a.name}</div>
                <div style={{ fontSize:".7rem", color:TM, marginTop:1 }}>{a.duration} · {a.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="wh-card">
          <CardHead title="Water Intake"/>
          <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", margin:"14px 0" }}>
            {Array.from({length:WGOAL}).map((_,i)=>(
              <div key={i} onClick={()=>setWater(i+1===water?i:i+1)}
                style={{ width:34, height:34, borderRadius:"50%", border:`2px solid ${i<water?G:TD}`,
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                  background:i<water?BGW:"transparent", color:i<water?G:TM, transition:"all .16s", fontSize:14 }}>
                💧
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", fontSize:".8rem", color:TM }}>{water}/{WGOAL} glasses</div>
          <Bar pct={(water/WGOAL)*100}/>
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:10 }}>
            <button className="btn-outline btn-sm" onClick={()=>setWater(w=>Math.max(0,w-1))}>−</button>
            <button className="btn-gold btn-sm" onClick={()=>setWater(w=>Math.min(WGOAL,w+1))}>+ Glass</button>
          </div>
        </div>
        <div className="wh-card">
          <CardHead title="Sleep Tracker"/>
          <div style={{ textAlign:"center", padding:"14px 0" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2.8rem", fontWeight:900, color:G }}>{sleep}h</div>
            <div style={{ fontSize:".78rem", color:sleep>=7?"#22c55e":"#f59e0b", marginTop:3, fontWeight:600 }}>
              {sleep>=8?"★ Excellent":sleep>=7?"Good rest":sleep>=6?"Slightly low":"⚠ Rest more"}
            </div>
          </div>
          <Bar pct={(sleep/10)*100}/>
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:12 }}>
            <button className="btn-outline btn-sm" onClick={()=>setSleep(h=>Math.max(4,+(h-0.5).toFixed(1)))}>−0.5h</button>
            <button className="btn-gold btn-sm" onClick={()=>setSleep(h=>Math.min(12,+(h+0.5).toFixed(1)))}>+0.5h</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: PROGRAMS
══════════════════════════════════════════════════════════ */
function ProgramsPage({ programs, setPrograms }) {
  const cont  = id => setPrograms(prev=>prev.map(p=>p.id===id?{...p,progress:Math.min(100,p.progress+10)}:p));
  const reset = id => setPrograms(prev=>prev.map(p=>p.id===id?{...p,progress:0}:p));
  return (
    <div className="fade-up">
      <div className="wh-card">
        <CardHead title="Wellness Programs"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {programs.map(prog=>(
            <div key={prog.id} style={{ padding:"16px", borderRadius:12, background:S2, border:`1px solid ${TD}`, transition:"all .2s", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G}
              onMouseLeave={e=>e.currentTarget.style.borderColor=TD}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:".88rem", marginBottom:2 }}>{prog.name}</div>
                  <div style={{ fontSize:".68rem", color:TM }}>{prog.duration}</div>
                </div>
                <span className="gold-badge">{prog.cat}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:".65rem", color:TM }}>Progress</span>
                <span style={{ fontSize:".75rem", color:G, fontWeight:700 }}>{prog.progress}%</span>
              </div>
              <Bar pct={prog.progress}/>
              <div style={{ display:"flex", gap:7, marginTop:10 }}>
                <button className="btn-gold btn-sm" style={{ flex:1 }} onClick={()=>cont(prog.id)}>+ Continue</button>
                <button className="btn-outline btn-sm" onClick={()=>reset(prog.id)}>Reset</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: JOURNAL
══════════════════════════════════════════════════════════ */
function JournalPage({ journal, setJournal }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:"", content:"", mood:"😊" });
  const add = () => {
    if (!form.title.trim()) return;
    setJournal(prev=>[{ id:Date.now(), date:new Date().toLocaleDateString(), ...form }, ...prev]);
    setForm({ title:"", content:"", mood:"😊" }); setShowModal(false);
  };
  const del = id => setJournal(prev=>prev.filter(j=>j.id!==id));
  return (
    <div className="fade-up">
      <div className="wh-card">
        <CardHead title="Health Journal"
          right={<button className="btn-gold btn-sm" onClick={()=>setShowModal(true)}>+ New Entry</button>}/>
        {journal.length===0 && (
          <div style={{ textAlign:"center", padding:"36px 0", color:TM }}>
            📖 No journal entries yet. Start writing your health journey.
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {journal.map(e=>(
            <div key={e.id} style={{ padding:"13px", borderRadius:12, background:S2, border:`1px solid ${TD}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:".65rem", color:TM, letterSpacing:".1em" }}>{e.date}</span>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:"1.2rem" }}>{e.mood}</span>
                  <button className="btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={()=>del(e.id)}>🗑</button>
                </div>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".92rem", color:G, marginBottom:5 }}>{e.title}</div>
              <div style={{ fontSize:".8rem", color:TX, lineHeight:1.65 }}>{e.content}</div>
            </div>
          ))}
        </div>
      </div>
      <Modal show={showModal} onClose={()=>setShowModal(false)} title="New Journal Entry">
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          <div><label className="wh-lbl">Title</label><input className="wh-inp" placeholder="e.g., Feeling centered today" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
          <div>
            <label className="wh-lbl">Mood</label>
            <div style={{ display:"flex", gap:7 }}>
              {["😊","😄","😐","😟","😢","😴"].map(m=>(
                <div key={m} onClick={()=>setForm(f=>({...f,mood:m}))}
                  style={{ width:36, height:36, borderRadius:"50%", border:`2px solid ${form.mood===m?G:TD}`,
                    background:form.mood===m?BGW:S2, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.2rem", cursor:"pointer", transition:"all .14s" }}>{m}</div>
              ))}
            </div>
          </div>
          <div><label className="wh-lbl">Content</label>
            <textarea className="wh-inp" placeholder="Write about your day..." rows={4} style={{ resize:"vertical", lineHeight:1.6 }}
              value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}/></div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" style={{ flex:1 }} onClick={add}>Save Entry</button>
            <button className="btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: CYCLE STATISTICS (NEW beats Clue)
══════════════════════════════════════════════════════════ */
function StatsPage({ cycleLen, cycleHistory, moodHistory, symptoms, bbtLogs, flowLog }) {
  const allLengths = [...cycleHistory, cycleLen];
  const avg = allLengths.length ? Math.round(allLengths.reduce((a,v)=>a+v,0)/allLengths.length) : cycleLen;
  const minL = Math.min(...allLengths);
  const maxL = Math.max(...allLengths);
  const regularity = allLengths.length >= 3
    ? Math.round((1 - (maxL - minL) / avg) * 100) : null;

  const topSymptoms = Object.entries(
    symptoms.reduce((acc, s) => { acc[s.name] = (acc[s.name]||0)+1; return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const moodDist = MOOD_OPTS.reduce((acc, m) => {
    acc[m.v] = moodHistory.filter(h=>h.mood===m.v).length; return acc;
  }, {});

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Cycle Statistics" right={<span className="gold-badge">{allLengths.length} cycles</span>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[
            { l:"Average Cycle",  v:`${avg}d`, c:G    },
            { l:"Shortest",       v:`${minL}d`, c:TEAL },
            { l:"Longest",        v:`${maxL}d`, c:ROSE },
            { l:"Regularity",     v:regularity!==null?`${regularity}%`:"Need 3+", c:regularity>=80?"#22c55e":regularity>=60?GB:GD },
          ].map(s=>(
            <div key={s.l} className="wh-card" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.3rem", fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:".62rem", color:TM, marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {regularity !== null && (
          <div style={{ marginTop:12 }} className="insight-block">
            <div className="insight-lbl">Cycle Regularity</div>
            <div className="insight-txt">
              {regularity>=80 ? "Your cycles are very regular. This suggests healthy hormonal balance." :
               regularity>=60 ? "Moderately regular. Small variations are normal." :
               "High variation detected. Consider tracking stress, sleep, and nutrition."}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="wh-card">
          <CardHead title="Top Symptoms"/>
          {topSymptoms.length===0
            ? <div style={{ textAlign:"center", padding:"20px 0", color:TM, fontSize:".78rem" }}>No symptoms logged yet.</div>
            : topSymptoms.map(([name, count])=>(
              <div key={name} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:".8rem", color:TX }}>{name}</span>
                  <span style={{ fontSize:".75rem", color:G, fontWeight:700 }}>{count}×</span>
                </div>
                <Bar pct={(count/Math.max(...topSymptoms.map(([,c])=>c)))*100}/>
              </div>
            ))
          }
        </div>
        <div className="wh-card">
          <CardHead title="Mood Distribution"/>
          {moodHistory.length===0
            ? <div style={{ textAlign:"center", padding:"20px 0", color:TM, fontSize:".78rem" }}>No mood data yet.</div>
            : Object.entries(moodDist).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]).map(([mood,count])=>(
              <div key={mood} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:".78rem", color:TX }}>{MOOD_OPTS.find(m=>m.v===mood)?.e} {mood}</span>
                  <span style={{ fontSize:".72rem", color:G }}>{count}</span>
                </div>
                <Bar pct={(count/moodHistory.length)*100}/>
              </div>
            ))
          }
        </div>
      </div>

      {bbtLogs.length >= 5 && (
        <div className="wh-card">
          <CardHead title="BBT Analysis"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[
              { l:"Avg BBT", v:`${(bbtLogs.reduce((a,b)=>a+parseFloat(b.temp),0)/bbtLogs.length).toFixed(2)}°` },
              { l:"Min BBT", v:`${Math.min(...bbtLogs.map(b=>parseFloat(b.temp))).toFixed(2)}°` },
              { l:"Max BBT", v:`${Math.max(...bbtLogs.map(b=>parseFloat(b.temp))).toFixed(2)}°` },
            ].map(s=>(
              <div key={s.l} className="wh-card2" style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:900, color:G }}>{s.v}</div>
                <div style={{ fontSize:".62rem", color:TM, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: HEALTH REPORT (NEW beats Clue)
══════════════════════════════════════════════════════════ */
function ReportPage({ cycleDay, cycleLen, mood, energy, water, sleep, supplements, symptoms, moodHistory, bbtLogs, flowLog, fertScore }) {
  const phase = getCyclePhase(cycleDay, cycleLen);
  const taken = supplements.filter(s=>s.taken).length;
  const suppPct = supplements.length ? Math.round((taken/supplements.length)*100) : 0;
  const avgEnergy = moodHistory.length ? Math.round(moodHistory.reduce((a,m)=>a+m.energy,0)/moodHistory.length) : energy;
  const topSymptom = symptoms.sort((a,b)=>{ const SEV=["severe","moderate","mild","low"]; return SEV.indexOf(a.severity)-SEV.indexOf(b.severity); })[0];

  const reportText = `
MANIFIX WOMEN'S HEALTH REPORT
Generated: ${new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CYCLE SUMMARY
• Current cycle day: ${cycleDay} of ${cycleLen}
• Phase: ${phase.name}
• Phase guidance: ${phase.tip}
• Fertility score today: ${fertScore}/100

WELLNESS METRICS
• Mood today: ${mood}
• Average energy (${moodHistory.length} entries): ${avgEnergy}%
• Water intake: ${water}/8 glasses
• Sleep: ${sleep} hours
• Supplement adherence: ${suppPct}% (${taken}/${supplements.length} taken)

TOP SYMPTOMS (${symptoms.length} logged)
${symptoms.slice(0,5).map(s=>`• ${s.name} — ${s.severity} severity`).join("\n") || "• None logged"}

HORMONE STATUS
• Phase support: ${phase.name} phase recommendations active

RECOMMENDATIONS
${energy < 60 ? "• Energy low — consider iron-rich foods, B-vitamins, and consistent sleep schedule\n" : ""}${water < 6 ? `• Drink ${8-water} more glasses of water today\n` : ""}${sleep < 7 ? "• Aim for 7-8 hours of sleep for optimal hormone regulation\n" : ""}${suppPct < 80 ? "• Improve supplement adherence for better results\n" : ""}• Continue tracking for more accurate pattern detection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report is for personal wellness tracking only.
Always consult a healthcare professional for medical advice.
ManifiX Women's Health v8.0 ULTRA GOLD
  `.trim();

  const [copied, setCopied] = useState(false);
  const copyReport = () => {
    navigator.clipboard?.writeText(reportText).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  };

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card">
        <CardHead title="Health Report Generator"
          right={<button className="btn-gold btn-sm" onClick={copyReport}>{copied?"✓ Copied!":"📋 Copy Report"}</button>}/>
        <div className="wh-card2" style={{ marginBottom:14 }}>
          <div style={{ fontSize:".7rem", color:TM, lineHeight:1.6 }}>
            📄 Your personalized health summary. Copy and share with your healthcare provider, or keep for personal records.
          </div>
        </div>
        <pre style={{ fontFamily:"'DM Sans',monospace", fontSize:".75rem", color:TX, lineHeight:1.8, whiteSpace:"pre-wrap",
          background:S2, border:`1px solid ${TD}`, borderRadius:10, padding:16, maxHeight:460, overflowY:"auto" }}>
          {reportText}
        </pre>
      </div>

      {/* Key metrics summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { l:"Phase",       v:phase.name,   c:phase.color },
          { l:"Fertility",   v:`${fertScore}%`, c:fertScore>=40?GBR:G },
          { l:"Adherence",   v:`${suppPct}%`, c:suppPct>=80?"#22c55e":G },
        ].map(s=>(
          <div key={s.l} className="wh-card" style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:".62rem", color:TM, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: INSIGHTS (upgraded)
══════════════════════════════════════════════════════════ */
function InsightsPage({ cycleDay, cycleLen, mood, energy, water, sleep, supplements, selfCare, moodHistory, affIdx, fertScore }) {
  const WGOAL = 8;
  const suppPct = supplements.length ? Math.round((supplements.filter(s=>s.taken).length/supplements.length)*100) : 0;
  const carePct = selfCare.length ? Math.round((selfCare.filter(a=>a.done).length/selfCare.length)*100) : 0;
  const phase = getCyclePhase(cycleDay, cycleLen);
  const aff = AFFIRMATIONS[affIdx % AFFIRMATIONS.length];
  const scores = [
    { label:"Cycle Health",         pct:85 },
    { label:"Mood & Energy",        pct:energy },
    { label:"Hydration",            pct:Math.round((water/WGOAL)*100) },
    { label:"Sleep Quality",        pct:Math.round((sleep/8)*100) },
    { label:"Supplement Adherence", pct:suppPct },
    { label:"Self-Care",            pct:carePct },
    { label:"Fertility Awareness",  pct:fertScore },
  ];
  const overall = Math.round(scores.reduce((a,s)=>a+Math.min(s.pct,100),0)/scores.length);
  const r = 52, circ = 2*Math.PI*r;

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="wh-card" style={{ textAlign:"center", padding:"28px 20px" }}>
        <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
          <svg width={128} height={128}>
            <circle cx={64} cy={64} r={r} fill="none" stroke={TD} strokeWidth={8}/>
            <circle cx={64} cy={64} r={r} fill="none" stroke={G} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${(overall/100)*circ} ${circ}`}
              transform="rotate(-90 64 64)"
              style={{ transition:"stroke-dasharray .7s" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:900, color:G }}>{overall}</div>
            <div style={{ fontSize:".6rem", color:TM, letterSpacing:".1em" }}>WELLNESS</div>
          </div>
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:G, fontStyle:"italic", maxWidth:320, margin:"0 auto", lineHeight:1.6 }}>
          "{aff}"
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="wh-card">
          <CardHead title="Score Breakdown"/>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {scores.map((s,i)=>(
              <div key={i}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:".78rem", color:TM }}>{s.label}</span>
                  <span style={{ fontSize:".75rem", color:G, fontWeight:700 }}>{Math.min(s.pct,100)}%</span>
                </div>
                <Bar pct={s.pct}/>
              </div>
            ))}
          </div>
        </div>
        <div className="wh-card">
          <CardHead title="Recommendations"/>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div className="insight-block">
              <div className="insight-lbl">{phase.name} Phase</div>
              <div className="insight-txt">{phase.tip}</div>
            </div>
            {water < WGOAL-2 && <div className="insight-block">
              <div className="insight-lbl">Hydration</div>
              <div className="insight-txt">Drink {WGOAL-water} more glasses. Supports hormone balance and energy.</div>
            </div>}
            {sleep < 7 && <div className="insight-block">
              <div className="insight-lbl">Sleep</div>
              <div className="insight-txt">Aim for 7-8h. Sleep regulates cortisol, estrogen, and mood.</div>
            </div>}
            {(mood==="Stressed"||mood==="Emotional"||mood==="Irritable") && <div className="insight-block">
              <div className="insight-lbl">Mood Support</div>
              <div className="insight-txt">Deep breathing and journaling lower cortisol. You're doing great.</div>
            </div>}
            {suppPct < 80 && <div className="insight-block">
              <div className="insight-lbl">Supplements</div>
              <div className="insight-txt">Consistency builds results. Check off today's supplements.</div>
            </div>}
            {fertScore > 60 && <div className="insight-block" style={{ borderColor:`${GBR}44` }}>
              <div className="insight-lbl" style={{ color:GBR }}>Fertility Window</div>
              <div className="insight-txt">You're in a high-fertility window. Plan accordingly.</div>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function WomenHealth() {
  useEffect(() => injectCSS(), []);

  const [tab, setTab] = useState("cycle");
  const [affIdx, setAffIdx] = useState(0);

  // Cycle
  const [cycleDay,  setCycleDay]  = useState(()=>ls.get("wh8_day",12));
  const [cycleLen,  setCycleLen]  = useState(()=>ls.get("wh8_len",28));
  const [cycleHistory, setCycleHistory] = useState(()=>ls.get("wh8_hist",[28,29,27,28,30]));
  const [flowLog,   setFlowLog]   = useState(()=>ls.get("wh8_flow",{ 1:"medium", 2:"heavy", 3:"medium", 4:"light", 5:"spotting" }));
  const [pregnancyMode, setPregnancyMode] = useState(()=>ls.get("wh8_preg",false));

  // Fertility
  const [bbtLogs,   setBbtLogs]   = useState(()=>ls.get("wh8_bbt",[]));
  const [mucusLogs, setMucusLogs] = useState(()=>ls.get("wh8_mucus",[]));
  const [lhLogs,    setLhLogs]    = useState(()=>ls.get("wh8_lh",[]));

  // Mood
  const [mood,        setMood]        = useState(()=>ls.get("wh8_mood","Balanced"));
  const [energy,      setEnergy]      = useState(()=>ls.get("wh8_energy",78));
  const [streak,      setStreak]      = useState(()=>ls.get("wh8_streak",18));
  const [moodHistory, setMoodHistory] = useState(()=>ls.get("wh8_moodH",[]));

  // Other
  const [symptoms,    setSymptoms]    = useState(()=>ls.get("wh8_syms",[]));
  const [sexLog,      setSexLog]      = useState(()=>ls.get("wh8_sex",[]));
  const [hormones,    setHormones]    = useState(()=>ls.get("wh8_horm",[
    { name:"Estrogen",     value:65 },
    { name:"Progesterone", value:70 },
    { name:"Cortisol",     value:45 },
    { name:"Serotonin",    value:80 },
    { name:"Testosterone", value:55 },
  ]));
  const [supplements, setSupplements] = useState(()=>ls.get("wh8_supps",DEF_SUPPS));
  const [selfCare,    setSelfCare]    = useState(()=>ls.get("wh8_care",DEF_CARE));
  const [water,       setWater]       = useState(()=>ls.get("wh8_water",6));
  const [sleep,       setSleep]       = useState(()=>ls.get("wh8_sleep",7.5));
  const [programs,    setPrograms]    = useState(()=>ls.get("wh8_progs",DEF_PROGS));
  const [journal,     setJournal]     = useState(()=>ls.get("wh8_journal",[]));

  // Persist
  useEffect(()=>{ ls.set("wh8_day",cycleDay); },[cycleDay]);
  useEffect(()=>{ ls.set("wh8_len",cycleLen); },[cycleLen]);
  useEffect(()=>{ ls.set("wh8_hist",cycleHistory); },[cycleHistory]);
  useEffect(()=>{ ls.set("wh8_flow",flowLog); },[flowLog]);
  useEffect(()=>{ ls.set("wh8_preg",pregnancyMode); },[pregnancyMode]);
  useEffect(()=>{ ls.set("wh8_bbt",bbtLogs); },[bbtLogs]);
  useEffect(()=>{ ls.set("wh8_mucus",mucusLogs); },[mucusLogs]);
  useEffect(()=>{ ls.set("wh8_lh",lhLogs); },[lhLogs]);
  useEffect(()=>{ ls.set("wh8_mood",mood); },[mood]);
  useEffect(()=>{ ls.set("wh8_energy",energy); },[energy]);
  useEffect(()=>{ ls.set("wh8_streak",streak); },[streak]);
  useEffect(()=>{ ls.set("wh8_moodH",moodHistory); },[moodHistory]);
  useEffect(()=>{ ls.set("wh8_syms",symptoms); },[symptoms]);
  useEffect(()=>{ ls.set("wh8_sex",sexLog); },[sexLog]);
  useEffect(()=>{ ls.set("wh8_horm",hormones); },[hormones]);
  useEffect(()=>{ ls.set("wh8_supps",supplements); },[supplements]);
  useEffect(()=>{ ls.set("wh8_care",selfCare); },[selfCare]);
  useEffect(()=>{ ls.set("wh8_water",water); },[water]);
  useEffect(()=>{ ls.set("wh8_sleep",sleep); },[sleep]);
  useEffect(()=>{ ls.set("wh8_progs",programs); },[programs]);
  useEffect(()=>{ ls.set("wh8_journal",journal); },[journal]);

  // Affirmation cycle
  useEffect(()=>{
    const t = setInterval(()=>setAffIdx(i=>(i+1)%AFFIRMATIONS.length), 5000);
    return ()=>clearInterval(t);
  },[]);

  const fertScore = useMemo(()=>calcFertility(cycleDay,cycleLen,bbtLogs,mucusLogs,lhLogs),[cycleDay,cycleLen,bbtLogs,mucusLogs,lhLogs]);
  const phase = getCyclePhase(cycleDay, cycleLen);

  return (
    <div className="wh-app">
      {/* ── SIDEBAR ── */}
      <aside className="wh-sidebar">
        <div className="wh-logo">
          <span style={{ fontSize:"1.3rem" }}>🌸</span>
          <span className="wh-logo-mark">ManifiX</span>
        </div>
        <nav className="wh-nav">
          {TABS.map(({ id, label, emoji }) => (
            <button key={id} className={`wh-nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
              <span style={{ fontSize:"1rem" }}>{emoji}</span>
              {label}
            </button>
          ))}
        </nav>
        {/* Phase indicator at bottom of sidebar */}
        <div style={{ padding:"12px 12px 16px", borderTop:`1px solid ${TD}`, flexShrink:0 }}>
          <div style={{ padding:"10px 12px", borderRadius:10, background:`${phase.color}12`, border:`1px solid ${phase.color}33` }}>
            <div style={{ fontSize:".62rem", color:phase.color, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:3 }}>{phase.icon} {phase.name}</div>
            <div style={{ fontSize:".68rem", color:TM, lineHeight:1.5 }}>Day {cycleDay} · Fertility {fertScore}%</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="wh-main">
        {/* Topbar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:16, borderBottom:`1px solid ${TD}` }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:900, color:TX }}>
              {TABS.find(t=>t.id===tab)?.emoji} {TABS.find(t=>t.id===tab)?.label}
            </div>
            <div style={{ fontSize:".68rem", color:TM, marginTop:2, letterSpacing:".1em", textTransform:"uppercase" }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"long", month:"long", day:"numeric" })}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {pregnancyMode && <span className="gold-badge" style={{ color:"#22c55e", borderColor:"rgba(34,197,94,.4)" }}>🤰 Pregnancy</span>}
            <span className="gold-badge">🔥 {streak}d</span>
            <span className="gold-badge" style={{ color:phase.color, borderColor:`${phase.color}44` }}>{phase.icon} {phase.name}</span>
            <span className="gold-badge">Fertility {fertScore}%</span>
          </div>
        </div>

        {/* Page Content */}
        {tab==="cycle"       && <CyclePage cycleDay={cycleDay} setCycleDay={setCycleDay} cycleLen={cycleLen} setCycleLen={setCycleLen} flowLog={flowLog} pregnancyMode={pregnancyMode} setPregnancyMode={setPregnancyMode} cycleHistory={cycleHistory}/>}
        {tab==="fertility"   && <FertilityPage cycleDay={cycleDay} cycleLen={cycleLen} bbtLogs={bbtLogs} setBbtLogs={setBbtLogs} mucusLogs={mucusLogs} setMucusLogs={setMucusLogs} lhLogs={lhLogs} setLhLogs={setLhLogs} pregnancyMode={pregnancyMode}/>}
        {tab==="flow"        && <FlowPage cycleDay={cycleDay} cycleLen={cycleLen} flowLog={flowLog} setFlowLog={setFlowLog}/>}
        {tab==="mood"        && <MoodPage mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} streak={streak} setStreak={setStreak} moodHistory={moodHistory} setMoodHistory={setMoodHistory}/>}
        {tab==="symptoms"    && <SymptomsPage symptoms={symptoms} setSymptoms={setSymptoms}/>}
        {tab==="sex"         && <SexPage sexLog={sexLog} setSexLog={setSexLog} cycleDay={cycleDay}/>}
        {tab==="hormones"    && <HormonesPage hormones={hormones} setHormones={setHormones} cycleDay={cycleDay} cycleLen={cycleLen}/>}
        {tab==="supplements" && <SupplementsPage supplements={supplements} setSupplements={setSupplements}/>}
        {tab==="selfcare"    && <SelfCarePage selfCare={selfCare} setSelfCare={setSelfCare} water={water} setWater={setWater} sleep={sleep} setSleep={setSleep}/>}
        {tab==="programs"    && <ProgramsPage programs={programs} setPrograms={setPrograms}/>}
        {tab==="journal"     && <JournalPage journal={journal} setJournal={setJournal}/>}
        {tab==="stats"       && <StatsPage cycleLen={cycleLen} cycleHistory={cycleHistory} moodHistory={moodHistory} symptoms={symptoms} bbtLogs={bbtLogs} flowLog={flowLog}/>}
        {tab==="report"      && <ReportPage cycleDay={cycleDay} cycleLen={cycleLen} mood={mood} energy={energy} water={water} sleep={sleep} supplements={supplements} symptoms={symptoms} moodHistory={moodHistory} bbtLogs={bbtLogs} flowLog={flowLog} fertScore={fertScore}/>}
        {tab==="insights"    && <InsightsPage cycleDay={cycleDay} cycleLen={cycleLen} mood={mood} energy={energy} water={water} sleep={sleep} supplements={supplements} selfCare={selfCare} moodHistory={moodHistory} affIdx={affIdx} fertScore={fertScore}/>}

        <div style={{ textAlign:"center", fontSize:".65rem", color:TD, letterSpacing:".12em", textTransform:"uppercase", paddingTop:24, marginTop:8, borderTop:`1px solid ${TD}` }}>
          ManifiX Women's Health v8.0 Ultra Gold · Beats Flo + Clue · 14 Modules
        </div>
      </main>
    </div>
  );
}
