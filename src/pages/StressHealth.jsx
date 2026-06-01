/**
 * ManifiX AI — Stress & Burnout Health Module v3.0
 * UPGRADED: Decisively beats Whoop, Headspace & Oura
 *
 * NEW vs Whoop:    Sleep Coach, Cardiovascular Load, Recovery Timeline, HRV Zones
 * NEW vs Headspace: Ambient Soundscapes, Guided Voice Sessions, Sleep Stories, Session Streaks
 * NEW vs Oura:    Resilience Score, Readiness Ring, Circadian Rhythm, Temperature Proxy
 * KEPT & UPGRADED: Focus Mode, Strain Score, Eat Journal, Breathing, Programs
 */

import {
  useEffect, useState, useCallback, useRef, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar as RBar,
} from "recharts";

/* ═══════════════ TOKENS ═══════════════ */
const G = "#ffc83c";
const DIM = "#c8a84b";
const BG = "#060608";
const CARD = "#0b0b0e";
const CARD2 = "#0f0f13";
const BOR = "#18181f";
const BOR2 = "#222230";
const FONT = "'DM Mono','Courier New',monospace";
const HEAD = "'Bebas Neue',sans-serif";
const GREEN = "#4ade80";
const RED = "#ef4444";
const PURPLE = "#A78BFA";
const BLUE = "#60A5FA";
const ORANGE = "#f97316";
const TEAL = "#2dd4bf";
const PINK = "#f472b6";
const INDIGO = "#818CF8";

/* ═══════════════ GLOBAL CSS ═══════════════ */
function injectCSS() {
  if (document.getElementById("mx-css3")) return;
  const s = document.createElement("style");
  s.id = "mx-css3";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes mx-pulse{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.16;transform:scale(1.1)}}
    @keyframes mx-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes mx-spin{to{transform:rotate(360deg)}}
    @keyframes mx-scan{from{top:-2px}to{top:102%}}
    @keyframes mx-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes mx-glow{0%,100%{box-shadow:0 0 6px #ffc83c22}50%{box-shadow:0 0 18px #ffc83c55}}
    @keyframes mx-hb{0%,100%{transform:scale(1)}15%{transform:scale(1.28)}30%{transform:scale(1)}}
    @keyframes mx-focus-ring{0%{transform:scale(1);opacity:.6}50%{transform:scale(1.04);opacity:.3}100%{transform:scale(1);opacity:.6}}
    @keyframes mx-breathe{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.08);opacity:.7}}
    @keyframes mx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes mx-shimmer{0%{background-position:-200%}100%{background-position:200%}}
    @keyframes mx-ready-ring{0%{stroke-dashoffset:502}to{}}
    @keyframes mx-resilience{0%{opacity:0;transform:scale(.92)}100%{opacity:1;transform:scale(1)}}
    .mx-btn{cursor:pointer;transition:all .14s ease;outline:none}
    .mx-btn:hover{opacity:.88;transform:translateY(-1px)}
    .mx-btn:active{transform:translateY(0) scale(.97)}
    .mx-input{background:#08080c;border:1px solid #18181f;color:#ddd8cc;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.05em;padding:10px 14px;width:100%;outline:none;transition:border-color .2s;resize:none}
    .mx-input:focus{border-color:#ffc83c44}
    .mx-input::placeholder{color:#1a1a22}
    .mx-range{width:100%;accent-color:#ffc83c;height:3px}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#1e1e2a;border-radius:2px}
    .mx-card{background:#0b0b0e;border:1px solid #18181f;transition:border-color .2s}
    .mx-card:hover{border-color:#22222e}
    .mx-hb{animation:mx-hb 1.4s ease-in-out infinite}
    .focus-ring{animation:mx-focus-ring 4s ease-in-out infinite}
    .mx-breathe{animation:mx-breathe 4s ease-in-out infinite}
    .mx-float{animation:mx-float 3s ease-in-out infinite}
    .mx-scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ffc83c33,transparent);animation:mx-scan 3s linear infinite;pointer-events:none}
  `;
  document.head.appendChild(s);
}

/* ═══════════════ PERSISTENCE ═══════════════ */
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : init; } catch { return init; }
  });
  const set = useCallback(val => {
    const next = typeof val === "function" ? val(v) : val;
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, v]);
  return [v, set];
}

/* ═══════════════ STATIC DATA ═══════════════ */
const MOOD_MAP = {
  Overwhelmed:"😰",Anxious:"😟",Tired:"😴",Restless:"🤸",
  "Burned Out":"🔥",Peaceful:"😌",Calm:"🧘",Focused:"🎯",Energized:"⚡",Grateful:"🙏",
};
const MOOD_VALS = {
  Peaceful:10,Calm:9,Energized:9,Focused:8,Grateful:8,Tired:5,
  Restless:4,Anxious:3,"Burned Out":2,Overwhelmed:1,
};
const MOOD_COLS = {
  Peaceful:GREEN,Calm:TEAL,Energized:ORANGE,Focused:BLUE,Grateful:PURPLE,
  Tired:"#888",Restless:G,Anxious:ORANGE,"Burned Out":RED,Overwhelmed:RED,
};

const TRIGGERS = [
  {id:1,label:"Work Pressure",icon:"💼",weight:2.1},
  {id:2,label:"Financial",icon:"💰",weight:2.4},
  {id:3,label:"Relationships",icon:"👥",weight:1.8},
  {id:4,label:"Health Worry",icon:"🫀",weight:2.0},
  {id:5,label:"Poor Sleep",icon:"🌙",weight:2.6},
  {id:6,label:"Caffeine",icon:"☕",weight:1.2},
  {id:7,label:"Social Media",icon:"📱",weight:1.4},
  {id:8,label:"Environment",icon:"🔔",weight:1.1},
  {id:9,label:"Uncertainty",icon:"🌫️",weight:1.9},
  {id:10,label:"Physical Tension",icon:"🏋️",weight:1.5},
];

const PROGRAMS = [
  {id:1,title:"2-Min Calm Reset",duration:2,level:"Quick",emoji:"⏱️",color:TEAL,desc:"Instant nervous-system reset via paced breathing.",steps:["Find a quiet spot","Inhale 4s through nose","Hold 4s","Exhale 6s through mouth","Repeat 8 cycles","Notice the calm"]},
  {id:2,title:"Anxiety Cooldown",duration:7,level:"Popular",emoji:"🧠",color:ORANGE,desc:"Grounding + cognitive reframing for acute anxiety.",steps:["Acknowledge the feeling","Name 5 things you can see","Name 4 things you can touch","Name 3 sounds around you","Challenge one anxious thought","Breathe slowly for 60s","Accept what you cannot control"]},
  {id:3,title:"Deep Breathing",duration:5,level:"Daily",emoji:"💨",color:BLUE,desc:"Activate parasympathetic system fully.",steps:["Place one hand on belly","Breathe in through nose","Feel belly expand fully","Exhale through pursed lips","Feel belly contract","Find your natural rhythm"]},
  {id:4,title:"Sleep Stress Release",duration:10,level:"Night",emoji:"🌙",color:PURPLE,desc:"Progressive relaxation for deep sleep.",steps:["Lie down comfortably","Close your eyes","Scan body from toes upward","Tense each muscle group","Hold for 5 seconds","Release slowly","Notice warmth spreading","Let go of all thoughts"]},
  {id:5,title:"Mindful Walk",duration:5,level:"Movement",emoji:"🚶",color:GREEN,desc:"Movement + mindfulness to reduce cortisol.",steps:["Start walking slowly","Feel each footstep","Notice surroundings in detail","Match breath to steps","Release mental tension","End with 30s gratitude"]},
  {id:6,title:"Desk Decompression",duration:3,level:"Office",emoji:"💻",color:G,desc:"Desk-friendly stress release without leaving your seat.",steps:["Roll shoulders back 5×","Neck stretches side to side","Close eyes, 3 deep breaths","Unclench jaw and fists","Stretch arms overhead","Reset posture mindfully"]},
];

const MEDITATIONS = [
  {id:1,title:"Morning Calm",duration:5,focus:"Start centred",emoji:"🌅",color:ORANGE},
  {id:2,title:"Midday Reset",duration:10,focus:"Release afternoon tension",emoji:"🕛",color:G},
  {id:3,title:"Evening Wind Down",duration:15,focus:"Transition to rest",emoji:"🌙",color:PURPLE},
  {id:4,title:"Panic SOS",duration:3,focus:"Immediate calm",emoji:"🆘",color:RED},
  {id:5,title:"Focus Deepener",duration:7,focus:"Enhance concentration",emoji:"🎯",color:BLUE},
  {id:6,title:"Self-Compassion",duration:12,focus:"Build inner warmth",emoji:"❤️",color:TEAL},
];

const COPING = [
  {id:1,title:"Box Breathing",desc:"4-4-4-4 neural calm pattern",time:"3 min",icon:"🫁"},
  {id:2,title:"5-4-3-2-1 Grounding",desc:"Engage all senses to ground to now",time:"2 min",icon:"🌍"},
  {id:3,title:"Progressive Relaxation",desc:"Systematically release muscle tension",time:"10 min",icon:"💪"},
  {id:4,title:"Thought Reframing",desc:"Challenge and rewrite negative thoughts",time:"5 min",icon:"🧠"},
  {id:5,title:"Body Scan",desc:"Mindful awareness head to toe",time:"8 min",icon:"🔍"},
  {id:6,title:"Gratitude Reset",desc:"Write 3 genuine appreciations",time:"5 min",icon:"🙏"},
];

const DAILY_TIPS = [
  "Hydrate before reaching for caffeine.","Walk 5 minutes after a stressful task.",
  "Avoid doom-scrolling 1hr before bed.","Take one deep breath before replying emotionally.",
  "Stretch your shoulders every hour at desk.","Write 3 things you're grateful for tonight.",
  "Practice 5-4-3-2-1 grounding when overwhelmed.","Name the emotion — naming reduces its intensity by 50%.",
  "Delay decisions when cortisol is high.","Cold water on wrists resets acute panic fast.",
];

const QUIZ = [
  {id:1,q:"How often do you feel overwhelmed?",opts:["Rarely","Sometimes","Often","Always"],w:[1,2,3,4]},
  {id:2,q:"How well do you sleep?",opts:["Very well","Mostly well","Poorly","Very poorly"],w:[1,2,3,4]},
  {id:3,q:"How often do you feel anxious?",opts:["Never","Rarely","Sometimes","Frequently"],w:[1,2,3,4]},
  {id:4,q:"How is your work-life balance?",opts:["Excellent","Good","Fair","Poor"],w:[1,2,3,4]},
  {id:5,q:"Do you have time for self-care?",opts:["Always","Usually","Rarely","Never"],w:[1,2,3,4]},
  {id:6,q:"Do you feel physical tension?",opts:["Rarely","Sometimes","Often","Always"],w:[1,2,3,4]},
];

const GOALS_INIT = [
  {id:1,text:"Complete 3 sessions today",done:false,icon:"🏆"},
  {id:2,text:"Log mood twice today",done:false,icon:"😊"},
  {id:3,text:"Practice breathing 5 min",done:false,icon:"🫁"},
  {id:4,text:"Write one journal entry",done:false,icon:"📓"},
  {id:5,text:"Take a 5-min mindful walk",done:false,icon:"🚶"},
];

const ACHIEVEMENTS_DEFS = [
  {id:"first_log",title:"First Step",desc:"Logged your first mood",icon:"🌱"},
  {id:"streak_7",title:"7-Day Flow",desc:"7 day calm streak",icon:"🔥"},
  {id:"streak_30",title:"Iron Mind",desc:"30 day streak",icon:"💎"},
  {id:"breathe_10",title:"Breath Master",desc:"Completed 10 breathing sessions",icon:"🫁"},
  {id:"journal_10",title:"Self-Aware",desc:"10 journal entries",icon:"📓"},
  {id:"med_5",title:"Still Mind",desc:"5 meditations completed",icon:"🧘"},
  {id:"sleep_7",title:"Sleep Champion",desc:"7 nights of sleep logged",icon:"🌙"},
  {id:"resilience_80",title:"Resilient",desc:"Resilience score over 80",icon:"🛡️"},
];

/* ─── FOCUS PRESETS ─── */
const FOCUS_PRESETS = [
  {id:"deep",label:"Deep Work",work:50,rest:10,icon:"🧠",color:BLUE,desc:"50/10 ultra-focus blocks. For creative and complex tasks.",tip:"Turn off all notifications. Close all browser tabs."},
  {id:"pomodoro",label:"Pomodoro",work:25,rest:5,icon:"🍅",color:ORANGE,desc:"Classic 25/5 Pomodoro. Proven to sustain focus for 4+ hours.",tip:"Start with your hardest task. No multitasking."},
  {id:"sprint",label:"Sprint",work:15,rest:3,icon:"⚡",color:G,desc:"Short sprints for high-stress days. Lower barrier to starting.",tip:"Break daunting tasks into 15-min micro-chunks."},
  {id:"mindful",label:"Mindful Work",work:30,rest:8,icon:"🧘",color:TEAL,desc:"30/8 with a guided mindfulness break.",tip:"During break: 3 breaths, then body scan."},
];

const MINDFUL_BREAKS = [
  {title:"Box Breath",desc:"4s in · 4s hold · 4s out · 4s rest × 4",emoji:"🫁",dur:64},
  {title:"Neck & Shoulder",desc:"Slow neck rolls left → right × 3. Shoulder shrugs × 5.",emoji:"💆",dur:45},
  {title:"Eye Rest",desc:"Look at something 20+ feet away for 20 seconds.",emoji:"👁️",dur:20},
  {title:"Micro Walk",desc:"Stand up. Walk to farthest point in space and back.",emoji:"🚶",dur:60},
  {title:"Gratitude Flash",desc:"Name one genuine appreciation right now. Feel it fully.",emoji:"🙏",dur:30},
];

/* ─── STRAIN DATA ─── */
const ACTIVITIES = [
  {id:1,label:"Work / Study",icon:"💼",mets:1.5,stressMultiplier:1.8},
  {id:2,label:"Running",icon:"🏃",mets:8.0,stressMultiplier:0.4},
  {id:3,label:"Weight Training",icon:"🏋️",mets:6.0,stressMultiplier:0.5},
  {id:4,label:"Yoga",icon:"🧘",mets:2.5,stressMultiplier:0.2},
  {id:5,label:"Cycling",icon:"🚴",mets:7.0,stressMultiplier:0.4},
  {id:6,label:"Commuting",icon:"🚌",mets:2.0,stressMultiplier:1.2},
  {id:7,label:"Social event",icon:"👥",mets:2.0,stressMultiplier:1.0},
  {id:8,label:"Meditation",icon:"🪷",mets:1.2,stressMultiplier:0.1},
  {id:9,label:"Screen time",icon:"📱",mets:1.3,stressMultiplier:1.4},
  {id:10,label:"Sleep",icon:"😴",mets:0.9,stressMultiplier:-1.5},
];

/* ─── STRESS-EATING DATA ─── */
const FOOD_MOODS = ["Anxious","Bored","Stressed","Tired","Lonely","Procrastinating","Celebrating","Hungry (physical)"];
const FOOD_CATEGORIES = [
  {id:"sugar",label:"Sugar / Sweets",icon:"🍬",riskScore:3},
  {id:"salty",label:"Salty Snacks",icon:"🍟",riskScore:2},
  {id:"carbs",label:"Refined Carbs",icon:"🍞",riskScore:2},
  {id:"caffeine",label:"Caffeine",icon:"☕",riskScore:1.5},
  {id:"alcohol",label:"Alcohol",icon:"🍷",riskScore:3},
  {id:"comfort",label:"Comfort Food",icon:"🍕",riskScore:2},
  {id:"healthy",label:"Healthy Food",icon:"🥗",riskScore:0},
  {id:"water",label:"Water / Herbal",icon:"💧",riskScore:-0.5},
];

/* ════════════════════════════════
   NEW: SLEEP DATA (beats Whoop)
════════════════════════════════ */
const SLEEP_STAGES = ["Awake","REM","Light","Deep"];
const SLEEP_STAGE_COLORS = {Awake:RED,REM:PURPLE,Light:BLUE,Deep:INDIGO};

const CIRCADIAN_HOURS = [
  {h:6,label:"6am",energy:20,alertness:15,cortisol:90},
  {h:8,label:"8am",energy:55,alertness:60,cortisol:75},
  {h:10,label:"10am",energy:80,alertness:85,cortisol:50},
  {h:12,label:"12pm",energy:75,alertness:78,cortisol:35},
  {h:14,label:"2pm",energy:55,alertness:50,cortisol:25},
  {h:16,label:"4pm",energy:75,alertness:80,cortisol:30},
  {h:18,label:"6pm",energy:65,alertness:65,cortisol:20},
  {h:20,label:"8pm",energy:45,alertness:40,cortisol:15},
  {h:22,label:"10pm",energy:25,alertness:20,cortisol:10},
  {h:0,label:"12am",energy:10,alertness:8,cortisol:8},
];

/* ════════════════════════════════
   NEW: AMBIENT SOUNDSCAPES (beats Headspace)
════════════════════════════════ */
const SOUNDSCAPES = [
  {id:"rain",label:"Rain Forest",emoji:"🌧️",color:BLUE,freq:432,desc:"Binaural alpha waves · 432hz · stress reduction"},
  {id:"ocean",label:"Deep Ocean",emoji:"🌊",color:TEAL,freq:528,desc:"528hz repair frequency · calm nervous system"},
  {id:"fire",label:"Campfire",emoji:"🔥",color:ORANGE,freq:396,desc:"Grounding brown noise · releases anxiety"},
  {id:"space",label:"Deep Space",emoji:"🌌",color:INDIGO,freq:741,desc:"741hz · mental clarity · problem solving"},
  {id:"forest",label:"Forest Morn",emoji:"🌿",color:GREEN,freq:639,desc:"639hz · emotional balance · relationships"},
  {id:"wind",label:"Mountain Wind",emoji:"🏔️",color:PURPLE,freq:852,desc:"852hz · intuition · spiritual clarity"},
];

/* ════════════════════════════════
   NEW: SLEEP STORIES (beats Headspace)
════════════════════════════════ */
const SLEEP_STORIES = [
  {id:1,title:"The Midnight Lighthouse",emoji:"🏠",duration:18,mood:"Calm",desc:"A lone keeper tends a lighthouse on a fogless night. Each revolution of the light sweeps your thoughts gently out to sea.",color:BLUE},
  {id:2,title:"Forest at 3am",emoji:"🌲",duration:22,mood:"Deep",desc:"Follow a fox through an ancient forest while the rest of the world sleeps. Damp moss, distant owls, total peace.",color:GREEN},
  {id:3,title:"Rain on an Old Train",emoji:"🚂",duration:20,mood:"Cosy",desc:"A slow night train. Rain against glass. The rhythm of rails becomes the rhythm of your breath.",color:PURPLE},
  {id:4,title:"Desert Starfield",emoji:"⭐",duration:15,mood:"Wonder",desc:"Lie in warm sand and count the constellations. The vast universe makes every worry microscopic.",color:INDIGO},
];

/* ════════════════════════════════
   NEW: GUIDED VOICE SESSIONS (beats Headspace)
════════════════════════════════ */
const GUIDED_SESSIONS = [
  {id:1,title:"Morning Intention",emoji:"🌅",duration:8,type:"Morning",color:ORANGE,script:["Take a comfortable seated position. Gently close your eyes.","Feel the weight of your body. Notice three contact points with the seat beneath you.","Set one clear intention for today. Not a task — a way of being.","Breathe in that intention. Let it settle into your chest.","Open your eyes. Carry it with you."]},
  {id:2,title:"Anxiety Dissolve",emoji:"💧",duration:12,type:"Crisis",color:BLUE,script:["You are safe in this moment. Nothing urgent needs to happen right now.","Notice the anxiety as a physical sensation. Where does it live in your body?","Breathe into that exact spot. Not fighting it — just witnessing it.","Each exhale, let 10% of that tension release. Not all at once. Just 10%.","The anxiety is information. Thank it. You don't need to act on it right now."]},
  {id:3,title:"Performance Prep",emoji:"⚡",duration:6,type:"Activating",color:G,script:["You have prepared. This moment is simply the expression of that preparation.","Feel your feet on the floor. You are grounded, stable, ready.","Take two power breaths — full inhale, sharp exhale.","See the outcome you want in vivid detail. Feel it in your body.","You are ready. Go."]},
  {id:4,title:"Compassion Download",emoji:"❤️",duration:15,type:"Healing",color:PINK,script:["Place one hand on your heart. Feel your own warmth.","You have been working hard. You deserve kindness — especially from yourself.","Think of someone who loves you unconditionally. Feel that love.","Now direct that same love inward. You are worthy of it.","Rest here. You are enough, exactly as you are."]},
];

/* ════════════════════════════════
   NEW: OURA-STYLE DATA (beats Oura)
════════════════════════════════ */
const HRV_ZONES = [
  {label:"Recovery",min:60,max:120,color:GREEN,desc:"Excellent recovery. Push hard today."},
  {label:"Balanced",min:45,max:60,color:TEAL,desc:"Good balance. Normal training load."},
  {label:"Moderate",min:30,max:45,color:G,desc:"Moderate stress. Moderate exercise only."},
  {label:"Strained",min:15,max:30,color:ORANGE,desc:"High allostatic load. Prioritise rest."},
  {label:"Critical",min:0,max:15,color:RED,desc:"Recovery deficit. Rest mandatory."},
];

const RESILIENCE_FACTORS = [
  {id:"sleep",label:"Sleep Quality",icon:"🌙",weight:0.28,desc:"Deep sleep % × duration score"},
  {id:"hrv",label:"HRV Trend",icon:"💓",weight:0.24,desc:"7-day HRV vs personal baseline"},
  {id:"activity",label:"Activity Balance",icon:"⚡",weight:0.18,desc:"Strain vs recovery ratio"},
  {id:"mood",label:"Emotional Stability",icon:"🧠",weight:0.16,desc:"Mood consistency over 7 days"},
  {id:"recovery",label:"Recovery Actions",icon:"🛡️",weight:0.14,desc:"Sessions, breathwork, meditation"},
];

/* ═══════════════ SHARED UI ═══════════════ */
const Card = ({children, style={}, className=""}) => (
  <div className={`mx-card ${className}`} style={{padding:20,...style}}>{children}</div>
);
const Label = ({children, style={}}) => (
  <div style={{fontSize:8,letterSpacing:".22em",color:"#252535",textTransform:"uppercase",marginBottom:7,...style}}>{children}</div>
);
const GoldBtn = ({children, onClick, style={}, small=false}) => (
  <button className="mx-btn" onClick={onClick} style={{
    padding:small?"7px 14px":"12px 22px",background:G,color:BG,border:"none",
    fontFamily:FONT,fontSize:small?9:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",...style,
  }}>{children}</button>
);
const GhostBtn = ({children, onClick, color="#333", style={}}) => (
  <button className="mx-btn" onClick={onClick} style={{
    padding:"10px 18px",background:"transparent",border:`1px solid ${BOR2}`,
    color,fontFamily:FONT,fontSize:9,letterSpacing:".15em",textTransform:"uppercase",...style,
  }}>{children}</button>
);
function Bar({pct, color=G, height=4, animated=true}) {
  return (
    <div style={{height,background:"#111118",borderRadius:height,overflow:"hidden",marginTop:6}}>
      <motion.div
        initial={{width:animated?0:undefined}}
        animate={{width:`${Math.min(pct,100)}%`}}
        transition={{duration:1.4,ease:"easeOut"}}
        style={{height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:height}}
      />
    </div>
  );
}
function Pill({children, color=G, active=false, onClick, style={}}) {
  return (
    <button className="mx-btn" onClick={onClick} style={{
      padding:"5px 11px",background:active?`${color}18`:"#111118",
      border:`1px solid ${active?color:BOR}`,color:active?color:"#333",
      fontFamily:FONT,fontSize:9,letterSpacing:".1em",...style,
    }}>{children}</button>
  );
}
function HrvBadge({value}) {
  const zone = value > 55 ? GREEN : value > 40 ? G : RED;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div className="mx-hb" style={{width:8,height:8,borderRadius:"50%",background:zone}} />
      <span style={{fontFamily:HEAD,fontSize:26,color:zone,lineHeight:1}}>{value}</span>
      <span style={{fontSize:8,color:zone,letterSpacing:".08em"}}>ms</span>
    </div>
  );
}
const MxTooltip = ({active,payload,label}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"8px 12px",fontFamily:FONT,fontSize:9,letterSpacing:".08em",color:"#4a4a5a"}}>
      <div style={{color:G,marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||G}}>{p.name}: <span style={{color:"#ddd"}}>{p.value}</span></div>
      ))}
    </div>
  );
};

/* ═══════════════ BREATHING CIRCLE ═══════════════ */
function BreathCircle({active, onToggle, color=G}) {
  const [phase, setPhase] = useState("idle");
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const ref = useRef(null);
  const SEQ = [{l:"Inhale",s:4},{l:"Hold",s:4},{l:"Exhale",s:6},{l:"Rest",s:2}];
  useEffect(() => {
    if (!active) { clearInterval(ref.current); setPhase("idle"); return; }
    let pi = 0, ct = SEQ[0].s;
    setPhase("Inhale"); setCount(ct);
    ref.current = setInterval(() => {
      ct--;
      if (ct < 0) { pi=(pi+1)%SEQ.length; if(pi===0) setCycles(c=>c+1); ct=SEQ[pi].s; setPhase(SEQ[pi].l); }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active]);
  const sz = active ? (phase==="Inhale"?140:phase==="Exhale"?72:105) : 90;
  const dur = phase==="Inhale"?4:phase==="Exhale"?6:1;
  return (
    <div style={{textAlign:"center",padding:"14px 0"}}>
      <div style={{height:170,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <motion.div animate={{width:sz+40,height:sz+40,opacity:active?0.25:0}} transition={{duration:dur,ease:"easeInOut"}}
          style={{position:"absolute",borderRadius:"50%",border:`1px solid ${color}`,pointerEvents:"none"}} />
        <motion.div animate={{width:sz,height:sz}} transition={{duration:dur,ease:"easeInOut"}}
          style={{borderRadius:"50%",background:`${color}15`,border:`2px solid ${color}55`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {active ? (<><div style={{fontFamily:HEAD,fontSize:34,color,lineHeight:1}}>{count}</div>
            <div style={{fontSize:7,letterSpacing:".18em",color:`${color}88`,textTransform:"uppercase"}}>{phase}</div></>
          ) : <div style={{fontSize:30}}>🫁</div>}
        </motion.div>
      </div>
      {active && <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a3a",textTransform:"uppercase",marginBottom:10}}>Cycles: {cycles}</div>}
      <button className="mx-btn" onClick={onToggle} style={{
        padding:"10px 26px",background:active?"transparent":color,
        color:active?RED:BG,border:active?`1px solid ${RED}`:"none",
        fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>
        {active ? "⏹ Stop" : "▶ Start Exercise"}
      </button>
    </div>
  );
}

/* ═══════════════ SOS OVERLAY ═══════════════ */
function SosOverlay({onClose}) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(4);
  const ref = useRef(null);
  const SEQ = [{l:"Inhale",s:4},{l:"Hold",s:4},{l:"Exhale",s:6},{l:"Rest",s:2}];
  useEffect(() => {
    let pi=0, ct=4;
    ref.current = setInterval(() => {
      ct--;
      if(ct<0){pi=(pi+1)%SEQ.length;ct=SEQ[pi].s;setPhase(SEQ[pi].l);}
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const sz = phase==="Inhale"?200:phase==="Exhale"?100:160;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:200,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div className="mx-scan-line"/>
      <motion.div initial={{scale:.9,y:20}} animate={{scale:1,y:0}} transition={{type:"spring",stiffness:200}}>
        <div style={{textAlign:"center",maxWidth:380}}>
          <div style={{fontFamily:HEAD,fontSize:42,color:RED,letterSpacing:".06em",lineHeight:1}}>SOS CALM MODE</div>
          <div style={{fontSize:8,letterSpacing:".22em",color:"#2a2a3a",textTransform:"uppercase",margin:"8px 0 36px"}}>3-min emergency protocol · Follow the circle</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:36}}>
            <div style={{position:"relative",width:240,height:240,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <motion.div animate={{width:sz+40,height:sz+40,opacity:.15}} transition={{duration:phase==="Inhale"?4:phase==="Exhale"?6:1,ease:"easeInOut"}}
                style={{position:"absolute",borderRadius:"50%",border:"1px solid rgba(239,68,68,.5)"}}/>
              <motion.div animate={{width:sz,height:sz}} transition={{duration:phase==="Inhale"?4:phase==="Exhale"?6:1,ease:"easeInOut"}}
                style={{borderRadius:"50%",background:"rgba(239,68,68,.12)",border:"2px solid rgba(239,68,68,.35)",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontFamily:HEAD,fontSize:44,color:RED,lineHeight:1}}>{count}</div>
                <div style={{fontSize:9,letterSpacing:".15em",color:"rgba(239,68,68,.5)",textTransform:"uppercase"}}>{phase}</div>
              </motion.div>
            </div>
          </div>
          <GhostBtn onClick={onClose} color="#2a2a3a">Exit SOS Mode</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════ BURNOUT RADAR ═══════════════ */
function BurnoutRadar({score, hrvLast, moods}) {
  const moodAvg = moods.length ? moods.slice(-7).reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/Math.min(moods.length,7) : 5;
  const data = [
    {axis:"Emotional",value:Math.round(Math.max(0,10-moodAvg)*10)},
    {axis:"Physical",value:Math.round(score*0.7)},
    {axis:"Mental",value:Math.round(score*0.85)},
    {axis:"Social",value:Math.round((10-moodAvg)*9)},
    {axis:"Recovery",value:Math.round(Math.max(0,70-((hrvLast||50)-50)*1.5))},
    {axis:"Purpose",value:Math.round(score*0.5)},
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} cx="50%" cy="50%">
        <PolarGrid stroke="#1a1a2a"/>
        <PolarAngleAxis dataKey="axis" tick={{fontSize:8,fill:"#333",fontFamily:FONT,letterSpacing:".1em"}}/>
        <Radar dataKey="value" stroke={G} fill={G} fillOpacity={0.12} strokeWidth={2} dot={{fill:G,r:3}}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════ PROGRAM OVERLAY ═══════════════ */
function ProgramOverlay({prog, time, step, running, onPause, onResume, onStop}) {
  const pct = (time/(prog.duration*60))*100;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:150,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="mx-scan-line"/>
      <motion.div initial={{scale:.94,y:20}} animate={{scale:1,y:0}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:420,width:"100%"}}>
        <div style={{fontSize:40,marginBottom:10}}>{prog.emoji}</div>
        <div style={{fontFamily:HEAD,fontSize:36,color:"#e8e4d9",marginBottom:2}}>{prog.title}</div>
        <div style={{fontSize:8,letterSpacing:".2em",color:"#252535",textTransform:"uppercase",marginBottom:24}}>
          Step {step+1} / {prog.steps.length}
        </div>
        <div style={{position:"relative",width:180,height:180,margin:"0 auto 24px"}}>
          <svg viewBox="0 0 180 180" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="#111118" strokeWidth="6"/>
            <circle cx="90" cy="90" r="80" fill="none" stroke={prog.color||G} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .5s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:HEAD,fontSize:44,color:prog.color||G,lineHeight:1}}>{Math.floor(time/60)}:{String(time%60).padStart(2,"0")}</div>
          </div>
        </div>
        <motion.div key={step} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 20px",marginBottom:14,fontSize:13,color:"#3a3a4a",lineHeight:1.8}}>
          {prog.steps[step]}
        </motion.div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:18}}>
          {prog.steps.map((_,i)=>(
            <div key={i} style={{height:3,width:28,borderRadius:2,background:i<step?G:i===step?`${G}88`:"#1a1a2a",transition:"background .3s"}}/>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="mx-btn" onClick={running?onPause:onResume} style={{
            padding:"12px 22px",background:`${(prog.color||G)}22`,border:`1px solid ${(prog.color||G)}44`,
            color:prog.color||G,fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>
            {running?"⏸ Pause":"▶ Resume"}
          </button>
          <GhostBtn onClick={onStop}>✕ Stop</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════ MEDITATION OVERLAY ═══════════════ */
function MedOverlay({med, time, running, onToggle, onStop}) {
  const pct = (time/(med.duration*60))*100;
  const remaining = med.duration*60-time;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.96)",zIndex:140,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <motion.div initial={{scale:.94}} animate={{scale:1}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:360,width:"100%"}}>
        <div style={{fontSize:44,marginBottom:12}}>{med.emoji}</div>
        <div style={{fontFamily:HEAD,fontSize:34,color:"#e8e4d9",marginBottom:3}}>{med.title}</div>
        <div style={{fontSize:9,letterSpacing:".18em",color:"#2a2a3a",textTransform:"uppercase",marginBottom:32}}>{med.focus}</div>
        <div style={{position:"relative",width:200,height:200,margin:"0 auto 28px"}}>
          <svg viewBox="0 0 200 200" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="#111118" strokeWidth="5"/>
            <circle cx="100" cy="100" r="88" fill="none" stroke={med.color||PURPLE} strokeWidth="5"
              strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .5s linear"}}/>
          </svg>
          <motion.div animate={running?{scale:[1,1.06,1]}:{}} transition={{duration:8,repeat:Infinity,ease:"easeInOut"}}
            style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:HEAD,fontSize:48,color:med.color||PURPLE,lineHeight:1}}>
              {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}
            </div>
          </motion.div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="mx-btn" onClick={onToggle} style={{
            padding:"12px 22px",background:`${med.color||PURPLE}22`,border:`1px solid ${med.color||PURPLE}44`,
            color:med.color||PURPLE,fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>
            {running?"⏸ Pause":"▶ Resume"}
          </button>
          <GhostBtn onClick={onStop}>✕ Stop</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════ FOCUS OVERLAY ═══════════════ */
function FocusOverlay({preset, phase, timeLeft, round, sessionsDone, onPause, onResume, running, onStop, breakTask}) {
  const isWork = phase === "work";
  const total = isWork ? preset.work*60 : preset.rest*60;
  const elapsed = total - timeLeft;
  const pct = (elapsed/total)*100;
  const col = isWork ? preset.color : TEAL;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:isWork?"#040408":"#040808",zIndex:160,
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div className="mx-scan-line"/>
      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",
        width:500,height:300,background:`radial-gradient(ellipse,${col}08 0%,transparent 68%)`,pointerEvents:"none"}}/>
      <motion.div initial={{scale:.94,y:20}} animate={{scale:1,y:0}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:440,width:"100%",padding:24}}>
        <div style={{fontSize:9,letterSpacing:".3em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:8}}>
          {isWork ? `ROUND ${round} · FOCUS SESSION` : "MINDFUL BREAK"}
        </div>
        <div style={{fontFamily:HEAD,fontSize:44,color:col,lineHeight:1,marginBottom:4}}>
          {isWork ? preset.label.toUpperCase() : "BREAK TIME"}
        </div>
        <div style={{position:"relative",width:220,height:220,margin:"24px auto"}}>
          <svg viewBox="0 0 220 220" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="110" cy="110" r="100" fill="none" stroke="#0e0e14" strokeWidth="6"/>
            <circle cx="110" cy="110" r="100" fill="none" stroke={col} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*100}`}
              strokeDashoffset={`${2*Math.PI*100*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .9s linear"}}/>
            <circle cx="110" cy="110" r="108" fill="none" stroke={`${col}18`} strokeWidth="1" className="focus-ring"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontFamily:HEAD,fontSize:58,color:col,lineHeight:1}}>
              {String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}
            </div>
            <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase"}}>
              {isWork ? `${preset.work}min session` : `${preset.rest}min break`}
            </div>
          </div>
        </div>
        {!isWork && breakTask && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            style={{background:CARD,border:`1px solid ${TEAL}22`,padding:"14px 20px",marginBottom:18,fontSize:12,color:"#3a3a4a",lineHeight:1.8}}>
            <div style={{fontSize:8,color:TEAL,letterSpacing:".2em",textTransform:"uppercase",marginBottom:5}}>{breakTask.emoji} Break Activity</div>
            <strong style={{color:"#ccc"}}>{breakTask.title}:</strong> {breakTask.desc}
          </motion.div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
          {[...Array(round)].map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<sessionsDone?col:`${col}25`,transition:"background .3s"}}/>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="mx-btn" onClick={running?onPause:onResume} style={{
            padding:"12px 26px",background:`${col}20`,border:`1px solid ${col}40`,
            color:col,fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>
            {running?"⏸ Pause":"▶ Resume"}
          </button>
          <GhostBtn onClick={onStop}>✕ End Session</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════
   NEW: STRAIN RING COMPONENT
════════════════════════════════ */
function StrainRing({strain, recovery, size=180}) {
  const strainPct = Math.min(strain/21*100, 100);
  const recovPct = Math.min(recovery, 100);
  const strainCol = strain>17?RED:strain>13?ORANGE:strain>8?G:GREEN;
  const recovCol = recovery>66?GREEN:recovery>33?G:RED;
  const r = (size/2)-14;
  const circ = 2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111118" strokeWidth="5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={recovCol} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ*(1-recovPct/100)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1.4s ease"}}/>
        <circle cx={size/2} cy={size/2} r={r-12} fill="none" stroke="#111118" strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r-12} fill="none" stroke={strainCol} strokeWidth="4"
          strokeDasharray={circ-75} strokeDashoffset={(circ-75)*(1-strainPct/100)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1.4s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <div style={{fontFamily:HEAD,fontSize:38,color:strainCol,lineHeight:1}}>{strain.toFixed(1)}</div>
        <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e2e",textTransform:"uppercase"}}>Strain</div>
        <div style={{fontSize:9,color:recovCol,letterSpacing:".08em",marginTop:2}}>{recovery}% Rec</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   NEW: READINESS RING (beats Oura)
════════════════════════════════ */
function ReadinessRing({score, size=200}) {
  const col = score>=80?GREEN:score>=60?TEAL:score>=40?G:score>=20?ORANGE:RED;
  const label = score>=80?"Peak":score>=60?"Good":score>=40?"Fair":score>=20?"Poor":"Low";
  const r = size/2-10;
  const circ = 2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111118" strokeWidth="8"/>
        {/* Score arc */}
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={circ} initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:circ*(1-score/100)}}
          transition={{duration:2,ease:"easeOut"}} strokeLinecap="round"/>
        {/* Inner glow ring */}
        <circle cx={size/2} cy={size/2} r={r-14} fill="none" stroke={`${col}12`} strokeWidth="1"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:.5,duration:.6}}>
          <div style={{fontFamily:HEAD,fontSize:size===200?52:38,color:col,lineHeight:1,textAlign:"center"}}>{score}</div>
          <div style={{fontSize:9,letterSpacing:".2em",color:"#1e1e2e",textTransform:"uppercase",textAlign:"center",marginTop:4}}>{label}</div>
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   NEW: SOUNDSCAPE PLAYER (beats Headspace)
════════════════════════════════ */
function SoundscapePlayer({soundscapes}) {
  const [active, setActive] = useState(null);
  const [volume, setVolume] = useState(60);
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const nodesRef = useRef([]);

  const stopAll = useCallback(() => {
    nodesRef.current.forEach(n => { try { n.stop(); n.disconnect(); } catch {} });
    nodesRef.current = [];
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setPlaying(false);
  }, []);

  const playSound = useCallback((sc) => {
    stopAll();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = volume / 100;
      master.connect(ctx.destination);
      // Brown noise base
      const bufSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i]; data[i] *= 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = sc.id === "rain" ? 3000 : sc.id === "ocean" ? 800 : sc.id === "fire" ? 600 : sc.id === "forest" ? 2000 : sc.id === "wind" ? 4000 : 1200;
      src.connect(filter); filter.connect(master);
      // Binaural tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g1 = ctx.createGain(); const g2 = ctx.createGain();
      g1.gain.value = 0.04; g2.gain.value = 0.04;
      osc1.frequency.value = sc.freq;
      osc2.frequency.value = sc.freq + 8;
      osc1.connect(g1); g1.connect(master);
      osc2.connect(g2); g2.connect(master);
      const merger = ctx.createChannelMerger(2);
      src.start(); osc1.start(); osc2.start();
      nodesRef.current = [src, osc1, osc2];
      setActive(sc); setPlaying(true);
    } catch (e) { console.warn("Audio API not available"); setActive(sc); setPlaying(true); }
  }, [volume, stopAll]);

  useEffect(() => () => stopAll(), []);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {soundscapes.map(sc => (
          <button key={sc.id} className="mx-btn" onClick={() => active?.id===sc.id && playing ? stopAll() : playSound(sc)}
            style={{padding:"14px 10px",background:active?.id===sc.id&&playing?`${sc.color}18`:"#0b0b0e",
              border:`1px solid ${active?.id===sc.id&&playing?sc.color:BOR}`,
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,position:"relative",overflow:"hidden"}}>
            {active?.id===sc.id&&playing&&(
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${sc.color},transparent)`,
                animation:"mx-scan 1.5s linear infinite"}}/>
            )}
            <span style={{fontSize:22}}>{sc.emoji}</span>
            <span style={{fontSize:9,color:active?.id===sc.id&&playing?sc.color:"#333",letterSpacing:".08em",textAlign:"center"}}>{sc.label}</span>
            <span style={{fontSize:7,color:"#1e1e2e",textAlign:"center",lineHeight:1.4}}>{sc.freq}hz</span>
            {active?.id===sc.id&&playing&&<span style={{fontSize:7,color:sc.color}}>▶ PLAYING</span>}
          </button>
        ))}
      </div>
      {playing && active && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:CARD,border:`1px solid ${active.color}22`,padding:"12px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:active.color}}>{active.emoji} {active.label}</div>
              <div style={{fontSize:8,color:"#1e1e2e",marginTop:2}}>{active.desc}</div>
            </div>
            <button className="mx-btn" onClick={stopAll}
              style={{padding:"5px 10px",background:`${RED}12`,border:`1px solid ${RED}33`,color:RED,fontFamily:FONT,fontSize:8}}>■ STOP</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:9,color:"#1e1e2e"}}>VOL</span>
            <input type="range" min="0" max="100" value={volume} onChange={e=>{setVolume(Number(e.target.value));}} className="mx-range" style={{flex:1}}/>
            <span style={{fontSize:9,color:active.color}}>{volume}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   NEW: GUIDED SESSION OVERLAY (beats Headspace)
════════════════════════════════ */
function GuidedOverlay({session, onClose}) {
  const [step, setStep] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const ref = useRef(null);
  const stepDur = Math.round((session.duration * 60) / session.script.length);

  useEffect(() => {
    if (!running) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setTime(t => {
        const nt = t + 1;
        const ns = Math.min(Math.floor(nt / stepDur), session.script.length - 1);
        setStep(ns);
        return nt;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, stepDur, session]);

  const pct = (time / (session.duration * 60)) * 100;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(2,2,8,.98)",zIndex:170,
        display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} transition={{type:"spring"}}
        style={{maxWidth:440,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:9,letterSpacing:".28em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:8}}>{session.type} SESSION</div>
        <div style={{fontSize:48,marginBottom:8}} className="mx-float">{session.emoji}</div>
        <div style={{fontFamily:HEAD,fontSize:36,color:"#e8e4d9",marginBottom:24}}>{session.title}</div>
        {/* Progress arc */}
        <div style={{position:"relative",width:160,height:160,margin:"0 auto 28px"}}>
          <svg viewBox="0 0 160 160" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="80" cy="80" r="70" fill="none" stroke="#111118" strokeWidth="5"/>
            <circle cx="80" cy="80" r="70" fill="none" stroke={session.color} strokeWidth="5"
              strokeDasharray={`${2*Math.PI*70}`} strokeDashoffset={`${2*Math.PI*70*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .8s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:2}}>step</div>
            <div style={{fontFamily:HEAD,fontSize:44,color:session.color,lineHeight:1}}>{step+1}</div>
            <div style={{fontSize:7,color:"#1e1e2e"}}>of {session.script.length}</div>
          </div>
        </div>
        <motion.div key={step} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.5}}
          style={{background:CARD,border:`1px solid ${session.color}22`,padding:"20px 24px",marginBottom:20,
            fontSize:14,color:"#4a4a6a",lineHeight:2,letterSpacing:".03em",minHeight:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {session.script[step]}
        </motion.div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="mx-btn" onClick={()=>setRunning(r=>!r)} style={{
            padding:"12px 24px",background:`${session.color}20`,border:`1px solid ${session.color}40`,
            color:session.color,fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>
            {running?"⏸ Pause":"▶ Resume"}
          </button>
          <GhostBtn onClick={onClose}>✕ Close</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════
   NEW: SLEEP COACH OVERLAY (beats Whoop)
════════════════════════════════ */
function SleepCoachModal({onClose, onSave}) {
  const [form, setForm] = useState({
    bedtime:"22:30", wakeTime:"06:30",
    deepPct:20, remPct:25,
    quality:7, dreams:false, wakeUps:1,
    notes:""
  });

  const totalMins = (() => {
    const [bh,bm]=form.bedtime.split(":").map(Number);
    const [wh,wm]=form.wakeTime.split(":").map(Number);
    let mins = (wh*60+wm) - (bh*60+bm);
    if(mins<0) mins+=1440;
    return mins;
  })();
  const hrs = (totalMins/60).toFixed(1);
  const sleepScore = Math.round(
    (Math.min(totalMins,480)/480)*40 +
    (form.deepPct/25)*25 +
    (form.remPct/30)*20 +
    (form.quality/10)*15
  );
  const sleepCol = sleepScore>75?GREEN:sleepScore>55?G:sleepScore>35?ORANGE:RED;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} onClick={e=>e.stopPropagation()}
        style={{background:CARD,border:`1px solid ${BOR}`,padding:26,maxWidth:500,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:HEAD,fontSize:24,color:INDIGO}}>🌙 SLEEP COACH</div>
          <button className="mx-btn" onClick={onClose} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
        </div>

        {/* Sleep score preview */}
        <div style={{background:"#08080e",border:`1px solid ${INDIGO}22`,padding:"16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:4}}>Sleep Score Preview</div>
            <div style={{fontFamily:HEAD,fontSize:44,color:sleepCol,lineHeight:1}}>{sleepScore}</div>
            <div style={{fontSize:8,color:sleepCol,marginTop:2}}>{hrs}h total · {form.deepPct}% deep</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,textAlign:"right"}}>
            {[
              {label:"Duration",val:`${hrs}h`,target:"7-9h",ok:totalMins>=420&&totalMins<=540},
              {label:"Deep Sleep",val:`${form.deepPct}%`,target:"15-25%",ok:form.deepPct>=15&&form.deepPct<=25},
              {label:"REM",val:`${form.remPct}%`,target:"20-25%",ok:form.remPct>=20&&form.remPct<=25},
            ].map(({label,val,target,ok})=>(
              <div key={label} style={{fontSize:8,color:ok?GREEN:ORANGE}}>
                {ok?"✓":"⚠"} {label}: {val} <span style={{color:"#1e1e2e"}}>(target {target})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {[
            {label:"Bedtime",key:"bedtime",type:"time"},
            {label:"Wake Time",key:"wakeTime",type:"time"},
          ].map(({label,key,type})=>(
            <div key={key}>
              <Label>{label}</Label>
              <input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                className="mx-input" style={{colorScheme:"dark"}}/>
            </div>
          ))}
        </div>

        <Label>Deep Sleep %: {form.deepPct}%</Label>
        <input type="range" min="5" max="40" value={form.deepPct} onChange={e=>setForm(p=>({...p,deepPct:Number(e.target.value)}))} className="mx-range" style={{width:"100%",marginBottom:14}}/>

        <Label>REM Sleep %: {form.remPct}%</Label>
        <input type="range" min="5" max="40" value={form.remPct} onChange={e=>setForm(p=>({...p,remPct:Number(e.target.value)}))} className="mx-range" style={{width:"100%",marginBottom:14}}/>

        <Label>Sleep Quality: {form.quality}/10</Label>
        <input type="range" min="1" max="10" value={form.quality} onChange={e=>setForm(p=>({...p,quality:Number(e.target.value)}))} className="mx-range" style={{width:"100%",marginBottom:14}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Label style={{marginBottom:0}}>Wake-ups during night</Label>
          <div style={{display:"flex",gap:6}}>
            {[0,1,2,3,4].map(n=>(
              <button key={n} className="mx-btn" onClick={()=>setForm(p=>({...p,wakeUps:n}))}
                style={{width:28,height:28,background:form.wakeUps===n?`${INDIGO}20`:"#0e0e14",
                  border:`1px solid ${form.wakeUps===n?INDIGO:BOR}`,color:form.wakeUps===n?INDIGO:"#333",fontFamily:FONT,fontSize:10}}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <textarea className="mx-input" rows={2} placeholder="Dreams? Anything you noticed about sleep quality..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:14}}/>

        <GoldBtn onClick={()=>onSave({...form,totalMins,sleepScore,date:new Date().toISOString()})} style={{width:"100%",background:INDIGO}}>
          Save Sleep Log
        </GoldBtn>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function Stress() {
  const [tab, setTab] = useState("home");
  const [stressScore, setScore] = useState(()=>Number(localStorage.getItem("mx_score")||62));
  const [streak, setStreak] = useLS("mx_streak", 0);
  const [moods, setMoods] = useLS("mx_moods", []);
  const [journal, setJournal] = useLS("mx_journal", []);
  const [goals, setGoals] = useLS("mx_goals", GOALS_INIT);
  const [activeTriggers, setAT] = useLS("mx_triggers", []);
  const [hrvData, setHrv] = useLS("mx_hrv", []);
  const [unlockedAch, setUnlocked] = useLS("mx_ach", []);
  const [sessCount, setSessCount] = useLS("mx_sess", 0);
  const [medCount, setMedCount] = useLS("mx_meds", 0);
  const [focusSessions, setFocusSessions] = useLS("mx_focus_sessions", []);
  const [strainLog, setStrainLog] = useLS("mx_strain_log", []);
  const [eatLog, setEatLog] = useLS("mx_eat_log", []);
  // NEW persistent
  const [sleepLog, setSleepLog] = useLS("mx_sleep_log", []);

  const [selMood, setSelMood] = useState(null);
  const [showSOS, setShowSOS] = useState(false);
  const [activeProgram, setAP] = useState(null);
  const [progRunning, setProgR] = useState(false);
  const [progTime, setProgT] = useState(0);
  const [progStep, setProgS] = useState(0);
  const [breathActive, setBrA] = useState(false);
  const [breathColor, setBrC] = useState(G);
  const [medActive, setMedA] = useState(null);
  const [medTime, setMedT] = useState(0);
  const [medRunning, setMedR] = useState(false);
  const [showJModal, setJModal] = useState(false);
  const [jForm, setJForm] = useState({trigger:[],mood:"",intensity:5,notes:""});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizA, setQuizA] = useState({});
  const [quizDone, setQuizDone] = useState(false);
  const [selCoping, setSelCoping] = useState(null);
  const [copingRun, setCopingR] = useState(false);
  const [copingTime, setCopingT] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [cortisol, setCortisol] = useState(14);
  const [forecast, setForecast] = useState(null);
  const [newAch, setNewAch] = useState(null);
  const [breathMode, setBreathMode] = useState("4-4-6-2");
  // FOCUS
  const [focusPreset, setFocusPreset] = useState(FOCUS_PRESETS[1]);
  const [focusPhase, setFocusPhase] = useState("idle");
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [focusRound, setFocusRound] = useState(1);
  const [focusSessionsDone, setFocusSessionsDone] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusBreakTask, setFocusBreakTask] = useState(null);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  const [focusTotalToday, setFocusTotalToday] = useState(0);
  // STRAIN
  const [strainForm, setStrainForm] = useState({actId:null,duration:30,effort:5,stressLevel:5});
  const [todayStrain, setTodayStrain] = useState(0);
  const [todayRecovery, setTodayRecovery] = useState(68);
  const [showStrainForm, setShowStrainForm] = useState(false);
  // EAT
  const [showEatModal, setShowEatModal] = useState(false);
  const [eatForm, setEatForm] = useState({mood:"",food:"",hunger:3,notes:""});
  const [eatPatterns, setEatPatterns] = useState({});
  // NEW: SLEEP
  const [showSleepModal, setShowSleepModal] = useState(false);
  // NEW: GUIDED SESSION
  const [activeGuided, setActiveGuided] = useState(null);
  // NEW: RESILIENCE
  const [resilienceScore, setResilienceScore] = useState(0);
  // NEW: HRV Zone
  const [currentHrvZone, setCurrentHrvZone] = useState(null);

  const progRef = useRef(null);
  const medRef = useRef(null);
  const copRef = useRef(null);
  const hrvRef = useRef(null);
  const focusRef = useRef(null);

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    const id = setInterval(()=>setTipIdx(i=>(i+1)%DAILY_TIPS.length), 5000);
    return ()=>clearInterval(id);
  }, []);
  useEffect(() => {
    const collect = () => {
      const base = 55-stressScore*0.25;
      const v = Math.max(25, base+(Math.random()-0.5)*18);
      const rounded = Math.round(v);
      setHrv(p=>[...p.slice(-20),{
        time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        value:rounded, stress:Math.round(Math.max(0,100-v*1.4)),
      }]);
      // Set HRV zone
      const zone = HRV_ZONES.find(z=>rounded>=z.min&&rounded<z.max)||HRV_ZONES[2];
      setCurrentHrvZone(zone);
    };
    collect();
    hrvRef.current = setInterval(collect, 22000);
    return ()=>clearInterval(hrvRef.current);
  }, [stressScore]);
  useEffect(() => {
    const h=new Date().getHours(), d=new Date().getDay();
    const weekday=d>=1&&d<=5;
    const morningBase=weekday?52:30;
    setForecast({
      morning:Math.round(morningBase+Math.random()*8),
      afternoon:Math.round(morningBase+(h>=10&&h<=18?18:-8)+Math.random()*12),
      evening:Math.round(morningBase-14+Math.random()*10),
      tip:weekday&&morningBase>50?"Elevated weekday stress forecast. Schedule 2 breathing sessions.":"Lighter stress expected. Great day for deeper meditation.",
      emoji:weekday?"⚡":"🌿",
    });
  }, []);

  // Resilience score calculation (beats Oura)
  useEffect(() => {
    const hrvLast = hrvData.length ? hrvData[hrvData.length-1].value : 48;
    const sleepScore = sleepLog.length ? sleepLog[sleepLog.length-1].sleepScore : 60;
    const moodAvg = moods.length ? moods.slice(-7).reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/Math.min(7,moods.length)*10 : 50;
    const activityScore = Math.max(0,100-(todayStrain*2));
    const recoveryActions = Math.min(100,(sessCount+medCount)*8);
    const score = Math.round(
      sleepScore*0.28 + (Math.min(hrvLast,80)/80*100)*0.24 + activityScore*0.18 + moodAvg*0.16 + recoveryActions*0.14
    );
    setResilienceScore(Math.min(100,score));
  }, [hrvData,sleepLog,moods,todayStrain,sessCount,medCount]);

  // Achievement checks
  useEffect(() => {
    const toCheck = [
      {id:"first_log",cond:moods.length>=1},{id:"streak_7",cond:streak>=7},{id:"streak_30",cond:streak>=30},
      {id:"breathe_10",cond:sessCount>=10},{id:"journal_10",cond:journal.length>=10},{id:"med_5",cond:medCount>=5},
      {id:"sleep_7",cond:sleepLog.length>=7},{id:"resilience_80",cond:resilienceScore>=80},
    ];
    toCheck.forEach(({id,cond})=>{
      if(cond&&!unlockedAch.includes(id)){
        setUnlocked(p=>[...p,id]);
        const def=ACHIEVEMENTS_DEFS.find(a=>a.id===id);
        if(def){setNewAch(def);setTimeout(()=>setNewAch(null),4000);}
      }
    });
  }, [moods,streak,sessCount,journal,medCount,sleepLog,resilienceScore]);

  // Eat patterns
  useEffect(() => {
    const patterns = {};
    eatLog.forEach(e=>{
      if(!patterns[e.mood]) patterns[e.mood]={count:0,foods:{},totalHunger:0};
      patterns[e.mood].count++; patterns[e.mood].totalHunger+=e.hunger||3;
      if(e.food){patterns[e.mood].foods[e.food]=(patterns[e.mood].foods[e.food]||0)+1;}
    });
    setEatPatterns(patterns);
  }, [eatLog]);

  // Strain calc
  useEffect(() => {
    const today = new Date().toDateString();
    const todayLogs = strainLog.filter(l=>new Date(l.date).toDateString()===today);
    const strain = todayLogs.reduce((sum,l)=>{
      const act = ACTIVITIES.find(a=>a.id===l.actId);
      if(!act) return sum;
      const load = (act.mets * l.duration / 60) * (l.effort/5) * (1 + act.stressMultiplier*0.3);
      return sum+load;
    }, 0);
    const sleepBonus = sleepLog.length ? (sleepLog[sleepLog.length-1].sleepScore||60)*0.05 : 0;
    setTodayStrain(Math.min(21, strain));
    const recovery = Math.max(0, Math.min(100, 100 - strain*3.8 - (stressScore*0.2) + (60-stressScore)*0.1 + sleepBonus));
    setTodayRecovery(Math.round(recovery));
  }, [strainLog, stressScore, sleepLog]);

  // Focus timer
  useEffect(() => {
    if (!focusRunning) { clearInterval(focusRef.current); return; }
    focusRef.current = setInterval(()=>{
      setFocusTimeLeft(prev=>{
        if(prev<=1){
          const nextPhase = focusPhase==="work" ? "break" : "work";
          if(focusPhase==="work"){
            setFocusSessionsDone(d=>d+1);
            setFocusTotalToday(t=>t+focusPreset.work);
            setFocusBreakTask(MINDFUL_BREAKS[Math.floor(Math.random()*MINDFUL_BREAKS.length)]);
          }
          if(focusPhase==="break") setFocusRound(r=>r+1);
          setFocusPhase(nextPhase);
          return nextPhase==="work" ? focusPreset.work*60 : focusPreset.rest*60;
        }
        return prev-1;
      });
    }, 1000);
    return ()=>clearInterval(focusRef.current);
  }, [focusRunning, focusPhase, focusPreset]);

  const startFocus = useCallback((preset)=>{
    setFocusPreset(preset); setFocusPhase("work"); setFocusTimeLeft(preset.work*60);
    setFocusRound(1); setFocusSessionsDone(0); setFocusRunning(true); setShowFocusOverlay(true);
  },[]);
  const stopFocus = useCallback(()=>{
    clearInterval(focusRef.current); setFocusRunning(false); setFocusPhase("idle"); setShowFocusOverlay(false);
    if(focusSessionsDone>0) setFocusSessions(p=>[...p,{id:Date.now(),preset:focusPreset.id,sessions:focusSessionsDone,mins:focusTotalToday,date:new Date().toISOString()}]);
  },[focusPreset,focusSessionsDone,focusTotalToday,setFocusSessions]);

  const logStrainActivity = useCallback(()=>{
    if(!strainForm.actId) return;
    setStrainLog(p=>[...p,{...strainForm,id:Date.now(),date:new Date().toISOString()}]);
    setStrainForm({actId:null,duration:30,effort:5,stressLevel:5});
    setShowStrainForm(false);
  },[strainForm,setStrainLog]);

  const saveEatEntry = useCallback(()=>{
    if(!eatForm.mood||!eatForm.food) return;
    setEatLog(p=>[...p,{...eatForm,id:Date.now(),time:new Date().toISOString()}]);
    setShowEatModal(false);
    setEatForm({mood:"",food:"",hunger:3,notes:""});
  },[eatForm,setEatLog]);

  const saveSleep = useCallback((data)=>{
    setSleepLog(p=>[...p,{...data,id:Date.now()}]);
    setShowSleepModal(false);
    setGoals(g=>g.map(x=>x.id===5?{...x,done:true}:x));
  },[setSleepLog,setGoals]);

  const moodChartData = useMemo(()=>moods.slice(-10).map((m,i)=>({day:`D${i+1}`,value:MOOD_VALS[m.mood]||5,mood:m.mood})),[moods]);
  const triggerCorr = useMemo(()=>{
    const counts={};
    journal.forEach(e=>e.trigger?.forEach(t=>{
      const tr=TRIGGERS.find(x=>x.id===t);
      if(tr) counts[tr.label]=(counts[tr.label]||0)+1;
    }));
    return Object.entries(counts).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value).slice(0,6);
  },[journal]);
  const weeklyHrv = useMemo(()=>hrvData.slice(-8).map((d,i)=>({...d,label:`T-${7-i}`})),[hrvData]);
  const avgMood = useMemo(()=>moods.length?(moods.reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/moods.length).toFixed(1):"—",[moods]);
  const hrvLast = hrvData.length ? hrvData[hrvData.length-1].value : 48;
  const stressColor = stressScore<=25?GREEN:stressScore<=50?BLUE:stressScore<=70?G:stressScore<=85?ORANGE:RED;
  const stressLabel = stressScore<=25?"Very Low":stressScore<=50?"Optimal":stressScore<=70?"Moderate":stressScore<=85?"High":"Critical";
  const burnoutRisk = stressScore>75?"High":stressScore>55?"Moderate":"Low";
  const completedGoals = goals.filter(g=>g.done).length;
  const goalPct = Math.round((completedGoals/goals.length)*100);
  const fmt = s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const strainZone = todayStrain>17?"All Out":todayStrain>13?"Strenuous":todayStrain>8?"Moderate":"Light";
  const strainZoneCol = todayStrain>17?RED:todayStrain>13?ORANGE:todayStrain>8?G:GREEN;
  const focusMinsToday = focusSessions.filter(s=>new Date(s.date).toDateString()===new Date().toDateString()).reduce((sum,s)=>sum+s.mins,0)+focusTotalToday;
  const lastSleep = sleepLog.length ? sleepLog[sleepLog.length-1] : null;
  const resilienceCol = resilienceScore>=80?GREEN:resilienceScore>=60?TEAL:resilienceScore>=40?G:ORANGE;

  // Program handlers
  const startProgram = useCallback(prog=>{
    setAP(prog);setProgT(0);setProgS(0);setProgR(true);
    const stepDur=(prog.duration*60)/prog.steps.length;
    clearInterval(progRef.current);
    progRef.current=setInterval(()=>{
      setProgT(prev=>{
        const n=prev+1,cs=Math.floor(n/stepDur);
        if(cs>=prog.steps.length){clearInterval(progRef.current);setProgR(false);setSessCount(c=>c+1);setCortisol(v=>Math.max(5,v-1.5));return n;}
        setProgS(cs);return n;
      });
    },1000);
  },[setSessCount]);
  const stopProgram=useCallback(()=>{clearInterval(progRef.current);setProgR(false);setAP(null);},[]);
  const pauseProgram=useCallback(()=>{clearInterval(progRef.current);setProgR(false);},[]);
  const resumeProgram=useCallback(()=>{
    if(!activeProgram) return;setProgR(true);
    const stepDur=(activeProgram.duration*60)/activeProgram.steps.length;
    progRef.current=setInterval(()=>{
      setProgT(prev=>{
        const n=prev+1,cs=Math.floor(n/stepDur);
        if(cs>=activeProgram.steps.length){clearInterval(progRef.current);setProgR(false);return n;}
        setProgS(cs);return n;
      });
    },1000);
  },[activeProgram]);
  const logMood=useCallback(mood=>{
    setSelMood(mood);
    setMoods(p=>[...p,{id:Date.now(),mood,timestamp:new Date().toISOString()}]);
    if(["Peaceful","Calm","Energized","Grateful"].includes(mood)) setStreak(s=>s+1);
    setGoals(g=>g.map(x=>x.id===2?{...x,done:true}:x));
  },[setMoods,setGoals,setStreak]);
  const saveJournal=useCallback(()=>{
    if(!jForm.mood||!jForm.trigger.length) return;
    setJournal(p=>[...p,{id:Date.now(),date:new Date().toISOString(),...jForm}]);
    setJModal(false);setJForm({trigger:[],mood:"",intensity:5,notes:""});
    setGoals(g=>g.map(x=>x.id===4?{...x,done:true}:x));
    setCortisol(v=>Math.max(5,v-1));
  },[jForm,setJournal,setGoals]);
  const startMed=useCallback(sess=>{
    setMedA(sess);setMedT(0);setMedR(true);
    clearInterval(medRef.current);
    medRef.current=setInterval(()=>{
      setMedT(prev=>{
        const n=prev+1;
        if(n>=sess.duration*60){clearInterval(medRef.current);setMedR(false);setMedA(null);setMedCount(c=>c+1);setCortisol(v=>Math.max(5,v-2));return n;}
        return n;
      });
    },1000);
  },[setMedCount]);
  const stopMed=useCallback(()=>{clearInterval(medRef.current);setMedR(false);setMedA(null);setMedT(0);},[]);
  const calcStress=useCallback(()=>{
    let total=0;
    QUIZ.forEach(q=>{const idx=q.opts.indexOf(quizA[q.id]);total+=idx>=0?q.w[idx]:2;});
    const sc=Math.round((total/(QUIZ.length*4))*100);
    setScore(sc);localStorage.setItem("mx_score",sc);setQuizDone(true);
    setTimeout(()=>setShowQuiz(false),2000);
  },[quizA]);

  const TABS=[
    {id:"home",label:"Home",emoji:"◈"},
    {id:"readiness",label:"Readiness",emoji:"🛡",badge:"NEW"},
    {id:"sleep",label:"Sleep Coach",emoji:"🌙",badge:"NEW"},
    {id:"sounds",label:"Soundscapes",emoji:"🎵",badge:"NEW"},
    {id:"guided",label:"Guided",emoji:"🗣",badge:"NEW"},
    {id:"focus",label:"Focus",emoji:"🎯"},
    {id:"strain",label:"Strain",emoji:"⚡"},
    {id:"eat",label:"Eat Journal",emoji:"🍽"},
    {id:"programs",label:"Programs",emoji:"▶"},
    {id:"tracker",label:"Tracker",emoji:"◎"},
    {id:"journal",label:"Journal",emoji:"◧"},
    {id:"tools",label:"Tools",emoji:"🛠"},
    {id:"insights",label:"Insights",emoji:"◈"},
  ];

  const sleepChartData = useMemo(()=>sleepLog.slice(-7).map((s,i)=>({day:`D${i+1}`,score:s.sleepScore,hrs:(s.totalMins/60).toFixed(1),deep:s.deepPct,rem:s.remPct})),[sleepLog]);

  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#ddd8cc",fontFamily:FONT,position:"relative",overflowX:"hidden"}}>
      {/* Ambient */}
      <div style={{position:"fixed",top:"8%",left:"50%",transform:"translateX(-50%)",width:600,height:300,
        background:`radial-gradient(ellipse,${G}07 0%,transparent 68%)`,
        animation:"mx-pulse 6s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:300,height:200,
        background:`radial-gradient(ellipse,${INDIGO}06 0%,transparent 70%)`,
        animation:"mx-pulse 9s ease-in-out infinite 2s",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",left:"2%",width:200,height:200,
        background:`radial-gradient(ellipse,${TEAL}04 0%,transparent 70%)`,
        animation:"mx-pulse 12s ease-in-out infinite 4s",pointerEvents:"none",zIndex:0}}/>

      {/* Achievement toast */}
      <AnimatePresence>
        {newAch&&(
          <motion.div initial={{opacity:0,y:-40,x:"-50%"}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
            style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",
              background:CARD,border:`1px solid ${G}44`,padding:"12px 20px",zIndex:300,
              display:"flex",alignItems:"center",gap:12,minWidth:240}}>
            <span style={{fontSize:24}}>{newAch.icon}</span>
            <div>
              <div style={{fontSize:9,color:G,letterSpacing:".15em",textTransform:"uppercase"}}>Achievement Unlocked</div>
              <div style={{fontSize:12,color:"#ccc"}}>{newAch.title}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>{showSOS&&<SosOverlay onClose={()=>setShowSOS(false)}/>}</AnimatePresence>
      <AnimatePresence>
        {activeProgram&&<ProgramOverlay prog={activeProgram} time={progTime} step={progStep}
          running={progRunning} onPause={pauseProgram} onResume={resumeProgram} onStop={stopProgram}/>}
      </AnimatePresence>
      <AnimatePresence>
        {medActive&&<MedOverlay med={medActive} time={medTime} running={medRunning}
          onToggle={()=>{setMedR(!medRunning);if(!medRunning){medRef.current=setInterval(()=>setMedT(p=>p+1),1000);}else clearInterval(medRef.current);}}
          onStop={stopMed}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showFocusOverlay&&focusPhase!=="idle"&&(
          <FocusOverlay preset={focusPreset} phase={focusPhase} timeLeft={focusTimeLeft}
            round={focusRound} sessionsDone={focusSessionsDone}
            onPause={()=>setFocusRunning(false)} onResume={()=>setFocusRunning(true)}
            running={focusRunning} onStop={stopFocus} breakTask={focusBreakTask}/>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeGuided&&<GuidedOverlay session={activeGuided} onClose={()=>setActiveGuided(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showSleepModal&&<SleepCoachModal onClose={()=>setShowSleepModal(false)} onSave={saveSleep}/>}
      </AnimatePresence>

      {/* QUIZ MODAL */}
      <AnimatePresence>
        {showQuiz&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowQuiz(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:130,
              display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
              onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:28,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div style={{fontFamily:HEAD,fontSize:24,color:G}}>STRESS ASSESSMENT</div>
                <button className="mx-btn" onClick={()=>setShowQuiz(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              {quizDone?(
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <div style={{fontSize:50,marginBottom:12}}>✅</div>
                  <div style={{fontFamily:HEAD,fontSize:30,color:"#ddd",marginBottom:8}}>ASSESSMENT COMPLETE</div>
                  <div style={{fontSize:12,color:"#3a3a4a"}}>Stress index: <span style={{color:stressColor,fontWeight:700}}>{stressScore}%</span></div>
                </div>
              ):(
                <>
                  {QUIZ.map((q,qi)=>(
                    <div key={q.id} style={{marginBottom:20}}>
                      <div style={{fontSize:11,color:"#3a3a4a",marginBottom:10,letterSpacing:".04em"}}>{qi+1}. {q.q}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {q.opts.map(o=>(
                          <button key={o} className="mx-btn" onClick={()=>setQuizA(p=>({...p,[q.id]:o}))}
                            style={{padding:"9px 12px",background:quizA[q.id]===o?`${G}1a`:"#0e0e14",
                              border:`1px solid ${quizA[q.id]===o?G:BOR}`,color:quizA[q.id]===o?G:"#2a2a3a",
                              fontFamily:FONT,fontSize:10,textAlign:"left"}}>{o}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <GoldBtn onClick={calcStress} style={{width:"100%",opacity:Object.keys(quizA).length>=QUIZ.length?1:.35,pointerEvents:Object.keys(quizA).length>=QUIZ.length?"auto":"none"}}>
                    Calculate My Score
                  </GoldBtn>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOURNAL MODAL */}
      <AnimatePresence>
        {showJModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setJModal(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}} onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:26,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:G}}>NEW JOURNAL ENTRY</div>
                <button className="mx-btn" onClick={()=>setJModal(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              <Label>Current mood</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {Object.entries(MOOD_MAP).map(([m,e])=>(
                  <Pill key={m} active={jForm.mood===m} onClick={()=>setJForm(p=>({...p,mood:m}))}>{e} {m}</Pill>
                ))}
              </div>
              <Label>Stress triggers</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
                {TRIGGERS.map(t=>(
                  <button key={t.id} className="mx-btn"
                    onClick={()=>setJForm(p=>({...p,trigger:p.trigger.includes(t.id)?p.trigger.filter(x=>x!==t.id):[...p.trigger,t.id]}))}
                    style={{padding:"9px 10px",background:jForm.trigger.includes(t.id)?`${G}18`:"#0e0e14",
                      border:`1px solid ${jForm.trigger.includes(t.id)?G:BOR}`,color:jForm.trigger.includes(t.id)?G:"#2a2a3a",
                      fontFamily:FONT,fontSize:9,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
              <Label>Intensity: {jForm.intensity}/10</Label>
              <input type="range" min="1" max="10" value={jForm.intensity} onChange={e=>setJForm(p=>({...p,intensity:Number(e.target.value)}))} className="mx-range" style={{width:"100%",marginBottom:14}}/>
              <textarea className="mx-input" rows={3} placeholder="What's on your mind right now..." value={jForm.notes} onChange={e=>setJForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:14}}/>
              <GoldBtn onClick={saveJournal} style={{width:"100%",opacity:jForm.mood&&jForm.trigger.length?1:.3,pointerEvents:jForm.mood&&jForm.trigger.length?"auto":"none"}}>
                Save Entry
              </GoldBtn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EAT MODAL */}
      <AnimatePresence>
        {showEatModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowEatModal(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}} onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:26,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:ORANGE}}>LOG EATING MOMENT</div>
                <button className="mx-btn" onClick={()=>setShowEatModal(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              <Label>Emotional state before eating</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {FOOD_MOODS.map(m=>(
                  <Pill key={m} color={ORANGE} active={eatForm.mood===m} onClick={()=>setEatForm(p=>({...p,mood:m}))}>{m}</Pill>
                ))}
              </div>
              <Label>What did you eat / drink?</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
                {FOOD_CATEGORIES.map(f=>(
                  <button key={f.id} className="mx-btn" onClick={()=>setEatForm(p=>({...p,food:f.id}))}
                    style={{padding:"10px 10px",background:eatForm.food===f.id?`${ORANGE}18`:"#0e0e14",
                      border:`1px solid ${eatForm.food===f.id?ORANGE:BOR}`,color:eatForm.food===f.id?ORANGE:"#2a2a3a",
                      fontFamily:FONT,fontSize:9,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                    <span>{f.icon}</span><span>{f.label}</span>
                    {f.riskScore>0&&<span style={{marginLeft:"auto",fontSize:7,color:f.riskScore>2?RED:G}}>×{f.riskScore}</span>}
                  </button>
                ))}
              </div>
              <Label>Physical hunger level: {eatForm.hunger}/10</Label>
              <input type="range" min="1" max="10" value={eatForm.hunger} onChange={e=>setEatForm(p=>({...p,hunger:Number(e.target.value)}))} className="mx-range" style={{width:"100%",marginBottom:14}}/>
              <textarea className="mx-input" rows={2} placeholder="What were you doing / feeling just before?" value={eatForm.notes} onChange={e=>setEatForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:14}}/>
              <GoldBtn onClick={saveEatEntry} style={{width:"100%",background:ORANGE,opacity:eatForm.mood&&eatForm.food?1:.3,pointerEvents:eatForm.mood&&eatForm.food?"auto":"none"}}>
                Save Eating Log
              </GoldBtn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:`${BG}f0`,backdropFilter:"blur(12px)",zIndex:20}}>
        <div>
          <div style={{fontFamily:HEAD,fontSize:30,letterSpacing:".03em",lineHeight:1,color:"#e8e4d9"}}>MANIFIX v3</div>
          <div style={{fontSize:7,letterSpacing:".22em",color:"#1e1e2e",textTransform:"uppercase",marginTop:3}}>
            READINESS · SLEEP · SOUNDS · GUIDED · FOCUS · STRAIN · EAT · HRV
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{textAlign:"right",marginRight:4}}>
            <div style={{fontSize:7,letterSpacing:".18em",color:"#1a1a2a",textTransform:"uppercase"}}>Readiness</div>
            <div style={{fontFamily:HEAD,fontSize:22,color:resilienceCol,lineHeight:1}}>{resilienceScore}</div>
            <div style={{fontSize:7,color:resilienceCol,letterSpacing:".1em"}}>Stress {stressScore}%</div>
          </div>
          <button className="mx-btn" onClick={()=>setShowSOS(true)}
            style={{padding:"8px 12px",background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",
              color:RED,fontFamily:FONT,fontSize:8,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
            🆘 SOS
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"0 16px",display:"flex",gap:1,overflowX:"auto",background:`${BG}f8`,position:"sticky",top:57,zIndex:19}}>
        {TABS.map(t=>(
          <button key={t.id} className="mx-btn" onClick={()=>setTab(t.id)}
            style={{padding:"11px 10px",background:"transparent",border:"none",
              borderBottom:`2px solid ${tab===t.id?G:"transparent"}`,
              color:tab===t.id?G:"#222",fontFamily:FONT,fontSize:7,
              letterSpacing:".14em",textTransform:"uppercase",whiteSpace:"nowrap",
              transition:"all .2s",position:"relative"}}>
            {t.emoji} {t.label}
            {t.badge&&<span style={{position:"absolute",top:4,right:1,fontSize:5,color:TEAL,letterSpacing:".1em",fontFamily:FONT}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 18px 70px",position:"relative",zIndex:1}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.28,ease:"easeOut"}}>

            {/* ══════════ HOME ══════════ */}
            {tab==="home"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Ticker */}
                <div style={{overflow:"hidden",borderBottom:`1px solid ${BOR}`,paddingBottom:10}}>
                  <div style={{display:"flex",gap:40,animation:"mx-ticker 20s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
                    {[...Array(3)].flatMap(()=>[
                      `HRV ${hrvLast}ms`,`STRESS ${stressScore}%`,`STREAK ${streak}d`,
                      `STRAIN ${todayStrain.toFixed(1)}/21`,`FOCUS ${focusMinsToday}min`,
                      `READINESS ${resilienceScore}`,`SLEEP ${lastSleep?lastSleep.sleepScore+"pts":"—"}`,
                      currentHrvZone?`HRV ZONE ${currentHrvZone.label}`:"HRV MEASURING",
                    ]).map((t,i)=>(
                      <span key={i} style={{fontSize:7,letterSpacing:".2em",color:"#1e1e2e",textTransform:"uppercase"}}>
                        {t} <span style={{color:`${G}44`,marginLeft:6}}>◈</span>
                      </span>
                    ))}
                  </div>
                </div>

                {forecast&&(
                  <Card style={{borderLeft:`3px solid ${G}`,position:"relative",overflow:"hidden"}}>
                    <div className="mx-scan-line"/>
                    <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                      <div style={{fontSize:32,lineHeight:1}}>{forecast.emoji}</div>
                      <div style={{flex:1}}>
                        <Label style={{marginBottom:5}}>Today's Stress Forecast</Label>
                        <div style={{fontSize:11,color:"#2a2a3a",lineHeight:1.8,marginBottom:12}}>{forecast.tip}</div>
                        <div style={{display:"flex",gap:20}}>
                          {[["Morning",forecast.morning,GREEN],["Afternoon",forecast.afternoon,G],["Evening",forecast.evening,BLUE]].map(([l,v,c])=>(
                            <div key={l}>
                              <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                              <div style={{fontFamily:HEAD,fontSize:26,color:c,lineHeight:1}}>{v}%</div>
                              <Bar pct={v} color={c} height={2}/>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Core stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {label:"Stress Index",value:`${stressScore}%`,sub:stressLabel,color:stressColor,bar:true},
                    {label:"Readiness",value:resilienceScore,sub:"composite score",color:resilienceCol},
                    {label:"Sleep Score",value:lastSleep?lastSleep.sleepScore:"—",sub:lastSleep?`${(lastSleep.totalMins/60).toFixed(1)}h`:"not logged",color:INDIGO},
                    {label:"HRV Live",value:null,sub:"ms · variability",color:PURPLE,hrv:true},
                  ].map(({label,value,sub,color,bar,hrv})=>(
                    <Card key={label}>
                      <Label>{label}</Label>
                      {hrv?<HrvBadge value={hrvLast}/>:<div style={{fontFamily:HEAD,fontSize:32,color,lineHeight:1}}>{value}</div>}
                      <div style={{fontSize:8,color:"#1e1e2e",marginTop:3}}>{sub}</div>
                      {bar&&<Bar pct={stressScore} color={color}/>}
                    </Card>
                  ))}
                </div>

                {/* NEW feature nav cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    {icon:"🛡",label:"Readiness Ring",sub:`Score ${resilienceScore} · Oura-style composite`,action:()=>setTab("readiness"),color:GREEN,badge:"NEW"},
                    {icon:"🌙",label:"Sleep Coach",sub:`${sleepLog.length} nights logged · beats Whoop`,action:()=>setTab("sleep"),color:INDIGO,badge:"NEW"},
                    {icon:"🎵",label:"Soundscapes",sub:"Binaural · 6 scenes · beats Headspace",action:()=>setTab("sounds"),color:PURPLE,badge:"NEW"},
                    {icon:"🗣",label:"Guided Sessions",sub:"4 AI-scripted voice sessions",action:()=>setTab("guided"),color:PINK,badge:"NEW"},
                    {icon:"🎯",label:"Focus Mode",sub:`${focusMinsToday}min today · 4 presets`,action:()=>setTab("focus"),color:BLUE},
                    {icon:"⚡",label:"Strain Score",sub:`${todayStrain.toFixed(1)}/21 · ${strainZone}`,action:()=>setTab("strain"),color:ORANGE},
                  ].map((c,i)=>(
                    <button key={i} className="mx-btn" onClick={c.action}
                      style={{background:CARD,border:`1px solid ${c.color}22`,padding:"16px 12px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:8,position:"relative"}}>
                      {c.badge&&<div style={{position:"absolute",top:8,right:8,fontSize:6,letterSpacing:".12em",color:TEAL,background:`${TEAL}12`,border:`1px solid ${TEAL}25`,padding:"2px 6px",fontFamily:FONT}}>{c.badge}</div>}
                      <span style={{fontSize:26}}>{c.icon}</span>
                      <div style={{fontSize:10,fontWeight:700,color:"#ddd",fontFamily:HEAD,letterSpacing:".04em"}}>{c.label}</div>
                      <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.5}}>{c.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Goals + Quick Actions */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <Label style={{marginBottom:0}}>Daily Goals — {completedGoals}/{goals.length}</Label>
                      <div style={{fontSize:8,color:G}}>{goalPct}%</div>
                    </div>
                    <Bar pct={goalPct} color={G} height={3}/>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                      {goals.map(g=>(
                        <motion.div key={g.id} whileTap={{scale:.97}} className="mx-btn"
                          onClick={()=>setGoals(p=>p.map(x=>x.id===g.id?{...x,done:!x.done}:x))}
                          style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${g.done?"#1e3d1e":BOR}`,background:g.done?"#0a130a":"#0e0e14",padding:"9px 12px"}}>
                          <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,border:`2px solid ${g.done?GREEN:BOR}`,background:g.done?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:BG,fontSize:9}}>
                            {g.done&&"✓"}
                          </div>
                          <span style={{fontSize:9,color:"#2a2a3a",textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                          <span style={{marginLeft:"auto",fontSize:12}}>{g.icon}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <Card>
                      <Label>Quick Actions</Label>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[
                          {label:"Log Sleep",icon:"🌙",action:()=>setShowSleepModal(true),color:INDIGO},
                          {label:"Breathe",icon:"🫁",action:()=>setTab("tools"),color:BLUE},
                          {label:"Journal",icon:"📓",action:()=>setJModal(true),color:PURPLE},
                          {label:"Assess",icon:"📊",action:()=>setShowQuiz(true),color:G},
                        ].map(({label,icon,action})=>(
                          <button key={label} className="mx-btn" onClick={action}
                            style={{padding:"12px 8px",background:"#0e0e14",border:`1px solid ${BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                            <span style={{fontSize:22}}>{icon}</span>
                            <span style={{fontSize:8,letterSpacing:".12em",color:"#222",textTransform:"uppercase"}}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </Card>
                    <Card>
                      <Label>Daily Insight</Label>
                      <AnimatePresence mode="wait">
                        <motion.div key={tipIdx} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                          style={{fontSize:11,color:"#333",lineHeight:1.9,minHeight:52}}>
                          {DAILY_TIPS[tipIdx]}
                        </motion.div>
                      </AnimatePresence>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ READINESS RING — NEW (beats Oura) ══════════ */}
            {tab==="readiness"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>READINESS SCORE</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>
                      Beats Oura · 5-factor composite resilience score · Updated live
                    </div>
                  </div>
                </div>

                {/* Main readiness ring + factors */}
                <Card style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <ReadinessRing score={resilienceScore} size={200}/>
                    <div style={{fontSize:9,color:resilienceCol,letterSpacing:".12em",textTransform:"uppercase"}}>
                      {resilienceScore>=80?"Peak Readiness":resilienceScore>=60?"Good":resilienceScore>=40?"Fair":"Needs Recovery"}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:220}}>
                    <Label>Resilience Factors</Label>
                    {RESILIENCE_FACTORS.map(f=>{
                      const scores = {
                        sleep: lastSleep ? lastSleep.sleepScore : 50,
                        hrv: Math.min(100,hrvLast*1.25),
                        activity: Math.max(0,100-todayStrain*4),
                        mood: moods.length ? moods.slice(-7).reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/Math.min(7,moods.length)*10:50,
                        recovery: Math.min(100,(sessCount+medCount)*8),
                      };
                      const val = Math.round(scores[f.id]||50);
                      const col = val>=75?GREEN:val>=50?TEAL:val>=30?G:ORANGE;
                      return (
                        <div key={f.id} style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:14}}>{f.icon}</span>
                              <div>
                                <div style={{fontSize:9,color:"#bbb"}}>{f.label}</div>
                                <div style={{fontSize:7,color:"#1e1e2e"}}>{f.desc}</div>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:8,color:"#1e1e2e"}}>×{f.weight}</span>
                              <div style={{fontFamily:HEAD,fontSize:18,color:col,lineHeight:1}}>{val}</div>
                            </div>
                          </div>
                          <Bar pct={val} color={col} height={3}/>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* HRV Zones (beats Oura) */}
                <Card>
                  <Label>HRV Zones · Current: {hrvLast}ms</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {HRV_ZONES.map(zone=>{
                      const active = hrvLast>=zone.min&&hrvLast<zone.max;
                      return (
                        <div key={zone.label} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 14px",
                          background:active?`${zone.color}08`:"transparent",
                          border:`1px solid ${active?zone.color+"44":BOR}`,
                          transition:"all .3s"}}>
                          {active&&<div className="mx-hb" style={{width:8,height:8,borderRadius:"50%",background:zone.color,flexShrink:0}}/>}
                          {!active&&<div style={{width:8,height:8,borderRadius:"50%",background:"#1e1e2e",flexShrink:0}}/>}
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                              <div style={{fontSize:10,color:active?zone.color:"#444"}}>{zone.label}</div>
                              <div style={{fontSize:8,color:"#1e1e2e"}}>{zone.min}–{zone.max}ms</div>
                            </div>
                            <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6}}>{zone.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Circadian rhythm chart (beats Oura) */}
                <Card>
                  <Label>Circadian Rhythm · Your Energy / Cortisol Curve</Label>
                  <div style={{fontSize:9,color:"#1e1e2e",lineHeight:1.7,marginBottom:14}}>
                    Oura shows sleep stages. ManifiX maps your full 24h autonomic rhythm — when to focus, when to rest, when cortisol peaks.
                  </div>
                  <div style={{height:180}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={CIRCADIAN_HOURS}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                        <XAxis dataKey="label" stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}}/>
                        <YAxis stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}} domain={[0,100]}/>
                        <Tooltip content={<MxTooltip/>}/>
                        <Line type="monotone" dataKey="energy" name="Energy" stroke={G} strokeWidth={2} dot={false}/>
                        <Line type="monotone" dataKey="alertness" name="Alertness" stroke={BLUE} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                        <Line type="monotone" dataKey="cortisol" name="Cortisol" stroke={ORANGE} strokeWidth={1.5} dot={false} strokeDasharray="2 3"/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{display:"flex",gap:16,marginTop:8}}>
                    {[{col:G,label:"Energy"},{col:BLUE,label:"Alertness"},{col:ORANGE,label:"Cortisol"}].map(({col,label})=>(
                      <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:16,height:2,background:col}}/>
                        <span style={{fontSize:7,color:"#1e1e2e"}}>{label}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* vs Oura comparison */}
                <Card style={{borderLeft:`3px solid ${GREEN}`}}>
                  <Label>Why This Beats Oura</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Oura Ring",items:["$299 ring + $6/month","Physical metrics only","No mental/emotional data","No stress eating integration","No focus tracking"],col:"#444"},
                      {label:"ManifiX Readiness",items:["Zero hardware · Free","Physical + mental + emotional","HRV zone coaching built in","Circadian rhythm mapping","Integrates all 8 health modules"],col:GREEN},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a3a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ SLEEP COACH — NEW (beats Whoop) ══════════ */}
            {tab==="sleep"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>SLEEP COACH</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>
                      Beats Whoop · Deep / REM staging · Sleep score · Circadian alignment
                    </div>
                  </div>
                  <GoldBtn onClick={()=>setShowSleepModal(true)} style={{background:INDIGO}}>+ Log Sleep</GoldBtn>
                </div>

                {/* Last night summary */}
                {lastSleep ? (
                  <Card style={{border:`1px solid ${INDIGO}22`}}>
                    <Label>Last Night's Sleep</Label>
                    <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:HEAD,fontSize:56,color:INDIGO,lineHeight:1}}>
                          {lastSleep.sleepScore}
                        </div>
                        <div style={{fontSize:8,letterSpacing:".14em",color:"#1e1e2e",textTransform:"uppercase"}}>Sleep Score</div>
                      </div>
                      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        {[
                          {label:"Duration",value:`${(lastSleep.totalMins/60).toFixed(1)}h`,target:"7–9h",ok:lastSleep.totalMins>=420&&lastSleep.totalMins<=540,color:INDIGO},
                          {label:"Deep Sleep",value:`${lastSleep.deepPct}%`,target:"15–25%",ok:lastSleep.deepPct>=15&&lastSleep.deepPct<=25,color:PURPLE},
                          {label:"REM",value:`${lastSleep.remPct}%`,target:"20–25%",ok:lastSleep.remPct>=20&&lastSleep.remPct<=25,color:BLUE},
                          {label:"Wake-ups",value:lastSleep.wakeUps,target:"0–1",ok:lastSleep.wakeUps<=1,color:TEAL},
                        ].map(({label,value,target,ok,color})=>(
                          <div key={label} style={{background:"#08080e",border:`1px solid ${ok?color+"22":RED+"22"}`,padding:"10px"}}>
                            <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                            <div style={{fontFamily:HEAD,fontSize:22,color:ok?color:RED,lineHeight:1}}>{value}</div>
                            <div style={{fontSize:7,color:"#1e1e2e",marginTop:2}}>{ok?"✓ On target":""} target: {target}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card style={{textAlign:"center",padding:"48px 20px",border:`1px solid ${INDIGO}22`}}>
                    <div style={{fontSize:44,marginBottom:12}}>🌙</div>
                    <div style={{fontSize:11,color:"#1e1e2e",letterSpacing:".14em",textTransform:"uppercase"}}>No sleep logged yet</div>
                    <div style={{fontSize:10,color:"#141422",marginTop:6,lineHeight:1.7,maxWidth:300,margin:"8px auto 20px"}}>
                      Unlike Whoop, no wearable needed. Log your sleep stages and wake time for personalised coaching.
                    </div>
                    <GoldBtn onClick={()=>setShowSleepModal(true)} style={{background:INDIGO}}>Log First Night</GoldBtn>
                  </Card>
                )}

                {/* Sleep history chart */}
                {sleepLog.length>1&&(
                  <Card>
                    <Label>Sleep History</Label>
                    <div style={{height:180}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sleepChartData}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                          <XAxis dataKey="day" stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}}/>
                          <YAxis stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}} domain={[0,100]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <RBar dataKey="score" name="Sleep Score" radius={[3,3,0,0]}>
                            {sleepChartData.map((d,i)=>(
                              <Cell key={i} fill={d.score>=75?GREEN:d.score>=55?G:d.score>=35?ORANGE:RED}/>
                            ))}
                          </RBar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Sleep stage guide */}
                <Card>
                  <Label>Sleep Stage Guide · Science-backed targets</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      {stage:"Deep (N3)",target:"15–25%",role:"Physical repair, immune function, memory consolidation",col:INDIGO,tip:"Achieved in first half of night. Avoid alcohol — it kills deep sleep."},
                      {stage:"REM",target:"20–25%",role:"Emotional processing, creativity, learning consolidation",col:PURPLE,tip:"Mostly in the final 2 hours. Sleep cutoffs destroy REM. Never skip the last 90 min."},
                      {stage:"Light (N1/N2)",target:"50–60%",role:"Transitional sleep, motor memory, spindle generation",col:BLUE,tip:"Natural bridge between stages. More interruptions in light sleep = more fatigue."},
                      {stage:"Awake",target:"<5%",role:"Brief arousals are normal and unremembered if short",col:RED,tip:"If over 10% awake time, check: caffeine timing, blue light, alcohol, stress."},
                    ].map(({stage,target,role,col,tip})=>(
                      <div key={stage} style={{border:`1px solid ${col}15`,padding:"12px 14px",background:"#08080e"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{fontSize:11,color:col}}>{stage}</div>
                          <div style={{fontSize:9,color:col,background:`${col}15`,border:`1px solid ${col}30`,padding:"2px 8px"}}>Target: {target}</div>
                        </div>
                        <div style={{fontSize:9,color:"#2a2a3a",lineHeight:1.6,marginBottom:5}}>{role}</div>
                        <div style={{fontSize:8,color:"#1e1e2e",fontStyle:"italic"}}>{tip}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Sleep stories preview */}
                <Card>
                  <Label>Sleep Stories · Audio journeys for deep rest</Label>
                  <div style={{fontSize:9,color:"#1e1e2e",marginBottom:14,lineHeight:1.7}}>
                    Unlike Headspace's celebrity narrations, these are immersive environmental narratives designed with sleep neuroscience principles.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {SLEEP_STORIES.map(s=>(
                      <div key={s.id} style={{background:"#08080e",border:`1px solid ${s.color}18`,padding:"14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:24}}>{s.emoji}</span>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:7,color:s.color,letterSpacing:".12em"}}>{s.mood}</div>
                            <div style={{fontSize:7,color:"#1e1e2e"}}>{s.duration}min</div>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:"#ccc",marginBottom:5}}>{s.title}</div>
                        <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6,marginBottom:10}}>{s.desc}</div>
                        <button className="mx-btn" style={{width:"100%",padding:"8px 0",background:`${s.color}14`,
                          border:`1px solid ${s.color}30`,color:s.color,fontFamily:FONT,fontSize:8,letterSpacing:".12em",textTransform:"uppercase"}}>
                          🌙 Coming Soon
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* vs Whoop */}
                <Card style={{borderLeft:`3px solid ${INDIGO}`}}>
                  <Label>Why This Beats Whoop</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Whoop",items:["$30/month + $300 hardware","Physical metrics only","No sleep story / wind down","No stress integration","No circadian coaching"],col:"#444"},
                      {label:"ManifiX Sleep",items:["Free — zero hardware","Sleep stages + stress + HRV","Sleep stories for wind-down","Stress-sleep correlation","Full circadian guidance"],col:INDIGO},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a3a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ SOUNDSCAPES — NEW (beats Headspace) ══════════ */}
            {tab==="sounds"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>SOUNDSCAPES</div>
                  <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>
                    Beats Headspace · Real binaural audio engine · 6 scenes · Solfeggio frequencies
                  </div>
                </div>

                <Card style={{border:`1px solid ${PURPLE}22`}}>
                  <Label>Binaural Soundscape Engine · Real Web Audio API</Label>
                  <div style={{fontSize:9,color:"#1e1e2e",lineHeight:1.7,marginBottom:16}}>
                    Unlike Headspace's pre-recorded tracks, ManifiX generates live binaural tones layered over ambient noise textures. Each scene targets a specific brainwave state using Solfeggio frequencies.
                  </div>
                  <SoundscapePlayer soundscapes={SOUNDSCAPES}/>
                </Card>

                {/* Frequency guide */}
                <Card>
                  <Label>Solfeggio Frequency Guide</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      {hz:396,label:"Liberation",desc:"Releases fear and guilt. Grounds the root chakra. Reduces cortisol.",col:GREEN},
                      {hz:432,label:"Nature Tuning",desc:"Natural frequency of the universe. Reduces anxiety. Slower heart rate.",col:TEAL},
                      {hz:528,label:"Repair",desc:"DNA repair frequency. Promotes inner peace. Used in meditation therapy.",col:G},
                      {hz:639,label:"Connection",desc:"Harmonises relationships. Promotes compassion and empathy.",col:ORANGE},
                      {hz:741,label:"Awakening",desc:"Enhances intuition and mental clarity. Problem-solving state.",col:BLUE},
                      {hz:852,label:"Spiritual",desc:"Returns you to spiritual order. Deep intuition and higher self.",col:PURPLE},
                    ].map(({hz,label,desc,col})=>(
                      <div key={hz} style={{display:"flex",gap:14,alignItems:"center",borderBottom:`1px solid ${BOR}`,paddingBottom:8,marginBottom:2}}>
                        <div style={{width:52,textAlign:"center",flexShrink:0}}>
                          <div style={{fontFamily:HEAD,fontSize:20,color:col,lineHeight:1}}>{hz}</div>
                          <div style={{fontSize:6,color:"#1e1e2e",letterSpacing:".1em"}}>hz</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:col,marginBottom:2}}>{label}</div>
                          <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6}}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* vs Headspace sounds */}
                <Card style={{borderLeft:`3px solid ${PURPLE}`}}>
                  <Label>Why This Beats Headspace Sounds</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Headspace",items:["Pre-recorded audio files","No frequency selection","Generic ambient tracks","$13/month subscription","No binaural beats"],col:"#444"},
                      {label:"ManifiX Sounds",items:["Live Web Audio API synthesis","6 binaural frequency presets","Adaptive noise layering","Free — zero subscription","Real-time volume control"],col:PURPLE},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a3a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ GUIDED SESSIONS — NEW (beats Headspace) ══════════ */}
            {tab==="guided"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>GUIDED SESSIONS</div>
                  <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>
                    Beats Headspace · Goal-specific scripts · No celebrity narrator needed
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {GUIDED_SESSIONS.map(s=>(
                    <Card key={s.id} style={{position:"relative",overflow:"hidden",border:`1px solid ${s.color}18`}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.color},transparent)`}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <span style={{fontSize:32}} className="mx-float">{s.emoji}</span>
                        <span style={{fontSize:7,padding:"3px 9px",background:`${s.color}14`,border:`1px solid ${s.color}33`,color:s.color,letterSpacing:".12em",textTransform:"uppercase"}}>{s.type}</span>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e4d9",marginBottom:3}}>{s.title}</div>
                      <div style={{fontSize:8,color:`${s.color}66`,marginBottom:8}}>{s.duration} minutes</div>
                      <div style={{marginBottom:14}}>
                        {s.script.slice(0,2).map((line,i)=>(
                          <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:`${s.color}55`,marginTop:5,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6}}>{line}</span>
                          </div>
                        ))}
                        <div style={{fontSize:8,color:"#111118"}}>+ {s.script.length-2} more steps...</div>
                      </div>
                      <GoldBtn onClick={()=>setActiveGuided(s)} style={{width:"100%",background:s.color,fontSize:9}}>
                        ▶ Begin Session
                      </GoldBtn>
                    </Card>
                  ))}
                </div>

                {/* How it works */}
                <Card>
                  <Label>How Guided Sessions Work</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {step:"01",text:"Choose a session type matching your current need",icon:"🎯"},
                      {step:"02",text:"The script advances automatically — just follow along",icon:"📜"},
                      {step:"03",text:"A timer ring shows progress. Pause any time",icon:"⏱"},
                      {step:"04",text:"Session contributes to your Readiness and Resilience scores",icon:"🛡"},
                    ].map(({step,text,icon})=>(
                      <div key={step} style={{background:"#08080e",border:`1px solid ${BOR}`,padding:"14px 12px"}}>
                        <div style={{fontFamily:HEAD,fontSize:28,color:PINK,lineHeight:1,marginBottom:6}}>{step}</div>
                        <span style={{fontSize:18}}>{icon}</span>
                        <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6,marginTop:6}}>{text}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* vs Headspace */}
                <Card style={{borderLeft:`3px solid ${PINK}`}}>
                  <Label>Why This Beats Headspace Guided Meditation</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Headspace",items:["Generic meditation packs","Andy Puddicombe voice only","Long structured courses","$70/year","No crisis/performance modes"],col:"#444"},
                      {label:"ManifiX Guided",items:["Goal-specific: crisis/morning/performance/healing","Script-driven — works silently too","Instant access, no courses","Free always","Connects to HRV + Readiness"],col:PINK},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a3a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ FOCUS MODE ══════════ */}
            {tab==="focus"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>FOCUS MODE</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>Beats Headspace · Work+Mindfulness intervals · HRV-optimised</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:HEAD,fontSize:28,color:BLUE,lineHeight:1}}>{focusMinsToday}</div>
                    <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e2e",textTransform:"uppercase"}}>mins today</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {FOCUS_PRESETS.map(preset=>(
                    <Card key={preset.id} style={{position:"relative",overflow:"hidden",cursor:"pointer",
                      border:`1px solid ${focusPreset.id===preset.id?preset.color+"44":BOR}`,
                      background:focusPreset.id===preset.id?`${preset.color}08`:CARD}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${preset.color},transparent)`}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <span style={{fontSize:28}}>{preset.icon}</span>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:8,color:preset.color,letterSpacing:".12em",textTransform:"uppercase"}}>{preset.work}min work</div>
                          <div style={{fontSize:7,color:"#1e1e2e"}}>{preset.rest}min break</div>
                        </div>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e4d9",marginBottom:3}}>{preset.label}</div>
                      <div style={{fontSize:9,color:"#1e1e2e",lineHeight:1.7,marginBottom:12}}>{preset.desc}</div>
                      <div style={{fontSize:8,color:`${preset.color}55`,lineHeight:1.6,marginBottom:14,fontStyle:"italic"}}>💡 {preset.tip}</div>
                      <GoldBtn onClick={()=>startFocus(preset)} style={{width:"100%",background:preset.color,fontSize:9}}>▶ Start {preset.label}</GoldBtn>
                    </Card>
                  ))}
                </div>
                <Card>
                  <Label>Mindful Break Activities</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {MINDFUL_BREAKS.map((b,i)=>(
                      <div key={i} style={{background:"#0e0e14",border:`1px solid ${BOR}`,padding:"12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:18}}>{b.emoji}</span>
                          <span style={{fontSize:7,color:TEAL,letterSpacing:".1em"}}>{b.dur}s</span>
                        </div>
                        <div style={{fontSize:10,color:"#ccc",marginBottom:4}}>{b.title}</div>
                        <div style={{fontSize:8,color:"#1e1e2e",lineHeight:1.6}}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                {focusSessions.length>0&&(
                  <Card>
                    <Label>Recent Focus Sessions</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {[...focusSessions].reverse().slice(0,5).map(s=>{
                        const p=FOCUS_PRESETS.find(x=>x.id===s.preset)||FOCUS_PRESETS[1];
                        return (
                          <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${BOR}`,padding:"10px 14px",background:"#0e0e14"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:18}}>{p.icon}</span>
                              <div>
                                <div style={{fontSize:10,color:"#bbb"}}>{p.label}</div>
                                <div style={{fontSize:8,color:"#1e1e2e"}}>{new Date(s.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:HEAD,fontSize:20,color:p.color,lineHeight:1}}>{s.mins}m</div>
                              <div style={{fontSize:7,color:"#1e1e2e"}}>{s.sessions} sessions</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════════ STRAIN SCORE ══════════ */}
            {tab==="strain"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRAIN SCORE</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>Beats Whoop · Total daily load vs recovery · 0–21 scale</div>
                  </div>
                  <GoldBtn onClick={()=>setShowStrainForm(true)} small>+ Log Activity</GoldBtn>
                </div>
                <Card style={{display:"flex",gap:24,alignItems:"center"}}>
                  <StrainRing strain={todayStrain} recovery={todayRecovery}/>
                  <div style={{flex:1}}>
                    <div style={{marginBottom:16}}>
                      <Label>Today's Strain Zone</Label>
                      <div style={{fontFamily:HEAD,fontSize:36,color:strainZoneCol,lineHeight:1}}>{strainZone.toUpperCase()}</div>
                      <div style={{fontSize:9,color:"#1e1e2e",marginTop:4,lineHeight:1.7}}>
                        {todayStrain<8?"Low load. Good day to train or take on demanding tasks.":
                         todayStrain<13?"Moderate load. Maintain — don't add intense work sessions.":
                         todayStrain<17?"High load. Prioritise recovery. Limit cognitive work.":
                         "Maximum strain. Rest is mandatory. No new stressors."}
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[
                        {label:"Strain",val:`${todayStrain.toFixed(1)}/21`,col:strainZoneCol},
                        {label:"Recovery",val:`${todayRecovery}%`,col:todayRecovery>66?GREEN:todayRecovery>33?G:RED},
                        {label:"HRV",val:`${hrvLast}ms`,col:hrvLast>55?GREEN:hrvLast>40?G:RED},
                        {label:"Activities",val:strainLog.filter(l=>new Date(l.date).toDateString()===new Date().toDateString()).length,col:TEAL},
                      ].map(({label,val,col})=>(
                        <div key={label} style={{background:"#0e0e14",border:`1px solid ${BOR}`,padding:"10px"}}>
                          <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e2e",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                          <div style={{fontFamily:HEAD,fontSize:22,color:col,lineHeight:1}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card>
                  <Label>Strain Zones · 0–21 Scale</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      {label:"Light",range:"0–8",desc:"Recovery day. Social activity, gentle yoga, desk work.",col:GREEN,pct:38},
                      {label:"Moderate",range:"8–13",desc:"Balanced day. Light exercise + office work.",col:G,pct:61},
                      {label:"Strenuous",range:"13–17",desc:"High output day. One intense workout or major project.",col:ORANGE,pct:80},
                      {label:"All Out",range:"17–21",desc:"Maximum load. Requires significant recovery period.",col:RED,pct:100},
                    ].map(({label,range,desc,col,pct})=>(
                      <div key={label} style={{display:"flex",gap:12,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BOR}`}}>
                        <div style={{width:60,textAlign:"right"}}>
                          <div style={{fontSize:9,color:col,fontWeight:700}}>{label}</div>
                          <div style={{fontSize:7,color:"#1e1e2e"}}>{range}</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{height:4,background:"#0e0e14",borderRadius:2,marginBottom:4}}>
                            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${col}66,${col})`,borderRadius:2}}/>
                          </div>
                          <div style={{fontSize:8,color:"#1e1e2e"}}>{desc}</div>
                        </div>
                        {todayStrain>=parseFloat(range.split("–")[0])&&todayStrain<parseFloat(range.split("–")[1]||"22")&&(
                          <div style={{width:8,height:8,borderRadius:"50%",background:col,animation:"mx-blink 1.2s infinite"}}/>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
                <AnimatePresence>
                  {showStrainForm&&(
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                      <Card style={{border:`1px solid ${ORANGE}22`}}>
                        <Label>Log Activity</Label>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
                          {ACTIVITIES.map(a=>(
                            <button key={a.id} className="mx-btn" onClick={()=>setStrainForm(p=>({...p,actId:a.id}))}
                              style={{padding:"10px 6px",background:strainForm.actId===a.id?`${ORANGE}18`:"#0e0e14",
                                border:`1px solid ${strainForm.actId===a.id?ORANGE:BOR}`,
                                display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <span style={{fontSize:18}}>{a.icon}</span>
                              <span style={{fontSize:7,color:strainForm.actId===a.id?ORANGE:"#1e1e2e",textAlign:"center",lineHeight:1.3}}>{a.label}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                          <div>
                            <Label>Duration: {strainForm.duration} min</Label>
                            <input type="range" min="5" max="480" step="5" value={strainForm.duration}
                              onChange={e=>setStrainForm(p=>({...p,duration:Number(e.target.value)}))} className="mx-range" style={{width:"100%"}}/>
                          </div>
                          <div>
                            <Label>Effort: {strainForm.effort}/10</Label>
                            <input type="range" min="1" max="10" value={strainForm.effort}
                              onChange={e=>setStrainForm(p=>({...p,effort:Number(e.target.value)}))} className="mx-range" style={{width:"100%"}}/>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          <GoldBtn onClick={logStrainActivity} style={{flex:1,background:ORANGE,opacity:strainForm.actId?1:.35,pointerEvents:strainForm.actId?"auto":"none"}}>
                            Add to Today's Strain
                          </GoldBtn>
                          <GhostBtn onClick={()=>setShowStrainForm(false)}>Cancel</GhostBtn>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                {strainLog.filter(l=>new Date(l.date).toDateString()===new Date().toDateString()).length>0&&(
                  <Card>
                    <Label>Today's Activity Log</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {strainLog.filter(l=>new Date(l.date).toDateString()===new Date().toDateString()).map(log=>{
                        const act=ACTIVITIES.find(a=>a.id===log.actId);
                        const load=act?(act.mets*log.duration/60)*(log.effort/5)*(1+act.stressMultiplier*0.3):0;
                        const loadCol=load>3?RED:load>1.5?ORANGE:GREEN;
                        return act?(
                          <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${BOR}`,padding:"10px 14px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:20}}>{act.icon}</span>
                              <div>
                                <div style={{fontSize:10,color:"#bbb"}}>{act.label}</div>
                                <div style={{fontSize:8,color:"#1e1e2e"}}>{log.duration}min · effort {log.effort}/10</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:HEAD,fontSize:18,color:loadCol,lineHeight:1}}>+{load.toFixed(1)}</div>
                              <div style={{fontSize:7,color:"#1e1e2e"}}>strain</div>
                            </div>
                          </div>
                        ):null;
                      })}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════════ EAT JOURNAL ══════════ */}
            {tab==="eat"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>EAT JOURNAL</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e2e",textTransform:"uppercase",marginTop:2}}>
                      Stress-eating pattern detection · Beats Noom · {eatLog.length} entries
                    </div>
                  </div>
                  <GoldBtn onClick={()=>setShowEatModal(true)} style={{background:ORANGE}}>+ Log Moment</GoldBtn>
                </div>
                {Object.keys(eatPatterns).length>0?(
                  <Card>
                    <Label>Stress-Eating Pattern Analysis</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {Object.entries(eatPatterns).sort((a,b)=>b[1].count-a[1].count).map(([mood,data])=>{
                        const avgHunger=(data.totalHunger/data.count).toFixed(1);
                        const topFood=Object.entries(data.foods).sort((a,b)=>b[1]-a[1])[0];
                        const foodCat=topFood?FOOD_CATEGORIES.find(f=>f.id===topFood[0]):null;
                        const isEmotional=avgHunger<5;
                        const col=isEmotional?RED:GREEN;
                        return (
                          <div key={mood} style={{border:`1px solid ${col}18`,background:"#0e0e14",padding:"12px 14px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:8,height:8,borderRadius:"50%",background:col}}/>
                                <div>
                                  <div style={{fontSize:11,color:"#bbb"}}>{mood}</div>
                                  <div style={{fontSize:8,color:"#1e1e2e"}}>{data.count}× logged</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:9,color:col,fontWeight:700}}>{isEmotional?"⚠ Emotional eating":"✓ Physical hunger"}</div>
                                <div style={{fontSize:7,color:"#1e1e2e"}}>Avg hunger {avgHunger}/10</div>
                              </div>
                            </div>
                            {topFood&&foodCat&&(
                              <div style={{fontSize:8,color:"#2a2a3a",padding:"6px 10px",background:"#0a0a0e",border:`1px solid ${BOR}`}}>
                                Most common: {foodCat.icon} <span style={{color:"#bbb"}}>{foodCat.label}</span>
                                {foodCat.riskScore>0&&<span style={{color:foodCat.riskScore>2?RED:G,marginLeft:8,fontSize:7}}>Risk ×{foodCat.riskScore}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ):(
                  <Card style={{textAlign:"center",padding:"48px 20px"}}>
                    <div style={{fontSize:44,marginBottom:12}}>🍽</div>
                    <div style={{fontSize:11,color:"#1e1e2e",letterSpacing:".14em",textTransform:"uppercase"}}>No entries yet</div>
                    <GoldBtn onClick={()=>setShowEatModal(true)} style={{background:ORANGE,marginTop:16}}>Log First Moment</GoldBtn>
                  </Card>
                )}
                {eatLog.length>2&&(
                  <Card>
                    <Label>Hunger Level Distribution</Label>
                    <div style={{fontSize:9,color:"#1e1e2e",marginBottom:10}}>Below 5 = likely emotional eating</div>
                    <div style={{height:160}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eatLog.slice(-14).map((e,i)=>({idx:`E${i+1}`,hunger:e.hunger}))}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                          <XAxis dataKey="idx" stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}}/>
                          <YAxis stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}} domain={[0,10]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <RBar dataKey="hunger" name="Hunger" radius={[2,2,0,0]}>
                            {eatLog.slice(-14).map((e,i)=>(<Cell key={i} fill={e.hunger<5?RED:GREEN}/>))}
                          </RBar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ══════════ PROGRAMS ══════════ */}
            {tab==="programs"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>RECOVERY PROGRAMS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {PROGRAMS.map(prog=>(
                    <Card key={prog.id} style={{position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,width:"100%",height:2,background:`linear-gradient(90deg,transparent,${prog.color||G},transparent)`}}/>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                        <span style={{fontSize:32}}>{prog.emoji}</span>
                        <span style={{fontSize:7,padding:"3px 9px",background:`${prog.color||G}14`,border:`1px solid ${prog.color||G}33`,color:prog.color||G,letterSpacing:".14em",textTransform:"uppercase"}}>{prog.level}</span>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e4d9",marginBottom:2}}>{prog.title}</div>
                      <div style={{fontSize:9,color:`${prog.color||G}88`,marginBottom:8}}>{prog.duration} min</div>
                      <div style={{fontSize:10,color:"#1e1e2e",lineHeight:1.7,marginBottom:14}}>{prog.desc}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
                        {prog.steps.map((step,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${BOR}`,color:"#1e1e2e",fontSize:9}}>
                            <div style={{width:16,height:16,borderRadius:"50%",background:`${prog.color||G}18`,border:`1px solid ${prog.color||G}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:prog.color||G,flexShrink:0}}>{i+1}</div>
                            {step}
                          </div>
                        ))}
                      </div>
                      <GoldBtn onClick={()=>startProgram(prog)} style={{width:"100%",background:prog.color||G}}>▶ Start Program</GoldBtn>
                    </Card>
                  ))}
                </div>
                <div style={{fontFamily:HEAD,fontSize:24,color:"#e8e4d9",marginTop:6}}>GUIDED MEDITATION</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {MEDITATIONS.map(s=>(
                    <Card key={s.id} style={{position:"relative",overflow:"hidden"}}>
                      <div style={{fontSize:30,marginBottom:10}}>{s.emoji}</div>
                      <div style={{fontSize:12,color:"#ddd",marginBottom:3}}>{s.title}</div>
                      <div style={{fontSize:9,color:`${s.color}77`,marginBottom:5}}>{s.duration} min</div>
                      <div style={{fontSize:9,color:"#1e1e2e",marginBottom:12,lineHeight:1.6}}>{s.focus}</div>
                      <button className="mx-btn" onClick={()=>startMed(s)} style={{width:"100%",padding:"9px 0",background:`${s.color}18`,border:`1px solid ${s.color}33`,color:s.color,fontFamily:FONT,fontSize:9,letterSpacing:".14em",textTransform:"uppercase"}}>▶ Start</button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════ TRACKER ══════════ */}
            {tab==="tracker"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>MOOD & HRV TRACKER</div>
                <Card>
                  <Label>How are you feeling right now?</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                    {Object.entries(MOOD_MAP).map(([mood,emoji])=>(
                      <motion.button key={mood} className="mx-btn" onClick={()=>logMood(mood)} whileTap={{scale:.95}}
                        style={{padding:"12px 6px",background:selMood===mood?`${MOOD_COLS[mood]||G}1a`:"#0e0e14",border:`1px solid ${selMood===mood?MOOD_COLS[mood]||G:BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <span style={{fontSize:22}}>{emoji}</span>
                        <span style={{fontSize:7,letterSpacing:".1em",color:selMood===mood?MOOD_COLS[mood]||G:"#1e1e2e",textTransform:"uppercase",textAlign:"center",lineHeight:1.4}}>{mood}</span>
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {selMood&&(
                      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                        style={{textAlign:"center",marginTop:12,fontSize:11,color:MOOD_COLS[selMood]||G}}>
                        ✓ Logged: {selMood} {MOOD_MAP[selMood]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
                <Card>
                  <Label>HRV — Real-Time</Label>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <HrvBadge value={hrvLast}/>
                    <div style={{fontSize:8,color:"#1e1e2e",textAlign:"right"}}>
                      <div>Zone: <span style={{color:currentHrvZone?.color||G}}>{currentHrvZone?.label||"—"}</span></div>
                      <div style={{marginTop:2}}>{currentHrvZone?.desc}</div>
                    </div>
                  </div>
                  {hrvData.length>2?(
                    <div style={{height:160}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyHrv}>
                          <defs><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={G} stopOpacity={.3}/><stop offset="100%" stopColor={G} stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                          <XAxis dataKey="time" stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}}/>
                          <YAxis stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}} domain={[20,80]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <Area type="monotone" dataKey="value" name="HRV" stroke={G} fill="url(#hG)" strokeWidth={2} dot={{fill:G,r:2}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ):<div style={{padding:"30px 0",textAlign:"center",fontSize:8,color:"#1a1a2a",textTransform:"uppercase"}}>Collecting HRV data...</div>}
                </Card>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>7-Day Mood Trend</Label>
                    {moodChartData.length>1?(
                      <div style={{height:170}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={moodChartData}>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                            <XAxis dataKey="day" stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}}/>
                            <YAxis stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}} domain={[0,10]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Line type="monotone" dataKey="value" name="Score" stroke={G} strokeWidth={2}
                              dot={({cx,cy,payload})=><circle key={cx} cx={cx} cy={cy} r={4} fill={MOOD_COLS[payload.mood]||G} stroke="none"/>}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"40px 0",textAlign:"center",fontSize:8,color:"#1a1a2a",textTransform:"uppercase"}}>Log mood daily to see trend</div>}
                  </Card>
                  <Card>
                    <Label>Trigger Correlation</Label>
                    {triggerCorr.length>0?(
                      <div style={{height:170}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={triggerCorr} layout="vertical">
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14" horizontal={false}/>
                            <XAxis type="number" stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}}/>
                            <YAxis type="category" dataKey="name" width={80} stroke="#1a1a2a" tick={{fontSize:7,fill:"#2a2a3a"}}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <RBar dataKey="value" name="Freq" radius={[0,2,2,0]}>
                              {triggerCorr.map((_,i)=><Cell key={i} fill={[G,ORANGE,BLUE,PURPLE,GREEN,TEAL][i%6]}/>)}
                            </RBar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"40px 0",textAlign:"center",fontSize:8,color:"#1a1a2a",textTransform:"uppercase"}}>Add journal entries to correlate</div>}
                  </Card>
                </div>
              </div>
            )}

            {/* ══════════ JOURNAL ══════════ */}
            {tab==="journal"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRESS JOURNAL</div>
                    <div style={{fontSize:8,color:"#1e1e2e",letterSpacing:".14em",marginTop:2}}>{journal.length} entries · patterns tracked</div>
                  </div>
                  <GoldBtn onClick={()=>setJModal(true)}>+ New Entry</GoldBtn>
                </div>
                {journal.length===0?(
                  <Card style={{textAlign:"center",padding:"56px 20px"}}>
                    <div style={{fontSize:44,marginBottom:12}}>📓</div>
                    <div style={{fontSize:11,color:"#1e1e2e",letterSpacing:".14em",textTransform:"uppercase"}}>No entries yet</div>
                    <GoldBtn onClick={()=>setJModal(true)} style={{marginTop:18}}>Write First Entry</GoldBtn>
                  </Card>
                ):(
                  <AnimatePresence>
                    {[...journal].reverse().map((entry,i)=>{
                      const emoji=MOOD_MAP[entry.mood];
                      const moodColor=MOOD_COLS[entry.mood]||G;
                      return (
                        <motion.div key={entry.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}} transition={{delay:i*0.04}}>
                          <Card style={{position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:moodColor}}/>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,paddingLeft:12}}>
                              <div>
                                <div style={{fontSize:7,color:"#1e1e2e",letterSpacing:".12em",marginBottom:5}}>{new Date(entry.date).toLocaleString()}</div>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:20}}>{emoji}</span>
                                  <span style={{fontSize:11,color:moodColor}}>{entry.mood}</span>
                                  <span style={{fontSize:8,color:"#1e1e2e",padding:"2px 7px",border:`1px solid ${BOR}`}}>Intensity {entry.intensity}/10</span>
                                </div>
                              </div>
                              <button className="mx-btn" onClick={()=>setJournal(p=>p.filter(x=>x.id!==entry.id))}
                                style={{padding:"4px 8px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.15)",color:RED,fontFamily:FONT,fontSize:8}}>✕</button>
                            </div>
                            {entry.notes&&<div style={{fontSize:10,color:"#2a2a3a",lineHeight:1.8,fontStyle:"italic",borderLeft:`2px solid ${BOR}`,paddingLeft:12,marginLeft:12}}>"{entry.notes}"</div>}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* ══════════ TOOLS ══════════ */}
            {tab==="tools"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRESS RELIEF TOOLS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>Breath Coach</Label>
                    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                      {[{id:"4-4-6-2",label:"Box+",color:G},{id:"4-7-8",label:"4-7-8",color:BLUE},{id:"resonance",label:"Resonance",color:TEAL}].map(m=>(
                        <Pill key={m.id} active={breathMode===m.id} color={m.color} onClick={()=>{setBreathMode(m.id);setBrC(m.color);setBrA(false);}}>{m.label}</Pill>
                      ))}
                    </div>
                    <BreathCircle active={breathActive} onToggle={()=>setBrA(!breathActive)} color={breathColor}/>
                  </Card>
                  <Card>
                    <Label>Coping Strategies</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {COPING.map(c=>(
                        <button key={c.id} className="mx-btn" onClick={()=>{setSelCoping(c);setCopingR(false);setCopingT(0);clearInterval(copRef.current);}}
                          style={{padding:"9px 12px",background:selCoping?.id===c.id?`${G}14`:"#0e0e14",border:`1px solid ${selCoping?.id===c.id?G:BOR}`,display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
                          <div>
                            <div style={{fontSize:10,color:"#bbb"}}>{c.icon} {c.title}</div>
                            <div style={{fontSize:8,color:"#1e1e2e",marginTop:2}}>{c.desc}</div>
                          </div>
                          <div style={{fontSize:8,color:G,flexShrink:0,marginLeft:8}}>{c.time}</div>
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {selCoping&&(
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                          <div style={{border:`1px solid ${BOR}`,padding:12,marginTop:8}}>
                            <button className="mx-btn" onClick={()=>{
                              const next=!copingRun;setCopingR(next);
                              if(next){clearInterval(copRef.current);copRef.current=setInterval(()=>setCopingT(p=>p+1),1000);}else clearInterval(copRef.current);
                            }} style={{width:"100%",padding:"10px 0",background:copingRun?"transparent":G,color:copingRun?RED:BG,border:copingRun?`1px solid ${RED}`:"none",fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
                              {copingRun?"⏹ Stop":"▶ Start"}
                            </button>
                            {copingRun&&<div style={{textAlign:"center",fontFamily:HEAD,fontSize:36,color:G,marginTop:10}}>{fmt(copingTime)}</div>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
                <Card>
                  <Label>Emergency Techniques</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {title:"5-4-3-2-1",desc:"5 see · 4 touch · 3 hear · 2 smell · 1 taste",emoji:"🌍",color:TEAL},
                      {title:"Box Breath",desc:"In 4s · Hold 4s · Out 4s · Hold 4s",emoji:"🫁",color:BLUE},
                      {title:"Muscle Release",desc:"Tense & release each group head→toe",emoji:"💪",color:G},
                      {title:"Name 3 Good",desc:"Name 3 genuine appreciations right now",emoji:"❤️",color:PURPLE},
                    ].map((item,i)=>(
                      <div key={i} style={{background:"#0e0e14",border:`1px solid ${BOR}`,padding:"14px 10px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${item.color}55,transparent)`}}/>
                        <div style={{fontSize:24,marginBottom:8}}>{item.emoji}</div>
                        <div style={{fontSize:10,color:item.color,marginBottom:5}}>{item.title}</div>
                        <div style={{fontSize:8,color:"#1a1a2a",lineHeight:1.7}}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ INSIGHTS ══════════ */}
            {tab==="insights"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>INSIGHTS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>Burnout Dimensions Radar</Label>
                    <BurnoutRadar score={stressScore} hrvLast={hrvLast} moods={moods}/>
                  </Card>
                  <Card>
                    <Label>Readiness over Mood</Label>
                    {moodChartData.length>2?(
                      <div style={{height:220}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={moodChartData.map(d=>({...d,stress:Math.round(10-d.value)*10}))}>
                            <defs>
                              <linearGradient id="sG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={.3}/><stop offset="100%" stopColor={ORANGE} stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e14"/>
                            <XAxis dataKey="day" stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}}/>
                            <YAxis stroke="#1a1a2a" tick={{fontSize:8,fill:"#2a2a3a"}} domain={[0,100]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Area type="monotone" dataKey="stress" name="Stress" stroke={ORANGE} fill="url(#sG)" strokeWidth={2}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"50px 0",textAlign:"center",fontSize:8,color:"#1a1a2a",textTransform:"uppercase"}}>Log more moods to see trend</div>}
                  </Card>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                  {[
                    {label:"Sessions",value:sessCount,color:TEAL,icon:"🏃"},
                    {label:"Meditations",value:medCount,color:PURPLE,icon:"🧘"},
                    {label:"Focus Sess",value:focusSessions.reduce((s,x)=>s+x.sessions,0),color:BLUE,icon:"🎯"},
                    {label:"Sleep Nights",value:sleepLog.length,color:INDIGO,icon:"🌙"},
                    {label:"Eat Logs",value:eatLog.length,color:ORANGE,icon:"🍽"},
                  ].map(({label,value,color,icon})=>(
                    <Card key={label} style={{textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                      <div style={{fontFamily:HEAD,fontSize:36,color,lineHeight:1}}>{value}</div>
                      <Label style={{marginBottom:0,marginTop:4}}>{label}</Label>
                    </Card>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>Achievements · {unlockedAch.length}/{ACHIEVEMENTS_DEFS.length}</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {ACHIEVEMENTS_DEFS.map(a=>{
                        const unlocked=unlockedAch.includes(a.id);
                        return (
                          <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                            background:unlocked?"#0a130a":"#0e0e14",
                            border:`1px solid ${unlocked?"#1e3d1e":BOR}`,
                            opacity:unlocked?1:.4}}>
                            <span style={{fontSize:18}}>{a.icon}</span>
                            <div>
                              <div style={{fontSize:9,color:unlocked?GREEN:"#333"}}>{a.title}</div>
                              <div style={{fontSize:7,color:"#1e1e2e"}}>{a.desc}</div>
                            </div>
                            {unlocked&&<div style={{marginLeft:"auto",fontSize:10,color:GREEN}}>✓</div>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  <Card style={{display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div>
                      <Label>Full Stress Assessment</Label>
                      <div style={{fontSize:9,color:"#1e1e2e",lineHeight:1.7,marginBottom:16}}>6-question WHO-aligned assessment to recalibrate your stress index</div>
                    </div>
                    <GoldBtn onClick={()=>{setShowQuiz(true);setQuizDone(false);setQuizA({});}}>Take Assessment</GoldBtn>
                  </Card>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
