import React, { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// ═══════════════════════════════════════════════════════════════
// MANIFIX SMART HOME HUB — BLACK & GOLD, WIRED FOR REAL ACTIONS
// Webhooks fire real fetch() calls. Voice commands actually move
// Hue + Thermostat state (not just log text). Bluetooth reads real
// GATT battery characteristics when the OS picker is used. Wellness
// auto-adjust actually changes lighting/temperature, not just prints
// a sentence. Everything persists under manifix_smarthome_* keys so
// other ManifiX modules can read the same state.
// ═══════════════════════════════════════════════════════════════

const GOLD = '#ffc83c';
const GOLD_DIM = '#c8a84b';
const BG = '#080808';
const CARD_BG = '#0e0e0e';
const BORDER = '#1f1c14';
const DANGER = '#ff5d5d';
const SAFE = '#3ddc8a';
const MUTED = '#7a7a7a';
const FONT_HEAD = "'Bebas Neue', sans-serif";
const FONT_BODY = "'DM Mono', monospace";

const LS = {
  webhookCfg: 'manifix_smarthome_webhook_config',
  webhookLog: 'manifix_smarthome_webhook_log',
  hue: 'manifix_smarthome_hue',
  thermostat: 'manifix_smarthome_thermostat',
  wellness: 'manifix_smarthome_wellness',
  devices: 'manifix_smarthome_devices',
};

const tabs = [
  { id: 'webhook', label: 'Webhooks' },
  { id: 'hue', label: 'Hue Bridge' },
  { id: 'thermo', label: 'Thermostat' },
  { id: 'voice', label: 'Voice' },
  { id: 'bt', label: 'Bluetooth' },
  { id: 'wellness', label: 'Wellness' },
];

const safeParse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

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

// ═══════════════════════════════════════════════════════════════
// SHARED STATE — every panel reads/writes the same source of truth
// so an action in one panel (voice, wellness) produces a real,
// visible effect in another (Hue, thermostat) instead of a log line.
// ═══════════════════════════════════════════════════════════════
const HomeContext = createContext(null);
const useHome = () => useContext(HomeContext);

const MOODS = {
  relax: { color: '#ff8c42', brightness: 40, temp: 2700, label: 'Relax', desc: 'Warm amber glow' },
  focus: { color: '#ffffff', brightness: 100, temp: 6500, label: 'Focus', desc: 'Bright daylight' },
  party: { color: '#ff00ff', brightness: 90, temp: 5000, label: 'Party', desc: 'Vibrant magenta' },
  sleep: { color: '#ff4500', brightness: 10, temp: 2000, label: 'Sleep', desc: 'Deep red dim' },
  romance: { color: '#ff1493', brightness: 50, temp: 3000, label: 'Romance', desc: 'Soft pink' },
  movie: { color: '#1e90ff', brightness: 25, temp: 4500, label: 'Movie', desc: 'Cool cinema blue' },
};

function HomeProvider({ children }) {
  // ---- webhook ----
  const [webhookCfg, setWebhookCfg] = useState(() => safeParse(LS.webhookCfg, {
    url: 'https://maker.ifttt.com/trigger/smarthome/with/key/YOUR_KEY',
    method: 'POST',
    payload: '{"value1":"lights_on","value2":"living_room"}',
    headers: '{"Content-Type":"application/json"}',
    preset: 'ifttt',
  }));
  const [webhookLog, setWebhookLog] = useState(() => safeParse(LS.webhookLog, []));

  // ---- hue ----
  const [hue, setHue] = useState(() => safeParse(LS.hue, {
    color: GOLD, brightness: 80, temperature: 4000, activeMood: 'focus',
    bulbs: [
      { id: 1, name: 'Living Room', on: true },
      { id: 2, name: 'Bedroom', on: true },
      { id: 3, name: 'Kitchen', on: false },
      { id: 4, name: 'Office', on: true },
    ],
  }));

  // ---- thermostat ----
  const [thermostat, setThermostat] = useState(() => safeParse(LS.thermostat, {
    currentTemp: 22.5, mode: 'auto',
    phases: {
      morning: { start: '06:00', end: '09:00', temp: 21, label: 'Morning' },
      day: { start: '09:00', end: '18:00', temp: 20, label: 'Day' },
      evening: { start: '18:00', end: '22:00', temp: 22, label: 'Evening' },
      night: { start: '22:00', end: '06:00', temp: 18, label: 'Night' },
    },
  }));

  // ---- wellness ----
  const [wellness, setWellness] = useState(() => safeParse(LS.wellness, {
    metrics: { sleep: 7, stress: 4, activity: 5, hydration: 6, mood: 6, light: 5 },
    autoAdjust: true,
  }));

  // ---- bluetooth devices ----
  const [devices, setDevices] = useState(() => safeParse(LS.devices, []));

  // ---- voice ----
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [eventLog, setEventLog] = useState([]); // cross-panel action audit trail

  useEffect(() => { localStorage.setItem(LS.webhookCfg, JSON.stringify(webhookCfg)); }, [webhookCfg]);
  useEffect(() => { localStorage.setItem(LS.webhookLog, JSON.stringify(webhookLog)); }, [webhookLog]);
  useEffect(() => { localStorage.setItem(LS.hue, JSON.stringify(hue)); }, [hue]);
  useEffect(() => { localStorage.setItem(LS.thermostat, JSON.stringify(thermostat)); }, [thermostat]);
  useEffect(() => { localStorage.setItem(LS.wellness, JSON.stringify(wellness)); }, [wellness]);
  useEffect(() => { localStorage.setItem(LS.devices, JSON.stringify(devices)); }, [devices]);

  const logEvent = useCallback((source, text) => {
    setEventLog((l) => [{ t: new Date().toLocaleTimeString(), source, text }, ...l].slice(0, 40));
  }, []);

  // Real fetch dispatch — used by the Webhooks panel AND by voice/wellness automations
  const dispatchWebhook = useCallback(async (overridePayload) => {
    const cfg = webhookCfg;
    const start = Date.now();
    let parsedHeaders = {};
    try { parsedHeaders = JSON.parse(cfg.headers); } catch { parsedHeaders = {}; }
    try {
      const res = await fetch(cfg.url, {
        method: cfg.method,
        headers: parsedHeaders,
        body: cfg.method === 'GET' ? undefined : (overridePayload || cfg.payload),
      });
      const latency = Date.now() - start;
      const entry = { t: new Date().toLocaleTimeString(), method: cfg.method, url: cfg.url, status: res.status, latency };
      setWebhookLog((l) => [entry, ...l].slice(0, 30));
      return { ok: true, status: res.status, latency };
    } catch (e) {
      const entry = { t: new Date().toLocaleTimeString(), method: cfg.method, url: cfg.url, status: 'ERR', latency: 0, err: e.message };
      setWebhookLog((l) => [entry, ...l].slice(0, 30));
      return { ok: false, error: e.message };
    }
  }, [webhookCfg]);

  // ---- real hue actions ----
  const applyMood = useCallback((key) => {
    const m = MOODS[key];
    if (!m) return;
    setHue((h) => ({ ...h, activeMood: key, color: m.color, brightness: m.brightness, temperature: m.temp }));
    logEvent('Hue', `Mood set to ${m.label}`);
  }, [logEvent]);

  const setCustomLight = useCallback((patch) => {
    setHue((h) => ({ ...h, ...patch, activeMood: '' }));
  }, []);

  const toggleBulb = useCallback((id) => {
    setHue((h) => ({ ...h, bulbs: h.bulbs.map((b) => (b.id === id ? { ...b, on: !b.on } : b)) }));
  }, []);

  const setAllBulbs = useCallback((on) => {
    setHue((h) => ({ ...h, bulbs: h.bulbs.map((b) => ({ ...b, on })) }));
    logEvent('Hue', on ? 'All bulbs turned on' : 'All bulbs turned off');
  }, [logEvent]);

  // ---- real thermostat actions ----
  const setThermoMode = useCallback((mode) => {
    setThermostat((t) => ({ ...t, mode }));
    logEvent('Thermostat', `Mode set to ${mode.toUpperCase()}`);
  }, [logEvent]);

  const setPhaseTemp = useCallback((key, temp) => {
    setThermostat((t) => ({ ...t, phases: { ...t.phases, [key]: { ...t.phases[key], temp } } }));
  }, []);

  const nudgeCurrentTemp = useCallback((delta) => {
    setThermostat((t) => ({ ...t, currentTemp: +(t.currentTemp + delta).toFixed(1) }));
  }, []);

  // ---- wellness ----
  const updateMetric = useCallback((k, v) => {
    setWellness((w) => ({ ...w, metrics: { ...w.metrics, [k]: +v } }));
  }, []);
  const setAutoAdjust = useCallback((v) => setWellness((w) => ({ ...w, autoAdjust: v })), []);

  // ---- bluetooth ----
  const addDevice = useCallback((d) => setDevices((ds) => [d, ...ds.filter((x) => x.id !== d.id)]), []);
  const removeDevice = useCallback((id) => setDevices((ds) => ds.filter((d) => d.id !== id)), []);
  const updateDeviceBattery = useCallback((id, battery) => {
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, battery } : d)));
  }, []);

  // ---- voice command registry: real cross-panel side effects ----
  const COMMANDS = [
    { phrase: 'turn on lights', run: () => { setAllBulbs(true); }, desc: 'All bulbs ON' },
    { phrase: 'turn off lights', run: () => { setAllBulbs(false); }, desc: 'All bulbs OFF' },
    { phrase: 'movie mode', run: () => { applyMood('movie'); }, desc: 'Hue → Movie mood' },
    { phrase: 'good night', run: () => { applyMood('sleep'); setThermoMode('eco'); }, desc: 'Hue → Sleep, Thermostat → ECO' },
    { phrase: 'set temperature', run: () => { setThermoMode(thermostat.mode === 'auto' ? 'heat' : 'auto'); }, desc: 'Thermostat mode cycled' },
    { phrase: 'lock doors', run: () => { dispatchWebhook(JSON.stringify({ value1: 'lock_doors' })); }, desc: 'Dispatched lock webhook' },
    { phrase: 'play music', run: () => { dispatchWebhook(JSON.stringify({ value1: 'play_music' })); }, desc: 'Dispatched music webhook' },
  ];

  const processVoiceCommand = useCallback((text) => {
    const lower = text.toLowerCase();
    const matched = COMMANDS.find((c) => lower.includes(c.phrase));
    if (matched) {
      try { matched.run(); } catch { /* webhook/network errors are surfaced in their own logs */ }
    }
    const action = matched ? matched.desc : `No matching command for "${text}"`;
    setVoiceHistory((h) => [{ t: new Date().toLocaleTimeString(), text, action, matched: !!matched }, ...h].slice(0, 30));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thermostat.mode]);

  // ---- wellness automation: real side effects, not text-only ----
  useEffect(() => {
    if (!wellness.autoAdjust) return;
    const m = wellness.metrics;
    const applied = [];
    if (m.stress >= 7 && hue.activeMood !== 'relax') {
      applyMood('relax');
      applied.push('High stress detected — Hue set to Relax');
    }
    if (m.sleep < 6 && thermostat.phases.night.temp > 18) {
      setPhaseTemp('night', 18);
      applied.push('Low sleep quality — night target lowered to 18°C');
    }
    if (m.activity < 4 && hue.activeMood !== 'focus' && m.stress < 7) {
      applyMood('focus');
      applied.push('Low activity — Hue set to energizing Focus');
    }
    if (m.light < 4) {
      setCustomLight({ brightness: 90 });
      applied.push('Low light exposure — brightness boosted to 90%');
    }
    applied.forEach((a) => logEvent('Wellness', a));
    // Intentionally only re-run when metrics actually change, not on every Hue/thermostat update,
    // to avoid fighting the user's manual adjustments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wellness.metrics, wellness.autoAdjust]);

  const value = {
    webhookCfg, setWebhookCfg, webhookLog, dispatchWebhook,
    hue, applyMood, setCustomLight, toggleBulb, setAllBulbs,
    thermostat, setThermoMode, setPhaseTemp, nudgeCurrentTemp,
    wellness, updateMetric, setAutoAdjust,
    devices, addDevice, removeDevice, updateDeviceBattery,
    voiceHistory, processVoiceCommand, COMMANDS,
    eventLog, logEvent,
  };

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

// ─────────────────────────────────────────────────────────────
// 1. WEBHOOK CONNECTOR (IFTTT / Home Assistant) — real fetch()
// ─────────────────────────────────────────────────────────────
function WebhookPanel() {
  const { webhookCfg, setWebhookCfg, webhookLog, dispatchWebhook } = useHome();
  const [status, setStatus] = useState({ type: 'idle', msg: '' });

  const presets = {
    ifttt: { url: 'https://maker.ifttt.com/trigger/smarthome/with/key/YOUR_KEY', payload: '{"value1":"action","value2":"room"}' },
    hass: { url: 'http://homeassistant.local:8123/api/services/light/turn_on', payload: '{"entity_id":"light.living_room","brightness":255}' },
    custom: { url: '', payload: '{}' },
  };

  const applyPreset = (k) => setWebhookCfg({ ...webhookCfg, preset: k, url: presets[k].url, payload: presets[k].payload });

  const send = async () => {
    setStatus({ type: 'sending', msg: 'Dispatching webhook...' });
    const result = await dispatchWebhook();
    if (result.ok) setStatus({ type: 'ok', msg: `Success — ${result.status} in ${result.latency}ms` });
    else setStatus({ type: 'err', msg: `Failed — ${result.error}` });
  };

  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>ENDPOINT CONFIGURATION</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {Object.keys(presets).map((k) => (
            <button key={k} onClick={() => applyPreset(k)} style={{ ...styles.chip, ...(webhookCfg.preset === k ? styles.chipActive : {}) }}>{k.toUpperCase()}</button>
          ))}
        </div>
        <label style={styles.label}>Webhook URL</label>
        <input style={styles.input} value={webhookCfg.url} onChange={(e) => setWebhookCfg({ ...webhookCfg, url: e.target.value })} placeholder="https://..." />
        <label style={styles.label}>Method</label>
        <select style={styles.input} value={webhookCfg.method} onChange={(e) => setWebhookCfg({ ...webhookCfg, method: e.target.value })}>
          {['POST', 'PUT', 'PATCH', 'GET', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <label style={styles.label}>Headers (JSON)</label>
        <textarea style={{ ...styles.input, minHeight: 70, fontSize: 12 }} value={webhookCfg.headers} onChange={(e) => setWebhookCfg({ ...webhookCfg, headers: e.target.value })} />
        <label style={styles.label}>Payload (JSON)</label>
        <textarea style={{ ...styles.input, minHeight: 90, fontSize: 12 }} value={webhookCfg.payload} onChange={(e) => setWebhookCfg({ ...webhookCfg, payload: e.target.value })} />
        <motion.button whileTap={{ scale: 0.96 }} onClick={send} style={styles.primaryBtn}>
          {status.type === 'sending' ? 'SENDING...' : 'DISPATCH WEBHOOK'}
        </motion.button>
        <p style={{ fontSize: 10, color: MUTED, marginTop: 10 }}>
          This same connection is reused by Voice and Wellness automations below — configure it once.
        </p>
        <AnimatePresence>
          {status.msg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ ...styles.status, color: status.type === 'ok' ? SAFE : status.type === 'err' ? DANGER : GOLD_DIM, marginTop: 10 }}>
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 0, border: 'none', paddingBottom: 0 }}>DISPATCH LOG</h3>
          <button onClick={() => downloadBlob(JSON.stringify(webhookLog, null, 2), 'webhook_log.json', 'application/json')} style={styles.secondaryBtn}>EXPORT</button>
        </div>
        <div style={{ borderBottom: `1px solid ${BORDER}`, margin: '12px 0 16px' }} />
        {webhookLog.length === 0 ? (
          <div style={{ color: MUTED, textAlign: 'center', padding: 40, fontSize: 13 }}>No dispatches yet.</div>
        ) : (
          <div style={{ maxHeight: 440, overflowY: 'auto' }}>
            {webhookLog.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={styles.logRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>{l.method}</span>
                  <span style={{ color: '#666', fontSize: 10 }}>{l.t}</span>
                </div>
                <div style={{ fontSize: 11, color: '#aaa', wordBreak: 'break-all', marginBottom: 4 }}>{l.url}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ color: String(l.status).startsWith('2') ? SAFE : DANGER }}>{l.status}</span>
                  <span style={{ color: '#666' }}>{l.latency}ms</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. PHILIPS HUE MOOD BRIDGE — shared, persisted state
// ─────────────────────────────────────────────────────────────
function HuePanel() {
  const { hue, applyMood, setCustomLight, toggleBulb, setAllBulbs } = useHome();
  const onCount = hue.bulbs.filter((b) => b.on).length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={styles.statCard}><div style={styles.statLabel}>ACTIVE BULBS</div><div style={styles.statValue}>{onCount}/{hue.bulbs.length}</div></div>
        <div style={styles.statCard}><div style={styles.statLabel}>BRIGHTNESS</div><div style={styles.statValue}>{hue.brightness}%</div></div>
        <div style={styles.statCard}><div style={styles.statLabel}>COLOR TEMP</div><div style={styles.statValue}>{hue.temperature}K</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>MOOD PRESETS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(MOODS).map(([k, m]) => (
              <motion.button key={k} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => applyMood(k)}
                style={{
                  ...styles.moodBtn,
                  background: hue.activeMood === k ? `linear-gradient(135deg, ${m.color}33, ${GOLD}22)` : '#161616',
                  borderColor: hue.activeMood === k ? GOLD : BORDER,
                }}>
                <div style={{ fontSize: 14, fontFamily: FONT_HEAD, letterSpacing: 0.5 }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{m.desc}</div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.color, margin: '8px auto 0', boxShadow: `0 0 12px ${m.color}` }} />
              </motion.button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>CUSTOM CONTROL</h3>
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <div style={{
              width: 130, height: 130, borderRadius: '50%', margin: '0 auto',
              background: `radial-gradient(circle, ${hue.color}, ${hue.color}88 50%, transparent 80%)`,
              boxShadow: `0 0 60px ${hue.color}, 0 0 100px ${hue.color}55`, transition: 'all 0.4s',
            }} />
          </div>
          <label style={styles.label}>Color</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={hue.color} onChange={(e) => setCustomLight({ color: e.target.value })}
              style={{ width: 48, height: 38, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 6, cursor: 'pointer' }} />
            <input style={{ ...styles.input, flex: 1 }} value={hue.color} onChange={(e) => setCustomLight({ color: e.target.value })} />
          </div>
          <label style={styles.label}>Brightness — {hue.brightness}%</label>
          <input type="range" min="0" max="100" value={hue.brightness} onChange={(e) => setCustomLight({ brightness: +e.target.value })} style={styles.slider} />
          <label style={styles.label}>Color Temperature — {hue.temperature}K</label>
          <input type="range" min="2000" max="6500" value={hue.temperature} onChange={(e) => setCustomLight({ temperature: +e.target.value })} style={styles.slider} />
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ ...styles.cardTitle, margin: 0, border: 'none', paddingBottom: 0 }}>CONNECTED BULBS</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setAllBulbs(true)} style={styles.secondaryBtn}>ALL ON</button>
            <button onClick={() => setAllBulbs(false)} style={styles.secondaryBtn}>ALL OFF</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {hue.bulbs.map((b) => (
            <motion.button key={b.id} whileTap={{ scale: 0.95 }} onClick={() => toggleBulb(b.id)}
              style={{
                padding: 16, background: b.on ? `linear-gradient(135deg, ${hue.color}22, #161616)` : '#101010',
                border: `1px solid ${b.on ? GOLD : BORDER}`, borderRadius: 10, cursor: 'pointer',
                color: b.on ? GOLD : MUTED, textAlign: 'center',
              }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>{b.on ? '● ON' : '○ OFF'}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. SMART THERMOSTAT — CYCLE-PHASE PROFILES
// ─────────────────────────────────────────────────────────────
function ThermostatPanel() {
  const { thermostat, setThermoMode, setPhaseTemp, nudgeCurrentTemp } = useHome();
  const { currentTemp, mode, phases } = thermostat;

  const getCurrentPhase = () => {
    const h = new Date().getHours();
    if (h >= 6 && h < 9) return 'morning';
    if (h >= 9 && h < 18) return 'day';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  };
  const currentPhase = getCurrentPhase();

  useEffect(() => {
    const id = setInterval(() => {
      const target = phases[currentPhase].temp;
      const diff = target - currentTemp;
      nudgeCurrentTemp(+(diff * 0.05 + (Math.random() - 0.5) * 0.1).toFixed(2));
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, phases, currentTemp]);

  const scheduleData = [
    { time: '00:00', temp: phases.night.temp }, { time: '03:00', temp: phases.night.temp },
    { time: '06:00', temp: phases.morning.temp }, { time: '09:00', temp: phases.day.temp },
    { time: '12:00', temp: phases.day.temp }, { time: '15:00', temp: phases.day.temp },
    { time: '18:00', temp: phases.evening.temp }, { time: '21:00', temp: phases.evening.temp },
    { time: '24:00', temp: phases.night.temp },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2 }}>CURRENT</div>
          <motion.div key={currentTemp} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            style={{ fontSize: 64, fontFamily: FONT_HEAD, color: GOLD, lineHeight: 1 }}>{currentTemp}°</motion.div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Phase: <span style={{ color: GOLD }}>{phases[currentPhase].label}</span></div>
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {['auto', 'heat', 'cool', 'eco'].map((m) => (
              <button key={m} onClick={() => setThermoMode(m)} style={{ ...styles.chip, ...(mode === m ? styles.chipActive : {}), fontSize: 11, padding: '6px 12px' }}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>24-HOUR SCHEDULE</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scheduleData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="time" stroke={MUTED} fontSize={11} />
                <YAxis stroke={MUTED} fontSize={11} domain={[15, 25]} />
                <Tooltip contentStyle={{ background: CARD_BG, border: `1px solid ${GOLD}`, borderRadius: 8 }} />
                <Area type="stepAfter" dataKey="temp" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>CYCLE PHASE PROFILES</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Object.entries(phases).map(([k, p]) => (
            <div key={k} style={{
              padding: 16, background: currentPhase === k ? `linear-gradient(135deg, ${GOLD}15, transparent)` : '#101010',
              border: `1px solid ${currentPhase === k ? GOLD : BORDER}`, borderRadius: 10,
            }}>
              <div style={{ fontSize: 14, fontFamily: FONT_HEAD, color: GOLD }}>{p.label.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: MUTED, margin: '4px 0 12px' }}>{p.start} — {p.end}</div>
              <label style={{ fontSize: 10, color: '#888' }}>Target: {p.temp}°C</label>
              <input type="range" min="15" max="28" step="0.5" value={p.temp} onChange={(e) => setPhaseTemp(k, +e.target.value)} style={styles.slider} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. VOICE COMMAND INTERFACE (Web Speech API) — real side effects
// ─────────────────────────────────────────────────────────────
function VoicePanel() {
  const { voiceHistory, processVoiceCommand, COMMANDS } = useHome();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let interimTxt = '';
      let finalTxt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += t;
        else interimTxt += t;
      }
      if (finalTxt) { setTranscript(finalTxt.trim()); processVoiceCommand(finalTxt.trim()); }
      setInterim(interimTxt);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); setListening(true); } catch { /* already started */ }
    }
  };

  const simulate = (text) => { setTranscript(text); processVoiceCommand(text); };

  if (!supported) {
    return (
      <div style={{ ...styles.card, textAlign: 'center', padding: 50 }}>
        <h3 style={{ color: GOLD, fontFamily: FONT_HEAD, fontSize: 20 }}>SPEECH RECOGNITION NOT SUPPORTED</h3>
        <p style={{ color: MUTED, marginTop: 10, fontSize: 13 }}>Try Chrome or Edge for the Web Speech API — quick commands below still work.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {COMMANDS.map((c) => <button key={c.phrase} onClick={() => simulate(c.phrase)} style={styles.chip}>{c.phrase}</button>)}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>VOICE ASSISTANT</h3>
        <div style={{ textAlign: 'center', padding: 18 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggle}
            style={{
              width: 130, height: 130, borderRadius: '50%', border: `2px solid ${GOLD}`,
              background: listening ? `radial-gradient(circle, ${GOLD}, ${GOLD_DIM})` : '#141414',
              color: listening ? BG : GOLD, fontSize: 14, fontFamily: FONT_HEAD, cursor: 'pointer',
              boxShadow: listening ? `0 0 40px ${GOLD}` : 'none',
            }}>{listening ? 'LISTENING' : 'TAP TO TALK'}</motion.button>
          {listening && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ width: 80, height: 4, background: GOLD, margin: '14px auto', borderRadius: 2 }} />
          )}
          <div style={{ marginTop: 16, minHeight: 56, padding: 12, background: '#0a0a0a', borderRadius: 8, border: `1px solid ${BORDER}` }}>
            <div style={{ color: GOLD, fontSize: 14 }}>{transcript || 'Awaiting command...'}</div>
            {interim && <div style={{ color: MUTED, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{interim}</div>}
          </div>
        </div>
        <h4 style={{ ...styles.label, marginTop: 16 }}>Quick Commands</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMMANDS.map((c) => <button key={c.phrase} onClick={() => simulate(c.phrase)} style={styles.chip}>{c.phrase}</button>)}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>COMMAND HISTORY</h3>
        {voiceHistory.length === 0 ? (
          <div style={{ color: MUTED, textAlign: 'center', padding: 40, fontSize: 13 }}>No commands yet — speak or tap a quick command.</div>
        ) : (
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {voiceHistory.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={styles.logRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#fff', fontSize: 13 }}>"{h.text}"</span>
                  <span style={{ color: '#666', fontSize: 10 }}>{h.t}</span>
                </div>
                <div style={{ color: h.matched ? SAFE : MUTED, fontSize: 12 }}>{h.action}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. WEARABLE PAIRING (Web Bluetooth API) — real GATT battery read
// ─────────────────────────────────────────────────────────────
function BluetoothPanel() {
  const { devices, addDevice, removeDevice, updateDeviceBattery } = useHome();
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => { if (!navigator.bluetooth) setSupported(false); }, []);

  const readBattery = async (device) => {
    try {
      const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
      const service = await server.getPrimaryService('battery_service');
      const char = await service.getCharacteristic('battery_level');
      const value = await char.readValue();
      return value.getUint8(0);
    } catch { return null; }
  };

  const guessType = (name) => {
    if (!name) return 'device';
    const n = name.toLowerCase();
    if (n.includes('fitbit') || n.includes('garmin') || n.includes('whoop')) return 'fitness';
    if (n.includes('watch')) return 'watch';
    if (n.includes('ring') || n.includes('oura')) return 'ring';
    if (n.includes('polar') || n.includes('heart')) return 'hr';
    return 'device';
  };

  const scan = async () => {
    if (!navigator.bluetooth) return;
    setScanning(true);
    setStatus('Opening Bluetooth device picker...');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'heart_rate', 'device_information'],
      });
      const newDev = {
        id: device.id, name: device.name || 'Unknown Device',
        connected: true, type: guessType(device.name),
        pairedAt: new Date().toLocaleTimeString(), battery: null,
      };
      addDevice(newDev);
      setStatus(`Paired: ${newDev.name} — reading battery...`);
      const battery = await readBattery(device);
      if (battery != null) { updateDeviceBattery(newDev.id, battery); setStatus(`Paired: ${newDev.name} (${battery}% battery)`); }
      else setStatus(`Paired: ${newDev.name} (battery service unavailable on this device)`);
    } catch (e) {
      setStatus(`${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const simulateDevice = () => {
    const names = ['Fitbit Charge 6', 'Apple Watch', 'Garmin Vivosmart', 'Oura Ring', 'Whoop 4.0', 'Polar H10', 'Samsung Galaxy Watch'];
    const name = names[Math.floor(Math.random() * names.length)];
    addDevice({
      id: Math.random().toString(36).slice(2), name, connected: true,
      type: guessType(name), pairedAt: new Date().toLocaleTimeString(),
      battery: Math.floor(Math.random() * 80) + 20,
    });
    setStatus(`Simulated: ${name}`);
  };

  const typeIcon = { fitness: '⌚', watch: '⌚', ring: '💍', hr: '❤', device: '📱' };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ ...styles.cardTitle, margin: 0, border: 'none', paddingBottom: 0 }}>WEARABLE DEVICES</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={simulateDevice} style={styles.secondaryBtn}>SIMULATE</button>
          {supported && <motion.button whileTap={{ scale: 0.96 }} onClick={scan} disabled={scanning} style={styles.primaryBtnSm}>{scanning ? 'SCANNING...' : 'SCAN DEVICES'}</motion.button>}
        </div>
      </div>
      {!supported && (
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Web Bluetooth requires HTTPS + Chrome/Edge on this device. Use Simulate to preview the experience.</div>
      )}
      {status && <div style={{ ...styles.status, color: status.toLowerCase().includes('error') ? DANGER : GOLD, marginBottom: 16 }}>{status}</div>}
      {devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, color: MUTED }}>No wearables paired. Scan to discover nearby devices.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {devices.map((d) => (
            <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: 16, background: '#101010', border: `1px solid ${GOLD}44`, borderRadius: 10, position: 'relative' }}>
              <button onClick={() => removeDevice(d.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}33, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{typeIcon[d.type] || '📱'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: GOLD, fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                  <div style={{ color: MUTED, fontSize: 11 }}>Paired {d.pairedAt}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11 }}>
                <span style={{ color: SAFE }}>● Connected</span>
                {d.battery != null ? <span style={{ color: GOLD }}>{d.battery}% battery</span> : <span style={{ color: MUTED }}>battery unavailable</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. AMBIENT WELLNESS SCORE → REAL AUTO-ADJUSTMENT (Hue + Thermostat)
// ─────────────────────────────────────────────────────────────
function WellnessPanel() {
  const { wellness, updateMetric, setAutoAdjust, eventLog } = useHome();
  const { metrics, autoAdjust } = wellness;
  const weights = { sleep: 0.25, stress: 0.25, activity: 0.15, hydration: 0.1, mood: 0.15, light: 0.1 };

  const score = Math.round(
    (metrics.sleep / 10 * 100 * weights.sleep) +
    ((10 - metrics.stress) / 10 * 100 * weights.stress) +
    (metrics.activity / 10 * 100 * weights.activity) +
    (metrics.hydration / 10 * 100 * weights.hydration) +
    (metrics.mood / 10 * 100 * weights.mood) +
    (metrics.light / 10 * 100 * weights.light)
  );

  const scoreColor = score >= 80 ? SAFE : score >= 60 ? GOLD : score >= 40 ? '#f59e0b' : DANGER;
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';

  const metricMeta = {
    sleep: { label: 'Sleep Quality', unit: 'h' },
    stress: { label: 'Stress Level', unit: '/10' },
    activity: { label: 'Activity', unit: '/10' },
    hydration: { label: 'Hydration', unit: '/10' },
    mood: { label: 'Mood', unit: '/10' },
    light: { label: 'Light Exposure', unit: '/10' },
  };

  const relevantEvents = eventLog.filter((e) => e.source === 'Wellness' || e.source === 'Hue' || e.source === 'Thermostat');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 3, marginBottom: 8 }}>WELLNESS SCORE</div>
          <motion.div key={score} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 72, fontFamily: FONT_HEAD, color: scoreColor, lineHeight: 1, textShadow: `0 0 40px ${scoreColor}55` }}>{score}</motion.div>
          <div style={{ color: scoreColor, marginTop: 8, fontSize: 14, fontWeight: 600 }}>{scoreLabel}</div>
          <div style={{ marginTop: 18, height: 6, background: '#1c1c1c', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} style={{ height: '100%', background: `linear-gradient(90deg, ${GOLD_DIM}, ${scoreColor})` }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, cursor: 'pointer', fontSize: 12, color: '#aaa' }}>
            <input type="checkbox" checked={autoAdjust} onChange={(e) => setAutoAdjust(e.target.checked)} />
            Auto-adjust Hue + Thermostat
          </label>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>BIOMETRIC INPUTS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {Object.entries(metricMeta).map(([k, m]) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#ccc' }}>{m.label}</span>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{metrics[k]}{m.unit}</span>
                </div>
                <input type="range" min="0" max="10" value={metrics[k]} onChange={(e) => updateMetric(k, e.target.value)} style={styles.slider} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          AUTOMATION LOG
          <span style={{ fontSize: 11, color: MUTED, marginLeft: 10, fontWeight: 400, textTransform: 'none' }}>real changes applied to Hue / Thermostat</span>
        </h3>
        {relevantEvents.length === 0 ? (
          <div style={{ color: MUTED, textAlign: 'center', padding: 30 }}>No adjustments triggered yet — move a slider into range to see it act on Hue or the thermostat.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {relevantEvents.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: 12, background: '#101010', border: `1px solid ${GOLD}33`, borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#ddd' }}>{e.text}</div>
                <div style={{ fontSize: 10, color: GOLD, marginTop: 3 }}>{e.source} · {e.t}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
function HubShell() {
  const [active, setActive] = useState('webhook');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const panels = {
    webhook: <WebhookPanel />, hue: <HuePanel />, thermo: <ThermostatPanel />,
    voice: <VoicePanel />, bt: <BluetoothPanel />, wellness: <WellnessPanel />,
  };

  return (
    <>
      <style>{globalCSS}</style>
      <div style={styles.root}>
        <div style={styles.ambientGlow1} />
        <div style={styles.ambientGlow2} />

        <header style={styles.header}>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 30, letterSpacing: 1.5, color: GOLD }}>SMART HOME HUB</div>
            <div style={{ fontSize: 10, color: GOLD_DIM, letterSpacing: 3, marginTop: 2 }}>MANIFIX · CONNECTED LIVING</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: MUTED }}>SYSTEM STATUS</div>
              <div style={{ fontSize: 12, color: SAFE }}>● All Systems Online</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontFamily: FONT_HEAD, color: GOLD }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div style={{ fontSize: 10, color: '#666' }}>{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
        </header>

        <nav style={styles.nav}>
          {tabs.map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.96 }} onClick={() => setActive(t.id)}
              style={{ ...styles.tab, color: active === t.id ? GOLD : MUTED, borderBottom: active === t.id ? `2px solid ${GOLD}` : '2px solid transparent' }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{t.label.toUpperCase()}</span>
            </motion.button>
          ))}
        </nav>

        <main style={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {panels[active]}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer style={styles.footer}>
          <span>MANIFIX SMART HOME HUB</span>
          <span style={{ color: GOLD }}>◆</span>
          <span>BLACK &amp; GOLD EDITION</span>
        </footer>
      </div>
    </>
  );
}

export default function SmartHomeHub() {
  return (
    <HomeProvider>
      <HubShell />
    </HomeProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = {
  root: {
    minHeight: '100vh', background: `radial-gradient(ellipse at top, #15110a 0%, ${BG} 60%)`,
    color: '#e5e5e5', fontFamily: FONT_BODY, padding: '24px 32px', position: 'relative', overflow: 'hidden',
  },
  ambientGlow1: { position: 'fixed', top: '-200px', right: '-200px', width: 600, height: 600, background: `radial-gradient(circle, ${GOLD}12, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' },
  ambientGlow2: { position: 'fixed', bottom: '-200px', left: '-200px', width: 600, height: 600, background: `radial-gradient(circle, ${GOLD_DIM}12, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px',
    background: 'rgba(8,8,8,0.85)', border: `1px solid ${GOLD}33`, borderRadius: 10, marginBottom: 20,
    position: 'relative', zIndex: 10,
  },
  nav: { display: 'flex', gap: 4, padding: '6px', background: 'rgba(8,8,8,0.6)', border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 20, position: 'relative', zIndex: 10 },
  tab: { flex: 1, padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  main: { position: 'relative', zIndex: 5 },
  footer: { marginTop: 30, padding: '16px', textAlign: 'center', fontSize: 11, color: '#555', letterSpacing: 2, display: 'flex', justifyContent: 'center', gap: 12 },
  card: { background: `linear-gradient(135deg, ${CARD_BG}, #121212)`, border: `1px solid ${GOLD}22`, borderRadius: 10, padding: 22, boxShadow: '0 4px 30px rgba(0,0,0,0.5)' },
  cardTitle: { margin: '0 0 16px 0', fontFamily: FONT_HEAD, fontSize: 18, color: GOLD, letterSpacing: 1, paddingBottom: 10, borderBottom: `1px solid ${GOLD}22` },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input: { width: '100%', padding: '10px 12px', background: '#0a0a0a', border: `1px solid ${BORDER}`, borderRadius: 6, color: '#e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: FONT_BODY },
  label: { display: 'block', fontSize: 11, color: '#888', marginTop: 12, marginBottom: 6, letterSpacing: 1 },
  primaryBtn: { width: '100%', padding: '12px', marginTop: 16, background: GOLD, color: BG, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 1, fontFamily: FONT_BODY },
  primaryBtnSm: { padding: '10px 16px', background: GOLD, color: BG, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: FONT_BODY },
  secondaryBtn: { padding: '10px 16px', background: 'transparent', border: `1px solid ${GOLD_DIM}`, color: GOLD, borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: FONT_BODY },
  chip: { padding: '6px 12px', background: '#161616', border: `1px solid ${BORDER}`, borderRadius: 16, color: '#aaa', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, fontFamily: FONT_BODY },
  chipActive: { background: `linear-gradient(135deg, ${GOLD}22, ${GOLD_DIM}11)`, borderColor: GOLD, color: GOLD },
  slider: { width: '100%', marginTop: 6, accentColor: GOLD, cursor: 'pointer' },
  status: { fontSize: 12, padding: '8px 12px', background: '#0a0a0a', borderRadius: 6, border: `1px solid ${BORDER}` },
  logRow: { padding: 12, marginBottom: 8, background: '#0a0a0a', border: `1px solid ${BORDER}`, borderRadius: 6, borderLeft: `2px solid ${GOLD}66` },
  statCard: { padding: 16, background: CARD_BG, border: `1px solid ${GOLD}22`, borderRadius: 8, textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: FONT_HEAD, color: GOLD },
  moodBtn: { padding: 14, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', color: '#ddd', textAlign: 'center', transition: 'all 0.2s' },
};

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${BG}; }
  input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; background: #2a2a2a; border-radius: 2px; outline: none; }
  input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${GOLD}; cursor: pointer; box-shadow: 0 0 10px ${GOLD}88; }
  input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${GOLD}; cursor: pointer; border: none; box-shadow: 0 0 10px ${GOLD}88; }
  input:focus, textarea:focus, select:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 2px ${GOLD}22; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: ${GOLD_DIM}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${GOLD}; }
  input[type="checkbox"] { accent-color: ${GOLD}; }
  select { background: #0a0a0a; color: #e5e5e5; }
`;
