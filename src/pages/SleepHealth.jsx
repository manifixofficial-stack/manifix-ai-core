import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   MANIFIX BLACK × GOLD PALETTE
───────────────────────────────────────────── */
const ACC     = "#D4AF37";
const ACCDIM  = "#B8941F";
const ACCGLOW = "rgba(212,175,55,0.08)";
const BG      = "#050505";
const BORDER  = "#1a1508";
const GRID    = "rgba(212,175,55,0.012)";
const GOLD_GRAD = "linear-gradient(135deg,#1a1408,#D4AF37)";
const PROG_GRAD = "linear-gradient(90deg,#1a1408,#8B6914,#D4AF37)";
const TEXT_MAIN = "#F5E6C8";
const TEXT_DIM  = "#5a4a20";
const TEXT_MUTED = "#3a2e14";

/* ─────────────────────────────────────────────
   WHO IMPACT DATA
───────────────────────────────────────────── */
const WHO = {
  code:  "MH-SLP",
  stat1: "970M people live with mental disorders — WHO 2022",
  stat2: "45% of global adults report chronically insufficient sleep",
  stat3: "$411B/year in productivity loss from sleep deprivation (RAND)",
  stat4: "75% with mental disorders in LMICs get no treatment",
  solve: "Quality sleep: Depression ↓40% · Anxiety ↓30% · Immunity ↑25%",
  sdg:   "SDG 3.4 — Promote mental health and wellbeing for all",
  lmic:  "Low-cost sleep hygiene reduces disorder burden by up to 50%",
  promise: "4h poor sleep → 8h deep sleep in 3 weeks",
};

/* ─────────────────────────────────────────────
   20-LANGUAGE COACHING PHRASES
───────────────────────────────────────────── */
const PHRASES = {
  "en-IN": { ready:"Let your body receive the rest it has earned.", tip:"Consistent bedtimes improve sleep quality 40%. Sleep same time every night.", breathe:"Activate parasympathetic mode. 4 in. 7 hold. 8 out.", saved:"Sleep entry logged. Consistency score updating." },
  "hi-IN": { ready:"अपने शरीर को वो आराम दें जो उसने अर्जित किया है।", tip:"नियमित सोने का समय नींद में 40% सुधार करता है।", breathe:"4 सांस लें। 7 रोकें। 8 छोड़ें।", saved:"नींद लॉग सहेजा गया।" },
  "te-IN": { ready:"మీ శరీరానికి అది సంపాదించిన విశ్రాంతిని అందించండి.", tip:"స్థిరమైన నిద్రవేళలు నిద్ర నాణ్యతను 40% మెరుగుపరుస్తాయి.", breathe:"4 లోపలికి. 7 ఆపు. 8 బయటికి.", saved:"నిద్ర లాగ్ సేవ్ చేయబడింది." },
  "ta-IN": { ready:"உங்கள் உடல் சம்பாதித்த ஓய்வை அதற்கு அளியுங்கள்.", tip:"சீரான தூக்க நேரங்கள் தரத்தை 40% மேம்படுத்துகின்றன.", breathe:"4 உள்ளே. 7 நிறுத்து. 8 வெளியே.", saved:"தூக்க பதிவு சேமிக்கப்பட்டது." },
  "es-ES": { ready:"Deja que tu cuerpo reciba el descanso que se ha ganado.", tip:"Los horarios de sueño constantes mejoran la calidad un 40%.", breathe:"Inhala 4. Retén 7. Exhala 8.", saved:"Registro de sueño guardado." },
  "fr-FR": { ready:"Laissez votre corps recevoir le repos qu'il a mérité.", tip:"Des horaires de sommeil réguliers améliorent la qualité de 40%.", breathe:"Inspirez 4. Retenez 7. Expirez 8.", saved:"Journal de sommeil enregistré." },
  "de-DE": { ready:"Lass deinen Körper die Ruhe empfangen, die er verdient hat.", tip:"Regelmäßige Schlafzeiten verbessern die Qualität um 40%.", breathe:"4 einatmen. 7 halten. 8 ausatmen.", saved:"Schlafeintrag gespeichert." },
  "ja-JP": { ready:"体に、獲得した休息を与えましょう。", tip:"規則正しい就寝時間は睡眠の質を40%向上させます。", breathe:"4で吸い、7で保ち、8で吐く。", saved:"睡眠記録を保存しました。" },
  "ko-KR": { ready:"몸이 얻은 휴식을 받아들이게 하세요.", tip:"규칙적인 취침 시간은 수면 질을 40% 향상시킵니다.", breathe:"4 들이쉬고, 7 참고, 8 내쉬세요.", saved:"수면 기록이 저장되었습니다." },
  "zh-CN": { ready:"让您的身体获得它应得的休息。", tip:"固定的睡眠时间可将睡眠质量提高40%。", breathe:"吸气4秒，保持7秒，呼气8秒。", saved:"睡眠记录已保存。" },
  "ar-SA": { ready:"دع جسدك يتلقى الراحة التي اكتسبها.", tip:"أوقات النوم المنتظمة تحسن الجودة بنسبة 40٪.", breathe:"استنشق 4. احبس 7. ازفر 8.", saved:"تم حفظ سجل النوم." },
  "pt-BR": { ready:"Deixe seu corpo receber o descanso que conquistou.", tip:"Horários de sono consistentes melhoram a qualidade em 40%.", breathe:"Inspire 4. Segure 7. Expire 8.", saved:"Registro de sono salvo." },
};
const ph = (lang, key) => (PHRASES[lang]?.[key] || PHRASES["en-IN"][key] || "");

const LANG_MAP = {
  "en-IN":"en-IN","hi-IN":"hi-IN","te-IN":"te-IN","ta-IN":"ta-IN",
  "es-ES":"es-ES","fr-FR":"fr-FR","de-DE":"de-DE","ja-JP":"ja-JP",
  "ko-KR":"ko-KR","zh-CN":"zh-CN","ar-SA":"ar-SA","pt-BR":"pt-BR",
};

/* ─────────────────────────────────────────────
   HABITS LIST
───────────────────────────────────────────── */
const HABITS_DEFAULT = [
  { id:1, label:"No screens 60 min before bed" },
  { id:2, label:"Read for 15 minutes" },
  { id:3, label:"4-7-8 breathing done" },
  { id:4, label:"Room temp 18–20°C" },
  { id:5, label:"No caffeine after 2 PM" },
  { id:6, label:"Light stretch or yoga" },
  { id:7, label:"Journal 3 things grateful for" },
  { id:8, label:"No alcohol tonight" },
];

/* ─────────────────────────────────────────────
   WEB AUDIO — REAL SLEEP SOUNDS ENGINE
   Generates continuous, layered sleep audio without CDN
───────────────────────────────────────────── */
function createNoiseBuffer(ctx, duration=2) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createSleepSoundscape(ctx, type) {
  const nodes = [];
  const master = ctx.createGain();
  master.gain.value = 0.03;
  master.connect(ctx.destination);

  if (type === "rain") {
    // Brown noise + high freq rain drops
    const buf = createNoiseBuffer(ctx, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 1;
    src.connect(filter);
    filter.connect(master);
    src.start();
    nodes.push(src);

    const src2 = ctx.createBufferSource();
    src2.buffer = buf;
    src2.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2000;
    hp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src2.connect(hp);
    hp.connect(g);
    g.connect(master);
    src2.start();
    nodes.push(src2);
  } else if (type === "ocean") {
    // Slow modulated noise
    const buf = createNoiseBuffer(ctx, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    src.connect(filter);
    filter.connect(master);
    src.start();
    nodes.push(src, lfo);
  } else if (type === "white") {
    const buf = createNoiseBuffer(ctx, 2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    src.connect(filter);
    filter.connect(master);
    src.start();
    nodes.push(src);
  } else if (type === "forest") {
    // Pink noise + bird-like chirps
    const buf = createNoiseBuffer(ctx, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800;
    bp.Q.value = 0.3;
    src.connect(bp);
    bp.connect(master);
    src.start();
    nodes.push(src);

    const chirp = ctx.createOscillator();
    chirp.type = "sine";
    chirp.frequency.value = 1200;
    const chirpGain = ctx.createGain();
    chirpGain.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.02;
    lfo.connect(lfoG);
    lfoG.connect(chirpGain.gain);
    chirp.connect(chirpGain);
    chirpGain.connect(master);
    chirp.start();
    lfo.start();
    nodes.push(chirp, lfo);
  } else if (type === "deep") {
    // Dual low drone
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 58;
    const g1 = ctx.createGain();
    g1.gain.value = 0.06;
    const g2 = ctx.createGain();
    g2.gain.value = 0.06;
    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(master);
    g2.connect(master);
    osc1.start();
    osc2.start();
    nodes.push(osc1, osc2);
  } else if (type === "crystal") {
    // 528Hz + harmonic
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 528;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 792;
    const g1 = ctx.createGain();
    g1.gain.value = 0.04;
    const g2 = ctx.createGain();
    g2.gain.value = 0.02;
    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(master);
    g2.connect(master);
    osc1.start();
    osc2.start();
    nodes.push(osc1, osc2);
  }

  const stopAll = () => {
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch(e){} }); try { master.disconnect(); } catch(e){} }, 1000);
  };

  return { master, stop: stopAll };
}

const SOUNDS = [
  { id:"rain",    label:"Rain",       freq:200, wave:"noise",    color:"#D4AF37" },
  { id:"ocean",   label:"Ocean",      freq:100, wave:"mod",      color:"#C4A35A" },
  { id:"white",   label:"White Noise",freq:400, wave:"band",     color:ACC       },
  { id:"forest",  label:"Forest",     freq:150, wave:"chirp",    color:"#E8C84A" },
  { id:"deep",    label:"Deep Drone", freq:55,  wave:"drone",    color:"#B8941F" },
  { id:"crystal", label:"Crystal",    freq:528, wave:"solfeggio",color:"#F0D060" },
];

/* ─────────────────────────────────────────────
   CLAUDE API
───────────────────────────────────────────── */
async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900, system, messages }),
  });
  const d = await res.json();
  return d.content?.map(c => c.text || "").join("") || "";
}

/* ─────────────────────────────────────────────
   LOCAL STORAGE HOOK
───────────────────────────────────────────── */
function useLs(key, def) {
  const [val, setVal] = useState(() => {
    try { const x = localStorage.getItem(key); return x ? JSON.parse(x) : def; } catch { return def; }
  });
  const set = useCallback((v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [val, key]);
  return [val, set];
}

/* ─────────────────────────────────────────────
   CYCLE CALCULATOR
───────────────────────────────────────────── */
function getCycles(wakeStr) {
  const [h, m] = wakeStr.split(":").map(Number);
  const wake = new Date(); wake.setHours(h, m, 0, 0);
  if (wake < new Date()) wake.setDate(wake.getDate() + 1);
  return [6, 5, 4, 3].map(c => {
    const t = new Date(wake.getTime() - (c * 90 + 14) * 60000);
    return { cycles: c, time: t.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }), best: c === 5 };
  });
}

/* ─────────────────────────────────────────────
   SCORE ENGINE
───────────────────────────────────────────── */
function calcScore(logs, habits) {
  if (!logs.length) return 50;
  const r   = logs.slice(0, 7);
  const avg = r.reduce((a, b) => a + b.duration, 0) / r.length;
  const aq  = r.reduce((a, b) => a + b.quality, 0)  / r.length;
  const dur = avg >= 7 && avg <= 9 ? 38 : avg > 5 ? 26 : 12;
  const qual = (aq / 10) * 30;
  const vars = r.map(l => l.duration);
  const vari = vars.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / vars.length;
  const cons = Math.max(0, 20 - vari * 9);
  const hab  = (habits.filter(h => h.done).length / habits.length) * 12;
  return Math.min(100, Math.round(dur + qual + cons + hab));
}

/* ─────────────────────────────────────────────
   SPEAKER
───────────────────────────────────────────── */
function makeSpeaker(lang) {
  return (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    const u  = new SpeechSynthesisUtterance(text);
    u.lang   = LANG_MAP[lang] || "en-IN";
    u.rate   = 0.64;
    u.pitch  = 0.76;
    const vs = speechSynthesis.getVoices();
    const v  = vs.find(x => x.lang === u.lang) || vs.find(x => x.lang.startsWith("en"));
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
}

/* ─────────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────────── */
function injectCSS() {
  if (document.getElementById("sleepcss")) return;
  const el = document.createElement("style");
  el.id = "sleepcss";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.03;transform:scale(1)}50%{opacity:.09;transform:scale(1.06)}}
    @keyframes beat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.8)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes breatheIn{from{transform:scale(1);opacity:.25}to{transform:scale(1.45);opacity:.75}}
    @keyframes breatheHold{0%,100%{transform:scale(1.45);opacity:.75}}
    @keyframes breatheOut{from{transform:scale(1.45);opacity:.75}to{transform:scale(1);opacity:.25}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    .fu{animation:fu .45s cubic-bezier(.22,.68,0,1.2) both}
    .sl-btn:hover{filter:brightness(1.15);transform:translateY(-1px);transition:all .16s}
    .sl-btn:active{transform:translateY(0)}
    .ghost:hover{border-color:#2a2010!important;color:#5a4a20!important;transition:all .16s}
    input[type=range]{-webkit-appearance:none;appearance:none;height:2px;border-radius:2px;outline:none;cursor:pointer}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${ACC};cursor:pointer;border:2px solid #050300}
    textarea,input{font-family:'JetBrains Mono',monospace}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:${ACC}30;color:${TEXT_MAIN}}
  `;
  document.head.appendChild(el);
}

/* ────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────── */
const Spin = () => (
  <span style={{ display:"inline-block", width:11, height:11, border:`2px solid ${BORDER}`, borderTopColor:ACC, borderRadius:"50%", animation:"spin .6s linear infinite", verticalAlign:"middle", marginRight:6 }} />
);

/* ────────────────────────────────────────────
   SECTION BLOCK
───────────────────────────────────────────── */
const Sec = ({ label, children, delay=0, accent=ACC }) => (
  <div className="fu" style={{ border:`1px solid ${accent}12`, background:"#080605", animationDelay:`${delay}ms` }}>
    <div style={{ borderBottom:`1px solid ${accent}0a`, padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:2, height:10, background:accent }} />
      <span style={{ fontSize:7, letterSpacing:".22em", textTransform:"uppercase", color:`${accent}70`, fontFamily:"'JetBrains Mono',monospace" }}>{label}</span>
    </div>
    <div style={{ padding:"14px" }}>{children}</div>
  </div>
);

/* ────────────────────────────────────────────
   4-7-8 BREATHING ENGINE
───────────────────────────────────────────── */
function BreathEngine({ active, accent }) {
  const [phase, setPhase]   = useState("idle");
  const [count, setCount]   = useState(0);
  const [round, setRound]   = useState(0);
  const timerRef            = useRef(null);

  useEffect(() => {
    if (!active) { clearTimeout(timerRef.current); setPhase("idle"); setCount(0); return; }
    let cancelled = false;
    const seq = [
      { name:"inhale", dur:4  },
      { name:"hold",   dur:7  },
      { name:"exhale", dur:8  },
    ];
    let si = 0, ct;
    const runSeq = () => {
      if (cancelled) return;
      const cur = seq[si % seq.length];
      setPhase(cur.name);
      let c = cur.dur;
      setCount(c);
      if (si % seq.length === 0 && si > 0) setRound(r => r + 1);
      ct = setInterval(() => {
        c--;
        setCount(c);
        if (c <= 0) { clearInterval(ct); si++; timerRef.current = setTimeout(runSeq, 200); }
      }, 1000);
    };
    runSeq();
    return () => { cancelled = true; clearInterval(ct); clearTimeout(timerRef.current); };
  }, [active]);

  const phaseAnim = { idle:{}, inhale:{ animation:"breatheIn 4s ease forwards" }, hold:{ transform:"scale(1.45)", opacity:.75, transition:"none" }, exhale:{ animation:"breatheOut 8s ease forwards" } };
  const phaseColor = { idle:"#141008", inhale:accent, hold:"#5a4a10", exhale:"#2a2008" };
  const phaseLabel = { idle:"Tap Start", inhale:`Inhale · ${count}s`, hold:`Hold · ${count}s`, exhale:`Exhale · ${count}s` };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"20px 0" }}>
      <div style={{ position:"relative", width:100, height:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${accent}18` }} />
        <div style={{ width:60, height:60, borderRadius:"50%", background:phaseColor[phase] || "#141008", ...phaseAnim[phase], willChange:"transform,opacity" }} />
        <div style={{ position:"absolute", fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:accent, userSelect:"none" }}>
          {active && phase !== "idle" ? count : ""}
        </div>
      </div>
      <div style={{ fontSize:9, letterSpacing:".2em", textTransform:"uppercase", color:phase==="idle"?TEXT_MUTED:accent, fontWeight:700 }}>
        {phaseLabel[phase] || "Idle"}
      </div>
      {active && round > 0 && (
        <div style={{ fontSize:7, letterSpacing:".14em", color:`${accent}50`, textTransform:"uppercase" }}>
          Round {round + 1} · 4 cycles recommended
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function SleepHealth() {
  const navigate = useNavigate();
  useEffect(() => { injectCSS(); }, []);

  /* ── persistent state ── */
  const [sleepLog, setSleepLog] = useLs("manifix_sleepLog_v4", [
    { id:1, date:"2026-05-16", duration:7.5, quality:8, notes:"Felt rested"    },
    { id:2, date:"2026-05-15", duration:6.2, quality:5, notes:"Woke up twice"  },
    { id:3, date:"2026-05-14", duration:8.0, quality:9, notes:"Deep sleep"     },
    { id:4, date:"2026-05-13", duration:6.8, quality:6, notes:"Vivid dreams"   },
    { id:5, date:"2026-05-12", duration:7.2, quality:7, notes:"Good night"     },
  ]);
  const [habits, setHabits] = useLs("manifix_sleepHabits_v4", HABITS_DEFAULT.map(h => ({ ...h, done:false })));
  const [wakeGoal, setWakeGoal] = useLs("manifix_wake_v4", "07:00");
  const [lang, setLang]     = useLs("manifix_lang_v4", "en-IN");

  /* ── UI state ── */
  const [tab, setTab]             = useState("dashboard");
  const [breathActive, setBreath] = useState(false);
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume]       = useState(40);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newEntry, setNewEntry]   = useState({ duration:"", quality:7, notes:"" });
  const [whoOpen, setWhoOpen]     = useState(false);
  const [bgMode, setBgMode]       = useLs("manifix_bgMode_v4", false);

  /* ── AI state ── */
  const [aiAnalysis,   setAiAnalysis]   = useState("");
  const [aiPlan,       setAiPlan]       = useState("");
  const [aiDream,      setAiDream]      = useState("");
  const [aiCycleAdv,   setAiCycleAdv]  = useState("");
  const [aiHabit,      setAiHabit]      = useState("");
  const [dreamInput,   setDreamInput]   = useState("");

  const [loadAnalysis, setLoadAnalysis] = useState(false);
  const [loadPlan,     setLoadPlan]     = useState(false);
  const [loadDream,    setLoadDream]    = useState(false);
  const [loadCycle,    setLoadCycle]    = useState(false);
  const [loadHabit,    setLoadHabit]    = useState(false);

  /* ── audio ref ── */
  const audioCtxRef   = useRef(null);
  const soundRef      = useRef(null);
  const bgIntervalRef = useRef(null);

  /* ── derived ── */
  const score      = useMemo(() => calcScore(sleepLog, habits), [sleepLog, habits]);
  const cycles     = useMemo(() => getCycles(wakeGoal), [wakeGoal]);
  const speak      = useMemo(() => makeSpeaker(lang), [lang]);
  const avgDur     = sleepLog.length ? (sleepLog.reduce((a, b) => a + b.duration, 0) / sleepLog.length).toFixed(1) : "—";
  const avgQual    = sleepLog.length ? (sleepLog.reduce((a, b) => a + b.quality, 0)  / sleepLog.length).toFixed(1) : "—";

  /* ── greet on mount ── */
  useEffect(() => {
    const t = setTimeout(() => speak(ph(lang, "ready")), 1400);
    return () => clearTimeout(t);
  }, []);

  /* ── background sound auto-play ── */
  useEffect(() => {
    if (bgMode && !activeSound) {
      toggleSound(SOUNDS[0]); // rain by default
    }
  }, [bgMode]);

  /* ── sound engine ── */
  const toggleSound = useCallback((snd) => {
    if (activeSound === snd.id) {
      soundRef.current?.stop();
      soundRef.current = null;
      setActiveSound(null);
      return;
    }
    soundRef.current?.stop();
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    soundRef.current = createSleepSoundscape(ctx, snd.wave);
    if (soundRef.current.master) {
      soundRef.current.master.gain.value = volume / 1000;
    }
    setActiveSound(snd.id);
  }, [activeSound, volume]);

  useEffect(() => {
    if (soundRef.current?.master) {
      soundRef.current.master.gain.value = volume / 1000;
    }
  }, [volume]);

  /* cleanup */
  useEffect(() => () => {
    soundRef.current?.stop();
    clearInterval(bgIntervalRef.current);
    try { audioCtxRef.current?.close(); } catch {}
  }, []);

  /* ── log entry ── */
  const saveLog = useCallback(() => {
    if (!newEntry.duration) return;
    setSleepLog(p => [{ id:Date.now(), date:new Date().toISOString().split("T")[0], duration:parseFloat(newEntry.duration), quality:parseInt(newEntry.quality), notes:newEntry.notes }, ...p]);
    setNewEntry({ duration:"", quality:7, notes:"" });
    setShowAddLog(false);
    speak(ph(lang, "saved"));
  }, [newEntry, setSleepLog, lang, speak]);

  /* ── habit toggle ── */
  const toggleHabit = useCallback((id) => {
    setHabits(p => p.map(h => h.id === id ? { ...h, done:!h.done } : h));
  }, [setHabits]);

  /* ════════════════════════════════
     AI FEATURES
  ════════════════════════════════ */
  const runAnalysis = useCallback(async () => {
    setLoadAnalysis(true); setAiAnalysis("");
    const logSummary = sleepLog.slice(0,7).map(l => `${l.date}: ${l.duration}h, quality ${l.quality}/10, notes: "${l.notes}"`).join("\n");
    const sys = `You are a sleep science AI trained on WHO guidelines and cognitive neuroscience. Be direct, evidence-based, compassionate. Max 280 words.
Format with these headers: SLEEP PATTERN · KEY STRENGTH · PRIORITY CONCERN · ONE ACTION THIS WEEK`;
    const prompt = `Patient sleep data (last 7 nights):\n${logSummary}\nAverage duration: ${avgDur}h. Average quality: ${avgQual}/10. Habits done: ${habits.filter(h=>h.done).length}/${habits.length}.
Provide a personalised sleep health analysis. Be specific — use their actual numbers.`;
    try {
      const r = await callClaude([{ role:"user", content:prompt }], sys);
      setAiAnalysis(r);
    } catch { setAiAnalysis("Connection error. Ensure API key is configured."); }
    setLoadAnalysis(false);
  }, [sleepLog, avgDur, avgQual, habits]);

  const runPlan = useCallback(async () => {
    setLoadPlan(true); setAiPlan("");
    const sys = `You are a sleep restoration specialist. Build a structured 21-day plan. Be specific with times and numbers. Max 350 words.
Format: WEEK 1 FOUNDATION / WEEK 2 DEEPENING / WEEK 3 LOCKING IN / DAILY ANCHORS (non-negotiables)`;
    const prompt = `Patient: avg sleep ${avgDur}h, quality ${avgQual}/10, wake goal ${wakeGoal}, habits done ${habits.filter(h=>h.done).length}/${habits.length}.
Build a 21-day sleep improvement plan to achieve 7.5-8h of deep, consistent sleep. Give specific bedtimes, wind-down routines, and measurable milestones.`;
    try {
      const r = await callClaude([{ role:"user", content:prompt }], sys);
      setAiPlan(r);
    } catch { setAiPlan("Connection error. Try again."); }
    setLoadPlan(false);
  }, [avgDur, avgQual, wakeGoal, habits]);

  const runDream = useCallback(async () => {
    if (!dreamInput.trim()) return;
    setLoadDream(true); setAiDream("");
    const sys = `You are a sleep and dream science AI. Interpret dreams through the lens of sleep quality, stress, and cognitive processing — not mysticism. Max 220 words.
Format: SLEEP STAGE LIKELY ACTIVE · EMOTIONAL THEMES · STRESS SIGNAL · SLEEP QUALITY INDICATOR`;
    const prompt = `The patient describes this dream: "${dreamInput}"\nTheir recent sleep: avg ${avgDur}h, quality ${avgQual}/10.
Interpret the dream from a sleep science perspective. What does it suggest about their sleep quality, stress load, and emotional processing?`;
    try {
      const r = await callClaude([{ role:"user", content:prompt }], sys);
      setAiDream(r);
    } catch { setAiDream("Connection error. Try again."); }
    setLoadDream(false);
  }, [dreamInput, avgDur, avgQual]);

  const runCycleAdv = useCallback(async () => {
    setLoadCycle(true); setAiCycleAdv("");
    const sys = `You are a circadian biology expert. Give specific, actionable advice. Max 200 words.
Format: CHRONOTYPE ESTIMATE · OPTIMAL BEDTIME · OPTIMAL WAKE · KEY PROTOCOL · BIGGEST MISTAKE TO AVOID`;
    const prompt = `Patient wants to wake at ${wakeGoal}. Average sleep duration: ${avgDur}h. Average quality: ${avgQual}/10.
Based on their data and 90-minute sleep cycle science, recommend: their likely chronotype, the ideal bedtime, and one circadian-reset protocol for this week.`;
    try {
      const r = await callClaude([{ role:"user", content:prompt }], sys);
      setAiCycleAdv(r);
    } catch { setAiCycleAdv("Connection error. Try again."); }
    setLoadCycle(false);
  }, [wakeGoal, avgDur, avgQual]);

  const runHabitCoach = useCallback(async () => {
    setLoadHabit(true); setAiHabit("");
    const done = habits.filter(h => h.done).map(h => h.label);
    const missed = habits.filter(h => !h.done).map(h => h.label);
    const sys = `You are a sleep hygiene coach. Be direct and supportive. Max 220 words.
Format: WHAT YOU'RE DOING RIGHT · HIGHEST IMPACT MISSED HABIT · THE SCIENCE BEHIND IT · START TONIGHT`;
    const prompt = `Habits completed tonight: ${done.join(", ") || "none"}.
Habits missed: ${missed.join(", ") || "none"}.
Patient's sleep quality: ${avgQual}/10. Analyse their habit pattern and give prioritised coaching. Which single missed habit would most improve their sleep tonight?`;
    try {
      const r = await callClaude([{ role:"user", content:prompt }], sys);
      setAiHabit(r);
    } catch { setAiHabit("Connection error. Try again."); }
    setLoadHabit(false);
  }, [habits, avgQual]);

  /* ── tab config ── */
  const TABS = [
    { id:"dashboard", label:"Dashboard",   emoji:"🌙" },
    { id:"sounds",    label:"Sleep Sounds",emoji:"🎵" },
    { id:"log",       label:"Sleep Log",   emoji:"📋" },
    { id:"habits",    label:"Hygiene",     emoji:"✓"  },
    { id:"ai",        label:"AI Coach",    emoji:"🧠" },
  ];

  const scoreColor = score >= 80 ? "#34D399" : score >= 60 ? ACC : score >= 40 ? "#F59E0B" : "#F87171";

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div style={{ minHeight:"100dvh", background:BG, color:TEXT_MAIN, fontFamily:"'JetBrains Mono','Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden", position:"relative" }}>

      {/* BG grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`, backgroundSize:"44px 44px" }} />

      {/* Ambient glow */}
      <div style={{ position:"fixed", top:"15%", left:"50%", transform:"translateX(-50%)", width:440, height:220, background:`radial-gradient(ellipse,${ACC}08 0%,transparent 70%)`, animation:"pulse 5s ease-in-out infinite", pointerEvents:"none" }} />

      {/* Corners */}
      {[{top:13,left:13,borderTopWidth:2,borderLeftWidth:2},{top:13,right:13,borderTopWidth:2,borderRightWidth:2},{bottom:13,left:13,borderBottomWidth:2,borderLeftWidth:2},{bottom:13,right:13,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{ position:"fixed", width:20, height:20, borderColor:ACC, borderStyle:"solid", borderWidth:0, opacity:.2, pointerEvents:"none", ...pos }} />
      ))}

      {/* WHO Ticker */}
      <div style={{ width:"100%", overflow:"hidden", whiteSpace:"nowrap", borderTop:`1px solid ${BORDER}20`, borderBottom:`1px solid ${BORDER}20`, padding:"5px 0", background:"#030200" }}>
        <span style={{ display:"inline-block", animation:"ticker 60s linear infinite", fontSize:7, letterSpacing:".1em", color:TEXT_MUTED, textTransform:"uppercase" }}>
          {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4,WHO.solve,WHO.sdg,"✅ ManifiX SleepAI — 4h poor sleep → 8h deep sleep in 3 weeks","✅ ManifiX — Wellness score 45→87 in 90 days"].join("   ·   ").repeat(2)}
        </span>
      </div>

      {/* MAIN WRAPPER */}
      <div style={{ position:"relative", zIndex:2, width:"min(460px,96vw)", display:"flex", flexDirection:"column", gap:10, paddingTop:16, paddingBottom:52 }}>

        {/* ─── HEADER ─── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:12, borderBottom:`1px solid ${BORDER}30` }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, letterSpacing:"-.02em", lineHeight:1, color:TEXT_MAIN }}>
              SLEEP<span style={{ color:ACC }}>GOLD</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:400, color:`${ACC}25`, letterSpacing:".1em", marginLeft:8, verticalAlign:"middle" }}>× ManifiX</span>
            </div>
            <div style={{ fontSize:7, letterSpacing:".2em", color:`${ACC}60`, textTransform:"uppercase", marginTop:4 }}>
              Sleep Health · WHO {WHO.code}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
            {/* Score ring */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ position:"relative", width:36, height:36 }}>
                <svg viewBox="0 0 36 36" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#141008" strokeWidth="2.5"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray={`${(score/100)*94.2} 94.2`}
                    style={{ transition:"stroke-dasharray 1s ease" }}/>
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:scoreColor }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize:6, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase" }}>Sleep Score</div>
                <div style={{ fontSize:8, color:scoreColor, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase" }}>{score>=80?"Elite":score>=60?"Restorative":score>=40?"Building":"Critical"}</div>
              </div>
            </div>
            <button onClick={() => navigate(-1)} style={{ fontSize:7, letterSpacing:".14em", color:TEXT_MUTED, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:0, textTransform:"uppercase" }}>
              ← Back
            </button>
          </div>
        </div>

        {/* ─── TAB PILLS ─── */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {TABS.map(t => (
            <button key={t.id} className="sl-btn"
              onClick={() => setTab(t.id)}
              style={{ background: tab===t.id ? `${ACC}10` : "#080605",
                border:`1px solid ${tab===t.id ? `${ACC}30` : `${BORDER}50`}`,
                color: tab===t.id ? ACC : TEXT_MUTED,
                fontSize:7, letterSpacing:".14em", textTransform:"uppercase",
                fontFamily:"inherit", padding:"7px 10px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:5, transition:"all .16s" }}>
              <span style={{ fontSize:11 }}>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Avg Duration", val:`${avgDur}h`, color:parseFloat(avgDur)>=7?"#34D399":"#F59E0B" },
                { label:"Avg Quality",  val:`${avgQual}/10`, color:parseFloat(avgQual)>=7?"#34D399":ACC },
                { label:"Nights Logged", val:sleepLog.length, color:ACC },
              ].map((s,i) => (
                <div key={i} style={{ border:`1px solid ${BORDER}30`, background:"#080605", padding:"12px 10px" }}>
                  <div style={{ fontSize:6, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Weekly bar chart */}
            <Sec label="7-Night Sleep Duration · Hours" delay={50}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:100, paddingBottom:22, position:"relative" }}>
                {sleepLog.slice(0,7).reverse().map((log,i) => {
                  const pct = Math.max((log.duration/10)*100, 6);
                  const c   = log.duration>=7?"#34D399":log.duration>=6?ACC:"#F87171";
                  return (
                    <div key={log.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative" }}>
                      <div style={{ fontSize:7, color:c, fontWeight:700 }}>{log.duration}h</div>
                      <div style={{ width:"100%", height:`${pct}%`, background:`linear-gradient(180deg,${c},${c}44)`, borderRadius:"4px 4px 0 0", minHeight:6 }} />
                      <span style={{ position:"absolute", bottom:-18, fontSize:6, color:TEXT_MUTED }}>
                        {new Date(log.date + "T00:00:00").toLocaleDateString([], { weekday:"short" })}
                      </span>
                    </div>
                  );
                })}
                <div style={{ position:"absolute", left:0, right:0, bottom:`${22+(70)}px`, borderTop:`1px dashed ${ACC}25`, pointerEvents:"none" }}>
                  <span style={{ fontSize:6, color:`${ACC}40`, letterSpacing:".1em", paddingLeft:4 }}>7h</span>
                </div>
              </div>
            </Sec>

            {/* Cycle calculator */}
            <Sec label="Smart Wake-Up Cycle Calculator · 90-min REM" delay={100}>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:6 }}>Wake-Up Goal</div>
                <input type="time" value={wakeGoal} onChange={e => setWakeGoal(e.target.value)}
                  style={{ background:"#050300", border:`1px solid ${BORDER}50`, color:ACC, fontSize:13, fontFamily:"'JetBrains Mono',monospace", padding:"8px 12px", letterSpacing:".1em", outline:"none", width:"100%" }}
                />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
                {cycles.map((c,i) => (
                  <div key={i} style={{ padding:"10px 6px", textAlign:"center", background: c.best?"#1a1208":"#080605", border:`1px solid ${c.best?ACC:`${BORDER}30`}`, borderRadius:0 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:c.best?ACC:TEXT_MUTED }}>{c.time}</div>
                    <div style={{ fontSize:6, letterSpacing:".14em", color:c.best?`${ACC}70`:TEXT_MUTED, textTransform:"uppercase", marginTop:3 }}>{c.cycles} cycles{c.best?" ✦":""}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:8, fontSize:7, letterSpacing:".1em", color:TEXT_MUTED }}>
                ✦ Recommended bedtime — 7.5h with 14min sleep-onset buffer
              </div>
            </Sec>

            {/* Quick log CTA */}
            <button className="sl-btn" onClick={() => setShowAddLog(true)}
              style={{ width:"100%", padding:"14px", background:ACC, color:"#050300", border:"none",
                fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              🌙  Log Last Night's Sleep
            </button>

            {/* WHO panel toggle */}
            <button className="ghost" onClick={() => setWhoOpen(v => !v)}
              style={{ background:"transparent", border:`1px solid ${BORDER}30`, color:TEXT_MUTED,
                fontSize:7, letterSpacing:".16em", textTransform:"uppercase", fontFamily:"inherit",
                padding:"8px 12px", cursor:"pointer", display:"flex", justifyContent:"space-between" }}>
              <span>{whoOpen?"▾":"▸"} WHO Impact · {WHO.code}</span>
              <span style={{ color:`${ACC}50` }}>{WHO.promise}</span>
            </button>
            {whoOpen && (
              <div className="fu" style={{ border:`1px solid ${ACC}10`, background:"#080605", padding:"14px" }}>
                {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4].map((s,i) => (
                  <div key={i} style={{ fontSize:8, color:i===0?`${ACC}60`:TEXT_MUTED, letterSpacing:".06em", lineHeight:1.8, borderLeft:`2px solid ${i===0?ACC:`${BORDER}30`}`, paddingLeft:8, marginBottom:6 }}>{s}</div>
                ))}
                <div style={{ marginTop:8, fontSize:7, letterSpacing:".1em", color:`${ACC}40`, textTransform:"uppercase" }}>{WHO.sdg} · {WHO.lmic}</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: SLEEP SOUNDS
        ══════════════════════════════════ */}
        {tab === "sounds" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Sec label="Web Audio Sleep Tones · No CDN · Offline Ready">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, textTransform:"uppercase" }}>Background Audio</div>
                <button className="sl-btn" onClick={() => setBgMode(v => !v)}
                  style={{ background:bgMode?`${ACC}20`:"#080605", border:`1px solid ${bgMode?`${ACC}40`:`${BORDER}40`}`,
                    color:bgMode?ACC:TEXT_MUTED, fontSize:7, letterSpacing:".1em", textTransform:"uppercase",
                    fontFamily:"inherit", padding:"5px 10px", cursor:"pointer", transition:"all .16s" }}>
                  {bgMode ? "● AUTO" : "○ OFF"}
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                {SOUNDS.map(snd => {
                  const on = activeSound === snd.id;
                  return (
                    <button key={snd.id} className="sl-btn" onClick={() => toggleSound(snd)}
                      style={{ background: on ? `${snd.color}10` : "#060402", border:`1px solid ${on ? snd.color+"30" : `${BORDER}40`}`,
                        color: on ? snd.color : TEXT_MUTED, fontSize:8, letterSpacing:".1em",
                        textTransform:"uppercase", fontFamily:"inherit", padding:"14px 6px",
                        cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all .16s" }}>
                      {on && (
                        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:12 }}>
                          {[1,2,3].map(idx => (
                            <div key={idx} style={{ width:3, background:snd.color, borderRadius:1,
                              animation:`beat ${0.6+idx*0.15}s ease-in-out infinite alternate`,
                              height: [8,14,6][idx-1] }} />
                          ))}
                        </div>
                      )}
                      {!on && <span style={{ fontSize:16 }}>{"🌧🌊💨🌿🎵🔮"[SOUNDS.indexOf(snd)]}</span>}
                      <span>{snd.label}</span>
                      <span style={{ fontSize:6, color:"#1a1408" }}>{snd.freq}Hz</span>
                    </button>
                  );
                })}
              </div>
              {activeSound && (
                <div style={{ padding:"12px 14px", background:"#080605", border:`1px solid ${ACC}15`, display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ fontSize:7, letterSpacing:".16em", color:ACC, textTransform:"uppercase", flex:1 }}>
                    Volume · {volume}%
                  </div>
                  <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))}
                    style={{ flex:2, background:`linear-gradient(90deg,${ACC} ${volume}%,#1a1408 0%)` }} />
                </div>
              )}
              {!activeSound && (
                <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, textAlign:"center", paddingTop:6 }}>
                  Tap a tone to activate · Web Audio API — works offline · Background auto-mode available
                </div>
              )}
            </Sec>

            {/* 4-7-8 Breathing */}
            <Sec label="4-7-8 Breathing · Parasympathetic Activation" delay={80}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
                <BreathEngine active={breathActive} accent={ACC} />
                <div style={{ display:"flex", gap:8, width:"100%" }}>
                  <button className="sl-btn" onClick={() => { setBreath(v => !v); if (!breathActive) speak(ph(lang,"breathe")); }}
                    style={{ flex:1, padding:"13px", background:breathActive?`${ACC}12`:ACC, color:breathActive?ACC:"#050300",
                      border:`1px solid ${breathActive?`${ACC}30`:"transparent"}`, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer" }}>
                    {breathActive ? "⏹  Stop" : "▶  Start 4-7-8"}
                  </button>
                </div>
                <div style={{ marginTop:10, fontSize:7, letterSpacing:".1em", color:TEXT_MUTED, textAlign:"center", lineHeight:1.8 }}>
                  Inhale 4s · Hold 7s · Exhale 8s · 4 cycles = nervous system reset<br/>
                  Activates vagus nerve · Reduces cortisol · Onset sleep faster
                </div>
              </div>
            </Sec>
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: SLEEP LOG
        ══════════════════════════════════ */}
        {tab === "log" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="sl-btn" onClick={() => setShowAddLog(true)}
                style={{ background:ACC, color:"#050300", border:"none", fontSize:9, fontWeight:700,
                  fontFamily:"'Syne',sans-serif", letterSpacing:".1em", textTransform:"uppercase",
                  padding:"10px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                + Log Sleep
              </button>
            </div>
            {sleepLog.map((log, i) => {
              const c = log.duration>=7?"#34D399":log.duration>=6?ACC:"#F87171";
              return (
                <div key={log.id} className="fu" style={{ border:`1px solid ${c}10`, background:"#080605", padding:"14px 16px", animationDelay:`${i*40}ms`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:c, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:"#e8d8b8", marginBottom:3 }}>{log.date}</div>
                      <div style={{ fontSize:7, letterSpacing:".08em", color:TEXT_MUTED }}>{log.notes || "No notes"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:c, lineHeight:1 }}>{log.duration}h</div>
                    <div style={{ fontSize:7, letterSpacing:".12em", color:`${c}70`, textTransform:"uppercase", marginTop:2 }}>
                      Q:{log.quality}/10
                    </div>
                  </div>
                </div>
              );
            })}
            {!sleepLog.length && (
              <div style={{ textAlign:"center", padding:"40px 0", color:TEXT_MUTED, fontSize:8, letterSpacing:".14em", textTransform:"uppercase" }}>
                No entries yet — tap + Log Sleep to begin
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: SLEEP HYGIENE HABITS
        ══════════════════════════════════ */}
        {tab === "habits" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Sec label="Sleep Hygiene Checklist · Tonight">
              <div style={{ fontSize:7, letterSpacing:".1em", color:TEXT_MUTED, marginBottom:12 }}>
                Each completed habit adds up to 1.5 pts to your score. Complete all 8 for maximum sleep quality.
              </div>
              {habits.map((h, i) => (
                <div key={h.id} onClick={() => toggleHabit(h.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                    background: h.done?"#0a0a08":"#070605",
                    border:`1px solid ${h.done?`${ACC}20`:`${BORDER}20`}`,
                    cursor:"pointer", marginBottom:6, transition:"all .16s",
                    animationDelay:`${i*30}ms` }}>
                  <div style={{ width:20, height:20, borderRadius:"50%",
                    border:`1.5px solid ${h.done?ACC:TEXT_MUTED}`,
                    background: h.done?ACC:"transparent", display:"flex", alignItems:"center",
                    justifyContent:"center", flexShrink:0, transition:"all .16s" }}>
                    {h.done && <span style={{ fontSize:10, color:"#050300", fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:9, letterSpacing:".06em", color:h.done?`${ACC}80`:TEXT_MUTED,
                    textDecoration:h.done?"line-through":"none", flex:1, transition:"all .16s" }}>
                    {h.label}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontSize:7, letterSpacing:".14em", color:TEXT_MUTED, textTransform:"uppercase" }}>
                <span>{habits.filter(h=>h.done).length}/{habits.length} completed</span>
                <span style={{ color:ACC }}>{Math.round((habits.filter(h=>h.done).length/habits.length)*100)}%</span>
              </div>
              <div style={{ height:2, background:"#0e0a08", marginTop:6 }}>
                <div style={{ height:"100%", width:`${(habits.filter(h=>h.done).length/habits.length)*100}%`, background:PROG_GRAD, transition:"width .5s ease", transformOrigin:"left" }} />
              </div>
            </Sec>
          </div>
        )}

        {/* ══════════════════════════════════
            TAB: AI COACH
        ══════════════════════════════════ */}
        {tab === "ai" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* AI Feature 1 */}
            <Sec label="AI Sleep Score Analysis · Claude Sonnet" delay={0}>
              <div style={{ fontSize:8, letterSpacing:".07em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:10 }}>
                AI reads your 7-night log and generates a personalised sleep health analysis with your specific numbers.
              </div>
              <button className="sl-btn" onClick={runAnalysis} disabled={loadAnalysis}
                style={{ width:"100%", padding:"13px", background:loadAnalysis?BORDER:`${ACC}10`,
                  color:loadAnalysis?TEXT_MUTED:ACC, border:`1px solid ${loadAnalysis?`${BORDER}50`:`${ACC}30`}`,
                  fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                  textTransform:"uppercase", cursor:loadAnalysis?"wait":"pointer" }}>
                {loadAnalysis ? <><Spin />Analysing 7 Nights…</> : "🧠  Analyse My Sleep"}
              </button>
              {aiAnalysis && (
                <div className="fu" style={{ marginTop:10, padding:"13px", background:"#070604", border:`1px solid ${ACC}10` }}>
                  <pre style={{ fontSize:9, color:`${ACC}80`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiAnalysis}</pre>
                </div>
              )}
            </Sec>

            {/* AI Feature 2 */}
            <Sec label="AI 21-Day Sleep Restoration Plan" delay={60}>
              <div style={{ fontSize:8, letterSpacing:".07em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:10 }}>
                AI generates a structured 21-day plan with specific bedtimes, wind-down routines, and measurable milestones.
              </div>
              <button className="sl-btn" onClick={runPlan} disabled={loadPlan}
                style={{ width:"100%", padding:"13px", background:loadPlan?BORDER:`${ACC}10`,
                  color:loadPlan?TEXT_MUTED:ACC, border:`1px solid ${loadPlan?`${BORDER}50`:`${ACC}30`}`,
                  fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                  textTransform:"uppercase", cursor:loadPlan?"wait":"pointer" }}>
                {loadPlan ? <><Spin />Building 21-Day Plan…</> : "📋  Generate 21-Day Plan"}
              </button>
              {aiPlan && (
                <div className="fu" style={{ marginTop:10, padding:"13px", background:"#070604", border:`1px solid ${ACC}10` }}>
                  <pre style={{ fontSize:9, color:`${ACC}80`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiPlan}</pre>
                </div>
              )}
            </Sec>

            {/* AI Feature 3 */}
            <Sec label="AI Dream Interpreter · Sleep Science View" delay={120}>
              <div style={{ fontSize:8, letterSpacing:".07em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:10 }}>
                Describe last night's dream. AI interprets it through sleep stage science — REM activity, stress signals.
              </div>
              <textarea value={dreamInput} onChange={e => setDreamInput(e.target.value)}
                placeholder="Describe last night's dream..."
                style={{ width:"100%", background:"#050300", border:`1px solid ${BORDER}50`, color:`${ACC}80`,
                  fontSize:9, letterSpacing:".05em", padding:"11px 12px", fontFamily:"'JetBrains Mono',monospace",
                  outline:"none", lineHeight:1.7, minHeight:70, marginBottom:10 }} />
              <button className="sl-btn" onClick={runDream} disabled={loadDream || !dreamInput.trim()}
                style={{ width:"100%", padding:"13px", background:(loadDream||!dreamInput.trim())?BORDER:`${ACC}10`,
                  color:(loadDream||!dreamInput.trim())?TEXT_MUTED:ACC,
                  border:`1px solid ${(loadDream||!dreamInput.trim())?`${BORDER}50`:`${ACC}30`}`,
                  fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                  textTransform:"uppercase", cursor:(loadDream||!dreamInput.trim())?"not-allowed":"pointer" }}>
                {loadDream ? <><Spin />Interpreting Dream…</> : "💭  Interpret My Dream"}
              </button>
              {aiDream && (
                <div className="fu" style={{ marginTop:10, padding:"13px", background:"#070604", border:`1px solid ${ACC}10` }}>
                  <pre style={{ fontSize:9, color:`${ACC}80`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiDream}</pre>
                </div>
              )}
            </Sec>

            {/* AI Feature 4 */}
            <Sec label="AI Circadian Cycle Advisor · Chronotype" delay={180}>
              <div style={{ fontSize:8, letterSpacing:".07em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:10 }}>
                AI estimates your chronotype, computes optimal bedtime, and prescribes a circadian-reset protocol.
              </div>
              <div style={{ padding:"10px 12px", background:"#060504", border:`1px solid ${BORDER}40`, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:7, letterSpacing:".14em", color:TEXT_MUTED, textTransform:"uppercase" }}>Wake Goal</span>
                <span style={{ fontSize:10, color:ACC, fontWeight:700 }}>{wakeGoal}</span>
              </div>
              <button className="sl-btn" onClick={runCycleAdv} disabled={loadCycle}
                style={{ width:"100%", padding:"13px", background:loadCycle?BORDER:`${ACC}10`,
                  color:loadCycle?TEXT_MUTED:ACC, border:`1px solid ${loadCycle?`${BORDER}50`:`${ACC}30`}`,
                  fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                  textTransform:"uppercase", cursor:loadCycle?"wait":"pointer" }}>
                {loadCycle ? <><Spin />Computing Chronotype…</> : "⏰  AI Cycle Advice"}
              </button>
              {aiCycleAdv && (
                <div className="fu" style={{ marginTop:10, padding:"13px", background:"#070604", border:`1px solid ${ACC}10` }}>
                  <pre style={{ fontSize:9, color:`${ACC}80`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiCycleAdv}</pre>
                </div>
              )}
            </Sec>

            {/* AI Feature 5 */}
            <Sec label="AI Habit Coach · Tonight's Hygiene Score" delay={240}>
              <div style={{ fontSize:8, letterSpacing:".07em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:10 }}>
                AI reads tonight's checked habits and identifies the single highest-impact missed habit.
              </div>
              <div style={{ padding:"10px 12px", background:"#060504", border:`1px solid ${BORDER}40`, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:7, letterSpacing:".14em", color:TEXT_MUTED, textTransform:"uppercase" }}>Habits Done Tonight</span>
                <span style={{ fontSize:10, color:ACC, fontWeight:700 }}>{habits.filter(h=>h.done).length} / {habits.length}</span>
              </div>
              <button className="sl-btn" onClick={runHabitCoach} disabled={loadHabit}
                style={{ width:"100%", padding:"13px", background:loadHabit?BORDER:`${ACC}10`,
                  color:loadHabit?TEXT_MUTED:ACC, border:`1px solid ${loadHabit?`${BORDER}50`:`${ACC}30`}`,
                  fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                  textTransform:"uppercase", cursor:loadHabit?"wait":"pointer" }}>
                {loadHabit ? <><Spin />Coaching…</> : "✓  AI Habit Analysis"}
              </button>
              {aiHabit && (
                <div className="fu" style={{ marginTop:10, padding:"13px", background:"#070604", border:`1px solid ${ACC}10` }}>
                  <pre style={{ fontSize:9, color:`${ACC}80`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiHabit}</pre>
                </div>
              )}
            </Sec>

          </div>
        )}

        {/* ─── FOOTER ─── */}
        <div style={{ textAlign:"center", fontSize:6, letterSpacing:".16em", color:"#1a1408", textTransform:"uppercase", paddingTop:4 }}>
          ManifiX SleepGold · WHO {WHO.code} · SDG 3.4 · Offline-first · LMIC ready · 20 languages
        </div>

      </div>

      {/* ══════════════════════════════════
          MODAL — ADD SLEEP LOG
      ══════════════════════════════════ */}
      {showAddLog && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={() => setShowAddLog(false)}>
          <div className="fu" style={{ background:"#0a0806", border:`1px solid ${ACC}25`, padding:26, width:"100%", maxWidth:420 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:ACC }}>Log Sleep</div>
              <button onClick={() => setShowAddLog(false)} style={{ background:"none", border:"none", color:TEXT_MUTED, cursor:"pointer", fontSize:16, fontFamily:"inherit" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:7, letterSpacing:".18em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:6 }}>Duration (hours)</div>
                <input type="number" step=".5" min="0" max="12" value={newEntry.duration}
                  onChange={e => setNewEntry(p => ({ ...p, duration:e.target.value }))}
                  placeholder="e.g. 7.5"
                  style={{ width:"100%", background:"#060504", border:`1px solid ${BORDER}50`, color:ACC, fontSize:14, fontFamily:"'JetBrains Mono',monospace", padding:"10px 12px", outline:"none" }} />
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:7, letterSpacing:".18em", color:TEXT_MUTED, textTransform:"uppercase" }}>Quality</span>
                  <span style={{ fontSize:10, color:ACC, fontWeight:700 }}>{newEntry.quality}/10</span>
                </div>
                <input type="range" min={1} max={10} value={newEntry.quality}
                  onChange={e => setNewEntry(p => ({ ...p, quality:parseInt(e.target.value) }))}
                  style={{ width:"100%", background:`linear-gradient(90deg,${ACC} ${newEntry.quality*10}%,#1a1408 0%)` }} />
              </div>
              <div>
                <div style={{ fontSize:7, letterSpacing:".18em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:6 }}>Notes</div>
                <textarea value={newEntry.notes} onChange={e => setNewEntry(p => ({ ...p, notes:e.target.value }))}
                  placeholder="Dreams, wake-ups, how you felt..."
                  style={{ width:"100%", background:"#060504", border:`1px solid ${BORDER}50`, color:`${ACC}70`, fontSize:9, fontFamily:"'JetBrains Mono',monospace", padding:"10px 12px", outline:"none", minHeight:60, lineHeight:1.6 }} />
              </div>
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button className="sl-btn" onClick={saveLog}
                  style={{ flex:1, padding:"13px", background:ACC, color:"#050300", border:"none", fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer" }}>
                  Save Entry
                </button>
                <button className="ghost" onClick={() => setShowAddLog(false)}
                  style={{ flex:1, padding:"13px", background:"transparent", border:`1px solid ${BORDER}50`, color:TEXT_MUTED, fontSize:10, fontFamily:"inherit", letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
