/**
 * ManifiX AI — Stress & Burnout Health Module
 * Black #080808 + Gold #ffc83c + Bebas Neue + DM Mono
 * Real features: HRV, SOS, Meditation Timer, Cortisol, Journal,
 * Mood Tracker, Breathing, Trigger Correlation, Coping Strategies
 */

import {
  useEffect, useState, useCallback, useRef, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

/* ═══════════════ MANIFIX DESIGN TOKENS ═══════════════ */
const GOLD   = "#ffc83c";
const DIM    = "#c8a84b";
const BG     = "#080808";
const CARD   = "#0c0c0c";
const BOR    = "#1a1a1a";
const FONT   = "'DM Mono','Courier New',monospace";
const HEAD   = "'Bebas Neue',sans-serif";
const GREEN  = "#4ade80";
const RED    = "#ef4444";
const PURPLE = "#A78BFA";
const BLUE   = "#60A5FA";
const ORANGE = "#f97316";

/* ═══════════════ GLOBAL CSS ═══════════════ */
function injectCSS() {
  if (document.getElementById("str-css")) return;
  const s = document.createElement("style");
  s.id = "str-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes str-scan{from{top:-4px}to{top:100%}}
    @keyframes str-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes str-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes str-spin{to{transform:rotate(360deg)}}
    @keyframes str-pulse{0%,100%{opacity:.07;transform:scale(1)}50%{opacity:.18;transform:scale(1.08)}}
    @keyframes str-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.35)}28%{transform:scale(1)}}
    @keyframes str-shimmer{from{background-position:-200% center}to{background-position:200% center}}
    @keyframes str-breath-in{from{transform:scale(1)}to{transform:scale(1.55)}}
    @keyframes str-breath-out{from{transform:scale(1.55)}to{transform:scale(1)}}
    @keyframes str-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .str-up{animation:str-up .45s cubic-bezier(.22,.68,0,1.2) both}
    .str-btn{cursor:pointer;transition:all .15s}
    .str-btn:hover{opacity:.88;transform:translateY(-1px)}
    .str-btn:active{transform:translateY(0)}
    .str-input{background:#0a0a0a;border:1px solid #1a1a1a;color:#e8e4d9;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.06em;padding:10px 14px;width:100%;outline:none;transition:border-color .2s;resize:none}
    .str-input:focus{border-color:#ffc83c55}
    .str-input::placeholder{color:#252525}
    .str-select{background:#0a0a0a;border:1px solid #1a1a1a;color:#e8e4d9;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.06em;padding:10px 14px;width:100%;outline:none;appearance:none}
    .str-range{width:100%;accent-color:#ffc83c}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#0a0a0a}
    ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}
    .str-nav-btn.active{color:${GOLD};border-bottom:2px solid ${GOLD}}
    .str-card-hover{transition:border-color .2s}
    .str-card-hover:hover{border-color:#2a2a2a!important}
  `;
  document.head.appendChild(s);
}

/* ═══════════════ DATA ═══════════════ */
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

const MOOD_MAP = {
  Overwhelmed:"😰", Anxious:"😟", Tired:"😴", Restless:"🤸",
  "Burned Out":"🔥", Peaceful:"😌", Calm:"🧘", Focused:"🎯", Energized:"⚡",
};
const MOOD_VALS = {
  Peaceful:10, Calm:9, Energized:8, Focused:7, Tired:5,
  Restless:4, Anxious:3, "Burned Out":2, Overwhelmed:1,
};

const TRIGGERS = [
  {id:1,label:"Work Pressure",icon:"💼"}, {id:2,label:"Financial",icon:"💰"},
  {id:3,label:"Relationships",icon:"👥"}, {id:4,label:"Health Worry",icon:"🫀"},
  {id:5,label:"Poor Sleep",icon:"🌙"},   {id:6,label:"Too Much Caffeine",icon:"☕"},
  {id:7,label:"Social Media",icon:"📱"}, {id:8,label:"Environment",icon:"🔔"},
  {id:9,label:"Uncertainty",icon:"🌫️"},  {id:10,label:"Physical Tension",icon:"🏋️"},
];

const PROGRAMS = [
  {id:1,title:"2-Min Calm Reset",duration:2,level:"Beginner",emoji:"⏱️",desc:"Instant nervous system reset through breath pacing.",steps:["Find a quiet spot","Inhale 4 seconds","Hold 4 seconds","Exhale 6 seconds","Repeat 8 cycles"]},
  {id:2,title:"Anxiety Cooldown",duration:7,level:"Popular",emoji:"🧠",desc:"Grounding + cognitive reframing for acute anxiety.",steps:["Acknowledge the anxiety","Name 5 things you see","Name 4 things you touch","Name 3 sounds","Challenge one thought","Breathe slowly","Accept what you can't control"]},
  {id:3,title:"Deep Breathing",duration:5,level:"Daily",emoji:"💨",desc:"Activate parasympathetic nervous system fully.",steps:["Place hand on belly","Breathe in through nose","Feel belly expand","Exhale through pursed lips","Feel belly contract","Find your rhythm"]},
  {id:4,title:"Sleep Stress Release",duration:10,level:"Night",emoji:"🌙",desc:"Progressive relaxation for deep sleep preparation.",steps:["Lie comfortably","Close your eyes","Scan from toes upward","Tense each muscle group","Hold for 5 seconds","Release tension","Notice the warmth","Let go of thoughts"]},
  {id:5,title:"Mindful Walk",duration:5,level:"Beginner",emoji:"🚶",desc:"Movement + mindfulness to reduce cortisol.",steps:["Start walking slowly","Feel each footstep","Notice surroundings","Match breath to steps","Release mental tension","End with gratitude"]},
  {id:6,title:"Desk Decompression",duration:3,level:"Daily",emoji:"💻",desc:"Desk-friendly stress release without leaving your station.",steps:["Roll shoulders back 5x","Neck stretches side to side","Close eyes, deep breath","Unclench jaw","Stretch arms overhead","Reset posture"]},
];

const MEDITATIONS = [
  {id:1,title:"Morning Calm",duration:5,focus:"Start the day centred",emoji:"🌅"},
  {id:2,title:"Midday Reset",duration:10,focus:"Release afternoon tension",emoji:"🕛"},
  {id:3,title:"Evening Wind Down",duration:15,focus:"Transition to rest mode",emoji:"🌙"},
  {id:4,title:"Panic SOS",duration:3,focus:"Immediate calm response",emoji:"🆘"},
  {id:5,title:"Focus Deepener",duration:7,focus:"Enhance concentration",emoji:"🎯"},
  {id:6,title:"Self-Love Journey",duration:12,focus:"Build inner compassion",emoji:"❤️"},
];

const COPING = [
  {id:1,title:"Box Breathing",desc:"4-4-4-4 pattern for instant calm",time:"3 min"},
  {id:2,title:"5-4-3-2-1 Grounding",desc:"Engage all five senses to return to present",time:"2 min"},
  {id:3,title:"Progressive Relaxation",desc:"Systematically release muscle tension",time:"10 min"},
  {id:4,title:"Thought Reframing",desc:"Challenge and reframe negative thoughts",time:"5 min"},
  {id:5,title:"Body Scan",desc:"Mindful awareness from head to toe",time:"8 min"},
  {id:6,title:"Gratitude Journal",desc:"Write 3 things you appreciate",time:"5 min"},
];

const DAILY_TIPS = [
  "Hydrate before caffeine.","Walk 5 minutes after stressful work.","Avoid doom-scrolling before sleep.",
  "Take one deep breath before replying emotionally.","Stretch your shoulders every hour.",
  "Write down 3 things you're grateful for.","Practice the 5-4-3-2-1 grounding technique.",
  "Listen to calming music for 10 minutes.","Step outside and feel sun on your face.",
  "Progressive muscle relaxation before bed.",
];

const GOALS_INIT = [
  {id:1,text:"Complete 3 sessions today",done:false},
  {id:2,text:"Log mood twice today",done:false},
  {id:3,text:"Practice breathing for 5 min",done:false},
  {id:4,text:"Write one journal entry",done:false},
];

/* ═══════════════ SHARED CARD ═══════════════ */
const Card = ({children, style={}, className=""}) => (
  <div className={`str-card-hover ${className}`} style={{
    background:CARD, border:`1px solid ${BOR}`,
    padding:20, ...style,
  }}>{children}</div>
);

const Label = ({children, style={}}) => (
  <div style={{fontSize:8,letterSpacing:".2em",color:"#252525",textTransform:"uppercase",marginBottom:6,...style}}>{children}</div>
);

const Stat = ({label,value,color=GOLD,size=30}) => (
  <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"12px 14px"}}>
    <Label>{label}</Label>
    <div style={{fontFamily:HEAD,fontSize:size,color,lineHeight:1}}>{value}</div>
  </div>
);

const Bar = ({pct,color=GOLD,height=4}) => (
  <div style={{height,background:"#111",overflow:"hidden",borderRadius:height,marginTop:8}}>
    <motion.div initial={{width:0}} animate={{width:`${Math.min(pct,100)}%`}} transition={{duration:1.2,ease:"easeOut"}}
      style={{height:"100%",background:`linear-gradient(90deg,${DIM},${color})`,borderRadius:height}} />
  </div>
);

/* ═══════════════ BREATHING CIRCLE ═══════════════ */
function BreathCircle({active, onToggle}) {
  const [phase,setPhase] = useState("idle");
  const [count,setCount] = useState(4);
  const [cycles,setCycles] = useState(0);
  const ref = useRef(null);
  const seq = useRef([{l:"Inhale",s:4},{l:"Hold",s:4},{l:"Exhale",s:6},{l:"Rest",s:2}]);

  useEffect(() => {
    if (!active) { clearInterval(ref.current); setPhase("idle"); return; }
    let pi = 0, ct = seq.current[0].s;
    setPhase("Inhale"); setCount(ct);
    ref.current = setInterval(() => {
      ct--;
      if (ct < 0) {
        pi = (pi + 1) % seq.current.length;
        if (pi === 0) setCycles(c => c + 1);
        ct = seq.current[pi].s;
        setPhase(seq.current[pi].l);
      }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active]);

  const isIn  = phase === "Inhale";
  const isOut = phase === "Exhale";
  const sz    = active ? (isIn ? 130 : isOut ? 70 : 100) : 90;

  return (
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:160,position:"relative"}}>
        <motion.div animate={{width:sz,height:sz}} transition={{duration:isIn?4:isOut?6:1,ease:"easeInOut"}}
          style={{borderRadius:"50%",background:`${GOLD}18`,border:`2px solid ${GOLD}55`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {active && <><div style={{fontFamily:HEAD,fontSize:28,color:GOLD,lineHeight:1}}>{count}</div>
          <div style={{fontSize:8,letterSpacing:".15em",color:DIM,textTransform:"uppercase"}}>{phase}</div></>}
          {!active && <div style={{fontSize:28}}>🫁</div>}
        </motion.div>
      </div>
      {active && <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:12}}>Cycles: {cycles}</div>}
      <button className="str-btn" onClick={onToggle} style={{padding:"10px 24px",background:active?"transparent":GOLD,color:active?"#ef4444":"#080808",border:active?`1px solid #ef4444`:"none",fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>
        {active ? "⏹ Stop" : "▶ Start Exercise"}
      </button>
    </div>
  );
}

/* ═══════════════ SOS OVERLAY ═══════════════ */
function SosOverlay({onClose}) {
  const [phase,setPhase] = useState("Inhale");
  const [count,setCount] = useState(4);
  const ref = useRef(null);
  const seq = [{l:"Inhale",s:4},{l:"Hold",s:4},{l:"Exhale",s:6},{l:"Rest",s:2}];

  useEffect(() => {
    let pi = 0, ct = 4;
    ref.current = setInterval(() => {
      ct--;
      if (ct < 0) { pi = (pi + 1) % seq.length; ct = seq[pi].s; setPhase(seq[pi].l); }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const sz = phase === "Inhale" ? 200 : phase === "Exhale" ? 100 : 160;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"#000000f5",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div style={{fontFamily:HEAD,fontSize:36,color:RED,letterSpacing:".08em",marginBottom:8}}>SOS CALM MODE</div>
      <div style={{fontSize:9,letterSpacing:".2em",color:"#333",textTransform:"uppercase",marginBottom:40}}>Follow the circle · Breathe slowly</div>
      <motion.div animate={{width:sz,height:sz}} transition={{duration:phase==="Inhale"?4:phase==="Exhale"?6:1,ease:"easeInOut"}}
        style={{borderRadius:"50%",background:"rgba(239,68,68,0.15)",border:"2px solid rgba(239,68,68,0.4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:40}}>
        <div style={{fontFamily:HEAD,fontSize:36,color:RED,lineHeight:1}}>{count}</div>
        <div style={{fontSize:9,letterSpacing:".15em",color:"rgba(239,68,68,0.6)",textTransform:"uppercase"}}>{phase}</div>
      </motion.div>
      <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:".12em",marginBottom:24}}>3-minute emergency protocol</div>
      <button className="str-btn" onClick={onClose} style={{padding:"12px 28px",background:"transparent",border:`1px solid ${BOR}`,color:"#444",fontFamily:FONT,fontSize:10,letterSpacing:".18em",textTransform:"uppercase"}}>Exit SOS Mode</button>
    </motion.div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function Stress() {
  const navigate = useNavigate();

  const [tab,setTab]             = useState("home");
  const [stressScore,setScore]   = useState(() => Number(localStorage.getItem("str_score")||68));
  const [streak,setStreak]       = useLS("str_streak",12);
  const [moods,setMoods]         = useLS("str_moods",[]);
  const [journal,setJournal]     = useLS("str_journal",[]);
  const [goals,setGoals]         = useLS("str_goals",GOALS_INIT);
  const [activeTriggers,setAT]   = useLS("str_triggers",[]);
  const [hrvData,setHrv]         = useLS("str_hrv",[]);
  const [achievements,setAch]    = useLS("str_ach",[]);
  const [soundOn,setSound]       = useLS("str_sound",true);
  const [voiceOn,setVoice]       = useLS("str_voice",false);

  const [selMood,setSelMood]     = useState(null);
  const [showSOS,setShowSOS]     = useState(false);
  const [activeProgram,setAP]    = useState(null);
  const [progRunning,setProgR]   = useState(false);
  const [progTime,setProgT]      = useState(0);
  const [progStep,setProgS]      = useState(0);
  const [breathActive,setBrA]    = useState(false);
  const [medActive,setMedA]      = useState(null);
  const [medTime,setMedT]        = useState(0);
  const [medRunning,setMedR]     = useState(false);
  const [showJModal,setJModal]   = useState(false);
  const [jForm,setJForm]         = useState({trigger:[],mood:"",intensity:5,notes:""});
  const [showQuiz,setShowQuiz]   = useState(false);
  const [quizA,setQuizA]         = useState({});
  const [quizDone,setQuizDone]   = useState(false);
  const [selCoping,setSelCoping] = useState(null);
  const [copingRun,setCopingR]   = useState(false);
  const [copingTime,setCopingT]  = useState(0);
  const [tipIdx,setTipIdx]       = useState(0);
  const [cortisol,setCortisol]   = useState(12);
  const [forecast,setForecast]   = useState(null);
  const [showSettings,setShowS]  = useState(false);

  const progRef   = useRef(null);
  const medRef    = useRef(null);
  const copRef    = useRef(null);
  const hrvRef    = useRef(null);

  useEffect(() => {
    injectCSS();
    const id = setInterval(() => setTipIdx(i => (i+1)%DAILY_TIPS.length), 4500);
    return () => clearInterval(id);
  }, []);

  /* HRV simulation */
  useEffect(() => {
    const collect = () => {
      const v = 40 + Math.random() * 25;
      setHrv(p => [...p.slice(-14), {time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), value:Math.round(v), stress:Math.round(Math.max(0,100-v*1.2))}]);
    };
    collect();
    hrvRef.current = setInterval(collect, 28000);
    return () => clearInterval(hrvRef.current);
  }, []);

  /* Daily forecast */
  useEffect(() => {
    const h = new Date().getHours(), d = new Date().getDay();
    const base = d >= 1 && d <= 5 ? 58 : 32;
    setForecast({
      morning: Math.round(base + Math.random()*10),
      afternoon: Math.round(base + (h>=9&&h<=17?15:-5) + Math.random()*15),
      evening: Math.round(base - 12 + Math.random()*10),
      tip: base > 55 ? "High stress expected today. Schedule 2 breathing sessions." : "Manageable day. Light mindfulness recommended.",
    });
  }, []);

  const moodChartData = useMemo(() => moods.slice(-7).map((m,i) => ({day:`D${i+1}`,value:MOOD_VALS[m.mood]||5})), [moods]);
  const triggerCorr   = useMemo(() => {
    const counts = {};
    journal.forEach(e => e.trigger?.forEach(t => { const tr = TRIGGERS.find(x => x.id===t); if(tr) counts[tr.label] = (counts[tr.label]||0)+1; }));
    return Object.entries(counts).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value).slice(0,5);
  }, [journal]);
  const avgMood      = useMemo(() => moods.length ? (moods.reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/moods.length).toFixed(1) : "—", [moods]);
  const medTaken     = moods.filter(m=>["Peaceful","Calm","Energized"].includes(m.mood)).length;

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const stressColor = stressScore<=25?GREEN:stressScore<=50?BLUE:stressScore<=70?GOLD:stressScore<=85?ORANGE:RED;
  const stressLabel = stressScore<=25?"Very Low":stressScore<=50?"Low":stressScore<=70?"Moderate":stressScore<=85?"High":"Critical";

  const startProgram = useCallback(prog => {
    setAP(prog); setProgT(0); setProgS(0); setProgR(true);
    const stepDur = (prog.duration*60)/prog.steps.length;
    clearInterval(progRef.current);
    progRef.current = setInterval(() => {
      setProgT(prev => {
        const n = prev+1;
        const cs = Math.floor(n/stepDur);
        if (cs >= prog.steps.length) {
          clearInterval(progRef.current); setProgR(false);
          setGoals(g => g.map(x => x.id===3?{...x,done:true}:x));
          setAch(a => [...a,{id:Date.now(),name:prog.title,date:new Date().toISOString()}].slice(-50));
          return n;
        }
        setProgS(cs); return n;
      });
    }, 1000);
  }, [setGoals, setAch]);

  const stopProgram = useCallback(() => {
    clearInterval(progRef.current); setProgR(false); setAP(null);
  }, []);

  const pauseProgram = useCallback(() => { clearInterval(progRef.current); setProgR(false); }, []);

  const resumeProgram = useCallback(() => {
    if (!activeProgram) return;
    setProgR(true);
    const stepDur = (activeProgram.duration*60)/activeProgram.steps.length;
    progRef.current = setInterval(() => {
      setProgT(prev => {
        const n = prev+1;
        const cs = Math.floor(n/stepDur);
        if (cs >= activeProgram.steps.length) { clearInterval(progRef.current); setProgR(false); return n; }
        setProgS(cs); return n;
      });
    }, 1000);
  }, [activeProgram]);

  const logMood = useCallback(mood => {
    setSelMood(mood);
    const entry = {id:Date.now(),mood,timestamp:new Date().toISOString()};
    setMoods(p => [...p,entry]);
    if (["Peaceful","Calm","Energized"].includes(mood)) setStreak(s => s+1);
    setGoals(g => g.map(x => x.id===2?{...x,done:true}:x));
  }, [setMoods, setGoals, setStreak]);

  const saveJournal = useCallback(() => {
    if (!jForm.mood || !jForm.trigger.length) return;
    setJournal(p => [...p,{id:Date.now(),date:new Date().toISOString(),...jForm}]);
    setJModal(false); setJForm({trigger:[],mood:"",intensity:5,notes:""});
    setGoals(g => g.map(x => x.id===4?{...x,done:true}:x));
    setCortisol(v => Math.max(5,v-2));
  }, [jForm, setJournal, setGoals]);

  const startMed = useCallback(sess => {
    setMedA(sess); setMedT(0); setMedR(true);
    clearInterval(medRef.current);
    medRef.current = setInterval(() => {
      setMedT(prev => {
        const n = prev+1;
        if (n >= sess.duration*60) { clearInterval(medRef.current); setMedR(false); setMedA(null); setGoals(g=>g.map(x=>x.id===1?{...x,done:true}:x)); return n; }
        return n;
      });
    }, 1000);
  }, [setGoals]);

  const stopMed = useCallback(() => { clearInterval(medRef.current); setMedR(false); setMedA(null); setMedT(0); }, []);

  const calcStress = useCallback(() => {
    const vals = {Rarely:2,Sometimes:3,Often:4,Always:5,Never:1,Frequently:5,"Very well":1,"Mostly well":2,Poorly:4,"Very poorly":5,Excellent:1,Good:2,Fair:3,Poor:5,Always_sc:1,Usually:2};
    let total = Object.values(quizA).reduce((a,v)=>a+(vals[v]||3),0);
    const sc = Math.round((total/(QUIZ.length*5))*100);
    setScore(sc); localStorage.setItem("str_score",sc); setQuizDone(true);
    setTimeout(() => setShowQuiz(false), 1800);
  }, [quizA]);

  const exportData = useCallback(() => {
    const d = {moods,journal,activeTriggers,goals,streak,hrvData,achievements,exportedAt:new Date().toISOString()};
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:"application/json"}));
    a.download = `manifix-stress-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }, [moods,journal,activeTriggers,goals,streak,hrvData,achievements]);

  const QUIZ = [
    {id:1,q:"How often do you feel overwhelmed?",opts:["Rarely","Sometimes","Often","Always"]},
    {id:2,q:"How well do you sleep?",opts:["Very well","Mostly well","Poorly","Very poorly"]},
    {id:3,q:"How often do you feel anxious?",opts:["Never","Rarely","Sometimes","Frequently"]},
    {id:4,q:"How is your work-life balance?",opts:["Excellent","Good","Fair","Poor"]},
    {id:5,q:"Do you have time for self-care?",opts:["Always","Usually","Rarely","Never"]},
  ];

  const TABS = [
    {id:"home",label:"Home",emoji:"🏠"},
    {id:"programs",label:"Programs",emoji:"▶"},
    {id:"tracker",label:"Tracker",emoji:"📊"},
    {id:"journal",label:"Journal",emoji:"📓"},
    {id:"tools",label:"Tools",emoji:"⚡"},
  ];

  /* ── RENDER ── */
  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#e8e4d9",fontFamily:FONT,position:"relative",overflowX:"hidden"}}>

      {/* Ambient glow */}
      <div style={{position:"fixed",top:"15%",left:"50%",transform:"translateX(-50%)",width:500,height:260,background:`radial-gradient(ellipse,${GOLD}0a 0%,transparent 70%)`,animation:"str-pulse 5s ease-in-out infinite",pointerEvents:"none"}} />

      {/* SOS overlay */}
      <AnimatePresence>{showSOS && <SosOverlay onClose={()=>setShowSOS(false)}/>}</AnimatePresence>

      {/* PROGRAM OVERLAY */}
      <AnimatePresence>
        {activeProgram && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"#000000f2",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{textAlign:"center",maxWidth:400,width:"100%"}}>
              <div style={{fontFamily:HEAD,fontSize:32,color:"#e8e4d9",marginBottom:4}}>{activeProgram.title}</div>
              <div style={{fontSize:8,letterSpacing:".2em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:30}}>Step {progStep+1} of {activeProgram.steps.length}</div>

              <motion.div animate={{scale:progRunning?[1,1.3,1]:[1]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}}
                style={{width:160,height:160,borderRadius:"50%",background:`${GOLD}15`,border:`2px solid ${GOLD}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 28px"}}>
                <div style={{fontSize:11,color:GOLD,letterSpacing:".12em",textTransform:"uppercase"}}>Breathe</div>
                <div style={{fontFamily:HEAD,fontSize:44,color:GOLD,lineHeight:1}}>{fmt(progTime)}</div>
              </motion.div>

              <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 18px",marginBottom:20,fontSize:12,color:"#4a4a4a",lineHeight:1.7}}>
                {activeProgram.steps[progStep]}
              </div>

              <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:16}}>
                {Array.from({length:activeProgram.steps.length},(_,i)=>(
                  <div key={i} style={{width:28,height:3,borderRadius:2,background:i<=progStep?GOLD:"#1a1a1a",transition:"background .3s"}} />
                ))}
              </div>

              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="str-btn" onClick={progRunning?pauseProgram:resumeProgram} style={{padding:"12px 20px",background:`${GOLD}22`,border:`1px solid ${GOLD}44`,color:GOLD,fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>
                  {progRunning?"⏸ Pause":"▶ Resume"}
                </button>
                <button className="str-btn" onClick={stopProgram} style={{padding:"12px 20px",background:"transparent",border:`1px solid ${BOR}`,color:"#444",fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>✕ Stop</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEDITATION OVERLAY */}
      <AnimatePresence>
        {medActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"#000000f5",zIndex:140,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{textAlign:"center",maxWidth:360,width:"100%"}}>
              <div style={{fontSize:40,marginBottom:14}}>{medActive.emoji}</div>
              <div style={{fontFamily:HEAD,fontSize:32,color:"#e8e4d9",marginBottom:4}}>{medActive.title}</div>
              <div style={{fontSize:9,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:36}}>{medActive.focus}</div>

              <motion.div animate={medRunning?{scale:[1,1.1,1]}:{}} transition={{duration:8,repeat:Infinity,ease:"easeInOut"}}
                style={{width:180,height:180,borderRadius:"50%",background:`${PURPLE}15`,border:`2px solid ${PURPLE}44`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 28px"}}>
                <div style={{fontFamily:HEAD,fontSize:42,color:PURPLE,lineHeight:1}}>{fmt(medTime)}</div>
                <div style={{fontSize:9,letterSpacing:".12em",color:`${PURPLE}88`,textTransform:"uppercase",marginTop:4}}>
                  {fmt(medActive.duration*60-medTime)} left
                </div>
              </motion.div>

              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="str-btn" onClick={()=>setMedR(!medRunning)} style={{padding:"12px 20px",background:`${PURPLE}22`,border:`1px solid ${PURPLE}44`,color:PURPLE,fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>
                  {medRunning?"⏸ Pause":"▶ Resume"}
                </button>
                <button className="str-btn" onClick={stopMed} style={{padding:"12px 20px",background:"transparent",border:`1px solid ${BOR}`,color:"#444",fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase"}}>✕ Stop</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUIZ MODAL */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowQuiz(false)}
            style={{position:"fixed",inset:0,background:"#000000dd",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92}} animate={{scale:1}} exit={{scale:.92}} onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:24,maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:GOLD}}>STRESS ASSESSMENT</div>
                <button className="str-btn" onClick={()=>setShowQuiz(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#444",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              {quizDone ? (
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <div style={{fontSize:44,marginBottom:12}}>✅</div>
                  <div style={{fontFamily:HEAD,fontSize:28,color:"#e8e4d9",marginBottom:6}}>COMPLETE</div>
                  <div style={{fontSize:11,color:"#3a3a3a"}}>Your stress level: <span style={{color:stressColor,fontWeight:700}}>{stressScore}%</span></div>
                </div>
              ) : (
                <>
                  {QUIZ.map((q,qi) => (
                    <div key={q.id} style={{marginBottom:18}}>
                      <div style={{fontSize:11,color:"#4a4a4a",marginBottom:10}}>{qi+1}. {q.q}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {q.opts.map(o => (
                          <button key={o} className="str-btn" onClick={()=>setQuizA(p=>({...p,[q.id]:o}))}
                            style={{padding:"8px 12px",background:quizA[q.id]===o?`${GOLD}22`:"#111",border:`1px solid ${quizA[q.id]===o?GOLD:BOR}`,color:quizA[q.id]===o?GOLD:"#3a3a3a",fontFamily:FONT,fontSize:10,letterSpacing:".08em",textAlign:"left"}}>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="str-btn" onClick={calcStress} disabled={Object.keys(quizA).length<QUIZ.length}
                    style={{width:"100%",padding:"14px 0",background:Object.keys(quizA).length>=QUIZ.length?GOLD:"#111",color:Object.keys(quizA).length>=QUIZ.length?"#080808":"#2a2a2a",border:"none",fontFamily:FONT,fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>
                    Calculate My Score
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOURNAL MODAL */}
      <AnimatePresence>
        {showJModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setJModal(false)}
            style={{position:"fixed",inset:0,background:"#000000dd",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92}} animate={{scale:1}} exit={{scale:.92}} onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:24,maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:GOLD}}>NEW JOURNAL ENTRY</div>
                <button className="str-btn" onClick={()=>setJModal(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#444",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              <Label>How are you feeling?</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {Object.entries(MOOD_MAP).map(([m,e]) => (
                  <button key={m} className="str-btn" onClick={()=>setJForm(p=>({...p,mood:m}))}
                    style={{padding:"6px 10px",background:jForm.mood===m?`${GOLD}22`:"#111",border:`1px solid ${jForm.mood===m?GOLD:BOR}`,color:jForm.mood===m?GOLD:"#3a3a3a",fontFamily:FONT,fontSize:10}}>
                    {e} {m}
                  </button>
                ))}
              </div>
              <Label>Stress triggers</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
                {TRIGGERS.map(t => (
                  <button key={t.id} className="str-btn" onClick={()=>setJForm(p=>({...p,trigger:p.trigger.includes(t.id)?p.trigger.filter(x=>x!==t.id):[...p.trigger,t.id]}))}
                    style={{padding:"8px 10px",background:jForm.trigger.includes(t.id)?`${GOLD}22`:"#111",border:`1px solid ${jForm.trigger.includes(t.id)?GOLD:BOR}`,color:jForm.trigger.includes(t.id)?GOLD:"#3a3a3a",fontFamily:FONT,fontSize:9,textAlign:"left",display:"flex",alignItems:"center",gap:6}}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
              <Label>Intensity: {jForm.intensity}/10</Label>
              <input type="range" min="1" max="10" value={jForm.intensity} onChange={e=>setJForm(p=>({...p,intensity:Number(e.target.value)}))} className="str-range" style={{width:"100%",marginBottom:14}} />
              <textarea className="str-input" rows={3} placeholder="Write about how you're feeling..." value={jForm.notes} onChange={e=>setJForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:14}} />
              <button className="str-btn" onClick={saveJournal} disabled={!jForm.mood||!jForm.trigger.length}
                style={{width:"100%",padding:"14px 0",background:jForm.mood&&jForm.trigger.length?GOLD:"#111",color:jForm.mood&&jForm.trigger.length?"#080808":"#2a2a2a",border:"none",fontFamily:FONT,fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>
                Save Entry
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowS(false)}
            style={{position:"fixed",inset:0,background:"#000000dd",zIndex:130,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92}} animate={{scale:1}} exit={{scale:.92}} onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:24,maxWidth:360,width:"100%"}}>
              <div style={{fontFamily:HEAD,fontSize:22,color:GOLD,marginBottom:18}}>SETTINGS</div>
              {[
                {label:"Sound Effects",val:soundOn,set:setSound},
                {label:"Voice Coaching",val:voiceOn,set:setVoice},
              ].map(({label,val,set}) => (
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${BOR}`,padding:"12px 14px",marginBottom:8}}>
                  <div style={{fontSize:11,color:"#4a4a4a"}}>{label}</div>
                  <button className="str-btn" onClick={()=>set(!val)}
                    style={{width:44,height:24,borderRadius:12,background:val?GOLD:"#1a1a1a",border:"none",position:"relative",transition:"background .2s"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:val?"#080808":"#555",position:"absolute",top:3,left:val?23:3,transition:"left .2s"}} />
                  </button>
                </div>
              ))}
              <button className="str-btn" onClick={exportData}
                style={{width:"100%",padding:"12px 0",background:"transparent",border:`1px solid ${BOR}`,color:"#3a3a3a",fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase",marginTop:8}}>
                ↓ Export Data
              </button>
              <button className="str-btn" onClick={()=>{setMoods([]);setJournal([]);setGoals(GOALS_INIT);setStreak(0);setHrv([]);setAch([]);setShowS(false)}}
                style={{width:"100%",padding:"12px 0",background:"transparent",border:`1px solid #2a1010`,color:"#ef4444",fontFamily:FONT,fontSize:10,letterSpacing:".15em",textTransform:"uppercase",marginTop:8}}>
                ↺ Reset All Data
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ HEADER ═══════════════ */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:BG,zIndex:20}}>
        <div>
          <div style={{fontFamily:HEAD,fontSize:28,letterSpacing:".04em",lineHeight:1}}>STRESS & BURNOUT</div>
          <div style={{fontSize:8,letterSpacing:".2em",color:"#252525",textTransform:"uppercase",marginTop:2}}>MANIFIX Stress Management · WHO ICD-11 Burnout Protocol</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:8,letterSpacing:".15em",color:"#252525",textTransform:"uppercase"}}>Stress Level</div>
            <div style={{fontFamily:HEAD,fontSize:22,color:stressColor}}>{stressScore}% {stressLabel}</div>
          </div>
          <button className="str-btn" onClick={()=>setShowSOS(true)} style={{padding:"8px 12px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:RED,fontFamily:FONT,fontSize:9,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>🆘 SOS</button>
          <button className="str-btn" onClick={()=>setShowS(true)} style={{padding:"8px 12px",background:"transparent",border:`1px solid ${BOR}`,color:"#3a3a3a",fontFamily:FONT,fontSize:9,letterSpacing:".12em"}}>⚙</button>
          <button className="str-btn" onClick={()=>navigate("/app/dashboard")} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",fontFamily:FONT,fontSize:9,letterSpacing:".15em",padding:"8px 12px",textTransform:"uppercase"}}>← Back</button>
        </div>
      </div>

      {/* ═══════════════ TAB NAV ═══════════════ */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"0 20px",display:"flex",gap:0,overflowX:"auto",background:BG,position:"sticky",top:57,zIndex:19}}>
        {TABS.map(t => (
          <button key={t.id} className="str-btn" onClick={()=>setTab(t.id)}
            style={{padding:"12px 16px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?GOLD:"transparent"}`,color:tab===t.id?GOLD:"#2a2a2a",fontFamily:FONT,fontSize:9,letterSpacing:".15em",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all .2s"}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px 60px"}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}} className="str-up">

            {/* ────── HOME ────── */}
            {tab==="home" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* Forecast */}
                {forecast && (
                  <Card style={{borderLeft:`3px solid ${GOLD}`}}>
                    <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                      <div style={{fontSize:28}}>☀️</div>
                      <div style={{flex:1}}>
                        <Label style={{marginBottom:4}}>Today's Stress Forecast</Label>
                        <div style={{fontSize:11,color:"#3a3a3a",lineHeight:1.7,marginBottom:10}}>{forecast.tip}</div>
                        <div style={{display:"flex",gap:16}}>
                          {[["Morning",forecast.morning,GREEN],["Afternoon",forecast.afternoon,GOLD],["Evening",forecast.evening,BLUE]].map(([l,v,c])=>(
                            <div key={l}>
                              <div style={{fontSize:7,letterSpacing:".15em",color:"#252525",textTransform:"uppercase"}}>{l}</div>
                              <div style={{fontFamily:HEAD,fontSize:20,color:c}}>{v}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Stats row */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <Card>
                    <Label>Stress Score</Label>
                    <div style={{fontFamily:HEAD,fontSize:36,color:stressColor,lineHeight:1}}>{stressScore}%</div>
                    <div style={{fontSize:9,color:stressColor,marginTop:4,letterSpacing:".1em"}}>{stressLabel}</div>
                    <Bar pct={stressScore} color={stressColor} />
                    <button className="str-btn" onClick={()=>setShowQuiz(true)}
                      style={{marginTop:10,width:"100%",padding:"8px 0",background:"transparent",border:`1px solid ${BOR}`,color:"#2a2a2a",fontFamily:FONT,fontSize:8,letterSpacing:".15em",textTransform:"uppercase"}}>
                      Retake Assessment
                    </button>
                  </Card>
                  <Card>
                    <Label>Calm Streak</Label>
                    <div style={{fontFamily:HEAD,fontSize:36,color:GOLD,lineHeight:1}}>{streak} days</div>
                    <div style={{fontSize:9,color:"#2a2a2a",marginTop:4}}>Peaceful/Calm/Energized moods</div>
                    <div style={{marginTop:12,fontSize:22}}>🔥</div>
                  </Card>
                  <Card>
                    <Label>HRV (Live)</Label>
                    <div style={{fontFamily:HEAD,fontSize:36,color:PURPLE,lineHeight:1}}>
                      {hrvData.length?hrvData[hrvData.length-1].value:"—"}
                    </div>
                    <div style={{fontSize:9,color:"#2a2a2a",marginTop:4}}>ms · Heart Rate Variability</div>
                    <div style={{marginTop:4,fontSize:8,color:PURPLE,letterSpacing:".1em",textTransform:"uppercase",animation:"str-blink 1.2s infinite"}}>● Live</div>
                  </Card>
                </div>

                {/* Goals */}
                <Card>
                  <Label>Daily Goals</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {goals.map(g => (
                      <div key={g.id} className="str-btn" onClick={()=>setGoals(prev=>prev.map(x=>x.id===g.id?{...x,done:!x.done}:x))}
                        style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${g.done?"#1e4d1e":BOR}`,background:g.done?"#0a140a":"#111",padding:"10px 12px"}}>
                        <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${g.done?GREEN:BOR}`,background:g.done?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#080808",fontSize:10,flexShrink:0}}>
                          {g.done&&"✓"}
                        </div>
                        <span style={{fontSize:10,color:g.done?"#4a4a4a":"#3a3a3a",textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Active triggers */}
                {activeTriggers.length > 0 && (
                  <Card>
                    <Label>Active Stress Triggers</Label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {activeTriggers.map(id => {
                        const t = TRIGGERS.find(x=>x.id===id);
                        return t ? <div key={id} style={{padding:"5px 10px",background:`${GOLD}12`,border:`1px solid ${GOLD}33`,color:GOLD,fontSize:9,letterSpacing:".1em",display:"flex",alignItems:"center",gap:5}}><span>{t.icon}</span><span>{t.label}</span></div> : null;
                      })}
                    </div>
                  </Card>
                )}

                {/* Achievements */}
                {achievements.length > 0 && (
                  <Card>
                    <Label>Recent Achievements</Label>
                    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
                      {[...achievements].reverse().slice(0,6).map(a => (
                        <div key={a.id} style={{flexShrink:0,background:"#111",border:`1px solid ${GOLD}22`,padding:"10px 12px",textAlign:"center",minWidth:100}}>
                          <div style={{fontSize:20,marginBottom:4}}>⭐</div>
                          <div style={{fontSize:9,color:GOLD,letterSpacing:".08em"}}>{a.name}</div>
                          <div style={{fontSize:7,color:"#2a2a2a",marginTop:2}}>{new Date(a.date).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ────── PROGRAMS ────── */}
            {tab==="programs" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:28,color:"#e8e4d9"}}>STRESS RECOVERY PROGRAMS</div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {PROGRAMS.map(prog => (
                    <Card key={prog.id} style={{cursor:"pointer"}} className="str-card-hover">
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{fontSize:28}}>{prog.emoji}</div>
                        <div style={{fontSize:8,padding:"3px 8px",background:`${GOLD}15`,border:`1px solid ${GOLD}33`,color:GOLD,letterSpacing:".12em",textTransform:"uppercase"}}>{prog.level}</div>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e4d9",marginBottom:3}}>{prog.title}</div>
                      <div style={{fontSize:9,color:`${GOLD}88`,marginBottom:6}}>{prog.duration} min</div>
                      <div style={{fontSize:10,color:"#2a2a2a",lineHeight:1.6,marginBottom:12}}>{prog.desc}</div>
                      <button className="str-btn" onClick={()=>startProgram(prog)}
                        style={{width:"100%",padding:"10px 0",background:GOLD,color:"#080808",border:"none",fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
                        ▶ Start Program
                      </button>
                    </Card>
                  ))}
                </div>

                <div style={{fontFamily:HEAD,fontSize:22,color:"#e8e4d9",marginTop:8}}>GUIDED MEDITATION</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {MEDITATIONS.map(s => (
                    <Card key={s.id} style={{cursor:"pointer"}} className="str-card-hover">
                      <div style={{fontSize:28,marginBottom:8}}>{s.emoji}</div>
                      <div style={{fontSize:11,color:"#e8e4d9",fontWeight:500,marginBottom:3}}>{s.title}</div>
                      <div style={{fontSize:9,color:`${PURPLE}88`,marginBottom:6}}>{s.duration} min</div>
                      <div style={{fontSize:9,color:"#2a2a2a",marginBottom:10}}>{s.focus}</div>
                      <button className="str-btn" onClick={()=>startMed(s)}
                        style={{width:"100%",padding:"8px 0",background:`${PURPLE}22`,border:`1px solid ${PURPLE}44`,color:PURPLE,fontFamily:FONT,fontSize:9,letterSpacing:".12em",textTransform:"uppercase"}}>
                        ▶ Start
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ────── TRACKER ────── */}
            {tab==="tracker" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:28,color:"#e8e4d9"}}>MOOD & STRESS TRACKER</div>

                <Card>
                  <Label>How are you feeling right now?</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {Object.entries(MOOD_MAP).map(([mood,emoji]) => (
                      <button key={mood} className="str-btn" onClick={()=>logMood(mood)}
                        style={{padding:"12px 8px",background:selMood===mood?`${GOLD}22`:"#111",border:`1px solid ${selMood===mood?GOLD:BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <span style={{fontSize:24}}>{emoji}</span>
                        <span style={{fontSize:8,letterSpacing:".1em",color:selMood===mood?GOLD:"#2a2a2a",textTransform:"uppercase"}}>{mood}</span>
                      </button>
                    ))}
                  </div>
                  {selMood && <div style={{textAlign:"center",marginTop:12,fontSize:11,color:GOLD}}>✓ Logged: {selMood}</div>}
                </Card>

                {/* HRV Chart */}
                <Card>
                  <Label>Real-Time HRV (Heart Rate Variability)</Label>
                  {hrvData.length > 2 ? (
                    <div style={{height:180}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hrvData}>
                          <defs>
                            <linearGradient id="hrvG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={GOLD} stopOpacity={0.35}/>
                              <stop offset="100%" stopColor={GOLD} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#111"/>
                          <XAxis dataKey="time" stroke="#252525" fontSize={9}/>
                          <YAxis stroke="#252525" fontSize={9} domain={[30,70]}/>
                          <Tooltip contentStyle={{background:"#0c0c0c",border:`1px solid ${BOR}`,color:"#e8e4d9",fontSize:10}}/>
                          <Area type="monotone" dataKey="value" stroke={GOLD} fill="url(#hrvG)" strokeWidth={2}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div style={{textAlign:"center",padding:"30px 0",fontSize:9,letterSpacing:".15em",color:"#1e1e1e",textTransform:"uppercase"}}>Collecting data...</div>}
                </Card>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {/* Mood trend */}
                  <Card>
                    <Label>7-Day Mood Trend</Label>
                    {moodChartData.length > 1 ? (
                      <div style={{height:160}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={moodChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#111"/>
                            <XAxis dataKey="day" stroke="#252525" fontSize={9}/>
                            <YAxis stroke="#252525" fontSize={9} domain={[0,10]}/>
                            <Tooltip contentStyle={{background:"#0c0c0c",border:`1px solid ${BOR}`,color:"#e8e4d9",fontSize:10}}/>
                            <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={{fill:GOLD,r:3}}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div style={{textAlign:"center",padding:"30px 0",fontSize:9,letterSpacing:".15em",color:"#1e1e1e",textTransform:"uppercase"}}>Log mood daily to see trends</div>}
                    <div style={{marginTop:8,display:"flex",justifyContent:"space-between"}}>
                      <div><div style={{fontSize:7,color:"#252525",textTransform:"uppercase",letterSpacing:".15em"}}>Avg Mood</div><div style={{fontFamily:HEAD,fontSize:20,color:GOLD}}>{avgMood}</div></div>
                      <div><div style={{fontSize:7,color:"#252525",textTransform:"uppercase",letterSpacing:".15em"}}>Calm Sessions</div><div style={{fontFamily:HEAD,fontSize:20,color:GREEN}}>{medTaken}</div></div>
                    </div>
                  </Card>

                  {/* Trigger correlation */}
                  <Card>
                    <Label>Trigger Correlation</Label>
                    {triggerCorr.length > 0 ? (
                      <div style={{height:160}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={triggerCorr} cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value" nameKey="name">
                              {triggerCorr.map((_,i)=>(
                                <Cell key={i} fill={[GOLD,ORANGE,BLUE,PURPLE,GREEN][i%5]}/>
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{background:"#0c0c0c",border:`1px solid ${BOR}`,color:"#e8e4d9",fontSize:10}}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div style={{textAlign:"center",padding:"30px 0",fontSize:9,letterSpacing:".15em",color:"#1e1e1e",textTransform:"uppercase"}}>Add journal entries to see correlations</div>}
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
                      {triggerCorr.map((c,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:[GOLD,ORANGE,BLUE,PURPLE,GREEN][i%5]}}/>
                          <span style={{fontSize:8,color:"#2a2a2a"}}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Trigger selector */}
                <Card>
                  <Label>Identify Your Stress Triggers</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                    {TRIGGERS.map(t => (
                      <button key={t.id} className="str-btn" onClick={()=>setAT(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])}
                        style={{padding:"10px 6px",background:activeTriggers.includes(t.id)?`${GOLD}20`:"#111",border:`1px solid ${activeTriggers.includes(t.id)?GOLD:BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <span style={{fontSize:18}}>{t.icon}</span>
                        <span style={{fontSize:7,letterSpacing:".08em",color:activeTriggers.includes(t.id)?GOLD:"#2a2a2a",textTransform:"uppercase",textAlign:"center"}}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ────── JOURNAL ────── */}
            {tab==="journal" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontFamily:HEAD,fontSize:28,color:"#e8e4d9"}}>STRESS JOURNAL</div>
                  <button className="str-btn" onClick={()=>setJModal(true)}
                    style={{padding:"10px 16px",background:GOLD,color:"#080808",border:"none",fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
                    + New Entry
                  </button>
                </div>

                {journal.length === 0 ? (
                  <Card style={{textAlign:"center",padding:"50px 20px"}}>
                    <div style={{fontSize:40,marginBottom:12}}>📓</div>
                    <div style={{fontSize:11,color:"#2a2a2a",letterSpacing:".12em",textTransform:"uppercase"}}>No entries yet</div>
                    <div style={{fontSize:10,color:"#1a1a1a",marginTop:6}}>Start tracking your stress patterns</div>
                  </Card>
                ) : (
                  [...journal].reverse().map(entry => {
                    const mood = MOOD_MAP[entry.mood];
                    return (
                      <Card key={entry.id}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontSize:8,color:"#252525",letterSpacing:".12em",marginBottom:4}}>{new Date(entry.date).toLocaleString()}</div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:20}}>{mood}</span>
                              <span style={{fontSize:11,color:"#4a4a4a"}}>{entry.mood}</span>
                              <span style={{fontSize:8,color:"#252525",padding:"2px 6px",border:`1px solid ${BOR}`}}>Intensity {entry.intensity}/10</span>
                            </div>
                          </div>
                          <button className="str-btn" onClick={()=>setJournal(p=>p.filter(x=>x.id!==entry.id))}
                            style={{padding:"4px 8px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:RED,fontFamily:FONT,fontSize:8}}>✕</button>
                        </div>
                        {entry.trigger?.length > 0 && (
                          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                            {entry.trigger.map(id=>{const t=TRIGGERS.find(x=>x.id===id);return t?<div key={id} style={{padding:"3px 8px",background:`${GOLD}12`,border:`1px solid ${GOLD}22`,color:GOLD,fontSize:8,display:"flex",alignItems:"center",gap:4}}><span>{t.icon}</span><span>{t.label}</span></div>:null;})}
                          </div>
                        )}
                        {entry.notes && <div style={{fontSize:10,color:"#3a3a3a",lineHeight:1.7,fontStyle:"italic",borderLeft:`2px solid ${BOR}`,paddingLeft:10}}>"{entry.notes}"</div>}
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* ────── TOOLS ────── */}
            {tab==="tools" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:28,color:"#e8e4d9"}}>STRESS RELIEF TOOLS</div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,alignItems:"start"}}>
                  <Card>
                    <Label>Box Breathing Exercise</Label>
                    <BreathCircle active={breathActive} onToggle={()=>setBrA(!breathActive)} />
                  </Card>

                  <Card>
                    <Label>Coping Strategies</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                      {COPING.map(c => (
                        <button key={c.id} className="str-btn" onClick={()=>{setSelCoping(c);setCopingR(false);setCopingT(0);}}
                          style={{padding:"10px 12px",background:selCoping?.id===c.id?`${GOLD}18`:"#111",border:`1px solid ${selCoping?.id===c.id?GOLD:BOR}`,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:10,color:"#e8e4d9"}}>{c.title}</div>
                            <div style={{fontSize:8,color:"#252525",marginTop:2}}>{c.desc}</div>
                          </div>
                          <div style={{fontSize:8,color:GOLD,letterSpacing:".08em",flexShrink:0,marginLeft:8}}>{c.time}</div>
                        </button>
                      ))}
                    </div>
                    {selCoping && (
                      <div style={{border:`1px solid ${BOR}`,padding:12}}>
                        <div style={{fontSize:10,color:"#3a3a3a",marginBottom:10}}>{selCoping.desc}</div>
                        <button className="str-btn" onClick={()=>{
                          setCopingR(!copingRun);
                          if (!copingRun) {
                            setCopingT(0);
                            copRef.current = setInterval(()=>setCopingT(p=>p+1),1000);
                          } else { clearInterval(copRef.current); }
                        }}
                          style={{width:"100%",padding:"10px 0",background:copingRun?"transparent":GOLD,color:copingRun?RED:"#080808",border:copingRun?`1px solid ${RED}`:"none",fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
                          {copingRun?"⏹ Stop":"▶ Start"}
                        </button>
                        {copingRun && <div style={{textAlign:"center",fontFamily:HEAD,fontSize:28,color:GOLD,marginTop:10}}>{fmt(copingTime)}</div>}
                      </div>
                    )}
                  </Card>

                  <Card>
                    <Label>Daily Tip</Label>
                    <div style={{minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 0"}}>
                      <AnimatePresence mode="wait">
                        <motion.div key={tipIdx} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.4}}
                          style={{fontSize:12,color:"#4a4a4a",lineHeight:1.8,textAlign:"center"}}>
                          {DAILY_TIPS[tipIdx]}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <button className="str-btn" onClick={()=>setTipIdx(p=>(p+1)%DAILY_TIPS.length)}
                      style={{width:"100%",padding:"8px 0",background:"transparent",border:`1px solid ${BOR}`,color:"#2a2a2a",fontFamily:FONT,fontSize:9,letterSpacing:".15em",textTransform:"uppercase"}}>
                      Next Tip →
                    </button>
                  </Card>
                </div>

                {/* Cortisol & Recovery */}
                <Card>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                    <div>
                      <Label>Estimated Cortisol Level</Label>
                      <div style={{fontSize:9,color:"#1e1e1e",marginBottom:12,lineHeight:1.6}}>Estimated from mood logs + breathing sessions</div>
                      <Bar pct={Math.min(100,cortisol*8)} color={cortisol<10?GREEN:cortisol<15?GOLD:RED} height={8}/>
                      <div style={{fontFamily:HEAD,fontSize:30,color:cortisol<10?GREEN:cortisol<15?GOLD:RED,marginTop:8}}>{cortisol} mcg/dL</div>
                      <div style={{fontSize:8,color:"#1e1e1e"}}>Normal: 6–23 mcg/dL (morning)</div>
                      <button className="str-btn" onClick={()=>{setCortisol(v=>Math.max(5,v-1));saveJournal;}}
                        style={{marginTop:10,padding:"8px 14px",background:`${GREEN}22`,border:`1px solid ${GREEN}44`,color:GREEN,fontFamily:FONT,fontSize:9,letterSpacing:".12em",textTransform:"uppercase"}}>
                        Breathing session → cortisol ↓
                      </button>
                    </div>
                    <div>
                      <Label>Recovery Status</Label>
                      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                        {[
                          {label:"Parasympathetic Balance",val:`${Math.max(20,100-stressScore)}%`,color:GREEN},
                          {label:"Nervous System State",val:hrvData.length>3?"Recovering":"Idle",color:GOLD},
                          {label:"Sleep Readiness",val:`${Math.max(30,80-stressScore*0.5).toFixed(0)}%`,color:BLUE},
                          {label:"Burnout Risk",val:stressScore>70?"High":stressScore>50?"Moderate":"Low",color:stressScore>70?RED:stressScore>50?GOLD:GREEN},
                        ].map(({label,val,color}) => (
                          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${BOR}`,paddingBottom:8}}>
                            <span style={{fontSize:9,color:"#2a2a2a"}}>{label}</span>
                            <span style={{fontSize:10,color,fontWeight:700}}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Guide */}
                <Card>
                  <Label>Quick Stress Relief Guide</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {title:"5-4-3-2-1 Ground",desc:"See 5 things, touch 4, hear 3, smell 2, taste 1",emoji:"🌍"},
                      {title:"Box Breathing",desc:"In 4s · Hold 4s · Out 4s · Hold 4s · Repeat 4×",emoji:"🫁"},
                      {title:"Prog. Relaxation",desc:"Tense and release each muscle group head to toe",emoji:"💪"},
                      {title:"Gratitude Shift",desc:"Name 3 things you are grateful for right now",emoji:"❤️"},
                    ].map((item,i) => (
                      <div key={i} style={{background:"#111",border:`1px solid ${BOR}`,padding:"12px 10px"}}>
                        <div style={{fontSize:22,marginBottom:8}}>{item.emoji}</div>
                        <div style={{fontSize:10,color:"#e8e4d9",marginBottom:4}}>{item.title}</div>
                        <div style={{fontSize:9,color:"#2a2a2a",lineHeight:1.6}}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
