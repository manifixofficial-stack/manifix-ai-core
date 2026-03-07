// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../styles/MainLayout.css";

import logoImg from "../../assets/logo.png";
import shareIcon from "../../assets/share.png";
import teamIcon from "../../assets/team.png";
import binIcon from "../../assets/bin.png";
import qualityImg from "../../assets/quality.png"; // Premium upgrade image

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showOptions, setShowOptions] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Use startsWith for nested routes or query params
  const isChatPage = location.pathname.startsWith("/app/gpt");
  const isBillingPage = location.pathname.startsWith("/app/billing");
  const isMagic16Page = location.pathname.startsWith("/app/magic16");
  const isFeedbackPage = location.pathname.startsWith("/app/feedback");

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="main-layout">
      {/* ---------- HEADER ---------- */}
      <header className="main-header">
        <div className="header-left" onClick={() => navigate("/")}>
          <img src={logoImg} alt="ManifiX Logo" className="logo" />
          <h1 className="app-title">ManifiX</h1>
        </div>

        <div className="header-right">
          {/* GPT Page Button */}
          {isChatPage && (
            <button
              className="gradient-btn"
              title="New Chat"
              onClick={() => navigate("/app/gpt")}
            >
              ➕ New Chat
            </button>
          )}

          {/* Billing / Upgrade Page */}
          {isBillingPage && (
            <div className="billing-actions">
              <button className="gradient-btn premium-btn">
                ⭐ Premium
              </button>

              <img
                src={qualityImg}
                alt="Premium Quality"
                className="premium-quality-img"
              />

              <div className="more-options" ref={dropdownRef}>
                <button
                  className="gradient-btn"
                  onClick={() => setShowOptions((prev) => !prev)}
                  aria-label="More options"
                >
                  ⋮
                </button>

                {showOptions && (
                  <div className="dropdown-menu">
                    <button onClick={() => alert("Share Billing")}>
                      <img
                        src={shareIcon}
                        alt="Share"
                        className="dropdown-icon"
                      />{" "}
                      Share
                    </button>
                    <button onClick={() => alert("Group Purchase")}>
                      <img
                        src={teamIcon}
                        alt="Group"
                        className="dropdown-icon"
                      />{" "}
                      Group Purchase
                    </button>
                    <button onClick={() => alert("Cancel Subscription")}>
                      <img
                        src={binIcon}
                        alt="Delete"
                        className="dropdown-icon"
                      />{" "}
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Magic16 Page Button */}
          {isMagic16Page && (
            <button
              className="gradient-btn magic16-btn"
              title="Magic16"
              onClick={() => navigate("/app/magic16")}
            >
              ✨ Magic16
            </button>
          )}

          {/* Feedback Page Button */}
          {isFeedbackPage && (
            <button
              className="gradient-btn feedback-btn"
              title="Feedback"
              onClick={() => navigate("/app/feedback")}
            >
              📝 Feedback
            </button>
          )}
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="main-footer">
        <span>© {new Date().getFullYear()} ManifiX. All rights reserved.</span>
      </footer>
    </div>
  );
}
