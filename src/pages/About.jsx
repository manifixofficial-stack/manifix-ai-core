import React from "react";
import { Link } from "react-router-dom";
import "../styles/About.css";
import logo from "../assets/logo.png";

export default function About() {

  return (
    <div className="about-page">

      {/* Header */}

      <header className="about-header">

        <img src={logo} alt="ManifiX Logo" className="about-logo" />

        <nav>
          <Link to="/Home">Home</Link>
          <Link to="/features/gpt">GPT</Link>
          <Link to="/features/magic16">Magic16</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/contact">Contact</Link>
        </nav>

      </header>



      {/* Hero Section */}

     {/* Hero Section */}

<section className="about-hero">

  <h1>About ManifiX</h1>

  <p>
    ManifiX is an intelligent productivity platform designed to help
    people think clearly, work efficiently, and focus deeply in the
    modern digital world. By combining artificial intelligence with
    practical focus systems, ManifiX helps users solve problems,
    organize ideas, and accomplish meaningful work faster.
  </p>

  <p>
    Our goal is simple: build tools that support human thinking.
    Instead of overwhelming users with complex software, ManifiX
    provides simple and powerful systems that improve clarity,
    creativity, and productivity every day.
  </p>

</section>


     {/* Mission */}

<section className="about-section">

  <h2>Our Mission</h2>

  <p>
    The mission of ManifiX is to create technology that strengthens
    human intelligence rather than replacing it. In a world filled
    with distractions, information overload, and constant digital
    noise, people need tools that help them think better and focus
    on what truly matters.
  </p>

  <p>
    We believe artificial intelligence should act as a partner that
    assists with research, learning, writing, planning, and creative
    thinking. When combined with structured focus methods, people can
    achieve deeper concentration and produce higher-quality work.
  </p>

  <p>
    ManifiX is built to support students, professionals, creators,
    researchers, and anyone who wants to improve how they think,
    learn, and work in the digital age.
  </p>

</section>



   {/* Products */}

<section className="about-products">

  <h2>Our Products</h2>

  <p className="about-intro">
    ManifiX currently offers two core tools designed to support both
    intelligent thinking and deep focus. These systems work together
    to help users generate ideas, solve problems, and maintain
    sustained concentration.
  </p>

  <div className="about-grid">

    {/* GPT */}

    <div className="about-card">

      <h3>ManifiX GPT</h3>

      <p>
        ManifiX GPT is an AI-powered assistant that helps users
        research information, write content, analyze problems,
        generate ideas, and learn new topics faster.
      </p>

      <p>
        It can assist with coding, summarizing complex documents,
        brainstorming creative solutions, and answering difficult
        questions across many fields of knowledge.
      </p>

      <p>
        Instead of searching across many websites, users can interact
        with a single intelligent system that understands context
        and provides clear explanations.
      </p>

      <Link to="/app/gpt" className="about-btn">
        Open GPT
      </Link>

    </div>



    {/* Magic16 */}

    <div className="about-card">

      <h3>Magic16 Focus System</h3>

      <p>
        Magic16 is a structured 16-step focus method designed to
        improve posture, breathing rhythm, and mental clarity during
        focused work sessions.
      </p>

      <p>
        The system guides users through a series of timed steps that
        encourage deep concentration, physical awareness, and steady
        breathing, helping the mind stay calm and focused.
      </p>

      <p>
        Over time, this method can improve productivity, reduce
        mental fatigue, and help users build a consistent deep
        work habit.
      </p>

      <Link to="/app/magic16" className="about-btn">
        Start Magic16
      </Link>

    </div>

  </div>

</section>



     {/* Vision */}

<section className="about-section">

  <h2>The Future</h2>

  <p>
    The future of productivity will combine artificial intelligence
    with human creativity and focus. While AI can process information
    rapidly, human insight, imagination, and judgment remain essential.
  </p>

  <p>
    ManifiX aims to build systems where AI supports human thinking,
    helping people explore ideas, solve complex problems, and learn
    more efficiently.
  </p>

  <p>
    As technology evolves, our goal is to expand ManifiX into a
    comprehensive platform that integrates intelligent assistants,
    productivity systems, and knowledge tools designed to help
    people achieve their highest potential.
  </p>

  <p>
    By combining AI assistance with structured focus methods,
    ManifiX seeks to create a balanced approach to modern work —
    where technology empowers people instead of distracting them.
  </p>

</section>



      {/* CTA */}

      <section className="about-cta">

        <h2>Start Using ManifiX</h2>

        <div className="about-buttons">

          <Link to="/app/gpt" className="about-btn large">
            Try ManifiX GPT
          </Link>

          <Link to="/app/magic16" className="about-btn outline">
            Start Magic16
          </Link>

        </div>

      </section>

    </div>
  );
}
