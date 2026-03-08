// src/pages/Dashboard.jsx
import React, { useEffect } from "react";

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
    // Particle Animation
    const particlesContainer = document.getElementById('particles');
    const particles = [];
    for (let i = 0; i < 120; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * window.innerWidth + 'px';
      p.style.top = Math.random() * window.innerHeight + 'px';
      p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
      p.style.opacity = Math.random() * 0.6 + 0.3;
      particlesContainer.appendChild(p);
      particles.push(p);
    }

    // Mouse particles
    const handleMouseMove = (e) => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = e.clientX + 'px';
      particle.style.top = e.clientY + 'px';
      particle.style.width = particle.style.height = '2px';
      particle.style.opacity = 0.7;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1500);
    };
    document.addEventListener('mousemove', handleMouseMove);

    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // FAQ Toggle
  useEffect(() => {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      item.addEventListener('click', () => item.classList.toggle('active'));
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f0f1f] text-[#e0e0ff] overflow-x-hidden font-inter">
      {/* Particle Container */}
      <div id="particles" className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="flex justify-between items-center px-20 py-5 sticky top-0 bg-[rgba(10,10,30,0.9)] backdrop-blur-md z-50">
        <div className="flex items-center gap-3 logo">
          <img src="/assets/images/logo.png" alt="ManifiX Logo" className="w-[55px]" />
          <span className="font-orbitron font-bold text-2xl bg-gradient-to-r from-[#6BD1FF] via-[#8C75FF] to-[#FF6FFF] bg-clip-text text-transparent text-shadow">
            ManifiX
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/gpt" className="font-semibold hover:text-[#6BD1FF] transition">ManifiX AI</a>
          <a href="/magic16" className="font-semibold hover:text-[#6BD1FF] transition">Magic16</a>
          <a href="/dashboard" className="font-semibold hover:text-[#6BD1FF] transition">Dashboard</a>
          <a href="/settings" className="font-semibold hover:text-[#6BD1FF] transition">Settings</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero flex flex-wrap items-center justify-between px-20 py-32 gap-10 relative z-10">
        <div className="hero-text flex-1 max-w-xl">
          <h1 className="text-5xl md:text-6xl font-orbitron mb-5 bg-gradient-to-r from-[#8C75FF] via-[#6BD1FF] to-[#FF6FFF] bg-clip-text text-transparent animate-gradient text-shadow">
            Ask, Learn & Boost Your Energy
          </h1>
          <p className="text-xl mb-8 text-[#d0d0ff]">
            ManifiX is your AI-powered guide to unleash energy, boost your prosperity, and transform your wellness.
          </p>
          <div className="hero-buttons flex flex-wrap gap-4">
            <a href="/gpt" className="primary px-10 py-4 rounded-full font-semibold bg-gradient-to-tr from-[#6BD1FF] to-[#8C75FF] text-[#0f0f1f] hover:from-[#FF6FFF] hover:to-[#6BD1FF] hover:translate-y-[-3px] shadow-lg transition-all">
              Start Chatting
            </a>
            <a href="/magic16" className="secondary px-10 py-4 rounded-full font-semibold border-2 border-[#8C75FF] text-[#8C75FF] hover:bg-[#8C75FF] hover:text-[#0f0f1f] hover:translate-y-[-3px] shadow-lg transition-all">
              Improve Your Health
            </a>
          </div>
        </div>
        <div className="hero-image flex-1 text-center">
          <img src="/assets/images/bot.png" alt="AI Illustration" className="max-w-full rounded-[20px] shadow-2xl transition-transform hover:scale-105" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features grid gap-8 px-20 py-24">
        <Feature title="Instant AI Answers" desc="Get precise and fast responses to any questions." />
        <Feature title="ManifiX Guidance" desc="Receive personalized tips to boost your success." />
        <Feature title="Magic16 Wellness" desc="Daily routines to enhance focus." />
        <Feature title="Voice & Text Chat" desc="Communicate naturally via voice or text." />
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="testimonials px-20 py-24">
        <h2 className="text-center text-4xl font-bold text-[#8C75FF] mb-12">What Our Users Say</h2>
        <div className="testimonial-cards grid gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial bg-[rgba(20,20,50,0.85)] p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <h4 className="text-[#6BD1FF] font-bold mb-3">{t.name}</h4>
              <p className="text-[#d0d0ff]">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq px-20 py-24">
        <h2 className="text-4xl text-center text-[#8C75FF] mb-12">Frequently Asked Questions</h2>
        <FAQItem question="What is ManifiX?" answer="ManifiX is your AI assistant for growth, wellness, and success." />
        <FAQItem question="Can I chat for free?" answer="Yes! Unlimited chatting at no cost." />
        <FAQItem question="How do I use Magic16?" answer="Magic16 includes daily yoga & meditation to boost your energy." />
      </section>

      {/* Footer */}
      <footer className="text-center py-16 bg-[rgba(0,0,0,0.9)] text-[#d0d0ff]">
        <p>&copy; 2025 ManifiX. All rights reserved.</p>
        <p>
          <a href="/privacy">Privacy</a> | <a href="/terms">Terms</a> | <a href="/contact">Contact</a>
        </p>
      </footer>
    </div>
  );
}

// ===== Feature Component =====
function Feature({ title, desc }) {
  return (
    <div className="feature bg-[rgba(15,15,40,0.85)] p-8 rounded-2xl border border-[rgba(107,209,255,0.2)] hover:translate-y-[-7px] hover:shadow-[0_15px_40px_rgba(107,209,255,0.3)] transition-all">
      <h3 className="text-[#6BD1FF] font-bold mb-3 text-xl">{title}</h3>
      <p className="text-[#d0d0ff] text-base">{desc}</p>
    </div>
  );
}

// ===== FAQ Item Component =====
function FAQItem({ question, answer }) {
  useEffect(() => {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      item.addEventListener('click', () => item.classList.toggle('active'));
    });
  }, []);

  return (
    <div className="faq-item bg-[rgba(20,20,50,0.85)] p-5 mb-5 rounded-lg border border-[rgba(107,209,255,0.1)] cursor-pointer transition-all">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p>{answer}</p>
    </div>
  );
}
