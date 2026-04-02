// src/pages/Privacy.jsx
import React from "react";
import "../styles/Privacy.css";
import logo from "../assets/logo.png";

export default function Privacy() {
 return (
  <div className="privacy-container">
    <div className="privacy-layout">

      {/* SIDEBAR */}
      <aside className="privacy-sidebar">
        <a href="#overview">Overview</a>
        <a href="#data">Data</a>
        <a href="#security">Security</a>
        <a href="#rights">Your Rights</a>
      </aside>

      <main className="privacy-content">

      {/* Header */}
      <div className="privacy-header">
        <img src={logo} alt="ManifiX Logo" className="privacy-logo" />
        <h1>Privacy Policy — ManifiX</h1>
        <p>Last Updated: January 2025</p>
        <p>© 2025 ManifiX AI Platform</p>
      </div>

      {/* Overview */}
     <section id="overview" className="privacy-section">
        <h2>Overview</h2>
        <p>
          ManifiX is an AI-powered creativity, productivity, and wellness
          platform designed to help users learn, think, and maintain a
          balanced lifestyle. The platform offers intelligent conversational
          assistance and structured wellness tools that support daily growth,
          learning, and mental clarity.
        </p>
        <p>
          This Privacy Policy explains how ManifiX collects, uses, stores,
          and protects personal information when users access our website,
          applications, and related services.
        </p>
        <p>
          Our goal is to provide transparency and ensure users clearly
          understand how their information is handled while using the
          ManifiX platform.
        </p>
      </section>

      {/* Scope */}
      <section className="privacy-section">
        <h2>Scope & Applicability</h2>
        <p>
          This Privacy Policy applies to all ManifiX products and services,
          including our website, mobile applications, APIs, and integrations.
        </p>
        <p>
          It applies to visitors, registered users, subscribers, and any
          individuals interacting with ManifiX services.
        </p>
        <p>
          By accessing or using ManifiX, you agree to the practices described
          in this Privacy Policy.
        </p>
      </section>

      {/* Definitions */}
      <section className="privacy-section">
        <h2>Key Definitions</h2>
        <ul>
          <li>
            <b>Personal Data:</b> Information that identifies or can be
            associated with an individual, such as name or email address.
          </li>
          <li>
            <b>Processing:</b> Any action performed on personal data,
            including collection, storage, modification, analysis,
            or deletion.
          </li>
          <li>
            <b>Controller:</b> ManifiX determines how and why personal data
            is processed.
          </li>
          <li>
            <b>Processor:</b> Trusted third-party providers that process
            data on behalf of ManifiX such as hosting platforms or
            authentication services.
          </li>
        </ul>
      </section>

      {/* Data Collection */}
    <section id="data" className="privacy-section">
        <h2>What Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>Account information including name, email address, and authentication credentials.</li>
          <li>User-generated content such as messages, prompts, or feedback submitted while using ManifiX features.</li>
          <li>Wellness activity inputs such as selected routines or feature usage preferences.</li>
          <li>Technical information including browser type, device information, operating system, and IP address.</li>
          <li>Usage data including interaction patterns, feature usage statistics, and platform performance metrics.</li>
          <li>Payment metadata when purchasing subscriptions. Sensitive financial information such as card numbers is never stored by ManifiX.</li>
        </ul>
      </section>

      {/* Use of Data */}
      <section className="privacy-section">
        <h2>How We Use Information</h2>
        <p>The information we collect helps us operate and improve ManifiX.</p>
        <ul>
          <li>Provide and maintain ManifiX services</li>
          <li>Enable secure authentication and account management</li>
          <li>Deliver AI-powered conversational assistance</li>
          <li>Improve wellness tools and personalized experiences</li>
          <li>Provide support and respond to user inquiries</li>
          <li>Detect fraud, misuse, or security risks</li>
          <li>Analyze platform performance and improve features</li>
        </ul>
      </section>

      {/* Sharing */}
      <section className="privacy-section">
        <h2>When We Share Information</h2>
        <p>
          ManifiX does not sell or rent personal data. Information may only
          be shared with trusted service providers when necessary to deliver
          platform services.
        </p>
        <ul>
          <li>Cloud hosting infrastructure providers</li>
          <li>Authentication and account management platforms</li>
          <li>Analytics tools used to improve service performance</li>
          <li>Payment processors handling subscription transactions</li>
        </ul>
        <p>These providers are required to maintain strict data security and confidentiality standards.</p>
      </section>

      {/* Security */}
    <section id="security" className="privacy-section">
        <h2>Storage, Security & Retention</h2>
        <ul>
          <li>Encrypted HTTPS data transmission</li>
          <li>Secure cloud infrastructure</li>
          <li>Role-based access control systems</li>
          <li>Security monitoring to detect suspicious activity</li>
          <li>Data retention limited to operational necessity</li>
        </ul>
      </section>

      {/* AI Transparency */}
      <section className="privacy-section">
        <h2>AI Transparency</h2>
        <p>
          ManifiX includes AI-powered systems that generate responses
          based on user prompts and inputs. AI responses are generated
          automatically and may not always be perfectly accurate.
        </p>
        <p>
          Users should evaluate AI-generated responses carefully and
          use them as informational assistance rather than professional advice.
        </p>
      </section>

      {/* Features */}
      <section className="privacy-section">
        <h2>ManifiX Platform Features</h2>
        <ul>
          <li>
            <b>AI Conversation Assistant</b><br />
            An intelligent conversational assistant that helps users ask
            questions, generate ideas, explore topics, and receive helpful
            responses through natural language interaction.
          </li>
          <li>
            <b>Magic16 Wellness System</b><br />
            A structured daily wellness routine encouraging a balanced
            lifestyle through a simple 16-minute practice:
            <br />• 8 minutes of guided yoga<br />• 8 minutes of meditation
          </li>
        </ul>
      </section>

      {/* Moderation */}
      <section className="privacy-section">
        <h2>Content Moderation & Safety</h2>
        <p>To maintain a safe platform environment, ManifiX may use automated systems and moderation processes to identify harmful, abusive, or illegal content.</p>
        <p>These measures help ensure the platform remains respectful and safe for all users.</p>
      </section>

      {/* Rights */}
     <section id="rights" className="privacy-section">
        <h2>User Rights & Controls</h2>
        <ul>
          <li>Access to stored personal data</li>
          <li>Correction of inaccurate information</li>
          <li>Deletion of account data</li>
          <li>Data portability requests</li>
        </ul>
        <p>Requests can be submitted through our support contact.</p>
      </section>

      {/* Cookies */}
      <section className="privacy-section">
        <h2>Cookies & Tracking Technologies</h2>
        <p>ManifiX uses cookies and similar technologies to maintain login sessions, improve performance, and analyze how users interact with the platform.</p>
        <p>Users may control cookies through browser settings.</p>
      </section>

      {/* Payments */}
      <section className="privacy-section">
        <h2>Payments & Billing</h2>
        <p>Subscription payments may be processed through trusted third-party payment providers. ManifiX does not store sensitive financial information such as credit card numbers.</p>
      </section>

      {/* Children */}
      <section className="privacy-section">
        <h2>Children & Family Safety</h2>
        <p>ManifiX services are intended for users aged 13 and above. We prioritize privacy protections and responsible design practices to protect younger users.</p>
      </section>

      {/* Policy Updates */}
      <section className="privacy-section">
        <h2>Policy Changes</h2>
        <p>We may update this Privacy Policy periodically to reflect improvements to our services or changes in legal requirements.</p>
        <p>When significant updates occur, users will be notified through the platform or email notifications where applicable.</p>
      </section>

      {/* Disclaimer */}
      <section className="privacy-section">
        <h2>Disclaimer</h2>
        <p>ManifiX AI responses and wellness tools are provided for informational and general guidance purposes only. They are not intended to replace professional medical, legal, or financial advice.</p>
      </section>

      {/* Contact */}
      <section className="privacy-section">
        <h2>Contact & Data Protection</h2>
        <p>If you have questions about this Privacy Policy or your personal data, please contact us:</p>
        <p>Email: manifixofficial@gmail.com</p>
        <p>Website: https://manifixai.com</p>
      </section>

    <main className="privacy-content">
             {/* Footer */}
        <footer className="privacy-footer">
          © 2025 ManifiX AI. All rights reserved.
        </footer>

      </main>
    </div>

    <div className="highlight-box">
      🔒 We NEVER sell your personal data.
    </div>

  </div>
);
}
