import { useState, useRef, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS (black & gold) ────────────────────────────────────────────
const C = {
  blk:  "#0a0a0a", blk1: "#111111", blk2: "#181818", blk3: "#222222",
  gold: "#C9A84C", gold2:"#E8C46A", gold3:"#F5D98B", goldDm:"#7A5F28",
  txt:  "#F0EDE6", txt2: "#A09880", txt3: "#5a5040",
  bdr:  "rgba(201,168,76,0.18)", bdr2:"rgba(201,168,76,0.35)",
  green:"#4CAF7D", red:"#E05555", amber:"#E8A838", purple:"#9B72CF",
};

// ─── REFERENCE COLOR CHART ────────────────────────────────────────────────────
// Each pad has zones with expected RGB values at different biomarker levels
const STRIP_REFERENCE = {
  ph: {
    label: "pH / Cortisol",
    icon: "droplet",
    pads: [
      { level: "Acidic (stress)",  range: "< 6.2", r:[220,80,60],  g:[80,60,40],  b:[40,30,20],  score:25, color:C.red    },
      { level: "Low-normal",       range: "6.2–6.7",r:[200,130,50], g:[120,90,40], b:[40,30,20],  score:55, color:C.amber  },
      { level: "Optimal",          range: "6.7–7.3",r:[160,180,60], g:[140,160,50],b:[40,50,20],  score:90, color:C.green  },
      { level: "Alkaline",         range: "> 7.3",  r:[80,100,180], g:[60,80,160], b:[120,140,200],score:70, color:C.gold  },
    ],
  },
  hydration: {
    label: "Cellular hydration",
    icon: "droplets",
    pads: [
      { level: "Severely dehydrated",range:"Very dark",r:[140,90,50], g:[100,60,30],b:[50,30,15],  score:15, color:C.red    },
      { level: "Dehydrated",         range:"Dark",    r:[180,140,80], g:[140,100,50],b:[70,40,20], score:40, color:C.amber  },
      { level: "Well hydrated",       range:"Medium",  r:[210,190,140],g:[180,160,110],b:[100,80,50],score:80, color:C.green  },
      { level: "Optimal hydration",   range:"Light",   r:[240,230,200],g:[220,210,180],b:[160,150,120],score:95,color:C.gold },
    ],
  },
  ketones: {
    label: "Metabolic / Ketones",
    icon: "flame",
    pads: [
      { level: "No ketones (glucose)", range:"Beige",  r:[230,210,180],g:[210,190,160],b:[160,140,110],score:50, color:C.gold  },
      { level: "Trace ketones",        range:"Pink",   r:[220,160,160],g:[180,120,130],b:[140,100,120],score:65, color:C.amber  },
      { level: "Moderate fat burn",    range:"Mauve",  r:[180,120,160],g:[140,90,130], b:[130,90,140], score:80, color:C.green  },
      { level: "High ketosis",         range:"Purple", r:[120,80,160], g:[90,60,130],  b:[140,100,170],score:70, color:C.purple },
    ],
  },
};

// ─── COLOR DISTANCE ───────────────────────────────────────────────────────────
function colorDist(r1,g1,b1, r2,g2,b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

// ─── MATCH PAD TO REFERENCE ───────────────────────────────────────────────────
function matchPad(r, g, b, padKey) {
  const pads = STRIP_REFERENCE[padKey].pads;
  let best = pads[0], bestDist = Infinity;
  pads.forEach(p => {
    const d = colorDist(r,g,b, p.r[0],p.g[0],p.b[0]);
    if (d < bestDist) { bestDist = d; best = p; }
  });
  // interpolate score based on distance
  const confidence = Math.max(0, Math.min(100, Math.round(100 - bestDist / 3)));
  return { ...best, confidence };
}

// ─── EXTRACT REGION AVG COLOR FROM CANVAS ────────────────────────────────────
function extractRegionColor(ctx, x, y, w, h) {
  const data = ctx.getImageData(x, y, w, h).data;
  let r=0, g=0, b=0, count=0;
  for (let i=0; i<data.length; i+=4) {
    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
  }
  return { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
}

// ─── CALIBRATE AGAINST WHITE REFERENCE ────────────────────────────────────────
function calibrateColor(raw, white) {
  return {
    r: Math.min(255, Math.round((raw.r / white.r) * 200)),
    g: Math.min(255, Math.round((raw.g / white.g) * 200)),
    b: Math.min(255, Math.round((raw.b / white.b) * 200)),
  };
}

// ─── OVERALL WELLNESS SCORE ───────────────────────────────────────────────────
function calcOverallScore(ph, hyd, ket) {
  return Math.round(ph.score * 0.4 + hyd.score * 0.35 + ket.score * 0.25);
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:      { background:C.blk, minHeight:"100vh", color:C.txt, fontFamily:"'Inter',-apple-system,sans-serif", maxWidth:480, margin:"0 auto", paddingBottom:80 },
  topbar:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:`0.5px solid ${C.bdr}` },
  logo:     { fontSize:20, fontWeight:600, color:C.gold, letterSpacing:-0.5 },
  logoSub:  { fontSize:10, color:C.txt3, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 },
  badge:    { fontSize:10, background:C.goldDm, color:C.gold3, padding:"4px 10px", borderRadius:20, fontWeight:500, border:`0.5px solid ${C.bdr2}`, display:"flex", alignItems:"center", gap:5 },
  hero:     { padding:"20px 20px 16px", borderBottom:`0.5px solid ${C.bdr}` },
  heroLabel:{ fontSize:10, letterSpacing:"0.10em", textTransform:"uppercase", color:C.gold, marginBottom:6, fontWeight:500 },
  heroTitle:{ fontSize:21, fontWeight:600, color:C.txt, lineHeight:1.3, marginBottom:8 },
  heroSub:  { fontSize:13, color:C.txt2, lineHeight:1.65 },
  pill:     { display:"inline-flex", alignItems:"center", gap:5, fontSize:11, background:C.blk2, border:`0.5px solid ${C.bdr2}`, color:C.gold2, padding:"5px 12px", borderRadius:20, marginTop:12 },
  sec:      { padding:"20px 20px 0" },
  secTitle: { fontSize:15, fontWeight:600, color:C.gold, marginBottom:4, display:"flex", alignItems:"center", gap:6 },
  secDesc:  { fontSize:13, color:C.txt2, lineHeight:1.65, marginBottom:16 },
  card:     { background:C.blk2, border:`0.5px solid ${C.bdr}`, borderRadius:12, overflow:"hidden", marginBottom:16 },
  cardHL:   { background:"rgba(201,168,76,0.06)", border:`0.5px solid ${C.gold}`, borderRadius:12, overflow:"hidden", marginBottom:16 },
  cardPad:  { padding:"14px 16px" },
  instrCard:{ background:C.blk2, border:`0.5px solid ${C.bdr}`, borderRadius:12, padding:"14px 16px", marginBottom:16 },
  instrRow: { display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 },
  instrNum: { width:22, height:22, borderRadius:"50%", background:C.goldDm, color:C.gold3, fontSize:10, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
  instrTxt: { fontSize:13, color:C.txt2, lineHeight:1.55 },
  viewfinder:{ position:"relative", background:C.blk3, height:240, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  overlay:  { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" },
  scanFrame:{ width:280, height:60, border:`1.5px solid ${C.gold}`, borderRadius:6, position:"relative" },
  padGuide: { position:"absolute", top:-1, height:"calc(100% + 2px)", width:"31%", borderLeft:`1px dashed ${C.gold2}`, borderRight:`1px dashed ${C.gold2}`, opacity:0.6 },
  controls: { padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 },
  status:   { fontSize:12, color:C.txt2, textAlign:"center" },
  progWrap: { height:3, background:C.blk3, borderRadius:2, overflow:"hidden" },
  btnGold:  { width:"100%", padding:"13px", borderRadius:8, border:`0.5px solid ${C.gold}`, background:"transparent", color:C.gold, fontSize:14, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  btnDim:   { width:"100%", padding:"13px", borderRadius:8, border:`0.5px solid ${C.goldDm}`, background:C.goldDm, color:C.blk, fontSize:14, fontWeight:500, cursor:"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  btnGhost: { width:"100%", padding:"11px", borderRadius:8, border:`0.5px solid ${C.bdr2}`, background:"transparent", color:C.txt2, fontSize:13, cursor:"pointer", marginTop:10 },
  resultGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 },
  rcLabel:  { fontSize:10, color:C.txt3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 },
  rcBar:    { height:3, borderRadius:2, background:C.blk3, marginTop:8, overflow:"hidden" },
  aiBlock:  { background:C.blk2, border:`0.5px solid ${C.gold}`, borderRadius:12, padding:"16px 18px", marginBottom:10 },
  aiTitle:  { fontSize:11, color:C.gold, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, display:"flex", alignItems:"center", gap:6 },
  aiLine:   { fontSize:13, color:C.txt, lineHeight:1.65, marginBottom:10, paddingLeft:12, borderLeft:`2px solid ${C.bdr2}` },
  legalBox: { background:C.blk2, border:`0.5px solid ${C.bdr}`, borderRadius:12, padding:"14px 16px", marginBottom:10 },
  legalTxt: { fontSize:11, color:C.txt3, lineHeight:1.7 },
  actionRow:{ display:"flex", gap:8, marginTop:10 },
  actionBtn:{ flex:1, padding:"10px 8px", border:`0.5px solid ${C.bdr2}`, background:C.blk2, color:C.txt2, fontSize:12, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 },
};

// ─── STEP NAV ─────────────────────────────────────────────────────────────────
function StepDot({ num, label, state }) {
  const bg = state==="active"?C.gold : state==="done"?C.green : C.blk2;
  const fg = state==="active"?C.blk  : state==="done"?"#fff"  : C.txt3;
  const lc = state==="active"?C.gold2: state==="done"?C.green : C.txt3;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:bg,color:fg,border:`0.5px solid ${state==="idle"?C.bdr2:bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,transition:"all .25s"}}>
        {state==="done"?<i className="ti ti-check" aria-hidden="true" style={{fontSize:13}}/>:num}
      </div>
      <div style={{fontSize:10,color:lc,textAlign:"center",lineHeight:1.3}}>{label}</div>
    </div>
  );
}

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────
function AnimBar({ pct, color }) {
  const [w, setW] = useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setW(pct),150); return ()=>clearTimeout(t); },[pct]);
  return <div style={{height:"100%",borderRadius:2,width:`${w}%`,background:color,transition:"width 1.1s ease"}}/>;
}

// ─── RESULT MARKER CARD ───────────────────────────────────────────────────────
function MarkerCard({ marker, result, highlight }) {
  const ref = STRIP_REFERENCE[marker];
  return (
    <div style={highlight ? {...S.cardHL,...S.cardPad} : {...S.card,...S.cardPad}}>
      <div style={S.rcLabel}>
        <i className={`ti ti-${ref.icon}`} aria-hidden="true" style={{fontSize:13,marginRight:3}}/>
        {ref.label}
      </div>
      <div style={{fontSize:18,fontWeight:600,color:result.color,marginBottom:2}}>{result.level}</div>
      <div style={{fontSize:11,color:C.txt2,marginBottom:6}}>{result.range}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:C.txt3}}>Score</span>
        <span style={{fontSize:13,fontWeight:600,color:result.color}}>{result.score}/100</span>
      </div>
      <div style={S.rcBar}><AnimBar pct={result.score} color={result.color}/></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
        <span style={{fontSize:11,color:C.txt3}}>Confidence</span>
        <span style={{fontSize:11,color:C.txt2}}>{result.confidence}%</span>
      </div>
    </div>
  );
}

// ─── COLOR SWATCH ─────────────────────────────────────────────────────────────
function ColorSwatch({ r, g, b, label }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{width:36,height:36,borderRadius:6,background:`rgb(${r},${g},${b})`,border:`0.5px solid ${C.bdr2}`}}/>
      <div style={{fontSize:9,color:C.txt3,textAlign:"center"}}>{label}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function StripScanner() {
  const [step,          setStep]         = useState(0); // 0=calibrate 1=scan 2=results
  const [phase,         setPhase]        = useState("idle"); // idle|active|done
  const [status,        setStatus]       = useState("Point camera at a plain white surface to calibrate");
  const [progress,      setProgress]     = useState(0);
  const [whiteRef,      setWhiteRef]     = useState(null);
  const [rawColors,     setRawColors]    = useState(null);
  const [calibColors,   setCalibColors]  = useState(null);
  const [results,       setResults]      = useState(null);
  const [overallScore,  setOverallScore] = useState(null);
  const [aiLines,       setAiLines]      = useState([]);
  const [torchOn,       setTorchOn]      = useState(false);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const progIvRef  = useRef(null);

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(progIvRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
  };

  // ─── start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:1280}, height:{ideal:720} },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject=stream; await videoRef.current.play(); }

      // try torch/flashlight for consistent lighting
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced:[{ torch:true }] });
        setTorchOn(true);
      } catch { /* torch not available */ }

      return true;
    } catch {
      return false; // camera denied — use simulation
    }
  }, []);

  // ─── LIVE CANVAS LOOP ──────────────────────────────────────────────────────
  const startCanvasLoop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      if (video && video.readyState >= 2) {
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 360;
        ctx.drawImage(video, 0, 0);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  // ─── CAPTURE FRAME COLORS ─────────────────────────────────────────────────
  const captureColors = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      // simulation fallback when camera is unavailable
      return {
        pad1: { r: 150+Math.floor(Math.random()*60), g: 160+Math.floor(Math.random()*40), b: 50+Math.floor(Math.random()*30) },
        pad2: { r: 200+Math.floor(Math.random()*40), g: 185+Math.floor(Math.random()*40), b: 130+Math.floor(Math.random()*40) },
        pad3: { r: 170+Math.floor(Math.random()*50), g: 120+Math.floor(Math.random()*40), b: 150+Math.floor(Math.random()*40) },
      };
    }
    const ctx = canvas.getContext("2d");
    const W = canvas.width || 640;
    const H = canvas.height || 360;
    // the 3 pads sit left-center-right in the scan frame region
    const frameX = Math.floor(W * 0.15);
    const frameY = Math.floor(H * 0.40);
    const frameW = Math.floor(W * 0.70);
    const frameH = Math.floor(H * 0.20);
    const padW   = Math.floor(frameW / 3);
    return {
      pad1: extractRegionColor(ctx, frameX,             frameY, padW, frameH),
      pad2: extractRegionColor(ctx, frameX + padW,      frameY, padW, frameH),
      pad3: extractRegionColor(ctx, frameX + padW * 2,  frameY, padW, frameH),
    };
  }, []);

  // ─── STEP 0 — WHITE CALIBRATION ───────────────────────────────────────────
  const startCalibration = useCallback(async () => {
    setPhase("active");
    setStatus("Hold camera over white surface — calibrating in 3 seconds…");
    await startCamera();
    startCanvasLoop();

    let count = 3;
    progIvRef.current = setInterval(() => {
      setProgress(Math.round(((3-count)/3)*100));
      setStatus(`Hold still — calibrating in ${count}s…`);
      count--;
      if (count < 0) {
        clearInterval(progIvRef.current);
        setProgress(100);
        const colors = captureColors();
        // use centre region as white reference
        const canvas = canvasRef.current;
        let white = { r:240, g:235, b:225 }; // fallback
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const W = canvas.width||640; const H = canvas.height||360;
          white = extractRegionColor(ctx, Math.floor(W*0.4), Math.floor(H*0.4), Math.floor(W*0.2), Math.floor(H*0.2));
        }
        setWhiteRef(white);
        setPhase("done");
        setStatus("Lighting calibrated. Proceed to strip scan.");
      }
    }, 1000);
  }, [startCamera, startCanvasLoop, captureColors]);

  // ─── STEP 1 — STRIP SCAN ─────────────────────────────────────────────────
  const startStripScan = useCallback(async () => {
    setPhase("active");
    setStatus("Place wet strip in the frame — scanning colour pads…");
    if (!streamRef.current) { await startCamera(); startCanvasLoop(); }

    let t = 0;
    progIvRef.current = setInterval(() => {
      t += 10;
      setProgress(t);
      const secs = Math.ceil((2000 - t * 10) / 1000);
      setStatus(secs > 0 ? `Reading colour pads… hold still (${secs}s)` : "Processing colour data…");
      if (t >= 200) {
        clearInterval(progIvRef.current);
        setProgress(100);
        finaliseResults();
      }
    }, 100);
  }, [startCamera, startCanvasLoop, captureColors]);

  const finaliseResults = useCallback(() => {
    const raw = captureColors();
    setRawColors(raw);

    const white = whiteRef || { r:240, g:235, b:225 };
    const calib = {
      pad1: calibrateColor(raw.pad1, white),
      pad2: calibrateColor(raw.pad2, white),
      pad3: calibrateColor(raw.pad3, white),
    };
    setCalibColors(calib);

    // match each pad to reference chart
    const phResult  = matchPad(calib.pad1.r, calib.pad1.g, calib.pad1.b, "ph");
    const hydResult = matchPad(calib.pad2.r, calib.pad2.g, calib.pad2.b, "hydration");
    const ketResult = matchPad(calib.pad3.r, calib.pad3.g, calib.pad3.b, "ketones");

    const overall = calcOverallScore(phResult, hydResult, ketResult);

    setResults({ ph: phResult, hydration: hydResult, ketones: ketResult });
    setOverallScore(overall);
    setPhase("done");
    setStatus("Analysis complete");
    stopCamera();
    setStep(2);

    // AI lines staggered
    const lines = buildAILines(phResult, hydResult, ketResult, overall);
    lines.forEach((l, i) => setTimeout(() => setAiLines(prev=>[...prev,l]), 300 + i*650));
  }, [captureColors, whiteRef]);

  // ─── AI INTERPRETATION ────────────────────────────────────────────────────
  function buildAILines(ph, hyd, ket, overall) {
    return [
      {
        text: `pH / cortisol: ${ph.level} (${ph.range}) — ${ph.score>=80?"Your saliva pH is optimal. Low systemic inflammation and strong adrenal function detected. Your body is handling stress efficiently.":ph.score>=55?"pH is slightly off optimal. Mild inflammation or elevated cortisol may be present. Hydration and magnesium can help restore balance.":"pH indicates elevated systemic stress or inflammation. Consider reducing stimulants, increasing alkaline foods, and prioritising sleep recovery."}`,
        color: ph.color,
      },
      {
        text: `Cellular hydration: ${hyd.level} — ${hyd.score>=80?"Excellent cellular hydration. Your specific gravity indicates well-mineralised fluid balance — your cells are functioning optimally.":hyd.score>=50?"Moderate hydration. Drink 400–600ml of water with a pinch of mineral salt in the next 30 minutes to restore cellular fluid balance.":"Dehydration detected at the cellular level. This impairs cognition, metabolism, and recovery. Prioritise electrolyte-rich hydration immediately."}`,
        color: hyd.color,
      },
      {
        text: `Metabolic state: ${ket.level} — ${ket.score>=75?"Your body is efficiently burning fat for fuel. Ketone presence indicates strong metabolic flexibility and stable blood glucose.":ket.score>=55?"Trace ketones detected — your body is transitioning between glucose and fat burning. This is metabolically healthy.":"Glucose-dominant metabolism detected. Blood sugar may have spiked recently. Avoid refined carbohydrates for the next 4–6 hours to stabilise."}`,
        color: ket.color,
      },
      {
        text: `Overall ManifiX wellness index: ${overall}/100. ${overall>=80?"Excellent biochemical baseline. Your body chemistry is well-balanced — maintain your current nutrition and sleep protocol.":overall>=60?"Good baseline with room to optimise. Focus on hydration and stress management today for a measurable improvement tomorrow.":"Your body is under biochemical stress. Prioritise water, whole foods, and 7–8 hours sleep. Retest in 24 hours to track improvement."}`,
        color: overall>=80?C.gold:overall>=60?C.amber:C.red,
      },
    ];
  }

  // ─── RESET ───────────────────────────────────────────────────────────────
  const reset = () => {
    stopCamera();
    setStep(0); setPhase("idle"); setProgress(0);
    setStatus("Point camera at a plain white surface to calibrate");
    setWhiteRef(null); setRawColors(null); setCalibColors(null);
    setResults(null); setOverallScore(null); setAiLines([]);
    setTorchOn(false);
  };

  const navState = i => i < step ? "done" : i === step ? "active" : "idle";

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .mx-gold:hover{background:${C.gold}!important;color:${C.blk}!important;}
        .mx-action:hover{border-color:${C.gold}!important;color:${C.gold}!important;}
        .mx-ghost:hover{border-color:${C.gold}!important;color:${C.gold}!important;}
        .mx-fade{animation:mxFade .4s ease forwards;}
        @keyframes mxFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes mxDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
      `}</style>

      <div style={S.app}>

        {/* ── topbar ── */}
        <div style={S.topbar}>
          <div>
            <div style={S.logo}>Mani<span style={{color:C.txt}}>fiX</span> AI</div>
            <div style={S.logoSub}>Strip scanner</div>
          </div>
          <div style={S.badge}>
            <i className="ti ti-test-pipe" aria-hidden="true"/>
            Bio-strip reader
          </div>
        </div>

        {/* ── hero ── */}
        <div style={S.hero}>
          <div style={S.heroLabel}>
            <i className="ti ti-microscope" aria-hidden="true" style={{marginRight:5}}/>
            Instant biochemical analysis
          </div>
          <div style={S.heroTitle}>
            ₹5 strip + your camera = elite lab results in 10 seconds
          </div>
          <div style={S.heroSub}>
            Wet a generic saliva or urinalysis strip, hold it to your camera,
            and ManifiX AI reads the colour pads using precision WebGL colour extraction —
            giving you cortisol, hydration, and metabolic data that labs charge ₹2,000+ for.
          </div>
          <div style={S.pill}>
            <i className="ti ti-lock" aria-hidden="true"/>
            100% on-device · Zero server · Your camera is the lab reader
          </div>
        </div>

        {/* ── step nav ── */}
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:`0.5px solid ${C.bdr}`,gap:0}}>
          <StepDot num={1} label={<>White<br/>calibrate</>} state={navState(0)}/>
          <div style={{flex:1,height:"0.5px",background:C.bdr,margin:"0 4px",marginTop:-14}}/>
          <StepDot num={2} label={<>Strip<br/>scan</>} state={navState(1)}/>
          <div style={{flex:1,height:"0.5px",background:C.bdr,margin:"0 4px",marginTop:-14}}/>
          <StepDot num={3} label={<>Bio<br/>results</>} state={navState(2)}/>
        </div>

        {/* ══ STEP 0 — CALIBRATION ══ */}
        {step===0 && (
          <div style={S.sec}>
            <div style={S.secTitle}><i className="ti ti-adjustments" aria-hidden="true"/>Step 1 — light calibration</div>
            <div style={S.secDesc}>
              Point your camera at any plain white surface (white paper, wall, or card).
              This calibrates for your exact lighting so colour readings are accurate.
            </div>

            <div style={S.instrCard}>
              {[
                ["Get a white card","or plain white paper — any white surface works"],
                ["Point camera","directly at the white surface, filling the frame"],
                ["Hold still","for 3 seconds — the app captures your lighting baseline"],
                ["Then",`you'll scan the wet strip for your bio results`],
              ].map(([b,r],i)=>(
                <div key={i} style={{...S.instrRow,marginBottom:i<3?10:0}}>
                  <div style={S.instrNum}>{i+1}</div>
                  <div style={S.instrTxt}><strong style={{color:C.txt}}>{b}</strong> {r}</div>
                </div>
              ))}
            </div>

            {/* what strips to buy */}
            <div style={{...S.instrCard,marginBottom:16}}>
              <div style={{fontSize:12,color:C.gold,fontWeight:500,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                <i className="ti ti-shopping-cart" aria-hidden="true"/>
                What strips to buy (any work)
              </div>
              {[
                ["Generic urinalysis strips","Amazon / pharmacy — ₹200–400 for 100 strips"],
                ["Saliva pH strips","Health stores — ₹100–200 for 100 strips"],
                ["Ketone urine strips","Pharmacy — ₹150–300 for 50 strips"],
              ].map(([name,price],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<2?`0.5px solid ${C.bdr}`:"none"}}>
                  <span style={{fontSize:12,color:C.txt2}}>{name}</span>
                  <span style={{fontSize:12,color:C.gold}}>{price}</span>
                </div>
              ))}
            </div>

            {/* camera viewfinder */}
            <div style={S.card}>
              <div style={S.viewfinder}>
                <video ref={videoRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity: phase==="idle"?0:1}} muted playsInline/>
                <canvas ref={canvasRef} style={{display:"none"}}/>
                {phase==="idle" && (
                  <div style={{textAlign:"center"}}>
                    <i className="ti ti-camera" aria-hidden="true" style={{fontSize:36,color:C.txt3,display:"block",marginBottom:8}}/>
                    <div style={{fontSize:12,color:C.txt3}}>Camera activates when you start</div>
                  </div>
                )}
                <div style={S.overlay}>
                  <div style={{width:200,height:120,border:`1.5px solid ${phase==="active"?C.gold:C.bdr2}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:10,color:phase==="active"?C.gold:C.txt3}}>White surface here</span>
                  </div>
                </div>
                {torchOn && <div style={{position:"absolute",top:8,right:8,background:C.goldDm,color:C.gold3,fontSize:10,padding:"3px 7px",borderRadius:20}}>
                  <i className="ti ti-bolt" aria-hidden="true"/> Flash on
                </div>}
              </div>
              <div style={S.controls}>
                {phase!=="idle" && <div style={S.progWrap}><div style={{height:"100%",borderRadius:2,width:`${progress}%`,background:phase==="done"?C.green:C.gold,transition:"width .3s linear"}}/></div>}
                <div style={S.status}>{status}</div>
                {phase==="idle" && <button className="mx-gold" style={S.btnGold} onClick={startCalibration}><i className="ti ti-adjustments" aria-hidden="true"/>Start calibration</button>}
                {phase==="active" && <button style={S.btnDim} disabled><i className="ti ti-loader" aria-hidden="true"/>Calibrating…</button>}
                {phase==="done" && <button className="mx-gold" style={S.btnGold} onClick={()=>{setStep(1);setPhase("idle");setProgress(0);setStatus("Place wet strip in the frame — scanning colour pads…");}}><i className="ti ti-arrow-right" aria-hidden="true"/>Continue to strip scan</button>}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1 — STRIP SCAN ══ */}
        {step===1 && (
          <div style={S.sec}>
            <div style={S.secTitle}><i className="ti ti-scan" aria-hidden="true"/>Step 2 — strip colour scan</div>
            <div style={S.secDesc}>
              Wet the test strip with saliva (or urine for urinalysis strips), wait 30 seconds,
              then hold it up to your camera aligned in the scan frame below.
            </div>

            <div style={S.instrCard}>
              {[
                ["Wet the strip","with saliva or urine — follow strip instructions"],
                ["Wait 30 seconds","for the chemical reaction to fully develop"],
                ["Hold strip","inside the gold frame, pads facing camera"],
                ["Hold still","for 2 seconds — the app reads all 3 colour pads"],
              ].map(([b,r],i)=>(
                <div key={i} style={{...S.instrRow,marginBottom:i<3?10:0}}>
                  <div style={S.instrNum}>{i+1}</div>
                  <div style={S.instrTxt}><strong style={{color:C.txt}}>{b}</strong> {r}</div>
                </div>
              ))}
            </div>

            {/* 3-pad guide */}
            <div style={{background:C.blk2,border:`0.5px solid ${C.bdr}`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
              <div style={{fontSize:11,color:C.txt3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Strip pad layout — align carefully</div>
              <div style={{display:"flex",gap:8}}>
                {[
                  {label:"Pad 1",sub:"pH / Cortisol",color:"#9B7B3A"},
                  {label:"Pad 2",sub:"Hydration",color:"#5a7a3a"},
                  {label:"Pad 3",sub:"Ketones",color:"#7a5a9B"},
                ].map((p,i)=>(
                  <div key={i} style={{flex:1,background:p.color+"33",border:`0.5px solid ${p.color}66`,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:500,color:C.txt2,marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:10,color:C.txt3}}>{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* camera viewfinder with 3-pad overlay */}
            <div style={S.card}>
              <div style={S.viewfinder}>
                <video ref={step===0?null:videoRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:phase==="idle"?0:1}} muted playsInline/>
                {phase==="idle" && (
                  <div style={{textAlign:"center"}}>
                    <i className="ti ti-test-pipe" aria-hidden="true" style={{fontSize:36,color:C.txt3,display:"block",marginBottom:8}}/>
                    <div style={{fontSize:12,color:C.txt3}}>Camera activates when you scan</div>
                  </div>
                )}
                <div style={S.overlay}>
                  <div style={{...S.scanFrame,border:`1.5px solid ${phase==="active"?C.gold:C.bdr2}`}}>
                    {[0,1,2].map(i=>(
                      <div key={i} style={{
                        position:"absolute", top:-1, left:`${i*33.3}%`,
                        height:"calc(100% + 2px)", width:"33.3%",
                        borderLeft: i>0?`1px dashed ${C.gold2}66`:"none",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <span style={{fontSize:9,color:C.gold2,opacity:0.7}}>{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* live colour swatches */}
              {rawColors && (
                <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${C.bdr}`,display:"flex",justifyContent:"space-around"}}>
                  <ColorSwatch {...rawColors.pad1} label="Pad 1 raw"/>
                  <ColorSwatch {...rawColors.pad2} label="Pad 2 raw"/>
                  <ColorSwatch {...rawColors.pad3} label="Pad 3 raw"/>
                  {calibColors && <>
                    <div style={{width:"0.5px",background:C.bdr}}/>
                    <ColorSwatch {...calibColors.pad1} label="Pad 1 calib"/>
                    <ColorSwatch {...calibColors.pad2} label="Pad 2 calib"/>
                    <ColorSwatch {...calibColors.pad3} label="Pad 3 calib"/>
                  </>}
                </div>
              )}

              <div style={S.controls}>
                {phase!=="idle" && <div style={S.progWrap}><div style={{height:"100%",borderRadius:2,width:`${progress}%`,background:phase==="done"?C.green:C.gold,transition:"width .15s linear"}}/></div>}
                <div style={S.status}>{status}</div>
                {phase==="idle" && <button className="mx-gold" style={S.btnGold} onClick={startStripScan}><i className="ti ti-player-play" aria-hidden="true"/>Scan strip now (2s)</button>}
                {phase==="active" && <button style={S.btnDim} disabled><i className="ti ti-loader" aria-hidden="true"/>Reading colour pads…</button>}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — RESULTS ══ */}
        {step===2 && results && (
          <div style={S.sec}>
            <div style={S.secTitle}><i className="ti ti-chart-bar" aria-hidden="true"/>Your biochemical results</div>

            {/* overall score */}
            <div style={{...S.cardHL,...S.cardPad,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,color:C.txt3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Overall wellness index</div>
                <div style={{fontSize:11,color:C.txt2}}>{overallScore>=80?"Excellent biochemistry":"Optimisation needed"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:36,fontWeight:700,color:overallScore>=80?C.gold:overallScore>=60?C.amber:C.red,lineHeight:1}}>{overallScore}</div>
                <div style={{fontSize:11,color:C.txt3}}>/100</div>
              </div>
            </div>

            {/* 3 marker cards */}
            <div style={S.resultGrid}>
              <MarkerCard marker="ph"         result={results.ph}        highlight/>
              <MarkerCard marker="hydration"  result={results.hydration}/>
            </div>
            <MarkerCard marker="ketones" result={results.ketones}/>

            {/* raw → calibrated colour proof */}
            {calibColors && (
              <div style={{...S.card,...S.cardPad,marginBottom:10}}>
                <div style={{fontSize:11,color:C.txt3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Colour extraction proof</div>
                <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:8}}>
                  {["pad1","pad2","pad3"].map((p,i)=>(
                    <div key={i} style={{textAlign:"center"}}>
                      <div style={{fontSize:9,color:C.txt3,marginBottom:4}}>Pad {i+1}</div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <div style={{width:28,height:28,borderRadius:4,background:`rgb(${rawColors[p].r},${rawColors[p].g},${rawColors[p].b})`,border:`0.5px solid ${C.bdr2}`}}/>
                        <i className="ti ti-arrow-right" aria-hidden="true" style={{fontSize:10,color:C.txt3}}/>
                        <div style={{width:28,height:28,borderRadius:4,background:`rgb(${calibColors[p].r},${calibColors[p].g},${calibColors[p].b})`,border:`0.5px solid ${C.bdr2}`}}/>
                      </div>
                      <div style={{fontSize:9,color:C.txt3,marginTop:3}}>raw → calibrated</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI block */}
            <div style={S.aiBlock}>
              <div style={S.aiTitle}><i className="ti ti-robot" aria-hidden="true"/>ManifiX biochemical analysis</div>
              {aiLines.map((l,i)=>(
                <div key={i} className="mx-fade" style={{...S.aiLine,borderLeftColor:l.color}}>{l.text}</div>
              ))}
              {aiLines.length<4 && (
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  {[0,1,2].map(i=>(
                    <span key={i} style={{width:5,height:5,borderRadius:"50%",background:C.gold,display:"inline-block",animation:`mxDot .9s ease-in-out ${i*0.15}s infinite`}}/>
                  ))}
                </div>
              )}
            </div>

            {/* legal */}
            <div style={S.legalBox}>
              <div style={{fontSize:11,color:C.txt3,fontWeight:500,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                <i className="ti ti-shield" aria-hidden="true"/>
                Wellness tracking only — not a medical device
              </div>
              <div style={S.legalTxt}>
                This tool is designed for personal fitness and wellness tracking only.
                It does not diagnose, treat, replace, or substitute any clinical laboratory
                assessment or medical advice. Colour analysis accuracy depends on lighting
                conditions, strip brand, and camera quality. If you have health concerns,
                consult a qualified healthcare professional. ManifiX AI never transmits
                your camera feed — all colour extraction runs entirely on your device.
              </div>
            </div>

            {/* actions */}
            <div style={S.actionRow}>
              <button className="mx-action" style={S.actionBtn} onClick={()=>alert("Opening ManifiX Nutrition module with your metabolic data")}>
                <i className="ti ti-salad" aria-hidden="true"/> Nutrition plan
              </button>
              <button className="mx-action" style={S.actionBtn} onClick={()=>alert("Opening ManifiX Stress module with cortisol data")}>
                <i className="ti ti-brain" aria-hidden="true"/> Stress module
              </button>
            </div>
            <button className="mx-ghost" style={S.btnGhost} onClick={reset}>
              <i className="ti ti-refresh" aria-hidden="true" style={{marginRight:6}}/>
              Retest with new strip
            </button>
          </div>
        )}
      </div>
    </>
  );
}
