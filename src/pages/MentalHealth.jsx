import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD — CORRECT PALETTE
   #ffc83c is the REAL ManifiX gold (not #D4AF37)
════════════════════════════════════════════════════════════ */
const GOLD     = "#ffc83c";
const DIM      = "#c8a84b";
const BG       = "#080808";
const CARD     = "#0c0c0c";   /* was "CARd" — now fixed */
const BOR      = "#1a1a1a";
const FONT     = "'DM Mono','Courier New',monospace";
const HEAD     = "'Bebas Neue',sans-serif";
const TEXT     = "#e8e4d9";
const MUTED    = "#2a2a2a";
const SUB      = "#3a3a3a";
const GRID_C   = "rgba(255,200,60,.025)";

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
    @keyframes mh-up   {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mh-pulse{0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.13;transform:scale(1.06)}}
    @keyframes mh-tick {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes mh-scan {from{top:-2px}to{top:100%}}
    @keyframes mh-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes mh-blink{0%,100%{opacity:1}50%{opacity:.1}}
    @keyframes mh-dot  {0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    .mh-up  {animation:mh-up .45s cubic-bezier(.22,.68,0,1.2) both}
    .mh-btn {cursor:pointer;transition:all .15s}
    .mh-btn:hover{opacity:.88;transform:translateY(-1px)}
    .mh-btn:active{transform:translateY(0)}
    .mh-card-h{transition:border-color .2s}
    .mh-card-h:hover{border-color:#2a2a2a!important}
    ::selection{background:rgba(255,200,60,.2);color:#e8e4d9}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════ */
const MANIFIX_MODULES = [
  {id:"mental",    icon:"🧠",label:"Mental",    stat:"970M affected",   result:"Calm in 30d",   route:"/app/mental"},
  {id:"sleep",     icon:"😴",label:"Sleep",     stat:"45% deprived",    result:"8h deep sleep", route:"/app/sleep"},
  {id:"nutrition", icon:"🍎",label:"Nutrition", stat:"1B obese adults", result:"−8kg in 2mo",   route:"/app/nutrition"},
  {id:"stress",    icon:"😓",label:"Stress",    stat:"67% burned out",  result:"Level 9→3",     route:"/app/stress"},
  {id:"chronic",   icon:"🫀",label:"Chronic",   stat:"422M diabetics",  result:"Risk ↓40%",     route:"/app/chronic"},
  {id:"women",     icon:"👩",label:"Women",     stat:"PCOS · hormones", result:"Symptoms ↓",    route:"/app/women"},
  {id:"elderly",   icon:"👴",label:"Elderly",   stat:"Family health",   result:"Connected daily",route:"/app/elderly"},
  {id:"meds",      icon:"💊",label:"Meds",      stat:"50% non-adherent",result:"0 missed/60d",  route:"/app/medication"},
  {id:"children",  icon:"🧒",label:"Children",  stat:"81% teens inactive",result:"Growth tracked",route:"/app/children"},
  {id:"prevent",   icon:"🏃",label:"Preventive",stat:"SDG 3.8 equity",  result:"Score 45→87",   route:"/app/preventive"},
];

const FEATURES = [
  {icon:"🧘",title:"Magic16 Meditation",   desc:"8 min yoga + 8 min guided mindfulness. AI scored. Daily."},
  {icon:"💬",title:"24/7 AI Therapy",      desc:"GPT-powered emotional support. Empathy-first. Always available."},
  {icon:"📊",title:"Mood Analytics",        desc:"Track anxiety, stress, focus and calm. 7-day visual charts."},
  {icon:"🫁",title:"Breathing Exercises",   desc:"Box breathing, 4-7-8, physiological sigh. Timer guided."},
  {icon:"⚡",title:"5-Min Stress Relief",   desc:"Quick burnout recovery routines for busy professionals."},
  {icon:"🌍",title:"20 Languages",          desc:"Native voice guidance. Offline-first. LMIC ready."},
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

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════════════════════ */
const Card = ({children, style={}, className=""}) => (
  <div className={`mh-card-h ${className}`} style={{background:CARD,border:`1px solid ${BOR}`,padding:18,...style}}>
    {children}
  </div>
);

const Label = ({children}) => (
  <div style={{fontSize:7,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginBottom:6}}>
    {children}
  </div>
);

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function MentalHealth() {
  const navigate = useNavigate();
  const [tipIdx,   setTipIdx]   = useState(0);
  const [hovered,  setHovered]  = useState(null);
  const [moodLog,  setMoodLog]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_moods") || "[]"); } catch { return []; }
  });
  const [selMood,  setSelMood]  = useState(null);
  const [note,     setNote]     = useState("");
  const [saved,    setSaved]    = useState(false);
  const [chat,     setChat]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("mh_chat") || "[]"); } catch { return []; }
  });
  const [msg,      setMsg]      = useState("");
  const [aiLoad,   setAiLoad]   = useState(false);
  const [tab,      setTab]      = useState("overview");
  const chatRef = useRef(null);
  const tipRef  = useRef(null);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    tipRef.current = setInterval(() => setTipIdx(i => (i+1) % TIPS.length), 4000);
    return () => clearInterval(tipRef.current);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({top: 9999, behavior: "smooth"});
  }, [chat]);

  const MOODS = [
    {emoji:"😭",label:"Terrible",score:1}, {emoji:"😢",label:"Sad",score:2},
    {emoji:"😕",label:"Low",score:3},      {emoji:"😐",label:"Meh",score:5},
    {emoji:"🙂",label:"Okay",score:6},     {emoji:"😊",label:"Good",score:7},
    {emoji:"😄",label:"Happy",score:8},    {emoji:"🤩",label:"Great",score:10},
  ];

  const logMood = useCallback(() => {
    if (!selMood) return;
    const entry = {date:new Date().toDateString(),score:selMood.score,emoji:selMood.emoji,label:selMood.label,note};
    const updated = [...moodLog.filter(m=>m.date!==entry.date), entry];
    setMoodLog(updated);
    localStorage.setItem("mh_moods", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setNote("");
  }, [selMood, note, moodLog]);

  const sendMsg = useCallback(async () => {
    if (!msg.trim() || aiLoad) return;
    const userMsg = {role:"user", content:msg};
    const newChat = [...chat, userMsg];
    setChat(newChat); setMsg(""); setAiLoad(true);

    try {
      const lang = localStorage.getItem("magic16_lang") || "en-IN";
      const url = `https://manifix.up.railway.app/api/stream?message=${encodeURIComponent(`Mental health support. User says: "${msg}". Be empathetic and give one practical technique. Under 80 words.`)}&lang=${lang}&mode=morning`;
      const es = new EventSource(url);
      let reply = "";
      const aiMsg = {role:"assistant", content:""};
      setChat([...newChat, aiMsg]);

      es.onmessage = e => {
        if (e.data === "[DONE]") {
          es.close(); setAiLoad(false);
          const final = [...newChat, {role:"assistant", content:reply}];
          setChat(final);
          localStorage.setItem("mh_chat", JSON.stringify(final.slice(-20)));
          return;
        }
        reply += e.data.replace(/\\n/g,"\n");
        setChat([...newChat, {role:"assistant", content:reply}]);
      };
      es.onerror = () => { es.close(); setAiLoad(false); };
    } catch { setAiLoad(false); }
  }, [msg, chat, aiLoad]);

  const weekMoods = moodLog.slice(-7);
  const avgScore  = weekMoods.length ? (weekMoods.reduce((a,m)=>a+m.score,0)/weekMoods.length).toFixed(1) : "—";
  const mhScore   = weekMoods.length ? Math.min(100, Math.round((Number(avgScore)/10)*70 + weekMoods.length*4)) : 0;
  const todayDone = moodLog.some(m => m.date === new Date().toDateString());
  const mhColor   = mhScore >= 70 ? "#4ade80" : mhScore >= 50 ? GOLD : "#ef4444";

  const TABS = [
    {id:"overview", label:"Overview"},
    {id:"mood",     label:"Mood Check"},
    {id:"therapy",  label:"AI Therapy"},
    {id:"modules",  label:"All Modules"},
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      background: BG,
      color: TEXT,
      fontFamily: FONT,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* BG grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${GRID_C} 1px,transparent 1px),linear-gradient(90deg,${GRID_C} 1px,transparent 1px)`,
        backgroundSize: "44px 44px",
      }} />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)", width: 440, height: 220,
        background: `radial-gradient(ellipse,${GOLD}08 0%,transparent 70%)`,
        animation: "mh-pulse 5s ease-in-out infinite", pointerEvents: "none",
      }} />

      {/* Corners */}
      {[
        {top:13,left:13,  borderTopWidth:2,borderLeftWidth:2},
        {top:13,right:13, borderTopWidth:2,borderRightWidth:2},
        {bottom:13,left:13, borderBottomWidth:2,borderLeftWidth:2},
        {bottom:13,right:13,borderBottomWidth:2,borderRightWidth:2},
      ].map((pos,i) => (
        <div key={i} style={{
          position:"fixed", width:20, height:20,
          borderColor:GOLD, borderStyle:"solid", borderWidth:0,
          opacity:.18, pointerEvents:"none", ...pos,
        }} />
      ))}

      {/* WHO TICKER */}
      <div style={{
        width: "100%", overflow: "hidden", whiteSpace: "nowrap",
        borderBottom: `1px solid ${BOR}`, padding: "5px 0",
        background: "#050505", flexShrink: 0,
      }}>
        <span style={{
          display: "inline-block",
          animation: "mh-tick 55s linear infinite",
          fontSize: 7, letterSpacing: ".1em",
          color: "#1a1a1a", textTransform: "uppercase",
        }}>
          {(TICKER_TEXT + "   ·   " + TICKER_TEXT)}
        </span>
      </div>

      {/* SCAN LINE */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: 2, zIndex: 5,
        background: `linear-gradient(90deg,transparent,${GOLD}22,${GOLD}55,${GOLD}22,transparent)`,
        animation: "mh-scan 5s linear infinite", pointerEvents: "none",
      }} />

      {/* MAIN WRAPPER */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "min(480px,96vw)",
        display: "flex", flexDirection: "column",
        gap: 10, paddingTop: 16, paddingBottom: 60,
      }}>

        {/* ─── HEADER ─── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", paddingBottom: 12,
          borderBottom: `1px solid ${BOR}`,
        }}>
          <div>
            <div style={{fontFamily:HEAD,fontSize:32,letterSpacing:".04em",lineHeight:1,color:TEXT}}>
              🧠 MENTAL HEALTH
            </div>
            <div style={{fontSize:7,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginTop:3}}>
              AI Therapy · Mood Tracking · WHO SDG 3.4
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {mhScore > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:7,letterSpacing:".15em",color:MUTED,textTransform:"uppercase"}}>MH Score</div>
                <div style={{fontFamily:HEAD,fontSize:22,color:mhColor}}>{mhScore}/100</div>
              </div>
            )}
            <button className="mh-btn" onClick={() => navigate("/app/dashboard")} style={{
              background:"transparent", border:`1px solid ${BOR}`,
              color:"#333", fontFamily:FONT, fontSize:8,
              letterSpacing:".14em", padding:"7px 12px",
              textTransform:"uppercase",
            }}>← Back</button>
          </div>
        </div>

        {/* ─── LIVE TIP ─── */}
        <div style={{background:GOLD, padding:"14px 16px", display:"flex", alignItems:"center", gap:12}}>
          <div style={{fontSize:16,flexShrink:0}}>💡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:7,letterSpacing:".18em",color:"#80600a",textTransform:"uppercase",marginBottom:3}}>
              AI Wellness Insight
            </div>
            <div style={{fontSize:11,fontFamily:HEAD,letterSpacing:".04em",color:"#080808"}}>
              {TIPS[tipIdx]}
            </div>
          </div>
          <div style={{display:"flex",gap:4"}}>
            {TIPS.map((_,i) => (
              <div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===tipIdx?"#080808":"#c8a84b",transition:"all .3s"}} />
            ))}
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${BOR}`}}>
          {TABS.map(t => (
            <button key={t.id} className="mh-btn" onClick={() => setTab(t.id)} style={{
              flex:1, padding:"10px 0", background:"transparent",
              border:"none", borderBottom:`2px solid ${tab===t.id?GOLD:"transparent"}`,
              color:tab===t.id?GOLD:MUTED, fontFamily:FONT, fontSize:8,
              letterSpacing:".15em", textTransform:"uppercase", transition:"all .2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══════ OVERVIEW ═══════ */}
        {tab === "overview" && (
          <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Hero */}
            <div style={{
              background: `linear-gradient(135deg,#0a0806,#120e04,#1e1808)`,
              border: `1px solid ${GOLD}18`,
              padding: 24, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position:"absolute", right:-60, top:-60,
                width:180, height:180, borderRadius:"50%",
                background:`radial-gradient(circle,${GOLD}08,transparent 70%)`,
              }}/>
              <div style={{position:"absolute",left:20,bottom:20,width:40,height:40,border:`1px solid ${GOLD}10`,transform:"rotate(45deg)"}}/>
              <Label>WHO Mental Health Crisis · 2024</Label>
              <div style={{fontFamily:HEAD,fontSize:40,lineHeight:1,marginBottom:12,color:TEXT}}>
                970M<span style={{color:GOLD}}> PEOPLE</span>
                <br/>
                <span style={{fontSize:26,color:`${GOLD}90`}}>NEED SUPPORT</span>
              </div>
              <div style={{fontSize:10,lineHeight:1.8,color:SUB,maxWidth:380,marginBottom:18}}>
                ManifiX AI delivers affordable mental health support, mindfulness, breathing exercises, stress relief, and emotional wellness globally — including offline-first access for LMICs.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button className="mh-btn" onClick={() => navigate("/app/magic16")} style={{
                  background:GOLD, color:"#080808", border:"none",
                  padding:"13px 20px", fontFamily:FONT, fontSize:10,
                  fontWeight:700, letterSpacing:".18em", textTransform:"uppercase",
                }}>🧘 Start Session</button>
                <button className="mh-btn" onClick={() => setTab("therapy")} style={{
                  background:"transparent", border:`1px solid ${BOR}`,
                  color:SUB, padding:"13px 20px", fontFamily:FONT,
                  fontSize:10, letterSpacing:".18em", textTransform:"uppercase",
                }}>💬 AI Therapy</button>
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

            {/* Features */}
            <Label>Platform Features</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {FEATURES.map((f,i) => (
                <div key={f.title}
                  className="mh-card-h"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: CARD,
                    border: `1px solid ${hovered===i?`${GOLD}33`:BOR}`,
                    padding: "16px 14px", cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                >
                  <div style={{fontSize:26,marginBottom:8,display:"inline-block",animation:hovered===i?"mh-float 2s ease-in-out infinite":"none"}}>{f.icon}</div>
                  <div style={{fontFamily:HEAD,fontSize:15,color:hovered===i?GOLD:TEXT,marginBottom:5,transition:"color .2s"}}>{f.title}</div>
                  <div style={{fontSize:8,lineHeight:1.7,color:SUB,letterSpacing:".04em"}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ MOOD CHECK ═══════ */}
        {tab === "mood" && (
          <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>

            {todayDone && (
              <div style={{border:"1px solid #1e4d1e",background:"#0a140a",padding:"10px 14px",fontSize:9,color:"#4ade80",letterSpacing:".12em",textTransform:"uppercase"}}>
                ✓ Today's mood logged · Come back tomorrow
              </div>
            )}

            <Card>
              <Label>How are you feeling right now?</Label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {MOODS.map(m => (
                  <button key={m.label} className="mh-btn" onClick={() => setSelMood(m)} style={{
                    padding:"12px 6px",
                    background: selMood?.label===m.label ? `${GOLD}22` : "#111",
                    border: `1px solid ${selMood?.label===m.label?GOLD:BOR}`,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  }}>
                    <span style={{fontSize:24}}>{m.emoji}</span>
                    <span style={{fontSize:7,letterSpacing:".1em",color:selMood?.label===m.label?GOLD:MUTED,textTransform:"uppercase"}}>{m.label}</span>
                  </button>
                ))}
              </div>
              {selMood && <div style={{textAlign:"center",marginTop:10,fontSize:11,color:GOLD}}>{selMood.emoji} {selMood.label}</div>}
            </Card>

            <div>
              <Label>What's on your mind? (optional)</Label>
              <textarea
                value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Write freely. This is your safe space..."
                rows={3}
                style={{
                  width:"100%",background:CARD,border:`1px solid ${BOR}`,
                  color:TEXT,fontFamily:FONT,fontSize:11,letterSpacing:".06em",
                  padding:"10px 12px",outline:"none",resize:"vertical",
                }}
              />
            </div>

            <button className="mh-btn" onClick={logMood} disabled={!selMood} style={{
              width:"100%", padding:"14px 0",
              background: selMood ? GOLD : "#111",
              color: selMood ? "#080808" : MUTED,
              border: selMood ? "none" : `1px solid ${BOR}`,
              fontFamily:FONT, fontSize:11, fontWeight:700,
              letterSpacing:".18em", textTransform:"uppercase",
            }}>
              {saved ? "✓ Mood Logged" : "Log Today's Mood"}
            </button>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {label:"7-Day Avg",  value:avgScore},
                {label:"Days Tracked",value:moodLog.length},
                {label:"MH Score",   value:mhScore>0?`${mhScore}/100`:"—"},
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
                  {weekMoods.map((m,i) => (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{fontSize:8,color:SUB}}>{m.score}</div>
                      <div style={{
                        width:"100%",
                        height:`${(m.score/10)*60}px`,
                        background:m.score>=7?"#4ade80":m.score>=5?GOLD:"#ef4444",
                        borderRadius:"2px 2px 0 0",
                        transition:"height .5s",
                      }}/>
                      <div style={{fontSize:16}}>{m.emoji}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* History */}
            {moodLog.length > 0 && (
              <Card>
                <Label>Recent Entries</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[...moodLog].reverse().slice(0,5).map((m,i) => (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid #111`,paddingBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:20}}>{m.emoji}</span>
                        <div>
                          <div style={{fontSize:9,color:SUB}}>{m.date}</div>
                          {m.note && <div style={{fontSize:8,color:MUTED,marginTop:1,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.note}</div>}
                        </div>
                      </div>
                      <div style={{fontFamily:HEAD,fontSize:24,color:m.score>=7?"#4ade80":m.score>=5?GOLD:"#ef4444"}}>{m.score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══════ AI THERAPY ═══════ */}
        {tab === "therapy" && (
          <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card>
              <Label>ManifiX AI Therapist</Label>
              <div style={{fontSize:9,color:SUB,lineHeight:1.7}}>
                Available 24/7 · Empathetic · Evidence-based · GPT-powered
              </div>
            </Card>

            {/* Chat */}
            <div ref={chatRef} style={{
              height:320, overflowY:"auto",
              border:`1px solid ${BOR}`, background:"#070707",
              padding:14, display:"flex", flexDirection:"column", gap:10,
            }}>
              {chat.length === 0 && (
                <div style={{margin:"auto",textAlign:"center",color:MUTED,fontSize:9,letterSpacing:".12em",textTransform:"uppercase",lineHeight:2.2}}>
                  <div style={{fontSize:36,marginBottom:10}}>🧠</div>
                  I am here to listen and support you.<br/>
                  Share what's on your mind.
                </div>
              )}
              {chat.map((m,i) => (
                <div key={i} style={{
                  alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  background: m.role==="user" ? `${GOLD}20` : "#111",
                  border: `1px solid ${m.role==="user"?`${GOLD}44`:BOR}`,
                  padding:"10px 13px",
                }}>
                  <div style={{fontSize:11,color:m.role==="user"?GOLD:SUB,lineHeight:1.75}}>
                    {m.content || (aiLoad&&i===chat.length-1 ? <span style={{animation:"mh-blink .8s infinite"}}>●●●</span> : "")}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{display:"flex",gap:8}}>
              <input
                value={msg} onChange={e=>setMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                placeholder="How are you feeling? What's bothering you?"
                style={{
                  flex:1, background:CARD, border:`1px solid ${BOR}`,
                  color:TEXT, fontFamily:FONT, fontSize:11,
                  padding:"11px 14px", outline:"none",
                }}
              />
              <button className="mh-btn" onClick={sendMsg} disabled={aiLoad} style={{
                padding:"11px 18px", background:GOLD, color:"#080808",
                border:"none", fontFamily:FONT, fontSize:12, fontWeight:700,
              }}>→</button>
            </div>

            {/* Quick prompts */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["I feel anxious","I can't sleep","I feel overwhelmed","I need motivation"].map(p => (
                <button key={p} className="mh-btn" onClick={() => setMsg(p)} style={{
                  fontSize:8, letterSpacing:".1em", padding:"5px 10px",
                  background:"transparent", border:`1px solid ${BOR}`,
                  color:MUTED, fontFamily:FONT, textTransform:"uppercase",
                }}>{p}</button>
              ))}
            </div>

            {chat.length > 0 && (
              <button className="mh-btn" onClick={() => {setChat([]);localStorage.removeItem("mh_chat");}} style={{
                background:"transparent", border:`1px solid ${BOR}`,
                color:MUTED, fontFamily:FONT, fontSize:8,
                letterSpacing:".14em", padding:"8px 0",
                textTransform:"uppercase", width:"100%",
              }}>↺ Clear Chat</button>
            )}
          </div>
        )}

        {/* ═══════ ALL MODULES ═══════ */}
        {tab === "modules" && (
          <div className="mh-up" style={{display:"flex",flexDirection:"column",gap:10}}>
            <Label>ManifiX — 10 Global Health Modules</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {MANIFIX_MODULES.map((m,i) => (
                <button key={m.id} className="mh-btn" onClick={() => navigate(m.route)} style={{
                  background:CARD, border:`1px solid ${BOR}`,
                  padding:"16px 14px", cursor:"pointer",
                  textAlign:"left", display:"flex", flexDirection:"column", gap:5,
                  transition:"border-color .2s",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:20}}>{m.icon}</span>
                    <div style={{fontFamily:HEAD,fontSize:14,color:TEXT}}>{m.label}</div>
                  </div>
                  <div style={{fontSize:7,color:MUTED,letterSpacing:".1em"}}>{m.stat}</div>
                  <div style={{fontSize:8,color:GOLD,fontWeight:700,letterSpacing:".08em"}}>{m.result}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:"center",fontSize:7,letterSpacing:".18em",color:"#1a1a1a",textTransform:"uppercase",paddingTop:6}}>
          ManifiX AI · Mental Health · WHO SDG 3.4 · 20 Languages · Offline-first
        </div>

      </div>
    </div>
  );
}
