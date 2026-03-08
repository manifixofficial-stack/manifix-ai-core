import React, { useState } from "react";
import supabase from "../services/supabase";
import "../styles/Feedback.css";
import logo from "../assets/logo.png";

export default function Feedback() {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!message.trim()) {
      setStatus("⚠ Please enter your feedback.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const { error } = await supabase.from("user_feedback").insert([
        {
          comment: message.trim(),
          rating: rating || null,
        },
      ]);

      if (error) throw error;

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
        <img src={logo} alt="ManifiX Logo" className="feedback-logo" />
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
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          <button
            className="submit-btn"
            onClick={submitFeedback}
            disabled={loading}
          >
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
