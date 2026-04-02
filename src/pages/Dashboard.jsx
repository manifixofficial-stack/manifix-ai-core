import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";

export default function Dashboard() {
  const particlesRef = useRef(null);

  /* ================= PARTICLES SYSTEM ================= */
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "particle";

      p.style.left = Math.random() * window.innerWidth + "px";
      p.style.top = Math.random() * window.innerHeight + "px";
      p.style.width = p.style.height = Math.random() * 2 + 1 + "px";
      p.style.opacity = Math.random() * 0.5 + 0.2;

      container.appendChild(p);
    }

    const handleMouse = (e) => {
      const particle = document.createElement("div");
      particle.className = "particle";

      particle.style.left = e.clientX + "px";
      particle.style.top = e.clientY + "px";
      particle.style.width = particle.style.height = "2px";

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1000);
    };

    document.addEventListener("mousemove", handleMouse);

    return () => {
      document.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  /* ================= FAQ ================= */
  const toggleFAQ = (e) => {
    const item = e.currentTarget;
    item.classList.toggle("active");
  };

  return (
    <div className="dashboard-page">
      <div id="particles" ref={particlesRef}></div>

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="nav-left">
          <span className="logo-text">ManifiX</span>
        </div>

        <div className="nav-right">
          <Link to="/app/gpt">GPT</Link>
          <Link to="/app/magic16">Magic16</Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-text">
          <h1>
            Upgrade Your Brain <br />
            <span>Control Your Life with ManifiX</span>
          </h1>

          <p className="hero-sub">
            AI + Magic16 system to help you think clearly, stay focused,
            and build a powerful life — every single day.
          </p>

          <div className="hero-buttons">
            <Link to="/app/gpt" className="primary">
              Start Free →
            </Link>

            <Link to="/app/magic16" className="secondary">
              Try Magic16
            </Link>
          </div>

          <p className="hero-trust">
            🔒 Secure • Fast • Built for high performers ⚡
          </p>
        </div>

        <div className="hero-image">
          <img src="/assets/images/bot.png" alt="ManifiX AI" loading="lazy" />
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features">
        <div className="feature">
          <h3>⚡ Instant AI Thinking</h3>
          <p>Ask anything. Get powerful, clear answers instantly.</p>
        </div>

        <div className="feature">
          <h3>🧠 Deep Focus Mode</h3>
          <p>Eliminate distractions and enter high-performance thinking.</p>
        </div>

        <div className="feature">
          <h3>🔥 Magic16 System</h3>
          <p>16-minute daily ritual to boost energy & discipline.</p>
        </div>

        <div className="feature">
          <h3>🚀 Future Builder Tools</h3>
          <p>Plan, learn, and execute goals with AI guidance.</p>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="testimonials">
        <h2>What Users Say</h2>

        <div className="testimonial-cards">
          <div className="testimonial">
            <h4>Shyam</h4>
            <p>
              Clean design, super fast, and extremely intuitive. Everything feels
              smooth and premium. Easily one of the best apps I've used.
            </p>
          </div>

          <div className="testimonial">
            <h4>Priya</h4>
            <p>
              ManifiX helps me stay focused and calm. The AI is instant and the
              Magic16 routine actually works. I use it daily now.
            </p>
          </div>

          <div className="testimonial">
            <h4>Nikil</h4>
            <p>
              It's like having a personal coach + AI assistant. I feel more
              productive, organized, and confident every day.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="faq">
        <h2>FAQs</h2>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>What is ManifiX?</h3>
          <p>AI-powered system for growth, focus, and daily success.</p>
        </div>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>Is it free?</h3>
          <p>Yes. You can start free and upgrade anytime.</p>
        </div>

        <div className="faq-item" onClick={toggleFAQ}>
          <h3>What is Magic16?</h3>
          <p>A 16-minute daily system for clarity, discipline, and energy.</p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} ManifiX. All rights reserved.</p>
      </footer>
    </div>
  );
}
