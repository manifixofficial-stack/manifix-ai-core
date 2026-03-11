import React from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/Features.css";
import logo from "../assets/logo.png";

export default function Features() {

  const { feature } = useParams();

  const pages = {
    gpt: {
      title: "ManifiX GPT",
      description:
        "AI assistant for research, writing, and problem solving.",
      features: [
        "Smart answers",
        "Code help",
        "Research summaries",
        "Brainstorming ideas"
      ],
      button: "Try ManifiX GPT",
      link: "/app/gpt"
    },

    magic16: {
      title: "Magic16 Focus System",
      description:
        "A 16-step productivity method that improves focus, posture and mental clarity.",
      features: [
        "Guided breathing",
        "Focus timer",
        "Progress tracking",
        "Productivity scoring"
      ],
      button: "Start Magic16",
      link: "/app/magic16"
    }
  };

  const data = pages[feature];

  if (!data) {
    return (
      <div className="features-page">
        <h1>Feature Not Found</h1>
      </div>
    );
  }

  return (
    <div className="features-page">

      {/* Header */}
      <header className="features-header">
        <img src={logo} alt="ManifiX Logo" className="features-logo"/>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="features-hero">

        <h1>{data.title}</h1>

        <p className="features-description">
          {data.description}
        </p>

        <Link to={data.link} className="features-btn">
          {data.button}
        </Link>

      </section>

      {/* Features List */}
      <section className="features-list">

        <h2>Key Features</h2>

        <div className="features-grid">

          {data.features.map((item, index) => (
            <div key={index} className="feature-card">

              <div className="feature-icon">✨</div>

              <p>{item}</p>

            </div>
          ))}

        </div>

      </section>

      {/* Footer CTA */}
      <section className="features-cta">

        <h2>Start using {data.title}</h2>

        <Link to={data.link} className="features-btn large">
          {data.button}
        </Link>

      </section>

    </div>
  );
}
