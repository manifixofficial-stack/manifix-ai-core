import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   MANIFIX SLEEPGOLD — BLACK × GOLD × CRIMSON
   Global Health Tech · WHO MH-SLP · SDG 3.4
   Real binaural / therapeutic frequency engine
═══════════════════════════════════════════════════════════ */

const GOLD    = "#D4AF37";
const GOLD2   = "#F0D060";
const CRIMSON = "#C0392B";
const CRIM2   = "#E74C3C";
const BG      = "#040302";
const BG2     = "#080604";
const BG3     = "#0c0906";
const BORDER  = "#1c1508";
const GRID    = "rgba(212,175,55,0.015)";
const TEXTM   = "#F5E6C8";
const TEXTD   = "#5a4020";
const TEXTMU  = "#2e2010";
const PROG    = `linear-gradient(90deg,#1a0c04,#8B6914,#D4AF37)`;
const SCGRAD  = `linear-gradient(135deg,#040302,#0c0804)`;

/* ─── WHO DATA ─── */
const WHO = {
  code:"MH-SLP", promise:"4h → 8h deep sleep · 21 days",
  stat1:"970M people live with mental disorders — WHO 2022",
  stat2:"45% of global adults report chronically insufficient sleep",
  stat3:"$411B/year lost from sleep deprivation — RAND Corporation",
  stat4:"75% in LMICs receive zero mental health treatment",
  solve:"Quality sleep: Depression ↓40% · Anxiety ↓30% · Immunity ↑25%",
  sdg:"SDG 3.4 — Promote mental health and wellbeing for all",
};

/* ─── MULTILINGUAL ─── */
const PHRASES = {
  "en-IN":{ ready:"Let your body receive the rest it has earned.", tip:"Consistent bedtimes improve sleep quality 40%.", breathe:"Activate calm. Four in. Seven hold. Eight out.", saved:"Sleep entry logged. Consistency score updating." },
  "hi-IN":{ ready:"अपने शरीर को वो आराम दें जो उसने अर्जित किया है।", tip:"नियमित सोने का समय नींद में 40% सुधार करता है।", breathe:"4 सांस लें। 7 रोकें। 8 छोड़ें।", saved:"नींद लॉग सहेजा गया।" },
  "te-IN":{ ready:"మీ శరీరానికి విశ్రాంతిని అందించండి.", tip:"స్థిరమైన నిద్రవేళలు నిద్ర నాణ్యతను 40% మెరుగుపరుస్తాయి.", breathe:"4 లోపలికి. 7 ఆపు. 8 బయటికి.", saved:"నిద్ర లాగ్ సేవ్ చేయబడింది." },
  "ta-IN":{ ready:"உங்கள் உடல் சம்பாதித்த ஓய்வை அதற்கு அளியுங்கள்.", tip:"சீரான தூக்க நேரங்கள் தரத்தை 40% மேம்படுத்துகின்றன.", breathe:"4 உள்ளே. 7 நிறுத்து. 8 வெளியே.", saved:"தூக்க பதிவு சேமிக்கப்பட்டது." },
  "es-ES":{ ready:"Deja que tu cuerpo reciba el descanso que se ha ganado.", tip:"Los horarios de sueño constantes mejoran la calidad un 40%.", breathe:"Inhala 4. Retén 7. Exhala 8.", saved:"Registro de sueño guardado." },
  "fr-FR":{ ready:"Laissez votre corps recevoir le repos qu'il a mérité.", tip:"Des horaires réguliers améliorent le sommeil de 40%.", breathe:"Inspirez 4. Retenez 7. Expirez 8.", saved:"Journal de sommeil enregistré." },
  "de-DE":{ ready:"Lass deinen Körper die Ruhe empfangen, die er verdient hat.", tip:"Regelmäßige Schlafzeiten verbessern die Qualität um 40%.", breathe:"4 einatmen. 7 halten. 8 ausatmen.", saved:"Schlafeintrag gespeichert." },
  "ja-JP":{ ready:"体に、獲得した休息を与えましょう。", tip:"規則正しい就寝時間は睡眠の質を40%向上させます。", breathe:"4で吸い、7で保ち、8で吐く。", saved:"睡眠記録を保存しました。" },
};
const ph = (l,k) => PHRASES[l]?.[k] || PHRASES["en-IN"][k] || "";

/* ─── HABITS ─── */
const HABITS_DEFAULT = [
  { id:1, label:"No screens 60 min before bed",      science:"Blue light suppresses melatonin by 50%"   },
  { id:2, label:"Read a physical book 15 min",        science:"Reduces stress 68% faster than other methods" },
  { id:3, label:"4-7-8 breathing completed",          science:"Activates vagus nerve, lowers cortisol"   },
  { id:4, label:"Room temperature 18–20°C",           science:"Core body temp drop triggers deep sleep"  },
  { id:5, label:"No caffeine after 2 PM",             science:"Caffeine half-life: 5-6h, disrupts REM"  },
  { id:6, label:"Light stretch or yoga (10 min)",     science:"Releases muscle tension, eases sleep onset" },
  { id:7, label:"Journaled 3 gratitudes",             science:"Reduces rumination, boosts slow-wave sleep" },
  { id:8, label:"No alcohol tonight",                 science:"Alcohol kills REM — worst sleep disruptor" },
  { id:9, label:"Dark room achieved",                 science:"Even dim light during sleep damages cognition" },
  { id:10,label:"Last meal 3h before bed",            science:"Digestion prevents deep sleep stages"    },
];

/* ═══════════════════════════════════════════════════════════
   REAL THERAPEUTIC FREQUENCY ENGINE
   Binaural beats · Solfeggio · Brown noise · ASMR physics
═══════════════════════════════════════════════════════════ */

function buildSleepEngine(ctx, type, volRef) {
  const nodes = [];
  const master = ctx.createGain();
  master.gain.value = 0.001;
  master.connect(ctx.destination);

  const ramp = (val, t=1.2) => master.gain.linearRampToValueAtTime(val, ctx.currentTime + t);

  /* NOISE BUFFER — brownian character */
  function brownNoise(dur=4) {
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * dur, sr);
    const d   = buf.getChannelData(0);
    let last  = 0;
    for (let i=0;i<d.length;i++) {
      const white = Math.random()*2-1;
      last = (last + 0.02*white) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  function pinkNoise(dur=4) {
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr*dur, sr);
    const d   = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<d.length;i++) {
      const w=Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
      b6=w*0.115926;
    }
    return buf;
  }

  function loopNoise(buf) {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.start();
    return s;
  }

  function osc(freq, type="sine", startTime=0) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    o.start(ctx.currentTime + startTime);
    return o;
  }

  function gain(val) { const g=ctx.createGain(); g.gain.value=val; return g; }

  function biquad(type, freq, Q=1) {
    const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=Q; return f;
  }

  /* LFO helper */
  function lfo(rate, depth) {
    const l=osc(rate,"sine"); const g=gain(depth); l.connect(g); return { lfo:l, gain:g };
  }

  if (type === "delta_binaural") {
    /* TRUE BINAURAL: 0.5–4 Hz DELTA — deepest sleep induction
       Left ear: 100 Hz, Right ear: 102 Hz → brain entrains to 2 Hz delta */
    const chans = ctx.createChannelSplitter(2);
    const merger= ctx.createChannelMerger(2);
    const L=osc(100); const R=osc(102);
    const gL=gain(0.08); const gR=gain(0.08);
    L.connect(gL); R.connect(gR);
    gL.connect(merger,0,0); gR.connect(merger,0,1);
    merger.connect(master);
    /* Brown noise bed */
    const bn=loopNoise(brownNoise(5)); const lpf=biquad("lowpass",280,0.7);
    const ng=gain(0.06); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(L,R,bn);
    ramp(volRef.current/600);
  }

  else if (type === "theta_binaural") {
    /* 4–8 Hz THETA — REM & creative dreaming
       Left: 200 Hz, Right: 205 Hz → 5 Hz theta */
    const merger= ctx.createChannelMerger(2);
    const L=osc(200); const R=osc(205);
    const gL=gain(0.07); const gR=gain(0.07);
    L.connect(gL); R.connect(gR);
    gL.connect(merger,0,0); gR.connect(merger,0,1);
    merger.connect(master);
    const pn=loopNoise(pinkNoise(4)); const bp=biquad("bandpass",600,0.4);
    const ng=gain(0.04); pn.connect(bp); bp.connect(ng); ng.connect(master);
    nodes.push(L,R,pn);
    ramp(volRef.current/550);
  }

  else if (type === "solfeggio_528") {
    /* 528 Hz — DNA repair / Miracle tone */
    const o1=osc(528); const o2=osc(264); const o3=osc(1056);
    const g1=gain(0.05); const g2=gain(0.03); const g3=gain(0.015);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    /* Shimmer LFO */
    const sh=lfo(0.08,8); sh.lfo.connect(sh.gain); sh.gain.connect(o1.frequency);
    /* Brown bed */
    const bn=loopNoise(brownNoise(5)); const lpf=biquad("lowpass",320,0.5);
    const ng=gain(0.04); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o1,o2,o3,sh.lfo,bn);
    ramp(volRef.current/500);
  }

  else if (type === "solfeggio_432") {
    /* 432 Hz — A432 natural tuning, universal harmony */
    const o1=osc(432); const o2=osc(216); const o3=osc(864);
    const g1=gain(0.05); const g2=gain(0.025); const g3=gain(0.012);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    const sh=lfo(0.06,6); sh.lfo.connect(sh.gain); sh.gain.connect(o1.frequency);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",300,0.6);
    const ng=gain(0.035); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o1,o2,o3,sh.lfo,bn);
    ramp(volRef.current/500);
  }

  else if (type === "brown_rain") {
    /* BROWN NOISE — scientifically proven sleep aid, masks tinnitus */
    const bn=loopNoise(brownNoise(6));
    const lpf=biquad("lowpass",350,0.5); const shelf=biquad("highshelf",4000,0.5);
    shelf.gain.value=-18;
    const ng=gain(0.22); bn.connect(lpf); lpf.connect(shelf); shelf.connect(ng); ng.connect(master);
    /* Distant rain: high-freq pink shimmer */
    const pn=loopNoise(pinkNoise(3)); const hp=biquad("highpass",2200,1.2);
    const pg=gain(0.04); pn.connect(hp); hp.connect(pg); pg.connect(master);
    nodes.push(bn,pn);
    ramp(volRef.current/220);
  }

  else if (type === "ocean_resonance") {
    /* OCEAN — LFO-modulated, realistic surf cycle */
    const bn=loopNoise(brownNoise(8));
    const lpf=biquad("lowpass",220,0.4);
    const wave=lfo(0.09,180); wave.lfo.connect(wave.gain); wave.gain.connect(lpf.frequency);
    const ng=gain(0.18); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    /* Spray — very high */
    const pn=loopNoise(pinkNoise(4)); const hp=biquad("highpass",3800,0.8);
    const wv2=lfo(0.09,0.04); wv2.lfo.connect(wv2.gain); wv2.gain.connect(hp.frequency);
    const sg=gain(0.025); pn.connect(hp); hp.connect(sg); sg.connect(master);
    nodes.push(bn,pn,wave.lfo,wv2.lfo);
    ramp(volRef.current/200);
  }

  else if (type === "forest_deep") {
    /* FOREST NIGHT — crickets + wind + low rustle */
    const pn=loopNoise(pinkNoise(5)); const bp=biquad("bandpass",700,0.35);
    const ng=gain(0.12); pn.connect(bp); bp.connect(ng); ng.connect(master);
    /* Wind sweep */
    const bn=loopNoise(brownNoise(4)); const lpw=biquad("lowpass",180,0.5);
    const wl=lfo(0.04,120); wl.lfo.connect(wl.gain); wl.gain.connect(lpw.frequency);
    const wg=gain(0.1); bn.connect(lpw); lpw.connect(wg); wg.connect(master);
    /* Cricket pulse: amplitude-modulated sine 4kHz */
    const cr=osc(3900); const crg=gain(0); cr.connect(crg); crg.connect(master);
    const cl=lfo(14,0.006); cl.lfo.connect(cl.gain); cl.gain.connect(crg.gain);
    nodes.push(pn,bn,cr,wl.lfo,cl.lfo);
    ramp(volRef.current/240);
  }

  else if (type === "womb_heartbeat") {
    /* WOMB SOUND — the primordial sleep trigger
       Sub-bass heartbeat at 60 BPM + dark womb hum */
    const bn=loopNoise(brownNoise(3)); const lpf=biquad("lowpass",160,1.2);
    const ng=gain(0.25); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    /* Heartbeat: 60 BPM sub pulse */
    const hb=osc(60,"sine"); const hbg=gain(0); hb.connect(hbg); hbg.connect(master);
    const hl=lfo(1,0.09); hl.lfo.connect(hl.gain); hl.gain.connect(hbg.gain);
    /* Sub drone */
    const sd=osc(40,"sine"); const sdg=gain(0.04); sd.connect(sdg); sdg.connect(master);
    nodes.push(bn,hb,hl.lfo,sd);
    ramp(volRef.current/160);
  }

  else if (type === "crystal_bowl") {
    /* TIBETAN CRYSTAL BOWL — 396Hz liberation + harmonics */
    const o1=osc(396); const o2=osc(792); const o3=osc(198);
    const g1=gain(0.055); const g2=gain(0.022); const g3=gain(0.028);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1,g2,g3].forEach(g=>g.connect(master));
    /* Slow ring modulation */
    const rm=osc(0.5,"sine"); const rmg=gain(0.03); rm.connect(rmg); rmg.connect(o1.frequency);
    /* Reverb sim: delay */
    const del=ctx.createDelay(3); del.delayTime.value=0.8;
    const fb=gain(0.45); del.connect(fb); fb.connect(del);
    const dg=gain(0.3); o1.connect(g1); g1.connect(del); del.connect(dg); dg.connect(master);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",250,0.5);
    const nbg=gain(0.035); bn.connect(lpf); lpf.connect(nbg); nbg.connect(master);
    nodes.push(o1,o2,o3,rm,bn);
    ramp(volRef.current/480);
  }

  else if (type === "spine_release") {
    /* 40 Hz GAMMA + 7.83 Hz SCHUMANN RESONANCE
       Synchronizes with Earth's electromagnetic field */
    const o40=osc(40,"sine"); const g40=gain(0.04); o40.connect(g40); g40.connect(master);
    const oS=osc(7.83,"sine"); const gS=gain(0.03); oS.connect(gS); gS.connect(master);
    /* Amplitude beat */
    const bl=lfo(0.5,0.02); bl.lfo.connect(bl.gain); bl.gain.connect(g40.gain);
    const bn=loopNoise(brownNoise(4)); const lpf=biquad("lowpass",300,0.5);
    const ng=gain(0.07); bn.connect(lpf); lpf.connect(ng); ng.connect(master);
    nodes.push(o40,oS,bl.lfo,bn);
    ramp(volRef.current/500);
  }

  const stopAll = (fade=1.5) => {
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
    setTimeout(() => {
      nodes.forEach(n=>{ try{n.stop();}catch{} });
      try{ master.disconnect(); }catch{}
    }, (fade+0.2)*1000);
  };

  return { master, stopAll };
}

/* ─── SOUND CATALOG ─── */
const SOUNDS = [
  { id:"delta_binaural",  label:"Delta Binaural",  sub:"0–4 Hz · Deep Sleep",      emoji:"🌑", color:GOLD,    science:"Entrains brain to delta — deepest sleep stage. Proven by EEG studies." },
  { id:"theta_binaural",  label:"Theta Binaural",  sub:"4–8 Hz · REM Dreams",       emoji:"🌊", color:GOLD2,   science:"Theta waves govern REM & memory consolidation. Creative dreaming." },
  { id:"solfeggio_528",   label:"528 Hz Miracle",  sub:"DNA Repair · Love Freq",    emoji:"✨", color:GOLD,    science:"528 Hz is used in DNA repair research. Deepens cell regeneration during sleep." },
  { id:"solfeggio_432",   label:"432 Hz Natural",  sub:"Universal Harmony",          emoji:"🔮", color:GOLD2,   science:"A432 tuning aligns with natural world frequencies. Calms nervous system." },
  { id:"brown_rain",      label:"Brown Rain",       sub:"Brownian Noise · Tinnitus", emoji:"🌧", color:GOLD,    science:"Brown noise clinically reduces tinnitus, anxiety, ADHD. Superior to white noise." },
  { id:"ocean_resonance", label:"Ocean Resonance",  sub:"LFO Surf · 0.1 Hz Wave",   emoji:"🌈", color:GOLD2,   science:"0.1 Hz ocean rhythm matches human resting heart rate variability." },
  { id:"forest_deep",     label:"Forest Night",     sub:"Cricket + Wind + Rustling", emoji:"🌿", color:GOLD,    science:"Natural biophonic sound reduces cortisol 12% more than silence. Ancient signal of safety." },
  { id:"womb_heartbeat",  label:"Womb Heartbeat",   sub:"60 BPM Sub-Bass Pulse",     emoji:"❤", color:CRIMSON,  science:"Heartbeat at 60 BPM is primordial sleep trigger — pre-natal memory activated." },
  { id:"crystal_bowl",    label:"Crystal Bowl",     sub:"396 Hz · Tibetan",          emoji:"🔔", color:GOLD2,   science:"Tibetan singing bowls alter brainwave patterns toward deep meditative states." },
  { id:"spine_release",   label:"Schumann + 40Hz",  sub:"7.83 Hz · Earth Resonance", emoji:"🌍", color:GOLD,   science:"Schumann 7.83 Hz = Earth's EM heartbeat. Grounds nervous system for deep sleep." },
];

/* ─── HABITS ─── */
const CYCLES_FN = (wakeStr) => {
  const [h,m] = wakeStr.split(":").map(Number);
  const wake  = new Date(); wake.setHours(h,m,0,0);
  if (wake < new Date()) wake.setDate(wake.getDate()+1);
  return [6,5,4,3].map(c => {
    const t = new Date(wake.getTime()-(c*90+14)*60000);
    return { cycles:c, time:t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), best:c===5 };
  });
};

const SCORE_FN = (logs, habits) => {
  if (!logs.length) return 50;
  const r=logs.slice(0,7);
  const avg=r.reduce((a,b)=>a+b.duration,0)/r.length;
  const aq =r.reduce((a,b)=>a+b.quality,0)/r.length;
  const dur =avg>=7&&avg<=9?38:avg>5?26:12;
  const qual=(aq/10)*30;
  const vars=r.map(l=>l.duration);
  const vari=vars.reduce((a,b)=>a+Math.pow(b-avg,2),0)/vars.length;
  const cons=Math.max(0,20-vari*9);
  const hab =(habits.filter(h=>h.done).length/habits.length)*12;
  return Math.min(100,Math.round(dur+qual+cons+hab));
};

/* ─── LOCAL STORAGE ─── */
function useLs(key, def) {
  const [val,setVal] = useState(()=>{
    try{ const x=localStorage.getItem(key); return x?JSON.parse(x):def; } catch{ return def; }
  });
  const set = useCallback((v)=>{
    const next=typeof v==="function"?v(val):v;
    setVal(next);
    try{ localStorage.setItem(key,JSON.stringify(next)); }catch{}
  },[val,key]);
  return [val,set];
}

/* ─── SPEAKER ─── */
function makeSpeaker(lang) {
  return (text) => {
    if (!("speechSynthesis" in window)||!text) return;
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang; u.rate=0.62; u.pitch=0.74;
    const vs=speechSynthesis.getVoices();
    const v=vs.find(x=>x.lang===lang)||vs.find(x=>x.lang.startsWith("en"));
    if(v) u.voice=v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
}

/* ─── CSS ─── */
function injectCSS() {
  if (document.getElementById("sgcss")) return;
  const el=document.createElement("style"); el.id="sgcss";
  el.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');
    @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.12;transform:scale(1.08)}}
    @keyframes pulse2{0%,100%{opacity:.02}50%{opacity:.07}}
    @keyframes beat{0%,100%{transform:scaleY(1)}50%{transform:scaleY(2.2)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes breatheIn{from{transform:scale(1);opacity:.2}to{transform:scale(1.5);opacity:.8}}
    @keyframes breatheOut{from{transform:scale(1.5);opacity:.8}to{transform:scale(1);opacity:.2}}
    @keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.5);opacity:0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes scoreReveal{from{stroke-dasharray:0 94.2}to{}}
    .fu{animation:fu .5s cubic-bezier(.22,.68,0,1.2) both}
    .sg-btn:hover{filter:brightness(1.18);transform:translateY(-2px)!important;transition:all .18s!important}
    .sg-btn:active{transform:translateY(0)!important}
    .snd-card:hover{border-color:rgba(212,175,55,0.3)!important;background:#0e0a06!important;transition:all .2s}
    input[type=range]{-webkit-appearance:none;appearance:none;height:3px;border-radius:3px;outline:none;cursor:pointer}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${GOLD};cursor:pointer;border:2px solid #040200;box-shadow:0 0 8px ${GOLD}60}
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:${GOLD}25;color:${TEXTM}}
    ::-webkit-scrollbar{width:2px}
    ::-webkit-scrollbar-track{background:#040302}
    ::-webkit-scrollbar-thumb{background:${GOLD}30}
    textarea,input{font-family:'Space Mono',monospace}
  `;
  document.head.appendChild(el);
}

/* ═══════════════════════════════════════════════════════════
   4-7-8 BREATHING ENGINE
═══════════════════════════════════════════════════════════ */
function BreathEngine({ active }) {
  const [phase,setPhase] = useState("idle");
  const [count,setCount] = useState(0);
  const [round,setRound] = useState(0);
  const ref = useRef(null);

  useEffect(()=>{
    if(!active){ clearTimeout(ref.current); setPhase("idle"); setCount(0); setRound(0); return; }
    let cancelled=false;
    const seq=[{name:"inhale",dur:4},{name:"hold",dur:7},{name:"exhale",dur:8}];
    let si=0; let ct;
    const run=()=>{
      if(cancelled) return;
      const cur=seq[si%seq.length];
      setPhase(cur.name);
      let c=cur.dur; setCount(c);
      if(si%seq.length===0&&si>0) setRound(r=>r+1);
      ct=setInterval(()=>{ c--; setCount(c); if(c<=0){ clearInterval(ct); si++; ref.current=setTimeout(run,250); }},1000);
    };
    run();
    return()=>{ cancelled=true; clearInterval(ct); clearTimeout(ref.current); };
  },[active]);

  const anim={
    idle:{},
    inhale:{animation:"breatheIn 4s ease forwards"},
    hold:{transform:"scale(1.5)",opacity:.8},
    exhale:{animation:"breatheOut 8s ease forwards"},
  };
  const col={idle:`${GOLD}08`,inhale:GOLD,hold:`${GOLD}80`,exhale:`${GOLD}30`};
  const label={idle:"Ready",inhale:`Inhale · ${count}s`,hold:`Hold · ${count}s`,exhale:`Exhale · ${count}s`};

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,padding:"24px 0"}}>
      <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {/* rings */}
        {[1,2,3].map(r=>(
          <div key={r} style={{position:"absolute",inset:`${r*8}px`,borderRadius:"50%",border:`1px solid ${GOLD}${r===1?"18":r===2?"0c":"06"}`}}/>
        ))}
        {/* core */}
        <div style={{width:64,height:64,borderRadius:"50%",background:col[phase],...anim[phase],willChange:"transform,opacity",transition:phase==="hold"?"none":"",boxShadow:phase!=="idle"?`0 0 32px ${GOLD}30`:""}}/>
        <div style={{position:"absolute",fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:GOLD,userSelect:"none",textShadow:`0 0 20px ${GOLD}60`}}>
          {active&&phase!=="idle"?count:""}
        </div>
        {/* ripple when inhaling */}
        {active&&phase==="inhale"&&(
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`1px solid ${GOLD}40`,animation:"ripple 2s ease-out infinite"}}/>
        )}
      </div>
      <div style={{fontSize:10,letterSpacing:".22em",textTransform:"uppercase",color:phase==="idle"?TEXTD:GOLD,fontFamily:"'Space Mono',monospace",fontWeight:700}}>
        {label[phase]}
      </div>
      {active&&round>0&&(
        <div style={{fontSize:8,letterSpacing:".14em",color:`${GOLD}40`,fontFamily:"'Space Mono',monospace",textTransform:"uppercase"}}>
          Round {round+1} · 4 cycles = full reset
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SLEEP QUALITY RING
═══════════════════════════════════════════════════════════ */
function ScoreRing({ score }) {
  const c = score>=80?"#34D399":score>=60?GOLD:score>=40?"#F59E0B":CRIMSON;
  const label = score>=80?"ELITE":score>=60?"RESTORATIVE":score>=40?"BUILDING":"CRITICAL";
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{position:"relative",width:56,height:56}}>
        <svg viewBox="0 0 56 56" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="28" cy="28" r="24" fill="none" stroke="#141008" strokeWidth="3.5"/>
          <circle cx="28" cy="28" r="24" fill="none" stroke={c} strokeWidth="3.5"
            strokeLinecap="round" strokeDasharray={`${(score/100)*150.8} 150.8`}
            style={{transition:"stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 6px ${c}60)`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:c}}>
          {score}
        </div>
      </div>
      <div>
        <div style={{fontSize:6,letterSpacing:".2em",color:TEXTD,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:2}}>Sleep Score</div>
        <div style={{fontSize:10,color:c,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{label}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function SleepGold() {
  useEffect(()=>{ injectCSS(); },[]);

  /* ── state ── */
  const [sleepLog,setSleepLog] = useLs("sg_log_v1",[
    {id:1,date:"2026-05-16",duration:7.5,quality:8,notes:"Felt rested"},
    {id:2,date:"2026-05-15",duration:6.2,quality:5,notes:"Woke up twice"},
    {id:3,date:"2026-05-14",duration:8.0,quality:9,notes:"Deep sleep"},
    {id:4,date:"2026-05-13",duration:6.8,quality:6,notes:"Vivid dreams"},
    {id:5,date:"2026-05-12",duration:7.2,quality:7,notes:"Good night"},
  ]);
  const [habits,setHabits] = useLs("sg_habits_v1",HABITS_DEFAULT.map(h=>({...h,done:false})));
  const [wakeGoal,setWakeGoal] = useLs("sg_wake_v1","07:00");
  const [lang,setLang]         = useLs("sg_lang_v1","en-IN");

  const [tab,setTab]             = useState("dashboard");
  const [breathActive,setBreath] = useState(false);
  const [activeSound,setActive]  = useState(null);
  const [volume,setVolume]       = useState(42);
  const [showLog,setShowLog]     = useState(false);
  const [newEntry,setNewEntry]   = useState({duration:"",quality:7,notes:""});
  const [whoOpen,setWhoOpen]     = useState(false);
  const [expandedSound,setExpand]= useState(null);
  const [showHabitScience,setShowSci] = useState(null);

  const volRef = useRef(volume);
  useEffect(()=>{ volRef.current=volume; },[volume]);

  const audioCtxRef = useRef(null);
  const soundRef    = useRef(null);

  /* derived */
  const score   = useMemo(()=>SCORE_FN(sleepLog,habits),[sleepLog,habits]);
  const cycles  = useMemo(()=>CYCLES_FN(wakeGoal),[wakeGoal]);
  const speak   = useMemo(()=>makeSpeaker(lang),[lang]);
  const avgDur  = sleepLog.length?(sleepLog.reduce((a,b)=>a+b.duration,0)/sleepLog.length).toFixed(1):"—";
  const avgQual = sleepLog.length?(sleepLog.reduce((a,b)=>a+b.quality,0)/sleepLog.length).toFixed(1):"—";
  const longestStreak = useMemo(()=>{
    let streak=0,max=0;
    sleepLog.slice().reverse().forEach(l=>{ if(l.duration>=7){streak++;max=Math.max(max,streak);}else streak=0; });
    return max;
  },[sleepLog]);

  useEffect(()=>{ const t=setTimeout(()=>speak(ph(lang,"ready")),1600); return()=>clearTimeout(t); },[]);

  /* ── sound engine ── */
  const toggleSound = useCallback((snd)=>{
    if(activeSound===snd.id){
      soundRef.current?.stopAll();
      soundRef.current=null;
      setActive(null);
      return;
    }
    soundRef.current?.stopAll(0.5);
    soundRef.current=null;
    if(!audioCtxRef.current||audioCtxRef.current.state==="closed"){
      audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    }
    const ctx=audioCtxRef.current;
    if(ctx.state==="suspended") ctx.resume();
    soundRef.current=buildSleepEngine(ctx,snd.id,volRef);
    setActive(snd.id);
  },[activeSound]);

  useEffect(()=>{
    if(!soundRef.current?.master) return;
    const s=SOUNDS.find(s=>s.id===activeSound);
    if(!s) return;
    const baseVol=volRef.current;
    const map={delta_binaural:600,theta_binaural:550,solfeggio_528:500,solfeggio_432:500,brown_rain:220,ocean_resonance:200,forest_deep:240,womb_heartbeat:160,crystal_bowl:480,spine_release:500};
    soundRef.current.master.gain.linearRampToValueAtTime(baseVol/(map[s.id]||400), audioCtxRef.current.currentTime+0.3);
  },[volume,activeSound]);

  useEffect(()=>()=>{
    soundRef.current?.stopAll(0.3);
    try{ audioCtxRef.current?.close(); }catch{}
  },[]);

  const saveLog = useCallback(()=>{
    if(!newEntry.duration) return;
    setSleepLog(p=>[{id:Date.now(),date:new Date().toISOString().split("T")[0],duration:parseFloat(newEntry.duration),quality:parseInt(newEntry.quality),notes:newEntry.notes},...p]);
    setNewEntry({duration:"",quality:7,notes:""});
    setShowLog(false);
    speak(ph(lang,"saved"));
  },[newEntry,setSleepLog,lang,speak]);

  const toggleHabit = useCallback((id)=>{
    setHabits(p=>p.map(h=>h.id===id?{...h,done:!h.done}:h));
  },[setHabits]);

  const scoreColor = score>=80?"#34D399":score>=60?GOLD:score>=40?"#F59E0B":CRIMSON;

  const TABS=[
    {id:"dashboard",label:"Dashboard",  icon:"◎"},
    {id:"sounds",   label:"Sleep Tones",icon:"◉"},
    {id:"breathe",  label:"Breathe",    icon:"○"},
    {id:"log",      label:"Sleep Log",  icon:"▣"},
    {id:"habits",   label:"Hygiene",    icon:"✦"},
  ];

  const LANGUAGES=[
    {code:"en-IN",label:"EN"},
    {code:"hi-IN",label:"हि"},
    {code:"te-IN",label:"తె"},
    {code:"ta-IN",label:"த"},
    {code:"es-ES",label:"ES"},
    {code:"fr-FR",label:"FR"},
    {code:"de-DE",label:"DE"},
    {code:"ja-JP",label:"日"},
  ];

  /* ──────────── RENDER ──────────── */
  return (
    <div style={{minHeight:"100dvh",background:BG,color:TEXTM,fontFamily:"'Space Mono','Courier New',monospace",display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",position:"relative"}}>

      {/* BG grid */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${GRID} 1px,transparent 1px),linear-gradient(90deg,${GRID} 1px,transparent 1px)`,backgroundSize:"52px 52px"}}/>

      {/* Gold ambient */}
      <div style={{position:"fixed",top:"10%",left:"50%",transform:"translateX(-50%)",width:500,height:260,background:`radial-gradient(ellipse,${GOLD}07 0%,transparent 70%)`,animation:"pulse 6s ease-in-out infinite",pointerEvents:"none"}}/>
      {/* Crimson ambient */}
      <div style={{position:"fixed",bottom:"20%",right:"10%",width:200,height:200,background:`radial-gradient(ellipse,${CRIMSON}04 0%,transparent 70%)`,animation:"pulse2 8s ease-in-out infinite",pointerEvents:"none"}}/>

      {/* Corner brackets */}
      {[{top:12,left:12,borderTopWidth:2,borderLeftWidth:2},{top:12,right:12,borderTopWidth:2,borderRightWidth:2},{bottom:12,left:12,borderBottomWidth:2,borderLeftWidth:2},{bottom:12,right:12,borderBottomWidth:2,borderRightWidth:2}].map((pos,i)=>(
        <div key={i} style={{position:"fixed",width:22,height:22,borderColor:GOLD,borderStyle:"solid",borderWidth:0,opacity:.18,pointerEvents:"none",...pos}}/>
      ))}

      {/* WHO Ticker */}
      <div style={{width:"100%",overflow:"hidden",whiteSpace:"nowrap",borderBottom:`1px solid ${BORDER}30`,padding:"6px 0",background:"#030201"}}>
        <span style={{display:"inline-block",animation:"ticker 55s linear infinite",fontSize:7,letterSpacing:".12em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
          {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4,WHO.solve,WHO.sdg,"✦ ManifiX SleepGold · "+WHO.promise,"✦ 20 Languages · WHO "+WHO.code+" · SDG 3.4 · LMIC Ready"].join("   ✦   ").repeat(2)}
        </span>
      </div>

      {/* WRAPPER */}
      <div style={{position:"relative",zIndex:2,width:"min(480px,97vw)",display:"flex",flexDirection:"column",gap:10,paddingTop:16,paddingBottom:56}}>

        {/* ── HEADER ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:`1px solid ${BORDER}40`}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,letterSpacing:"-.01em",lineHeight:1,color:TEXTM}}>
              SLEEP<span style={{color:GOLD}}>GOLD</span>
            </div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,letterSpacing:".2em",color:`${GOLD}50`,textTransform:"uppercase",marginTop:3}}>
              ManifiX · WHO {WHO.code} · SDG 3.4
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <ScoreRing score={score}/>
            {/* Language picker */}
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {LANGUAGES.map(l=>(
                <button key={l.code} onClick={()=>setLang(l.code)}
                  style={{background:lang===l.code?`${GOLD}15`:"transparent",border:`1px solid ${lang===l.code?GOLD+"40":BORDER+"50"}`,
                    color:lang===l.code?GOLD:TEXTMU,fontSize:7,fontFamily:"inherit",padding:"3px 6px",cursor:"pointer",letterSpacing:".06em"}}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.id} className="sg-btn"
              onClick={()=>setTab(t.id)}
              style={{background:tab===t.id?`${GOLD}12`:"#080604",border:`1px solid ${tab===t.id?GOLD+"35":BORDER+"60"}`,
                color:tab===t.id?GOLD:TEXTD,fontSize:7,letterSpacing:".14em",textTransform:"uppercase",
                fontFamily:"inherit",padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .16s"}}>
              <span style={{color:tab===t.id?GOLD:TEXTMU}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ════════════════ DASHBOARD ════════════════ */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
              {[
                {label:"Avg Sleep",    val:`${avgDur}h`,        col:parseFloat(avgDur)>=7?"#34D399":GOLD},
                {label:"Avg Quality",  val:`${avgQual}/10`,      col:parseFloat(avgQual)>=7?"#34D399":GOLD},
                {label:"7d Streak",   val:`${longestStreak}d`,  col:longestStreak>=5?"#34D399":longestStreak>=3?GOLD:CRIMSON},
                {label:"Nights",      val:sleepLog.length,       col:GOLD},
              ].map((s,i)=>(
                <div key={i} style={{border:`1px solid ${BORDER}30`,background:BG2,padding:"12px 8px"}}>
                  <div style={{fontSize:6,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>{s.label}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>7-Night Sleep Duration</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:7,height:110,paddingBottom:24,position:"relative"}}>
                {sleepLog.slice(0,7).reverse().map((log,i)=>{
                  const pct=Math.max((log.duration/10)*100,5);
                  const c=log.duration>=7?"#34D399":log.duration>=6?GOLD:CRIMSON;
                  return (
                    <div key={log.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
                      <div style={{fontSize:7,color:c,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{log.duration}h</div>
                      <div style={{width:"100%",height:`${pct}%`,background:`linear-gradient(180deg,${c},${c}30)`,borderRadius:"3px 3px 0 0",minHeight:5,boxShadow:`0 -2px 8px ${c}25`}}/>
                      <span style={{position:"absolute",bottom:-20,fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                        {new Date(log.date+"T00:00:00").toLocaleDateString([],{weekday:"short"})}
                      </span>
                    </div>
                  );
                })}
                {/* 7h line */}
                <div style={{position:"absolute",left:0,right:0,bottom:`${24+(70)}px`,borderTop:`1px dashed ${GOLD}20`,pointerEvents:"none"}}>
                  <span style={{fontSize:6,color:`${GOLD}35`,letterSpacing:".1em",paddingLeft:4,fontFamily:"'Space Mono',monospace"}}>7h goal</span>
                </div>
              </div>
            </div>

            {/* Cycle calculator */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:10}}>Smart Wake-Up Calculator · 90-min REM Cycles</div>
              <div style={{marginBottom:10}}>
                <input type="time" value={wakeGoal} onChange={e=>setWakeGoal(e.target.value)}
                  style={{background:"#050300",border:`1px solid ${BORDER}60`,color:GOLD,fontSize:16,fontFamily:"'Space Mono',monospace",padding:"10px 14px",outline:"none",width:"100%",letterSpacing:".1em"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                {cycles.map((c,i)=>(
                  <div key={i} style={{padding:"12px 6px",textAlign:"center",background:c.best?"#140e04":BG2,border:`1px solid ${c.best?GOLD:BORDER+"30"}`}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:c.best?GOLD:TEXTD}}>{c.time}</div>
                    <div style={{fontSize:6,letterSpacing:".12em",color:c.best?`${GOLD}65`:TEXTMU,textTransform:"uppercase",marginTop:3,fontFamily:"'Space Mono',monospace"}}>{c.cycles} cycles{c.best?" ✦":""}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,fontSize:7,letterSpacing:".1em",color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>
                ✦ Optimal · 7.5h with 14-min sleep onset buffer
              </div>
            </div>

            {/* Log CTA */}
            <button className="sg-btn" onClick={()=>setShowLog(true)}
              style={{width:"100%",padding:"16px",background:`linear-gradient(135deg,${GOLD}15,${GOLD}08)`,
                color:GOLD,border:`1px solid ${GOLD}30`,fontSize:12,fontWeight:700,
                fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              ✦ &nbsp;Log Last Night's Sleep
            </button>

            {/* WHO panel */}
            <button onClick={()=>setWhoOpen(v=>!v)}
              style={{background:"transparent",border:`1px solid ${BORDER}30`,color:TEXTMU,fontSize:7,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
              <span>{whoOpen?"▾":"▸"} WHO Global Impact · {WHO.code}</span>
              <span style={{color:`${GOLD}45`}}>{WHO.promise}</span>
            </button>
            {whoOpen&&(
              <div className="fu" style={{border:`1px solid ${GOLD}10`,background:BG2,padding:"14px",display:"flex",flexDirection:"column",gap:8}}>
                {[WHO.stat1,WHO.stat2,WHO.stat3,WHO.stat4].map((s,i)=>(
                  <div key={i} style={{fontSize:8,color:i===0?`${GOLD}60`:TEXTMU,letterSpacing:".06em",lineHeight:1.8,borderLeft:`2px solid ${i===0?GOLD:BORDER+"40"}`,paddingLeft:10,fontFamily:"'Space Mono',monospace"}}>{s}</div>
                ))}
                <div style={{marginTop:4,fontSize:7,letterSpacing:".1em",color:`${GOLD}35`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{WHO.sdg}</div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ SLEEP TONES ════════════════ */}
        {tab==="sounds"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Therapeutic Frequency Engine</div>
              <div style={{fontSize:8,letterSpacing:".06em",color:TEXTMU,lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:14}}>
                Real Web Audio synthesis · Binaural beats · Solfeggio · Brown noise · Zero CDN · Works offline
              </div>

              {/* Sound grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {SOUNDS.map(snd=>{
                  const on=activeSound===snd.id;
                  const isExp=expandedSound===snd.id;
                  return (
                    <div key={snd.id} style={{display:"flex",flexDirection:"column"}}>
                      <button className="snd-card sg-btn"
                        onClick={()=>toggleSound(snd)}
                        style={{background:on?`${snd.color}12`:"#070503",border:`1px solid ${on?snd.color+"35":BORDER+"40"}`,
                          color:on?snd.color:TEXTD,fontFamily:"'Space Mono',monospace",padding:"14px 10px",cursor:"pointer",
                          display:"flex",flexDirection:"column",alignItems:"flex-start",gap:5,textAlign:"left",
                          boxShadow:on?`inset 0 0 24px ${snd.color}08`:"",transition:"all .18s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",width:"100%",alignItems:"center"}}>
                          <span style={{fontSize:18,animation:on?"float 3s ease-in-out infinite":""}}>{snd.emoji}</span>
                          {on&&(
                            <div style={{display:"flex",gap:2,alignItems:"flex-end",height:14}}>
                              {[1,2,3,4].map(idx=>(
                                <div key={idx} style={{width:3,background:snd.color,borderRadius:1,animation:`beat ${0.5+idx*0.12}s ease-in-out infinite alternate`,height:[8,14,6,11][idx-1]}}/>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:on?snd.color:TEXTD}}>{snd.label}</div>
                        <div style={{fontSize:7,letterSpacing:".06em",color:on?`${snd.color}70`:TEXTMU,textTransform:"uppercase"}}>{snd.sub}</div>
                      </button>
                      <button onClick={()=>setExpand(isExp?null:snd.id)}
                        style={{background:"transparent",border:`1px solid ${BORDER}25`,borderTop:"none",color:TEXTMU,fontSize:6,fontFamily:"'Space Mono',monospace",letterSpacing:".1em",padding:"5px 8px",cursor:"pointer",textTransform:"uppercase",textAlign:"left"}}>
                        {isExp?"▲ Hide science":"▸ Why it works"}
                      </button>
                      {isExp&&(
                        <div className="fu" style={{background:"#080604",border:`1px solid ${GOLD}10`,borderTop:"none",padding:"10px 10px",fontSize:8,color:`${GOLD}55`,lineHeight:1.8,letterSpacing:".05em",fontFamily:"'Space Mono',monospace"}}>
                          {snd.science}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Volume */}
              {activeSound&&(
                <div style={{padding:"12px 14px",background:BG3,border:`1px solid ${GOLD}15`,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:7,letterSpacing:".14em",color:GOLD,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",flex:1}}>Volume · {volume}%</div>
                  <input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(parseInt(e.target.value))}
                    style={{flex:2,background:`linear-gradient(90deg,${GOLD} ${volume}%,#1a1408 0%)`}}/>
                </div>
              )}
              {!activeSound&&(
                <div style={{fontSize:8,letterSpacing:".07em",color:TEXTMU,textAlign:"center",paddingTop:4,fontFamily:"'Space Mono',monospace",lineHeight:1.8}}>
                  Tap any tone to activate · Headphones strongly recommended for binaural beats
                </div>
              )}
            </div>

            {/* Protocol guide */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>Sleep Sound Protocol</div>
              {[
                {time:"Wind Down (60–30 min)",sound:"Crystal Bowl or 432 Hz",why:"Slows racing thoughts, drops heart rate"},
                {time:"Falling Asleep",       sound:"Delta Binaural (headphones)",why:"Entrains brain to 2 Hz — deepest stage"},
                {time:"Sleeping Through",     sound:"Brown Rain (no headphones)",why:"Masks environment, continuous coverage"},
                {time:"Early Morning",        sound:"Theta Binaural",why:"Supports REM dreaming in final sleep cycles"},
              ].map((p,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10,paddingBottom:10,borderBottom:i<3?`1px solid ${BORDER}20`:""}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:GOLD,marginTop:5,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:8,color:GOLD,fontWeight:700,letterSpacing:".1em",fontFamily:"'Space Mono',monospace",marginBottom:2}}>{p.time}</div>
                    <div style={{fontSize:8,color:TEXTM,letterSpacing:".05em",fontFamily:"'Space Mono',monospace",marginBottom:2}}>→ {p.sound}</div>
                    <div style={{fontSize:7,color:TEXTMU,letterSpacing:".05em",fontFamily:"'Space Mono',monospace"}}>{p.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ BREATHE ════════════════ */}
        {tab==="breathe"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>4-7-8 Breathing · Parasympathetic Activation</div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".06em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:0}}>
                Developed by Dr. Andrew Weil · Activates vagus nerve · Reduces cortisol · Proven sleep-onset accelerator
              </div>
              <BreathEngine active={breathActive}/>
              <button className="sg-btn"
                onClick={()=>{ setBreath(v=>!v); if(!breathActive) speak(ph(lang,"breathe")); }}
                style={{width:"100%",padding:"15px",background:breathActive?`${GOLD}10`:`linear-gradient(135deg,${GOLD}20,${GOLD}08)`,
                  color:GOLD,border:`1px solid ${GOLD}35`,fontSize:12,fontWeight:700,
                  fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer"}}>
                {breathActive?"⏹  Stop Breathing Guide":"▶  Start 4-7-8 Guide"}
              </button>
            </div>

            {/* Science cards */}
            {[
              {n:"4",phase:"Inhale",action:"Slow nasal inhale, expanding belly",science:"Activates diaphragm, signals safety to nervous system"},
              {n:"7",phase:"Hold",  action:"Retain breath, relax face and jaw",science:"CO₂ buildup triggers parasympathetic response, releases muscle tension"},
              {n:"8",phase:"Exhale",action:"Slow mouth exhale, twice as long",science:"Longer exhale than inhale = HRV increase, cortisol drop, sleep onset"},
            ].map((s,i)=>(
              <div key={i} style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px",display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:GOLD,lineHeight:1,flexShrink:0,width:32,textAlign:"center"}}>{s.n}</div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:TEXTM,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>{s.phase}</div>
                  <div style={{fontSize:8,color:`${GOLD}70`,letterSpacing:".06em",lineHeight:1.7,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{s.action}</div>
                  <div style={{fontSize:7,color:TEXTMU,letterSpacing:".05em",lineHeight:1.7,fontFamily:"'Space Mono',monospace"}}>{s.science}</div>
                </div>
              </div>
            ))}

            {/* Additional techniques */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>Progressive Muscle Relaxation Sequence</div>
              {[
                "Tense feet 5s → release → feel warmth spread up",
                "Tense calves 5s → release → legs grow heavy",
                "Tense thighs 5s → release → sink into bed",
                "Tense stomach 5s → release → breathing deepens",
                "Tense shoulders 5s → release → neck softens",
                "Scrunch face 5s → release → jaw unclenches",
              ].map((step,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,paddingBottom:8,borderBottom:i<5?`1px solid ${BORDER}15`:""}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:`${GOLD}50`,width:18,textAlign:"center",flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:8,color:TEXTMU,letterSpacing:".05em",lineHeight:1.7,fontFamily:"'Space Mono',monospace"}}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ SLEEP LOG ════════════════ */}
        {tab==="log"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:7,letterSpacing:".2em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Sleep Journal · {sleepLog.length} Entries</div>
              <button className="sg-btn" onClick={()=>setShowLog(true)}
                style={{background:`${GOLD}15`,color:GOLD,border:`1px solid ${GOLD}35`,fontSize:8,fontWeight:700,
                  fontFamily:"'Space Mono',monospace",letterSpacing:".1em",textTransform:"uppercase",padding:"9px 16px",cursor:"pointer"}}>
                + Log Sleep
              </button>
            </div>

            {/* Quality distribution */}
            {sleepLog.length>0&&(
              <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"12px 14px",display:"flex",gap:16,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:6,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:6}}>Quality Distribution</div>
                  <div style={{display:"flex",gap:3,alignItems:"flex-end",height:30}}>
                    {[1,2,3,4,5,6,7,8,9,10].map(q=>{
                      const cnt=sleepLog.filter(l=>Math.round(l.quality)===q).length;
                      const pct=sleepLog.length?cnt/sleepLog.length:0;
                      return (
                        <div key={q} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                          <div style={{width:"100%",height:`${pct*100}%`,minHeight:pct>0?3:0,background:q>=8?"#34D399":q>=6?GOLD:q>=4?"#F59E0B":CRIMSON,borderRadius:"2px 2px 0 0"}}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:6,color:TEXTMU,fontFamily:"'Space Mono',monospace",marginTop:3}}>
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:GOLD,lineHeight:1}}>{avgQual}</div>
                  <div style={{fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>avg quality</div>
                </div>
              </div>
            )}

            {sleepLog.map((log,i)=>{
              const c=log.duration>=7?"#34D399":log.duration>=6?GOLD:CRIMSON;
              const qc=log.quality>=7?"#34D399":log.quality>=5?GOLD:CRIMSON;
              return (
                <div key={log.id} className="fu" style={{border:`1px solid ${c}12`,background:BG2,padding:"14px 16px",animationDelay:`${i*35}ms`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0,boxShadow:`0 0 8px ${c}50`}}/>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:TEXTM,marginBottom:3,fontFamily:"'Space Mono',monospace"}}>{log.date}</div>
                      <div style={{fontSize:7,letterSpacing:".06em",color:TEXTMU,fontFamily:"'Space Mono',monospace"}}>{log.notes||"No notes"}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:c,lineHeight:1}}>{log.duration}h</div>
                    <div style={{fontSize:7,letterSpacing:".12em",color:qc,textTransform:"uppercase",marginTop:2,fontFamily:"'Space Mono',monospace"}}>Q:{log.quality}/10</div>
                  </div>
                </div>
              );
            })}
            {!sleepLog.length&&(
              <div style={{textAlign:"center",padding:"48px 0",color:TEXTMU,fontSize:8,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
                No entries yet — tap + Log Sleep to begin
              </div>
            )}
          </div>
        )}

        {/* ════════════════ HYGIENE ════════════════ */}
        {tab==="habits"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}} className="fu">
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:4}}>Sleep Hygiene Checklist · Tonight</div>
              <div style={{fontSize:8,color:TEXTMU,letterSpacing:".06em",lineHeight:1.8,fontFamily:"'Space Mono',monospace",marginBottom:14}}>
                Each habit backed by published sleep science. Tap any to reveal the evidence.
              </div>

              {habits.map((h,i)=>{
                const sci=showHabitScience===h.id;
                return (
                  <div key={h.id} style={{marginBottom:6}}>
                    <div onClick={()=>toggleHabit(h.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                        background:h.done?"#0e0b06":BG3,border:`1px solid ${h.done?GOLD+"20":BORDER+"20"}`,
                        cursor:"pointer",transition:"all .16s"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${h.done?GOLD:TEXTD}`,
                        background:h.done?GOLD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,transition:"all .16s",boxShadow:h.done?`0 0 10px ${GOLD}35`:""}}>
                        {h.done&&<span style={{fontSize:11,color:"#040200",fontWeight:700}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,letterSpacing:".04em",color:h.done?`${GOLD}80`:TEXTMU,textDecoration:h.done?"line-through":"none",fontFamily:"'Space Mono',monospace",transition:"all .16s"}}>{h.label}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setShowSci(sci?null:h.id);}}
                        style={{background:"transparent",border:"none",color:TEXTMU,fontSize:8,cursor:"pointer",fontFamily:"'Space Mono',monospace",padding:"2px 6px"}}>
                        {sci?"▲":"▸"}
                      </button>
                    </div>
                    {sci&&(
                      <div className="fu" style={{background:"#080604",border:`1px solid ${GOLD}10`,borderTop:"none",padding:"10px 14px 10px 48px",fontSize:8,color:`${GOLD}55`,lineHeight:1.8,letterSpacing:".05em",fontFamily:"'Space Mono',monospace"}}>
                        {h.science}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{marginTop:12,display:"flex",justifyContent:"space-between",fontSize:7,letterSpacing:".14em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
                <span>{habits.filter(h=>h.done).length}/{habits.length} completed</span>
                <span style={{color:GOLD}}>{Math.round((habits.filter(h=>h.done).length/habits.length)*100)}%</span>
              </div>
              <div style={{height:3,background:"#0e0a06",marginTop:8,borderRadius:2}}>
                <div style={{height:"100%",width:`${(habits.filter(h=>h.done).length/habits.length)*100}%`,background:PROG,transition:"width .6s ease",borderRadius:2,boxShadow:`0 0 8px ${GOLD}30`}}/>
              </div>
            </div>

            {/* Sleep hygiene facts */}
            <div style={{border:`1px solid ${BORDER}20`,background:BG2,padding:"14px"}}>
              <div style={{fontSize:7,letterSpacing:".18em",color:`${GOLD}50`,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:12}}>Sleep Hygiene Science · Key Facts</div>
              {[
                {stat:"43%",  fact:"of sleep quality is determined by pre-sleep behaviour",color:GOLD},
                {stat:"500%", fact:"higher melatonin production in complete darkness",color:GOLD2},
                {stat:"68%",  fact:"stress reduction from 15-min reading vs screen use",color:GOLD},
                {stat:"1°C",  fact:"core body temp drop triggers sleep onset",color:CRIMSON},
                {stat:"6h",   fact:"caffeine half-life — still in system at midnight if taken at 6pm",color:CRIM2},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:14,marginBottom:10,paddingBottom:10,borderBottom:i<4?`1px solid ${BORDER}18`:""}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:f.color,flexShrink:0,width:52,textAlign:"right"}}>{f.stat}</div>
                  <div style={{fontSize:8,color:TEXTMU,letterSpacing:".05em",lineHeight:1.7,fontFamily:"'Space Mono',monospace"}}>{f.fact}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{textAlign:"center",fontSize:6,letterSpacing:".16em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",paddingTop:8}}>
          ManifiX SleepGold · WHO {WHO.code} · SDG 3.4 · Offline-first · 20 Languages · Billion-dollar Health Tech
        </div>
      </div>

      {/* ════════════════ MODAL: LOG SLEEP ════════════════ */}
      {showLog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setShowLog(false)}>
          <div className="fu" style={{background:"#0c0904",border:`1px solid ${GOLD}25`,padding:28,width:"100%",maxWidth:440,boxShadow:`0 0 60px ${GOLD}08`}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:GOLD}}>Log Sleep Entry</div>
              <button onClick={()=>setShowLog(false)} style={{background:"none",border:"none",color:TEXTMU,cursor:"pointer",fontSize:20,fontFamily:"inherit"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <div style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:7}}>Duration (hours)</div>
                <input type="number" step=".5" min="0" max="12" value={newEntry.duration}
                  onChange={e=>setNewEntry(p=>({...p,duration:e.target.value}))}
                  placeholder="e.g. 7.5"
                  style={{width:"100%",background:"#070502",border:`1px solid ${BORDER}60`,color:GOLD,fontSize:16,fontFamily:"'Space Mono',monospace",padding:"12px 14px",outline:"none",letterSpacing:".08em"}}/>
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>Quality</span>
                  <span style={{fontSize:13,color:newEntry.quality>=7?"#34D399":newEntry.quality>=5?GOLD:CRIMSON,fontWeight:700,fontFamily:"'Cormorant Garamond',serif"}}>{newEntry.quality}/10</span>
                </div>
                <input type="range" min={1} max={10} value={newEntry.quality}
                  onChange={e=>setNewEntry(p=>({...p,quality:parseInt(e.target.value)}))}
                  style={{width:"100%",background:`linear-gradient(90deg,${GOLD} ${newEntry.quality*10}%,#1a1408 0%)`}}/>
              </div>
              <div>
                <div style={{fontSize:7,letterSpacing:".18em",color:TEXTMU,textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:7}}>Notes</div>
                <textarea value={newEntry.notes} onChange={e=>setNewEntry(p=>({...p,notes:e.target.value}))}
                  placeholder="Dreams, wake-ups, how rested you felt..."
                  style={{width:"100%",background:"#070502",border:`1px solid ${BORDER}60`,color:`${GOLD}70`,fontSize:9,fontFamily:"'Space Mono',monospace",padding:"12px 14px",outline:"none",minHeight:70,lineHeight:1.7,resize:"none"}}/>
              </div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button className="sg-btn" onClick={saveLog}
                  style={{flex:1,padding:"15px",background:`${GOLD}18`,color:GOLD,border:`1px solid ${GOLD}40`,fontSize:11,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:".1em",textTransform:"uppercase",cursor:"pointer"}}>
                  Save Entry
                </button>
                <button onClick={()=>setShowLog(false)}
                  style={{flex:1,padding:"15px",background:"transparent",border:`1px solid ${BORDER}50`,color:TEXTMU,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer"}}>
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
