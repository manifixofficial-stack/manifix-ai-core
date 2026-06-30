import { useState, useMemo, useCallback } from "react";
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Trash2,
  Power,
  RotateCw,
  KeyRound,
  CircleAlert,
} from "lucide-react";

/**
 * DeadManSwitch
 * A vault-themed control panel that watches subscription tokens for
 * inactivity and purges anything that crosses a 45-day silence threshold.
 * No props required — ships with a self-contained mock token ledger and
 * a simulated clock so the sweep behavior can be exercised by hand.
 */

const PURGE_THRESHOLD_DAYS = 45;
const WARNING_DAYS = 30;

const SEED_TOKENS = [
  { id: "TKN-0091-AF", owner: "lena.morrow", daysInactive: 2 },
  { id: "TKN-1184-CD", owner: "obrien.k", daysInactive: 12 },
  { id: "TKN-2207-GH", owner: "d.ferreira", daysInactive: 31 },
  { id: "TKN-3340-JK", owner: "service.billing-01", daysInactive: 0 },
  { id: "TKN-4413-LM", owner: "a.nakamura", daysInactive: 38 },
  { id: "TKN-5587-NP", owner: "r.singh", daysInactive: 44 },
  { id: "TKN-6620-QR", owner: "guest.trial-7", daysInactive: 41 },
  { id: "TKN-7754-ST", owner: "m.okafor", daysInactive: 6 },
  { id: "TKN-8801-VW", owner: "service.relay-02", daysInactive: 19 },
  { id: "TKN-9912-XY", owner: "c.bellweather", daysInactive: 45 },
];

function statusOf(token) {
  if (token.purged) return "purged";
  if (token.daysInactive >= PURGE_THRESHOLD_DAYS) return "critical";
  if (token.daysInactive >= WARNING_DAYS) return "dormant";
  return "active";
}

const STATUS_META = {
  active: { label: "Active", className: "dms-badge-active" },
  dormant: { label: "Dormant", className: "dms-badge-dormant" },
  critical: { label: "Past threshold", className: "dms-badge-critical" },
  purged: { label: "Purged", className: "dms-badge-purged" },
};

export default function DeadManSwitch() {
  const [tokens, setTokens] = useState(SEED_TOKENS);
  const [armed, setArmed] = useState(true);
  const [day, setDay] = useState(0);
  const [log, setLog] = useState([
    { day: 0, message: "Vault initialized. Switch armed." },
  ]);

  const pushLog = useCallback((message) => {
    setLog((prev) => [{ day: 0, message }, ...prev].slice(0, 30));
  }, []);

  const counts = useMemo(() => {
    const tally = { active: 0, dormant: 0, critical: 0, purged: 0 };
    tokens.forEach((t) => {
      tally[statusOf(t)] += 1;
    });
    return tally;
  }, [tokens]);

  const nearestPurgeIn = useMemo(() => {
    const live = tokens.filter((t) => !t.purged);
    if (live.length === 0) return null;
    return Math.min(
      ...live.map((t) => Math.max(0, PURGE_THRESHOLD_DAYS - t.daysInactive))
    );
  }, [tokens]);

  const dialFraction =
    nearestPurgeIn === null ? 1 : 1 - nearestPurgeIn / PURGE_THRESHOLD_DAYS;

  const advanceDay = () => {
    const nextDay = day + 1;
    setDay(nextDay);

    setTokens((prev) => {
      const updated = prev.map((t) =>
        t.purged ? t : { ...t, daysInactive: t.daysInactive + 1 }
      );

      if (armed) {
        const toPurge = updated.filter(
          (t) => !t.purged && t.daysInactive >= PURGE_THRESHOLD_DAYS
        );
        if (toPurge.length > 0) {
          pushLog(
            `Day ${nextDay} sweep — purged ${toPurge.length} token${
              toPurge.length > 1 ? "s" : ""
            }: ${toPurge.map((t) => t.id).join(", ")}`
          );
          return updated.map((t) =>
            t.daysInactive >= PURGE_THRESHOLD_DAYS ? { ...t, purged: true } : t
          );
        }
      }
      return updated;
    });
  };

  const pingToken = (id) => {
    setTokens((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, daysInactive: 0, purged: false } : t
      )
    );
    pushLog(`${id} pinged manually — clock reset.`);
  };

  const forcePurge = (id) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, purged: true } : t))
    );
    pushLog(`${id} purged manually by operator.`);
  };

  const toggleArmed = () => {
    setArmed((a) => {
      pushLog(a ? "Switch disarmed. Sweeps paused." : "Switch armed. Sweeps resumed.");
      return !a;
    });
  };

  return (
    <div className="dms-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .dms-root {
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
          font-family: 'Inter', sans-serif;
          background: radial-gradient(ellipse at top, #161310 0%, var(--bg) 60%);
          color: var(--ivory);
          padding: 2.5rem 1.5rem;
          min-height: 100%;
          box-sizing: border-box;
        }
        .dms-root * { box-sizing: border-box; }

        .dms-shell {
          max-width: 920px;
          margin: 0 auto;
        }

        .dms-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.28em;
          color: var(--gold-dim);
          text-transform: uppercase;
        }

        .dms-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: clamp(1.6rem, 4vw, 2.3rem);
          letter-spacing: 0.04em;
          color: var(--gold-bright);
          margin: 0.35rem 0 0;
          text-shadow: 0 0 24px rgba(201, 162, 39, 0.18);
        }

        .dms-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--hairline);
          padding-bottom: 1.75rem;
          margin-bottom: 1.75rem;
        }

        .dms-dial-wrap {
          display: flex;
          align-items: center;
          gap: 1.1rem;
        }

        .dms-dial-readout {
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
        }
        .dms-dial-readout .num {
          font-size: 1.6rem;
          color: var(--gold-bright);
          line-height: 1;
        }
        .dms-dial-readout .unit {
          font-size: 0.65rem;
          color: var(--ivory-dim);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .dms-controls {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .dms-btn {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 3px;
          padding: 0.6rem 1rem;
          border: 1px solid var(--hairline);
          background: var(--surface);
          color: var(--ivory);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: border-color 0.15s ease, transform 0.1s ease;
        }
        .dms-btn:hover { border-color: var(--gold-dim); }
        .dms-btn:active { transform: translateY(1px); }
        .dms-btn-gold {
          background: linear-gradient(180deg, var(--gold-bright), var(--gold));
          color: #1a1505;
          border-color: var(--gold);
        }
        .dms-btn-gold:hover { border-color: var(--gold-bright); }
        .dms-btn-danger {
          border-color: var(--danger);
          color: var(--danger-bright);
        }
        .dms-btn-danger:hover { border-color: var(--danger-bright); }

        .dms-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .dms-stat {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0.85rem 1rem;
        }
        .dms-stat .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ivory-dim);
        }
        .dms-stat .value {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          margin-top: 0.15rem;
        }
        .dms-stat.active .value { color: var(--ok); }
        .dms-stat.dormant .value { color: var(--gold); }
        .dms-stat.critical .value { color: var(--danger-bright); }
        .dms-stat.purged .value { color: var(--ivory-dim); }

        .dms-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold-dim);
          margin: 0 0 0.75rem;
          padding-top: 0.5rem;
        }

        .dms-vault {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .dms-box {
          display: grid;
          grid-template-columns: 28px 1fr auto auto auto;
          align-items: center;
          gap: 1rem;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0.7rem 0.9rem;
        }
        .dms-box.is-critical { border-color: rgba(179, 80, 63, 0.55); }
        .dms-box.is-purged { opacity: 0.45; }

        .dms-lock-icon { color: var(--gold-dim); }
        .dms-box.is-critical .dms-lock-icon { color: var(--danger-bright); }
        .dms-box.is-purged .dms-lock-icon { color: var(--ivory-dim); }

        .dms-box-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          color: var(--ivory);
        }
        .dms-box-owner {
          font-size: 0.74rem;
          color: var(--ivory-dim);
          margin-top: 0.1rem;
        }

        .dms-box-days {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem;
          color: var(--ivory-dim);
          text-align: right;
          white-space: nowrap;
        }
        .dms-box-days .n { color: var(--ivory); font-weight: 600; }

        .dms-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .dms-badge-active { color: var(--ok); border-color: rgba(124,148,121,0.4); }
        .dms-badge-dormant { color: var(--gold); border-color: rgba(201,162,39,0.4); }
        .dms-badge-critical { color: var(--danger-bright); border-color: rgba(179,80,63,0.5); }
        .dms-badge-purged { color: var(--ivory-dim); border-color: var(--hairline); }

        .dms-box-actions {
          display: flex;
          gap: 0.4rem;
        }
        .dms-icon-btn {
          background: var(--surface-2);
          border: 1px solid var(--hairline);
          color: var(--ivory-dim);
          border-radius: 3px;
          padding: 0.35rem;
          cursor: pointer;
          display: inline-flex;
          line-height: 0;
        }
        .dms-icon-btn:hover { color: var(--gold-bright); border-color: var(--gold-dim); }
        .dms-icon-btn.danger:hover { color: var(--danger-bright); border-color: var(--danger); }
        .dms-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dms-icon-btn:disabled:hover { color: var(--ivory-dim); border-color: var(--hairline); }

        .dms-log {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0.9rem 1.1rem;
          max-height: 220px;
          overflow-y: auto;
        }
        .dms-log-row {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.74rem;
          color: var(--ivory-dim);
          padding: 0.3rem 0;
          border-bottom: 1px dashed var(--hairline);
          display: flex;
          gap: 0.6rem;
        }
        .dms-log-row:last-child { border-bottom: none; }
        .dms-log-row .day-tag { color: var(--gold-dim); flex-shrink: 0; }

        .dms-armed-pill {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .dms-armed-pill.on {
          color: var(--gold-bright);
          border: 1px solid rgba(201,162,39,0.5);
          background: rgba(201,162,39,0.08);
        }
        .dms-armed-pill.off {
          color: var(--ivory-dim);
          border: 1px solid var(--hairline);
        }

        @media (max-width: 640px) {
          .dms-stat-row { grid-template-columns: repeat(2, 1fr); }
          .dms-box { grid-template-columns: 24px 1fr; row-gap: 0.5rem; }
          .dms-box-days, .dms-box-actions { grid-column: 1 / -1; justify-self: start; }
        }

        .dms-icon-btn:focus-visible,
        .dms-btn:focus-visible {
          outline: 2px solid var(--gold-bright);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .dms-btn, .dms-icon-btn { transition: none; }
        }
      `}</style>

      <div className="dms-shell">
        <header className="dms-header">
          <div>
            <div className="dms-eyebrow">Subscription Token Vault</div>
            <h1 className="dms-title">Dead Man's Switch</h1>
            <div
              className={`dms-armed-pill ${armed ? "on" : "off"}`}
              style={{ marginTop: "0.6rem" }}
            >
              {armed ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              {armed ? "Armed — sweeping at 45 days" : "Disarmed — sweeps paused"}
            </div>
          </div>

          <div className="dms-dial-wrap">
            <VaultDial fraction={dialFraction} critical={nearestPurgeIn === 0} />
            <div className="dms-dial-readout">
              <div className="num">
                {nearestPurgeIn === null ? "—" : nearestPurgeIn}
              </div>
              <div className="unit">days to next purge</div>
            </div>
          </div>
        </header>

        <div className="dms-controls">
          <button className="dms-btn dms-btn-gold" onClick={advanceDay}>
            <RotateCw size={15} /> Advance 1 day (day {day})
          </button>
          <button className="dms-btn" onClick={toggleArmed}>
            <Power size={15} /> {armed ? "Disarm switch" : "Arm switch"}
          </button>
        </div>

        <div className="dms-stat-row">
          <div className="dms-stat active">
            <div className="label">Active</div>
            <div className="value">{counts.active}</div>
          </div>
          <div className="dms-stat dormant">
            <div className="label">Dormant</div>
            <div className="value">{counts.dormant}</div>
          </div>
          <div className="dms-stat critical">
            <div className="label">Past threshold</div>
            <div className="value">{counts.critical}</div>
          </div>
          <div className="dms-stat purged">
            <div className="label">Purged</div>
            <div className="value">{counts.purged}</div>
          </div>
        </div>

        <div className="dms-section-label">Deposit boxes</div>
        <div className="dms-vault">
          {tokens.map((t) => {
            const status = statusOf(t);
            const meta = STATUS_META[status];
            const remaining = Math.max(0, PURGE_THRESHOLD_DAYS - t.daysInactive);
            return (
              <div
                key={t.id}
                className={`dms-box ${status === "critical" ? "is-critical" : ""} ${
                  t.purged ? "is-purged" : ""
                }`}
              >
                <div className="dms-lock-icon">
                  {t.purged ? (
                    <Unlock size={17} />
                  ) : status === "critical" ? (
                    <CircleAlert size={17} />
                  ) : (
                    <Lock size={17} />
                  )}
                </div>

                <div>
                  <div className="dms-box-id">{t.id}</div>
                  <div className="dms-box-owner">{t.owner}</div>
                </div>

                <div className="dms-box-days">
                  {t.purged ? (
                    "removed from ledger"
                  ) : (
                    <>
                      <span className="n">{t.daysInactive}</span> days idle ·{" "}
                      <span className="n">{remaining}</span> left
                    </>
                  )}
                </div>

                <span className={`dms-badge ${meta.className}`}>
                  {meta.label}
                </span>

                <div className="dms-box-actions">
                  <button
                    className="dms-icon-btn"
                    title="Ping token (reset idle clock)"
                    onClick={() => pingToken(t.id)}
                    disabled={t.purged}
                  >
                    <KeyRound size={14} />
                  </button>
                  <button
                    className="dms-icon-btn danger"
                    title="Force purge"
                    onClick={() => forcePurge(t.id)}
                    disabled={t.purged}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dms-section-label">
          <Clock size={11} style={{ verticalAlign: "-2px", marginRight: "0.4rem" }} />
          Sweep log
        </div>
        <div className="dms-log">
          {log.map((entry, i) => (
            <div className="dms-log-row" key={i}>
              <span className="day-tag">day {day}</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaultDial({ fraction, critical }) {
  const size = 64;
  const center = size / 2;
  const radius = 26;
  const clamped = Math.min(1, Math.max(0, fraction));
  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="var(--surface-2)"
        stroke="var(--hairline)"
        strokeWidth="1"
      />
      {ticks.map((i) => {
        const angle = (i / ticks.length) * Math.PI * 2;
        const inner = radius - 3;
        const outer = radius;
        const x1 = center + inner * Math.cos(angle);
        const y1 = center + inner * Math.sin(angle);
        const x2 = center + outer * Math.cos(angle);
        const y2 = center + outer * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--gold-dim)"
            strokeWidth="1"
          />
        );
      })}
      <circle
        cx={center}
        cy={center}
        r={radius - 7}
        fill="none"
        stroke={critical ? "var(--danger-bright)" : "var(--gold-bright)"}
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          strokeDasharray: 2 * Math.PI * (radius - 7),
          strokeDashoffset:
            2 * Math.PI * (radius - 7) * (1 - clamped),
          transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease",
        }}
      />
      <circle cx={center} cy={center} r="3" fill="var(--gold-bright)" />
    </svg>
  );
}
