// src/pages/Billing.jsx

import React, { useState } from "react";
import "../styles/Billing666.css";
import authService from "../services/auth.service";
import { supabase } from "../services/supabase";
import logo from "../assets/logo.png";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const features = [
    "Unlimited GPT Conversations",
    "Magic16 Daily Ritual System",
    "Real-Time Voice Chat",
    "Personal AI Coach",
    "Advanced Prompt Automation",
    "Progress & Posture Tracking",
    "Mood + Energy Insights",
    "Adaptive Neon UI Themes",
    "Early Access AI Experiments",
    "Personalized AI Recommendations"
  ];

  const handleSubscribe = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const user = authService?.getCurrentUser?.();

      if (!user) {
        setError("⚠️ Please login first");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setError("Payment gateway not loaded. Refresh page.");
        setLoading(false);
        return;
      }

      // ✅ FIXED: Send user_id to backend
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id
          })
        }
      );

      if (!res.ok) throw new Error("Order creation failed");

      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,

        name: "ManifiX",
        description: "Premium Subscription",
        image: logo,

        handler: async function (response) {
          try {
            // 🔐 VERIFY PAYMENT
            const verifyRes = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  ...response,
                  user_id: user.id
                })
              }
            );

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }

            // ❌ REMOVE THIS BLOCK (backend already saves)
            /*
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);

            const { error: dbError } = await supabase
              .from("premium")
              .upsert([
                {
                  user_id: user.id,
                  payment_id: response.razorpay_payment_id,
                  plan: "premium",
                  subscription_status: "active",
                  expires_at: expiry
                }
              ]);

            if (dbError) throw dbError;
            */

            setMessage("🎉 Premium Activated Successfully!");
          } catch (err) {
            console.error(err);
            setError("Payment done but activation failed");
          }
        },

        modal: {
          ondismiss: function () {
            setError("Payment cancelled");
          }
        },

        prefill: {
          name: user.name || "",
          email: user.email || ""
        },

        theme: {
          color: "#00F5D4"
        }
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (err) {
      console.error(err);

      if (err.message.includes("Order")) {
        setError("Server issue while creating order");
      } else {
        setError("Payment service unavailable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-page">
      <div className="billing-container">
        <img src={logo} className="billing-logo" alt="logo" />

        <h1 className="billing-title">
          Upgrade to <span>ManifiX Premium</span>
        </h1>

        <p className="billing-sub">
          Unlock the full power of AI guidance, rituals and automation.
        </p>

        <div className="pricing-card">
          <div className="price">
            ₹1999 <span>/month</span>
          </div>

          <ul className="feature-list">
            {features.map((f, i) => (
              <li key={i}>✓ {f}</li>
            ))}
          </ul>

          <button
            className="subscribe-btn"
            disabled={loading}
            onClick={handleSubscribe}
          >
            {loading ? "🔄 Processing..." : "🚀 Subscribe Now"}
          </button>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
