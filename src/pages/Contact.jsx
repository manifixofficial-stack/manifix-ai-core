// src/pages/Contact.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { Helmet } from "react-helmet-async";
import "../styles/Contact.css";

export default function Contact() {
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef();
  const emailRef = useRef();
  const messageRef = useRef();
  const canvasRef = useRef(null);

  /* ================= SPARKLES BACKGROUND ================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let stars = [];
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const count = canvas.width < 640 ? 60 : 120;

      stars = Array(count)
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

      stars.forEach((star) => {
        ctx.globalAlpha = Math.random();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        star.y += star.s;
        if (star.y > canvas.height) star.y = 0;
      });

      animationId = requestAnimationFrame(drawStars);
    };

    resizeCanvas();
    drawStars();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId); // ✅ FIX memory leak
    };
  }, []);

  /* ================= FORM SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatusMessage("");

    const name = nameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const message = messageRef.current.value.trim();

    if (!name || !email || !message) {
      setStatusMessage("⚠️ All fields are required.");
      setSubmitting(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatusMessage("⚠️ Enter a valid email.");
      setSubmitting(false);
      return;
    }

    if (message.length < 10) {
      setStatusMessage("⚠️ Message must be at least 10 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name,
          email,
          message,
          created_at: new Date().toISOString(), // ✅ better format
        },
      ]);

      if (error) throw error;

      setStatusMessage("✅ Message sent successfully!");

      // Reset safely
      nameRef.current.value = "";
      emailRef.current.value = "";
      messageRef.current.value = "";
    } catch (err) {
      console.error(err);
      setStatusMessage("⚠️ Failed to send. Try again later.");
    }

    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen text-white font-inter overflow-x-hidden">
      <Helmet>
        <title>Contact ManifiX AI</title>
        <meta
          name="description"
          content="Contact ManifiX AI for partnerships, support, and business inquiries."
        />
      </Helmet>

      {/* Background */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full -z-10"
      />

      {/* HEADER */}
      <header className="max-w-7xl mx-auto p-6 flex justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/images/logo.png" className="w-12 h-12" />
          <h1 className="font-bold text-xl">ManifiX</h1>
        </a>
      </header>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-center mb-10">
          Contact ManifiX
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="card p-8 rounded-2xl grid gap-4">
          <input
            type="text"
            placeholder="Your Name"
            ref={nameRef}
            disabled={submitting}
          />

          <input
            type="email"
            placeholder="Your Email"
            ref={emailRef}
            disabled={submitting}
          />

          <textarea
            placeholder="Your Message"
            rows={5}
            ref={messageRef}
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>

          {statusMessage && (
            <p className="text-center mt-2">{statusMessage}</p>
          )}
        </form>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-400">
        © {new Date().getFullYear()} ManifiX
      </footer>
    </div>
  );
}
