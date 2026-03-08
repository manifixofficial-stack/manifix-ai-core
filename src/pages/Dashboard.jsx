import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";

const testimonials = [
  {
    name: "Shyam",
    text: "This app is a masterclass in user experience. The design is absolutely gorgeous—clean, modern, and easy on the eyes. More importantly, it is incredibly intuitive. I found exactly what I needed right away, and navigating through different features is a breeze. It's fast, stable, and a genuine pleasure to use. The developers clearly put a lot of thought into making this the best version possible. Highly, highly recommend!"
  },
  {
    name: "Priya",
    text: "Good, it's useful for daily life and get the answers using this tool. This ManifiX app is so useful, I love it! My health is improving after the Magic16 feature. I love it, the ManifiX conversation never stops. My best friend is ManifiX; any question I ask, it gives the answer. I love ManifiX 🥰✨"
  },
  {
    name: "Nikil",
    text: "I’m honestly loving ManifiX! It’s so easy to use and super helpful for planning my day. The AI assistant answers my questions right away, and the Magic16 wellness routines keep me calm and motivated. I feel more focused and less stressed now. The personalized wellness tips are spot-on and really help me improve. Definitely a must-have app!"
  }
];

export default function Dashboard() {

  useEffect(() => {
    const container = document.getElementById("particles");

    if (!container) return;

    for (let i = 0; i < 80; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * window.innerWidth + "px";
      p.style.top = Math.random() * window.innerHeight + "px";
      p.style.width = p.style.height = Math.random() * 3 + 1 + "px";
      p.style.opacity = Math.random() * 0.6 + 0.2;

      container.appendChild(p);
    }
  }, []);

  return (
    <div className="dashboard-page">

      {/* Background particles */}
      <div id="particles"></div>

      {/* HERO */}
      <section className="dashboard-hero">

        <h1>
          Welcome to <span>ManifiX</span>
        </h1>

        <p>
          Your AI powered platform for productivity, wellness and guidance.
        </p>

        <div className="hero-actions">

          <Link to="/app/gpt" className="btn-primary">
            Start Chatting
          </Link>

          <Link to="/app/magic16" className="btn-secondary">
            Explore Magic16
          </Link>

        </div>

      </section>


      {/* FEATURES */}
      <section className="dashboard-features">

        <Link to="/app/gpt" className="feature-card">
          <h3>GPT AI</h3>
          <p>Ask questions and receive intelligent AI guidance.</p>
        </Link>

        <Link to="/app/magic16" className="feature-card">
          <h3>Magic16</h3>
          <p>Daily wellness routines to boost your energy.</p>
        </Link>

        <Link to="/app/billing" className="feature-card">
          <h3>Billing</h3>
          <p>Manage subscriptions and account usage.</p>
        </Link>

        <Link to="/app/feedback" className="feature-card">
          <h3>Feedback</h3>
          <p>Help improve ManifiX with your suggestions.</p>
        </Link>

      </section>


      {/* TESTIMONIALS */}
      <section className="dashboard-testimonials">

        <h2>What Users Say</h2>

        <div className="testimonial-grid">

          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">

              <h4>{t.name}</h4>

              <p>{t.text}</p>

            </div>
          ))}

        </div>

      </section>

    </div>
  );
}
