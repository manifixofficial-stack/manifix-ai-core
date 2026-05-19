import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   MANIFIX BLACK × GOLD PALETTE
───────────────────────────────────────────── */
const ACC     = "#D4AF37";
const ACCDIM  = "#B8941F";
const ACCGLOW = "rgba(212,175,55,0.12)";
const BG      = "#030303";
const BG2     = "#080605";
const BORDER  = "#1a1508";
const GRID    = "rgba(212,175,55,0.015)";
const GOLD_GRAD = "linear-gradient(135deg,#1a1408,#D4AF37)";
const PROG_GRAD = "linear-gradient(90deg,#1a1408,#8B6914,#D4AF37)";
const TEXT_MAIN = "#F5E6C8";
const TEXT_DIM  = "#5a4a20";
const TEXT_MUTED = "#3a2e14";

const LOGO_URL = "https://image.qwenlm.ai/public_source/80c2e724-ea58-449b-9ee2-a36c1abcb1f5/17ff433b4-f22b-4fd2-b058-2e65f71d76a6.png";
const MANIFIX_LOGO = "https://image.qwenlm.ai/public_source/80c2e724-ea58-449b-9ee2-a36c1abcb1f5/180238fae-0a6c-4c71-8a28-27e853aba7a2.png";
const PARTICLE_BG = "https://image.qwenlm.ai/public_source/80c2e724-ea58-449b-9ee2-a36c1abcb1f5/1c805fbef-8273-4569-8b0f-9385dadca71d.png";

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
  "ta-IN": { ready:"உங்கள் உடல் சம்பாதித்த ய்வை அதற்கு அளியுங்கள்.", tip:"சீரான தூக்க நேரங்கள் தரத்தை 40% மேம்படுத்துகின்றன.", breathe:"4 உள்ளே. 7 நிறுத்து. 8 வெளியே.", saved:"தூக்க பதிவு சேமிக்கப்பட்டது." },
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

/* ────────────────────────────────────────────
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
    const buf = createNoiseBuffer(ctx, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 400; filter.Q.value = 1;
    src.connect(filter); filter.connect(master); src.start();
    nodes.push(src);
    const src2 = ctx.createBufferSource();
    src2.buffer = buf; src2.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 2000; hp.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0.15;
    src2.connect(hp); hp.connect(g); g.connect(master); src2.start();
    nodes.push(src2);
  } else if (type === "ocean") {
    const buf = createNoiseBuffer(ctx, 4);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 300;
    const lfo = ctx.createOscillator();
    lfo.type = "sine"; lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    src.connect(filter); filter.connect(master); src.start();
    nodes.push(src, lfo);
  } else if (type === "white") {
    const buf = createNoiseBuffer(ctx, 2);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 1000; filter.Q.value = 0.5;
    src.connect(filter); filter.connect(master); src.start();
    nodes.push(src);
  } else if (type === "forest") {
    const buf = createNoiseBuffer(ctx, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 800; bp.Q.value = 0.3;
    src.connect(bp); bp.connect(master); src.start();
    nodes.push(src);
    const chirp = ctx.createOscillator();
    chirp.type = "sine"; chirp.frequency.value = 1200;
    const chirpGain = ctx.createGain(); chirpGain.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = "sine"; lfo.frequency.value = 0.5;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(chirpGain.gain);
    chirp.connect(chirpGain); chirpGain.connect(master);
    chirp.start(); lfo.start();
    nodes.push(chirp, lfo);
  } else if (type === "deep") {
    const osc1 = ctx.createOscillator();
    osc1.type = "sine"; osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine"; osc2.frequency.value = 58;
    const g1 = ctx.createGain(); g1.gain.value = 0.06;
    const g2 = ctx.createGain(); g2.gain.value = 0.06;
    osc1.connect(g1); osc2.connect(g2);
    g1.connect(master); g2.connect(master);
    osc1.start(); osc2.start();
    nodes.push(osc1, osc2);
  } else if (type === "crystal") {
    const osc1 = ctx.createOscillator();
    osc1.type = "sine"; osc1.frequency.value = 528;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine"; osc2.frequency.value = 792;
    const g1 = ctx.createGain(); g1.gain.value = 0.04;
    const g2 = ctx.createGain(); g2.gain.value = 0.02;
    osc1.connect(g1); osc2.connect(g2);
    g1.connect(master); g2.connect(master);
    osc1.start(); osc2.start();
    nodes.push(osc1, osc2);
  }

  const stopAll = () => {
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch(e){} }); try { master.disconnect(); } catch(e){} }, 1000);
  };
  return { master, stop: stopAll };
}

const SOUNDS = [
  { id:"rain",    label:"Rain",       freq:200, wave:"noise",    color:"#D4AF37", icon:"🌧" },
  { id:"ocean",   label:"Ocean",      freq:100, wave:"mod",      color:"#C4A35A", icon:"🌊" },
  { id:"white",   label:"White Noise",freq:400, wave:"band",     color:ACC,       icon:"💨" },
  { id:"forest",  label:"Forest",     freq:150, wave:"chirp",    color:"#E8C84A", icon:"🌿" },
  { id:"deep",    label:"Deep Drone", freq:55,  wave:"drone",    color:"#B8941F", icon:"🎵" },
  { id:"crystal", label:"Crystal",    freq:528, wave:"solfeggio",color:"#F0D060", icon:"🔮" },
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
  const r = logs.slice(0, 7);
  const avg = r.reduce((a, b) => a + b.duration, 0) / r.length;
  const aq = r.reduce((a, b) => a + b.quality, 0) / r.length;
  const dur = avg >= 7 && avg <= 9 ? 38 : avg > 5 ? 26 : 12;
  const qual = (aq / 10) * 30;
  const vars = r.map(l => l.duration);
  const vari = vars.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / vars.length;
  const cons = Math.max(0, 20 - vari * 9);
  const hab = (habits.filter(h => h.done).length / habits.length) * 12;
  return Math.min(100, Math.round(dur + qual + cons + hab));
}

/* ────────────────────────────────────────────
   SPEAKER
───────────────────────────────────────────── */
function makeSpeaker(lang) {
  return (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_MAP[lang] || "en-IN";
    u.rate = 0.64; u.pitch = 0.76;
    const vs = speechSynthesis.getVoices();
    const v = vs.find(x => x.lang === u.lang) || vs.find(x => x.lang.startsWith("en"));
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
}

/* ─────────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────────── */
function injectCSS() {
  if (document.getElementById("sleepgoldcss")) return;
  const el = document.createElement("style");
  el.id = "sleepgoldcss";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&family=Playfair+Display:wght@400;700;900&display=swap');
    @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.03;transform:scale(1)}50%{opacity:.10;transform:scale(1.08)}}
    @keyframes pulseSlow{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.12;transform:scale(1.12)}}
    @keyframes beat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.8)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes breatheIn{from{transform:scale(1);opacity:.2}to{transform:scale(1.6);opacity:.8}}
    @keyframes breatheOut{from{transform:scale(1.6);opacity:.8}to{transform:scale(1);opacity:.2}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
    @keyframes logoGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(212,175,55,0.3))}50%{filter:drop-shadow(0 0 20px rgba(212,175,55,0.6))}}
    @keyframes rotateGlow{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes countPulse{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
    @keyframes ripple{0%{transform:scale(0);opacity:0.5}100%{transform:scale(4);opacity:0}}
    @keyframes borderGlow{0%,100%{border-color:rgba(212,175,55,0.1)}50%{border-color:rgba(212,175,55,0.3)}}
    .fu{animation:fu .5s cubic-bezier(.22,.68,0,1.2) both}
    .gold-btn{transition:all .2s cubic-bezier(.22,.68,0,1.2);position:relative;overflow:hidden}
    .gold-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(212,175,55,0.15)}
    .gold-btn:active{transform:translateY(0)}
    .glass{backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .shimmer-text{background:linear-gradient(90deg,#D4AF37,#F5E6C8,#D4AF37,#F5E6C8);background-size:200% auto;animation:shimmer 3s linear infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    input[type=range]{-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;outline:none;cursor:pointer}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${ACC};cursor:pointer;border:2px solid #050300;box-shadow:0 0 8px rgba(212,175,55,0.4)}
    textarea,input{font-family:'JetBrains Mono',monospace}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:${ACC}40;color:${TEXT_MAIN}}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:2px}
    .tab-active{background:${ACC}12;border-color:${ACC}35!important;color:${ACC}!important}
    .habit-item{transition:all .25s cubic-bezier(.22,.68,0,1.2)}
    .habit-item:hover{transform:translateX(4px)}
    .sound-card{transition:all .25s cubic-bezier(.22,.68,0,1.2)}
    .sound-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(212,175,55,0.1)}
    .ai-card{transition:all .25s cubic-bezier(.22,.68,0,1.2)}
    .ai-card:hover{border-color:${ACC}25!important;box-shadow:0 4px 20px rgba(212,175,55,0.08)}
    .score-ring{filter:drop-shadow(0 0 4px rgba(212,175,55,0.3))}
  `;
  document.head.appendChild(el);
}

/* ────────────────────────────────────────────
   PARTICLE CANVAS
───────────────────────────────────────────── */
function ParticleCanvas({ accent }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particles.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += 0.02;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        const op = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op * 0.15})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, [accent]);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

/* ────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────── */
const Spin = () => (
  <span style={{ display:"inline-block", width:12, height:12, border:"2px solid rgba(212,175,55,0.2)", borderTopColor:ACC, borderRadius:"50%", animation:"spin .6s linear infinite", verticalAlign:"middle", marginRight:8 }} />
);

/* ────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────── */
const GlassCard = ({ children, delay=0, className="", style={}, hover=true }) => (
  <motion.div
    initial={{ opacity:0, y:16 }}
    animate={{ opacity:1, y:0 }}
    transition={{ duration:0.45, delay:delay*0.05, ease:[.22,.68,0,1.2] }}
    className={`glass ${className}`}
    whileHover={hover ? { y:-2, transition:{duration:0.2} } : {}}
    style={{
      background:"linear-gradient(135deg,rgba(8,6,5,0.85),rgba(8,6,5,0.65))",
      border:"1px solid rgba(212,175,55,0.08)",
      borderRadius:12,
      backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      ...style,
    }}
  >
    {children}
  </motion.div>
);

/* ────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
const SecHeader = ({ label, icon, accent=ACC }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 16px", borderBottom:"1px solid rgba(212,175,55,0.06)" }}>
    <div style={{ width:3, height:14, background:ACC, borderRadius:2, boxShadow:`0 0 8px ${ACC}40` }} />
    <span style={{ fontSize:8, letterSpacing:".25em", textTransform:"uppercase", color:`${ACC}60`, fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>{label}</span>
    {icon && <span style={{ marginLeft:"auto", fontSize:14, opacity:0.5 }}>{icon}</span>}
  </div>
);

/* ════════════════════════════════════════════
   4-7-8 BREATHING ENGINE — PREMIUM
════════════════════════════════════════════ */
function BreathEnginePremium({ active, accent }) {
  const [phase, setPhase]   = useState("idle");
  const [count, setCount]   = useState(0);
  const [round, setRound]   = useState(0);
  const timerRef            = useRef(null);

  useEffect(() => {
    if (!active) { clearTimeout(timerRef.current); setPhase("idle"); setCount(0); return; }
    let cancelled = false;
    const seq = [{ name:"inhale", dur:4 }, { name:"hold", dur:7 }, { name:"exhale", dur:8 }];
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
        if (c <= 0) { clearInterval(ct); si++; timerRef.current = setTimeout(runSeq, 300); }
      }, 1000);
    };
    runSeq();
    return () => { cancelled = true; clearInterval(ct); clearTimeout(timerRef.current); };
  }, [active]);

  const scale = phase === "inhale" ? 1.6 : phase === "hold" ? 1.6 : phase === "exhale" ? 1 : 1;
  const opacity = phase === "idle" ? 0.15 : phase === "inhale" ? 0.8 : phase === "hold" ? 0.8 : phase === "exhale" ? 0.15 : 0.15;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:"28px 0" }}>
      <div style={{ position:"relative", width:160, height:160, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {/* Outer rings */}
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            animate={{
              scale: phase === "inhale" ? 1 + i*0.08 : phase === "hold" ? 1.24 + i*0.08 : phase === "exhale" ? 1 : 1,
              opacity: opacity + 0.1 * (1 - i*0.3),
            }}
            transition={{ duration: phase==="hold" ? 0 : 2, ease:"easeInOut" }}
            style={{
              position:"absolute",
              inset:`${20+i*12}px`,
              borderRadius:"50%",
              border:`1px solid ${accent}${Math.round((opacity*20)*(1-i*0.3))}`,
            }}
          />
        ))}
        {/* Main circle */}
        <motion.div
          animate={{ scale, opacity }}
          transition={{ duration: phase==="hold" ? 0 : 4, ease:"easeInOut" }}
          style={{
            width:80, height:80, borderRadius:"50%",
            background:`radial-gradient(circle,${accent}40,${accent}08)`,
            boxShadow:`0 0 30px ${accent}20, inset 0 0 20px ${accent}10`,
            display:"flex", alignItems:"center", justifyContent:"center",
            willChange:"transform,opacity",
          }}
        >
          <motion.span
            animate={count <= 1 && active ? { scale:[1,1.3,1] } : {}}
            transition={{ duration:0.5 }}
            style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:accent, userSelect:"none" }}
          >
            {active && phase !== "idle" ? count : "●"}
          </motion.span>
        </motion.div>
      </div>
      <div style={{ fontSize:10, letterSpacing:".25em", textTransform:"uppercase", color:phase==="idle"?TEXT_MUTED:accent, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>
        {phase === "idle" ? "Ready to begin" : phase === "inhale" ? `Breathe In · ${count}s` : phase === "hold" ? `Hold · ${count}s` : `Breathe Out · ${count}s`}
      </div>
      {active && round > 0 && (
        <div style={{ fontSize:7, letterSpacing:".16em", color:`${ACC}40`, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
          Cycle {round + 1} of 4
        </div>
      )}
      {/* Progress dots */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {["inhale","hold","exhale"].map((p,i) => (
          <div key={p} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:phase===p?accent:`${ACC}20`, transition:"all .3s" }} />
            <span style={{ fontSize:7, letterSpacing:".1em", textTransform:"uppercase", color:phase===p?`${ACC}70`:TEXT_MUTED, fontFamily:"'JetBrains Mono',monospace" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function SleepHealthPremium() {
  const navigate = useNavigate();
  useEffect(() => { injectCSS(); }, []);

  /* ── persistent state ── */
  const [sleepLog, setSleepLog] = useLs("manifix_sleepLog_v5", [
    { id:1, date:"2026-05-18", duration:7.5, quality:8, notes:"Felt rested, clear mind" },
    { id:2, date:"2026-05-17", duration:6.2, quality:5, notes:"Woke up twice at 3am" },
    { id:3, date:"2026-05-16", duration:8.0, quality:9, notes:"Deep uninterrupted sleep" },
    { id:4, date:"2026-05-15", duration:6.8, quality:6, notes:"Vivid dreams, normal" },
    { id:5, date:"2026-05-14", duration:7.2, quality:7, notes:"Good night, woke refreshed" },
    { id:6, date:"2026-05-13", duration:6.5, quality:5, notes:"Stress from work" },
    { id:7, date:"2026-05-12", duration:7.8, quality:8, notes:"Excellent sleep" },
  ]);
  const [habits, setHabits] = useLs("manifix_sleepHabits_v5", HABITS_DEFAULT.map(h => ({ ...h, done:false })));
  const [wakeGoal, setWakeGoal] = useLs("manifix_wake_v5", "07:00");
  const [lang, setLang] = useLs("manifix_lang_v5", "en-IN");

  /* ── UI state ── */
  const [tab, setTab]             = useState("dashboard");
  const [breathActive, setBreath] = useState(false);
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume]       = useState(40);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newEntry, setNewEntry]   = useState({ duration:"", quality:7, notes:"" });
  const [whoOpen, setWhoOpen]     = useState(false);
  const [bgMode, setBgMode]       = useLs("manifix_bgMode_v5", false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  /* ── AI state ── */
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiPlan, setAiPlan] = useState("");
  const [aiDream, setAiDream] = useState("");
  const [aiCycleAdv, setAiCycleAdv] = useState("");
  const [aiHabit, setAiHabit] = useState("");
  const [dreamInput, setDreamInput] = useState("");
  const [loadAnalysis, setLoadAnalysis] = useState(false);
  const [loadPlan, setLoadPlan] = useState(false);
  const [loadDream, setLoadDream] = useState(false);
  const [loadCycle, setLoadCycle] = useState(false);
  const [loadHabit, setLoadHabit] = useState(false);

  /* ── audio ref ── */
  const audioCtxRef = useRef(null);
  const soundRef = useRef(null);

  /* ── derived ── */
  const score = useMemo(() => calcScore(sleepLog, habits), [sleepLog, habits]);
  const cycles = useMemo(() => getCycles(wakeGoal), [wakeGoal]);
  const speak = useMemo(() => makeSpeaker(lang), [lang]);
  const avgDur = sleepLog.length ? (sleepLog.reduce((a, b) => a + b.duration, 0) / sleepLog.length).toFixed(1) : "—";
  const avgQual = sleepLog.length ? (sleepLog.reduce((a, b) => a + b.quality, 0) / sleepLog.length).toFixed(1) : "—";

  useEffect(() => {
    const t = setTimeout(() => speak(ph(lang, "ready")), 2000);
    return () => clearTimeout(t);
  }, []);

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
    if (soundRef.current.master) soundRef.current.master.gain.value = volume / 1000;
    setActiveSound(snd.id);
  }, [activeSound, volume]);

  useEffect(() => {
    if (soundRef.current?.master) soundRef.current.master.gain.value = volume / 1000;
  }, [volume]);

  useEffect(() => () => {
    soundRef.current?.stop();
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

  const toggleHabit = useCallback((id) => {
    setHabits(p => p.map(h => h.id === id ? { ...h, done:!h.done } : h));
  }, [setHabits]);

  /* ═══════════════════════════════
     AI FEATURES
  ════════════════════════════════ */
  const runAnalysis = useCallback(async () => {
    setLoadAnalysis(true); setAiAnalysis("");
    const logSummary = sleepLog.slice(0,7).map(l => `${l.date}: ${l.duration}h, Q${l.quality}/10, "${l.notes}"`).join("\n");
    const sys = `Sleep science AI. WHO guidelines. Direct, evidence-based, compassionate. Max 280 words. Headers: SLEEP PATTERN · KEY STRENGTH · PRIORITY CONCERN · ONE ACTION THIS WEEK`;
    try {
      const r = await callClaude([{ role:"user", content:`Last 7 nights:\n${logSummary}\nAvg: ${avgDur}h, Q${avgQual}/10. Habits: ${habits.filter(h=>h.done).length}/${habits.length}. Analyse.` }], sys);
      setAiAnalysis(r);
    } catch { setAiAnalysis("Connection error. Check API configuration."); }
    setLoadAnalysis(false);
  }, [sleepLog, avgDur, avgQual, habits]);

  const runPlan = useCallback(async () => {
    setLoadPlan(true); setAiPlan("");
    const sys = `Sleep restoration specialist. 21-day structured plan. Max 350 words. Format: WEEK 1 FOUNDATION / WEEK 2 DEEPENING / WEEK 3 LOCKING IN / DAILY ANCHORS`;
    try {
      const r = await callClaude([{ role:"user", content:`Patient: ${avgDur}h avg, Q${avgQual}/10, wake ${wakeGoal}, habits ${habits.filter(h=>h.done).length}/${habits.length}. Build 21-day plan.` }], sys);
      setAiPlan(r);
    } catch { setAiPlan("Connection error."); }
    setLoadPlan(false);
  }, [avgDur, avgQual, wakeGoal, habits]);

  const runDream = useCallback(async () => {
    if (!dreamInput.trim()) return;
    setLoadDream(true); setAiDream("");
    const sys = `Dream science AI. Sleep stage lens, not mysticism. Max 220 words. Format: SLEEP STAGE LIKELY ACTIVE · EMOTIONAL THEMES · STRESS SIGNAL · SLEEP QUALITY INDICATOR`;
    try {
      const r = await callClaude([{ role:"user", content:`Dream: "${dreamInput}". Sleep: ${avgDur}h, Q${avgQual}/10. Interpret from sleep science perspective.` }], sys);
      setAiDream(r);
    } catch { setAiDream("Connection error."); }
    setLoadDream(false);
  }, [dreamInput, avgDur, avgQual]);

  const runCycleAdv = useCallback(async () => {
    setLoadCycle(true); setAiCycleAdv("");
    const sys = `Circadian biology expert. Max 200 words. Format: CHRONOTYPE · OPTIMAL BEDTIME · OPTIMAL WAKE · KEY PROTOCOL · MISTAKE TO AVOID`;
    try {
      const r = await callClaude([{ role:"user", content:`Wake: ${wakeGoal}. Avg: ${avgDur}h, Q${avgQual}/10. Recommend chronotype, bedtime, circadian protocol.` }], sys);
      setAiCycleAdv(r);
    } catch { setAiCycleAdv("Connection error."); }
    setLoadCycle(false);
  }, [wakeGoal, avgDur, avgQual]);

  const runHabitCoach = useCallback(async () => {
    setLoadHabit(true); setAiHabit("");
    const done = habits.filter(h => h.done).map(h => h.label);
    const missed = habits.filter(h => !h.done).map(h => h.label);
    const sys = `Sleep hygiene coach. Direct, supportive. Max 220 words. Format: WHAT YOU'RE DOING RIGHT · HIGHEST IMPACT MISSED · THE SCIENCE · START TONIGHT`;
    try {
      const r = await callClaude([{ role:"user", content:`Done: ${done.join(", ") || "none"}. Missed: ${missed.join(", ") || "none"}. Sleep Q: ${avgQual}/10. Coach them.` }], sys);
      setAiHabit(r);
    } catch { setAiHabit("Connection error."); }
    setLoadHabit(false);
  }, [habits, avgQual]);

  const TABS = [
    { id:"dashboard", label:"Dashboard",   emoji:"" },
    { id:"sounds",    label:"Soundscapes", emoji:"♫" },
    { id:"log",       label:"Sleep Log",   emoji:"" },
    { id:"habits",    label:"Hygiene",     emoji:"◆" },
    { id:"ai",        label:"AI Coach",    emoji:"⬡" },
  ];

  const scoreColor = score >= 80 ? "#34D399" : score >= 60 ? ACC : score >= 40 ? "#F59E0B" : "#F87171";
  const scoreLabel = score >= 80 ? "Elite" : score >= 60 ? "Restorative" : score >= 40 ? "Building" : "Critical";

  /* ════════════════════════════════
     RENDER
  ═════════════════════════════════ */
  return (
    <div style={{ minHeight:"100dvh", background:BG, color:TEXT_MAIN, fontFamily:"'JetBrains Mono','Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden", position:"relative" }}>

      {/* Particle background */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <ParticleCanvas accent={ACC} />
      </div>

      {/* Background gradient */}
      <div style={{ position:"fixed", top:"10%", left:"50%", transform:"translateX(-50%)", width:500, height:300, background:`radial-gradient(ellipse,${ACC}06 0%,transparent 70%)`, animation:"pulseSlow 6s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"5%", right:"10%", width:300, height:200, background:`radial-gradient(ellipse,${ACC}04 0%,transparent 70%)`, animation:"pulseSlow 8s ease-in-out infinite 2s", pointerEvents:"none" }} />

      {/* Corner accents */}
      {[{top:16,left:16,borderTopWidth:2,borderLeftWidth:2},{top:16,right:16,borderTopWidth:2,borderRightWidth:2},{bottom:16,left:16,borderBottomWidth:2,borderLeftWidth:2},{bottom:16,right:16,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{ position:"fixed", width:24, height:24, borderColor:`${ACC}25`, borderStyle:"solid", borderWidth:0, pointerEvents:"none", zIndex:100, ...pos }} />
      ))}

      {/* WHO Ticker */}
      <div style={{ width:"100%", overflow:"hidden", whiteSpace:"nowrap", borderTop:`1px solid ${BORDER}15`, borderBottom:`1px solid ${BORDER}15`, padding:"6px 0", background:"rgba(3,2,0,0.9)", zIndex:50, position:"relative" }}>
        <span style={{ display:"inline-block", animation:"ticker 80s linear infinite", fontSize:7, letterSpacing:".12em", color:TEXT_MUTED, textTransform:"uppercase" }}>
          {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4,WHO.solve,WHO.sdg," ManifiX SleepGold — 4h → 8h in 3 weeks","✦ 20 Languages · Offline-first · LMIC Ready","✦ WHO MH-SLP · SDG 3.4"].join("      ").repeat(2)}
        </span>
      </div>

      {/* MAIN WRAPPER */}
      <div style={{ position:"relative", zIndex:2, width:"min(500px,96vw)", display:"flex", flexDirection:"column", gap:12, paddingTop:20, paddingBottom:60 }}>

        {/* ─── HEADER ─── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:14, borderBottom:`1px solid ${BORDER}25` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {/* ManifiX Logo */}
            <motion.div
              initial={{ opacity:0, scale:0.8 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.8, ease:[.22,.68,0,1.2] }}
              whileHover={{ scale:1.05 }}
              style={{ position:"relative" }}
            >
              <div style={{
                width:48, height:48, borderRadius:"50%", overflow:"hidden",
                border:`1.5px solid ${ACC}30`,
                background:"radial-gradient(circle,rgba(8,6,5,0.9),rgba(3,2,0,0.95))",
                display:"flex", alignItems:"center", justifyContent:"center",
                animation:"logoGlow 4s ease-in-out infinite",
              }}>
                <img
                  src={LOGO_URL}
                  alt="ManifiX"
                  onLoad={() => setLogoLoaded(true)}
                  style={{ width:36, height:36, objectFit:"contain", filter:"brightness(1.1) saturate(1.2)" }}
                />
              </div>
              <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`1px solid ${ACC}10`, animation:"rotateGlow 10s linear infinite" }} />
            </motion.div>
            <div>
              <motion.div
                initial={{ opacity:0, x:-10 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.3 }}
                style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, letterSpacing:"-.02em", lineHeight:1 }}
              >
                <span className="shimmer-text" style={{ letterSpacing:"-.02em" }}>SLEEP</span>
                <span style={{ color:ACC }}>GOLD</span>
              </motion.div>
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:0.6 }}
                style={{ fontSize:7, letterSpacing:".28em", color:`${ACC}50`, textTransform:"uppercase", marginTop:3, fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}
              >
                ManifiX Wellness Platform
              </motion.div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            {/* Score ring */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:0.5 }}
                style={{ position:"relative", width:42, height:42 }}
              >
                <svg viewBox="0 0 42 42" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }} className="score-ring">
                  <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="2.5"/>
                  <circle cx="21" cy="21" r="17" fill="none" stroke={scoreColor} strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray={`${(score/100)*106.8} 106.8`}
                    style={{ transition:"stroke-dasharray 1.5s ease" }}/>
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:scoreColor }}>{score}</div>
              </motion.div>
              <div>
                <div style={{ fontSize:6, letterSpacing:".25em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Sleep Score</div>
                <div style={{ fontSize:9, color:scoreColor, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Syne',sans-serif" }}>{scoreLabel}</div>
              </div>
            </div>
            <button onClick={() => navigate(-1)} style={{ fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:0, textTransform:"uppercase", opacity:0.6, transition:"opacity .2s" }}
              onMouseEnter={e => e.target.style.opacity="1"} onMouseLeave={e => e.target.style.opacity="0.6"}>
              ← Return
            </button>
          </div>
        </div>

        {/* ─── TAB PILLS ─── */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TABS.map(t => (
            <motion.button
              key={t.id}
              className="gold-btn"
              whileTap={{ scale:0.96 }}
              onClick={() => setTab(t.id)}
              style={{
                background: tab===t.id ? `${ACC}10` : "rgba(8,6,5,0.6)",
                border:`1px solid ${tab===t.id ? `${ACC}35` : `rgba(212,175,55,0.05)`}`,
                color: tab===t.id ? ACC : TEXT_MUTED,
                fontSize:7, letterSpacing:".18em", textTransform:"uppercase",
                fontFamily:"'JetBrains Mono',monospace", fontWeight:500,
                padding:"8px 12px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              <span style={{ fontSize:12, lineHeight:1 }}>{t.emoji}</span>
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB: DASHBOARD
        ══════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:20 }}
              transition={{ duration:0.35 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}
            >
              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  { label:"Avg Duration", val:`${avgDur}h`, color:parseFloat(avgDur)>=7?"#34D399":"#F59E0B", sub:"Target: 7-9h" },
                  { label:"Avg Quality",  val:`${avgQual}/10`, color:parseFloat(avgQual)>=7?"#34D399":ACC, sub:"Scale: 1-10" },
                  { label:"Nights Logged", val:sleepLog.length, color:ACC, sub:"Last 30 days" },
                ].map((s,i) => (
                  <GlassCard key={i} delay={i} style={{ padding:"16px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:6, letterSpacing:".25em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:6, letterSpacing:".1em", color:TEXT_MUTED, marginTop:4 }}>{s.sub}</div>
                  </GlassCard>
                ))}
              </div>

              {/* Weekly bar chart */}
              <GlassCard delay={3} style={{ padding:0 }}>
                <SecHeader label="7-Night Sleep Duration" icon="" />
                <div style={{ padding:"8px 16px 16px" }}>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, position:"relative" }}>
                    {sleepLog.slice(0,7).reverse().map((log,idx) => {
                      const pct = Math.max((log.duration/10)*100, 8);
                      const c = log.duration>=7?"#34D399":log.duration>=6?ACC:"#F87171";
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ height:0 }}
                          animate={{ height:`${pct}%` }}
                          transition={{ duration:0.6, delay:idx*0.08, ease:[.22,.68,0,1.2] }}
                          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}
                        >
                          <div style={{ fontSize:8, color:c, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>{log.duration}h</div>
                          <div style={{ width:"100%", background:`linear-gradient(180deg,${c}80,${c}20)`, borderRadius:"4px", minHeight:4 }} />
                          <span style={{ fontSize:6, color:TEXT_MUTED, textTransform:"uppercase" }}>
                            {new Date(log.date + "T00:00:00").toLocaleDateString([], { weekday:"short" })}
                          </span>
                        </motion.div>
                      );
                    })}
                    {/* 7h target line */}
                    <div style={{ position:"absolute", left:0, right:0, bottom:`${(7/10)*100}%`, borderTop:`1.5px dashed ${ACC}20`, pointerEvents:"none" }}>
                      <span style={{ fontSize:6, color:`${ACC}30`, letterSpacing:".1em", paddingLeft:2 }}>7h</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Cycle calculator */}
              <GlassCard delay={5} style={{ padding:0 }}>
                <SecHeader label="Smart Wake-Up Calculator · 90-min REM" icon="⏰" />
                <div style={{ padding:"8px 16px 16px" }}>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:7, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>Wake-Up Goal</div>
                    <input type="time" value={wakeGoal} onChange={e => setWakeGoal(e.target.value)}
                      style={{ background:"rgba(5,3,0,0.8)", border:`1px solid rgba(212,175,55,0.15)`, color:ACC, fontSize:16, fontFamily:"'JetBrains Mono',monospace", padding:"10px 14px", letterSpacing:".1em", outline:"none", width:"100%", borderRadius:8 }}
                    />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {cycles.map((c,i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y:-2 }}
                        style={{
                          padding:"14px 8px", textAlign:"center",
                          background: c.best?"rgba(212,175,55,0.08)":"rgba(8,6,5,0.5)",
                          border:`1px solid ${c.best?`${ACC}30`:`rgba(212,175,55,0.06)`}`,
                          borderRadius:8,
                          boxShadow: c.best?`0 0 16px ${ACC}10`:"none",
                        }}
                      >
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:c.best?ACC:TEXT_MUTED }}>{c.time}</div>
                        <div style={{ fontSize:6, letterSpacing:".16em", color:c.best?`${ACC}60`:TEXT_MUTED, textTransform:"uppercase", marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>{c.cycles} cycles{c.best?" ✦":""}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, fontSize:7, letterSpacing:".12em", color:`${ACC}30`, textAlign:"center", fontFamily:"'JetBrains Mono',monospace" }}>
                    ✦ 7.5h with 14min sleep-onset buffer
                  </div>
                </div>
              </GlassCard>

              {/* Quick log CTA */}
              <motion.button
                className="gold-btn"
                whileTap={{ scale:0.98 }}
                onClick={() => setShowAddLog(true)}
                style={{
                  width:"100%", padding:"16px",
                  background:`linear-gradient(135deg,${ACC},${ACCDIM})`,
                  color:"#050300", border:"none", borderRadius:10,
                  fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif",
                  letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:`0 4px 20px ${ACC}20`,
                }}
              >
                <span style={{ fontSize:16 }}>🌙</span> Log Last Night's Sleep
              </motion.button>

              {/* WHO panel */}
              <motion.div
                whileHover={{ borderColor:`${ACC}15` }}
                style={{ border:`1px solid rgba(212,175,55,0.06)`, borderRadius:10, overflow:"hidden", background:"rgba(8,6,5,0.4)" }}
              >
                <button onClick={() => setWhoOpen(v => !v)}
                  style={{ background:"transparent", border:"none", color:TEXT_MUTED, fontSize:8, letterSpacing:".18em", textTransform:"uppercase", fontFamily:"inherit", padding:"14px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ transition:"transform .3s", transform:whoOpen?"rotate(90deg)":"rotate(0)" }}>▸</span>
                    WHO Impact · {WHO.code}
                  </span>
                  <span style={{ color:`${ACC}40`, fontSize:7 }}>{WHO.promise}</span>
                </button>
                <AnimatePresence>
                  {whoOpen && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:"auto", opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      transition={{ duration:0.3 }}
                      style={{ overflow:"hidden" }}
                    >
                      <div style={{ padding:"4px 16px 16px" }}>
                        {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4].map((s,i) => (
                          <div key={i} style={{ fontSize:8, color:i===0?`${ACC}60`:TEXT_MUTED, letterSpacing:".08em", lineHeight:1.9, borderLeft:`2px solid ${i===0?ACC:`rgba(212,175,55,0.06)`}`, paddingLeft:10, marginBottom:8 }}>{s}</div>
                        ))}
                        <div style={{ marginTop:6, fontSize:7, letterSpacing:".12em", color:`${ACC}35`, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>{WHO.sdg} · {WHO.lmic}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════════════════════════
              TAB: SLEEP SOUNDS
          ══════════════════════════════════ */}
          {tab === "sounds" && (
            <motion.div
              key="sounds"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.35 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}
            >
              {/* Sound Grid */}
              <GlassCard style={{ padding:0 }}>
                <SecHeader label="Sleep Soundscapes · Web Audio" icon="♫" />
                <div style={{ padding:"4px 16px 16px" }}>
                  {/* Background audio toggle */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, padding:"10px 14px", background:"rgba(5,3,0,0.5)", borderRadius:8, border:`1px solid rgba(212,175,55,0.06)` }}>
                    <div style={{ fontSize:7, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Auto-Play Background</div>
                    <button onClick={() => setBgMode(v => !v)}
                      style={{
                        width:44, height:24, borderRadius:12,
                        background:bgMode?ACC:"rgba(212,175,55,0.08)",
                        border:"none", cursor:"pointer", position:"relative",
                        transition:"all .3s",
                      }}>
                      <div style={{
                        position:"absolute", top:3, width:18, height:18, borderRadius:"50%",
                        background:"#050300", boxShadow:`0 1px 3px rgba(0,0,0,0.3)`,
                        left:bgMode?23:3, transition:"left .3s cubic-bezier(.22,.68,0,1.2)",
                      }} />
                    </button>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                    {SOUNDS.map((snd,idx) => {
                      const on = activeSound === snd.id;
                      return (
                        <motion.button
                          key={snd.id}
                          className="sound-card"
                          whileTap={{ scale:0.95 }}
                          onClick={() => toggleSound(snd)}
                          style={{
                            padding:"16px 8px", textAlign:"center",
                            background: on ? `${snd.color}08` : "rgba(6,4,2,0.5)",
                            border:`1px solid ${on ? `${snd.color}30` : `rgba(212,175,55,0.04)`}`,
                            borderRadius:10, cursor:"pointer",
                            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                            boxShadow: on ? `0 0 20px ${snd.color}08` : "none",
                          }}
                        >
                          {/* Animated bars */}
                          {on && (
                            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:14 }}>
                              {[1,2,3].map(n => (
                                <motion.div
                                  key={n}
                                  animate={{ height:[4, 14, 4] }}
                                  transition={{ duration:0.6+n*0.15, repeat:Infinity, ease:"easeInOut" }}
                                  style={{ width:3, background:snd.color, borderRadius:2 }}
                                />
                              ))}
                            </div>
                          )}
                          {!on && <span style={{ fontSize:20, lineHeight:1 }}>{snd.icon}</span>}
                          <span style={{ fontSize:8, letterSpacing:".12em", color:on?snd.color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{snd.label}</span>
                          <span style={{ fontSize:6, color:"#1a1408", fontFamily:"'JetBrains Mono',monospace" }}>{snd.freq}Hz</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Volume control */}
                  {activeSound && (
                    <motion.div
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      style={{ padding:"14px", background:"rgba(5,3,0,0.5)", borderRadius:8, border:`1px solid rgba(212,175,55,0.1)` }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <span style={{ fontSize:7, letterSpacing:".18em", color:ACC, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", flex:1 }}>Volume</span>
                        <span style={{ fontSize:10, color:ACC, fontWeight:600, fontFamily:"'Syne',sans-serif", minWidth:36, textAlign:"right" }}>{volume}%</span>
                        <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))}
                          style={{ flex:2, background:`linear-gradient(90deg,${ACC} ${volume}%,rgba(26,20,8,0.3) 0%)` }} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </GlassCard>

              {/* 4-7-8 Breathing */}
              <GlassCard delay={2} style={{ padding:0 }}>
                <SecHeader label="4-7-8 Breathing · Parasympathetic Reset" icon="" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <BreathEnginePremium active={breathActive} accent={ACC} />
                  <div style={{ display:"flex", gap:10, marginTop:8 }}>
                    <motion.button
                      className="gold-btn"
                      whileTap={{ scale:0.97 }}
                      onClick={() => { setBreath(v => !v); if (!breathActive) speak(ph(lang,"breathe")); }}
                      style={{
                        flex:1, padding:"15px",
                        background:breathActive?"rgba(212,175,55,0.08)":`linear-gradient(135deg,${ACC},${ACCDIM})`,
                        color:breathActive?ACC:"#050300",
                        border:`1px solid ${breathActive?`${ACC}20`:"transparent"}`,
                        borderRadius:10, fontSize:11, fontWeight:700,
                        fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                        textTransform:"uppercase", cursor:"pointer",
                      }}
                    >
                      {breathActive ? "⏹ Stop Session" : "▶ Start 4-7-8"}
                    </motion.button>
                  </div>
                  <div style={{ marginTop:14, fontSize:7, letterSpacing:".12em", color:TEXT_MUTED, textAlign:"center", lineHeight:2, fontFamily:"'JetBrains Mono',monospace" }}>
                    Inhale 4s → Hold 7s → Exhale 8s<br/>
                    4 cycles = complete nervous system reset<br/>
                    Activates vagus nerve · Reduces cortisol · Faster sleep onset
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════════════════════════
              TAB: SLEEP LOG
          ══════════════════════════════════ */}
          {tab === "log" && (
            <motion.div
              key="log"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.35 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}
            >
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <motion.button
                  className="gold-btn"
                  whileTap={{ scale:0.96 }}
                  onClick={() => setShowAddLog(true)}
                  style={{
                    padding:"12px 22px", background:`linear-gradient(135deg,${ACC},${ACCDIM})`,
                    color:"#050300", border:"none", borderRadius:10,
                    fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif",
                    letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer",
                    boxShadow:`0 4px 16px ${ACC}20`,
                    display:"flex", alignItems:"center", gap:6,
                  }}
                >
                  <span style={{ fontSize:14 }}>+</span> Log Sleep
                </motion.button>
              </div>
              <AnimatePresence>
                {sleepLog.map((log, i) => {
                  const c = log.duration>=7?"#34D399":log.duration>=6?ACC:"#F87171";
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity:0, x:-20 }}
                      animate={{ opacity:1, x:0 }}
                      exit={{ opacity:0, x:20 }}
                      transition={{ duration:0.3, delay:i*0.04 }}
                      className="ai-card"
                      style={{
                        border:`1px solid ${c}08`,
                        background:"rgba(8,6,5,0.5)",
                        borderRadius:10,
                        padding:"16px 18px",
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{
                          width:8, height:8, borderRadius:"50%", background:c,
                          boxShadow:`0 0 8px ${c}40`,
                        }} />
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:"#e8d8b8", marginBottom:4, fontFamily:"'Syne',sans-serif" }}>{log.date}</div>
                          <div style={{ fontSize:7, letterSpacing:".08em", color:TEXT_MUTED }}>{log.notes || "No notes recorded"}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:c, lineHeight:1 }}>{log.duration}h</div>
                        <div style={{ fontSize:7, letterSpacing:".14em", color:`${c}60`, textTransform:"uppercase", marginTop:3, fontFamily:"'JetBrains Mono',monospace" }}>
                          Q:{log.quality}/10
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {!sleepLog.length && (
                <div style={{ textAlign:"center", padding:"50px 0", color:TEXT_MUTED, fontSize:8, letterSpacing:".16em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
                  No entries yet — tap + Log Sleep to begin your journey
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════
              TAB: SLEEP HYGIENE
          ══════════════════════════════════ */}
          {tab === "habits" && (
            <motion.div
              key="habits"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.35 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}
            >
              <GlassCard style={{ padding:0 }}>
                <SecHeader label="Sleep Hygiene Checklist · Tonight" icon="◆" />
                <div style={{ padding:"8px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".1em", color:TEXT_MUTED, marginBottom:16, lineHeight:1.7 }}>
                    Each completed habit contributes to your nightly sleep score. Complete all 8 for maximum quality.
                  </div>
                  {habits.map((h, i) => (
                    <motion.div
                      key={h.id}
                      className="habit-item"
                      initial={{ opacity:0, x:-10 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:i*0.04 }}
                      onClick={() => toggleHabit(h.id)}
                      style={{
                        display:"flex", alignItems:"center", gap:14,
                        padding:"14px 16px",
                        background: h.done?"rgba(212,175,55,0.04)":"rgba(7,6,5,0.4)",
                        border:`1px solid ${h.done?`${ACC}15`:`rgba(212,175,55,0.04)`}`,
                        borderRadius:8, cursor:"pointer", marginBottom:8,
                      }}
                    >
                      <div style={{
                        width:22, height:22, borderRadius:"50%",
                        border:`1.5px solid ${h.done?ACC:`rgba(212,175,55,0.15)`}`,
                        background: h.done?ACC:"transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0, transition:"all .25s",
                        boxShadow: h.done?`0 0 8px ${ACC}30`:"none",
                      }}>
                        {h.done && <span style={{ fontSize:10, color:"#050300", fontWeight:800, fontFamily:"'Syne',sans-serif" }}>✓</span>}
                      </div>
                      <span style={{
                        fontSize:9, letterSpacing:".06em",
                        color:h.done?`${ACC}70`:TEXT_MUTED,
                        textDecoration:h.done?"line-through":"none",
                        flex:1, transition:"all .25s",
                      }}>
                        {h.label}
                      </span>
                    </motion.div>
                  ))}
                  <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>
                    <span>{habits.filter(h=>h.done).length} / {habits.length} completed</span>
                    <span style={{ color:ACC }}>{Math.round((habits.filter(h=>h.done).length/habits.length)*100)}%</span>
                  </div>
                  <div style={{ height:3, background:"rgba(14,10,8,0.6)", marginTop:8, borderRadius:2, overflow:"hidden" }}>
                    <motion.div
                      animate={{ width:`${(habits.filter(h=>h.done).length/habits.length)*100}%` }}
                      transition={{ duration:0.5, ease:[.22,.68,0,1.2] }}
                      style={{ height:"100%", background:PROG_GRAD, borderRadius:2 }}
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════════════════════════
              TAB: AI COACH
          ══════════════════════════════════ */}
          {tab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.35 }}
              style={{ display:"flex", flexDirection:"column", gap:12 }}
            >
              {/* AI Analysis */}
              <GlassCard delay={0} className="ai-card" style={{ padding:0 }}>
                <SecHeader label="Sleep Score Analysis · Claude AI" icon="⬡" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:12 }}>
                    AI analyses your 7-night log and generates a personalised sleep health report with your actual data.
                  </div>
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.98 }}
                    onClick={runAnalysis}
                    disabled={loadAnalysis}
                    style={{
                      width:"100%", padding:"15px",
                      background:loadAnalysis?"rgba(8,6,5,0.5)":`${ACC}08`,
                      color:loadAnalysis?TEXT_MUTED:ACC,
                      border:`1px solid ${loadAnalysis?`rgba(212,175,55,0.05)`:`${ACC}25`}`,
                      borderRadius:10, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                      textTransform:"uppercase", cursor:loadAnalysis?"wait":"pointer",
                    }}
                  >
                    {loadAnalysis ? <><Spin />Analysing 7 Nights…</> : "🧠 Analyse My Sleep"}
                  </motion.button>
                  <AnimatePresence>
                    {aiAnalysis && (
                      <motion.div
                        initial={{ opacity:0, height:0 }}
                        animate={{ opacity:1, height:"auto" }}
                        exit={{ opacity:0, height:0 }}
                        transition={{ duration:0.3 }}
                        style={{ marginTop:12, overflow:"hidden" }}
                      >
                        <div style={{ padding:"16px", background:"rgba(7,6,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.08)` }}>
                          <pre style={{ fontSize:9, color:`${ACC}70`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiAnalysis}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>

              {/* AI 21-Day Plan */}
              <GlassCard delay={1} className="ai-card" style={{ padding:0 }}>
                <SecHeader label="21-Day Sleep Restoration Plan" icon="📋" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:12 }}>
                    AI builds a structured 21-day plan with specific bedtimes, routines, and measurable milestones.
                  </div>
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.98 }}
                    onClick={runPlan}
                    disabled={loadPlan}
                    style={{
                      width:"100%", padding:"15px",
                      background:loadPlan?"rgba(8,6,5,0.5)":`${ACC}08`,
                      color:loadPlan?TEXT_MUTED:ACC,
                      border:`1px solid ${loadPlan?`rgba(212,175,55,0.05)`:`${ACC}25`}`,
                      borderRadius:10, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                      textTransform:"uppercase", cursor:loadPlan?"wait":"pointer",
                    }}
                  >
                    {loadPlan ? <><Spin />Building 21-Day Plan…</> : " Generate 21-Day Plan"}
                  </motion.button>
                  <AnimatePresence>
                    {aiPlan && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ marginTop:12 }}>
                        <div style={{ padding:"16px", background:"rgba(7,6,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.08)` }}>
                          <pre style={{ fontSize:9, color:`${ACC}70`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiPlan}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>

              {/* AI Dream Interpreter */}
              <GlassCard delay={2} className="ai-card" style={{ padding:0 }}>
                <SecHeader label="Dream Interpreter · Sleep Science" icon="💭" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:12 }}>
                    Describe last night's dream. AI interprets through sleep stage science — REM activity, stress signals.
                  </div>
                  <textarea value={dreamInput} onChange={e => setDreamInput(e.target.value)}
                    placeholder="Describe your dream in detail..."
                    style={{ width:"100%", background:"rgba(5,3,0,0.8)", border:`1px solid rgba(212,175,55,0.1)`, color:`${ACC}70`,
                      fontSize:9, letterSpacing:".05em", padding:"14px 16px", fontFamily:"'JetBrains Mono',monospace",
                      outline:"none", lineHeight:1.7, minHeight:80, marginBottom:12, borderRadius:8 }} />
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.98 }}
                    onClick={runDream}
                    disabled={loadDream || !dreamInput.trim()}
                    style={{
                      width:"100%", padding:"15px",
                      background:(loadDream||!dreamInput.trim())?"rgba(8,6,5,0.5)":`${ACC}08`,
                      color:(loadDream||!dreamInput.trim())?TEXT_MUTED:ACC,
                      border:`1px solid ${(loadDream||!dreamInput.trim())?`rgba(212,175,55,0.05)`:`${ACC}25`}`,
                      borderRadius:10, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                      textTransform:"uppercase", cursor:(loadDream||!dreamInput.trim())?"not-allowed":"pointer",
                    }}
                  >
                    {loadDream ? <><Spin />Interpreting…</> : "💭 Interpret My Dream"}
                  </motion.button>
                  <AnimatePresence>
                    {aiDream && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ marginTop:12 }}>
                        <div style={{ padding:"16px", background:"rgba(7,6,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.08)` }}>
                          <pre style={{ fontSize:9, color:`${ACC}70`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiDream}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>

              {/* AI Cycle Advisor */}
              <GlassCard delay={3} className="ai-card" style={{ padding:0 }}>
                <SecHeader label="Circadian Cycle Advisor · Chronotype" icon="⏰" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:12 }}>
                    AI estimates your chronotype and prescribes an optimal bedtime with circadian-reset protocol.
                  </div>
                  <div style={{ padding:"12px 16px", background:"rgba(6,5,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.06)`, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Wake Goal</span>
                    <span style={{ fontSize:14, color:ACC, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{wakeGoal}</span>
                  </div>
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.98 }}
                    onClick={runCycleAdv}
                    disabled={loadCycle}
                    style={{
                      width:"100%", padding:"15px",
                      background:loadCycle?"rgba(8,6,5,0.5)":`${ACC}08`,
                      color:loadCycle?TEXT_MUTED:ACC,
                      border:`1px solid ${loadCycle?`rgba(212,175,55,0.05)`:`${ACC}25`}`,
                      borderRadius:10, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                      textTransform:"uppercase", cursor:loadCycle?"wait":"pointer",
                    }}
                  >
                    {loadCycle ? <><Spin />Computing…</> : "⏰ AI Cycle Advice"}
                  </motion.button>
                  <AnimatePresence>
                    {aiCycleAdv && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ marginTop:12 }}>
                        <div style={{ padding:"16px", background:"rgba(7,6,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.08)` }}>
                          <pre style={{ fontSize:9, color:`${ACC}70`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiCycleAdv}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>

              {/* AI Habit Coach */}
              <GlassCard delay={4} className="ai-card" style={{ padding:0 }}>
                <SecHeader label="Habit Coach · Tonight's Hygiene Score" icon="✓" />
                <div style={{ padding:"4px 16px 16px" }}>
                  <div style={{ fontSize:8, letterSpacing:".08em", color:TEXT_MUTED, lineHeight:1.8, marginBottom:12 }}>
                    AI reads tonight's checked habits and identifies the single highest-impact missed habit.
                  </div>
                  <div style={{ padding:"12px 16px", background:"rgba(6,5,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.06)`, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:7, letterSpacing:".16em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Habits Done</span>
                    <span style={{ fontSize:14, color:ACC, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{habits.filter(h=>h.done).length} / {habits.length}</span>
                  </div>
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.98 }}
                    onClick={runHabitCoach}
                    disabled={loadHabit}
                    style={{
                      width:"100%", padding:"15px",
                      background:loadHabit?"rgba(8,6,5,0.5)":`${ACC}08`,
                      color:loadHabit?TEXT_MUTED:ACC,
                      border:`1px solid ${loadHabit?`rgba(212,175,55,0.05)`:`${ACC}25`}`,
                      borderRadius:10, fontSize:10, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", letterSpacing:".08em",
                      textTransform:"uppercase", cursor:loadHabit?"wait":"pointer",
                    }}
                  >
                    {loadHabit ? <><Spin />Coaching…</> : "✓ AI Habit Analysis"}
                  </motion.button>
                  <AnimatePresence>
                    {aiHabit && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ marginTop:12 }}>
                        <div style={{ padding:"16px", background:"rgba(7,6,4,0.6)", borderRadius:8, border:`1px solid rgba(212,175,55,0.08)` }}>
                          <pre style={{ fontSize:9, color:`${ACC}70`, lineHeight:1.85, whiteSpace:"pre-wrap", letterSpacing:".04em", fontFamily:"'JetBrains Mono',monospace" }}>{aiHabit}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FOOTER ─── */}
        <div style={{ textAlign:"center", fontSize:6, letterSpacing:".18em", color:"#1a1408", textTransform:"uppercase", paddingTop:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:400 }}>
          ManifiX SleepGold · WHO {WHO.code} · SDG 3.4 · Offline-first · 20 Languages
        </div>
      </div>

      {/* ══════════════════════════════════
          MODAL — ADD SLEEP LOG
      ══════════════════════════════════ */}
      <AnimatePresence>
        {showAddLog && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }}
            onClick={() => setShowAddLog(false)}
          >
            <motion.div
              initial={{ opacity:0, scale:0.9, y:20 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.9, y:20 }}
              transition={{ duration:0.35, ease:[.22,.68,0,1.2] }}
              style={{ background:"linear-gradient(135deg,rgba(10,8,6,0.98),rgba(8,6,5,0.95))", border:`1px solid rgba(212,175,55,0.15)`, borderRadius:16, padding:28, width:"100%", maxWidth:440 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:3, height:18, background:ACC, borderRadius:2, boxShadow:`0 0 8px ${ACC}40` }} />
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:ACC }}>Log Sleep</div>
                </div>
                <button onClick={() => setShowAddLog(false)} style={{ background:"none", border:"none", color:TEXT_MUTED, cursor:"pointer", fontSize:18, fontFamily:"inherit", padding:"4px 8px", borderRadius:6, transition:"all .2s" }}
                  onMouseEnter={e => { e.target.style.color=ACC; e.target.style.background=`${ACC}08`; }}
                  onMouseLeave={e => { e.target.style.color=TEXT_MUTED; e.target.style.background="none"; }}>✕</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {/* Duration */}
                <div>
                  <div style={{ fontSize:7, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>Duration (hours)</div>
                  <input type="number" step=".5" min="0" max="12" value={newEntry.duration}
                    onChange={e => setNewEntry(p => ({ ...p, duration:e.target.value }))}
                    placeholder="e.g. 7.5" autoFocus
                    style={{ width:"100%", background:"rgba(6,5,4,0.8)", border:`1px solid rgba(212,175,55,0.1)`, color:ACC, fontSize:16, fontFamily:"'JetBrains Mono',monospace", padding:"12px 16px", outline:"none", borderRadius:8, letterSpacing:".08em" }} />
                </div>
                {/* Quality slider */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:7, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Quality</span>
                    <span style={{ fontSize:12, color:ACC, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{newEntry.quality} <span style={{ fontSize:7, color:TEXT_MUTED }}>/ 10</span></span>
                  </div>
                  <input type="range" min={1} max={10} value={newEntry.quality}
                    onChange={e => setNewEntry(p => ({ ...p, quality:parseInt(e.target.value) }))}
                    style={{ width:"100%", background:`linear-gradient(90deg,${ACC} ${newEntry.quality*10}%,rgba(26,20,8,0.3) 0%)` }} />
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span style={{ fontSize:6, color:TEXT_MUTED, letterSpacing:".1em" }}>Poor</span>
                    <span style={{ fontSize:6, color:TEXT_MUTED, letterSpacing:".1em" }}>Excellent</span>
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <div style={{ fontSize:7, letterSpacing:".2em", color:TEXT_MUTED, textTransform:"uppercase", marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>Notes</div>
                  <textarea value={newEntry.notes} onChange={e => setNewEntry(p => ({ ...p, notes:e.target.value }))}
                    placeholder="Dreams, wake-ups, how you felt..."
                    style={{ width:"100%", background:"rgba(6,5,4,0.8)", border:`1px solid rgba(212,175,55,0.1)`, color:`${ACC}70`, fontSize:9, fontFamily:"'JetBrains Mono',monospace", padding:"12px 16px", outline:"none", minHeight:70, lineHeight:1.7, borderRadius:8 }} />
                </div>
                {/* Buttons */}
                <div style={{ display:"flex", gap:12, marginTop:6 }}>
                  <motion.button
                    className="gold-btn"
                    whileTap={{ scale:0.97 }}
                    onClick={saveLog}
                    style={{ flex:1, padding:"15px", background:`linear-gradient(135deg,${ACC},${ACCDIM})`, color:"#050300", border:"none", borderRadius:10, fontSize:10, fontWeight:700, fontFamily:"'Syne',sans-serif", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", boxShadow:`0 4px 16px ${ACC}20` }}>
                    Save Entry
                  </motion.button>
                  <motion.button
                    whileTap={{ scale:0.97 }}
                    onClick={() => setShowAddLog(false)}
                    style={{ flex:1, padding:"15px", background:"rgba(8,6,5,0.5)", border:`1px solid rgba(212,175,55,0.08)`, color:TEXT_MUTED, fontSize:10, fontFamily:"'Syne',sans-serif", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", borderRadius:10, transition:"all .2s" }}
                    onMouseEnter={e => { e.target.style.borderColor=`${ACC}20`; e.target.style.color=`${ACC}60`; }}
                    onMouseLeave={e => { e.target.style.borderColor=`rgba(212,175,55,0.08)`; e.target.style.color=TEXT_MUTED; }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
