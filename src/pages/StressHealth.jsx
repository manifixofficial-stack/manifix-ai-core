/**
 * ManifiX AI — Stress & Burnout Health Module
 * UPGRADED: framer-motion + recharts native
 * Black #080808 + Gold #ffc83c + Bebas Neue + DM Mono
 * Features: HRV Live, SOS, Meditation Timer, Cortisol Estimator,
 * AI Journal, Mood Tracker, Breath Coach, Trigger Correlation,
 * Coping Strategies, Burnout Index, Recovery Score, Daily Forecast,
 * Streak System, Achievements, Wearable HRV Sim, Export, Settings
 *
 * package.json deps required:
 *   "framer-motion": "^11.x",
 *   "recharts": "^2.x",
 *   "react-router-dom": "^6.x"
 */

import {
  useEffect, useState, useCallback, useRef, useMemo,
} from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar,
} from "recharts";

/* ═══════════════ TOKENS ═══════════════ */
const G = "#ffc83c";
const DIM = "#c8a84b";
const BG = "#080808";
const CARD = "#0c0c0c";
const CARD2 = "#0f0f0f";
const BOR = "#1a1a1a";
const BOR2 = "#222";
const FONT = "'DM Mono','Courier New',monospace";
const HEAD = "'Bebas Neue',sans-serif";
const GREEN = "#4ade80";
const RED = "#ef4444";
const PURPLE = "#A78BFA";
const BLUE = "#60A5FA";
const ORANGE = "#f97316";
const TEAL = "#2dd4bf";

/* ═══════════════ GLOBAL CSS ═══════════════ */
function injectCSS() {
  if (document.getElementById("mx-css")) return;
  const s = document.createElement("style");
  s.id = "mx-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    @keyframes mx-pulse{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.16;transform:scale(1.1)}}
    @keyframes mx-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes mx-spin{to{transform:rotate(360deg)}}
    @keyframes mx-scan{from{top:-2px}to{top:102%}}
    @keyframes mx-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes mx-glow{0%,100%{box-shadow:0 0 6px #ffc83c22}50%{box-shadow:0 0 18px #ffc83c55}}
    @keyframes mx-hb{0%,100%{transform:scale(1)}15%{transform:scale(1.28)}30%{transform:scale(1)}}
    .mx-btn{cursor:pointer;transition:all .14s ease;outline:none}
    .mx-btn:hover{opacity:.9;transform:translateY(-1px)}
    .mx-btn:active{transform:translateY(0) scale(.98)}
    .mx-input{background:#0a0a0a;border:1px solid #1a1a1a;color:#ddd8cc;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.05em;padding:10px 14px;width:100%;outline:none;transition:border-color .2s;resize:none}
    .mx-input:focus{border-color:#ffc83c44}
    .mx-input::placeholder{color:#1e1e1e}
    .mx-range{width:100%;accent-color:#ffc83c;height:3px}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}
    .mx-card{background:#0c0c0c;border:1px solid #1a1a1a;transition:border-color .2s}
    .mx-card:hover{border-color:#242424}
    .mx-tab-active{color:#ffc83c;border-bottom:2px solid #ffc83c!important}
    .mx-shimmer{background:linear-gradient(90deg,transparent,#ffc83c18,transparent);background-size:200%;animation:mx-shimmer 1.8s infinite}
    @keyframes mx-shimmer{from{background-position:-200% center}to{background-position:200% center}}
    .mx-scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ffc83c44,transparent);animation:mx-scan 3s linear infinite;pointer-events:none}
    .mx-hb{animation:mx-hb 1.4s ease-in-out infinite}
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
  Tired:"#888",Restless:GOLD,Anxious:ORANGE,
  "Burned Out":RED,Overwhelmed:RED,
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
  "Hydrate before reaching for caffeine.","Walk 5 minutes after a stressful task.","Avoid doom-scrolling 1hr before bed.",
  "Take one deep breath before replying emotionally.","Stretch your shoulders every hour at desk.",
  "Write 3 things you're grateful for tonight.","Practice 5-4-3-2-1 grounding when overwhelmed.",
  "Listen to 10 min of ambient sound during focus work.","Step outside and feel sunlight on your face.",
  "Progressive muscle relaxation helps with insomnia.","Cold water on wrists resets acute panic fast.",
  "Name the emotion — naming reduces its intensity by 50%.","Delay decisions when cortisol is high.",
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
];

/* ═══════════════ SHARED UI ═══════════════ */
const Card = ({children, style={}, className=""}) => (
  <div className={`mx-card ${className}`} style={{padding:20,...style}}>{children}</div>
);

const Label = ({children, style={}}) => (
  <div style={{fontSize:8,letterSpacing:".22em",color:"#252525",textTransform:"uppercase",marginBottom:7,...style}}>{children}</div>
);

const GoldBtn = ({children, onClick, style={}, small=false}) => (
  <button className="mx-btn" onClick={onClick} style={{
    padding:small?"7px 14px":"12px 22px",background:G,color:BG,border:"none",
    fontFamily:FONT,fontSize:small?9:10,fontWeight:700,letterSpacing:".18em",
    textTransform:"uppercase",...style,
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
    <div style={{height,background:"#111",borderRadius:height,overflow:"hidden",marginTop:6}}>
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
      padding:"5px 11px",background:active?`${color}18`:"#111",
      border:`1px solid ${active?color:BOR}`,color:active?color:"#333",
      fontFamily:FONT,fontSize:9,letterSpacing:".1em",...style,
    }}>{children}</button>
  );
}

/* ═══════════════ HRV LIVE BADGE ═══════════════ */
function HrvBadge({value}) {
  const prev = useRef(value);
  const dir = value > prev.current ? "↑" : value < prev.current ? "↓" : "—";
  useEffect(() => { prev.current = value; }, [value]);
  const zone = value > 55 ? GREEN : value > 40 ? G : RED;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div className="mx-hb" style={{width:8,height:8,borderRadius:"50%",background:zone}} />
      <span style={{fontFamily:HEAD,fontSize:26,color:zone,lineHeight:1}}>{value}</span>
      <span style={{fontSize:8,color:zone,letterSpacing:".08em"}}>ms {dir}</span>
    </div>
  );
}

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
      if (ct < 0) {
        pi = (pi + 1) % SEQ.length;
        if (pi === 0) setCycles(c => c + 1);
        ct = SEQ[pi].s; setPhase(SEQ[pi].l);
      }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active]);

  const sz = active ? (phase === "Inhale" ? 140 : phase === "Exhale" ? 72 : 105) : 90;
  const dur = phase === "Inhale" ? 4 : phase === "Exhale" ? 6 : 1;

  return (
    <div style={{textAlign:"center",padding:"14px 0"}}>
      <div style={{height:170,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {/* outer ring */}
        <motion.div
          animate={{width:sz+40,height:sz+40,opacity:active?0.25:0}}
          transition={{duration:dur,ease:"easeInOut"}}
          style={{position:"absolute",borderRadius:"50%",border:`1px solid ${color}`,pointerEvents:"none"}}
        />
        <motion.div
          animate={{width:sz,height:sz}}
          transition={{duration:dur,ease:"easeInOut"}}
          style={{borderRadius:"50%",background:`${color}15`,border:`2px solid ${color}55`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}
        >
          {active ? (
            <>
              <div style={{fontFamily:HEAD,fontSize:34,color,lineHeight:1}}>{count}</div>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${color}88`,textTransform:"uppercase"}}>{phase}</div>
            </>
          ) : <div style={{fontSize:30}}>🫁</div>}
        </motion.div>
      </div>
      {active && (
        <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:10}}>
          Cycles: {cycles}
        </div>
      )}
      <button className="mx-btn" onClick={onToggle} style={{
        padding:"10px 26px",background:active?"transparent":color,
        color:active?RED:BG,border:active?`1px solid ${RED}`:"none",
        fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
      }}>
        {active ? "⏹ Stop" : "▶ Start Exercise"}
      </button>
    </div>
  );
}

/* ═══════════════ SOS OVERLAY ═══════════════ */
function SosOverlay({onClose}) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(4);
  const [step, setStep] = useState(0);
  const ref = useRef(null);
  const SEQ = [{l:"Inhale",s:4},{l:"Hold",s:4},{l:"Exhale",s:6},{l:"Rest",s:2}];

  useEffect(() => {
    let pi = 0, ct = 4;
    ref.current = setInterval(() => {
      ct--;
      if (ct < 0) { pi = (pi + 1) % SEQ.length; ct = SEQ[pi].s; setPhase(SEQ[pi].l); }
      setCount(ct);
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const sz = phase === "Inhale" ? 200 : phase === "Exhale" ? 100 : 160;
  const TIPS = [
    "You are safe right now.",
    "This feeling will pass.",
    "Your body is responding to stress — that's normal.",
    "Focus only on the breath.",
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:200,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div className="mx-scan-line" />
      <motion.div initial={{scale:.9,y:20}} animate={{scale:1,y:0}} transition={{type:"spring",stiffness:200}}>
        <div style={{textAlign:"center",maxWidth:380}}>
          <div style={{fontFamily:HEAD,fontSize:42,color:RED,letterSpacing:".06em",lineHeight:1}}>SOS CALM MODE</div>
          <div style={{fontSize:8,letterSpacing:".22em",color:"#2a2a2a",textTransform:"uppercase",margin:"8px 0 36px"}}>
            3-min emergency protocol · Follow the circle
          </div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:36}}>
            <div style={{position:"relative",width:240,height:240,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <motion.div animate={{width:sz+40,height:sz+40,opacity:.15}} transition={{duration:phase==="Inhale"?4:phase==="Exhale"?6:1,ease:"easeInOut"}}
                style={{position:"absolute",borderRadius:"50%",border:"1px solid rgba(239,68,68,.5)"}} />
              <motion.div animate={{width:sz,height:sz}} transition={{duration:phase==="Inhale"?4:phase==="Exhale"?6:1,ease:"easeInOut"}}
                style={{borderRadius:"50%",background:"rgba(239,68,68,.12)",border:"2px solid rgba(239,68,68,.35)",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontFamily:HEAD,fontSize:44,color:RED,lineHeight:1}}>{count}</div>
                <div style={{fontSize:9,letterSpacing:".15em",color:"rgba(239,68,68,.5)",textTransform:"uppercase"}}>{phase}</div>
              </motion.div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={Math.floor(Date.now()/6000)%TIPS.length}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{fontSize:12,color:"#333",letterSpacing:".08em",marginBottom:28,lineHeight:1.8}}>
              {TIPS[Math.floor(Date.now()/6000)%TIPS.length]}
            </motion.div>
          </AnimatePresence>
          <GhostBtn onClick={onClose} color="#2a2a2a">Exit SOS Mode</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════ BURNOUT INDEX RADAR ═══════════════ */
function BurnoutRadar({score, hrvLast, moods, journal}) {
  const moodAvg = moods.length
    ? moods.slice(-7).reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/Math.min(moods.length,7)
    : 5;
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
        <PolarGrid stroke="#1a1a1a" />
        <PolarAngleAxis dataKey="axis" tick={{fontSize:8,fill:"#333",fontFamily:FONT,letterSpacing:".1em"}} />
        <Radar dataKey="value" stroke={G} fill={G} fillOpacity={0.12} strokeWidth={2} dot={{fill:G,r:3}} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════ PROGRAM OVERLAY ═══════════════ */
function ProgramOverlay({prog, time, step, running, onPause, onResume, onStop}) {
  const pct = (time / (prog.duration * 60)) * 100;
  const stepDur = (prog.duration * 60) / prog.steps.length;
  const stepPct = ((time % stepDur) / stepDur) * 100;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:150,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="mx-scan-line" />
      <motion.div initial={{scale:.94,y:20}} animate={{scale:1,y:0}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:420,width:"100%"}}>
        <div style={{fontSize:40,marginBottom:10}}>{prog.emoji}</div>
        <div style={{fontFamily:HEAD,fontSize:36,color:"#e8e4d9",marginBottom:2}}>{prog.title}</div>
        <div style={{fontSize:8,letterSpacing:".2em",color:"#252525",textTransform:"uppercase",marginBottom:24}}>
          Step {step+1} / {prog.steps.length}
        </div>
        <div style={{position:"relative",width:180,height:180,margin:"0 auto 24px"}}>
          <svg viewBox="0 0 180 180" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="#111" strokeWidth="6"/>
            <circle cx="90" cy="90" r="80" fill="none" stroke={prog.color||G} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*80}`}
              strokeDashoffset={`${2*Math.PI*80*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .5s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:HEAD,fontSize:44,color:prog.color||G,lineHeight:1}}>{Math.floor(time/60)}:{String(time%60).padStart(2,"0")}</div>
            <div style={{fontSize:8,letterSpacing:".12em",color:"#2a2a2a",textTransform:"uppercase"}}>elapsed</div>
          </div>
        </div>
        <motion.div key={step} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 20px",marginBottom:14,
            fontSize:13,color:"#3a3a3a",lineHeight:1.8,letterSpacing:".04em"}}>
          {prog.steps[step]}
        </motion.div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:18}}>
          {prog.steps.map((_,i)=>(
            <div key={i} style={{height:3,width:28,borderRadius:2,
              background:i<step?G:i===step?`${G}88`:"#1a1a1a",transition:"background .3s"}} />
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
  const pct = (time / (med.duration * 60)) * 100;
  const remaining = med.duration * 60 - time;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.96)",zIndex:140,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <motion.div initial={{scale:.94}} animate={{scale:1}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:360,width:"100%"}}>
        <div style={{fontSize:44,marginBottom:12}}>{med.emoji}</div>
        <div style={{fontFamily:HEAD,fontSize:34,color:"#e8e4d9",marginBottom:3}}>{med.title}</div>
        <div style={{fontSize:9,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:32}}>{med.focus}</div>
        <div style={{position:"relative",width:200,height:200,margin:"0 auto 28px"}}>
          <svg viewBox="0 0 200 200" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="#111" strokeWidth="5"/>
            <circle cx="100" cy="100" r="88" fill="none" stroke={med.color||PURPLE} strokeWidth="5"
              strokeDasharray={`${2*Math.PI*88}`}
              strokeDashoffset={`${2*Math.PI*88*(1-pct/100)}`} strokeLinecap="round"
              style={{transition:"stroke-dashoffset .5s linear"}}/>
          </svg>
          <motion.div
            animate={running?{scale:[1,1.06,1]}:{}}
            transition={{duration:8,repeat:Infinity,ease:"easeInOut"}}
            style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:HEAD,fontSize:48,color:med.color||PURPLE,lineHeight:1}}>
              {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}
            </div>
            <div style={{fontSize:8,letterSpacing:".12em",color:"#2a2a2a",textTransform:"uppercase",marginTop:4}}>remaining</div>
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

/* ═══════════════ CUSTOM TOOLTIP ═══════════════ */
const MxTooltip = ({active,payload,label}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"8px 12px",fontFamily:FONT,fontSize:9,letterSpacing:".08em",color:"#4a4a4a"}}>
      <div style={{color:G,marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||G}}>{p.name}: <span style={{color:"#ddd"}}>{p.value}</span></div>
      ))}
    </div>
  );
};

/* ═══════════════ MAIN ═══════════════ */
export default function Stress() {
  const [tab, setTab] = useState("home");
  const [stressScore, setScore] = useState(() => Number(localStorage.getItem("mx_score")||62));
  const [streak, setStreak] = useLS("mx_streak", 0);
  const [moods, setMoods] = useLS("mx_moods", []);
  const [journal, setJournal] = useLS("mx_journal", []);
  const [goals, setGoals] = useLS("mx_goals", GOALS_INIT);
  const [activeTriggers, setAT] = useLS("mx_triggers", []);
  const [hrvData, setHrv] = useLS("mx_hrv", []);
  const [unlockedAch, setUnlocked] = useLS("mx_ach", []);
  const [sessCount, setSessCount] = useLS("mx_sess", 0);
  const [medCount, setMedCount] = useLS("mx_meds", 0);
  const [soundOn, setSound] = useLS("mx_sound", true);
  const [voiceOn, setVoice] = useLS("mx_voice", false);
  const [darkBg, setDarkBg] = useLS("mx_dark", true);

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
  const [showSettings, setShowS] = useState(false);
  const [newAch, setNewAch] = useState(null);
  const [showBurnout, setShowBurnout] = useState(false);
  const [breathMode, setBreathMode] = useState("4-4-6-2"); // 4-7-8, box, resonance

  const progRef = useRef(null);
  const medRef = useRef(null);
  const copRef = useRef(null);
  const hrvRef = useRef(null);

  useEffect(() => { injectCSS(); }, []);

  /* Tip rotation */
  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i+1)%DAILY_TIPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* HRV simulation with variance */
  useEffect(() => {
    const collect = () => {
      const base = 55 - stressScore * 0.25;
      const v = Math.max(25, base + (Math.random()-0.5)*18);
      setHrv(p => [...p.slice(-20), {
        time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        value: Math.round(v),
        stress: Math.round(Math.max(0, 100-v*1.4)),
      }]);
    };
    collect();
    hrvRef.current = setInterval(collect, 22000);
    return () => clearInterval(hrvRef.current);
  }, [stressScore]);

  /* Daily forecast */
  useEffect(() => {
    const h = new Date().getHours(), d = new Date().getDay();
    const weekday = d >= 1 && d <= 5;
    const morningBase = weekday ? 52 : 30;
    setForecast({
      morning: Math.round(morningBase + Math.random()*8),
      afternoon: Math.round(morningBase + (h>=10&&h<=18?18:-8) + Math.random()*12),
      evening: Math.round(morningBase - 14 + Math.random()*10),
      tip: weekday && morningBase > 50
        ? "Elevated weekday stress forecast. Schedule 2 breathing sessions."
        : "Lighter stress expected. Great day for deeper meditation.",
      emoji: weekday ? "⚡" : "🌿",
    });
  }, []);

  /* Achievements check */
  useEffect(() => {
    const toCheck = [
      {id:"first_log", cond: moods.length >= 1},
      {id:"streak_7", cond: streak >= 7},
      {id:"streak_30", cond: streak >= 30},
      {id:"breathe_10", cond: sessCount >= 10},
      {id:"journal_10", cond: journal.length >= 10},
      {id:"med_5", cond: medCount >= 5},
    ];
    toCheck.forEach(({id,cond}) => {
      if (cond && !unlockedAch.includes(id)) {
        setUnlocked(p => [...p, id]);
        const def = ACHIEVEMENTS_DEFS.find(a=>a.id===id);
        if (def) { setNewAch(def); setTimeout(()=>setNewAch(null), 4000); }
      }
    });
  }, [moods, streak, sessCount, journal, medCount]);

  /* Derived */
  const moodChartData = useMemo(() =>
    moods.slice(-10).map((m,i) => ({day:`D${i+1}`,value:MOOD_VALS[m.mood]||5,mood:m.mood})), [moods]);

  const triggerCorr = useMemo(() => {
    const counts = {};
    journal.forEach(e => e.trigger?.forEach(t => {
      const tr = TRIGGERS.find(x=>x.id===t);
      if (tr) counts[tr.label] = (counts[tr.label]||0)+1;
    }));
    return Object.entries(counts).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value).slice(0,6);
  }, [journal]);

  const weeklyHrv = useMemo(() =>
    hrvData.slice(-8).map((d,i)=>({...d,label:`T-${7-i}`})), [hrvData]);

  const avgMood = useMemo(() =>
    moods.length ? (moods.reduce((a,m)=>a+(MOOD_VALS[m.mood]||5),0)/moods.length).toFixed(1) : "—", [moods]);

  const hrvLast = hrvData.length ? hrvData[hrvData.length-1].value : 48;
  const stressColor = stressScore<=25?GREEN:stressScore<=50?BLUE:stressScore<=70?G:stressScore<=85?ORANGE:RED;
  const stressLabel = stressScore<=25?"Very Low":stressScore<=50?"Optimal":stressScore<=70?"Moderate":stressScore<=85?"High":"Critical";
  const burnoutRisk = stressScore>75?"High":stressScore>55?"Moderate":"Low";
  const burnoutColor = burnoutRisk==="High"?RED:burnoutRisk==="Moderate"?ORANGE:GREEN;
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  /* Program controls */
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
          setGoals(g=>g.map(x=>x.id===3?{...x,done:true}:x));
          setSessCount(c=>c+1);
          setCortisol(v=>Math.max(5,v-1.5));
          return n;
        }
        setProgS(cs); return n;
      });
    }, 1000);
  }, [setGoals, setSessCount]);

  const stopProgram = useCallback(() => {
    clearInterval(progRef.current); setProgR(false); setAP(null);
  }, []);
  const pauseProgram = useCallback(() => { clearInterval(progRef.current); setProgR(false); }, []);
  const resumeProgram = useCallback(() => {
    if (!activeProgram) return; setProgR(true);
    const stepDur = (activeProgram.duration*60)/activeProgram.steps.length;
    progRef.current = setInterval(() => {
      setProgT(prev => {
        const n=prev+1, cs=Math.floor(n/stepDur);
        if(cs>=activeProgram.steps.length){clearInterval(progRef.current);setProgR(false);return n;}
        setProgS(cs); return n;
      });
    }, 1000);
  }, [activeProgram]);

  /* Mood log */
  const logMood = useCallback(mood => {
    setSelMood(mood);
    setMoods(p => [...p, {id:Date.now(), mood, timestamp:new Date().toISOString()}]);
    if (["Peaceful","Calm","Energized","Grateful"].includes(mood)) setStreak(s=>s+1);
    setGoals(g=>g.map(x=>x.id===2?{...x,done:true}:x));
  }, [setMoods, setGoals, setStreak]);

  /* Journal save */
  const saveJournal = useCallback(() => {
    if (!jForm.mood || !jForm.trigger.length) return;
    setJournal(p=>[...p,{id:Date.now(),date:new Date().toISOString(),...jForm}]);
    setJModal(false); setJForm({trigger:[],mood:"",intensity:5,notes:""});
    setGoals(g=>g.map(x=>x.id===4?{...x,done:true}:x));
    setCortisol(v=>Math.max(5,v-1));
  }, [jForm, setJournal, setGoals]);

  /* Meditation */
  const startMed = useCallback(sess => {
    setMedA(sess); setMedT(0); setMedR(true);
    clearInterval(medRef.current);
    medRef.current = setInterval(() => {
      setMedT(prev => {
        const n=prev+1;
        if(n>=sess.duration*60){
          clearInterval(medRef.current); setMedR(false); setMedA(null);
          setGoals(g=>g.map(x=>x.id===1?{...x,done:true}:x));
          setMedCount(c=>c+1); setCortisol(v=>Math.max(5,v-2));
          return n;
        }
        return n;
      });
    }, 1000);
  }, [setGoals, setMedCount]);
  const stopMed = useCallback(() => { clearInterval(medRef.current); setMedR(false); setMedA(null); setMedT(0); }, []);

  /* Quiz calc */
  const calcStress = useCallback(() => {
    let total = 0;
    QUIZ.forEach(q => {
      const idx = q.opts.indexOf(quizA[q.id]);
      total += idx >= 0 ? q.w[idx] : 2;
    });
    const sc = Math.round((total/(QUIZ.length*4))*100);
    setScore(sc); localStorage.setItem("mx_score", sc); setQuizDone(true);
    setTimeout(()=>setShowQuiz(false), 2000);
  }, [quizA]);

  /* Export */
  const exportData = useCallback(() => {
    const d = {moods,journal,activeTriggers,goals,streak,hrvData,sessCount,medCount,exportedAt:new Date().toISOString()};
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:"application/json"}));
    a.download = `manifix-stress-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }, [moods,journal,activeTriggers,goals,streak,hrvData,sessCount,medCount]);

  const TABS = [
    {id:"home",label:"Home",emoji:"◈"},
    {id:"programs",label:"Programs",emoji:"▶"},
    {id:"tracker",label:"Tracker",emoji:"◎"},
    {id:"journal",label:"Journal",emoji:"◧"},
    {id:"tools",label:"Tools",emoji:"⚡"},
    {id:"insights",label:"Insights",emoji:"◈"},
  ];

  const completedGoals = goals.filter(g=>g.done).length;
  const goalPct = Math.round((completedGoals/goals.length)*100);

  /* ── RENDER ── */
  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#ddd8cc",fontFamily:FONT,position:"relative",overflowX:"hidden"}}>

      {/* Ambient */}
      <div style={{position:"fixed",top:"8%",left:"50%",transform:"translateX(-50%)",width:600,height:300,
        background:`radial-gradient(ellipse,${G}08 0%,transparent 68%)`,
        animation:"mx-pulse 6s ease-in-out infinite",pointerEvents:"none",zIndex:0}} />
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:300,height:200,
        background:`radial-gradient(ellipse,${PURPLE}06 0%,transparent 70%)`,
        animation:"mx-pulse 9s ease-in-out infinite 2s",pointerEvents:"none",zIndex:0}} />

      {/* Achievement toast */}
      <AnimatePresence>
        {newAch && (
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
      <AnimatePresence>{showSOS && <SosOverlay onClose={()=>setShowSOS(false)}/>}</AnimatePresence>
      <AnimatePresence>
        {activeProgram && <ProgramOverlay prog={activeProgram} time={progTime} step={progStep}
          running={progRunning} onPause={pauseProgram} onResume={resumeProgram} onStop={stopProgram}/>}
      </AnimatePresence>
      <AnimatePresence>
        {medActive && <MedOverlay med={medActive} time={medTime} running={medRunning}
          onToggle={()=>{
            setMedR(!medRunning);
            if (!medRunning) {
              medRef.current = setInterval(()=>setMedT(p=>p+1),1000);
            } else clearInterval(medRef.current);
          }}
          onStop={stopMed}/>}
      </AnimatePresence>

      {/* QUIZ MODAL */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowQuiz(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:130,
              display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
              onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:28,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div style={{fontFamily:HEAD,fontSize:24,color:G,letterSpacing:".04em"}}>STRESS ASSESSMENT</div>
                <button className="mx-btn" onClick={()=>setShowQuiz(false)}
                  style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              {quizDone ? (
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200}}>
                    <div style={{fontSize:50,marginBottom:12}}>✅</div>
                  </motion.div>
                  <div style={{fontFamily:HEAD,fontSize:30,color:"#ddd",marginBottom:8}}>ASSESSMENT COMPLETE</div>
                  <div style={{fontSize:12,color:"#3a3a3a"}}>
                    Your stress index: <span style={{color:stressColor,fontWeight:700}}>{stressScore}%</span>
                    {" — "}<span style={{color:stressColor}}>{stressLabel}</span>
                  </div>
                </div>
              ) : (
                <>
                  {QUIZ.map((q,qi) => (
                    <div key={q.id} style={{marginBottom:20}}>
                      <div style={{fontSize:11,color:"#3a3a3a",marginBottom:10,letterSpacing:".04em"}}>{qi+1}. {q.q}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {q.opts.map(o => (
                          <button key={o} className="mx-btn" onClick={()=>setQuizA(p=>({...p,[q.id]:o}))}
                            style={{padding:"9px 12px",background:quizA[q.id]===o?`${G}1a`:"#0e0e0e",
                              border:`1px solid ${quizA[q.id]===o?G:BOR}`,
                              color:quizA[q.id]===o?G:"#2a2a2a",fontFamily:FONT,fontSize:10,textAlign:"left"}}>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:2,background:"#111",borderRadius:2}}>
                      <div style={{height:"100%",background:G,width:`${(Object.keys(quizA).length/QUIZ.length)*100}%`,
                        borderRadius:2,transition:"width .3s"}} />
                    </div>
                    <span style={{fontSize:8,color:"#252525"}}>{Object.keys(quizA).length}/{QUIZ.length}</span>
                  </div>
                  <GoldBtn onClick={calcStress}
                    style={{width:"100%",opacity:Object.keys(quizA).length>=QUIZ.length?1:.35,
                      pointerEvents:Object.keys(quizA).length>=QUIZ.length?"auto":"none"}}>
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
        {showJModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setJModal(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:130,
              display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
              onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:26,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:HEAD,fontSize:22,color:G}}>NEW JOURNAL ENTRY</div>
                <button className="mx-btn" onClick={()=>setJModal(false)}
                  style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              <Label>Current mood</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {Object.entries(MOOD_MAP).map(([m,e]) => (
                  <Pill key={m} active={jForm.mood===m} onClick={()=>setJForm(p=>({...p,mood:m}))}>
                    {e} {m}
                  </Pill>
                ))}
              </div>
              <Label>Stress triggers (select all that apply)</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
                {TRIGGERS.map(t => (
                  <button key={t.id} className="mx-btn"
                    onClick={()=>setJForm(p=>({...p,trigger:p.trigger.includes(t.id)?p.trigger.filter(x=>x!==t.id):[...p.trigger,t.id]}))}
                    style={{padding:"9px 10px",background:jForm.trigger.includes(t.id)?`${G}18`:"#0e0e0e",
                      border:`1px solid ${jForm.trigger.includes(t.id)?G:BOR}`,
                      color:jForm.trigger.includes(t.id)?G:"#2a2a2a",fontFamily:FONT,fontSize:9,
                      textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
              <Label>Intensity: {jForm.intensity}/10</Label>
              <input type="range" min="1" max="10" value={jForm.intensity}
                onChange={e=>setJForm(p=>({...p,intensity:Number(e.target.value)}))}
                className="mx-range" style={{width:"100%",marginBottom:14}} />
              <textarea className="mx-input" rows={3} placeholder="What's on your mind right now..."
                value={jForm.notes} onChange={e=>setJForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:14}} />
              <GoldBtn onClick={saveJournal}
                style={{width:"100%",opacity:jForm.mood&&jForm.trigger.length?1:.3,
                  pointerEvents:jForm.mood&&jForm.trigger.length?"auto":"none"}}>
                Save Entry
              </GoldBtn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowS(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:130,
              display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{scale:.92,x:40}} animate={{scale:1,x:0}} exit={{scale:.92}}
              onClick={e=>e.stopPropagation()}
              style={{background:CARD,border:`1px solid ${BOR}`,padding:26,maxWidth:360,width:"100%"}}>
              <div style={{fontFamily:HEAD,fontSize:22,color:G,marginBottom:20,letterSpacing:".04em"}}>SETTINGS</div>
              {[
                {label:"Sound Effects",val:soundOn,set:setSound},
                {label:"Voice Coaching",val:voiceOn,set:setVoice},
                {label:"Dark Background",val:darkBg,set:setDarkBg},
              ].map(({label,val,set}) => (
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  border:`1px solid ${BOR}`,padding:"12px 14px",marginBottom:8}}>
                  <div style={{fontSize:10,color:"#3a3a3a",letterSpacing:".06em"}}>{label}</div>
                  <button className="mx-btn" onClick={()=>set(!val)}
                    style={{width:44,height:24,borderRadius:12,background:val?G:"#1a1a1a",border:"none",position:"relative"}}>
                    <motion.div animate={{left:val?23:3}} transition={{type:"spring",stiffness:400}}
                      style={{width:18,height:18,borderRadius:"50%",background:val?BG:"#444",position:"absolute",top:3}} />
                  </button>
                </div>
              ))}
              <div style={{height:1,background:BOR,margin:"14px 0"}} />
              <GhostBtn onClick={exportData} style={{width:"100%",marginBottom:8}}>↓ Export My Data</GhostBtn>
              <button className="mx-btn" onClick={()=>{
                setMoods([]);setJournal([]);setGoals(GOALS_INIT);setStreak(0);setHrv([]);setSessCount(0);setMedCount(0);setShowS(false);
              }} style={{width:"100%",padding:"10px 0",background:"transparent",border:"1px solid #2a1010",
                color:RED,fontFamily:FONT,fontSize:9,letterSpacing:".15em",textTransform:"uppercase"}}>
                ↺ Reset All Data
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"13px 22px",display:"flex",
        justifyContent:"space-between",alignItems:"center",
        position:"sticky",top:0,background:`${BG}f0`,backdropFilter:"blur(12px)",zIndex:20}}>
        <div>
          <div style={{fontFamily:HEAD,fontSize:30,letterSpacing:".03em",lineHeight:1,color:"#e8e4d9"}}>STRESS & BURNOUT</div>
          <div style={{fontSize:7,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginTop:3}}>
            MANIFIX · WHO ICD-11 Burnout Protocol · HRV-Powered
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{textAlign:"right",marginRight:4}}>
            <div style={{fontSize:7,letterSpacing:".18em",color:"#1a1a1a",textTransform:"uppercase"}}>Stress Index</div>
            <div style={{fontFamily:HEAD,fontSize:24,color:stressColor,lineHeight:1}}>{stressScore}%</div>
            <div style={{fontSize:7,color:stressColor,letterSpacing:".12em"}}>{stressLabel}</div>
          </div>
          <button className="mx-btn" onClick={()=>setShowSOS(true)}
            style={{padding:"8px 12px",background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",
              color:RED,fontFamily:FONT,fontSize:8,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
            🆘 SOS
          </button>
          <button className="mx-btn" onClick={()=>setShowS(true)}
            style={{padding:"8px 10px",background:"transparent",border:`1px solid ${BOR}`,color:"#2a2a2a",fontFamily:FONT,fontSize:11}}>
            ⚙
          </button>
        </div>
      </div>

      {/* ═══ TAB NAV ═══ */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"0 22px",display:"flex",gap:2,
        overflowX:"auto",background:`${BG}f8`,position:"sticky",top:57,zIndex:19}}>
        {TABS.map(t => (
          <button key={t.id} className="mx-btn" onClick={()=>setTab(t.id)}
            style={{padding:"11px 14px",background:"transparent",border:"none",
              borderBottom:`2px solid ${tab===t.id?G:"transparent"}`,
              color:tab===t.id?G:"#222",fontFamily:FONT,fontSize:8,
              letterSpacing:".16em",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all .2s"}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 18px 70px",position:"relative",zIndex:1}}>
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            transition={{duration:.28,ease:"easeOut"}}>

            {/* ─────────── HOME ─────────── */}
            {tab==="home" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* Ticker */}
                <div style={{overflow:"hidden",borderBottom:`1px solid ${BOR}`,paddingBottom:10,marginBottom:2}}>
                  <div style={{display:"flex",gap:40,animation:"mx-ticker 20s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
                    {[...Array(3)].flatMap(()=>[
                      `HRV ${hrvLast}ms`,`STRESS ${stressScore}%`,`STREAK ${streak}d`,
                      `CORTISOL ~${cortisol}mcg/dL`,`BURNOUT RISK ${burnoutRisk}`,
                      `SESSIONS ${sessCount}`,`MOOD AVG ${avgMood}`,`MEDITATION ${medCount}×`,
                    ]).map((t,i)=>(
                      <span key={i} style={{fontSize:7,letterSpacing:".2em",color:"#1e1e1e",textTransform:"uppercase"}}>
                        {t} <span style={{color:`${G}44`,marginLeft:6}}>◈</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Forecast */}
                {forecast && (
                  <Card style={{borderLeft:`3px solid ${G}`,position:"relative",overflow:"hidden"}}>
                    <div className="mx-scan-line" />
                    <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                      <div style={{fontSize:32,lineHeight:1}}>{forecast.emoji}</div>
                      <div style={{flex:1}}>
                        <Label style={{marginBottom:5}}>Today's Stress Forecast</Label>
                        <div style={{fontSize:11,color:"#2a2a2a",lineHeight:1.8,marginBottom:12}}>{forecast.tip}</div>
                        <div style={{display:"flex",gap:20}}>
                          {[["Morning",forecast.morning,GREEN],["Afternoon",forecast.afternoon,G],["Evening",forecast.evening,BLUE]].map(([l,v,c])=>(
                            <div key={l}>
                              <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                              <div style={{fontFamily:HEAD,fontSize:26,color:c,lineHeight:1}}>{v}%</div>
                              <Bar pct={v} color={c} height={2} />
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
                    {label:"Calm Streak",value:`${streak}d`,sub:"consecutive",color:G,icon:"🔥"},
                    {label:"HRV Live",value:null,sub:"ms · variability",color:PURPLE,hrv:true},
                    {label:"Burnout Risk",value:burnoutRisk,sub:`${burnoutRisk==="Low"?"Safe Zone":burnoutRisk==="Moderate"?"Watch out":"Take action"}`,color:burnoutColor},
                  ].map(({label,value,sub,color,bar,icon,hrv}) => (
                    <Card key={label}>
                      <Label>{label}</Label>
                      {hrv ? <HrvBadge value={hrvLast}/> :
                        <div style={{fontFamily:HEAD,fontSize:32,color,lineHeight:1}}>{value}</div>}
                      <div style={{fontSize:8,color:"#1e1e1e",marginTop:3}}>{icon && <span style={{marginRight:6}}>{icon}</span>}{sub}</div>
                      {bar && <Bar pct={stressScore} color={color} />}
                    </Card>
                  ))}
                </div>

                {/* Goals + Quick Actions */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <Label style={{marginBottom:0}}>Daily Goals — {completedGoals}/{goals.length}</Label>
                      <div style={{fontSize:8,color:G,letterSpacing:".1em"}}>{goalPct}%</div>
                    </div>
                    <Bar pct={goalPct} color={G} height={3} />
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                      {goals.map(g => (
                        <motion.div key={g.id} whileTap={{scale:.97}}
                          className="mx-btn" onClick={()=>setGoals(p=>p.map(x=>x.id===g.id?{...x,done:!x.done}:x))}
                          style={{display:"flex",alignItems:"center",gap:10,
                            border:`1px solid ${g.done?"#1e3d1e":BOR}`,
                            background:g.done?"#0a130a":"#0e0e0e",padding:"9px 12px"}}>
                          <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,
                            border:`2px solid ${g.done?GREEN:BOR}`,background:g.done?GREEN:"transparent",
                            display:"flex",alignItems:"center",justifyContent:"center",color:BG,fontSize:9}}>
                            {g.done && "✓"}
                          </div>
                          <span style={{fontSize:9,color:g.done?"#2a2a2a":"#2a2a2a",
                            textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
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
                          {label:"Log Mood",icon:"😊",action:()=>setTab("tracker"),color:TEAL},
                          {label:"Breathe",icon:"🫁",action:()=>setTab("tools"),color:BLUE},
                          {label:"Journal",icon:"📓",action:()=>setJModal(true),color:PURPLE},
                          {label:"Assess",icon:"📊",action:()=>setShowQuiz(true),color:G},
                        ].map(({label,icon,action,color}) => (
                          <button key={label} className="mx-btn" onClick={action}
                            style={{padding:"12px 8px",background:"#0e0e0e",border:`1px solid ${BOR}`,
                              display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                              transition:"all .15s"}}>
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

                {/* Achievements */}
                <Card>
                  <Label>Achievements — {unlockedAch.length}/{ACHIEVEMENTS_DEFS.length} unlocked</Label>
                  <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                    {ACHIEVEMENTS_DEFS.map(a => {
                      const unlocked = unlockedAch.includes(a.id);
                      return (
                        <div key={a.id} style={{flexShrink:0,width:100,
                          background:unlocked?"#0a120a":"#0e0e0e",
                          border:`1px solid ${unlocked?`${GREEN}33`:BOR}`,padding:"12px 8px",textAlign:"center"}}>
                          <div style={{fontSize:24,marginBottom:5,filter:unlocked?"none":"grayscale(1) opacity(.15)"}}>{a.icon}</div>
                          <div style={{fontSize:9,color:unlocked?GREEN:"#1e1e1e",letterSpacing:".08em"}}>{a.title}</div>
                          <div style={{fontSize:7,color:"#1a1a1a",marginTop:3}}>{a.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────── PROGRAMS ─────────── */}
            {tab==="programs" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9",letterSpacing:".02em"}}>RECOVERY PROGRAMS</div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {PROGRAMS.map(prog => (
                    <Card key={prog.id} style={{position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,width:"100%",height:2,background:`linear-gradient(90deg,transparent,${prog.color||G},transparent)`}} />
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                        <span style={{fontSize:32}}>{prog.emoji}</span>
                        <span style={{fontSize:7,padding:"3px 9px",background:`${prog.color||G}14`,
                          border:`1px solid ${prog.color||G}33`,color:prog.color||G,
                          letterSpacing:".14em",textTransform:"uppercase"}}>{prog.level}</span>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e4d9",marginBottom:2,letterSpacing:".02em"}}>{prog.title}</div>
                      <div style={{fontSize:9,color:`${prog.color||G}88`,marginBottom:8,letterSpacing:".08em"}}>{prog.duration} min</div>
                      <div style={{fontSize:10,color:"#1e1e1e",lineHeight:1.7,marginBottom:14}}>{prog.desc}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
                        {prog.steps.map((step,i) => (
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
                            borderBottom:`1px solid ${BOR}`,color:"#1e1e1e",fontSize:9}}>
                            <div style={{width:16,height:16,borderRadius:"50%",background:`${prog.color||G}18`,
                              border:`1px solid ${prog.color||G}33`,display:"flex",alignItems:"center",
                              justifyContent:"center",fontSize:7,color:prog.color||G,flexShrink:0}}>{i+1}</div>
                            {step}
                          </div>
                        ))}
                      </div>
                      <GoldBtn onClick={()=>startProgram(prog)} style={{width:"100%",background:prog.color||G}}>
                        ▶ Start Program
                      </GoldBtn>
                    </Card>
                  ))}
                </div>

                <div style={{fontFamily:HEAD,fontSize:24,color:"#e8e4d9",marginTop:6,letterSpacing:".02em"}}>GUIDED MEDITATION</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {MEDITATIONS.map(s => (
                    <Card key={s.id} style={{position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,right:0,width:60,height:60,
                        background:`radial-gradient(circle,${s.color}10 0%,transparent 70%)`}} />
                      <div style={{fontSize:30,marginBottom:10}}>{s.emoji}</div>
                      <div style={{fontSize:12,color:"#ddd",marginBottom:3}}>{s.title}</div>
                      <div style={{fontSize:9,color:`${s.color}77`,marginBottom:5,letterSpacing:".08em"}}>{s.duration} min</div>
                      <div style={{fontSize:9,color:"#1e1e1e",marginBottom:12,lineHeight:1.6}}>{s.focus}</div>
                      <button className="mx-btn" onClick={()=>startMed(s)}
                        style={{width:"100%",padding:"9px 0",background:`${s.color}18`,
                          border:`1px solid ${s.color}33`,color:s.color,fontFamily:FONT,
                          fontSize:9,letterSpacing:".14em",textTransform:"uppercase"}}>
                        ▶ Start
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ─────────── TRACKER ─────────── */}
            {tab==="tracker" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>MOOD & HRV TRACKER</div>

                <Card>
                  <Label>How are you feeling right now?</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                    {Object.entries(MOOD_MAP).map(([mood,emoji]) => (
                      <motion.button key={mood} className="mx-btn" onClick={()=>logMood(mood)}
                        whileTap={{scale:.95}}
                        style={{padding:"12px 6px",
                          background:selMood===mood?`${MOOD_COLS[mood]||G}1a`:"#0e0e0e",
                          border:`1px solid ${selMood===mood?MOOD_COLS[mood]||G:BOR}`,
                          display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <span style={{fontSize:22}}>{emoji}</span>
                        <span style={{fontSize:7,letterSpacing:".1em",
                          color:selMood===mood?MOOD_COLS[mood]||G:"#1e1e1e",textTransform:"uppercase",
                          textAlign:"center",lineHeight:1.4}}>{mood}</span>
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {selMood && (
                      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                        style={{textAlign:"center",marginTop:12,fontSize:11,
                          color:MOOD_COLS[selMood]||G,letterSpacing:".08em"}}>
                        ✓ Logged: {selMood} {MOOD_MAP[selMood]}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                <Card>
                  <Label>HRV — Real-Time Heart Rate Variability</Label>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <HrvBadge value={hrvLast}/>
                    <div style={{fontSize:8,color:"#1e1e1e",textAlign:"right"}}>
                      <div>Normal: 40–80ms</div>
                      <div style={{color:hrvLast>55?GREEN:hrvLast>40?G:RED,marginTop:2}}>
                        {hrvLast>55?"Good Recovery":hrvLast>40?"Moderate":"Low — Rest needed"}
                      </div>
                    </div>
                  </div>
                  {hrvData.length > 2 ? (
                    <div style={{height:180}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyHrv}>
                          <defs>
                            <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={G} stopOpacity={.3}/>
                              <stop offset="100%" stopColor={G} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                          <XAxis dataKey="time" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                          <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[20,80]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <Area type="monotone" dataKey="value" name="HRV" stroke={G} fill="url(#hG)" strokeWidth={2} dot={{fill:G,r:2}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div style={{padding:"30px 0",textAlign:"center",fontSize:8,letterSpacing:".15em",color:"#1a1a1a",textTransform:"uppercase"}}>Collecting HRV data...</div>}
                </Card>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>7-Day Mood Trend</Label>
                    {moodChartData.length > 1 ? (
                      <div style={{height:170}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={moodChartData}>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                            <XAxis dataKey="day" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                            <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[0,10]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Line type="monotone" dataKey="value" name="Score" stroke={G} strokeWidth={2}
                              dot={({cx,cy,payload})=>(
                                <circle key={cx} cx={cx} cy={cy} r={4} fill={MOOD_COLS[payload.mood]||G} stroke="none"/>
                              )}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div style={{padding:"40px 0",textAlign:"center",fontSize:8,letterSpacing:".14em",color:"#1a1a1a",textTransform:"uppercase"}}>Log mood daily to see trend</div>}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                      <div><div style={{fontSize:7,color:"#1e1e1e",textTransform:"uppercase",letterSpacing:".14em"}}>Avg Mood</div><div style={{fontFamily:HEAD,fontSize:24,color:G}}>{avgMood}</div></div>
                      <div><div style={{fontSize:7,color:"#1e1e1e",textTransform:"uppercase",letterSpacing:".14em"}}>Logs Total</div><div style={{fontFamily:HEAD,fontSize:24,color:TEAL}}>{moods.length}</div></div>
                    </div>
                  </Card>

                  <Card>
                    <Label>Trigger Correlation</Label>
                    {triggerCorr.length > 0 ? (
                      <>
                        <div style={{height:150}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={triggerCorr} layout="vertical">
                              <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e" horizontal={false}/>
                              <XAxis type="number" stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}}/>
                              <YAxis type="category" dataKey="name" width={80} stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}}/>
                              <Tooltip content={<MxTooltip/>}/>
                              <Bar dataKey="value" name="Freq" radius={[0,2,2,0]}>
                                {triggerCorr.map((_,i)=>(
                                  <Cell key={i} fill={[G,ORANGE,BLUE,PURPLE,GREEN,TEAL][i%6]}/>
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    ) : <div style={{padding:"40px 0",textAlign:"center",fontSize:8,letterSpacing:".14em",color:"#1a1a1a",textTransform:"uppercase"}}>Add journal entries to correlate</div>}
                  </Card>
                </div>

                {/* Trigger selector */}
                <Card>
                  <Label>Identify Active Stress Triggers</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                    {TRIGGERS.map(t => (
                      <motion.button key={t.id} className="mx-btn" whileTap={{scale:.95}}
                        onClick={()=>setAT(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])}
                        style={{padding:"10px 6px",
                          background:activeTriggers.includes(t.id)?`${G}16`:"#0e0e0e",
                          border:`1px solid ${activeTriggers.includes(t.id)?G:BOR}`,
                          display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <span style={{fontSize:20}}>{t.icon}</span>
                        <span style={{fontSize:7,letterSpacing:".08em",color:activeTriggers.includes(t.id)?G:"#1e1e1e",
                          textTransform:"uppercase",textAlign:"center",lineHeight:1.4}}>{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────── JOURNAL ─────────── */}
            {tab==="journal" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRESS JOURNAL</div>
                    <div style={{fontSize:8,color:"#1e1e1e",letterSpacing:".14em",marginTop:2}}>
                      {journal.length} entries · patterns tracked
                    </div>
                  </div>
                  <GoldBtn onClick={()=>setJModal(true)}>+ New Entry</GoldBtn>
                </div>

                {journal.length === 0 ? (
                  <Card style={{textAlign:"center",padding:"56px 20px"}}>
                    <div style={{fontSize:44,marginBottom:12}}>📓</div>
                    <div style={{fontSize:11,color:"#1e1e1e",letterSpacing:".14em",textTransform:"uppercase"}}>No entries yet</div>
                    <div style={{fontSize:10,color:"#141414",marginTop:6,lineHeight:1.7}}>
                      Journaling reduces cortisol by documenting stress patterns
                    </div>
                    <GoldBtn onClick={()=>setJModal(true)} style={{marginTop:18}}>Write First Entry</GoldBtn>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {[...journal].reverse().map((entry,i) => {
                      const emoji = MOOD_MAP[entry.mood];
                      const moodColor = MOOD_COLS[entry.mood]||G;
                      return (
                        <motion.div key={entry.id}
                          initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}}
                          transition={{delay:i*0.04}}>
                          <Card style={{position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:moodColor}} />
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,paddingLeft:12}}>
                              <div>
                                <div style={{fontSize:7,color:"#1e1e1e",letterSpacing:".12em",marginBottom:5}}>
                                  {new Date(entry.date).toLocaleString()}
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:20}}>{emoji}</span>
                                  <span style={{fontSize:11,color:moodColor}}>{entry.mood}</span>
                                  <span style={{fontSize:8,color:"#1e1e1e",padding:"2px 7px",border:`1px solid ${BOR}`}}>
                                    Intensity {entry.intensity}/10
                                  </span>
                                </div>
                              </div>
                              <button className="mx-btn" onClick={()=>setJournal(p=>p.filter(x=>x.id!==entry.id))}
                                style={{padding:"4px 8px",background:"rgba(239,68,68,.08)",
                                  border:"1px solid rgba(239,68,68,.15)",color:RED,fontFamily:FONT,fontSize:8}}>✕</button>
                            </div>
                            {entry.trigger?.length > 0 && (
                              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8,paddingLeft:12}}>
                                {entry.trigger.map(id=>{
                                  const t=TRIGGERS.find(x=>x.id===id);
                                  return t ? (
                                    <div key={id} style={{padding:"3px 8px",background:`${G}0e`,
                                      border:`1px solid ${G}22`,color:G,fontSize:8,
                                      display:"flex",alignItems:"center",gap:4}}>
                                      <span>{t.icon}</span><span>{t.label}</span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}
                            {entry.notes && (
                              <div style={{fontSize:10,color:"#2a2a2a",lineHeight:1.8,fontStyle:"italic",
                                borderLeft:`2px solid ${BOR}`,paddingLeft:12,marginLeft:12}}>
                                "{entry.notes}"
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* ─────────── TOOLS ─────────── */}
            {tab==="tools" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRESS RELIEF TOOLS</div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {/* Breath coach */}
                  <Card>
                    <Label>Breath Coach</Label>
                    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                      {[
                        {id:"4-4-6-2",label:"Box+",color:G},
                        {id:"4-7-8",label:"4-7-8",color:BLUE},
                        {id:"resonance",label:"Resonance",color:TEAL},
                      ].map(m => (
                        <Pill key={m.id} active={breathMode===m.id} color={m.color}
                          onClick={()=>{setBreathMode(m.id);setBrC(m.color);setBrA(false);}}>
                          {m.label}
                        </Pill>
                      ))}
                    </div>
                    <BreathCircle active={breathActive} onToggle={()=>setBrA(!breathActive)} color={breathColor}/>
                    <div style={{marginTop:8,fontSize:8,color:"#1a1a1a",lineHeight:1.7,textAlign:"center"}}>
                      {breathMode==="4-4-6-2"&&"Extended exhale activates parasympathetic system"}
                      {breathMode==="4-7-8"&&"Deep hold maximises oxygen exchange"}
                      {breathMode==="resonance"&&"~0.1Hz breathing for HRV coherence"}
                    </div>
                  </Card>

                  {/* Coping strategies */}
                  <Card>
                    <Label>Coping Strategies</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
                      {COPING.map(c => (
                        <button key={c.id} className="mx-btn"
                          onClick={()=>{setSelCoping(c);setCopingR(false);setCopingT(0);clearInterval(copRef.current);}}
                          style={{padding:"9px 12px",
                            background:selCoping?.id===c.id?`${G}14`:"#0e0e0e",
                            border:`1px solid ${selCoping?.id===c.id?G:BOR}`,
                            display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
                          <div>
                            <div style={{fontSize:10,color:"#bbb"}}>{c.icon} {c.title}</div>
                            <div style={{fontSize:8,color:"#1e1e1e",marginTop:2}}>{c.desc}</div>
                          </div>
                          <div style={{fontSize:8,color:G,flexShrink:0,marginLeft:8}}>{c.time}</div>
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {selCoping && (
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                          <div style={{border:`1px solid ${BOR}`,padding:12}}>
                            <button className="mx-btn" onClick={()=>{
                              const next = !copingRun;
                              setCopingR(next);
                              if (next) {
                                clearInterval(copRef.current);
                                copRef.current = setInterval(()=>setCopingT(p=>p+1),1000);
                              } else clearInterval(copRef.current);
                            }} style={{width:"100%",padding:"10px 0",
                              background:copingRun?"transparent":G,
                              color:copingRun?RED:BG,
                              border:copingRun?`1px solid ${RED}`:"none",
                              fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase"}}>
                              {copingRun?"⏹ Stop":"▶ Start"}
                            </button>
                            {copingRun && (
                              <div style={{textAlign:"center",fontFamily:HEAD,fontSize:36,color:G,marginTop:10}}>
                                {fmt(copingTime)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>

                {/* Cortisol + Recovery */}
                <Card>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                    <div>
                      <Label>Estimated Cortisol Level</Label>
                      <div style={{fontSize:9,color:"#1a1a1a",marginBottom:10,lineHeight:1.7}}>
                        Estimated from mood logs, journal intensity, and breathing sessions
                      </div>
                      <Bar pct={Math.min(100,cortisol*5)} color={cortisol<10?GREEN:cortisol<18?G:RED} height={6}/>
                      <div style={{fontFamily:HEAD,fontSize:36,color:cortisol<10?GREEN:cortisol<18?G:RED,marginTop:10,lineHeight:1}}>
                        {cortisol} <span style={{fontSize:14,fontFamily:FONT}}>mcg/dL</span>
                      </div>
                      <div style={{fontSize:7,color:"#1a1a1a",marginTop:4,letterSpacing:".1em"}}>Normal: 6–23 mcg/dL (morning)</div>
                      <button className="mx-btn" onClick={()=>setCortisol(v=>Math.max(5,+(v-1).toFixed(1)))}
                        style={{marginTop:12,padding:"8px 14px",background:`${GREEN}14`,
                          border:`1px solid ${GREEN}33`,color:GREEN,fontFamily:FONT,fontSize:8,
                          letterSpacing:".12em",textTransform:"uppercase"}}>
                        + Log breathing session → cortisol ↓
                      </button>
                    </div>
                    <div>
                      <Label>Recovery Matrix</Label>
                      <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:4}}>
                        {[
                          {label:"Parasympathetic Balance",val:`${Math.max(15,100-stressScore)}%`,color:GREEN},
                          {label:"HRV Zone",val:hrvLast>55?"Optimal":hrvLast>40?"Moderate":"Low",color:hrvLast>55?GREEN:hrvLast>40?G:RED},
                          {label:"Sleep Readiness",val:`${Math.max(25,80-stressScore*0.45).toFixed(0)}%`,color:BLUE},
                          {label:"Burnout Risk Index",val:burnoutRisk,color:burnoutColor},
                          {label:"Cortisol Trend",val:cortisol<12?"Declining ↓":cortisol<18?"Stable →":"Elevated ↑",color:cortisol<12?GREEN:cortisol<18?G:RED},
                          {label:"Nervous System",val:hrvData.length>3?"Recovering":"Idle",color:TEAL},
                        ].map(({label,val,color}) => (
                          <div key={label} style={{display:"flex",justifyContent:"space-between",
                            alignItems:"center",borderBottom:`1px solid ${BOR}`,paddingBottom:7}}>
                            <span style={{fontSize:8,color:"#1e1e1e",letterSpacing:".05em"}}>{label}</span>
                            <span style={{fontSize:9,color,fontWeight:700,letterSpacing:".06em"}}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Emergency toolkit */}
                <Card>
                  <Label>Emergency Techniques</Label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {title:"5-4-3-2-1",desc:"5 see · 4 touch · 3 hear · 2 smell · 1 taste",emoji:"🌍",color:TEAL},
                      {title:"Box Breath",desc:"In 4s · Hold 4s · Out 4s · Hold 4s · ×4",emoji:"🫁",color:BLUE},
                      {title:"Muscle Release",desc:"Tense & release each group head→toe",emoji:"💪",color:G},
                      {title:"Name 3 Good",desc:"Name 3 genuine appreciations right now",emoji:"❤️",color:PURPLE},
                    ].map((item,i) => (
                      <div key={i} style={{background:"#0e0e0e",border:`1px solid ${BOR}`,padding:"14px 10px",
                        position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:1,
                          background:`linear-gradient(90deg,transparent,${item.color}55,transparent)`}} />
                        <div style={{fontSize:24,marginBottom:8}}>{item.emoji}</div>
                        <div style={{fontSize:10,color:item.color,marginBottom:5,letterSpacing:".04em"}}>{item.title}</div>
                        <div style={{fontSize:8,color:"#1a1a1a",lineHeight:1.7}}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────── INSIGHTS ─────────── */}
            {tab==="insights" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>BURNOUT INSIGHTS</div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {/* Burnout Radar */}
                  <Card>
                    <Label>Burnout Dimensions Radar</Label>
                    <div style={{fontSize:9,color:"#1a1a1a",marginBottom:4,lineHeight:1.6}}>
                      WHO ICD-11 burnout framework across 6 dimensions. Higher = worse.
                    </div>
                    <BurnoutRadar score={stressScore} hrvLast={hrvLast} moods={moods} journal={journal}/>
                    <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:4}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:G,marginTop:2}}/>
                      <span style={{fontSize:8,color:"#1e1e1e"}}>Current state (lower is better)</span>
                    </div>
                  </Card>

                  {/* Weekly stress trend */}
                  <Card>
                    <Label>Stress Index History</Label>
                    <div style={{fontSize:9,color:"#1a1a1a",marginBottom:8}}>Based on mood, triggers & HRV</div>
                    {moodChartData.length > 2 ? (
                      <div style={{height:180}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={moodChartData.map(d=>({...d,stress:Math.round(10-d.value)*10}))}>
                            <defs>
                              <linearGradient id="sG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={ORANGE} stopOpacity={.3}/>
                                <stop offset="100%" stopColor={ORANGE} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                            <XAxis dataKey="day" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                            <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[0,100]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Area type="monotone" dataKey="stress" name="Stress" stroke={ORANGE} fill="url(#sG)" strokeWidth={2}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div style={{padding:"50px 0",textAlign:"center",fontSize:8,color:"#1a1a1a",letterSpacing:".14em",textTransform:"uppercase"}}>Log more moods to see trend</div>}
                  </Card>
                </div>

                {/* Trigger heatmap-style */}
                <Card>
                  <Label>Trigger Weight Analysis</Label>
                  <div style={{fontSize:9,color:"#1a1a1a",marginBottom:12,lineHeight:1.6}}>
                    Each trigger has a clinical stress weight. Your active triggers contribute to your stress index.
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {TRIGGERS.map(t => {
                      const active = activeTriggers.includes(t.id);
                      const barW = t.weight / 3 * 100;
                      return (
                        <div key={t.id} style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:14,width:20,textAlign:"center"}}>{t.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                              <span style={{fontSize:9,color:active?G:"#1e1e1e"}}>{t.label}</span>
                              <span style={{fontSize:8,color:active?ORANGE:"#1a1a1a"}}>weight {t.weight}×</span>
                            </div>
                            <div style={{height:3,background:"#0e0e0e",borderRadius:2}}>
                              <div style={{height:"100%",width:`${barW}%`,
                                background:active?`linear-gradient(90deg,${ORANGE}66,${ORANGE})`:BOR2,
                                borderRadius:2,transition:"width .6s"}} />
                            </div>
                          </div>
                          {active && <div style={{width:6,height:6,borderRadius:"50%",background:ORANGE,animation:"mx-blink 1.2s infinite"}}/>}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Stats summary */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {label:"Total Sessions",value:sessCount,color:TEAL,icon:"🏃"},
                    {label:"Meditations",value:medCount,color:PURPLE,icon:"🧘"},
                    {label:"Journal Entries",value:journal.length,color:G,icon:"📓"},
                    {label:"Mood Logs",value:moods.length,color:GREEN,icon:"😊"},
                  ].map(({label,value,color,icon}) => (
                    <Card key={label} style={{textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                      <div style={{fontFamily:HEAD,fontSize:36,color,lineHeight:1}}>{value}</div>
                      <Label style={{marginBottom:0,marginTop:4}}>{label}</Label>
                    </Card>
                  ))}
                </div>

                {/* Stress assessment CTA */}
                <Card style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e4d9"}}>FULL STRESS ASSESSMENT</div>
                    <div style={{fontSize:9,color:"#1e1e1e",marginTop:3,lineHeight:1.7}}>
                      6-question WHO-aligned assessment to recalibrate your stress index
                    </div>
                  </div>
                  <GoldBtn onClick={()=>{ setShowQuiz(true); setQuizDone(false); setQuizA({}); }}>
                    Take Assessment
                  </GoldBtn>
                </Card>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
