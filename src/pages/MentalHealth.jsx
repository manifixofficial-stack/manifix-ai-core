import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ════════════════════════════════════════════════════════════
   MANIFIX BLACK × GOLD — PALETTE
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
const BLUE   = "#60a5fa";
const PURPLE = "#a78bfa";

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
    @keyframes mh-streak{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    @keyframes mh-shimmer{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
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
   STORAGE HELPERS
════════════════════════════════════════════════════════════ */
const store = {
  get: (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

/* ════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════ */
const TIPS = [
  "Deep breathing reduces cortisol by 23% in 4 minutes.",
  "8 minutes of meditation improves focus for 4 hours.",
  "Daily movement lowers depression risk by 26%.",
  "Sleep quality is the #1 predictor of next-day mood.",
  "Mindfulness reduces burnout symptoms by 30% in 30 days.",
  "Gratitude journaling rewires neural reward pathways.",
  "Nature exposure reduces amygdala activity measurably.",
  "Cold exposure boosts norepinephrine 5× for 3 hours.",
  "5 minutes of box breathing lowers blood pressure significantly.",
  "Social connection is as important to health as not smoking.",
];

const WHO_STATS = [
  { value: "970M", label: "People with mental disorders globally" },
  { value: "67%",  label: "Workers experiencing burnout" },
  { value: "75%",  label: "People in LMICs with no treatment" },
  { value: "4:1",  label: "ROI of mental health investment" },
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

/* ─── CRISIS RESOURCES ─── */
const CRISIS_RESOURCES = [
  { name: "iCall (India)", contact: "9152987821", type: "call" },
  { name: "Vandrevala Foundation", contact: "1860-2662-345", type: "call" },
  { name: "iCall WhatsApp", contact: "wa.me/919152987821", type: "link" },
  { name: "International SOS", contact: "findahelpline.com", type: "link" },
];

/* ─── SOUNDSCAPES ─── */
const SOUNDSCAPES = [
  { id: "rain",      label: "Rain",         emoji: "🌧",  freq: 200, type: "brown" },
  { id: "ocean",     label: "Ocean waves",  emoji: "🌊",  freq: 120, type: "pink"  },
  { id: "forest",    label: "Forest",       emoji: "🌲",  freq: 280, type: "white" },
  { id: "fire",      label: "Fireplace",    emoji: "🔥",  freq: 90,  type: "brown" },
  { id: "cafe",      label: "Café noise",   emoji: "☕",  freq: 350, type: "pink"  },
  { id: "space",     label: "Deep space",   emoji: "🌌",  freq: 60,  type: "brown" },
];

/* ─── MEDITATION PROGRAMS ─── */
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
      { day: 1, title: "Anchor Breath",     duration: "8 min",  focus: "Breathing",  done: false, desc: "Learn the foundation of mindfulness through breath awareness." },
      { day: 2, title: "Body Scan Release", duration: "10 min", focus: "Body",       done: false, desc: "Progressive muscle relaxation to release stored tension." },
      { day: 3, title: "Thought Observer",  duration: "8 min",  focus: "Mind",       done: false, desc: "Watch thoughts without attachment — the core skill." },
      { day: 4, title: "Gratitude Pulse",   duration: "7 min",  focus: "Emotion",    done: false, desc: "Rewire your brain's reward circuit through gratitude." },
      { day: 5, title: "Open Awareness",    duration: "12 min", focus: "Presence",   done: false, desc: "Expand into spacious, non-directive awareness." },
      { day: 6, title: "Loving Kindness",   duration: "10 min", focus: "Compassion", done: false, desc: "Metta meditation to dissolve self-criticism." },
      { day: 7, title: "Integration",       duration: "15 min", focus: "Synthesis",  done: false, desc: "Consolidate your week — build your daily anchor." },
    ],
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
      { day: 1, title: "Single-Point Focus", duration: "10 min", focus: "Attention",  done: false, desc: "Fix awareness on a single object without wandering." },
      { day: 2, title: "Return Drill",       duration: "10 min", focus: "Recovery",   done: false, desc: "Each return from distraction strengthens focus muscle." },
      { day: 3, title: "Sensory Gate",       duration: "12 min", focus: "Senses",     done: false, desc: "Gate perception to one sense — sharpen the signal." },
      { day: 4, title: "Time Dilation",      duration: "15 min", focus: "Duration",   done: false, desc: "Extend sits to deepen concentration capacity." },
      { day: 5, title: "Noting Practice",    duration: "12 min", focus: "Labelling",  done: false, desc: "Mental noting technique to stabilize the wandering mind." },
      { day: 6, title: "Jhana Touch",        duration: "15 min", focus: "Absorption", done: false, desc: "First taste of meditative absorption — deep calm." },
      { day: 7, title: "Flow State Entry",   duration: "20 min", focus: "Flow",       done: false, desc: "Conditions for entering cognitive flow through stillness." },
    ],
  },
  {
    id: "anxiety-pack",
    title: "Anxiety Relief",
    subtitle: "Clinical-Grade Calm",
    days: 10,
    badge: "ANXIETY",
    badgeColor: BLUE,
    icon: "🫁",
    description: "Clinically validated techniques. Combines MBSR, CBT, and somatic methods for anxiety and panic.",
    sessions: [
      { day: 1, title: "Physiological Sigh",   duration: "5 min",  focus: "Nervous System", done: false, desc: "Double-inhale through nose, slow exhale. Fastest cortisol drop." },
      { day: 2, title: "Box Breathing 4-4-4-4", duration: "8 min", focus: "Regulation",     done: false, desc: "Navy SEAL technique for immediate calm under stress." },
      { day: 3, title: "5-4-3-2-1 Grounding",  duration: "6 min",  focus: "Grounding",      done: false, desc: "Sensory grounding to stop a panic spiral." },
      { day: 4, title: "RAIN Technique",        duration: "10 min", focus: "Emotion",        done: false, desc: "Recognize, Allow, Investigate, Nurture — anxiety antidote." },
      { day: 5, title: "Vagus Nerve Hum",       duration: "7 min",  focus: "Vagal Tone",     done: false, desc: "Humming activates vagus nerve to shut off fight-or-flight." },
      { day: 6, title: "Worry Window",          duration: "8 min",  focus: "CBT",            done: false, desc: "Schedule worry to contain it — CBT gold standard." },
      { day: 7, title: "Safe Place Viz",        duration: "12 min", focus: "Imagery",        done: false, desc: "Build a neural safe space you can access anywhere." },
    ],
  },
  {
    id: "depression-pack",
    title: "Mood Lift",
    subtitle: "Depression Support",
    days: 14,
    badge: "DEPRESSION",
    badgeColor: PURPLE,
    icon: "🌅",
    description: "Behavioral activation + mindfulness. Evidence-based approach combining MBCT and positive neuroplasticity.",
    sessions: [
      { day: 1, title: "Morning Activation",  duration: "8 min",  focus: "Activation", done: false, desc: "Behavioral activation to break the inertia of low mood." },
      { day: 2, title: "Pleasure Mapping",    duration: "10 min", focus: "Reward",     done: false, desc: "Reconnect with activities that generate genuine pleasure." },
      { day: 3, title: "Self-Compassion Sit", duration: "12 min", focus: "Kindness",   done: false, desc: "Treat yourself as you would a suffering friend." },
      { day: 4, title: "Energy Breath",       duration: "7 min",  focus: "Vitality",   done: false, desc: "Kapalabhati pranayama — breathwork to boost energy." },
      { day: 5, title: "Negative to Neutral", duration: "10 min", focus: "Reframe",    done: false, desc: "MBCT technique: observe depression thoughts without fusion." },
      { day: 6, title: "Small Wins Log",      duration: "6 min",  focus: "Progress",   done: false, desc: "Rebuild self-efficacy by documenting tiny wins daily." },
      { day: 7, title: "Future Self Letter",  duration: "15 min", focus: "Hope",       done: false, desc: "Write to your future self — activates prospection circuits." },
    ],
  },
  {
    id: "sleep-stories",
    title: "Sleep Stories",
    subtitle: "Calm's #1 Feature — Defeated",
    days: 5,
    badge: "SLEEP",
    badgeColor: "#818cf8",
    icon: "🌙",
    description: "AI-narrated sleep stories combined with guided body scans. Fall asleep faster — clinically proven.",
    sessions: [
      { day: 1, title: "Forest Path",       duration: "15 min", focus: "Sleep story",  done: false, desc: "Walk through an ancient forest as your body releases tension layer by layer." },
      { day: 2, title: "Ocean Drift",       duration: "18 min", focus: "Sleep story",  done: false, desc: "Float on warm ocean waves as each breath carries you deeper into rest." },
      { day: 3, title: "Mountain Descent",  duration: "20 min", focus: "Body scan",    done: false, desc: "A progressive body scan descending from mountain peak to valley floor." },
      { day: 4, title: "Starfield",         duration: "12 min", focus: "Visualization",done: false, desc: "Drift through a silent starfield — consciousness expands, body dissolves." },
      { day: 5, title: "Rain on Leaves",    duration: "16 min", focus: "Sleep story",  done: false, desc: "Settle into a forest cabin as rain falls and every muscle releases." },
    ],
  },
];

/* ─── CBT ─── */
const DISTORTIONS = [
  "All-or-Nothing", "Catastrophizing", "Mind Reading", "Fortune Telling",
  "Emotional Reasoning", "Should Statements", "Personalization", "Overgeneralization",
  "Mental Filter", "Discounting Positives", "Labelling", "Magnification",
];

const CBT_EXERCISES = [
  { id: "thought-record",         title: "Thought Record",        icon: "📋", desc: "Identify & challenge automatic negative thoughts",           steps: ["Situation", "Automatic Thought", "Emotions (0–100%)", "Cognitive Distortions", "Evidence FOR", "Evidence AGAINST", "Balanced Thought", "Outcome Emotions"] },
  { id: "behavioral-experiment",  title: "Behavioral Experiment", icon: "🔬", desc: "Test anxious predictions against reality",                   steps: ["Prediction", "Fear Rating", "Action Plan", "Actual Outcome", "What Learned"] },
  { id: "worry-time",             title: "Scheduled Worry",       icon: "⏰", desc: "Contain worry to 15 min daily — proven to cut anxiety 40%", steps: ["Worry Topic", "Postpone Until", "Productive Action Now", "Worry Resolved?"] },
  { id: "activity-scheduling",    title: "Activity Scheduling",   icon: "📅", desc: "Behavioral activation for depression — plan mastery + pleasure", steps: ["Activity", "Mastery Rating", "Pleasure Rating", "Scheduled Time", "Completed?"] },
  { id: "core-beliefs",           title: "Core Belief Audit",     icon: "🔑", desc: "Uncover deep beliefs driving your patterns",                 steps: ["Surface Belief", "Downward Arrow (Why?×5)", "Core Belief Found", "Evidence Against It", "New Adaptive Belief"] },
];

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════════════════════ */
const Card = ({ children, style = {}, className = "" }) => (
  <div className={`mh-card-h ${className}`} style={{ background: CARD, border: `1px solid ${BOR}`, padding: 18, ...style }}>
    {children}
  </div>
);

const Label = ({ children, color = MUTED }) => (
  <div style={{ fontSize: 7, letterSpacing: ".2em", color, textTransform: "uppercase", marginBottom: 6 }}>
    {children}
  </div>
);

const Badge = ({ children, color = GOLD }) => (
  <span style={{
    fontSize: 6, letterSpacing: ".16em", padding: "2px 7px",
    background: `${color}22`, color, border: `1px solid ${color}44`,
    textTransform: "uppercase", fontFamily: FONT,
  }}>{children}</span>
);

/* ════════════════════════════════════════════════════════════
   STREAK TRACKER
════════════════════════════════════════════════════════════ */
function useStreak() {
  const today = new Date().toDateString();
 const data = store.get("mh_streak", { lastDate: "", streak: 0, longest: 0 });

  const checkIn = useCallback(() => {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = data.lastDate === yesterday ? data.streak + 1 : data.lastDate === today ? data.streak : 1;
    const newLongest = Math.max(newStreak, data.longest);
    const updated = { lastDate: today, streak: newStreak, longest: newLongest };
    store.set("mh_streak", updated);
    return updated;
  }, [data, today]);

  const todayDone = data.lastDate === today;
  return { streak: data.streak, longest: data.longest, todayDone, checkIn };
}

/* ════════════════════════════════════════════════════════════
   CRISIS BANNER (Teladoc feature — safety net)
════════════════════════════════════════════════════════════ */
function CrisisBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="mh-btn" onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "10px 14px", background: "#140808",
        border: `1px solid ${RED}44`, color: RED, fontFamily: FONT,
        fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>⚠ Crisis Support Resources</span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ background: "#100808", border: `1px solid ${RED}22`, borderTop: "none", padding: "14px 16px" }}>
          <div style={{ fontSize: 8, color: "#f87171", lineHeight: 1.8, marginBottom: 12 }}>
            If you are in crisis or having thoughts of self-harm, please reach out immediately. You are not alone.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CRISIS_RESOURCES.map(r => (
              <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid #1a0a0a`, paddingBottom: 8 }}>
                <div style={{ fontSize: 9, color: TEXT }}>{r.name}</div>
                {r.type === "call" ? (
                  <a href={`tel:${r.contact}`} style={{
                    fontSize: 9, color: RED, fontFamily: FONT, letterSpacing: ".08em",
                    background: `${RED}11`, border: `1px solid ${RED}33`, padding: "4px 10px",
                    textDecoration: "none",
                  }}>{r.contact}</a>
                ) : (
                  <a href={`https://${r.contact}`} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 9, color: BLUE, fontFamily: FONT, letterSpacing: ".08em",
                    background: `${BLUE}11`, border: `1px solid ${BLUE}33`, padding: "4px 10px",
                    textDecoration: "none",
                  }}>Open →</a>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 7, color: "#444", marginTop: 10, letterSpacing: ".08em", lineHeight: 1.7 }}>
            ManifiX AI is not a substitute for professional mental health care. If you are in immediate danger, call emergency services (112 in India / 911 in the US).
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SOUNDSCAPES (Beats Calm's ambient audio)
════════════════════════════════════════════════════════════ */
function SoundscapesTab() {
  const [active, setActive] = useState<string | null>(null);
  const [vol, setVol] = useState(60);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src: AudioBufferSourceNode; gain: GainNode } | null>(null);

  const stopSound = useCallback(() => {
    if (nodesRef.current) {
      try { nodesRef.current.src.stop(); } catch {}
      nodesRef.current = null;
    }
    setActive(null);
  }, []);

  const playSound = useCallback((s: typeof SOUNDSCAPES[0]) => {
    if (active === s.id) { stopSound(); return; }
    stopSound();
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = ctxRef.current;
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Generate noise type
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      if (s.type === "brown") {
        b0 = (b0 + 0.02 * white) / 1.02;
        data[i] = b0 * 3.5;
      } else if (s.type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.3;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = vol / 100;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    nodesRef.current = { src, gain };
    setActive(s.id);
  }, [active, vol, stopSound]);

  useEffect(() => {
    if (nodesRef.current) nodesRef.current.gain.gain.value = vol / 100;
  }, [vol]);

  useEffect(() => () => stopSound(), []);

  return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Ambient Soundscapes — Beats Calm</Label>
        <Badge color={BLUE}>6 SOUNDS</Badge>
      </div>

      <div style={{ background: `${BLUE}11`, border: `1px solid ${BLUE}22`, padding: "10px 14px", fontSize: 8, color: `${BLUE}cc`, lineHeight: 1.7, letterSpacing: ".06em" }}>
        ✦ Brown noise · Pink noise · White noise · Infinite loop · Volume control · Works offline
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {SOUNDSCAPES.map(s => (
          <button key={s.id} className="mh-btn mh-card-h" onClick={() => playSound(s)} style={{
            background: active === s.id ? `${BLUE}18` : CARD,
            border: `1px solid ${active === s.id ? BLUE : BOR}`,
            padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: 6, textAlign: "left",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 28, animation: active === s.id ? "mh-float 2s ease-in-out infinite" : "none" }}>{s.emoji}</span>
              {active === s.id && (
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ width: 3, background: BLUE, borderRadius: 1, animation: `mh-blink .6s ${i * 0.15}s ease-in-out infinite`, height: `${8 + i * 4}px` }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontFamily: HEAD, fontSize: 15, color: active === s.id ? BLUE : TEXT }}>{s.label}</div>
            <div style={{ fontSize: 7, color: SUB, letterSpacing: ".1em", textTransform: "uppercase" }}>{s.type} noise</div>
          </button>
        ))}
      </div>

      {active && (
        <Card>
          <Label>Volume: {vol}%</Label>
          <input type="range" min={0} max={100} value={vol} step={1}
            onChange={e => setVol(Number(e.target.value))}
            style={{ width: "100%", accentColor: BLUE, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: MUTED, letterSpacing: ".1em", marginTop: 4 }}>
            <span>SILENT</span><span>LOUD</span>
          </div>
          <button className="mh-btn" onClick={stopSound} style={{
            marginTop: 12, width: "100%", padding: "10px 0", background: "transparent",
            border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 8,
            letterSpacing: ".14em", textTransform: "uppercase",
          }}>■ Stop Sound</button>
        </Card>
      )}

      {/* Sleep + sound tip */}
      <div style={{ background: "#0a0d14", border: `1px solid ${BLUE}22`, padding: "12px 14px" }}>
        <Label color={`${BLUE}88`}>Sleep Science Tip</Label>
        <div style={{ fontSize: 9, color: SUB, lineHeight: 1.8 }}>
          Brown noise masks sudden sounds that wake you, while pink noise aligns with brain waves during deep sleep. Try 40–60% volume in a loop throughout the night.
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MEDITATION TIMER
════════════════════════════════════════════════════════════ */
function MeditationTimer({ session, onClose, onComplete }: {
  session: { title: string; duration: string; focus: string; desc: string; day: number; done: boolean };
  onClose: () => void;
  onComplete: (s: typeof session) => void;
}) {
  const [phase, setPhase]     = useState<"ready" | "running" | "paused" | "done">("ready");
  const [elapsed, setElapsed] = useState(0);
  const totalSec = parseInt(session.duration) * 60;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setPhase("running");
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalSec) { clearInterval(timerRef.current!); setPhase("done"); return totalSec; }
        return e + 1;
      });
    }, 1000);
  };

  const pause = () => { clearInterval(timerRef.current!); setPhase("paused"); };

  const resume = () => {
    setPhase("running");
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= totalSec) { clearInterval(timerRef.current!); setPhase("done"); return totalSec; }
        return e + 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const remaining = totalSec - elapsed;
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const pct  = totalSec > 0 ? elapsed / totalSec : 0;
  const r    = 72;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);

  // Breathing phase label
  const breathCycle = elapsed % 16;
  const breathLabel = breathCycle < 4 ? "Inhale..." : breathCycle < 8 ? "Hold..." : breathCycle < 12 ? "Exhale..." : "Hold...";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#040404f0", zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 20, padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: HEAD, fontSize: 28, color: GOLD, letterSpacing: ".06em" }}>{session.title}</div>
        <div style={{ fontSize: 8, color: SUB, letterSpacing: ".16em", textTransform: "uppercase", marginTop: 4 }}>{session.focus} · {session.duration}</div>
      </div>

      <div style={{ position: "relative", width: 180, height: 180 }}>
        {phase === "running" && (
          <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: `1px solid ${GOLD}22`, animation: "mh-ring 2.5s ease-out infinite" }} />
        )}
        <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke={BOR} strokeWidth={6} />
          <circle cx={90} cy={90} r={r} fill="none" stroke={GOLD} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={dash}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset .9s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {phase === "done" ? (
            <div style={{ fontSize: 42 }}>✨</div>
          ) : (
            <>
              <div style={{ fontFamily: HEAD, fontSize: 38, color: TEXT, lineHeight: 1 }}>{mins}:{secs}</div>
              <div style={{ fontSize: 7, color: MUTED, letterSpacing: ".18em", textTransform: "uppercase", marginTop: 4 }}>
                {phase === "running" ? "FOCUS" : phase === "paused" ? "PAUSED" : "READY"}
              </div>
            </>
          )}
        </div>
      </div>

      {phase === "running" && (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%", margin: "0 auto 10px",
            background: `radial-gradient(circle,${GOLD}33,transparent 70%)`,
            animation: "mh-breathe 8s ease-in-out infinite",
          }} />
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: ".12em", marginBottom: 2 }}>{breathLabel}</div>
          <div style={{ fontSize: 7, color: SUB, letterSpacing: ".14em", textTransform: "uppercase" }}>4-4-4-4 box breath</div>
        </div>
      )}

      {phase === "done" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: HEAD, fontSize: 22, color: GREEN, marginBottom: 6 }}>Session Complete ✓</div>
          <div style={{ fontSize: 9, color: SUB, lineHeight: 1.7, maxWidth: 280 }}>{session.desc}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {phase === "ready"   && <button className="mh-btn" onClick={start}  style={{ padding: "13px 32px", background: GOLD,        color: "#080808", border: "none",               fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>▶ Begin</button>}
        {phase === "running" && <button className="mh-btn" onClick={pause}  style={{ padding: "13px 32px", background: "transparent", color: GOLD,      border: `1px solid ${GOLD}44`, fontFamily: FONT, fontSize: 11,               letterSpacing: ".18em", textTransform: "uppercase" }}>⏸ Pause</button>}
        {phase === "paused"  && <button className="mh-btn" onClick={resume} style={{ padding: "13px 32px", background: GOLD,          color: "#080808", border: "none",               fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>▶ Resume</button>}
        {phase === "done"    && <button className="mh-btn" onClick={() => { onComplete(session); onClose(); }} style={{ padding: "13px 32px", background: GREEN, color: "#080808", border: "none", fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>✓ Complete</button>}
        <button className="mh-btn" onClick={onClose} style={{ padding: "13px 20px", background: "transparent", color: SUB, border: `1px solid ${BOR}`, fontFamily: FONT, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>✕ Close</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GUIDED MEDITATION TAB
════════════════════════════════════════════════════════════ */
function GuidedMeditationTab() {
  const [programs, setPrograms] = useState(() => store.get("mh_programs", MEDITATION_PROGRAMS));
  const [selected, setSelected] = useState<string | null>(null);
  const [timerSess, setTimerSess] = useState<any>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const { checkIn } = useStreak();

  const prog = programs.find((p: any) => p.id === selected);

  const completeSession = useCallback((session: any) => {
    setPrograms((prev: any[]) => {
      const updated = prev.map((p: any) => {
        if (p.id !== selected) return p;
        return { ...p, sessions: p.sessions.map((s: any) => s.day === session.day ? { ...s, done: true } : s) };
      });
      store.set("mh_programs", updated);
      return updated;
    });
    checkIn();
  }, [selected, checkIn]);

  const getProgress = (p: any) => {
    const done = p.sessions.filter((s: any) => s.done).length;
    return { done, total: p.sessions.length, pct: Math.round((done / p.sessions.length) * 100) };
  };

  if (timerSess) return (
    <MeditationTimer session={timerSess} onClose={() => setTimerSess(null)} onComplete={completeSession} />
  );

  if (view === "detail" && prog) {
    const { done, total, pct } = getProgress(prog);
    const nextSession = prog.sessions.find((s: any) => !s.done);
    return (
      <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${BOR}` }}>
          <button className="mh-btn" onClick={() => { setView("list"); setSelected(null); }} style={{ background: "transparent", border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", padding: "6px 12px", textTransform: "uppercase" }}>← Back</button>
          <div>
            <div style={{ fontFamily: HEAD, fontSize: 20, color: TEXT }}>{prog.icon} {prog.title}</div>
            <div style={{ fontSize: 7, color: SUB, letterSpacing: ".12em", textTransform: "uppercase" }}>{prog.subtitle}</div>
          </div>
          <Badge color={prog.badgeColor}>{prog.badge}</Badge>
        </div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Label>Your Progress</Label>
            <div style={{ fontFamily: HEAD, fontSize: 20, color: prog.badgeColor }}>{pct}%</div>
          </div>
          <div style={{ height: 6, background: "#111", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: prog.badgeColor, borderRadius: 3, transition: "width .8s ease" }} />
          </div>
          <div style={{ fontSize: 8, color: SUB, letterSpacing: ".1em" }}>{done} of {total} sessions · {total - done} remaining</div>
        </Card>

        {nextSession && (
          <div style={{ background: `linear-gradient(135deg,#0a0806,#120e04)`, border: `1px solid ${GOLD}33`, padding: 18 }}>
            <Label color={`${GOLD}88`}>Next Session</Label>
            <div style={{ fontFamily: HEAD, fontSize: 22, color: GOLD, marginBottom: 6 }}>Day {nextSession.day}: {nextSession.title}</div>
            <div style={{ fontSize: 8, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>{nextSession.desc}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <Badge color={GOLD}>{nextSession.duration}</Badge>
              <Badge color={`${GOLD}88`}>{nextSession.focus}</Badge>
            </div>
            <button className="mh-btn" onClick={() => setTimerSess(nextSession)} style={{ padding: "12px 24px", background: GOLD, color: "#080808", border: "none", fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>
              🧘 Start Session
            </button>
          </div>
        )}

        {!nextSession && (
          <div style={{ border: "1px solid #1e4d1e", background: "#0a140a", padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: HEAD, fontSize: 22, color: GREEN, marginBottom: 6 }}>Program Complete!</div>
            <div style={{ fontSize: 9, color: SUB, lineHeight: 1.7 }}>You've completed the full {prog.title} program.</div>
          </div>
        )}

        <Label>All Sessions</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {prog.sessions.map((s: any) => (
            <div key={s.day} className="mh-card-h" onClick={() => !s.done && setTimerSess(s)} style={{
              background: s.done ? "#0a140a" : CARD,
              border: `1px solid ${s.done ? "#1e4d1e" : BOR}`,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
              cursor: s.done ? "default" : "pointer",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: s.done ? `${GREEN}22` : MUTED,
                border: `1px solid ${s.done ? GREEN : BOR}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: s.done ? 14 : 9, color: s.done ? GREEN : SUB,
              }}>
                {s.done ? "✓" : s.day}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: s.done ? GREEN : TEXT, letterSpacing: ".06em", marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 7, color: SUB, letterSpacing: ".1em" }}>{s.focus} · {s.duration}</div>
              </div>
              {!s.done && <div style={{ fontSize: 9, color: MUTED }}>▶</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Guided Programs — Beats Headspace + Calm</Label>
        <Badge color={GOLD}>5 PROGRAMS</Badge>
      </div>
      <div style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}22`, padding: "10px 14px", fontSize: 8, color: `${GOLD}cc`, lineHeight: 1.7, letterSpacing: ".06em" }}>
        ✦ 7-day · 21-day · Anxiety pack · Depression pack · Sleep stories (NEW) · Timer + breathing guide
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {programs.map((p: any) => {
          const { done, total, pct } = getProgress(p);
          return (
            <div key={p.id} className="mh-card-h" onClick={() => { setSelected(p.id); setView("detail"); }} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "16px 18px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 28, flexShrink: 0, animation: "mh-float 3s ease-in-out infinite" }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 18, color: TEXT }}>{p.title}</div>
                    <Badge color={p.badgeColor}>{p.badge}</Badge>
                  </div>
                  <div style={{ fontSize: 7, color: SUB, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>{p.subtitle} · {p.days} Days</div>
                  <div style={{ fontSize: 8, color: SUB, lineHeight: 1.7 }}>{p.description}</div>
                </div>
              </div>
              <div style={{ height: 3, background: "#111", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: p.badgeColor, transition: "width .8s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 7, color: MUTED, letterSpacing: ".1em" }}>{done}/{total} sessions done</div>
                <div style={{ fontSize: 8, color: p.badgeColor, fontWeight: 700 }}>{pct > 0 ? `${pct}% COMPLETE` : "START →"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CBT TAB — now with Core Belief Audit + weekly analytics
════════════════════════════════════════════════════════════ */
function CBTTab() {
  const [activeEx, setActiveEx]   = useState<string | null>(null);
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [distorts, setDistorts]   = useState<string[]>([]);
  const [saved, setSaved]         = useState(false);
  const [history, setHistory]     = useState<any[]>(() => store.get("mh_cbt", []));
  const [aiReframe, setAiReframe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const ex = CBT_EXERCISES.find(e => e.id === activeEx);

  // Weekly distortion analytics
  const distortionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((r: any) => {
      (r.distortions || []).forEach((d: string) => { counts[d] = (counts[d] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);

  const saveRecord = useCallback(async () => {
    if (!ex) return;
    const record = { id: Date.now(), exercise: ex.title, date: new Date().toDateString(), answers, distortions: distorts };
    const updated = [record, ...history].slice(0, 30);
    setHistory(updated);
    store.set("mh_cbt", updated);
    setSaved(true);

    const thought = answers["Automatic Thought"] || answers["Worry Topic"] || answers["Surface Belief"] || "";
    if (thought) {
      setAiLoading(true);
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: `You are a CBT therapist. A client has the thought: "${thought}". ${distorts.length ? `Distortions: ${distorts.join(", ")}.` : ""} Give a compassionate, evidence-based balanced reframe in 2-3 sentences. Be warm, practical, specific.` }],
          }),
        });
        const data = await resp.json();
        setAiReframe(data.content?.find((c: any) => c.type === "text")?.text || "");
      } catch {
        setAiReframe("Great work completing this. Challenging negative thoughts takes courage — you're building real cognitive resilience.");
      }
      setAiLoading(false);
    }
  }, [ex, answers, distorts, history]);

  if (!activeEx) return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>CBT Thought Restructuring — Beats BetterHelp</Label>
        <Badge color={BLUE}>5 TOOLS</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CBT_EXERCISES.map(e => (
          <button key={e.id} className="mh-btn mh-card-h" onClick={() => { setActiveEx(e.id); setStep(0); setAnswers({}); setDistorts([]); setSaved(false); setAiReframe(""); }} style={{
            background: CARD, border: `1px solid ${BOR}`, padding: "16px 14px",
            textAlign: "left", display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ fontSize: 26 }}>{e.icon}</div>
            <div style={{ fontFamily: HEAD, fontSize: 14, color: TEXT }}>{e.title}</div>
            <div style={{ fontSize: 7, color: SUB, lineHeight: 1.7, letterSpacing: ".04em" }}>{e.desc}</div>
            <div style={{ fontSize: 7, color: MUTED, letterSpacing: ".12em", marginTop: 4 }}>{e.steps.length} STEPS →</div>
          </button>
        ))}
      </div>

      {/* Distortion Analytics */}
      {distortionCounts.length > 0 && (
        <Card>
          <Label>Your Top Cognitive Distortions</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {distortionCounts.map(([name, count]) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: TEXT, marginBottom: 4, letterSpacing: ".04em" }}>
                  <span>{name}</span>
                  <span style={{ color: MUTED }}>{count}×</span>
                </div>
                <div style={{ height: 4, background: "#111", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(100, count * 20)}%`, background: BLUE, borderRadius: 2, transition: "width .8s" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 7, color: MUTED, marginTop: 10, letterSpacing: ".08em" }}>Patterns from {history.length} completed records</div>
        </Card>
      )}

      {history.length > 0 && (
        <>
          <Label>Recent Records</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.slice(0, 4).map((r: any) => (
              <div key={r.id} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: TEXT, marginBottom: 2 }}>{r.exercise}</div>
                  <div style={{ fontSize: 7, color: MUTED, letterSpacing: ".1em" }}>{r.date}</div>
                </div>
                <Badge color={BLUE}>DONE</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const currentStep = ex!.steps[step];
  const isDistortStep = currentStep === "Cognitive Distortions";

  return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${BOR}` }}>
        <button className="mh-btn" onClick={() => setActiveEx(null)} style={{ background: "transparent", border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", padding: "6px 12px", textTransform: "uppercase" }}>← Back</button>
        <div>
          <div style={{ fontFamily: HEAD, fontSize: 18, color: TEXT }}>{ex!.icon} {ex!.title}</div>
          <div style={{ fontSize: 7, color: SUB, letterSpacing: ".12em", textTransform: "uppercase" }}>Step {step + 1} of {ex!.steps.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {ex!.steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, background: i <= step ? GOLD : BOR, borderRadius: 2, transition: "background .3s" }} />
        ))}
      </div>

      {!saved ? (
        <Card>
          <Label>{currentStep}</Label>
          {isDistortStep ? (
            <>
              <div style={{ fontSize: 8, color: SUB, marginBottom: 10, lineHeight: 1.7 }}>Select all distortions you notice:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DISTORTIONS.map(d => (
                  <button key={d} className="mh-btn" onClick={() => setDistorts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} style={{
                    padding: "5px 10px", fontSize: 7, letterSpacing: ".1em",
                    background: distorts.includes(d) ? `${GOLD}22` : CARD,
                    border: `1px solid ${distorts.includes(d) ? GOLD : BOR}`,
                    color: distorts.includes(d) ? GOLD : SUB, fontFamily: FONT, textTransform: "uppercase",
                  }}>{d}</button>
                ))}
              </div>
            </>
          ) : (
            <textarea
              value={answers[currentStep] || ""}
              onChange={e => setAnswers(a => ({ ...a, [currentStep]: e.target.value }))}
              placeholder={`Write your ${currentStep.toLowerCase()}...`}
              rows={4}
              style={{ width: "100%", background: "#070707", border: `1px solid ${BOR}`, color: TEXT, fontFamily: FONT, fontSize: 11, letterSpacing: ".04em", padding: "10px 12px", outline: "none", resize: "vertical", lineHeight: 1.8 }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Label color={GREEN}>Record Saved ✓</Label>
          <div style={{ fontFamily: HEAD, fontSize: 18, color: GREEN, marginBottom: 10 }}>Great work!</div>
          {aiLoading ? (
            <div style={{ fontSize: 9, color: MUTED, animation: "mh-blink .8s infinite", letterSpacing: ".12em", textTransform: "uppercase" }}>AI generating reframe...</div>
          ) : aiReframe ? (
            <>
              <Label color={`${GOLD}88`}>AI Balanced Reframe</Label>
              <div style={{ fontSize: 10, color: TEXT, lineHeight: 1.9, background: `${GOLD}08`, border: `1px solid ${GOLD}22`, padding: "12px 14px" }}>{aiReframe}</div>
            </>
          ) : null}
        </Card>
      )}

      {!saved && (
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button className="mh-btn" onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "12px 0", background: "transparent", border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase" }}>← Previous</button>
          )}
          {step < ex!.steps.length - 1 ? (
            <button className="mh-btn" onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: "12px 0", background: GOLD, color: "#080808", border: "none", fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>Next Step →</button>
          ) : (
            <button className="mh-btn" onClick={saveRecord} style={{ flex: 2, padding: "12px 0", background: GREEN, color: "#080808", border: "none", fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>✓ Save Record</button>
          )}
        </div>
      )}
      {saved && (
        <button className="mh-btn" onClick={() => setActiveEx(null)} style={{ width: "100%", padding: "12px 0", background: "transparent", border: `1px solid ${BOR}`, color: SUB, fontFamily: FONT, fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase" }}>← Back to Exercises</button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MOOD JOURNAL TAB
════════════════════════════════════════════════════════════ */
function MoodJournalTab() {
  const [moodLog, setMoodLog]    = useState<any[]>(() => store.get("mh_moods2", []));
  const [selMood, setSelMood]    = useState<any>(null);
  const [note, setNote]          = useState("");
  const [saved, setSaved]        = useState(false);
  const [emotions, setEmotions]  = useState<string[]>([]);
  const [energy, setEnergy]      = useState(5);
  const [aiInsight, setAiInsight]= useState("");
  const [aiLoading, setAiLoading]= useState(false);
  const { streak, checkIn }      = useStreak();

  const MOODS = [
    { emoji: "😭", label: "Terrible", score: 1 }, { emoji: "😢", label: "Sad",     score: 2 },
    { emoji: "😕", label: "Low",      score: 3 }, { emoji: "😐", label: "Meh",     score: 5 },
    { emoji: "🙂", label: "Okay",     score: 6 }, { emoji: "😊", label: "Good",    score: 7 },
    { emoji: "😄", label: "Happy",    score: 8 }, { emoji: "🤩", label: "Great",   score: 10 },
  ];

  const EMOTION_CHIPS = [
    "Anxious", "Calm", "Grateful", "Overwhelmed", "Hopeful", "Lonely",
    "Focused", "Irritable", "Content", "Sad", "Excited", "Numb",
    "Confident", "Stressed", "Peaceful", "Angry",
  ];

  const logMood = useCallback(async () => {
    if (!selMood) return;
    const entry = {
      id: Date.now(), date: new Date().toDateString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      score: selMood.score, emoji: selMood.emoji, label: selMood.label,
      note, emotions, energy,
    };
    const updated = [entry, ...moodLog].slice(0, 60);
    setMoodLog(updated);
    store.set("mh_moods2", updated);
    setSaved(true);
    checkIn();
    setAiLoading(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `You are a compassionate mental health coach. Someone logged: ${selMood.label} (${selMood.score}/10). Emotions: ${emotions.join(", ") || "not specified"}. Energy: ${energy}/10. ${note ? `Note: "${note}"` : ""}. Give a warm, specific 2-sentence insight and one practical micro-action they can do right now. Be real, not generic.` }],
        }),
      });
      const data = await resp.json();
      setAiInsight(data.content?.find((c: any) => c.type === "text")?.text || "");
    } catch {
      setAiInsight("Thank you for checking in. Awareness of your emotional state is a powerful act of self-care.");
    }
    setAiLoading(false);
    setNote(""); setEmotions([]); setSelMood(null); setEnergy(5);
  }, [selMood, note, emotions, energy, moodLog, checkIn]);

  const weekMoods = moodLog.slice(0, 7);
  const avgScore  = weekMoods.length ? (weekMoods.reduce((a: number, m: any) => a + m.score, 0) / weekMoods.length).toFixed(1) : "—";
  const mhScore   = weekMoods.length ? Math.min(100, Math.round((Number(avgScore) / 10) * 70 + weekMoods.length * 4)) : 0;
  const mhColor   = mhScore >= 70 ? GREEN : mhScore >= 50 ? GOLD : RED;

  // 30-day weekly averages for trend chart
  const weeklyTrend = useMemo(() => {
    const weeks: number[][] = [[], [], [], []];
    moodLog.slice(0, 28).forEach((m: any, i: number) => { weeks[Math.floor(i / 7)].push(m.score); });
    return weeks.map(w => w.length ? +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(1) : 0).filter(v => v > 0);
  }, [moodLog]);

  return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Mood Journal + Emotional Check-In</Label>
        <Badge color="#f87171">BEATS BETTERHELP</Badge>
      </div>

      {/* Streak display */}
      {streak > 0 && (
        <div style={{ background: `${GOLD}11`, border: `1px solid ${GOLD}22`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28, animation: "mh-streak .5s ease" }}>🔥</div>
          <div>
            <div style={{ fontFamily: HEAD, fontSize: 20, color: GOLD }}>{streak} Day Streak</div>
            <div style={{ fontSize: 7, color: DIM, letterSpacing: ".1em" }}>Keep it up — consistency is the key to mental fitness</div>
          </div>
        </div>
      )}

      {saved && (aiLoading ? (
        <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}22`, padding: "14px 16px", fontSize: 9, color: MUTED, letterSpacing: ".12em", animation: "mh-blink .8s infinite" }}>AI analysing your mood pattern...</div>
      ) : aiInsight ? (
        <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}33`, padding: "14px 16px" }}>
          <Label color={`${GOLD}88`}>AI Insight For You</Label>
          <div style={{ fontSize: 10, color: TEXT, lineHeight: 1.9 }}>{aiInsight}</div>
        </div>
      ) : null)}

      <Card>
        <Label>How are you feeling right now?</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {MOODS.map(m => (
            <button key={m.label} className="mh-btn" onClick={() => { setSelMood(m); setSaved(false); setAiInsight(""); }} style={{
              padding: "10px 4px",
              background: selMood?.label === m.label ? `${GOLD}22` : "#0a0a0a",
              border: `1px solid ${selMood?.label === m.label ? GOLD : BOR}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <span style={{ fontSize: 6, letterSpacing: ".1em", color: selMood?.label === m.label ? GOLD : MUTED, textTransform: "uppercase" }}>{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Which emotions are present?</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {EMOTION_CHIPS.map(e => (
            <button key={e} className="mh-btn" onClick={() => setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])} style={{
              padding: "4px 10px", fontSize: 7, letterSpacing: ".1em",
              background: emotions.includes(e) ? `${GOLD}22` : CARD,
              border: `1px solid ${emotions.includes(e) ? GOLD : BOR}`,
              color: emotions.includes(e) ? GOLD : SUB, fontFamily: FONT, textTransform: "uppercase",
            }}>{e}</button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Energy Level: {energy}/10</Label>
        <input type="range" min={1} max={10} step={1} value={energy} onChange={e => setEnergy(Number(e.target.value))} style={{ width: "100%", accentColor: GOLD, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: MUTED, letterSpacing: ".1em", marginTop: 4 }}>
          <span>DEPLETED</span><span>VIBRANT</span>
        </div>
      </Card>

      <div>
        <Label>What's on your mind? (optional)</Label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write freely. This is your safe space..." rows={3}
          style={{ width: "100%", background: CARD, border: `1px solid ${BOR}`, color: TEXT, fontFamily: FONT, fontSize: 11, letterSpacing: ".06em", padding: "10px 12px", outline: "none", resize: "vertical", lineHeight: 1.8 }}
        />
      </div>

      <button className="mh-btn" onClick={logMood} disabled={!selMood} style={{
        width: "100%", padding: "14px 0",
        background: selMood ? GOLD : "#111", color: selMood ? "#080808" : MUTED,
        border: selMood ? "none" : `1px solid ${BOR}`,
        fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase",
      }}>
        {saved ? "✓ Logged — Log Another" : "Log Mood + Get AI Insight"}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "7-Day Avg",   value: avgScore },
          { label: "Days Tracked", value: moodLog.length },
          { label: "MH Score",   value: mhScore > 0 ? `${mhScore}/100` : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "12px 14px" }}>
            <Label>{label}</Label>
            <div style={{ fontFamily: HEAD, fontSize: 26, color: GOLD }}>{value}</div>
          </div>
        ))}
      </div>

      {weekMoods.length > 0 && (
        <Card>
          <Label>7-Day Mood Chart</Label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {[...weekMoods].reverse().map((m: any, i: number) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 7, color: SUB }}>{m.score}</div>
                <div style={{ width: "100%", height: `${(m.score / 10) * 60}px`, borderRadius: "2px 2px 0 0", background: m.score >= 7 ? GREEN : m.score >= 5 ? GOLD : RED, transition: "height .5s" }} />
                <div style={{ fontSize: 14 }}>{m.emoji}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4-week trend — Headspace-level analytics */}
      {weeklyTrend.length >= 2 && (
        <Card>
          <Label>Weekly Trend (last {weeklyTrend.length} weeks)</Label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 60, marginTop: 8 }}>
            {weeklyTrend.map((avg, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 8, color: avg >= 7 ? GREEN : avg >= 5 ? GOLD : RED, fontWeight: 700 }}>{avg}</div>
                <div style={{ width: "100%", height: `${(avg / 10) * 48}px`, background: avg >= 7 ? GREEN : avg >= 5 ? GOLD : RED, borderRadius: "2px 2px 0 0", opacity: 0.7 }} />
                <div style={{ fontSize: 7, color: MUTED, letterSpacing: ".08em" }}>W{i + 1}</div>
              </div>
            ))}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {weeklyTrend.length >= 2 && (
                <>
                  <div style={{ fontSize: 8, color: weeklyTrend[weeklyTrend.length - 1] >= weeklyTrend[0] ? GREEN : RED }}>
                    {weeklyTrend[weeklyTrend.length - 1] >= weeklyTrend[0] ? "↑" : "↓"}
                  </div>
                  <div style={{ fontSize: 7, color: SUB, letterSpacing: ".08em", textAlign: "center", lineHeight: 1.5 }}>
                    {weeklyTrend[weeklyTrend.length - 1] >= weeklyTrend[0] ? "Improving" : "Declining"}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {moodLog.length > 0 && (
        <Card>
          <Label>Recent Check-Ins</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moodLog.slice(0, 5).map((m: any, i: number) => (
              <div key={m.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid #111`, paddingBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontSize: 9, color: TEXT, marginBottom: 2 }}>{m.label} · E:{m.energy || "—"}/10</div>
                    <div style={{ fontSize: 7, color: MUTED }}>{m.date} {m.time}</div>
                    {m.emotions?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {m.emotions.slice(0, 3).map((e: string) => (
                          <span key={e} style={{ fontSize: 6, color: SUB, border: `1px solid ${BOR}`, padding: "1px 5px", letterSpacing: ".08em" }}>{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontFamily: HEAD, fontSize: 24, color: m.score >= 7 ? GREEN : m.score >= 5 ? GOLD : RED }}>{m.score}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI THERAPY TAB — system prompt upgraded, crisis detection
════════════════════════════════════════════════════════════ */
function AITherapyTab() {
  const [chat, setChat]     = useState<any[]>(() => store.get("mh_chat2", []));
  const [msg, setMsg]       = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [chat]);

  const CRISIS_WORDS = ["suicide", "kill myself", "end my life", "don't want to live", "self harm", "hurt myself", "no reason to live"];

  const sendMsg = useCallback(async () => {
    if (!msg.trim() || aiLoad) return;
    const lowerMsg = msg.toLowerCase();
    if (CRISIS_WORDS.some(w => lowerMsg.includes(w))) { setCrisis(true); }
    const userMsg = { role: "user", content: msg };
    const newChat = [...chat, userMsg];
    setChat(newChat); setMsg(""); setAiLoad(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are ManifiX AI Therapist — an empathetic, evidence-based mental health support assistant. Use CBT, ACT, DBT, and mindfulness techniques. Be warm, specific, and practical. Responses 60–100 words max. Never diagnose. If user shows signs of crisis or self-harm, always gently encourage professional help and mention crisis hotlines (iCall: 9152987821 in India). You are not a replacement for professional therapy.`,
          messages: newChat.map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await resp.json();
      const reply = data.content?.find((c: any) => c.type === "text")?.text || "I'm here with you. Please try again.";
      const final = [...newChat, { role: "assistant", content: reply }];
      setChat(final);
      store.set("mh_chat2", final.slice(-20));
    } catch {
      setChat([...newChat, { role: "assistant", content: "I'm here to support you. There was a connection issue — please try again." }]);
    }
    setAiLoad(false);
  }, [msg, chat, aiLoad]);

  return (
    <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card>
        <Label>ManifiX AI Therapist — 24/7 Support</Label>
        <div style={{ fontSize: 9, color: SUB, lineHeight: 1.7 }}>CBT · ACT · DBT · Mindfulness · Evidence-based · Not a replacement for professional therapy</div>
      </Card>

      {crisis && (
        <div style={{ background: "#140808", border: `1px solid ${RED}55`, padding: "12px 16px" }}>
          <div style={{ fontSize: 9, color: RED, fontWeight: 700, marginBottom: 6, letterSpacing: ".08em" }}>⚠ Your wellbeing matters</div>
          <div style={{ fontSize: 9, color: "#f87171", lineHeight: 1.8, marginBottom: 8 }}>
            It sounds like you might be going through something very difficult. Please reach out to a professional right away — you deserve real support.
          </div>
          <a href="tel:9152987821" style={{ display: "inline-block", padding: "8px 14px", background: `${RED}22`, border: `1px solid ${RED}44`, color: RED, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", textDecoration: "none" }}>
            📞 Call iCall: 9152987821
          </a>
        </div>
      )}

      <div ref={chatRef} style={{ height: 340, overflowY: "auto", border: `1px solid ${BOR}`, background: "#070707", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {chat.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: MUTED, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", lineHeight: 2.5 }}>
            <div style={{ fontSize: 40, marginBottom: 12, animation: "mh-float 3s ease-in-out infinite" }}>🧠</div>
            I am here to listen and support you.<br />Share what's on your mind.
          </div>
        )}
        {chat.map((m: any, i: number) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "86%",
            background: m.role === "user" ? `${GOLD}18` : "#0f0f0f",
            border: `1px solid ${m.role === "user" ? `${GOLD}33` : BOR}`,
            padding: "10px 13px",
          }}>
            <div style={{ fontSize: 10, color: m.role === "user" ? GOLD : TEXT, lineHeight: 1.8 }}>{m.content}</div>
          </div>
        ))}
        {aiLoad && (
          <div style={{ alignSelf: "flex-start", background: "#0f0f0f", border: `1px solid ${BOR}`, padding: "10px 13px", display: "flex", gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, animation: `mh-blink .8s ${i * 0.2}s infinite` }} />)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()}
          placeholder="How are you feeling? What's on your mind?"
          style={{ flex: 1, background: CARD, border: `1px solid ${BOR}`, color: TEXT, fontFamily: FONT, fontSize: 11, padding: "11px 14px", outline: "none" }}
        />
        <button className="mh-btn" onClick={sendMsg} disabled={aiLoad} style={{ padding: "11px 18px", background: aiLoad ? "#222" : GOLD, color: "#080808", border: "none", fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>→</button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["I feel anxious", "I can't sleep", "I feel overwhelmed", "I need motivation", "I'm struggling", "I feel lonely"].map(p => (
          <button key={p} className="mh-btn" onClick={() => setMsg(p)} style={{ fontSize: 7, letterSpacing: ".1em", padding: "5px 10px", background: "transparent", border: `1px solid ${BOR}`, color: MUTED, fontFamily: FONT, textTransform: "uppercase" }}>{p}</button>
        ))}
      </div>

      {chat.length > 0 && (
        <button className="mh-btn" onClick={() => { setChat([]); store.set("mh_chat2", []); setCrisis(false); }} style={{ background: "transparent", border: `1px solid ${BOR}`, color: MUTED, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", padding: "8px 0", textTransform: "uppercase", width: "100%" }}>↺ Clear Chat</button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function MentalHealth() {
  const navigate = useNavigate();
  const [tipIdx, setTipIdx] = useState(0);
  const [tab, setTab]       = useState("overview");
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { streak, todayDone } = useStreak();

  const moodLog = useMemo(() => store.get<any[]>("mh_moods2", []), [tab]);
  const weekMoods = moodLog.slice(0, 7);
  const avgScore  = weekMoods.length ? (weekMoods.reduce((a: number, m: any) => a + m.score, 0) / weekMoods.length).toFixed(1) : null;
  const mhScore   = avgScore ? Math.min(100, Math.round((Number(avgScore) / 10) * 70 + weekMoods.length * 4)) : 0;
  const mhColor   = mhScore >= 70 ? GREEN : mhScore >= 50 ? GOLD : RED;

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => {
    tipRef.current = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 4200);
    return () => { if (tipRef.current) clearInterval(tipRef.current); };
  }, []);

  const TABS = [
    { id: "overview",   label: "Overview" },
    { id: "meditation", label: "Meditate" },
    { id: "sounds",     label: "Sounds" },
    { id: "mood",       label: "Mood Log" },
    { id: "cbt",        label: "CBT" },
    { id: "therapy",    label: "AI Therapy" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: TEXT, fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", position: "relative" }}>

      {/* BG grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${GRID_C} 1px,transparent 1px),linear-gradient(90deg,${GRID_C} 1px,transparent 1px)`, backgroundSize: "44px 44px" }} />

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 440, height: 220, background: `radial-gradient(ellipse,${GOLD}08 0%,transparent 70%)`, animation: "mh-pulse 5s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Corner brackets */}
      {[
        { top: 13, left: 13,   borderTopWidth: 2, borderLeftWidth: 2 },
        { top: 13, right: 13,  borderTopWidth: 2, borderRightWidth: 2 },
        { bottom: 13, left: 13,  borderBottomWidth: 2, borderLeftWidth: 2 },
        { bottom: 13, right: 13, borderBottomWidth: 2, borderRightWidth: 2 },
      ].map((pos, i) => (
        <div key={i} style={{ position: "fixed", width: 20, height: 20, borderColor: GOLD, borderStyle: "solid", borderWidth: 0, opacity: .18, pointerEvents: "none", ...pos }} />
      ))}

      {/* WHO TICKER */}
      <div style={{ width: "100%", overflow: "hidden", whiteSpace: "nowrap", borderBottom: `1px solid ${BOR}`, padding: "5px 0", background: "#050505", flexShrink: 0 }}>
        <span style={{ display: "inline-block", animation: "mh-tick 55s linear infinite", fontSize: 7, letterSpacing: ".1em", color: "#1a1a1a", textTransform: "uppercase" }}>
          {TICKER_TEXT + "   ·   " + TICKER_TEXT}
        </span>
      </div>

      {/* SCAN LINE */}
      <div style={{ position: "fixed", left: 0, right: 0, height: 2, zIndex: 5, background: `linear-gradient(90deg,transparent,${GOLD}22,${GOLD}55,${GOLD}22,transparent)`, animation: "mh-scan 5s linear infinite", pointerEvents: "none" }} />

      {/* MAIN WRAPPER */}
      <div style={{ position: "relative", zIndex: 2, width: "min(480px,96vw)", display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, paddingBottom: 60 }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottom: `1px solid ${BOR}` }}>
          <div>
            <div style={{ fontFamily: HEAD, fontSize: 32, letterSpacing: ".04em", lineHeight: 1, color: TEXT }}>🧠 MENTAL HEALTH</div>
            <div style={{ fontSize: 7, letterSpacing: ".2em", color: MUTED, textTransform: "uppercase", marginTop: 3 }}>
              AI Therapy · Mood Journal · Meditation · CBT · Sounds
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {streak > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 7, letterSpacing: ".15em", color: MUTED, textTransform: "uppercase" }}>Streak</div>
                <div style={{ fontFamily: HEAD, fontSize: 22, color: GOLD }}>🔥 {streak}d</div>
              </div>
            )}
            {mhScore > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 7, letterSpacing: ".15em", color: MUTED, textTransform: "uppercase" }}>MH Score</div>
                <div style={{ fontFamily: HEAD, fontSize: 22, color: mhColor }}>{mhScore}/100</div>
              </div>
            )}
            <button className="mh-btn" onClick={() => navigate(-1)} style={{ background: "transparent", border: `1px solid ${BOR}`, color: "#333", fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", padding: "7px 12px", textTransform: "uppercase" }}>← Back</button>
          </div>
        </div>

        {/* ─── LIVE TIP ─── */}
        <div style={{ background: GOLD, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 7, letterSpacing: ".18em", color: "#80600a", textTransform: "uppercase", marginBottom: 3 }}>AI Wellness Insight</div>
            <div style={{ fontSize: 11, fontFamily: HEAD, letterSpacing: ".04em", color: "#080808" }}>{TIPS[tipIdx]}</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {TIPS.map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i === tipIdx ? "#080808" : "#c8a84b", transition: "all .3s" }} />)}
          </div>
        </div>

        {/* Today done prompt */}
        {!todayDone && (
          <button className="mh-btn" onClick={() => setTab("mood")} style={{
            padding: "10px 14px", background: `${GOLD}11`, border: `1px solid ${GOLD}22`,
            color: `${GOLD}cc`, fontFamily: FONT, fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>✦ Daily check-in not done yet — log your mood</span>
            <span>→</span>
          </button>
        )}

        {/* ─── TABS ─── */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BOR}`, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} className="mh-btn" onClick={() => setTab(t.id)} style={{
              flexShrink: 0, padding: "10px 12px", background: "transparent",
              border: "none", borderBottom: `2px solid ${tab === t.id ? GOLD : "transparent"}`,
              color: tab === t.id ? GOLD : MUTED, fontFamily: FONT, fontSize: 7,
              letterSpacing: ".15em", textTransform: "uppercase", transition: "all .2s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══════ OVERVIEW ═══════ */}
        {tab === "overview" && (
          <div className="mh-up" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: `linear-gradient(135deg,#0a0806,#120e04,#1e1808)`, border: `1px solid ${GOLD}18`, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -60, top: -60, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${GOLD}08,transparent 70%)` }} />
              <Label>WHO Mental Health Crisis · 2024</Label>
              <div style={{ fontFamily: HEAD, fontSize: 40, lineHeight: 1, marginBottom: 12, color: TEXT }}>
                970M<span style={{ color: GOLD }}> PEOPLE</span>
                <br /><span style={{ fontSize: 26, color: `${GOLD}90` }}>NEED SUPPORT</span>
              </div>
              <div style={{ fontSize: 10, lineHeight: 1.8, color: SUB, maxWidth: 380, marginBottom: 18 }}>
                ManifiX delivers guided meditation, ambient soundscapes, clinical CBT tools, AI therapy, mood journaling — and beats Calm, Headspace, and Teladoc.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="mh-btn" onClick={() => setTab("meditation")} style={{ background: GOLD, color: "#080808", border: "none", padding: "13px 20px", fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>🧘 Start Meditating</button>
                <button className="mh-btn" onClick={() => setTab("sounds")} style={{ background: "transparent", border: `1px solid ${BOR}`, color: SUB, padding: "13px 20px", fontFamily: FONT, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase" }}>🎵 Soundscapes</button>
              </div>
            </div>

            {/* Competitor comparison — now includes Sounds */}
            <div>
              <Label>How ManifiX Beats the Competition</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { app: "Headspace",  feature: "7-day, 21-day, sleep story programs", badge: "MEDITATION", color: GREEN,   tab: "meditation" },
                  { app: "Calm",       feature: "Ambient soundscapes (rain, ocean, fire)", badge: "SOUNDS",    color: BLUE,    tab: "sounds"     },
                  { app: "BetterHelp", feature: "Mood journal + AI insights + streak",    badge: "MOOD",      color: "#f87171",tab: "mood"       },
                  { app: "BetterHelp", feature: "CBT with distortion analytics",           badge: "CBT",       color: BLUE,    tab: "cbt"        },
                  { app: "Teladoc",    feature: "24/7 AI therapist + crisis detection",    badge: "THERAPY",   color: PURPLE,  tab: "therapy"    },
                ].map((c, i) => (
                  <button key={i} className="mh-btn mh-card-h" onClick={() => setTab(c.tab)} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <Badge color={c.color}>{c.badge}</Badge>
                        <span style={{ fontSize: 7, color: MUTED, letterSpacing: ".1em", textTransform: "uppercase" }}>beats {c.app}</span>
                      </div>
                      <div style={{ fontSize: 10, color: TEXT, letterSpacing: ".04em" }}>{c.feature}</div>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED }}>→</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {WHO_STATS.map((s, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BOR}`, padding: "14px 16px" }}>
                  <div style={{ fontFamily: HEAD, fontSize: 30, color: GOLD, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: SUB, lineHeight: 1.6, letterSpacing: ".06em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <CrisisBanner />
          </div>
        )}

        {tab === "meditation" && <GuidedMeditationTab />}
        {tab === "sounds"     && <SoundscapesTab />}
        {tab === "mood"       && <MoodJournalTab />}
        {tab === "cbt"        && <CBTTab />}
        {tab === "therapy"    && <AITherapyTab />}

        <div style={{ textAlign: "center", fontSize: 7, letterSpacing: ".18em", color: "#1a1a1a", textTransform: "uppercase", paddingTop: 6 }}>
          ManifiX AI · Mental Health · WHO SDG 3.4 · 20 Languages · Offline-first
        </div>
      </div>
    </div>
  );
}
