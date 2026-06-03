/**
 * ManifiX — FeedbackPage.jsx  (Production v1)
 * ─────────────────────────────────────────────
 * ✔ Star rating with animated hover
 * ✔ Quick-pick questions (love / frustrate / recommend)
 * ✔ Feature upvote panel
 * ✔ Open textarea
 * ✔ Personal founder message
 * ✔ Supabase-ready POST to /api/feedback
 * ✔ Full ManifiX gold-dark design system
 * ✔ Mobile responsive
 */

import React, { useState, useEffect, useRef } from "react";
import { Flame, Zap, Brain, Star, Send, CheckCircle,
         ThumbsUp, ThumbsDown, Minus, ChevronRight,
         Sparkles, Heart, MessageSquare, Users } from "lucide-react";

/* ══════════════════════════════════════════════
   DESIGN TOKENS (mirrors MainLayout)
══════════════════════════════════════════════ */
const T = {
  gold:       "#D4AF37",
  goldLight:  "#F0D060",
  goldDim:    "rgba(212,175,55,0.15)",
  goldGlow:   "rgba(212,175,55,0.32)",
  goldBorder: "rgba(212,175,55,0.20)",
  bg:         "#080810",
  surface:    "#0D0D18",
  surface2:   "#12121E",
  border:     "rgba(212,175,55,0.11)",
  borderHi:   "rgba(212,175,55,0.30)",
  text:       "#ECEEF8",
  muted:      "rgba(236,238,248,0.45)",
  dim:        "rgba(236,238,248,0.20)",
  font:       "'Syne', sans-serif",
  mono:       "'JetBrains Mono', monospace",
  body:       "'DM Sans', sans-serif",
  green:      "#4ADE80",
  red:        "#F87171",
  purple:     "rgba(120,80,255,0.55)",
};

/* ══════════════════════════════════════════════
   CSS INJECTION
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes fb-fadeup {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:none; }
  }
  @keyframes fb-shimmer {
    0%   { background-position:-300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes fb-pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(212,175,55,.5); }
    60%     { box-shadow:0 0 0 10px rgba(212,175,55,0); }
  }
  @keyframes fb-scan {
    0%   { transform:translateY(-100%); }
    100% { transform:translateY(6000%); }
  }
  @keyframes fb-star-pop {
    0%   { transform:scale(1); }
    40%  { transform:scale(1.35) rotate(-8deg); }
    100% { transform:scale(1) rotate(0deg); }
  }
  @keyframes fb-success-in {
    0%   { opacity:0; transform:scale(0.8) translateY(10px); }
    60%  { transform:scale(1.04); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes fb-bar-fill {
    from { width:0; }
    to   { width:var(--bar-w); }
  }
  @keyframes fb-orb {
    0%,100%{ transform:translate(0,0) scale(1); }
    50%    { transform:translate(20px,-16px) scale(1.07); }
  }
  @keyframes fb-blink {
    0%,49%,100%{ opacity:1; } 50%,99%{ opacity:0; }
  }
  @keyframes fb-float {
    0%,100%{ transform:translateY(0); }
    50%    { transform:translateY(-6px); }
  }
  @keyframes fb-grid {
    0%,100%{ opacity:.025; } 50%{ opacity:.055; }
  }
  @keyframes fb-check-draw {
    from { stroke-dashoffset:100; }
    to   { stroke-dashoffset:0; }
  }

  .fb-gold {
    background:linear-gradient(90deg,#9A6F00,${T.gold},${T.goldLight},${T.gold},#9A6F00);
    background-size:300% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:fb-shimmer 5s linear infinite;
  }

  .fb-card {
    background:linear-gradient(135deg,rgba(13,13,24,0.97) 0%,rgba(18,18,30,0.97) 100%);
    border:1px solid ${T.border};
    border-radius:16px;
    padding:28px;
    position:relative;
    overflow:hidden;
    animation:fb-fadeup .4s ease both;
    transition:border-color .25s;
  }
  .fb-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,${T.gold}55,transparent);
  }
  .fb-card:hover { border-color:rgba(212,175,55,0.22); }

  .fb-star {
    cursor:pointer; font-size:28px; line-height:1;
    color:rgba(212,175,55,0.18);
    transition:color .15s, transform .15s;
    user-select:none; display:inline-block;
    -webkit-tap-highlight-color:transparent;
  }
  .fb-star.hovered, .fb-star.filled { color:${T.gold}; }
  .fb-star.just-filled { animation:fb-star-pop .3s cubic-bezier(.16,1,.3,1) both; }

  .fb-quick-btn {
    display:flex; align-items:center; gap:8px;
    padding:10px 14px; border-radius:9px;
    border:1px solid ${T.border};
    background:rgba(212,175,55,0.04);
    color:${T.muted}; font-size:12px; font-weight:600;
    font-family:${T.mono}; letter-spacing:.06em;
    cursor:pointer; transition:all .18s; text-transform:uppercase;
    -webkit-tap-highlight-color:transparent;
  }
  .fb-quick-btn:hover { border-color:${T.goldBorder}; color:${T.gold}; background:${T.goldDim}; }
  .fb-quick-btn.selected {
    border-color:rgba(212,175,55,0.45);
    background:linear-gradient(90deg,rgba(212,175,55,0.16) 0%,rgba(212,175,55,0.06) 100%);
    color:${T.gold};
    box-shadow:inset 3px 0 0 ${T.gold};
  }

  .fb-feature-btn {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 16px; border-radius:10px;
    border:1px solid ${T.border};
    background:rgba(212,175,55,0.03);
    cursor:pointer; transition:all .2s;
    -webkit-tap-highlight-color:transparent;
  }
  .fb-feature-btn:hover { border-color:${T.goldBorder}; background:rgba(212,175,55,0.07); }
  .fb-feature-btn.voted {
    border-color:rgba(212,175,55,0.4);
    background:linear-gradient(90deg,rgba(212,175,55,0.12) 0%,rgba(212,175,55,0.04) 100%);
  }

  .fb-vote-pill {
    display:flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:20px;
    font-family:${T.mono}; font-size:10px; font-weight:700;
    background:rgba(212,175,55,0.08); border:1px solid ${T.border};
    color:${T.muted}; transition:all .2s; letter-spacing:.06em;
  }
  .fb-feature-btn.voted .fb-vote-pill {
    background:linear-gradient(135deg,${T.gold} 0%,#8A6010 100%);
    border-color:transparent; color:#050508;
  }

  .fb-bar-track {
    height:4px; border-radius:4px;
    background:rgba(212,175,55,0.08); overflow:hidden; flex:1;
  }
  .fb-bar-fill {
    height:100%; border-radius:4px;
    background:linear-gradient(90deg,#8A6010,${T.gold});
    animation:fb-bar-fill .9s cubic-bezier(.16,1,.3,1) .3s both;
  }

  .fb-textarea {
    width:100%; min-height:110px; resize:vertical;
    background:rgba(8,8,16,0.8);
    border:1px solid ${T.border};
    border-radius:10px; padding:14px 16px;
    color:${T.text}; font-family:${T.body};
    font-size:14px; line-height:1.6;
    outline:none; transition:border-color .2s, box-shadow .2s;
    box-sizing:border-box;
  }
  .fb-textarea:focus {
    border-color:rgba(212,175,55,0.35);
    box-shadow:0 0 0 3px rgba(212,175,55,0.06);
  }
  .fb-textarea::placeholder { color:${T.dim}; }

  .fb-submit {
    display:flex; align-items:center; justify-content:center; gap:9px;
    width:100%; padding:14px;
    background:linear-gradient(135deg,${T.gold} 0%,#8A6010 100%);
    border:none; border-radius:10px;
    color:#050508; font-family:${T.font};
    font-size:13px; font-weight:800;
    letter-spacing:.14em; text-transform:uppercase;
    cursor:pointer; transition:opacity .2s, transform .15s;
    box-shadow:0 6px 28px rgba(212,175,55,0.35);
    animation:fb-pulse 2.8s ease-in-out infinite;
    -webkit-tap-highlight-color:transparent;
  }
  .fb-submit:hover { opacity:.88; transform:translateY(-1px); }
  .fb-submit:active { transform:scale(.97); }
  .fb-submit:disabled { opacity:.5; cursor:not-allowed; animation:none; transform:none; }

  .fb-success-panel {
    animation:fb-success-in .55s cubic-bezier(.16,1,.3,1) both;
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; gap:16px; text-align:center;
    padding:48px 24px; min-height:420px;
  }

  .fb-section-label {
    font-family:${T.mono}; font-size:9px; font-weight:700;
    color:${T.dim}; letter-spacing:.18em; text-transform:uppercase;
    margin-bottom:12px; display:flex; align-items:center; gap:7px;
  }
  .fb-section-label::before, .fb-section-label::after {
    content:''; flex:1; height:1px;
    background:linear-gradient(90deg,transparent,${T.border},transparent);
  }

  /* Scan line */
  .fb-scan {
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,${T.gold}44,transparent);
    animation:fb-scan 6s linear infinite; pointer-events:none;
  }

  @media (max-width:600px) {
    .fb-card { padding:18px; }
    .fb-star { font-size:34px; }
  }
`;

function injectCSS() {
  const id = "manifix-feedback-v1";
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const UPCOMING_FEATURES = [
  { id: "ai_coach",   label: "AI Daily Coach",     desc: "Personalized morning briefing from your AI",  votes: 47, Icon: Brain    },
  { id: "challenges", label: "Squad Challenges",   desc: "Compete with friends on 7-day health sprints",votes: 34, Icon: Users    },
  { id: "wearable",   label: "Wearable Sync",      desc: "Apple Watch / Fitbit live data integration",  votes: 61, Icon: Zap      },
  { id: "streaks_v2", label: "Streak Rewards",     desc: "Earn real rewards for consistency milestones",votes: 55, Icon: Flame    },
  { id: "ai_plans",   label: "AI Meal Planner",    desc: "Weekly nutrition plans generated for your goals",votes:28,Icon: Sparkles },
];

const QUICK_FEATURES = [
  "Magic16 System", "ManifiX AI", "Leaderboard", "Dashboard", "Health Trackers", "Sleep Module",
];

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */
function Atmosphere() {
  return (
    <>
      <div aria-hidden style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:`
          linear-gradient(rgba(212,175,55,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(212,175,55,0.025) 1px,transparent 1px)
        `,
        backgroundSize:"52px 52px",
        animation:"fb-grid 10s ease-in-out infinite",
      }}/>
      <div aria-hidden style={{
        position:"fixed", width:600, height:600, borderRadius:"50%",
        top:-180, left:-150, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle,rgba(212,175,55,0.05) 0%,transparent 70%)",
        filter:"blur(80px)", animation:"fb-orb 18s ease-in-out infinite",
      }}/>
      <div aria-hidden style={{
        position:"fixed", width:400, height:400, borderRadius:"50%",
        bottom:-80, right:-80, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle,rgba(100,60,220,0.04) 0%,transparent 70%)",
        filter:"blur(80px)",
        animation:"fb-orb 22s ease-in-out infinite", animationDelay:"-10s",
      }}/>
    </>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const [lastClicked, setLastClicked] = useState(0);

  const handleClick = (s) => {
    setLastClicked(s);
    onChange(s);
    setTimeout(() => setLastClicked(0), 320);
  };

  return (
    <div style={{ display:"flex", gap:8, alignItems:"center", padding:"4px 0" }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          className={`fb-star${(hover>=s||value>=s)?" filled":""}${lastClicked===s?" just-filled":""}`}
          onClick={() => handleClick(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
      {value > 0 && (
        <span style={{
          fontFamily:T.mono, fontSize:10, color:T.gold,
          letterSpacing:".1em", marginLeft:4,
        }}>
          {["","POOR","FAIR","GOOD","GREAT","PERFECT"][value]}
        </span>
      )}
    </div>
  );
}

function FeatureVoteItem({ feature, voted, onVote, totalVoters }) {
  const pct = Math.round((feature.votes / Math.max(totalVoters, 1)) * 100);
  return (
    <div
      className={`fb-feature-btn${voted ? " voted" : ""}`}
      onClick={onVote}
    >
      <div style={{ display:"flex", alignItems:"center", gap:11, flex:1, minWidth:0 }}>
        <div style={{
          width:34, height:34, borderRadius:9, flexShrink:0,
          background: voted
            ? `linear-gradient(135deg,${T.gold} 0%,#8A6010 100%)`
            : "rgba(212,175,55,0.08)",
          border:`1px solid ${voted ? "transparent" : T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <feature.Icon size={15} color={voted ? "#050508" : T.gold} />
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{
            fontFamily:T.font, fontSize:12, fontWeight:700,
            color: voted ? T.gold : T.text,
            letterSpacing:".05em", marginBottom:3,
          }}>{feature.label}</div>
          <div style={{
            fontFamily:T.body, fontSize:11, color:T.muted,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>{feature.desc}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
            <div className="fb-bar-track">
              <div className="fb-bar-fill" style={{ "--bar-w":`${pct}%`, width:`${pct}%` }}/>
            </div>
            <span style={{ fontFamily:T.mono, fontSize:9, color:T.dim, whiteSpace:"nowrap" }}>{pct}%</span>
          </div>
        </div>
      </div>
      <div className="fb-vote-pill" style={{ marginLeft:12, flexShrink:0 }}>
        <ThumbsUp size={9} />
        {voted ? feature.votes + 1 : feature.votes}
      </div>
    </div>
  );
}

function SuccessPanel({ rating }) {
  const msgs = [
    "We'll read your feedback personally — thank you for being part of the founding story.",
    "You're helping shape the future of ManifiX. This means everything.",
    "Building this for people like you makes every late night worth it.",
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  return (
    <div className="fb-success-panel">
      {/* Animated check circle */}
      <div style={{
        width:80, height:80, borderRadius:"50%",
        background:"rgba(74,222,128,0.08)",
        border:"2px solid rgba(74,222,128,0.35)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"fb-float 3s ease-in-out infinite",
        boxShadow:"0 0 32px rgba(74,222,128,0.15)",
      }}>
        <CheckCircle size={36} color={T.green} strokeWidth={1.5} />
      </div>

      <div>
        <div className="fb-gold" style={{
          fontFamily:T.font, fontSize:22, fontWeight:800,
          letterSpacing:".1em", textAlign:"center", marginBottom:8,
        }}>THANK YOU</div>
        <div style={{
          fontFamily:T.body, fontSize:14, color:T.muted,
          lineHeight:1.65, textAlign:"center", maxWidth:320,
        }}>{msg}</div>
      </div>

      {rating > 0 && (
        <div style={{
          display:"flex", gap:4,
          padding:"10px 20px",
          background:"rgba(212,175,55,0.07)",
          border:`1px solid ${T.border}`, borderRadius:30,
        }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{
              fontSize:18, color: s <= rating ? T.gold : "rgba(212,175,55,0.15)",
            }}>★</span>
          ))}
        </div>
      )}

      <div style={{
        fontFamily:T.mono, fontSize:10, color:T.dim,
        letterSpacing:".12em", textTransform:"uppercase",
      }}>
        <span style={{
          width:6, height:6, borderRadius:"50%", display:"inline-block",
          background:T.green, boxShadow:"0 0 6px rgba(74,222,128,0.8)",
          marginRight:7, verticalAlign:"middle",
          animation:"fb-blink 2s step-end infinite",
        }}/>
        FEEDBACK RECEIVED
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function FeedbackPage() {
  const [rating,    setRating]    = useState(0);
  const [lovePick,  setLovePick]  = useState("");
  const [frustrate, setFrustrate] = useState("");
  const [recommend, setRecommend] = useState("");
  const [message,   setMessage]   = useState("");
  const [votes,     setVotes]     = useState({});
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const topRef = useRef(null);

  useEffect(() => { injectCSS(); }, []);

  const totalVoters = UPCOMING_FEATURES.reduce((a,f)=>a+f.votes,0) / UPCOMING_FEATURES.length;

  const toggleVote = (id) =>
    setVotes(v => ({ ...v, [id]: !v[id] }));

  const canSubmit = rating > 0 || message.trim().length > 3;

  const handleSubmit = async () => {
    if (!canSubmit) { setError("Please add a rating or message before submitting."); return; }
    setError("");
    setLoading(true);

    const payload = {
      rating,
      love_feature:     lovePick,
      frustration:      frustrate,
      recommend,
      message:          message.trim(),
      feature_votes:    Object.keys(votes).filter(k => votes[k]),
      submitted_at:     new Date().toISOString(),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
      topRef.current?.scrollIntoView({ behavior:"smooth" });
    } catch (err) {
      console.error(err);
      setError("❌ Failed to send. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Animation delays for staggered reveal ─── */
  const cardDelay = (i) => ({ animationDelay: `${i * 0.08}s` });

  return (
    <div ref={topRef} style={{
      minHeight:"100vh",
      background:T.bg,
      fontFamily:T.body,
      color:T.text,
      position:"relative",
      overflowX:"hidden",
    }}>
      <Atmosphere />

      <div style={{
        position:"relative", zIndex:1,
        maxWidth:660, margin:"0 auto",
        padding:"32px 16px 64px",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          textAlign:"center",
          marginBottom:36,
          animation:"fb-fadeup .4s ease both",
        }}>
          {/* Status badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 16px", borderRadius:30,
            background:"rgba(212,175,55,0.07)",
            border:`1px solid ${T.border}`,
            fontFamily:T.mono, fontSize:9, fontWeight:700,
            color:T.gold, letterSpacing:".18em",
            textTransform:"uppercase", marginBottom:20,
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%",
              background:T.green,
              boxShadow:"0 0 6px rgba(74,222,128,0.9)",
              animation:"fb-blink 2.2s step-end infinite",
            }}/>
            EARLY ACCESS — 16 FOUNDING MEMBERS
          </div>

          <h1 className="fb-gold" style={{
            fontFamily:T.font, fontSize:32, fontWeight:800,
            letterSpacing:".12em", lineHeight:1.1, marginBottom:14,
          }}>SHAPE THE FUTURE</h1>

          <p style={{
            fontFamily:T.body, fontSize:15, color:T.muted,
            lineHeight:1.7, maxWidth:480, margin:"0 auto",
          }}>
           We Value Your Feedback<br/>
            <strong style={{ color:T.text, fontWeight:600 }}>You are part of the founding story.</strong>
          </p>

          {/* Founder signature */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:10,
            marginTop:20, padding:"10px 20px",
            background:"rgba(212,175,55,0.05)",
            border:`1px solid ${T.border}`, borderRadius:30,
          }}>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:`linear-gradient(135deg,${T.gold} 0%,#8A6010 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:T.font, fontSize:13, fontWeight:800, color:"#050508",
              boxShadow:`0 0 14px ${T.goldGlow}`,
            }}>M</div>
            <div style={{ textAlign:"left" }}>
              <div style={{
                fontFamily:T.font, fontSize:11, fontWeight:700,
                color:T.gold, letterSpacing:".1em",
              }}>MANIFIX FOUNDER</div>
              <div style={{ fontFamily:T.mono, fontSize:9, color:T.dim, letterSpacing:".08em" }}>
                reads every message personally
              </div>
            </div>
          </div>
        </div>

        {done ? (
          /* ── SUCCESS STATE ── */
          <div className="fb-card">
            <div className="fb-scan" aria-hidden/>
            <SuccessPanel rating={rating} />
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* ── CARD 1: RATING ── */}
            <div className="fb-card" style={cardDelay(0)}>
              <div className="fb-scan" aria-hidden/>
              <div style={{ marginBottom:18 }}>
                <div className="fb-section-label">
                  <Star size={10} color={T.dim} style={{marginRight:2}}/>
                  Overall Rating
                </div>
                <p style={{ fontFamily:T.body, fontSize:15, color:T.text, fontWeight:600, marginBottom:14 }}>
                  How would you rate ManifiX today?
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Quick recommendation */}
              <div>
                <p style={{
                  fontFamily:T.mono, fontSize:9, color:T.dim,
                  letterSpacing:".14em", textTransform:"uppercase", marginBottom:10,
                }}>Would you recommend ManifiX to a friend?</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    { v:"yes",   label:"Yes, 100%",  Icon:ThumbsUp   },
                    { v:"maybe", label:"Maybe",       Icon:Minus      },
                    { v:"no",    label:"Not yet",     Icon:ThumbsDown },
                  ].map(({ v, label, Icon }) => (
                    <button
                      key={v}
                      className={`fb-quick-btn${recommend===v?" selected":""}`}
                      onClick={() => setRecommend(r => r===v?"":v)}
                    >
                      <Icon size={11}/>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CARD 2: QUICK QUESTIONS ── */}
            <div className="fb-card" style={cardDelay(1)}>
              <div className="fb-scan" aria-hidden/>

              {/* What do you love? */}
              <div style={{ marginBottom:22 }}>
                <div className="fb-section-label">
                  <Heart size={10} color={T.dim} style={{marginRight:2}}/>
                  What you love
                </div>
                <p style={{ fontFamily:T.body, fontSize:14, color:T.text, fontWeight:600, marginBottom:12 }}>
                  Which feature do you use the most?
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {QUICK_FEATURES.map(f => (
                    <button
                      key={f}
                      className={`fb-quick-btn${lovePick===f?" selected":""}`}
                      onClick={() => setLovePick(v => v===f?"":f)}
                    >
                      {lovePick===f && <span style={{ fontSize:9 }}>✦</span>}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* What frustrates? */}
              <div>
                <p style={{ fontFamily:T.body, fontSize:14, color:T.text, fontWeight:600, marginBottom:12 }}>
                  What is one thing that frustrated you?
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["Too slow","Missing feature","Confusing UI","Bugs / errors","Nothing, it's great"].map(f => (
                    <button
                      key={f}
                      className={`fb-quick-btn${frustrate===f?" selected":""}`}
                      onClick={() => setFrustrate(v => v===f?"":f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CARD 3: FEATURE UPVOTE ── */}
            <div className="fb-card" style={cardDelay(2)}>
              <div className="fb-scan" aria-hidden/>
              <div className="fb-section-label">
                <Zap size={10} color={T.dim} style={{marginRight:2}}/>
                Vote — what we build next
              </div>
              <p style={{ fontFamily:T.body, fontSize:14, color:T.muted, marginBottom:16, lineHeight:1.55 }}>
                Tap to upvote the features you want most. Your votes decide the roadmap.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {UPCOMING_FEATURES.map(f => (
                  <FeatureVoteItem
                    key={f.id}
                    feature={f}
                    voted={!!votes[f.id]}
                    onVote={() => toggleVote(f.id)}
                    totalVoters={totalVoters}
                  />
                ))}
              </div>
            </div>

            {/* ── CARD 4: OPEN MESSAGE ── */}
            <div className="fb-card" style={cardDelay(3)}>
              <div className="fb-scan" aria-hidden/>
              <div className="fb-section-label">
                <MessageSquare size={10} color={T.dim} style={{marginRight:2}}/>
                Your message
              </div>
              <p style={{ fontFamily:T.body, fontSize:14, color:T.text, fontWeight:600, marginBottom:14 }}>
                Tell us anything — we read every single message personally.
              </p>
              <textarea
                className="fb-textarea"
                placeholder="What would make ManifiX a 10/10 for you? Any idea, bug, or wild dream..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
              />
              <div style={{
                display:"flex", justifyContent:"flex-end",
                fontFamily:T.mono, fontSize:9, color:T.dim,
                letterSpacing:".08em", marginTop:5,
              }}>
                {message.length} / 1000
              </div>
            </div>

            {/* ── ERROR ── */}
            {error && (
              <div style={{
                padding:"12px 16px", borderRadius:9,
                background:"rgba(248,113,113,0.08)",
                border:"1px solid rgba(248,113,113,0.25)",
                fontFamily:T.mono, fontSize:11, color:T.red,
                letterSpacing:".06em",
              }}>{error}</div>
            )}

            {/* ── SUBMIT ── */}
            <button
              className="fb-submit"
              onClick={handleSubmit}
              disabled={loading}
              style={cardDelay(4)}
            >
              {loading ? (
                <>
                  <span style={{
                    width:14, height:14, borderRadius:"50%",
                    border:`2px solid #050508`, borderTopColor:"transparent",
                    display:"inline-block", animation:"fb-spin .7s linear infinite",
                  }}/>
                  SENDING...
                </>
              ) : (
                <>
                  <Send size={14} strokeWidth={2.5}/>
                  SEND MY FEEDBACK
                  <ChevronRight size={14} strokeWidth={2.5}/>
                </>
              )}
            </button>

            {/* Fine print */}
            <p style={{
              textAlign:"center", fontFamily:T.mono,
              fontSize:9, color:T.dim, letterSpacing:".1em",
              textTransform:"uppercase",
            }}>
              Your identity is never shared · 2 min to complete
            </p>

          </div>
        )}
      </div>
    </div>
  );
}
