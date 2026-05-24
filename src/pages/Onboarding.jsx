/**
 * ManifiX — Onboarding.jsx (v4 — AI-Powered, 8-Step)
 * ─────────────────────────────────────────────────────
 * ✔ 8 professional onboarding steps
 * ✔ AI Coach tone selection
 * ✔ Notification preference step
 * ✔ Activation phrase selector (no typing errors)
 * ✔ Full summary + completion screen
 * ✔ authService.completeOnboarding() on finish
 * ✔ Dark gold/obsidian aesthetic
 * ✔ Fully accessible (ARIA, keyboard nav)
 * ✔ Mobile + desktop responsive
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

/* ─── Framer-motion with safe fallback ─── */
let motion, AnimatePresence;
try {
  const fm = require("framer-motion");
  motion = fm.motion;
  AnimatePresence = fm.AnimatePresence;
} catch {
  AnimatePresence = ({ children }) => <>{children}</>;
  const FM = React.forwardRef(({ children, style, ...rest }, ref) => (
    <div ref={ref} style={{ transition: "opacity .35s ease, transform .35s ease", ...style }} {...rest}>
      {children}
    </div>
  ));
  FM.displayName = "FM";
  motion = { div: FM };
}

/* ══════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════ */
const STYLE_ID = "manifix-ob-v4";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    #mfob4 *, #mfob4 *::before, #mfob4 *::after { box-sizing:border-box; margin:0; padding:0; }

    #mfob4 {
      --g:    #d4a843;
      --g2:   #f0cc70;
      --gd:   rgba(212,168,67,.14);
      --r:    #e05454;
      --rd:   rgba(224,84,84,.13);
      --bg:   #07070b;
      --s1:   #0e0e14;
      --s2:   #131319;
      --b:    rgba(255,255,255,.07);
      --bhi:  rgba(255,255,255,.13);
      --tp:   #f0ece3;
      --tm:   rgba(240,236,227,.35);
      --tf:   rgba(240,236,227,.12);
      --mono: 'JetBrains Mono', monospace;
      --disp: 'Syne', sans-serif;
    }

    @keyframes ob4-breathe {
      0%,100%{ opacity:.06; transform:scale(1) translateX(-50%); }
      50%    { opacity:.18; transform:scale(1.1) translateX(-46%); }
    }
    @keyframes ob4-scan {
      0%  { transform:translateY(-100%); opacity:0; }
      5%  { opacity:1; }
      95% { opacity:1; }
      100%{ transform:translateY(1800%); opacity:0; }
    }
    @keyframes ob4-blink {
      0%,49%,100%{ opacity:1; } 50%,99%{ opacity:0; }
    }
    @keyframes ob4-pulse {
      0%,100%{ box-shadow:0 0 0 0 rgba(212,168,67,.4); }
      50%    { box-shadow:0 0 0 14px rgba(212,168,67,0); }
    }
    @keyframes ob4-shake {
      0%,100%{ transform:translateX(0); }
      20%    { transform:translateX(-6px); }
      40%    { transform:translateX(6px); }
      60%    { transform:translateX(-4px); }
      80%    { transform:translateX(4px); }
    }
    @keyframes ob4-spin {
      to { transform:rotate(360deg); }
    }
    @keyframes ob4-fadeup {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:none; }
    }
    @keyframes ob4-slideup {
      from { opacity:0; transform:translateY(28px) scale(.97); }
      to   { opacity:1; transform:none; }
    }

    .ob4-blink  { animation:ob4-blink 1.1s step-end infinite; }
    .ob4-pulse  { animation:ob4-pulse 2.2s ease-in-out infinite; }
    .ob4-fadeup { animation:ob4-fadeup .4s ease both; }

    /* ── Option button ── */
    .ob4-opt {
      width:100%; padding:12px 14px;
      background:var(--s1); border:1px solid var(--b);
      color:var(--tm); font-family:var(--mono);
      font-size:11px; letter-spacing:.14em; text-transform:uppercase;
      cursor:pointer; text-align:left;
      transition:border-color .18s, color .18s, background .18s, transform .1s;
      outline:none; border-radius:3px;
      display:flex; align-items:flex-start; gap:10px;
      user-select:none;
    }
    .ob4-opt:hover:not(:disabled) {
      border-color:var(--bhi); color:rgba(240,236,227,.6);
      background:var(--s2);
    }
    .ob4-opt:active:not(:disabled) { transform:scale(.99); }
    .ob4-opt:focus-visible { outline:2px solid var(--g); outline-offset:2px; }
    .ob4-opt.on-gold { border-color:var(--g); color:var(--g); background:var(--gd); }
    .ob4-opt.on-red  { border-color:var(--r); color:var(--r); background:var(--rd); }

    /* ── Primary CTA ── */
    .ob4-cta {
      width:100%; padding:14px 0; margin-top:14px;
      font-family:var(--mono); font-size:11px; font-weight:700;
      letter-spacing:.22em; text-transform:uppercase;
      cursor:pointer; border:none; border-radius:3px;
      transition:opacity .18s, transform .1s;
      outline:none;
    }
    .ob4-cta:not(:disabled) { background:var(--g); color:#07070b; }
    .ob4-cta:not(:disabled):hover { opacity:.88; }
    .ob4-cta:not(:disabled):active { transform:scale(.985); }
    .ob4-cta:disabled {
      background:var(--s2); color:var(--tf);
      border:1px solid var(--b); cursor:not-allowed;
    }
    .ob4-cta.warn {
      background:var(--rd) !important; color:var(--r) !important;
      border:1px solid rgba(224,84,84,.25) !important;
    }
    .ob4-cta.warn:hover { opacity:.82 !important; }

    /* ── Step dots ── */
    .ob4-dot {
      height:2px; background:var(--tf); border-radius:9px;
      flex:1; transition:background .35s, flex .35s;
    }
    .ob4-dot.cur  { background:var(--g); flex:2.4; }
    .ob4-dot.done { background:rgba(212,168,67,.28); }

    /* ── Feature card ── */
    .ob4-feat {
      display:flex; gap:10px; align-items:flex-start;
      padding:10px 13px;
      background:var(--s1); border:1px solid var(--b); border-radius:3px;
      transition:border-color .18s, background .18s;
    }
    .ob4-feat:hover { border-color:var(--bhi); background:var(--s2); }

    /* ── Spinner ── */
    .ob4-spin {
      display:inline-block; width:11px; height:11px;
      border:1.5px solid rgba(8,6,8,.25); border-top-color:#07070b;
      border-radius:50%; animation:ob4-spin .7s linear infinite;
      vertical-align:middle; margin-right:8px;
    }

    /* ── Feat scroll ── */
    .ob4-feat-scroll {
      max-height:320px; overflow-y:auto; padding-right:2px;
      scrollbar-width:thin; scrollbar-color:rgba(212,168,67,.2) transparent;
    }
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════ */
const FEATURES = [
  { icon:"⚡", name:"Magic16 Protocol",      desc:"16-minute daily sessions with streak tracking, XP, and global leaderboard.", tag:"Core",           tagColor:"#d4a843" },
  { icon:"🌙", name:"SleepGold Engine",       desc:"Binaural audio engine (real 40Hz gamma / 10Hz alpha tones) + sleep reminders.", tag:"Real Audio",   tagColor:"#6a9fd4" },
  { icon:"🧠", name:"AI-Powered Coach",       desc:"Personalised daily briefings, progress analysis, and adaptive recommendations.", tag:"AI",          tagColor:"#a78fd4" },
  { icon:"💬", name:"ManifiX Chat",           desc:"24/7 performance assistant for habit advice, mindset coaching, and goal optimisation.", tag:"AI",    tagColor:"#a78fd4" },
  { icon:"🔥", name:"Stress & Burnout Shield",desc:"HRV-guided breathing (box / 4-7-8 patterns) and daily stress check-ins.", tag:"Evidence-based",    tagColor:"#d46a6a" },
  { icon:"📊", name:"Performance Dashboard",  desc:"Real-time XP, level progression, streak graphs, and session history analytics.", tag:"Live",        tagColor:"#4ade80" },
  { icon:"🧬", name:"Mental Health Suite",    desc:"Mood logging, breathing exercises, pattern journaling, and burnout risk scoring.", tag:"Self-care",  tagColor:"#9b8fd4" },
  { icon:"🥗", name:"Nutrition Intelligence", desc:"Macro tracking, meal logging, and smart nutrient recommendations. Multilingual.", tag:"Beta",         tagColor:"#6ad4a0" },
  { icon:"💊", name:"Medication Tracker",     desc:"Smart pill reminders with time-window check-ins and adherence scoring.", tag:"Reminder only",       tagColor:"#d4a843" },
  { icon:"🌍", name:"Global Leaderboard",     desc:"Rank among all active streaks worldwide. Updates on every session completion.", tag:"Live",          tagColor:"#4ade80" },
  { icon:"🛡",  name:"Preventive Health",     desc:"90-day protocol roadmap with milestone tracking and guided breathwork.", tag:"Guided",              tagColor:"#9bbdaa" },
  { icon:"🔔", name:"Smart Notifications",    desc:"Adaptive reminders that learn your peak focus windows and adjust automatically.", tag:"AI",          tagColor:"#a78fd4" },
];

const GOALS = [
  { val:"Discipline",  icon:"⚔", desc:"Daily non-negotiable habits and unbreakable consistency systems." },
  { val:"Peak Focus",  icon:"◎", desc:"Deep work preparation, flow states, and mental clarity optimisation." },
  { val:"Recovery",    icon:"↺", desc:"Sleep quality, stress reduction, and burnout reversal protocols." },
  { val:"Strength",    icon:"↑", desc:"Physical output capacity and mental resilience under pressure." },
  { val:"Longevity",   icon:"∞", desc:"Preventive health, HRV optimisation, and sustainable performance." },
  { val:"Wealth Mind", icon:"◈", desc:"Productivity protocols, decision clarity, and execution speed." },
];

const INTENSITIES = [
  { val:"Standard",    desc:"16 min/day. Sustainable long-term commitment.",          cls:"on-gold", badge:null },
  { val:"High",        desc:"Extended sessions. Accelerated progression tracks.",      cls:"on-gold", badge:"POPULAR" },
  { val:"Elite",       desc:"Full-stack protocol. All modules active daily.",          cls:"on-gold", badge:"RECOMMENDED" },
  { val:"NO EXCUSES",  desc:"Maximum accountability. Zero grace days. No recovery.",  cls:"on-red",  badge:"EXTREME" },
];

const AI_COACHES = [
  { val:"Disciplined",   icon:"◆", desc:"Direct, no-fluff, military precision feedback." },
  { val:"Analytical",    icon:"≡", desc:"Data-driven insights, metrics, and performance graphs." },
  { val:"Motivational",  icon:"▲", desc:"High-energy, positive reinforcement, and momentum focus." },
  { val:"Philosophical", icon:"○", desc:"Mindset depth, stoic principles, and long-game thinking." },
];

const IDENTITIES = [
  { val:"I don't quit.",          sub:"Commitment over motivation." },
  { val:"I finish what I start.", sub:"Execution over intention." },
  { val:"I operate at 1%.",       sub:"Standards non-negotiable." },
  { val:"I am the protocol.",     sub:"Identity fused with action." },
  { val:"Pressure reveals gold.", sub:"Adversity is the training." },
];

const NOTIFICATIONS = [
  { val:"Morning Warrior",   icon:"☀", desc:"6–9 AM daily briefing. Start every day with intent." },
  { val:"Midday Precision",  icon:"◑", desc:"11 AM–1 PM check-ins. Momentum through the grind." },
  { val:"Night Protocol",    icon:"◗", desc:"8–10 PM review. Reflect, prepare, dominate tomorrow." },
  { val:"AI Decides",        icon:"⬡", desc:"System learns your patterns and picks the optimal window." },
];

const COMMITMENTS = [
  { val:"ACTIVATE",    desc:"I am ready to begin the protocol." },
  { val:"NO EXCUSES",  desc:"I accept full accountability for my performance." },
  { val:"I AM ELITE",  desc:"I hold myself to elite standards daily." },
];

const TOTAL_STEPS = 8;

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════ */
const Dots = ({ cur }) => (
  <div style={{ display:"flex", gap:5, marginBottom:22 }}
    role="progressbar" aria-valuenow={cur} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
    {Array.from({ length:TOTAL_STEPS }, (_, i) => {
      const n = i + 1;
      return <div key={i} className={`ob4-dot${n===cur?" cur":n<cur?" done":""}`} />;
    })}
  </div>
);

const Tag = ({ label, color }) => (
  <span style={{
    fontSize:8, letterSpacing:".14em", padding:"2px 7px",
    border:`1px solid ${color}44`, color, borderRadius:2,
    fontFamily:"var(--mono)", textTransform:"uppercase",
    flexShrink:0, whiteSpace:"nowrap",
  }}>{label}</span>
);

const Micro = ({ children, color }) => (
  <div style={{
    fontSize:9, letterSpacing:".26em", textTransform:"uppercase",
    color: color || "var(--tf)", marginBottom:10, fontFamily:"var(--mono)",
  }}>{children}</div>
);

const Heading = ({ children, color }) => (
  <h2 style={{
    fontFamily:"var(--disp)",
    fontSize:"clamp(32px,7.5vw,46px)",
    fontWeight:800, letterSpacing:"-.015em", lineHeight:.96,
    color: color || "var(--tp)", marginBottom:18,
  }}>{children}</h2>
);

const Body = ({ children }) => (
  <p style={{
    fontSize:11, color:"var(--tm)", letterSpacing:".06em",
    lineHeight:1.78, marginBottom:16, fontFamily:"var(--mono)",
  }}>{children}</p>
);

const Card = ({ children, warn, style }) => (
  <div style={{
    background: warn ? "rgba(10,5,5,.98)" : "var(--s1)",
    border:`1px solid ${warn ? "rgba(224,84,84,.18)" : "var(--b)"}`,
    borderRadius:6, padding:"28px 24px",
    position:"relative", overflow:"hidden",
    animation:"ob4-slideup .4s cubic-bezier(.22,1,.36,1) both",
    ...style,
  }}>
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:1,
      background: warn
        ? "linear-gradient(90deg,transparent,rgba(224,84,84,.4),transparent)"
        : "linear-gradient(90deg,transparent,rgba(212,168,67,.2),transparent)",
    }} />
    {children}
  </div>
);

const OptBtn = ({ val, icon, desc, sub, badge, sel, cls, onClick }) => (
  <button type="button" role="radio" aria-checked={sel}
    className={`ob4-opt${sel ? ` ${cls}` : ""}`} onClick={onClick}>
    {icon && (
      <span style={{ fontSize:13, opacity:.6, minWidth:14, textAlign:"center", flexShrink:0 }}>
        {icon}
      </span>
    )}
    <span style={{ flex:1 }}>
      <span style={{ display:"block" }}>{val}</span>
      {(desc || sub) && (
        <span style={{
          display:"block", fontSize:9, letterSpacing:".07em",
          textTransform:"none", fontStyle:"italic", marginTop:2, opacity:.5,
        }}>{desc || sub}</span>
      )}
    </span>
    {badge && (
      <span style={{
        fontSize:8, letterSpacing:".12em", padding:"2px 6px",
        border:`1px solid ${sel ? "currentColor" : "var(--b)"}`,
        borderRadius:2, opacity:sel ? 1 : .4, whiteSpace:"nowrap",
      }}>{badge}</span>
    )}
    <span style={{
      width:13, height:13, borderRadius:"50%", flexShrink:0, marginLeft:4,
      border:`1px solid ${sel ? "currentColor" : "var(--b)"}`,
      background: sel ? "currentColor" : "transparent",
      transition:"background .18s, border-color .18s",
    }} aria-hidden />
  </button>
);

const SumRow = ({ label, val, red }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"baseline",
    fontSize:10, letterSpacing:".12em", padding:"5px 0",
    borderBottom:"1px solid var(--b)",
  }}>
    <span style={{ color:"var(--tf)", textTransform:"uppercase" }}>{label}</span>
    <span style={{ color: red ? "var(--r)" : "var(--g)", textAlign:"right", maxWidth:"62%" }}>{val}</span>
  </div>
);

const AIBadge = () => (
  <div style={{
    display:"inline-flex", alignItems:"center", gap:6, padding:"3px 10px",
    border:"1px solid rgba(212,168,67,.22)", borderRadius:2,
    fontSize:8, letterSpacing:".2em", color:"rgba(212,168,67,.6)",
    textTransform:"uppercase", marginBottom:10, fontFamily:"var(--mono)",
  }}>
    <span className="ob4-blink" style={{ color:"var(--g)", fontSize:7 }} aria-hidden>●</span>
    AI-Powered Performance OS
  </div>
);

/* ══════════════════════════════════════════════════════
   PAGE VARIANTS
══════════════════════════════════════════════════════ */
const PV = {
  enter:  { opacity:0, y:20, scale:.985 },
  center: { opacity:1, y:0, scale:1, transition:{ duration:.38, ease:[.22,1,.36,1] } },
  exit:   { opacity:0, y:-14, scale:.98, transition:{ duration:.22, ease:[.55,0,1,.45] } },
};

/* ══════════════════════════════════════════════════════
   STEP COMPONENTS
══════════════════════════════════════════════════════ */

/* Step 1 — Feature showcase */
const Step1 = ({ onNext }) => (
  <Card>
    <Dots cur={1} />
    <Micro>Your ManifiX Suite — Everything Included</Micro>
    <Heading>All modules<br />unlocked.</Heading>
    <Body>Every feature activates today. AI-powered coaching, real binaural audio, live leaderboards, and more.</Body>
    <div className="ob4-feat-scroll" style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:4 }}>
      {FEATURES.map(({ icon, name, desc, tag, tagColor }) => (
        <div key={name} className="ob4-feat">
          <span style={{ fontSize:15, flexShrink:0, marginTop:1 }}>{icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
              <span style={{
                fontFamily:"var(--mono)", fontSize:10,
                letterSpacing:".12em", color:"var(--tp)", textTransform:"uppercase",
              }}>{name}</span>
              <Tag label={tag} color={tagColor} />
            </div>
            <div style={{
              fontSize:9.5, color:"var(--tf)", lineHeight:1.6,
              fontFamily:"var(--mono)", letterSpacing:".04em",
            }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
    <button type="button" className="ob4-cta ob4-pulse" onClick={onNext}>
      Configure my profile →
    </button>
  </Card>
);

/* Step 2 — Goal */
const Step2 = ({ goal, setGoal, onNext }) => (
  <Card>
    <Dots cur={2} />
    <Micro>Step 2 of {TOTAL_STEPS} — Primary Optimisation Goal</Micro>
    <Heading>What are you<br />training for?</Heading>
    <Body>Your AI coach, session structure, and daily briefings adapt to this goal.</Body>
    <div role="radiogroup" aria-label="Select primary goal" style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {GOALS.map(({ val, icon, desc }) => (
        <OptBtn key={val} val={val} icon={icon} desc={desc}
          sel={goal===val} cls="on-gold" onClick={() => setGoal(val)} />
      ))}
    </div>
    <button type="button" className="ob4-cta" disabled={!goal} onClick={onNext}>
      Continue →
    </button>
  </Card>
);

/* Step 3 — Intensity */
const Step3 = ({ intensity, setIntensity, onNext }) => {
  const isExtreme = intensity === "NO EXCUSES";
  return (
    <Card>
      <Dots cur={3} />
      <Micro>Step 3 of {TOTAL_STEPS} — Intensity Threshold</Micro>
      <Heading>Set your<br />threshold.</Heading>
      <Body>Determines session length, accountability mechanics, and streak penalty rules.</Body>
      <div role="radiogroup" aria-label="Select intensity" style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {INTENSITIES.map(({ val, desc, cls, badge }) => (
          <OptBtn key={val} val={val} desc={desc} badge={badge}
            sel={intensity===val} cls={cls} onClick={() => setIntensity(val)} />
        ))}
      </div>
      {isExtreme && (
        <div className="ob4-fadeup" style={{
          marginTop:10, padding:"9px 12px", background:"var(--rd)",
          border:"1px solid rgba(224,84,84,.2)", borderRadius:3,
          fontSize:9, letterSpacing:".1em", color:"var(--r)",
          fontFamily:"var(--mono)", lineHeight:1.65,
        }}>
          ⚠ NO EXCUSES mode: one missed day resets your streak to zero. No recovery window.
        </div>
      )}
      <button type="button"
        className={`ob4-cta${isExtreme ? " warn" : ""}`}
        disabled={!intensity} onClick={onNext}>
        Continue →
      </button>
    </Card>
  );
};

/* Step 4 — AI Coach */
const Step4 = ({ aiCoach, setAiCoach, onNext }) => (
  <Card>
    <Dots cur={4} />
    <AIBadge />
    <Micro>Step 4 of {TOTAL_STEPS} — AI Coach Preference</Micro>
    <Heading>How should<br />your coach talk?</Heading>
    <Body>Your AI coach delivers daily briefings, motivation, and progress feedback. Choose your preferred tone.</Body>
    <div role="radiogroup" aria-label="Select AI coach tone" style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {AI_COACHES.map(({ val, icon, desc }) => (
        <OptBtn key={val} val={val} icon={icon} desc={desc}
          sel={aiCoach===val} cls="on-gold" onClick={() => setAiCoach(val)} />
      ))}
    </div>
    <button type="button" className="ob4-cta" disabled={!aiCoach} onClick={onNext}>
      Continue →
    </button>
  </Card>
);

/* Step 5 — Warning */
const Step5 = ({ intensity, onAccept, onBack }) => {
  const isExtreme = intensity === "NO EXCUSES";
  return (
    <Card warn>
      <Dots cur={5} />
      <Micro color="var(--r)">⚠ Protocol Terms — Read Carefully</Micro>
      <Heading color="var(--r)">Miss once.<br />Start over.</Heading>
      <div style={{
        fontSize:11, lineHeight:1.9, color:"rgba(224,84,84,.45)",
        letterSpacing:".06em", marginBottom:22,
        fontFamily:"var(--mono)",
        borderLeft:"2px solid rgba(224,84,84,.18)", paddingLeft:12,
      }}>
        Streaks are unforgiving by design. One missed day resets your counter to zero.
        No exceptions. The system does not negotiate.
        {isExtreme && (
          <><br /><br />
          <span style={{ color:"var(--r)" }}>
            You selected NO EXCUSES. Full accountability is active from day one.
            There is no grace period.
          </span></>
        )}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button type="button" className="ob4-cta warn" style={{ flex:1, marginTop:0 }} onClick={onBack}>
          ← Change intensity
        </button>
        <button type="button" className="ob4-cta warn" style={{ flex:2, marginTop:0 }} onClick={onAccept}>
          I accept the terms →
        </button>
      </div>
    </Card>
  );
};

/* Step 6 — Identity */
const Step6 = ({ identity, setIdentity, onNext }) => (
  <Card>
    <Dots cur={6} />
    <Micro>Step 6 of {TOTAL_STEPS} — Identity Statement</Micro>
    <Heading>Who do you<br />become?</Heading>
    <Body>This statement anchors your ManifiX identity and displays on your dashboard every day.</Body>
    <div role="radiogroup" aria-label="Select identity statement" style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {IDENTITIES.map(({ val, sub }) => (
        <OptBtn key={val} val={`"${val}"`} sub={sub}
          sel={identity===val} cls="on-gold"
          onClick={() => setIdentity(val)} />
      ))}
    </div>
    <button type="button" className="ob4-cta" disabled={!identity} onClick={onNext}>
      Sync identity →
    </button>
  </Card>
);

/* Step 7 — Notifications */
const Step7 = ({ notifications, setNotifications, onNext }) => (
  <Card>
    <Dots cur={7} />
    <Micro>Step 7 of {TOTAL_STEPS} — Notification Preference</Micro>
    <Heading>When should<br />we reach you?</Heading>
    <Body>Your AI learns your peak windows over time, but set your base preference now.</Body>
    <div role="radiogroup" aria-label="Notification preference" style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {NOTIFICATIONS.map(({ val, icon, desc }) => (
        <OptBtn key={val} val={val} icon={icon} desc={desc}
          sel={notifications===val} cls="on-gold"
          onClick={() => setNotifications(val)} />
      ))}
    </div>
    <button type="button" className="ob4-cta" disabled={!notifications} onClick={onNext}>
      Continue →
    </button>
  </Card>
);

/* Step 8 — Final lock */
const Step8 = ({
  goal, intensity, aiCoach, notifications, identity,
  commitment, setCommitment,
  loading, authError, onSubmit, onBack,
}) => {
  const isExtreme = intensity === "NO EXCUSES";
  const canSubmit = !!commitment && !loading;

  return (
    <Card>
      <Dots cur={8} />
      <Micro>Final Lock — Seal the Protocol</Micro>
      <Heading>Prove<br />it.</Heading>

      {/* Summary */}
      <div style={{
        background:"var(--s2)", border:"1px solid var(--b)",
        borderRadius:3, padding:"10px 13px", marginBottom:18,
      }}>
        <SumRow label="Goal"       val={goal} />
        <SumRow label="Intensity"  val={intensity} red={isExtreme} />
        <SumRow label="AI Coach"   val={aiCoach} />
        <SumRow label="Alerts"     val={notifications} />
        <div style={{ borderBottom:"none" }}>
          <SumRow label="Identity" val={`"${identity}"`} />
        </div>
      </div>

      {/* Activation phrase selector */}
      <div>
        <div style={{
          fontSize:9, letterSpacing:".22em", textTransform:"uppercase",
          color:"var(--tf)", padding:"9px 14px",
          background:"var(--s2)", border:"1px solid var(--b)",
          borderBottom:"none", borderRadius:"3px 3px 0 0",
          fontFamily:"var(--mono)",
        }}>
          Choose your activation phrase to seal the protocol
        </div>
        <div role="radiogroup" aria-label="Select activation phrase"
          style={{
            display:"flex", flexDirection:"column", gap:5,
            border:"1px solid var(--b)", borderTop:"none",
            padding:10, background:"var(--s1)", borderRadius:"0 0 3px 3px",
          }}>
          {COMMITMENTS.map(({ val, desc }) => (
            <button key={val} type="button" role="radio" aria-checked={commitment===val}
              className={`ob4-opt${commitment===val ? " on-gold" : ""}`}
              style={{ padding:"9px 12px" }}
              onClick={() => setCommitment(val)}>
              <span style={{ flex:1 }}>
                <span style={{ display:"block", fontSize:13, letterSpacing:".2em" }}>{val}</span>
                <span style={{
                  display:"block", fontSize:9, letterSpacing:".07em",
                  textTransform:"none", fontStyle:"italic", marginTop:2, opacity:.5,
                }}>{desc}</span>
              </span>
              <span style={{
                width:13, height:13, borderRadius:"50%", flexShrink:0, marginLeft:4,
                border:`1px solid ${commitment===val ? "currentColor" : "var(--b)"}`,
                background: commitment===val ? "currentColor" : "transparent",
                transition:"background .18s, border-color .18s",
              }} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <button type="button"
        className={`ob4-cta${canSubmit ? " ob4-pulse" : ""}`}
        disabled={!canSubmit} onClick={onSubmit}>
        {loading
          ? <><span className="ob4-spin" aria-hidden />Syncing profile…</>
          : "Activate ManifiX →"
        }
      </button>

      {authError && (
        <div role="alert" aria-live="assertive" className="ob4-fadeup" style={{
          marginTop:10, padding:"9px 13px",
          background:"var(--rd)", border:"1px solid rgba(224,84,84,.22)",
          borderRadius:3, fontFamily:"var(--mono)", fontSize:9,
          letterSpacing:".12em", color:"var(--r)", lineHeight:1.7,
        }}>
          ⚠ {authError}
        </div>
      )}

      <button type="button" onClick={onBack} style={{
        background:"none", border:"none", color:"var(--tf)",
        fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em",
        textTransform:"uppercase", cursor:"pointer",
        display:"block", width:"100%", textAlign:"center",
        marginTop:12, padding:"6px 0", transition:"color .18s",
      }}
        onMouseEnter={e => e.currentTarget.style.color="var(--tm)"}
        onMouseLeave={e => e.currentTarget.style.color="var(--tf)"}>
        ← Back
      </button>
    </Card>
  );
};

/* Done screen */
const DoneScreen = ({ goal, intensity, navigate }) => (
  <Card style={{ textAlign:"center" }}>
    <div style={{ fontSize:32, marginBottom:16 }}>⚡</div>
    <Micro color="var(--g)">Protocol Active</Micro>
    <Heading>ManifiX<br />Activated.</Heading>
    <Body>Your profile is live. AI coach is calibrating. First session available now.</Body>
    <div style={{
      background:"var(--s2)", border:"1px solid rgba(212,168,67,.15)",
      borderRadius:3, padding:"14px 16px", marginBottom:16,
    }}>
      <div style={{
        fontSize:9, letterSpacing:".2em", color:"var(--tf)",
        textTransform:"uppercase", marginBottom:12, fontFamily:"var(--mono)",
      }}>Your Protocol</div>
      <div style={{ display:"flex", justifyContent:"space-around", gap:10 }}>
        {[["GOAL", goal], ["MODE", intensity], ["STREAK", "0"], ["XP", "0"]].map(([l, v]) => (
          <div key={l}>
            <div style={{
              fontSize:8, letterSpacing:".2em", color:"var(--tf)",
              textTransform:"uppercase", marginBottom:4, fontFamily:"var(--mono)",
            }}>{l}</div>
            <div style={{
              fontSize:14, fontWeight:700, color:"var(--g)",
              letterSpacing:".1em", fontFamily:"var(--mono)",
            }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
    <button type="button" className="ob4-cta ob4-pulse"
      onClick={() => navigate("/app/dashboard", { replace:true })}>
      Launch first session →
    </button>
  </Card>
);

/* ══════════════════════════════════════════════════════
   INTRO SCREEN
══════════════════════════════════════════════════════ */
const IntroScreen = ({ scanPct }) => (
  <div style={{
    textAlign:"center", zIndex:1, position:"relative",
    display:"flex", flexDirection:"column", alignItems:"center", gap:20,
  }}>
    <AIBadge />
    <div style={{
      fontFamily:"var(--disp)", fontSize:"clamp(50px,12vw,82px)",
      fontWeight:800, letterSpacing:"-.025em", color:"var(--tp)", lineHeight:1,
    }}>MANIFIX</div>

    <div style={{
      width:"min(260px,70vw)", height:2,
      background:"var(--b)", borderRadius:9, overflow:"hidden",
    }}>
      <div style={{
        height:"100%", width:`${scanPct}%`,
        background:"var(--g)", transition:"width .05s linear", borderRadius:9,
      }} />
    </div>

    <div style={{
      fontFamily:"var(--mono)", fontSize:11, letterSpacing:".2em",
      color:"var(--tm)", display:"flex", alignItems:"center", gap:10,
    }}>
      <span className="ob4-blink" style={{ color:"var(--g)", fontSize:7 }} aria-hidden>●</span>
      Initialising profile — {scanPct}%
    </div>

    <div style={{
      display:"flex", flexDirection:"column", gap:5, marginTop:4,
      animation:"ob4-fadeup .6s ease .35s both",
    }}>
      {[
        ["Magic16 Protocol",    "active"],
        ["SleepGold Engine",    "active"],
        ["AI Coach",            "active"],
        ["Mental Health Suite", "active"],
        ["Global Leaderboard",  "active"],
        ["Nutrition Intelligence", "beta"],
      ].map(([m, st]) => (
        <div key={m} style={{
          fontFamily:"var(--mono)", fontSize:9, letterSpacing:".18em",
          color:"var(--tf)", textTransform:"uppercase",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{ color:"var(--g)", fontSize:7 }}>✓</span>
          {m} — <span style={{ color:"var(--g)" }}>{st}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();

  const [phase,         setPhase]         = useState("intro");
  const [step,          setStep]          = useState(1);
  const [scanPct,       setScanPct]       = useState(0);
  const [goal,          setGoal]          = useState("");
  const [intensity,     setIntensity]     = useState("");
  const [aiCoach,       setAiCoach]       = useState("");
  const [identity,      setIdentity]      = useState("");
  const [notifications, setNotifications] = useState("");
  const [commitment,    setCommitment]    = useState("");
  const [loading,       setLoading]       = useState(false);
  const [authError,     setAuthError]     = useState("");
  const [done,          setDone]          = useState(false);

  useEffect(() => { injectStyles(); }, []);

  /* Intro scan */
  useEffect(() => {
    if (phase !== "intro") return;
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(pct + Math.random() * 4.5 + 1.5, 100);
      setScanPct(Math.floor(pct));
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => setPhase("steps"), 400);
      }
    }, 24);
    return () => clearInterval(iv);
  }, [phase]);

  /* Final submit */
  const handleFinalLock = useCallback(async () => {
    if (loading || !commitment) return;
    setAuthError("");
    setLoading(true);

    try {
      localStorage.setItem("magic16_streak",        "0");
      localStorage.setItem("magic16_xp",            "0");
      localStorage.setItem("magic16_level",         "1");
      localStorage.setItem("magic16_goal",          goal);
      localStorage.setItem("magic16_intensity",     intensity);
      localStorage.setItem("magic16_ai_coach",      aiCoach);
      localStorage.setItem("magic16_identity",      identity);
      localStorage.setItem("magic16_notifications", notifications);
      localStorage.setItem("magic16_commitment",    commitment);
      localStorage.setItem("magic16_onboarded_at",  String(Date.now()));
      localStorage.setItem("magic16_total_sessions","0");
    } catch (e) {
      console.warn("[ManifiX] localStorage write:", e.message);
    }

    try {
      const user = await authService.getCurrentUser();
      if (user) await authService.completeOnboarding(user.id);
      setDone(true);
    } catch (err) {
      console.error("[ManifiX] completeOnboarding failed:", err);
      setAuthError("Profile sync failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, commitment, goal, intensity, aiCoach, identity, notifications]);

  /* Keyboard nav */
  const onKey = useCallback((e) => {
    if (e.key !== "Enter" || phase !== "steps") return;
    if (step === 1)                           setStep(2);
    else if (step === 2 && goal)              setStep(3);
    else if (step === 3 && intensity)         setStep(4);
    else if (step === 4 && aiCoach)           setStep(5);
    else if (step === 5)                      setStep(6);
    else if (step === 6 && identity)          setStep(7);
    else if (step === 7 && notifications)     setStep(8);
    else if (step === 8 && commitment)        handleFinalLock();
  }, [phase, step, goal, intensity, aiCoach, identity, notifications, commitment, handleFinalLock]);

  return (
    <div id="mfob4" onKeyDown={onKey} style={{
      minHeight:"100dvh", background:"var(--bg)",
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative", overflow:"hidden", padding:"20px 16px",
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position:"fixed", top:"18%", left:"50%",
        width:500, height:300, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(212,168,67,.1) 0%,transparent 70%)",
        animation:"ob4-breathe 7s ease-in-out infinite",
        pointerEvents:"none", zIndex:0,
      }} />

      {/* Scan line */}
      <div aria-hidden style={{
        position:"fixed", left:0, right:0, height:60,
        background:"linear-gradient(180deg,transparent,rgba(212,168,67,.022),transparent)",
        animation:"ob4-scan 4.5s ease-in-out infinite",
        pointerEvents:"none", zIndex:0,
      }} />

      {/* Corner brackets */}
      {[
        { top:14, left:14,  borderTop:"1px solid var(--b)", borderLeft:"1px solid var(--b)"   },
        { top:14, right:14, borderTop:"1px solid var(--b)", borderRight:"1px solid var(--b)"  },
        { bottom:14, left:14,  borderBottom:"1px solid var(--b)", borderLeft:"1px solid var(--b)"  },
        { bottom:14, right:14, borderBottom:"1px solid var(--b)", borderRight:"1px solid var(--b)" },
      ].map((pos, i) => (
        <div key={i} aria-hidden style={{ position:"fixed", width:18, height:18, ...pos }} />
      ))}

      {/* Version */}
      <div aria-hidden style={{
        position:"fixed", bottom:14, left:18,
        fontSize:8, letterSpacing:".2em", color:"var(--tf)",
        fontFamily:"var(--mono)", textTransform:"uppercase",
      }}>ManifiX · v4.0</div>

      <AnimatePresence mode="wait">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <motion.div key="intro"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"relative", zIndex:1 }}>
            <IntroScreen scanPct={scanPct} />
          </motion.div>
        )}

        {/* ── DONE ── */}
        {phase === "steps" && done && (
          <motion.div key="done" variants={PV} initial="enter" animate="center" exit="exit"
            style={{ position:"relative", zIndex:1, width:"min(440px,96vw)" }}>
            <DoneScreen goal={goal} intensity={intensity} navigate={navigate} />
          </motion.div>
        )}

        {/* ── STEPS ── */}
        {phase === "steps" && !done && (
          <div style={{ position:"relative", zIndex:1, width:"min(440px,96vw)" }}>
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="s1" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step1 onNext={() => setStep(2)} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step2 goal={goal} setGoal={setGoal} onNext={() => setStep(3)} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step3 intensity={intensity} setIntensity={setIntensity} onNext={() => setStep(4)} />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step4 aiCoach={aiCoach} setAiCoach={setAiCoach} onNext={() => setStep(5)} />
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step5
                    intensity={intensity}
                    onAccept={() => setStep(6)}
                    onBack={() => setStep(3)}
                  />
                </motion.div>
              )}

              {step === 6 && (
                <motion.div key="s6" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step6 identity={identity} setIdentity={setIdentity} onNext={() => setStep(7)} />
                </motion.div>
              )}

              {step === 7 && (
                <motion.div key="s7" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step7
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onNext={() => setStep(8)}
                  />
                </motion.div>
              )}

              {step === 8 && (
                <motion.div key="s8" variants={PV} initial="enter" animate="center" exit="exit">
                  <Step8
                    goal={goal} intensity={intensity}
                    aiCoach={aiCoach} notifications={notifications}
                    identity={identity}
                    commitment={commitment} setCommitment={setCommitment}
                    loading={loading} authError={authError}
                    onSubmit={handleFinalLock}
                    onBack={() => { setStep(7); setAuthError(""); }}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
