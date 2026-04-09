// src/pages/Home.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { motion } from "framer-motion";
import "../styles/Home.css";

/* ================= SHADER ================= */

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

  float r = length(uv);
  float a = atan(uv.y, uv.x);

  float spiral = sin(10.0 * r - a * 4.0 + iTime * 1.5);

  float glow = smoothstep(0.4, 0.0, r);

  vec3 col1 = vec3(0.2, 0.0, 0.4);
  vec3 col2 = vec3(0.6, 0.0, 1.0);
  vec3 col3 = vec3(0.0, 0.8, 0.6);

  vec3 color = mix(col1, col2, spiral);
  color = mix(color, col3, glow);

  gl_FragColor = vec4(color, 1.0);
}
`;

/* ================= BACKGROUND ================= */

function SpiralBackground() {
  const ref = useRef();

  useEffect(() => {
    const renderer = new Renderer({ dpr: 2 });
    const gl = renderer.gl;

    ref.current.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [window.innerWidth, window.innerHeight] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.iResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
      ];
    }

    window.addEventListener("resize", resize);
    resize();

    function update(t) {
      requestAnimationFrame(update);
      program.uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }

    requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      ref.current.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={ref} className="bg-canvas" />;
}

/* ================= MAIN PAGE ================= */

export default function Home() {
  return (
    <div className="home-container">

      {/* BACKGROUND */}
      <SpiralBackground />

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">ManifiX</div>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn-outline">Start</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Build Focus. <br />
          <span>Transform in 16 Minutes</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          A powerful AI-driven system to sharpen your mind,
          increase discipline, and elevate your daily life.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Link to="/signup" className="btn-primary">
            Start Your Routine →
          </Link>
          <Link to="/app/magic16" className="btn-secondary">
            Try Demo
          </Link>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Why ManifiX Wins</h2>

        <div className="feature-grid">
          {[
            "Magic16 Routine",
            "Daily Discipline Score",
            "AI Guided Flow",
            "Instant Clarity",
          ].map((item, i) => (
            <motion.div
              key={i}
              className="feature-card"
              whileHover={{ scale: 1.05 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Start Your 16-Minute Transformation</h2>
        <Link to="/signup" className="btn-primary big">
          Get Started →
        </Link>
      </section>

    </div>
  );
}
