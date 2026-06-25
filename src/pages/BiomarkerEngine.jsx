import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0C040";
const GOLD_DIM = "#7A5C1E";
const BLACK = "#0A0A0A";
const SURFACE = "#111111";
const SURFACE2 = "#1A1A1A";
const BORDER = "#2A2A2A";
const RED_ALERT = "#FF3B3B";
const AMBER = "#FFB020";
const GREEN_OK = "#22C55E";
const TEXT_PRIMARY = "#F5F0E8";
const TEXT_MUTED = "#6B6457";

const HRV_PANIC_THRESHOLD = 28; // ms RMSSD below this = pre-panic
const GLUCOSE_HIGH = 180;
const GLUCOSE_LOW = 70;

// ─── SIMULATED DATA GENERATORS ───────────────────────────────────────────────
function generateGlucoseSeries(points = 48) {
  const base = 105;
  const series = [];
  let val = base;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    val += (Math.random() - 0.48) * 6;
    val = Math.max(60, Math.min(220, val));
    series.push({
      time: new Date(now - i * 15 * 60000),
      value: Math.round(val * 10) / 10,
    });
  }
  return series;
}

function generateHRVSeries(points = 60) {
  const series = [];
  let val = 55;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    val += (Math.random() - 0.5) * 4;
    val = Math.max(18, Math.min(90, val));
    series.push({
      time: new Date(now - i * 60000),
      value: Math.round(val * 10) / 10,
    });
  }
  return series;
}

function predictCortisol(hrv, glucose, hour) {
  const circadian = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 0.3 + 0.5;
  const stressSignal = Math.max(0, (HRV_PANIC_THRESHOLD * 2 - hrv) / (HRV_PANIC_THRESHOLD * 2));
  const glucoseSignal = glucose > GLUCOSE_HIGH ? 0.2 : glucose < GLUCOSE_LOW ? 0.15 : 0;
  const raw = (circadian * 0.5 + stressSignal * 0.35 + glucoseSignal * 0.15) * 28 + 2;
  return Math.round(Math.min(35, Math.max(2, raw)) * 10) / 10;
}

// ─── SPARK LINE RENDERER ─────────────────────────────────────────────────────
function SparkLine({ data, color, height = 60, width = 300, thresholdLow, thresholdHigh, unit }) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = 8;
  const W = width - pad * 2;
  const H = height - pad * 2;

  const toX = (i) => pad + (i / (data.length - 1)) * W;
  const toY = (v) => pad + H - ((v - min) / range) * H;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
  const areaPoints = [
    `${toX(0)},${pad + H}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.value)}`),
    `${toX(data.length - 1)},${pad + H}`,
  ].join(" ");

  const lastVal = vals[vals.length - 1];
  const alertColor =
    thresholdLow && lastVal < thresholdLow
      ? RED_ALERT
      : thresholdHigh && lastVal > thresholdHigh
      ? AMBER
      : color;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={alertColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={alertColor} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {thresholdHigh && (
        <line
          x1={pad}
          y1={toY(thresholdHigh)}
          x2={pad + W}
          y2={toY(thresholdHigh)}
          stroke={AMBER}
          strokeWidth="0.8"
          strokeDasharray="4,3"
          opacity="0.5"
        />
      )}
      {thresholdLow && (
        <line
          x1={pad}
          y1={toY(thresholdLow)}
          x2={pad + W}
          y2={toY(thresholdLow)}
          stroke={RED_ALERT}
          strokeWidth="0.8"
          strokeDasharray="4,3"
          opacity="0.5"
        />
      )}
      <polygon points={areaPoints} fill={`url(#grad-${alertColor.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={alertColor} strokeWidth="1.5" strokeLinejoin="round" />
      {/* last point dot */}
      <circle cx={toX(data.length - 1)} cy={toY(lastVal)} r="3" fill={alertColor} />
      <text x={toX(data.length - 1) - 4} y={toY(lastVal) - 6} fill={alertColor} fontSize="9" textAnchor="middle">
        {lastVal}
        {unit}
      </text>
    </svg>
  );
}

// ─── CORTISOL GAUGE ──────────────────────────────────────────────────────────
function CortisolGauge({ value }) {
  const pct = Math.min(1, value / 35);
  const angle = -140 + pct * 280;
  const r = 54;
  const cx = 70;
  const cy = 70;

  const arc = (startDeg, endDeg, color) => {
    const toRad = (d) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    );
  };

  const label = value < 10 ? "Low" : value < 20 ? "Normal" : value < 28 ? "Elevated" : "High";
  const labelColor = value < 10 ? GOLD : value < 20 ? GREEN_OK : value < 28 ? AMBER : RED_ALERT;

  return (
    <svg viewBox="0 0 140 100" style={{ width: 140, height: 100 }}>
      {arc(-140, -140 + 280 * 0.28, GOLD_DIM)}
      {arc(-140 + 280 * 0.28, -140 + 280 * 0.57, GOLD)}
      {arc(-140 + 280 * 0.57, -140 + 280 * 0.8, AMBER)}
      {arc(-140 + 280 * 0.8, 140, RED_ALERT)}
      {/* needle */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (r - 10) * Math.cos(((angle - 90) * Math.PI) / 180)}
        y2={cy + (r - 10) * Math.sin(((angle - 90) * Math.PI) / 180)}
        stroke={GOLD_BRIGHT}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill={GOLD_BRIGHT} />
      <text x={cx} y={cy + 22} textAnchor="middle" fill={TEXT_PRIMARY} fontSize="14" fontWeight="700">
        {value}
      </text>
      <text x={cx} y={cy + 33} textAnchor="middle" fill={TEXT_MUTED} fontSize="7">
        µg/dL
      </text>
      <text x={cx} y={cy - 28} textAnchor="middle" fill={labelColor} fontSize="8" fontWeight="600">
        {label}
      </text>
    </svg>
  );
}

// ─── SWEAT BIOMARKER PANEL ───────────────────────────────────────────────────
const SWEAT_MARKERS = [
  { key: "sodium", label: "Na⁺", unit: "mEq/L", min: 20, max: 100, alert: [null, 90], base: 55 },
  { key: "potassium", label: "K⁺", unit: "mEq/L", min: 1, max: 10, alert: [null, 8], base: 4.5 },
  { key: "lactate", label: "Lactate", unit: "mmol/L", min: 0.5, max: 8, alert: [null, 6], base: 2.1 },
  { key: "ph", label: "pH", unit: "", min: 4.5, max: 7.5, alert: [4.8, 7.2], base: 6.2 },
  { key: "urea", label: "Urea", unit: "mM", min: 1, max: 40, alert: [null, 30], base: 10 },
];

function useSweatSimulation() {
  const [values, setValues] = useState(() =>
    Object.fromEntries(SWEAT_MARKERS.map((m) => [m.key, m.base]))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setValues((prev) =>
        Object.fromEntries(
          SWEAT_MARKERS.map((m) => {
            const jitter = (Math.random() - 0.5) * (m.max - m.min) * 0.04;
            const next = Math.max(m.min, Math.min(m.max, prev[m.key] + jitter));
            return [m.key, Math.round(next * 100) / 100];
          })
        )
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return values;
}

// ─── ANOMALY DETECTION ───────────────────────────────────────────────────────
function detectAnomalies({ glucoseLatest, hrvLatest, cortisolVal, sweat }) {
  const alerts = [];
  if (glucoseLatest > GLUCOSE_HIGH) alerts.push({ id: "glc-hi", severity: "warn", msg: `Glucose elevated — ${glucoseLatest} mg/dL (limit 180)` });
  if (glucoseLatest < GLUCOSE_LOW) alerts.push({ id: "glc-lo", severity: "critical", msg: `Hypoglycemia detected — ${glucoseLatest} mg/dL` });
  if (hrvLatest < HRV_PANIC_THRESHOLD) alerts.push({ id: "hrv-panic", severity: "critical", msg: `HRV below panic threshold — ${hrvLatest} ms (threshold ${HRV_PANIC_THRESHOLD})` });
  if (cortisolVal > 28) alerts.push({ id: "cort-hi", severity: "warn", msg: `Cortisol elevated — ${cortisolVal} µg/dL` });
  if (sweat.sodium > 90) alerts.push({ id: "na-hi", severity: "warn", msg: `Sweat sodium high — ${sweat.sodium} mEq/L` });
  if (sweat.lactate > 6) alerts.push({ id: "lac-hi", severity: "critical", msg: `Lactate threshold exceeded — ${sweat.lactate} mmol/L` });
  return alerts;
}

// ─── WEB BLUETOOTH HOOK ──────────────────────────────────────────────────────
function useBluetoothDevice() {
  const [device, setDevice] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | connected | error | unsupported

  useEffect(() => {
    if (!navigator.bluetooth) setStatus("unsupported");
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) return setStatus("unsupported");
    setStatus("scanning");
    try {
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "heart_rate",
          "glucose",
          "0x180d",
          "0x1808",
          "00001523-1212-efde-1523-785feabcd123",
        ],
      });
      setDevice(dev);
      setStatus("connected");
      dev.addEventListener("gattserverdisconnected", () => {
        setDevice(null);
        setStatus("idle");
      });
    } catch (e) {
      if (e.name !== "NotFoundError") setStatus("error");
      else setStatus("idle");
    }
  }, []);

  const disconnect = useCallback(() => {
    device?.gatt?.disconnect();
    setDevice(null);
    setStatus("idle");
  }, [device]);

  return { device, status, connect, disconnect };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function BiomarkerEngine() {
  const { device, status, connect, disconnect } = useBluetoothDevice();
  const [glucoseSeries, setGlucoseSeries] = useState(() => generateGlucoseSeries(48));
  const [hrvSeries, setHRVSeries] = useState(() => generateHRVSeries(60));
  const sweat = useSweatSimulation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const tickRef = useRef(0);

  // live simulation tick
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current++;
      setGlucoseSeries((prev) => {
        const last = prev[prev.length - 1].value;
        const next = Math.max(60, Math.min(220, last + (Math.random() - 0.48) * 5));
        return [...prev.slice(-47), { time: new Date(), value: Math.round(next * 10) / 10 }];
      });
      setHRVSeries((prev) => {
        const last = prev[prev.length - 1].value;
        const next = Math.max(18, Math.min(90, last + (Math.random() - 0.5) * 3));
        return [...prev.slice(-59), { time: new Date(), value: Math.round(next * 10) / 10 }];
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const glucoseLatest = glucoseSeries[glucoseSeries.length - 1].value;
  const hrvLatest = hrvSeries[hrvSeries.length - 1].value;
  const hour = new Date().getHours();
  const cortisolVal = predictCortisol(hrvLatest, glucoseLatest, hour);
  const anomalies = detectAnomalies({ glucoseLatest, hrvLatest, cortisolVal, sweat });

  const btColor =
    status === "connected"
      ? GREEN_OK
      : status === "scanning"
      ? GOLD
      : status === "error"
      ? RED_ALERT
      : TEXT_MUTED;

  const btLabel =
    status === "connected"
      ? `● ${device?.name || "Device"}`
      : status === "scanning"
      ? "Scanning…"
      : status === "unsupported"
      ? "BT Unsupported"
      : "Pair Wearable";

  return (
    <div style={styles.root}>
      {/* ── TOP BAR ── */}
      <header style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <span style={styles.logo}>ManifiX</span>
          <span style={styles.logoSub}>BiomarkerEngine</span>
        </div>
        <div style={styles.topBarRight}>
          {anomalies.length > 0 && (
            <div style={styles.alertBadge}>
              <span style={{ color: RED_ALERT, fontSize: 12, fontWeight: 700 }}>
                ⚠ {anomalies.length} Alert{anomalies.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <button
            onClick={status === "connected" ? disconnect : connect}
            style={{ ...styles.btBtn, borderColor: btColor, color: btColor }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={btColor} strokeWidth="2">
              <path d="M6.5 6.5l11 11M17.5 6.5L12 12l5.5 5.5M6.5 17.5l5.5-5.5" />
            </svg>
            {btLabel}
          </button>
        </div>
      </header>

      {/* ── TABS ── */}
      <nav style={styles.tabs}>
        {["dashboard", "glucose", "hrv", "sweat", "alerts"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "alerts" && anomalies.length > 0 && (
              <span style={styles.alertDot}>{anomalies.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {/* ══ DASHBOARD ══ */}
        {activeTab === "dashboard" && (
          <div>
            <div style={styles.grid4}>
              <StatCard
                label="Blood Glucose"
                value={glucoseLatest}
                unit="mg/dL"
                status={glucoseLatest > GLUCOSE_HIGH ? "warn" : glucoseLatest < GLUCOSE_LOW ? "critical" : "ok"}
                sub={glucoseLatest > GLUCOSE_HIGH ? "↑ Hyperglycemia risk" : glucoseLatest < GLUCOSE_LOW ? "↓ Hypoglycemia" : "In range"}
              />
              <StatCard
                label="HRV (RMSSD)"
                value={hrvLatest}
                unit="ms"
                status={hrvLatest < HRV_PANIC_THRESHOLD ? "critical" : hrvLatest < 40 ? "warn" : "ok"}
                sub={hrvLatest < HRV_PANIC_THRESHOLD ? "Pre-panic alert" : "Autonomic balance"}
              />
              <StatCard
                label="Cortisol (pred.)"
                value={cortisolVal}
                unit="µg/dL"
                status={cortisolVal > 28 ? "warn" : "ok"}
                sub="Model-estimated"
              />
              <StatCard
                label="Sweat Na⁺"
                value={sweat.sodium}
                unit="mEq/L"
                status={sweat.sodium > 90 ? "warn" : "ok"}
                sub="Live simulation"
              />
            </div>

            {/* HRV pre-panic banner */}
            {hrvLatest < HRV_PANIC_THRESHOLD && (
              <div style={styles.panicBanner}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Pre-Panic State Detected</div>
                  <div style={{ fontSize: 12, color: "#FFB0B0" }}>
                    HRV {hrvLatest} ms — below threshold of {HRV_PANIC_THRESHOLD} ms. Autonomic stress response active.
                  </div>
                </div>
              </div>
            )}

            <div style={styles.row2}>
              <div style={styles.card}>
                <CardTitle>Glucose Trend (12h)</CardTitle>
                <SparkLine
                  data={glucoseSeries}
                  color={GOLD}
                  height={80}
                  width={400}
                  thresholdHigh={GLUCOSE_HIGH}
                  thresholdLow={GLUCOSE_LOW}
                  unit=""
                />
              </div>
              <div style={styles.card}>
                <CardTitle>Cortisol Prediction</CardTitle>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
                  <CortisolGauge value={cortisolVal} />
                </div>
                <p style={styles.cardNote}>
                  Derived from HRV ({hrvLatest} ms), glucose ({glucoseLatest} mg/dL) and circadian phase ({hour}:00).
                </p>
              </div>
            </div>

            <div style={styles.card}>
              <CardTitle>HRV (Last 60 min)</CardTitle>
              <SparkLine data={hrvSeries} color="#7B68EE" height={70} width={600} thresholdLow={HRV_PANIC_THRESHOLD} unit="ms" />
            </div>

            {anomalies.length > 0 && (
              <div style={styles.card}>
                <CardTitle>Active Alerts</CardTitle>
                {anomalies.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ GLUCOSE ══ */}
        {activeTab === "glucose" && (
          <div>
            <div style={styles.card}>
              <CardTitle>Continuous Glucose Monitor — 12h Trend</CardTitle>
              <div style={styles.glucoseStats}>
                <MiniStat label="Current" value={`${glucoseLatest} mg/dL`} color={glucoseLatest > GLUCOSE_HIGH ? AMBER : glucoseLatest < GLUCOSE_LOW ? RED_ALERT : GREEN_OK} />
                <MiniStat label="Average" value={`${Math.round(glucoseSeries.reduce((s, d) => s + d.value, 0) / glucoseSeries.length)} mg/dL`} color={GOLD} />
                <MiniStat
                  label="Time in Range"
                  value={`${Math.round((glucoseSeries.filter((d) => d.value >= GLUCOSE_LOW && d.value <= GLUCOSE_HIGH).length / glucoseSeries.length) * 100)}%`}
                  color={GREEN_OK}
                />
                <MiniStat label="Peak" value={`${Math.round(Math.max(...glucoseSeries.map((d) => d.value)))} mg/dL`} color={AMBER} />
              </div>
              <SparkLine
                data={glucoseSeries}
                color={GOLD}
                height={120}
                width={600}
                thresholdHigh={GLUCOSE_HIGH}
                thresholdLow={GLUCOSE_LOW}
                unit=" mg/dL"
              />
              <div style={styles.thresholdLegend}>
                <span style={{ color: AMBER }}>━ 180 mg/dL High</span>
                <span style={{ color: RED_ALERT }}>━ 70 mg/dL Low</span>
              </div>
            </div>

            <div style={styles.card}>
              <CardTitle>Glucose Distribution</CardTitle>
              <GlucoseHistogram data={glucoseSeries} />
            </div>

            <div style={styles.card}>
              <CardTitle>CGM Data Table (Last 12 readings)</CardTitle>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>mg/dL</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {glucoseSeries
                    .slice(-12)
                    .reverse()
                    .map((d, i, arr) => {
                      const prev = arr[i + 1];
                      const delta = prev ? d.value - prev.value : null;
                      const st = d.value > GLUCOSE_HIGH ? "High" : d.value < GLUCOSE_LOW ? "Low" : "Normal";
                      const stColor = d.value > GLUCOSE_HIGH ? AMBER : d.value < GLUCOSE_LOW ? RED_ALERT : GREEN_OK;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={styles.td}>{d.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td style={{ ...styles.td, color: stColor, fontWeight: 600 }}>{d.value}</td>
                          <td style={{ ...styles.td, color: stColor }}>{st}</td>
                          <td style={{ ...styles.td, color: delta > 0 ? AMBER : delta < 0 ? "#7B68EE" : TEXT_MUTED }}>
                            {delta !== null ? `${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ HRV ══ */}
        {activeTab === "hrv" && (
          <div>
            {hrvLatest < HRV_PANIC_THRESHOLD && (
              <div style={styles.panicBanner}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Pre-Panic Alert Active</div>
                  <div style={{ fontSize: 12, color: "#FFB0B0" }}>
                    RMSSD {hrvLatest} ms — autonomic stress threshold crossed. Consider breathing exercise or rest.
                  </div>
                </div>
              </div>
            )}

            <div style={styles.grid4}>
              <StatCard label="RMSSD" value={hrvLatest} unit="ms" status={hrvLatest < HRV_PANIC_THRESHOLD ? "critical" : hrvLatest < 40 ? "warn" : "ok"} sub="Root mean square successive diff" />
              <StatCard label="Panic Threshold" value={HRV_PANIC_THRESHOLD} unit="ms" status="neutral" sub="Pre-panic trigger level" />
              <StatCard
                label="Baseline Avg"
                value={Math.round(hrvSeries.reduce((s, d) => s + d.value, 0) / hrvSeries.length * 10) / 10}
                unit="ms"
                status="ok"
                sub="Session average"
              />
              <StatCard
                label="Min (1h)"
                value={Math.round(Math.min(...hrvSeries.map((d) => d.value)) * 10) / 10}
                unit="ms"
                status="neutral"
                sub="Lowest reading"
              />
            </div>

            <div style={styles.card}>
              <CardTitle>HRV Time Series (60 min)</CardTitle>
              <SparkLine data={hrvSeries} color="#7B68EE" height={120} width={600} thresholdLow={HRV_PANIC_THRESHOLD} unit="ms" />
              <p style={styles.cardNote}>
                Dashed red line = pre-panic threshold ({HRV_PANIC_THRESHOLD} ms RMSSD). Readings below trigger real-time alert.
              </p>
            </div>

            <div style={styles.card}>
              <CardTitle>HRV Zone Breakdown</CardTitle>
              <HRVZoneBar series={hrvSeries} />
            </div>
          </div>
        )}

        {/* ══ SWEAT BIOMARKERS ══ */}
        {activeTab === "sweat" && (
          <div>
            <div style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <CardTitle noMargin>Sweat Biomarker Panel</CardTitle>
                <span style={{ fontSize: 11, color: GOLD, background: "#1A1400", padding: "2px 8px", borderRadius: 4, border: `1px solid ${GOLD_DIM}` }}>
                  ⟳ Live Simulation · Ready for Biosensor API
                </span>
              </div>
              <p style={{ ...styles.cardNote, marginBottom: 16 }}>
                Simulates electrochemical biosensor output. Replace <code style={{ color: GOLD }}>useSweatSimulation()</code> with real wearable patch API (e.g. Eccrine Systems, EnLiSense) for production deployment.
              </p>
              <div style={styles.sweatGrid}>
                {SWEAT_MARKERS.map((m) => {
                  const val = sweat[m.key];
                  const pct = (val - m.min) / (m.max - m.min);
                  const alertHi = m.alert[1] && val > m.alert[1];
                  const alertLo = m.alert[0] && val < m.alert[0];
                  const barColor = alertHi ? AMBER : alertLo ? RED_ALERT : GOLD;
                  return (
                    <div key={m.key} style={styles.sweatCard}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: TEXT_MUTED, fontFamily: "monospace" }}>{m.label}</span>
                        {(alertHi || alertLo) && <span style={{ fontSize: 10, color: RED_ALERT }}>⚠ Alert</span>}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: barColor, letterSpacing: -1 }}>
                        {val}
                        <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400, marginLeft: 4 }}>{m.unit}</span>
                      </div>
                      <div style={styles.sweatBar}>
                        <div style={{ ...styles.sweatBarFill, width: `${pct * 100}%`, background: barColor }} />
                        {m.alert[1] && (
                          <div style={{ ...styles.sweatThreshold, left: `${((m.alert[1] - m.min) / (m.max - m.min)) * 100}%` }} />
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT_MUTED, marginTop: 2 }}>
                        <span>{m.min}</span>
                        <span>{m.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ ALERTS ══ */}
        {activeTab === "alerts" && (
          <div>
            <div style={styles.card}>
              <CardTitle>Real-Time Anomaly Detection</CardTitle>
              <p style={styles.cardNote}>
                Multi-biomarker anomaly engine running Z-score and threshold-crossing detection across all channels simultaneously.
              </p>
              {anomalies.length === 0 ? (
                <div style={styles.allClear}>
                  <span style={{ fontSize: 32 }}>✓</span>
                  <span style={{ color: GREEN_OK, fontWeight: 600 }}>All biomarkers within normal range</span>
                </div>
              ) : (
                anomalies.map((a) => <AlertRow key={a.id} alert={a} expanded />)
              )}
            </div>

            <div style={styles.card}>
              <CardTitle>Detection Rules</CardTitle>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Biomarker</th>
                    <th style={styles.th}>Condition</th>
                    <th style={styles.th}>Threshold</th>
                    <th style={styles.th}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Glucose", ">", "180 mg/dL", "Warning"],
                    ["Glucose", "<", "70 mg/dL", "Critical"],
                    ["HRV RMSSD", "<", "28 ms", "Critical"],
                    ["Cortisol", ">", "28 µg/dL", "Warning"],
                    ["Sweat Na⁺", ">", "90 mEq/L", "Warning"],
                    ["Sweat Lactate", ">", "6 mmol/L", "Critical"],
                  ].map(([bio, op, thresh, sev], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ ...styles.td, color: GOLD }}>{bio}</td>
                      <td style={styles.td}>{op}</td>
                      <td style={{ ...styles.td, fontFamily: "monospace" }}>{thresh}</td>
                      <td style={{ ...styles.td, color: sev === "Critical" ? RED_ALERT : AMBER }}>{sev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function StatCard({ label, value, unit, status, sub }) {
  const color =
    status === "critical" ? RED_ALERT : status === "warn" ? AMBER : status === "ok" ? GREEN_OK : TEXT_MUTED;
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: -1 }}>
        {value}
        <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 400, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>
      <div style={{ marginTop: 8, height: 2, background: BORDER, borderRadius: 1 }}>
        <div style={{ height: 2, width: "100%", background: color, borderRadius: 1, opacity: 0.4 }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function CardTitle({ children, noMargin }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: noMargin ? 0 : 12 }}>
      {children}
    </div>
  );
}

function AlertRow({ alert, expanded }) {
  const color = alert.severity === "critical" ? RED_ALERT : AMBER;
  return (
    <div style={{ ...styles.alertRow, borderColor: color }}>
      <span style={{ color, fontSize: 14 }}>{alert.severity === "critical" ? "🔴" : "🟡"}</span>
      <div>
        <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{alert.msg}</div>
        {expanded && (
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
            Detected at {new Date().toLocaleTimeString()} · Anomaly engine
          </div>
        )}
      </div>
    </div>
  );
}

function GlucoseHistogram({ data }) {
  const bins = [
    { label: "<70 Low", min: 0, max: 70, color: RED_ALERT },
    { label: "70–100", min: 70, max: 100, color: GREEN_OK },
    { label: "100–140", min: 100, max: 140, color: GOLD },
    { label: "140–180", min: 140, max: 180, color: AMBER },
    { label: ">180 High", min: 180, max: 999, color: "#FF6B00" },
  ];
  const total = data.length;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80, padding: "0 8px" }}>
      {bins.map((b) => {
        const count = data.filter((d) => d.value >= b.min && d.value < b.max).length;
        const pct = count / total;
        return (
          <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: b.color }}>{Math.round(pct * 100)}%</span>
            <div style={{ width: "100%", height: Math.max(4, pct * 64), background: b.color, borderRadius: "2px 2px 0 0", opacity: 0.85 }} />
            <span style={{ fontSize: 9, color: TEXT_MUTED, textAlign: "center" }}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HRVZoneBar({ series }) {
  const zones = [
    { label: "Panic Zone", max: HRV_PANIC_THRESHOLD, color: RED_ALERT },
    { label: "Stress Zone", max: 40, color: AMBER },
    { label: "Normal", max: 60, color: GREEN_OK },
    { label: "Optimal", max: 999, color: GOLD_BRIGHT },
  ];
  const total = series.length;
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {zones.map((z, i) => {
        const min = i === 0 ? 0 : zones[i - 1].max;
        const count = series.filter((d) => d.value >= min && d.value < z.max).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 40, height: 8, background: z.color, borderRadius: 4 }} />
            <span style={{ fontSize: 12, color: TEXT_PRIMARY }}>{z.label}</span>
            <span style={{ fontSize: 12, color: z.color, fontWeight: 700 }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    background: BLACK,
    minHeight: "100vh",
    color: TEXT_PRIMARY,
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    borderBottom: `1px solid ${BORDER}`,
    background: SURFACE,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topBarLeft: { display: "flex", alignItems: "baseline", gap: 8 },
  logo: { fontSize: 16, fontWeight: 800, color: GOLD, letterSpacing: -0.5 },
  logoSub: { fontSize: 11, color: TEXT_MUTED, letterSpacing: 1 },
  topBarRight: { display: "flex", alignItems: "center", gap: 12 },
  alertBadge: {
    background: "#1A0808",
    border: `1px solid ${RED_ALERT}`,
    borderRadius: 6,
    padding: "3px 10px",
  },
  btBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid",
    borderRadius: 6,
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  },
  tabs: {
    display: "flex",
    gap: 0,
    borderBottom: `1px solid ${BORDER}`,
    background: SURFACE,
    padding: "0 24px",
    overflowX: "auto",
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: TEXT_MUTED,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "12px 16px",
    position: "relative",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  tabActive: { color: GOLD, borderBottomColor: GOLD },
  alertDot: {
    background: RED_ALERT,
    color: "#fff",
    borderRadius: 10,
    fontSize: 10,
    padding: "0 5px",
    fontWeight: 700,
  },
  main: { padding: 24, maxWidth: 900, margin: "0 auto" },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    background: SURFACE2,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 16,
  },
  card: {
    background: SURFACE2,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  cardNote: { fontSize: 11, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  panicBanner: {
    background: "#1A0505",
    border: `1px solid ${RED_ALERT}`,
    borderRadius: 10,
    padding: "14px 20px",
    marginBottom: 16,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    color: "#FFD0D0",
  },
  thresholdLegend: { display: "flex", gap: 16, fontSize: 11, marginTop: 6 },
  glucoseStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 16,
    padding: "12px 0",
    borderBottom: `1px solid ${BORDER}`,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 11,
    color: TEXT_MUTED,
    padding: "8px 12px",
    borderBottom: `1px solid ${BORDER}`,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: { padding: "8px 12px", fontSize: 13, color: TEXT_PRIMARY },
  alertRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 14px",
    borderLeft: "3px solid",
    borderRadius: 6,
    background: "#130E0E",
    marginBottom: 8,
  },
  allClear: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 32,
    color: GREEN_OK,
  },
  sweatGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 },
  sweatCard: {
    background: "#0D0D0D",
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: 14,
  },
  sweatBar: { height: 4, background: BORDER, borderRadius: 2, marginTop: 8, position: "relative", overflow: "hidden" },
  sweatBarFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  sweatThreshold: { position: "absolute", top: 0, bottom: 0, width: 1, background: AMBER, opacity: 0.7 },
};
