/**
 * ManifiX AI — Stress & Burnout Health Module v2.0
 * NEW: Focus Mode (beats Headspace), Strain Score (beats Whoop),
 *      Stress-Eating Journal (beats Noom)
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
    @keyframes mx-pulse{0%,100%{opacity:.06;transform:scale(1)}50%{opacity:.16;transform:scale(1.1)}}
    @keyframes mx-blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes mx-spin{to{transform:rotate(360deg)}}
    @keyframes mx-scan{from{top:-2px}to{top:102%}}
    @keyframes mx-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes mx-glow{0%,100%{box-shadow:0 0 6px #ffc83c22}50%{box-shadow:0 0 18px #ffc83c55}}
    @keyframes mx-hb{0%,100%{transform:scale(1)}15%{transform:scale(1.28)}30%{transform:scale(1)}}
    @keyframes mx-focus-ring{0%{transform:scale(1);opacity:.6}50%{transform:scale(1.04);opacity:.3}100%{transform:scale(1);opacity:.6}}
    @keyframes mx-strain-fill{from{stroke-dashoffset:502}to{}}
    @keyframes mx-eat-pulse{0%,100%{opacity:.4}50%{opacity:1}}
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
    .mx-shimmer{background:linear-gradient(90deg,transparent,#ffc83c18,transparent);background-size:200%}
    .mx-scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ffc83c44,transparent);animation:mx-scan 3s linear infinite;pointer-events:none}
    .mx-hb{animation:mx-hb 1.4s ease-in-out infinite}
    .focus-ring{animation:mx-focus-ring 4s ease-in-out infinite}
    .eat-dot{animation:mx-eat-pulse 2s ease-in-out infinite}
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
];

/* ─── NEW: FOCUS MODE DATA ─── */
const FOCUS_PRESETS = [
  {id:"deep",label:"Deep Work",work:50,rest:10,icon:"🧠",color:BLUE,desc:"50/10 ultra-focus. For creative and complex tasks. No interruptions.",tip:"Turn off all notifications. Close all browser tabs."},
  {id:"pomodoro",label:"Pomodoro",work:25,rest:5,icon:"🍅",color:ORANGE,desc:"Classic 25/5 Pomodoro. Proven to sustain focus for 4+ hours.",tip:"Start with your hardest task. No multitasking."},
  {id:"sprint",label:"Sprint",work:15,rest:3,icon:"⚡",color:G,desc:"Short sprints for high-stress days. Lower barrier to starting.",tip:"Break daunting tasks into 15-min micro-chunks."},
  {id:"mindful",label:"Mindful Work",work:30,rest:8,icon:"🧘",color:TEAL,desc:"30/8 with a guided mindfulness break. Beat Headspace's method.",tip:"During break: 3 breaths, then body scan."},
];

const MINDFUL_BREAKS = [
  {title:"Box Breath",desc:"4s in · 4s hold · 4s out · 4s rest × 4",emoji:"🫁",dur:64},
  {title:"Neck & Shoulder",desc:"Slow neck rolls left → right × 3. Shoulder shrugs × 5.",emoji:"💆",dur:45},
  {title:"Eye Rest",desc:"Look at something 20+ feet away for 20 seconds.",emoji:"👁️",dur:20},
  {title:"Micro Walk",desc:"Stand up. Walk to farthest point in space and back.",emoji:"🚶",dur:60},
  {title:"Gratitude Flash",desc:"Name one genuine appreciation right now. Feel it fully.",emoji:"🙏",dur:30},
];

/* ─── NEW: STRAIN DATA ─── */
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

/* ─── NEW: STRESS-EATING DATA ─── */
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
    <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"8px 12px",fontFamily:FONT,fontSize:9,letterSpacing:".08em",color:"#4a4a4a"}}>
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
      {active && <div style={{fontSize:8,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:10}}>Cycles: {cycles}</div>}
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
          <div style={{fontSize:8,letterSpacing:".22em",color:"#2a2a2a",textTransform:"uppercase",margin:"8px 0 36px"}}>3-min emergency protocol · Follow the circle</div>
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
          <GhostBtn onClick={onClose} color="#2a2a2a">Exit SOS Mode</GhostBtn>
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
        <PolarGrid stroke="#1a1a1a"/>
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
        <div style={{fontSize:8,letterSpacing:".2em",color:"#252525",textTransform:"uppercase",marginBottom:24}}>
          Step {step+1} / {prog.steps.length}
        </div>
        <div style={{position:"relative",width:180,height:180,margin:"0 auto 24px"}}>
          <svg viewBox="0 0 180 180" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="#111" strokeWidth="6"/>
            <circle cx="90" cy="90" r="80" fill="none" stroke={prog.color||G} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .5s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:HEAD,fontSize:44,color:prog.color||G,lineHeight:1}}>{Math.floor(time/60)}:{String(time%60).padStart(2,"0")}</div>
          </div>
        </div>
        <motion.div key={step} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 20px",marginBottom:14,fontSize:13,color:"#3a3a3a",lineHeight:1.8}}>
          {prog.steps[step]}
        </motion.div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:18}}>
          {prog.steps.map((_,i)=>(
            <div key={i} style={{height:3,width:28,borderRadius:2,background:i<step?G:i===step?`${G}88`:"#1a1a1a",transition:"background .3s"}}/>
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
        <div style={{fontSize:9,letterSpacing:".18em",color:"#2a2a2a",textTransform:"uppercase",marginBottom:32}}>{med.focus}</div>
        <div style={{position:"relative",width:200,height:200,margin:"0 auto 28px"}}>
          <svg viewBox="0 0 200 200" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="#111" strokeWidth="5"/>
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

/* ═══════════════════════════════════════════
   NEW: FOCUS MODE OVERLAY (beats Headspace)
═══════════════════════════════════════════ */
function FocusOverlay({preset, phase, timeLeft, round, sessionsDone, onPause, onResume, running, onStop, breakTask}) {
  const isWork = phase === "work";
  const total = isWork ? preset.work*60 : preset.rest*60;
  const elapsed = total - timeLeft;
  const pct = (elapsed/total)*100;
  const col = isWork ? preset.color : TEAL;
  const minsLeft = Math.floor(timeLeft/60);
  const secsLeft = timeLeft%60;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:isWork?"#040408":"#040808",zIndex:160,
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div className="mx-scan-line"/>
      {/* Ambient glow */}
      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",
        width:500,height:300,background:`radial-gradient(ellipse,${col}08 0%,transparent 68%)`,
        pointerEvents:"none"}}/>
      <motion.div initial={{scale:.94,y:20}} animate={{scale:1,y:0}} transition={{type:"spring"}}
        style={{textAlign:"center",maxWidth:440,width:"100%",padding:24}}>

        <div style={{fontSize:9,letterSpacing:".3em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:8}}>
          {isWork ? `ROUND ${round} · FOCUS SESSION` : "MINDFUL BREAK"}
        </div>
        <div style={{fontFamily:HEAD,fontSize:44,color:col,lineHeight:1,marginBottom:4}}>
          {isWork ? preset.label.toUpperCase() : "BREAK TIME"}
        </div>

        {/* Ring */}
        <div style={{position:"relative",width:220,height:220,margin:"24px auto"}}>
          <svg viewBox="0 0 220 220" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
            <circle cx="110" cy="110" r="100" fill="none" stroke="#0e0e0e" strokeWidth="6"/>
            <circle cx="110" cy="110" r="100" fill="none" stroke={col} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*100}`}
              strokeDashoffset={`${2*Math.PI*100*(1-pct/100)}`}
              strokeLinecap="round" style={{transition:"stroke-dashoffset .9s linear"}}/>
            {/* Outer focus ring */}
            <circle cx="110" cy="110" r="108" fill="none" stroke={`${col}18`} strokeWidth="1"
              className="focus-ring"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontFamily:HEAD,fontSize:58,color:col,lineHeight:1}}>
              {String(minsLeft).padStart(2,"0")}:{String(secsLeft).padStart(2,"0")}
            </div>
            <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e1e",textTransform:"uppercase"}}>
              {isWork ? `${preset.work}min session` : `${preset.rest}min break`}
            </div>
          </div>
        </div>

        {/* Break task */}
        {!isWork && breakTask && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            style={{background:CARD,border:`1px solid ${TEAL}22`,padding:"14px 20px",
              marginBottom:18,fontSize:12,color:"#3a3a3a",lineHeight:1.8,letterSpacing:".04em"}}>
            <div style={{fontSize:8,color:TEAL,letterSpacing:".2em",textTransform:"uppercase",marginBottom:5}}>
              {breakTask.emoji} Break Activity
            </div>
            <strong style={{color:"#ccc"}}>{breakTask.title}:</strong> {breakTask.desc}
          </motion.div>
        )}

        {/* Session dots */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
          {[...Array(round)].map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",
              background:i<sessionsDone?col:`${col}25`,
              transition:"background .3s"}}/>
          ))}
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:22}}>
          {[
            {label:"Sessions",value:sessionsDone},
            {label:"Focus mins",value:sessionsDone*preset.work},
            {label:"Preset",value:preset.icon},
          ].map(({label,value})=>(
            <div key={label} style={{background:"#0e0e0e",border:`1px solid ${BOR}`,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontFamily:HEAD,fontSize:22,color:col,lineHeight:1}}>{value}</div>
              <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e1e",textTransform:"uppercase",marginTop:2}}>{label}</div>
            </div>
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

/* ═══════════════════════════════════════════
   STRAIN SCORE RING  (beats Whoop)
═══════════════════════════════════════════ */
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
        {/* Recovery ring (outer) */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111" strokeWidth="5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={recovCol} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ*(1-recovPct/100)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1.4s ease"}}/>
        {/* Strain ring (inner) */}
        <circle cx={size/2} cy={size/2} r={r-12} fill="none" stroke="#111" strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r-12} fill="none" stroke={strainCol} strokeWidth="4"
          strokeDasharray={circ-75} strokeDashoffset={(circ-75)*(1-strainPct/100)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1.4s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",gap:2}}>
        <div style={{fontFamily:HEAD,fontSize:38,color:strainCol,lineHeight:1}}>{strain.toFixed(1)}</div>
        <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e1e",textTransform:"uppercase"}}>Strain</div>
        <div style={{fontSize:9,color:recovCol,letterSpacing:".08em",marginTop:2}}>{recovery}% Rec</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
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

  /* NEW persistent state */
  const [focusSessions, setFocusSessions] = useLS("mx_focus_sessions", []);
  const [strainLog, setStrainLog] = useLS("mx_strain_log", []);
  const [eatLog, setEatLog] = useLS("mx_eat_log", []);

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

  /* FOCUS MODE state */
  const [focusPreset, setFocusPreset] = useState(FOCUS_PRESETS[1]);
  const [focusPhase, setFocusPhase] = useState("idle"); // idle|work|break
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [focusRound, setFocusRound] = useState(1);
  const [focusSessionsDone, setFocusSessionsDone] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusBreakTask, setFocusBreakTask] = useState(null);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  const [focusTotalToday, setFocusTotalToday] = useState(0);

  /* STRAIN state */
  const [strainActivities, setStrainActivities] = useState([]);
  const [strainForm, setStrainForm] = useState({actId:null, duration:30, effort:5, stressLevel:5});
  const [todayStrain, setTodayStrain] = useState(0);
  const [todayRecovery, setTodayRecovery] = useState(68);
  const [showStrainForm, setShowStrainForm] = useState(false);

  /* STRESS-EATING state */
  const [showEatModal, setShowEatModal] = useState(false);
  const [eatForm, setEatForm] = useState({mood:"",food:"",hunger:3,notes:"",time:new Date().toISOString()});
  const [eatPatterns, setEatPatterns] = useState({});

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
      setHrv(p=>[...p.slice(-20),{
        time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        value:Math.round(v), stress:Math.round(Math.max(0,100-v*1.4)),
      }]);
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

  /* Achievement checks */
  useEffect(() => {
    const toCheck = [
      {id:"first_log",cond:moods.length>=1},{id:"streak_7",cond:streak>=7},{id:"streak_30",cond:streak>=30},
      {id:"breathe_10",cond:sessCount>=10},{id:"journal_10",cond:journal.length>=10},{id:"med_5",cond:medCount>=5},
    ];
    toCheck.forEach(({id,cond})=>{
      if(cond&&!unlockedAch.includes(id)){
        setUnlocked(p=>[...p,id]);
        const def=ACHIEVEMENTS_DEFS.find(a=>a.id===id);
        if(def){setNewAch(def);setTimeout(()=>setNewAch(null),4000);}
      }
    });
  }, [moods,streak,sessCount,journal,medCount]);

  /* Eat pattern analysis */
  useEffect(() => {
    const patterns = {};
    eatLog.forEach(e=>{
      if(!patterns[e.mood]) patterns[e.mood]={count:0,foods:{},totalHunger:0};
      patterns[e.mood].count++;
      patterns[e.mood].totalHunger+=e.hunger||3;
      if(e.food){patterns[e.mood].foods[e.food]=(patterns[e.mood].foods[e.food]||0)+1;}
    });
    setEatPatterns(patterns);
  }, [eatLog]);

  /* Today's strain calc */
  useEffect(() => {
    const today = new Date().toDateString();
    const todayLogs = strainLog.filter(l=>new Date(l.date).toDateString()===today);
    const strain = todayLogs.reduce((sum,l)=>{
      const act = ACTIVITIES.find(a=>a.id===l.actId);
      if(!act) return sum;
      const load = (act.mets * l.duration / 60) * (l.effort/5) * (1 + act.stressMultiplier*0.3);
      return sum+load;
    }, 0);
    setTodayStrain(Math.min(21, strain));
    const recovery = Math.max(0, Math.min(100, 100 - strain*3.8 - (stressScore*0.2) + (60-stressScore)*0.1));
    setTodayRecovery(Math.round(recovery));
  }, [strainLog, stressScore]);

  /* Focus timer engine */
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
    setFocusPreset(preset);
    setFocusPhase("work");
    setFocusTimeLeft(preset.work*60);
    setFocusRound(1);
    setFocusSessionsDone(0);
    setFocusRunning(true);
    setShowFocusOverlay(true);
  },[]);
  const stopFocus = useCallback(()=>{
    clearInterval(focusRef.current);
    setFocusRunning(false);
    setFocusPhase("idle");
    setShowFocusOverlay(false);
    if(focusSessionsDone>0){
      setFocusSessions(p=>[...p,{id:Date.now(),preset:focusPreset.id,sessions:focusSessionsDone,mins:focusTotalToday,date:new Date().toISOString()}]);
    }
  },[focusPreset,focusSessionsDone,focusTotalToday,setFocusSessions]);

  /* Strain log add */
  const logStrainActivity = useCallback(()=>{
    if(!strainForm.actId) return;
    setStrainLog(p=>[...p,{...strainForm,id:Date.now(),date:new Date().toISOString()}]);
    setStrainForm({actId:null,duration:30,effort:5,stressLevel:5});
    setShowStrainForm(false);
  },[strainForm,setStrainLog]);

  /* Eat log save */
  const saveEatEntry = useCallback(()=>{
    if(!eatForm.mood||!eatForm.food) return;
    setEatLog(p=>[...p,{...eatForm,id:Date.now(),time:new Date().toISOString()}]);
    setShowEatModal(false);
    setEatForm({mood:"",food:"",hunger:3,notes:"",time:new Date().toISOString()});
  },[eatForm,setEatLog]);

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
  const burnoutColor = burnoutRisk==="High"?RED:burnoutRisk==="Moderate"?ORANGE:GREEN;
  const completedGoals = goals.filter(g=>g.done).length;
  const goalPct = Math.round((completedGoals/goals.length)*100);
  const fmt = s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  /* program handlers (unchanged) */
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
  },[setGoals,setMedCount]);
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
    {id:"focus",label:"Focus Mode",emoji:"🎯",badge:"NEW"},
    {id:"strain",label:"Strain",emoji:"⚡",badge:"NEW"},
    {id:"eat",label:"Eat Journal",emoji:"🍽",badge:"NEW"},
    {id:"programs",label:"Programs",emoji:"▶"},
    {id:"tracker",label:"Tracker",emoji:"◎"},
    {id:"journal",label:"Journal",emoji:"◧"},
    {id:"tools",label:"Tools",emoji:"🛠"},
    {id:"insights",label:"Insights",emoji:"◈"},
  ];

  const strainZone = todayStrain>17?"All Out":todayStrain>13?"Strenuous":todayStrain>8?"Moderate":"Light";
  const strainZoneCol = todayStrain>17?RED:todayStrain>13?ORANGE:todayStrain>8?G:GREEN;
  const focusMinsToday = focusSessions.filter(s=>new Date(s.date).toDateString()===new Date().toDateString()).reduce((sum,s)=>sum+s.mins,0)+focusTotalToday;

  return (
    <div style={{minHeight:"100dvh",background:BG,color:"#ddd8cc",fontFamily:FONT,position:"relative",overflowX:"hidden"}}>

      {/* Ambient */}
      <div style={{position:"fixed",top:"8%",left:"50%",transform:"translateX(-50%)",width:600,height:300,
        background:`radial-gradient(ellipse,${G}08 0%,transparent 68%)`,
        animation:"mx-pulse 6s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:300,height:200,
        background:`radial-gradient(ellipse,${PURPLE}06 0%,transparent 70%)`,
        animation:"mx-pulse 9s ease-in-out infinite 2s",pointerEvents:"none",zIndex:0}}/>

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
                <div style={{fontFamily:HEAD,fontSize:24,color:G,letterSpacing:".04em"}}>STRESS ASSESSMENT</div>
                <button className="mx-btn" onClick={()=>setShowQuiz(false)} style={{background:"transparent",border:`1px solid ${BOR}`,color:"#333",padding:"4px 10px",fontFamily:FONT,fontSize:10}}>✕</button>
              </div>
              {quizDone?(
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <div style={{fontSize:50,marginBottom:12}}>✅</div>
                  <div style={{fontFamily:HEAD,fontSize:30,color:"#ddd",marginBottom:8}}>ASSESSMENT COMPLETE</div>
                  <div style={{fontSize:12,color:"#3a3a3a"}}>Stress index: <span style={{color:stressColor,fontWeight:700}}>{stressScore}%</span></div>
                </div>
              ):(
                <>
                  {QUIZ.map((q,qi)=>(
                    <div key={q.id} style={{marginBottom:20}}>
                      <div style={{fontSize:11,color:"#3a3a3a",marginBottom:10,letterSpacing:".04em"}}>{qi+1}. {q.q}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {q.opts.map(o=>(
                          <button key={o} className="mx-btn" onClick={()=>setQuizA(p=>({...p,[q.id]:o}))}
                            style={{padding:"9px 12px",background:quizA[q.id]===o?`${G}1a`:"#0e0e0e",
                              border:`1px solid ${quizA[q.id]===o?G:BOR}`,color:quizA[q.id]===o?G:"#2a2a2a",
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
                    style={{padding:"9px 10px",background:jForm.trigger.includes(t.id)?`${G}18`:"#0e0e0e",
                      border:`1px solid ${jForm.trigger.includes(t.id)?G:BOR}`,color:jForm.trigger.includes(t.id)?G:"#2a2a2a",
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

      {/* STRESS-EATING MODAL */}
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
                    style={{padding:"10px 10px",background:eatForm.food===f.id?`${ORANGE}18`:"#0e0e0e",
                      border:`1px solid ${eatForm.food===f.id?ORANGE:BOR}`,color:eatForm.food===f.id?ORANGE:"#2a2a2a",
                      fontFamily:FONT,fontSize:9,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                    <span>{f.icon}</span><span>{f.label}</span>
                    {f.riskScore>0&&<span style={{marginLeft:"auto",fontSize:7,color:f.riskScore>2?RED:G}}>×{f.riskScore}</span>}
                  </button>
                ))}
              </div>
              <Label>Physical hunger level: {eatForm.hunger}/10</Label>
              <div style={{fontSize:8,color:"#1e1e1e",marginBottom:6}}>1 = not hungry · 10 = starving</div>
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
          <div style={{fontFamily:HEAD,fontSize:30,letterSpacing:".03em",lineHeight:1,color:"#e8e4d9"}}>STRESS & BURNOUT</div>
          <div style={{fontSize:7,letterSpacing:".22em",color:"#1e1e1e",textTransform:"uppercase",marginTop:3}}>
            MANIFIX v2 · Focus · Strain · Eat Journal · HRV
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
        </div>
      </div>

      {/* TABS */}
      <div style={{borderBottom:`1px solid ${BOR}`,padding:"0 16px",display:"flex",gap:1,overflowX:"auto",background:`${BG}f8`,position:"sticky",top:57,zIndex:19}}>
        {TABS.map(t=>(
          <button key={t.id} className="mx-btn" onClick={()=>setTab(t.id)}
            style={{padding:"11px 12px",background:"transparent",border:"none",
              borderBottom:`2px solid ${tab===t.id?G:"transparent"}`,
              color:tab===t.id?G:"#222",fontFamily:FONT,fontSize:7,
              letterSpacing:".16em",textTransform:"uppercase",whiteSpace:"nowrap",
              transition:"all .2s",position:"relative"}}>
            {t.emoji} {t.label}
            {t.badge&&<span style={{position:"absolute",top:4,right:2,fontSize:5,color:t.badge==="NEW"?TEAL:RED,letterSpacing:".12em",fontFamily:FONT}}>{t.badge}</span>}
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
                      `HRV ${hrvLast}ms`,`STRESS ${stressScore}%`,`STREAK ${streak}d`,`CORTISOL ~${cortisol}mcg/dL`,
                      `STRAIN ${todayStrain.toFixed(1)}/21`,`FOCUS ${focusMinsToday}min today`,`BURNOUT ${burnoutRisk}`,
                    ]).map((t,i)=>(
                      <span key={i} style={{fontSize:7,letterSpacing:".2em",color:"#1e1e1e",textTransform:"uppercase"}}>
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
                        <div style={{fontSize:11,color:"#2a2a2a",lineHeight:1.8,marginBottom:12}}>{forecast.tip}</div>
                        <div style={{display:"flex",gap:20}}>
                          {[["Morning",forecast.morning,GREEN],["Afternoon",forecast.afternoon,G],["Evening",forecast.evening,BLUE]].map(([l,v,c])=>(
                            <div key={l}>
                              <div style={{fontSize:7,letterSpacing:".16em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:2}}>{l}</div>
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
                    {label:"Strain Today",value:todayStrain.toFixed(1),sub:strainZone,color:strainZoneCol},
                    {label:"Focus Today",value:`${focusMinsToday}m`,sub:"deep work",color:BLUE},
                    {label:"HRV Live",value:null,sub:"ms · variability",color:PURPLE,hrv:true},
                  ].map(({label,value,sub,color,bar,hrv})=>(
                    <Card key={label}>
                      <Label>{label}</Label>
                      {hrv?<HrvBadge value={hrvLast}/>:<div style={{fontFamily:HEAD,fontSize:32,color,lineHeight:1}}>{value}</div>}
                      <div style={{fontSize:8,color:"#1e1e1e",marginTop:3}}>{sub}</div>
                      {bar&&<Bar pct={stressScore} color={color}/>}
                    </Card>
                  ))}
                </div>

                {/* NEW feature nav cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    {icon:"🎯",label:"Focus Mode",sub:`${focusMinsToday}min today · beats Headspace`,action:()=>setTab("focus"),color:BLUE,badge:"NEW"},
                    {icon:"⚡",label:"Strain Score",sub:`${todayStrain.toFixed(1)}/21 · ${strainZone} · beats Whoop`,action:()=>setTab("strain"),color:ORANGE,badge:"NEW"},
                    {icon:"🍽",label:"Eat Journal",sub:`${eatLog.length} entries · beats Noom`,action:()=>setTab("eat"),color:TEAL,badge:"NEW"},
                  ].map((c,i)=>(
                    <button key={i} className="mx-btn" onClick={c.action}
                      style={{background:CARD,border:`1px solid ${c.color}22`,padding:"16px 12px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:8,position:"relative"}}>
                      <div style={{position:"absolute",top:8,right:8,fontSize:6,letterSpacing:".12em",color:TEAL,background:`${TEAL}12`,border:`1px solid ${TEAL}25`,padding:"2px 6px",fontFamily:FONT}}>{c.badge}</div>
                      <span style={{fontSize:26}}>{c.icon}</span>
                      <div style={{fontSize:10,fontWeight:700,color:"#ddd",fontFamily:HEAD,letterSpacing:".04em"}}>{c.label}</div>
                      <div style={{fontSize:8,color:"#1e1e1e",lineHeight:1.5}}>{c.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Goals */}
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
                          style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${g.done?"#1e3d1e":BOR}`,background:g.done?"#0a130a":"#0e0e0e",padding:"9px 12px"}}>
                          <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,border:`2px solid ${g.done?GREEN:BOR}`,background:g.done?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:BG,fontSize:9}}>
                            {g.done&&"✓"}
                          </div>
                          <span style={{fontSize:9,color:"#2a2a2a",textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
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
                        ].map(({label,icon,action})=>(
                          <button key={label} className="mx-btn" onClick={action}
                            style={{padding:"12px 8px",background:"#0e0e0e",border:`1px solid ${BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
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

            {/* ══════════ FOCUS MODE — NEW (beats Headspace) ══════════ */}
            {tab==="focus"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>FOCUS MODE</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e1e",textTransform:"uppercase",marginTop:2}}>
                      Beats Headspace · Work+Mindfulness intervals · HRV-optimised
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:HEAD,fontSize:28,color:BLUE,lineHeight:1}}>{focusMinsToday}</div>
                    <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e1e",textTransform:"uppercase"}}>mins today</div>
                  </div>
                </div>

                {/* Preset selector */}
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
                          <div style={{fontSize:7,color:"#1e1e1e",letterSpacing:".1em"}}>{preset.rest}min break</div>
                        </div>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:20,color:"#e8e4d9",marginBottom:3}}>{preset.label}</div>
                      <div style={{fontSize:9,color:"#1e1e1e",lineHeight:1.7,marginBottom:12}}>{preset.desc}</div>
                      <div style={{fontSize:8,color:`${preset.color}66`,lineHeight:1.6,marginBottom:14,fontStyle:"italic"}}>
                        💡 {preset.tip}
                      </div>
                      <GoldBtn onClick={()=>startFocus(preset)} style={{width:"100%",background:preset.color,fontSize:9}}>
                        ▶ Start {preset.label}
                      </GoldBtn>
                    </Card>
                  ))}
                </div>

                {/* Mindful break guide */}
                <Card>
                  <Label>Mindful Break Activities · Auto-assigned during sessions</Label>
                  <div style={{fontSize:9,color:"#1e1e1e",lineHeight:1.7,marginBottom:14}}>
                    Unlike Headspace, SleepGold assigns evidence-based micro-breaks matching your current stress level. Each break resets your nervous system before the next work sprint.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {MINDFUL_BREAKS.map((b,i)=>(
                      <div key={i} style={{background:"#0e0e0e",border:`1px solid ${BOR}`,padding:"12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <span style={{fontSize:18}}>{b.emoji}</span>
                          <span style={{fontSize:7,color:TEAL,letterSpacing:".1em"}}>{b.dur}s</span>
                        </div>
                        <div style={{fontSize:10,color:"#ccc",marginBottom:4}}>{b.title}</div>
                        <div style={{fontSize:8,color:"#1e1e1e",lineHeight:1.6}}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Past sessions */}
                {focusSessions.length>0&&(
                  <Card>
                    <Label>Recent Focus Sessions</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {[...focusSessions].reverse().slice(0,5).map(s=>{
                        const p = FOCUS_PRESETS.find(x=>x.id===s.preset)||FOCUS_PRESETS[1];
                        return (
                          <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                            border:`1px solid ${BOR}`,padding:"10px 14px",background:"#0e0e0e"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:18}}>{p.icon}</span>
                              <div>
                                <div style={{fontSize:10,color:"#bbb"}}>{p.label}</div>
                                <div style={{fontSize:8,color:"#1e1e1e"}}>{new Date(s.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:HEAD,fontSize:20,color:p.color,lineHeight:1}}>{s.mins}m</div>
                              <div style={{fontSize:7,color:"#1e1e1e"}}>{s.sessions} sessions</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* vs Headspace comparison */}
                <Card style={{borderLeft:`3px solid ${BLUE}`}}>
                  <Label>Why This Beats Headspace Focus</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Headspace Focus",items:["Fixed 25min Pomodoro only","Generic break suggestions","No stress integration","No HRV tracking"],col:"#444"},
                      {label:"ManifiX Focus Mode",items:["4 presets: 15/25/30/50min","HRV-adaptive break tasks","Stress index integration","Cortisol reduction tracking"],col:BLUE},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a2a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ STRAIN SCORE — NEW (beats Whoop) ══════════ */}
            {tab==="strain"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>STRAIN SCORE</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e1e",textTransform:"uppercase",marginTop:2}}>
                      Beats Whoop · Total daily load vs recovery · 0–21 scale
                    </div>
                  </div>
                  <GoldBtn onClick={()=>setShowStrainForm(true)} small>+ Log Activity</GoldBtn>
                </div>

                {/* Strain ring + summary */}
                <Card style={{display:"flex",gap:24,alignItems:"center"}}>
                  <StrainRing strain={todayStrain} recovery={todayRecovery}/>
                  <div style={{flex:1}}>
                    <div style={{marginBottom:16}}>
                      <Label>Today's Strain Zone</Label>
                      <div style={{fontFamily:HEAD,fontSize:36,color:strainZoneCol,lineHeight:1}}>{strainZone.toUpperCase()}</div>
                      <div style={{fontSize:9,color:"#1e1e1e",marginTop:4,lineHeight:1.7}}>
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
                        <div key={label} style={{background:"#0e0e0e",border:`1px solid ${BOR}`,padding:"10px"}}>
                          <div style={{fontSize:7,letterSpacing:".14em",color:"#1e1e1e",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                          <div style={{fontFamily:HEAD,fontSize:22,color:col,lineHeight:1}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Strain zones legend */}
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
                          <div style={{fontSize:7,color:"#1e1e1e"}}>{range}</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{height:4,background:"#0e0e0e",borderRadius:2,marginBottom:4}}>
                            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${col}66,${col})`,borderRadius:2}}/>
                          </div>
                          <div style={{fontSize:8,color:"#1e1e1e"}}>{desc}</div>
                        </div>
                        {todayStrain>=parseFloat(range.split("–")[0])&&todayStrain<parseFloat(range.split("–")[1]||"22")&&(
                          <div style={{width:8,height:8,borderRadius:"50%",background:col,animation:"mx-blink 1.2s infinite"}}/>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Activity log form */}
                <AnimatePresence>
                  {showStrainForm&&(
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}>
                      <Card style={{border:`1px solid ${ORANGE}22`}}>
                        <Label>Log Activity</Label>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
                          {ACTIVITIES.map(a=>(
                            <button key={a.id} className="mx-btn" onClick={()=>setStrainForm(p=>({...p,actId:a.id}))}
                              style={{padding:"10px 6px",background:strainForm.actId===a.id?`${ORANGE}18`:"#0e0e0e",
                                border:`1px solid ${strainForm.actId===a.id?ORANGE:BOR}`,
                                display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <span style={{fontSize:18}}>{a.icon}</span>
                              <span style={{fontSize:7,color:strainForm.actId===a.id?ORANGE:"#1e1e1e",textAlign:"center",lineHeight:1.3}}>{a.label}</span>
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

                {/* Today's activity log */}
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
                                <div style={{fontSize:8,color:"#1e1e1e"}}>{log.duration}min · effort {log.effort}/10</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:HEAD,fontSize:18,color:loadCol,lineHeight:1}}>+{load.toFixed(1)}</div>
                              <div style={{fontSize:7,color:"#1e1e1e"}}>strain</div>
                            </div>
                          </div>
                        ):null;
                      })}
                    </div>
                  </Card>
                )}

                {/* vs Whoop comparison */}
                <Card style={{borderLeft:`3px solid ${ORANGE}`}}>
                  <Label>Why This Beats Whoop</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Whoop",items:["Requires wearable hardware","$30/month subscription","Physical strain only","No mental stress tracking"],col:"#444"},
                      {label:"ManifiX Strain",items:["Zero hardware required","Free — works offline","Physical + mental + emotional load","Integrates HRV + stress index"],col:ORANGE},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a2a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ STRESS-EATING JOURNAL — NEW (beats Noom) ══════════ */}
            {tab==="eat"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>EAT JOURNAL</div>
                    <div style={{fontSize:8,letterSpacing:".18em",color:"#1e1e1e",textTransform:"uppercase",marginTop:2}}>
                      Stress-eating pattern detection · Beats Noom · {eatLog.length} entries
                    </div>
                  </div>
                  <GoldBtn onClick={()=>setShowEatModal(true)} style={{background:ORANGE}}>+ Log Moment</GoldBtn>
                </div>

                {/* Pattern analysis */}
                {Object.keys(eatPatterns).length>0?(
                  <Card>
                    <Label>Stress-Eating Pattern Analysis</Label>
                    <div style={{fontSize:9,color:"#1e1e1e",lineHeight:1.7,marginBottom:14}}>
                      Noom shows calorie counts. ManifiX detects the emotional trigger → food correlation that drives stress-eating behaviour.
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {Object.entries(eatPatterns).sort((a,b)=>b[1].count-a[1].count).map(([mood,data])=>{
                        const avgHunger=(data.totalHunger/data.count).toFixed(1);
                        const topFood=Object.entries(data.foods).sort((a,b)=>b[1]-a[1])[0];
                        const foodCat=topFood?FOOD_CATEGORIES.find(f=>f.id===topFood[0]):null;
                        const isEmotional=avgHunger<5;
                        const col=isEmotional?RED:GREEN;
                        return (
                          <div key={mood} style={{border:`1px solid ${col}18`,background:"#0e0e0e",padding:"12px 14px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div className="eat-dot" style={{width:8,height:8,borderRadius:"50%",background:col}}/>
                                <div>
                                  <div style={{fontSize:11,color:"#bbb"}}>{mood}</div>
                                  <div style={{fontSize:8,color:"#1e1e1e"}}>{data.count}× logged</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:9,color:col,fontWeight:700}}>
                                  {isEmotional?"⚠ Emotional eating":"✓ Physical hunger"}
                                </div>
                                <div style={{fontSize:7,color:"#1e1e1e"}}>Avg hunger {avgHunger}/10</div>
                              </div>
                            </div>
                            {topFood&&foodCat&&(
                              <div style={{fontSize:8,color:"#2a2a2a",padding:"6px 10px",background:"#0a0a0a",border:`1px solid ${BOR}`}}>
                                Most common: {foodCat.icon} <span style={{color:"#bbb"}}>{foodCat.label}</span>
                                {foodCat.riskScore>0&&<span style={{color:foodCat.riskScore>2?RED:G,marginLeft:8,fontSize:7}}>Risk ×{foodCat.riskScore}</span>}
                              </div>
                            )}
                            {isEmotional&&(
                              <div style={{marginTop:8,fontSize:8,color:`${RED}77`,fontStyle:"italic",lineHeight:1.6}}>
                                💡 Pattern: {mood} → {foodCat?.label||"comfort food"}. Try 2-min breathing before reaching for food next time.
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
                    <div style={{fontSize:11,color:"#1e1e1e",letterSpacing:".14em",textTransform:"uppercase"}}>No entries yet</div>
                    <div style={{fontSize:10,color:"#141414",marginTop:6,lineHeight:1.7,maxWidth:300,margin:"8px auto 20px"}}>
                      Log eating moments to detect stress-eating patterns. Unlike Noom, this tracks emotional triggers — not calories.
                    </div>
                    <GoldBtn onClick={()=>setShowEatModal(true)} style={{background:ORANGE}}>Log First Moment</GoldBtn>
                  </Card>
                )}

                {/* Hunger vs emotion chart */}
                {eatLog.length>2&&(
                  <Card>
                    <Label>Hunger Level Distribution</Label>
                    <div style={{fontSize:9,color:"#1e1e1e",marginBottom:10}}>Below 5 = likely emotional eating, not physical hunger</div>
                    <div style={{height:160}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eatLog.slice(-14).map((e,i)=>({
                          idx:`E${i+1}`,hunger:e.hunger,
                          fill:e.hunger<5?RED:GREEN,
                        }))}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                          <XAxis dataKey="idx" stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}}/>
                          <YAxis stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}} domain={[0,10]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <RBar dataKey="hunger" name="Hunger" radius={[2,2,0,0]}>
                            {eatLog.slice(-14).map((e,i)=>(
                              <Cell key={i} fill={e.hunger<5?RED:GREEN}/>
                            ))}
                          </RBar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{display:"flex",gap:14,marginTop:8}}>
                      {[{col:GREEN,label:"Physical hunger (5+)"},{col:RED,label:"Emotional eating (<5)"}].map(({col,label})=>(
                        <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                          <span style={{fontSize:7,color:"#1e1e1e"}}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Log entries */}
                {eatLog.length>0&&(
                  <Card>
                    <Label>Recent Eating Moments</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto"}}>
                      {[...eatLog].reverse().slice(0,10).map(entry=>{
                        const foodCat=FOOD_CATEGORIES.find(f=>f.id===entry.food);
                        const isEmotional=entry.hunger<5;
                        return (
                          <div key={entry.id} style={{border:`1px solid ${isEmotional?RED+"18":GREEN+"15"}`,padding:"10px 14px",
                            background:"#0e0e0e",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                            <div style={{display:"flex",gap:10,alignItems:"center"}}>
                              <span style={{fontSize:20}}>{foodCat?.icon||"🍽"}</span>
                              <div>
                                <div style={{fontSize:10,color:"#bbb"}}>{entry.mood} → {foodCat?.label}</div>
                                <div style={{fontSize:7,color:"#1e1e1e"}}>{new Date(entry.time).toLocaleString()}</div>
                                {entry.notes&&<div style={{fontSize:8,color:"#2a2a2a",fontStyle:"italic",marginTop:2}}>{entry.notes}</div>}
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:9,color:isEmotional?RED:GREEN}}>{isEmotional?"Emotional":"Physical"}</div>
                              <div style={{fontSize:7,color:"#1e1e1e"}}>hunger {entry.hunger}/10</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* vs Noom */}
                <Card style={{borderLeft:`3px solid ${TEAL}`}}>
                  <Label>Why This Beats Noom</Label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {label:"Noom",items:["Calorie counting focus","No emotional trigger tracking","Generic coaching messages","$60/month subscription"],col:"#444"},
                      {label:"ManifiX Eat Journal",items:["Emotional trigger detection","Mood→food correlation mapping","Personalised pattern insights","Free · zero calorie shame"],col:TEAL},
                    ].map((col,i)=>(
                      <div key={i}>
                        <div style={{fontSize:9,color:col.col,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{col.label}</div>
                        {col.items.map((item,j)=>(
                          <div key={j} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:col.col,flexShrink:0}}/>
                            <span style={{fontSize:8,color:"#2a2a2a"}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
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
                      <div style={{fontSize:10,color:"#1e1e1e",lineHeight:1.7,marginBottom:14}}>{prog.desc}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
                        {prog.steps.map((step,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${BOR}`,color:"#1e1e1e",fontSize:9}}>
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
                      <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle,${s.color}10 0%,transparent 70%)`}}/>
                      <div style={{fontSize:30,marginBottom:10}}>{s.emoji}</div>
                      <div style={{fontSize:12,color:"#ddd",marginBottom:3}}>{s.title}</div>
                      <div style={{fontSize:9,color:`${s.color}77`,marginBottom:5}}>{s.duration} min</div>
                      <div style={{fontSize:9,color:"#1e1e1e",marginBottom:12,lineHeight:1.6}}>{s.focus}</div>
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
                        style={{padding:"12px 6px",background:selMood===mood?`${MOOD_COLS[mood]||G}1a`:"#0e0e0e",border:`1px solid ${selMood===mood?MOOD_COLS[mood]||G:BOR}`,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <span style={{fontSize:22}}>{emoji}</span>
                        <span style={{fontSize:7,letterSpacing:".1em",color:selMood===mood?MOOD_COLS[mood]||G:"#1e1e1e",textTransform:"uppercase",textAlign:"center",lineHeight:1.4}}>{mood}</span>
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
                  <Label>HRV — Real-Time Heart Rate Variability</Label>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <HrvBadge value={hrvLast}/>
                    <div style={{fontSize:8,color:"#1e1e1e",textAlign:"right"}}>
                      <div>Normal: 40–80ms</div>
                      <div style={{color:hrvLast>55?GREEN:hrvLast>40?G:RED,marginTop:2}}>{hrvLast>55?"Good Recovery":hrvLast>40?"Moderate":"Low — Rest needed"}</div>
                    </div>
                  </div>
                  {hrvData.length>2?(
                    <div style={{height:180}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyHrv}>
                          <defs><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={G} stopOpacity={.3}/><stop offset="100%" stopColor={G} stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                          <XAxis dataKey="time" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                          <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[20,80]}/>
                          <Tooltip content={<MxTooltip/>}/>
                          <Area type="monotone" dataKey="value" name="HRV" stroke={G} fill="url(#hG)" strokeWidth={2} dot={{fill:G,r:2}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ):<div style={{padding:"30px 0",textAlign:"center",fontSize:8,letterSpacing:".15em",color:"#1a1a1a",textTransform:"uppercase"}}>Collecting HRV data...</div>}
                </Card>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>7-Day Mood Trend</Label>
                    {moodChartData.length>1?(
                      <div style={{height:170}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={moodChartData}>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                            <XAxis dataKey="day" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                            <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[0,10]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Line type="monotone" dataKey="value" name="Score" stroke={G} strokeWidth={2}
                              dot={({cx,cy,payload})=><circle key={cx} cx={cx} cy={cy} r={4} fill={MOOD_COLS[payload.mood]||G} stroke="none"/>}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"40px 0",textAlign:"center",fontSize:8,letterSpacing:".14em",color:"#1a1a1a",textTransform:"uppercase"}}>Log mood daily to see trend</div>}
                  </Card>
                  <Card>
                    <Label>Trigger Correlation</Label>
                    {triggerCorr.length>0?(
                      <div style={{height:170}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={triggerCorr} layout="vertical">
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e" horizontal={false}/>
                            <XAxis type="number" stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}}/>
                            <YAxis type="category" dataKey="name" width={80} stroke="#1a1a1a" tick={{fontSize:7,fill:"#222"}}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <RBar dataKey="value" name="Freq" radius={[0,2,2,0]}>
                              {triggerCorr.map((_,i)=><Cell key={i} fill={[G,ORANGE,BLUE,PURPLE,GREEN,TEAL][i%6]}/>)}
                            </RBar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"40px 0",textAlign:"center",fontSize:8,letterSpacing:".14em",color:"#1a1a1a",textTransform:"uppercase"}}>Add journal entries to correlate</div>}
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
                    <div style={{fontSize:8,color:"#1e1e1e",letterSpacing:".14em",marginTop:2}}>{journal.length} entries · patterns tracked</div>
                  </div>
                  <GoldBtn onClick={()=>setJModal(true)}>+ New Entry</GoldBtn>
                </div>
                {journal.length===0?(
                  <Card style={{textAlign:"center",padding:"56px 20px"}}>
                    <div style={{fontSize:44,marginBottom:12}}>📓</div>
                    <div style={{fontSize:11,color:"#1e1e1e",letterSpacing:".14em",textTransform:"uppercase"}}>No entries yet</div>
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
                                <div style={{fontSize:7,color:"#1e1e1e",letterSpacing:".12em",marginBottom:5}}>{new Date(entry.date).toLocaleString()}</div>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:20}}>{emoji}</span>
                                  <span style={{fontSize:11,color:moodColor}}>{entry.mood}</span>
                                  <span style={{fontSize:8,color:"#1e1e1e",padding:"2px 7px",border:`1px solid ${BOR}`}}>Intensity {entry.intensity}/10</span>
                                </div>
                              </div>
                              <button className="mx-btn" onClick={()=>setJournal(p=>p.filter(x=>x.id!==entry.id))}
                                style={{padding:"4px 8px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.15)",color:RED,fontFamily:FONT,fontSize:8}}>✕</button>
                            </div>
                            {entry.notes&&<div style={{fontSize:10,color:"#2a2a2a",lineHeight:1.8,fontStyle:"italic",borderLeft:`2px solid ${BOR}`,paddingLeft:12,marginLeft:12}}>"{entry.notes}"</div>}
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
                          style={{padding:"9px 12px",background:selCoping?.id===c.id?`${G}14`:"#0e0e0e",border:`1px solid ${selCoping?.id===c.id?G:BOR}`,display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
                          <div>
                            <div style={{fontSize:10,color:"#bbb"}}>{c.icon} {c.title}</div>
                            <div style={{fontSize:8,color:"#1e1e1e",marginTop:2}}>{c.desc}</div>
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
                      <div key={i} style={{background:"#0e0e0e",border:`1px solid ${BOR}`,padding:"14px 10px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${item.color}55,transparent)`}}/>
                        <div style={{fontSize:24,marginBottom:8}}>{item.emoji}</div>
                        <div style={{fontSize:10,color:item.color,marginBottom:5}}>{item.title}</div>
                        <div style={{fontSize:8,color:"#1a1a1a",lineHeight:1.7}}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ══════════ INSIGHTS ══════════ */}
            {tab==="insights"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontFamily:HEAD,fontSize:30,color:"#e8e4d9"}}>BURNOUT INSIGHTS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Card>
                    <Label>Burnout Dimensions Radar</Label>
                    <BurnoutRadar score={stressScore} hrvLast={hrvLast} moods={moods}/>
                  </Card>
                  <Card>
                    <Label>Stress Index History</Label>
                    {moodChartData.length>2?(
                      <div style={{height:220}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={moodChartData.map(d=>({...d,stress:Math.round(10-d.value)*10}))}>
                            <defs><linearGradient id="sG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={.3}/><stop offset="100%" stopColor={ORANGE} stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="#0e0e0e"/>
                            <XAxis dataKey="day" stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}}/>
                            <YAxis stroke="#1a1a1a" tick={{fontSize:8,fill:"#222"}} domain={[0,100]}/>
                            <Tooltip content={<MxTooltip/>}/>
                            <Area type="monotone" dataKey="stress" name="Stress" stroke={ORANGE} fill="url(#sG)" strokeWidth={2}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ):<div style={{padding:"50px 0",textAlign:"center",fontSize:8,color:"#1a1a1a",letterSpacing:".14em",textTransform:"uppercase"}}>Log more moods to see trend</div>}
                  </Card>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {label:"Total Sessions",value:sessCount,color:TEAL,icon:"🏃"},
                    {label:"Meditations",value:medCount,color:PURPLE,icon:"🧘"},
                    {label:"Focus Sessions",value:focusSessions.reduce((sum,s)=>sum+s.sessions,0),color:BLUE,icon:"🎯"},
                    {label:"Eat Logs",value:eatLog.length,color:ORANGE,icon:"🍽"},
                  ].map(({label,value,color,icon})=>(
                    <Card key={label} style={{textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                      <div style={{fontFamily:HEAD,fontSize:36,color,lineHeight:1}}>{value}</div>
                      <Label style={{marginBottom:0,marginTop:4}}>{label}</Label>
                    </Card>
                  ))}
                </div>
                <Card style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontFamily:HEAD,fontSize:18,color:"#e8e4d9"}}>FULL STRESS ASSESSMENT</div>
                    <div style={{fontSize:9,color:"#1e1e1e",marginTop:3,lineHeight:1.7}}>6-question WHO-aligned assessment to recalibrate your stress index</div>
                  </div>
                  <GoldBtn onClick={()=>{setShowQuiz(true);setQuizDone(false);setQuizA({});}}>Take Assessment</GoldBtn>
                </Card>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
