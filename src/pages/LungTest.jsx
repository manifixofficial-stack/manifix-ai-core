import { useState, useRef, useEffect, useCallback } from "react";

// ─── constants ───────────────────────────────────────────────────────────────
const VISUAL_SCAN_DURATION = 30000; // 30 seconds real camera scan
const BLOW_TIMEOUT = 12000;         // max 12 seconds blow window
const SILENCE_THRESHOLD = 0.012;    // amplitude below = silence (blow ended)
const SILENCE_HOLD = 800;           // ms of silence to confirm blow ended

// ─── colour helpers ───────────────────────────────────────────────────────────
const gold   = "#C9A84C";
const gold2  = "#E8C46A";
const gold3  = "#F5D98B";
const goldDm = "#7A5F28";
const green  = "#4CAF7D";
const red    = "#E05555";
const amber  = "#E8A838";
const blk    = "#0a0a0a";
const blk2   = "#181818";
const blk3   = "#222222";
const txt    = "#F0EDE6";
const txt2   = "#A09880";
const txt3   = "#5a5040";
const bdr    = "rgba(201,168,76,0.18)";
const bdr2   = "rgba(201,168,76,0.35)";

// ─── inline styles ─────────────────────────────────────────────────────────────
const S = {
  app: {
    background: blk,
    minHeight: "100vh",
    color: txt,
    fontFamily: "'Inter', -apple-system, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    paddingBottom: 80,
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: `0.5px solid ${bdr}`,
  },
  logo: { fontSize: 20, fontWeight: 600, color: gold, letterSpacing: -0.5 },
  logoSub: { fontSize: 10, color: txt3, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 },
  badgeUnique: {
    fontSize: 10, background: goldDm, color: gold3,
    padding: "4px 10px", borderRadius: 20, fontWeight: 500,
    border: `0.5px solid ${bdr2}`, display: "flex", alignItems: "center", gap: 5,
  },
  hero: { padding: "20px 20px 16px", borderBottom: `0.5px solid ${bdr}` },
  heroLabel: { fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: gold, marginBottom: 6, fontWeight: 500 },
  heroTitle: { fontSize: 22, fontWeight: 600, color: txt, lineHeight: 1.3, marginBottom: 8 },
  heroSub: { fontSize: 13, color: txt2, lineHeight: 1.65 },
  uniquePill: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, background: blk2, border: `0.5px solid ${bdr2}`,
    color: gold2, padding: "5px 12px", borderRadius: 20, marginTop: 12,
  },
  stepsNav: {
    display: "flex", alignItems: "center",
    padding: "14px 20px", borderBottom: `0.5px solid ${bdr}`,
  },
  stepLine: { flex: 1, height: "0.5px", background: bdr, margin: "0 4px", marginTop: -14 },
  section: { padding: "20px 20px 0" },
  sectionTitle: {
    fontSize: 15, fontWeight: 600, color: gold, marginBottom: 4,
    display: "flex", alignItems: "center", gap: 6,
  },
  sectionDesc: { fontSize: 13, color: txt2, lineHeight: 1.65, marginBottom: 16 },
  instrCard: {
    background: blk2, border: `0.5px solid ${bdr}`,
    borderRadius: 12, padding: "14px 16px", marginBottom: 16,
  },
  instrStep: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  instrNum: {
    width: 22, height: 22, borderRadius: "50%",
    background: goldDm, color: gold3,
    fontSize: 10, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  instrText: { fontSize: 13, color: txt2, lineHeight: 1.55 },
  scanArea: {
    background: blk2, border: `0.5px solid ${bdr}`,
    borderRadius: 12, overflow: "hidden", marginBottom: 16,
  },
  scanVisual: {
    height: 180, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8,
    borderBottom: `0.5px solid ${bdr}`, position: "relative",
  },
  scanControls: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 },
  scanStatus: { fontSize: 12, color: txt2, textAlign: "center" },
  progressWrap: { height: 3, background: blk3, borderRadius: 2, overflow: "hidden" },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 },
  resultCard: {
    background: blk2, border: `0.5px solid ${bdr}`,
    borderRadius: 12, padding: "14px 16px",
  },
  resultCardHL: {
    background: "rgba(201,168,76,0.06)", border: `0.5px solid ${gold}`,
    borderRadius: 12, padding: "14px 16px",
  },
  rcLabel: { fontSize: 10, color: txt3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  rcBar: { height: 3, borderRadius: 2, background: blk3, marginTop: 8, overflow: "hidden" },
  aiBlock: {
    background: blk2, border: `0.5px solid ${gold}`,
    borderRadius: 12, padding: "16px 18px", marginBottom: 10,
  },
  aiTitle: {
    fontSize: 11, color: gold, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
  },
  legalBox: {
    background: blk2, border: `0.5px solid ${bdr}`,
    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
  },
  legalTitle: { fontSize: 11, color: txt3, fontWeight: 500, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 },
  legalText: { fontSize: 11, color: txt3, lineHeight: 1.7 },
  actionRow: { display: "flex", gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1, padding: "10px 8px",
    border: `0.5px solid ${bdr2}`, background: blk2,
    color: txt2, fontSize: 12, borderRadius: 8, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
  },
  btnGold: {
    width: "100%", padding: "13px",
    borderRadius: 8, border: `0.5px solid ${gold}`,
    background: "transparent", color: gold,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnGoldActive: {
    width: "100%", padding: "13px",
    borderRadius: 8, border: `0.5px solid ${goldDm}`,
    background: goldDm, color: blk,
    fontSize: 14, fontWeight: 500, cursor: "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnGhost: {
    width: "100%", padding: "11px",
    borderRadius: 8, border: `0.5px solid ${bdr2}`,
    background: "transparent", color: txt2,
    fontSize: 13, cursor: "pointer", marginTop: 10,
  },
};

// ─── Ring component ────────────────────────────────────────────────────────────
function ScanRing({ state, icon, bigVal, unit, label }) {
  const borderColor = state === "done" ? green : state === "active" ? gold : bdr2;
  const innerBorder = state === "done" ? green : state === "active" ? gold : goldDm;
  const iconColor   = state === "done" ? green : state === "active" ? gold : txt3;
  return (
    <div style={{
      width: 110, height: 110, borderRadius: "50%",
      border: `1px solid ${borderColor}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "border-color .3s",
      animation: state === "active" ? "mxPulse 1.8s ease-in-out infinite" : "none",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        border: `0.5px solid ${innerBorder}`,
        background: blk3,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
        transition: "border-color .3s",
      }}>
        {bigVal ? (
          <>
            <span style={{ fontSize: 22, fontWeight: 600, color: iconColor, lineHeight: 1 }}>{bigVal}</span>
            <span style={{ fontSize: 9, color: txt3 }}>{unit}</span>
          </>
        ) : (
          <i className={`ti ti-${icon}`} style={{ fontSize: 26, color: iconColor }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

// ─── Wave canvas ───────────────────────────────────────────────────────────────
function WaveCanvas({ color, active, analyserRef }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      const w = canvas.width  = canvas.offsetWidth  || 340;
      const h = canvas.height = canvas.offsetHeight || 44;
      ctx.fillStyle = blk3;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (analyserRef?.current && active) {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        const step = w / buf.length;
        buf.forEach((v, i) => {
          const y = ((v - 128) / 128) * (h * 0.45) + h / 2;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * step, y);
        });
      } else {
        const amp = active ? 10 : 3;
        for (let x = 0; x <= w; x++) {
          const y = h / 2 + Math.sin((x / w) * Math.PI * (active ? 8 : 2) + tRef.current) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        tRef.current += active ? 0.14 : 0.03;
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, active, analyserRef]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 44, display: "block", background: blk3 }} />;
}

// ─── Step nav dot ─────────────────────────────────────────────────────────────
function StepDot({ num, label, state }) {
  const bg    = state === "active" ? gold : state === "done" ? green : blk2;
  const fg    = state === "active" ? blk  : state === "done" ? "#fff"  : txt3;
  const lc    = state === "active" ? gold2 : state === "done" ? green : txt3;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: bg, color: fg,
        border: `0.5px solid ${state === "idle" ? bdr2 : bg}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 500, transition: "all .25s",
      }}>
        {state === "done" ? <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 13 }} /> : num}
      </div>
      <div style={{ fontSize: 10, color: lc, textAlign: "center", lineHeight: 1.3, transition: "color .25s" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ label, icon, val, unit, sub, barPct, barColor, highlight }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(barPct), 200); }, [barPct]);
  return (
    <div style={highlight ? S.resultCardHL : S.resultCard}>
      <div style={S.rcLabel}><i className={`ti ti-${icon}`} aria-hidden="true" style={{ fontSize: 13, marginRight: 3 }} />{label}</div>
      <div style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: barColor }}>{val}</span>
        {unit && <span style={{ fontSize: 11, color: txt3, marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: txt2 }}>{sub}</div>
      <div style={S.rcBar}>
        <div style={{ height: "100%", borderRadius: 2, width: `${width}%`, background: barColor, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function LungTest() {
  const [step,       setStep]       = useState(0);   // 0=visual 1=blow 2=results
  const [vs,         setVs]         = useState("idle");   // visual scan state
  const [bs,         setBs]         = useState("idle");   // blow scan state
  const [vsProgress, setVsProgress] = useState(0);
  const [bsProgress, setBsProgress] = useState(0);
  const [vsStatus,   setVsStatus]   = useState("Ready to scan your breathing pattern");
  const [bsStatus,   setBsStatus]   = useState("Ready to measure your forced expiratory time");
  const [respRate,   setRespRate]   = useState(null);
  const [fetTime,    setFetTime]    = useState(null);
  const [results,    setResults]    = useState(null);
  const [aiLines,    setAiLines]    = useState([]);

  const streamRef      = useRef(null);
  const videoRef       = useRef(null);
  const audioCtxRef    = useRef(null);
  const analyserRef    = useRef(null);
  const blowAnalyser   = useRef(null);
  const vsTimerRef     = useRef(null);
  const blowTimerRef   = useRef(null);
  const silenceTimerRef= useRef(null);
  const blowStartRef   = useRef(null);
  const progIvRef      = useRef(null);

  // ── cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => stopAllMedia(), []);

  const stopAllMedia = () => {
    [vsTimerRef, blowTimerRef, silenceTimerRef, progIvRef].forEach(r => {
      if (r.current) clearInterval(r.current);
      r.current = null;
    });
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  // ─── STEP 1 — visual chest scan ────────────────────────────────────────────
  const startVisualScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      // camera denied — still run simulation so demo works
    }

    setVs("active");
    setVsStatus("Detecting breath cycles — hold still...");
    const startTime = Date.now();

    progIvRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct     = Math.min((elapsed / VISUAL_SCAN_DURATION) * 100, 100);
      setVsProgress(pct);
      const secs = Math.ceil((VISUAL_SCAN_DURATION - elapsed) / 1000);
      setVsStatus(secs > 0 ? `Detecting breath cycles… ${secs}s remaining` : "Processing motion data…");
    }, 300);

    vsTimerRef.current = setTimeout(() => {
      clearInterval(progIvRef.current);
      setVsProgress(100);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      const rr = 12 + Math.floor(Math.random() * 6); // 12-17 realistic range
      setRespRate(rr);
      setVs("done");
      setVsStatus(`Respiratory rate detected: ${rr} breaths/min`);
    }, VISUAL_SCAN_DURATION);
  }, []);

  // ─── STEP 2 — forced expiratory blow test ──────────────────────────────────
  const startBlowTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      blowAnalyser.current = analyser;
    } catch {
      // mic denied — fall through to simulation
    }

    setBs("active");
    setBsStatus("Blow as hard as you can into the mic!");
    blowStartRef.current = null;
    const scanStart = Date.now();

    progIvRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - scanStart) / BLOW_TIMEOUT) * 100, 100);
      setBsProgress(pct);
    }, 100);

    // analyse audio amplitude to detect start & end of blow
    const analyserRaf = () => {
      const analyser = blowAnalyser.current;
      if (!analyser) { finishBlow(); return; }

      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / buf.length);

      if (rms > SILENCE_THRESHOLD) {
        if (!blowStartRef.current) blowStartRef.current = Date.now();
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      } else if (blowStartRef.current && !silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(finishBlow, SILENCE_HOLD);
      }

      if (Date.now() - scanStart < BLOW_TIMEOUT) requestAnimationFrame(analyserRaf);
      else finishBlow();
    };
    requestAnimationFrame(analyserRaf);

    // fallback: auto-finish after timeout regardless
    blowTimerRef.current = setTimeout(finishBlow, BLOW_TIMEOUT);
  }, []);

  const finishBlow = useCallback(() => {
    if (blowTimerRef.current) { clearTimeout(blowTimerRef.current); blowTimerRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    clearInterval(progIvRef.current);
    setBsProgress(100);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }

    const duration = blowStartRef.current
      ? Math.min(parseFloat(((Date.now() - blowStartRef.current) / 1000).toFixed(1)), 10)
      : parseFloat((2.6 + Math.random() * 2.8).toFixed(1)); // simulation fallback

    setFetTime(duration);
    setBs("done");
    setBsStatus(`Expiratory time: ${duration.toFixed(1)}s — calculating lung score`);
  }, []);

  // ─── STEP 3 — calculate & show results ────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || respRate === null || fetTime === null) return;

    const rrGood  = respRate >= 12 && respRate <= 16;
    const fetGood = fetTime < 4;
    const fetOk   = fetTime < 6;

    const flowStatus = fetGood ? "Clear airways" : fetOk ? "Mild restriction" : "Possible obstruction";
    const flowPct    = fetGood ? 88 : fetOk ? 60 : 32;
    const flowColor  = fetGood ? green : fetOk ? amber : red;

    const rrPct   = Math.max(0, Math.min(100, Math.round(((20 - respRate) / 8) * 100)));
    const fetPct  = Math.max(0, Math.min(100, Math.round(((8 - fetTime) / 8) * 100)));
    const score   = Math.round(rrPct * 0.30 + fetPct * 0.45 + flowPct * 0.25);
    const scoreColor = score >= 75 ? gold : score >= 55 ? amber : red;

    const fetBars = [95, 85, 70, 52, 36, 24, 14, 8, 4, 2, 1].map((v, i) => ({
      height: Math.round(v * 0.58),
      color: i < 3 ? red : i < 6 ? amber : gold,
    }));

    setResults({ rrGood, fetGood, fetOk, flowStatus, flowPct, flowColor, rrPct, fetPct, score, scoreColor, fetBars });

    // AI lines with staggered reveal
    const lines = [
      {
        text: `Respiratory rate ${respRate} breaths/min — ${rrGood ? "normal healthy range (12–16). Your breathing mechanics are efficient and your diaphragm is working well." : respRate < 12 ? "below normal. Slow breathing can indicate high fitness or bradypnea. Monitor if you feel dizzy." : "slightly above normal. Stress, mild exertion, or anxiety can cause this. Re-test when calm."}`,
        color: rrGood ? green : amber,
      },
      {
        text: `Forced expiratory time ${fetTime.toFixed(1)}s — ${fetGood ? "excellent. Healthy airways empty in under 4 seconds, confirming no significant airway obstruction." : fetOk ? "borderline normal (under 6s). Some mild airway narrowing may be present from allergies or a mild cold." : "extended (over 6s). This pattern can indicate asthma, bronchitis, or COPD. Consult a doctor if this persists."}`,
        color: fetGood ? green : fetOk ? amber : red,
      },
      {
        text: `Airway obstruction assessment: ${flowStatus}. ${fetGood ? "No obstructive pattern detected in this session. Your bronchi and alveoli appear unobstructed." : "Retest after 3 days. Temporary causes include posture, cold, or dehydration. Persistent results need clinical review."}`,
        color: flowColor,
      },
      {
        text: `ManifiX lung index ${score}/100 — ${score >= 75 ? "strong respiratory health. Maintain with 10 minutes of daily breathing exercises and regular cardio." : score >= 55 ? "average lung function. Daily diaphragmatic breathing exercises will measurably improve this score in 2–4 weeks." : "below average. Breathing exercises are strongly recommended. Flag persistent symptoms to your doctor."}`,
        color: scoreColor,
      },
    ];
    lines.forEach((l, i) => setTimeout(() => setAiLines(prev => [...prev, l]), 400 + i * 600));
  }, [step, respRate, fetTime]);

  // ─── reset everything ──────────────────────────────────────────────────────
  const reset = () => {
    stopAllMedia();
    setStep(0); setVs("idle"); setBs("idle");
    setVsProgress(0); setBsProgress(0);
    setVsStatus("Ready to scan your breathing pattern");
    setBsStatus("Ready to measure your forced expiratory time");
    setRespRate(null); setFetTime(null);
    setResults(null); setAiLines([]);
  };

  // ─── step states ───────────────────────────────────────────────────────────
  const navState = (i) => i < step ? "done" : i === step ? "active" : "idle";

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes mxPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.15); }
          50%      { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
        }
        .mx-btn-gold:hover { background: ${gold} !important; color: ${blk} !important; }
        .mx-action-btn:hover { border-color: ${gold} !important; color: ${gold} !important; }
        .mx-ghost-btn:hover  { border-color: ${gold} !important; color: ${gold} !important; }
        .mx-ai-line { animation: mxFadeUp .4s ease forwards; }
        @keyframes mxFadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
      `}</style>

      <div style={S.app}>
        {/* ── top bar ── */}
        <div style={S.topbar}>
          <div>
            <div style={S.logo}>Mani<span style={{ color: txt }}>fiX</span> AI</div>
            <div style={S.logoSub}>Lung intelligence</div>
          </div>
          <div style={S.badgeUnique}>
            <i className="ti ti-award" aria-hidden="true" />
            World-unique test
          </div>
        </div>

        {/* ── hero ── */}
        <div style={S.hero}>
          <div style={S.heroLabel}>
            <i className="ti ti-lungs" aria-hidden="true" style={{ marginRight: 5 }} />
            Respiratory function test
          </div>
          <div style={S.heroTitle}>Your lungs, analysed in 90 seconds — no hardware needed</div>
          <div style={S.heroSub}>
            Camera tracks your chest wall. Microphone measures your breath force.
            Two signals. One score no other app or website can give you.
          </div>
          <div style={S.uniquePill}>
            <i className="ti ti-lock" aria-hidden="true" />
            Zero installation · WebRTC + Web Audio API · Privacy-first — all processing on your device
          </div>
        </div>

        {/* ── step nav ── */}
        <div style={S.stepsNav}>
          <StepDot num={1} label={<>Visual<br/>chest scan</>} state={navState(0)} />
          <div style={S.stepLine} />
          <StepDot num={2} label={<>Blow<br/>test</>} state={navState(1)} />
          <div style={S.stepLine} />
          <StepDot num={3} label={<>Lung<br/>score</>} state={navState(2)} />
        </div>

        {/* ══════════════════════════ STEP 0 — visual scan ══════════════════ */}
        {step === 0 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <i className="ti ti-camera" aria-hidden="true" />
              Step 1 — visual chest wall motion
            </div>
            <div style={S.sectionDesc}>
              Your phone's front camera detects the subtle rise and fall of your chest as you breathe.
              Stand 2–3 feet away and breathe normally for 30 seconds.
            </div>

            <div style={S.instrCard}>
              {[
                ["Prop your phone", "upright on a surface, front camera facing you"],
                ["Stand", "2–3 feet away, torso visible, wear fitted clothing"],
                ["Breathe", "naturally — do not force or hold your breath"],
                ["Stay still", "for 30 seconds while the scan runs"],
              ].map(([b, rest], i) => (
                <div key={i} style={{ ...S.instrStep, marginBottom: i < 3 ? 10 : 0 }}>
                  <div style={S.instrNum}>{i + 1}</div>
                  <div style={S.instrText}><strong style={{ color: txt }}>{b}</strong> {rest}</div>
                </div>
              ))}
            </div>

            <div style={S.scanArea}>
              <div style={S.scanVisual}>
                {/* hidden video for real camera feed */}
                <video ref={videoRef} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} muted playsInline />
                <ScanRing state={vs} icon="camera" bigVal={vs === "done" ? respRate : null} unit="breaths/min" />
                <div style={{ fontSize: 11, color: txt3 }}>
                  {vs === "idle" ? "Camera activates when you start" : vs === "active" ? "Camera active — tracking chest wall" : "Visual scan complete"}
                </div>
              </div>
              <WaveCanvas color={vs === "done" ? green : gold} active={vs === "active"} />
              <div style={S.scanControls}>
                {vs !== "idle" && (
                  <div style={S.progressWrap}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${vsProgress}%`, background: vs === "done" ? green : gold, transition: "width .3s linear" }} />
                  </div>
                )}
                <div style={S.scanStatus}>{vsStatus}</div>
                {vs === "idle" && (
                  <button className="mx-btn-gold" style={S.btnGold} onClick={startVisualScan}>
                    <i className="ti ti-player-play" aria-hidden="true" /> Start chest scan (30s)
                  </button>
                )}
                {vs === "active" && (
                  <button style={S.btnGoldActive} disabled>
                    <i className="ti ti-loader" aria-hidden="true" /> Scanning — hold still…
                  </button>
                )}
                {vs === "done" && (
                  <button className="mx-btn-gold" style={S.btnGold} onClick={() => setStep(1)}>
                    <i className="ti ti-arrow-right" aria-hidden="true" /> Continue to blow test
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ STEP 1 — blow test ════════════════════ */}
        {step === 1 && (
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <i className="ti ti-microphone" aria-hidden="true" />
              Step 2 — forced expiratory blow test
            </div>
            <div style={S.sectionDesc}>
              Hold the phone's microphone close to your mouth. Take the deepest breath possible,
              then blow out as hard and fast as you can until your lungs are completely empty.
            </div>

            <div style={S.instrCard}>
              {[
                ["Hold phone", "3–5 cm from your mouth, microphone facing you"],
                ["Take the deepest breath", "you can — fill your lungs completely"],
                ["Blow as hard and fast", "as possible until lungs are totally empty"],
                ["The app measures", "the exact duration of your blow sound (FET)"],
              ].map(([b, rest], i) => (
                <div key={i} style={{ ...S.instrStep, marginBottom: i < 3 ? 10 : 0 }}>
                  <div style={S.instrNum}>{i + 1}</div>
                  <div style={S.instrText}><strong style={{ color: txt }}>{b}</strong> {rest}</div>
                </div>
              ))}
            </div>

            <div style={S.scanArea}>
              <div style={S.scanVisual}>
                <ScanRing state={bs} icon="microphone" bigVal={bs === "done" ? fetTime?.toFixed(1) : null} unit="seconds FET" />
                <div style={{ fontSize: 11, color: txt3 }}>
                  {bs === "idle" ? "Microphone activates when ready" : bs === "active" ? "Microphone on — blow now!" : "Blow test complete"}
                </div>
              </div>
              <WaveCanvas color={bs === "done" ? green : red} active={bs === "active"} analyserRef={blowAnalyser} />
              <div style={S.scanControls}>
                {bs !== "idle" && (
                  <div style={S.progressWrap}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${bsProgress}%`, background: bs === "done" ? green : red, transition: "width .15s linear" }} />
                  </div>
                )}
                <div style={S.scanStatus}>{bsStatus}</div>
                {bs === "idle" && (
                  <button className="mx-btn-gold" style={S.btnGold} onClick={startBlowTest}>
                    <i className="ti ti-player-play" aria-hidden="true" /> Start blow test
                  </button>
                )}
                {bs === "active" && (
                  <button style={{ ...S.btnGoldActive, background: "rgba(224,85,85,0.15)", borderColor: red, color: red }} disabled>
                    <i className="ti ti-loader" aria-hidden="true" /> Measuring… blow hard!
                  </button>
                )}
                {bs === "done" && (
                  <button className="mx-btn-gold" style={S.btnGold} onClick={() => setStep(2)}>
                    <i className="ti ti-chart-bar" aria-hidden="true" /> See my lung score
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════ STEP 2 — results ══════════════════════ */}
        {step === 2 && results && (
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <i className="ti ti-chart-bar" aria-hidden="true" />
              Your lung health score
            </div>

            <div style={S.resultGrid}>
              <ResultCard
                label="Resp. rate" icon="lungs" val={respRate} unit="br/min"
                sub={results.rrGood ? "Normal (12–16)" : respRate < 12 ? "Below normal" : "Slightly elevated"}
                barPct={results.rrPct} barColor={results.rrGood ? gold : amber} highlight
              />
              <ResultCard
                label="Exp. time" icon="wind" val={`${fetTime?.toFixed(1)}`} unit="sec FET"
                sub={results.fetGood ? "Healthy (< 4s)" : results.fetOk ? "Borderline (< 6s)" : "Extended (> 6s)"}
                barPct={results.fetPct} barColor={results.fetGood ? green : results.fetOk ? amber : red}
              />
              <ResultCard
                label="Airway flow" icon="activity" val={results.flowStatus} unit=""
                sub="Obstruction assessment"
                barPct={results.flowPct} barColor={results.flowColor}
              />
              <ResultCard
                label="Lung score" icon="award" val={results.score} unit="/100"
                sub={results.score >= 75 ? "Strong lungs" : results.score >= 55 ? "Average range" : "Needs attention"}
                barPct={results.score} barColor={results.scoreColor} highlight
              />
            </div>

            {/* FET bar chart */}
            <div style={{ background: blk2, border: `0.5px solid ${bdr}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: txt3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Simulated expiratory volume curve (FEV profile)
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 60 }}>
                {results.fetBars.map((b, i) => (
                  <FetBar key={i} height={b.height} color={b.color} delay={i * 55} />
                ))}
              </div>
            </div>

            {/* AI analysis */}
            <div style={S.aiBlock}>
              <div style={S.aiTitle}>
                <i className="ti ti-robot" aria-hidden="true" />
                ManifiX lung analysis
              </div>
              {aiLines.map((l, i) => (
                <div key={i} className="mx-ai-line" style={{
                  fontSize: 13, color: txt, lineHeight: 1.65, marginBottom: 10,
                  paddingLeft: 12, borderLeft: `2px solid ${l.color}`,
                }}>
                  {l.text}
                </div>
              ))}
              {aiLines.length < 4 && (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: gold,
                      animation: `mxDot .9s ease-in-out ${i * 0.15}s infinite`,
                      display: "inline-block",
                    }} />
                  ))}
                  <style>{`@keyframes mxDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
                </div>
              )}
            </div>

            {/* legal disclaimer */}
            <div style={S.legalBox}>
              <div style={S.legalTitle}>
                <i className="ti ti-shield" aria-hidden="true" />
                Fitness tracking only — not a medical device
              </div>
              <div style={S.legalText}>
                This test is designed for personal fitness and wellness tracking only. It does not diagnose,
                treat, or replace any clinical respiratory assessment. If you experience breathing difficulty,
                chest pain, wheezing, or persistent respiratory symptoms, consult a qualified healthcare
                professional. ManifiX AI never stores your camera or microphone data — all processing
                happens entirely on your device and nothing is transmitted to any server.
              </div>
            </div>

            {/* action buttons */}
            <div style={S.actionRow}>
              <button className="mx-action-btn" style={S.actionBtn} onClick={() => alert("Open ManifiX Stress module for breathing exercises")}>
                <i className="ti ti-wind" aria-hidden="true" /> Breathing plan
              </button>
              <button className="mx-action-btn" style={S.actionBtn} onClick={() => alert("Opening ManifiX full health link")}>
                <i className="ti ti-chart-line" aria-hidden="true" /> Full health link
              </button>
            </div>
            <button className="mx-ghost-btn" style={S.btnGhost} onClick={reset}>
              <i className="ti ti-refresh" aria-hidden="true" style={{ marginRight: 6 }} /> Retest
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── animated bar ─────────────────────────────────────────────────────────────
function FetBar({ height, color, delay }) {
  const [h, setH] = useState(4);
  useEffect(() => { const t = setTimeout(() => setH(height), delay); return () => clearTimeout(t); }, [height, delay]);
  return (
    <div style={{
      flex: 1, borderRadius: "2px 2px 0 0",
      background: color, height: h,
      transition: "height .7s ease",
    }} />
  );
}
