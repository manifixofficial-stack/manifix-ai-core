// src/pages/Billing.jsx
// ManifiX AI — Premium Upgrade Page
// Billion-value · Conversion-optimised · Dark Gold Luxury

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../services/auth.service";
import logo from "../assets/logo.png";

/* ─────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --bg:       #060606;
    --surface:  #0c0c0c;
    --border:   #1a1a1a;
    --gold:     #c9a84c;
    --gold-dim: #7a5f28;
    --gold-glow:rgba(201,168,76,0.25);
    --green:    #39d98a;
    --danger:   #ff3b3b;
    --text:     #e8e8e8;
    --muted:    #555;
    --font-hd:  'Bebas Neue', sans-serif;
    --font-mono:'Share Tech Mono', monospace;
    --font-body:'Inter', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .bp-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-body);
    color: var(--text);
    overflow-x: hidden;
    position: relative;
  }

  /* ── AMBIENT GLOW BG ── */
  .bp-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 60% 40% at 50% -10%, rgba(201,168,76,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 60%);
  }

  /* scan lines */
  .bp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(255,255,255,0.01) 2px,
      rgba(255,255,255,0.01) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  .bp-inner {
    position: relative;
    z-index: 1;
    max-width: 460px;
    margin: 0 auto;
    padding: 0 20px 60px;
  }

  /* ── HEADER ── */
  .bp-header {
    padding: 36px 0 0;
    text-align: center;
  }

  .bp-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    margin-bottom: 16px;
    filter: drop-shadow(0 0 12px var(--gold-glow));
  }

  .bp-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 4px;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 10px;
    opacity: 0.8;
  }

  .bp-title {
    font-family: var(--font-hd);
    font-size: clamp(42px, 12vw, 64px);
    letter-spacing: 2px;
    line-height: 0.95;
    color: #fff;
    margin-bottom: 12px;
  }
  .bp-title span { color: var(--gold); }

  .bp-subtitle {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    max-width: 320px;
    margin: 0 auto 28px;
  }

  /* ── SOCIAL PROOF BAR ── */
  .bp-proof {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 14px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    margin-bottom: 28px;
  }
  .bp-proof-item {
    text-align: center;
  }
  .bp-proof-val {
    font-family: var(--font-hd);
    font-size: 22px;
    color: var(--gold);
    line-height: 1;
  }
  .bp-proof-lbl {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 3px;
  }
  .bp-proof-sep {
    width: 1px;
    height: 32px;
    background: var(--border);
  }

  /* ── PRICING CARD ── */
  .bp-card {
    background: var(--surface);
    border: 1px solid var(--gold-dim);
    border-radius: 2px;
    padding: 28px 24px;
    position: relative;
    overflow: hidden;
    margin-bottom: 12px;
  }

  /* inner gold shimmer */
  .bp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .bp-card-glow {
    position: absolute;
    top: -40px; left: 50%;
    transform: translateX(-50%);
    width: 200px; height: 80px;
    background: var(--gold-glow);
    filter: blur(30px);
    pointer-events: none;
  }

  /* ── BEST VALUE BADGE ── */
  .bp-badge {
    position: absolute;
    top: -1px; right: 20px;
    background: var(--gold);
    color: #000;
    font-family: var(--font-hd);
    font-size: 13px;
    letter-spacing: 2px;
    padding: 4px 14px;
    border-radius: 0 0 4px 4px;
    text-transform: uppercase;
  }

  /* ── PRICE BLOCK ── */
  .bp-price-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 6px;
  }
  .bp-price {
    font-family: var(--font-hd);
    font-size: 64px;
    color: #fff;
    line-height: 1;
  }
  .bp-price-currency {
    font-family: var(--font-hd);
    font-size: 28px;
    color: var(--gold);
    line-height: 1;
    align-self: flex-start;
    margin-top: 8px;
  }
  .bp-price-period {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .bp-price-crossed {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    text-decoration: line-through;
    margin-bottom: 4px;
  }
  .bp-price-save {
    display: inline-block;
    background: rgba(57,217,138,0.12);
    border: 1px solid rgba(57,217,138,0.3);
    color: var(--green);
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 2px;
    margin-bottom: 20px;
  }

  /* ── FEATURE LIST ── */
  .bp-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 18px 0;
  }

  .bp-features-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .bp-features {
    list-style: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 24px;
  }

  .bp-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: #aaa;
    line-height: 1.4;
  }

  .bp-feature-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(201,168,76,0.15);
    border: 1px solid var(--gold-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .bp-feature-dot svg { display: block; }

  /* ── SUBSCRIBE BUTTON ── */
  .bp-btn-wrap {
    position: relative;
  }

  .bp-btn {
    width: 100%;
    padding: 20px;
    background: var(--gold);
    border: none;
    border-radius: 2px;
    font-family: var(--font-hd);
    font-size: 22px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #000;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.25s;
  }
  .bp-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  }
  .bp-btn:hover:not(:disabled) {
    background: #dbb85a;
    box-shadow: 0 0 40px rgba(201,168,76,0.5), 0 8px 30px rgba(0,0,0,0.4);
    transform: translateY(-2px);
  }
  .bp-btn:active:not(:disabled) { transform: translateY(0); }
  .bp-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .bp-btn.success {
    background: var(--green);
    box-shadow: 0 0 40px rgba(57,217,138,0.4);
  }

  /* shimmer sweep */
  .bp-btn-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
    transform: translateX(-100%);
    animation: shimmer 2.5s infinite;
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .bp-btn-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .bp-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(0,0,0,0.3);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── TRUST ROW ── */
  .bp-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 14px;
  }
  .bp-trust-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--muted);
    text-transform: uppercase;
  }
  .bp-trust-icon { font-size: 12px; }

  /* ── URGENCY BAR ── */
  .bp-urgency {
    background: rgba(201,168,76,0.06);
    border: 1px solid var(--gold-dim);
    border-radius: 2px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .bp-urgency-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--gold);
    flex-shrink: 0;
    box-shadow: 0 0 8px var(--gold);
    animation: pulse-dot 1.5s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.8); }
  }
  .bp-urgency-text {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--gold);
    opacity: 0.8;
  }

  /* ── TESTIMONIAL ── */
  .bp-testimonial {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 2px solid var(--gold-dim);
    border-radius: 2px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }
  .bp-testimonial blockquote {
    font-size: 13px;
    color: #888;
    font-style: italic;
    line-height: 1.6;
    margin-bottom: 10px;
  }
  .bp-testimonial blockquote strong { color: var(--gold); font-style: normal; }
  .bp-testimonial-author {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
  }

  /* ── MESSAGE / ERROR ── */
  .bp-msg {
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-align: center;
  }
  .bp-msg.success {
    background: rgba(57,217,138,0.08);
    border: 1px solid rgba(57,217,138,0.3);
    color: var(--green);
  }
  .bp-msg.error {
    background: rgba(255,59,59,0.06);
    border: 1px solid rgba(255,59,59,0.25);
    color: var(--danger);
  }

  /* ── GUARANTEE ── */
  .bp-guarantee {
    text-align: center;
    padding: 18px 0 0;
  }
  .bp-guarantee p {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
    line-height: 1.8;
  }
  .bp-guarantee span { color: var(--gold-dim); }

  @media (max-width: 380px) {
    .bp-features { grid-template-columns: 1fr; }
  }
`;

/* ─────────────────────────────────────────
   FEATURES DATA
───────────────────────────────────────── */
const FEATURES = [
  "Unlimited GPT Conversations",
  "Magic16 Daily Ritual System",
  "Real-Time Voice Guidance",
  "Personal AI Coach",
  "Advanced Pose Automation",
  "Progress & Posture Tracking",
  "Mood + Energy Insights",
  "Adaptive Premium Themes",
  "Early Access AI Experiments",
  "Personalised Recommendations",
];

/* ─────────────────────────────────────────
   TESTIMONIALS (rotate)
───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: `I didn't believe a <strong>16-minute app</strong> could change anything. Day 12 — I slept better than I had in 3 years. The AI voice guidance is on another level.`,
    author: "Priya M. · Premium · Day 14"
  },
  {
    quote: `The motion scoring made me <strong>actually do the poses correctly</strong> for the first time. I used Headspace for 2 years. This replaced it in one week.`,
    author: "Rahul K. · Premium · Day 9"
  },
  {
    quote: `Worth every rupee. I wake up at 6 AM now without an alarm. <strong>The streak system is addictive</strong>. My anxiety dropped noticeably.`,
    author: "Sneha T. · Premium · Day 16 ★"
  },
];

/* ─────────────────────────────────────────
   CHECK ICON
───────────────────────────────────────── */
const CheckIcon = () => (
  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
    <path d="M1 3L3 5L7 1" stroke="#c9a84c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState("");
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [spotsLeft]                 = useState(() => Math.floor(Math.random() * 18) + 7); // 7–24

  /* rotate testimonials */
  useEffect(() => {
    const id = setInterval(() =>
      setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* inject styles */
  useEffect(() => {
    const tag = document.createElement("style");
    tag.id = "bp-styles";
    tag.textContent = STYLES;
    if (!document.getElementById("bp-styles")) document.head.appendChild(tag);
    return () => { const t = document.getElementById("bp-styles"); if (t) t.remove(); };
  }, []);

  /* ── SUBSCRIBE ── */
  const handleSubscribe = async () => {
    if (loading || success) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const user = await authService.getCurrentUser();
      if (!user?.id) throw new Error("Please log in to continue");
      if (!window.Razorpay) throw new Error("Payment gateway not loaded. Refresh and try again.");

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error("Server error creating order. Please try again.");
      const order = await res.json();

      const options = {
        key:       import.meta.env.VITE_RAZORPAY_KEY,
        amount:    order.amount,
        currency:  order.currency,
        order_id:  order.id,
        name:      "ManifiX",
        description: "Premium — Magic16 + GPT Intelligence",
        image:     logo,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, user_id: user.id }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");
            setSuccess(true);
            setMessage("Premium Activated. Welcome to the top 1%.");
            setTimeout(() => navigate("/app/dashboard"), 2500);
          } catch (err) {
            setError("Payment received but activation failed. Contact support.");
          }
        },
        modal: { ondismiss: () => setError("Payment cancelled.") },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#c9a84c" },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const t = TESTIMONIALS[testimonialIdx];

  return (
    <div className="bp-root">
      <div className="bp-ambient" />

      <div className="bp-inner">

        {/* ── HEADER ── */}
        <motion.div
          className="bp-header"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={logo} alt="ManifiX" className="bp-logo" />
          <p className="bp-eyebrow">ManifiX Premium</p>
          <h1 className="bp-title">UNLOCK<br /><span>FULL POWER</span></h1>
          <p className="bp-subtitle">
            16 minutes. AI-coached. Motion-scored. Voice-guided.
            The world's most focused wellness ritual — now fully unlocked.
          </p>
        </motion.div>

        {/* ── SOCIAL PROOF ── */}
        <motion.div
          className="bp-proof"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bp-proof-item">
            <div className="bp-proof-val">4.9★</div>
            <div className="bp-proof-lbl">Rating</div>
          </div>
          <div className="bp-proof-sep" />
          <div className="bp-proof-item">
            <div className="bp-proof-val">16min</div>
            <div className="bp-proof-lbl">Per Session</div>
          </div>
          <div className="bp-proof-sep" />
          <div className="bp-proof-item">
            <div className="bp-proof-val">94%</div>
            <div className="bp-proof-lbl">Complete Day 16</div>
          </div>
        </motion.div>

        {/* ── URGENCY BAR ── */}
        <motion.div
          className="bp-urgency"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bp-urgency-dot" />
          <p className="bp-urgency-text">
            Only {spotsLeft} spots available at this price · Introductory offer
          </p>
        </motion.div>

        {/* ── PRICING CARD ── */}
        <motion.div
          className="bp-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="bp-card-glow" />
          <div className="bp-badge">Best Value</div>

          {/* Price */}
          <div className="bp-price-crossed">₹3,999 /month regular</div>
          <div className="bp-price-row">
            <span className="bp-price-currency">₹</span>
            <span className="bp-price">1,999</span>
          </div>
          <div className="bp-price-period">per month · cancel anytime</div>
          <div className="bp-price-save">You save ₹2,000 — 50% OFF launch price</div>

          <hr className="bp-divider" />

          {/* Features */}
          <p className="bp-features-label">Everything Unlocked</p>
          <ul className="bp-features">
            {FEATURES.map((f, i) => (
              <motion.li
                key={i}
                className="bp-feature-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.04 }}
              >
                <span className="bp-feature-dot"><CheckIcon /></span>
                {f}
              </motion.li>
            ))}
          </ul>

          <hr className="bp-divider" />

          {/* Button */}
          <div className="bp-btn-wrap">
            <motion.button
              className={`bp-btn ${success ? "success" : ""}`}
              onClick={handleSubscribe}
              disabled={loading || success}
              whileTap={{ scale: 0.98 }}
            >
              {!loading && !success && (
                <>
                  <span className="bp-btn-shimmer" />
                  ACTIVATE PREMIUM
                </>
              )}
              {loading && (
                <span className="bp-btn-loading">
                  <span className="bp-spinner" />
                  SECURING YOUR SPOT...
                </span>
              )}
              {success && "✓ WELCOME TO THE TOP 1%"}
            </motion.button>
          </div>

          {/* Trust signals */}
          <div className="bp-trust">
            <span className="bp-trust-item"><span className="bp-trust-icon">🔒</span> Razorpay Secured</span>
            <span className="bp-trust-item"><span className="bp-trust-icon">⚡</span> Instant Activation</span>
            <span className="bp-trust-item"><span className="bp-trust-icon">✕</span> Cancel Anytime</span>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="bp-msg success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ {message}
              </motion.div>
            )}
            {error && (
              <motion.div
                className="bp-msg error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── TESTIMONIAL ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonialIdx}
            className="bp-testimonial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <blockquote dangerouslySetInnerHTML={{ __html: t.quote }} />
            <p className="bp-testimonial-author">{t.author}</p>
          </motion.div>
        </AnimatePresence>

        {/* ── GUARANTEE ── */}
        <div className="bp-guarantee">
          <p>
            <span>MANIFIX PROMISE</span><br />
            If you complete all 16 sessions and see zero change,<br />
            we refund. Full stop. No forms. No questions.
          </p>
        </div>

      </div>
    </div>
  );
}
