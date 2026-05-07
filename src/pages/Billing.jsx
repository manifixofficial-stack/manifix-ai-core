import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/Billing666.css";
import authService from "../services/auth.service";
import logo from "../assets/logo.png";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [spotsLeft, setSpotsLeft] = useState(12); // Scarcity Logic

  // Features rewritten for 2026 Premium Status
  const premiumTiers = [
    { title: "AI Vision Certification", desc: "Verified Proof of Discipline" },
    { title: "The 1% Global Leaderboard", desc: "Exclusive ranking among high-performers" },
    { title: "Grok-Class AI Strategist", desc: "24/7 hyper-personalized mindset coaching" },
    { title: "Biometric AI Dashboard", desc: "Visualizing your evolution in real-time" },
    { title: "Founder's Batch 2026", desc: "Lifetime badge on your global profile" }
  ];

  const handleSubscribe = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const user = await authService.getCurrentUser();
      
      if (!user || !user.id) {
        throw new Error("⚠️ Secure Session Expired. Please Login.");
      }

      if (!window.Razorpay) throw new Error("Payment Gateway Timeout");

      // ORDER CREATION
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) throw new Error("Cloud infrastructure issue. Try again.");
      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "MANIFIX ELITE",
        description: "Year 1 Founder Membership",
        image: logo,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, user_id: user.id }),
            });
            if (!verifyRes.ok) throw new Error("Verification Failed");
            
            setMessage("👑 Welcome to the 1%. Membership Activated.");
            // Redirect to Magic16 after 2 seconds
            setTimeout(() => window.location.href = "/app/magic16", 2000);
          } catch (err) {
            setError("Payment successful, but activation failed. Contact Support.");
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#FF00EA" }, // Your Brand Pink
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-membership-page">
      <motion.div 
        className="membership-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <img src={logo} alt="ManifiX" className="premium-logo" />
        
        <div className="scarcity-banner">
          ⚠️ ONLY {spotsLeft} FOUNDER SLOTS REMAINING IN YOUR REGION
        </div>

        <h1 className="premium-title">Join the <span>1% Club</span></h1>
        <p className="premium-sub">The elite standard for AI-driven human discipline.</p>

        <div className="elite-card">
          <div className="card-header">
            <span className="tier-name">MANIFIX ELITE</span>
            <div className="price-tag">
              <span className="currency">₹</span>1,999<span className="period">/mo</span>
            </div>
          </div>

          <div className="feature-grid">
            {premiumTiers.map((item, i) => (
              <div key={i} className="feature-item">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          <button 
            className={`elite-btn ${loading ? 'loading' : ''}`} 
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "VERIFYING..." : "CLAIM MY SPOT 🔥"}
          </button>

          <p className="secure-note">🛡️ Secure 256-bit Encrypted Transaction</p>
        </div>

        {message && <motion.div initial={{y:20}} animate={{y:0}} className="success-msg">{message}</motion.div>}
        {error && <div className="error-msg">{error}</div>}
      </motion.div>
    </div>
  );
}
