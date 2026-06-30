import { useState, useMemo } from "react";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Leaderboard
 * Global rank scorecard grid. Ranks users by a "Calm Score" (the inverse
 * of sustained arousal load tracked elsewhere in the suite) over a
 * selectable window. Ships with mock standings — swap MOCK_USERS for a
 * real feed to make it live.
 */

const NAMES = [
  "lena.morrow", "obrien.k", "d.ferreira", "a.nakamura", "r.singh",
  "m.okafor", "c.bellweather", "t.haldane", "p.vance", "s.akintola",
  "j.delacroix", "n.westbrook", "k.osei", "f.lindqvist", "y.tanaka",
  "b.murchison", "e.castellan", "w.adeyemi", "h.rourke", "z.kowalski",
];

function seedUsers() {
  return NAMES.map((name, i) => {
    const score = Math.round(98 - i * 3.1 + (Math.random() * 4 - 2));
    const streak = Math.max(1, Math.round(40 - i * 1.6 + (Math.random() * 6 - 3)));
    const trend = Math.random() > 0.55 ? "up" : Math.random() > 0.5 ? "down" : "flat";
    return { id: i, name, score: clamp(score, 40, 99), streak, trend };
  }).sort((a, b) => b.score - a.score);
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

const RANGES = ["Weekly", "Monthly", "All-time"];

export default function Leaderboard() {
  const [range, setRange] = useState("Weekly");
  const users = useMemo(() => seedUsers(), [range]);
  const you = useMemo(
    () => ({ id: -1, name: "you", score: 71, streak: 9, trend: "up" }),
    [range]
  );

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }));
  const yourRank = ranked.filter((u) => u.score > you.score).length + 1;

  return (
    <div className="lb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .lb-root {
          --bg: #0a0a0b; --surface: #16140f; --surface-2: #1f1b13;
          --hairline: #3a3220; --gold: #c9a227; --gold-bright: #e8c964;
          --gold-dim: #8a7438; --ivory: #ece4d2; --ivory-dim: #a89e88;
          --ok: #7c9479; --danger-bright: #d97359;
          --silver: #b9bfc6; --bronze: #b07a4e;
          font-family: 'Inter', sans-serif;
          background: radial-gradient(ellipse at top, #161310 0%, var(--bg) 60%);
          color: var(--ivory);
          padding: 2.5rem 1.5rem;
          min-height: 100%;
          box-sizing: border-box;
        }
        .lb-root * { box-sizing: border-box; }
        .lb-shell { max-width: 720px; margin: 0 auto; }

        .lb-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem; letter-spacing: 0.28em;
          color: var(--gold-dim); text-transform: uppercase;
        }
        .lb-title {
          font-family: 'Cinzel', serif; font-weight: 700;
          font-size: clamp(1.6rem, 4vw, 2.3rem);
          letter-spacing: 0.04em; color: var(--gold-bright);
          margin: 0.35rem 0 1.5rem;
          text-shadow: 0 0 24px rgba(201, 162, 39, 0.18);
          display: flex; align-items: center; gap: 0.6rem;
        }

        .lb-range-row { display: flex; gap: 0.5rem; margin-bottom: 1.75rem; }
        .lb-range-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.5rem 0.9rem; border-radius: 999px;
          border: 1px solid var(--hairline); background: var(--surface);
          color: var(--ivory-dim); cursor: pointer;
        }
        .lb-range-btn.active {
          border-color: var(--gold); color: var(--gold-bright);
          background: rgba(201,162,39,0.08);
        }

        .lb-podium {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 0.75rem; margin-bottom: 2rem;
        }
        .lb-podium-card {
          background: var(--surface); border: 1px solid var(--hairline);
          border-radius: 6px; padding: 1.1rem 0.8rem; text-align: center;
        }
        .lb-podium-card.rank-1 { border-color: rgba(232,201,100,0.6); transform: translateY(-8px); }
        .lb-podium-card.rank-2 { border-color: rgba(185,191,198,0.45); }
        .lb-podium-card.rank-3 { border-color: rgba(176,122,78,0.5); }

        .lb-medal {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.6rem; font-family: 'Cinzel', serif; font-weight: 700;
        }
        .rank-1 .lb-medal { background: rgba(232,201,100,0.15); color: var(--gold-bright); }
        .rank-2 .lb-medal { background: rgba(185,191,198,0.15); color: var(--silver); }
        .rank-3 .lb-medal { background: rgba(176,122,78,0.18); color: var(--bronze); }

        .lb-podium-name {
          font-family: 'JetBrains Mono', monospace; font-size: 0.74rem;
          color: var(--ivory); word-break: break-word;
        }
        .lb-podium-score {
          font-family: 'Cinzel', serif; font-size: 1.3rem;
          color: var(--gold-bright); margin-top: 0.3rem;
        }

        .lb-section-label {
          font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold-dim); margin: 0 0 0.75rem;
        }

        .lb-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.75rem; }
        .lb-row {
          display: grid; grid-template-columns: 32px 1fr auto auto;
          align-items: center; gap: 0.9rem;
          background: var(--surface); border: 1px solid var(--hairline);
          border-radius: 4px; padding: 0.6rem 0.9rem;
        }
        .lb-row.is-you { border-color: var(--gold); background: rgba(201,162,39,0.06); }
        .lb-rank-num {
          font-family: 'JetBrains Mono', monospace; color: var(--ivory-dim);
          font-size: 0.85rem; text-align: center;
        }
        .lb-row-name { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; }
        .lb-row-streak {
          font-size: 0.7rem; color: var(--ivory-dim);
          font-family: 'JetBrains Mono', monospace;
        }
        .lb-row-score {
          font-family: 'Cinzel', serif; font-size: 1rem; color: var(--gold-bright);
          display: flex; align-items: center; gap: 0.4rem; justify-content: flex-end;
        }
        .lb-trend-up { color: var(--ok); }
        .lb-trend-down { color: var(--danger-bright); }
        .lb-trend-flat { color: var(--ivory-dim); }

        .lb-pin {
          border: 1px dashed var(--gold-dim); border-radius: 4px;
          padding: 0.7rem 0.9rem; display: flex; justify-content: space-between;
          align-items: center; font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem; color: var(--ivory-dim);
        }
        .lb-pin .num { color: var(--gold-bright); font-weight: 600; }

        @media (max-width: 520px) {
          .lb-podium { grid-template-columns: 1fr; }
          .lb-podium-card.rank-1 { transform: none; order: -1; }
        }
      `}</style>

      <div className="lb-shell">
        <div className="lb-eyebrow">Global Rank</div>
        <h1 className="lb-title">
          <Trophy size={26} /> Leaderboard
        </h1>

        <div className="lb-range-row">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`lb-range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="lb-podium">
          {[ranked[1], ranked[0], ranked[2]].map((u, idx) => {
            const order = [2, 1, 3][idx];
            return (
              <div key={u.id} className={`lb-podium-card rank-${order}`}>
                <div className="lb-medal">
                  {order === 1 ? <Medal size={18} /> : order}
                </div>
                <div className="lb-podium-name">{u.name}</div>
                <div className="lb-podium-score">{u.score}</div>
              </div>
            );
          })}
        </div>

        <div className="lb-section-label">Standings · {range}</div>
        <div className="lb-list">
          {ranked.slice(3, 12).map((u) => (
            <div key={u.id} className="lb-row">
              <div className="lb-rank-num">{u.rank}</div>
              <div>
                <div className="lb-row-name">{u.name}</div>
                <div className="lb-row-streak">{u.streak}-day streak</div>
              </div>
              <TrendIcon trend={u.trend} />
              <div className="lb-row-score">{u.score}</div>
            </div>
          ))}
        </div>

        <div className="lb-pin">
          <span>Your rank: <span className="num">#{yourRank}</span> · {you.streak}-day streak</span>
          <span className="num">{you.score}</span>
        </div>
      </div>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp size={15} className="lb-trend-up" />;
  if (trend === "down") return <TrendingDown size={15} className="lb-trend-down" />;
  return <Minus size={15} className="lb-trend-flat" />;
}
