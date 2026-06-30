import { useState } from "react";
import { CreditCard, Snowflake, SlidersHorizontal, Bell, Check } from "lucide-react";

/**
 * Settings
 * Virtual card issuer configuration: masked card display, spending
 * limits, the arousal threshold that drives ShieldGate's lock state,
 * merchant category blocks, and notification preferences. All state is
 * local — wire onSave to a real issuer API to make changes persist.
 */

const CATEGORIES = ["Dining", "Retail", "Travel", "Subscriptions", "Entertainment"];

export default function Settings() {
  const [frozen, setFrozen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(400);
  const [monthlyLimit, setMonthlyLimit] = useState(3500);
  const [threshold, setThreshold] = useState(65);
  const [blockedCategories, setBlockedCategories] = useState(["Subscriptions"]);
  const [notifyOnHold, setNotifyOnHold] = useState(true);
  const [notifyOnOverride, setNotifyOnOverride] = useState(true);
  const [saved, setSaved] = useState(false);

  const toggleCategory = (cat) => {
    setBlockedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="set-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .set-root {
          --bg: #0a0a0b; --surface: #16140f; --surface-2: #1f1b13;
          --hairline: #3a3220; --gold: #c9a227; --gold-bright: #e8c964;
          --gold-dim: #8a7438; --ivory: #ece4d2; --ivory-dim: #a89e88;
          --ok: #7c9479; --danger-bright: #d97359;
          font-family: 'Inter', sans-serif;
          background: radial-gradient(ellipse at top, #161310 0%, var(--bg) 60%);
          color: var(--ivory);
          padding: 2.5rem 1.5rem;
          min-height: 100%;
          box-sizing: border-box;
        }
        .set-root * { box-sizing: border-box; }
        .set-shell { max-width: 700px; margin: 0 auto; }

        .set-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem; letter-spacing: 0.28em;
          color: var(--gold-dim); text-transform: uppercase;
        }
        .set-title {
          font-family: 'Cinzel', serif; font-weight: 700;
          font-size: clamp(1.6rem, 4vw, 2.3rem);
          letter-spacing: 0.04em; color: var(--gold-bright);
          margin: 0.35rem 0 1.5rem;
          text-shadow: 0 0 24px rgba(201, 162, 39, 0.18);
        }

        .set-card {
          border-radius: 12px; padding: 1.5rem;
          background: linear-gradient(135deg, #1f1b13 0%, #0d0c09 100%);
          border: 1px solid var(--gold-dim);
          margin-bottom: 1.75rem;
          position: relative; overflow: hidden;
        }
        .set-card::after {
          content: ""; position: absolute; inset: 0;
          background: radial-gradient(circle at 85% 10%, rgba(201,162,39,0.12), transparent 60%);
        }
        .set-card-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          position: relative;
        }
        .set-card-brand {
          font-family: 'Cinzel', serif; font-size: 0.95rem; color: var(--gold-bright);
          letter-spacing: 0.06em;
        }
        .set-card-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 0.6rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ok); border: 1px solid rgba(124,148,121,0.4);
          border-radius: 999px; padding: 0.2rem 0.5rem;
        }
        .set-card-badge.frozen { color: var(--ivory-dim); border-color: var(--hairline); }
        .set-card-number {
          font-family: 'JetBrains Mono', monospace; font-size: 1.15rem;
          color: var(--ivory); letter-spacing: 0.12em; margin: 1.6rem 0 1rem;
          position: relative;
        }
        .set-card-bottom {
          display: flex; justify-content: space-between; align-items: flex-end;
          position: relative;
        }
        .set-card-label {
          font-family: 'JetBrains Mono', monospace; font-size: 0.6rem;
          color: var(--ivory-dim); text-transform: uppercase; letter-spacing: 0.1em;
        }
        .set-card-value {
          font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: var(--ivory);
          margin-top: 0.15rem;
        }

        .set-freeze-btn {
          font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 600;
          padding: 0.45rem 0.8rem; border-radius: 4px; cursor: pointer;
          border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ivory);
          display: inline-flex; align-items: center; gap: 0.4rem;
        }
        .set-freeze-btn.active { border-color: var(--gold); color: var(--gold-bright); }

        .set-section-label {
          font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold-dim); margin: 0 0 0.9rem;
        }

        .set-block {
          background: var(--surface); border: 1px solid var(--hairline);
          border-radius: 6px; padding: 1.1rem 1.3rem; margin-bottom: 1.75rem;
        }
        .set-row {
          display: flex; justify-content: space-between; align-items: center;
          gap: 1rem; margin-bottom: 1.1rem;
        }
        .set-row:last-child { margin-bottom: 0; }
        .set-row-label {
          font-size: 0.84rem; color: var(--ivory);
        }
        .set-row-value {
          font-family: 'JetBrains Mono', monospace; color: var(--gold-bright);
          font-size: 0.9rem;
        }
        .set-slider {
          width: 100%; accent-color: var(--gold);
        }
        .set-slider-row { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.1rem; }
        .set-slider-row:last-child { margin-bottom: 0; }

        .set-threshold-note {
          font-size: 0.74rem; color: var(--ivory-dim); margin-top: 0.3rem;
        }

        .set-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .set-chip {
          font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
          padding: 0.4rem 0.75rem; border-radius: 999px; cursor: pointer;
          border: 1px solid var(--hairline); background: var(--surface-2); color: var(--ivory-dim);
        }
        .set-chip.blocked {
          border-color: rgba(217,115,89,0.5); color: var(--danger-bright);
          background: rgba(217,115,89,0.08);
        }

        .set-switch {
          width: 42px; height: 24px; border-radius: 999px; border: 1px solid var(--hairline);
          background: var(--surface-2); position: relative; cursor: pointer; flex-shrink: 0;
        }
        .set-switch.on { background: rgba(201,162,39,0.25); border-color: var(--gold); }
        .set-switch-knob {
          width: 18px; height: 18px; border-radius: 50%; background: var(--ivory-dim);
          position: absolute; top: 2px; left: 2px; transition: transform 0.15s ease, background 0.15s ease;
        }
        .set-switch.on .set-switch-knob { transform: translateX(18px); background: var(--gold-bright); }

        .set-save-btn {
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600;
          padding: 0.65rem 1.3rem; border-radius: 3px; cursor: pointer;
          background: linear-gradient(180deg, var(--gold-bright), var(--gold));
          color: #1a1505; border: 1px solid var(--gold);
          display: inline-flex; align-items: center; gap: 0.5rem;
        }
        .set-saved-note {
          font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
          color: var(--ok); margin-left: 0.9rem;
        }
      `}</style>

      <div className="set-shell">
        <div className="set-eyebrow">Virtual Card · Issuer Controls</div>
        <h1 className="set-title">Settings</h1>

        <div className="set-card">
          <div className="set-card-top">
            <div className="set-card-brand">
              <CreditCard size={16} style={{ verticalAlign: "-3px", marginRight: "0.4rem" }} />
              Vault Card
            </div>
            <span className={`set-card-badge ${frozen ? "frozen" : ""}`}>
              {frozen ? "Frozen" : "ShieldGate linked"}
            </span>
          </div>
          <div className="set-card-number">•••• •••• •••• 7741</div>
          <div className="set-card-bottom">
            <div>
              <div className="set-card-label">Cardholder</div>
              <div className="set-card-value">A. NAKAMURA</div>
            </div>
            <button
              className={`set-freeze-btn ${frozen ? "active" : ""}`}
              onClick={() => setFrozen((f) => !f)}
            >
              <Snowflake size={13} /> {frozen ? "Unfreeze card" : "Freeze card"}
            </button>
          </div>
        </div>

        <div className="set-section-label">Spending limits</div>
        <div className="set-block">
          <div className="set-slider-row">
            <div className="set-row">
              <span className="set-row-label">Daily limit</span>
              <span className="set-row-value">${dailyLimit}</span>
            </div>
            <input
              className="set-slider"
              type="range"
              min="50"
              max="1000"
              step="25"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />
          </div>
          <div className="set-slider-row">
            <div className="set-row">
              <span className="set-row-label">Monthly limit</span>
              <span className="set-row-value">${monthlyLimit}</span>
            </div>
            <input
              className="set-slider"
              type="range"
              min="500"
              max="10000"
              step="250"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="set-section-label">
          <SlidersHorizontal size={11} style={{ verticalAlign: "-2px", marginRight: "0.4rem" }} />
          ShieldGate lock threshold
        </div>
        <div className="set-block">
          <div className="set-slider-row">
            <div className="set-row">
              <span className="set-row-label">Arousal index that closes the gate</span>
              <span className="set-row-value">{threshold}</span>
            </div>
            <input
              className="set-slider"
              type="range"
              min="40"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <div className="set-threshold-note">
              Lower values lock the card sooner. Default is 65.
            </div>
          </div>
        </div>

        <div className="set-section-label">Blocked categories</div>
        <div className="set-block">
          <div className="set-chips">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className={`set-chip ${blockedCategories.includes(cat) ? "blocked" : ""}`}
                onClick={() => toggleCategory(cat)}
              >
                {blockedCategories.includes(cat) ? "Blocked · " : ""}{cat}
              </span>
            ))}
          </div>
        </div>

        <div className="set-section-label">
          <Bell size={11} style={{ verticalAlign: "-2px", marginRight: "0.4rem" }} />
          Notifications
        </div>
        <div className="set-block">
          <div className="set-row">
            <span className="set-row-label">Notify when a transaction is held</span>
            <div
              className={`set-switch ${notifyOnHold ? "on" : ""}`}
              onClick={() => setNotifyOnHold((v) => !v)}
              role="switch"
              aria-checked={notifyOnHold}
              tabIndex={0}
            >
              <div className="set-switch-knob" />
            </div>
          </div>
          <div className="set-row">
            <span className="set-row-label">Notify on manual override</span>
            <div
              className={`set-switch ${notifyOnOverride ? "on" : ""}`}
              onClick={() => setNotifyOnOverride((v) => !v)}
              role="switch"
              aria-checked={notifyOnOverride}
              tabIndex={0}
            >
              <div className="set-switch-knob" />
            </div>
          </div>
        </div>

        <button className="set-save-btn" onClick={handleSave}>
          <Check size={15} /> Save changes
        </button>
        {saved && <span className="set-saved-note">Saved.</span>}
      </div>
    </div>
  );
}
