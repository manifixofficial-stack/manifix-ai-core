import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="gpt-header">
      <h1 className="header-title">ManifiX</h1>

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
