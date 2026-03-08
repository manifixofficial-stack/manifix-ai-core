import React from "react";

export default function Terms() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", maxWidth: "900px", margin: "auto", lineHeight: "1.7" }}>
      
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <img
          src="/manifix-logo.png"
          alt="ManifiX Logo"
          style={{ width: "80px", marginBottom: "10px" }}
        />
        <h1>Terms of Use</h1>
        <p>ManifiX 2025</p>
      </header>

      {/* Navigation */}
      <nav style={{ marginBottom: "30px", textAlign: "center" }}>
        <a href="/" style={{ margin: "10px" }}>Home</a>
        <a href="/privacy" style={{ margin: "10px" }}>Privacy Policy</a>
        <a href="/terms" style={{ margin: "10px" }}>Terms</a>
        <a href="/contact" style={{ margin: "10px" }}>Contact</a>
      </nav>

      {/* Introduction */}
      <section>
        <h2>Introduction</h2>
        <p>
          Welcome to ManifiX. ManifiX is an AI-powered platform designed to help users
          research, create content, organize tasks, and improve productivity.
          These Terms of Use govern access to all ManifiX services including web apps,
          APIs, and integrations.
        </p>
        <p>
          By using ManifiX services, you agree to comply with these Terms and all
          applicable laws and regulations.
        </p>
      </section>

      {/* Account Rules */}
      <section>
        <h2>Account Registration & Responsibilities</h2>
        <ul>
          <li>Minimum age: Users must be at least 13 years old.</li>
          <li>Registration information must be accurate and updated.</li>
          <li>You are responsible for protecting your account credentials.</li>
          <li>Accounts should not be shared between multiple users.</li>
          <li>Users under 18 must have parental or guardian permission.</li>
        </ul>
      </section>

      {/* Platform Features */}
      <section>
        <h2>ManifiX Platform Features</h2>

        <h3>AI Research Assistant</h3>
        <p>
          Users can ask questions and receive AI-generated insights to support
          learning, research, and professional work.
        </p>

        <h3>Project & Task Management</h3>
        <p>
          Organize projects, track progress, and manage tasks using integrated
          productivity tools.
        </p>

        <h3>Learning & Tutorials</h3>
        <p>
          ManifiX provides structured learning tools and tutorials designed to
          help users build skills in technology, creativity, and research.
        </p>

        <h3>AI Creativity Tools</h3>
        <p>
          Users may generate articles, summaries, design ideas, and creative
          concepts using AI-powered features.
        </p>

        <h3>Collaboration & Team Tools</h3>
        <p>
          Teams may collaborate on projects, share content, and manage roles
          within collaborative workspaces.
        </p>

        <h3>Cross-Platform Access</h3>
        <p>
          ManifiX services are accessible via web platforms and may expand to
          mobile or desktop environments.
        </p>

        <h3>API Access</h3>
        <p>
          Developers may integrate ManifiX services using API access where
          available. API credentials must be kept secure.
        </p>
      </section>

      {/* Ownership */}
      <section>
        <h2>Content Ownership</h2>
        <ul>
          <li>Users retain ownership of content they submit.</li>
          <li>AI-generated outputs based on user input belong to the user.</li>
          <li>Users must ensure content does not violate laws or copyrights.</li>
          <li>Anonymized data may be used to improve AI performance.</li>
        </ul>
      </section>

      {/* Payments */}
      <section>
        <h2>Paid Services & Subscriptions</h2>
        <ul>
          <li>Paid plans require valid billing information.</li>
          <li>Subscription fees may change with prior notice.</li>
          <li>Payments are non-refundable except where required by law.</li>
          <li>Failure to maintain payment may result in account restrictions.</li>
        </ul>
      </section>

      {/* Security */}
      <section>
        <h2>Privacy, Security & Safety</h2>
        <p>
          ManifiX applies modern security practices including encrypted
          connections and protected infrastructure. User privacy and
          data protection are important priorities.
        </p>
      </section>

      {/* AI Disclaimer */}
      <section>
        <h2>AI Accuracy Disclaimer</h2>
        <p>
          AI-generated outputs may sometimes be inaccurate or incomplete.
          Users should verify important information before relying on it.
        </p>
        <p>
          ManifiX is not responsible for decisions made solely based on
          AI-generated content.
        </p>
      </section>

      {/* Updates */}
      <section>
        <h2>Changes to Terms</h2>
        <p>
          These Terms may be updated periodically. Continued use of the
          platform after updates indicates acceptance of the revised terms.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2>Contact</h2>
        <p>Email: manifixofficial@gmail.com</p>
        <p>Website: https://manifixai.com</p>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: "40px", textAlign: "center", color: "#777" }}>
        <p>© 2025 ManifiX. All rights reserved.</p>
      </footer>
    </div>
  );
}
