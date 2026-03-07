// src/pages/Feedback.jsx
import React, { useEffect, useState } from "react";
import supabase from "../services/supabase"; // your supabase client
import "../styles/Feedback.css";
import logo from "../assets/logo.png";

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("user_feedback")
          .select("*")
          .lt("rating", 5) // Only ratings under 5
          .order("created_at", { ascending: false });

        if (error) throw error;
        setFeedbacks(data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch feedback. Try later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  return (
    <div className="feedback-page">
      <header className="feedback-header">
        <img src={logo} alt="ManifiX Logo" className="feedback-logo" />
        <h1>User Feedback</h1>
        <p>Here’s what our users shared (under 5 stars)</p>
      </header>

      {loading && <p className="loading-text">Loading feedback...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="feedback-list">
          {feedbacks.length === 0 && (
            <p className="no-feedback">No feedback under 5 stars.</p>
          )}
          {feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-user">
                <strong>{fb.user_name || "Anonymous"}</strong>
                <span className="feedback-rating">
                  {"⭐".repeat(fb.rating)}{" "}
                  {"☆".repeat(5 - fb.rating)}
                </span>
              </div>
              <p className="feedback-comment">{fb.comment}</p>
              <small className="feedback-date">
                {new Date(fb.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}

      <footer className="feedback-footer">
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>
    </div>
  );
}
