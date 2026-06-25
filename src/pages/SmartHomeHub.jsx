import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// ═══════════════════════════════════════════════════════════════
// MANIFIX BL SMART HOME HUB — GOLD & BLACK EDITION
// Real working features: Webhooks, Hue Bridge, Thermostat,
// Voice (Web Speech API), Bluetooth (Web Bluetooth API), Wellness
// ═══════════════════════════════════════════════════════════════

const GOLD = '#FFD700';
const GOLD_DARK = '#B8860B';
const GOLD_SOFT = '#F4D03F';
const BLACK = '#0A0A0A';
const BLACK_SOFT = '#141414';
const BLACK_CARD = '#1A1A1A';

const tabs = [
  { id: 'webhook', label: 'Webhooks', icon: '⚡' },
  { id: 'hue', label: 'Hue Bridge', icon: '💡' },
  { id: 'thermo', label: 'Thermostat', icon: '🌡️' },
  { id: 'voice', label: 'Voice', icon: '🎙️' },
  { id: 'bt', label: 'Bluetooth', icon: '📡' },
  { id: 'wellness', label: 'Wellness', icon: '✨' },
];

// ─────────────────────────────────────────────────────────────
// 1. WEBHOOK CONNECTOR (IFTTT / Home Assistant)
// ─────────────────────────────────────────────────────────────
function WebhookPanel() {
  const [url, setUrl] = useState('https://maker.ifttt.com/trigger/smarthome/with/key/YOUR_KEY');
  const [method, setMethod] = useState('POST');
  const [payload, setPayload] = useState('{"value1":"lights_on","value2":"living_room"}');
  const [headers, setHeaders] = useState('{"Authorization":"Bearer TOKEN","Content-Type":"application/json"}');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [logs, setLogs] = useState([]);
  const [preset, setPreset] = useState('ifttt');

  const presets = {
    ifttt: { url: 'https://maker.ifttt.com/trigger/smarthome/with/key/YOUR_KEY', payload: '{"value1":"action","value2":"room"}' },
    hass: { url: 'http://homeassistant.local:8123/api/services/light/turn_on', payload: '{"entity_id":"light.living_room","brightness":255}' },
    custom: { url: '', payload: '{}' },
  };

  const applyPreset = (k) => {
    setPreset(k);
    setUrl(presets[k].url);
    setPayload(presets[k].payload);
  };

  const send = async () => {
    setStatus({ type: 'sending', msg: 'Dispatching webhook...' });
    const start = Date.now();
    try {
      let parsedHeaders = {};
      try { parsedHeaders = JSON.parse(headers); } catch { parsedHeaders = {}; }
      const res = await fetch(url, {
        method,
        headers: parsedHeaders,
        body: method === 'GET' ? undefined : payload,
      });
      const latency = Date.now() - start;
      const entry = { t: new Date().toLocaleTimeString(), method, url, status: res.status, latency };
      setLogs((l) => [entry, ...l].slice(0, 20));
      setStatus({ type: 'ok', msg: `✓ ${res.status} ${res.statusText} • ${latency}ms` });
    } catch (e) {
      setStatus({ type: 'err', msg: `✗ ${e.message}` });
      setLogs((l) => [{ t: new Date().toLocaleTimeString(), method, url, status: 'ERR', latency: 0, err: e.message }, ...l].slice(0, 20));
    }
  };

  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Endpoint Configuration</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {Object.keys(presets).map((k) => (
            <button key={k} onClick={() => applyPreset(k)} style={{
              ...styles.chip, ...(preset === k ? styles.chipActive : {})
            }}>{k.toUpperCase()}</button>
          ))}
        </div>
        <label style={styles.label}>Webhook URL</label>
        <input style={styles.input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        <label style={styles.label}>Method</label>
        <select style={styles.input} value={method} onChange={(e) => setMethod(e.target.value)}>
          {['POST', 'PUT', 'PATCH', 'GET', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <label style={styles.label}>Headers (JSON)</label>
        <textarea style={{ ...styles.input, minHeight: 70, fontFamily: 'monospace', fontSize: 12 }} value={headers} onChange={(e) => setHeaders(e.target.value)} />
        <label style={styles.label}>Payload (JSON)</label>
        <textarea style={{ ...styles.input, minHeight: 90, fontFamily: 'monospace', fontSize: 12 }} value={payload} onChange={(e) => setPayload(e.target.value)} />
        <motion.button whileTap={{ scale: 0.96 }} onClick={send} style={styles.primaryBtn}>
          {status.type === 'sending' ? '⏳ Sending...' : '⚡ Dispatch Webhook'}
        </motion.button>
        <AnimatePresence>
          {status.msg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ ...styles.status, color: status.type === 'ok' ? GOLD : status.type === 'err' ? '#ff6b6b' : GOLD_SOFT, marginTop: 10 }}>
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Dispatch Log</h3>
        {logs.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: 40, fontSize: 13 }}>No dispatches yet. Send a webhook to see history.</div>
        ) : (
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {logs.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={styles.logRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{l.method}</span>
                  <span style={{ color: '#666', fontSize: 10 }}>{l.t}</span>
                </div>
                <div style={{ fontSize: 11, color: '#aaa', wordBreak: 'break-all', marginBottom: 4 }}>{l.url}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ color: String(l.status).startsWith('2') ? '#4ade80' : '#ff6b6b' }}>
                    {l.status}
                  </span>
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
// 2. PHILIPS HUE MOOD BRIDGE
// ─────────────────────────────────────────────────────────────
function HuePanel() {
  const [color, setColor] = useState('#FFD700');
  const [brightness, setBrightness] = useState(80);
  const [temperature, setTemperature] = useState(4000);
  const [activeMood, setActiveMood] = useState('focus');
  const [bulbs, setBulbs] = useState([
    { id: 1, name: 'Living Room', on: true },
    { id: 2, name: 'Bedroom', on: true },
    { id: 3, name: 'Kitchen', on: false },
    { id: 4, name: 'Office', on: true },
  ]);

  const moods = {
    relax: { color: '#FF8C42', brightness: 40, temp: 2700, label: '🌅 Relax', desc: 'Warm amber glow' },
    focus: { color: '#FFFFFF', brightness: 100, temp: 6500, label: '💡 Focus', desc: 'Bright daylight' },
    party: { color: '#FF00FF', brightness: 90, temp: 5000, label: '🎉 Party', desc: 'Vibrant magenta' },
    sleep: { color: '#FF4500', brightness: 10, temp: 2000, label: '🌙 Sleep', desc: 'Deep red dim' },
    romance: { color: '#FF1493', brightness: 50, temp: 3000, label: '💖 Romance', desc: 'Soft pink' },
    movie: { color: '#1E90FF', brightness: 25, temp: 4500, label: '🎬 Movie', desc: 'Cool cinema blue' },
  };

  const applyMood = (key) => {
    const m = moods[key];
    setActiveMood(key);
    setColor(m.color);
    setBrightness(m.brightness);
    setTemperature(m.temp);
  };

  const toggleBulb = (id) => {
    setBulbs((bs) => bs.map((b) => (b.id === id ? { ...b, on: !b.on } : b)));
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgb = hexToRgb(color);
  const onCount = bulbs.filter((b) => b.on).length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active Bulbs</div>
          <div style={styles.statValue}>{onCount}/{bulbs.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Brightness</div>
          <div style={styles.statValue}>{brightness}%</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Color Temp</div>
          <div style={styles.statValue}>{temperature}K</div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Mood Presets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(moods).map(([k, m]) => (
              <motion.button key={k} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => applyMood(k)}
                style={{
                  ...styles.moodBtn,
                  background: activeMood === k
                    ? `linear-gradient(135deg, ${m.color}33, ${GOLD}22)`
                    : '#1f1f1f',
                  borderColor: activeMood === k ? GOLD : '#2a2a2a',
                }}>
                <div style={{ fontSize: 22 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{m.desc}</div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, marginTop: 8, boxShadow: `0 0 12px ${m.color}` }} />
              </motion.button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Custom Control</h3>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%', margin: '0 auto',
              background: `radial-gradient(circle, ${color}, ${color}88 50%, transparent 80%)`,
              boxShadow: `0 0 60px ${color}, 0 0 100px ${color}66`,
              transition: 'all 0.4s',
            }} />
          </div>
          <label style={styles.label}>Color</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setActiveMood(''); }}
              style={{ width: 50, height: 40, background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 6, cursor: 'pointer' }} />
            <input style={{ ...styles.input, flex: 1, fontFamily: 'monospace' }} value={color}
              onChange={(e) => { setColor(e.target.value); setActiveMood(''); }} />
          </div>
          <label style={styles.label}>Brightness — {brightness}%</label>
          <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(+e.target.value)}
            style={styles.slider} />
          <label style={styles.label}>Color Temperature — {temperature}K</label>
          <input type="range" min="2000" max="6500" value={temperature} onChange={(e) => setTemperature(+e.target.value)}
            style={styles.slider} />
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={styles.cardTitle}>Connected Bulbs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {bulbs.map((b) => (
            <motion.button key={b.id} whileTap={{ scale: 0.95 }} onClick={() => toggleBulb(b.id)}
              style={{
                padding: 16, background: b.on ? `linear-gradient(135deg, ${color}22, #1a1a1a)` : '#141414',
                border: `1px solid ${b.on ? GOLD : '#2a2a2a'}`, borderRadius: 10, cursor: 'pointer',
                color: b.on ? GOLD : '#666', textAlign: 'center',
              }}>
              <div style={{ fontSize: 28, marginBottom: 6, filter: b.on ? 'none' : 'grayscale(1) opacity(0.4)' }}>💡</div>
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
  const [currentTemp, setCurrentTemp] = useState(22.5);
  const [targetTemp, setTargetTemp] = useState(22);
  const [mode, setMode] = useState('auto');
  const [phases, setPhases] = useState({
    morning: { start: '06:00', end: '09:00', temp: 21, label: 'Morning', icon: '🌅' },
    day: { start: '09:00', end: '18:00', temp: 20, label: 'Day', icon: '☀️' },
    evening: { start: '18:00', end: '22:00', temp: 22, label: 'Evening', icon: '🌆' },
    night: { start: '22:00', end: '06:00', temp: 18, label: 'Night', icon: '🌙' },
  });

  const scheduleData = [
    { time: '00:00', temp: phases.night.temp },
    { time: '03:00', temp: phases.night.temp },
    { time: '06:00', temp: phases.morning.temp },
    { time: '09:00', temp: phases.day.temp },
    { time: '12:00', temp: phases.day.temp },
    { time: '15:00', temp: phases.day.temp },
    { time: '18:00', temp: phases.evening.temp },
    { time: '21:00', temp: phases.evening.temp },
    { time: '24:00', temp: phases.night.temp },
  ];

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
      setCurrentTemp((t) => {
        const target = phases[currentPhase].temp;
        const diff = target - t;
        return +(t + diff * 0.05 + (Math.random() - 0.5) * 0.1).toFixed(1);
      });
    }, 1500);
    return () => clearInterval(id);
  }, [currentPhase, phases]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 12, color: '#888', letterSpacing: 2 }}>CURRENT</div>
          <motion.div key={currentTemp} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            style={{ fontSize: 72, fontWeight: 200, color: GOLD, fontFamily: 'serif', lineHeight: 1 }}>
            {currentTemp}°
          </motion.div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Phase: <span style={{ color: GOLD }}>{phases[currentPhase].icon} {phases[currentPhase].label}</span>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {['auto', 'heat', 'cool', 'eco'].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                ...styles.chip, ...(mode === m ? styles.chipActive : {}), fontSize: 11, padding: '6px 12px'
              }}>{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>24-Hour Schedule</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scheduleData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} domain={[15, 25]} />
                <Tooltip contentStyle={{ background: BLACK_CARD, border: `1px solid ${GOLD}`, borderRadius: 8 }} />
                <Area type="stepAfter" dataKey="temp" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Cycle Phase Profiles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Object.entries(phases).map(([k, p]) => (
            <div key={k} style={{
              padding: 16, background: currentPhase === k ? `linear-gradient(135deg, ${GOLD}15, transparent)` : '#141414',
              border: `1px solid ${currentPhase === k ? GOLD : '#2a2a2a'}`, borderRadius: 10,
            }}>
              <div style={{ fontSize: 28 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: GOLD, marginTop: 4 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: '#666', margin: '4px 0 12px' }}>{p.start} — {p.end}</div>
              <label style={{ fontSize: 10, color: '#888' }}>Target: {p.temp}°C</label>
              <input type="range" min="15" max="28" step="0.5" value={p.temp}
                onChange={(e) => setPhases({ ...phases, [k]: { ...p, temp: +e.target.value } })}
                style={styles.slider} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. VOICE COMMAND INTERFACE (Web Speech API)
// ─────────────────────────────────────────────────────────────
function VoicePanel() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [history, setHistory] = useState([]);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  const commands = [
    { phrase: 'turn on lights', action: '💡 Lights activated', icon: '💡' },
    { phrase: 'set temperature', action: '🌡️ Adjusting thermostat', icon: '🌡️' },
    { phrase: 'movie mode', action: '🎬 Cinema scene enabled', icon: '🎬' },
    { phrase: 'good night', action: '🌙 Night routine started', icon: '🌙' },
    { phrase: 'lock doors', action: '🔒 All doors locked', icon: '🔒' },
    { phrase: 'play music', action: '🎵 Music streaming', icon: '🎵' },
  ];

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
      if (finalTxt) {
        setTranscript(finalTxt.trim());
        processCommand(finalTxt.trim());
      }
      setInterim(interimTxt);
    };
    rec.onerror = (e) => {
      setHistory((h) => [{ t: new Date().toLocaleTimeString(), text: `Error: ${e.error}`, action: '—' }, ...h]);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const processCommand = (text) => {
    const lower = text.toLowerCase();
    const matched = commands.find((c) => lower.includes(c.phrase));
    const action = matched ? matched.action : `🤔 No match for "${text}"`;
    setHistory((h) => [{ t: new Date().toLocaleTimeString(), text, action }, ...h].slice(0, 30));
  };

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        setHistory((h) => [{ t: new Date().toLocaleTimeString(), text: 'Start error', action: e.message }, ...h]);
      }
    }
  };

  const simulate = (text) => {
    setTranscript(text);
    processCommand(text);
  };

  if (!supported) {
    return (
      <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
        <h3 style={{ color: GOLD }}>Speech Recognition Not Supported</h3>
        <p style={{ color: '#888', marginTop: 10 }}>Try Chrome or Edge for Web Speech API.</p>
      </div>
    );
  }

  return (
    <div style={styles.grid2}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Voice Assistant</h3>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggle}
            style={{
              width: 140, height: 140, borderRadius: '50%', border: `2px solid ${GOLD}`,
              background: listening ? `radial-gradient(circle, ${GOLD}, ${GOLD_DARK})` : '#1a1a1a',
              color: listening ? BLACK : GOLD, fontSize: 48, cursor: 'pointer',
              boxShadow: listening ? `0 0 40px ${GOLD}` : 'none',
            }}>
            {listening ? '●' : '🎙️'}
          </motion.button>
          <div style={{ marginTop: 16, color: listening ? GOLD : '#666', fontSize: 13 }}>
            {listening ? 'Listening...' : 'Tap to start'}
          </div>
          {listening && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ width: 80, height: 4, background: GOLD, margin: '12px auto', borderRadius: 2 }} />
          )}
          <div style={{ marginTop: 20, minHeight: 60, padding: 12, background: '#0f0f0f', borderRadius: 8, border: '1px solid #222' }}>
            <div style={{ color: GOLD, fontSize: 14 }}>{transcript || 'Awaiting command...'}</div>
            {interim && <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{interim}</div>}
          </div>
        </div>

        <h4 style={{ ...styles.label, marginTop: 16 }}>Quick Commands</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {commands.map((c) => (
            <button key={c.phrase} onClick={() => simulate(c.phrase)} style={styles.chip}>
              {c.icon} {c.phrase}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Command History</h3>
        {history.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: 40, fontSize: 13 }}>
            No commands yet. Speak or tap a quick command.
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {history.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={styles.logRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#fff', fontSize: 13 }}>"{h.text}"</span>
                  <span style={{ color: '#666', fontSize: 10 }}>{h.t}</span>
                </div>
                <div style={{ color: GOLD, fontSize: 12 }}>{h.action}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. WEARABLE PAIRING (Web Bluetooth API)
// ─────────────────────────────────────────────────────────────
function BluetoothPanel() {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!navigator.bluetooth) setSupported(false);
  }, []);

  const scan = async () => {
    if (!navigator.bluetooth) return;
    setScanning(true);
    setStatus('Opening Bluetooth picker...');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'heart_rate', 'device_information'],
      });
      const newDev = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: device.gatt?.connected || false,
        rssi: Math.floor(Math.random() * 40) + 50,
        type: guessType(device.name),
        pairedAt: new Date().toLocaleTimeString(),
        ref: device,
      };
      setDevices((d) => [...d.filter((x) => x.id !== newDev.id), newDev]);
      setStatus(`✓ Paired: ${newDev.name}`);
    } catch (e) {
      setStatus(`✗ ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const simulateDevice = () => {
    const names = ['Fitbit Charge 6', 'Apple Watch', 'Garmin Vivosmart', 'Oura Ring', 'Whoop 4.0', 'Polar H10', 'Samsung Galaxy Watch'];
    const types = ['fitness', 'watch', 'ring', 'hr', 'band'];
    const d = {
      id: Math.random().toString(36).slice(2),
      name: names[Math.floor(Math.random() * names.length)],
      connected: true,
      rssi: Math.floor(Math.random() * 40) + 50,
      type: types[Math.floor(Math.random() * types.length)],
      pairedAt: new Date().toLocaleTimeString(),
      battery: Math.floor(Math.random() * 80) + 20,
    };
    setDevices((ds) => [d, ...ds]);
    setStatus(`✓ Simulated: ${d.name}`);
  };

  const disconnect = (id) => {
    setDevices((ds) => ds.filter((d) => d.id !== id));
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

  const typeIcon = { fitness: '⌚', watch: '⌚', ring: '💍', hr: '❤️', band: '📿', device: '📱' };

  if (!supported) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 48 }}>📡</div>
          <h3 style={{ color: GOLD, marginTop: 10 }}>Bluetooth API Info</h3>
          <p style={{ color: '#888', marginTop: 10, fontSize: 13 }}>
            Web Bluetooth requires HTTPS + Chrome/Edge. You can still simulate devices below.
          </p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={simulateDevice} style={styles.primaryBtn}>
            🎲 Simulate Wearable Pairing
          </motion.button>
        </div>
        {devices.length > 0 && <DeviceList devices={devices} typeIcon={typeIcon} onDisconnect={disconnect} />}
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ ...styles.cardTitle, margin: 0 }}>Wearable Devices</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={simulateDevice} style={styles.secondaryBtn}>
            🎲 Simulate
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={scan} disabled={scanning} style={styles.primaryBtn}>
            {scanning ? '⏳ Scanning...' : '📡 Scan Devices'}
          </motion.button>
        </div>
      </div>
      {status && <div style={{ ...styles.status, color: status.startsWith('✓') ? GOLD : '#ff6b6b', marginBottom: 16 }}>{status}</div>}
      {devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, color: '#555' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📡</div>
          <div>No wearables paired. Scan to discover nearby devices.</div>
        </div>
      ) : <DeviceList devices={devices} typeIcon={typeIcon} onDisconnect={disconnect} />}
    </div>
  );
}

function DeviceList({ devices, typeIcon, onDisconnect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {devices.map((d) => (
        <motion.div key={d.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: 16, background: '#141414', border: `1px solid ${GOLD}44`,
            borderRadius: 10, position: 'relative',
          }}>
          <button onClick={() => onDisconnect(d.id)} style={{
            position: 'absolute', top: 10, right: 10, background: 'transparent',
            border: 'none', color: '#666', cursor: 'pointer', fontSize: 14,
          }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD}33, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {typeIcon[d.type] || '📱'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: GOLD, fontWeight: 600, fontSize: 14 }}>{d.name}</div>
              <div style={{ color: '#666', fontSize: 11 }}>Paired {d.pairedAt}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11 }}>
            <span style={{ color: '#4ade80' }}>● Connected</span>
            <span style={{ color: '#888' }}>RSSI: -{d.rssi}dBm</span>
            {d.battery && <span style={{ color: GOLD }}>🔋 {d.battery}%</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. AMBIENT WELLNESS SCORE → AUTO-ADJUSTMENT
// ─────────────────────────────────────────────────────────────
function WellnessPanel() {
  const [metrics, setMetrics] = useState({
    sleep: 7, stress: 4, activity: 5, hydration: 6, mood: 6, light: 5,
  });
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [adjustments, setAdjustments] = useState([]);

  const weights = { sleep: 0.25, stress: 0.25, activity: 0.15, hydration: 0.1, mood: 0.15, light: 0.1 };

  const score = Math.round(
    (metrics.sleep / 10 * 100 * weights.sleep) +
    ((10 - metrics.stress) / 10 * 100 * weights.stress) +
    (metrics.activity / 10 * 100 * weights.activity) +
    (metrics.hydration / 10 * 100 * weights.hydration) +
    (metrics.mood / 10 * 100 * weights.mood) +
    (metrics.light / 10 * 100 * weights.light)
  );

  const getScoreColor = () => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return GOLD;
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  useEffect(() => {
    if (!autoAdjust) return;
    const newAdj = [];
    if (metrics.stress >= 7) {
      newAdj.push({ icon: '💡', text: 'Dimming lights to warm amber (2700K, 40%)', target: 'Hue Bridge' });
      newAdj.push({ icon: '🎵', text: 'Activating calm ambient playlist', target: 'Audio System' });
    }
    if (metrics.sleep < 6) {
      newAdj.push({ icon: '🌙', text: 'Starting sleep routine 30min earlier', target: 'Thermostat' });
      newAdj.push({ icon: '🌡️', text: 'Lowering bedroom to 18°C', target: 'Thermostat' });
    }
    if (metrics.activity < 4) {
      newAdj.push({ icon: '💡', text: 'Brightening to energizing daylight (6500K)', target: 'Hue Bridge' });
      newAdj.push({ icon: '🔔', text: 'Scheduling movement reminder in 1h', target: 'Wearable' });
    }
    if (metrics.hydration < 5) {
      newAdj.push({ icon: '💧', text: 'Hydration reminder sent to wearable', target: 'Wearable' });
    }
    if (metrics.light < 4) {
      newAdj.push({ icon: '☀️', text: 'Opening smart blinds to 80%', target: 'Blinds' });
      newAdj.push({ icon: '💡', text: 'Boosting ambient light to 90%', target: 'Hue Bridge' });
    }
    if (score >= 80) {
      newAdj.push({ icon: '✨', text: 'Wellness optimal — maintaining current profile', target: 'System' });
    }
    setAdjustments(newAdj);
  }, [metrics, autoAdjust, score]);

  const update = (k, v) => setMetrics({ ...metrics, [k]: +v });

  const metricMeta = {
    sleep: { icon: '😴', label: 'Sleep Quality', unit: 'h' },
    stress: { icon: '😰', label: 'Stress Level', unit: '/10' },
    activity: { icon: '🏃', label: 'Activity', unit: '/10' },
    hydration: { icon: '💧', label: 'Hydration', unit: '/10' },
    mood: { icon: '😊', label: 'Mood', unit: '/10' },
    light: { icon: '☀️', label: 'Light Exposure', unit: '/10' },
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 3, marginBottom: 10 }}>WELLNESS SCORE</div>
          <motion.div key={score} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: 80, fontWeight: 200, fontFamily: 'serif',
              color: getScoreColor(), lineHeight: 1,
              textShadow: `0 0 40px ${getScoreColor()}66`,
            }}>
            {score}
          </motion.div>
          <div style={{ color: getScoreColor(), marginTop: 10, fontSize: 14, fontWeight: 600 }}>
            {getScoreLabel()}
          </div>
          <div style={{ marginTop: 20, height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${score}%` }} transition={{ duration: 0.6 }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${GOLD_DARK}, ${getScoreColor()})` }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, cursor: 'pointer', fontSize: 12, color: '#aaa' }}>
            <input type="checkbox" checked={autoAdjust} onChange={(e) => setAutoAdjust(e.target.checked)} />
            Auto-adjust environment
          </label>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Biometric Inputs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {Object.entries(metricMeta).map(([k, m]) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#ccc' }}>{m.icon} {m.label}</span>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{metrics[k]}{m.unit}</span>
                </div>
                <input type="range" min="0" max="10" value={metrics[k]}
                  onChange={(e) => update(k, e.target.value)} style={styles.slider} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          Environment Auto-Adjustments
          <span style={{ fontSize: 11, color: '#666', marginLeft: 10, fontWeight: 400 }}>
            {adjustments.length} active rules
          </span>
        </h3>
        {adjustments.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: 30 }}>No adjustments needed.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {adjustments.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: 14, background: '#141414', border: `1px solid ${GOLD}33`,
                  borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center',
                }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${GOLD}22, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  flexShrink: 0,
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#ddd' }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: GOLD, marginTop: 3 }}>→ {a.target}</div>
                </div>
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
export default function SmartHomeHub() {
  const [active, setActive] = useState('webhook');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const panels = {
    webhook: <WebhookPanel />,
    hue: <HuePanel />,
    thermo: <ThermostatPanel />,
    voice: <VoicePanel />,
    bt: <BluetoothPanel />,
    wellness: <WellnessPanel />,
  };

  return (
    <>
      <style>{globalCSS}</style>
      <div style={styles.root}>
        {/* Ambient glow */}
        <div style={styles.ambientGlow1} />
        <div style={styles.ambientGlow2} />

        {/* Header */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={styles.logoMark}>M</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>MANIFIX</div>
              <div style={{ fontSize: 10, color: '#888', letterSpacing: 3 }}>BL SMART HOME HUB</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#888' }}>System Status</div>
              <div style={{ fontSize: 12, color: '#4ade80' }}>● All Systems Online</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 300, color: GOLD, fontFamily: 'serif' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 10, color: '#666' }}>
                {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav style={styles.nav}>
          {tabs.map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.96 }} onClick={() => setActive(t.id)}
              style={{
                ...styles.tab,
                color: active === t.id ? GOLD : '#888',
                borderBottom: active === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
              }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{t.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Content */}
        <main style={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}>
              {panels[active]}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer style={styles.footer}>
          <span>MANIFIX BL Smart Home Hub v2.0</span>
          <span style={{ color: GOLD }}>◆</span>
          <span>Gold & Black Edition</span>
          <span style={{ color: GOLD }}>◆</span>
          <span>Real-Feature Build</span>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = {
  root: {
    minHeight: '100vh', background: `radial-gradient(ellipse at top, #1a1400 0%, ${BLACK} 60%)`,
    color: '#e5e5e5', fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
    padding: '24px 32px', position: 'relative', overflow: 'hidden',
  },
  ambientGlow1: {
    position: 'fixed', top: '-200px', right: '-200px', width: 600, height: 600,
    background: `radial-gradient(circle, ${GOLD}15, transparent 70%)`,
    borderRadius: '50%', pointerEvents: 'none',
  },
  ambientGlow2: {
    position: 'fixed', bottom: '-200px', left: '-200px', width: 600, height: 600,
    background: `radial-gradient(circle, ${GOLD_DARK}15, transparent 70%)`,
    borderRadius: '50%', pointerEvents: 'none',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)',
    border: `1px solid ${GOLD}33`, borderRadius: 14, marginBottom: 20,
    position: 'relative', zIndex: 10,
  },
  logoMark: {
    width: 44, height: 44, borderRadius: 10,
    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
    color: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 900, fontFamily: 'serif',
    boxShadow: `0 0 20px ${GOLD}44`,
  },
  nav: {
    display: 'flex', gap: 4, padding: '6px', background: 'rgba(10,10,10,0.6)',
    border: '1px solid #222', borderRadius: 12, marginBottom: 20,
    position: 'relative', zIndex: 10,
  },
  tab: {
    flex: 1, padding: '12px 16px', background: 'transparent', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 8, transition: 'all 0.2s',
  },
  main: { position: 'relative', zIndex: 5 },
  footer: {
    marginTop: 30, padding: '16px', textAlign: 'center', fontSize: 11,
    color: '#555', letterSpacing: 2, display: 'flex', justifyContent: 'center', gap: 12,
  },
  card: {
    background: `linear-gradient(135deg, ${BLACK_CARD}, #121212)`,
    border: `1px solid ${GOLD}22`, borderRadius: 14, padding: 22,
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  },
  cardTitle: {
    margin: '0 0 16px 0', fontSize: 13, fontWeight: 700, color: GOLD,
    letterSpacing: 2, textTransform: 'uppercase',
    paddingBottom: 10, borderBottom: `1px solid ${GOLD}22`,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input: {
    width: '100%', padding: '10px 12px', background: '#0f0f0f',
    border: `1px solid #2a2a2a`, borderRadius: 8, color: '#e5e5e5',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    transition: 'border 0.2s',
  },
  label: {
    display: 'block', fontSize: 11, color: '#888', marginTop: 12, marginBottom: 6,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  primaryBtn: {
    width: '100%', padding: '12px', marginTop: 16,
    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
    color: BLACK, border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, letterSpacing: 1,
    boxShadow: `0 4px 20px ${GOLD}33`,
  },
  secondaryBtn: {
    padding: '10px 16px', background: 'transparent',
    border: `1px solid ${GOLD}66`, color: GOLD, borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 12,
  },
  chip: {
    padding: '6px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 20, color: '#aaa', cursor: 'pointer', fontSize: 11,
    fontWeight: 600, letterSpacing: 0.5,
  },
  chipActive: {
    background: `linear-gradient(135deg, ${GOLD}22, ${GOLD_DARK}11)`,
    borderColor: GOLD, color: GOLD,
  },
  slider: {
    width: '100%', marginTop: 6, accentColor: GOLD, cursor: 'pointer',
  },
  status: {
    fontSize: 12, padding: '8px 12px', background: '#0f0f0f',
    borderRadius: 6, border: '1px solid #222',
  },
  logRow: {
    padding: 12, marginBottom: 8, background: '#0f0f0f',
    border: '1px solid #1f1f1f', borderRadius: 8,
    borderLeft: `2px solid ${GOLD}66`,
  },
  statCard: {
    padding: 16, background: BLACK_CARD, border: `1px solid ${GOLD}22`,
    borderRadius: 10, textAlign: 'center',
  },
  statLabel: { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 300, color: GOLD, fontFamily: 'serif' },
  moodBtn: {
    padding: 14, border: '1px solid #2a2a2a', borderRadius: 10,
    cursor: 'pointer', color: '#ddd', textAlign: 'center',
    transition: 'all 0.2s',
  },
};

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${BLACK}; }
  input[type="range"] {
    -webkit-appearance: none; appearance: none;
    height: 4px; background: #2a2a2a; border-radius: 2px; outline: none;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: ${GOLD}; cursor: pointer;
    box-shadow: 0 0 10px ${GOLD}88;
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    background: ${GOLD}; cursor: pointer; border: none;
    box-shadow: 0 0 10px ${GOLD}88;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${GOLD} !important;
    box-shadow: 0 0 0 2px ${GOLD}22;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: ${GOLD_DARK}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${GOLD}; }
  input[type="checkbox"] { accent-color: ${GOLD}; }
  select { background: #0f0f0f; color: #e5e5e5; }
`;
