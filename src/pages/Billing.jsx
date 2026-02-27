// src/pages/Billing.jsx

import React, { useState } from "react";
import "../styles/Billing666.css";
import authService from "../services/auth.service";
import logo from "../assets/logo.png";

const BillingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceId = "price_1QABCxyz123456"; // your real Stripe price ID

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = authService?.getCurrentUser?.();

      if (!currentUser) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        "https://manifix.up.railway.app/api/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId,
            userId: currentUser.id,
          }),
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Unable to start payment. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Payment service not reachable. Try later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-page">
      <header className="billing-header">
        <img src={logo} alt="ManifiX Logo" className="billing-logo" />
        <h1>ManifiX Premium</h1>
        <p>Unlock full access to all premium features</p>
      </header>

      <section className="billing-card">
        <h2>Premium Subscription</h2>
        <p className="price">₹1,999 / month</p>

        <ul className="features">
          <li>🎯 Full GPT Access</li>
          <li>🎵 Magic16 & Vibe unlocked</li>
          <li>🔊 STT / TTS Enabled</li>
          <li>⚡ Priority Support</li>
        </ul>

        <button
          className="btn-subscribe"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Processing..." : "Subscribe Now"}
        </button>

        {error && <p className="billing-error">{error}</p>}
      </section>

      <footer className="billing-footer">
        <p>© 2026 ManifiX. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default BillingPage;
