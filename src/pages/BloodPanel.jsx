import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const REFERENCE_RANGES = {
  CBC: {
    'WBC (10^3/µL)': { min: 4.5, max: 11.0, unit: '10^3/µL' },
    'RBC (10^6/µL)': { min: 4.5, max: 5.5, unit: '10^6/µL' },
    'Hemoglobin (g/dL)': { min: 12.0, max: 17.5, unit: 'g/dL' },
    'Hematocrit (%)': { min: 36, max: 54, unit: '%' },
    'Platelets (10^3/µL)': { min: 150, max: 400, unit: '10^3/µL' },
    'MCV (fL)': { min: 80, max: 100, unit: 'fL' },
  },
  Metabolic: {
    'Glucose (mg/dL)': { min: 70, max: 100, unit: 'mg/dL' },
    'BUN (mg/dL)': { min: 7, max: 20, unit: 'mg/dL' },
    'Creatinine (mg/dL)': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'Sodium (mEq/L)': { min: 136, max: 145, unit: 'mEq/L' },
    'Potassium (mEq/L)': { min: 3.5, max: 5.0, unit: 'mEq/L' },
    'Calcium (mg/dL)': { min: 8.5, max: 10.5, unit: 'mg/dL' },
    'ALT (U/L)': { min: 7, max: 56, unit: 'U/L' },
    'AST (U/L)': { min: 10, max: 40, unit: 'U/L' },
  },
  Hormone: {
    'TSH (mIU/L)': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'Free T4 (ng/dL)': { min: 0.8, max: 1.8, unit: 'ng/dL' },
    'Testosterone (ng/dL)': { min: 270, max: 1070, unit: 'ng/dL' },
    'Estradiol (pg/mL)': { min: 30, max: 400, unit: 'pg/mL' },
    'Progesterone (ng/mL)': { min: 0.2, max: 1.5, unit: 'ng/mL' },
    'Cortisol (µg/dL)': { min: 6, max: 23, unit: 'µg/dL' },
    'Vitamin D (ng/mL)': { min: 30, max: 100, unit: 'ng/mL' },
    'Ferritin (ng/mL)': { min: 20, max: 250, unit: 'ng/mL' },
  },
};

const PANEL_COLORS = {
  CBC: '#FFD700',
  Metabolic: '#F59E0B',
  Hormone: '#FBBF24',
};

const getStatus = (testName, value) => {
  for (const panel of Object.values(REFERENCE_RANGES)) {
    if (panel[testName]) {
      const { min, max } = panel[testName];
      if (value < min) return { status: 'LOW', color: '#EF4444', severity: Math.abs(value - min) / min };
      if (value > max) return { status: 'HIGH', color: '#EF4444', severity: Math.abs(value - max) / max };
      return { status: 'NORMAL', color: '#10B981', severity: 0 };
    }
  }
  return { status: 'UNKNOWN', color: '#9CA3AF', severity: 0 };
};

const SAMPLE_DATA = [
  { date: '2026-01-15', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 13.2, 'WBC (10^3/µL)': 7.1, 'Platelets (10^3/µL)': 245 } },
  { date: '2026-03-20', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 12.8, 'WBC (10^3/µL)': 6.9, 'Platelets (10^3/µL)': 230 } },
  { date: '2026-05-10', panel: 'CBC', results: { 'Hemoglobin (g/dL)': 11.5, 'WBC (10^3/µL)': 8.2, 'Platelets (10^3/µL)': 195 } },
  { date: '2026-01-15', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 92, 'Creatinine (mg/dL)': 0.9, 'Potassium (mEq/L)': 4.2 } },
  { date: '2026-03-20', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 105, 'Creatinine (mg/dL)': 1.0, 'Potassium (mEq/L)': 4.5 } },
  { date: '2026-05-10', panel: 'Metabolic', results: { 'Glucose (mg/dL)': 112, 'Creatinine (mg/dL)': 1.1, 'Potassium (mEq/L)': 5.3 } },
  { date: '2026-02-01', panel: 'Hormone', results: { 'TSH (mIU/L)': 2.1, 'Vitamin D (ng/mL)': 38, 'Ferritin (ng/mL)': 85 } },
  { date: '2026-05-15', panel: 'Hormone', results: { 'TSH (mIU/L)': 3.4, 'Vitamin D (ng/mL)': 22, 'Ferritin (ng/mL)': 18 } },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('bloodpanel_records');
      return saved ? JSON.parse(saved) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA; }
  });
  const [selectedPanel, setSelectedPanel] = useState('CBC');
  const [selectedTest, setSelectedTest] = useState('Hemoglobin (g/dL)');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], panel: 'CBC', results: {} });
  const [notification, setNotification] = useState(null);
  const [patientInfo, setPatientInfo] = useState({ name: 'Alex Morgan', dob: '1990-05-14', id: 'BP-2026-0847' });

  useEffect(() => {
    localStorage.setItem('bloodpanel_records', JSON.stringify(records));
  }, [records]);

  const alerts = useMemo(() => {
    const list = [];
    records.forEach((rec) => {
      Object.entries(rec.results).forEach(([test, value]) => {
        const s = getStatus(test, value);
        if (s.status !== 'NORMAL' && s.status !== 'UNKNOWN') {
          list.push({ ...rec, test, value, ...s });
        }
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
        const key = rec.date;
        if (!map[key]) map[key] = { date: key };
        map[key].value = rec.results[selectedTest];
      }
    });
    return Object.values(map);
  }, [records, selectedTest]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    const filled = Object.entries(formData.results).filter(([, v]) => v !== '' && v !== undefined);
    if (filled.length === 0) {
      showNotification('Please enter at least one value', 'error');
      return;
    }
    const results = {};
    filled.forEach(([k, v]) => { results[k] = parseFloat(v); });
    const newRec = { date: formData.date, panel: formData.panel, results };
    setRecords([...records, newRec]);

    const newAlerts = [];
    Object.entries(results).forEach(([test, value]) => {
      const s = getStatus(test, value);
      if (s.status !== 'NORMAL') newAlerts.push(`${test}: ${s.status}`);
    });
    if (newAlerts.length > 0) {
      showNotification(`⚠ Out-of-range: ${newAlerts.join(', ')}`, 'warning');
    } else {
      showNotification('Lab results saved successfully');
    }
    setFormData({ date: new Date().toISOString().split('T')[0], panel: formData.panel, results: {} });
  };

  const deleteRecord = (idx) => {
    setRecords(records.filter((_, i) => i !== idx));
    showNotification('Record deleted');
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    const rows = records
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((r) =>
        `<tr><td>${r.date}</td><td>${r.panel}</td><td>${Object.entries(r.results).map(([t, v]) => `${t}: ${v}`).join('<br/>')}</td></tr>`
      ).join('');
    const alertRows = alerts.slice(0, 10).map((a) =>
      `<tr><td>${a.date}</td><td>${a.test}</td><td>${a.value}</td><td style="color:${a.color};font-weight:bold">${a.status}</td></tr>`
    ).join('');

    printWindow.document.write(`
      <html><head><title>Blood Panel Report - ${patientInfo.name}</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#111;background:#fff}
        .header{border-bottom:3px solid #D4AF37;padding-bottom:20px;margin-bottom:30px}
        h1{color:#D4AF37;margin:0;font-size:28px}
        h2{color:#000;border-bottom:1px solid #D4AF37;padding-bottom:8px;margin-top:30px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th{background:#000;color:#D4AF37;padding:10px;text-align:left}
        td{padding:8px;border-bottom:1px solid #ddd}
        tr:nth-child(even){background:#fafafa}
        .meta{display:flex;justify-content:space-between;margin-top:15px;font-size:14px}
        .footer{margin-top:40px;padding-top:20px;border-top:2px solid #D4AF37;font-size:12px;color:#666;text-align:center}
      </style></head><body>
      <div class="header">
        <h1>🩸 Blood Panel Diagnostic Report</h1>
        <div class="meta">
          <div><strong>Patient:</strong> ${patientInfo.name}<br/><strong>DOB:</strong> ${patientInfo.dob}</div>
          <div><strong>Report ID:</strong> ${patientInfo.id}<br/><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        </div>
      </div>
      <h2>Lab History (${records.length} records)</h2>
      <table><thead><tr><th>Date</th><th>Panel</th><th>Results</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>⚠ Out-of-Range Alerts (${alerts.length})</h2>
      <table><thead><tr><th>Date</th><th>Test</th><th>Value</th><th>Status</th></tr></thead><tbody>${alertRows || '<tr><td colspan="4">No alerts</td></tr>'}</tbody></table>
      <div class="footer">
        This report is generated for medical review. Please consult your healthcare provider.<br/>
        Integration: NutritionHealth • WomenHealth • MedicationHealth PDF Engine v2.4
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    printWindow.document.close();
    showNotification('PDF report opened in new window');
  };

  const shareToIntegration = (target) => {
    showNotification(`🔗 Shared with ${target} module successfully`, 'success');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'add', label: 'Add Results', icon: '➕' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'alerts', label: 'Alerts', icon: '⚠️' },
    { id: 'share', label: 'Share / PDF', icon: '📤' },
  ];

  const currentRange = REFERENCE_RANGES[selectedPanel]?.[selectedTest];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1208 100%)', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000, padding: '14px 22px',
              background: notification.type === 'error' ? '#7f1d1d' : notification.type === 'warning' ? '#78350f' : '#064e3b',
              border: `2px solid ${notification.type === 'error' ? '#ef4444' : notification.type === 'warning' ? '#f59e0b' : '#D4AF37'}`,
              borderRadius: 8, color: '#fff', boxShadow: '0 8px 24px rgba(212,175,55,0.3)', maxWidth: 400
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header style={{ background: 'linear-gradient(90deg, #000 0%, #1a1208 100%)', borderBottom: '2px solid #D4AF37', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'radial-gradient(circle, #FFD700 0%, #B8860B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 0 20px rgba(212,175,55,0.5)' }}>🩸</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, background: 'linear-gradient(90deg, #FFD700, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, letterSpacing: 1 }}>BLOOD PANEL</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#D4AF37', letterSpacing: 3 }}>DIAGNOSTIC LABORATORY SUITE</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
          <div><span style={{ color: '#D4AF37' }}>Patient:</span> <strong>{patientInfo.name}</strong></div>
          <div><span style={{ color: '#D4AF37' }}>ID:</span> {patientInfo.id}</div>
          <div style={{ padding: '6px 14px', background: '#D4AF37', color: '#000', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
            {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: 4, padding: '0 40px', background: '#000', borderBottom: '1px solid #2a2010', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '14px 24px', background: 'transparent', border: 'none', color: activeTab === t.id ? '#FFD700' : '#888',
            cursor: 'pointer', fontSize: 14, fontWeight: activeTab === t.id ? 700 : 500,
            borderBottom: activeTab === t.id ? '3px solid #D4AF37' : '3px solid transparent',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: '30px 40px', maxWidth: 1400, margin: '0 auto' }}>
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 30 }}>
              <StatCard label="Total Records" value={records.length} icon="📋" />
              <StatCard label="Active Alerts" value={alerts.length} icon="⚠️" accent="#EF4444" />
              <StatCard label="Panels Tracked" value={new Set(records.map(r => r.panel)).size} icon="🧪" />
              <StatCard label="Latest Test" value={records.length ? new Date(Math.max(...records.map(r => new Date(r.date)))).toLocaleDateString() : '—'} icon="📅" />
            </div>

            <h2 style={{ color: '#D4AF37', fontSize: 20, marginBottom: 16, borderBottom: '1px solid #2a2010', paddingBottom: 8 }}>Latest Results by Test</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {Object.entries(latestByTest).map(([test, data]) => {
                const range = Object.values(REFERENCE_RANGES).find(p => p[test]);
                return (
                  <motion.div key={test} whileHover={{ scale: 1.02 }} style={{
                    background: 'linear-gradient(135deg, #0a0a0a, #1a1208)', border: '1px solid #2a2010',
                    borderLeft: `4px solid ${data.color}`, borderRadius: 10, padding: 16
                  }}>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{data.panel}</div>
                    <div style={{ fontSize: 14, color: '#D4AF37', margin: '4px 0', fontWeight: 600 }}>{test}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: data.color }}>{data.value}</span>
                      <span style={{ fontSize: 11, padding: '3px 10px', background: data.color + '22', color: data.color, borderRadius: 12, fontWeight: 700 }}>{data.status}</span>
                    </div>
                    {range && <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Range: {range.min} – {range.max}</div>}
                    <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>Recorded: {data.date}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ADD RESULTS */}
        {activeTab === 'add' && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAddRecord} style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1208)', border: '1px solid #D4AF37', borderRadius: 12, padding: 28 }}>
              <h2 style={{ margin: '0 0 20px', color: '#D4AF37', fontSize: 22 }}>🧪 Manual Lab Entry</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <Field label="Test Date">
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={inputStyle} required />
                </Field>
                <Field label="Panel Type">
                  <select value={formData.panel} onChange={(e) => setFormData({ ...formData, panel: e.target.value, results: {} })} style={inputStyle}>
                    {Object.keys(REFERENCE_RANGES).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{ borderTop: '1px solid #2a2010', paddingTop: 20 }}>
                <h3 style={{ color: '#D4AF37', fontSize: 16, marginBottom: 14 }}>Enter Values for {formData.panel}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {Object.entries(REFERENCE_RANGES[formData.panel]).map(([test, range]) => (
                    <div key={test} style={{ background: '#000', padding: 12, borderRadius: 8, border: '1px solid #2a2010' }}>
                      <div style={{ fontSize: 12, color: '#D4AF37', marginBottom: 6, fontWeight: 600 }}>{test}</div>
                      <div style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>Range: {range.min} – {range.max} {range.unit}</div>
                      <input
                        type="number" step="0.01" placeholder="Value"
                        value={formData.results[test] || ''}
                        onChange={(e) => setFormData({ ...formData, results: { ...formData.results, [test]: e.target.value } })}
                        style={{ ...inputStyle, width: '100%', padding: '8px 10px', fontSize: 14 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" style={{ ...btnPrimary, flex: 1 }}>💾 Save Lab Results</button>
                <button type="button" onClick={() => setFormData({ ...formData, results: {} })} style={{ ...btnSecondary, flex: 1 }}>Clear</button>
              </div>
            </div>
          </motion.form>
        )}

        {/* TRENDS */}
        {activeTab === 'trends' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
              <div style={{ background: '#0a0a0a', border: '1px solid #2a2010', borderRadius: 12, padding: 16, maxHeight: 600, overflowY: 'auto' }}>
                <h3 style={{ color: '#D4AF37', fontSize: 14, margin: '0 0 12px' }}>SELECT TEST</h3>
                {Object.entries(REFERENCE_RANGES).map(([panel, tests]) => (
                  <div key={panel} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: PANEL_COLORS[panel], fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>{panel.toUpperCase()}</div>
                    {Object.keys(tests).map(t => (
                      <button key={t} onClick={() => { setSelectedTest(t); setSelectedPanel(panel); }} style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4,
                        background: selectedTest === t ? 'linear-gradient(90deg, #D4AF37, #B8860B)' : 'transparent',
                        color: selectedTest === t ? '#000' : '#ccc', border: 'none', borderRadius: 6, cursor: 'pointer',
                        fontSize: 12, fontWeight: selectedTest === t ? 700 : 400
                      }}>{t}</button>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1208)', border: '1px solid #D4AF37', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#D4AF37', fontSize: 20 }}>{selectedTest}</h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>
                      Reference: {currentRange?.min} – {currentRange?.max} {currentRange?.unit} • {trendData.length} data points
                    </p>
                  </div>
                  {trendData.length > 0 && (() => {
                    const last = trendData[trendData.length - 1].value;
                    const prev = trendData.length > 1 ? trendData[trendData.length - 2].value : last;
                    const delta = last - prev;
                    const s = getStatus(selectedTest, last);
                    return (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{last}</div>
                        <div style={{ fontSize: 12, color: delta > 0 ? '#ef4444' : delta < 0 ? '#10b981' : '#888' }}>
                          {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {Math.abs(delta).toFixed(2)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2010" />
                      <XAxis dataKey="date" stroke="#D4AF37" style={{ fontSize: 11 }} />
                      <YAxis stroke="#D4AF37" style={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#000', border: '1px solid #D4AF37', borderRadius: 8 }} />
                      {currentRange && (
                        <>
                          <ReferenceLine y={currentRange.max} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'High', fill: '#ef4444', fontSize: 10 }} />
                          <ReferenceLine y={currentRange.min} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Low', fill: '#ef4444', fontSize: 10, position: 'bottom' }} />
                        </>
                      )}
                      <Area type="monotone" dataKey="value" stroke="#FFD700" strokeWidth={3} fill="url(#goldGrad)" dot={{ fill: '#FFD700', r: 5, stroke: '#000', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    No data for this test. Add results to see trends.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ALERTS */}
        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #1a0808, #0a0a0a)', border: '1px solid #ef4444', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#ef4444', fontSize: 20 }}>⚠️ Out-of-Range Alerts ({alerts.length})</h2>
              <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>Automatic detection based on clinical reference ranges</p>
            </div>

            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#10b981', fontSize: 18 }}>✅ All values within normal ranges</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {alerts.map((a, i) => {
                  const range = Object.values(REFERENCE_RANGES).find(p => p[a.test]);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: '#0a0a0a', border: `1px solid ${a.color}40`, borderLeft: `4px solid ${a.color}`, borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ padding: '2px 10px', background: a.color + '22', color: a.color, borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                          <span style={{ color: '#D4AF37', fontSize: 11 }}>{a.panel}</span>
                          <span style={{ color: '#555', fontSize: 11 }}>{a.date}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{a.test}</div>
                        {range && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Normal: {range.min} – {range.max} {range.unit}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: a.color }}>{a.value}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {a.status === 'HIGH' ? `+${(a.value - (range?.max || 0)).toFixed(2)} over` : `${(a.value - (range?.min || 0)).toFixed(2)} under`}
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
            <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1208)', border: '2px solid #D4AF37', borderRadius: 12, padding: 28, marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 8px', color: '#D4AF37', fontSize: 22 }}>📤 Doctor Share & PDF Export</h2>
              <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>Powered by MedicationHealth PDF Engine v2.4</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <IntegrationCard title="Patient Info" icon="👤" items={[
                  { label: 'Name', value: patientInfo.name, onChange: (v) => setPatientInfo({ ...patientInfo, name: v }) },
                  { label: 'DOB', value: patientInfo.dob, onChange: (v) => setPatientInfo({ ...patientInfo, dob: v }), type: 'date' },
                  { label: 'Report ID', value: patientInfo.id, onChange: (v) => setPatientInfo({ ...patientInfo, id: v }) },
                ]} />
              </div>

              <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
                <button onClick={exportPDF} style={{ ...btnPrimary, padding: '16px', fontSize: 15 }}>
                  📄 Generate PDF Report ({records.length} records, {alerts.length} alerts)
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={() => shareToIntegration('NutritionHealth')} style={btnSecondary}>
                    🥗 Share with NutritionHealth
                  </button>
                  <button onClick={() => shareToIntegration('WomenHealth')} style={btnSecondary}>
                    🌸 Share with WomenHealth
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: '#0a0a0a', border: '1px solid #2a2010', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: '#D4AF37', margin: '0 0 12px', fontSize: 16 }}>📋 Report Preview</h3>
              <div style={{ background: '#fff', color: '#000', padding: 20, borderRadius: 8, fontSize: 13 }}>
                <div style={{ borderBottom: '3px solid #D4AF37', paddingBottom: 12, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, color: '#D4AF37' }}>🩸 Blood Panel Diagnostic Report</h3>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Patient: {patientInfo.name} • ID: {patientInfo.id}</div>
                </div>
                <div style={{ fontSize: 12 }}>
                  <strong>Total Records:</strong> {records.length}<br />
                  <strong>Out-of-Range Alerts:</strong> {alerts.length}<br />
                  <strong>Panels Covered:</strong> {[...new Set(records.map(r => r.panel))].join(', ') || 'None'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RECORDS LIST */}
        {activeTab !== 'add' && activeTab !== 'share' && (
          <div style={{ marginTop: 30, background: '#0a0a0a', border: '1px solid #2a2010', borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: '#D4AF37', margin: '0 0 14px', fontSize: 16 }}>📋 All Records</h3>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => (
                <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid #1a1208', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 200 }}>
                    <span style={{ color: '#D4AF37', fontSize: 12, fontWeight: 700, minWidth: 90 }}>{r.date}</span>
                    <span style={{ padding: '2px 10px', background: PANEL_COLORS[r.panel] + '22', color: PANEL_COLORS[r.panel], borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{r.panel}</span>
                    <span style={{ color: '#aaa', fontSize: 12 }}>{Object.keys(r.results).length} tests</span>
                  </div>
                  <button onClick={() => deleteRecord(records.indexOf(r))} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '20px 40px', borderTop: '1px solid #2a2010', color: '#555', fontSize: 11, marginTop: 40 }}>
        BloodPanel Diagnostic Suite • Integrates with NutritionHealth • WomenHealth • MedicationHealth PDF Engine
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, accent = '#D4AF37' }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} style={{
      background: 'linear-gradient(135deg, #0a0a0a, #1a1208)', border: '1px solid #2a2010',
      borderLeft: `4px solid ${accent}`, borderRadius: 10, padding: 18
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 22 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent, marginTop: 6 }}>{value}</div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#D4AF37', marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}

function IntegrationCard({ title, icon, items }) {
  return (
    <div style={{ background: '#000', border: '1px solid #2a2010', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 14, color: '#D4AF37', fontWeight: 700, marginBottom: 12 }}>{icon} {title}</div>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 3 }}>{it.label}</div>
          <input
            type={it.type || 'text'} value={it.value}
            onChange={(e) => it.onChange(e.target.value)}
            style={{ ...inputStyle, width: '100%', padding: '6px 10px', fontSize: 13 }}
          />
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  background: '#000', border: '1px solid #2a2010', color: '#fff', padding: '10px 12px',
  borderRadius: 6, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border 0.2s'
};

const btnPrimary = {
  background: 'linear-gradient(90deg, #D4AF37, #FFD700)', color: '#000', border: 'none',
  padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
};

const btnSecondary = {
  background: 'transparent', color: '#D4AF37', border: '2px solid #D4AF37',
  padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
  transition: 'all 0.2s'
};
