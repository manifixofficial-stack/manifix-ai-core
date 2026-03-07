import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";
import logo from "../assets/logo.png"; // Add your logo here

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="gpt-header">
      <div className="logo-container">
        <img src={logo} alt="ManifiX Logo" className="logo" />
        <h1 className="header-title">ManifiX</h1>
      </div>

      <button
        className="new-chat-circle"
        onClick={() => navigate("/app/magic16")}
        title="Magic16"
        aria-label="Open Magic16"
      >
        +
      </button>
    </header>
  );
}
