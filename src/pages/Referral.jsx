import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Users } from "lucide-react";
import "../styles/Recruit.css";

export default function Recruit() {
  const [inviteCode, setInviteCode] = useState("");
  const [referralCount, setReferralCount] = useState(2); // Mock: 2/3 done
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate code based on user handle
    const name = localStorage.getItem("user_name") || "ELITE";
    setInviteCode(`MANIFIX-${name.toUpperCase()}-2026`);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `I am recruiting for the ManifiX 1% Club. Use my code ${inviteCode} to unlock the 16-day protocol. Most won't finish. Will you? 🔥`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ManifiX Recruitment", text });
      } catch (err) { console.log(err); }
    }
  };

  return (
    <div className="recruit-elite-container">
      <header className="recruit-header">
        <h1 className="gold-text">RECRUIT THE ELITE</h1>
        <p>Build your squad. Unlock lifetime status.</p>
      </header>

      {/* --- PROGRESS TO FREE MONTH --- */}
      <div className="reward-tracker">
        <div className="tracker-top">
          <span>PROGRESS TO FREE MONTH</span>
          <span className="gold-text">{referralCount}/3 RECRUITS</span>
        </div>
        <div className="progress-bar-bg">
          <motion.div 
            className="progress-bar-gold" 
            initial={{ width: 0 }}
            animate={{ width: `${(referralCount / 3) * 100}%` }}
          />
        </div>
        <p className="note">Recruit 1 more high-performer to unlock 30 days of Premium (Save ₹1,999).</p>
      </div>

      {/* --- THE VIRTUAL BLACK CARD --- */}
      <motion.div 
        className="invite-card-gold"
        whileHover={{ rotateY: 5, rotateX: -5 }}
      >
        <div className="card-top">
          <span className="card-label">OFFICIAL INVITATION</span>
          <div className="logo-watermark">M</div>
        </div>
        
        <div className="invite-code-box">
          <h2>{inviteCode}</h2>
          <button onClick={handleCopy}>{copied ? "COPIED" : "COPY CODE"}</button>
        </div>

        <div className="card-bottom">
          <span>VALID UNTIL: DEC 2026</span>
          <Users size={20} color="#D4AF37" />
        </div>
      </motion.div>

      <button className="share-btn-gold" onClick={handleShare}>
        <Share2 size={18} /> BROADCAST INVITATION
      </button>

      <footer className="recruit-footer">
        <p>New recruits get 10% off their first month. You get status.</p>
      </footer>
    </div>
  );
}
