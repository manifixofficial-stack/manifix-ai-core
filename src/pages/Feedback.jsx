import React, { useState } from "react";
import "../styles/Feedback.css";
import logo from "../assets/logo.png";
import authService from "../services/auth.service";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    const user = authService?.getCurrentUser?.();
    if (!user) {
      setStatus("⚠ Please login first");
      return;
    }

    if (!message.trim()) {
      setStatus("⚠ Please enter your feedback.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: user.id,
    message: message.trim(),
    rating: rating || null
  })
});

const data = await res.json();   // ✅ ADD THIS
console.log("API RESPONSE:", data);  // ✅ DEBUG

if (!res.ok) throw new Error(data.error || "Failed to send feedback");

      setStatus("✅ Thank you for your feedback!");
      setMessage("");
      setRating(0);

    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      <header className="feedback-header">
        <img src={logo} alt="logo" className="feedback-logo" />
        <h1>ManifiX Feedback</h1>
      </header>

      <main className="feedback-main">
        <div className="feedback-card">
          <h2>We Value Your Feedback</h2>

          <label>Your Feedback</label>
          <textarea
            placeholder="Tell us what you think..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <label>Rate Us</label>
          <div className="rating">
            {[1,2,3,4,5].map(star => (
              <span
                key={star}
                className={`star ${rating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          <button className="submit-btn" onClick={submitFeedback} disabled={loading}>
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>

          {status && <p className="status">{status}</p>}
        </div>
      </main>

      <footer className="feedback-footer">
        © {new Date().getFullYear()} ManifiX — All Rights Reserved
      </footer>
    </div>
  );
}
