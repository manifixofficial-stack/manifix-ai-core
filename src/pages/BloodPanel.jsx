import React, { useState, useEffect, useMemo } from 'react';
import { CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================================
   MANIFIX DESIGN TOKENS — black + gold, Bebas Neue / DM Mono
   ============================================================ */
const GOLD = '#ffc83c';
const GOLD_DIM = '#c8a84b';
const BG = '#080808';
const PANEL_BG = '#0e0e0e';
const BORDER = '#1f1c14';
const DANGER = '#ff5d5d';
const SAFE = '#3ddc8a';
const MUTED = '#7a7a7a';
const FONT_HEAD = "'Bebas Neue', sans-serif";
const FONT_BODY = "'DM Mono', monospace";

const STORAGE_KEYS = {
  records: 'manifix_bloodpanel_records',
  patient: 'manifix_bloodpanel_patient',
  units: 'manifix_bloodpanel_units',
  handoffLog: 'manifix_bloodpanel_handoff_log',
};

/* ============================================================
   CLINICAL REFERENCE RANGES
   siFactor converts the stored conventional (US) value to SI.
   ============================================================ */
const REFERENCE_RANGES = {
  CBC: {
    'WBC (10^3/µL)': { min: 4.5, max: 11.0, unit: '10^3/µL' },
    'RBC (10^6/µL)': { min: 4.5, max: 5.5, unit: '10^6/µL' },
    'Hemoglobin (g/dL)': { min: 12.0, max: 17.5, unit: 'g/dL', siFactor: 10, siUnit: 'g/L' },
    'Hematocrit (%)': { min: 36, max: 54, unit: '%' },
    'Platelets (10^3/µL)': { min: 150, max: 400, unit: '10^3/µL' },
    'MCV (fL)': { min: 80, max: 100, unit: 'fL' },
  },
  Metabolic: {
    'Glucose (mg/dL)': { min: 70, max: 100, unit: 'mg/dL', siFactor: 0.0555, siUnit: 'mmol/L' },
    'BUN (mg/dL)': { min: 7, max: 20, unit: 'mg/dL', siFactor: 0.357, siUnit: 'mmol/L' },
    'Creatinine (mg/dL)': { min: 0.6, max: 1.2, unit: 'mg/dL', siFactor: 88.4, siUnit: 'µmol/L' },
    'Sodium (mEq/L)': { min: 136, max: 145, unit: 'mEq/L', siFactor: 1, siUnit: 'mmol/L' },
    'Potassium (mEq/L)': { min: 3.5, max: 5.0, unit: 'mEq/L', siFactor: 1, siUnit: 'mmol/L' },
    'Calcium (mg/dL)': { min: 8.5, max: 10.5, unit: 'mg/dL', siFactor: 0.25, siUnit: 'mmol/L' },
    'ALT (U/L)': { min: 7, max: 56, unit: 'U/L' },
    'AST (U/L)': { min: 10, max: 40, unit: 'U/L' },
  },
  Lipid: {
    'Total Cholesterol (mg/dL)': { min: 0, max: 200, unit: 'mg/dL', siFactor: 0.0259, siUnit: 'mmol/L' },
    'LDL (mg/dL)': { min: 0, max: 100, unit: 'mg/dL', siFactor: 0.0259, siUnit: 'mmol/L' },
    'HDL (mg/dL)': { min: 40, max: 999, unit: 'mg/dL', siFactor: 0.0259, siUnit: 'mmol/L', lowerIsWorse: true },
    'Triglycerides (mg/dL)': { min: 0, max: 150, unit: 'mg/dL', siFactor: 0.0113, siUnit: 'mmol/L' },
  },
  Hormone: {
    'TSH (mIU/L)': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'Free T4 (ng/dL)': { min: 0.8, max: 1.8, unit: 'ng/dL', siFactor: 12.87, siUnit: 'pmol/L' },
    'Testosterone (ng/dL)': { min: 270, max: 1070, unit: 'ng/dL', siFactor: 0.0347, siUnit: 'nmol/L' },
    'Estradiol (pg/mL)': { min: 30, max: 400, unit: 'pg/mL', siFactor: 3.671, siUnit: 'pmol/L' },
    'Progesterone (ng/mL)': { min: 0.2, max: 1.5, unit: 'ng/mL', siFactor: 3.18, siUnit: 'nmol/L' },
    'Cortisol (µg/dL)': { min: 6, max: 23, unit: 'µg/dL', siFactor: 27.59, siUnit: 'nmol/L' },
    'Vitamin D (ng/mL)': { min: 30, max: 100, unit: 'ng/mL', siFactor: 2.496, siUnit: 'nmol/L' },
    'Ferritin (ng/mL)': { min: 20, max: 250, unit: 'ng/mL' },
  },
};

const PANEL_COLORS = {
  CBC: '#ffc83c',
  Metabolic: '#e0ad34',
  Lipid: '#c8a84b',
  Hormone: '#a9842c',
};

// Which findings matter to which downstream ManifiX module
const INTEGRATION_RELEVANCE = {
  NutritionHealth: ['Glucose (mg/dL)', 'Total Cholesterol (mg/dL)', 'LDL (mg/dL)', 'HDL (mg/dL)', 'Triglycerides (mg/dL)', 'Vitamin D (ng/mL)', 'Ferritin (ng/mL)', 'BUN (mg/dL)'],
  WomenHealth: ['Estradiol (pg/mL)', 'Progesterone (ng/mL)', 'TSH (mIU/L)', 'Ferritin (ng/mL)', 'Hemoglobin (g/dL)'],
};

const SAMPLE_DATA = [
  { date: '2026-01-15', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 13.2, 'WBC (10^3/µL)': 7.1, 'Platelets (10^3/µL)': 245 } },
  { date: '2026-03-20', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 12.8, 'WBC (10^3/µL)': 6.9, 'Platelets (10^3/µL)': 230 } },
  { date: '2026-05-10', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 11.5, 'WBC (10^3/µL)': 8.2, 'Platelets (10^3/µL)': 195 } },
  { date: '2026-01-15', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 92, 'Creatinine (mg/dL)': 0.9, 'Potassium (mEq/L)': 4.2 } },
  { date: '2026-03-20', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 105, 'Creatinine (mg/dL)': 1.0, 'Potassium (mEq/L)': 4.5 } },
  { date: '2026-05-10', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 112, 'Creatinine (mg/dL)': 1.1, 'Potassium (mEq/L)': 5.3 } },
  { date: '2026-04-02', panel: 'Lipid', results: { 'Total Cholesterol (mg/dL)': 215, 'LDL (mg/dL)': 138, 'HDL (mg/dL)': 38, 'Triglycerides (mg/dL)': 170 } },
  { date: '2026-02-01', panel: 'Hormone', results: { 'TSH (mIU/L)': 2.1, 'Vitamin D (ng/mL)': 38, 'Ferritin (ng/mL)': 85 } },
  { date: '2026-05-15', panel: 'Hormone', results: { 'TSH (mIU/L)': 3.4, 'Vitamin D (ng/mL)': 22, 'Ferritin (ng/mL)': 18 } },
];

/* ============================================================
   PURE HELPERS
   ============================================================ */
const findMeta = (testName) => {
  for (const panel of Object.values(REFERENCE_RANGES)) {
    if (panel[testName]) return panel[testName];
  }
  return null;
};

const getStatus = (testName, value) => {
  const meta = findMeta(testName);
  if (!meta) return { status: 'UNKNOWN', color: MUTED, severity: 0 };
  const { min, max } = meta;
  if (value < min) return { status: 'LOW', color: DANGER, severity: Math.abs(value - min) / Math.max(min, 1) };
  if (value > max) return { status: 'HIGH', color: DANGER, severity: Math.abs(value - max) / Math.max(max, 1) };
  return { status: 'NORMAL', color: SAFE, severity: 0 };
};

// Converts a stored (conventional/US) value to the active unit system for display
const toDisplay = (testName, value, system) => {
  const meta = findMeta(testName);
  if (!meta || system !== 'SI' || !meta.siFactor) return { value, unit: meta?.unit || '' };
  return { value: Math.round(value * meta.siFactor * 1000) / 1000, unit: meta.siUnit };
};

const rangeToDisplay = (meta, system) => {
  if (!meta) return null;
  if (system !== 'SI' || !meta.siFactor) return { min: meta.min, max: meta.max, unit: meta.unit };
  return {
    min: Math.round(meta.min * meta.siFactor * 1000) / 1000,
    max: Math.round(meta.max * meta.siFactor * 1000) / 1000,
    unit: meta.siUnit,
  };
};

const fmt = (n) => (Math.abs(n) < 1 ? n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : Number(n.toFixed(2)));

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const recordsToCSV = (records) => {
  const header = 'date,panel,test,value\n';
  const rows = records.flatMap((r) => Object.entries(r.results).map(([test, value]) => `${r.date},${r.panel},"${test}",${value}`));
  return header + rows.join('\n');
};

// Parses pasted CSV in the format: date,panel,test,value (one row per test)
const parseCSV = (text) => {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  const startIdx = /^date\s*,\s*panel\s*,\s*test\s*,\s*value/i.test(lines[0]) ? 1 : 0;
  const grouped = {};
  const errors = [];
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].match(/(".*?"|[^,]+)/g);
    if (!parts || parts.length < 4) { errors.push(`Line ${i + 1}: malformed`); continue; }
    const [date, panel, rawTest, rawValue] = parts.map((p) => p.replace(/^"|"$/g, '').trim());
    const value = parseFloat(rawValue);
    if (!date || !panel || !rawTest || Number.isNaN(value)) { errors.push(`Line ${i + 1}: invalid value`); continue; }
    if (!REFERENCE_RANGES[panel] || !REFERENCE_RANGES[panel][rawTest]) { errors.push(`Line ${i + 1}: unknown test "${rawTest}" in "${panel}"`); continue; }
    const key = `${date}__${panel}`;
    if (!grouped[key]) grouped[key] = { date, panel, results: {} };
    grouped[key].results[rawTest] = value;
  }
  return { records: Object.values(grouped), errors };
};

const CSV_TEMPLATE = 'date,panel,test,value\n2026-06-01,CBC,"Hemoglobin (g/dL)",13.4\n2026-06-01,Metabolic,"Glucose (mg/dL)",98';

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BloodPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [addMode, setAddMode] = useState('manual'); // 'manual' | 'import'
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.records);
      return saved ? JSON.parse(saved) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA; }
  });
  const [unitSystem, setUnitSystem] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.units) || 'US'; } catch { return 'US'; }
  });
  const [selectedPanel, setSelectedPanel] = useState('CBC');
  const [selectedTest, setSelectedTest] = useState('Hemoglobin (g/dL)');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], panel: 'CBC', results: {} });
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState([]);
  const [notification, setNotification] = useState(null);
  const [patientInfo, setPatientInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.patient);
      return saved ? JSON.parse(saved) : { name: 'Alex Morgan', dob: '1990-05-14', id: 'BP-2026-0847' };
    } catch { return { name: 'Alex Morgan', dob: '1990-05-14', id: 'BP-2026-0847' }; }
  });
  const [handoffLog, setHandoffLog] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.handoffLog);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.patient, JSON.stringify(patientInfo)); }, [patientInfo]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.units, unitSystem); }, [unitSystem]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.handoffLog, JSON.stringify(handoffLog)); }, [handoffLog]);

  const alerts = useMemo(() => {
    const list = [];
    records.forEach((rec) => {
      Object.entries(rec.results).forEach(([test, value]) => {
        const s = getStatus(test, value);
        if (s.status !== 'NORMAL' && s.status !== 'UNKNOWN') list.push({ ...rec, test, value, ...s });
      });
    });
    return list.sort((a, b) => b.severity - a.severity);
  }, [records]);

  const latestByTest = useMemo(() => {
    const map = {};
    [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((rec) => {
      Object.entries(rec.results).forEach(([test, value]) => {
        if (!map[test]) map[test] = { ...rec, test, value, ...getStatus(test, value) };
      });
    });
    return map;
  }, [records]);

  const trendData = useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const map = {};
    sorted.forEach((rec) => {
      if (rec.results[selectedTest] !== undefined) {
        if (!map[rec.date]) map[rec.date] = { date: rec.date };
        map[rec.date].raw = rec.results[selectedTest];
        map[rec.date].value = toDisplay(selectedTest, rec.results[selectedTest], unitSystem).value;
      }
    });
    return Object.values(map);
  }, [records, selectedTest, unitSystem]);

  // Next-retest recommendation per panel: 3 months if last reading flagged, else 12 months
  const nextDue = useMemo(() => {
    const out = {};
    Object.keys(REFERENCE_RANGES).forEach((panel) => {
      const panelRecords = records.filter((r) => r.panel === panel).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!panelRecords.length) { out[panel] = null; return; }
      const latest = panelRecords[0];
      const flagged = Object.entries(latest.results).some(([t, v]) => getStatus(t, v).status !== 'NORMAL');
      const months = flagged ? 3 : 12;
      const due = new Date(latest.date);
      due.setMonth(due.getMonth() + months);
      out[panel] = { date: due.toISOString().split('T')[0], months, flagged };
    });
    return out;
  }, [records]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3800);
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    const filled = Object.entries(formData.results).filter(([, v]) => v !== '' && v !== undefined);
    if (filled.length === 0) { showNotification('Enter at least one value', 'error'); return; }
    const results = {};
    filled.forEach(([k, v]) => { results[k] = parseFloat(v); });
    setRecords([...records, { date: formData.date, panel: formData.panel, results }]);

    const flagged = Object.entries(results).filter(([t, v]) => getStatus(t, v).status !== 'NORMAL').map(([t, v]) => `${t}: ${getStatus(t, v).status}`);
    showNotification(flagged.length ? `Saved — ⚠ out-of-range: ${flagged.join(', ')}` : 'Lab results saved', flagged.length ? 'warning' : 'success');
    setFormData({ date: new Date().toISOString().split('T')[0], panel: formData.panel, results: {} });
  };

  const handleImportCSV = () => {
    const { records: parsed, errors } = parseCSV(csvText);
    setCsvErrors(errors);
    if (parsed.length === 0) { showNotification('No valid rows found in CSV', 'error'); return; }
    setRecords([...records, ...parsed]);
    const totalTests = parsed.reduce((sum, r) => sum + Object.keys(r.results).length, 0);
    showNotification(`Imported ${parsed.length} record(s), ${totalTests} test value(s)${errors.length ? ` — ${errors.length} row(s) skipped` : ''}`, errors.length ? 'warning' : 'success');
    setCsvText('');
  };

  const deleteRecord = (idx) => {
    setRecords(records.filter((_, i) => i !== idx));
    showNotification('Record deleted');
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    const rows = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((r) => `<tr><td>${r.date}</td><td>${r.panel}</td><td>${Object.entries(r.results).map(([t, v]) => `${t}: ${v}`).join('<br/>')}</td></tr>`).join('');
    const alertRows = alerts.slice(0, 12).map((a) => `<tr><td>${a.date}</td><td>${a.test}</td><td>${a.value}</td><td style="color:${a.color};font-weight:bold">${a.status}</td></tr>`).join('');

    printWindow.document.write(`
      <html><head><title>Blood Panel Report - ${patientInfo.name}</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#111;background:#fff}
        .header{border-bottom:3px solid #c8a84b;padding-bottom:20px;margin-bottom:30px}
        h1{color:#c8a84b;margin:0;font-size:28px}
        h2{color:#000;border-bottom:1px solid #c8a84b;padding-bottom:8px;margin-top:30px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th{background:#000;color:#ffc83c;padding:10px;text-align:left}
        td{padding:8px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#fafafa}
        .meta{display:flex;justify-content:space-between;margin-top:15px;font-size:14px}
        .footer{margin-top:40px;padding-top:20px;border-top:2px solid #c8a84b;font-size:12px;color:#666;text-align:center}
      </style></head><body>
      <div class="header">
        <h1>BLOOD PANEL — DIAGNOSTIC REPORT</h1>
        <div class="meta">
          <div><strong>Patient:</strong> ${patientInfo.name}<br/><strong>DOB:</strong> ${patientInfo.dob}</div>
          <div><strong>Report ID:</strong> ${patientInfo.id}<br/><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        </div>
      </div>
      <h2>Lab History (${records.length} records)</h2>
      <table><thead><tr><th>Date</th><th>Panel</th><th>Results</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Out-of-Range Alerts (${alerts.length})</h2>
      <table><thead><tr><th>Date</th><th>Test</th><th>Value</th><th>Status</th></tr></thead><tbody>${alertRows || '<tr><td colspan="4">No alerts</td></tr>'}</tbody></table>
      <div class="footer">Generated by ManifiX BloodPanel for medical review. Always confirm with your healthcare provider.</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    printWindow.document.close();
    showNotification("PDF report opened — use your browser's Save as PDF");
  };

  // Real cross-module handoff: persists a structured payload + fires a DOM event other
  // mounted ManifiX modules (NutritionHealth, WomenHealth) can subscribe to.
  const shareToIntegration = (target) => {
    const relevantTests = INTEGRATION_RELEVANCE[target] || [];
    const findings = relevantTests
      .filter((t) => latestByTest[t])
      .map((t) => ({ test: t, value: latestByTest[t].value, status: latestByTest[t].status, date: latestByTest[t].date }));

    const payload = {
      source: 'BloodPanel',
      patient: patientInfo.name,
      generatedAt: new Date().toISOString(),
      findings,
      alertCount: findings.filter((f) => f.status !== 'NORMAL').length,
    };

    try {
      localStorage.setItem(`manifix_handoff_${target.toLowerCase()}`, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('manifix:bloodpanel:handoff', { detail: { target, payload } }));
    } catch { /* storage unavailable — still log locally below */ }

    const logEntry = { target, at: payload.generatedAt, findingCount: findings.length, alertCount: payload.alertCount };
    setHandoffLog([logEntry, ...handoffLog].slice(0, 20));
    showNotification(`Shared ${findings.length} finding(s) with ${target}${payload.alertCount ? ` (${payload.alertCount} flagged)` : ''}`);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'add', label: 'Add Results' },
    { id: 'trends', label: 'Trends' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'share', label: 'Share / PDF' },
  ];

  const currentMeta = REFERENCE_RANGES[selectedPanel]?.[selectedTest];
  const currentRange = rangeToDisplay(currentMeta, unitSystem);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: FONT_BODY }}>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000, padding: '14px 22px', maxWidth: 420,
              background: notification.type === 'error' ? '#2a0d0d' : notification.type === 'warning' ? '#241a06' : '#0d2418',
              border: `1px solid ${notification.type === 'error' ? DANGER : notification.type === 'warning' ? GOLD : SAFE}`,
              borderRadius: 6, color: '#fff', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: '22px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: 34, letterSpacing: 1.5, color: GOLD }}>BLOOD PANEL</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: GOLD_DIM, letterSpacing: 3 }}>DIAGNOSTIC TRACKING · MANIFIX</p>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 12, flexWrap: 'wrap' }}>
          <div><span style={{ color: GOLD_DIM }}>PATIENT</span> {patientInfo.name}</div>
          <div><span style={{ color: GOLD_DIM }}>ID</span> {patientInfo.id}</div>
          <button onClick={() => setUnitSystem(unitSystem === 'US' ? 'SI' : 'US')} style={unitToggleStyle}>
            UNITS: {unitSystem === 'US' ? 'CONVENTIONAL' : 'SI'}
          </button>
          <div style={{ padding: '6px 14px', background: alerts.length ? DANGER : SAFE, color: '#000', borderRadius: 4, fontWeight: 700, fontSize: 11, fontFamily: FONT_HEAD }}>
            {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ display: 'flex', gap: 4, padding: '0 40px', background: BG, borderBottom: `1px solid ${BORDER}`, overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '14px 22px', background: 'transparent', border: 'none', color: activeTab === t.id ? GOLD : MUTED,
            cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, fontWeight: activeTab === t.id ? 700 : 400,
            borderBottom: activeTab === t.id ? `2px solid ${GOLD}` : '2px solid transparent', whiteSpace: 'nowrap', letterSpacing: 0.5,
          }}>{t.label.toUpperCase()}</button>
        ))}
      </nav>

      <main style={{ padding: '30px 40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard label="Total Records" value={records.length} />
              <StatCard label="Active Alerts" value={alerts.length} accent={alerts.length ? DANGER : SAFE} />
              <StatCard label="Panels Tracked" value={new Set(records.map((r) => r.panel)).size} />
              <StatCard label="Latest Test" value={records.length ? new Date(Math.max(...records.map((r) => new Date(r.date)))).toLocaleDateString() : '—'} />
            </div>

            <h2 style={sectionHeading}>NEXT RECOMMENDED RETEST</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
              {Object.entries(nextDue).filter(([, v]) => v).map(([panel, due]) => (
                <div key={panel} style={{ ...cardBase, borderLeft: `3px solid ${due.flagged ? DANGER : PANEL_COLORS[panel]}` }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1 }}>{panel.toUpperCase()}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{due.date}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{due.flagged ? 'Flagged last draw — 3 month recheck' : 'Routine 12 month recheck'}</div>
                </div>
              ))}
            </div>

            <h2 style={sectionHeading}>LATEST RESULTS BY TEST</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
              {Object.entries(latestByTest).map(([test, data]) => {
                const meta = findMeta(test);
                const disp = toDisplay(test, data.value, unitSystem);
                const range = rangeToDisplay(meta, unitSystem);
                return (
                  <motion.div key={test} whileHover={{ scale: 1.015 }} style={{ ...cardBase, borderLeft: `3px solid ${data.color}` }}>
                    <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1 }}>{data.panel.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: GOLD, margin: '4px 0', fontWeight: 600 }}>{test.replace(/\s*\(.*?\)/, '')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                      <span style={{ fontSize: 26, fontFamily: FONT_HEAD, color: data.color }}>{fmt(disp.value)} <span style={{ fontSize: 12, color: MUTED }}>{disp.unit}</span></span>
                      <span style={{ fontSize: 10, padding: '3px 9px', background: data.color + '22', color: data.color, borderRadius: 4, fontWeight: 700 }}>{data.status}</span>
                    </div>
                    {range && <div style={{ fontSize: 10, color: MUTED, marginTop: 6 }}>Range: {fmt(range.min)}–{fmt(range.max)} {range.unit}</div>}
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{data.date}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ADD RESULTS */}
        {activeTab === 'add' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={() => setAddMode('manual')} style={subTabStyle(addMode === 'manual')}>MANUAL ENTRY</button>
              <button onClick={() => setAddMode('import')} style={subTabStyle(addMode === 'import')}>BULK IMPORT (CSV)</button>
            </div>

            {addMode === 'manual' ? (
              <form onSubmit={handleAddRecord} style={{ background: PANEL_BG, border: `1px solid ${GOLD_DIM}55`, borderRadius: 8, padding: 26 }}>
                <h2 style={{ margin: '0 0 18px', fontFamily: FONT_HEAD, color: GOLD, fontSize: 22, letterSpacing: 1 }}>MANUAL LAB ENTRY</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <Field label="Test Date">
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={inputStyle} required />
                  </Field>
                  <Field label="Panel Type">
                    <select value={formData.panel} onChange={(e) => setFormData({ ...formData, panel: e.target.value, results: {} })} style={inputStyle}>
                      {Object.keys(REFERENCE_RANGES).map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
                  <h3 style={{ color: GOLD_DIM, fontSize: 13, marginBottom: 12, letterSpacing: 1 }}>VALUES — {formData.panel.toUpperCase()} (enter in conventional units)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                    {Object.entries(REFERENCE_RANGES[formData.panel]).map(([test, range]) => (
                      <div key={test} style={{ background: BG, padding: 10, borderRadius: 6, border: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: 11, color: GOLD, marginBottom: 5, fontWeight: 600 }}>{test}</div>
                        <div style={{ fontSize: 10, color: MUTED, marginBottom: 5 }}>Range: {range.min}–{range.max} {range.unit}</div>
                        <input type="number" step="0.01" placeholder="Value" value={formData.results[test] || ''}
                          onChange={(e) => setFormData({ ...formData, results: { ...formData.results, [test]: e.target.value } })}
                          style={{ ...inputStyle, padding: '7px 9px', fontSize: 13 }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  <button type="submit" style={{ ...btnPrimary, flex: 1 }}>SAVE RESULTS</button>
                  <button type="button" onClick={() => setFormData({ ...formData, results: {} })} style={{ ...btnSecondary, flex: 1 }}>CLEAR</button>
                </div>
              </form>
            ) : (
              <div style={{ background: PANEL_BG, border: `1px solid ${GOLD_DIM}55`, borderRadius: 8, padding: 26 }}>
                <h2 style={{ margin: '0 0 8px', fontFamily: FONT_HEAD, color: GOLD, fontSize: 22, letterSpacing: 1 }}>BULK IMPORT</h2>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: MUTED }}>
                  Paste rows as <code style={{ color: GOLD_DIM }}>date,panel,test,value</code>. Test names must match the panel exactly (e.g. lab export, Quest/LabCorp style CSV).
                </p>
                <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={CSV_TEMPLATE}
                  rows={10} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
                {csvErrors.length > 0 && (
                  <div style={{ marginTop: 10, padding: 10, background: '#2a0d0d', border: `1px solid ${DANGER}`, borderRadius: 6, fontSize: 11, color: DANGER }}>
                    {csvErrors.map((e, i) => <div key={i}>{e}</div>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={handleImportCSV} style={{ ...btnPrimary, flex: 1 }} disabled={!csvText.trim()}>IMPORT ROWS</button>
                  <button onClick={() => setCsvText(CSV_TEMPLATE)} style={{ ...btnSecondary, flex: 1 }}>LOAD TEMPLATE</button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TRENDS */}
        {activeTab === 'trends' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
              <div style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, maxHeight: 600, overflowY: 'auto' }}>
                <h3 style={{ color: GOLD_DIM, fontSize: 12, margin: '0 0 10px', letterSpacing: 1 }}>SELECT TEST</h3>
                {Object.entries(REFERENCE_RANGES).map(([panel, tests]) => (
                  <div key={panel} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: PANEL_COLORS[panel], fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>{panel.toUpperCase()}</div>
                    {Object.keys(tests).map((t) => (
                      <button key={t} onClick={() => { setSelectedTest(t); setSelectedPanel(panel); }} style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '7px 9px', marginBottom: 3,
                        background: selectedTest === t ? GOLD : 'transparent', color: selectedTest === t ? '#000' : '#ccc',
                        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: selectedTest === t ? 700 : 400,
                      }}>{t}</button>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ background: PANEL_BG, border: `1px solid ${GOLD_DIM}55`, borderRadius: 8, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: FONT_HEAD, color: GOLD, fontSize: 22 }}>{selectedTest}</h2>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: 11 }}>
                      Reference: {currentRange ? `${fmt(currentRange.min)}–${fmt(currentRange.max)} ${currentRange.unit}` : '—'} · {trendData.length} data point(s)
                    </p>
                  </div>
                  {trendData.length > 0 && (() => {
                    const last = trendData[trendData.length - 1];
                    const prev = trendData.length > 1 ? trendData[trendData.length - 2] : last;
                    const delta = last.value - prev.value;
                    const s = getStatus(selectedTest, last.raw);
                    return (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontFamily: FONT_HEAD, color: s.color }}>{fmt(last.value)}</div>
                        <div style={{ fontSize: 11, color: delta > 0 ? DANGER : delta < 0 ? SAFE : MUTED }}>
                          {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {fmt(Math.abs(delta))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="date" stroke={GOLD_DIM} style={{ fontSize: 11 }} />
                      <YAxis stroke={GOLD_DIM} style={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#000', border: `1px solid ${GOLD}`, borderRadius: 6 }} />
                      {currentRange && (
                        <>
                          <ReferenceLine y={currentRange.max} stroke={DANGER} strokeDasharray="5 5" label={{ value: 'High', fill: DANGER, fontSize: 10 }} />
                          <ReferenceLine y={currentRange.min} stroke={DANGER} strokeDasharray="5 5" label={{ value: 'Low', fill: DANGER, fontSize: 10, position: 'bottom' }} />
                        </>
                      )}
                      <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2.5} fill="url(#goldGrad)" dot={{ fill: GOLD, r: 4, stroke: '#000', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>No data for this test yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ALERTS */}
        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: PANEL_BG, border: `1px solid ${DANGER}55`, borderRadius: 8, padding: 18, marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontFamily: FONT_HEAD, color: DANGER, fontSize: 22 }}>OUT-OF-RANGE ALERTS ({alerts.length})</h2>
              <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 12 }}>Flagged automatically against clinical reference ranges.</p>
            </div>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: SAFE, fontSize: 16 }}>All values within normal ranges.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {alerts.map((a, i) => {
                  const meta = findMeta(a.test);
                  const range = rangeToDisplay(meta, unitSystem);
                  const disp = toDisplay(a.test, a.value, unitSystem);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ ...cardBase, borderLeft: `3px solid ${a.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ padding: '2px 9px', background: a.color + '22', color: a.color, borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{a.status}</span>
                          <span style={{ color: GOLD_DIM, fontSize: 10 }}>{a.panel}</span>
                          <span style={{ color: '#555', fontSize: 10 }}>{a.date}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{a.test}</div>
                        {range && <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Normal: {fmt(range.min)}–{fmt(range.max)} {range.unit}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontFamily: FONT_HEAD, color: a.color }}>{fmt(disp.value)} {disp.unit}</div>
                        <div style={{ fontSize: 10, color: MUTED }}>
                          {a.status === 'HIGH' ? `+${fmt(a.value - (meta?.max || 0))} over` : `${fmt(a.value - (meta?.min || 0))} under`}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* SHARE / PDF */}
        {activeTab === 'share' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ background: PANEL_BG, border: `1px solid ${GOLD_DIM}55`, borderRadius: 8, padding: 26, marginBottom: 18 }}>
              <h2 style={{ margin: '0 0 4px', fontFamily: FONT_HEAD, color: GOLD, fontSize: 22, letterSpacing: 1 }}>SHARE & EXPORT</h2>
              <p style={{ margin: '0 0 18px', color: MUTED, fontSize: 12 }}>Generate a report or hand off findings to other ManifiX modules.</p>

              <IntegrationCard title="Patient Info" items={[
                { label: 'Name', value: patientInfo.name, onChange: (v) => setPatientInfo({ ...patientInfo, name: v }) },
                { label: 'DOB', value: patientInfo.dob, onChange: (v) => setPatientInfo({ ...patientInfo, dob: v }), type: 'date' },
                { label: 'Report ID', value: patientInfo.id, onChange: (v) => setPatientInfo({ ...patientInfo, id: v }) },
              ]} />

              <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
                <button onClick={exportPDF} style={{ ...btnPrimary, padding: '15px' }}>GENERATE PDF REPORT ({records.length} records, {alerts.length} alerts)</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={() => downloadBlob(recordsToCSV(records), `bloodpanel_${patientInfo.id}.csv`, 'text/csv')} style={btnSecondary}>DOWNLOAD CSV</button>
                  <button onClick={() => downloadBlob(JSON.stringify(records, null, 2), `bloodpanel_${patientInfo.id}.json`, 'application/json')} style={btnSecondary}>DOWNLOAD JSON</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={() => shareToIntegration('NutritionHealth')} style={btnSecondary}>SHARE WITH NUTRITIONHEALTH</button>
                  <button onClick={() => shareToIntegration('WomenHealth')} style={btnSecondary}>SHARE WITH WOMENHEALTH</button>
                </div>
              </div>
            </div>

            <div style={{ background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 18 }}>
              <h3 style={{ color: GOLD_DIM, margin: '0 0 12px', fontSize: 13, letterSpacing: 1 }}>HANDOFF LOG</h3>
              {handoffLog.length === 0 ? (
                <div style={{ color: MUTED, fontSize: 12 }}>No handoffs yet. Sharing writes a payload other modules can read instantly.</div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {handoffLog.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 10px', background: BG, borderRadius: 5, border: `1px solid ${BORDER}` }}>
                      <span style={{ color: GOLD }}>{h.target}</span>
                      <span style={{ color: MUTED }}>{h.findingCount} finding(s){h.alertCount ? ` · ${h.alertCount} flagged` : ''}</span>
                      <span style={{ color: '#555' }}>{new Date(h.at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ALL RECORDS */}
        {activeTab !== 'add' && activeTab !== 'share' && (
          <div style={{ marginTop: 26, background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 18 }}>
            <h3 style={{ color: GOLD_DIM, margin: '0 0 12px', fontSize: 13, letterSpacing: 1 }}>ALL RECORDS</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => (
                <div key={i} style={{ padding: '9px 10px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 200 }}>
                    <span style={{ color: GOLD_DIM, fontSize: 11, fontWeight: 700, minWidth: 84 }}>{r.date}</span>
                    <span style={{ padding: '2px 9px', background: PANEL_COLORS[r.panel] + '22', color: PANEL_COLORS[r.panel], borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{r.panel}</span>
                    <span style={{ color: '#aaa', fontSize: 11 }}>{Object.keys(r.results).length} tests</span>
                  </div>
                  <button onClick={() => deleteRecord(records.indexOf(r))} style={{ background: 'transparent', border: `1px solid ${DANGER}`, color: DANGER, padding: '3px 9px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>DELETE</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '18px 40px', borderTop: `1px solid ${BORDER}`, color: '#555', fontSize: 10, marginTop: 36, letterSpacing: 0.5 }}>
        MANIFIX BLOODPANEL · INTEGRATES WITH NUTRITIONHEALTH · WOMENHEALTH
      </footer>
    </div>
  );
}

/* ============================================================
   SMALL PRESENTATIONAL HELPERS
   ============================================================ */
function StatCard({ label, value, accent = GOLD }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} style={{ ...cardBase, borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, fontFamily: FONT_HEAD, color: accent, marginTop: 6 }}>{value}</div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: GOLD_DIM, marginBottom: 5, fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function IntegrationCard({ title, items }) {
  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, maxWidth: 320 }}>
      <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>{title.toUpperCase()}</div>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: MUTED, marginBottom: 3, letterSpacing: 0.5 }}>{it.label.toUpperCase()}</div>
          <input type={it.type || 'text'} value={it.value} onChange={(e) => it.onChange(e.target.value)} style={{ ...inputStyle, padding: '6px 9px', fontSize: 12 }} />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   STYLE TOKENS
   ============================================================ */
const cardBase = {
  background: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14,
};

const sectionHeading = {
  fontFamily: FONT_HEAD, color: GOLD, fontSize: 18, letterSpacing: 1, marginBottom: 14,
  borderBottom: `1px solid ${BORDER}`, paddingBottom: 8,
};

const inputStyle = {
  background: BG, border: `1px solid ${BORDER}`, color: '#fff', padding: '10px 12px',
  borderRadius: 5, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: FONT_BODY,
};

const btnPrimary = {
  background: GOLD, color: '#000', border: 'none', padding: '12px 22px', borderRadius: 6,
  fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, letterSpacing: 0.5,
};

const btnSecondary = {
  background: 'transparent', color: GOLD, border: `1px solid ${GOLD_DIM}`, padding: '12px 22px',
  borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, letterSpacing: 0.5,
};

const unitToggleStyle = {
  background: 'transparent', border: `1px solid ${GOLD_DIM}`, color: GOLD_DIM, padding: '5px 10px',
  borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, fontFamily: FONT_BODY,
};

const subTabStyle = (active) => ({
  padding: '8px 16px', background: active ? GOLD : 'transparent', color: active ? '#000' : GOLD_DIM,
  border: `1px solid ${GOLD_DIM}`, borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700,
  letterSpacing: 0.5, fontFamily: FONT_BODY,
});
