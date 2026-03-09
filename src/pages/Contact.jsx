// src/pages/Contact.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";

export default function Contact() {
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef();
  const emailRef = useRef();
  const messageRef = useRef();
  const canvasRef = useRef(null);

  // 🌟 Sparkles Background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let stars = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array(120)
        .fill()
        .map(() => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5,
          s: Math.random() * 0.5 + 0.2,
        }));
    };

    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      stars.forEach((star) => {
        ctx.globalAlpha = Math.random();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.s;
        if (star.y > canvas.height) star.y = 0;
      });
      requestAnimationFrame(drawStars);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    drawStars();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage("");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: nameRef.current.value,
            email: emailRef.current.value,
            message: messageRef.current.value,
            created_at: new Date(),
          },
        ]);

      if (error) throw error;

      setStatusMessage("✅ Message sent successfully! We’ll get back to you soon.");
      e.target.reset();
    } catch (err) {
      console.error(err);
      setStatusMessage("⚠️ Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0d0d0d] via-[#1b1b1b] to-[#050505] text-white font-inter overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3" aria-label="ManifiX home">
          <img src="/assets/images/logo.png" alt="ManifiX logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-extrabold tracking-wide">ManifiX</h1>
            <p className="text-sm text-gray-400">AI.Magic16</p>
          </div>
        </a>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-pulse">
            Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-white">ManifiX</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join the evolution of creativity — from human wellness to AI-driven innovation.  
            Connect with investors, creators, and collaborators worldwide.
          </p>
        </section>

        {/* Cards */}
        <section className="grid md:grid-cols-3 gap-8 mb-12">
          <ContactCard title="Partnerships" desc="Collaborate with ManifiX for wellness, AI, or creative ecosystems." mail="partners@manifixai.com" btnText="Email Us" />
          <ContactCard title="Investors" desc="Shape the ManifiX future — invest in the next-gen creative AI platform." mail="invest@manifixai.com" btnText="Contact IR Team" />
          <ContactCard title="Press & Media" desc="Get access to interviews, news, and official brand media kits." mail="press@manifixai.com" btnText="Reach PR Team" />
        </section>

        {/* Contact Form */}
        <section className="card p-8 rounded-3xl max-w-3xl mx-auto bg-gradient-to-tr from-[#1b1b1b]/80 to-[#0d0d0d]/80 backdrop-blur-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-center">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <input type="text" placeholder="Your Name" required ref={nameRef} className="p-4 rounded-xl bg-transparent border border-gray-700 focus:border-white outline-none transition" />
            <input type="email" placeholder="Your Email" required ref={emailRef} className="p-4 rounded-xl bg-transparent border border-gray-700 focus:border-white outline-none transition" />
            <textarea placeholder="Your Message" required rows={5} ref={messageRef} className="p-4 rounded-xl bg-transparent border border-gray-700 focus:border-white outline-none transition"></textarea>
            <button type="submit" disabled={submitting} className="btn btn-primary w-max mx-auto">
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
          {statusMessage && <p className="text-center text-sm mt-4 animate-pulse">{statusMessage}</p>}
        </section>

        {/* Features Section */}
        <section className="card p-10 rounded-3xl max-w-5xl mx-auto mt-20 text-center bg-gradient-to-tr from-[#1b1b1b]/70 to-[#0d0d0d]/70 backdrop-blur-lg shadow-xl border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Discover the Power of ManifiX</h2>
          <p className="text-gray-400 mb-10">
            ManifiX is your digital partner for creation, AI , and transformation.  
            Combining human energy with AI guidance to unlock your best self daily.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard title="Magic16 Wellness System" desc="16 modules guiding daily energy, mindset, and goals for manifestation." />
            <FeatureCard title="GPT-AI Smart Companion" desc="Ask anything — GPT AI responds clearly, accurately, and soulfully." />
            <FeatureCard title="Collaboration Network" desc="Connect with innovators, investors, and creators globally." />
          </div>
        </section>

        {/* Google Map */}
        <section className="card p-6 rounded-3xl mt-12 max-w-5xl mx-auto bg-gradient-to-tr from-[#1b1b1b]/70 to-[#0d0d0d]/70 backdrop-blur-lg shadow-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-center">📍 Find ManifiX</h2>
          <p className="text-center text-gray-400 mb-6">
            Visit our headquarters or collaborate virtually — building the future together.
          </p>
          <div className="rounded-3xl overflow-hidden border border-gray-800 shadow-lg" style={{ height: 400 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.904826903009!2d90.41251821536223!3d23.810331384558733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b8ef7c0f2f%3A0xb73c6d053c75c8b1!2sGoogle!5e0!3m2!1sen!2sin!4v1698799999999!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 text-gray-400 text-center py-6">
        © {new Date().getFullYear()} <strong>ManifiX</strong> — Where AI meets human wellness.
        <br />
        <a className="hover:underline text-gray-400" href="/privacy">Privacy</a> ·
        <a className="hover:underline text-gray-400" href="/terms">Terms</a>
      </footer>
    </div>
  );
}

// Reusable Components
function ContactCard({ title, desc, mail, btnText }) {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-tr from-[#1b1b1b]/70 to-[#0d0d0d]/70 backdrop-blur-lg border border-gray-700 shadow-lg hover:scale-105 transition transform duration-300 text-center">
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{desc}</p>
      <a href={`mailto:${mail}`} className="btn btn-outline">{btnText}</a>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-transparent border border-gray-700 hover:border-white transition transform hover:scale-105 duration-300 text-center">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
