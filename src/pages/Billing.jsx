// src/pages/Billing.jsx

import React, { useState } from "react";
import "../styles/Billing666.css";
import authService from "../services/auth.service";
import supabase from "../services/supabase";
import logo from "../assets/logo.png";

const BillingPage = () => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // create Razorpay order from backend
      const res = await fetch(
        "https://manifix.up.railway.app/api/create-order",
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Failed to create order");

      const order = await res.json();

      const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY
        amount: order.amount,
        currency: order.currency,
        name: "ManifiX",
        description: "Premium Subscription",
        image: logo,
        order_id: order.id,

        handler: async function (response) {

          try {

            // Insert premium record
            const { error: insertError } = await supabase
              .from("premium")
              .insert([
                {
                  user_id: currentUser.id,
                  payment_id: response.razorpay_payment_id,
                  plan: "premium",
                  subscription_status: "active",
                  expires_at: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                  ),
                },
              ]);

            if (insertError) throw insertError;

            alert("🎉 Payment Successful! Premium activated.");

          } catch (dbErr) {

            console.error("Database Error:", dbErr);
            alert("Payment succeeded but premium activation failed.");

          }
        },

        prefill: {
          name: currentUser.name || "",
          email: currentUser.email || "",
        },

        theme: {
          color: "#6366f1",
        },
      };

      const razor = new window.Razorpay(options);

      razor.open();

    } catch (err) {

      console.error(err);
      setError("Payment service not reachable. Try later.");

    } finally {

      setLoading(false);

    }
  };

  const features = [
    "Unlimited GPT Conversations with Context Awareness",
    "Magic16 AI-Powered Daily Rituals & Guidance",
    "Real-Time Voice Chat (STT / TTS) Across All Features",
    "Personalized AI Coach for Meditation & Yoga",
    "Custom GPT Prompts & Workflow Automation",
    "Progress Tracking & Posture Analytics",
    "Mood & Energy Insights with Vibe Score",
    "Adaptive Dark/Light UI with Custom Themes",
    "Exclusive Early Access to AI Experiments",
    "Personalized AI Recommendations for Growth & Fun",
  ];

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
          {features.map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
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
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default BillingPage;
