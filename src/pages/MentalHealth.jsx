import { useMemo, useState, useEffect, useCallback, useRef } from "react";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD — CORRECT PALETTE
════════════════════════════════════════════════════════════ */
const GOLD   = "#ffc83c";
const DIM    = "#c8a84b";
const BG     = "#080808";
const CARD   = "#0c0c0c";
const BOR    = "#1a1a1a";
const FONT   = "'DM Mono','Courier New',monospace";
const HEAD   = "'Bebas Neue',sans-serif";
const TEXT   = "#e8e4d9";
const MUTED  = "#2a2a2a";
const SUB    = "#3a3a3a";
const GRID_C = "rgba(255,200,60,.025)";
const GREEN  = "#4ade80";
const RED    = "#ef4444";

/* ════════════════════════════════════════════════════════════
   CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("mh-css")) return;
  const el = document.createElement("style");
  el.id = "mh-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes mh-up    {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mh-pulse {0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.13;transform:scale(1.06)}}
    @keyframes mh-tick  {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes mh-scan  {from{top:-2px}to{top:100%}}
    @keyframes mh-float {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes mh-blink {0%,100%{opacity:1}50%{opacity:.1}}
    @keyframes mh-spin  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes mh-ring  {0%{transform:scale(1);opacity:.7}100%{transform:scale(2.2);opacity:0}}
    @keyframes mh-breathe{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.18);opacity:1}}
    @keyframes mh-prog  {from{width:0}to{width:var(--pw)}}
    .mh-up   {animation:mh-up .45s cubic-bezier(.22,.68,0,1.2) both}
    .mh-btn  {cursor:pointer;transition:all .15s}
    .mh-btn:hover{opacity:.88;transform:translateY(-1px)}
    .mh-btn:active{transform:translateY(0)}
    .mh-card-h{transition:border-color .2s,background .2s}
    .mh-card-h:hover{border-color:#2a2a2a!important}
    ::selection{background:rgba(255,200,60,.2);color:#e8e4d9}
    textarea:focus,input:focus{border-color:#ffc83c44!important}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-track{background:#0c0c0c}
    ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════ */
const MANIFIX_MODULES = [
  {id:"mental",    icon:"🧠",label:"Mental",     stat:"970M affected",    result:"Calm in 30d",    route:"/app/mental"},
  {id:"sleep",     icon:"😴",label:"Sleep",      stat:"45% deprived",     result:"8h deep sleep",  route:"/app/sleep"},
  {id:"nutrition", icon:"🍎",label:"Nutrition",  stat:"1B obese adults",  result:"−8kg in 2mo",    route:"/app/nutrition"},
  {id:"stress",    icon:"😓",label:"Stress",     stat:"67% burned out",   result:"Level 9→3",      route:"/app/stress"},
  {id:"chronic",   icon:"🫀",label:"Chronic",    stat:"422M diabetics",   result:"Risk ↓40%",      route:"/app/chronic"},
  {id:"women",     icon:"👩",label:"Women",      stat:"PCOS · hormones",  result:"Symptoms ↓",     route:"/app/women"},
  {id:"elderly",   icon:"👴",label:"Elderly",    stat:"Family health",    result:"Connected daily", route:"/app/elderly"},
  {id:"meds",      icon:"💊",label:"Meds",       stat:"50% non-adherent", result:"0 missed/60d",   route:"/app/medication"},
  {id:"children",  icon:"🧒",label:"Children",   stat:"81% teens inactive",result:"Growth tracked", route:"/app/children"},
  {id:"prevent",   icon:"🏃",label:"Preventive", stat:"SDG 3.8 equity",   result:"Score 45→87",    route:"/app/preventive"},
];

const TIPS = [
  "Deep breathing reduces cortisol by 23% in 4 minutes.",
  "8 minutes of meditation improves focus for 4 hours.",
  "Daily movement lowers depression risk by 26%.",
  "Sleep quality is the #1 predictor of next-day mood.",
  "Mindfulness reduces burnout symptoms by 30% in 30 days.",
  "Gratitude journaling rewires neural reward pathways.",
  "Nature exposure reduces amygdala activity measurably.",
  "Cold exposure boosts norepinephrine 5× for 3 hours.",
];

const WHO_STATS = [
  {value:"970M", label:"People with mental disorders globally"},
  {value:"67%",  label:"Workers experiencing burnout"},
  {value:"75%",  label:"People in LMICs with no treatment"},
  {value:"4:1",  label:"ROI of mental health investment"},
];

const TICKER_TEXT = [
  "970M people live with mental disorders — WHO 2022",
  "ManifiX AI — mental wellness for all humans",
  "SDG 3.4 — promote mental health and wellbeing",
  "67% of workers experience burnout — Gallup 2023",
  "Offline-first mental care for low-income countries",
  "30-day calm transformation proven by users",
  "$1 trillion/year lost to depression and anxiety at work",
  "Magic16 — 16 minutes that change your mental health",
].join("   ·   ");

/* ── GUIDED MEDITATION PROGRAMS ── */
const MEDITATION_PROGRAMS = [
  {
    id: "7day-calm",
    title: "7-Day Calm",
    subtitle: "Stress Relief Foundation",
    days: 7,
    badge: "BEGINNER",
    badgeColor: GREEN,
    icon: "🌿",
    description: "Build a daily mindfulness habit. Science-backed sessions to reduce cortisol and build resilience.",
    sessions: [
      {day:1, title:"Anchor Breath",       duration:"8 min",  focus:"Breathing",   done:false, desc:"Learn the foundation of mindfulness through breath awareness."},
      {day:2, title:"Body Scan Release",   duration:"10 min", focus:"Body",        done:false, desc:"Progressive muscle relaxation to release stored tension."},
      {day:3, title:"Thought Observer",    duration:"8 min",  focus:"Mind",        done:false, desc:"Watch thoughts without attachment — the core skill."},
      {day:4, title:"Gratitude Pulse",     duration:"7 min",  focus:"Emotion",     done:false, desc:"Rewire your brain's reward circuit through gratitude."},
      {day:5, title:"Open Awareness",      duration:"12 min", focus:"Presence",    done:false, desc:"Expand into spacious, non-directive awareness."},
      {day:6, title:"Loving Kindness",     duration:"10 min", focus:"Compassion",  done:false, desc:"Metta meditation to dissolve self-criticism."},
      {day:7, title:"Integration",         duration:"15 min", focus:"Synthesis",   done:false, desc:"Consolidate your week — build your daily anchor."},
    ]
  },
  {
    id: "21day-focus",
    title: "21-Day Focus",
    subtitle: "Deep Attention Training",
    days: 21,
    badge: "INTERMEDIATE",
    badgeColor: GOLD,
    icon: "🎯",
    description: "Rebuild concentration in the distraction era. Samatha-based focus training used by neuroscientists.",
    sessions: [
      {day:1,  title:"Single-Point Focus",  duration:"10 min", focus:"Attention",  done:false, desc:"Fix awareness on a single object without wandering."},
      {day:2,  title:"Return Drill",        duration:"10 min", focus:"Recovery",   done:false, desc:"Each return from distraction strengthens focus muscle."},
      {day:3,  title:"Sensory Gate",        duration:"12 min", focus:"Senses",     done:false, desc:"Gate perception to one sense — sharpen the signal."},
      {day:4,  title:"Time Dilation",       duration:"15 min", focus:"Duration",   done:false, desc:"Extend sits to deepen concentration capacity."},
      {day:5,  title:"Noting Practice",     duration:"12 min", focus:"Labelling",  done:false, desc:"Mental noting technique to stabilize the wandering mind."},
      {day:6,  title:"Jhana Touch",         duration:"15 min", focus:"Absorption", done:false, desc:"First taste of meditative absorption — deep calm."},
      {day:7,  title:"Flow State Entry",    duration:"20 min", focus:"Flow",       done:false, desc:"Conditions for entering cognitive flow through stillness."},
    ]
  },
  {
    id: "anxiety-pack",
    title: "Anxiety Relief",
    subtitle: "Clinical-Grade Calm",
    days: 10,
    badge: "ANXIETY",
    badgeColor: "#60a5fa",
    icon: "🫁",
    description: "Clinically validated techniques. Combines MBSR, CBT, and somatic methods for anxiety and panic.",
    sessions: [
      {day:1,  title:"Physiological Sigh",  duration:"5 min",  focus:"Nervous System", done:false, desc:"Double-inhale through nose, slow exhale. Fastest cortisol drop."},
      {day:2,  title:"Box Breathing 4-4-4-4",duration:"8 min", focus:"Regulation",     done:false, desc:"Navy SEAL technique for immediate calm under stress."},
      {day:3,  title:"5-4-3-2-1 Grounding", duration:"6 min",  focus:"Grounding",      done:false, desc:"Sensory grounding to stop a panic spiral."},
      {day:4,  title:"RAIN Technique",       duration:"10 min", focus:"Emotion",        done:false, desc:"Recognize, Allow, Investigate, Nurture — anxiety antidote."},
      {day:5,  title:"Vagus Nerve Hum",      duration:"7 min",  focus:"Vagal Tone",     done:false, desc:"Humming activates vagus nerve to shut off fight-or-flight."},
      {day:6,  title:"Worry Window",         duration:"8 min",  focus:"CBT",            done:false, desc:"Schedule worry to contain it — CBT gold standard."},
      {day:7,  title:"Safe Place Viz",       duration:"12 min", focus:"Imagery",        done:false, desc:"Build a neural safe space you can access anywhere."},
    ]
  },
  {
    id: "depression-pack",
    title: "Mood Lift",
    subtitle: "Depression Support",
    days: 14,
    badge: "DEPRESSION",
    badgeColor: "#a78bfa",
    icon: "🌅",
    description: "Behavioral activation + mindfulness. Evidence-based approach combining MBCT and positive neuroplasticity.",
    sessions: [
      {day:1,  title:"Morning Activation",  duration:"8 min",  focus:"Activation",  done:false, desc:"Behavioral activation to break the inertia of low mood."},
      {day:2,  title:"Pleasure Mapping",    duration:"10 min", focus:"Reward",      done:false, desc:"Reconnect with activities that generate genuine pleasure."},
      {day:3,  title:"Self-Compassion Sit", duration:"12 min", focus:"Kindness",    done:false, desc:"Treat yourself as you would a suffering friend."},
      {day:4,  title:"Energy Breath",       duration:"7 min",  focus:"Vitality",    done:false, desc:"Kapalabhati pranayama — breathwork to boost energy."},
      {day:5,  title:"Negative to Neutral", duration:"10 min", focus:"Reframe",     done:false, desc:"MBCT technique: observe depression thoughts without fusion."},
      {day:6,  title:"Small Wins Log",      duration:"6 min",  focus:"Progress",    done:false, desc:"Rebuild self-efficacy by documenting tiny wins daily."},
      {day:7,  title:"Future Self Letter",  duration:"15 min", focus:"Hope",        done:false, desc:"Write to your future self — activates prospection circuits."},
    ]
  },
];

/* ── CBT THOUGHT RECORDS ── */
const DISTORTIONS = [
  "All-or-Nothing","Catastrophizing","Mind Reading","Fortune Telling",
  "Emotional Reasoning","Should Statements","Personalization","Overgeneralization",
  "Mental Filter","Discounting Positives","Labelling","Magnification",
];

const CBT_EXERCISES = [
  {
    id:"thought-record",
    title:"Thought Record",
    icon:"📋",
    desc:"Identify & challenge automatic negative thoughts",
    steps:["Situation","Automatic Thought","Emotions (0–100%)","Cognitive Distortions","Evidence FOR","Evidence AGAINST","Balanced Thought","Outcome Emotions"],
  },
  {
    id:"behavioral-experiment",
    title:"Behavioral Experiment",
    icon:"🔬",
    desc:"Test anxious predictions against reality",
    steps:["Prediction","Fear Rating","Action Plan","Actual Outcome","What Learned"],
  },
  {
    id:"worry-time",
    title:"Scheduled Worry",
    icon:"⏰",
    desc:"Contain worry to 15 min daily — proven to cut anxiety 40%",
    steps:["Worry Topic","Postpone Until","Productive Action Now","Worry Resolved?"],
  },
  {
    id:"activity-scheduling",
    title:"Activity Scheduling",
    icon:"📅",
    desc:"Behavioral activation for depression — plan mastery + pleasure",
    steps:["Activity","Mastery Rating","Pleasure Rating","Scheduled Time","Completed?"],
  },
];

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════════════════════ */
const Card = ({children, style={}, className=""}) => (
  <div className={`mh-card-h ${className}`} style={{background:CARD,border:`1px solid ${BOR}`,padding:18,...style}}>
    {children}
  </div>
);

const Label = ({children, color=MUTED}) => (
  <div style={{fontSize:7,letterSpacing:".2em",color,textTransform:"uppercase",marginBottom:6}}>
    {children}
  </div>
);

const Badge = ({children, color=GOLD}) => (
  <span style={{
    fontSize:6,letterSpacing:".16em",padding:"2px 7px",
    background:`${color}22`,color,border:`1px solid ${color}44`,
    textTransform:"uppercase",fontFamily:FONT,
  }}>{children}</span>
);

/* ════════════════════════════════════════════════════════════
   MEDITATION TIMER COMPONENT
════════════════════════════════════════════════════════════ */
function MeditationTimer({session, onClose, onComplete}) {
  const [phase, setPhase]     = useState("ready"); // ready | running | paused | done
  const [elapsed, setElapsed] = useState(0);
  const totalSec = parseInt(session.duration) * 60;
  const timerRef = useRef(null);

  const start = () => {
    setPhase("running");
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalSec) {
          clearInterval(timerRef.current);
          setPhase("done");
          return totalSec;
        }
        return e + 1;
      });
    }, 1000);
  };

  const pause = () => {
    clearInterval(timerRef.current);
    setPhase("paused");
  };

  const resume = () => {
    setPhase("running");
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalSec) { clearInterval(timerRef.current); setPhase("done"); return totalSec; }
        return e + 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const remaining = totalSec - elapsed;
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const pct  = elapsed / totalSec;
  const r    = 72;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);

  return (
    <div style={{
      position:"fixed",inset:0,background:"#040404f0",zIndex:100,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      gap:20,padding:24,
    }}>
      {/* Session info */}
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:HEAD,fontSize:28,color:GOLD,letterSpacing:".06em"}}>{session.title}</div>
        <div style={{fontSize:8,color:SUB,letterSpacing:".16em",textTransform:"uppercase",marginTop:4}}>{session.focus} · {session.duration}</div>
      </div>

      {/* Ring timer */}
      <div style={{position:"relative",width:180,height:180}}>
        {phase==="running" && (
          <div style={{
            position:"absolute",inset:-20,borderRadius:"50%",
            border:`1px solid ${GOLD}22`,
            animation:"mh-ring 2.5s ease-out infinite",
          }}/>
        )}
        <svg width={180} height={180} style={{transform:"rotate(-90deg)"}}>
          <circle cx={90} cy={90} r={r} fill="none" stroke={BOR} strokeWidth={6}/>
          <circle cx={90} cy={90} r={r} fill="none" stroke={GOLD} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={dash}
            strokeLinecap="round" style={{transition:"stroke-dashoffset .9s linear"}}/>
        </svg>
        <div style={{
          position:"absolute",inset:0,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",
        }}>
          {phase==="done" ? (
            <div style={{fontSize:42}}>✨</div>
          ) : (
            <>
              <div style={{fontFamily:HEAD,fontSize:38,color:TEXT,lineHeight:1}}>{mins}:{secs}</div>
              <div style={{fontSize:7,color:MUTED,letterSpacing:".18em",textTransform:"uppercase",marginTop:4}}>
                {phase==="running"?"FOCUS":phase==="paused"?"PAUSED":"READY"}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Breathing guide */}
      {phase==="running" && (
        <div style={{textAlign:"center"}}>
          <div style={{
            width:60,height:60,borderRadius:"50%",margin:"0 auto 10px",
            background:`radial-gradient(circle,${GOLD}33,transparent 70%)`,
            animation:"mh-breathe 8s ease-in-out infinite",
          }}/>
          <div style={{fontSize:8,color:SUB,letterSpacing:".14em",textTransform:"uppercase"}}>
            Breathe with the circle
          </div>
        </div>
      )}

      {phase==="done" && (
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:HEAD,fontSize:22,color:GREEN,marginBottom:6}}>Session Complete ✓</div>
          <div style={{fontSize:9,color:SUB,lineHeight:1.7,maxWidth:280}}>{session.desc}</div>
        </div>
      )}

      {/* Controls */}
      <div style={{display:"flex",gap:10}}>
        {phase==="ready" && (
          <button className="mh-btn" onClick={start} style={{
            padding:"13px 32px",background:GOLD,color:"#080808",
            border:"none",fontFamily:FONT,fontSize:11,fontWeight:700,
            letterSpacing:".18em",textTransform:"uppercase",
          }}>▶ Begin</button>
        )}
        {phase==="running" && (
          <button className="mh-btn" onClick={pause} style={{
            padding:"13px 32px",background:"transparent",color:GOLD,
            border:`1px solid ${GOLD}44`,fontFamily:FONT,fontSize:11,
            letterSpacing:".18em",textTransform:"uppercase",
          }}>⏸ Pause</button>
        )}
        {phase==="paused" && (
          <button className="mh-btn" onClick={resume} style={{
            padding:"13px 32px",background:GOLD,color:"#080808",
            border:"none",fontFamily:FONT,fontSize:11,fontWeight:700,
            letterSpacing:".18em",textTransform:"uppercase",
          }}>▶ Resume</button>
        )}
        {phase==="done" && (
          <button className="mh-btn" onClick={() => { onComplete(session); onClose(); }} style={{
            padding:"13px 32px",background:GREEN,color:"#080808",
            border:"none",fontFamily:FONT,fontSize:11,fontWeight:700,
            letterSpacing:".18em",textTransform:"uppercase",
          }}>✓ Complete Day</button>
        )}
        <button className="mh-btn" onClick={onClose} style={{
          padding:"13px 20px",background:"transparent",color:SUB,
          border:`1px solid ${BOR}`,fontFamily:FONT,fontSize:10,
          letterSpacing:".16em",textTransform:"uppercase",
        }}>✕ Close</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GUIDED MEDITATION TAB
════════════════════════════════════════════════════════════ */
function GuidedMeditationTab() {
  const [programs, setPrograms]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_programs") || "null") || MEDITATION_PROGRAMS; } catch { return MEDITATION_PROGRAMS; }
  });
  const [selected, setSelected]     = useState(null); // program id
  const [timerSess, setTimerSess]   = useState(null);
  const [view, setView]             = useState("list"); // list | detail

  const prog = programs.find(p => p.id === selected);

  const completeSession = useCallback((session) => {
    setPrograms(prev => {
      const updated = prev.map(p => {
        if (p.id !== selected) return p;
        return { ...p, sessions: p.sessions.map(s => s.day === session.day ? {...s, done:true} : s) };
      });
      localStorage.setItem("mh_programs", JSON.stringify(updated));
      return updated;
    });
  }, [selected]);

  const getProgress = (p) => {
    const done = p.sessions.filter(s => s.done).length;
    return { done, total: p.sessions.length, pct: Math.round((done / p.sessions.length) * 100) };
  };

  if (timerSess) return (
    <MeditationTimer
      session={timerSess}
      onClose={() => setTimerSess(null)}
      onComplete={completeSession}
    />
  );

  if (view === "detail" && prog) {
    const { done, total, pct } = getProgress(prog);
    const nextSession = prog.sessions.find(s => !s.done);
    return (
      <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:12,borderBottom:`1px solid ${BOR}`}}>
          <button className="mh-btn" onClick={() => { setView("list"); setSelected(null); }} style={{
            background:"transparent",border:`1px solid ${BOR}`,color:SUB,
            fontFamily:FONT,fontSize:8,letterSpacing:".14em",padding:"6px 12px",textTransform:"uppercase",
          }}>← Back</button>
          <div>
            <div style={{fontFamily:HEAD,fontSize:20,color:TEXT}}>{prog.icon} {prog.title}</div>
            <div style={{fontSize:7,color:SUB,letterSpacing:".12em",textTransform:"uppercase"}}>{prog.subtitle}</div>
          </div>
          <Badge color={prog.badgeColor}>{prog.badge}</Badge>
        </div>

        {/* Progress bar */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <Label>Your Progress</Label>
            <div style={{fontFamily:HEAD,fontSize:20,color:prog.badgeColor}}>{pct}%</div>
          </div>
          <div style={{height:6,background:"#111",borderRadius:3,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${pct}%`,background:prog.badgeColor,borderRadius:3,transition:"width .8s ease"}}/>
          </div>
          <div style={{fontSize:8,color:SUB,letterSpacing:".1em"}}>{done} of {total} sessions completed · {total - done} remaining</div>
        </Card>

        {/* Next up */}
        {nextSession && (
          <div style={{background:`linear-gradient(135deg,#0a0806,#120e04)`,border:`1px solid ${GOLD}33`,padding:18}}>
            <Label color={`${GOLD}88`}>Next Session</Label>
            <div style={{fontFamily:HEAD,fontSize:22,color:GOLD,marginBottom:6}}>Day {nextSession.day}: {nextSession.title}</div>
            <div style={{fontSize:8,color:SUB,lineHeight:1.8,marginBottom:14}}>{nextSession.desc}</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
              <Badge color={GOLD}>{nextSession.duration}</Badge>
              <Badge color={`${GOLD}88`}>{nextSession.focus}</Badge>
            </div>
            <button className="mh-btn" onClick={() => setTimerSess(nextSession)} style={{
              padding:"12px 24px",background:GOLD,color:"#080808",
              border:"none",fontFamily:FONT,fontSize:10,fontWeight:700,
              letterSpacing:".18em",textTransform:"uppercase",
            }}>🧘 Start Session</button>
          </div>
        )}

        {!nextSession && (
          <div style={{border:"1px solid #1e4d1e",background:"#0a140a",padding:18,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>🏆</div>
            <div style={{fontFamily:HEAD,fontSize:22,color:GREEN,marginBottom:6}}>Program Complete!</div>
            <div style={{fontSize:9,color:SUB,lineHeight:1.7}}>You've completed the full {prog.title} program. Well done.</div>
          </div>
        )}

        {/* All sessions */}
        <Label>All Sessions</Label>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {prog.sessions.map(s => (
            <div key={s.day}
              className="mh-card-h"
              onClick={() => !s.done && setTimerSess(s)}
              style={{
                background:s.done ? "#0a140a" : CARD,
                border:`1px solid ${s.done?"#1e4d1e":BOR}`,
                padding:"12px 16px",
                display:"flex",alignItems:"center",gap:12,
                cursor: s.done ? "default" : "pointer",
              }}
            >
              <div style={{
                width:28,height:28,borderRadius:"50%",flexShrink:0,
                background:s.done?`${GREEN}22`:MUTED,
                border:`1px solid ${s.done?GREEN:BOR}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:s.done?14:9,color:s.done?GREEN:SUB,
              }}>
                {s.done ? "✓" : s.day}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:s.done?GREEN:TEXT,letterSpacing:".06em",marginBottom:2}}>{s.title}</div>
                <div style={{fontSize:7,color:SUB,letterSpacing:".1em"}}>{s.focus} · {s.duration}</div>
              </div>
              {!s.done && <div style={{fontSize:9,color:MUTED}}>▶</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Label>Guided Programs — Beats Headspace</Label>
        <Badge color={GOLD}>4 PROGRAMS</Badge>
      </div>

      <div style={{background:`${GOLD}11`,border:`1px solid ${GOLD}22`,padding:"10px 14px",fontSize:8,color:`${GOLD}cc`,lineHeight:1.7,letterSpacing:".06em"}}>
        ✦ 7-day & 21-day programs · Clinical anxiety & depression packs · Timer-guided sessions · Progress tracking
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {programs.map(p => {
          const {done,total,pct} = getProgress(p);
          return (
            <div key={p.id}
              className="mh-card-h"
              onClick={() => { setSelected(p.id); setView("detail"); }}
              style={{
                background:CARD,border:`1px solid ${BOR}`,padding:"16px 18px",cursor:"pointer",
              }}
            >
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <div style={{fontSize:28,flexShrink:0,animation:"mh-float 3s ease-in-out infinite"}}>{p.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{fontFamily:HEAD,fontSize:18,color:TEXT}}>{p.title}</div>
                    <Badge color={p.badgeColor}>{p.badge}</Badge>
                  </div>
                  <div style={{fontSize:7,color:SUB,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>{p.subtitle} · {p.days} Days</div>
                  <div style={{fontSize:8,color:SUB,lineHeight:1.7}}>{p.description}</div>
                </div>
              </div>
              {/* Progress */}
              <div style={{height:3,background:"#111",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${pct}%`,background:p.badgeColor,transition:"width .8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:7,color:MUTED,letterSpacing:".1em"}}>{done}/{total} sessions done</div>
                <div style={{fontSize:8,color:p.badgeColor,fontWeight:700}}>{pct > 0 ? `${pct}% COMPLETE` : "START →"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CBT EXERCISES TAB
════════════════════════════════════════════════════════════ */
function CBTTab() {
  const [activeEx, setActiveEx]   = useState(null);
  const [step,     setStep]       = useState(0);
  const [answers,  setAnswers]    = useState({});
  const [distorts, setDistorts]   = useState([]);
  const [saved,    setSaved]      = useState(false);
  const [history,  setHistory]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_cbt") || "[]"); } catch { return []; }
  });
  const [aiReframe, setAiReframe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const ex = CBT_EXERCISES.find(e => e.id === activeEx);

  const saveRecord = useCallback(async () => {
    const record = {
      id: Date.now(),
      exercise: ex.title,
      date: new Date().toDateString(),
      answers,
      distortions: distorts,
    };
    const updated = [record, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("mh_cbt", JSON.stringify(updated));
    setSaved(true);

    // Get AI reframe
    if (answers["Automatic Thought"] || answers["Worry Topic"]) {
      setAiLoading(true);
      const thought = answers["Automatic Thought"] || answers["Worry Topic"] || "";
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            model:"claude-sonnet-4-20250514",
            max_tokens:1000,
            messages:[{
              role:"user",
              content:`You are a CBT therapist. A client has the automatic thought: "${thought}". ${distorts.length ? `They identified these cognitive distortions: ${distorts.join(", ")}.` : ""} Provide a compassionate, evidence-based balanced reframe in 2-3 sentences. Be warm, practical, and specific.`
            }]
          })
        });
        const data = await resp.json();
        const reframe = data.content?.find(c => c.type==="text")?.text || "";
        setAiReframe(reframe);
      } catch(e) {
        setAiReframe("Great work completing this exercise. Challenging negative thoughts takes courage — you're building real cognitive resilience.");
      }
      setAiLoading(false);
    }
  }, [ex, answers, distorts, history]);

  if (!activeEx) return (
    <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Label>CBT Thought Restructuring</Label>
        <Badge color="#60a5fa">BEATS BETTERHELP</Badge>
      </div>

      <div style={{background:"#0a0d14",border:"1px solid #1a2030",padding:"10px 14px",fontSize:8,color:"#8ab4f8",lineHeight:1.7,letterSpacing:".06em"}}>
        ✦ Evidence-based cognitive restructuring · AI-powered reframes · Track your thought patterns over time
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {CBT_EXERCISES.map(e => (
          <button key={e.id} className="mh-btn mh-card-h" onClick={() => { setActiveEx(e.id); setStep(0); setAnswers({}); setDistorts([]); setSaved(false); setAiReframe(""); }} style={{
            background:CARD,border:`1px solid ${BOR}`,padding:"16px 14px",
            textAlign:"left",display:"flex",flexDirection:"column",gap:6,
          }}>
            <div style={{fontSize:26}}>{e.icon}</div>
            <div style={{fontFamily:HEAD,fontSize:14,color:TEXT}}>{e.title}</div>
            <div style={{fontSize:7,color:SUB,lineHeight:1.7,letterSpacing:".04em"}}>{e.desc}</div>
            <div style={{fontSize:7,color:MUTED,letterSpacing:".12em",marginTop:4}}>{e.steps.length} STEPS →</div>
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <>
          <Label>Recent Records</Label>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {history.slice(0,4).map(r => (
              <div key={r.id} style={{background:CARD,border:`1px solid ${BOR}`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:9,color:TEXT,marginBottom:2}}>{r.exercise}</div>
                  <div style={{fontSize:7,color:MUTED,letterSpacing:".1em"}}>{r.date}</div>
                </div>
                <Badge color="#60a5fa">DONE</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const currentStep = ex.steps[step];
  const isDistortStep = currentStep === "Cognitive Distortions";

  return (
    <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:12,borderBottom:`1px solid ${BOR}`}}>
        <button className="mh-btn" onClick={() => setActiveEx(null)} style={{
          background:"transparent",border:`1px solid ${BOR}`,color:SUB,
          fontFamily:FONT,fontSize:8,letterSpacing:".14em",padding:"6px 12px",textTransform:"uppercase",
        }}>← Back</button>
        <div>
          <div style={{fontFamily:HEAD,fontSize:18,color:TEXT}}>{ex.icon} {ex.title}</div>
          <div style={{fontSize:7,color:SUB,letterSpacing:".12em",textTransform:"uppercase"}}>Step {step+1} of {ex.steps.length}</div>
        </div>
      </div>

      {/* Step progress */}
      <div style={{display:"flex",gap:4}}>
        {ex.steps.map((_,i) => (
          <div key={i} style={{flex:1,height:3,background:i<=step?GOLD:BOR,borderRadius:2,transition:"background .3s"}}/>
        ))}
      </div>

      {/* Current step */}
      {!saved ? (
        <Card>
          <Label>{currentStep}</Label>
          {isDistortStep ? (
            <>
              <div style={{fontSize:8,color:SUB,marginBottom:10,lineHeight:1.7}}>Select all distortions you notice in your thought:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {DISTORTIONS.map(d => (
                  <button key={d} className="mh-btn" onClick={() => setDistorts(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d])} style={{
                    padding:"5px 10px",fontSize:7,letterSpacing:".1em",
                    background:distorts.includes(d)?`${GOLD}22`:CARD,
                    border:`1px solid ${distorts.includes(d)?GOLD:BOR}`,
                    color:distorts.includes(d)?GOLD:SUB,fontFamily:FONT,textTransform:"uppercase",
                  }}>{d}</button>
                ))}
              </div>
            </>
          ) : (
            <textarea
              value={answers[currentStep]||""}
              onChange={e => setAnswers(a => ({...a,[currentStep]:e.target.value}))}
              placeholder={`Write your ${currentStep.toLowerCase()}...`}
              rows={4}
              style={{
                width:"100%",background:"#070707",border:`1px solid ${BOR}`,
                color:TEXT,fontFamily:FONT,fontSize:11,letterSpacing:".04em",
                padding:"10px 12px",outline:"none",resize:"vertical",lineHeight:1.8,
              }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Label color={GREEN}>Record Saved ✓</Label>
          <div style={{fontFamily:HEAD,fontSize:18,color:GREEN,marginBottom:10}}>Great work!</div>
          {aiLoading ? (
            <div style={{fontSize:9,color:MUTED,animation:"mh-blink .8s infinite",letterSpacing:".12em",textTransform:"uppercase"}}>
              AI generating reframe...
            </div>
          ) : aiReframe ? (
            <>
              <Label color={`${GOLD}88`}>AI Balanced Reframe</Label>
              <div style={{fontSize:10,color:TEXT,lineHeight:1.9,background:`${GOLD}08`,border:`1px solid ${GOLD}22`,padding:"12px 14px"}}>
                {aiReframe}
              </div>
            </>
          ) : null}
        </Card>
      )}

      {/* Navigation */}
      {!saved && (
        <div style={{display:"flex",gap:10}}>
          {step > 0 && (
            <button className="mh-btn" onClick={() => setStep(s=>s-1)} style={{
              flex:1,padding:"12px 0",background:"transparent",border:`1px solid ${BOR}`,
              color:SUB,fontFamily:FONT,fontSize:9,letterSpacing:".16em",textTransform:"uppercase",
            }}>← Previous</button>
          )}
          {step < ex.steps.length - 1 ? (
            <button className="mh-btn" onClick={() => setStep(s=>s+1)} style={{
              flex:2,padding:"12px 0",background:GOLD,color:"#080808",
              border:"none",fontFamily:FONT,fontSize:9,fontWeight:700,
              letterSpacing:".16em",textTransform:"uppercase",
            }}>Next Step →</button>
          ) : (
            <button className="mh-btn" onClick={saveRecord} style={{
              flex:2,padding:"12px 0",background:GREEN,color:"#080808",
              border:"none",fontFamily:FONT,fontSize:9,fontWeight:700,
              letterSpacing:".16em",textTransform:"uppercase",
            }}>✓ Save Record</button>
          )}
        </div>
      )}

      {saved && (
        <button className="mh-btn" onClick={() => { setActiveEx(null); }} style={{
          width:"100%",padding:"12px 0",background:"transparent",border:`1px solid ${BOR}`,
          color:SUB,fontFamily:FONT,fontSize:9,letterSpacing:".16em",textTransform:"uppercase",
        }}>← Back to Exercises</button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MOOD JOURNAL TAB (enhanced with emotional check-in)
════════════════════════════════════════════════════════════ */
function MoodJournalTab() {
  const [moodLog,  setMoodLog]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_moods2") || "[]"); } catch { return []; }
  });
  const [selMood,  setSelMood]  = useState(null);
  const [note,     setNote]     = useState("");
  const [saved,    setSaved]    = useState(false);
  const [emotions, setEmotions] = useState([]);
  const [energy,   setEnergy]   = useState(5);
  const [aiInsight,setAiInsight]= useState("");
  const [aiLoading,setAiLoading]= useState(false);

  const MOODS = [
    {emoji:"😭",label:"Terrible",score:1}, {emoji:"😢",label:"Sad",score:2},
    {emoji:"😕",label:"Low",score:3},      {emoji:"😐",label:"Meh",score:5},
    {emoji:"🙂",label:"Okay",score:6},     {emoji:"😊",label:"Good",score:7},
    {emoji:"😄",label:"Happy",score:8},    {emoji:"🤩",label:"Great",score:10},
  ];

  const EMOTION_CHIPS = [
    "Anxious","Calm","Grateful","Overwhelmed","Hopeful","Lonely",
    "Focused","Irritable","Content","Sad","Excited","Numb",
    "Confident","Stressed","Peaceful","Angry",
  ];

  const logMood = useCallback(async () => {
    if (!selMood) return;
    const entry = {
      id: Date.now(),
      date: new Date().toDateString(),
      time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      score: selMood.score, emoji: selMood.emoji, label: selMood.label,
      note, emotions, energy,
    };
    const updated = [entry, ...moodLog].slice(0,60);
    setMoodLog(updated);
    localStorage.setItem("mh_moods2", JSON.stringify(updated));
    setSaved(true);

    // AI insight
    setAiLoading(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:`You are a compassionate mental health coach. Someone just logged their mood: ${selMood.label} (${selMood.score}/10). Emotions: ${emotions.join(", ") || "not specified"}. Energy: ${energy}/10. ${note ? `Note: "${note}"` : ""}. Give a warm, specific 2-sentence insight and one practical micro-action they can do right now. Be real, not generic.`
          }]
        })
      });
      const data = await resp.json();
      const insight = data.content?.find(c=>c.type==="text")?.text || "";
      setAiInsight(insight);
    } catch {
      setAiInsight("Thank you for checking in. Awareness of your emotional state is itself a powerful act of self-care.");
    }
    setAiLoading(false);
    setNote(""); setEmotions([]); setSelMood(null); setEnergy(5);
  }, [selMood, note, emotions, energy, moodLog]);

  const weekMoods   = moodLog.slice(0, 7);
  const avgScore    = weekMoods.length ? (weekMoods.reduce((a,m)=>a+m.score,0)/weekMoods.length).toFixed(1) : "—";
  const mhScore     = weekMoods.length ? Math.min(100, Math.round((Number(avgScore)/10)*70 + weekMoods.length*4)) : 0;
  const todayDone   = moodLog.some(m => m.date === new Date().toDateString());
  const mhColor     = mhScore >= 70 ? GREEN : mhScore >= 50 ? GOLD : RED;

  return (
    <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Label>Mood Journal + Emotional Check-In</Label>
        <Badge color="#f87171">BEATS BETTERHELP</Badge>
      </div>

      {todayDone && saved && (
        <div style={{border:`1px solid #1e4d1e`,background:"#0a140a",padding:"10px 14px",fontSize:9,color:GREEN,letterSpacing:".12em",textTransform:"uppercase"}}>
          ✓ Check-in logged · See your insight below
        </div>
      )}

      {/* AI Insight after save */}
      {saved && (aiLoading ? (
        <div style={{background:`${GOLD}08`,border:`1px solid ${GOLD}22`,padding:"14px 16px",fontSize:9,color:MUTED,letterSpacing:".12em",animation:"mh-blink .8s infinite"}}>
          AI analysing your mood pattern...
        </div>
      ) : aiInsight ? (
        <div style={{background:`${GOLD}08`,border:`1px solid ${GOLD}33`,padding:"14px 16px"}}>
          <Label color={`${GOLD}88`}>AI Insight For You</Label>
          <div style={{fontSize:10,color:TEXT,lineHeight:1.9}}>{aiInsight}</div>
        </div>
      ) : null)}

      {/* Mood selector */}
      <Card>
        <Label>How are you feeling right now?</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {MOODS.map(m => (
            <button key={m.label} className="mh-btn" onClick={() => { setSelMood(m); setSaved(false); setAiInsight(""); }} style={{
              padding:"10px 4px",
              background: selMood?.label===m.label ? `${GOLD}22` : "#0a0a0a",
              border: `1px solid ${selMood?.label===m.label?GOLD:BOR}`,
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            }}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <span style={{fontSize:6,letterSpacing:".1em",color:selMood?.label===m.label?GOLD:MUTED,textTransform:"uppercase"}}>{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Emotions */}
      <Card>
        <Label>Which emotions are present? (multi-select)</Label>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {EMOTION_CHIPS.map(e => (
            <button key={e} className="mh-btn" onClick={() => setEmotions(prev => prev.includes(e) ? prev.filter(x=>x!==e) : [...prev,e])} style={{
              padding:"4px 10px",fontSize:7,letterSpacing:".1em",
              background:emotions.includes(e)?`${GOLD}22`:CARD,
              border:`1px solid ${emotions.includes(e)?GOLD:BOR}`,
              color:emotions.includes(e)?GOLD:SUB,fontFamily:FONT,textTransform:"uppercase",
            }}>{e}</button>
          ))}
        </div>
      </Card>

      {/* Energy slider */}
      <Card>
        <Label>Energy Level: {energy}/10</Label>
        <input type="range" min={1} max={10} value={energy}
          onChange={e => setEnergy(Number(e.target.value))}
          style={{width:"100%",accentColor:GOLD,cursor:"pointer"}}
        />
        <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:MUTED,letterSpacing:".1em",marginTop:4}}>
          <span>DEPLETED</span><span>VIBRANT</span>
        </div>
      </Card>

      {/* Note */}
      <div>
        <Label>What&apos;s on your mind? (optional)</Label>
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Write freely. This is your safe space..."
          rows={3}
          style={{width:"100%",background:CARD,border:`1px solid ${BOR}`,color:TEXT,fontFamily:FONT,fontSize:11,letterSpacing:".06em",padding:"10px 12px",outline:"none",resize:"vertical",lineHeight:1.8}}
        />
      </div>

      <button className="mh-btn" onClick={logMood} disabled={!selMood} style={{
        width:"100%",padding:"14px 0",
        background: selMood ? GOLD : "#111",
        color: selMood ? "#080808" : MUTED,
        border: selMood ? "none" : `1px solid ${BOR}`,
        fontFamily:FONT,fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
      }}>
        {saved ? "✓ Logged — Log Another" : "Log Mood + Get AI Insight"}
      </button>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {label:"7-Day Avg",  value:avgScore},
          {label:"Days Tracked",value:moodLog.length},
          {label:"MH Score",  value:mhScore>0?`${mhScore}/100`:"—"},
        ].map(({label,value}) => (
          <div key={label} style={{background:CARD,border:`1px solid ${BOR}`,padding:"12px 14px"}}>
            <Label>{label}</Label>
            <div style={{fontFamily:HEAD,fontSize:26,color:GOLD}}>{value}</div>
          </div>
        ))}
      </div>

      {/* 7-day chart */}
      {weekMoods.length > 0 && (
        <Card>
          <Label>7-Day Mood Chart</Label>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
            {[...weekMoods].reverse().map((m,i) => (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:7,color:SUB}}>{m.score}</div>
                <div style={{
                  width:"100%",height:`${(m.score/10)*60}px`,borderRadius:"2px 2px 0 0",
                  background:m.score>=7?GREEN:m.score>=5?GOLD:RED,transition:"height .5s",
                }}/>
                <div style={{fontSize:14}}>{m.emoji}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History */}
      {moodLog.length > 0 && (
        <Card>
          <Label>Recent Check-Ins</Label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {moodLog.slice(0,5).map((m,i) => (
              <div key={m.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:`1px solid #111`,paddingBottom:8}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{fontSize:20}}>{m.emoji}</span>
                  <div>
                    <div style={{fontSize:9,color:TEXT,marginBottom:2}}>{m.label} · E:{m.energy||"—"}/10</div>
                    <div style={{fontSize:7,color:MUTED}}>{m.date} {m.time}</div>
                    {m.emotions?.length > 0 && (
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
                        {m.emotions.slice(0,3).map(e => (
                          <span key={e} style={{fontSize:6,color:SUB,border:`1px solid ${BOR}`,padding:"1px 5px",letterSpacing:".08em"}}>{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{fontFamily:HEAD,fontSize:24,color:m.score>=7?GREEN:m.score>=5?GOLD:RED}}>{m.score}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI THERAPY TAB
════════════════════════════════════════════════════════════ */
function AITherapyTab() {
  const [chat,    setChat]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_chat2") || "[]"); } catch { return []; }
  });
  const [msg,     setMsg]     = useState("");
  const [aiLoad,  setAiLoad]  = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({top:9999,behavior:"smooth"});
  }, [chat]);

  const sendMsg = useCallback(async () => {
    if (!msg.trim() || aiLoad) return;
    const userMsg = {role:"user", content:msg};
    const newChat = [...chat, userMsg];
    setChat(newChat); setMsg(""); setAiLoad(true);

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:"You are ManifiX AI Therapist — an empathetic, evidence-based mental health support assistant. Use CBT, ACT, and mindfulness techniques. Be warm, specific, and practical. Responses 60-100 words max. Never diagnose. Encourage professional help for serious concerns.",
          messages: newChat.map(m => ({role:m.role, content:m.content})),
        })
      });
      const data = await resp.json();
      const reply = data.content?.find(c=>c.type==="text")?.text || "I'm here with you. Please try again.";
      const final = [...newChat, {role:"assistant", content:reply}];
      setChat(final);
      localStorage.setItem("mh_chat2", JSON.stringify(final.slice(-20)));
    } catch {
      setChat([...newChat, {role:"assistant", content:"I'm here to support you. There was a connection issue — please try again."}]);
    }
    setAiLoad(false);
  }, [msg, chat, aiLoad]);

  return (
    <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
      <Card>
        <Label>ManifiX AI Therapist</Label>
        <div style={{fontSize:9,color:SUB,lineHeight:1.7}}>
          Available 24/7 · Empathetic · Evidence-based (CBT + ACT + Mindfulness) · Real AI
        </div>
      </Card>

      <div ref={chatRef} style={{
        height:340,overflowY:"auto",
        border:`1px solid ${BOR}`,background:"#070707",
        padding:14,display:"flex",flexDirection:"column",gap:10,
      }}>
        {chat.length === 0 && (
          <div style={{margin:"auto",textAlign:"center",color:MUTED,fontSize:9,letterSpacing:".12em",textTransform:"uppercase",lineHeight:2.5}}>
            <div style={{fontSize:40,marginBottom:12,animation:"mh-float 3s ease-in-out infinite"}}>🧠</div>
            I am here to listen and support you.<br/>
            Share what&apos;s on your mind.
          </div>
        )}
        {chat.map((m,i) => (
          <div key={i} style={{
            alignSelf: m.role==="user" ? "flex-end" : "flex-start",
            maxWidth:"86%",
            background: m.role==="user" ? `${GOLD}18` : "#0f0f0f",
            border:`1px solid ${m.role==="user"?`${GOLD}33`:BOR}`,
            padding:"10px 13px",
          }}>
            <div style={{fontSize:10,color:m.role==="user"?GOLD:TEXT,lineHeight:1.8}}>
              {m.content}
            </div>
          </div>
        ))}
        {aiLoad && (
          <div style={{alignSelf:"flex-start",background:"#0f0f0f",border:`1px solid ${BOR}`,padding:"10px 13px",display:"flex",gap:4,alignItems:"center"}}>
            {[0,1,2].map(i => (
              <div key={i} style={{width:6,height:6,borderRadius:"50%",background:GOLD,animation:`mh-blink .8s ${i*.2}s infinite`}}/>
            ))}
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8}}>
        <input value={msg} onChange={e=>setMsg(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&sendMsg()}
          placeholder="How are you feeling? What's bothering you?"
          style={{flex:1,background:CARD,border:`1px solid ${BOR}`,color:TEXT,fontFamily:FONT,fontSize:11,padding:"11px 14px",outline:"none"}}
        />
        <button className="mh-btn" onClick={sendMsg} disabled={aiLoad} style={{
          padding:"11px 18px",background:aiLoad?"#222":GOLD,color:"#080808",
          border:"none",fontFamily:FONT,fontSize:14,fontWeight:700,
        }}>→</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {["I feel anxious","I can't sleep","I feel overwhelmed","I need motivation","I'm struggling"].map(p => (
          <button key={p} className="mh-btn" onClick={() => setMsg(p)} style={{
            fontSize:7,letterSpacing:".1em",padding:"5px 10px",
            background:"transparent",border:`1px solid ${BOR}`,
            color:MUTED,fontFamily:FONT,textTransform:"uppercase",
          }}>{p}</button>
        ))}
      </div>

      {chat.length > 0 && (
        <button className="mh-btn" onClick={() => {setChat([]);localStorage.removeItem("mh_chat2");}} style={{
          background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
          fontSize:8,letterSpacing:".14em",padding:"8px 0",textTransform:"uppercase",width:"100%",
        }}>↺ Clear Chat</button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function MentalHealth() {
  const [tipIdx, setTipIdx] = useState(0);
  const [tab,    setTab]    = useState("overview");
  const tipRef = useRef(null);

  // Calculate MH score from mood data
  const moodLog = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("mh_moods2") || "[]"); } catch { return []; }
  }, [tab]);
  const weekMoods = moodLog.slice(0,7);
  const avgScore  = weekMoods.length ? (weekMoods.reduce((a,m)=>a+m.score,0)/weekMoods.length).toFixed(1) : null;
  const mhScore   = avgScore ? Math.min(100,Math.round((Number(avgScore)/10)*70+weekMoods.length*4)) : 0;
  const mhColor   = mhScore>=70?GREEN:mhScore>=50?GOLD:RED;

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    tipRef.current = setInterval(() => setTipIdx(i => (i+1)%TIPS.length), 4200);
    return () => clearInterval(tipRef.current);
  }, []);

  const TABS = [
    {id:"overview",   label:"Overview"},
    {id:"meditation", label:"Meditate"},
    {id:"mood",       label:"Mood Log"},
    {id:"cbt",        label:"CBT"},
    {id:"therapy",    label:"AI Therapy"},
  ];

  return (
    <div style={{
      minHeight:"100dvh",background:BG,color:TEXT,fontFamily:FONT,
      display:"flex",flexDirection:"column",alignItems:"center",
      overflow:"hidden",position:"relative",
    }}>

      {/* BG grid */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",
        backgroundImage:`linear-gradient(${GRID_C} 1px,transparent 1px),linear-gradient(90deg,${GRID_C} 1px,transparent 1px)`,
        backgroundSize:"44px 44px",
      }}/>

      {/* Ambient glow */}
      <div style={{
        position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",
        width:440,height:220,
        background:`radial-gradient(ellipse,${GOLD}08 0%,transparent 70%)`,
        animation:"mh-pulse 5s ease-in-out infinite",pointerEvents:"none",
      }}/>

      {/* Corners */}
      {[
        {top:13,left:13,  borderTopWidth:2,borderLeftWidth:2},
        {top:13,right:13, borderTopWidth:2,borderRightWidth:2},
        {bottom:13,left:13, borderBottomWidth:2,borderLeftWidth:2},
        {bottom:13,right:13,borderBottomWidth:2,borderRightWidth:2},
      ].map((pos,i) => (
        <div key={i} style={{position:"fixed",width:20,height:20,borderColor:GOLD,borderStyle:"solid",borderWidth:0,opacity:.18,pointerEvents:"none",...pos}}/>
      ))}

      {/* WHO TICKER */}
      <div style={{width:"100%",overflow:"hidden",whiteSpace:"nowrap",borderBottom:`1px solid ${BOR}`,padding:"5px 0",background:"#050505",flexShrink:0}}>
        <span style={{display:"inline-block",animation:"mh-tick 55s linear infinite",fontSize:7,letterSpacing:".1em",color:"#1a1a1a",textTransform:"uppercase"}}>
          {(TICKER_TEXT+"   ·   "+TICKER_TEXT)}
        </span>
      </div>

      {/* SCAN LINE */}
      <div style={{position:"fixed",left:0,right:0,height:2,zIndex:5,background:`linear-gradient(90deg,transparent,${GOLD}22,${GOLD}55,${GOLD}22,transparent)`,animation:"mh-scan 5s linear infinite",pointerEvents:"none"}}/>

      {/* MAIN WRAPPER */}
      <div style={{
        position:"relative",zIndex:2,width:"min(480px,96vw)",
        display:"flex",flexDirection:"column",gap:10,
        paddingTop:16,paddingBottom:60,
      }}>

        {/* ─── HEADER ─── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:12,borderBottom:`1px solid ${BOR}`}}>
          <div>
            <div style={{fontFamily:HEAD,fontSize:32,letterSpacing:".04em",lineHeight:1,color:TEXT}}>
              🧠 MENTAL HEALTH
            </div>
            <div style={{fontSize:7,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginTop:3}}>
              AI Therapy · Mood Journal · Guided Meditation · CBT
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {mhScore > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:7,letterSpacing:".15em",color:MUTED,textTransform:"uppercase"}}>MH Score</div>
                <div style={{fontFamily:HEAD,fontSize:22,color:mhColor}}>{mhScore}/100</div>
              </div>
            )}
            <button className="mh-btn" onClick={() => {
              // navigate back — works in both standalone and react-router contexts
              if (window.history.length > 1) window.history.back();
            }} style={{
              background:"transparent",border:`1px solid ${BOR}`,color:"#333",fontFamily:FONT,
              fontSize:8,letterSpacing:".14em",padding:"7px 12px",textTransform:"uppercase",
            }}>← Back</button>
          </div>
        </div>

        {/* ─── LIVE TIP ─── */}
        <div style={{background:GOLD,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:16,flexShrink:0}}>💡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:7,letterSpacing:".18em",color:"#80600a",textTransform:"uppercase",marginBottom:3}}>AI Wellness Insight</div>
            <div style={{fontSize:11,fontFamily:HEAD,letterSpacing:".04em",color:"#080808"}}>{TIPS[tipIdx]}</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            {TIPS.map((_,i) => (
              <div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===tipIdx?"#080808":"#c8a84b",transition:"all .3s"}}/>
            ))}
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${BOR}`,overflowX:"auto"}}>
          {TABS.map(t => (
            <button key={t.id} className="mh-btn" onClick={() => setTab(t.id)} style={{
              flexShrink:0,padding:"10px 12px",background:"transparent",
              border:"none",borderBottom:`2px solid ${tab===t.id?GOLD:"transparent"}`,
              color:tab===t.id?GOLD:MUTED,fontFamily:FONT,fontSize:7,
              letterSpacing:".15em",textTransform:"uppercase",transition:"all .2s",
              whiteSpace:"nowrap",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══════ OVERVIEW ═══════ */}
        {tab==="overview" && (
          <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Hero */}
            <div style={{background:`linear-gradient(135deg,#0a0806,#120e04,#1e1808)`,border:`1px solid ${GOLD}18`,padding:24,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-60,top:-60,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${GOLD}08,transparent 70%)`}}/>
              <div style={{position:"absolute",left:20,bottom:20,width:40,height:40,border:`1px solid ${GOLD}10`,transform:"rotate(45deg)"}}/>
              <Label>WHO Mental Health Crisis · 2024</Label>
              <div style={{fontFamily:HEAD,fontSize:40,lineHeight:1,marginBottom:12,color:TEXT}}>
                970M<span style={{color:GOLD}}> PEOPLE</span>
                <br/><span style={{fontSize:26,color:`${GOLD}90`}}>NEED SUPPORT</span>
              </div>
              <div style={{fontSize:10,lineHeight:1.8,color:SUB,maxWidth:380,marginBottom:18}}>
                ManifiX delivers 7-day & 21-day guided meditation programs, clinical CBT tools, AI therapy, mood journaling — all in one offline-first platform.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button className="mh-btn" onClick={() => setTab("meditation")} style={{
                  background:GOLD,color:"#080808",border:"none",padding:"13px 20px",
                  fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
                }}>🧘 Start Meditating</button>
                <button className="mh-btn" onClick={() => setTab("cbt")} style={{
                  background:"transparent",border:`1px solid ${BOR}`,color:SUB,padding:"13px 20px",
                  fontFamily:FONT,fontSize:10,letterSpacing:".18em",textTransform:"uppercase",
                }}>📋 CBT Exercises</button>
              </div>
            </div>

            {/* Competitor comparison */}
            <div>
              <Label>How ManifiX Beats the Competition</Label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {app:"Headspace",   feature:"7-day & 21-day programs",  badge:"MEDITATION",  color:GREEN,   tab:"meditation"},
                  {app:"BetterHelp",  feature:"Mood journal + AI insights",badge:"MOOD JOURNAL",color:"#f87171",tab:"mood"},
                  {app:"BetterHelp",  feature:"CBT thought restructuring", badge:"CBT",          color:"#60a5fa",tab:"cbt"},
                  {app:"Calm",        feature:"Anxiety & depression packs", badge:"THERAPY PACKS",color:"#a78bfa",tab:"meditation"},
                ].map((c,i) => (
                  <button key={i} className="mh-btn mh-card-h" onClick={() => setTab(c.tab)} style={{
                    background:CARD,border:`1px solid ${BOR}`,padding:"12px 16px",
                    display:"flex",alignItems:"center",gap:12,textAlign:"left",
                  }}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <Badge color={c.color}>{c.badge}</Badge>
                        <span style={{fontSize:7,color:MUTED,letterSpacing:".1em",textTransform:"uppercase"}}>beats {c.app}</span>
                      </div>
                      <div style={{fontSize:10,color:TEXT,letterSpacing:".04em"}}>{c.feature}</div>
                    </div>
                    <div style={{fontSize:12,color:MUTED}}>→</div>
                  </button>
                ))}
              </div>
            </div>

            {/* WHO Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {WHO_STATS.map((s,i) => (
                <div key={i} style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 16px"}}>
                  <div style={{fontFamily:HEAD,fontSize:30,color:GOLD,lineHeight:1,marginBottom:4}}>{s.value}</div>
                  <div style={{fontSize:8,color:SUB,lineHeight:1.6,letterSpacing:".06em"}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ TABS ═══════ */}
        {tab==="meditation" && <GuidedMeditationTab/>}
        {tab==="mood"       && <MoodJournalTab/>}
        {tab==="cbt"        && <CBTTab/>}
        {tab==="therapy"    && <AITherapyTab/>}

        {/* FOOTER */}
        <div style={{textAlign:"center",fontSize:7,letterSpacing:".18em",color:"#1a1a1a",textTransform:"uppercase",paddingTop:6}}>
          ManifiX AI · Mental Health · WHO SDG 3.4 · 20 Languages · Offline-first
        </div>
      </div>
    </div>
  );
}
