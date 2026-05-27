import React, { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD — PALETTE
════════════════════════════════════════════════════════════ */
const GOLD  = "#ffc83c";
const DIM   = "#c8a84b";
const BG    = "#080808";
const CARD  = "#0c0c0c";
const BOR   = "#1a1a1a";
const FONT  = "'DM Mono','Courier New',monospace";
const HEAD  = "'Bebas Neue',sans-serif";
const TEXT  = "#e8e4d9";
const MUTED = "#2a2a2a";
const SUB   = "#3a3a3a";
const GREEN = "#4ade80";
const RED   = "#ef4444";
const BLUE  = "#60a5fa";
const PURP  = "#a78bfa";
const API_BASE = "https://manifix.up.railway.app";

/* ════════════════════════════════════════════════════════════
   CSS INJECTION
════════════════════════════════════════════════════════════ */
function injectCSS() {
  if (document.getElementById("gpt-elite-css")) return;
  const el = document.createElement("style");
  el.id = "gpt-elite-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    @keyframes ge-up    {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ge-pulse {0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.12;transform:scale(1.06)}}
    @keyframes ge-tick  {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes ge-scan  {from{top:-2px}to{top:100%}}
    @keyframes ge-blink {0%,100%{opacity:1}50%{opacity:.15}}
    @keyframes ge-dot   {0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    @keyframes ge-float {0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes ge-ring  {0%{transform:scale(1);opacity:.6}100%{transform:scale(2);opacity:0}}
    @keyframes ge-slide {from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ge-shake {0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
    .ge-up   {animation:ge-up .4s cubic-bezier(.22,.68,0,1.2) both}
    .ge-slide{animation:ge-slide .35s ease both}
    .ge-btn  {cursor:pointer;transition:all .15s}
    .ge-btn:hover{opacity:.85;transform:translateY(-1px)}
    .ge-btn:active{transform:translateY(0)}
    textarea{resize:none}
    textarea:focus,input:focus{outline:none;border-color:#ffc83c44!important}
    ::selection{background:rgba(255,200,60,.2);color:#e8e4d9}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-track{background:#0a0a0a}
    ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px}
    .ge-msg p{margin:0;line-height:1.85;font-size:11px;letter-spacing:.04em}
    .ge-msg strong,.ge-msg b{color:#ffc83c}
    .ge-msg ul,.ge-msg ol{margin:6px 0 6px 14px;line-height:1.9}
    .ge-msg h1,.ge-msg h2,.ge-msg h3{font-family:'Bebas Neue',sans-serif;letter-spacing:.06em;color:#e8e4d9;margin:8px 0 4px}
    .ge-msg code{font-family:'DM Mono',monospace;font-size:10px;background:#111;padding:1px 5px;border:1px solid #1a1a1a}
    .ge-chip{cursor:pointer;transition:all .15s;white-space:nowrap}
    .ge-chip:hover{border-color:#ffc83c44!important;color:#ffc83c!important}
  `;
  document.head.appendChild(el);
}

/* ════════════════════════════════════════════════════════════
   LANG MAP
════════════════════════════════════════════════════════════ */
const LANG_MAP = {
  en: {bcp47:"en-IN", voice:"en-IN", label:"English"},
  hi: {bcp47:"hi-IN", voice:"hi-IN", label:"हिन्दी"},
  te: {bcp47:"te-IN", voice:"te-IN", label:"తెలుగు"},
  ta: {bcp47:"ta-IN", voice:"ta-IN", label:"தமிழ்"},
  es: {bcp47:"es-ES", voice:"es-ES", label:"Español"},
  ar: {bcp47:"ar-SA", voice:"ar-SA", label:"العربية"},
  fr: {bcp47:"fr-FR", voice:"fr-FR", label:"Français"},
  pt: {bcp47:"pt-BR", voice:"pt-BR", label:"Português"},
  de: {bcp47:"de-DE", voice:"de-DE", label:"Deutsch"},
  zh: {bcp47:"zh-CN", voice:"zh-CN", label:"中文"},
};

const STORAGE_KEYS = {
  streak:"magic16_streak", xp:"magic16_xp", level:"magic16_level",
  totalSess:"magic16_total_sessions", rankSeed:"magic16_rank_seed", lang:"magic16_lang",
};

function readUserStats() {
  const streak    = Number(localStorage.getItem(STORAGE_KEYS.streak)    || 0);
  const xp        = Number(localStorage.getItem(STORAGE_KEYS.xp)        || 0);
  const level     = Number(localStorage.getItem(STORAGE_KEYS.level)     || 1);
  const totalSess = Number(localStorage.getItem(STORAGE_KEYS.totalSess) || 0);
  const rankSeed  = Number(localStorage.getItem(STORAGE_KEYS.rankSeed)  || 9999);
  const globalRank = Math.max(1, rankSeed - streak * 40 - (level - 1) * 60);
  return {streak, xp, level, totalSess, globalRank};
}

function readLang() {
  const code = localStorage.getItem(STORAGE_KEYS.lang) || "en";
  return LANG_MAP[code] || LANG_MAP["en"];
}

/* ════════════════════════════════════════════════════════════
   HABIT SYSTEM DATA (Noom-style behavioral coaching)
════════════════════════════════════════════════════════════ */
const HABIT_CATEGORIES = [
  {id:"mind",    icon:"🧠", label:"Mind",       color:PURP},
  {id:"body",    icon:"💪", label:"Body",       color:GREEN},
  {id:"sleep",   icon:"😴", label:"Sleep",      color:BLUE},
  {id:"food",    icon:"🍎", label:"Nutrition",  color:"#fb923c"},
  {id:"social",  icon:"🤝", label:"Social",     color:"#f472b6"},
  {id:"focus",   icon:"🎯", label:"Focus",      color:GOLD},
];

const HABIT_TEMPLATES = [
  {id:"h1",  cat:"mind",  name:"5-min morning meditation",   xp:20, freq:"Daily"},
  {id:"h2",  cat:"mind",  name:"Gratitude — 3 things",       xp:15, freq:"Daily"},
  {id:"h3",  cat:"body",  name:"10,000 steps",               xp:25, freq:"Daily"},
  {id:"h4",  cat:"body",  name:"Drink 2L water",             xp:15, freq:"Daily"},
  {id:"h5",  cat:"body",  name:"30-min workout",             xp:35, freq:"Daily"},
  {id:"h6",  cat:"sleep", name:"Sleep by 10:30pm",           xp:20, freq:"Daily"},
  {id:"h7",  cat:"sleep", name:"No screens 1h before bed",   xp:15, freq:"Daily"},
  {id:"h8",  cat:"food",  name:"Eat vegetables with lunch",  xp:15, freq:"Daily"},
  {id:"h9",  cat:"food",  name:"No sugar after 8pm",         xp:20, freq:"Daily"},
  {id:"h10", cat:"social","name":"Call someone you love",    xp:20, freq:"Weekly"},
  {id:"h11", cat:"focus", name:"90-min deep work block",     xp:30, freq:"Daily"},
  {id:"h12", cat:"focus", name:"Review goals every morning", xp:20, freq:"Daily"},
];

/* ════════════════════════════════════════════════════════════
   MOOD-ADAPTIVE CONTENT SYSTEM (Headspace-style)
════════════════════════════════════════════════════════════ */
const MOODS = [
  {id:"great",    emoji:"🤩", label:"Great",      score:10, color:GREEN},
  {id:"good",     emoji:"😊", label:"Good",       score:7,  color:GOLD},
  {id:"okay",     emoji:"😐", label:"Okay",       score:5,  color:DIM},
  {id:"low",      emoji:"😕", label:"Low",        score:3,  color:"#fb923c"},
  {id:"anxious",  emoji:"😰", label:"Anxious",    score:2,  color:RED},
  {id:"burned",   emoji:"🔥", label:"Burned Out", score:1,  color:RED},
];

// Each mood maps to an AI-persona, system prompt tone, and quick prompts
const MOOD_PROFILES = {
  great:   {
    persona: "High-Performance Coach",
    icon: "⚡",
    color: GREEN,
    tone: "You are in peak state. ManifiX Strategist is your high-performance partner. Channel this energy into your biggest goals.",
    systemAddition: "User is in peak state (score 10/10). Use high-energy, ambitious, peak-performance coaching. Challenge them to go further.",
    chips: ["Optimize my peak state","Next level challenge","Set aggressive goals","Build on momentum"],
  },
  good:    {
    persona: "Wellness Strategist",
    icon: "🎯",
    color: GOLD,
    tone: "You're doing well. Let's make today count. ManifiX Strategist is focused and ready.",
    systemAddition: "User mood: good (7/10). Use motivating, practical coaching. Focus on habit building and progress.",
    chips: ["Build on today's momentum","Habit check-in","Weekly review","What should I focus on?"],
  },
  okay:    {
    persona: "Mindful Coach",
    icon: "🧘",
    color: DIM,
    tone: "You're in a steady state. Good time for reflection and gentle progress.",
    systemAddition: "User mood: okay (5/10). Use calm, supportive, mindful coaching. Focus on small wins and self-compassion.",
    chips: ["Small win I can do now","Mindful check-in","Energy reset","Help me feel better"],
  },
  low:     {
    persona: "Empathy-First Therapist",
    icon: "💙",
    color: "#fb923c",
    tone: "I see you. It's okay to be here. Let's just breathe and take one small step.",
    systemAddition: "User mood: low (3/10). Use warm, empathetic, CBT-informed support. Do NOT push performance. Focus on validation, grounding, and one tiny next step.",
    chips: ["I need support","Ground me right now","One small thing I can do","Breathe with me"],
  },
  anxious: {
    persona: "Anxiety Relief Specialist",
    icon: "🫁",
    color: RED,
    tone: "I'm with you. Let's slow this down. You are safe. One breath at a time.",
    systemAddition: "User mood: anxious (2/10). PRIORITY: immediate regulation. Use physiological sigh, 5-4-3-2-1, box breathing. Be calm, grounding, and slow. No lists, no performance talk.",
    chips: ["Help me calm down NOW","Box breathing guide","Ground me in 60 seconds","What's happening to me?"],
  },
  burned:  {
    persona: "Burnout Recovery Coach",
    icon: "🌱",
    color: "#f87171",
    tone: "Stop. You need rest. I'm here. Let's recover together, not push harder.",
    systemAddition: "User mood: burned out (1/10). User is in burnout. DO NOT suggest productivity or goals. Focus entirely on rest, compassion, nervous system recovery, and gentle reframing. Validate exhaustion.",
    chips: ["I'm exhausted, help","Permission to rest","Minimum viable recovery","Talk me down"],
  },
};

/* ════════════════════════════════════════════════════════════
   COACHING MODES (replaces simple quick prompts)
════════════════════════════════════════════════════════════ */
const COACH_MODES = [
  {id:"therapy",   icon:"💬", label:"Therapy",       color:BLUE,  desc:"BetterHelp-style 24/7 emotional support"},
  {id:"habits",    icon:"🔗", label:"Habit Coach",   color:GREEN, desc:"Noom-style behavioral change system"},
  {id:"adaptive",  icon:"🎭", label:"Mood-Adaptive", color:PURP,  desc:"Headspace-style content based on your mood"},
  {id:"report",    icon:"📊", label:"Weekly Report", color:GOLD,  desc:"AI analysis of your ManifiX stats"},
];

/* ════════════════════════════════════════════════════════════
   SIMPLE MARKDOWN RENDERER (no external deps)
════════════════════════════════════════════════════════════ */
function SimpleMarkdown({text}) {
  if (!text) return null;
  // Convert markdown-ish to HTML
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^### (.+)$/gm,   "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,    "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,     "<h1>$1</h1>")
    .replace(/^- (.+)$/gm,     "<li>$1</li>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\n\n/g,          "</p><p>")
    .replace(/\n/g,            "<br/>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, "<ul>$1</ul>");

  return (
    <div
      className="ge-msg"
      dangerouslySetInnerHTML={{__html: `<p>${html}</p>`}}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   HABIT TRACKER PANEL (Noom-style)
════════════════════════════════════════════════════════════ */
function HabitTracker({onAskCoach}) {
  const [habits, setHabits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gpt_habits") || "[]"); } catch { return []; }
  });
  const [view,      setView]      = useState("today"); // today | library | add
  const [selCat,    setSelCat]    = useState("all");
  const [customName,setCustomName]= useState("");
  const [customCat, setCustomCat] = useState("mind");
  const [streak,    setStreak]    = useState({});

  const today = new Date().toDateString();

  const saveHabits = (h) => {
    setHabits(h);
    localStorage.setItem("gpt_habits", JSON.stringify(h));
  };

  const addHabit = (template) => {
    if (habits.find(h => h.templateId === template.id)) return;
    const h = {
      id: Date.now(),
      templateId: template.id,
      name: template.name,
      cat: template.cat,
      xp: template.xp,
      freq: template.freq,
      streak: 0,
      completions: [],
    };
    saveHabits([...habits, h]);
  };

  const addCustomHabit = () => {
    if (!customName.trim()) return;
    const h = {
      id: Date.now(),
      templateId: null,
      name: customName.trim(),
      cat: customCat,
      xp: 20,
      freq: "Daily",
      streak: 0,
      completions: [],
    };
    saveHabits([...habits, h]);
    setCustomName("");
    setView("today");
  };

  const toggleComplete = (id) => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const alreadyDone = h.completions.includes(today);
      const completions = alreadyDone
        ? h.completions.filter(d => d !== today)
        : [...h.completions, today];
      // Calculate streak
      let s = 0;
      const sorted = [...completions].sort((a,b) => new Date(b)-new Date(a));
      let cur = new Date(); cur.setHours(0,0,0,0);
      for (let d of sorted) {
        const dd = new Date(d); dd.setHours(0,0,0,0);
        const diff = (cur - dd) / 86400000;
        if (diff <= s + 1) { s++; cur = dd; } else break;
      }
      return {...h, completions, streak: s};
    });
    saveHabits(updated);
  };

  const removeHabit = (id) => saveHabits(habits.filter(h => h.id !== id));

  const todayCompleted = habits.filter(h => h.completions.includes(today)).length;
  const totalXPToday   = habits.filter(h => h.completions.includes(today)).reduce((a,h) => a+h.xp, 0);
  const completionRate = habits.length ? Math.round((todayCompleted / habits.length) * 100) : 0;

  const getCatColor = (cat) => HABIT_CATEGORIES.find(c=>c.id===cat)?.color || GOLD;
  const getCatIcon  = (cat) => HABIT_CATEGORIES.find(c=>c.id===cat)?.icon || "🎯";

  const generateCoachPrompt = () => {
    const done    = habits.filter(h => h.completions.includes(today)).map(h=>h.name);
    const pending = habits.filter(h => !h.completions.includes(today)).map(h=>h.name);
    const msg = `My habits today: Done: ${done.join(", ")||"none"}. Still to do: ${pending.join(", ")||"all done!"}. Completion: ${completionRate}%. Give me behavioral coaching advice and accountability.`;
    onAskCoach(msg);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:6,borderBottom:`1px solid ${BOR}`,paddingBottom:10}}>
        {[
          {id:"today",   label:"Today"},
          {id:"library", label:"Add Habits"},
          {id:"add",     label:"Custom"},
        ].map(v => (
          <button key={v.id} className="ge-btn" onClick={() => setView(v.id)} style={{
            padding:"6px 14px",background:"transparent",
            border:`1px solid ${view===v.id?GOLD:BOR}`,
            color:view===v.id?GOLD:MUTED,fontFamily:FONT,fontSize:7,
            letterSpacing:".16em",textTransform:"uppercase",
          }}>{v.label}</button>
        ))}
      </div>

      {/* TODAY VIEW */}
      {view==="today" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* Stats bar */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              {label:"Completed", value:`${todayCompleted}/${habits.length}`, color:GREEN},
              {label:"XP Today",  value:`+${totalXPToday}`,                   color:GOLD},
              {label:"Rate",      value:`${completionRate}%`,                 color:completionRate>=70?GREEN:completionRate>=40?GOLD:RED},
            ].map(s => (
              <div key={s.label} style={{background:CARD,border:`1px solid ${BOR}`,padding:"10px 12px"}}>
                <div style={{fontSize:6,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:4}}>{s.label}</div>
                <div style={{fontFamily:HEAD,fontSize:22,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {habits.length > 0 && (
            <div style={{height:4,background:BOR,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${completionRate}%`,background:completionRate>=70?GREEN:GOLD,transition:"width .6s ease"}}/>
            </div>
          )}

          {habits.length === 0 && (
            <div style={{background:CARD,border:`1px solid ${BOR}`,padding:24,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🔗</div>
              <div style={{fontFamily:HEAD,fontSize:16,color:TEXT,marginBottom:6}}>No Habits Yet</div>
              <div style={{fontSize:8,color:SUB,marginBottom:14,lineHeight:1.7}}>Add habits from the library or create your own to start behavioral coaching.</div>
              <button className="ge-btn" onClick={() => setView("library")} style={{
                padding:"10px 20px",background:GOLD,color:"#080808",border:"none",
                fontFamily:FONT,fontSize:9,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",
              }}>Browse Library →</button>
            </div>
          )}

          {/* Habit list */}
          {habits.map(h => {
            const done = h.completions.includes(today);
            const color = getCatColor(h.cat);
            return (
              <div key={h.id} style={{
                background:done?"#0a140a":CARD,
                border:`1px solid ${done?"#1e4d1e":BOR}`,
                padding:"12px 16px",
                display:"flex",alignItems:"center",gap:12,
                transition:"all .25s",
              }}>
                {/* Checkbox */}
                <button className="ge-btn" onClick={() => toggleComplete(h.id)} style={{
                  width:28,height:28,borderRadius:"50%",flexShrink:0,
                  background:done?`${GREEN}22`:"transparent",
                  border:`2px solid ${done?GREEN:BOR}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:done?GREEN:BOR,fontSize:13,
                }}>{done?"✓":""}</button>

                <div style={{flex:1}}>
                  <div style={{
                    fontSize:10,color:done?GREEN:TEXT,
                    textDecoration:done?"line-through":"none",
                    letterSpacing:".04em",marginBottom:3,
                    transition:"all .2s",
                  }}>{getCatIcon(h.cat)} {h.name}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:6,color,letterSpacing:".12em",textTransform:"uppercase",border:`1px solid ${color}33`,padding:"1px 6px"}}>{h.cat}</span>
                    <span style={{fontSize:7,color:MUTED}}>+{h.xp} XP</span>
                    {h.streak > 0 && <span style={{fontSize:7,color:GOLD}}>🔥 {h.streak}d</span>}
                  </div>
                </div>

                <button className="ge-btn" onClick={() => removeHabit(h.id)} style={{
                  background:"transparent",border:"none",color:MUTED,fontSize:14,padding:"4px 6px",
                }}>×</button>
              </div>
            );
          })}

          {/* Ask coach button */}
          {habits.length > 0 && (
            <button className="ge-btn" onClick={generateCoachPrompt} style={{
              width:"100%",padding:"11px 0",background:`${GOLD}15`,border:`1px solid ${GOLD}33`,
              color:GOLD,fontFamily:FONT,fontSize:9,fontWeight:700,
              letterSpacing:".18em",textTransform:"uppercase",
            }}>🤖 Ask Coach About My Habits</button>
          )}
        </div>
      )}

      {/* LIBRARY VIEW */}
      {view==="library" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* Category filter */}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[{id:"all",label:"All",icon:"✦"},...HABIT_CATEGORIES].map(c => (
              <button key={c.id} className="ge-btn ge-chip" onClick={() => setSelCat(c.id)} style={{
                padding:"4px 10px",fontSize:7,letterSpacing:".12em",
                background:selCat===c.id?`${GOLD}18`:"transparent",
                border:`1px solid ${selCat===c.id?GOLD:BOR}`,
                color:selCat===c.id?GOLD:MUTED,fontFamily:FONT,textTransform:"uppercase",
              }}>{c.icon} {c.label||c.id}</button>
            ))}
          </div>

          {HABIT_TEMPLATES.filter(t => selCat==="all"||t.cat===selCat).map(t => {
            const already = habits.find(h=>h.templateId===t.id);
            const color   = getCatColor(t.cat);
            return (
              <div key={t.id} style={{
                background:already?`${GREEN}08`:CARD,
                border:`1px solid ${already?"#1e4d1e":BOR}`,
                padding:"12px 16px",
                display:"flex",alignItems:"center",gap:12,
              }}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:already?GREEN:TEXT,marginBottom:4,letterSpacing:".04em"}}>{getCatIcon(t.cat)} {t.name}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:6,color,letterSpacing:".1em",border:`1px solid ${color}33`,padding:"1px 5px",textTransform:"uppercase"}}>{t.cat}</span>
                    <span style={{fontSize:7,color:MUTED}}>+{t.xp} XP · {t.freq}</span>
                  </div>
                </div>
                <button className="ge-btn" onClick={() => addHabit(t)} disabled={!!already} style={{
                  padding:"6px 12px",background:already?"transparent":GOLD,
                  color:already?"#1e4d1e":"#080808",border:`1px solid ${already?"#1e4d1e":GOLD}`,
                  fontFamily:FONT,fontSize:7,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",
                }}>{already?"✓ Added":"+ Add"}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM HABIT */}
      {view==="add" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:6}}>Habit Name</div>
            <input
              value={customName} onChange={e=>setCustomName(e.target.value)}
              placeholder="e.g. Journal for 5 minutes"
              onKeyDown={e=>e.key==="Enter"&&addCustomHabit()}
              style={{width:"100%",background:CARD,border:`1px solid ${BOR}`,color:TEXT,fontFamily:FONT,fontSize:11,padding:"10px 14px"}}
            />
          </div>
          <div>
            <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:6}}>Category</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {HABIT_CATEGORIES.map(c => (
                <button key={c.id} className="ge-btn ge-chip" onClick={() => setCustomCat(c.id)} style={{
                  padding:"6px 12px",fontSize:7,letterSpacing:".12em",textTransform:"uppercase",
                  background:customCat===c.id?`${c.color}22`:"transparent",
                  border:`1px solid ${customCat===c.id?c.color:BOR}`,
                  color:customCat===c.id?c.color:MUTED,fontFamily:FONT,
                }}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
          <button className="ge-btn" onClick={addCustomHabit} disabled={!customName.trim()} style={{
            padding:"12px 0",background:customName.trim()?GOLD:"#111",
            color:customName.trim()?"#080808":MUTED,
            border:customName.trim()?"none":`1px solid ${BOR}`,
            fontFamily:FONT,fontSize:10,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",
          }}>+ Add Custom Habit</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MOOD-ADAPTIVE PANEL (Headspace-style)
════════════════════════════════════════════════════════════ */
function MoodAdaptivePanel({onAskCoach, onSetMoodProfile}) {
  const [selMood, setSelMood] = useState(null);
  const [checked, setChecked] = useState(false);

  const handleMood = (mood) => {
    setSelMood(mood);
    const profile = MOOD_PROFILES[mood.id];
    onSetMoodProfile(profile);
    setChecked(true);
  };

  const profile = selMood ? MOOD_PROFILES[selMood.id] : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {/* Mood selector */}
      {!checked ? (
        <>
          <div style={{background:`${PURP}11`,border:`1px solid ${PURP}22`,padding:"10px 14px",fontSize:8,color:`${PURP}cc`,lineHeight:1.7,letterSpacing:".06em"}}>
            ✦ ManifiX adapts its coaching style to your current emotional state — like Headspace, but smarter.
          </div>
          <div style={{fontSize:7,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginBottom:2}}>How are you feeling right now?</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {MOODS.map(m => (
              <button key={m.id} className="ge-btn" onClick={() => handleMood(m)} style={{
                padding:"14px 8px",background:CARD,border:`1px solid ${BOR}`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                transition:"border-color .2s",
              }}>
                <span style={{fontSize:26}}>{m.emoji}</span>
                <span style={{fontSize:7,letterSpacing:".1em",color:MUTED,textTransform:"uppercase"}}>{m.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Adaptive persona card */}
          <div style={{
            background:`linear-gradient(135deg,#080808,#0c0c08)`,
            border:`1px solid ${profile.color}33`,
            padding:"18px 20px",
            position:"relative",overflow:"hidden",
          }}>
            <div style={{position:"absolute",right:-30,top:-30,width:100,height:100,borderRadius:"50%",background:`radial-gradient(${profile.color}18,transparent 70%)`}}/>
            <div style={{fontSize:7,letterSpacing:".2em",color:`${profile.color}88`,textTransform:"uppercase",marginBottom:6}}>
              Mood Detected · AI Adapting
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{fontSize:32}}>{selMood.emoji}</div>
              <div>
                <div style={{fontFamily:HEAD,fontSize:22,color:profile.color}}>{selMood.label}</div>
                <div style={{fontSize:8,color:SUB,letterSpacing:".1em"}}>{profile.icon} {profile.persona}</div>
              </div>
            </div>
            <div style={{fontSize:10,color:TEXT,lineHeight:1.85,fontStyle:"italic",borderLeft:`2px solid ${profile.color}44`,paddingLeft:12,marginBottom:14}}>
              "{profile.tone}"
            </div>
            <button className="ge-btn" onClick={() => { setChecked(false); setSelMood(null); onSetMoodProfile(null); }} style={{
              background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
              fontSize:7,letterSpacing:".14em",padding:"5px 12px",textTransform:"uppercase",
            }}>← Change Mood</button>
          </div>

          {/* Adaptive quick chips */}
          <div style={{fontSize:7,letterSpacing:".18em",color:MUTED,textTransform:"uppercase",marginBottom:2}}>
            Recommended for your state
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {profile.chips.map((chip,i) => (
              <button key={i} className="ge-btn" onClick={() => onAskCoach(chip)} style={{
                padding:"11px 16px",background:CARD,border:`1px solid ${BOR}`,
                color:TEXT,fontFamily:FONT,fontSize:9,letterSpacing:".06em",
                textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",
                transition:"border-color .2s",
              }}>
                <span>{chip}</span>
                <span style={{color:MUTED,fontSize:12}}>→</span>
              </button>
            ))}
          </div>

          {/* Mood-specific content pack preview */}
          <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"14px 16px"}}>
            <div style={{fontSize:7,letterSpacing:".16em",color:MUTED,textTransform:"uppercase",marginBottom:8}}>
              Session Adapted To: {selMood.label} State
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {label:"Coaching Mode",  value:profile.persona,  color:profile.color},
                {label:"Tone",           value:selMood.score>=6?"High Energy":selMood.score>=4?"Calm":"Gentle", color:profile.color},
                {label:"Priority",       value:selMood.score>=6?"Performance":selMood.score>=4?"Balance":"Recovery", color:profile.color},
                {label:"XP Multiplier",  value:selMood.score>=7?"2×":selMood.score>=5?"1.5×":"1×", color:GOLD},
              ].map(s => (
                <div key={s.label} style={{background:"#070707",border:`1px solid ${BOR}`,padding:"8px 10px"}}>
                  <div style={{fontSize:6,color:MUTED,letterSpacing:".14em",textTransform:"uppercase",marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:9,color:s.color,letterSpacing:".06em"}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   REPORT BUILDER
════════════════════════════════════════════════════════════ */
function buildReportPrompt(stats, lang) {
  const {streak, xp, level, totalSess, globalRank} = stats;
  const accuracy = Math.min(99, 70 + streak * 2);
  const weekSess = Math.min(7, streak);
  return `You are ManifiX AI Strategist. Generate a powerful, motivating weekly wellness report.

User stats:
- Streak: ${streak} days | XP: ${xp} | Level: ${level}
- Sessions: ${totalSess} | Accuracy: ${accuracy}% | Rank: #${globalRank.toLocaleString()}
- Sessions this week: ${weekSess}/7

Write in ${lang.label}. Use these sections:
1. 🏆 Weekly Summary (2 sharp sentences)
2. 📊 Your Numbers (bullet list)
3. 🧠 AI Insight (personalized observation)
4. 🎯 Next Week Goal (1 specific, measurable target)
5. 💎 Closing (punchy 1-liner)

No fluff. This person is serious about discipline.`;
}

/* ════════════════════════════════════════════════════════════
   CHAT ENGINE HOOK
════════════════════════════════════════════════════════════ */
function useChatEngine({lang, moodProfile}) {
  const [messages,   setMessages]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("gpt_chat3") || "null") || []; } catch { return []; }
  });
  const [generating, setGenerating] = useState(false);
  const [voiceOn,    setVoiceOn]    = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("gpt_chat3", JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !voiceOn) return;
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g,"").substring(0,400));
    utter.rate = 0.95; utter.lang = lang.voice;
    const voices = window.speechSynthesis.getVoices();
    const match  = voices.find(v => v.lang.startsWith(lang.bcp47.split("-")[0]));
    if (match) utter.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [lang, voiceOn]);

  const sendMessage = useCallback((text, systemHint="") => {
    if (!text.trim() || generating) return;

    const userMsg = {id:Date.now(), role:"user",      content:text};
    const botId   = Date.now() + 1;
    const botMsg  = {id:botId,     role:"assistant",  content:"", streaming:true};
    setMessages(prev => [...prev, userMsg, botMsg]);
    setGenerating(true);

    // Build system context for adaptive mood
    const moodCtx = moodProfile ? `\n\nIMPORTANT CONTEXT: ${moodProfile.systemAddition}` : "";
    const fullMsg  = systemHint ? `${text}\n\n[Coach context: ${systemHint}${moodCtx}]` : `${text}${moodCtx}`;

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(fullMsg)}&lang=${encodeURIComponent(lang.bcp47)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    let full = "";
    es.onmessage = (e) => {
      if (e.data === "[DONE]") {
        es.close(); setGenerating(false);
        setMessages(prev => prev.map(m => m.id===botId ? {...m, streaming:false} : m));
        speak(full);
        return;
      }
      full += e.data.replace(/\\n/g,"\n");
      setMessages(prev => prev.map(m => m.id===botId ? {...m, content:full} : m));
    };
    es.onerror = () => {
      es.close(); setGenerating(false);
      setMessages(prev => prev.map(m => m.id===botId ? {...m, content:"⚠️ Signal lost. Please retry.", streaming:false} : m));
    };
  }, [generating, lang, moodProfile, speak]);

  const sendReport = useCallback(() => {
    if (generating) return;
    const stats  = readUserStats();
    const prompt = buildReportPrompt(stats, lang);
    sendMessage("📊 Generate my weekly report", prompt);
  }, [generating, lang, sendMessage]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("gpt_chat3");
  };

  return {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat, speak};
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function Gpt() {
  const [lang,        setLang]        = useState(readLang);
  const [mode,        setMode]        = useState("therapy");    // therapy | habits | adaptive | report
  const [moodProfile, setMoodProfile] = useState(null);
  const [input,       setInput]       = useState("");
  const [panelOpen,   setPanelOpen]   = useState(false);
  const chatRef = useRef(null);

  const {messages, generating, voiceOn, setVoiceOn, sendMessage, sendReport, clearChat} = useChatEngine({lang, moodProfile});

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    const onFocus = () => setLang(readLang());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || generating) return;
    sendMessage(input);
    setInput("");
  };

  const handleAskCoach = (text) => {
    setMode("therapy");
    sendMessage(text);
  };

  // Therapy mode quick prompts (BetterHelp-style)
  const THERAPY_CHIPS = [
    "I feel anxious right now",
    "I'm overwhelmed — help",
    "Give me a CBT technique",
    "I can't sleep",
    "Help me stop overthinking",
    "I need motivation",
  ];

  // Active chip set based on mode + mood
  const activeChips = mode==="therapy"
    ? (moodProfile ? moodProfile.chips : THERAPY_CHIPS)
    : [];

  const stats = readUserStats();

  return (
    <div style={{
      minHeight:"100dvh", background:BG, color:TEXT, fontFamily:FONT,
      display:"flex", flexDirection:"column", alignItems:"center",
      overflow:"hidden", position:"relative",
    }}>

      {/* BG grid */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(255,200,60,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,60,.02) 1px,transparent 1px)`,
        backgroundSize:"44px 44px",
      }}/>

      {/* Ambient */}
      <div style={{
        position:"fixed",top:"18%",left:"50%",transform:"translateX(-50%)",
        width:500,height:250,pointerEvents:"none",
        background:`radial-gradient(ellipse,${GOLD}07 0%,transparent 70%)`,
        animation:"ge-pulse 5s ease-in-out infinite",
      }}/>

      {/* Scan line */}
      <div style={{
        position:"fixed",left:0,right:0,height:2,zIndex:5,pointerEvents:"none",
        background:`linear-gradient(90deg,transparent,${GOLD}22,${GOLD}55,${GOLD}22,transparent)`,
        animation:"ge-scan 5s linear infinite",
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

      {/* ─── MAIN WRAPPER ─── */}
      <div style={{
        position:"relative",zIndex:2,width:"min(480px,96vw)",
        display:"flex",flexDirection:"column",
        height:"100dvh",overflow:"hidden",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          flexShrink:0,
          borderBottom:`1px solid ${BOR}`,
          padding:"12px 0 10px",
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontFamily:HEAD,fontSize:26,letterSpacing:".05em",lineHeight:1,color:TEXT}}>
                🤖 AI COACH
              </div>
              <div style={{fontSize:6,letterSpacing:".2em",color:MUTED,textTransform:"uppercase",marginTop:2}}>
                Therapy · Habits · Mood-Adaptive · Report
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {/* Stats pills */}
              <div style={{display:"flex",gap:6}}>
                <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"4px 10px",textAlign:"center"}}>
                  <div style={{fontSize:6,color:MUTED,letterSpacing:".14em",textTransform:"uppercase"}}>Streak</div>
                  <div style={{fontFamily:HEAD,fontSize:14,color:GOLD}}>{stats.streak}d</div>
                </div>
                <div style={{background:CARD,border:`1px solid ${BOR}`,padding:"4px 10px",textAlign:"center"}}>
                  <div style={{fontSize:6,color:MUTED,letterSpacing:".14em",textTransform:"uppercase"}}>Level</div>
                  <div style={{fontFamily:HEAD,fontSize:14,color:GOLD}}>{stats.level}</div>
                </div>
              </div>
              {/* Lang indicator */}
              <div style={{fontSize:7,letterSpacing:".14em",color:SUB,textTransform:"uppercase",border:`1px solid ${BOR}`,padding:"4px 8px"}}>
                {lang.label}
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
            {COACH_MODES.map(m => (
              <button key={m.id} className="ge-btn" onClick={() => {
                setMode(m.id);
                if (m.id==="report") { setTimeout(sendReport, 100); setMode("therapy"); }
              }} style={{
                flexShrink:0,padding:"8px 12px",background:"transparent",
                border:"none",borderBottom:`2px solid ${mode===m.id?m.color:"transparent"}`,
                color:mode===m.id?m.color:MUTED,fontFamily:FONT,fontSize:7,
                letterSpacing:".14em",textTransform:"uppercase",whiteSpace:"nowrap",
                transition:"all .2s",
              }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SIDE PANEL for Habits / Adaptive ── */}
        {(mode==="habits" || mode==="adaptive") && (
          <div className="ge-up" style={{
            flex:1,overflowY:"auto",padding:"12px 0",
          }}>
            {mode==="habits"   && <HabitTracker    onAskCoach={handleAskCoach}/>}
            {mode==="adaptive" && <MoodAdaptivePanel onAskCoach={handleAskCoach} onSetMoodProfile={setMoodProfile}/>}
          </div>
        )}

        {/* ── THERAPY CHAT (shown when mode=therapy) ── */}
        {mode==="therapy" && (
          <>
            {/* Mood indicator pill */}
            {moodProfile && (
              <div style={{
                flexShrink:0,
                padding:"6px 0",
                borderBottom:`1px solid ${BOR}`,
                display:"flex",alignItems:"center",gap:8,
              }}>
                <div style={{
                  display:"flex",alignItems:"center",gap:8,
                  background:`${moodProfile.color}12`,border:`1px solid ${moodProfile.color}33`,
                  padding:"5px 12px",fontSize:8,color:moodProfile.color,
                  letterSpacing:".1em",textTransform:"uppercase",
                }}>
                  <span>{moodProfile.icon}</span>
                  <span>{moodProfile.persona} Mode Active</span>
                </div>
                <button className="ge-btn" onClick={() => setMoodProfile(null)} style={{
                  background:"transparent",border:"none",color:MUTED,fontSize:12,padding:"2px 6px",
                }}>×</button>
              </div>
            )}

            {/* Chat area */}
            <div ref={chatRef} style={{
              flex:1,overflowY:"auto",padding:"14px 0",
              display:"flex",flexDirection:"column",gap:10,
            }}>
              {messages.length===0 && (
                <div style={{margin:"auto",textAlign:"center",color:MUTED,padding:"40px 20px"}}>
                  <div style={{fontSize:44,marginBottom:16,animation:"ge-float 3s ease-in-out infinite"}}>🤖</div>
                  <div style={{fontFamily:HEAD,fontSize:18,color:TEXT,marginBottom:8,letterSpacing:".06em"}}>ManifiX AI Coach</div>
                  <div style={{fontSize:8,color:SUB,lineHeight:2.2,letterSpacing:".1em",textTransform:"uppercase"}}>
                    24/7 Therapy · Behavioral Coaching<br/>Mood-Adaptive · Weekly Reports
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16,flexWrap:"wrap"}}>
                    <div style={{fontSize:7,border:`1px solid ${BOR}`,padding:"3px 8px",color:SUB,letterSpacing:".1em"}}>Beats BetterHelp</div>
                    <div style={{fontSize:7,border:`1px solid ${BOR}`,padding:"3px 8px",color:SUB,letterSpacing:".1em"}}>Beats Noom</div>
                    <div style={{fontSize:7,border:`1px solid ${BOR}`,padding:"3px 8px",color:SUB,letterSpacing:".1em"}}>Beats Headspace</div>
                  </div>
                </div>
              )}

              {messages.map((msg,i) => (
                <div key={msg.id} className="ge-up" style={{
                  animationDelay:`${i*0.02}s`,
                  display:"flex",
                  flexDirection:"column",
                  alignItems:msg.role==="user"?"flex-end":"flex-start",
                }}>
                  {/* Role label */}
                  <div style={{
                    fontSize:6,letterSpacing:".18em",textTransform:"uppercase",
                    color:msg.role==="user"?`${GOLD}55`:SUB,
                    marginBottom:4,
                  }}>
                    {msg.role==="user"?"You":`${moodProfile?moodProfile.icon+" ":"🤖 "}ManifiX Coach`}
                  </div>

                  <div style={{
                    maxWidth:"88%",
                    background: msg.role==="user" ? `${GOLD}12` : CARD,
                    border:`1px solid ${msg.role==="user"?`${GOLD}33`:BOR}`,
                    padding:"12px 16px",
                    position:"relative",
                  }}>
                    {/* Streaming dots */}
                    {msg.streaming && !msg.content && (
                      <div style={{display:"flex",gap:5,alignItems:"center",height:20}}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{
                            width:6,height:6,borderRadius:"50%",background:GOLD,
                            animation:`ge-dot .9s ${i*.16}s ease-in-out infinite`,
                          }}/>
                        ))}
                      </div>
                    )}

                    <SimpleMarkdown text={msg.content}/>

                    {/* Message actions */}
                    {msg.role==="assistant" && !msg.streaming && msg.content && (
                      <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:`1px solid ${BOR}`}}>
                        <button className="ge-btn" title="Copy" onClick={() => navigator.clipboard.writeText(msg.content.replace(/[*#_`]/g,""))} style={{
                          background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                          fontSize:7,padding:"3px 8px",letterSpacing:".1em",textTransform:"uppercase",
                        }}>📋 Copy</button>
                        {msg.content.includes("Weekly Summary") && (
                          <button className="ge-btn" title="Share" onClick={() => {
                            const text = msg.content.replace(/[*#_`]/g,"").substring(0,600);
                            navigator.share ? navigator.share({title:"ManifiX Weekly Report",text}) : navigator.clipboard.writeText(text);
                          }} style={{
                            background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                            fontSize:7,padding:"3px 8px",letterSpacing:".1em",textTransform:"uppercase",
                          }}>↗ Share</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick chips */}
            {activeChips.length > 0 && (
              <div style={{
                flexShrink:0,
                display:"flex",gap:6,overflowX:"auto",
                padding:"8px 0",scrollbarWidth:"none",
                borderTop:`1px solid ${BOR}`,
              }}>
                {activeChips.map((c,i) => (
                  <button key={i} className="ge-btn ge-chip" onClick={() => sendMessage(c)} style={{
                    flexShrink:0,padding:"5px 12px",fontSize:7,letterSpacing:".1em",
                    background:"transparent",border:`1px solid ${BOR}`,
                    color:MUTED,fontFamily:FONT,textTransform:"uppercase",
                    whiteSpace:"nowrap",
                  }}>{c}</button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── INPUT AREA (only in therapy mode) ── */}
        {mode==="therapy" && (
          <div style={{
            flexShrink:0,
            borderTop:`1px solid ${BOR}`,
            padding:"10px 0 14px",
            display:"flex",flexDirection:"column",gap:8,
          }}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={moodProfile ? `${moodProfile.persona} is listening...` : "What's on your mind?"}
                rows={2}
                style={{
                  flex:1,background:CARD,border:`1px solid ${BOR}`,
                  color:TEXT,fontFamily:FONT,fontSize:11,letterSpacing:".04em",
                  padding:"10px 14px",lineHeight:1.7,
                }}
              />
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button className="ge-btn" onClick={() => setVoiceOn(v=>!v)} style={{
                  width:40,height:32,background:voiceOn?`${GOLD}22`:"transparent",
                  border:`1px solid ${voiceOn?GOLD:BOR}`,color:voiceOn?GOLD:MUTED,fontSize:14,
                }}>
                  {voiceOn?"🔊":"🔇"}
                </button>
                <button className="ge-btn" onClick={handleSend} disabled={generating||!input.trim()} style={{
                  width:40,height:40,
                  background:generating||!input.trim()?"#111":GOLD,
                  color:generating||!input.trim()?MUTED:"#080808",
                  border:generating||!input.trim()?`1px solid ${BOR}`:"none",
                  fontFamily:FONT,fontSize:16,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {generating ? (
                    <div style={{width:10,height:10,background:GOLD,animation:"ge-blink .6s infinite"}}/>
                  ) : "▲"}
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div style={{display:"flex",gap:6,justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:6}}>
                <button className="ge-btn ge-chip" onClick={sendReport} disabled={generating} style={{
                  padding:"5px 12px",fontSize:7,letterSpacing:".12em",
                  background:`${GOLD}12`,border:`1px solid ${GOLD}33`,
                  color:DIM,fontFamily:FONT,textTransform:"uppercase",
                }}>📊 Weekly Report</button>
                <button className="ge-btn ge-chip" onClick={() => setMode("adaptive")} style={{
                  padding:"5px 12px",fontSize:7,letterSpacing:".12em",
                  background:"transparent",border:`1px solid ${BOR}`,
                  color:MUTED,fontFamily:FONT,textTransform:"uppercase",
                }}>🎭 Mood Adapt</button>
              </div>
              {messages.length>0 && (
                <button className="ge-btn" onClick={clearChat} style={{
                  background:"transparent",border:`1px solid ${BOR}`,color:MUTED,fontFamily:FONT,
                  fontSize:7,letterSpacing:".12em",padding:"5px 10px",textTransform:"uppercase",
                }}>↺ Clear</button>
              )}
            </div>
          </div>
        )}

        {/* Footer for habit/adaptive modes — back to chat */}
        {(mode==="habits"||mode==="adaptive") && (
          <div style={{flexShrink:0,borderTop:`1px solid ${BOR}`,padding:"10px 0"}}>
            <button className="ge-btn" onClick={() => setMode("therapy")} style={{
              width:"100%",padding:"10px 0",background:"transparent",border:`1px solid ${BOR}`,
              color:MUTED,fontFamily:FONT,fontSize:8,letterSpacing:".16em",textTransform:"uppercase",
            }}>← Back to AI Chat</button>
          </div>
        )}
      </div>
    </div>
  );
}
