import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="gpt-header">
      <img src={Logo} alt="ManifiX Logo" className="gpt-logo" />
      <h1>ManifiX</h1>

      {/* Magic16 "+" button */}
      <button
        className="magic16-add"
        title="New Magic16 Connection"
        onClick={() => navigate("/app/magic16")}
      >
        ➕
      </button>
    </header>
  );
}
