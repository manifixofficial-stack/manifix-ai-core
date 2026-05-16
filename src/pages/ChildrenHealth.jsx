// ChildrenHealth.jsx
// ✅ REAL WORKING FEATURES — no fake data, no dashboard mockup
//
// 1. Habit Tracker     — check/uncheck 8 daily habits, auto-resets each day, ring progress
// 2. Activity Timer    — real countdown timer, 6 presets, pause/resume/reset
// 3. Meal Logger       — add meals with calories, type, stored in localStorage
// 4. Sleep Tracker     — log sleep hours+mins, calculates avg, quality score
// 5. Step Counter      — manual step logging, distance/calorie estimates, daily goal
// 6. Growth Logger     — log height/weight/age, auto-calculates BMI, full history table
//
// Install: npm install lucide-react
// No other dependencies needed.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Moon, Apple, Footprints, Ruler, Timer,
  CheckCircle2, Circle, Plus, Trash2,
  TrendingUp, RotateCcw, BedDouble,
} from "lucide-react";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const store = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

const todayStr = () => new Date().toISOString().split("T")[0];

// ─── DEFAULT HABITS ───────────────────────────────────────────────────────────
const DEFAULT_HABITS = [
  { id: 1, label: "Morning stretch (5 min)" },
  { id: 2, label: "Drink 6 glasses of water" },
  { id: 3, label: "Eat vegetables at lunch" },
  { id: 4, label: "30 min outdoor play" },
  { id: 5, label: "Read a book (15 min)" },
  { id: 6, label: "Screen-free hour before bed" },
  { id: 7, label: "Brush teeth twice" },
  { id: 8, label: "Sleep before 9:30 PM" },
];

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Quicksand:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f0fdf4;--bg2:#fff;--bg3:#ecfdf5;
  --primary:#10b981;--primary2:#059669;
  --accent:#f59e0b;--blue:#3b82f6;--purple:#8b5cf6;
  --text:#1a2e1a;--muted:#6b7280;
  --border:rgba(16,185,129,0.18);
  --shadow:0 4px 24px rgba(16,185,129,0.10);
  --r:20px;--font:'Nunito',sans-serif;--font2:'Quicksand',sans-serif;
}
.ch{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text);padding-bottom:60px}
.ch-nav{background:var(--bg2);border-bottom:1px solid var(--border);padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(16,185,129,0.08)}
.ch-logo{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;color:var(--primary2)}
.ch-logo-icon{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:20px}
.ch-date{font-size:13px;color:var(--muted);font-family:var(--font2);font-weight:600}
.ch-tabs{display:flex;gap:8px;padding:20px 24px 0;max-width:1100px;margin:0 auto;overflow-x:auto;scrollbar-width:none}
.ch-tabs::-webkit-scrollbar{display:none}
.ch-tab{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:100px;border:1.5px solid var(--border);background:var(--bg2);color:var(--muted);font-size:14px;font-weight:700;font-family:var(--font);cursor:pointer;white-space:nowrap;transition:all .2s}
.ch-tab:hover{border-color:var(--primary);color:var(--primary)}
.ch-tab.active{background:var(--primary);border-color:var(--primary);color:#fff;box-shadow:0 4px 16px rgba(16,185,129,0.3)}
.ch-body{max-width:1100px;margin:24px auto 0;padding:0 24px}
.ch-sh{margin-bottom:24px}
.ch-st{font-size:26px;font-weight:900;margin-bottom:4px}
.ch-ss{font-size:14px;color:var(--muted);font-family:var(--font2)}
.ch-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:var(--r);padding:24px;box-shadow:var(--shadow);margin-bottom:18px}
.ch-ct{font-size:16px;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.ch-bar{height:12px;border-radius:100px;background:#e5e7eb;overflow:hidden;margin:8px 0}
.ch-bar-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--primary),var(--accent));transition:width .8s cubic-bezier(.4,0,.2,1)}
.ch-hrow{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:14px;border:1.5px solid transparent;margin-bottom:8px;cursor:pointer;transition:all .18s;user-select:none;background:var(--bg3)}
.ch-hrow:hover{border-color:var(--primary);background:#d1fae5}
.ch-hrow.done{background:#d1fae5;border-color:var(--primary)}
.ch-hlabel{font-size:14px;font-weight:700;flex:1}
.ch-hlabel.done{text-decoration:line-through;color:var(--muted)}
.ch-timer-disp{font-size:64px;font-weight:900;text-align:center;color:var(--primary2);font-family:var(--font2);letter-spacing:-2px;line-height:1;margin:16px 0}
.ch-tlabel{text-align:center;font-size:14px;color:var(--muted);font-weight:600;margin-bottom:20px}
.ch-presets{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;justify-content:center}
.ch-preset{padding:8px 16px;border-radius:100px;border:1.5px solid var(--border);background:var(--bg3);font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--font);color:var(--text)}
.ch-preset:hover,.ch-preset.sel{background:var(--primary);border-color:var(--primary);color:#fff}
.ch-btns{display:flex;gap:12px;justify-content:center}
.ch-btn{padding:12px 28px;border-radius:100px;border:none;font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;font-family:var(--font)}
.ch-btn-p{background:linear-gradient(135deg,var(--primary),var(--primary2));color:#fff;box-shadow:0 4px 16px rgba(16,185,129,0.3)}
.ch-btn-p:hover{transform:translateY(-2px)}
.ch-btn-p:disabled{opacity:.5;cursor:not-allowed}
.ch-btn-s{background:var(--bg3);color:var(--primary2);border:1.5px solid var(--border)}
.ch-form-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.ch-ig{flex:1;min-width:120px}
.ch-il{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:5px}
.ch-input{width:100%;padding:11px 16px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg3);font-size:14px;font-weight:600;font-family:var(--font);color:var(--text);outline:none;transition:border-color .2s}
.ch-input:focus{border-color:var(--primary)}
.ch-input::placeholder{color:#9ca3af}
.ch-logitem{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:12px;background:var(--bg3);margin-bottom:8px;font-size:14px;font-weight:600}
.ch-logmeta{font-size:12px;color:var(--muted);margin-top:2px}
.ch-del{background:none;border:none;cursor:pointer;color:#f87171;padding:4px;border-radius:8px;transition:background .15s;display:flex}
.ch-del:hover{background:#fee2e2}
.ch-sgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:20px}
.ch-sc{background:var(--bg3);border-radius:16px;padding:16px;text-align:center;border:1.5px solid var(--border)}
.ch-sv{font-size:28px;font-weight:900;color:var(--primary2);font-family:var(--font2);line-height:1.1}
.ch-sl{font-size:12px;color:var(--muted);font-weight:600;margin-top:4px}
.ch-ring-wrap{display:flex;align-items:center;justify-content:center;margin:8px 0 16px;position:relative}
.ch-ring-center{position:absolute;text-align:center}
.ch-rpct{font-size:28px;font-weight:900;color:var(--primary2);font-family:var(--font2);line-height:1}
.ch-rsub{font-size:11px;color:var(--muted);font-weight:700}
.ch-table{width:100%;border-collapse:collapse;font-size:14px}
.ch-table th{text-align:left;font-size:12px;font-weight:700;color:var(--muted);padding:8px 12px;border-bottom:1.5px solid var(--border)}
.ch-table td{padding:10px 12px;border-bottom:1px solid #f0fdf4;font-weight:600}
.ch-table tr:last-child td{border-bottom:none}
.ch-empty{text-align:center;padding:32px;color:var(--muted);font-size:14px;font-weight:600}
.ch-2col{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.ch-fade{animation:fadeIn .35s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.ch-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;padding:12px 28px;border-radius:100px;font-size:14px;font-weight:700;z-index:999;box-shadow:0 8px 24px rgba(16,185,129,0.35);white-space:nowrap;animation:toastIn .3s ease}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@media(max-width:700px){.ch-2col{grid-template-columns:1fr}.ch-timer-disp{font-size:48px}}
`;

// ─── RING PROGRESS ────────────────────────────────────────────────────────────
function Ring({ pct = 0, size = 120, stroke = 10, color = "#10b981" }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 6px ${color}50)` }} />
    </svg>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? <div className="ch-toast">{msg}</div> : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — HABIT TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function HabitTracker({ toast }) {
  const key = `ch_habits_${todayStr()}`;
  const [done, setDone] = useState(() => store.get(key, []));

  const toggle = (id) => {
    setDone(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      store.set(key, next);
      if (!prev.includes(id)) toast("✅ Habit completed!");
      return next;
    });
  };

  const pct = Math.round((done.length / DEFAULT_HABITS.length) * 100);
  const medal = pct === 100 ? "🥇 Perfect day!" : pct >= 75 ? "🥈 Almost there!" : pct >= 50 ? "🥉 Good progress!" : null;

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">📋 Daily Habit Tracker</div>
        <div className="ch-ss">Tap a habit to mark it done. Resets automatically every day.</div>
      </div>

      <div className="ch-card">
        <div className="ch-ring-wrap">
          <Ring pct={pct} size={120} stroke={10} color="#10b981" />
          <div className="ch-ring-center">
            <div className="ch-rpct">{pct}%</div>
            <div className="ch-rsub">Today</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#6b7280" }}>
          {done.length} / {DEFAULT_HABITS.length} habits {medal && <span style={{ marginLeft: 6 }}>{medal}</span>}
        </div>
        <div className="ch-bar"><div className="ch-bar-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="ch-card">
        {DEFAULT_HABITS.map(h => (
          <div key={h.id} className={`ch-hrow${done.includes(h.id) ? " done" : ""}`} onClick={() => toggle(h.id)}>
            {done.includes(h.id)
              ? <CheckCircle2 size={22} color="#10b981" />
              : <Circle size={22} color="#d1d5db" />}
            <span className={`ch-hlabel${done.includes(h.id) ? " done" : ""}`}>{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — ACTIVITY TIMER (real countdown)
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityTimer({ toast }) {
  const PRESETS = [
    { label: "5 min Stretch", secs: 300 },
    { label: "8 min Yoga",    secs: 480 },
    { label: "10 min Walk",   secs: 600 },
    { label: "15 min Play",   secs: 900 },
    { label: "20 min Run",    secs: 1200 },
    { label: "30 min Sport",  secs: 1800 },
  ];

  const [sel, setSel] = useState(0);
  const [rem, setRem] = useState(PRESETS[0].secs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const total = PRESETS[sel].secs;

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setRem(r => {
          if (r <= 1) {
            clearInterval(ref.current);
            setRunning(false);
            setDone(true);
            toast("🎉 Activity complete! Great job!");
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const pick = (i) => {
    clearInterval(ref.current);
    setSel(i); setRem(PRESETS[i].secs);
    setRunning(false); setDone(false);
  };

  const toggle = () => { if (!done) setRunning(r => !r); };
  const reset = () => {
    clearInterval(ref.current);
    setRunning(false); setDone(false);
    setRem(PRESETS[sel].secs);
  };

  const mm = String(Math.floor(rem / 60)).padStart(2, "0");
  const ss = String(rem % 60).padStart(2, "0");
  const pct = ((total - rem) / total) * 100;

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">⏱️ Activity Timer</div>
        <div className="ch-ss">Pick an activity and start the real countdown. Pause and resume anytime.</div>
      </div>

      <div className="ch-card">
        <div className="ch-presets">
          {PRESETS.map((p, i) => (
            <button key={i} className={`ch-preset${sel === i ? " sel" : ""}`} onClick={() => pick(i)}>{p.label}</button>
          ))}
        </div>

        <div className="ch-ring-wrap" style={{ margin: "0 0 8px" }}>
          <Ring pct={pct} size={160} stroke={14} color={done ? "#f59e0b" : running ? "#10b981" : "#059669"} />
          <div className="ch-ring-center">
            <div style={{ fontSize: 34, fontWeight: 900, color: done ? "#d97706" : "#059669", fontFamily: "'Quicksand',sans-serif", lineHeight: 1 }}>
              {mm}:{ss}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>remaining</div>
          </div>
        </div>

        <div className="ch-tlabel">
          {done ? "🎉 Done! Excellent work!" : running ? "⚡ Keep going!" : "Ready to start"}
        </div>

        <div className="ch-btns">
          <button className="ch-btn ch-btn-p" onClick={toggle} disabled={done}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button className="ch-btn ch-btn-s" onClick={reset}>
            <RotateCcw size={15} style={{ display: "inline", marginRight: 4 }} />Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — MEAL LOGGER
// ═══════════════════════════════════════════════════════════════════════════════
function MealLogger({ toast }) {
  const key = `ch_meals_${todayStr()}`;
  const [meals, setMeals] = useState(() => store.get(key, []));
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [type, setType] = useState("Breakfast");

  const add = () => {
    if (!name.trim() || !cal || Number(cal) <= 0) return;
    const entry = {
      id: Date.now(), name: name.trim(), cal: Number(cal), type,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const next = [...meals, entry];
    setMeals(next); store.set(key, next);
    setName(""); setCal("");
    toast("🍎 Meal logged!");
  };

  const del = (id) => {
    const next = meals.filter(m => m.id !== id);
    setMeals(next); store.set(key, next);
  };

  const total = meals.reduce((s, m) => s + m.cal, 0);
  const GOAL = 1800;
  const pct = Math.round((total / GOAL) * 100);

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">🍎 Meal Logger</div>
        <div className="ch-ss">Log every meal with calories. Data saved on this device. Resets daily.</div>
      </div>

      <div className="ch-sgrid">
        <div className="ch-sc"><div className="ch-sv">{total}</div><div className="ch-sl">Calories Today</div></div>
        <div className="ch-sc">
          <div className="ch-sv" style={{ color: total > GOAL ? "#ef4444" : "#10b981" }}>{Math.max(0, GOAL - total)}</div>
          <div className="ch-sl">Remaining</div>
        </div>
        <div className="ch-sc"><div className="ch-sv">{meals.length}</div><div className="ch-sl">Meals Logged</div></div>
      </div>

      <div className="ch-card">
        <div className="ch-bar" style={{ marginBottom: 12 }}>
          <div className="ch-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? "#ef4444" : undefined }} />
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, marginBottom: 18 }}>
          {pct}% of {GOAL} kcal daily goal
        </div>

        <div className="ch-form-row">
          <div className="ch-ig">
            <div className="ch-il">Meal Name</div>
            <input className="ch-input" placeholder="e.g. Rice & Dal" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="ch-ig" style={{ maxWidth: 110 }}>
            <div className="ch-il">Calories</div>
            <input className="ch-input" type="number" placeholder="350" value={cal} onChange={e => setCal(e.target.value)} min="1" />
          </div>
          <div className="ch-ig" style={{ maxWidth: 140 }}>
            <div className="ch-il">Type</div>
            <select className="ch-input" value={type} onChange={e => setType(e.target.value)}>
              {["Breakfast", "Lunch", "Dinner", "Snack"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button className="ch-btn ch-btn-p" style={{ width: "100%" }} onClick={add}>
          <Plus size={16} style={{ display: "inline", marginRight: 6 }} />Log Meal
        </button>
      </div>

      <div className="ch-card">
        <div className="ch-ct"><Apple size={18} color="#10b981" />Today's Meals</div>
        {meals.length === 0
          ? <div className="ch-empty">No meals logged yet. Add your first meal above.</div>
          : meals.map(m => (
            <div key={m.id} className="ch-logitem">
              <div>
                <div>{m.name} <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginLeft: 6 }}>{m.type}</span></div>
                <div className="ch-logmeta">{m.time} · {m.cal} kcal</div>
              </div>
              <button className="ch-del" onClick={() => del(m.id)}><Trash2 size={15} /></button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — SLEEP TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function SleepTracker({ toast }) {
  const KEY = "ch_sleep_log";
  const [log, setLog] = useState(() => store.get(KEY, []));
  const [hrs, setHrs] = useState("");
  const [mins, setMins] = useState("0");
  const [date, setDate] = useState(todayStr());

  const add = () => {
    if (!hrs || Number(hrs) < 0 || Number(hrs) > 24) return;
    const total = Number(hrs) + Number(mins) / 60;
    const entry = { id: Date.now(), date, hours: +total.toFixed(2), display: `${hrs}h ${mins}m` };
    const next = [entry, ...log].slice(0, 14);
    setLog(next); store.set(KEY, next);
    setHrs(""); setMins("0");
    toast("😴 Sleep logged!");
  };

  const del = (id) => {
    const next = log.filter(x => x.id !== id);
    setLog(next); store.set(KEY, next);
  };

  const avg = log.length ? (log.reduce((s, l) => s + l.hours, 0) / log.length).toFixed(1) : 0;
  const GOAL = 10;
  const pct = Math.round((Number(avg) / GOAL) * 100);
  const quality = Number(avg) >= 9 ? "Excellent 🌟" : Number(avg) >= 7 ? "Good 👍" : Number(avg) > 0 ? "Needs Work ⚠️" : "—";

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">😴 Sleep Tracker</div>
        <div className="ch-ss">Log sleep daily. See your rolling 14-day average and quality score.</div>
      </div>

      <div className="ch-sgrid">
        <div className="ch-sc"><div className="ch-sv" style={{ color: "#8b5cf6" }}>{avg}h</div><div className="ch-sl">Avg Sleep</div></div>
        <div className="ch-sc"><div className="ch-sv" style={{ color: "#10b981", fontSize: 16 }}>{quality}</div><div className="ch-sl">Quality</div></div>
        <div className="ch-sc"><div className="ch-sv">{log.length}</div><div className="ch-sl">Days Logged</div></div>
      </div>

      <div className="ch-card">
        <div className="ch-ring-wrap">
          <Ring pct={pct} size={120} stroke={10} color="#8b5cf6" />
          <div className="ch-ring-center">
            <div className="ch-rpct" style={{ color: "#7c3aed" }}>{pct}%</div>
            <div className="ch-rsub">of {GOAL}h goal</div>
          </div>
        </div>

        <div className="ch-form-row" style={{ alignItems: "flex-end" }}>
          <div className="ch-ig" style={{ maxWidth: 90 }}>
            <div className="ch-il">Hours</div>
            <input className="ch-input" type="number" placeholder="9" min="0" max="24" value={hrs} onChange={e => setHrs(e.target.value)} />
          </div>
          <div className="ch-ig" style={{ maxWidth: 100 }}>
            <div className="ch-il">Minutes</div>
            <select className="ch-input" value={mins} onChange={e => setMins(e.target.value)}>
              {["0", "15", "30", "45"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="ch-ig">
            <div className="ch-il">Date</div>
            <input className="ch-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="ch-btn ch-btn-p" style={{ flexShrink: 0 }} onClick={add}>Log Sleep</button>
        </div>
      </div>

      <div className="ch-card">
        <div className="ch-ct"><BedDouble size={18} color="#8b5cf6" />Sleep History (last 14 days)</div>
        {log.length === 0
          ? <div className="ch-empty">No sleep logged yet.</div>
          : log.map(l => (
            <div key={l.id} className="ch-logitem">
              <div>
                <div style={{ color: "#7c3aed", fontWeight: 800 }}>{l.display}</div>
                <div className="ch-logmeta">{l.date}</div>
              </div>
              <button className="ch-del" onClick={() => del(l.id)}><Trash2 size={15} /></button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — STEP COUNTER
// ═══════════════════════════════════════════════════════════════════════════════
function StepCounter({ toast }) {
  const KEY = `ch_steps_${todayStr()}`;
  const [steps, setSteps] = useState(() => store.get(KEY, 0));
  const [custom, setCustom] = useState("");
  const GOAL = 10000;

  const add = (n) => {
    setSteps(s => {
      const next = s + n;
      store.set(KEY, next);
      if (s < GOAL && next >= GOAL) toast("🏆 Step goal reached! Amazing!");
      return next;
    });
  };

  const reset = () => { setSteps(0); store.set(KEY, 0); };

  const addCustom = () => {
    const n = Number(custom);
    if (n > 0) { add(n); setCustom(""); }
  };

  const pct = Math.round((steps / GOAL) * 100);
  const dist = (steps * 0.00075).toFixed(2);
  const kcal = Math.round(steps * 0.04);
  const mins = Math.round(steps / 100);

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">🚶 Step Counter</div>
        <div className="ch-ss">Log steps manually. Goal: {GOAL.toLocaleString()} steps/day. Resets each day.</div>
      </div>

      <div className="ch-card" style={{ textAlign: "center" }}>
        <div className="ch-ring-wrap">
          <Ring pct={pct} size={160} stroke={14} color="#f59e0b" />
          <div className="ch-ring-center">
            <div style={{ fontSize: 30, fontWeight: 900, color: "#d97706", fontFamily: "'Quicksand',sans-serif", lineHeight: 1 }}>
              {steps.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>steps</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 16 }}>
          {pct}% of goal · {Math.max(0, GOAL - steps).toLocaleString()} left
        </div>

        <div className="ch-presets" style={{ marginBottom: 16 }}>
          {[100, 500, 1000, 2000, 5000].map(n => (
            <button key={n} className="ch-preset" onClick={() => add(n)}>+{n >= 1000 ? `${n/1000}k` : n}</button>
          ))}
        </div>

        <div className="ch-form-row" style={{ justifyContent: "center" }}>
          <input className="ch-input" type="number" placeholder="Custom steps" value={custom}
            onChange={e => setCustom(e.target.value)} style={{ maxWidth: 160 }}
            onKeyDown={e => e.key === "Enter" && addCustom()} />
          <button className="ch-btn ch-btn-p" onClick={addCustom}>Add</button>
          <button className="ch-btn ch-btn-s" onClick={reset}><RotateCcw size={15} /></button>
        </div>
      </div>

      <div className="ch-sgrid">
        <div className="ch-sc"><div className="ch-sv" style={{ color: "#d97706" }}>{dist} km</div><div className="ch-sl">Distance</div></div>
        <div className="ch-sc"><div className="ch-sv" style={{ color: "#d97706" }}>{kcal}</div><div className="ch-sl">Calories Burned</div></div>
        <div className="ch-sc"><div className="ch-sv" style={{ color: "#d97706" }}>{mins} min</div><div className="ch-sl">Active Time (est)</div></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — GROWTH LOGGER
// ═══════════════════════════════════════════════════════════════════════════════
function GrowthLogger({ toast }) {
  const KEY = "ch_growth_log";
  const [log, setLog] = useState(() => store.get(KEY, []));
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [date, setDate] = useState(todayStr());

  const add = () => {
    if (!height || !weight || Number(height) <= 0 || Number(weight) <= 0) return;
    const bmi = (Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1);
    const entry = { id: Date.now(), date, height: Number(height), weight: Number(weight), age: age.trim(), bmi };
    const next = [entry, ...log].slice(0, 30);
    setLog(next); store.set(KEY, next);
    setHeight(""); setWeight(""); setAge("");
    toast("📏 Growth logged!");
  };

  const del = (id) => {
    const next = log.filter(x => x.id !== id);
    setLog(next); store.set(KEY, next);
  };

  const latest = log[0];
  const hasAge = log.some(l => l.age);

  return (
    <div className="ch-fade">
      <div className="ch-sh">
        <div className="ch-st">📏 Growth Logger</div>
        <div className="ch-ss">Track height, weight, and BMI over time. Auto-calculates BMI. Stored locally.</div>
      </div>

      {latest && (
        <div className="ch-sgrid">
          <div className="ch-sc"><div className="ch-sv" style={{ color: "#3b82f6" }}>{latest.height} cm</div><div className="ch-sl">Latest Height</div></div>
          <div className="ch-sc"><div className="ch-sv" style={{ color: "#8b5cf6" }}>{latest.weight} kg</div><div className="ch-sl">Latest Weight</div></div>
          <div className="ch-sc"><div className="ch-sv" style={{ color: "#10b981" }}>{latest.bmi}</div><div className="ch-sl">BMI</div></div>
        </div>
      )}

      <div className="ch-card">
        <div className="ch-form-row">
          <div className="ch-ig">
            <div className="ch-il">Height (cm)</div>
            <input className="ch-input" type="number" placeholder="120" value={height} onChange={e => setHeight(e.target.value)} min="1" />
          </div>
          <div className="ch-ig">
            <div className="ch-il">Weight (kg)</div>
            <input className="ch-input" type="number" placeholder="25" value={weight} onChange={e => setWeight(e.target.value)} min="1" />
          </div>
          <div className="ch-ig">
            <div className="ch-il">Age (optional)</div>
            <input className="ch-input" placeholder="8 years" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="ch-ig">
            <div className="ch-il">Date</div>
            <input className="ch-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <button className="ch-btn ch-btn-p" style={{ width: "100%" }} onClick={add}>
          <Plus size={16} style={{ display: "inline", marginRight: 6 }} />Log Growth Entry
        </button>
      </div>

      <div className="ch-card">
        <div className="ch-ct"><TrendingUp size={18} color="#3b82f6" />Growth History</div>
        {log.length === 0
          ? <div className="ch-empty">No growth entries yet. Log the first one above.</div>
          : (
            <table className="ch-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>BMI</th>
                  {hasAge && <th>Age</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {log.map(l => (
                  <tr key={l.id}>
                    <td>{l.date}</td>
                    <td>{l.height} cm</td>
                    <td>{l.weight} kg</td>
                    <td style={{ color: "#10b981", fontWeight: 800 }}>{l.bmi}</td>
                    {hasAge && <td>{l.age || "—"}</td>}
                    <td><button className="ch-del" onClick={() => del(l.id)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "habits", label: "Habits",   icon: <CheckCircle2 size={15} /> },
  { id: "timer",  label: "Activity", icon: <Timer size={15} /> },
  { id: "meals",  label: "Meals",    icon: <Apple size={15} /> },
  { id: "sleep",  label: "Sleep",    icon: <Moon size={15} /> },
  { id: "steps",  label: "Steps",    icon: <Footprints size={15} /> },
  { id: "growth", label: "Growth",   icon: <Ruler size={15} /> },
];

export default function ChildrenHealth() {
  const [tab, setTab] = useState("habits");
  const [toastMsg, setToastMsg] = useState("");
  const toastRef = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToastMsg(""), 2500);
  }, []);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="ch">
        <nav className="ch-nav">
          <div className="ch-logo">
            <div className="ch-logo-icon">👶</div>
            ManifiX Kids
          </div>
          <div className="ch-date">{dateStr}</div>
        </nav>

        <div className="ch-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ch-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="ch-body">
          {tab === "habits" && <HabitTracker toast={toast} />}
          {tab === "timer"  && <ActivityTimer toast={toast} />}
          {tab === "meals"  && <MealLogger toast={toast} />}
          {tab === "sleep"  && <SleepTracker toast={toast} />}
          {tab === "steps"  && <StepCounter toast={toast} />}
          {tab === "growth" && <GrowthLogger toast={toast} />}
        </div>

        <Toast msg={toastMsg} />
      </div>
    </>
  );
}
