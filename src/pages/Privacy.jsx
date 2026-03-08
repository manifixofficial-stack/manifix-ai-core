import React from "react";

export default function Privacy() {
  return (
    <div style={{fontFamily:"Arial, sans-serif", lineHeight:"1.6", padding:"40px", maxWidth:"900px", margin:"auto"}}>
      
      {/* Logo + Title */}
      <div style={{textAlign:"center", marginBottom:"40px"}}>
        <img
          src="/manifix-logo.png"
          alt="ManifiX Logo"
          style={{width:"80px", marginBottom:"10px"}}
        />
        <h1>Privacy Policy — ManifiX</h1>
        <p>© 2025 ManifiX AI Platform</p>
      </div>

      {/* Overview */}
      <section>
        <h2>Overview</h2>
        <p>
          ManifiX is an AI-powered creative and wellness platform. We provide
          services such as GPT AI chat assistance, Human Health Voice Consulting,
          and the Magic16 wellness tool. This Privacy Policy explains how we
          collect, use, disclose, and protect your personal data when you use
          ManifiX services.
        </p>
      </section>

      {/* Scope */}
      <section>
        <h2>Scope & Applicability</h2>
        <p>
          This policy applies to all ManifiX products and services including
          web applications, APIs, integrations, and mobile platforms. It applies
          to visitors, registered users, contributors, and customers.
        </p>
      </section>

      {/* Definitions */}
      <section>
        <h2>Key Definitions</h2>
        <ul>
          <li><b>Personal Data:</b> Information that identifies an individual.</li>
          <li><b>Processing:</b> Collection, storage, modification, or deletion of data.</li>
          <li><b>Controller:</b> ManifiX determines how personal data is used.</li>
          <li><b>Processor:</b> Trusted service providers such as Supabase.</li>
        </ul>
      </section>

      {/* Data Collection */}
      <section>
        <h2>What Information We Collect</h2>
        <ul>
          <li>Account information (name, email, profile data)</li>
          <li>User content such as messages or voice notes</li>
          <li>Chat prompts, wellness selections, and feature inputs</li>
          <li>Technical data like device, browser, IP, and usage metrics</li>
          <li>Payment metadata (no card numbers stored)</li>
        </ul>
      </section>

      {/* Use of Data */}
      <section>
        <h2>How We Use Information</h2>
        <ul>
          <li>Operate and personalize ManifiX services</li>
          <li>User authentication</li>
          <li>Customer support and updates</li>
          <li>Fraud prevention and abuse detection</li>
          <li>Product analytics and improvements</li>
        </ul>
      </section>

      {/* Sharing */}
      <section>
        <h2>When We Share Information</h2>
        <p>
          Data may be shared with trusted service providers including cloud
          hosting, authentication platforms, and payment processors when
          required to deliver services.
        </p>
      </section>

      {/* Security */}
      <section>
        <h2>Storage, Security & Retention</h2>
        <ul>
          <li>Encrypted data transmission</li>
          <li>Secure cloud infrastructure</li>
          <li>Role-based access control</li>
          <li>Data retention only as long as necessary</li>
        </ul>
      </section>

      {/* Features */}
      <section>
        <h2>ManifiX App Features</h2>
        <ul>
          <li><b>GPT AI Chat:</b> Conversational AI assistant.</li>
          <li><b>Magic16:</b> Wellness and lifestyle tracker.</li>
        </ul>
      </section>

      {/* Moderation */}
      <section>
        <h2>Content Moderation & Safety</h2>
        <p>
          Automated systems and human review are used to maintain platform
          safety and ensure community guideline compliance.
        </p>
      </section>

      {/* Rights */}
      <section>
        <h2>User Rights & Controls</h2>
        <p>
          Users may request access, correction, deletion, or portability of
          their data by contacting support.
        </p>
      </section>

      {/* Cookies */}
      <section>
        <h2>Cookies & Tracking</h2>
        <p>
          Essential cookies maintain login sessions. Optional analytics cookies
          help improve the service and can be controlled via browser settings.
        </p>
      </section>

      {/* Payments */}
      <section>
        <h2>Payments & Billing</h2>
        <p>
          Payments are processed by trusted third-party payment providers.
          ManifiX does not store sensitive card details.
        </p>
      </section>

      {/* Children */}
      <section>
        <h2>Children & Family Safety</h2>
        <p>
          ManifiX is designed for users of all ages. We prioritize privacy
          protections for younger users and follow child safety standards.
        </p>
      </section>

      {/* Policy Updates */}
      <section>
        <h2>Policy Changes</h2>
        <p>
          We may update this policy periodically. Changes will be communicated
          via the website or email notifications.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2>Contact & Data Protection</h2>
        <p>Email: manifixofficial@gmail.com</p>
        <p>Website: https://manifixai.com</p>
      </section>

      {/* Footer */}
      <footer style={{marginTop:"40px", textAlign:"center", color:"#777"}}>
        <p>© 2025 ManifiX AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
