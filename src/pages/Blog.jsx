import React from "react";
import { Link } from "react-router-dom";
import "../styles/Blog.css";
import logo from "../assets/logo.png";

export default function Blog() {

  const posts = [

    {
      title: "How AI Can Improve Daily Productivity",
      description:
        "Discover how AI assistants can help with research, writing, and decision making.",
      date: "March 2026",
      link: "/blog/ai-productivity"
    },

    {
      title: "The Magic16 Focus Method Explained",
      description:
        "Learn how the 16-step focus system improves posture, mental clarity and deep work.",
      date: "March 2026",
      link: "/blog/magic16-method"
    },

    {
      title: "Using AI for Research and Learning",
      description:
        "AI tools can summarize complex topics and accelerate learning faster than ever.",
      date: "March 2026",
      link: "/blog/ai-research"
    },

    {
      title: "Focus vs Multitasking",
      description:
        "Why deep focus beats multitasking and how productivity systems can help.",
      date: "March 2026",
      link: "/blog/focus-vs-multitasking"
    }

  ];


  return (
    <div className="blog-page">

      {/* Header */}

      <header className="blog-header">

        <img src={logo} alt="ManifiX Logo" className="blog-logo" />

        <nav>
          <Link to="/">Home</Link>
          <Link to="/features/gpt">GPT</Link>
          <Link to="/features/magic16">Magic16</Link>
          <Link to="/contact">Contact</Link>
        </nav>

      </header>


      {/* Hero */}

      <section className="blog-hero">

        <h1>ManifiX Blog</h1>

        <p>
          Insights about AI, productivity, focus systems, and the future of work.
        </p>

      </section>


      {/* Blog Grid */}

      <section className="blog-list">

        <div className="blog-grid">

          {posts.map((post, index) => (

            <div key={index} className="blog-card">

              <div className="blog-date">
                {post.date}
              </div>

              <h3>{post.title}</h3>

              <p>
                {post.description}
              </p>

              <Link to={post.link} className="blog-read">
                Read Article →
              </Link>

            </div>

          ))}

        </div>

      </section>


      {/* CTA */}

      <section className="blog-cta">

        <h2>Explore ManifiX Tools</h2>

        <div className="blog-buttons">

          <Link to="/app/gpt" className="blog-btn">
            Open ManifiX GPT
          </Link>

          <Link to="/app/magic16" className="blog-btn outline">
            Start Magic16
          </Link>

        </div>

      </section>

    </div>
  );
}
