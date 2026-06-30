import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Heart,
  Activity,
  Wind,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

/**
 * ShieldGate
 * A live authorization gate that watches simulated biometric signals
 * (heart rate + heart-rate variability) and gates outgoing transactions
 * against a derived arousal index. Ships with its own randomized signal
 * generator so it runs standalone — wire useBiometricFeed's tick logic
 * to a real sensor source to make it live.
 *
 * Wellness framing only: this is a general-purpose calm/alert indicator,
 * not a medical or diagnostic device.
 */

const HISTORY_LEN = 40;
const TICK_MS = 900;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function gateStateFor(arousal) {
  if (arousal >= 65) return "locked";
  if (arousal >= 40) return "elevated";
  return "secure";
}

const GATE_META = {
  secure: {
    label: "Secure",
    sub: "Signals steady — gate open",
    icon: ShieldCheck,
    className: "sg-state-secure",
  },
  elevated: {
    label: "Elevated",
    sub: "Signals rising — confirm before spending",
    icon: ShieldAlert,
    className: "sg-state-elevated",
  },
  locked: {
    label: "Locked",
    sub: "Sympathetic load high — gate closed",
    icon: ShieldOff,
    className: "sg-state-locked",
  },
};

function useBiometricFeed() {
  const [bpm, setBpm] = useState(68);
  const [hrv, setHrv] = useState(62);
  const [history, setHistory] = useState(
    Array.from({ length: HISTORY_LEN }, () => 28)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBpm((prev) => clamp(prev + (Math.random() - 0.5) * 6, 54, 132));
      setHrv((prev) => clamp(prev + (Math.random() - 0.5) * 8, 12, 95));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const arousal = useMemo(() => {
    const fromBpm = clamp((bpm - 58) * 1.4, 0, 70);
    const fromHrv = clamp((75 - hrv) * 0.85, 0, 60);
    return Math.round(clamp(fromBpm * 0.55 + fromHrv * 0.45, 0, 100));
  }, [bpm, hrv]);

  useEffect(() => {
    setHistory((prev) => [...prev.slice(1), arousal]);
  }, [arousal]);

  const settle = useCallback(() => {
    setBpm((prev) => clamp(prev - 18, 54, 132));
    setHrv((prev) => clamp(prev + 22, 12, 95));
  }, []);

  return { bpm, hrv, arousal, history, settle };
}

let reqCounter = 1;
const MERCHANTS = ["Nordstrom", "Delta Air Lines", "Steam", "DoorDash", "Best Buy"];

export default function ShieldGate() {
  const { bpm, hrv, arousal, history, settle } = useBiometricFeed();
  const gateState = gateStateFor(arousal);
  const meta = GATE_META[gateState];
  const Icon = meta.icon;

  const [log, setLog] = useState([
    { id: 0, message: "Gate online. Monitoring baseline signals." },
  ]);
  const [pending, setPending] = useState(null);
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState("in");

  const pushLog = useCallback((message) => {
    setLog((prev) => [{ id: Date.now(), message }, ...prev].slice(0, 24));
  }, []);

  useEffect(() => {
    if (!breathing) return;
    const id = setInterval(() => {
      setBreathPhase((p) => (p === "in" ? "out" : "in"));
    }, 4000);
    return () => clearInterval(id);
  }, [breathing]);

  const attemptPurchase = () => {
    const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
    const amount = (20 + Math.random() * 480).toFixed(2);
    const state = gateStateFor(arousal);
    const request = {
      id: reqCounter++,
      merchant,
      amount,
      state,
      decision: state === "secure" ? "approved" : "pending",
    };
    setPending(request);
    if (state === "secure") {
      pushLog(`Authorized $${amount} to ${merchant} — signals steady.`);
    } else if (state === "elevated") {
      pushLog(`Hold on $${amount} to ${merchant} — confirm needed.`);
    } else {
      pushLog(`Blocked $${amount} to ${merchant} — sympathetic load high.`);
      setBreathing(true);
    }
  };

  const confirmElevated = () => {
    if (!pending) return;
    setLog((prev) => [
      { id: Date.now(), message: `Confirmed $${pending.amount} to ${pending.merchant}.` },
      ...prev,
    ]);
    setPending({ ...pending, decision: "approved" });
  };

  const overrideLocked = () => {
    if (!pending) return;
    setLog((prev) => [
      {
        id: Date.now(),
        message: `Manual override — $${pending.amount} to ${pending.merchant} sent anyway.`,
      },
      ...prev,
    ]);
    setPending({ ...pending, decision: "overridden" });
    setBreathing(false);
  };

  const recheckAfterBreathing = () => {
    settle();
    pushLog("Recheck requested after paced breathing.");
  };

  useEffect(() => {
    if (pending && pending.decision === "pending" && gateState === "secure") {
      setPending((p) => (p ? { ...p, decision: "approved" } : p));
      pushLog(`Cleared — $${pending.amount} to ${pending.merchant} now approved.`);
      setBreathing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateState]);

  return (
    <div className="sg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .sg-root {
          --bg: #0a0a0b;
          --surface: #16140f;
          --surface-2: #1f1b13;
          --hairline: #3a3220;
          --gold: #c9a227;
          --gold-bright: #e8c964;
          --gold-dim: #8a7438;
          --ivory: #ece4d2;
          --ivory-dim: #a89e88;
          --danger: #b3503f;
          --danger-bright: #d97359;
          --ok: #7c9479;
          --elevated: #c9a227;
          font-family: 'Inter', sans-serif;
          background: radial-gradient(ellipse at top, #161310 0%, var(--bg) 60%);
          color: var(--ivory);
          padding: 2.5rem 1.5rem;
          min-height: 100%;
          box-sizing: border-box;
        }
        .sg-root * { box-sizing: border-box; }

        .sg-shell { max-width: 760px; margin: 0 auto; }

        .sg-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.28em;
          color: var(--gold-dim);
          text-transform: uppercase;
        }
        .sg-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: clamp(1.6rem, 4vw, 2.3rem);
          letter-spacing: 0.04em;
          color: var(--gold-bright);
          margin: 0.35rem 0 1.5rem;
          text-shadow: 0 0 24px rgba(201, 162, 39, 0.18);
        }

        .sg-gate-panel {
          border: 1px solid var(--hairline);
          background: var(--surface);
          border-radius: 6px;
          padding: 1.4rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          transition: border-color 0.3s ease;
        }
        .sg-state-secure { border-color: rgba(124,148,121,0.45); }
        .sg-state-elevated { border-color: rgba(201,162,39,0.5); }
        .sg-state-locked { border-color: rgba(179,80,63,0.6); }

        .sg-gate-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--surface-2);
        }
        .sg-state-secure .sg-gate-icon { color: var(--ok); }
        .sg-state-elevated .sg-gate-icon { color: var(--gold-bright); }
        .sg-state-locked .sg-gate-icon { color: var(--danger-bright); }

        .sg-gate-label {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          letter-spacing: 0.03em;
        }
        .sg-state-secure .sg-gate-label { color: var(--ok); }
        .sg-state-elevated .sg-gate-label { color: var(--gold-bright); }
        .sg-state-locked .sg-gate-label { color: var(--danger-bright); }

        .sg-gate-sub {
          font-size: 0.8rem;
          color: var(--ivory-dim);
          margin-top: 0.15rem;
        }

        .sg-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .sg-metric {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0.85rem 1rem;
        }
        .sg-metric .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ivory-dim);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .sg-metric .value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.4rem;
          color: var(--gold-bright);
          margin-top: 0.2rem;
        }
        .sg-metric .value .unit {
          font-size: 0.7rem;
          color: var(--ivory-dim);
          margin-left: 0.25rem;
        }

        .sg-spark {
          width: 100%;
          height: 36px;
          margin-top: 0.5rem;
        }

        .sg-controls {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }
        .sg-btn {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 3px;
          padding: 0.6rem 1rem;
          border: 1px solid var(--hairline);
          background: var(--surface);
          color: var(--ivory);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sg-btn:hover { border-color: var(--gold-dim); }
        .sg-btn-gold {
          background: linear-gradient(180deg, var(--gold-bright), var(--gold));
          color: #1a1505;
          border-color: var(--gold);
        }

        .sg-pending {
          border: 1px solid var(--hairline);
          background: var(--surface);
          border-radius: 6px;
          padding: 1.1rem 1.3rem;
          margin-bottom: 1.75rem;
        }
        .sg-pending .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sg-pending .merchant {
          font-family: 'Cinzel', serif;
          font-size: 1.05rem;
          color: var(--ivory);
        }
        .sg-pending .amount {
          font-family: 'JetBrains Mono', monospace;
          color: var(--gold-bright);
          font-size: 1.1rem;
        }
        .sg-pending .decision {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }
        .sg-pending .decision.approved { color: var(--ok); }
        .sg-pending .decision.overridden { color: var(--gold); }
        .sg-pending .decision.pending { color: var(--danger-bright); }

        .sg-breathe {
          border: 1px solid rgba(179,80,63,0.4);
          background: var(--surface-2);
          border-radius: 6px;
          padding: 1.5rem;
          margin-bottom: 1.75rem;
          text-align: center;
        }
        .sg-breathe-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--danger-bright);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-bottom: 1rem;
        }
        .sg-breathe-circle {
          width: 90px;
          height: 90px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          border: 2px solid var(--gold);
          background: rgba(201,162,39,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          color: var(--gold-bright);
          transition: transform 4s ease-in-out;
        }
        .sg-breathe-circle.in { transform: scale(1.25); }
        .sg-breathe-circle.out { transform: scale(0.85); }

        .sg-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold-dim);
          margin: 0 0 0.75rem;
        }

        .sg-log {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0.9rem 1.1rem;
          max-height: 200px;
          overflow-y: auto;
        }
        .sg-log-row {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.74rem;
          color: var(--ivory-dim);
          padding: 0.32rem 0;
          border-bottom: 1px dashed var(--hairline);
        }
        .sg-log-row:last-child { border-bottom: none; }

        @media (max-width: 560px) {
          .sg-metrics { grid-template-columns: 1fr; }
        }

        .sg-btn:focus-visible {
          outline: 2px solid var(--gold-bright);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .sg-breathe-circle { transition: none; }
        }
      `}</style>

      <div className="sg-shell">
        <div className="sg-eyebrow">Live Biometric Authorization</div>
        <h1 className="sg-title">ShieldGate</h1>

        <div className={`sg-gate-panel ${meta.className}`}>
          <div className="sg-gate-icon">
            <Icon size={26} />
          </div>
          <div>
            <div className="sg-gate-label">{meta.label}</div>
            <div className="sg-gate-sub">{meta.sub}</div>
          </div>
        </div>

        <div className="sg-metrics">
          <div className="sg-metric">
            <div className="label">
              <Heart size={11} /> Heart rate
            </div>
            <div className="value">
              {Math.round(bpm)}
              <span className="unit">bpm</span>
            </div>
          </div>
          <div className="sg-metric">
            <div className="label">
              <Activity size={11} /> Variability
            </div>
            <div className="value">
              {Math.round(hrv)}
              <span className="unit">ms</span>
            </div>
          </div>
          <div className="sg-metric">
            <div className="label">
              <ShieldAlert size={11} /> Arousal index
            </div>
            <div className="value">
              {arousal}
              <span className="unit">/ 100</span>
            </div>
            <Sparkline data={history} />
          </div>
        </div>

        <div className="sg-controls">
          <button className="sg-btn sg-btn-gold" onClick={attemptPurchase}>
            Simulate purchase attempt
          </button>
          <button className="sg-btn" onClick={settle}>
            <Wind size={14} /> Simulate calming down
          </button>
        </div>

        {pending && (
          <div className="sg-pending">
            <div className="row">
              <div>
                <div className="merchant">{pending.merchant}</div>
                <div
                  className={`decision ${pending.decision}`}
                >
                  {pending.decision === "approved" && (
                    <>
                      <Unlock size={11} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
                      Approved
                    </>
                  )}
                  {pending.decision === "overridden" && (
                    <>
                      <Unlock size={11} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
                      Sent by override
                    </>
                  )}
                  {pending.decision === "pending" && (
                    <>
                      <Lock size={11} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
                      {pending.state === "locked" ? "Blocked, awaiting decision" : "Awaiting confirmation"}
                    </>
                  )}
                </div>
              </div>
              <div className="amount">${pending.amount}</div>
            </div>

            {pending.decision === "pending" && pending.state === "elevated" && (
              <div className="sg-controls" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                <button className="sg-btn sg-btn-gold" onClick={confirmElevated}>
                  Confirm purchase
                </button>
              </div>
            )}

            {pending.decision === "pending" && pending.state === "locked" && (
              <div className="sg-controls" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                <button className="sg-btn" onClick={overrideLocked}>
                  <AlertTriangle size={14} /> Override and send anyway
                </button>
              </div>
            )}
          </div>
        )}

        {breathing && (
          <div className="sg-breathe">
            <div className="sg-breathe-label">
              <Wind size={13} /> Paced breathing
            </div>
            <div className={`sg-breathe-circle ${breathPhase}`}>
              {breathPhase === "in" ? "Breathe in" : "Breathe out"}
            </div>
            <button className="sg-btn" onClick={recheckAfterBreathing}>
              I'm steadier now — recheck
            </button>
          </div>
        )}

        <div className="sg-section-label">Authorization log</div>
        <div className="sg-log">
          {log.map((entry) => (
            <div className="sg-log-row" key={entry.id}>
              {entry.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data }) {
  const max = 100;
  const w = 100;
  const h = 36;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (clamp(v, 0, max) / max) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sg-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
