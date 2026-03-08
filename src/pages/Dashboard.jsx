import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import bot from "../assets/bot.png";

export default function Dashboard() {
  useEffect(() => {
    const particlesContainer = document.getElementById("particles");
    if (!particlesContainer) return;

    for (let i = 0; i < 120; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * window.innerWidth + "px";
      p.style.top = Math.random() * window.innerHeight + "px";
      p.style.width = p.style.height = Math.random() * 3 + 1 + "px";
      p.style.opacity = Math.random() * 0.6 + 0.3;

      particlesContainer.appendChild(p);
    }

    const handleMouse = (e) => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = e.clientX + "px";
      particle.style.top = e.clientY + "px";
      particle.style.width = particle.style.height = "2px";

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1500);
    };

    document.addEventListener("mousemove", handleMouse);

    return () => {
      document.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  const toggleFAQ = (e) => {
    e.currentTarget.classList.toggle("active");
  };

  return (
    <div className="dashboard-page">
      <div id="particles"></div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>Ask, Learn & Boost Your Energy</h1>

          <p>
            ManifiX is your AI-powered guide to unleash energy, boost prosperity,
            and transform your wellness.
          </p>

          <div className="hero-buttons">
            <Link to="/app/gpt" className="primary">
              Start Chatting
            </Link>

            <Link to="/app/magic16" className="secondary">
              Improve Your Health
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <img src={bot} alt="AI Illustration" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature">
          <h3>Instant AI Answers</h3>
          <p>Get precise and fast responses to any questions.</p>
        </div>

        <div className="feature">
          <h3>ManifiX Guidance</h3>
          <p>Receive personalized tips to boost your success.</p>
        </div>

        <div className="feature">
          <h3>Magic16 Wellness</h3>
          <p>Daily routines to enhance focus.</p>
        </div>

        <div className="feature">
          <h3>Voice & Text Chat</h3>
          <p>Communicate naturally via voice or text.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <h2>What Our Users Say</h2>

        <div className="testimonial-cards">
          <div className="testimonial">
            <h4>Shyam</h4>

            <p>
             This app is a masterclass in user experience. The design is absolutely gorgeous—clean, modern, and easy on the eyes. More importantly, it is incredibly intuitive. I found exactly what I needed right away, and navigating through different features is a breeze. It's fast, stable, and a genuine pleasure to use. The developers clearly put a lot of thought into making this the best version possible. Highly, highly recommend!
            </p>
          </div>

          <div className="testimonial">
            <h4>Priya</h4>

            <p>
              I’m honestly loving ManifiX! It’s so easy to use and super helpful for planning my day. The AI assistant answers my questions right away, and the Magic16 wellness routines keep me calm and motivated. I feel more focused and less stressed now. The personalized wellness tips are spot-on and really help me improve. Definitely a must-have app!
            </p>
          </div>
           <div className="testimonial">
            <h4>Nikil</h4>

            <p>
            ManifiX is like having a personal coach and assistant together. Magic16 wellness exercises keep me calm, focused, and energized. ManifiXGPT answers any question quickly and accurately. It helps me improve my health, creativity, and daily habits. The app is professional, intuitive, and easy to navigate. I feel more confident and organized in my daily life. I truly love using ManifiX every single day
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>What is ManifiX?</h3>
          <p>ManifiX is your AI assistant for growth, wellness, and success.</p>
        </div>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>Can I chat for free?</h3>
          <p>Yes! Unlimited chatting at no cost.</p>
        </div>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>How do I use Magic16?</h3>
          <p>Magic16 includes daily yoga & meditation to boost your energy.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>
    </div>
  );
}
